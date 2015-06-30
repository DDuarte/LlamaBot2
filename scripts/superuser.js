module.exports = function(robot) {
    if (robot.brain.data["uac"] === undefined)
        robot.brain.data["uac"] = { subv: 2, nayd: 1, warpten: 1 };

    robot.getLevel = function(u) {
       return robot.brain.data["uac"][u.toLowerCase()];
    };
    robot.IsSuperuser = function(u) { return robot.getLevel(u) === 1; };
    robot.IsOwner     = function(u) { return robot.getLevel(u) === 2; };
    robot.IsOperator  = function(u) { return robot.IsOwner(u) || robot.IsSuperuser(u); };

    robot.respond(/autocommit(?: (.+))?/i, function(msg) {
        if (!robot.IsOperator(msg.message.user.name))
            return msg.reply("Not enough rights");

        var git = require("gitty"), git = git("./");
        git.addSync([ "." ]);
        git.commitSync((msg.match[1] || "Auto self-update.") + "\r\n\r\nTriggered by " + msg.message.user.name);
        git.push('origin', 'master', { username: process.env.HUBOT_GITHUB_USER, password: process.env.HUBOT_GITHUB_PASSWORD }, function(error, stdout) {
            msg.reply(error || "Self-repository updated");
        });
    });
    return robot.respond(/(de)?op (.+)/i, function(msg) {
        var u = msg.match[2];
        if (msg.message.user.name.toLowerCase() == u.toLowerCase())
            return;
        if (!robot.IsOperator(msg.message.user.name))
            return msg.reply("You are not a bot operator");
        if (robot.getLevel(u) > robot.getLevel(msg.message.user.name))
            return msg.reply("Not enough rights.");

        robot.brain.data["uac"][u.toLowerCase()] = msg.match[1]=="de" ? 0 : 1;
        msg.send(u + " is " + (msg.match[1]=="de"?"no longer":"now")+" bot operator.");
    });
};
