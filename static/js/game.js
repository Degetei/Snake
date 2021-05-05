const snake_speed = 5;

let lastRenderTime = 0;

function main(currentTime) {
    window.requestAnimationFrame(main);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if(secondsSinceLastRender < 1 / snake_speed) return;

    lastRenderTime = currentTime;

    updateSnake()
    drawSnake();
}

const snakeBody = [
    { x: 11, y: 21 },
    { x: 11, y: 22 },
    { x: 11, y: 23 }
    ];

let direction = { x: 0, y: -1 };

function draw(gameState) {
        let segment = 0;
    gameState.forEach(player => {
        let shownHead = false;
        const snakeBody = player.body;
        snakeBody.forEach(part => {
            let oldSegment = document.getElementById(""+segment);
            if (oldSegment != null)
                oldSegment.remove();
            
            const snakeElement = document.createElement('div');
            if (!shownHead){
                snakeElement.innerText = "^^";
                shownHead = true;
            }
            snakeElement.id = segment;
            segment++;
            snakeElement.style.gridColumnStart = part.x;
            snakeElement.style.gridRowStart = part.y;
            snakeElement.style.backgroundColor = player.colour;
            snakeElement.classList.add('snake');
            gameScreen.appendChild(snakeElement);
        });
    });
}


function drawSnake() {
    let segment = 0;
    let shownHead = false;
    snakeBody.forEach(part => {
        let oldSegment = document.getElementById(""+segment);
        if (oldSegment != null)
            oldSegment.remove();
        
        const snakeElement = document.createElement('div');
        if (!shownHead){
            snakeElement.innerText = "^^";
            shownHead = true;
        }
        snakeElement.id = segment;
        segment++;
        snakeElement.style.gridColumnStart = part.x;
        snakeElement.style.gridRowStart = part.y;
        snakeElement.classList.add('snake');
        gameScreen.appendChild(snakeElement);
    });
}


function updateSnake() {
    const head = {x: snakeBody[0].x + direction.x, y: snakeBody[0].y + direction.y};
    snakeBody.unshift(head);
    snakeBody.pop();
}


document.addEventListener('keydown', changeDirection);

function changeDirection(key) {

    if (key.keyCode === 37) { //left
        direction = { x: -1, y: 0 };
    }
    if (key.keyCode === 38 ) { // up
        direction = { x: 0, y: -1 };
    }
    if (key.keyCode === 39 ) { // right
        direction = { x: 1, y: 0 };
    }
    if (key.keyCode === 40 ) { // down
        direction = { x: 0, y: 1 };
    }
    if (multiplayer)
        socket.emit('update direction', direction);
}
