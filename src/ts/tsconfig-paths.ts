import { join, dirname } from 'path';
import * as tsConfigPaths from 'tsconfig-paths';
import { TsConfigJson } from './tsconfig';


export function registerPaths(tsconfig: TsConfigJson) {
    // transform relative paths to absolute ones.
    // Important if registration is not done in the root project folder
    const paths = Object.entries(tsconfig.config.compilerOptions.paths).map(([ path, maps ]) => {
        return [ join(tsconfig.path.end, path), maps ];
    });

    tsConfigPaths.register({
        baseUrl: tsconfig.config.compilerOptions.baseUrl || dirname(tsconfig.path.start),
        paths: Object.fromEntries(paths)
    });
}
