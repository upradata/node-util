import path from 'path';
import {
    exec,
    ExecOptions,
    execSync as execS,
    ExecSyncOptionsWithStringEncoding
} from 'child_process';
import crypto from 'crypto';
import { promisify } from 'util';
import fs from 'fs-extra';
import { guidGenerator, TT$ } from '@upradata/util';


const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
export const isDev = [ 'production', 'prod' ].some(t => t === nodeEnv);



export class SyncAsync<T = any> {
    sync: T = undefined;
    async: Promise<T> = undefined;
}

export type SyncAsyncMode = keyof SyncAsync;

export type SyncAsyncType<M extends SyncAsyncMode, T, U = undefined> = M extends 'sync' ? T : U extends undefined ? Promise<T> : U;



const execPromise = promisify(exec);

type LogOutput = {
    stdout?: boolean;
    stderr?: boolean;
};

export type ExecAsyncOptions = { encoding?: 'buffer' | BufferEncoding | null; } & ExecOptions & {
    logOutput?: boolean | LogOutput;
    emitError?: boolean;
};

export const isExecLog = (logOutput: boolean | LogOutput, type: 'stdout' | 'stderr'): boolean => typeof logOutput === 'boolean' && logOutput || logOutput?.[ type ];

export const execAsync = async (command: string, options: ExecAsyncOptions = {}) => {
    const { logOutput = { stdout: true, stderr: false }, emitError = true } = options;

    try {
        const result = await execPromise(command, options);

        if (isExecLog(logOutput, 'stdout') && result.stdout)
            console.log(result.stdout);

        if (isExecLog(logOutput, 'stderr') && result.stderr)
            console.error(result.stderr);

        if (emitError && result.stderr)
            throw new Error(result.stderr);

        return result;
    } catch (e) {
        if (isExecLog(logOutput, 'stderr')) {
            if (e instanceof Error) {
                console.error(e.message);
                console.error(e.stack || 'Failed in execAsync');
            } else {
                console.error(e);
            }
        }

        if (emitError)
            throw e;
    }

};

export const execSync = async (command: string, options?: Partial<ExecSyncOptionsWithStringEncoding> & { logOutput?: boolean; }) => {
    execS(command, { stdio: options?.logOutput ? [ 0, 1, 2 ] : undefined, ...options });
};

export const guid = guidGenerator(crypto.randomFillSync.bind(crypto));


const handleFileExistsError = (e: any) => {
    if (e?.code === 'ENOENT')
        return false;

    throw e;
};

export const fileExists = {
    async: (file: string) => fs.stat(file).then(_s => true).catch(handleFileExistsError),
    sync: (file: string) => {
        try {
            return !!fs.statSync(file);
        } catch (e) {
            return handleFileExistsError(e);
        }
    }
};


export interface PollOptions {
    duration: number;
    timeStep?: number;
}


export const poll = <S, E>(handler: () => TT$<{ stop: boolean; error?: E; success?: S; }>, options: PollOptions) => {
    const { duration, timeStep = 100 } = options;
    let totalWait = 0;


    // Strangely, we need to wait before the OS writes the file on the disk.
    // We wait a maximum 2s
    return new Promise<S>((res, rej) => {
        const id = setInterval(async () => {
            const { error, success, stop } = await handler();

            if (stop) {
                res(success);
                clearInterval(id);
            } else if (totalWait > duration) {
                rej(error);
                clearInterval(id);
            }

            totalWait += timeStep;
        }, timeStep);
    });
};


export const relativePath = (dir: string) => (...paths: string[]) => path.relative(dir, path.join(...paths));
export const relativeCwd = (...paths: string[]) => relativePath(process.cwd())(...paths);
