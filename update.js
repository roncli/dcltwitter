const {get} = require("http"),
    {JSDOM} = require("jsdom"),
    Twitter = require("twitter"),
    $ = require("jquery")(new JSDOM().window),
    db = require("./database"),
    {twitter} = require("./settings"),
    viewMatchRegex = /view_match\.php\?id=(\d+)/,
    dominationMatrix = {
        "bronze-unrated": 10,
        "bronze-bronze": 10,
        "bronze-silver": 10,
        "bronze-gold": 10,
        "bronze-diamond": 10,
        "silver-unrated": 5,
        "silver-bronze": 5,
        "silver-silver": 10,
        "silver-gold": 10,
        "silver-diamond": 10,
        "gold-unrated": 0,
        "gold-bronze": 0,
        "gold-silver": 5,
        "gold-gold": 10,
        "gold-diamond": 10,
        "diamond-unrated": 0,
        "diamond-bronze": 0,
        "diamond-silver": 5,
        "diamond-gold": 10,
        "diamond-diamond": 10,
        "unrated-unrated": 0,
        "unrated-bronze": 0,
        "unrated-silver": 5,
        "unrated-gold": 10,
        "unrated-diamond": 10
    },
    threatMatrix = {
        "bronze-unrated": false,
        "bronze-bronze": false,
        "bronze-silver": false,
        "bronze-gold": false,
        "bronze-diamond": false,
        "silver-unrated": false,
        "silver-bronze": true,
        "silver-silver": false,
        "silver-gold": false,
        "silver-diamond": false,
        "gold-unrated": false,
        "gold-bronze": true,
        "gold-silver": true,
        "gold-gold": false,
        "gold-diamond": false,
        "diamond-unrated": false,
        "diamond-bronze": true,
        "diamond-silver": true,
        "diamond-gold": true,
        "diamond-diamond": false,
        "unrated-unrated": false,
        "unrated-bronze": false,
        "unrated-silver": false,
        "unrated-gold": false,
        "unrated-diamond": false
    },
    darkHorseMatrix = {
        "bronze-unrated": false,
        "bronze-bronze": false,
        "bronze-silver": true,
        "bronze-gold": true,
        "bronze-diamond": true,
        "silver-unrated": false,
        "silver-bronze": false,
        "silver-silver": false,
        "silver-gold": true,
        "silver-diamond": true,
        "gold-unrated": false,
        "gold-bronze": false,
        "gold-silver": false,
        "gold-gold": false,
        "gold-diamond": true,
        "diamond-unrated": false,
        "diamond-bronze": false,
        "diamond-silver": false,
        "diamond-gold": false,
        "diamond-diamond": false,
        "unrated-unrated": false,
        "unrated-bronze": false,
        "unrated-silver": false,
        "unrated-gold": false,
        "unrated-diamond": false
    };

//  #   #             #          #
//  #   #             #          #
//  #   #  # ##    ## #   ###   ####    ###
//  #   #  ##  #  #  ##      #   #     #   #
//  #   #  ##  #  #   #   ####   #     #####
//  #   #  # ##   #  ##  #   #   #  #  #
//   ###   #       ## #   ####    ##    ###
//         #
//         #
/**
 * Updates the DCL Twitter account with the latest matches.
 */
class Update {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new instance of the DCL Twitter update class.
     */
    constructor() {
        this.maxId = 0;
        this.minId = Infinity;
        this.lastMatchId = 0;
        this.gamesToPost = {};
    }

