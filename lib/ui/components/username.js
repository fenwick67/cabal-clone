var filters = require('../filters');

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
    return {
      nick:null,
      pollInterval:null,
      pollLock:null
    }
  },
  template:`
  <span class="username">{{nick||username | shorten(30) }}</span>
  `,
  computed:{
    username:function(){
      // TODO parse username from the cabal feed
      return "Conspirator "+this.userid;
    }
  },
  created:function(){
    if (nicknameCache[this.userid]){
      this.nick = nicknameCache[this.userid];
      return;
    }
    this.cabal.getUser(this.userid,(er,result)=>{
      this.pollLock=false;
      if(er){
        console.error(er);
        return
      }
      if(result && result.name){
        this.nick = result.name;
        nicknameCache[this.userid] = this.nick;
      }
    })
  }
}

// global cache of id:username
var nicknameCache = {}
