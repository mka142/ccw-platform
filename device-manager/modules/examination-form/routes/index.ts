import { Router } from "express";
import examinationFormApiRoutes from "./api";

const router = Router();
router.use("/", examinationFormApiRoutes);

export default router;
