import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/users";
import { tournamentRouter } from "./routers/tournaments";
import { gamesRouter } from "./routers/games";
import { ratingsRouter } from "./routers/ratings";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  tournament: tournamentRouter,
  games: gamesRouter,
  ratings: ratingsRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

