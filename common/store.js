// local storage engine for small config items


const store = {
  get:function(key){
    var s = localStorage.getItem(key);
    if(typeof s !== 'string'){
      return null;
    }else{
      return JSON.parse(s);
    }
  },
  set:function(key,value){
    localStorage.setItem(key,JSON.stringify(value));
  },
  getOrCreate:function(key,value){
    var retreived = store.get(key);
    if(retreived === null){
      store.set(key,value);
      return value;
    }else{
      return retreived;
    }
  }
}

module.exports = store
