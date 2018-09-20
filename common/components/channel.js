module.exports = {
  data:function(){return {}},
  props:['active','channel'],
  template:`
  <a href="#" :class="[{ channel__active: active }, 'channel']">
    #{{channel}}
  </a>`
}
