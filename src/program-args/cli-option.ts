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
        // parseArg?: (<T>(value: string, previous: T) => T) | (<T>(value: string, previous: T, aliasOriginOption?: CliOption) => T);
        // <T>(value: string, previous: T) => T;
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

export type AliasMode = 'two-way' | 'source' | 'target';
export type AliasTransforms = {
    [ AliasTo: string ]: (value: string) => string | CommanderParser<never, string>;
};

export interface Alias {
    flags: string;
    parser?: CommanderParser<any>;
    transforms?: AliasTransforms;
    mode?: AliasMode;
}


export class CliOption extends Option {
    private cliAliases: Set<CliOption> = new Set();
    public isObject = false;
    public isValueFromDefault = false;
    public parser: CommanderParser<any> = undefined; // parseArg synonym
    public aliasMode: AliasMode = 'two-way';
    public aliasTransforms: AliasTransforms = {};

    constructor(flags: string, description?: string) {
        super(flags, description);
        this.isObject = this.name().split('.').length > 1;
    }

    get aliases() {
        return this.cliAliases;
    }

    hasAliases() {
        return this.cliAliases.size > 0;
    }

    addAlias(alias: Alias) {
        const aliasOption = Object.assign(
            new CliOption(alias.flags),
            {
                aliasMode: alias.mode || 'two-way',
                parser: alias.parser || this.parseArg,
                parseArg: alias.parser || this.parseArg,
                aliasTransforms: alias.transforms,
                description: this.description,
                defaultValue: this.defaultValue,
                defaultValueDescription: this.defaultValueDescription,
                envVar: this.envVar,
                hidden: this.hidden,
                argChoices: this.argChoices
            } as Partial<CliOption>
        );

        const optionFlags = splitOptionFlags(alias.flags);

        aliasOption.short = optionFlags.shortFlag;
        aliasOption.long = optionFlags.longFlag;
        aliasOption.negate = false;

        if (aliasOption.long) {
            aliasOption.negate = aliasOption.long.startsWith('--no-');
        }


        for (const o of [ this, ...this.cliAliases ]) {
            o.cliAliases.add(aliasOption);
            aliasOption.cliAliases.add(o);
        }

        return this;
    };

    addAliases(...aliases: Alias[]) {
        aliases.forEach(alias => this.addAlias(alias));
        return this;
    }

    argParser<T>(fn: (value: string, previous: T) => T): this {
        super.argParser(fn);
        this.parser = this.parseArg;

        return this;
    }

    attributeName() {
        return camelcase(this.name().replace(/^no-/, ''));
    };
}


type SplitOptionFlags = (flags: string) => { shortFlag: string; longFlag: string; };
const splitOptionFlags = commanderOption.splitOptionFlags as SplitOptionFlags;
