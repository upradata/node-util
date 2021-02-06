import { csvToJson } from './csv-json';
import { makeObject, mergeRegexes, MergeRexesOptions, regexToString, compose, isUndefined, ifChained, isDefinedProp } from '@upradata/util';

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

export const cellParsers = {
    boolean: (cellData: string | boolean) => typeof cellData === 'boolean' ? cellData : cellData === 'true' ? true : false,
    string: (cellData: string) => cellData,
    number: (cellData: string) => parseFloat(cellData),
    arrayString: (cellData: string) => cellData.replace(/[\[\]]/g, '').split(','),
    arrayNumber: (cellData: string) => cellData.replace(/[\[\]]/g, '').split(',').map(parseFloat),
    setEmptyCell: <T>(emptyCell: T) => (cellData: string) => cellData === '' ? emptyCell : cellData
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
    const parser = ifChained(cellData)
        .next(cellData => ({ if: regexParsers.boolean.test(cellData), then: cellParsers.boolean }))
        .next(cellData => ({ if: regexParsers.number.test(cellData), then: cellParsers.number }))
        .next(cellData => ({ if: regexParsers.arrayNumber.test(cellData), then: cellParsers.arrayNumber }))
        .next(cellData => ({ if: regexParsers.arrayString.test(cellData), then: cellParsers.arrayString }))
        .next(cellData => ({ then: cellParsers.string }))
        .value;

    return compose([ parser, cellParsers.setEmptyCell(emptyCell) ], cellData);
};

export const cellDataParser = (parser: Parser<string, unknown>, emptyCell: any) => (cellData: string) => {
    return compose([ parser, cellParsers.setEmptyCell(emptyCell) ], cellData);
};

export const getParsers = <O extends { default?: string; }>(
    headers: (keyof O)[] = [], defaultParserOptions: ParsersOptions<O> = {}, parsersOptions: Partial<ParsersOpts<O>> = {}
): Parsers<O> => {

    const names = ifChained()
        .next({ if: headers.length > 0, then: headers })
        .next({ if: Object.keys(parsersOptions).length > 0, then: Object.keys(defaultParserOptions) })
        .next({ if: Object.keys(defaultParserOptions).length > 0, then: Object.keys(defaultParserOptions), else: [] as string[] })
        .value as string[];

    const parsers = names.map(name => {
        const defaultParser = defaultParserOptions[ name ] as ParserOptions || defaultParserOptions.default || { emptyCell: '', parser: cellParsers.string };
        const option = parsersOptions[ name ];

        const emptyCell = ifChained()
            .next({ if: isUndefined(option), then: defaultParser.emptyCell })
            .next({ if: isDefault(option), then: defaultParser.emptyCell, next: parsersOptions as ParserOptions })
            .next(option => ({ if: isDefinedProp(option, 'emptyCell'), then: option.emptyCell, else: defaultParser.emptyCell }))
            .value;

        const parser = ifChained()
            .next({ if: isUndefined(option), then: defaultParser.parser })
            .next({ if: isDefault(option), then: defaultParser.parser, next: parsersOptions as ParserOptions })
            .next(option => ({ if: isDefinedProp(option, 'parser'), then: option.parser, else: defaultParser.parser }))
            .value;

        return { name, parser: cellDataParser(parser, emptyCell) };
    });

    return makeObject(parsers, ({ name, parser }) => ({ key: name, value: parser })) as any;
};




export interface CsvToJsonOptions<O extends { default?: string; }> {
    headers?: (keyof O)[],
    parsersOptions?: ParsersOpts<O>;
}



export const csvToJsonWithDefaultOptions = <O extends { default?: string; }>(defaultParserOptions: ParsersOptions<O> = {}) =>
    <R>(csvFile: string, options: CsvToJsonOptions<O>): Promise<R[]> => {

        return csvToJson<R>(csvFile, {
            colParser: getParsers(options.headers, defaultParserOptions, options.parsersOptions)

        });
    };


export const csvToJsonWithOptions = <O extends { default?: string; }, R>(csvFile: string, options: CsvToJsonOptions<O>): Promise<R[]> => {

    return csvToJsonWithDefaultOptions()(csvFile, options as any);
};
