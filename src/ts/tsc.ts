import ts from 'typescript';
import path from 'path';
// import { readFile, readFileSync, readdirSync } from 'fs-extra';
import tsconfig from 'tsconfig';
import { TsConfig } from './tsconfig.json';
import { tmpFileName } from '../useful';


export class TscCompiler {
    constructor() { }

    static compileAndEmit(fileNames: string[], options?: ts.CompilerOptions) {
        let compilerOptions = options;

        if (!compilerOptions) {
            const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(__dirname);
            if (!tsConfig.path)
                throw new Error('cannot find project with tsconfig.json');

            const projectDir = path.dirname(tsConfig.path);

            compilerOptions = {
                noEmitOnError: false, noImplicitAny: false, listEmittedFiles: true,
                target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
                esModuleInterop: true, allowSyntheticDefaultImports: true,
                outDir: path.join(projectDir, 'dist'),
                baseUrl: path.join(projectDir, tsConfig.config.compilerOptions.baseUrl),
                paths: tsConfig.config.compilerOptions.paths
            };
        }

        const program = ts.createProgram(fileNames, compilerOptions);
        const emitResult = program.emit();

        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

        if (allDiagnostics !== undefined && allDiagnostics.length > 0) {
            let errorMessages: string = undefined;

            for (const diagnostic of allDiagnostics) {
                if (diagnostic.file) {
                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    errorMessages += `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
                }
                else {
                    errorMessages += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}\n`;
                }
            }

            throw new Error(errorMessages);
        }

        const exitCode = emitResult.emitSkipped ? 1 : 0;
        return { emittedFiles: emitResult.emittedFiles, outDir: compilerOptions.outDir, exitCode };
        // console.log(`Process exiting with code '${exitCode}'.`);
        // process.exit(exitCode);
    }

    static compileModuleFromString(source: string, options?: ts.CompilerOptions & { useTsconfig?: boolean; }) {

        let compilerOptions: ts.CompilerOptions = undefined;

        if (options && options.useTsconfig) {
            const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(__dirname);
            if (!tsConfig.path)
                throw new Error('cannot find project with tsconfig.json');

            compilerOptions = tsConfig.config.compilerOptions;
        } else {
            compilerOptions = options || {
                noEmitOnError: true, noImplicitAny: true,
                target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
            };
        }

        const result = ts.transpileModule(source, { compilerOptions });
        return result;
    }

    static compileAndLoadModule(filepath: string, options?: ts.CompilerOptions) {
        const tmpDir = tmpFileName();

        const compilerOptions = options || {
            noEmitOnError: false, noImplicitAny: false, listEmittedFiles: true,
            target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
            esModuleInterop: true, allowSyntheticDefaultImports: true,
            outDir: tmpDir
        };

        const { emittedFiles } = TscCompiler.compileAndEmit([ filepath ], compilerOptions);
        return require(emittedFiles[ 0 ]);
    }
}


/* compile(process.argv.slice(2), {
    noEmitOnError: true, noImplicitAny: true,
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}); */
