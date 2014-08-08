//Npm.depends({
//    'js-git': '0.7.5'
//});
function ensureSubPath(subPath) {
    if (_(subPath).startsWith(".") || _(subPath).startsWith("/") || _(subPath).startsWith("~")) {
        throw new Error("working dir should not start with . or / or ~")
    }
}
/**
 *
 * @param {string} deploymentWorkingDir
 * @return {string}
 */
function getRepoDir(deploymentWorkingDir) {
    return deploymentWorkingDir + "/repo";
}
/**
 *
 * @param {string} deploymentWorkingDir
 * @return {string}
 */
function mupDeployDir(deploymentWorkingDir) {
    return deploymentWorkingDir + "/deploy";
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
        var deployDir = mupDeployDir(deploymentWorkingDir);
        var repoDir = getRepoDir(deploymentWorkingDir);
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
        console.log("REPO OP RESULT", repoResult);


        /**
         * Excute optional commands
         */
        if (deployment.commands && deployment.commands.length) {

            deployment.commands.forEach(function (c) {

                var commandOp = Meteor._wrapAsync(executeCommand);
                var commandResult = commandOp(c, deploymentWorkingDir);
                console.log("CommandResult", commandResult)

            });
        }
        // END


        var mupOp = Meteor._wrapAsync(mupDeploy);
        var mupResult = mupOp(deployment, deploymentWorkingDir);

        Deployments.update({_id: deployment._id}, {$set: {status: "done"}});
        console.log("MUP RESULT", mupResult);


        // http://nodejs.org/api.html#_child_processes


        function cloneRepository(deployment, deploymentWorkingDir, callback) {
            var repoDir = getRepoDir(deploymentWorkingDir);

            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var commandLine = "git clone " + deployment.git + " . && git checkout " + deployment.branch;
            console.log("EXECUTING: "+commandLine);
            var child = exec(commandLine, {
                cwd: repoDir
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }


        function pullRepository(deployment, deploymentWorkingDir, callback) {
            var repoDir = getRepoDir(deploymentWorkingDir);
            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("git pull && git checkout " + deployment.branch, {
                cwd: repoDir
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }

        function mupDeploy(deployment, deploymentWorkingDir, callback) {
            /**
             * @type {string}
             */
            var deployDir = mupDeployDir(deploymentWorkingDir);

            var extend = Npm.require('util')._extend;
            /**
             *
             * @type {string}
             */
            var appDir = getRepoDir(deploymentWorkingDir);
            /**
             *
             * @type {string|undefined}
             */
            var subPath = deployment.appDir;
            if (subPath) {
                ensureSubPath(subPath);

                appDir += "/" + subPath
            }
            //Object.ext
            var mup = extend(deployment.mup, {
                app: appDir,
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
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

        }

        function executeCommand(command, deploymentWorkingDir, callback) {

            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var commandLine = command.name;

            var workingDir = getRepoDir(deploymentWorkingDir);
            if (command.workingDir) {
                var subPath = command.workingDir;
                ensureSubPath(subPath);
                workingDir += "/" + command.workingDir;
            }
            if (command.args && command.args.length) {
                commandLine += " ";
                commandLine += command.args.join(" ");
            }
            var child = exec(commandLine, {
                cwd: workingDir
            }, Meteor.bindEnvironment(callback));
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }
    }
});