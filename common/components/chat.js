const collect = require('collect-stream');
const validateMessage = require('../validate-message.js');

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
    <ul class="chat-entries" ref="scrollable">
      <li class="chat-entry">
        <p>This cabal's key is <code class="inline" type="text">{{cabal.key}}</code></p>
      </li>
      <li v-if="messages.length == 0" class="chat-entry">
        <p>This channel is currently empty. As far as I know.</p>
      </li>
      <li class="chat-entry" v-for="message in messages">
        <span class="chat-entry-left">
          <avatar :cabal="cabal" :userid="message.key"/>
        </span>
        <span class="chat-entry-content">
          <span class="chat-entry-info">
            <username :cabal="cabal" :userid="message.key"/>
            <span class="chat-time">{{message.value.timestamp | time}}</span>
          </span>
          <p class="chat-text">{{message.value.content.text}}</p>
        </span>
      </li>
    </ul>
    <div class="chat-input">
      <textarea v-model="currentMessage" @keyup.enter.prevent="sendMessage"/>
      <button @click="sendMessage">Send</button>
    </div>
  </div>`,
  methods:{
    addMessage:function(m){
      if (validateMessage(m)){
        this.messages.push(m);
        // inefficient but works for now
        setTimeout(()=>{
          this.$refs.scrollable.scrollTop = this.$refs.scrollable.scrollHeight;
        },50)
      }
    },
    start:function(){
      this.messages = [];
      var startChannel = this.channel;
      // load messages
      this.messageBackStream = this.cabal.messages.read(this.channel,{limit:100});
      // try reading the stream
      this.$emit('loadStart');
      collect(this.messageBackStream, (er,data)=>{
        this.$emit('loadEnd');
        if (this.channel != startChannel){
          return;// in case the channel changed
        }
        if(er){
          console.error(er);
        }
        for(let i = data.length - 1; i >= 0; i --){
          this.addMessage(data[i]);
        }
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
        type: 'chat/text',
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
