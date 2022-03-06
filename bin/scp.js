const {getConfig} = require('./utils')
const {default : crawl} = require('../dist')
const watch = require('watch')

const IS_WATCHING = process.argv.includes('--watch')

const {source, output, ignore, format} = getConfig()

function watch_crawl() {
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
}

IS_WATCHING? watch_crawl() : crawl(source, {ignore, format, output})
