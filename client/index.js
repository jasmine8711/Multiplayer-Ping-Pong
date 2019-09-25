const userName = document.createElement('p');
userName.innerText = "User name:"
userName.classList.add("username");
const input = document.createElement('input');
input.classList.add("input");

const playerbox = document.querySelector('.player');
console.log(playerbox);
const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
document.addEventListener("keydown", keydown);

function keydown(event) {
    if (event.keyCode === 13) {
        player1.innerText = input.value;
        socket.emit('playername', `${player1.innerText} `);
    }
}


//canvas
const app = new PIXI.Application({
    width: 800,
    height: 400,
    antialias: true,
    autoDensity: true,
    resolution: 2,
});

app.renderer.backgroundColor = 0x00264d;
// this is how to add css into pixi
app.view.style.margin = '0 auto';

document.body.appendChild(app.view);
document.body.appendChild(userName);
document.body.appendChild(input);
document.body.appendChild(chat);

const table = new PIXI.Graphics();
table.lineStyle(2, 0xffffff, 1);
table.beginFill(0x00264d);
table.drawRect(10, 10, 780, 380);
table.endFill();

app.stage.addChild(table);

const realPath = new PIXI.Graphics();

realPath.lineStyle(1, 0xFFFFFF, 0.6);
realPath.moveTo(400, 10)
realPath.lineTo(400, 390);

app.stage.addChild(realPath);

function createBall() {
    const ball = new PIXI.Graphics();
    ball.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    ball.beginFill(0xffffff, 1);
    ball.drawCircle(30, 30, 14);
    ball.endFill();
    const container = new PIXI.Container();
    container.addChild(ball);
    app.stage.addChild(container);
    ball.blendmode = PIXI.BLEND_MODES.ADD;

    return ball;
}

function createPaddle() {
    const paddle = new PIXI.Graphics();
    paddle.beginFill(0xffffff);
    paddle.drawRect(0, 0, 1, 1);
    paddle.endFill();
    app.stage.addChild(paddle);

    return paddle;
}

const socket = io();
//---------------------chat-----------------

const message = document.getElementById("message");
const outputname = document.getElementById("outputname");
const outputmessage = document.getElementById("outputmessage");
const btn = document.getElementById("send");
const output = document.getElementById("output");
btn.onclick = () => {
    console.log(message.value);

    socket.emit('chat', {
        message: message.value,
        name: input.value
    })

}

let paddle = createPaddle();
let opponent = createPaddle();
let ball = createBall();
let playerID = "";

//let username = input.value;

//draw a player


socket.on('identification', (id) => {
    playerID = id;
});
socket.emit('newPlayer', { width: app.stage.width, height: app.stage.height });

socket.on('ready', (data) => {
    socket.on('state', (gameState) => {
        Object.keys(gameState.players).forEach(p => {
            const playerState = gameState.players[p];

            if (p === playerID) {
                paddle.x = playerState.x;
                paddle.y = playerState.y;
                paddle.width = playerState.width;
                paddle.height = playerState.height;
                paddle.name = playerState.name;
                player1.innerText = paddle.name;
                score1.innerText = playerState.score;
                playerbox.classList.add(`${playerState.classname}`);
            } else {
                opponent.x = playerState.x;
                opponent.y = playerState.y;
                opponent.width = playerState.width;
                opponent.height = playerState.height;
                opponent.name = playerState.name;
                player2.innerText = opponent.name;
                score2.innerText = playerState.score;
            }
        })
        ball.x = gameState.ball.x;
        ball.y = gameState.ball.y;
    });
    socket.on('broadcast', (data) => {
        console.log(Object.keys(data.message).length)
        outputmessage.innerHTML += `<br>${data.name}:${data.message}`
    });
    socket.on('message', (data) => {
        outputmessage.innerHTML += `<br>${data.name}:${data.message}`
    });

})



const keyDownHandler = (e) => {
    if (e.keyCode == 38) {
        socket.emit('keyevent', 'up');
    } else if (e.keyCode == 40) {
        socket.emit('keyevent', 'down');
    }
};

document.addEventListener('keydown', keyDownHandler, false);