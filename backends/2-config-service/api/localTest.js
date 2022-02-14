// Mock event
const event = require('./test/putStore.json')

// Mock environment variables
process.env.AWS_REGION = 'us-west-2'
process.env.localTest = true
process.env.TableName = 'serverlesspresso-config-service-uswest2-DynamoTable-2RFG3E5CSG3L'
process.env.EventBusName = 'Serverlesspresso'
process.env.Source = 'awsserverlessda.serverlesspresso'

// Lambda handler
const { handler } = require('./putStore.js')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))