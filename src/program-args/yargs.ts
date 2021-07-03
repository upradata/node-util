// Type definitions for yargs 17.0
// Project: https://github.com/chevex/yargs, https://yargs.js.org
// Definitions by: Martin Poelstra <https://github.com/poelstra>
//                 Mizunashi Mana <https://github.com/mizunashi-mana>
//                 Jeffery Grajkowski <https://github.com/pushplay>
//                 Jimi (Dimitris) Charalampidis <https://github.com/JimiC>
//                 Steffen Viken Valvåg <https://github.com/steffenvv>
//                 Emily Marigold Klassen <https://github.com/forivall>
//                 ExE Boss <https://github.com/ExE-Boss>
//                 Aankhen <https://github.com/Aankhen>
//                 Ben Coe <https://github.com/bcoe>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0

// The following TSLint rules have been disabled:
// unified-signatures: Because there is useful information in the argument names of the overloaded signatures

// Convention:
// Use 'union types' when:
//  - parameter types have similar signature type (i.e. 'string | ReadonlyArray<string>')
//  - parameter names have the same semantic meaning (i.e. ['command', 'commands'] , ['key', 'keys'])
//    An example for not using 'union types' is the declaration of 'env' where `prefix` and `enable` parameters
//    have different semantics. On the other hand, in the declaration of 'usage', a `command: string` parameter
//    has the same semantic meaning with declaring an overload method by using `commands: ReadonlyArray<string>`,
//    thus it's preferred to use `command: string | ReadonlyArray<string>`
// Use parameterless declaration instead of declaring all parameters optional,
// when all parameters are optional and more than one

import { Configuration, DetailedArguments } from 'yargs-parser';


export type ParserConfigurationOptions = Configuration & {
    /** Sort commands alphabetically. Default is `false` */
    'sort-commands': boolean;
};

/**
 * The type parameter `T` is the expected shape of the parsed options.
 * `Arguments<T>` is those options plus `_` and `$0`, and an indexer falling
 * back to `unknown` for unknown options.
 *
 * For the return type / `Yargs` property, we create a mapped type over
 * `Arguments<T>` to simplify the inferred type signature in client code.
 */


export interface Yargs<T = {}> {

    /**
     * Set key names as equivalent such that updates to a key will propagate to aliases and vice-versa.
     *
     * Optionally `.alias()` can take an object that maps keys to aliases.
     * Each key of this object should be the canonical version of the option, and each value should be a string or an array of strings.
     */
    // Aliases for previously declared options can inherit the types of those options.
    alias<K1 extends keyof T, K2 extends string>(shortName: K1, longName: K2 | ReadonlyArray<K2>): Yargs<T & { [ key in K2 ]: T[ K1 ] }>;
    alias<K1 extends keyof T, K2 extends string>(shortName: K2, longName: K1 | ReadonlyArray<K1>): Yargs<T & { [ key in K2 ]: T[ K1 ] }>;
    alias(shortName: string | ReadonlyArray<string>, longName: string | ReadonlyArray<string>): Yargs<T>;
    alias(aliases: { [ shortName: string ]: string | ReadonlyArray<string>; }): Yargs<T>;

    /**
     * Get the arguments as a plain old object.
     *
     * Arguments without a corresponding flag show up in the `Yargs._` array.
     *
     * The script name or node command is available at `Yargs.$0` similarly to how `$0` works in bash or perl.
     *
     * If `yargs` is executed in an environment that embeds node and there's no script name (e.g. Electron or nw.js),
     * it will ignore the first parameter since it expects it to be the script name. In order to override
     * this behavior, use `.parse(process.Yargs.slice(1))` instead of .Yargs and the first parameter won't be ignored.
     */
    // Yargs: { [ key in keyof Arguments<T> ]: Arguments<T>[ key ] } | Promise<{ [ key in keyof Arguments<T> ]: Arguments<T>[ key ] }>;

