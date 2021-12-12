import path from 'path';
import * as tsconfig from 'tsconfig';
import { assignRecursive } from '@upradata/util';
import { TsConfig } from './tsconfig.json';


export interface TsConfigJson {
    path: { start: string; end: string; };
    config: TsConfig;
}

interface TsConfigData {
    path?: string;
    config: TsConfig;
}

export function getTsConfigJson(directory: string = __dirname, filename: string = 'tsconfig.json'): TsConfigJson {

    const tsConfig: TsConfigData = tsconfig.loadSync(directory, filename);

    if (!tsConfig.path)
        throw new Error(`Cannot find tsconfig file "${path.join(directory, filename)}"`);

    return mergeExtendedTsconfigJson(tsConfig, tsConfig.path);
}


const mergeTsconfigData = (tsconfigData: TsConfigData, rootTsconfigJsonPath: string) => ({
    path: { start: rootTsconfigJsonPath, end: tsconfigData.path },
    config: tsconfigData.config
});

const mergeExtendedTsconfigJson = (tsconfigData: TsConfigData, rootTsconfigJsonPath: string) => {
    const tsconfigJson = tsconfigData.config;

    if (!tsconfigJson.extends)
        return mergeTsconfigData(tsconfigData, rootTsconfigJsonPath);

    const { dir, name } = path.parse(tsconfigJson.extends);
    const extendedTsconfigJsonFilePath = `${name}.json`;

    const extendedTsConfig = tsconfig.loadSync(dir, extendedTsconfigJsonFilePath);

    if (!extendedTsConfig.path)
        throw new Error(`Cannot find tsconfig file: "${path.join(dir, extendedTsconfigJsonFilePath)}"`);

    const mergedTsconfig = assignRecursive(tsconfigJson, { extends: undefined }, extendedTsConfig.config);

    return mergeExtendedTsconfigJson({ ...extendedTsConfig, config: mergedTsconfig }, rootTsconfigJsonPath);
};;
