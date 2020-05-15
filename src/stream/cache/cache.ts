import stream from 'stream';
import VinylFile from 'vinyl';
import PluginError from 'plugin-error';
import through from 'through2';
import { assignRecursive, PartialRecursive, AssignOptions } from '@upradata/util';
import { Cache, CacheOptions } from '../../cache';

export type StreamCacheMode = 'manual' | 'auto';

export class StreamCacheConfig {
    emitCache: boolean = false;
    emitName: string;
    collectionName: string | string[] = [ 'default' ];
    filter: (file: VinylFile) => boolean = file => true;
    mode: StreamCacheMode = 'auto';
    filePath: (file: VinylFile) => string = file => file.path;
    disabled: boolean = false;
    debug?: string;
}

export class StreamCacheOptions {
    streamCache: StreamCacheConfig = new StreamCacheConfig();
    cacheOptions: CacheOptions = { path: './cache.json' };
    cache?: Cache;
}

export class StreamCache {
    public pluginName = this.constructor.name;
    public cache: Cache;
    public options: StreamCacheOptions;
    private used: boolean = false;

    constructor(options?: PartialRecursive<StreamCacheOptions> & { cache?: Cache; }) {
        this.options = assignRecursive(new StreamCacheOptions(), options, new AssignOptions({ except: [ 'cache' ], arrayMode: 'replace' }));

        if (options.cache)
            this.cache = options.cache;
        else
            this.cache = new Cache(this.options.cacheOptions);
    }

    run() {
        if (this.used)
            new Error(`${this.pluginName} Error: run can be used only once.`);

        this.used = true;

        const throughOptions = { objectMode: true };
        const self = this;

        return through(throughOptions,
            function (file: VinylFile, encoding: string, cb: through.TransformCallback) {
                return self.transform(this, file, encoding, cb);
            },
            function (cb: () => void) { self.flush(this, cb); }
        );
    }

    private async transform(stream: stream.Stream, file: VinylFile, encoding: string, cb: through.TransformCallback) {
        if (file.isStream()) {
            return cb(new PluginError(this.pluginName, 'Streaming not supported'));
        }

        if (file.isNull()) {
            return cb(null, file);
        }

        const { collectionName, filter, filePath, disabled } = this.options.streamCache;

        if (disabled)
            return cb(null, file);

        if (this.cache.isChangedFiles(collectionName, [ filePath(file) ]) && filter(file)) {
            this.cache.addOrUpdateFile(collectionName, filePath(file));
            cb(null, file);
        } else
            cb();
    }

    private async flush(stream: stream.Readable, cb: () => void) {
        const { emitCache, emitName, mode, disabled } = this.options.streamCache;

        if (disabled)
            return cb();


        if (mode === 'auto')
            this.cache.save();

        if (emitCache) {
            // cache store file
            const file = new VinylFile({
                contents: Buffer.from(JSON.stringify(this.cache.store.storeCollection)),
                base: process.cwd(),
                path: process.cwd() + '/' + emitName || this.cache.store.options.path
            });

            stream.push(file);
        }

        cb();
    }
}


export function streamCache(options?: PartialRecursive<StreamCacheOptions> & { cache?: Cache; }) {
    return new StreamCache(options).run();
}