    /**
     * Tell the parser to interpret `key` as an array.
     * If `.array('foo')` is set, `--foo foo bar` will be parsed as `['foo', 'bar']` rather than as `'foo'`.
     * Also, if you use the option multiple times all the values will be flattened in one array so `--foo foo --foo bar` will be parsed as `['foo', 'bar']`
     *
     * When the option is used with a positional, use `--` to tell `yargs` to stop adding values to the array.
     */
    array<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: ToArray<T[ key ]> }>;
    array<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: Array<string | number> | undefined }>;

    /**
     * Interpret `key` as a boolean. If a non-flag option follows `key` in `process.Yargs`, that string won't get set as the value of `key`.
     *
     * `key` will default to `false`, unless a `default(key, undefined)` is explicitly set.
     *
     * If `key` is an array, interpret all the elements as booleans.
     */
    boolean<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: boolean | undefined }>;
    boolean<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: boolean | undefined }>;

    /**
     * Check that certain conditions are met in the provided arguments.
     * @param func Called with two arguments, the parsed `Yargs` hash and an array of options and their aliases.
     * If `func` throws or returns a non-truthy value, show the thrown error, usage information, and exit.
     * @param global Indicates whether `check()` should be enabled both at the top-level and for each sub-command.
     */
    check(func: (Yargs: Arguments<T>, aliases: { [ alias: string ]: string; }) => any, global?: boolean): Yargs<T>;

    /**
     * Limit valid values for key to a predefined set of choices, given as an array or as an individual value.
     * If this method is called multiple times, all enumerated values will be merged together.
     * Choices are generally strings or numbers, and value matching is case-sensitive.
     *
     * Optionally `.choices()` can take an object that maps multiple keys to their choices.
     *
     * Choices can also be specified as choices in the object given to `option()`.
     */
    choices<K extends keyof T, C extends ReadonlyArray<any>>(key: K, values: C): Yargs<Omit<T, K> & { [ key in K ]: C[ number ] | undefined }>;
    choices<K extends string, C extends ReadonlyArray<any>>(key: K, values: C): Yargs<T & { [ key in K ]: C[ number ] | undefined }>;
    choices<C extends { [ key: string ]: ReadonlyArray<any>; }>(choices: C): Yargs<Omit<T, keyof C> & { [ key in keyof C ]: C[ key ][ number ] | undefined }>;

    /**
     * Provide a synchronous function to coerce or transform the value(s) given on the command line for `key`.
     *
     * The coercion function should accept one argument, representing the parsed value from the command line, and should return a new value or throw an error.
     * The returned value will be used as the value for `key` (or one of its aliases) in `Yargs`.
     *
     * If the function throws, the error will be treated as a validation failure, delegating to either a custom `.fail()` handler or printing the error message in the console.
     *
     * Coercion will be applied to a value after all other modifications, such as `.normalize()`.
     *
     * Optionally `.coerce()` can take an object that maps several keys to their respective coercion function.
     *
     * You can also map the same function to several keys at one time. Just pass an array of keys as the first argument to `.coerce()`.
     *
     * If you are using dot-notion or arrays, .e.g., `user.email` and `user.password`, coercion will be applied to the final object that has been parsed
     */
    coerce<K extends keyof T, V>(key: K | ReadonlyArray<K>, func: (arg: any) => V): Yargs<Omit<T, K> & { [ key in K ]: V | undefined }>;
    coerce<K extends string, V>(key: K | ReadonlyArray<K>, func: (arg: any) => V): Yargs<T & { [ key in K ]: V | undefined }>;
    coerce<O extends { [ key: string ]: (arg: any) => any; }>(opts: O): Yargs<Omit<T, keyof O> & { [ key in keyof O ]: ReturnType<O[ key ]> | undefined }>;

    /**
     * Define the commands exposed by your application.
     * @param command Should be a string representing the command or an array of strings representing the command and its aliases.
     * @param description Use to provide a description for each command your application accepts (the values stored in `Yargs._`).
     * Set `description` to false to create a hidden command. Hidden commands don't show up in the help output and aren't available for completion.
     * @param [builder] Object to give hints about the options that your command accepts.
     * Can also be a function. This function is executed with a yargs instance, and can be used to provide advanced command specific help.
     *
     * Note that when `void` is returned, the handler `Yargs` object type will not include command-specific arguments.
     * @param [handler] Function, which will be executed with the parsed `Yargs` object.
     */
    /*  command<V, U>(
         command: string | ReadonlyArray<string>,
         description: string,
         builder?: BuilderCallback<T, U, SelectYargs<Yargs<T>, CustomYargs>>,
         handler?: (args: Arguments<V>, yargs: Yargs<T>) => void,
         middlewares?: MiddlewareFunction[],
         deprecated?: boolean | string,
     ): Yargs<T>;
     command<O extends { [ key: string ]: Options; }>(
         command: string | ReadonlyArray<string>,
         description: string,
         builder?: O,
         handler?: (args: Arguments<InferredOptionTypes<O>>, yargs: Yargs<T>) => void,
         middlewares?: MiddlewareFunction[],
         deprecated?: boolean | string,
     ): Yargs<T>;
     command<V, U>(command: string | ReadonlyArray<string>, description: string, module: CommandModule<T, V, U, SelectYargs<Yargs<T>, CustomYargs>>): Yargs<T>;
     command<V, U>(
         command: string | ReadonlyArray<string>,
         showInHelp: false,
         builder?: BuilderCallback<T, U, SelectYargs<Yargs<T>, CustomYargs>>,
         handler?: (args: Arguments<V>, yargs: Yargs<T>) => void,
         middlewares?: MiddlewareFunction[],
         deprecated?: boolean | string,
     ): Yargs<T>;
     command<O extends { [ key: string ]: Options; }>(
         command: string | ReadonlyArray<string>,
         showInHelp: false,
         builder?: O,
         handler?: (args: Arguments<InferredOptionTypes<O>>, yargs: Yargs<T>) => void,
     ): Yargs<T>;
     command<V, U>(command: string | ReadonlyArray<string>, showInHelp: false, module: CommandModule<T, V, U, SelectYargs<Yargs<T>, CustomYargs>>): Yargs<T>;
     command<V, U>(module: CommandModule<T, V, U, SelectYargs<Yargs<T>, CustomYargs>>): Yargs<T>; */

    // Advanced API
    /** Apply command modules from a directory relative to the module calling this method. */
    commandDir(dir: string, opts?: RequireDirectoryOptions): Yargs<T>;

    /**
     * Enable bash/zsh-completion shortcuts for commands and options.
     *
     * If invoked without parameters, `.completion()` will make completion the command to output the completion script.
     *
     * @param [cmd] When present in `Yargs._`, will result in the `.bashrc` or `.zshrc` completion script being outputted.
     * To enable bash/zsh completions, concat the generated script to your `.bashrc` or `.bash_profile` (or `.zshrc` for zsh).
     * @param [description] Provide a description in your usage instructions for the command that generates the completion scripts.
     * @param [func] Rather than relying on yargs' default completion functionality, which shiver me timbers is pretty awesome, you can provide your own completion method.
     */
    completion(): Yargs<T>;
    completion(cmd: string, func?: AsyncCompletionFunction): Yargs<T>;
    completion(cmd: string, func?: SyncCompletionFunction): Yargs<T>;
    completion(cmd: string, func?: PromiseCompletionFunction): Yargs<T>;
    completion(cmd: string, description?: string | false, func?: AsyncCompletionFunction): Yargs<T>;
    completion(cmd: string, description?: string | false, func?: SyncCompletionFunction): Yargs<T>;
    completion(cmd: string, description?: string | false, func?: PromiseCompletionFunction): Yargs<T>;

    /**
     * Tells the parser that if the option specified by `key` is passed in, it should be interpreted as a path to a JSON config file.
     * The file is loaded and parsed, and its properties are set as arguments.
     * Because the file is loaded using Node's require(), the filename MUST end in `.json` to be interpreted correctly.
     *
     * If invoked without parameters, `.config()` will make --config the option to pass the JSON config file.
     *
     * @param [description] Provided to customize the config (`key`) option in the usage string.
     * @param [explicitConfigurationObject] An explicit configuration `object`
     */
    config(): Yargs<T>;
    config(key: string | ReadonlyArray<string>, description?: string, parseFn?: (configPath: string) => object): Yargs<T>;
    config(key: string | ReadonlyArray<string>, parseFn: (configPath: string) => object): Yargs<T>;
    config(explicitConfigurationObject: object): Yargs<T>;

    /**
     * Given the key `x` is set, the key `y` must not be set. `y` can either be a single string or an array of argument names that `x` conflicts with.
     *
     * Optionally `.conflicts()` can accept an object specifying multiple conflicting keys.
     */
    conflicts(key: string, value: string | ReadonlyArray<string>): Yargs<T>;
    conflicts(conflicts: { [ key: string ]: string | ReadonlyArray<string>; }): Yargs<T>;

    /**
     * Interpret `key` as a boolean flag, but set its parsed value to the number of flag occurrences rather than `true` or `false`. Default value is thus `0`.
     */
    count<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: number }>;
    count<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: number }>;

    /**
     * Set `Yargs[key]` to `value` if no option was specified in `process.Yargs`.
     *
     * Optionally `.default()` can take an object that maps keys to default values.
     *
     * The default value can be a `function` which returns a value. The name of the function will be used in the usage string.
     *
     * Optionally, `description` can also be provided and will take precedence over displaying the value in the usage instructions.
     */
    default<K extends keyof T, V>(key: K, value: V, description?: string): Yargs<Omit<T, K> & { [ key in K ]: V }>;
    default<K extends string, V>(key: K, value: V, description?: string): Yargs<T & { [ key in K ]: V }>;
    default<D extends { [ key: string ]: any; }>(defaults: D, description?: string): Yargs<Omit<T, keyof D> & D>;

    /**
     * @deprecated since version 6.6.0
     * Use '.demandCommand()' or '.demandOption()' instead
     */
    demand<K extends keyof T>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<Defined<T, K>>;
    demand<K extends string>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<T & { [ key in K ]: unknown }>;
    demand(key: string | ReadonlyArray<string>, required?: boolean): Yargs<T>;
    demand(positionals: number, msg: string): Yargs<T>;
    demand(positionals: number, required?: boolean): Yargs<T>;
    demand(positionals: number, max: number, msg?: string): Yargs<T>;

    /**
     * @param key If is a string, show the usage information and exit if key wasn't specified in `process.Yargs`.
     * If is an array, demand each element.
     * @param msg If string is given, it will be printed when the argument is missing, instead of the standard error message.
     * @param demand Controls whether the option is demanded; this is useful when using .options() to specify command line parameters.
     */
    demandOption<K extends keyof T>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<Defined<T, K>>;
    demandOption<K extends string>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<T & { [ key in K ]: unknown }>;
    demandOption(key: string | ReadonlyArray<string>, demand?: boolean): Yargs<T>;

    /**
     * Demand in context of commands.
     * You can demand a minimum and a maximum number a user can have within your program, as well as provide corresponding error messages if either of the demands is not met.
     */
    demandCommand(): Yargs<T>;
    demandCommand(min: number, minMsg?: string): Yargs<T>;
    demandCommand(min: number, max?: number, minMsg?: string, maxMsg?: string): Yargs<T>;

    /**
     * Shows a [deprecated] notice in front of the option
     */
    deprecateOption(option: string, msg?: string): Yargs<T>;

    /**
     * Describe a `key` for the generated usage information.
     *
     * Optionally `.describe()` can take an object that maps keys to descriptions.
     */
    describe(key: string | ReadonlyArray<string>, description: string): Yargs<T>;
    describe(descriptions: { [ key: string ]: string; }): Yargs<T>;

    /** Should yargs attempt to detect the os' locale? Defaults to `true`. */
    detectLocale(detect: boolean): Yargs<T>;

    /**
     * Tell yargs to parse environment variables matching the given prefix and apply them to Yargs as though they were command line arguments.
     *
     * Use the "__" separator in the environment variable to indicate nested options. (e.g. prefix_nested__foo => nested.foo)
     *
     * If this method is called with no argument or with an empty string or with true, then all env vars will be applied to Yargs.
     *
     * Program arguments are defined in this order of precedence:
     * 1. Command line args
     * 2. Env vars
     * 3. Config file/objects
     * 4. Configured defaults
     *
     * Env var parsing is disabled by default, but you can also explicitly disable it by calling `.env(false)`, e.g. if you need to undo previous configuration.
     */
    env(): Yargs<T>;
    env(prefix: string): Yargs<T>;
    env(enable: boolean): Yargs<T>;

    /** A message to print at the end of the usage instructions */
    epilog(msg: string): Yargs<T>;
    /** A message to print at the end of the usage instructions */
    epilogue(msg: string): Yargs<T>;

    /**
     * Give some example invocations of your program.
     * Inside `cmd`, the string `$0` will get interpolated to the current script name or node command for the present script similar to how `$0` works in bash or perl.
     * Examples will be printed out as part of the help message.
     */
    example(command: string, description: string): Yargs<T>;
    example(command: ReadonlyArray<[ string, string?]>): Yargs<T>;

    /** Manually indicate that the program should exit, and provide context about why we wanted to exit. Follows the behavior set by `.exitProcess().` */
    exit(code: number, err: Error): void;

    /**
     * By default, yargs exits the process when the user passes a help flag, the user uses the `.version` functionality, validation fails, or the command handler fails.
     * Calling `.exitProcess(false)` disables this behavior, enabling further actions after yargs have been validated.
     */
    exitProcess(enabled: boolean): Yargs<T>;

    /**
     * Method to execute when a failure occurs, rather than printing the failure message.
     * @param func Is called with the failure message that would have been printed, the Error instance originally thrown and yargs state when the failure occurred.
     */
    fail(func: ((msg: string, err: Error, yargs: Yargs<T>) => any) | boolean): Yargs<T>;

    /**
     * Allows to programmatically get completion choices for any line.
     * @param args An array of the words in the command line to complete.
     * @param done The callback to be called with the resulting completions.
     */
    getCompletion(args: ReadonlyArray<string>, done: (completions: ReadonlyArray<string>) => void): Yargs<T>;

    /**
     * Indicate that an option (or group of options) should not be reset when a command is executed
     *
     * Options default to being global.
     */
    global(key: string | ReadonlyArray<string>): Yargs<T>;

    /** Given a key, or an array of keys, places options under an alternative heading when displaying usage instructions */
    group(key: string | ReadonlyArray<string>, groupName: string): Yargs<T>;

    /** Hides a key from the generated usage information. Unless a `--show-hidden` option is also passed with `--help` (see `showHidden()`). */
    hide(key: string): Yargs<T>;

    /**
     * Configure an (e.g. `--help`) and implicit command that displays the usage string and exits the process.
     * By default yargs enables help on the `--help` option.
     *
     * Note that any multi-char aliases (e.g. `help`) used for the help option will also be used for the implicit command.
     * If there are no multi-char aliases (e.g. `h`), then all single-char aliases will be used for the command.
     *
     * If invoked without parameters, `.help()` will use `--help` as the option and help as the implicit command to trigger help output.
     *
     * @param [description] Customizes the description of the help option in the usage string.
     * @param [enableExplicit] If `false` is provided, it will disable --help.
     */
    help(): Yargs<T>;
    help(enableExplicit: boolean): Yargs<T>;
    help(option: string, enableExplicit: boolean): Yargs<T>;
    help(option: string, description?: string, enableExplicit?: boolean): Yargs<T>;

    /**
     * Given the key `x` is set, it is required that the key `y` is set.
     * y` can either be the name of an argument to imply, a number indicating the position of an argument or an array of multiple implications to associate with `x`.
     *
     * Optionally `.implies()` can accept an object specifying multiple implications.
     */
    implies(key: string, value: string | ReadonlyArray<string>): Yargs<T>;
    implies(implies: { [ key: string ]: string | ReadonlyArray<string>; }): Yargs<T>;

    /**
     * Return the locale that yargs is currently using.
     *
     * By default, yargs will auto-detect the operating system's locale so that yargs-generated help content will display in the user's language.
     */
    locale(): string;
    /**
     * Override the auto-detected locale from the user's operating system with a static locale.
     * Note that the OS locale can be modified by setting/exporting the `LC_ALL` environment variable.
     */
    locale(loc: string): Yargs<T>;

    /**
     * Define global middleware functions to be called first, in list order, for all cli command.
     * @param callbacks Can be a function or a list of functions. Each callback gets passed a reference to Yargs.
     * @param [applyBeforeValidation] Set to `true` to apply middleware before validation. This will execute the middleware prior to validation checks, but after parsing.
     */
    middleware(callbacks: MiddlewareFunction<T> | ReadonlyArray<MiddlewareFunction<T>>, applyBeforeValidation?: boolean): Yargs<T>;

    /**
     * The number of arguments that should be consumed after a key. This can be a useful hint to prevent parsing ambiguity.
     *
     * Optionally `.nargs()` can take an object of `key`/`narg` pairs.
     */
    nargs(key: string, count: number): Yargs<T>;
    nargs(nargs: { [ key: string ]: number; }): Yargs<T>;

    /** The key provided represents a path and should have `path.normalize()` applied. */
    normalize<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: ToString<T[ key ]> }>;
    normalize<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: string | undefined }>;

    /**
     * Tell the parser to always interpret key as a number.
     *
     * If `key` is an array, all elements will be parsed as numbers.
     *
     * If the option is given on the command line without a value, `Yargs` will be populated with `undefined`.
     *
     * If the value given on the command line cannot be parsed as a number, `Yargs` will be populated with `NaN`.
     *
     * Note that decimals, hexadecimals, and scientific notation are all accepted.
     */
    number<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: ToNumber<T[ key ]> }>;
    number<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: number | undefined }>;

    /**
     * Method to execute when a command finishes successfully.
     * @param func Is called with the successful result of the command that finished.
     */
    // onFinishCommand(func: (result: any) => void):Yargs<T>;

    /**
     * This method can be used to make yargs aware of options that could exist.
     * You can also pass an opt object which can hold further customization, like `.alias()`, `.demandOption()` etc. for that option.
     */
    option<K extends keyof T, O extends Options>(key: K, options: O): Yargs<Omit<T, K> & { [ key in K ]: InferredOptionType<O> }>;
    option<K extends string, O extends Options>(key: K, options: O): Yargs<T & { [ key in K ]: InferredOptionType<O> }>;
    option<O extends { [ key: string ]: Options; }>(options: O): Yargs<Omit<T, keyof O> & InferredOptionTypes<O>>;

    /**
     * This method can be used to make yargs aware of options that could exist.
     * You can also pass an opt object which can hold further customization, like `.alias()`, `.demandOption()` etc. for that option.
     */
    options<K extends keyof T, O extends Options>(key: K, options: O): Yargs<Omit<T, K> & { [ key in K ]: InferredOptionType<O> }>;
    options<K extends string, O extends Options>(key: K, options: O): Yargs<T & { [ key in K ]: InferredOptionType<O> }>;
    options<O extends { [ key: string ]: Options; }>(options: O): Yargs<Omit<T, keyof O> & InferredOptionTypes<O>>;

    /**
     * Parse `args` instead of `process.Yargs`. Returns the `Yargs` object. `args` may either be a pre-processed Yargs array, or a raw argument string.
     *
     * Note: Providing a callback to parse() disables the `exitProcess` setting until after the callback is invoked.
     * @param [context]  Provides a useful mechanism for passing state information to commands
     */
    parse<U = T>(): Arguments<U> | Promise<Arguments<U>>;
    parse<U = T>(arg: string | ReadonlyArray<string>, context?: object, parseCallback?: ParseCallback<U>): Arguments<U> | Promise<Arguments<U>>;
    parseSync(): { [ key in keyof Arguments<T> ]: Arguments<T>[ key ]; };
    parseSync<U = T>(arg: string | ReadonlyArray<string>, context?: object, parseCallback?: ParseCallback<T>): Arguments<U>;
    parseAsync<U = T>(): Promise<Arguments<U>>;
    parseAsync<U = T>(arg: string | ReadonlyArray<string>, context?: object, parseCallback?: ParseCallback<T>): Promise<Arguments<U>>;

    /**
     * If the arguments have not been parsed, this property is `false`.
     *
     * If the arguments have been parsed, this contain detailed parsed arguments.
     */
    parsed: DetailedArguments | false;

    /** Allows to configure advanced yargs features. */
    parserConfiguration(configuration: Partial<ParserConfigurationOptions>): Yargs<T>;

    /**
     * Similar to `config()`, indicates that yargs should interpret the object from the specified key in package.json as a configuration object.
     * @param [cwd] If provided, the package.json will be read from this location
     */
    pkgConf(key: string | ReadonlyArray<string>, cwd?: string): Yargs<T>;

    /**
     * Allows you to configure a command's positional arguments with an API similar to `.option()`.
     * `.positional()` should be called in a command's builder function, and is not available on the top-level yargs instance. If so, it will throw an error.
     */
    positional<K extends keyof T, O extends PositionalOptions>(key: K, opt: O): Yargs<Omit<T, K> & { [ key in K ]: InferredOptionType<O> }>;
    positional<K extends string, O extends PositionalOptions>(key: K, opt: O): Yargs<T & { [ key in K ]: InferredOptionType<O> }>;

    /** Should yargs provide suggestions regarding similar commands if no matching command is found? */
    recommendCommands(): Yargs<T>;

    /**
     * @deprecated since version 6.6.0
     * Use '.demandCommand()' or '.demandOption()' instead
     */
    require<K extends keyof T>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<Defined<T, K>>;
    require(key: string, msg: string): Yargs<T>;
    require(key: string, required: boolean): Yargs<T>;
    require(keys: ReadonlyArray<number>, msg: string): Yargs<T>;
    require(keys: ReadonlyArray<number>, required: boolean): Yargs<T>;
    require(positionals: number, required: boolean): Yargs<T>;
    require(positionals: number, msg: string): Yargs<T>;

    /**
     * @deprecated since version 6.6.0
     * Use '.demandCommand()' or '.demandOption()' instead
     */
    required<K extends keyof T>(key: K | ReadonlyArray<K>, msg?: string | true): Yargs<Defined<T, K>>;
    required(key: string, msg: string): Yargs<T>;
    required(key: string, required: boolean): Yargs<T>;
    required(keys: ReadonlyArray<number>, msg: string): Yargs<T>;
    required(keys: ReadonlyArray<number>, required: boolean): Yargs<T>;
    required(positionals: number, required: boolean): Yargs<T>;
    required(positionals: number, msg: string): Yargs<T>;

    requiresArg(key: string | ReadonlyArray<string>): Yargs<T>;

    /** Set the name of your script ($0). Default is the base filename executed by node (`process.Yargs[1]`) */
    scriptName($0: string): Yargs<T>;

    /**
     * Generate a bash completion script.
     * Users of your application can install this script in their `.bashrc`, and yargs will provide completion shortcuts for commands and options.
     */
    showCompletionScript(): Yargs<T>;

    /**
     * Configure the `--show-hidden` option that displays the hidden keys (see `hide()`).
     * @param option If `boolean`, it enables/disables this option altogether. i.e. hidden keys will be permanently hidden if first argument is `false`.
     * If `string` it changes the key name ("--show-hidden").
     * @param description Changes the default description ("Show hidden options")
     */
    showHidden(option?: string | boolean): Yargs<T>;
    showHidden(option: string, description?: string): Yargs<T>;

    /**
     * Print the usage data using the console function consoleLevel for printing.
     * @param [consoleLevel='error']
     */
    showHelp(consoleLevel?: string): Yargs<T>;

    /**
     * Provide the usage data as a string.
     * @param printCallback a function with a single argument.
     */
    showHelp(printCallback: (s: string) => void): Yargs<T>;

    /**
     * By default, yargs outputs a usage string if any error is detected.
     * Use the `.showHelpOnFail()` method to customize this behavior.
     * @param enable If `false`, the usage string is not output.
     * @param [message] Message that is output after the error message.
     */
    showHelpOnFail(enable: boolean, message?: string): Yargs<T>;

    /** Specifies either a single option key (string), or an array of options. If any of the options is present, yargs validation is skipped. */
    skipValidation(key: string | ReadonlyArray<string>): Yargs<T>;

    /**
     * Any command-line argument given that is not demanded, or does not have a corresponding description, will be reported as an error.
     *
     * Unrecognized commands will also be reported as errors.
     */
    strict(): Yargs<T>;
    strict(enabled: boolean): Yargs<T>;

    /**
     * Similar to .strict(), except that it only applies to unrecognized commands.
     * A user can still provide arbitrary options, but unknown positional commands
     * will raise an error.
     */
    strictCommands(): Yargs<T>;
    strictCommands(enabled: boolean): Yargs<T>;

    /**
     * Similar to `.strict()`, except that it only applies to unrecognized options. A
     * user can still provide arbitrary positional options, but unknown options
     * will raise an error.
     */
    strictOptions(): Yargs<T>;
    strictOptions(enabled: boolean): Yargs<T>;

    /**
     * Tell the parser logic not to interpret `key` as a number or boolean. This can be useful if you need to preserve leading zeros in an input.
     *
     * If `key` is an array, interpret all the elements as strings.
     *
     * `.string('_')` will result in non-hyphenated arguments being interpreted as strings, regardless of whether they resemble numbers.
     */
    string<K extends keyof T>(key: K | ReadonlyArray<K>): Yargs<Omit<T, K> & { [ key in K ]: ToString<T[ key ]> }>;
    string<K extends string>(key: K | ReadonlyArray<K>): Yargs<T & { [ key in K ]: string | undefined }>;

    // Intended to be used with '.wrap()'
    terminalWidth(): number;

    updateLocale(obj: { [ key: string ]: string; }): Yargs<T>;

    /**
     * Override the default strings used by yargs with the key/value pairs provided in obj
     *
     * If you explicitly specify a locale(), you should do so before calling `updateStrings()`.
     */
    updateStrings(obj: { [ key: string ]: string; }): Yargs<T>;

    /**
     * Set a usage message to show which commands to use.
     * Inside `message`, the string `$0` will get interpolated to the current script name or node command for the present script similar to how `$0` works in bash or perl.
     *
     * If the optional `description`/`builder`/`handler` are provided, `.usage()` acts an an alias for `.command()`.
     * This allows you to use `.usage()` to configure the default command that will be run as an entry-point to your application
     * and allows you to provide configuration for the positional arguments accepted by your program:
     */
    usage(message: string): Yargs<T>;
    usage<U>(command: string | ReadonlyArray<string>, description: string, builder?: (args: Yargs<T>) => Yargs<U>, handler?: (args: Arguments<U>) => void): Yargs<T>;
    usage<U>(command: string | ReadonlyArray<string>, showInHelp: boolean, builder?: (args: Yargs<T>) => Yargs<U>, handler?: (args: Arguments<U>) => void): Yargs<T>;
    usage<O extends { [ key: string ]: Options; }>(command: string | ReadonlyArray<string>, description: string, builder?: O, handler?: (args: Arguments<InferredOptionTypes<O>>) => void): Yargs<T>;
    usage<O extends { [ key: string ]: Options; }>(command: string | ReadonlyArray<string>, showInHelp: boolean, builder?: O, handler?: (args: Arguments<InferredOptionTypes<O>>) => void): Yargs<T>;

    /**
     * Add an option (e.g. `--version`) that displays the version number (given by the version parameter) and exits the process.
     * By default yargs enables version for the `--version` option.
     *
     * If no arguments are passed to version (`.version()`), yargs will parse the package.json of your module and use its version value.
     *
     * If the boolean argument `false` is provided, it will disable `--version`.
     */
    version(): Yargs<T>;
    version(version: string): Yargs<T>;
    version(enable: boolean): Yargs<T>;
    version(optionKey: string, version: string): Yargs<T>;
    version(optionKey: string, description: string, version: string): Yargs<T>;

    /**
     * Format usage output to wrap at columns many columns.
     *
     * By default wrap will be set to `Math.min(80, windowWidth)`. Use `.wrap(null)` to specify no column limit (no right-align).
     * Use `.wrap(yargs.terminalWidth())` to maximize the width of yargs' usage instructions.
     */
    wrap(columns: number | null): Yargs<T>;














    $0: string;
    argv?: Arguments;
    customScriptName: boolean;

    addHelpOpt(opt: any, msg: any): this;
    addShowHiddenOpt(opt: any, msg: any): this;
    command(cmd: any, description: any, builder: any, handler: any, middlewares: any, deprecated: any): this;
    commands(cmd: any, description: any, builder: any, handler: any, middlewares: any, deprecated: any): this;
    defaults(key: any, value: any, defaultDescription: any): this;
    getAliases(): any;
    getDemandedOptions(): any;
    getDemandedCommands(): any;
    getDeprecatedOptions(): any;
    getDetectLocale(): any;
    getExitProcess(): any;
    getGroups(): any;
    getHelp(): any;
    getOptions(): any;
    getStrict(): any;
    getStrictCommands(): any;
    getStrictOptions(): any;
    showVersion(level: any): this;
    [ kCreateLogger ](): {
        log: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
    [ kDeleteFromParserHintObject ](optionKey: any): void;
    [ kFreeze ](): void;
    [ kGetDollarZero ](): string;
    [ kGetParserConfiguration ](): any;
    [ kGuessLocale ](): void;
    [ kGuessVersion ](): any;
    [ kParsePositionalNumbers ](argv: any): any;
    [ kPkgUp ](rootPath: any): any;
    [ kPopulateParserHintArray ](type: any, keys: any): void;
    [ kPopulateParserHintSingleValueDictionary ](builder: any, type: any, key: any, value: any): void;
    [ kPopulateParserHintArrayDictionary ](builder: any, type: any, key: any, value: any): void;
    [ kPopulateParserHintDictionary ](builder: any, type: any, key: any, value: any, singleKeyHandler: any): void;
    [ kSanitizeKey ](key: any): any;
    [ kSetKey ](key: any, set: any): this;
    [ kUnfreeze ](): void;
    [ kValidateAsync ](validation: any, argv: any): any;
    getInternalMethods(): {
        getCommandInstance: any;
        getContext: any;
        getHasOutput: any;
        getLoggerInstance: any;
        getParseContext: any;
        getParserConfiguration: any;
        getUsageInstance: any;
        getValidationInstance: any;
        hasParseCallback: any;
        postProcess: any;
        reset: any;
        runValidation: any;
        runYargsParserAndExecuteCommands: any;
        setHasOutput: any;
    };
    [ kGetCommandInstance ](): any;
    [ kGetContext ](): any;
    [ kGetHasOutput ](): any;
    [ kGetLoggerInstance ](): any;
    [ kGetParseContext ](): any;
    [ kGetUsageInstance ](): any;
    [ kGetValidationInstance ](): any;
    [ kHasParseCallback ](): boolean;
    [ kPostProcess ](argv: any, populateDoubleDash: any, calledFromCommand: any, runGlobalMiddleware: any): any;
    [ kReset ](aliases?: {}): this;
    [ kRebase ](base: any, dir: any): any;
    [ kRunYargsParserAndExecuteCommands ](args: any, shortCircuit: any, calledFromCommand: any, commandIndex?: number, helpOnly?: boolean): any;
    [ kRunValidation ](aliases: any, positionalMap: any, parseErrors: any, isDefaultCommand: any): (argv: any) => void;
    [ kSetHasOutput ](): void;

}

