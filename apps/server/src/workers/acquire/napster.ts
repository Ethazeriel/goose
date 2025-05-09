// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import fs from 'fs';
import { fileURLToPath, URL } from 'url';
import { log } from '../../logger.js';
import axios, { AxiosResponse } from 'axios';
const { napster }:GooseConfig = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../../config/config.json', import.meta.url).toString()), 'utf-8'));

async function fromTrack(id:string):Promise<TrackSource> {
  log.info(`napsterFromTrack: ${id}`);
  const napsterResultAxios:AxiosResponse<NapsterTrackResult> = await axios({
    url: `http://api.napster.com/v2.2/tracks/${id}?apikey=${napster.client_id}`,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });
  const napsterResult = napsterResultAxios.data;
  // at this point we should have a result, now construct the TrackSource
  const source:TrackSource = {
    id: Array(napsterResult.tracks[0].id),
    name: napsterResult.tracks[0].name,
    art: `https://api.napster.com/imageserver/v2/albums/${napsterResult.tracks[0].albumId}/images/200x200.jpg`,
    duration: napsterResult.tracks[0].playbackSeconds,
    url: napsterResult.tracks[0].href,
    album: {
      id: napsterResult.tracks[0].albumId,
      name: napsterResult.tracks[0].albumName,
      trackNumber: napsterResult.tracks[0].index, // TODO: compensate for multiple discs
    },
    artist: {
      id: napsterResult.tracks[0].artistId,
      name: napsterResult.tracks[0].artistName,
    },
  };
  return source;
}

async function fromAlbum(id:string):Promise<Array<TrackSource>> {
  log.info(`napsterFromAlbum: ${id}`);
  const napsterResultAxios:AxiosResponse<NapsterTrackResult> = await axios({
    url: `https://api.napster.com/v2.2/albums/${id}/tracks?apikey=${napster.client_id}`,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });
  const napsterResult = napsterResultAxios.data;
  const sources:Array<TrackSource> = [];
  for (const track of napsterResult.tracks) {
    sources.push({
      id: Array(track.id),
      name: track.name,
      art: `https://api.napster.com/imageserver/v2/albums/${track.albumId}/images/200x200.jpg`,
      duration: track.playbackSeconds,
      url: track.href,
      album: {
        id: track.albumId,
        name: track.albumName,
        trackNumber: track.index,
      },
      artist: {
        id: track.artistId,
        name: track.artistName,
      },
    });
  }
  return sources;
}

async function fromPlaylist(id:string):Promise<Array<TrackSource>> {
  log.info(`napsterFromPlaylist: ${id}`);
  const napsterTracks = [];
  const limit = 50;
  let offset = 0;
  let total = 0;
  do {
    const napsterResultAxios:AxiosResponse<NapsterPlaylistTracksResult> = await axios({
      url: `https://api.napster.com/v2.2/playlists/${id}/tracks?apikey=${napster.client_id}&limit=${limit}&offset=${offset}`,
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });
    const napsterResult = napsterResultAxios.data;
    total = napsterResult.meta.totalCount;
    napsterTracks.push(...napsterResult.tracks);
    offset = offset + limit;
  } while (offset < total);
  const sources:Array<TrackSource> = [];
  for (const track of napsterTracks) {
    sources.push({
      id: Array(track.id),
      name: track.name,
      art: `https://api.napster.com/imageserver/v2/albums/${track.albumId}/images/200x200.jpg`,
      duration: track.playbackSeconds,
      url: track.href,
      album: {
        id: track.albumId,
        name: track.albumName,
        trackNumber: track.index,
      },
      artist: {
        id: track.artistId,
        name: track.artistName,
      },
    });
  }
  return sources;
}

async function fromText(search:string):Promise<TrackSource> {
  log.info(`napsterFromText: ${search}`);
  const napsterResultAxios:AxiosResponse<NapsterSearchResult> = await axios({
    url: `http://api.napster.com/v2.2/search?query=${search}&type=track&per_type_limit=1&apikey=${napster.client_id}`,
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });
  const napsterResult = napsterResultAxios.data;

  const source:TrackSource = {
    id: Array(napsterResult.search.data.tracks[0].id),
    name: napsterResult.search.data.tracks[0].name,
    art: `https://api.napster.com/imageserver/v2/albums/${napsterResult.search.data.tracks[0].albumId}/images/200x200.jpg`,
    duration: napsterResult.search.data.tracks[0].playbackSeconds,
    url: napsterResult.search.data.tracks[0].href,
    album: {
      id: napsterResult.search.data.tracks[0].albumId,
      name: napsterResult.search.data.tracks[0].albumName,
      trackNumber: napsterResult.search.data.tracks[0].index, // TODO: compensate for multiple discs
    },
    artist: {
      id: napsterResult.search.data.tracks[0].artistId,
      name: napsterResult.search.data.tracks[0].artistName,
    },
  };
  return source;
}

export default { fromTrack, fromAlbum, fromPlaylist, fromText };