
module.exports = {

  template:`
    <div class="title-bar">
      <img class="title-bar-icon" src="icon.png"/>
      <span class="title-bar-title">Cabal Clone</span>
      <span class="title-bar-end">
        <a class="button button__light title-bar-button" @click="minimize">—&#xFE0E;</a>
        <a class="button button__light title-bar-button" @click="maximize">⬜&#xFE0E;</a>
        <a class="button button__light button__close title-bar-button" @click="close">✖&#xFE0E;</a>
      </span>
    </div>
    `,
    methods:{
      close:function(){
        window.close();
      },
      maximize:function(){
        window.ipcRenderer.send('maximize');
      },
      minimize:function(){
        window.ipcRenderer.send('minimize');
      }
    }
}
