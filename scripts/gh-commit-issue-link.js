module.exports = function(robot) {
    var github = require("githubot")(robot);
    return robot.hear(/TC#([a-f0-9]+)/i, function(msg) {
        var repo = github.qualified_repo(process.env.HUBOT_GITHUB_REPO);
        if (!process.env.HUBOT_GITHUB_REPO || !process.env.HUBOT_GITHUB_TOKEN)
            return;
        
        var hash = msg.match[1],
            isIssue = hash.match(/^[0-9]+$/i),
            baseUrl = process.env.HUBOT_GITHUB_API || "https://api.github.com";
    
        if (!isIssue)
        {
            return github.get(baseUrl+"/repos/"+repo+"/commits/"+hash, function(obj) {
                var url = obj.url.replace(/api\./, "");
                if (process.env.HUBOT_GITHUB_API)
                    url = obj.url.replace(/api\/v3\//, "");
                url = url.replace(/repos\//, "");
                url = url.replace(/commits/, "commit");
                return msg.send("Commit: " + obj.commit.message.split("\n")[0] + "\n" + url);
            });
        }
        else
        {
            return github.get(baseUrl+"/repos/"+repo+"/issues/"+hash, function(obj) {
                var url = obj.url.replace(/api\./, "");
                if (process.env.HUBOT_GITHUB_API)
                    url = obj.url.replace(/api\/v3\//, "");
                return msg.send("Issue: " + obj.title + " http://github.com/TrinityCore/TrinityCore/issues/"+hash);
            });
        };
    });
};
