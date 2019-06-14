import { ColorsList } from './colors-list';
import { recreateString, KeyType } from './template-string';

export const Colors = {};

for (const [k, v] of Object.entries(new ColorsList())) {
    Colors[k] = (strings: TemplateStringsArray, ...keys: KeyType[]) => recreateString(strings, ...keys);
}

(Colors as any).highlightArgs = (strings: TemplateStringsArray, ...keys: KeyType[]) => recreateString(strings, ...keys);
