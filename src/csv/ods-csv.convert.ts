import path from 'path';
import fs from 'fs-extra';
import { ifThen } from '@upradata/util';
import { green, oneLineTrim, yellow } from '../template-style';
import { execAsync, ExecAsyncOptions, isExecLog } from '../useful';
import { odsToXlsx, xlsxToCsv, XslxToCsvOption } from './ods-xlsx.convert';
import { absolutePath } from './util';


export class OdsConvertOptions {
    exec: ExecAsyncOptions = { logOutput: { stdout: true } };
    sheetName: string;
    outputFileName: string;
    outputDir: string = '.';
    fieldSeparator: string = '59'; // ; (44 is ,) / 59/44 both
    textDelimiter: string = '34'; // "
    encoding: string = '76'; // utf-8
    firstRow: number = 1; // means starts from first line (k => starts from k-th line)
    columnFormat: string; // 1/5/2/1/3/1/4/1 (specified formats for each column (1 means standard, 5 means YY/MM/DD date))
    // https://wiki.openoffice.org/wiki/Framework/Article/Filter/FilterList_OOo_3_0
}


type ConvertType = 'csv->ods' | 'ods->csv';
const UNOCONV = 'UNOPATH=/usr/bin/libreoffice /usr/bin/python3.6 /usr/bin/unoconv';

const convert = async (filepath: string, options: Partial<OdsConvertOptions> & { conversionType: ConvertType; }) => {

    const {
        exec: execOptions, fieldSeparator, textDelimiter, encoding, firstRow, columnFormat, conversionType, outputFileName, outputDir
    } = Object.assign(new OdsConvertOptions(), options);

    const filename = path.parse(outputFileName || filepath).name; // basename without extension
    const outputFile = absolutePath({ dir: outputDir, filename });

    // The CSV export filter accepts various arguments
    // https://wiki.openoffice.org/wiki/Documentation/DevGuide/Spreadsheets/Filter_Options#Token_8.2C_csv_import
    // Here we use Field Separator (1)	Text Delimiter (2)	Character Set (3) || wrong => for import Number of First Line (4)

    /* https://manpages.ubuntu.com/manpages/trusty/man1/doc2odt.1.html#import%20filters
     *import { ExecOptions } from 'child_process';

     * The CSV IMPORT filter accepts a FilterOptions setting, the order is:
     *  separator(s),text-delimiter,encoding,first-row,column-format

     * The CSV export filter accepts various arguments, the order is:
     * field-seperator(s),text-delimiter,encoding
     */

    let filterOptions = `${fieldSeparator},${textDelimiter},${encoding}`;
    if (conversionType === 'ods->csv')
        filterOptions = `${filterOptions}${firstRow ? `,${firstRow}` : `${columnFormat ? ',' : ''}`}${columnFormat ? `,${columnFormat}` : ''}`;


    await fs.ensureDir(outputDir);
    await fs.copyFile(filepath, outputDir);


    const unoconvCommand = ifThen()
        .next({
            if: conversionType === 'ods->csv',
            then: `${UNOCONV} -f csv -e FilterOptions=${filterOptions} ${filename}`,
            else: `${UNOCONV} -f ods -i FilterOptions=${filterOptions} ${filename}`
        })
        .value;


    const command = oneLineTrim`
                cd ${outputDir} && 
                ${unoconvCommand}
                `;


    if (isExecLog(execOptions.logOutput, 'stdout')) {
        console.log(yellow`Converting ${filepath} to ${conversionType === 'csv->ods' ? 'ods' : 'csv'}`);
    }

    // unoconv is SOOOO good that only one process at a time can be executed. So we do it synchronously
    await execAsync(command, execOptions);

    if (isExecLog(execOptions.logOutput, 'stdout'))
        console.log(green`${outputFile} generated\n`);

    return outputFile;
};


export const odsToCsv = async (odsFile: string, options?: Partial<OdsConvertOptions>) => {
    if (options.sheetName) {
        const xlsxFile = await odsToXlsx(odsFile, options);
        return xlsxToCsv(xlsxFile, options as XslxToCsvOption);
    }

    return Promise.resolve(convert(odsFile, { ...options, conversionType: 'ods->csv' }));
};


export const csvToOds = (csvFile: string, options?: Partial<OdsConvertOptions>) => {
    return convert(csvFile, { ...options, conversionType: 'csv->ods' });
};
