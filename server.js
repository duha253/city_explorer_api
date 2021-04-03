'use strict';


// declaring variable ;
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
require('dotenv').config();
const pg = require('pg');


// initialize the server
const app = express();
app.use(cors());

//declaring a port
const PORT = process.env.PORT || 3000; //API key for locatins
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY; //API key for wheather
const WEATHER_CODE_API_KEY = process.env.WEATHER_CODE_API_KEY; //API key for PARK
const PARK_CODE_API_KEY = process.env.PARK_CODE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;//database
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;


//let city;
//test the server
//server.listen(PORT, () => console.log(`Listening to Port ${PO
// Database Connection Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect().then(() => {
  console.log('Runnnnnnnnnn');
  app.listen(process.env.PORT || PORT, () => {
    console.log('Server Start at ' + PORT + ' .... ');
  })

});

// routes
app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatheRequest);
app.get('/parks', handelParkRequest);
app.get('/movies', handleMoviesRequest);
app.get('/yelp', handleYelpRequest);



// localhost:3000/location?city = amman  // function to get location data
function handelLocationRequest(req, res) {
  const searchQuery = req.query.city;
  //const urlGEO = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${city}&format=json`;
  const urlGEO = `https://us1.locationiq.com/v1/search.php`;
  const query = {
    key: GEO_CODE_API_KEY,
    city: searchQuery,
    format: 'json'
  };
  if (!searchQuery) { //for empty req
    res.status(500).send('Status 500: Sorry, something went wrong');
  }

  // Get everything in the database
  //let sqlQuery = `SELECT * FROM location WHERE search_query=$1;`;
  const sqlQuery = `SELECT * FROM locations`;
  client.query(sqlQuery).then(result => {
    // console.log(result.rows[0].search_query);
    let sqlChecker = false;
    result.rows.forEach(entry => {
      if (entry.search_query === searchQuery) {
        sqlChecker = true;
        console.log('from data base');
        res.status(200).send(entry);
      }
    });
    if (!sqlChecker) {
      console.log('new entry');
      //console.log(city);
      superAgent.get(urlGEO).query(query).then(resData => {
        const location = new Location(searchQuery, resData.body[0]);
        ////// Insert to table
        const safeValues = Object.values(location);
        const sqlQuery = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
        client.query(sqlQuery, safeValues).then(result => {
          res.status(200).json(result);
        }).catch(error => {
          console.log('error', error);
          res.status(500).send('internal server error');
        });

        res.status(200).send(location);
      }).catch((error) => {
        console.log('error', error);
        res.status(500).send('there is something wrong');
      });
    }
  }).catch(error => {
    console.log('error', error);
    res.status(500).send('internal error');
  });

}

// localhost:3000/weather?search_query=amman  //// function to get weather data
function handelWeatheRequest(req, res) {
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?`;
  const queryObj = {
    lat: req.query.latitude,
    lon: req.query.longitude,
    key: WEATHER_CODE_API_KEY,
  };

  superAgent.get(url).query(queryObj).then(reqData => {
    const myWeatherData = reqData.body.data.map(weather => {
      return new Weather(weather);
    });

    res.send(myWeatherData);
  }).catch((error) => {
    console.error('ERROR', error);
    res.status(500).send('there is no data weather');
  });
}

// localhost:3000/Park // function to get park data
function handelParkRequest(req, res) {
  const ParkUrl = `https://developer.nps.gov/api/v1/parks?q=${req.query.search_query}&api_key=${PARK_CODE_API_KEY}&limit=10`;
  superAgent.get(ParkUrl).then(reqData => {
    const myParkData = reqData.body.data.map(park => {
      return new Park(park);
    });

    res.send(myParkData);
  }).catch((error) => {
    console.error('ERROR', error);
    req.status(500).send('there is no data park');
  });
}
//movies
function handleMoviesRequest(req, res) {
  const searchQuery = req.query.search_query;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${searchQuery}&page=1&sort_by=popularity.desc&include_adult=false`;

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superAgent.get(url).then(resData => {
    const moviesData = resData.body.results.map(movie => {
      return new Movie(movie);
    });
    res.status(200).send(moviesData);
  }).catch(error => {
    console.log('error', error);
    res.status(500).send('there is an error ');
  });
}
//yelp
function handleYelpRequest(req, res) {
  const searchQuery = req.query.search_query;
  const yelpOffset = req.query.page * 5 - 5;
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=${searchQuery}&limit=5&offset=${yelpOffset}`;

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superAgent.get(url).set(`Authorization`, `Bearer ${YELP_API_KEY}`).then(resData => {
    const yelpData = resData.body.businesses.map(business => {
      return new Yelp(business);
    });
    res.status(200).send(yelpData);
  }).catch(e => {
    console.log('error');
    res.status(500).send(' no restaurants listed in this area!!!!');
  });
}
// constructors
function Location(searchQuery, data) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = data.datetime;
}
// constructor function formate the park responed data
function Park(data) {
  this.name = data.name;
  this.description = data.description;
  this.address = `${data.addresses[0].linel} ${data.addresses[0].city} ${data.addresses[0].linel} ${data.addresses[0].statecode}  ${data.addresses[0].postalcode}  `;
  this.fee = data.fees[0] || '0.00';
  this.Park_url = data.url;
}
// constructor function formate the Movies responed data
function Movie(data) {
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
}
// constructor function formate the yalp responed data
function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}

// Error Handler Routes
app.use('*', notFoundHandler);
function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}




