import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { axiosInstance, endpoints } from '../../api/apiClient';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/types';

type ManageSubscriptionScreenRouteProp = RouteProp<RootStackParamList, 'Управление абонементом'>;
type ManageSubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Управление абонементом'>;

type Props = {
  route: ManageSubscriptionScreenRouteProp;
  navigation: ManageSubscriptionScreenNavigationProp;
};

const ManageSubscriptionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId } = route.params;
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await axiosInstance.get(`${endpoints.SUBSCRIPTIONS}${subscriptionId}/`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке подписки:', error);
    }
  };

  if (!subscription) {
    return <Text>Загрузка...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Подписка</Text>
      <Text style={styles.info}>Тип: {subscription.type}</Text>
      <Text style={styles.info}>Статус: {subscription.is_active ? 'Активна' : 'Неактивна'}</Text>
      <Text style={styles.info}>Начало: {new Date(subscription.start_date).toLocaleDateString()}</Text>
      <Text style={styles.info}>Окончание: {new Date(subscription.end_date).toLocaleDateString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ManageSubscriptionScreen;
