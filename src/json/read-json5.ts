import JSON5 from 'json5';
import { readFileSync, readFile } from 'fs-extra';
import { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package';


export function readJson(filename: string, mode: 'sync' | 'async'): Promise<JSONSchemaForNPMPackageJsonFiles> | JSONSchemaForNPMPackageJsonFiles {

    const normalizeData = data => data === '' ? {} : JSON5.parse(data);

    if (mode === 'sync') {
        const data = readFileSync(filename, 'utf8');
        return normalizeData(data);
    }

    return readFile(filename, 'utf8').then(normalizeData);
}

export function readJsonSync(filename: string): JSONSchemaForNPMPackageJsonFiles {
    return readJson(filename, 'sync') as JSONSchemaForNPMPackageJsonFiles;
}

export function readJsonAsync(filename: string): Promise<JSONSchemaForNPMPackageJsonFiles> {
    return readJson(filename, 'async') as Promise<JSONSchemaForNPMPackageJsonFiles>;
}
