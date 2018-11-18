/*

RPC module. Useful for making RPC functions work across seperate contexts.

messageSender needs to be a function that accepts a JSON object and sends it (to the other side)
messageListener needs to be a function that sets the interface's handler for incoming messages. One example would be...

// server side

var server = rpc.server(sendData,listen);
server.registerSyncHandler('square',a=>a*a);
setInterval(x=>{
    server.emit('clockTick',date.now())
},1000)


// on the client side now you can...

var client = rpc.client(someSendMethod,someListenMethod);
client.callMethod('square',2,(er,result)=>{
    console.log(result);// 4
})
client.on('clockTick',console.log);

*/
var rpcClient = function(sendMessage,listenForMessages){
    var callbacks = {} // id:callback
    var listeners = {} // 'eventName':[listener1,listener2]
    var sendMessage = sendMessage;

    listenForMessages(message=>{
        if(message.type=='rpcResult'){
            var callback = callbacks[message.id];
            if(!callback){
                return console.warn('no callback for rpc message ID ',message.id)
            }
            callback(message.error,message.result);
        }else if(message.type=='event'){
            var args = message.arguments;
            if (listeners[message.eventName]){
                listeners[message.eventName].forEach(listener=>{
                    listener.call(listener,...args);
                })
            }
        }
    });

    function on(eventName,callback){
        if(!listeners[eventName]){
            listeners[eventName] = [];
        }
        listeners[eventName].push(callback);
    }

    function off(eventName,callback){
        if(!listeners[eventName]){
            return;// not listening for this event
        }
        var i = listeners[eventName].indexOf(callback);
        if(i == -1){
            return; // don't have this listener
        }else{
            listeners[eventName].splice(i,1);
        }
    }

    return {
        callMethod:function(funcName,...args){
            var callback = args.pop();
            var id = genId();
            callbacks[id] = callback;
            sendMessage({type:"rpcRequest",id:id,method:funcName,arguments:args});
        },
        on:on,
        off:off,
        addEventListener:on,
        removeEventListener:off
    }


}


var rpcServer = function(sendMessage,listenForMessages){
    var sendMessage = sendMessage;

    var handleError = function(e){
        console.log(e);
    }

    var handlers = {
        // name: {async:true,func:function}
    }

    listenForMessages(message=>{
        if (message.type == 'rpcRequest'){
            if(handlers[message.method]){
                if (!handlers[message.method].async){
                    // synchronous
                    var args = message.arguments;
                    var result = null;
                    var error = null;
                    try{
                        var func = handlers[message.method].func;
                        result = func.call(func,...args);
                    }catch(e){
                        error = e;
                    }
                    sendMessage({type:"rpcResult",id:message.id,result:result,error:error});

                }else{
                    // async
                    var args = message.arguments;
                    handlers[message.method].func(...args,function(er,res){
                        var error = er?er.toString():null;
                        var result = ((typeof res=='undefined')?null:res);
                        sendMessage({type:"rpcResult",id:message.id,result:result,error:error})
                    })
                }
            }
        }
    })


    return {
        // when somebody calls setUsername('joe',cb), we will set the username and send a message back out
        registerSyncHandler:function(functionName,func){
            handlers[functionName] = {async:false,func:func}
        },
        registerAsyncHandler:function(functionName,func){
            handlers[functionName] = {async:true,func:func}
        },
        emit:function(eventName,...args){
            console.log('emitting',eventName)
            sendMessage({type:'event',eventName:eventName,arguments:args})
        }
    }
}

var idCounter = 0;
function genId(){
    return idCounter++;
}


exports.server = rpcServer;
exports.client = rpcClient