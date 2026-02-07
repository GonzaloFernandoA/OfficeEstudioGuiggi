import * as XLSX from 'xlsx';
import { apiClient } from './apiClient';
export const exportCasoToExcel = async (dni: string): Promise<void> => {
  if (!dni) {
    alert('No se pudo obtener el DNI del caso para exportar.');
    return;
  }

  try {
    const endpoint = `/caso/${encodeURIComponent(dni)}`;
    const response = await apiClient.get<any>(endpoint);

    if ((response as any).error) {
      throw new Error((response as any).error);
    }

    const data = (response as any).data ?? response;

    // Aplanar el objeto
    const flatData: Record<string, any> = {};
    const flattenObject = (obj: any, prefix = '') => {
      if (obj == null) return;
      Object.keys(obj).forEach(key => {
        const value = (obj as any)[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, fullKey);
        } else {
          flatData[fullKey] = Array.isArray(value) ? JSON.stringify(value) : (value ?? '');
        }
      });
    };

    flattenObject(data);

    // Convertir a formato de filas para Excel
    const rows = Object.entries(flatData).map(([key, value]) => ({
      Campo: key,
      Valor: value
    }));

    // Crear workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Caso');

    // Descargar
    XLSX.writeFile(wb, `caso_${dni}.xlsx`);
  } catch (err) {
    console.error('Error exportando caso a Excel:', err);
    const msg = err instanceof Error ? err.message : 'Error desconocido al exportar';
    alert(`Error al exportar el caso: ${msg}`);
  }
};