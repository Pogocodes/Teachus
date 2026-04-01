import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  isMe?: boolean;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
}

export default function ChatPanel({ socket, roomId }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceive = (msg: { message: string; senderName: string; timestamp: string }) => {
      setMessages((prev) => [...prev, {
        ...msg,
        id: Math.random().toString(36).substring(7),
        isMe: msg.senderName === user?.fullName
      }]);
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !user) return;

    const newMsg = {
      roomId,
      senderName: user.fullName || "User",
      message: inputValue,
      timestamp: new Date().toISOString()
    };
    
    socket.emit("send-message", newMsg);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
            <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
            <p>No messages yet.</p>
            <p className="mt-1">Say hi to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <span className="text-[10px] uppercase font-medium tracking-wider text-gray-500 mb-1 px-1">
                {msg.isMe ? 'You' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              <div 
                className={`max-w-[85%] px-4 py-2 text-sm shadow-sm ${
                  msg.isMe 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                    : 'bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm border border-gray-700/50'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950/80 backdrop-blur-md border-t border-gray-800 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..." 
            className="flex-1 bg-gray-900 border-gray-700 text-white focus-visible:ring-primary pr-12 rounded-full h-10 shadow-inner"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim()}
            className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
          >
             <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
