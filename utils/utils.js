export function formatTime(ms) {
  //round to milliseconds, no micro or nano
  ms = Math.round(ms)
  //correct units
  let s = Math.floor(ms / 1000)
  let m = Math.floor(s / 60)
  //modulo
  ms = ms % 1000
  s = s % 60
  let paddedMs = ms.toString().padStart(3, "0")
  let paddedS = s.toString().padStart(2, "0")
  let paddedM = m.toString().padStart(2, "0")
  return `${paddedM}:${paddedS}.${paddedMs}`
}

export function removeFormattingCodes(text) {
  return text.replace(/§./g, "")
}

let chars = "abcdefghijklmnopqrstuvwxyz0123456789"
export function randomString(length) {
  let string = ""
  for (let i = 0; i < length; i++) {
    string += chars[Math.floor(Math.random() * chars.length)]
  }
  return string
}

export function random64BitBigInt() {
  // Generate two random 32-bit integers
  let upperInt = Math.floor(Math.random() * 0x80000000);
  let lowerInt = Math.floor(Math.random() * 0x100000000);

  // Combine them into a 64-bit BigInt
  let combinedInt = BigInt(upperInt) << 32n | BigInt(lowerInt);

  // Convert it into a signed 64-bit BigInt
  let isSigned = Math.random() < 0.5
  if (isSigned) {
    combinedInt -= (1n << 63n)
  }

  return combinedInt;
}

export function dynamicSpace(string, lineLength = 60) {
  const stripped = string.replace(/§./g, '');
  const padding = Math.max(0, Math.floor((lineLength - stripped.length)));
  return ' '.repeat(padding) + string;
}

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

export function formatRank(username, rank, plusColor, rankColor) {
  switch (rank) {
    case "NONE":
      return `§7${username}`
    case "VIP":
      return `§a[VIP] ${username}`
    case "VIP_PLUS":
      return `§a[VIP§6+§a] ${username}`
    case "MVP":
      return `§b[MVP] ${username}`
    case "MVP_PLUS":
      return `§b[MVP${colorMap.get(plusColor)}+§b] ${username}`
    case "MVP_PLUS_PLUS":
      return `${colorMap.get(rankColor)}[MVP${colorMap.get(plusColor)}++${colorMap.get(rankColor)}] ${username}`
    case "YOUTUBER":
      return `§c[§fYOUTUBE§c] ${username}`
    case "STAFF":
      return `§c[§6ዞ§c] ${username}`
    case "PIG_PLUS_PLUS_PLUS":
      return `§d[PIG§b+++§d] ${username}`
    case "INNIT":
      return `§d[INNIT] ${username}`
    case "MOJANG":
      return `§6[MOJANG] ${username}`
    case "EVENTS":
      return `§6[EVENTS] ${username}`
    default:
      return `§c${username}`
  }
}

export function formatWins(wins) {
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