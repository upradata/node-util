import path from 'path';
import fs from 'fs-extra';
import { readJson } from './json/read-json5';
import { TscCompiler } from './ts/tsc';
import { Cache } from './cache';
import { red, yellow } from './style/basic-styles';


export function requireModule(filepath: string, options: { outDir: string; cache?: boolean; cacheFile?: string; deleteOutDir?: boolean; }) {
    switch (path.extname(filepath)) {
        case '.json': return readJson.sync(filepath);
        case '.js': return importDefault(require(filepath));
        case '.ts':
            const cache = new Cache({
                path: options.cacheFile || 'cache.json',
                criteria: 'md5'
            });

            const collectionName = 'tsc';

            if (options.cache || options.cacheFile) {
                if (!cache.isChangedFiles(collectionName, [ filepath ]))
                    return importDefault(require(cache.store.filePrint(filepath, collectionName).extra));
            }

            console.log(yellow`Compiling "${filepath}"`);

            const jsFile = TscCompiler.compileAndLoadModule(filepath, { deleteOutDir: false, ...options });
            cache.store.options.extra = file => jsFile.filepath; // add js compiled file path to get if cache hit

            if (options.cache || options.cacheFile) {
                cache.addOrUpdateFile(collectionName, filepath);
                cache.save();
            }

            if (options.deleteOutDir)
                fs.removeSync(options.outDir);

            return importDefault(jsFile.module);
        default:
            throw new Error(red`filepath has to be the path of a .json, .js or .ts file. Provided option was ${filepath}`);
    }
}

export function importDefault(mod: any) {
    return mod && mod.__esModule ? mod.default : mod;
}
