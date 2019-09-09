# wp-test
执行 node index.js
关注 lib/compiler.js
# step1:读取入口文件fs.readFileSync
      转换ast树：parser.parse
      存储依赖：@babel/traverse 到自定义对象dependecies
      ast转成代码：@babel/core transformFromAst，配置项presets: ['@babel/preset-env']
      输出对象：{
        filename,
        dependecies,
        code
      }
# step2:赋值到对象数组
      this.modules.push({
        filename,
        dependecies,
        code
      })
      创建临时变量obj[filename] = {
        dependecies,
        code
      }
      这样每个文件和内部依赖都会一一生成保存代码
# step3:写入到output path, fs.writeFileSync()
      将上一步生成的临时变量obj传入
      字符串化：JSON.stringify(obj)
      自写require函数
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
