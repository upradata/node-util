import { BasicStyleList } from './styles/basic-style-list';
import { recreateString, KeyType } from './template-string';
import { isNil } from '@upradata/util';


export type StringTransform = (arg: string) => string;
export type StyleMode = 'args' | 'full';


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

    add(styleTransforms: StringTransform[], newStyle: Style = undefined): Style {
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

        for (const key of keys) {
            const k = isNil(key) ? '' : key;
            newKeys.push(this.mode === 'args' ? format(k.toString()) : k.toString());
        }


        const recreated = recreateString(strings, ...newKeys);
        return this.mode === 'full' ? format(recreated) : recreated;
    }

}



// backward compatible

export type ColorType = ColorsSafe & Style;

export type ColorsSafe = {
    [ k in keyof BasicStyleList ]: ColorType;
};
