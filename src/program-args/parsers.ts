import { InvalidArgumentError } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import { composeLeft, isBoolean, isUndefined, ObjectOf, setRecursive, TT as UtilTT } from '@upradata/util';
import { requireModule, RequireOptions } from '../require';
import { CliOption } from './cli-option';


export type CliParserPrevious<T> = UtilTT<T, 'mutable'>;

// export type CommanderValueParser = <T>(value: string, previous?: TT<T>, aliasOriginOption?: CliOption) => T;
export type CommanderValueParser<T> = (value: string, previous?: CliParserPrevious<T>, aliasOriginOption?: CliOption) => T;
// export type CommanderParser = <T>(value: string, previous?: TT<T>, aliasOriginOption?: CliOption) => TT<T>;
export type CommanderParser<T, R = CliParserPrevious<T>> = (value: string, previous?: CliParserPrevious<T>, aliasOriginOption?: CliOption) => R;
export type CommanderReducer<T> = (value: string, previous?: T, aliasOriginOption?: CliOption) => T;


const concat = <T>(value: T, previous: T[]) => [ ...previous, value ];

export const concatIfVariadic = <T>(isVariadic: boolean, value: T, previous?: CliParserPrevious<T>): CliParserPrevious<T> => {
    const array = isUndefined(previous) ? [] : Array.isArray(previous) ? previous : [ previous ];
    return isVariadic ? concat(value, array) : value;
};



const parseNumber = (type: 'int' | 'float'): CommanderParser<number> => function (this: CliOption, value, previous) {
    // parseInt takes a string and a radix
    const parsedValue = type === 'int' ? parseInt(value, 10) : parseFloat(value);

    if (isNaN(parsedValue))
        throw new InvalidArgumentError(`Not a ${type === 'int' ? 'number' : 'float'}.`);

    return concatIfVariadic(this?.variadic, parsedValue, previous);
};



const reduce = <V, R = V>(
    init: R, reducer: (container: R, value: V) => R, parser?: CommanderValueParser<V>
): CommanderReducer<R> => function (this: CliOption, value, previous, aliasOriginOption) {

    // if this.isValueFromDefault ==> option value was initially set with the option.defaultValue at creation
    const container = this.isValueFromDefault ? previous : init;

    return reducer(container, (parser?.call(this, value, undefined, aliasOriginOption) ?? value) as V);
};


const increaseNumber = (init: number): CommanderParser<number> => reduce(init, (sum, _v) => sum + 1);
const decreaseNumber = (init: number): CommanderParser<number> => reduce(init, (sum, _v) => sum - 1);


export const parsers = {
    int: parseNumber('int'),
    float: parseNumber('float'),

    string: function (this: CliOption, value, previous) {
        return concatIfVariadic(this?.variadic, value, previous);
    } as CommanderParser<string>,

    boolean: function (this: CliOption, value: string, previous: CliParserPrevious<boolean>) {
        // when it is a boolean type option, like command --enable, there is no value

        const v = isUndefined(value) ?
            this.negate ? false : this.defaultValue || true :
            value;

        const ret = (v: boolean) => concatIfVariadic(this?.variadic, v, previous);

        if (isBoolean(v))
            return ret(v);

        if (v === 'true')
            return ret(true);

        if (v === 'false')
            return ret(false);

        throw new InvalidArgumentError(`Not a boolean`);
    } as CommanderParser<boolean>,

    reduce,
    increaseNumber,
    decreaseNumber,

    array: <V = string>(parser?: CommanderValueParser<V>): CommanderParser<V[], V[]> => reduce([] as V[], (container, value) => container.concat(value), parser),

    stringToArray: (separator: string | RegExp = ',') => (value: string) => value.split(separator),

    object: (key?: string) => function (this: CliOption, value, previous) {
        let v: any = undefined;

        try {
            v = JSON.parse(value);
        } catch (e) {
            v = value;
        }


        if (key)
            v = setRecursive({}, key, v);

        return concatIfVariadic(this?.variadic, v, previous);

    } as CommanderParser<ObjectOf<any>>,

    choices: <T = string>(choices: T[], parser?: CommanderValueParser<T>): CommanderParser<T> => function (this: CliOption, value, previous) {
        const parsedValue = parser?.(value, previous) ?? value as unknown as T;

        if (!choices.includes(parsedValue))
            throw new InvalidArgumentError(`Allowed choices are ${choices.join(', ')}.`);

        return concatIfVariadic(this?.variadic, parsedValue, previous);
    },

    require: (options: Partial<RequireOptions<any>>): CommanderParser<any> => function (this: CliOption, value, previous) {
        return concatIfVariadic(this?.variadic, requireModule(value, options), previous);
    },

    compose: <P extends CommanderValueParser<any>[]>(...parsers: P): CommanderParser<any> => function (this: CliOption, value, previous, aliasOriginOption) {
        const parsedValue = composeLeft(parsers.map(p => (v: string) => p.call(this, v, previous, aliasOriginOption)), value);
        return concatIfVariadic(this?.variadic, parsedValue, previous);
    }
};
