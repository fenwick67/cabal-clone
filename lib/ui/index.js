const Vue = require('vue/dist/vue.js');
// var Cabal = require('../common/cabal-dummy')

var store = require('../lib/ui/store')
var crypto = require('crypto');

var defaultCabals = [];

const filters = require('../lib/ui/filters');
Object.keys(filters).forEach(k=>{
	Vue.filter(k,filters[k])
});

var CabalClient = require('cabal-client');
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
							<cabal-select v-for="k in cabalKeys"
								:plaintextKey="k"
								:key="k"
								:active="activeCabalPlaintextKey == k"
								@select="switchToCabal(k)"
								@remove="removeCabal(k)"
							>
							</cabal-select>
							<a class="sidebar-item " @click="addCabalPrompt"><span class="plus-icon"></span>Add</a>
					</div>
					</div>
					<div class="sidebar-right">
						<channel-select
							v-if="activeCabal && activeCabal.key"
							:channels="channels"
							:currentChannel="currentChannel"
							@channelChanged="setChannel">
						</channel-select>
					</div>
				</div>
				<chat
					v-if="activeCabal"
					:cabalClient="cabalClient"
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
		cabalKeys:store.getOrCreate('cabalKeys',defaultCabals),// List<String>
		currentChannel:"default",
		channels:[],
		cabalClient: null,
		activeCabal: null,
		loading:false,
		isMobile:!!window.isMobile
	},	
	methods:{
		switchToCabal(plaintextKey){
			/**  @type {CabalClient} */
			var cabalClient = this.cabalClient

			this.loading = true;
			var key = plaintextKey ? CabalClient.scrubKey(plaintextKey) : null

			if (!key){
				cabalClient.createCabal().then(cabalDetails=>{
					if (this.cabalKeys.indexOf(cabalDetails.key) == -1){
						this.cabalKeys.push(cabalDetails.key)
					}
					cabalClient.focusCabal(cabalDetails.key)
					this.activeCabal = details
					this.loading=false
					details.on('update', this.uiUpdate) // TODO don't duplicate these listeners
				})
			} else {
				var details = null
				var spent = false
				if (this.cabalKeys.indexOf(plaintextKey) == -1){
					this.cabalKeys.push(plaintextKey)
				}

				var maybeReady = ()=>{
					if (details && !spent){
						spent = true
						cabalClient.focusCabal(details.key)
						this.activeCabal = details
						details.on('update', this.uiUpdate) // TODO don't duplicate these listeners
						details.joinChannel('default')
						this.loading=false
					}
				}

				cabalClient.addCabal(plaintextKey, ()=>{
					// initialized
					maybeReady()
				}).then(d=>{
					details=d
					maybeReady()
				})
			}

		},
		removeCabal(plaintextKey){
			this.cabalClient.removeCabal(CabalClient.scrubKey(plaintextKey))
			this.cabalKeys.splice(this.cabalKeys.indexOf(plaintextKey),1)
		},
		setChannel(channelName){
			if (this.activeCabal.getCurrentChannel() != channelName){
				this.activeCabal.focusChannel(channelName);
				this.currentChannel = channelName;
			}
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
		},
		uiUpdate(cabalDetails){
			if (cabalDetails.key == this.activeCabal.key){
				this.channels = cabalDetails.getChannels()
				this.channel = cabalDetails.getCurrentChannel()
			}
		}
	},
	computed:{
		activeCabalKey:function(){
			return this.activeCabal ? this.activeCabal.key : null
		},
		activeCabalPlaintextKey:function(){
			return this.activeCabal ? this.activeCabal.key : null
		}
	}, 
	watch: {
		cabalKeys: function(newVal,oldVal){
			store.set('cabalKeys',newVal)
		}
	},
	created(){
				
		let homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
		let rootdir = homedir + '/.cabal-clone/archives/'

		this.cabalClient = new CabalClient({				
			maxFeeds: 1000,
			config: {
				dbDir: rootdir,
				temp: false
			},
			persistentCache:{
				read: async function(name, err){
					return store.get("dns:" + name)
				},
				write: async function(name, key, ttl){
					store.set("dns:" + name, key)
				}
			}
		})

	}
});
