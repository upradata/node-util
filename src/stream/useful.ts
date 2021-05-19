import { passThrough } from './pass-through';
import stream from 'stream';
import duplexify, { Duplexify } from 'duplexify';
import { TT$, AnyFunction } from '@upradata/util';


type Return<S extends AnyFunction> = ReturnType<S> extends Promise<any> ? Promise<Duplexify> : Duplexify;

export const duplex = <S extends (source: stream.Transform) => TT$<stream.Readable>>(stream: S): Return<S> => {
    const out = passThrough.vinyl();

    const makeDuplex = (inn: stream.Readable) => {
        return duplexify.obj(out, inn);
    };

    const inn = stream(out);

    if (inn instanceof Promise)
        return inn.then(makeDuplex) as any;

    return makeDuplex(inn) as any;
};
