// 1. put the code to both DOMs (window + iFrame)
// 2. run both frameTalk.initListener()
// **** send example: frameTalk.sendMessage( window.top, {"theFunction" : doRun, "theData" : params});

(function (window) {
    "use strict";
    var frameTalk =
    {
        init : function() {
            if (window.addEventListener) {
                window.addEventListener("message", frameTalk.receiveMessage, false);       
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", frameTalk.receiveMessage);        
            } else {
                say("could not attach event listener");
            }
            if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("JSON missing");
            }
        },
    
	handshake : function (from, to) {
		frameTalk.sendMessage(to, { "theFunction": "handshake", "theData": from });
	},
	
        sendMessage : function (where, theMessage) {
            try {
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsg = window.JSON.stringify(theMessage);
                say("send: typeof where: " + typeof where);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        },
    
        receiveMessage : function (event) {
            try {
		// sendMessage always sends a string, so, turn it into json
                var eventObjData = window.JSON.parse(event.data);
                var theFunction = eventObjData.theFunction;
                var theData = eventObjData.theData;
                //
                if (theFunction == "handshake") { 
                    frameTalk.sendMessage(theData, { "theFunction": "replyHandshake", "theData": 'handshake reply' });
                }  
                if (theFunction == "replyHandshake") {           
                    say("HandShake completed. Data: " + theData );
                }                  
	            else {
				// call the function that other iFrame asked to
				var fn = window[theFunction];
				fn.apply(this, theData);
				}
			} catch (err) {
				frameTalk.say("receiveMessage Error - description: " + err.message);        
			}
        }	
    };    

	function say(what){	console.log("frameTalk says: " + what);	}
	   
  window.frameTalk = frameTalk;
}(window));
