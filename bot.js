const Discord = require('discord.io');
const fs = require('fs');
const auth = require('./auth.json');
const mod = require('./mod.json');

const missingCardNotification = 'Card is either not available or already taken.';
const { modUserId } = mod;
const bot = new Discord.Client({
  token: auth.token,
  autorun: true,
});

let deck = fs.readFileSync('./SuiteAndSexyGomensEventsDeck.json');
let deckObj = JSON.parse(deck);

bot.on('message', (user, userID, channelID, message) => {
  if (message.substring(0, 1) === '!') {
    let args = message.substring(1).split(' ');
    const cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case 'helpme':
        bot.sendMessage({
          to: channelID,
          message: 'Note: <Mandatory> (Optional) parameters\n'
            + 'Command - !load <name> - Set or reset the deck\n'
            + 'Command - !pick - Pick a random card\n'
            + 'Command - !choose <value> (of) <suit> - Choose a specific card\n'
            + 'Command - !removesuit <suit> - Removes the specified suit from the active deck\n',
        });
        break;
      case 'poke':
        bot.sendMessage({
          to: channelID,
          message: 'Ow!',
        });
        break;
      case 'register':
        bot.sendMessage({
          to: channelID,
          message: userID,
        });
        break;
      case 'load':
        if (typeof message.split(' ')[1] === 'undefined') {
          bot.sendMessage({
            to: userID,
            message: 'Please specify a deck name, like in this example: !load SuiteAndSexyGomensEventsDeck',
          });
        } else {
          const deckName = message.split(' ')[1];
          deck = fs.readFileSync(`./${deckName}.json`);
          deckObj = JSON.parse(deck);
          bot.sendMessage({
            to: userID,
            message: `${deckName} loaded!`,
          });
        }
        break;
      case 'removesuit':
        {
          const suitToRemove = message.split(' ')[1].charAt(0).toUpperCase() + message.split(' ')[1].slice(1);
          let index = -1;
          deckObj.cards.forEach((card) => {
            index += 1;
            if (card['card-suit'] === suitToRemove) {
              deckObj.cards.splice(index, 1);
            }
          });
          bot.sendMessage({
            to: userID,
            message: `${suitToRemove} removed!`,
          });
          break;
        }
      case 'pick':
        {
          const cardPosition = Math.floor(Math.random() * deckObj.cards.length);
          const card = deckObj.cards[cardPosition];
          bot.sendMessage({
            to: userID,
            message: `You picked the ${card['card-name']} of ${card['card-suit']}`,
          }, () => {
            const filePathToSend = card['card-image'];
            bot.uploadFile({
              to: userID,
              file: filePathToSend,
            }, () => {
              bot.sendMessage({
                to: modUserId,
                message: `${user}picked the ${card['card-name']} of ${card['card-suit']}`,
              });
              deckObj.cards.splice(cardPosition, 1);
            });
          });
          break;
        }
      case 'choose':
        {
          let cardValue = message.split(' ')[1];
          let cardSuite = message.split(' ')[2] === 'of' ? message.split(' ')[3] : message.split(' ')[2];
          cardValue = cardValue.charAt(0).toUpperCase() + cardValue.slice(1);
          cardSuite = cardSuite.charAt(0).toUpperCase() + cardSuite.slice(1);
          bot.sendMessage({
            to: userID,
            message: `You picked the ${cardValue} of ${cardSuite}`,
          },
            () => {
              let filePathToSend = missingCardNotification;
              let counter = -1;
              deckObj.cards.forEach((thisCard) => {
                counter += 1;
                if (thisCard['card-suit'] === cardSuite && (cardValue === thisCard['card-name'] || cardValue === thisCard['card-number'])) {
                  filePathToSend = thisCard['card-image'];
                }
              });
              if (counter !== -1) {
                deckObj.cards.splice(counter, 1);
              }
              if (filePathToSend === missingCardNotification) {
                bot.sendMessage({
                  to: userID,
                  message: missingCardNotification,
                }, () => {
                });
              } else {
                bot.uploadFile({
                  to: userID,
                  file: filePathToSend,
                }, () => {
                  bot.sendMessage({
                    to: modUserId,
                    message: `${user} picked the ${cardValue} of ${cardSuite}`,
                  });
                });
              }
            });
          break;
        }
      default:
        break;
    }
  }
});
