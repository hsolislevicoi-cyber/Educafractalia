# Guía de codificación — Evaluación de la metacognición en resolución de problemas

Fuente primaria: tesis de Solís H. (2025), *Metacognición en la resolución de problemas matemáticos*
(cap. III.3, III.6, IV y anexos C–F). Esta guía es la referencia única que deben leer la plataforma,
la evaluación con IA y cualquier persona o Claude que evalúe. **Si algo de esta guía contradice a la
tesis, manda la tesis**; si contradice a un visado posterior de la docente, ver sección 9.

Estado: borrador para revisión de la docente. Los puntajes de casos de la tesis son los validados;
las reglas por pregunta están **derivadas de esos 13 casos** (la tesis entrega la rúbrica por
dimensión, no una regla por pregunta).

---

## 1. Qué se evalúa

Modelo de Schoenfeld (1985), cuatro dimensiones. El problema usado en la tesis y en la plataforma:

> Una botella de té verde llena pesa 350 g; con la mitad del té consumido pesa 200 g. ¿Cuál es el peso
> de la botella vacía? (respuesta correcta: 50 g; error frecuente: 150 g)

| Dimensión | Instrumento | Preguntas abiertas |
|---|---|---|
| Recursos | Likert + abiertas | P1 operación más importante · P2 cómo supo que había que usar esa operación |
| Heurísticas | Likert + abiertas | P3a pasos que siguió · P3b heurísticas evidenciadas en el desarrollo (imagen) |
| Control | Likert + abiertas | P4 qué haría diferente · P5 qué hizo para saber si corregir |
| Sistema de creencias | **solo Likert** | ninguna. No se infieren creencias desde otras respuestas (tesis III.6) |

Insumo de cada pregunta (tesis, Tabla 12):

| Pregunta | Insumo para el puntaje |
|---|---|
| P1 | **Coherencia entre la respuesta y lo que se evidencia en el desarrollo** (requiere imagen) |
| P2, P3a, P4, P5 | Respuesta escrita del estudiante |
| P3b | Evidencia que recoge el revisor en el desarrollo (requiere imagen) |

Sin imagen no se puede puntuar P1 ni P3b: se deja como pendiente, no se estima.

## 2. Rúbrica (tesis, Tabla 7) y puntajes

Cada pregunta abierta se puntúa de 1 a 4: Excelente 4, Bueno 3, Satisfactorio 2, Insuficiente 1.
**Respuesta en blanco o sin relación con la pregunta = 0** (la tesis lo usa: T-S6 y T-S10 tienen 0).
La nota por dimensión es el promedio de sus dos preguntas (por eso aparecen medios puntos: 1,5; 2,5).

Descriptores por dimensión (resumen fiel de la Tabla 7):

- **Recursos.** 4: conocimiento profundo de recursos, elige los adecuados, evalúa si necesita otros.
  3: es consciente de los recursos pero no siempre sabe cuándo usarlos óptimamente. 2: conoce algunos,
  no siempre sabe cuándo o cómo; reflexión limitada. 1: no tiene claro qué recursos usar.
- **Heurísticas.** 4: reflexiona sobre estrategias, elige y justifica con claridad, ajusta según lo
  aprendido. 3: identifica varias y elige la más adecuada con justificación menos detallada.
  2: una sola estrategia, reflexión limitada. 1: no reflexiona ni justifica.
- **Control.** 4: monitorea activamente, ajusta en tiempo real, decide con autoevaluación.
  3: monitorea y ajusta pero puede dudar o no ajustar con eficiencia. 2: monitoreo mínimo, ajuste poco
  efectivo ante dificultades. 1: no controla ni ajusta.
- **Sistema de creencias** (solo Likert). 4: fuerte creencia en su capacidad, persiste. 3: cree pero se
  desmotiva ante obstáculos. 2: dudas sobre su capacidad que afectan la motivación. 1: no cree, abandona.

## 3. Cálculo del nivel por dimensión