export type Arguments<T = {}> = T & {
    /** Non-option arguments */
    _: Array<string | number>;
    /** The script name or node command */
    $0: string;
    /** All remaining options */
    [ argName: string ]: unknown;
};

export interface RequireDirectoryOptions {
    /** Look for command modules in all subdirectories and apply them as a flattened (non-hierarchical) list. */
    recurse?: boolean;
    /** The types of files to look for when requiring command modules. */
    extensions?: ReadonlyArray<string>;
    /**
     * A synchronous function called for each command module encountered.
     * Accepts `commandObject`, `pathToFile`, and `filename` as arguments.
     * Returns `commandObject` to include the command; any falsy value to exclude/skip it.
     */
    visit?: (commandObject: any, pathToFile?: string, filename?: string) => any;
    /** Whitelist certain modules */
    include?: RegExp | ((pathToFile: string) => boolean);
    /** Blacklist certain modules. */
    exclude?: RegExp | ((pathToFile: string) => boolean);
}

export interface Options {
    /** string or array of strings, alias(es) for the canonical option key, see `alias()` */
    alias?: string | ReadonlyArray<string>;
    /** boolean, interpret option as an array, see `array()` */
    array?: boolean;
    /**  boolean, interpret option as a boolean flag, see `boolean()` */
    boolean?: boolean;
    /** value or array of values, limit valid option arguments to a predefined set, see `choices()` */
    choices?: Choices;
    /** function, coerce or transform parsed command line values into another value, see `coerce()` */
    coerce?: (arg: any) => any;
    /** boolean, interpret option as a path to a JSON config file, see `config()` */
    config?: boolean;
    /** function, provide a custom config parsing function, see `config()` */
    configParser?: (configPath: string) => object;
    /** string or object, require certain keys not to be set, see `conflicts()` */
    conflicts?: string | ReadonlyArray<string> | { [ key: string ]: string | ReadonlyArray<string>; };
    /** boolean, interpret option as a count of boolean flags, see `count()` */
    count?: boolean;
    /** value, set a default value for the option, see `default()` */
    default?: any;
    /** string, use this description for the default value in help content, see `default()` */
    defaultDescription?: string;
    /**
     *  @deprecated since version 6.6.0
     *  Use 'demandOption' instead
     */
    demand?: boolean | string;
    /** boolean or string, mark the argument as deprecated, see `deprecateOption()` */
    deprecate?: boolean | string;
    /** boolean or string, mark the argument as deprecated, see `deprecateOption()` */
    deprecated?: boolean | string;
    /** boolean or string, demand the option be given, with optional error message, see `demandOption()` */
    demandOption?: boolean | string;
    /** string, the option description for help content, see `describe()` */
    desc?: string;
    /** string, the option description for help content, see `describe()` */
    describe?: string;
    /** string, the option description for help content, see `describe()` */
    description?: string;
    /** boolean, indicate that this key should not be reset when a command is invoked, see `global()` */
    global?: boolean;
    /** string, when displaying usage instructions place the option under an alternative group heading, see `group()` */
    group?: string;
    /** don't display option in help output. */
    hidden?: boolean;
    /**  string or object, require certain keys to be set, see `implies()` */
    implies?: string | ReadonlyArray<string> | { [ key: string ]: string | ReadonlyArray<string>; };
    /** number, specify how many arguments should be consumed for the option, see `nargs()` */
    nargs?: number;
    /** boolean, apply path.normalize() to the option, see `normalize()` */
    normalize?: boolean;
    /** boolean, interpret option as a number, `number()` */
    number?: boolean;
    /**
     *  @deprecated since version 6.6.0
     *  Use 'demandOption' instead
     */
    require?: boolean | string;
    /**
     *  @deprecated since version 6.6.0
     *  Use 'demandOption' instead
     */
    required?: boolean | string;
    /** boolean, require the option be specified with a value, see `requiresArg()` */
    requiresArg?: boolean;
    /** boolean, skips validation if the option is present, see `skipValidation()` */
    skipValidation?: boolean;
    /** boolean, interpret option as a string, see `string()` */
    string?: boolean;
    type?: 'array' | 'count' | PositionalOptionsType;
}

