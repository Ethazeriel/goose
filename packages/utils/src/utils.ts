// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

/* eslint-disable no-fallthrough */
import crypto from 'node:crypto';

export function progressBar(size:number, duration:number, playhead:number, { start, end, barbefore, barafter, head }:ProgressBarOptions = {}):string {
  start ??= '[';
  end ??= ']';
  barbefore ??= '-';
  barafter ??= '-';
  head ??= '#';
  let result = '';
  const playperc = (playhead / duration > 1) ? 1 : (playhead / duration);
  let before = Math.round((size - 2) * playperc) || 0;
  let after = Math.round((size - 2) * (1 - playperc)) || 0;
  while ((before + after + 1) > (size - 2)) { (before < after) ? after-- : before--; }
  while ((before + after + 1) < (size - 2)) { (before < after) ? before++ : after++; }
  result = result.concat(start);
  for (let i = 0; i < before; i++) { result = result.concat(barbefore); }
  result = result.concat(head);
  for (let i = 0; i < after; i++) { result = result.concat(barafter); }
  result = result.concat(end);
  return result;
}

type PrideResponse<T extends boolean> = T extends true ? { url:string, name:string} : string;
export function pickPride<T extends boolean = false>(type:'heart' | 'dab' | 'fish', detail?:T): PrideResponse<T> {
  const pridearray = ['agender', 'aromantic', 'asexual', 'bigender', 'bisexual', 'demisexual', 'gaymen', 'genderfluid', 'genderqueer', 'intersex', 'lesbian', 'nonbinary', 'pan', 'poly', 'pride', 'trans'];
  let ranpride = pridearray[Math.floor(Math.random() * pridearray.length)];
  if (ranpride == 'pride') {
    const pridearray2 = ['pride', 'progressive', 'poc'];
    ranpride = pridearray2[Math.floor(Math.random() * pridearray2.length)];
  }
  const prideStr = `https://ethazeriel.net/pride/sprites/${type}_${ranpride}.png`;
  if (detail === true) {
    return <PrideResponse<T>>{
      url:prideStr,
      name:ranpride,
    };
  }
  return <PrideResponse<T>>prideStr;
}

export function timeDisplay(seconds:number):string {
  let time = new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^[0:]+/, '');
  switch (time.length) {
    case 0: time = `0${time}`;
    case 1: time = `0${time}`;
    case 2: time = `0:${time}`;
    default: return time;
  }
}

export function randomHexColor():number {
  return Number(`0x${crypto.randomBytes(3).toString('hex')}`);
}

export function chooseAudioSource(track:Track):TrackSource|TrackYoutubeSource {
  if (track.audioSource.subsonic) {
    return track.audioSource.subsonic;
  } else {
    return track.audioSource.youtube![0];
  }
}

export function numbersToTrackIndexes(input:string):Array<number> {
  // takes a comma-separated string of numbers and ranges
  // returns an array of numbers in descending order
  // assumes the user gave us 1-indexed numbers and we want 0-indexed
  const uniques:Set<number> = new Set();
  input = input.replace(/([^\d-,])+/g, '');
  const values = input.split(',');
  for (const value of values) {
    if (value.includes('-')) {
      const ends = value.match(/(\d+)?(?:-)(\d+)?/);
      if (value.startsWith('-')) {
        uniques.add(Math.abs(Number(value)));
      } else if (value.endsWith('-')) {
        uniques.add(Number(ends![1]));
      } else {
        let i = Number(ends![1]);
        while (i <= Number(ends![2])) {
          uniques.add(i);
          i++;
        }
      }
    } else {
      uniques.add(Number(value));
    }
  }
  uniques.delete(0);
  const result = Array.from(uniques);
  result.sort((a, b) => b - a);
  for (const [j, k] of result.entries()) {result[j] = (k - 1);}
  return result;
}