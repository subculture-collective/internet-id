import express from "express";
import cors from "cors";

// Import routers
import healthRoutes from "./routes/health.routes";
import uploadRoutes from "./routes/upload.routes";
import manifestRoutes from "./routes/manifest.routes";
import registerRoutes from "./routes/register.routes";
import verifyRoutes from "./routes/verify.routes";
import bindingRoutes from "./routes/binding.routes";
import contentRoutes from "./routes/content.routes";
import oneshotRoutes from "./routes/oneshot.routes";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Mount routers
  app.use("/api", healthRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api", manifestRoutes);
  app.use("/api", registerRoutes);
  app.use("/api", verifyRoutes);
  app.use("/api", bindingRoutes);
  app.use("/api", contentRoutes);
  app.use("/api", oneshotRoutes);

  return app;
}
