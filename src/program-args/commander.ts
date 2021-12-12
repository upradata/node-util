export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import { CliCommand } from './cli-command';
import { red, yellow, styles as s } from '../template-style';


export interface CommandOptions {
    version?: number;
    packageJson?: string;
    name?: string;
    allowUnknownOption?: boolean;
    allowExcessArguments?: boolean;
    showSuggestionAfterError?: boolean;
}


export const createCli = (options: CommandOptions = {}) => {

    const program = new CliCommand(options.name);

    const opts = {
        allowUnknownOption: false,
        allowExcessArguments: false,
        showSuggestionAfterError: true,
        ...options
    };

    program.allowUnknownOption(opts.allowUnknownOption);
    program.allowExcessArguments(opts.allowExcessArguments);
    program.showSuggestionAfterError(opts.showSuggestionAfterError);
    program.showHelpAfterError(s.yellow.args.$`\n😥 use ${'--help'} for additional information 😥`);

    program.configureOutput({
        // Visibly override write routines as example!
        // writeOut: (str) => process.stdout.write(`[OUT] ${str}`),
        // writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
        // Highlight errors in color.
        outputError: (str, write) => {
            const lines = str.split('\n').map(line => {
                if (line.startsWith('error:'))
                    return red`${line}`;

                if (line.startsWith('(') && line.endsWith(')'))
                    return yellow`${line.replace(/\((.*)\)/, '$1')}`;

                return line;
            });

            write(`\n${lines.join('\n')}`);
        }
    });

    program.configureHelp({
        sortSubcommands: true,
        sortOptions: true

    });

    const packageJson = options.packageJson ? require(options.packageJson) : {};
    const version = packageJson.version || options.version;

    if (version)
        program.version(`${version}`);


    return program;
};;
