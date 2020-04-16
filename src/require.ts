import path from 'path';
import { readJson } from './json/read-json5';
import { TscCompiler } from './ts/tsc';
import { red } from './style/basic-styles';


export function requireModule(filepath: string, options: { outDir: string; }) {
    switch (path.extname(filepath)) {
        case '.json': return readJson.sync(filepath);
        case '.js': return importDefault(require(filepath));
        case '.ts': return importDefault(TscCompiler.compileAndLoadModule(filepath, options));
        default:
            throw new Error(red`filepath has to be the path of a .json, .js or .ts file. Provided option was ${filepath}`);
    }
}

export function importDefault(mod: any) {
    return mod && mod.__esModule ? mod.default : mod;
}
