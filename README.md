Game Backlog App

This is my project for CIS 486 Dev Lab QUEBEC. It’s a simple CRUD app where you can keep track of your video games, like whether they’re sitting in the backlog, being played, or already finished.

What it does:

- Add a new game with platform, status, and notes

- See all the games you’ve added

- Edit a game’s info if you change your mind

- Delete a game when you’re done with it (or just tired of it)

The front end is a small Bootstrap/jQuery page, and the back end is Node/Express hooked up to MongoDB. Nothing too fancy, but it shows the full stack round trip.

GET /api/games → list all games

POST /api/games → add a new game

GET /api/games/:id → grab one game by id

PUT /api/games/:id → update a game

DELETE /api/games/:id → remove a game

GET /api/health → just a quick “ok” check

Made by Isabella Archer (aka me) as a class project.