import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getUser } from './routerUtils'
import { TRPCError } from '@trpc/server'
import assert from 'assert'
import { GameNotification, PrismaClient, User } from '@prisma/client'

const markNotificationAsSeen = async (prisma: PrismaClient, user: User, notificationId: string) => {
  const gameNotification = await prisma.gameNotification.findFirst({
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
  assert(gameNotification?.game.player1)
  if (user.id == gameNotification.game.player1.id) {
    return await prisma.gameNotification.update({
      where: {
        id: notificationId
      },
      data: {
        seenByPlayer1: true
      }
    })
  } else {
    return await prisma.gameNotification.update({
      where: {
        id: notificationId
      },
      data: {
        seenByPlayer2: true
      }
    })
  }
}

export const notificationsRouter = createTRPCRouter({
  getPlayerNotifications: protectedProcedure
    .input(z.object({ playerEmail: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.playerEmail
        }
      })
      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Player not found'
        })
      }
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
  setGameSeen: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.prisma, ctx.session.user.email!)
      const game = await ctx.prisma.game.findFirst({
        where: {
          id: input.gameId
        },
        include: {
          notifications: true
        }
      })
      const notificationId = game?.notifications.at(0)!.id
      return await markNotificationAsSeen(ctx.prisma, user, notificationId!)
    }),
  playerSawNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.prisma, ctx.session.user.email!)
      return await markNotificationAsSeen(ctx.prisma, user, input.notificationId)
    }),
  markSelectNotificationsAsRead: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUser(ctx.prisma, ctx.session.user.email!)
      const notifications: { [id: string]: GameNotification } = {}
      for (let i = 0; i < input.notificationIds.length; i++) {
        const notification = await markNotificationAsSeen(ctx.prisma, user, input.notificationIds[i])
        notifications[notification.id] = notification
      }
      return notifications
    })
})
