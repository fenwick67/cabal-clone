var Client = require('cabal-client')

module.exports = {
  data:function(){return {}},
  props:['plaintextKey','active'],
  template:`
  <a
    :class="[{ 'cabal-select__active': active },'cabal-select','sidebar-item','sidebar-item__pilled']"
    :title="plaintextKey"
    @click="select"
  >
    <span>{{key | shorten(14)}}</span>
    <a class="focusable remove-cabal" title="remove" @click.stop.prevent="remove">−</a>
  </a>`,
  methods:{
    select:function(){
      console.log('select')
      this.$emit('select',this.plaintextKey);
    },
    remove:function(){
      console.log('remoof')
      this.$emit('remove',this.plaintextKey)
    }
  },
  computed: {
    key:function(){
      return Client.scrubKey(this.plaintextKey)
    }
  }
}
