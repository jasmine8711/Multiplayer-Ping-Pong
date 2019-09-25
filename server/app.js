const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const http = require('http');
const server = http.createServer(app);
const socket = require('socket.io')(server);

app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static middleware
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/*', (req, res, next) => {
	res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.send(err.message || 'Internal server error');
});

const canvas = {
	width: 800,
	height: 380
};

//create a game state
const gameState = {
	players: {},
	ball: {
		x: canvas.width / 2,
		y: canvas.height / 2,
		radius: 7,
		velocityX: 1,
		velocityY: 1,
		speed: 5,
	}
}
server.listen(PORT, () => {
	console.log('Server is live on PORT:', PORT);
});
socket.on('connection', (socket) => {
	console.log('a user connected:', socket.id);
	socket.emit('identification', socket.id);

	socket.on('disconnect', function () {
		console.log('user disconnected');
		//prevent ‘ghost’ players
		delete gameState.players[socket.id]
	});

	socket.on('playername', (data) => {

		gameState.players[socket.id].name = data;
		console.log(gameState.players[socket.id].name);
	})

	socket.on('newPlayer', (player) => {

		canvas.width = player.width;
		canvas.height = player.height;
		console.log(player);

		const playerCount = Object.keys(gameState.players).length

		console.log(playerCount);
		// Because we only add a user now,
		// the count is actually the amount of
		// players - 1

		if (playerCount > 1) {
			console.log('tai duo ren !')
			return;
		} else if (playerCount > 0) {

			gameState.players[socket.id] = {
				x: 780,
				y: 200,
				width: 20,
				height: 100,
				score: 0,
				name: "username",
				classname: "reverse"
			};
		} else {
			gameState.players[socket.id] = {
				x: 0,
				y: 200,
				width: 20,
				height: 100,
				score: 0,
				name: "username"
			};
		}
		const messageBox = {
			message: ""
		}

		socket.emit('ready');
		/*
		let leftPaddle;
		let rightPaddle;
		if (gameState.players[socket.id].x === 0) {
			leftPaddle = gameState.players[socket.id];

			collision(gameState.ball, leftPaddle);
		}
		if (gameState.players[socket.id].x === 710) {
			rightPaddle = gameState.players[socket.id];
			collision(gameState.ball, rightPaddle);
		}
		console.log(leftPaddle);
		console.log(rightPaddle);
		*/
		//----------------chat

		socket.on('chat', (data) => {
			socket.emit('chat', data)
		})

		socket.on('chat', (data) => {
			socket.emit('broadcast', data);
			socket.broadcast.emit('message', data)
		});
		//-------------
		socket.on('keyevent', (event) => {
			switch (event) {
				case "down":
					gameState.players[socket.id].y += 7;
					break;
				case "up":
					gameState.players[socket.id].y -= 7;
					break;
			}
		});
	});
});

function resetBall() {
	gameState.ball.x = canvas.width / 2;
	gameState.ball.y = canvas.height / 2;
	gameState.ball.velocityX = -gameState.ball.velocityX;
	gameState.ball.speed = 10;
}

let loser = null;

setInterval(() => {

	const playerCount = Object.keys(gameState.players).length
	if (playerCount < 2) {
		return;
	}

	/* const player1 = null;
	const player2 = null;

	Object.keys(gameState.players).forEach(id => {
		if (player1 === null && gameState.players[id].x < canvas.width / 2) {
			playerLeft = gameState.players[id];
		} else {
			playerRight = gameState.players[id];
		}
	}); */

	gameState.ball.x += gameState.ball.velocityX;
	gameState.ball.y += gameState.ball.velocityY;
	// when the ball collides with bottom and top walls we inverse the y velocity.
	if (gameState.ball.y < -10 || gameState.ball.y > canvas.height - 10) {
		gameState.ball.velocityY = -gameState.ball.velocityY;
	}


	Object.keys(gameState.players).forEach(id => {
		const player = gameState.players[id];
		if (loser !== null && player !== loser) {
			player.score++;
			loser = null;
			resetBall();
			// emit score
		}

		if (collision(gameState.ball, player)) {
			gameState.ball.velocityX = -gameState.ball.velocityX;
		}

		if ((player.x > 500 && gameState.ball.x > 700) || (player.x < 10 && gameState.ball.x < 0)) {
			loser = player;
		}

	});


	socket.sockets.emit('state', gameState);
}, 1000 / 60);

function collision(b, p) {
	p.top = p.y;
	p.bottom = p.y + p.height;
	p.left = p.x;
	p.right = p.x + p.width;

	b.top = b.y - b.radius;
	b.bottom = b.y + b.radius;
	b.left = b.x - b.radius;
	b.right = b.x + b.radius;

	return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}