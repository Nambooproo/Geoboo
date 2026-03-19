import "dotenv/config"
import express from "express";
import * as Discord from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
console.log("STARTING BOT...");
console.log("TOKEN:", process.env.DISCORD_TOKEN);
const app = express();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent
  ]
});

app.get("/", (_, res) => {
  res.send("Bot is Alive");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

client.once(Discord.Events.ClientReady, () => {
  console.log("✅ Bot is ONLINE");
});

client.on(Discord.Events.MessageCreate, async (message) => {
  if (message.content === "ping") {
    await message.reply("pong");
  }
});

client.login(TOKEN).catch(console.error);