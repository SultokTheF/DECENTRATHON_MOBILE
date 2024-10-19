import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MySubscriptionsScreenNavigationProp } from '../types/types';
import { AuthContext } from '../contexts/AuthContext';
import Alert from '../components/Alert'; // Custom alert component
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import { axiosInstance, endpoints } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

const CHAT_MESSAGES_STORAGE_KEY = 'CHAT_MESSAGES';

const ProfileScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<MySubscriptionsScreenNavigationProp>();

  const [isChatModalVisible, setChatModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat messages from AsyncStorage on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (error) {
        console.error('Failed to load messages from storage:', error);
      }
    };

    loadMessages();
  }, []);

  // Save chat messages to AsyncStorage whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      try {
        await AsyncStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save messages to storage:', error);
      }
    };

    saveMessages();
  }, [messages]);

  if (!authContext?.user) {
    return (
      <View style={styles.container}>
        <Alert type="danger" message="Данные пользователя недоступны." />
      </View>
    );
  }

  const { user, logout } = authContext;

  const toggleChatModal = () => {
    setChatModalVisible(!isChatModalVisible);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isAIResponding) return;

    const userMessage: Message = {
      id: Date.now(), // Use timestamp as a unique ID
      sender: 'user',
      text: inputText.trim(),
    };

    // Add user message to the chat
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsAIResponding(true);

    // Add AI placeholder message
    const aiPlaceholderMessage: Message = {
      id: Date.now() + 1,
      sender: 'ai',
      text: 'Думаю...',
    };
    setMessages((prevMessages) => [...prevMessages, aiPlaceholderMessage]);
    scrollToBottom();

    try {
      // Make API call to get the AI response
      const response = await axiosInstance.post(endpoints.ANSWER, {
        question: userMessage.text,
      });

      const { answer } = response.data;

      // Replace the placeholder message with the actual answer
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiPlaceholderMessage.id
            ? { ...msg, text: answer }
            : msg
        )
      );
    } catch (error) {
      console.error('Error fetching AI response:', error);
      // Replace the placeholder with an error message
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiPlaceholderMessage.id
            ? { ...msg, text: 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.' }
            : msg
        )
      );
    } finally {
      setIsAIResponding(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Listen to modal visibility to clear messages if needed
  useEffect(() => {
    if (isChatModalVisible) {
      // Optionally, you can load messages from storage here if not already loaded
    }
  }, [isChatModalVisible]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animatable.View animation="fadeInUp" duration={1000} style={styles.container}>
        {/* Chat Modal */}
        <Modal
          isVisible={isChatModalVisible}
          onSwipeComplete={toggleChatModal}
          swipeDirection="down"
          onBackdropPress={toggleChatModal}
          style={styles.modal}
          propagateSwipe
          animationIn="slideInUp"
          animationOut="slideOutDown"
          backdropTransitionOutTiming={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContent}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Zhan AI Ассистент</Text>
                <TouchableOpacity onPress={toggleChatModal}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.chatContainer}
                ref={scrollViewRef}
                onContentSizeChange={() => scrollToBottom()}
              >
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text style={msg.sender === 'user' ? styles.userText : styles.aiText}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Введите сообщение..."
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                  editable={!isAIResponding}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    isAIResponding ? styles.sendButtonDisabled : {},
                  ]}
                  onPress={sendMessage}
                  disabled={isAIResponding}
                >
                  {isAIResponding ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Icon name="send" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Profile Content */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarContainer}>
            <Image source={require('../assets/icons/логотип-1.png')} style={styles.avatar} />
            <Text style={styles.username}>{`${user.first_name} ${user.last_name}`}</Text>
            {/* Chat Button */}
            <TouchableOpacity
              style={[
                styles.chatButton,
                isAIResponding ? styles.chatButtonDisabled : {},
              ]}
              onPress={toggleChatModal}
              disabled={isAIResponding}
            >
              <Icon name="chat" size={24} color="#fff" />
              <Text style={styles.chatButtonText}>Чат с Zhan AI</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="email" size={24} color="#333" />
              <Text style={styles.label}>Email:</Text>
            </View>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="person" size={24} color="#333" />
              <Text style={styles.label}>Имя:</Text>
            </View>
            <Text style={styles.value}>{user.first_name}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="people" size={24} color="#333" />
              <Text style={styles.label}>Фамилия:</Text>
            </View>
            <Text style={styles.value}>{user.last_name}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="phone" size={24} color="#333" />
              <Text style={styles.label}>Телефон:</Text>
            </View>
            <Text style={styles.value}>{user.phone_number}</Text>
          </View>

          {/* Мои абонементы Button */}
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => navigation.navigate('Мои абонементы')}
          >
            <Icon name="subscriptions" size={24} color="#fff" />
            <Text style={styles.subscriptionText}>Мои абонементы</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Logout Button */}
        <View style={styles.logoutButtonContainer}>
          <Button title="Выйти" onPress={logout} color="#FF6347" />
        </View>
      </Animatable.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20, // To provide space above the logout button
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
    elevation: 2,
  },
  chatButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  chatButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  value: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
    marginLeft: 34, // Align with the label text
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
    elevation: 3,
  },
  subscriptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutButtonContainer: {
    marginTop: 10,
    width: '100%',
  },
  // Modal Styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    height: '60%', // Reduced height for better screen fit
    backgroundColor: '#ffffff',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 6,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: '#E6E6E6',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  userText: {
    color: '#000',
    fontSize: 16,
  },
  aiText: {
    color: '#000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
});

export default ProfileScreen;
