export class ZombieDetector {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.stateHandler = this.clientHandler.stateHandler

    this.zombieEntities = new Array()

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name === "entity_metadata") {
      if (this.stateHandler.state !== "game") return
      for (const entry of data.metadata) {
        const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/
        if (entry.type === 4 && entry.key === 2 && usernameRegex.test(entry.value)) {
          if (this.zombieEntities.includes(data.entityId)) return
          this.zombieEntities.push(data.entityId)
          this.clientHandler.sendClientMessage(`§cTNTTagUtilities > §c${entry.value} §fhas turned into a zombie`)
          this.userClient.write("named_sound_effect", {
            soundName: "mob.zombie.hurt",
            volume: 1,
            pitch: 30,
            x: Math.round(this.stateHandler.currentPosition.x * 8),
            y: Math.round(this.stateHandler.currentPosition.y * 8) + 8,
            z: Math.round(this.stateHandler.currentPosition.z * 8)
          })
        }
      }
    }
  }

  bindEventListeners() {
    this.stateHandler.on("state", state => {
      if (state !== "game") {
        this.zombieEntities = []
      }
    })
  }
}