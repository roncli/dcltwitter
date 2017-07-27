const {fork} = require("child_process");

//   ###              #
//    #               #
//    #    # ##    ## #   ###   #   #
//    #    ##  #  #  ##  #   #   # #
//    #    #   #  #   #  #####    #
//    #    #   #  #  ##  #       # #
//   ###   #   #   ## #   ###   #   #
/**
 * The entry point to the application.
 */
class Index {
    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###
    // ##      #    #  #  #  #   #
    //   ##    #    # ##  #      #
    // ###      ##   # #  #       ##
    /**
     * A static function that starts the application, and runs it every 5 minutes.
     * @return {void}
     */
    static start() {
        const update = fork("update.js");
        update.send("start");
        setTimeout(Index.start, 300000);
    }
}

Index.start();
