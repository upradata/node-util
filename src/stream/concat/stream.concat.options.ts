import { ensureArray, isDefined } from '@upradata/util';
import { ConcatStreamGenerator, ConcatStreamGenerators } from './types';


export type ConcatOptionsType = ConcatOptions | ConcatStreamGenerator | ConcatStreamGenerators;


export class ConcatOptions {
    bindThis?: any;
    generators: ConcatStreamGenerators;

    constructor(options: ConcatOptionsType) {
        const opts = isConcatOptions(options) ? options : {
            generators: ensureArray(options),
            bindThis: null
        };

        Object.assign(this, opts);
    }
}



export function isConcatOptions(options: ConcatOptions | ConcatStreamGenerator | ConcatStreamGenerators): options is ConcatOptions {
    return isDefined((options as any).generators);
}
