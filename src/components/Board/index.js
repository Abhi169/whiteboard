import { useEffect, useLayoutEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";
import { socket } from "@/socket";

const Board = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawHistory = useRef([]);
  const drawHistoryIndex = useRef(0);
  const shouldDraw = useRef(false);
  const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu);
  const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL();
      const anchor = document.createElement("a");
      anchor.href = URL;
      anchor.download = "canvas-image.jpg";
      anchor.click();
      // console.log(URL);
    } else if (actionMenuItem === MENU_ITEMS.UNDO || actionMenuItem === MENU_ITEMS.REDO) {
      if (drawHistoryIndex.current > 0 && actionMenuItem === MENU_ITEMS.UNDO)
        drawHistoryIndex.current--;
      if (drawHistoryIndex.current < drawHistory.current.length - 1 && actionMenuItem === MENU_ITEMS.REDO)
        drawHistoryIndex.current++;
      const imageData = drawHistory.current[drawHistoryIndex.current];
        context.putImageData(imageData, 0, 0);
    }
    dispatch(actionItemClick(null));
    // console.log("Active", activeMenuItem);
  }, [actionMenuItem, dispatch]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const changeConfig = (color, size) => {
      context.strokeStyle = color;
      context.lineWidth = size;
    };

    const applyToolSettings = () => {
      if (activeMenuItem === MENU_ITEMS.ERASER) {
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }
      context.strokeStyle = color;
      context.lineWidth = size;
    };

    applyToolSettings();

    const handleConfigChange = (config) => {
      //console.log("Config", config);
      changeConfig(config.color, config.size);
      applyToolSettings();
    };
    changeConfig(color, size);
    socket.on("changeConfig", handleConfigChange);

    return () => {
      socket.off("changeConfig", handleConfigChange);
    };
  }, [activeMenuItem, color, size]);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const beginPath = (x, y) => {
      context.beginPath();
      context.moveTo(x, y);
    };

    const drawLine = (x, y) => {
      context.lineTo(x, y);
      context.stroke();
    };

    const handleMouseDown = (event) => {
      shouldDraw.current = true;
      beginPath(event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY);
      socket.emit("beginPath", { x: event.clientX || event.touches[0].clientX, y: event.clientY || event.touches[0].clientY });
    };

    const handleMouseMove = (event) => {
      if (!shouldDraw.current) return;
      drawLine(event.clientX || event.touches[0].clientX, event.clientY || event.touches[0].clientY);
      socket.emit("drawLine", { x: event.clientX || event.touches[0].clientX, y: event.clientY || event.touches[0].clientY });
    };

    const handleMouseUp = () => {
      shouldDraw.current = false;
      const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current.push(imgData);
      drawHistoryIndex.current = drawHistory.current.length - 1;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchmove", handleMouseMove);
    canvas.addEventListener("touchend", handleMouseUp);

    const handlePath = (path) => {
      beginPath(path.x, path.y);
    };

    const handleDrawLine = (path) => {
      drawLine(path.x, path.y);
    };

    socket.on("beginPath", handlePath);
    socket.on("drawLine", handleDrawLine);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);

      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchmove", handleMouseMove);
      canvas.removeEventListener("touchend", handleMouseUp);

      socket.off("beginPath", handlePath);
      socket.off("drawLine", handleDrawLine);
    };
  }, []);

  useEffect(() => {
    const handleToolChange = (tool) => {
      //console.log("Tool", tool);
      dispatch(menuItemClick(tool));
    };

    socket.emit("requestInitialConfig");

    socket.on("initialConfig", (config) => {
      dispatch(menuItemClick(config.tool));
      dispatch(changeConfig(config.color, config.size));
    });

    socket.on("toolChange", handleToolChange);

    return () => {
      socket.off("initialConfig");
      socket.off("toolChange", handleToolChange);
    };
  }, [dispatch]);

  return <canvas ref={canvasRef}></canvas>;
};

export default Board;