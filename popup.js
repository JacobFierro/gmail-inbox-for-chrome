var App = {};

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

App.Utilities.gravitar = function() {
    function getHash(email) {
        return md5( $.trim( email.toLowerCase() ) );
    }

    function getGravitar(email) {
        var hash = getHash(email);
        return 'http://www.gravatar.com/avatar/' + hash + '?s=' + App.config.gravitar.size + "&d=" + App.config.gravitar.default;
    }

    return {
        getUrl : function(email) {
            return getGravitar(email);
        }
    }
}()

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
                'time' : $.timeago(email.issued[0].Text),
                'title' : email.title[0].Text,
                'summary' : email.summary[0].Text,
                'url' : email.link[0].href,
                'gravitar' : App.Utilities.gravitar.getUrl( email.author[0].email[0].Text )
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

App.Utilities.overflowHandler = function() {
    
    return {
        enableLionbars : function(el) {
            $(el).css({ 
                'overflow': 'scroll',
                'height' : '300px'
            }).lionbars();
        }
    }
}();




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
        this.handleOverflow();
        $('#controls').height( $('#inbox').height() ); //TODO move this
    },

    handleOverflow : function() {
        if ( this.collection.length > 3 ) {
            App.config.overflowHandler(this.el);
        }
    }
});



App.InboxButton = Backbone.View.extend({
    el : '#inbox',
    events : {
        // 'click' : 'goToInbox'
    },

    initialize : function() {
        this.options.dataStore.bind('reset', this.updateCount, this);
    },

    updateCount : function() {
        var count = this.options.dataStore.getCount();
        $(this.el).find('.count').text('( ' + count + ' )');
    },

    goToInbox : function() {
        App.Utilities.Navigator.newTab( App.Utilities.getGmailUrl() );
        App.Utilities.Closer.close();
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
        this.emailCollection = new App.EmailCollection({ dataStore : App.data });
        this.emailList = new App.EmailList({ collection : this.emailCollection });
        this.inboxButton = new App.InboxButton({ dataStore : App.data });
        App.data.fetch();
    },

    close : function() {
        App.Utilities.Closer.close();
    }
});


App.config = {
    gravitar : {
        'size' : 40,
        'default' : 'mm'
    },
    overflowHandler : App.Utilities.overflowHandler.enableLionbars
}



$(document).ready(function(){
    App.data = App.dataStore;
    _.extend(App.data, Backbone.Events);
    var app = new App.Main;
});










