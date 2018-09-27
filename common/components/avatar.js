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
      var c = `rgb(${bytes[0]},${bytes[1]},${bytes[2]})`
      var c2 = `rgb(${bytes[3]},${bytes[4]},${bytes[5]})`
      return `background-image:linear-gradient(${rot}deg, ${c} -10%, ${c} 49%, ${c2} 51%, ${c2} 110%)`;
    }
  }
}


// helpers

var hash = _.memoize(str=>{
  const hash = crypto.createHash('sha256');
  hash.update(str,'ascii');
  return hash.digest();
})
