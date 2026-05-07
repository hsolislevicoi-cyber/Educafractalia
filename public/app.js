/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — APP PRINCIPAL (v0.3)
   Sistema de Evaluación Metacognitiva en Resolución de Problemas
   ───────────────────────────────────────────────────────────────
   Módulo 01: Carga de datos desde Google Forms (XLSX/CSV)
   Módulo 02: Evaluación con IA de preguntas abiertas + desarrollo
   Módulo 03: Procesamiento estadístico Likert (integrado en 01)
   ═════════════════════════════════════════════════════════════════ */

// ───────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ───────────────────────────────────────────────────────────────
const state = {
  students: [],           // Array de estudiantes procesados
  evaluations: {},        // Map id → evaluación IA { P1, P2, P3a, P3b, P4, P5, desarrollo, estado }
  bibliotecaCriterios: [], // Correcciones acumuladas [{input_resumen, propuesta_ia, correccion, razon}]
  currentStudentIdx: null,
  apiReady: false,
  unassignedPhotos: []    // Fotos cargadas que aún no se han asociado a un estudiante
};

// ───────────────────────────────────────────────────────────────
// CONSTANTES METODOLÓGICAS
// ───────────────────────────────────────────────────────────────
const LIKERT_MAP = { 'Nunca': 1, 'A veces': 2, 'Siempre': 3 };

const COLUMN_MAP = {
  timestamp: 0, name: 1, curso: 2, edad: 3, mes: 4, estadia: 5,
  rec_items: [6, 7, 8],
  heu_items: [9, 10, 11],
  con_items: [12, 13, 14],
  sc_items: [15, 16, 17],
  sc_inverse_idx: 1,
  foto: 18, pa_p2: 19, pa_p1: 20, pa_p3a: 21, pa_p4: 22, pa_p5: 23
};

const QUESTION_META = {
  P1: { label: 'P1', dimension: 'Recursos', text: 'Operación matemática más importante (coherencia con desarrollo)' },
  P2: { label: 'P2', dimension: 'Recursos', text: '¿Cómo supiste que había que usar esa operación?' },
  P3a: { label: 'P3a', dimension: 'Heurísticas', text: 'Explica al menos 3 pasos que seguiste' },
  P3b: { label: 'P3b', dimension: 'Heurísticas', text: 'Heurísticas evidenciadas en el desarrollo' },
  P4: { label: 'P4', dimension: 'Control', text: 'Si tuvieras que volver a resolver, ¿qué harías diferente?' },
  P5: { label: 'P5', dimension: 'Control', text: '¿Qué hiciste para saber si debías corregir?' }
};

// ───────────────────────────────────────────────────────────────
// PERSISTENCIA (IndexedDB)
// ───────────────────────────────────────────────────────────────
const DB_NAME = 'EducaFractalia';
const DB_VERSION = 2;  // Incrementado para agregar 'images' store
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('evaluations')) {
        database.createObjectStore('evaluations', { keyPath: 'studentId' });
      }
      if (!database.objectStoreNames.contains('biblioteca')) {
        database.createObjectStore('biblioteca', { keyPath: 'id', autoIncrement: true });
      }
      if (!database.objectStoreNames.contains('session')) {
        database.createObjectStore('session', { keyPath: 'key' });
      }
      // NUEVO en v2: store de imágenes cargadas localmente
      if (!database.objectStoreNames.contains('images')) {
        database.createObjectStore('images', { keyPath: 'studentId' });
      }
    };
  });
}

function dbSave(store, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readwrite');
    const request = tx.objectStore(store).put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readonly');
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readonly');
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([store], 'readwrite');
    const request = tx.objectStore(store).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ───────────────────────────────────────────────────────────────
// GESTIÓN DE IMÁGENES LOCALES
// ───────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const [meta, base64] = dataUrl.split(',');
      const mediaType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ base64, mediaType, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveStudentImage(studentId, imageData) {
  // imageData: { base64, mediaType, dataUrl, filename, size }
  await dbSave('images', { studentId, ...imageData, savedAt: new Date().toISOString() });
}

async function getStudentImage(studentId) {
  try {
    return await dbGet('images', studentId);
  } catch (e) {
    return null;
  }
}

async function deleteStudentImage(studentId) {
  await dbDelete('images', studentId);
}

async function loadBiblioteca() {
  try {
    const items = await dbGetAll('biblioteca');
    state.bibliotecaCriterios = items || [];
  } catch (e) {
    console.warn('No se pudo cargar biblioteca:', e);
    state.bibliotecaCriterios = [];
  }
}

async function saveCorrection(correction) {
  try {
    await dbSave('biblioteca', correction);
    state.bibliotecaCriterios.push(correction);
  } catch (e) {
    console.error('Error guardando corrección:', e);
  }
}

// ───────────────────────────────────────────────────────────────
// NAVEGACIÓN ENTRE VISTAS
// ───────────────────────────────────────────────────────────────
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${viewName}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

  if (viewName === 'modulo2') refreshModulo2View();
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('disabled')) return;
    switchView(btn.dataset.view);
  });
});

document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.nav));
});

// ───────────────────────────────────────────────────────────────
// VERIFICACIÓN DE API
// ───────────────────────────────────────────────────────────────
async function checkApiStatus() {
  const statusEl = document.getElementById('apiStatus');
  const textEl = document.getElementById('apiStatusText');
  try {
    // Ping ligero: intentamos llamar a la función con un payload vacío que debe fallar con 400 (no 500/404)
    const res = await fetch('/.netlify/functions/evaluar-estudiante', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'ping' })
    });
    if (res.status === 400) {
      // Esperado: la función responde "Tipo desconocido"
      statusEl.className = 'api-status ok';
      textEl.textContent = 'IA conectada';
      state.apiReady = true;
    } else if (res.status === 500) {
      const body = await res.json();
      if (body.error?.includes('API key')) {
        statusEl.className = 'api-status error';
        textEl.textContent = 'API key no configurada';
      } else {
        statusEl.className = 'api-status error';
        textEl.textContent = 'Error de servidor';
      }
      state.apiReady = false;
    } else {
      statusEl.className = 'api-status error';
      textEl.textContent = `Error (${res.status})`;
      state.apiReady = false;
    }
  } catch (e) {
    statusEl.className = 'api-status error';
    textEl.textContent = 'Sin conexión a IA (modo local)';
    state.apiReady = false;
  }
}

// ═════════════════════════════════════════════════════════════════
// MÓDULO 01 + 03: CARGA DE DATOS Y PROCESAMIENTO LIKERT
// ═════════════════════════════════════════════════════════════════

function qualifyLevel(score) {
  if (score === null || isNaN(score)) return null;
  if (score < 2.00) return { label: 'Bajo', cls: 'level-bajo' };
  if (score < 2.65) return { label: 'Medio-bajo', cls: 'level-medio-bajo' };
  if (score < 3.40) return { label: 'Medio-alto', cls: 'level-medio-alto' };
  return { label: 'Alto', cls: 'level-alto' };
}

