import { findUp as findup, findUpSync as findupSync, Options as FindupOptions, Match as FindupMath } from 'find-up';
import path from 'path';
import { SyncAsyncMode, SyncAsyncType } from './useful';

type FilesOrMatcher = string | readonly string[] | ((directory: string) => FindupMath | Promise<FindupMath>);

const _findUp = <Mode extends SyncAsyncMode>(mode: Mode) => (filesOrMatcher: FilesOrMatcher, options?: FindupOptions) => {
    const lookup = (mode === 'sync' ? findupSync : findup) as SyncAsyncType<Mode, typeof findupSync, typeof findup>;
    return lookup(filesOrMatcher as any, options) as SyncAsyncType<Mode, string>;
};

export const findUp = {
    sync: _findUp('sync'),
    async: _findUp('async')
};


export const findUpDir = {
    sync: (files: string | string[], options?: FindupOptions) => path.dirname(findUp.sync(files, { ...options, type: 'file' })),
    async: async (files: string | string[], options?: FindupOptions) => path.dirname(await findUp.async(files, { ...options, type: 'file' }))
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
