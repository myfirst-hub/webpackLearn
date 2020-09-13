let less = require('less');
function loader(source){
  console.log('source....................', source)
  let css ='';
  less.render(source, function(err, c){
    console.log('err....................', err)
    console.log('c....................', c)
    css = c.css;
  })
  css = css.replace(/\n/g, '\\n');
  return css;
}
module.exports = loader;