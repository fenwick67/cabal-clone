module.exports = {
  data:function(){return {}},
  props:['active','channel'],
  template:`
  <a :class="[{ channel__active: active }, 'channel', 'sidebar-item']">
    #{{channel}}
  </a>`
}
