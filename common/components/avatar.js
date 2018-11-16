const _ = require('lodash')
const crypto = require('crypto');

module.exports = {
  props:{
    userid:{
      required:true,
      type:String
    },
    cabal:{
      required:true,
      type:Object
    }
  },
  data:function(){
    return {}
  },
  template:`
  <span class="avatar" :style=avatarStyle>
  </span>`,
  computed:{
    avatarStyle:function(){

      var bytes = hash(this.userid);

      var rot = (bytes[6]%4) *45;
      var c = color1(bytes[0])
      var c2 = color2(bytes[1])
      var pct = bytes[2]*60/255+20; 
      return `background-image:linear-gradient(${rot}deg, ${c} -10%, ${c} ${pct}%, ${c2} ${pct+1}%, ${c2} 110%)`;
    }
  }
}


// helpers

var hash = _.memoize(str=>{
  const hash = crypto.createHash('sha256');
  hash.update(str,'ascii');
  return hash.digest();
})


// make sure to update this when colors change
var color1 = function(n){
  var colors = [ '#3a4044','#5B6166','#747B82','#BAC7D1','#eff7ff'];
  return colors[n%colors.length];
}

var color2 = function(n){
  var colors = ['#37A3FF','#2C82CC'];
  return colors[n%colors.length];
}