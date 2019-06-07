const discord = require("discord.js");
const fs = require("fs");

function dice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function d20() {
    return dice(20);
}

function end_timeout(game) {
    return () => {
        game.user_embed({text: `Sorry ${game.player_one_name}, it looks like no-one wanted to join your game 🤷‍`, user: game.player_one});
        game.over = true;
    };
}

class Game {
    set player_one(user) {
        this.players[0] = user;
    }

    get player_one() {
        return this.players[0];
    }

    get player_one_name() {
        return this.player_one.toString();
    }

    set player_two(user) {
        this.players[1] = user;
    }

    get player_two() {
        return this.players[1];
    }

    get player_two_name() {
        return this.player_two.toString();
    }

    is_player_one(user) {
        return user.id == this.players[0].id;
    }

    is_player_two(user) {
        return user.id == this.players[1].id;
    }

    is_a_player(user) {
        for (const player of this.players) {
            if (user.id == player.id) return true;
        }
        return false;
    }

    get number_of_players() {
        return this.players.length;
    }

    constructor({client, channel, game_name, embed_color, game_rules = "./txt/rules.md", game_help = "./txt/help.md"} = {}) {
        this.client = client;
        this.channel = channel;
        this.game_name = game_name;
        this.embed_color = embed_color;
        this.game_rules = game_rules;
        this.game_help = game_help;
        this.players = [];
        this.started = false;
        this.over = false;
    }

    start_timer(seconds) {
        this.timer = this.client.setTimeout(end_timeout(this), seconds * 1000);
        this.user_embed({text: `${this.player_one_name} has created a new game! Another player has ${seconds} seconds to join! ⏱`, user: this.player_one});
    }

    add_player(player) {
        this.players[this.players.length] = player;
    }

    start() {
        this.client.clearTimeout(this.timer);
        this.client.user.setPresence({game: {name: this.game_name}});
        this.started = true;
    }

    end() {
        this.client.user.setPresence({game: {name: ""}});
        this.over = true;
    }

    quit(user) {
        if (this.is_a_player(user)) {
            if (!this.started) clearTimeout(this.timer);
            this.end();
            this.user_embed({text: `${user.toString()} ended the game.`, user});
        }
    }

    create_embed({text = "", footer = ""} = {}) {
        return new discord.RichEmbed().setColor(this.embed_color).setDescription(text).setFooter(footer);
    }

    small_embed({text, footer}) {
        this.channel.send(this.create_embed({text, footer}));
    }

    user_embed({text, footer, user}) {
        this.channel.send(this.create_embed({text, footer}).setThumbnail(user.avatarURL));
    }

    embed_with_avatar({text, footer}) {
        this.user_embed({text, footer, user: this.client.user});
    }

    show_file(file) {
        fs.readFile(file, "utf-8", (err, text) => {
            if (!err) this.embed_with_avatar({text});
        });
    }

    rules() {
        this.show_file(this.game_rules);
    }

    help() {
        this.show_file(this.game_help);
    }
}

module.exports = {d20, Game};
