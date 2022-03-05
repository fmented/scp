import {pattern} from '../../src/crawler'

const justScript = `
<script>
//code
</script>
`

const justScriptWithLang = `
<script lang="ts">
//code
</script>
`

const justModule = `
<script context="module">
//code
</script>
`

const justModuleWithLang = `
<script lang="ts" context="module">
//code
</script>
`
const justModuleWithLang2 = `
<script context="module" lang="ts">
//code
</script>
`

const both = `
<script context="module">
//code
</script>
<script>
//code
</script>
`

const both2 = `
<script>
//code
</script>
<script context="module">
//code
</script>
`

const bothWithScriptLang = `
<script lang="ts">
//code
</script>
<script context="module">
//code
</script>
`

const bothWithLang = `
<script lang="ts">
//code
</script>
<script context="module" lang="ts">
//code
</script>
`

function match(s:string, pattern:RegExp[]) {
    let total = []
    for (let i=0; i<pattern.length; i++) {
        const match = s.match(pattern[i])
        if(match && match.length>1){
            total.push(match[1].replace(/\s/g, ''))
        }
    }
    return total.join('')
}



describe("Try to find module and script", ()=>{
    it("try to match, certain pattern", ()=>{
        expect(match(justScript, [pattern.script]))
        .toBe('//code')

        expect(match(justModule, [pattern.module]))
        .toBe('//code')

        expect(match(justScriptWithLang, [pattern.script]))
        .toBe('//code')

        expect(match(justModuleWithLang, [pattern.module]))
        .toBe('//code')

        expect(match(justModuleWithLang2, [pattern.module]))
        .toBe('//code')

        expect(match(both, [pattern.script, pattern.module]))
        .toBe('//code//code')

        expect(match(both2, [pattern.script, pattern.module]))
        .toBe('//code//code')

        expect(match(bothWithLang, [pattern.script, pattern.module]))
        .toBe('//code//code')

        expect(match(bothWithScriptLang, [pattern.script, pattern.module]))
        .toBe('//code//code')
    })
})