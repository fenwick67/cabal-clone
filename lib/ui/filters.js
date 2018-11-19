var _ = require('lodash')

const months = ['Jan','Feb','Mar','May','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
module.exports = {
  time:function(ts){

    var d = new Date(ts);
    var now = new Date();
    var hrs = d.getHours();
    var am = hrs < 12;
    var hrs = (d.getHours()%12) || 12;
    var mins = _.padStart(d.getMinutes(),2,'0');
    var time = hrs+':'+mins+' '+(am?'AM':'PM');

    if (d.toDateString() == now.toDateString()){
      return time
    }

    return months[d.getMonth()] +' '+ d.getDate() + ', '+d.getFullYear() + ' ' + time;

  },
  shorten(str,len){
    var len = len;

    var str = str || '';
    if(!len){
      len = 10;
    }
    if (str.length > len){
      return str.toString().slice(0,len-1)+'…';
    }else{
      return str
    }
  }
}
