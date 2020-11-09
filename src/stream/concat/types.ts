import { WritableStream, Stream } from '../types';
import { TT$ } from '@upradata/util';

export type ConcatGeneratorFunction = (source: Stream) => TT$<Stream | ConcatStreamGenerator | ConcatStreamGenerators>;
export type ConcatStreamGenerator = TT$<Stream> | TT$<ConcatGeneratorFunction> | ConcatStreamGenerators;
export type ConcatStreamGenerators = TT$<ConcatStreamGenerator[]>;
// export type StreamGenerator$ = Promise<ReadableStream> | Promise<(source: ReadableStream) => Promise<ReadableStream | StreamGenerators>> | Promise<StreamGenerators>;

// export type ConcatStreamGeneratorArray = TT$<(source: Stream) => TT$<Stream | ConcatStreamGeneratorArray[]>> | ConcatStreamGeneratorArray[];
// export type StreamGeneratorArray$ = Promise<(source: ReadableStream) => Promise<ReadableStream | StreamGeneratorArray[]>> | Promise<StreamGeneratorArray[]>;


export function isConcatGeneratorFunction(gen: any): gen is ConcatGeneratorFunction {
    return typeof gen === 'function';
}


export type PipeGeneratorFunction = () => TT$<WritableStream>;
export type PipeStreamGenerator = TT$<WritableStream> | TT$<PipeGeneratorFunction>;

export function isPipeGeneratorFunction(gen: any): gen is PipeGeneratorFunction {
    return typeof gen === 'function';
}
