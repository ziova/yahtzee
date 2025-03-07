import React, { useState, useEffect, useCallback } from 'react';

const DarkYahtzee = () => {
  // Theme colors
  const theme = {
    background: '#121212',
    surface: '#1e1e1e',
    surfaceLight: '#2a2a2a',
    accent: '#ff4081',
    accentDark: '#c60055',
    text: '#f0f0f0',
    textSecondary: '#a0a0a0',
    success: '#00e676',
    player1: '#4fc3f7',
    player2: '#ffd54f'
  };

  // Player state
  const [players, setPlayers] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState(0);

  // Game states
  const initialScoreState = {
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    threeOfAKind: null,
    fourOfAKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null
  };

  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rolling, setRolling] = useState(false);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("Roll the dice to start!");
  const [diceAnimationStates, setDiceAnimationStates] = useState([
    { rotateX: 0, rotateY: 0, translateZ: 0 },
    { rotateX: 0, rotateY: 0, translateZ: 0 },
    { rotateX: 0, rotateY: 0, translateZ: 0 },
    { rotateX: 0, rotateY: 0, translateZ: 0 },
    { rotateX: 0, rotateY: 0, translateZ: 0 }
  ]);

  // Scoring states
  const [playerScores, setPlayerScores] = useState([
    {
      scores: {...initialScoreState},
      totalScore: 0,
      upperBonus: 0,
      yahtzeeBonus: 0
    },
    {
      scores: {...initialScoreState},
      totalScore: 0,
      upperBonus: 0,
      yahtzeeBonus: 0
    }
  ]);

  // Helper functions for scoring
  const countDice = useCallback(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    dice.forEach(die => counts[die]++);
    return counts;
  }, [dice]);

  const sumDice = useCallback(() => dice.reduce((sum, die) => sum + die, 0), [dice]);

  const hasFullHouse = useCallback((counts) => {
    return Object.values(counts).includes(3) && Object.values(counts).includes(2);
  }, []);

  const hasSmallStraight = useCallback((counts) => {
    return (counts[1] >= 1 && counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1) ||
           (counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1) ||
           (counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1 && counts[6] >= 1);
  }, []);

  const hasLargeStraight = useCallback((counts) => {
    return (counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1) ||
           (counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1);
  }, []);

  // Calculate score for a specific category
  const calculateScore = useCallback((category) => {
    const diceCounts = countDice();

    switch (category) {
      case 'ones': return diceCounts[1] * 1;
      case 'twos': return diceCounts[2] * 2;
      case 'threes': return diceCounts[3] * 3;
      case 'fours': return diceCounts[4] * 4;
      case 'fives': return diceCounts[5] * 5;
      case 'sixes': return diceCounts[6] * 6;
      case 'threeOfAKind': return Object.values(diceCounts).some(count => count >= 3) ? sumDice() : 0;
      case 'fourOfAKind': return Object.values(diceCounts).some(count => count >= 4) ? sumDice() : 0;
      case 'fullHouse': return hasFullHouse(diceCounts) ? 25 : 0;
      case 'smallStraight': return hasSmallStraight(diceCounts) ? 30 : 0;
      case 'largeStraight': return hasLargeStraight(diceCounts) ? 40 : 0;
      case 'yahtzee': return Object.values(diceCounts).some(count => count === 5) ? 50 : 0;
      case 'chance': return sumDice();
      default: return 0;
    }
  }, [countDice, sumDice, hasFullHouse, hasSmallStraight, hasLargeStraight]);

  // Calculate the current score whenever scores change
  useEffect(() => {
    const updateScores = () => {
      setPlayerScores(prev => {
        const updated = [...prev];

        for (let i = 0; i < players; i++) {
          const playerData = {...updated[i]};
          const { scores } = playerData;

          // Calculate upper section
          let upper = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
            .reduce((sum, category) => sum + (scores[category] ?? 0), 0);

          // Determine if upper bonus applies
          const bonus = upper >= 63 ? 35 : 0;
          playerData.upperBonus = bonus;

          // Calculate total
          let total = upper + bonus + playerData.yahtzeeBonus;
          total += ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
                   'largeStraight', 'yahtzee', 'chance']
            .reduce((sum, category) => sum + (scores[category] ?? 0), 0);

          playerData.totalScore = total;
          updated[i] = playerData;
        }

        return updated;
      });

      // Check if game is over
      const allFilled = playerScores.slice(0, players).every(
        player => Object.values(player.scores).every(score => score !== null)
      );

      if (allFilled && currentTurn > 12) {
        setGameOver(true);

        if (players === 1) {
          setMessage(`Game Over! Final Score: ${playerScores[0].totalScore}`);
        } else {
          const winner = playerScores[0].totalScore > playerScores[1].totalScore ?
            "Player 1" : playerScores[0].totalScore < playerScores[1].totalScore ?
            "Player 2" : "It's a tie";

          setMessage(`Game Over! ${winner === "It's a tie" ? winner : `${winner} wins!`}`);
        }
      }
    };

    updateScores();
  }, [playerScores, players, currentTurn]);

