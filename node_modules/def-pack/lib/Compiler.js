 const fs = require('fs');
 const path = require('path');

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
     let content = fs.readFileSync(modulePath, 'utf8');
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
     //解析需要把source源码进行改造，返回一个依赖列表
     let {
       sourceCode,
       dependencies
     } = this.parse(source, path.dirname(moduleName));

     //把相对路径和模块中的内容 对应起来
     this.modules[moduleName] = sourceCode;

     dependencies.forEach(dep => {
       this.buildModule(path.join(this.root, dep), false);
     });
   }
   emitFile() {
     // 用数据 渲染我们的

   }
   run() {
     //执行，并且创建模块的依赖关系
     this.buildModule(path.resolve(this.root, this.entry), true);
     console.log('this.modules................', this.modules);
     console.log('this.entryid................', this.entryId);

     //发射一个文件，打包后的文件
     //  this.emitFile();
   }
 }

 module.exports = Compiler;