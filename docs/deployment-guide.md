# Deployment & Production Run Guide — NiCE Club Rwanda Attendance Platform

This guide outlines how to deploy the **NiCE Club Rwanda Attendance Platform** to production and make it live on the public web.

---

## 🚀 Option 1: Vercel (Fastest & Recommended — ~2 Minutes)

Vercel provides native zero-configuration hosting for Next.js App Router applications, global Edge routing, automatic SSL certificates, and custom domain mapping.

### Step 1: Push Project to GitHub
Initialize git and push to your GitHub repository:
```bash
git init
git add .
git commit -m "feat: NiCE Club Rwanda Attendance Platform production build"
git branch -M main
git remote add origin https://github.com/YOUR_ORGANIZATION_OR_USERNAME/nice-attendance.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Select the `nice-attendance` repository and click **Import**.

### Step 3: Configure Environment Variables
Under **Environment Variables**, add:
| Variable Name | Value Example | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://attendance.niceclub.rw` | Public canonical base URL |
| `AUTH_SECRET` | `generate with openssl rand -base64 32` | 32+ char secret for HMAC JWT tokens |
| `APP_TIMEZONE` | `Africa/Kigali` | Canonical timezone for session schedules |
| `NODE_ENV` | `production` | Production environment |

### Step 4: Click "Deploy"
Vercel will run `npm run build` and provision your live public URL within 60 seconds (e.g. `https://nice-attendance.vercel.app`).

### Step 5: Connect Custom Domain (`attendance.niceclub.rw`)
1. Go to **Project Settings** → **Domains**.
2. Enter `attendance.niceclub.rw`.
3. In your DNS registrar (e.g. Cloudflare, Namecheap, GoDaddy), add the CNAME record:
   - **Type**: `CNAME`
   - **Name**: `attendance`
   - **Value**: `cname.vercel-dns.com`
4. SSL certificates are provisioned automatically.

---

## 🐳 Option 2: Docker / VPS Deployment (DigitalOcean, AWS, Hetzner, Ubuntu Server)

If you prefer self-hosting on your own virtual private server:

### Step 1: Clone Repository on Server
```bash
ssh user@your-server-ip
git clone https://github.com/YOUR_USERNAME/nice-attendance.git
cd nice-attendance
```

### Step 2: Configure Environment Variables
Create `.env`:
```bash
cp .env.example .env
nano .env
```
Ensure `AUTH_SECRET` is set to a secure string:
```bash
openssl rand -base64 32
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```
This builds the Next.js production container (`app`) and spins up PostgreSQL 16 Alpine (`db`) with persistent storage.

### Step 4: Setup Nginx Reverse Proxy & SSL (Certbot)
Install Nginx and Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/attendance.niceclub.rw`:
```nginx
server {
    server_name attendance.niceclub.rw;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and acquire free Let's Encrypt SSL:
```bash
sudo ln -s /etc/nginx/sites-available/attendance.niceclub.rw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d attendance.niceclub.rw
```

---

## 🚂 Option 3: Railway / Render (PaaS with Managed PostgreSQL)

1. Sign in to [railway.app](https://railway.app) or [render.com](https://render.com).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `nice-attendance`.
4. Add PostgreSQL database service in one click.
5. In project settings, set `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, and `APP_TIMEZONE=Africa/Kigali`.
6. Automatic zero-downtime deployment triggers on every git push.

---

## 🔒 Post-Deployment Checklist

- [ ] Run `npm run db:migrate` and create the initial Administrator using `npm run db:seed-admin` with unique `INITIAL_ADMIN_*` values.
- [ ] Sign in to `/login` with the administrator email and password configured during account creation.
- [ ] For branded transactional email, set the private `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and optional `BREVO_SENDER_NAME` in the deployment environment. Verify the sender/domain in Brevo and run `npm run db:migrate` to add invitation and email-delivery tables.
- [ ] Test creating a session on `/sessions/new`.
- [ ] Download the branded flyer and test scanning on a mobile device (`/attend/{token}`).
- [ ] Verify test submission lands in the dashboard and export master CSV via `/api/exports`.
