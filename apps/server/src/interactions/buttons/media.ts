// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import Player from '../../player.js';
import { log } from '../../logger.js';
import { InteractionDeferUpdateOptions, ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';

export const name = 'media';

export async function execute(interaction:ButtonInteraction, which:string):Promise<void> {
  (which === 'showqueue') ? await interaction.deferReply({ ephemeral: true }) : await interaction.deferUpdate({ ephemeral: true } as InteractionDeferUpdateOptions);

  const { player, message } = await Player.getPlayer(interaction);
  if (player) {
    if (player.getQueue().length) {
      switch (which) {
        case 'refresh': {
          const mediaEmbed = await player.mediaEmbed(false);
          interaction.message = await interaction.editReply(mediaEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'media', mediaEmbed);
          break;
        }

        case 'prev': {
          player.prev();
          const mediaEmbed = await player.mediaEmbed(false);
          const queueEmbed = await player.queueEmbed(undefined, undefined, false);
          await Promise.all([player.register(interaction, 'media', mediaEmbed), player.sync(interaction, 'media', queueEmbed, mediaEmbed)]);
          break;
        }

        case 'pause': {
          if (player.getCurrent()) {
            player.togglePause();
          } else { player.jump(0); }
          const mediaEmbed = await player.mediaEmbed(false);
          const queueEmbed = await player.queueEmbed(undefined, undefined, false);
          await player.register(interaction, 'media', mediaEmbed);
          player.sync(interaction, 'media', queueEmbed, mediaEmbed);
          break;
        }

        case 'next': {
          if (player.getCurrent()) {
            player.next();
          } else { player.jump(0); }
          const mediaEmbed = await player.mediaEmbed(false);
          const queueEmbed = await player.queueEmbed(undefined, undefined, false);
          await Promise.all([player.register(interaction, 'media', mediaEmbed), player.sync(interaction, 'media', queueEmbed, mediaEmbed)]);
          break;
        }

        case 'showqueue': {
          const queueEmbed = await player.queueEmbed(undefined, undefined, true);
          interaction.message = await interaction.editReply(queueEmbed as InteractionEditReplyOptions);
          player.register(interaction, 'queue', queueEmbed);
          break;
        }

        default: log.debug(`media buttons—bad case: ${which}`); return;
      }
    } else { await player.decommission(interaction, 'media', await player.mediaEmbed(false), 'Queue is empty.'); }
  } else { interaction.editReply({ embeds: [{ color: 0xfc1303, title: message, thumbnail: { url: 'attachment://art.jpg' } }], components: [] }); }
}