const validateMessage = require('../validate-message.js');
const _ = require('lodash');

module.exports = {
  data: function(){return {
    currentMessage:'',
    messages:[],
    _updateListener:null,
    username:null,
    localKey:null,
    users:[]
  }},
  props:{
    "cabal":{
      type:Object,
      required:true
    },
    "cabalClient":{
      type:Object,
      required:true
    },
    "channel":{
      type:String,
      default:"default"
    }
  },
  computed:{
    messageChains: function(){
      var ret = [];
      var lastAuthor = null;

      this.messages.forEach(m=>{

        if (m.key===lastAuthor && m.key){
          ret[ret.length-1].push(m);
        }else{
          ret.push([m])
          lastAuthor = m.key;
        }
      })
      
      return ret;
    },
    onlinePeers: function () {
      return this.users.filter(p=>p.online && p.key != this.localKey)
    },
    offlinePeers: function () {
      return this.users.filter(p=>!p.online && p.key != this.localKey)
    },
    sortedPeers: function () {
      return [...this.onlinePeers, ...this.offlinePeers]
    }
  },
  template:`
  <div class="chat">
    <div class="chat-header">
      <div class="chat-header-inner">
        <div>
        <poppins>
          <button slot="button" class="button button__white button__small" title="peer connections">
            <span v-if="onlinePeers.length > 0" class="online-circle"></span>
            <span v-else class="offline-circle"></span>
            {{ onlinePeers.length }}/{{ users.length }}
          </button>
          <div slot="tooltip">
            <ul class="user-list">
              <li v-for="user in sortedPeers">
                <span v-if="user.online" class="online-circle"  title="online"></span>
                <span v-else             class="offline-circle" title="offline"></span>
                <p>{{user.name || user.key}}</p>
              </li>
            </ul>
          </div>
        </poppins>
      </div>
      <span class="chat-header-title"><strong>#{{channel}}</strong></span>
      <div>
        <div>
          <span>Cabal Key: </span><input readonly type="text" class="copybox" :value="cabal.key"/>
        </div>
      </div>
      </div>
    </div>

    <ul class="chat-entries" ref="scrollable">      
      <li v-if="messages.length == 0" class="chat-entry">
        <p>This channel is currently empty, as far as I know.</p>
      </li>
      <li class="chat-entry" v-for="chain in messageChains" :key="chain[0].value.timestamp">
        <span class="chat-entry-left">
          <avatar :cabal="cabal" :userid="chain[0].key"/>
        </span>
        <span class="chat-entry-content">
          <span class="chat-entry-info">
            <username :cabal="cabal" :userid="chain[0].key" :users="users"/>
            <span class="chat-time">&nbsp;{{chain[chain.length - 1].value.timestamp | time}}</span>
          </span>
          <p class="chat-text" v-for="message in chain">
            <span v-if="message.value.type == 'chat/text'">{{message.value.content.text | correctEmojis}}</span>
            <span v-if="message.value.type == 'chat/emote'"><i>*** {{message.value.content.text | correctEmojis}} ***</i></span>
            <span v-if="message.value.type == 'chat/topic'">*** set the topic to <strong>{{message.value.content.text | correctEmojis}}</strong> ***</span>
          </p>
        </span>

      </li>
    </ul>
    <div class="chat-input">
      <textarea
        v-model="currentMessage"
        @keydown.enter.prevent.stop="sendMessage"
        :placeholder="'Type something, '+(username||localKey||'') | correctEmojis | shorten(30)"
      />
      <button @click="sendMessage" class="button">Send</button>
      <button @click="promptUsername" class="button button__light button__small">⚙&#xFE0E;</button>
    </div>
    <modal-prompt ref="usernamePrompt"/>
  </div>`,
  methods:{
    addMessage: function(m){
      if (validateMessage(m)){
        this.messages.unshift(m);
        // inefficient but works for now
        setTimeout(()=>{
          this.$refs.scrollable.scrollTop = this.$refs.scrollable.scrollHeight;
        },1)
      }
    },
    uiUpdate: function(details){
      // TODO update users
      var u = details.getUsers()
      this.users = Object.keys(u).map(key=> u[key])
      // check my username
      var u = this.cabal.getLocalUser()
      this.username = u.name || u.key
      this.localKey = u.key
    },
    start: function(){
      this.messages = [];
      this.username = null;
      var startChannel = this.channel;

      this.$emit('loadStart');
      // load messages
      this.cabalClient.getMessages({channel:this.channel,amount:300},(data)=>{
        this.$emit('loadEnd');
        if (this.channel != startChannel){
          return;// in case the channel changed
        }
        for(let i = data.length - 1; i >= 0; i --){
          this.addMessage(data[i]);
        }

      });
      
      this.cabal.on('update',this.uiUpdate)
      this._updateListener = [this.cabal,'update',this.uiUpdate];

    },
    stop: function(){
      // remove listeners

      var listenerNames = ['_updateListener']

      listenerNames.filter(listenerName=>this[listenerName]).forEach(listenerName=>{
        var listener = this[listenerName];
        listener[0].removeListener(listener[1],listener[2]);
        this[listenerName] = null;
      })

    },
    reInit: function(){
      this.stop();
      this.start();
    },
    sendMessage: function(){
      if(!this.currentMessage || this.currentMessage.replace(/\n/g,'').length < 1){
        this.currentMessage='';
        return false;
      }

      // this should trigger a message event for the channel
      var fullMessage = {
        type: 'chat/text',
        content: {
          text: this.currentMessage,
          channel: this.cabalClient.getCurrentChannel()
        }
      }

      this.cabal.publishMessage(fullMessage,(er,entry)=>{
        console.log(entry);
        if(er){
          console.error(er);
        }else{
          this.currentMessage='';
        }
      });
    },
    promptUsername: function(){
      this.$refs.usernamePrompt.prompt({question:'Enter a username to use in this cabal',answer:this.username},result=>{
        if(!result){
          return
        }
        if(this.username == result){return}// no change
        this.username=result;
        this.cabal.setNick(this.username,(er,result)=>{
          if(er){
            console.log(er);
          }
        });
      })
    }
  },
  created: function(){
    this.start();
  },
  destroyed: function(){
    this.stop();
  },
  watch:{
    cabal: function(){this.reInit()},
    channel: function(){this.reInit()}
  }
}
