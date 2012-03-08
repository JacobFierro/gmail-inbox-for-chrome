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
    el : '#header',
    events : {
        'click .exit' : 'close',
        'click .inbox' : 'goToInbox',
        'click .compose' : 'goToComposition',
        'click .refresh' : 'refresh'
    },

    initialize : function() {},

    close : function() {
        App.Utilities.close();
    },

    goToInbox : function() {
        this.options.navigator.openInbox();
    },

    goToComposition : function() {
        this.options.navigator.openComposition();
    },

    refresh : function() {
        this.trigger('request:refresh');
    }
});




App.Main = Backbone.View.extend({
    el : $('#gmailer'),

    initialize : function() {
        this.initializeAppObjects();
        this.fetchData();
    },

    initializeAppObjects : function() {
        this.navigator = new App.config.navigator;
        this.emailCollection = new App.EmailCollection({ dataStore : App.data });
        this.emailList = new App.EmailList({ collection : this.emailCollection, navigator : this.navigator });
        this.controlBar = new App.ControlBar({ navigator : this.navigator });
        this.controlBar.bind('request:refresh', this.fetchData, this);
    },

    fetchData : function() {
        App.data.fetch( this.navigator.getFeedUrl() );
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










