import { buildStyle, DefinedStringTransforms, makeObject, recreateString, styles as s, Styles, StyleTransform, StyleOptions, Style, ToString, ensureArray } from '@upradata/util';
export * from '@upradata/util/lib/template-string/export';
import { TerminalStyleNames } from './helpers';
import colorsSafe from 'colors/safe';
import colorsStyles from 'colors/lib/styles';
import { supportsColor } from 'colors/lib/system/supports-colors';

type AllTerminalStyleNames = (keyof typeof colorsSafe) | TerminalStyleNames;
type TerminalStyleStringTranforms = Record<AllTerminalStyleNames, StyleTransform> & { none: (s: string) => string; };


export const COLORS_SAFE = colorsSafe as unknown as TerminalStyleStringTranforms;
COLORS_SAFE.none = (s: string) => s;

const props = Object.keys(colorsStyles).concat('none', 'stripColors', 'strip') as AllTerminalStyleNames[];

export const colorsTransforms = makeObject(props, (k): StyleOptions => ({
    transforms: [
        (strings: TemplateStringsArray | ToString, ...keys: ToString[]) => recreateString(ensureArray(strings) as any, ...keys),
        COLORS_SAFE[ k ]
    ],
    flattenIfNoTransforms: recreateString
}));


buildStyle(props, colorsTransforms);

export type TerminalStyles = Styles<DefinedStringTransforms & TerminalStyleStringTranforms>;
export const styles = s as TerminalStyles;


// backward compatible

export const colors = styles;

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof AllTerminalStyleNames ]: ColorType;
};


export const disableTTYStylesIfNotSupported = (stream = process.stdout) => {

    const supports = supportsColor(stream);

    if (!supports)
        colorsSafe.disable();
};
