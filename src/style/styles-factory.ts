import { BasicStyleList } from './styles/basic-style-list';
import { ObjectOf, PickType } from '@upradata/util';
import { StyleTransform, Style, StyleFlatten } from './style';
import colorsSafe from 'colors/safe';
import colorsStyles from 'colors/lib/styles';
import { CommonTagStyleList } from './styles/common-tag-list';
import * as commonTags from 'common-tags';
import { recreateString, ToString } from './template-string';


const buildStyle = <S extends ObjectOf<StyleTransform | Style>>(names: string[], styleFactories: S, flatten?: StyleFlatten) => {

    for (const k of names) {
        let first = true;

        Object.defineProperty(Style.prototype, k, {
            // tslint:disable-next-line:object-literal-shorthand
            get: function (this: Style) {
                // this will allow syntax red.bgYellow.underline.$ 
                return new Style({ transforms: [ this, styleFactories[ k ] ], flatten });
            }
        });
    }
};




// BasicStyleList  is only a subset of typeof colorsSafe + additional stuff
// Fix to do: typeof colorsSafe is not up to date (colors/safe.d.ts misses a lot of definition)
type ColorsStringTranform = PickType<typeof colorsSafe & BasicStyleList, StyleTransform> & { none: (s: string) => string; };
type CommonTagsStringTranform = PickType<CommonTagStyleList, StyleTransform> & { none: (s: string) => string; };
type AllDefinedStringTransforms = ColorsStringTranform & CommonTagsStringTranform;


export const COLORS_SAFE = colorsSafe as ColorsStringTranform;
COLORS_SAFE.none = s => s;

export type Styles = Style & {
    [ K in keyof AllDefinedStringTransforms ]: Styles & Style;
};


export const transformToStyleTemplate = (transform: (arg: any) => string) => (strings: TemplateStringsArray, ...keys: ToString[]) => transform(recreateString(strings, ...keys));


buildStyle(Object.keys(colorsStyles).concat('none', 'stripColors', 'strip'), COLORS_SAFE, recreateString);

const commonTagsKeys = Object.keys(new CommonTagStyleList());
buildStyle(commonTagsKeys, Object.fromEntries(commonTagsKeys.map(k => [ k, commonTags[ k ] ])));


export const styles = new Style() as Styles;
export const colors = styles; // backward compatibility

// backward compatible

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof BasicStyleList ]: ColorType;
};
