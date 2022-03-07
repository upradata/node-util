import fs from 'fs-extra';
import path from 'path';
import { TT$ } from '@upradata/util';


export interface ForEachFilesOptions {
    recursive?: boolean;
    before?: () => TT$<void>;
    withContent?: boolean;
    filterFiles?: (filepath: string, parentDir?: string) => boolean;
    filterFolders?: (folder: string, parentDir?: string) => boolean;
    maxDepth?: number;

}

export type ForEachFilesInCallback = (filepath: string, dirent: fs.Dirent, content?: string) => TT$<void>;

export async function forEachFiles(directory: string, callback: ForEachFilesInCallback): Promise<void>;
export async function forEachFiles(directory: string, options: ForEachFilesOptions, callback: ForEachFilesInCallback): Promise<void>;
export async function forEachFiles(directory: string, optionsOrCallback: ForEachFilesOptions | ForEachFilesInCallback, callback?: ForEachFilesInCallback): Promise<void> {
    const cb = callback || optionsOrCallback as ForEachFilesInCallback;
    const opts: ForEachFilesOptions = callback ? optionsOrCallback as any : {};

    const forEach = async (directory: string, options: ForEachFilesOptions, callback: ForEachFilesInCallback, depth: number): Promise<void> => {
        const {
            recursive = false,
            before = () => { },
            withContent = false,
            filterFiles = _file => true,
            filterFolders = _dir => true,
            maxDepth = Infinity
        } = options;


        if (depth === 0 && options)
            await before();

        const join = (file: string) => path.join(directory, file);
        const dirents = await fs.readdir(directory, { withFileTypes: true });
        const files = dirents.filter(d => d.isFile() && filterFiles(join(d.name), directory));
        const directories = dirents.filter(d => d.isDirectory() && filterFolders(d.name, directory)).map(d => d.name);

        await Promise.allSettled([
            ...files.map(async dirent => callback(join(dirent.name), dirent, withContent ? await fs.readFile(join(dirent.name), 'utf8') : undefined)),
            ...(recursive && depth < maxDepth ? directories.map(dir => forEach(join(dir), options, callback, depth + 1)) : [])
        ]);
    };

    return forEach(directory, opts, cb, 0);
}
