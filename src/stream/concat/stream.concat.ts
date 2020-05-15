import { ReadableStream, WritableStream, Stream } from '../types';
import { isDefined, TT$, isPromise } from '@upradata/util';
import mergeStream from 'merge2';
import { isReadable } from '../common';


export type StreamGenerator = TT$<ReadableStream> | TT$<(source: ReadableStream) => TT$<ReadableStream | StreamGenerators>> | StreamGenerators;
export type StreamGenerators = TT$<StreamGenerator[]>;
// export type StreamGenerator$ = Promise<ReadableStream> | Promise<(source: ReadableStream) => Promise<ReadableStream | StreamGenerators>> | Promise<StreamGenerators>;

export type StreamGeneratorArray = TT$<(source: ReadableStream) => TT$<ReadableStream | StreamGeneratorArray[]>> | StreamGeneratorArray[];
// export type StreamGeneratorArray$ = Promise<(source: ReadableStream) => Promise<ReadableStream | StreamGeneratorArray[]>> | Promise<StreamGeneratorArray[]>;


function isGeneratorFunction(gen: any): gen is (source: ReadableStream) => TT$<ReadableStream | StreamGenerators> {
    return typeof gen === 'function';
}

export type ConcatOptionsType = ConcatOptions | StreamGenerator | StreamGenerators;

type RecursiveArray<T> = Array<T | RecursiveArray<T>>;

export class ConcatOptions {
    bindThis?: any;
    generators: StreamGenerators;

    constructor(options: ConcatOptionsType) {
        const opts = isConcatOptions(options) ? options : {
            generators: Array.isArray(options) ? options : [ options ],
            bindThis: undefined
        };

        Object.assign(this, opts);
    }
}


export function isConcatOptions(options: ConcatOptions | StreamGenerator | StreamGenerators): options is ConcatOptions {
    return isDefined((options as any).generators);
}

export class ConcatStreams {
    public stream: Stream;
    private lastStream$: Promise<Stream>;

    constructor(stream: TT$<ReadableStream>) {
        this.lastStream$ = isPromise(stream) ? stream : Promise.resolve(stream);
    }

    private async buildStream(source: Stream, generators: StreamGenerators, bindThis: any) {

        const build = async (generators: StreamGenerator): Promise<RecursiveArray<ReadableStream>> => {
            const result: TT$<ReadableStream | RecursiveArray<ReadableStream>> = [];
            const gens = await generators;
            const promisesLoop: Promise<any>[] = [];

            const listGenerators = (Array.isArray(gens) ? gens : [ gens ]).filter(g => !!g);

            for (const generator of listGenerators) {
                const genPromise = isPromise(generator) ? generator as Promise<StreamGenerator> : Promise.resolve(generator);

                const buildPromise = genPromise.then(async gen => {
                    if (isGeneratorFunction(gen)) {
                        const res = await gen.call(bindThis, source) as StreamGenerator;
                        result.push(await build(res));
                    } else if (Array.isArray(gen))
                        result.push(await build(gen));
                    else
                        result.push(gen as any);
                });

                promisesLoop.push(buildPromise);
            }

            return Promise.all(promisesLoop).then(() => {
                return result.map(e => Array.isArray(e) && e.length === 1 ? e[ 0 ] : e);
            });
        };

        return Promise.all(await build(generators)).then(streams => {
            return /* streams.length === 1 ? streams[ 0 ] : */ mergeStream(...streams as any);
        });

    }

    concat(options: ConcatOptionsType) {
        const { bindThis, generators } = new ConcatOptions(options);

        this.lastStream$ = this.lastStream$.then(lastStream => {
            const build = this.buildStream(lastStream, generators, bindThis);
            return build;
        });


        return this;
    }

    pipe(stream: WritableStream) {
        this.lastStream$ = this.lastStream$.then(s => {
            return isReadable(s) ? s.pipe(stream) : s;
        });

        return this;
    }

    get done() {
        this.lastStream$ = this.lastStream$.then(stream => {
            this.stream = stream;
            return stream;
        });

        return this.lastStream$;
    }
}

export function concatStreams(stream: TT$<ReadableStream>) {
    return new ConcatStreams(stream);
}

export function concatable(options: ConcatOptionsType) {
    return options;
}
