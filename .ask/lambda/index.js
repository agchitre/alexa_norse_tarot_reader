// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter'); // included in ask-sdk
const ddbTableName = 'tarot-session-handler';
const AWS = require("aws-sdk");
const tarots = require('./tarots');
const facts = require('./facts');
const tarot_img = require('./tarot_img');
const IMG_URLS = {
    "LaunchImg": "https://cdn.pixabay.com/photo/2019/08/22/10/29/fantasy-4423131_1280.jpg",
    "ReadTarotImg": "https://triviabucket123.s3.amazonaws.com/magician-3600687_1280.jpeg",
    "LaunchImgTitle": "Norse Tarot Reader",
    "ReadImgTitle": "",
    "FallBackImg": "https://cdn.pixabay.com/photo/2017/07/22/22/02/fantasy-2530043_1280.jpg",
    "ISPImg": "https://cdn.pixabay.com/photo/2018/05/10/00/42/odin-3386579_1280.png"
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

        const {attributesManager} = handlerInput;
        const attributes = await attributesManager.getPersistentAttributes();
        console.log(`attributes(before save): ${JSON.stringify(attributes)}`);
        //const userId = handlerInput.requestEnvelope.session.user.userId;
        //console.log(`attributes(before save): ${userId}`);
        
        const audio = "soundbank://soundlibrary/horror/horror_01";
        const ssml = "Welcome to the kingdom of Asgard <break time='1s'/> I am the seer from halls of valhalla <break time='1s'/> Say reveal, to know what your future holds";
        /*   if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./launch.json'),
                  datasources: {
                    "norseTarotData": {
                      "properties": {
                        "image": IMG_URLS['LaunchImg'],
                        "title": IMG_URLS['LaunchImgTitle']
                      }
                    }
                  }
              });
          }*/
        
          if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./launch_lottie.json'),
              });
          }

        return handlerInput.responseBuilder
        .addDirective({
            type: "Alexa.Presentation.APLA.RenderDocument",
            token: "audioText",
            document: require('./APLAAudio.json'),
            "datasources": {
                "myData": {
                    "ssml": ssml,
                    "audio": audio
                }
            }
        })
            .reprompt()
            .getResponse();
    }
};


const ReadTarotIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReadTarotIntent'
            
            || (handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
            && handlerInput.requestEnvelope.request.arguments.length > 0
            && handlerInput.requestEnvelope.request.arguments[0] === 'reveal');
            
    },
    handle(handlerInput) {

        // *** add this line ***
        let randomCard = Math.floor(Math.random() * tarots.length);
        const tarotCard = tarots[randomCard];
        const tarotImg = tarot_img[randomCard];
       //const speakOutput = `Let me roll the runes for you. O Freya. Tell this human their fortune. The gods have picked ${tarotCard}. Thank the Gods and go in peace my child.`;
        const ssml = `The gods have picked ${tarotCard}. Thank the Gods and go in peace`;
        const repromptText = `<speak><voice name='Matthew'><lang xml:lang='en-US'>Say reveal to ask the gods for another card, or ask me for a norse fact</lang></voice></speak>`

           if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./APL_readme_animated.json'),
                  datasources: {
                    "norseTarotData": {
                      "properties": {
                        "image": tarotImg,
                        "title": IMG_URLS['ReadImgTitle'],
                        "cardNumber": randomCard
                      }
                    }
                  }
              });
          }      
        return handlerInput.responseBuilder
            .addDirective({
                type: "Alexa.Presentation.APLA.RenderDocument",
                token: "audioText",
                document: require('./APLAReadIntent.json'),
                "datasources": {
                    "myTarotData": {
                        "ssml": ssml
                    }
                }
            })
            .reprompt(repromptText)
            .getResponse();
    }
};


const DisplayDetailedTarotIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Alexa.Presentation.APL.UserEvent'
    && handlerInput.requestEnvelope.request.source.id === 'tarotDetail';
  },
  handle(handlerInput) {
      // *** add this line ***
      const randomCard = handlerInput.requestEnvelope.request.arguments[0];
      const tarotCard = tarots[randomCard];
      const tarotImg = tarot_img[randomCard];

     return handlerInput.responseBuilder
     .addDirective({
       type: "Alexa.Presentation.APLA.RenderDocument",
       token: "audioText",
       document: require('./APL_readme_detailed.json'),
       "datasources": {
           "myData": {
               "tarotImg": tarotImg,
               "tarotDesc": tarotCard
           }
       }
   })
       .reprompt()
       .getResponse();
          
  }
};

