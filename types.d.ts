import "discord.js";
import { Db } from "mongodb";

declare module "discord.js" {
  interface Client {
    cooldowns: import("discord.js").Collection<string, import("discord.js").Collection<string, number>>;
    db?: Db;
  }
}