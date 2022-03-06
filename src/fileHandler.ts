import fs from 'fs';
import path from 'path';
import { ComponentInfo } from './parser';

export const readDirRecursive:ReadDirRecursive = async (directory) => {
    const dir = await fs.promises.readdir(path.resolve(directory));
    const files = await Promise.all(dir.map(async relativePath => {
        const absolutePath = path.resolve(directory, relativePath);
        const stat = await fs.promises.lstat(absolutePath);

        return stat.isDirectory() ? readDirRecursive(absolutePath) : absolutePath;
    }));

    return files.flat();
}

interface ReadDirRecursive{
    (directory: string): Promise<Array<string>>
}

export function saveAsJSON(name:string, crawlList:ComponentInfo[]|object[]) {
    if(!fs.existsSync(path.dirname(name))) {
        fs.mkdirSync(path.dirname(name), {recursive: true});
    }
    return fs.writeFileSync(name, JSON.stringify(crawlList, null, 2));
}