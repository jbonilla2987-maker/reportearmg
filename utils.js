window.RMGUtils = (() => {
  function $(id) {
    return document.getElementById(id);
  }

  function limpiarTexto(valor) {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizarTexto(valor) {
    return String(valor ?? '').trim();
  }

  function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-PA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function fechaISOActual() {
    return new Date().toISOString();
  }

  function calcularMinutos(inicio, fin) {
    if (!inicio || !fin) return '';
    const ini = new Date(inicio).getTime();
    const end = new Date(fin).getTime();
    if (Number.isNaN(ini) || Number.isNaN(end)) return '';
    return Math.max(0, Math.floor((end - ini) / 60000));
  }

  function calcularTiempoTexto(inicio, fin) {
    const minutos = calcularMinutos(inicio, fin);
    if (minutos === '') return 'Pendiente';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas} h ${mins} min`;
  }

  function llenarSelect(select, opciones, placeholder = 'Seleccione') {
    if (!select) return;
    select.textContent = '';
    const primera = document.createElement('option');
    primera.value = '';
    primera.textContent = placeholder;
    select.appendChild(primera);

    opciones.forEach(opcion => {
      const option = document.createElement('option');
      option.value = opcion;
      option.textContent = opcion;
      select.appendChild(option);
    });
  }

  function mostrarMensaje(texto, tipo = 'info') {
    const mensaje = $('mensaje');
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = `message ${tipo}`;
    mensaje.style.display = 'block';
    clearTimeout(mensaje._timeout);
    mensaje._timeout = setTimeout(() => {
      mensaje.style.display = 'none';
    }, 5000);
  }

  function crearBadge(estado, eliminado) {
    const span = document.createElement('span');
    const estadoFinal = eliminado || estado === 'Eliminada' ? 'Eliminada' : (estado || 'Abierta');
    span.className = `badge ${estadoFinal === 'Cerrada' ? 'badge-closed' : estadoFinal === 'Eliminada' ? 'badge-deleted' : 'badge-open'}`;
    span.textContent = estadoFinal;
    return span;
  }

  function setLoading(boton, cargando, textoCargando = 'Procesando...') {
    if (!boton) return;
    if (cargando) {
      boton.dataset.textoOriginal = boton.textContent;
      boton.textContent = textoCargando;
      boton.disabled = true;
      boton.classList.add('is-loading');
    } else {
      boton.textContent = boton.dataset.textoOriginal || boton.textContent;
      boton.disabled = false;
      boton.classList.remove('is-loading');
    }
  }

  function descargarExcel(nombreArchivo, filas, nombreHoja = 'Reportes') {
    if (!window.XLSX) {
      mostrarMensaje('No se pudo cargar la librería de Excel. Verifica tu conexión.', 'error');
      return;
    }
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
    XLSX.writeFile(libro, nombreArchivo);
  }

  function exportarReportes(reportes, nombre = 'reporte_fallas_rmg_3.1.xlsx') {
    const filas = reportes.map(rep => ({
      'Número': rep.numeroFalla || '',
      'Grúa': rep.rmg || '',
      'Operador': rep.operador || '',
      'Turno': rep.turno || '',
      'Área': rep.area || '',
      'Modo de operación': rep.modoOperacion || '',
      'Tipo de falla': rep.tipoFalla || '',
      'Descripción': rep.descripcion || '',
      'Acción tomada': rep.accionTomada || '',
      'Observación de cierre': rep.observacionCierre || '',
      'Hora de inicio': formatearFecha(rep.horaInicio),
      'Hora de finalización': formatearFecha(rep.horaFin),
      'Tiempo total': rep.tiempoTexto || calcularTiempoTexto(rep.horaInicio, rep.horaFin),
      'Tiempo total minutos': rep.tiempoTotalMinutos ?? calcularMinutos(rep.horaInicio, rep.horaFin),
      'Estado': rep.eliminado ? 'Eliminada' : (rep.estado || ''),
      'Fecha registro': formatearFecha(rep.fechaRegistro),
      'Última actualización': formatearFecha(rep.fechaActualizacion)
    }));
    descargarExcel(nombre, filas, 'ReporteFallas');
  }

  function crearCelda(texto) {
    const td = document.createElement('td');
    td.textContent = texto ?? '';
    return td;
  }

  function estaEliminado(rep) {
    return rep?.eliminado === true || String(rep?.eliminado).toLowerCase() === 'true' || rep?.estado === 'Eliminada';
  }

  return {
    $,
    limpiarTexto,
    normalizarTexto,
    formatearFecha,
    fechaISOActual,
    calcularMinutos,
    calcularTiempoTexto,
    llenarSelect,
    mostrarMensaje,
    crearBadge,
    setLoading,
    exportarReportes,
    crearCelda,
    estaEliminado
  };
})();
