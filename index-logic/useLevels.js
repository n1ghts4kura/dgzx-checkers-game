import { ref, computed } from 'vue'
import { MAX_LOCAL_MAPS } from '@/game-core/constants.js'

const DEFAULT_MAP_STR = 'eyJvYnN0YWNsZXMiOltbNyw2LCIjRkZENzAwIl0sWzgsNCwiI0RDMTQzQyJdLFsxMCw0LCIjRkZENzAwIl0sWzExLDYsIiNBMDIwRjAiXSxbMTQsOCwiIzMyODJGRiJdXSwicGxheWVyIjpbMTMsN10sInNvbHV0aW9uUGF0aCI6W1sxMyw3XSxbMTUsOF0sWzcsNF0sWzksM10sWzExLDRdLFszLDhdXX0='

export function useLevels() {
  const localMaps = ref([])
  const activeLevelIndex = ref(0)

  const levelNames = computed(() => localMaps.value.map(m => m.map_name))

  const currentMapName = computed(() => levelNames.value[activeLevelIndex.value] || '棋盘')

  function initDefaultLocalMaps() {
    localMaps.value = [
      { map_name: '决赛地图', map_str: DEFAULT_MAP_STR }
    ]
    uni.setStorageSync('local_maps', localMaps.value)
  }

  function loadLevelsFromStorage() {
    try {
      const stored = uni.getStorageSync('local_maps')
      if (stored && Array.isArray(stored) && stored.length > 0) {
        localMaps.value = stored
      } else {
        initDefaultLocalMaps()
      }
    } catch (e) {
      initDefaultLocalMaps()
    }
  }

  function refreshLevelsFromStorage() {
    try {
      const stored = uni.getStorageSync('local_maps')
      if (stored && Array.isArray(stored)) {
        localMaps.value = stored
      }
    } catch (e) { /* ignore */ }
  }

  function checkPendingSwitch(onSwitch) {
    try {
      const pending = uni.getStorageSync('pending_switch_to_last')
      if (pending && localMaps.value.length > 0) {
        uni.removeStorageSync('pending_switch_to_last')
        const newIndex = localMaps.value.length - 1
        if (onSwitch) onSwitch(newIndex)
      }
    } catch (e) { /* ignore */ }
  }

  function getCurrentMap() {
    return localMaps.value[activeLevelIndex.value] || null
  }

  function saveMapToStorage(name, base64Str) {
    let maps = []
    try {
      const stored = uni.getStorageSync('local_maps')
      if (stored && Array.isArray(stored)) {
        maps = stored
      }
    } catch (e) { /* ignore */ }

    maps.push({ map_name: name, map_str: base64Str })
    while (maps.length > MAX_LOCAL_MAPS) maps.shift()
    uni.setStorageSync('local_maps', maps)
    localMaps.value = maps
    uni.setStorageSync('pending_switch_to_last', true)
  }

  function confirmDelete(index) {
    if (index < 0 || index >= localMaps.value.length) return

    localMaps.value.splice(index, 1)
    uni.setStorageSync('local_maps', localMaps.value)

    if (localMaps.value.length === 0) {
      initDefaultLocalMaps()
      activeLevelIndex.value = 0
    } else if (activeLevelIndex.value >= localMaps.value.length) {
      activeLevelIndex.value = localMaps.value.length - 1
    } else if (index === activeLevelIndex.value) {
      // same index stays selected (next item shifted up)
    } else if (index < activeLevelIndex.value) {
      activeLevelIndex.value--
    }
  }

  function switchToLevel(index) {
    activeLevelIndex.value = index
  }

  return {
    localMaps,
    activeLevelIndex,
    levelNames,
    currentMapName,
    loadLevelsFromStorage,
    refreshLevelsFromStorage,
    checkPendingSwitch,
    initDefaultLocalMaps,
    getCurrentMap,
    saveMapToStorage,
    confirmDelete,
    switchToLevel
  }
}
