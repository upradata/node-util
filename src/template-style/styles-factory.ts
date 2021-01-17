import { buildStyle, DefinedStringTransforms, makeObject, recreateString, styles as s, Styles, StyleTransform, StyleOptions, Style, ToString, ensureArray } from '@upradata/util';
export * from '@upradata/util/lib/template-string/export';
import { ColorsStyle } from './helpers/color-styles.type';
import colorsSafe from 'colors/safe';
import colorsStyles from 'colors/lib/styles';

type ColorsNames = keyof (typeof colorsSafe & ColorsStyle);
type ColorsStringTranforms = Record<ColorsNames, StyleTransform> & { none: (s: string) => string; };

export const COLORS_SAFE = colorsSafe as unknown as ColorsStringTranforms;
COLORS_SAFE.none = (s: string) => s;

const props = Object.keys(colorsStyles).concat('none', 'stripColors', 'strip') as ColorsNames[];

export const colorsTransforms = makeObject(props, (k): StyleOptions => ({
    transforms: [
        (strings: TemplateStringsArray | ToString, ...keys: ToString[]) => recreateString(ensureArray(strings) as any, ...keys),
        COLORS_SAFE[ k ]
    ],
    flattenIfNoTransforms: recreateString
}));


buildStyle(props, colorsTransforms);

export const styles = s as Styles<DefinedStringTransforms & ColorsStringTranforms>;


// backward compatible

export const colors = styles;

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof ColorsStyle ]: ColorType;
};
