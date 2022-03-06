export interface SerializedCrawlObject{
    slots: Slot[]
    events: string[]
    props: Prop[]
    componentExports: string[]
    moduleExports: string[]
    moduleMethods: Method[]
    componentMethods: Method[]
}

export interface ComponentInfo extends SerializedCrawlObject{
    name: string,
    path: string,
}

export interface Slot {
    name: string;
    data: string[];
}

export interface Prop {
    name: string;
    type: string;
    default: any;
}

export type Param = Prop

export interface Method {
    name: string;
    params: Param[];
}

export interface Config {
    source?: string
    output?: string,
    ignore?: (file:string)=>boolean,
    format?: (info:ComponentInfo)=>object
}

export interface CrawlOption extends Omit<Config, 'source'>{
    return?: boolean,
    silent?: boolean
}

export interface ReadDirRecursive{
    (directory: string): Promise<Array<string>>
}