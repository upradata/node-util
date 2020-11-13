import { TT$ } from '@upradata/util';
import through from 'through2';
import stream from 'stream';
import VinylFile from 'vinyl';
import sink from 'lead';

export type PassThroughFunctionObj<Data> = { transform?: (data: Data) => TT$<any>; flush?: () => TT$<any>; };
export type PassThroughFunction<Data> = (data: Data) => TT$<any>;
export type PassThroughFunctionOptions<Data> = PassThroughFunctionObj<Data> | PassThroughFunction<Data>;

export type PassThroughOptions = stream.DuplexOptions & { sink?: boolean; };


export function passThroughImpl<Data, Opts extends PassThroughOptions>(options: Opts, passThrounghFunc?: PassThroughFunctionOptions<Data>):
    Opts[ 'sink' ] extends true ? NodeJS.ReadableStream : stream.Transform {

    const transform = passThrounghFunc ? typeof passThrounghFunc === 'function' ? passThrounghFunc : passThrounghFunc.transform : undefined;
    const flush = passThrounghFunc ? typeof passThrounghFunc === 'function' ? undefined : passThrounghFunc.flush : undefined;

    const stream = through(options, async function (data: Data, encoding: string, cb: stream.TransformCallback) {
        if (transform)
            await transform(data);

        cb(null, data);

    }, async cb => {
        if (flush)
            await flush();

        cb();
    });

    return options.sink ? sink(stream) : stream as any;
}

export const passThrough = <Data>(passThrounghFunc?: PassThroughFunctionOptions<Data>, options?: PassThroughOptions) => passThroughImpl(
    { objectMode: false, encoding: 'utf8', ...options }, passThrounghFunc
);

const passThroughVinyl = (passThrounghFunc?: PassThroughFunctionOptions<VinylFile>, options?: PassThroughOptions) => passThroughImpl(
    { ...options, objectMode: true }, passThrounghFunc
);

passThroughVinyl.sink = (passThrounghFunc?: PassThroughFunctionOptions<VinylFile>, options?: PassThroughOptions) => passThrough.vinyl(passThrounghFunc, { ...options, sink: true });

passThrough.vinyl = passThroughVinyl;


passThrough.sink = <Data>(passThrounghFunc?: PassThroughFunctionOptions<Data>, options?: PassThroughOptions) => passThrough(passThrounghFunc, { ...options, sink: true });
