
import path from 'path';
import { findUp, FindupOptionsSync, FindupOptionsAsync } from './find-up';


export const findUpDir = {
    sync: (files: string | string[], options?: FindupOptionsSync) => path.dirname(findUp.sync(files, { ...options, type: 'file' })),
    async: async (files: string | string[], options?: FindupOptionsAsync) => path.dirname(await findUp(files, { ...options, type: 'file' }))
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
