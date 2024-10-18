import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { axiosInstance, endpoints } from '../../api/apiClient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SectionDetailScreenNavigationProp } from '@/src/types/types';
import { Section, Category, Schedule, Subscription } from '../../types/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Modalize } from 'react-native-modalize';
import moment from 'moment';
import 'moment/locale/ru'; // Import Russian locale

moment.locale('ru'); // Set moment to Russian

const SectionDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<SectionDetailScreenNavigationProp>();
  const { sectionId } = route.params as { sectionId: number };
  const [section, setSection] = useState<Section | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]); // Schedules filtered by selected date
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Selected date
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // List of subscriptions
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null); // Selected subscription
  const [dates, setDates] = useState<string[]>([]); // List of dates for selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomSheetRef = useRef<Modalize>(null); // Reference for bottom sheet

  // Generate next 7 days for date selection
  const generateDates = () => {
    const newDates = [];
    for (let i = 0; i < 5; i++) {
      const date = moment().add(i, 'days').format('YYYY-MM-DD');
      newDates.push(date);
    }
    setDates(newDates);
    setSelectedDate(newDates[0]); // Default to today's date
  };

  useEffect(() => {
    generateDates();
  }, []);

  // Fetch section details
  const fetchSectionDetails = async () => {
    try {
      const response = await axiosInstance.get(`${endpoints.SECTIONS}${sectionId}/`);
      setSection(response.data);
    } catch (error) {
      setError('Не удалось загрузить информацию о занятии');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedules based on section and selected date
  const fetchSchedules = async (date: string) => {
    try {
      const response = await axiosInstance.get(`${endpoints.SCHEDULES}`, {
        params: { page: 'all', section: sectionId, date: date }
      });
      const sortedSchedules = response.data.sort((a: Schedule, b: Schedule) => a.start_time.localeCompare(b.start_time));
      setSchedules(sortedSchedules);
      setFilteredSchedules(sortedSchedules); // Filter schedules for selected date
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
    }
  };

  // Fetch subscriptions activated by admin after selecting a schedule
  const fetchSubscriptions = async () => {
    try {
      const response = await axiosInstance.get(`${endpoints.SUBSCRIPTIONS}`, {
        params: { page: 'all' }
      });
      const activatedSubscriptions = response.data.filter((sub: Subscription) => sub.is_activated_by_admin);
      setSubscriptions(activatedSubscriptions);
    } catch (error) {
      console.error('Ошибка при загрузке подписок:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      if (!section) return;
      const response = await axiosInstance.get(`${endpoints.CATEGORIES}${section?.category}/`);
      setCategory(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [section]);

  // Handle selecting a date and fetch schedules for that date
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    await fetchSchedules(date);
  };

  // Handle selecting a schedule
  const handleScheduleSelect = (scheduleId: number) => {
    setSelectedSchedule(scheduleId);
    fetchSubscriptions(); // Fetch subscriptions after schedule selection
  };

  // Handle selecting a subscription
  const handleSubscriptionSelect = (subscriptionId: number) => {
    setSelectedSubscription(subscriptionId);
  };

  // Handle reservation
  const handleReserve = async () => {
    if (!selectedSchedule || !selectedSubscription) {
      Alert.alert('Ошибка', 'Выберите расписание и абонемент.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(endpoints.RECORDS, {
        schedule: selectedSchedule,
        subscription: selectedSubscription,
      });
      Alert.alert('Успех', 'Запись успешно забронирована!');
      bottomSheetRef.current?.close(); // Close the bottom sheet after reservation
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Не удалось забронировать запись.';
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSectionDetails();
    if (selectedDate) fetchSchedules(selectedDate); // Fetch schedules based on default selected date
  }, [sectionId, selectedDate]);

  const openBottomSheet = () => bottomSheetRef.current?.open();

  if (loading) {
    return <ActivityIndicator size="large" color="#007aff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Image source={{ uri: section?.image || "" }} style={styles.sectionImage} />
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>{section?.name}</Text>
          <Icon name="group" size={24} color="#007aff" style={styles.icon} />
        </View>

        <View style={styles.sectionInfo}>
          <Icon name="info-outline" size={20} color="#666" />
          <Text style={styles.description}>{section?.description || 'Описание отсутствует'}</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>Категория: {category?.name}</Text>
        </View>

        <Pressable style={styles.button} onPress={openBottomSheet}>
          <Text style={styles.buttonText}>Записаться</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Sheet for selecting schedule */}
      <Modalize
        ref={bottomSheetRef}
        adjustToContentHeight={true} // Dynamic height
        handlePosition="inside"
        modalStyle={styles.modalStyle}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.modalTitle}>Выберите Расписание</Text>

          {/* Square Day Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date}
                style={[styles.dateOption, selectedDate === date && styles.dateOptionSelected]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={styles.dateText}>{moment(date).format('DD')} {moment(date).format('dd').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Schedule List */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleList}>
            {filteredSchedules.map((schedule) => (
              <Pressable
                key={schedule.id}
                style={[
                  styles.scheduleOption,
                  selectedSchedule === schedule.id && styles.scheduleOptionSelected,
                  !schedule.status && styles.scheduleOptionDisabled,
                ]}
                onPress={() => handleScheduleSelect(schedule.id)}
                disabled={!schedule.status}
              >
                <Text style={styles.scheduleText}>
                  {new Date(`1970-01-01T${schedule.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                  {new Date(`1970-01-01T${schedule.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  ({schedule.reserved} из {schedule.capacity})
                </Text>

              </Pressable>
            ))}
          </ScrollView>

          {/* Subscription List */}
          {subscriptions.length > 0 && (
            <>
              <Text style={styles.modalTitle}>Выберите Абонемент</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleList}>
                {subscriptions.map((subscription) => (
                  <Pressable
                    key={subscription.id}
                    style={[
                      styles.scheduleOption,
                      selectedSubscription === subscription.id && styles.scheduleOptionSelected,
                    ]}
                    onPress={() => handleSubscriptionSelect(subscription.id)}
                  >
                    <Text style={styles.scheduleText}>
                      {subscription.name} 
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
            <Text style={styles.reserveButtonText}>Забронировать</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    minHeight: Dimensions.get('window').height,
  },
  sectionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  icon: {
    marginLeft: 10,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  details: {
    marginTop: 20,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007aff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSheetContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dateList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10, // Makes the day selector square
    width: 60, // Square size
    height: 60, // Square size
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  dateOptionSelected: {
    backgroundColor: '#007aff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  scheduleList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scheduleOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  scheduleOptionSelected: {
    backgroundColor: '#007aff',
  },
  scheduleOptionDisabled: {
    backgroundColor: '#d3d3d3',
  },
  scheduleText: {
    fontSize: 14,
    color: '#333',
  },
  reserveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  modalStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  }
});

export default SectionDetailScreen;
