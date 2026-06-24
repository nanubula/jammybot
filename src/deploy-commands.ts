import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "./config.ts";

const commands = [
  new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's FFXIV PvP map"),
  new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Show the FFXIV PvP map rotation for the next 8 days"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.token);

try {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands },
  );
  console.log("Successfully registered guild slash commands.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
