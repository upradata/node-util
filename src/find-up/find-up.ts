import { locatePath, locatePathSync, Options as LocateOptions, AsyncOptions as LocateOptionsAsync } from 'locate-path';
import path from 'path';
import { ensureArray, TT$ } from '@upradata/util';
import { SyncAsyncMode, SyncAsyncType } from '../useful';


export const findUpStop = Symbol('findUpStop');
export type Stop = typeof findUpStop;

export type FindupOptionsSync = LocateOptions;
export type FindupOptionsAsync = LocateOptionsAsync;
export type FindupOptions<M extends SyncAsyncMode> = M extends 'sync' ? FindupOptionsSync : FindupOptionsAsync;

export type Matcher<M extends SyncAsyncMode = SyncAsyncMode> = (directory: string) => SyncAsyncType<M, string | Stop, TT$<string | Stop>>;
export type Name = string | string[];



export type LocateArgs<M extends SyncAsyncMode> = {
    options: FindupOptions<M>;
    namesOrMatcher: string[] | Matcher<M>;
};


const locate = <Mode extends SyncAsyncMode>(mode: Mode) => (args: LocateArgs<Mode>): SyncAsyncType<Mode, string> => {
    const { options, namesOrMatcher } = args;

    const getPaths = <M extends SyncAsyncMode>() => Array.isArray(namesOrMatcher) ? namesOrMatcher : namesOrMatcher(options.cwd) as string | ReturnType<Matcher<M>>;
    const paths = ensureArray(getPaths<Mode>());

    if (paths === findUpStop)
        return;

    if (mode === 'sync')
        return locatePathSync(paths as string[], options) as any;

    return Promise.resolve(paths).then(p => locatePath(p as string[], options)) as any;
};



const _findUp = <Mode extends SyncAsyncMode>(mode: Mode) => (nameOrMatcher: Name | Matcher<Mode>, options: FindupOptions<Mode> = {}): SyncAsyncType<Mode, string> => {

    // return lookup(filesOrMatcher as any, options) as SyncAsyncType<Mode, string>;

    const startDirectory = path.resolve(options.cwd || '');

    const { root } = path.parse(startDirectory);
    const namesOrMatcher = typeof nameOrMatcher === 'function' ? nameOrMatcher : ensureArray(nameOrMatcher);

    const runMatcher = (options: FindupOptions<Mode>) => {
        return locate(mode)({ namesOrMatcher, options });
    };

    const run = (directory: string) => {
        const next = (foundPath: string | Stop) => {
            if (foundPath === findUpStop)
                return;

            if (foundPath)
                return path.resolve(directory, foundPath);

            if (directory === root)
                return;

            return run(path.dirname(directory));
        };

        const foundPath = runMatcher({ ...options, cwd: directory });

        return mode === 'sync' ? next(foundPath as string) : (foundPath as Promise<string>).then(next);
    };


    return run(startDirectory);
};


export type FindUp = {
    (nameOrMatcher: Name | Matcher<'async'>, options?: LocateOptionsAsync): Promise<string>;
    sync: (nameOrMatcher: Name | Matcher<'sync'>, options?: LocateOptions) => string;
};

export const findUp = _findUp('async') as FindUp;
export const findUpSync = _findUp('sync');


findUp.sync = findUpSync;
