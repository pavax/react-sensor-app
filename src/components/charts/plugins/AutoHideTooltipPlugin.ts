import { Chart } from "chart.js";

export function createAutoHideTooltipPlugin() {
    let autoHideTimeoutRef: number | null = null;
    const AUTO_HIDE_AFTER_TIME = 3_000;
    let chart: Chart | null = null;
  
    const handleTouchMove = () => {
      if (chart) {
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.setActiveElements([]);
        chart.update();
      }
    };
  
    document.addEventListener('touchstart', handleTouchMove, { passive: true });
  
    return {
      id: "hideTooltipAfter5Seconds",
      beforeInit(chartInstance: Chart) {
        chart = chartInstance;
      },
      beforeEvent(_: Chart, args: { event: { type: string } }) {
        if (args.event.type === "mouseout") {
          if (autoHideTimeoutRef !== null) {
            clearTimeout(autoHideTimeoutRef);
            autoHideTimeoutRef = null;
          }
        }
      },
      afterTooltipDraw: (chartInstance: Chart) => {
        if (autoHideTimeoutRef !== null) {
          clearTimeout(autoHideTimeoutRef);
        }
        autoHideTimeoutRef = window.setTimeout(() => {
          chartInstance.tooltip?.setActiveElements([], { x: 0, y: 0 });
          chartInstance.setActiveElements([]);
          chartInstance.update();
          autoHideTimeoutRef = null;
        }, AUTO_HIDE_AFTER_TIME);
      },
      destroy() {
        document.removeEventListener('touchstart', handleTouchMove);
      }
    };
  }