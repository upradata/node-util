import path from 'path';
import {
    fromCwd,
    fromCwdIfRel,
    fromDir,
    fromDirIfRel,
    fromRoot,
    fromRootIfRel,
    root
} from '../src/find-up';


describe('check if all find-up and helpers work', () => {
    const rootProject = path.resolve(__dirname, '..');
    const relative = 'a/b/c';
    const relative2 = './c/d/e';
    const absolute = '/a/b/c';
    const absolute2 = '/c/d/e';


    it('should be the root folder where there is the first package.json from here', () => {
        expect(root()).toBe(rootProject);
    });


    it('should be the path from root where there is the first package.json from here', () => {
        expect(fromRoot(relative, relative2)).toBe(path.join(rootProject, relative, relative2));
        expect(fromRoot(relative2, relative)).toBe(path.join(rootProject, relative2, relative));
        expect(fromRoot(absolute, absolute2)).toBe(path.join(rootProject, absolute, absolute2));
    });


    it('should be the path from root where there is the first package.json from here', () => {
        expect(fromRootIfRel(relative, relative2)).toBe(path.join(rootProject, relative, relative2));
        expect(fromRootIfRel(relative2, relative)).toBe(path.join(rootProject, relative2, relative));
        expect(fromRootIfRel(absolute, absolute2)).toBe(path.join(absolute, absolute2));
    });


    it('should be the path from process.cwd()', () => {
        expect(fromCwd(relative, relative2)).toBe(path.join(process.cwd(), relative, relative2));
        expect(fromCwd(relative2, relative)).toBe(path.join(process.cwd(), relative2, relative));
        expect(fromCwd(absolute, absolute2)).toBe(path.join(process.cwd(), absolute, absolute2));
    });


    it('should be the path from process.cwd() if relative', () => {
        expect(fromCwdIfRel(relative, relative2)).toBe(path.join(process.cwd(), relative, relative2));
        expect(fromCwdIfRel(relative2, relative)).toBe(path.join(process.cwd(), relative2, relative));
        expect(fromCwdIfRel(absolute, absolute2)).toBe(path.join(absolute, absolute2));
    });


    it('should be the path from the directory specified', () => {
        expect(fromDir(relative)(relative2, relative)).toBe(path.join(relative, relative2, relative));
        expect(fromDir(absolute)(relative, relative2)).toBe(path.join(absolute, relative, relative2));
        expect(fromDir(relative)(absolute, absolute2)).toBe(path.join(relative, absolute, absolute2));
        expect(fromDir(absolute)(absolute2, relative)).toBe(path.join(absolute, absolute2, relative));
        expect(fromDir(absolute)(relative, absolute2)).toBe(path.join(absolute, relative, absolute2));
    });


    it('should be the path from the directory specified if relative', () => {
        expect(fromDirIfRel(relative)(relative2, relative)).toBe(path.join(relative, relative2, relative));
        expect(fromDirIfRel(absolute)(relative, relative2)).toBe(path.join(absolute, relative, relative2));
        expect(fromDirIfRel(relative)(absolute, absolute2)).toBe(path.join(absolute, absolute2));
        expect(fromDirIfRel(absolute)(absolute2, relative)).toBe(path.join(absolute2, relative));
        expect(fromDirIfRel(absolute)(relative, absolute2)).toBe(path.join(absolute, relative, absolute2));
    });

});
