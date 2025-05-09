// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { SlashCommandBuilder } from '@discordjs/builders';
import Player from '../../player.js';
import * as utils from '@ethgoose/utils';
import { log } from '../../logger.js';
import * as database from '../../database.js';
import { sanitize, sanitizePlaylists } from '@ethgoose/utils/regex';
import fetch from '../../acquire.js';
import Workspace from '../../workspace.js';
import validator from 'validator';
import fs from 'fs';
import type { ChatInputCommandInteraction, GuildMemberRoleManager, InteractionReplyOptions } from 'discord.js';
import { fileURLToPath, URL } from 'url';
const { discord }:GooseConfig = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../../config/config.json', import.meta.url).toString()), 'utf-8'));
const roles = discord.roles;

export const data = new SlashCommandBuilder()
  .setName('playlist')
  .setDescription('functions related to internal playlists')
  .addSubcommand(subcommand => subcommand
    .setName('show')
    .setDescription('Prints the current working playlist')
    .addIntegerOption(option =>
      option.setName('page').setDescription('Page to show').setRequired(false)))
  .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('remove a track from the current working playlist')
    .addIntegerOption(option =>
      option.setName('index').setDescription('index to remove').setRequired(true)))
  .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('adds something to the current working playlist')
    .addStringOption(option =>
      option.setName('track').setDescription('What to add (youtube url, spotify url, text search)').setRequired(true))
    .addIntegerOption(option =>
      option.setName('index').setDescription('where to start add operation at (1-indexed). Defaults to end of playlist').setRequired(false)))
  .addSubcommand(subcommand => subcommand
    .setName('empty')
    .setDescription('Empties the current working playlist'))
  .addSubcommand(subcommand => subcommand
    .setName('save')
    .setDescription('Saves the current working playlist')
    .addStringOption(option =>
      option.setName('playlist').setDescription('Name to save this playlist as').setRequired(true)))
  .addSubcommand(subcommand => subcommand
    .setName('copy')
    .setDescription('copies the currently playing queue into the playlist workspace'))
  .addSubcommand(subcommand => subcommand
    .setName('load')
    .setDescription('loads a playlist from the database')
    .addStringOption(option =>
      option.setName('playlist').setDescription('Name of the list to load').setRequired(true)))
  .addSubcommand(subcommand => subcommand
    .setName('move')
    .setDescription('moves a track from one index to another')
    .addIntegerOption(option =>
      option.setName('from-index').setDescription('Index to move from').setRequired(true))
    .addIntegerOption(option =>
      option.setName('to-index').setDescription('Index to move to').setRequired(true)))
  .addSubcommand(subcommand => subcommand
    .setName('play')
    .setDescription('appends everything from the current workspace to the live queue'))
  .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('lists all internal playlists'));