export interface PositionalOptions {
    /** string or array of strings, see `alias()` */
    alias?: string | ReadonlyArray<string>;
    /** boolean, interpret option as an array, see `array()` */
    array?: boolean;
    /** value or array of values, limit valid option arguments to a predefined set, see `choices()` */
    choices?: Choices;
    /** function, coerce or transform parsed command line values into another value, see `coerce()` */
    coerce?: (arg: any) => any;
    /** string or object, require certain keys not to be set, see `conflicts()` */
    conflicts?: string | ReadonlyArray<string> | { [ key: string ]: string | ReadonlyArray<string>; };
    /** value, set a default value for the option, see `default()` */
    default?: any;
    /** boolean or string, demand the option be given, with optional error message, see `demandOption()` */
    demandOption?: boolean | string;
    /** string, the option description for help content, see `describe()` */
    desc?: string;
    /** string, the option description for help content, see `describe()` */
    describe?: string;
    /** string, the option description for help content, see `describe()` */
    description?: string;
    /** string or object, require certain keys to be set, see `implies()` */
    implies?: string | ReadonlyArray<string> | { [ key: string ]: string | ReadonlyArray<string>; };
    /** boolean, apply path.normalize() to the option, see normalize() */
    normalize?: boolean;
    type?: PositionalOptionsType;
}

