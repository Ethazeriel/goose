// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import * as db from './database.js';
import { log } from './logger.js';
import { sanitize } from '@ethgoose/utils/regex';
import subsonic from './workers/acquire/subsonic.js';
import crypto from 'crypto';


const trackVersion = 1;
const userVersion = 1;

async function upgradeUser(user:User, internal:boolean = false):Promise<User> {
  // no version means 0
  if (!user.version) {user.version = 0;}
  log.info(`Migrating user ${user.goose?.username || user.discord.username.current} from version ${user.version}`);
  switch (user.version) {

    case 0:{
    // addition of goose field and version to user object to prep for move away from discord
      user.goose = {
        id: crypto.randomUUID(),
        locale: user.discord.locale,
        username: user.discord.username.current
      };
      user.version = 1;
      return await upgradeUser(user, true);
    }

    case userVersion:{
      if (internal === false) {
        log.warn('upgradeUser called but user is already up to date');
        return user;
      } else {
        log.info(`User object for ${user.goose.username} migrated to version ${userVersion}`);
        const result = await db.replaceUser(user);
        if (result !== 1) {
          log.warn(`User replacement failed for ${user.goose.username}, returned ${result} items modified`);
        }
        return user;
      }
    }
  }
  log.fatal('hit cursed upgradeUser exit');
  // should never reach this return; just here to appease TS
  return user;
}

async function upgradeTrack(track:Track, internal:boolean = false):Promise<Track> {
  // if no version string, assume this is a pre-audiosource track and set version to 0
  if (!track.version) {track.version = 0;}
  log.info(`Migrating track ${track.goose.id} from version ${track.version}`);
  switch (track.version) {

    case 0:{
      // migration to multiple-source track system
      type TrackV0 = Track & {youtube?:Array<TrackYoutubeSource>};
      const youtube = JSON.parse(JSON.stringify((track as TrackV0).youtube));
      track.audioSource = { youtube: youtube };
      delete (track as TrackV0).youtube;
      // see if we have subsonic info for this track and add if so
      let query = `${track.goose.track.name} ${track.goose.artist.name}`;
      query = query.replace(sanitize, '');
      query = query.replace(/(-)+/g, ' ');
      const subsonicResult = await subsonic.fromText(query);
      if (subsonicResult) {
        track.audioSource.subsonic = subsonicResult;
        // also need to update goose duration, as may differ between sources and subsonic is preferred
        track.goose.track.duration = subsonicResult.duration;
      }
      track.version = 1;
      return await upgradeTrack(track, true);
    }

    case trackVersion:{
      // do the replace
      if (internal === false) {
        // if migrate called for up to date track, yell about it and return the track as-is
        log.warn('migrate called but track is up to date');
        return track;
      } else {
        log.info(`Track ${track.goose.id} migrated, updating db`);
        const result = await db.replaceTrack(track);
        if (result !== 1) {
          log.warn(`Track replacement failed for ${track.goose.track.name}, returned ${result} items modified`);
        }
        return track;
      }
    }
  }
  log.fatal('hit cursed upgradeTrack exit');
  // should never reach this return; just here to appease TS
  return track;
}

export { trackVersion, upgradeTrack, userVersion, upgradeUser };

