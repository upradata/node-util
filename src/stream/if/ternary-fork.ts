import stream from 'stream';
import { AnyFunction, Function0, TT$ } from '@upradata/util';
import { Condition } from './types';


export class TernaryStreamOpts<Data> {
    condition: Condition<Data>;
    stream?: stream.ReadableOptions & stream.WritableOptions;

    constructor(options: TernaryStreamOpts<Data>) {
        Object.assign(this, options);
    }
}


export class TernaryConditionOptions<Data> {
    test: (data: Data) => TT$<boolean> = undefined;
    private isInit = false;

    constructor(private options: TernaryStreamOpts<Data>) {
        Object.assign(this, options);
    }

    async init() {
        if (this.isInit)
            return;

        const test = await this.options.condition;

        if (typeof test === 'boolean') {
            this.test = (data: Data) => Promise.resolve(test);

        } else if (test.length === 2) {

            this.test = (data: Data) => new Promise((res, rej) => {
                test(data, (err, condition) => {
                    if (err)
                        return rej(err);

                    res(condition);
                });
            });
        } else {
            this.test = test as any;
        }

        this.isInit = true;
    }
}



export class TernaryForksStream<Data> extends stream.Writable {
    public condition: TernaryConditionOptions<Data>;
    public true: stream.Readable;
    public false: stream.Readable;
    private resume: (error?: Error | null) => void;
    private initListeners: Function0<TT$<void>>[] = [];
    private hasInit = false;

    constructor(options: TernaryStreamOpts<Data>) {
        super(new TernaryStreamOpts(options).stream);

        const opts = new TernaryStreamOpts(options);

        this.condition = new TernaryConditionOptions(opts);

        const resume = () => {
            if (this.resume) {
                // when there is not space in the readable stream, we wait until the readable stream says so
                const res = this.resume;
                this.resume = null;
                res.call(null);
            }
        };

        this.true = new stream.Readable({ ...opts.stream, read: resume });
        this.false = new stream.Readable({ ...opts.stream, read: resume });

        this.on('finish', () => {
            this.true.push(null); // end streams when null is passed
            this.false.push(null);
        });

        this.addInitListener(() => this.condition.init());
    }

    addInitListener(listener: AnyFunction) {
        this.initListeners.push(listener);
    }

    private emitInit() {
        if (this.hasInit)
            return;

        this.hasInit = true;
        return Promise.all(this.initListeners.map(listener => listener()));
    }

    async _write(data: Data, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        try {
            await this.emitInit();
            const condition = await this.condition.test(data);

            const streamSelected = condition ? this.true : this.false;

            if (streamSelected.push(data))
                return callback();

            this.resume = callback; // to much data, wait to resume
        } catch (e) {
            callback(e);
        }
    }
}


export const ternaryFork = <Data>(options: TernaryStreamOpts<Data>) => new TernaryForksStream(options);