/** Remove keys K in T */
export type Omit<T, K> = { [ key in Exclude<keyof T, K> ]: T[ key ] };

/** Remove undefined as a possible value for keys K in T */
export type Defined<T, K extends keyof T> = Omit<T, K> & { [ key in K ]: Exclude<T[ key ], undefined> };

/** Convert T to T[] and T | undefined to T[] | undefined */
export type ToArray<T> = Array<Exclude<T, undefined>> | Extract<T, undefined>;

/** Gives string[] if T is an array type, otherwise string. Preserves | undefined. */
export type ToString<T> = (Exclude<T, undefined> extends any[] ? string[] : string) | Extract<T, undefined>;

/** Gives number[] if T is an array type, otherwise number. Preserves | undefined. */
export type ToNumber<T> = (Exclude<T, undefined> extends any[] ? number[] : number) | Extract<T, undefined>;

export type InferredOptionType<O extends Options | PositionalOptions> =
    O extends (
        | { required: string | true; }
        | { require: string | true; }
        | { demand: string | true; }
        | { demandOption: string | true; }
    ) ?
    Exclude<InferredOptionTypeInner<O>, undefined> :
    InferredOptionTypeInner<O>;

export type InferredOptionTypeInner<O extends Options | PositionalOptions> =
    O extends { default: any; coerce: (arg: any) => infer T; } ? T :
    O extends { default: infer D; } ? D :
    O extends { type: 'count'; } ? number :
    O extends { count: true; } ? number :
    RequiredOptionType<O> | undefined;

