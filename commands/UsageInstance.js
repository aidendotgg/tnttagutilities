import { removeFormattingCodes } from "../utils/utils.js"
import { list as commandList } from "./list.js"

export class UsageInstance {
  constructor(clientHandler, string, uuid, source, proxy) {
    this.clientHandler = clientHandler
    this.fullString = string
    this.runnerUUID = uuid
    this.source = source
    this.proxy = proxy
  }

  handle() {
    if (this.source === "slash") {
      this.prefix = "/"
    } else if (this.source === "console") {
      this.prefix = ""
    }
    this.fullStringTrim = this.fullString.trim()
    this.fullStringSplit = this.fullStringTrim.split(" ")
    this.commandBase = this.fullStringSplit[0].toLowerCase()
    this.args = this.fullStringSplit.slice(1)
    this.argsString = this.args.join(" ")
    let command = commandList.find(c => c.allowedSources.includes(this.source) && (c.name === this.commandBase || c.aliases.includes(this.commandBase)))
    this.command = command
    if (!command) return false
    this.runAsync()
    return true
  }

  async runAsync() {
    this.running = true
    try {
      await this.command.run(this)
    } catch (error) {
      console.log("--- An exception occurred ---")
      console.error(error)
      console.log("--- An exception occurred ---")
      this.reply("§cAn error occured while running that command, check the console window for more information.")
    }
    this.running = false
  }

  reply(text) {
    if (this.source === "slash") {
      if (this.clientHandler.destroyed) return
      this.clientHandler.sendClientMessage({
        text: `§c[TNT] > §r${text}`
      })
    } else if (this.source === "console") {
      //TODO: translate to ANSI color codes for console
      text = removeFormattingCodes(text)
      console.log(text)
    }
  }
}