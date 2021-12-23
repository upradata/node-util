import { CSVParseParam } from 'csvtojson/v2/Parameters';
import { TransformOptions } from 'stream';
import {
    compose,
    ifThen,
    isDefined,
    isDefinedProp,
    isUndefined,
    keys,
    makeObject,
    mergeRegexes,
    MergeRexesOptions,
    regexToString
} from '@upradata/util';
import { csvToJson } from './csv-json';


export type Parser<D = string, N = unknown> = (data: D) => N;

export class ParserOptions<E = unknown> {
    emptyCell: E = undefined;
    parser: Parser = undefined;
}

// type Recordify<O extends { default: string; }, T> = Record<keyof O, T>;
// type Recordify2<O extends { default: string; }, T> = { [ K in keyof O ]: T<O[ K ]>> };


export type ParsersOpt = Partial<ParserOptions> | 'default';
export type ParsersOpts<O extends { default?: string; }> = Partial<Record<keyof O, ParsersOpt>>;


const isDefault = (o: any): o is 'default' => o === 'default';



// here we cannot use CsvTextDataRecordify because the value depends of "K" (it is not an object of all the same type)
// O is the type of a row, for instance { header1: string; header2: number; }
export type ParsersOptions<O extends { default?: string; }> = { [ K in keyof O ]?: ParserOptions<O[ K ]> };

export type Parsers<O extends { default?: string; }> = Partial<Record<keyof O, Parser>>;


// const numberToComma = (n: number | string) => `${n}`.replace('.', ',');
const commaToNumber = (s: number | string) => isDefined(s) ? parseFloat(`${s}`.replace(',', '.')) : s;

export const cellParsers = {
    boolean: (cellData: string | boolean) => typeof cellData === 'boolean' ? cellData : cellData === 'true',
    string: (cellData: string) => cellData,
    number: (cellData: string) => commaToNumber(cellData),
    arrayString: (cellData: string) => isDefined(cellData) ? cellData.replace(/[\[\]]/g, '').split(',') : cellData,
    arrayNumber: (cellData: string) => isDefined(cellData) ? cellData.replace(/[\[\]]/g, '').split(',').map(commaToNumber) : cellData,
    setEmptyCell: <T>(emptyCell: T) => (cellData: string | undefined) => cellData === '' || isUndefined(cellData) ? emptyCell : cellData
};



const $ = mergeRegexes;
const $s = regexToString;
type SegExp = string | RegExp;


const regexes = {
    nb: /[0-9]+\.?[0-9]*/,
    bracket: (element: SegExp, options?: MergeRexesOptions) => $([ /\[/, element, /]/ ], options),
    optionalBreacket: (element: SegExp, options?: MergeRexesOptions) => $([ /\[?/, element, /\]?/ ], options),
    trim: (regex: SegExp, options?: MergeRexesOptions) => $([ /\s*/, regex, /\s*/ ], options),
    startEnd: (regex: SegExp, options?: MergeRexesOptions) => $([ '^', regex, '$' ], options),
    or: (...regexes: SegExp[]) => $(regexes, { groupify: true, join: '|' }),
    compose: (functions: Array<(regex: SegExp) => SegExp>, value: SegExp, flags?: string) => $([ compose(functions, value) ], { flags })
};


const rx = regexes;

export const regexParsers = {
    boolean: rx.compose([ rx.startEnd, rx.trim ], /(true|false)/, 'i'),
    string: /.*/,
    number: rx.compose([ rx.startEnd, rx.trim ], rx.nb),
    arrayString: rx.or(
        rx.compose([ rx.startEnd, rx.trim, rx.bracket ], /.*/),
        rx.compose([ rx.startEnd, rx.trim, rx.optionalBreacket ], /(.*,)+.*/)
    ),
    // '[1.444,  2 , 3 , 4441.222 ]' or '1.444,  2 , 3 , 4441.222'
    arrayNumber: rx.or(
        rx.compose([ rx.startEnd, rx.trim, rx.bracket, rx.trim ], rx.nb),
        rx.compose([ rx.startEnd, rx.trim, rx.optionalBreacket ],
            $([ `(${$s(rx.trim(regexes.nb))},)+`, rx.trim(regexes.nb) ])
        )
    )
};


export const autoParser = (emptyCell: any = '') => (cellData: string) => {
    const parser = ifThen()
        .next({ if: regexParsers.boolean.test(cellData), then: cellParsers.boolean })
        .next({ if: regexParsers.number.test(cellData), then: cellParsers.number })
        .next({ if: regexParsers.arrayNumber.test(cellData), then: cellParsers.arrayNumber })
        .next({ if: regexParsers.arrayString.test(cellData), then: cellParsers.arrayString })
        .next({ then: cellParsers.string })
        .value;

    return cellDataParser(parser, emptyCell);
};

