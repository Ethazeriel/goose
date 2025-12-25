// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { log } from '../../logger.js';
import ytdl from 'ytdl-core';
const { youtube }:GooseConfig = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../../config/config.json', import.meta.url).toString()), 'utf-8'));

async function fromId(id:string):Promise<TrackYoutubeSource> {
  log.info(`youtubeFromId: ${id}`);
  const ytdlResult = await ytdl.getBasicInfo(id, { requestOptions: { family:4 } });
  const source:TrackYoutubeSource = {
    id: id,
    name: ytdlResult.videoDetails.title,
    art: ytdlResult.videoDetails.thumbnails[0].url,
    duration: Number(ytdlResult.videoDetails.lengthSeconds),
    url: `https://youtu.be/${id}`,
    contentID: (ytdlResult.videoDetails.media?.song) ? {
      name: ytdlResult.videoDetails.media.song,
      artist: ytdlResult.videoDetails.media.artist!,
    } : undefined,
  };
  return source;
}

async function fromSearch(search:string):Promise<Array<TrackYoutubeSource>> {
  log.info(`youtubeFromSearch: ${search}`);
  const youtubeResultStream:Response = await fetch(`https://youtube.googleapis.com/youtube/v3/search?q=${search}&type=video&part=id%2Csnippet&fields%3Ditems%28id%2FvideoId%2Csnippet%28title%2Cthumbnails%29%29&maxResults=5&safeSearch=none&key=${youtube.apiKey}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    signal: AbortSignal.timeout(10000),
  });
  const youtubeResults = (await (youtubeResultStream.json() as Promise<YoutubeSearchResponse>)).items;
  const ytPromiseArray:Array<Promise<TrackYoutubeSource>> = [];
  for (const item of youtubeResults) {
    const ytSource = fromId(item.id.videoId);
    ytPromiseArray.push(ytSource);
  }
  const ytArray:Array<TrackYoutubeSource> = [];
  await Promise.allSettled(ytPromiseArray).then(promises => {
    for (const promise of promises) {
      if (promise.status === 'fulfilled') { ytArray.push(promise.value); }
      if (promise.status === 'rejected') { log.error({ err:promise }, 'ytdl promise rejected:');}
    }
  });
  return ytArray;
}

async function fromPlaylist(id:string):Promise<Array<TrackYoutubeSource>> {
  log.info(`youtubeFromSearch: ${id}`);
  let pageToken = undefined;
  const youtubeResults:Array<YoutubePlaylistItem> = [];
  do {
    const youtubeResultStream:Response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?playlistId=${id}&part=snippet%2CcontentDetails&maxResults=50&key=${youtube.apiKey}${pageToken ? '&pageToken=' + pageToken : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(10000),
    });
    const ytResult = (await (youtubeResultStream.json() as Promise<YoutubePlaylistResponse>));
    pageToken = ytResult.nextPageToken;
    youtubeResults.push(...ytResult.items);
  } while (pageToken);
  log.trace(`Retrieved ${youtubeResults.length} tracks. Running ytdl...`);
  const ytPromiseArray:Array<Promise<TrackYoutubeSource>> = [];
  for (const item of youtubeResults) {
    const ytSource = fromId(item.contentDetails.videoId);
    ytPromiseArray.push(ytSource);
  }
  const ytArray:Array<TrackYoutubeSource> = [];
  await Promise.allSettled(ytPromiseArray).then(promises => {
    for (const promise of promises) {
      if (promise.status === 'fulfilled') { ytArray.push(promise.value); }
      if (promise.status === 'rejected') { log.error({ err:promise }, 'ytdl promise rejected:');}
    }
  });
  return ytArray;
}


export default { fromId, fromSearch, fromPlaylist };