import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { estaConectado } from '../utils/network';
import { obtenerAsistenciasOffline, limpiarAsistenciasOffline } from '../utils/offlineStorage';
import { StatusBar } from 'expo-status-bar';
import { URL_BACKEND } from '../env';

//const URL_BACKEND = 'http://192.168.1.56:3000/api'; 
//const URL_BACKEND = '';

const HomeScreen = () => {
  const [userRol, setUserRol] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const init = async () => {
      const rol = await AsyncStorage.getItem('userRol');
      setUserRol(rol);
      await sincronizarAsistencias();
    };
    init();
  }, []);

  const sincronizarAsistencias = async () => {
    const conectado = await estaConectado();
    if (!conectado) return;

    const asistencias = await obtenerAsistenciasOffline();
    console.log('Asistencias', asistencias);
    if (asistencias.length === 0) return;

    let successCount = 0;

    for (const asistencia of asistencias) {
      try {
        await axios.post(`${URL_BACKEND}/asistencia`, asistencia);
        successCount++;
      } catch (e) {
        console.warn('Error sincronizando una asistencia:', e);
      }
    }

    await limpiarAsistenciasOffline();
    Alert.alert('Sincronización', `${successCount} asistencias sincronizadas correctamente.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tareas</Text>
      <StatusBar style="dark" />

      {userRol === '1' && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Historial')}>
          <Text style={styles.buttonText}>Historial</Text>
        </TouchableOpacity>
      )}

      {userRol === '2' && (
        <>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Registrar Entrada')}>
            <Text style={styles.buttonText}>Registrar Entrada</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Registrar Salida')}>
            <Text style={styles.buttonText}>Registrar Salida</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Horas Extra')}>
            <Text style={styles.buttonText}>Horas Extra</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
