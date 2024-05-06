import * as fs from 'fs'
import { Rating } from "@prisma/client"
import z from 'zod'
import { env } from '~/env.mjs'

export const findStreakFromRatings = (ratings: Rating[]) => {
  ratings = ratings.sort((a, b) => a.time.getTime() - b.time.getTime())
  let streak = 0
  for (let i = 1; i < ratings.length; i++) {
    let miniStreak = 0
    for (; i < ratings.length; i++) {
      if ((ratings[i]?.rating ?? 0) >= (ratings[i - 1]?.rating ?? 0)) {
        miniStreak += 1
        if (miniStreak > streak) {
          streak = miniStreak
        }
      } else {
        break
      }
    }
  }
  return streak
}

export const capitalizeFirstLetter = (str: string) => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

export type ServerSettings = {
  tournamentBonusElo: number,
  decay: {
    decayInterval: {
      unit: 'day' | 'month',
      quantity: number
    },
    decayAmount: number,
    decayThreshold: number
  }
}

export const getServerSettings = (): ServerSettings => {
  const serverSettingsParser = z.object({
    tournamentBonusElo: z.number(),
    decay: z.object({
      decayInterval: z.object({
        unit: z.union([z.literal('day'), z.literal('month')]),
        quantity: z.number()
      }),
      decayAmount: z.number(),
      decayThreshold: z.number()
    }),
  })
  const fileContents = fs.readFileSync(env.SERVER_SETTINGS_URL).toString()
  const serverSettings = (JSON.parse(fileContents) as ServerSettings)
  serverSettingsParser.parse(serverSettings)
  return serverSettings
}

export const getString = (param: string | string[] | undefined) => {
  if (param == undefined) {
    // throw Error('Parameter is undefined')
    return ''
  } else if (Array.isArray(param)) {
    return param[0]
  } else {
    return param
  }
}
