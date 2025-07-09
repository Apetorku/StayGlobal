
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { chatService, Message, Chat } from '@/services/chatService';
import { Send, User, UserCheck, Loader2, MessageCircle, Clock } from "lucide-react";

interface ChatModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal = ({ bookingId, isOpen, onClose }: ChatModalProps) => {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create chat for this booking
  const { data: chatData, isLoading: chatLoading, error: chatError } = useQuery({
    queryKey: ['booking-chat', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.getChatByBooking(bookingId, token);
    },
    enabled: !!bookingId && isOpen,
  });

  // Get messages for the chat
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['chat-messages', chat?._id],
    queryFn: async () => {
      if (!chat) return null;
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      return chatService.getMessages(chat._id, token);
    },
    enabled: !!chat && isOpen,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chat?._id] });
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

  // Update chat when chatData changes
  useEffect(() => {
    if (chatData?.chat) {
      setChat(chatData.chat);
    }
  }, [chatData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chat && userId && isOpen) {
      const unreadCount = chat.ownerId === userId
        ? chat.unreadCount.owner
        : chat.unreadCount.renter;

      if (unreadCount > 0) {
        markAsReadMutation.mutate(chat._id);
      }
    }
  }, [chat, userId, isOpen]);

  const handleSendMessage = () => {
    if (!chat || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      chatId: chat._id,
      message: newMessage.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (chatLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with Landlord</DialogTitle>
            <DialogDescription>
              Loading chat for booking #{bookingId}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (chatError || !chat) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with Landlord</DialogTitle>
            <DialogDescription>
              Booking #{bookingId}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center flex-1 text-center">
            <div>
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600">Unable to load chat</p>
              <p className="text-sm text-gray-500 mt-2">
                Chat is only available for confirmed bookings
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {chat.ownerName}</DialogTitle>
          <DialogDescription>
            {chat.apartmentTitle} {chat.roomNumber && `- Room ${chat.roomNumber}`}
          </DialogDescription>
        </DialogHeader>

        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-96">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messagesError ? (
                <div className="text-center py-8 text-red-600">
                  Failed to load messages
                </div>
              ) : messagesData?.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation with your host!</p>
                </div>
              ) : (
                <>
                  {messagesData?.messages.map((message: Message) => {
                    const isOwn = message.senderId === userId;
                    const isLandlord = message.senderType === 'owner';

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {isLandlord ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium">
                              {isOwn ? 'You' : (isLandlord ? 'Landlord' : 'Guest')}
                            </span>
                            <span className="text-xs opacity-70">
                              {chatService.formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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
