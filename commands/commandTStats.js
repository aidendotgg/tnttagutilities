import { getPlayerStats } from "../tnttagApi/fullStats.js"
import { formatRank, formatWins, dynamicSpace } from "../utils/utils.js"

export const name = "tstats"
export const aliases = ["tntstats"]
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
    usageInstance.reply(`§fPlayer not found.`)
    return
  }

  let titleString = `${formatWins(playerStats.wins)} ${formatRank(username, playerStats.rank, playerStats.plusColor, playerStats.rankColor)}§f's statistics`

  usageInstance.clientHandler.sendClientMessage(`§c§m-----------------------------------------------------`)
  usageInstance.clientHandler.sendClientMessage(dynamicSpace(titleString))
  usageInstance.clientHandler.sendClientMessage(` §fWins: §7${playerStats.wins.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fKills: §7${playerStats.kills.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fDeaths: §7${playerStats.deaths.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fK/D Ratio: §7${playerStats.kd}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fTags: §7${playerStats.tags.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fPowerups: §7${playerStats.powerups.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(` §fTNT Hours: §7${playerStats.playtime}`)
  usageInstance.clientHandler.userClient.write("chat", {
    message: JSON.stringify({
      text: ' §fTNTTag.info URL: ',
      extra: [
        {
          text: `[Click Here]`,
          color: 'red',
          bold: true,
          clickEvent: { action: 'open_url', value: `https://tnttag.info/p/${playerStats._id}` },
          hoverEvent: { action: 'show_text', value: { text: 'View full player stats', color: 'red' } }
        }
      ]
    }),
    position: 0
  })
  usageInstance.clientHandler.sendClientMessage(`§c§m-----------------------------------------------------`)
}