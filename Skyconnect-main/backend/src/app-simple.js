import express from "express";
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000)
app.use(cors({
    origin: ["https://skyconnect-frontend.onrender.com", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Root route
app.get("/", (req, res) => {
    res.json({ message: "SkyConnect Backend API is running!" });
});

const start = async () => {
    server.listen(app.get("port"), () => {
        console.log(`🚀 SkyConnect Backend running on PORT ${app.get("port")}`);
        console.log('✅ Socket.io server ready for WebRTC signaling');
        console.log('🎥 Video calling ready!');
    });
}

start();