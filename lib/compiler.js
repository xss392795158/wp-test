const fs = require('fs');
const path = require('path');
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAst} = require('@babel/core')

module.exports = class Compiler{
  constructor(option) {
    let {entry, output} = option;
    this.entry = entry;
    this.output = output;
    this.modules = []
  }
  run() {
    const info = this.build(this.entry);
    this.modules.push(info);

    this.modules.map(item => {
      const { dependecies } = item;
      if(dependecies) {
        for(let j in dependecies) {
          this.modules.push(this.build(dependecies[j]))
        }
      }
    })

    let obj = {};
    this.modules.map(el => {
      obj[el.filename] = {
        dependecies: el.dependecies,
        code: el.code
      }
    })

    this.file(obj);
  }
  build(filename) {
    // 转换ast
    let content = fs.readFileSync(filename, 'utf-8');
    let ast = parser.parse(content, {
      sourceType: 'module'
    })
    // 存储依赖
    let dependecies = {}
    traverse(ast, {
      ImportDeclaration({node}) {
        let dirname = path.dirname(filename);
        let newName = './' + path.join(dirname, node.source.value);
        dependecies[node.source.value] = newName;
      }
    })
    // 把ast转换成code
    let {code} = transformFromAst(ast, null, {
      presets: ['@babel/preset-env']
    })

    return {
      filename,
      dependecies,
      code
    }

  }
  file(code) {
    let filepath = path.join(this.output.path, this.output.filename);
    let codeStr = JSON.stringify(code);

    let bundle = `(function(graph){
      function require(module){
        function localRequire(relativePath) {
          return require(graph[module].dependecies[relativePath])
        }
        var exports = {};
        (function(require,exports,code){
          eval(code)
        })(localRequire,exports,graph[module].code);
        return exports;
      }
      require('${this.entry}');
    })(${codeStr})`;

    fs.writeFileSync(filepath, bundle, 'utf-8')
  }
}