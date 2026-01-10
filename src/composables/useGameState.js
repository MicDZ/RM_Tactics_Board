import {
    BIG_BUFF_ACTIVATION_SECONDS,
    RMUL_COIN_BASE,
    RMUL_COIN_EVENTS,
    SMALL_BUFF_PERIODS,
} from '@/constants/gameConfig';
import { computed, ref } from 'vue';

/**
 * 游戏状态管理的可组合函数
 * 处理 buff 状态、金币计算等游戏逻辑
 */
export function useGameState(ruleSet, time, maxTime) {
  // 小符配置
  const smallBuffPeriods = ref(SMALL_BUFF_PERIODS);
  const bigBuffActivationSeconds = ref(BIG_BUFF_ACTIVATION_SECONDS);
  const rmulCoinBase = ref(RMUL_COIN_BASE);
  const rmulCoinEvents = ref(RMUL_COIN_EVENTS);

  /**
   * 计算小符状态文本
   */
  const smallBuffStatusText = computed(() => {
    const timeElapsed = maxTime.value - time.value;
    
    // 检查是否有正在激活的小符
    let activeIndex = -1;
    let minActiveEndTime = Infinity;
    
    for (let i = 0; i < smallBuffPeriods.value.length; i++) {
      const [start, end] = smallBuffPeriods.value[i];
      if (timeElapsed >= start && timeElapsed <= end) {
        if (end < minActiveEndTime) {
          minActiveEndTime = end;
          activeIndex = i;
        }
      }
    }
    
    if (activeIndex !== -1) {
      const [start, end] = smallBuffPeriods.value[activeIndex];
      const remainingTime = end - timeElapsed;
      return `小符激活中! 剩${Math.floor(remainingTime)}秒`;
    }
    
    // 找出最近即将到来的小符
    let nextBuffIndex = -1;
    let minTimeToNext = Infinity;
    
    for (let i = 0; i < smallBuffPeriods.value.length; i++) {
      const [start, end] = smallBuffPeriods.value[i];
      if (timeElapsed < start) {
        const timeToNext = start - timeElapsed;
        if (timeToNext < minTimeToNext) {
          minTimeToNext = timeToNext;
          nextBuffIndex = i;
        }
      }
    }
    
    if (nextBuffIndex !== -1) {
      return `小符${Math.floor(minTimeToNext)}秒`;
    } else {
      return "小符已结束";
    }
  });

  /**
   * 计算小符颜色
   */
  const smallBuffColor = computed(() => {
    const timeElapsed = maxTime.value - time.value;
    
    for (const [start, end] of smallBuffPeriods.value) {
      if (timeElapsed >= start && timeElapsed <= end) {
        return "red";
      }
    }
    
    for (const [start, end] of smallBuffPeriods.value) {
      if (timeElapsed < start && start - timeElapsed <= 10) {
        return "yellow";
      }
    }
    
    return "grey";
  });

  /**
   * 计算小符图标
   */
  const smallBuffIcon = computed(() => {
    const timeElapsed = maxTime.value - time.value;
    
    for (const [start, end] of smallBuffPeriods.value) {
      if (timeElapsed >= start && timeElapsed <= end) {
        return "mdi-lightning-bolt";
      }
    }
    
    for (const [start, end] of smallBuffPeriods.value) {
      if (timeElapsed < start && start - timeElapsed <= 10) {
        return "mdi-clock-alert-outline";
      }
    }
    
    return "mdi-clock-outline";
  });

  /**
   * 计算大符激活次数
   */
  const bigBuffActivationCount = computed(() => {
    const elapsed = maxTime.value - time.value;
    return bigBuffActivationSeconds.value.filter((t) => elapsed >= t).length;
  });

  /**
   * 大符状态文本
   */
  const bigBuffStatusText = computed(() => {
    return `大符机会 ${bigBuffActivationCount.value} 次`;
  });

  /**
   * 大符颜色
   */
  const bigBuffColor = computed(() => {
    return bigBuffActivationCount.value > 0 ? 'red' : 'grey';
  });

  /**
   * 大符图标
   */
  const bigBuffIcon = computed(() => {
    return 'mdi-flash';
  });

  /**
   * 计算 RMUL 金币
   */
  const rmulCoins = computed(() => {
    let total = rmulCoinBase.value;
    rmulCoinEvents.value.forEach((evt) => {
      if (time.value <= evt.at) {
        total += evt.amount;
      }
    });
    return total;
  });

  /**
   * 计算部署命中数（已注释的功能）
   */
  const deploymentHits = computed(() => {
    const elapsedTime = maxTime.value - time.value;
    return 2 + Math.floor(elapsedTime / 20);
  });

  return {
    // 状态
    smallBuffPeriods,
    bigBuffActivationSeconds,
    
    // 计算属性
    smallBuffStatusText,
    smallBuffColor,
    smallBuffIcon,
    bigBuffActivationCount,
    bigBuffStatusText,
    bigBuffColor,
    bigBuffIcon,
    rmulCoins,
    deploymentHits,
  };
}
