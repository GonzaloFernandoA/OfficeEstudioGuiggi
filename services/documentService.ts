import type { FormDataState } from '../types';

const formatDate = (dateString: string): string => {
    if (!dateString) return 'FECHA NO ESPECIFICADA';
    // Assuming date is in YYYY-MM-DD format
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

export const generateConvenioDeHonorarios = (caseData: FormDataState): string => {
    const today = new Date();
    const city = "CIUDAD AUTÓNOMA DE BUENOS AIRES"; // You can make this dynamic if needed
    const currentDate = today.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const cliente = caseData.cliente;
    const coActor = caseData.coActor1.nombreCompleto ? caseData.coActor1 : null;
    const siniestro = caseData.siniestro;
    const demandadoConductor = caseData.demandados.conductor.nombreApellido || 'A DETERMINAR';
    const demandadoSeguro = caseData.demandados.companiaSeguros.nombre || 'A DETERMINAR';
    const vehiculoCliente = caseData.vehiculoCliente.dominio || 'NO ESPECIFICADO';

    let actoresText = `el Sr./Sra. ${cliente.nombreCompleto}, D.N.I. Nº ${cliente.dni}, con domicilio en la calle ${cliente.domicilio}, de la localidad de ${cliente.localidad}`;
    if (coActor) {
        actoresText += `, y el Sr./Sra. ${coActor.nombreCompleto}, D.N.I. Nº ${coActor.dni}, con domicilio en la calle ${coActor.domicilio}, de la localidad de ${coActor.localidad}`;
    }
    actoresText += ', en adelante "LA PARTE ACTORA"';


    const template = `
CONVENIO DE HONORARIOS

En la ciudad de ${city}, a los ${currentDate}, entre el Dr. [SU NOMBRE COMPLETO], Tº [TOMO] Fº [FOLIO] del C.P.A.C.F., C.U.I.T Nº [SU CUIT], Monotributista, con domicilio constituido en la calle [SU DIRECCIÓN], Ciudad Autónoma de Buenos Aires, en adelante “EL LETRADO”, y ${actoresText}, convienen celebrar el presente convenio de honorarios, sujeto a las siguientes cláusulas:

PRIMERA: LA PARTE ACTORA encomienda a EL LETRADO, y éste acepta, el inicio y la prosecución hasta su total terminación del reclamo extrajudicial y/o judicial por daños y perjuicios derivados del accidente de tránsito ocurrido con fecha ${formatDate(siniestro.fechaHecho)}, en el cual resultó/ron lesionado/s como consecuencia del accionar del conductor del vehículo [VEHICULO DEMANDADO], Sr./Sra. ${demandadoConductor}, y/o contra la compañía de seguros "${demandadoSeguro}" y/o contra quien en definitiva resulte civilmente responsable del siniestro de mención.

SEGUNDA: En concepto de honorarios por la gestión profesional descripta en la cláusula anterior, tanto en sede extrajudicial, mediación y/o judicial, LA PARTE ACTORA cede y transfiere a favor de EL LETRADO el VEINTE POR CIENTO (20%) del total de la suma que perciba en dicho proceso, ya sea a través de sentencia judicial, transacción, o cualquier otra forma de acuerdo que ponga fin al litigio. La base para el cálculo del porcentaje antes mencionado estará constituida por el capital de condena o transacción, con más sus intereses y costas.

TERCERA: Los honorarios aquí pactados serán percibidos por EL LETRADO en forma directa de las sumas que abone la parte demandada y/o citada en garantía, en el mismo momento en que LA PARTE ACTORA perciba su crédito. LA PARTE ACTORA presta expresa conformidad para que EL LETRADO practique la deducción de sus honorarios del monto a percibir, otorgando por el presente suficiente recibo y carta de pago por el porcentaje acordado.

CUARTA: En caso que la gestión profesional no obtuviera resultados favorables para LA PARTE ACTORA, es decir, si el reclamo fuera desestimado en su totalidad, EL LETRADO no tendrá derecho a percibir honorarios de ningún tipo, corriendo con los gastos y costas del proceso a su exclusivo cargo.

QUINTA: Si LA PARTE ACTORA decidiera revocar el patrocinio letrado conferido a EL LETRADO sin causa justificada, o bien arribara a un acuerdo transaccional sin la intervención de éste, deberá abonar a EL LETRADO el VEINTE POR CIENTO (20%) del monto reclamado en la demanda o del monto de la transacción, el que sea mayor, en concepto de honorarios por las tareas realizadas hasta ese momento.

SEXTA: Para todos los efectos legales derivados del presente convenio, las partes constituyen domicilios en los indicados en el encabezamiento, donde se tendrán por válidas todas las notificaciones, y se someten a la jurisdicción de los Tribunales Ordinarios de la Capital Federal, con renuncia a cualquier otro fuero o jurisdicción.

En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto, en el lugar y fecha arriba indicados.


_________________________
Firma de LA PARTE ACTORA
Aclaración: ${cliente.nombreCompleto}
DNI: ${cliente.dni}

${coActor ? `
_________________________
Firma de LA PARTE ACTORA
Aclaración: ${coActor.nombreCompleto}
DNI: ${coActor.dni}
` : ''}

_________________________
Firma de EL LETRADO
Aclaración: Dr. [SU NOMBRE COMPLETO]
Tº [TOMO] Fº [FOLIO] C.P.A.C.F.
`;

    return template.trim();
};
