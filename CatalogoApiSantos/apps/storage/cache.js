import AsyncStorage from "@react-native-async-storage/async-storage";

// Guardar publicaciones en el teléfono
// esto no entendi fue la IA
export async function guardarPublicaciones(publicaciones) {
  await AsyncStorage.setItem("publicaciones", JSON.stringify(publicaciones));
}

// Recuperar publicaciones guardadas
export async function leerPublicaciones() {
  const datos = await AsyncStorage.getItem("publicaciones");

  if (datos !== null) {
    return JSON.parse(datos);
  }

  return null;
}
