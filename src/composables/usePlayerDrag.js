import { ref } from 'vue';

/**
 * 玩家拖拽功能的可组合函数
 */
export function usePlayerDrag(players, mapWidth, mapHeight) {
  // 状态
  const draggingIndex = ref(null);
  const dragParentRect = ref(null);
  const offsetX = ref(0);
  const offsetY = ref(0);

  const PLAYER_SIZE = 30; // 玩家直径

  /**
   * 计算玩家的像素X坐标
   */
  const getPlayerPixelX = (player) => {
    return player.xRatio * mapWidth.value - PLAYER_SIZE / 2;
  };

  /**
   * 计算玩家的像素Y坐标
   */
  const getPlayerPixelY = (player) => {
    return player.yRatio * mapHeight.value - PLAYER_SIZE / 2;
  };

  /**
   * 开始鼠标拖拽
   */
  const startDrag = (event, index, parentElement) => {
    event.preventDefault();
    dragParentRect.value = parentElement.getBoundingClientRect();
    draggingIndex.value = index;
    
    const rect = event.currentTarget.getBoundingClientRect();
    offsetX.value = event.clientX - rect.left;
    offsetY.value = event.clientY - rect.top;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  /**
   * 开始触摸拖拽
   */
  const startTouchDrag = (event, index, parentElement) => {
    event.preventDefault();
    dragParentRect.value = parentElement.getBoundingClientRect();
    draggingIndex.value = index;
    
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    offsetX.value = touch.clientX - rect.left;
    offsetY.value = touch.clientY - rect.top;
    
    document.addEventListener('touchmove', onTouchDrag, { passive: false });
    document.addEventListener('touchend', stopTouchDrag);
    document.addEventListener('touchcancel', stopTouchDrag);
  };

  /**
   * 鼠标拖拽中
   */
  const onDrag = (event) => {
    if (draggingIndex.value === null) return;
    event.preventDefault();

    const mouseX = event.clientX - dragParentRect.value.left;
    const mouseY = event.clientY - dragParentRect.value.top;
    
    updatePlayerPosition(mouseX, mouseY);
  };

  /**
   * 触摸拖拽中
   */
  const onTouchDrag = (event) => {
    if (draggingIndex.value === null) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    const touchX = touch.clientX - dragParentRect.value.left;
    const touchY = touch.clientY - dragParentRect.value.top;
    
    updatePlayerPosition(touchX, touchY);
  };

  /**
   * 更新玩家位置
   */
  const updatePlayerPosition = (x, y) => {
    const newX = x - offsetX.value;
    const newY = y - offsetY.value;
    
    const boundedX = Math.max(0, Math.min(mapWidth.value - PLAYER_SIZE, newX));
    const boundedY = Math.max(0, Math.min(mapHeight.value - PLAYER_SIZE, newY));
    
    players.value[draggingIndex.value].xRatio = (boundedX + PLAYER_SIZE / 2) / mapWidth.value;
    players.value[draggingIndex.value].yRatio = (boundedY + PLAYER_SIZE / 2) / mapHeight.value;
  };

  /**
   * 停止鼠标拖拽
   */
  const stopDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    draggingIndex.value = null;
  };

  /**
   * 停止触摸拖拽
   */
  const stopTouchDrag = () => {
    document.removeEventListener('touchmove', onTouchDrag);
    document.removeEventListener('touchend', stopTouchDrag);
    document.removeEventListener('touchcancel', stopTouchDrag);
    draggingIndex.value = null;
  };

  return {
    // 状态
    draggingIndex,
    
    // 方法
    getPlayerPixelX,
    getPlayerPixelY,
    startDrag,
    startTouchDrag,
  };
}
