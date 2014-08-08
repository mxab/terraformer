Router.configure({
    layoutTemplate: "masterLayout"
});

Router.map(function () {
    //this.route('home', {path: '/'});
    this.route('deploymentNew', {
        path: "/new-deployment"
    });
    this.route('deploymentEdit', {
        path: "/edit-deployment/:_id",

        data: function () {
            return {
                deployment: Deployments.findOne(this.params._id)
            }
        }
    });
    this.route('home', {
        path: "/",
        waitOn: function () {
            //   this.subscribe("deployment", this.params._id)
        },
        data: function () {
            return {
                deployments: Deployments.find()
            }
        }
    });
    this.route('deployment', {
        path: "/deployment/:_id",
        waitOn: function () {
            //   this.subscribe("deployment", this.params._id)
        },
        data: function () {
            return {
                deployment: Deployments.findOne(this.params._id)
            }
        }
    });
});