export const cellDataParser = (parser: Parser<string, unknown>, emptyCell: any) => (cellData: string) => {
    return compose([ parser, cellParsers.setEmptyCell(emptyCell) ], cellData);
};

export const getParsers = <O extends { default?: string; }, Headers extends string = DefaultHeaders<O>>(
    headers: Headers[] = [], defaultParserOptions: ParsersOptions<O> = {}, parsersOptions: ParsersOpts<O> = {}
): Parsers<O> => {

    const names = ifThen()
        .next({ if: headers.length > 0, then: headers })
        .next({ if: keys(parsersOptions).length > 0, then: keys(defaultParserOptions) })
        .next({ if: keys(defaultParserOptions).length > 0, then: keys(defaultParserOptions), else: [] as string[] })
        .value as string[];

    const parsers = names.map(name => {
        const defaultParser = defaultParserOptions[ name ] as ParserOptions || defaultParserOptions.default || { emptyCell: '', parser: cellParsers.string };
        const option = parsersOptions[ name ];

        const emptyCell = ifThen()
            .next({ if: isUndefined(option), then: defaultParser.emptyCell })
            .next({ if: isDefault(option), then: defaultParser.emptyCell, next: parsersOptions as ParserOptions })
            .next(option => ({ if: isDefinedProp(option, 'emptyCell'), then: option.emptyCell, else: defaultParser.emptyCell }))
            .value;

        const parser = ifThen()
            .next({ if: isUndefined(option), then: defaultParser.parser })
            .next({ if: isDefault(option), then: defaultParser.parser, next: parsersOptions as ParserOptions })
            .next(option => ({ if: isDefinedProp(option, 'parser'), then: option.parser, else: defaultParser.parser }))
            .value;

        return { name, parser: cellDataParser(parser, emptyCell) };
    });

    return makeObject(parsers, ({ name, parser }) => ({ key: name, value: parser })) as any;
};



export type CsvOptions<Headers extends string = string> = Partial<Omit<CSVParseParam, 'headers'>> & { headers?: Headers[]; };

type DefaultHeaders<O> = Exclude<keyof O & string, 'default'>;

export const csvToJsonWithDefaultParsers = <O extends { default?: string; }>(defaultParserOptions: ParsersOptions<O> = {}) =>
    <R, Headers extends string = DefaultHeaders<O>>(
        file: string, csvOptions?: CsvOptions<Headers>, options: { stream?: TransformOptions; parsers?: ParsersOpts<O>; } = {}
    ): Promise<R[]> => {

        return csvToJson<R>(file, {
            colParser: getParsers(csvOptions.headers, defaultParserOptions, options.parsers),
            ...csvOptions
        }, options.stream);
    };


export const csvToJsonWithAutoParsers = <O extends { default?: string; }, R, Headers extends string = DefaultHeaders<O>>(
    file: string, csvOptions?: CsvOptions<Headers>, options: { stream?: TransformOptions; parsers?: ParsersOpts<O>; } = {}
): Promise<R[]> => {

    return csvToJsonWithDefaultParsers<O>({
        default:
            { emptyCell: undefined, parser: autoParser(undefined) }
    })(file, csvOptions, options);
};


/*

EXAMPLE:

interface CsvTextDataBase {
    rootId: string;
    path: string;
    editorPath: string;
    updated: boolean;
    static: boolean;
    type: TextDataType;
}

type CsvTextDataParsersOption = CsvTextDataBase & { default: string; };
type CsvTextDataParsersOptions = ParsersOptions<CsvTextDataParsersOption>;

const defaultParserOptions: CsvTextDataParsersOptions = {
    rootId: { emptyCell: '', parser: cellParsers.string },
    path: { emptyCell: '', parser: cellParsers.string },
    editorPath: { emptyCell: '', parser: cellParsers.string },
    updated: { emptyCell: false, parser: cellParsers.boolean },
    static: { emptyCell: true, parser: cellParsers.boolean },
    type: { emptyCell: 'normal', parser: cellParsers.string },
    default: { emptyCell: '', parser: cellParsers.string }
};


const csvToJson = csvToJsonWithDefaultOptions(defaultParserOptions);

const csvTextDataToJson = <R extends ImportedTextData>(csvFile: string, options: CsvToJsonOptions<CsvTextDataParsersOption> = {}) => {
    return csvToJson<R>(csvFile, {
        headers: textHeaders(), ...options
    });
};

*/
