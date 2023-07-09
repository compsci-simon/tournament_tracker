import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateAvatar } from "~/utils/users";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
  createUser: publicProcedure
    .input(z.object({
      firstName: z.string().min(3),
      lastName: z.string().min(3),
      email: z.string().min(3),
      password: z.string().min(4),
      nickName: z.string().nullable(),
      gender: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email
        }
      })
      if (user) {
        return new TRPCError({
          message: 'User already exists',
          code: 'CONFLICT'
        })
      }
      const avatar = generateAvatar(input.nickName ?? `${input.firstName} ${input.lastName}`, input.gender)
      const isAdmin = (await ctx.prisma.user.findMany()).length == 0
      return await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          password: input.password,
          nickName: input.nickName,
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
        name: user.nickName ?? `${user.firstName} ${user.lastName}`,
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
      email: z.string().email(),
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      nickName: z.string().nullish(),
      avatar: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        where: {
          id: input.id
        },
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          nickName: input.nickName,
          avatar: input.avatar,
        }
      })
    })
});
