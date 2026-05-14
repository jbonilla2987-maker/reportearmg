(() => {
  const CONFIG = window.RMG_CONFIG;
  const U = window.RMGUtils;
  const API = window.RMGApi;

  let reportes = [];
  let reportesFiltrados = [];
  let fallasActivas = {};
  let contadorFallas = 0;
  let cargandoDatos = false;

  const els = {
    contenedor: U.$('contenedorFallas'),
    operador: U.$('operadorGeneral'),
    btnAgregar: U.$('btnAgregarFalla'),
    btnExportar: U.$('btnExportar'),
    btnLimpiarOperador: U.$('btnLimpiarOperador'),
    btnActualizarResumen: U.$('btnActualizarResumen'),
    resumenRmg: U.$('resumenRmg'),
    statTotal: U.$('statTotal'),
    statAbiertas: U.$('statAbiertas'),
    statCerradas: U.$('statCerradas'),
    statActualizacion: U.$('statActualizacion')
  };

  function inicializarListas() {
    U.llenarSelect(els.operador, CONFIG.operadores, 'Seleccione operador');
    cargarOperadorActual();
  }

  function guardarOperadorActual() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.operador, els.operador.value || '');
  }

  function cargarOperadorActual() {
    const operadorGuardado = localStorage.getItem(CONFIG.STORAGE_KEYS.operador) || '';
    if (operadorGuardado && ![...els.operador.options].some(opt => opt.value === operadorGuardado)) {
      const opcion = document.createElement('option');
      opcion.value = operadorGuardado;
      opcion.textContent = operadorGuardado;
      els.operador.appendChild(opcion);
    }
    els.operador.value = operadorGuardado;
  }

  function limpiarOperadorActual() {
    els.operador.value = '';
    localStorage.removeItem(CONFIG.STORAGE_KEYS.operador);
    U.mostrarMensaje('Operador limpiado. Selecciona el nuevo operador activo.', 'info');
  }

  function crearSelect(campo, lista, id, placeholder = 'Seleccione') {
    const select = document.createElement('select');
    select.id = `${campo}${id}`;
    U.llenarSelect(select, lista, placeholder);
    return select;
  }

  function crearCampoSelect(label, campo, lista, id, placeholder) {
    const div = document.createElement('div');
    div.className = 'field';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    div.appendChild(lab);
    div.appendChild(crearSelect(campo, lista, id, placeholder));
    return div;
  }

  function crearCampoTexto(label, campo, id, placeholder = '', tipo = 'text') {
    const div = document.createElement('div');
    div.className = 'field';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    const input = document.createElement('input');
    input.type = tipo;
    input.id = `${campo}${id}`;
    input.placeholder = placeholder;
    div.appendChild(lab);
    div.appendChild(input);
    return div;
  }

  function crearCampoTextarea(label, campo, id, placeholder = '') {
    const div = document.createElement('div');
    div.className = 'field full';
    const lab = document.createElement('label');
    lab.setAttribute('for', `${campo}${id}`);
    lab.textContent = label;
    const textarea = document.createElement('textarea');
    textarea.id = `${campo}${id}`;
    textarea.placeholder = placeholder;
    div.appendChild(lab);
    div.appendChild(textarea);
    return div;
  }

  function crearStatusBox(label, campo, id, texto = 'Pendiente') {
    const box = document.createElement('div');
    box.className = 'status-box';
    const lbl = document.createElement('div');
    lbl.className = 'status-label';
    lbl.textContent = label;
    const value = document.createElement('div');
    value.className = 'status-value';
    value.id = `${campo}${id}`;
    value.textContent = texto;
    box.append(lbl, value);
    return box;
  }

  function crearBoton(texto, clase, handler) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = texto;
    btn.className = clase;
    btn.addEventListener('click', handler);
    return btn;
  }

  function agregarFalla() {
    contadorFallas += 1;
    const id = contadorFallas;

    fallasActivas[id] = {
      horaInicio: null,
      horaFin: null,
      reporteId: null,
      numeroFallaOriginal: null
    };

    const card = document.createElement('article');
    card.className = 'falla-box';
    card.id = `card${id}`;

    const head = document.createElement('div');
    head.className = 'falla-head';
    const titleWrap = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = `Nueva falla ${id}`;
    const mode = document.createElement('div');
    mode.className = 'card-mode';
    mode.id = `modo${id}`;
    mode.textContent = 'Nuevo reporte';
    titleWrap.append(h3, mode);
    const btnQuitar = crearBoton('Quitar', 'btn-remove-card', () => eliminarCardFalla(id));
    head.append(titleWrap, btnQuitar);

    const topButtons = document.createElement('div');
    topButtons.className = 'buttons buttons-top';
    topButtons.append(
      crearBoton('Iniciar', 'btn btn-success', () => iniciarFalla(id)),
      crearBoton('Finalizar', 'btn btn-danger', () => finalizarFalla(id))
    );

    const grid = document.createElement('div');
    grid.className = 'form-grid';
    grid.append(
      crearCampoSelect('Grúa', 'rmg', CONFIG.rmgs, id),
      crearCampoSelect('Turno', 'turno', CONFIG.turnos, id),
      crearCampoSelect('Área / Ubicación', 'area', CONFIG.areas, id),
      crearCampoSelect('Modo de operación', 'modoOperacion', CONFIG.modosOperacion, id),
      crearCampoSelect('Tipo de falla', 'tipoFalla', CONFIG.tiposFalla, id)
    );

    const statusGrid = document.createElement('div');
    statusGrid.className = 'status-grid';
    statusGrid.append(
      crearStatusBox('Hora de inicio', 'inicio', id, 'No iniciada'),
      crearStatusBox('Hora de finalización', 'fin', id, 'No finalizada'),
      crearStatusBox('Tiempo total', 'tiempo', id, 'Pendiente'),
      crearStatusBox('Estado', 'estado', id, 'Sin iniciar')
    );

    const desc = crearCampoTextarea('Descripción de la falla', 'descripcion', id, 'Describa la falla presentada');
    const accion = crearCampoTextarea('Acción tomada', 'accionTomada', id, 'Indique la acción realizada o pendiente');
    const cierre = crearCampoTextarea('Observación de cierre', 'observacionCierre', id, 'Comentario final al cerrar la falla');

    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    const btnGuardar = crearBoton('Guardar', 'btn btn-primary', () => guardarReporte(id));
    btnGuardar.id = `btnGuardar${id}`;
    buttons.append(btnGuardar, crearBoton('Limpiar', 'btn btn-light', () => limpiarFalla(id)));

    card.append(head, topButtons, grid, statusGrid, desc, accion, cierre, buttons);
    els.contenedor.appendChild(card);
    actualizarVistaFalla(id);
    return id;
  }

  function tieneDatosEnCard(id) {
    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    const falla = fallasActivas[id] || {};
    return campos.some(campo => U.$(`${campo}${id}`)?.value?.trim()) || falla.horaInicio || falla.horaFin || falla.reporteId;
  }

  function eliminarCardFalla(id) {
    if (tieneDatosEnCard(id) && !confirm(`¿Deseas quitar la tarjeta de Falla ${id}? Los datos no guardados se perderán.`)) {
      return;
    }
    delete fallasActivas[id];
    U.$(`card${id}`)?.remove();
    U.mostrarMensaje(`Se quitó la tarjeta de Falla ${id}.`, 'info');
  }

  function iniciarFalla(id) {
    const falla = fallasActivas[id];
    if (!falla) return;
    falla.horaInicio = U.fechaISOActual();
    falla.horaFin = null;
    actualizarVistaFalla(id);
    U.mostrarMensaje(`Hora de inicio registrada para la Falla ${id}.`, 'success');
  }

  function finalizarFalla(id) {
    const falla = fallasActivas[id];
    if (!falla?.horaInicio) {
      U.mostrarMensaje(`Primero debes iniciar la Falla ${id}.`, 'error');
      return;
    }
    falla.horaFin = U.fechaISOActual();
    actualizarVistaFalla(id);
    U.mostrarMensaje(`Hora de finalización registrada para la Falla ${id}.`, 'success');
  }

  function actualizarVistaFalla(id) {
    const falla = fallasActivas[id];
    if (!falla) return;

    const estado = !falla.horaInicio ? 'Sin iniciar' : (falla.horaFin ? 'Cerrada' : 'Abierta');
    U.$(`inicio${id}`).textContent = falla.horaInicio ? U.formatearFecha(falla.horaInicio) : 'No iniciada';
    U.$(`fin${id}`).textContent = falla.horaFin ? U.formatearFecha(falla.horaFin) : 'No finalizada';
    U.$(`tiempo${id}`).textContent = U.calcularTiempoTexto(falla.horaInicio, falla.horaFin);
    U.$(`estado${id}`).textContent = estado;
    U.$(`modo${id}`).textContent = falla.reporteId ? `Editando ${falla.numeroFallaOriginal || 'reporte'}` : 'Nuevo reporte';
    U.$(`btnGuardar${id}`).textContent = falla.reporteId ? 'Actualizar reporte' : 'Guardar';
  }

  function leerReporteDesdeCard(id) {
    const falla = fallasActivas[id];
    const horaInicio = falla?.horaInicio || null;
    const horaFin = falla?.horaFin || null;
    const operador = U.normalizarTexto(els.operador.value);
    const estado = horaFin ? 'Cerrada' : 'Abierta';

    return {
      id: falla?.reporteId || '',
      numeroFalla: falla?.numeroFallaOriginal || '',
      operador,
      rmg: U.$(`rmg${id}`).value,
      turno: U.$(`turno${id}`).value,
      area: U.$(`area${id}`).value,
      posicion: '',
      modoOperacion: U.$(`modoOperacion${id}`).value,
      severidad: '',
      tipoFalla: U.$(`tipoFalla${id}`).value,
      responsable: '',
      descripcion: U.normalizarTexto(U.$(`descripcion${id}`).value),
      accionTomada: U.normalizarTexto(U.$(`accionTomada${id}`).value),
      observacionCierre: U.normalizarTexto(U.$(`observacionCierre${id}`).value),
      horaInicio,
      horaFin,
      tiempoTotalMinutos: U.calcularMinutos(horaInicio, horaFin),
      tiempoTexto: U.calcularTiempoTexto(horaInicio, horaFin),
      estado,
      fechaRegistro: falla?.fechaRegistro || U.fechaISOActual(),
      fechaActualizacion: U.fechaISOActual(),
      creadoPor: operador,
      actualizadoPor: operador,
      eliminado: false
    };
  }

  function validarReporte(reporte, id) {
    const faltantes = [];
    if (!reporte.operador) faltantes.push('operador');
    if (!reporte.rmg) faltantes.push('grúa');
    if (!reporte.turno) faltantes.push('turno');
    if (!reporte.area) faltantes.push('área');
    if (!reporte.modoOperacion) faltantes.push('modo de operación');
    if (!reporte.tipoFalla) faltantes.push('tipo de falla');
    if (!reporte.descripcion) faltantes.push('descripción');
    if (!reporte.horaInicio) faltantes.push('hora de inicio');

    if (faltantes.length > 0) {
      U.mostrarMensaje(`Falla ${id}: completa ${faltantes.join(', ')}.`, 'error');
      return false;
    }
    return true;
  }

  async function guardarReporte(id) {
    const reporte = leerReporteDesdeCard(id);
    if (!validarReporte(reporte, id)) return;

    const boton = U.$(`btnGuardar${id}`);
    U.setLoading(boton, true, 'Guardando...');

    try {
      if (fallasActivas[id]?.reporteId) {
        await API.actualizar(reporte);
        U.mostrarMensaje(`Reporte ${reporte.numeroFalla || ''} actualizado correctamente.`, 'success');
      } else {
        const respuesta = await API.guardar(reporte);
        const guardado = respuesta.reporte || reporte;
        fallasActivas[id].reporteId = guardado.id || reporte.id;
        fallasActivas[id].numeroFallaOriginal = guardado.numeroFalla || reporte.numeroFalla;
        U.mostrarMensaje(`Reporte ${guardado.numeroFalla || `Falla ${id}`} guardado correctamente.`, 'success');
      }

      guardarOperadorActual();
      await cargarReportesDesdeServidor(false);
      limpiarFalla(id, false);
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      U.setLoading(boton, false);
    }
  }

  function limpiarFalla(id, aviso = true) {
    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    campos.forEach(campo => {
      const el = U.$(`${campo}${id}`);
      if (el) el.value = '';
    });

    fallasActivas[id] = {
      horaInicio: null,
      horaFin: null,
      reporteId: null,
      numeroFallaOriginal: null
    };
    actualizarVistaFalla(id);
    if (aviso) U.mostrarMensaje(`Falla ${id} limpiada.`, 'info');
  }

  function actualizarIndicadores() {
    const activos = reportes.filter(rep => !U.estaEliminado(rep));
    const abiertas = activos.filter(rep => rep.estado === 'Abierta');
    const cerradas = activos.filter(rep => rep.estado === 'Cerrada');
    els.statTotal.textContent = activos.length;
    els.statAbiertas.textContent = abiertas.length;
    els.statCerradas.textContent = cerradas.length;
    els.statActualizacion.textContent = new Date().toLocaleString('es-PA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    renderResumenRmg(abiertas);
  }

  function renderResumenRmg(abiertas) {
    if (!els.resumenRmg) return;
    els.resumenRmg.textContent = '';
    CONFIG.rmgs.forEach(rmg => {
      const cantidad = abiertas.filter(rep => rep.rmg === rmg).length;
      const pill = document.createElement('div');
      pill.className = `rmg-pill ${cantidad > 0 ? 'has-open' : ''}`;
      const nombre = document.createElement('strong');
      nombre.textContent = rmg;
      const valor = document.createElement('span');
      valor.textContent = `${cantidad} abierta${cantidad === 1 ? '' : 's'}`;
      pill.append(nombre, valor);
      els.resumenRmg.appendChild(pill);
    });
  }

  async function cargarReportesDesdeServidor(mostrarAviso = false) {
    if (cargandoDatos) return;
    cargandoDatos = true;
    try {
      reportes = await API.listar(true);
      reportes.sort((a, b) => new Date(b.horaInicio || b.fechaRegistro || 0) - new Date(a.horaInicio || a.fechaRegistro || 0));
      reportesFiltrados = reportes.filter(rep => !U.estaEliminado(rep));
      actualizarIndicadores();
      if (mostrarAviso) U.mostrarMensaje('Datos actualizados desde Google Sheets.', 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      cargandoDatos = false;
    }
  }

  function cargarReporteParaEditar() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.reporteSeleccionado);
    if (!raw) return;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.reporteSeleccionado);

    let reporte;
    try {
      reporte = JSON.parse(raw);
    } catch (error) {
      return;
    }

    let cardId = Object.keys(fallasActivas).find(key => !tieneDatosEnCard(key));
    if (!cardId) cardId = agregarFalla();
    cardId = Number(cardId);

    fallasActivas[cardId] = {
      horaInicio: reporte.horaInicio || null,
      horaFin: reporte.horaFin || null,
      reporteId: reporte.id,
      numeroFallaOriginal: reporte.numeroFalla,
      fechaRegistro: reporte.fechaRegistro
    };

    if (reporte.operador) {
      if (![...els.operador.options].some(opt => opt.value === reporte.operador)) {
        const opt = document.createElement('option');
        opt.value = reporte.operador;
        opt.textContent = reporte.operador;
        els.operador.appendChild(opt);
      }
      els.operador.value = reporte.operador;
      guardarOperadorActual();
    }

    const campos = ['rmg', 'turno', 'area', 'modoOperacion', 'tipoFalla', 'descripcion', 'accionTomada', 'observacionCierre'];
    campos.forEach(campo => {
      const el = U.$(`${campo}${cardId}`);
      if (el) el.value = reporte[campo] || '';
    });

    actualizarVistaFalla(cardId);
    U.$(`card${cardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    U.mostrarMensaje(`Reporte ${reporte.numeroFalla || ''} cargado para revisión o actualización.`, 'success');
  }

  function exportar() {
    const activos = reportesFiltrados.filter(rep => !U.estaEliminado(rep));
    if (activos.length === 0) {
      U.mostrarMensaje('No hay reportes activos para exportar.', 'error');
      return;
    }
    U.exportarReportes(activos, 'reporte_fallas_rmg_3.1.xlsx');
    localStorage.setItem(CONFIG.STORAGE_KEYS.ultimaExportacion, U.fechaISOActual());
    U.mostrarMensaje('Archivo Excel exportado correctamente.', 'success');
  }

  async function iniciar() {
    inicializarListas();
    els.operador.addEventListener('change', guardarOperadorActual);
    els.btnLimpiarOperador.addEventListener('click', limpiarOperadorActual);
    els.btnAgregar.addEventListener('click', agregarFalla);
    els.btnExportar.addEventListener('click', exportar);
    els.btnActualizarResumen.addEventListener('click', () => cargarReportesDesdeServidor(true));

    agregarFalla();
    agregarFalla();
    agregarFalla();
    await cargarReportesDesdeServidor(false);
    cargarReporteParaEditar();

    setInterval(() => cargarReportesDesdeServidor(false), CONFIG.REFRESH_MS);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
