//Npm.depends({
//    'js-git': '0.7.5'
//});
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
        fs.mkdirSync(deploymentWorkingDir);
        var deployDir = deploymentWorkingDir + "/deploy";
        var appDir = deploymentWorkingDir + "/app";
        fs.mkdirSync(deployDir);
        fs.mkdirSync(appDir);
        if (exists) {
            pullRepository(deployment, deploymentWorkingDir);
        } else {
            cloneRepository(deployment, deploymentWorkingDir);
        }


        // http://nodejs.org/api.html#_child_processes


        function cloneRepository(deployment, deploymentWorkingDir) {
            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("git clone " + deployment.git + " && git checkout " + deployment.branch, {
                cwd: appDir
            }, function (error, stdout, stderr) {


                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    mupDeploy(deployment, deploymentWorkingDir);
                }
            });
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }

        function pullRepository(deployment, deploymentWorkingDir) {
            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("git pull && checkout " + deployment.branch, {
                cwd: appDir
            }, function (error, stdout, stderr) {

                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    mupDeploy(deployment, deploymentWorkingDir);
                }
            });
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }

        function mupDeploy(deployment, deploymentWorkingDir) {

            var mup = JSON.parse(deployment.mup);
            mup.app = appDir;


            Deployments.update({_id: deployment._id}, {$set: {status: "running"}});

            fs.writeFileSync(deployDir + '/mup.json', JSON.stringify(mup), 'utf-8');
            fs.writeFileSync(deployDir + '/settings.json', deployment.settings, 'utf-8');

            var sys = Npm.require('sys');
            var exec = Npm.require('child_process').exec;
            var child = exec("mup deploy" + deployment.branch, {
                cwd: deployDir
            }, function (error, stdout, stderr) {

                if (error !== null) {
                    console.log('exec error: ' + error);
                    Deployments.update({_id: deployment._id}, {$set: {status: "error"}});
                } else {
                    Deployments.update({_id: deployment._id}, {$set: {status: "success"}});
                }
            });
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

        }
    }
});