const settings = require("./settings"),
    sql = require("mssql");

//  ####           #            #
//   #  #          #            #
//   #  #   ###   ####    ###   # ##    ###    ###    ###
//   #  #      #   #         #  ##  #      #  #      #   #
//   #  #   ####   #      ####  #   #   ####   ###   #####
//   #  #  #   #   #  #  #   #  ##  #  #   #      #  #
//  ####    ####    ##    ####  # ##    ####  ####    ###
/**
 * Defines the database class.
 */
class Database {
    //  ###  #  #   ##   ###   #  #
    // #  #  #  #  # ##  #  #  #  #
    // #  #  #  #  ##    #      # #
    //  ###   ###   ##   #       #
    //    #                     #
    /**
     * Executes a query.
     * @param {string} sqlStr The SQL query.
     * @param {object} params The parameters of the query.
     * @return {Promise} A promise that resolves when the query is complete.
     */
    static query(sqlStr, params) {
        return new Promise((resolve, reject) => {
            if (!params) {
                params = {};
            }

            const conn = new sql.Connection(settings.database, (err) => {
                const paramKeys = Object.keys(params);

                if (err) {
                    reject(err);
                    return;
                }

                const ps = new sql.PreparedStatement(conn);
                paramKeys.forEach((key) => {
                    ps.input(key, params[key].type);
                });
                ps.multiple = true;
                ps.prepare(sqlStr, (errPrepare) => {
                    if (errPrepare) {
                        reject(errPrepare);
                        return;
                    }

                    ps.execute(paramKeys.reduce((acc, key) => {
                        ({[key]: {value: acc[key]}} = params);

                        return acc;
                    }, {}), (errExecute, data) => {
                        if (errExecute) {
                            reject(errExecute);
                            return;
                        }

                        ps.unprepare((errUnprepare) => {
                            if (err) {
                                reject(errUnprepare);
                                return;
                            }

                            resolve(data);
                        });
                    });
                });
            });
        });
    }
}

({TYPES: Database.TYPES} = sql);

Object.keys(sql.TYPES).forEach((key) => {
    ({TYPES: {[key]: Database[key]}} = sql);
    ({TYPES: {[key]: Database[key.toUpperCase()]}} = sql);
});

module.exports = Database;
