import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MySubscriptionsScreenNavigationProp } from '../types/types';
import { AuthContext } from '../contexts/AuthContext';
import Alert from '../components/Alert'; // Custom alert component
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<MySubscriptionsScreenNavigationProp>();

  if (!authContext?.user) {
    return (
      <View style={styles.container}>
        <Alert type="danger" message="Данные пользователя недоступны." />
      </View>
    );
  }

  const { user, logout } = authContext;

  return (
    <Animatable.View animation="fadeInUp" duration={1000} style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image source={require('../assets/icons/логотип-1.png')} style={styles.avatar} />
        <Text style={styles.username}>{`${user.first_name} ${user.last_name}`}</Text>
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
      <TouchableOpacity style={styles.subscriptionButton} onPress={() => navigation.navigate('Мои абонементы')}>
        <Icon name="subscriptions" size={24} color="#fff" />
        <Text style={styles.subscriptionText}>Мои абонементы</Text>
      </TouchableOpacity>

      {/* Logout Button with original logic */}
      <Button title="Выйти" onPress={logout} color="#FF6347" />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  value: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  subscriptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;
