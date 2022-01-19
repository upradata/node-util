import ts from 'typescript';
import { TSConfigJSON, CompilerOptions } from "types-tsconfig";

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
