const msRestNodeAuth = require("@azure/ms-rest-nodeauth"),
    armAppService = require("@azure/arm-appservice");

//    #    ####   #   #
//   # #   #   #  #   #
//  #   #  #   #  ## ##
//  #   #  ####   # # #
//  #####  # #    #   #
//  #   #  #  #   #   #
//  #   #  #   #  #   #
/**
 * A class of functions to interact with the Azure Resource Manager API.
 */
class ARM {
    //                #         #           ##          #     #     #
    //                #         #          #  #         #     #
    // #  #  ###    ###   ###  ###    ##    #     ##   ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #   #    # ##    #   # ##   #     #     #    #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  ##     #     #     #    #  #   ##
    //  ###  ###    ###   # #    ##   ##    ##    ##     ##    ##  ###   #  #  #
    //       #                                                                  ###
    /**
     * Updates a setting through the Azure Resource Manager API.
     * @param {string} key The key.
     * @param {string} value The value.
     * @returns {Promise} A promise that resolves when the setting has been updated.
     */
    static async updateSetting(key, value) {
        const credentials = await msRestNodeAuth.loginWithServicePrincipalSecret(process.env.AzureClientId, process.env.AzureSecret, process.env.AzureDomain);

        const client = new armAppService.WebSiteManagementClient(credentials, process.env.AzureSubscriptionId);

        const settings = await client.webApps.listApplicationSettings("dcltwitter", "dcltwitter");

        const properties = settings.properties;

        properties[key] = value;

        await client.webApps.updateApplicationSettings("dcltwitter", "dcltwitter", {properties});
    }
}

module.exports = ARM;
