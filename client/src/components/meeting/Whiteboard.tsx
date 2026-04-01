import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Trash2, Pencil, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
}

export default function Whiteboard({ socket, roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#3b82f6"); 
  const [lineWidth, setLineWidth] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match the container precisely
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // set background to somewhat dark transparent or default
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Incoming draw events
    if (socket) {
      socket.on("draw", ({ x, y, type, color: strokeColor, lineWidth: sw, isEraser }) => {
        if (type === "start") {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else if (type === "draw") {
          ctx.lineTo(x, y);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = sw || 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          if (isEraser) {
            ctx.globalCompositeOperation = "destination-out";
          } else {
            ctx.globalCompositeOperation = "source-over";
          }
          ctx.stroke();
        } else if (type === "end") {
          ctx.closePath();
          ctx.globalCompositeOperation = "source-over"; // reset
        }
      });

      socket.on("clear-board", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socket) {
        socket.off("draw");
        socket.off("clear-board");
      }
    };
  }, [socket]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    
    const isEraser = activeTool === "eraser";
    socket?.emit("draw", { roomId, drawData: { x, y, type: "start", color, lineWidth, isEraser } });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const isEraser = activeTool === "eraser";
    
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (isEraser) {
         ctx.globalCompositeOperation = "destination-out";
      } else {
         ctx.globalCompositeOperation = "source-over";
      }
      ctx.stroke();
    }
    
    socket?.emit("draw", { roomId, drawData: { x, y, type: "draw", color, lineWidth, isEraser } });
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent | React.FocusEvent) => {
    if (isDrawing) {
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.closePath();
        ctx.globalCompositeOperation = "source-over"; // Reset to defaults after drawing
      }
      
      const { x, y } = getCoordinates(e as any); // fallback for type closure
      const isEraser = activeTool === "eraser";
      socket?.emit("draw", { roomId, drawData: { x, y, type: "end", color, lineWidth, isEraser } });
    }
  };
  
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      socket?.emit("clear-board", roomId);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1e1e1e] cursor-crosshair">
       <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-gray-900/90 p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700 z-10">
         <Button variant={activeTool === "pen" ? "secondary" : "ghost"} size="icon" onClick={() => setActiveTool("pen")} className="rounded-xl">
            <Pencil className="h-5 w-5"/>
         </Button>
         <Button variant={activeTool === "eraser" ? "secondary" : "ghost"} size="icon" onClick={() => setActiveTool("eraser")} className="rounded-xl">
            <Eraser className="h-5 w-5"/>
         </Button>
         
         <div className="w-full h-[1px] bg-gray-700 my-1"></div>
         
         {/* Colors */}
         {["#ef4444", "#3b82f6", "#22c55e", "#fbbf24", "#ffffff"].map(c => (
            <button 
              key={c}
              className={`w-8 h-8 rounded-full border-2 transition-all mx-auto ${color === c && activeTool === "pen" ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "border-transparent opacity-80 hover:opacity-100"}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setActiveTool("pen"); }}
              title={`Color: ${c}`}
            />
         ))}
         
         <div className="w-full h-[1px] bg-gray-700 my-1"></div>
         
         {/* Brush Sizes */}
         {[2, 4, 8, 12].map(size => (
            <button 
              key={size}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all mx-auto ${lineWidth === size ? "bg-gray-700" : "hover:bg-gray-800"}`}
              onClick={() => setLineWidth(size)}
              title={`Size: ${size}`}
            >
              <div className="rounded-full bg-white transition-all shadow-sm" style={{ width: size + 2, height: size + 2 }}/>
            </button>
         ))}
       </div>

       <Button 
         variant="secondary" 
         size="sm" 
         className="absolute bottom-6 right-6 z-10 shrink-0 shadow-xl bg-gray-800 hover:bg-red-600 hover:border-red-500 hover:text-white transition-colors rounded-full px-6" 
         onClick={handleClear}
       >
         <Trash2 className="h-4 w-4 mr-2" /> Clear Board
       </Button>
       
       <canvas
         ref={canvasRef}
         onMouseDown={startDrawing}
         onMouseMove={draw}
         onMouseUp={stopDrawing}
         onMouseOut={stopDrawing}
         onTouchStart={startDrawing}
         onTouchMove={draw}
         onTouchEnd={stopDrawing}
         onTouchCancel={stopDrawing}
         className="w-full h-full touch-none"
       />
    </div>
  );
}
