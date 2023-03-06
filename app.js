const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running....");
    });
  } catch (e) {
    console.log(`Database Error ${e.message}`);
    process.exit(1);
  }
};

initializeDb();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerID: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API-1 Get all players

app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    SELECT 
        *
    FROM 
        player_details`;

  const playersArray = await db.all(getAllPlayers);
  response.send(
    playersArray.map((eachObject) =>
      convertDbObjectToResponseObject(eachObject)
    )
  );
});

//API-2 get Specific player

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT 
        * 
    FROM player_details
    WHERE 
        player_id = ${playerId}`;

  const playerArray = await db.get(getPlayer);
  response.send(convertDbObjectToResponseObject(playerArray));
});

//API-3 update player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId}`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API-4 Get match Details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetails = `
    SELECT 
        *
    FROM match_details
    WHERE 
        match_id = ${matchId}`;

  const matchArray = await db.get(getMatchDetails);
  response.send(matchArray);
});

///API-5 get all matches of player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT 
        * 
    FROM 
        player_match_score 
        NATURAL JOIN 
        match_details
    WHERE 
        player_id = ${playerId};`;

  const matchArray = await db.all(getMatchesQuery);
  response.send(
    matchArray.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

//API-6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT 
        player_id,
        player_name 
    FROM 
        match_details
        INNER JOIN 
        player_details
    WHERE 
        match_id = ${matchId}`;

  const matchArray = await db.get(getPlayersQuery);
  response.send(convertDbObjectToResponseObject(matchArray));
});

//API-7 Total Scores

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const scoresArray = await db.get(getPlayerScored);
  response.send(scoresArray);
});

module.exports = app;
