import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BASKET_WIDTH = 80;
const BASKET_HEIGHT = 60;
const HEART_SIZE = 40;

const CUTE_MESSAGES = [
  "PROPOSED -  july 8 ,2019",
  "DATING  - JULY28 , 2022🥰",
  "KISS - Feb 6 , 2023🥰",
  "SHE SAID I LOVE U- May 3 , 2023🥰",
  "1st MOVIE DATE - May 7, 2023🥰",
  "1st SLEEP OVER - March 29,2024",
  "SASTI MASTI- Sept 8,2024 🎉",
  "TOLD MOMMY - April 28,2025 💖",
  "Now only one date remaining - 2027 👏",
  "Now only one date remaining - 2027 ??? 🎊",
];

function App() {
  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [basketX, setBasketX] = useState(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
  const [message, setMessage] = useState('');
  const [messageId, setMessageId] = useState(0);
  const [showPleading, setShowPleading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Refs
  const gameLoopRef = useRef();
  const heartSpawnRef = useRef();
  const keysPressed = useRef({});
  const heartIdRef = useRef(0);
  const basketXRef = useRef(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
  const caughtHeartsRef = useRef(new Set());
  const messageIndexRef = useRef(0);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch/swipe handling
  useEffect(() => {
    let touchStartX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (gameOver || score >= 10) return;
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX;
      setBasketX((prev) => {
        let newX = prev + diff * 0.5;
        return Math.max(0, Math.min(newX, GAME_WIDTH - BASKET_WIDTH));
      });
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameOver, score]);

  // Basket movement
  useEffect(() => {
    basketXRef.current = basketX;
  }, [basketX]);

  // Basket keyboard control
  useEffect(() => {
    const moveBasket = () => {
      const speed = 15;
      setBasketX((prev) => {
        let newX = prev;
        if (keysPressed.current['ArrowLeft']) {
          newX -= speed;
        }
        if (keysPressed.current['ArrowRight']) {
          newX += speed;
        }
        return Math.max(0, Math.min(newX, GAME_WIDTH - BASKET_WIDTH));
      });
    };

    const moveInterval = setInterval(moveBasket, 30);
    return () => clearInterval(moveInterval);
  }, []);

  // Spawn hearts
  useEffect(() => {
    if (gameOver || score >= 10) return;

    heartSpawnRef.current = setInterval(() => {
      const newHeart = {
        id: heartIdRef.current++,
        x: Math.random() * (GAME_WIDTH - HEART_SIZE),
        y: -HEART_SIZE,
      };
      setHearts((prev) => [...prev, newHeart]);
    }, 1000);

    return () => clearInterval(heartSpawnRef.current);
  }, [gameOver, score]);

  // Game loop - move hearts and check collisions
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setHearts((prevHearts) => {
        let scoreIncrement = 0;

        const updated = prevHearts
          .map((heart) => ({
            ...heart,
            y: heart.y + 5,
          }))
          .filter((heart) => {
            // Skip if already caught before
            if (caughtHeartsRef.current.has(heart.id)) {
              return false;
            }

            // Check collision with basket
            if (
              heart.y >= 420 &&
              heart.x + HEART_SIZE >= basketXRef.current &&
              heart.x <= basketXRef.current + BASKET_WIDTH
            ) {
              // Mark this heart as caught (prevent counting again)
              caughtHeartsRef.current.add(heart.id);
              scoreIncrement += 1;
              return false; // Remove from array
            }

            // Remove if far off bottom of screen
            return heart.y < 550;
          });

        // Update score once per interval
        if (scoreIncrement > 0) {
          setScore((prev) => prev + scoreIncrement);
          showMessage();
        }

        return updated;
      });
    }, 30);

    return () => clearInterval(gameLoopRef.current);
  }, []);

  const showMessage = () => {
    const msg = CUTE_MESSAGES[messageIndexRef.current];
    setMessage(msg);
    setMessageId((prev) => prev + 1);
    messageIndexRef.current = (messageIndexRef.current + 1) % CUTE_MESSAGES.length;
    setTimeout(() => setMessage(''), 1500);
  };

  const handleYes = () => {
    setGameOver(true);
  };

  const handlePleadingYes = () => {
    setShowPleading(false);
    setShowCelebration(true);
  };

  const handleNo = () => {
    // Show pleading screen instead of running away
    setShowPleading(true);
  };

  const restartGame = () => {
    setScore(0);
    setGameOver(false);
    setHearts([]);
    setMessage('');
    setBasketX(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
    heartIdRef.current = 0;
    caughtHeartsRef.current.clear();
    messageIndexRef.current = 0;
    setShowPleading(false);
    setShowCelebration(false);
  };

  const won = score >= 10 && !gameOver;

  return (
    <div className="app-container">
      <h1 className="title">💕 Catch the Heart 💕</h1>

      {/* Score */}
      <div className="score-board">
        <p>Hearts Caught: <span className="score-number">{score}</span>/10</p>
      </div>

      {/* Game Area */}
      {!won && !gameOver && (
        <div
          className="game-area"
          style={{
            width: `${GAME_WIDTH}px`,
            height: `${GAME_HEIGHT}px`,
          }}
        >
          {/* Falling Hearts */}
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="heart"
              style={{
                left: `${heart.x}px`,
                top: `${heart.y}px`,
                width: `${HEART_SIZE}px`,
                height: `${HEART_SIZE}px`,
              }}
            >
              ❤️
            </div>
          ))}

          {/* Basket */}
          <div
            className="basket"
            style={{
              left: `${basketX}px`,
              bottom: `0px`,
              width: `${BASKET_WIDTH}px`,
              height: `${BASKET_HEIGHT}px`,
            }}
          >
            🧺
          </div>

          {/* Message */}
          {message && (
            <div key={messageId} className="message">
              {message}
            </div>
          )}
        </div>
      )}

      {/* Won Screen */}
      {won && (
        <div className="modal-overlay">
          <div className="win-message">
            <img src="/love.jpeg" alt="Love" className="win-image" />
            <h2>You caught my heart…</h2>
            <h3>Now will you be my Valentine? 💘</h3>
            <div className="button-group">
              <button className="btn btn-yes" onClick={handleYes}>
                YES 💕
              </button>
              <button className="btn btn-no" onClick={handleNo}>
                NO 😈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="modal-overlay success">
          <div className="game-over-message">
            <h1>💕 You said YES! 💕</h1>
            <p>Together forever! 💑</p>
            <button className="btn btn-restart" onClick={restartGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Pleading Screen */}
      {showPleading && (
        <div className="modal-overlay pleading">
          <div className="pleading-message">
            <img src="/me.jpeg" alt="Pleading" className="pleading-image" />
            <h2>PRETTY PLEASEEEEE 🥺</h2>
            <button className="btn btn-valentine" onClick={handlePleadingYes}>
              MY VALENTINE FOREVER 💕
            </button>
          </div>
        </div>
      )}

      {/* Celebration Screen */}
      {showCelebration && (
        <div className="modal-overlay celebration">
          <div className="celebration-message">
            <h1>🎉 YES!!! 💕 🎉</h1>
            <p>You made me the happiest! 🥰</p>
            <p>I love you so much! 💑✨</p>
            <button className="btn btn-restart" onClick={restartGame}>
              Play Again
            </button>
            <div className="confetti">
              {[...Array(20)].map((_, i) => (
                <span key={i} className="confetti-piece">
                  {['💕', '🎉', '✨', '💑'][Math.floor(Math.random() * 4)]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {!won && !gameOver && (
        <div className="instructions">
          <p>⬅️ Use Arrow Keys / Swipe to move the basket ➡️</p>
          <p>Catch 10 hearts to win! 💕</p>
        </div>
      )}
    </div>
  );
}

export default App;
