import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Globe, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, ChatRequest, ChatResponse } from "@shared/api";
import { cn } from "@/lib/utils";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your Sehat Setu medical assistant. How can I help you today? \n\nनमस्ते! मैं आपका सेहत सेतु चिकित्सा सहायक हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const payload: ChatRequest = {
        messages: newMessages,
        language,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = (await response.json()) as ChatResponse;
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I am having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "hi" : "en");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Bubble Toggle */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center relative group"
        >
          <MessageCircle className="h-8 w-8 text-white" />
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 md:w-96 shadow-2xl flex flex-col h-[500px] max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between p-4 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              <div>
                <CardTitle className="text-lg">Health Assistant</CardTitle>
                <p className="text-xs text-primary-foreground/80">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                onClick={toggleLanguage}
                title="Toggle Language (English/Hindi)"
              >
                <Globe className="h-3 w-3" />
                {language === "en" ? "EN" : "HI"}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/80 hover:text-white rounded-full h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="flex flex-col gap-3">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex max-w-[80%] rounded-xl px-4 py-2 text-sm shadow-sm",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground self-end rounded-br-none" 
                        : "bg-muted text-foreground self-start rounded-bl-none"
                    )}
                  >
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted text-foreground self-start rounded-xl rounded-bl-none px-4 py-2 max-w-[80%] flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Typing...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t bg-card">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="flex w-full items-center gap-2"
            >
              <Input 
                placeholder={language === "en" ? "Ask a health question..." : "स्वास्थ्य संबंधी प्रश्न पूछें..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-full focus-visible:ring-primary"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading}
                className="rounded-full shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
