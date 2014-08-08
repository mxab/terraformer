/**
 * @name BowerCommand
 * @typedef {{
 *  name : string,
 *  args : Array.<string>,
 *  workingDir: (string|undefined)
 * }}
 *
 */
/**
 * @name NodeCommand
 * @typedef {{
 *  name : string,
 *  args : Array.<string>,
 *  workingDir: (string|undefined)
 * }}
 *
 */
/**
 * @name DeployCommand
 *
 */

/**
 * @name Deployment
 * @typedef {{
 *  title : string,
 *  git : string,
 * branch : string,
 * mup :  string,
 * settings : string,
 * status : (string|undefined),
 * lastDeployment : (Date|undefined),
 * commands : Array.<{type : string, command: (BowerCommand|NodeCommand)}>
 * }}
 */
/**
 *
 * @type {Meteor.Collection}
 */
Deployments = new Meteor.Collection("deployments");


var Schemas = {};

Schemas.Server = new SimpleSchema({

    host: {type: String},
    username: { type: String},
    password: { type: String, optional: true},
    pem: {type: String, optional: true }
});
Schemas.Mup = new SimpleSchema({

    servers: {
        type: [Schemas.Server],
        label: "Servers"
    },
    setupMongo: {
        type: Boolean,
        defaultValue: true
    },
    setupNode: {
        type: Boolean,
        defaultValue: true
    },
    setupPhantom: {
        type: Boolean,
        defaultValue: true
    },
    nodeVersion: {
        type: String,
        defaultValue: "0.10.29"
    },
    appName: {
        type: String,
        defaultValue: "meteor"
    },
    envJSON: {
        label : "Env",
        type: String,
        autoform: {
            rows: 15
        },
        custom: function () {
            try {
                JSON.parse(this.value)
            } catch (err) {
                return err;
            }
        }
    },
    deployCheckWaitTime: {
        type: Number,
        defaultValue: 15
    }
});

Schemas.Command = new SimpleSchema({

    workingDir: {
        type: String,
        optional: true
    },
    name: {
        type: String,
        allowedValues: ["bower", "mrt", "npm"],
        autoform: {
            options: [
                {label: "---", value: ""},
                {label: "bower", value: "bower"},
                {label: "mrt", value: "mrt"},
                {label: "npm", value: "npm"}
            ]
        }
    },
    args: {
        type: [String],
        optional: true
    }
});
Schemas.Deployments = new SimpleSchema({
    title: {
        type: String,
        label: "Title",
        max: 200
    },
    git: {
        type: String,
        label: "Git"
    },
    branch: {
        type: String,
        label: "Branch",
        defaultValue: "master"
    },
    appDir: {
        type: String,
        optional: true
    },
    mup: {
        type: Schemas.Mup
    },
    settingsJSON: {
        label: "Settings",
        type: String,
        autoform: {
            rows: 15
        },
        custom: function () {
            try {
                JSON.parse(this.value)
            } catch (err) {
                return err;
            }
        }
    },
    status: {
        label: "Status",
        type: String,
        optional: true
    },
    lastDeployment: {
        label: "Last Deployment",
        type: Date,
        optional: true
    },
    commands: {
        type: [Schemas.Command],
        optional: true
    }
});

Deployments.attachSchema(Schemas.Deployments);

if (Meteor.isServer) {
    Meteor.startup(function () {


    });
}