export type RequiredOptionType<O extends Options | PositionalOptions> =
    O extends { type: 'array'; string: true; } ? string[] :
    O extends { type: 'array'; number: true; } ? number[] :
    O extends { type: 'array'; normalize: true; } ? string[] :
    O extends { type: 'string'; array: true; } ? string[] :
    O extends { type: 'number'; array: true; } ? number[] :
    O extends { string: true; array: true; } ? string[] :
    O extends { number: true; array: true; } ? number[] :
    O extends { normalize: true; array: true; } ? string[] :
    O extends { type: 'array'; } ? Array<string | number> :
    O extends { type: 'boolean'; } ? boolean :
    O extends { type: 'number'; } ? number :
    O extends { type: 'string'; } ? string :
    O extends { array: true; } ? Array<string | number> :
    O extends { boolean: true; } ? boolean :
    O extends { number: true; } ? number :
    O extends { string: true; } ? string :
    O extends { normalize: true; } ? string :
    O extends { choices: ReadonlyArray<infer C>; } ? C :
    O extends { coerce: (arg: any) => infer T; } ? T :
    unknown;

export type InferredOptionTypes<O extends { [ key: string ]: Options; }> = { [ key in keyof O ]: InferredOptionType<O[ key ]> };

/* export interface CommandModule<T = {}, U = {}> {
    // array of strings (or a single string) representing aliases of `exports.command`, positional args defined in an alias are ignored
    aliases?: ReadonlyArray<string> | string;
    // object declaring the options the command accepts, or a function accepting and returning a yargs instance
    builder?: CommandBuilder<T, U>;
    // string (or array of strings) that executes this command when given on the command line, first string may contain positional args
    command?: ReadonlyArray<string> | string;
    // boolean (or string) to show deprecation notice
    deprecated?: boolean | string;
    // string used as the description for the command in help text, use `false` for a hidden command
    describe?: string | false;
    // a function which will be passed the parsed Yargs.
    handler: (args: Arguments<U>) => void;
} */

