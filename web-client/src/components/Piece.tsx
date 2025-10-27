import { PieceData } from "@/types";

export interface PieceProps extends PieceData {}
export function Piece({ composerName, pieceTitle, performers }: PieceProps) {
  return (
    <div className="card bg-card/0 backdrop-blur-sm shadow-sm p-4  flex flex-col gap-2 shadow-md border-0 border-x-0 border-gray-200/30">
      <>
        <span
          data-title="composer"
          className="text-gray-50 font-serif font-thin text-xl"
        >
          {composerName}
        </span>

        <span data-title="piece" className="font-sans italic">
          {pieceTitle}
        </span>
        <span className="flex ">
          <span className="font-serif ">Wyk. &nbsp;&nbsp;</span>
          <span className="text-sm flex flex-col">
            {performers.map((performer, index) => (
              <span key={index}>{performer.name}</span>
            ))}
          </span>
        </span>
      </>
    </div>
  );
}
