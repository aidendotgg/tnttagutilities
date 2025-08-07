# TNT Tag Utilities
This is a script that's like a mod for TNT Tag, adding a couple helpful features, but instead of going into your mods folder it acts as a proxy. This means you'll join a local server with this running, and it will sit between your Minecraft client and Hypixel.

If you need support DM @skrrrtt on discord

*I commissioned someone to make this mod as I do not have a good understanding of minecraft protocol. I was given permission to open source it by the person who made it.*

## How to use the script from binary (executable)
- Download and run the binary for your operating system from the [releases](https://github.com/ignSKRRRTT/tnttagutilities/releases) tab
- You will be prompted to login with microsoft. Once logged in the proxy will redirect you to hypixel and you will be able to use the mod! If you are unsure as to why you need to login then read [this](https://github.com/ignSKRRRTT/tnttagutilities?tab=readme-ov-file#why-do-i-need-to-login)
- To stop the program, type `exit` in the command prompt, or close the window.

## How to run and use the script from source

- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer (First click the green Code button near the top center, then click Download ZIP, and unzip the folder.)
- Open Windows Powershell or a similar command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Aiden/Desktop/tnttagutilities`
- Run `npm install` to download this project's dependencies
- Run `npm start` to start this
- You will be prompted to login with microsoft. Once logged in the proxy will redirect you to hypixel and you will be able to use the mod!
- To stop the program, type `exit` in the command prompt, or close the window.

**Most of these steps you will only have to do once. Further uses will just require you to cd to the app in powershell or CMD and run `npm start`**

## Features
- Displays player's wins on player list and name tags.
- Displays a "NICKED" status next to a player's name if they are nicked
- Displays explosion timer and alive players above hotbar where "Run away!" would usually be.
- Displays explosion timer and alive players on bossbar. (can be moved with lunar client)
  + *Custom bossbar is off by default due to the buggy nature of it and will have to be turned on in the config if you want it. Due to how bossbars work in 1.8 a hidden wither has to be spawned and flicking fast can make the wither particles show. If you turn off potion particles and smoke animation you will not see any wither particles. There is another unavoidable issue that happens even in hypixel's bossbar where it will freeze if you look into a thick wall.*
- Plays a counting down tick sound for the last 5 seconds of the round.
- Makes the timer number a decimal and count client side for more accuracy.
- Boldens the speed and slowness message in chat to make it stand out more.
- Plays a high pitch jukebox sound when you get speed 3 and a low pitch jukebox sound when you give slowness 1 to someone.
- Plays an ender dragon hit sound when you throw someone back with the repulsor powerup.
- `/tstats <optional user>` shows you someone's TNT Tag stats, or your own.
- `/names <optional user>` shows you someone's name history, or your own.
- `/blacklist add/remove <user>` adds user to a blacklist and gives them a yellow colored name on the player list and on their nametag so you can spot players you want to avoid.

## Images
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/5eccig1n.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/ifje5ttx.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/64ygnmvf.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/pr6kuhn7.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/5cvkof4v.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/kt87r2yf.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/sir52wob.png" />
<img src="https://r2.e-z.host/2082d908-7c65-4fc3-b02a-5f50f9141543/97ixi8hg.png" />

## FAQ

### Why do I need to login?
Minecraft's protocol is encrypted to help keep everyone secure. When you join a server like Hypixel, your client, Hypixel, and Mojang all agree to an encryption scheme. Nothing between you and Hypixel will be able to read what's being sent or modify it because of that encryption. In order for this proxy to work, it has to sit between you and Hypixel, and it has to decrypt and re-encrypt everything being sent. In order to re-encrypt everything going out to Hypixel, this needs to login to Hypixel. It can't do that unless you give it access.

Your login information is not sent to anything except Mojang/Microsoft. If you don't trust this code and can't review it yourself, don't run it.

### What versions does this support?
This only supports 1.8
