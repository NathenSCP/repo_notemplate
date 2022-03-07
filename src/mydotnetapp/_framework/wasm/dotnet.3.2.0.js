var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";

function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8")
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function(status) {
        process["exit"](status)
    };
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function(status) {
            quit(status)
        }
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    } {
        read_ = function shell_read(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function readBinary(url) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            };
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
    setWindowTitle = function(title) {
        document.title = title
    }
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];

function dynamicAlloc(size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = ret + size + 15 & -16;
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    return ret
}

function getNativeTypeSize(type) {
    switch (type) {
        case "i1":
        case "i8":
            return 1;
        case "i16":
            return 2;
        case "i32":
            return 4;
        case "i64":
            return 8;
        case "float":
            return 4;
        case "double":
            return 8;
        default: {
            if (type[type.length - 1] === "*") {
                return 4
            } else if (type[0] === "i") {
                var bits = Number(type.substr(1));
                assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                return bits / 8
            } else {
                return 0
            }
        }
    }
}

function convertJsFunctionToWasm(func, sig) {
    if (typeof WebAssembly.Function === "function") {
        var typeNames = {
            "i": "i32",
            "j": "i64",
            "f": "f32",
            "d": "f64"
        };
        var type = {
            parameters: [],
            results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
        };
        for (var i = 1; i < sig.length; ++i) {
            type.parameters.push(typeNames[sig[i]])
        }
        return new WebAssembly.Function(type, func)
    }
    var typeSection = [1, 0, 1, 96];
    var sigRet = sig.slice(0, 1);
    var sigParam = sig.slice(1);
    var typeCodes = {
        "i": 127,
        "j": 126,
        "f": 125,
        "d": 124
    };
    typeSection.push(sigParam.length);
    for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]])
    }
    if (sigRet == "v") {
        typeSection.push(0)
    } else {
        typeSection = typeSection.concat([1, typeCodes[sigRet]])
    }
    typeSection[1] = typeSection.length - 2;
    var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
    var module = new WebAssembly.Module(bytes);
    var instance = new WebAssembly.Instance(module, {
        "e": {
            "f": func
        }
    });
    var wrappedFunc = instance.exports["f"];
    return wrappedFunc
}
var freeTableIndexes = [];

function addFunctionWasm(func, sig) {
    var table = wasmTable;
    var ret;
    if (freeTableIndexes.length) {
        ret = freeTableIndexes.pop()
    } else {
        ret = table.length;
        try {
            table.grow(1)
        } catch (err) {
            if (!(err instanceof RangeError)) {
                throw err
            }
            throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH."
        }
    }
    try {
        table.set(ret, func)
    } catch (err) {
        if (!(err instanceof TypeError)) {
            throw err
        }
        assert(typeof sig !== "undefined", "Missing signature argument to addFunction");
        var wrapped = convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped)
    }
    return ret
}

function addFunction(func, sig) {
    return addFunctionWasm(func, sig)
}
var tempRet0 = 0;
var setTempRet0 = function(value) {
    tempRet0 = value
};
var getTempRet0 = function() {
    return tempRet0
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime;
if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
if (typeof WebAssembly !== "object") {
    err("no native wasm support detected")
}

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for getValue: " + type)
    }
    return null
}
var wasmMemory;
var wasmTable = new WebAssembly.Table({
    "initial": 1720,
    "maximum": 1720 + 0,
    "element": "anyfunc"
});
var ABORT = false;
var EXITSTATUS = 0;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func
}

function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
        "string": function(str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        },
        "array": function(arr) {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };

    function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret
}

function cwrap(ident, returnType, argTypes, opts) {
    argTypes = argTypes || [];
    var numericArgs = argTypes.every(function(type) {
        return type === "number"
    });
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
        return getCFunc(ident)
    }
    return function() {
        return ccall(ident, returnType, argTypes, arguments, opts)
    }
}
var ALLOC_NONE = 3;

function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}

function getMemory(size) {
    if (!runtimeInitialized) return dynamicAlloc(size);
    return _malloc(size)
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = u8Array[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}

function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4
    }
    return len
}
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function stringToUTF16(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2
    }
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr
}

function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
var WASM_PAGE_SIZE = 65536;

function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - x % multiple
    }
    return x
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var STACK_MAX = 699248,
    DYNAMIC_BASE = 5942128,
    DYNAMICTOP_PTR = 699088;
var TOTAL_STACK = 5242880;
var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"]
} else {
    wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
    })
}
if (wasmMemory) {
    buffer = wasmMemory.buffer
}
INITIAL_INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Module["dynCall_v"](func)
            } else {
                Module["dynCall_vi"](func, callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    SOCKFS.root = FS.mount(SOCKFS, {}, null);
    PIPEFS.root = FS.mount(PIPEFS, {}, null);
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    runtimeExited = true
}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var Math_abs = Math.abs;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_min = Math.min;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};

function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    what += "";
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    throw new WebAssembly.RuntimeError(what)
}
var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
    return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
}
var wasmBinaryFile = "dotnet.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}

function getBinary() {
    try {
        if (wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(wasmBinaryFile)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch (err) {
        abort(err)
    }
}

function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
        wasmBinaryFile =  wasmBinaryFile + ".png";
        return fetch(wasmBinaryFile, {
            credentials: "same-origin"
        }).then(function(response) {
            if (!response["ok"]) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
            }
            return response["arrayBuffer"]()
        }).catch(function() {
            return getBinary()
        })
    }
    return new Promise(function(resolve, reject) {
        resolve(getBinary())
    })
}

function createWasm() {
    var info = {
        "a": asmLibraryArg
    };

    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");

    function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"])
    }

    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            return WebAssembly.instantiate(binary, info)
        }).then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }

    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
            fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource, function(reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    instantiateArrayBuffer(receiveInstantiatedSource)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    50152: function($0, $1, $2) {
        MONO.mono_wasm_add_typed_value("array", $0, {
            objectId: $1,
            length: $2
        })
    },
    566840: function() {
        return STACK_MAX
    },
    566862: function() {
        return TOTAL_STACK
    },
    640206: function($0, $1) {
        MONO.string_decoder.decode($0, $0 + $1, true)
    },
    640489: function($0, $1, $2) {
        var str = MONO.string_decoder.decode($0, $0 + $1);
        try {
            var res = eval(str);
            if (res === null || res == undefined) return 0;
            res = res.toString();
            setValue($2, 0, "i32")
        } catch (e) {
            res = e.toString();
            setValue($2, 1, "i32");
            if (res === null || res === undefined) res = "unknown exception"
        }
        var buff = Module._malloc((res.length + 1) * 2);
        stringToUTF16(res, buff, (res.length + 1) * 2);
        return buff
    },
    640908: function() {
        var err = new Error;
        console.log("Stacktrace: \n");
        console.log(err.stack)
    }
};

function _emscripten_asm_const_iii(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}

function mono_wasm_timezone_get_local_name() {
    var res = "UTC";
    try {
        res = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (e) {}
    var buff = Module._malloc((res.length + 1) * 2);
    stringToUTF16(res, buff, (res.length + 1) * 2);
    return buff
}

function compile_function(snippet_ptr, len, is_exception) {
    try {
        var data = MONO.string_decoder.decode(snippet_ptr, snippet_ptr + len);
        var wrapper = "(function () { " + data + " })";
        var funcFactory = eval(wrapper);
        var func = funcFactory();
        if (typeof func !== "function") {
            throw new Error("Code must return an instance of a JavaScript function. " + "Please use `return` statement to return a function.")
        }
        setValue(is_exception, 0, "i32");
        return BINDING.js_to_mono_obj(func)
    } catch (e) {
        res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || res === undefined) res = "unknown exception";
        return BINDING.js_to_mono_obj(res)
    }
}
__ATINIT__.push({
    func: function() {
        ___wasm_call_ctors()
    }
});

function demangle(func) {
    return func
}

function demangleAll(text) {
    var regex = /\b_Z[\w\d_]+/g;
    return text.replace(regex, function(x) {
        var y = demangle(x);
        return x === y ? x : y + " [" + x + "]"
    })
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}

function ___assert_fail(condition, filename, line, func) {
    abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else _emscripten_get_now = function() {
    return performance.now()
};
var _emscripten_get_now_is_monotonic = true;

function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value
}

function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now()
    } else {
        ___setErrNo(28);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}

function ___clock_gettime(a0, a1) {
    return _clock_gettime(a0, a1)
}

function ___cxa_allocate_exception(size) {
    return _malloc(size)
}
var ___exception_infos = {};
var ___exception_caught = [];

function ___exception_addRef(ptr) {
    if (!ptr) return;
    var info = ___exception_infos[ptr];
    info.refcount++
}

function ___exception_deAdjust(adjusted) {
    if (!adjusted || ___exception_infos[adjusted]) return adjusted;
    for (var key in ___exception_infos) {
        var ptr = +key;
        var adj = ___exception_infos[ptr].adjusted;
        var len = adj.length;
        for (var i = 0; i < len; i++) {
            if (adj[i] === adjusted) {
                return ptr
            }
        }
    }
    return adjusted
}

function ___cxa_begin_catch(ptr) {
    var info = ___exception_infos[ptr];
    if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exceptions--
    }
    if (info) info.rethrown = false;
    ___exception_caught.push(ptr);
    ___exception_addRef(___exception_deAdjust(ptr));
    return ptr
}
var ___exception_last = 0;

function ___cxa_free_exception(ptr) {
    try {
        return _free(ptr)
    } catch (e) {}
}

function ___exception_decRef(ptr) {
    if (!ptr) return;
    var info = ___exception_infos[ptr];
    info.refcount--;
    if (info.refcount === 0 && !info.rethrown) {
        if (info.destructor) {
            Module["dynCall_ii"](info.destructor, ptr)
        }
        delete ___exception_infos[ptr];
        ___cxa_free_exception(ptr)
    }
}

function ___cxa_end_catch() {
    _setThrew(0);
    var ptr = ___exception_caught.pop();
    if (ptr) {
        ___exception_decRef(___exception_deAdjust(ptr));
        ___exception_last = 0
    }
}

function ___cxa_find_matching_catch_3() {
    var thrown = ___exception_last;
    if (!thrown) {
        return (setTempRet0(0), 0) | 0
    }
    var info = ___exception_infos[thrown];
    var throwntype = info.type;
    if (!throwntype) {
        return (setTempRet0(0), thrown) | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var pointer = ___cxa_is_pointer_type(throwntype);
    var buffer = 0;
    HEAP32[buffer >> 2] = thrown;
    thrown = buffer;
    for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && ___cxa_can_catch(typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[thrown >> 2];
            info.adjusted.push(thrown);
            return (setTempRet0(typeArray[i]), thrown) | 0
        }
    }
    thrown = HEAP32[thrown >> 2];
    return (setTempRet0(throwntype), thrown) | 0
}

function ___cxa_throw(ptr, type, destructor) {
    ___exception_infos[ptr] = {
        ptr: ptr,
        adjusted: [ptr],
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
    };
    ___exception_last = ptr;
    if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exceptions = 1
    } else {
        __ZSt18uncaught_exceptionv.uncaught_exceptions++
    }
    throw ptr
}

function ___resumeException(ptr) {
    if (!___exception_last) {
        ___exception_last = ptr
    }
    throw ptr
}
var PATH = {
    splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    },
    extname: function(path) {
        return PATH.splitPath(path)[3]
    },
    join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function(l, r) {
        return PATH.normalize(l + "/" + r)
    }
};
var PATH_FS = {
    resolve: function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
            return !!p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function() {},
    shutdown: function() {},
    register: function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};
var MEMFS = {
    ops_table: null,
    mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    getFileDataAsRegularArray: function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    },
    getFileDataAsTypedArray: function(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return
    },
    resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    },
    node_ops: {
        getattr: function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function(parent, name) {
            throw FS.genericErrors[44]
        },
        mknod: function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        },
        unlink: function(parent, name) {
            delete parent.contents[name]
        },
        rmdir: function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name]
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false
            }
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate: function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function(stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer.buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                var fromHeap = buffer.buffer == HEAP8.buffer;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }(fromHeap ? HEAP8 : buffer).set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    },
    lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    },
    hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function(node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function(node) {
        return node === node.parent
    },
    isMountpoint: function(node) {
        return !!node.mounted
    },
    isFile: function(mode) {
        return (mode & 61440) === 32768
    },
    isDir: function(mode) {
        return (mode & 61440) === 16384
    },
    isLink: function(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function(mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function(mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 2
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 2
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup: function(dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0
    },
    mayCreate: function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen: function(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStream: function(fd) {
        return FS.streams[fd]
    },
    createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function() {};
            FS.FSStream.prototype = {
                object: {
                    get: function() {
                        return this.node
                    },
                    set: function(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function() {
                        return this.flags & 1024
                    }
                }
            }
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function() {
            throw new FS.ErrnoError(70)
        }
    },
    major: function(dev) {
        return dev >> 8
    },
    minor: function(dev) {
        return dev & 255
    },
    makedev: function(ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function(dev) {
        return FS.devices[dev]
    },
    getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }

        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20) throw e
            }
        }
    },
    mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch (e) {
            throw new FS.ErrnoError(10)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function(path) {
        return FS.stat(path, true)
    },
    chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function(stream) {
        return stream.fd === null
    },
    llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function(stream, buffer, offset, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function(stream) {
        return 0
    },
    ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function() {
        return FS.currentPath
    },
    chdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function() {
                return 0
            },
            write: function(stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
            var randomBuffer = new Uint8Array(1);
            random_device = function() {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            }
        } else if (ENVIRONMENT_IS_NODE) {
            try {
                var crypto_module = require("crypto");
                random_device = function() {
                    return crypto_module["randomBytes"](1)[0]
                }
            } catch (e) {}
        } else {}
        if (!random_device) {
            random_device = function() {
                abort("random_device")
            }
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function() {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: function() {
                                    return stream.path
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams: function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        var stdout = FS.open("/dev/stdout", "w");
        var stderr = FS.open("/dev/stderr", "w")
    },
    ensureErrnoError: function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno
            };
            this.setErrno(errno);
            this.message = "FS error"
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS
        }
    },
    init: function(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    },
    joinPath: function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    },
    absolutePath: function(relative, base) {
        return PATH_FS.resolve(base, relative)
    },
    standardizePath: function(path) {
        return PATH.normalize(path)
    },
    findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    },
    analyzePath: function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createFolder: function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    },
    createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    },
    createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function(stream) {
                stream.seekable = false
            },
            close: function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    createLink: function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path)
    },
    forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(29);
        return success
    },
    createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(29)
                }
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(29)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function() {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    });
                    handled = true
                }
            });
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function(byteArray) {
                processData(byteArray)
            }, onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function() {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    mappings: {},
    DEFAULT_POLLMASK: 5,
    umask: 511,
    calculateAt: function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(8);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    },
    doStat: function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -28
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function(path, amode) {
        if (amode & ~7) {
            return -28
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    },
    doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    },
    doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    },
    varargs: undefined,
    get: function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    },
    getStreamFromFD: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream
    },
    get64: function(low, high) {
        return low
    }
};

function ___syscall10(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135
};
var SOCKFS = {
    mount: function(mount) {
        Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function(event, callback) {
            if ("function" === typeof callback) {
                this._callbacks[event] = callback
            }
            return this
        };
        Module["websocket"].emit = function(event, param) {
            if ("function" === typeof this._callbacks[event]) {
                this._callbacks[event].call(this, param)
            }
        };
        return FS.createNode(null, "/", 16384 | 511, 0)
    },
    createSocket: function(family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
            assert(streaming == (protocol == 6))
        }
        var sock = {
            family: family,
            type: type,
            protocol: protocol,
            server: null,
            error: null,
            peers: {},
            pending: [],
            recv_queue: [],
            sock_ops: SOCKFS.websocket_sock_ops
        };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({
            path: name,
            node: node,
            flags: FS.modeStringToFlags("r+"),
            seekable: false,
            stream_ops: SOCKFS.stream_ops
        });
        sock.stream = stream;
        return sock
    },
    getSocket: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
            return null
        }
        return stream.node.sock
    },
    stream_ops: {
        poll: function(stream) {
            var sock = stream.node.sock;
            return sock.sock_ops.poll(sock)
        },
        ioctl: function(stream, request, varargs) {
            var sock = stream.node.sock;
            return sock.sock_ops.ioctl(sock, request, varargs)
        },
        read: function(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            var msg = sock.sock_ops.recvmsg(sock, length);
            if (!msg) {
                return 0
            }
            buffer.set(msg.buffer, offset);
            return msg.buffer.length
        },
        write: function(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            return sock.sock_ops.sendmsg(sock, buffer, offset, length)
        },
        close: function(stream) {
            var sock = stream.node.sock;
            sock.sock_ops.close(sock)
        }
    },
    nextname: function() {
        if (!SOCKFS.nextname.current) {
            SOCKFS.nextname.current = 0
        }
        return "socket[" + SOCKFS.nextname.current++ + "]"
    },
    websocket_sock_ops: {
        createPeer: function(sock, addr, port) {
            var ws;
            if (typeof addr === "object") {
                ws = addr;
                addr = null;
                port = null
            }
            if (ws) {
                if (ws._socket) {
                    addr = ws._socket.remoteAddress;
                    port = ws._socket.remotePort
                } else {
                    var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
                    if (!result) {
                        throw new Error("WebSocket URL must be in the format ws(s)://address:port")
                    }
                    addr = result[1];
                    port = parseInt(result[2], 10)
                }
            } else {
                try {
                    var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
                    var url = "ws:#".replace("#", "//");
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["url"]) {
                            url = Module["websocket"]["url"]
                        }
                    }
                    if (url === "ws://" || url === "wss://") {
                        var parts = addr.split("/");
                        url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/")
                    }
                    var subProtocols = "binary";
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["subprotocol"]) {
                            subProtocols = Module["websocket"]["subprotocol"]
                        }
                    }
                    var opts = undefined;
                    if (subProtocols !== "null") {
                        subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
                        opts = ENVIRONMENT_IS_NODE ? {
                            "protocol": subProtocols.toString()
                        } : subProtocols
                    }
                    if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
                        subProtocols = "null";
                        opts = undefined
                    }
                    var WebSocketConstructor;
                    if (ENVIRONMENT_IS_NODE) {
                        WebSocketConstructor = require("ws")
                    } else {
                        WebSocketConstructor = WebSocket
                    }
                    ws = new WebSocketConstructor(url, opts);
                    ws.binaryType = "arraybuffer"
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH)
                }
            }
            var peer = {
                addr: addr,
                port: port,
                socket: ws,
                dgram_send_queue: []
            };
            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
            SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
            if (sock.type === 2 && typeof sock.sport !== "undefined") {
                peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]))
            }
            return peer
        },
        getPeer: function(sock, addr, port) {
            return sock.peers[addr + ":" + port]
        },
        addPeer: function(sock, peer) {
            sock.peers[peer.addr + ":" + peer.port] = peer
        },
        removePeer: function(sock, peer) {
            delete sock.peers[peer.addr + ":" + peer.port]
        },
        handlePeerEvents: function(sock, peer) {
            var first = true;
            var handleOpen = function() {
                Module["websocket"].emit("open", sock.stream.fd);
                try {
                    var queued = peer.dgram_send_queue.shift();
                    while (queued) {
                        peer.socket.send(queued);
                        queued = peer.dgram_send_queue.shift()
                    }
                } catch (e) {
                    peer.socket.close()
                }
            };

            function handleMessage(data) {
                if (typeof data === "string") {
                    var encoder = new TextEncoder;
                    data = encoder.encode(data)
                } else {
                    assert(data.byteLength !== undefined);
                    if (data.byteLength == 0) {
                        return
                    } else {
                        data = new Uint8Array(data)
                    }
                }
                var wasfirst = first;
                first = false;
                if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
                    var newport = data[8] << 8 | data[9];
                    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
                    peer.port = newport;
                    SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                    return
                }
                sock.recv_queue.push({
                    addr: peer.addr,
                    port: peer.port,
                    data: data
                });
                Module["websocket"].emit("message", sock.stream.fd)
            }
            if (ENVIRONMENT_IS_NODE) {
                peer.socket.on("open", handleOpen);
                peer.socket.on("message", function(data, flags) {
                    if (!flags.binary) {
                        return
                    }
                    handleMessage(new Uint8Array(data).buffer)
                });
                peer.socket.on("close", function() {
                    Module["websocket"].emit("close", sock.stream.fd)
                });
                peer.socket.on("error", function(error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                })
            } else {
                peer.socket.onopen = handleOpen;
                peer.socket.onclose = function() {
                    Module["websocket"].emit("close", sock.stream.fd)
                };
                peer.socket.onmessage = function peer_socket_onmessage(event) {
                    handleMessage(event.data)
                };
                peer.socket.onerror = function(error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                }
            }
        },
        poll: function(sock) {
            if (sock.type === 1 && sock.server) {
                return sock.pending.length ? 64 | 1 : 0
            }
            var mask = 0;
            var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
            if (sock.recv_queue.length || !dest || dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                mask |= 64 | 1
            }
            if (!dest || dest && dest.socket.readyState === dest.socket.OPEN) {
                mask |= 4
            }
            if (dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                mask |= 16
            }
            return mask
        },
        ioctl: function(sock, request, arg) {
            switch (request) {
                case 21531:
                    var bytes = 0;
                    if (sock.recv_queue.length) {
                        bytes = sock.recv_queue[0].data.length
                    }
                    HEAP32[arg >> 2] = bytes;
                    return 0;
                default:
                    return ERRNO_CODES.EINVAL
            }
        },
        close: function(sock) {
            if (sock.server) {
                try {
                    sock.server.close()
                } catch (e) {}
                sock.server = null
            }
            var peers = Object.keys(sock.peers);
            for (var i = 0; i < peers.length; i++) {
                var peer = sock.peers[peers[i]];
                try {
                    peer.socket.close()
                } catch (e) {}
                SOCKFS.websocket_sock_ops.removePeer(sock, peer)
            }
            return 0
        },
        bind: function(sock, addr, port) {
            if (typeof sock.saddr !== "undefined" || typeof sock.sport !== "undefined") {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            sock.saddr = addr;
            sock.sport = port;
            if (sock.type === 2) {
                if (sock.server) {
                    sock.server.close();
                    sock.server = null
                }
                try {
                    sock.sock_ops.listen(sock, 0)
                } catch (e) {
                    if (!(e instanceof FS.ErrnoError)) throw e;
                    if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e
                }
            }
        },
        connect: function(sock, addr, port) {
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
            }
            if (typeof sock.daddr !== "undefined" && typeof sock.dport !== "undefined") {
                var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                if (dest) {
                    if (dest.socket.readyState === dest.socket.CONNECTING) {
                        throw new FS.ErrnoError(ERRNO_CODES.EALREADY)
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EISCONN)
                    }
                }
            }
            var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
            sock.daddr = peer.addr;
            sock.dport = peer.port;
            throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS)
        },
        listen: function(sock, backlog) {
            if (!ENVIRONMENT_IS_NODE) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
            }
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            var WebSocketServer = require("ws").Server;
            var host = sock.saddr;
            sock.server = new WebSocketServer({
                host: host,
                port: sock.sport
            });
            Module["websocket"].emit("listen", sock.stream.fd);
            sock.server.on("connection", function(ws) {
                if (sock.type === 1) {
                    var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
                    var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
                    newsock.daddr = peer.addr;
                    newsock.dport = peer.port;
                    sock.pending.push(newsock);
                    Module["websocket"].emit("connection", newsock.stream.fd)
                } else {
                    SOCKFS.websocket_sock_ops.createPeer(sock, ws);
                    Module["websocket"].emit("connection", sock.stream.fd)
                }
            });
            sock.server.on("closed", function() {
                Module["websocket"].emit("close", sock.stream.fd);
                sock.server = null
            });
            sock.server.on("error", function(error) {
                sock.error = ERRNO_CODES.EHOSTUNREACH;
                Module["websocket"].emit("error", [sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable"])
            })
        },
        accept: function(listensock) {
            if (!listensock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            var newsock = listensock.pending.shift();
            newsock.stream.flags = listensock.stream.flags;
            return newsock
        },
        getname: function(sock, peer) {
            var addr, port;
            if (peer) {
                if (sock.daddr === undefined || sock.dport === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                }
                addr = sock.daddr;
                port = sock.dport
            } else {
                addr = sock.saddr || 0;
                port = sock.sport || 0
            }
            return {
                addr: addr,
                port: port
            }
        },
        sendmsg: function(sock, buffer, offset, length, addr, port) {
            if (sock.type === 2) {
                if (addr === undefined || port === undefined) {
                    addr = sock.daddr;
                    port = sock.dport
                }
                if (addr === undefined || port === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ)
                }
            } else {
                addr = sock.daddr;
                port = sock.dport
            }
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
            if (sock.type === 1) {
                if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                } else if (dest.socket.readyState === dest.socket.CONNECTING) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
            }
            if (ArrayBuffer.isView(buffer)) {
                offset += buffer.byteOffset;
                buffer = buffer.buffer
            }
            var data;
            data = buffer.slice(offset, offset + length);
            if (sock.type === 2) {
                if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
                    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port)
                    }
                    dest.dgram_send_queue.push(data);
                    return length
                }
            }
            try {
                dest.socket.send(data);
                return length
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
        },
        recvmsg: function(sock, length) {
            if (sock.type === 1 && sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
            }
            var queued = sock.recv_queue.shift();
            if (!queued) {
                if (sock.type === 1) {
                    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                    if (!dest) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                    } else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        return null
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                } else {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
            }
            var queuedLength = queued.data.byteLength || queued.data.length;
            var queuedOffset = queued.data.byteOffset || 0;
            var queuedBuffer = queued.data.buffer || queued.data;
            var bytesRead = Math.min(length, queuedLength);
            var res = {
                buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
                addr: queued.addr,
                port: queued.port
            };
            if (sock.type === 1 && bytesRead < queuedLength) {
                var bytesRemaining = queuedLength - bytesRead;
                queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
                sock.recv_queue.unshift(queued)
            }
            return res
        }
    }
};

