"use client";
import { useEffect, useRef, useState } from "react";
import RangeSlider from "@/components/RangeSlider/RangeSlider";
import { DraggableCard } from "@/components/cards/DraggableCard";
import { DraggableCardBody } from "@/components/ui/draggable-card";

interface Stroke {
  x: number;
  y: number;
  color: string;
  size: number;
  mode: "draw" | "erase";
}

export default function Home() {
  const [brushValue, setBrushValue] = useState(5);
  const [color, setColor] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const isDrawingRef = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    isDrawingRef.current = false;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      tempCtx.drawImage(canvas, 0, 0);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.drawImage(tempCanvas, 0, 0);
    };

    const getCoords = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: MouseEvent) => {
      if (isDraggingCard) return;
      isDrawingRef.current = true;
      drawStroke(e);
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
      ctx.beginPath();
    };

    const drawStroke = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      const { x, y } = getCoords(e);
      const newStroke: Stroke = {
        x,
        y,
        color,
        size: brushValue,
        mode: mode || "draw",
      };
      draw(newStroke);
      setStrokes((prev) => [...prev, newStroke]);
    };

    const draw = (stroke: Stroke) => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.globalCompositeOperation =
        stroke.mode === "erase" ? "destination-out" : "source-over";
      ctx.fillStyle = stroke.mode === "erase" ? "rgba(0,0,0,1)" : stroke.color;
      ctx.arc(stroke.x, stroke.y, stroke.size, 0, Math.PI * 2);
      ctx.fill();
    };

    strokes.forEach((s) => {
      draw(s);
    });
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("mousemove", drawStroke);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("mousemove", drawStroke);
      canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
    };
  }, [color, brushValue, mode]);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas?.getContext("2d");
    setStrokes([]);
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  //   const saveCanvas = () => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const link = document.createElement('a');
  //   link.download = 'drawing.png';
  //   link.href = canvas.toDataURL();
  //   link.click();
  // };

  return (
    <div className="relative w-screen h-screen overflow-auto">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          cursor: mode === "erase" ? "cell" : "crosshair",
          pointerEvents: isDraggingCard ? "none" : "auto", // ✅ disable drawing while dragging
        }}
      />

      <div
        className={`flex flex-row items-center w-[500px] m-5 p-5 space-x-5 absolute top-0 left-0 bg-white rounded-md z-30 `}
      >
        <input
          type="color"
          className="p-1 h-10 w-14 block bg-[#ededed] border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
          id="hs-color-input"
          value={color}
          title="Choose your color"
          onChange={(e: any) => {
            setColor(e.target.value);
          }}
          disabled={mode === "erase"}
        />
        <RangeSlider
          min="0"
          max="21"
          value={brushValue}
          onChange={(e: any) => {
            setBrushValue(+e.target.value);
            console.log(brushValue);
          }}
        />
        <div className="m-2 flex flex-row p-1">
          <button
            id="Brush"
            className={`ml-2 h-7 w-12 flex items-center justify-center ${
              mode === "draw" ? "bg-gray-200 text-white" : "bg-white text-black"
            }  rounded-full hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out`}
            onClick={() => setMode("draw")}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              transform="rotate(0 0 0)"
            >
              <path
                d="M2.57036 17.3315L2.56645 17.3324C2.56798 17.332 2.57097 17.3308 2.57524 17.3295H2.57621C2.58091 17.3281 2.58714 17.3262 2.59477 17.3236C2.62586 17.3133 2.68067 17.293 2.75493 17.2602C2.90362 17.1944 3.13265 17.0755 3.40922 16.8735C3.95916 16.4716 4.71833 15.7264 5.42387 14.3744L5.46 14.3139L5.63774 14.059C6.55656 12.8395 7.87526 12.4639 9.08989 12.6625L9.4102 12.7279C10.1509 12.9124 10.8363 13.3054 11.3604 13.8295L11.4795 13.9555C12.0603 14.5977 12.3534 15.4078 12.3868 16.2377L12.3897 16.4623C12.3723 17.5875 11.8889 18.7394 10.9981 19.6303C10.2658 20.3626 9.40804 20.7193 8.53813 20.8295L8.16411 20.8617C6.67731 20.9342 5.18942 20.3479 4.12895 19.7992C3.58746 19.5191 3.13196 19.2358 2.81157 19.0219C2.651 18.9147 2.52345 18.8237 2.43461 18.7592C2.3903 18.727 2.35546 18.7014 2.3311 18.683C2.31918 18.6741 2.30966 18.6668 2.30278 18.6615C2.29932 18.6589 2.29609 18.6563 2.29399 18.6547C2.29294 18.6539 2.29177 18.6533 2.29106 18.6527L2.29008 18.6518C2.06245 18.4748 1.95574 18.1826 2.01664 17.9008C2.07736 17.6209 2.29264 17.4 2.57036 17.3315ZM8.8477 14.143C8.09008 14.0191 7.29656 14.2498 6.72954 15.1127C5.92585 16.6372 5.02756 17.5494 4.29399 18.0854C4.26982 18.103 4.2445 18.1183 4.22075 18.1352C4.40222 18.2424 4.60281 18.3557 4.8184 18.4672C5.80298 18.9766 7.00406 19.4168 8.09184 19.3637L8.34477 19.3422C8.92977 19.2693 9.46982 19.0375 9.93754 18.5697C10.5675 17.9397 10.8782 17.1552 10.8897 16.4399L10.8887 16.2983C10.8694 15.8167 10.7127 15.3794 10.4288 15.0326L10.2989 14.8901C9.96408 14.5553 9.52081 14.3016 9.05082 14.184L8.8477 14.143Z"
                fill="#343C54"
              />
              <path
                opacity="0.4"
                d="M18.668 3.5464C19.489 2.93302 20.6503 3.00447 21.3896 3.74366C22.1288 4.48281 22.2009 5.64433 21.5879 6.46534L21.4561 6.6255L12.3848 16.5601C12.386 16.5275 12.3891 16.495 12.3896 16.4624L12.3867 16.2378C12.3659 15.7197 12.2438 15.2093 12.0137 14.7427L20.3477 5.61378L20.417 5.52198C20.5539 5.29563 20.523 4.99809 20.3291 4.80421C20.1352 4.61041 19.8376 4.5794 19.6113 4.71632L19.5195 4.78566L10.3955 13.1138C10.0859 12.9458 9.75432 12.8137 9.41016 12.728L9.08984 12.6626C8.9648 12.6422 8.83861 12.6286 8.71191 12.6206L18.5088 3.67823L18.668 3.5464Z"
                fill="#343C54"
              />
            </svg>
          </button>
          <button
            id="Eraser"
            className={`ml-2 h-7 w-12 flex items-center justify-center ${
              mode === "erase"
                ? "bg-gray-200 text-white"
                : "bg-white text-black"
            }  rounded-full hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out`}
            onClick={() => setMode("erase")}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              transform="rotate(0 0 0)"
            >
              <path
                d="M11.0443 3.12928C11.6657 2.05312 13.0417 1.6844 14.1179 2.30572L18.881 5.05572C19.9572 5.67705 20.3259 7.05312 19.7046 8.12928L14.8882 16.4715C14.6811 16.8303 14.2224 16.9532 13.8637 16.7461L13.647 16.621L12.5239 18.5662C12.3168 18.9249 11.8581 19.0478 11.4994 18.8407L5.87024 15.5907C5.51152 15.3836 5.38862 14.9249 5.59572 14.5662L6.7188 12.621L6.50245 12.4961C6.14373 12.289 6.02082 11.8303 6.22793 11.4715L11.0443 3.12928ZM12.348 15.871L8.01784 13.371L7.26976 14.6667L11.5999 17.1667L12.348 15.871ZM13.9641 15.072L18.4056 7.37928C18.6127 7.02056 18.4898 6.56187 18.131 6.35476L13.3679 3.60476C13.0092 3.39766 12.5505 3.52056 12.3434 3.87928L7.90197 11.572L8.0905 11.6809C8.09995 11.6858 8.10934 11.691 8.11866 11.6964L13.7478 14.9464C13.7571 14.9517 13.7663 14.9573 13.7753 14.963L13.9641 15.072Z"
                fill="#343C54"
              />
              <path
                opacity="0.4"
                d="M5.25 20.5C4.83579 20.5 4.5 20.8358 4.5 21.25C4.5 21.6642 4.83579 22 5.25 22H18.75C19.1642 22 19.5 21.6642 19.5 21.25C19.5 20.8358 19.1642 20.5 18.75 20.5H5.25Z"
                fill="#343C54"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex m-8 gap-4 absolute top-[88%] z-10">
        <button
          id="clearBtn"
          className="w-[100px] h-12 px-8 py-2 text-sm font-medium text-[#ededed]-600 rounded-full bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out"
          onClick={() => {
            clearCanvas();
          }}
        >
          Clear
        </button>
        <button
          id="saveBtn"
          className="w-[100px] h-12 px-8 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out"
        >
          Save
        </button>
      </div>
      <div
        className="absolute -z-10 inset-0 h-full w-full 
        bg-[radial-gradient(circle,#73737350_1px,transparent_1px)] 
        bg-[size:10px_10px]"
      />
      <DraggableCard className="absolute z-10 translate-x-[650px] translate-y-[200px]">
        <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>

                <DraggableCardBody
          onDragStart={() => setIsDraggingCard(true)}
          onDragEnd={() => setIsDraggingCard(false)}
          onMouseEnter={() => setIsDraggingCard(true)}
          onMouseLeave={() => setIsDraggingCard(false)}
        >
          <div className="flex flex-col space-y-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={brushValue}
              onChange={(e) => setBrushValue(Number(e.target.value))}
            />
            <button onClick={() => setMode(mode === "draw" ? "erase" : "draw")}>
              {mode === "draw" ? "Erase" : "Draw"}
            </button>
            <button>Save</button>
          </div>
        </DraggableCardBody>
      </DraggableCard>
    </div>
  );
}
