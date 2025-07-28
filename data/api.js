// src/data/api/api.js
import axios from 'axios';

const BASE_URL = 'https://76d3-190-63-37-170.ngrok-free.app/api';
//const BASE_URL = 'http://192.168.1.56:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// LOGIN
export const login = async (cedula, contrasena) => {
  const response = await api.post('/auth/login', { cedula, contrasena });
  return response.data;
};

// Obtener Usuarios
export const obtenerTodos = async () => {
  const response = await api.get('/usuario');
  return response.data;
};

// obtener Usuarios por supervisor
export const obtenerEmpleadosPorSupervisor = async (id_jefe_inmediato) => {
  const response = await api.get(`/usuario/supervisor/${id_jefe_inmediato}`);
  console.log(response);
  return response.data.data;
};

// Obtener Tipos de Asistencia
export const obtenerTodosTipoAsistencia = async () => {
  const response = await api.get('/tipo-asistencia');
  return response.data; 
}

// Obtener Horarios
export const obtenerTodosHorarios = async () => {
  const response = await api.get('/horario');
  return response.data;
}


// Horarios por rol
export const obtenerHorariosPorIdRol = async (id_rol) => {
  const response = await api.get(`/horario/rol/${id_rol}`);
  return response.data;
}

// Obtener Asistencias
export const obtenerTodasAsistencias = async () => {
  const response = await api.get('/asistencia');
  return response.data;
}

// Crear Asistencia
export const createAsistencia = async (nuevaAsistencia) => {
  const response = await api.post('/asistencia', nuevaAsistencia);
  return response.data;
};

export default api;
