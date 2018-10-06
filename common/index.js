const Vue = require('vue/dist/vue.js');
const fs = require('fs-extra');
var Cabal = require('cabal-core');
// var Cabal = require('../common/cabal-dummy')

var store = require('../common/store')
var crypto = require('crypto');
const cabalKeyForString = require('../common/cabal-key-for-string')

var swarm = require('cabal-core/swarm');

var defaultCabals = [];

const filters = require('../common/filters');
Object.keys(filters).forEach(k=>{
	Vue.filter(k,filters[k])
});

const components = [
	'cabal-select',
	'channel',
	'channel-select',
	'modal-prompt',
	'chat',
	'avatar',
	'username',
	'title-bar'
];

components.forEach(componentName=>{
	Vue.component(componentName,require('../common/components/'+componentName+'.js'));
});

const appView = new Vue({
	el:"#app",
	template:`
		<div class="frame">
			<title-bar/>
			<div class="app">
				<div class="sidebar">
					<div class="sidebar-left">
						<div class="cabals">
							<span class="sidebar-header">cabals</span>
							<cabal-select v-for="k in plaintextCabalKeys"
								:plaintextKey="k"
								:key="k"
								:active="activeCabalPlaintextKey == k"
								@select="switchToCabal(k)"
								@remove="removeCabal(k)"
							>
							</cabal-select>
							<a class="sidebar-item " @click="addCabalPrompt"><span class="plus-icon"></span>Add</a>
							<!--
								<a class="sidebar-item" @click="switchToCabal(null)">New</a>
								<div class="sidebar-item">
									<input type="text" v-model="keyToJoin" placeholder="put cabal key here"></input>
									<a class="" @click="joinCabal">&nbsp;Join</a>
								</div>
							-->
					</div>
					</div>
					<div class="sidebar-right">
						<channel-select
							v-if="activeCabal && activeCabal.key"
							:cabal="activeCabal"
							:currentChannel="currentChannel"
							@channelChanged="setChannel">
						</channel-select>
					</div>
				</div>
				<chat
					v-if="activeCabal"
					:cabal="activeCabal"
					:channel="currentChannel"
					@loadStart="e=>this.loading=true"
					@loadEnd="e=>this.loading=false"
				></chat>
				<div v-else class="chat">
					<ul class="chat-entries">
						<li class="chat-entry">Welcome</li>
						<li class="chat-entry">⯇ Select or create a Cabal to start chatting</li>
					</ul>
				</div>
				<modal-prompt ref="prompt"/>
				<div class="loader" v-if="loading"/>
			</div>
		</div>
	`,
	data:{
		plaintextCabalKeys:store.getOrCreate('plaintextCabalKeys',defaultCabals),// List<String>
		keyToJoin:'',
		currentChannel:"default",
		activeCabal:null,
		loading:false,
		isMobile:false
	},
	methods:{
		switchToCabal(plaintextKey){
			// validate the key first

			console.log('switching to key '+plaintextKey)
			this.loading = true;
			loadCabal(plaintextKey,(er,cabal)=>{
				this.loading = false;
				if(er){
					alert(er);
					console.error(er);
					return;
				}

				this.activeCabal = cabal;
				var idx = this.plaintextCabalKeys.indexOf(cabal.plaintextKey)
				if(idx == -1){
					this.plaintextCabalKeys.push(plaintextKey);
					store.set('plaintextCabalKeys',this.plaintextCabalKeys);
				}

			})
		},
		removeCabal(plaintextKey){
			if (this.activeCabal && this.activeCabal.plaintextKey === plaintextKey){
				this.activeCabal = null;
			}
			var idx = this.plaintextCabalKeys.indexOf(plaintextKey);
			if(idx >-1){
				this.plaintextCabalKeys.splice(idx,1);
				store.set('plaintextCabalKeys',this.plaintextCabalKeys);
			}
		},
		setChannel(channelName){
			this.currentChannel = channelName;
		},
		addCabalPrompt(){
			this.$refs.prompt.prompt({question:"Enter an invite code or key (leave blank to create a new one):"},(result)=>{
				if (result === false){
					return;// cancelled
				}
				else if(result === ''){
					this.switchToCabal(null);// empty
				}else{
					this.switchToCabal(result);// entered key
				}
			})
		}
	},
	computed:{
		activeCabalKey:function(){
			return this.activeCabal?this.activeCabal.key:null;
		},
		activeCabalPlaintextKey:function(){
			return this.activeCabal?this.activeCabal.plaintextKey:null;
		}
	}
});

var loadCabal = (plaintextKey,done)=>{
	var key = cabalKeyForString(plaintextKey);

	if (cabalCache[plaintextKey]){
		return done(null,cabalCache[plaintextKey]);
	}
	let homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	let rootdir = homedir + '/.cabal-clone/archives/';
	let dir = rootdir + key;

	let cabal = Cabal(dir,key);

	let ready = (er,cabal)=>{
		if(er){
			return done(er);
		}else{
			swarm(cabal);
			cabalCache[plaintextKey] = cabal;
			cabal.plaintextKey = plaintextKey;
			return done(er,cabal);
		}
	}

	cabal.db.ready(()=>{
		if(key){
			ready(null,cabal);
		}else{
			cabal.getLocalKey((er,k)=>{
				ready(er,cabal);
			});
		}
	});

}

var randomKey = function(){
	if(crypto.randomBytes){
		return crypto.randomBytes(32).toString('hex');
	}else if (crypto.getRandomValues){
		return Array.prototype.slice.call(crypto.getRandomValues(new Uint8Array(32)))
			.map(n=>{
				var s = n.toString(16);
				while(s.length < 2){s = '0'+s}
			})
			.join('');
	}else{
		var r = [];
		for (var i = 0; i < 32; i ++){
			r.push(Math.floor(256*Math.random()));
		}
		return r.map(n=>{
			var s = n.toString(16);
			while(s.length < 2){s = '0'+s}
		})
		.join('');
	}
}

var cabalCache = {}
