const {d20, Game} = require("./game.js");

function option_to_value(option) {
    switch (option) {
    case "a": return 3;
    case "b": return 5;
    case "c": return 8;
    case "d": return 10;
    default: return undefined;
    }
}

function score_description(score) {
    switch (score) {
    case 0: return "love";
    case 1: return "15";
    case 2: return "30";
    case 3: return "40";
    }
}

class WimbleDungeonsGame extends Game {
    show_score() {
        if (this.player_one_score == 3 && this.player_two_score == 3) {
            super.embed("Deuce!");
        } else if (this.player_one_score == 4 && this.player_two_score == 3) {
            super.embed(`Advantage ${this.player_one_name}!`);
        } else if (this.player_two_score == 4 && this.player_one_score == 3) {
            super.embed(`Advantage ${this.player_two_name}!`);
        } else if (this.player_one_score == 2 && this.player_two_score == 2) {
            super.embed("30-all!");
        } else if (this.player_one_score == 1 && this.player_two_score == 1) {
            super.embed("15-all!");
        } else {
            if (super.is_player_one(this.server)) {
                super.embed(`${score_description(this.player_one_score)}-${score_description(this.player_two_score)}`);
            } else if (super.is_player_two(this.server)) {
                super.embed(`${score_description(this.player_two_score)}-${score_description(this.player_one_score)}`);
            }
        }
    }

    ask_player_one_to_serve() {
        this.server = super.player_one;
        super.embed(`It's ${super.player_one_name}'s turn to serve, choose a skill threshold between 5 and 10 to determine the riskiness of the shot.`);
        this.state = this.player_one_serve;
    }

    ask_player_two_to_serve() {
        this.server = super.player_two;
        super.embed(`It's ${super.player_two_name}'s turn to serve, choose a skill threshold between 5 and 10 to determine the riskiness of the shot.`);
        this.state = this.player_two_serve;
    }

    player_one_serve(msg) {
        if (super.is_player_one(msg.author) && super.in_channel(msg.channel)) {
            const serve_value = parseInt(msg.cleanContent, 10);
            if (serve_value >= 5 && serve_value <= 10) {
                const roll = d20();
                if (roll >= serve_value) {
                    msg.reply(`Congratulations, you rolled a ${roll} 🎲!`);
                    this.rally_value = serve_value;
                    this.ask_player_two_to_rally();
                } else {
                    msg.reply(`Unfortunately, you rolled a ${roll} and a point is awarded to the opposing player`);
                    this.give_point_to_player_two();
                }
            } else {
                msg.reply("You must choose a value between 5 and 10");
            }
        }
    }

    player_two_serve(msg) {
        if (super.is_player_two(msg.author) && super.in_channel(msg.channel)) {
            const serve_value = parseInt(msg.cleanContent, 10);
            if (serve_value >= 5 && serve_value <= 10) {
                const roll = d20();
                if (roll >= serve_value) {
                    msg.reply(`Congratulations, you rolled a ${roll}!`);
                    this.rally_value = serve_value;
                    this.ask_player_one_to_rally();
                } else {
                    msg.reply(`Unfortunately, you rolled a ${roll} and a point is awarded to the opposing player`);
                    this.give_point_to_player_one();
                }
            } else {
                msg.reply("You must choose a value between 5 and 10");
            }
        }
    }

