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
					console.error(data, xhr.responseText);
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

	function localStat (path) {
		// FUTURE

		console.info("LOCALSTAT", path);

		const
			stored = localStorage.getItem(path),
			existedBefore = Boolean(stored);

		if (existedBefore) {
			const length = existedBefore ? stored.length : 0,
				stat = {
					"hash": 0,
					"isFile": false,
					"mtime": new Date(0),
					"size": length
				};

			return new FileSystemStats(stat);
		}

		throw FileSystemError.NOT_FOUND;
	}

	function isLocalPath (path) {
		return path.indexOf("&&&doesnt_exist&&&") > -1 || path.indexOf("/extensions") > -1;
	}

	exports.stat = (path, callback) => {
		if (isLocalPath(path)) {
			console.log("LOCAL PATH STAT");

			if (localStorage.getItem(path)) {
				let stat;

				try {
					stat = localStat(path);
				} catch (ex) {
					callback(ex);

					return;
				}

				callback(null, stat);
			} else {
				callback(FileSystemError.NOT_FOUND);
			}
		} else {
			console.log("REMOTE PATH STAT");

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
		}
	};

	exports.showOpenDialog = (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) => {
		callback("showOpenDialog not supported");
	};

	exports.showSaveDialog = (title, initialPath, proposedNewFilename, callback) => {
		callback("showSaveDialog not supported");
	};

	exports.exists = (path, callback) => {
		exports.stat(path, (error) => {
			if (error) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		});
	};

	exports.readdir = (path, callback) => {
		console.info("readdir/path", path);

		if (isLocalPath(path)) {
			console.log("readdir", `${path} is a local directory`);

			const
				files = [],
				stats = [];

			Object.keys(localStorage).forEach((filePath) => {
				if (filePath.indexOf(path) === 0) {
					console.log("readdir", `${filePath} is in ${path}`);
					files.push(filePath);
					stats.push(localStat(filePath));
				} else {
					console.log("readdir", `${filePath} is *NOT* in ${path}`);
				}
			});

			callback(null, files, stats)
		} else {
			console.log("readdir", `${path} is a remote directory`);

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

				files.forEach((file) => {
					exports.stat(file, (fsError, stat) => {
						if (fsError) {
							// FUTURE
							console.error("readdir/error", error);
							callback(FileSystemError.NOT_FOUND);
							// callback(FileSystemError.INVALID_PARAMS);

							return;
						}

						console.log("readdir/foreach/newstat", stat);
						stats.push(stat);

						if (stats.length === files.length) {
							console.log("readdir/foreach/files", files);
							console.log("readdir/foreach/stats", stats);
							callback(null, files, stats);
						}
					});
				});
			});
		}
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

		if (isLocalPath(path)) {
			console.info("isLocalPath//read", path);

			const local = localStorage.getItem(path);

			if (local) {
				callback(null, local, localStat(path));
			} else {
				console.warn(`Local File not fond (${path})`);
				callback(FileSystemError.NOT_FOUND);
			}
		} else {
			console.info("postServer//read", path);

			exports.stat(path, (statError, stats) => {
				if (statError) {
					// FUTURE

					callback(FileSystemError.NOT_FOUND);
					// cb(FileSystemError.INVALID_PARAMS);

					return;
				}

				if (path.indexOf("&&&doesnt_exist&&&") > -1 || path.indexOf("/extensions") > -1) {
					localStorage.getItem(path);
				} else {
					postServer("read", path, (readError, data) => {
						if (readError) {
							callback(readError);
						} else {
							callback(null, data, stats);
						}
					});
				}
			});
		}
	};

	exports.writeFile = (path, data, options, callback) => {
		console.info("writeFile/path", path);
		console.info("writeFile/data", data);
		console.info("writeFile/options", options);

		if (isLocalPath(path)) {
			// FUTURE
			console.info("writeFile/isLocalPath", true);

			const
				stored = localStorage.getItem(path),
				existedBefore = Boolean(stored);

			window.localStorage.setItem(path, data);

			callback(null, localStat(path), !existedBefore);
		} else {
			console.info("writeFile/isLocalPath", false);

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
		}
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
		// callback();
	};

	exports.unwatchAll = (callback) => {
		callback("File watching is not supported on immutable HTTP cloud server");
	};

	exports.recursiveWatch = true;
	exports.normalizeUNCPaths = false;
});
