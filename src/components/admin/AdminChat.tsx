
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { adminChatService, AdminChat as AdminChatType, AdminChatMessage, AvailableOwner } from "@/services/adminChatService";
import { MessageSquare, Send, User, Clock, RefreshCw, MessageCircle, Eye, Plus, Users } from "lucide-react";

const AdminChat = () => {
  const [selectedChat, setSelectedChat] = useState<AdminChatType | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showOwnersList, setShowOwnersList] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available owners
  const { data: ownersData, isLoading: ownersLoading, error: ownersError } = useQuery({
    queryKey: ['available-owners'],
    queryFn: () => adminChatService.getAvailableOwners(),
    retry: 2,
  });

  // Fetch admin chats
  const { data: chatsData, isLoading: chatsLoading, error: chatsError, refetch } = useQuery({
    queryKey: ['admin-chats'],
    queryFn: () => adminChatService.getAdminChats(),
    retry: 2,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-chat-messages', selectedChat?._id],
    queryFn: () => selectedChat ? adminChatService.getChatMessages(selectedChat._id) : null,
    enabled: !!selectedChat,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: string; message: string }) =>
      adminChatService.sendMessage(chatId, message),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages', selectedChat?._id] });
      queryClient.invalidateQueries({ queryKey: ['admin-chats'] });
      scrollToBottom();
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
    mutationFn: (chatId: string) => adminChatService.markMessagesAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chats'] });
    },
  });

  const chats = chatsData?.chats || [];
  const messages = messagesData?.messages || [];
  const availableOwners = ownersData?.owners || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && selectedChat.unreadCount.admin > 0) {
      markAsReadMutation.mutate(selectedChat._id);
    }
  }, [selectedChat]);

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

  const handleStartNewChat = async (owner: AvailableOwner) => {
    try {
      console.log(`Starting new chat with owner: ${owner.name}`);
      const result = await adminChatService.getOrCreateChat(owner.clerkId);

      // Refresh chats and select the new/existing chat
      await refetch();

      // Find and select the chat
      const updatedChats = await adminChatService.getAdminChats();
      const newChat = updatedChats.chats.find(chat => chat.ownerId === owner.clerkId);
      if (newChat) {
        setSelectedChat(newChat);
      }

      setShowOwnersList(false);

      toast({
        title: "Success",
        description: `Chat with ${owner.name} is ready!`,
      });
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (chat: AdminChatType) => {
    if (chat.unreadCount.admin > 0) {
      return <Badge variant="destructive">{chat.unreadCount.admin} new</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {showOwnersList ? 'Start New Chat' : 'Owner Chats'}
            </div>
            <div className="flex gap-2">
              {!showOwnersList && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOwnersList(true)}
                  title="Start new chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {showOwnersList && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOwnersList(false)}
                  title="Back to chats"
                >
                  ←
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={chatsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${chatsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {showOwnersList
              ? 'Select a house owner to start a new conversation'
              : 'Chat with house owners for support and management'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {showOwnersList ? (
              // Show available owners for new chat
              ownersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading owners...</span>
                </div>
              ) : ownersError ? (
                <div className="text-center py-8 px-4">
                  <p className="text-red-600 mb-4">Error loading owners</p>
                  <Button onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : availableOwners.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No house owners found</p>
                  <p className="text-sm text-gray-500">House owners will appear here when they list apartments</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {availableOwners.map((owner) => (
                    <div
                      key={owner.clerkId}
                      className="p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors"
                      onClick={() => handleStartNewChat(owner)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm truncate">
                              {owner.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{owner.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined: {new Date(owner.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-2">
                          <Badge variant="outline">Start Chat</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Show existing chats
              chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading chats...</span>
                </div>
              ) : chatsError ? (
                <div className="text-center py-8 px-4">
                  <p className="text-red-600 mb-4">Error loading chats</p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No chats yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start a conversation with house owners</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowOwnersList(true)}
                    className="mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                        selectedChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm truncate">
                              {chat.ownerName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{chat.ownerEmail}</p>
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
                          {getStatusBadge(chat)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {selectedChat ? `Chat with ${selectedChat.ownerName}` : 'Select a chat'}
          </CardTitle>
          <CardDescription>
            {selectedChat ? selectedChat.ownerEmail : 'Choose an owner to start chatting'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedChat ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a chat to start messaging</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-[500px]">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.senderType === 'admin' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderType === 'admin'
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
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Message Input */}
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
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
  );
};

export default AdminChat;
