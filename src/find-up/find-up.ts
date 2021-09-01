import path from 'path';
import { ensureArray, isString, TT$ } from '@upradata/util';
import { SyncAsyncMode, SyncAsyncType } from '../useful';
import { FindFirstPathOpts, findFirstPath } from './find-first-path';


export const findUpStop = Symbol('findUpStop');
const notMatched = Symbol('notMatcher');

export type Stop = typeof findUpStop;
type NotMatched = typeof notMatched;

export type FindupOpts = Omit<FindFirstPathOpts, 'directory'> & { from?: string; };

export type Matcher<M extends SyncAsyncMode = SyncAsyncMode> = (directory: string) => SyncAsyncType<M, string | Stop, TT$<string | Stop>>;
export type Name = string | string[];



const findFromMatcher = <M extends SyncAsyncMode>(matcher: Matcher<M>, directory: string): SyncAsyncType<M, string | NotMatched | Stop> => {
    const foundPath = matcher(directory);
    const found = (p: string) => isString(p) && p !== '' ? p : notMatched;

    if (foundPath === findUpStop)
        return findUpStop as any;

    if (foundPath instanceof Promise)
        return foundPath.then(found) as any;

    return found(foundPath) as any;

};



export type FindFirstArgs<M extends SyncAsyncMode> = {
    options: FindFirstPathOpts;
    namesOrMatcher: string[] | Matcher<M>;
};


const findFirst = <Mode extends SyncAsyncMode>(mode: Mode) => (args: FindFirstArgs<Mode>): SyncAsyncType<Mode, string | NotMatched | Stop> => {
    const { options, namesOrMatcher } = args;

    if (typeof namesOrMatcher !== 'function') {

        const paths = ensureArray(namesOrMatcher);

        if (mode === 'sync')
            return findFirstPath.sync(paths as string[], options) as any;

        return Promise.resolve(paths).then(p => findFirstPath(p as string[], options)) as any;
    }

    return findFromMatcher(namesOrMatcher, options.directory) as any;
};



const _findUp = <Mode extends SyncAsyncMode>(mode: Mode) => (nameOrMatcher: Name | Matcher<Mode>, options: FindupOpts = {}): SyncAsyncType<Mode, string> => {

    // return lookup(filesOrMatcher as any, options) as SyncAsyncType<Mode, string>;

    const startDirectory = path.resolve(options.from || '');

    const { root } = path.parse(startDirectory);
    const namesOrMatcher = typeof nameOrMatcher === 'function' ? nameOrMatcher : ensureArray(nameOrMatcher);

    const findPath = (options: FindFirstPathOpts) => {
        return findFirst(mode)({ namesOrMatcher, options });
    };

    const run = (directory: string) => {
        const next = (foundPath: string | NotMatched | Stop) => {
            if (foundPath === findUpStop)
                return;

            if (isString(foundPath))
                return path.resolve(directory, foundPath);

            if (directory === root)
                return;

            return run(path.dirname(directory));
        };

        const foundPath = findPath({ ...options, directory });

        return mode === 'sync' ? next(foundPath as string) : (foundPath as Promise<string>).then(next);
    };


    return run(startDirectory);
};


export type FindUp = {
    (nameOrMatcher: Name | Matcher<'async'>, options?: FindupOpts): Promise<string>;
    sync: (nameOrMatcher: Name | Matcher<'sync'>, options?: FindupOpts) => string;
};

export const findUp = _findUp('async') as FindUp;
export const findUpSync = _findUp('sync');


findUp.sync = findUpSync;
