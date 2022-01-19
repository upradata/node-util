import fs from 'fs-extra';
import path from 'path';
import tsconfig from 'tsconfig';
import ts from 'typescript';
import { AssignOptions, assignRecursive } from '@upradata/util';
// import { createCompilerHost } from './compiler-host';
import { TsConfig } from './tsconfig.json';


export const defaultTscOptions = (): ts.CompilerOptions => ({
    noEmitOnError: false,
    noErrorTruncation: true,
    noImplicitAny: false,
    listEmittedFiles: true,
    downlevelIteration: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    /* lib: [ 'ESNext' ], */
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true
});

export type TsCompileOptions = ts.CompilerOptions & { useTsConfig?: boolean | string; host?: ts.CompilerHost; };


function loadTsConfig(tsconfigPath?: string): { path: string; config: TsConfig; } {
    const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(__dirname, tsconfigPath);

    if (!tsConfig.path)
        throw new Error('cannot find project with tsconfig.json');

    return tsConfig as any;
}

export class TscCompiler {
    constructor() { }

    static compile(fileNames: string[], options: TsCompileOptions = {}) {

        const { useTsConfig, host } = options;


        const getCompilerOptions = (): ts.CompilerOptions => {
            if (useTsConfig) {
                const tsconfigPath = typeof useTsConfig === 'string' ? useTsConfig : undefined;

                return assignRecursive(
                    {},
                    loadTsConfig(tsconfigPath).config.compilerOptions,
                    options,
                    new AssignOptions({ arrayMode: 'replace' })
                );
            }

            return assignRecursive(defaultTscOptions(), options);
        };

        const compilerOptions = getCompilerOptions();

        /* if (!compilerOptions.outDir) {
            const { path: tsconfigPath, config } = loadTsConfig();
            const projectDir = path.dirname(tsconfigPath);

            assignRecursive(compilerOptions, {
                outDir: path.join(projectDir, 'dist'),
                baseUrl: path.join(projectDir, config.compilerOptions.baseUrl),
                paths: config.compilerOptions.paths
            });
        } */
        /* debugger;
        const host = createCompilerHost(compilerOptions, {}); */
        // const host = createCompilerHost(compilerOptions, {});
        const program = ts.createProgram(fileNames, compilerOptions, host);

        const emitResult = program.emit();
        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

        if (allDiagnostics !== undefined && allDiagnostics.length > 0) {

            const errorMessages = allDiagnostics.reduce((errorMessages, diagnostic) => {

                if (diagnostic.file) {

                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

                    return errorMessages + `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
                }

                return errorMessages + `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}\n`;

            }, '');


            throw new Error(errorMessages);
        }

        const exitCode = emitResult.emitSkipped ? 1 : 0;
        return { emittedFiles: emitResult.emittedFiles, outDir: compilerOptions.outDir, exitCode };
        // console.log(`Process exiting with code '${exitCode}'.`);
        // process.exit(exitCode);
    }

    static compileModuleFromString(source: string, options?: ts.CompilerOptions & { useTsconfig?: boolean; }) {

        const getCompilerOptions = (): ts.CompilerOptions => {

            if (options?.useTsconfig) {
                const tsConfig: { path?: string; config: TsConfig<'programmatically'>; } = tsconfig.loadSync(__dirname);

                if (!tsConfig.path)
                    throw new Error('cannot find project with tsconfig.json');

                return tsConfig.config.compilerOptions;
            }

            return options || {
                noEmitOnError: true, noImplicitAny: true,
                target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
            };
        };


        const result = ts.transpileModule(source, { compilerOptions: getCompilerOptions() });
        return result;
    }


    static compileAndEmit(filepath: string, options: ts.CompilerOptions) {

        const compilerOptions = assignRecursive(defaultTscOptions(), options);

        const { emittedFiles } = TscCompiler.compile([ filepath ], compilerOptions);
        // emittedFiles is all emitted file, but we want only filepath file to be required

        const stem = (file: string) => {
            const rel = file.replace(/^\.\//, '');
            return rel.replace(/\..*$/, '');
        };

        const isAbs = path.isAbsolute(filepath);

        const compiledFile = emittedFiles.find(file => {
            if (!isAbs)
                return stem(path.relative(options.outDir, file)) === stem(filepath);

            return stem(filepath).endsWith(stem(path.relative(options.outDir, file)));
        });


        return { emittedFiles, compiledFile };
    }

    static compileAndLoadModule(filepath: string, options?: ts.CompilerOptions & { outDir: ts.CompilerOptions[ 'outDir' ]; deleteOutDir?: boolean; }) {
        const { compiledFile } = TscCompiler.compileAndEmit(filepath, options);
        const requiredModule = require(compiledFile);

        const opts = { deleteOutDir: true, ...options };

        if (opts.deleteOutDir)
            fs.removeSync(options.outDir);

        return { module: requiredModule, filepath: compiledFile };
    }
}



/* compile(process.argv.slice(2), {
    noEmitOnError: true, noImplicitAny: true,
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}); */
