import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";

import {
  obtenerPublicaciones,
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
} from "./api/client";

import { guardarPublicaciones, leerPublicaciones } from "./storage/cache";

import { guardarFavoritos, leerFavoritos } from "./storage/favoritos";

import { guardarPreferencia, leerPreferencia } from "./storage/preferencias";

export default function Index() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [soloFavoritos, setSoloFavoritos] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [idEditar, setIdEditar] = useState(null);

  const [errorTitulo, setErrorTitulo] = useState("");
  const [errorContenido, setErrorContenido] = useState("");

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  async function cargarPublicaciones() {
    setCargando(true);
    setError("");

    try {
      const favoritosGuardados = await leerFavoritos();
      setFavoritos(favoritosGuardados);

      const preferenciaGuardada = await leerPreferencia();
      setSoloFavoritos(preferenciaGuardada);

      const guardadas = await leerPublicaciones();

      if (guardadas !== null) {
        setPublicaciones(guardadas);
      } else {
        const datos = await obtenerPublicaciones();
        const lista = datos.slice(0, 5);
        //no mas para que me salga menos del api
        await guardarPublicaciones(lista);
        setPublicaciones(lista);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function actualizarLista() {
    setCargando(true);
    setError("");

    try {
      await obtenerPublicaciones();

      const guardadas = await leerPublicaciones();

      if (guardadas !== null) {
        setPublicaciones(guardadas);
      } else {
        const datos = await obtenerPublicaciones();
        const lista = datos.slice(0, 10);

        await guardarPublicaciones(lista);
        setPublicaciones(lista);
      }

      Alert.alert(
        "Conexión correcta",
        "La API respondió correctamente. Tus publicaciones guardadas se conservaron.",
      );
    } catch (e) {
      try {
        const guardadas = await leerPublicaciones();

        if (guardadas !== null) {
          setPublicaciones(guardadas);

          Alert.alert(
            "Error de conexión",
            e.message + "\nTus publicaciones guardadas se conservaron.",
          );
        } else {
          setError(e.message);
        }
      } catch (errorGuardado) {
        setError(errorGuardado.message);
      }
    } finally {
      setCargando(false);
    }
  }

  async function cambiarFavorito(id) {
    try {
      let nuevosFavoritos = [];

      if (favoritos.includes(id)) {
        nuevosFavoritos = favoritos.filter((favoritoId) => favoritoId !== id);
      } else {
        nuevosFavoritos = [...favoritos, id];
      }

      await guardarFavoritos(nuevosFavoritos);
      setFavoritos(nuevosFavoritos);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el favorito");
    }
  }

  async function cambiarPreferencia() {
    try {
      const nuevoValor = !soloFavoritos;

      await guardarPreferencia(nuevoValor);
      setSoloFavoritos(nuevoValor);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la preferencia");
    }
  }

  async function guardarPublicacion() {
    setErrorTitulo("");
    setErrorContenido("");

    let hayError = false;

    if (titulo.trim() === "") {
      setErrorTitulo("El título es obligatorio");
      hayError = true;
    }

    if (contenido.trim() === "") {
      setErrorContenido("El contenido es obligatorio");
      hayError = true;
    }

    if (hayError) {
      return;
    }

    try {
      let nuevaLista = [];

      if (idEditar !== null) {
        if (idEditar <= 100) {
          await editarPublicacion(idEditar, titulo, contenido);
        }

        nuevaLista = publicaciones.map((item) =>
          item.id === idEditar
            ? { ...item, title: titulo, body: contenido }
            : item,
        );
      } else {
        const nueva = await crearPublicacion(titulo, contenido);

        nuevaLista = [{ ...nueva, id: Date.now() }, ...publicaciones];
      }

      await guardarPublicaciones(nuevaLista);
      setPublicaciones(nuevaLista);

      if (idEditar !== null) {
        Alert.alert("Éxito", "Publicación editada");
      } else {
        Alert.alert("Éxito", "Publicación creada");
      }

      setTitulo("");
      setContenido("");
      setIdEditar(null);
      setErrorTitulo("");
      setErrorContenido("");
    } catch (e) {
      Alert.alert("Error al guardar", e.message);
    }
  }

  function seleccionarEditar(item) {
    setTitulo(item.title);
    setContenido(item.body);
    setIdEditar(item.id);
    setErrorTitulo("");
    setErrorContenido("");
  }

  function cancelarEdicion() {
    setTitulo("");
    setContenido("");
    setIdEditar(null);
    setErrorTitulo("");
    setErrorContenido("");
  }

  function confirmarEliminar(id) {
    Alert.alert("Eliminar", "¿Deseas eliminar esta publicación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: () => borrarPublicacion(id),
      },
    ]);
  }

  async function borrarPublicacion(id) {
    try {
      if (id <= 100) {
        await eliminarPublicacion(id);
      }

      const nuevaLista = publicaciones.filter((item) => item.id !== id);

      await guardarPublicaciones(nuevaLista);
      setPublicaciones(nuevaLista);

      if (favoritos.includes(id)) {
        const nuevosFavoritos = favoritos.filter(
          (favoritoId) => favoritoId !== id,
        );

        await guardarFavoritos(nuevosFavoritos);
        setFavoritos(nuevosFavoritos);
      }

      if (idEditar === id) {
        cancelarEdicion();
      }

      Alert.alert("Éxito", "Publicación eliminada");
    } catch (e) {
      Alert.alert("Error al eliminar", e.message);
    }
  }

  const listaVisible = soloFavoritos
    ? publicaciones.filter((item) => favoritos.includes(item.id))
    : publicaciones;

  return (
    <View style={s.contenedor}>
      <Text style={s.titulo}>Lista de Publicaciones</Text>

      <TextInput
        style={s.input}
        placeholder="Título"
        value={titulo}
        onChangeText={(texto) => {
          setTitulo(texto);
          setErrorTitulo("");
        }}
      />

      {errorTitulo !== "" && <Text style={s.errorCampo}>{errorTitulo}</Text>}

      <TextInput
        style={s.input}
        placeholder="Contenido"
        value={contenido}
        onChangeText={(texto) => {
          setContenido(texto);
          setErrorContenido("");
        }}
      />

      {errorContenido !== "" && (
        <Text style={s.errorCampo}>{errorContenido}</Text>
      )}

      <Button
        title={idEditar !== null ? "Guardar cambios" : "Guardar publicación"}
        onPress={guardarPublicacion}
      />

      {idEditar !== null && (
        <View style={s.espacio}>
          <Button
            title="Cancelar edición"
            color="gray"
            onPress={cancelarEdicion}
          />
        </View>
      )}

      <View style={s.espacio}>
        <Button title="Actualizar lista" onPress={actualizarLista} />
      </View>

      <View style={s.espacio}>
        <Button
          title={
            soloFavoritos
              ? "Mostrar todas las publicaciones"
              : "❤️ Mostrar solo favoritos"
          }
          color="#d6336c"
          onPress={cambiarPreferencia}
        />
      </View>

      {cargando ? (
        <View>
          <ActivityIndicator size="large" color="blue" />
          <Text style={s.mensaje}>Cargando publicaciones...</Text>
        </View>
      ) : error ? (
        <View>
          <Text style={s.error}>{error}</Text>
          <Button title="Reintentar" onPress={actualizarLista} />
        </View>
      ) : (
        <>
          {publicaciones.length > 0 && (
            <Text style={s.exito}>Publicaciones cargadas correctamente</Text>
          )}

          <FlatList
            data={listaVisible}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={s.mensaje}>
                {soloFavoritos
                  ? "Todavía no tienes publicaciones favoritas"
                  : "No hay publicaciones disponibles"}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={s.tarjeta}>
                <Text style={s.nombre}>{item.title}</Text>
                <Text>{item.body}</Text>

                <View style={s.espacio}>
                  <Button
                    title={
                      favoritos.includes(item.id)
                        ? "❤️ Quitar de favoritos"
                        : "🤍 Agregar a favoritos"
                    }
                    color={favoritos.includes(item.id) ? "#d6336c" : "#777777"}
                    onPress={() => cambiarFavorito(item.id)}
                  />
                </View>

                <View style={s.espacio}>
                  <Button
                    title="Editar"
                    onPress={() => seleccionarEditar(item)}
                  />
                </View>

                <View style={s.espacio}>
                  <Button
                    title="Eliminar"
                    color="red"
                    onPress={() => confirmarEliminar(item.id)}
                  />
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  espacio: {
    marginTop: 10,
    marginBottom: 10,
  },
  tarjeta: {
    backgroundColor: "white",
    padding: 15,
    marginTop: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  nombre: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  error: {
    color: "red",
    textAlign: "center",
    margin: 15,
  },
  errorCampo: {
    color: "red",
    marginBottom: 10,
    fontSize: 13,
  },
  mensaje: {
    textAlign: "center",
    margin: 15,
    color: "gray",
  },
  exito: {
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },
});
