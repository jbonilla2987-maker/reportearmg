/*
  Configuración general del sistema.
  - Cambia API_URL si publicas un nuevo Google Apps Script.
  - Los valores de listas se editan aquí y aplican a captura e historial.
*/
window.RMG_CONFIG = {
  version: '3.1',
  API_URL: 'https://script.google.com/macros/s/AKfycbzSMC3qjhgn3uPWA2ehIfwpKTSKvP0Z4oVZtNGPJ26PHiL2GU4PqFaXLaXe8HY6aL4Y/exec',
  REFRESH_MS: 45000,
  STORAGE_KEYS: {
    operador: 'reporteRmgOperadorActivo',
    reporteSeleccionado: 'reporteRmgSeleccionado',
    ultimaExportacion: 'reporteRmgUltimaExportacion'
  },
  rmgs: Array.from({ length: 12 }, (_, i) => `RMG ${i + 1}`),
  turnos: ['Día', 'Tarde', 'Noche'],
  operadores: [
    'GILBERTO HERNÁNDEZ',
    'MADELAINE GUZMÁN',
    'RONALDO ZUÑIGA',
    'RICARDO ORTEGA',
    'LISSETH VASQUEZ',
    'JUAN ROJAS',
    'SUSAN GARCIA',
    'MIRIAN VILLALAZ',
    'KEVIN BATISTA',
    'NATHALY CARDENAS',
    'CHELSEA CHIU',
    'JOSE BARRIOS',
    'THOMAS DEL BARRIO',
    'YOHALYS JIMENEZ'
  ],
  areas: ['Bloque 1', 'Bloque 2', 'Bloque 3', 'Bloque 4', 'Otro'],
  tiposFalla: ['Gantry', 'Hoist', 'Trolley', 'Spreader', 'Micromotion', 'CPS', 'RFID', 'LPS', 'Anti-Lift', 'Cabin Protection', 'Otros'],
  modosOperacion: ['Automático', 'Remoto', 'Manual', 'Mantenimiento'],
  severidades: ['Baja', 'Media', 'Alta', 'Crítica']
};
