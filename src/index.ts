import { Parser} from "./parser";
import {readDirRecursive, saveAsJSON} from './fileHandler'
import path from 'path'
import fs from 'fs'
import { ComponentInfo, CrawlOption } from "./types";



async function getInfo(dir:string, options:undefined): Promise<void>
async function getInfo(dir:string, options:{}): Promise<void>
async function getInfo(dir:string, options:{return: false}):Promise<void>
async function getInfo(dir:string, options:{return: true}):Promise<ComponentInfo[]>
async function getInfo(dir:string, options:CrawlOption): Promise<void|ComponentInfo[]>
async function getInfo(dir:string, option?:CrawlOption):Promise<ComponentInfo[]|void>{
  const output = option?.output || path.resolve(dir, 'docs','components.json');
  const ignore = option?.ignore || (()=>false);
  const shouldReturn = option?.return || false;

  const fileList:string[] = (await readDirRecursive(dir)).filter((file)=>file.endsWith('.svelte')&&!ignore(path.basename(file)));
  
  const crawlList:ComponentInfo[] = fileList.map((file)=>{
    const template = fs.readFileSync(file, 'utf8');    
    const c = new Parser(template, option?.silent||false);
    const name = path.basename(file).replace('.svelte', '')
    return {
      name,
      path: file,
      props: c.props,
      slots: c.slots,
      events: c.events,
      componentMethods: c.componentMethods,
      componentExports: c.componentExports,
      moduleMethods: c.moduleMethods,
      moduleExports: c.moduleExports,
    }
  })

  return !shouldReturn ? saveAsJSON(output, option?.format ? crawlList.map(option.format): crawlList) : crawlList;	
}

export default getInfo

export { Parser }