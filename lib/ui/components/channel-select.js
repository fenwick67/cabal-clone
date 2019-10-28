
module.exports = {
  props:{
    "channels":{
      type:Array,
      required:true
    },
    "currentChannel":{
      type:String,
      default:'default'
    }
  },
  template:`
  <div class="channels">
    <span class="sidebar-header">channels</span>
    <channel v-for="c in channels"
      :active="currentChannel == c"
      :channel="c"
      :title="c"
      @click.native="channelChangedTo(c)"
    >
    </channel>
    <a class="sidebar-item" @click="enterChannel"><span class="plus-icon"></span>New</a>
    <modal-prompt ref="prompt"/>
  </div>
  `,
  methods:{
    channelChangedTo(c){
      this.$emit('channelChanged',c)
    },
    enterChannel(){
      this.$refs.prompt.prompt({question:"Enter a new channel name:"},(result)=>{
        if (!result){// cancelled or ""
          return;
        }
        this.$emit('channelChanged',c)
      })
    }
  }

}
