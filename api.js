window.RMGApi = (() => {
  const { mostrarMensaje } = window.RMGUtils;

  function validarConfiguracionAPI() {
    const apiUrl = window.RMG_CONFIG?.API_URL || '';
    return apiUrl && !apiUrl.includes('PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT');
  }

  async function call(action, data = {}) {
    if (!validarConfiguracionAPI()) {
      throw new Error('Falta configurar la URL de Google Apps Script en config.js.');
    }

    const response = await fetch(window.RMG_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, ...data })
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new Error('La respuesta del servidor no es válida. Verifica la publicación del Google Apps Script como Web App.');
    }

    if (!json.ok) {
      throw new Error(json.error || 'Error desconocido en el servidor.');
    }

    return json;
  }

  async function listar(incluirEliminados = true) {
    const respuesta = await call('listar', { incluirEliminados });
    return Array.isArray(respuesta.reportes) ? respuesta.reportes : [];
  }

  async function guardar(reporte) {
    return call('guardar', { reporte });
  }

  async function actualizar(reporte) {
    return call('actualizar', { reporte });
  }

  async function cerrar(id, operador = '') {
    return call('cerrar', { id, operador });
  }

  async function eliminar(id, clave, operador = '') {
    return call('eliminar', { id, clave, operador, eliminacionLogica: true });
  }

  async function restaurar(id, clave, operador = '') {
    return call('restaurar', { id, clave, operador });
  }

  async function probarConexion() {
    try {
      await listar(false);
      return true;
    } catch (error) {
      mostrarMensaje(error.message, 'error');
      return false;
    }
  }

  return {
    call,
    listar,
    guardar,
    actualizar,
    cerrar,
    eliminar,
    restaurar,
    probarConexion
  };
})();