1. Likert normalizado a escala 1–4 (en la plataforma: `1 + 0,5·(suma − 3)`, con tres ítems por dimensión).
2. Dimensión final = **promedio entre el Likert normalizado y el promedio de las dos abiertas**
   (tesis III.6; ejemplo T-S1 Recursos: Likert 2,8 y abiertas 1,5 → 2,15).
3. Sistema de creencias = solo el Likert normalizado.

| Nivel de la tesis | Rango | Nombre en la plataforma | Nivel administrativo (perfil) |
|---|---|---|---|
| Alto | 3,40 – 4,00 | Destacado | A → Destacado |
| Medio-alto | 2,65 – 3,39 | Competente | B, C → Competente |
| Medio-bajo | 2,00 – 2,64 | Adecuado | D → Adecuado |
| Bajo | 1,00 – 1,99 | Insuficiente | E → Insuficiente |

Umbral de exigencia: 55 % (2,65 puntos para ser medio-alto).

### Casos límite (tesis III.6)

- **Redondeo consciente (≤ ±0,01 del umbral):** sube de nivel solo si las demás dimensiones apuntan en el
  mismo sentido. Si dos o más dimensiones están en el límite, se aplica el criterio más conservador o se
  exige triangular con la evidencia cualitativa. Ejemplo de la tesis: 3,49 en tres dimensiones no basta
  para “metacognitivamente avanzado”.
- **Zona de transición flexible 2,55 – 2,65** (solo entre medio-bajo y medio-alto): aplica únicamente a
  Recursos, Heurísticas y Control. Se resuelve con juicio pedagógico y el contenido de las abiertas.
  **No aplica a Sistema de creencias**, que usa solo el redondeo estadístico (T-S1: 2,6 → medio-alto).
- Ejemplo de no redondeo (T-S7, Recursos 2,60): se mantiene medio-bajo porque la respuesta
  “resta, porque lo intuí” no explica el recurso aunque la resta sea el eje del desarrollo.
- El juicio profesional informado tiene un papel central en todo caso límite: el perfil es una
  herramienta formativa, no una etiqueta rígida.

## 4. Perfiles (tesis, Tabla 17)

Las dimensiones ancla son **Control y Sistema de creencias**.

| Perfil | Regla |
|---|---|
| A · Metacognitivo avanzado | Alto en al menos 2 dimensiones, incluyendo Control y Sistema de creencias |
| B · Estratega parcial | Alto o medio-alto en Recursos y Heurísticas, pero medio-bajo o bajo en Control o Sistema de creencias |
| C · Reflexivo en desarrollo | Alto o medio-alto en Control y Sistema de creencias, pero bajo o medio-bajo en Recursos y Heurísticas |
| D · Metacognitivo en desarrollo | Medio-alto o medio-bajo en todas las dimensiones, sin nivel alto en ninguna |
| E · Metacognición frágil | Bajo o medio-bajo en al menos tres dimensiones, incluyendo Control y Sistema de creencias |

Un perfil es un punto de partida para la retroalimentación, no un diagnóstico fijo. Los casos que no
calzan en ninguna regla se proponen con precedentes y quedan “a validar por la docente”.

## 5. Reglas de puntaje por pregunta (derivadas de los 13 casos de la tesis, Anexo E)

La tesis valida 78 puntajes (13 estudiantes × 6). Los promedios por pregunta publicados (P1 2,2; P2 1,8;
P3a 2,8; P3b 2,5; P4 1,5; P5 1,2) se reproducen exactamente con los puntajes de la sección 6.

**P1 · Operación (coherencia con el desarrollo)**
- 4: operación nombrada, ejecutada de forma visible y justificada en la propia respuesta (T-S8).
- 3: operación nombrada y visible en el desarrollo (T-S3, T-S7, T-S11, T-S13).
- 2: operación nombrada con indicios en el desarrollo pero proceso no explícito, o respuesta que no
  responde del todo a la pregunta (T-S1, T-S4, T-S6, T-S9, T-S12).
