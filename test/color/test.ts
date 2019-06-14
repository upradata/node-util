import { Colors, ColorsSafe, Style, colors as colorsSafe } from '../../src/color';

const colors = new Colors() as any as ColorsSafe;
const r = colors.white;

console.log(r.bgBlue.$`PIPI est bon`);
console.log(r.bgMagenta.$`PIPI est bon`);
console.log(r.bgBlue.$`PIPI est bon`);

console.log(colors.red.$`caca est bon`);

// console.log(StyleList2.redArgs`caca ${111} est bon`);
console.log(`caca ${colors.red.$`egege`} est ${colors.yellow.$`yellow`} bon`);
console.log(colors.red.args.$`caca ${11} est ${22} bon`);
console.log(colors.red.$`caca ${colors.yellow.$`YELLOW`} est ${colors.blue.bgWhite.$`SURPRISE`} bon`);

const style = new Style();
const f = style.style([ colorsSafe.red, colorsSafe.bold, colorsSafe.bgWhite ]).$;
console.log(f`caca est bon`);

console.log(colors.yellow.bold.bgWhite.$`caca est bon2`);

// export
const highlightArgs = colors.bold.yellow.args.$;
console.log(highlightArgs`Attention l'${'argument'} est ${'highlited'} :)))`);

const caca = 'red';
const bon = 'yellow';
console.log(`caca ${colors.red.$`${caca}`} est ${colors.yellow.$`${bon}`} bon`);
const same = 'red';
console.log(colors.red.args.$`caca ${same} est ${same} bon`);


console.log(colors.red.$$('As a function'));
