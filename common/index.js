const Vue = require('vue/dist/vue.js');
const fs = require('fs-extra');
var Cabal = require('cabal-core');
// var Cabal = require('../common/cabal-dummy')

var store = require('../common/store')
var crypto = require('crypto');
const cabalKeyForString = require('../common/cabal-key-for-string')

var swarm = require('cabal-core/swarm');

var defaultCabals = [
	'0139fb0c42cd0ac9157d0ed31a4335e6ccb024c9f8800ffdfa6bb6ea93085953'// my local test cabal
];

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
	'username'
];

components.forEach(componentName=>{
	Vue.component(componentName,require('../common/components/'+componentName+'.js'));
});

const appView = new Vue({
	el:"#app",
	template:`
		<div class="app">
			<div class="sidebar">
				<div class="sidebar-left">
					<div class="cabals">
						<span class="sidebar-header">cabals</span>
						<cabal-select v-for="k in plaintextCabalKeys"
							:plaintextKey="k"
							:key="k"
							:active="activeCabalPlaintextKey == k"
							@click.native="switchToCabal(k)"
						>
						</cabal-select>
						<a class="sidebar-item" @click="addCabalPrompt"><span class="plus-icon"></span>Add</a>
						<!--
							<a class="sidebar-item" @click="switchToCabal(null)">New</a>
							<div class="sidebar-item">
								<input type="text" v-model="keyToJoin" placeholder="put cabal key here"></input>
								<a class="button" @click="joinCabal">&nbsp;Join</a>
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
			<chat v-if="activeCabal" :cabal="activeCabal" :channel="currentChannel">
			</chat>
			<modal-prompt ref="prompt"/>
		</div>
	`,
	data:{
		plaintextCabalKeys:store.getOrCreate('plaintextCabalKeys',defaultCabals),// List<String>
		keyToJoin:'',
		currentChannel:"default",
		activeCabal:null
	},
	methods:{
		switchToCabal(key){
			// validate the key first


			console.log('switching to key '+key)

			loadCabal(key,(er,cabal)=>{
				if(er){
					alert(er);
					console.error(er);
					return;
				}

				this.activeCabal = cabal;
				if(this.plaintextCabalKeys.indexOf(cabal.plaintextKey) == -1){
					this.plaintextCabalKeys.push(cabal.plaintextKey);
					store.set('plaintextCabalKeys',this.plaintextCabalKeys);
				}

			})
		},
		setChannel(channelName){
			this.currentChannel = channelName;
		},
		addCabalPrompt(){
			this.$refs.prompt.prompt({question:"Enter a cabal key (leave blank to create a new one):"},(result)=>{
				console.log('?')
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
	var key = plaintextKey;
	if(key){
		var edKey = key.replace(/cabal:\/\/|[^\w\d]/ig,'');
		if (edKey.length == 64){
			key = cabalKeyForString(edKey);
		}else{
			key = cabalKeyForString(plaintextKey);
		}
	}else{
		key = randomKey();
	}

	if (cabalCache[plaintextKey]){
		return done(null,cabalCache[plaintextKey]);
	}
	let homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	let rootdir = homedir + '/.cabal-clone/archives/';
	let dir = rootdir + (key?key:'');

	let cabal = Cabal(dir,key);

	let ready = (er,cabal)=>{
		if(er){
			return done(er);
		}else{
			swarm(cabal);
			cabalCache[key] = cabal;
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
