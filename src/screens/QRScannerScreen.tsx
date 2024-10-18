import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { axiosInstance, endpoints } from '../api/apiClient';
import { Record, Center, Section, Schedule } from '../types/types'; // Assuming these types are defined

const QRScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [centerId, setCenterId] = useState<number | null>(null); // Store center_id
  const [records, setRecords] = useState<Record[]>([]);
  const [centers, setCenters] = useState<Center[]>([]); // Store centers
  const [section, setSection] = useState<Section | null>(null); 
  const [loading, setLoading] = useState(false);
  const [userId] = useState(1); // Assuming userId is available from context or props

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const fetchSection = async ( section_id: number ) => {
    try {
      const response = await axiosInstance.get(`${endpoints.SECTIONS}${section_id}/`);
      setSection(response.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить секции');
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const correctedData = data.replace(/'/g, '"').replace(/\\/g, ''); // Correct the format
      const parsedData = JSON.parse(correctedData);
      const { section_id } = parsedData; // Use section_id from QR code
      setCenterId(section_id);
      fetchRecords(section_id); // Fetch records for the selected section
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось распознать QR-код');
    }
  };

  const fetchRecords = async (sectionId: number) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${endpoints.RECORDS}`, {
        params: { page: 'all', attended: false, 'schedule__section': sectionId },
      });
      fetchSection(sectionId);
      setRecords(response.data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (recordId: number) => {
    try {
      await axiosInstance.post(endpoints.CONFIRM_ATTENDANCE, {
        record_id: recordId, // Only send the record_id
      });
      Alert.alert('Успех', 'Посещение успешно подтверждено!');
      setScanned(false); // Reset for scanning another QR code
      setRecords([]); // Clear the records list after confirmation
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось подтвердить посещение');
    }
  };

  if (hasPermission === null) {
    return <Text>Запрашиваем разрешение на доступ к камере</Text>;
  }

  if (hasPermission === false) {
    return <Text>Нет доступа к камере</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.recordsContainer}>
          <Text style={styles.title}>Записи на подтверждение</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007aff" />
          ) : (
            <ScrollView>
              {records.length === 0 ? (
                <Text style={styles.noRecordsText}>Нет записей для подтверждения</Text>
              ) : (
                records.map((record) => (
                  <Pressable
                    key={record.id}
                    style={styles.recordCard}
                    onPress={() => handleConfirmAttendance(record.id)}
                  >
                    <Text style={styles.recordText}>
                      Занятие: {section?.name}
                    </Text>
                    <Text style={styles.recordText}>
                      Время: {record.schedule.start_time} - {record.schedule.end_time}
                    </Text>
                    <Text style={styles.recordText}>
                      Подписка: {record.subscription.name} ({record.subscription.type})
                    </Text>
                    <Text style={styles.recordText}>
                      Действует до: {new Date(record.subscription.end_date).toLocaleDateString()}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
          <Button title={'Сканировать заново'} onPress={() => setScanned(false)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 50,
    width: '90%',
    maxHeight: '60%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  noRecordsText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3, // Add shadow effect for better visual
  },
  recordText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 2, // Slight vertical spacing between texts
  },
});

export default QRScannerScreen;
