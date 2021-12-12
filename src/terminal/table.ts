import { Alignment, table, TableUserConfig } from 'table';
import * as alignString from 'table/dist/src/alignString.js';
import * as calculateCellWidths from 'table/dist/src/calculateCellWidths';
import { makeTableConfig } from 'table/dist/src/makeTableConfig';
import {
    assignDefaultOption,
    assignRecursive,
    PartialRecursive,
    stringWidth
} from '@upradata/util';


type RemoveReadOnly<T> = {
    -readonly [ K in keyof T ]: T[ K ]
};

export type TableItem = string | number;
export type TableRow = TableItem[];
export type TableRows = TableRow[];


export type TableColumnConfig = TableUserConfig[ 'columns' ];

export type TableConfig = TableUserConfig & { singleLine?: boolean; };

export interface MaxRowWidth {
    width: number;
    indexToShrink?: number; // to do, make a list (1st cell, then 2nd cell if table size still too big, then 3rd....). Not only one index
}

export interface ColumnsMaxWidth {
    cell: number;
    row: MaxRowWidth;
}


export interface TableStringOption {
    maxWidth?: Partial<ColumnsMaxWidth>;
    tableConfig?: PartialRecursive<TableConfig>;
}



const oldAlignString = alignString.alignString;
(alignString as RemoveReadOnly<typeof alignString>).alignString = (subject: string, containerWidth: number, alignment: Alignment) => {
    if (alignment === 'center')
        return alignCenter(subject, containerWidth - stringWidth(subject));

    return oldAlignString(subject, containerWidth, alignment);
};

// Fix bug in table.alignCenter where instead of whiteSpaces % 2 there was halfWidth % 2!!
const alignCenter = (subject: string, whiteSpaces: number) => {
    let halfWidth: number;

    halfWidth = whiteSpaces / 2;

    if (whiteSpaces % 2 === 0)
        return ' '.repeat(halfWidth) + subject + ' '.repeat(halfWidth);

    halfWidth = Math.floor(halfWidth);
    return ' '.repeat(halfWidth) + subject + ' '.repeat(halfWidth + 1);
};


// I use makeConfig in this class and I use it with string|number while it is intending to use it with string only
// I just convert value to value + ''

(calculateCellWidths as RemoveReadOnly<typeof calculateCellWidths>).calculateCellWidths = (cells: TableRow) => {
    return cells.map(value => {
        return Math.max(...(`${value}`).split('\n').map(line => stringWidth(line)));
    });
};



export class TableString {
    userConfig: TableConfig;
    maxWidth: Partial<ColumnsMaxWidth>;


    constructor(option: TableStringOption = {}) {

        this.userConfig = assignDefaultOption<TableConfig>({
            columnDefault: { truncate: 200 }
        }, option.tableConfig);

        this.maxWidth = option.maxWidth || { row: { width: process.stdout.columns || 80 } };
    }

    get(data: TableRows, options?: TableConfig) {
        // we compute it to get tableConfig.columns value computed to have paddingLeft, paddingRight
        // needed in this.getColumnsWidth
        const opts = assignRecursive({}, this.userConfig, options);
        const builtConfig = makeTableConfig(data, opts) as TableConfig;


        const config = assignRecursive(
            { columns: this.getColumnsWidth(data, builtConfig) },
            opts
        ) as TableConfig;

        return table(data, config);
    }

    getCellsRowWidth(row: TableRow) {
        return row.map(cell =>
            Math.max(...(`${cell}`).split('\n').map(line => stringWidth(line)))
        );
    }

    getColumnsWidth(table: TableRows, builtConfig: TableConfig): TableColumnConfig {
        const { cell: maxCellWidth, row: rowWidth } = this.maxWidth;

        const firstRow = table[ 0 ];

        if (!firstRow) {
            throw new Error('Dataset must have at least one row.');
        }

        const columnsWidth: number[] = Array(firstRow.length).fill(0);

        for (const row of table) {
            const cellsRowWidth = this.getCellsRowWidth(row);

            for (const [ i, cellWidth ] of Object.entries(cellsRowWidth)) {
                if (cellWidth > columnsWidth[ i ])
                    columnsWidth[ i ] = cellWidth;
            }

        }

        if (maxCellWidth)
            return columnsWidth.map(w => ({ width: Math.min(w, maxCellWidth) }));

        if (rowWidth)
            this.resizeColumnsWidth(columnsWidth, builtConfig);

        return columnsWidth.map(w => ({ width: w }));
    }

    private maxValue(array: number[]) {
        return array.reduce((max, w) => Math.max(max, w), 0);
    }

    private resizeColumnsWidth(columnsWidth: number[], builtConfig: TableConfig) {
        // tslint:disable-next-line: prefer-const
        const { width, indexToShrink } = this.maxWidth.row;

        const nbCol = columnsWidth.length;
        // const { paddingLeft, paddingRight } = this.config.columns[ 0 ];
        const paddingLeft = this.maxValue(Object.values(builtConfig.columns).map(c => c.paddingLeft));
        const paddingRight = this.maxValue(Object.values(builtConfig.columns).map(c => c.paddingRight));

        const totalPaddingCells = nbCol * (paddingLeft + paddingRight) + (nbCol + 1); // we assume all rows have same padding (we could )

        const lineWidth = width - totalPaddingCells;
        let index = indexToShrink;

        const totalWidth = columnsWidth.reduce((sum, w) => sum + w, 0); // row width (whitout padding and vertical bar => just text)

        if (totalWidth > lineWidth) {
            if (!index) {
                // cell that is the widest
                index = columnsWidth.findIndex(cellW => this.maxValue(columnsWidth) === cellW);
            }

            const shrinkWidth = columnsWidth[ index ] - (totalWidth - lineWidth);

            if (shrinkWidth < 4) { // 4 is min width => todo: make an option
                // so we will shrink the next bigger cell
                const maxShrinkWidth = columnsWidth[ index ] - 4;

                columnsWidth[ index ] = maxShrinkWidth;
                return this.resizeColumnsWidth(columnsWidth, builtConfig);
                // tslint:disable-next-line: no-else-after-return
            } else
                columnsWidth[ index ] = shrinkWidth;
        }

        return columnsWidth;
    }
}




/* const tableBorder = {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `┌`,
    topRight: `┐`,

    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `└`,
    bottomRight: `┘`,

    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,

    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`
}; */

/* const tableColumns = {
    0: {
        alignment: 'left',
        width: 10
    },
    1: {
        alignment: 'center',
        // width: 10
    },
    2: {
        alignment: 'right',
        width: 10,
        truncate: 100
    }
}; */

/* export interface TableConfig {
    border: JoinStruct;
    columns: ObjectOf<{ alignment: 'left' | 'center' | 'right', with: number; truncate: number }>;
    singleLine: boolean;
} */
