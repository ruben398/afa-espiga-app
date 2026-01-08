# AFA Espiga — App de proves (Next.js + Supabase)

## Què és
Un prototip online (mòbil + web) per a **AFA Espiga** amb:
- Login (famílies) per **Cognoms + Contrasenya**
- Panell **Admin** (només tu)
- **Notícies** per grups + adjunts (PDF/imatges)
- **Enquestes** per alumne
- **Dades de família** editables
- **Sol·licitud d’alta** (família nova) -> queda pendent i l’admin l’aprova

> Nota: per seguretat real, després passarem a contrasenyes hash + verificació per telèfon.  
> En aquesta demo, les 5 famílies tenen contrasenya inicial **AFAESPIGA**.

---

## 1) Crear Supabase
1. Crea un projecte a Supabase.
2. Ves a **Project Settings → API** i copia:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Crea un bucket a **Storage → New bucket**:
   - Nom: `adjunts`
   - **PUBLIC** (només per la demo)  
     (Després el farem privat + URLs signades)

### 1.1 Crear taules i dades DEMO
A Supabase → **SQL Editor** → New query → enganxa i executa el fitxer:
`sandbox:/mnt/data/afa-espiga-nextjs/supabase_schema_and_seed.sql`

---

## 2) Provar en local (opcional)
Requisit: Node.js 18+

A la carpeta del projecte:
```bash
npm install
cp .env.example .env.local
# omple les variables a .env.local
npm run dev
```
Obre: http://localhost:3000

---

## 3) Publicar a Vercel (enllaç provisional)
1. Puja aquest projecte a GitHub (recomanat) o importa la carpeta a Vercel.
2. A Vercel → Project → **Settings → Environment Variables** afegeix:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_JWT_SECRET` (posa una clau llarga aleatòria)
   - `ADMIN_USERNAME` (ex: admin)
   - `ADMIN_PASSWORD` (ex: AFAESPIGA o una altra)
3. Prem **Deploy**.

✅ Vercel et donarà un link tipus `https://xxxx.vercel.app`

---

## 4) Logins DEMO
### Admin
- Usuari: `admin` (o el que posis a `ADMIN_USERNAME`)
- Contrasenya: la de `ADMIN_PASSWORD`

### Famílies (demo)
Usuari (Cognoms) + Contrasenya:
- Pérez Vicens / AFAESPIGA
- García López / AFAESPIGA
- Martínez Ruiz / AFAESPIGA
- Fernández Soler / AFAESPIGA
- Costa Puig / AFAESPIGA

---

## 5) Instal·lar com a “app” (PWA)
### Android (Chrome)
Menú ⋮ → **Instal·lar aplicació** (o “Afegir a pantalla d’inici”)

### iPhone (Safari)
Compartir → **Afegir a pantalla d’inici**

---

## 6) Notes importants (per la següent iteració)
- Notificacions push per grups (Android/iPhone) es poden afegir amb Web Push/FCM.
- Bucket d’adjunts: en producció ha de ser **privat**.
- Login per cognoms pot col·lidir: després afegirem codi família o usuari únic.
