/* eslint-disable no-dupe-class-members */
import { EventEmitter } from 'events';
import { Command, CommanderError, OptionValueSource } from 'commander';
import { FunctionN, TT, TT$ } from '@upradata/util';
import { CliOption, CliOptionInit } from './cli.option';
import { CliHelper, CliHelperOpts } from './helper';
import { camelcase } from './util';
import { CommanderParser } from './parsers';


export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
export { Argument as CliArgument } from 'commander';


declare module 'commander' {
    interface Command extends EventEmitter {
        _allowUnknownOption: boolean;
        _allowExcessArguments: boolean;
        /** @type {Argument[]} */
        _args: Argument[];
        _scriptPath: string;
        _name: string;
        _optionValues: Record<string, any>;
        _optionValueSources: Record<string, OptionValueSource>; // default < config < env < cli
        _storeOptionsAsProperties: boolean;
        _actionHandler: (processedArgs: any[]) => any;
        _executableHandler: boolean;
        _executableFile: string; // custom name for executable
        _defaultCommandName: string;
        _exitCallback: (error: CommanderError) => void;
        _aliases: string[];
        _combineFlagAndOptionalValue: boolean;
        _description: string;
        _argsDescription: any; // legacy
        _enablePositionalOptions: boolean;
        _passThroughOptions: boolean;
        _lifeCycleHooks: Record</* event */ string, Array<(command: Command, thisCommand: Command) => any>>; // a hash of arrays
        _showHelpAfterError: boolean | string;
        _showSuggestionAfterError: boolean;
        _findOption: (name: string) => CliOption;
        _displayError: (exitCode: number, code: string, message: string) => void;

        options: CliOption[];
        createHelp(): CliHelper;
    }
}


export class CliCommand extends Command {
    private _helperOptions: CliHelperOpts;
    private _actionHandlers: FunctionN<any[], TT$<void>>[] = [];
    private optionNames = new Set<string>();

    constructor(name?: string) {
        super(name);
    }


    helperOptions(): CliHelperOpts;
    helperOptions(options: CliHelperOpts): this;
    helperOptions(options?: CliHelperOpts): this | CliHelperOpts {
        if (options) {
            this._helperOptions = options;
            return this;
        }

        return this._helperOptions;
    }

    createCommand(name?: string) {
        return new CliCommand(name);
    }

    createOption(flags: string, description?: string) {
        return new CliOption(flags, description);
    }

    isDefault(isDefaultCommand: boolean): CliCommand {
        this._defaultCommandName = isDefaultCommand ? this._name : null;
        return this;
    }

    option<T>(opt: CliOptionInit<T>): this;
    option(flags: string, description?: string): this;
    option(flags: string, description: string, defaultValue?: TT<string> | boolean): this;
    option<T>(flags: string, description: string, parser: CommanderParser<T>): this;
    option<T>(flags: string, description: string, parser: CommanderParser<T>, defaultValue?: TT<T>): this;
    /** @deprecated since v7, instead use choices or a custom function */
    option(flags: string, description: string, regexp: RegExp, defaultValue?: string | boolean): this;
    option(...args: any[]) {

        const createCliOption = () => {
            if (typeof args[ 0 ] === 'string') {
                const options: CliOptionInit<any> = {
                    flags: args[ 0 ],
                    description: args[ 1 ],
                    defaultValue: typeof args[ 2 ] === 'function' ? args[ 3 ] : args[ 2 ],
                    parser: typeof args[ 2 ] === 'function' ? args[ 2 ] : undefined
                };

                return new CliOption(options);
            }

            const { aliases = [], ...rest } = args[ 0 ] as CliOptionInit<any>;

            const newOption = new CliOption(rest);
            newOption.addAliases(...aliases);

            return newOption;
        };


        this.addOption(createCliOption());

        return this;
    }