// export type CommandBuilder<T = {}, U = {}> = { [ key: string ]: Options; } | ((args:Yargs<T>) => Yargs<U>) | ((args:Yargs<T>) => PromiseLike<Yargs<U>>);


export interface CommandModule<T, V = T, U = T, Y = Yargs<T>, ExtraBuider = {}, ExtraHandler = {}> {
    /** array of strings (or a single string) representing aliases of `exports.command`, positional args defined in an alias are ignored */
    aliases?: ReadonlyArray<string> | string;
    /** object declaring the options the command accepts, or a function accepting and returning a yargs instance */
    builder?: CommandBuilder<T, U, Y, ExtraBuider>;
    /** string (or array of strings) that executes this command when given on the command line, first string may contain positional args */
    command?: ReadonlyArray<string> | string;
    /** boolean (or string) to show deprecation notice */
    deprecated?: boolean | string;
    /** string used as the description for the command in help text, use `false` for a hidden command */
    describe?: string | false;
    /** a function which will be passed the parsed argv. */
    handler: (args: Arguments<V> & ExtraHandler, yargs: Y) => void;
}

export type BuilderCallback<T, U = T, Y = Yargs<T>, Extra = {}> = ((args: Y & Extra, helpOrVersionSet: boolean) => (Yargs<U> | PromiseLike<Yargs<U>> | void));

