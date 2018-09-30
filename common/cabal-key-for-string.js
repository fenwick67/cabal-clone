const shajs = require('sha.js')

// create a cabal key for an arbitrary string
module.exports = function cabalKeyForString(str){

	// empty string / null => random new key
	if (!str){
		return randomKey();
	}

	// was passed an actual cabal://123abc key or just 64 chars
	var edKey = str.replace(/cabal:\/\/|[^\w\d]/ig,'');
	if (edKey.length == 64){
		return edKey;
	}

	// generate one based on string input
	return shajs('sha256')
		.update('cabal-clonev0','utf8')
		.update(str,'utf8')
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
