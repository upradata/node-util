

import { TT$ } from '@upradata/util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { SyncAsync, guid } from './useful';

const existsFile = promisify(fs.exists);

const getFile = (mode: keyof SyncAsync, tmpDirRoot: string = os.tmpdir()): TT$<string> => {
    const tmpFile = (name: string, exist: boolean) => {
        if (!exist)
            return name;

        return getFile(mode);
    };

    const name = path.join(tmpDirRoot, guid());
    return mode === 'sync' ? tmpFile(name, fs.existsSync(name)) : existsFile(name).then(exist => tmpFile(name, exist));
};


export const tmpFileName = {
    sync: (tmpDirRoot?: string) => getFile('sync', tmpDirRoot) as string,
    async: (tmpDirRoot?: string) => getFile('async', tmpDirRoot) as Promise<string>
};
