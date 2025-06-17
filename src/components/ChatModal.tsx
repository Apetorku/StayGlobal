
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, UserCheck } from "lucide-react";

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isLandlord: boolean;
}

interface ChatModalProps {
  bookingId: number;
  isOpen: boolean;
  onClose: () => void;
}

// Mock chat data
const mockMessages: Message[] = [
  {
    id: 1,
    senderId: "landlord1",
    senderName: "John Smith (Landlord)",
    content: "Welcome! I'm excited to host you. Is there anything specific you'd like to know about the apartment?",
    timestamp: "2024-01-10T10:00:00Z",
    isLandlord: true,
  },
  {
    id: 2,
    senderId: "user1",
    senderName: "You",
    content: "Hi! Thank you. Could you please let me know about parking availability?",
    timestamp: "2024-01-10T10:15:00Z",
    isLandlord: false,
  },
  {
    id: 3,
    senderId: "landlord1",
    senderName: "John Smith (Landlord)",
    content: "Absolutely! There's a secure parking garage attached to the building. I'll provide you with an access card upon check-in.",
    timestamp: "2024-01-10T10:20:00Z",
    isLandlord: true,
  },
];

const ChatModal = ({ bookingId, isOpen, onClose }: ChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      senderId: "user1",
      senderName: "You",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isLandlord: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate landlord response after a delay
    setTimeout(() => {
      const landlordResponse: Message = {
        id: messages.length + 2,
        senderId: "landlord1",
        senderName: "John Smith (Landlord)",
        content: "Thanks for your message! I'll get back to you shortly.",
        timestamp: new Date().toISOString(),
        isLandlord: true,
      };
      setMessages((prev) => [...prev, landlordResponse]);
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with Landlord</DialogTitle>
          <DialogDescription>
            Booking #{bookingId} - Communicate with your landlord
          </DialogDescription>
        </DialogHeader>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">
              Messages are only available after booking confirmation
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 space-y-4 max-h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isLandlord ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isLandlord
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.isLandlord ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {message.senderName}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use this chat to request amenities, report issues, or ask questions about your stay.
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
