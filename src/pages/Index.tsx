import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface User {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline';
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  userId: string;
  messages: Message[];
  lastMessage?: string;
}

const Index = () => {
  const [currentUser] = useState<User>({
    id: '1',
    username: 'Александр',
    avatar: '',
    status: 'online',
  });

  const [users] = useState<User[]>([
    { id: '2', username: 'Мария', status: 'online' },
    { id: '3', username: 'Иван', status: 'offline' },
    { id: '4', username: 'Екатерина', status: 'online' },
    { id: '5', username: 'Дмитрий', status: 'offline' },
  ]);

  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      userId: '2',
      messages: [
        { id: '1', senderId: '2', text: 'Привет! Как дела?', timestamp: new Date() },
        { id: '2', senderId: '1', text: 'Отлично! А у тебя?', timestamp: new Date() },
      ],
      lastMessage: 'Отлично! А у тебя?',
    },
    {
      id: '2',
      userId: '4',
      messages: [
        { id: '3', senderId: '4', text: 'Встретимся завтра?', timestamp: new Date() },
      ],
      lastMessage: 'Встретимся завтра?',
    },
  ]);

  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: messageInput,
      timestamp: new Date(),
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: messageInput,
            }
          : chat
      )
    );

    setSelectedChat(prev =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: messageInput,
          }
        : null
    );

    setMessageInput('');
  };

  const handleStartChat = (userId: string) => {
    const existingChat = chats.find(chat => chat.userId === userId);
    if (existingChat) {
      setSelectedChat(existingChat);
      setActiveTab('chats');
      return;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      userId,
      messages: [],
      lastMessage: undefined,
    };

    setChats([...chats, newChat]);
    setSelectedChat(newChat);
    setActiveTab('chats');
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-primary/10 animate-gradient-shift bg-gradient-animate overflow-hidden">
      <div className="w-20 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-6 gap-6">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
          <Avatar className="h-12 w-12 relative border-2 border-primary/50">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-medium">
              {currentUser.username[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-2xl transition-all duration-300 hover:scale-110 ${
              activeTab === 'chats'
                ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/50'
                : 'hover:bg-accent/20'
            }`}
            onClick={() => setActiveTab('chats')}
          >
            <Icon name="MessageCircle" size={24} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-2xl transition-all duration-300 hover:scale-110 ${
              activeTab === 'contacts'
                ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/50'
                : 'hover:bg-accent/20'
            }`}
            onClick={() => setActiveTab('contacts')}
          >
            <Icon name="Users" size={24} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-2xl transition-all duration-300 hover:scale-110 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/50'
                : 'hover:bg-accent/20'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <Icon name="User" size={24} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-2xl hover:bg-destructive/20 hover:text-destructive transition-all duration-300 hover:scale-110"
        >
          <Icon name="LogOut" size={24} />
        </Button>
      </div>

      <div className="w-80 bg-card/30 backdrop-blur-xl border-r border-border/50 flex flex-col animate-fade-in">
        <Tabs value={activeTab} className="flex-1 flex flex-col">
          <TabsContent value="chats" className="flex-1 flex flex-col m-0">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
                Чаты
              </h2>
              <div className="relative">
                <Icon
                  name="Search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Поиск чатов..."
                  className="pl-10 bg-background/50 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {chats.map(chat => {
                  const user = getUserById(chat.userId);
                  if (!user) return null;
                  return (
                    <Card
                      key={chat.id}
                      className={`p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-border/50 ${
                        selectedChat?.id === chat.id
                          ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50'
                          : 'bg-card/50 hover:bg-card/80'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          {user.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {user.username}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage || 'Начните диалог'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contacts" className="flex-1 flex flex-col m-0">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent mb-4">
                Контакты
              </h2>
              <div className="relative">
                <Icon
                  name="Search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Поиск по нику..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 rounded-2xl focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredUsers.map(user => (
                  <Card
                    key={user.id}
                    className="p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-card/50 hover:bg-card/80 border-border/50"
                    onClick={() => handleStartChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-accent/30">
                          <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                            {user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        {user.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.status === 'online' ? 'В сети' : 'Не в сети'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="profile" className="flex-1 flex flex-col m-0">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                Профиль
              </h2>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                    <Avatar className="h-24 w-24 relative border-4 border-primary/50">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                        {currentUser.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold">{currentUser.username}</h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>В сети</span>
                    </div>
                  </div>
                </div>

                <Card className="p-6 bg-card/50 border-border/50 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Имя пользователя
                    </label>
                    <Input
                      value={currentUser.username}
                      disabled={!isEditingProfile}
                      className="bg-background/50 border-border/50 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <Input
                      value="user@example.com"
                      disabled={!isEditingProfile}
                      className="bg-background/50 border-border/50 rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">О себе</label>
                    <Input
                      value="Доступен для общения"
                      disabled={!isEditingProfile}
                      className="bg-background/50 border-border/50 rounded-2xl"
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                  >
                    {isEditingProfile ? 'Сохранить изменения' : 'Редактировать профиль'}
                  </Button>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex flex-col animate-slide-up">
        {selectedChat ? (
          <>
            <div className="h-20 bg-card/30 backdrop-blur-xl border-b border-border/50 px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {getUserById(selectedChat.userId)?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  {getUserById(selectedChat.userId)?.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {getUserById(selectedChat.userId)?.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getUserById(selectedChat.userId)?.status === 'online'
                      ? 'В сети'
                      : 'Не в сети'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl hover:bg-accent/20 transition-all duration-300 hover:scale-110"
                >
                  <Icon name="Phone" size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl hover:bg-accent/20 transition-all duration-300 hover:scale-110"
                >
                  <Icon name="Video" size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl hover:bg-accent/20 transition-all duration-300 hover:scale-110"
                >
                  <Icon name="MoreVertical" size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 bg-background/30">
              <div className="p-6 space-y-4">
                {selectedChat.messages.map(message => {
                  const isCurrentUser = message.senderId === currentUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <Card
                        className={`max-w-md p-4 ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-primary to-secondary text-white border-primary/50'
                            : 'bg-card/80 border-border/50'
                        } rounded-2xl transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <p className={isCurrentUser ? 'text-white' : 'text-foreground'}>
                          {message.text}
                        </p>
                        <p
                          className={`text-xs mt-2 ${isCurrentUser ? 'text-white/70' : 'text-muted-foreground'}`}
                        >
                          {message.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="h-20 bg-card/30 backdrop-blur-xl border-t border-border/50 px-6 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl hover:bg-accent/20 transition-all duration-300 hover:scale-110"
              >
                <Icon name="Paperclip" size={20} />
              </Button>

              <div className="flex-1 relative">
                <Input
                  placeholder="Введите сообщение..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  className="bg-background/50 border-border/50 rounded-2xl pr-12 focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl hover:bg-accent/20"
                >
                  <Icon name="Smile" size={18} />
                </Button>
              </div>

              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="h-10 w-10 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100"
              >
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background/20">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Icon name="MessageCircle" size={48} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Выберите чат
              </h3>
              <p className="text-muted-foreground max-w-md">
                Выберите существующий чат или найдите пользователя в контактах, чтобы начать общение
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
