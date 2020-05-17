const Alexa = require('ask-sdk-core');
const PokeUtil = require('./util');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
            (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent');
    },
    handle(handlerInput) {
        const WELCOME = "Welcome to the Voice Pokedex.";
        const REPROMPT = "Tell me the name or number of a Pokemon you'd like to know about";
        const speechText = handlerInput.requestEnvelope.request.type === 'LaunchRequest' ?
            `${WELCOME} ${REPROMPT}` : REPROMPT;
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(REPROMPT)
            .getResponse();
    }
};

const PokedexIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'PokedexIntent';
    },
    async handle(handlerInput) {
        const pokemon = PokeUtil.slotValue(handlerInput.requestEnvelope.request.intent.slots.pokemon, true).toLowerCase();
        const pokemonValue = PokeUtil.slotValue(handlerInput.requestEnvelope.request.intent.slots.pokemon);
        return await pokedexEntry(handlerInput, pokemon);
    }
};

const PokemonByNumberIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'PokemonByNumberIntent';
    },
    async handle(handlerInput) {
        const pokemon = PokeUtil.slotValue(handlerInput.requestEnvelope.request.intent.slots.pokemonNumber);
        return await pokedexEntry(handlerInput, pokemon);
    }
};

async function pokedexEntry(handlerInput, pokemon) {
    const REPROMPT = "Would you like to ask for another pokemon?";
    try {
        
        let progressiveResponse = 'Please hold while I look that up for you.'  
        await callDirectiveService(handlerInput, progressiveResponse);  

        const entry = await PokeUtil.getPokedexEntry(pokemon);
        const speechText = `${entry.name}. ${entry.description}. ${REPROMPT}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(REPROMPT)
            .withStandardCard(entry.name, entry.description, entry.img)
            .getResponse();
    } catch (error) {
        const speechText = `I couldn't find any pokedex entry for: ${pokemon}. `;
        console.log(error);
        return handlerInput.responseBuilder
            .speak(speechText + REPROMPT)
            .reprompt(REPROMPT)
            .withStandardCard("Not found", speechText)
            .getResponse();
    }
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const HELP = "Tell me the name or the number of a pokemon you would like to know about." +
            " Currently, you can ask for a pokemon up to the number 151.";
        return handlerInput.responseBuilder
            .speak(HELP)
            .reprompt(HELP)
            .getResponse();
    }
};

const NoCancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        const GOODBYE = "Thank you for using the Voice Pokedex!";
        return handlerInput.responseBuilder
            .speak(GOODBYE)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. 
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        console.error(error);
        const ERROR = "Sorry, I couldn't understand what you said. Please try again.";
        return handlerInput.responseBuilder
            .speak(ERROR)
            .reprompt(ERROR)
            .getResponse();
    }
};

function callDirectiveService(handlerInput, progressiveResponse) {
    // Call Alexa Directive Service.  
    const requestEnvelope = handlerInput.requestEnvelope;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
    const requestId = requestEnvelope.request.requestId;
    const endpoint = requestEnvelope.context.System.apiEndpoint;
    const token = requestEnvelope.context.System.apiAccessToken;

    // build the progressive response directive  
    const directive = {
        header: {
            requestId,
        },
        directive: {
            type: 'VoicePlayer.Speak',
            speech: progressiveResponse,
        },
    };

    // send directive  
    return directiveServiceClient.enqueue(directive, endpoint, token);
}

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PokedexIntentHandler,
        PokemonByNumberIntentHandler,
        HelpIntentHandler,
        NoCancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    . withApiClient(new Alexa.DefaultApiClient())
    .lambda();