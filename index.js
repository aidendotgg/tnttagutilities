process.on("unhandledRejection", (reason, promise) => {
  console.log("--- An error occurred ---")
  console.error(reason)
  console.log("--- An error occurred ---")
})

process.on("uncaughtException", (error, origin) => {
  if (error.code !== "CUSTOM_NOLOG") {
    console.log("--- An exception occurred ---")
    console.error(error)
    console.log("--- An exception occurred ---")
  }
  try {
    rl.close()
    proxy.destroy()
  } catch (error) {
    
  }
  //keep process alive so the window doesn't close if this is being ran in the .exe
  setInterval(() => {}, 999999999)
})

import "./hideWarning.js"
import { Proxy } from "./Proxy.js"
import { handleCommand } from "./commands/handler.js"
import readline from "readline"

if (process.stopExecution) {
  //something in the imports had an error, so don't start the proxy
  let errorThrowing = new Error()
  errorThrowing.code = "CUSTOM_NOLOG"
  throw errorThrowing
}

console.log("Starting proxy...")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on("line", handleLine)
rl.on("SIGINT", handleSigint)
function handleLine(line) {
  let isCommand = handleCommand(null, line, null, "console", proxy)
  if (!isCommand) console.log("Unknown command. Do \"help\" for a list of commands.")
}
async function handleSigint() {
  if (process.argv.includes("--dev")) {
    rl.close()
    process.exit()
  }
}

const proxy = new Proxy()