    ask_player_one_to_rally() {
        super.embed(`Now ${this.player_one_name} must roll ${this.rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.`);
        if (this.player_one_power_points) super.embed("Remember that you can use a power to reduce the threshold of the return (R) or press the advantage on the opponent (P)", `Number of powerpoints left: ${this.player_one_power_points}`);
        this.state = this.player_one_rally;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    ask_player_two_to_rally() {
        super.embed(`Now ${super.player_two_name} must roll ${this.rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.`);
        if (this.player_two_power_points) super.embed("Remember that you can use a power to reduce the threshold of the return (R) or press the advantage on the opponent (P)", `Number of powerpoints left: ${this.player_two_power_points}`);
        this.state = this.player_two_rally;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    player_one_rally(msg) {
        if (super.is_player_one(msg.author) && super.in_channel(msg.channel)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                if (this.reduce_the_threshold || this.press_the_advantage) {
                    msg.reply("You have already used a powerpoint on this turn!");
                } else {
                    if (this.player_one_power_points) {
                        this.player_one_power_points -= 1;
                        msg.reply("You have used one of your powerpoints to reduce the threshold of your return by 5, now choose the type of your return.");
                        this.reduce_the_threshold = true;
                    } else {
                        msg.reply("You don't have any powerpoints to use!");
                    }
                }
            } else if (response == "p") {
                if (this.reduce_the_threshold || this.press_the_advantage) {
                    msg.reply("You have already used a powerpoint on this turn!");
                } else {
                    if (this.player_one_power_points) {
                        this.player_one_power_points -= 1;
                        msg.reply("You have used one of your powerpoints to increase the threshold on your opponents return by 5, now choose the type of your return.");
                        this.press_the_advantage = true;
                    } else {
                        msg.reply("You don't have any powerpoints to use!");
                    }
                }
            } else {
                const option = option_to_value(response);
                if (option) {
                    const roll = d20();
                    let threshold = this.rally_value + option;
                    if (this.reduce_the_threshold) threshold = Math.max(0, threshold - 5);
                    if (roll >= threshold) {
                        msg.reply(`You needed ${threshold} and rolled a ${roll} and returned the shot`);
                        if (roll > 15 && this.player_one_power_points < 2) {
                            this.player_one_power_points += 1;
                            msg.reply("You also gained a power point for rolling over 15 on a successfull rallying shot!");
                        }
                        this.rally_value = option;
                        if (this.press_the_advantage) this.rally_value = Math.min(20, this.rally_value + 5);
                        this.ask_player_two_to_rally();
                    } else {
                        msg.reply(`Unfortunately you needed ${this.rally_value + option} and rolled a ${roll}.`);
                        this.give_point_to_player_two();
                    }
                } else {
                    msg.reply("Please choose an option A, B, C, or D.");
                }
            }
        }
    }

    player_two_rally(msg) {
        if (super.is_player_two(msg.author) && super.in_channel(msg.channel)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                if (this.reduce_the_threshold || this.press_the_advantage) {
                    msg.reply("You have already used a powerpoint on this turn!");
                } else {
                    if (this.player_two_power_points) {
                        this.player_two_power_points -= 1;
                        msg.reply("You have used one of your powerpoints to reduce the threshold of your return by 5, now choose the type of your return.");
                        this.reduce_the_threshold = true;
                    } else {
                        msg.reply("You don't have any powerpoints to use!");
                    }
                }
            } else if (response == "p") {
                if (this.reduce_the_threshold || this.press_the_advantage) {
                    msg.reply("You have already used a powerpoint on this turn!");
                } else {
                    if (this.player_two_power_points) {
                        this.player_two_power_points -= 1;
                        msg.reply("You have used one of your powerpoints to increase the threshold on your opponents return by 5, now choose the type of your return.");
                        this.press_the_advantage = true;
                    } else {
                        msg.reply("You don't have any powerpoints to use!");
                    }
                }
            } else {
                const option = option_to_value(response);
                if (option) {
                    const roll = d20();
                    let threshold = this.rally_value + option;
                    if (this.reduce_the_threshold) threshold = Math.max(0, threshold - 5);
                    if (roll >= threshold) {
                        msg.reply(`You needed ${threshold} and rolled a ${roll} and returned the shot`);
                        if (roll > 15 && this.player_two_power_points < 2) {
                            this.player_two_power_points += 1;
                            msg.reply("You also gained a power point for rolling over 15 on a successfull rallying shot!");
                        }
                        this.rally_value = option;
                        if (this.press_the_advantage) this.rally_value = Math.min(20, this.rally_value + 5);
                        this.ask_player_one_to_rally();
                    } else {
                        msg.reply(`Unfortunately you needed ${this.rally_value + option} and rolled a ${roll}.`);
                        this.give_point_to_player_one();
                    }
                } else {
                    msg.reply("Please choose an option A, B, C, or D.");
                }
            }
        }
    }

    give_point_to_player_one() {
        this.player_one_score += 1;
        if (this.player_one_score == 4 && this.player_two_score == 4) {
            this.player_one_score = 3;
            this.player_two_score = 3;
        }
        if (this.player_one_score >= 4 && (this.player_one_score - this.player_two_score >= 2)) {
            super.embed(`${this.player_one_name} has won the game! Well Done!`);
            super.end();
        } else {
            this.show_score();
            this.ask_player_one_to_serve();
        }
    }

    give_point_to_player_two() {
        this.player_two_score += 1;
        if (this.player_one_score == 4 && this.player_two_score == 4) {
            this.player_one_score = 3;
            this.player_two_score = 3;
        }
        if (this.player_two_score >= 4 && (this.player_two_score - this.player_one_score >= 2)) {
            super.embed(`${this.player_two_name} has won the game! Well Done!`);
            super.end();
        } else {
            this.show_score();
            this.ask_player_two_to_serve();
        }
    }

    constructor(client) {
        super(client);
        this.player_one_score = 0;
        this.player_one_power_points = 0;
        this.player_two_score = 0;
        this.player_two_power_points = 0;
        this.rally_value = 0;
    }

    add_player(player, channel) {
        if (super.add_player(player, channel)) {
            switch (super.number_of_players) {
                case 1: super.start_timer(30); break;
                case 2: this.start(); break;
            }
        }
    }

    start() {
        super.start("WimbleDungeons", "https://github.com/andyherbert/wimbledungeons", "#f6ec00", "Let's start 🎾Wimbledungeons🎾, the D&D Tennis Game for Discord!");
        this.ask_player_one_to_serve();
    }

    rules(channel) {
        super.rules("WimbleDungeons", "https://github.com/andyherbert/wimbledungeons", "#f6ec00", channel, "./README.md");
    }
}

module.exports = {WimbleDungeonsGame};
