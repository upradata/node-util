import yargs from 'yargs/yargs';
import { camelize, decamelize, ObjectOf } from '@upradata/util';
import { red } from '../template-style';
import {
    Arguments,
    BuilderCallback,
    CommandHandler,
    CommandModule,
    Context,
    InferredOptionTypes,
    MiddlewareFunction,
    Options,
    Yargs as YargsInstance
} from './yargs';
// import { YargsInstance } from './yargs-instance';


const { cjsPlatformShim } = require('yargs/build/index.cjs');


export interface YargsCtor {
    new(processArgs: any[], cwd: any, parentRequire: any, shim: any): YargsInstance;
    // to get Yargs.prototype typing
    readonly prototype: YargsInstance;
}


// As yargs/build/lib/yargs-factory where class YargsInstance is defined is a ESM module
// I use this trick to get back the class from the CommonJS compilation from 'yargs/build/index.cjs'

// yargs is defined a yargs = YargsFactory(cjsPlatformShim) and has type Argv. Calling it, it returns a YargsInstance instance
const Yargs: YargsCtor = Object.getPrototypeOf(yargs()).constructor;

const yargsMethods = Yargs.prototype;


export interface InvalidParameter {
    parameter: string;
    reason: string;
}




// Thomas
/* protected applyMiddlewareAndGetResult(
    isDefaultCommand: boolean,
    commandHandler: CommandHandler < any, any >,
    innerArgv: Arguments | Promise < Arguments >,
    currentContext: Context,
    helpOnly: boolean,
    aliases: Record < string, string[] >,
    yargs: YargsInstance
): Arguments | Promise<Arguments>;
 */

// export type MiddlewareCallback<T, U> = (argv: Arguments<T>, yargs: _ParseArgs<T>) => Arguments<U>;

export class CustomYargs extends Yargs {

    public supportedArgs = [ '$0', '_', 'version', 'help' ];

    constructor() {
        super(process.argv.slice(2), process.cwd(), require, cjsPlatformShim);

        Object.getOwnPropertyNames(yargsMethods).forEach(key => {
            // some yargs methods are being called with f.call(this, ...)
            // so we ensure this represents CustomYargs
            if (typeof yargsMethods[ key ] === 'function' && key !== 'constructor')
                yargsMethods[ key ] = yargsMethods[ key ].bind(this);
        });

        this.init();
    }

    /* public middleware<U>(callback: MiddlewareCallback<T, U> | MiddlewareCallback<T, U>[], applyBeforeValidation?: boolean) {
        return this.yargs.middleware(callback as any, applyBeforeValidation);
    } */

    public option(name: string, options?: Options) {
        // yargs add camel case option name already
        // we add it just in supportedArgs
        yargsMethods.option(name, options);

        const args: string[] = [ name ];

        const camelArg = camelize(name);
        if (camelArg !== name)
            args.push(camelArg);

        const decamelArg = decamelize(camelArg);
        if (decamelArg !== name)
            args.push(decamelArg);

        this.supportedArgs.push(...args);

        if (options.alias) {
            const aliases = typeof options.alias === 'string' ? [ options.alias ] : options.alias;
            for (const alias of aliases) {
                this.supportedArgs.push(alias);

                const camelAlias = camelize(alias);
                if (camelAlias !== alias)
                    this.supportedArgs.push(camelAlias);
            }
        }

        return this;
    }

    public options(keys: ObjectOf<Options>) {
        for (const [ key, options ] of Object.entries(keys))
            this.option(key, options);

        return this;
    }

    public invalidParams(argv: Arguments<any>): InvalidParameter[] {
        const unvalidParams: InvalidParameter[] = [];

        for (const arg of Object.keys(argv)) {
            if (!this.supportedArgs.includes(arg))
                unvalidParams.push({ parameter: arg, reason: `Invalid option` });
        }

        return unvalidParams.length === 0 ? [] : unvalidParams;
    }

    public invalidParamsAndExit(argv: Arguments<any>) {
        const invalidParams = this.invalidParams(argv);

        if (invalidParams.length > 0) {
            for (const { parameter, reason } of invalidParams)
                console.error(red`  - parameter "${parameter}": ${reason}`);

            console.log();
            this.showHelp();
            process.exit(1);
        }
    }

    private init() {
        const commandInstance = this.getInternalMethods().getCommandInstance();
        const applyOriginal = commandInstance.applyMiddlewareAndGetResult.bind(commandInstance);

        commandInstance.applyMiddlewareAndGetResult = (
            isDefaultCommand: boolean,
            commandHandler: CommandHandler<any, any>,
            innerArgv: Arguments | Promise<Arguments>,
            currentContext: Context,
            helpOnly: boolean,
            aliases: Record<string, string[]>,
            yargs: YargsInstance) => {

            const { handler } = commandHandler;
            commandHandler.handler = argv => handler(argv, this as any);

            return applyOriginal(isDefaultCommand, commandHandler, innerArgv, currentContext, helpOnly, aliases, yargs);

        };
    }
}



export type ParseArgs<T = {}> = CustomYargs & YargsInstance<T> & Command<T>;


export type Command<T> = & {
    command<V, U>(
        command: string | ReadonlyArray<string>,
        description: string,
        builder?: BuilderCallback<T, U, ParseArgs<T>>,
        handler?: (args: Arguments<V>, yargs: ParseArgs<T>) => void,
        middlewares?: MiddlewareFunction[],
        deprecated?: boolean | string,
    ): ParseArgs<T>;
    command<O extends { [ key: string ]: Options; }>(
        command: string | ReadonlyArray<string>,
        description: string,
        builder?: O,
        handler?: (args: Arguments<InferredOptionTypes<O>>, yargs: ParseArgs<T>) => void,
        middlewares?: MiddlewareFunction[],
        deprecated?: boolean | string,
    ): ParseArgs<T>;
    command<V, U>(command: string | ReadonlyArray<string>, description: string, module: CommandModule<T, V, U, ParseArgs<T>>): ParseArgs<T>;
    command<V, U>(
        command: string | ReadonlyArray<string>,
        showInHelp: false,
        builder?: BuilderCallback<T, U, ParseArgs<T>>,
        handler?: (args: Arguments<V>, yargs: ParseArgs<T>) => void,
        middlewares?: MiddlewareFunction[],
        deprecated?: boolean | string,
    ): ParseArgs<T>;
    command<O extends { [ key: string ]: Options; }>(
        command: string | ReadonlyArray<string>,
        showInHelp: false,
        builder?: O,
        handler?: (args: Arguments<InferredOptionTypes<O>>, yargs: ParseArgs<T>) => void,
    ): ParseArgs<T>;
    command<V, U>(command: string | ReadonlyArray<string>, showInHelp: false, module: CommandModule<T, V, U, ParseArgs<T>>): ParseArgs<T>;
    command<V, U>(module: CommandModule<T, V, U, ParseArgs<T>>): ParseArgs<T>;
};


export type ParseArgsCtor<T = {}> = new () => ParseArgs<T>;

export const ParseArgsFactory = <T = {}>() => CustomYargs as any as ParseArgsCtor<T>;
export const ParseArgs = ParseArgsFactory();


export type ParseArgsCommandModule<T = {}, V = T, U = T> = CommandModule<T, V, U, ParseArgs<T>, {}, {}>;
