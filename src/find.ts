import findup from 'find-up';
import path from 'path';
import { SyncAsyncMode, SyncAsyncType } from './useful';

type FilesOrMatcher = string | readonly string[] | ((directory: string) => findup.Match | Promise<findup.Match>);

const _findUp = <Mode extends SyncAsyncMode>(mode: Mode) => (filesOrMatcher: FilesOrMatcher, options?: findup.Options) => {
    const lookup = (mode === 'sync' ? findup.sync : findup) as SyncAsyncType<Mode, typeof findup.sync, typeof findup>;
    return lookup(filesOrMatcher as any, options) as SyncAsyncType<Mode, string>;
};

export const findUp = {
    sync: _findUp('sync'),
    async: _findUp('async')
};


export const findUpDir = {
    sync: (files: string | string[], options?: findup.Options) => path.dirname(findUp.sync(files, { ...options, type: 'file' })),
    async: async (files: string | string[], options?: findup.Options) => path.dirname(await findUp.async(files, { ...options, type: 'file' }))
};


export const lookupRoot = {
    sync: (startDirectory?: string) => findUpDir.sync('package.json', { cwd: startDirectory }),
    async: (startDirectory?: string) => findUpDir.async('package.json', { cwd: startDirectory })
};


export const root = lookupRoot.sync();

export const fromDir = (dir: string) => (...paths: string[]) => path.join(dir, ...paths);
export const fromDirIfRel = (dir: string) => (...paths: string[]) => path.isAbsolute(paths[ 0 ]) ? path.join(...paths) : path.join(dir, ...paths);

export const fromRoot = fromDir(root);
export const fromRootIfRel = fromDirIfRel(root);

export const fromCwd = fromDir(process.cwd());
export const fromCwdIfRel = fromDirIfRel(process.cwd());
