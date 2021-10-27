/* eslint-disable global-require */
/* eslint-disable no-case-declarations */
import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';
import ts from 'typescript';
import { Cache } from './cache';
import { readJson } from './json/read-json5';
import { red, yellow } from './template-style';
import { TscCompiler } from './ts/tsc';


export const requireJs = async <T = unknown>(filepath: string): Promise<T> => {
    try {
        // dynamic import expects file url instead of path and may fail
        // when windows path is provided
        const { default: imported } = await import(pathToFileURL(filepath).toString());
        return imported;
    } catch (importError) {
        // TODO remove require in v3
        try {
            return require(filepath);
        } catch (requireError) {
            // throw original error if es module is detected
            if (requireError.code === 'ERR_REQUIRE_ESM') {
                throw importError;
            } else {
                throw requireError;
            }
        }
    }
};



export interface RequireOptions {
    outDir: string;
    cache?: boolean;
    cacheFile?: string;
    deleteOutDir?: boolean;
    tsconfig?: ts.CompilerOptions;
}


export const requireModuleDefault = <T = unknown>(filepath: string, options: RequireOptions): T => importDefault(requireModule(filepath, options));

export function requireModule<T = unknown>(filepath: string, options?: RequireOptions): T {
    switch (path.extname(filepath)) {
        case '.json': return readJson.sync(filepath);
        case '.js': return require(filepath);
        case '.ts':
            const cache = new Cache({
                path: options.cacheFile || 'cache.json',
                criteria: 'md5'
            });

            const collectionName = 'tsc';

            if (options.cache || options.cacheFile) {
                if (!cache.isChangedFiles(collectionName, [ filepath ])) {
                    const compiledFile = cache.store.filePrint(filepath, collectionName).extra;
                    // check if file still exists in the cache directory
                    if (fs.existsSync(compiledFile))
                        return require(cache.store.filePrint(filepath, collectionName).extra);
                }
            }

            console.log(yellow`Compiling "${filepath}"`);

            const jsFile = TscCompiler.compileAndLoadModule(filepath, {
                ...options.tsconfig,
                outDir: options.outDir,
                deleteOutDir: options.deleteOutDir || false
            });

            cache.store.options.extra = _file => jsFile.filepath; // add js compiled file path to get if cache hit

            if (options.cache || options.cacheFile) {
                cache.addOrUpdateFile(collectionName, filepath);
                cache.save();
            }

            return jsFile.module;
        default:
            throw new Error(red`filepath has to be the path of a .json, .js or .ts file. Provided option was ${filepath}`);
    }
}

export function importDefault<T = unknown>(mod: any): T {
    return mod && mod.__esModule ? mod.default : mod;
}
