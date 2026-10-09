/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — MÓDULO 04: PERFIL INTEGRAL (v0.6)
   ───────────────────────────────────────────────────────────────
   Triangula Likert + preguntas abiertas + evidencia visual y asigna
   uno de los cinco perfiles de la "Tipología Integrada de Perfiles
   Metacognitivos en Resolución de Problemas Matemáticos".

   · Lee state.students (Módulo 01). No modifica los módulos 01–03.
   · Puntajes de preguntas abiertas: los ingresa el/la docente aquí
     (1–4). Si no hay, usa los del Módulo 02 que ya estén REVISADOS.
   · Persistencia local (IndexedDB 'EducaFractaliaPerfil'): puntajes,
     comentarios, retroalimentación editada e imágenes.
   · Descargas: Excel, JSON (para plataformas) e informe HTML
     autocontenido, imprimible a PDF.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────────────────────── Constantes ───────────────────────── */
  const AUTORIA = 'Autora de evaluación: Alejandra Solís Levicoi · 2025';
  const ESQUEMA = 'educa-fractalia/perfil-integral@1';

  // Escala de la escuela hospitalaria (equivalencia con la escala técnica 1–4)
  const ESCUELA = { 4: 'Destacado', 3: 'Competente', 2: 'Adecuado', 1: 'Insuficiente' };
  const TECNICO = { 4: 'Alto', 3: 'Medio-alto', 2: 'Medio-bajo', 1: 'Bajo' };
  const NIVEL_CLS = { 4: 'level-alto', 3: 'level-medio-alto', 2: 'level-medio-bajo', 1: 'level-bajo' };

  const DIMS = [
    { key: 'rec', name: 'Recursos', open: ['P1', 'P2'], transicion: true },
    { key: 'heu', name: 'Heurísticas', open: ['P3a', 'P3b'], transicion: true },
    { key: 'con', name: 'Control', open: ['P4', 'P5'], transicion: true },
    { key: 'sc', name: 'Sistema de Creencias', open: [], transicion: false }
  ];

  const PREGUNTAS = [
    { key: 'P1', field: 'p1', dim: 'rec', texto: 'Menciona la operación matemática utilizada que consideras más importante para resolver el problema', foco: 'coherencia con el desarrollo' },
    { key: 'P2', field: 'p2', dim: 'rec', texto: '¿Cómo supiste que había que usar esa operación?' },
    { key: 'P3a', field: 'p3a', dim: 'heu', texto: 'Explica al menos 3 pasos que seguiste para resolver el problema' },
    { key: 'P3b', field: null, dim: 'heu', texto: 'Estrategias evidenciadas en el desarrollo (dibujo en tablet o foto del papel)', visual: true },
    { key: 'P4', field: 'p4', dim: 'con', texto: 'Si tuvieras que volver a resolver el problema, ¿qué harías diferente?' },
    { key: 'P5', field: 'p5', dim: 'con', texto: 'Cuando estabas resolviendo el problema, ¿qué hiciste para saber si debías corregir o no tu procedimiento?' }
  ];

  const PERFILES = {
    A: {
      nombre: 'Metacognitivo avanzado',
      desc: 'Posee recursos sólidos, aplica estrategias variadas, regula activamente su proceso y tiene creencias positivas sobre su capacidad matemática.',
      pasos: [
        'Proponer problemas abiertos de mayor complejidad, con más de una vía de solución.',
        'Invitarle a explicar sus decisiones a otros (tutoría entre pares) para consolidar su regulación.',
        'Desafiarle a formular sus propios problemas a partir de lo resuelto.'
      ]
    },
    B: {
      nombre: 'Estratega parcial',
      desc: 'Posee recursos y aplica estrategias, pero presenta dificultades en el control de su proceso o creencias poco favorables sobre su capacidad.',
      pasos: [
        'Incorporar pausas de verificación guiadas (“¿cómo sé que mi resultado tiene sentido?”).',
        'Dar retroalimentación centrada en el progreso y en el proceso, no solo en el resultado.',
        'Usar el error como fuente de aprendizaje con tareas donde equivocarse sea parte del camino.'
      ]
    },
    C: {
      nombre: 'Reflexivo en desarrollo',
      desc: 'Tiene buena autorregulación y creencias positivas, pero aún necesita ampliar sus recursos matemáticos y su repertorio de estrategias.',
      pasos: [
        'Mostrar distintas estrategias para un mismo problema (dibujar, probar con números, trabajar hacia atrás).',
        'Conectar el problema con conocimientos previos antes de resolverlo.',
        'Construir con el/la estudiante un “banco de estrategias” al que pueda recurrir.'
      ]
    },
    D: {
      nombre: 'Metacognición en desarrollo',
      desc: 'Presenta niveles medios en la mayoría de las dimensiones, sin destacar en ninguna: su metacognición está en proceso de construcción.',
      pasos: [
        'Elegir una dimensión para fortalecer primero (la de menor nivel) y trabajarla de forma sostenida.',
        'Ofrecer preguntas guía para antes, durante y después de resolver.',
        'Acordar un criterio concreto para revisar la solución antes de darla por terminada.'
      ]
    },
    E: {
      nombre: 'Metacognición frágil',
      desc: 'Presenta dificultades en varias dimensiones, con poca reflexión, escasa autorregulación y/o creencias poco favorables sobre su capacidad.',
      pasos: [
        'Acompañar de cerca con problemas accesibles que aseguren experiencias de logro.',
        'Modelar y practicar el pensamiento en voz alta con apoyo del/la docente.',
        'Fortalecer la confianza con retroalimentación específica y positiva sobre lo que sí hizo.'
      ]
    }
  };

  /* ───────────────────────── Utilidades ───────────────────────── */
  const $ = id => document.getElementById(id);
  const esc = v => (v === null || v === undefined ? '' : String(v))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escBR = v => esc(v).replace(/\n/g, '<br>');
  const r2 = x => (x === null || x === undefined || isNaN(x)) ? null : Math.round(x * 100) / 100;
  const avg = arr => { const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const fmt = x => x === null || x === undefined ? '—' : x.toFixed(2).replace('.', ',');
  const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };
  const slug = s => (s || 'estudiante').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50) || 'estudiante';
  const today = () => new Date().toISOString().slice(0, 10);
  const titleCase = s => (s || '').toString().trim().toLowerCase().replace(/(^|\s)([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase());
  const primerNombre = s => titleCase(s).split(/\s+/)[0] || 'El/la estudiante';

  /* ───────────────────────── Persistencia ───────────────────────── */
  const cache = { docente: {}, media: {}, unassigned: [] };
  let pdb = null;

  function openPDB() {
    return new Promise(resolve => {
      try {
        const rq = indexedDB.open('EducaFractaliaPerfil', 1);
        rq.onupgradeneeded = e => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains('docente')) d.createObjectStore('docente', { keyPath: 'uid' });
          if (!d.objectStoreNames.contains('media')) d.createObjectStore('media', { keyPath: 'key' });
        };
        rq.onsuccess = () => { pdb = rq.result; resolve(true); };
        rq.onerror = () => resolve(false);
        rq.onblocked = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }
  const idbReq = (store, mode, fn) => new Promise(resolve => {
    if (!pdb) return resolve(null);
    try {
      const tx = pdb.transaction([store], mode);
      const rq = fn(tx.objectStore(store));
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
  const idbPut = (store, obj) => idbReq(store, 'readwrite', s => s.put(obj));
  const idbDel = (store, key) => idbReq(store, 'readwrite', s => s.delete(key));
  const idbAll = store => idbReq(store, 'readonly', s => s.getAll());

  const ready = openPDB().then(async ok => {
    if (!ok) return;
    ((await idbAll('docente')) || []).forEach(d => { cache.docente[d.uid] = d; });
    ((await idbAll('media')) || []).forEach(m => { cache.media[m.key] = m; });
  });

  function docente(uid) {
    if (!cache.docente[uid]) cache.docente[uid] = { uid, scores: {}, comentarios: {}, feedback: null };
    return cache.docente[uid];
  }
  function saveDocente(uid) {
    const d = docente(uid);
    d.updatedAt = new Date().toISOString();
    return idbPut('docente', d);
  }

  /* ───────────────────────── Cálculo ───────────────────────── */
  const nivelDe = score => {
    if (score === null || score === undefined) return null;
    const s = r2(score);
    return s < 2.0 ? 1 : s < 2.65 ? 2 : s < 3.4 ? 3 : 4;
  };

  /** Puntaje de una pregunta abierta: docente (este módulo) > Módulo 02 revisado. */
  function puntajeAbierta(s, k) {
    const d = cache.docente[s.uid];
    const v = d && d.scores ? d.scores[k] : null;
    if (v) return { v, origen: 'docente' };
    const ev = (typeof state !== 'undefined' && state.evaluations) ? state.evaluations[s.id] : null;
    if (ev && ev.estado === 'reviewed' && ev[k] && ev[k].puntaje) return { v: ev[k].puntaje, origen: 'módulo 02' };
    return null;
  }

  function calcDim(s, dim) {
    const likert = s[dim.key] ? s[dim.key].normalized : null;
    const items = dim.open.map(k => ({ k, p: puntajeAbierta(s, k) }));
    const vals = items.filter(i => i.p).map(i => i.p.v);
    const abiertas = avg(vals);
    let score = likert;
    if (likert !== null && abiertas !== null) score = (likert + abiertas) / 2;
    else if (likert === null && abiertas !== null) score = abiertas;
    score = r2(score);
    const nivel = nivelDe(score);
    const out = {
      key: dim.key, name: dim.name, likert: r2(likert), abiertas: r2(abiertas),
      nAbiertas: vals.length, nAbiertasTotal: dim.open.length,
      score, nivel,
      provisional: dim.open.length > 0 && vals.length < dim.open.length,
      imputado: !!(s[dim.key] && s[dim.key].imputed),
      transicion: dim.transicion && score !== null && score >= 2.55 && score <= 2.65,
      limite: false
    };
    if (score !== null) out.limite = [2.0, 2.65, 3.4].some(t => Math.abs(score - t) <= 0.011 && !out.transicion);
    return out;
  }

  /** Reglas de la matriz de perfiles. lv = {rec,heu,con,sc} con niveles 1–4. */
  function asignarPerfil(lv) {
    const v = [lv.rec, lv.heu, lv.con, lv.sc];
    if (v.some(x => x === null || x === undefined)) return null;
    const altos = v.filter(x => x === 4).length;
    const bajos = v.filter(x => x <= 2).length;
    if (altos >= 2 && lv.con === 4 && lv.sc === 4) return 'A';
    if (bajos >= 3 && lv.con <= 2 && lv.sc <= 2) return 'E';
    if (lv.rec >= 3 && lv.heu >= 3 && (lv.con <= 2 || lv.sc <= 2)) return 'B';
    if (lv.con >= 3 && lv.sc >= 3 && lv.rec <= 2 && lv.heu <= 2) return 'C';
    if (v.every(x => x === 2 || x === 3)) return 'D';
    return null;
  }

  function compute(s) {
    const dims = {};
    DIMS.forEach(d => { dims[d.key] = calcDim(s, d); });
    const lv = { rec: dims.rec.nivel, heu: dims.heu.nivel, con: dims.con.nivel, sc: dims.sc.nivel };
    const perfil = asignarPerfil(lv);

    // ¿Cambiaría el perfil si las dimensiones en zona de transición se leen hacia el otro lado?
    const trans = DIMS.filter(d => dims[d.key].transicion).map(d => d.key);
    const alternativos = new Set();
    if (trans.length) {
      for (let mask = 1; mask < (1 << trans.length); mask++) {
        const alt = Object.assign({}, lv);
        trans.forEach((k, i) => { if (mask & (1 << i)) alt[k] = alt[k] === 2 ? 3 : 2; });
        const p = asignarPerfil(alt);
        if (p && p !== perfil) alternativos.add(p);
      }
    }

    const totalAbiertas = PREGUNTAS.length;
    const evaluadas = PREGUNTAS.filter(q => puntajeAbierta(s, q.key)).length;
    const flags = [];
    if (evaluadas < totalAbiertas) {
      flags.push(`Provisorio: faltan ${totalAbiertas - evaluadas} de ${totalAbiertas} preguntas abiertas por evaluar. Mientras tanto, cada dimensión usa lo disponible (Likert y las abiertas ya evaluadas).`);
    }
    DIMS.forEach(d => {
      const x = dims[d.key];
      if (x.transicion) flags.push(`${d.name} (${fmt(x.score)}) está en la zona de transición 2,55–2,65: la clasificación requiere juicio pedagógico.`);
      else if (x.limite) flags.push(`${d.name} (${fmt(x.score)}) está a ±0,01 de un umbral de nivel: revisar con criterio de redondeo consciente.`);
      if (x.imputado) flags.push(`${d.name}: hay respuestas Likert faltantes; el puntaje usa el promedio de las respondidas.`);
    });
    if (alternativos.size) flags.push(`Si la zona de transición se interpreta hacia el otro nivel, el perfil podría ser ${[...alternativos].sort().map(p => 'Perfil ' + p).join(' o ')}.`);
    if (!perfil && Object.values(lv).every(x => x !== null)) flags.push('Esta combinación de niveles no está cubierta por ninguna regla de la matriz de perfiles (caso atípico): requiere juicio profesional.');
    if (Object.values(lv).some(x => x === null)) flags.push('Faltan puntajes Likert para asignar un perfil.');

    return {
      s, dims, lv, perfil, alternativos: [...alternativos].sort(), flags,
      evaluadas, totalAbiertas,
      provisional: evaluadas < totalAbiertas,
      revision: flags.some(f => !f.startsWith('Provisorio')) || (!perfil)
    };
  }

  /* ───────────────────────── Retroalimentación automática ───────────────────────── */
  function feedbackAuto(c) {
    const nombre = primerNombre(c.s.name);
    const dl = DIMS.map(d => ({ name: d.name, n: c.dims[d.key].nivel, sc: c.dims[d.key].score })).filter(x => x.n !== null);
    if (!dl.length) return 'Aún no hay puntajes suficientes para redactar una retroalimentación.';
    const max = Math.max(...dl.map(x => x.n)), min = Math.min(...dl.map(x => x.n));
    const fuertes = dl.filter(x => x.n === max).map(x => x.name);
    const debiles = dl.filter(x => x.n === min).map(x => x.name);
    const lista = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a[0];
    const p = c.perfil ? PERFILES[c.perfil] : null;

    const up = 'Hacia dónde vamos: que ' + nombre + ' pueda planificar cómo resolver un problema, usar lo que ya sabe, probar distintas estrategias y revisar su trabajo con confianza.';
    let back = 'Dónde está hoy: ';
    if (max === min) back += `${nombre} muestra un nivel ${ESCUELA[max].toLowerCase()} de manera pareja en las dimensiones evaluadas.`;
    else back += `sus mayores fortalezas están en ${lista(fuertes)} (${ESCUELA[max].toLowerCase()}) y la dimensión con más espacio para crecer es ${lista(debiles)} (${ESCUELA[min].toLowerCase()}).`;
    if (p) back += ` Su perfil es «${p.nombre}»: ${p.desc.charAt(0).toLowerCase() + p.desc.slice(1)}`;
    if (c.provisional) back += ' (Lectura provisoria: aún no se evalúan todas las preguntas abiertas.)';

    const fwd = p
      ? 'Cómo seguir: ' + p.pasos.map((x, i) => `${i + 1}) ${x}`).join(' ')
      : 'Cómo seguir: definir en conjunto con el/la docente una primera meta de trabajo, partiendo por la dimensión de menor nivel.';
    return [up, back, fwd].join('\n\n');
  }
  const feedbackDe = c => {
    const d = cache.docente[c.s.uid];
    return d && d.feedback ? d.feedback : feedbackAuto(c);
  };

  /* ───────────────────────── Imágenes ───────────────────────── */
  const mediaKey = (uid, tipo) => uid + '|' + tipo;
  const getMedia = (s, tipo) => cache.media[mediaKey(s.uid, tipo)] || null;

  function fileToImageData(file, maxSide) {
    maxSide = maxSide || 1600;
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('No se pudo leer el archivo'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen ilegible o formato no compatible (' + file.name + ')'));
        img.onload = () => {
          const sc = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          const png = /png$/i.test(file.type) || /\.png$/i.test(file.name);
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);   // fondo blanco (dibujos con transparencia)
          ctx.drawImage(img, 0, 0, w, h);
          const mediaType = png ? 'image/png' : 'image/jpeg';
          const dataUrl = cv.toDataURL(mediaType, 0.88);
          resolve({ dataUrl, mediaType, base64: dataUrl.split(',')[1] });
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function shrinkDataUrl(dataUrl, maxSide) {
    return new Promise(resolve => {
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const sc = Math.min(1, maxSide / Math.max(img.width, img.height));
        if (sc >= 1 && dataUrl.length < 400000) return resolve(dataUrl);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      };
      img.src = dataUrl;
    });
  }

  async function asignarImagen(s, tipo, imgData, file, via) {
    const rec = { key: mediaKey(s.uid, tipo), uid: s.uid, tipo, dataUrl: imgData.dataUrl, mediaType: imgData.mediaType, filename: file.name, size: file.size, via: via || 'manual', savedAt: new Date().toISOString() };
    cache.media[rec.key] = rec;
    await idbPut('media', rec);
    // Compatibilidad con el Módulo 02: la imagen que usa la IA es la foto del papel si existe, si no el dibujo
    const im = s.imagenes || {};
    const pref = (im.archivoFoto || im.urlFoto) ? 'foto' : 'dibujo';
    if (tipo === pref && typeof saveStudentImage === 'function') {
      try { await saveStudentImage(s.id, { base64: imgData.base64, mediaType: imgData.mediaType, dataUrl: imgData.dataUrl, filename: file.name, size: file.size }); } catch (e) { /* no crítico */ }
    }
  }
  async function quitarImagen(s, tipo) {
    delete cache.media[mediaKey(s.uid, tipo)];
    await idbDel('media', mediaKey(s.uid, tipo));
  }

  const normFile = n => (n || '').toString().split(/[\\/]/).pop().toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');

  function buscarDestino(fname) {
    const f = normFile(fname);
    if (!f) return null;
    let fuzzy = null;
    for (const s of state.students) {
      const im = s.imagenes || {};
      for (const [tipo, archivo] of [['dibujo', im.archivoDibujo], ['foto', im.archivoFoto]]) {
        const a = normFile(archivo);
        if (!a) continue;
        if (a === f) return { s, tipo, via: 'nombre de archivo exacto' };
        if (!fuzzy && a.length >= 10 && f.length >= 10 && (f.endsWith(a) || a.endsWith(f))) fuzzy = { s, tipo, via: 'nombre de archivo parcial' };
      }
    }
    return fuzzy;
  }

  async function cargarImagenes(files) {
    files = Array.from(files || []).filter(f => /^image\//.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name));
    if (!files.length) { toast('No se encontraron imágenes en la selección', 'info'); return; }
    let ok = 0, sin = 0, err = 0;
    for (const f of files) {
      try {
        const dest = buscarDestino(f.name);
        const data = await fileToImageData(f);
        if (dest) { await asignarImagen(dest.s, dest.tipo, data, f, dest.via); ok++; }
        else { cache.unassigned.push({ file: { name: f.name, size: f.size }, data }); sin++; }
      } catch (e) { console.warn(e); err++; }
    }
    toast(`${ok} imagen(es) emparejadas${sin ? ' · ' + sin + ' sin asignar' : ''}${err ? ' · ' + err + ' con error' : ''}`, sin || err ? 'info' : 'success');
    await refresh();
  }

  /* ───────────────────────── Vista principal ───────────────────────── */
  const profileChip = (c, big) => {
    if (!c.perfil) return `<span class="perfil-pill none"><span class="letter">?</span>Revisión docente</span>`;
    return `<span class="perfil-pill ${c.perfil} ${c.provisional ? 'prov' : ''}" title="${esc(PERFILES[c.perfil].nombre)}${c.provisional ? ' (provisorio)' : ''}"><span class="letter">${c.perfil}</span>${esc(PERFILES[c.perfil].nombre)}</span>`;
  };
  const nivelPill = (n) => n ? `<span class="level-pill ${NIVEL_CLS[n]}">${ESCUELA[n]}</span>` : '<span class="student-meta">—</span>';

  let computed = [];
  function recompute() { computed = (typeof state !== 'undefined' ? state.students : []).map(compute); return computed; }

  async function refresh() {
    await ready;
    const empty = $('modulo4Empty'), main = $('modulo4Main');
    if (!empty || !main) return;
    if (typeof state === 'undefined' || !state.students.length) { empty.style.display = 'block'; main.style.display = 'none'; return; }
    empty.style.display = 'none'; main.style.display = 'block';
    recompute();

    const n = computed.length;
    const conPerfil = computed.filter(c => c.perfil).length;
    const completas = computed.filter(c => !c.provisional).length;
    const conImg = state.students.filter(s => getMedia(s, 'dibujo') || getMedia(s, 'foto')).length;
    $('p4StatN').textContent = n;
    $('p4StatPerfil').textContent = conPerfil;
    $('p4StatAbiertas').textContent = `${completas}/${n}`;
    $('p4StatImg').textContent = `${conImg}/${n}`;

    // Distribución por perfil
    const dist = {};
    computed.forEach(c => { const k = c.perfil || '?'; dist[k] = (dist[k] || 0) + 1; });
    $('p4Dist').innerHTML = ['A', 'B', 'C', 'D', 'E', '?'].filter(k => dist[k]).map(k =>
      `<span class="p4-dist-chip"><span class="perfil-pill ${k === '?' ? 'none' : k}" style="padding:0;border:0;background:none;"><span class="letter">${k}</span></span>${k === '?' ? 'Revisión docente' : esc(PERFILES[k].nombre)} <b>${dist[k]}</b></span>`).join('');

    // Tabla
    const rows = computed.map(c => {
      const s = c.s;
      const cell = key => {
        const d = c.dims[key];
        if (d.score === null) return '<td class="num"><span class="student-meta">—</span></td>';
        return `<td class="num"><div class="nivel-cell"><span class="score-value">${fmt(d.score)}</span>${nivelPill(d.nivel)}${d.provisional ? '<span class="prov">provisorio</span>' : ''}</div></td>`;
      };
      const dib = getMedia(s, 'dibujo') ? '✓' : '·', fot = getMedia(s, 'foto') ? '✓' : '·';
      const avisos = c.flags.filter(f => !f.startsWith('Provisorio'));
      return `<tr data-uid="${esc(s.uid)}">
        <td><span class="student-id">${esc(s.id)}</span></td>
        <td><span class="student-name">${esc(s.name || '—')}</span></td>
        <td><span class="student-meta">${esc(s.curso || '—')} · ${s.edad ?? '—'} a</span></td>
        ${cell('rec')}${cell('heu')}${cell('con')}${cell('sc')}
        <td class="center"><span class="p4-mini">${c.evaluadas}/${c.totalAbiertas}</span></td>
        <td class="center" title="Dibujo en tablet · Foto del papel"><span class="p4-mini">D ${dib} · F ${fot}</span></td>
        <td>${profileChip(c)}</td>
        <td class="center">${avisos.length ? `<span class="p4-flag" title="${esc(avisos.join('\n'))}">⚠ ${avisos.length}</span>` : ''}</td>
      </tr>`;
    }).join('');
    $('p4Rows').innerHTML = rows;

    renderUnassigned();
  }

  function renderUnassigned() {
    const box = $('p4Unassigned');
    if (!cache.unassigned.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = 'block';
    const opts = state.students.map(s => `<option value="${esc(s.uid)}">${esc(s.id)} · ${esc(s.name)}</option>`).join('');
    box.innerHTML = `<div class="p4-unassigned"><h4>${cache.unassigned.length} imagen(es) sin asignar — su nombre de archivo no coincide con ninguno de la planilla</h4>
      ${cache.unassigned.map((u, i) => `<div class="p4-un-item" data-i="${i}">
        <img src="${u.data.dataUrl}" alt="">
        <span class="fn">${esc(u.file.name)}</span>
        <select class="un-est"><option value="">Estudiante…</option>${opts}</select>
        <select class="un-tipo"><option value="dibujo">Dibujo en tablet</option><option value="foto">Foto del papel</option></select>
        <button class="btn btn-primary btn-sm un-ok">Asignar</button>
        <button class="btn btn-ghost btn-sm un-del">Descartar</button>
      </div>`).join('')}</div>`;
  }

  /* ───────────────────────── Modal de perfil ───────────────────────── */
  let currentUid = null;
  let savedTimer = null;
  const flashSaved = () => {
    const el = $('pfSaved'); if (!el) return;
    el.textContent = 'Guardado ✓'; clearTimeout(savedTimer); savedTimer = setTimeout(() => { el.textContent = ''; }, 1800);
  };

  async function openPerfil(uid) {
    await ready;
    currentUid = uid;
    const s = state.students.find(x => x.uid === uid);
    if (!s) return;
    renderPerfil();
    $('perfilModal').classList.add('active');
  }
  function closePerfil() {
    $('perfilModal').classList.remove('active'); currentUid = null; refresh();
  }

  function renderPerfil() {
    const s = state.students.find(x => x.uid === currentUid);
    if (!s) return;
    const c = compute(s);
    const body = $('perfilBody');
    const keepScroll = body.scrollTop;
    const dcn = docente(s.uid);

    $('perfilTitle').textContent = titleCase(s.name) || s.id;
    $('perfilSubtitle').textContent = `${s.id} · ${s.curso || '—'} · ${s.edad ?? '—'} años · Estadía: ${typeof formatEstadia === 'function' ? formatEstadia(s.estadia) : s.estadia}`;

    const dimRows = DIMS.map(d => {
      const x = c.dims[d.key];
      const abTxt = d.open.length ? (x.abiertas !== null ? `${fmt(x.abiertas)} <span class="sub">${x.nAbiertas}/${x.nAbiertasTotal} preguntas</span>` : '<span class="sub">sin evaluar</span>') : '<span class="sub">no aplica</span>';
      return `<tr>
        <td class="dim-name">${esc(d.name)}${d.key === 'con' || d.key === 'sc' ? '<span class="sub">dimensión ancla</span>' : ''}</td>
        <td class="num">${fmt(x.likert)}</td>
        <td class="num">${abTxt}</td>
        <td class="num"><b>${fmt(x.score)}</b></td>
        <td>${nivelPill(x.nivel)}${x.nivel ? `<span class="sub" style="display:block;font-size:10px;color:var(--ef-gray);margin-top:2px;">${TECNICO[x.nivel]}${x.provisional ? ' · provisorio' : ''}</span>` : ''}</td>
      </tr>`;
    }).join('');

    const perfilBlock = c.perfil
      ? `<span class="perfil-pill ${c.perfil}"><span class="letter">${c.perfil}</span>Perfil ${c.perfil}${c.provisional ? ' · provisorio' : ''}</span>
         <div class="pf-profile-name">${esc(PERFILES[c.perfil].nombre)}</div>
         <div class="pf-profile-desc">${esc(PERFILES[c.perfil].desc)}</div>`
      : `<span class="perfil-pill none"><span class="letter">?</span>Sin perfil directo</span>
         <div class="pf-profile-desc" style="margin-top:8px;">La combinación de niveles no corresponde a una regla de la matriz o faltan datos. Se sugiere asignarlo con juicio profesional.</div>`;

    const flagsHTML = c.flags.length ? `<div class="pf-flags">${c.flags.map(f => `<div class="pf-flag">${esc(f)}</div>`).join('')}</div>` : '';

    const imgSlot = (tipo, titulo) => {
      const m = getMedia(s, tipo);
      const im = s.imagenes || {};
      const archivo = tipo === 'dibujo' ? im.archivoDibujo : im.archivoFoto;
      const hayUrl = tipo === 'dibujo' ? im.urlDibujo : im.urlFoto;
      const esperada = !!(archivo || hayUrl);
      return `<div class="pf-img" data-tipo="${tipo}">
        <div class="cap">${titulo}</div>
        <div class="box">${m ? `<img src="${m.dataUrl}" alt="${titulo} de ${esc(s.name)}" class="pf-zoom">` :
          `<div class="empty">${esperada ? 'Imagen registrada en Kobo,<br>aún no cargada aquí.' : 'El/la estudiante no<br>entregó esta imagen.'}</div>`}</div>
        ${archivo ? `<div class="fn">${esc(archivo)}</div>` : ''}
        <div class="act">
          <button class="btn btn-secondary btn-sm pf-img-up">${m ? 'Reemplazar' : 'Subir imagen'}</button>
          ${m ? '<button class="btn btn-ghost btn-sm pf-img-del">Quitar</button>' : ''}
        </div>
      </div>`;
    };

    const oqHTML = PREGUNTAS.map(q => {
      const dimName = DIMS.find(d => d.key === q.dim).name;
      const resp = q.field ? (s.openAnswers && s.openAnswers[q.field]) : null;
      const p = puntajeAbierta(s, q.key);
      const answerBlock = q.visual
        ? `<div class="oq-a empty">Se evalúa observando el dibujo o la foto del desarrollo (columna izquierda).</div>`
        : `<div class="oq-a ${resp ? '' : 'empty'}">${resp ? esc(resp) : '[sin respuesta]'}</div>`;
      return `<div class="oq-card" data-q="${q.key}">
        <div class="oq-head"><span class="oq-code">${q.key}</span><span class="oq-dim">${dimName}${q.foco ? ' · ' + q.foco : ''}</span></div>
        <div class="oq-q">${esc(q.texto)}</div>
        ${answerBlock}
        <div class="oq-score">
          <span class="score-label">Puntaje docente:</span>
          <div class="score-buttons">${[1, 2, 3, 4].map(n => `<button class="score-btn ${p && p.v === n ? 'active' : ''}" data-score="${n}" title="${ESCUELA[n]}">${n}</button>`).join('')}</div>
          <span class="lvl">${p ? ESCUELA[p.v] : 'sin evaluar'}</span>
          ${p && p.origen !== 'docente' ? `<span class="oq-src">(tomado del ${p.origen})</span>` : ''}
        </div>
        <textarea class="oq-comment" data-q="${q.key}" placeholder="Comentario del/la docente (opcional)">${esc((dcn.comentarios || {})[q.key] || '')}</textarea>
      </div>`;
    }).join('');

    body.innerHTML = `<div class="perfil-grid">
      <div>
        <div class="pf-block"><div class="pf-title">Perfil metacognitivo</div>
          <div class="pf-card">${perfilBlock}${flagsHTML}</div></div>
        <div class="pf-block"><div class="pf-title">Puntajes por dimensión (escala 1–4)</div>
          <table class="pf-dims"><thead><tr><th>Dimensión</th><th class="num">Likert</th><th class="num">Abiertas</th><th class="num">Final</th><th>Nivel</th></tr></thead><tbody>${dimRows}</tbody></table>
          <div class="p4-mini" style="margin-top:8px;line-height:1.5;">Final = promedio entre el Likert normalizado y el promedio de las preguntas abiertas. Sistema de Creencias se calcula solo con el Likert.</div></div>
        <div class="pf-block"><div class="pf-title">Desarrollo del problema</div>
          <div class="pf-images">${imgSlot('dibujo', 'Dibujo en tablet')}${imgSlot('foto', 'Foto del papel')}</div>
          <input type="file" id="pfImgInput" accept="image/*" style="display:none"></div>
      </div>
      <div>
        <div class="pf-block"><div class="pf-title">Preguntas abiertas</div>${oqHTML}</div>
        <div class="pf-block"><div class="pf-title">Retroalimentación formativa <span id="pfSaved" class="pf-saved"></span></div>
          <textarea class="pf-feedback" id="pfFeedback">${esc(feedbackDe(c))}</textarea>
          <div style="margin-top:6px;display:flex;gap:8px;align-items:center;">
            <button class="btn btn-ghost btn-sm" id="pfFeedbackReset">Restablecer texto automático</button>
            <span class="p4-mini">${dcn.feedback ? 'Texto editado por el/la docente' : 'Texto automático — puedes editarlo'}</span></div></div>
      </div>
    </div>`;
    body.scrollTop = keepScroll;
  }

  // Delegación de eventos del modal
  function wireModal() {
    const body = $('perfilBody');
    let imgTarget = null;

    body.addEventListener('click', async e => {
      const s = state.students.find(x => x.uid === currentUid);
      if (!s) return;
      const sb = e.target.closest('.score-btn');
      if (sb) {
        const q = sb.closest('.oq-card').dataset.q, n = parseInt(sb.dataset.score, 10);
        const d = docente(s.uid);
        if (d.scores[q] === n) delete d.scores[q]; else d.scores[q] = n;
        renderPerfil();                                   // la pantalla responde de inmediato
        saveDocente(s.uid).then(flashSaved); return;
      }
      if (e.target.closest('.pf-img-up')) {
        imgTarget = e.target.closest('.pf-img').dataset.tipo; $('pfImgInput').value = ''; $('pfImgInput').click(); return;
      }
      if (e.target.closest('.pf-img-del')) {
        await quitarImagen(s, e.target.closest('.pf-img').dataset.tipo); renderPerfil(); return;
      }
      if (e.target.classList.contains('pf-zoom')) {
        $('p4Lightbox').querySelector('img').src = e.target.src; $('p4Lightbox').classList.add('active'); return;
      }
      if (e.target.id === 'pfFeedbackReset') {
        const d = docente(s.uid); d.feedback = null; renderPerfil(); saveDocente(s.uid).then(flashSaved); return;
      }
    });
    body.addEventListener('change', async e => {
      const s = state.students.find(x => x.uid === currentUid);
      if (!s || e.target.id !== 'pfImgInput' || !imgTarget) return;
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = await fileToImageData(f);
        await asignarImagen(s, imgTarget, data, f, 'manual');
        toast('Imagen cargada: ' + f.name, 'success');
        renderPerfil();
      } catch (err) { toast(err.message); }
    });
    let t = null;
    body.addEventListener('input', e => {
      const s = state.students.find(x => x.uid === currentUid);
      if (!s) return;
      if (e.target.classList.contains('oq-comment')) {
        const q = e.target.dataset.q, d = docente(s.uid);
        d.comentarios[q] = e.target.value;
        clearTimeout(t); t = setTimeout(async () => { await saveDocente(s.uid); flashSaved(); }, 500);
      } else if (e.target.id === 'pfFeedback') {
        const d = docente(s.uid); d.feedback = e.target.value;
        clearTimeout(t); t = setTimeout(async () => { await saveDocente(s.uid); flashSaved(); }, 500);
      }
    });

    $('perfilClose').addEventListener('click', closePerfil);
    $('perfilCancel').addEventListener('click', closePerfil);
    $('perfilModal').addEventListener('click', e => { if (e.target.id === 'perfilModal') closePerfil(); });
    $('p4Lightbox').addEventListener('click', () => $('p4Lightbox').classList.remove('active'));
    $('perfilDlHtml').addEventListener('click', () => { const s = state.students.find(x => x.uid === currentUid); if (s) descargarHTML([compute(s)], 'Informe_' + slug(s.name) + '_' + today() + '.html'); });
    $('perfilDlJson').addEventListener('click', () => { const s = state.students.find(x => x.uid === currentUid); if (s) descargarJSON([compute(s)], 'Perfil_' + slug(s.name) + '_' + today() + '.json'); });
  }

  /* ───────────────────────── Exportaciones ───────────────────────── */
  function descargar(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function resumenEstudiante(c, conImagenes) {
    const s = c.s, im = s.imagenes || {};
    return {
      id: s.id, uid: s.uid,
      nombre: titleCase(s.name), curso: s.curso, edad: s.edad, mes_aplicacion: s.mes,
      estadia: s.estadia, aplicador: s.aplicador, fecha_aplicacion: (s.fechaAplicacion || '').slice(0, 10),
      dimensiones: DIMS.reduce((o, d) => {
        const x = c.dims[d.key];
        o[d.key] = { nombre: d.name, likert: x.likert, abiertas: x.abiertas, puntaje: x.score, nivel: x.nivel, nivel_escuela: x.nivel ? ESCUELA[x.nivel] : null, nivel_tecnico: x.nivel ? TECNICO[x.nivel] : null, provisorio: x.provisional };
        return o;
      }, {}),
      perfil: { codigo: c.perfil, nombre: c.perfil ? PERFILES[c.perfil].nombre : null, provisorio: c.provisional, alternativos: c.alternativos, requiere_revision: c.revision, avisos: c.flags },
      preguntas_abiertas: PREGUNTAS.map(q => {
        const p = puntajeAbierta(s, q.key), d = cache.docente[s.uid];
        return { codigo: q.key, dimension: DIMS.find(x => x.key === q.dim).name, pregunta: q.texto, respuesta: q.field ? ((s.openAnswers || {})[q.field] || '') : null, puntaje: p ? p.v : null, nivel_escuela: p ? ESCUELA[p.v] : null, origen_puntaje: p ? p.origen : null, comentario: (d && d.comentarios && d.comentarios[q.key]) || '' };
      }),
      imagenes: {
        dibujo_tablet: { archivo: im.archivoDibujo || null, cargada: !!getMedia(s, 'dibujo'), data_url: conImagenes && getMedia(s, 'dibujo') ? getMedia(s, 'dibujo').dataUrl : undefined },
        foto_papel: { archivo: im.archivoFoto || null, cargada: !!getMedia(s, 'foto'), data_url: conImagenes && getMedia(s, 'foto') ? getMedia(s, 'foto').dataUrl : undefined }
      },
      retroalimentacion: feedbackDe(c)
    };
  }

  function descargarJSON(items, nombre) {
    const conImg = !!($('p4InclImg') && $('p4InclImg').checked);
    const out = {
      esquema: ESQUEMA, generado: new Date().toISOString(), autoria: AUTORIA,
      escala: { niveles: { 4: 'Destacado (Alto)', 3: 'Competente (Medio-alto)', 2: 'Adecuado (Medio-bajo)', 1: 'Insuficiente (Bajo)' }, rangos: { 1: '1,00–1,99', 2: '2,00–2,64', 3: '2,65–3,39', 4: '3,40–4,00' } },
      estudiantes: items.map(c => resumenEstudiante(c, conImg))
    };
    descargar(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), nombre);
  }

  function descargarExcel(items) {
    if (typeof XLSX === 'undefined') { toast('No se cargó la librería de Excel'); return; }
    const wb = XLSX.utils.book_new();
    const head1 = ['ID', 'Nombre', 'Curso', 'Edad', 'Estadía', 'Fecha aplicación', 'Aplicador'];
    DIMS.forEach(d => { head1.push(d.name + ' (puntaje)', d.name + ' (nivel)'); });
    head1.push('Perfil', 'Nombre del perfil', 'Estado', 'Avisos');
    const rows1 = items.map(c => {
      const r = resumenEstudiante(c, false);
      const row = [r.id, r.nombre, r.curso, r.edad, r.estadia, r.fecha_aplicacion, r.aplicador];
      DIMS.forEach(d => { const x = r.dimensiones[d.key]; row.push(x.puntaje, x.nivel_escuela || ''); });
      row.push(r.perfil.codigo || '', r.perfil.nombre || '', c.provisional ? 'Provisorio' : 'Completo', c.flags.filter(f => !f.startsWith('Provisorio')).join(' | '));
      return row;
    });
    const ws1 = XLSX.utils.aoa_to_sheet([head1, ...rows1]);
    ws1['!cols'] = head1.map((h, i) => ({ wch: i === 1 ? 34 : i >= head1.length - 1 ? 60 : 16 }));
    XLSX.utils.book_append_sheet(wb, ws1, 'Perfiles');

    const head2 = ['ID', 'Nombre'];
    PREGUNTAS.forEach(q => { head2.push(q.key + ' respuesta', q.key + ' puntaje', q.key + ' nivel', q.key + ' comentario'); });
    const rows2 = items.map(c => {
      const r = resumenEstudiante(c, false);
      const row = [r.id, r.nombre];
      r.preguntas_abiertas.forEach(p => row.push(p.respuesta === null ? '(evidencia visual)' : p.respuesta, p.puntaje, p.nivel_escuela || '', p.comentario));
      return row;
    });
    const ws2 = XLSX.utils.aoa_to_sheet([head2, ...rows2]);
    ws2['!cols'] = head2.map((h, i) => ({ wch: i < 2 ? (i ? 34 : 8) : (/respuesta|comentario/.test(h) ? 42 : 12) }));
    XLSX.utils.book_append_sheet(wb, ws2, 'Preguntas abiertas');

    const ws3 = XLSX.utils.aoa_to_sheet([['ID', 'Nombre', 'Perfil', 'Retroalimentación'], ...items.map(c => [c.s.id, titleCase(c.s.name), c.perfil || '', feedbackDe(c)])]);
    ws3['!cols'] = [{ wch: 8 }, { wch: 34 }, { wch: 8 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Retroalimentación');
    XLSX.writeFile(wb, 'Perfil_integral_' + today() + '.xlsx');
  }

  const REPORT_CSS = `
  :root{--navy:#243882;--mid:#4064AB;--light:#9FB6DF;--gray:#706F6F;--ink:#1A2142;--line:#E3E8F2;--bg:#F5F7FA}
  *{box-sizing:border-box}body{margin:0;font-family:Poppins,'Helvetica Neue',Arial,sans-serif;color:var(--ink);background:#fff;font-size:12.5px;line-height:1.5}
  .bar{position:sticky;top:0;background:var(--navy);color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px}
  .bar button{background:#fff;color:var(--navy);border:0;border-radius:6px;padding:7px 14px;font-weight:600;cursor:pointer;font-family:inherit}
  .page{max-width:820px;margin:0 auto;padding:28px 28px 20px;page-break-after:always}
  .page:last-child{page-break-after:auto}
  h1{font-size:20px;color:var(--navy);margin:0}h2{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--mid);margin:20px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--navy);padding-bottom:10px;margin-bottom:14px}
  .brand{font-weight:700;color:var(--navy);font-size:15px}.brand b{color:var(--navy)}.brand span{color:var(--mid);font-weight:400}
  .meta{color:var(--gray);font-size:11.5px;margin-top:4px}
  .perfil{background:var(--bg);border:1px solid var(--line);border-left:5px solid var(--navy);border-radius:6px;padding:10px 14px}
  .perfil .pn{font-size:15px;font-weight:600;color:var(--navy)}.perfil .pd{margin-top:2px}
  table{width:100%;border-collapse:collapse}th{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--mid);text-align:left;padding:5px 6px;border-bottom:1px solid var(--line)}
  td{padding:6px;border-bottom:1px solid #EEF1F7;vertical-align:top}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  .pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;text-transform:uppercase}
  .l4{background:#E0ECE4;color:#2E6B4A}.l3{background:#ECF3EE;color:#5A8B6D}.l2{background:#F9F1E5;color:#C98840}.l1{background:#F8ECEC;color:#B85C5C}
  .q{border:1px solid var(--line);border-radius:6px;padding:8px 10px;margin-bottom:8px;break-inside:avoid}
  .q .qh{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--gray)}.q .qh b{color:var(--navy)}
  .q .qt{color:var(--gray);font-size:11px;margin:2px 0 4px}.q .qa{background:#EDF1F9;border-radius:4px;padding:6px 9px;white-space:pre-wrap}
  .q .qc{margin-top:5px;font-size:11.5px}.imgs{display:flex;gap:12px}.imgs figure{flex:1;margin:0;border:1px solid var(--line);border-radius:6px;padding:6px;text-align:center;break-inside:avoid}
  .imgs img{max-width:100%;max-height:300px}.imgs figcaption{font-size:10px;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
  .fb p{margin:0 0 8px;white-space:pre-wrap}.note{font-size:10.5px;color:var(--gray)}
  .foot{margin-top:18px;padding-top:8px;border-top:1px solid var(--line);font-size:10.5px;color:var(--gray);display:flex;justify-content:space-between}
  .warn{background:#F9F1E5;border-left:3px solid #C98840;padding:6px 10px;margin-top:6px;font-size:11.5px;color:#7a531f}
  @media print{.bar{display:none}.page{padding:0;max-width:none}@page{size:A4;margin:14mm}}`;

  async function seccionInforme(c) {
    const s = c.s, r = resumenEstudiante(c, false), dcn = cache.docente[s.uid] || {};
    const dimRows = DIMS.map(d => {
      const x = c.dims[d.key];
      return `<tr><td>${esc(d.name)}</td><td class="n">${fmt(x.likert)}</td><td class="n">${d.open.length ? fmt(x.abiertas) : '—'}</td><td class="n"><b>${fmt(x.score)}</b></td><td>${x.nivel ? `<span class="pill l${x.nivel}">${ESCUELA[x.nivel]}</span> <span class="note">${TECNICO[x.nivel]}${x.provisional ? ' · provisorio' : ''}</span>` : '—'}</td></tr>`;
    }).join('');
    const qs = PREGUNTAS.map(q => {
      const p = puntajeAbierta(s, q.key);
      const resp = q.field ? ((s.openAnswers || {})[q.field] || '') : null;
      return `<div class="q"><div class="qh"><span><b>${q.key}</b> · ${esc(DIMS.find(d => d.key === q.dim).name)}</span><span>${p ? `<span class="pill l${p.v}">${ESCUELA[p.v]} (${p.v})</span>` : 'sin evaluar'}</span></div>
        <div class="qt">${esc(q.texto)}</div>
        <div class="qa">${resp === null ? '<i>Se evalúa a partir del dibujo o la foto del desarrollo.</i>' : (resp ? esc(resp) : '<i>[sin respuesta]</i>')}</div>
        ${dcn.comentarios && dcn.comentarios[q.key] ? `<div class="qc"><b>Comentario docente:</b> ${escBR(dcn.comentarios[q.key])}</div>` : ''}</div>`;
    }).join('');
    const figs = [];
    for (const [tipo, tit] of [['dibujo', 'Dibujo en tablet'], ['foto', 'Foto del papel']]) {
      const m = getMedia(s, tipo);
      if (m) figs.push(`<figure><figcaption>${tit}</figcaption><img src="${await shrinkDataUrl(m.dataUrl, 900)}" alt="${tit}"></figure>`);
    }
    const avisos = c.flags.filter(f => !f.startsWith('Provisorio'));
    return `<section class="page">
      <div class="top"><div><div class="brand">Educa <span>Fractalia</span></div><div class="meta">Informe de perfil metacognitivo en resolución de problemas matemáticos</div></div>
        <div class="meta" style="text-align:right">Generado: ${today()}${c.provisional ? '<br><b style="color:#C98840">Informe provisorio</b>' : ''}</div></div>
      <h1>${esc(titleCase(s.name))}</h1>
      <div class="meta">${esc(s.id)} · ${esc(s.curso || '—')} · ${s.edad ?? '—'} años · Estadía: ${esc(typeof formatEstadia === 'function' ? formatEstadia(s.estadia) : s.estadia)}${s.aplicador ? ' · Aplicó: ' + esc(titleCase(s.aplicador)) : ''}${r.fecha_aplicacion ? ' · ' + esc(r.fecha_aplicacion) : ''}</div>
      <h2>Perfil</h2>
      <div class="perfil">${c.perfil ? `<div class="pn">Perfil ${c.perfil}: ${esc(PERFILES[c.perfil].nombre)}</div><div class="pd">${esc(PERFILES[c.perfil].desc)}</div>` : '<div class="pn">Perfil por definir con juicio profesional</div>'}
        ${avisos.map(a => `<div class="warn">${esc(a)}</div>`).join('')}</div>
      <h2>Puntajes por dimensión (escala 1–4)</h2>
      <table><thead><tr><th>Dimensión</th><th class="n">Likert</th><th class="n">Abiertas</th><th class="n">Final</th><th>Nivel</th></tr></thead><tbody>${dimRows}</tbody></table>
      <div class="note" style="margin-top:4px">Final = promedio entre el Likert normalizado y las preguntas abiertas. Sistema de Creencias: solo Likert. Niveles: Destacado ≥ 3,40 · Competente 2,65–3,39 · Adecuado 2,00–2,64 · Insuficiente &lt; 2,00.</div>
      <h2>Preguntas abiertas</h2>${qs}
      ${figs.length ? `<h2>Desarrollo del problema</h2><div class="imgs">${figs.join('')}</div>` : ''}
      <h2>Retroalimentación formativa</h2><div class="fb"><p>${escBR(feedbackDe(c))}</p></div>
      <div class="foot"><span>${esc(AUTORIA)}</span><span>Educa Fractalia · Laboratorio de Evaluación e Investigación en educación matemática</span></div>
    </section>`;
  }

  async function descargarHTML(items, nombre) {
    const secciones = [];
    for (const c of items) secciones.push(await seccionInforme(c));
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Informe de perfil metacognitivo · Educa Fractalia</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${REPORT_CSS}</style></head><body>
<div class="bar"><span>Educa Fractalia · ${items.length} informe(s)</span><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
${secciones.join('\n')}</body></html>`;
    descargar(new Blob([html], { type: 'text/html;charset=utf-8' }), nombre);
  }

  /* ───────────────────────── Cableado ───────────────────────── */
  function wire() {
    if (!$('view-modulo4')) return;
    wireModal();

    $('p4Rows').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-uid]'); if (tr) openPerfil(tr.dataset.uid);
    });
    $('p4UploadImgs').addEventListener('click', () => $('p4ImgInput').click());
    $('p4ImgInput').addEventListener('change', e => { cargarImagenes(e.target.files); e.target.value = ''; });
    $('p4DlXlsx').addEventListener('click', async () => { await ready; descargarExcel(recompute()); });
    $('p4DlJson').addEventListener('click', async () => { await ready; descargarJSON(recompute(), 'Perfiles_curso_' + today() + '.json'); });
    $('p4DlHtml').addEventListener('click', async () => {
      await ready;
      toast('Preparando informes…', 'info');
      await descargarHTML(recompute(), 'Informes_perfil_integral_' + today() + '.html');
    });
    $('p4Unassigned').addEventListener('click', async e => {
      const item = e.target.closest('.p4-un-item'); if (!item) return;
      const i = parseInt(item.dataset.i, 10), u = cache.unassigned[i];
      if (e.target.classList.contains('un-del')) { cache.unassigned.splice(i, 1); renderUnassigned(); return; }
      if (e.target.classList.contains('un-ok')) {
        const uid = item.querySelector('.un-est').value, tipo = item.querySelector('.un-tipo').value;
        const s = state.students.find(x => x.uid === uid);
        if (!s) { toast('Elige el estudiante'); return; }
        await asignarImagen(s, tipo, u.data, u.file, 'asignación manual');
        cache.unassigned.splice(i, 1);
        toast('Imagen asignada a ' + titleCase(s.name), 'success'); refresh();
      }
    });

    // Navegar al módulo 04 refresca la vista (switchView vive en app.js)
    if (typeof window.switchView === 'function') {
      const base = window.switchView;
      window.switchView = function (name) { base(name); if (name === 'modulo4') refresh(); };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  // Expuesto para pruebas y para integrar con otros módulos
  window.PerfilIntegral = { compute, asignarPerfil, nivelDe, feedbackAuto, refresh, PERFILES, _cache: cache };
})();
