# Rescom

Rescom is a Decentralized Mesh Communication Engine & Server. It is designed to provide secure, peer-to-peer communication across mesh networks, supporting various transports like LAN and simulated Bluetooth Low Energy (BLE).

## Features

* **Decentralized Mesh Networking**: Peer-to-peer message routing and delivery without a central server constraint.
* **Secure Communication**: End-to-end encryption and cryptographic identity management.
* **Multi-Transport Support**: Built-in support for LAN and simulated BLE connections.
* **Modern Web Interface**: A React-based frontend for interacting with the mesh network, viewing peers, chats, and network topology.
* **Robust Backend Engine**: Node.js and WebSocket powered backend engine for handling mesh packets and routing.

## Project Structure

The project is structured as a monorepo containing both the frontend and backend:

* `/frontend`: The React application built with Vite and TypeScript.
* `/backend`: The Node.js decentralized mesh communication engine.
* `/tests`: Comprehensive test suites covering crypto security, mesh routing, and stress testing.

## Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rahul5216/Rescom.git
   cd Rescom
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Run the Backend (Development Mode):**
```bash
cd backend
npm run dev
```

**Run the Frontend (Development Mode):**
```bash
cd frontend
npm run dev
```

The frontend will typically be accessible at `http://localhost:5173`.

### Docker (Optional)

You can also use Docker Compose to run the application in a containerized environment:

```bash
docker-compose up -d
```

## Testing

The project includes several tests for the core engine:

```bash
cd backend
npm run test         # Run all tests
npm run test:crypto  # Run cryptography tests
npm run test:mesh    # Run mesh routing tests
npm run test:load    # Run stress tests
```

## License

MIT License
