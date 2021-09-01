import { TT$ } from '@upradata/util';
import fs from 'fs-extra';
import path from 'path';
import process from 'process';
import { SyncAsyncMode, SyncAsyncType } from '../useful';


const typeMappings = {
    directory: 'isDirectory',
    file: 'isFile',
};

export type Type = keyof typeof typeMappings;

export class FindFirstPathOptions {
    /**
    The current working directory.
    @default process.cwd()
    */
    readonly directory: string = process.cwd();

    /**
    The type of path to match.
    @default 'file'
    */
    readonly type: Type = 'file';

    /**
    Allow symbolic links to match if they point to the requested path type.
    @default true
    */
    readonly allowSymlinks: boolean = true;

    /**
    Preserve `paths` order when searching.
    Disable this to improve performance if you don't care about the order.
    @default true
    */
    readonly preserveOrder: boolean = true;

    /**
    The number of concurrently pending promises.
    Minimum: `1`
    @default Infinity
    */
    readonly nbConcurrentPromises: number = Infinity;

    constructor(options: FindFirstPathOpts = {}) {
        Object.assign(this, options);
    }
}


export type FindFirstPathOpts = Partial<FindFirstPathOptions>;


const getStatFunction = <Mode extends SyncAsyncMode>(
    mode: Mode, allowSymlinks: boolean
): SyncAsyncType<Mode, fs.StatSyncFn<fs.PathLike>, (path: fs.PathLike) => Promise<fs.Stats>> => {

    const statSync = allowSymlinks ? fs.statSync : fs.lstatSync;
    const statAsync = (allowSymlinks ? fs.stat : fs.lstat);

    const statSyncNotError = (path: fs.PathLike, options?: fs.StatOptions): fs.Stats => {
        try {
            return statSync(path, options) as fs.Stats;
        } catch (e) {
            return undefined;
        }
    };

    return mode === 'sync' ? statSyncNotError : statAsync as any;
};



const _findFirstPath = <Mode extends SyncAsyncMode>(mode: Mode) => (paths: string[], options?: FindFirstPathOpts): SyncAsyncType<Mode, string> => {
    const { allowSymlinks, directory, type, nbConcurrentPromises, preserveOrder } = new FindFirstPathOptions(options);

    const matchType = <M extends SyncAsyncMode>(stat: TT$<fs.Stats>): SyncAsyncType<M, boolean> => stat?.[ typeMappings[ type ] ]() ?? false;


    const getStat = getStatFunction(mode, allowSymlinks);

    const findPathInOrder = (paths: string[]): SyncAsyncType<Mode, string> => {
        if (paths.length === 0)
            return;

        const [ p, ...restPaths ] = paths;

        const found = matchType(getStat(path.resolve(directory, p)));

        if (typeof found === 'boolean')
            return found ? p : findPathInOrder(restPaths) as any;


        return found.then(isFound => isFound ? p : findPathInOrder(restPaths)) as any;
    };


    const findRandom = async (i: number = 0): Promise<string> => {
        const nextI = i + nbConcurrentPromises;
        const slicePaths = paths.slice(i, nextI);

        try {
            return await Promise.any(slicePaths.map(async p => {
                const isFound = await matchType<'async'>(getStat(path.resolve(directory, p))).catch(_e => false);
                return isFound ? p : Promise.reject(new Error('not found'));
            }));
        } catch (e) {
            if (nextI > paths.length)
                return undefined;

            return findRandom(nextI);
        }
    };

    return mode === 'sync' || preserveOrder ? findPathInOrder(paths) : findRandom() as any;
};



export type FindFirstPath = {
    (paths: string[], options?: FindFirstPathOpts): Promise<any>;
    sync: (paths: string[], options?: FindFirstPathOpts) => string;
};

export const findFirstPath = _findFirstPath('async') as FindFirstPath;
export const findFirstPathSync = _findFirstPath('sync');


findFirstPath.sync = findFirstPathSync;
