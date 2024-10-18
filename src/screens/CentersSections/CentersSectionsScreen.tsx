import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { axiosInstance, endpoints } from '../../api/apiClient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getRandomAbout } from '@/src/services/randomData';
import { SectionDetailScreenNavigationProp, CenterDetailScreenNavigationProp, UniversalRouteProp } from '@/src/types/types';

const CentersSectionsScreen: React.FC = () => {
  const [centers, setCenters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sections' | 'centers'>('sections');
  const [searchQuery, setSearchQuery] = useState<string>(''); // For search input
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const route = useRoute<UniversalRouteProp<'Занятия и Центры'>>();
  const categoryId = route.params?.category;

  const navigation = useNavigation<SectionDetailScreenNavigationProp & CenterDetailScreenNavigationProp>();

  const fetchCentersAndSections = async () => {
    try {
      const params: any = {
        page: 'all',
        category: categoryId,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const centersResponse = await axiosInstance.get(endpoints.CENTERS, { params });
      const sectionsResponse = await axiosInstance.get(endpoints.SECTIONS, { params });

      setCenters(centersResponse.data);
      setSections(sectionsResponse.data);
      setLoading(false);
    } catch (error) {
      setError('Не удалось загрузить данные');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentersAndSections();
  }, [searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <Icon name="search" size={24} color="#888" />
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск занятий или центров..."
        placeholderTextColor="#333"
        value={searchQuery}
        onChangeText={handleSearchChange}
      />
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'sections') {
      return sections.map((section) => (
        <Pressable
          key={section.id}
          onPress={() => navigation.navigate('Занятие', { sectionId: section.id })}
        >
          <View style={styles.sectionCard}>
            <Image source={{ uri: section.image }} style={styles.sectionCardImage} />
            <View style={styles.sectionDetails}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <Text style={styles.aboutText}>{getRandomAbout()}</Text>
            </View>
          </View>
        </Pressable>
      ));
    }

    return centers.map((center) => (
      <Pressable
        key={center.id}
        onPress={() => navigation.navigate('Центр', { centerId: center.id })}
      >
        <View style={styles.centerCard}>
          <Image source={{ uri: center.image }} style={styles.centerCardImage} />
          <View style={styles.centerCardDetails}>
            <Text style={styles.centerTitle}>{center.name}</Text>
            <Text style={styles.aboutText}>{getRandomAbout()}</Text>
            <View style={styles.centerInfo}>
              <Icon name="location-on" size={16} color="#777" />
              <Text style={styles.centerLocation}>{center.location}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    ));
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={styles.container}>
      {renderSearchBar()}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setActiveTab('sections')}>
          <Text style={[styles.tabText, activeTab === 'sections' && styles.activeTabText]}>
            Занятия ({sections.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('centers')}>
          <Text style={[styles.tabText, activeTab === 'centers' && styles.activeTabText]}>
            Центры ({centers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>{renderTabContent()}</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 5,
    marginTop: 20,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  tabs: {
    marginTop: 5,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  tabText: {
    fontSize: 18,
    color: '#888',
  },
  activeTabText: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCardImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    resizeMode: 'cover',
  },
  sectionDetails: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    color: '#333',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  centerCardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  centerCardDetails: {
    padding: 15,
  },
  centerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  centerLocation: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
});

export default CentersSectionsScreen;
