export type ToString = { toString(): string; };

export function recreateString(strings: TemplateStringsArray, ...keys: ToString[]) {
    const parameters = [ ...keys, '' ];

    let res = '';

    for (let i = 0; i < strings.length; ++i) {
        res += strings[ i ] + parameters[ i ];
    }

    return res;
}
