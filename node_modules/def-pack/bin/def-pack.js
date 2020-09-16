#!/usr/bin/env node

// console.log("start11");

//1) 需要找到当前执行名的路径，拿到webpack.config.js

let path =require('path'); 
let Compiler = require('../lib/Compiler.js');

// console.log("start11，，，，，，，", __dirname);
// console.log("start11，，，，，，，", process.cwd());
//config配置文件
let congif = require(path.resolve("webpack.config.js"));
// console.log("start11，，，，，，，", congif);
let compiler = new Compiler(congif);
compiler.hooks.entryOption.call();

// //标识运行编译
compiler.run();