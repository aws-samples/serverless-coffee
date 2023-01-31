import {
  Aws,
  Duration,
  Stack,
  StackProps,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  aws_logs as logs,
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
  aws_dynamodb as dynamodb,
  aws_sqs as sqs,
  CfnOutput,
} from "aws-cdk-lib";
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export class WaitTimesStack extends Stack {

  public readonly busName = "Serverlesspresso";
  public readonly source = "awsserverlessda.serverlesspresso";
  public readonly detailTypeSubmitted = "OrderManager.WaitingCompletion";
  public readonly detailTypeCompleted = "OrderProcessor.orderFinished";
  public readonly detailTypeAverageTime = "OrderManager.DrinkAverageTime";
  public readonly nbItemsForAverage = "10";
  


  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const eventBridgeBus = events.EventBus.fromEventBusName(this, 'eventBus', this.busName);

    const ruleOrderSubmitted = new events.Rule(this, 'RuleSubmitted', {
      eventPattern: {
        source: [this.source],
        detailType: [this.detailTypeSubmitted],
      },
      eventBus: eventBridgeBus
    });

    const ruleOrderCompleted = new events.Rule(this, 'RuleCompleted', {
      eventPattern: {
        source: [this.source],
        detailType: [this.detailTypeCompleted],
      },
      eventBus: eventBridgeBus
    });



    const orderDurationTable = new dynamodb.Table(this, 'OrderDurationTable', {
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });


    orderDurationTable.addGlobalSecondaryIndex({
      indexName: "drinkIndex",
      partitionKey: {
        name: "drink",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });


    const saveSubmittedTime = new tasks.DynamoPutItem(this, 'Save Order Submitted Time', {
      item: {
        orderId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.detail.orderId')),
        drink: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.detail.drinkOrder.drink')),
        drink_order_submitted: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.time')),
      },
      table: orderDurationTable,
    });

    const saveCompletedTime = new tasks.DynamoUpdateItem(this, 'Save Order Completed Time', {
      key: {
        orderId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.detail.orderId')),
      },
      table: orderDurationTable,
      expressionAttributeValues: {
        ':drink_order_completed': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.time')),
      },
      updateExpression: 'SET drink_order_completed = :drink_order_completed',
      resultPath: sfn.JsonPath.DISCARD
    });


    const calculateAvgFunction = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/average'),
      environment: {
        TABLE_NAME: orderDurationTable.tableName,
        GSI_NAME: "drinkIndex",
        NB_ITEMS: this.nbItemsForAverage,
        SOURCE: this.source
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    orderDurationTable.grantReadData(calculateAvgFunction);

    const calculateAverageTime = new LambdaInvoke(this, 'Calculate Average Time', {
      lambdaFunction: calculateAvgFunction,
      invocationType: tasks.LambdaInvocationType.REQUEST_RESPONSE,
      resultSelector: { "result.$": "$.Payload" },
      outputPath: "$.result",

    });

    const emitEvent = new tasks.EventBridgePutEvents(this, 'Emit event', {
      entries: [{
        detail: sfn.TaskInput.fromObject({
          drink: sfn.JsonPath.stringAt('$.drink'),
          duration: sfn.JsonPath.stringAt('$.averageDuration'),
          eventId: sfn.JsonPath.stringAt('$.eventId'),
        }),
        eventBus: eventBridgeBus,
        detailType: this.detailTypeAverageTime,
        source: sfn.JsonPath.stringAt('$.source')
      }],
    });


    const choice = new sfn.Choice(this, "Drink Order Submitted or Completed ?")
      .when(
        sfn.Condition.stringEquals("$.detail-type", this.detailTypeSubmitted),
        saveSubmittedTime
      )
      .when(
        sfn.Condition.stringEquals("$.detail-type", this.detailTypeCompleted),
        saveCompletedTime.next(calculateAverageTime).next(emitEvent)
      );


    const durationSF = new sfn.StateMachine(this, "Duration",
      {
        definition: choice,
        tracingEnabled : true
      }
    );

    ruleOrderSubmitted.addTarget(new targets.SfnStateMachine(durationSF));
    ruleOrderCompleted.addTarget(new targets.SfnStateMachine(durationSF));

    new CfnOutput(this, 'StepFunctionName', { value: durationSF.stateMachineName });
    new CfnOutput(this, 'LambdaFunctionName', { value: calculateAvgFunction.functionName });
    new CfnOutput(this, 'DynamoDBTableName', { value: orderDurationTable.tableName }); 


  }
}
