export interface Performer {
  name: string;
  instrument: string;
}

export interface PieceData {
  composerName: string;
  pieceTitle: string;
  durationSeconds: number;
  pieceDescription: string;
  performers: Performer[];
  piecePosition: number;
  pieceId: string;
}
