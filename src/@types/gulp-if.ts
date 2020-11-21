declare module 'gulp-if' {
    import stream from 'stream';
    import VinylFile from 'vinyl';
    import minimatch from 'minimatch';


    export interface StatFilterCondition {
        isDirectory?: boolean;
        isFile?: boolean;
    }

    export type IfCondition = boolean | StatFilterCondition | ((fs: VinylFile) => boolean);

    export default function gulpIf(condition: IfCondition, trueStream: NodeJS.ReadWriteStream, falseStream?: NodeJS.ReadWriteStream, minimatchOptions?: minimatch.IOptions): stream.Transform;
}
