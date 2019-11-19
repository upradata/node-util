import * as fs from 'fs';
import { TscCompiler } from './tsc';
import * as rimraf from 'rimraf';


export function requireAndCompileIfNecesseray(filenameNoExt: string) {
    let file = `${filenameNoExt}.js`;

    if (fs.existsSync(file))
        return require(file);

    file = `${filenameNoExt}.ts`;
    if (fs.existsSync(file)) {
        const fileContent = fs.readFileSync(file, 'utf8');
        const { emittedFiles, outDir } = TscCompiler.compileAndEmit([file]);
        const required = require(emittedFiles[0]); // path.join(outTmpDir, path.basename(filenameNoExt) + '.js')
        rimraf/* .sync */(outDir, () => { });

        return required;
    }

    /*   for (const ext of extensions) {
          const file = `${basename}.${ext}`; // Helper.root(`${basename}.${ext}`);
          if (fs.existsSync(`${basename}.${ext}`))
              return require(file);
      } */

    return undefined;
}
