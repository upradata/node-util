import * as ts from 'typescript';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import * as tsconfig from 'tsconfig';
import { TsConfig } from './tsconfig.json';

export class TscCompiler {
    constructor() { }

    static compileAndEmit(fileNames: string[], options?: ts.CompilerOptions) {
        const tsConfig: { path?: string; config: TsConfig; } = tsconfig.loadSync(__dirname);
        if (!tsConfig.path)
            throw new Error('cannot find Milotti Webpack project tsconfig.json');

        const compilerOptions = options || {
            noEmitOnError: false, noImplicitAny: false, listEmittedFiles: true,
            target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
            outDir: tmp.dirSync({ dir: process.cwd(), prefix: '.webpack-config-tmp-' }).name,
            baseUrl: path.join(path.dirname(tsConfig.path), tsConfig.config.compilerOptions.baseUrl),
            paths: tsConfig.config.compilerOptions.paths
        };

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
        return { emittedFiles: emitResult.emittedFiles, outDir: compilerOptions.outDir };
        // console.log(`Process exiting with code '${exitCode}'.`);
        // process.exit(exitCode);
    }

    static compileStringOutput(source: string, options?: ts.CompilerOptions) {
        const compilerOptions = options || {
            noEmitOnError: true, noImplicitAny: true,
            target: ts.ScriptTarget.ES2018, module: ts.ModuleKind.CommonJS,
        };

        const result = ts.transpileModule(source, { compilerOptions });
        const tmpFile = tmp.fileSync();
        fs.writeFileSync(tmpFile.name, result.outputText);
        /*   console.log('File: ', tmpobj.name);
          console.log('Filedescriptor: ', tmpobj.fd); */



        // If we don't need the file anymore we could manually call the removeCallback
        // But that is not necessary if we didn't pass the keep option because the library
        // will clean after itself.
        // tmpFile.removeCallback();

        return tmpFile.name; // result.outputText;
    }
}


/* compile(process.argv.slice(2), {
    noEmitOnError: true, noImplicitAny: true,
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
}); */
