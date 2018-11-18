// if you don't want to worry about network stuff

const { Readable } = require('stream');

const DummyReadable = function(){

  return new Readable({
    read(size) {
      this._destroy(null,(er)=>{
        if(er){console.error(er);}
      })
    }
  });

}

module.exports = function(something,key){

  var i = 1;
  var interval = null;
  var txQueue = [];

  var cabal =  {
    key:key,
    getLocalKey:function(cb){
      return cb(null,key)
    },
    publish:function(m,done){
      var message = {
        key:"98765432109876543210987654321098",
        value:{
          type: 'chat/text',
          timestamp:Date.now(),
          content: {
            text:m.content.text,
            channel:m.content.channel
          }
        }
      };
      txQueue.push(message);
      done(null);
    },
    db:{
      ready:function(cb){
        cb(null)
      }
    },
    channels:{
      get:function(callback){
        return callback(null,['default'])
      }
    },
    messages:{
      read:function(){
        return DummyReadable();
      },
      events:{
        on:function(channel,callback){
          // todo call callback occasionally
          interval = setInterval(function(){

            while(txQueue.length > 0){
              callback(txQueue.pop());
            }

            // TODO: wat does this object really look like?
            callback({
              key:"12345678901234568790123456789012",
              value:{
                type: 'chat/text',
                timestamp:Date.now(),
                content: {
                  text: 'message '+(i++),
                  channel: channel
                }
              }
            });

          },1000)
        },
        removeListener:function(channel,callback){
          if (interval){
            clearInterval(interval);
          }
        }
      }
    }
  };

  return cabal;
}
