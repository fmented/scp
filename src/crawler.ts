import { parse } from "svelte/compiler";
import {Ast, TemplateNode} from 'svelte/types/compiler/interfaces';
import ts from 'typescript';

interface Slot{
    name: string;
    data: string[];
}

interface Prop{
    name: string;
    type: string;
    default: any;
}

interface Param extends Prop{}

interface Method{
    name: string;
    params: Param[];
}





export class Crawler {
    slots:Slot[]
    events:string[]
    props:Prop[]
    templateAST: Ast|undefined
    template: string
    componentExports:string[]
    moduleExports:string[]
    moduleMethods:Method[]
    componentMethods:Method[]
    transpiledTemplate:string
    moduleAST:ts.SourceFile|undefined
    scriptAST:ts.SourceFile|undefined
    hasModule:boolean
    hasScript:boolean
    module:string|undefined
    moduleOuter:string|undefined
    script:string|undefined
    scriptOuter:string|undefined




    constructor(template:string) {
      const modulePattern = /<script\s+[\s\S]*?context\s*?=\s*?["|'|`]?module["|'|`]?[\s\S]*?>([\s\S]*?)<\/script>/g;
      const scriptPattern = /<script\s+[\s\S]*?>([\s\S]*?)<\/script>/g;
      
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
  
  
  
      const matchModule = modulePattern.exec(template);
  
      if (matchModule) {
        this.module = matchModule[1];
        this.moduleOuter = matchModule[0];
        const moduleDiscarded = template.replace(matchModule[0], "");
        const matchScript = scriptPattern.exec(moduleDiscarded);
        this.hasModule = true;
        if (matchScript) {
          this.script = matchScript[1];
          this.scriptOuter = matchScript[0];
          this.hasScript = true;
        } else {
          this.hasScript = false;
        }
      } else {
        this.hasModule = false;
        const matchScript = scriptPattern.exec(template);
        this.hasScript = matchScript ? true : false;
        if (matchScript) {
          this.script = matchScript[1];
          this.scriptOuter = matchScript[0];
        }
      }
  
      this.getSlot();
      this.getEvent();
      this.getInfo();
  
    }
  
    transpile() {
      let transpiledModule;
      let transpiledScript;
      if (this.hasModule) {
          transpiledModule = ts.transpile(this.module as string, {
          module: ts.ModuleKind.ESNext,
          strict: false,
          target: ts.ScriptTarget.ESNext,
        });
      }

      if (this.hasScript) {
        transpiledScript = ts.transpile(this.script as string, {
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
  
    prepareTemplateParse() {
      const transpiled = this.transpile();
      let copy = this.template;
      if (this.hasModule) {
        copy = copy.replace(this.module as string, transpiled.module as string);
      }
      if (this.hasScript) {
        copy = copy.replace(this.script as string, transpiled.script as string);
      }
      this.transpiledTemplate = copy;
    }
  
  
    getSlot(){
        if (!this.templateAST) {
            this.parseTemplate();
        }
        const self = this;
        function findSlotRecrusively(node:TemplateNode){
            node.a
          if(node.type=='Slot'){
            const name = node.attributes
            .filter((attr:unknown)=>(attr as {name:string}).name=='name')[0]?.value[0]?.data
            const data = node.attributes
            .filter((attr:unknown)=>(attr as {name:string}).name!='name')
            .map((attr:unknown)=>((attr as {name:string}).name));
            self.slots.push({name: name ? name : 'default', data});
          }
          if(node.children && node.children.length && node.type!='Text'){
              node.children.forEach(child=>{
                  findSlotRecrusively(child);
              })
          }
  
      }
  
      findSlotRecrusively((this.templateAST as Ast).html);
    }
  
    getEvent(){
      if (!this.templateAST) {
        this.parseTemplate();
      }
      const self = this;
      
      function findEvent(node:TemplateNode){
        if(node.type == 'VariableDeclaration' && node.declarations.length && node.declarations[0].init){
          if(checkIfEventDispatcher(node.declarations[0].init)){
            const instance = node.declarations[0].id.name
            const regex = new RegExp(`${instance}\\(([\\S]*?)[,|\\)]`, 'g');
            const match = self.template.matchAll(regex)
            for(const m of match){
                self.events.push(m[1].replace(/['|"|`]/g, ''));
            }
          };
        }
      }
  
      function checkIfEventDispatcher(d:TemplateNode):boolean {
        if(d.type == 'CallExpression' && d?.callee?.name == 'createEventDispatcher'){
          return true;
        }
        return false;
      }

      if(this.templateAST?.instance){
          this.templateAST.instance.content.body.forEach(node=>findEvent(node as TemplateNode));
      }
  
      }
  
    parseScript(){
      if(!this.hasScript) return
      this.scriptAST = ts.createSourceFile('_scipt.ts', this.script as string, ts.ScriptTarget.Latest, true);
    }
  
    parseModule(){
      if(!this.hasModule) return
      this.moduleAST = ts.createSourceFile('_module.ts', this.module as string, ts.ScriptTarget.Latest, true);
    }
  
    parseTemplate(){
      this.prepareTemplateParse();
      const result = parse(this.transpiledTemplate);
      this.templateAST = result;
    }
  
    getInfo(){
      if(!this.hasScript && !this.hasModule) return
  
      const self = this;
  
      function getProps(s:any){
        if(s.declarationList?.flags === ts.NodeFlags.Let){
          const d = s.declarationList.declarations;
          const name = getName(d);
          const type = getType(d);
          const value = getValue(d);
          self.props.push({name, type, default:value} as Prop);
        }
      }
  
      function getExposedData(s:any, isModule = false){
        if(s.declarationList?.flags === ts.NodeFlags.Const){
          const d = s.declarationList.declarations;
          const name = getName(d);
          isModule ? self.moduleExports.push(name) :self.componentExports.push(name) ;
        }
        else if(s.exportClause){
          const es = s.exportClause.elements;
          es.forEach((e:WTH)=>{
            isModule ? self.moduleExports.push(getName(e)) : self.componentExports.push(getName(e))
          })
        }
  
      }
  
      function getExposedMethods(s:any, isModule = false) {
        if(s.kind === ts.SyntaxKind.FunctionDeclaration){
          const name = s.name.getText();
          const params = s.parameters.map((p:WTH)=> ({name:getName(p), type: getType(p), default: getValue(p)}))
          isModule ? self.moduleMethods.push({name, params}) :self.componentMethods.push({name, params}) ;
        }
      }
  
  
  
  
      if(this.hasScript){
        this.parseScript();
  
      (this.scriptAST as ts.SourceFile).statements.forEach(s=>{
        if(s.modifiers && s.modifiers[0].kind === ts.SyntaxKind.ExportKeyword || (s as any).exportClause){
          getProps(s)
          getExposedData(s)
          getExposedMethods(s)
        }})
      }
  
  
      if(this.hasModule){
        this.parseModule();
        (this.moduleAST as ts.SourceFile).statements.forEach(s=>{
          if(s.modifiers && s.modifiers[0].kind === ts.SyntaxKind.ExportKeyword || (s as any).exportClause){
            getExposedData(s, true)
            getExposedMethods(s, true)
          }})
      }
  
    }
  
  }
  
  function getName(node:any):string{
    const n = node.length ? node[0].name : node.name || node;
    return n.getText();
  }
  
  function getType(node:any):string {
    const t = node.length ? node[0].type : node.type || node;
    return t ? t.getText() : 'any';
      // if(!t){
      //   return 'any'
      // }
  
      // if(ts.SyntaxKind[t.kind]== 'ArrayType'){
      //   return `${t.elementType.typeName.text}[]`;
      // }
      // if(ts.SyntaxKind[t.kind]== 'TypeReference'){
      //   return t.typeName.text
      // }
      // if(ts.SyntaxKind[t.kind]== 'UnionType'){
      //   return t.types.map(type=>type.typeName.text).join('|')
      // }
      // if(ts.SyntaxKind[t.kind]== 'IntersectionType'){
      //   return t.types.map(type=>type.typeName.text).join('&')
      // }
      // if(ts.SyntaxKind[t.kind]== 'LiteralType'){
      //   return t.literal.text
      // }
      // if(ts.SyntaxKind[t.kind]== 'StringKeyword'){
      //   return 'string'
      // }
      // if(ts.SyntaxKind[t.kind]== 'NumberKeyword'){
      //   return 'number'
      // }
  
      // if(ts.SyntaxKind[t.kind]== 'BooleanKeyword'){
      //   return 'boolean'
      // }
      // if(ts.SyntaxKind[t.kind]== 'NullKeyword'){
      //   return 'null'
      // }
      // if(ts.SyntaxKind[t.kind]== 'UndefinedKeyword'){
      //   return 'undefined'
      // }
      // if(ts.SyntaxKind[t.kind]== 'VoidKeyword'){
      //   return 'void'
      // }
      // if(ts.SyntaxKind[t.kind]== 'NeverKeyword'){
      //   return 'never'
      // }
      // if(ts.SyntaxKind[t.kind]== 'ObjectKeyword'){
      //   return 'object'
      // }
  
      // if(ts.SyntaxKind[t.kind]== 'TypeQuery'){
      //   return t.exprName.text
      // }
  
      // if(ts.SyntaxKind[t.kind]=='TypeLiteral'){
      //   return t.members.map(member=>{
      //     if(ts.SyntaxKind[member.kind]=='PropertySignature'){
      //       return `${member.name.text}: ${getType(member.type)}`
      //     }
      //   }).join(', ')
      // }
  
      // if(ts.SyntaxKind[t.kind]== 'IndexedAccessType'){
      //   return `${getType(t.objectType)}.${getType(t.indexType)}`
      // }
  
      // else{
      //   return ts.SyntaxKind[t.kind]
      // }
  
  }

  interface WTH{
      name:{
            text:string
      }
      initializer:WTH
  }
  
  function getValue(node:any):any {
    const init = node.length ? node[0].initializer : node.initializer || node;
    if(ts.SyntaxKind[init?.kind]=='ObjectLiteralExpression'){
      return init?.properties?.map((prop:WTH)=>{
        return {
          [prop.name.text]: getValue(prop.initializer)
        }
      }).reduce((acc:object, curr:object)=>{
        return {...acc, ...curr}
      }, {})
    }
  
    if(ts.SyntaxKind[init?.kind]=='ArrayLiteralExpression'){
      return init?.elements?.map((e:WTH)=>getValue(e))
    }
  
    if(ts.SyntaxKind[init?.kind]=='CallExpression'){
      return init?.arguments?.map((e:WTH)=>getValue(e))
    }
  
    if(ts.SyntaxKind[init?.kind]=='NewExpression'){
      return init?.arguments?.map((e:WTH)=>getValue(e))
    }
  
    if(ts.SyntaxKind[init?.kind]=='ParenthesizedExpression'){
      return getValue(init.expression)
    }
  
    if(ts.SyntaxKind[init?.kind]=='FirstLiteralToken' ||
      ts.SyntaxKind[init?.kind]=='StringLiteral' || 
      ts.SyntaxKind[init?.kind]=='NumericLiteral' ||
      ts.SyntaxKind[init?.kind]=='NoSubstitutionTemplateLiteral' ||
      ts.SyntaxKind[init?.kind]=='RegularExpressionLiteral' ||
      ts.SyntaxKind[init?.kind]=='NoSubstitutionTemplateLiteral' ||
      ts.SyntaxKind[init?.kind]=='Identifier'
      ){
      return init.text
    }
  
    if(ts.SyntaxKind[init?.kind]=='FunctionExpression'){
      return 'function'
    }
  
    if(ts.SyntaxKind[init?.kind]=='ArrowFunction'){
      return 'function'
    }
  
    if(ts.SyntaxKind[init?.kind]=='Parameter'){
      return !init.initializer ? undefined : getValue(init.initializer)
    }
  
  
    if(ts.SyntaxKind[init?.kind]=='TrueKeyword'){
      return true
    }
  
    if(ts.SyntaxKind[init?.kind]=='FalseKeyword'){
      return false
    }
  
    else{
      return ts.SyntaxKind[init?.kind];
    }
  
  }
  