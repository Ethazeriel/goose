// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
// SPDX-FileCopyrightText: Whuppee
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

import { Worker } from 'worker_threads';
import crypto from 'crypto';
import { log } from './logger.js';
import { fileURLToPath, URL } from 'url';
import Player from './player.js';

const sleep = (ms:number) => new Promise((resolve) => setTimeout(resolve, ms));
let slowMode:boolean; // TODO: remove? hide behind dev flag?
export function toggleSlowMode() {
  slowMode = !slowMode;
}

let worker = new Worker(fileURLToPath(new URL('./workers/acquire.js', import.meta.url).toString()), { workerData:{ name:'Acquire' } });
worker.on('exit', code => {
  log.debug(`Worker exited with code ${code}.`);
  worker = new Worker(fileURLToPath(new URL('./workers/acquire.js', import.meta.url).toString()), { workerData:{ name:'Acquire' } });
}); // if it exits just spawn a new one because that's good error handling, yes

worker.on('error', code => {
  log.error({ err:code }, `Worker threw error ${code.message}.`);
  worker = new Worker(fileURLToPath(new URL('./workers/acquire.js', import.meta.url).toString()), { workerData:{ name:'Acquire' } });
}); // ehh fuck it, probably better than just crashing I guess
type fetchPromiseResult = { id:string, tracks?:Array<Track | string>, error?:string };
export default async function fetch(search:string, id = crypto.randomBytes(5).toString('hex')):Promise<Track[]> {
  if (slowMode) { await sleep(20000); }
  worker.postMessage({ action:'search', search:search, id:id });
  const promise:Promise<Track[]> = new Promise((resolve, reject) => {
    const action = (result:fetchPromiseResult) => {
      if (result.id === id) {
        if (result.tracks) {
          // we have results, which could be tracks or failure messages
          const completedFetch:Array<Track> = [];
          for (const item of result.tracks) {
            if (typeof item === 'string') {
              // a string in the track array represents a failed fetch
              completedFetch.push(Player.placeholderTrack('failed', item));
            } else {
              completedFetch.push(item);
            }
          }
          resolve(completedFetch);
        } else {
          // we didn't get any tracks at all - reject promise entirely
          reject(new Error(result.error));
        }
        worker.removeListener('message', action);
        worker.removeListener('error', error);
      }
      log.debug(`acquire worker, listener ${id} called`);
    };
    const error = (err:Error) => {
      log.error({ err:err }, 'acquire worker error');
      reject(err);
      worker.removeListener('message', action);
      worker.removeListener('error', error);
    };
    worker.on('message', action);
    worker.on('error', error);
  });

  return promise;
}

process.on('SIGTERM', async () => {
  worker.postMessage({ action:'exit' });
});