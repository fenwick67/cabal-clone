const shajs = require('sha.js')

// create a cabal key for an arbitrary string
module.exports = function cabalKeyForString(str){

	// if it's just a cabal key
	if (str.replace(/[^\w\d]/g).length == 64){
		return str.replace(/[^\w\d]/g);
	}

	// generate one based on string input
	return shajs('sha256')
		.update('cabal-clonev0','utf8')
		.update(str,'utf8')
		.digest('hex');
}