function __inet_pton4_raw(str) {
    var b = str.split(".");
    for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp
    }
    return (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) >>> 0
}

function jstoi_q(str) {
    return parseInt(str, undefined)
}

function __inet_pton6_raw(str) {
    var words;
    var w, offset, z;
    var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
    var parts = [];
    if (!valid6regx.test(str)) {
        return null
    }
    if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0]
    }
    if (str.indexOf("::") === 0) {
        str = str.replace("::", "Z:")
    } else {
        str = str.replace("::", ":Z:")
    }
    if (str.indexOf(".") > 0) {
        str = str.replace(new RegExp("[.]", "g"), ":");
        words = str.split(":");
        words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
        words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
        words = words.slice(0, words.length - 2)
    } else {
        words = str.split(":")
    }
    offset = 0;
    z = 0;
    for (w = 0; w < words.length; w++) {
        if (typeof words[w] === "string") {
            if (words[w] === "Z") {
                for (z = 0; z < 8 - words.length + 1; z++) {
                    parts[w + z] = 0
                }
                offset = z - 1
            } else {
                parts[w + offset] = _htons(parseInt(words[w], 16))
            }
        } else {
            parts[w + offset] = words[w]
        }
    }
    return [parts[1] << 16 | parts[0], parts[3] << 16 | parts[2], parts[5] << 16 | parts[4], parts[7] << 16 | parts[6]]
}
var DNS = {
    address_map: {
        id: 1,
        addrs: {},
        names: {}
    },
    lookup_name: function(name) {
        var res = __inet_pton4_raw(name);
        if (res !== null) {
            return name
        }
        res = __inet_pton6_raw(name);
        if (res !== null) {
            return name
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
            addr = DNS.address_map.addrs[name]
        } else {
            var id = DNS.address_map.id++;
            assert(id < 65535, "exceeded max address mappings of 65535");
            addr = "172.29." + (id & 255) + "." + (id & 65280);
            DNS.address_map.names[addr] = name;
            DNS.address_map.addrs[name] = addr
        }
        return addr
    },
    lookup_addr: function(addr) {
        if (DNS.address_map.names[addr]) {
            return DNS.address_map.names[addr]
        }
        return null
    }
};

function __inet_ntop4_raw(addr) {
    return (addr & 255) + "." + (addr >> 8 & 255) + "." + (addr >> 16 & 255) + "." + (addr >> 24 & 255)
}

function __inet_ntop6_raw(ints) {
    var str = "";
    var word = 0;
    var longest = 0;
    var lastzero = 0;
    var zstart = 0;
    var len = 0;
    var i = 0;
    var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
    var hasipv4 = true;
    var v4part = "";
    for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) {
            hasipv4 = false;
            break
        }
    }
    if (hasipv4) {
        v4part = __inet_ntop4_raw(parts[6] | parts[7] << 16);
        if (parts[5] === -1) {
            str = "::ffff:";
            str += v4part;
            return str
        }
        if (parts[5] === 0) {
            str = "::";
            if (v4part === "0.0.0.0") v4part = "";
            if (v4part === "0.0.0.1") v4part = "1";
            str += v4part;
            return str
        }
    }
    for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
            if (word - lastzero > 1) {
                len = 0
            }
            lastzero = word;
            len++
        }
        if (len > longest) {
            longest = len;
            zstart = word - longest + 1
        }
    }
    for (word = 0; word < 8; word++) {
        if (longest > 1) {
            if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                if (word === zstart) {
                    str += ":";
                    if (zstart === 0) str += ":"
                }
                continue
            }
        }
        str += Number(_ntohs(parts[word] & 65535)).toString(16);
        str += word < 7 ? ":" : ""
    }
    return str
}

function __read_sockaddr(sa, salen) {
    var family = HEAP16[sa >> 1];
    var port = _ntohs(HEAPU16[sa + 2 >> 1]);
    var addr;
    switch (family) {
        case 2:
            if (salen !== 16) {
                return {
                    errno: 28
                }
            }
            addr = HEAP32[sa + 4 >> 2];
            addr = __inet_ntop4_raw(addr);
            break;
        case 10:
            if (salen !== 28) {
                return {
                    errno: 28
                }
            }
            addr = [HEAP32[sa + 8 >> 2], HEAP32[sa + 12 >> 2], HEAP32[sa + 16 >> 2], HEAP32[sa + 20 >> 2]];
            addr = __inet_ntop6_raw(addr);
            break;
        default:
            return {
                errno: 5
            }
    }
    return {
        family: family,
        addr: addr,
        port: port
    }
}

function __write_sockaddr(sa, family, addr, port) {
    switch (family) {
        case 2:
            addr = __inet_pton4_raw(addr);
            HEAP16[sa >> 1] = family;
            HEAP32[sa + 4 >> 2] = addr;
            HEAP16[sa + 2 >> 1] = _htons(port);
            break;
        case 10:
            addr = __inet_pton6_raw(addr);
            HEAP32[sa >> 2] = family;
            HEAP32[sa + 8 >> 2] = addr[0];
            HEAP32[sa + 12 >> 2] = addr[1];
            HEAP32[sa + 16 >> 2] = addr[2];
            HEAP32[sa + 20 >> 2] = addr[3];
            HEAP16[sa + 2 >> 1] = _htons(port);
            HEAP32[sa + 4 >> 2] = 0;
            HEAP32[sa + 24 >> 2] = 0;
            break;
        default:
            return {
                errno: 5
            }
    }
    return {}
}

