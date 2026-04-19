```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

```
```powershell
# Crear BD (si no existe)
psql -U postgres -c "CREATE DATABASE construccionia;"
o manualmente, crea con ese nombre y utilizen mi .ENV
```


```powershell
cd backend

python manage.py migrate
python manage.py showmigrations core

python manage.py createsuperuser
python manage.py runserver
```



""Instalar en consola"":

