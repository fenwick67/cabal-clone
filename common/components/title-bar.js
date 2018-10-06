module.exports = {

  template:`
    <div class="title-bar">
      <img class="title-bar-icon" src="icon.png"/>
      <span class="title-bar-title">Cabal Clone</span>
      <span class="title-bar-end">
        <a class="button button__light title-bar-button" @click="close">✖</a>
      </span>
    </div>
    `,
    methods:{
      close:function(){
        window.close();
      }
    }
}
