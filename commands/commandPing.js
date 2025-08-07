import nmpModule from "minecraft-protocol"
const ping = nmpModule.ping

export const name = "ping"
export const aliases = []
export const allowedSources = ["slash"]
export const description = "Measures your ping to Hypixel."
export async function run(usageInstance) {
  let promise = ping({
    host: "mc.hypixel.net"
  })
  let alreadyReplied = false
  promise.then(result => {
    if (alreadyReplied) return
    alreadyReplied = true
    usageInstance.reply(`§fCurrent ping: §c${result.latency}ms`)
  })
  promise.catch(() => {
    if (alreadyReplied) return
    alreadyReplied = true
    usageInstance.reply("§fFailed to ping Hypixel.")
  })
  setTimeout(() => {
    if (alreadyReplied) return
    alreadyReplied = true
    usageInstance.reply("§fFailed to ping Hypixel.")
  }, 1000)
}