import { persistentFetch } from "../utils/persistentFetch.js"

class IdentifierHandler {
  constructor() {
    this.cachedPairs = []
  }

  async getUUID(identifier) {
    let info = await this.getInfo(identifier)
    return info ? info.uuid : null
  }

  async getName(identifier) {
    let info = await this.getInfo(identifier)
    return info ? info.name : null
  }

  async getInfo(identifier) {
    let normalized = normalize(identifier)
    if (normalized === null) return null
    if (normalized.type === "uuid") {
      let searchResult = this.cachedPairs.find(pair => pair.uuid === normalized.value)
      if (searchResult) {
        return searchResult
      }
      let profileInfo
      try {
        profileInfo = await lookupFromUUID(normalized.value)
      } catch (error) {
        throw new Error("Unable to lookup identifier")
      }
      if (!profileInfo) return null
      return this.addToCache(profileInfo)
    } else {
      let searchResult = this.cachedPairs.find(pair => pair.lower === normalized.value)
      if (searchResult) {
        return searchResult
      }
      let profileInfo
      try {
        profileInfo = await lookupFromName(normalized.value)
      } catch (error) {
        throw new Error("Unable to lookup identifier")
      }
      if (!profileInfo) return null
      return this.addToCache(profileInfo)
    }
  }

  addToCache(profileInfo) {
    let found = this.cachedPairs.find(pair => pair.uuid === profileInfo.uuid)
    if (found) return found
    let now = performance.now()
    let object = {
      uuid: profileInfo.uuid,
      name: profileInfo.name,
      lower: profileInfo.name.toLowerCase(),
      time: now
    }
    this.cachedPairs.push(object)
    while (now - this.cachedPairs[0]?.time > 300000) {
      this.cachedPairs.shift()
    }
    return object
  }
}

async function lookupFromName(name) {
  let response = await persistentFetch("https://playerdb.co/api/player/minecraft/" + name)
  if (response.status === 204) {
    return null
  }
  let json = await response.json()
  if (json.errorMessage) console.log("Unexpected Mojang API error:\nnameToUUID\n" + JSON.stringify(json))
  return {
    uuid: json.data.player.raw_id,
    name: json.data.player.username
  }
}

async function lookupFromUUID(uuid) {
  let response = await persistentFetch("https://sessionserver.mojang.com/session/minecraft/profile/" + uuid)
  if (response.status === 400) {
    return null
  }
  let json = await response.json()
  if (json.errorMessage) console.log("Unexpected Mojang API error:\nUUIDToName\n" + JSON.stringify(json))
  let name = json.name
  return {
    uuid: uuid,
    name: name
  }
}

function normalize(identifier) {
  if (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(identifier)) {
    return {
      type: "uuid",
      value: identifier.toLowerCase().replaceAll("-", "")
    }
  }
  if (/^[0-9a-fA-F]{32}$/.test(identifier)) {
    return {
      type: "uuid",
      value: identifier.toLowerCase()
    }
  }
  if (/^[a-zA-Z0-9_]{1,16}$/.test(identifier)) {
    return {
      type: "name",
      value: identifier.toLowerCase()
    }
  }
  return null
}

const identifierHandler = new IdentifierHandler()

export async function getUUID(identifier) {
  return identifierHandler.getUUID(identifier)
}

export async function getName(identifier) {
  return identifierHandler.getName(identifier)
}

export async function getInfo(identifier) {
  return identifierHandler.getInfo(identifier)
}