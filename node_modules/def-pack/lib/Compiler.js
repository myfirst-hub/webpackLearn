 const fs = require('fs');
 const path = require('path');
 let ejs = require('ejs');

 let babylon = require("babylon");
 let traverse = require('@babel/traverse').default;
 let t = require('@babel/types');
 let generator = require('@babel/generator').default;
 // babylon 主要就是把源码转成ast
 // @babel/traverse
 // @babel/types
 // @babel/generator
 class Compiler {
   constructor(config) {
     // entry output
     this.config = config;
     //需要保存入口文件的路径
     this.entryId;
     //需要保存所有模块的依赖
     this.modules = {};
     this.entry = config.entry; // 入口路径
     this.root = process.cwd(); // 工作路径
   }
   getSource(modulePath) {
     console.log('modulePath...................', modulePath);
     let rules = this.config.module.rules;
     let content = fs.readFileSync(modulePath, 'utf8');
     for (let i = 0; i < rules.length; i++) {
       let rule = rules[i];
       let {
         test,
         use
       } = rule;
       let len = use.length - 1;
       if (test.test(modulePath)) {
         // loader获取对应的loader函数
         function normalLoader() {
          console.log('use[len--]...................', use[len--]);
           let loader = require(use[len--]);
           console.log('loader...................', loader);
           content = loader(content);
           console.log('content...................', content);
           // 递归调用loader实现转化功能
           if (len >= 0) {
             normalLoader();
           }
         }
         normalLoader();
       }
     }
     //  console.log('content...................', content);
     return content;
   }
   parse(source, prarentPah) { // AST解析语法树
     let ast = babylon.parse(source);
     let dependencies = []; // 依赖的数组
     traverse(ast, {
       CallExpression(p) { // a()  require()
         let node = p.node // 对应的节点
         // console.log('p................', p.node);
         if (node.callee.name === 'require') {
           node.callee.name = '__webpack_require__';
           let moduleName = node.arguments[0].value; // 取到的就是模块的引用名字
           moduleName = moduleName + (path.extname(moduleName) ? '' : '.js');
           moduleName = './' + path.join(prarentPah, moduleName);
           dependencies.push(moduleName);
           node.arguments = [t.stringLiteral(moduleName)];
           // console.log('t................', t.stringLiteral(moduleName));
         }
       }
     })
     let sourceCode = generator(ast).code;
     //  console.log('sourceCodet................', sourceCode);
     return {
       sourceCode,
       dependencies
     };
   }
   //构建模块
   buildModule(modulePath, isEntry) {
     //拿到模块的内容
     let source = this.getSource(modulePath);
     //  console.log('source................', source);
     //模块id modulePath
     let moduleName = './' + path.relative(this.root, modulePath);
     //  console.log('moduleName................', moduleName);
     //  console.log('path.dirname(moduleName)................', path.dirname(moduleName));
     if (isEntry) {
       this.entryId = moduleName; //保存入口的名字
     }
     // 解析需要把source源码进行改造，返回一个依赖列表
     let {
       sourceCode,
       dependencies
     } = this.parse(source, path.dirname(moduleName));

     //把相对路径和模块中的内容 对应起来
     this.modules[moduleName] = sourceCode;
     // 递归获取模块依赖
     dependencies.forEach(dep => {
       this.buildModule(path.join(this.root, dep), false);
     });
   }
   emitFile() { // 发射文件
     // 用数据 渲染我们的ejs模板
     // 拿到输出到那个目录下 输出路径
     let main = path.join(this.config.output.path, this.config.output.filename);
     // 读取的模板路径
     let templateStr = this.getSource(path.join(__dirname, 'main.ejs'));
     let code = ejs.render(templateStr, {
       entryId: this.entryId,
       modules: this.modules
     });
     this.assets = {};
     console.log('main.................', main);
     // 资源中路径对应的代码
     this.assets[main] = code;
     fs.writeFileSync(main, this.assets[main]);
   }
   run() {
     //执行，并且创建模块的依赖关系
     this.buildModule(path.resolve(this.root, this.entry), true);
     //  console.log('this.modules................', this.modules);
     //  console.log('this.entryid................', this.entryId);

     //发射一个文件，打包后的文件
     this.emitFile();
   }
 }

 module.exports = Compiler;