const FunFactIntentHandler = {
  canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FunFactIntent';
          
  },
  handle(handlerInput) {
    let randomFact = Math.floor(Math.random() * facts.length);
    const fact = facts[randomFact];
     //const speakOutput = `Let me roll the runes for you. O Freya. Tell this human their fortune. The gods have picked ${tarotCard}. Thank the Gods and go in peace my child.`;
      const ssml = `Did you know. ${fact}. That is enough for today. Come back again for more.`;
      const audio = "soundbank://soundlibrary/bell/church/church_bells_06";
      //const repromptText = `<speak><voice name='Matthew'><lang xml:lang='en-US'>Say reveal to ask the gods for another card</lang></voice></speak>`

         if (supportsAPL(handlerInput)) {
          handlerInput.responseBuilder
            .addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                document: require('./factAPL.json'),
                datasources: {
                }
            });
        }      
      return handlerInput.responseBuilder
          .addDirective({
              type: "Alexa.Presentation.APLA.RenderDocument",
              token: "audioText",
              document: require('./APLAFacts.json'),
              "datasources": {
                  "myData": {
                      "ssml": ssml,
                      "audio": audio
                  }
              }
          })
          .getResponse();
  }
};


//Inside BuyPremiumSubscriptionIntentHandler
const BuyPremiumSubscriptionIntentHandler = {
    canHandle(handlerInput){
      return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'BuyPremiumSubscriptionIntent'
    },
    handle(handlerInput){
      const locale = handlerInput.requestEnvelope.request.locale;
      const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
      return monetizationClient.getInSkillProducts(locale).then(function(res){
        const premiumSubscriptionProduct = res.inSkillProducts.filter(
          record => record.referenceName === "infiniteFortune"
        );
  
        return handlerInput.responseBuilder
          .addDirective({
            type: "Connections.SendRequest",
            name: "Buy",
            payload: {
              InSkillProduct:{
                productId: premiumSubscriptionProduct[0].productId
              }
            },
            token:"correlationToken"
          })
          .getResponse();
      })
    }
  };

  const CancelPremiumSubscriptionIntentHandler = {
    canHandle(handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === "IntentRequest" &&
        handlerInput.requestEnvelope.request.intent.name === "CancelPremiumSubscriptionIntent"
      );
    },
    handle(handlerInput) {
      const locale = handlerInput.requestEnvelope.request.locale;
      const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
      return monetizationClient.getInSkillProducts(locale).then(function(res) {
        const premiumProduct = res.inSkillProducts.filter(
          record => record.referenceName === `infiniteFortune`
        );
        return handlerInput.responseBuilder
          .addDirective({
            type: "Connections.SendRequest",
            name: "Cancel",
            payload: {
              InSkillProduct: {
                productId: premiumProduct[0].productId
              }
            },
            token: "correlationToken"
          })
          .getResponse();
      });
    }
  };

  const CancelProductResponseHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
        handlerInput.requestEnvelope.request.name === 'Cancel';
    },
    handle(handlerInput) {
      console.log('IN: CancelProductResponseHandler.handle');
      const locale = handlerInput.requestEnvelope.request.locale;
      const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
      const productId = handlerInput.requestEnvelope.request.payload.productId;
      const audio = "soundbank://soundlibrary/bell/church/church_bells_06";
  
      return monetizationClient.getInSkillProducts(locale).then(function(res) {
        const product = res.inSkillProducts.filter(
          record => record.productId === productId
          );
  
        console.log(`PRODUCT = ${JSON.stringify(product)}`);
        if (handlerInput.requestEnvelope.request.status.code === '200') {
          if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
            //The cancelation confirmation response is handled by Alexa's Purchase Experience Flow.
            //Simply add to that with getRandomYesNoQuestion()
            const ssml = `Come back anytime for unlimited access to the seer.`;
            //const repromptOutput = getRandomYesNoQuestion();
            return handlerInput.responseBuilder
            .addDirective({
                type: "Alexa.Presentation.APLA.RenderDocument",
                token: "audioText",
                document: require('./APLAISP.json'),
                "datasources": {
                    "myData": {
                        "ssml": ssml,
                        "audio": audio
                    }
                }
            })
                .reprompt()
                .getResponse();
          }
          else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
            const ssml = `The seer is happy. Say reveal to know your fortune`;
            //const repromptOutput = getRandomYesNoQuestion();
            return handlerInput.responseBuilder
            .addDirective({
                type: "Alexa.Presentation.APLA.RenderDocument",
                token: "audioText",
                document: require('./APLAISP.json'),
                "datasources": {
                    "myData": {
                        "ssml": ssml,
                        "audio": audio
                    }
                }
            })
                .reprompt()
                .getResponse();
          }
          else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
            //No subscription to cancel. 
            //The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
            //Simply add to that with getRandomYesNoQuestion()
            const ssml = `You can say, What can I buy, to hear current offers. Or reveal to know your fortune.`;
            return handlerInput.responseBuilder
            .addDirective({
                type: "Alexa.Presentation.APLA.RenderDocument",
                token: "audioText",
                document: require('./APLAISP.json'),
                "datasources": {
                    "myData": {
                        "ssml": ssml,
                        "audio": audio
                    }
                }
            })
                .reprompt()
                .getResponse();
          }
        }
        // Something failed.
        console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);
        return handlerInput.responseBuilder
          .speak('There was an error handling your purchase request. Please try again or contact us for help.')
          .getResponse();
      });
    },
  };


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        //const speakOutput = 'You can say run to me! How can I help?';
        const speechText = "<speak>"
        + "<voice name='Matthew'>"
        + "I can tell your fortune <break time='1s'/> Say reveal, to know what the gods hold for you</voice>"
        + "</speak>";

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const ssml = "<prosody volume='x-loud'>I am a seer</prosody> <break time='1s'/> I can only tell your fortune <break time='1s'/> Say reveal, to know what the gods hold for you";
        const audio ="soundbank://soundlibrary/weather/thunder/thunder_01";  
        if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./launch.json'),
                  datasources: {
                    "norseTarotData": {
                      "properties": {
                        "image": IMG_URLS['FallBackImg'],
                        "title": IMG_URLS['ReadImgTitle']
                      }
                    }
                  }
              });
          }
          return handlerInput.responseBuilder
          .addDirective({
            type: "Alexa.Presentation.APLA.RenderDocument",
            token: "audioText",
            document: require('./APLAAudio.json'),
            "datasources": {
                "myData": {
                    "ssml": ssml,
                    "audio": audio
                }
            }
        })
          .reprompt()
          .getResponse();
    }
};

