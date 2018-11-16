// singleton to send messages around back and forth to myself
// be sure both ends are running before trying to send messages

var channel = {
    client:{
        handleMessage:function(){},
        sendMessage:function(x){
            channel.server.handleMessage(x);
        },
        listen:function(handler){
            channel.client.handleMessage=handler;
        }
    },
    server:{
        handleMessage:function(){},
        sendMessage:function(x){
            channel.client.handleMessage(x);
        },
        listen:function(handler){
            channel.server.handleMessage=handler;
        }
    }
}

module.exports = channel;