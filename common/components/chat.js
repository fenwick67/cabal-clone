const collect = require('collect-stream');

module.exports = {
  data:function(){return {
    currentMessage:'',
    messages:[],
    messageListener:null,// [object, event, handler], for removing listener later
    messageBackStream:null
  }},
  props:{
    "cabal":{
      type:Object,
      required:true
    },
    "channel":{
      type:String,
      default:"default"
    }
  },
  template:`
  <div class="chat">
    <ul class="chat-entries">
      <li class="chat-entry" v-for="message in messages">{{message}}</li>
    </ul>
    <div class="chat-input">
      <textarea v-model="currentMessage" />
      <button @click="sendMessage">Send</button>
    </div>
  </div>`,
  methods:{
    addMessage:function(m){
      this.messages.push(m);
    },
    start:function(){
      var startChannel = this.channel;
      // load messages
      this.messageBackStream = this.cabal.messages.read(this.channel,{limit:50});
      // try reading the stream
      collect(this.messageBackStream, function(er,data){
        if (this.channel != startChannel){
          return;// in case the channel changed
        }
        if(er){
          console.error(er);
        }
        data.forEach(addMessage);
      });
      // listen for new messages
      this.cabal.messages.events.on(this.channel, this.addMessage)
      this.messageListener = [this.cabal.messages.events, this.channel, this.addMessage];
    },
    stop:function(){
      // remove listeners
      if (this.messageListener){
        this.messageListener[0].removeListener(this.messageListener[1],this.messageListener[2]);
        this.messageListener = null;
      }
      if (this.messageBackStream){
        this.messageBackStream.destroy();// EEK! this might hurt cabal-core, not sure
        this.messageBackStream = null;
      }
    },
    reInit:function(){
      this.stop();
      this.start();
    },
    sendMessage:function(){
      var entry = {
        type: 'text/chat',
        content: {
          text: this.currentMessage,
          channel: this.channel.toLowerCase()
        }
      };

      this.cabal.publish(entry,(er)=>{
        if(er){
          console.error(er);
        }else{
          console.log('published message:',entry)
          // should get added to database and therefore message list automatically?
          // IDK
          this.currentMessage='';
        }
      });
    }
  },
  created:function(){
    this.start();
  },
  destroyed:function(){
    this.stop();
  },
  watch:{
    cabal:function(){this.reInit()},
    channel:function(){this.reInit()}
  }
}
