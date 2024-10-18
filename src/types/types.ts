// types.ts

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Button Props
export type ButtonProps = {
  title: string;
  onPress: () => void;
};

// Define all routes and their params in your app
export type RootStackParamList = {
  Главная: undefined;
  Профиль: undefined;
  Расписание: undefined;
  Поиск: undefined;
  "Карта": { centerId: number };
  "Занятия и Центры": { category: number } | undefined;
  "Центр": { centerId: number };
  "Занятие": { sectionId: number };
  "Регистрация": undefined;
  "Вход": undefined;
  "Мои абонементы": undefined;  // New route
  "Управление абонементом": { subscriptionId: number };
};

// Universal navigation prop for all screens
export type UniversalNavigationProp = StackNavigationProp<RootStackParamList>;

// Universal route prop for all screens
export type UniversalRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;

// Specific Navigation and Route Props
export type SectionDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Занятие'>;
export type SectionDetailScreenRouteProp = RouteProp<RootStackParamList, 'Занятие'>;

export type CenterDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Центр'>;
export type CenterDetailScreenRouteProp = RouteProp<RootStackParamList, 'Центр'>;

export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Регистрация'>;
export type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Регистрация'>;

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Вход'>;
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Вход'>;

export type MySubscriptionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Мои абонементы'>;
export type MySubscriptionsScreenRouteProp = RouteProp<RootStackParamList, 'Мои абонементы'>;

// Interfaces for Center, Section, Category, User based on Django models

export interface Center {
  id: number;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  qr_code: string | null; // URL for the QR code
  image: string | null; // URL for the image
  description: string | null;
}

export interface Section {
  id: number;
  name: string;
  category: Category | number;
  image: string | null; // URL for the image
  description: string | null;
  centers: Center[]; // Many-to-Many relationship with centers
  users: User[]; // Many-to-Many relationship with users
}

export interface Category {
  id: number;
  name: string;
  image: string | null; // URL for the image
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  iin?: string;
  role: 'USER' | 'ADMIN' | 'CHILD' | 'PARENT' | 'STAFF';
  is_active: boolean;
  is_staff: boolean;
  is_verified: boolean;
  date_joined: string;
  parent?: User | null; // Recursive relationship for parent users
}

export interface Subscription {
  id: number;
  name: string;
  user: User;
  section: Section;
  type: 'MONTH' | '6_MONTHS' | 'YEAR';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_activated_by_admin: boolean;
}

export interface Schedule {
  id: number;
  section: Section | number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  reserved: number;
  status: boolean;
}

export interface Record {
  subscription: Subscription;
  id: number;
  user: User;
  schedule: Schedule;
  attended: boolean;
  section: Section;
}

export interface Feedback {
  id: number;
  user: User;
  text: string;
  stars: 1 | 2 | 3 | 4 | 5;
  center: Center;
  created_at: string;
}

// New Interfaces for Syllabus and Testing

export interface Syllabus {
  test_id: any;
  id: number; // Corresponds to test_id
  title: string;
  content: string;
  section: string; // Section name
  questions: TestQuestion[];
}

export interface TestQuestion {
  question_id: number;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface TestResult {
  question: string;
  chosen_answer: string;
  correct_answer: string;
  is_correct: boolean;
  points: number;
}

// Optional: If you have a separate type for tests, you can define it as well
export interface Test {
  test_id: number;
  title: string;
  content: string;
  section: string;
  questions: TestQuestion[];
}
