const {fork} = require("child_process"),
    start = () => {
        const update = fork("update.js");
        update.send({"start": 13900});
        setTimeout(start, 300000);
    };

start();
