import { map } from '@upradata/util';
import { join, dirname, isAbsolute } from 'path';
import { register } from 'tsconfig-paths';
import { getTsConfigJson, TsConfigJson } from './tsconfig';
import { TsConfig } from './tsconfig.json';

export class RegisterOptions {
    baseUrl?: string = undefined;
    mainFields?: string[] = [ 'main' ];
    fromDirectory?: string = undefined;
    tsconfig?: TsConfigJson = undefined;
    transform?: (absolutePath: string, tsconfig: TsConfig) => string = s => s;
}

export function registerPaths(options: RegisterOptions) {
    const opts = Object.assign(new RegisterOptions(), options);

    if (!opts.tsconfig) {
        const dir = opts.fromDirectory || '.';
        opts.tsconfig = getTsConfigJson(dir);
    }

    const { tsconfig, transform } = opts;
    const { compilerOptions } = tsconfig.config;

    const paths = compilerOptions.paths as Record<string, string[]>;
    const tsRootDir = dirname(tsconfig.path.end);

    // transform relative paths to absolute ones.
    // Important if registration is not done in the root project folder

    const absolutPaths = map(paths, (path, maps) => ({
        key: join(tsRootDir, path),
        value: maps
    }));

    const allPaths = { ...paths, ...absolutPaths } as Record<string, string[]>;
    const transformedPaths = map(allPaths, (path, maps) => ({ key: path, value: maps.map(m => transform(m, tsconfig.config)) }));

    // better to have an absolute path if the cwd is not where tsconfig.json is
    let baseUrl = opts.baseUrl || compilerOptions.baseUrl || tsRootDir;

    if (!isAbsolute(baseUrl))
        baseUrl = join(tsRootDir, baseUrl);

    register({
        baseUrl,
        paths: transformedPaths,
        mainFields: opts.mainFields
    });
}
