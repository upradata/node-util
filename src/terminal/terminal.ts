import { composeLeft, stringWidth, StyleTransformString } from '@upradata/util';
import { styles } from '../template-style';
import {
    TableConfig,
    TableItem,
    TableRow,
    TableRows,
    TableString,
    TableStringOption
} from './table';


export class TitleOptions {
    style?: StyleTransformString<string> = styles.none.transform;
    bgStyle?: StyleTransformString<string> = styles.none.transform;
    // backward-compatible => now use type === 'band'
    isBig?: boolean = false;
    type?: 'one-line' | 'two-strips' | 'top-strip' | 'bottom-strip' | 'band' = 'one-line';
    transform?: (s: string) => string = s => s;
    alignCenter?: boolean;
}


export interface TableData {
    data: TableRows;
    headers?: TableRow;
    title?: string;
}


export class Terminal {
    static width = process.stdout.columns || 80;

    private tableString: TableString;

    constructor(option?: TableStringOption) {
        this.tableString = new TableString(option);
    }

    get lineWidth() {
        const { maxWidth } = this.tableString;
        return maxWidth?.row?.width || Terminal.width;
    }

    fullWidth(text: string, style: StyleTransformString<string> = styles.none.transform) {
        return style(text).repeat(this.lineWidth);
    }

    logFullWidth(text: string, style?: StyleTransformString<string>) {
        console.log(this.fullWidth(text, style));
    }

    colorLine(style: StyleTransformString<string>) {
        return this.fullWidth(' ', style);
    }

    logColorLine(style: StyleTransformString<string>) {
        console.log(this.colorLine(style));
    }

    title(title: string, options: TitleOptions = {}): string {
        const { style, bgStyle, isBig, type, transform, alignCenter = true } = Object.assign(new TitleOptions(), options);

        const titleType = isBig ? 'band' : type;

        const message = composeLeft([ transform, alignCenter ? this.alignCenter.bind(this) : (s: string) => s, style ], title);

        if (titleType === 'one-line')
            return message;

        const bg = this.colorLine(bgStyle);

        if (titleType === 'band')
            return `${bg}\n${message}\n${bg}`;

        if (titleType.includes('strip')) {
            switch (titleType) {
                case 'two-strips': return `${bg}\n${message}\n${bg}`;
                case 'top-strip': return `${bg}\n${message}`;
                case 'bottom-strip': return `${message}\n${bg}`;
            }
        }

        console.warn(`title with type "${type}" not implemented. Default to 'one-line'`);

        return message;
    }

    logTitle(title: string, option?: TitleOptions) {
        console.log(this.title(title, option));
    }

    table({ data, headers, title }: TableData, config?: TableConfig): string {
        const d: TableItem[][] = headers ? [ headers, ...data ] : data;

        const c = {
            header: title ? {
                alignment: 'center',
                content: title,
            } : undefined,
            ...config
        } as TableConfig;

        return this.tableString.get(d, c);
    }

    logTable(data: TableData, config?: TableConfig) {
        console.log(this.table(data, config));
    }

    alignCenter(s: string, size: number = this.lineWidth): string {

        const trim = s.trim();
        const whitespaceWidth = size - stringWidth(trim); // stringWidth for invisible chars

        if (whitespaceWidth <= 0)
            return s;

        const beginL = Math.floor(whitespaceWidth / 2) - 1; // -1 je ne sais pas pk :)
        const endL = whitespaceWidth - beginL;


        return ' '.repeat(beginL) + trim + ' '.repeat(endL);
    }

    logAlignCenter(s: string, size: number) {
        console.log(this.alignCenter(s, size));
    }
}


export const terminal = new Terminal();
