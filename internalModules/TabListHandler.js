import { config } from "../config/configHandler.js"
import { getStats } from "../tnttagApi/statsHandler.js"
import { randomString } from "../utils/utils.js"
import { isBlacklisted } from "../data/blacklisted.js"

let enabled = config["fetch-player-stats"]

export class TabListHandler {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.stateHandler = this.clientHandler.stateHandler

    this.teams = new Map()
    this.players = new Map()
    this.teamOverrides = new Map()

    this.entityVisibilityByEID = new Map()
    this.entityVisibilityByUUID = new Map()

    if (enabled) {
      this.bindModifiers()
      this.bindEventListeners()
    }
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name === "teams" || meta.name === "scoreboard_team") {
      return this.handleTeamPacket(data, meta)
    }
  }

  bindEventListeners() {
    this.proxyClient.on("player_info", data => {
      let action = data.action
      for (let playerInfo of data.data) {
        if (action === 4) {
          this.players.delete(playerInfo.UUID) //always uppercase UUID for versions < 761
          if (this.teamOverrides.has(playerInfo.UUID)) {
            this.removeTeamOverride(playerInfo.UUID)
          }
        } else {
          let object
          if (playerInfo.uuid) {
            object = this.players.get(playerInfo.uuid)
          } else {
            object = this.players.get(playerInfo.UUID)
          }
          if (!object) object = {}
          if (playerInfo.player !== undefined) object.player = playerInfo.player
          if (playerInfo.chatSession !== undefined) object.chatSession = playerInfo.chatSession
          if (playerInfo.gamemode !== undefined) object.gamemode = playerInfo.gamemode
          if (playerInfo.uuid !== undefined) object.uuid = playerInfo.uuid
          if (playerInfo.UUID !== undefined) object.uuid = playerInfo.UUID //use lowercase anyways
          if (playerInfo.listed !== undefined) object.listed = playerInfo.listed
          if (playerInfo.latency !== undefined) object.latency = playerInfo.latency
          if (playerInfo.displayName !== undefined) object.displayName = playerInfo.displayName
          if (playerInfo.name !== undefined) object.name = playerInfo.name
          if (playerInfo.properties !== undefined) object.properties = playerInfo.properties
          if (playerInfo.ping !== undefined) object.ping = playerInfo.ping
          if (playerInfo.crypto !== undefined) object.crypto = playerInfo.crypto
          if (playerInfo.ping > 1 || playerInfo.latency > 1) object.hadPing = true

          for (let [existingUuid, existingData] of this.players) {
            if (existingData.name === object.name && existingUuid !== object.uuid) {
              this.players.delete(existingUuid)
            }
          }
          this.players.set(object.uuid, object)
        }
      }
      if (this.stateHandler.state === "game") {
        this.checkPlayerList()
      }
    })
    this.proxyClient.on("player_remove", data => {
      for (let uuid of data.players) {
        this.players.delete(uuid)
        if (this.teamOverrides.has(uuid)) {
          this.removeTeamOverride(uuid)
        }
      }
    })
    this.stateHandler.on("state", state => {
      if (state === "game") {
        this.checkPlayerList()
      } else {
        for (let key of this.teamOverrides.keys()) {
          this.removeTeamOverride(key)
        }
      }
    })
    this.proxyClient.on("named_entity_spawn", data => {
      let obj = {
        uuid: data.playerUUID,
        invisible: false
      }
      this.entityVisibilityByEID.set(data.entityId, obj)
      this.entityVisibilityByUUID.set(data.playerUUID, obj)
    })
    this.proxyClient.on("entity_destroy", data => {
      for (let id of data.entityIds) {
        let thing = this.entityVisibilityByEID.get(id)
        if (thing) {
          if (this.teamOverrides.has(thing.uuid)) this.replaceTeamOverride(thing.uuid)
          this.entityVisibilityByEID.delete(id)
          this.entityVisibilityByUUID.delete(thing.uuid)
        }
      }
    })
    this.proxyClient.on("entity_metadata", data => {
      if (!this.entityVisibilityByEID.has(data.entityId)) return
      let relevantThing = data.metadata.find(obj => obj.key === 0 && obj.type === 0)
      if (!relevantThing) return
      let obj = this.entityVisibilityByEID.get(data.entityId)
      let newState = Boolean(relevantThing.value & 0x20)
      let oldState = obj.invisible

      if (newState !== oldState) {
        obj.invisible = newState
        if (this.teamOverrides.has(obj.uuid)) this.replaceTeamOverride(obj.uuid)
      }
    })
  }

  handleTeamPacket(data, meta) {
    let team = data.team
    let mode = data.mode
    switch (mode) {
      case 0: {
        let object = {}
        if ("name" in data) object.name = data.name
        if ("prefix" in data) object.prefix = data.prefix
        if ("suffix" in data) object.suffix = data.suffix
        if ("friendlyFire" in data) object.friendlyFire = data.friendlyFire
        if ("nameTagVisibility" in data) object.nameTagVisibility = data.nameTagVisibility
        if ("collisionRule" in data) object.collisionRule = data.collisionRule
        if ("color" in data) object.color = data.color
        if ("formatting" in data) object.formatting = data.formatting
        if ("players" in data && data.players) {
          object.players = data.players
        } else {
          object.players = []
        }
        this.teams.set(team, object)
        break
      }
      case 1: {
        let existing = this.teams.get(team)
        this.teams.delete(team)
        if (existing) {
          for (let player of existing.players) {
            let uuid = null
            for (let [key, value] of this.teamOverrides.entries()) {
              if (value.username === player) uuid = key
            }
            if (uuid) {
              this.replaceTeamOverride(uuid)
            }
          }
        }
        break
      }
      case 2: {
        let object = this.teams.get(team)
        if ("name" in data) object.name = data.name
        if ("prefix" in data) object.prefix = data.prefix
        if ("suffix" in data) object.suffix = data.suffix
        if ("friendlyFire" in data) object.friendlyFire = data.friendlyFire
        if ("nameTagVisibility" in data) object.nameTagVisibility = data.nameTagVisibility
        if ("collisionRule" in data) object.collisionRule = data.collisionRule
        if ("color" in data) object.color = data.color
        if ("formatting" in data) object.formatting = data.formatting
        if ("players" in data && data.players) object.players = data.players //should never happen, players only sent in 0, 3, and 4
        for (let player of object.players) {
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
          }
        }
        break
      }
      case 3: {
        let object = this.teams.get(team)
        object.players.push(...data.players)
        let playersToRemove = []
        for (let player of data.players) {
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
            playersToRemove.push(player)
          }
        }
        if (playersToRemove.length) {
          for (let player of playersToRemove) {
            data.players.splice(data.players.indexOf(player), 1)
          }
          return {
            type: "replace",
            meta,
            data
          }
        }
        break
      }
      case 4: {
        let object = this.teams.get(team)
        for (let player of data.players) {
          object.players.splice(object.players.indexOf(player), 1)
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
          }
        }
        break
      }
    }
  }

  getActualPlayers() {
    let players = []
    for (let player of this.players.values()) {
      if (!player.gamemode) continue
      if ("displayName" in player) continue
      if (player.hadPing) continue
      if (player.uuid[14] !== "4") {
        this.nickedPlayer(player.uuid)
        continue
      }
      players.push(player.uuid)
    }
    return players
  }

  checkPlayerList() {
    let list = this.getActualPlayers()
    for (let uuid of list) {
      if (this.teamOverrides.has(uuid)) continue
      (async () => {
        let userData = await getStats(uuid)
        if (!userData) return
        if (this.stateHandler.state !== "game") return
        if (!this.players.has(uuid)) return
        if (this.teamOverrides.has(uuid)) return
        let player = this.players.get(uuid)
        if (!player) return
        let username
        if (player.player) {
          username = player.player.name
        } else {
          username = player.name
        }
        this.addTeamOverride(uuid, username, userData)
      })()
    }
  }

  nickedPlayer(uuid) {
    if (this.stateHandler.state !== "game") return
    if (this.teamOverrides.has(uuid)) return
    let player = this.players.get(uuid)
    if (!player) return
    let username
    if (player.player) {
      username = player.player.name
    } else {
      username = player.name
    }
    if (player.properties !== undefined) {
      const skinData = JSON.parse(Buffer.from(player.properties[0].value, "base64").toString("utf8"))

      if (skinData.profileId === player.uuid.replaceAll("-", "") || a.includes(skinData.profileName)) {
        this.addTeamOverride(uuid, username, { nicked: true, real: "" })
      } else {
        this.addTeamOverride(uuid, username, { nicked: true, real: skinData.profileName })
        this.clientHandler.sendClientMessage(`§cTNTTagUtilities > §c${skinData.profileName} §fis nicked as §c${username}`)
        this.userClient.write("named_sound_effect", {
          soundName: "mob.cat.meow",
          volume: 1,
          pitch: 50,
          x: Math.round(this.stateHandler.currentPosition.x * 8),
          y: Math.round(this.stateHandler.currentPosition.y * 8) + 8,
          z: Math.round(this.stateHandler.currentPosition.z * 8)
        })
      }
    }

  }

  addTeamOverride(uuid, username, data) {
    //not entirely sure why but this happens sometimes - just don't set in that case
    if (username === undefined) return
    let extraText
    if (data.nicked) {
      extraText = '§c [NICKED]'
    } else {
      let wins = data.wins
      let winsColor
      let colors = new Map([
        [10000, "1"],
        [5000, "0"],
        [2500, "c"],
        [1500, "6"],
        [1000, "5"],
        [500, "9"],
        [250, "a"],
        [100, "2"],
        [50, "f"],
        [15, "7"],
        [0, "8"]
      ])
      for (let [key, value] of colors) {
        if (wins >= key) {
          winsColor = value
          break
        }
      }
      extraText = `§${winsColor} [${wins.toString()}]`
    }
    let orderingNums
    let serverTeamValue = null
    for (let [key, value] of this.teams.entries()) {
      if (value.players.includes(username)) {
        orderingNums = key.substring(0, 3)
        serverTeamValue = value
        this.userClient.write("scoreboard_team", {
          team: key,
          mode: 4,
          players: [username]
        })
      }
    }
    let newTeamKey = (orderingNums || "aaa") + username.substring(0, 3) + randomString(10)

    let newSuffix
    if (serverTeamValue?.suffix) {
      newSuffix = serverTeamValue.suffix + extraText
    } else {
      newSuffix = extraText
    }
    let extraPrefixText = ""
    if (isBlacklisted(uuid.replaceAll("-", ""))) {
      extraPrefixText = "§e"
    }
    let newPrefix
    if (serverTeamValue?.prefix) {
      newPrefix = serverTeamValue.prefix + extraPrefixText
    } else {
      newPrefix = extraPrefixText
    }
    this.userClient.write("scoreboard_team", {
      team: newTeamKey,
      mode: 0,
      name: newTeamKey,
      prefix: newPrefix,
      suffix: newSuffix,
      friendlyFire: (serverTeamValue?.friendlyFire === undefined ? 3 : serverTeamValue.friendlyFire),
      nameTagVisibility: (serverTeamValue?.nameTagVisibility === undefined ? (this.entityVisibilityByUUID.get(uuid)?.invisible ? "never" : "always") : serverTeamValue.nameTagVisibility),
      color: (serverTeamValue?.color === undefined ? 15 : serverTeamValue.color),
      players: [username]
    })
    this.teamOverrides.set(uuid, {
      username,
      teamKey: newTeamKey,
      data
    })
  }

  removeTeamOverride(uuid) {
    let existingOverride = this.teamOverrides.get(uuid)
    this.userClient.write("scoreboard_team", {
      team: existingOverride.teamKey,
      mode: 1
    })
    this.teamOverrides.delete(uuid)
  }

  replaceTeamOverride(uuid) { //mmm
    let existingOverride = this.teamOverrides.get(uuid)
    this.removeTeamOverride(uuid)
    this.addTeamOverride(uuid, existingOverride.username, existingOverride.data)
  }

  tryForceUpdate(uuid) {
    let longUUID = `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20, 32)}`
    if (this.teamOverrides.has(longUUID)) this.replaceTeamOverride(longUUID)
  }
}

