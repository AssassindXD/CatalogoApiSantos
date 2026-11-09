const API_URL = "https://jsonplaceholder.typicode.com";

async function hacerPeticion(ruta, opciones = {}) {
  const controlador = new AbortController();

  const tiempo = setTimeout(() => {
    controlador.abort();
  }, 10000);

  try {
    const respuesta = await fetch(API_URL + ruta, {
      ...opciones,
      signal: controlador.signal,
    });

    if (respuesta.status >= 400 && respuesta.status < 500) {
      throw new Error("Error 4xx: solicitud incorrecta");
    }

    if (respuesta.status >= 500) {
      throw new Error("Error 5xx: problema del servidor");
    }

    if (!respuesta.ok) {
      throw new Error("No se pudo completar la solicitud");
    }

    if (opciones.method === "DELETE") {
      return true;
    }

    return await respuesta.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado");
    }

    if (
      error.message.includes("fetch failed") ||
      error.message.includes("Network request failed") ||
      error.message.includes("UnknownHostException") ||
      error instanceof TypeError
    ) {
      throw new Error(
        "Sin conexión a Internet. Revisa tu conexión e inténtalo nuevamente.",
      );
    }

    throw error;
  } finally {
    clearTimeout(tiempo);
  }
}

export async function obtenerPublicaciones() {
  return await hacerPeticion("/posts");
}

export async function crearPublicacion(titulo, contenido) {
  return await hacerPeticion("/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: titulo,
      body: contenido,
      userId: 1,
    }),
  });
}

export async function editarPublicacion(id, titulo, contenido) {
  return await hacerPeticion("/posts/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id,
      title: titulo,
      body: contenido,
      userId: 1,
    }),
  });
}

export async function eliminarPublicacion(id) {
  return await hacerPeticion("/posts/" + id, {
    method: "DELETE",
  });
}