const WhatCanIBuyIntentHandler = {
    canHandle(handlerInput) {
      return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent');
    },
    handle(handlerInput) {
      // Get the list of products available for in-skill purchase
      const locale = handlerInput.requestEnvelope.request.locale;
      const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
      const audio = "soundbank://soundlibrary/bell/church/church_bells_06";
      return monetizationClient.getInSkillProducts(locale).then((res) => {
        // res contains the list of all ISP products for this skill.
        // We now need to filter this to find the ISP products that are available for purchase (NOT ENTITLED)
        const purchasableProducts = res.inSkillProducts.filter(
          record => record.entitled === 'NOT_ENTITLED' &&
            record.purchasable === 'PURCHASABLE',
        );
        if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./launch.json'),
                  datasources: {
                    "norseTarotData": {
                      "properties": {
                        "image": IMG_URLS['ISPImg'],
                        "title": IMG_URLS['LaunchImgTitle']
                      }
                    }
                  }
              });
          }
        // Say the list of products
        if (purchasableProducts.length > 0) {
          // One or more products are available for purchase. say the list of products
          const ssml = `Products available for purchase at this time are ${getSpeakableListOfProducts(purchasableProducts)}. 
                              To learn more about a product, say 'Tell me more about' followed by the product name. 
                              If you are ready to buy, say 'Buy', followed by the product name. So what can I help you with?`;
          //const repromptOutput = 'I didn\'t catch that. What can I help you with?';


          return handlerInput.responseBuilder
          .addDirective({
            type: "Alexa.Presentation.APLA.RenderDocument",
            token: "audioText",
            document: require('./APLAISP.json'),
            "datasources": {
                "myData": {
                    "ssml": ssml,
                    "audio": audio
                }
            }
        })
            .reprompt()
            .getResponse();
        }
        // no products are available for purchase. Ask if they would like to hear another greeting
        const ssml = 'There are no products to offer to you right now. Sorry about that';
        const repromptOutput = 'I didn\'t catch that. What can I help you with?';
        return handlerInput.responseBuilder
        .addDirective({
            type: "Alexa.Presentation.APLA.RenderDocument",
            token: "audioText",
            document: require('./APLAISP.json'),
            "datasources": {
                "myData": {
                    "ssml": ssml,
                    "audio": audio
                }
            }
        })
            .reprompt()
            .getResponse();
      });
    },
  };
 
  const TellMeMoreAboutInfiniteTarotIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
             && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutInfiniteTarot';
    },
    handle(handlerInput) {
      const locale = handlerInput.requestEnvelope.request.locale;
      const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
      const audio = "soundbank://soundlibrary/bell/church/church_bells_06";
  
      return monetizationClient.getInSkillProducts(locale).then((res) => {
        // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
        // const greetingsPackProduct = res.inSkillProducts.filter(
        //   record => record.referenceName === 'Greetings_Pack'
        // );
  
        const premiumSubscriptionProduct = res.inSkillProducts.filter(
          record => record.referenceName === 'infiniteFortune',
        );

        if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
              .addDirective({
                  type: 'Alexa.Presentation.APL.RenderDocument',
                  document: require('./launch.json'),
                  datasources: {
                    "norseTarotData": {
                      "properties": {
                        "image": IMG_URLS['ISPImg'],
                        "title": IMG_URLS['LaunchImgTitle']
                      }
                    }
                  }
              });
          }
  
        if (isEntitled(premiumSubscriptionProduct)) {
          // Customer has bought the infnite tarot. They don't need to buy it.
          const ssml = `Good News! You're subscribed to the infinite tarot. ${premiumSubscriptionProduct[0].summary} ${getRandomYesNoQuestion()}`;

          return handlerInput.responseBuilder
          .addDirective({
            type: "Alexa.Presentation.APLA.RenderDocument",
            token: "audioText",
            document: require('./APLAISP.json'),
            "datasources": {
                "myData": {
                    "ssml": ssml,
                    "audio": audio
                }
            }
        })
            .reprompt()
            .getResponse();
        }
        // Customer does not have active subs
        // Make the upsell
        const speechText = 'Sure.';
        return makeUpsell(speechText, premiumSubscriptionProduct, handlerInput);
      });
    },
  };  

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        //const speakOutput = `Sorry, I can't understa. Please try again.`;
        const speechText = "<speak>"
        + "<audio src='soundbank://soundlibrary/weather/thunder/thunder_01'/>"
        + "<voice name='Matthew'>"
        + "The gods are busy <break time='1s'/> Come back later<break time='1s'/> </voice>"
        + "</speak>";

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

