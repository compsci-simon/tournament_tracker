import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
  addUser: publicProcedure
    .input(z.object({ firstName: z.string(), lastName: z.string(), email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          firstName: input.firstName,
          lastName: input.lastName
        }
      })
      if (user) {
        return
      }
      return await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          ratings: {
            create: [({ rating: 1200 })]
          }
        }
      })
    }),
  deleteUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.delete({
        where: {
          id: input.id
        }
      })
    })
});
