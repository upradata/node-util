import MemoryFs from 'memory-fs';
import fs from 'fs-extra'; // will be mocked
import VinylFile from 'vinyl';
import { ObjectOf, assignRecursive, Function2 } from '@upradata/util';

export let files: ObjectOf<VinylFile> = {};
(MemoryFs as any).__files__ = files;

export function addOrUpdateFile(file: VinylFile) {
    files[ file.path ] = file;

    if (file.stat.isDirectory && file.stat.isDirectory())
        fs.mkdirp(file.path);
    else
        fs.outputFileSync(file.path, file.contents.toString());
}

export function deleteFile(filepath: string) {
    const fs: MemoryFs = (MemoryFs as any).__instance__;
    fs.unlinkSync(filepath);
    delete files[ filepath ];
}


export function clean() {
    for (const file of Object.values(files)) {
        if (file.stat.isDirectory && file.stat.isDirectory())
            fs.rmdirSync(file.path);
        else
            fs.unlinkSync(file.path);
    }

    (MemoryFs as any).__files__ = files = {};
}


jest.mock('fs', () => { // 'fs-extra' is using 'graceful-fs' under the hood that is using 'fs'. Here we will use an in-memory filesystem
    const makeAsync = (fn: string | Function2<string, any>) => {
        function make(path: string, callback: Function2<Error, any>);
        function make(path: string, option: any, callback: Function2<Error, any>);
        function make(path: string, optionOrCb: Function2<Error, any> | any, callback?: Function2<Error, any>) {
            let cb = callback;
            let opts = optionOrCb;

            if (!cb) {
                cb = optionOrCb;
                opts = undefined;
            }

            try {
                const result = typeof fn === 'string' ? this[ `${fn}Sync` ](path, opts) : fn.call(this, path, opts);
                setImmediate(() => cb(null, result));
            } catch (e) {
                setImmediate(() => cb(e, null));
            }
        };

        return make;
    };

    const MemoryFsAny = MemoryFs as any;

    if (MemoryFsAny.__instance__)
        return MemoryFsAny.__instance__;

    const accessSync = (path, mode) => { };
    const access = makeAsync(accessSync);

    MemoryFsAny.prototype.access = access;
    MemoryFsAny.prototype.accessSync = accessSync;
    MemoryFsAny.prototype.lstat = MemoryFsAny.prototype.stat;
    MemoryFsAny.prototype.lstatSync = MemoryFs.prototype.statSync;
    MemoryFsAny.prototype.realpath = () => { };

    const oldStatSync = MemoryFsAny.prototype.statSync;
    MemoryFsAny.prototype.statSync = function (path: string) {
        let stats = undefined;

        try {
            stats = oldStatSync.call(fs, path);
        } catch (e) { }

        // jest will hoist the mock, so we need to recover the variable this way
        const files = MemoryFsAny.__files__;
        return assignRecursive(stats || {}, files[ path ] && files[ path ].stat);
    };

    // MemoryFs does not implement the options parameter
    // fsExtra is calling mkdirSync with { recursive: true } in fsExtra.outputFileSync
    const oldMkdirSync = MemoryFs.prototype.mkdirSync;
    MemoryFs.prototype.mkdirSync = function (this: MemoryFs, path: string, options: fs.MakeDirectoryOptions = {}) {
        if (options.recursive)
            return this.mkdirpSync(path);

        return oldMkdirSync.call(this, path);
    };

    MemoryFs.prototype.mkdir = makeAsync(MemoryFs.prototype.mkdirSync);

    MemoryFsAny.__instance__ = new MemoryFs();
    MemoryFsAny.__instance__.debug = 'MemoryFs';

    // fs is mocked as MemoryFs, that is a class. The problem is that it is an es6 class and when an instance is created, the method in the prototype are
    // not enumerable. So, when fs-extra is created, it is calling graceful-js that is calling "patch(clone(fs))"
    // and try to copy all 'fs' method, it cannot parse the methods of fs.__proto__ (even prototype is not enumerable - no Object.keys or whatever).
    // So I am obliged to recreate it by hand

    for (const k of Object.getOwnPropertyNames(MemoryFsAny.prototype)) {
        if (MemoryFsAny.__instance__[ k ])
            MemoryFsAny.__instance__[ k ] = MemoryFsAny.__instance__[ k ];
    }

    return MemoryFsAny.__instance__;
});
