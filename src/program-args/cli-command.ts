import { Command, CommanderError, Option, OptionValueSource } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import { EventEmitter } from 'events';
import { CliOption, CliOptionInit } from './cli-option';
import { CliHelper, CliHelperOpts } from './helper';


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
    public _helperOptions: CliHelperOpts;

    constructor(name?: string) {
        super(name);

        /* const optionsPush = bind(this.options.push, this.options);
        const optionsSet = new Set<CliOption>();

        this.options.push = (...options: CliOption[]) => {
            const opts = options.filter(o => !optionsSet.has(o));
            opts.forEach(o => optionsSet.add(o));

            return optionsPush(...opts);
        }; */
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
    option(flags: string, description?: string, defaultValue?: string | boolean): this;
    option<T>(flags: string, description: string, fn: (value: string, previous: T) => T, defaultValue?: T): this;
    /** @deprecated since v7, instead use choices or a custom function */
    option(flags: string, description: string, regexp: RegExp, defaultValue?: string | boolean): this;
    option(...args: any[]) {
        if (typeof args[ 0 ] === 'string')
            return super.option.apply(this, args);

        const { flags, description, parser, choices, aliases = [], ...rest } = args[ 0 ] as CliOptionInit<any>;

        const newOption = new CliOption(flags, description);

        newOption.addAliases(...aliases);
        Object.assign(newOption, rest, { parseArg: parser, argChoices: choices } as Partial<Option>);

        this.addOption(newOption);

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

        // super.addOption(option);
        const getDefaultOption = () => {
            const name = option.attributeName();
            let defaultValue = option.defaultValue;

            // preassign default value for --no-*, [optional], <required>, or plain flag if boolean value
            if (option.negate || option.optional || option.required || typeof defaultValue === 'boolean') {
                // when --no-foo we make sure default is true, unless a --foo option is already defined
                if (option.negate) {
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
        const handleOptionValue = (option: CliOption, cliRawValue: string, invalidValueMessage: string, valueSource: OptionValueSource) => {
            const name = option.attributeName();

            // Note: using closure to access lots of lexical scoped variables.
            const oldValue = this.getOptionValue(name);

            const parseArg = () => {
                // custom processing
                if (cliRawValue !== null && option.parseArg) {
                    try {
                        return option.parseArg(cliRawValue, oldValue === undefined ? defaultValue : oldValue);
                    } catch (err) {
                        const e = err as CommanderError;

                        if (e.code === 'commander.invalidArgument') {
                            const message = `${invalidValueMessage} ${e.message}`;
                            this._displayError(e.exitCode, e.code, message);
                        }

                        throw e;
                    }
                }

                if (cliRawValue !== null && option.variadic)
                    return option._concatValue(cliRawValue, oldValue);

                return cliRawValue;
            };

            const value = parseArg();

            // unassigned or boolean value
            if (typeof oldValue === 'boolean' || typeof oldValue === 'undefined') {
                // if no value, negate false, and we have a default, then use it!
                if (value == null) {
                    this.setOptionValueWithSource(name, option.negate ? false : defaultValue || true, valueSource);
                } else {
                    this.setOptionValueWithSource(name, value, valueSource);
                }
            } else if (value !== null) {
                // reassign
                this.setOptionValueWithSource(name, option.negate ? false : value, valueSource);
            }
        };

        const { aliases } = option;
        const options = [ option, ...aliases ];

        const handles = {
            option: new Set<string>(),
            optionEnv: new Set<string>()
        };

        const addListeners = (options: CliOption[]) => {
            for (const o of options) {

                const onNewValue = (source: OptionValueSource, invalidValueMessage: (value: string) => string) => (value: string) => {
                    if (handles.option.size === options.length)
                        handles.option = new Set();

                    if (handles.option.has(o.name()))
                        return;

                    handles.option.add(o.name());

                    handleOptionValue(o, value, invalidValueMessage(value), source);
                };


                this.on('option:' + o.name(), onNewValue('cli', v => `error: option '${o.flags}' argument '${v}' is invalid.`));

                if (option.envVar)
                    this.on('option:' + o.name(), onNewValue('env', v => `error: option '${o.flags}' value '${v}' from env '${o.envVar}' is invalid.`));
            }
        };

        addListeners(aliases.size === 0 ? [ option ] : options);

        for (const alias of aliases) {
            const aliasOption = new CliOption(alias.flags, option.description);
            aliasOption.parseArg = aliasOption.parseArg || option.parseArg;

            // super.addOption(aliasOption);
            this.addOption(aliasOption);
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
            const [ objectName, ...keys ] = parts;

            const oldObject: {} = this.getOptionValue(objectName) || {};

            const newObject = keys.reduce((o, key, i) => ({
                ...o,
                [ key ]: i === keys.length - 1 ? value : o[ key ] || {}
            }), oldObject);


            this.setOptionValue(objectName, newObject);
            this._optionValueSources[ objectName ] = source;
        }


        this.setOptionValue(key, value);

        if (option)
            option.isValueFromDefault = source === 'default';

        return this;
    }

    createHelp() {
        return Object.assign(new CliHelper(this.helperOptions()), this.configureHelp());
    };
}
