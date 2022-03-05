const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');

const content = fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));