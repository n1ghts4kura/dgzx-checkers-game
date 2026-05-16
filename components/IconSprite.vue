<template>
  <text
    class="icon-sprite"
    :style="{ fontSize: size + 'px', width: size + 'px', height: size + 'px' }"
  >{{ ligatureName }}</text>
</template>

<script>
const LIGATURE_MAP = {
  add_circle: 'add_circle',
  grid_on: 'grid_on',
  apps: 'apps',
  menu_open: 'menu_open',
  settings: 'settings',
  arrow_back: 'arrow_back',
  undo: 'undo',
  refresh: 'refresh',
  hint: 'lightbulb'
}

export default {
  name: 'IconSprite',
  props: {
    name: {
      type: String,
      required: true,
      validator: (v) => ['add_circle', 'grid_on', 'apps', 'menu_open', 'settings', 'arrow_back', 'undo', 'refresh', 'hint'].includes(v)
    },
    size: {
      type: [Number, String],
      default: 24
    }
  },
  computed: {
    ligatureName() {
      return LIGATURE_MAP[this.name] || this.name
    }
  }
}
</script>

<style>
.icon-sprite {
  font-family: 'Material Symbols Outlined', sans-serif;
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  display: inline-block;
  white-space: nowrap;
  flex-shrink: 0;
  overflow: hidden;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
