import { Router } from "express";

import { apiRouter } from "./protected.routes.js";
import publicRoutes from "./public.routes.js";

export const v1Router: Router = Router();

v1Router.use("/public", publicRoutes);
v1Router.use("/", apiRouter);
