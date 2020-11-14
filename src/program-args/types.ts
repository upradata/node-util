import { Arguments, Argv, Options } from 'yargs';


export interface CommandModule<T = {}, U = {}, ExtraBuider = {}, ExtraHandler = {}> {
    /** array of strings (or a single string) representing aliases of `exports.command`, positional args defined in an alias are ignored */
    aliases?: ReadonlyArray<string> | string;
    /** object declaring the options the command accepts, or a function accepting and returning a yargs instance */
    builder?: CommandBuilder<T, U, ExtraBuider>;
    /** string (or array of strings) that executes this command when given on the command line, first string may contain positional args */
    command?: ReadonlyArray<string> | string;
    /** boolean (or string) to show deprecation notice */
    deprecated?: boolean | string;
    /** string used as the description for the command in help text, use `false` for a hidden command */
    describe?: string | false;
    /** a function which will be passed the parsed argv. */
    handler: (args: Arguments<U> & ExtraHandler) => void;
};


type CommandBuilder<T = {}, U = {}, Extra = {}> = { [ key: string ]: Options; } | ((args: Argv<T> & Extra) => Argv<U>) | ((args: Argv<T> & Extra) => PromiseLike<Argv<U>>);
