import { TableRows, TableRow } from '../terminal';
import { ObjectOf } from '@upradata/util';

export interface StatData {
    header: string[];
    data: TableRow | TableRows;
}

export interface Stat {
    name: string;
    datas(collectionName: string): ObjectOf<StatData>;
    /* successes: string[];
    fails: StatFail[];
    processed: string[]; // not cached for instance
    all: string[]; // all (before cache for instance) */
}

export interface StatCtor<S extends Stat> {
    new(name: string): S;
}
