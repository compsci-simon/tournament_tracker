import { Rating } from "@prisma/client"

export const findStreakFromRatings = (ratings: Rating[]) => {

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