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

export function groupItemsByKey<Item>(items: Item[], key: string): Record<string, Item[]> {
  /* This function is used to group an array of objects by a particular object attribute */
  return items.reduce((acc, item) => {
    if (!acc[item[key]]) {
      acc[item[key]] = [];
    }
    acc[item[key]].push(item);
    return acc;
  }, {} as Record<string, Item[]>);
}
