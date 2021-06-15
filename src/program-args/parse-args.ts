import yargs from 'yargs/yargs';
import { Options, Arguments } from 'yargs';
const { cjsPlatformShim } = require('yargs/build/index.cjs');
import { YargsInstance } from './yargs-instance';
import { Yargs as YargsType, CommandModule } from './yargs';
import { ObjectOf, decamelize, camelize } from '@upradata/util';
import { red } from '../template-style';


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



// export type MiddlewareCallback<T, U> = (argv: Arguments<T>, yargs: _ParseArgs<T>) => Arguments<U>;

export class CustomYargs extends Yargs {

    public supportedArgs = [ '$0', '_', 'version', 'help' ];

    constructor() {
        super(process.argv.slice(2), process.cwd(), require, cjsPlatformShim);

        Object.getOwnPropertyNames(yargsMethods).forEach(key => {
            if (typeof yargsMethods[ key ] === 'function' && key !== 'constructor')
                yargsMethods[ key ] = yargsMethods[ key ].bind(this);
        });
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
};


export type ParseArgs<T = {}> = CustomYargs & YargsType<T>;
export type ParseArgsCtor<T = {}> = new () => ParseArgs<T>;

export const ParseArgsFactory = <T = {}>() => CustomYargs as any as ParseArgsCtor<T>;
export const ParseArgs = ParseArgsFactory();


// export type CustomCommandModule<T = {}, U = T> = CommandModule<T, U, {}, {}>;
