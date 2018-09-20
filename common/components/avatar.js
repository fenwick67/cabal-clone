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

      var n = bytes[0] + bytes[1]*256 + bytes[2]*65536 + bytes[3]*16777216;

      var n1 = 360*((n % 1111)/1111);
      var n2 = 360*((n % 2834)/2834);
      var rot = 360*((n % 926)/926);
      var w = 8 + 20 * ((n % 381)/381);
      var w2 = 2*w;
      var c = `hsla(${n1},60%,60%,0.7)`
      var c2 = `hsla(${n2},60%,60%,1.0)`
      return `background-image:repeating-linear-gradient(${rot-90}deg, transparent 0%, transparent ${w}%, ${c} ${w}%, ${c} ${w2}%), repeating-linear-gradient(${rot}deg, transparent 0%, transparent ${w}%, ${c2} ${w}%, ${c2} ${w2}%)`;
    }
  }
}


// helpers

var hash = _.memoize(str=>{
  const hash = crypto.createHash('sha256');
  hash.update(str,'ascii');
  return hash.digest();
})


function genPlaceholder(userid){
  // get a color for a userid

  var bytes = hash(this.userid);

  var n = bytes[0] + bytes[1]*256 + bytes[2]*65536 + bytes[3]*16777216 + bytes[4]*4294967296;

  var n1 = 360*((n % 1111)/1111);
  var n2 = 360*((n % 2834)/2834);
  var rot = 360*((n % 926)/926);
  var w = 8 + 20 * ((n % 381)/381);
  var w2 = 2*w;
  var c = `hsla(${n1},60%,60%,0.7)`
  var c2 = `hsla(${n2},60%,60%,1.0)`
  return `background-image:repeating-linear-gradient(${rot-90}deg, transparent 0%, transparent ${w}%, ${c} ${w}%, ${c} ${w2}%), repeating-linear-gradient(${rot}deg, transparent 0%, transparent ${w}%, ${c2} ${w}%, ${c2} ${w2}%)`;
}
