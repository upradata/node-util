import fs from 'fs-extra';
import crypto from 'crypto';
import { promisify } from 'util';
import { exec, ExecOptions, execSync as execS, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { guidGenerator, TT$ } from '@upradata/util';


const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
export const isDev = [ 'production', 'prod' ].some(t => t === nodeEnv);



export class SyncAsync<T = any> {
    sync: T = undefined;
    async: Promise<T> = undefined;
}


export const syncAsync = Object.keys(new SyncAsync());
export const readFileAsync = promisify(fs.readFile);
export const writeFileAsync = promisify(fs.writeFile);


const execPromise = promisify(exec);
export const execAsync = async (command: string, options?: { encoding?: 'buffer' | BufferEncoding | null; } & ExecOptions & { logOutput?: boolean; }) => {
    const result = await execPromise(command, options);

    if (options?.logOutput) {
        if (result.stdout)
            console.log(result.stdout);

        if (result.stderr)
            console.error(result.stderr);
    }

    return result;
};

export const execSync = async (command: string, options?: Partial<ExecSyncOptionsWithStringEncoding> & { logOutput?: boolean; }) => {
    execS(command, { stdio: options?.logOutput ? [ 0, 1, 2 ] : undefined, ...options });
};

export const guid = guidGenerator(crypto.randomFillSync.bind(crypto));


export const fileExists = (file: string) => fs.stat(file).then(_s => true).catch(_e => false);


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
