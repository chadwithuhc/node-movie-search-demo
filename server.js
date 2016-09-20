var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
// Err: Body Parser was not imported
var bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

// Err: Since we are already using `express.static()` on line 8, we do not need to define here as well
//app.use('/', express.static(path.join(__dirname, 'public'));

app.get('/favorites', function(req, res) {
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
}); // Err: missing closing curly brace and parenthesis

// Err: Should be a POST request, and should be '/favorites'
app.post('/favorites', function(req, res){
  if(!req.body.imdbID) { // Err: Updated property names to match API
    res.status(400).json({ message: 'Invalid data sent' }); // Err: should be sending a 400 error with message details
    return
  } // Err: missing closing curly brace
  
  var data = JSON.parse(fs.readFileSync('./data.json'));
  data.push(req.body);
  fs.writeFile('./data.json', JSON.stringify(data));
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Err: should be `listen` instead of `list`
app.listen(process.env.PORT || 3000, function(){
  console.log("Listening on port " + process.env.PORT || 3000);
});