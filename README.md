frameTalk
=========
frameTalk.js provides a simple way to use window.postMessage for iFrame communication.
After loading, frameTalk will add event listener to the window it is loaded.
You have to load frameTalk.js script in all windows or iFrames you want to use it.
frameTalk.js works without any dependencies, but if jQuery is found, you can use handshake method asynchronously 
to run code after the communication between iFrames is ensured.

frameTalk object is the only public object that frameTalk.js exposes. It has following public methods and properties:

<h2>frameTalk.failTimeLimit</h2>
Default value is 5000 ms. It is the time limit until it stops trying for a handshake. 
If loading iFrames takes more than 5 seconds, you can change this limit.

```javascript
frameTalk.failTimeLimit = 15000;
```

<h2>


