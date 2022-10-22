import * as dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import fetch from 'cross-fetch'
dotenv.config()

const db = new sqlite3.Database('./db')

const FA_API_KEY=process.env.FA_API_KEY

const FA_SERVER='https://aeroapi.flightaware.com/aeroapi'

const main = async () => {
    const positions = await getFlightData()
    console.log(`found ${positions.length} positions`)
    // console.log(JSON.stringify(positions, null, 2))
    // Store them in the DB
}

const getFlightData = async () => {
    // Top left 47.930625, -122.818466
    // Bottom right 47.247207, -122.016924
    // Pull FA positions from the api
    // Gotta do {range lon 47 48} {range lat -122 -123}
    // https://aeroapi.flightaware.com/aeroapi/flights/search/positions?query=%7B%3C+alt+500%7D+%7Brange+lon+47+48%7D+%7Brange+lat+-123+-122%7D" \
    // https://aeroapi.flightaware.com/aeroapi/flights/search/positions?query=%7B%3C+alt+500%7D+%7Brange+lon+47+48%7D+%7Brange+lat+-123+-122%7D
    // -H "Accept: application/json; charset=UTF-8" \
    // -H "x-apikey:  FA_API_KEY" \

    let done = false
    let url = ''
    let positions = []
    while (!done) {
        if (!url) {
            const lastMinute = Math.floor(new Date().valueOf() / 1000 - 60)
            const rtQuery = {
                query: `{< alt 500} {range lon -123 -122} {range lat 47 48} {> clock ${lastMinute}}`,
                unique_flights: true
            }
            const qs = new URLSearchParams(rtQuery)
            url = `${FA_SERVER}/flights/search/positions?${qs.toString()}`
        }
        console.log(url)
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