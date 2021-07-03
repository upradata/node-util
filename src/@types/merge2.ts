declare module 'merge2' {

import { PassThrough } from 'stream';


    export default function merge(a: Streams, options?: Options): Merge2Stream;
    export default function merge(a: Streams, b: Streams, options?: Options): Merge2Stream;
    export default function merge(a: Streams, b: Streams, c: Streams, options?: Options): Merge2Stream;
    export default function merge(a: Streams, b: Streams, c: Streams, d: Streams, options?: Options): Merge2Stream;
    export default function merge(a: Streams, b: Streams, c: Streams, d: Streams, e: Streams, options?: Options): Merge2Stream;
    export default function merge(...args: Streams[]): Merge2Stream;

    export type Streams = StreamType | StreamType[];

    export type StreamType = NodeJS.ReadableStream | Merge2Stream;

    export interface Options {
        end?: boolean;
        objectMode?: boolean;
    }

    export interface Merge2Stream extends PassThrough {
        /**
         * @summary    Add more streams to an existing merged stream
         *
         * @param      args  streams to add
         *
         * @return     The merged stream
         */
        add(...args: Streams[]): Merge2Stream;

        /**
         * @summary    It will emit 'queueDrain' when all streams merged.
         *             If you set end === false in options, this event give you a notice that
         *             you should add more streams to merge, or end the mergedStream.
         *
         * @param event The 'queueDrain' event
         *
         * @return     This stream
         */
        on(event: 'queueDrain', listener: () => void): this;
        on(event: string, listener: (...args: any[]) => void): this;

        once(event: 'queueDrain', listener: () => void): this;
        once(event: string, listener: (...args: any[]) => void): this;
    }
}
