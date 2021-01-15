import { red, yellow, green } from '../template-style';
import { Stat } from './stat';


export interface StatFail {
    file: string;
    reason: string;
}


export class StatFiles implements Stat {
    all: string[] = [];
    processed: string[] = [];
    fails: StatFail[] = [];
    successes: string[] = [];

    constructor(public name: string) { }

    addBeforeCache(...files: string[]) {
        this.all.push(...files);
    }

    addToBeProcessed(...files: string[]) {
        this.processed.push(...files);
    }

    succeed(...files: string[]) {
        this.successes.push(...files);
    }

    fail(...why: StatFail[]) {
        this.fails.push(...why);
    }

    nbOutOf(nb: number) {
        return nb === 0 ? '' : `${nb} / ${this.all.length}`;
    }

    datas(collectionName: string) {
        return {
            global: {
                data: [
                    collectionName,
                    this.all.length,
                    yellow`${this.nbOutOf(this.all.length - this.processed.length)}`,
                    green`${this.nbOutOf(this.successes.length)}`,
                    red`${this.nbOutOf(this.fails.length)}`
                ],
                header: [ 'name', 'total', 'cache hits', 'successes', 'fails' ]
            },
            success: {
                data: this.successes.map((file, i) => [ i === 0 ? collectionName : '', file ]),
                header: [ green`success` + ' (name)', green`file` ]
            },
            fails: {
                data: this.fails.map((fail, i) => [ i === 0 ? collectionName : '', fail.file, fail.reason ]),
                header: [ 'name', red`fails`, 'reason' ]
            }
        };
    }
}
