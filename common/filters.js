var _ = require('lodash')

module.exports = {
  time:function(ts){
    var d = new Date(ts);
    return d.getHours()%12 + ':'+_.padStart(d.getMinutes(),2,'0');
  },
  shorten(str,len){
    var len = len;
    if(!len){
      len = 10;
    }
    if (str.length > len){
      return str.slice(0,len-1)+'…';
    }else{
      return str
    }
  }
}
