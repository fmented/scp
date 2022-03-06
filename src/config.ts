import { CrawlOption } from "./index";

export type Config = Omit<Omit<CrawlOption, 'silent'>, 'return'> & {source?: string}
