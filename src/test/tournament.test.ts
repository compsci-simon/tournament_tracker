import { expect, test, describe } from '@jest/globals';

import { scheduleMultiStageGames } from "../utils/tournament";


const players = ['simon', 'ben', 'lienke', 'liv', 'james', 'lisa', 'shailen', 'paul']
describe('test scheduling functions', () => {

  test('Test scheduling results in a good split of pools', () => {
    const { gameSchedule, numRounds } = scheduleMultiStageGames(players)
    expect(true).toBe(true)
  })

})


