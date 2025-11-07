import { isBlacklisted, addToBlacklisted, removeFromBlacklisted, getBlacklistedList } from "../data/blacklisted.js"
import { getName, getInfo } from "../mojangApi/identifierHandler.js"

export const name = "blacklist"
export const aliases = ["blacklisted"]
export const allowedSources = ["slash"]
export const description = "Allows you to add or remove users from a blacklist. Blacklisted users will have a yellow nametag in game."
export async function run(usageInstance) {
  if (usageInstance.args.length === 0) {
    usageInstance.reply(`§fUsage: /blacklist add/remove <user>`)
    return
  }
  if (usageInstance.args[0] === "add") {
    if (usageInstance.args.length < 2) {
      usageInstance.reply(`§fYou must specify a user.`)
      return
    }
    let user = usageInstance.args[1]
    let info
    try {
      info = await getInfo(user)
    } catch (error) {
      usageInstance.reply(`§fUnable to fetch Mojang API data. Try again in a second.`)
      return
    }
    if (isBlacklisted(info.uuid)) {
      usageInstance.reply(`§c${info.name} §fis already blacklisted.`)
      return
    }
    addToBlacklisted(info.uuid)
    usageInstance.clientHandler.tabListHandler.tryForceUpdate(info.uuid)
    usageInstance.reply(`§c${info.name} §fis now blacklisted.`)
  } else if (usageInstance.args[0] === "remove") {
    if (usageInstance.args.length < 2) {
      usageInstance.reply(`§fYou must specify a user.`)
      return
    }
    let user = usageInstance.args[1]
    let info
    try {
      info = await getInfo(user)
    } catch (error) {
      usageInstance.reply(`§fUnable to fetch Mojang API data. Try again in a second.`)
      return
    }
    if (!isBlacklisted(info.uuid)) {
      usageInstance.reply(`§c${info.name} §fis not blacklisted.`)
      return
    }
    removeFromBlacklisted(info.uuid)
    usageInstance.clientHandler.tabListHandler.tryForceUpdate(info.uuid)
    usageInstance.reply(`§c${info.name} §fis no longer blacklisted.`)
  }
}