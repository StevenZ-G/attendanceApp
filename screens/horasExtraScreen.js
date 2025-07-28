import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerEmpleadosPorSupervisor } from '../data/api'; // Asegúrate que esta función exista
import { FlatList } from 'react-native';
import { Switch } from 'react-native';
import { estaConectado } from '../utils/network';
import { guardarEmpleadosOffline, obtenerEmpleadosOffline} from '../utils/storage';
import { obtenerTodasAsistencias, obtenerTodosTipoAsistencia } from '../data/api';
import { obtenerAsistenciasOffline } from '../utils/offlineStorage';
import { StatusBar } from 'expo-status-bar';

const HorasExtraScreen = () => {
    const [empleados, setEmpleados] = useState([]);
    const [horasExtra, setHorasExtra] = useState({});
    const [selectedEmpleados, setSelectedEmpleados] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [pagadas, setPagadas] = useState({});


    useEffect (() => {
        const fetchEmpleados = async () => {
          const conectado = await estaConectado();
          const getFechaLocal = () => {
            const ahora = new Date();
            const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
            const localDate = new Date(ahora.getTime() - offsetMs);
            return localDate.toISOString().split('T')[0];
          };

          const hoy = getFechaLocal();
          console.log('Fecha local corregida:', hoy);
          let asistencias = [];
          let tiposAsistencia = [];

          if (conectado) {
            asistencias = (await obtenerTodasAsistencias()).data;
            console.log('Asistencias obtenidas:', asistencias);
            tiposAsistencia = (await obtenerTodosTipoAsistencia()).data;
          } else {
            asistencias = await obtenerAsistenciasOffline();
            tiposAsistencia = [ 
              { id_tipo_asistencia: 4, nombre_tipo_asistencia: 'SALIDA NORMAL' },
              { id_tipo_asistencia: 5, nombre_tipo_asistencia: 'SALIDA ANTICIPADA' }
            ];
          }

          const userId = await AsyncStorage.getItem('userId');
          console.log('User ID obtenido:', userId);
          if (!userId) {
            console.warn('No se encontró el userId');
            return;
          }

          let empleadosObtenidos = conectado
            ? await obtenerEmpleadosPorSupervisor(userId)
            : await obtenerEmpleadosOffline('empleadosHorasExtra');

          // 🔍 Filtrar empleados que ya tienen asistencia tipo ENTRADA hoy
          // Para solo mostrar los que ya tienen entrada y no tienen salida :)
          if (conectado && asistencias.length > 0) {
            empleadosObtenidos = empleadosObtenidos.filter(empleado => {
              const yaTieneEntrada = asistencias.some(a => {
                const fecha = a.fecha_asistencia?.split('T')[0] || a.fecha_asistencia?.split(' ')[0];
                return (
                  a.id_usuario === empleado.id_usuario &&
                  fecha === hoy &&
                  [2, 3].includes(a.id_tipo_asistencia)
                );
              });
              return yaTieneEntrada;
            });

            empleadosObtenidos = empleadosObtenidos.filter(empleado => {
              const yaTieneSalida = asistencias.some(a => {
                const fecha = a.fecha_asistencia?.split('T')[0] || a.fecha_asistencia?.split(' ')[0];
                return (
                  a.id_usuario === empleado.id_usuario &&
                  fecha === hoy &&
                  [4, 5].includes(a.id_tipo_asistencia)
                );
              });
              return !yaTieneSalida;
            });
          }

          // Ordenar y guardar
          empleadosObtenidos.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
          setEmpleados(empleadosObtenidos);

          if (conectado) {
            await guardarEmpleadosOffline('empleadosHorasExtra', empleadosObtenidos);
          }

          const initialSelection = {};
          empleadosObtenidos.forEach(emp => {
            initialSelection[emp.id_usuario] = false;
          });
          setSelectedEmpleados(initialSelection);
        };

        fetchEmpleados();

    }, []);

    const handleHorasChange = (id, value) => {
      //const horas = value.replace(/[^0-9]/g, ''); // Solo números
      const horas = value.match(/^[1-5]$/) ? value.match(/^[1-5]$/)[0] : '';
      setHorasExtra(prev => ({
        ...prev,
        [id]: horas
      }));
    };

    const toggleEmpleado = (id) => {
      setSelectedEmpleados((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    };

    const toggleSelectAll = () => {
      const newSelectAll = !selectAll;
      const updatedSelection = {};
      empleados.forEach(emp => {
        updatedSelection[emp.id_usuario] = newSelectAll;
      });
      setSelectedEmpleados(updatedSelection);
      setSelectAll(newSelectAll);
    };

    const guardarHorasExtra = async () => {
      try {
        const dataAGuardar = empleados.map(emp => ({
          id_usuario: emp.id_usuario,
          horas: horasExtra[emp.id_usuario] || '0',
          pagada: pagadas[emp.id_usuario] ? 1 : 0,
        }));

        await AsyncStorage.setItem('horasExtra', JSON.stringify(dataAGuardar));
        console.log('Horas Guardadas', dataAGuardar);
        Alert.alert('Éxito', 'Horas extra guardadas correctamente');
      } catch (error) {
        console.error('Error guardando horas extra:', error);
        Alert.alert('Error', 'No se pudieron guardar las horas extra');
      }
    };

    const renderItem = ({ item }) => (
        <View style={styles.row}>
          <Text style={styles.cell}>{item.apellidos}</Text>
          <Text style={styles.cell}>{item.nombres}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Horas"
            value={horasExtra[item.id_usuario] || ''}
            onChangeText={(text) => handleHorasChange(item.id_usuario, text)}
          />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Switch
              value={pagadas[item.id_usuario] || false}
              onValueChange={(value) =>
                setPagadas(prev => ({ ...prev, [item.id_usuario]: value }))
              }
            />
          </View>

        </View>
      );
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrar Horas Extra</Text>
        <StatusBar style="dark" />
        
        <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
          <Text style={styles.buttonText}>
            {selectAll ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Nombre</Text>
            <Text style={styles.headerCell}>Apellido</Text>
            <Text style={styles.headerCell}>Horas</Text>
            <Text style={styles.headerCell}>Pagadas</Text>
        </View>

        <FlatList
            data={empleados}
            renderItem={renderItem}
            keyExtractor={item => item.id_usuario.toString()}
        />
        <TouchableOpacity style={[styles.selectAllButton, { marginTop: 20 }]} onPress={guardarHorasExtra}>
                <Text style={styles.buttonText}>
                  {'Asignar Horas Extra'}
                </Text>
              </TouchableOpacity>
        </View>

    )
}

export default HorasExtraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  selectAllButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: 50,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 4,
    padding: 4,
    textAlign: 'center',
  },
});
