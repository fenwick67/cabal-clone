
/*

exports a server (and client) to be used with rpc.

Create one for each cabal you open.

Returns a wrapper 

// create a server to handle all cabal requests
require('cabal-rpc').Server()

*/

const collect = require('collect-stream');
const thunky = require('thunky');


function Server(...args){
    var rpcServer = require('../common/rpc/get-server-channel');
    if (args.length > 0){
        rpcServer = rpcServer(...args);
    }

    var cabalKeyForString = require('../common/cabal-key-for-string');
    var Cabal = require('cabal-core'); // NOTE: not a top-level require() because I don't want UI layer to call this
    var swarmCabal = require('cabal-core/swarm'); // same as above

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
            
            cabal.ready((er)=>{
                if(er){
                    return callback(er);
                }else{
                    cabal.messages.events.on('message',function(...args){
                        rpcServer.emit('message:'+plaintextKey,...args)
                    });

                    let swarm = swarmCabal(cabal);
                    cabalCache[plaintextKey] = cabal;

                    // I'm adding these properties to the Cabal
                    cabal.plaintextKey = plaintextKey;
                    cabal.swarm = swarm;
                    cabal.peerList = [];

                    cabal.on('peer-added',(id)=>{
                        cabal.peerList.push(id);
                        rpcServer.emit('peer-added:'+plaintextKey,id)
                    })
                    cabal.on('peer-dropped',(id)=>{
                        var idx = cabal.peerList.indexOf(id);
                        if (idx > -1){
                            cabal.peerList.splice(idx,1)
                        }
                        rpcServer.emit('peer-dropped:'+plaintextKey,id)
                    })

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
                  channel: channel
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

    // same as cabal.users.getAll, except it tracks the online presence of the user
    rpcServer.registerAsyncHandler('getUsers',function(plaintextKey,done){
        loadCabal(plaintextKey,(er,cabal)=>{
            if(er){return er(done)}
            cabal.users.getAll((er,users)=>{
                if(er){
                    return done(er);
                }
                Object.keys(users).forEach(key=>{
                    users[key].online = (cabal.peerList.indexOf(key) > -1);
                });
                return done(null,users);
            });
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


module.exports = Server;
