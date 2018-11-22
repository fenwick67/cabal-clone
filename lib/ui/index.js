const Vue = require('vue/dist/vue.js');
var Cabal = require('cabal-core');
// var Cabal = require('../common/cabal-dummy')

var store = require('../lib/ui/store')
var crypto = require('crypto');

var defaultCabals = [];

const filters = require('../lib/ui/filters');
Object.keys(filters).forEach(k=>{
	Vue.filter(k,filters[k])
});

var CabalClient = require('../lib/ui/cabal-client');
var cabalKeyForString = require('../lib/common/cabal-key-for-string')

const components = [
	'cabal-select',
	'channel',
	'channel-select',
	'modal-prompt',
	'chat',
	'avatar',
	'username',
	'title-bar',
	'poppins'
];

components.forEach(componentName=>{
	Vue.component(componentName,require('../lib/ui/components/'+componentName+'.js'));
});

const appView = new Vue({
	el:"#app",
	template:`
		<div class="frame">
			<title-bar v-if="!isMobile"/>
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
						<li class="chat-entry"></li>
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
		isMobile:!!window.isMobile
	},
	methods:{
		switchToCabal(plaintextKey){

			console.log('switching to key '+plaintextKey)
			var actualKey = cabalKeyForString(plaintextKey);
			
			var cabal = new CabalClient(actualKey);
			this.activeCabal = cabal;
			
			var keyToUseForUi = plaintextKey;

			if (!plaintextKey){// empty key
				keyToUseForUi = actualKey;
			} else if(plaintextKey.toLowerCase().indexOf(actualKey) > -1){// cabal://DEADBEEF =>deadbeef
				keyToUseForUi = actualKey;
			}

			var idx = this.plaintextCabalKeys.indexOf(keyToUseForUi)
			if(idx == -1){
				this.plaintextCabalKeys.push(keyToUseForUi);
				store.set('plaintextCabalKeys',this.plaintextCabalKeys);
			}

		},
		removeCabal(plaintextKey){
			// TODO tear it down
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