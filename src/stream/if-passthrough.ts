import through from 'through2';
import stream from 'stream';
import VinylFile from 'vinyl';
import { Function1Arg, TT$ } from '@upradata/util';

export interface IfPassThroughOptions {
    condition: Function1Arg<VinylFile, TT$<boolean>>;
    true: Function1Arg<VinylFile, TT$<void>>;
    false?: Function1Arg<VinylFile, TT$<void>>;
}

export function ifPassthrough(options?: IfPassThroughOptions) {
    const { condition, true: trueHandler, false: falseHandler } = options;

    return through.obj(async function (file: VinylFile, encoding: string, cb: stream.TransformCallback) {
        await condition(file) ? await trueHandler(file) : await falseHandler(file);

        cb(null, file);
    });
}
