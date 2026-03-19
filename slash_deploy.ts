import "dotenv/config";
import { REST, Routes } from "discord.js";
import * as fs from 'fs';
import * as path from "path";

function loadCommands(dir: string): any[] {
  const results: any[] = [];

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const indexTs = path.join(fullPath, "index.ts");
      const indexJs = path.join(fullPath, "index.js");

      let indexPath: string | null = null;

      if (fs.existsSync(indexTs)) {
        indexPath = indexTs;
      } else if (fs.existsSync(indexJs)) {
        indexPath = indexJs;
      }

      if (!indexPath) continue;

      const imported = require(indexPath);
      const real = imported.default ?? imported;

      if (!real.command) continue;

      results.push(real.command.toJSON());
      continue;
    }

    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const imported = require(fullPath);
      const real = imported.default ?? imported;

      if (!real.command) continue;

      results.push(real.command.toJSON());
    }
  }

  return results;
}

const GlobalCmds = loadCommands("./Commands/Global");
const GuildCmds = loadCommands("./Commands/Guild");
const SecretCmds = loadCommands("./Commands/Secret");

const botID = "1468647600747188304";
const serverIDS: (string | undefined)[] = [
  process.env.SERVER_ID
].filter(Boolean); // remove undefined

const botToken: string | undefined = process.env.DISCORD_TOKEN;

let rest: REST;
if (!botToken) {
  console.error("Bot Token is undefined")
} else {
  rest = new REST({ version: "10" }).setToken(botToken);
}

async function slashRegister() {
  try {
    console.log("Registering commands for servers:", serverIDS);

    for (const serverId of serverIDS) {
      let body = GuildCmds;

      if (serverId === process.env.SERVER_ID) {
        body = [...GuildCmds, ...SecretCmds]
      }
      const unique = new Map();

      for (const cmd of body) {
        if (unique.has(cmd.name)) {
          console.warn(`Duplicate command detected: ${cmd.name}`);
          continue;
        }
        unique.set(cmd.name, cmd);
      }

      const finalBody = [...unique.values()];

      console.log("Final commands:", finalBody.map(c => c.name));

      console.log(
        `Registering to ${serverId}:`,
        body.map(cmd => cmd.name)
      );

      if (!serverId) {
        console.error("ServerId is undefined");
      } else {
        await rest.put(Routes.applicationGuildCommands(botID, serverId), { body: finalBody });
      }
    }

    await rest.put(Routes.applicationCommands(botID), { body: GlobalCmds });

    console.log("✅ Slash commands registered successfully!");
  } catch (e) {
    console.error("❌ Error registering commands:", e);
  }
}

slashRegister();