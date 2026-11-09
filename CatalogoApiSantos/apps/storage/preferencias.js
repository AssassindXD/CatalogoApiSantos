import AsyncStorage from "@react-native-async-storage/async-storage";

export async function guardarPreferencia(valor) {
  await AsyncStorage.setItem("soloFavoritos", JSON.stringify(valor));
}

export async function leerPreferencia() {
  const datos = await AsyncStorage.getItem("soloFavoritos");

  if (datos !== null) {
    return JSON.parse(datos);
  }

  return false;
}
