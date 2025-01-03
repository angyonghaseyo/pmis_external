# PortConnect External Portal

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-%5E18.2.0-blue.svg)

> A comprehensive port management system designed for shipping lines, carriers, and freight forwarders.

## 📖 Contents

- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Support](#-support)

## ✨ Key Features

### 🚢 Vessel Management
- Real-time vessel visit scheduling
- Automated berth allocation system
- Ad-hoc resource request handling
- Dynamic vessel tracking interface

### 📦 Cargo Operations
- QR code-based cargo tracking
- Value-added service management
- Facility rental system
- Container consolidation services

### 📄 Document Processing
- Electronic trade document submission
- Real-time status tracking
- Integrated customs clearance
- Digital Bill of Lading handling

### 👥 Account Administration
- Role-based access control
- Multi-user organization management
- Customizable user permissions
- Secure authentication system

## 🛠 Technology Stack

### Technology Architecture

#### Frontend
- **Framework:** React 18.2.0
- **UI Library:** Material-UI 6.1.0
- **State Management:** React Context API
- **HTTP Client:** Axios 1.7.7
- **Key Libraries:**
  - date-fns 2.29.3 (Date handling)
  - react-big-calendar 1.15.0 (Calendar views)
  - leaflet 1.9.4 (Maps)
  - recharts 2.12.7 (Data visualization)
  - papaparse 5.4.1 (CSV processing)
  - xlsx 0.18.5 (Excel file handling)
  - html5-qrcode 2.3.8 (QR code scanning)

#### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 4.17.1
- **Authentication:** JSON Web Tokens (jsonwebtoken 9.0.2)
- **Middleware:** 
  - cors 2.8.5 (Cross-Origin Resource Sharing)
  - multer 1.4.5 (File uploads)
  - bcrypt 5.1.1 (Password hashing)

#### Database
- **Primary Database Solutions:**
  - Firebase Firestore (Real-time data)
  - Google Cloud SQL (Structured data)
- **Storage Solutions:**
  - Google Cloud Storage (File storage)
  - Firebase Storage (Media assets)
- **Features:**
  - Real-time data synchronization
  - High-performance SQL queries
  - Automatic scaling and backup
  - Built-in security rules

#### Cloud Infrastructure
- **Primary Cloud Platform:** AWS
  - EC2 instances for application hosting
  - Load balancing and auto-scaling
  - Virtual Private Cloud (VPC)
- **Google Cloud Platform:**
  - Cloud SQL for managed database
  - Cloud Storage for file management
  - Cloud CDN for content delivery
- **Firebase Services:**
  - Authentication
  - Real-time Database
  - Analytics
  - Cloud Functions

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 14.0.0
- npm ≥ 6.0.0
- Modern web browser
- Active internet connection

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/portconnect-external.git
   cd portconnect-external
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

## 📡 API Documentation

### Integrated Services
- PortConnect Core API
- RapidAPI HS Code Service
- World Tides API
- Government Regulatory APIs

## 🔒 Security

### Implementation
- JWT authentication
- Role-based access control
- HTTPS encryption
- API rate limiting

### Best Practices
- Regular security audits
- Encrypted data storage
- Session management
- Input validation

## 💬 Support

### Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ♥ by the PortConnect Team*
