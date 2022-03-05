import fs from 'fs';
import path from 'path';
import { SerializedCrawlObject } from './crawler';

export const readDirRecursive:ReadDirRecursive = async (directory) => {
    const dir = await fs.promises.readdir(directory);
    const files = await Promise.all(dir.map(async relativePath => {
        const absolutePath = path.join(directory, relativePath);
        const stat = await fs.promises.lstat(absolutePath);

        return stat.isDirectory() ? readDirRecursive(absolutePath) : absolutePath;
    }));

    return files.flat();
}

interface ReadDirRecursive{
    (directory: string): Promise<string[]>
}

export function saveAsJSON(name:string, crawlList:SerializedCrawlObject[]) {
    return fs.writeFileSync(name, JSON.stringify(crawlList, null, 2));
}