// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Guardar Usuario
export const guardarUsuarioOffline = async (usuario, contrasena) => {
  const usuarioOffline = {
    id_usuario: usuario.id_usuario,
    id_rol: usuario.id_rol,
    cedula: usuario.cedula,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    contrasena: contrasena,
    id_jefe_inmediato: usuario.id_jefe_inmediato,
  };
  await AsyncStorage.setItem('usuarioOffline', JSON.stringify(usuarioOffline));
};

// Obtener usuario guardado
export const obtenerUsuarioOffline = async () => {
  const data = await AsyncStorage.getItem('usuarioOffline');
  return data ? JSON.parse(data) : null;
};

// Guardar empleados localmente
export const guardarEmpleadosOffline = async (clave, empleados) => {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(empleados));
  } catch (error) {
    console.error(`Error guardando empleados en ${clave}`, error);
  }
};

// Obtener empleados guardados
export const obtenerEmpleadosOffline = async (clave) => {
  try {
    const data = await AsyncStorage.getItem(clave);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error obteniendo empleados offline', error);
    return [];
  }
};


