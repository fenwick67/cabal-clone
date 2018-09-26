module.exports = {
  data:function(){return {}},
  props:['cabalKey','active'],
  template:`
  <a
    :class="[{ 'cabal-select__active': active },'cabal-select','sidebar-item']"
    :title="cabalKey"
  >
    {{cabalKey | shorten(14)}}
  </a>`,
  methods:{
    addCabal:function(){
      this.$emit('addCabal');
    }
  }
}
