import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

export const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production';


export class SyncAsync<T = any> {
    sync: T = undefined;
    async: Promise<T> = undefined;
}


export const syncAsync = Object.keys(new SyncAsync());
export const readFileAsync = promisify(fs.readFile);
