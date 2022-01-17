import ts from 'typescript';


export interface TsConfig {
    compilerOptions?: ts.CompilerOptions;
    exclude?: string[];
    compileOnSave?: boolean;
    extends?: string;
    files?: string[];
    include?: string[];
    typeAcquisition?: ts.TypeAcquisition;
}
