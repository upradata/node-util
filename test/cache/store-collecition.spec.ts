import '../mocks/fs.mock';
import { StoreCollection, FilePrint, CollectionObject } from '../../src/cache/store-collection';


const createStoreCollection = () => new StoreCollection('/any/path/cache.json');

const generateFilePrints = (nb: number) => {
    const filePrints: FilePrint[] = [];

    for (let i = 1; i <= nb; ++i)
        filePrints.push({ mtime: parseInt('123465789' + i), criteria: 'bonjour' + i });

    return filePrints;
};


const populateStoreCollection = () => {
    const storeCollection = createStoreCollection();
    const filePrints: FilePrint[] = generateFilePrints(10);

    const collectionNames = [
        { name: 'collectionName1', param: [ 'collectionName1' ] },
        { name: 'collectionName1', param: [ 'collectionName1' ] },
        { name: 'collectionName1', param: [ 'collectionName1' ] },
        { name: 'collectionName2', param: [ 'collectionName2' ] },
        { name: 'collectionName2', param: [ 'collectionName2' ] },
        { name: 'collectionName3.collectionName31', param: [ 'collectionName3.collectionName31' ] },
        { name: 'collectionName3.collectionName31', param: [ 'collectionName3.collectionName31' ] },
        { name: 'collectionName3.collectionName32', param: [ 'collectionName3.collectionName32' ] },
        { name: 'collectionName3.collectionName32', param: [ 'collectionName3', 'collectionName32' ] },
        {
            name: 'collectionName3.collectionName32.collectionName321.collectionName3211',
            param: [ 'collectionName3.collectionName32', 'collectionName321.collectionName3211' ]
        },
    ];

    for (let i = 0; i < collectionNames.length; ++i) {
        storeCollection.addFilePrint(`key${i + 1}`, filePrints[ i ], ...collectionNames[ i ].param);
    }

    const collectionObject = {
        collectionName1: {
            key1: { mtime: 1234657891, criteria: filePrints[ 0 ].criteria },
            key2: { mtime: 1234657892, criteria: filePrints[ 1 ].criteria },
            key3: { mtime: 1234657893, criteria: filePrints[ 2 ].criteria }
        },
        collectionName2: {
            key4: { mtime: 1234657894, criteria: filePrints[ 3 ].criteria },
            key5: { mtime: 1234657895, criteria: filePrints[ 4 ].criteria }
        },
        collectionName3: {
            collectionName31: {
                key6: { mtime: 1234657896, criteria: filePrints[ 5 ].criteria },
                key7: { mtime: 1234657897, criteria: filePrints[ 6 ].criteria }
            },
            collectionName32: {
                key8: { mtime: 1234657898, criteria: filePrints[ 7 ].criteria },
                key9: { mtime: 1234657899, criteria: filePrints[ 8 ].criteria },
                collectionName321: {
                    collectionName3211: {
                        key10: { mtime: 12346578910, criteria: filePrints[ 9 ].criteria }
                    }
                }
            }
        }
    };

    const getCollections = (collectionO: CollectionObject): string[] => {
        return Object.entries(collectionO).flatMap(([ k, v ]) => {
            if (k.startsWith('collectionName')) {
                const names = getCollections(v as CollectionObject).map(c => `${k}${c ? `.${c}` : c}`);
                return [ k, ...names ];
            }

            return [];
        });
    };

    const fromName = (c: string) => c.split('.').slice(0, -1).join('.');
    const collections = getCollections(collectionObject).map(c => ({ name: c, from: fromName(c) }));

    return {
        storeCollection,
        filePrints,
        collectionNames,
        collections,
        collectionObject
    };
};


describe('Test suite for StoreCollection', () => {
    it('should add a FilePrint in a new shallow collection', () => {
        const storeCollection = createStoreCollection();
        const filePrint: FilePrint = { mtime: 123465789, criteria: 'bonjour' };

        storeCollection.addFilePrint('key1', filePrint, 'collectionName');

        expect((storeCollection.collection[ 'collectionName' ] as StoreCollection).collection.key1 as FilePrint).toEqual(filePrint);
        expect(storeCollection.getCollection('collectionName').collection.key1).toEqual(filePrint);
    });

    it('should add few FilePrints in new shallow collections', () => {
        const { storeCollection, filePrints } = populateStoreCollection();

        expect(storeCollection.getCollection('collectionName1').collection.key1).toEqual(filePrints[ 0 ]);
        expect(storeCollection.getCollection('collectionName1').collection.key2).toEqual(filePrints[ 1 ]);
        expect(storeCollection.getCollection('collectionName1').collection.key3).toEqual(filePrints[ 2 ]);

        expect(storeCollection.getCollection('collectionName2').collection.key4).toEqual(filePrints[ 3 ]);
        expect(storeCollection.getCollection('collectionName2').collection.key5).toEqual(filePrints[ 4 ]);

        expect(storeCollection.getCollection('collectionName3.collectionName31').collection.key6).toEqual(filePrints[ 5 ]);
        expect(storeCollection.getCollection('collectionName3.collectionName31').collection.key7).toEqual(filePrints[ 6 ]);
        expect(storeCollection.getCollection('collectionName3.collectionName32').collection.key8).toEqual(filePrints[ 7 ]);

        expect(storeCollection.getCollection('collectionName3', 'collectionName32').collection.key9).toEqual(filePrints[ 8 ]);
        expect(storeCollection.getCollection('collectionName3.collectionName32', 'collectionName321.collectionName3211').collection.key10).toEqual(filePrints[ 9 ]);
    });

    it('souhld iterate on fileprints', () => {
        const { storeCollection, filePrints, collectionNames } = populateStoreCollection();
        let i = 0;

        for (const filePrint of storeCollection.filePrintIterator()) {
            expect(filePrint).toEqual({
                filepath: `key${i + 1}`,
                fileprint: filePrints[ i ],
                collectionName: collectionNames[ i ].name,
                collection: storeCollection.getCollection(collectionNames[ i ].name)
            });

            ++i;
        }
    });

    it('souhld iterate on collections', () => {
        const { storeCollection, collections } = populateStoreCollection();
        let i = 0;

        for (const collection of storeCollection.collectionIterator()) {
            expect(collection).toEqual({
                fromName: collections[ i ].from,
                name: collections[ i ].name,
                collection: storeCollection.getCollection(collections[ i ].name)
            });

            i++;
        }
    });

    it('should convert the StoreCollection in a plain object', () => {
        const { storeCollection, collectionObject } = populateStoreCollection();
        expect(storeCollection.toObject()).toEqual(collectionObject);
    });

    it('should save the StoreCollection and load it back', () => {
        const { storeCollection, collectionObject } = populateStoreCollection();

        storeCollection.save();
        storeCollection.collection = {};
        storeCollection.load();
        expect(storeCollection.toObject()).toEqual(collectionObject);
    });
});
