// create an RPC client channel, either via a dummy module or ipc or something

const rpc = require('./rpc')
const dummyChannel = require('./channel-singleton')

if(typeof window != 'undefined' && window.isCordova){

    var sendMessage = function(msg){
        nodejs.channel.send(msg)
    }
    
    var listenForMessages = function(onMessage){
        nodejs.channel.on('message',onMessage)
    }

    module.exports = rpc.client(sendMessage,listenForMessages);

}else{

    // dummy channel

    module.exports = rpc.client(dummyChannel.client.sendMessage,dummyChannel.client.listen);

}