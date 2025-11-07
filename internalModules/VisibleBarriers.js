import EventEmitter from "events"
import createRegistry from "prismarine-registry"
import createChunk from "prismarine-chunk"
import Vec3 from "vec3"
import { data as store } from "../data/dataHandler.js"

const PAINT_TICK_MS = 50
const GLOBAL_BUDGET_PER_TICK = 2000
const PER_CHUNK_BUDGET_PER_TICK = 512
const FIRST_PAINT_DELAY_MS = 80
const TOGGLE_PAINT_DELAY_MS = 20

const GLASS_META = 4

export class VisibleBarriers {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    this.clientHandler.visibleBarriers = this
    this.overlayCache = new Map()
    this.paintQueue = new Map()
    this.paintLoop = null
    this.bindEventListeners()
    this.bindModifiers()
    this._ensurePaintLoop()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  bindEventListeners() {
    const flushSoon = () => this._makeAllReadyNow()
    this.userClient?.on?.("position", flushSoon)
  }

  _ensurePaintLoop() {
    if (this.paintLoop) return
    this.paintLoop = setInterval(() => this._drainPaintQueue(), PAINT_TICK_MS)
  }

  _overlayKey(cx, cz) { return `${cx},${cz}` }
  _getXZ(obj) {
    const x = obj?.x ?? obj?.chunkX ?? obj?.columnX ?? obj?.cx ?? obj?.chunk_x
    const z = obj?.z ?? obj?.chunkZ ?? obj?.columnZ ?? obj?.cz ?? obj?.chunk_z
    return { cx: x, cz: z }
  }
  _getBitmap(obj) { return (obj?.bitMap ?? obj?.primaryBitMap ?? 0) >>> 0 }
  _getGroundUp(obj) { return !!(obj?.groundUp ?? obj?.groundUpContinuous) }
  _getChunkBuffer(obj) { return obj?.chunkData ?? obj?.data ?? obj?.buffer }

  _encodeLegacyType(blockId, meta = 0) {
    return ((blockId & 0xFFF) << 4) | (meta & 0xF)
  }

  _sendBlockChange(pos, typeInt) {
    try {
      this.userClient?.write?.("block_change", { location: pos, type: typeInt })
    } catch { }
  }

  _queuePaint(key, wantType, positions, delayMs) {
    if (!positions?.length) return
    const now = Date.now()
    let q = this.paintQueue.get(key)
    if (!q || q.wantType !== wantType) {
      q = { wantType, posSet: new Set(), readyAt: now + delayMs }
      this.paintQueue.set(key, q)
    } else if (q.posSet.size === 0) {
      q.readyAt = now + delayMs
    }
    for (const p of positions) q.posSet.add(`${p.x},${p.y},${p.z}`)
  }

  _makeAllReadyNow() {
    const now = Date.now()
    for (const q of this.paintQueue.values()) {
      if (q.posSet.size === 0) continue
      q.readyAt = Math.min(q.readyAt, now)
    }
  }

  _drainPaintQueue() {
    const now = Date.now()
    let globalBudget = GLOBAL_BUDGET_PER_TICK
    for (const [key, q] of this.paintQueue.entries()) {
      if (globalBudget <= 0) break
      if (q.posSet.size === 0) { this.paintQueue.delete(key); continue }
      if (q.readyAt > now) continue
      let perChunk = Math.min(PER_CHUNK_BUDGET_PER_TICK, globalBudget)
      while (perChunk > 0 && q.posSet.size > 0) {
        const it = q.posSet.values().next()
        if (it.done) break
        const coord = it.value
        q.posSet.delete(coord)
        const [x, y, z] = coord.split(",").map(n => parseInt(n, 10))
        this._sendBlockChange({ x, y, z }, q.wantType)
        perChunk--
        globalBudget--
        if (globalBudget <= 0) break
      }
      if (q.posSet.size === 0) this.paintQueue.delete(key)
    }
  }

  _ingestChunk(rawBuffer, metaLike, registry, ChunkColumn) {
    if (!rawBuffer || !Buffer.isBuffer(rawBuffer)) return
    const { cx, cz } = this._getXZ(metaLike)
    if (!Number.isInteger(cx) || !Number.isInteger(cz)) return
    const bitMap = this._getBitmap(metaLike)
    const groundUp = this._getGroundUp(metaLike)
    if (rawBuffer.length === 0 || (bitMap === 0 && rawBuffer.length <= 256)) {
      const key = this._overlayKey(cx, cz)
      this.overlayCache.delete(key)
      this.paintQueue.delete(key)
      return
    }
    const barrierId = registry.blocksByName.barrier.id
    const stainedGlassId = registry.blocksByName.stained_glass.id
    const barrierType = this._encodeLegacyType(barrierId, 0)
    const glassType = this._encodeLegacyType(stainedGlassId, GLASS_META)

    const column = new ChunkColumn()
    column.load(rawBuffer, bitMap, true, groundUp)

    const sections = column.sections || []
    const minY = column.minY ?? 0
    const positions = []
    for (let s = 0; s < sections.length; s++) {
      if (((bitMap >>> s) & 1) === 0) continue
      const section = sections[s]
      if (!section) continue
      for (let xx = 0; xx < 16; xx++) {
        for (let yy = 0; yy < 16; yy++) {
          for (let zz = 0; zz < 16; zz++) {
            const id = section.getBlockType(new Vec3(xx, yy, zz))
            if (id === barrierId) {
              positions.push({ x: cx * 16 + xx, y: minY + s * 16 + yy, z: cz * 16 + zz })
            }
          }
        }
      }
    }

    const key = this._overlayKey(cx, cz)
    this.overlayCache.set(key, { positions, glassType, barrierType })
    if (store.showBarriers && positions.length > 0) {
      this._queuePaint(key, glassType, positions, FIRST_PAINT_DELAY_MS)
    }
  }

  onShowBarriersToggled(enabled) {
    for (const [key, entry] of this.overlayCache.entries()) {
      const { positions, barrierType, glassType } = entry
      if (!positions?.length) continue
      const wantType = enabled ? glassType : barrierType
      this._queuePaint(key, wantType, positions, TOGGLE_PAINT_DELAY_MS)
    }
    this._makeAllReadyNow()
  }

  handleIncomingPacket(data, meta) {
    try {
      if (meta?.name !== "map_chunk" && meta?.name !== "map_chunk_bulk") return
      const registry = createRegistry("1.8.9")
      const ChunkColumn = createChunk(registry)
      if (meta.name === "map_chunk") {
        const rawBuffer = this._getChunkBuffer(data)
        this._ingestChunk(rawBuffer, data, registry, ChunkColumn)
        return
      }
      if (meta.name === "map_chunk_bulk") {
        const cols = Array.isArray(data.columns) ? data.columns : (Array.isArray(data.chunks) ? data.chunks : null)
        if (!cols) return
        for (const col of cols) {
          const rawBuffer = this._getChunkBuffer(col)
          this._ingestChunk(rawBuffer, col, registry, ChunkColumn)
        }
        return
      }
    } catch { }
  }
}