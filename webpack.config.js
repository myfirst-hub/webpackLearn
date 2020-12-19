let path = require('path');

class P{
  apply(compiler){
    console.log('compiler.hooks................', compiler.hooks);
    compiler.hooks.run.tab('emit', function(){
      console.log('emit');
    });
  }
}

module.exports = {
  mode: 'development', //模式  默认两种 production  development
  entry: './src/index.js', //入口
  output: {
    filename: 'bundle.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 路径必须是一个绝对路径
  },
  module: {
    rules: [{
      test: /\.less$/,
      use: [
        path.resolve(__dirname, 'loader', 'style-loader'),
        path.resolve(__dirname, 'loader', 'less-loader')
      ]
    }]
  },
  plugins: [
    // new P(),
  ]
}