// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { embedPage } from '@ethgoose/utils/regex';
import Player from '../../player.js';
import { log } from '../../logger.js';
import { ButtonInteraction, InteractionDeferUpdateOptions, InteractionEditReplyOptions } from 'discord.js';

export const name = 'queue';

export async function execute(interaction:ButtonInteraction, which:string) {
  (which === 'showmedia') ? await interaction.deferReply({ ephemeral: true }) : await interaction.deferUpdate({ ephemeral: true } as InteractionDeferUpdateOptions);
  const { player, message } = await Player.getPlayer(interaction);
  if (player) {
    if (player.getQueue().length) {
      const match = interaction.message.embeds[0]?.fields?.[1]?.value.match(embedPage);
      let page = (match) ? Number(match[1]) : undefined;
      switch (which) {
        case 'refresh': {
          const queueEmbed = await player.queueEmbed(undefined, page, false);
          interaction.message = await interaction.editReply(queueEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'queue', queueEmbed);
          break;
        }

        case 'prev': {
          const queueEmbed = await player.queueEmbed(undefined, --(page as number), false);
          interaction.message = await interaction.editReply(queueEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'queue', queueEmbed);
          break;
        }

        case 'home': {
          page = Math.ceil((player.getPlayhead() + 1) / 10);
          const queueEmbed = await player.queueEmbed(undefined, page, false);
          interaction.message = await interaction.editReply(queueEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'queue', queueEmbed);
          break;
        }

        case 'next': {
          const queueEmbed = await player.queueEmbed(undefined, ++(page as number), false);
          interaction.message = await interaction.editReply(queueEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'queue', queueEmbed);
          break;
        }

        case 'loop': {
          if (player.getCurrent()) {
            await player.toggleLoop();
            const queueEmbed = await player.queueEmbed(undefined, page, false);
            await Promise.all([player.register(interaction, 'queue', queueEmbed), player.sync(interaction, 'queue', queueEmbed)]);
          } else {
            await player.toggleLoop();
            const mediaEmbed = await player.mediaEmbed(false);
            const queueEmbed = await player.queueEmbed(undefined, page, false);
            await Promise.all([player.register(interaction, 'queue', queueEmbed), player.sync(interaction, 'media', queueEmbed, mediaEmbed)]);
          }
          break;
        }

        case 'shuffle': {
          if (player.getCurrent()) {
            player.shuffle();
            const queueEmbed = await player.queueEmbed(undefined, page, false);
            await Promise.all([player.register(interaction, 'queue', queueEmbed), player.sync(interaction, 'queue', queueEmbed)]);
          } else {
            player.shuffle();
            const mediaEmbed = await player.mediaEmbed(false);
            const queueEmbed = await player.queueEmbed(undefined, 1, false);
            await Promise.all([player.register(interaction, 'queue', queueEmbed), player.sync(interaction, 'media', queueEmbed, mediaEmbed)]);
          }
          break;
        }

        case 'showmedia': {
          const mediaEmbed = await player.mediaEmbed();
          interaction.message = await interaction.editReply(mediaEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'media', mediaEmbed);
          break;
        }

        default: log.debug(`queue buttons—bad case: ${which}`); return;
      }
    } else { player.decommission(interaction, 'queue', await player.queueEmbed(undefined, undefined, false), 'Queue is empty.'); }
  } else { interaction.editReply({ embeds: [{ color: 0xfc1303, title: message, thumbnail: { url: 'attachment://art.jpg' } }], components: [] }); }
}