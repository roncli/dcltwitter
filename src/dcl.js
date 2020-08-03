/**
 * @typedef {{gameId: number, leftName: string, rightName: string, leftScore: number, rightScore: number, leftTier: string, rightTier: string, leftRank: string, rightRank: string, leftHome: boolean, rightHome: boolean, suicides: string, level: string, trophy: string, subgame: string}} Game
 */

const jsdom = require("jsdom"),
    jquery = require("jquery"),
    request = require("@root/request"),

    $ = jquery(new jsdom.JSDOM().window),

    viewMatchRegex = /view_match\.php\?id=(?<id>\d+)/,

    dominationMatrix = {
        "bronze-unrated": 10,
        "bronze-bronze": 10,
        "bronze-silver": 10,
        "bronze-gold": 10,
        "bronze-diamond": 10,
        "bronze-retired": -99999,
        "silver-unrated": 5,
        "silver-bronze": 5,
        "silver-silver": 10,
        "silver-gold": 10,
        "silver-diamond": 10,
        "silver-retired": -99999,
        "gold-unrated": 0,
        "gold-bronze": 0,
        "gold-silver": 5,
        "gold-gold": 10,
        "gold-diamond": 10,
        "gold-retired": -99999,
        "diamond-unrated": 0,
        "diamond-bronze": 0,
        "diamond-silver": 5,
        "diamond-gold": 10,
        "diamond-diamond": 10,
        "diamond-retired": -99999,
        "unrated-unrated": 0,
        "unrated-bronze": 0,
        "unrated-silver": 5,
        "unrated-gold": 10,
        "unrated-diamond": 10,
        "unrated-retired": -99999,
        "retired-unrated": -99999,
        "retired-bronze": -99999,
        "retired-silver": -99999,
        "retired-gold": -99999,
        "retired-diamond": -99999,
        "retired-retired": -99999
        
    },
    threatMatrix = {
        "bronze-unrated": false,
        "bronze-bronze": false,
        "bronze-silver": false,
        "bronze-gold": false,
        "bronze-diamond": false,
        "bronze-retired": false,
        "silver-unrated": false,
        "silver-bronze": true,
        "silver-silver": false,
        "silver-gold": false,
        "silver-diamond": false,
        "silver-retired": false,
        "gold-unrated": false,
        "gold-bronze": true,
        "gold-silver": true,
        "gold-gold": false,
        "gold-diamond": false,
        "gold-retired": false,
        "diamond-unrated": false,
        "diamond-bronze": true,
        "diamond-silver": true,
        "diamond-gold": true,
        "diamond-diamond": false,
        "diamond-retired": false,
        "unrated-unrated": false,
        "unrated-bronze": false,
        "unrated-silver": false,
        "unrated-gold": false,
        "unrated-diamond": false,
        "unrated-retired": false,
        "retired-unrated": false,
        "retired-bronze": false,
        "retired-silver": false,
        "retired-gold": false,
        "retired-diamond": false,
        "retired-retired": false
    },
    darkHorseMatrix = {
        "bronze-unrated": false,
        "bronze-bronze": false,
        "bronze-silver": true,
        "bronze-gold": true,
        "bronze-diamond": true,
        "bronze-retired": false,
        "silver-unrated": false,
        "silver-bronze": false,
        "silver-silver": false,
        "silver-gold": true,
        "silver-diamond": true,
        "silver-retired": false,
        "gold-unrated": false,
        "gold-bronze": false,
        "gold-silver": false,
        "gold-gold": false,
        "gold-diamond": true,
        "gold-retired": false,
        "diamond-unrated": false,
        "diamond-bronze": false,
        "diamond-silver": false,
        "diamond-gold": false,
        "diamond-diamond": false,
        "diamond-retired": false,
        "unrated-unrated": false,
        "unrated-bronze": false,
        "unrated-silver": false,
        "unrated-gold": false,
        "unrated-diamond": false,
        "unrated-retired": false,
        "retired-unrated": false,
        "retired-bronze": false,
        "retired-silver": false,
        "retired-gold": false,
        "retired-diamond": false,
        "retired-retired": false
    };

//  ####    ###   #
//   #  #  #   #  #
//   #  #  #      #
//   #  #  #      #
//   #  #  #      #
//   #  #  #   #  #
//  ####    ###   #####
/**
 * A class to handle HTTP requests to the DCL.
 */
