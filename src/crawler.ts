import { parse } from "svelte/compiler";
import { Ast, TemplateNode, Element } from 'svelte/types/compiler/interfaces';
import ts from 'typescript';

const modulePattern = /<script.*?context\s*?=\s*?["|'|`]?module["|'|`]?.*?>([\s\S]*?)<\/script>/;
const scriptPattern = /<script(?![^>]+context).*?>([\s\S]*?)<\/script>/;

export const pattern = {
    script: scriptPattern,
    module: modulePattern
}

interface Slot {
    name: string;
    data: string[];
}

interface Prop {
    name: string;
    type: string;
    default: any;
}

interface Param extends Prop { }

interface Method {
    name: string;
    params: Param[];
}

export interface SerializedCrawlObject{
    slots: Slot[]
    events: string[]
    props: Prop[]
    componentExports: string[]
    moduleExports: string[]
    moduleMethods: Method[]
    componentMethods: Method[]
}
export class Crawler implements SerializedCrawlObject{
    slots: Slot[]
    events: string[]
    props: Prop[]
    private templateAST?: Ast
    template: string
    componentExports: string[]
    moduleExports: string[]
    moduleMethods: Method[]
    componentMethods: Method[]
    private transpiledTemplate: string
    private moduleAST?: ts.SourceFile
    private scriptAST?: ts.SourceFile
    hasModule: boolean
    hasScript: boolean
    module?: string
    moduleOuter?: string
    script?: string
    scriptOuter?: string

    constructor(template: string) {

        this.template = template;

        this.slots = []
        this.events = []
        this.props = []

        this.componentExports = []
        this.moduleExports = []

        this.componentMethods = []
        this.moduleMethods = []


        this.transpiledTemplate = ''

        this.templateAST = undefined

        this.moduleAST = undefined

        this.scriptAST = undefined

        this.hasModule = false
        this.hasScript = false



        const matchModule = modulePattern.exec(template);
        const matchScript = scriptPattern.exec(template);

        if (matchModule) {
            this.module = matchModule[1];
            this.moduleOuter = matchModule[0];
            this.hasModule = true;
        }

        if (matchScript) {
            this.script = matchScript[1];
            this.scriptOuter = matchScript[0];
            this.hasScript = true;
        }

        this.parse();
    }

    private transpile() {
        let transpiledModule;
        let transpiledScript;
        if (this.hasModule && this.module) {
            transpiledModule = ts.transpile(this.module, {
                module: ts.ModuleKind.ESNext,
                strict: false,
                target: ts.ScriptTarget.ESNext,
            });
        }

        if (this.hasScript && this.script) {
            transpiledScript = ts.transpile(this.script, {
                module: ts.ModuleKind.ESNext,
                strict: false,
                target: ts.ScriptTarget.ESNext,
            });
        }

        return {
            module: transpiledModule,
            script: transpiledScript,
        };
    }

    private prepareTemplateParse() {
        const transpiled = this.transpile();
        let copy = this.template;
        if (this.hasModule && this.module && transpiled.module) {
            copy = copy.replace(this.module, transpiled.module);
        }
        if (this.hasScript && this.script && transpiled.script) {
            copy = copy.replace(this.script, transpiled.script);
        }
        this.transpiledTemplate = copy;
    }

    private getSlot() {
        if (!this.templateAST) {
            this.parseTemplate();
        }
        const self = this;
        function findSlotRecrusively(node: TemplateNode) {
            node.a
            if (node.type == 'Slot') {
                const name = (node as Element).attributes
                    .filter((attr) => attr.name == 'name')[0]?.value[0]?.data
                const data = (node as Element).attributes
                    .filter((attr) => attr.name != 'name')
                    .map((attr) => (attr.name));
                self.slots.push({ name: name ? name : 'default', data });
            }
            if (node.children && node.children.length && node.type != 'Text') {
                node.children.forEach(child => {
                    findSlotRecrusively(child);
                })
            }

        }

        if (this.templateAST) {
            findSlotRecrusively(this.templateAST.html);
        }
    }

    private getEvent() {
        if (!this.templateAST) {
            this.parseTemplate();
        }
        const self = this;

        function findEvent(node: any) {
            if (node.type == 'VariableDeclaration' && node.declarations.length && node.declarations[0].init) {
                if (checkIfEventDispatcher(node.declarations[0].init)) {
                    const instance = node.declarations[0].id.name
                    const regex = new RegExp(`${instance}\\(([\\S]*?)[,|\\)]`, 'g');
                    const match = self.template.matchAll(regex)
                    for (const m of match) {
                        self.events.push(m[1].replace(/['|"|`]/g, ''));
                    }
                };
            }
        }

        function checkIfEventDispatcher(d: any): boolean {
            if (d.type == 'CallExpression' && d?.callee?.name == 'createEventDispatcher') {
                return true;
            }
            return false;
        }

        if (this.templateAST?.instance) {
            this.templateAST.instance.content.body.forEach(node => findEvent(node));
        }

    }

    private parseScript() {
        if (!this.hasScript) return
        this.scriptAST = ts.createSourceFile('_scipt.ts', this.script as string, ts.ScriptTarget.Latest, true);
    }

    private parseModule() {
        if (!this.hasModule) return
        this.moduleAST = ts.createSourceFile('_module.ts', this.module as string, ts.ScriptTarget.Latest, true);
    }

    private parseTemplate() {
        this.prepareTemplateParse();
        const result = parse(this.transpiledTemplate);
        this.templateAST = result;
    }

    private getInfo() {
        if (!this.hasScript && !this.hasModule) return

        const self = this;

        function getProps(s: ts.VariableStatement) {
            if ((s as ts.VariableStatement).declarationList?.flags === ts.NodeFlags.Let) {
                const d = (s as ts.VariableStatement).declarationList.declarations;
                const name = getName(d);
                const type = getType(d);
                const value = getValue(d);
                self.props.push({ name, type, default: value } as Prop);
            }
        }

        function getExposedData(s: ts.VariableStatement | ts.ExportDeclaration, isModule = false) {
            if ((s as ts.VariableStatement).declarationList?.flags === ts.NodeFlags.Const) {
                const d = (s as ts.VariableStatement).declarationList.declarations;
                const name = getName(d);
                isModule ? self.moduleExports.push(name) : self.componentExports.push(name);
            }
            else if ((s as ts.ExportDeclaration).exportClause) {
                const els = (s as ts.ExportDeclaration).exportClause as ts.NamedExports
                if (els) {
                    const es = els.elements;
                    es.forEach((e: ts.ExportSpecifier) => {
                        isModule ? self.moduleExports.push(getName(e)) : self.componentExports.push(getName(e))
                    })
                }
            }

        }

        function getExposedMethods(s: ts.FunctionDeclaration, isModule = false) {
            if (s.kind === ts.SyntaxKind.FunctionDeclaration && s.name) {
                const name = s.name.getText();
                const params = s.parameters.map((p: ts.ParameterDeclaration) => ({ name: getName(p), type: getType(p), default: getValue(p) }))
                isModule ? self.moduleMethods.push({ name, params }) : self.componentMethods.push({ name, params });
            }
        }




        if (this.hasScript) {
            this.parseScript();
            if (this.scriptAST) {
                this.scriptAST.statements.forEach(s => {
                    if (s.modifiers && s.modifiers[0].kind === ts.SyntaxKind.ExportKeyword || (s as ts.ExportDeclaration).exportClause) {
                        getProps(s as ts.VariableStatement)
                        getExposedData(s as ts.VariableStatement | ts.ExportDeclaration)
                        getExposedMethods(s as ts.FunctionDeclaration)
                    }
                })
            }
        }


        if (this.hasModule) {
            this.parseModule();
            if (this.moduleAST) {
                this.moduleAST.statements.forEach(s => {
                    if (s.modifiers && s.modifiers[0].kind === ts.SyntaxKind.ExportKeyword || (s as ts.ExportDeclaration).exportClause) {
                        getExposedData(s as ts.VariableStatement | ts.ExportDeclaration, true)
                        getExposedMethods(s as ts.FunctionDeclaration, true)
                    }
                })
            }
        }

    }

    private parse() {
        this.getSlot();
        this.getEvent();
        this.getInfo();
    }

}

function getName(node: any): string {
    const n = node.length ? node[0].name : node.name || node;
    return n.getText();
}

function getType(node: any): string {
    const t = node.length ? node[0].type : node.type || node;
    return t ? t.getText() : 'any';
}

function getValue(node: any): any {
    const init = node.length ? node[0].initializer : node.initializer || node;
    if (ts.SyntaxKind[init?.kind] == 'ObjectLiteralExpression') {
        return (init as ts.ObjectLiteralExpression)?.properties?.map((prop: any) => {
            return {
                [prop.name.text]: getValue(prop.initializer)
            }
        }).reduce((acc: object, curr: object) => {
            return { ...acc, ...curr }
        }, {})
    }

    if (ts.SyntaxKind[init?.kind] == 'ArrayLiteralExpression') {
        return (init as ts.ArrayLiteralExpression)?.elements?.map((e) => getValue(e))
    }

    if (ts.SyntaxKind[init?.kind] == 'CallExpression') {
        return (init as ts.CallExpression)?.arguments?.map((e) => getValue(e))
    }

    if (ts.SyntaxKind[init?.kind] == 'NewExpression') {
        return (init as ts.NewExpression)?.arguments?.map((e) => getValue(e))
    }

    if (ts.SyntaxKind[init?.kind] == 'ParenthesizedExpression') {
        return getValue(init.expression)
    }

    if (ts.SyntaxKind[init?.kind] == 'FirstLiteralToken' ||
        ts.SyntaxKind[init?.kind] == 'StringLiteral' ||
        ts.SyntaxKind[init?.kind] == 'NumericLiteral' ||
        ts.SyntaxKind[init?.kind] == 'NoSubstitutionTemplateLiteral' ||
        ts.SyntaxKind[init?.kind] == 'RegularExpressionLiteral' ||
        ts.SyntaxKind[init?.kind] == 'NoSubstitutionTemplateLiteral' ||
        ts.SyntaxKind[init?.kind] == 'Identifier'
    ) {
        return init.text
    }

    if (ts.SyntaxKind[init?.kind] == 'FunctionExpression') {
        return 'function'
    }

    if (ts.SyntaxKind[init?.kind] == 'ArrowFunction') {
        return 'function'
    }

    if (ts.SyntaxKind[init?.kind] == 'Parameter') {
        return !init.initializer ? undefined : getValue(init.initializer)
    }


    if (ts.SyntaxKind[init?.kind] == 'TrueKeyword') {
        return true
    }

    if (ts.SyntaxKind[init?.kind] == 'FalseKeyword') {
        return false
    }

    else {
        return ts.SyntaxKind[init?.kind];
    }

}