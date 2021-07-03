declare module 'fork-stream' {
import stream from 'stream';


    export type ForkStreamOptions = (stream.ReadableOptions | stream.WritableOptions) & {
        classifier: (data: any, done: (err: Error, isTrue: boolean) => any) => void;
    };

    export default class ForkStream {
        public a: stream.Readable;
        public b: stream.Readable;

        constructor(options: ForkStreamOptions);
    }
}
