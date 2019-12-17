var express = require('express');
var fetch = require('node-fetch');
var redis = require('redis');

var PORT = process.env.PORT || 3000;
var REDIS_PORT = process.env.REDIS_PORT || 6379;

// var client = redis.createClient(REDIS_PORT);

//this is my trial account credentials 
var client = redis.createClient({
  host: 'redis-12194.c93.us-east-1-3.ec2.cloud.redislabs.com',
  port: 12194,
  password: 'WwcrwB4yFbu7FhCOF7CDAMPD6NqVqw0l'
});
var app = express();

app.use(express.json());

function setResponse(username, repos){
  return `<h1> ${username} has ${repos} repositories on Github </h1>`;
}

// middleware for caching
function cache(req, res, next){
  var username = req.params.username;
  client.get(username, function(err, data){
    if(err){
      throw err;
    }
    if(data !== null){
      console.log('sending response from redis cache');
      res.send(setResponse(username, data));
    } else {
      next();
    }
  })
}

app.get('/repos/:username', cache, function(req, res, next){
  console.log('Fetching data...');
  var username = req.params.username;
  fetch(`https://api.github.com/users/${username}`)
  .then(function(data){
    return data.json();
  })
  .then(function(data){
    console.log(data);
    var repos = data.public_repos;
    client.setex(username, 3600, repos);
    res.send(setResponse(username, repos));
  })
  .catch(function(err){
    res.status(400).json(err);
  })
});

app.listen(PORT, () => {
  console.log(`App listening on PORT ${PORT}...`);
});