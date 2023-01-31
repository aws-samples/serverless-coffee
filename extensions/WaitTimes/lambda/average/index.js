const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const getDrinkByOrderId = async (orderId) => {
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: {
            orderId: orderId,
        },
    };

    console.log('getDrinkByOrderId params: ', params)

    try {
        const result = await dynamoDb.get(params).promise();
        console.log('result: ', result.Item)
        return result.Item.drink;
    } catch (err) {
        console.error('getItem error: ', err)
    }
}

const getAllOrderByDrink = async (drink) => {
    const params = {
        TableName: process.env.TABLE_NAME,
        IndexName: process.env.GSI_NAME,
        KeyConditionExpression: 'drink = :drink',
        ExpressionAttributeValues: {
            ':drink': drink,
        },
        FilterExpression: 'attribute_exists(drink_order_completed)',
        ProjectionExpression: 'orderId, drink, drink_order_submitted, drink_order_completed',
    };

    console.log('getDrinkByOrderId params: ', params)

    try {
        const result = await dynamoDb.query(params).promise();
        return result.Items;
    } catch (err) {
        console.error('getItem error: ', err)
    }
}

const calculateAverageTimes = (orders, resultsNb) => {

    // Sort the results by drink_order_completed in descending order
    orders.sort((a, b) => new Date(b.drink_order_completed) - new Date(a.drink_order_completed));

    // Get the most 10 recent items
    const mostRecentItems = orders.slice(0, resultsNb);

    // Calculate the total duration of the most 10 recent items
    let totalDuration = 0;
    for (let item of mostRecentItems) {
        const submitted = new Date(item.drink_order_submitted);
        const completed = new Date(item.drink_order_completed);
        totalDuration += completed - submitted;
    }

    // Calculate the average duration of the most 10 recent items
    const averageDuration = totalDuration / mostRecentItems.length / 1000;
    console.log('Average duration (seconds):', averageDuration);
    return averageDuration;

}


exports.handler = async (event, context) => {
    console.log('event', JSON.stringify(event));
    const drink = await getDrinkByOrderId(event.detail.orderId);
    console.log('drink', drink);
    const orders = await getAllOrderByDrink(drink);
    console.log('orders', JSON.stringify(orders)); 
    const duration = calculateAverageTimes(orders, parseInt(process.env.NB_ITEMS));
    console.log("duration", duration);
    const response = {
        drink: drink,
        averageDuration: duration,
        source: process.env.SOURCE,
        eventId: event.detail.eventId
    };
    console.log('response', JSON.stringify(response));
    return response;
};
