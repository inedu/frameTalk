(function (window) {
    "use strict";
    var frameTalk, hasBeenInit = false, uniqueId = getRandomInt(1000,9999),
		useOfPromises = true, promisesTable = [0], repeatersTable = [0], checkTimer = 500;  
	
	frameTalk = {
		failTimeLimit : 5000,
        init : function() {
			if (! (window.JSON && window.JSON.parse && window.JSON.stringify)) {
                say("No init, JSON missing, please load JSON2");
				return false;
            }		
			if (!hasBeenInit) {
				if (window.addEventListener) {
					window.addEventListener("message", receiveMessage, false); 
					hasBeenInit = true;
					window.frameTalkReady = true;
				} else if (window.attachEvent) {
					window.attachEvent("onmessage", receiveMessage);   
					hasBeenInit = true;	
					window.frameTalkReady = true;					
				} else { say("could not attach event listener"); }
			} else { say("already init"); }
			say("init ready, window unique Id: " + uniqueId);
			return true;
        },		 
		
		sendMessage : function (where, theFunction, theParams, promiseInd) {
			/* syntax examples:
			*		frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );
			*		frameTalk.sendMessage( iframeDOMobject, "doRunFn", 154 ); */
            try {
				if (typeof theFunction != "string" ) {
					say("sendMessage second param must be a function's name (string)");
					return;
				}				
				if (typeof theParams != "object" ) {
					// turn theParams into single record array
					theParams = [theParams];
				}
				where = findPostMsgFn(where);
				if ( !where ) {
					say("sendMessage first param must be a window object with postMessage defined.");
					return;
				} 
                // some browsers do not support json via postMessage, so stringify                                   
                var myMsgObj = {"theFunction":theFunction, "theParams":theParams, "windowId":uniqueId, "promiseInd":promiseInd};
				var myMsg = window.JSON.stringify(myMsgObj);
                where.postMessage(myMsg, '*');
            } catch (err) {
                say("sendMessage Error - description: " + err.message);        
            }
        },	
		
        handshake: function (toWindow) {
			/* syntax example:
					var frame1 = window.document.getElementById('child1');
					frameTalk.handshake(frame1).then(
						function(result) { alert(result); },
						function(error) { alert('handshake failed. ' +  error ); }
					); 
			*/
			var windowFromName, hsPromiseInd = newPromiseInd(), failMsg;
			toWindow = findPostMsgFn(toWindow);
			if ( !toWindow ) {
				// set timer to reject, but first return the promise.
				failMsg = 'handshake needs a window object with postMessage defined';				
				setTimeout( function() { 
					rejectHandShake(hsPromiseInd, failMsg); 					 
				}, 500 );
				return promisesTable[hsPromiseInd].promise(); 
			}
			if (window.top === window) {
				// handshake starts from top window
				windowFromName = "@@top@@"; 
			} else {
				windowFromName = window.name;
			} 
			// start looking for receiver window. May be not loaded/init yet, so try every 'checkTimer' milliseconds
			repeatersTable[hsPromiseInd] = setInterval(function(){ sendOutHandShake(toWindow, windowFromName, hsPromiseInd) }, checkTimer);
			// set a fail timer to reject the promise
			failMsg = "handshake timeout. You can change timeout on frameTalk.failTimeLimit";
			setTimeout(function() { 
				rejectHandShake(hsPromiseInd, failMsg) 
			}, frameTalk.failTimeLimit);
			return promisesTable[hsPromiseInd].promise();			
		}	
    };    

	function sendOutHandShake(toWindow, windowFromName, hsPromiseInd) {
		if (typeof toWindow.frameTalkReady !== 'undefined' && toWindow.frameTalkReady) {
			frameTalk.sendMessage(toWindow, "handshake", [windowFromName], hsPromiseInd);
			clearInterval(repeatersTable[hsPromiseInd]);			
		}
	}
	
	function rejectHandShake (promiseInd, failMsg) {
		clearInterval(repeatersTable[promiseInd]);
		promisesTable[promiseInd].reject(failMsg);
		// clear the promise object to lower memory consumption
		promisesTable[promiseInd] = "rejected";
	}
	
	function receiveMessage (event) {
		try {
			// frameTalk.sendMessage always sends a string, so, turn it into json
			var eventObjData = window.JSON.parse(event.data),
				theFunction = eventObjData.theFunction,
				theParams = eventObjData.theParams,
				windowId = eventObjData.windowId,
				promiseInd = eventObjData.promiseInd,
				wObj;
			//
			if (windowId == uniqueId) {
				// this is an echo, do not examine!
				say('msg rejected as echo');
				return;
			}
			if (theFunction == "handshake") { 
				var windowNameToReply = theParams[0]; 
				if (windowNameToReply === "@@top@@") {
					wObj = window.top;
					frameTalk.sendMessage(wObj, "replyHandshake", [0], promiseInd );
				} else {											
					wObj = window.document.getElementById(windowNameToReply);					
					if ( wObj && wObj.contentWindow ) {
						// it's an iFrame. Put [1] in params
						frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1], promiseInd );
					} else {
						// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
						wObj = window.parent.document.getElementById(windowNameToReply);
						if ( wObj && wObj.contentWindow ) {
							frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1], promiseInd );
						} else {
							// in case iFrame has a 'name' tag, look again.
							wObj = window.document.getElementsByName(windowNameToReply)[0];					
							if ( wObj && wObj.contentWindow ) {
								// it's an iFrame. Put [1] in params
								frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1], promiseInd );
							} else {
								// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
								wObj = window.parent.document.getElementsByName(windowNameToReply)[0];
								if ( wObj && wObj.contentWindow ) {
									frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1], promiseInd );
								} else {
									say("could not find handshake receiver");		
								}
							}		
						}
					}
				}				 
			}  
			else if (theFunction == "replyHandshake") {
				if (!promiseInd) {
					if (theParams[0] === 0) { 
						say("HandShake with top window completed." ); 
					} else {
						say("HandShake completed." ); 
					}
				} else {
					// resolve promise
					promisesTable[promiseInd].resolve(true);
					// clear the promise object to lower memory consumption
					promisesTable[promiseInd] = "success";
				}
			}                  
			else {
				// call the function that other iFrame asked to
				var fn = window[theFunction];
				if (typeof fn === "function") {
					fn.apply(this, theParams);
				} else {
					say("receiveMessage: function not found");
				}
			}
		} catch (err) {
			say("receiveMessage Error - description: " + err.message);        
		}
	}	
	
	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	function say(what){	console.log("frameTalk says: " + what);	}
	
	function findPostMsgFn(where) {
		// returns the actual window that contains postMessage function. User may have only given the id of an iFrame
		if (where.postMessage) return where;
		if (where.contentWindow && where.contentWindow.postMessage) return where.contentWindow;	
		return null;
	}
	
	function newPromiseInd() {
		var l = promisesTable.length,
			r = new $.Deferred();
		promisesTable[l] = r;
		// return the length as index of the new promise
		return l;
	}
	
	function handshakeFallback (toWindow) {
		var windowFromName;         
		toWindow = findPostMsgFn(toWindow);
		if ( !toWindow ) {
			say('handshake needs a window object with postMessage defined'); 
			return;
		}
		if (window.top === window) {
			// handshake starts from top window
			windowFromName = "@@top@@"; 
		} else {
			windowFromName = window.name;
		}
		frameTalk.sendMessage(toWindow, "handshake", [windowFromName]);
	}
	
	// examine promises availability
	if (typeof window.jQuery !== "function") {
		// we cannot give promises, use fallbacks
		useOfPromises = false;	
		frameTalk.handshake = handshakeFallback;		
		say("caution, since no jQuery found, handshake functionality will not include promises");
	}
	
	// auto init
	frameTalk.init();
	// expose scope
	window.frameTalk = frameTalk;
}(window));
