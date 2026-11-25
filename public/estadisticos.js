/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — MÓDULO 07 · ESTADÍSTICOS I+D (v0.1)
   Estadística descriptiva y calibración metacognitiva para la cohorte
   cargada (Módulo 01 + informes cargados). No guarda datos.
   Diseño según el plan de análisis del boletín de pilotaje: media y
   desviación estándar por dimensión, brecha Likert–abiertas en tres
   categorías, distribución de perfiles y comparación entre grupos
   (sin correlaciones lineales).
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
  const PREG = ['P1', 'P2', 'P3a', 'P3b', 'P4', 'P5'];

  /* ───────── Estadística básica ───────── */
  const limpio = a => a.filter(v => v !== null && v !== undefined && !Number.isNaN(v));
  const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const de = a => { if (a.length < 2) return null; const m = media(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1)); };
  const mediana = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), k = b.length >> 1; return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2; };
  const resumen = a => { const v = limpio(a); return { n: v.length, media: media(v), de: de(v), mediana: mediana(v), min: v.length ? Math.min(...v) : null, max: v.length ? Math.max(...v) : null }; };

  /* ───────── Datos ───────── */
  function datos() {
    const G = window.Graficos; if (!G) return { todos: [], sel: [], excluidos: 0 };
    const todos = G.todos();
    const cu = $('e7Curso').value, es = $('e7Estadia').value, sinProv = $('e7SinProv').checked;
    let sel = todos.filter(d => (!cu || d.curso === cu) && (!es || d.estadia === es));
    const antes = sel.length;
    if (sinProv) sel = sel.filter(d => !d.c.provisional);
    return { todos, sel, excluidos: antes - sel.length };
  }

  /* Calibración: brecha = Likert − abiertas (ambos en escala 1–4), por dimensión con abiertas. */
  function brechas(d) {
    const o = {};
    ['rec', 'heu', 'con'].forEach(k => { const x = d.c.dims[k]; o[k] = (x.likert !== null && x.likert !== undefined && x.abiertas !== null && x.abiertas !== undefined) ? x.likert - x.abiertas : null; });
    return o;
  }
  const categoria = (b, u) => b === null ? null : b >= u ? 'Sobreestimador' : b <= -u ? 'Subestimador' : 'Calibrado';
  const umbral = () => { const v = parseFloat(String($('e7Umbral').value).replace(',', '.')); return v > 0 ? v : 1; };
  function calibracion(d, u) {
    const b = brechas(d), v = limpio(Object.values(b));
    const g = v.length ? media(v) : null;
    return { b, global: g, cat: categoria(g, u) };
  }

  /* ───────── Tablas ───────── */
  const tabla = (cab, filas, cls) => `<div class="e7-scroll"><table class="e7-table${cls ? ' ' + cls : ''}"><thead><tr>${cab.map((c, i) => `<th${i ? ' class="n"' : ''}>${esc(c)}</th>`).join('')}</tr></thead><tbody>${filas.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const tarjeta = (titulo, sub, cuerpo) => `<div class="g6-card wide"><h3>${esc(titulo)}</h3>${sub ? `<p class="g6-sub">${esc(sub)}</p>` : ''}${cuerpo}</div>`;

  function descriptivos(sel) {
    const filas = [];
    KEYS.forEach(k => {
      const med = k === 'sc' ? [['Likert (final)', d => d.c.dims[k].score]] : [['Likert', d => d.c.dims[k].likert], ['Abiertas', d => d.c.dims[k].abiertas], ['Final', d => d.c.dims[k].score]];
      med.forEach(([lbl, fn], i) => {
        const r = resumen(sel.map(fn));
        filas.push([`${i === 0 ? `<b>${esc(NOM[k])}</b> · ` : '&nbsp;&nbsp;&nbsp;'}${esc(lbl)}`, r.n, f2(r.media), f2(r.de), f2(r.mediana), f2(r.min), f2(r.max)]);
      });
    });
    return tarjeta('Estadística descriptiva por dimensión', 'Escala 1–4. DE = desviación estándar muestral (n − 1). La DE se lee como heterogeneidad del grupo: una DE alta indica necesidad de material multinivel; una DE baja, necesidades comunes.',
      tabla(['Dimensión · medida', 'n', 'Media', 'DE', 'Mediana', 'Mín.', 'Máx.'], filas));
  }

  function heterogeneidad(sel) {
    const v = KEYS.map(k => ({ k, r: resumen(sel.map(d => d.c.dims[k].score)) })).filter(x => x.r.de !== null).sort((a, b) => b.r.de - a.r.de);
    if (!v.length) return '';
    const cuerpo = `<p class="e7-txt">Dimensión más heterogénea: <b>${esc(NOM[v[0].k])}</b> (DE ${f2(v[0].r.de)}). Más homogénea: <b>${esc(NOM[v[v.length - 1].k])}</b> (DE ${f2(v[v.length - 1].r.de)}).</p>` +
      tabla(['Dimensión (puntaje final)', 'Media', 'DE'], v.map(x => [esc(NOM[x.k]), f2(x.r.media), f2(x.r.de)]));
    return tarjeta('Heterogeneidad del aula', 'Orden de las dimensiones según su desviación estándar (de mayor a menor).', cuerpo);
  }

  function grupos(sel) {
    const por = $('e7Grupo').value; if (!por) return '';
    const fn = d => por === 'curso' ? (d.curso || 'Sin dato') : (d.estadia || 'Sin dato');
    const nombres = [...new Set(sel.map(fn))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    if (nombres.length < 2) return tarjeta('Comparación entre grupos', '', `<p class="e7-txt">Hay un solo grupo (${esc(nombres[0] || '—')}) con los filtros actuales; no hay comparación posible.</p>`);
    const filas = nombres.map(g => {
      const s = sel.filter(d => fn(d) === g);
      return [`<b>${esc(g)}</b>`, s.length].concat(KEYS.map(k => { const r = resumen(s.map(d => d.c.dims[k].score)); return r.n ? `${f2(r.media)} <span class="e7-de">(${f2(r.de)})</span>` : '—'; }));
    });
    return tarjeta(`Comparación por ${por === 'curso' ? 'curso' : 'estadía'}`, 'Media del puntaje final (desviación estándar entre paréntesis). Con pocos casos por grupo, léase como descripción y no como inferencia.',
      tabla([por === 'curso' ? 'Curso' : 'Estadía', 'n'].concat(KEYS.map(k => NOM[k])), filas));
  }

  function perfiles(sel) {
    const por = $('e7Grupo').value;
    const fn = d => !por ? 'Todos' : por === 'curso' ? (d.curso || 'Sin dato') : (d.estadia || 'Sin dato');
    const nombres = [...new Set(sel.map(fn))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const cab = ['Perfil'].concat(nombres).concat(nombres.length > 1 ? ['Total'] : []).concat(['%']);
    const filas = ['A', 'B', 'C', 'D', 'E', 'X'].map(p => {
      const cnt = g => sel.filter(d => (d.perfil || 'X') === p && (g === null || fn(d) === g)).length;
      const tot = cnt(null);
      return [p === 'X' ? 'Por definir' : `<b>${p}</b> · ${esc(PERFIL[p])}`].concat(nombres.map(g => cnt(g))).concat(nombres.length > 1 ? [tot] : []).concat([sel.length ? Math.round(100 * tot / sel.length) + ' %' : '—']);
    });
    const prop = sel.filter(d => d.propuesto).length;
    return tarjeta('Distribución de perfiles integrales', `Tipología integrada de perfiles metacognitivos.${prop ? ` Incluye ${prop} perfil(es) propuesto(s), pendientes de validar.` : ''}`, tabla(cab, filas));
  }

  function calibracionTarjeta(sel) {
    const u = umbral();
    const filasEst = sel.map(d => ({ d, cal: calibracion(d, u) }));
    const cuenta = (k, cat) => filasEst.filter(x => categoria(x.cal.b[k], u) === cat).length;
    const resumenDim = ['rec', 'heu', 'con'].map(k => [esc(NOM[k]), cuenta(k, 'Calibrado'), cuenta(k, 'Sobreestimador'), cuenta(k, 'Subestimador'), filasEst.filter(x => x.cal.b[k] === null).length]);
    const glob = ['Calibrado', 'Sobreestimador', 'Subestimador'].map(c => filasEst.filter(x => x.cal.cat === c).length);
    const detalle = filasEst.slice().sort((a, b) => (b.cal.global ?? -9) - (a.cal.global ?? -9)).map(x => {
      const cls = x.cal.cat === 'Sobreestimador' ? 'e7-sobre' : x.cal.cat === 'Subestimador' ? 'e7-sub' : '';
      return [esc(x.d.s.id), ['rec', 'heu', 'con'].map(k => f2(x.cal.b[k])).join(' · '), f2(x.cal.global), `<span class="${cls}">${esc(x.cal.cat || 'Sin datos')}</span>`];
    });
    const cuerpo = `<p class="e7-txt">Brecha = Likert − abiertas (escala 1–4). <b>Sobreestimador</b>: autopercepción alta con desempeño bajo (brecha ≥ ${f2(u)}). <b>Subestimador</b>: autopercepción baja con desempeño adecuado (brecha ≤ −${f2(u)}). <b>Calibrado</b>: coherencia entre lo que dicen hacer y lo que ejecutan. El umbral de ${f2(u)} punto(s) es un criterio de trabajo que se puede cambiar; el boletín define las tres categorías pero no fija un valor numérico. Sistema de Creencias no entra porque no tiene preguntas abiertas.</p>` +
      `<p class="e7-txt"><b>Por estudiante</b> (promedio de las brechas disponibles): ${glob[0]} calibrado(s) · ${glob[1]} sobreestimador(es) · ${glob[2]} subestimador(es).</p>` +
      tabla(['Dimensión', 'Calibrados', 'Sobreestimadores', 'Subestimadores', 'Sin dato'], resumenDim) +
      `<details class="e7-det"><summary>Ver detalle por estudiante</summary>${tabla(['Estudiante', 'Brecha Rec · Heu · Con', 'Brecha media', 'Categoría'], detalle)}</details>`;
    return tarjeta('Calibración metacognitiva', 'Cruce entre lo que el estudiante declara (Likert) y lo que evidencia (preguntas abiertas y desarrollo).', cuerpo);
  }

  /* ───────── Exportación ───────── */
  const csvCel = v => { const s = v === null || v === undefined ? '' : (typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('.', ',') : String(v)); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function descargarCSV(nombre, filas) {
    const txt = '﻿' + filas.map(r => r.map(csvCel).join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const hoy = () => new Date().toISOString().slice(0, 10);
  function csvEstudiantes() {
    const { sel } = datos(); if (!sel.length) return; const u = umbral(), nombres = $('e7Nombres').checked;
    const cab = ['codigo'].concat(nombres ? ['nombre'] : []).concat(['curso', 'estadia', 'fuente'], KEYS.map(k => 'likert_' + k), ['rec', 'heu', 'con'].map(k => 'abiertas_' + k), KEYS.map(k => 'final_' + k), KEYS.map(k => 'nivel_' + k), PREG, ['perfil', 'perfil_propuesto', 'provisional', 'brecha_media', 'calibracion']);
    const filas = sel.map(d => {
      const cal = calibracion(d, u);
      return [d.s.id].concat(nombres ? [d.s.name] : []).concat([d.curso, d.estadia, d.importado ? 'informe cargado' : 'Módulo 01'],
        KEYS.map(k => d.c.dims[k].likert), ['rec', 'heu', 'con'].map(k => d.c.dims[k].abiertas), KEYS.map(k => d.c.dims[k].score), KEYS.map(k => d.c.dims[k].nivel ? NIVEL[d.c.dims[k].nivel] : ''),
        PREG.map(q => d.preg[q]), [d.perfil || '', d.propuesto ? 'sí' : 'no', d.c.provisional ? 'sí' : 'no', cal.global, cal.cat || '']);
    });
    descargarCSV(`estadisticos_estudiantes_${hoy()}.csv`, [cab].concat(filas));
  }
  function csvResumen() {
    const { sel } = datos(); if (!sel.length) return;
    const filas = [['dimension', 'medida', 'n', 'media', 'de', 'mediana', 'min', 'max']];
    KEYS.forEach(k => [['likert', d => d.c.dims[k].likert], ['abiertas', d => d.c.dims[k].abiertas], ['final', d => d.c.dims[k].score]].forEach(([m, fn]) => {
      if (k === 'sc' && m === 'abiertas') return; const r = resumen(sel.map(fn)); filas.push([NOM[k], m, r.n, r.media, r.de, r.mediana, r.min, r.max]);
    }));
    descargarCSV(`estadisticos_resumen_${hoy()}.csv`, filas);
  }

  /* ───────── Render ───────── */
  function llenarFiltros(todos) {
    const llenar = (id, vals, nom) => {
      const el = $(id), cur = el.value, opts = [...new Set(vals.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const html = `<option value="">${nom}</option>` + opts.map(v => `<option>${esc(v)}</option>`).join('');
      if (el.dataset.sig !== html) { el.innerHTML = html; el.dataset.sig = html; el.value = opts.includes(cur) ? cur : ''; }
    };
    llenar('e7Curso', todos.map(d => d.curso), 'Todos'); llenar('e7Estadia', todos.map(d => d.estadia), 'Todas');
  }
  function pintar() {
    if (!window.Graficos || !window.PerfilIntegral) return;
    const todos = window.Graficos.todos();
    $('modulo7Empty').style.display = todos.length ? 'none' : '';
    $('modulo7Main').style.display = todos.length ? '' : 'none';
    if (!todos.length) return;
    llenarFiltros(todos);
    const { sel, excluidos } = datos();
    $('e7N').textContent = `${sel.length} de ${todos.length} estudiantes` + (excluidos ? ` · ${excluidos} provisorio(s) excluido(s)` : '');
    const av = $('e7Aviso'), prov = todos.filter(d => d.c.provisional).length;
    av.style.display = prov ? 'block' : 'none';
    av.textContent = prov ? `${prov} estudiante(s) tienen puntajes provisorios (preguntas abiertas sin evaluar o por visar).` + ($('e7SinProv').checked ? ' Se excluyen de los estadísticos; desmarca la casilla para incluirlos.' : ' Están incluidos en los estadísticos.') : '';
    $('e7Out').innerHTML = !sel.length ? '<div class="g6-vacio">No hay estudiantes con esos filtros.</div>'
      : descriptivos(sel) + heterogeneidad(sel) + grupos(sel) + calibracionTarjeta(sel) + perfiles(sel);
  }

  function wire() {
    if (!$('view-modulo7')) return;
    ['e7Curso', 'e7Estadia', 'e7Grupo', 'e7SinProv', 'e7Umbral'].forEach(id => $(id).addEventListener('change', pintar));
    $('e7Umbral').addEventListener('input', pintar);
    $('e7CsvEst').addEventListener('click', csvEstudiantes);
    $('e7CsvRes').addEventListener('click', csvResumen);
    if (window.Informes) { window.Informes.panel($('e7Informes'), 'e7'); window.Informes.alCambiar(() => { if ($('view-modulo7').classList.contains('active')) pintar(); }); }
    if (typeof window.switchView === 'function') {
      const base = window.switchView;
      window.switchView = function (name) { base(name); if (name === 'modulo7') pintar(); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.Estadisticos = { pintar, resumen, calibracion };
})();
