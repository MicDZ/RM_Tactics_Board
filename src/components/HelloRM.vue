<template v-if="mapLoaded">
  <v-container class="fill-height" max-width="2500">
    <!-- 控制按钮区域 -->
    <div style="position: absolute; top: 0; left: 0; padding: 16px;">
      <!-- 规则切换 -->
      <v-btn-toggle
        v-model="ruleSet"
        mandatory
        class="mb-4 mr-2"
        density="comfortable"
      >
        <v-btn value="RMUC">RMUC</v-btn>
        <v-btn value="RMUL">RMUL</v-btn>
      </v-btn-toggle>

      <!-- 倒计时控制 -->
      <v-btn color="green" class="mb-4" @click="handleStartCountdown">
        开始倒计时
      </v-btn>
      <v-btn color="yellow" class="mb-4 ml-2" @click="handlePauseCountdown">
        暂停倒计时
      </v-btn>
      <v-btn color="red" class="mb-4 ml-2" @click="handleResetCountdown">
        重置倒计时
      </v-btn>

      <!-- 画笔工具 -->
      <v-btn
        :color="drawingMode ? 'primary' : 'grey'"
        class="mb-4 ml-2"
        @click="toggleDrawingMode"
      >
        {{ drawingMode ? '退出画笔' : '画笔模式' }}
      </v-btn>
      
      <v-btn
        v-if="drawingMode"
        :color="eraserMode ? 'warning' : 'grey'"
        class="mb-4 ml-2"
        @click="toggleEraserMode"
      >
        {{ eraserMode ? '退出橡皮擦' : '橡皮擦' }}
      </v-btn>
      
      <v-menu v-if="drawingMode && !eraserMode" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            class="mb-4 ml-2"
            :style="{ backgroundColor: penColor }"
          >
            画笔颜色
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="color in penColors"
            :key="color.value"
            @click="penColor = color.value"
          >
            <v-list-item-title>
              <v-icon :style="{ color: color.value }" class="mr-2">mdi-circle</v-icon>
              {{ color.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <v-btn
        v-if="drawingMode"
        color="orange"
        class="mb-4 ml-2"
        @click="undoLastPath"
        :disabled="paths.length === 0"
      >
        撤销
      </v-btn>
      
      <v-btn
        v-if="drawingMode"
        color="blue-grey"
        class="mb-4 ml-2"
        @click="clearDrawings"
      >
        清除全部
      </v-btn>
    </div>

    <v-row justify="center">
      <v-col cols="12">
        <div class="mb-8 text-center">
          <!-- 倒计时显示 -->
          <h1 class="text-h2 font-weight-bold">
            {{ Math.floor(time / 60) }}:{{ Math.floor((time % 60)).toString().padStart(2, '0') }}
          </h1>
          
          <!-- RMUC Buff 状态 -->
          <v-row v-if="isRMUC" class="mt-2 mb-4" dense>
            <v-col cols="6">
              <v-card class="h-100 small-buff-card" :color="smallBuffColor" dense>
                <v-card-text class="text-center pa-2">
                  <v-icon size="small">{{ smallBuffIcon }}</v-icon>
                  <div class="text-caption font-weight-bold">{{ smallBuffStatusText }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="6">
              <v-card class="h-100 big-buff-card" :color="bigBuffColor" dense>
                <v-card-text class="text-center pa-2">
                  <v-icon size="small">{{ bigBuffIcon }}</v-icon>
                  <div class="text-caption font-weight-bold">{{ bigBuffStatusText }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- RMUL 金币状态 -->
          <v-row v-else class="mt-2 mb-4" dense>
            <v-col cols="12">
              <v-card class="h-100" color="yellow-lighten-4" dense>
                <v-card-text class="text-center coin-card-text">
                  <div class="text-h5 font-weight-bold">{{ rmulCoins }} 金币</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 进度条 -->
          <v-sheet width="80%" class="mx-auto mt-4 mb-6">
            <v-slider
              v-model="sliderValue"
              :max="maxTime"
              :min="0"
              color="primary"
              track-color="grey lighten-3"
              hide-details
              @start="onSliderStart"
              @end="onSliderEnd"
              :disabled="countdownInterval !== null && !sliderDragging"
              reverse
            >
              <template v-slot:prepend>
                <span class="text-body-1">{{ formatTime(maxTime) }}</span>
              </template>
              <template v-slot:append>
                <span class="text-body-1">0:00</span>
              </template>
            </v-slider>
          </v-sheet>
        </div>

        <!-- 地图区域 -->
        <v-row>
          <v-col cols="12">
            <div style="position: relative; width: 90%; margin: 0 auto;">
              <v-img
                :src="mapImage"
                width="100%"
                class="mx-auto mb-4"
                ref="mapImageRef"
                @load="handleMapLoaded"
              ></v-img>

              <!-- 画布 -->
              <canvas
                ref="drawingCanvasRef"
                class="drawing-canvas"
                :width="mapWidth"
                :height="mapHeight"
                :style="{
                  width: `${mapWidth}px`,
                  height: `${mapHeight}px`,
                  pointerEvents: drawingMode ? 'auto' : 'none',
                }"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                @touchstart.prevent="handleTouchStart"
                @touchmove.prevent="handleTouchMove"
                @touchend.prevent="handleTouchEnd"
                @touchcancel.prevent="handleTouchEnd"
              ></canvas>
              
              <!-- 玩家标记 -->
              <div
                v-for="(player, index) in players"
                :key="index"
                class="player-circle"
                :style="{
                  left: `${getPlayerPixelX(player)}px`,
                  top: `${getPlayerPixelY(player)}px`,
                  backgroundColor: player.color,
                }"
                @mousedown="(e) => startDrag(e, index)"
                @touchstart="(e) => startTouchDrag(e, index)"
              >
                {{ player.number }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 对话框 -->
    <v-dialog v-model="dialog" max-width="590">
      <v-card>
        <v-card-title class="headline">{{ dialogTitle }}</v-card-title>
        <v-card-text>{{ dialogText }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="dialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  MAP_IMAGES,
  PLAYERS_RMUC,
  PLAYERS_RMUL,
  GAME_RULES,
  clonePlayers,
} from '@/constants/gameConfig';
import { useCountdown } from '@/composables/useCountdown';
import { useDrawing } from '@/composables/useDrawing';
import { usePlayerDrag } from '@/composables/usePlayerDrag';
import { useGameState } from '@/composables/useGameState';
import { useMapManagement } from '@/composables/useMapManagement';

// ========== 基础状态 ==========
const ruleSet = ref('RMUC');
const dialog = ref(false);
const dialogTitle = ref('');
const dialogText = ref('');
const players = ref(clonePlayers(PLAYERS_RMUC));

// ========== Refs ==========
const mapImageRef = ref(null);
const drawingCanvasRef = ref(null);

// ========== 地图管理 ==========
const {
  mapLoaded,
  mapWidth,
  mapHeight,
  handleMapLoaded: mapLoadedHandler,
  updateMapSize,
  cleanup: cleanupMap,
} = useMapManagement();

// ========== 倒计时 ==========
const {
  time,
  maxTime,
  sliderValue,
  sliderDragging,
  countdownInterval,
  formatTime,
  onSliderStart,
  onSliderEnd,
  startCountdown,
  pauseCountdown,
  resetCountdown,
  setMaxTime,
} = useCountdown(GAME_RULES.RMUC.maxTime);

// ========== 绘图 ==========
const {
  drawingMode,
  eraserMode,
  paths,
  penColor,
  penColors,
  setCanvasConfig,
  toggleDrawingMode,
  toggleEraserMode,
  undoLastPath,
  clearDrawings,
  startDraw,
  moveDraw,
  endDraw,
  redrawPaths,
} = useDrawing();

// ========== 玩家拖拽 ==========
const {
  getPlayerPixelX,
  getPlayerPixelY,
  startDrag: startPlayerDrag,
  startTouchDrag: startPlayerTouchDrag,
} = usePlayerDrag(players, mapWidth, mapHeight);

// ========== 游戏状态 ==========
const {
  smallBuffStatusText,
  smallBuffColor,
  smallBuffIcon,
  bigBuffStatusText,
  bigBuffColor,
  bigBuffIcon,
  rmulCoins,
} = useGameState(ruleSet, time, maxTime);

// ========== 计算属性 ==========
const isRMUC = computed(() => ruleSet.value === 'RMUC');
const mapImage = computed(() => MAP_IMAGES[ruleSet.value]);

// ========== 监听器 ==========
watch(ruleSet, () => {
  const sourcePlayers = ruleSet.value === 'RMUC' ? PLAYERS_RMUC : PLAYERS_RMUL;
  players.value = clonePlayers(sourcePlayers);
  
  const nextMax = GAME_RULES[ruleSet.value].maxTime;
  setMaxTime(nextMax);
});

watch(mapImage, () => {
  mapLoaded.value = false;
});

// ========== 方法 ==========
const handleMapLoaded = () => {
  mapLoadedHandler(mapImageRef.value, handleResize);
};

const handleResize = () => {
  if (!mapLoaded.value) return;
  updateMapSize(mapImageRef.value);
  nextTick(() => {
    setCanvasConfig(drawingCanvasRef.value, mapWidth.value, mapHeight.value);
    redrawPaths();
  });
};

const startDrag = (event, index) => {
  const parent = event.currentTarget.parentElement;
  startPlayerDrag(event, index, parent);
};

const startTouchDrag = (event, index) => {
  const parent = event.currentTarget.parentElement;
  startPlayerTouchDrag(event, index, parent);
};

const getNormalizedPoint = (event) => {
  const mapEl = mapImageRef.value?.$el;
  if (!mapEl || mapWidth.value === 0 || mapHeight.value === 0) return null;
  
  const rect = mapEl.getBoundingClientRect();
  const clientX = event.clientX;
  const clientY = event.clientY;
  const x = (clientX - rect.left) / mapWidth.value;
  const y = (clientY - rect.top) / mapHeight.value;
  
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
};

const handleMouseDown = (event) => {
  const point = getNormalizedPoint(event);
  if (point) startDraw(point);
};

const handleMouseMove = (event) => {
  const point = getNormalizedPoint(event);
  if (point) moveDraw(point);
};

const handleMouseUp = () => {
  endDraw();
};

const handleTouchStart = (event) => {
  const point = getNormalizedPoint(event.touches[0]);
  if (point) startDraw(point);
};

const handleTouchMove = (event) => {
  const point = getNormalizedPoint(event.touches[0]);
  if (point) moveDraw(point);
};

const handleTouchEnd = () => {
  endDraw();
};

const showDialog = (title, text) => {
  dialogTitle.value = title;
  dialogText.value = text;
  dialog.value = true;
};

const handleStartCountdown = () => {
  const result = startCountdown();
  if (!result.success) {
    showDialog('倒计时开始', result.message);
  }
};

const handlePauseCountdown = () => {
  const result = pauseCountdown();
  showDialog('倒计时暂停', result.message);
};

const handleResetCountdown = () => {
  const result = resetCountdown();
};

// ========== 生命周期 ==========
onMounted(() => {
  console.log('Component mounted');
  updateMapSize(mapImageRef.value);
});

onBeforeUnmount(() => {
  cleanupMap(handleResize);
});
</script>

<style scoped>
.player-circle {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  cursor: move;
  user-select: none;
  transition: transform 0.1s;
  z-index: 2;
}

.player-circle:active {
  transform: scale(1.1);
}

.small-buff-card,
.big-buff-card,
.hits-card {
  transition: background-color 0.5s, transform 0.3s;
}

.small-buff-card.v-card--active,
.big-buff-card.v-card--active,
.hits-card.v-card--active {
  transform: scale(1.05);
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.coin-card-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
}
</style>
