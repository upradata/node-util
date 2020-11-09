import { isConcatGeneratorFunction, ConcatStreamGenerator, ConcatStreamGenerators, PipeStreamGenerator, isPipeGeneratorFunction } from './types';
import { ReadableStream, Stream } from '../types';
import { isDefined, TT$, ensureArray, ensurePromise } from '@upradata/util';
import mergeStream from 'merge2';
import { isReadable } from '../common';
import { ConcatOptions, ConcatOptionsType } from './stream.concat.options';


type RecursiveArray<T> = Array<T | RecursiveArray<T>>;




export class ConcatStreams {
    public stream: Stream;
    private lastStream$: Promise<Stream>;

    constructor(stream: TT$<ReadableStream>) {
        this.lastStream$ = ensurePromise(stream);
    }

    private async buildStream(source: Stream, generators: ConcatStreamGenerators, bindThis: any): Promise<Stream> {

        const build = async (generators: ConcatStreamGenerator): Promise<RecursiveArray<ReadableStream>> => {
            const result: TT$<ReadableStream | RecursiveArray<ReadableStream>> = [];
            const gens = await generators;

            const listGenerators = ensureArray(gens).filter(g => !!g);

            await Promise.all(listGenerators.map(async generator => {
                const genPromise = ensurePromise<ConcatStreamGenerator>(generator);
                const gen = await genPromise;

                if (isConcatGeneratorFunction(gen)) {
                    const res = await gen.call(bindThis, source) as ConcatStreamGenerator;
                    result.push(await build(res));
                } else if (Array.isArray(gen))
                    result.push(await build(gen));
                else
                    result.push(gen as any);
            }));

            return result.map(e => Array.isArray(e) && e.length === 1 ? e[ 0 ] : e);
        };

        const streams = await build(generators) as ReadableStream[];
        return mergeStream(...streams);
        // return Promise.all(await build(generators)).then(streams => {
        //     return /* streams.length === 1 ? streams[ 0 ] : */ mergeStream(...streams as any);
        // });

    }

    concat(options: ConcatOptionsType) {
        const { bindThis, generators } = new ConcatOptions(options);

        this.lastStream$ = this.lastStream$.then(lastStream => {
            const build = this.buildStream(lastStream, generators, bindThis);
            return build;
        });


        return this;
    }

    pipe(streamGenerator: PipeStreamGenerator) {
        this.lastStream$ = this.lastStream$.then(async s => {
            if (!isReadable(s))
                throw new Error(`StreamConcat.pipe: last stream before pipe must be Readable`);

            const generator = await streamGenerator;

            const streamToPipe = isPipeGeneratorFunction(generator) ? await generator() : generator;
            return s.pipe(streamToPipe);
        });

        return this;
    }

    get $() {
        this.lastStream$ = this.lastStream$.then(stream => {
            this.stream = stream;
            return stream;
        });

        return this.lastStream$;
    }

    done<S extends Stream>() {
        return this.$ as Promise<S>;
    }
}

export const concatStreams = (stream: TT$<ReadableStream>) => new ConcatStreams(stream);

/* export function concatable(options: ConcatOptionsType) {
    return options;
} */
