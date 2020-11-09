import VinylFile from 'vinyl';
import { IfOptions, Mode } from './types';
import { ternary } from './ternary';
/* import stream from 'stream';
import through2 from 'through2';
import sink from 'lead';
import { passThrough } from '../pass-through'; */

export const ifthen = <Data, ConcatMode extends Mode>(options: IfOptions<Data, ConcatMode>) => ternary({ ...options, stream: { objectMode: false, ...options.stream } });
ifthen.vinyl = <ConcatMode extends Mode>(options: IfOptions<VinylFile, ConcatMode>) => ternary({ ...options, stream: { ...options.stream, objectMode: true } });

/*
const make = (n: number) => Array(n).fill(1).map((_, i) => i);


async function* gen1() {
    for (const i of make(10))
        yield `${i}`;

    for (const i of make(10).map(i => -i))
        yield `${i}`;
}



const caca = through2({ objectMode: false, encoding: 'utf8' }, function (i: string, encoding: string, cb: stream.TransformCallback) {
    //  console.log(i);
    this.push(`caca: ${i}`);
    return cb();
});

const pipi = through2({ objectMode: false, encoding: 'utf8' }, function (i: string, encoding: string, cb: stream.TransformCallback) {
    this.push(`pipi: ${i}`);
    return cb();
});

 stream.Readable.from(gen1(), { objectMode: false, encoding: 'utf8' }).pipe(ifthen({
    condition: i => parseInt(i.toString()) >= 0,
    true: caca,
    false: pipi,
    stream: { objectMode: false, encoding: 'utf8' }
}))
    .pipe(sink(passThrough(i => console.log(i.toString()))));
 */
