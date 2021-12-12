import { InvalidArgumentError, Option } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import { compose, isBoolean, isDefined } from '@upradata/util';
import { requireModule, RequireOptions } from '../require';
import { CliOption } from './cli-option';


export type CommanderParser<T> = (value: string, previous?: T) => T;


const parseNumber = (type: 'int' | 'float') => (value: string) => {
    // parseInt takes a string and a radix
    const parsedValue = type === 'int' ? parseInt(value, 10) : parseFloat(value);

    if (isNaN(parsedValue))
        throw new InvalidArgumentError(`Not a ${type === 'int' ? 'number' : 'float'}.`);

    return parsedValue;
};



const reduce = <V, R = V>(init: R, reducer: (container: R, value: V) => R, parser?: CommanderParser<V>) => function (this: CliOption, value: string, previous: R) {
    // if this.isValueFromDefault ==> option value was initially set with the option.defaultValue at creation
    const container = this.isValueFromDefault ? init : previous;

    return reducer(container, (parser?.(value) ?? value) as V);
};


const increaseNumber = (init: number) => reduce(init, (sum, _v) => sum + 1);
const decreaseNumber = (init: number) => reduce(init, (sum, _v) => sum - 1);

const concat = <T>(value: T, previous: T[] = []) => [ ...previous, value ];

const concatIfVariadic = function (isVariadic: boolean, value: any, previous: any[]) {
    return isVariadic ? concat(value, previous || []) : value;
};


export const parsers = {
    int: parseNumber('int'),
    float: parseNumber('float'),

    boolean: function (this: CliOption, value: any): boolean {
        const v = value === undefined ?
            this.negate ? false : this.defaultValue || true :
            value;

        let bool = false;

        // should never happen actually as Commander.Command is coded
        // when it is a boolean type option, like command --enable, there is no value
        if (isBoolean(v))
            bool = value;

        if (v === 'true')
            bool = true;

        if (v === 'false')
            bool = false;

        throw new InvalidArgumentError(`Not a boolean`);
    },

    reduce,
    increaseNumber,
    decreaseNumber,

    array: <V = string>(parser?: CommanderParser<V>) => reduce([] as V[], (container, value) => container.concat(value), parser),

    stringToArray: (separator: string | RegExp = ',') => (value: string) => value.split(separator),

    object: function (this: CliOption, value: string, previous: any) {
        return concatIfVariadic(this.variadic, JSON.parse(value), previous);
    },

    choices: <T = string>(choices: T[], parser?: CommanderParser<T>) => function (this: CliOption, value: string, previous: any) {
        const parsedValue = parser?.(value, previous) ?? value as unknown as T;

        if (!choices.includes(parsedValue))
            throw new InvalidArgumentError(`Allowed choices are ${choices.join(', ')}.`);

        return concatIfVariadic(this.variadic, parsedValue, previous);
    },

    require: (options: Partial<RequireOptions<any>>) => function (this: CliOption, value: string, previous: any) {
        return concatIfVariadic(this.variadic, requireModule(value, options), previous);
    },

    compose: (...parsers: CommanderParser<any>[]) => function (this: CliOption, value: string, previous: any) {
        const parsedValue = compose(parsers.map(p => (v: string) => p.call(this, v, previous)), value);
        return concatIfVariadic(this.variadic, parsedValue, previous);
    }
};
