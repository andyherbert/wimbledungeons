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
        game.user_embed(`Sorry ${game.player_one_name}, it looks like no-one wanted to join your game 🤷‍`, game.player_one);
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
        return this.player_one.username;
    }

    set player_two(user) {
        this.players[1] = user;
    }

    get player_two() {
        return this.players[1];
    }

    get player_two_name() {
        return this.player_two.username;
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

    constructor(client, channel) {
        this.client = client;
        this.channel = channel;
        this.players = [];
        this.started = false;
        this.over = false;
    }

    start_timer(seconds) {
        this.timer = this.client.setTimeout(end_timeout(this), seconds * 1000);
        this.user_embed(`${this.player_one_name} has created a new game! Another player has ${seconds} seconds to join! ⏱`, this.player_one);
    }

    add_player(player) {
        this.players[this.players.length] = player;
    }

    start(game_name, game_url, embed_color, text) {
        this.game_name = game_name;
        this.game_url = game_url;
        this.embed_color = embed_color;
        clearTimeout(this.timer);
        this.client.user.setPresence({game: {name: game_name}});
        this.started = true;
        this.embed(text);
    }

    end() {
        this.client.user.setPresence({game: {name: ""}});
        this.over = true;
    }

    quit(user) {
        if (this.is_a_player(user)) {
            if (!this.started) clearTimeout(this.timer);
            this.end();
            this.user_embed(`${user.username} ended the game.`, user);
        }
    }

    embed(text) {
        const embed = new discord.RichEmbed()
            .setTitle(this.game_name)
            .setURL(this.game_url)
            .setColor(this.embed_color)
            .setDescription(text)
            .setThumbnail(this.client.user.avatarURL);
        this.channel.send(embed);
    }

    small_embed(text) {
        this.channel.send(new discord.RichEmbed().setDescription(text));
    }

    user_embed(text, user, footer = "") {
        this.channel.send(new discord.RichEmbed().setDescription(text).setThumbnail(user.avatarURL).setFooter(footer));
    }

    show_file(game_name, game_url, embed_color, file) {
        fs.readFile(file, "utf-8", (err, text) => {
            if (!err) this.channel.send(new discord.RichEmbed().setTitle(game_name).setURL(game_url).setColor(embed_color).setDescription(text).setThumbnail(this.client.user.avatarURL));
        });
    }
}

module.exports = {d20, Game};
