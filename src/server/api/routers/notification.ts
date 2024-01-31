import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getUser } from './routerUtils'

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
      const notifications = await ctx.prisma.gameNotification.findMany({
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
        },
      })
      notifications.sort((notificationA, notificationB) => {
        return notificationB.game.time.getTime() - notificationA.game.time.getTime()
      })
      return notifications
    }),
  playerSawNotification: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx)
      const game = await ctx.prisma.game.findFirst({
        where: { id: input.gameId },
        include: {
          notifications: true
        }
      })
      const notificationId = game.notifications.at(0).id
      const gameNotification = await ctx.prisma.gameNotification.findFirst({
        where: {
          id: notificationId
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
      if (user.id == gameNotification.game.player1.id) {
        return await ctx.prisma.gameNotification.update({
          where: {
            id: notificationId
          },
          data: {
            seenByPlayer1: true
          }
        })
      } else {
        return await ctx.prisma.gameNotification.update({
          where: {
            id: notificationId
          },
          data: {
            seenByPlayer2: true
          }
        })
      }
    })
})
