// Utilidades para la generación de Historia Clínica (HC)

/**
 * Devuelve una lista fija de lesiones enumeradas, alineadas para impresión.
 *
 * Nota: Este bloque está pensado para NO cambiar (según requerimiento).
 */
export const buildLesionesEnumeradasFijas = (): string => {
  const zonasFijas = [
    'CERVICAL',
    'HOMBRO IZQUIERDO',
    'HOMBRO DERECHO',
    'MUÑECA IZQUIERDA',
    'MUÑECA DERECHA',
    'RODILLA IZQUIERDA',
    'RODILLA DERECHA',
    'TOBILLO IZQUIERDO',
    'TOBILLO DERECHO',
    'LUMBAR',
  ];

  // Formatear lesiones reservando 20 caracteres para el texto y luego dos tabs antes de la casilla
  const checkBox = '☐';

  const formatLesion = (index: number, texto: string) => {
    const numero = `${index + 1}. `; // "1. ", "2. ", etc.
    const baseText = (numero + texto).padEnd(20, ' ');
    // Dos tabs después del bloque de 20 caracteres para alinear la casilla
    return `${baseText}\t\t${checkBox}`;
  };

  const lesionesEnumeradasFijas = zonasFijas.map((zona, idx) => formatLesion(idx, zona)).join('\n');

  return lesionesEnumeradasFijas;
};

