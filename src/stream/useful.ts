import { passThrough } from './pass-through';
import stream from 'stream';
import duplexify from 'duplexify';
import { TT$ } from '@upradata/util';


export const duplex = async (stream: (source: stream.Transform) => TT$<stream.Readable>) => {
    const inn = passThrough.vinyl();
    return duplexify.obj(inn, await stream(inn));
};
