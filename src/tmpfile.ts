

import { guid, TT$ } from '@upradata/util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { SyncAsync, syncAsync } from './useful';

const existsFile = promisify(fs.exists);

/* export const tmpFileName = (): SyncAsync<string> => {
    const o = {};

    for (const mode of syncAsync) {
        Object.defineProperty(o, mode, {
            get: () => {
                return getFile(mode as any);
            }
        });
    }

    return o as any;
}; */



const getFile = (mode: keyof SyncAsync): TT$<string> => {
    const tmpFile = (name: string, exist: boolean) => {
        if (!exist)
            return name;

        return getFile(mode);
    };

    const name = path.join(os.tmpdir(), guid());
    return mode === 'sync' ? tmpFile(name, fs.existsSync(name)) : existsFile(name).then(exist => tmpFile(name, exist));
};


export const tmpFileName = {
    sync: () => getFile('sync') as string,
    async: () => getFile('async') as Promise<string>
};
