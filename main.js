const discord = require("discord.js");
require('dotenv').config();
const client = new discord.Client();

let channel, player_one, player_two, player_one_score, player_two_score, server;
let rally_value;
let timer;

function score_description(score) {
    switch (score) {
        case 0: return "love";
        case 1: return "15";
        case 2: return "30";
        case 3: return "40";
    }
}

function show_score() {
    if (player_one_score == 3 && player_two_score == 3) {
        channel.send("Deuce!");
    } else if (player_one_score == 4 && player_two_score == 3) {
        channel.send(`Advantage ${player_one.username}!`);
    } else if (player_two_score == 4 && player_one_score == 3) {
        channel.send(`Advantage ${player_two.username}!`);
    } else if (player_one_score == 2 && player_two_score == 2) {
        channel.send("30-all!");
    } else if (player_one_score == 1 && player_two_score == 1) {
        channel.send("15-all!");
    } else {
        if (server == player_one) {
            channel.send(`${score_description(player_one_score)}-${score_description(player_two_score)}`);
        } else {
            channel.send(`${score_description(player_two_score)}-${score_description(player_one_score)}`);
        }
    }
}

function has_player_two_won() {
    return player_two_score - player_one_score >= 2;
}

function d20() {
    return Math.floor(Math.random() * 20) + 1;
}

function is_request(text, msg) {
    return msg.cleanContent == `@${client.user.username} ${text}`;
}

function player_one_serve() {
    channel.send(`It's ${player_one.username} to serve, choose a number between 5 and 10, this must be less than a D20 roll otherwise the serve will fail`);
    server = player_one;
    state = states.player_one_serve;
}

function player_two_serve() {
    channel.send(`It's ${player_two.username} to serve, choose a number between 5 and 10, this must be less than a D20 roll otherwise the serve will fail`);
    server = player_two;
    state = states.player_two_serve;
}

function player_one_rally() {
    channel.send(`Now ${player_one.username} must roll ${rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.`);
    state = states.player_one_rally;
}

function player_two_rally() {
    channel.send(`Now ${player_two.username} must roll ${rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.`);
    state = states.player_two_rally;
}

function welcome() {
    channel.send("Let's start 🎾Wimbledungeons🎾, the D&D Tennis Game for Discord!");
    player_one_score = 0;
    player_two_score = 0;
    player_one_serve();
}

function give_point_to_player_one() {
    player_one_score += 1;
    if (player_one_score == 4 && player_two_score == 4) {
        player_one_score = 3;
        player_two_score = 3;
    }
    if (player_one_score >= 4 && (player_one_score - player_two_score >= 2)) {
        channel.send(`${player_one.username} has won the game! Well Done!`);
        state = states.wait_for_first_player;
    } else {
        show_score();
        player_one_serve();
    }
}

function give_point_to_player_two() {
    player_two_score += 1;
    if (player_one_score == 4 && player_two_score == 4) {
        player_one_score = 3;
        player_two_score = 3;
    }
    if (player_two_score >= 4 && (player_two_score - player_one_score >= 2)) {
        channel.send(`${player_two.username} has won the game! Well Done!`);
        state = states.wait_for_first_player;
    } else {
        show_score();
        player_two_serve();
    }
}

function is_player_one(msg) {
    return msg.author == player_one && msg.channel == channel;
}

function is_player_two(msg) {
    return msg.author == player_one && msg.channel == channel;
}

