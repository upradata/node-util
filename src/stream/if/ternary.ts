import { ConcatOptionsType } from './../concat/stream.concat.options';
import { concatStreams } from './../concat/stream.concat';
import { Stream, ReadableStream, WritableStream } from '../types';
import stream from 'stream';
import through2 from 'through2';
import duplexify from 'duplexify';
import mergeStream from 'merge2';
import { ConditionActions, IfOptions, Mode, getActionStreamsSync, getActionStreamsAsync } from './types';
import { ternaryFork, TernaryForksStream } from './ternary-fork';
import { isUndefined } from '@upradata/util';




export abstract class TernaryStreams<Data, ConcatMode extends Mode>{
    public true: ConcatMode extends 'pipe' ? Stream[] : ConcatOptionsType;
    public false: ConcatMode extends 'pipe' ? Stream[] : ConcatOptionsType;
    public ternaryStream: duplexify.Duplexify;
    protected ternaryForkStream: TernaryForksStream<Data>;
    protected outputStream: stream.Transform;
    public options: IfOptions<Data, ConcatMode>;

    constructor(options: IfOptions<Data, ConcatMode>) {
        this.options = new IfOptions(options);

        this.ternaryForkStream = ternaryFork({ condition: options.condition, stream: options.stream });
        this.outputStream = through2(options.stream);
    }


    protected forwardError(from: Stream, to: Stream) {
        from.on('error', err => { to.emit('error', err); });
    }

    protected abstract connectTernaryForkStreamsAsync(): Promise<ReadableStream[]>;
    protected abstract connectTernaryForkStreamsSync(): ReadableStream[];

    private async initAsync() {
        // We put this inside the addInitListener to be able to have an async function
        // this.ternaryForkStream.addInitListener(async () => {

        const streams = await this.connectTernaryForkStreamsAsync();
        this.doInit(streams);
    }

    private initSync() {
        const streams = this.connectTernaryForkStreamsSync();
        this.doInit(streams);
    }

    private doInit(streams: ReadableStream[]) {

        const falseStreamIfNoElseDefined = isUndefined(this.false) || (this.false as any as []).length === 0 ? [ this.ternaryForkStream.false ] : [];
        const mergedStream = mergeStream(
            [ ...falseStreamIfNoElseDefined, ...streams ], this.options.stream
        );

        streams.forEach(stream => this.forwardError(stream, mergedStream));

        // send everything down-stream
        mergedStream.pipe(this.outputStream);
        // redirect mergedStream errors to outputStream
        this.forwardError(mergedStream, this.outputStream);

        // this.ternaryStream.setWritable(this.ternaryForkStream);
        // this.ternaryStream.setReadable(this.outputStream);
        // It is crucial to add the readable stream here because inside setReadable is called the stream.read to start flowing!!
        // });
    }

    public init() {
        if (this.options.sync === 'sync') {
            this.initSync();
            return this.done();
        }

        return this.initAsync().then(() => this.done());
    }

    private done() {
        return duplexify(this.ternaryForkStream, this.outputStream, this.options.stream);
    }
}


export class TernaryStreamsPipe<Data> extends TernaryStreams<Data, 'pipe'>{

    constructor(options: IfOptions<Data, 'pipe'>) {
        super(options);
        this.true = [];
        this.false = [];
    }


    public addActions(actionsToAdd: { true?: ConditionActions<'pipe'>; false?: ConditionActions<'pipe'>; }) {
        const actionsStreams = [ { actions: actionsToAdd.true, streams: this.true }, { actions: actionsToAdd.false, streams: this.false } ];

        if (this.options.sync === 'sync') {
            return actionsStreams.map(({ actions, streams }) => {
                const streamsToAdd = getActionStreamsSync(actions);
                streams.push(...streamsToAdd);
            });
        }

        return Promise.all(actionsStreams.map(async ({ actions, streams }) => {
            const streamsToAdd = await getActionStreamsAsync(actions);
            streams.push(...streamsToAdd);
        }));
    }

    protected forwardError(from: Stream, to: Stream) {
        from.on('error', err => { to.emit('error', err); });
    }

    protected async connectTernaryForkStreamsAsync() {
        await this.addActions(this.options);
        return this.connectTernaryForkStreamsSync(false);
    }

    protected connectTernaryForkStreamsSync(addActions: boolean = true) {
        if (addActions)
            this.addActions(this.options);

        const { true: trueStreams, false: falseStreams } = this;

        const isTrueStreams = (streams: Stream[], isTrue: boolean) => streams.map(s => ({ stream: s, isTrue }));
        const streams: ReadableStream[] = [];

        for (const { stream, isTrue } of [ ...isTrueStreams(trueStreams, true), ...isTrueStreams(falseStreams, false) ]) {
            streams.push(stream as ReadableStream);
            this.ternaryForkStream[ isTrue ? 'true' : 'false' ].pipe(stream as WritableStream);
        }

        return streams;
    }
}



export class TernaryStreamsConcat<Data> extends TernaryStreams<Data, 'concat'>{

    constructor(options: IfOptions<Data, 'concat'>) {
        super(options);
        this.true = this.options.true;
        this.false = this.options.false;
    }


    protected async connectTernaryForkStreamsAsync() {

        const concats = [ { isTrue: true, concatOption: this.true }, { isTrue: false, concatOption: this.false } ].filter(c => !!c.concatOption);

        return Promise.all(concats.map(({ concatOption, isTrue }) => {
            return concatStreams(this.ternaryForkStream[ isTrue ? 'true' : 'false' ]).concat(concatOption).done<ReadableStream>();
        }));
    }

    protected connectTernaryForkStreamsSync() {
        throw new Error(`TernaryStreamsConcat can be only async. Please, pass the option sync: "async"`);
        return undefined;
    }
}

export type Ternary<Options extends IfOptions<any, Mode>> = Options[ 'sync' ] extends 'async' ? Promise<stream.Duplex> : stream.Duplex;

export const ternary = <Data, ConcatMode extends Mode, Options extends IfOptions<Data, ConcatMode>>(options: Options): Ternary<Options> => {
    let ternaryStreams: TernaryStreams<Data, Mode> = undefined;

    if (!options.mode || options.mode === 'pipe')
        ternaryStreams = new TernaryStreamsPipe(options as IfOptions<Data, 'pipe'>);
    else
        ternaryStreams = new TernaryStreamsConcat(options as IfOptions<Data, 'concat'>);

    return ternaryStreams.init() as any;
};
