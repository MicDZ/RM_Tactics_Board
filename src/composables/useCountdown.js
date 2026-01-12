import { ref, watch } from 'vue';

/**
 * 倒计时功能的可组合函数
 */
export function useCountdown(initialTime = 420) {
  // 状态
  const time = ref(initialTime);
  const maxTime = ref(initialTime);
  const sliderValue = ref(initialTime);
  const sliderDragging = ref(false);
  const countdownInterval = ref(null);
  const tempCountdownState = ref(false);

  // 同步时间和滑块值
  watch(sliderValue, (val) => {
    time.value = val;
  });

  watch(time, (val) => {
    sliderValue.value = val;
  });

  /**
   * 格式化时间显示
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  /**
   * 滑块开始拖动
   */
  const onSliderStart = () => {
    sliderDragging.value = true;
    if (countdownInterval.value) {
      tempCountdownState.value = true;
      clearInterval(countdownInterval.value);
      countdownInterval.value = null;
    }
  };

  /**
   * 滑块结束拖动
   */
  const onSliderEnd = () => {
    sliderDragging.value = false;
    if (tempCountdownState.value) {
      startCountdown();
      tempCountdownState.value = false;
    }
  };

  /**
   * 开始倒计时
   */
  const startCountdown = () => {
    if (countdownInterval.value) {
      return { success: false, message: '倒计时已开始' };
    }
    
    countdownInterval.value = setInterval(() => {
      if (time.value > 0) {
        time.value--;
      } else {
        clearInterval(countdownInterval.value);
        countdownInterval.value = null;
      }
    }, 1000);
    
    return { success: true };
  };

  /**
   * 暂停倒计时
   */
  const pauseCountdown = () => {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
    return { success: true, message: '倒计时已暂停' };
  };

  /**
   * 重置倒计时
   */
  const resetCountdown = () => {
    time.value = maxTime.value;
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
    return { success: true, message: '倒计时已重置' };
  };

  /**
   * 设置最大时间
   */
  const setMaxTime = (newMaxTime) => {
    maxTime.value = newMaxTime;
    time.value = newMaxTime;
    sliderValue.value = newMaxTime;
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  };

  return {
    // 状态
    time,
    maxTime,
    sliderValue,
    sliderDragging,
    countdownInterval,
    
    // 方法
    formatTime,
    onSliderStart,
    onSliderEnd,
    startCountdown,
    pauseCountdown,
    resetCountdown,
    setMaxTime,
  };
}
