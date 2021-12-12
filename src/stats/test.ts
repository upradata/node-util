import { StatFiles } from './stat.files';
import { Stats } from './stats';


const stats = new Stats('Stats Test', StatFiles);

const all = [ 'a.txt', 'b.txt', 'c.txt', 'd.txt' ];

const stat1 = stats.create('collection1', 'sub-collection1-1');

stat1.addBeforeCache(...all);
stat1.addToBeProcessed(...all);
stat1.succeed(...all.slice(0, 1));
stat1.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));

const stat2 = stats.create('collection1', 'sub-collection1-2');

stat2.addBeforeCache(...all);
stat2.addToBeProcessed(...all);
stat2.succeed(...all.slice(0, 1));
stat2.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));

const stat3 = stats.create('collection2', 'sub-collection', 'sub-sub-collection');

stat3.addBeforeCache(...all);
stat3.addToBeProcessed(...all);
stat3.succeed(...all.slice(0, 1));
stat3.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));


stats.log();
