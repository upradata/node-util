// import { ColorsSafe } from './node-colors';
import { KeyType } from './template-string';

/* declare const document: any;
declare const window: any;
document !== undefined && window !== undefined */

declare const ENVIRONMENT: string; // webpack DefinePlugin

type ColorsSafe = any;

export const colors: ColorsSafe = require('./$environment$-colors');
/* export let colors = {} as ColorsSafe;

if (ENVIRONMENT === 'browser')
    colors = require('./node-colors');
else
    colors = require('./browser-colors');;

 */
export const highlightArgs: (strings: TemplateStringsArray, ...keys: KeyType[]) => string = (colors as any).highlightArgs;
