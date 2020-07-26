const request = require("@root/request");

//  #   #             #
//  #  #              #
//  # #    #   #   ## #  #   #
//  ##     #   #  #  ##  #   #
//  # #    #   #  #   #  #   #
//  #  #   #  ##  #  ##  #  ##
//  #   #   ## #   ## #   ## #
/**
 * A class of functions to interact with the Kudu API.
 */
class Kudu {
    //                #         #           ##          #     #     #
    //                #         #          #  #         #     #
    // #  #  ###    ###   ###  ###    ##    #     ##   ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #   #    # ##    #   # ##   #     #     #    #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  ##     #     #     #    #  #   ##
    //  ###  ###    ###   # #    ##   ##    ##    ##     ##    ##  ###   #  #  #
    //       #                                                                  ###
    /**
     * Updates a setting through the Kudu API.
     * @param {string} key The key.
     * @param {string} value The value.
     * @returns {Promise} A promise that resolves when the setting has been updated.
     */
    static async updateSetting(key, value) {
        const body = {};

        body[key] = value;

        await request({
            method: "POST",
            url: "https://dcltwitter.scm.azurewebsites.net/api/settings",
            body,
            json: true,
            auth: {
                username: process.env.KuduUsername,
                password: process.env.KuduPassword
            }
        });
    }
}

module.exports = Kudu;
