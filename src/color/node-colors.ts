import * as colorsSafe from 'colors/safe';
import { ColorsList } from './colors-list';
import { recreateString, KeyType } from './template-string';


export type StringTransform = (arg: string) => string;
export type StyleMode = 'args' | 'full';

export const colors = colorsSafe;

export class Style {
    // private parent: Style;
    protected colors: StringTransform[] = [];
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

    style(colors: StringTransform[], newStyle: Style = undefined): Style {
        const style = newStyle === undefined ? this : newStyle;

        style.colors = [ ...this.colors, ...colors ];
        return style;
    }


    get $() {
        return this.styleTemplate();
    }

    $$(s: string) {
        return this.styleTemplate()`${s}`;
    }

    private styleTemplate() {
        return (strings: TemplateStringsArray, ...keys: KeyType[]) => this.generateTag((s: string) => {
            let newString = s;

            for (const c of this.colors)
                newString = c(newString);

            return newString;
        }, strings, ...keys);
    }

    generateTag(format: (arg: string) => string, strings: TemplateStringsArray, ...keys: KeyType[]) {
        const newKeys: string[] = [];

        for (const key of keys)
            newKeys.push(this.mode === 'args' ? format(key.toString()) : key.toString());


        const recreated = recreateString(strings, ...newKeys);
        return this.mode === 'full' ? format(recreated) : recreated;
    }

}



export type ColorsSafe = {
    [ k in keyof ColorsList ]: ColorsSafe & Style;
};


const chainSymbol = Symbol('StyleList2.chain');

// should be a Singleton
export class Colors extends Style {
    private __kCalled__: string; // debugging

    constructor(first = true) {
        super();

        if (first) {
            for (const [ k, v ] of Object.entries(new ColorsList())) {
                const s = new Colors(false);
                const style = this.style([ colorsSafe[ k ] ], s) as Colors;

                Object.defineProperty(Colors.prototype, k, {
                    // tslint:disable-next-line:object-literal-shorthand
                    get: function () {
                        this._kCalled = k;
                        return style;
                    }
                });
            }
        }
    }
}
