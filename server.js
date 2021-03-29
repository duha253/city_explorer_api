'use strict';


// declaring variable ;
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
require('dotenv').config();

// initialize the server
const server = express();
server.use(cors());

//declaring a port
const PORT = process.env.PORT || 3000;
//API key for locatins
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
//API key for wheather
const WEATHER_CODE_API_KEY = process.env.WEATHER_CODE_API_KEY;

//API key for PARK
const PARK_CODE_API_KEY = process.env.PARK_CODE_API_KEY;

let urlGEO;
let city;

//test the server
//server.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

// routes
server.get('/location', handelLocationRequest);
server.get('/weather', handelWeatheRequest);
server.get('/park', handelParkRequest);



// const locationsRawData = require('./data/location.json');
//console.log(city);

//const searchQuery = req.query;
//console.log(searchQuery);

// const locationsRawData = require('./data/location.json');

/*const location = new Location(locationsRawData[0])
res.send(location);*/

function handelLocationRequest(req, res) {

  const city = req.query.city;
  urlGEO = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${city}&format=json`;

  if (!city) {
    res.status(500).send('Status 500: Sorry, something went wrong');
  }

  console.log(city);

  superAgent.get(urlGEO).then(resData =>{

    const location = new Location( city , resData.bode[0]);
    //console.log(latLonData);
    res.status(200).send(location);
    // res.send(location);

  }).catch((error) => {
    console.log('ERROR', error);
    res.status(500).send('Sorry, something went wrong');
  });


}


/*res.send(weathersData);
const searchQuery = req.query;
console.log(searchQuery);*/
/*  const weathersRawData = require('./data/weather.json');
  const weatherRaw=weathersRawData.data;
    const weathersData = [];
  weatherRaw.forEach(weather => {
    weathersData.push(new Weather(weather));
  });*/


function handelWeatheRequest(req, res) {
  // const weatherRawData = require('./data/weather.json');
  //the other solution is esear
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${WEATHER_CODE_API_KEY}`;
  superAgent.get(url).end(reqData => {
    const myWeatherData = reqData.body.map(weather => {
      return new Weather(weather);
    });

    res.send( myWeatherData);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('there is no data weather');
  });
}



// constructors

function Location( city,data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = data.datetime;

}

server.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});
//test the server
server.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

//error handler
/*server.use('*', (req, res) => {
  let status =404;
  res.status(status).send({status:status , msg:'Not found'});
});*/




// localhost:3010/trails


function handelParkRequest(req, res) {
  const Park_url = `https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=${PARK_CODE_API_KEY}`;
  superAgent.get(Park_url).end(reqData => {
    const myParkData = reqData.body.map(park => {
      return new Park(park);
    });

    res.send(myParkData);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('there is no data park');
  });
}


// constructor function formate the location responed data
function Park(data) {
  this.name = data.name;
  this.address = data.address;
  this.fee = data.fee;
  this.Park_url = data.url;

}