    //              #    ###
    //              #    #  #
    //  ###   ##   ###   #  #   ###   ###   ##
    // #  #  # ##   #    ###   #  #  #  #  # ##
    //  ##   ##     #    #     # ##   ##   ##
    // #      ##     ##  #      # #  #      ##
    //  ###                           ###
    /**
     * Gets the next page of stats.
     * @param {number} pageId The 0-based page ID to start from.  Will recurse until it exceeds the lastMatchId property, which must be set prior to this call.
     * @return {Promise} A promise that resolves when all pages have been retrieved.  The gamesToPost property will then contain all of the matches that need posting.
     */
    getPage(pageId) {
        const update = this;

        return new Promise((resolve, reject) => {
            get(`http://descentchampions.org/recent_matches.php?page=${pageId}`, (res) => {
                let body = "";

                res.on("data", (data) => {
                    body += data;
                });

                res.on("end", () => {
                    body = `<div>${body.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig, "")}</div>`;

                    $(body).find(".content > a[href^=view_match]")
                        .each((index, el) => {
                            const game = $(el),
                                match = viewMatchRegex.exec(game.attr("href"));

                            if (match && match[1]) {
                                const gameId = match[1];

                                update.maxId = Math.max(update.maxId, gameId);
                                update.minId = Math.min(update.minId, gameId);

                                if (gameId > this.lastMatchId) {
                                    const leftScore = +game.find(".left_player .score").text(),
                                        rightScore = +game.find(".right_player .score").text(),
                                        leftTier = game.find(".left_player:first() > span:last()").attr("class"),
                                        rightTier = game.find(".right_player:first() > span:first()").attr("class"),
                                        leftRank = game.find(".left_player .rank_badge").text().substring(2),
                                        rightRank = game.find(".right_player .rank_badge").text().substring(2),
                                        tiers = `${leftTier}-${rightTier}`,
                                        suicides = game.find("td[colspan=2] span:not([class])").text();

                                    let tags = "";

                                    // Overtime
                                    if (leftScore > 20) {
                                        tags += " #overtime";
                                    }

                                    // Domination
                                    if (dominationMatrix[tiers] && rightScore <= dominationMatrix[tiers]) {
                                        tags += " #domination";
                                    }

                                    // Shutout
                                    if (rightScore <= 0) {
                                        tags += " #shutout";
                                    }

                                    // Threat
                                    if (threatMatrix[tiers] && rightScore >= 15) {
                                        tags += " #threat";
                                    }

                                    // Dark Horse
                                    if (darkHorseMatrix[tiers]) {
                                        tags += " #darkhorse";
                                    }

                                    // Bus Driver
                                    if (!game.find(".home:last()").is(".hide_home")) {
                                        tags += " #busdriver";
                                    }

                                    // Home Defense
                                    if (!game.find(".home:first()").is(".hide_home")) {
                                        tags += " #homedefense";
                                    }

                                    // Trophies
                                    switch (game.find(".trophy_icon").attr("src")) {
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
                                            switch (game.find("td.events:first()").text()) {
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

                                    update.gamesToPost[gameId] = `${leftTier.replace(leftTier[0], leftTier[0].toUpperCase())} ${leftRank.length === 0 ? "" : `${leftRank}) `}${game.find(".left_player .pilot_name").text()} def. ${rightTier.replace(rightTier[0], rightTier[0].toUpperCase())} ${rightRank.length === 0 ? "" : `${rightRank}) `}${game.find(".right_player .pilot_name").text()} ${leftScore} to ${rightScore}${suicides === "" ? "" : ` w/ ${game.find("span:not([class]):first()").text()}`} ${game.find(".level_name").text()}${tags === "" ? "" : tags} http://descentchampions.org/${game.attr("href")}`;
                                }
                            }
                        });

                    if (update.minId > update.lastMatchId) {
                        update.getPage(pageId + 1).then(resolve)
                            .catch(reject);
                    } else {
                        resolve();
                    }
                });
            }).on("error", (err) => {
                reject(err);
            });
        });
    }

    //  #                       #
    //  #                       #
    // ###   #  #   ##    ##   ###
    //  #    #  #  # ##  # ##   #
    //  #    ####  ##    ##     #
    //   ##  ####   ##    ##     ##
    /**
     * Tweets out matches.
     * @return {void}
     */
    tweet() {
        const update = this,
            client = new Twitter(twitter);

        Object.keys(update.gamesToPost).forEach((index) => {
            client.post("statuses/update", {status: update.gamesToPost[index]});
        });
    }
}

process.on("message", () => {
    const update = new Update();

    db.query("SELECT MatchID FROM tblLastMatch").then((data) => {
        ({recordset: [{MatchID: update.lastMatchId}]} = data);
    })
        .then(() => update.getPage(0))
        .then(() => update.tweet())
        .then(() => db.query("UPDATE tblLastMatch SET MatchID = @matchId", {matchId: {type: db.INT, value: update.maxId}}))
        .catch(console.log);
});
