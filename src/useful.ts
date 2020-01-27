import findUp from 'find-up';
import path from 'path';

export const findUpDir = (file: string) => findUp.sync(directory => {
    const hasPackageJson = findUp.sync.exists(path.join(directory, file));
    return hasPackageJson && directory;
}, { type: 'directory' });


export const root = findUpDir('package.json');
export const fromRoot = (...paths: string[]) => path.join(root, ...paths);
