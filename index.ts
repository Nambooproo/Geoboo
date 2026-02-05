import "dotenv/config"
import express from "express";
import * as Discord from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
const app = express();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
  Discord.GatewayIntentBits.MessageContent
  ]
});

app.use(express.json());

app.get("/", (_, res) => {
  res.send("Bot is Alive");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("bot is running!");
});

client.on(Discord.Events.MessageCreate, async (message: Discord.Message) => {
  if (message.content === "ping") {
    await message.reply("pong");
  }
});

try {
  client.login(TOKEN);
} catch (err) {
  console.error(err);
}
