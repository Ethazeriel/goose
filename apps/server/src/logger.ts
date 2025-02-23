import fs from 'fs';
import chalk from 'chalk';
import { sanitize } from '@ethgoose/utils/regex';
import { fileURLToPath, URL } from 'url';
const { logLevel }:GooseConfig = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../config/config.json', import.meta.url).toString()), 'utf-8'));
import { ButtonInteraction, CommandInteraction, MessageContextMenuCommandInteraction, GuildMember, MessageInteraction, StringSelectMenuInteraction, ComponentType } from 'discord.js';
import { pino } from 'pino';

export const log = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      colorizeObjects: true,
      singleLine: true
    }
  },
});
log.level = logLevel; // defaults to info

// legacy log levels - INFO, TRACK, FETCH, DATABASE, ERROR


export async function logCommand(interaction:(CommandInteraction | MessageContextMenuCommandInteraction) & {options:any}) {
  // TS - I'm using a bunch of things that don't exist in discord.js types, so have to include the any
  // takes an interaction, logs relevant details to file and console
  // for console
  let conStr = `Guild: ${chalk.blue(interaction.guildId ? (interaction.member as GuildMember).guild.name.replace(sanitize, '').trim() : 'DM')}, User: ${chalk.blue(`${interaction.user.username.replace(sanitize, '').trim()}#${interaction.user.discriminator}`)}, Command: ${chalk.cyan(interaction.commandName)}`;
  if (interaction.options._subcommand) {
    conStr = conStr.concat(`, Subcommand: ${chalk.green(interaction.options._subcommand)}`);
  }
  if (interaction.options._hoistedOptions.length) {
    conStr = conStr.concat(', Options: ');
    for (const option of interaction.options._hoistedOptions) {
      if (option.type == 'STRING') { // We're only using strings and integers right now, so this is fine - if we start using more option types later consider revising
        conStr = conStr.concat(`${chalk.green(option.name)} - ${chalk.green(option.value?.replace(sanitize, '')?.trim())}, `);
      } else { conStr = conStr.concat(`${chalk.green(option.name)} - ${chalk.green(option.value)}, `); }
    }
  }
  log.info(conStr);
}

export async function logComponent(interaction:ButtonInteraction | StringSelectMenuInteraction) {
  // takes an interaction, logs relevant details to file and console
  // for console
  let conStr = `Guild: ${chalk.blue((interaction.member as GuildMember).guild.name.replace(sanitize, '').trim())}, User: ${chalk.blue(`${interaction.user.username.replace(sanitize, '').trim()}#${interaction.user.discriminator}`)}, Source: ${chalk.cyan((interaction.message.interaction as MessageInteraction)?.commandName || 'component')}, Type: ${chalk.cyan(interaction.componentType)}, ID: ${chalk.cyan(interaction.customId)}`;
  if (interaction.componentType == ComponentType.StringSelect) {
    conStr = conStr.concat(', Values: ');
    interaction.values.forEach((element:string) => {
      conStr = conStr.concat(element);
    });
  }
  log.info(conStr);
}