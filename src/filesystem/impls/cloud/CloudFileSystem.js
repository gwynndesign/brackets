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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, appshell, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var FileSystemError = require("filesystem/FileSystemError"),
        FileSystemStats = require("filesystem/FileSystemStats");
	
	function _postServer(func, data, callback) {
		const URL = location.origin + "/api/filesystem/" + func,
			  xhr = new XMLHttpRequest();
		
		xhr.open("POST", URL, true);

		xhr.onreadystatechange = function() {
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
		}
		
		// Send data
		if (!data) {
			xhr.send("{}");
		} else if (typeof data === "object") {
			console.info(`_postServer/typeof data === "object"`, true);
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
    
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        // FIXME
        throw new Error("showOpenDialog not supported");
    }
    
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        // FIXME
        throw new Error("showSaveDialog not supported");
    }
    
    function _forceAsync(cb) {
        return function () {
            var cbArgs = arguments;
            setTimeout(function () {
                cb.apply(null, cbArgs);
            }, 50);
        };
    }
	
	/* Can be removed, use for reference */
	var cloudContent = {
        "index.html": "<html>\n<head>\n    <title>Hello, world!</title>\n</head>\n<body>\n    Welcome to Brackets!\n</body>\n</html>",
        "main.css": ".hello {\n    content: 'world!';\n}",
        "samples": {
            "test.txt": "Sample text"
        },
        "src": {
            "test.txt": "Sample text",
            "base-config": { "dummy": "" },
            "command": { "dummy": "" },
            "document": { "dummy": "" },
            "editor": { "dummy": "" },
            "extensibility": { "dummy": "" },
            "extensions": {
                "default": {
                    "CloseOthers": { "package.json": "" },
                    "CSSCodeHints": { "dummy": "" },
                    "DarkTheme": { "dummy": "" },
                    "DebugCommands": { "dummy": "" }
                },
                "dev": {
                    "CloseOthers": { "dummy": "" },
                    "CSSCodeHints": { "dummy": "" },
                    "DarkTheme": { "dummy": "" },
                    "DebugCommands": { "dummy": "" }
                },
                "samples": { "dummy": "" }
            },
            "file": { "dummy": "" },
            "filesystem": { "dummy": "" },
            "help": { "dummy": "" },
            "htmlContent": { "dummy": "" },
            "language": { "dummy": "" },
            "LiveDevelopment": { "dummy": "" },
            "nls": { "dummy": "" },
            "preferences": { "dummy": "" },
            "project": { "dummy": "" },
            "search": { "dummy": "" },
            "styles": { "dummy": "" },
            "thirdparty": { "dummy": "" },
            "utils": { "dummy": "" },
            "view": { "dummy": "" },
            "widgets": { "dummy": "" },
            "brackets.js": "...",
            "brackets.config.json": "...",
            "config.json": "...",
        },
        "test": {
            "test.txt": "Sample text"
        }
    };
	
    function _stripTrailingSlash(path) {
        return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
    }
    
    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
    }
	
    function stat(path, callback) {
		_postServer("stat", path, (error, data) => {
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
    
    function readdir(path, callback) {
		console.info("readdir/path", path);
		
		_postServer("ls", path, (error, files) => {
			if (error) {
				// TODO
				console.error("readdir/error", error);
				callback(FileSystemError.NOT_FOUND);
				//callback(FileSystemError.INVALID_PARAMS);

				return;
			}
			
			console.info("readdir/files", files);
        
			const stats = [];

			files.forEach(function (file, index) {
				stat(file, (error, stat) => {
					if (error) {
						// TODO
						console.error("readdir/error", error);
						callback(FileSystemError.NOT_FOUND);
						//callback(FileSystemError.INVALID_PARAMS);

						return;
					}
					
					stats.push(stat);
					
					if (index === files.length - 1) {
						callback(null, files, stats);
					}
				});
			});
		});
    }
    
    function mkdir(path, mode, callback) {
        callback("Cannot modify folders on HTTP cloud server");
    }
    
    function rename(oldPath, newPath, callback) {
        callback("Cannot modify files on HTTP cloud server");
    }
    
    function readFile(path, options, callback) {
        if (typeof options === "function") {
            callback = options;
        }
		
        console.log("Reading 'file': " + path);
		
		stat(path, (statError, stats) => {
			if (statError) {
				// TODO
				
				callback(FileSystemError.NOT_FOUND);
				//callback(FileSystemError.INVALID_PARAMS);
				return;
			}
			
			_postServer("read", path, (readError, data) => {
				if (readError)  {
					callback(readError);
				} else {
					callback(null, data, stats);
				}
			});
		});
    }
    
    function writeFile(path, data, options, callback) {
		console.info("writeFile/path", path);
		console.info("writeFile/data", data);
		console.info("writeFile/options", options);
		
		_postServer("write", {{path}, {data}}, (writeError, written) => {
			if (writeError) {
				callback(writeError);
			} else {
				if (written === options.expectedContents) {
					callback(null);
				} else {
					callback(FileSystemError.NOT_WRITABLE);
				}
			}
		});
    }
    
    function unlink(path, callback) {
        callback("Cannot modify files on HTTP cloud server");
    }
    
    function moveToTrash(path, callback) {
        callback("Cannot delete files on HTTP cloud server");
    }
    
    function initWatchers(changeCallback, offlineCallback) {
        // Ignore - since this FS is immutable, we're never going to call these
    }
    
    function watchPath(path, callback) {
        console.warn("File watching is not supported on immutable HTTP cloud server");
        
        callback = _forceAsync(callback);
        callback();
    }
    
    function unwatchPath(path, callback) {
        callback = _forceAsync(callback);
        callback();
    }
    
    function unwatchAll(callback) {
        callback = _forceAsync(callback);
        callback();
    }
    
    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    
    exports.recursiveWatch    = true;
    exports.normalizeUNCPaths = false;
});