const {d20, Game} = require("./game.js");

const GAME_NAME = "WimbleDungeons";
const GAME_URL = "https://github.com/andyherbert/wimbledungeons";
const EMBED_COLOR = "#f6ec00";
const GAME_RULES = "./README.md";
const GAME_HELP = "./help.md";

function option_to_value(option) {
    switch (option) {
    case "a": return 3;
    case "b": return 5;
    case "c": return 8;
    case "d": return 10;
    default: return 0;
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
            super.small_embed("Deuce!");
        } else if (this.player_one_score == 4 && this.player_two_score == 3) {
            super.user_embed(`Advantage ${super.player_one_name}!`, super.player_one);
        } else if (this.player_two_score == 4 && this.player_one_score == 3) {
            super.user_embed(`Advantage ${super.player_two_name}!`, super.player_two);
        } else if (this.player_one_score == 2 && this.player_two_score == 2) {
            super.small_embed("30-all!");
        } else if (this.player_one_score == 1 && this.player_two_score == 1) {
            super.small_embed("15-all!");
        } else {
            if (super.is_player_one(this.server)) {
                super.user_embed(`${score_description(this.player_one_score)}-${score_description(this.player_two_score)}`, (this.player_one_score > this.player_two_score) ? super.player_one : super.player_two);
            } else if (super.is_player_two(this.server)) {
                super.user_embed(`${score_description(this.player_two_score)}-${score_description(this.player_one_score)}`, (this.player_one_score > this.player_two_score) ? super.player_one : super.player_two);
            }
        }
    }

    ask_player_one_to_serve() {
        this.server = super.player_one;
        super.user_embed(`It's ${super.player_one_name}'s turn to serve, choose a skill threshold between 5 and 10 to determine the riskiness of the shot.\n\nYou can also use a PowerPoint to reduce the threshold of your shot (R) or add to the power of your shot (P)`, super.player_one,`Total PowerPoints: ${this.player_one_power_points}`);
        this.state = this.player_one_serve;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    ask_player_two_to_serve() {
        this.server = super.player_two;
        super.user_embed(`It's ${super.player_two_name}'s turn to serve, choose a skill threshold between 5 and 10 to determine the riskiness of the shot.\n\nYou can also use a PowerPoint to reduce the threshold of your shot (R) or add to the power of your shot (P)`, super.player_two, `Total PowerPoints: ${this.player_two_power_points}`);
        this.state = this.player_two_serve;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    award_power_point_to_player_one() {
        this.player_one_power_points += 1;
        super.user_embed(`${super.player_one_name} has gained a power point!`, super.player_one, `Total PowerPoints: ${this.player_one_power_points}`);
    }

    award_power_point_to_player_two() {
        this.player_two_power_points += 1;
        super.user_embed(`${super.player_two_name} has gained a power point!`, super.player_two, `Total PowerPoints: ${this.player_two_power_points}`);
    }

    player_one_serve(msg) {
        if (super.is_player_one(msg.author)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                this.player_one_reduce_the_threshold(msg);
            } else if (response == "p") {
                this.player_one_press_the_advantage(msg);
            } else {
                const serve_value = parseInt(response, 10);
                if (serve_value >= 5 && serve_value <= 10) {
                    const threshold = this.reduce_the_threshold ? Math.max(1, serve_value - 5) : serve_value;
                    const roll = d20();
                    if (roll > 15 && this.player_one_power_points < 2) this.award_power_point_to_player_one();
                    if (roll >= threshold) {
                        msg.reply(`Congratulations, you needed ${threshold}, and you rolled a ${roll} 🎲!`);
                        this.rally_value = this.press_the_advantage ? serve_value + 5 : serve_value;
                        this.ask_player_two_to_rally();
                    } else {
                        msg.reply(`Unfortunately, you needed ${threshold}, you rolled a ${roll} and a point is awarded to the opposing player`);
                        this.give_point_to_player_two();
                    }
                } else {
                    msg.reply("You must choose a value between 5 and 10");
                }
            }
        }
    }

    player_two_serve(msg) {
        if (super.is_player_two(msg.author)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                this.player_two_reduce_the_threshold(msg);
            } else if (response == "p") {
                this.player_two_press_the_advantage(msg);
            } else {
                const serve_value = parseInt(response, 10);
                if (serve_value >= 5 && serve_value <= 10) {
                    const threshold = this.reduce_the_threshold ? Math.max(1, serve_value - 5) : serve_value;
                    const roll = d20();
                    if (roll > 15 && this.player_two_power_points < 2) this.award_power_point_to_player_two();
                    if (roll >= threshold) {
                        msg.reply(`Congratulations, you needed ${threshold}, and you rolled a ${roll}!`);
                        this.rally_value = this.press_the_advantage ? serve_value + 5 : serve_value;
                        this.ask_player_one_to_rally();
                    } else {
                        msg.reply(`Unfortunately, you needed ${threshold}, you rolled a ${roll}, and a point is awarded to the opposing player`);
                        this.give_point_to_player_one();
                    }
                } else {
                    msg.reply("You must choose a value between 5 and 10");
                }
            }
        }
    }

    ask_player_one_to_rally() {
        super.user_embed(`Now ${super.player_one_name} must roll ${this.rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.\n\nYou can also use a PowerPoint to reduce the threshold of your shot (R) or add to the power of your shot (P)`, super.player_one, `Total PowerPoints: ${this.player_one_power_points}`);
        this.state = this.player_one_rally;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    ask_player_two_to_rally() {
        super.user_embed(`Now ${super.player_two_name} must roll ${this.rally_value} or higher to return the shot plus an additional value for their shot. Choose from straight (A), top-spin (B), slice (C), and dropshot (D), the values for these shots are 3, 5, 8, 10 respectively.\n\nYou can also use a PowerPoint to reduce the threshold of your shot (R) or add to the power of your shot (P)`, super.player_two, `Total PowerPoints: ${this.player_two_power_points}`);
        this.state = this.player_two_rally;
        this.reduce_the_threshold = false;
        this.press_the_advantage = false;
    }

    player_one_reduce_the_threshold(msg) {
        if (this.reduce_the_threshold || this.press_the_advantage) {
            msg.reply("You have already used a PowerPoint on this turn!");
        } else {
            if (this.player_one_power_points) {
                this.player_one_power_points -= 1;
                msg.reply("You have used one of your PowerPoints to reduce the threshold of your shot by 5.");
                this.reduce_the_threshold = true;
            } else {
                msg.reply("You don't have any PowerPoints to use!");
            }
        }
    }

    player_one_press_the_advantage(msg) {
        if (this.reduce_the_threshold || this.press_the_advantage) {
            msg.reply("You have already used a PowerPoint on this turn!");
        } else {
            if (this.player_one_power_points) {
                this.player_one_power_points -= 1;
                msg.reply("You have used one of your PowerPoints to add 5 to the power of your shot!");
                this.press_the_advantage = true;
            } else {
                msg.reply("You don't have any PowerPoints to use!");
            }
        }
    }

    player_two_reduce_the_threshold(msg) {
        if (this.reduce_the_threshold || this.press_the_advantage) {
            msg.reply("You have already used a PowerPoint on this turn!");
        } else {
            if (this.player_two_power_points) {
                this.player_two_power_points -= 1;
                msg.reply("You have used one of your PowerPoints to reduce the threshold of your shot by 5.");
                this.reduce_the_threshold = true;
            } else {
                msg.reply("You don't have any PowerPoints to use!");
            }
        }
    }

    player_two_press_the_advantage(msg) {
        if (this.reduce_the_threshold || this.press_the_advantage) {
            msg.reply("You have already used a PowerPoint on this turn!");
        } else {
            if (this.player_two_power_points) {
                this.player_two_power_points -= 1;
                msg.reply("You have used one of your PowerPoints to add 5 to the power of your shot!");
                this.press_the_advantage = true;
            } else {
                msg.reply("You don't have any PowerPoints to use!");
            }
        }
    }

    player_one_rally(msg) {
        if (super.is_player_one(msg.author)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                this.player_one_reduce_the_threshold(msg);
            } else if (response == "p") {
                this.player_one_press_the_advantage(msg);
            } else {
                const option = option_to_value(response);
                if (option) {
                    const roll = d20();
                    let threshold = Math.min(this.rally_value + option, 20);
                    if (this.reduce_the_threshold) threshold = Math.max(1, threshold - 5);
                    if (roll >= threshold) {
                        msg.reply(`You needed ${threshold} and rolled a ${roll} and returned the shot`);
                        if (roll > 15 && this.player_one_power_points < 2) this.award_power_point_to_player_one();
                        this.rally_value = this.press_the_advantage ? option + 5 : option;
                        this.ask_player_two_to_rally();
                    } else {
                        msg.reply(`Unfortunately you needed ${threshold} and rolled a ${roll}.`);
                        this.give_point_to_player_two();
                    }
                } else {
                    msg.reply("Please choose an option A, B, C, or D.");
                }
            }
        }
    }

    player_two_rally(msg) {
        if (super.is_player_two(msg.author)) {
            const response = msg.cleanContent.toLowerCase();
            if (response == "r") {
                this.player_two_reduce_the_threshold(msg);
            } else if (response == "p") {
                this.player_two_press_the_advantage(msg);
            } else {
                const option = option_to_value(response);
                if (option) {
                    const roll = d20();
                    let threshold = Math.min(this.rally_value + option, 20);
                    if (this.reduce_the_threshold) threshold = Math.max(1, threshold - 5);
                    if (roll >= threshold) {
                        msg.reply(`You needed ${threshold} and rolled a ${roll} and returned the shot`);
                        if (roll > 15 && this.player_two_power_points < 2) this.award_power_point_to_player_two();
                        this.rally_value = this.press_the_advantage ? option + 5 : option;
                        this.ask_player_one_to_rally();
                    } else {
                        msg.reply(`Unfortunately you needed ${threshold} and rolled a ${roll}.`);
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
            super.user_embed(`${super.player_one_name} has won the game! Well Done!`, super.player_one);
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
            super.user_embed(`${this.player_two_name} has won the game! Well Done!`, super.player_two);
            super.end();
        } else {
            this.show_score();
            this.ask_player_two_to_serve();
        }
    }

    constructor(client, channel) {
        super(client, channel);
        this.player_one_score = 0;
        this.player_one_power_points = 0;
        this.player_two_score = 0;
        this.player_two_power_points = 0;
        this.rally_value = 0;
    }

    add_player(player) {
        super.add_player(player);
        switch (super.number_of_players) {
        case 1: super.start_timer(30); break;
        case 2: this.start(); break;
        }
    }

    start() {
        super.start(GAME_NAME, GAME_URL, EMBED_COLOR, "Let's start Wimbledungeons: The D&D Tennis Game for Discord!");
        this.ask_player_one_to_serve();
    }

    rules() {
        super.show_file(GAME_NAME, GAME_URL, EMBED_COLOR, GAME_RULES);
    }

    help() {
        super.show_file(GAME_NAME, GAME_URL, EMBED_COLOR, GAME_HELP);
    }
}

module.exports = {WimbleDungeonsGame};
