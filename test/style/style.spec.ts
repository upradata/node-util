import { styles, Style, COLORS_SAFE } from '../../src/style';
import { BasicStyleList } from '../../src/style/basic-style-list';

describe('Test suite template string styles', () => {

    it('all basic styles should be initialized', () => {
        for (const k of Object.keys(new BasicStyleList())) {
            expect(styles[ k ]).toBeDefined();
            expect(styles[ k ]).toBeInstanceOf(Style);
            expect(styles[ k ].styleTransforms.length).toEqual(1);
            expect(styles[ k ].styleTransforms[ 0 ].toString()).toEqual(COLORS_SAFE[ k ].toString());
        }
    });


    it('should cumulate styles', () => {
        const s1 = styles.yellow;
        const s2 = s1.blueBG;
        const s3 = s2.blue;
        const s4 = s3.bgCyan;
        const s5 = s4.red;

        expect((s1 as any).styleTransforms.length).toEqual(1);
        expect((s2 as any).styleTransforms.length).toEqual(2);
        expect((s3 as any).styleTransforms.length).toEqual(3);
        expect((s4 as any).styleTransforms.length).toEqual(4);
        expect((s5 as any).styleTransforms.length).toEqual(5);

        expect(styles.red).not.toBe(styles.red.red);
    });


    it('should display the good color', () => {

        const y = styles.yellow;

        expect(y.bgBlue.$`PIPI est bon`).toBe('[44m[33mPIPI est bon[39m[49m');
        expect(y.bgMagenta.$`PIPI est bon`).toBe('[45m[33mPIPI est bon[39m[49m');
        expect(y.bgBlue.$`PIPI est bon`).toBe('[44m[33mPIPI est bon[39m[49m');

        expect(styles.red.$`caca est bon`).toBe('[31mcaca est bon[39m');

        expect(`caca ${styles.red.$`de merde`} est ${styles.yellow.$`yellow`} bon`).toBe('caca [31mde merde[39m est [33myellow[39m bon');
        expect(styles.red.args.$`caca ${11} est ${22} bon`).toBe('caca [31m11[39m est [31m22[39m bon');
        expect(styles.red.$`caca ${styles.yellow.$`YELLOW`} est ${styles.blue.bgWhite.$`SURPRISE`} bon`)
            .toBe('[31mcaca [33mYELLOW[31m est [47m[34mSURPRISE[31m[49m bon[39m');

        const s = new Style();
        const stylish = s.add([ COLORS_SAFE.red, COLORS_SAFE.bold, COLORS_SAFE.bgWhite ]).$;
        expect(stylish`caca est bon`).toBe('[47m[1m[31mcaca est bon[39m[22m[49m');

        expect(styles.yellow.bold.bgWhite.$`caca est bon2`).toBe('[47m[1m[33mcaca est bon2[39m[22m[49m');

        const highlightArgs = styles.bold.yellow.args.$;
        expect(highlightArgs`Attention l'${'argument'} est ${'highlited'} :)))`).toBe(`Attention l'[33m[1margument[22m[39m est [33m[1mhighlited[22m[39m :)))`);

        const caca = 'red';
        const bon = 'yellow';
        expect(`caca ${styles.red.$`${caca}`} est ${styles.yellow.$`${bon}`} bon`).toBe('caca [31mred[39m est [33myellow[39m bon');
        const same = 'red';
        expect(styles.red.args.$`caca ${same} est ${same} bon`).toBe('caca [31mred[39m est [31mred[39m bon');


        expect(styles.red.$$('As a function')).toBe('[31mAs a function[39m');
    });
});
