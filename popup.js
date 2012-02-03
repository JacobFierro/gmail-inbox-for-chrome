var App = App || {};

/**
* App Utilities
*/





/*******
* MODEL
*******/
App.Model = Backbone.Model.extend({});


/*******
* COLLECTION
*******/
App.EmailCollection = Backbone.Collection.extend({
    model : App.Model,

    initialize : function(options) {
        this.options = options;
        console.log('*collection: ', this);
        this.options.dataStore.bind('reset', this.resetModels, this);
    },

    resetModels : function() {
        var emails = this.options.dataStore.getEmails();
        this.reset(emails);
    }
});


/*******
* VIEWS
*******/
App.EmailRow = Backbone.View.extend({
    tagName : "li",
    template : _.template( $('#email-template').html() ),
    events : {
        "click" : "requestNavigation"
    },

    render : function() {
        $(this.el).html( this.template( this.model.toJSON() ) );
        return this;
    },

    requestNavigation : function() {
        this.trigger('navigation', this.model.get('url'));
    }
     
});

App.EmailList = Backbone.View.extend({
    el : '#emails',
    
    initialize : function() {
        this.collection.bind('reset', this.render, this);
    },

    render : function() {
        $(this.el).html('');
        this.collection.each(function(model){
            var view = new App.EmailRow({ model : model });
            view.bind('navigation', this.navigateToEmail, this);
            $(this.el).append(view.render().el);
        }.bind(this));

        this.handleOverflow();
        $('#control-bar').height( $('#inbox').height() ); //TODO move this
    },

    handleOverflow : function() {
        if ( this.collection.length > 3 ) {
            App.config.overflowHandler(this.el);
        }
    },

    navigateToEmail : function(url) {
        this.options.navigator.openEmail(url);
    }
});



App.ControlBar = Backbone.View.extend({
    el : '#control-bar',
    events : {
        'click #inboxBtn' : 'goToInbox',
        'click #composeBtn' : 'goToComposition'
    },

    initialize : function() {},

    goToInbox : function() {
        this.options.navigator.openInbox();
        // App.Utilities.navigator.newTab( App.Utilities.getGmailUrl() );
        // App.Utilities.Closer.close();
    },

    goToComposition : function() {
        this.options.navigator.openComposition();
    }
});




App.Main = Backbone.View.extend({
    el : $('#gmailer'),
    events : {
        'click #close' : 'close'
    },

    initialize : function() {
        this.initializeAppObjects();
    },

    initializeAppObjects : function() {
        this.navigator = new App.config.navigator;
        this.emailCollection = new App.EmailCollection({ dataStore : App.data });
        this.controlBar = new App.ControlBar({ navigator : this.navigator });
        this.emailList = new App.EmailList({ collection : this.emailCollection, navigator : this.navigator });
        App.data.fetch( this.navigator.getFeedUrl() );
    },

    close : function() {
        App.Utilities.close();
    }
});


App.config = {
    gravitar : {
        'size' : 40,
        'default' : 'mm'
    },
    navigator : App.Navigator,
    overflowHandler : App.Utilities.overflowHandler.enableLionbars
}



$(document).ready(function(){
    App.data = App.dataStore;
    _.extend(App.data, Backbone.Events);
    var app = new App.Main;
});