export type CommandBuilder<T, U = T, Y = Yargs<T>, Extra = {}> = { [ key: string ]: Options; } | BuilderCallback<T, U, Y, Extra>;



export type ParseCallback<T = {}> = (err: Error | undefined, Yargs: Arguments<T> | Promise<Arguments<T>>, output: string) => void;

export type SyncCompletionFunction = (current: string, Yargs: any) => string[];
export type AsyncCompletionFunction = (current: string, Yargs: any, done: (completion: ReadonlyArray<string>) => void) => void;
export type PromiseCompletionFunction = (current: string, Yargs: any) => Promise<string[]>;
export type MiddlewareFunction<T = {}> = (args: Arguments<T>) => void;
export type Choices = ReadonlyArray<string | number | true | undefined>;
export type PositionalOptionsType = 'boolean' | 'number' | 'string';


export interface Positional {
    cmd: string[];
    variadic: boolean;
}

export interface CommandHandlerCallback<T> {
    (argv: Arguments<T>, yargs: Yargs<T>): any;
}

export interface MiddlewareCallback<T> {
    (argv: Arguments<T>, yargs: Yargs<T>):
        | Partial<Arguments<T>>
        | Promise<Partial<Arguments<T>>>;
}


export interface Middleware<T> extends MiddlewareCallback<T> {
    applyBeforeValidation: boolean;
    global: boolean;
    option?: string;
}


export interface CommandHandler<T, U = T> {
    builder: CommandBuilder<T, U>;
    demanded: Positional[];
    deprecated?: boolean;
    description?: string | false;
    handler: CommandHandlerCallback<T>;
    middlewares: Middleware<T>[];
    optional: Positional[];
    original: string;
}


export interface Context {
    commands: string[];
    fullCommands: string[];
}

// Created putting the file 'yargs/build/lib/yargs-factory.js' in a typescript project

// export declare function YargsFactory(_shim: any): (processArgs: any[], cwd: any, parentRequire: any) => YargsInstance;
declare const kCreateLogger: unique symbol;
declare const kDeleteFromParserHintObject: unique symbol;
declare const kFreeze: unique symbol;
declare const kGetDollarZero: unique symbol;
declare const kGetParserConfiguration: unique symbol;
declare const kGuessLocale: unique symbol;
declare const kGuessVersion: unique symbol;
declare const kParsePositionalNumbers: unique symbol;
declare const kPkgUp: unique symbol;
declare const kPopulateParserHintArray: unique symbol;
declare const kPopulateParserHintSingleValueDictionary: unique symbol;
declare const kPopulateParserHintArrayDictionary: unique symbol;
declare const kPopulateParserHintDictionary: unique symbol;
declare const kSanitizeKey: unique symbol;
declare const kSetKey: unique symbol;
declare const kUnfreeze: unique symbol;
declare const kValidateAsync: unique symbol;
declare const kGetCommandInstance: unique symbol;
declare const kGetContext: unique symbol;
declare const kGetHasOutput: unique symbol;
declare const kGetLoggerInstance: unique symbol;
declare const kGetParseContext: unique symbol;
declare const kGetUsageInstance: unique symbol;
declare const kGetValidationInstance: unique symbol;
declare const kHasParseCallback: unique symbol;
declare const kPostProcess: unique symbol;
declare const kRebase: unique symbol;
declare const kReset: unique symbol;
declare const kRunYargsParserAndExecuteCommands: unique symbol;
declare const kRunValidation: unique symbol;
declare const kSetHasOutput: unique symbol;


export declare function isYargsInstance(y: any): boolean;
