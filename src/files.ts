import fs from 'fs-extra';
import path from 'path';
import { TT$ } from '@upradata/util';

export interface ForEachFilesInOptions {
    recursive?: boolean;
    before?: () => TT$<void>;
    withContent?: boolean;
    filter?: (dirent: fs.Dirent, filepath: string) => boolean;
}

export type ForEachFilesInCallback = (filepath: string, dirent: fs.Dirent, content?: string) => TT$<void>;

export async function forEachFiles(directory: string, callback: ForEachFilesInCallback): Promise<void>;
export async function forEachFiles(directory: string, options: ForEachFilesInOptions, callback: ForEachFilesInCallback): Promise<void>;
export async function forEachFiles(directory: string, optionsOrCallback: ForEachFilesInOptions | ForEachFilesInCallback, callback?: ForEachFilesInCallback): Promise<void> {
    const cb = callback || optionsOrCallback as ForEachFilesInCallback;
    const opts: ForEachFilesInOptions = callback ? optionsOrCallback as any : {};

    const forEach = async (directory: string, options: ForEachFilesInOptions, callback: ForEachFilesInCallback, depth: number): Promise<void> => {
        const { recursive, before = () => { }, withContent, filter = path => true } = options;

        if (depth === 0 && options)
            await before();

        const join = (file: string) => path.join(directory, file);
        const dirents = await fs.readdir(directory, { withFileTypes: true });
        const files = dirents.filter(d => d.isFile() && filter(d, join(d.name)));
        const directories = dirents.filter(d => d.isDirectory()).map(d => d.name);

        await Promise.all([
            ...files.map(async dirent => callback(join(dirent.name), dirent, withContent ? await fs.readFile(join(dirent.name), 'utf8') : undefined)),
            ...(recursive ? directories.map(dir => forEach(join(dir), options, callback, depth + 1)) : [])
        ]);
    };

    return forEach(directory, opts, cb, 0);
}
