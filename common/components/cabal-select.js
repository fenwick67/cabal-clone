module.exports = {
  data:function(){return {}},
  props:['plaintextKey','active'],
  template:`
  <a
    :class="[{ 'cabal-select__active': active },'cabal-select','sidebar-item']"
    :title="plaintextKey"
  >
    {{plaintextKey | shorten(14)}}
  </a>`
}
