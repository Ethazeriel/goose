// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import fs from 'fs';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import { log } from './logger.js';
import { fileURLToPath, URL } from 'url';
const { client_id, guildId, token, scope }:GooseConfig['discord'] = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../config/config.json', import.meta.url).toString()), 'utf-8')).discord;
const commands:object[] = [];
const commandFiles = fs.readdirSync(fileURLToPath(new URL('./interactions/commands', import.meta.url).toString()), 'utf-8').filter(file => file.endsWith('.js'));
const contextFiles = fs.readdirSync(fileURLToPath(new URL('./interactions/contexts', import.meta.url).toString()), 'utf-8').filter(file => file.endsWith('.js'));

const deploylog = log.child({ module: 'deploy' });
export async function deploy() {
  deploylog.info(`Deploying commands to ${scope} scope`);
  for (const file of commandFiles) {
    const command = await import(`./interactions/commands/${file}`);
    commands.push(command.data.toJSON());
  }
  for (const file of contextFiles) {
    const command = await import(`./interactions/contexts/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    if (scope === 'guild') {
      await rest.put(
        Routes.applicationGuildCommands(client_id, guildId),
        { body: commands },
      );
      deploylog.info('Successfully registered commands.');
    } else if (scope === 'global') {
      await rest.put(
        Routes.applicationCommands(client_id),
        { body: commands },
      );
      deploylog.info('Successfully registered commands.');
    } else {
      deploylog.error('Failed to deploy commands');
    }

  } catch (error) {
    console.error(error);
  }

}