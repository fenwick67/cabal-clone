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
    return {}
  },
  template:`
  <span class="username">{{username}}</span>
  `,
  computed:{
    username:function(){
      // TODO parse username from the cabal feed
      return "Conspirator "+filters.shorten(this.userid,10);
    }
  }
}
