import { commandListString, list as commandList } from "./list.js"
import { data as store, saveData } from "../data/dataHandler.js"

export const name = "showbarriers"
export const aliases = ["showbarrier"]
export const allowedSources = ["console", "slash"]
export const description = "Enable or disable showing of barrier blocks via client-side block_change overlay"

export async function run(usageInstance) {
  store.showBarriers = !store.showBarriers

  const enabledText = store.showBarriers ? "§aenabled" : "§cdisabled"
  usageInstance.reply(`§fShowing barrier blocks is now ${enabledText}§f.`)

  saveData()
  usageInstance.clientHandler.visibleBarriers.onShowBarriersToggled(store.showBarriers)
}