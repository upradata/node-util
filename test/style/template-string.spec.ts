import { recreateString } from '../../src/style/template-string';

describe('Test Suite For Template String Functions', () => {

    it('should reconstruct template string', () => {

        expect(recreateString`thomas est beau`).toBe('thomas est beau');
        expect(recreateString`thomas ${1} est ${2} beau`).toBe('thomas 1 est 2 beau');
        expect(recreateString`${0} thomas ${1} est ${2} beau`).toBe('0 thomas 1 est 2 beau');
        expect(recreateString`thomas ${1} est ${2} beau ${3}`).toBe('thomas 1 est 2 beau 3');
        expect(recreateString`${0} thomas ${1} est ${2} beau ${3}`).toBe('0 thomas 1 est 2 beau 3');
        expect(recreateString`${0} thomas ${1}${2}${3} est ${4} beau ${5}`).toBe('0 thomas 123 est 4 beau 5');
    });
});
