import { getPlayerNames } from "../tnttagApi/fullStats.js"
import { getInfo } from "../mojangApi/identifierHandler.js"

export const name = "names"
export const aliases = []
export const allowedSources = ["slash"]
export const description = "Shows player's name history."
export async function run(usageInstance) {
    let username
    if (usageInstance.argsString !== "") {
        username = usageInstance.argsString
    } else {
        username = usageInstance.clientHandler.userClient.username
    }
    let info
    try {
        info = await getInfo(username)
    } catch (error) {
        usageInstance.reply(`§fPlayer not found.`)
        return
    }
    let playerNames = await getPlayerNames(info.uuid)
    if (!playerNames) {
        usageInstance.reply(`§fError fetching name history.`)
        return
    }
    let reversedNames = playerNames.names.reverse()
    usageInstance.reply(`§c${info.name}§f's name history:`)
    for (let i = 0; i < playerNames.names.length; i++) {
        usageInstance.clientHandler.sendClientMessage(`§c${i + 1}: §f${reversedNames[i].name} §7(${i + 1 === playerNames.names.length ? "First Name": reversedNames[i].changedToAt ? new Date(reversedNames[i].changedToAt).toLocaleDateString() : new Date(reversedNames[i].changedToAt_latest).toLocaleDateString()})`)
    }
}