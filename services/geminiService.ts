import { GoogleGenAI } from "@google/genai";
import type { FormDataState } from '../types';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove the data url prefix (e.g., "data:audio/webm;base64,")
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    console.log("DEBUG ENV:", process.env);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API key for Gemini is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const audioData = await blobToBase64(audioBlob);
    
    const audioPart = {
      inlineData: {
        mimeType: audioBlob.type,
        data: audioData,
      },
    };

    const textPart = {
      text: "Transcribe el siguiente audio en español. El audio describe la mecánica de un accidente de tránsito. Sé lo más fiel posible al audio original, manteniendo el lenguaje y las pausas si es posible.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, audioPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error transcribing audio with Gemini:", error);
    throw new Error("La transcripción falló. Inténtelo de nuevo.");
  }
};

const formatObject = (obj: any, indent = ''): string => {
    return Object.entries(obj)
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return `${indent}${label}:\n${formatObject(value, indent + '  ')}`;
            }
            if (value && (!Array.isArray(value) || value.length > 0)) {
                return `${indent}${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');
};

export const generateCaseSummary = async (caseData: FormDataState): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key for Gemini is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a detailed prompt from the case data
  const prompt = `
Eres un asistente legal experto. Tu tarea es generar un resumen conciso y bien estructurado de un caso de accidente de tránsito basado en los datos del formulario proporcionados. El resumen debe ser claro y fácil de entender para un abogado.

Aquí están los datos del caso:

**Cliente Principal:**
${formatObject(caseData.cliente)}

**Vehículo del Cliente:**
${formatObject(caseData.vehiculoCliente)}

**Detalles del Siniestro:**
${formatObject(caseData.siniestro)}

**Demandados:**
${formatObject(caseData.demandados)}

${caseData.tercerVehiculoDemandado ? `**Tercer Vehículo Involucrado:**\n${formatObject(caseData.tercerVehiculoDemandado)}` : ''}

${(caseData.testigos.testigo1.nombreApellido || caseData.testigos.testigo2.nombreApellido) ? `**Testigos:**\n${formatObject(caseData.testigos)}` : ''}

**Clasificación Final:**
${formatObject(caseData.clasificacionFinal)}

Por favor, genera un resumen que incluya:
1.  **Resumen Ejecutivo:** Un párrafo breve con los puntos más importantes del caso.
2.  **Partes Involucradas:** Nombres y roles del cliente, co-actores (si los hay) y demandados.
3.  **Mecánica del Accidente:** Una descripción clara de cómo ocurrió el accidente.
4.  **Lesiones y Daños:** Un resumen de las lesiones del cliente y los daños materiales.
5.  **Información Clave Adicional:** Cualquier otro dato relevante como testigos, intervención policial, y datos del seguro.
    `.trim();

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating case summary with Gemini:", error);
        throw new Error("La generación del resumen falló. Inténtelo de nuevo.");
    }
};
