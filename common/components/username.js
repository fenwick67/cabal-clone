
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
      return "conspirator "+this.userid.slice(0,4);
    }
  }
}
