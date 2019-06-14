export type KeyType = { toString(): string };

export function recreateString(strings: TemplateStringsArray, ...keys: KeyType[]) {
    const parameters = keys;

    if (keys[keys.length - 1] !== '') {
        // we are not in the case `bla bla bla${0}` ==> ${abc} at the end
        parameters.push('');
    }

    let res = '';

    for (let i = 0; i < strings.length; ++i) {
        res += strings[i] + parameters[i];
    }

    return res;
}
