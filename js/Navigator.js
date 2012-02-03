// Navigator

var App = App || {};

App.Navigator = Backbone.View.extend({
	initialize : function() {},

	openEmail : function(url) {
		this._navigate( url );
	},

	openInbox : function() {
		this._navigate( this.getGmailUrl("inbox") );
	},

	openComposition : function() {
		this._navigate( this.getGmailUrl("compose") );
	},

	close : function() {
		App.Utilities.close();
	},

	getFeedUrl : function() {
		var zx = 'gmc' + parseInt(Date.now() * Math.random(), 10);
		return this.getGmailUrl() + "feed/atom?zx=" + encodeURIComponent( zx );
	},

	getGmailUrl : function(anchor) {
	    var url = "https://mail.google.com/";
	    if (localStorage.customDomain)
	        url += localStorage.customDomain + "/";
	    else
	        url += "mail/";

	    url += (anchor) ? '#'+anchor : '';

	    return url;
	},

	// private methods

	_navigate : function( url ) {
		this.url = url;
		this.tabChecker = new App.TabChecker;
		this.tabChecker.bind('ready', this._decideNavigationType, this);
	},

	_decideNavigationType : function() {
		if ( !this.tabChecker.isOpenGmailTab() ) {
			this._goToNewTab(this.url);
		} else {
			this._goToOpenTab(this.url);
		}
	},

	_goToNewTab : function(url) {
		console.log('*_goToNewTab', url);
		chrome.tabs.create({ 'url' : url });
		this.close();
	},

	_goToOpenTab : function(url) {
		console.log('*_goToOpenTab', url);
		var id = this.tabChecker.getGmailTabID();
		var options = {
			'url' : url,
			'active' : true
		}
		chrome.tabs.update(id, options);
		this.close();
	}

});

App.TabChecker = Backbone.View.extend({
	initialize : function()	{
		var self = this;
		chrome.tabs.query({}, function(arr){
			self.tabs = arr;
			self.trigger('ready');
		});
	},

	/**
	* @returns {Boolean} Returns true only if Gmail is a tab and NOT in the compose mode, don't want to navigate anyone away from an in-process email
	*/
	isOpenGmailTab : function() {
		var isGmail = false;
		_.each(this.tabs, function(tab) {
			var uri = App.Utilities.parseUri(tab.url);
			if (!isGmail) {
				isGmail = (uri.host === "mail.google.com") ? ((uri.anchor === "compose") ? false : true) : false;
				this.setGmailTabID(tab.id);
			}
		}.bind(this));
		return isGmail;
	},

	getGmailTabID : function() {
		return this.gmailTabID;
	},

	setGmailTabID : function(id) {
		this.gmailTabID = id;
	}

});









