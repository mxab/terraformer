Template.deploymentRow.events({
   "click .js-deploy" : function(){
       Meteor.call("deploy", this._id, function(){
           console.log(arguments);
       });
   }
});