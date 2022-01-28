import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { chain, ensureArray, isDefined, isUndefined, PartialRecursive } from '@upradata/util';
import { findUpDir } from '../find-up';
import { warn } from './common';
import { FileIteration, FilePrint, isFilePrint, StoreCollection } from './store-collection';


const ENCODING = 'utf8';

export function md5(filePath: string, size: number = 16) {
    const isDirectory = fs.statSync(filePath).isDirectory();

    return crypto.createHash('md5').update(
        isDirectory ?
            fs.readdirSync(filePath).join() :
            fs.readFileSync(filePath, { encoding: ENCODING }),
        ENCODING
    ).digest('hex').slice(0, size);
}

export function mtime(filePath: string) {
    return fs.statSync(filePath).mtime.getTime();
}


export interface Stringable {
    toString(): string;
}

export type Criteria = (path: string) => Stringable;
export type IsSameComparator = (path: string, criteria: Stringable) => boolean;
export type Extra = (path: string) => any;


export class CacheChangeOptions {
    onlyExistingFiles?: boolean = false;
    recursive?: boolean = false;
    verbose?: boolean = true;

    constructor(options: Partial<CacheChangeOptions> = {}) {
        Object.assign(this, options);
    }
}

export type StoreOpts = PartialRecursive<StoreOptions>;

export class StoreOptions extends CacheChangeOptions {
    path: string;
    criteria: Criteria | 'mtime' | 'md5' = 'mtime';
    isSameComparator: IsSameComparator;
    extra?: Extra;

    constructor(options: StoreOpts) {
        super(options);
        Object.assign(this, options);

        if (isUndefined(this.path)) {
            const root = findUpDir.sync('package.json');
            this.path = path.join(root || process.cwd(), '_cache.json');
        }
    }
}


export class Store {
    storeCollection: StoreCollection;
    criteriaFunc: Criteria;
    public options: StoreOptions;

    constructor(options: StoreOpts = {}) {
        this.options = new StoreOptions(options);
        this.storeCollection = new StoreCollection(this.options.path);
        this.init();
    }

    private init() {
        const { path, criteria, isSameComparator } = this.options;

        if (fs.existsSync(path)) {
            this.storeCollection.load();
        }

        for (const file of this.filePrintIterator()) {
            if (!fs.existsSync(file.filepath))
                this.deleteFile(file.filepath, file.collectionName);
        }

        if (criteria === 'mtime')
            this.criteriaFunc = path => mtime(path);
        else if (criteria === 'md5')
            this.criteriaFunc = path => md5(path);
        else
            this.criteriaFunc = criteria;

        if (isUndefined(isSameComparator))
            this.options.isSameComparator = (path, criteria) => this.criteriaFunc(path).toString() === criteria.toString();
    }

    public getCollection(...collectionName: string[]) {
        try {
            return this.storeCollection.getCollection(...collectionName);
        } catch (e) {
            return undefined;
        }
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

    public files(collectionName: string[], options: { recursive?: boolean; } = {}): FileIteration[] {
        if (collectionName.length === 0)
            return [ ...this.filePrintIterator() ];

        const { recursive } = Object.assign({}, this.options, options);

        if (recursive)
            return [ ...this.filePrintIterator(...collectionName) ];

        const storeCollection = this.getCollection(...collectionName);

        return isUndefined(storeCollection) ? [] : Object.entries(storeCollection.collection)
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
        return this.files(collectionName).map(f => f.filepath);
    }

    public addFile(file: string, ...collectionName: string[]) {

        const print: FilePrint = {
            mtime: mtime(file),
        };

        if (this.options.criteria !== 'mtime')
            print.criteria = this.criteriaFunc(file).toString();

        if (isDefined(this.options.extra))
            print.extra = this.options.extra(file);


        this.storeCollection.addFilePrint(file, print, ...collectionName);

        return this;
    }

    public filePrint(file: string, collectionName: string | string[]) {
        const fileprint = chain(() => this.getCollection(...ensureArray(collectionName)).collection[ file ]);

        return isFilePrint(fileprint) ? fileprint : undefined;
    }

    public fileHasChanged(filepath: string, collectionName: string[] = [], options?: CacheChangeOptions) {
        const opts = Object.assign({}, this.options, options);

        const collections = opts.recursive ?
            chain(() => [ ...this.getCollection(...collectionName).collectionIterator() ].map(c => [ c.name ] /* collectionName.concat(c.name) */), [ collectionName ]) :
            [ collectionName ];

        for (const collName of collections) {
            const files = this.files(collName);

            if (files.length === 0)
                continue; // return true;

            const file = files.find(f => f.filepath === filepath);
            if (!file)
                continue;

            // if file has been deleted
            if (!fs.existsSync(filepath))
                return true;

            const criteria: keyof FilePrint = this.options.criteria === 'mtime' ? 'mtime' : 'criteria';
            return !this.options.isSameComparator(filepath, file.fileprint[ criteria ]);
        }

        return opts.onlyExistingFiles ? false : true;
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
        this.storeCollection = new StoreCollection(this.options.path);
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
