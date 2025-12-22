import type { GeographicConfig } from '../types';

/**
 * Configuración geográfica por defecto
 * Puede ser reemplazada dinámicamente con datos desde una API o BD
 */
export const DEFAULT_GEOGRAPHIC_CONFIG: GeographicConfig = {
  provincias: [
    { id: 'ba', nombre: 'Buenos Aires', codigo: 'BA' },
    { id: 'caba', nombre: 'Ciudad Autónoma de Buenos Aires', codigo: 'CABA' },
    { id: 'catamarca', nombre: 'Catamarca', codigo: 'CA' },
    { id: 'chaco', nombre: 'Chaco', codigo: 'CH' },
    { id: 'chubut', nombre: 'Chubut', codigo: 'CT' },
    { id: 'cordoba', nombre: 'Córdoba', codigo: 'CO' },
    { id: 'corrientes', nombre: 'Corrientes', codigo: 'CR' },
    { id: 'entrerios', nombre: 'Entre Ríos', codigo: 'ER' },
    { id: 'formosa', nombre: 'Formosa', codigo: 'FO' },
    { id: 'jujuy', nombre: 'Jujuy', codigo: 'JU' },
    { id: 'lapampa', nombre: 'La Pampa', codigo: 'LP' },
    { id: 'larioja', nombre: 'La Rioja', codigo: 'LR' },
    { id: 'mendoza', nombre: 'Mendoza', codigo: 'MD' },
    { id: 'misiones', nombre: 'Misiones', codigo: 'MI' },
    { id: 'neuquen', nombre: 'Neuquén', codigo: 'NQ' },
    { id: 'rionegro', nombre: 'Río Negro', codigo: 'RN' },
    { id: 'salta', nombre: 'Salta', codigo: 'SA' },
    { id: 'sanjuan', nombre: 'San Juan', codigo: 'SJ' },
    { id: 'sanluislapampa', nombre: 'San Luis', codigo: 'SL' },
    { id: 'santacruz', nombre: 'Santa Cruz', codigo: 'SC' },
    { id: 'santafe', nombre: 'Santa Fe', codigo: 'SF' },
    { id: 'santiago', nombre: 'Santiago del Estero', codigo: 'SE' },
    { id: 'tierrafuego', nombre: 'Tierra del Fuego', codigo: 'TF' },
    { id: 'tucuman', nombre: 'Tucumán', codigo: 'TM' },
  ],
  localidades: [
    // Buenos Aires
    { id: 'la-plata', nombre: 'La Plata', provincia: 'ba' },
    { id: 'mar-del-plata', nombre: 'Mar del Plata', provincia: 'ba' },
    { id: 'la-matanza', nombre: 'La Matanza', provincia: 'ba' },
    { id: 'quilmes', nombre: 'Quilmes', provincia: 'ba' },
    // CABA
    { id: 'caba-flores', nombre: 'Flores', provincia: 'caba' },
    { id: 'caba-caballito', nombre: 'Caballito', provincia: 'caba' },
    { id: 'caba-recoleta', nombre: 'Recoleta', provincia: 'caba' },
    { id: 'caba-palermo', nombre: 'Palermo', provincia: 'caba' },
    { id: 'caba-santelmo', nombre: 'San Telmo', provincia: 'caba' },
    // Córdoba
    { id: 'cordoba-ciudad', nombre: 'Córdoba (Ciudad)', provincia: 'cordoba' },
    { id: 'rio-cuarto', nombre: 'Río Cuarto', provincia: 'cordoba' },
    // Santa Fe
    { id: 'santa-fe-ciudad', nombre: 'Santa Fe (Ciudad)', provincia: 'santafe' },
    { id: 'rosario', nombre: 'Rosario', provincia: 'santafe' },
  ],
};