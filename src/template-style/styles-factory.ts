import { buildStyle, DefinedStringTransforms, makeObject, recreateString, styles as s, Styles, PickType, StyleTransform, Style } from '@upradata/util';
import { ColorsStyle } from './helpers/color-styles.type';
import colorsSafe from 'colors/safe';
import colorsStyles from 'colors/lib/styles';

type ColorsStringTranform = PickType<typeof colorsSafe & ColorsStyle, StyleTransform> & { none: (s: string) => string; };

export const COLORS_SAFE = colorsSafe as ColorsStringTranform;
COLORS_SAFE.none = (s: string) => s;

export const colorsTransforms = makeObject(ColorsStyle, k => COLORS_SAFE[ k ]);

const props = Object.keys(colorsStyles).concat('none', 'stripColors', 'strip');

buildStyle(props, colorsTransforms, recreateString);

export const styles = s as Styles<DefinedStringTransforms & ColorsStringTranform>;


// backward compatible

export const colors = styles;

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof ColorsStyle ]: ColorType;
};