    addOption(option: CliOption) {

        // const optionOldValue = this.getOptionValue(option.attributeName());

        // register the option
        // already included in super.addOption (./command.js#L535)
        // but "option" is pushed after calling this.setOptionValueWithSource
        // In the redefined setOptionValueWithSource, done to handle key object like --opt.entry.a
        // I retrieve the option with this.options and the name passed as a parameter
        // So I need to add it before this.setOptionValueWithSource is called (it is done just if there is option.defaultValue during addOption)
        // BUT NO WORRY, I redefined this.options.push to push options if they do not exist already with a Set in the constructor
        this.options.push(option);
        this.optionNames.add(option.name());

        // super.addOption(option);
        const getDefaultOption = () => {
            const name = option.attributeName();
            let { defaultValue } = option;

            // preassign default value for --no-*, [optional], <required>, or plain flag if boolean value
            if (option.negate || option.optional || option.required || typeof defaultValue === 'boolean') {
                // when --no-foo we make sure default is true, unless a --foo option is already defined
                if (option.negate && !option.negateNoDefault) {
                    const positiveLongFlag = option.long.replace(/^--no-/, '--');
                    defaultValue = this._findOption(positiveLongFlag) ? this.getOptionValue(name) : true;
                }

                // preassign only if we have a default
                if (defaultValue !== undefined) {
                    this.setOptionValueWithSource(name, defaultValue, 'default');
                }
            }

            return defaultValue;
        };

        const defaultValue = getDefaultOption();

        // handler for cli and env supplied values
        const handleOptionValue = (o: CliOption, cliRawValue: string, invalidValueMessage: string, valueSource: OptionValueSource) => {
            const name = o.attributeName();

            // Note: using closure to access lots of lexical scoped variables.
            const oldValue = this.getOptionValue(name);

            const parseOption = () => {
                // custom processing
                if (cliRawValue !== null && o.parser) {
                    try {
                        return o.parser(cliRawValue, oldValue === undefined ? defaultValue : oldValue, option);
                    } catch (err) {
                        const e = err as CommanderError;

                        if (e.code === 'commander.invalidArgument') {
                            const message = `${invalidValueMessage} ${e.message}`;
                            this._displayError(e.exitCode, e.code, message);
                        }

                        throw e;
                    }
                }

                if (cliRawValue !== null && o.variadic)
                    return o._concatValue(cliRawValue, oldValue);

                return cliRawValue;
            };

            const value = parseOption();

            // unassigned or boolean value
            if (typeof oldValue === 'boolean' || typeof oldValue === 'undefined') {
                // if no value, negate false, and we have a default, then use it!
                if (value == null) {
                    this.setOptionValueWithSource(name, o.negate ? false : defaultValue || true, valueSource);
                } else {
                    this.setOptionValueWithSource(name, value, valueSource);
                }
            } else if (value !== null) {
                // reassign
                this.setOptionValueWithSource(name, o.negate ? false : value, valueSource);
            }
        };

        const { aliases } = option;

        const onNewValue = (source: OptionValueSource, invalidValueMessage: (value: string) => string) => {

            return function (value: string) {
                handleOptionValue(option, value, invalidValueMessage(value), source);

                for (const a of [ ...aliases ].filter(a => a.type === 'target'))
                    handleOptionValue(a.option, a.transform(value), invalidValueMessage(value), source);
            };
        };


        this.on(`option:${option.name()}`, onNewValue('cli', v => `error: option '${option.flags}' argument '${v}' is invalid.`));

        if (option.envVar)
            this.on(`option:${option.name()}`, onNewValue('env', v => `error: option '${option.flags}' value '${v}' from env '${option.envVar}' is invalid.`));


        for (const alias of aliases) {
            if (!this.optionNames.has(alias.option.name()))
                this.addOption(alias.option);
        }

        return this;
    }


    // Store option value and where the value came from.
    setOptionValueWithSource(key: string, value: unknown, source: OptionValueSource) {
        // key is the option attributeName => --option-name => optionName
        // name of --option-name is option-name

        const option = this.options.find(o => o.attributeName() === key);

        if (option?.isObject) {
            const parts = option.name().split('.');
            const [ objectname, ...keys ] = parts;

            const objectName = camelcase(objectname);
            const obj: {} = this.getOptionValue(objectName) || {};

            keys.reduce((o, key, i) => {
                const v = i === keys.length - 1 ? value : o[ key ] || {};
                o[ camelcase(key) ] = v;

                return v;
            }, obj);


            this.setOptionValue(objectName, obj);
            this._optionValueSources[ objectName ] = source;
        }


        this.setOptionValue(key, value);

        if (option)
            option.isValueFromDefault = source === 'default';

        return this;
    }


    action(fn: FunctionN<any[], TT$<void>>): this {
        this._actionHandlers.push(fn);

        if (!this._actionHandler) {
            super.action((...args: any[]) => {
                const results = this._actionHandlers.map(handler => handler.apply(this, args));
                const hasSomePromise = results.some(r => r instanceof Promise);

                if (hasSomePromise)
                    return Promise.all(results).then(() => { });
            });
        }

        return this;
    }


    createHelp() {
        return Object.assign(new CliHelper(this.helperOptions()), this.configureHelp());
    }
}
