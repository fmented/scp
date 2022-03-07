const {getConfig} = require('./utils')
const {default : crawl} = require('../dist')

const IS_WATCHING = process.argv.includes('--watch')

const {source, output, ignore, format} = getConfig()

function watch_crawl() {

    try {
        const watch = require('watch')
        watch.createMonitor(source, (monitor) => {
            monitor.on('created', () => {
                crawl(source, {ignore, format, output, silent: true})
            })
            monitor.on('changed', () => {
                crawl(source, {ignore, format, output, silent: true})
            })
            monitor.on('removed', () => {
                crawl(source, {ignore, format, output, silent: true})
            })
        })
        
    } catch {
        console.warn(`Cannot find watch module. run 'npm i watch' and try again`)
    }
    
}

IS_WATCHING? watch_crawl() : crawl(source, {ignore, format, output})
