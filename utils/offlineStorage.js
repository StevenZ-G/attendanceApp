import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ASISTENCIAS_OFFLINE = 'asistenciasOffline';

// Guardar asistencia localmente
export const guardarAsistenciaOffline = async (asistencia) => {
  try {
    const existentes = await obtenerAsistenciasOffline();
    existentes.push(asistencia);
    await AsyncStorage.setItem(KEY_ASISTENCIAS_OFFLINE, JSON.stringify(existentes));
  } catch (e) {
    console.error('Error guardando asistencia offline:', e);
  }
};

// Obtener todas las asistencias guardadas localmente
export const obtenerAsistenciasOffline = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY_ASISTENCIAS_OFFLINE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Limpiar asistencias después de sincronizar
export const limpiarAsistenciasOffline = async () => {
  try {
    await AsyncStorage.removeItem(KEY_ASISTENCIAS_OFFLINE);
  } catch (e) {
    console.error('Error limpiando asistencias offline:', e);
  }
};