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

    const {
        recursive = false,
        before = () => { },
        withContent = false,
        filterFiles = _file => true,
        filterFolders = _dir => true,
        maxDepth = Infinity
    } = opts;

    const forEach = async (directory: string, depth: number): Promise<void> => {

        if (depth === 0)
            await before();

        const fromDir = (file: string) => path.join(directory, file);
        const dirents = await fs.readdir(directory, { withFileTypes: true });
        const files = dirents.filter(d => d.isFile() && filterFiles(fromDir(d.name), directory));
        const directories = dirents.filter(d => d.isDirectory() && filterFolders(d.name, directory)).map(d => d.name);

        await Promise.allSettled([
            ...files.map(async dirent => cb(fromDir(dirent.name), dirent, withContent ? await fs.readFile(fromDir(dirent.name), 'utf8') : undefined)),
            ...(recursive && depth < maxDepth ? directories.map(dir => forEach(fromDir(dir), depth + 1)) : [])
        ]);
    };

    return forEach(directory, 0);
}


export const getFiles = async (directory: string, options: ForEachFilesOptions,) => {
    const files = [] as { filepath: string; dirent: fs.Dirent; content?: string; }[];

    await forEachFiles(directory, options, (filepath, dirent, content) => {
        files.push({ filepath, dirent, content });
    });

    return files;
};
