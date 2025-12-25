// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { log } from '../../logger.js';
import spotifyAcquire from '../acquire/spotify.js';


export async function userPlaylists(token:string, id:string):Promise<Array<SpotifyPlaylist>> {
  log.info(`spotifyUserPlaylists: ${id}`);
  const playlistList = [];
  const limit = 50;
  let offset = 0;
  let total = 0;
  do {
    const spotifyResultStream:Response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
    });
    const spotifyResult = (await (spotifyResultStream.json() as Promise<SpotifyApi.ListOfCurrentUsersPlaylistsResponse>));
    total = spotifyResult.total;
    offset = offset + limit;
    playlistList.push(...spotifyResult.items);
  } while (offset < total);
  // at this point we should have a result, now construct the TrackSource
  const result:SpotifyPlaylist[] = [];
  for (const playlist of playlistList) {
    result.push({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      owner: playlist.owner.display_name || playlist.owner.id,
    });
  }
  return result;
}

export async function getPlaylist(id:string):Promise<Array<TrackSource>> {
  const auth = await spotifyAcquire.getCreds();
  const tracks = await spotifyAcquire.fromPlaylist(auth, id);
  return tracks;
}