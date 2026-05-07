# Educa Fractalia · Sistema de Evaluación Metacognitiva

Sistema web para la evaluación metacognitiva en resolución de problemas matemáticos, basado en el instrumento validado de Mg. Alejandra Solís Levicoi (UdeC).

---

## 🚀 Despliegue en Netlify — Guía paso a paso

### Paso 1: Crear cuenta en Anthropic y obtener API key

1. Ve a **https://console.anthropic.com**
2. Crea una cuenta (es gratis)
3. Carga al menos $5 USD de crédito inicial (mínimo de la plataforma; te durará meses)
4. En el menú lateral, ve a **"API Keys"**
5. Haz clic en **"Create Key"**, ponle un nombre como "Educa Fractalia"
6. **Copia la key inmediatamente** (empieza con `sk-ant-api03-...`) — no podrás verla de nuevo
7. Guárdala en un lugar seguro (por ejemplo, un gestor de contraseñas)

### Paso 2: Crear cuenta en Netlify

1. Ve a **https://www.netlify.com**
2. Haz clic en **"Sign up"** (gratuito)
3. Puedes registrarte con tu cuenta de Google, GitHub o email

### Paso 3: Desplegar la app

**Opción A — Drag & drop (más fácil, 30 segundos)**

1. En el panel de Netlify, busca la zona que dice **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**
2. Comprime esta carpeta completa (`educa-fractalia/`) en un ZIP
3. Arrástralo a esa zona
4. Netlify lo desplegará automáticamente y te dará una URL tipo `https://random-name-123.netlify.app`

**Opción B — Desde GitHub (recomendado si planeas actualizar)**

1. Crea un repositorio en GitHub y sube esta carpeta
2. En Netlify: "Add new site" → "Import an existing project" → conecta GitHub
3. Selecciona tu repositorio
4. Netlify detectará automáticamente la configuración (`netlify.toml`)
5. Haz clic en "Deploy"

### Paso 4: Configurar la API key en Netlify

**Esto es crítico — sin este paso la IA no funcionará.**

1. En tu panel de Netlify, entra al sitio recién creado
2. Ve a **"Site settings"** → **"Environment variables"** (en el menú lateral izquierdo)
3. Haz clic en **"Add a variable"**
4. Completa:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: pega aquí tu API key (`sk-ant-api03-...`)
5. Guarda
6. Ve a **"Deploys"** → haz clic en **"Trigger deploy"** → **"Clear cache and deploy site"**
7. Espera 1-2 minutos a que termine el redespliegue

### Paso 5: Verificar

1. Entra a tu URL de Netlify
2. En la barra lateral izquierda debe aparecer **"IA conectada"** con un punto verde
3. Prueba con "carga la muestra del pilotaje N=10"
4. Ve al Módulo 02 → "Evaluar todos con IA"
5. Debería funcionar

### Paso 6 (opcional): Personalizar el dominio

Por defecto Netlify te da una URL tipo `https://inspiring-turing-abc123.netlify.app`. Puedes:

- Cambiar el subdominio: Site settings → Domain management → Options → Edit site name → `educa-fractalia`
- Apuntar un dominio propio (si lo tienes): Site settings → Domain management → Add custom domain

---

## 📸 Cargar las fotos del desarrollo (Módulo 02)

A partir de la versión 0.4, las fotos del desarrollo matemático se cargan **directamente en el sistema** desde tu computador, sin depender de Google Drive.

### Por qué este cambio

Google Drive bloquea la descarga automática de imágenes desde aplicaciones externas (política de seguridad CORS). Por eso, la app ya no intenta descargar las fotos desde el link de Drive.

### Cómo cargar las fotos

1. **Descarga las fotos a tu computador.** Si están en Drive, descarga la carpeta como ZIP y extrae las imágenes.

2. **Identifica el archivo de cada estudiante.** Lo más cómodo es renombrar las imágenes con el nombre o ID del estudiante.

3. **En el sistema, ve a Módulo 02 → Cola de evaluación.**

4. **Haz clic sobre la fila de un estudiante.** Se abre el modal de revisión.

5. **En el panel izquierdo** verás una zona de carga con el mensaje "Cargar foto del desarrollo". Arrastra la imagen ahí, o haz clic en "Seleccionar archivo".

6. **Una vez cargada**, la imagen aparece como preview. Haz clic en "Evaluar con IA ahora" para que Claude analice el desarrollo visual + las respuestas escritas.

### Persistencia

Las imágenes se guardan localmente en tu navegador (IndexedDB). Si cierras y abres el navegador, las imágenes siguen ahí. Si limpias caché del navegador o usas otro dispositivo, deberás volver a cargarlas.

### Tamaño máximo

Cada imagen no debe superar 8 MB. Si tu foto es más grande, redúcela primero (la mayoría de las apps de fotos del celular permiten exportar en menor calidad).

---



```
educa-fractalia/
├── public/                   ← Archivos que ve el usuario
│   ├── index.html            ← HTML principal con todas las vistas
│   ├── app.js                ← Lógica completa (Módulos 1 + 2)
│   ├── styles.css            ← Identidad visual Educa Fractalia
│   └── assets/
│       ├── logo-white.png    ← Logo para fondo oscuro
│       ├── logo-color.png    ← Logo para fondo claro
│       └── isotipo.png       ← Favicon
├── netlify/
│   └── functions/
│       └── evaluar-estudiante.js  ← Proxy serverless a la API de Anthropic
├── netlify.toml              ← Configuración de despliegue
├── package.json
└── README.md                 ← Este archivo
```

---

## 💰 Costos estimados

| Uso | Costo mensual aproximado |
|---|---|
| Hosting en Netlify | $0 (plan gratuito: 100 GB bandwidth, 125k serverless requests) |
| API de Anthropic (Claude) | ~$0.03 USD por estudiante evaluado |
| **Un curso de 30 estudiantes** | **~$1 USD** |
| **Uso intensivo: 500 estudiantes/mes** | **~$15 USD/mes** |

El hosting es gratis para siempre. El único costo real es la API de Anthropic, que se paga según consumo.

---

## 🔒 Seguridad

- La API key **solo vive en Netlify**, no en el navegador ni en el código.
- Las llamadas a Anthropic van desde el servidor de Netlify (serverless), no desde el navegador del usuario.
- Los datos de estudiantes se guardan en el navegador del usuario (IndexedDB), no se suben a ningún servidor.

---

## 🔄 Actualizar la app

Si usaste drag & drop: vuelve a comprimir la carpeta con los cambios y arrástrala nuevamente.

Si usaste GitHub: basta con `git push` — Netlify redesplega automáticamente.

---

## 🐛 Problemas comunes

**"IA no conectada" en la barra lateral**
- Verifica que la variable `ANTHROPIC_API_KEY` está configurada en Netlify
- Asegúrate de haber hecho "Clear cache and deploy" después de agregar la variable
- Revisa que tu API key tenga crédito disponible en console.anthropic.com

**Las fotos del desarrollo no cargan (Google Drive)**
- Asegúrate de que las fotos en Drive tienen permiso "cualquiera con el link puede ver"
- Google Drive a veces bloquea descargas masivas; la evaluación funciona sin imagen en ese caso (solo pierde el análisis visual)

**Error 504 en evaluación**
- La IA demoró más de 60 segundos. Prueba de nuevo con ese estudiante específico
- Normalmente ocurre con imágenes muy grandes

---

## 📧 Contacto

Mg. Alejandra Solís Levicoi · educa.fractalia@gmail.com · Concepción, Chile
