/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const eventbridge = new AWS.EventBridge()

const { nanoid } = require('nanoid')
const axios = require('axios')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const putOrder = require('./put.js')

const userId = 'robot'

exports.handler = async (event) => {

  if (process.env.maxOrders < 1 || process.env.maxOrders > 10) {
    return 'Error: maxOrders must be 1-10.'
  }

  const orderIds = Array.from({length: process.env.maxOrders}, () => nanoid())
  console.log(orderIds)

  // Load menu
  const result = await axios({method: 'get', url: `${process.env.ConfigURL}/config`})
  const item = result.data.filter((item) => (item.topic === "menu"))
  const menu = item[0]

  // Step 1 - Send Validator.NewOrder event (simulates QR code scan)
  const params = { Entries: [] }

  orderIds.map((orderId) => {
    params.Entries.push({
      Detail: JSON.stringify({
        orderId,
        userId,
        robot: true,
        bucket: {}
      }),
      DetailType: 'Validator.NewOrder',
      EventBusName: process.env.BusName,
      Source: process.env.Source,
      Time: new Date
    })
  })

  const response = await eventbridge.putEvents(params).promise()
  console.log('EventBridge putEvents:', response)

  // Step 2 - Wait
  await delay(5000)

  // Step 3 - Submit drink order
  await Promise.all(orderIds.map(async (orderId) => {

    // Get random drink from menu
    const drinksMax = menu.value.length
    const randomDrink = menu.value[parseInt(Math.random()*drinksMax)]
    let randomDrinkModifiers = (randomDrink.modifiers.map((modifier) => (modifier.Options[parseInt(Math.random()*modifier.Options.length)])))
    console.log(randomDrink.drink, randomDrinkModifiers)

    let event = {
      orderId,
      userId,
      body: {
        drink: randomDrink.drink,
        modifiers: randomDrinkModifiers,
        icon: randomDrink.icon
      }
    }

    console.log(event)
    await putOrder.handler(event)
  }))
}