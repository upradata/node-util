import { isUndefined } from '@upradata/util';
import path from 'path';
import { findUp, FindupOpts } from './find-up';


export const findUpDir = {
    sync: (files: string | string[], options?: FindupOpts) => path.dirname(findUp.sync(files, { ...options, type: 'file' })),
    async: async (files: string | string[], options?: FindupOpts) => path.dirname(await findUp(files, { ...options, type: 'file' }))
};


export const lookupRoot = {
    sync: (startDirectory?: string) => findUpDir.sync('package.json', { from: startDirectory }),
    async: (startDirectory?: string) => findUpDir.async('package.json', { from: startDirectory })
};


// I do not want to have anything called if not asked
// so I use _root and I put  (...paths: string[]) => in front of every helpers and directly fromDir(root())


let _root: string = undefined;
export const root = () => {
    if (isUndefined(_root))
        _root = lookupRoot.sync(process.cwd());

    return _root;
};


export const fromDir = (dir: string) => (...paths: string[]) => path.join(dir, ...paths);
export const fromDirIfRel = (dir: string) => (...paths: string[]) => path.isAbsolute(paths[ 0 ]) ? path.join(...paths) : path.join(dir, ...paths);

export const fromRoot = (...paths: string[]) => fromDir(root())(...paths);
export const fromRootIfRel = (...paths: string[]) => fromDirIfRel(root())(...paths);

export const fromCwd = (...paths: string[]) => fromDir(process.cwd())(...paths);
export const fromCwdIfRel = (...paths: string[]) => fromDirIfRel(process.cwd())(...paths);
