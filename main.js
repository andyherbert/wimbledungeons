const discord = require("discord.js");
const client = new discord.Client();
const wimbledungeon = require("./wimbledungeons.js");
require("dotenv").config();

let channel, player_one, game, timer;

client.on("message", (msg) => {
    if (game && !game.over) {
        if ((msg.author == game.player_one || msg.author == game.player_two) && msg.cleanContent == `@${client.user.username} end`) {
            msg.reply("Okay, game is over 😥");
            game.over = true;
        } else {
            game.state(msg);
        }
        if (game.over) client.user.setPresence({game: {name: ""}});
    } else {
        if (msg.cleanContent == `@${client.user.username} start`) {
            if (player_one == undefined) {
                player_one = msg.author;
                channel = msg.channel;
                timer = client.setTimeout(() => {
                    player_one = undefined;
                    msg.reply("No-one wanted to join your game, maybe try again later 🤷");
                }, 30 * 1000);
                msg.reply("You have started a new game 🎾! Another player has 30 seconds to join! ⏲️");
            } else {
                if (msg.channel == channel) {
                    clearTimeout(timer);
                    game = new wimbledungeon.Game(player_one, msg.author, channel);
                    channel = undefined;
                    player_one = undefined;
                    client.user.setPresence({game: {name: "WimbleDungeons"}});
                }
            }
        }
    }
});

client.login(process.env.CLIENT_TOKEN);
