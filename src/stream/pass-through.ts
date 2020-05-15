import through from 'through2';
import stream from 'stream';
import VinylFile from 'vinyl';

export type PassThroughFunction = (file: VinylFile) => any;

export function passThrough(passThrounghFunc?: PassThroughFunction) {

    return through.obj(async function (file: VinylFile, encoding: string, cb: stream.TransformCallback) {
        if (passThrounghFunc)
            await passThrounghFunc(file);

        cb(null, file);
    });
}
