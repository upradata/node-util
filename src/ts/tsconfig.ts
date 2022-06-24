import path from 'path';
import * as tsconfig from 'tsconfig';
import { assignRecursive } from '@upradata/util';
import { TsConfig } from './tsconfig.json';
import { findUpDir } from '../find-up';




export interface TsConfigJson {
    path: { start: string; end: string; };
    config: TsConfig;
}

interface TsConfigData {
    path?: string;
    config: TsConfig;
}

export function getTsConfigJson(directory: string = process.cwd(), tsconfigFile: string = 'tsconfig.json'): TsConfigJson {

    const tsconfigDir = findUpDir.sync(tsconfigFile, { from: directory });

    const tsConfig: TsConfigData = tsconfig.loadSync(tsconfigDir, tsconfigFile);

    if (!tsConfig.path)
        throw new Error(`Cannot find tsconfig file "${path.join(directory, tsconfigFile)}"`);

    return mergeExtendedTsconfigJson(tsConfig, tsConfig.path);
}


const mergeTsconfigData = (tsconfigData: TsConfigData, rootTsconfigJsonPath: string) => ({
    path: { start: rootTsconfigJsonPath, end: tsconfigData.path },
    config: tsconfigData.config
});

const mergeExtendedTsconfigJson = (tsconfigData: TsConfigData, rootTsconfigJsonPath: string): TsConfigJson => {
    const tsconfigJson = tsconfigData.config;

    if (!tsconfigJson.extends)
        return mergeTsconfigData(tsconfigData, rootTsconfigJsonPath);

    const { dir, name } = path.parse(tsconfigJson.extends);
    const extendedTsconfigJsonFilePath = `${name}.json`;

    const extendedTsConfig = tsconfig.loadSync(dir, extendedTsconfigJsonFilePath);

    if (!extendedTsConfig.path)
        throw new Error(`Cannot find tsconfig file: "${path.join(dir, extendedTsconfigJsonFilePath)}"`);

    const mergedTsconfig = assignRecursive(tsconfigJson, { extends: undefined as TsConfig[ 'extends' ] }, extendedTsConfig.config as TsConfig);

    return mergeExtendedTsconfigJson({ ...extendedTsConfig, config: mergedTsconfig }, rootTsconfigJsonPath);
};
