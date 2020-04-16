import findUp from 'find-up';
import path from 'path';
import { ensureArray } from '@upradata/util';

export const findUpDir = (file: string | string[], startDirectory: string = process.cwd()) => findUp.sync(directory => {
    const hasPackageJson = ensureArray(file).some(file => findUp.sync.exists(path.join(directory, file)));
    return hasPackageJson && directory;
}, { type: 'directory', cwd: startDirectory });



export const lookupRoot = (startDirectory?: string) => findUpDir('package.json', startDirectory);
export const root = lookupRoot();


export const fromDir = (dir: string) => (...paths: string[]) => path.join(dir, ...paths);
export const fromDirIfRel = (dir: string) => (...paths: string[]) => path.isAbsolute(paths[ 0 ]) ? path.join(...paths) : path.join(dir, ...paths);

export const fromRoot = fromDir(root);
export const fromRootIfRel = fromDirIfRel(root);

export const fromCwd = fromDir(process.cwd());
export const fromCwdIfRel = fromDirIfRel(process.cwd());
