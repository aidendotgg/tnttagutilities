import { commandListString } from "./list.js"

export const name = "help"
export const aliases = []
export const allowedSources = ["slash"]
export const description = "Shows hypixel's and tnttagutilities' commands."
export async function run(usageInstance) {
    usageInstance.clientHandler.sendServerCommand("help")
    setTimeout(() => {
        usageInstance.reply(`§fList of all commands:\n${commandListString(usageInstance.source, usageInstance.prefix)}`)
    }, 100)
}