

// const styleList = (colorsSafe as any).styles as { [k: string]: { open: string; close: string; closeRe: RegExp } };
// Object.keys(require('colorsSafe').styles) gives the following (we are obliged to get the strings at compile time for the TypeScript Type)

export class ColorsStyle<T = any> {
    none: T = undefined;
    reset: T = undefined;
    bold: T = undefined;
    dim: T = undefined;
    italic: T = undefined;
    underline: T = undefined;
    inverse: T = undefined;
    hidden: T = undefined;
    strikethrough: T = undefined;
    black: T = undefined;
    red: T = undefined;
    green: T = undefined;
    yellow: T = undefined;
    blue: T = undefined;
    magenta: T = undefined;
    cyan: T = undefined;
    white: T = undefined;
    gray: T = undefined;
    grey: T = undefined;
    bgBlack: T = undefined;
    bgRed: T = undefined;
    bgGreen: T = undefined;
    bgYellow: T = undefined;
    bgBlue: T = undefined;
    bgMagenta: T = undefined;
    bgCyan: T = undefined;
    bgWhite: T = undefined;
    blackBG: T = undefined;
    redBG: T = undefined;
    greenBG: T = undefined;
    yellowBG: T = undefined;
    blueBG: T = undefined;
    magentaBG: T = undefined;
    cyanBG: T = undefined;
    whiteBG: T = undefined;
}
