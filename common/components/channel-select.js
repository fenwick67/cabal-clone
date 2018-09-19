// TODO let user create new channel

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
    <channel v-for="c in channels"
      :active="currentChannel == c"
      :channel="c"
      :cabal="cabal"
      @click.native="this.$emit('channelChanged',channel)"
    >
    </channel>
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
        channels.forEach(c=>{
          if (this.channels.indexOf(c) == -1 ){
            this.channels.push(c);
          }
        })
      })
    }
  },
  watch:{
    cabal:function(){this.updateChannels(true)},
    currentChannel:function(){this.updateChannels(true)}
  }

}
