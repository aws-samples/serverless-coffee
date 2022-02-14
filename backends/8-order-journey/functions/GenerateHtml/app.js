const fs = require('fs');
let FriendlyDetail=''
let FriendlyTime=''
let Message =''

exports.lambdaHandler = async (event, context) => {
    
    const endTime= event.time
    const dbEvent = event.dbResults
    const orderId = event.orderId
    const fileName ='123456789.html'

    let html=["<head><link rel='stylesheet' type='text/css' href='https://serverlesspresso-order-journey-journeybucket-1lc9wg7eac1f4.s3.us-west-2.amazonaws.com/assets/css/style.css'>",
    "<link rel='stylesheet' type='text/css' href='https://serverlesspresso-order-journey-journeybucket-1lc9wg7eac1f4.s3.us-west-2.amazonaws.com/assets/css/fa.css'>",
    "<style>p{font-size:20px !important;} img{width:100%:} </style></head>",
    "<body>",
    "<div style='text-align:center'>",
    "<a href='https://order.serverlesscoffee.com'><img src='https://da-public-assets.s3.amazonaws.com/serverlesspresso/images/serverlesspresso-large.png'></a>",
    "</div>",
    "<section style='padding:20px;'><p style='font-size:45px !important;'>Your order was orchestrated by this AWS Step Functions workflow:<br><img src='https://da-public-assets.s3.amazonaws.com/serverlesspresso/images/"+choosegraph(dbEvent.Items)+"'><p></section>",       
    "<section style='padding:20px;'><h2 style='font-size:45px !important;'>Events:</h2><p style='font-size:45px !important;'>These are the events that choreographed the order:</p></section>",       
    
    "<section class='cd-timeline js-cd-timeline'>",
    "<div class='container max-width-lg cd-timeline__container'>"]
                    

    for(let i=0 ; i<dbEvent.Count; i++){
        let item = dbEvent.Items[i]
        let eventDetails = JSON.parse(item.orderDetails.S)

        html.push([
                        "<div class='cd-timeline__block'>",
                            "<div class='cd-timeline__img cd-timeline__img--picture'>",
                            "<img src='https://serverlesspresso-order-journey-journeybucket-1lc9wg7eac1f4.s3.us-west-2.amazonaws.com/assets/img/cd-icon-picture.svg' alt='Picture'>",
                            "</div> <!-- cd-timeline__img -->",
                                "<div class='cd-timeline__content text-component'>",
                                "<h2 style='font-size:65px !important;'>"+parseDetail(item.detailType.S)+"</h2>",
                                "<p style='font-size:45px !important;' class='color-contrast-medium'>"+parseMessage(eventDetails.Message)+"</p>",
                                "<p><img style='width:100%;' src='https://da-public-assets.s3.amazonaws.com/serverlesspresso/images/"+item.detailType.S.replace('.','')+".png'></p>",
                                "<div class='flex justify-between items-center'>",
                                        "<span class='cd-timeline__date'><h2 style='font-size:65px !important;'>"+parseTime(item.SK.S)+"</h2></span>",
                                    "</div>",
                            "</div> <!-- cd-timeline__content -->",
                        "</div> <!-- cd-timeline__block -->"
        ].join(' ')
        )
        console.log(eventDetails)
    }

 let html2 =[ 
                "<div class='cd-timeline__block'>",
                    "<!-- ... -->",
                "</div> <!-- cd-timeline__block -->",
                "</div>",
                "<div style='text-align:center'>",
                "<a style='width:50% !important; padding:15px; font-size:60px;' data-size='large' href='https://twitter.com/intent/tweet?text=I%20Just%20ordered%20a%20coffee%20using sererlesspresso!%20&url=https://d2hk76v3b9g9lc.cloudfront.net/"+orderId+".html&hashtags=serverlesspresso,AWSreInvent&related=AWSreInvent' class='twitter-share-button btn btn--subtle'> Share </a>",
                "</div>",
                "</section> <!-- cd-timeline -->",
                
                "<script src='https://serverlesspresso-order-journey-journeybucket-1lc9wg7eac1f4.s3.us-west-2.amazonaws.com/assets/js/main.js'></script></body>"
                ].join(' ')
           
    const finalHtml = html.concat(html2);
    const a = {'html':finalHtml.join(' '),'fileName':dbEvent.Items[0].PK.S+'.html'}

    //const outParams = {
    //    Bucket: process.env.s3Bucket,
    //    Key: event.Items[0].PK.S+'.html',
    //    ContentType: 'text/html',
    //    Body: finalHtml.join(' '),
   // }
    //console.log('outParams', outParams)
   // return await s3.putObject(outParams).promise()
   console.log(a)
   return a
};

function parseMessage(message){
    return message
}

function parseDetail(detail){
    FriendlyDetail=''
    let FriendlyDetailArray = detail.split('.')
    FriendlyDetail=FriendlyDetailArray[1]
    return FriendlyDetail
}

function parseTime(time){
    FriendlyTime=''
    let FriendlyTimeArray = time.split('T')
    FriendlyTime=FriendlyTimeArray[1].replace('Z\"','')
    return FriendlyTime
}

function choosegraph(items){
    console.log(items[items.length-1])
    if(items[items.length-1].detailType.S ==='OrderManager.OrderCancelled'){
        return 'order_processor_cancellation.png'
    }
    return 'stepfunctions_graph_success.png'
}