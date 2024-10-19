// SectionDetailScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Dimensions, 
  Modal, 
  FlatList 
} from 'react-native';
import { axiosInstance, endpoints } from '../../api/apiClient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SectionDetailScreenNavigationProp } from '@/src/types/types';
import { Section, Category, Schedule, Subscription, Syllabus, TestQuestion, TestResult } from '../../types/types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Modalize } from 'react-native-modalize';
import moment from 'moment';
import 'moment/locale/ru'; // Import Russian locale

moment.locale('ru'); // Set moment to Russian

const SectionDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<SectionDetailScreenNavigationProp>();
  const { sectionId } = route.params as { sectionId: number };
  
  // State variables
  const [section, setSection] = useState<Section | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Syllabus related state
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [isSyllabusModalVisible, setIsSyllabusModalVisible] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  
  // Test related state
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  
  // References
  const bottomSheetRef = useRef<Modalize>(null);
  
  // Generate next 5 days for date selection
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
    fetchSectionDetails();
    fetchSyllabuses();
  }, [sectionId]);
  
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
  
  // Fetch syllabuses for the section
  const fetchSyllabuses = async () => {
    try {
      const response = await axiosInstance.get(`${endpoints.GET_SYLLABUSES}${sectionId}/`);
      setSyllabuses(response.data.syllabuses);
    } catch (error) {
      console.error('Ошибка при загрузке силлабусов:', error);
    }
  };
  
  // Handle syllabus selection and show the "Начать тестирование" modal
  const handleSyllabusSelect = (syllabus: Syllabus) => {
    setSelectedSyllabus(syllabus);
    setIsSyllabusModalVisible(true);
  };
  
  // Start test and fetch questions
  const startTest = async () => {
    if (!selectedSyllabus) return;
    
    try {
      const response = await axiosInstance.get(`${endpoints.GET_TEST_BY_ID}${selectedSyllabus.test_id}/`);
      setTestQuestions(response.data.syllabus.questions);
      setIsSyllabusModalVisible(false);
      setIsTestModalVisible(true);
    } catch (error) {
      console.error('Ошибка при загрузке теста:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить тест. Попробуйте позже.');
    }
  };
  
  // Handle answer selection for a question
  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answerIndex,
    });
  };
  
  // Submit the test
  const submitTest = async () => {
    if (!selectedSyllabus) return;
    
    // Prepare answers array
    const answers = Object.keys(userAnswers).map((questionIdStr) => {
      const questionId = parseInt(questionIdStr, 10);
      return {
        question_id: questionId,
        chosen_answer: userAnswers[questionId],
      };
    });
    
    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post(`${endpoints.SUBMIT_TEST}`, {
        test_id: selectedSyllabus.test_id,
        answers,
      });
      setTestResults(response.data.results);
      setIsTestModalVisible(false);
      setIsResultVisible(true);
      
      // Calculate total correct answers
      const correctCount = response.data.results.filter((result: TestResult) => result.is_correct).length;
      setTotalCorrect(correctCount);
      
      // Optionally, navigate to another screen or refresh data
    } catch (error: any) {
      console.error('Ошибка при отправке теста:', error);
      const errorMessage = error.response?.data?.error || 'Не удалось отправить тест. Попробуйте позже.';
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Close the result modal
  const closeResultModal = () => {
    setIsResultVisible(false);
    setTestResults([]);
    setUserAnswers({});
    setTotalCorrect(0);
  };
  
  // Fetch schedules based on section and selected date
  const fetchSchedules = async (date: string) => {
    try {
      const response = await axiosInstance.get(`${endpoints.SCHEDULES}`, {
        params: { 
          page: 'all', 
          section: sectionId, 
          date: date 
        }
      });
      const sortedSchedules = response.data.sort((a: Schedule, b: Schedule) => a.start_time.localeCompare(b.start_time));
      setSchedules(sortedSchedules);
      setFilteredSchedules(sortedSchedules);
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
  
  // Fetch category details
  const fetchCategory = async () => {
    if (!section) return;
    try {
      const response = await axiosInstance.get(`${endpoints.CATEGORIES}${section.category}/`);
      setCategory(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
    }
  };
  
  useEffect(() => {
    fetchCategory();
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
      await axiosInstance.post(`${endpoints.RECORDS}`, {
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
  
  // Open bottom sheet
  const openBottomSheet = () => bottomSheetRef.current?.open();
  
  if (loading) {
    return <ActivityIndicator size="large" color="#007aff" style={styles.loader} />;
  }
  
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Section Image */}
        <Image source={{ uri: section?.image || "" }} style={styles.sectionImage} />
        
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>{section?.name}</Text>
          <Icon name="group" size={24} color="#007aff" style={styles.icon} />
        </View>
        
        {/* Section Info */}
        <View style={styles.sectionInfo}>
          <Icon name="info-outline" size={20} color="#666" />
          <Text style={styles.description}>{section?.description || 'Описание отсутствует'}</Text>
        </View>
        
        {/* Category Details */}
        <View style={styles.details}>
          <Text style={styles.detailText}>Категория: {category?.name}</Text>
        </View>
        
        {/* Syllabus Cards */}
        <Text style={styles.syllabusesTitle}>Тесты по прошедшим урокам</Text>
        {syllabuses.length > 0 ? (
          syllabuses.map((syllabus) => (
            <TouchableOpacity
              key={syllabus.test_id}
              style={styles.syllabusCard}
              onPress={() => handleSyllabusSelect(syllabus)}
            >
              <Text style={styles.syllabusTitle}>{syllabus.title}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noSyllabusesText}>Нет силлабусов для этого раздела.</Text>
        )}
        
        {/* Reservation Button */}
        <Pressable style={styles.button} onPress={openBottomSheet}>
          <Text style={styles.buttonText}>Записаться</Text>
        </Pressable>
      </ScrollView>
      
      {/* Modal for starting the test */}
      <Modal
        transparent={true}
        visible={isSyllabusModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSyllabusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Начать тестирование по "{selectedSyllabus?.title}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={startTest}>
                <Text style={styles.modalButtonText}>Начать тест</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsSyllabusModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Test Modal */}
      <Modal
        transparent={true}
        visible={isTestModalVisible}
        animationType="slide"
        onRequestClose={() => setIsTestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.testModalContent}>
            <Text style={styles.testModalTitle}>Тестирование</Text>
            <ScrollView style={styles.testScrollView}>
              {testQuestions.map((question, index) => (
                <View key={question.question_id} style={styles.questionContainer}>
                  <Text style={styles.questionText}>{index + 1}. {question.question}</Text>
                  {question.options.map((option, optionIndex) => (
                    <TouchableOpacity
                      key={optionIndex}
                      style={[
                        styles.optionButton,
                        userAnswers[question.question_id] === optionIndex && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleAnswerSelect(question.question_id, optionIndex)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={submitTest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Отправить тест</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Result Modal */}
      <Modal
        transparent={true}
        visible={isResultVisible}
        animationType="slide"
        onRequestClose={closeResultModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContent}>
            <Text style={styles.resultModalTitle}>Результаты теста</Text>
            
            {/* Overall Score */}
            <Text style={styles.overallScoreText}>Вы набрали {totalCorrect} из {testQuestions.length}</Text>
            
            {/* Per-Question Feedback */}
            <FlatList
              data={testResults}
              keyExtractor={(item, index) => `${item.question}-${index}`}
              renderItem={({ item }) => {
                // Find the corresponding question to get the correct answer text
                const question = testQuestions.find(q => q.question_id === item.question_id);
                const correctAnswerText = question?.options[item.correct_answer] || 'Неизвестно';
                const userAnswerText = item.chosen_answer !== null 
                  ? question?.options[item.chosen_answer] 
                  : 'Нет ответа';
                
                return (
                  <View style={styles.resultItem}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Text style={item.is_correct ? styles.correctIndicator : styles.wrongIndicator}>
                      {item.is_correct ? 'Правильно' : 'Неправильно'}
                    </Text>
                  </View>
                );
              }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={closeResultModal}>
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Bottom Sheet for selecting schedule */}
      <Modalize 
        ref={bottomSheetRef} 
        adjustToContentHeight={true} 
        handlePosition="inside" 
        modalStyle={styles.modalStyle}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.modalTitle}>Выберите Расписание</Text>
          
          {/* Date Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date}
                style={[styles.dateOption, selectedDate === date && styles.dateOptionSelected]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[styles.dateText, selectedDate === date && styles.dateTextSelected]}>
                  {moment(date).format('DD')} {moment(date).format('dd').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Schedule List */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleList}>
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((schedule) => (
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
                  <Text style={[styles.scheduleText, !schedule.status && styles.scheduleTextDisabled]}>
                    {moment(schedule.start_time, 'HH:mm').format('HH:mm')} - {moment(schedule.end_time, 'HH:mm').format('HH:mm')} ({schedule.reserved} из {schedule.capacity})
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noSchedulesText}>Нет доступных расписаний на выбранную дату.</Text>
            )}
          </ScrollView>
          
          {/* Subscription List */}
          {subscriptions.length > 0 && (
            <>
              <Text style={styles.modalTitle}>Выберите Абонемент</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subscriptionList}>
                {subscriptions.map((subscription) => (
                  <Pressable
                    key={subscription.id}
                    style={[
                      styles.subscriptionOption,
                      selectedSubscription === subscription.id && styles.subscriptionOptionSelected,
                    ]}
                    onPress={() => handleSubscriptionSelect(subscription.id)}
                  >
                    <Text style={styles.subscriptionText}>{subscription.name} ({subscription.type})</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          
          {/* Reserve Button */}
          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.reserveButtonText}>Забронировать</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modalize>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: 'cover',
    backgroundColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    color: '#1f2937',
  },
  icon: {
    marginLeft: 10,
  },
  sectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 10,
    flexShrink: 1,
  },
  details: {
    marginTop: 10,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  syllabusesHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1f2937',
  },
  syllabusesTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 15,
    color: '#1f2937',
  },
  syllabusCard: {
    backgroundColor: '#e5e7eb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  syllabusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noSyllabusesText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  testModalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  testModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1f2937',
  },
  testScrollView: {
    flexGrow: 1,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1f2937',
  },
  optionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultModalContent: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1f2937',
  },
  overallScoreText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1f2937',
  },
  resultItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  userAnswerText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 5,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 5,
  },
  correctIndicator: {
    color: '#10b981',
    fontWeight: '600',
    marginTop: 5,
  },
  wrongIndicator: {
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    backgroundColor: '#ffffff',
  },
  bottomSheetContent: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1f2937',
  },
  dateList: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  dateOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  dateText: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
  dateTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scheduleList: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  scheduleOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  scheduleOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  scheduleOptionDisabled: {
    backgroundColor: '#d1d5db',
  },
  scheduleText: {
    fontSize: 14,
    color: '#1f2937',
  },
  scheduleTextDisabled: {
    color: '#9ca3af',
  },
  noSchedulesText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 10,
  },
  subscriptionList: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  subscriptionOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  subscriptionOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  subscriptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  reserveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SectionDetailScreen;
