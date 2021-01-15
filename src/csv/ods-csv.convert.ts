import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { oneLineTrim } from 'common-tags';
import { yellow, green } from '../template-style';
import { tmpFileName } from '../tmpfile';

export class OdsConvertOptions {
    verbose: boolean = true;
    fieldSeparator: string = '59'; // ; (44 is ,) / 59/44 both
    textDelimiter: string = '34'; // "
    encoding: string = '76'; // utf-8
    firstRow: number = 1; // means starts from first line (k => starts from k-th line)
    columnFormat: string; // 1/5/2/1/3/1/4/1 (specified formats for each column (1 means standard, 5 means YY/MM/DD date))
    // https://wiki.openoffice.org/wiki/Framework/Article/Filter/FilterList_OOo_3_0
}

type ConvertType = 'csv' | 'ods';

const convert = (src: string, options: Partial<OdsConvertOptions> & { from: ConvertType; to: ConvertType; }) => {
    const { verbose, fieldSeparator, textDelimiter, encoding, firstRow, columnFormat, from, to } = Object.assign(new OdsConvertOptions(), options);

    const tmpDir = tmpFileName.sync();
    const fromTmp = (...paths: string[]) => path.join(tmpDir, ...paths);

    const fileName = path.basename(src);
    const dir = path.dirname(src);
    const stem = path.basename(src, `.${from}`);

    // The CSV export filter accepts various arguments
    // https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options#Token_8.2C_csv_import
    // Here we use Field Separator (1)	Text Delimiter (2)	Character Set (3) || wrong => for import Number of First Line (4)

    /* https://manpages.ubuntu.com/manpages/trusty/man1/doc2odt.1.html#import%20filters
    * 
    * The CSV IMPORT filter accepts a FilterOptions setting, the order is:
    *  separator(s),text-delimiter,encoding,first-row,column-format

    * The CSV export filter accepts various arguments, the order is:
    * field-seperator(s),text-delimiter,encoding
    */

    let filterOptions = `${fieldSeparator},${textDelimiter},${encoding}`;
    if (to === 'ods')
        filterOptions = `${filterOptions}${firstRow ? `,${firstRow}` : `${columnFormat ? ',' : ''}`}${columnFormat ? `,${columnFormat}` : ''}`;


    let command: string = undefined;

    if (to === 'csv') {
        command = oneLineTrim`
                mkdir -p ${tmpDir} && 
                cp ${src} ${tmpDir} && 
                cd ${tmpDir} && 
                UNOPATH=/usr/bin/libreoffice /usr/bin/python3.6 /usr/bin/unoconv -f csv -e FilterOptions=${filterOptions} ${fileName}
                `; //  && mv ${fileNoExt}.csv ${csvFile})
    } else {
        command = oneLineTrim`
                mkdir -p ${tmpDir} && 
                cp ${src} ${tmpDir} && 
                cd ${tmpDir} && 
                UNOPATH=/usr/bin/libreoffice /usr/bin/python3.6 /usr/bin/unoconv -f ods -i FilterOptions=${filterOptions} ${fileName}
                `;
    }

    if (verbose) {
        console.log(yellow`Convert ${src} to ${to}`);
        // console.log(yellow`command: ${command}`);
    }

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
