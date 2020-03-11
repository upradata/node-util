import ts from 'typescript';
import path from 'path';
// import { readFile, readFileSync, readdirSync } from 'fs-extra';
import tsconfig from 'tsconfig';
import { TsConfig } from './tsconfig.json';
import { tmpFileName } from '../tmpfile';
import { assignRecursive, AssignOptions } from '@upradata/util';


function loadTsConfig(tsconfigPath?: string): { path: string; config: TsConfig; } {
    const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(__dirname, tsconfigPath);

    if (!tsConfig.path)
        throw new Error('cannot find project with tsconfig.json');

    return tsConfig as any;
}

export class TscCompiler {
    constructor() { }

    static compileAndEmit(fileNames: string[], options: ts.CompilerOptions & { useTsConfig?: boolean | string; } = {}) {
        let compilerOptions: ts.CompilerOptions;

        const { useTsConfig } = options;

        if (useTsConfig) {
            const tsconfigPath = typeof useTsConfig === 'string' ? useTsConfig : undefined;
            compilerOptions = loadTsConfig(tsconfigPath).config.compilerOptions;

        } else {

            compilerOptions = assignRecursive({
                noEmitOnError: false, noImplicitAny: false, listEmittedFiles: true,
                target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
                esModuleInterop: true, allowSyntheticDefaultImports: true,
            }, options);
        }

        assignRecursive(compilerOptions, options, new AssignOptions({ arrayMode: 'replace' }));

        /* if (!compilerOptions.outDir) {
            const { path: tsconfigPath, config } = loadTsConfig();
            const projectDir = path.dirname(tsconfigPath);

            assignRecursive(compilerOptions, {
                outDir: path.join(projectDir, 'dist'),
                baseUrl: path.join(projectDir, config.compilerOptions.baseUrl),
                paths: config.compilerOptions.paths
            });
        } */

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


    static compileAndEmitInTmpDir(filepath: string, options?: ts.CompilerOptions) {
        const tmpDir = tmpFileName.sync();

        const compilerOptions = assignRecursive({
            noEmitOnError: false, noImplicitAny: false, listEmittedFiles: true,
            target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
            esModuleInterop: true, allowSyntheticDefaultImports: true,
            outDir: tmpDir
        }, options);

        const { emittedFiles } = TscCompiler.compileAndEmit([ filepath ], compilerOptions);
        // emittedFiles is all emitted file, but we want only filepath file to be required

        const stem = (file: string) => {
            const rel = file.replace(/^\.\//, '');
            return rel.replace(/\..*$/, '');
        };

        const isAbs = path.isAbsolute(filepath);

        const compiledFile = emittedFiles.find(file => {
            if (!isAbs)
                return stem(path.relative(tmpDir, file)) === stem(filepath);

            return stem(filepath).endsWith(stem(path.relative(tmpDir, file)));
        });

        return { tmpDir, emittedFiles, compiledFile };
    }

    static compileAndLoadModule(filepath: string, options?: ts.CompilerOptions) {
        const { compiledFile } = TscCompiler.compileAndEmitInTmpDir(filepath, options);
        return require(compiledFile);
    }
}


/* compile(process.argv.slice(2), {
    noEmitOnError: true, noImplicitAny: true,
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}); */
