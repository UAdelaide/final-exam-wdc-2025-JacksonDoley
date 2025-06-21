const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DogWalkService',
  multipleStatements: true,
};

let db;

async function insertTestData() {

  await db.query(`
    DELETE FROM WalkRatings;
    DELETE FROM WalkApplications;
    DELETE FROM WalkRequests;
    DELETE FROM Dogs;
    DELETE FROM Users;

    INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hash1', 'owner'),
      ('carol123', 'carol@example.com', 'hash2', 'owner'),
      ('bobwalker', 'bob@example.com', 'hash3', 'walker'),
      ('newwalker', 'newwalker@example.com', 'hash4', 'walker');

    INSERT INTO Dogs (owner_id, name, size) VALUES
      (1, 'Max', 'medium'),
      (2, 'Bella', 'small');

    INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      (1, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      (2, '2025-06-11 09:00:00', 45, 'City Park', 'completed');

    INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
      (1, 3, 'pending'),
      (2, 3, 'accepted');

    INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
      (2, 3, 2, 5, 'Great walk!');
  `);
}

async function main() {
  db = await mysql.createConnection(dbConfig);
  await insertTestData();


  app.get('/api/dogs', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username
        FROM Dogs
        JOIN Users ON Dogs.owner_id = Users.user_id
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/walkrequests/open', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          WalkRequests.request_id,
          Dogs.name AS dog_name,
          WalkRequests.requested_time,
          WalkRequests.duration_minutes,
          WalkRequests.location,
          Users.username AS owner_username
        FROM WalkRequests
        JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
        JOIN Users ON Dogs.owner_id = Users.user_id
        WHERE WalkRequests.status = 'open'
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.get('/api/walkers/summary', async (req, res) => {
    try {
      let [rows] = await db.query(`
        SELECT
          u.username AS walker_username,
          COUNT(r.rating_id) AS total_ratings,
          AVG(r.rating) AS average_rating,
          (
            SELECT COUNT(*)
            FROM WalkRequests wr
            JOIN WalkApplications wa ON wr.request_id = wa.request_id
            WHERE wa.walker_id = u.user_id AND wr.status = 'completed' AND wa.status = 'accepted'
          ) AS completed_walks
        FROM Users u
        LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
        WHERE u.role = 'walker'
        GROUP BY u.user_id
      `);

      rows = rows.map((r) => ({
        ...r,
        average_rating: r.average_rating !== null ? parseFloat(r.average_rating) : null,
      }));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start app:', err);
});