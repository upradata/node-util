
import csv from 'csvtojson';
import { CSVParseParam } from 'csvtojson/v2/Parameters';
import { TransformOptions } from 'stream';

export function csvToJson<R>(file: string, param?: Partial<CSVParseParam>, options?: TransformOptions): Promise<R[]> {
    return csv({ delimiter: ';', ...param, }, options).fromFile(file) as any;
}

// export type Row = ObjectOf<string>;

export function jsonToCsv<T>(json: T[], options: { csvColumnKeys?: Array<keyof T>; nbKeys?: number; } = {}): string {
    const { csvColumnKeys, nbKeys } = options;

    let header: string[] = csvColumnKeys ? csvColumnKeys as any : [];

    if (!csvColumnKeys) {
        // we are oblige to parse all the rows to be sure we have a full row to get the header keys
        for (const row of json) {
            const headers = Object.keys(row);
            if (headers.length > header.length || nbKeys === headers.length) {
                header = headers;
                // we stop if user specified that this is the number of keys
                if (nbKeys === headers.length)
                    break;
            }
        }
    }

    let csv = header.join(';');

    for (const row of json) {
        const fullRow = {};

        for (const h of header)
            fullRow[ h ] = row[ h ] ?? '';

        csv += '\n' + Object.values(fullRow).join((';'));
    }

    return csv;
}


// Not good if first row is not fully filled and so we cannot not deduce the header
/* jsonToCsv(json: Row[]) {
    const replacer = (key: string, value: any) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(json[ 0 ]);

    const csv = json.map(row => header.map(fieldName => JSON.stringify(row[ fieldName ], replacer)).join(';'));
    csv.unshift(header.join(';'));

    return csv.join('\r\n');
} */
