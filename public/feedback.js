/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — MÓDULO 05 · FEEDBACK FORMATIVO (v0.1)
   Reúne la retroalimentación de cada estudiante (la del Módulo 04 con las
   ediciones de la docente, o la del informe cargado) y propone orientaciones
   para el aula a partir de los resultados del grupo. No guarda datos:
   los textos editables de cada estudiante se trabajan en el Módulo 04.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t === null || t === undefined ? '' : t).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const f2 = n => (n === null || n === undefined || Number.isNaN(n)) ? '—' : n.toFixed(2).replace('.', ',');
  const KEYS = ['rec', 'heu', 'con', 'sc'];
  const NOM = { rec: 'Recursos', heu: 'Heurísticas', con: 'Control', sc: 'Sistema de Creencias' };
  const NIVEL = { 4: 'Destacado', 3: 'Competente', 2: 'Adecuado', 1: 'Insuficiente' };
  const PERFIL = { A: 'Metacognitivo avanzado', B: 'Estratega parcial', C: 'Reflexivo en desarrollo', D: 'Metacognición en desarrollo', E: 'Metacognición incipiente' };
  const NIVEL_ADMIN = { A: 4, B: 3, C: 3, D: 2, E: 1 };
  const PREG_DIM = { P1: 'rec', P2: 'rec', P3a: 'heu', P3b: 'heu', P4: 'con', P5: 'con' };
  /* Sugerencias de aula por dimensión: punto de partida editable por la docente. */
  const SUGERENCIA = {
    rec: 'Antes de resolver, pedir que expliciten qué operación usarán y por qué, y comparar con el desarrollo escrito.',
    heu: 'Pedir al menos tres pasos ordenados y mostrar y comparar distintas formas de representar el mismo problema (dibujo, esquema, tabla).',
    con: 'Incorporar un momento de revisión explícita al terminar (repetir el cálculo, verificar que el resultado tenga sentido) y preguntar qué harían distinto.',
    sc: 'Conversar sobre el error como parte del aprendizaje y sobre el esfuerzo que requiere resolver, destacando avances concretos.'
  };
  const media = a => { const v = a.filter(x => x !== null && x !== undefined && !Number.isNaN(x)); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
  const lista = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : (a[0] || '');

  /* ───────── Datos ───────── */
  function filtrados() {
    const G = window.Graficos; if (!G) return { todos: [], sel: [] };
    const todos = G.todos();
    const cu = $('e5Curso').value, es = $('e5Estadia').value;
    return { todos, sel: todos.filter(d => (!cu || d.curso === cu) && (!es || d.estadia === es)) };
  }

  /** Texto de retroalimentación de un estudiante: el del informe cargado si lo trae; si no, el de la plataforma. */
  function textoDe(d) {
    const P = window.PerfilIntegral;
    if (d.importado) {
      if (d.feedback) return d.feedback;
      const c = { s: d.s, dims: d.c.dims, perfil: d.propuesto ? null : d.perfil, provisional: d.c.provisional };
      return P.feedbackAuto(c);
    }
    return P.feedbackDe(d.c);
  }

  /* ───────── Orientaciones para el aula ───────── */
  function aula(sel) {
    const n = sel.length;
    const dims = KEYS.map(k => {
      const fin = sel.map(d => d.c.dims[k].score), niv = sel.map(d => d.c.dims[k].nivel).filter(x => x);
      return { k, media: media(fin), nBajo: niv.filter(x => x <= 2).length, nNiv: niv.length };
    }).filter(x => x.media !== null);
    if (!dims.length) return null;
    const orden = [...dims].sort((a, b) => a.media - b.media);
    const preg = Object.keys(PREG_DIM).map(q => ({ q, media: media(sel.map(d => d.preg[q])), n: sel.filter(d => d.preg[q] !== null && d.preg[q] !== undefined).length })).filter(x => x.media !== null).sort((a, b) => a.media - b.media);
    return { n, dims, orden, preg };
  }
  function textoAula(a) {
    const bajo = a.orden[0], alto = a.orden[a.orden.length - 1];
    const L = [];
    L.push(`Fortaleza del grupo: ${NOM[alto.k]} (media ${f2(alto.media)} en escala 1–4).`);
    L.push(`Aspecto prioritario para el aula: ${NOM[bajo.k]} (media ${f2(bajo.media)}; ${bajo.nBajo} de ${bajo.nNiv} estudiantes en nivel Adecuado o Insuficiente).`);
    if (a.orden.length > 2) { const seg = a.orden[1]; L.push(`Segundo aspecto a atender: ${NOM[seg.k]} (media ${f2(seg.media)}; ${seg.nBajo} de ${seg.nNiv} en nivel Adecuado o Insuficiente).`); }
    if (a.preg.length) { const b = a.preg.slice(0, 2).map(x => `${x.q} (media ${f2(x.media)}, n = ${x.n})`); L.push(`Preguntas abiertas con menor puntaje medio: ${lista(b)}.`); }
    L.push('');
    L.push(`Sugerencia para trabajar ${NOM[bajo.k]}: ${SUGERENCIA[bajo.k]}`);
    L.push('Como los niveles son distintos entre estudiantes, conviene combinar esta actividad común con material de distinta complejidad según el perfil de cada estudiante (ver retroalimentación individual).');
    return L.join('\n');
  }
  function tarjetaAula(sel) {
    const a = aula(sel);
    if (!a) return '<div class="g6-vacio">No hay datos suficientes para orientar el aula con esos filtros.</div>';
    const cuenta = ['A', 'B', 'C', 'D', 'E'].map(p => `${p} ${sel.filter(d => d.perfil === p).length}`).join(' · ');
    return `<div class="g6-card wide"><h3>Orientaciones para el aula</h3>
      <p class="g6-sub">Redactadas con los resultados de ${a.n} estudiante(s). Las sugerencias son un punto de partida: edita el texto antes de usarlo. Perfiles del grupo: ${cuenta}.</p>
      <textarea class="e5-aula" id="e5Aula">${esc(textoAula(a))}</textarea>
      <div class="g6-foot"><span>El texto se puede copiar o se incluye tal cual en la descarga.</span><button class="g6-dl" id="e5CopiarAula" type="button">Copiar texto</button></div></div>`;
  }

  /* ───────── Por estudiante ───────── */
  function tarjetasEstudiantes(sel) {
    const orden = [...sel].sort((x, y) => String(x.s.name).localeCompare(String(y.s.name), 'es'));
    return `<div class="g6-card wide"><h3>Retroalimentación por estudiante</h3>
      <p class="g6-sub">Es la retroalimentación del informe de cada estudiante. Para modificar un texto de un estudiante del Módulo 01, edítalo en el Módulo 04; los informes cargados se muestran como fueron descargados.</p>
      ${orden.map((d, i) => {
        const pf = d.perfil ? `Perfil ${d.perfil} · ${PERFIL[d.perfil]}${d.propuesto ? ' (propuesto)' : ''}` : 'Perfil por definir';
        const na = d.perfil ? NIVEL[NIVEL_ADMIN[d.perfil]] : '';
        return `<details class="e5-est"><summary><b>${esc(d.s.name)}</b> <span class="e5-tag">${esc(d.s.id)} · ${esc(d.curso || '—')} · ${esc(pf)}${na ? ' · ' + na : ''}</span>${d.c.provisional ? '<span class="e5-prov">provisorio</span>' : ''}</summary>
        <div class="e5-fb"><span data-i="${i}">${esc(textoDe(d))}</span><div class="e5-acc"><button class="g6-dl e5-copiar" data-i="${i}" type="button">Copiar</button></div></div></details>`;
      }).join('')}</div>`;
  }

  /* ───────── Descargas ───────── */
  function aulaTexto() { const el = $('e5Aula'); return el ? el.value : ''; }
  function ordenados() { return [...filtrados().sel].sort((x, y) => String(x.s.name).localeCompare(String(y.s.name), 'es')); }
  function descargarBlob(nombre, tipo, txt) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: tipo })); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const hoy = () => new Date().toISOString().slice(0, 10);
  const nombresOn = () => $('e5Nombres').checked;
  const etiqueta = d => nombresOn() ? d.s.name : d.s.id;

  function descargarHtml() {
    const est = ordenados(); if (!est.length) return;
    const br = t => esc(t).replace(/\n/g, '<br>');
    const aulaT = aulaTexto();
    const paginas = est.map(d => `<section class="pg"><h1>${esc(etiqueta(d))}</h1><div class="m">${esc(d.s.id)} · ${esc(d.curso || '—')}${d.perfil ? ' · Perfil ' + d.perfil + ' · ' + esc(PERFIL[d.perfil]) + (d.propuesto ? ' (propuesto)' : '') : ''}${d.c.provisional ? ' · Informe provisorio' : ''}</div><h2>Retroalimentación formativa</h2><p>${br(textoDe(d))}</p></section>`).join('');
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Retroalimentación formativa</title><style>
      body{font-family:Helvetica,Arial,sans-serif;color:#1d2433;margin:0}.pg{padding:28mm 22mm;page-break-after:always;max-width:170mm;margin:0 auto}
      h1{font-size:20px;margin:0 0 4px;color:#1f3a8a}.m{font-size:12px;color:#6b7280;margin-bottom:18px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#3b5bb5}
      p{font-size:13.5px;line-height:1.65}@page{size:A4;margin:0}</style></head><body>
      ${aulaT.trim() ? `<section class="pg"><h1>Orientaciones para el aula</h1><div class="m">Educa Fractalia · ${hoy()}</div><p>${br(aulaT)}</p></section>` : ''}${paginas}</body></html>`;
    descargarBlob(`retroalimentaciones_${hoy()}.html`, 'text/html;charset=utf-8', html);
  }
  const csvCel = v => { const s = v === null || v === undefined ? '' : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function descargarCsv() {
    const est = ordenados(); if (!est.length) return;
    const cab = ['codigo'].concat(nombresOn() ? ['nombre'] : []).concat(['curso', 'perfil', 'perfil_propuesto', 'nivel_integral', 'provisional', 'retroalimentacion']);
    const filas = est.map(d => [d.s.id].concat(nombresOn() ? [d.s.name] : []).concat([d.curso, d.perfil || '', d.propuesto ? 'sí' : 'no', d.perfil ? NIVEL[NIVEL_ADMIN[d.perfil]] : '', d.c.provisional ? 'sí' : 'no', textoDe(d)]));
    descargarBlob(`retroalimentaciones_${hoy()}.csv`, 'text/csv;charset=utf-8', '﻿' + [cab].concat(filas).map(r => r.map(csvCel).join(';')).join('\r\n'));
  }
  async function copiar(txt, btn) {
    try { await navigator.clipboard.writeText(txt); const o = btn.textContent; btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = o; }, 1200); } catch (e) { btn.textContent = 'No se pudo copiar'; }
  }

  /* ───────── Render ───────── */
  function llenarFiltros(todos) {
    const llenar = (id, vals, nom) => {
      const el = $(id), cur = el.value, opts = [...new Set(vals.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const html = `<option value="">${nom}</option>` + opts.map(v => `<option>${esc(v)}</option>`).join('');
      if (el.dataset.sig !== html) { el.innerHTML = html; el.dataset.sig = html; el.value = opts.includes(cur) ? cur : ''; }
    };
    llenar('e5Curso', todos.map(d => d.curso), 'Todos'); llenar('e5Estadia', todos.map(d => d.estadia), 'Todas');
  }
  function pintar() {
    if (!window.Graficos || !window.PerfilIntegral) return;
    const todos = window.Graficos.todos();
    $('modulo5Empty').style.display = todos.length ? 'none' : '';
    $('modulo5Main').style.display = todos.length ? '' : 'none';
    if (!todos.length) return;
    llenarFiltros(todos);
    const { sel } = filtrados();
    const sinProv = $('e5SinProv').checked;
    const baseAula = sinProv ? sel.filter(d => !d.c.provisional) : sel;
    $('e5N').textContent = `${sel.length} de ${todos.length} estudiantes`;
    const prov = sel.filter(d => d.c.provisional).length, av = $('e5Aviso');
    av.style.display = prov ? 'block' : 'none';
    av.textContent = prov ? `${prov} estudiante(s) tienen retroalimentación provisoria (preguntas abiertas sin evaluar o por visar).` : '';
    $('e5Out').innerHTML = !sel.length ? '<div class="g6-vacio">No hay estudiantes con esos filtros.</div>' : tarjetaAula(baseAula) + tarjetasEstudiantes(sel);
    const ca = $('e5CopiarAula'); if (ca) ca.addEventListener('click', () => copiar(aulaTexto(), ca));
    const ord = [...sel].sort((x, y) => String(x.s.name).localeCompare(String(y.s.name), 'es'));
    document.querySelectorAll('.e5-copiar').forEach(b => b.addEventListener('click', () => copiar(textoDe(ord[+b.dataset.i]), b)));
  }

  function wire() {
    if (!$('view-modulo5')) return;
    ['e5Curso', 'e5Estadia', 'e5SinProv'].forEach(id => $(id).addEventListener('change', pintar));
    $('e5Html').addEventListener('click', descargarHtml);
    $('e5Csv').addEventListener('click', descargarCsv);
    if (window.Informes) { window.Informes.panel($('e5Informes'), 'e5'); window.Informes.alCambiar(() => { if ($('view-modulo5').classList.contains('active')) pintar(); }); }
    if (typeof window.switchView === 'function') {
      const base = window.switchView;
      window.switchView = function (name) { base(name); if (name === 'modulo5') pintar(); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.Feedback = { pintar };
})();
