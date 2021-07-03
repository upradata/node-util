
declare module 'gulp-exec' {
import stream from 'stream';


    export interface ExecOptions {
        env?: NodeJS.ProcessEnv;
        pipeStdout?: boolean;
        continueOnError?: boolean;
    }

    export interface ExecReporter {
        err?: boolean;
        stderr?: boolean;
        stdout?: boolean;
    }

    export interface GulpExec {
        (command: string, options: ExecOptions): stream.Transform;
        reporter: (options: ExecReporter) => stream.Transform;
    }

    const gulpExec: GulpExec;
    export default gulpExec;
}
