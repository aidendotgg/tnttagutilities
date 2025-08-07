import fetch from "node-fetch"

export async function getPlayerStats(identifier) {
  try {
    let response = await fetch("https://api.tnttag.info/user", {
      body: JSON.stringify({
        username: identifier
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
    return json
  } catch (error) {
    console.log("Unexpected full TNT Tag API error:")
    console.log(error)
    return null
  }
}

export async function getPlayerNames(identifier) {
  try {
    let response = await fetch("https://api.tnttag.info/user/names", {
      body: JSON.stringify({
        _id: identifier
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
    return json
  } catch (error) {
    console.log("Unexpected full TNT Tag API error:")
    console.log(error)
    return null
  }
}