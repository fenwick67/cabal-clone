
module.exports = {
  props:{
    "cabal":{
      type:Object,
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
      :cabal="cabal"
      @click.native="channelChangedTo(c)"
    >
    </channel>
    <a class="sidebar-item" @click="enterChannel"><span class="plus-icon"></span>New</a>
    <modal-prompt ref="prompt"/>
  </div>
  `,
  data:function(){
    return {
      channels:['default'],
      pollInterval:null,
      channelPollLock:false
    };
  },
  created:function(){
    pollInterval = setInterval(this.updateChannels.bind(this),1000);
  },
  destroyed:function(){
    if(pollInterval !== null){
      clearInterval(pollInterval);
    }
  },
  methods:{
    updateChannels:function(doCancel){
      if(doCancel != true && this.channelPollLock){
        return;
      }

      this.channelPollLock = true;
      this.cabal.channels.get((error,channels)=>{
        this.channelPollLock = false;
        if(error){
          return;
        }
        // add new channels
        channels.forEach(c=>{
          if (this.channels.indexOf(c) == -1 ){
            this.channels.push(c);
          }
        })
      })
    },
    channelChangedTo(c){
      console.log('channel changed to...'+c)
      this.$emit('channelChanged',c)
    },
    enterChannel(){
      this.$refs.prompt.prompt({question:"Enter a new channel name:"},(result)=>{
        if (!result){// cancelled or ""
          return;
        }
        this.channelChangedTo(result.toLowerCase());
        this.channels.push(result.toLowerCase());
      })
    }
  },
  watch:{
    cabal:function(){
      this.channels=['default'];
      this.updateChannels(true);
      if(this.channels.indexOf(this.channel) == -1){
        this.channelChangedTo('default')
      }
    },
    currentChannel:function(){this.updateChannels(true)}
  }

}
