import { ensureArray, isDefined, isUndefined } from '@upradata/util';
import { warn } from './common';
import { File, GlobFiles } from './glob-files';
import { CacheChangeOptions, Store, StoreOpts } from './store';


export class CacheOpts {
    verbose?: boolean = true;
}

export type CacheOptions = CacheOpts & StoreOpts & CacheChangeOptions;


export interface LoopArguments {
    files: File | File[];
    method: string;
    action: (file: string) => any;
}


export class Cache {
    public store: Store;
    public options: CacheOpts;


    constructor(options?: Partial<CacheOptions>) {
        this.options = Object.assign(new CacheOpts(), options);
        this.store = new Store(options);
    }

    public createCollectionIfNotExist(...collectionName: string[]) {
        return this.store.createCollectionIfNotExist(...collectionName);
    }

    public save() {
        this.store.save();
        return this;
    }

    private processGlobs(files: File | File[], options?: { method?: string; verbose?: boolean; }) {
        const { method, verbose } = options;

        const globFiles = new GlobFiles(ensureArray(files));
        const { files: fileNames, missed } = globFiles.getFiles();

        if (method /* && this.options.verbose */) {
            for (const { pattern, err } of missed) {
                if (isDefined(err))
                    warn(`[${method}] Pattern parse fail for ${pattern}: ${err.message}`);
                else if (verbose)
                    warn(`[${method}] Pattern match no file: ${pattern}`);
            }
        }

        return fileNames;
    }

    private fileNamesInCollection(collectionName: string | string[], files: string[]) {
        // we get all files in the collection and then filter with user filenames if necessary
        const filesInCollection = this.store.fileNames(...ensureArray(collectionName));
        return files.length === 0 ? filesInCollection : filesInCollection.filter(file => files.find(f => f === file));
    }

    /* private fileNamesInCollectionIfExistElseFiles(collectionName: string | string[], files: string[]) {
        return this.store.getCollection(...ensureArray(collectionName)) ? this.fileNamesInCollection(collectionName, files) : files;
    } */


    public addOrUpdateFile(collectionName: string | string[], ...files: File[]) {
        const fileNames = this.processGlobs(files, { method: 'addOrUpdateFile', verbose: true });
        // const collectionFiles = this.fileNamesInCollectionIfExistElseFiles(collectionName, fileNames);

        for (const file of fileNames)
            this.store.addFile(file, ...ensureArray(collectionName));

        return this;
    }

    public deleteFile(collectionName: string | string[], ...files: File[]) {
        const fileNames = this.processGlobs(files, { method: 'deleteFile', verbose: true });
        const collectionFiles = this.fileNamesInCollection(collectionName, fileNames);

        for (const file of collectionFiles)
            this.store.deleteFile(file, ...ensureArray(collectionName));


        return this;
    }

    public deleteCollection(...collectionName: string[]) {
        return this.store.deleteCollection(...collectionName);
    }

    public deleteAllCollections() {
        return this.store.deleteAll();
    }

    public cacheChanged(...collectionName: string[]) {
        const collection = this.store.getCollection(...collectionName);
        const changedCollections: string[] = [];

        for (const { name } of collection.collectionIterator()) {
            if (this.isChangedFiles(name))
                changedCollections.push(name);
        }

        return changedCollections;
    }

    public changedFiles(collectionName?: string | string[], files: File[] = [], options?: CacheChangeOptions): string[] {
        const opts = new CacheChangeOptions({ ...options, verbose: isDefined(options?.verbose) ? options.verbose : this.options.verbose });

        const collName = ensureArray(collectionName);

        const fileNames = this.processGlobs(files, { method: 'changedFiles', verbose: opts.verbose });
        const collection = this.store.getCollection(...collName);

        if (isUndefined(collection))
            return fileNames;

        if (isDefined(files) && files.length > 0)
            return fileNames.filter(file => this.store.fileHasChanged(file, collName, opts));

        return this.store.files(collName, opts)
            .filter(file => this.store.fileHasChanged(file.filepath, [ file.collectionName ]))
            .map(file => file.filepath);
    }

    public isChangedFiles(collectionName?: string | string[], files?: File[], options?: CacheChangeOptions): boolean {
        /* if (this.store.files(...ensureArray(collectionName)).length === 0)
            return true; */
        if (isUndefined(this.store.getCollection(...ensureArray(collectionName))))
            return true;

        return this.changedFiles(collectionName, files, options).length !== 0;
    }
}
