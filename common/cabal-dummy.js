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

module.exports = function(){

  var i = 1;
  var interval = null;
  var txQueue = [];

  var cabal =  {
    key:"TEST",
    getLocalKey:function(cb){
      return cb(null,"TEST")
    },
    publish:function(message,done){
      console.log('sending',message)
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
              type: 'text/chat',
              content: {
                text: 'message '+(i++),
                channel: channel
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
