import fetch from "node-fetch"

let cache = new Map()
let cacheTimes = new Map()
let queue = []

export function getStats(uuid) {
  if (cache.has(uuid)) {
    if (performance.now() - cacheTimes.get(uuid) > 36e5) {
      //if it's too old, re-fetch user data
      cache.delete(uuid)
      cacheTimes.delete(uuid)
    } else {
      return cache.get(uuid)
    }
  }
  
  let promise = new Promise(resolve => {
    queue.push({
      uuid,
      resolve
    })
    if (queue.length === 1) {
      setTimeout(doFetch, 1000)
    }
  })
  cache.set(uuid, promise)
  return promise
}

async function doFetch() {
  let currentQueue = queue
  queue = []
  let uuidsToFetch = currentQueue.map(item => item.uuid)
  let resultMap = await fetchPlayers(uuidsToFetch)
  let now = performance.now()
  for (let uuid of uuidsToFetch) {
    cacheTimes.set(uuid, now)
  }
  if (resultMap === null) { //error of some sort
    for (let item of currentQueue) {
      cache.set(item.uuid, null)
      item.resolve(null)
    }
    return
  }
  for (let item of currentQueue) {
    let uuid = item.uuid
    let value = resultMap.get(uuid)
    cache.set(uuid, value)
    item.resolve(value)
  }
}

async function fetchPlayers(uuids) {
  try {
    let response = await fetch("https://api.tnttag.info/user/multiple", {
      body: JSON.stringify({
        _id: uuids
      }),
      method: "POST",
      headers: {
        "User-Agent": "TNTTagUtilities",
        "Content-Type": "application/json"
      }
    })
    let json = await response.json()
    if (json.error) {
      throw new Error(JSON.stringify(json))
    }
    let users = new Map()
    json.users.forEach(user => {
      if (user.wins === null) {
        console.log("NULL USER", user.uuid)
        users.set(user.uuid, null)
        return
      }
      users.set(user.uuid, {
        wins: user.wins,
        tag: user.tag,
        rank: user.rank,
        plusColor: user.plusColor,
        rankColor: user.rankColor
      })
    })
    return users
  } catch (error) {
    console.log("Unexpected TNT Tag API error:")
    console.log(error)
    return null
  }
}