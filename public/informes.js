/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — INFORMES CARGADOS (módulos 06 y 07)
   Permite volver a cargar informes HTML ya generados para analizarlos y
   graficarlos sin regenerarlos. Lee los datos incrustados en los informes
   nuevos y, para los informes anteriores, los extrae del propio texto.
   Se guardan solo en este navegador (IndexedDB 'EducaFractaliaInformes').
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const DB = 'EducaFractaliaInformes', ST = 'informes';
  const KEYS = ['rec', 'heu', 'con', 'sc'];
  const NOMBRES = { rec: 'Recursos', heu: 'Heurísticas', con: 'Control', sc: 'Sistema de Creencias' };
  const PREG = ['P1', 'P2', 'P3a', 'P3b', 'P4', 'P5'];
  const nivelDe = x => (x === null || x === undefined) ? null : x < 2.0 ? 1 : x < 2.65 ? 2 : x < 3.4 ? 3 : 4;
  const num = t => { const m = String(t || '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ───────── Almacenamiento ───────── */
  let memoria = null, dbp = null;
  function abrir() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        const rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(ST, { keyPath: 'key' });
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  async function leerTodo() {
    try {
      const db = await abrir();
      return await new Promise((res, rej) => { const r = db.transaction(ST).objectStore(ST).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); });
    } catch (e) { return memoria || []; }
  }
  async function guardar(reg) {
    try {
      const db = await abrir();
      await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'); tx.objectStore(ST).put(reg); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    } catch (e) { /* sin IndexedDB: solo en memoria de esta sesión */ }
  }
  async function borrar(key) {
    try {
      const db = await abrir();
      await new Promise((res, rej) => { const tx = db.transaction(ST, 'readwrite'); key === null ? tx.objectStore(ST).clear() : tx.objectStore(ST).delete(key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    } catch (e) { /* idem */ }
  }
  async function cargar() { memoria = await leerTodo(); return memoria; }

  /* ───────── Lectura de informes ───────── */
  const claveDe = r => [norm(r.id), norm(r.nombre), r.fecha || ''].join('|');

  function desdeDatos(json) {
    const d = JSON.parse(json);
    if (!d || d.v !== 1 || !d.id) throw new Error('datos incrustados no válidos');
    return d;
  }

  function desdeTexto(sec) {
    const h1 = sec.querySelector('h1'); if (!h1) throw new Error('sin nombre');
    const metaEl = sec.querySelector('h1 + .meta');
    const partes = (metaEl ? metaEl.textContent : '').split('·').map(x => x.trim());
    const r = { v: 1, origen: 'texto', nombre: h1.textContent.trim(), id: partes[0] || '', curso: partes[1] || '', edad: num(partes[2]), estadia: '', aplicador: '', fecha: '' };
    partes.slice(3).forEach(p => {
      if (/^Estad[ií]a:/i.test(p)) r.estadia = p.replace(/^Estad[ií]a:\s*/i, '');
      else if (/^Aplic[oó]:/i.test(p)) r.aplicador = p.replace(/^Aplic[oó]:\s*/i, '');
      else if (/^\d{4}-\d{2}-\d{2}$/.test(p)) r.fecha = p;
    });
    if (!r.id) throw new Error('sin código de estudiante');
    // Tablas por encabezado de sección
    const h2s = [...sec.querySelectorAll('h2')];
    const tablaDe = pref => { const h = h2s.find(x => x.textContent.trim().startsWith(pref)); let el = h && h.nextElementSibling; while (el && el.tagName !== 'TABLE') el = el.nextElementSibling; return el; };
    const filas = t => t ? [...t.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())) : [];
    const porDim = (rows, col) => { const o = {}; rows.forEach(c => { const k = KEYS.find(k => norm(NOMBRES[k]) === norm(c[0])); if (k) o[k] = num(c[col]); }); return o; };
    const lik = filas(tablaDe('1 ·')), fin = filas(tablaDe('3 ·'));
    r.likert = porDim(lik, 1);
    r.abiertas = {}; r.score = {};
    fin.forEach(c => { const k = KEYS.find(k => norm(NOMBRES[k]) === norm(c[0])); if (!k) return; r.abiertas[k] = k === 'sc' ? null : num(c[2]); r.score[k] = num(c[3]); });
    if (!KEYS.every(k => r.likert[k] !== undefined) || !KEYS.every(k => k in r.score)) throw new Error('faltan tablas de puntajes');
    r.nivel = {}; KEYS.forEach(k => { r.nivel[k] = nivelDe(r.score[k]); });
    r.preg = {};
    sec.querySelectorAll('.q').forEach(q => {
      const k = (q.querySelector('.qh b') || {}).textContent; if (!PREG.includes(k)) return;
      const pill = q.querySelector('.qh .pill'); const m = pill && pill.textContent.match(/\((\d)\)/);
      r.preg[k] = m ? +m[1] : null;
    });
    const iv = sec.querySelector('.integral .ival');
    const tx = iv ? iv.textContent : '';
    const pm = tx.match(/Perfil ([A-E]):/);
    r.perfil = pm ? pm[1] : null;
    r.propuesto = /Propuesta/i.test(tx);
    r.provisional = /Informe provisorio/i.test(sec.textContent);
    return r;
  }

  /** Devuelve { informes:[...], errores:[...] } a partir del texto HTML de un archivo. */
  function leerHTML(html, archivo) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const secs = [...doc.querySelectorAll('section.page')];
    const informes = [], errores = [];
    if (!secs.length) errores.push(`${archivo}: no es un informe de Educa Fractalia.`);
    secs.forEach((sec, i) => {
      try {
        const js = sec.querySelector('script.ef-datos');
        const r = js ? desdeDatos(js.textContent) : desdeTexto(sec);
        r.archivo = archivo; r.key = claveDe(r);
        informes.push(r);
      } catch (e) { errores.push(`${archivo} (informe ${i + 1}): ${e.message}`); }
    });
    return { informes, errores };
  }

  async function cargarArchivos(files) {
    const antes = new Set((memoria || await cargar()).map(r => r.key));
    let nuevos = 0, actualizados = 0; const errores = [];
    for (const f of files) {
      let html; try { html = await f.text(); } catch (e) { errores.push(`${f.name}: no se pudo leer.`); continue; }
      const { informes, errores: er } = leerHTML(html, f.name); errores.push(...er);
      for (const r of informes) { r.cargado = new Date().toISOString().slice(0, 10); await guardar(r); antes.has(r.key) ? actualizados++ : nuevos++; antes.add(r.key); }
    }
    await cargar(); avisar();
    return { nuevos, actualizados, errores };
  }
  async function quitarTodos() { await borrar(null); await cargar(); avisar(); }

  /* ───────── Adaptador a la forma que usan los gráficos y estadísticos ───────── */
  function aFila(r) {
    const dims = {};
    KEYS.forEach(k => { dims[k] = { likert: r.likert[k], abiertas: k === 'sc' ? null : (r.abiertas || {})[k], score: r.score[k], nivel: r.nivel ? r.nivel[k] : nivelDe(r.score[k]) }; });
    return { s: { id: r.id, name: r.nombre, curso: r.curso, edad: r.edad, estadia: r.estadia, importado: true, aplicador: r.aplicador, fecha: r.fecha },
      c: { dims, provisional: !!r.provisional }, perfil: r.perfil || null, propuesto: !!r.propuesto, preg: Object.assign({}, r.preg), importado: true };
  }
  const registros = () => (memoria || []).slice();
  const filas = () => registros().map(aFila);

  /* ───────── Aviso a los módulos ───────── */
  const oyentes = [];
  const alCambiar = fn => oyentes.push(fn);
  function avisar() { oyentes.forEach(fn => { try { fn(); } catch (e) { /* un módulo no rompe a otro */ } }); }

  /* ───────── Panel de carga (se inserta en los módulos que lo pidan) ───────── */
  function panel(contenedor, prefijo) {
    contenedor.innerHTML = `<div class="inf-panel">
      <div class="inf-head"><b>Informes cargados</b> <span id="${prefijo}InfN" class="inf-n"></span></div>
      <p class="inf-txt">Agrega informes HTML ya descargados para analizarlos sin volver a generarlos. Sirven los informes de la plataforma, también los anteriores. Quedan guardados solo en este navegador y se suman a los datos del Módulo 01. Si un estudiante está en ambos lados, se usa el del Módulo 01.</p>
      <div class="inf-acc">
        <label class="btn btn-secondary inf-file">Agregar informes (HTML)<input type="file" id="${prefijo}InfFiles" accept=".html,text/html" multiple hidden></label>
        <button class="btn btn-secondary" id="${prefijo}InfQuitar" type="button">Quitar todos los informes cargados</button>
      </div>
      <div class="inf-msg" id="${prefijo}InfMsg" aria-live="polite"></div></div>`;
    const n = document.getElementById(prefijo + 'InfN'), msg = document.getElementById(prefijo + 'InfMsg');
    const pintarN = () => { const k = registros().length; n.textContent = k ? `${k} informe(s) en este navegador` : 'ninguno todavía'; };
    pintarN(); alCambiar(pintarN);
    document.getElementById(prefijo + 'InfFiles').addEventListener('change', async e => {
      const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
      msg.textContent = 'Leyendo informes…';
      const r = await cargarArchivos(files);
      msg.innerHTML = `${r.nuevos} nuevo(s), ${r.actualizados} actualizado(s).` + (r.errores.length ? `<br><span class="inf-err">${r.errores.slice(0, 6).map(x => x.replace(/[<>&]/g, '')).join('<br>')}${r.errores.length > 6 ? `<br>y ${r.errores.length - 6} más.` : ''}</span>` : '');
    });
    document.getElementById(prefijo + 'InfQuitar').addEventListener('click', async () => {
      if (!registros().length) return;
      if (!confirm('¿Quitar todos los informes cargados de este navegador? Los archivos HTML originales no se tocan.')) return;
      await quitarTodos(); msg.textContent = 'Informes quitados.';
    });
  }

  window.Informes = { cargar, cargarArchivos, leerHTML, registros, filas, quitarTodos, alCambiar, panel, nivelDe, NOMBRES, KEYS };
  cargar().then(avisar);
})();
