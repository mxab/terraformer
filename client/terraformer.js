//AutoForm.setDefaultTemplateForType('afObjectField', 'objectAsTextarea');
SimpleSchema.debug = true;

Template.deploymentRow.events({
    "click .js-deploy": function () {
        Meteor.call("deploy", this._id, function () {
            console.log(arguments);
        });
    }
});
Template.deployment.mupJSON = function () {
    return JSON.stringify(this.mup, undefined, 2);
};
Template.deployment.settingsJSON = function () {
    return JSON.stringify(this.settings, undefined, 2);
};

AutoForm.inputValueHandlers({
    'textarea.js-object-as-json': function () {
        var val = this.val();
        var obj = null;
        if (val) {
            obj = JSON.parse(val);
        }
        return  obj;
    }
});

AutoForm.hooks({

});
AutoForm.addHooks(['insertDeploymentForm', 'updateDeploymentForm'], {
    onError: function (operation, error, template) {
        console.log("error", arguments);
    },
    docToForm: function (doc, ss, formId) {
        doc.mup.envJSON = JSON.stringify(JSON.parse(doc.mup.envJSON), undefined, 2);
        doc.settingsJSON = JSON.stringify(JSON.parse(doc.settingsJSON), undefined, 2);
        return doc;
    },

    after: {
        insert: function (error, result) {
            if (error) {
                console.log("Insert Error:", error);
            } else {
                Router.go("home");
            }
        },
        update: function (error) {
            if (error) {
                console.log("Update Error:", error);
            } else {
                Router.go("home");
            }
        }
    }
});


function addFormControlAtts() {
    var atts = _.clone(this.atts);
    if (typeof atts["class"] === "string") {
        atts["class"] += " form-control js-object-as-json";
    } else {
        atts["class"] = "form-control js-object-as-json";
    }

    return atts;
}
Template.afObjectField_objectAsJson.atts = addFormControlAtts;
//Template.afObjectField_objectAsJson.innerContext = Template.afFieldInput.innerContext;

Template.afObjectField_objectAsJson.jsonValue = function () {
    if (this.autoform.atts.doc) {

        return JSON.stringify(new MongoObject(this.autoform.atts.doc).getValueForKey(this.atts.name), undefined, 2);
    }
    return null;
};


/*
 Template.afObjectField_objectAsJson.debugJSON = function(){
 return JSON.stringify(this, undefined,2);
 };*/
