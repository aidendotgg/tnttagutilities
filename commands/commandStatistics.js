import { getPlayerStats } from "../tnttagApi/fullStats.js"

export const name = "statistics"
export const aliases = ["tnttagstats", "tstats"]
export const allowedSources = ["slash"]
export const description = "Shows player's statistics in TNT Tag."
export async function run(usageInstance) {
  let username
  if (usageInstance.argsString !== "") {
    username = usageInstance.argsString
  } else {
    username = usageInstance.clientHandler.userClient.username
  }
  let playerStats = await getPlayerStats(username)
  if (!playerStats) {
    return "§fPlayer not found."
  }
  username = playerStats.username
  let message = `§cTNTTagUtilities > §c${username}§f's statistics: `
  message += `§fWins: §a${playerStats.wins.toLocaleString()}§f, `
  message += `§fKills: §a${playerStats.kills.toLocaleString()}§f, `
  message += `§fDeaths: §a${playerStats.deaths.toLocaleString()}§f, `
  message += `§fK/D §fRatio: §a${playerStats.kd}§f, `
  message += `§fTags: §a${playerStats.tags.toLocaleString()}§f, `
  message += `§fPowerups: §a${playerStats.powerups.toLocaleString()}§f, `
  message += `§fTNT §fCoins: §a${playerStats.coins.toLocaleString()}§f, `
  message += `§fTNT §fHours: §a${playerStats.playtime}`
  usageInstance.clientHandler.sendClientMessage(message)
}