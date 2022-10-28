const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();


exports.lambdaHandler = async (event) => {
    console.log(event)
    const date = new Date().toISOString().slice(0, 10);
    var tableName = "serverlesspresso-metrics-table"
    for (const record of event.Records) {
        const body = JSON.parse(record.body)
        const orderId = body["detail"]["orderId"]
        const eventId = body["detail"]["eventId"]
        const orderDetails = body["detail"]["drinkOrder"]
      

        var transactParams = {
        TransactItems: [
            {
                Update: {
                    TableName : tableName,
                    Key:{
                        "PK": `Aggregate-${eventId}`,
                        "SK": `${date}#TotalSales`
                    },
                    UpdateExpression: "SET #val = if_not_exists(#val, :initial) + :num",
                    ExpressionAttributeNames: {
                        '#val'   : `val`,
                    },                        
                    ExpressionAttributeValues: {
                        ":num": 1,
                        ":initial": 0,
                    }
                }
            },
            {
                Update: {
                    TableName : tableName,
                    Key:{
                        "PK": `Aggregate-${eventId}`,
                        "SK": `${date}#${orderDetails["drink"]}`
                    },
                    UpdateExpression: "SET #val = if_not_exists(#val, :initial) + :num",
                    ExpressionAttributeNames: {
                        '#val'   : `val`,
                    },
                    ExpressionAttributeValues: {
                        ":num": 1,
                        ":initial": 0,
                    }
                }
            }
        ]
    }
    try {
        await docClient.transactWrite(transactParams).promise()
    }
    catch(e) {
        console.log(e)
        throw new Error(e.message)
    }
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify('Executed Publish Metrics'),
    };
    return response;
};
