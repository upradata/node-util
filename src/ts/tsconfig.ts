import * as tsconfig from 'tsconfig';
import { TsConfig } from './tsconfig.json';
import { assignRecursive } from '@upradata/util';

export interface TsConfigJson {
    path: { start: string; end: string; };
    config: TsConfig;
}

export function getTsConfigJson(directory: string = __dirname): TsConfigJson {

    const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(directory);
    if (!tsConfig.path)
        throw new Error('Cannot find tsconfig.json');


    let tsconfigJson = tsConfig.config;
    let baseTsConfig = tsConfig;

    while (tsconfigJson.extends) {
        baseTsConfig = tsconfig.loadSync(tsconfigJson.extends);
        if (!baseTsConfig.path)
            throw new Error(`Cannot find tsconfig.json in ${tsconfigJson.extends}`);

        tsconfigJson = assignRecursive(tsconfigJson, { extends: undefined }, baseTsConfig.config);
    }

    return { path: { start: tsConfig.path, end: baseTsConfig.path }, config: tsconfigJson };
}
