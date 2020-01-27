import MemoryFs from 'memory-fs';
import fs from 'fs-extra'; // will be mocked
import VinylFile from 'vinyl';
import { ObjectOf, assignRecursive, isUndefined } from '@upradata/util';

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

jest.mock('fs', () => {
    const MemoryFsAny = MemoryFs as any;

    if (MemoryFsAny.__instance__)
        return MemoryFsAny.__instance__;

    const accessSync = (path, mode) => { };
    const access = function (path, optArg, callback) {
        let cb = callback;
        let opts = optArg;

        if (!cb) {
            cb = optArg;
            opts = undefined;
        }
        let result;
        try {
            result = accessSync(path, opts);
        } catch (e) {
            setImmediate(function () {
                cb(e);
            });

            return;
        }
        setImmediate(function () {
            cb(null, result);
        });
    };

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

    MemoryFsAny.__instance__ = new MemoryFs();
    return MemoryFsAny.__instance__;
});

jest.mock('fs-extra', () => {
    const fsExtra = jest.requireActual('fs-extra');
    const fs = require('fs');// mocked one
    // here fs is an instance of MemoryFs
    // the problem is that it is an es6 class and when an instance is created, the method in the prototype are 
    // not enumerable. So, when fs-extra is created and try to copy all 'fs' method, it cannot parse the methods
    // of fs.__proto__. So I am obliged to recreate it by hand

    const api = [
        'stat',
        'readdir',
        'mkdirp',
        'mkdir',
        'rmdir',
        'unlink',
        'readlink',
        'readFile',
        'access',
        'lstat',
        'exists',
        'writeFile'
    ];

    api.forEach(k => api.push(k + 'Sync'));

    api.push(
        'createReadStream',
        'createWriteStream',
        'realpath'
    );

    for (const key of api) {
        if (typeof fsExtra[ key ] === 'undefined') {
            fsExtra[ key ] = fs[ key ].bind(fs);
        }
    }

    return fsExtra;
});
