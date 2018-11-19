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
    },
    users:{
      required:true,
      type:Array
    }
  },
  data:function(){
    return {
      pollInterval:null,
      pollLock:null
    }
  },
  template:`
  <span class="username">{{nick||username | shorten(30) }}</span>
  `,
  computed:{
    username:function(){
      return "Conspirator "+this.userid;
    },
    nick:function(){
      var user = this.users.find(u=>u.key == this.userid);
      if (!user){return null}
      return user.name;
    }
  }
}

// global cache of id:username
var nicknameCache = {}
