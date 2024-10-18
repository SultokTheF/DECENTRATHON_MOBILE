import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

const App = () => {
  return (
    <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
    </AuthProvider>
  );
};

export default App;

// Ensure that the app is registered correctly with AppRegistry
registerRootComponent(App);
