
import { isArray, ObjectOf } from '@upradata/util';
import { highlightMagenta } from '../template-style';
import { TableColumnConfig, TableRow, TableRows, Terminal } from '../terminal';
import { Stat, StatCtor, StatData } from './stat';


export type Statistics<S extends Stat> = ObjectOf<S | Statistics<S>>;

export type StatTable = { headers: string[]; rows: TableRows; };
export type StatTableWithName = StatTable & { name: string; collectionName: string; };

export type OutputStat = Record<string /* stat name */, StatTableWithName>;
export type StatCollection = { collectionName: string; stats: OutputStat; };

export type OutputStats = {
    global: OutputStat;
    detailed: Record<string /* collection name */, StatCollection>;
};


export type SortType = keyof StatsToStringOptions[ 'sort' ];
type SortData<T extends SortType> = T extends 'stats' ? StatTableWithName : StatCollection;

export type StatsSorter<T extends SortType> = (stats: SortData<T>[]) => SortData<T>[];

export interface StatsToStringOptions {
    rowWidth?: number;
    sort?: {
        stats?: boolean | StatsSorter<'stats'>;
        collections?: boolean | StatsSorter<'collections'>;
    };
}


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

        const stat = names.reduce((stat, name) => stat[ name ] || {}, this.stats);
        return stat;
        /*   let stat: Stat | Statistics<S> = this.stats[ names[ 0 ] ];
  
          for (const name of names.slice(1)) {
              if (!this.stats[ name ])
                  return undefined;
  
              stat = stat[ name ];
          }
  
          return stat; */
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
                        const collection = (datas.detailed[ dataName ] || { collectionName: fullName, stats: {} }) as StatCollection;

                        const s = statData as StatData<'detailed'>;
                        collection.stats[ dataName ] = { headers: s.headers, rows: s.data, name: dataName, collectionName: fullName };

                        datas.detailed[ fullName ] = collection;
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
        const isOptions = typeof args.slice(-1)[ 0 ] === 'object';

        const names = (isOptions ? args.slice(0, -1) : args) as string[];
        const options = (isOptions ? args.slice(-1)[ 0 ] : {}) as StatsToStringOptions;

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

        const sort = <T extends SortType>(stats: SortData<T>[], type: T): SortData<T>[] => {
            const sortColl = options.sort?.[ type ];

            if (typeof sortColl === 'function')
                return (sortColl as StatsSorter<T>)(stats);

            if (!sortColl)
                return stats;

            // default sorting is the alphanumeric order of the name field depending of the "type"
            const filedToCompare = type === 'collections' ? 'collectionName' : 'name';

            return stats.sort((s1, s2) => s1[ filedToCompare ].localeCompare(s2[ filedToCompare ]));
        };


        const stats = [
            ...sort(Object.values(datas.detailed), 'collections').map(c => c.stats),
            datas.global
        ].flatMap(s => Object.values(s));

        return sort(stats, 'stats').reduce((s, data) => `${s}\n${toString(data)}`, `${title}\n`);
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
