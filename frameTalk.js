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
                frameTalk.say("frameTalk: could not attach event listener");
            }
            if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                frameTalk.say("frameTalk: JSON missing");
            }
        },
    
		handshake : function (from, to) {
			frameTalk.sendMessage(to, { "theFunction": "handshake", "theData": from });
		},
	
        sendMessage : function (where, theMessage) {
            try {
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsg = window.JSON.stringify(theMessage);
                frameTalk.say("send: typeof where: " + typeof where);
                where.postMessage(myMsg, '*');
            } catch (err) {
                frameTalk.say("sendMessage Error - description: " + err.message);        
            }
        },
    
        receiveMessage : function (event) {
            try {
				// sendMessage always sends a string, so, turn it into json
				//frameTalk.say("receive: typeof data: " + typeof event.data);
                var eventObjData = window.JSON.parse(event.data);
                var theFunction = eventObjData.theFunction;
                var theData = eventObjData.theData;
                //
                if (theFunction == "handshake") { 
                    frameTalk.sendMessage(theData, { "theFunction": "replyHandshake", "theData": 'handshake reply' });
                }  
                if (theFunction == "replyHandshake") {           
                    frameTalk.say("HandShake completed. Data: " + theData );
                }                  
                else {
				// call the function that other iFrame asked to
					var fn = window[fn];
                    window.fn(theData);
                }
            } catch (err) {
                frameTalk.say("receiveMessage Error - description: " + err.message);        
            }
        },
		
	say : function (what) {
		console.log("frameTalk " + what);
	}
    };    
        
  window.frameTalk = frameTalk;
}(window));