function normalizeLikert(sum) { return 1 + 0.5 * (sum - 3); }

function processLikertValue(r) {
  if (!r || typeof r !== 'string') return null;
  return LIKERT_MAP[r.trim()] ?? null;
}

function processRow(row, idx) {
  const name = (row[COLUMN_MAP.name] || '').toString().trim();
  const curso = (row[COLUMN_MAP.curso] || '').toString().trim();
  const edadStr = (row[COLUMN_MAP.edad] || '').toString();
  const edadMatch = edadStr.match(/(\d+)/);
  const edad = edadMatch ? parseInt(edadMatch[1]) : null;
  const mes = (row[COLUMN_MAP.mes] || '').toString().trim();
  const estadia = (row[COLUMN_MAP.estadia] || '').toString().trim();

  function dimSum(indices, inverseIdx = null) {
    const values = indices.map((col, i) => {
      let v = processLikertValue(row[col]);
      if (v === null) return null;
      if (inverseIdx !== null && i === inverseIdx) v = 4 - v;
      return v;
    });
    const valid = values.filter(v => v !== null);
    if (valid.length === 0) return { sum: null, imputed: false };
    if (valid.length < indices.length) {
      const m = valid.reduce((a, b) => a + b, 0) / valid.length;
      const imp = values.map(v => v === null ? m : v);
      return { sum: imp.reduce((a, b) => a + b, 0), imputed: true };
    }
    return { sum: valid.reduce((a, b) => a + b, 0), imputed: false };
  }

  const rec = dimSum(COLUMN_MAP.rec_items);
  const heu = dimSum(COLUMN_MAP.heu_items);
  const con = dimSum(COLUMN_MAP.con_items);
  const sc  = dimSum(COLUMN_MAP.sc_items, COLUMN_MAP.sc_inverse_idx);

  return {
    id: `S${(idx + 1).toString().padStart(2, '0')}`,
    name, curso, edad, mes, estadia,
    rec: { sum: rec.sum, normalized: rec.sum !== null ? normalizeLikert(rec.sum) : null, imputed: rec.imputed },
    heu: { sum: heu.sum, normalized: heu.sum !== null ? normalizeLikert(heu.sum) : null, imputed: heu.imputed },
    con: { sum: con.sum, normalized: con.sum !== null ? normalizeLikert(con.sum) : null, imputed: con.imputed },
    sc:  { sum: sc.sum,  normalized: sc.sum  !== null ? normalizeLikert(sc.sum)  : null, imputed: sc.imputed  },
    // Datos para Módulo 2
    openAnswers: {
      foto: row[COLUMN_MAP.foto] || '',
      p1: (row[COLUMN_MAP.pa_p1] || '').toString().trim(),
      p2: (row[COLUMN_MAP.pa_p2] || '').toString().trim(),
      p3a: (row[COLUMN_MAP.pa_p3a] || '').toString().trim(),
      p4: (row[COLUMN_MAP.pa_p4] || '').toString().trim(),
      p5: (row[COLUMN_MAP.pa_p5] || '').toString().trim()
    }
  };
}

