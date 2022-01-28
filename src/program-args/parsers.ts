/* eslint-disable object-shorthand */
import { InvalidArgumentError } from 'commander';
import { composeLeft, isBoolean, isNil, isUndefined, ObjectOf, setRecursive, stringToRegex, TT as UtilTT } from '@upradata/util';
import { requireModule, RequireOptions } from '../require';
import { CliOption, AliasTransform } from './cli-option';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';


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

    if (Number.isNaN(parsedValue))
        throw new InvalidArgumentError(`"${parsedValue}" is not a ${type === 'int' ? 'number' : 'float'}.`);

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

        const v = isNil(value) ?
            this.negate ? false : this.defaultValue || true :
            value;

        const ret = (v: boolean) => concatIfVariadic(this?.variadic, v, previous);

        if (isBoolean(v))
            return ret(v);

        if (v === 'true')
            return ret(true);

        if (v === 'false')
            return ret(false);

        throw new InvalidArgumentError(`"${v}" is not a boolean`);
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

    cumulateObject: function <T>(this: CliOption, value: string, previous: CliParserPrevious<T>) {
        const o = JSON.parse(value);

        const trySetLastValue = () => {
            const lastValue = Array.isArray(previous) ? previous?.at(-1) : previous;

            if (!lastValue)
                return o;

            let isSet = false;

            for (const [ key, value ] of Object.entries(o)) {
                if (lastValue && !(key in lastValue)) {
                    lastValue[ key ] = value;
                    isSet = true;
                }
            }

            return isSet ? lastValue : o;
        };

        return concatIfVariadic(this?.variadic, trySetLastValue(), previous);
    },

    choices: <T = string>(choices: T[], parser?: CommanderValueParser<T>): CommanderParser<T> => function (this: CliOption, value, previous) {
        const parsedValue = parser?.(value, previous) ?? value as unknown as T;

        if (!choices.includes(parsedValue))
            throw new InvalidArgumentError(`Allowed choices are ${choices.join(', ')}.`);

        return concatIfVariadic(this?.variadic, parsedValue, previous);
    },

    regex: function (this: CliOption, value: string, previous: CliParserPrevious<RegExp>) {
        const getRegex = () => {
            const res = value.match(/\/(.*)\/(.*)/);

            if (res) {
                const [ _, regexS, flags ] = res;
                return { regexS, flags };
            }

            return { regexS: value, flags: undefined };
        };

        const { regexS, flags } = getRegex();
        const regex = stringToRegex(regexS, flags);

        return concatIfVariadic(this?.variadic, regex, previous);
    } as CommanderParser<RegExp>,

    require: <T = any>(options: RequireOptions): CommanderParser<T> => function (this: CliOption, value, previous) {
        return concatIfVariadic(this?.variadic, requireModule(value, options), previous);
    },

    compose: <T = any, R = T>(...parsers: CommanderValueParser<any>[]): CommanderParser<T, R> => function (this: CliOption, value, previous, aliasOriginOption) {
        const parsedValue = composeLeft(parsers.map(p => (v: string) => p.call(this, v, previous, aliasOriginOption)), value);
        return concatIfVariadic(this?.variadic, parsedValue, previous);
    }
};


type Map<T1, T2> = (value: T1) => T2;
export type AliasTransformer = (...transforms: [ Map<string, any>, ...Map<any, any>[], Map<any, string> ]) => AliasTransform;

export const aliasMap: AliasTransformer = (...transforms) => parsers.compose<never, string>(...transforms);

export const aliasMaps = {
    toObject: (prop: string): AliasTransform => aliasMap(parsers.object(prop), (v: any) => JSON.stringify(v))
};
