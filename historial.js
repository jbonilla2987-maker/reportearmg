(() => {
  const CONFIG = window.RMG_CONFIG;
  const U = window.RMGUtils;
  const API = window.RMGApi;

  let reportes = [];
  let reportesFiltrados = [];
  let cargandoDatos = false;

  const els = {
    tabla: U.$('tablaReportes'),
    btnActualizar: U.$('btnActualizar'),
    btnExportar: U.$('btnExportar'),
    btnLimpiarFiltros: U.$('btnLimpiarFiltros'),
    contadorFiltrado: U.$('contadorFiltrado'),
    fechaDesde: U.$('filtroFechaDesde'),
    fechaHasta: U.$('filtroFechaHasta'),
    rmg: U.$('filtroRmg'),
    turno: U.$('filtroTurno'),
    estado: U.$('filtroEstado'),
    busqueda: U.$('busqueda'),
    statTotal: U.$('statTotal'),
    statAbiertas: U.$('statAbiertas'),
    statCerradas: U.$('statCerradas'),
    statEliminadas: U.$('statEliminadas')
  };

  function inicializarFiltros() {
    U.llenarSelect(els.rmg, CONFIG.rmgs, 'Todos');
    U.llenarSelect(els.turno, CONFIG.turnos, 'Todos');

    [els.fechaDesde, els.fechaHasta, els.rmg, els.turno, els.estado, els.busqueda].forEach(el => {
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', aplicarFiltros);
    });
  }

  function actualizarIndicadores() {
    const activos = reportes.filter(rep => !U.estaEliminado(rep));
    const abiertas = activos.filter(rep => rep.estado === 'Abierta').length;
    const cerradas = activos.filter(rep => rep.estado === 'Cerrada').length;
    const eliminadas = reportes.filter(rep => U.estaEliminado(rep)).length;

    els.statTotal.textContent = activos.length;
    els.statAbiertas.textContent = abiertas;
    els.statCerradas.textContent = cerradas;
    els.statEliminadas.textContent = eliminadas;
  }

  async function cargarReportesDesdeServidor(mostrarAviso = false) {
    if (cargandoDatos) return;
    cargandoDatos = true;
    U.setLoading(els.btnActualizar, true, 'Actualizando...');
    try {
      reportes = await API.listar(true);
      reportes.sort((a, b) => new Date(b.horaInicio || b.fechaRegistro || 0) - new Date(a.horaInicio || a.fechaRegistro || 0));
      actualizarIndicadores();
      aplicarFiltros();
      if (mostrarAviso) U.mostrarMensaje('Datos actualizados correctamente.', 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    } finally {
      cargandoDatos = false;
      U.setLoading(els.btnActualizar, false);
    }
  }

  function dentroDeFechas(rep) {
    const fechaBase = rep.horaInicio || rep.fechaRegistro;
    if (!fechaBase) return true;
    const fecha = new Date(fechaBase);
    if (Number.isNaN(fecha.getTime())) return true;

    if (els.fechaDesde.value) {
      const desde = new Date(`${els.fechaDesde.value}T00:00:00`);
      if (fecha < desde) return false;
    }

    if (els.fechaHasta.value) {
      const hasta = new Date(`${els.fechaHasta.value}T23:59:59`);
      if (fecha > hasta) return false;
    }

    return true;
  }

  function aplicarFiltros() {
    const rmg = els.rmg.value;
    const turno = els.turno.value;
    const estado = els.estado.value;
    const texto = els.busqueda.value.trim().toLowerCase();

    reportesFiltrados = reportes.filter(rep => {
      const estadoReal = U.estaEliminado(rep) ? 'Eliminada' : (rep.estado || 'Abierta');
      const coincideRmg = !rmg || rep.rmg === rmg;
      const coincideTurno = !turno || rep.turno === turno;
      const coincideEstado = !estado || estadoReal === estado;
      const coincideFecha = dentroDeFechas(rep);
      const bloqueTexto = [
        rep.numeroFalla,
        rep.operador,
        rep.rmg,
        rep.turno,
        rep.area,
        rep.tipoFalla,
        rep.descripcion,
        rep.accionTomada,
        rep.observacionCierre
      ].join(' ').toLowerCase();
      const coincideTexto = !texto || bloqueTexto.includes(texto);

      return coincideRmg && coincideTurno && coincideEstado && coincideFecha && coincideTexto;
    });

    renderTabla(reportesFiltrados);
  }

  function renderTabla(lista) {
    els.tabla.textContent = '';
    els.contadorFiltrado.textContent = `${lista.length} reporte${lista.length === 1 ? '' : 's'} encontrado${lista.length === 1 ? '' : 's'}`;

    if (lista.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 13;
      td.className = 'empty-cell';
      td.textContent = 'No hay reportes para mostrar con los filtros seleccionados.';
      tr.appendChild(td);
      els.tabla.appendChild(tr);
      return;
    }

    lista.forEach(rep => {
      const tr = document.createElement('tr');
      if (U.estaEliminado(rep)) tr.classList.add('row-deleted');

      tr.append(
        U.crearCelda(rep.numeroFalla || ''),
        U.crearCelda(rep.rmg || ''),
        U.crearCelda(rep.operador || ''),
        U.crearCelda(rep.turno || ''),
        U.crearCelda(rep.area || ''),
        U.crearCelda(rep.tipoFalla || ''),
        U.crearCelda(U.formatearFecha(rep.horaInicio)),
        U.crearCelda(U.formatearFecha(rep.horaFin)),
        U.crearCelda(rep.tiempoTexto || U.calcularTiempoTexto(rep.horaInicio, rep.horaFin))
      );

      const tdEstado = document.createElement('td');
      tdEstado.appendChild(U.crearBadge(rep.estado, U.estaEliminado(rep)));
      tr.appendChild(tdEstado);

      tr.append(
        U.crearCelda(rep.descripcion || ''),
        U.crearCelda(rep.accionTomada || '')
      );

      const acciones = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'table-actions';

      if (!U.estaEliminado(rep)) {
        const btnEditar = crearAccion('Editar', 'btn-edit', () => editarReporte(rep));
        wrap.appendChild(btnEditar);

        if (rep.estado !== 'Cerrada') {
          const btnCerrar = crearAccion('Cerrar', 'btn-close-report', () => cerrarReporte(rep));
          wrap.appendChild(btnCerrar);
        }

        const btnEliminar = crearAccion('Eliminar', 'btn-delete', () => eliminarReporte(rep));
        wrap.appendChild(btnEliminar);
      } else {
        const btnRestaurar = crearAccion('Restaurar', 'btn-edit', () => restaurarReporte(rep));
        wrap.appendChild(btnRestaurar);
      }

      acciones.appendChild(wrap);
      tr.appendChild(acciones);
      els.tabla.appendChild(tr);
    });
  }

  function crearAccion(texto, clase, handler) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = clase;
    btn.textContent = texto;
    btn.addEventListener('click', handler);
    return btn;
  }

  function editarReporte(rep) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.reporteSeleccionado, JSON.stringify(rep));
    window.location.href = 'index.html';
  }

  async function cerrarReporte(rep) {
    if (!confirm(`¿Deseas cerrar el reporte ${rep.numeroFalla || ''}?`)) return;
    try {
      await API.cerrar(rep.id, localStorage.getItem(CONFIG.STORAGE_KEYS.operador) || rep.operador || '');
      await cargarReportesDesdeServidor(false);
      U.mostrarMensaje(`Reporte ${rep.numeroFalla || ''} cerrado correctamente.`, 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    }
  }

  async function eliminarReporte(rep) {
    const clave = prompt('Ingrese la contraseña de administrador para marcar este reporte como eliminado:');
    if (clave === null) {
      U.mostrarMensaje('Eliminación cancelada.', 'info');
      return;
    }
    if (!confirm(`¿Confirmas marcar como eliminado el reporte ${rep.numeroFalla || ''}?`)) return;

    try {
      await API.eliminar(rep.id, clave, localStorage.getItem(CONFIG.STORAGE_KEYS.operador) || rep.operador || '');
      await cargarReportesDesdeServidor(false);
      U.mostrarMensaje('Reporte marcado como eliminado. Queda disponible en auditoría.', 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    }
  }

  async function restaurarReporte(rep) {
    const clave = prompt('Ingrese la contraseña de administrador para restaurar este reporte:');
    if (clave === null) return;
    try {
      await API.restaurar(rep.id, clave, localStorage.getItem(CONFIG.STORAGE_KEYS.operador) || rep.operador || '');
      await cargarReportesDesdeServidor(false);
      U.mostrarMensaje('Reporte restaurado correctamente.', 'success');
    } catch (error) {
      U.mostrarMensaje(error.message, 'error');
    }
  }

  function limpiarFiltros() {
    els.fechaDesde.value = '';
    els.fechaHasta.value = '';
    els.rmg.value = '';
    els.turno.value = '';
    els.estado.value = '';
    els.busqueda.value = '';
    aplicarFiltros();
  }

  function exportar() {
    if (reportesFiltrados.length === 0) {
      U.mostrarMensaje('No hay datos filtrados para exportar.', 'error');
      return;
    }
    U.exportarReportes(reportesFiltrados, 'historial_rmg_filtrado_3.1.xlsx');
    localStorage.setItem(CONFIG.STORAGE_KEYS.ultimaExportacion, U.fechaISOActual());
    U.mostrarMensaje('Historial filtrado exportado correctamente.', 'success');
  }

  async function iniciar() {
    inicializarFiltros();
    els.btnActualizar.addEventListener('click', () => cargarReportesDesdeServidor(true));
    els.btnExportar.addEventListener('click', exportar);
    els.btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    await cargarReportesDesdeServidor(false);
    setInterval(() => cargarReportesDesdeServidor(false), CONFIG.REFRESH_MS);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
