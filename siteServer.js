const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

require("dotenv").config({ path: path.resolve(__dirname, "credentials/.env") })

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const col = process.env.MONGO_COLLECTION;
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${userName}:${password}@cluster0.9bpwuje.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: 
    true, serverApi: ServerApiVersion.v1 });

app.use(express.static(__dirname));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: "super secret secret, shhhh",
    resave: false, 
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});

app.get("/login", (req, res) => {
    res.redirect("/");
});


app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/signup.html");
});


app.post("/login", async (req, res) => {
    let filter = {username: req.body.username, password: req.body.password};
    await client.connect();
    const result = await client.db(dbName).collection(col).findOne(filter);
    await client.close();

    if (result) {
        req.session.user = req.body.username;
        res.redirect("/game");
    } else {
        res.send(`<p>The username or password is incorret. Please try again.</p>`)
    }
});


app.post("/signup", async (req, res) => {

    if (req.body.password != req.body.confirmPassword) {
        res.send(`<p>Passwords do not match, please try again.</p>`);
    } else {
        let filter = {username: req.body.username};
        await client.connect();
        const result = await client.db(dbName).collection(col).findOne(filter);
        await client.close();
        
        if (result) {
            res.send(`<p>This username already exists, please try another username.</p>`);
        } else {
            await client.connect();
            await client.db(dbName).collection(col).insertOne({username: req.body.username, 
            password: req.body.password, score: 1000000});
            await client.close();
            req.session.user = req.body.username;
            res.redirect("/game");
        }
    }
});


app.get("/signout", async (req, res) => {
    req.session.destroy(err => {
        if (err) { 
            res.send(`<h1>Looks like there was an error signing out.</h1>`)
        } else {
            res.redirect("/");
        } 
    });
});


app.get("/game", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/login");
    }
    let filter = {username: req.session.user};
    await client.connect();
    let currUser = await client.db(dbName).collection(col).findOne(filter);
    await client.close();

    let variables = {username: `<p>User: ${req.session.user}<br>Personal best: ${currUser.score} seconds</p>`};
    res.render("home", variables);
});


app.get("/getBestScore", async (req, res) => {
    if (!req.session.user) {
        res.send(`<h1>Looks like there was a problem.</h1>`);
    }

    let filter = {username: req.session.user};
    await client.connect();
    let currUser = await client.db(dbName).collection(col).findOne(filter);
    await client.close();

    res.send(currUser.score.toString());
});


app.post("/submitScore", async (req, res) => {
    const newScore = req.body.bestScore;
    
    if (req.session.user) {
        let filter = {username: req.session.user};

        await client.connect();
        let curr = await client.db(dbName).collection(col).findOne(filter);
        
        let scoreUpdate = {score: newScore};
        if (parseFloat(curr.score) < parseFloat(newScore)) {
            scoreUpdate = {score: curr.score};
        }
        let update = {$set: scoreUpdate};
        await client.db(dbName).collection(col).updateOne(filter, update);
        await client.close();
    }

    res.redirect("/game");
});


app.get("/leaderboard", async (req, res) => {
    if (!req.session.user) {
        res.redirect("/login");
    }
    
    let table = `<table> <tr> <th>Place</th> <th>Name</th> <th>Score</th> </tr>`;

    await client.connect();
    let filter = {};
    const cursor = client.db(dbName).collection(col).find(filter);
    const entries = await cursor.toArray();
    let sorted = entries.sort((x, y) => parseFloat(x.score) - parseFloat(y.score));
    let counter = 1;
    sorted.forEach((e) => {
        table += `<tr><td>${counter}</td><td>${e.username}</td><td>${e.score}s</td></tr>`;
        counter++;
    });
    table += `</table>`;

    variables = {leaderBoardTable: table};

    res.render("leaderboard", variables);
});

app.listen(3000, (err) => {
    let msg = `Web server started and running at http://localhost:3000`;
    msg = err? "Start server failed" : msg;

    console.log(msg);
});