import { ObjectOf, KebabCase } from '@upradata/util';
import { Stat } from './stat';
import { TableRows, TableRow } from '../terminal';

export type Statistics<S extends Stat> = ObjectOf<S | Statistics<S>>;


//////////////////////////////////////////


export type StatTable = { headers: string[]; rows: TableRows; };
export type StatTableWithName = StatTable & { name: string; collectionName: string; };

export type OutputStat = Record<string /* stat name */, StatTableWithName>;
export type StatCollection = { collectionName: string; stats: OutputStat; };

export type OutputStats = {
    global: OutputStat;
    collections: Record<string /* collection name */, StatCollection>;
};


///////////////////////////////////////////



export type SortType = 'stats' | 'collections' | 'global-rows';
export type SortData<T extends SortType> = T extends 'stats' ? StatTableWithName : T extends 'collections' ? StatCollection : TableRow;

export type StatSorter<T extends SortType> = (datas: SortData<T>[]) => SortData<T>[];

type Comparator = (s1: string, s2: string) => number;

const sort = (comparator: Comparator) => <T extends SortType>(type: T) => (datas: SortData<T>[]): SortData<T>[] => {
    // default sorting is the alphanumeric order of the name field depending of the "type"
    const filedToCompare = type === 'collections' ? 'collectionName' : type === 'stats' ? 'name' : '0';

    return datas.sort((s1, s2) => comparator((s1[ filedToCompare ] as string), s2[ filedToCompare ]));
};


export type StatSorters<T> = {
    alphaNumeric: T;
    antiAlphaNumeric: T;
};


const sortComparators: StatSorters<Comparator> = {
    alphaNumeric: (s1: string, s2: string) => s1.localeCompare(s2),
    antiAlphaNumeric: (s1: string, s2: string) => s1.localeCompare(s2)
};


export const statSorters: StatSorters<<T extends SortType>(type: T) => StatSorter<T>>= {
    alphaNumeric: sort(sortComparators.alphaNumeric),
    antiAlphaNumeric: sort(sortComparators.antiAlphaNumeric)
};


export type StatSorterTypes = KebabCase<keyof StatSorters<any>>;




//////////////////////////////////////////


export interface StatsToStringOptions {
    rowWidth?: number;
    sort?: {
        stats?: StatSorterTypes | StatSorter<'stats'>;
        collections?: StatSorterTypes | StatSorter<'collections'>;
        globalRows?: StatSorterTypes | StatSorter<'global-rows'>;
    };
}
