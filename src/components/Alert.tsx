import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlertProps {
  type: 'success' | 'danger' | 'warning';
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'danger':
        return styles.danger;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  return (
    <View style={[styles.container, getAlertStyle()]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
  },
  message: {
    color: '#fff',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#4caf50',
  },
  danger: {
    backgroundColor: '#f44336',
  },
  warning: {
    backgroundColor: '#ff9800',
  },
  info: {
    backgroundColor: '#2196f3',
  },
});

export default Alert;
