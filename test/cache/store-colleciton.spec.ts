import '../mocks/fs.mock';
import { StoreCollection, FilePrint } from '../../src/cache/store-collection';


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

    storeCollection.addFilePrint('key1', filePrints[ 0 ], 'collectionName1');
    storeCollection.addFilePrint('key2', filePrints[ 1 ], 'collectionName1');
    storeCollection.addFilePrint('key3', filePrints[ 2 ], 'collectionName1');
    storeCollection.addFilePrint('key4', filePrints[ 3 ], 'collectionName2');
    storeCollection.addFilePrint('key5', filePrints[ 4 ], 'collectionName2');
    storeCollection.addFilePrint('key6', filePrints[ 5 ], 'collectionName3.collectionName31');
    storeCollection.addFilePrint('key7', filePrints[ 6 ], 'collectionName3.collectionName31');
    storeCollection.addFilePrint('key8', filePrints[ 7 ], 'collectionName3.collectionName32');
    storeCollection.addFilePrint('key9', filePrints[ 8 ], 'collectionName3', 'collectionName32');
    storeCollection.addFilePrint('key10', filePrints[ 9 ], 'collectionName3.collectionName32', 'collectionName321.collectionName3211');


    const collectionObject = {
        collectionName1: {
            key1: { mtime: 1234657891, criteria: 'bonjour1' },
            key2: { mtime: 1234657892, criteria: 'bonjour2' },
            key3: { mtime: 1234657893, criteria: 'bonjour3' }
        },
        collectionName2: {
            key4: { mtime: 1234657894, criteria: 'bonjour4' },
            key5: { mtime: 1234657895, criteria: 'bonjour5' }
        },
        collectionName3: {
            collectionName31: {
                key6: { mtime: 1234657896, criteria: 'bonjour6' },
                key7: { mtime: 1234657897, criteria: 'bonjour7' }
            },
            collectionName32: {
                key8: { mtime: 1234657898, criteria: 'bonjour8' },
                key9: { mtime: 1234657899, criteria: 'bonjour9' },
                collectionName321: {
                    collectionName3211: {
                        key10: { mtime: 12346578910, criteria: 'bonjour10' }
                    }
                }
            }
        }
    };

    return {
        storeCollection,
        filePrints,
        collectionNames: [
            'collectionName1',
            'collectionName1',
            'collectionName1',
            'collectionName2',
            'collectionName2',
            'collectionName3.collectionName31',
            'collectionName3.collectionName31',
            'collectionName3.collectionName32',
            'collectionName3.collectionName32',
            'collectionName3.collectionName32.collectionName321.collectionName3211'
        ],
        collections: [
            'collectionName1',
            'collectionName2',
            'collectionName3',
            'collectionName3.collectionName31',
            'collectionName3.collectionName32',
            'collectionName3.collectionName32.collectionName321',
            'collectionName3.collectionName32.collectionName321.collectionName3211'
        ],
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
                collectionName: collectionNames[ i ],
                collection: storeCollection.getCollection(collectionNames[ i ])
            });

            ++i;
        }
    });

    it('souhld iterate on collections', () => {
        const { storeCollection, collections } = populateStoreCollection();
        let i = 0;

        for (const collection of storeCollection.collectionIterator()) {
            expect(collection).toEqual({
                name: collections[ i ],
                collection: storeCollection.getCollection(collections[ i ])
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
