import { PrismaClient, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { GameWithPlayersAndNotification } from "~/types";


export const getUser = async (prisma: PrismaClient, email: string): Promise<User> => {
  const user = await prisma.user.findFirst({
    where: {
      email: email
    }
  })
  if (!user) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Invalid session token'
    })
  }
  return user
}

export const upsertGameNotification = async (
  game: GameWithPlayersAndNotification,
  message: string,
  prisma: PrismaClient,
  user: User
) => {
  const notification = game.notifications.at(0)
  if (notification != undefined) {
    return await prisma.gameNotification.update({
      where: {
        id: notification.id
      },
      data: {
        seenByPlayer1: user.id == game.player1Id,
        seenByPlayer2: user.id == game.player2Id
      }
    })
  }
  return await prisma.gameNotification.create({
    data: {
      game: {
        connect: {
          id: game.id
        }
      },
      seenByPlayer1: user.id == game.player1Id,
      seenByPlayer2: user.id == game.player2Id,
      message
    }
  })
}
