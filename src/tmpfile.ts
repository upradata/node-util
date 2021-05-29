

import { stripIndents, TT$ } from '@upradata/util';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { SyncAsync, guid } from './useful';

const existsFile = promisify(fs.exists);

const getFile = (mode: keyof SyncAsync, option?: TmpFileOption): TT$<string> => {
    const { tmpDirRoot = os.tmpdir(), prefix = '' } = option;

    const get = (i: number = 0) => {

        const tmpFile = (name: string, exist: boolean) => {
            if (!exist)
                return name;

            if (i > 10) {
                throw new Error(stripIndents`Could not create a temporary file in ${tmpDirRoot}:
                                 10 attemps have been tried out and each time the random filename exists`);
            }

            return get(i + 1);
        };

        const id = guid().slice(0, 6);

        const name = path.join(tmpDirRoot, `${prefix}${id}`);
        return mode === 'sync' ? tmpFile(name, fs.existsSync(name)) : existsFile(name).then(exist => tmpFile(name, exist));
    };

    return get();
};


export interface TmpFileOption {
    tmpDirRoot?: string;
    prefix?: string;
}

export const tmpFileName = {
    sync: (option?: TmpFileOption) => getFile('sync', option) as string,
    async: (option?: TmpFileOption) => getFile('async', option) as Promise<string>
};


export const createTmpDir = {
    sync: (option?: TmpFileOption) => {
        const dirname = tmpFileName.sync(option);
        fs.ensureDirSync(dirname);

        return dirname;
    },
    async: async (option?: TmpFileOption) => {
        const dirname = await tmpFileName.async(option);
        await fs.ensureDir(dirname);

        return dirname;
    }
};
