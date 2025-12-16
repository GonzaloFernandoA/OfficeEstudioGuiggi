// Fix: Removed self-import from './types' which was causing declaration conflicts.


export interface Lesiones {
  centroMedico1: string;
  centroMedico2: string;
  modoTraslado: string;
  fueOperado: string;
  estuvoInternado: string;
  zonasAfectadas: string[];
  otrasZonasAfectadas: string;
  zonasRadiografias: string[];
  otrasZonasRadiografias: string;
  tipoLesion: string[];
}

export interface Person {
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string;
  estadoCivil: string;
  nombrePadre: string;
  nombreMadre: string;
  nombreConyuge: string;
  domicilio: string;
  localidad: string;
  telefono: string;
  ocupacion: string;
  sueldo: string;
  lugarTrabajo: string;
  art: string;
  vivienda: string;
  composicionFamiliar: string;
  hijosACargo: string;
  mail: string;
  ig: string;
  poseeRegistro: string;
  vigenciaRegistro: string;
  categoriasRegistro: string;
  rolAccidente: string;
  lesiones: Lesiones;
}

export interface Vehiculo {
  vehiculo: string;
  dominio: string;
  companiaSeguros: string;
  sumaAsegurada: string;
  franquicia: string;
  numeroPoliza: string;
  color: string;
}

export interface TitularRegistral {
  nombre: string;
  dni: string;
  domicilio: string;
  localidad: string;
  fechaNacimiento: string;
  estadoCivil: string;
  nombrePadre: string;
  nombreMadre: string;
  nombreConyuge: string;
}

export interface DemandadoPersona {
  nombreApellido: string;
  dni: string;
  telefono: string;
  domicilio: string;
  localidad: string;
  partido: string;
  fuenteDato: string;
  fuenteDatoOtro: string;
}

export interface DemandadosState {
  conductor: DemandadoPersona;
  titular: DemandadoPersona;
  asegurado: DemandadoPersona;
  companiaSeguros: {
    nombre: string;
    numeroPoliza: string;
    numeroSiniestro: string;
  };
  vehiculo: {
    marcaModelo: string;
    dominio: string;
    color: string;
  };
  danosMateriales: {
    zonas: string[];
    otro: string;
  };
}

export interface Testigo {
    nombreApellido: string;
    dni: string;
    domicilio: string;
    rol: string;
}

export interface FormDataState {
  id?: number;
  cliente: Person & { recomienda: string };
  vehiculoCliente: Vehiculo;
  titularCliente: TitularRegistral;
  coActor1: Person;
  siniestro: {
    lugarHecho: string;
    fechaHecho: string;
    horaHecho: string;
    calles: string;
    localidad: string;
    partido: string;
    condicionesClimaticas: string;
    rolProtagonistas: string;
    mecanicaAccidente: string;
    otraMecanica: string;
    narracionHechos: string;
    actuacionesPenales: string;
    comisaria: string;
    causaPenal: string;
  };
  demandados: DemandadosState;
  tercerVehiculoDemandado?: DemandadosState;
  danosMateriales: {
    zonas: string[];
    otro: string;
  };
  testigos: {
    testigo1: Testigo;
    testigo2: Testigo;
  };
  clasificacionFinal: {
    areaPolicial: string;
    lesiones: string;
    reclamo: string;
  };
}