import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { orgRouter } from "./routers/org";
import { skillRouter } from "./routers/skill";
import { reviewRouter } from "./routers/review";
import { auditRouter } from "./routers/audit";

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  skill: skillRouter,
  review: reviewRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
