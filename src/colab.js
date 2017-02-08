/* eslint-env es6, browser */

window.define((require, exports, module) => {
	"use strict";

	const
		URL = `${window.location.origin}/nes/auth`,
		xhr = new window.XMLHttpRequest();

	xhr.open("GET", URL, true);

	xhr.onreadystatechange = function onreadystatechange () {
		if (xhr.readyState === 4) {
			// DONE
			if (xhr.status === 200) {
				// OKAY
				console.info("xhr.responseText", xhr.responseText);

				const Nes = require("thirdparty/nes/lib/client.js");

				window.socket = new Nes.Client(`ws://${location.host}`);

				window.socket.connect({"options": {
					"auth": { "type": "cookie", "isSecure": false }
				}}, (err) => {
					if (err) {
						throw err;
					}

					window.socket.onUpdate = (update) => {
						console.log(update);
					};
				});
			} else {
				// Error
				console.error(xhr.responseText);
			}
		}
	};

	xhr.send();
});
