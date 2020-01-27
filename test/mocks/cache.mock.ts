
import * as fs from '../mocks/fs.mock';
import VinylFile from 'vinyl';
import { Cache, CacheOptions } from '../../src/cache';
import { CollectionObject } from '../../src/cache/store-collection';
import { ensureArray, assignRecursive } from '@upradata/util';

export interface CacheMockOptions {
    cache?: Partial<CacheOptions>;
    mock?: {
        deleteAllCollections?: boolean;
        nb?: number;
        criteria?: (i: number, file: VinylFile) => string;
    };
}

export class CacheMock {
    cache: Cache;
    private _files = new Set<VinylFile>();
    collectionObject: CollectionObject = {};
    collectionNames: string[] = [];
    collectionUniqueNames: string[] = [];
    options: CacheMockOptions;

    constructor(options?: CacheMockOptions) {
        this.options = assignRecursive({ mock: { nb: 10, deleteAllCollections: true }, cache: {} }, options);

        this.cache = this.createCache();
        if (this.options.mock.deleteAllCollections)
            this.cache.deleteAllCollections();
    }

    get files() {
        return [ ...this._files ];
    }

    createCache() {
        return new Cache(Object.assign({ path: '/path/to/project/cache-dir/cache.json' }, this.options.cache));
    }

    generateFiles(nb: number) {
        const files: VinylFile[] = [];

        for (let i = 1; i <= nb; ++i) {
            const file = new VinylFile({
                path: `/path/to/file_${i}.txt`,
                contents: Buffer.from(`Content ${i}th`),
                stat: {
                    isDirectory: () => false,
                    mtime: { getTime: () => parseInt('123465789' + i) }
                } as any
            });

            files.push(file);
        }

        return files;
    }


    addEntries(args: { files: VinylFile[], collectionName: string | string[], indexes?: number[]; }) {
        const { collectionName, files } = args;
        const { criteria } = this.options.mock;

        for (const file of files) {
            this._files.add(file);
            fs.addOrUpdateFile(file);
        }

        const paths = files.map(f => f.path);
        const indexes = args.indexes || Object.keys(paths).map(k => parseInt(k));

        const names = this.cache.store.storeCollection.mergeCollectNames(...ensureArray(collectionName)).split('.');
        let o = this.collectionObject;

        for (const name of names) {
            o[ name ] = o[ name ] || {};
            o = o[ name ] as CollectionObject;
        }

        this.cache.addOrUpdateFile(collectionName, ...indexes.map(i => paths[ i ]));
        this.collectionUniqueNames.push(names.join('.'));

        for (const i of indexes) {
            o[ paths[ i ] ] = { mtime: files[ i ].stat.mtime.getTime() };
            if (criteria)
                o[ paths[ i ] ].criteria = criteria(i, files[ i ]);

            this.collectionNames[ i ] = names.join('.');
        }
    }

    populateCache() {
        const files = this.generateFiles(this.options.mock.nb);

        this.addEntries({ files, collectionName: 'collectionName1', indexes: [ 0, 1, 2 ] });
        this.addEntries({ files, collectionName: 'collectionName2', indexes: [ 3, 4 ] });
        this.addEntries({ files, collectionName: 'collectionName3.collectionName31', indexes: [ 5, 6 ] });
        this.addEntries({ files, collectionName: 'collectionName3.collectionName32', indexes: [ 7, 8 ] });
        this.addEntries({
            files,
            collectionName: [ 'collectionName3.collectionName32', 'collectionName321.collectionName3211' ],
            indexes: [ 9 ]
        });

        return this;
    }
}
