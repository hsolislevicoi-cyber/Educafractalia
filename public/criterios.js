/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — CRITERIOS DE JUECES (v0.7)
   Fuente: documento de codificación ciega "Juez A" (confiabilidad
   inter jueces). Textos de la rúbrica copiados tal cual.
   Se carga ANTES de perfil.js y se expone como window.CriteriosJuez.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PROBLEMA = {
    enunciado: 'Una botella de té verde llena pesa 350 gramos. Con la mitad del té consumido pesa 200 gramos. ¿Cuál es el peso de la botella vacía?',
    respuesta: '50 g',
    complejidad: 'Aplicación / Análisis',
    contenido: 'Relaciones aditivas y ecuaciones de primer grado',
    rango: '5° básico a 2° medio, según los recursos matemáticos de cada estudiante',
    descripcion: 'Problema validado de respuesta cerrada única y amplio espectro procedimental: admite operaciones básicas, sistemas de ecuaciones lineales o razonamiento visual-gráfico.'
  };

  const REGLAS = [
    'Evalúa solo con evidencia escrita o visible en el desarrollo; evita interpretaciones que no estén sustentadas en el material.',
    'Asigna un único puntaje entero (1 a 4) por pregunta.',
    'Contrasta la evidencia con los descriptores de la rúbrica de la dimensión.',
    'Registra en “Hallazgos” todo lo que sirva para describir objetivamente al/la estudiante.'
  ];

  // Tabla 2: Rúbrica (verbatim). Clave = dimensión; 4 = Excelente … 1 = Insuficiente
  const RUBRICA = {
    rec: {
      titulo: 'Recursos (conocimientos previos, teoremas, operaciones, información externa, etc.)',
      4: 'El estudiante tiene un conocimiento profundo de los recursos disponibles (conocimientos previos, teoremas, operaciones, información externa, etc) y es capaz de seleccionar los más adecuados para el problema. Reflexiona sobre los recursos previos y decide cuándo buscar otros. Evalúa qué recursos adicionales podrían ser útiles.',
      3: 'El estudiante es consciente de los recursos, pero puede no estar seguro de cuándo utilizarlos de forma óptima. Reflexiona en algunos momentos, pero no siempre evalúa todos los recursos disponibles.',
      2: 'El estudiante conoce algunos recursos, pero no siempre sabe cuándo o cómo usarlos. La reflexión sobre los recursos es limitada y puede no buscar otros recursos cuando es necesario.',
      1: 'El estudiante no tiene claro qué recursos usar o no es consciente de su disponibilidad, lo que limita la solución del problema. No busca ni evalúa recursos adicionales.'
    },
    heu: {
      titulo: 'Heurísticas (estrategias de resolución, de cálculo, de visualización, etc.)',
      4: 'El estudiante reflexiona de manera profunda sobre las estrategias disponibles, evalúa cuál es la más adecuada para el problema y justifica su elección de forma clara y detallada. Además, reflexiona sobre las estrategias usadas en problemas similares, evalúa su efectividad y ajusta su enfoque según lo aprendido. Su selección de la estrategia está completamente justificada, demostrando una comprensión completa de cómo la estrategia se ajusta al problema.',
      3: 'El estudiante identifica varias estrategias posibles y selecciona la más adecuada, aunque la justificación no es tan detallada. Reflexiona sobre las estrategias usadas anteriormente y evalúa su efectividad en algunos casos, pero no siempre ajusta su enfoque de manera consistente. La justificación de la elección de la estrategia es razonable, pero podría ser más completa.',
      2: 'El estudiante selecciona una única estrategia y su reflexión sobre las opciones disponibles es limitada. La justificación de la estrategia es incompleta o poco clara, y rara vez reflexiona sobre la efectividad de las estrategias previas o ajusta su enfoque si es necesario. La reflexión sobre la elección de la estrategia es superficial.',
      1: 'El estudiante no reflexiona sobre las estrategias disponibles, ni evalúa cuál es la más adecuada para el problema. No tiene en cuenta las estrategias previas ni su efectividad, y no ajusta su enfoque según lo aprendido. La justificación de la estrategia seleccionada es inexistente o no está relacionada de manera coherente con el problema.'
    },
    con: {
      titulo: 'Control (monitoreo y ajuste del proceso)',
      4: 'El estudiante monitorea activamente su progreso, reflexiona sobre su toma de decisiones y realiza ajustes sin perder motivación. Es capaz de autorregular sus emociones y ajustar sus estrategias en tiempo real. Toma decisiones informadas basadas en su autoevaluación.',
      3: 'El estudiante es capaz de monitorear su progreso y ajustar su enfoque, pero puede sentirse desmotivado o dudar de sus decisiones en momentos difíciles. A veces no ajusta su enfoque de manera eficiente.',
      2: 'El estudiante monitorea de manera mínima y no ajusta sus estrategias de forma efectiva cuando se enfrenta a dificultades. Puede sentirse frustrado y dejar de monitorear el progreso.',
      1: 'El estudiante no controla ni ajusta su progreso durante la resolución. No toma decisiones informadas y no muestra autorregulación emocional, lo que impide avanzar en el problema.'
    }
  };

  // Tabla 1: qué insumo usa el evaluador en cada pregunta
  const INSUMOS = {
    P1: 'Coherencia entre la respuesta del estudiante y lo que se evidencia en el desarrollo.',
    P2: 'Respuesta del estudiante.',
    P3a: 'Respuesta del estudiante.',
    P3b: 'Evidencia observable que recoge el revisor desde el desarrollo, sobre heurísticas.',
    P4: 'Respuesta del estudiante.',
    P5: 'Respuesta del estudiante.'
  };

  // Comentarios posibles para P1 (el documento los ejemplifica con la RESTA; {op} = operación que declaró el/la estudiante).
  // {una} → "una resta"; {op} → "resta"; {ops} → "restas".
  const COMENTARIOS_P1 = [
    'Se visualiza {una} que es eje central del desarrollo',
    'Existe un proceso de {op} no explícito',
    'Se ve que realiza {ops} de manera eficiente y más de una vez',
    'No se visualiza proceso de {op} en el desarrollo'
  ];

  // Evidencia observable para P3b (casillas)
  const EVIDENCIA_P3B = [
    'Extrae datos',
    'Realiza cálculos',
    'Flechas para conectar valores numéricos con verbales',
    'Dibujo de visualización'
  ];

  window.CriteriosJuez = { PROBLEMA, REGLAS, RUBRICA, INSUMOS, COMENTARIOS_P1, EVIDENCIA_P3B };
})();
