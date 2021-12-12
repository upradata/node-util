export const camelcase = (str: string, separator: RegExp | string = /[-.]/) => {
    return str.split(separator).reduce((s, word) => {
        return s + word[ 0 ].toUpperCase() + word.slice(1);
    });
};
