import glob, { IOptions as GlobOptions } from 'glob';
import { StoreOptions, Store } from './store';
import { warn } from './common';


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

    private loop(args: { targets: string[], options?: GlobOptions, method: string, action: (file: string) => any; }) {

        const { targets, method, action, options } = args;

        for (const pattern of targets) {
            try {
                const files = glob.sync(pattern, options);

                if (files.length === 0) {
                    warn(`[${method}] Pattern match no file: ${pattern}`);
                    continue;
                }

                files.forEach(action);
            } catch (err) {
                warn(`[${method}] Pattern parse fail for ${pattern}: ${err.message}`);
            }
        }
    }


    public addOrUpdateFile(collectionName: string = 'default', ...files: string[]) {
        this.loop({
            targets: files ? files : this.store.fileNames(collectionName),
            method: 'addOrUpdateFile',
            action: file => this.store.addFile(file, collectionName)
        });

        return this;
    }

    public deleteFile(collectionName: string = 'default', ...files: string[]) {
        this.loop({
            targets: files,
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

    public changedFiles(collectionName: string = 'default', ...files: string[]) {
        const ret = [];

        this.loop({
            targets: files.length || files.length > 0 ? files : this.store.fileNames(collectionName),
            method: 'changedFiles',
            action: file => {
                const isChanged = this.store.fileHasChanged(file, collectionName);
                if (isChanged) ret.push(file);
            }
        });

        return ret;
    }

    public isChangedFiles(collectionName: string = 'default', ...files: string[]) {
        if (this.store.files(collectionName).length === 0)
            return true;

        return this.changedFiles(collectionName, ...files).length !== 0;
    }
}
