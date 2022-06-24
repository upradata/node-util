import path from 'path';
import { oneLineTrim } from '@upradata/util';
import { execAsync, fileExists, poll } from '../useful';
import { absolutePath } from './util';


const execAndPoll = async (options: { command: string; outputFile: string; } & XlsxOption) => {
    const { command, outputFile, verbose: logOutput, maxWait = 2000 } = options;

    return execAsync(command, { logOutput })
        .then(async () => poll(async () => ({
            stop: await fileExists.async(outputFile),
            success: '',
            error: new Error(oneLineTrim`
                Error while command "${command}".
                If LibreOffice is opened, it cannot work. Please, be sure to close all LibreOffice instances (Writer, Calc, ...).
                It is possible that the conversion succeeded but the OS did not write the output after a maximum waiting time of ${maxWait}ms. (LibreOffice bug)`)
        }), { duration: maxWait }));
};



export interface XlsxOption {
    outputFileName?: string;
    outputDir?: string;
    verbose?: boolean;
    maxWait?: number;
}


export type OdsToXlsxOption = XlsxOption;

export async function odsToXlsx(filepath: string, option: OdsToXlsxOption): Promise<string> {
    const { outputFileName, outputDir = '.', verbose, maxWait = 2000 } = option;

    if (!(await fileExists.async(filepath)))
        throw new Error(`file at location "${filepath}" does not exist!`);

    const xlsxFileName = `${path.basename(filepath, '.ods')}.xlsx`;
    const xlsxFile = path.join(outputDir, xlsxFileName);

    await execAndPoll({
        command: `libreoffice --headless --convert-to xlsx ${filepath} --outdir ${outputDir}`,
        verbose,
        outputFile: xlsxFile,
        maxWait
    });

    if (outputFileName) {
        await execAsync(`cp ${outputDir} && mv ${xlsxFile} ${outputFileName}`);
        return path.join(outputDir, outputFileName);
    }

    return xlsxFile;
}


export type XslxToCsvOption = XlsxOption & { sheetName: string; };

export async function xlsxToCsv(filepath: string, option: XslxToCsvOption): Promise<string> {
    const { sheetName, outputFileName, outputDir = '.', verbose, maxWait } = option;

    const filename = outputFileName || `${sheetName.toLocaleLowerCase()}.csv`;
    const outputFile = await absolutePath({ dir: outputDir, filename });

    await execAndPoll({
        command: `xlsx2csv -n ${sheetName} -d ';' ${filepath} ${outputFile}`,
        verbose,
        outputFile,
        maxWait
    });


    return outputFile;
}
