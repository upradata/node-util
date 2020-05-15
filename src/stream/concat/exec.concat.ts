import stream from 'stream';
import gulpExec, { ExecOptions } from 'gulp-exec';
import gulpDebug from 'gulp-debug';

export class RunBildOptions {
    execOptions: ExecOptions = {
        continueOnError: false, // default = false, true means don't emit error event
        pipeStdout: false, // default = false, true means stdout is written to file.contents
        // customTemplatingThing: "test" // content passed to lodash.template()
    };

    reportOptions: { err: boolean; stderr: boolean; stdout: boolean; } = {
        err: true, // default = true, false means don't write err
        stderr: true, // default = true, false means don't write stderr
        stdout: true // default = true, false means don't write stdout
    };
}

export class RunBuild {
    public options: RunBildOptions;

    constructor(options: Partial<RunBildOptions> = {}) {
        this.options = Object.assign(new RunBildOptions(), options);

    }

    // exec(buildSrc: gulp.Globs) {
    // return gulp.src(buildSrc)
    exec() {
        return (source: stream.Stream) => source.pipe(gulpDebug({ title: 'exec:' }))
            .pipe(gulpExec('node <%= file.path %>', this.options.execOptions))
            .pipe(gulpExec.reporter(this.options.reportOptions));
    }
}


export function runBuild(options: Partial<RunBildOptions>) {
    return new RunBuild(options);
}