function ___syscall102(call, socketvararg) {
    try {
        SYSCALLS.varargs = socketvararg;
        var getSocketFromFD = function() {
            var socket = SOCKFS.getSocket(SYSCALLS.get());
            if (!socket) throw new FS.ErrnoError(8);
            return socket
        };
        var getSocketAddress = function(allowNull) {
            var addrp = SYSCALLS.get(),
                addrlen = SYSCALLS.get();
            if (allowNull && addrp === 0) return null;
            var info = __read_sockaddr(addrp, addrlen);
            if (info.errno) throw new FS.ErrnoError(info.errno);
            info.addr = DNS.lookup_addr(info.addr) || info.addr;
            return info
        };
        switch (call) {
            case 1: {
                var domain = SYSCALLS.get(),
                    type = SYSCALLS.get(),
                    protocol = SYSCALLS.get();
                var sock = SOCKFS.createSocket(domain, type, protocol);
                return sock.stream.fd
            }
            case 2: {
                var sock = getSocketFromFD(),
                    info = getSocketAddress();
                sock.sock_ops.bind(sock, info.addr, info.port);
                return 0
            }
            case 3: {
                var sock = getSocketFromFD(),
                    info = getSocketAddress();
                sock.sock_ops.connect(sock, info.addr, info.port);
                return 0
            }
            case 4: {
                var sock = getSocketFromFD(),
                    backlog = SYSCALLS.get();
                sock.sock_ops.listen(sock, backlog);
                return 0
            }
            case 5: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var newsock = sock.sock_ops.accept(sock);
                if (addr) {
                    var res = __write_sockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport)
                }
                return newsock.stream.fd
            }
            case 6: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport);
                return 0
            }
            case 7: {
                var sock = getSocketFromFD(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                if (!sock.daddr) {
                    return -53
                }
                var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport);
                return 0
            }
            case 11: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    length = SYSCALLS.get(),
                    flags = SYSCALLS.get(),
                    dest = getSocketAddress(true);
                if (!dest) {
                    return FS.write(sock.stream, HEAP8, message, length)
                } else {
                    return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port)
                }
            }
            case 12: {
                var sock = getSocketFromFD(),
                    buf = SYSCALLS.get(),
                    len = SYSCALLS.get(),
                    flags = SYSCALLS.get(),
                    addr = SYSCALLS.get(),
                    addrlen = SYSCALLS.get();
                var msg = sock.sock_ops.recvmsg(sock, len);
                if (!msg) return 0;
                if (addr) {
                    var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port)
                }
                HEAPU8.set(msg.buffer, buf);
                return msg.buffer.byteLength
            }
            case 14: {
                return -50
            }
            case 15: {
                var sock = getSocketFromFD(),
                    level = SYSCALLS.get(),
                    optname = SYSCALLS.get(),
                    optval = SYSCALLS.get(),
                    optlen = SYSCALLS.get();
                if (level === 1) {
                    if (optname === 4) {
                        HEAP32[optval >> 2] = sock.error;
                        HEAP32[optlen >> 2] = 4;
                        sock.error = null;
                        return 0
                    }
                }
                return -50
            }
            case 16: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    flags = SYSCALLS.get();
                var iov = HEAP32[message + 8 >> 2];
                var num = HEAP32[message + 12 >> 2];
                var addr, port;
                var name = HEAP32[message >> 2];
                var namelen = HEAP32[message + 4 >> 2];
                if (name) {
                    var info = __read_sockaddr(name, namelen);
                    if (info.errno) return -info.errno;
                    port = info.port;
                    addr = DNS.lookup_addr(info.addr) || info.addr
                }
                var total = 0;
                for (var i = 0; i < num; i++) {
                    total += HEAP32[iov + (8 * i + 4) >> 2]
                }
                var view = new Uint8Array(total);
                var offset = 0;
                for (var i = 0; i < num; i++) {
                    var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                    var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                    for (var j = 0; j < iovlen; j++) {
                        view[offset++] = HEAP8[iovbase + j >> 0]
                    }
                }
                return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port)
            }
            case 17: {
                var sock = getSocketFromFD(),
                    message = SYSCALLS.get(),
                    flags = SYSCALLS.get();
                var iov = HEAP32[message + 8 >> 2];
                var num = HEAP32[message + 12 >> 2];
                var total = 0;
                for (var i = 0; i < num; i++) {
                    total += HEAP32[iov + (8 * i + 4) >> 2]
                }
                var msg = sock.sock_ops.recvmsg(sock, total);
                if (!msg) return 0;
                var name = HEAP32[message >> 2];
                if (name) {
                    var res = __write_sockaddr(name, sock.family, DNS.lookup_name(msg.addr), msg.port)
                }
                var bytesRead = 0;
                var bytesRemaining = msg.buffer.byteLength;
                for (var i = 0; bytesRemaining > 0 && i < num; i++) {
                    var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                    var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                    if (!iovlen) {
                        continue
                    }
                    var length = Math.min(iovlen, bytesRemaining);
                    var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
                    HEAPU8.set(buf, iovbase + bytesRead);
                    bytesRead += length;
                    bytesRemaining -= length
                }
                return bytesRead
            }
            default: {
                return -52
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall12(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall122(buf) {
    try {
        if (!buf) return -21;
        var layout = {
            "sysname": 0,
            "nodename": 65,
            "domainname": 325,
            "machine": 260,
            "version": 195,
            "release": 130,
            "__size__": 390
        };
        var copyString = function(element, value) {
            var offset = layout[element];
            writeAsciiToMemory(value, buf + offset)
        };
        copyString("sysname", "Emscripten");
        copyString("nodename", "emscripten");
        copyString("release", "1.0");
        copyString("version", "#1");
        copyString("machine", "x86-JS");
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall142(nfds, readfds, writefds, exceptfds, timeout) {
    try {
        var total = 0;
        var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
            srcReadHigh = readfds ? HEAP32[readfds + 4 >> 2] : 0;
        var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
            srcWriteHigh = writefds ? HEAP32[writefds + 4 >> 2] : 0;
        var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
            srcExceptHigh = exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0;
        var dstReadLow = 0,
            dstReadHigh = 0;
        var dstWriteLow = 0,
            dstWriteHigh = 0;
        var dstExceptLow = 0,
            dstExceptHigh = 0;
        var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
        var allHigh = (readfds ? HEAP32[readfds + 4 >> 2] : 0) | (writefds ? HEAP32[writefds + 4 >> 2] : 0) | (exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0);
        var check = function(fd, low, high, val) {
            return fd < 32 ? low & val : high & val
        };
        for (var fd = 0; fd < nfds; fd++) {
            var mask = 1 << fd % 32;
            if (!check(fd, allLow, allHigh, mask)) {
                continue
            }
            var stream = FS.getStream(fd);
            if (!stream) throw new FS.ErrnoError(8);
            var flags = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
                flags = stream.stream_ops.poll(stream)
            }
            if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                fd < 32 ? dstReadLow = dstReadLow | mask : dstReadHigh = dstReadHigh | mask;
                total++
            }
            if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                fd < 32 ? dstWriteLow = dstWriteLow | mask : dstWriteHigh = dstWriteHigh | mask;
                total++
            }
            if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                fd < 32 ? dstExceptLow = dstExceptLow | mask : dstExceptHigh = dstExceptHigh | mask;
                total++
            }
        }
        if (readfds) {
            HEAP32[readfds >> 2] = dstReadLow;
            HEAP32[readfds + 4 >> 2] = dstReadHigh
        }
        if (writefds) {
            HEAP32[writefds >> 2] = dstWriteLow;
            HEAP32[writefds + 4 >> 2] = dstWriteHigh
        }
        if (exceptfds) {
            HEAP32[exceptfds >> 2] = dstExceptLow;
            HEAP32[exceptfds + 4 >> 2] = dstExceptHigh
        }
        return total
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall144(addr, len, flags) {
    try {
        var info = SYSCALLS.mappings[addr];
        if (!info) return 0;
        SYSCALLS.doMsync(addr, FS.getStream(info.fd), len, info.flags, 0);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall15(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chmod(path, mode);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall168(fds, nfds, timeout) {
    try {
        var nonzero = 0;
        for (var i = 0; i < nfds; i++) {
            var pollfd = fds + 8 * i;
            var fd = HEAP32[pollfd >> 2];
            var events = HEAP16[pollfd + 4 >> 1];
            var mask = 32;
            var stream = FS.getStream(fd);
            if (stream) {
                mask = SYSCALLS.DEFAULT_POLLMASK;
                if (stream.stream_ops.poll) {
                    mask = stream.stream_ops.poll(stream)
                }
            }
            mask &= events | 8 | 16;
            if (mask) nonzero++;
            HEAP16[pollfd + 6 >> 1] = mask
        }
        return nonzero
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall183(buf, size) {
    try {
        if (size === 0) return -28;
        var cwd = FS.cwd();
        var cwdLengthInBytes = lengthBytesUTF8(cwd);
        if (size < cwdLengthInBytes + 1) return -68;
        stringToUTF8(cwd, buf, size);
        return buf
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function syscallMmap2(addr, len, prot, flags, fd, off) {
    off <<= 12;
    var ptr;
    var allocated = false;
    if ((flags & 16) !== 0 && addr % 16384 !== 0) {
        return -28
    }
    if ((flags & 32) !== 0) {
        ptr = _memalign(16384, len);
        if (!ptr) return -48;
        _memset(ptr, 0, len);
        allocated = true
    } else {
        var info = FS.getStream(fd);
        if (!info) return -8;
        var res = FS.mmap(info, HEAPU8, addr, len, off, prot, flags);
        ptr = res.ptr;
        allocated = res.allocated
    }
    SYSCALLS.mappings[ptr] = {
        malloc: ptr,
        len: len,
        allocated: allocated,
        fd: fd,
        flags: flags,
        offset: off
    };
    return ptr
}

function ___syscall192(addr, len, prot, flags, fd, off) {
    try {
        return syscallMmap2(addr, len, prot, flags, fd, off)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall194(fd, zero, low, high) {
    try {
        var length = SYSCALLS.get64(low, high);
        FS.ftruncate(fd, length);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall195(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall196(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall197(fd, buf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.doStat(FS.stat, stream.path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall202() {
    return 0
}

function ___syscall199() {
    return ___syscall202()
}

function ___syscall20() {
    return 42
}

function ___syscall201() {
    return ___syscall202()
}

function ___syscall211(ruid, euid, suid) {
    HEAP32[ruid >> 2] = 0;
    HEAP32[euid >> 2] = 0;
    HEAP32[suid >> 2] = 0;
    return 0
}

function ___syscall209(a0, a1, a2) {
    return ___syscall211(a0, a1, a2)
}

function ___syscall220(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
            stream.getdents = FS.readdir(stream.path)
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name[0] === ".") {
                id = 1;
                type = 4
            } else {
                var child = FS.lookupNode(stream.node, name);
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
            }
            tempI64 = [id >>> 0, (tempDouble = id, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos >> 2] = tempI64[0], HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
            tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos + 8 >> 2] = tempI64[0], HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
            HEAP16[dirp + pos + 16 >> 1] = 280;
            HEAP8[dirp + pos + 18 >> 0] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall221(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
            case 12: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                ___setErrNo(28);
                return -1;
            default: {
                return -28
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall268(path, size, buf) {
    try {
        path = SYSCALLS.getStr(path);
        HEAP32[buf + 4 >> 2] = 4096;
        HEAP32[buf + 40 >> 2] = 4096;
        HEAP32[buf + 8 >> 2] = 1e6;
        HEAP32[buf + 12 >> 2] = 5e5;
        HEAP32[buf + 16 >> 2] = 5e5;
        HEAP32[buf + 20 >> 2] = FS.nextInode;
        HEAP32[buf + 24 >> 2] = 1e6;
        HEAP32[buf + 28 >> 2] = 42;
        HEAP32[buf + 44 >> 2] = 2;
        HEAP32[buf + 36 >> 2] = 255;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall272(fd, offset, len, advice) {
    return 0
}

function ___syscall3(fd, buf, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return FS.read(stream, HEAP8, buf, count)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall320(dirfd, path, times, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var seconds = HEAP32[times >> 2];
        var nanoseconds = HEAP32[times + 4 >> 2];
        var atime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
        times += 8;
        seconds = HEAP32[times >> 2];
        nanoseconds = HEAP32[times + 4 >> 2];
        var mtime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
        FS.utime(path, atime, mtime);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall33(path, amode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doAccess(path, amode)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall38(old_path, new_path) {
    try {
        old_path = SYSCALLS.getStr(old_path);
        new_path = SYSCALLS.getStr(new_path);
        FS.rename(old_path, new_path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall39(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doMkdir(path, mode)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall40(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall41(fd) {
    try {
        var old = SYSCALLS.getStreamFromFD(fd);
        return FS.open(old.path, old.flags, 0).fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var PIPEFS = {
    BUCKET_BUFFER_SIZE: 8192,
    mount: function(mount) {
        return FS.createNode(null, "/", 16384 | 511, 0)
    },
    createPipe: function() {
        var pipe = {
            buckets: []
        };
        pipe.buckets.push({
            buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
            offset: 0,
            roffset: 0
        });
        var rName = PIPEFS.nextname();
        var wName = PIPEFS.nextname();
        var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
        var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
        rNode.pipe = pipe;
        wNode.pipe = pipe;
        var readableStream = FS.createStream({
            path: rName,
            node: rNode,
            flags: FS.modeStringToFlags("r"),
            seekable: false,
            stream_ops: PIPEFS.stream_ops
        });
        rNode.stream = readableStream;
        var writableStream = FS.createStream({
            path: wName,
            node: wNode,
            flags: FS.modeStringToFlags("w"),
            seekable: false,
            stream_ops: PIPEFS.stream_ops
        });
        wNode.stream = writableStream;
        return {
            readable_fd: readableStream.fd,
            writable_fd: writableStream.fd
        }
    },
    stream_ops: {
        poll: function(stream) {
            var pipe = stream.node.pipe;
            if ((stream.flags & 2097155) === 1) {
                return 256 | 4
            } else {
                if (pipe.buckets.length > 0) {
                    for (var i = 0; i < pipe.buckets.length; i++) {
                        var bucket = pipe.buckets[i];
                        if (bucket.offset - bucket.roffset > 0) {
                            return 64 | 1
                        }
                    }
                }
            }
            return 0
        },
        ioctl: function(stream, request, varargs) {
            return ERRNO_CODES.EINVAL
        },
        fsync: function(stream) {
            return ERRNO_CODES.EINVAL
        },
        read: function(stream, buffer, offset, length, position) {
            var pipe = stream.node.pipe;
            var currentLength = 0;
            for (var i = 0; i < pipe.buckets.length; i++) {
                var bucket = pipe.buckets[i];
                currentLength += bucket.offset - bucket.roffset
            }
            assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
            var data = buffer.subarray(offset, offset + length);
            if (length <= 0) {
                return 0
            }
            if (currentLength == 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
            }
            var toRead = Math.min(currentLength, length);
            var totalRead = toRead;
            var toRemove = 0;
            for (var i = 0; i < pipe.buckets.length; i++) {
                var currBucket = pipe.buckets[i];
                var bucketSize = currBucket.offset - currBucket.roffset;
                if (toRead <= bucketSize) {
                    var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                    if (toRead < bucketSize) {
                        tmpSlice = tmpSlice.subarray(0, toRead);
                        currBucket.roffset += toRead
                    } else {
                        toRemove++
                    }
                    data.set(tmpSlice);
                    break
                } else {
                    var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                    data.set(tmpSlice);
                    data = data.subarray(tmpSlice.byteLength);
                    toRead -= tmpSlice.byteLength;
                    toRemove++
                }
            }
            if (toRemove && toRemove == pipe.buckets.length) {
                toRemove--;
                pipe.buckets[toRemove].offset = 0;
                pipe.buckets[toRemove].roffset = 0
            }
            pipe.buckets.splice(0, toRemove);
            return totalRead
        },
        write: function(stream, buffer, offset, length, position) {
            var pipe = stream.node.pipe;
            assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
            var data = buffer.subarray(offset, offset + length);
            var dataLen = data.byteLength;
            if (dataLen <= 0) {
                return 0
            }
            var currBucket = null;
            if (pipe.buckets.length == 0) {
                currBucket = {
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: 0,
                    roffset: 0
                };
                pipe.buckets.push(currBucket)
            } else {
                currBucket = pipe.buckets[pipe.buckets.length - 1]
            }
            assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
            var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
            if (freeBytesInCurrBuffer >= dataLen) {
                currBucket.buffer.set(data, currBucket.offset);
                currBucket.offset += dataLen;
                return dataLen
            } else if (freeBytesInCurrBuffer > 0) {
                currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
                currBucket.offset += freeBytesInCurrBuffer;
                data = data.subarray(freeBytesInCurrBuffer, data.byteLength)
            }
            var numBuckets = data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE | 0;
            var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
            for (var i = 0; i < numBuckets; i++) {
                var newBucket = {
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: PIPEFS.BUCKET_BUFFER_SIZE,
                    roffset: 0
                };
                pipe.buckets.push(newBucket);
                newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
                data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength)
            }
            if (remElements > 0) {
                var newBucket = {
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: data.byteLength,
                    roffset: 0
                };
                pipe.buckets.push(newBucket);
                newBucket.buffer.set(data)
            }
            return dataLen
        },
        close: function(stream) {
            var pipe = stream.node.pipe;
            pipe.buckets = null
        }
    },
    nextname: function() {
        if (!PIPEFS.nextname.current) {
            PIPEFS.nextname.current = 0
        }
        return "pipe[" + PIPEFS.nextname.current++ + "]"
    }
};

function ___syscall42(fdPtr) {
    try {
        if (fdPtr == 0) {
            throw new FS.ErrnoError(21)
        }
        var res = PIPEFS.createPipe();
        HEAP32[fdPtr >> 2] = res.readable_fd;
        HEAP32[fdPtr + 4 >> 2] = res.writable_fd;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall5(path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(path);
        var mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall54(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509:
            case 21505: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28
            }
            case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp)
            }
            case 21523: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0
            }
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall63(oldfd, suggestFD) {
    try {
        var old = SYSCALLS.getStreamFromFD(oldfd);
        if (old.fd === suggestFD) return suggestFD;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall77(who, usage) {
    try {
        _memset(usage, 0, 136);
        HEAP32[usage >> 2] = 1;
        HEAP32[usage + 4 >> 2] = 2;
        HEAP32[usage + 8 >> 2] = 3;
        HEAP32[usage + 12 >> 2] = 4;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall83(target, linkpath) {
    try {
        target = SYSCALLS.getStr(target);
        linkpath = SYSCALLS.getStr(linkpath);
        FS.symlink(target, linkpath);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall85(path, buf, bufsize) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doReadlink(path, buf, bufsize)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall9(oldpath, newpath) {
    return -34
}

function syscallMunmap(addr, len) {
    if (addr === -1 || len === 0) {
        return -28
    }
    var info = SYSCALLS.mappings[addr];
    if (!info) return 0;
    if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags, info.offset);
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
            _free(info.malloc)
        }
    }
    return 0
}

function ___syscall91(addr, len) {
    try {
        return syscallMunmap(addr, len)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall94(fd, mode) {
    try {
        FS.fchmod(fd, mode);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall96() {
    return 0
}

function ___syscall97() {
    return -63
}

function _exit(status) {
    exit(status)
}

function _abort() {
    abort()
}

function _emscripten_get_now_res() {
    if (ENVIRONMENT_IS_NODE) {
        return 1
    } else if (typeof dateNow !== "undefined") {
        return 1e3
    } else return 1e3
}

function _clock_getres(clk_id, res) {
    var nsec;
    if (clk_id === 0) {
        nsec = 1e3 * 1e3
    } else if (clk_id === 1 && _emscripten_get_now_is_monotonic) {
        nsec = _emscripten_get_now_res()
    } else {
        ___setErrNo(28);
        return -1
    }
    HEAP32[res >> 2] = nsec / 1e9 | 0;
    HEAP32[res + 4 >> 2] = nsec;
    return 0
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}

function _emscripten_get_heap_size() {
    return HEAPU8.length
}

function emscripten_realloc_buffer(size) {
    try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1
    } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
    var oldSize = _emscripten_get_heap_size();
    var PAGE_MULTIPLE = 65536;
    var maxHeapSize = 2147483648 - PAGE_MULTIPLE;
    if (requestedSize > maxHeapSize) {
        return false
    }
    var minHeapSize = 16777216;
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true
        }
    }
    return false
}
var ENV = {};

function __getExecutableName() {
    return thisProgram || "./this.program"
}

function _emscripten_get_environ() {
    if (!_emscripten_get_environ.strings) {
        var env = {
            "USER": "web_user",
            "LOGNAME": "web_user",
            "PATH": "/",
            "PWD": "/",
            "HOME": "/home/web_user",
            "LANG": (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
            "_": __getExecutableName()
        };
        for (var x in ENV) {
            env[x] = ENV[x]
        }
        var strings = [];
        for (var x in env) {
            strings.push(x + "=" + env[x])
        }
        _emscripten_get_environ.strings = strings
    }
    return _emscripten_get_environ.strings
}

function _environ_get(__environ, environ_buf) {
    var strings = _emscripten_get_environ();
    var bufSize = 0;
    strings.forEach(function(string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[__environ + i * 4 >> 2] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1
    });
    return 0
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
    var strings = _emscripten_get_environ();
    HEAP32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    strings.forEach(function(string) {
        bufSize += string.length + 1
    });
    HEAP32[penviron_buf_size >> 2] = bufSize;
    return 0
}

function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_fdstat_get(fd, pbuf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        HEAP8[pbuf >> 0] = type;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_sync(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (stream.stream_ops && stream.stream_ops.fsync) {
            return -stream.stream_ops.fsync(stream)
        }
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fork() {
    ___setErrNo(6);
    return -1
}

function _getTempRet0() {
    return getTempRet0() | 0
}

function _getaddrinfo(node, service, hint, out) {
    var addr = 0;
    var port = 0;
    var flags = 0;
    var family = 0;
    var type = 0;
    var proto = 0;
    var ai;

    function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var res;
        salen = family === 10 ? 28 : 16;
        addr = family === 10 ? __inet_ntop6_raw(addr) : __inet_ntop4_raw(addr);
        sa = _malloc(salen);
        res = __write_sockaddr(sa, family, addr, port);
        assert(!res.errno);
        ai = _malloc(32);
        HEAP32[ai + 4 >> 2] = family;
        HEAP32[ai + 8 >> 2] = type;
        HEAP32[ai + 12 >> 2] = proto;
        HEAP32[ai + 24 >> 2] = canon;
        HEAP32[ai + 20 >> 2] = sa;
        if (family === 10) {
            HEAP32[ai + 16 >> 2] = 28
        } else {
            HEAP32[ai + 16 >> 2] = 16
        }
        HEAP32[ai + 28 >> 2] = 0;
        return ai
    }
    if (hint) {
        flags = HEAP32[hint >> 2];
        family = HEAP32[hint + 4 >> 2];
        type = HEAP32[hint + 8 >> 2];
        proto = HEAP32[hint + 12 >> 2]
    }
    if (type && !proto) {
        proto = type === 2 ? 17 : 6
    }
    if (!type && proto) {
        type = proto === 17 ? 2 : 1
    }
    if (proto === 0) {
        proto = 6
    }
    if (type === 0) {
        type = 1
    }
    if (!node && !service) {
        return -2
    }
    if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
        return -1
    }
    if (hint !== 0 && HEAP32[hint >> 2] & 2 && !node) {
        return -1
    }
    if (flags & 32) {
        return -2
    }
    if (type !== 0 && type !== 1 && type !== 2) {
        return -7
    }
    if (family !== 0 && family !== 2 && family !== 10) {
        return -6
    }
    if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
        if (isNaN(port)) {
            if (flags & 1024) {
                return -2
            }
            return -8
        }
    }
    if (!node) {
        if (family === 0) {
            family = 2
        }
        if ((flags & 1) === 0) {
            if (family === 2) {
                addr = _htonl(2130706433)
            } else {
                addr = [0, 0, 0, 1]
            }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAP32[out >> 2] = ai;
        return 0
    }
    node = UTF8ToString(node);
    addr = __inet_pton4_raw(node);
    if (addr !== null) {
        if (family === 0 || family === 2) {
            family = 2
        } else if (family === 10 && flags & 8) {
            addr = [0, 0, _htonl(65535), addr];
            family = 10
        } else {
            return -2
        }
    } else {
        addr = __inet_pton6_raw(node);
        if (addr !== null) {
            if (family === 0 || family === 10) {
                family = 10
            } else {
                return -2
            }
        }
    }
    if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAP32[out >> 2] = ai;
        return 0
    }
    if (flags & 4) {
        return -2
    }
    node = DNS.lookup_name(node);
    addr = __inet_pton4_raw(node);
    if (family === 0) {
        family = 2
    } else if (family === 10) {
        addr = [0, 0, _htonl(65535), addr]
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    HEAP32[out >> 2] = ai;
    return 0
}

function _getgrgid_r() {
    throw "getgrgid_r: TODO"
}

function _getgrnam_r() {
    throw "getgrnam_r: TODO"
}

function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
    var info = __read_sockaddr(sa, salen);
    if (info.errno) {
        return -6
    }
    var port = info.port;
    var addr = info.addr;
    var overflowed = false;
    if (node && nodelen) {
        var lookup;
        if (flags & 1 || !(lookup = DNS.lookup_addr(addr))) {
            if (flags & 8) {
                return -2
            }
        } else {
            addr = lookup
        }
        var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
        if (numBytesWrittenExclNull + 1 >= nodelen) {
            overflowed = true
        }
    }
    if (serv && servlen) {
        port = "" + port;
        var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
        if (numBytesWrittenExclNull + 1 >= servlen) {
            overflowed = true
        }
    }
    if (overflowed) {
        return -12
    }
    return 0
}
var Protocols = {
    list: [],
    map: {}
};

function _setprotoent(stayopen) {
    function allocprotoent(name, proto, aliases) {
        var nameBuf = _malloc(name.length + 1);
        writeAsciiToMemory(name, nameBuf);
        var j = 0;
        var length = aliases.length;
        var aliasListBuf = _malloc((length + 1) * 4);
        for (var i = 0; i < length; i++, j += 4) {
            var alias = aliases[i];
            var aliasBuf = _malloc(alias.length + 1);
            writeAsciiToMemory(alias, aliasBuf);
            HEAP32[aliasListBuf + j >> 2] = aliasBuf
        }
        HEAP32[aliasListBuf + j >> 2] = 0;
        var pe = _malloc(12);
        HEAP32[pe >> 2] = nameBuf;
        HEAP32[pe + 4 >> 2] = aliasListBuf;
        HEAP32[pe + 8 >> 2] = proto;
        return pe
    }
    var list = Protocols.list;
    var map = Protocols.map;
    if (list.length === 0) {
        var entry = allocprotoent("tcp", 6, ["TCP"]);
        list.push(entry);
        map["tcp"] = map["6"] = entry;
        entry = allocprotoent("udp", 17, ["UDP"]);
        list.push(entry);
        map["udp"] = map["17"] = entry
    }
    _setprotoent.index = 0
}

function _getprotobyname(name) {
    name = UTF8ToString(name);
    _setprotoent(true);
    var result = Protocols.map[name];
    return result
}

function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}
var ___tm_timezone = (stringToUTF8("GMT", 699152, 4), 699152);

function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
    HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
    HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
    HEAP32[tmPtr + 36 >> 2] = 0;
    HEAP32[tmPtr + 32 >> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 40 >> 2] = ___tm_timezone;
    return tmPtr
}

function _kill(pid, sig) {
    ___setErrNo(ERRNO_CODES.EPERM);
    return -1
}

function _llvm_eh_typeid_for(type) {
    return type
}

function _tzset() {
    if (_tzset.called) return;
    _tzset.called = true;
    HEAP32[__get_timezone() >> 2] = (new Date).getTimezoneOffset() * 60;
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    HEAP32[__get_daylight() >> 2] = Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());

    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}

function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}
var MONO = {
    pump_count: 0,
    timeout_queue: [],
    _vt_stack: [],
    mono_wasm_runtime_is_ready: false,
    mono_wasm_ignore_pdb_load_errors: true,
    pump_message: function() {
        if (!this.mono_background_exec) this.mono_background_exec = Module.cwrap("mono_background_exec", null);
        while (MONO.timeout_queue.length > 0) {
            --MONO.pump_count;
            MONO.timeout_queue.shift()()
        }
        while (MONO.pump_count > 0) {
            --MONO.pump_count;
            this.mono_background_exec()
        }
    },
    export_functions: function(module) {
        module["pump_message"] = MONO.pump_message;
        module["mono_load_runtime_and_bcl"] = MONO.mono_load_runtime_and_bcl
    },
    mono_text_decoder: undefined,
    string_decoder: {
        copy: function(mono_string) {
            if (mono_string == 0) return null;
            if (!this.mono_wasm_string_convert) this.mono_wasm_string_convert = Module.cwrap("mono_wasm_string_convert", null, ["number"]);
            this.mono_wasm_string_convert(mono_string);
            var result = this.result;
            this.result = undefined;
            return result
        },
        decode: function(start, end, save) {
            if (!MONO.mono_text_decoder) {
                MONO.mono_text_decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined
            }
            var str = "";
            if (MONO.mono_text_decoder) {
                var subArray = typeof SharedArrayBuffer !== "undefined" && Module.HEAPU8.buffer instanceof SharedArrayBuffer ? Module.HEAPU8.slice(start, end) : Module.HEAPU8.subarray(start, end);
                str = MONO.mono_text_decoder.decode(subArray)
            } else {
                for (var i = 0; i < end - start; i += 2) {
                    var char = Module.getValue(start + i, "i16");
                    str += String.fromCharCode(char)
                }
            }
            if (save) this.result = str;
            return str
        }
    },
    mono_wasm_get_call_stack: function() {
        if (!this.mono_wasm_current_bp_id) this.mono_wasm_current_bp_id = Module.cwrap("mono_wasm_current_bp_id", "number");
        if (!this.mono_wasm_enum_frames) this.mono_wasm_enum_frames = Module.cwrap("mono_wasm_enum_frames", null);
        var bp_id = this.mono_wasm_current_bp_id();
        this.active_frames = [];
        this.mono_wasm_enum_frames();
        var the_frames = this.active_frames;
        this.active_frames = [];
        return {
            "breakpoint_id": bp_id,
            "frames": the_frames
        }
    },
    _fixup_name_value_objects: function(var_list) {
        var out_list = [];
        var _fixup_value = function(value) {
            if (value != null && value != undefined) {
                var descr = value.description;
                if (descr == null || descr == undefined) value.description = "" + value.value
            }
            return value
        };
        var i = 0;
        while (i < var_list.length) {
            var o = var_list[i];
            var name = o.name;
            if (name == null || name == undefined) {
                i++;
                o.value = _fixup_value(o.value);
                out_list.push(o);
                continue
            }
            if (i + 1 < var_list.length) o.value = _fixup_value(var_list[i + 1].value);
            out_list.push(o);
            i += 2
        }
        return out_list
    },
    _filter_automatic_properties: function(props) {
        var names_found = {};
        var final_var_list = [];
        for (var i in props) {
            var p = props[i];
            if (p.name in names_found) continue;
            if (p.name.endsWith("k__BackingField")) p.name = p.name.replace("k__BackingField", "").replace("<", "").replace(">", "");
            names_found[p.name] = p.name;
            final_var_list.push(p)
        }
        return final_var_list
    },
    mono_wasm_get_variables: function(scope, var_list) {
        if (!this.mono_wasm_get_var_info) this.mono_wasm_get_var_info = Module.cwrap("mono_wasm_get_var_info", null, ["number", "number", "number"]);
        this.var_info = [];
        var numBytes = var_list.length * Int32Array.BYTES_PER_ELEMENT;
        var ptr = Module._malloc(numBytes);
        var heapBytes = new Int32Array(Module.HEAP32.buffer, ptr, numBytes);
        for (let i = 0; i < var_list.length; i++) {
            heapBytes[i] = var_list[i]
        }
        this._async_method_objectId = 0;
        this.mono_wasm_get_var_info(scope, heapBytes.byteOffset, var_list.length);
        Module._free(heapBytes.byteOffset);
        var res = MONO._fixup_name_value_objects(this.var_info);
        for (let i in res) {
            var name = res[i].name;
            if (name != undefined && name.indexOf(">") > 0) res[i].name = name.substring(1, name.indexOf(">"))
        }
        if (this._async_method_objectId != 0) {
            for (let i in res) {
                if (res[i].value.isValueType != undefined && res[i].value.isValueType) res[i].value.objectId = `dotnet:valuetype:${this._async_method_objectId}:${res[i].fieldOffset}`
            }
        }
        this._post_process_details(res);
        this.var_info = [];
        return res
    },
    mono_wasm_get_object_properties: function(objId, expandValueTypes) {
        if (!this.mono_wasm_get_object_properties_info) this.mono_wasm_get_object_properties_info = Module.cwrap("mono_wasm_get_object_properties", null, ["number", "bool"]);
        this.var_info = [];
        this.mono_wasm_get_object_properties_info(objId, expandValueTypes);
        var res = MONO._filter_automatic_properties(MONO._fixup_name_value_objects(this.var_info));
        for (var i = 0; i < res.length; i++) {
            if (res[i].value.isValueType != undefined && res[i].value.isValueType) res[i].value.objectId = `dotnet:valuetype:${objId}:${res[i].fieldOffset}`
        }
        this.var_info = [];
        return res
    },
    mono_wasm_get_array_values: function(objId) {
        if (!this.mono_wasm_get_array_values_info) this.mono_wasm_get_array_values_info = Module.cwrap("mono_wasm_get_array_values", null, ["number"]);
        this.var_info = [];
        this.mono_wasm_get_array_values_info(objId);
        var res = MONO._fixup_name_value_objects(this.var_info);
        for (var i = 0; i < res.length; i++) {
            if (res[i].value.isValueType != undefined && res[i].value.isValueType) res[i].value.objectId = `dotnet:array:${objId}:${i}`
        }
        this.var_info = [];
        return res
    },
    mono_wasm_get_array_value_expanded: function(objId, idx) {
        if (!this.mono_wasm_get_array_value_expanded_info) this.mono_wasm_get_array_value_expanded_info = Module.cwrap("mono_wasm_get_array_value_expanded", null, ["number", "number"]);
        this.var_info = [];
        this.mono_wasm_get_array_value_expanded_info(objId, idx);
        var res = MONO._fixup_name_value_objects(this.var_info);
        if (res[0].value.isValueType != undefined && res[0].value.isValueType) res[0].value.objectId = `dotnet:array:${objId}:${idx}`;
        this.var_info = [];
        return res
    },
    _post_process_details: function(details) {
        if (details == undefined) return {};
        if (details.length > 0) this._extract_and_cache_value_types(details);
        return details
    },
    _next_value_type_id: function() {
        return ++this._next_value_type_id_var
    },
    _extract_and_cache_value_types: function(var_list) {
        if (var_list == undefined || !Array.isArray(var_list) || var_list.length == 0) return var_list;
        for (let i in var_list) {
            var value = var_list[i].value;
            if (value == undefined || value.type != "object") continue;
            if (value.isValueType != true || value.expanded != true) continue;
            var objectId = value.objectId;
            if (objectId == undefined) objectId = `dotnet:valuetype:${this._next_value_type_id()}`;
            value.objectId = objectId;
            this._extract_and_cache_value_types(value.members);
            this._value_types_cache[objectId] = value.members;
            delete value.members
        }
        return var_list
    },
    _get_details_for_value_type: function(objectId, fetchDetailsFn) {
        if (objectId in this._value_types_cache) return this._value_types_cache[objectId];
        this._post_process_details(fetchDetailsFn());
        if (objectId in this._value_types_cache) return this._value_types_cache[objectId];
        throw new Error(`Could not get details for ${objectId}`)
    },
    _is_object_id_array: function(objectId) {
        return objectId.startsWith("dotnet:array:") && objectId.split(":").length == 3
    },
    _get_array_details: function(objectId, objectIdParts) {
        switch (objectIdParts.length) {
            case 3:
                return this._post_process_details(this.mono_wasm_get_array_values(objectIdParts[2]));
            case 4:
                var arrayObjectId = objectIdParts[2];
                var arrayIdx = objectIdParts[3];
                return this._get_details_for_value_type(objectId, () => this.mono_wasm_get_array_value_expanded(arrayObjectId, arrayIdx));
            default:
                throw new Error(`object id format not supported : ${objectId}`)
        }
    },
    mono_wasm_get_details: function(objectId, args) {
        var parts = objectId.split(":");
        if (parts[0] != "dotnet") throw new Error("Can't handle non-dotnet object ids. ObjectId: " + objectId);
        switch (parts[1]) {
            case "object":
                if (parts.length != 3) throw new Error(`exception this time: Invalid object id format: ${objectId}`);
                return this._post_process_details(this.mono_wasm_get_object_properties(parts[2], false));
            case "array":
                return this._get_array_details(objectId, parts);
            case "valuetype":
                if (parts.length != 3 && parts.length != 4) {
                    throw new Error(`Invalid object id format: ${objectId}`)
                }
                var containerObjectId = parts[2];
                return this._get_details_for_value_type(objectId, () => this.mono_wasm_get_object_properties(containerObjectId, true));
            case "cfo_res": {
                if (!(objectId in this._call_function_res_cache)) throw new Error(`Could not find any object with id ${objectId}`);
                var real_obj = this._call_function_res_cache[objectId];
                if (args.accessorPropertiesOnly) {
                    return {
                        __value_as_json_string__: "[]"
                    }
                }
                var descriptors = Object.getOwnPropertyDescriptors(real_obj);
                var own_properties = [];
                Object.keys(descriptors).forEach(k => {
                    var new_obj;
                    var prop_desc = descriptors[k];
                    if (typeof prop_desc.value == "object") {
                        new_obj = Object.assign({
                            name: k
                        }, prop_desc)
                    } else {
                        new_obj = {
                            name: k,
                            value: Object.assign({
                                type: typeof prop_desc.value,
                                description: "" + prop_desc.value
                            }, prop_desc)
                        }
                    }
                    own_properties.push(new_obj)
                });
                return {
                    __value_as_json_string__: JSON.stringify(own_properties)
                }
            }
            default:
                throw new Error(`Unknown object id format: ${objectId}`)
        }
    },
    _cache_call_function_res: function(obj) {
        var id = `dotnet:cfo_res:${this._next_call_function_res_id++}`;
        this._call_function_res_cache[id] = obj;
        return id
    },
    mono_wasm_release_object: function(objectId) {
        if (objectId in this._cache_call_function_res) delete this._cache_call_function_res[objectId]
    },
    mono_wasm_call_function_on: function(request) {
        var objId = request.objectId;
        var proxy;
        if (objId in this._call_function_res_cache) {
            proxy = this._call_function_res_cache[objId]
        } else if (!objId.startsWith("dotnet:cfo_res:")) {
            var details = this.mono_wasm_get_details(objId);
            var target_is_array = this._is_object_id_array(objId);
            proxy = target_is_array ? [] : {};
            Object.keys(details).forEach(p => {
                var prop = details[p];
                if (target_is_array) {
                    proxy.push(prop.value)
                } else {
                    if (prop.name != undefined) proxy[prop.name] = prop.value;
                    else proxy["" + p] = prop.value
                }
            })
        }
        var fn_args = request.arguments != undefined ? request.arguments.map(a => a.value) : [];
        var fn_eval_str = `var fn = ${request.functionDeclaration}; fn.call (proxy, ...[${fn_args}]);`;
        var fn_res = eval(fn_eval_str);
        if (request.returnByValue) return fn_res;
        if (fn_res == undefined) throw Error("Function returned undefined result");
        var fn_res_id = this._cache_call_function_res(fn_res);
        if (Object.getPrototypeOf(fn_res) == Array.prototype) {
            return {
                type: "object",
                subtype: "array",
                className: "Array",
                description: `Array(${fn_res.length})`,
                objectId: fn_res_id
            }
        } else {
            return {
                type: "object",
                className: "Object",
                description: "Object",
                objectId: fn_res_id
            }
        }
    },
    mono_wasm_start_single_stepping: function(kind) {
        console.log(">> mono_wasm_start_single_stepping " + kind);
        if (!this.mono_wasm_setup_single_step) this.mono_wasm_setup_single_step = Module.cwrap("mono_wasm_setup_single_step", "number", ["number"]);
        this._next_value_type_id_var = 0;
        this._value_types_cache = {};
        return this.mono_wasm_setup_single_step(kind)
    },
    mono_wasm_runtime_ready: function() {
        this.mono_wasm_runtime_is_ready = true;
        console.debug("mono_wasm_runtime_ready", "fe00e07a-5519-4dfe-b35a-f867dbaf2e28");
        this._next_value_type_id_var = 0;
        this._value_types_cache = {};
        this._next_call_function_res_id = 0;
        this._call_function_res_cache = {}
    },
    mono_wasm_set_breakpoint: function(assembly, method_token, il_offset) {
        if (!this.mono_wasm_set_bp) this.mono_wasm_set_bp = Module.cwrap("mono_wasm_set_breakpoint", "number", ["string", "number", "number"]);
        return this.mono_wasm_set_bp(assembly, method_token, il_offset)
    },
    mono_wasm_remove_breakpoint: function(breakpoint_id) {
        if (!this.mono_wasm_del_bp) this.mono_wasm_del_bp = Module.cwrap("mono_wasm_remove_breakpoint", "number", ["number"]);
        return this.mono_wasm_del_bp(breakpoint_id)
    },
    mono_wasm_setenv: function(name, value) {
        if (!this.wasm_setenv) this.wasm_setenv = Module.cwrap("mono_wasm_setenv", null, ["string", "string"]);
        this.wasm_setenv(name, value)
    },
    mono_wasm_set_runtime_options: function(options) {
        if (!this.wasm_parse_runtime_options) this.wasm_parse_runtime_options = Module.cwrap("mono_wasm_parse_runtime_options", null, ["number", "number"]);
        var argv = Module._malloc(options.length * 4);
        var wasm_strdup = Module.cwrap("mono_wasm_strdup", "number", ["string"]);
        aindex = 0;
        for (var i = 0; i < options.length; ++i) {
            Module.setValue(argv + aindex * 4, wasm_strdup(options[i]), "i32");
            aindex += 1
        }
        this.wasm_parse_runtime_options(options.length, argv)
    },
    mono_wasm_init_aot_profiler: function(options) {
        if (options == null) options = {};
        if (!("write_at" in options)) options.write_at = "WebAssembly.Runtime::StopProfile";
        if (!("send_to" in options)) options.send_to = "WebAssembly.Runtime::DumpAotProfileData";
        var arg = "aot:write-at-method=" + options.write_at + ",send-to-method=" + options.send_to;
        Module.ccall("mono_wasm_load_profiler_aot", null, ["string"], [arg])
    },
    mono_wasm_init_coverage_profiler: function(options) {
        if (options == null) options = {};
        if (!("write_at" in options)) options.write_at = "WebAssembly.Runtime::StopProfile";
        if (!("send_to" in options)) options.send_to = "WebAssembly.Runtime::DumpCoverageProfileData";
        var arg = "coverage:write-at-method=" + options.write_at + ",send-to-method=" + options.send_to;
        Module.ccall("mono_wasm_load_profiler_coverage", null, ["string"], [arg])
    },
    mono_load_runtime_and_bcl: function(vfs_prefix, deploy_prefix, enable_debugging, file_list, loaded_cb, fetch_file_cb) {
        var pending = file_list.length;
        var loaded_files = [];
        var mono_wasm_add_assembly = Module.cwrap("mono_wasm_add_assembly", null, ["string", "number", "number"]);
        if (!fetch_file_cb) {
            if (ENVIRONMENT_IS_NODE) {
                var fs = require("fs");
                fetch_file_cb = function(asset) {
                    console.log("MONO_WASM: Loading... " + asset);
                    var binary = fs.readFileSync(asset);
                    var resolve_func2 = function(resolve, reject) {
                        resolve(new Uint8Array(binary))
                    };
                    var resolve_func1 = function(resolve, reject) {
                        var response = {
                            ok: true,
                            url: asset,
                            arrayBuffer: function() {
                                return new Promise(resolve_func2)
                            }
                        };
                        resolve(response)
                    };
                    return new Promise(resolve_func1)
                }
            } else {
                fetch_file_cb = function(asset) {
                    return fetch(asset, {
                        credentials: "same-origin"
                    })
                }
            }
        }
        file_list.forEach(function(file_name) {
            var fetch_promise = fetch_file_cb(locateFile(deploy_prefix + "/" + file_name));
            fetch_promise.then(function(response) {
                if (!response.ok) {
                    if (response.status === 404 && file_name.match(/\.pdb$/) && MONO.mono_wasm_ignore_pdb_load_errors) {
                        --pending;
                        throw "MONO-WASM: Skipping failed load for .pdb file: '" + file_name + "'"
                    } else {
                        throw "MONO_WASM: Failed to load file: '" + file_name + "'"
                    }
                } else {
                    loaded_files.push(response.url);
                    return response["arrayBuffer"]()
                }
            }).then(function(blob) {
                var asm = new Uint8Array(blob);
                var memory = Module._malloc(asm.length);
                var heapBytes = new Uint8Array(Module.HEAPU8.buffer, memory, asm.length);
                heapBytes.set(asm);
                mono_wasm_add_assembly(file_name, memory, asm.length);
                --pending;
                if (pending == 0) {
                    MONO.loaded_files = loaded_files;
                    var load_runtime = Module.cwrap("mono_wasm_load_runtime", null, ["string", "number"]);
                    console.log("MONO_WASM: Initializing mono runtime");
                    if (ENVIRONMENT_IS_SHELL || ENVIRONMENT_IS_NODE) {
                        try {
                            load_runtime(vfs_prefix, enable_debugging)
                        } catch (ex) {
                            print("MONO_WASM: load_runtime () failed: " + ex);
                            var err = new Error;
                            print("MONO_WASM: Stacktrace: \n");
                            print(err.stack);
                            var wasm_exit = Module.cwrap("mono_wasm_exit", null, ["number"]);
                            wasm_exit(1)
                        }
                    } else {
                        load_runtime(vfs_prefix, enable_debugging)
                    }
                    MONO.mono_wasm_runtime_ready();
                    loaded_cb()
                }
            })
        })
    },
    mono_wasm_get_loaded_files: function() {
        console.log(">>>mono_wasm_get_loaded_files");
        return this.loaded_files
    },
    mono_wasm_clear_all_breakpoints: function() {
        if (!this.mono_clear_bps) this.mono_clear_bps = Module.cwrap("mono_wasm_clear_all_breakpoints", null);
        this.mono_clear_bps()
    },
    mono_wasm_add_null_var: function(className) {
        fixed_class_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
        if (!fixed_class_name) {
            fixed_class_name = className
        }
        MONO.var_info.push({
            value: {
                type: "object",
                className: fixed_class_name,
                description: fixed_class_name,
                subtype: "null"
            }
        })
    },
    _mono_wasm_add_string_var: function(var_value) {
        if (var_value == 0) {
            MONO.mono_wasm_add_null_var("string");
            return
        }
        MONO.var_info.push({
            value: {
                type: "string",
                value: var_value
            }
        })
    },
    _mono_wasm_add_getter_var: function(className) {
        fixed_class_name = MONO._mono_csharp_fixup_class_name(className);
        var value = `${fixed_class_name} { get; }`;
        MONO.var_info.push({
            value: {
                type: "symbol",
                value: value,
                description: value
            }
        })
    },
    _mono_wasm_add_array_var: function(className, objectId, length) {
        fixed_class_name = MONO._mono_csharp_fixup_class_name(className);
        if (objectId == 0) {
            MONO.mono_wasm_add_null_var(fixed_class_name);
            return
        }
        MONO.var_info.push({
            value: {
                type: "object",
                subtype: "array",
                className: fixed_class_name,
                description: `${fixed_class_name}(${length})`,
                objectId: "dotnet:array:" + objectId
            }
        })
    },
    mono_wasm_add_typed_value: function(type, str_value, value) {
        var type_str = type;
        if (typeof type != "string") type_str = Module.UTF8ToString(type);
        if (typeof str_value != "string") str_value = Module.UTF8ToString(str_value);
        switch (type_str) {
            case "bool":
                MONO.var_info.push({
                    value: {
                        type: "boolean",
                        value: value != 0
                    }
                });
                break;
            case "char":
                MONO.var_info.push({
                    value: {
                        type: "symbol",
                        value: `${value} '${String.fromCharCode(value)}'`
                    }
                });
                break;
            case "number":
                MONO.var_info.push({
                    value: {
                        type: "number",
                        value: value
                    }
                });
                break;
            case "string":
                MONO._mono_wasm_add_string_var(str_value);
                break;
            case "getter":
                MONO._mono_wasm_add_getter_var(str_value);
                break;
            case "array":
                MONO._mono_wasm_add_array_var(str_value, value.objectId, value.length);
                break;
            case "pointer": {
                MONO.var_info.push({
                    value: {
                        type: "symbol",
                        value: str_value,
                        description: str_value
                    }
                })
            }
            break;
        default: {
            var msg = `'${str_value}' ${value}`;
            MONO.var_info.push({
                value: {
                    type: "symbol",
                    value: msg,
                    description: msg
                }
            });
            break
        }
        }
    },
    _mono_csharp_fixup_class_name: function(className) {
        return className.replace(/\//g, ".").replace(/`\d+/g, "")
    }
};

function _mono_set_timeout(timeout, id) {
    if (!this.mono_set_timeout_exec) this.mono_set_timeout_exec = Module.cwrap("mono_set_timeout_exec", null, ["number"]);
    if (ENVIRONMENT_IS_WEB) {
        window.setTimeout(function() {
            this.mono_set_timeout_exec(id)
        }, timeout)
    } else if (ENVIRONMENT_IS_WORKER) {
        self.setTimeout(function() {
            this.mono_set_timeout_exec(id)
        }, timeout)
    } else if (ENVIRONMENT_IS_NODE) {
        global.setTimeout(function() {
            global.mono_set_timeout_exec(id)
        }, timeout)
    } else {
        ++MONO.pump_count;
        MONO.timeout_queue.push(function() {
            this.mono_set_timeout_exec(id)
        })
    }
}

function _mono_wasm_add_array_item(position) {
    MONO.var_info.push({
        name: `${position}`
    })
}

function _mono_wasm_add_enum_var(className, members, value) {
    var re = new RegExp(`[,]?([^,:]+):(${value}(?=,)|${value}$)`, "g");
    var members_str = Module.UTF8ToString(members);
    var match = re.exec(members_str);
    var member_name = match == null ? "" + value : match[1];
    fixed_class_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
    MONO.var_info.push({
        value: {
            type: "object",
            className: fixed_class_name,
            description: member_name,
            isEnum: true
        }
    })
}

function _mono_wasm_add_frame(il, method, assembly_name, method_full_name) {
    var parts = Module.UTF8ToString(method_full_name).split(":", 2);
    MONO.active_frames.push({
        il_pos: il,
        method_token: method,
        assembly_name: Module.UTF8ToString(assembly_name),
        method_name: parts[parts.length - 1]
    })
}

function _mono_wasm_add_func_var(className, targetName, objectId) {
    if (objectId == 0) {
        MONO.mono_wasm_add_null_var(MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className)));
        return
    }

    function args_to_sig(args_str) {
        var parts = args_str.split(":");
        parts = parts.map(a => MONO._mono_csharp_fixup_class_name(a));
        var method_name = parts.pop();
        var ret_sig = parts[0];
        var args_sig = parts.splice(1).join(", ");
        return `${ret_sig} ${method_name} (${args_sig})`
    }
    var tgt_sig;
    if (targetName != 0) tgt_sig = args_to_sig(Module.UTF8ToString(targetName));
    var type_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
    if (objectId == -1) {
        MONO.var_info.push({
            value: {
                type: "symbol",
                value: tgt_sig,
                description: tgt_sig
            }
        })
    } else {
        MONO.var_info.push({
            value: {
                type: "object",
                className: type_name,
                description: tgt_sig,
                objectId: "dotnet:object:" + objectId
            }
        })
    }
}

function _mono_wasm_add_obj_var(className, toString, objectId) {
    if (objectId == 0) {
        MONO.mono_wasm_add_null_var(className);
        return
    }
    fixed_class_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
    MONO.var_info.push({
        value: {
            type: "object",
            className: fixed_class_name,
            description: toString == 0 ? fixed_class_name : Module.UTF8ToString(toString),
            objectId: "dotnet:object:" + objectId
        }
    })
}

function _mono_wasm_add_properties_var(name, field_offset) {
    MONO.var_info.push({
        name: Module.UTF8ToString(name),
        fieldOffset: field_offset
    })
}

function _mono_wasm_add_typed_value(type, str_value, value) {
    MONO.mono_wasm_add_typed_value(type, str_value, value)
}

function _mono_wasm_add_value_type_unexpanded_var(className, toString) {
    fixed_class_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
    MONO.var_info.push({
        value: {
            type: "object",
            className: fixed_class_name,
            description: toString == 0 ? fixed_class_name : Module.UTF8ToString(toString),
            expanded: false,
            isValueType: true
        }
    })
}

function _mono_wasm_begin_value_type_var(className, toString) {
    fixed_class_name = MONO._mono_csharp_fixup_class_name(Module.UTF8ToString(className));
    var vt_obj = {
        value: {
            type: "object",
            className: fixed_class_name,
            description: toString == 0 ? fixed_class_name : Module.UTF8ToString(toString),
            expanded: true,
            isValueType: true,
            members: []
        }
    };
    if (MONO._vt_stack.length == 0) MONO._old_var_info = MONO.var_info;
    MONO.var_info = vt_obj.value.members;
    MONO._vt_stack.push(vt_obj)
}
var BINDING = {
    BINDING_ASM: "[WebAssembly.Bindings]WebAssembly.Runtime",
    mono_wasm_object_registry: [],
    mono_wasm_ref_counter: 0,
    mono_wasm_free_list: [],
    mono_wasm_marshal_enum_as_int: false,
    mono_bindings_init: function(binding_asm) {
        this.BINDING_ASM = binding_asm
    },
    export_functions: function(module) {
        module["mono_bindings_init"] = BINDING.mono_bindings_init.bind(BINDING);
        module["mono_method_invoke"] = BINDING.call_method.bind(BINDING);
        module["mono_method_get_call_signature"] = BINDING.mono_method_get_call_signature.bind(BINDING);
        module["mono_method_resolve"] = BINDING.resolve_method_fqn.bind(BINDING);
        module["mono_bind_static_method"] = BINDING.bind_static_method.bind(BINDING);
        module["mono_call_static_method"] = BINDING.call_static_method.bind(BINDING);
        module["mono_bind_assembly_entry_point"] = BINDING.bind_assembly_entry_point.bind(BINDING);
        module["mono_call_assembly_entry_point"] = BINDING.call_assembly_entry_point.bind(BINDING)
    },
    bindings_lazy_init: function() {
        if (this.init) return;
        this.assembly_load = Module.cwrap("mono_wasm_assembly_load", "number", ["string"]);
        this.find_class = Module.cwrap("mono_wasm_assembly_find_class", "number", ["number", "string", "string"]);
        this.find_method = Module.cwrap("mono_wasm_assembly_find_method", "number", ["number", "string", "number"]);
        this.invoke_method = Module.cwrap("mono_wasm_invoke_method", "number", ["number", "number", "number", "number"]);
        this.mono_string_get_utf8 = Module.cwrap("mono_wasm_string_get_utf8", "number", ["number"]);
        this.js_string_to_mono_string = Module.cwrap("mono_wasm_string_from_js", "number", ["string"]);
        this.mono_get_obj_type = Module.cwrap("mono_wasm_get_obj_type", "number", ["number"]);
        this.mono_unbox_int = Module.cwrap("mono_unbox_int", "number", ["number"]);
        this.mono_unbox_float = Module.cwrap("mono_wasm_unbox_float", "number", ["number"]);
        this.mono_array_length = Module.cwrap("mono_wasm_array_length", "number", ["number"]);
        this.mono_array_get = Module.cwrap("mono_wasm_array_get", "number", ["number", "number"]);
        this.mono_obj_array_new = Module.cwrap("mono_wasm_obj_array_new", "number", ["number"]);
        this.mono_obj_array_set = Module.cwrap("mono_wasm_obj_array_set", "void", ["number", "number", "number"]);
        this.mono_unbox_enum = Module.cwrap("mono_wasm_unbox_enum", "number", ["number"]);
        this.assembly_get_entry_point = Module.cwrap("mono_wasm_assembly_get_entry_point", "number", ["number"]);
        this.mono_typed_array_new = Module.cwrap("mono_wasm_typed_array_new", "number", ["number", "number", "number", "number"]);
        var binding_fqn_asm = this.BINDING_ASM.substring(this.BINDING_ASM.indexOf("[") + 1, this.BINDING_ASM.indexOf("]")).trim();
        var binding_fqn_class = this.BINDING_ASM.substring(this.BINDING_ASM.indexOf("]") + 1).trim();
        this.binding_module = this.assembly_load(binding_fqn_asm);
        if (!this.binding_module) throw "Can't find bindings module assembly: " + binding_fqn_asm;
        if (binding_fqn_class !== null && typeof binding_fqn_class !== "undefined") {
            var namespace = "WebAssembly";
            var classname = binding_fqn_class.length > 0 ? binding_fqn_class : "Runtime";
            if (binding_fqn_class.indexOf(".") != -1) {
                var idx = binding_fqn_class.lastIndexOf(".");
                namespace = binding_fqn_class.substring(0, idx);
                classname = binding_fqn_class.substring(idx + 1)
            }
        }
        var wasm_runtime_class = this.find_class(this.binding_module, namespace, classname);
        if (!wasm_runtime_class) throw "Can't find " + binding_fqn_class + " class";
        var get_method = function(method_name) {
            var res = BINDING.find_method(wasm_runtime_class, method_name, -1);
            if (!res) throw "Can't find method " + namespace + "." + classname + ":" + method_name;
            return res
        };
        this.bind_js_obj = get_method("BindJSObject");
        this.bind_core_clr_obj = get_method("BindCoreCLRObject");
        this.bind_existing_obj = get_method("BindExistingObject");
        this.unbind_js_obj = get_method("UnBindJSObject");
        this.unbind_js_obj_and_free = get_method("UnBindJSObjectAndFree");
        this.unbind_raw_obj_and_free = get_method("UnBindRawJSObjectAndFree");
        this.get_js_id = get_method("GetJSObjectId");
        this.get_raw_mono_obj = get_method("GetMonoObject");
        this.box_js_int = get_method("BoxInt");
        this.box_js_double = get_method("BoxDouble");
        this.box_js_bool = get_method("BoxBool");
        this.is_simple_array = get_method("IsSimpleArray");
        this.get_core_type = get_method("GetCoreType");
        this.setup_js_cont = get_method("SetupJSContinuation");
        this.create_tcs = get_method("CreateTaskSource");
        this.set_tcs_result = get_method("SetTaskSourceResult");
        this.set_tcs_failure = get_method("SetTaskSourceFailure");
        this.tcs_get_task_and_bind = get_method("GetTaskAndBind");
        this.get_call_sig = get_method("GetCallSignature");
        this.object_to_string = get_method("ObjectToString");
        this.get_date_value = get_method("GetDateValue");
        this.create_date_time = get_method("CreateDateTime");
        this.create_uri = get_method("CreateUri");
        this.object_to_enum = get_method("ObjectToEnum");
        this.init = true
    },
    get_js_obj: function(js_handle) {
        if (js_handle > 0) return this.mono_wasm_require_handle(js_handle);
        return null
    },
    conv_string: function(mono_obj) {
        return MONO.string_decoder.copy(mono_obj)
    },
    is_nested_array: function(ele) {
        return this.call_method(this.is_simple_array, null, "mi", [ele])
    },
    mono_array_to_js_array: function(mono_array) {
        if (mono_array == 0) return null;
        var res = [];
        var len = this.mono_array_length(mono_array);
        for (var i = 0; i < len; ++i) {
            var ele = this.mono_array_get(mono_array, i);
            if (this.is_nested_array(ele)) res.push(this.mono_array_to_js_array(ele));
            else res.push(this.unbox_mono_obj(ele))
        }
        return res
    },
    js_array_to_mono_array: function(js_array) {
        var mono_array = this.mono_obj_array_new(js_array.length);
        for (var i = 0; i < js_array.length; ++i) {
            this.mono_obj_array_set(mono_array, i, this.js_to_mono_obj(js_array[i]))
        }
        return mono_array
    },
    unbox_mono_obj: function(mono_obj) {
        if (mono_obj == 0) return undefined;
        var type = this.mono_get_obj_type(mono_obj);
        switch (type) {
            case 1:
                return this.mono_unbox_int(mono_obj);
            case 2:
                return this.mono_unbox_float(mono_obj);
            case 3:
                return this.conv_string(mono_obj);
            case 4:
                throw new Error("no idea on how to unbox value types");
            case 5: {
                var obj = this.extract_js_obj(mono_obj);
                return function() {
                    return BINDING.invoke_delegate(obj, arguments)
                }
            }
            case 6: {
                if (typeof Promise === "undefined" || typeof Promise.resolve === "undefined") throw new Error("Promises are not supported thus C# Tasks can not work in this context.");
                var obj = this.extract_js_obj(mono_obj);
                var cont_obj = null;
                var promise = new Promise(function(resolve, reject) {
                    cont_obj = {
                        resolve: resolve,
                        reject: reject
                    }
                });
                this.call_method(this.setup_js_cont, null, "mo", [mono_obj, cont_obj]);
                obj.__mono_js_cont__ = cont_obj.__mono_gchandle__;
                cont_obj.__mono_js_task__ = obj.__mono_gchandle__;
                return promise
            }
            case 7:
                return this.extract_js_obj(mono_obj);
            case 8:
                return this.mono_unbox_int(mono_obj) != 0;
            case 9:
                if (this.mono_wasm_marshal_enum_as_int) {
                    return this.mono_unbox_enum(mono_obj)
                } else {
                    enumValue = this.call_method(this.object_to_string, null, "m", [mono_obj])
                }
                return enumValue;
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18: {
                throw new Error("Marshalling of primitive arrays are not supported.  Use the corresponding TypedArray instead.")
            }
            case 20:
                var dateValue = this.call_method(this.get_date_value, null, "md", [mono_obj]);
                return new Date(dateValue);
            case 21:
                var dateoffsetValue = this.call_method(this.object_to_string, null, "m", [mono_obj]);
                return dateoffsetValue;
            case 22:
                var uriValue = this.call_method(this.object_to_string, null, "m", [mono_obj]);
                return uriValue;
            default:
                throw new Error("no idea on how to unbox object kind " + type)
        }
    },
    create_task_completion_source: function() {
        return this.call_method(this.create_tcs, null, "i", [-1])
    },
    set_task_result: function(tcs, result) {
        tcs.is_mono_tcs_result_set = true;
        this.call_method(this.set_tcs_result, null, "oo", [tcs, result]);
        if (tcs.is_mono_tcs_task_bound) this.free_task_completion_source(tcs)
    },
    set_task_failure: function(tcs, reason) {
        tcs.is_mono_tcs_result_set = true;
        this.call_method(this.set_tcs_failure, null, "os", [tcs, reason.toString()]);
        if (tcs.is_mono_tcs_task_bound) this.free_task_completion_source(tcs)
    },
    js_typedarray_to_heap: function(typedArray) {
        var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        var ptr = Module._malloc(numBytes);
        var heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
        heapBytes.set(new Uint8Array(typedArray.buffer, typedArray.byteOffset, numBytes));
        return heapBytes
    },
    js_to_mono_obj: function(js_obj) {
        this.bindings_lazy_init();

        function isThenable() {
            return Promise.resolve(js_obj) === js_obj || (typeof js_obj === "object" || typeof js_obj === "function") && typeof js_obj.then === "function"
        }
        switch (true) {
            case js_obj === null:
            case typeof js_obj === "undefined":
                return 0;
            case typeof js_obj === "number":
                if (parseInt(js_obj) == js_obj) return this.call_method(this.box_js_int, null, "im", [js_obj]);
                return this.call_method(this.box_js_double, null, "dm", [js_obj]);
            case typeof js_obj === "string":
                return this.js_string_to_mono_string(js_obj);
            case typeof js_obj === "boolean":
                return this.call_method(this.box_js_bool, null, "im", [js_obj]);
            case isThenable() === true:
                var the_task = this.try_extract_mono_obj(js_obj);
                if (the_task) return the_task;
                var tcs = this.create_task_completion_source();
                js_obj.then(function(result) {
                    BINDING.set_task_result(tcs, result)
                }, function(reason) {
                    BINDING.set_task_failure(tcs, reason)
                });
                return this.get_task_and_bind(tcs, js_obj);
            case js_obj.constructor.name === "Date":
                return this.call_method(this.create_date_time, null, "dm", [js_obj.getTime()]);
            default:
                return this.extract_mono_obj(js_obj)
        }
    },
    js_to_mono_uri: function(js_obj) {
        this.bindings_lazy_init();
        switch (true) {
            case js_obj === null:
            case typeof js_obj === "undefined":
                return 0;
            case typeof js_obj === "string":
                return this.call_method(this.create_uri, null, "sm", [js_obj]);
            default:
                return this.extract_mono_obj(js_obj)
        }
    },
    js_typed_array_to_array: function(js_obj) {
        if (!!(js_obj.buffer instanceof ArrayBuffer && js_obj.BYTES_PER_ELEMENT)) {
            var arrayType = 0;
            if (js_obj instanceof Int8Array) arrayType = 11;
            if (js_obj instanceof Uint8Array) arrayType = 12;
            if (js_obj instanceof Uint8ClampedArray) arrayType = 12;
            if (js_obj instanceof Int16Array) arrayType = 13;
            if (js_obj instanceof Uint16Array) arrayType = 14;
            if (js_obj instanceof Int32Array) arrayType = 15;
            if (js_obj instanceof Uint32Array) arrayType = 16;
            if (js_obj instanceof Float32Array) arrayType = 17;
            if (js_obj instanceof Float64Array) arrayType = 18;
            var heapBytes = this.js_typedarray_to_heap(js_obj);
            var bufferArray = this.mono_typed_array_new(heapBytes.byteOffset, js_obj.length, js_obj.BYTES_PER_ELEMENT, arrayType);
            Module._free(heapBytes.byteOffset);
            return bufferArray
        } else {
            throw new Error("Object '" + js_obj + "' is not a typed array")
        }
    },
    typedarray_copy_to: function(typed_array, pinned_array, begin, end, bytes_per_element) {
        if (!!(typed_array.buffer instanceof ArrayBuffer && typed_array.BYTES_PER_ELEMENT)) {
            if (bytes_per_element !== typed_array.BYTES_PER_ELEMENT) throw new Error("Inconsistent element sizes: TypedArray.BYTES_PER_ELEMENT '" + typed_array.BYTES_PER_ELEMENT + "' sizeof managed element: '" + bytes_per_element + "'");
            var num_of_bytes = (end - begin) * bytes_per_element;
            var view_bytes = typed_array.length * typed_array.BYTES_PER_ELEMENT;
            if (num_of_bytes > view_bytes) num_of_bytes = view_bytes;
            var offset = begin * bytes_per_element;
            var heapBytes = new Uint8Array(Module.HEAPU8.buffer, pinned_array + offset, num_of_bytes);
            heapBytes.set(new Uint8Array(typed_array.buffer, typed_array.byteOffset, num_of_bytes));
            return num_of_bytes
        } else {
            throw new Error("Object '" + typed_array + "' is not a typed array")
        }
    },
    typedarray_copy_from: function(typed_array, pinned_array, begin, end, bytes_per_element) {
        if (!!(typed_array.buffer instanceof ArrayBuffer && typed_array.BYTES_PER_ELEMENT)) {
            if (bytes_per_element !== typed_array.BYTES_PER_ELEMENT) throw new Error("Inconsistent element sizes: TypedArray.BYTES_PER_ELEMENT '" + typed_array.BYTES_PER_ELEMENT + "' sizeof managed element: '" + bytes_per_element + "'");
            var num_of_bytes = (end - begin) * bytes_per_element;
            var view_bytes = typed_array.length * typed_array.BYTES_PER_ELEMENT;
            if (num_of_bytes > view_bytes) num_of_bytes = view_bytes;
            var typedarrayBytes = new Uint8Array(typed_array.buffer, 0, num_of_bytes);
            var offset = begin * bytes_per_element;
            typedarrayBytes.set(Module.HEAPU8.subarray(pinned_array + offset, pinned_array + offset + num_of_bytes));
            return num_of_bytes
        } else {
            throw new Error("Object '" + typed_array + "' is not a typed array")
        }
    },
    typed_array_from: function(pinned_array, begin, end, bytes_per_element, type) {
        var newTypedArray = 0;
        switch (type) {
            case 5:
                newTypedArray = new Int8Array(end - begin);
                break;
            case 6:
                newTypedArray = new Uint8Array(end - begin);
                break;
            case 7:
                newTypedArray = new Int16Array(end - begin);
                break;
            case 8:
                newTypedArray = new Uint16Array(end - begin);
                break;
            case 9:
                newTypedArray = new Int32Array(end - begin);
                break;
            case 10:
                newTypedArray = new Uint32Array(end - begin);
                break;
            case 13:
                newTypedArray = new Float32Array(end - begin);
                break;
            case 14:
                newTypedArray = new Float64Array(end - begin);
                break;
            case 15:
                newTypedArray = new Uint8ClampedArray(end - begin);
                break
        }
        this.typedarray_copy_from(newTypedArray, pinned_array, begin, end, bytes_per_element);
        return newTypedArray
    },
    js_to_mono_enum: function(method, parmIdx, js_obj) {
        this.bindings_lazy_init();
        if (js_obj === null || typeof js_obj === "undefined") return 0;
        var monoObj = this.js_to_mono_obj(js_obj);
        var monoEnum = this.call_method(this.object_to_enum, null, "iimm", [method, parmIdx, monoObj]);
        return this.mono_unbox_enum(monoEnum)
    },
    wasm_binding_obj_new: function(js_obj_id, type) {
        return this.call_method(this.bind_js_obj, null, "io", [js_obj_id, type])
    },
    wasm_bind_existing: function(mono_obj, js_id) {
        return this.call_method(this.bind_existing_obj, null, "mi", [mono_obj, js_id])
    },
    wasm_bind_core_clr_obj: function(js_id, gc_handle) {
        return this.call_method(this.bind_core_clr_obj, null, "ii", [js_id, gc_handle])
    },
    wasm_unbind_js_obj: function(js_obj_id) {
        this.call_method(this.unbind_js_obj, null, "i", [js_obj_id])
    },
    wasm_unbind_js_obj_and_free: function(js_obj_id) {
        this.call_method(this.unbind_js_obj_and_free, null, "i", [js_obj_id])
    },
    wasm_get_js_id: function(mono_obj) {
        return this.call_method(this.get_js_id, null, "m", [mono_obj])
    },
    wasm_get_raw_obj: function(gchandle) {
        return this.call_method(this.get_raw_mono_obj, null, "im", [gchandle])
    },
    try_extract_mono_obj: function(js_obj) {
        if (js_obj === null || typeof js_obj === "undefined" || typeof js_obj.__mono_gchandle__ === "undefined") return 0;
        return this.wasm_get_raw_obj(js_obj.__mono_gchandle__)
    },
    mono_method_get_call_signature: function(method) {
        this.bindings_lazy_init();
        return this.call_method(this.get_call_sig, null, "i", [method])
    },
    get_task_and_bind: function(tcs, js_obj) {
        var gc_handle = this.mono_wasm_free_list.length ? this.mono_wasm_free_list.pop() : this.mono_wasm_ref_counter++;
        var task_gchandle = this.call_method(this.tcs_get_task_and_bind, null, "oi", [tcs, gc_handle + 1]);
        js_obj.__mono_gchandle__ = task_gchandle;
        this.mono_wasm_object_registry[gc_handle] = js_obj;
        this.free_task_completion_source(tcs);
        tcs.is_mono_tcs_task_bound = true;
        js_obj.__mono_bound_tcs__ = tcs.__mono_gchandle__;
        tcs.__mono_bound_task__ = js_obj.__mono_gchandle__;
        return this.wasm_get_raw_obj(js_obj.__mono_gchandle__)
    },
    free_task_completion_source: function(tcs) {
        if (tcs.is_mono_tcs_result_set) {
            this.call_method(this.unbind_raw_obj_and_free, null, "ii", [tcs.__mono_gchandle__])
        }
        if (tcs.__mono_bound_task__) {
            this.call_method(this.unbind_raw_obj_and_free, null, "ii", [tcs.__mono_bound_task__])
        }
    },
    extract_mono_obj: function(js_obj) {
        if (js_obj === null || typeof js_obj === "undefined") return 0;
        if (!js_obj.is_mono_bridged_obj) {
            var gc_handle = this.mono_wasm_register_obj(js_obj);
            return this.wasm_get_raw_obj(gc_handle)
        }
        return this.wasm_get_raw_obj(js_obj.__mono_gchandle__)
    },
    extract_js_obj: function(mono_obj) {
        if (mono_obj == 0) return null;
        var js_id = this.wasm_get_js_id(mono_obj);
        if (js_id > 0) return this.mono_wasm_require_handle(js_id);
        var gcHandle = this.mono_wasm_free_list.length ? this.mono_wasm_free_list.pop() : this.mono_wasm_ref_counter++;
        var js_obj = {
            __mono_gchandle__: this.wasm_bind_existing(mono_obj, gcHandle + 1),
            is_mono_bridged_obj: true
        };
        this.mono_wasm_object_registry[gcHandle] = js_obj;
        return js_obj
    },
    call_method: function(method, this_arg, args_marshal, args) {
        this.bindings_lazy_init();
        var has_args = args !== null && typeof args !== "undefined" && args.length > 0;
        var has_args_marshal = args_marshal !== null && typeof args_marshal !== "undefined" && args_marshal.length > 0;
        if (has_args_marshal && (!has_args || args.length > args_marshal.length)) throw Error("Parameter count mismatch.");
        var args_start = null;
        var buffer = null;
        var exception_out = null;
        if (has_args_marshal && has_args) {
            var i;
            var converters = this.converters;
            if (!converters) {
                converters = new Map;
                converters.set("m", {
                    steps: [{}],
                    size: 0
                });
                converters.set("s", {
                    steps: [{
                        convert: this.js_string_to_mono_string.bind(this)
                    }],
                    size: 0
                });
                converters.set("o", {
                    steps: [{
                        convert: this.js_to_mono_obj.bind(this)
                    }],
                    size: 0
                });
                converters.set("u", {
                    steps: [{
                        convert: this.js_to_mono_uri.bind(this)
                    }],
                    size: 0
                });
                converters.set("k", {
                    steps: [{
                        convert: this.js_to_mono_enum.bind(this),
                        indirect: "i64"
                    }],
                    size: 8
                });
                converters.set("j", {
                    steps: [{
                        convert: this.js_to_mono_enum.bind(this),
                        indirect: "i32"
                    }],
                    size: 8
                });
                converters.set("i", {
                    steps: [{
                        indirect: "i32"
                    }],
                    size: 8
                });
                converters.set("l", {
                    steps: [{
                        indirect: "i64"
                    }],
                    size: 8
                });
                converters.set("f", {
                    steps: [{
                        indirect: "float"
                    }],
                    size: 8
                });
                converters.set("d", {
                    steps: [{
                        indirect: "double"
                    }],
                    size: 8
                });
                this.converters = converters
            }
            var converter = converters.get(args_marshal);
            if (!converter) {
                var steps = [];
                var size = 0;
                for (i = 0; i < args_marshal.length; ++i) {
                    var conv = this.converters.get(args_marshal[i]);
                    if (!conv) throw Error("Unknown parameter type " + type);
                    steps.push(conv.steps[0]);
                    size += conv.size
                }
                converter = {
                    steps: steps,
                    size: size
                };
                converters.set(args_marshal, converter)
            }
            buffer = Module._malloc(converter.size + args.length * 4 + 4);
            var indirect_start = buffer;
            exception_out = indirect_start + converter.size;
            args_start = exception_out + 4;
            var slot = args_start;
            var indirect_value = indirect_start;
            for (i = 0; i < args.length; ++i) {
                var handler = converter.steps[i];
                var obj = handler.convert ? handler.convert(args[i], method, i) : args[i];
                if (handler.indirect) {
                    Module.setValue(indirect_value, obj, handler.indirect);
                    obj = indirect_value;
                    indirect_value += 8
                }
                Module.setValue(slot, obj, "*");
                slot += 4
            }
        } else {
            exception_out = buffer = Module._malloc(4)
        }
        Module.setValue(exception_out, 0, "*");
        var res = this.invoke_method(method, this_arg, args_start, exception_out);
        var eh_res = Module.getValue(exception_out, "*");
        Module._free(buffer);
        if (eh_res != 0) {
            var msg = this.conv_string(res);
            throw new Error(msg)
        }
        if (has_args_marshal && has_args) {
            if (args_marshal.length >= args.length && args_marshal[args.length] === "m") return res
        }
        return this.unbox_mono_obj(res)
    },
    invoke_delegate: function(delegate_obj, js_args) {
        this.bindings_lazy_init();
        if (!this.delegate_dynamic_invoke) {
            if (!this.corlib) this.corlib = this.assembly_load("mscorlib");
            if (!this.delegate_class) this.delegate_class = this.find_class(this.corlib, "System", "Delegate");
            if (!this.delegate_class) {
                throw new Error("System.Delegate class can not be resolved.")
            }
            this.delegate_dynamic_invoke = this.find_method(this.delegate_class, "DynamicInvoke", -1)
        }
        var mono_args = this.js_array_to_mono_array(js_args);
        if (!this.delegate_dynamic_invoke) throw new Error("System.Delegate.DynamicInvoke method can not be resolved.");
        return this.call_method(this.delegate_dynamic_invoke, this.extract_mono_obj(delegate_obj), "mo", [mono_args])
    },
    resolve_method_fqn: function(fqn) {
        var assembly = fqn.substring(fqn.indexOf("[") + 1, fqn.indexOf("]")).trim();
        fqn = fqn.substring(fqn.indexOf("]") + 1).trim();
        var methodname = fqn.substring(fqn.indexOf(":") + 1);
        fqn = fqn.substring(0, fqn.indexOf(":")).trim();
        var namespace = "";
        var classname = fqn;
        if (fqn.indexOf(".") != -1) {
            var idx = fqn.lastIndexOf(".");
            namespace = fqn.substring(0, idx);
            classname = fqn.substring(idx + 1)
        }
        var asm = this.assembly_load(assembly);
        if (!asm) throw new Error("Could not find assembly: " + assembly);
        var klass = this.find_class(asm, namespace, classname);
        if (!klass) throw new Error("Could not find class: " + namespace + ":" + classname);
        var method = this.find_method(klass, methodname, -1);
        if (!method) throw new Error("Could not find method: " + methodname);
        return method
    },
    call_static_method: function(fqn, args, signature) {
        this.bindings_lazy_init();
        var method = this.resolve_method_fqn(fqn);
        if (typeof signature === "undefined") signature = Module.mono_method_get_call_signature(method);
        return this.call_method(method, null, signature, args)
    },
    bind_static_method: function(fqn, signature) {
        this.bindings_lazy_init();
        var method = this.resolve_method_fqn(fqn);
        if (typeof signature === "undefined") signature = Module.mono_method_get_call_signature(method);
        return function() {
            return BINDING.call_method(method, null, signature, arguments)
        }
    },
    bind_assembly_entry_point: function(assembly) {
        this.bindings_lazy_init();
        var asm = this.assembly_load(assembly);
        if (!asm) throw new Error("Could not find assembly: " + assembly);
        var method = this.assembly_get_entry_point(asm);
        if (!method) throw new Error("Could not find entry point for assembly: " + assembly);
        if (typeof signature === "undefined") signature = Module.mono_method_get_call_signature(method);
        return function() {
            return BINDING.call_method(method, null, signature, arguments)
        }
    },
    call_assembly_entry_point: function(assembly, args, signature) {
        this.bindings_lazy_init();
        var asm = this.assembly_load(assembly);
        if (!asm) throw new Error("Could not find assembly: " + assembly);
        var method = this.assembly_get_entry_point(asm);
        if (!method) throw new Error("Could not find entry point for assembly: " + assembly);
        if (typeof signature === "undefined") signature = Module.mono_method_get_call_signature(method);
        return this.call_method(method, null, signature, args)
    },
    wasm_get_core_type: function(obj) {
        return this.call_method(this.get_core_type, null, "so", ["WebAssembly.Core." + obj.constructor.name])
    },
    get_wasm_type: function(obj) {
        var coreType = obj[Symbol.for("wasm type")];
        if (typeof coreType === "undefined") {
            coreType = this.wasm_get_core_type(obj);
            if (typeof coreType !== "undefined") {
                obj.constructor.prototype[Symbol.for("wasm type")] = coreType
            }
        }
        return coreType
    },
    mono_wasm_register_obj: function(obj) {
        var gc_handle = undefined;
        if (obj !== null && typeof obj !== "undefined") {
            gc_handle = obj.__mono_gchandle__;
            if (typeof gc_handle === "undefined") {
                var handle = this.mono_wasm_free_list.length ? this.mono_wasm_free_list.pop() : this.mono_wasm_ref_counter++;
                obj.__mono_jshandle__ = handle;
                var wasm_type = this.get_wasm_type(obj);
                gc_handle = obj.__mono_gchandle__ = this.wasm_binding_obj_new(handle + 1, wasm_type);
                this.mono_wasm_object_registry[handle] = obj
            }
        }
        return gc_handle
    },
    mono_wasm_require_handle: function(handle) {
        if (handle > 0) return this.mono_wasm_object_registry[handle - 1];
        return null
    },
    mono_wasm_unregister_obj: function(js_id) {
        var obj = this.mono_wasm_object_registry[js_id - 1];
        if (typeof obj !== "undefined" && obj !== null) {
            if (typeof ___mono_wasm_global___ !== "undefined" && ___mono_wasm_global___ === obj) return obj;
            var gc_handle = obj.__mono_gchandle__;
            if (typeof gc_handle !== "undefined") {
                this.wasm_unbind_js_obj_and_free(js_id);
                obj.__mono_gchandle__ = undefined;
                obj.__mono_jshandle__ = undefined;
                this.mono_wasm_object_registry[js_id - 1] = undefined;
                this.mono_wasm_free_list.push(js_id - 1)
            }
        }
        return obj
    },
    mono_wasm_free_handle: function(handle) {
        this.mono_wasm_unregister_obj(handle)
    },
    mono_wasm_free_raw_object: function(js_id) {
        var obj = this.mono_wasm_object_registry[js_id - 1];
        if (typeof obj !== "undefined" && obj !== null) {
            if (typeof ___mono_wasm_global___ !== "undefined" && ___mono_wasm_global___ === obj) return obj;
            var gc_handle = obj.__mono_gchandle__;
            if (typeof gc_handle !== "undefined") {
                obj.__mono_gchandle__ = undefined;
                obj.__mono_jshandle__ = undefined;
                this.mono_wasm_object_registry[js_id - 1] = undefined;
                this.mono_wasm_free_list.push(js_id - 1)
            }
        }
        return obj
    },
    mono_wasm_get_global: function() {
        function testGlobal(obj) {
            obj["___mono_wasm_global___"] = obj;
            var success = typeof ___mono_wasm_global___ === "object" && obj["___mono_wasm_global___"] === obj;
            if (!success) {
                delete obj["___mono_wasm_global___"]
            }
            return success
        }
        if (typeof ___mono_wasm_global___ === "object") {
            return ___mono_wasm_global___
        }
        if (typeof global === "object" && testGlobal(global)) {
            ___mono_wasm_global___ = global
        } else if (typeof window === "object" && testGlobal(window)) {
            ___mono_wasm_global___ = window
        } else if (testGlobal(function() {
                return Function
            }()("return this")())) {
            ___mono_wasm_global___ = function() {
                return Function
            }()("return this")()
        }
        if (typeof ___mono_wasm_global___ === "object") {
            return ___mono_wasm_global___
        }
        throw Error("Unable to get mono wasm global object.")
    }
};

function _mono_wasm_bind_core_object(js_handle, gc_handle, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    BINDING.wasm_bind_core_clr_obj(js_handle, gc_handle);
    requireObject.__mono_gchandle__ = gc_handle;
    return gc_handle
}

function _mono_wasm_bind_host_object(js_handle, gc_handle, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    BINDING.wasm_bind_core_clr_obj(js_handle, gc_handle);
    requireObject.__mono_gchandle__ = gc_handle;
    return gc_handle
}

function _mono_wasm_end_value_type_var() {
    var top_vt_obj_popped = MONO._vt_stack.pop();
    top_vt_obj_popped.value.members = MONO._filter_automatic_properties(MONO._fixup_name_value_objects(top_vt_obj_popped.value.members));
    if (MONO._vt_stack.length == 0) {
        MONO.var_info = MONO._old_var_info;
        MONO.var_info.push(top_vt_obj_popped)
    } else {
        var top_obj = MONO._vt_stack[MONO._vt_stack.length - 1];
        top_obj.value.members.push(top_vt_obj_popped);
        MONO.var_info = top_obj.value.members
    }
}

function _mono_wasm_fire_bp() {
    console.log("mono_wasm_fire_bp");
    debugger
}

function _mono_wasm_get_by_index(js_handle, property_index, is_exception) {
    BINDING.bindings_lazy_init();
    var obj = BINDING.mono_wasm_require_handle(js_handle);
    if (!obj) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    try {
        var m = obj[property_index];
        return BINDING.js_to_mono_obj(m)
    } catch (e) {
        var res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || typeof res === "undefined") res = "unknown exception";
        return BINDING.js_string_to_mono_string(res)
    }
}

function _mono_wasm_get_global_object(global_name, is_exception) {
    BINDING.bindings_lazy_init();
    var js_name = BINDING.conv_string(global_name);
    var globalObj = undefined;
    if (!js_name) {
        globalObj = BINDING.mono_wasm_get_global()
    } else {
        globalObj = BINDING.mono_wasm_get_global()[js_name]
    }
    if (globalObj === null || typeof globalObj === undefined) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Global object '" + js_name + "' not found.")
    }
    return BINDING.js_to_mono_obj(globalObj)
}

function _mono_wasm_get_object_property(js_handle, property_name, is_exception) {
    BINDING.bindings_lazy_init();
    var obj = BINDING.mono_wasm_require_handle(js_handle);
    if (!obj) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var js_name = BINDING.conv_string(property_name);
    if (!js_name) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid property name object '" + js_name + "'")
    }
    var res;
    try {
        var m = obj[js_name];
        if (m === Object(m) && obj.__is_mono_proxied__) m.__is_mono_proxied__ = true;
        return BINDING.js_to_mono_obj(m)
    } catch (e) {
        var res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || typeof res === "undefined") res = "unknown exception";
        return BINDING.js_string_to_mono_string(res)
    }
}
var DOTNET = {
    _dotnet_get_global: function() {
        function testGlobal(obj) {
            obj["___dotnet_global___"] = obj;
            var success = typeof ___dotnet_global___ === "object" && obj["___dotnet_global___"] === obj;
            if (!success) {
                delete obj["___dotnet_global___"]
            }
            return success
        }
        if (typeof ___dotnet_global___ === "object") {
            return ___dotnet_global___
        }
        if (typeof global === "object" && testGlobal(global)) {
            ___dotnet_global___ = global
        } else if (typeof window === "object" && testGlobal(window)) {
            ___dotnet_global___ = window
        }
        if (typeof ___dotnet_global___ === "object") {
            return ___dotnet_global___
        }
        throw Error("unable to get DotNet global object.")
    },
    conv_string: function(mono_obj) {
        return MONO.string_decoder.copy(mono_obj)
    }
};

function _mono_wasm_invoke_js_marshalled(exceptionMessage, asyncHandleLongPtr, functionName, argsJson) {
    var mono_string = DOTNET._dotnet_get_global()._mono_string_cached || (DOTNET._dotnet_get_global()._mono_string_cached = Module.cwrap("mono_wasm_string_from_js", "number", ["string"]));
    try {
        var u32Index = asyncHandleLongPtr >> 2;
        var asyncHandleJsNumber = Module.HEAPU32[u32Index + 1] * 4294967296 + Module.HEAPU32[u32Index];
        var funcNameJsString = DOTNET.conv_string(functionName);
        var argsJsonJsString = argsJson && DOTNET.conv_string(argsJson);
        var dotNetExports = DOTNET._dotnet_get_global().DotNet;
        if (!dotNetExports) {
            throw new Error("The Microsoft.JSInterop.js library is not loaded.")
        }
        if (asyncHandleJsNumber) {
            dotNetExports.jsCallDispatcher.beginInvokeJSFromDotNet(asyncHandleJsNumber, funcNameJsString, argsJsonJsString);
            return 0
        } else {
            var resultJson = dotNetExports.jsCallDispatcher.invokeJSFromDotNet(funcNameJsString, argsJsonJsString);
            return resultJson === null ? 0 : mono_string(resultJson)
        }
    } catch (ex) {
        var exceptionJsString = ex.message + "\n" + ex.stack;
        var exceptionSystemString = mono_string(exceptionJsString);
        setValue(exceptionMessage, exceptionSystemString, "i32");
        return 0
    }
}

function _mono_wasm_invoke_js_unmarshalled(exceptionMessage, funcName, arg0, arg1, arg2) {
    try {
        var funcNameJsString = DOTNET.conv_string(funcName);
        var dotNetExports = DOTNET._dotnet_get_global().DotNet;
        if (!dotNetExports) {
            throw new Error("The Microsoft.JSInterop.js library is not loaded.")
        }
        var funcInstance = dotNetExports.jsCallDispatcher.findJSFunction(funcNameJsString);
        return funcInstance.call(null, arg0, arg1, arg2)
    } catch (ex) {
        var exceptionJsString = ex.message + "\n" + ex.stack;
        var mono_string = Module.cwrap("mono_wasm_string_from_js", "number", ["string"]);
        var exceptionSystemString = mono_string(exceptionJsString);
        setValue(exceptionMessage, exceptionSystemString, "i32");
        return 0
    }
}

function _mono_wasm_invoke_js_with_args(js_handle, method_name, args, is_exception) {
    BINDING.bindings_lazy_init();
    var obj = BINDING.get_js_obj(js_handle);
    if (!obj) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var js_name = BINDING.conv_string(method_name);
    if (!js_name) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid method name object '" + method_name + "'")
    }
    var js_args = BINDING.mono_array_to_js_array(args);
    var res;
    try {
        var m = obj[js_name];
        if (typeof m === "undefined") throw new Error("Method: '" + js_name + "' not found for: '" + Object.prototype.toString.call(obj) + "'");
        var res = m.apply(obj, js_args);
        return BINDING.js_to_mono_obj(res)
    } catch (e) {
        var res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || res === undefined) res = "unknown exception";
        return BINDING.js_string_to_mono_string(res)
    }
}

function _mono_wasm_new(core_name, args, is_exception) {
    BINDING.bindings_lazy_init();
    var js_name = BINDING.conv_string(core_name);
    if (!js_name) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Core object '" + js_name + "' not found.")
    }
    var coreObj = BINDING.mono_wasm_get_global()[js_name];
    if (coreObj === null || typeof coreObj === "undefined") {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("JavaScript host object '" + js_name + "' not found.")
    }
    var js_args = BINDING.mono_array_to_js_array(args);
    try {
        var allocator = function(constructor, js_args) {
            var argsList = new Array;
            argsList[0] = constructor;
            if (js_args) argsList = argsList.concat(js_args);
            var obj = new(constructor.bind.apply(constructor, argsList));
            return obj
        };
        var res = allocator(coreObj, js_args);
        var gc_handle = BINDING.mono_wasm_free_list.length ? BINDING.mono_wasm_free_list.pop() : BINDING.mono_wasm_ref_counter++;
        BINDING.mono_wasm_object_registry[gc_handle] = res;
        return BINDING.js_to_mono_obj(gc_handle + 1)
    } catch (e) {
        var res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || res === undefined) res = "Error allocating object.";
        return BINDING.js_string_to_mono_string(res)
    }
}

function _mono_wasm_new_object(object_handle_or_function, args, is_exception) {
    BINDING.bindings_lazy_init();
    if (!object_handle_or_function) {
        return BINDING.js_to_mono_obj({})
    } else {
        var requireObject;
        if (typeof object_handle_or_function === "function") requireObject = object_handle_or_function;
        else requireObject = BINDING.mono_wasm_require_handle(object_handle_or_function);
        if (!requireObject) {
            setValue(is_exception, 1, "i32");
            return BINDING.js_string_to_mono_string("Invalid JS object handle '" + object_handle_or_function + "'")
        }
        var js_args = BINDING.mono_array_to_js_array(args);
        try {
            var allocator = function(constructor, js_args) {
                var argsList = new Array;
                argsList[0] = constructor;
                if (js_args) argsList = argsList.concat(js_args);
                var obj = new(constructor.bind.apply(constructor, argsList));
                return obj
            };
            var res = allocator(requireObject, js_args);
            return BINDING.extract_mono_obj(res)
        } catch (e) {
            var res = e.toString();
            setValue(is_exception, 1, "i32");
            if (res === null || res === undefined) res = "Error allocating object.";
            return BINDING.js_string_to_mono_string(res)
        }
    }
}

function _mono_wasm_release_handle(js_handle, is_exception) {
    BINDING.bindings_lazy_init();
    BINDING.mono_wasm_free_handle(js_handle)
}

function _mono_wasm_release_object(js_handle, is_exception) {
    BINDING.bindings_lazy_init();
    BINDING.mono_wasm_free_raw_object(js_handle)
}

function _mono_wasm_set_by_index(js_handle, property_index, value, is_exception) {
    BINDING.bindings_lazy_init();
    var obj = BINDING.mono_wasm_require_handle(js_handle);
    if (!obj) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var js_value = BINDING.unbox_mono_obj(value);
    try {
        obj[property_index] = js_value;
        return true
    } catch (e) {
        var res = e.toString();
        setValue(is_exception, 1, "i32");
        if (res === null || typeof res === "undefined") res = "unknown exception";
        return BINDING.js_string_to_mono_string(res)
    }
}

function _mono_wasm_set_is_async_method(objectId) {
    MONO._async_method_objectId = objectId
}

function _mono_wasm_set_object_property(js_handle, property_name, value, createIfNotExist, hasOwnProperty, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var property = BINDING.conv_string(property_name);
    if (!property) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid property name object '" + property_name + "'")
    }
    var result = false;
    var js_value = BINDING.unbox_mono_obj(value);
    if (createIfNotExist) {
        requireObject[property] = js_value;
        result = true
    } else {
        result = false;
        if (!createIfNotExist) {
            if (!requireObject.hasOwnProperty(property)) return false
        }
        if (hasOwnProperty === true) {
            if (requireObject.hasOwnProperty(property)) {
                requireObject[property] = js_value;
                result = true
            }
        } else {
            requireObject[property] = js_value;
            result = true
        }
    }
    return BINDING.call_method(BINDING.box_js_bool, null, "im", [result])
}

function _mono_wasm_typed_array_copy_from(js_handle, pinned_array, begin, end, bytes_per_element, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var res = BINDING.typedarray_copy_from(requireObject, pinned_array, begin, end, bytes_per_element);
    return BINDING.js_to_mono_obj(res)
}

function _mono_wasm_typed_array_copy_to(js_handle, pinned_array, begin, end, bytes_per_element, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    var res = BINDING.typedarray_copy_to(requireObject, pinned_array, begin, end, bytes_per_element);
    return BINDING.js_to_mono_obj(res)
}

function _mono_wasm_typed_array_from(pinned_array, begin, end, bytes_per_element, type, is_exception) {
    BINDING.bindings_lazy_init();
    var res = BINDING.typed_array_from(pinned_array, begin, end, bytes_per_element, type);
    return BINDING.js_to_mono_obj(res)
}

function _mono_wasm_typed_array_to_array(js_handle, is_exception) {
    BINDING.bindings_lazy_init();
    var requireObject = BINDING.mono_wasm_require_handle(js_handle);
    if (!requireObject) {
        setValue(is_exception, 1, "i32");
        return BINDING.js_string_to_mono_string("Invalid JS object handle '" + js_handle + "'")
    }
    return BINDING.js_typed_array_to_array(requireObject)
}

function _usleep(useconds) {
    var start = _emscripten_get_now();
    while (_emscripten_get_now() - start < useconds / 1e3) {}
}
Module["_usleep"] = _usleep;

function _nanosleep(rqtp, rmtp) {
    if (rqtp === 0) {
        ___setErrNo(28);
        return -1
    }
    var seconds = HEAP32[rqtp >> 2];
    var nanoseconds = HEAP32[rqtp + 4 >> 2];
    if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
        ___setErrNo(28);
        return -1
    }
    if (rmtp !== 0) {
        HEAP32[rmtp >> 2] = 0;
        HEAP32[rmtp + 4 >> 2] = 0
    }
    return _usleep(seconds * 1e6 + nanoseconds / 1e3)
}

function _pthread_cleanup_pop() {
    assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
    __ATEXIT__.pop();
    _pthread_cleanup_push.level = __ATEXIT__.length
}

function _pthread_cleanup_push(routine, arg) {
    __ATEXIT__.push(function() {
        dynCall_vi(routine, arg)
    });
    _pthread_cleanup_push.level = __ATEXIT__.length
}

function _pthread_setcancelstate() {
    return 0
}

function _schedule_background_exec() {
    ++MONO.pump_count;
    if (ENVIRONMENT_IS_WEB) {
        window.setTimeout(MONO.pump_message, 0)
    } else if (ENVIRONMENT_IS_WORKER) {
        self.setTimeout(MONO.pump_message, 0)
    } else if (ENVIRONMENT_IS_NODE) {
        global.setTimeout(MONO.pump_message, 0)
    }
}

function _sem_destroy() {}

function _sem_init() {}

function _sem_post() {}

function _sem_trywait() {}

function _sem_wait() {}

function _sigaction(signum, act, oldact) {
    return 0
}

function _sigemptyset(set) {
    HEAP32[set >> 2] = 0;
    return 0
}

function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}

function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }

    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }

    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }

    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30)
        }
    }

    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        },
        "%A": function(date) {
            return WEEKDAYS[date.tm_wday]
        },
        "%b": function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        },
        "%B": function(date) {
            return MONTHS[date.tm_mon]
        },
        "%C": function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        },
        "%d": function(date) {
            return leadingNulls(date.tm_mday, 2)
        },
        "%e": function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        },
        "%g": function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        },
        "%G": function(date) {
            return getWeekBasedYear(date)
        },
        "%H": function(date) {
            return leadingNulls(date.tm_hour, 2)
        },
        "%I": function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        },
        "%j": function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        },
        "%m": function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        },
        "%M": function(date) {
            return leadingNulls(date.tm_min, 2)
        },
        "%n": function() {
            return "\n"
        },
        "%p": function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        },
        "%S": function(date) {
            return leadingNulls(date.tm_sec, 2)
        },
        "%t": function() {
            return "\t"
        },
        "%u": function(date) {
            return date.tm_wday || 7
        },
        "%U": function(date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
        },
        "%V": function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        },
        "%w": function(date) {
            return date.tm_wday
        },
        "%W": function(date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
        },
        "%y": function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        },
        "%Y": function(date) {
            return date.tm_year + 1900
        },
        "%z": function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        },
        "%Z": function(date) {
            return date.tm_zone
        },
        "%%": function() {
            return "%"
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}

