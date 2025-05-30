// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { embedPage } from '@ethgoose/utils/regex';
import Workspace from '../../workspace.js';
import { ButtonInteraction, GuildMember, InteractionDeferUpdateOptions, InteractionEditReplyOptions, InteractionReplyOptions } from 'discord.js';

export const name = 'list';

export async function execute(interaction:ButtonInteraction, which:string):Promise<void> {
  await interaction.deferUpdate({ ephemeral: true } as InteractionDeferUpdateOptions);
  const workspace = Workspace.getWorkspace((interaction.member as GuildMember).user.id);
  let match = interaction.message.embeds[0].fields?.[0]?.value?.match(embedPage);
  if (!match) { match = ['0', '1']; }
  const currentPage = Number(match[1]);
  let reply:string | InteractionReplyOptions = 'uhoh';
  switch (which) {
    case 'prev': reply = await workspace.makeEmbed('Current Playlist:', (currentPage - 1), false); break;
    case 'refresh': reply = await workspace.makeEmbed('Current Playlist:', currentPage, false); break;
    case 'next': reply = await workspace.makeEmbed('Current Playlist:', (currentPage + 1), false); break;
    default: reply = 'everything is fucked'; break;
  }
  await interaction.editReply(reply as InteractionEditReplyOptions);
}