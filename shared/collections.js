/**
 * @name Deployment
 * @typedef {{
 *  title : string,
 *  git : string,
 *branch : string,
 * mup :  string,
 * settings : string,
 * status : (string|undefined),
 * lastDeployment : (Date|undefined)
 * }}
 */
/**
 *
 * @type {Meteor.Collection}
 */
Deployments = new Meteor.Collection("deployments");

var Schemas = {};

Schemas.Mup = new SimpleSchema({

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
        label: "Branch"
    },
    mup: {
        type: String,
        label: "Mup"
    },
    settings: {
        type: String,
        label: "Settings"
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
    }
});

Deployments.attachSchema(Schemas.Deployments);

if (Meteor.isServer) {
    Meteor.startup(function () {


    });
}