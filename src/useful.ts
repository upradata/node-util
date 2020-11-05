import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';
import { guidGenerator } from '@upradata/util';

export const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production';


export class SyncAsync<T = any> {
    sync: T = undefined;
    async: Promise<T> = undefined;
}


export const syncAsync = Object.keys(new SyncAsync());
export const readFileAsync = promisify(fs.readFile);
export const writeFileAsync = promisify(fs.writeFile);

export const guid = guidGenerator(crypto.randomFillSync.bind(crypto));
