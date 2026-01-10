import { PEN_COLORS } from '@/constants/gameConfig';
import { ref } from 'vue';

/**
 * 绘图功能的可组合函数
 * 提供画笔和橡皮擦功能
 */
export function useDrawing() {
  // 状态
  const drawingMode = ref(false);
  const eraserMode = ref(false);
  const isDrawing = ref(false);
  const currentPath = ref([]);
  const paths = ref([]);
  const penColor = ref('#ff5252');
  const penWidth = ref(3);
  const penColors = ref(PEN_COLORS);

  // 画布引用
  let canvasRef = null;
  let mapWidth = 0;
  let mapHeight = 0;

  /**
   * 设置画布引用和尺寸
   */
  const setCanvasConfig = (canvas, width, height) => {
    canvasRef = canvas;
    mapWidth = width;
    mapHeight = height;
  };

  /**
   * 切换绘图模式
   */
  const toggleDrawingMode = () => {
    drawingMode.value = !drawingMode.value;
    if (!drawingMode.value) {
      isDrawing.value = false;
      currentPath.value = [];
      eraserMode.value = false;
    }
  };

  /**
   * 切换橡皮擦模式
   */
  const toggleEraserMode = () => {
    eraserMode.value = !eraserMode.value;
    if (eraserMode.value) {
      isDrawing.value = false;
      currentPath.value = [];
    }
  };

  /**
   * 撤销最后一条路径
   */
  const undoLastPath = () => {
    if (paths.value.length > 0) {
      paths.value.pop();
      redrawPaths();
    }
  };

  /**
   * 清除所有路径
   */
  const clearDrawings = () => {
    paths.value = [];
    currentPath.value = [];
    redrawPaths();
  };

  /**
   * 开始绘制
   */
  const startDraw = (point) => {
    if (!drawingMode.value) return;
    
    isDrawing.value = true;
    
    if (eraserMode.value) {
      removePathAtPoint(point);
      return;
    }
    
    currentPath.value = [];
    if (point) {
      currentPath.value.push(point);
      redrawPaths();
    }
  };

  /**
   * 移动绘制
   */
  const moveDraw = (point) => {
    if (!isDrawing.value || !point) return;
    
    if (eraserMode.value) {
      removePathAtPoint(point);
    } else {
      currentPath.value.push(point);
      redrawPaths();
    }
  };

  /**
   * 结束绘制
   */
  const endDraw = () => {
    if (!isDrawing.value) return;
    isDrawing.value = false;
    
    if (!eraserMode.value && currentPath.value.length > 1) {
      paths.value.push({
        points: [...currentPath.value],
        color: penColor.value,
        width: penWidth.value,
      });
    }
    
    currentPath.value = [];
    redrawPaths();
  };

  /**
   * 删除指定位置的路径
   */
  const removePathAtPoint = (point) => {
    const threshold = 0.02;
    
    for (let i = paths.value.length - 1; i >= 0; i--) {
      const path = paths.value[i];
      for (let j = 0; j < path.points.length - 1; j++) {
        const p1 = path.points[j];
        const p2 = path.points[j + 1];
        
        const dist = pointToLineDistance(point, p1, p2);
        if (dist < threshold) {
          paths.value.splice(i, 1);
          redrawPaths();
          return;
        }
      }
    }
  };

  /**
   * 计算点到线段的距离
   */
  const pointToLineDistance = (point, lineStart, lineEnd) => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
      const distX = point.x - lineStart.x;
      const distY = point.y - lineStart.y;
      return Math.sqrt(distX * distX + distY * distY);
    }
    
    let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    
    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;
    
    const distX = point.x - projX;
    const distY = point.y - projY;
    return Math.sqrt(distX * distX + distY * distY);
  };

  /**
   * 重绘所有路径
   */
  const redrawPaths = () => {
    if (!canvasRef || mapWidth === 0 || mapHeight === 0) return;
    
    const ctx = canvasRef.getContext('2d');
    canvasRef.width = mapWidth;
    canvasRef.height = mapHeight;
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    const draw = (path) => {
      if (!path.points || path.points.length < 2) return;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      path.points.forEach((p, idx) => {
        const px = p.x * mapWidth;
        const py = p.y * mapHeight;
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
    };

    paths.value.forEach(draw);
    
    if (isDrawing.value && currentPath.value.length > 1) {
      draw({
        points: currentPath.value,
        color: penColor.value,
        width: penWidth.value,
      });
    }
  };

  return {
    // 状态
    drawingMode,
    eraserMode,
    isDrawing,
    paths,
    penColor,
    penWidth,
    penColors,
    
    // 方法
    setCanvasConfig,
    toggleDrawingMode,
    toggleEraserMode,
    undoLastPath,
    clearDrawings,
    startDraw,
    moveDraw,
    endDraw,
    redrawPaths,
  };
}
