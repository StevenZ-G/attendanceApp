import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerEmpleadosPorSupervisor, createAsistencia, obtenerHorariosPorIdRol, obtenerTodosTipoAsistencia, obtenerTodasAsistencias, obtenerTodosHorarios } from '../data/api'; // Asegúrate que esta función exista
import { FlatList } from 'react-native';
import { Switch } from 'react-native';
import { estaConectado } from '../utils/network';
import { guardarEmpleadosOffline, obtenerEmpleadosOffline} from '../utils/storage';
import { obtenerAsistenciasOffline, guardarAsistenciaOffline } from '../utils/offlineStorage';
import { StatusBar } from 'expo-status-bar';


const RegistrarSalida = () => {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [flag, setFlag] = useState(false);


  useEffect(() => {
    fetchEmpleados();
    syncHorariosPorRol();
  }, []);

  const syncHorariosPorRol = async () => {
    const conectado = await estaConectado();
    if (!conectado) return;

    try {
      const horarios = await obtenerTodosHorarios(); 
      await AsyncStorage.setItem('horariosPorRol', JSON.stringify(horarios));
      console.log('Horarios sincronizados localmente');
    } catch (error) {
      console.error('Error al sincronizar horarios:', error);
    }
  };

  const fetchEmpleados = async () => {
    const conectado = await estaConectado();
    const getFechaLocal = () => {
      const ahora = new Date();
      const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
      const localDate = new Date(ahora.getTime() - offsetMs);
      return localDate.toISOString().split('T')[0];
    };

    const hoy = getFechaLocal();
    let asistencias = [];
    let tiposAsistencia = [];

    if (conectado) {
      asistencias = (await obtenerTodasAsistencias()).data;
      tiposAsistencia = (await obtenerTodosTipoAsistencia()).data;
    } else {
      asistencias = await obtenerAsistenciasOffline();
      console.log('Asistencias offline', asistencias)
      tiposAsistencia = [ 
        { id_tipo_asistencia: 4, nombre_tipo_asistencia: 'SALIDA NORMAL' },
        { id_tipo_asistencia: 5, nombre_tipo_asistencia: 'SALIDA ANTICIPADA' }
      ];
    }

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      return;
    }

    let empleadosObtenidos = conectado
      ? await obtenerEmpleadosPorSupervisor(userId)
      : await obtenerEmpleadosOffline('empleadosSalida');

    // 🔍 Filtrar empleados que ya tienen asistencia tipo ENTRADA hoy
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
      await guardarEmpleadosOffline('empleadosSalida', empleadosObtenidos);
    }

    const initialSelection = {};
    empleadosObtenidos.forEach(emp => {
      initialSelection[emp.id_usuario] = false;
    });
    setSelectedEmpleados(initialSelection);
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

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.switchWrapper}>
        <Switch
          value={selectedEmpleados[item.id_usuario] || false}
          onValueChange={() => toggleEmpleado(item.id_usuario)}
        />
      </View>
      <Text style={styles.cell}>{item.apellidos}</Text>
      <Text style={styles.cell}>{item.nombres}</Text>
    </View>
  );

  const sumarHorasExtra = (horaStr, horas) => {
    const [hh, mm, ss] = horaStr.split(':').map(Number);
    const nuevaHora = new Date();
    nuevaHora.setHours(hh + horas, mm, ss);
    return nuevaHora.toTimeString().split(' ')[0]; // HH:mm:ss
  };


  const assignSalida = async () => {
    const conectado = await estaConectado();
    const horasExtraData = await AsyncStorage.getItem('horasExtra');
    const horasExtra = horasExtraData ? JSON.parse(horasExtraData) : {};

    try {
      const empleadosSeleccionados = empleados.filter(emp => selectedEmpleados[emp.id_usuario]);
      if (empleadosSeleccionados.length === 0) {
        Alert.alert('Atención', 'No has seleccionado ningún empleado.');
        return;
      }

      const asistencias = conectado ? (await obtenerTodasAsistencias()).data : [];
      const tiposAsistencia = conectado ? (await obtenerTodosTipoAsistencia()).data : [];
      const idSupervisor = await AsyncStorage.getItem('userId');
      const estado = 'A';
      const ahora = new Date();
      //const horaActual = ahora.toTimeString().split(' ')[0];
      const fechaActual = ahora.toISOString().split('T')[0];
      const getHoraLocal = () => {
        const ahora = new Date();
        const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
        const localDate = new Date(ahora.getTime() - offsetMs);
        return localDate.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
      };
      const horaActual = getHoraLocal();
      console.log('Esta es la Hora Local', horaActual);


      const pad = (n) => n.toString().padStart(2, '0');
      const formatFechaLocal = (fecha) => {
        const año = fecha.getFullYear();
        const mes = pad(fecha.getMonth() + 1);
        const dia = pad(fecha.getDate());
        const horas = pad(fecha.getHours());
        const minutos = pad(fecha.getMinutes());
        const segundos = pad(fecha.getSeconds());
        return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
      };

      for (const empleado of empleadosSeleccionados) {
        const idEmpleado = empleado.id_usuario;
        const idRol = empleado.id_rol;

        let yaTieneSalida = false;

        if (conectado) {
          yaTieneSalida = asistencias.some(a => {
            const fecha = a.fecha_asistencia?.split('T')[0] || a.fecha_asistencia?.split(' ')[0];
            const tipo = tiposAsistencia.find(t => t.id_tipo_asistencia === a.id_tipo_asistencia)?.nombre_tipo_asistencia;
            return (
              a.id_usuario === idEmpleado &&
              fecha === fechaActual &&
              tipo?.includes('SALIDA')
            );
          });

          if (yaTieneSalida) {
            continue;
          }
        }

        let horarioEmpleado;
        if (conectado) {
          horarioEmpleado = await obtenerHorariosPorIdRol(idRol);
        } else {
          const horariosParsed = await AsyncStorage.getItem('horariosPorRol');
          const horariosObj = horariosParsed ? JSON.parse(horariosParsed) : { data: [] };
          const horarios = horariosObj.data;

          const horarioEmpleado = horarios.find(h => h.id_rol === idRol);
        }
        const horaSalidaRaw = horarioEmpleado?.data?.hora_salida;

        let tipoAsistenciaId = null;
        const salidaEsperada = new Date(horaSalidaRaw);
        if (horaActual >= salidaEsperada) {
          tipoAsistenciaId = conectado
            ? tiposAsistencia.find(t => t.nombre_tipo_asistencia === 'SALIDA NORMAL')?.id_tipo_asistencia
            : 4;
        } else {
          tipoAsistenciaId = conectado
            ? tiposAsistencia.find(t => t.nombre_tipo_asistencia === 'SALIDA ANTICIPADA')?.id_tipo_asistencia
            : 5;
        }

        //const horas = parseInt(horasExtra[idEmpleado] || '0', 10);

        // ✅ Obtener y sumar las horas extra
        const horasObj = Array.isArray(horasExtra)
          ? horasExtra.find(h => h.id_usuario === idEmpleado) || { horas: '0', pagada: 0 }
          : { horas: '0', pagada: 0 };
        const horas = parseInt(horasObj.horas || '0', 10);
        const pagada = horasObj.pagada || 0;
        console.log('Pagada', pagada)

        let horaRegistro = new Date();

        if (horas > 0 && horaSalidaRaw) {
          const horaPartes = horaSalidaRaw.split('T')[1]?.split('.')[0]; // "15:30:00"
          if (horaPartes) {
            const [hStr, mStr, sStr] = horaPartes.split(':');
            const hh = parseInt(hStr, 10);
            const mm = parseInt(mStr, 10);
            const ss = parseInt(sStr, 10);
            horaRegistro.setHours(hh + horas, mm, ss); // Restamos 5 aquí mismo
          }
        }

        // ✂️ Resta 5 horas antes de guardar, para compensar la conversión a UTC
        horaRegistro.setHours(horaRegistro.getHours() - 5);

        const fechaFormateada = formatFechaLocal(horaRegistro);

        const nuevaAsistencia = {
          id_usuario: idEmpleado,
          id_supervisor: parseInt(idSupervisor),
          id_tipo_asistencia: tipoAsistenciaId,
          estado,
          fecha_asistencia: fechaFormateada,
          horas_extra_pagadas: pagada
        };

        if (conectado) {
          await createAsistencia(nuevaAsistencia);
        } else {
          await guardarAsistenciaOffline(nuevaAsistencia);
        }
      }
      const clearHorasExtra = async () => {
        try {
          await AsyncStorage.removeItem('horasExtra');
          console.log('Horas extra eliminadas del AsyncStorage.');
        } catch (error) {
          console.error('Error eliminando horas extra:', error);
        }
      };

      if (!conectado) {
        const empleadosSalida = await obtenerEmpleadosOffline('empleadosSalida') || [];
        const empleadosHorasExtra = await obtenerEmpleadosOffline('empleadosHorasExtra') || [];

        const empleadosIdsSeleccionados = empleadosSeleccionados.map(emp => emp.id_usuario);

        const nuevosSalida = empleadosSalida.filter(emp => !empleadosIdsSeleccionados.includes(emp.id_usuario));
        const nuevosHorasExtra = empleadosHorasExtra.filter(emp => !empleadosIdsSeleccionados.includes(emp.id_usuario));

        await AsyncStorage.setItem('empleadosSalida', JSON.stringify(nuevosSalida));
        await AsyncStorage.setItem('empleadosHorasExtra', JSON.stringify(nuevosHorasExtra));
      }


      Alert.alert('Éxito', conectado ? 'Asistencias registradas online' : 'Asistencias guardadas localmente');
      setTimeout(() => {
        fetchEmpleados();
        clearHorasExtra();
      }, 5000);
    } catch (error) {
      console.error('Error al asignar asistencias:', error);
      Alert.alert('Error', 'Hubo un problema al asignar asistencias');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Registrar Salida</Text>

      <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
        <Text style={styles.buttonText}>
          {selectAll ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
        </Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.headerCell}></Text>
        <Text style={styles.headerCell}>Apellido</Text>
        <Text style={styles.headerCell}>Nombre</Text>

      </View>

      <FlatList
        data={empleados}
        renderItem={renderItem}
        keyExtractor={item => item.id_usuario.toString()}
      />
      <TouchableOpacity style={[styles.selectAllButton, { marginTop: 20 }]} onPress={assignSalida}>
        <Text style={styles.buttonText}>
          {'Asignar Salida'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
};

export default RegistrarSalida;

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
  switchWrapper: {
    flex: 1,
    alignItems: 'center',
  },
});
