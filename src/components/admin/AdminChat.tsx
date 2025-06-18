
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Clock } from "lucide-react";

const AdminChat = () => {
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Mock chat data
  const ownerChats = [
    {
      ownerId: "OWN001",
      ownerName: "John Smith",
      lastMessage: "Thanks for helping with the booking issue!",
      timestamp: "2 hours ago",
      unread: 0,
      status: "online"
    },
    {
      ownerId: "OWN002",
      ownerName: "Maria Garcia",
      lastMessage: "I need help with payment processing",
      timestamp: "1 day ago",
      unread: 2,
      status: "offline"
    },
    {
      ownerId: "OWN003",
      ownerName: "David Wilson",
      lastMessage: "Can you help me understand the commission structure?",
      timestamp: "3 days ago",
      unread: 1,
      status: "online"
    },
  ];

  const chatMessages = [
    {
      id: 1,
      sender: "owner",
      message: "Hi, I'm having trouble with a guest check-in",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      sender: "admin",
      message: "Hello! I'd be happy to help. Can you provide the booking ID?",
      timestamp: "10:32 AM",
    },
    {
      id: 3,
      sender: "owner",
      message: "Sure, it's BK123456. The guest says the check-in code isn't working.",
      timestamp: "10:35 AM",
    },
    {
      id: 4,
      sender: "admin",
      message: "Let me check that for you. I see the issue - the code was reset due to a system update. I'll generate a new one for you.",
      timestamp: "10:37 AM",
    },
  ];

  const handleSendMessage = () => {
    if (message.trim() && selectedOwner) {
      console.log(`Sending message to ${selectedOwner}: ${message}`);
      setMessage("");
      // Implement send message logic
    }
  };

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwner(ownerId);
    console.log(`Selected owner: ${ownerId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Owner List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Owner Conversations
          </CardTitle>
          <CardDescription>Click on an owner to start or continue a conversation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2">
            {ownerChats.map((chat) => (
              <div
                key={chat.ownerId}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedOwner === chat.ownerId ? "bg-blue-50 border-blue-200" : ""
                }`}
                onClick={() => handleSelectOwner(chat.ownerId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{chat.ownerName}</span>
                    <Badge 
                      variant={chat.status === "online" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {chat.status}
                    </Badge>
                  </div>
                  {chat.unread > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{chat.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedOwner ? (
              `Chat with ${ownerChats.find(chat => chat.ownerId === selectedOwner)?.ownerName}`
            ) : (
              "Select an owner to start chatting"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[480px]">
          {selectedOwner ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === "admin" ? "text-blue-200" : "text-gray-500"
                      }`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an owner from the list to start a conversation</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChat;