function _sysconf(name) {
    switch (name) {
        case 30:
            return 16384;
        case 85:
            var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
            return maxHeapSize / 16384;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
        case 79:
            return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
            return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
            return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
            return 1024;
        case 31:
        case 42:
        case 72:
            return 32;
        case 87:
        case 26:
        case 33:
            return 2147483647;
        case 34:
        case 1:
            return 47839;
        case 38:
        case 36:
            return 99;
        case 43:
        case 37:
            return 2048;
        case 0:
            return 2097152;
        case 3:
            return 65536;
        case 28:
            return 32768;
        case 44:
            return 32767;
        case 75:
            return 16384;
        case 39:
            return 1e3;
        case 89:
            return 700;
        case 71:
            return 256;
        case 40:
            return 255;
        case 2:
            return 100;
        case 180:
            return 64;
        case 25:
            return 20;
        case 5:
            return 16;
        case 6:
            return 6;
        case 73:
            return 4;
        case 84: {
            if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
            return 1
        }
    }
    ___setErrNo(28);
    return -1
}

function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}

function _utime(path, times) {
    var time;
    if (times) {
        var offset = 4;
        time = HEAP32[times + offset >> 2];
        time *= 1e3
    } else {
        time = Date.now()
    }
    path = UTF8ToString(path);
    try {
        FS.utime(path, time, time);
        return 0
    } catch (e) {
        FS.handleFSError(e);
        return -1
    }
}