export async function execute(interaction: ChatInputCommandInteraction) {

  if ((interaction.member?.roles as GuildMemberRoleManager)?.cache?.some(role => role.name === roles.dj)) {
    await interaction.deferReply({ ephemeral: true });
    const workspace = Workspace.getWorkspace(interaction.member!.user.id);
    switch (interaction.options.getSubcommand()) {

      case 'show': {
        const page = Math.abs(interaction.options.getInteger('page')!) || 1;
        const message = await workspace.makeEmbed('Current Playlist:', page);
        await interaction.followUp(message as InteractionReplyOptions);
        break;
      }

      case 'remove': {
        workspace.removeTrack(Math.abs(interaction.options.getInteger('index')! - 1));
        await interaction.followUp(`Removed item ${Math.abs(interaction.options.getInteger('index')!)} from the playlist.`);
        break;
      }

      case 'add': {
        let tracks = null;
        const search = interaction.options.getString('track')?.replace(sanitize, '').trim() || '';
        const input = Math.abs(interaction.options.getInteger('index') ?? workspace.list.length);
        let index;
        if (input > workspace.list.length) {index = workspace.list.length;} else {
          index = input;
          if (index && (index != workspace.list.length)) {index--;}
        }// check if our index is non-zero and not the length of our songlist

        tracks = await fetch(search, interaction.id);
        if (!tracks) {
          await interaction.followUp({ content: `No result for '${search}'. Either be more specific or directly link a spotify/youtube resource.`, ephemeral: true });
        }
        if (tracks && tracks.length > 0) {
          workspace.addTracks(tracks, index);
          const message = await workspace.makeEmbed('Added: ', (Math.ceil(index / 10) || 1));
          await interaction.followUp(message);
        }
        break;
      }

      case 'empty': {
        workspace.emptyList();
        await interaction.followUp({ content:'Emptied playlist.', ephemeral: true });
        break;
      }

      case 'save': {
        const listname = validator.escape(validator.stripLow(interaction.options.getString('playlist')?.replace(sanitizePlaylists, '') || '')).trim();
        const result = await database.addPlaylist(workspace.list, listname);
        if (result) {
          interaction.followUp({ content:result, ephemeral: true });
        } else {
          interaction.followUp({ content:`Saved ${listname} to the database.`, ephemeral: true });
        }
        break;
      }

      case 'copy': {
        workspace.importQueue(interaction);
        break;
      }

      case 'load': {
        const listname = validator.escape(validator.stripLow(interaction.options.getString('playlist')?.replace(sanitizePlaylists, '') || '')).trim();
        const result = await database.getPlaylist(listname);
        workspace.addTracks(result, (workspace.list.length));
        interaction.followUp({ content:`Loaded playlist \`${listname}\` from the database: \`${result.length}\` items.`, ephemeral: true });
        break;
      }

      case 'move': {
        const fromindex = Math.abs(interaction.options.getInteger('from-index')! - 1);
        const toindex = Math.abs(interaction.options.getInteger('to-index')! - 1);
        const result = workspace.moveTrack(fromindex, toindex);
        interaction.followUp({ content:`Moved track ${result[0].goose.track.name} from index ${fromindex} to index ${toindex}.`, ephemeral: true });
        break;
      }

      case 'play': {
        if (workspace.list.length) {
          const { player, message } = await Player.getPlayer(interaction);
          if (player) {
            const mediaSync = player.getCurrent() === undefined; // to handle empty, ended queues
            const length = await player.queueLast(workspace.list);
            const mediaEmbed = mediaSync ? await player.mediaEmbed() : undefined;
            const queueEmbed = await player.queueEmbed(mediaSync ? 'Playing now:' : 'Queued:', (Math.ceil((length - (workspace.list.length - 1)) / 10) || 1));
            await player.register(interaction, 'queue', queueEmbed);
            player.sync(interaction, mediaSync ? 'media' : 'queue', queueEmbed, mediaEmbed);
          } else { interaction.editReply({ content: message }); }
        } else { await interaction.editReply('Your workspace is empty.'); }
        break;
      }

      case 'list': {
        const lists = await database.listPlaylists();
        let listStr = '```';
        for (const list of lists!) {
          const part = '\n' + list;
          listStr = listStr.concat(part);
        }
        listStr = listStr.concat('```');
        const listEmbed = {
          color: 0x3277a8,
          author: { name: '\u200b', icon_url: utils.pickPride('fish') },
          thumbnail: { url: utils.pickPride('dab') },
          fields: [{ name: 'Playlists:', value: listStr }],
        };
        try {
          await interaction.followUp({ embeds: [listEmbed] } as InteractionReplyOptions);
        } catch (error:any) {
          log.error(error.stack);
        }
        break;
      }
      default: {
        log.error('discord: hit playlist default case, what');
        await interaction.followUp({ content:'Something broke. Please try again', ephemeral: true });
      }

    }
  } else { await interaction.reply({ content:'You don\'t have permission to do that.', ephemeral: true });}
}