var oldHndle = null;
module.exports = function(robot) {
    oldHndle = oldHndle || robot.adapter.bot._events.message;
    robot.brain.data["ignoredusers"] = robot.brain.data["ignoredusers"] || [];

    // This is an awful hack
    robot.adapter.bot._events.message = function(from, to, message) {
        robot.brain.data.history = robot.brain.data.history || { };
        if (to[0] == "#" && !(to in robot.brain.data.history))
            robot.brain.data.history[to] = [];
        if (!/rewind [0-9]+$/i.test(message))
            robot.brain.data.history[to].push("<"+from+"> "+message);
        robot.brain.data.history[to].splice(0, robot.brain.data.history[to].length - 10);

        if (!robot.IsOperator(from.toLowerCase())) {
            if (robot.brain.data["ignoredusers"].indexOf(from.toLowerCase()) !== -1)
                return console.log(from, "is ignored.");

            for (var i = 0; i < robot.brain.data["ignoredusers"].length; ++i)
                if (new RegExp(robot.brain.data["ignoredusers"][i], "i").test(from.toLowerCase()))
                    return console.log(from, "matched filter", new RegExp(robot.brain.data["ignoredusers"][i]), "ignoring message");
        }

        oldHndle(from, to, message);
    };

    robot.respond(/rewind ([0-9]+)/i, function(msg) {
        for (var i = Math.min(10, parseInt(msg.match[1])); i > 0; --i)
            msg.send(robot.brain.data.history[msg.message.user.room][i]);
    });

    robot.respond(/ignorelist/i, function(msg) {
        msg.reply(robot.brain.data["ignoredusers"].join(", "));
    });

    robot.respond(/ignoreclear/i, function(msg) {
       if (!robot.IsOperator(msg.message.user.name.toLowerCase()))
           return msg.reply("Not enough rights.");
       robot.brain.data["ignoredusers"] = [];
       msg.reply("Ignores cleared.");
    });

    robot.respond(/(de|un)?ignore (.+)/i, function(msg) {
        if (!robot.IsOperator(msg.message.user.name.toLowerCase()))
            return msg.reply("Not enough rights.");

        if (robot.IsOperator(msg.match[2].toLowerCase()) && msg.match[1] == undefined)
            return msg.reply("Can't ignore operators.");

        var index = robot.brain.data["ignoredusers"].indexOf(msg.match[2].toLowerCase());

        if (msg.match[1] !== undefined) {
            if (index >= 0) {
                robot.brain.data["ignoredusers"].splice(index, 1);
                return msg.reply(msg.match[2] + " is no longer ignored.");
            }
            msg.reply("That nick was not ignored.");
            return;
        }
        if (index >= 0)
            return msg.reply("That nick is already ignored.");
        robot.brain.data["ignoredusers"].push(msg.match[2].toLowerCase());
        msg.reply(msg.match[2] + ' is now ignored.');
    });

    return robot.respond(/(join|leave|part)(?: #(.+)(?: (.+)){0,1})?/i, function(msg) {
        var target = msg.match[2] != null ? ("#" + msg.match[2]) : msg.message.user.room,
            isJoin = msg.match[1] == "join",
            key = msg.match[3] || null;
        if (!robot.IsOperator(msg.message.user.name.toLowerCase()))
            return;

        if (!isJoin)
            return robot.adapter.part(target);
        if (key === null)
            robot.adapter.join(target);
        robot.adapter.join(target + " " +  key);
    });
}


