// Utilities

var App = App || {};

App.Utilities = {};

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
}();

App.dataStore = function() {
    var data = {},
        emails = {},
        count = 0;

    function fetchData(url) {
        var self = App.dataStore;
        $.ajax({
            type : "GET",
            url : url,
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
        fetch : function(url) {
        	console.log('fetch from: ', url);
            fetchData(url);
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

App.Utilities.close = function() {
    window.close();
};

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


// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// see: http://blog.stevenlevithan.com/archives/parseuri
// MIT License

App.Utilities.parseUri = function(str) {
	options = {
		strictMode: false,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q:   {
			name:   "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		}
	};

	var	o   = options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};









