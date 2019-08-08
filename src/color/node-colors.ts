import * as colorsSafe from 'colors/safe';
import { BasicStyleList } from './colors-list';
import { recreateString, KeyType } from './template-string';


export type StringTransform = (arg: string) => string;
export type StyleMode = 'args' | 'full';

export const COLORS_SAFE = colorsSafe as typeof colorsSafe & { none: (s: string) => string };
COLORS_SAFE.none = s => s;
export type StyleTemplate = (strings: TemplateStringsArray, ...keys: KeyType[]) => string;


export class Style {
    // private parent: Style;
    protected styleTransforms: StringTransform[] = [];
    protected mode: StyleMode = 'full';

    get args() {
        this.mode = 'args';
        return this;
    }

    get full() {
        this.mode = 'full';
        return this;
    }


    constructor() { }

    style(styleTransforms: StringTransform[], newStyle: Style = undefined): Style {
        const style = newStyle === undefined ? this : newStyle;

        style.styleTransforms = [ ...this.styleTransforms, ...styleTransforms ];
        return style;
    }


    get $() {
        return this.styleTemplate();
    }

    $$(s: string) {
        return this.styleTemplate()`${s}`;
    }

    private styleTemplate(): StyleTemplate {
        return (strings: TemplateStringsArray, ...keys: KeyType[]) => this.generateTag((s: string) => {
            let newString = s;

            for (const c of this.styleTransforms)
                newString = c(newString);

            return newString;
        }, strings, ...keys);
    }

    private generateTag(format: (arg: string) => string, strings: TemplateStringsArray, ...keys: KeyType[]) {
        const newKeys: string[] = [];

        for (const key of keys)
            newKeys.push(this.mode === 'args' ? format(key.toString()) : key.toString());


        const recreated = recreateString(strings, ...newKeys);
        return this.mode === 'full' ? format(recreated) : recreated;
    }

}


class StyleList extends Style {
    static init() {
        for (const k of Object.keys(new BasicStyleList())) {

            Object.defineProperty(StyleList.prototype, k, {
                // tslint:disable-next-line:object-literal-shorthand
                get: function () {
                    return this.style([ COLORS_SAFE[ k ] ], new StyleList());
                }
            });
        }
    }
}

StyleList.init();

export type BasicStyleListRecursive = {
    [ K in keyof BasicStyleList ]: BasicStyleListRecursive & Style;
};

export const styles = new StyleList() as unknown as BasicStyleListRecursive;



// backward compatible

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof BasicStyleList ]: ColorType;
};

export const colors = styles; 