- 1: no se visualiza el proceso o no coincide con lo declarado (T-S2, T-S5, T-S10).
- 0: sin respuesta.

**P2 · Cómo supo qué operación usar**
- 4: identifica la estructura del problema que determina la operación (“había que calcular una diferencia”, T-S11).
- 3: se apoya en información del enunciado o en un procedimiento propio (T-S3, T-S10).
- 2: razón propia pero vaga (T-S2, T-S5, T-S8, T-S13).
- 1: razón **externa** (compañeros, profesor), intuición, azar o “no estaba segura” (T-S1, T-S4, T-S7, T-S9, T-S12).
- 0: en blanco (T-S6).

**P3a · Pasos**
- 4: tres o más pasos específicos, ordenados y conectados con la lógica del problema; incluye
  verificación cuando la hay (T-S1, T-S7, T-S8, T-S10, T-S11, T-S12).
- 3: pasos reconocibles pero en parte genéricos o desordenados (T-S3, T-S4).
- 2: lista breve de operaciones con algo de información (T-S13).
- 1: una acción suelta o lista de operaciones sin pasos (T-S2, T-S5, T-S6, T-S9).

**P3b · Heurísticas evidenciadas en el desarrollo (imagen)**
Evidencias que registra la tesis: extrae datos; realiza cálculos; plantea ecuaciones con palabras y
números; escribe a qué corresponden sus cálculos; flechas para conectar valores numéricos con verbales;
dibujo o diagrama de visualización.
- 3: extrae datos y suma al menos una forma de representar o formalizar (ecuación con palabras, rotulado,
  flechas, dibujo o diagrama) (T-S1, T-S3, T-S7, T-S9, T-S10, T-S11).
- 2: solo extrae datos o solo muestra cálculos; **datos + cálculos sin representación sigue siendo 2** (T-S2, T-S4, T-S5, T-S6, T-S8, T-S12, T-S13).
- 4 y 1 no aparecen en el piloto: 4 se reserva para varias formas de representación bien articuladas;
  1 para desarrollo sin evidencia.

**P4 · Qué haría diferente**
- 2: propone algo concreto aunque genérico (“leer bien la pregunta”, “explicarlo distinto”,
  “agregar una pregunta”, “resolver todo y después calcular”) (T-S1, T-S2, T-S3, T-S5, T-S6, T-S8).
- 1: “nada”, “no cambiaría nada”, “no sé”, o una operación suelta (T-S4, T-S7, T-S9, T-S10, T-S11, T-S12, T-S13).
- 0: en blanco.
- 3 y 4 no aparecen en el piloto: se reservan para análisis explícito y justificado de un error o decisión propia.

**P5 · Qué hizo para saber si corregir**
- 3: verificación concreta por repetición con el mismo resultado (T-S8).
- 2: verificación genérica o por contraste con lógica/resultado esperado (T-S2, T-S3, T-S11).
- 1: no corrigió, atribuye la verificación a otros (“a todos nos dio lo mismo”, “prestándole atención al profe”), “era muy obvio”, “no lo sabía”, “nada” (T-S1, T-S4, T-S5, T-S7, T-S9, T-S12, T-S13).
- 0: en blanco o sin contenido (T-S6, T-S10).

## 6. Casos ancla validados de la tesis (anónimos)

Respuestas textuales (con sus errores originales). Entre corchetes: comentario del revisor sobre P1 y evidencia observada para P3b. La última columna entrega los puntajes en el orden P1·P2·P3a·P3b·P4·P5.

