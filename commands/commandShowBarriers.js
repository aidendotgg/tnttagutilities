import { data as store, saveData } from "../data/dataHandler.js"

export const name = "showbarriers"
export const aliases = ["showbarrier", "barriers"]
export const allowedSources = ["slash"]
export const description = "Enable or disable showing of barrier blocks."

export async function run(usageInstance) {
  store.showBarriers = !store.showBarriers

  const enabledText = store.showBarriers ? "§aenabled" : "§cdisabled"
  usageInstance.reply(`§fShowing barrier blocks is now ${enabledText}§f.`)

  saveData()
  usageInstance.clientHandler.visibleBarriers.onShowBarriersToggled(store.showBarriers)
}