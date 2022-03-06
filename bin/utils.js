const process = require('process')
const path = require('path')
const fs = require('fs')


const BASEDIR = process.cwd()


const CONFIGPATH = path.join(BASEDIR, 'scp.config.js')

/** @type {import('../dist/types').Config} */
const DEFAULTCONFIG = {
    source: path.resolve('src'),
    output: path.resolve('src/docs', 'components.json'),
}


/** @type {import('../dist/types').Config} */
function getConfig() {
    let CONFIG = DEFAULTCONFIG

    if(fs.existsSync(CONFIGPATH)){
        const userconfig = require(CONFIGPATH)
        CONFIG = {...DEFAULTCONFIG, ...userconfig.config}
    }

    return CONFIG
}

exports.getConfig = getConfig