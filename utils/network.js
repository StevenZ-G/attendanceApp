// utils/network.js
import NetInfo from '@react-native-community/netinfo';

export const estaConectado = async () => {
  return new Promise((resolve) => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isInternetReachable !== null) {
        resolve(state.isConnected && state.isInternetReachable);
        unsubscribe(); // dejemos de escuchar una vez que tenemos el dato
      }
    });
  });
};

// export const estaConectado = async () => {
//   try {
//     const state = await NetInfo.fetch();
//     console.log('Estado de conexión:', state);
//     return state.isConnected && state.isInternetReachable;
//   } catch (error) {
//     console.error('Error verificando conexión:', error);
//     return false;
//   }
// };

