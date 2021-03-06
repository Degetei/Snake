const url = 'https://localhost:5000';
var socket = io.connect(url, {
    'sync disconnect on unload': true
});

// The 'clientId' variable is used to distinguish this client from other clients.
let clientId = null;
socket.on('id', (id) => clientId = id);

// This method updates the player overview on the login screen.
socket.on('update players', function(players){
    
    let tableContent = "";
    
    const cell = name => `<td class='playerTd'>${name}</td>`;

    let length = Object.keys(players).length;
    let columnCounter = 0;

    for (let i=0;i<length;i++){
        if (columnCounter == 0)
            tableContent += "<tr>";
        
        if (columnCounter <5) {
            if (players[i] != undefined){
                if (players[i].id != clientId)
                    tableContent += cell(players[i].name);
                else
                    tableContent += cell(players[i].name+" (You)");  
        }
        columnCounter++;   
        }
        if (columnCounter > 4)
            columnCounter = 0;
    }
    document.getElementById("players").innerHTML = tableContent;
});

// This method creates a user room isolated from other rooms.
function createRoom(){
    socket.emit('create room');
    startButton.className = 'loginButton';
    startButton.disabled = false;
}

// This method allows the user to join an existing user room.
function joinRoom(roomId){
    socket.emit('join room', {"roomId": roomId});
    startButton.className = 'loginButton';
    startButton.disabled = false;
}

// When printing out room members, this method decides the class
// of an HTML 'p' tag according to the 'ready' status of a user.
function showReady(username, ready){
    const p = un => `<p>${un}</p>`;
    const readyp = readyun => `<p class='readyp'>${readyun}</p>`;

    if (!ready){
        return p(username);
    }
    else
        return readyp(username);
}


// This method prints out an HTML table containing all rooms with
// their respective members.
function updateRooms(rooms){
    
    let content = "<table>";

    for (var id in rooms){
        if (rooms[id] != undefined){
            if (rooms[id].inGame == undefined){
                let totalMembers = rooms[id].members.length;
                let members = "";
                for (let i = 0; i < totalMembers; i++){
                    const member = rooms[id].members[i];
                    let username = member.name;
                    let ready = false;
                    if (member.ready != undefined){
                        if (member.ready){
                            ready = true;
                            username = username.bold();
                        }
                    }

                    if (i < totalMembers-1) {
                        if (member.id != clientId)
                            members += showReady(username + ", ", ready);
                        else
                            members += showReady(username + " (you), ", ready);
                    }
                    else {
                        if (member.id != clientId)
                            members += showReady(username, ready);
                        else
                            members += showReady(username + " (you)", ready);
                    }
                }
                content += "<tr><td><button onclick='joinRoom("+id+");'>Join</button></td><th>"+rooms[id].roomName+":</th><td>("+totalMembers+"x):</td><td>"+members+"</td></tr>";
            }
            else content += "<tr><th>"+rooms[id].roomName+":</th><td>(In game)</td></tr>";
        }
    }
    
    document.getElementById("existingRooms").innerHTML = content + "</table>";
}

// This method updates the 'rooms' overview, upon the server's request.
socket.on('update rooms', function(rooms){
   updateRooms(rooms);
});

// The following 'screens' refer to div objects that essentially serve
// as screens.
const loginScreen = document.getElementById("login");
const gameScreen = document.getElementById('game');
const pregameScreen = document.getElementById("pregame");
const postgameScreen = document.getElementById('postgame');

// On client startup, only the 'login' screen is to be visible.
postgameScreen.style.display = "none";
pregameScreen.style.display = "none";
gameScreen.style.display = "none";

// These buttons map to 'button' tags that belong the the login
// screen.
const singleButton = document.getElementById("single");
const multiButton = document.getElementById("multi");
const startButton = document.getElementById("start");

// The 'start' button only appears once a player have clicked on the
// multplayer button.
startButton.style.display = "none";

// Even listeners
singleButton.addEventListener('click', newSingleplayer);
multiButton.addEventListener('click', newMultiplayer);
startButton.addEventListener('click', setReady);

//The playerScore 'div' is used to display the the user's score while in game.
const playerScore = document.getElementById('score');
let clientScore = 0;
playerScore.style.display = "none";

// This boolean is used to determine which database relation is to be accessed
// by this client.
let multiplayer = false;

// This boolean is used to ensure that some function don't run when the game
// is not ongoing.
let gameOngoing = false;

// This button initializes a single player game.
function newSingleplayer(){
    multiplayer = false;
    clientScore = 0;
    socket.emit('start singleplayer')
    socket.emit('leave multiplayer');
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    gameScreen.style.display = "grid";
    countdownDisplay.innerText = 3;
    countdown(3);
}

// The 'colourBlock' object is used on the 'pre-game' screen to clarify
// the colour scheme of the player's respective snake is.
const colourBlock = document.createElement('button');
colourBlock.float = "left";

// This method updates the 'colourBlock' object with the players unique
// colour scheme.
socket.on('set colour', (player) => {

    if (player.id == clientId) {
        colourBlock.style.backgroundColor = player.colour;
        colourBlock.style.border = "2px solid";
        colourBlock.style.borderColor = player.borderColour;
        colourBlock.style.color = player.colour;
    }
});

// The 'label' variable is used to provide information at the 'pre-game'
// screen.
const label = document.createElement('label');

