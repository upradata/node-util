/* eslint-disable global-require */
import type VinylFile from 'vinyl';
import type MemoryFs from 'memory-fs';
import type fs from 'fs-extra';
import { assignRecursive, Function2, ObjectOf } from '@upradata/util';


export interface MockFS {
    files: ObjectOf<VinylFile>;
    addOrUpdateFile: (file: VinylFile) => void;
    deleteFile: (filepath: string) => void;
    clean: () => void;
}


export const mockFs = (): MockFS => {
    const MemoryFs = require('memory-fs');
    const fs = require('fs-extra');

    // variables starting with "mock" will not throw if there are used inside jest.mock even though there are not hoisted
    // https://github.com/kulshekhar/ts-jest/issues/1088
    const mockFiles: ObjectOf<VinylFile> = {};

    const addOrUpdateFile = (file: VinylFile) => {
        mockFiles[ file.path ] = file;

        if (file.stat.isDirectory && file.stat.isDirectory())
            fs.mkdirp(file.path);
        else
            fs.outputFileSync(file.path, file.contents.toString());
    };

    const deleteFile = (filepath: string) => {
        const fs: MemoryFs = (MemoryFs as any).__instance__;
        fs.unlinkSync(filepath);
        delete mockFiles[ filepath ];
    };


    const clean = () => {
        for (const file of Object.values(mockFiles)) {
            if (file.stat.isDirectory && file.stat.isDirectory())
                fs.rmdirSync(file.path);
            else
                fs.unlinkSync(file.path);
        }

        // eslint-disable-next-line no-multi-assign
        // (MemoryFs as any).__files__ = files = {};
        for (const k of Object.keys(mockFiles))
            delete mockFiles[ k ];
    };


    // will be hoisted in the function "mockFs"
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
            }

            return make;
        };

        const MemoryFsAny = MemoryFs as any;

        if (MemoryFsAny.__instance__)
            return MemoryFsAny.__instance__;

        /* const accessSync = (_path, _mode) => { };
        const access = makeAsync(accessSync);

        MemoryFsAny.prototype.access = access;
        MemoryFsAny.prototype.accessSync = accessSync; */
        MemoryFsAny.prototype.lstat = MemoryFs.prototype.stat;
        MemoryFsAny.prototype.lstatSync = MemoryFs.prototype.statSync;
        // MemoryFsAny.prototype.realpath = () => { };

        const oldStatSync = MemoryFsAny.prototype.statSync;
        MemoryFs.prototype.statSync = function (path: string) {
            let stats = undefined;

            try {
                stats = oldStatSync.call(fs, path);
            } catch (e) { }

            const files = mockFiles;
            return assignRecursive(stats || {}, files[ path ]?.stat);
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

        const instanceKeys = Object.getOwnPropertyNames(MemoryFsAny.__instance__);

        for (const k of Object.getOwnPropertyNames(MemoryFs.prototype)) {
            if (k !== 'constructor' && !instanceKeys.includes(k))
                MemoryFsAny.__instance__[ k ] = MemoryFs.prototype[ k ];
        }

        const fs = jest.requireActual('fs');

        for (const k of Object.getOwnPropertyNames(fs)) {
            if (typeof fs[ k ] === 'function' && !MemoryFsAny.__instance__[ k ])
                MemoryFsAny.__instance__[ k ] = fs[ k ];
        }

        return MemoryFsAny.__instance__;
    });


    return {
        files: mockFiles,
        addOrUpdateFile,
        deleteFile,
        clean
    };
};
