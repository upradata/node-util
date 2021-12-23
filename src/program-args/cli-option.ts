import { Option } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import * as commanderOption from 'commander/lib/option';
import { NonFunctionProperties } from '@upradata/util';
import { CommanderParser } from './parsers';
import { camelcase } from './util';



declare module 'commander' {
    interface Option {
        envVar: string;
        _concatValue: <T>(v1: T, v2: T | T[]) => T[];
    }
}


export type CliOptionInit<T> = Omit<NonFunctionProperties<Partial<Option>>, 'parseArg' | 'argChoices'> & {
    flags: string;
    description?: string;
    defaultValue?: T;
    defaultValueDescription?: string;
    envVar?: string;
    parser?: CommanderParser<T>;
    hidden?: boolean;
    choices?: T[];
    aliases?: Alias[];
};


export interface Alias {
    flags: string;
    parser?: CommanderParser<any>;
}


export class CliOption extends Option {
    private cliAliases: Set<CliOption> = new Set();
    public isObject = false;
    public isValueFromDefault = false;

    constructor(flags: string, description?: string) {
        super(flags, description);
        this.isObject = this.name().split('.').length > 1;
    }

    get aliases() {
        return this.cliAliases;
    }

    addAlias(alias: Alias) {
        const aliasOption = Object.assign(
            new CliOption(alias.flags),
            {
                parseArg: alias.parser || this.parseArg,
                description: this.description,
                defaultValue: this.defaultValue,
                defaultValueDescription: this.defaultValueDescription,
                envVar: this.envVar,
                hidden: this.hidden,
                choices: this.argChoices
            }
        );

        const optionFlags = splitOptionFlags(alias.flags);

        aliasOption.short = optionFlags.shortFlag;
        aliasOption.long = optionFlags.longFlag;
        aliasOption.negate = false;

        if (aliasOption.long) {
            aliasOption.negate = aliasOption.long.startsWith('--no-');
        }

        this.cliAliases.add(aliasOption);

        for (const alias of this.cliAliases) {
            alias.cliAliases.add(aliasOption);
            aliasOption.cliAliases.add(alias);
        }

        return this;
    };

    addAliases(...aliases: Alias[]) {
        aliases.forEach(alias => this.addAlias(alias));
        return this;
    }

    attributeName() {
        return camelcase(this.name().replace(/^no-/, ''));
    };
}


type SplitOptionFlags = (flags: string) => { shortFlag: string; longFlag: string; };
const splitOptionFlags = commanderOption.splitOptionFlags as SplitOptionFlags;
