// Identifier used to debug the possibility of multiple instances of the
// extension making requests on behalf of a single user.
var instanceId = 'gmc' + parseInt(Date.now() * Math.random(), 10);
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

function getGmailUrl() {
    var url = "https://mail.google.com/";
    if (localStorage.customDomain)
        url += localStorage.customDomain + "/";
    else
        url += "mail/"
    return url;
}

function getFeedUrl() {
    // "zx" is a Gmail query parameter that is expected to contain a random
    // string and may be ignored/stripped.
    return getGmailUrl() + "feed/atom?zx=" + encodeURIComponent(instanceId);
}


function setTotal(json) {
    var el = $('.count');
    clearEl(el);

    el.html("( <b>"+json.fullcount[0].Text+"</b> )");

    $('#inbox').click(function(){
        buttonClickAction( json.link[0].href );
    });


    chrome.browserAction.setBadgeText({
        'text' : json.fullcount[0].Text
    });
}

function clearEl (el) {
    el.html('');
}

function getParsedEmails(json) {
    var  arr = [];
    $.each(json, function(index, email){
        var obj = {
            'author' : email.author[0].name[0].Text,
            // 'time' : getEmailTime(email.issued[0].Text),
            'time' : email.issued[0].Text,
            'title' : email.title[0].Text,
            'summary' : email.summary[0].Text,
            'link' : email.link[0].href
        };

        arr.push(obj);
    }); 
    return arr;
}


function showEmails(json, template) {
    template.render(getParsedEmails(json));
}

function buttonClickAction(src){
    chrome.tabs.create({
       url : src
    });
    window.close();
}

function doClickListener() {
    $('.email-full').click(function(e){
        buttonClickAction( $(this).data('src') );        
    });
}

function getEmailData() {
    // prep template
    var tmpl = Tempo.prepare('template').notify( function (event) {
        if (event.type === TempoEvent.Types.RENDER_STARTING) {
            // 
        } else if (event.type === TempoEvent.Types.RENDER_COMPLETE) {
            doClickListener();
        }
    });
    tmpl.starting();

	var url = getFeedUrl();

	$.ajax({
		type : "GET",
		url : url,
		dataType : "xml",
		success : function(data, textStatus, jQxhr) {
            // console.log('*success data: ', data, textStatus, jQxhr);
            var json = $.xmlToJSON(data);
            console.log('*success json: ', json);//, JSON.stringify(json));
            
            setTotal(json);
            // setBadge(json.fullcount[0].Text);
            showEmails(json.entry, tmpl);

		},
		error : function(jqXHR, textStatus, errorThrown) {
			console.log('*error: ', jqXHR, textStatus, errorThrown);
		}
	});
}

function setCursor (el) {
    
}



$(document).ready(function(){
    chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
    getEmailData();    
});