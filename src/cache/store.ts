import { ObjectOf, chain, isUndefined, isDefined } from '@upradata/util';
import findUp from 'find-up';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { warn } from './common';


const ENCODING = 'utf8';

export interface Stringable {
    toString(): string;
}

export type Criteria = (path: string) => Stringable;
export type IsSameComparator = (path: string, criteria: Stringable) => boolean;

export interface FilePrint {
    mtime: number;
    criteria?: string | number;
}

export type Collection = ObjectOf<FilePrint>;



export class StoreOptions {
    path: string;
    criteria?: Criteria | 'mtime' | 'md5' = 'mtime';
    isSameComparator?: IsSameComparator;

    constructor(options: Partial<StoreOptions>) {
        Object.assign(this, options);

        if (isUndefined(this.path)) {
            const root = findUp.sync(directory => {
                const hasPackageJson = findUp.sync.exists(path.join(directory, 'package.json'));
                return hasPackageJson && directory;
            }, { cwd: __dirname, type: 'directory' });

            this.path = path.join(root || process.cwd(), '_cache.json');
        }
    }
}


export class Store extends StoreOptions {
    store: ObjectOf<Collection>;
    criteriaFunc: Criteria;

    constructor(options: Partial<StoreOptions> = {}) {
        super(options);
        this.init();
    }

    private init() {
        if (fs.existsSync(this.path)) {
            this.store = this.load();
        } else {
            this.store = {};
        }

        if (this.criteria === 'mtime')
            this.criteriaFunc = path => this.mtime(path);
        else if (this.criteria === 'md5')
            this.criteriaFunc = path => this.md5(path);
        else
            this.criteriaFunc = this.criteria;

        if (isUndefined(this.isSameComparator))
            this.isSameComparator = (path, criteria) => this.criteriaFunc(path).toString() === criteria;
        // this.createCollectionIfNotExist('default');
    }

    private load() {
        return JSON.parse(fs.readFileSync(this.path, { encoding: ENCODING }));
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


    public createCollectionIfNotExist(collectionName: string = 'default') {
        if (!this.store[ collectionName ])
            this.store[ collectionName ] = {};

        return this.store[ collectionName ];
    }

    public collectionExists(collectionName: string = 'default') {
        return this.store[ collectionName ];
    }

    public fileExists(file: string, collectionName: string = 'default') {
        return this.collectionExists(collectionName) && this.store[ collectionName ][ file ];
    }

    public files(collectionName: string = 'default') {
        const collection = this.store[ collectionName ];
        return isUndefined(collection) ? [] : Object.entries(collection).map(([ file, print ]) => ({ file, ...print }));
    }

    public fileNames(collectionName: string = 'default') {
        const collection = this.store[ collectionName ];
        return isUndefined(collection) ? [] : Object.keys(collection);
    }

    public addFile(file: string, collectionName: string = 'default') {
        let collection = this.store[ collectionName ];

        if (isUndefined(collection))
            collection = this.createCollectionIfNotExist(collectionName);

        const print: FilePrint = {
            mtime: this.mtime(file),
            criteria: this.criteriaFunc(file).toString()
        };

        collection[ file ] = {
            mtime: this.mtime(file)
        };

        if (this.criteria !== 'mtime')
            collection[ file ].criteria = print.criteria;

        return this;
    }

    public filePrint(file: string, options: { type?: keyof FilePrint, collectionName?: string; } = {}) {
        const { collectionName = 'default', type } = options;

        if (!this.collectionExists(collectionName))
            return undefined;

        const print = this.store[ collectionName ][ file ];

        if (isUndefined(file) || isUndefined(print)) {
            return undefined;
        }

        return isUndefined(type) ? print : print[ type ];
    }

    public fileHasChanged(file: string, collectionName: string = 'default') {
        const collection = this.store[ collectionName ] || {};

        if (isUndefined(collection[ file ])) {
            // warn(`[check] No such file in collection: ${file}`);
            return true; // if doesn not exist yet ==> has changed because new one
        }

        const criteria: keyof FilePrint = this.criteria === 'mtime' ? 'mtime' : 'criteria';
        return !this.isSameComparator(file, collection[ file ][ criteria ]);
    }

    public deleteFile(file: string, collectionName: string = 'default') {
        const collection = chain(() => this.store[ collectionName ], {});

        if (isUndefined(collection[ file ]))
            warn(`[rmFile] No such file in collection: ${file}`);

        delete collection[ file ];
    }

    public collectionNames() {
        return Object.keys(this.store);
    }

    public deleteCollection(collectionName: string = 'default') {
        if (isDefined(this.store[ collectionName ]))
            this.store[ collectionName ] = {};

        return this;
    }

    public rmAll() {
        this.store = {};
    }

    public save() {
        fs.outputFileSync(this.path, JSON.stringify(this.store), { encoding: ENCODING });
        return this;
    }

    public *[ Symbol.iterator ](): Iterator<{ name: string; collection: Collection; }> {
        for (const [ name, collection ] of Object.entries(this.store))
            yield { name, collection };
    }

    public *iterator(): Iterator<{ name: string; collection: Collection; }> {
        yield* this;
    }

    public *collectionIterator(collectionName: string = 'default') {
        const collection = this.store[ collectionName ];

        if (isDefined(collection)) {
            for (const [ file, print ] of Object.entries(collection))
                yield { file, print };
        }

    }
}