function _utimes(path, times) {
    var time;
    if (times) {
        var offset = 8 + 0;
        time = HEAP32[times + offset >> 2] * 1e3;
        offset = 8 + 4;
        time += HEAP32[times + offset >> 2] / 1e3
    } else {
        time = Date.now()
    }
    path = UTF8ToString(path);
    try {
        FS.utime(path, time, time);
        return 0
    } catch (e) {
        FS.handleFSError(e);
        return -1
    }
}

function _wait(stat_loc) {
    ___setErrNo(12);
    return -1
}

function _waitpid(a0) {
    return _wait(a0)
}

function readAsmConstArgs(sigPtr, buf) {
    if (!readAsmConstArgs.array) {
        readAsmConstArgs.array = []
    }
    var args = readAsmConstArgs.array;
    args.length = 0;
    var ch;
    while (ch = HEAPU8[sigPtr++]) {
        if (ch === 100 || ch === 102) {
            buf = buf + 7 & ~7;
            args.push(HEAPF64[buf >> 3]);
            buf += 8
        } else {
            buf = buf + 3 & ~3;
            args.push(HEAP32[buf >> 2]);
            buf += 4
        }
    }
    return args
}
var FSNode = function(parent, name, mode, rdev) {
    if (!parent) {
        parent = this
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function() {
            return (this.mode & readMode) === readMode
        },
        set: function(val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
        }
    },
    write: {
        get: function() {
            return (this.mode & writeMode) === writeMode
        },
        set: function(val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
        }
    },
    isFolder: {
        get: function() {
            return FS.isDir(this.mode)
        }
    },
    isDevice: {
        get: function() {
            return FS.isChrdev(this.mode)
        }
    }
});
FS.FSNode = FSNode;
FS.staticInit();
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
MONO.export_functions(Module);
BINDING.export_functions(Module);

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
var asmLibraryArg = {
    "f": ___assert_fail,
    "ub": ___clock_gettime,
    "tb": ___cxa_allocate_exception,
    "sb": ___cxa_begin_catch,
    "rb": ___cxa_end_catch,
    "qb": ___cxa_find_matching_catch_3,
    "pb": ___cxa_throw,
    "nb": ___resumeException,
    "mb": ___syscall10,
    "j": ___syscall102,
    "lb": ___syscall12,
    "kb": ___syscall122,
    "jb": ___syscall142,
    "ib": ___syscall144,
    "M": ___syscall15,
    "hb": ___syscall168,
    "gb": ___syscall183,
    "fb": ___syscall192,
    "eb": ___syscall194,
    "L": ___syscall195,
    "db": ___syscall196,
    "cb": ___syscall197,
    "K": ___syscall199,
    "d": ___syscall20,
    "w": ___syscall201,
    "J": ___syscall202,
    "bb": ___syscall209,
    "ab": ___syscall220,
    "l": ___syscall221,
    "$a": ___syscall268,
    "_a": ___syscall272,
    "Za": ___syscall3,
    "Ya": ___syscall320,
    "Xa": ___syscall33,
    "Wa": ___syscall38,
    "Va": ___syscall39,
    "Ua": ___syscall40,
    "Ta": ___syscall41,
    "Sa": ___syscall42,
    "I": ___syscall5,
    "H": ___syscall54,
    "Ra": ___syscall63,
    "Qa": ___syscall77,
    "Pa": ___syscall83,
    "Oa": ___syscall85,
    "Na": ___syscall9,
    "Ma": ___syscall91,
    "La": ___syscall94,
    "Ka": ___syscall96,
    "Ja": ___syscall97,
    "k": _abort,
    "Ea": _clock_getres,
    "Da": _clock_gettime,
    "Ca": compile_function,
    "q": _emscripten_asm_const_iii,
    "Ba": _emscripten_memcpy_big,
    "o": _emscripten_resize_heap,
    "Ia": _environ_get,
    "Ha": _environ_sizes_get,
    "g": _exit,
    "v": _fd_close,
    "G": _fd_fdstat_get,
    "Ga": _fd_read,
    "sa": _fd_seek,
    "Fa": _fd_sync,
    "C": _fd_write,
    "Aa": _fork,
    "za": _getTempRet0,
    "ya": _getaddrinfo,
    "xa": _getgrgid_r,
    "wa": _getgrnam_r,
    "B": _getnameinfo,
    "va": _getprotobyname,
    "n": _gettimeofday,
    "ua": _gmtime_r,
    "ob": invoke_vi,
    "ta": _kill,
    "na": _llvm_eh_typeid_for,
    "c": _localtime_r,
    "memory": wasmMemory,
    "ma": _mono_set_timeout,
    "la": _mono_wasm_add_array_item,
    "ra": _mono_wasm_add_enum_var,
    "ka": _mono_wasm_add_frame,
    "qa": _mono_wasm_add_func_var,
    "pa": _mono_wasm_add_obj_var,
    "u": _mono_wasm_add_properties_var,
    "e": _mono_wasm_add_typed_value,
    "ja": _mono_wasm_add_value_type_unexpanded_var,
    "ia": _mono_wasm_begin_value_type_var,
    "ha": _mono_wasm_bind_core_object,
    "ga": _mono_wasm_bind_host_object,
    "fa": _mono_wasm_end_value_type_var,
    "ea": _mono_wasm_fire_bp,
    "da": _mono_wasm_get_by_index,
    "ca": _mono_wasm_get_global_object,
    "ba": _mono_wasm_get_object_property,
    "aa": _mono_wasm_invoke_js_marshalled,
    "$": _mono_wasm_invoke_js_unmarshalled,
    "_": _mono_wasm_invoke_js_with_args,
    "Z": _mono_wasm_new,
    "Y": _mono_wasm_new_object,
    "X": _mono_wasm_release_handle,
    "W": _mono_wasm_release_object,
    "V": _mono_wasm_set_by_index,
    "oa": _mono_wasm_set_is_async_method,
    "U": _mono_wasm_set_object_property,
    "T": mono_wasm_timezone_get_local_name,
    "S": _mono_wasm_typed_array_copy_from,
    "R": _mono_wasm_typed_array_copy_to,
    "Q": _mono_wasm_typed_array_from,
    "P": _mono_wasm_typed_array_to_array,
    "z": _nanosleep,
    "i": _pthread_cleanup_pop,
    "h": _pthread_cleanup_push,
    "p": _pthread_setcancelstate,
    "O": _schedule_background_exec,
    "t": _sem_destroy,
    "s": _sem_init,
    "r": _sem_post,
    "F": _sem_trywait,
    "A": _sem_wait,
    "y": _sigaction,
    "x": _sigemptyset,
    "b": _strftime,
    "m": _sysconf,
    "table": wasmTable,
    "a": _time,
    "E": _utime,
    "D": _utimes,
    "N": _waitpid
};
var asm = createWasm();
Module["asm"] = asm;
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["vb"]).apply(null, arguments)
};
var _mono_wasm_add_assembly = Module["_mono_wasm_add_assembly"] = function() {
    return (_mono_wasm_add_assembly = Module["_mono_wasm_add_assembly"] = Module["asm"]["wb"]).apply(null, arguments)
};
var _mono_wasm_setenv = Module["_mono_wasm_setenv"] = function() {
    return (_mono_wasm_setenv = Module["_mono_wasm_setenv"] = Module["asm"]["xb"]).apply(null, arguments)
};
var _mono_wasm_load_runtime = Module["_mono_wasm_load_runtime"] = function() {
    return (_mono_wasm_load_runtime = Module["_mono_wasm_load_runtime"] = Module["asm"]["yb"]).apply(null, arguments)
};
var _mono_wasm_assembly_load = Module["_mono_wasm_assembly_load"] = function() {
    return (_mono_wasm_assembly_load = Module["_mono_wasm_assembly_load"] = Module["asm"]["zb"]).apply(null, arguments)
};
var _mono_wasm_assembly_find_class = Module["_mono_wasm_assembly_find_class"] = function() {
    return (_mono_wasm_assembly_find_class = Module["_mono_wasm_assembly_find_class"] = Module["asm"]["Ab"]).apply(null, arguments)
};
var _mono_wasm_assembly_find_method = Module["_mono_wasm_assembly_find_method"] = function() {
    return (_mono_wasm_assembly_find_method = Module["_mono_wasm_assembly_find_method"] = Module["asm"]["Bb"]).apply(null, arguments)
};
var _mono_wasm_invoke_method = Module["_mono_wasm_invoke_method"] = function() {
    return (_mono_wasm_invoke_method = Module["_mono_wasm_invoke_method"] = Module["asm"]["Cb"]).apply(null, arguments)
};
var _mono_wasm_assembly_get_entry_point = Module["_mono_wasm_assembly_get_entry_point"] = function() {
    return (_mono_wasm_assembly_get_entry_point = Module["_mono_wasm_assembly_get_entry_point"] = Module["asm"]["Db"]).apply(null, arguments)
};
var _mono_wasm_string_get_utf8 = Module["_mono_wasm_string_get_utf8"] = function() {
    return (_mono_wasm_string_get_utf8 = Module["_mono_wasm_string_get_utf8"] = Module["asm"]["Eb"]).apply(null, arguments)
};
var _mono_wasm_string_convert = Module["_mono_wasm_string_convert"] = function() {
    return (_mono_wasm_string_convert = Module["_mono_wasm_string_convert"] = Module["asm"]["Fb"]).apply(null, arguments)
};
var _mono_wasm_string_from_js = Module["_mono_wasm_string_from_js"] = function() {
    return (_mono_wasm_string_from_js = Module["_mono_wasm_string_from_js"] = Module["asm"]["Gb"]).apply(null, arguments)
};
var _mono_wasm_get_obj_type = Module["_mono_wasm_get_obj_type"] = function() {
    return (_mono_wasm_get_obj_type = Module["_mono_wasm_get_obj_type"] = Module["asm"]["Hb"]).apply(null, arguments)
};
var _mono_unbox_int = Module["_mono_unbox_int"] = function() {
    return (_mono_unbox_int = Module["_mono_unbox_int"] = Module["asm"]["Ib"]).apply(null, arguments)
};
var _mono_wasm_unbox_float = Module["_mono_wasm_unbox_float"] = function() {
    return (_mono_wasm_unbox_float = Module["_mono_wasm_unbox_float"] = Module["asm"]["Jb"]).apply(null, arguments)
};
var _mono_wasm_array_length = Module["_mono_wasm_array_length"] = function() {
    return (_mono_wasm_array_length = Module["_mono_wasm_array_length"] = Module["asm"]["Kb"]).apply(null, arguments)
};
var _mono_wasm_array_get = Module["_mono_wasm_array_get"] = function() {
    return (_mono_wasm_array_get = Module["_mono_wasm_array_get"] = Module["asm"]["Lb"]).apply(null, arguments)
};
var _mono_wasm_obj_array_new = Module["_mono_wasm_obj_array_new"] = function() {
    return (_mono_wasm_obj_array_new = Module["_mono_wasm_obj_array_new"] = Module["asm"]["Mb"]).apply(null, arguments)
};
var _mono_wasm_obj_array_set = Module["_mono_wasm_obj_array_set"] = function() {
    return (_mono_wasm_obj_array_set = Module["_mono_wasm_obj_array_set"] = Module["asm"]["Nb"]).apply(null, arguments)
};
var _mono_wasm_string_array_new = Module["_mono_wasm_string_array_new"] = function() {
    return (_mono_wasm_string_array_new = Module["_mono_wasm_string_array_new"] = Module["asm"]["Ob"]).apply(null, arguments)
};
var _mono_wasm_exec_regression = Module["_mono_wasm_exec_regression"] = function() {
    return (_mono_wasm_exec_regression = Module["_mono_wasm_exec_regression"] = Module["asm"]["Pb"]).apply(null, arguments)
};
var _mono_wasm_exit = Module["_mono_wasm_exit"] = function() {
    return (_mono_wasm_exit = Module["_mono_wasm_exit"] = Module["asm"]["Qb"]).apply(null, arguments)
};
var _mono_wasm_set_main_args = Module["_mono_wasm_set_main_args"] = function() {
    return (_mono_wasm_set_main_args = Module["_mono_wasm_set_main_args"] = Module["asm"]["Rb"]).apply(null, arguments)
};
var _mono_wasm_strdup = Module["_mono_wasm_strdup"] = function() {
    return (_mono_wasm_strdup = Module["_mono_wasm_strdup"] = Module["asm"]["Sb"]).apply(null, arguments)
};
var _mono_wasm_parse_runtime_options = Module["_mono_wasm_parse_runtime_options"] = function() {
    return (_mono_wasm_parse_runtime_options = Module["_mono_wasm_parse_runtime_options"] = Module["asm"]["Tb"]).apply(null, arguments)
};
var _mono_wasm_enable_on_demand_gc = Module["_mono_wasm_enable_on_demand_gc"] = function() {
    return (_mono_wasm_enable_on_demand_gc = Module["_mono_wasm_enable_on_demand_gc"] = Module["asm"]["Ub"]).apply(null, arguments)
};
var _free = Module["_free"] = function() {
    return (_free = Module["_free"] = Module["asm"]["Vb"]).apply(null, arguments)
};
var _mono_wasm_typed_array_new = Module["_mono_wasm_typed_array_new"] = function() {
    return (_mono_wasm_typed_array_new = Module["_mono_wasm_typed_array_new"] = Module["asm"]["Wb"]).apply(null, arguments)
};
var _mono_wasm_unbox_enum = Module["_mono_wasm_unbox_enum"] = function() {
    return (_mono_wasm_unbox_enum = Module["_mono_wasm_unbox_enum"] = Module["asm"]["Xb"]).apply(null, arguments)
};
var _malloc = Module["_malloc"] = function() {
    return (_malloc = Module["_malloc"] = Module["asm"]["Yb"]).apply(null, arguments)
};
var _memset = Module["_memset"] = function() {
    return (_memset = Module["_memset"] = Module["asm"]["Zb"]).apply(null, arguments)
};
var ___errno_location = Module["___errno_location"] = function() {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["_b"]).apply(null, arguments)
};
var _mono_print_method_from_ip = Module["_mono_print_method_from_ip"] = function() {
    return (_mono_print_method_from_ip = Module["_mono_print_method_from_ip"] = Module["asm"]["$b"]).apply(null, arguments)
};
var _putchar = Module["_putchar"] = function() {
    return (_putchar = Module["_putchar"] = Module["asm"]["ac"]).apply(null, arguments)
};
var _mono_wasm_setup_single_step = Module["_mono_wasm_setup_single_step"] = function() {
    return (_mono_wasm_setup_single_step = Module["_mono_wasm_setup_single_step"] = Module["asm"]["bc"]).apply(null, arguments)
};
var _mono_wasm_clear_all_breakpoints = Module["_mono_wasm_clear_all_breakpoints"] = function() {
    return (_mono_wasm_clear_all_breakpoints = Module["_mono_wasm_clear_all_breakpoints"] = Module["asm"]["cc"]).apply(null, arguments)
};
var _mono_wasm_set_breakpoint = Module["_mono_wasm_set_breakpoint"] = function() {
    return (_mono_wasm_set_breakpoint = Module["_mono_wasm_set_breakpoint"] = Module["asm"]["dc"]).apply(null, arguments)
};
var _mono_wasm_remove_breakpoint = Module["_mono_wasm_remove_breakpoint"] = function() {
    return (_mono_wasm_remove_breakpoint = Module["_mono_wasm_remove_breakpoint"] = Module["asm"]["ec"]).apply(null, arguments)
};
var _mono_wasm_current_bp_id = Module["_mono_wasm_current_bp_id"] = function() {
    return (_mono_wasm_current_bp_id = Module["_mono_wasm_current_bp_id"] = Module["asm"]["fc"]).apply(null, arguments)
};
var _mono_wasm_enum_frames = Module["_mono_wasm_enum_frames"] = function() {
    return (_mono_wasm_enum_frames = Module["_mono_wasm_enum_frames"] = Module["asm"]["gc"]).apply(null, arguments)
};
var _mono_wasm_get_var_info = Module["_mono_wasm_get_var_info"] = function() {
    return (_mono_wasm_get_var_info = Module["_mono_wasm_get_var_info"] = Module["asm"]["hc"]).apply(null, arguments)
};
var _mono_wasm_get_object_properties = Module["_mono_wasm_get_object_properties"] = function() {
    return (_mono_wasm_get_object_properties = Module["_mono_wasm_get_object_properties"] = Module["asm"]["ic"]).apply(null, arguments)
};
var _mono_wasm_get_array_values = Module["_mono_wasm_get_array_values"] = function() {
    return (_mono_wasm_get_array_values = Module["_mono_wasm_get_array_values"] = Module["asm"]["jc"]).apply(null, arguments)
};
var _mono_wasm_get_array_value_expanded = Module["_mono_wasm_get_array_value_expanded"] = function() {
    return (_mono_wasm_get_array_value_expanded = Module["_mono_wasm_get_array_value_expanded"] = Module["asm"]["kc"]).apply(null, arguments)
};
var _mono_set_timeout_exec = Module["_mono_set_timeout_exec"] = function() {
    return (_mono_set_timeout_exec = Module["_mono_set_timeout_exec"] = Module["asm"]["lc"]).apply(null, arguments)
};
var _htonl = Module["_htonl"] = function() {
    return (_htonl = Module["_htonl"] = Module["asm"]["mc"]).apply(null, arguments)
};
var _htons = Module["_htons"] = function() {
    return (_htons = Module["_htons"] = Module["asm"]["nc"]).apply(null, arguments)
};
var _ntohs = Module["_ntohs"] = function() {
    return (_ntohs = Module["_ntohs"] = Module["asm"]["oc"]).apply(null, arguments)
};
var _mono_background_exec = Module["_mono_background_exec"] = function() {
    return (_mono_background_exec = Module["_mono_background_exec"] = Module["asm"]["pc"]).apply(null, arguments)
};
var __get_tzname = Module["__get_tzname"] = function() {
    return (__get_tzname = Module["__get_tzname"] = Module["asm"]["qc"]).apply(null, arguments)
};
var __get_daylight = Module["__get_daylight"] = function() {
    return (__get_daylight = Module["__get_daylight"] = Module["asm"]["rc"]).apply(null, arguments)
};
var __get_timezone = Module["__get_timezone"] = function() {
    return (__get_timezone = Module["__get_timezone"] = Module["asm"]["sc"]).apply(null, arguments)
};
var _setThrew = Module["_setThrew"] = function() {
    return (_setThrew = Module["_setThrew"] = Module["asm"]["tc"]).apply(null, arguments)
};
var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function() {
    return (__ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = Module["asm"]["uc"]).apply(null, arguments)
};
var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {
    return (___cxa_can_catch = Module["___cxa_can_catch"] = Module["asm"]["vc"]).apply(null, arguments)
};
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
    return (___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = Module["asm"]["wc"]).apply(null, arguments)
};
var _memalign = Module["_memalign"] = function() {
    return (_memalign = Module["_memalign"] = Module["asm"]["xc"]).apply(null, arguments)
};
var dynCall_vi = Module["dynCall_vi"] = function() {
    return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["yc"]).apply(null, arguments)
};
var stackSave = Module["stackSave"] = function() {
    return (stackSave = Module["stackSave"] = Module["asm"]["zc"]).apply(null, arguments)
};
var stackAlloc = Module["stackAlloc"] = function() {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["Ac"]).apply(null, arguments)
};
var stackRestore = Module["stackRestore"] = function() {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["Bc"]).apply(null, arguments)
};
var dynCall_v = Module["dynCall_v"] = function() {
    return (dynCall_v = Module["dynCall_v"] = Module["asm"]["Cc"]).apply(null, arguments)
};
var dynCall_ii = Module["dynCall_ii"] = function() {
    return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["Dc"]).apply(null, arguments)
};

