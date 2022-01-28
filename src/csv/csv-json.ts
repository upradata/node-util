
import csv from 'csvtojson';
import { Fileline } from 'csvtojson/v2/fileline';
import { CSVParseParam } from 'csvtojson/v2/Parameters';
import { MultipleRowResult, RowSplit } from 'csvtojson/v2/rowSplit';
import { TransformOptions } from 'stream';
import { delayedPromise } from '@upradata/util';


// To filter empty rows (row with all empty columns)
// There is no option to skip empty lines
// I found ti tick to enable it :)

const enableSkipEmptyRows = () => {
    const oldParseMultiLines = RowSplit.prototype.parseMultiLines;

    RowSplit.prototype.parseMultiLines = function (lines: Fileline[]) {
        const oldShift = lines.shift;
        const self = this;

        lines.shift = function () {
            let line: string = '';

            while (line === '' && lines.length > 0) {
                line = oldShift.call(lines);
                let delimiter: string;

                if (self.conv.parseRuntime.delimiter instanceof Array || self.conv.parseRuntime.delimiter.toLowerCase() === 'auto') {
                    delimiter = self.getDelimiter(line);
                } else
                    delimiter = self.conv.parseRuntime.delimiter;

                const isOnlyEmptyCols = line.split(delimiter).find(c => c !== '') === undefined;

                if (isOnlyEmptyCols)
                    line = '';
            }

            return line || '';
        };

        const oldIignoreEmpty = this.conv.parseParam.ignoreEmpty;
        this.conv.parseParam.ignoreEmpty = true;

        const processedLines = oldParseMultiLines.call(this, lines) as MultipleRowResult;

        this.conv.parseParam.ignoreEmpty = oldIignoreEmpty;
        return processedLines;
    };

    return () => {
        RowSplit.prototype.parseMultiLines = oldParseMultiLines;
    };
};


// Converter.then is defined => we can use it like a promise :)
export type CsvToJsonOpts = Partial<CSVParseParam & { skipEmptyRows?: boolean; }>;
export const csvToJson = <R>(file: string, param?: CsvToJsonOpts, options?: TransformOptions): Promise<R[]> => {
    const { promise, resolve, reject } = delayedPromise<R[]>();

    const disableSkipRows = param?.skipEmptyRows ? enableSkipEmptyRows() : () => { };

    // there is only "then" defined. It is better to get a real Promise and not a PromiseLike wihthout all methods
    csv({ delimiter: ';', ...param, }, options).fromFile(file).then(resolve, reject);

    return promise.then(json => {
        disableSkipRows();
        return json;
    });
};


// export type Row = ObjectOf<string>;
export type JsonToCsvOptions<T> = {
    headers?: [ keyof T ] extends [ never ] ? string[] : Array<keyof T>;
    nbKeys?: number;
    delimiter?: string;
};


export function jsonToCsv<T>(json: T[], options: JsonToCsvOptions<T> = {}): string {
    const { nbKeys, delimiter = ';' } = options;

    const getHeaders = () => {
        if (options.headers)
            return options.headers;

        // we are oblige to parse all the rows to be sure we have a full row to get the header keys
        const get = (next: IteratorResult<T>, headers: PropertyKey[]) => {
            const { value, done } = next;

            if (done)
                return headers;

            const row = value as T;
            const rowHeaders = Object.keys(row);

            if (nbKeys === rowHeaders.length) {
                // we stop if user specified that this is the number of keys
                return rowHeaders;
            }

            return get(it.next(), rowHeaders.length > headers.length ? rowHeaders : headers);
        };

        const it = json[ Symbol.iterator ]();

        return get(it.next(), []);
    };

    const headers = getHeaders();

    const csv = json.reduce((csv, row) => {
        const fullRow = {};

        for (const h of headers)
            fullRow[ h ] = row[ h ] ?? '';

        return csv + '\n' + Object.values(fullRow).join((delimiter));
    }, headers.join(delimiter));



    return csv;
}


export const csvHeaders = <H extends string = string>(file: string, options: { delimiter?: string; } = {}): Promise<H[]> => {
    const { promise, resolve, reject } = delayedPromise<H[]>();

    let headers: H[] = [];

    const csvStream = csv({ noheader: false, delimiter: options.delimiter || ';' }, { objectMode: true })
        .fromFile(file)
        .on('data', (line: {}) => {
            headers = Object.keys(line) as H[];
            csvStream.destroy();
            resolve(headers);
        })
        .on('error', reject);

    return promise;
};




// Not good if first row is not fully filled and so we cannot not deduce the header
/* jsonToCsv(json: Row[]) {
    const replacer = (key: string, value: any) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(json[ 0 ]);

    const csv = json.map(row => header.map(fieldName => JSON.stringify(row[ fieldName ], replacer)).join(';'));
    csv.unshift(header.join(';'));

    return csv.join('\r\n');
} */
