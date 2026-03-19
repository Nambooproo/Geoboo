export {};
import { Collection } from "discord.js";
import { Db } from "mongodb";

declare module "discord.js" {
  interface Client {
    cooldowns: Collection<string, Collection<string, number>>;
    db?: Db;
  }
}