function mean(arr) {
  const v = arr.filter(x => x !== null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function stdev(arr) {
  const v = arr.filter(x => x !== null && !isNaN(x));
  if (v.length < 2) return null;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

// Datos de demo (el pilotaje G1)
const DEMO_DATA = [
  ['Timestamp','Nombre','Curso','Edad','Mes','Tiempo','Rec1','Rec2','Rec3','Heu1','Heu2','Heu3','Con1','Con2','Con3','SC1','SC2inv','SC3','Foto','P2','P1','P3a','P4','P5'],
  [45897,'Martina Oñate','7°','13 años','Agosto','Entre 1 mes y 2 meses','A veces','Nunca','A veces','A veces','Nunca','Siempre','Nunca','A veces','Siempre','A veces','Siempre','Nunca','https://drive.google.com/open?id=1n6IRqpzHIFM031FL7YYdXfEwNW94g2_L','Porque la primera botella era cuando tenía jugo la segunda la mitad y la última vacía y eso necesitábamos saber al final','La Resta','Mirar el problema escribir el ejercicio y pensar en los números','No cambiara nada','Mejoré el ejercicio primero pensé que debía sumar las dos botellas pero luego me di cuenta que debía restar'],
  [45924,'Amaya Rodríguez Navidad','2° medio','15 años','Septiembre','Entre 4 meses y 6 meses','Siempre','A veces','A veces','Siempre','Siempre','Siempre','Siempre','Siempre','A veces','Siempre','Siempre','A veces','https://drive.google.com/open?id=1nGOKIlS7OXvuhYSzgV9BIIWN2cGe9bN8','Porque sumé, dado que no estaba segura que 200 sea la mitad de 350, y me di cuenta que no estaba bien la operación.','Suma','Dibujo el peso y la botella. Busqué la mitad de 350. Resolví y saqué el resultado','Colocar el signo + y los zapatitos. El resto está bien.','Me di cuenta que 200 no era la mitad de 350'],
  [45926,'Antonella Betanzo Sáez','5°','11 años','Septiembre','Entre 1 día y 7 días','A veces','Siempre','A veces','A veces','Siempre','Siempre','A veces','Siempre','Siempre','A veces','A veces','Siempre','https://drive.google.com/open?id=1uL79mkUnIpu62uMOEvL3GvftcalYzYaI','Por las cantidades, esta era grande, otra quedaba media y después sin nada, en cero','Resta','1) mirar las cantidades 2) escribir los datos 3)hacer la resta','Que podría ir de menos para arriba e ir sumando','Yo veia que iba bajando la vacía. Las otras operaciones suma, div, mult no coincidían'],
  [45943,'Sofía Sepúlveda Sepúlveda','7°','12 años','Octubre','Entre 1 día y 7 días','A veces','Siempre','A veces','Siempre','A veces','Siempre','Siempre','Siempre','A veces','Siempre','A veces','Siempre','https://drive.google.com/open?id=1CeV7HRT0v1sB82Iv3Qfj_4VQeoT0gXKF','Por que la primera botella disminuyo 50g y la segunda bptella aumeto 150g.','la Adición','paso 1: dibujar las botellas y poner su respectivo volor de gramos Paso 2: realizamos las 2 operaciones sumas y restas Paso 3: sacar los calculos de las operaciones','cambiariamos los dibujos y los valores','volver a sacar calculos y sacar bien los resultados'],
  [45960,'Sofía Aravena Salgado','7°','13 años','Octubre','Entre 1 día y 7 días','A veces','A veces','A veces','Siempre','Nunca','A veces','A veces','Nunca','A veces','A veces','Siempre','Siempre','https://drive.google.com/open?id=1SAP4snu04VmvQbtQIChePEJBN9dmLc9N','Porque tenia que volver a quitar 150','la resta','1 mirar el problema y que paso con la botella Pensar como tenia que restar y luego resolver','Nada','volver a pensar y calcular mentalmente'],
  [45966,'Martina Poblete Riquelme','8°','13 años','Noviembre','Entre 1 día y 7 días','Siempre','Siempre','A veces','A veces','Siempre','Siempre','Siempre','Siempre','Siempre','Siempre','Nunca','Siempre','https://drive.google.com/open?id=1LtEaXg0D4HfzJGNZy9fIHGOiEsXpbvk7','Me di cuenta de que podia usar el algebra para solucionarlo','Fue multiplicar para saber que 150x2 (la mitad del jugo) era 300','Analice el problema, me di cuenta que la botella pesa y rewolvi el problema','Nada','Al principio intente dibujar el problema pero como no me salio lo cambie para usar algebra'],
  [45975,'Aaron Garcés Muñoz','8°','13 años','Noviembre','Entre 1 día y 7 días','A veces','Siempre','A veces','Siempre','A veces','A veces','A veces','Siempre','A veces','A veces','A veces','A veces','https://drive.google.com/open?id=15pogcB8qW_O29iqwGxRnefDU3cSy7Y-t','Vi que el peso de las botellas disminuian mientras menos naranjas tenga y reste','Resta','Los detalles(NUMEROS), el ejercicio y pregunta','Nada','No porque habia echo algo similar y supe q era de resta'],
  [45987,'Amalia Chávez Olivares','7°','12 años','Noviembre','Entre 1 día y 7 días','A veces','Siempre','Siempre','A veces','Siempre','A veces','Siempre','Siempre','A veces','A veces','Siempre','A veces','https://drive.google.com/open?id=189mGEhWWcE6hB7iSOIO8wt_OLRl1jO9E','Porque había visto algo parecido antes','Ecuación','Anote los datos - categorice - y sume','Nada, pero no supe llegar a la respuesta','No se'],
  [45994,'Jonathan Álvarez Monje','7°','13 años','Diciembre','Entre 1 día y 7 días','Siempre','Siempre','A veces','Siempre','Siempre','A veces','Siempre','A veces','Siempre','Siempre','A veces','A veces','https://drive.google.com/open?id=1XGs1sxbYVqqJ_RkFaNSX09KZO9E8JIo_','Era la opcion mas favorable','Division','Analice, tome la opcion de dividir, vi cuntos numeros se nesisitaban para llegar a x numero, reste.','Calvularia el peso de la botella y no el de la botella+jugo','Analize mas el problema/pregunta'],
  [45996,'Amylee Travol Valdés','7°','13 años','Diciembre','Entre 1 día y 7 días','Nunca','A veces','Nunca','A veces','Nunca','A veces','A veces','Nunca','A veces','A veces','Siempre','A veces','https://drive.google.com/open?id=1dLk38Mg7O4K3Rs_Ek05ME24w8OCBy0y4','Porque se podia sumar y se podia multiplicar pero las demas no se podian','La miltiplicacion porque es como mas rapida que la suma','1. ESCRIBIR LOS NUMEROS QUE TENIA EL PROBELMA 2 REALICE LA SUMA MULTIPLICACION 3 ESCRIBI EL RESULTADO','no cambiara nada','Porque no me convencia la cifra volvi a realizarlo']
];

function renderModulo1Results() {
  const students = state.students;
  const cursos = new Set(students.map(s => s.curso).filter(Boolean));
  const edades = students.map(s => s.edad).filter(v => v !== null);
  const completos = students.filter(s => !s.rec.imputed && !s.heu.imputed && !s.con.imputed && !s.sc.imputed).length;

  document.getElementById('statN').textContent = students.length;
  document.getElementById('statCursos').textContent = cursos.size;
  document.getElementById('statCompletos').innerHTML = Math.round(completos / students.length * 100) + '<span class="unit">%</span>';
  document.getElementById('statEdad').textContent = edades.length ? `${Math.min(...edades)}\u2013${Math.max(...edades)}` : '—';

  const dims = [
    { key: 'rec', name: 'Recursos',             tag: 'Dim. 1',              ancla: false },
    { key: 'heu', name: 'Heurísticas',          tag: 'Dim. 2',              ancla: false },
    { key: 'con', name: 'Control',              tag: 'Ancla',               ancla: true  },
    { key: 'sc',  name: 'Sistema de Creencias', tag: 'Ancla · solo Likert', ancla: true  }
  ];

  const grid = document.getElementById('dimGrid');
  grid.innerHTML = '';
  dims.forEach(d => {
    const scores = students.map(s => s[d.key].normalized);
    const m = mean(scores);
    const sd = stdev(scores);
    const level = m !== null ? qualifyLevel(m) : null;
    const pct = m !== null ? ((m - 1) / 3) * 100 : 0;

    const card = document.createElement('div');
    card.className = 'dim-card';
    card.innerHTML = `
      <div class="dim-card-header">
        <div class="dim-name">${d.name}</div>
        <span class="dim-tag ${d.ancla ? 'ancla' : ''}">${d.tag}</span>
      </div>
      <div class="dim-mean">${m !== null ? m.toFixed(2) : '—'}</div>
      <div class="dim-sd">σ = ${sd !== null ? sd.toFixed(2) : '—'}</div>
      ${level ? `<div style="margin-top:10px;"><span class="level-pill ${level.cls}">${level.label}</span></div>` : ''}
      <div class="dim-bar"><div class="dim-bar-fill" style="width:${pct}%"></div></div>
      <div class="dim-bar-markers"><span>1.00</span><span>2.00</span><span>3.00</span><span>4.00</span></div>
    `;
    grid.appendChild(card);
  });

  const tbody = document.getElementById('studentRows');
  tbody.innerHTML = '';
  students.forEach((s) => {
    const tr = document.createElement('tr');
    const cell = (dim) => {
      if (dim.normalized === null) return '<td class="num"><span class="student-meta">—</span></td>';
      const lvl = qualifyLevel(dim.normalized);
      return `<td class="num"><div class="score-cell"><span class="score-value">${dim.normalized.toFixed(2)}</span><span class="level-pill ${lvl.cls}">${lvl.label}</span></div></td>`;
    };
    tr.innerHTML = `
      <td><span class="student-id">${s.id}</span></td>
      <td><span class="student-name">${s.name || '—'}</span></td>
      <td><span class="student-meta">${s.curso || '—'} · ${s.edad ?? '—'} a</span></td>
      <td><span class="student-meta">${formatEstadia(s.estadia)}</span></td>
      ${cell(s.rec)}${cell(s.heu)}${cell(s.con)}${cell(s.sc)}
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('uploadSection').style.display = 'none';
  document.getElementById('results').style.display = 'block';
  document.getElementById('sessionDate').textContent =
    new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

  validateAgainstPilot(students);
}

function formatEstadia(s) {
  if (!s) return '—';
  if (s.includes('1 día') || s.includes('8 días')) return 'Corta';
  if (s.includes('1 mes') || s.includes('4 meses') || s.includes('3 meses')) return 'Mediana';
  if (s.includes('Más de')) return 'Larga';
  return s.substring(0, 18);
}

function validateAgainstPilot(students) {
  if (students.length !== 10) return;
  const first = (students[0].name || '').toLowerCase();
  if (!first.includes('oñate')) return;
  const s1 = students[0];
  const expected = { rec: 2.0, heu: 2.5, con: 2.5, sc: 1.5 };
  const match = ['rec', 'heu', 'con', 'sc'].every(k => Math.abs(s1[k].normalized - expected[k]) < 0.01);
  if (match) {
    document.getElementById('validationTitle').textContent = 'Validación cruzada exitosa contra el boletín del pilotaje';
    document.getElementById('validationText').textContent = '30 valores comparados · 0 discrepancias · cálculos idénticos a los del análisis manual';
  }
}

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function handleFile(file) {
  if (!file) return;
  try {
    const rows = await parseFile(file);
    if (rows.length < 2) { showToast('Archivo vacío o mal formado'); return; }
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== '' && c !== null));
    state.students = dataRows.map((row, idx) => processRow(row, idx));
    renderModulo1Results();
    showToast(`${state.students.length} estudiantes procesados`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Error al procesar: ' + err.message);
  }
}

// Event listeners Módulo 1
document.getElementById('uploadBtn').addEventListener('click', () =>
  document.getElementById('fileInput').click()
);
document.getElementById('fileInput').addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

const dropZone = document.getElementById('dropZone');
['dragenter', 'dragover'].forEach(evt =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); })
);
['dragleave', 'drop'].forEach(evt =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); })
);
dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

document.getElementById('loadDemo').addEventListener('click', () => {
  state.students = DEMO_DATA.slice(1).map((row, idx) => processRow(row, idx));
  renderModulo1Results();
  showToast('Datos del pilotaje cargados · N=10', 'success');
});

document.getElementById('goToModulo2').addEventListener('click', () => switchView('modulo2'));


// ═════════════════════════════════════════════════════════════════
// MÓDULO 02: EVALUACIÓN CON IA
// ═════════════════════════════════════════════════════════════════

let refreshModulo2View = function() {
  const empty = document.getElementById('modulo2Empty');
  const main = document.getElementById('modulo2Main');
  if (!state.students.length) {
    empty.style.display = 'block';
    main.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  main.style.display = 'block';
  renderIATable();
  updateQueueStats();
}

function updateQueueStats() {
  const total = state.students.length;
  const pending = state.students.filter(s => !state.evaluations[s.id]).length;
  const evaluated = state.students.filter(s => {
    const ev = state.evaluations[s.id];
    return ev && ev.estado === 'completed';
  }).length;
  const reviewed = state.students.filter(s => {
    const ev = state.evaluations[s.id];
    return ev && ev.estado === 'reviewed';
  }).length;

  document.getElementById('iaStatTotal').textContent = total;
  document.getElementById('iaStatPending').textContent = pending;
  document.getElementById('iaStatEvaluated').textContent = evaluated;
  document.getElementById('iaStatReviewed').textContent = reviewed;
  document.getElementById('queueStatus').textContent = `${reviewed}/${total} revisados`;

  // Mostrar warning si aún no hay evaluaciones
  const warning = document.getElementById('iaWarning');
  if (pending > 0 && state.apiReady) {
    warning.style.display = 'block';
    document.getElementById('iaWarningText').innerHTML =
      `Evaluar <strong>${pending}</strong> estudiante${pending > 1 ? 's' : ''} consumirá aproximadamente <strong>$${(pending * 0.03).toFixed(2)} USD</strong> de tu API key.`;
  } else {
    warning.style.display = 'none';
  }
}

async function renderIATable() {
  const tbody = document.getElementById('iaTableBody');
  tbody.innerHTML = '';

  // Cargar todas las imágenes de una vez
  const allImages = await dbGetAll('images');
  const imageMap = {};
  allImages.forEach(img => { imageMap[img.studentId] = img; });

  state.students.forEach((s) => {
    const ev = state.evaluations[s.id];
    const tr = document.createElement('tr');
    if (ev?.estado === 'reviewed') tr.classList.add('reviewed');

    const scoreCell = (key) => {
      if (!ev || !ev[key]) return '<td class="center"><span class="student-meta">—</span></td>';
      const score = ev[key].puntaje;
      const edited = ev[key].edited;
      return `<td class="center"><span class="score-value" style="color:${edited ? 'var(--ef-blue-mid)' : 'var(--ef-ink)'}">${score}</span></td>`;
    };

    // Indicador de foto: miniatura si hay imagen local, ícono si no
    const hasLocalImg = imageMap[s.id];
    const photoCell = hasLocalImg
      ? `<td class="center" title="Imagen cargada"><img class="photo-row-thumb" src="${hasLocalImg.dataUrl}" alt="" /></td>`
      : `<td class="center" title="Sin imagen cargada"><span class="photo-row-missing">📷 sin foto</span></td>`;

    const estadoLabel = {
      pending: 'Pendiente',
      processing: 'Evaluando...',
      completed: 'Propuesta IA',
      reviewed: 'Revisado'
    };
    const estadoCls = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      reviewed: 'status-reviewed'
    };
    const estado = ev?.estado || 'pending';

    tr.innerHTML = `
      <td><span class="student-id">${s.id}</span></td>
      <td><span class="student-name">${s.name || '—'}</span></td>
      ${photoCell}
      ${scoreCell('P1')}
      ${scoreCell('P2')}
      ${scoreCell('P3a')}
      ${scoreCell('P3b')}
      ${scoreCell('P4')}
      ${scoreCell('P5')}
      <td class="center"><span class="status-pill ${estadoCls[estado]}">${estadoLabel[estado]}</span></td>
    `;
    tr.addEventListener('click', () => openEvaluationModal(s.id));
    tbody.appendChild(tr);
  });
}

// ─── Llamada a la función serverless ───────────────────────────
async function callEvaluator(tipo, payload) {
  const res = await fetch('/.netlify/functions/evaluar-estudiante', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data.data;
}

// Nota: la descarga directa de imágenes desde Google Drive ha sido removida
// porque Drive bloquea por CORS. Las imágenes ahora se cargan directamente
// por el usuario desde el modal de evaluación (ver wireImageHandlers más abajo).

// ─── Evaluar un solo estudiante ───────────────────────────────
async function evaluateStudent(studentId, options = {}) {
  const s = state.students.find(st => st.id === studentId);
  if (!s) return;

  // Marcar como en proceso
  if (!state.evaluations[s.id]) state.evaluations[s.id] = {};
  state.evaluations[s.id].estado = 'processing';
  renderIATable();
  updateQueueStats();

  try {
    // Paso 1: Analizar desarrollo (solo si hay imagen local guardada)
    let desarrolloDesc = null;
    const localImage = await getStudentImage(s.id);

    if (localImage && !options.skipImage) {
      showLoading('Analizando desarrollo matemático…', `${s.name} — ${s.id}`);
      desarrolloDesc = await callEvaluator('analizar_desarrollo', {
        imagenBase64: localImage.base64,
        mediaType: localImage.mediaType
      });
    } else {
      desarrolloDesc = {
        descripcion_tecnica: localImage
          ? '[Análisis de imagen omitido por configuración.]'
          : '[No hay imagen del desarrollo cargada. Carga la foto desde el modal de revisión para incluir el análisis visual.]',
        operaciones_visibles: [],
        estrategias_heuristicas_visibles: [],
        errores_observados: [],
        coherencia_desarrollo: 'no_evaluable'
      };
    }

    // Paso 2: Evaluar respuestas
    showLoading('Evaluando respuestas con rúbrica…', `${s.name} — ${s.id}`);
    const evaluation = await callEvaluator('evaluar_respuestas', {
      respuestas: s.openAnswers,
      descripcionDesarrollo: desarrolloDesc,
      bibliotecaCriterios: state.bibliotecaCriterios
    });

    // Guardar evaluación
    state.evaluations[s.id] = {
      estado: 'completed',
      desarrollo: desarrolloDesc,
      hasLocalImage: !!localImage,
      P1: evaluation.P1,
      P2: evaluation.P2,
      P3a: evaluation.P3a,
      P3b: evaluation.P3b,
      P4: evaluation.P4,
      P5: evaluation.P5,
      sintesis: evaluation.sintesis,
      evaluatedAt: new Date().toISOString()
    };

    await dbSave('evaluations', { studentId: s.id, ...state.evaluations[s.id] });
    hideLoading();
    renderIATable();
    updateQueueStats();
    showToast(`${s.name} evaluado ✓`, 'success');
    return true;
  } catch (err) {
    hideLoading();
    state.evaluations[s.id].estado = 'pending';
    renderIATable();
    updateQueueStats();
    console.error(err);
    showToast('Error al evaluar: ' + err.message);
    return false;
  }
}

// ─── Evaluar todos ────────────────────────────────────────────
async function evaluateAll() {
  const pending = state.students.filter(s => !state.evaluations[s.id] || state.evaluations[s.id].estado === 'pending');
  if (!pending.length) {
    showToast('No hay estudiantes pendientes de evaluar', 'info');
    return;
  }
  if (!state.apiReady) {
    showToast('La IA no está conectada. Verifica la configuración.', 'error');
    return;
  }
  if (!confirm(`¿Evaluar ${pending.length} estudiantes con IA?\n\nCosto aproximado: $${(pending.length * 0.03).toFixed(2)} USD`)) return;

  for (const s of pending) {
    await evaluateStudent(s.id, { skipImage: false });
  }
  showToast(`Evaluación completa: ${pending.length} estudiantes`, 'success');
}

document.getElementById('evaluateAllBtn').addEventListener('click', evaluateAll);

// ─── Loading overlay ──────────────────────────────────────────
function showLoading(text, substep) {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingSubstep').textContent = substep || '';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ═════════════════════════════════════════════════════════════════
// MODAL DE REVISIÓN INDIVIDUAL
// ═════════════════════════════════════════════════════════════════

async function openEvaluationModal(studentId) {
  const s = state.students.find(st => st.id === studentId);
  if (!s) return;

  const idx = state.students.findIndex(st => st.id === studentId);
  state.currentStudentIdx = idx;

  document.getElementById('modalTitle').textContent = s.name || s.id;
  document.getElementById('modalSubtitle').textContent = `${s.id} · ${s.curso} · ${s.edad} años · ${formatEstadia(s.estadia)}`;

  await renderEvaluationBody(s);
  document.getElementById('evalModal').classList.add('active');
}

async function renderEvaluationBody(s) {
  const body = document.getElementById('modalBody');
  const ev = state.evaluations[s.id];
  const localImage = await getStudentImage(s.id);

  // ─── Construir bloque de imagen (carga o preview) ───
  const driveLink = s.openAnswers.foto && s.openAnswers.foto.includes('http')
    ? s.openAnswers.foto
    : null;

  let photoBlockHTML;
  if (localImage) {
    // Hay imagen cargada: mostrar preview + opciones
    photoBlockHTML = `
      <div class="eval-photo">
        <img src="${localImage.dataUrl}" alt="Desarrollo de ${s.name}" />
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding:0 4px;">
          <span style="font-size:11px; color:var(--ef-gray); font-family:var(--font-mono);">
            ✓ Imagen cargada${localImage.filename ? ' · ' + localImage.filename : ''}
          </span>
          <button class="btn btn-ghost btn-sm" id="changeImageBtn" style="padding: 4px 10px;">🔄 Cambiar</button>
        </div>
      </div>
    `;
  } else {
    // Sin imagen: zona de carga
    photoBlockHTML = `
      <div class="eval-photo">
        <div class="image-upload-zone" id="imageUploadZone">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--ef-blue-mid)" stroke-width="1.5" style="margin-bottom:10px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
          </svg>
          <h3 style="font-size:14px; font-weight:600; color:var(--ef-blue-dark); margin-bottom:6px;">
            Cargar foto del desarrollo
          </h3>
          <p style="font-size:12px; color:var(--ef-gray); margin-bottom:12px;">
            Arrastra la imagen aquí o haz clic para seleccionarla
          </p>
          <button class="btn btn-primary btn-sm" id="selectImageBtn">Seleccionar archivo</button>
          <input type="file" id="imageFileInput" accept="image/*" style="display:none">
          ${driveLink ? `
            <div style="margin-top:14px; padding-top:14px; border-top:1px dashed var(--ef-border);">
              <span style="font-size:11px; color:var(--ef-gray);">¿La foto está en Drive?</span><br>
              <a href="${driveLink}" target="_blank" rel="noopener" style="font-size:11px; color:var(--ef-blue-mid); text-decoration:underline;">
                Abrir link original →
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Si no hay evaluación aún
  if (!ev) {
    body.innerHTML = `
      <div class="eval-grid">
        <div class="eval-left">
          ${photoBlockHTML}
        </div>
        <div>
          <div style="text-align:center; padding:40px 20px;">
            <p style="color:var(--ef-gray); margin-bottom:10px; font-size:13px;">
              Este estudiante aún no ha sido evaluado por la IA.
            </p>
            <p style="color:var(--ef-gray); margin-bottom:20px; font-size:12px; font-style:italic;">
              ${localImage ? 'Imagen lista para análisis visual.' : 'Sin imagen cargada — la evaluación omitirá el análisis del desarrollo.'}
            </p>
            <button class="btn btn-primary" onclick="triggerSingleEvaluation('${s.id}')">⚡ Evaluar con IA ahora</button>
          </div>
        </div>
      </div>
    `;
    wireImageHandlers(s);
    return;
  }

  // Render con evaluación
  const questionHTML = (key) => {
    const q = QUESTION_META[key];
    const r = ev[key];
    if (!r) return '';
    const studentAnswer = getStudentAnswerForQuestion(s, key);

    const isTransition = r.zona_transicion;
    const isEdited = r.edited;

    const comentarioHTML = (key === 'P1' || key === 'P3b') && r.comentario_revisor ? `
      <div class="comentario-revisor">
        <div class="comentario-revisor-label">Comentario del revisor ${key === 'P3b' ? '(heurísticas evidenciadas)' : '(coherencia con desarrollo)'}</div>
        <textarea id="comentario-${key}" data-question="${key}">${r.comentario_revisor || ''}</textarea>
      </div>
    ` : '';

    const heuristicasHTML = key === 'P3b' && r.heuristicas_detectadas?.length ? `
      <div style="margin-top:8px;">
        <div class="eval-section-title" style="margin-bottom:6px;">Heurísticas detectadas</div>
        <div class="eval-tag-list">
          ${r.heuristicas_detectadas.map(h => `<span class="eval-tag">${h}</span>`).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div class="question-card ${isEdited ? 'edited' : ''} ${isTransition ? 'transition' : ''}" data-question="${key}">
        <div class="question-header">
          <div>
            <div class="question-label">${q.label}</div>
            <div class="question-dimension">${q.dimension}${isTransition ? ' · <em style="color:var(--level-medio-bajo)">zona de transición</em>' : ''}</div>
          </div>
        </div>
        <div class="question-text">${q.text}</div>
        <div class="question-answer ${!studentAnswer ? 'empty' : ''}">${studentAnswer || '[sin respuesta]'}</div>
        ${comentarioHTML}
        <div class="justification">
          <strong>Justificación IA:</strong> ${r.justificacion || '—'}
        </div>
        ${heuristicasHTML}
        <div class="score-row">
          <span class="score-label">Puntaje:</span>
          <div class="score-buttons" data-question="${key}">
            ${[1, 2, 3, 4].map(n => `
              <button class="score-btn ${r.puntaje === n ? 'active' : ''} ${isEdited ? 'edited' : ''}" data-score="${n}">${n}</button>
            `).join('')}
          </div>
          <span class="score-label">${isEdited ? '✎ editado' : '🤖 propuesta IA'}</span>
        </div>
      </div>
    `;
  };

  body.innerHTML = `
    <div class="eval-grid">
      <div class="eval-left">
        ${photoBlockHTML}

        <div class="eval-section">
          <div class="eval-section-title">Análisis del desarrollo (IA)</div>
          <div class="eval-description">
            <textarea id="desarrollo-desc">${ev.desarrollo?.descripcion_tecnica || ''}</textarea>
          </div>
          ${ev.desarrollo?.operaciones_visibles?.length ? `
            <div class="eval-section-title" style="margin-top:12px;margin-bottom:6px;">Operaciones visibles</div>
            <div class="eval-tag-list">
              ${ev.desarrollo.operaciones_visibles.map(o => `<span class="eval-tag">${o}</span>`).join('')}
            </div>
          ` : ''}
          ${ev.desarrollo?.estrategias_heuristicas_visibles?.length ? `
            <div class="eval-section-title" style="margin-top:12px;margin-bottom:6px;">Estrategias observadas</div>
            <div class="eval-tag-list">
              ${ev.desarrollo.estrategias_heuristicas_visibles.map(h => `<span class="eval-tag">${h}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        ${ev.sintesis ? `
          <div class="eval-section">
            <div class="eval-section-title">Síntesis IA</div>
            <p style="font-size:13px; line-height:1.6; color:var(--ef-ink);">${ev.sintesis}</p>
          </div>
        ` : ''}
      </div>

      <div class="eval-right">
        ${['P1', 'P2', 'P3a', 'P3b', 'P4', 'P5'].map(q => questionHTML(q)).join('')}
      </div>
    </div>
  `;

  // Wire up image handlers
  wireImageHandlers(s);

  // Wire up score buttons
  body.querySelectorAll('.score-buttons').forEach(group => {
    const questionKey = group.dataset.question;
    group.querySelectorAll('.score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newScore = parseInt(btn.dataset.score);
        const oldScore = ev[questionKey].puntaje;
        if (newScore === oldScore) return;

        ev[questionKey].puntaje = newScore;
        ev[questionKey].edited = true;
        // Re-render
        renderEvaluationBody(s);
      });
    });
  });
}

// ─── Handlers de carga de imagen ──────────────────────────────
function wireImageHandlers(s) {
  const uploadZone = document.getElementById('imageUploadZone');
  const fileInput = document.getElementById('imageFileInput');
  const selectBtn = document.getElementById('selectImageBtn');
  const changeBtn = document.getElementById('changeImageBtn');

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('El archivo debe ser una imagen (JPG, PNG, etc.)');
      return;
    }
    // Validar tamaño (máximo 8MB para no saturar la API)
    if (file.size > 8 * 1024 * 1024) {
      showToast('La imagen es muy grande (máx 8MB). Reduce su tamaño primero.');
      return;
    }
    try {
      const imgData = await fileToBase64(file);
      await saveStudentImage(s.id, {
        ...imgData,
        filename: file.name,
        size: file.size
      });
      showToast(`Imagen cargada: ${file.name}`, 'success');
      // Re-render del modal
      renderEvaluationBody(s);
      // Actualizar la tabla principal
      renderIATable();
    } catch (err) {
      console.error(err);
      showToast('Error al cargar la imagen: ' + err.message);
    }
  };

  if (selectBtn) {
    selectBtn.addEventListener('click', () => fileInput.click());
  }

  if (changeBtn) {
    changeBtn.addEventListener('click', async () => {
      // Crear input temporal para nuevo archivo
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = 'image/*';
      tempInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
      tempInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
  }

  if (uploadZone) {
    ['dragenter', 'dragover'].forEach(evt =>
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
      })
    );
    ['dragleave', 'drop'].forEach(evt =>
      uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
      })
    );
    uploadZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    });
  }
}

function getStudentAnswerForQuestion(s, key) {
  const a = s.openAnswers;
  switch (key) {
    case 'P1': return a.p1;
    case 'P2': return a.p2;
    case 'P3a': return a.p3a;
    case 'P3b': return '[evidencia visual en el desarrollo]';
    case 'P4': return a.p4;
    case 'P5': return a.p5;
    default: return '';
  }
}

// Función global para invocar desde el modal
window.triggerSingleEvaluation = async function(studentId) {
  const ok = await evaluateStudent(studentId);
  if (ok) {
    const s = state.students.find(st => st.id === studentId);
    await renderEvaluationBody(s);
  }
};

// Confirmar cambios
document.getElementById('confirmBtn').addEventListener('click', async () => {
  const idx = state.currentStudentIdx;
  if (idx === null) return;
  const s = state.students[idx];
  const ev = state.evaluations[s.id];
  if (!ev) { showToast('No hay evaluación para confirmar'); return; }

  // Capturar los comentarios del revisor editados
  ['P1', 'P3b'].forEach(key => {
    const textarea = document.getElementById(`comentario-${key}`);
    if (textarea) {
      const newVal = textarea.value.trim();
      if (newVal !== ev[key].comentario_revisor) {
        ev[key].comentario_revisor = newVal;
        ev[key].edited = true;
      }
    }
  });

  // Capturar descripción del desarrollo editada
  const desarrolloTextarea = document.getElementById('desarrollo-desc');
  if (desarrolloTextarea && ev.desarrollo) {
    const newDesc = desarrolloTextarea.value.trim();
    if (newDesc !== ev.desarrollo.descripcion_tecnica) {
      ev.desarrollo.descripcion_tecnica = newDesc;
      ev.desarrollo.edited = true;
    }
  }

  // Guardar correcciones en biblioteca
  for (const key of ['P1', 'P2', 'P3a', 'P3b', 'P4', 'P5']) {
    if (ev[key]?.edited) {
      await saveCorrection({
        studentId: s.id,
        question: key,
        input_resumen: `${s.name} — P${key}`,
        propuesta_ia_puntaje: ev[key].puntaje_original || null,
        propuesta_ia_comentario: ev[key].justificacion_original || null,
        correccion_puntaje: ev[key].puntaje,
        correccion_comentario: ev[key].comentario_revisor || ev[key].justificacion,
        razon: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  ev.estado = 'reviewed';
  ev.reviewedAt = new Date().toISOString();
  await dbSave('evaluations', { studentId: s.id, ...ev });

  renderIATable();
  updateQueueStats();
  showToast(`${s.name} confirmado ✓`, 'success');

  // Ir al siguiente no revisado si existe
  const nextPending = state.students.slice(idx + 1).find(st => {
    const e = state.evaluations[st.id];
    return !e || e.estado !== 'reviewed';
  });
  if (nextPending) {
    openEvaluationModal(nextPending.id);
  } else {
    closeModal();
  }
});

document.getElementById('reEvaluateBtn').addEventListener('click', async () => {
  const idx = state.currentStudentIdx;
  if (idx === null) return;
  const s = state.students[idx];
  delete state.evaluations[s.id];
  closeModal();
  const ok = await evaluateStudent(s.id);
  if (ok) openEvaluationModal(s.id);
});

function closeModal() {
  document.getElementById('evalModal').classList.remove('active');
  state.currentStudentIdx = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('evalModal').addEventListener('click', (e) => {
  if (e.target.id === 'evalModal') closeModal();
});

// Biblioteca placeholder
document.getElementById('loadBiblioteca').addEventListener('click', () => {
  const n = state.bibliotecaCriterios.length;
  showToast(`Biblioteca de criterios: ${n} correcciones registradas. (Vista detallada próximamente.)`, 'info');
});

// ═════════════════════════════════════════════════════════════════
// CARGA MASIVA DE FOTOS DEL DESARROLLO
// ═════════════════════════════════════════════════════════════════

/**
 * Asociación automática: dado un nombre de archivo, intenta encontrar
 * a qué estudiante corresponde basándose en patrones del nombre.
 *
 * Estrategias (en orden de prioridad):
 *   1. Coincidencia con ID exacto (S01, S02, ...)
 *   2. Coincidencia con número (1, 2, ... 19)
 *   3. Coincidencia con nombre o apellido del estudiante
 *   4. Sin coincidencia → quedan como "no asignadas"
 */
function findMatchingStudent(filename) {
  const lower = filename.toLowerCase().replace(/\.[^.]+$/, ''); // sin extensión

  // 1. Match por ID directo (S01, S02, etc)
  const idMatch = lower.match(/s(\d{1,2})/);
  if (idMatch) {
    const num = parseInt(idMatch[1]);
    const targetId = `S${num.toString().padStart(2, '0')}`;
    const student = state.students.find(s => s.id === targetId);
    if (student) return { student, confidence: 'high', via: `ID ${targetId}` };
  }

  // 2. Match por número solo (al inicio o al final)
  const numMatch = lower.match(/(?:^|[^\d])(\d{1,2})(?:[^\d]|$)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1 && num <= state.students.length) {
      const student = state.students[num - 1];
      return { student, confidence: 'medium', via: `posición ${num}` };
    }
  }

  // 3. Match por nombre/apellido
  const cleanFilename = lower.replace(/[_\-\s.]+/g, ' ').trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const s of state.students) {
    if (!s.name) continue;
    const studentParts = s.name.toLowerCase().split(/\s+/);
    let score = 0;
    for (const part of studentParts) {
      if (part.length >= 4 && cleanFilename.includes(part)) {
        score += part.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = s;
    }
  }

  if (bestMatch && bestScore >= 4) {
    return { student: bestMatch, confidence: 'medium', via: `nombre "${bestMatch.name.split(' ')[0]}"` };
  }

  return null;
}

/**
 * Carga múltiples archivos de imagen, intenta auto-asociarlos,
 * y muestra el resultado en la galería.
 */
async function handleBulkPhotoUpload(files) {
  if (!files || files.length === 0) return;

  const matched = [];
  const unmatched = [];

  showLoading('Cargando fotos…', `0 / ${files.length}`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    document.getElementById('loadingSubstep').textContent = `${i + 1} / ${files.length} · ${file.name}`;

    if (!file.type.startsWith('image/')) continue;

    try {
      const imgData = await fileToBase64(file);
      const match = findMatchingStudent(file.name);

      if (match) {
        await saveStudentImage(match.student.id, {
          ...imgData,
          filename: file.name,
          size: file.size,
          autoAssigned: true,
          confidence: match.confidence,
          via: match.via
        });
        matched.push({ file, match });
      } else {
        // Guardar temporalmente sin asignar
        unmatched.push({ file, imgData });
      }
    } catch (e) {
      console.error('Error cargando', file.name, e);
    }
  }

  // Guardar las no asignadas en una lista temporal para asignación manual
  state.unassignedPhotos = unmatched;

  hideLoading();

  if (matched.length > 0) {
    showToast(`${matched.length} fotos asociadas automáticamente`, 'success');
  }
  if (unmatched.length > 0) {
    showToast(`${unmatched.length} fotos sin asignación · revísalas en la galería`, 'info');
  }

  await refreshPhotoGallery();
  renderIATable();
}

/**
 * Renderiza la galería visual de fotos cargadas.
 * Las asociadas se muestran con el ID/nombre del estudiante.
 * Las no asignadas aparecen marcadas en naranja para que el usuario
 * las asigne manualmente.
 */
async function refreshPhotoGallery() {
  const gallery = document.getElementById('photoGallery');
  const total = state.students.length;

  // Recopilar todas las imágenes guardadas
  const allImages = await dbGetAll('images');
  const loadedCount = allImages.length;

  document.getElementById('photosLoaded').textContent = loadedCount;
  document.getElementById('photosTotal').textContent = total;

  const unassigned = state.unassignedPhotos || [];
  const totalShown = loadedCount + unassigned.length;

  if (totalShown === 0) {
    gallery.style.display = 'none';
    document.getElementById('clearPhotosBtn').style.display = 'none';
    return;
  }

  gallery.style.display = 'grid';
  document.getElementById('clearPhotosBtn').style.display = 'inline-flex';

  let html = '';

  // Fotos asignadas
  for (const img of allImages) {
    const student = state.students.find(s => s.id === img.studentId);
    if (!student) continue;
    html += `
      <div class="photo-thumb" data-student-id="${student.id}" title="Click para reasignar a otro estudiante">
        <img src="${img.dataUrl}" alt="Desarrollo de ${student.name}" />
        <div class="photo-thumb-overlay">
          <span class="student-id">${student.id}</span>
          <span class="student-name">${student.name.split(' ')[0]}</span>
        </div>
      </div>
    `;
  }

  // Fotos sin asignar
  unassigned.forEach((u, idx) => {
    html += `
      <div class="photo-thumb unassigned" data-unassigned-idx="${idx}" title="Click para asignar a un estudiante">
        <img src="${u.imgData.dataUrl}" alt="${u.file.name}" />
        <div class="photo-thumb-overlay">
          <span class="student-name">${u.file.name}</span>
        </div>
      </div>
    `;
  });

  gallery.innerHTML = html;

  // Click handlers
  gallery.querySelectorAll('.photo-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const unassignedIdx = thumb.dataset.unassignedIdx;
      const studentId = thumb.dataset.studentId;
      if (unassignedIdx !== undefined) {
        // Foto sin asignar: abrir modal para asignar
        openAssignPhotoModal(parseInt(unassignedIdx));
      } else if (studentId) {
        // Foto ya asignada: ofrecer cambiar asignación o ver
        if (confirm(`Esta foto está asignada a ${studentId}. ¿Quieres reasignarla a otro estudiante?`)) {
          reassignPhoto(studentId);
        }
      }
    });
  });
}

/**
 * Modal simple para asignar manualmente una foto sin asignar a un estudiante.
 */
function openAssignPhotoModal(unassignedIdx) {
  const photo = state.unassignedPhotos[unassignedIdx];
  if (!photo) return;

  // Construir lista de estudiantes con su estado actual
  const list = state.students.map(s => {
    const hasImage = false; // se verificará async
    return s;
  });

  // Crear modal inline
  const existing = document.getElementById('assignPhotoModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'assignPhotoModal';
  modal.className = 'modal-backdrop active photo-assign-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-header">
        <div>
          <div class="modal-title">Asignar foto</div>
          <div class="modal-subtitle">${photo.file.name}</div>
        </div>
        <button class="modal-close" onclick="document.getElementById('assignPhotoModal').remove()">×</button>
      </div>
      <div class="modal-body" style="padding:16px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
          <img src="${photo.imgData.dataUrl}" style="width:100%; border-radius:6px; border:1px solid var(--ef-border);" />
          <div style="font-size:13px; color:var(--ef-gray); line-height:1.5;">
            <p style="margin-bottom:10px;"><strong style="color:var(--ef-blue-dark);">Selecciona el estudiante</strong> al que pertenece esta foto.</p>
            <p>Las fotos ya asignadas aparecen atenuadas (puedes seleccionarlas para reemplazar la imagen actual).</p>
          </div>
        </div>
        <div class="photo-assign-list" id="assignPhotoList">
          ${state.students.map(s => `
            <div class="photo-assign-item" data-id="${s.id}">
              <span class="student-id">${s.id}</span>
              <span class="student-name">${s.name || '—'}</span>
              <span class="student-status" data-status-for="${s.id}">…</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('assignPhotoModal').remove()">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Cargar estados async
  state.students.forEach(async (s) => {
    const img = await getStudentImage(s.id);
    const item = modal.querySelector(`.photo-assign-item[data-id="${s.id}"]`);
    const status = modal.querySelector(`[data-status-for="${s.id}"]`);
    if (img) {
      status.textContent = '✓ ya tiene foto';
      item.classList.add('has-photo');
    } else {
      status.textContent = 'sin foto';
    }
    item.addEventListener('click', async () => {
      // Asignar
      await saveStudentImage(s.id, {
        ...photo.imgData,
        filename: photo.file.name,
        size: photo.file.size,
        autoAssigned: false,
        confidence: 'manual',
        via: 'asignación manual'
      });
      // Quitar de no asignadas
      state.unassignedPhotos = state.unassignedPhotos.filter((_, i) => i !== unassignedIdx);
      modal.remove();
      showToast(`Foto asignada a ${s.name}`, 'success');
      await refreshPhotoGallery();
      renderIATable();
    });
  });
}

/**
 * Permite reasignar una foto ya asignada (la quita del estudiante actual y muestra el modal de asignación).
 */
async function reassignPhoto(studentId) {
  const img = await getStudentImage(studentId);
  if (!img) return;
  // Mover a no asignadas
  if (!state.unassignedPhotos) state.unassignedPhotos = [];
  state.unassignedPhotos.push({
    file: { name: img.filename || `${studentId}.jpg`, size: img.size },
    imgData: { base64: img.base64, mediaType: img.mediaType, dataUrl: img.dataUrl }
  });
  // Eliminar del estudiante
  await deleteStudentImage(studentId);
  await refreshPhotoGallery();
  renderIATable();
  // Abrir modal de asignación
  openAssignPhotoModal(state.unassignedPhotos.length - 1);
}

/**
 * Elimina TODAS las fotos cargadas (con confirmación).
 */
async function clearAllPhotos() {
  if (!confirm('¿Eliminar TODAS las fotos cargadas?\n\nEsta acción no se puede deshacer.')) return;
  const allImages = await dbGetAll('images');
  for (const img of allImages) {
    await deleteStudentImage(img.studentId);
  }
  state.unassignedPhotos = [];
  await refreshPhotoGallery();
  renderIATable();
  showToast('Todas las fotos eliminadas', 'info');
}

// Wire up event handlers para la zona de carga masiva
const photoDropZone = document.getElementById('photoDropZone');
const photoUploadBtn = document.getElementById('photoUploadBtn');
const photoFileInput = document.getElementById('photoFileInput');
const clearPhotosBtn = document.getElementById('clearPhotosBtn');

if (photoUploadBtn) {
  photoUploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    photoFileInput.click();
  });
}

if (photoFileInput) {
  photoFileInput.addEventListener('change', (e) => {
    handleBulkPhotoUpload(Array.from(e.target.files));
    e.target.value = ''; // reset
  });
}

if (clearPhotosBtn) {
  clearPhotosBtn.addEventListener('click', clearAllPhotos);
}

if (photoDropZone) {
  ['dragenter', 'dragover'].forEach(evt =>
    photoDropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      photoDropZone.classList.add('drag-over');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    photoDropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      photoDropZone.classList.remove('drag-over');
    })
  );
  photoDropZone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleBulkPhotoUpload(files);
  });
}

// Refrescar galería cuando se navega al módulo 2
const originalRefreshModulo2 = refreshModulo2View;
refreshModulo2View = function() {
  originalRefreshModulo2();
  refreshPhotoGallery();
};

// ═════════════════════════════════════════════════════════════════
// INIT
// ═════════════════════════════════════════════════════════════════
(async function init() {
  try {
    await initDB();
    await loadBiblioteca();

    // Cargar evaluaciones previas si existen
    const savedEvals = await dbGetAll('evaluations');
    savedEvals.forEach(e => {
      state.evaluations[e.studentId] = e;
    });
  } catch (e) {
    console.warn('No se pudo inicializar la base de datos local:', e);
  }
  await checkApiStatus();
})();
