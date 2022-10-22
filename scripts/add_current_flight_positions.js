import * as dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import fetch from 'cross-fetch'
import chalk from 'chalk'
dotenv.config()

const db = new sqlite3.Database('./flights.db')

const FA_API_KEY=process.env.FA_API_KEY

const FA_SERVER='https://aeroapi.flightaware.com/aeroapi'

const args = process.argv.slice(2)
const intensity = args[0] ? parseInt(args[0]) || 1 : 1

const main = async () => {
    prepareDatabase()
    const flights = await getFlightData()
    console.log(chalk.yellow(`Found ${flights.length} flights`))
    // Store them in the DB
    insertIntoDatabase(flights)
}

const insertIntoDatabase = (flights) => {
    const columns = Object.keys(flights[0])
    const values = flights.map((flight) => {
        const vs = columns.map((c) => typeof flight[c] == 'number' ? flight[c] : `'${flight[c]}'`)
        vs.push(intensity)
        return `(${vs.join(',')})`
    })
    // Include intensity
    columns.push('intensity')

    const insertSQL = `INSERT INTO flights(${columns.join(',')})
    VALUES ${values.join(',')};`
    db.run(insertSQL)
    console.log(chalk.blue(`Inserted ${values.length} records`))
}

const prepareDatabase = () => {
    db.run(`CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY,
        fa_flight_id TEXT NOT NULL,
        altitude INTEGER NOT NULL,
        altitude_change TEXT NOT NULL,
        groundspeed INTEGER NOT NULL,
        heading INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL,
        update_type TEXT NOT NULL,
        intensity INTEGER NOT NULL
    );`);

}

const getFlightData = async () => {
    // Top left 47.930625, -122.818466
    // Bottom right 47.247207, -122.016924
    // Pull FA positions from the api
    let done = false
    let url = ''
    let positions = []
    while (!done) {
        if (!url) {
            const lastMinute = Math.floor(new Date().valueOf() / 1000 - 60)
            const rtQuery = {
                query: `{< alt 500} {range lon -123 -121} {range lat 47 48} {> clock ${lastMinute}}`,
                unique_flights: true
            }
            const qs = new URLSearchParams(rtQuery)
            url = `${FA_SERVER}/flights/search/positions?${qs.toString()}`
        }
        console.log(chalk.yellow(url))
        const result = await fetch(url, {
            headers: {
                'x-apikey': FA_API_KEY,
                'Accept': 'application/json; charset=UTF-8'
            }
        })
        const flights = await result.json()
        positions.push(...flights.positions)
        if (flights.links && flights.links.next) {
            url = `${FA_SERVER}${flights.links.next}`
        } else {
            done = true
        }
    }
    return positions
}

main()