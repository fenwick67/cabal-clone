/*

create a client to send requests through

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

class RemoteCabal extends require('events').EventEmitter {

    constructor(plaintextKey){
        super();
        // connect to rpc Server
        var cabalKeyForString = require('../common/cabal-key-for-string');
        var rpcClient = require('../common/rpc/get-client-channel');

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
        this.getUsers = generateKeyedProxyMethod('getUsers');
        this.getChannels = generateKeyedProxyMethod('getChannels');
        this.getLocalKey = generateKeyedProxyMethod('getLocalKey');

        rpcClient.on('message:'+plaintextKey,(...args)=>{
            this.emit('message',...args);
        })

        rpcClient.on('peer-added:'+plaintextKey,(...args)=>{
            this.emit('peer-added',...args);
        })

        rpcClient.on('peer-dropped:'+plaintextKey,(...args)=>{
            this.emit('peer-dropped',...args);
        })

        untilSuccess(cb=>{
            this.getLocalKey((er,key)=>{
                if(er) return cb(er)
                this.localKey = key;
                return cb(null);
            })
        })        
        

    }

}

module.exports = RemoteCabal;

var untilSuccess = (func,interval)=>{
    var interval = interval || 1000;
    var tryCalling = ()=>{
        func(er=>{
            if(er){
                setTimeout(tryCalling,interval)
            }else{
                // done :)
            }
        })
    }

    tryCalling();
    
}