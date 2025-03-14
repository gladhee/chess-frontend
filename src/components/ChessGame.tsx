import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";

interface GameState {
  position: string; // FEN 문자열
  currentTurn: "WHITE" | "BLACK";
  gameStatus: string;
  lastMove?: {
    from: string;
    to: string;
  };
  scores: {
    white: number;
    black: number;
  };
  status: boolean; // 게임 종료 여부
}

const ChessGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // 초기 FEN
    currentTurn: "WHITE",
    gameStatus: "게임 진행 중",
    scores: {
      white: 38,
      black: 38,
    },
    status: false,
  });

  const resetGame = async () => {
    try {
      const response = await fetch("https://port-0-fchess-backend-m888iwgwdf3b8b16.sel4.cloudtype.app/api/chess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.error("게임 초기화 실패:", await response.text());
        return;
      }

      // 초기 상태로 되돌리기
      setGameState({
        position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        currentTurn: "WHITE",
        gameStatus: "게임 진행 중",
        scores: {
          white: 38,
          black: 38,
        },
        status: false,
      });
    } catch (error) {
      console.error("게임 초기화 실패:", error);
    }
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    if (gameState.status) {
      return false; // 게임이 종료되면 움직임을 막습니다
    }
    makeMove(sourceSquare as string, targetSquare as string);
    return true;
  };

  const makeMove = async (sourceSquare: string, targetSquare: string) => {
    try {
      const response = await fetch("https://port-0-fchess-backend-m888iwgwdf3b8b16.sel4.cloudtype.app/api/chess/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          from: sourceSquare,
          to: targetSquare,
          currentPosition: gameState.position,
          currentTurn: gameState.currentTurn.toLowerCase(),
        }),
      });

      if (!response.ok) {
        console.error("Move failed:", await response.text());
        return;
      }

      const result = await response.json();
      console.log("백엔드 응답:", result);
      console.log("백엔드에서 받은 currentTurn:", result.currentTurn);

      if (!result.validMove) {
        console.error("Invalid move");
        return;
      }

      // 백엔드에서 받은 체스보드 문자열을 FEN 형식으로 변환
      const boardString = result.fen;
      console.log("받은 체스보드 문자열:", boardString);

      const rows = boardString.split("\n").filter((row: string) => row.trim());
      console.log("분리된 행:", rows);

      // 각 행의 빈 칸을 숫자로 변환하고 대소문자 변환
      const fenRows = rows.map((row: string) => {
        let fenRow = "";
        let emptyCount = 0;

        for (let i = 0; i < row.length; i++) {
          if (row[i] === ".") {
            emptyCount++;
            if (i === row.length - 1) {
              fenRow += emptyCount;
            }
          } else {
            if (emptyCount > 0) {
              fenRow += emptyCount;
              emptyCount = 0;
            }
            // 대소문자 변환: 현재 대문자면 소문자로, 소문자면 대문자로
            fenRow +=
              row[i] === row[i].toUpperCase()
                ? row[i].toLowerCase()
                : row[i].toUpperCase();
          }
        }

        return fenRow;
      });

      console.log("FEN 형식의 행:", fenRows);

      // 백엔드에서 받은 currentTurn을 대문자로 변환
      const currentTurn = result.currentTurn.toUpperCase();
      console.log("변환된 currentTurn:", currentTurn);

      const fenPosition =
        fenRows.join("/") +
        " " +
        (currentTurn === "WHITE" ? "w" : "b") +
        " " +
        "KQkq - 0 1";

      console.log("최종 FEN 문자열:", fenPosition);

      setGameState((prevState) => {
        const newState = {
          position: fenPosition,
          currentTurn: currentTurn,
          gameStatus: result.status
            ? `${currentTurn === "WHITE" ? "검은색" : "흰색"} 승리!`
            : "게임 진행 중",
          lastMove: {
            from: result.lastMoveFrom,
            to: result.lastMoveTo,
          },
          scores: {
            white: result.whiteScore,
            black: result.blackScore,
          },
          status: result.status,
        };
        console.log("이전 상태:", prevState);
        console.log("새로운 상태:", newState);
        return newState;
      });
    } catch (error) {
      console.error("Move failed:", error);
    }
  };

  const getSquareStyles = () => {
    const squares: Record<string, React.CSSProperties> = {};

    if (gameState.lastMove) {
      squares[gameState.lastMove.from] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      };
      squares[gameState.lastMove.to] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      };
    }

    return squares;
  };

  return (
    <div
      className="chess-game"
      style={{ textAlign: "center", padding: "20px" }}
    >
      <div
        className="game-info"
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <h2 style={{ margin: 0 }}>체스 게임</h2>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 20px",
          }}
        >
          <div
            style={{
              padding: "10px",
              backgroundColor: gameState.status ? "#ffeb3b" : "#e6ffe6",
              borderRadius: "5px",
              marginBottom: "10px",
              width: "fit-content",
              fontWeight: gameState.status ? "bold" : "normal",
            }}
          >
            {gameState.status
              ? gameState.gameStatus
              : `현재 차례: ${
                  gameState.currentTurn === "WHITE" ? "흰색" : "검은색"
                }`}
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                padding: "5px 10px",
                backgroundColor: "#ffffff",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              흰색 점수: {gameState.scores.white.toFixed(2)}
            </div>
            <div
              style={{
                padding: "5px 10px",
                backgroundColor: "#000000",
                color: "#ffffff",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              검은색 점수: {gameState.scores.black.toFixed(2)}
            </div>
          </div>
          <div>게임 상태: {gameState.gameStatus}</div>
        </div>
        <button
          onClick={resetGame}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            height: "fit-content",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#45a049")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#4CAF50")
          }
        >
          게임 다시 시작
        </button>
      </div>

      <div
        style={{
          width: "500px",
          margin: "0 auto",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          borderRadius: "5px",
        }}
      >
        <Chessboard
          position={gameState.position}
          onPieceDrop={onPieceDrop}
          customSquareStyles={getSquareStyles()}
          animationDuration={200}
        />
      </div>
    </div>
  );
};

export default ChessGame;
