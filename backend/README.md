```powershell
cd backend

# IMPORTANTE:
# Si el error menciona rutas como `AppData\Roaming\Python\Python314\site-packages`,
# estás ejecutando con el Python global (no con el venv). Activa el venv o usa
# el ejecutable del venv explícitamente.

(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned)

python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Verifica que el python activo sea el del venv (debe salir primero .venv\Scripts\python.exe)
where python

python -m pip install -r requirements.txt

CREA UNA BASE DE DATOS EN PGADMIN: CON EL NOMBRE DE construccionIA
@"
DJANGO_DEBUG=1
POSTGRES_DB=construccionIA
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
GEMINI_API_KEY=TU_API_KEY_AQUI
IA_PROVIDER=gemini

# (Opcional) OpenAI Vision (de paga):
# IA_PROVIDER=openai
# OPENAI_API_KEY=TU_API_KEY_AQUI
# OPENAI_MODEL=gpt-4o-mini
"@ | Set-Content .env -Encoding UTF8


python manage.py migrate

PARA CREAR EL SUPERUSARIO:_


python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); email='admin@gmail.com'; pwd='123456'; u,created=U.objects.get_or_create(correo=email, defaults={'nombre':'Admin','apellido':'Root'}); u.is_staff=True; u.is_superuser=True; u.set_password(pwd); u.save(); print('CREATED' if created else 'UPDATED', u.id, email)"

python manage.py runserver 8000

# Si NO quieres activar el entorno, también funciona así:
# & ".\.venv\Scripts\python.exe" manage.py runserver 8000
```

