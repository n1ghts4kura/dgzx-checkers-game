<template>
  <image
    class="icon-sprite"
    :src="iconSrc"
    :style="{ width: size + 'px', height: size + 'px' }"
    mode="aspectFit"
  />
</template>

<script>
const ICON_MAP = {
  add_circle: '/static/icons/add_circle@3x.png',
  grid_on: '/static/icons/grid_on@3x.png',
  apps: '/static/icons/apps@3x.png',
  menu_open: '/static/icons/menu_open@3x.png',
  settings: '/static/icons/settings@3x.png',
  arrow_back: '/static/icons/arrow_back@3x.png',
  undo: '/static/icons/undo@3x.png',
  refresh: '/static/icons/refresh@3x.png',
  hint: '/static/icons/hint@3x.png'
}

export default {
  name: 'IconSprite',
  props: {
    name: {
      type: String,
      required: true,
      validator: (v) => Object.keys(ICON_MAP).includes(v)
    },
    size: {
      type: [Number, String],
      default: 24
    }
  },
  computed: {
    iconSrc() {
      return ICON_MAP[this.name] || ''
    }
  }
}
</script>

<style scoped>
.icon-sprite {
  display: inline-block;
  flex-shrink: 0;
}
</style>
