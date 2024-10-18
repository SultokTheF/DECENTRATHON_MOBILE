import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Linking,
  Modal,
  Dimensions,
  Image
} from 'react-native';
import { axiosInstance, endpoints } from '../../api/apiClient';
import { AuthContext } from '../../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { Modalize } from 'react-native-modalize';
import { Calendar, LocaleConfig } from 'react-native-calendars';

interface RecordType {
  id: number;
  user: number;
  schedule: {
    id: number;
    section: number;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    reserved: number;
    status: boolean;
    meeting_link: string | null; // Add this field
  };
  attended: boolean;
  subscription: {
    id: number;
    name: string;
    user: number;
    type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_activated_by_admin: boolean;
  };
  is_canceled: boolean;
  sectionName?: string;
  centerName?: string;
}



const MySubscriptionsScreen: React.FC = () => {
  LocaleConfig.locales['ru'] = {
    monthNames: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    monthNamesShort: [
      'Янв',
      'Фев',
      'Мар',
      'Апр',
      'Май',
      'Июн',
      'Июл',
      'Авг',
      'Сен',
      'Окт',
      'Ноя',
      'Дек',
    ],
    dayNames: [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ],
    dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    today: 'Сегодня',
  };

  LocaleConfig.defaultLocale = 'ru'; // Set the default locale to Russian

  const authContext = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState('MONTH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState<string>('');
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>([]); // Store subscription records
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedDateRecords, setSelectedDateRecords] = useState<any[]>([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellingRecordId, setCancellingRecordId] = useState<number | null>(null);

  const bottomSheetRef = useRef<Modalize>(null);
  const calendarRef = useRef<Modalize>(null);

  const user = authContext?.user;

  const fetchSection = async (sectionId: number) => {
    try {
      const response = await axiosInstance.get(`${endpoints.SECTIONS}${sectionId}/`);
      const responseCenter = await axiosInstance.get(
        `${endpoints.CENTERS}${response.data.center}/`
      );
      return [response.data.name, responseCenter.data.name];
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить секции');
      return null;
    }
  };

  const fetchSubscriptions = async () => {
    if (user) {
      try {
        const response = await axiosInstance.get(
          `${endpoints.SUBSCRIPTIONS}?page=all&user_id=${user.id}`
        );
        setSubscriptions(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке подписок:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const handleSubmit = async () => {
    if (!subscriptionType) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите тип подписки.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosInstance.post(endpoints.SUBSCRIPTIONS, {
        type: subscriptionType,
      });

      Alert.alert('Успех', 'Подписка успешно создана!');
      bottomSheetRef.current?.close();
      setIsSubmitting(false);
      fetchSubscriptions();

      // WhatsApp redirection with the specific phone number
      const message = `Здравствуйте! Меня зовут ${user?.first_name} ${user?.last_name}. Я бы хотел купить подписку на ${subscriptionType === 'MONTH'
        ? 'месяц'
        : subscriptionType === '6_MONTHS'
          ? '6 месяцев'
          : 'год'
        }.`;
      const phoneNumber = '77769955161'; // International format without symbols
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Ошибка', 'Не удалось открыть WhatsApp.');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать подписку.');
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (id: string) => {
    try {
      await axiosInstance.put(`${endpoints.SUBSCRIPTIONS}${id}/`, {
        name: newSubName,
      });
      Alert.alert('Успех', 'Подписка обновлена!');
      setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить подписку.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`${endpoints.SUBSCRIPTIONS}${id}/`);
      Alert.alert('Успех', 'Подписка удалена!');
      fetchSubscriptions();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить подписку.');
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.open();
  };

  const openCalendar = (subscriptionId: number) => {
    setSelectedSubscription(subscriptionId);
    fetchRecords(subscriptionId);
    calendarRef.current?.open();
  };

  const fetchRecords = async (subscriptionId: number) => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get(`${endpoints.RECORDS}`, {
        params: { page: 'all', subscription: subscriptionId },
      });
      setRecords(response.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить записи подписки.');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleCancelReservation = async (recordId: number) => {
    setIsCancelling(true);
    setCancellingRecordId(recordId);
    try {
      await axiosInstance.post(endpoints.CANCEL_RESERVATION, {
        record_id: recordId,
      });

      Alert.alert('Успех', 'Резервирование успешно отменено.');
      // Update the records
      fetchRecords(selectedSubscription!);
      // Update the records for the selected date
      const updatedDateRecords = selectedDateRecords.map((record) =>
        record.id === recordId ? { ...record, is_canceled: true } : record
      );
      setSelectedDateRecords(updatedDateRecords);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отменить резервирование.');
    } finally {
      setIsCancelling(false);
      setCancellingRecordId(null);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const renderCalendar = () => {
    const markedDates = records.reduce((acc, record) => {
      const date = record.schedule.date;
      if (record.is_canceled) {
        acc[date] = { marked: true, dotColor: '#FF6347' }; // Red dot for canceled
      } else {
        acc[date] = { marked: true, dotColor: '#007aff' }; // Blue dot for active
      }
      return acc;
    }, {});

    return (
      <Calendar
        current={new Date().toISOString().split('T')[0]}
        markedDates={markedDates}
        onDayPress={async (day: { dateString: string }) => {
          try {
            setLoadingRecords(true);
            const response = await axiosInstance.get(`${endpoints.RECORDS}`, {
              params: {
                page: 'all',
                schedule__date: day.dateString,
                subscription: selectedSubscription,
              },
            });
            const dateRecords = response.data;

            if (dateRecords.length > 0) {
              // Sort the records by start time
              dateRecords.sort((a: RecordType, b: RecordType) => {
                const timeA = Date.parse(`1970-01-01T${a.schedule.start_time}`);
                const timeB = Date.parse(`1970-01-01T${b.schedule.start_time}`);
                return timeA - timeB;
              });

              // Map over the records to get section and center names
              const recordsWithDetails = await Promise.all(
                dateRecords.map(async (record: any) => {
                  const sectionData = await fetchSection(record.schedule.section);
                  const sectionName = sectionData ? sectionData[0] : 'Неизвестное занятие';
                  const centerName = sectionData ? sectionData[1] : 'Неизвестный центр';
                  return {
                    ...record,
                    sectionName,
                    centerName,
                  };
                })
              );

              setSelectedDateRecords(recordsWithDetails);
              setShowRecordModal(true);
            } else {
              Alert.alert('Записей нет', 'На выбранную дату нет записей для этой подписки.');
            }
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось загрузить записи на выбранную дату.');
          } finally {
            setLoadingRecords(false);
          }
        }}
        theme={{
          textDayFontFamily: 'Arial',
          textMonthFontFamily: 'Arial',
          textDayHeaderFontFamily: 'Arial',
          textMonthFontWeight: 'bold',
          todayTextColor: '#007aff',
          selectedDayBackgroundColor: '#007aff',
          dayTextColor: '#333',
          monthTextColor: '#007aff',
          arrowColor: '#007aff',
        }}
      />
    );
  };

  const activeSubscriptions = subscriptions.filter((sub) => sub.is_activated_by_admin);
  const activatedByAdmin = subscriptions.filter((sub) => !sub.is_activated_by_admin);
  const inactiveSubscriptions = subscriptions.filter((sub) => !sub.is_active);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {activeSubscriptions.length > 0 ? (
          <Animatable.View animation="fadeInUp" duration={1000}>
            <Text style={styles.activeTitle}>🎉 У вас есть активные подписки!</Text>
            {activeSubscriptions.map((sub) => (
              <Animatable.View
                key={sub.id}
                animation="fadeInUp"
                duration={800}
                style={styles.subscriptionCard}
              >
                <View style={styles.iconContainer}>
                  <Icon name="check-circle" size={50} color="#4CAF50" />
                </View>
                <View style={styles.subscriptionInfo}>
                  {editingSub === sub.id ? (
                    <TextInput
                      style={styles.subscriptionInput}
                      value={newSubName}
                      onChangeText={setNewSubName}
                      placeholder="Введите новое название"
                      placeholderTextColor="#888"
                    />
                  ) : (
                    <Text style={styles.subscriptionTitle}>
                      {sub.name} -{' '}
                      {sub.type === 'MONTH' && 'Месяц'}
                      {sub.type === 'YEAR' && 'Год'}
                      {sub.type === '6_MONTHS' && 'Полгода'}
                    </Text>
                  )}
                  <Text style={styles.subscriptionDate}>
                    Действует с {new Date(sub.start_date).toLocaleDateString()} по{' '}
                    {new Date(sub.end_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.subscriptionStatus}>💪 Статус: Активная</Text>
                </View>

                {editingSub === sub.id ? (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleEditSubmit(sub.id)}
                  >
                    <Icon name="content-save" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingSub(sub.id);
                      setNewSubName(sub.name);
                    }}
                  >
                    <Icon name="pencil" size={24} color="#007aff" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => openCalendar(sub.id)}
                >
                  <Icon name="history" size={24} color="#007aff" />
                </TouchableOpacity>
              </Animatable.View>
            ))}

            <TouchableOpacity style={styles.buyMoreButton} onPress={openBottomSheet}>
              <Icon name="plus-circle" size={24} color="#fff" />
              <Text style={styles.buyMoreText}>Купить ещё абонемент</Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : (
          <View>
            <Text style={styles.noActiveText}>😔 У вас нет активных подписок</Text>
            <TouchableOpacity style={styles.buyMoreButton} onPress={openBottomSheet}>
              <Icon name="plus-circle" size={24} color="#fff" />
              <Text style={styles.buyMoreText}>Купить абонемент</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Promotional Banners */}
        <View style={styles.bannersContainer}>
          <Animatable.View animation="slideInRight" duration={800} style={styles.banner}>
            <Image
              source={require('../../assets/images/Frame 1.png')} // Monthly subscription image
              style={styles.bannerImage}
              resizeMode="contain"
              accessibilityLabel="Абонемент на месяц"
            />
            <Text style={styles.bannerText}>Абонемент на месяц - 20 000 ₸</Text>
          </Animatable.View>

          <Animatable.View animation="slideInLeft" duration={800} style={styles.banner}>
            <Image
              source={require('../../assets/images/Frame 2.png')} // 6 Months subscription image
              style={styles.bannerImage}
              resizeMode="contain"
              accessibilityLabel="Абонемент на 6 месяцев"
            />
            <Text style={styles.bannerText}>Абонемент на 6 месяцев - 100 000 ₸</Text>
          </Animatable.View>

          <Animatable.View animation="slideInRight" duration={800} style={styles.banner}>
            <Image
              source={require('../../assets/images/Frame 3.png')} // Yearly subscription image
              style={styles.bannerImage}
              resizeMode="contain"
              accessibilityLabel="Абонемент на год"
            />
            <Text style={styles.bannerText}>Абонемент на год - 180 000 ₸</Text>
          </Animatable.View>
        </View>

      </ScrollView>

      {/* Bottom Sheet for Subscription Purchase */}
      <Modalize ref={bottomSheetRef} adjustToContentHeight modalStyle={styles.modalStyle}>
        <View style={styles.bottomSheetContainer}>
          <Text style={styles.modalTitle}>Оформить подписку</Text>

          <Text style={styles.modalLabel}>Выберите тип подписки:</Text>
          <View style={styles.subscriptionTypeContainer}>
            <TouchableOpacity
              style={[
                styles.subscriptionTypeOption,
                subscriptionType === 'MONTH' && styles.subscriptionTypeSelected,
              ]}
              onPress={() => setSubscriptionType('MONTH')}
            >
              <Text
                style={[
                  styles.subscriptionTypeText,
                  subscriptionType === 'MONTH' && styles.subscriptionTypeTextSelected,
                ]}
              >
                Месяц
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.subscriptionTypeOption,
                subscriptionType === '6_MONTHS' && styles.subscriptionTypeSelected,
              ]}
              onPress={() => setSubscriptionType('6_MONTHS')}
            >
              <Text
                style={[
                  styles.subscriptionTypeText,
                  subscriptionType === '6_MONTHS' && styles.subscriptionTypeTextSelected,
                ]}
              >
                6 Месяцев
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.subscriptionTypeOption,
                subscriptionType === 'YEAR' && styles.subscriptionTypeSelected,
              ]}
              onPress={() => setSubscriptionType('YEAR')}
            >
              <Text
                style={[
                  styles.subscriptionTypeText,
                  subscriptionType === 'YEAR' && styles.subscriptionTypeTextSelected,
                ]}
              >
                Год
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Оформить подписку</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Modal for Subscription History */}
      <Modalize ref={calendarRef} adjustToContentHeight modalStyle={styles.modalStyle}>
        <View style={styles.calendarContainer}>
          <Text style={styles.modalTitle}>История подписки</Text>
          {loadingRecords ? (
            <ActivityIndicator size="large" color="#007aff" />
          ) : (
            renderCalendar()
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => calendarRef.current?.close()}>
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Modal for Record Details */}
      <Modal
        visible={showRecordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={500} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Детали записи</Text>
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {selectedDateRecords.map((record) => (
                <View key={record.id} style={styles.recordItem}>
                  <Text style={styles.recordTitle}>
                    {record.sectionName || 'Неизвестное занятие'}
                  </Text>
                  <Text style={styles.modalText}>
                    <Icon name="home-map-marker" size={20} /> {record.centerName || 'Неизвестный центр'}
                  </Text>
                  <Text style={styles.modalText}>
                    <Icon name="clock-outline" size={20} /> Время:{' '}
                    {formatTime(record.schedule.start_time)} -{' '}
                    {formatTime(record.schedule.end_time)}
                  </Text>
                  <Text style={styles.modalText}>
                    <Icon name="check-circle-outline" size={20} /> Посетил:{' '}
                    {record.attended ? 'Да' : 'Нет'}
                  </Text>

                  {/* Урок column */}
                  <Text style={styles.lessonText}>
                    Урок:{' '}
                    {!record.schedule.meeting_link ? (
                      <Text style={styles.notStartedText}>не начался</Text>
                    ) : (
                      <Text
                        onPress={() => Linking.openURL(record.schedule.meeting_link)}
                        style={styles.meetingLinkText}
                      >
                        Перейти на собрание
                      </Text>
                    )}
                  </Text>

                  {!record.is_canceled && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelReservation(record.id)}
                    >
                      {isCancelling && cancellingRecordId === record.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.cancelButtonText}>Отменить запись</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {record.is_canceled && (
                    <Text style={styles.canceledText}>Эта запись уже отменена.</Text>
                  )}

                  <View style={styles.separator} />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRecordModal(false)}
            >
              <Icon name="close-circle" size={30} color="#FF6347" />
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#007aff',
    marginTop: 10,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionInfo: {
    marginLeft: 15,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subscriptionInput: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: '#007aff',
    color: '#333',
  },
  subscriptionDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 5,
  },
  activeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  deleteButton: {
    marginLeft: 10,
  },
  saveButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 6,
  },
  submitButton: {
    backgroundColor: '#007aff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    marginLeft: 10,
  },
  historyButton: {
    marginLeft: 10,
  },
  buyMoreButton: {
    backgroundColor: '#007aff',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buyMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noActiveText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
    textAlign: 'center',
    marginTop: 50,
  },
  bannersContainer: {
    marginTop: 30,
    marginBottom: 30,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bannerImage: { // ← Add this style
    width: '100%', // Makes the image take full width of the banner
    height: 150,    // Adjust the height as needed
    marginBottom: 10, // Space between image and text
    borderRadius: 10,  // Optional: Rounded corners
  },
  bannerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lessonText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  meetingLinkText: {
    fontSize: 16,
    color: '#007aff', // Blue color for the link
    textDecorationLine: 'underline', // Underlined text to resemble a link
  },
  notStartedText: {
    fontSize: 16,
    color: '#FF6347', // Red color for "не начался"
  },
  meetingButton: {
    marginTop: 5,
    backgroundColor: '#007aff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  meetingButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomSheetContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  subscriptionTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subscriptionTypeOption: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  subscriptionTypeSelected: {
    backgroundColor: '#007aff',
  },
  subscriptionTypeText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  subscriptionTypeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  },
  calendarContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
    maxHeight: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'left',
    color: '#555',
  },
  recordItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  canceledText: {
    fontSize: 16,
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptySquare: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
});

export default MySubscriptionsScreen;
