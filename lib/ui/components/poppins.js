module.exports = {
    data:function(){
        return {
            active:false,
            computedTop:0
        }
    },
    template:`
        <div>
            <div @click.prevent="toggle" @mouseleave="toggleOff" class="tooltip-parent">
                <slot name="button" ref="button"></slot>
                <div class="tooltip" ref="tooltip" v-if="active" :style="{top:computedTop}">
                    <slot name="tooltip"></slot>
                </div>
            </div>
            <slot/>
        </div>
    `,
    methods:{
        toggle:function(){
            this.active=!this.active;
            this.computePosition();
        },
        toggleOn:function(){
            this.active=true;
            this.computePosition();
        },
        toggleOff:function(){
            this.active = false;
            this.computePosition();
        },
        computePosition:function(){
            var button = this.$slots.button[0]
            if (!button) return;

            var buttonEl = button.elm;
            if (!buttonEl) return;
            
            this.computedTop = buttonEl.scrollHeight;
        }
    }
}