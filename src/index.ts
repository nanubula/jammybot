import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { config } from "./config.ts";
import { buildTodayText } from "./commands/today.ts";
import { buildScheduleText } from "./commands/schedule.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const now = new Date();
    if (interaction.commandName === "today") {
      await interaction.reply(buildTodayText(now));
    } else if (interaction.commandName === "schedule") {
      await interaction.reply(buildScheduleText(now));
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Something went wrong fetching the map.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(config.token);
