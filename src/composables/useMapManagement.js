import { ref } from 'vue';

/**
 * 地图管理的可组合函数
 */
export function useMapManagement() {
  const mapLoaded = ref(false);
  const resizeListenerAttached = ref(false);
  const mapWidth = ref(0);
  const mapHeight = ref(0);
  const mapAspectRatio = ref(1.82);

  /**
   * 地图加载完成处理
   */
  const handleMapLoaded = (mapImageRef, onResize) => {
    console.log('Map loaded');
    mapLoaded.value = true;
    updateMapAspectRatio(mapImageRef);
    
    if (!resizeListenerAttached.value) {
      window.addEventListener('resize', onResize);
      resizeListenerAttached.value = true;
    }
    
    onResize();
  };

  /**
   * 更新地图尺寸
   */
  const updateMapSize = (mapImageRef) => {
    const mapEl = mapImageRef?.$el;
    if (!mapEl) return;
    mapWidth.value = mapEl.clientWidth;
    mapHeight.value = mapWidth.value * mapAspectRatio.value;
  };

  /**
   * 更新地图宽高比
   */
  const updateMapAspectRatio = (mapImageRef) => {
    const imgEl = mapImageRef?.$el?.querySelector('img');
    if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
      mapAspectRatio.value = imgEl.naturalHeight / imgEl.naturalWidth;
    }
  };

  /**
   * 清理监听器
   */
  const cleanup = (onResize) => {
    if (resizeListenerAttached.value) {
      window.removeEventListener('resize', onResize);
    }
  };

  return {
    mapLoaded,
    mapWidth,
    mapHeight,
    mapAspectRatio,
    handleMapLoaded,
    updateMapSize,
    cleanup,
  };
}
