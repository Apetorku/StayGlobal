import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { chatService, Chat, Message } from '@/services/chatService';
import {
  MessageSquare,
  Send,
  User,
  Home,
  Clock,
  Loader2,
  MessageCircle
} from 'lucide-react';

interface RenterChatProps {
  bookingId?: string; // Optional: if provided, will open chat for specific booking
}

const RenterChat: React.FC<RenterChatProps> = ({ bookingId }) => {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's chats
  const { data: chats = [], isLoading: chatsLoading, error: chatsError } = useQuery({
    queryKey: ['user-chats'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.getUserChats(token);
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Get chat for specific booking if bookingId is provided
  const { data: bookingChat } = useQuery({
    queryKey: ['booking-chat', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.getChatByBooking(bookingId, token);
    },
    enabled: !!bookingId,
  });

  // Auto-select chat if bookingId is provided
  useEffect(() => {
    if (bookingChat?.chat && !selectedChat) {
      setSelectedChat(bookingChat.chat);
    }
  }, [bookingChat, selectedChat]);

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedChat?._id],
    queryFn: async () => {
      if (!selectedChat) return null;
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.getMessages(selectedChat._id, token);
    },
    enabled: !!selectedChat,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, message }: { chatId: string; message: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.sendMessage(chatId, message, token);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChat?._id] });
      queryClient.invalidateQueries({ queryKey: ['user-chats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.markMessagesAsRead(chatId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chats'] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat && userId) {
      const unreadCount = selectedChat.ownerId === userId 
        ? selectedChat.unreadCount.owner 
        : selectedChat.unreadCount.renter;
      
      if (unreadCount > 0) {
        markAsReadMutation.mutate(selectedChat._id);
      }
    }
  }, [selectedChat, userId]);

  const handleSendMessage = () => {
    if (!selectedChat || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChat._id,
      message: newMessage.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUnreadCount = (chat: Chat): number => {
    if (!userId) return 0;
    return chat.ownerId === userId ? chat.unreadCount.owner : chat.unreadCount.renter;
  };

  if (chatsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with Property Owner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chatsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with Property Owner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load chats</p>
        </CardContent>
      </Card>
    );
  }

  // If bookingId is provided, show single chat view
  if (bookingId && selectedChat) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Chat with {selectedChat.ownerName}</span>
              </div>
              <p className="text-sm font-normal text-gray-500">
                {selectedChat.apartmentTitle} {selectedChat.roomNumber && `- Room ${selectedChat.roomNumber}`}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col h-[500px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messagesData?.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation with your host!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messagesData?.messages.map((message: Message) => {
                    const isOwn = message.senderId === userId;
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 opacity-70" />
                            <span className="text-xs opacity-70">
                              {chatService.formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default view with chat list
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Your Chats
            {chats.length > 0 && (
              <Badge variant="secondary">{chats.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-gray-500 px-4">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Chats will appear when you book properties</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => {
                  const unreadCount = getUnreadCount(chat);
                  const isSelected = selectedChat?._id === chat._id;
                  
                  return (
                    <div
                      key={chat._id}
                      className={`p-4 cursor-pointer border-b transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium text-sm truncate">
                              {chat.ownerName}
                            </h4>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Home className="h-3 w-3" />
                            <span className="truncate">{chat.apartmentTitle}</span>
                            {chat.roomNumber && (
                              <span className="text-blue-600">• Room {chat.roomNumber}</span>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-600 mt-2 truncate">
                              {chat.lastMessage}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {chat.lastMessageAt && (
                            <span className="text-xs text-gray-400">
                              {chatService.formatChatTime(chat.lastMessageAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages - Same as owner chat */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedChat ? (
              <>
                <MessageSquare className="h-5 w-5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>Chat with {selectedChat.ownerName}</span>
                  </div>
                  <p className="text-sm font-normal text-gray-500">
                    {selectedChat.apartmentTitle}
                  </p>
                </div>
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                Select a conversation
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedChat ? (
            <div className="flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messagesData?.messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messagesData?.messages.map((message: Message) => {
                      const isOwn = message.senderId === userId;
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 opacity-70" />
                              <span className="text-xs opacity-70">
                                {chatService.formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenterChat;
