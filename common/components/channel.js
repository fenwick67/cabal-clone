module.exports = {
  data:function(){return {}},
  props:['active','channel'],
  template:`
  <div class="channel">
    #{{channel}}{{active?'*':''}}
  </div>`
}