// This method initializes a games countdown procedure. It also sets up
// the 'pre-game' screen. 
socket.on('start game', () => {
    multiplayer = true;
    clientScore = 0;
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    let info = document.getElementById("info");
    label.id = "yourColour";
    label.innerHTML = "Your colour is: ";
    label.float = "right";
    colourBlock.innerText = "llllllllllllllllllllllll";
    info.appendChild(label);
    info.appendChild(colourBlock);
    gameScreen.style.display = "grid";
    countdownDisplay.innerText = 3;
    playerScore.style.display = "block";
    countdown(3);
});

// This object is used to update the countdown numbers.
const countdownDisplay = document.getElementById("timer");

// This function runs a loop that blocks the user from playing until the
// countdown has finished.
function countdown(counter){
    if (counter > 0)
        setTimeout(function() { 
            counter--;
            countdownDisplay.innerText = counter;
            countdown(counter);
        }, 1000);
    else {
        countdownDisplay.innerText = "";
        playerScore.style.display = "block";
        pregameScreen.style.display = "none";
        gameOngoing = true;
    }
}

// This refers to an HTML 'div' which is to be used to display the server's
// room overview.
const roomsList = document.getElementById("rooms");

// This game provides the user with an overview of all multiplayer rooms.
function newMultiplayer(){
    roomsList.style.display = "block";
    multiButton.style.display = "none";
    startButton.disabled = true;
    startButton.style.display = "inline-block";
    socket.emit('get rooms');
}

// Clarifies that the user has already pressed the 'Start' button.
const feedback = document.getElementById('feedback');

// Updates the players 'ready' status to true.
function setReady(){
    socket.emit('set ready');
    feedback.innerText = '(Your are ready)';
    socket.emit('update all rooms');
}

// This method updates the game screen's displayed context upon server
// demand.
socket.on('update game', (gameState) => {    
    drawSnakes(gameState);
    drawFood(gameState.food.body[0]);
    showScore(gameState);
});

// Displays the user's own score on the game screen
function showScore(gameState) {
    gameState.players.forEach(player => {
        if(player.id == clientId) {
            clientScore = player.score;
            playerScore.innerText = "Score: " + clientScore;
            return; 
        }
    });
}

// The leaderboard displayed in the post-game screen
const leaderboard = document.getElementById('leaderboard');

// On 'game over' the user is shown the 'post-game' screen.
socket.on('game over', () => {
    gameScreen.innerHTML = "";
    postgameScreen.style.display = "inline-block";
    //fetch(url + '/api/users', {method: 'GET', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(json)});
    if (multiplayer){
        fetch(url+"/leaderboard").then((response) => response.json())
        .then((leaders) => showLeaderboard(leaders));
    }
    else {
        fetch(url+"/singleplayerleaderboard").then((response) => response.json())
        .then((leaders) => showLeaderboard(leaders));
    }
    gameOngoing = false;
});

// This button is shown in the postgame screen to take the user to the login screen
const homeButton = document.getElementById('homeButton');

// Takes the user back to the 'login' screen.
function toHome(){
    socket.emit('leave multiplayer');
    postgameScreen.style.display = "none";
    playerScore.style.display = "none";
    gameScreen.style.display = "none";
    loginScreen.style.display = "block";
    feedback.innerText = "";
    socket.emit('get rooms');

    startButton.style.display = "none";
    startButton.disabled = true;
    startButton.className = "greyedOut";

    multiButton.style.display = "inline-block";
}

// Clears all game screen contents.
socket.on('screen refresh', () => {    
    gameScreen.innerHTML = "";
});

//This div is only visible when the player breaks a record
const newRecordDiv = document.getElementById('newrecord');
newRecordDiv.style.display = "none";

// These variables are used to assist the server in updating the MySQL database.
let leaderboardLength = 0;
let lowest = 0;
let lowestId = 0;

// This method displays the leaderboard for single- or multiplayer games.
// It also checks if the user has "broken" a record.
function showLeaderboard(leaders) {
    leaderboard.innerHTML = "";
    const name = content => `<div>${content}</div>`;
    const score = content => `<div class="scorediv">${content}</div>`;
    leaderboardLength = leaders.length;
    for (var leader in leaders){
        let row = "<div class='leaderrow'>"+name(leaders[leader].name) + score(leaders[leader].score);
        leaderboard.innerHTML += row + "</div>";
    }
    
    if (newRecord(leaders)){
        homeButton.style.display = "none";
        newRecordDiv.style.display = "block";
    }
}

// Checks if the user has broken a record
function newRecord(leaders){
    
    let newRecord = false;
    lowest = 0;

    if (leaders.length >= 5){
        for (var leader in leaders){
      
            if (leaders[leader].score <= leaders[lowest].score){
                lowest = leader;
                lowestId = leaders[lowest].id;
            }
            if (clientScore > leaders[leader].score){
                newRecord = true;
            }
        }
    }
    else {
        newRecord = true;
    }
    return newRecord;
}

// This method handles user inputs and sends it to update the database
// on the server side.
function submitRecord(){
    const newname = document.getElementById('nameInput').value;
    if (newname != ""){
        console.log("lowest id:" + lowestId);
        const leader = {name:newname, score:clientScore, leaderboardlength:leaderboardLength, lowestId:lowestId, multiplayer:multiplayer};
        socket.emit('post to leaderboard', leader);
        homeButton.style.display = "inline-block";
        newRecordDiv.style.display = "none";
    }
    else
        document.getElementById('feedback2').innerText ="Please provide a valid name";
}