const a = JSON.parse(Buffer.from("WyJQaWNrZ3VhcmQiLCJNeXN0aWNHYW1lck1hbiIsIlRhY3RmdWwiLCJCbGFzdGVyeWF5YSIsIlNhZmVEcmlmdDQ4IiwidGhlQkxSeHgiLCJIb19Cb3QiLCIyODA3IiwiU3lsZWV4IiwiVmlvbGV0c2t5enoiLCJUaGVfSG9zdGVyX01hbiIsInJvcm9fX18iLCJNSEZfTWluZXNraW4iLCJIb3RhbXBhIiwiRGFubm9CYW5hbm5vWEQiLCIwOEJFRDUiLCJZYU9PUCIsIk1pY3VsZ2FtZXMiLCJNaW5lU2tpbl9vcmciLCJNZWdha2xvb24iLCJBbm9uaW1ZVFQiLCJNYW5nb3dfIiwiRWNob3JyYSIsImltdHJhc2hzb2dvZXoiLCJCb2JpbmhvXyIsIlllbGVoYSIsIkRvdWJsZURlbHRhcyIsIl9KdXN0RG9sdCIsIkh5cGlnc2VsIiwiVGVyb2ZhciIsInNpbGVudGRldHJ1Y3Rpb24iLCJJbUZhdFRCSCIsImdhaWFfbGluayIsIkdvbGRhcGZlbCIsIlNrdWxsQ2xpZW50U2tpbjYiLCJQZWFyc29uSW5tYW4iLCJUaGVJbmRyYSIsIlNlcmlhbGl6YWJsZSIsIkJlZXZlbG9wZXIiLCJSZWFkIiwibHV4ZW1hbiIsIkZlYnJ1YXIwMyIsIkRhbmNpbmdEb2dnb18iLCJfSnVzdERvSXQiLCJEZXRocm9uZXMiLCJEaXNjb3JkQXBwIiwiTWluaURpZ2dlclRlc3QiLCJDb2xieUJlZWVlIiwieW9sb19tYXRpcyIsIkZhbmN5X0x1ZHdpZyIsIkJlZHdhcnNDdXRpZSIsImthcmV0aDk5OSIsImxhbGEyNSIsIkhpZGR1cyIsImZnYWIiLCJzcGlkZXJtYW44MzEiLCJEb2d5Q1pTS18iLCJCdWdnaSIsIlRoYW5rc01vamFuZyIsIkx1Z2kiLCJTaG93dHJvbmljIiwiRmlyZWJ5cmQ4OCIsIlRoM20xcyIsImNvZGVuYW1lX0IiLCJvd29FbmRlciIsIl90b21hdG96XyIsIkxveV9CbG9vZEFuZ2VsIiwiNDE0MTQxNDFoIiwiVG9tcGtpbjQyIiwibGF1cmVuY2lvMzAzIiwidGhlYXBpaXNiYWQiLCJIYWdvcmEiXQ==", "base64").toString("utf8"))