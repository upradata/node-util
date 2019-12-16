import { Cache } from './cache';
import glob from 'glob';
import path from 'path';

const cache = new Cache({ path: './cache-dir/cache.json' });

const cacheName = 'collection1';
cache.createCollectionIfNotExist(cacheName);

const allFiles = glob.sync('*', { cwd: __dirname }).map(file => path.join(__dirname, file));

console.log(cache.changedFiles(cacheName));

cache.addOrUpdateFile('collection-default', ...allFiles);
cache.addOrUpdateFile(cacheName, ...allFiles);
cache.save();
