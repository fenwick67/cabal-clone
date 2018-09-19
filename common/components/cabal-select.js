module.exports = {
  data:function(){return {}},
  props:['cabalKey','active'],
  template:`
  <a class="cabal-select" href="#">
    {{cabalKey}}{{active?'*':''}}
  </a>`,
  methods:{
    addCabal:function(){
      this.$emit('addCabal');
    }
  }
}
