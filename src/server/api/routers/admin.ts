import { getServerSettings } from "~/utils/utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  getServerSettings: protectedProcedure
    .query(() => {
      return getServerSettings()
    })
})