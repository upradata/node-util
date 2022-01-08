import { Option } from 'commander';
export { InvalidArgumentError as CliInvalidArgumentError } from 'commander';
import * as commanderOption from 'commander/lib/option';
import { NonFunctionProperties, ifthen } from '@upradata/util';
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

export type AliasDirection = 'source' | 'target';
export type AliasMode = 'multi-way' | 'two-way' | AliasDirection;

export type AliasTransform = ((value: string) => string) | CommanderParser<never, string>;
export type AliasTransforms = {
    [ AliasTo: string ]: AliasTransform;
};


type AliasDetail = {
    mode?: Exclude<AliasMode, 'multi-way'>;
    transform?: AliasTransform;
} | {
    mode: 'multi-way';
    transform?: AliasTransform | AliasTransforms;
};

export type AliasInit = {
    flags: string;
    parser?: CommanderParser<any>;
} & AliasDetail;

export type AliasCliOption = { option: CliOption; } & AliasDetail;

export type Alias = AliasInit | AliasCliOption;

const isAliasCliOption = (v: Alias): v is AliasCliOption => !!(v as AliasCliOption)?.option;


export class CliOption extends Option {
    private cliAliases: Set<{ option: CliOption, direction: AliasDirection; transform: AliasTransform; }> = new Set();
    public isObject = false;
    public isValueFromDefault = false;
    public parser: CommanderParser<any> = undefined; // parseArg synonym

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

        const add = (d: Omit<AliasCliOption, 'transform'> & { transform: AliasTransform; }) => {
            const { option, mode, transform = (v: string) => v } = d;

            const addAlias = (d: { alias: AliasDirection, this: AliasDirection; }) => {
                option.cliAliases.add({ option: this, direction: d.this, transform: transform.bind(this) });
                this.cliAliases.add({ option, direction: d.alias, transform: transform.bind(option) });
            };


            if (mode === 'source' || mode === 'two-way')
                addAlias({ alias: 'source', this: 'target' });

            if (mode === 'target' || mode === 'two-way')
                addAlias({ alias: 'target', this: 'source' });

        };


        const mode = alias.mode || 'source';

        const getAliasOption = () => {

            if (isAliasCliOption(alias))
                return alias.option;


            const aliasOption = Object.assign(
                new CliOption(alias.flags),
                {
                    parser: alias.parser || this.parseArg,
                    parseArg: alias.parser || this.parseArg,
                    description: this.description,
                    defaultValue: mode === 'source' ? undefined : this.defaultValue,
                    defaultValueDescription: mode === 'source' ? undefined : this.defaultValueDescription,
                    envVar: mode === 'source' ? undefined : this.envVar,
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

            return aliasOption;
        };

        const aliasOption = getAliasOption();

        if (mode !== 'multi-way')
            add({ option: aliasOption, mode, transform: alias.transform as AliasTransform });
        else {
            for (const a of this.cliAliases) {
                const transform = ifthen({
                    if: typeof alias.transform === 'function',
                    then: alias.transform as AliasTransform,
                    else: (alias.transform[ a.option.name() ] || alias.transform[ a.option.attributeName() ]) as AliasTransform
                });

                a.option.addAlias({ option: aliasOption, mode: 'two-way', transform });
            }
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
