import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { axiosInstance } from '../../api/apiClient';
import { useNavigation } from '@react-navigation/native'; // For navigation after registration
import * as Animatable from 'react-native-animatable';
import { LoginScreenNavigationProp } from '../../types/types';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [iin, setIin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleRegister = async () => {
    try {
      const response = await axiosInstance.post('/user/users/', {
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        iin,
        password,
        role: 'USER',
      });
      setError(null);

      // Show alert for successful registration
      Alert.alert(
        'Регистрация успешна',
        'Пожалуйста, активируйте аккаунт, используя ссылку, отправленную на вашу почту.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Вход'), // Redirect to login screen
          },
        ]
      );
    } catch (err) {
      setError('Регистрация не удалась.');
    }
  };

  return (
    <Animatable.View animation="fadeInUp" duration={1000} style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

      <View style={styles.inputContainer}>
        <Icon name="email" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Электронная почта"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#666" // Higher contrast for iOS
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="person" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Имя"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="person" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Фамилия"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="phone" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Номер телефона"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="credit-card" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="ИИН"
          value={iin}
          onChangeText={setIin}
          style={styles.input}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={24} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Пароль"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#666"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#007aff',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
