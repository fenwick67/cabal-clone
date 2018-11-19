const shajs = require('sha.js')
const cabalCore = require('cabal-core');

// create a cabal key for an arbitrary string
module.exports = function cabalKeyForString(str){

	// empty string / null => random new key
	if (!str){
		return randomKey();
	}

	// was passed an actual cabal://123abc key or just 64 chars that are all hex
	var edKey = str.toLowerCase().replace(/cabal:\/\/|[^\w\d]/ig,'');
	var strippedKey = edKey.replace(/[^a-f0-9]/ig,'');
	if (edKey.length == 64 && strippedKey.length == 64){
		return edKey;
	}

	// generate one based on string input
	return shajs('sha256')
		.update('cabal-clonev0:'+cabalCore.protocolVersion+':'+str,'utf8')
		.digest('hex');
}


function randomKey(){
	if(crypto.randomBytes){
		return crypto.randomBytes(32).toString('hex');
	}else if (crypto.getRandomValues){
		return Array.prototype.slice.call(crypto.getRandomValues(new Uint8Array(32)))
			.map(n=>{
				var s = n.toString(16);
				while(s.length < 2){s = '0'+s}
				return s
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
			return s
		})
		.join('');
	}
}
