import { TRPCError, inferRouterOutputs } from "@trpc/server"
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ElementType } from "~/types";
import { generateAvatar } from "~/utils/users";

type userRouterType = inferRouterOutputs<typeof userRouter>
export type GetAllUser = ElementType<userRouterType['getAll']>

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
  createUser: publicProcedure
    .input(z.object({
      email: z.string().min(3),
      password: z.string().min(4),
      name: z.string().min(1),
      gender: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { email: input.email },
            { name: input.name }
          ]
        }
      })
      if (user) {
        return new TRPCError({
          message: 'User already exists',
          code: 'CONFLICT'
        })
      }
      const avatar = generateAvatar(input.name, input.gender)
      const isAdmin = (await ctx.prisma.user.findMany()).length == 0
      return await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: input.password,
          name: input.name,
          avatar,
          gender: input.gender,
          role: isAdmin ? 'admin' : 'player',
          ratings: {
            create: [({ rating: 1200, ratingChange: 0 })]
          }
        }
      })
    }),
  authenticate: publicProcedure
    .input(z.object({
      email: z.string(),
      password: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          password: input.password
        }
      })
      if (!user) {
        return new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Could not find user with those credentials'
        })
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }),
  deleteUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.delete({
        where: {
          id: input.id
        }
      })
    }),
  userProfile: publicProcedure
    .input(z.object({ email: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      if (!input.email) {
        return null
      }
      return await ctx.prisma.user.findFirst({
        where: {
          email: input.email
        }
      })
    }),
  changePassword: publicProcedure
    .input(z.object({ id: z.string().min(1), newPassword: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        where: {
          id: input.id
        },
        data: {
          password: input.newPassword
        }
      })
    }),
  updateUserProfile: publicProcedure
    .input(z.object({
      id: z.string().min(1),
      email: z.string().email().min(1),
      name: z.string().min(1),
      avatar: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          NOT: {
            id: input.id
          },
          OR: [
            { email: input.email },
            { name: input.name }
          ]
        }
      })
      if (user) {
        return new TRPCError({
          message: 'Email or name already in use by other user.',
          code: 'CONFLICT'
        })
      }
      return await ctx.prisma.user.update({
        where: {
          id: input.id
        },
        data: {
          email: input.email,
          name: input.name,
          avatar: input.avatar,
        }
      })
    })
});
