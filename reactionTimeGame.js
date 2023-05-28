let attempts = 5;
let allScores = [];
let startTime;
let endTime;
let timeOutId;

let bestScore;
async function getBestScore() {
    const res = await fetch("/getBestScore");
    const data = await res.text();
    bestScore = parseFloat(data);
}

process.env

async function submitScore(score) {
    const res = await fetch("/submitScore", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ bestScore: score })
    });
}

let start = document.getElementById("start");
let box = document.getElementById("box");
let results = document.getElementById("result");
let attemptsMsg = document.getElementById("attempts");
let popup = document.getElementById("popup-bg");
let popupMsg = document.getElementById("final-scores");

attemptsMsg.innerHTML = `<p>Attempts left: ${attempts}<p>`;

start.addEventListener("click", startGame);
box.addEventListener("click", boxClicked);

function startGame() {
    results.innerHTML = "";
    box.style.backgroundColor = "gray";
    timeOutId = setTimeout(() => { 
        box.style.backgroundColor = "lightgreen";
        startTime = new Date();
    }, Math.random() * 3000 + 1000);
}

function boxClicked() {
    
    if (box.style.backgroundColor === "gray") {
        box.style.backgroundColor = "red";
        results.innerHTML = `Please click when the box is green. Click to start to try again.`;
        clearTimeout(timeOutId);
    }
    
    if (box.style.backgroundColor === "lightgreen") {
        endTime = new Date();
        let score = ((endTime - startTime) / 1000).toFixed(3);
        allScores.push(parseFloat(score));

        results.innerHTML = `Your speed was ${score}s<br>Click start to continue.`;
        box.style.backgroundColor = "white";
        attempts--;
        attemptsMsg.innerHTML = `<p>Attempts left: ${attempts}<p>`;

        if (attempts === 0) {
            let avg = ((allScores.reduce((x, y) => x + y)) / 5).toFixed(3);
            let currBestScore = Math.min(...allScores);
            
            if (parseFloat(currBestScore) < parseFloat(bestScore)) {
                gifSearch("very fast", gifUrl => {
                    document.getElementById("gif").src = gifUrl;
                });    
                bestScore = currBestScore;
                popupMsg.innerHTML = `New personal best!<br><br>`;
            } 
            if (parseFloat(currBestScore) > parseFloat(bestScore)) {
                gifSearch("better luck next time", gifUrl => {
                    document.getElementById("gif").src = gifUrl;
                }); 
                popupMsg.innerHTML = `Nice try, but your fastes attempt this round was slower than your best.<br><br>`;
            }

            popupMsg.innerHTML += `Your fastest reaction time for this session was: ${currBestScore}s<br>`;
            popupMsg.innerHTML += `Your average reaction time was: ${avg}s.<br>`;
            document.getElementById("popup-bg").style.display = "block";
            submitScore(currBestScore);
            allScores = [];
            attempts = 5;
            attemptsMsg.innerHTML = `<p>Attempts left: ${attempts}<p>`;
        }
    }
}

document.getElementById("close").addEventListener("click", () => {
    popup.style.display = "none";
});

// APIR
function gifSearch(q, callback) {
    const key = "";
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${q}&limit=10&rating=pg`;

    fetch(url).then(response => response.json())
        .then(data => {
            const rand = Math.floor(Math.random() * data.data.length + 1);
            const gifUrl = data.data[rand].images.original.url;
            callback(gifUrl);
        });
}

getBestScore();