// create an RPC server channel, either via a dummy module or ipc or something

var system;
const rpc = require('./rpc')
var cordova;
try{
    cordova = require('cordova-bridge');
}catch(e){
    cordova = null;
}

if(cordova){

    var sendMessage = function(msg){
        cordova.channel.send(msg)
    }
    
    var listenForMessages = function(onMessage){
        cordova.channel.on('message',onMessage);
    }

    module.exports = rpc.server(sendMessage,listenForMessages);

}else{

    // dummy channel

    module.exports = rpc.server(dummyChannel.server.sendMessage,dummyChannel.server.listen);

}