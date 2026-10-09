/* ═════════════════════════════════════════════════════════════════
   EDUCA FRACTALIA — ADAPTADOR KOBOTOOLBOX (v0.6)
   ───────────────────────────────────────────────────────────────
   Se carga DESPUÉS de app.js. No cambia la lógica de los módulos
   01–03: solo enseña al lector de planillas a reconocer el archivo
   que se descarga directamente de KoboToolbox (Data → Descargas →
   XLSX, con etiquetas en español).

   Qué cambió respecto del formato anterior (Kobo → Google Sheets):
   · Los encabezados ahora son el texto completo de cada pregunta
     (ya no vienen desalineados ni con prefijo grupo_*).
   · Los adjuntos ya no son enlaces de Drive: son URLs de la API de
     Kobo (…/attachments/<id>/) y requieren sesión en Kobo, por lo
     que el navegador no puede mostrarlas; las imágenes se cargan
     como archivos (ver Módulo 04) y se asocian por NOMBRE DE ARCHIVO.
   · Cada respuesta trae dos columnas por imagen: nombre del archivo
     y URL. Los nombres de archivo se usan para emparejar.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // 1) Una URL de adjunto de Kobo cuenta como "enlace de imagen".
  //    (isDriveUrl en app.js llama a extractDriveId en cada uso.)
  const extractOriginal = window.extractDriveId;
  window.extractDriveId = function (url) {
    const id = typeof extractOriginal === 'function' ? extractOriginal(url) : null;
    if (id) return id;
    if (!url) return null;
    const m = url.toString().match(/\/attachments\/([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  };

  // 2) En Kobo el encabezado de la columna del dibujo dice
  //    "Resuelve el problema dibujando directamente en la tablet…_URL".
  if (typeof HEADER_ALIASES !== 'undefined' && HEADER_ALIASES.urlDibujo) {
    ['dibujando', 'tablet'].forEach(a => {
      if (!HEADER_ALIASES.urlDibujo.includes(a)) HEADER_ALIASES.urlDibujo.push(a);
    });
  }
})();
