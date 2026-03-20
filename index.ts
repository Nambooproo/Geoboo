import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import express from "express";
import * as fs from "fs";
import * as Discord from "discord.js";
import { MongoClient } from "mongodb";
const mongo = new MongoClient(process.env.MONGO_URI as string);

let db: any;

// Create Discord client
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
  ]
});

async function slashCommandHandler(interaction: any) {
  const command = getCommand(interaction.commandName);
  if (!command) return;

  if (!client.cooldowns.has(interaction.commandName)) {
    client.cooldowns.set(interaction.commandName, new Discord.Collection());
  }

  let stamps = client.cooldowns.get(interaction.commandName);
  if (!stamps) {
    stamps = new Discord.Collection();
    client.cooldowns.set(interaction.commandName, stamps);
  }

  const now = Date.now();
  const cd = (command.cooldown || 0) * 1000;

  if (stamps.has(interaction.user.id)) {
    const exp = stamps.get(interaction.user.id)! + cd;
    if (now < exp) {
      return interaction.reply({
        content: `⏱ Wait ${((exp - now) / 1000).toFixed(1)}s`,
        ephemeral: true
      });
    }
  }

  stamps.set(interaction.user.id, now);
  setTimeout(() => stamps.delete(interaction.user.id), cd);
  try { await command.execute(interaction); }
  catch { interaction.reply({ content: "❌ Command failed!", ephemeral: true }).catch(() => {}); }
}
const app = express();
const PORT: number = process.env.PORT ? Number(process.env.PORT) : 3000;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("✅ Hello from Replit backend!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});


// Initialize cooldowns
client.cooldowns = new Discord.Collection<string, Discord.Collection<string, number>>();

// Command loader
function getCommand(cmdName: string) {
  const dirs = ["./Commands/Guild", "./Commands/Global", "./Commands/Secret"];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.split(".")[0] === cmdName) return require(`${dir}/${file}`);
    }
  }
  return null;
}

// Ready event
client.once(Discord.Events.ClientReady, async () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);

  try {
    await mongo.connect();
    db = mongo.db("geoboo");
    (client as any).db = db;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
});

// Interaction handler
client.on(Discord.Events.InteractionCreate, async (interaction: any) => {

  /* AUTOCOMPLETE */
  if (interaction.isAutocomplete()) {
    const cmd = interaction.commandName;
    const sub = interaction.options.getSubcommand(false);
    const group = interaction.options.getSubcommandGroup(false);
    const opt = interaction.options.getFocused(true);
    let out = [];
    try {
      let mod;
      if (!sub && !group) mod = require(`./Autocomplete/${cmd}.js`);
      else if (sub && !group) mod = require(`./Autocomplete/${cmd}/${sub}.js`);
      else mod = require(`./Autocomplete/${cmd}/${group}/${sub}.js`);
      if (mod) out = await mod(opt);
    } catch {}
    return interaction.respond(out);
  }

  if (interaction.isChatInputCommand()) {
    slashCommandHandler(interaction)
  }
});

console.log("Before login");
console.log("TOKEN:", process.env.DISCORD_TOKEN);
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("✅ Login success"))
  .catch(err => console.error("❌ Login failed:", err));

console.log("After login");