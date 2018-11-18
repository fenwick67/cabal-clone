/*

exports a server (and client) to be used with rpc.

Create one for each cabal you open.

Returns a wrapper 

// create a server to handle all cabal requests
require('cabal-rpc').Server()

// create a client to send requests through
var client = require('cabal-rpc').Client('Super Mario 64')


Client methods: 

client.sendMessage(channel,text,callback(er))
client.getMessages(channel,[max],callback(messages,er))
client.getChannels((channels,er)=>)
client.getUser(callback(user,er))
client.setUsername(name,er=>)

events:

client.on('message',(er,msg)=>


*/

const collect = require('collect-stream');
const thunky = require('thunky');


function Server(...args){
    var rpcServer = require('./rpc/get-server-channel');
    if (args.length > 0){
        rpcServer = rpcServer(...args);
    }

    var cabalKeyForString = require('./cabal-key-for-string');
    var Cabal = require('cabal-core'); // NOTE: not a top-level require() because I don't want UI layer to call this
    var swarm = require('cabal-core/swarm'); // same as above

    var cabalCache = {}
    var queuedFuncs = {}
    
    var loadCabal = (plaintextKey,done)=>{

        var key = cabalKeyForString(plaintextKey);

        // we already loaded this LOL
        if (cabalCache[plaintextKey]){
            return done(null,cabalCache[plaintextKey]);
        }

        // cabal is either loading currently or not loaded at all.
        // if we tried to load, the thunky function is already there.
        // if not, we have to create it.
        // thunky will handle calling any stacked callbacks once when the cabal finishes loading.
        queuedFuncs[plaintextKey] = queuedFuncs[plaintextKey] || thunky(function(callback){
            let homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
            let rootdir = homedir + '/.cabal-clone/archives/';
            let dir = rootdir + key;

            let cabal = Cabal(dir,key);           
            
            cabal.db.ready((er)=>{
                if(er){
                    return callback(er);
                }else{
                    cabal.messages.events.on('message',function(...args){
                        rpcServer.emit('message:'+plaintextKey,...args)
                    });

                    swarm(cabal);
                    cabalCache[plaintextKey] = cabal;
                    cabal.plaintextKey = plaintextKey;
                    return callback(er,cabal);
                }
            });
        });
        
        queuedFuncs[plaintextKey](done);
        

    };


    // actual methods that will be exposed by the server

    // send a message by text
    rpcServer.registerAsyncHandler('sendMessage',function(plaintextKey,channel,text,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return done(er)}
            var entry = {
                type: 'chat/text',
                content: {
                  text: text,
                  channel: channel.toLowerCase()
                }
              };
            
            cabal.publish(entry,done);
        })
    });

    rpcServer.registerAsyncHandler('setNick',function(plaintextKey,nick,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            cabal.publishNick(nick,done);
        });
    });

    rpcServer.registerAsyncHandler('getUser',function(plaintextKey,userid,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            cabal.users.get(userid,done);
        });
    });

    rpcServer.registerAsyncHandler('getMessages',function(plaintextKey,channel,opts,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            var messageStream = cabal.messages.read(channel,opts);
            collect(messageStream, done);
        });
    });

    rpcServer.registerAsyncHandler('getChannels',function(plaintextKey,channel,opts,done){
        
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            cabal.channels.get(channel,opts,done);
        });
    });

    rpcServer.registerAsyncHandler('getLocalKey',function(plaintextKey,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            cabal.getLocalKey(done);
        });
    });


    return this;


}

class RemoteCabal extends require('events').EventEmitter {

    constructor(plaintextKey){
        super();
        // connect to rpc Server
        var cabalKeyForString = require('./cabal-key-for-string');
        var rpcClient = require('./rpc/get-client-channel');

        this.plaintextKey = plaintextKey;
        this.key = cabalKeyForString(plaintextKey);

        // generate functions that will call an rpc method with a cabal key as the first argument.
        var generateKeyedProxyMethod = (name)=>{
            return (...args)=>{
                rpcClient.callMethod(name,this.plaintextKey,...args);
            }
        }

        this.sendMessage = generateKeyedProxyMethod('sendMessage');
        this.setNick = generateKeyedProxyMethod('setNick');
        this.getMessages = generateKeyedProxyMethod('getMessages');
        this.getUser = generateKeyedProxyMethod('getUser');
        this.getChannels = generateKeyedProxyMethod('getChannels');
        this.getLocalKey = generateKeyedProxyMethod('getLocalKey');

        rpcClient.on('message:'+plaintextKey,(...args)=>{
            this.emit('message',...args);
        })

    }

}

exports.Server = Server;
exports.RemoteCabal = RemoteCabal;
exports.CabalClient = RemoteCabal;
exports.Client = RemoteCabal;


// helper 


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