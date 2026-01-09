<template>
  <v-container class="fill-height" max-width="2500">
    <div style="position: absolute; top: 0; left: 0; padding: 16px;">
      <v-btn-toggle
        v-model="ruleSet"
        mandatory
        class="mb-4 mr-2"
        density="comfortable"
      >
        <v-btn value="RMUC">RMUC</v-btn>
        <v-btn value="RMUL">RMUL</v-btn>
      </v-btn-toggle>


      <v-btn
        color="green"
        class="mb-4"
        @click="startCountdown"
        ref="startButton"
      >
        开始倒计时
      </v-btn>
      <v-btn
        color="yellow"
        class="mb-4 ml-2"
        @click="pauseCountdown"
      >
        暂停倒计时
      </v-btn>
      <v-btn
        color="red"
        class="mb-4 ml-2"
        @click="resetCountdown"
      >
        重置倒计时
      </v-btn>

      <v-btn
        :color="drawingMode ? 'primary' : 'grey'"
        class="mb-4 ml-2"
        @click="toggleDrawingMode"
      >
        {{ drawingMode ? '退出画笔' : '画笔模式' }}
      </v-btn>
      <v-btn
        color="blue-grey"
        class="mb-4 ml-2"
        @click="clearDrawings"
      >
        清除标记
      </v-btn>
    </div>

    <v-row justify="center">
      <v-col cols="12">
        <div class="mb-8 text-center">
          <h1 class="text-h2 font-weight-bold">{{ Math.floor(time / 60) }}:{{ Math.floor((time % 60)).toString().padStart(2, '0') }}</h1>
          
          <v-row v-if="isRMUC" class="mt-2 mb-4" dense>
            <v-col cols="4" sm="4" md="4">
              <v-card 
                class="h-100 small-buff-card" 
                :color="getSmallBuffColor" 
                dense
              >
                <v-card-text class="text-center pa-2">
                  <v-icon size="small">{{ getSmallBuffIcon }}</v-icon>
                  <div class="text-caption font-weight-bold">{{ smallBuffStatusText }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="4" sm="4" md="4">
              <v-card 
                class="h-100 big-buff-card" 
                :color="getBigBuffColor" 
                dense
              >
                <v-card-text class="text-center pa-2">
                  <v-icon size="small">{{ getBigBuffIcon }}</v-icon>
                  <div class="text-caption font-weight-bold">{{ bigBuffStatusText }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="4" sm="4" md="4">
              <v-card 
                class="h-100 hits-card" 
                :class="{ 'hit-flash': isHitFlashing }"
                color="green"
                dense
              >
                <v-card-text class="text-center pa-2">
                  <v-icon size="small">mdi-target</v-icon>
                  <div class="text-caption font-weight-bold">部署数{{ deploymentHits }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-else class="mt-2 mb-4" dense>
            <v-col cols="12">
              <v-card class="h-100" color="yellow-lighten-4" dense>
                <v-card-text class="text-center coin-card-text">
                  <!-- <v-icon size="small">mdi-cash</v-icon> -->
                  <div class="text-subtitle-1 font-weight-bold">金币 {{ rmulCoins }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 添加进度条 -->
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
                <span class="text-body-1">{{ maxTimeLabel }}</span>
              </template>
              <template v-slot:append>
                <span class="text-body-1">0:00</span>
              </template>
            </v-slider>
          </v-sheet>
        </div>

        <v-row>
          <v-col cols="12">
            <div style="position: relative; width: 90%; margin: 0 auto;">
              <v-img
                :src="mapImage"
                width="100%"
                class="mx-auto mb-4"
                ref="mapImage"
                
                @load="handleMapLoaded"
              ></v-img>

              <canvas
                v-if="mapLoaded"
                ref="drawingCanvas"
                class="drawing-canvas"
                :width="mapWidth"
                :height="mapHeight"
                :style="{
                  width: `${mapWidth}px`,
                  height: `${mapHeight}px`,
                  pointerEvents: drawingMode ? 'auto' : 'none',
                }"
                @mousedown="startDraw"
                @mousemove="moveDraw"
                @mouseup="endDraw"
                @mouseleave="endDraw"
                @touchstart.prevent="startTouchDraw"
                @touchmove.prevent="moveTouchDraw"
                @touchend.prevent="endTouchDraw"
                @touchcancel.prevent="endTouchDraw"
              ></canvas>
              
              <!-- 可拖动的球员标记 -->
              <div
                v-if="mapLoaded"
                v-for="(player, index) in players"
                :key="index"
                class="player-circle"
                :style="{
                  left: `${getPlayerPixelX(player)}px`,
                  top: `${getPlayerPixelY(player)}px`,
                  backgroundColor: player.color,
                }"
                @mousedown="startDrag($event, index)"
                @touchstart="startTouchDrag($event, index)"
              >
                {{ player.number }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="590">
      <v-card>
        <v-card-title class="headline">{{ dialog_title }}</v-card-title>
        <v-card-text>{{ dialog_text }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="dialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
const MAP_IMAGES = {
  RMUC: new URL('../assets/26UC.jpg', import.meta.url).href,
  RMUL: new URL('../assets/26UL.jpg', import.meta.url).href,
};

const clonePlayers = (list) => list.map((player) => ({ ...player }));

const PLAYERS_RMUC = [
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

const PLAYERS_RMUL = [
  { number: 1, xRatio: 0.07, yRatio: 0.24, color: 'red' },
  { number: 3, xRatio: 0.11, yRatio: 0.23, color: 'red' },
  { number: 7, xRatio: 0.076, yRatio: 0.148, color: 'red' },
  { number: 1, xRatio: 0.892, yRatio: 0.786, color: 'blue' },
  { number: 3, xRatio: 0.903, yRatio: 0.88, color: 'blue' },
  { number: 7, xRatio: 0.956, yRatio: 0.79, color: 'blue' },
];

const RMUL_COIN_BASE = 200;
const RMUL_COIN_EVENTS = [
  { at: 239, amount: 200 },
  { at: 179, amount: 200 },
  { at: 119, amount: 300 },
  { at: 59, amount: 300 },
];

const BIG_BUFF_ACTIVATION_SECONDS = [180, 255, 330];

export default {
  name: 'HelloWorld',
  data() {
    return {
      ruleSet: 'RMUC',
      mapImages: MAP_IMAGES,
      time: 420,
      maxTime: 420, // 最大倒计时时间（7分钟）
      sliderDragging: false,
      sliderValue: 420, // 单独添加滑块值
      players: clonePlayers(PLAYERS_RMUC),
      dialog: false,
      dialog_title: '',
      dialog_text: '',
      draggingIndex: null,
      dragParentRect: null,
      countdownInterval: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      mapLoaded: false,
      resizeListenerAttached: false,
      mapWidth: 0,
      mapHeight: 0,
      mapAspectRatio: 1.82,
      small_buff: [
        [5,35],
        [90,120]
      ],
      lastHitCount: 2, // 初始命中数
      isHitFlashing: false,
      drawingMode: false,
      isDrawing: false,
      currentPath: [],
      paths: [],
      penColor: '#ff5252',
      penWidth: 3,
      rmulCoinBase: RMUL_COIN_BASE,
      rmulCoinEvents: RMUL_COIN_EVENTS,
      bigBuffActivationSeconds: BIG_BUFF_ACTIVATION_SECONDS,
    };
  },
  computed: {
    isRMUC() {
      return this.ruleSet === 'RMUC';
    },
    isRMUL() {
      return this.ruleSet === 'RMUL';
    },

    mapImage() {
      return this.mapImages[this.ruleSet];
    },

    maxTimeLabel() {
      return this.formatTime(this.maxTime);
    },

    smallBuffStatusText() {
      // 计算当前小符状态文本
      const timeElapsed = this.maxTime - this.time;
      
      // 1. 首先检查是否有正在激活的小符
      let activeIndex = -1;
      let minActiveEndTime = Infinity;
      
      for (let i = 0; i < this.small_buff.length; i++) {
        const [start, end] = this.small_buff[i];
        if (timeElapsed >= start && timeElapsed <= end) {
          // 找到最先结束的那个激活中的小符
          if (end < minActiveEndTime) {
            minActiveEndTime = end;
            activeIndex = i;
          }
        }
      }
      
      // 如果有激活中的小符，显示最近结束的那个
      if (activeIndex !== -1) {
        const [start, end] = this.small_buff[activeIndex];
        const remainingTime = end - timeElapsed;
        return `小符激活中! 剩${Math.floor(remainingTime)}秒`;
      }
      
      // 2. 如果没有激活中的小符，找出最近即将到来的小符
      let nextBuffIndex = -1;
      let minTimeToNext = Infinity;
      
      for (let i = 0; i < this.small_buff.length; i++) {
        const [start, end] = this.small_buff[i];
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
    },
    
    getSmallBuffColor() {
      // 根据小符状态返回不同颜色
      const timeElapsed = this.maxTime - this.time;
      
      // 检查是否在小符激活时间内
      for (const [start, end] of this.small_buff) {
        if (timeElapsed >= start && timeElapsed <= end) {
          // 正在激活期间
          return "red"; // 红色
        }
      }
      
      // 检查是否接近下一个小符
      for (const [start, end] of this.small_buff) {
        if (timeElapsed < start && start - timeElapsed <= 10) {
          return "yellow"; // 即将到来，黄色
        }
      }
      
      return "grey"; // 默认灰色
    },
    
    getSmallBuffIcon() {
      // 根据小符状态返回不同图标
      const timeElapsed = this.maxTime - this.time;
      
      // 检查是否在小符激活时间内
      for (const [start, end] of this.small_buff) {
        if (timeElapsed >= start && timeElapsed <= end) {
          // 正在激活期间
          return "mdi-lightning-bolt"; // 闪电图标
        }
      }
      
      // 检查是否接近下一个小符
      for (const [start, end] of this.small_buff) {
        if (timeElapsed < start && start - timeElapsed <= 10) {
          return "mdi-clock-alert-outline"; // 时钟警告图标
        }
      }
      
      return "mdi-clock-outline"; // 默认时钟图标
    },
    
    bigBuffStatusText() {
      const count = this.bigBuffActivationCount;
      return `大符机会 ${count} 次`;
    },
    
    getBigBuffColor() {
      return this.bigBuffActivationCount > 0 ? 'red' : 'grey';
    },
    
    getBigBuffIcon() {
      return 'mdi-flash';
    },

    bigBuffActivationCount() {
      const elapsed = this.maxTime - this.time;
      return this.bigBuffActivationSeconds.filter((t) => elapsed >= t).length;
    },
    
    deploymentHits() {
      // 计算倒计时开始后经过的时间
      const elapsedTime = this.maxTime - this.time;
      // 计算可命中数：2 + t/20
      const hits = 2 + Math.floor(elapsedTime / 20);
      return hits;
    },

    rmulCoins() {
      return this.calculateRMULCoins();
    }
  },
  watch: {
    // 添加监听器，将滑块值同步到time
    sliderValue(val) {
      this.time = val;
    },
    // 添加监听器，将time同步到滑块值
    time(val) {
      this.sliderValue = val;
    },

    deploymentHits(newVal, oldVal) {
      // 只有当数值增加时才闪烁
      if (newVal > oldVal) {
        this.isHitFlashing = true;
        // 500毫秒后停止闪烁
        setTimeout(() => {
          this.isHitFlashing = false;
        }, 500);
      }
    },
    ruleSet() {
      this.applyRuleSet();
    },
    mapImage() {
      this.mapLoaded = false;
    },
  },
  methods: {
    applyRuleSet() {
      const sourcePlayers = this.ruleSet === 'RMUC' ? PLAYERS_RMUC : PLAYERS_RMUL;
      this.players = clonePlayers(sourcePlayers);

      // 切换规则时重置计时与滑块
      const nextMax = this.ruleSet === 'RMUC' ? 420 : 300;
      this.maxTime = nextMax;
      this.time = nextMax;
      this.sliderValue = nextMax;
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    },

    handleMapLoaded() {
      console.log('Map loaded, ref available:', this.$refs.mapImage);
      this.mapLoaded = true;
      this.updateMapAspectRatio();
      if (!this.resizeListenerAttached) {
        window.addEventListener('resize', this.handleResize);
        this.resizeListenerAttached = true;
      }
      this.handleResize(); // 初始化时计算位置
    },
    
    handleResize() {
      // 地图尺寸改变时更新球员位置
      if (!this.mapLoaded) return;
      this.updateMapSize();
      this.redrawPaths();
    },

    updateMapSize() {
      const mapEl = this.$refs.mapImage?.$el;
      if (!mapEl) return;
      this.mapWidth = mapEl.clientWidth;
      this.mapHeight = this.mapWidth * this.mapAspectRatio;
    },

    updateMapAspectRatio() {
      const imgEl = this.$refs.mapImage?.$el?.querySelector('img');
      if (imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
        this.mapAspectRatio = imgEl.naturalHeight / imgEl.naturalWidth;
      }
    },
    
    getPlayerPixelX(player) {
      // 只有在地图加载完成后才计算位置
      if (!this.mapLoaded || !this.$refs.mapImage) return 0;
      
      const mapWidth = this.$refs.mapImage.$el.clientWidth;
      // console.log('Map width:', mapWidth);
      const playerSize = 30; // 球员直径
      return player.xRatio * mapWidth - playerSize/2;
    },
    
    getPlayerPixelY(player) {
      // 只有在地图加载完成后才计算位置
      if (!this.mapLoaded || !this.$refs.mapImage) return 0;
      
      const mapHeight = this.mapHeight;
      const playerSize = 30; // 球员直径
      return player.yRatio * mapHeight - playerSize/2;
    },
    
    startDrag(event, index) {
      event.preventDefault();
      const parent = event.currentTarget.parentElement;
      this.dragParentRect = parent.getBoundingClientRect();
      
      // 保存当前拖动的球员索引
      this.draggingIndex = index;
      
      // 记录鼠标点击位置相对于元素的偏移
      const rect = event.currentTarget.getBoundingClientRect();
      this.offsetX = event.clientX - rect.left;
      this.offsetY = event.clientY - rect.top;
      
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
    },
    
    // 添加触摸拖动开始方法
    startTouchDrag(event, index) {
      event.preventDefault();
      const parent = event.currentTarget.parentElement;
      this.dragParentRect = parent.getBoundingClientRect();
      
      // 保存当前拖动的球员索引
      this.draggingIndex = index;
      
      // 获取第一个触摸点
      const touch = event.touches[0];
      
      // 记录触摸位置相对于元素的偏移
      const rect = event.currentTarget.getBoundingClientRect();
      this.offsetX = touch.clientX - rect.left;
      this.offsetY = touch.clientY - rect.top;
      
      document.addEventListener('touchmove', this.onTouchDrag, { passive: false });
      document.addEventListener('touchend', this.stopTouchDrag);
      document.addEventListener('touchcancel', this.stopTouchDrag);
    },
    
    onDrag(event) {
      if (this.draggingIndex === null || !this.mapLoaded) return;
      event.preventDefault();

      // 获取地图尺寸
      const mapImage = this.$refs.mapImage;
      if (!mapImage) return;
      
      const mapWidth = mapImage.$el.clientWidth;
      const mapHeight = this.mapHeight; // 使用当前计算的比例
      const playerSize = 30; // 球员直径

      // 计算新位置（相对于父容器）
      const mouseX = event.clientX - this.dragParentRect.left;
      const mouseY = event.clientY - this.dragParentRect.top;
      
      // 考虑偏移量
      const newX = mouseX - this.offsetX;
      const newY = mouseY - this.offsetY;
      
      // 确保不超出边界 (考虑球员大小)
      const boundedX = Math.max(0, Math.min(mapWidth - playerSize, newX));
      const boundedY = Math.max(0, Math.min(mapHeight - playerSize, newY));
      
      // 转换为相对比例
      this.players[this.draggingIndex].xRatio = (boundedX + playerSize/2) / mapWidth;
      this.players[this.draggingIndex].yRatio = (boundedY + playerSize/2) / mapHeight;

      console.log(`Player ${this.players[this.draggingIndex].number} moved to:`, this.players[this.draggingIndex]);
    },
    
    // 添加触摸拖动处理方法
    onTouchDrag(event) {
      if (this.draggingIndex === null || !this.mapLoaded) return;
      event.preventDefault(); // 阻止页面滚动
      
      // 获取第一个触摸点
      const touch = event.touches[0];
      
      // 获取地图尺寸
      const mapImage = this.$refs.mapImage;
      if (!mapImage) return;
      
      const mapWidth = mapImage.$el.clientWidth;
      const mapHeight = this.mapHeight;
      const playerSize = 30; // 球员直径
      
      // 计算新位置（相对于父容器）
      const touchX = touch.clientX - this.dragParentRect.left;
      const touchY = touch.clientY - this.dragParentRect.top;
      
      // 考虑偏移量
      const newX = touchX - this.offsetX;
      const newY = touchY - this.offsetY;
      
      // 确保不超出边界
      const boundedX = Math.max(0, Math.min(mapWidth - playerSize, newX));
      const boundedY = Math.max(0, Math.min(mapHeight - playerSize, newY));
      
      // 转换为相对比例
      this.players[this.draggingIndex].xRatio = (boundedX + playerSize/2) / mapWidth;
      this.players[this.draggingIndex].yRatio = (boundedY + playerSize/2) / mapHeight;
    },
    
    stopDrag() {
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
      this.draggingIndex = null;
    },
    
    // 添加触摸拖动结束方法
    stopTouchDrag() {
      document.removeEventListener('touchmove', this.onTouchDrag);
      document.removeEventListener('touchend', this.stopTouchDrag);
      document.removeEventListener('touchcancel', this.stopTouchDrag);
      this.draggingIndex = null;
    },
    
    onSliderStart() {
      // 当用户开始拖动滑块时
      this.sliderDragging = true;
      if (this.countdownInterval) {
        // 如果倒计时正在运行，先暂停
        this.tempCountdownState = true;
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    
    onSliderEnd() {
      // 当用户结束拖动滑块时
      this.sliderDragging = false;
      if (this.tempCountdownState) {
        // 如果之前倒计时在运行，恢复倒计时
        this.startCountdown();
        this.tempCountdownState = false;
      }
    },
    
    startCountdown() {
      if (this.countdownInterval) {
        this.dialog_title = '倒计时开始';
        this.dialog_text = '倒计时已开始。';
        this.dialog = true;
      }
      else {
        this.countdownInterval = setInterval(() => {
          if (this.time > 0) {
            this.time--;
          } else {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
            this.dialog_title = '倒计时结束';
            this.dialog_text = '时间到！';
            this.dialog = true;
          }
        }, 1000);
      }
    },
    
    pauseCountdown() {
      // 暂停倒计时
      this.dialog_title = '倒计时暂停';
      this.dialog_text = '倒计时已暂停。';
      this.dialog = true;
      // 清除定时器
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    },
    
    resetCountdown() {
      // 重置倒计时
      this.time = this.maxTime;
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    },

    toggleDrawingMode() {
      this.drawingMode = !this.drawingMode;
      if (!this.drawingMode) {
        this.isDrawing = false;
        this.currentPath = [];
      }
    },

    clearDrawings() {
      this.paths = [];
      this.currentPath = [];
      this.redrawPaths();
    },

    startDraw(event) {
      if (!this.drawingMode || !this.mapLoaded) return;
      this.isDrawing = true;
      this.currentPath = [];
      const point = this.getNormalizedPoint(event);
      if (point) {
        this.currentPath.push(point);
        this.redrawPaths();
      }
    },

    moveDraw(event) {
      if (!this.isDrawing) return;
      const point = this.getNormalizedPoint(event);
      if (point) {
        this.currentPath.push(point);
        this.redrawPaths();
      }
    },

    endDraw() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.currentPath.length > 1) {
        this.paths.push({
          points: [...this.currentPath],
          color: this.penColor,
          width: this.penWidth,
        });
      }
      this.currentPath = [];
      this.redrawPaths();
    },

    startTouchDraw(event) {
      if (!this.drawingMode || !this.mapLoaded) return;
      this.isDrawing = true;
      this.currentPath = [];
      const point = this.getNormalizedPoint(event.touches[0]);
      if (point) {
        this.currentPath.push(point);
        this.redrawPaths();
      }
    },

    moveTouchDraw(event) {
      if (!this.isDrawing) return;
      const point = this.getNormalizedPoint(event.touches[0]);
      if (point) {
        this.currentPath.push(point);
        this.redrawPaths();
      }
    },

    endTouchDraw() {
      this.endDraw();
    },

    getNormalizedPoint(event) {
      const mapEl = this.$refs.mapImage?.$el;
      if (!mapEl || this.mapWidth === 0 || this.mapHeight === 0) return null;
      const rect = mapEl.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;
      const x = (clientX - rect.left) / this.mapWidth;
      const y = (clientY - rect.top) / this.mapHeight;
      return {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
      };
    },

    redrawPaths() {
      const canvas = this.$refs.drawingCanvas;
      if (!canvas || this.mapWidth === 0 || this.mapHeight === 0) return;
      const ctx = canvas.getContext('2d');
      canvas.width = this.mapWidth;
      canvas.height = this.mapHeight;
      ctx.clearRect(0, 0, this.mapWidth, this.mapHeight);

      const draw = (path) => {
        if (!path.points || path.points.length < 2) return;
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        path.points.forEach((p, idx) => {
          const px = p.x * this.mapWidth;
          const py = p.y * this.mapHeight;
          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
      };

      this.paths.forEach(draw);
      if (this.isDrawing && this.currentPath.length > 1) {
        draw({
          points: this.currentPath,
          color: this.penColor,
          width: this.penWidth,
        });
      }
    },

    bigBuffActivationCount() {
      const elapsed = this.maxTime - this.time;
      return this.bigBuffActivationSeconds.filter((t) => elapsed >= t).length;
    },

    calculateRMULCoins() {
      let total = this.rmulCoinBase;
      this.rmulCoinEvents.forEach((evt) => {
        if (this.time <= evt.at) {
          total += evt.amount;
        }
      });
      return total;
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${minutes}:${secs}`;
    },
  },
  mounted() {
    // 组件挂载后初始化
    console.log('Component mounted, refs:', this.$refs);
    this.updateMapSize();
  },
  beforeUnmount() {
    // 组件销毁时移除事件监听
    if (this.resizeListenerAttached) {
      window.removeEventListener('resize', this.handleResize);
    }
  }
};
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

.small-buff-card {
  transition: background-color 0.5s, transform 0.3s;
}

.small-buff-card.v-card--active {
  transform: scale(1.05);
}

.big-buff-card {
  transition: background-color 0.5s, transform 0.3s;
}

.big-buff-card.v-card--active {
  transform: scale(1.05);
}

.hits-card {
  transition: background-color 0.5s, transform 0.3s;
}

.hits-card.v-card--active {
  transform: scale(1.05);
}

.hit-flash {
  animation: flash 0.5s;
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

@keyframes flash {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 255, 0, 0); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(0, 255, 0, 0.7); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 255, 0, 0); }
}
</style>