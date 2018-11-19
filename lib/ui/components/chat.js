const validateMessage = require('../validate-message.js');
const _ = require('lodash');

module.exports = {
  data:function(){return {
    currentMessage:'',
    messages:[],
    messageBackStream:null,
    username:null,
    localKey:null,
    _userInterval:null,
    _messageListener:null,// [object, event, handler], for removing listener later
    _peerAddedListener:null,
    _peerDroppedListener:null,
    users:[],
    incrementalPeerStatus:{}
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
  computed:{
    messageChains:function(){
      var ret = [];
      var lastAuthor = null;

      this.messages.forEach(m=>{
        if (m.key == lastAuthor){
          ret[ret.length-1].push(m);
        }else{
          ret.push([m])
          lastAuthor = m.key;
        }
      })
      
      return ret;
    },      
    peers:function(){// merge user list with peer event deltas

      var usersPlus = _.clone(this.users);
      Object.keys(this.incrementalPeerStatus).forEach(peerKey=>{
        var isOnline = this.incrementalPeerStatus[peerKey];
        var user = usersPlus.find(u=>u.key == peerKey)
        if (!user){
          usersPlus.push({key:peerKey,online:isOnline})
        }else{
          user.online = isOnline;
        }
      });
      return usersPlus;
      
    },
    sortedPeers:function(){
      return _.sortBy(this.peers,u=>u.online?0:1);
    },
    onlinePeers:function(){
      return _.filter(this.peers,u=>u.online);
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
            {{ onlinePeers.length }}/{{ sortedPeers.length }}
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
          <span>Key: </span><input readonly type="text" class="copybox" :value="cabal.key"/>
        </div>
      </div>
      </div>
    </div>

    <ul class="chat-entries" ref="scrollable">      
      <li v-if="messages.length == 0" class="chat-entry">
        <p>This channel is currently empty, as far as I know.</p>
      </li>
      <li class="chat-entry" v-for="chain in messageChains">
        <span class="chat-entry-left">
          <avatar :cabal="cabal" :userid="chain[0].key"/>
        </span>
        <span class="chat-entry-content">
          <span class="chat-entry-info">
            <username :cabal="cabal" :userid="chain[0].key" :users="users"/>
            <span class="chat-time">{{chain[chain.length - 1].value.timestamp | time}}</span>
          </span>
          <p class="chat-text" v-for="message in chain">{{message.value.content.text}}</p>
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
        },1)
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
        if (validateMessage(m) && m.value.content.channel == this.channel){
          this.addMessage(m);
        }
      };

      this.cabal.on('message',handleMessage);
      this._messageListener = [this.cabal,'message',handleMessage];


      var checkUsers = ()=>{
        this.cabal.getUsers((er,users)=>{
          if(er){return console.warn(er)}
          this.users = Object.keys(users).map(k=>users[k]).filter(u=>u.key != this.cabal.localKey);
        });
      }

      // handle events on the peer list. Note that getUsers will also tell us this info, but this lets us get fast updates without polling.
      var handlePeerAdded = (id)=>{
        console.log('peer added: '+id)
        this.incrementalPeerStatus[id] = true;
        var peer = this.users.find(p=>p.key == id);
        if(peer) peer.online = true;
        checkUsers();
      }
      var handlePeerDropped = (id)=>{
        console.log('peer dropped: '+id)
        this.incrementalPeerStatus[id] = false;
        var peer = this.users.find(p=>p.key == id);
        if(peer) peer.online = false;
        checkUsers();
      }

      this.cabal.on('peer-added',handlePeerAdded)
      this._peerAddedListener = [this.cabal,'peer-added',handlePeerAdded]

      this.cabal.on('peer-dropped',handlePeerDropped)
      this._peerDroppedListener = [this.cabal,'peer-dropped',handlePeerDropped]

      checkUsers();
      this._userInterval = setInterval(checkUsers,10000)


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

      var listenerNames = ['_messageListener','_peerAddedListener','_peerDroppedListener'];

      listenerNames.filter(listenerName=>this[listenerName]).forEach(listenerName=>{
        var listener = this[listenerName];
        listener[0].removeListener(listener[1],listener[2]);
        this[listenerName] = null;
      })

      // clear intervals

      if (this._userInterval){
        clearInterval(this._userInterval);
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

      // this should trigger a message event for the channel
      this.cabal.sendMessage(this.channel,this.currentMessage,(er,entry)=>{
        console.log(entry);
        if(er){
          console.error(er);
        }else{
          this.currentMessage='';
        }
      });
    },
    showUsers:function(){
      console.log(this.users.map(u=>u.key));
    },
    promptUsername:function(){
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
