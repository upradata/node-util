import gulpif from 'gulp-if';
import VinylFile from 'vinyl';
import minimatch from 'minimatch';
import stream from 'stream';

export interface StatFilterCondition {
    isDirectory?: boolean;
    isFile?: boolean;
}

export type IfCondition = boolean | StatFilterCondition | ((fs: VinylFile) => boolean);

export interface IfOptions {
    condition: IfCondition;
    true: NodeJS.ReadWriteStream;
    false?: NodeJS.ReadWriteStream;
    minimatchOptions?: minimatch.IOptions;
}

export function ifthen(options: IfOptions): stream.Transform {
    return gulpif(options.condition, options.true, options.false, options.minimatchOptions);
}
