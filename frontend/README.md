```powershell
cd frontend
npm install

@"
VITE_API_URL=http://127.0.0.1:8000
"@ | Set-Content .env -Encoding UTF8

npm run dev
npm run build
```
