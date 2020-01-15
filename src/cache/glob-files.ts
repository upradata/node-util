import path from 'path';
import glob, { IOptions as GlobOptions } from 'glob';
import { isPlainObject, assignRecursive, isArray } from '@upradata/util';

export type GlobFilesOptions = GlobOptions & { noGlob?: boolean; };
export type GlobFile = { pattern: string; options?: GlobFilesOptions; };
export type File = string | GlobFile;
export type FilesWithGlobalOptions = { files: (File | File[]), options?: GlobFilesOptions; };
export type Files = File[] | FilesWithGlobalOptions[];

// the last array is there just to be able to have function f(...files:Files)
// Files has to be an array. But if we have { files: File[], options: GlobOptions; }
// it will always be an array of 1 element


export function isGlobFile(file: File): file is GlobFile {
    return isPlainObject(file);
}

export function isFilesWithGlobalOptions(files: Files): files is FilesWithGlobalOptions[] {
    return files.length === 1 && isPlainObject(files[ 0 ]) && (files[ 0 ] as any).files;
}

export class GlobFiles {

    public globFiles: GlobFile[];

    constructor(public files: Files) {
        this.globFiles = this.toGlobFiles();
    }

    toGlobFiles(): GlobFile[] {
        const plainFiles: GlobFile[] = [];

        let filesList: File[] = undefined;
        let globalOptions: GlobFilesOptions = {};

        if (isFilesWithGlobalOptions(this.files)) {
            const f = this.files[ 0 ].files;

            filesList = isArray(f) ? f : [ f ];
            globalOptions = this.files[ 0 ].options;
        } else {
            filesList = this.files;
        }

        for (const file of filesList) {
            if (isGlobFile(file))
                plainFiles.push({ pattern: file.pattern, options: assignRecursive(globalOptions, file.options) });
            else
                plainFiles.push({ pattern: file, options: globalOptions });
        }

        return plainFiles;
    }

    getFiles(): { files: string[], missed: { pattern: string; err?: any; }[]; } {
        const allFiles: string[] = [];
        const noFiles: { pattern: string; err?: any; }[] = [];

        for (const { pattern, options } of this.globFiles) {
            try {

                if (!options.noGlob) {
                    const filesList = glob.sync(pattern, options).map(file => {
                        if (file.startsWith('/'))
                            return file;

                        return path.join(options.cwd || '.', file);
                    });

                    if (filesList.length === 0)
                        noFiles.push({ pattern });
                    else
                        allFiles.push(...filesList);

                } else {
                    allFiles.push(pattern);
                }

            } catch (err) {
                noFiles.push({ pattern, err });

            }
        }

        return { files: allFiles, missed: noFiles };
    }

}