// Roll the dice with shuffle animation
  const rollDice = () => {
    if (rollsLeft > 0 && !gameOver && !rolling) {
      setRolling(true);

      let rollCount = 0;
      const maxRolls = 10;
      const interval = setInterval(() => {
        setDice(prev => prev.map((die, index) =>
          held[index] ? die : Math.floor(Math.random() * 6) + 1
        ));
        rollCount++;
        if (rollCount >= maxRolls) {
          clearInterval(interval);
          setRolling(false);
          setRollsLeft(prev => prev - 1);
          setMessage(
            rollsLeft - 1 > 0
              ? `You have ${rollsLeft - 1} rolls left`
              : "Choose a scoring category"
          );
        }
      }, 100);
    }
  };


  // Toggle hold state for a die
  const toggleHold = (index) => {
    if (rollsLeft < 3 && rollsLeft > 0 && !gameOver && !rolling) {
      setHeld(prev => {
        const newHeld = [...prev];
        newHeld[index] = !newHeld[index];
        return newHeld;
      });
    }
  };

  // Score the current dice in a category
  const scoreCategory = (category) => {
    if (playerScores[currentPlayer].scores[category] === null && rollsLeft < 3 && !gameOver && !rolling) {
      const score = calculateScore(category);

      setPlayerScores(prev => {
        const updated = [...prev];
        const playerData = {...updated[currentPlayer]};

        // Check for Yahtzee bonus
        if (category === 'yahtzee' && score === 50) {
          // First Yahtzee
        } else if (Object.values(countDice()).includes(5) && playerData.scores.yahtzee === 50) {
          // Yahtzee bonus
          playerData.yahtzeeBonus += 100;
          setMessage("YAHTZEE BONUS! +100 points!");
        }

        playerData.scores = {
          ...playerData.scores,
          [category]: score
        };

        updated[currentPlayer] = playerData;
        return updated;
      });

      // Reset for next turn
      setRollsLeft(3);
      setHeld([false, false, false, false, false]);

      // Switch player if multiplayer
      if (players > 1) {
        setCurrentPlayer(prev => (prev + 1) % players);
        setMessage(`Player ${((currentPlayer + 1) % players) + 1}'s turn. Roll the dice!`);
      } else {
        setCurrentTurn(prev => prev + 1);
        setMessage("Roll the dice for your next turn");
      }

      // Only increment turn after all players have gone
      if (players === 1 || currentPlayer === players - 1) {
        setCurrentTurn(prev => prev + 1);
      }
    }
  };

  // Start a new game
  const newGame = () => {
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setCurrentTurn(1);
    setCurrentPlayer(0);
    setGameOver(false);
    setMessage("Roll the dice to start!");
    setDiceAnimationStates([
      { rotateX: 0, rotateY: 0, translateZ: 0 },
      { rotateX: 0, rotateY: 0, translateZ: 0 },
      { rotateX: 0, rotateY: 0, translateZ: 0 },
      { rotateX: 0, rotateY: 0, translateZ: 0 },
      { rotateX: 0, rotateY: 0, translateZ: 0 }
    ]);

    setPlayerScores([
      {
        scores: {...initialScoreState},
        totalScore: 0,
        upperBonus: 0,
        yahtzeeBonus: 0
      },
      {
        scores: {...initialScoreState},
        totalScore: 0,
        upperBonus: 0,
        yahtzeeBonus: 0
      }
    ]);
  };

  // Toggle between single and multiplayer
  const togglePlayers = () => {
    if (!gameOver && currentTurn === 1 && rollsLeft === 3) {
      setPlayers(prev => prev === 1 ? 2 : 1);
      setMessage(players === 1 ? "2-Player mode activated! Player 1 starts." : "1-Player mode activated!");
    }
  };

  // Render realistic dice
  const renderDie = (value, index) => {
    const dotPositions = {
      1: [[50, 50]],
      2: [[25, 25], [75, 75]],
      3: [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [25, 75], [75, 25], [75, 75]],
      5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
      6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]]
    };

    const positions = dotPositions[value];
    const animState = diceAnimationStates[index];

    return (
      <div
        key={index}
        style={{
          width: '70px',
          height: '70px',
          margin: '0 10px',
          cursor: rolling ? 'default' : 'pointer',
          perspective: '600px'
        }}
        onClick={() => toggleHold(index)}
      >
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          background: held[index] ? theme.accentDark : theme.surfaceLight,
          boxShadow: held[index]
            ? `0 0 12px ${theme.accent}`
            : '0 4px 8px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotateX(${animState.rotateX}deg) rotateY(${animState.rotateY}deg) translateZ(${animState.translateZ}px)`,
          transition: rolling ? 'transform 0.06s ease-out' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transformStyle: 'preserve-3d'
        }}>
          {positions.map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                left: `${pos[0]}%`,
                top: `${pos[1]}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render a score button
  const renderScoreButton = (category, displayName) => {
    const currentPlayerData = playerScores[currentPlayer];
    const isScored = currentPlayerData.scores[category] !== null;
    const currentScore = isScored ? currentPlayerData.scores[category] : calculateScore(category);
    const potentialScore = !isScored && rollsLeft < 3 ? currentScore : null;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          margin: '6px 0',
          backgroundColor: isScored ? theme.surface : (potentialScore !== null ? theme.surfaceLight : theme.surface),
          color: isScored ? theme.textSecondary : theme.text,
          borderRadius: '8px',
          cursor: isScored || rollsLeft === 3 || rolling ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          borderLeft: potentialScore > 0 && !isScored ? `4px solid ${theme.accent}` : 'none',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
        }}
        onClick={() => scoreCategory(category)}
      >
        <span>{displayName}</span>
        <span>{isScored ? currentPlayerData.scores[category] : (potentialScore !== null ? `(${potentialScore})` : '')}</span>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: theme.background,
      color: theme.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      margin: 0,
      fontFamily: "'Iosevka', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <div style={{
        backgroundColor: theme.background,
        color: theme.text,
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '800px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: theme.accent,
          marginBottom: '24px',
          fontSize: '36px',
          fontWeight: '600',
          letterSpacing: '1px'
        }}>
          niv's yahtzee clone
        </h1>

        {/* Player Mode Toggle */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={togglePlayers}
            disabled={!(currentTurn === 1 && rollsLeft === 3) || gameOver}
            style={{
              backgroundColor: (currentTurn === 1 && rollsLeft === 3) && !gameOver ? theme.surfaceLight : theme.surface,
              color: theme.text,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: (currentTurn === 1 && rollsLeft === 3) && !gameOver ? 'pointer' : 'default',
              opacity: (currentTurn === 1 && rollsLeft === 3) && !gameOver ? 1 : 0.5
            }}
          >
            {players === 1 ? 'Switch to 2-Player Mode' : 'Switch to 1-Player Mode'}
          </button>
        </div>

        {/* Current Player Indicator */}
        {players > 1 && (
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: currentPlayer === 0 ? theme.player1 : theme.player2,
            color: '#000',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Player {currentPlayer + 1}'s Turn
          </div>
        )}

        <div style={{
          backgroundColor: theme.surface,
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px',
              minHeight: '90px',
              perspective: '800px'
            }}>
              {dice.map((die, index) => renderDie(die, index))}
            </div>

            <button
              onClick={rollDice}
              disabled={rollsLeft === 0 || gameOver || rolling}
              style={{
                backgroundColor: rollsLeft > 0 && !gameOver && !rolling ? theme.accent : theme.surface,
                color: theme.text,
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: rollsLeft > 0 && !gameOver && !rolling ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: rollsLeft > 0 && !gameOver && !rolling ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                opacity: rollsLeft > 0 && !gameOver && !rolling ? 1 : 0.5
              }}
            >
              {rolling ? 'Rolling...' : (rollsLeft > 0 ? `Roll Dice (${rollsLeft} left)` : 'No Rolls Left')}
            </button>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: theme.background,
            borderRadius: '8px',
            marginTop: '10px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{
              margin: '4px 0',
              color: message.includes('BONUS') ? theme.accent : theme.text,
              fontWeight: message.includes('BONUS') ? '600' : '400'
            }}>{message}</p>
            <p style={{
              margin: '4px 0',
              fontSize: '14px',
              color: theme.textSecondary
            }}>Turn: {currentTurn}/13</p>
          </div>
        </div>

        {/* Scorecard for current player */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {/* Upper Section */}
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{
              borderBottom: `1px solid ${theme.accent}`,
              paddingBottom: '8px',
              color: theme.accent,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Upper Section
            </h3>
            {renderScoreButton('ones', 'Ones')}
            {renderScoreButton('twos', 'Twos')}
            {renderScoreButton('threes', 'Threes')}
            {renderScoreButton('fours', 'Fours')}
            {renderScoreButton('fives', 'Fives')}
            {renderScoreButton('sixes', 'Sixes')}
            <div style={{
              margin: '12px 0',
              padding: '12px',
              backgroundColor: theme.surface,
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Upper Bonus (63+):</span>
                <span style={{ color: playerScores[currentPlayer].upperBonus > 0 ? theme.success : theme.textSecondary }}>
                  {playerScores[currentPlayer].upperBonus}
                </span>
              </div>
            </div>
          </div>

          {/* Lower Section */}
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{
              borderBottom: `1px solid ${theme.accent}`,
              paddingBottom: '8px',
              color: theme.accent,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Lower Section
            </h3>
            {renderScoreButton('threeOfAKind', 'Three of a Kind')}
            {renderScoreButton('fourOfAKind', 'Four of a Kind')}
            {renderScoreButton('fullHouse', 'Full House')}
            {renderScoreButton('smallStraight', 'Small Straight')}
            {renderScoreButton('largeStraight', 'Large Straight')}
            {renderScoreButton('yahtzee', 'YAHTZEE')}
            {renderScoreButton('chance', 'Chance')}
            <div style={{
              margin: '12px 0',
              padding: '12px',
              backgroundColor: theme.surface,
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Yahtzee Bonus:</span>
                <span style={{ color: playerScores[currentPlayer].yahtzeeBonus > 0 ? theme.success : theme.textSecondary }}>
                  {playerScores[currentPlayer].yahtzeeBonus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Summary for all players */}
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: theme.surface,
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ flex: '1 1 auto' }}>
            {players === 1 ? (
              <h2 style={{
                margin: 0,
                color: theme.accent,
                fontSize: '24px',
                fontWeight: '700'
              }}>
                Total Score: {playerScores[0].totalScore}
              </h2>
            ) : (
              <div>
                <h3 style={{
                  margin: '0 0 5px 0',
                  color: theme.player1,
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Player 1: {playerScores[0].totalScore}
                </h3>
                <h3 style={{
                  margin: 0,
                  color: theme.player2,
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Player 2: {playerScores[1].totalScore}
                </h3>
              </div>
            )}
          </div>
          <button
            onClick={newGame}
            style={{
              backgroundColor: theme.accent,
              color: theme.text,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default DarkYahtzee;
