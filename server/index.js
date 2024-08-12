import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import WebSocket from "ws";
import http from 'http'
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import { Storage } from '@google-cloud/storage';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";  // Import the os module
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken,verifyWebSocketToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import { handleConnection } from "./controllers/webSocketController.js";


/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* GOOGLE CLOUD STORAGE CONFIGURATION */
const encodedKey = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
if (encodedKey) {
  const keyJson = Buffer.from(encodedKey, 'base64').toString('utf8');
  const keyPath = path.join(os.tmpdir(), 'service-account-file.json');  // Use os.tmpdir()
  fs.writeFileSync(keyPath, keyJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

const gcsStorage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
export const bucket = gcsStorage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);


app.post("/start-websocket", (req, res) => {
  if (!wss) {
    const server = http.createServer(app);

    const wss = new WebSocket.Server({ server, path: '/websockets' });

    wss.on('connection', (ws, req) => {
      verifyWebSocketToken(ws, req, () => {
        handleConnection(ws, wss);
      });
    });

    server.listen(PORT, () => console.log(`Server with WebSocket Port: ${PORT}`));
  }
  res.status(200).send("WebSocket server started");
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {

    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
    
  })
  .catch((error) => console.log(`${error} did not connect`));
