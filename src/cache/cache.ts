import { StoreOptions, Store } from './store';
import { warn } from './common';
import { Files, GlobFiles } from './glob-files';
import { isDefined } from '@upradata/util/lib';


export type CacheOptions = StoreOptions;

export class Cache {
    public store: Store;

    constructor(options?: Partial<CacheOptions>) {
        this.store = new Store(options);
        this.init();
    }

    private init() {
        this.store.createCollectionIfNotExist('default');
    }

    public createCollectionIfNotExist(collectionName: string = 'default') {
        return this.store.createCollectionIfNotExist(collectionName);
    }

    public save() {
        this.store.save();
        return this;
    }

    private loop(args: { files: Files, method: string, action: (file: string) => any; }) {

        const { method, action } = args;
        const globFiles = new GlobFiles(args.files);
        const { files, missed } = globFiles.getFiles();

        files.forEach(action);


        for (const { pattern, err } of missed) {
            if (isDefined(err))
                warn(`[${method}] Pattern parse fail for ${pattern}: ${err.message}`);
            else
                warn(`[${method}] Pattern match no file: ${pattern}`);
        }
    }


    public addOrUpdateFile(collectionName: string = 'default', ...files: Files) {
        this.loop({
            files: files ? files : this.store.fileNames(collectionName),
            method: 'addOrUpdateFile',
            action: file => this.store.addFile(file, collectionName)
        });

        return this;
    }

    public deleteFile(collectionName: string = 'default', ...files: Files) {
        this.loop({
            files,
            method: 'rmFile',
            action: file => this.store.deleteFile(file, collectionName)
        });

        return this;
    }

    public deleteCollection(collectionName: string = 'default') {
        return this.store.deleteCollection(collectionName);
    }

    public cacheChanged() {
        const collectionNames = this.store.collectionNames();
        const changedCollections: string[] = [];

        for (const collectionName of collectionNames) {
            if (this.changedFiles(collectionName))
                changedCollections.push(collectionName);
        }

        return changedCollections;
    }

    public changedFiles(collectionName: string = 'default', ...files: Files) {
        const ret = [];

        this.loop({
            files: files.length || files.length > 0 ? files : this.store.fileNames(collectionName),
            method: 'changedFiles',
            action: file => {
                const isChanged = this.store.fileHasChanged(file, collectionName);
                if (isChanged) ret.push(file);
            }
        });

        return ret;
    }

    public isChangedFiles(collectionName: string = 'default', ...files: Files) {
        if (this.store.files(collectionName).length === 0)
            return true;

        return this.changedFiles(collectionName, ...files).length !== 0;
    }
}
