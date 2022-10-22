import sqlite3 from 'sqlite3'
import express from 'express'
const app = express()
const port = 3000

import util from 'util'

const db = new sqlite3.Database('./flights.db')
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

app.set('view engine', 'pug')

app.get('/', (req, res) => {
    const flightsArray = []
    db.each("SELECT * FROM flights", (err, row) => {
        flightsArray.push({lat: row.latitude, lng: row.longitude, weight: row.intensity || 1})
    }, () => {
        res.render('index', { 
            key: GOOGLE_API_KEY,
            title: 'Hey',
            flightsArray,
            message: 'Hello there!'
        })
    });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})