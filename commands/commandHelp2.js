import { commandListString, list as commandList } from "./list.js"

export const name = "commands"
export const aliases = ["cmds", "cmdinfo"]
export const allowedSources = ["slash"] //specifically for slash commands, does not include "help" or "h"
export const description = "View the list of commands or help for a specific command"
export async function run(usageInstance) {
  if (usageInstance.argsString !== "") {
    //requesting info about a command
    let lowercase = usageInstance.argsString.toLowerCase()
    let command = commandList.find(c => c.allowedSources.includes(usageInstance.source) && (c.name === lowercase || c.aliases.includes(lowercase)))
    if (!command) {
      usageInstance.reply("§fThat command doesn't exist.")
      return
    }
    usageInstance.reply(`§c${command.name}§f: Requires trust: §c${command.requireTrust ? "yes" : "no"}${command.aliases.length > 0 ? `§f, Aliases: §c${command.aliases.join(", ")}` : ""}§f, Description: §c${command.description}`)
    return
  }
  usageInstance.reply(`§fCommands: §c${commandListString(usageInstance.source, usageInstance.prefix)}`)
}