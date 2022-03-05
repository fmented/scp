import fs from 'fs';
import path from 'path';

export const readDirRecursive:ReadDirRecursive = async (filePath) => {
    const dir = await fs.promises.readdir(filePath);
    const files = await Promise.all(dir.map(async relativePath => {
        const absolutePath = path.join(filePath, relativePath);
        const stat = await fs.promises.lstat(absolutePath);

        return stat.isDirectory() ? readDirRecursive(absolutePath) : absolutePath;
    }));

    return files.flat();
}

interface ReadDirRecursive{
    (filePath: string): Promise<string[]>
}

export function saveAsJSON(name:string, crawlList:object[]) {
    return fs.writeFileSync(name, JSON.stringify(crawlList, null, 2));
}