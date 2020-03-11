import findUp from 'find-up';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { readJson } from './json/read-json5';
import { TscCompiler } from './ts/tsc';
import { red } from './style/basic-styles';


export const findUpDir = (file: string, startDirectory: string = process.cwd()) => findUp.sync(directory => {
    const hasPackageJson = findUp.sync.exists(path.join(directory, file));
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



export function requireModule(filepath: string) {
    switch (path.extname(filepath)) {
        case '.json': return readJson.sync(filepath);
        case '.js': return importDefault(require(filepath));
        case '.ts': return importDefault(TscCompiler.compileAndLoadModule(filepath));
        default:
            throw new Error(red`filepath has to be the path of a .json, .js or .ts file. Provided option was ${filepath}`);
    }
}

export function importDefault(mod: any) {
    return mod && mod.__esModule ? mod.default : mod;
}

export const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production';


export class SyncAsync<T = any> {
    sync: T = undefined;
    async: Promise<T> = undefined;
}


export const syncAsync = Object.keys(new SyncAsync());
export const readFileAsync = promisify(fs.readFile);
