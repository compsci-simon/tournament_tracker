import { expect, test, describe } from '@jest/globals';

import { scheduleMultiStageGames } from "../utils/tournament";


const players = ['simon', 'ben', 'lienke', 'liv', 'james', 'lisa', 'shailen', 'paul']

describe('test scheduling functions', () => {

  test('Test scheduling results in a good split of pools', () => {
    const { gameSchedule, numRounds } = scheduleMultiStageGames(players)
    expect(numRounds).toBe(3)
    expect(gameSchedule.length).toBe(19)
    expect(gameSchedule.filter(g => g.type == 'knockout').length).toBe(7)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 0).length).toBe(4)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 1).length).toBe(2)
    expect(gameSchedule.filter(g => g.type == 'knockout' && g.level == 2).length).toBe(1)
  })

})


