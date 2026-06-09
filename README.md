# Invoice & Billing Platform

A modern, full-featured Invoice and Billing Platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB**. This application allows merchants to manage customers, generate dynamic invoices, customize invoice template styles, and download professional, high-resolution PDFs.

---

## 🚀 Key Features

- **🔐 Secure Authentication**: Full user signup and login flow using JWT (JSON Web Tokens) and secure password hashing with `bcryptjs`.
- **📊 Business Dashboard**: Interactive analytics and visualizations powered by `Recharts` showing:
  - Total Revenue, Paid/Pending Invoices, and Active Customers.
  - Revenue trends and monthly billing graphs.
  - Recent invoices list with quick actions.
- **📁 Customer Management**: Create, read, update, and manage a directory of client contacts and details.
- **✍️ Interactive Invoice Generator**: Create invoices easily with dynamic item line add/remove forms, automated subtotal/tax/discount calculations, and custom notes.
- **🎨 Custom Invoice Templates**: 4 beautifully-designed styles optimized for different business types:
  - **Classic**: The traditional corporate layout.
  - **Modern**: Clean, minimalist grid-based style.
  - **Elegant**: A sophisticated design with stylish typography.
  - **Thermal**: Designed specifically for 80mm roll/receipt printers.
- **📥 High-Resolution PDF Downloads**: Export invoices instantly using client-side canvas-to-pdf libraries (`jsPDF`, `html2canvas`, and `dom-to-image-more`).
- **📱 Responsive & Scalable Layout**: Optimized for mobile and desktop screens, featuring container-aware zoom for live template preview.
- **⚙️ Settings & Branding**: Customize company profiles (Business Name, Logo, Address, Phone, License Numbers) and default tax/payment settings.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js (v16 App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS (v4)](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)

---

## 📁 Project Structure

```text
├── public/                 # Static assets (icons, images)
├── src/
│   ├── app/                # Next.js App Router (pages and API routes)
│   │   ├── api/            # API Endpoints (auth, invoices, customers, invitations)
│   │   ├── dashboard/      # Main application dashboard
│   │   ├── developer/      # Developer utilities & redirections
│   │   ├── invoices/       # Public & interactive invoice view / creation
│   │   ├── login/          # User login page
│   │   ├── signup/         # User registration page
│   │   ├── layout.tsx      # Main layout wrapper
│   │   └── page.tsx        # Landing/index page
│   ├── components/         # Reusable React components
│   │   ├── templates/      # Invoice design templates (Classic, Modern, Elegant, Thermal)
│   │   └── ui/             # Core UI components (buttons, calendar, dialogs, inputs)
│   ├── context/            # AuthContext provider
│   └── lib/                # Shared utilities & database models
│       ├── helpers/        # Auth & API verification helpers
│       ├── models/         # Mongoose Schemas (User, Invoice, Customer)
│       ├── api.ts          # Centralized API fetch wrapper
│       └── dbConnect.ts    # MongoDB connection pool setup
├── .env.example            # Environment variables template
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

---

## 💻 Local Setup & Installation

Follow these steps to run the application locally on your machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) and a running instance of [MongoDB](https://www.mongodb.com/try/download/community) (either local or MongoDB Atlas).

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/invoice-billing-platform.git
cd invoice-billing-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the `.env.example` file to create a `.env.local` file:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/invoice-generator
JWT_SECRET=your_super_secure_random_jwt_secret_key
```

> ⚠️ **Note**: Do not commit your `.env.local` file containing real credentials to GitHub. It is already added to `.gitignore`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Production Build

To build the application for deployment/production:

```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy Practices

- **Never Commit Secrets**: Database URLs, API keys, and JWT secrets must always reside in `.env.local` or environment configurations.
- **Gitignore Enabled**: The `.gitignore` file is pre-configured to ignore all local environment files (`.env`, `.env.local`, etc.) and the `.next` build output folders.
- **Production Encryption**: Password storage is secured using salt-hashed encryption (`bcryptjs`).
