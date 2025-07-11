
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { chatService, Chat, Message } from '@/services/chatService';
import {
  MessageSquare,
  Send,
  User,
  Home,
  Clock,
  Loader2,
  MessageCircle,
  Shield,
  Users
} from 'lucide-react';

// Admin chat types
interface OwnerAdminChatMessage {
  _id: string;
  chatId: string;
  senderId: string;
  senderType: 'admin' | 'owner';
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface OwnerAdminChatData {
  _id: string;
  adminId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  adminName: string;
  subject?: string;
  isActive: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  unreadCount: {
    admin: number;
    owner: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Admin chat service
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const makeAdminChatRequest = async (endpoint: string, token: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}/admin-chat/owner${endpoint}`;
  console.log('🔗 Making admin chat request:', fullUrl);

  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  console.log('📡 Admin chat response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Admin chat request failed:', response.status, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Admin chat response data:', data);
  return data;
};

const OwnerChat = () => {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Admin chat state
  const [selectedAdminChat, setSelectedAdminChat] = useState<OwnerAdminChatData | null>(null);
  const [newAdminMessage, setNewAdminMessage] = useState('');
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);

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

  // Admin chat queries and mutations
  const { data: adminChatsData, isLoading: adminChatsLoading, error: adminChatsError, refetch: refetchAdminChats } = useQuery({
    queryKey: ['owner-admin-chats'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return makeAdminChatRequest('/chats', token);
    },
    retry: 2,
    refetchInterval: 30000,
  });

  const { data: adminMessagesData, isLoading: adminMessagesLoading } = useQuery({
    queryKey: ['owner-admin-chat-messages', selectedAdminChat?._id],
    queryFn: async () => {
      if (!selectedAdminChat) return null;
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return makeAdminChatRequest(`/chats/${selectedAdminChat._id}/messages`, token);
    },
    enabled: !!selectedAdminChat,
    refetchInterval: 10000,
  });

  const sendAdminMessageMutation = useMutation({
    mutationFn: async ({ chatId, message }: { chatId: string; message: string }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return makeAdminChatRequest(`/chats/${chatId}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      setNewAdminMessage('');
      queryClient.invalidateQueries({ queryKey: ['owner-admin-chat-messages', selectedAdminChat?._id] });
      queryClient.invalidateQueries({ queryKey: ['owner-admin-chats'] });
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    },
  });

  const markAdminAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return makeAdminChatRequest(`/chats/${chatId}/read`, token, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-admin-chats'] });
    },
  });

  // Admin chat effects
  useEffect(() => {
    adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminMessagesData?.messages]);

  useEffect(() => {
    if (selectedAdminChat && selectedAdminChat.unreadCount.owner > 0) {
      markAdminAsReadMutation.mutate(selectedAdminChat._id);
    }
  }, [selectedAdminChat]);

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

  // Admin chat handlers
  const handleSendAdminMessage = () => {
    if (!selectedAdminChat || !newAdminMessage.trim()) return;

    sendAdminMessageMutation.mutate({
      chatId: selectedAdminChat._id,
      message: newAdminMessage.trim()
    });
  };

  const handleAdminKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAdminMessage();
    }
  };

  const getAdminStatusBadge = (chat: OwnerAdminChatData) => {
    if (chat.unreadCount.owner > 0) {
      return <Badge variant="destructive">{chat.unreadCount.owner} new</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  if (chatsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with Guests
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
            Chat with Guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load chats</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="guests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Guest Chats
            {chats.length > 0 && (
              <Badge variant="secondary">{chats.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Chat List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Guest Conversations
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
                <p className="text-sm mt-2">Chats will appear when guests book your properties</p>
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
                              {chatService.getOtherParticipantName(chat, userId || '')}
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

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedChat ? (
              <>
                <MessageSquare className="h-5 w-5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{chatService.getChatTitle(selectedChat, userId || '')}</span>
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
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Admin Chat List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Support
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAdminChats()}
                    disabled={adminChatsLoading}
                  >
                    <MessageSquare className={`h-4 w-4 ${adminChatsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {adminChatsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading chats...</span>
                    </div>
                  ) : adminChatsError ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-red-600 mb-4">Error loading chats</p>
                      <Button onClick={() => refetchAdminChats()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : adminChatsData?.chats.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No admin chats yet</p>
                      <p className="text-sm text-gray-500">Admin will contact you when needed</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {adminChatsData?.chats.map((chat) => (
                        <div
                          key={chat._id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                            selectedAdminChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => setSelectedAdminChat(chat)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-sm truncate">
                                  {chat.adminName}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{chat.subject || 'Admin Support'}</p>
                              {chat.lastMessage && (
                                <p className="text-sm text-gray-600 truncate">
                                  {chat.lastMessage}
                                </p>
                              )}
                              {chat.lastMessageAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(chat.lastMessageAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="ml-2">
                              {getAdminStatusBadge(chat)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Admin Chat Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {selectedAdminChat ? `Chat with ${selectedAdminChat.adminName}` : 'Select a chat'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedAdminChat ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a chat to start messaging</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-[500px]">
                    <ScrollArea className="flex-1 p-4">
                      {adminMessagesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading messages...</span>
                        </div>
                      ) : adminMessagesData?.messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No messages yet</p>
                          <p className="text-sm text-gray-500">Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {adminMessagesData?.messages.map((message: OwnerAdminChatMessage) => (
                            <div
                              key={message._id}
                              className={`flex ${
                                message.senderType === 'owner' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.senderType === 'owner'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {message.senderName}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm">{message.message}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={adminMessagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          value={newAdminMessage}
                          onChange={(e) => setNewAdminMessage(e.target.value)}
                          onKeyPress={handleAdminKeyPress}
                          placeholder="Type your message to admin..."
                          disabled={sendAdminMessageMutation.isPending}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendAdminMessage}
                          disabled={!newAdminMessage.trim() || sendAdminMessageMutation.isPending}
                          size="sm"
                        >
                          {sendAdminMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerChat;
