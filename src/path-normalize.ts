import { sep } from 'path';

export function pathNormalize(path: string) {
    const split = path.split(/\/|\\/);
    return split.join(sep);
}


/* console.log(pathNormalize('a/b/c') === 'a/b/c');
console.log(pathNormalize('a/b/c/') === 'a/b/c/');
console.log(pathNormalize('a\\b\\c') === 'a/b/c');
console.log(pathNormalize('a\\b\\c\\d\\') === 'a/b/c/d/');
console.log(pathNormalize('a\\b/c\\d/') === 'a/b/c/d/'); */
