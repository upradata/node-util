import colorsStyles from 'colors/lib/styles';
import { supportsColor } from 'colors/lib/system/supports-colors';
import colorsSafe from 'colors/safe';
import {
    buildStyle,
    DefinedStringTransforms,
    ensureArray,
    makeObject,
    recreateString,
    Style,
    StyleOptions,
    styles as s,
    Styles,
    StyleTransform,
    ToString
} from '@upradata/util';
import { TerminalStyleNames } from './helpers';


export * from '@upradata/util/lib/template-string/export';
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
