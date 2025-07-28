// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/loginScreen';
import HomeScreen from './screens/homeScreen';
import RegistrarEntradaScreen from './screens/registrarEntradaScreen';
import RegistrarSalidaScreen from './screens/registrarSalidaScreen';
import HistorialScreen from './screens/historialScreen';
import HorasExtraScreen from './screens/horasExtraScreen';


const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="Registrar Entrada" component={RegistrarEntradaScreen} />
        <Stack.Screen name="Registrar Salida" component={RegistrarSalidaScreen} />
        <Stack.Screen name="Horas Extra" component={HorasExtraScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
