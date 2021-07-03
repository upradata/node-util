import fs from 'fs';
import rimraf from 'rimraf';
import { TscCompiler } from './tsc';


export function requireAndCompileIfNecesseray(filenameNoExt: string) {
    let file = `${filenameNoExt}.js`;

    if (fs.existsSync(file))
        return require(file);

    file = `${filenameNoExt}.ts`;
    if (fs.existsSync(file)) {
        // const fileContent = fs.readFileSync(file, 'utf8');
        const { emittedFiles, outDir } = TscCompiler.compile([ file ]);
        const required = require(emittedFiles[ 0 ]); // path.join(outTmpDir, path.basename(filenameNoExt) + '.js')
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
