# 🌶️ chiliphilic – PPIC Toolkit for Hot Sauce Manufacturing

**chiliphilic** is a complete Production Planning & Inventory Control (PPIC) system designed for small‑batch hot sauce producers. It helps you manage Master Production Scheduling, work orders, BOMs, MRP, inventory, and procurement – all in one place.

![Vercel](https://img.shields.io/badge/deployed_on-vercel-black?style=flat&logo=vercel)
![Supabase](https://img.shields.io/badge/backed_by-supabase-3ecf8e?style=flat&logo=supabase)
![React](https://img.shields.io/badge/made_with-react-61dafb?style=flat&logo=react)
![License](https://img.shields.io/badge/license-MIT-blue)

🔗 **Live Demo:** [chiliphilic.vercel.app](https://chiliphilic.vercel.app)

---

## ✨ Features

- **📊 Dashboard** – KPIs for work orders, MPS, critical materials, and open POs.
- **📦 Product & BOM Management** – Add/edit finished goods, raw materials, packaging; maintain multi‑level BOMs; “Enroll New Recipe” wizard for quick product creation.
- **📅 Master Production Schedule** – 6‑week rolling plan with capacity bars, demand vs MPS gap analysis, and push‑to‑work‑orders.
- **🏭 Work Orders** – Create, filter, update status; batch quantity suggestions based on your BOM.
- **📋 MRP Explosion** – Calculates gross/net requirements, highlights critical/low materials, and auto‑creates purchase orders.
- **📦 Inventory** – Adjust stock with reason logging; reorder point and safety stock alerts.
- **🛒 Procurement** – Create and receive POs; inline editing of supplier, unit cost, notes, expected date.
- **🚨 Alerts** – Overdue orders, critical shortages, low stock – all in one view.
- **📜 Audit Log** – Full history of every change (who, what, when, old/new data) for full traceability.

All data is stored in **Supabase** with Row‑Level Security (RLS) – your production data is safe and accessible from anywhere.

---

## 🛠️ Tech Stack

| Frontend | Backend & Auth | Deployment |
|----------|---------------|------------|
| React 18 | Supabase (PostgreSQL) | Vercel |
| Vite     | Supabase Auth (email/password) | Git |
| CSS-in-JS (dark theme) | Row‑Level Security (RLS) | |

**Key libraries:** `@supabase/supabase-js`, `React.memo`, `useCallback` for performance.

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Supabase project (free tier works)

### 2. Clone the repository

```bash
git clone https://github.com/yourusername/chiliphilic.git
cd chiliphilic
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Get these from your Supabase dashboard → Settings → API.

### 5. Set up the database

Run the SQL script provided in `supabase-schema.sql` (you’ll find it in the repo) – it creates all tables, policies, and seed data.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) – you’ll see the login screen. Use the credentials you created in Supabase Auth.

---

## 📦 Database Schema (Simplified)

- `products` – all items (finished goods, raw materials, packaging, sub‑assemblies) with category, unit, lead time, stock.
- `bom` – parent‑child relationships with quantities per unit.
- `mps` – Master Production Schedule entries.
- `work_orders` – production orders.
- `purchase_orders` – procurement orders.
- `inventory_adjustments` – stock change log.
- `audit_log` – full change history for all tables.

The full schema is in the repository.

---

## 🧪 Testing & Deployment

### Testing locally

```bash
npm run test
# (if you have tests; this project uses manual testing)
```

### Deploy to Vercel

1. Push your code to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Deploy – it will auto‑build and go live.

---

## 🤖 AI Assistance

This project was developed with significant AI assistance. The AI contributed to:

- Architecture design and database schema planning.
- Code generation for React components, MRP engine, and Supabase integration.
- Debugging and performance optimisation.
- UI/UX recommendations and documentation.

The collaboration accelerated development while maintaining a high standard of quality.

---

## 📄 License

MIT – feel free to use, modify, and distribute.

---

## 👨‍🍳 About the Project

**chiliphilic** was built to solve real planning headaches in small‑batch hot sauce production. It’s a practical, full‑stack application that showcases skills in React, Supabase, and modern web development – with a touch of culinary flair.

  
Live App: [chiliphilic.vercel.app](https://chiliphilic.vercel.app)

---

## 🙌 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📷 Screenshots
<img width="1119" height="907" alt="image" src="https://github.com/user-attachments/assets/0162822a-83db-4109-8b5f-a5febbf8d869" />
<img width="852" height="814" alt="image" src="https://github.com/user-attachments/assets/e90b9a7f-3f15-4ed5-8258-89265b8d8ad5" />
<img width="844" height="874" alt="image" src="https://github.com/user-attachments/assets/520e3b27-0511-43be-8b1e-c3a09055d0e1" />
<img width="859" height="862" alt="image" src="https://github.com/user-attachments/assets/ab067cfd-0e22-444b-9783-f1c3d3c58821" />


Made with 🌶️ and ☕.