class DCL {
    //              #     ##
    //              #    #  #
    //  ###   ##   ###   #      ###  # #    ##    ###
    // #  #  # ##   #    # ##  #  #  ####  # ##  ##
    //  ##   ##     #    #  #  # ##  #  #  ##      ##
    // #      ##     ##   ###   # #  #  #   ##   ###
    //  ###
    /**
     * Gets a page of data from the DCL and converts it into game objects.
     * @param {number} sinceGameId The game ID to get games since.
     * @param {number} [pageId] The page ID to get.
     * @returns {Game[]} An array of game objects.
     */
    static async getGames(sinceGameId, pageId = 0) {
        const res = await request(`http://descentchampions.org/test/recent_matches.php?page=${pageId}`),
            body = `<div>${res.body.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig, "")}</div>`,
            games = [];

        let noMoreGames = false;

        $(body).find(".content > a[href^=view_match]").each((index, el) => {
            const game = $(el),
                href = game.attr("href");

            if (!viewMatchRegex.test(href)) {
                return;
            }

            const {groups: {id}} = viewMatchRegex.exec(href),
                gameId = +id;

            if (gameId > sinceGameId) {
                const leftTier = game.find(".left_player:first() > span:last()").attr("class"),
                    rightTier = game.find(".right_player:first() > span:first()").attr("class");

                games.push({
                    gameId,
                    leftName: game.find(".left_player .pilot_name").text(),
                    rightName: game.find(".right_player .pilot_name").text(),
                    leftScore: +game.find(".left_player .score").text(),
                    rightScore: +game.find(".right_player .score").text(),
                    leftTier: leftTier === "retired" ? "" : leftTier,
                    rightTier: rightTier === "retired" ? "" : rightTier,
                    leftRank: game.find(".left_player .rank_badge").text().substring(2),
                    rightRank: game.find(".right_player .rank_badge").text().substring(2),
                    leftHome: !game.find(".home:first()").is(".hide_home"),
                    rightHome: !game.find(".home:last()").is(".hide_home"),
                    suicides: game.find("td[colspan=2] span:not([class])").text(),
                    level: game.find(".level_name").text(),
                    trophy: game.find(".trophy_icon").attr("src"),
                    subgame: game.find("td.events:first()").text()
                });
            } else {
                noMoreGames = true;
            }
        });

        if (!noMoreGames) {
            games.push(...await DCL.getGames(sinceGameId, pageId + 1));
        }

        return games.sort((a, b) => a.gameId - b.gameId);
    }

    //              #     ##    #           #
    //              #    #  #   #           #
    //  ###   ##   ###    #    ###    ###  ###   #  #   ###
    // #  #  # ##   #      #    #    #  #   #    #  #  ##
    //  ##   ##     #    #  #   #    # ##   #    #  #    ##
    // #      ##     ##   ##     ##   # #    ##   ###  ###
    //  ###
    /**
     * Gets the text of the status of a game.
     * @param {Game} game The game.
     * @returns {string} The text of the status of the game.
     */
    static getStatus(game) {
        const tiers = `${game.leftTier}-${game.rightTier}`;
        let tags = "";

        // Overtime
        if (game.leftScore > 20) {
            tags += " #overtime";
        }

        // Domination
        if (dominationMatrix[tiers] && game.rightScore <= dominationMatrix[tiers]) {
            tags += " #domination";
        }

        // Shutout
        if (game.rightScore <= 0) {
            tags += " #shutout";
        }

        // Threat
        if (threatMatrix[tiers] && game.rightScore >= 15) {
            tags += " #threat";
        }

        // Dark Horse
        if (darkHorseMatrix[tiers]) {
            tags += " #darkhorse";
        }

        // Bus Driver
        if (game.rightHome) {
            tags += " #busdriver";
        }

        // Home Defense
        if (game.leftHome) {
            tags += " #homedefense";
        }

        // Trophies
        switch (game.trophy) {
            case "img/awards/trophies/disorient_trophy.png":
                tags += " #disorienttrophy";
                break;
            case "img/awards/trophies/dog_trophy.png":
                tags += " #dogtrophy";
                break;
            case "img/awards/trophies/rat_trophy.png":
                tags += " #rattrophy";
                break;
            case "img/awards/trophies/blind_trophy.png":
                tags += " #blindtrophy";
                break;
            case "img/awards/trophies/fusion_trophy.png":
                tags += " #fusiontrophy";
                break;
            case "img/awards/trophies/d2_trophy.png":
                tags += " #d2trophy";
                break;
            case "img/awards/trophies/x4_trophy.png":
                tags += " #x4trophy";
                break;
            default:
                // Subgame
                switch (game.subgame) {
                    case "Blind":
                        tags += " #blind";
                        break;
                    case "Disorientation":
                        tags += " #disorientation";
                        break;
                    case "Dogfighting":
                        tags += " #dogfighting";
                        break;
                    case "Fusion":
                        tags += " #fusion";
                        break;
                    case "Gauss'nMercs":
                        tags += " #gaussnmercs";
                        break;
                    case "Megas / Shakers":
                        tags += " #megasshakers";
                        break;
                    case "Ratting":
                        tags += " #ratting";
                        break;
                }
        }

        return `${game.leftTier.replace(/^./, game.leftTier[0].toUpperCase())} ${game.leftRank.length === 0 ? "" : `${game.leftRank}) `}${game.leftName} def. ${game.rightTier.replace(/^./, game.rightTier[0].toUpperCase())} ${game.rightRank.length === 0 ? "" : `${game.rightRank}) `}${game.rightName} ${game.leftScore} to ${game.rightScore}${game.suicides === "" ? "" : ` w/ ${game.suicides}`} ${game.level}${tags} http://descentchampions.org/view_match.php?id=${game.gameId}`;
    }
}

module.exports = DCL;
