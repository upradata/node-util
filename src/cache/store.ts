import { isUndefined, isDefined, ensureArray, chain } from '@upradata/util';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { warn } from './common';
import { StoreCollection, isFilePrint, FilePrint, FileIterate } from './store-collection';
import { findUpDir } from '../useful';


const ENCODING = 'utf8';

export interface Stringable {
    toString(): string;
}

export type Criteria = (path: string) => Stringable;
export type IsSameComparator = (path: string, criteria: Stringable) => boolean;

export class CacheChangeOptions {
    onlyExistingFiles?: boolean = false;
}

export class StoreOptions {
    path: string;
    criteria?: Criteria | 'mtime' | 'md5' = 'mtime';
    isSameComparator?: IsSameComparator;

    constructor(options: Partial<StoreOptions>) {
        Object.assign(this, options);

        if (isUndefined(this.path)) {
            const root = findUpDir('package.json');
            this.path = path.join(root || process.cwd(), '_cache.json');
        }
    }
}


export class Store extends StoreOptions {
    storeCollection: StoreCollection;
    criteriaFunc: Criteria;

    constructor(options: Partial<StoreOptions> = {}) {
        super(options);
        this.storeCollection = new StoreCollection(this.path);
        this.init();
    }

    private init() {
        if (fs.existsSync(this.path)) {
            this.storeCollection.load();
        }

        if (this.criteria === 'mtime')
            this.criteriaFunc = path => this.mtime(path);
        else if (this.criteria === 'md5')
            this.criteriaFunc = path => this.md5(path);
        else
            this.criteriaFunc = this.criteria;

        if (isUndefined(this.isSameComparator))
            this.isSameComparator = (path, criteria) => this.criteriaFunc(path).toString() === criteria.toString();
    }

    public getCollection(...collectionName: string[]) {
        try {
            return this.storeCollection.getCollection(...collectionName);
        } catch (e) {
            return undefined;
        }
    }

    public md5(filePath: string, size: number = 16) {
        const isDirectory = fs.statSync(filePath).isDirectory();

        return crypto.createHash('md5').update(
            isDirectory ?
                fs.readdirSync(filePath).join() :
                fs.readFileSync(filePath, { encoding: ENCODING }),
            ENCODING
        ).digest('hex').slice(0, size);
    }

    public mtime(filePath: string) {
        return fs.statSync(filePath).mtime.getTime();
    }


    public createCollectionIfNotExist(...collectionName: string[]) {
        return this.storeCollection.createCollectionIfNotExist(...collectionName);
    }

    public collectionExists(...collectionName: string[]) {
        return isDefined(this.storeCollection.getCollection(...collectionName));
    }

    public fileExists(file: string, ...collectionName: string[]) {
        return this.storeCollection.fileExists(file, ...collectionName);
    }

    public files(...collectionName: string[]): FileIterate[] {
        if (collectionName.length === 0)
            return [ ...this.filePrintIterator() ];

        const storeCollection = this.getCollection(...collectionName);

        return isUndefined(storeCollection) ? undefined : Object.entries(storeCollection.collection)
            .filter(([ key, value ]) => isFilePrint(value))
            .map(([ key, value ]) => {
                const fileprint = value as FilePrint;

                return {
                    filepath: key,
                    fileprint,
                    collectionName: this.storeCollection.mergeCollectNames(...collectionName),
                    collection: storeCollection
                };
            });
    }

    public fileNames(...collectionName: string[]) {
        return (this.files(...collectionName) || []).map(f => f.filepath);
    }

    public addFile(file: string, ...collectionName: string[]) {

        const print: FilePrint = {
            mtime: this.mtime(file),
        };

        if (this.criteria !== 'mtime')
            print.criteria = this.criteriaFunc(file).toString();

        this.storeCollection.addFilePrint(file, print, ...collectionName);

        return this;
    }

    public filePrint(file: string, options: { fileprintProp?: keyof FilePrint; collectionName?: string | string[]; } = {}) {
        const { collectionName, fileprintProp } = options;

        const fileprint = chain(() => this.getCollection(...ensureArray(collectionName)).collection[ file ]);

        if (!isFilePrint(fileprint)) {
            return undefined;
        }

        return isUndefined(fileprintProp) ? fileprint : fileprint[ fileprintProp ];
    }

    public fileHasChanged(filepath: string, collectionName: string[] = [], options?: CacheChangeOptions) {
        const opts = Object.assign(new CacheChangeOptions(), options);
        const files = this.files(...collectionName);

        if (isUndefined(files))
            return true;

        const file = files.find(f => f.filepath === filepath);
        if (!file) {
            // warn(`[check] No such file in collection: ${file}`);
            return opts.onlyExistingFiles ? false : true; // if doesn not exist yet ==> has changed because new one
        }

        const criteria: keyof FilePrint = this.criteria === 'mtime' ? 'mtime' : 'criteria';
        return !this.isSameComparator(filepath, file.fileprint[ criteria ]);
    }

    public deleteFile(file: string, ...collectionName: string[]) {
        const collection = chain(() => this.storeCollection.getCollection(...collectionName).collection);

        if (isDefined(collection))
            delete collection[ file ];
        else
            warn(`[deleteFile] No such file in collection: ${file}`);
    }

    public collectionNames() {
        return [ ...this.collectionIterator() ].map(c => c.name);
    }

    public deleteCollection(...collectionName: string[]) {
        const collectionNameSplit = this.storeCollection.mergeCollectNames(...collectionName).split('.');

        const storeCollection = this.storeCollection.getCollection(...collectionNameSplit.slice(0, -1));
        const name = collectionNameSplit[ collectionNameSplit.length - 1 ];

        if (isDefined(storeCollection.collection[ name ]))
            delete storeCollection.collection[ name ];

        return this;
    }

    public deleteAll() {
        this.storeCollection = new StoreCollection(this.path);
    }

    public save() {
        this.storeCollection.save();
        return this;
    }


    public * filePrintIterator(...collectionName: string[]) {
        const collection = this.storeCollection.getCollection(...collectionName);

        if (isDefined(collection))
            yield* collection.filePrintIterator();
    }

    public * collectionIterator(...collectionName: string[]) {
        const collection = this.storeCollection.getCollection(...collectionName);

        if (isDefined(collection))
            yield* collection.collectionIterator();

    }
}
