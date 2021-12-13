import { StatFiles } from './stat.files';
import { Stats } from './stats';


const stats = new Stats('Stats Test', StatFiles);

const all = [ 'a.txt', 'b.txt', 'c.txt', 'd.txt' ];

const stat1 = stats.create('A-collection1', 'A-sub-collection1-1');

stat1.addBeforeCache(...all);
stat1.addToBeProcessed(...all);
stat1.succeed(...all.slice(0, 1));
stat1.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));

const stat2 = stats.create('A-collection1', 'B-sub-collection1-2');

stat2.addBeforeCache(...all);
stat2.addToBeProcessed(...all);
stat2.succeed(...all.slice(0, 1));
stat2.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));

const stat3 = stats.create('B-collection2', 'A-sub-collection', 'A-sub-sub-collection');

stat3.addBeforeCache(...all);
stat3.addToBeProcessed(...all);
stat3.succeed(...all.slice(0, 1));
stat3.fail(...all.slice(1).map(file => ({ file, reason: `J'en sais rien` })));


stats.log();
stats.log('B-collection2', 'A-sub-collection');


stats.log([], {
    sort: {
        collections: colls => colls.sort((c1, c2) => c1.collectionName.localeCompare(c2.collectionName) * -1),
        stats: stats => stats.sort((s1, s2) => {
            console.log(s1.name, s2.name);
            return s1.name.localeCompare(s2.name) * -1;
        })
    }
});
