import gulp from 'gulp';
import path from 'path';
import gulpDebug from 'gulp-debug';
import { GulpCache } from '../cache.gulp';

const root = path.join(__dirname, '..');
const fromRoot = (...paths: string[]) => path.join(root, ...paths);
const fromHere = (...paths: string[]) => path.join(__dirname, ...paths);

const cacheFiles = new GulpCache({
    gulpCache: { collectionName: 'test' },
    cacheOptions: { path: fromHere('cache.json') }
});

gulp.src(fromRoot('/**/*'))
    .pipe(cacheFiles.run())
    .pipe(gulpDebug({ title: 'Files:' }));
