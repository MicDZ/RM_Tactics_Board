// 地图图片配置
export const MAP_IMAGES = {
  RMUC: new URL('../assets/26UC.jpg', import.meta.url).href,
  RMUL: new URL('../assets/26UL.jpg', import.meta.url).href,
};

// RMUC 玩家初始位置
export const PLAYERS_RMUC = [
  { number: 1, xRatio: 0.106, yRatio: 0.57, color: 'red' },
  { number: 2, xRatio: 0.151, yRatio: 0.451, color: 'red' },
  { number: 3, xRatio: 0.151, yRatio: 0.539, color: 'red' },
  { number: 4, xRatio: 0.057, yRatio: 0.555, color: 'red' },
  { number: 6, xRatio: 0.101, yRatio: 0.405, color: 'red' },
  { number: 7, xRatio: 0.058, yRatio: 0.441, color: 'red' },
  { number: 1, xRatio: 0.90, yRatio: 0.58, color: 'blue' },
  { number: 2, xRatio: 0.85, yRatio: 0.52, color: 'blue' },
  { number: 3, xRatio: 0.94, yRatio: 0.56, color: 'blue' },
  { number: 4, xRatio: 0.94, yRatio: 0.43, color: 'blue' },
  { number: 6, xRatio: 0.89, yRatio: 0.41, color: 'blue' },
  { number: 7, xRatio: 0.85, yRatio: 0.45, color: 'blue' },
];

// RMUL 玩家初始位置
export const PLAYERS_RMUL = [
  { number: 1, xRatio: 0.07, yRatio: 0.24, color: 'red' },
  { number: 3, xRatio: 0.11, yRatio: 0.23, color: 'red' },
  { number: 7, xRatio: 0.076, yRatio: 0.148, color: 'red' },
  { number: 1, xRatio: 0.892, yRatio: 0.786, color: 'blue' },
  { number: 3, xRatio: 0.903, yRatio: 0.88, color: 'blue' },
  { number: 7, xRatio: 0.956, yRatio: 0.79, color: 'blue' },
];

// RMUL 金币配置
export const RMUL_COIN_BASE = 200;
export const RMUL_COIN_EVENTS = [
  { at: 239, amount: 200 },
  { at: 179, amount: 200 },
  { at: 119, amount: 300 },
  { at: 59, amount: 300 },
];

// 大符激活时间点（秒）
export const BIG_BUFF_ACTIVATION_SECONDS = [180, 255, 330];

// 小符激活时间段 [开始, 结束]
export const SMALL_BUFF_PERIODS = [
  [0, 20],
  [90, 110]
];

// 画笔颜色配置
export const PEN_COLORS = [
  { name: '红色', value: '#ff5252' },
  { name: '蓝色', value: '#2196F3' },
  { name: '绿色', value: '#4CAF50' },
  { name: '黄色', value: '#FFEB3B' },
  { name: '橙色', value: '#FF9800' },
  { name: '紫色', value: '#9C27B0' },
  { name: '粉色', value: '#E91E63' },
  { name: '青色', value: '#00BCD4' },
  { name: '黑色', value: '#000000' },
  { name: '白色', value: '#FFFFFF' },
];

// 游戏规则配置
export const GAME_RULES = {
  RMUC: {
    maxTime: 420, // 7分钟
    mapAspectRatio: 1.82,
  },
  RMUL: {
    maxTime: 300, // 5分钟
    mapAspectRatio: 1.82,
  },
};

// 工具函数：克隆玩家数组
export const clonePlayers = (list) => list.map((player) => ({ ...player }));
