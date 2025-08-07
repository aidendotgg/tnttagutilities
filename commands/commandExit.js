import { saveData } from "../data/dataHandler.js"

export const name = "exit"
export const aliases = ["quit", "end", "q"]
export const allowedSources = ["console"]
export const description = "Ends the proxy process"
export async function run(usageInstance) {
  usageInstance.reply("§fExiting...")
  await saveData()
  process.exit()
}