| Caso | P1 (y comentario del revisor) | P2 | P3a | P3b (evidencia en el desarrollo) | P4 | P5 | P1·P2·P3a·P3b·P4·P5 |
|---|---|---|---|---|---|---|---|
| T-S1 | “adición y sustracción” [no se visualiza proceso de resta] | “porque lo hice junto a mis compañeros” | “saber cuánto pesaba solo el jugo, ver cuánto quedaba y sumarlo a ver si daba el peso total” | [extrae datos; ecuaciones con palabras y números] | “leer bien la pregunta” | “porque a todos nos dio lo mismo” | 2·1·4·3·2·1 |
| T-S2 | “Recta” [no se visualiza el cálculo] | “porque al ver el ejercicio puedes saber que se puede aser” | “Recte sume multiplique” | [extrae datos] | “primero resolvería todo el procedimiento y después sacar cálculos” | “calculando el procedimiento” | 1·2·1·2·2·2 |
| T-S3 | “la suma y la resta” [resta y suma visibles] | “leyendo la pregunta y obteniendo información de ella” | “leer varias veces el ejercicio hasta entenderlo, intentar hacerlo con ejemplos, hacer una operación que me ayude a responder” | [datos; cálculos; flechas] | “leer mejor y con tranquilidad” | “ver si daba el resultado que había obtenido antes de hacerlo manualmente” | 3·3·3·3·2·2 |
| T-S4 | “la resta” [proceso no explícito] | “gracias al profesor que nos dio una idea” | “tuve que restarlo, y después sumar el resultado que me dio cada uno y de ahí medio el resultado” | [extrae datos] | “lo multiplicaría” | “ósea yo no corregí” | 2·1·3·2·1·1 |
| T-S5 | “multiplicación y división” [no se visualiza] | “haciendo el ejercicio” | “150+150=300. Sume” | [datos; cálculos] | “le agregaría una pregunta: ¿cuánto se necesita para llegar a 1.200 gm?” | “prestándole atención al profe” | 1·2·1·2·2·1 |
| T-S6 | “la resta” [proceso no explícito] | (en blanco) | “primero resté” | [extrae datos] | “lo explicaría de forma distinta” | “.” | 2·0·1·2·2·0 |
| T-S7 | “la resta” [resta eje central] | “porque lo intuí” | “1. sacar el cálculo entre 350 g y 200 g = 150; 2. restarle eso a 200 g; 3. el resultado es 50 g” | [datos; dibujo de visualización] | “nada, creo que está bien así” | “porque era muy obvio” | 3·1·4·3·1·1 |
| T-S8 | “la resta, porque resté la botella llena con el té y me dio la respuesta” [se visualiza la resta] | “al leer el ejercicio supe lo que tenía que hacer” | “lo que hice fue comparar lo lleno y la mitad, me dio un resultado y luego lo sumé y me dio 300 y me faltaban 50 g” | [extrae datos] | “lo explicaría de forma diferente ya que no se entiende mucho” | “porque lo hice repetidas veces y me dio el mismo resultado” | 4·2·4·2·2·3 |
| T-S9 | “la suma” [suma no explícita] | “solo lo soponia” | “sumar restar y calcular” | [datos; diagrama para visualizar suma] | “restar” | “no hice nada” | 2·1·1·3·1·1 |
| T-S10 | “la resta” [no se visualiza proceso] | “porque lo repetí varias veces el procedimiento” | “primero comparé los gramos de la botella llena y la mitad, restamos 150 a la botella media y queda en 200, luego restamos otro 150 y nos dio 50 g” | [datos; ecuaciones con palabras] | “no cambiaría nada” | (en blanco) | 1·3·4·3·1·0 |
| T-S11 | “resta” [restas eficientes, más de una vez] | “porque había que calcular una diferencia” | “1. imaginé el ejemplo del ejercicio; 2. calculé la diferencia entre el peso inicial menos lo que queda; 3. saqué el peso total del té y se lo resté al peso inicial” | [escribe a qué corresponden sus cálculos; cálculos] | “nada” | “pensé en la lógica del resultado” | 3·4·4·3·1·2 |
| T-S12 | “me cuesta las matemáticas creo que es calcular la mitad del té” [no responde lo que se pregunta; factor emocional] | “solo traté de usar lógica no estaba segura” | “1. resto total del té con la mitad…; 2. multiplico por 2…; 3. restarle el té completo a la mitad del té” | [muestra cálculos] | “no sé qué haría diferente” | “no lo sabía” | 2·1·4·2·1·1 |
| T-S13 | “dividir” [hay división] | “era la opción más viable” | “dividir, sumar y restar” | [cálculos consecutivos eficientes] | “nada” | “nada” | 3·2·2·2·1·1 |


