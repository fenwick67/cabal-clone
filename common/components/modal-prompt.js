module.exports = {

  template:`
    <div class="modal-ancestor">
      <div class="modal-background" v-show="showing">
        <div class="modal">
          <span class="modal-content">
            <p>{{question}}</p>
            <input v-model="text" ref="textinput"/>
          </span>
          <span class="modal-bottom">
            <button class="button" @click="ok">ok</button>
            <button class="button" @click="cancel">cancel</button>
          </span>
        </div>
      </div>
    </div>
  `,
  data:function(){
    return {
      text:'',
      _doneFn:null,
      showing:false,
      question:''
    };
  },
  methods:{
    prompt:function(options,doneFn){

      this.question = options.question;
      this._doneFn = doneFn;
      // now show
      this.showing = true;
    },
    cancel:function(){
      if (this._doneFn){
        this._doneFn(false);
      }
      this.reset();
    },
    ok:function(){
      if(this._doneFn){
        this._doneFn(this.text);
      }
      this.reset();
    },
    reset:function(){
      this._doneFn=null;
      this.showing = false;
      this.text="";
    }
  },
  watch:{
    showing:function(newVal){
      if(newVal){
        setTimeout(x=>{
          this.$refs.textinput.focus();
        },1)
      }
    }
  }

}
