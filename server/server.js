//Npm.depends({
//    'js-git': '0.7.5'
//});
function ensureSubPath(subPath, command) {
    if (subPath.startsWith(".") || command.workingDir.startsWith("/") || command.workingDir.startsWith("~")) {
        throw new Error("working dir should not start with . or / or ~")
    }
}
Meteor.methods({
    "deploy": function (deploymentId) {


        var workingDir = "/Users/bruchmann/temp/terraformerworkdir";


        /**
         *
         * @type {Deployment}
         */
        var deployment = Deployments.findOne(deploymentId);

        console.log("deploying", deployment.title);

        var deploymentWorkingDir = workingDir + "/" + deployment._id;
        var fs = Npm.require('fs');
        var exists = fs.existsSync(deploymentWorkingDir);
        if (!exists) {
            fs.mkdirSync(deploymentWorkingDir);
        }
        var deployDir = deploymentWorkingDir + "/deploy";
        var repoDir = deploymentWorkingDir + "/repo";
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir);
        }
        if (!fs.existsSync(repoDir)) {
            fs.mkdirSync(repoDir);
        }

        var repoOp;
        if (exists) {
            repoOp = Meteor._wrapAsync(pullRepository);
        } else {
            repoOp = Meteor._wrapAsync(cloneRepository);
        }

        var repoResult = repoOp(deployment, deploymentWorkingDir);
        console.log("reporesult", repoResult);

        if (deployment.commands && deployment.commands.length) {

            deployment.commands.forEach(function (c) {

                var commandOp = Meteor._wrapAsync(command);
                var commandResult = commandOp(c);
                console.log("CommandResult", commandResult)

            });
        }


        var mupOp = Meteor._wrapAsync(mupDeploy);
        var mupResult = mupOp(deployment, deploymentWorkingDir);
        console.log("mupResult", mupResult);


        // http://nodejs.org/api.html#_child_processes


        function cloneRepository(deployment, deploymentWorkingDir, callback) {
            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("git clone " + deployment.git + " . && git checkout " + deployment.branch, {
                cwd: repoDir
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }


        function pullRepository(deployment, deploymentWorkingDir, callback) {
            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("git pull && git checkout " + deployment.branch, {
                cwd: repoDir
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }

        function mupDeploy(deployment, deploymentWorkingDir, callback) {

            var extend = Npm.require('util')._extend;

            var app = repoDir;
            var subPath = deployment.appDir;
            if (subPath) {
                ensureSubPath(subPath);

                app += "/" + subPath
            }
            //Object.ext
            var mup = extend(deployment.mup, {
                app: app,
                env: JSON.parse(deployment.mup.envJSON)
            });
            delete mup.envJSON;


            Deployments.update({_id: deployment._id}, {$set: {status: "running"}});

            fs.writeFileSync(deployDir + '/mup.json', JSON.stringify(mup), 'utf-8');
            fs.writeFileSync(deployDir + '/settings.json', deployment.settingsJSON, 'utf-8');

            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("mup setup && mup deploy", {
                cwd: deployDir
            }, Meteor.bindEnvironment(function (error) {

                if (error !== null) {
                    Deployments.update({_id: deployment._id}, {$set: {status: "error"}});
                    callback(error);
                } else {
                    Deployments.update({_id: deployment._id}, {$set: {status: "success"}});
                    callback();
                }
            }));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

        }

        function command(command, deploymentWorkingDir) {

            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var commandLine = command.name;

            var workingDir = repoDir;
            if (command.workingDir) {
                var subPath = command.workingDir;
                ensureSubPath(subPath, command);
                workingDir += "/" + command.workingDir;
            }
            if (command.args) {
                commandLine += " ";
                commandLine += command.args.join(" ");
            }
            var child = exec(commandLine, {
                cwd: workingDir
            }, Meteor.bindEnvironment(function (error) {


                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    mupDeploy(deployment, deploymentWorkingDir);
                }
            }));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }
    }
});