## 7. Cómo triangular (tesis IV.4)

- Contrastar siempre autoevaluación (Likert) con desempeño (abiertas + desarrollo). Las brechas son un
  hallazgo, no un error: S9 sube +9 en Likert de Control y responde “no hice nada”; S10 tiene Likert alto
  y 0,5 en las abiertas de Control.
- Contrastar lo declarado con lo ejecutado (P1 con el desarrollo).
- No inferir creencias desde las abiertas.
- Dos estudiantes con el mismo archivo adjunto (T-S4 y T-S6) se señalan como posible copia sin penalizar
  de forma automática; queda a juicio de la docente.

## 8. Inconsistencias detectadas en la tesis (para que la docente las confirme con su Excel original)

1. **Tabla 9 no coincide con el Anexo D en Heurísticas y Control.** Recursos y Sistema de creencias
   coinciden en los 13 casos. En Heurísticas y Control, el promedio de Likert (Anexo C) con las abiertas
   (Anexo E) da otros valores en 11 de 13 casos. Ejemplo T-S7: Anexo D da Heurísticas 3,05 y Control 1,60;
   la Tabla 9 y la Tabla 18 informan Heurísticas 2,30 y Control 3,05. La columna “Control” de la Tabla 9
   coincide en casi todos los casos con la Heurística calculada. La plataforma calcula como el Anexo D.
2. **Efecto en el promedio del curso.** Con el Anexo D, Heurísticas del curso = 2,80 (medio-alto) y
   Control = 2,19 (medio-bajo), no 2,49 y 2,80 como en la Tabla 9. El perfil del curso pasaría de C a D.
   Coincide con lo que el texto afirma sobre Control (promedio abiertas 1,35, “nivel insatisfactorio”).
3. **Efecto en perfiles individuales.** T-S7 con los valores del Anexo D (R 2,60; H 3,05; C 1,60; SC 2,60)
   cumpliría la regla del perfil E, no D.
4. El Likert de la tesis tiene 6 ítems por dimensión; la plataforma usa la versión con 3 ítems y la
   fórmula `1 + 0,5·(suma − 3)`. Verificar que la equivalencia sea la del documento de perfil integral.

## 9. Fuentes que pueden diferir y orden de precedencia

1. Tesis (esta guía, secciones 2–6).
2. Visados de la docente posteriores a la tesis (por ejemplo, el caso S01 de la muestra Kobo:
   P1 4, P2 2, P3a 3, P3b 2, P4 2, P5 3).
3. Jueza A (S1–S3 de la muestra piloto de la plataforma).
4. Propuestas de IA o de Claude: nunca son ancla hasta que la docente las visa.

Diferencias conocidas entre fuentes (resolver con la docente):
- P1 “la resta” con proceso visible: la tesis da 3 (4 solo con justificación); el visado S01 da 4.
- P3a con tres pasos incluyendo revisión: la tesis da 4; el visado S01 da 3.
- P2 con razón externa (“me lo enseñaron”, “con mis compañeros”): la tesis da 1; las reglas usadas para las
  propuestas de los 30 informes daban 2.
- P4 genérico (“leer mejor”): la tesis da 2; las propuestas de los 30 informes daban 1.
- P3b con datos + cálculos: la tesis da 2; las propuestas daban 3.

## 10. Uso responsable

Los puntajes de IA o de Claude son propuestas que la docente visa. El estudiante recibe retroalimentación
formativa, no una etiqueta. No se publican nombres, fotos ni respuestas identificables fuera del contexto
escolar autorizado.
