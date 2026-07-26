import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { orgRouter } from "./routers/org";
import { skillRouter } from "./routers/skill";
import { reviewRouter } from "./routers/review";
import { auditRouter } from "./routers/audit";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  skill: skillRouter,
  review: reviewRouter,
  audit: auditRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
