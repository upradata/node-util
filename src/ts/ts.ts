import fs from 'fs-extra';
import { TscCompiler } from './tsc';


export const requireAndCompileIfNecesseray = (filenameNoExt: string) => {
    const jsFile = `${filenameNoExt}.js`;

    if (fs.existsSync(jsFile))
        return require(jsFile);

    const tsFile = `${filenameNoExt}.ts`;

    if (fs.existsSync(tsFile)) {
        // const fileContent = fs.readFileSync(file, 'utf8');
        const { emittedFiles, outDir } = TscCompiler.compile([ tsFile ]);
        const required = require(emittedFiles[ 0 ]); // path.join(outTmpDir, path.basename(filenameNoExt) + '.js')
        fs.removeSync(outDir);

        return required;
    }

    /*   for (const ext of extensions) {
          const file = `${basename}.${ext}`; // Helper.root(`${basename}.${ext}`);
          if (fs.existsSync(`${basename}.${ext}`))
              return require(file);
      } */

    return undefined;
};
