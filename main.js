const discord = require("discord.js");
const client = new discord.Client();
const {WimbleDungeonsGame} = require("./wimbledungeons.js");
require("dotenv").config();
const games = {};

function cmd(msg, text) {
    return msg.cleanContent == `@${client.user.username} ${text}`;
}

client.on("message", (msg) => {
    if (games[msg.channel.id] == undefined || games[msg.channel.id].over)
        games[msg.channel.id] = new WimbleDungeonsGame(client, msg.channel);
    const game = games[msg.channel.id];
    if (cmd(msg, "help")) {
        game.help();
    } else if (cmd(msg, "rules")) {
        game.rules();
    } else if (cmd(msg, "start")) {
        if (!game.started) game.add_player(msg.author);
    } else if (cmd(msg, "end")) {
        game.quit(msg.author);
    } else if (game.started) {
        game.state(msg);
    }
});

client.login(process.env.CLIENT_TOKEN);
