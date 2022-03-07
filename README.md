# Intro
scp stands for ~~Secure Contain Protect~~ Svelte Component Parser
it can analyze .svelte file and give necessary information for documentation such as
- props
- slots
- events
- component methods
- module methods
- component exports
- module exports

<br> 

# Instalation

```bash
npm i -D @fmented/scp
```

to install it globally 

```bash
npm i @fmented/scp -g
```

<br>

# CLI

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

        //if you need S̶p̶e̶c̶i̶a̶l̶ ̶C̶o̶n̶t̶a̶i̶n̶m̶e̶n̶t̶ ̶P̶r̶o̶c̶e̶d̶u̶r̶e̶s̶  specific formatting 
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

> __⚠ you need to have watch package to be installed__

> __⚠ be aware, when you do this, scp will ignore any error that occurs during parsing__

<br>

# Javascipt 

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

//output and format will be ignored if return is set to true
const data = await scp('src/components', {
  return:true,

  //will be ignored
  format:data=>({slots:data.slots}),
  output:'out.json'
  })

```

<br>

# TODO
- [ ] better type system
- [ ] better error handling
- [ ] better way to parse events
- [ ] ability to parse component that uses preprocessor, eg. pub

<br>

### Output Example With Default Formatting
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