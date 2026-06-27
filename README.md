# 🌾 AgriApp

AgriApp is a comprehensive Fullstack web application built with **Next.js**, designed for modern agricultural management. It features Geographic Information System (GIS) integration for land polygon mapping, crop cycle tracking, document management, and EUDR (European Union Deforestation Regulation) compliance tracing.

## 🌟 Key Features

- **🔐 Authentication & Security**: Secure token-based login and registration system with role management (Farmer/User).
- **🗺️ GIS Polygon Mapping**: Interactive mapping using React-Leaflet to draw, view, and edit agricultural land boundaries. Includes multiple layers: *OpenStreetMap*, *Google Satellite*, and *Global Forest Watch Deforestation Maps*.
- **🛡️ EUDR Compliance Tracing**: End-to-end traceability of harvest origins to ensure compliance with European market export regulations.
- **🌱 Crop Lifecycle Management**: Track the entire planting cycle from seeding, fertilizing, pest control, to harvesting.
- **📄 Land Document Tracing**: Securely manage and link legal documents to specific lands and harvests for export verification.
- **📊 Interactive Dashboard**: Real-time statistical overview of lands, crop cycles, and compliance status.

## 🚀 Tech Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Mapping**: `react-leaflet`, `leaflet-draw`
- **Backend Integration**: Custom Next.js API Proxy connecting to a **Yii2 RESTful API** backend (Handling Authentication, CORS, and Raw Body passing).

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or newer) installed on your system.

### Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📁 Core Structure

- `/app` - Next.js App Router pages (Dashboard, Land Management, Due Diligence, Profile).
- `/components` - Reusable UI components (Sidebar, Data Tables, MapDrawComponent).
- `/pages/api/proxy` - Internal proxy router to safely forward requests to the Yii2 backend.

## 🤝 Contribution & Maintenance
This project was developed as a comprehensive solution for agricultural traceability and spatial management requirements. Feedback and contributions to improve the GIS integration or UI/UX are welcome!
