import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import messageRoutes from "./routes/messages.js";
import contactRoutes from "./routes/contacts.js";
import { connectDB } from "./config/db.js";
import templateRoutes from "./routes/templates.js";
import campaignRoutes from "./routes/campaigns.js";
import emailRoutes from "./routes/emails.js";


dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/templates", templateRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/emails", emailRoutes);


app.get("/", (req, res) => {
  res.send("Textellent backend running");
});

app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
