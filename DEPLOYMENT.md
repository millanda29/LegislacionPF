# Guía de Despliegue - AppPred

Esta guía proporciona instrucciones detalladas para desplegar AppPred en Heroku (backend) y Vercel (frontend).

## 🚀 Despliegue del Backend en Heroku

### Prerrequisitos
- Cuenta de Heroku
- Heroku CLI instalado
- Docker instalado
- Git configurado

### Paso 1: Preparar el Backend

1. **Navegar al directorio del backend**
```bash
cd backend-calderon
```

2. **Verificar que el Dockerfile existe**
```bash
ls Dockerfile
```

3. **Construir la imagen localmente (opcional, para pruebas)**
```bash
docker build -t apppred-backend .
```

### Paso 2: Crear la Aplicación en Heroku

1. **Iniciar sesión en Heroku**
```bash
heroku login
```

2. **Crear la aplicación**
```bash
heroku create apppred-backend-[tu-nombre]
```

3. **Configurar variables de entorno**
```bash
# API Keys
heroku config:set OPENAI_API_KEY="tu_openai_api_key"
heroku config:set GOOGLE_API_KEY="tu_google_api_key"
heroku config:set HUGGINGFACE_API_KEY="tu_huggingface_api_key"

# Configuración de Email
heroku config:set EMAIL_HOST="smtp.gmail.com"
heroku config:set EMAIL_PORT="587"
heroku config:set EMAIL_USER="tu_email@gmail.com"
heroku config:set EMAIL_PASSWORD="tu_app_password"

# CORS
heroku config:set CORS_ORIGINS='["https://tu-frontend.vercel.app"]'
```

### Paso 3: Desplegar con Docker

1. **Habilitar el registro de contenedores**
```bash
heroku container:login
```

2. **Construir y subir la imagen**
```bash
heroku container:push web
```

3. **Liberar la aplicación**
```bash
heroku container:release web
```

4. **Verificar el despliegue**
```bash
heroku open
```

### Paso 4: Configurar el Dominio (Opcional)

1. **Agregar dominio personalizado**
```bash
heroku domains:add api.tudominio.com
```

2. **Configurar DNS según las instrucciones de Heroku**

## 🌐 Despliegue del Frontend en Vercel

### Prerrequisitos
- Cuenta de Vercel
- Vercel CLI instalado
- Node.js 18+

### Paso 1: Preparar el Frontend

1. **Navegar al directorio del frontend**
```bash
cd frontend-calderon
```

2. **Verificar la configuración de la API**
Editar `src/api/water.js` para apuntar a tu backend de Heroku:
```javascript
const API_BASE = process.env.REACT_APP_API_URL || "https://tu-backend.herokuapp.com";
```

3. **Construir localmente (opcional, para pruebas)**
```bash
npm run build
```

### Paso 2: Desplegar con Vercel CLI

1. **Iniciar sesión en Vercel**
```bash
vercel login
```

2. **Desplegar la aplicación**
```bash
vercel --prod
```

3. **Seguir las instrucciones interactivas**
- Project name: `apppred-frontend`
- Directory: `./` (current directory)
- Override settings: `No`

### Paso 3: Configurar Variables de Entorno

1. **Ir al dashboard de Vercel**
2. **Seleccionar tu proyecto**
3. **Ir a Settings > Environment Variables**
4. **Agregar las variables:**
```
REACT_APP_API_URL=https://tu-backend.herokuapp.com
```

### Paso 4: Configurar Dominio Personalizado (Opcional)

1. **En el dashboard de Vercel, ir a Settings > Domains**
2. **Agregar tu dominio**
3. **Configurar DNS según las instrucciones**

## 🔧 Configuración de Email

### Para Gmail

1. **Habilitar autenticación de 2 factores**
2. **Generar contraseña de aplicación**
   - Ir a Google Account > Security
   - App passwords > Generate
   - Seleccionar "Mail" y tu dispositivo
3. **Usar la contraseña generada en `EMAIL_PASSWORD`**

### Probar la Configuración

1. **En el frontend desplegado, ir a la sección de reportes**
2. **Hacer clic en "Probar Configuración"**
3. **Verificar que aparece el mensaje de éxito**

## 📊 Monitoreo y Logs

### Heroku (Backend)

1. **Ver logs en tiempo real**
```bash
heroku logs --tail
```

2. **Ver logs específicos**
```bash
heroku logs --source app
```

3. **Monitorear métricas**
```bash
heroku addons:open papertrail
```

### Vercel (Frontend)

1. **Ver logs en el dashboard de Vercel**
2. **Ir a Functions > View Function Logs**
3. **Configurar alertas en Settings > Monitoring**

## 🔄 Actualizaciones

### Backend

1. **Hacer cambios en el código**
2. **Commit y push a Git**
3. **Reconstruir y desplegar**
```bash
heroku container:push web
heroku container:release web
```

### Frontend

1. **Hacer cambios en el código**
2. **Commit y push a Git**
3. **Vercel se despliega automáticamente**

## 🚨 Solución de Problemas

### Backend no responde

1. **Verificar logs**
```bash
heroku logs --tail
```

2. **Verificar variables de entorno**
```bash
heroku config
```

3. **Reiniciar la aplicación**
```bash
heroku restart
```

### Frontend no se conecta al backend

1. **Verificar la URL de la API en el frontend**
2. **Verificar CORS en el backend**
3. **Probar la API directamente**
```bash
curl https://tu-backend.herokuapp.com/
```

### Email no funciona

1. **Verificar configuración SMTP**
2. **Probar con el botón "Probar Configuración"**
3. **Verificar logs del backend**

## 📈 Escalabilidad

### Heroku

1. **Escalar horizontalmente**
```bash
heroku ps:scale web=2
```

2. **Configurar auto-scaling**
```bash
heroku autoscaling:enable web
```

### Vercel

- **Auto-scaling automático**
- **CDN global incluido**
- **Edge functions disponibles**

## 🔒 Seguridad

### Variables de Entorno
- **Nunca commitear `.env` files**
- **Usar variables de entorno de Heroku/Vercel**
- **Rotar API keys regularmente**

### CORS
- **Configurar solo dominios necesarios**
- **No usar `*` en producción**

### HTTPS
- **Automático en Heroku y Vercel**
- **Configurar redirects si es necesario**

## 💰 Costos

### Heroku
- **Hobby Dyno**: $7/mes
- **Basic Dyno**: $14/mes
- **Standard Dyno**: $25/mes

### Vercel
- **Hobby**: Gratis (con límites)
- **Pro**: $20/mes
- **Enterprise**: Contactar ventas

## 📞 Soporte

### Heroku
- [Documentación oficial](https://devcenter.heroku.com/)
- [Soporte técnico](https://help.heroku.com/)

### Vercel
- [Documentación oficial](https://vercel.com/docs)
- [Soporte técnico](https://vercel.com/support)

---

**Nota**: Esta guía asume que tienes conocimientos básicos de Docker, Git y las plataformas de despliegue mencionadas. Para problemas específicos, consulta la documentación oficial de cada plataforma. 