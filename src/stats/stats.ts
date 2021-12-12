
import { isArray, ObjectOf } from '@upradata/util';
import { highlightMagenta } from '../template-style';
import { TableColumnConfig, TableRow, TableRows, Terminal } from '../terminal';
import { Stat, StatCtor, StatData } from './stat';


export type Statistics<S extends Stat> = ObjectOf<S | Statistics<S>>;

export type StatTable = { headers: string[]; rows: TableRows; };
export type StatTableWithName = StatTable & { name: string; collectionName: string; };

export type OutputStat = Record<string /* stat name */, StatTableWithName>;
export type OutputStats = {
    global: OutputStat;
    detailed: Record<string /* collection name */, OutputStat>;
};


export class Stats<S extends Stat> {
    stats: Statistics<S> = {};

    constructor(public statsName: string, public StatClass: StatCtor<S>) { }

    private isStat(s: any): s is S {
        return s instanceof this.StatClass;
    }

    add(stat: S, ...names: string[]) {
        let stats: Statistics<S> = this.stats as Statistics<S> || {};
        this.stats = stats;

        names.forEach((name, i) => {
            if (i === names.length - 1)
                return;

            stats[ name ] = stats[ name ] || {};
            stats = stats[ name ] as Statistics<S>;

            if (stats instanceof this.StatClass)
                throw new Error(`${names.slice(0, i + 1).join('.')} is an existing Stat and not a Collection`);
        });

        stats[ names.slice(-1)[ 0 ] ] = stat;

        return stat;
    }


    create(...names: string[]): S {
        return this.add(new this.StatClass(names.join('.')), ...names);
    }

    get(...names: string[]) {
        let stat: Stat | Statistics<S> = this.stats[ names[ 0 ] ];

        for (const name of names.slice(1)) {
            if (!this.stats[ name ])
                return undefined;

            stat = stat[ name ];
        }

        return stat;
    }


    output(...names: string[]): OutputStats {
        const stats = names.length === 0 ? this.stats : this.get(...names);

        const datas: OutputStats = {
            detailed: {},
            global: {}
        };

        const isGlobalStat = (s: StatData): s is StatData<'global'> => !isArray(s.data[ 0 ]);

        const addData = (fullName: string, stat: S) => {
            for (const [ dataName, statData ] of Object.entries(stat.datas(fullName))) {
                if (statData.data?.length > 0) {

                    if (isGlobalStat(statData)) {
                        const stat = datas.global[ dataName ] as StatTableWithName || {
                            collectionName: '', name: dataName, headers: statData.headers, rows: []
                        };

                        stat.rows.push(statData.data);

                        datas.global[ dataName ] = stat;
                    } else {
                        const stat = (datas.detailed[ dataName ] || {}) as OutputStat;

                        const s = statData as StatData<'detailed'>;
                        stat[ dataName ] = { headers: s.headers, rows: s.data, name: dataName, collectionName: fullName };

                        datas.detailed[ fullName ] = stat;
                    }
                }
            }
        };

        const mergeNames = (name1: string, name2: string) => name1 === '' ? name2 : name1 + '.' + name2;

        const buildData = (parentName: string, stats: Statistics<S>) => {
            for (const [ name, stat ] of Object.entries(stats)) {
                const mergeName = mergeNames(parentName, name);

                if (this.isStat(stat))
                    addData(mergeName, stat);
                else
                    buildData(mergeName, stat as Statistics<S>);
            }
        };

        if (this.isStat(stats))
            addData(stats.name, stats);
        else
            buildData('', stats as Statistics<S>);



        return datas;
    }

    toString(...names: string[]): string;
    toString(names: string[], options?: { rowWidth?: number; }): string;
    toString(n: any, o?: any): string {
        const names = n as string[];
        const options = o as { rowWidth?: number; };

        const datas = this.output(...names);

        const terminal = new Terminal({ maxWidth: { row: { width: options.rowWidth } } });


        const toString = (data: OutputStat) => {
            for (const { name, collectionName, headers, rows } of Object.values(data)) {

                if (rows.length > 0) {
                    return terminal.table({
                        title: collectionName ? `${collectionName.replaceAll('.', ' ❯ ')} ⟹  ${name}` : name,
                        headers,
                        data: rows
                    });
                }
            }
        };


        const title = terminal.title(`"${this.statsName}" summary`, { type: 'band', style: highlightMagenta });

        return [
            ...Object.values(datas.detailed),
            datas.global
        ].reduce((s, data) => `${s}\n${toString(data)}`, `${title}\n`);
    }

    log(...names: string[]) {
        console.log(this.toString(...names));
        return this;
    }
}



class GlobalStat {
    headers: string[];
    rows: TableRows = [];

    addData(statData: { headers: string[]; data: TableRow; }) {
        this.headers = statData.headers;
        this.rows.push(statData.data);
    }
}
