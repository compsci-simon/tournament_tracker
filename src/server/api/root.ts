import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/users";
import { tournamentRouter } from "./routers/tournaments";
import { gamesRouter } from "./routers/games";
import { ratingsRouter } from "./routers/ratings";
import { notificationsRouter } from "./routers/notification";
import { adminRouter } from "./routers/admin";
import { sportsRouter } from "./routers/sports";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  tournament: tournamentRouter,
  games: gamesRouter,
  ratings: ratingsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  sports: sportsRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

