(function (window) {
	"use strict";
	var frameTalk,
		hasBeenInit = false,
		windowFromId,
		uniqueId = getRandomInt(1000, 9999),
		useOfPromises = true,
		promisesTable = [0],
		repeatersTable = [0],
		checkTimer = 500;
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	function say(what) {
		console.log(what);
	}
	function debugSay(what) {
		if (frameTalk.debugging) {
			console.log("frameTalk debug [" + windowFromId + "(" + uniqueId + ")] says: ");
			console.log(what);
		}
	}
	function findPostMsgFn(where) {
		// returns the actual window that contains postMessage function. User may have only given the id of an iFrame
		if (where.postMessage)
			return where;
		if (where.contentWindow && where.contentWindow.postMessage)
			return where.contentWindow;
		if (document.getElementById(where) != null) {
			return document.getElementById(where).contentWindow;
		}
		return null;
	}
	function newPromiseInd() {
		var l = promisesTable.length,
		r = new $.Deferred();
		promisesTable[l] = r;
		// return the length as index of the new promise
		return l;
	}
	function findPostTarget(frameId) {
		var wObj = window.document.getElementById(frameId);
		if (wObj && wObj.contentWindow) {
			// it's an iFrame. Put [1] in params
			return wObj;
		} else {
			// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
			wObj = window.parent.document.getElementById(frameId);
			if (wObj && wObj.contentWindow) {
				return wObj;
			} else {
				// in case iFrame has a 'name' tag, look again.
				wObj = window.document.getElementsByName(frameId)[0];
				if (wObj && wObj.contentWindow) {
					// it's an iFrame. Put [1] in params
					return wObj;
				} else {
					// it's not the top window nor an iFrame in this window. Look for iFrames in parent (nested case)
					wObj = window.parent.document.getElementsByName(frameId)[0];
					if (wObj && wObj.contentWindow) {
						return wObj;
					} else {
						return null;
					}
				}
			}
		}
	}
	function handshakeFallback(toWindow, fromId) {
		toWindow = findPostMsgFn(toWindow);
		if (!toWindow) {
			debugSay('handshakeFallback needs a window object with postMessage defined');
			return;
		}
		if (window.top === window) {
			// handshake starts from top window
			debugSay("starting handshakeFallback from top window");
			windowFromId = "@@top@@";
		} else {
			// handshake starts from child iFrame. We need to know this iframe's id and post it up to parent
			debugSay("starting handshakeFallback from iframe: " + fromId);
			windowFromId = fromId;
		}
		frameTalk.sendMessage(toWindow, "handshake", [windowFromId]);
	}
	function sendOutHandShake(toWindow, windowFromId, hsPromiseInd) {
		debugSay("sending handshake, promise index: " + hsPromiseInd);
		frameTalk.sendMessage(toWindow, "handshake", [windowFromId], hsPromiseInd);
	}
	function rejectPromise(promiseInd, failMsg) {
		// if not a promise object there, promise has already been resolved/rejected
		if (typeof promisesTable[promiseInd] == 'object') {
			clearInterval(repeatersTable[promiseInd]);
			promisesTable[promiseInd].reject(failMsg);
			// clear the promise object to lower memory consumption
			promisesTable[promiseInd] = "rejected";
			repeatersTable[promiseInd] = "cleared";
		}
	}
	function receiveMessage(event) {
		// frameTalk.sendMessage always sends a string, so, turn it into json
		var eventObjData = window.JSON.retrocycle(JSON.parse(event.data));
		var theFunction = eventObjData.theFunction,
			theParams = eventObjData.theParams,
			windowId = eventObjData.windowId,
			promiseInd = eventObjData.promiseInd,
			frameIdToReply = eventObjData.fromId,
			theObject = eventObjData.theObject,
			wObj, theBindingObject, fn;
		//
		debugSay('msg received, parsed:');
		debugSay(eventObjData);
		if (!theFunction) {
			debugSay("parameter 'theFunction' not found in postMessage. May not came via frameTalk. Aborted")
			return;
		}
		if (windowId == uniqueId) {
			// this is an echo, do not examine!
			debugSay('msg rejected as echo');
			return;
		}
		if (theFunction == "handshake") {
			var frameIdToReply = theParams[0];
			if (!frameIdToReply) {
				debugSay("handshake needs iFrame id as second parameter in order to complete reply");
			}
			if (frameIdToReply === "@@top@@") {
				wObj = window.top;
				frameTalk.sendMessage(wObj, "replyHandshake", [0], promiseInd);
			} else {
				wObj = findPostTarget(frameIdToReply);
				if (wObj) {
					frameTalk.sendMessage(wObj.contentWindow, "replyHandshake", [1], promiseInd);
				} else {
					debugSay("could not find handshake receiver");
				}
			}
		} else if (theFunction == "replyHandshake") {
			if (!promiseInd) {
				debugSay("got handshake reply with no promise index");
				if (theParams[0] === 0) {
					debugSay("HandShake with top window completed.");
				} else {
					debugSay("HandShake completed.");
				}
			} else {
				debugSay("got handshake reply, promise index: " + promiseInd);
				// resolve promise
				promisesTable[promiseInd].resolve(true);
				// clear the promise object to lower memory consumption
				promisesTable[promiseInd] = "success";
				// clear timeout interval
				clearInterval(repeatersTable[promiseInd]);
				// put a dummy record to be safe
				repeatersTable[promiseInd] = "cleared";
			}
		} else if (theFunction == "replyPromiseOk") {
			debugSay("promise resolved, index: " + promiseInd);
			// resolve promise
			promisesTable[promiseInd].resolve(theParams);
			// clear the promise object to lower memory consumption
			promisesTable[promiseInd] = "success";
		} else if (theFunction == "replyPromiseFail") {
			debugSay("promise rejected, index: " + promiseInd);
			// resolve promise
			promisesTable[promiseInd].reject(theParams);
			// clear the promise object to lower memory consumption
			promisesTable[promiseInd] = "fail";
		} else if (promiseInd) {
			// it is an asychronous call, make the call and then postMessage the callback
			debugSay("promise request received, index: " + promiseInd);
			// we must call the async function. Eval to ensure dot notation in deeper level will work
			fn = eval("window." + theFunction);
			if (typeof fn === "function") {
				fn.apply(this, theParams).then(
					function (data) {
					returnPromise("replyPromiseOk", frameIdToReply, data);
				},
					function (err) {
					returnPromise("replyPromiseFail", frameIdToReply, err);
				});
			} else {
				debugSay("receiveMessage: function not found");
			}
		} else {
			// call the function that other iFrame asked to
			fn = eval("window." + theFunction);
			theBindingObject = (theObject ? eval("window." + theObject) : this);
			if (typeof fn === "function") {
				debugSay("receiveMessage: bindingObjectToThis === window? " + theBindingObject === window);
				fn.apply(theBindingObject, theParams); // pass in the calling object to the method call so that internal "this" calls make sense
			} else {
				debugSay("receiveMessage: function not found");
			}
		}
		function returnPromise(theFunction, where, data) {
			if (where === "@@top@@") {
				wObj = window.top;
				frameTalk.sendMessage(wObj, theFunction, [data], promiseInd);
			} else {
				wObj = findPostTarget(where);
				if (wObj) {
					frameTalk.sendMessage(wObj.contentWindow, theFunction, [data], promiseInd);
				} else {
					debugSay("could not find reply receiver");
				}
			}
		}
	}
	/* Douglas Crockford cycle.js*/
	if (typeof JSON.decycle !== 'function') {
		JSON.decycle = function decycle(object) {
			'use strict';
			var objects = [], paths = [];
			return (function derez(value, path) {
				var i, name, nu;
				if (typeof value === 'object' && value !== null && !(value instanceof Boolean) && !(value instanceof Date) && !(value instanceof Number) && !(value instanceof RegExp) && !(value instanceof String)) {
					for (i = 0; i < objects.length; i += 1) {
						if (objects[i] === value) {
							return {
								$ref : paths[i]
							};
						}
					}
					objects.push(value);
					paths.push(path);
					if (Object.prototype.toString.apply(value) === '[object Array]') {
						nu = [];
						for (i = 0; i < value.length; i += 1) {
							nu[i] = derez(value[i], path + '[' + i + ']');
						}
					} else {
						nu = {};
						for (name in value) {
							if (Object.prototype.hasOwnProperty.call(value, name)) {
								nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
							}
						}
					}
					return nu;
				}
				return value;
			}
				(object, '$'));
		};
	};
	if (typeof JSON.retrocycle !== 'function') {
		JSON.retrocycle = function retrocycle($) {
			'use strict';
			var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;
			(function rez(value) {
				var i, item, name, path;
				if (value && typeof value === 'object') {
					if (Object.prototype.toString.apply(value) === '[object Array]') {
						for (i = 0; i < value.length; i += 1) {
							item = value[i];
							if (item && typeof item === 'object') {
								path = item.$ref;
								if (typeof path === 'string' && px.test(path)) {
									value[i] = eval(path);
								} else {
									rez(item);
								}
							}
						}
					} else {
						for (name in value) {
							if (typeof value[name] === 'object') {
								item = value[name];
								if (item) {
									path = item.$ref;
									if (typeof path === 'string' && px.test(path)) {
										value[name] = eval(path);
									} else {
										rez(item);
									}
								}
							}
						}
					}
				}
			}
				($));
			return $;
		};
	}
	/* END OF Douglas Crockford cycle.js*/
	frameTalk = {
		getId : function () {
			return uniqueId;
		},
		debugging : true,
		failTimeLimit : 5000,
		init : function () {
			if (!(window.JSON && window.JSON.parse && window.JSON.stringify)) {
				debugSay("No init, JSON missing, please load JSON2");
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
				} else {
					debugSay("could not attach event listener");
				}
			} else {
				debugSay("already init");
			}
			debugSay("init ready, window unique Id: " + uniqueId);
			return true;
		},
		sendMessage : function (where, theFunction, theParams, promiseInd, theObjectToBindToThis) {
			/* syntax examples:
			 *		frameTalk.sendMessage( window.top, "doRunFn", [1,2,3,'four'] );
			 *		frameTalk.sendMessage( iframeDOMobject, "doRunFn", 154 ); */
			try {
				if (typeof theFunction != "string") {
					debugSay("sendMessage second param must be a function's name (string)");
					return;
				}
				if (typeof theParams != "object") {
					// turn theParams into single record array
					theParams = [theParams];
				}
				where = findPostMsgFn(where);
				if (!where) {
					debugSay("sendMessage first param must be a window object with postMessage defined.");
					return;
				}
				// some browsers do not support json via postMessage, so stringify
				var myMsgObj = {
					"theFunction" : theFunction,
					"theParams" : theParams,
					"windowId" : uniqueId,
					"promiseInd" : promiseInd,
					"theObject" : theObjectToBindToThis
				};
				//var myMsg = window.JSON.stringify(myMsgObj);
				var myMsg = window.JSON.stringify(JSON.decycle(myMsgObj));
				where.postMessage(myMsg, '*');
			} catch (err) {
				debugSay("sendMessage error: " + err.message);
			}
		},
		sendPromise : function (where, fromId, theFunction, theParams) {
			/* syntax example:
			 *		frameTalk.sendPromise(window.top, "_Iframe", "spyreqs.rest.getWebLists", []).then(say,say)  */		
			var thisSendPromiseInd = newPromiseInd(fromId), failMsg;
			if (typeof theFunction != "string") {
				failMsg = "sendPromise third param must be a function's name (string)";
				debugSay(failMsg);
				setTimeout(function () {
					rejectPromise(thisSendPromiseInd, failMsg);
				}, 500);
				return promisesTable[thisSendPromiseInd].promise();
			}
			if (typeof theParams != "object") {
				// turn theParams into single record array
				theParams = [theParams];
			}
			where = findPostMsgFn(where);
			if (!where) {
				failMsg = "sendPromise first param must be a window object with postMessage defined.";
				debugSay(failMsg);
				setTimeout(function () {
					rejectPromise(thisSendPromiseInd, failMsg);
				}, 500);
				return promisesTable[thisSendPromiseInd].promise();
			}
			// some browsers do not support json via postMessage, so stringify
			var myMsgObj = {
				"theFunction" : theFunction,
				"theParams" : theParams,
				"windowId" : uniqueId,
				"promiseInd" : thisSendPromiseInd,
				"fromId" : fromId
			};
			var myMsg = window.JSON.stringify(myMsgObj);
			where.postMessage(myMsg, '*');
			// return the promise
			return promisesTable[thisSendPromiseInd].promise();
		},
		handshake : function (toWindow, fromId) {
			/* syntax examples:
				frameTalk.handshake(document.getElementById("_Iframe")).then(say,say) 
				frameTalk.handshake(window.top, "_Iframe").then(say,say)
			*/
			var hsPromiseInd = newPromiseInd(),
				failMsg;
				toWindow = findPostMsgFn(toWindow);
			if (!toWindow) {
				// set timer to reject, but first return the promise.
				failMsg = 'handshake needs a window object with postMessage defined';
				setTimeout(function () {
					rejectPromise(hsPromiseInd, failMsg);
				}, 500);
				return promisesTable[hsPromiseInd].promise();
			}
			if (window.top === window) {
				// handshake starts from top window
				debugSay("starting handshake from top window");
				windowFromId = "@@top@@";
			} else {
				debugSay("starting handshake from iframe: " + fromId);
				// handshake starts from child iFrame. We need to know this iframe's id and post it up to parent
				windowFromId = fromId;
			}
			// start looking for receiver window. May be not loaded/init yet, so try every 'checkTimer' milliseconds
			repeatersTable[hsPromiseInd] = setInterval(function () {
					sendOutHandShake(toWindow, windowFromId, hsPromiseInd);
				}, checkTimer);
			// set a fail timer to reject the promise
			failMsg = "handshake timeout. You can change timeout on frameTalk.failTimeLimit";
			setTimeout(function () {
				rejectPromise(hsPromiseInd, failMsg);
			}, frameTalk.failTimeLimit);
			return promisesTable[hsPromiseInd].promise();
		}
	};
	// examine promises availability
	if (typeof window.jQuery !== "function") {
		// we cannot give promises, use fallbacks
		useOfPromises = false;
		frameTalk.handshake = handshakeFallback;
		debugSay("caution, since no jQuery found, handshake functionality will not include promises");
	}
	// auto init
	frameTalk.init();
	// expose scope
	window.frameTalk = frameTalk;
}
	(window));
