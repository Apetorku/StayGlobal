
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, Users, Settings } from "lucide-react";

const OwnerChat = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock chat data
  const mockChats = [
    {
      id: "renter-john",
      type: "renter",
      name: "John Doe",
      apartment: "Cozy Downtown Apartment",
      lastMessage: "The heating seems to not be working properly",
      unreadCount: 2,
      messages: [
        { id: 1, sender: "John Doe", message: "Hi, I just checked in. The apartment is great!", time: "10:30 AM", isOwner: false },
        { id: 2, sender: "You", message: "Thank you! I'm glad you like it. Let me know if you need anything.", time: "10:35 AM", isOwner: true },
        { id: 3, sender: "John Doe", message: "The heating seems to not be working properly", time: "2:15 PM", isOwner: false },
      ]
    },
    {
      id: "renter-jane",
      type: "renter", 
      name: "Jane Smith",
      apartment: "Modern Studio",
      lastMessage: "Could I get an extra pillow please?",
      unreadCount: 1,
      messages: [
        { id: 1, sender: "Jane Smith", message: "Hello! The check-in was smooth, thank you.", time: "9:00 AM", isOwner: false },
        { id: 2, sender: "You", message: "You're welcome! Enjoy your stay.", time: "9:05 AM", isOwner: true },
        { id: 3, sender: "Jane Smith", message: "Could I get an extra pillow please?", time: "1:30 PM", isOwner: false },
      ]
    },
    {
      id: "admin-support",
      type: "admin",
      name: "StayGlobal Support",
      apartment: "Admin Support",
      lastMessage: "Your property listing has been approved",
      unreadCount: 0,
      messages: [
        { id: 1, sender: "Support", message: "Hello! We've reviewed your property listing.", time: "Yesterday", isOwner: false },
        { id: 2, sender: "Support", message: "Your property listing has been approved", time: "Today", isOwner: false },
      ]
    }
  ];

  const selectedChatData = mockChats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatData) return;
    
    // Mock sending message
    console.log("Sending message:", newMessage, "to", selectedChatData.name);
    setNewMessage("");
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case "renter":
        return <User className="h-4 w-4" />;
      case "admin":
        return <Settings className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="h-[600px] flex">
        {/* Chat List */}
        <div className="w-1/3 border-r">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {mockChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getChatIcon(chat.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{chat.name}</p>
                          {chat.type === "admin" && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{chat.apartment}</p>
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3">
                  {getChatIcon(selectedChatData.type)}
                  <div>
                    <p className="font-semibold">{selectedChatData.name}</p>
                    <p className="text-sm text-gray-600 font-normal">{selectedChatData.apartment}</p>
                  </div>
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {selectedChatData.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwner ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isOwner
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${message.isOwner ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OwnerChat;
