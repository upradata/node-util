import { readFile, readFileSync } from 'fs-extra';
import JSON5 from 'json5';
import type { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package';


export type ReadJson<T> = {
    sync: (filename: string) => T;
    async: (filename: string) => Promise<T>;
};


const normalizeData = (data: string) => data === '' ? {} : JSON5.parse(data);

export const readJson = {
    sync: <T>(filename: string) => normalizeData(readFileSync(filename, 'utf8')) as T[],
    async: <T>(filename: string) => readFile(filename, 'utf8').then(normalizeData) as Promise<T[]>
};


export const readPackageJson = readJson as ReadJson<JSONSchemaForNPMPackageJsonFiles>;
