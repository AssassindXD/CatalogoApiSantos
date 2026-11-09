import AsyncStorage from "@react-native-async-storage/async-storage";

export async function guardarFavoritos(favoritos) {
  await AsyncStorage.setItem("favoritos", JSON.stringify(favoritos));
}

export async function leerFavoritos() {
  const datos = await AsyncStorage.getItem("favoritos");

  if (datos !== null) {
    return JSON.parse(datos);
  }

  return [];
}
