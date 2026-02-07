import type { Localidad, Provincia, GeographicConfig } from '../types';

/**
 * Servicio para manejar la configuración de Localidades y Provincias
 * Permite cargar datos desde código estático o dinámicamente desde una API/BD
 */

class GeographicService {
  private config: GeographicConfig = {
    provincias: [],
    localidades: [],
    };

  // Cache de la promesa para evitar múltiples llamadas simultáneas
  private initializationPromise: Promise<void> | null = null;

  /**
   * Inicializa con configuración estática
   */
  initializeStatic(config: GeographicConfig): void {
    this.config = config;
    console.log('✅ Configuración geográfica cargada (estática)');
    }

    async loadProvincias(apiUrl: string): Promise<Provincia[]> {
        // 1. Si ya tenemos datos en memoria (RAM), devolverlos
        if (this.config.provincias.length > 0) {
            return this.config.provincias;
        }

        // 2. Si ya hay una carga en proceso, devolver esa promesa
        if (this.initializationPromise) {
            await this.initializationPromise;
            return this.config.provincias;
        }

        // 3. Iniciar proceso de carga
        this.initializationPromise = (async () => {
            try {
                // A. Revisar LocalStorage
                const localData = localStorage.getItem('provincias_cache');

                if (localData) {
                    console.log('📦 Cargando provincias desde LocalStorage');
                    this.config.provincias = JSON.parse(localData);
                } else {
                    // B. Si no hay cache, ir a la API
                    console.log('🌐 Fetching provincias desde API...');
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`Error ${response.status}`);

                    const data = await response.json();

                    // Mapeo seguro de la estructura de tu API (records -> fields -> id/name)
                    let provinciasMapeadas: Provincia[] = [];

                    if (data && Array.isArray(data.records)) {
                        provinciasMapeadas = data.records.map((r: any) => {
                            // Lógica para obtener nombre e id robusta
                            const nombre = r.fields?.nombre || r.fields?.Name || r.name || 'Sin Nombre';
                            const id = r.id || String(nombre).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            return { id, nombre };
                        });
                    } else if (Array.isArray(data)) {
                        provinciasMapeadas = data;
                    }

                    // Guardar en RAM
                    this.config.provincias = provinciasMapeadas;

                    // Guardar en LocalStorage para el futuro (F5)
                    localStorage.setItem('provincias_cache', JSON.stringify(provinciasMapeadas));
                }
            } catch (error) {
                console.error('❌ Error en loadProvincias:', error);
                throw error;
            } finally {
                this.initializationPromise = null; // Liberar promesa
            }
        })();

        await this.initializationPromise;
        return this.config.provincias;
    }

  /**
   * Carga dinámicamente desde una API
   */
  async initializeFromAPI(apiUrl: string): Promise<void> {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();

      if (data && Array.isArray(data.records)) {
        const provincias = data.records.map((r: any) => {
          const name = (r.fields && (r.fields.Name || r.fields.name)) || r.name || String(r.id || '');
          const id = String(r.id || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
          return { id, nombre: String(name) } as any;
        });
        this.config = { provincias, localidades: [] };
      }
      // Normalizar respuesta: la API puede devolver directamente un array de provincias
      // o un objeto { provincias: [...], localidades: [...] }
      else if (Array.isArray(data)) {
        this.config = { provincias: data, localidades: [] };
      } else if (data && typeof data === 'object') {
        this.config = {
          provincias: Array.isArray(data.provincias) ? data.provincias : [],
          localidades: Array.isArray(data.localidades) ? data.localidades : [],
        };
      } else {
        this.config = { provincias: [], localidades: [] };
      }
      console.log('✅ Configuración geográfica cargada desde API');
    } catch (error) {
      console.error('❌ Error cargando configuración desde API:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las provincias
   */
  getProvincias(): Provincia[] {
    return this.config.provincias;
  }

  /**
   * Obtiene todas las localidades
   */
  getLocalidades(): Localidad[] {
    return this.config.localidades;
  }

  /**
   * Obtiene localidades filtradas por provincia
   */
  getLocalidadesByProvincia(provinciaId: string): Localidad[] {
    return this.config.localidades.filter(l => l.provincia === provinciaId);
  }

  /**
   * Obtiene una provincia por ID
   */
  getProvinciaById(id: string): Provincia | undefined {
    return this.config.provincias.find(p => p.id === id);
  }

  /**
   * Obtiene una localidad por ID
   */
  getLocalidadById(id: string): Localidad | undefined {
    return this.config.localidades.find(l => l.id === id);
  }

  /**
   * Agrega una nueva provincia
   */
  addProvincia(provincia: Provincia): void {
    if (!this.config.provincias.find(p => p.id === provincia.id)) {
      this.config.provincias.push(provincia);
    }
  }

  /**
   * Agrega una nueva localidad
   */
  addLocalidad(localidad: Localidad): void {
    if (!this.config.localidades.find(l => l.id === localidad.id)) {
      this.config.localidades.push(localidad);
    }
  }

  /**
   * Actualiza provincia existente
   */
  updateProvincia(id: string, updates: Partial<Provincia>): void {
    const provincia = this.config.provincias.find(p => p.id === id);
    if (provincia) {
      Object.assign(provincia, updates);
    }
  }

  /**
   * Actualiza localidad existente
   */
  updateLocalidad(id: string, updates: Partial<Localidad>): void {
    const localidad = this.config.localidades.find(l => l.id === id);
    if (localidad) {
      Object.assign(localidad, updates);
    }
  }

  /**
   * Obtiene la configuración completa
   */
  getConfig(): GeographicConfig {
    return this.config;
    }

}

// Exportar instancia singleton
export const geographicService = new GeographicService();