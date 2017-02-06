/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */


/* eslint-env es6, browser */

window.define((require, exports, module) => {
	"use strict";

	const
		FileSystemError = require("filesystem/FileSystemError"),
		FileSystemStats = require("filesystem/FileSystemStats");

	console.log(module);

	/**
	* Posts Server with XHR
	* @param  {string}   func     The function to call from the server
	* @param  {object}   data     The data to POST the server with
	* @param  {function} callback The callback
	* @return {null}     null
	*/
	function postServer (func, data, callback) {
		const
			URL = `${window.location.origin}/api/filesystem/${func}`,
			xhr = new window.XMLHttpRequest();

		xhr.open("POST", URL, true);

		xhr.onreadystatechange = function onreadystatechange () {
			if (xhr.readyState === 4) {
				// DONE
				if (xhr.status === 200) {
					// OKAY
					console.info("xhr.responseText", xhr.responseText);

					let parsedObject;

					parsedObject = xhr.responseText;

					try {
						parsedObject = JSON.parse(xhr.responseText);
					} catch (ex) {
						console.warn(ex);
					}

					callback(null, parsedObject);
				} else {
					// Error
					console.error(xhr.responseText);
					callback(xhr.responseText);
				}
			}
		};

		// Send data
		if (!data) {
			xhr.send("{}");
		} else if (typeof data === "object") {
			console.info("_postServer/typeof data === \"object\"", true);
			xhr.setRequestHeader("Content-type", "application/json");

			try {
				xhr.send(JSON.stringify(data));
			} catch (ex) {
				callback(ex);
			}
		} else {
			xhr.send(data);
		}
	}

	exports.stat = (path, callback) => {
		postServer("stat", path, (error, data) => {
			console.info("stat/data", data);

			if (error) {
				console.error("stat/error", error);
				callback(error);
			} else {
				// convert to date
				data.mtime = new Date(data.mtime);

				callback(null, new FileSystemStats(data));
			}
		});
	};

	exports.showOpenDialog = (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) => {
		callback("showOpenDialog not supported");
	};

	exports.showSaveDialog = (title, initialPath, proposedNewFilename, callback) => {
		callback("showSaveDialog not supported");
	};

	exports.exists = (path, callback) => {
		postServer("stat", path, (error) => {
			if (error) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		});
	};

	exports.readdir = (path, callback) => {
		console.info("readdir/path", path);

		postServer("ls", path, (error, files) => {
			if (error) {
				// FUTURE
				console.error("readdir/error", error);

				callback(FileSystemError.NOT_FOUND);
				// callback(FileSystemError.INVALID_PARAMS);

				return;
			}

			console.info("readdir/files", files);

			const stats = [];

			files.forEach((file, index) => {
				exports.stat(file, (fsError, stat) => {
					if (fsError) {
						// FUTURE
						console.error("readdir/error", error);
						callback(FileSystemError.NOT_FOUND);
						// callback(FileSystemError.INVALID_PARAMS);

						return;
					}

					stats.push(stat);

					if (index === files.length - 1) {
						callback(null, files, stats);
					}
				});
			});
		});
	};

	exports.mkdir = (path, mode, callback) => {
		callback("Cannot modify folders on HTTP cloud server");
	};

	exports.rename = (oldPath, newPath, callback) => {
		callback("Cannot modify files on HTTP cloud server");
	};

	exports.readFile = (path, argumentA, argumentB) => {
		let callback;

		if (typeof argumentA === "function") {
			callback = argumentA;
		} else {
			callback = argumentB;
		}

		console.log(`Reading 'file': ${path}`);

		exports.stat(path, (statError, stats) => {
			if (statError) {
				// FUTURE

				callback(FileSystemError.NOT_FOUND);
				// cb(FileSystemError.INVALID_PARAMS);

				return;
			}

			postServer("read", path, (readError, data) => {
				if (readError) {
					callback(readError);
				} else {
					callback(null, data, stats);
				}
			});
		});
	};

	exports.writeFile = (path, data, options, callback) => {
		console.info("writeFile/path", path);
		console.info("writeFile/data", data);
		console.info("writeFile/options", options);

		exports.exists(path, (existsError, existedBefore) => {
			if (existsError) {
				callback(existsError);
			}

			postServer("write", {
				data,
				path
			}, (writeError, written) => {
				if (writeError) {
					callback(writeError);
				} else {
					console.log(options);
					console.info("written", written);
					console.info("options.expectedContents", options.expectedContents);

					if (!options.expectedContents || written === options.expectedContents) {
						exports.stat(path, (statError, stat) => {
							const created = !existedBefore;

							callback(null, stat, created);
						});
					} else {
						console.error("written !== options.expectedContents");
						callback(FileSystemError.NOT_WRITABLE);
					}
				}
			});
		});
	};

	exports.unlink = (path, callback) => {
		callback("Cannot modify files on HTTP cloud server");
	};

	exports.moveToTrash = (path, callback) => {
		callback("Cannot delete files on HTTP cloud server");
	};

	exports.initWatchers = (changeCallback, offlineCallback) => {
		// Ignore - since this FS is immutable, we're never going to call these
		offlineCallback();
	};

	exports.watchPath = (path, callback) => {
		callback("File watching is not supported on immutable HTTP cloud server");
	};

	exports.unwatchPath = (path, callback) => {
		callback("File watching is not supported on immutable HTTP cloud server");
	};

	exports.unwatchAll = (callback) => {
		callback("File watching is not supported on immutable HTTP cloud server");
	};

	exports.recursiveWatch = true;
	exports.normalizeUNCPaths = false;
});
