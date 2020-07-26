const ARM = require("../src/arm"),
    DCL = require("../src/dcl"),
    Kudu = require("../src/kudu"),
    Twitter = require("../src/twitter");

module.exports = async (context, trigger) => {
    context.log.info("Starting DCL Twitter.");

    if (trigger.IsPastDue) {
        context.log.warn("Trigger started late.");
    }

    const lastId = +process.env.LastId,
        games = await DCL.getGames(lastId);
    if (games.length === 0) {
        context.log.info("No games found.  DCL Twitter completed.");
        return;
    }
    context.log.info(`Received ${games.length} game${games.length === 1 ? "" : "s"} from DCL.`);

    for (const game of games) {
        context.log.info(`Posting game ID ${game.gameId}.`);
        await Twitter.post(DCL.getStatus(game));
    }
    context.log.info("Posting to Twitter complete.");

    process.env.LastId = `${games[games.length - 1].gameId}`;
    context.log.info(`Setting the last ID to ${process.env.LastId}.`);

    await ARM.updateSetting("LastId", process.env.LastId);
    await Kudu.updateSetting("LastId", process.env.LastId);
    context.log.info("DCL Twitter completed.");
};
