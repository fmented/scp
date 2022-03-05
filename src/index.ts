import { Crawler } from "./crawler";
import {readDirRecursive, saveAsJSON} from './fileHandler'

interface CrawlOption{
  //relative path to current dir
  output?: string,
  ignore?: (file:string)=>boolean,
}

export default async function (dir:string, option?:CrawlOption) {
  const output = option?.output || 'output.json';
  const ignore = option?.ignore || (()=>false);
  const fileList = (await readDirRecursive(dir)).filter(file=>file.endsWith('.svelte')&&!ignore(file));
  const crawlList = fileList.map(file=>{
    const c = new Crawler(file);

    return {
      name: file.replace('.svelte', ''),
      props: c.props,
      slots: c.slots,
      events: c.events,
      componentMethods: c.componentMethods,
      componentExports: c.componentExports,
      moduleMethods: c.moduleMethods,
      moduleExports: c.moduleExports,
    };

  })

  return saveAsJSON(output, crawlList);
}