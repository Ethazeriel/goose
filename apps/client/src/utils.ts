// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dragPattern, youtubePattern, youtubePlaylistPattern, spotifyPattern, napsterPattern, subsonicPattern } from '@ethgoose/utils/regex';

// standard disallows reading values of external types mid-drag; can only match keys
export const allowExternal = (event:React.DragEvent<HTMLElement>):boolean => {
  const index = event.dataTransfer.types.findIndex((type) => typeof type === 'string' && dragPattern.test(type));
  return (index !== -1);
};

export const allowedExternalTypes = (event:React.DragEvent<HTMLElement>) => {
  const allowed = event.dataTransfer.types.filter((type) => typeof type === 'string' && dragPattern.test(type))
    .map((type) => event.dataTransfer.getData(type))
    .filter((type) => spotifyPattern.test(type) || subsonicPattern.test(type));
  //  || youtubePlaylistPattern.test(type) || napsterPattern.test(type) || youtubePattern.test(type)

  return (allowed);
};