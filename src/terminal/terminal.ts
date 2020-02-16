import { TableRows, TableRow, TableString, TableItem, TableStringOption } from './table';
import { StyleTemplate, colors } from '../style/style';
import { chain } from '@upradata/util';


export interface TitleOption {
    color?: StyleTemplate;
    isBig?: boolean;
}


export interface TableOption {
    data: TableRows;
    header?: TableRow;
}


export class Terminal {
    static width = process.stdout.columns || 80;

    private tableString: TableString;

    constructor(option?: TableStringOption) {
        this.tableString = new TableString(option);
    }

    get lineWidth() {
        const { maxWidth } = this.tableString;
        return chain(() => maxWidth.row.width) || Terminal.width;
    }

    fullWidth(text: string, style: StyleTemplate) {
        return style`${text}`.repeat(Terminal.width);
    }

    title(title: string, option: TitleOption = {}): string {
        const { color = colors.none.$, isBig = false } = option;
        const lineWidth = this.lineWidth;

        let s = '';

        if (isBig)
            s += color`${' '.repeat(lineWidth)}` + '\n';

        s += color`${this.alignCenter(title.toUpperCase(), lineWidth)}` + '\n';

        if (isBig)
            s += color`${' '.repeat(lineWidth)}` + '\n';

        return s;
    }

    logTitle(title: string, option?: TitleOption) {
        console.log(this.title(title, option));
    }

    table({ data, header }: TableOption): string {
        const d: TableItem[][] = header ? [ header ] : [];

        if (Array.isArray(data[ 0 ]))
            d.push(...data as any);
        else
            d.push([ data as any ]);


        return this.tableString.get(d);
    }

    logTable(option: TableOption) {
        console.log(this.table(option));
    }

    alignCenter(s: string, size: number): string {

        const trim = s.trim();
        const whitespaceWidth = size - trim.length;

        if (whitespaceWidth <= 0)
            return s;

        const beginL = Math.floor(whitespaceWidth / 2) - 1; // -1 je ne sais pas pk :)
        const endL = whitespaceWidth - beginL;


        return ' '.repeat(beginL) + trim + ' '.repeat(endL);
    }

    logAlignCenter(s: string, size: number) {
        this.alignCenter(s, size);
    }
}


export const terminal = new Terminal();
