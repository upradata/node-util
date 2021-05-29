import fs from 'fs-extra';
import path from 'path';


export const absolutePath = async (options: { filename: string; dir: string; }) => {
    const { filename: filename, dir } = options;

    await fs.ensureDir(dir);

    if (path.isAbsolute(filename))
        return filename;

    return path.join(dir, filename);
};
