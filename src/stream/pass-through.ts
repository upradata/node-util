import through from 'through2';
import stream from 'stream';
import VinylFile from 'vinyl';

export type PassThroughFunction<Data> = (data: Data) => any;

export function passThroughImpl<Data>(options: stream.DuplexOptions, passThrounghFunc?: PassThroughFunction<Data>) {

    return through(options, async function (data: Data, encoding: string, cb: stream.TransformCallback) {
        if (passThrounghFunc)
            await passThrounghFunc(data);

        cb(null, data);
    });
}

export const passThrough = <Data>(passThrounghFunc?: PassThroughFunction<Data>, options?: stream.DuplexOptions) => passThroughImpl(
    { objectMode: false, encoding: 'utf8', ...options }, passThrounghFunc
);

passThrough.vinyl = (passThrounghFunc?: PassThroughFunction<VinylFile>, options?: stream.DuplexOptions) => passThroughImpl(
    { ...options, objectMode: true }, passThrounghFunc
);
