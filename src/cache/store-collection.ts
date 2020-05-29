import { ObjectOf, isUndefined, isDefined } from '@upradata/util';
import fs from 'fs-extra';

export interface FilePrint {
    mtime: number;
    criteria?: string | number;
    extra?: any;
}


export function isFilePrint(v: any): v is FilePrint {
    return isDefined(v) && isDefined(v.mtime) && typeof v.mtime === 'number';
}

export type WalkActionBefore = (args: { node: StoreCollection | FilePrint, name: string, isLast: boolean; }) => any;
export type WalkActionAfter<R> = (args: { parentCollection: StoreCollection; node: StoreCollection | FilePrint, name: string, isLast: boolean; }) => R;


export type CollectionObject = ObjectOf<CollectionObject | FilePrint>;

export type FileIteration = { filepath: string; collectionName: string; collection: StoreCollection; fileprint: FilePrint; };

export class StoreCollection {
    collection: ObjectOf<StoreCollection | FilePrint> = {};
    collectionName: string;

    constructor(public path: string, public name: string = '', fromCollectionName: string = '') {
        this.collectionName = this.mergeNames(fromCollectionName, name);
    }

    load() {
        const content = JSON.parse(fs.readFileSync(this.path, { encoding: 'utf8' })) as CollectionObject;

        const loadCollection = (storeCollection: StoreCollection, content: CollectionObject) => {
            const collection = storeCollection.collection;

            for (const [ key, value ] of Object.entries(content)) {
                if (isFilePrint(value))
                    collection[ key ] = value;
                else
                    collection[ key ] = loadCollection(new StoreCollection(this.path, key, storeCollection.collectionName), value);
            }

            return storeCollection;
        };

        return loadCollection(this, content);
    }

    toObject() {
        const collection: CollectionObject = {};

        for (const [ key, node ] of Object.entries(this.collection)) {
            if (isFilePrint(node))
                collection[ key ] = node;
            else
                collection[ key ] = node.toObject();
        }

        return collection;
    }

    save() {
        const obj = this.toObject();
        fs.outputFileSync(this.path, JSON.stringify(obj), { encoding: 'utf8' });

        return this;
    }

    mergeCollectNames(...collectionName: string[]) {
        return collectionName.reduce((names, name) => this.mergeNames(names, name), '');
    }

    get collectionNames() {
        return Object.keys(this.collection).filter(nodeName => !isFilePrint(this.collection[ nodeName ]));
    }

    private mergeNames(from: string, key: string) {
        return `${from}${from === '' ? '' : '.'}${key}`;
    }

    fileExists(file: string, ...collectionName: string[]) {
        try {
            if (collectionName.length > 0) {
                const collection = this.getCollection(...collectionName).collection;
                return isFilePrint(collection[ file ]);
            }

            return [ ...this.filePrintIterator() ].find(f => f.filepath === file);
        } catch (e) {
            return false;
        }
    }

    getCollection(...collectionNames: string[]): StoreCollection {
        if (collectionNames.length === 0)
            return this;

        return this.walkTree({
            nodePath: collectionNames,
            actionBefore: ({ node: collection, name, isLast }) => {
                if (isUndefined(collection) && !isLast)
                    throw new Error(`The collection "${name}" does not exist in the cache store in ${this.path}`);
            },
            actionAfter: ({ node, name, isLast }) => {
                if (isLast) {
                    if (node && !(node instanceof StoreCollection))
                        throw new Error(`The collection "${name}" is not a collection in the cache store in ${this.path}`);

                    return node as StoreCollection;
                }
            }
        });
    }

    createCollectionIfNotExist(...collectionNames: string[]) {
        return this.walkTree({
            nodePath: collectionNames,
            actionBefore: ({ node, name }) => {
                if (node instanceof StoreCollection && isUndefined(node.collection[ name ]))
                    node.collection[ name ] = new StoreCollection(this.path, name, node.collectionName);
                else if (isFilePrint(node))
                    throw new Error(`"${name}" is not a collection in the cache store in ${this.path}`);
            },
            actionAfter: ({ node }) => node as StoreCollection
        });
    }

    addFilePrint(filename: string, filePrint: FilePrint, ...collectionNames: string[]) {
        const storeCollection = this.createCollectionIfNotExist(...collectionNames);
        storeCollection.collection[ filename ] = filePrint;
    }


    walkTree<R>(args: { nodePath: string[]; actionBefore?: WalkActionBefore; actionAfter?: WalkActionAfter<R>; }) {
        const { actionBefore, actionAfter } = args;
        let lastAction: R = undefined;

        const isPathMode = args.nodePath && args.nodePath.length > 0;
        const getNodePath = (nodePath: string[]) => isPathMode ? [ ...nodePath ] : undefined;

        // nodePath can be ['a.b','c','d.e.f'] that means [a,b,c,d,e,f]
        const mergedNodePath = isPathMode ? this.mergeCollectNames(...args.nodePath).split('.') : [];

        const walk = (storeCollection: StoreCollection, nodePath: string[]) => {
            const nodeNames = isPathMode ? (nodePath.length === 0 ? [] : [ nodePath.shift() ]) : Object.keys(storeCollection.collection);

            for (const name of nodeNames) {
                const isLast = isPathMode && nodePath.length === 0;

                if (actionBefore)
                    actionBefore({ node: storeCollection, name, isLast });

                // actionBefore can modify storeCollection so we get the value here and not before
                const node = storeCollection.collection[ name ];

                if (isUndefined(node))
                    throw new Error(`node "${name}" does not exist in the StoreCollection (path: "${this.path}", currentCollection: "${this.collectionName}")`);

                if (!isFilePrint(node))
                    walk(node, getNodePath(nodePath));


                if (actionAfter) {
                    const action = actionAfter({ parentCollection: storeCollection, node, name, isLast });
                    if (isLast)
                        lastAction = action;
                }
            }
        };

        walk(this, mergedNodePath);
        return lastAction;
    }


    * filePrintIterator(): IterableIterator<FileIteration> {

        for (const [ key, node ] of Object.entries(this.collection)) {
            if (isFilePrint(node))
                yield { filepath: key, fileprint: node, collectionName: this.collectionName, collection: this };
            else
                yield* node.filePrintIterator();
        }
    }

    * collectionIterator(): IterableIterator<{ fromName: string; name: string; collection: StoreCollection; }> {

        for (const [ key, node ] of Object.entries(this.collection)) {
            if (!isFilePrint(node)) {
                yield { fromName: this.collectionName, name: node.collectionName, collection: node };
                yield* node.collectionIterator();
            }
        }
    }
}
