let fs = require('fs');
let express = require("express");
let app = express();
app.use(express.static('public'));
let request = require("request");
let bodyparser = require("body-parser");
let http = require("http");
var secrets = JSON.parse(fs.readFileSync("secrets.json"));
var markov = JSON.parse(fs.readFileSync("public/markov.json"));
var corpus = JSON.parse(fs.readFileSync("public/corpus.json"));
var messageLength = JSON.parse(fs.readFileSync("public/messageLength.json"));
const PORT = 8081;
const BOT_ID1 = secrets["makerstudio"];
const BOT_ID2 = secrets["botTest"];
const BOTTESTID = secrets["botTestGroupID"];
const MAKERSTUDIOID = secrets[ "makerstudioGroupID"];

var tokens = 1;
var start = Date.now();
var offset = 0;
var time;



function randomInteger(x){
	return Math.floor(Math.random()*x);
}




app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.get("/", function(req, res){
	res.render("public/index.html");
});
  
let server = http.createServer(app).listen(PORT, function() {
	console.log("Bot is live");

});

function timeStuff(){
	time = Date.now() - start - offset;
	if (time > 86400000){
		offset += 86400000;
		tokens += 1;
	}
}

function makeMessage(){
	cumulativeProbability = 0;
	p = Math.random();
	for(var item in corpus){
		if (item != "wordcount") {
			cumulativeProbability += (corpus[item]/corpus["wordcount"]);
		    if (p <= cumulativeProbability) {
		    	console.log()
		       	x = item;
		       	break;
			}
		}
	}

	string = x;
	for(let i = 0; i<messageLength[randomInteger(messageLength.length)]; i++){
		if(markov[x]!=undefined){
			cumulativeProbability = 0;
			p = Math.random();
			for(var item in markov[x]){
				if (item != "wordcount") {
		    		cumulativeProbability += (markov[x][item]/markov[x]["wordcount"]);
		    		if (p <= cumulativeProbability) {
		       			string = string + " " + item;
		       			x = item;
		       			break;
					}
				}

			}
		
		}
		else{
			return string;	
		}
	}
	return string;
}


app.post("/post", (req, res) => {
	timeStuff();
	if(req.body.sender_type !== "bot" && req.body.group_id == MAKERSTUDIOID) {

		words = String(req.body.text).match(/[\w':\-]+/g);
		messageLength.push(words.length);	
		for(i = 0; i<words.length;i++){
			if(i==0 && words[i] in corpus){
				corpus[words[i]] += 1;
				corpus["wordcount"] += 1;
			}
			else if (i==0 && !(words[i] in corpus)) {
				corpus[words[i]] = 1;
				corpus["wordcount"] += 1;
			}
			if (!(words[i] in markov))
				markov[words[i]] = {};
			if(i!=words.length-1){
				if(typeof markov[words[i]][words[i+1]] !== "number"){
					markov[words[i]][words[i+1]] = 1;
				}
				else{
					markov[words[i]][words[i+1]] += 1;
					
				}
				if(typeof markov[words[i]]["wordcount"] !== "number"){
					markov[words[i]]["wordcount"] = 1;
				}
				else{
					markov[words[i]]["wordcount"] += 1;
				}

			}
		}

		string = makeMessage();

		fs.appendFileSync("public/responses.txt", string+"\n"+"\n");
		fs.writeFile("public/markov.json", JSON.stringify(markov), function(err) {if(err) {return console.log(err);}});
		fs.writeFile("public/corpus.json", JSON.stringify(corpus), function(err) {if(err) {return console.log(err);}});		
		fs.writeFile("public/messageLength.json", JSON.stringify(messageLength), function(err) {if(err) {return console.log(err);}});
		fs.writeFile("public/data.txt", "Tokens: " + tokens + "\nStart: " + start + "\nOffset: " + offset + "\nTime: " + time, function(err) {if(err) {return console.log(err);}});

		request.post(
		{
			url: "https://api.groupme.com/v3/bots/post",
			form: {
				"bot_id": BOT_ID2,
				"text": string
			}
		},
		(err, httpResponse, body) => {
			if(err != null) {
				console.log("Error");
				console.log(err);
			}
		});
	}

	if(req.body.group_id == BOTTESTID && req.body.text=="send"){
		request.post(
		{
			url: "https://api.groupme.com/v3/bots/post",
			form: {
				"bot_id": BOT_ID1,
				"text": string
			}
		},
		(err, httpResponse, body) => {
			if(err != null) {
				console.log("Error");
				console.log(err);
			}
		});
	}

	if(req.body.group_id == BOTTESTID && req.body.text=="test"){
		string = makeMessage();
		request.post(
		{
			url: "https://api.groupme.com/v3/bots/post",
			form: {
				"bot_id": BOT_ID2,
				"text": string
			}
		},
		(err, httpResponse, body) => {
			if(err != null) {
				console.log("Error");
				console.log(err);
			}
		});
	}
	
	

	res.end();
});