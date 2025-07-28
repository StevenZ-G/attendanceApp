// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../data/api'; 
import { estaConectado } from '../utils/network';
import { guardarUsuarioOffline, obtenerUsuarioOffline } from '../utils/storage';
import { StatusBar } from 'expo-status-bar';

const LoginScreen = ({ navigation }) => {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = async () => {
    try {
      const online = await estaConectado();
      console.log('Estado de conexión en login:', online);

      if (online) {
        // LOGIN ONLINE
        const data = await login(cedula, contrasena);
        const token = data.token;
        const usuario = data.usuario;
        console.log('Datos de usuario:', usuario);

        // Guardar para acceso offline
        await guardarUsuarioOffline(usuario, contrasena);
        console.log('Usuario guardado offline:', {
          cedula: usuario.cedula,
          contrasena: contrasena
        });

        // 🔐 Guardar sesión online
        await AsyncStorage.setItem('jwtToken', token);
        await AsyncStorage.setItem('userId', usuario.id_usuario.toString());
        await AsyncStorage.setItem('userNombres', usuario.nombres);
        await AsyncStorage.setItem('userApellidos', usuario.apellidos);
        await AsyncStorage.setItem('userRol', usuario.id_rol.toString());
        await AsyncStorage.setItem('userCedula', usuario.cedula.toString());

        Alert.alert('Login exitoso (online)');
        navigation.navigate('Home');
      } else {
        // LOGIN OFFLINE
        const usuarioLocal = await obtenerUsuarioOffline();
        if (!usuarioLocal) return Alert.alert('Error', 'No hay datos guardados para login offline');
        console.log('Comparando offline...');
        console.log('Cedula guardada:', usuarioLocal.cedula);
        console.log('Cedula ingresada:', cedula);
        console.log('Contrasena guardada:', usuarioLocal.contrasena);
        console.log('Contrasena ingresada:', contrasena);

        if (usuarioLocal.cedula !== cedula || usuarioLocal.contrasena !== contrasena) {
          return Alert.alert('Error', 'Credenciales incorrectas');
        }

        // Acceso offline sin token
        await AsyncStorage.setItem('userId', usuarioLocal.id_usuario.toString());
        await AsyncStorage.setItem('userNombres', usuarioLocal.nombres);
        await AsyncStorage.setItem('userApellidos', usuarioLocal.apellidos);
        await AsyncStorage.setItem('userRol', usuarioLocal.id_rol.toString());

        Alert.alert('Login exitoso (offline)');
        navigation.navigate('Home');
      }

    } catch (error) {
      console.error('ESTE ES EL ERROR:', error);

      if (error.response?.status === 401) {
        Alert.alert('Error de autenticación', 'Usuario o contraseña incorrectos');
      } else if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', error.message || 'Algo salió mal');
      }
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <StatusBar style="dark" />

      <TextInput
        style={[styles.input, { color: '#000' }]} // asegura texto visible
        placeholder="Cédula"
        placeholderTextColor="#888" // asegura que se vea el placeholder
        value={cedula}
        onChangeText={setCedula}
      />

      <TextInput
        style={[styles.input, { color: '#000' }]}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        secureTextEntry={true}
        autoCapitalize="none"
        value={contrasena}
        onChangeText={setContrasena}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;


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
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});