const states = {
    wait_for_first_player: (msg) => {
        if (is_request("start", msg)) {
            player_one = msg.author;
            channel = msg.channel;
            msg.reply("You have started a new game 🎾! Another player has 30 seconds to join! ⏲️");
            state = states.wait_for_second_player;
            timer = setTimeout(() => {
                state = states.wait_for_first_player;
                msg.reply("No-one wanted to join your game 🤷 Maybe try again later 😃");
            }, 30 * 1000);
        }
    },

    wait_for_second_player: (msg) => {
        if (is_request("start", msg) && msg.channel == channel) {
            clearTimeout(timer);
            player_two = msg.author;
            msg.reply(`You have joined a new game with ${player_one.username} 🎾!`);
            welcome();
        }
    },

    player_one_serve: (msg) => {
        if (is_player_one(msg)) {
            const serve_value = parseInt(msg.cleanContent, 10);
            if (serve_value >= 5 && serve_value <= 10) {
                const roll = d20();
                if (roll >= serve_value) {
                    msg.reply(`Congratulations, you rolled a ${roll}!`);
                    rally_value = serve_value;
                    player_two_rally();
                } else {
                    msg.reply(`Unfortunately, you rolled a ${roll} and a point is awarded to the opposing player`);
                    give_point_to_player_two();
                }
            } else {
                msg.reply("You must choose a value between 5 and 10");
            }
        }
    },

    player_two_serve: (msg) => {
        if (is_player_two(msg)) {
            const serve_value = parseInt(msg.cleanContent, 10);
            if (serve_value >= 5 && serve_value <= 10) {
                const roll = d20();
                if (roll >= serve_value) {
                    msg.reply(`Congratulations, you rolled a ${roll}!`);
                    rally_value = serve_value;
                    player_one_rally();
                } else {
                    msg.reply(`Unfortunately, you rolled a ${roll} and a point is awarded to the opposing player`);
                    give_point_to_player_one();
                }
            } else {
                msg.reply("You must choose a value between 5 and 10");
            }
        }
    },

    player_one_rally: (msg) => {
        if (is_player_one(msg)) {
            const roll = d20();
            switch (msg.cleanContent.toLowerCase()) {
            case 'a':
                if (roll >= rally_value + 3) {
                    msg.reply(`You needed ${rally_value + 3} and rolled a ${roll} and returned the shot`);
                    rally_value = 3;
                    player_two_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 3} and rolled a ${roll}.`);
                    give_point_to_player_two();
                }
                break;
            case 'b':
                if (roll >= rally_value + 5) {
                    msg.reply(`You needed ${rally_value + 5} and rolled a ${roll} and returned the shot`);
                    rally_value = 5;
                    player_two_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 5} and rolled a ${roll}.`);
                    give_point_to_player_two();
                }
                break;
            case 'c':
                if (roll >= rally_value + 8) {
                    msg.reply(`You needed ${rally_value + 8} and rolled a ${roll} and returned the shot`);
                    rally_value = 8;
                    player_two_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 8} and rolled a ${roll}.`);
                    give_point_to_player_two();
                }
                break;
            case 'd':
                if (roll >= rally_value + 10) {
                    msg.reply(`You needed ${rally_value + 10} and rolled a ${roll} and returned the shot`);
                    rally_value = 10;
                    player_two_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 10} and rolled a ${roll}.`);
                    give_point_to_player_two();
                }
                break;
            default:
                msg.reply("Please choose an option A, B, C, or D.");
            }
        }
    },

    player_two_rally: (msg) => {
        if (is_player_two(msg)) {
            const roll = d20();
            switch (msg.cleanContent.toLowerCase()) {
            case 'a':
                if (roll >= rally_value + 3) {
                    msg.reply(`You needed ${rally_value + 3} and rolled a ${roll} and returned the shot`);
                    rally_value = 3;
                    player_one_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 3} and rolled a ${roll}.`);
                    give_point_to_player_one();
                }
                break;
            case 'b':
                if (roll >= rally_value + 5) {
                    msg.reply(`You needed ${rally_value + 5} and rolled a ${roll} and returned the shot`);
                    rally_value = 5;
                    player_one_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 5} and rolled a ${roll}.`);
                    give_point_to_player_one();
                }
                break;
            case 'c':
                if (roll >= rally_value + 8) {
                    msg.reply(`You needed ${rally_value + 8} and rolled a ${roll} and returned the shot`);
                    rally_value = 8;
                    player_one_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 8} and rolled a ${roll}.`);
                    give_point_to_player_one();
                }
                break;
            case 'd':
                if (roll >= rally_value + 10) {
                    msg.reply(`You needed ${rally_value + 10} and rolled a ${roll} and returned the shot`);
                    rally_value = 10;
                    player_one_rally();
                } else {
                    msg.reply(`Unfortunately you needed ${rally_value + 10} and rolled a ${roll}.`);
                    give_point_to_player_one();
                }
                break;
            default:
                msg.reply("Please choose an option A, B, C, or D.");
            }
        }
    },
};

let state = states.wait_for_first_player;

client.on("message", msg => state(msg));

client.login(process.env.CLIENT_TOKEN);
