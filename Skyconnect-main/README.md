# SkyConnect
A lightweight, real-time video conferencing platform built with MERN stack and WebRTC.

## MVP Description

**Problem Statement**: Existing video conferencing tools are often complex, resource-heavy, and lack customization for organizations needing lightweight, private, and scalable communication solutions.

**Solution**: SkyConnect provides a lightweight, real-time video conferencing platform that enables secure peer-to-peer communication through WebRTC, built using the MERN stack for rapid scalability and cloud integration.

## Core MVP Features ✅

- ✅ **User Authentication** – Secure sign-up and login using JWT
- ✅ **Room Creation & Joining** – Unique room IDs for instant video meetings
- ✅ **Real-Time Video/Audio Calls** – Powered by WebRTC peer connections
- ✅ **Chat Feature** – Text messaging during calls using WebSockets
- ✅ **Responsive UI** – Built with React and Material-UI for smooth user experience
- ✅ **Screen Sharing** – Share your screen during video calls

## Tech Architecture

- **Frontend**: React.js (UI), WebRTC (Media Stream), Socket.io (Signaling)
- **Backend**: Node.js + Express.js (APIs, signaling server)
- **Database**: MongoDB (User data, room sessions)
- **Deployment**: Cloud-ready (Render, Vercel, or AWS)

## Future Enhancements

- Screen recording functionality
- End-to-end encryption
- Multi-user conferencing with scalable TURN/STUN servers
- Integration with calendar and cloud storage

## Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## MVP Objective

Validate that users can create and join real-time video meetings seamlessly with stable connections, simple UI, and secure communication—proving the technical and market feasibility of a custom-built WebRTC platform on the MERN stack.
