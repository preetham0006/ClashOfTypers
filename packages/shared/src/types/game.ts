export type GameDuration = 30 | 60 | 120;
export type BestOf = 1 | 3 | 5;

export interface RoomSettings {
  durationSec: GameDuration;
  bestOf: BestOf;
  maxPlayers: 10;
}

export interface PlayerStat {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
}
