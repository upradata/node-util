import glob from 'glob';
import path from 'path';
import { Cache } from '../cache';


const cache = new Cache({ path: './cache-dir/cache.json' });

const cacheName = 'collection1';
cache.createCollectionIfNotExist(cacheName);

const root = path.join(__dirname, '..');

const allFiles = glob.sync('**/*', { cwd: root }).map(file => path.join(root, file));

console.log(cache.changedFiles(cacheName));

cache.addOrUpdateFile('collection-default', ...allFiles);
cache.addOrUpdateFile(cacheName, ...allFiles);
cache.save();
