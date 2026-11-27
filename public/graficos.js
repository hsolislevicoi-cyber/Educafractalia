/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — MÓDULO 06 · GRÁFICOS (v0.9)
   Gráficos de cohorte en SVG (sin librerías). Usa los cálculos del
   Módulo 04 (window.PerfilIntegral) y no guarda datos en ningún lado.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const FONT = "Poppins, 'Helvetica Neue', Arial, sans-serif";
  const INK = '#1A2142', GRIS = '#706F6F', LINEA = '#E3E8F2', AZUL = '#243882', AZUL_M = '#4064AB', AZUL_C = '#9FB6DF';
  const NIVEL_COL = { 4: '#2E6B4A', 3: '#5A8B6D', 2: '#C98840', 1: '#B85C5C' };
  const NIVEL_NOM = { 4: 'Destacado', 3: 'Competente', 2: 'Adecuado', 1: 'Insuficiente' };
  const PERFIL_COL = { A: '#2E6B4A', B: '#5A8B6D', C: '#8FB59E', D: '#C98840', E: '#B85C5C', X: '#B5BAC8' };
  const esc = t => String(t).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const f2 = n => (n === null || n === undefined) ? '—' : n.toFixed(2).replace('.', ',');
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const PI = () => window.PerfilIntegral;
  const students = () => (typeof state !== 'undefined' && state.students) ? state.students : [];

  /* ───────── Datos ───────── */
  const normTxt = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const estLbl = s => s.importado ? (s.estadia || '') : (typeof formatEstadia === 'function' ? formatEstadia(s.estadia) : (s.estadia || ''));
  /* Estudiantes del Módulo 01 más informes cargados (los del Módulo 01 tienen prioridad si coinciden). */
  const llave = f => normTxt(f.s.id) + '|' + normTxt(f.s.name);
  /* Si un estudiante está en el Módulo 01 y también en un informe cargado, se usa el del Módulo 01,
     salvo que ese esté provisorio y el informe no: entonces gana el informe (ya evaluado). */
  function todos() {
    const base = calcular(students());
    const inf = window.Informes ? window.Informes.filas() : [];
    const porLlave = new Map(inf.map(f => [llave(f), f]));
    const usados = new Set();
    const filas = base.map(d => {
      const r = porLlave.get(llave(d));
      if (r && d.c.provisional && !r.c.provisional) { usados.add(llave(d)); return r; }
      if (r) usados.add(llave(d));
      return d;
    });
    inf.forEach(f => { if (!usados.has(llave(f))) filas.push(f); });
    filas.forEach(d => { d.curso = d.s.curso || ''; d.estadia = estLbl(d.s); });
    return filas;
  }
  function filtrar(filas) {
    const cu = $('g6Curso').value, es = $('g6Estadia').value;
    return filas.filter(d => (!cu || d.curso === cu) && (!es || d.estadia === es));
  }
  function calcular(lista) {
    const P = PI();
    return lista.map(s => {
      const c = P.compute(s);
      const perfil = c.perfil || (c.propuesta ? c.propuesta.perfil : null);
      const preg = {};
      P.PREGUNTAS.forEach(q => { const p = P.puntajeAbierta(s, q.key); preg[q.key] = p ? p.v : null; });
      return { s, c, perfil, propuesto: !c.perfil && !!c.propuesta, preg };
    });
  }

  /* ───────── Mini-librería SVG ───────── */
  function svg(w, h, inner, titulo) {
    return `<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}" role="img" aria-label="${esc(titulo)}"><rect width="${w}" height="${h}" fill="#fff"/>${inner}</svg>`;
  }
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 11}" fill="${o.c || INK}" text-anchor="${o.a || 'start'}"${o.w ? ` font-weight="${o.w}"` : ''}${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ''}>${esc(t)}</text>`;
  const rect = (x, y, w, h, c, r = 3) => `<rect x="${x}" y="${y}" width="${Math.max(w, 0)}" height="${Math.max(h, 0)}" rx="${r}" fill="${c}"/>`;

  /* Barras horizontales: items [{label, v, color, extra}] */
  function barrasH(items, o) {
    const W = 500, L = o.left || 150, R = o.right || 76, rowH = 30, top = 8, H = top + items.length * rowH + 8;
    const max = o.max || Math.max(1, ...items.map(i => i.v));
    let s = '';
    items.forEach((it, i) => {
      const y = top + i * rowH, w = (W - L - R) * (it.v / max);
      s += txt(L - 10, y + 17, it.label, { a: 'end', s: 11.5 });
      s += rect(L, y + 5, (W - L - R), 18, '#F3F5FA', 4);
      if (it.v > 0) s += rect(L, y + 5, w, 18, it.color, 4);
      s += txt(L + w + 8, y + 18, it.texto || String(it.v), { s: 11.5, w: 600 });
    });
    return svg(W, H, s, o.titulo);
  }

  /* Barras verticales agrupadas: grupos [{label, barras:[{v,color}]}], escala 0–max */
  function barrasV(grupos, o) {
    const W = 560, H = 290, L = 38, R = 12, T = 18, B = 52, max = o.max || 4;
    const iw = W - L - R, ih = H - T - B;
    let s = '';
    for (let t = 0; t <= max; t++) {
      const y = T + ih - ih * (t / max);
      s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${LINEA}"/>` + txt(L - 8, y + 4, t, { a: 'end', c: GRIS, s: 10.5 });
    }
    (o.umbrales || []).forEach(u => {
      const y = T + ih - ih * (u.v / max);
      s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${u.c}" stroke-dasharray="4 4"/>`;
    });
    const gw = iw / grupos.length;
    grupos.forEach((g, gi) => {
      const n = g.barras.length, bw = Math.min(34, (gw * 0.8) / n), x0 = L + gi * gw + (gw - bw * n - (n - 1) * 4) / 2;
      g.barras.forEach((b, bi) => {
        const x = x0 + bi * (bw + 4), h = b.v === null ? 0 : ih * (b.v / max), y = T + ih - h;
        if (b.v !== null) { s += rect(x, y, bw, h, b.color, 3); s += txt(x + bw / 2, y - 5, f2(b.v), { a: 'middle', s: 10.5, w: 600 }); }
        else s += txt(x + bw / 2, T + ih - 6, 's/d', { a: 'middle', s: 10, c: GRIS });
      });
      s += txt(L + gi * gw + gw / 2, H - B + 20, g.label, { a: 'middle', s: 11.5 });
      if (g.sub) s += txt(L + gi * gw + gw / 2, H - B + 34, g.sub, { a: 'middle', s: 10, c: GRIS });
    });
    if (o.leyenda) {
      let x = L;
      o.leyenda.forEach(l => { s += rect(x, H - 14, 10, 10, l.color, 2) + txt(x + 15, H - 5, l.label, { s: 10.5, c: GRIS }); x += 22 + l.label.length * 6.2; });
    }
    return svg(W, H, s, o.titulo);
  }

  /* Barras apiladas al 100 %: filas [{label, partes:[{v,color,label}]}] */
  function apiladas(filas, o) {
    const W = 500, L = 150, R = 14, rowH = 34, top = 8, leg = 44, H = top + filas.length * rowH + leg + 6;
    let s = '';
    filas.forEach((f, i) => {
      const y = top + i * rowH, tot = f.partes.reduce((a, p) => a + p.v, 0);
      s += txt(L - 10, y + 19, f.label, { a: 'end', s: 11.5 });
      let x = L;
      if (!tot) s += txt(L, y + 19, 'sin datos', { c: GRIS, s: 11 });
      f.partes.forEach(p => {
        const w = tot ? (W - L - R) * p.v / tot : 0;
        if (p.v) { s += rect(x, y + 5, w, 22, p.color, 0); if (w > 22) s += txt(x + w / 2, y + 20, p.v, { a: 'middle', c: '#fff', s: 11, w: 600 }); }
        x += w;
      });
    });
    let x = 10; const yl = top + filas.length * rowH + 16;
    o.leyenda.forEach(l => { s += rect(x, yl - 9, 10, 10, l.color, 2) + txt(x + 15, yl, l.label, { s: 10.5, c: GRIS }); x += 26 + l.label.length * 6.4; });
    return svg(W, H, s, o.titulo);
  }

  /* Radar: ejes [{label}], series [{nombre, vals, color, relleno}] escala 1–4 */
  function radar(ejes, series, o) {
    const W = 560, H = 330, cx = W / 2, cy = 160, R = 108, n = ejes.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * (v - 0) / 4; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let s = '';
    for (let t = 1; t <= 4; t++) {
      s += `<polygon points="${ejes.map((_, i) => pt(i, t).join(',')).join(' ')}" fill="none" stroke="${LINEA}"/>`;
      s += txt(cx + 4, cy - R * t / 4 + 12, t, { s: 9.5, c: GRIS });
    }
    ejes.forEach((e, i) => {
      const [x, y] = pt(i, 4); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${LINEA}"/>`;
      const [lx, ly] = pt(i, 4.55); s += txt(lx, ly + 4, e.label, { a: Math.abs(lx - cx) < 6 ? 'middle' : lx > cx ? 'start' : 'end', s: 11.5, w: 500 });
    });
    series.forEach(se => {
      const ok = se.vals.every(v => v !== null);
      if (!ok) return;
      const pts = se.vals.map((v, i) => pt(i, v).join(',')).join(' ');
      s += `<polygon points="${pts}" fill="${se.color}" fill-opacity="${se.relleno ? .22 : 0}" stroke="${se.color}" stroke-width="2.2"${se.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
      se.vals.forEach((v, i) => { const [x, y] = pt(i, v); s += `<circle cx="${x}" cy="${y}" r="3.6" fill="${se.color}"/>`; });
    });
    let x = 150; const yl = H - 12;
    series.forEach(se => { s += rect(x, yl - 9, 10, 10, se.color, 2) + txt(x + 15, yl, se.nombre, { s: 11, c: GRIS }); x += 30 + se.nombre.length * 6.3; });
    return svg(W, H, s, o.titulo);
  }

  /* ───────── Tarjetas ───────── */
  const tarjetas = []; // {id, titulo, sub, render:()=>svgString, extra}
  function card(id, titulo, sub, wide) { return { id, titulo, sub, wide }; }

  function construir(datos) {
    const P = PI(), n = datos.length;
    const out = [];

    // 1) Perfiles
    const cnt = { A: 0, B: 0, C: 0, D: 0, E: 0, X: 0 }, prop = {};
    datos.forEach(d => { const k = d.perfil || 'X'; cnt[k]++; if (d.propuesto) prop[k] = (prop[k] || 0) + 1; });
    out.push({
      id: 'perfiles', titulo: 'Distribución de perfiles integrales', sub: 'Foco pedagógico. «Por definir» agrupa casos atípicos o sin puntajes completos. Incluye perfiles propuestos.',
      svg: barrasH(['A', 'B', 'C', 'D', 'E', 'X'].map(k => ({
        label: k === 'X' ? 'Por definir' : `${k} · ${P.PERFILES[k].nombre}`, v: cnt[k], color: PERFIL_COL[k],
        texto: `${cnt[k]} (${n ? Math.round(100 * cnt[k] / n) : 0}%)` + (prop[k] ? ` · ${prop[k]} prop.` : '')
      })), { left: 205, right: 112, max: Math.max(1, ...Object.values(cnt)), titulo: 'Distribución de perfiles integrales' })
    });

    // 2) Nivel administrativo
    const adm = { 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    datos.forEach(d => { const nv = d.perfil ? P.NIVEL_ADMIN[d.perfil] : 0; adm[nv]++; });
    out.push({
      id: 'nivel-admin', titulo: 'Nivel integral · foco administrativo', sub: 'Conversión del perfil al estándar de la Escuela Común Hospital (A→Destacado, B y C→Competente, D→Adecuado, E→Insuficiente).',
      svg: barrasH([4, 3, 2, 1, 0].map(k => ({ label: k ? NIVEL_NOM[k] : 'Por definir', v: adm[k], color: k ? NIVEL_COL[k] : PERFIL_COL.X, texto: `${adm[k]} (${n ? Math.round(100 * adm[k] / n) : 0}%)` })),
        { left: 130, max: Math.max(1, ...Object.values(adm)), titulo: 'Nivel integral administrativo' })
    });

    // 3) Promedios por dimensión: Likert / Abiertas / Final
    const grupos = P.DIMS.map(dm => {
      const g = k => avg(datos.map(d => d.c.dims[dm.key][k]).filter(v => v !== null && v !== undefined));
      return { label: dm.name.replace('Sistema de ', 'S. de '), barras: [{ v: g('likert'), color: AZUL_C }, { v: dm.open.length ? g('abiertas') : null, color: AZUL_M }, { v: g('score'), color: AZUL }] };
    });
    out.push({
      id: 'dimensiones', wide: true, titulo: 'Promedio por dimensión: Likert, preguntas abiertas y puntaje final', sub: 'Escala 1–4. Líneas punteadas: umbrales de nivel (2,00 · 2,65 · 3,40). Creencias se mide solo con Likert.',
      svg: barrasV(grupos, { max: 4, titulo: 'Promedio por dimensión', umbrales: [{ v: 2.0, c: NIVEL_COL[1] }, { v: 2.65, c: NIVEL_COL[2] }, { v: 3.4, c: NIVEL_COL[4] }], leyenda: [{ label: 'Likert', color: AZUL_C }, { label: 'Abiertas', color: AZUL_M }, { label: 'Final', color: AZUL }] })
    });

    // 4) Niveles por dimensión
    const filas = P.DIMS.map(dm => {
      const c = { 4: 0, 3: 0, 2: 0, 1: 0 }; datos.forEach(d => { const nv = d.c.dims[dm.key].nivel; if (nv) c[nv]++; });
      return { label: dm.name, partes: [4, 3, 2, 1].map(k => ({ v: c[k], color: NIVEL_COL[k] })) };
    });
    out.push({
      id: 'niveles-dim', titulo: 'Niveles por dimensión', sub: 'Cantidad de estudiantes en cada nivel, según el puntaje final de la dimensión.',
      svg: apiladas(filas, { titulo: 'Niveles por dimensión', leyenda: [4, 3, 2, 1].map(k => ({ label: NIVEL_NOM[k], color: NIVEL_COL[k] })) })
    });

    // 5) Puntaje medio por pregunta abierta (incluye 0 = sin respuesta)
    const pq = P.PREGUNTAS.map(q => { const v = datos.map(d => d.preg[q.key]).filter(x => x !== null); return { k: q.key, v: avg(v), n: v.length }; });
    out.push({
      id: 'preguntas', titulo: 'Puntaje medio por pregunta abierta', sub: 'Escala 0–4 (0 = sin respuesta o irrelevante). Entre paréntesis, cuántos estudiantes tienen la pregunta evaluada.',
      svg: barrasH(pq.map(q => ({ label: `${q.k} · ${({ rec: 'Recursos', heu: 'Heurísticas', con: 'Control' })[P.PREGUNTAS.find(x => x.key === q.k).dim]}`, v: q.v === null ? 0 : q.v, color: AZUL_M, texto: q.v === null ? 's/d' : `${f2(q.v)} (${q.n})` })),
        { left: 130, max: 4, titulo: 'Puntaje medio por pregunta abierta' })
    });
    return out;
  }

  /* ───────── Render ───────── */
  const PNG = {};
  function pintar() {
    const P = PI(); if (!P) return;
    const lista = todos();
    $('modulo6Empty').style.display = lista.length ? 'none' : '';
    $('modulo6Main').style.display = lista.length ? '' : 'none';
    if (!lista.length) return;
    llenarFiltros(lista);
    const datos = filtrar(lista);
    const nImp = datos.filter(d => d.importado).length;
    $('g6N').textContent = `${datos.length} de ${lista.length} estudiantes` + (nImp ? ` · ${nImp} desde informes cargados` : '');
    const prov = datos.filter(d => d.c.provisional).length;
    const av = $('g6Aviso');
    av.style.display = prov ? 'block' : 'none';
    av.textContent = prov ? `${prov} estudiante(s) tienen puntajes provisorios (preguntas abiertas sin evaluar o con propuesta de IA por visar). Los gráficos se actualizan al visarlas en el Módulo 04.` : '';
    const grid = $('g6Grid');
    if (!datos.length) { grid.innerHTML = '<div class="g6-vacio">No hay estudiantes con ese filtro.</div>'; return; }
    const cards = construir(datos);
    grid.innerHTML = cards.map(c => `<div class="g6-card${c.wide ? ' wide' : ''}" data-id="${c.id}"><h3>${esc(c.titulo)}</h3><p class="g6-sub">${esc(c.sub)}</p>${c.svg}<div class="g6-foot"><span></span><button class="g6-dl" data-id="${c.id}">Descargar PNG</button></div></div>`).join('') + radarCard(datos);
    wireRadar(datos);
  }

  function llenarFiltros(lista) {
    const llenar = (id, vals, todos) => {
      const el = $(id), cur = el.value, opts = [...new Set(vals.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const html = `<option value="">${todos}</option>` + opts.map(v => `<option>${esc(v)}</option>`).join('');
      if (el.dataset.sig !== html) { el.innerHTML = html; el.dataset.sig = html; el.value = opts.includes(cur) ? cur : ''; }
    };
    llenar('g6Curso', lista.map(d => d.curso), 'Todos');
    llenar('g6Estadia', lista.map(d => d.estadia), 'Todas');
  }

  /* Radar por estudiante vs promedio del grupo */
  function radarCard(datos) {
    const opts = datos.map((d, i) => `<option value="${i}">${esc(d.s.id)} · ${esc(d.s.name)}</option>`).join('');
    return `<div class="g6-card wide" data-id="radar"><h3>Estudiante frente al grupo</h3><p class="g6-sub">Puntaje final por dimensión (escala 1–4) del estudiante elegido, comparado con el promedio del grupo filtrado.</p><div><select id="g6Est">${opts}</select></div><div id="g6RadarBox"></div><div class="g6-foot"><span id="g6RadarInfo"></span><button class="g6-dl" data-id="radar">Descargar PNG</button></div></div>`;
  }
  function wireRadar(datos) {
    const P = PI(), ejes = P.DIMS.map(d => ({ label: d.name }));
    const prom = P.DIMS.map(d => avg(datos.map(x => x.c.dims[d.key].score).filter(v => v !== null)));
    const draw = () => {
      const d = datos[+$('g6Est').value]; if (!d) return;
      const vals = P.DIMS.map(x => d.c.dims[x.key].score);
      $('g6RadarBox').innerHTML = radar(ejes, [
        { nombre: 'Promedio del grupo', vals: prom, color: AZUL_C, relleno: true, dash: true },
        { nombre: `${d.s.id} ${d.s.name.split(' ')[0]}`, vals, color: AZUL, relleno: true }
      ], { titulo: 'Estudiante frente al grupo' });
      const pf = d.perfil ? `Perfil ${d.perfil} · ${P.PERFILES[d.perfil].nombre}${d.propuesto ? ' (propuesto)' : ''}` : 'Perfil por definir';
      $('g6RadarInfo').textContent = pf + (vals.some(v => v === null) ? ' · faltan puntajes en alguna dimensión' : '');
    };
    $('g6Est').addEventListener('change', draw); draw();
  }

  /* ───────── Descarga PNG ───────── */
  function aPNG(svgEl, nombre) {
    return new Promise(res => {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const w = +svgEl.getAttribute('width'), h = +svgEl.getAttribute('height'), k = 2.5;
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k;
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); res(); }, 'image/png');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
  }
  const slug = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  async function bajar(ids) {
    for (const id of ids) {
      const el = document.querySelector(`.g6-card[data-id="${id}"] svg`); if (!el) continue;
      await aPNG(el, 'grafico_' + slug(document.querySelector(`.g6-card[data-id="${id}"] h3`).textContent));
      await new Promise(r => setTimeout(r, 300));
    }
  }

  function wire() {
    if (!$('view-modulo6')) return;
    $('g6Curso').addEventListener('change', pintar);
    $('g6Estadia').addEventListener('change', pintar);
    $('g6Grid').addEventListener('click', e => { const b = e.target.closest('.g6-dl'); if (b) bajar([b.dataset.id]); });
    $('g6DlTodo').addEventListener('click', () => bajar([...document.querySelectorAll('.g6-card')].map(c => c.dataset.id)));
    if (window.Informes) { window.Informes.panel($('g6Informes'), 'g6'); window.Informes.alCambiar(() => { if (document.getElementById('view-modulo6').classList.contains('active')) pintar(); }); }
    if (typeof window.switchView === 'function') {
      const base = window.switchView;
      window.switchView = function (name) { base(name); if (name === 'modulo6') pintar(); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.Graficos = { pintar, construir, calcular, todos, estLbl };
})();
