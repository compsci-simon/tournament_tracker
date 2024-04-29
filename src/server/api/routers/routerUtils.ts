import { Prisma, PrismaClient, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime";
import { TRPCError } from "@trpc/server";
import { GameWithPlayers } from "~/types";


export const getUser = async (ctx: {
  session: {
    user: {
      role: string;
    } & {
      name?: string | null;
      email?: string;
      image?: string;
    };
    expires: string;
  };
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation, DefaultArgs>;
}): Promise<User> => {
  const user = await ctx.prisma.user.findFirst({
    where: {
      email: ctx.session.user.email
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

export const createGameNotification = async (
  game: GameWithPlayers,
  message: string,
  ctx: {
    session: {
      user: {
        role: string;
      } & {
        name?: string;
        email?: string;
        image?: string;
      };
      expires: string;
    };
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation, DefaultArgs>;
  }) => {
  const user = await getUser(ctx)
  await ctx.prisma.gameNotification.create({
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
