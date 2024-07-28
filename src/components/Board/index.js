import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";

const Board = () => {
    const dispatch = useDispatch();
    const canvasRef = useRef(null);
    const drawHistory = useRef([]);
    const drawHistoryIndex = useRef(0);
    const shouldDraw = useRef(false);
    const {activeMenuItem, actionMenuItem} = useSelector((state) => state.menu);
    const {color, size} = useSelector((state) => state.toolbox[activeMenuItem]);

    useEffect(() => {
        if (!canvasRef.current)  return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
            const URL = canvas.toDataURL();
            const anchor = document.createElement('a');
            anchor.href = URL;
            anchor.download = 'canvas-image.jpg';
            anchor.click();
            // console.log(URL);
        } else if (actionMenuItem === MENU_ITEMS.UNDO) {
            if (drawHistoryIndex.current > 0) drawHistoryIndex.current--;
            const imageData = drawHistory.current[drawHistoryIndex.current];
            context.putImageData(imageData, 0, 0);
        } else if (actionMenuItem === MENU_ITEMS.REDO) {
            if (drawHistoryIndex.current < drawHistory.current.length - 1) drawHistoryIndex.current++;
            const imageData = drawHistory.current[drawHistoryIndex.current];
            context.putImageData(imageData, 0, 0);
        }

        dispatch(actionItemClick(null));
        // console.log("Active", activeMenuItem);
    }, [actionMenuItem, dispatch]);

    useEffect(() => {
        if (!canvasRef.current)  return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const changeConfig = () => {
          context.strokeStyle = color;
          context.lineWidth = size;
        };

        changeConfig();
    }, [color, size]);

    useLayoutEffect(() => {
        if (!canvasRef.current)  return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const beginPath = (x, y) => {
            context.beginPath();
            context.moveTo(x, y);
        }

        const drawLine = (x, y) => {
            context.lineTo(x, y);
            context.stroke();
        }

        const handleMouseDown = (event) => {
            shouldDraw.current = true;
            beginPath(event.clientX, event.clientY);
        };

        const handleMouseMove = (event) => {
            if (!shouldDraw.current) return;
            drawLine(event.clientX, event.clientY);
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

        return () => {
          canvas.removeEventListener("mousedown", handleMouseDown);
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <canvas ref={canvasRef}></canvas>
    )
}

export default Board;