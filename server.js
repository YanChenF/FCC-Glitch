'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {
  useMongoClient: true,
  /* other options */
}, err => {
  if(err) console.log(err);
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

//configure mongoose model
var shortUrlSchema = new Schema({url: {type: String, unique : true, required : true, dropDups: true}, shortUrl: Number});
var ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

var urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
app.post('/api/shorturl/new', function(req, res, next) {
  const url = req.body.url;
  //console.log(url);
  if(urlRegex.test(url)) {
    //console.log('url matched!');
    ShortUrl.find({}, (err, data) => {
      if(err) return next(err);
      if(!data) {
        ShortUrl.create({url, shortUrl: 1}, (err, newShortUrl) => {
          if(err) return next(err);
          console.log(newShortUrl);
          res.json({origin_url: newShortUrl.url, short_url: newShortUrl.shortUrl});
        });
      } else {
        ShortUrl.find({}, (err, data) => {
          if(err) {console.log('err', err); return next(err);}
          console.log('there are %d kittens', data);
          ShortUrl.create({url, shortUrl: data.length + 1}, (err, newShortUrl) => {
            if(err) return next(err);
            console.log(newShortUrl);
            res.json({origin_url: newShortUrl.url, short_url: newShortUrl.shortUrl});
          });
        }); 
      }
    });  

  } else {
    res.statusCode = 401;
    res.json({error: 'invalid URL'});
  }
});

app.get('/api/shorturl/:shortURL', (req, res, next) => {
  const shortURL = req.params.shortURL;
  ShortUrl.findOne({shortUrl: Number(shortURL)}, (err, short) => {
    if(err) return next(err);
    res.redirect(short.url);
  })
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({err: err.message});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});