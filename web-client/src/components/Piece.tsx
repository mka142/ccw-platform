import { PieceData } from "@/types";

export interface PieceProps extends PieceData {
  darkFont?: boolean;
}

export function Piece({ 
  composerName, 
  pieceTitle, 
  performers, 
  darkFont = false 
}: PieceProps) {
  const textColorClass = darkFont ? "text-gray-800 font-semibold" : "text-gray-50";
  const secondaryTextColorClass = darkFont ? "text-gray-600 font-medium" : "text-gray-200";
  const borderColorClass = darkFont ? "border-gray-800/30" : "border-gray-200/30";

  return (
    <div className={`card bg-card/0 backdrop-blur-sm shadow-sm p-4 flex flex-col gap-2 shadow-md border-0 border-x-0 ${borderColorClass}`}>
      <>
        <span
          data-title="composer"
          className={`${textColorClass} font-serif font-thin text-xl`}
        >
          {composerName}
        </span>

        <span data-title="piece" className={`${textColorClass} font-sans italic`}>
          {pieceTitle}
        </span>
        <span className="flex">
          <span className={`${textColorClass} font-serif`}>Wyk. &nbsp;&nbsp;</span>
          <span className={`${secondaryTextColorClass} text-sm flex flex-col`}>
            {performers.map((performer, index) => (
              <span key={index}>
                {performer.name} - {performer.instrument}
              </span>
            ))}
          </span>
        </span>
      </>
    </div>
  );
}
