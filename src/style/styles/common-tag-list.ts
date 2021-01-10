export class CommonTagStyleList<T = any> {
    html: T = undefined;

    /**
     * alias for `html`
     */
    codeBlock: T = undefined;

    /**
     * alias for `html`
     */
    source: T = undefined;

    /**
     * A tag very similar to `html` but it does safe HTML escaping for strings coming from substitutions.
     * When combined with regular `html` tag, you can do basic HTML templating that is safe from
     * XSS (Cross-Site Scripting) attacks.
     */
    safeHtml: T = undefined;

    /**
     * Allows you to keep your single-line strings under 80 characters without resorting to crazy string concatenation.
     */
    oneLine: T = undefined;

    /**
     * Allows you to keep your single-line strings under 80 characters while trimming the new lines.
     */
    oneLineTrim: T = undefined;

    /**
     * If you want to strip the initial indentation from the beginning of each line in a multiline string.
     * Important note: this tag will not indent multiline strings coming from the substitutions.
     * If you want that behavior, use the `html` tag (aliases: `source`, `codeBlock`).
     */
    stripIndent: T = undefined;

    /**
     * If you want to strip *all* of the indentation from the beginning of each line in a multiline string.
     */
    stripIndents: T = undefined;

    /**
     * Allows you to inline an array substitution as a list.
     */
    inlineLists: T = undefined;

    /**
     * Allows you to inline an array substitution as a list, rendered out on a single line.
     */
    oneLineInlineLists: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list.
     */
    commaLists: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list, the last of which is preceded by the word "or".
     */
    commaListsOr: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list, the last of which is preceded by the word "and".
     */
    commaListsAnd: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list, and is rendered out on to a single line.
     */
    oneLineCommaLists: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list, the last of which is preceded by the word "or", and is rendered out on to a single line.
     */
    oneLineCommaListsOr: T = undefined;

    /**
     * Allows you to inline an array substitution as a comma-separated list, the last of which is preceded by the word "and", and is rendered out on to a single line.
     */
    oneLineCommaListsAnd: T = undefined;
}
