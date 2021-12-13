
import { camelize, CamelCase } from '@upradata/util';
import { highlightMagenta } from '../template-style';
import { TableRow, TableRows, Terminal } from '../terminal';
import { Stat, StatCtor, StatData } from './stat';
import {
    Statistics, StatTableWithName, StatCollection, OutputStats, StatsToStringOptions,
    SortData, StatSorter, SortType, statSorters
} from './types';


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
        return names.reduce((stat, name) => stat[ name ] || {}, this.stats);
    }


    output(...names: string[]): OutputStats {
        const stats = names.length === 0 ? this.stats : this.get(...names);

        const datas: OutputStats = {
            collections: {},
            global: {}
        };

        const isGlobalStat = (s: StatData): s is StatData<'global'> => !Array.isArray(s.data[ 0 ]);

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
                        const collection = (datas.collections[ fullName ] || { collectionName: fullName, stats: {} }) as StatCollection;

                        const s = statData as StatData<'detailed'>;
                        collection.stats[ dataName ] = { headers: s.headers, rows: s.data, name: dataName, collectionName: fullName };

                        datas.collections[ fullName ] = collection;
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
    toString(names: string[], options?: StatsToStringOptions): string;
    toString(...args: any[]): string {
        const hasOptions = Array.isArray(args[ 0 ]);

        const names = (hasOptions ? args[ 0 ] || [] : args) as string[];
        const options = (hasOptions ? args[ 1 ] || {} : {}) as StatsToStringOptions;

        const datas = this.output(...names);

        const terminal = new Terminal({ maxWidth: { row: { width: options?.rowWidth } } });


        const toString = ({ name, collectionName, headers, rows }: StatTableWithName) => {
            if (rows.length > 0) {
                return terminal.table({
                    title: collectionName ? `${collectionName.replaceAll('.', ' ❯ ')} ⟹  ${name}` : name,
                    headers,
                    data: rows
                });
            }
        };

        const title = terminal.title(`"${this.statsName}" summary`, { type: 'band', style: highlightMagenta });

        const sort = <T extends SortType>(datas: SortData<T>[], type: T): SortData<T>[] => {
            const sorter = options.sort?.[ camelize(type) ] as StatsToStringOptions[ 'sort' ][ CamelCase<T> ];

            if (!sorter)
                return datas;

            const s = (typeof sorter === 'function' ? sorter : statSorters[ camelize(sorter) ](type)) as StatSorter<T>;
            return s(datas);
        };


        const stats = [
            ...sort(Object.values(datas.collections), 'collections').flatMap(c => Object.values(c.stats)),
            /* ...sort(
                sort(Object.values(datas.detailed), 'collections').flatMap(c => Object.values(c.stats)),
                'stats'
            ), */
            ...sort(Object.values(datas.global).map(stats => options.sort?.globalRows ? ({
                ...stats,
                rows: sort(stats.rows, 'global-rows')
            }) : stats), 'stats')
        ];

        return stats.reduce((s, data) => `${s}\n${toString(data)}`, `${title}\n`);
    }


    log(...names: string[]): this;
    log(names: string[], options?: StatsToStringOptions): this;
    log(...args: any[]): this {
        console.log(this.toString(...args));
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
