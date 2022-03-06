# Intro
scp stands for Svelte Component Parser
it can analyze .svelte file and gives necessary information for documentation such as
- props
- slots
- events
- component methods
- module methods
- component exports
- module exports

# Instalation

```bash
npm i -D @fmented/scp
```

to install it globally 

```bash
npm i @fmented/scp -g
```

## CLI
<hr/>

create <mark>scp.config.js</mark> in your project root 

```javascript
/** @type {import('@fmented/scp/types').Config} */
    const config = {
        //directory to scan. relative to project root
        source: 'src/lib',

        //this is pretty self-explanatory. relative to project root
        output: 'src/docs/components.json',

        //if you want to skip specific file
        ignore: (file)=>file=='ThisComponent.svelte',

        //if you need specific formatting 
        format: (info)=>({slots:info.slots})
    }   

    exports.config = config
    //this config is optional
```

if the setup is done run

```bash
scpd
```

or to watch every changes, run

```bash
scpd --watch
```

> __⚠ be aware, when you do this, scp will ignore any error that occurs during parsing__

## Javascipt 
<hr/>

```javascript
import scp from '@fmented/scp'

scp('src/components', {output:'output.json'})
```

if you need to get the info as array of object

```javascript
import scp from '@fmented/scp'

//await must run inside async function
const data = await scp('src/components', {return:true})

//or 
scp('src/components', {return:true}).then(arr=>{
    arr.forEach(data=>{
        console.log(data)
    })
})
```

### Default Output Format
<hr/>

```json
[
   {
    "name": "Steps",
    "path": "D:\\scp\\local\\test\\Steps.svelte",
    "props": [
      {
        "name": "height",
        "type": "string",
        "default": "max-content"
      },
      {
        "name": "grow",
        "type": "boolean",
        "default": true
      },
      {
        "name": "active",
        "type": "number",
        "default": "0"
      }
    ],
    "slots": [
      {
        "name": "menu",
        "data": [
          "active",
          "display"
        ]
      },
      {
        "name": "default",
        "data": [
          "Step",
          "index",
          "lastStep"
        ]
      },
      {
        "name": "action",
        "data": [
          "next",
          "prev"
        ]
      }
    ],
    "events": [
      "finished"
    ],
    "componentMethods": [
      {
        "name": "nextStep",
        "params": []
      },
      {
        "name": "prevStep",
        "params": []
      },
      {
        "name": "next",
        "params": []
      },
      {
        "name": "prev",
        "params": []
      }
    ],
    "componentExports": [
      "index",
      "lastStep"
    ],
    "moduleMethods": [],
    "moduleExports": []
  },
  {
    "name": "ThemeManager",
    "path": "D:\\scp\\local\\test\\ThemeManager.svelte",
    "props": [
      {
        "name": "themes",
        "type": "Themes"
      },
      {
        "name": "sizes",
        "type": "Size"
      },
      {
        "name": "lightRatio",
        "type": "any",
        "default": "5"
      }
    ],
    "slots": [
      {
        "name": "default",
        "data": []
      }
    ],
    "events": [],
    "componentMethods": [],
    "componentExports": [],
    "moduleMethods": [
      {
        "name": "setTheme",
        "params": [
          {
            "name": "th",
            "type": "string"
          }
        ]
      },
      {
        "name": "switchTheme",
        "params": []
      }
    ],
    "moduleExports": []
  }
]
```

# TODO
- [ ] better type system
- [ ] better error handling
- [ ] ability to parse component that uses preprocessor, eg. pub

