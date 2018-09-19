const Vue = require('vue/dist/vue.js');
const fs = require('fs-extra')
const components = ['cabal-select','channel','channel-select','chat'];
var Cabal = require('cabal-core');
// var Cabal = require('../common/cabal-dummy')

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
						<cabal-select v-for="k in cabalKeys"
							:cabalKey="k"
							:active="activeCabalKey == k"
							@click.native="switchToCabal(k)"
						>
						</cabal-select>
						<a href="#" @click="switchToCabal(null)">Create New Cabal</a>
						<div>
							<input type="text" v-model="keyToJoin" placeholder="put cabal key here"></input>
							<a href="#" @click="joinCabal">Join Cabal</a>
						</div>
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
		</div>
	`,
	data:{
		cabalKeys:['3ce433583266d7b2ed80e2b11fdc2f24b3643fa88e7602c6dc234f9228d25382'],// List<String>
		keyToJoin:'',
		currentChannel:"default",
		activeCabal:null
	},
	methods:{
		switchToCabal(key){
			console.log('switching to key '+key)
			// TODO validate the key first
			loadCabal(key,(er,cabal)=>{
				if(er){
					alert(er);
					console.error(er);
					return;
				}

				this.activeCabal = cabal;
				if(this.cabalKeys.indexOf(cabal.key) == -1){
					this.cabalKeys.push(cabal.key)
				}

			})
		},
		joinCabal(){
			if(!this.keyToJoin){console.log('no key to join');return;}
			this.switchToCabal(this.keyToJoin);
		},
		setChannel(channelName){
			this.currentChannel = channelName;
		}
	},
	computed:{
		activeCabalKey:function(){
			return this.activeCabal?this.activeCabal.key:null;
		}
	}
});

loadCabal = (key,ready)=>{
	var key = key || null;
	let homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	let rootdir = homedir + '/.cabal-store/archives/';
	let dir = rootdir + (key?key:'');

	let cabal = Cabal(dir,key);

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
