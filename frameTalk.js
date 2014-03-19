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
                say("frameTalk: could not attach event listener");
            }
            if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("frameTalk: JSON missing");
            }
        },
    
		handshake : function (from, to) {
			sendMessage(to, { "theFunction": "handshake", "theData": from });
		},
	
        sendMessage : function (where, theMessage) {
            try {
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsg = window.JSON.stringify(theMessage);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("frameTalk sendMessage Error - description: " + err.message);        
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
                    sendMessage(theData, { "theFunction": "replyHandshake", "theData": 'handshake reply' });
                }  
                if (theFunction == "replyHandshake") {           
                    say("HandShake completed. Data: " + theData );
                }                  
                else {
					// call the function that other iFrame asked to
                    window.theFunction(theData);
                }
            } catch (err) {
                say("frameTalk receiveMessage Error - description: " + err.message);        
            }
        },
		
		say : function (what) {
			console.log("frameTalk " + what);
		}
    };    
        
  window.frameTalk = frameTalk;
}(window));
