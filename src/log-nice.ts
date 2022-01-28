import { isArray, isPlainObject, entries } from '@upradata/util';
import { bold, styles as s } from './template-style';


const open = (v: any[] | object, style: BracketStyle) => style(isArray(v) ? '[' : '{');
const close = (v: any[] | object, style: BracketStyle) => style(isArray(v) ? ']' : '}');


const defaultV = {
    key: (k: PropertyKey) => bold`${k}`,
    value: (v: any) => `${v}`,
    bracket: (v => v === '[' || v === ']' ? s.bold.yellow.$`${v}` : s.bold.green.$`${v}`) as BracketStyle,
    indentize: (o => o.symbol.repeat(o.size)) as Indentize
};


export type BracketStyle = (v: '{' | '}' | '[' | ']') => string;
export type Indentize = (options: { level: number, size: number, symbol: string; }) => string;

export type NiceOptions = {
    indent?: number;
    indentSymbol?: string;
    indentize?: Indentize;
    key?: (key: PropertyKey) => string;
    value?: (v: any) => string;
    bracket?: BracketStyle;
};



export const nice = (v: any, options: NiceOptions = {}): string => {
    const {
        indent: indentSize = 4,
        indentSymbol = ' ',
        key = defaultV.key,
        value = defaultV.value,
        bracket = defaultV.bracket,
        indentize = defaultV.indentize
    } = options;

    const _ = (u: any, indentCount: number, level: number = 0): string => {
        const indentKey = indentize({ symbol: indentSymbol, size: indentCount, level: level + 1 });
        const indentClose = indentize({ symbol: indentSymbol, size: indentCount - indentSize, level });

        if (isArray(u) || isPlainObject(u)) {

            const s = entries(u).reduce((s, [ k, v ]) => {
                return `${s}\n${indentKey}${key(k)}: ${_(v, indentCount + indentSize + `${k}`.length + 2, level + 1)}`;
            }, `${open(u, bracket)}`);

            return `${s}\n${indentClose}${close(u, bracket)}`;
        }

        return value(u);
    };

    return _(v, indentSize);
};


/* console.log(nice({
    a: 1,
    b: 2,
    c: 3,
    ddddddd: {
        d1: 1, d2: { d3: 11, d4: 44 }
    },
    arr: [
        1, 2, { a: 1, b: [ 1, 2, 4 ] }
    ]
}, { indent: 2, indentSymbol: '.' }));
 */
