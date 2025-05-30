// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { StringSelectMenuInteraction } from 'discord.js';
import { helpEmbed } from '../commands/help.js';

export const name = 'help';

export async function execute(interaction:StringSelectMenuInteraction) { // dropdown selection function
  const choice = interaction.values[0];
  const result = helpEmbed(choice);
  await interaction.update(result);
}