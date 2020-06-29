import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { oneLineTrim } from 'common-tags';
import { yellow, green } from '../style';
import { tmpFileName } from '../tmpfile';

export class OdsConvertOptions {
    verbose: boolean = true;
    filedSeparator: string = '59'; // ;
    textDelimiter: string = '34'; // "
    encoding: string = '0'; // System Encoding
    nbFirstLine: number = 1; // means first line
}

type ConvertType = 'csv' | 'ods';

const convert = (src: string, options: Partial<OdsConvertOptions> & { from: ConvertType; to: ConvertType; }) => {
    const { verbose, filedSeparator, textDelimiter, encoding, nbFirstLine, from, to } = Object.assign(new OdsConvertOptions(), options);

    const tmpDir = tmpFileName.sync();
    const fromTmp = (...paths: string[]) => path.join(tmpDir, ...paths);

    const fileName = path.basename(src);
    const dir = path.dirname(src);
    const stem = path.basename(src, `.${from}`);

    // The CSV export filter accepts various arguments
    // https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options#Token_8.2C_csv_import
    // Here we use Field Separator (1)	Text Delimiter (2)	Character Set (3)	Number of First Line (4)
    const filterOptions = `${filedSeparator},${textDelimiter},${encoding},${nbFirstLine}`;

    let command: string = undefined;

    if (to === 'csv') {
        command = oneLineTrim`
                mkdir -p ${tmpDir} && 
                cp ${src} ${tmpDir} && 
                cd ${tmpDir} && 
                UNOPATH=/usr/bin/libreoffice /usr/bin/python3.6 /usr/bin/unoconv -f csv -e FilterOptions="${filterOptions}" ${fileName}
                `; //  && mv ${fileNoExt}.csv ${csvFile})
    } else {
        command = oneLineTrim`
                mkdir -p ${tmpDir} && 
                cp ${src} ${tmpDir} && 
                cd ${tmpDir} && 
                UNOPATH=/usr/bin/libreoffice /usr/bin/python3.6 /usr/bin/unoconv -f ods -e FilterOptions="${filterOptions}" ${fileName}
                `;
    }

    if (verbose)
        console.log(yellow`Convert ${src} to ${to}`);

    // unoconv is SOOOO good that only one process at a time can be executed. So we do it synchronously
    execSync(command, { stdio: [ 0, 1, 2 ] });

    const outputName = `${stem}.${to}`;
    const output = path.join(dir, outputName);

    execSync(`cp ${fromTmp(outputName)} ${output}`, { stdio: [ 0, 1, 2 ] });

    if (verbose)
        console.log(green`${outputName} generated`, '\n');

    fs.removeSync(tmpDir);
    return output;
};


export const odsToCsv = (odsFile: string, options?: Partial<OdsConvertOptions>) => {
    return convert(odsFile, { ...options, from: 'ods', to: 'csv' });
};


export const csvToOds = (csvFile: string, options?: Partial<OdsConvertOptions>) => {
    return convert(csvFile, { ...options, from: 'csv', to: 'ods' });
};
