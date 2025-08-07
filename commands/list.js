export let list = []
export function commandListString(source, prefix) {
  let commands = list.filter(c => c.allowedSources.includes(source))
  commands = commands.sort((a, b) => a.name.localeCompare(b.name))
  return commands.map(c => prefix + c.name).join(", ")
}

import * as commandHelp from "./commandHelp.js"
list.push(commandHelp)
import * as commandHelp2 from "./commandHelp2.js"
list.push(commandHelp2)
import * as commandBlacklist from "./commandBlacklist.js"
list.push(commandBlacklist)
import * as commandExit from "./commandExit.js"
list.push(commandExit)
import * as commandPing from "./commandPing.js"
list.push(commandPing)
import * as commandStatistics from "./commandStatistics.js"
list.push(commandStatistics)
import * as commandNames from "./commandNames.js"
list.push(commandNames)