// netlify/functions/evaluar-estudiante.js
// ─────────────────────────────────────────────────────────────────
// Función serverless que actúa como proxy seguro a la API de Anthropic.
// La API key vive SOLO en las variables de entorno de Netlify, nunca
// en el navegador ni en el código fuente. El navegador del usuario
// llama a esta función con los datos del estudiante, la función
// consulta a Claude, y devuelve la respuesta estructurada.
// ─────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-5-20250929';
const API_URL = 'https://api.anthropic.com/v1/messages';

exports.handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Validar que la API key está configurada en Netlify
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'API key no configurada en el servidor. Configura ANTHROPIC_API_KEY en Netlify.'
      })
    };
  }

  try {
    const { tipo, payload } = JSON.parse(event.body);

    let messages;
    let systemPrompt;

    if (tipo === 'analizar_desarrollo') {
      // Paso 1: analizar la foto del desarrollo matemático
      ({ systemPrompt, messages } = construirPromptDesarrollo(payload));
    } else if (tipo === 'evaluar_respuestas') {
      // Paso 2: evaluar las 6 dimensiones de preguntas abiertas
      ({ systemPrompt, messages } = construirPromptEvaluacion(payload));
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Tipo de solicitud desconocido' }) };
    }

    // Llamar a la API de Anthropic
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Error de API: ${errorText}` })
      };
    }

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text');
    const rawText = textContent ? textContent.text : '';

    // Intentar parsear como JSON (debería venir estructurado)
    let parsed;
    try {
      // Extraer JSON del texto (la IA puede envolver en markdown)
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      parsed = { raw: rawText, error: 'No se pudo parsear como JSON' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: parsed, usage: data.usage })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// ═════════════════════════════════════════════════════════════════
// PROMPT 1: Análisis del desarrollo matemático (foto)
// ═════════════════════════════════════════════════════════════════
function construirPromptDesarrollo({ imagenBase64, mediaType }) {
  const systemPrompt = `Eres un investigador experto en didáctica de la matemática y evaluación metacognitiva, actuando como juez ciego en el marco del proyecto Educa Fractalia. Tu tarea es observar una foto del desarrollo escrito de un estudiante que resolvió un problema matemático, y describir técnicamente lo que observas con rigor académico.

PROBLEMA MATEMÁTICO CONTEXTO:
"Una botella de té verde llena pesa 350 gramos. Con la mitad del té consumido pesa 200 gramos. ¿Cuál es el peso de la botella vacía?"
Respuesta correcta: 50 g.

ENFOQUE DE TU DESCRIPCIÓN:
- Observa las operaciones matemáticas visibles (qué operaciones hace, si están correctas)
- Identifica estrategias heurísticas visibles (dibujos, flechas, planteamiento algebraico, extracción ordenada de datos, descomposición del problema, uso de representaciones visuales, etc.)
- Nota cualquier error de cálculo o razonamiento visible
- Describe si el desarrollo es coherente y conduce a un resultado
- Sé específico: usa números, operadores y términos matemáticos concretos

FORMATO DE SALIDA (JSON estricto):
{
  "descripcion_tecnica": "texto descriptivo objetivo de 2-4 oraciones",
  "operaciones_visibles": ["resta 350-200=150", "resta 200-150=50"],
  "estrategias_heuristicas_visibles": ["extracción ordenada de datos", "uso de flechas conectoras"],
  "errores_observados": ["no hay errores" o lista específica],
  "resultado_al_que_llega": "50 g" o "no llega a resultado" o "llega a resultado erróneo: X",
  "coherencia_desarrollo": "alta / media / baja"
}

Responde SOLO con el JSON, sin texto adicional.`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType || 'image/jpeg',
            data: imagenBase64
          }
        },
        {
          type: 'text',
          text: 'Describe técnicamente este desarrollo matemático siguiendo el formato JSON especificado.'
        }
      ]
    }
  ];

  return { systemPrompt, messages };
}

// ═════════════════════════════════════════════════════════════════
// PROMPT 2: Evaluación de las 6 dimensiones de preguntas abiertas
// ═════════════════════════════════════════════════════════════════
function construirPromptEvaluacion({ respuestas, descripcionDesarrollo, bibliotecaCriterios }) {
  const systemPrompt = `Eres un investigador experto en didáctica de la matemática y evaluación metacognitiva, actuando como JUEZ CIEGO en el marco del proyecto Educa Fractalia, dirigido por Mg. Alejandra Solís Levicoi (UdeC). Tu tarea es evaluar las respuestas abiertas y el desarrollo de un estudiante aplicando una rúbrica validada.

═══════════════════════════════════════════════════════════════
MARCO METODOLÓGICO
═══════════════════════════════════════════════════════════════

INSTRUMENTO: Evaluación metacognitiva en resolución de problemas matemáticos, basado en Schoenfeld (1985). Evalúa 4 dimensiones: Recursos, Heurísticas, Control, Sistema de Creencias. Solo las 3 primeras se evalúan con preguntas abiertas.

RÚBRICA (4 niveles):
- NIVEL 4 (Excelente): Reflexión profunda, justificación detallada, evaluación consciente.
- NIVEL 3 (Bueno): Selección adecuada, justificación razonable aunque menos detallada.
- NIVEL 2 (Satisfactorio): Selección limitada, justificación incompleta, reflexión superficial.
- NIVEL 1 (Insuficiente): Sin reflexión, sin justificación coherente con el problema.
- NIVEL 0 (solo si aplica): Sin respuesta o respuesta completamente irrelevante.

═══════════════════════════════════════════════════════════════
LAS 6 EVALUACIONES QUE DEBES HACER
═══════════════════════════════════════════════════════════════

DIMENSIÓN RECURSOS (2 puntajes):

• P1 — Coherencia entre operación declarada y desarrollo:
  Evalúa la coherencia entre la operación que el estudiante declara como más importante y lo que realmente se evidencia en el desarrollo matemático. NO evalúas la respuesta escrita aislada, sino la COHERENCIA entre lo declarado y lo ejecutado.
  Ejemplos de comentarios del revisor esperados:
  - "Se visualiza una resta que es eje central del desarrollo" (alta coherencia)
  - "Existe un proceso de resta no explícito" (coherencia media)
  - "No se visualiza proceso de la operación declarada en el desarrollo" (baja coherencia)

• P2 — Respuesta del estudiante a "¿cómo supiste que había que usar esa operación?":
  Evalúa la calidad reflexiva de la respuesta escrita del estudiante. ¿Justifica de forma coherente por qué eligió esa operación? ¿Muestra comprensión del problema?

DIMENSIÓN HEURÍSTICAS (2 puntajes):

• P3a — Respuesta del estudiante a "explica al menos 3 pasos":
  Evalúa si los pasos declarados son claros, secuenciales y coherentes con un proceso de resolución.

• P3b — HEURÍSTICAS EVIDENCIADAS EN EL DESARROLLO (crítico):
  **Una heurística es cualquier estrategia observable en el desarrollo que ayuda al proceso de resolución.** No son declaraciones del estudiante, sino acciones visibles en el papel. Una heurística es siempre un medio, nunca un fin: puede servir internamente para comprender, controlar o identificar recursos, pero su naturaleza (la acción visible) es heurística.
  
  ANCLAS CONCEPTUALES (ejemplos del marco teórico, NO lista cerrada):
  - División del problema (descomposición)
  - Prueba con ejemplos específicos
  - Uso de diagramas o representaciones visuales
  - Trabajo hacia atrás (desde el resultado)
  - Ajuste de estrategias (cambiar enfoque cuando no funciona)
  
  EJEMPLOS ADICIONALES DEL PILOTAJE REAL:
  - Extracción ordenada de datos del enunciado
  - Uso de flechas conectoras entre cálculos
  - Dibujo del objeto del problema (botellas)
  - Planteamiento algebraico (sistema de ecuaciones)
  - Clasificación/categorización de información
  - Verificación por repetición del procedimiento
  
  TU TAREA: Identifica TODAS las estrategias observables en el desarrollo (usa las anclas + cualquier otra que aparezca), y asigna un puntaje 1-4 según la riqueza y efectividad de las heurísticas usadas.

DIMENSIÓN CONTROL (2 puntajes):

• P4 — Respuesta a "¿qué harías diferente?":
  Evalúa la capacidad de reflexión retrospectiva, autoevaluación y propuesta de mejora.
  Respuestas como "Nada", "No sé", "Todo igual" denotan control bajo (1-2).
  Respuestas con propuestas específicas de cambio denotan control más alto (3-4).

• P5 — Respuesta a "¿qué hiciste para saber si debías corregir?":
  Evalúa el monitoreo activo durante la resolución.
  "No hice nada", "No sé" denotan ausencia de monitoreo (1).
  Estrategias específicas (rehacer, comparar, lógica del resultado) denotan monitoreo activo (3-4).

═══════════════════════════════════════════════════════════════
EJEMPLOS CALIBRADORES DEL PILOTAJE REAL
═══════════════════════════════════════════════════════════════

Estos son ejemplos de evaluaciones hechas por la investigadora experta en casos reales:

CASO S2 (Amaya) - Perfil alto:
- Desarrollo: usa suma como eje, dibuja botella, flechas indicativas, "g" para clarificar
- P1="Suma" + desarrollo coherente → puntaje 4, comentario: "Se visualiza una suma como eje central del desarrollo"
- P2="Porque sumé, dado que no estaba segura..." → puntaje 4 (reflexión profunda sobre el error inicial)
- P3a="Dibujo el peso y la botella. Busqué la mitad de 350. Resolví..." → puntaje 4
- P3b (evidencia) → puntaje 4, comentario: "Realiza operaciones correctamente, dibuja para comprender, usa flechas indicativas, coloca g de gramos cuando necesita clarificar el dato"
- P4="Colocar el signo + y los zapatitos. El resto está bien." → puntaje 2 (propuesta limitada)
- P5="Me di cuenta que 200 no era la mitad de 350" → puntaje 4 (monitoreo activo explícito)

CASO S1 (Martina) - Perfil bajo:
- Desarrollo: resta con resultado erróneo, no explora alternativas
- P1="La Resta" + resta mal ejecutada → puntaje 2, comentario: "Si bien se evidencia una resta asociada al razonamiento, no se realiza correctamente el algoritmo"
- P2="Porque la primera botella era cuando tenía jugo..." → puntaje 1 (descriptivo, sin reflexión)
- P3a="Mirar el problema escribir el ejercicio y pensar en los números" → puntaje 1
- P3b (evidencia) → puntaje 1, comentario: "Se visualiza una resta con resultado erróneo"
- P4="No cambiara nada" → puntaje 1
- P5="Mejoré el ejercicio primero pensé que debía sumar..." → puntaje 2 (auto-corrección implícita)

CASO S10 (Amylee) - Perfil bajo con recursos dispersos:
- Desarrollo: operación con signo de multiplicación pero datos dispuestos como suma (350x200=650), cálculos inconexos
- P1="La multiplicación porque es como más rápida que la suma" + desarrollo incoherente → puntaje 2
  comentario: "Se muestra operación con signo de multiplicación pero datos dispuestos como suma. No hay relación clara entre los cálculos"
- P3b → puntaje 1, comentario: "Se extraen datos 350 y 200 pero sin asociarlos a la interpretación del problema. Cálculos dispersos"

═══════════════════════════════════════════════════════════════
ZONA DE TRANSICIÓN FLEXIBLE
═══════════════════════════════════════════════════════════════

Cuando un puntaje promedio de una dimensión quede en el rango 2.55-2.65 (entre medio-bajo y medio-alto), NO redondees automáticamente. Marca el caso como "revisar con evidencia cualitativa". Esto aplica solo a Rec, Heu y Con (no a Sist. Creencias).

═══════════════════════════════════════════════════════════════
BIBLIOTECA DE CRITERIOS ACUMULATIVOS
═══════════════════════════════════════════════════════════════

${bibliotecaCriterios && bibliotecaCriterios.length > 0 ? `
Correcciones previas realizadas por la experta en casos similares:
${bibliotecaCriterios.slice(-10).map((c, i) => `
Corrección ${i+1}:
- Input: ${c.input_resumen}
- Propuesta IA: ${c.propuesta_ia_puntaje} ("${c.propuesta_ia_comentario?.substring(0,100)}")
- Corrección experta: ${c.correccion_puntaje} ("${c.correccion_comentario?.substring(0,100)}")
- Razón: ${c.razon || 'no especificada'}
`).join('\n')}

Usa estas correcciones como referencia de calibración.
` : 'No hay correcciones previas registradas aún.'}

═══════════════════════════════════════════════════════════════
FORMATO DE SALIDA (JSON estricto)
═══════════════════════════════════════════════════════════════

{
  "P1": {
    "puntaje": 1-4,
    "comentario_revisor": "evidencia de coherencia entre operación declarada y desarrollo",
    "justificacion": "breve explicación del puntaje asignado",
    "zona_transicion": false
  },
  "P2": {
    "puntaje": 1-4,
    "justificacion": "breve explicación",
    "zona_transicion": false
  },
  "P3a": {
    "puntaje": 1-4,
    "justificacion": "breve explicación",
    "zona_transicion": false
  },
  "P3b": {
    "puntaje": 1-4,
    "comentario_revisor": "heurísticas evidenciadas en el desarrollo, nombradas con precisión",
    "heuristicas_detectadas": ["lista específica de estrategias observadas"],
    "justificacion": "breve explicación del puntaje",
    "zona_transicion": false
  },
  "P4": {
    "puntaje": 1-4,
    "justificacion": "breve explicación",
    "zona_transicion": false
  },
  "P5": {
    "puntaje": 1-4,
    "justificacion": "breve explicación",
    "zona_transicion": false
  },
  "sintesis": "1-2 oraciones de síntesis global del desempeño en preguntas abiertas"
}

Responde SOLO con el JSON, sin texto adicional ni markdown.`;

  const userContent = `
DESCRIPCIÓN TÉCNICA DEL DESARROLLO DEL ESTUDIANTE (generada previamente):
${JSON.stringify(descripcionDesarrollo, null, 2)}

RESPUESTAS DEL ESTUDIANTE A LAS PREGUNTAS ABIERTAS:

P1 (Operación más importante): "${respuestas.p1 || '[sin respuesta]'}"
P2 (¿Cómo supiste que había que usar esa operación?): "${respuestas.p2 || '[sin respuesta]'}"
P3a (Explica al menos 3 pasos): "${respuestas.p3a || '[sin respuesta]'}"
P4 (¿Qué harías diferente?): "${respuestas.p4 || '[sin respuesta]'}"
P5 (¿Qué hiciste para saber si debías corregir?): "${respuestas.p5 || '[sin respuesta]'}"

Evalúa las 6 dimensiones siguiendo el formato JSON especificado en el system prompt.`;

  const messages = [
    { role: 'user', content: userContent }
  ];

  return { systemPrompt, messages };
}
