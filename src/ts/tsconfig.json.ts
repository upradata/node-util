/* eslint-disable max-len */
import ts from 'typescript';
import { TSConfigJSON, CompilerOptions } from 'types-tsconfig';

export type TsConfig<Type extends 'json' | 'programmatically' = 'json'> = Omit<TSConfigJSON, 'typeAcquisition' | 'compilerOptions'> & {
    /* compilerOptions?: ts.CompilerOptions;
    exclude?: string[];
    compileOnSave?: boolean;
    extends?: string;
    files?: string[];
    include?: string[]; */
    compilerOptions?: Type extends 'json' ? CompilerOptions : ts.CompilerOptions;
    typeAcquisition?: ts.TypeAcquisition;
};




// IN JSON

// export declare type JSX = "preserve" | "react" | "react-native";
// export declare type Module = "CommonJS" | "AMD" | "System" | "UMD" | "ES6" | "ES2015" | "ESNext" | "None" | "commonjs" | "amd" | "system" | "umd" | "es6" | "es2015" | "esnext" | "none";
// export declare type NewLine = "CRLF" | "LF" | "crlf" | "lf";
// export declare type Target = "ES3" | "ES5" | "ES6" | "ES2015" | "ES2016" | "ES2017" | "ES2018" | "ES2019" | "ES2020" | "ESNext" | "es3" | "es5" | "es6" | "es2015" | "es2016" | "es2017" | "es2018" | "es2019" | "es2020" | "esnext";
// export declare type Lib = "ES5" | "ES6" | "ES7" | "ES2015" | "ES2015.Collection" | "ES2015.Core" | "ES2015.Generator" | "ES2015.Iterable" | "ES2015.Promise" | "ES2015.Proxy" | "ES2015.Reflect" | "ES2015.Symbol.WellKnown" | "ES2015.Symbol" | "ES2016" | "ES2016.Array.Include" | "ES2017" | "ES2017.Intl" | "ES2017.Object" | "ES2017.SharedMemory" | "ES2017.String" | "ES2017.TypedArrays" | "ES2018" | "ES2018.AsyncIterable" | "ES2018.Intl" | "ES2018.Promise" | "ES2018.Regexp" | "ES2019" | "ES2019.Array" | "ES2019.Object" | "ES2019.String" | "ES2019.Symbol" | "ES2020" | "ES2020.String" | "ES2020.Symbol.WellKnown" | "ESNext" | "ESNext.Array" | "ESNext.AsyncIterable" | "ESNext.BigInt" | "ESNext.Intl" | "ESNext.Symbol" | "DOM" | "DOM.Iterable" | "ScriptHost" | "WebWorker" | "WebWorker.ImportScripts" | "es5" | "es6" | "es7" | "es2015" | "es2015.collection" | "es2015.core" | "es2015.generator" | "es2015.iterable" | "es2015.promise" | "es2015.proxy" | "es2015.reflect" | "es2015.symbol.wellknown" | "es2015.symbol" | "es2016" | "es2016.array.include" | "es2017" | "es2017.intl" | "es2017.object" | "es2017.sharedmemory" | "es2017.string" | "es2017.typedarrays" | "es2018" | "es2018.asynciterable" | "es2018.intl" | "es2018.promise" | "es2018.regexp" | "es2019" | "es2019.array" | "es2019.object" | "es2019.string" | "es2019.symbol" | "es2020" | "es2020.string" | "es2020.symbol.wellknown" | "esnext" | "esnext.array" | "esnext.asynciterable" | "esnext.bigint" | "esnext.intl" | "esnext.symbol" | "dom" | "dom.iterable" | "scripthost" | "webworker" | "webworker.importscripts";



// PROGRAMMATICALLY

// export enum ModuleKind {
//     None = 0,
//     CommonJS = 1,
//     AMD = 2,
//     UMD = 3,
//     System = 4,
//     ES2015 = 5,
//     ES2020 = 6,
//     ES2022 = 7,
//     ESNext = 99,
//     Node16 = 100,
//     NodeNext = 199
// }
// export enum JsxEmit {
//     None = 0,
//     Preserve = 1,
//     React = 2,
//     ReactNative = 3,
//     ReactJSX = 4,
//     ReactJSXDev = 5
// }
// export enum ImportsNotUsedAsValues {
//     Remove = 0,
//     Preserve = 1,
//     Error = 2
// }
// export enum NewLineKind {
//     CarriageReturnLineFeed = 0,
//     LineFeed = 1
// }
// export interface LineAndCharacter {
//     /** 0-based. */
//     line: number;
//     character: number;
// }
// export enum ScriptKind {
//     Unknown = 0,
//     JS = 1,
//     JSX = 2,
//     TS = 3,
//     TSX = 4,
//     External = 5,
//     JSON = 6,
//     /**
//      * Used on extensions that doesn't define the ScriptKind but the content defines it.
//      * Deferred extensions are going to be included in all project contexts.
//      */
//     Deferred = 7
// }
// export enum ScriptTarget {
//     ES3 = 0,
//     ES5 = 1,
//     ES2015 = 2,
//     ES2016 = 3,
//     ES2017 = 4,
//     ES2018 = 5,
//     ES2019 = 6,
//     ES2020 = 7,
//     ES2021 = 8,
//     ES2022 = 9,
//     ESNext = 99,
//     JSON = 100,
//     Latest = 99
// }
