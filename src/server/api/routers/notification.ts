import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const notificationsRouter = createTRPCRouter({
  getPlayerNotifications: protectedProcedure
    .input(z.object({ playerEmail: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.playerEmail
        }
      })
      if (!user) return []
      return await ctx.prisma.gameNotification.findMany({
        where: {
          game: {
            OR: [
              { player1Id: user.id },
              { player2Id: user.id },
            ]
          }
        },
        include: {
          game: {
            include: {
              player1: true,
              player2: true
            }
          }
        }
      })
    })
})
