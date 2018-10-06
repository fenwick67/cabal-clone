var _ = require('lodash')

module.exports = {
  time:function(ts){
    var d = new Date(ts);
    var hrs = (d.getHours()%12) || 12;
    var mins = _.padStart(d.getMinutes(),2,'0');
    return hrs+':'+mins;
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
