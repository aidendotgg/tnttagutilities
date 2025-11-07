import { getPlayerStats } from "../tnttagApi/fullStats.js"

export const name = "tstats"
export const aliases = ["tntstats"]
export const allowedSources = ["slash"]
export const description = "Shows player's statistics in TNT Tag."

const colorMap = new Map([
  ["#FF5555", "§c"],
  ["#FFAA00", "§6"],
  ["#55FF55", "§a"],
  ["#FFFF55", "§e"],
  ["#FF55FF", "§d"],
  ["#FFFFFF", "§f"],
  ["#5555FF", "§9"],
  ["#00AA00", "§2"],
  ["#AA0000", "§4"],
  ["#00AAAA", "§3"],
  ["#55FFFF", "§b"],
  ["#AA00AA", "§5"],
  ["#555555", "§8"],
  ["#AAAAAA", "§7"],
  ["#000000", "§0"],
  ["#0000AA", "§1"],
]);

let winsColorMap = new Map([
  [5000, '§0'],
  [2500, '§c'],
  [1500, '§6'],
  [1000, '§5'],
  [500, '§9'],
  [250, '§a'],
  [100, '§2'],
  [50, '§f'],
  [15, '§7'],
  [0, '§8']
])

function formatRank(player) {
  switch (player.rank) {
    case "NONE":
      return `§7${player.username}`
    case "VIP":
      return `§a[VIP] ${player.username}`
    case "VIP_PLUS":
      return `§a[VIP§6+§a] ${player.username}`
    case "MVP":
      return `§b[MVP] ${player.username}`
    case "MVP_PLUS":
      return `§b[MVP${colorMap.get(player.plusColor)}+§b] ${player.username}`
    case "MVP_PLUS_PLUS":
      return `${colorMap.get(player.rankColor)}[MVP${colorMap.get(player.plusColor)}++${colorMap.get(player.rankColor)}] ${player.username}`
    case "YOUTUBER":
      return `§c[§fYOUTUBE§c] ${player.username}`
    case "STAFF":
      return `§c[§6ዞ§c] ${player.username}`
    case "PIG_PLUS_PLUS_PLUS":
      return `§d[PIG§b+++§d] ${player.username}`
    case "INNIT":
      return `§d[INNIT] ${player.username}`
    case "MOJANG":
      return `§6[MOJANG] ${player.username}`
    case "EVENTS":
      return `§6[EVENTS] ${player.username}`
    default:
      return `§7${player.username}`
  }
}

function formatWins(wins) {
  let winString = `[${wins}]`

  if (wins >= 10000) {
    return `§c${winString.charAt(0)}` + `§6${winString.charAt(1)}` + `§e${winString.charAt(2)}` + `§a${winString.charAt(3)}` + `§b${winString.charAt(4)}` + `§d${winString.charAt(5)}` + `§5${winString.charAt(6)}`
  } else {
    for (let [milestone, color] of winsColorMap) {
      if (wins >= milestone) {
        return `${color}${winString}`
      }
    }
  }
}

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
  usageInstance.clientHandler.sendClientMessage(`§cTNTTagUtilities > ${formatWins(playerStats.wins)} ${formatRank(playerStats)}§f's statistics:`)
  usageInstance.clientHandler.sendClientMessage(`§f• Wins: §7${playerStats.wins.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• Kills: §7${playerStats.kills.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• Deaths: §7${playerStats.deaths.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• K/D Ratio: §7${playerStats.kd}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• Tags: §7${playerStats.tags.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• Powerups: §7${playerStats.powerups.toLocaleString()}§f`)
  usageInstance.clientHandler.sendClientMessage(`§f• TNT Hours: §7${playerStats.playtime}`)
  usageInstance.clientHandler.userClient.write("chat", {
    message: JSON.stringify({
      text: '§f• TNTTag.info URL: ',
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
}