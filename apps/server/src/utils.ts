// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { AttachmentBuilder, ChatInputCommandInteraction, InteractionEditReplyOptions } from 'discord.js';
import { log } from './logger.js';
// import Canvas from 'canvas';
import { Jimp } from 'jimp';
import * as db from './database.js';
import type { IArtist, IArtistList } from 'musicbrainz-api';
import { pickPride, chooseAudioSource } from '@ethgoose/utils';

export async function prideSticker(interaction:ChatInputCommandInteraction, type:'heart' | 'dab' | 'fish'):Promise<void> {
  const size = {
    heart:{ width:160, height:160 },
    dab:{ width:160, height:100 },
    fish:{ width:160, height:160 },
  };
  const prideChoice = interaction.options.getString('type');
  let result;
  if (prideChoice == 'random') {
    result = pickPride(type, true);
  } else {
    result = {
      url:`https://ethazeriel.net/pride/sprites/${type}_${prideChoice}.png`,
      name:prideChoice,
    };
  }
  const prideimg = await Jimp.read(result.url);
  prideimg.resize({ w: size[type].width, h: size[type].height });
  // mime type is a bit hacky, but have to reconcile what d.js expects with what jimp provides somehow
  const attachment = new AttachmentBuilder(await prideimg.getBuffer(prideimg.mime as 'image/png'), { name:`${type}_${result.name}.png`, description:`${result.name} ${type}` });
  // console.log(attachment.description);
  await interaction.reply({ files: [attachment] });

}

// =================================
//               EMBEDS
// =================================

export async function generateTrackEmbed(track:Track, messagetitle:string):Promise<InteractionEditReplyOptions> {
  const albumart = new AttachmentBuilder((track.goose.track.art), { name:'art.jpg' });
  const npEmbed = {
    color: 0x580087,
    author: {
      name: '\u200b',
      icon_url: pickPride('fish'),
    },
    fields: [
      { name: messagetitle, value: `${(track.goose.artist.name || ' ')} - [${(track.goose.track.name)}](${chooseAudioSource(track).url })\nAlbum - ${track.goose.album.name || '\u200b'}` },
    ],
    thumbnail: {
      url: 'attachment://art.jpg',
    },
  };
  return { embeds: [npEmbed], files: [albumart] } as InteractionEditReplyOptions;
}

export async function mbArtistLookup(artist:string):Promise<string | undefined> { // TODO: rework entirely
  // check for Artist.official in db before sending lookup
  const track = await db.getTrack({ $and:[{ 'goose.artist.official':{ $type:'string' } }, { 'goose.artist.name':artist }] });
  if (track) { return track.goose.artist.official; } else {
    const axData1:null | Response = await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(artist)}&limit=1&offset=0&fmt=json`, { headers:{ 'User-Agent':'Goose-Bot/1.0.0' } }).catch(error => {
      log.error(`MB artist lookup fail - code: ${error.code}`); // axios legacy? still useful?
      return (null);
    });
    if (axData1 && axData1.ok) { // should consider logging the response code if not ok
      const firstdata = (await (axData1.json() as Promise<IArtistList>));
      if (firstdata?.artists?.length) {
        const mbid = firstdata.artists[0].id;
        const axData2:null | Response = await fetch(`https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`, { headers:{ 'User-Agent':'Goose-Bot/1.0.0' } }).catch(error => {
          // log.error({ err:error }, `MB artist lookup fail - headers: ${JSON.stringify(error.response?.headers, null, 2)}`);
          log.error(`MB artist lookup fail - code: ${error.code}`);
          return (null);
        });
        if (axData2 && axData2.ok) {
          const data = (await (axData2.json() as Promise<IArtist>));
          if (data?.relations?.length) {
            let result = null;
            for (const link of data.relations) { // return the official site first
              if (link.type === 'official homepage') {
                result = link.url?.resource;
                return result;
              }
            }
            for (const link of data.relations) { // if no official site, return bandcamp
              if (link.type === 'bandcamp') {
                result = link.url?.resource;
                return result;
              }
            }
            for (const link of data.relations) { // if no bandcamp, return last.fm and hope they have better links
              if (link.type === 'last.fm') {
                result = link.url?.resource;
                return result;
              }
            }
          }
        }
      }
    }
  }
}