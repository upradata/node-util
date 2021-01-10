import { BasicStyleList } from './styles/basic-style-list';
import { ObjectOf, PickType } from '@upradata/util';
import { StringTransform, Style } from './style';
import colorsSafe from 'colors/safe';
import colorsStyles from 'colors/lib/styles';
import { CommonTagStyleList } from './styles/common-tag-list';
import * as commonTags from 'common-tags';


export class StyleFactory extends Style {
    static build<S extends ObjectOf<StringTransform>>(names: string[], styleFactories: S) {

        for (const k of names) {

            Object.defineProperty(StyleFactory.prototype, k, {
                // tslint:disable-next-line:object-literal-shorthand
                get: function () {
                    return this.add([ styleFactories[ k ] ], new StyleFactory()); // this will allow syntax red.bgYellow.underline.$ 
                }
            });
        }
    }
}



// BasicStyleList  is only a subset of typeof colorsSafe + additional stuff
// Fix to do: typeof colorsSafe is not up to date (colors/safe.d.ts misses a lot of definition)
type ColorsStringTranform = PickType<typeof colorsSafe & BasicStyleList, StringTransform> & { none: (s: string) => string; };
type CommonTagsStringTranform = PickType<CommonTagStyleList, StringTransform> & { none: (s: string) => string; };
type AllDefinedStringTransforms = ColorsStringTranform & CommonTagsStringTranform;


export const COLORS_SAFE = colorsSafe as ColorsStringTranform;
COLORS_SAFE.none = s => s;

export type Styles = Style & {
    [ K in keyof AllDefinedStringTransforms ]: Styles & Style;
};


StyleFactory.build(Object.keys(colorsStyles).concat('none', 'stripColors', 'strip'), COLORS_SAFE);

const commonTagsKeys = Object.keys(new CommonTagStyleList());
StyleFactory.build(commonTagsKeys, Object.fromEntries(commonTagsKeys.map(k => [ k, commonTags[ k ] ])));


export const styles = new StyleFactory() as Styles;
export const colors = styles; // backward compatibility
