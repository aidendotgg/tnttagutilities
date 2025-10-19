import EventEmitter from "events"
import { config } from "../config/configHandler.js"

let bossbarEnabled = config["bossbar-timer"]

export class AccurateTimer extends EventEmitter {
  constructor(clientHandler) {
    super()

    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler

    this.playersAlive = 32
    //stores a list of the last couple predicted explosion times based on when the scoreboard was updated. used for running average
    this.timerRecords = []
    //stores the running average of when the explosion is expected to actually happen
    this.explosionTime = 0
    this.explosionTimerInterval = null
    this.lastExplosionTimerValue = null
    this.explosionPingCompleted = 6
    this.afterRoundTime = 0
    this.setAfterRoundTime = false
    this.timerScoreboardTeam = null

    this.lastDistanceTime = -10000
    this.lastDistance = null

    this.witherSpawned = false

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacketForActionBar.bind(this))
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacketForScoreboard.bind(this))
  }

  handleIncomingPacketForActionBar(data, meta) {
    if (meta.name !== "chat") return
    if (data.position !== 2) return
    if (this.stateHandler.state !== "game") return
    if (data.message.startsWith(`{"text":"§7Distance: §a§l`)) {
      this.lastDistanceTime = performance.now()
      this.lastDistance = parseInt(data.message.substring(25, data.message.length - 4))
    }
    return {
      type: "cancel"
    }
  }

  handleIncomingPacketForScoreboard(data, meta) {
    if (meta.name !== "scoreboard_team") return
    if (this.stateHandler.state !== "game") return

    let needsCancel = false

    //find if player dies and explosion timer moves to team_6
    checks: {
      if (this.timerScoreboardTeam !== data.team) break checks
      if (data.mode !== 2) break checks
      //can't change unless explosion timer is already started
      if (this.explosionTime === null) break checks
      if (data.prefix === "§eExplosion in ") break checks
      //team has changed
      this.timerScoreboardTeam = null
    }
    //record explosion timer from scoreboard
    checks: {
      if (data.prefix !== "§eExplosion in ") break checks
      if (!data.suffix || data.suffix.length < 4) break checks

      needsCancel = true

      this.timerScoreboardTeam = data.team

      let explosionTime = parseInt(data.suffix.substring(2, data.suffix.length - 1))
      if (isNaN(explosionTime)) break checks
      //do not care about duplicate ones
      if (explosionTime === this.lastExplosionTimerValue) break checks

      if (this.lastExplosionTimerValue === null || this.lastExplosionTimerValue === 0) {
        if (this.lastExplosionTimerValue === null) {
          this.emit("gameStart")
        }
        //is new timer
        this.timerRecords = []
        this.explosionPingCompleted = 6
      }

      this.lastExplosionTimerValue = explosionTime
      this.timerRecords.push(performance.now() + (explosionTime * 1000 - 250))
      if (this.timerRecords.length > 10) this.timerRecords.shift()

      //set explosionTime to running average of timer records
      this.explosionTime = 0
      for (let time of this.timerRecords) {
        this.explosionTime += time
      }
      this.explosionTime /= this.timerRecords.length
    }
    checks: {
      if (!data.prefix) break checks
      if (!data.prefix.startsWith("Alive: §a")) break checks
      let thingy = data.prefix.substring(9)
      thingy = thingy.substring(0, thingy.indexOf(" "))
      thingy = parseInt(thingy)
      this.playersAlive = thingy
    }
    if (needsCancel) return {
      type: "cancel"
    }
  }

  bindEventListeners() {
    this.stateHandler.on("none", () => {
      if (this.explosionTimerInterval) {
        clearInterval(this.explosionTimerInterval)
        this.explosionTimerInterval = null
      }
      if (this.witherSpawned) {
        this.despawnWither()
      }
    })
    this.stateHandler.on("game", () => {
      this.playersAlive = 32
      this.explosionTime = null
      this.timerRecords = []
      this.lastExplosionTimerValue = null
      this.explosionPingCompleted = 6
      this.afterRoundTime = 0
      this.timerScoreboardTeam = null

      this.explosionTimerInterval = setInterval(() => {
        if (this.explosionTime === null) return
        this.displayTimer()
      }, 5)
    })
    this.on("gameStart", () => {
      if (bossbarEnabled) this.spawnWither()
    })
    this.stateHandler.on("posUpdate", () => {
      if (this.witherSpawned) this.moveWither()
    })
  }

  displayTimer() {
    let timeRemaining = this.explosionTime - performance.now()
    let afterRoundTimeRemaining = this.afterRoundTime - performance.now()

    let formattedTime = formatExplosionTime(timeRemaining)
    let formattedAfterTime = formatExplosionTime(afterRoundTimeRemaining)
    let formattedMessage

    if (timeRemaining < 0 && !this.setAfterRoundTime) {
      this.setAfterRoundTime = true
      this.afterRoundTime = performance.now() + 10500
    }
    if (this.setAfterRoundTime) {
      formattedMessage = `§eNext Round in ${formattedAfterTime} §f⎜ §a${this.playersAlive} §eplayers alive`
    }
    if (timeRemaining >= 0) {
      this.setAfterRoundTime = false
      this.afterRoundTime = 0
      formattedMessage = `§eExplosion in ${formattedTime} §f⎜ §a${this.playersAlive} §eplayers alive`
    }
    if (performance.now() - this.lastDistanceTime < 1500) {
      formattedMessage += ` §f⎜ §eDistance: §a${this.lastDistance}m`
    }

    if (this.explosionPingCompleted - 1 >= timeRemaining / 1000 && this.explosionPingCompleted > 1) {
      this.explosionPingCompleted--
      this.userClient.write("named_sound_effect", {
        soundName: "note.hat",
        volume: 1,
        pitch: [31, 35, 39, 44, 50][this.explosionPingCompleted - 1],
        x: Math.round(this.stateHandler.currentPosition.x * 8),
        y: Math.round(this.stateHandler.currentPosition.y * 8) + 8,
        z: Math.round(this.stateHandler.currentPosition.z * 8)
      })
    }

    this.clientHandler.sendClientActionBar({
      text: formattedMessage
    })
    if (this.timerScoreboardTeam) {
      if (timeRemaining < 0) {
        this.userClient.write("scoreboard_team", {
          team: this.timerScoreboardTeam,
          mode: 2,
          name: this.timerScoreboardTeam,
          prefix: '§eNext Round in ',
          suffix: '§c' + formattedAfterTime,
          friendlyFire: 3,
          nameTagVisibility: 'always',
          color: 15
        })
      } else {
        this.userClient.write("scoreboard_team", {
          team: this.timerScoreboardTeam,
          mode: 2,
          name: this.timerScoreboardTeam,
          prefix: '§eExplosion in ',
          suffix: '§c' + formattedTime,
          friendlyFire: 3,
          nameTagVisibility: 'always',
          color: 15
        })
      }
    }
    if (this.witherSpawned) this.renameWither(formattedMessage)
  }

  spawnWither() {
    this.witherSpawned = true
    for (let i = 0; i < 3; i++) this.userClient.write("spawn_entity_living", {
      entityId: -69420 - i,
      type: 64,
      x: 0,
      y: -1000000,
      z: 0,
      yaw: 0,
      pitch: 0,
      headPitch: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      metadata: [
        //invulnerable time
        { type: 2, key: 20, value: 1000 },
        //name
        { type: 4, key: 2, value: "" },
        //invisibility
        { type: 0, key: 0, value: 32 },
        //head facings
        { type: 2, key: 17, value: 0 },
        { type: 2, key: 18, value: 0 },
        { type: 2, key: 19, value: 0 },
        //always show nametag
        { type: 0, key: 3, value: 1 },
        //health
        { type: 3, key: 6, value: 300 },
      ]
    })
  }
  renameWither(name) {
    for (let i = 0; i < 3; i++) this.userClient.write("entity_metadata", {
      entityId: -69420 - i,
      metadata: [
        { type: 4, key: 2, value: name },
      ]
    })
  }
  moveWither() {
    let x = this.stateHandler.currentPosition.x
    let y = this.stateHandler.currentPosition.y
    let z = this.stateHandler.currentPosition.z

    let pitchRad = toRadians(-this.stateHandler.currentPosition.pitch)
    let yawRad = toRadians(this.stateHandler.currentPosition.yaw + 90)

    let directionVectorX = Math.cos(pitchRad) * Math.cos(yawRad)
    let directionVectorY = Math.sin(pitchRad)
    let directionVectorZ = Math.cos(pitchRad) * Math.sin(yawRad)

    x += directionVectorX * 33
    y += directionVectorY * 33
    z += directionVectorZ * 33

    this.userClient.write("entity_teleport", {
      entityId: -69420,
      x: Math.round(x * 32),
      y: Math.round(y * 32),
      z: Math.round(z * 32),
      pitch: 0,
      yaw: 0,
      onGround: false
    })

    //other two withers on the sides
    {
      let x = this.stateHandler.currentPosition.x
      let y = this.stateHandler.currentPosition.y
      let z = this.stateHandler.currentPosition.z

      let pitchRad = toRadians(-this.stateHandler.currentPosition.pitch * 0.3)
      let yawRad = toRadians(this.stateHandler.currentPosition.yaw + 25)

      let directionVectorX = Math.cos(pitchRad) * Math.cos(yawRad)
      let directionVectorY = Math.sin(pitchRad)
      let directionVectorZ = Math.cos(pitchRad) * Math.sin(yawRad)

      x += directionVectorX * 33
      y += directionVectorY * 33
      z += directionVectorZ * 33

      this.userClient.write("entity_teleport", {
        entityId: -69421,
        x: Math.round(x * 32),
        y: Math.round(y * 32),
        z: Math.round(z * 32),
        pitch: 0,
        yaw: 0,
        onGround: false
      })
    }
    {
      let x = this.stateHandler.currentPosition.x
      let y = this.stateHandler.currentPosition.y
      let z = this.stateHandler.currentPosition.z

      let pitchRad = toRadians(-this.stateHandler.currentPosition.pitch * 0.3)
      let yawRad = toRadians(this.stateHandler.currentPosition.yaw + 155)

      let directionVectorX = Math.cos(pitchRad) * Math.cos(yawRad)
      let directionVectorY = Math.sin(pitchRad)
      let directionVectorZ = Math.cos(pitchRad) * Math.sin(yawRad)

      x += directionVectorX * 33
      y += directionVectorY * 33
      z += directionVectorZ * 33

      this.userClient.write("entity_teleport", {
        entityId: -69422,
        x: Math.round(x * 32),
        y: Math.round(y * 32),
        z: Math.round(z * 32),
        pitch: 0,
        yaw: 0,
        onGround: false
      })
    }
  }
  despawnWither() {
    this.witherSpawned = false
    this.userClient.write("entity_destroy", {
      entityIds: [-69420, -69421, -69422]
    })
  }
}

function formatExplosionTime(timeRemaining) {
  if (timeRemaining < 0) timeRemaining = 0
  timeRemaining = (timeRemaining / 1000).toFixed(1)
  let timeInt = parseInt(timeRemaining)
  let colorCode
  if (timeInt < 5) {
    colorCode = "c"
  } else if (timeInt < 15) {
    colorCode = "6"
  } else {
    colorCode = "a"
  }
  return `§${colorCode}${timeRemaining}`
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}