function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        dynCall_vi(index, a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
Module["asm"] = asm;
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["setValue"] = setValue;
Module["getValue"] = getValue;
Module["getMemory"] = getMemory;
Module["UTF8ToString"] = UTF8ToString;
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
Module["addFunction"] = addFunction;
var calledRun;

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
};

function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) return;

    function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
Module["run"] = run;

function exit(status, implicit) {
    if (implicit && noExitRuntime && status === 0) {
        return
    }
    if (noExitRuntime) {} else {
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status)
    }
    quit_(status, new ExitStatus(status))
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
noExitRuntime = true;
run();

// SIG // Begin signature block
// SIG // MIIjhwYJKoZIhvcNAQcCoIIjeDCCI3QCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // HCTNN43eQWmaF/gqMyJh7nO8MJegcAib+J/lpU0Z8jmg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAAAYivUta5km3o+QAA
// SIG // AAABiDANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTIwMDMwNDE4Mzk0OFoX
// SIG // DTIxMDMwMzE4Mzk0OFowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // kgja8hPgnsMtpuLf2u+MGewvWE8L9T8guAbzP5EljzbP
// SIG // J9EU3vhb2H1PhPbn9Le52JQMx4yvqZYn9gYQ/jYHYSFE
// SIG // PLFcFjt/bY70ER4z9v/70ryH5ppEaDC9SIZ47PZEImUM
// SIG // 2EQ2GEafcUkGJkcEI5OYZfP1O0YDokA4rVR2lOwU9TCP
// SIG // dpX2UbiCAw2AXb17W3JWCTFTsKmbb9Dvc0Aq3rekfn0U
// SIG // hmgzXxBKXCCy/g+0VdzOLmiROE2uigDnb1fjFWiadWFx
// SIG // U2TyraYxzunfaR0D2YhuzXQukG50RprGuPLjUK2+gH5i
// SIG // ygyNS6d9VjKIE2l+bWX/gmU/T0rr4zgizQIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFI/USS/czaz3C9dEWXTECF2T
// SIG // ezBvMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis0NTgzODYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQAp16PIY6exXk/h+okJVdwnBp5Emxby
// SIG // KSmGn4M2AhaN1B2NVR2CVW+YxxDvKBtukKgRC5mpOjEy
// SIG // Pq2t1ijExoRNbBCJaME3KeCALPGucKQoelX+Gf2wLSKa
// SIG // T96d4F5Nl/FF03PlsY0GLA5BYks6PzgWuYZHVtYOBKTu
// SIG // N5fZo06AXahD7SF7Gex4tf+suICtD5jIsBvCzKUp9J/6
// SIG // Ehxo61DQYByT8YLOt0pX+fEBgc57l4kWl5n01A3a74Ua
// SIG // HHcSDIvJ10MFgAjIkMyUkcwT+UtsFKu5zAKo2k23l4Sa
// SIG // g9khVR3VGJSq7r7T0sG56kkVkxiPLOBRF7fky98OSZ8F
// SIG // WZmZFBaIqEAzDIxcmirq3SeqZ8269YekFtEfe31nPMRC
// SIG // MyyDolNq48FgLZUKhTvCjYspI2BshH+S8gCSgDvqyXfX
// SIG // 7GEflQWriBEKGJo51G01zEmNi3+SjJblpQzhlYfKul45
// SIG // gXHKWk/vLQn8aWlWD4tZ3J8E8Gj0L1avEY1g0Qez2vK7
// SIG // h4I9hyRYuvfoXKu5lseZ01Lc8xWu0UmXxOWtWuQLgZhj
// SIG // Ua+3/HDX2tNfrYlo1SpNWvoCVAUj9LCMXnBW1Ul02e26
// SIG // nmpeOV0gyIrGQZFm/vN0213UxjA0lBSkwHbQvq9+Rn7D
// SIG // fEFcufR2+WWMwF3M4YEZpOzchOow9GJuUyoluTCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghVaMIIVVgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAABiK9S1rmSbej5AAAAAAGIMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAIGsiGSImI24Wd
// SIG // JPrk/cBbcY3F4ZWlc6730h1wNOLxATBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBADK3F5a2EawxrCbBSmm3+On9cj49PR+i
// SIG // OIfcUvHpR9L+cKJlRI2mB98wmbB+S68ZfiWdoSLDpaEX
// SIG // AEin1dlw2iojJX2ope7IeE44gNEbHJzpO2aLCcS+WvCD
// SIG // O5cUZvCV3sgqB5ytWKSRTXFf4qJSzheiwLeA4T5Bi7XQ
// SIG // 8/w4wX9DwAdX9ORtU7MBb23RTxezWd0+RkAxzK7gYVwl
// SIG // ljJXZ7PWaLgDtPFtgcCy1u+wICTOwXbol78D4Q8tiXxr
// SIG // gQHDdXByGTb+N2TiBGorZ8PgtyL+OE0qjil/gvrhcUE4
// SIG // LlG/kxZWmmcKciAsTBMuRlGx/O0OX1+OHcEEAr93mYA0
// SIG // 492hghLkMIIS4AYKKwYBBAGCNwMDATGCEtAwghLMBgkq
// SIG // hkiG9w0BBwKgghK9MIISuQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBUAYLKoZIhvcNAQkQAQSgggE/BIIBOzCCATcC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 7bWQBHGFJWa+WApIzc89LWjeCAuLW1j9dAg/3Es3L2UC
// SIG // Bl6jETOIuBgSMjAyMDA1MTExNjAzNTguMTFaMASAAgH0
// SIG // oIHQpIHNMIHKMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYD
// SIG // VQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25z
// SIG // MSYwJAYDVQQLEx1UaGFsZXMgVFNTIEVTTjpEMkNELUUz
// SIG // MTAtNEFGMTElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgU2VydmljZaCCDjwwggTxMIID2aADAgECAhMz
// SIG // AAABIhuPACYlzLHnAAAAAAEiMA0GCSqGSIb3DQEBCwUA
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMB4XDTE5
// SIG // MTExMzIxNDA0M1oXDTIxMDIxMTIxNDA0M1owgcoxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29m
// SIG // dCBBbWVyaWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRo
// SIG // YWxlcyBUU1MgRVNOOkQyQ0QtRTMxMC00QUYxMSUwIwYD
// SIG // VQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNl
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // 3xUDSGJBPsFy3A9lH5NrOJFClIU0Pefkf0Og1IXbjhnS
// SIG // ybEioaHFNSpfC9cxKpP5NZPuaFQogaeS/RTu8nEoe+/Q
// SIG // fkPE3ohESzPp2zHbAMVAmz40dLEOt5CUxaQ4Af+BzqXi
// SIG // 1CzD0OohJdI3xLNrqnbf4FiKuCsitGV6D/zqOku84Vs+
// SIG // Ao3M5O4EtIpQH0re8QeZRIUISwrZKfa8zugiqjC1ubo2
// SIG // FcoZhXH63ce+P2OhNhrPbtWDpPCrZ+GOHFv9hNnvuAXj
// SIG // LPQEvtF1m5PzWGNsYjx42apc6FWRChpXTidPT/pCIf45
// SIG // 7ad06aq9jU3g7fTo09alGNcsyXXUdKXCyQIDAQABo4IB
// SIG // GzCCARcwHQYDVR0OBBYEFI42PVVqa8Avcdg44+E0vZ0X
// SIG // M7fIMB8GA1UdIwQYMBaAFNVjOlyKMZDzQ3t8RhvFM2ha
// SIG // hW1VMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9jcmwu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01p
// SIG // Y1RpbVN0YVBDQV8yMDEwLTA3LTAxLmNybDBaBggrBgEF
// SIG // BQcBAQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6Ly93d3cu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljVGltU3Rh
// SIG // UENBXzIwMTAtMDctMDEuY3J0MAwGA1UdEwEB/wQCMAAw
// SIG // EwYDVR0lBAwwCgYIKwYBBQUHAwgwDQYJKoZIhvcNAQEL
// SIG // BQADggEBAIukR27DIv8GtoNyflU7nIScojWdH2Zalroo
// SIG // TiTrsTefULwneuh6dqQWkQheI38fsG6xhHjnSeZbk2SF
// SIG // A/PISaH+EO0N+2V+/LJ2zHf4Ia9e+2dW3+7d8kTNnEN7
// SIG // x+o9tI1rZWnKFnhvwkbAl9FR8v+aPqicW/0n1QuVgfmm
// SIG // QXBf4+3Hcx5bOwjHE6cw2qJ9vquSdJgfm1fyO5Bsi8eJ
// SIG // CEDoL6MdcXl8sMbRToFXnwQimBy+fYS6EGbDlMK/JPJH
// SIG // fz/MFnJGg07lrf7kauNcM2MP53dwAs30x1Reg2PakBUF
// SIG // RBidEQOHBLOhCF/eLDf86VU51BvtDz3VwXIASlJIytsw
// SIG // ggZxMIIEWaADAgECAgphCYEqAAAAAAACMA0GCSqGSIb3
// SIG // DQEBCwUAMIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYD
// SIG // VQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBB
// SIG // dXRob3JpdHkgMjAxMDAeFw0xMDA3MDEyMTM2NTVaFw0y
// SIG // NTA3MDEyMTQ2NTVaMHwxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // JjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBD
// SIG // QSAyMDEwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
// SIG // CgKCAQEAqR0NvHcRijog7PwTl/X6f2mUa3RUENWlCgCC
// SIG // hfvtfGhLLF/Fw+Vhwna3PmYrW/AVUycEMR9BGxqVHc4J
// SIG // E458YTBZsTBED/FgiIRUQwzXTbg4CLNC3ZOs1nMwVyaC
// SIG // o0UN0Or1R4HNvyRgMlhgRvJYR4YyhB50YWeRX4FUsc+T
// SIG // TJLBxKZd0WETbijGGvmGgLvfYfxGwScdJGcSchohiq9L
// SIG // ZIlQYrFd/XcfPfBXday9ikJNQFHRD5wGPmd/9WbAA5ZE
// SIG // fu/QS/1u5ZrKsajyeioKMfDaTgaRtogINeh4HLDpmc08
// SIG // 5y9Euqf03GS9pAHBIAmTeM38vMDJRF1eFpwBBU8iTQID
// SIG // AQABo4IB5jCCAeIwEAYJKwYBBAGCNxUBBAMCAQAwHQYD
// SIG // VR0OBBYEFNVjOlyKMZDzQ3t8RhvFM2hahW1VMBkGCSsG
// SIG // AQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1UdDwQEAwIB
// SIG // hjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQYMBaAFNX2
// SIG // VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRPME0wS6BJ
// SIG // oEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8yMDEwLTA2
// SIG // LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYIKwYBBQUH
// SIG // MAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kv
// SIG // Y2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3J0
// SIG // MIGgBgNVHSABAf8EgZUwgZIwgY8GCSsGAQQBgjcuAzCB
// SIG // gTA9BggrBgEFBQcCARYxaHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL1BLSS9kb2NzL0NQUy9kZWZhdWx0Lmh0bTBA
// SIG // BggrBgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBQAG8A
// SIG // bABpAGMAeQBfAFMAdABhAHQAZQBtAGUAbgB0AC4gHTAN
// SIG // BgkqhkiG9w0BAQsFAAOCAgEAB+aIUQ3ixuCYP4FxAz2d
// SIG // o6Ehb7Prpsz1Mb7PBeKp/vpXbRkws8LFZslq3/Xn8Hi9
// SIG // x6ieJeP5vO1rVFcIK1GCRBL7uVOMzPRgEop2zEBAQZvc
// SIG // XBf/XPleFzWYJFZLdO9CEMivv3/Gf/I3fVo/HPKZeUqR
// SIG // UgCvOA8X9S95gWXZqbVr5MfO9sp6AG9LMEQkIjzP7QOl
// SIG // lo9ZKby2/QThcJ8ySif9Va8v/rbljjO7Yl+a21dA6fHO
// SIG // mWaQjP9qYn/dxUoLkSbiOewZSnFjnXshbcOco6I8+n99
// SIG // lmqQeKZt0uGc+R38ONiU9MalCpaGpL2eGq4EQoO4tYCb
// SIG // IjggtSXlZOz39L9+Y1klD3ouOVd2onGqBooPiRa6YacR
// SIG // y5rYDkeagMXQzafQ732D8OE7cQnfXXSYIghh2rBQHm+9
// SIG // 8eEA3+cxB6STOvdlR3jo+KhIq/fecn5ha293qYHLpwms
// SIG // ObvsxsvYgrRyzR30uIUBHoD7G4kqVDmyW9rIDVWZeodz
// SIG // OwjmmC3qjeAzLhIp9cAvVCch98isTtoouLGp25ayp0Ki
// SIG // yc8ZQU3ghvkqmqMRZjDTu3QyS99je/WZii8bxyGvWbWu
// SIG // 3EQ8l1Bx16HSxVXjad5XwdHeMMD9zOZN+w2/XU/pnR4Z
// SIG // OC+8z1gFLu8NoFA12u8JJxzVs341Hgi62jbb01+P3nSI
// SIG // SRKhggLOMIICNwIBATCB+KGB0KSBzTCByjELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9zb2Z0IEFt
// SIG // ZXJpY2EgT3BlcmF0aW9uczEmMCQGA1UECxMdVGhhbGVz
// SIG // IFRTUyBFU046RDJDRC1FMzEwLTRBRjExJTAjBgNVBAMT
// SIG // HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2WiIwoB
// SIG // ATAHBgUrDgMCGgMVAFDsA/yXG6SlTF6RdlYe+zMlTZvZ
// SIG // oIGDMIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQG
// SIG // A1UEAxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIw
// SIG // MTAwDQYJKoZIhvcNAQEFBQACBQDiY1APMCIYDzIwMjAw
// SIG // NTExMTIxNjE1WhgPMjAyMDA1MTIxMjE2MTVaMHcwPQYK
// SIG // KwYBBAGEWQoEATEvMC0wCgIFAOJjUA8CAQAwCgIBAAIC
// SIG // ILcCAf8wBwIBAAICEd0wCgIFAOJkoY8CAQAwNgYKKwYB
// SIG // BAGEWQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQAC
// SIG // AwehIKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQUFAAOB
// SIG // gQALTtis7D/aur/ttLxw3dfIB4rxxod77Tf4IGBxCbmA
// SIG // iySsnDEkBXfq5HYWP+GxMb4kiX5XmxuBL1vNktx8d6Sa
// SIG // ICHPf3iw7fMLA1FQc0aui6j4KB0BbW9FiBQiImresvrj
// SIG // GJZ9mEpD00/O8e6wh5enKp2W5uy5tymTuLtD5e7LyjGC
// SIG // Aw0wggMJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // JjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBD
// SIG // QSAyMDEwAhMzAAABIhuPACYlzLHnAAAAAAEiMA0GCWCG
// SIG // SAFlAwQCAQUAoIIBSjAaBgkqhkiG9w0BCQMxDQYLKoZI
// SIG // hvcNAQkQAQQwLwYJKoZIhvcNAQkEMSIEIO0KksHSvhjt
// SIG // gFWGLLwV+f7GVYeu4uRDP02VFcO1oCUBMIH6BgsqhkiG
// SIG // 9w0BCRACLzGB6jCB5zCB5DCBvQQgu/BgiV5iMs5qslkp
// SIG // cOW35aMPckN4OL77N+KDUsJ4MQkwgZgwgYCkfjB8MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAASIbjwAm
// SIG // Jcyx5wAAAAABIjAiBCDBDt52HpFYbFKpNbWyH/je60YP
// SIG // HXMSS/A7TdZzDJ4/yTANBgkqhkiG9w0BAQsFAASCAQBL
// SIG // ypoJAYXn2GjM/Gj5nbDMekZ9lotvMbng8uxJ+Mk2P7Za
// SIG // qbJoEcgqlFvZ4dKSTK1gggufYst//h3AxrXZCD/lGn2r
// SIG // awR/8uGCJ2+JTvQEZ+ppy4Io5w5mIxqcWScwQDoo2swJ
// SIG // /FcptKBzE7DcrlmUi13vR7Z/HTX2LstK7ZfbzK3DY2Oa
// SIG // cztRStgfyh9aifFnzbYernim8dkpea9VT+REB4qH2EtR
// SIG // urTk101BcOw9yAXFEsZTPUOsmk29WLNyKeIroukcl2O7
// SIG // DiFPvLO4gg83OxKWPP9wrkgG9asR165UFknwkDNgTDHs
// SIG // QV4o4uTHZZCmqj2pw5wO/WBNWMvil2dR
// SIG // End signature block