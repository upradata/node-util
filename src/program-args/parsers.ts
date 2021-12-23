import { InvalidArgumentError } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import { compose, isBoolean, isUndefined, ObjectOf, TT as UtilTT } from '@upradata/util';
import { requireModule, RequireOptions } from '../require';
import { CliOption } from './cli-option';

type TT<T> = UtilTT<T, 'mutable'>;

export type CommanderValueParser<T> = (value: string, previous?: TT<T>) => T;
export type CommanderParser<T> = (value: string, previous?: TT<T>) => TT<T>;


const concat = <T>(value: T, previous: T[]) => [ ...previous, value ];

const concatIfVariadic = <T>(isVariadic: boolean, value: T, previous?: TT<T>): TT<T> => {
    const array = isUndefined(previous) ? [] : Array.isArray(previous) ? previous : [ previous ];
    return isVariadic ? concat(value, array) : value;
};



const parseNumber = (type: 'int' | 'float') => function (this: CliOption, value: string, previous: TT<number>) {
    // parseInt takes a string and a radix
    const parsedValue = type === 'int' ? parseInt(value, 10) : parseFloat(value);

    if (isNaN(parsedValue))
        throw new InvalidArgumentError(`Not a ${type === 'int' ? 'number' : 'float'}.`);

    return concatIfVariadic(this.variadic, parsedValue, previous);
};



const reduce = <V, R = V>(init: R, reducer: (container: R, value: V) => R, parser?: CommanderValueParser<V>) => function (this: CliOption, value: string, previous: R) {
    // if this.isValueFromDefault ==> option value was initially set with the option.defaultValue at creation
    const container = this.isValueFromDefault ? previous : init;

    return reducer(container, (parser?.call(this, value) ?? value) as V);
};


const increaseNumber = (init: number) => reduce(init, (sum, _v) => sum + 1);
const decreaseNumber = (init: number) => reduce(init, (sum, _v) => sum - 1);


export const parsers = {
    int: parseNumber('int'),
    float: parseNumber('float'),

    string: function (this: CliOption, value: string, previous: TT<string>): TT<string> {
        return concatIfVariadic(this.variadic, value, previous);
    },

    boolean: function (this: CliOption, value: string, previous: TT<boolean>): TT<boolean> {
        // when it is a boolean type option, like command --enable, there is no value

        const v = isUndefined(value) ?
            this.negate ? false : this.defaultValue || true :
            value;

        const ret = (v: boolean) => concatIfVariadic(this.variadic, v, previous);

        if (isBoolean(v))
            return ret(v);

        if (v === 'true')
            return ret(true);

        if (v === 'false')
            return ret(false);

        throw new InvalidArgumentError(`Not a boolean`);
    },

    reduce,
    increaseNumber,
    decreaseNumber,

    array: <V = string>(parser?: CommanderValueParser<V>) => reduce([] as V[], (container, value) => container.concat(value), parser),

    stringToArray: (separator: string | RegExp = ',') => (value: string) => value.split(separator),

    object: function (this: CliOption, value: string, previous: TT<ObjectOf<any>>): TT<ObjectOf<any>> {
        return concatIfVariadic(this.variadic, JSON.parse(value), previous);
    },

    choices: <T = string>(choices: T[], parser?: CommanderValueParser<T>) => function (this: CliOption, value: string, previous: TT<T>): TT<T> {
        const parsedValue = parser?.(value, previous) ?? value as unknown as T;

        if (!choices.includes(parsedValue))
            throw new InvalidArgumentError(`Allowed choices are ${choices.join(', ')}.`);

        return concatIfVariadic(this.variadic, parsedValue, previous);
    },

    require: (options: Partial<RequireOptions<any>>) => function (this: CliOption, value: string, previous: any) {
        return concatIfVariadic(this.variadic, requireModule(value, options), previous);
    },

    compose: <P extends CommanderValueParser<any>[]>(...parsers: P) => function (this: CliOption, value: string, previous: any) {
        const parsedValue = compose(parsers.map(p => (v: string) => p.call(this, v, previous)), value);
        return concatIfVariadic(this.variadic, parsedValue, previous);
    }
};
