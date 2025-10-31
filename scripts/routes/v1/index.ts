import { Router } from "express";
import verifyRoutes from "./verify.routes";
import contentRoutes from "./content.routes";
import apiKeyRoutes from "./api-key.routes";
import authRoutes from "./auth.routes";

const router = Router();

// Mount v1 routes
router.use("/verify", verifyRoutes);
router.use("/content", contentRoutes);
router.use("/api-keys", apiKeyRoutes);
router.use("/auth", authRoutes);

export default router;
