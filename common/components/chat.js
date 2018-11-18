const validateMessage = require('../validate-message.js');

module.exports = {
  data:function(){return {
    currentMessage:'',
    messages:[],
    messageListener:null,// [object, event, handler], for removing listener later
    messageBackStream:null,
    username:null,
    localKey:null
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
        <p>This channel is currently empty, as far as I know.</p>
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
      <textarea
        v-model="currentMessage"
        @keydown.enter.prevent.stop="sendMessage"
        :placeholder="'Type something, '+(username||localKey||'') | shorten(30)"
      />
      <button @click="sendMessage" class="button">Send</button>
      <button @click="promptUsername" class="button button__light button__small">⚙&#xFE0E;</button>
    </div>
    <modal-prompt ref="usernamePrompt"/>
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
      this.username = null;
      var startChannel = this.channel;

      this.$emit('loadStart');
      // load messages
      this.cabal.getMessages(this.channel,{limit:1000},(er,data)=>{
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

      var handleMessage = (m)=>{
        console.log('got message in UI',m);
        if (validateMessage(m) && m.value.content.channel == this.channel){
          this.addMessage(m);
        }
      };

      this.cabal.on('message',handleMessage);

      this.messageListener = [this.cabal,'message',handleMessage];

      // check my username
      this.cabal.getLocalKey((er,key)=>{
        if(er){return console.error(er);}
        this.localKey=key;
        if(!this.cabal){return}
        this.cabal.getUser(key,(er,result)=>{
          if(er){return console.error(er);}
          if(result.name){
            this.username = result.name;
          }
        })
      });
    },
    stop:function(){
      // remove listeners
      if (this.messageListener){
        this.messageListener[0].removeListener(this.messageListener[1],this.messageListener[2]);
        this.messageListener = null;
      }
    },
    reInit:function(){
      this.stop();
      this.start();
    },
    sendMessage:function(){
      if(!this.currentMessage || this.currentMessage.replace(/\n/g,'').length < 1){
        this.currentMessage='';
        return false;
      }

      this.cabal.sendMessage(this.channel,this.currentMessage,(er,entry)=>{
        console.log(entry);
        if(er){
          console.error(er);
        }else{
          console.log('published message:',entry)
          // this is a bit hacky... localKey can be null, and what is my seq?
          this.addMessage({key:this.localKey,value:entry});
          this.currentMessage='';
        }
      });
    },
    promptUsername:function(){
      this.$refs.usernamePrompt.prompt({question:'Enter a username to use in this cabal',answer:this.username},result=>{
        if(!result){
          return
        }
        if(this.username == result){return}// no change
        this.username=result;
        this.cabal.publishNick(this.username,(er,result)=>{
          if(er){
            console.log(er);
          }
        });
      })
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
