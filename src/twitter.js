const Twitter = require("twitter-lite");

/** @type {Twitter} */
let client;

//  #####           #     #      #
//    #                   #      #
//    #    #   #   ##    ####   ####    ###   # ##
//    #    #   #    #     #      #     #   #  ##  #
//    #    # # #    #     #      #     #####  #
//    #    # # #    #     #  #   #  #  #      #
//    #     # #    ###     ##     ##    ###   #
/**
 * A class to handle posting to Twitter.
 */
class TwitterPost {
    //                     #
    //                     #
    // ###    ##    ###   ###
    // #  #  #  #  ##      #
    // #  #  #  #    ##    #
    // ###    ##   ###      ##
    // #
    /**
     * Posts a status to Twitter.
     * @param {string} status The status to post.
     * @returns {Promise} A promise that resolves when the status has been posted to Twitter.
     */
    static async post(status) {
        if (!client) {
            client = new Twitter({
                "consumer_key": process.env.TwitterConsumerKey,
                "consumer_secret": process.env.TwitterConsumerSecret,
                "access_token_key": process.env.TwitterAccessTokenKey,
                "access_token_secret": process.env.TwitterAccessTokenSecret
            });
        }

        await client.post("statuses/update", {status});
    }
}

module.exports = TwitterPost;
