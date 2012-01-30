var App = {};

App.config = {
    
}




// Identifier used to debug the possibility of multiple instances of the
// extension making requests on behalf of a single user.
var animationFrames = 36;
var animationSpeed = 10; // ms
var canvas;
var canvasContext;
var loggedInImage;
var pollIntervalMin = 1000 * 60; // 1 minute
var pollIntervalMax = 1000 * 60 * 60; // 1 hour
var requestFailureCount = 0; // used for exponential backoff
var requestTimeout = 1000 * 2; // 5 seconds
var rotation = 0;
var unreadCount = -1;
var requestTimerId;

/**
* App Utilities
*/

App.Utilities = {};

App.Utilities.instanceId = 'gmc' + parseInt(Date.now() * Math.random(), 10);

App.Utilities.getGmailUrl = function() {
    var url = "https://mail.google.com/";
    if (localStorage.customDomain)
        url += localStorage.customDomain + "/";
    else
        url += "mail/"
    return url;
}

App.Utilities.getFeedUrl = function() {
    // "zx" is a Gmail query parameter that is expected to contain a random
    // string and may be ignored/stripped.
    return App.Utilities.getGmailUrl() + "feed/atom?zx=" + encodeURIComponent( App.Utilities.instanceId );
}

App.dataStore = function() {
    var data = {},
        emails = {},
        count = 0;

    function fetchData() {
        var self = App.dataStore;
        $.ajax({
            type : "GET",
            url : App.Utilities.getFeedUrl(),
            dataType : "xml",
            success : function(data, textStatus, jQxhr) {
                var json = $.xmlToJSON(data);
                data = json;
                emails = parseEmailData(json.entry);
                count = json.entry.length
                self.trigger('reset');
                // console.log('*success json: ', json , self);//, JSON.stringify(json));
            },
            error : function(jqXHR, textStatus, errorThrown) {
                console.log('*error: ', jqXHR, textStatus, errorThrown);
            }
        });
    }

    function parseEmailData(json) {
        var  arr = [];
        $.each(json, function(index, email){
            var obj = {
                'author' : email.author[0].name[0].Text,
                // 'time' : getEmailTime(email.issued[0].Text),
                'time' : email.issued[0].Text,
                'title' : email.title[0].Text,
                'summary' : email.summary[0].Text,
                'url' : email.link[0].href
            };

            arr.push(obj);
        }); 
        return arr;
    }

    return {
        fetch : function() {
            fetchData();
        },
        getEmails : function() {
            return emails;
        },
        getCount : function() {
            return count;
        },
        getData : function() {
            return data;
        } 
    }
}();

App.Utilities.Closer = function() {
    return {
        close : function() {
            window.close();
        }
    }
}();

App.Utilities.Navigator = function() {
    return {
        newTab : function(url) {
            chrome.tabs.create({ 'url' : url });
        }
    }
}();




/*******
* MODEL
*******/
App.Model = Backbone.Model.extend({
    defaults : {
        gravitarUrl : "gravitar.png"
    }
});


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
        "click" : "clickHandler"
    },

    render : function() {
        $(this.el).html( this.template( this.model.toJSON() ) );
        return this;
    },

    clickHandler : function() {
        App.Utilities.Navigator.newTab( this.model.get('url') );
        App.Utilities.Closer.close();
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
            $(this.el).append(view.render().el);
        }.bind(this));
    }
});



App.InboxButton = Backbone.View.extend({
    el : $('#inbox'),
    events : {
        'click' : 'goToInbox'
    },

    initialize : function() {
        console.log('*inbox button: ', this);
    },

    goToInbox : function() {
        App.Utilities.Navigator.newTab( App.Utilities.getGmailUrl() );
        App.Utilities.Closer.close();
    }
});




App.Main = Backbone.View.extend({
    initialize : function() {
        this.initializeAppObjects();
        App.data.fetch();
    },

    initializeAppObjects : function() {
        this.emailCollection = new App.EmailCollection({ dataStore : App.data });
        this.emailList = new App.EmailList({ collection : this.emailCollection });
        this.inboxButton = new App.InboxButton({ dataStore : App.data });
    }
});




$(document).ready(function(){
    App.data = App.dataStore;
    _.extend(App.data, Backbone.Events);
    var app = new App.Main;
});