function getSpeakableListOfProducts(entitleProductsList) {
    const productNameList = entitleProductsList.map(item => item.name);
    let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
    productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
    return productListSpeech;
  }

function supportsAPL(handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}

function isProduct(product) {
    return product && product.length > 0;
  }

function isEntitled(product) {
    return isProduct(product) && product[0].entitled === 'ENTITLED';
  }

function makeUpsell(preUpsellMessage, premiumProduct, handlerInput) {
    const upsellMessage = `${preUpsellMessage}. ${premiumProduct[0].summary}. ${getRandomLearnMorePrompt()}`;
    return handlerInput.responseBuilder
      .addDirective({
        type: 'Connections.SendRequest',
        name: 'Upsell',
        payload: {
          InSkillProduct: {
            productId: premiumProduct[0].productId,
          },
          upsellMessage,
        },
        token: 'correlationToken',
      })
      .getResponse();
  }

  function randomize(array) {
    const randomItem = array[Math.floor(Math.random() * array.length)];
    return randomItem;
  }

function getRandomLearnMorePrompt() {
    const questions = [
      'Want to learn more about it?',
      'Should I tell you more about it?',
      'Want to learn about it?',
      'Interested in learning more about it?',
    ];
    return randomize(questions);
  }

  function getPersistenceAdapter(tableName) {
    // Determines persistence adapter to be used based on environment
    // Note: tableName is only used for DynamoDB Persistence Adapter
    if (process.env.S3_PERSISTENCE_BUCKET) {
      // in Alexa Hosted Environment
      // eslint-disable-next-line global-require
      const s3Adapter = require('ask-sdk-s3-persistence-adapter');
      return new s3Adapter.S3PersistenceAdapter({
        bucketName: process.env.S3_PERSISTENCE_BUCKET,
      });
    }
  
    // Not in Alexa Hosted Environment
    return new ddbAdapter.DynamoDbPersistenceAdapter({
      tableName: tableName,
      createTable: true,
    });
  }

  const LogRequestInterceptor = {
    process(handlerInput) {
          console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
    }
  };
  
  const LogResponseInterceptor = {
      process(handlerInput, response) {
          console.log(`RESPONSE ENVELOPE = ${JSON.stringify(response)}`);
      }
  };
exports.handler = Alexa.SkillBuilders.custom()
    //.withPersistenceAdapter(getPersistenceAdapter(ddbTableName))
    //.withPersistenceAdapter(getPersistenceAdapter(ddbTableNamePersistence))
    .addRequestHandlers(
        LaunchRequestHandler,
        ReadTarotIntentHandler,
        DisplayDetailedTarotIntentHandler,
        FunFactIntentHandler,
        BuyPremiumSubscriptionIntentHandler,
        WhatCanIBuyIntentHandler,
        TellMeMoreAboutInfiniteTarotIntentHandler,
        CancelPremiumSubscriptionIntentHandler,
        CancelProductResponseHandler,
        HelpIntentHandler,
        FallbackIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        ) 
    .addErrorHandlers(
        ErrorHandler,
        )
        .addRequestInterceptors(LogRequestInterceptor)
        .addResponseInterceptors(LogResponseInterceptor)
    .withPersistenceAdapter(getPersistenceAdapter(ddbTableName))
    .withApiClient(new Alexa.DefaultApiClient())    
 /*   .withPersistenceAdapter(
        new ddbAdapter.DynamoDbPersistenceAdapter({
            tableName: ddbTableName,
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: ddTableRegion})
        })
    )*/
    .lambda();
