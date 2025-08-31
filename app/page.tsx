"use client";
import React, { useEffect, useRef, useState } from "react";
import RangeSlider from "@/components/RangeSlider/RangeSlider";
import CardData from "@/components/interfaces/cardData";
import { v4 as uuidv4 } from "uuid";
import { div } from "framer-motion/client";
import FileDropzone from "@/components/FileDropping/fileDroppingZone";

interface Stroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  mode: "draw" | "erase";
}

interface cardPosition {
  id: string;
  x: number;
  y: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [cardPosition, setCardPosition] = useState<cardPosition[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [showTypeSelection, setShowTypeSelection] = useState<boolean | null>(
    false
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [mode, setMode] = useState<"draw" | "erase">("draw");

  const scaleRef = useRef(1); // zoom level
  const offsetXRef = useRef(0); // pan x
  const offsetYRef = useRef(0); // pan y

  const prevMouseRef = useRef<{ x: number; y: number } | null>(null);

  const dragCard = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const card = cardRefs.current[id];
    if (!card) return;

    // get initial card position
    const initialPos = cardPosition.find((c) => c.id === id) || {
      x: 100,
      y: 100,
      id,
    };

    const handleMouseMove = (eMove: MouseEvent) => {
      const dx = (eMove.clientX - startX) / scaleRef.current;
      const dy = (eMove.clientY - startY) / scaleRef.current;

      setCardPosition((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, x: initialPos.x + dx, y: initialPos.y + dy } : c
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };


  const addCard = (type: "text" | "image" | "video", content: string) => {
    const id = uuidv4();
    setCards((prev) => [...prev, { id, x: 100, y: 100, type, content }]);
    setCardPosition((prev) => [...prev, { id, x: 100, y: 100 }]);
  };

  // Convert between screen and true coordinates
  const toScreenX = (x: number) => (x + offsetXRef.current) * scaleRef.current;
  const toScreenY = (y: number) => (y + offsetYRef.current) * scaleRef.current;
  const toTrueX = (x: number) => x / scaleRef.current - offsetXRef.current;
  const toTrueY = (y: number) => y / scaleRef.current - offsetYRef.current;

  // Render the canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(toScreenX(stroke.x0), toScreenY(stroke.y0));
      ctx.lineTo(toScreenX(stroke.x1), toScreenY(stroke.y1));
      ctx.lineWidth = stroke.size;

      if (stroke.mode === "draw") {
        ctx.globalCompositeOperation = "source-over"; // normal drawing
        ctx.strokeStyle = stroke.color;
      } else {
        ctx.globalCompositeOperation = "destination-out"; // erases instead of drawing
        ctx.strokeStyle = "rgba(0,0,0,1)";
      }

      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over"; // reset after drawing
  };

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        prevMouseRef.current = { x: e.pageX, y: e.pageY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!prevMouseRef.current) return;

      const prev = prevMouseRef.current;
      const x = toTrueX(e.pageX);
      const y = toTrueY(e.pageY);
      const prevX = toTrueX(prev.x);
      const prevY = toTrueY(prev.y);

      if (e.buttons === 1) {
        // Draw stroke
        const newStroke: Stroke = {
          x0: prevX,
          y0: prevY,
          x1: x,
          y1: y,
          color,
          size: brushSize,
          mode,
        };
        setStrokes((prev) => [...prev, newStroke]);
      }

      prevMouseRef.current = { x: e.pageX, y: e.pageY };
      renderCanvas();
    };

    const handleMouseUp = () => {
      prevMouseRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const delta = -e.deltaY / 500;
      const newScale = Math.min(Math.max(scaleRef.current + delta, 0.5), 3);

      // Zoom around cursor
      const rect = canvasRef.current!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate the true coordinates under cursor
      const trueCursorX = cursorX / scaleRef.current - offsetXRef.current;
      const trueCursorY = cursorY / scaleRef.current - offsetYRef.current;

      // Update scale
      scaleRef.current = newScale;

      // Adjust offsets so the point under cursor stays fixed
      offsetXRef.current = cursorX / scaleRef.current - trueCursorX;
      offsetYRef.current = cursorY / scaleRef.current - trueCursorY;

      // Update all card positions to match canvas transform
      cards.forEach((card) => {
        const el = cardRefs.current[card.id];
        const pos = cardPosition.find((c) => c.id === card.id);
        if (!el || !pos) return;

        el.style.left = `${toScreenX(pos.x)}px`;
        el.style.top = `${toScreenY(pos.y)}px`;
        el.style.transform = `scale(${
          scaleRef.current < 1.2 ? scaleRef.current : 1
        })`;
      });

      // Render canvas
      renderCanvas();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", renderCanvas);

    renderCanvas();

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", renderCanvas);
    };
  }, [brushSize, color, mode, cards, strokes]);

  const clearCanvas = () => {
    setStrokes([]);
    setCards([]);
    setCardPosition([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const renderInput = (type: string) => {
    switch (type) {
      case "text":
        return (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          bg-white shadow-xl rounded-2xl p-4 w-80 flex flex-col gap-4 z-30"
          >
            <div
              className="absolute top-[-15px] right-0 bg-black text-white shadow-xl rounded-full py-1 px-3 cursor-pointer"
              onClick={() => {
                setSelectedType(null);
              }}
            >
              X
            </div>
            <textarea
              className="border rounded-lg p-2"
              placeholder="Enter text..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addCard("text", (e.target as HTMLTextAreaElement).value);
                  setSelectedType(null);
                  setShowTypeSelection(false);
                }
              }}
            />
            <button
              className="bg-black text-white px-4 py-2 rounded-lg"
              onClick={() => {
                const input = document.querySelector(
                  "textarea"
                ) as HTMLTextAreaElement;
                if (input?.value) {
                  addCard("text", input.value);
                  setSelectedType(null);
                  setShowTypeSelection(false);
                }
              }}
            >
              Add
            </button>
          </div>
        );

      case "image":
        return (
          <FileDropzone setSelectedType ={setSelectedType} />
        );

      case "video":
        return (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          bg-white shadow-xl rounded-2xl p-4 w-80 flex flex-col gap-4 z-30"
          >
            <div
              className="absolute top-[-15px] right-0 bg-black text-white shadow-xl rounded-full py-1 px-3 cursor-pointer"
              onClick={() => {
                setSelectedType(null);
              }}
            >
              X
            </div>
            <input
              type="text"
              placeholder="Paste video URL"
              className="border rounded-lg p-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCard("video", (e.target as HTMLInputElement).value);
                  setSelectedType(null);
                  setShowTypeSelection(false);
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-screen min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:16px_16px]" />

      <canvas
        ref={canvasRef}
        className="relative w-full h-full overflow-hidden z-10"
        style={{
          cursor: mode === "erase" ? "cell" : "crosshair",
        }}
      />

      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 
    bg-white/90 backdrop-blur-md shadow-md border rounded-2xl z-30`}
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
          value={brushSize}
          onChange={(e: any) => {
            setBrushSize(+e.target.value);
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

      <div
        className="absolute top-4 right-4  flex items-center gap-4 px-5 py-3 
    bg-white/90 backdrop-blur-md shadow-md border rounded-full z-30 hover:bg-black/5 hover:transform hover:scale-110 transition-all duration-300 ease-out"
        onClick={() => {
          setShowTypeSelection(!showTypeSelection);
        }}
      >
        +
      </div>
      <div className="flex m-8 gap-4 absolute bottom-10 z-30">
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

      <div className="absolute top-0 left-0 w-full h-full">
        {showTypeSelection && selectedType === null && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                bg-white shadow-xl rounded-2xl p-4 w-60 
                flex flex-col gap-10 z-20 border border-gray-200"
          >
            <div
              className="absolute top-0 right-0 bg-black text-white shadow-xl rounded-full py-1 px-3 cursor-pointer"
              onClick={() => {
                setShowTypeSelection(false);
              }}
            >
              X
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <button
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium 
                         text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                         transition-colors"
                  onClick={() => {
                    setSelectedType("text");
                  }}
                >
                  ✏️ Text
                </button>
              </li>
              <li>
                <button
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium 
                         text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                         transition-colors"
                  onClick={() => {
                    setSelectedType("image");
                  }}
                >
                  🖼️ Image
                </button>
              </li>
              <li>
                <button
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium 
                         text-gray-700 hover:bg-gray-100 hover:text-gray-900 
                         transition-colors"
                  onClick={() => {
                    setSelectedType("video");
                  }}
                >
                  🎥 Video
                </button>
              </li>
            </ul>
          </div>
        )}

        {selectedType !== null && renderInput(selectedType)}

        {cards.map((card) => {
          const pos = cardPosition.find((c) => c.id === card.id) || {
            x: 100,
            y: 100,
            id: card.id,
          };
          return (
            <div
              key={card.id}
              ref={(el) => {
                cardRefs.current[card.id] = el;
              }}
              onMouseDown={(e) => dragCard(card.id, e)}
              className="absolute p-4 bg-white shadow rounded cursor-grab z-20"
              style={{
                left: toScreenX(pos.x),
                top: toScreenY(pos.y),
              }}
            >
              {card.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
