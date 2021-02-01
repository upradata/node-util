
import { ObjectOf, isArray } from '@upradata/util';
import { highlightMagenta } from '../template-style';
import { Terminal, TableColumnConfig, TableRows, TableRow } from '../terminal';
import { Stat, StatCtor, StatData } from './stat';

type Statistics<S extends Stat> = ObjectOf<S | Statistics<S>>;

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



    log(...names: string[]) {
        const stats = names.length === 0 ? this.stats : this.get(...names);

        const datas: ObjectOf<ObjectOf<{ header: string[]; rows: TableRows; }> | GlobalStat> = {};
        const isGlobalStat = (statData: StatData): statData is { header: string[]; data: TableRow; } => !isArray(statData.data[ 0 ]);

        const addData = (fullName: string, stat: S) => {
            for (const [ dataName, data ] of Object.entries(stat.datas(fullName))) {
                if (data.data.length > 0) {

                    if (isGlobalStat(data)) {
                        const globalStat = datas[ dataName ] as GlobalStat || new GlobalStat();
                        globalStat.addData(data);

                        datas[ dataName ] = globalStat;
                    } else {
                        const stats = datas[ dataName ] || {};
                        stats[ fullName ] = data;

                        datas[ dataName ] = stats;
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
                    buildData(mergeName, stat);
            }
        };

        const terminal = new Terminal();

        if (this.isStat(stats))
            addData(stats.name, stats);
        else
            buildData('', stats as Statistics<S>);

        terminal.logTitle(`"${this.statsName}" summary`, { isBig: true, color: highlightMagenta });

        for (const [ dataName, data ] of Object.entries(datas).filter(([ _, d ]) => !(d instanceof GlobalStat))) {
            for (const [ name, { header, data: rows } ] of Object.entries(data)) {
                if (rows.length > 0) {
                    terminal.logTable({
                        data: rows,
                        header
                    });
                }
            }
        }

        for (const [ dataName, data ] of Object.entries(datas).filter(([ _, d ]) => (d instanceof GlobalStat))) {
            const { header, rows } = data as GlobalStat;

            if (rows.length > 0) {
                terminal.logTable({
                    data: rows,
                    header
                });
            }
        }

        return this;
    }
}



class GlobalStat {
    header: string[];
    rows: TableRows = [];

    addData(statData: { header: string[]; data: TableRow; }) {
        this.header = statData.header;
        this.rows.push(statData.data);
    }
}
