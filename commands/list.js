export let list = []
export function commandListString() {
  return list.filter(c => c.allowedSources.includes('slash')).map(c => `§f/${c.name}`).join("\n")
}

import * as commandHelp from "./commandHelp.js"
list.push(commandHelp)
import * as commandBlacklist from "./commandBlacklist.js"
list.push(commandBlacklist)
import * as commandExit from "./commandExit.js"
list.push(commandExit)
import * as commandNames from "./commandNames.js"
list.push(commandNames)
import * as commandPing from "./commandPing.js"
list.push(commandPing)
import * as commandTStats from "./commandTStats.js"
list.push(commandTStats)
import * as commandShowBarriers from "./commandShowBarriers.js"
list.push(commandShowBarriers)