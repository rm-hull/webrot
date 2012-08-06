var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__29365 = x == null ? null : x;
  if(p[goog.typeOf(x__29365)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__29366__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__29366 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__29366__delegate.call(this, array, i, idxs)
    };
    G__29366.cljs$lang$maxFixedArity = 2;
    G__29366.cljs$lang$applyTo = function(arglist__29367) {
      var array = cljs.core.first(arglist__29367);
      var i = cljs.core.first(cljs.core.next(arglist__29367));
      var idxs = cljs.core.rest(cljs.core.next(arglist__29367));
      return G__29366__delegate(array, i, idxs)
    };
    G__29366.cljs$lang$arity$variadic = G__29366__delegate;
    return G__29366
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____29452 = this$;
      if(and__3822__auto____29452) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____29452
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__6694__auto____29453 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29454 = cljs.core._invoke[goog.typeOf(x__6694__auto____29453)];
        if(or__3824__auto____29454) {
          return or__3824__auto____29454
        }else {
          var or__3824__auto____29455 = cljs.core._invoke["_"];
          if(or__3824__auto____29455) {
            return or__3824__auto____29455
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____29456 = this$;
      if(and__3822__auto____29456) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____29456
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__6694__auto____29457 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29458 = cljs.core._invoke[goog.typeOf(x__6694__auto____29457)];
        if(or__3824__auto____29458) {
          return or__3824__auto____29458
        }else {
          var or__3824__auto____29459 = cljs.core._invoke["_"];
          if(or__3824__auto____29459) {
            return or__3824__auto____29459
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____29460 = this$;
      if(and__3822__auto____29460) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____29460
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__6694__auto____29461 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29462 = cljs.core._invoke[goog.typeOf(x__6694__auto____29461)];
        if(or__3824__auto____29462) {
          return or__3824__auto____29462
        }else {
          var or__3824__auto____29463 = cljs.core._invoke["_"];
          if(or__3824__auto____29463) {
            return or__3824__auto____29463
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____29464 = this$;
      if(and__3822__auto____29464) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____29464
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__6694__auto____29465 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29466 = cljs.core._invoke[goog.typeOf(x__6694__auto____29465)];
        if(or__3824__auto____29466) {
          return or__3824__auto____29466
        }else {
          var or__3824__auto____29467 = cljs.core._invoke["_"];
          if(or__3824__auto____29467) {
            return or__3824__auto____29467
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____29468 = this$;
      if(and__3822__auto____29468) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____29468
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__6694__auto____29469 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29470 = cljs.core._invoke[goog.typeOf(x__6694__auto____29469)];
        if(or__3824__auto____29470) {
          return or__3824__auto____29470
        }else {
          var or__3824__auto____29471 = cljs.core._invoke["_"];
          if(or__3824__auto____29471) {
            return or__3824__auto____29471
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____29472 = this$;
      if(and__3822__auto____29472) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____29472
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__6694__auto____29473 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29474 = cljs.core._invoke[goog.typeOf(x__6694__auto____29473)];
        if(or__3824__auto____29474) {
          return or__3824__auto____29474
        }else {
          var or__3824__auto____29475 = cljs.core._invoke["_"];
          if(or__3824__auto____29475) {
            return or__3824__auto____29475
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____29476 = this$;
      if(and__3822__auto____29476) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____29476
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__6694__auto____29477 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29478 = cljs.core._invoke[goog.typeOf(x__6694__auto____29477)];
        if(or__3824__auto____29478) {
          return or__3824__auto____29478
        }else {
          var or__3824__auto____29479 = cljs.core._invoke["_"];
          if(or__3824__auto____29479) {
            return or__3824__auto____29479
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____29480 = this$;
      if(and__3822__auto____29480) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____29480
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__6694__auto____29481 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29482 = cljs.core._invoke[goog.typeOf(x__6694__auto____29481)];
        if(or__3824__auto____29482) {
          return or__3824__auto____29482
        }else {
          var or__3824__auto____29483 = cljs.core._invoke["_"];
          if(or__3824__auto____29483) {
            return or__3824__auto____29483
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____29484 = this$;
      if(and__3822__auto____29484) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____29484
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__6694__auto____29485 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29486 = cljs.core._invoke[goog.typeOf(x__6694__auto____29485)];
        if(or__3824__auto____29486) {
          return or__3824__auto____29486
        }else {
          var or__3824__auto____29487 = cljs.core._invoke["_"];
          if(or__3824__auto____29487) {
            return or__3824__auto____29487
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____29488 = this$;
      if(and__3822__auto____29488) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____29488
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__6694__auto____29489 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29490 = cljs.core._invoke[goog.typeOf(x__6694__auto____29489)];
        if(or__3824__auto____29490) {
          return or__3824__auto____29490
        }else {
          var or__3824__auto____29491 = cljs.core._invoke["_"];
          if(or__3824__auto____29491) {
            return or__3824__auto____29491
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____29492 = this$;
      if(and__3822__auto____29492) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____29492
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__6694__auto____29493 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29494 = cljs.core._invoke[goog.typeOf(x__6694__auto____29493)];
        if(or__3824__auto____29494) {
          return or__3824__auto____29494
        }else {
          var or__3824__auto____29495 = cljs.core._invoke["_"];
          if(or__3824__auto____29495) {
            return or__3824__auto____29495
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____29496 = this$;
      if(and__3822__auto____29496) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____29496
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__6694__auto____29497 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29498 = cljs.core._invoke[goog.typeOf(x__6694__auto____29497)];
        if(or__3824__auto____29498) {
          return or__3824__auto____29498
        }else {
          var or__3824__auto____29499 = cljs.core._invoke["_"];
          if(or__3824__auto____29499) {
            return or__3824__auto____29499
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____29500 = this$;
      if(and__3822__auto____29500) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____29500
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__6694__auto____29501 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29502 = cljs.core._invoke[goog.typeOf(x__6694__auto____29501)];
        if(or__3824__auto____29502) {
          return or__3824__auto____29502
        }else {
          var or__3824__auto____29503 = cljs.core._invoke["_"];
          if(or__3824__auto____29503) {
            return or__3824__auto____29503
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____29504 = this$;
      if(and__3822__auto____29504) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____29504
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__6694__auto____29505 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29506 = cljs.core._invoke[goog.typeOf(x__6694__auto____29505)];
        if(or__3824__auto____29506) {
          return or__3824__auto____29506
        }else {
          var or__3824__auto____29507 = cljs.core._invoke["_"];
          if(or__3824__auto____29507) {
            return or__3824__auto____29507
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____29508 = this$;
      if(and__3822__auto____29508) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____29508
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__6694__auto____29509 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29510 = cljs.core._invoke[goog.typeOf(x__6694__auto____29509)];
        if(or__3824__auto____29510) {
          return or__3824__auto____29510
        }else {
          var or__3824__auto____29511 = cljs.core._invoke["_"];
          if(or__3824__auto____29511) {
            return or__3824__auto____29511
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____29512 = this$;
      if(and__3822__auto____29512) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____29512
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__6694__auto____29513 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29514 = cljs.core._invoke[goog.typeOf(x__6694__auto____29513)];
        if(or__3824__auto____29514) {
          return or__3824__auto____29514
        }else {
          var or__3824__auto____29515 = cljs.core._invoke["_"];
          if(or__3824__auto____29515) {
            return or__3824__auto____29515
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____29516 = this$;
      if(and__3822__auto____29516) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____29516
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__6694__auto____29517 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29518 = cljs.core._invoke[goog.typeOf(x__6694__auto____29517)];
        if(or__3824__auto____29518) {
          return or__3824__auto____29518
        }else {
          var or__3824__auto____29519 = cljs.core._invoke["_"];
          if(or__3824__auto____29519) {
            return or__3824__auto____29519
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____29520 = this$;
      if(and__3822__auto____29520) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____29520
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__6694__auto____29521 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29522 = cljs.core._invoke[goog.typeOf(x__6694__auto____29521)];
        if(or__3824__auto____29522) {
          return or__3824__auto____29522
        }else {
          var or__3824__auto____29523 = cljs.core._invoke["_"];
          if(or__3824__auto____29523) {
            return or__3824__auto____29523
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____29524 = this$;
      if(and__3822__auto____29524) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____29524
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__6694__auto____29525 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29526 = cljs.core._invoke[goog.typeOf(x__6694__auto____29525)];
        if(or__3824__auto____29526) {
          return or__3824__auto____29526
        }else {
          var or__3824__auto____29527 = cljs.core._invoke["_"];
          if(or__3824__auto____29527) {
            return or__3824__auto____29527
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____29528 = this$;
      if(and__3822__auto____29528) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____29528
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__6694__auto____29529 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29530 = cljs.core._invoke[goog.typeOf(x__6694__auto____29529)];
        if(or__3824__auto____29530) {
          return or__3824__auto____29530
        }else {
          var or__3824__auto____29531 = cljs.core._invoke["_"];
          if(or__3824__auto____29531) {
            return or__3824__auto____29531
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____29532 = this$;
      if(and__3822__auto____29532) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____29532
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__6694__auto____29533 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____29534 = cljs.core._invoke[goog.typeOf(x__6694__auto____29533)];
        if(or__3824__auto____29534) {
          return or__3824__auto____29534
        }else {
          var or__3824__auto____29535 = cljs.core._invoke["_"];
          if(or__3824__auto____29535) {
            return or__3824__auto____29535
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____29540 = coll;
    if(and__3822__auto____29540) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____29540
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__6694__auto____29541 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29542 = cljs.core._count[goog.typeOf(x__6694__auto____29541)];
      if(or__3824__auto____29542) {
        return or__3824__auto____29542
      }else {
        var or__3824__auto____29543 = cljs.core._count["_"];
        if(or__3824__auto____29543) {
          return or__3824__auto____29543
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____29548 = coll;
    if(and__3822__auto____29548) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____29548
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__6694__auto____29549 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29550 = cljs.core._empty[goog.typeOf(x__6694__auto____29549)];
      if(or__3824__auto____29550) {
        return or__3824__auto____29550
      }else {
        var or__3824__auto____29551 = cljs.core._empty["_"];
        if(or__3824__auto____29551) {
          return or__3824__auto____29551
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____29556 = coll;
    if(and__3822__auto____29556) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____29556
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__6694__auto____29557 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29558 = cljs.core._conj[goog.typeOf(x__6694__auto____29557)];
      if(or__3824__auto____29558) {
        return or__3824__auto____29558
      }else {
        var or__3824__auto____29559 = cljs.core._conj["_"];
        if(or__3824__auto____29559) {
          return or__3824__auto____29559
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____29568 = coll;
      if(and__3822__auto____29568) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____29568
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__6694__auto____29569 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____29570 = cljs.core._nth[goog.typeOf(x__6694__auto____29569)];
        if(or__3824__auto____29570) {
          return or__3824__auto____29570
        }else {
          var or__3824__auto____29571 = cljs.core._nth["_"];
          if(or__3824__auto____29571) {
            return or__3824__auto____29571
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____29572 = coll;
      if(and__3822__auto____29572) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____29572
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__6694__auto____29573 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____29574 = cljs.core._nth[goog.typeOf(x__6694__auto____29573)];
        if(or__3824__auto____29574) {
          return or__3824__auto____29574
        }else {
          var or__3824__auto____29575 = cljs.core._nth["_"];
          if(or__3824__auto____29575) {
            return or__3824__auto____29575
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____29580 = coll;
    if(and__3822__auto____29580) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____29580
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__6694__auto____29581 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29582 = cljs.core._first[goog.typeOf(x__6694__auto____29581)];
      if(or__3824__auto____29582) {
        return or__3824__auto____29582
      }else {
        var or__3824__auto____29583 = cljs.core._first["_"];
        if(or__3824__auto____29583) {
          return or__3824__auto____29583
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____29588 = coll;
    if(and__3822__auto____29588) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____29588
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__6694__auto____29589 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29590 = cljs.core._rest[goog.typeOf(x__6694__auto____29589)];
      if(or__3824__auto____29590) {
        return or__3824__auto____29590
      }else {
        var or__3824__auto____29591 = cljs.core._rest["_"];
        if(or__3824__auto____29591) {
          return or__3824__auto____29591
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____29596 = coll;
    if(and__3822__auto____29596) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____29596
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__6694__auto____29597 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29598 = cljs.core._next[goog.typeOf(x__6694__auto____29597)];
      if(or__3824__auto____29598) {
        return or__3824__auto____29598
      }else {
        var or__3824__auto____29599 = cljs.core._next["_"];
        if(or__3824__auto____29599) {
          return or__3824__auto____29599
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____29608 = o;
      if(and__3822__auto____29608) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____29608
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__6694__auto____29609 = o == null ? null : o;
      return function() {
        var or__3824__auto____29610 = cljs.core._lookup[goog.typeOf(x__6694__auto____29609)];
        if(or__3824__auto____29610) {
          return or__3824__auto____29610
        }else {
          var or__3824__auto____29611 = cljs.core._lookup["_"];
          if(or__3824__auto____29611) {
            return or__3824__auto____29611
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____29612 = o;
      if(and__3822__auto____29612) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____29612
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__6694__auto____29613 = o == null ? null : o;
      return function() {
        var or__3824__auto____29614 = cljs.core._lookup[goog.typeOf(x__6694__auto____29613)];
        if(or__3824__auto____29614) {
          return or__3824__auto____29614
        }else {
          var or__3824__auto____29615 = cljs.core._lookup["_"];
          if(or__3824__auto____29615) {
            return or__3824__auto____29615
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____29620 = coll;
    if(and__3822__auto____29620) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____29620
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__6694__auto____29621 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29622 = cljs.core._contains_key_QMARK_[goog.typeOf(x__6694__auto____29621)];
      if(or__3824__auto____29622) {
        return or__3824__auto____29622
      }else {
        var or__3824__auto____29623 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____29623) {
          return or__3824__auto____29623
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____29628 = coll;
    if(and__3822__auto____29628) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____29628
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__6694__auto____29629 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29630 = cljs.core._assoc[goog.typeOf(x__6694__auto____29629)];
      if(or__3824__auto____29630) {
        return or__3824__auto____29630
      }else {
        var or__3824__auto____29631 = cljs.core._assoc["_"];
        if(or__3824__auto____29631) {
          return or__3824__auto____29631
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____29636 = coll;
    if(and__3822__auto____29636) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____29636
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__6694__auto____29637 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29638 = cljs.core._dissoc[goog.typeOf(x__6694__auto____29637)];
      if(or__3824__auto____29638) {
        return or__3824__auto____29638
      }else {
        var or__3824__auto____29639 = cljs.core._dissoc["_"];
        if(or__3824__auto____29639) {
          return or__3824__auto____29639
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____29644 = coll;
    if(and__3822__auto____29644) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____29644
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__6694__auto____29645 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29646 = cljs.core._key[goog.typeOf(x__6694__auto____29645)];
      if(or__3824__auto____29646) {
        return or__3824__auto____29646
      }else {
        var or__3824__auto____29647 = cljs.core._key["_"];
        if(or__3824__auto____29647) {
          return or__3824__auto____29647
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____29652 = coll;
    if(and__3822__auto____29652) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____29652
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__6694__auto____29653 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29654 = cljs.core._val[goog.typeOf(x__6694__auto____29653)];
      if(or__3824__auto____29654) {
        return or__3824__auto____29654
      }else {
        var or__3824__auto____29655 = cljs.core._val["_"];
        if(or__3824__auto____29655) {
          return or__3824__auto____29655
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____29660 = coll;
    if(and__3822__auto____29660) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____29660
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__6694__auto____29661 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29662 = cljs.core._disjoin[goog.typeOf(x__6694__auto____29661)];
      if(or__3824__auto____29662) {
        return or__3824__auto____29662
      }else {
        var or__3824__auto____29663 = cljs.core._disjoin["_"];
        if(or__3824__auto____29663) {
          return or__3824__auto____29663
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____29668 = coll;
    if(and__3822__auto____29668) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____29668
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__6694__auto____29669 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29670 = cljs.core._peek[goog.typeOf(x__6694__auto____29669)];
      if(or__3824__auto____29670) {
        return or__3824__auto____29670
      }else {
        var or__3824__auto____29671 = cljs.core._peek["_"];
        if(or__3824__auto____29671) {
          return or__3824__auto____29671
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____29676 = coll;
    if(and__3822__auto____29676) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____29676
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__6694__auto____29677 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29678 = cljs.core._pop[goog.typeOf(x__6694__auto____29677)];
      if(or__3824__auto____29678) {
        return or__3824__auto____29678
      }else {
        var or__3824__auto____29679 = cljs.core._pop["_"];
        if(or__3824__auto____29679) {
          return or__3824__auto____29679
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____29684 = coll;
    if(and__3822__auto____29684) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____29684
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__6694__auto____29685 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29686 = cljs.core._assoc_n[goog.typeOf(x__6694__auto____29685)];
      if(or__3824__auto____29686) {
        return or__3824__auto____29686
      }else {
        var or__3824__auto____29687 = cljs.core._assoc_n["_"];
        if(or__3824__auto____29687) {
          return or__3824__auto____29687
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____29692 = o;
    if(and__3822__auto____29692) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____29692
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__6694__auto____29693 = o == null ? null : o;
    return function() {
      var or__3824__auto____29694 = cljs.core._deref[goog.typeOf(x__6694__auto____29693)];
      if(or__3824__auto____29694) {
        return or__3824__auto____29694
      }else {
        var or__3824__auto____29695 = cljs.core._deref["_"];
        if(or__3824__auto____29695) {
          return or__3824__auto____29695
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____29700 = o;
    if(and__3822__auto____29700) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____29700
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__6694__auto____29701 = o == null ? null : o;
    return function() {
      var or__3824__auto____29702 = cljs.core._deref_with_timeout[goog.typeOf(x__6694__auto____29701)];
      if(or__3824__auto____29702) {
        return or__3824__auto____29702
      }else {
        var or__3824__auto____29703 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____29703) {
          return or__3824__auto____29703
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____29708 = o;
    if(and__3822__auto____29708) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____29708
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__6694__auto____29709 = o == null ? null : o;
    return function() {
      var or__3824__auto____29710 = cljs.core._meta[goog.typeOf(x__6694__auto____29709)];
      if(or__3824__auto____29710) {
        return or__3824__auto____29710
      }else {
        var or__3824__auto____29711 = cljs.core._meta["_"];
        if(or__3824__auto____29711) {
          return or__3824__auto____29711
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____29716 = o;
    if(and__3822__auto____29716) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____29716
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__6694__auto____29717 = o == null ? null : o;
    return function() {
      var or__3824__auto____29718 = cljs.core._with_meta[goog.typeOf(x__6694__auto____29717)];
      if(or__3824__auto____29718) {
        return or__3824__auto____29718
      }else {
        var or__3824__auto____29719 = cljs.core._with_meta["_"];
        if(or__3824__auto____29719) {
          return or__3824__auto____29719
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____29728 = coll;
      if(and__3822__auto____29728) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____29728
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__6694__auto____29729 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____29730 = cljs.core._reduce[goog.typeOf(x__6694__auto____29729)];
        if(or__3824__auto____29730) {
          return or__3824__auto____29730
        }else {
          var or__3824__auto____29731 = cljs.core._reduce["_"];
          if(or__3824__auto____29731) {
            return or__3824__auto____29731
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____29732 = coll;
      if(and__3822__auto____29732) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____29732
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__6694__auto____29733 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____29734 = cljs.core._reduce[goog.typeOf(x__6694__auto____29733)];
        if(or__3824__auto____29734) {
          return or__3824__auto____29734
        }else {
          var or__3824__auto____29735 = cljs.core._reduce["_"];
          if(or__3824__auto____29735) {
            return or__3824__auto____29735
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____29740 = coll;
    if(and__3822__auto____29740) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____29740
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__6694__auto____29741 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29742 = cljs.core._kv_reduce[goog.typeOf(x__6694__auto____29741)];
      if(or__3824__auto____29742) {
        return or__3824__auto____29742
      }else {
        var or__3824__auto____29743 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____29743) {
          return or__3824__auto____29743
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____29748 = o;
    if(and__3822__auto____29748) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____29748
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__6694__auto____29749 = o == null ? null : o;
    return function() {
      var or__3824__auto____29750 = cljs.core._equiv[goog.typeOf(x__6694__auto____29749)];
      if(or__3824__auto____29750) {
        return or__3824__auto____29750
      }else {
        var or__3824__auto____29751 = cljs.core._equiv["_"];
        if(or__3824__auto____29751) {
          return or__3824__auto____29751
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____29756 = o;
    if(and__3822__auto____29756) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____29756
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__6694__auto____29757 = o == null ? null : o;
    return function() {
      var or__3824__auto____29758 = cljs.core._hash[goog.typeOf(x__6694__auto____29757)];
      if(or__3824__auto____29758) {
        return or__3824__auto____29758
      }else {
        var or__3824__auto____29759 = cljs.core._hash["_"];
        if(or__3824__auto____29759) {
          return or__3824__auto____29759
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____29764 = o;
    if(and__3822__auto____29764) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____29764
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__6694__auto____29765 = o == null ? null : o;
    return function() {
      var or__3824__auto____29766 = cljs.core._seq[goog.typeOf(x__6694__auto____29765)];
      if(or__3824__auto____29766) {
        return or__3824__auto____29766
      }else {
        var or__3824__auto____29767 = cljs.core._seq["_"];
        if(or__3824__auto____29767) {
          return or__3824__auto____29767
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____29772 = coll;
    if(and__3822__auto____29772) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____29772
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__6694__auto____29773 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29774 = cljs.core._rseq[goog.typeOf(x__6694__auto____29773)];
      if(or__3824__auto____29774) {
        return or__3824__auto____29774
      }else {
        var or__3824__auto____29775 = cljs.core._rseq["_"];
        if(or__3824__auto____29775) {
          return or__3824__auto____29775
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____29780 = coll;
    if(and__3822__auto____29780) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____29780
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__6694__auto____29781 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29782 = cljs.core._sorted_seq[goog.typeOf(x__6694__auto____29781)];
      if(or__3824__auto____29782) {
        return or__3824__auto____29782
      }else {
        var or__3824__auto____29783 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____29783) {
          return or__3824__auto____29783
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____29788 = coll;
    if(and__3822__auto____29788) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____29788
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__6694__auto____29789 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29790 = cljs.core._sorted_seq_from[goog.typeOf(x__6694__auto____29789)];
      if(or__3824__auto____29790) {
        return or__3824__auto____29790
      }else {
        var or__3824__auto____29791 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____29791) {
          return or__3824__auto____29791
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____29796 = coll;
    if(and__3822__auto____29796) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____29796
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__6694__auto____29797 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29798 = cljs.core._entry_key[goog.typeOf(x__6694__auto____29797)];
      if(or__3824__auto____29798) {
        return or__3824__auto____29798
      }else {
        var or__3824__auto____29799 = cljs.core._entry_key["_"];
        if(or__3824__auto____29799) {
          return or__3824__auto____29799
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____29804 = coll;
    if(and__3822__auto____29804) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____29804
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__6694__auto____29805 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29806 = cljs.core._comparator[goog.typeOf(x__6694__auto____29805)];
      if(or__3824__auto____29806) {
        return or__3824__auto____29806
      }else {
        var or__3824__auto____29807 = cljs.core._comparator["_"];
        if(or__3824__auto____29807) {
          return or__3824__auto____29807
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____29812 = o;
    if(and__3822__auto____29812) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____29812
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__6694__auto____29813 = o == null ? null : o;
    return function() {
      var or__3824__auto____29814 = cljs.core._pr_seq[goog.typeOf(x__6694__auto____29813)];
      if(or__3824__auto____29814) {
        return or__3824__auto____29814
      }else {
        var or__3824__auto____29815 = cljs.core._pr_seq["_"];
        if(or__3824__auto____29815) {
          return or__3824__auto____29815
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____29820 = d;
    if(and__3822__auto____29820) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____29820
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__6694__auto____29821 = d == null ? null : d;
    return function() {
      var or__3824__auto____29822 = cljs.core._realized_QMARK_[goog.typeOf(x__6694__auto____29821)];
      if(or__3824__auto____29822) {
        return or__3824__auto____29822
      }else {
        var or__3824__auto____29823 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____29823) {
          return or__3824__auto____29823
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____29828 = this$;
    if(and__3822__auto____29828) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____29828
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__6694__auto____29829 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____29830 = cljs.core._notify_watches[goog.typeOf(x__6694__auto____29829)];
      if(or__3824__auto____29830) {
        return or__3824__auto____29830
      }else {
        var or__3824__auto____29831 = cljs.core._notify_watches["_"];
        if(or__3824__auto____29831) {
          return or__3824__auto____29831
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____29836 = this$;
    if(and__3822__auto____29836) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____29836
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__6694__auto____29837 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____29838 = cljs.core._add_watch[goog.typeOf(x__6694__auto____29837)];
      if(or__3824__auto____29838) {
        return or__3824__auto____29838
      }else {
        var or__3824__auto____29839 = cljs.core._add_watch["_"];
        if(or__3824__auto____29839) {
          return or__3824__auto____29839
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____29844 = this$;
    if(and__3822__auto____29844) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____29844
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__6694__auto____29845 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____29846 = cljs.core._remove_watch[goog.typeOf(x__6694__auto____29845)];
      if(or__3824__auto____29846) {
        return or__3824__auto____29846
      }else {
        var or__3824__auto____29847 = cljs.core._remove_watch["_"];
        if(or__3824__auto____29847) {
          return or__3824__auto____29847
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____29852 = coll;
    if(and__3822__auto____29852) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____29852
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__6694__auto____29853 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29854 = cljs.core._as_transient[goog.typeOf(x__6694__auto____29853)];
      if(or__3824__auto____29854) {
        return or__3824__auto____29854
      }else {
        var or__3824__auto____29855 = cljs.core._as_transient["_"];
        if(or__3824__auto____29855) {
          return or__3824__auto____29855
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____29860 = tcoll;
    if(and__3822__auto____29860) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____29860
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__6694__auto____29861 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29862 = cljs.core._conj_BANG_[goog.typeOf(x__6694__auto____29861)];
      if(or__3824__auto____29862) {
        return or__3824__auto____29862
      }else {
        var or__3824__auto____29863 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____29863) {
          return or__3824__auto____29863
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____29868 = tcoll;
    if(and__3822__auto____29868) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____29868
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__6694__auto____29869 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29870 = cljs.core._persistent_BANG_[goog.typeOf(x__6694__auto____29869)];
      if(or__3824__auto____29870) {
        return or__3824__auto____29870
      }else {
        var or__3824__auto____29871 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____29871) {
          return or__3824__auto____29871
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____29876 = tcoll;
    if(and__3822__auto____29876) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____29876
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__6694__auto____29877 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29878 = cljs.core._assoc_BANG_[goog.typeOf(x__6694__auto____29877)];
      if(or__3824__auto____29878) {
        return or__3824__auto____29878
      }else {
        var or__3824__auto____29879 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____29879) {
          return or__3824__auto____29879
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____29884 = tcoll;
    if(and__3822__auto____29884) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____29884
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__6694__auto____29885 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29886 = cljs.core._dissoc_BANG_[goog.typeOf(x__6694__auto____29885)];
      if(or__3824__auto____29886) {
        return or__3824__auto____29886
      }else {
        var or__3824__auto____29887 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____29887) {
          return or__3824__auto____29887
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____29892 = tcoll;
    if(and__3822__auto____29892) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____29892
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__6694__auto____29893 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29894 = cljs.core._assoc_n_BANG_[goog.typeOf(x__6694__auto____29893)];
      if(or__3824__auto____29894) {
        return or__3824__auto____29894
      }else {
        var or__3824__auto____29895 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____29895) {
          return or__3824__auto____29895
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____29900 = tcoll;
    if(and__3822__auto____29900) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____29900
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__6694__auto____29901 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29902 = cljs.core._pop_BANG_[goog.typeOf(x__6694__auto____29901)];
      if(or__3824__auto____29902) {
        return or__3824__auto____29902
      }else {
        var or__3824__auto____29903 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____29903) {
          return or__3824__auto____29903
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____29908 = tcoll;
    if(and__3822__auto____29908) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____29908
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__6694__auto____29909 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____29910 = cljs.core._disjoin_BANG_[goog.typeOf(x__6694__auto____29909)];
      if(or__3824__auto____29910) {
        return or__3824__auto____29910
      }else {
        var or__3824__auto____29911 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____29911) {
          return or__3824__auto____29911
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____29916 = x;
    if(and__3822__auto____29916) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____29916
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__6694__auto____29917 = x == null ? null : x;
    return function() {
      var or__3824__auto____29918 = cljs.core._compare[goog.typeOf(x__6694__auto____29917)];
      if(or__3824__auto____29918) {
        return or__3824__auto____29918
      }else {
        var or__3824__auto____29919 = cljs.core._compare["_"];
        if(or__3824__auto____29919) {
          return or__3824__auto____29919
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____29924 = coll;
    if(and__3822__auto____29924) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____29924
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__6694__auto____29925 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29926 = cljs.core._drop_first[goog.typeOf(x__6694__auto____29925)];
      if(or__3824__auto____29926) {
        return or__3824__auto____29926
      }else {
        var or__3824__auto____29927 = cljs.core._drop_first["_"];
        if(or__3824__auto____29927) {
          return or__3824__auto____29927
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____29932 = coll;
    if(and__3822__auto____29932) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____29932
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__6694__auto____29933 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29934 = cljs.core._chunked_first[goog.typeOf(x__6694__auto____29933)];
      if(or__3824__auto____29934) {
        return or__3824__auto____29934
      }else {
        var or__3824__auto____29935 = cljs.core._chunked_first["_"];
        if(or__3824__auto____29935) {
          return or__3824__auto____29935
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____29940 = coll;
    if(and__3822__auto____29940) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____29940
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__6694__auto____29941 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29942 = cljs.core._chunked_rest[goog.typeOf(x__6694__auto____29941)];
      if(or__3824__auto____29942) {
        return or__3824__auto____29942
      }else {
        var or__3824__auto____29943 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____29943) {
          return or__3824__auto____29943
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____29948 = coll;
    if(and__3822__auto____29948) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____29948
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__6694__auto____29949 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____29950 = cljs.core._chunked_next[goog.typeOf(x__6694__auto____29949)];
      if(or__3824__auto____29950) {
        return or__3824__auto____29950
      }else {
        var or__3824__auto____29951 = cljs.core._chunked_next["_"];
        if(or__3824__auto____29951) {
          return or__3824__auto____29951
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____29953 = x === y;
    if(or__3824__auto____29953) {
      return or__3824__auto____29953
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__29954__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__29955 = y;
            var G__29956 = cljs.core.first.call(null, more);
            var G__29957 = cljs.core.next.call(null, more);
            x = G__29955;
            y = G__29956;
            more = G__29957;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__29954 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__29954__delegate.call(this, x, y, more)
    };
    G__29954.cljs$lang$maxFixedArity = 2;
    G__29954.cljs$lang$applyTo = function(arglist__29958) {
      var x = cljs.core.first(arglist__29958);
      var y = cljs.core.first(cljs.core.next(arglist__29958));
      var more = cljs.core.rest(cljs.core.next(arglist__29958));
      return G__29954__delegate(x, y, more)
    };
    G__29954.cljs$lang$arity$variadic = G__29954__delegate;
    return G__29954
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__29959 = null;
  var G__29959__2 = function(o, k) {
    return null
  };
  var G__29959__3 = function(o, k, not_found) {
    return not_found
  };
  G__29959 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__29959__2.call(this, o, k);
      case 3:
        return G__29959__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__29959
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__29960 = null;
  var G__29960__2 = function(_, f) {
    return f.call(null)
  };
  var G__29960__3 = function(_, f, start) {
    return start
  };
  G__29960 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__29960__2.call(this, _, f);
      case 3:
        return G__29960__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__29960
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__29961 = null;
  var G__29961__2 = function(_, n) {
    return null
  };
  var G__29961__3 = function(_, n, not_found) {
    return not_found
  };
  G__29961 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__29961__2.call(this, _, n);
      case 3:
        return G__29961__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__29961
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____29962 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____29962) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____29962
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__29975 = cljs.core._count.call(null, cicoll);
    if(cnt__29975 === 0) {
      return f.call(null)
    }else {
      var val__29976 = cljs.core._nth.call(null, cicoll, 0);
      var n__29977 = 1;
      while(true) {
        if(n__29977 < cnt__29975) {
          var nval__29978 = f.call(null, val__29976, cljs.core._nth.call(null, cicoll, n__29977));
          if(cljs.core.reduced_QMARK_.call(null, nval__29978)) {
            return cljs.core.deref.call(null, nval__29978)
          }else {
            var G__29987 = nval__29978;
            var G__29988 = n__29977 + 1;
            val__29976 = G__29987;
            n__29977 = G__29988;
            continue
          }
        }else {
          return val__29976
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__29979 = cljs.core._count.call(null, cicoll);
    var val__29980 = val;
    var n__29981 = 0;
    while(true) {
      if(n__29981 < cnt__29979) {
        var nval__29982 = f.call(null, val__29980, cljs.core._nth.call(null, cicoll, n__29981));
        if(cljs.core.reduced_QMARK_.call(null, nval__29982)) {
          return cljs.core.deref.call(null, nval__29982)
        }else {
          var G__29989 = nval__29982;
          var G__29990 = n__29981 + 1;
          val__29980 = G__29989;
          n__29981 = G__29990;
          continue
        }
      }else {
        return val__29980
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__29983 = cljs.core._count.call(null, cicoll);
    var val__29984 = val;
    var n__29985 = idx;
    while(true) {
      if(n__29985 < cnt__29983) {
        var nval__29986 = f.call(null, val__29984, cljs.core._nth.call(null, cicoll, n__29985));
        if(cljs.core.reduced_QMARK_.call(null, nval__29986)) {
          return cljs.core.deref.call(null, nval__29986)
        }else {
          var G__29991 = nval__29986;
          var G__29992 = n__29985 + 1;
          val__29984 = G__29991;
          n__29985 = G__29992;
          continue
        }
      }else {
        return val__29984
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__30005 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__30006 = arr[0];
      var n__30007 = 1;
      while(true) {
        if(n__30007 < cnt__30005) {
          var nval__30008 = f.call(null, val__30006, arr[n__30007]);
          if(cljs.core.reduced_QMARK_.call(null, nval__30008)) {
            return cljs.core.deref.call(null, nval__30008)
          }else {
            var G__30017 = nval__30008;
            var G__30018 = n__30007 + 1;
            val__30006 = G__30017;
            n__30007 = G__30018;
            continue
          }
        }else {
          return val__30006
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__30009 = arr.length;
    var val__30010 = val;
    var n__30011 = 0;
    while(true) {
      if(n__30011 < cnt__30009) {
        var nval__30012 = f.call(null, val__30010, arr[n__30011]);
        if(cljs.core.reduced_QMARK_.call(null, nval__30012)) {
          return cljs.core.deref.call(null, nval__30012)
        }else {
          var G__30019 = nval__30012;
          var G__30020 = n__30011 + 1;
          val__30010 = G__30019;
          n__30011 = G__30020;
          continue
        }
      }else {
        return val__30010
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__30013 = arr.length;
    var val__30014 = val;
    var n__30015 = idx;
    while(true) {
      if(n__30015 < cnt__30013) {
        var nval__30016 = f.call(null, val__30014, arr[n__30015]);
        if(cljs.core.reduced_QMARK_.call(null, nval__30016)) {
          return cljs.core.deref.call(null, nval__30016)
        }else {
          var G__30021 = nval__30016;
          var G__30022 = n__30015 + 1;
          val__30014 = G__30021;
          n__30015 = G__30022;
          continue
        }
      }else {
        return val__30014
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30023 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__30024 = this;
  if(this__30024.i + 1 < this__30024.a.length) {
    return new cljs.core.IndexedSeq(this__30024.a, this__30024.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30025 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__30026 = this;
  var c__30027 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__30027 > 0) {
    return new cljs.core.RSeq(coll, c__30027 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__30028 = this;
  var this__30029 = this;
  return cljs.core.pr_str.call(null, this__30029)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__30030 = this;
  if(cljs.core.counted_QMARK_.call(null, this__30030.a)) {
    return cljs.core.ci_reduce.call(null, this__30030.a, f, this__30030.a[this__30030.i], this__30030.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__30030.a[this__30030.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__30031 = this;
  if(cljs.core.counted_QMARK_.call(null, this__30031.a)) {
    return cljs.core.ci_reduce.call(null, this__30031.a, f, start, this__30031.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__30032 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__30033 = this;
  return this__30033.a.length - this__30033.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__30034 = this;
  return this__30034.a[this__30034.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__30035 = this;
  if(this__30035.i + 1 < this__30035.a.length) {
    return new cljs.core.IndexedSeq(this__30035.a, this__30035.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30036 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__30037 = this;
  var i__30038 = n + this__30037.i;
  if(i__30038 < this__30037.a.length) {
    return this__30037.a[i__30038]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__30039 = this;
  var i__30040 = n + this__30039.i;
  if(i__30040 < this__30039.a.length) {
    return this__30039.a[i__30040]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__30041 = null;
  var G__30041__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__30041__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__30041 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__30041__2.call(this, array, f);
      case 3:
        return G__30041__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30041
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__30042 = null;
  var G__30042__2 = function(array, k) {
    return array[k]
  };
  var G__30042__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__30042 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30042__2.call(this, array, k);
      case 3:
        return G__30042__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30042
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__30043 = null;
  var G__30043__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__30043__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__30043 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30043__2.call(this, array, n);
      case 3:
        return G__30043__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30043
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30044 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30045 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__30046 = this;
  var this__30047 = this;
  return cljs.core.pr_str.call(null, this__30047)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30048 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30049 = this;
  return this__30049.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30050 = this;
  return cljs.core._nth.call(null, this__30050.ci, this__30050.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30051 = this;
  if(this__30051.i > 0) {
    return new cljs.core.RSeq(this__30051.ci, this__30051.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30052 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__30053 = this;
  return new cljs.core.RSeq(this__30053.ci, this__30053.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30054 = this;
  return this__30054.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__30058__30059 = coll;
      if(G__30058__30059) {
        if(function() {
          var or__3824__auto____30060 = G__30058__30059.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____30060) {
            return or__3824__auto____30060
          }else {
            return G__30058__30059.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__30058__30059.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30058__30059)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30058__30059)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__30065__30066 = coll;
      if(G__30065__30066) {
        if(function() {
          var or__3824__auto____30067 = G__30065__30066.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30067) {
            return or__3824__auto____30067
          }else {
            return G__30065__30066.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30065__30066.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30065__30066)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30065__30066)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__30068 = cljs.core.seq.call(null, coll);
      if(s__30068 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__30068)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__30073__30074 = coll;
      if(G__30073__30074) {
        if(function() {
          var or__3824__auto____30075 = G__30073__30074.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30075) {
            return or__3824__auto____30075
          }else {
            return G__30073__30074.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30073__30074.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30073__30074)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30073__30074)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__30076 = cljs.core.seq.call(null, coll);
      if(!(s__30076 == null)) {
        return cljs.core._rest.call(null, s__30076)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__30080__30081 = coll;
      if(G__30080__30081) {
        if(function() {
          var or__3824__auto____30082 = G__30080__30081.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____30082) {
            return or__3824__auto____30082
          }else {
            return G__30080__30081.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__30080__30081.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__30080__30081)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__30080__30081)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__30084 = cljs.core.next.call(null, s);
    if(!(sn__30084 == null)) {
      var G__30085 = sn__30084;
      s = G__30085;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__30086__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__30087 = conj.call(null, coll, x);
          var G__30088 = cljs.core.first.call(null, xs);
          var G__30089 = cljs.core.next.call(null, xs);
          coll = G__30087;
          x = G__30088;
          xs = G__30089;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__30086 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30086__delegate.call(this, coll, x, xs)
    };
    G__30086.cljs$lang$maxFixedArity = 2;
    G__30086.cljs$lang$applyTo = function(arglist__30090) {
      var coll = cljs.core.first(arglist__30090);
      var x = cljs.core.first(cljs.core.next(arglist__30090));
      var xs = cljs.core.rest(cljs.core.next(arglist__30090));
      return G__30086__delegate(coll, x, xs)
    };
    G__30086.cljs$lang$arity$variadic = G__30086__delegate;
    return G__30086
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__30093 = cljs.core.seq.call(null, coll);
  var acc__30094 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__30093)) {
      return acc__30094 + cljs.core._count.call(null, s__30093)
    }else {
      var G__30095 = cljs.core.next.call(null, s__30093);
      var G__30096 = acc__30094 + 1;
      s__30093 = G__30095;
      acc__30094 = G__30096;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__30103__30104 = coll;
        if(G__30103__30104) {
          if(function() {
            var or__3824__auto____30105 = G__30103__30104.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____30105) {
              return or__3824__auto____30105
            }else {
              return G__30103__30104.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__30103__30104.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30103__30104)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30103__30104)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__30106__30107 = coll;
        if(G__30106__30107) {
          if(function() {
            var or__3824__auto____30108 = G__30106__30107.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____30108) {
              return or__3824__auto____30108
            }else {
              return G__30106__30107.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__30106__30107.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30106__30107)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30106__30107)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__30111__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__30110 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__30112 = ret__30110;
          var G__30113 = cljs.core.first.call(null, kvs);
          var G__30114 = cljs.core.second.call(null, kvs);
          var G__30115 = cljs.core.nnext.call(null, kvs);
          coll = G__30112;
          k = G__30113;
          v = G__30114;
          kvs = G__30115;
          continue
        }else {
          return ret__30110
        }
        break
      }
    };
    var G__30111 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30111__delegate.call(this, coll, k, v, kvs)
    };
    G__30111.cljs$lang$maxFixedArity = 3;
    G__30111.cljs$lang$applyTo = function(arglist__30116) {
      var coll = cljs.core.first(arglist__30116);
      var k = cljs.core.first(cljs.core.next(arglist__30116));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30116)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30116)));
      return G__30111__delegate(coll, k, v, kvs)
    };
    G__30111.cljs$lang$arity$variadic = G__30111__delegate;
    return G__30111
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__30119__delegate = function(coll, k, ks) {
      while(true) {
        var ret__30118 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__30120 = ret__30118;
          var G__30121 = cljs.core.first.call(null, ks);
          var G__30122 = cljs.core.next.call(null, ks);
          coll = G__30120;
          k = G__30121;
          ks = G__30122;
          continue
        }else {
          return ret__30118
        }
        break
      }
    };
    var G__30119 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30119__delegate.call(this, coll, k, ks)
    };
    G__30119.cljs$lang$maxFixedArity = 2;
    G__30119.cljs$lang$applyTo = function(arglist__30123) {
      var coll = cljs.core.first(arglist__30123);
      var k = cljs.core.first(cljs.core.next(arglist__30123));
      var ks = cljs.core.rest(cljs.core.next(arglist__30123));
      return G__30119__delegate(coll, k, ks)
    };
    G__30119.cljs$lang$arity$variadic = G__30119__delegate;
    return G__30119
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__30127__30128 = o;
    if(G__30127__30128) {
      if(function() {
        var or__3824__auto____30129 = G__30127__30128.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____30129) {
          return or__3824__auto____30129
        }else {
          return G__30127__30128.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__30127__30128.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__30127__30128)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__30127__30128)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__30132__delegate = function(coll, k, ks) {
      while(true) {
        var ret__30131 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__30133 = ret__30131;
          var G__30134 = cljs.core.first.call(null, ks);
          var G__30135 = cljs.core.next.call(null, ks);
          coll = G__30133;
          k = G__30134;
          ks = G__30135;
          continue
        }else {
          return ret__30131
        }
        break
      }
    };
    var G__30132 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30132__delegate.call(this, coll, k, ks)
    };
    G__30132.cljs$lang$maxFixedArity = 2;
    G__30132.cljs$lang$applyTo = function(arglist__30136) {
      var coll = cljs.core.first(arglist__30136);
      var k = cljs.core.first(cljs.core.next(arglist__30136));
      var ks = cljs.core.rest(cljs.core.next(arglist__30136));
      return G__30132__delegate(coll, k, ks)
    };
    G__30132.cljs$lang$arity$variadic = G__30132__delegate;
    return G__30132
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__30138 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__30138;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__30138
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__30140 = cljs.core.string_hash_cache[k];
  if(!(h__30140 == null)) {
    return h__30140
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____30142 = goog.isString(o);
      if(and__3822__auto____30142) {
        return check_cache
      }else {
        return and__3822__auto____30142
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30146__30147 = x;
    if(G__30146__30147) {
      if(function() {
        var or__3824__auto____30148 = G__30146__30147.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____30148) {
          return or__3824__auto____30148
        }else {
          return G__30146__30147.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__30146__30147.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__30146__30147)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__30146__30147)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30152__30153 = x;
    if(G__30152__30153) {
      if(function() {
        var or__3824__auto____30154 = G__30152__30153.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____30154) {
          return or__3824__auto____30154
        }else {
          return G__30152__30153.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__30152__30153.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__30152__30153)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__30152__30153)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__30158__30159 = x;
  if(G__30158__30159) {
    if(function() {
      var or__3824__auto____30160 = G__30158__30159.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____30160) {
        return or__3824__auto____30160
      }else {
        return G__30158__30159.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__30158__30159.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__30158__30159)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__30158__30159)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__30164__30165 = x;
  if(G__30164__30165) {
    if(function() {
      var or__3824__auto____30166 = G__30164__30165.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____30166) {
        return or__3824__auto____30166
      }else {
        return G__30164__30165.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__30164__30165.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__30164__30165)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__30164__30165)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__30170__30171 = x;
  if(G__30170__30171) {
    if(function() {
      var or__3824__auto____30172 = G__30170__30171.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____30172) {
        return or__3824__auto____30172
      }else {
        return G__30170__30171.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__30170__30171.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__30170__30171)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__30170__30171)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__30176__30177 = x;
  if(G__30176__30177) {
    if(function() {
      var or__3824__auto____30178 = G__30176__30177.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____30178) {
        return or__3824__auto____30178
      }else {
        return G__30176__30177.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__30176__30177.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30176__30177)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30176__30177)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__30182__30183 = x;
  if(G__30182__30183) {
    if(function() {
      var or__3824__auto____30184 = G__30182__30183.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____30184) {
        return or__3824__auto____30184
      }else {
        return G__30182__30183.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__30182__30183.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30182__30183)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30182__30183)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30188__30189 = x;
    if(G__30188__30189) {
      if(function() {
        var or__3824__auto____30190 = G__30188__30189.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____30190) {
          return or__3824__auto____30190
        }else {
          return G__30188__30189.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__30188__30189.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__30188__30189)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__30188__30189)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__30194__30195 = x;
  if(G__30194__30195) {
    if(function() {
      var or__3824__auto____30196 = G__30194__30195.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____30196) {
        return or__3824__auto____30196
      }else {
        return G__30194__30195.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__30194__30195.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__30194__30195)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__30194__30195)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__30200__30201 = x;
  if(G__30200__30201) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____30202 = null;
      if(cljs.core.truth_(or__3824__auto____30202)) {
        return or__3824__auto____30202
      }else {
        return G__30200__30201.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__30200__30201.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__30200__30201)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__30200__30201)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__30203__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__30203 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__30203__delegate.call(this, keyvals)
    };
    G__30203.cljs$lang$maxFixedArity = 0;
    G__30203.cljs$lang$applyTo = function(arglist__30204) {
      var keyvals = cljs.core.seq(arglist__30204);
      return G__30203__delegate(keyvals)
    };
    G__30203.cljs$lang$arity$variadic = G__30203__delegate;
    return G__30203
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__30206 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__30206.push(key)
  });
  return keys__30206
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__30210 = i;
  var j__30211 = j;
  var len__30212 = len;
  while(true) {
    if(len__30212 === 0) {
      return to
    }else {
      to[j__30211] = from[i__30210];
      var G__30213 = i__30210 + 1;
      var G__30214 = j__30211 + 1;
      var G__30215 = len__30212 - 1;
      i__30210 = G__30213;
      j__30211 = G__30214;
      len__30212 = G__30215;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__30219 = i + (len - 1);
  var j__30220 = j + (len - 1);
  var len__30221 = len;
  while(true) {
    if(len__30221 === 0) {
      return to
    }else {
      to[j__30220] = from[i__30219];
      var G__30222 = i__30219 - 1;
      var G__30223 = j__30220 - 1;
      var G__30224 = len__30221 - 1;
      i__30219 = G__30222;
      j__30220 = G__30223;
      len__30221 = G__30224;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__30228__30229 = s;
    if(G__30228__30229) {
      if(function() {
        var or__3824__auto____30230 = G__30228__30229.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____30230) {
          return or__3824__auto____30230
        }else {
          return G__30228__30229.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__30228__30229.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30228__30229)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30228__30229)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__30234__30235 = s;
  if(G__30234__30235) {
    if(function() {
      var or__3824__auto____30236 = G__30234__30235.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____30236) {
        return or__3824__auto____30236
      }else {
        return G__30234__30235.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__30234__30235.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__30234__30235)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__30234__30235)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____30239 = goog.isString(x);
  if(and__3822__auto____30239) {
    return!function() {
      var or__3824__auto____30240 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____30240) {
        return or__3824__auto____30240
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____30239
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____30242 = goog.isString(x);
  if(and__3822__auto____30242) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____30242
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____30244 = goog.isString(x);
  if(and__3822__auto____30244) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____30244
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____30249 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____30249) {
    return or__3824__auto____30249
  }else {
    var G__30250__30251 = f;
    if(G__30250__30251) {
      if(function() {
        var or__3824__auto____30252 = G__30250__30251.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____30252) {
          return or__3824__auto____30252
        }else {
          return G__30250__30251.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__30250__30251.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__30250__30251)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__30250__30251)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____30254 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____30254) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____30254
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____30257 = coll;
    if(cljs.core.truth_(and__3822__auto____30257)) {
      var and__3822__auto____30258 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____30258) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____30258
      }
    }else {
      return and__3822__auto____30257
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__30267__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__30263 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__30264 = more;
        while(true) {
          var x__30265 = cljs.core.first.call(null, xs__30264);
          var etc__30266 = cljs.core.next.call(null, xs__30264);
          if(cljs.core.truth_(xs__30264)) {
            if(cljs.core.contains_QMARK_.call(null, s__30263, x__30265)) {
              return false
            }else {
              var G__30268 = cljs.core.conj.call(null, s__30263, x__30265);
              var G__30269 = etc__30266;
              s__30263 = G__30268;
              xs__30264 = G__30269;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__30267 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30267__delegate.call(this, x, y, more)
    };
    G__30267.cljs$lang$maxFixedArity = 2;
    G__30267.cljs$lang$applyTo = function(arglist__30270) {
      var x = cljs.core.first(arglist__30270);
      var y = cljs.core.first(cljs.core.next(arglist__30270));
      var more = cljs.core.rest(cljs.core.next(arglist__30270));
      return G__30267__delegate(x, y, more)
    };
    G__30267.cljs$lang$arity$variadic = G__30267__delegate;
    return G__30267
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__30274__30275 = x;
            if(G__30274__30275) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____30276 = null;
                if(cljs.core.truth_(or__3824__auto____30276)) {
                  return or__3824__auto____30276
                }else {
                  return G__30274__30275.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__30274__30275.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__30274__30275)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__30274__30275)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__30281 = cljs.core.count.call(null, xs);
    var yl__30282 = cljs.core.count.call(null, ys);
    if(xl__30281 < yl__30282) {
      return-1
    }else {
      if(xl__30281 > yl__30282) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__30281, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__30283 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____30284 = d__30283 === 0;
        if(and__3822__auto____30284) {
          return n + 1 < len
        }else {
          return and__3822__auto____30284
        }
      }()) {
        var G__30285 = xs;
        var G__30286 = ys;
        var G__30287 = len;
        var G__30288 = n + 1;
        xs = G__30285;
        ys = G__30286;
        len = G__30287;
        n = G__30288;
        continue
      }else {
        return d__30283
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__30290 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__30290)) {
        return r__30290
      }else {
        if(cljs.core.truth_(r__30290)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__30292 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__30292, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__30292)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____30298 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____30298) {
      var s__30299 = temp__3971__auto____30298;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__30299), cljs.core.next.call(null, s__30299))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__30300 = val;
    var coll__30301 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__30301) {
        var nval__30302 = f.call(null, val__30300, cljs.core.first.call(null, coll__30301));
        if(cljs.core.reduced_QMARK_.call(null, nval__30302)) {
          return cljs.core.deref.call(null, nval__30302)
        }else {
          var G__30303 = nval__30302;
          var G__30304 = cljs.core.next.call(null, coll__30301);
          val__30300 = G__30303;
          coll__30301 = G__30304;
          continue
        }
      }else {
        return val__30300
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__30306 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__30306);
  return cljs.core.vec.call(null, a__30306)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__30313__30314 = coll;
      if(G__30313__30314) {
        if(function() {
          var or__3824__auto____30315 = G__30313__30314.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____30315) {
            return or__3824__auto____30315
          }else {
            return G__30313__30314.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__30313__30314.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30313__30314)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30313__30314)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__30316__30317 = coll;
      if(G__30316__30317) {
        if(function() {
          var or__3824__auto____30318 = G__30316__30317.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____30318) {
            return or__3824__auto____30318
          }else {
            return G__30316__30317.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__30316__30317.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30316__30317)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30316__30317)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__30319 = this;
  return this__30319.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__30320__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__30320 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30320__delegate.call(this, x, y, more)
    };
    G__30320.cljs$lang$maxFixedArity = 2;
    G__30320.cljs$lang$applyTo = function(arglist__30321) {
      var x = cljs.core.first(arglist__30321);
      var y = cljs.core.first(cljs.core.next(arglist__30321));
      var more = cljs.core.rest(cljs.core.next(arglist__30321));
      return G__30320__delegate(x, y, more)
    };
    G__30320.cljs$lang$arity$variadic = G__30320__delegate;
    return G__30320
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__30322__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__30322 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30322__delegate.call(this, x, y, more)
    };
    G__30322.cljs$lang$maxFixedArity = 2;
    G__30322.cljs$lang$applyTo = function(arglist__30323) {
      var x = cljs.core.first(arglist__30323);
      var y = cljs.core.first(cljs.core.next(arglist__30323));
      var more = cljs.core.rest(cljs.core.next(arglist__30323));
      return G__30322__delegate(x, y, more)
    };
    G__30322.cljs$lang$arity$variadic = G__30322__delegate;
    return G__30322
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__30324__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__30324 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30324__delegate.call(this, x, y, more)
    };
    G__30324.cljs$lang$maxFixedArity = 2;
    G__30324.cljs$lang$applyTo = function(arglist__30325) {
      var x = cljs.core.first(arglist__30325);
      var y = cljs.core.first(cljs.core.next(arglist__30325));
      var more = cljs.core.rest(cljs.core.next(arglist__30325));
      return G__30324__delegate(x, y, more)
    };
    G__30324.cljs$lang$arity$variadic = G__30324__delegate;
    return G__30324
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__30326__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__30326 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30326__delegate.call(this, x, y, more)
    };
    G__30326.cljs$lang$maxFixedArity = 2;
    G__30326.cljs$lang$applyTo = function(arglist__30327) {
      var x = cljs.core.first(arglist__30327);
      var y = cljs.core.first(cljs.core.next(arglist__30327));
      var more = cljs.core.rest(cljs.core.next(arglist__30327));
      return G__30326__delegate(x, y, more)
    };
    G__30326.cljs$lang$arity$variadic = G__30326__delegate;
    return G__30326
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__30328__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__30329 = y;
            var G__30330 = cljs.core.first.call(null, more);
            var G__30331 = cljs.core.next.call(null, more);
            x = G__30329;
            y = G__30330;
            more = G__30331;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__30328 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30328__delegate.call(this, x, y, more)
    };
    G__30328.cljs$lang$maxFixedArity = 2;
    G__30328.cljs$lang$applyTo = function(arglist__30332) {
      var x = cljs.core.first(arglist__30332);
      var y = cljs.core.first(cljs.core.next(arglist__30332));
      var more = cljs.core.rest(cljs.core.next(arglist__30332));
      return G__30328__delegate(x, y, more)
    };
    G__30328.cljs$lang$arity$variadic = G__30328__delegate;
    return G__30328
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__30333__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__30334 = y;
            var G__30335 = cljs.core.first.call(null, more);
            var G__30336 = cljs.core.next.call(null, more);
            x = G__30334;
            y = G__30335;
            more = G__30336;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__30333 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30333__delegate.call(this, x, y, more)
    };
    G__30333.cljs$lang$maxFixedArity = 2;
    G__30333.cljs$lang$applyTo = function(arglist__30337) {
      var x = cljs.core.first(arglist__30337);
      var y = cljs.core.first(cljs.core.next(arglist__30337));
      var more = cljs.core.rest(cljs.core.next(arglist__30337));
      return G__30333__delegate(x, y, more)
    };
    G__30333.cljs$lang$arity$variadic = G__30333__delegate;
    return G__30333
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__30338__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__30339 = y;
            var G__30340 = cljs.core.first.call(null, more);
            var G__30341 = cljs.core.next.call(null, more);
            x = G__30339;
            y = G__30340;
            more = G__30341;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__30338 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30338__delegate.call(this, x, y, more)
    };
    G__30338.cljs$lang$maxFixedArity = 2;
    G__30338.cljs$lang$applyTo = function(arglist__30342) {
      var x = cljs.core.first(arglist__30342);
      var y = cljs.core.first(cljs.core.next(arglist__30342));
      var more = cljs.core.rest(cljs.core.next(arglist__30342));
      return G__30338__delegate(x, y, more)
    };
    G__30338.cljs$lang$arity$variadic = G__30338__delegate;
    return G__30338
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__30343__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__30344 = y;
            var G__30345 = cljs.core.first.call(null, more);
            var G__30346 = cljs.core.next.call(null, more);
            x = G__30344;
            y = G__30345;
            more = G__30346;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__30343 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30343__delegate.call(this, x, y, more)
    };
    G__30343.cljs$lang$maxFixedArity = 2;
    G__30343.cljs$lang$applyTo = function(arglist__30347) {
      var x = cljs.core.first(arglist__30347);
      var y = cljs.core.first(cljs.core.next(arglist__30347));
      var more = cljs.core.rest(cljs.core.next(arglist__30347));
      return G__30343__delegate(x, y, more)
    };
    G__30343.cljs$lang$arity$variadic = G__30343__delegate;
    return G__30343
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__30348__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__30348 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30348__delegate.call(this, x, y, more)
    };
    G__30348.cljs$lang$maxFixedArity = 2;
    G__30348.cljs$lang$applyTo = function(arglist__30349) {
      var x = cljs.core.first(arglist__30349);
      var y = cljs.core.first(cljs.core.next(arglist__30349));
      var more = cljs.core.rest(cljs.core.next(arglist__30349));
      return G__30348__delegate(x, y, more)
    };
    G__30348.cljs$lang$arity$variadic = G__30348__delegate;
    return G__30348
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__30350__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__30350 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30350__delegate.call(this, x, y, more)
    };
    G__30350.cljs$lang$maxFixedArity = 2;
    G__30350.cljs$lang$applyTo = function(arglist__30351) {
      var x = cljs.core.first(arglist__30351);
      var y = cljs.core.first(cljs.core.next(arglist__30351));
      var more = cljs.core.rest(cljs.core.next(arglist__30351));
      return G__30350__delegate(x, y, more)
    };
    G__30350.cljs$lang$arity$variadic = G__30350__delegate;
    return G__30350
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__30353 = n % d;
  return cljs.core.fix.call(null, (n - rem__30353) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__30355 = cljs.core.quot.call(null, n, d);
  return n - d * q__30355
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__30358 = v - (v >> 1 & 1431655765);
  var v__30359 = (v__30358 & 858993459) + (v__30358 >> 2 & 858993459);
  return(v__30359 + (v__30359 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__30360__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__30361 = y;
            var G__30362 = cljs.core.first.call(null, more);
            var G__30363 = cljs.core.next.call(null, more);
            x = G__30361;
            y = G__30362;
            more = G__30363;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__30360 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30360__delegate.call(this, x, y, more)
    };
    G__30360.cljs$lang$maxFixedArity = 2;
    G__30360.cljs$lang$applyTo = function(arglist__30364) {
      var x = cljs.core.first(arglist__30364);
      var y = cljs.core.first(cljs.core.next(arglist__30364));
      var more = cljs.core.rest(cljs.core.next(arglist__30364));
      return G__30360__delegate(x, y, more)
    };
    G__30360.cljs$lang$arity$variadic = G__30360__delegate;
    return G__30360
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__30368 = n;
  var xs__30369 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____30370 = xs__30369;
      if(and__3822__auto____30370) {
        return n__30368 > 0
      }else {
        return and__3822__auto____30370
      }
    }())) {
      var G__30371 = n__30368 - 1;
      var G__30372 = cljs.core.next.call(null, xs__30369);
      n__30368 = G__30371;
      xs__30369 = G__30372;
      continue
    }else {
      return xs__30369
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__30373__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__30374 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__30375 = cljs.core.next.call(null, more);
            sb = G__30374;
            more = G__30375;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__30373 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__30373__delegate.call(this, x, ys)
    };
    G__30373.cljs$lang$maxFixedArity = 1;
    G__30373.cljs$lang$applyTo = function(arglist__30376) {
      var x = cljs.core.first(arglist__30376);
      var ys = cljs.core.rest(arglist__30376);
      return G__30373__delegate(x, ys)
    };
    G__30373.cljs$lang$arity$variadic = G__30373__delegate;
    return G__30373
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__30377__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__30378 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__30379 = cljs.core.next.call(null, more);
            sb = G__30378;
            more = G__30379;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__30377 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__30377__delegate.call(this, x, ys)
    };
    G__30377.cljs$lang$maxFixedArity = 1;
    G__30377.cljs$lang$applyTo = function(arglist__30380) {
      var x = cljs.core.first(arglist__30380);
      var ys = cljs.core.rest(arglist__30380);
      return G__30377__delegate(x, ys)
    };
    G__30377.cljs$lang$arity$variadic = G__30377__delegate;
    return G__30377
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__30381) {
    var fmt = cljs.core.first(arglist__30381);
    var args = cljs.core.rest(arglist__30381);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__30384 = cljs.core.seq.call(null, x);
    var ys__30385 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__30384 == null) {
        return ys__30385 == null
      }else {
        if(ys__30385 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__30384), cljs.core.first.call(null, ys__30385))) {
            var G__30386 = cljs.core.next.call(null, xs__30384);
            var G__30387 = cljs.core.next.call(null, ys__30385);
            xs__30384 = G__30386;
            ys__30385 = G__30387;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__30388_SHARP_, p2__30389_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__30388_SHARP_, cljs.core.hash.call(null, p2__30389_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__30393 = 0;
  var s__30394 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__30394) {
      var e__30395 = cljs.core.first.call(null, s__30394);
      var G__30396 = (h__30393 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__30395)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__30395)))) % 4503599627370496;
      var G__30397 = cljs.core.next.call(null, s__30394);
      h__30393 = G__30396;
      s__30394 = G__30397;
      continue
    }else {
      return h__30393
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__30401 = 0;
  var s__30402 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__30402) {
      var e__30403 = cljs.core.first.call(null, s__30402);
      var G__30404 = (h__30401 + cljs.core.hash.call(null, e__30403)) % 4503599627370496;
      var G__30405 = cljs.core.next.call(null, s__30402);
      h__30401 = G__30404;
      s__30402 = G__30405;
      continue
    }else {
      return h__30401
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__30426__30427 = cljs.core.seq.call(null, fn_map);
  if(G__30426__30427) {
    var G__30429__30431 = cljs.core.first.call(null, G__30426__30427);
    var vec__30430__30432 = G__30429__30431;
    var key_name__30433 = cljs.core.nth.call(null, vec__30430__30432, 0, null);
    var f__30434 = cljs.core.nth.call(null, vec__30430__30432, 1, null);
    var G__30426__30435 = G__30426__30427;
    var G__30429__30436 = G__30429__30431;
    var G__30426__30437 = G__30426__30435;
    while(true) {
      var vec__30438__30439 = G__30429__30436;
      var key_name__30440 = cljs.core.nth.call(null, vec__30438__30439, 0, null);
      var f__30441 = cljs.core.nth.call(null, vec__30438__30439, 1, null);
      var G__30426__30442 = G__30426__30437;
      var str_name__30443 = cljs.core.name.call(null, key_name__30440);
      obj[str_name__30443] = f__30441;
      var temp__3974__auto____30444 = cljs.core.next.call(null, G__30426__30442);
      if(temp__3974__auto____30444) {
        var G__30426__30445 = temp__3974__auto____30444;
        var G__30446 = cljs.core.first.call(null, G__30426__30445);
        var G__30447 = G__30426__30445;
        G__30429__30436 = G__30446;
        G__30426__30437 = G__30447;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30448 = this;
  var h__6523__auto____30449 = this__30448.__hash;
  if(!(h__6523__auto____30449 == null)) {
    return h__6523__auto____30449
  }else {
    var h__6523__auto____30450 = cljs.core.hash_coll.call(null, coll);
    this__30448.__hash = h__6523__auto____30450;
    return h__6523__auto____30450
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__30451 = this;
  if(this__30451.count === 1) {
    return null
  }else {
    return this__30451.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30452 = this;
  return new cljs.core.List(this__30452.meta, o, coll, this__30452.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__30453 = this;
  var this__30454 = this;
  return cljs.core.pr_str.call(null, this__30454)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30455 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30456 = this;
  return this__30456.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__30457 = this;
  return this__30457.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__30458 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30459 = this;
  return this__30459.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30460 = this;
  if(this__30460.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__30460.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30461 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30462 = this;
  return new cljs.core.List(meta, this__30462.first, this__30462.rest, this__30462.count, this__30462.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30463 = this;
  return this__30463.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30464 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30465 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__30466 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30467 = this;
  return new cljs.core.List(this__30467.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__30468 = this;
  var this__30469 = this;
  return cljs.core.pr_str.call(null, this__30469)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30470 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30471 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__30472 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__30473 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30474 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30475 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30476 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30477 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30478 = this;
  return this__30478.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30479 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__30483__30484 = coll;
  if(G__30483__30484) {
    if(function() {
      var or__3824__auto____30485 = G__30483__30484.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____30485) {
        return or__3824__auto____30485
      }else {
        return G__30483__30484.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__30483__30484.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__30483__30484)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__30483__30484)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__30486__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__30486 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30486__delegate.call(this, x, y, z, items)
    };
    G__30486.cljs$lang$maxFixedArity = 3;
    G__30486.cljs$lang$applyTo = function(arglist__30487) {
      var x = cljs.core.first(arglist__30487);
      var y = cljs.core.first(cljs.core.next(arglist__30487));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30487)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30487)));
      return G__30486__delegate(x, y, z, items)
    };
    G__30486.cljs$lang$arity$variadic = G__30486__delegate;
    return G__30486
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30488 = this;
  var h__6523__auto____30489 = this__30488.__hash;
  if(!(h__6523__auto____30489 == null)) {
    return h__6523__auto____30489
  }else {
    var h__6523__auto____30490 = cljs.core.hash_coll.call(null, coll);
    this__30488.__hash = h__6523__auto____30490;
    return h__6523__auto____30490
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__30491 = this;
  if(this__30491.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__30491.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30492 = this;
  return new cljs.core.Cons(null, o, coll, this__30492.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__30493 = this;
  var this__30494 = this;
  return cljs.core.pr_str.call(null, this__30494)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30495 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30496 = this;
  return this__30496.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30497 = this;
  if(this__30497.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__30497.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30498 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30499 = this;
  return new cljs.core.Cons(meta, this__30499.first, this__30499.rest, this__30499.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30500 = this;
  return this__30500.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30501 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__30501.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____30506 = coll == null;
    if(or__3824__auto____30506) {
      return or__3824__auto____30506
    }else {
      var G__30507__30508 = coll;
      if(G__30507__30508) {
        if(function() {
          var or__3824__auto____30509 = G__30507__30508.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30509) {
            return or__3824__auto____30509
          }else {
            return G__30507__30508.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30507__30508.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30507__30508)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30507__30508)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__30513__30514 = x;
  if(G__30513__30514) {
    if(function() {
      var or__3824__auto____30515 = G__30513__30514.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____30515) {
        return or__3824__auto____30515
      }else {
        return G__30513__30514.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__30513__30514.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__30513__30514)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__30513__30514)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__30516 = null;
  var G__30516__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__30516__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__30516 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__30516__2.call(this, string, f);
      case 3:
        return G__30516__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30516
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__30517 = null;
  var G__30517__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__30517__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__30517 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30517__2.call(this, string, k);
      case 3:
        return G__30517__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30517
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__30518 = null;
  var G__30518__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__30518__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__30518 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30518__2.call(this, string, n);
      case 3:
        return G__30518__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30518
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__30530 = null;
  var G__30530__2 = function(this_sym30521, coll) {
    var this__30523 = this;
    var this_sym30521__30524 = this;
    var ___30525 = this_sym30521__30524;
    if(coll == null) {
      return null
    }else {
      var strobj__30526 = coll.strobj;
      if(strobj__30526 == null) {
        return cljs.core._lookup.call(null, coll, this__30523.k, null)
      }else {
        return strobj__30526[this__30523.k]
      }
    }
  };
  var G__30530__3 = function(this_sym30522, coll, not_found) {
    var this__30523 = this;
    var this_sym30522__30527 = this;
    var ___30528 = this_sym30522__30527;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__30523.k, not_found)
    }
  };
  G__30530 = function(this_sym30522, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30530__2.call(this, this_sym30522, coll);
      case 3:
        return G__30530__3.call(this, this_sym30522, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30530
}();
cljs.core.Keyword.prototype.apply = function(this_sym30519, args30520) {
  var this__30529 = this;
  return this_sym30519.call.apply(this_sym30519, [this_sym30519].concat(args30520.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__30539 = null;
  var G__30539__2 = function(this_sym30533, coll) {
    var this_sym30533__30535 = this;
    var this__30536 = this_sym30533__30535;
    return cljs.core._lookup.call(null, coll, this__30536.toString(), null)
  };
  var G__30539__3 = function(this_sym30534, coll, not_found) {
    var this_sym30534__30537 = this;
    var this__30538 = this_sym30534__30537;
    return cljs.core._lookup.call(null, coll, this__30538.toString(), not_found)
  };
  G__30539 = function(this_sym30534, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30539__2.call(this, this_sym30534, coll);
      case 3:
        return G__30539__3.call(this, this_sym30534, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30539
}();
String.prototype.apply = function(this_sym30531, args30532) {
  return this_sym30531.call.apply(this_sym30531, [this_sym30531].concat(args30532.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__30541 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__30541
  }else {
    lazy_seq.x = x__30541.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30542 = this;
  var h__6523__auto____30543 = this__30542.__hash;
  if(!(h__6523__auto____30543 == null)) {
    return h__6523__auto____30543
  }else {
    var h__6523__auto____30544 = cljs.core.hash_coll.call(null, coll);
    this__30542.__hash = h__6523__auto____30544;
    return h__6523__auto____30544
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__30545 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30546 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__30547 = this;
  var this__30548 = this;
  return cljs.core.pr_str.call(null, this__30548)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30549 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30550 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30551 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30552 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30553 = this;
  return new cljs.core.LazySeq(meta, this__30553.realized, this__30553.x, this__30553.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30554 = this;
  return this__30554.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30555 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__30555.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__30556 = this;
  return this__30556.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__30557 = this;
  var ___30558 = this;
  this__30557.buf[this__30557.end] = o;
  return this__30557.end = this__30557.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__30559 = this;
  var ___30560 = this;
  var ret__30561 = new cljs.core.ArrayChunk(this__30559.buf, 0, this__30559.end);
  this__30559.buf = null;
  return ret__30561
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__30562 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__30562.arr[this__30562.off], this__30562.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__30563 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__30563.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__30564 = this;
  if(this__30564.off === this__30564.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__30564.arr, this__30564.off + 1, this__30564.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__30565 = this;
  return this__30565.arr[this__30565.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__30566 = this;
  if(function() {
    var and__3822__auto____30567 = i >= 0;
    if(and__3822__auto____30567) {
      return i < this__30566.end - this__30566.off
    }else {
      return and__3822__auto____30567
    }
  }()) {
    return this__30566.arr[this__30566.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__30568 = this;
  return this__30568.end - this__30568.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__30569 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30570 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30571 = this;
  return cljs.core._nth.call(null, this__30571.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30572 = this;
  if(cljs.core._count.call(null, this__30572.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__30572.chunk), this__30572.more, this__30572.meta)
  }else {
    if(this__30572.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__30572.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__30573 = this;
  if(this__30573.more == null) {
    return null
  }else {
    return this__30573.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30574 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__30575 = this;
  return new cljs.core.ChunkedCons(this__30575.chunk, this__30575.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30576 = this;
  return this__30576.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__30577 = this;
  return this__30577.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__30578 = this;
  if(this__30578.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__30578.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__30582__30583 = s;
    if(G__30582__30583) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____30584 = null;
        if(cljs.core.truth_(or__3824__auto____30584)) {
          return or__3824__auto____30584
        }else {
          return G__30582__30583.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__30582__30583.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__30582__30583)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__30582__30583)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__30587 = [];
  var s__30588 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__30588)) {
      ary__30587.push(cljs.core.first.call(null, s__30588));
      var G__30589 = cljs.core.next.call(null, s__30588);
      s__30588 = G__30589;
      continue
    }else {
      return ary__30587
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__30593 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__30594 = 0;
  var xs__30595 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__30595) {
      ret__30593[i__30594] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__30595));
      var G__30596 = i__30594 + 1;
      var G__30597 = cljs.core.next.call(null, xs__30595);
      i__30594 = G__30596;
      xs__30595 = G__30597;
      continue
    }else {
    }
    break
  }
  return ret__30593
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__30605 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30606 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30607 = 0;
      var s__30608 = s__30606;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30609 = s__30608;
          if(and__3822__auto____30609) {
            return i__30607 < size
          }else {
            return and__3822__auto____30609
          }
        }())) {
          a__30605[i__30607] = cljs.core.first.call(null, s__30608);
          var G__30612 = i__30607 + 1;
          var G__30613 = cljs.core.next.call(null, s__30608);
          i__30607 = G__30612;
          s__30608 = G__30613;
          continue
        }else {
          return a__30605
        }
        break
      }
    }else {
      var n__6858__auto____30610 = size;
      var i__30611 = 0;
      while(true) {
        if(i__30611 < n__6858__auto____30610) {
          a__30605[i__30611] = init_val_or_seq;
          var G__30614 = i__30611 + 1;
          i__30611 = G__30614;
          continue
        }else {
        }
        break
      }
      return a__30605
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__30622 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30623 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30624 = 0;
      var s__30625 = s__30623;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30626 = s__30625;
          if(and__3822__auto____30626) {
            return i__30624 < size
          }else {
            return and__3822__auto____30626
          }
        }())) {
          a__30622[i__30624] = cljs.core.first.call(null, s__30625);
          var G__30629 = i__30624 + 1;
          var G__30630 = cljs.core.next.call(null, s__30625);
          i__30624 = G__30629;
          s__30625 = G__30630;
          continue
        }else {
          return a__30622
        }
        break
      }
    }else {
      var n__6858__auto____30627 = size;
      var i__30628 = 0;
      while(true) {
        if(i__30628 < n__6858__auto____30627) {
          a__30622[i__30628] = init_val_or_seq;
          var G__30631 = i__30628 + 1;
          i__30628 = G__30631;
          continue
        }else {
        }
        break
      }
      return a__30622
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__30639 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30640 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30641 = 0;
      var s__30642 = s__30640;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30643 = s__30642;
          if(and__3822__auto____30643) {
            return i__30641 < size
          }else {
            return and__3822__auto____30643
          }
        }())) {
          a__30639[i__30641] = cljs.core.first.call(null, s__30642);
          var G__30646 = i__30641 + 1;
          var G__30647 = cljs.core.next.call(null, s__30642);
          i__30641 = G__30646;
          s__30642 = G__30647;
          continue
        }else {
          return a__30639
        }
        break
      }
    }else {
      var n__6858__auto____30644 = size;
      var i__30645 = 0;
      while(true) {
        if(i__30645 < n__6858__auto____30644) {
          a__30639[i__30645] = init_val_or_seq;
          var G__30648 = i__30645 + 1;
          i__30645 = G__30648;
          continue
        }else {
        }
        break
      }
      return a__30639
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__30653 = s;
    var i__30654 = n;
    var sum__30655 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____30656 = i__30654 > 0;
        if(and__3822__auto____30656) {
          return cljs.core.seq.call(null, s__30653)
        }else {
          return and__3822__auto____30656
        }
      }())) {
        var G__30657 = cljs.core.next.call(null, s__30653);
        var G__30658 = i__30654 - 1;
        var G__30659 = sum__30655 + 1;
        s__30653 = G__30657;
        i__30654 = G__30658;
        sum__30655 = G__30659;
        continue
      }else {
        return sum__30655
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__30664 = cljs.core.seq.call(null, x);
      if(s__30664) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__30664)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__30664), concat.call(null, cljs.core.chunk_rest.call(null, s__30664), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__30664), concat.call(null, cljs.core.rest.call(null, s__30664), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__30668__delegate = function(x, y, zs) {
      var cat__30667 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__30666 = cljs.core.seq.call(null, xys);
          if(xys__30666) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__30666)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__30666), cat.call(null, cljs.core.chunk_rest.call(null, xys__30666), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__30666), cat.call(null, cljs.core.rest.call(null, xys__30666), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__30667.call(null, concat.call(null, x, y), zs)
    };
    var G__30668 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30668__delegate.call(this, x, y, zs)
    };
    G__30668.cljs$lang$maxFixedArity = 2;
    G__30668.cljs$lang$applyTo = function(arglist__30669) {
      var x = cljs.core.first(arglist__30669);
      var y = cljs.core.first(cljs.core.next(arglist__30669));
      var zs = cljs.core.rest(cljs.core.next(arglist__30669));
      return G__30668__delegate(x, y, zs)
    };
    G__30668.cljs$lang$arity$variadic = G__30668__delegate;
    return G__30668
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__30670__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__30670 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30670__delegate.call(this, a, b, c, d, more)
    };
    G__30670.cljs$lang$maxFixedArity = 4;
    G__30670.cljs$lang$applyTo = function(arglist__30671) {
      var a = cljs.core.first(arglist__30671);
      var b = cljs.core.first(cljs.core.next(arglist__30671));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30671)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30671))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30671))));
      return G__30670__delegate(a, b, c, d, more)
    };
    G__30670.cljs$lang$arity$variadic = G__30670__delegate;
    return G__30670
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__30713 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__30714 = cljs.core._first.call(null, args__30713);
    var args__30715 = cljs.core._rest.call(null, args__30713);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__30714)
      }else {
        return f.call(null, a__30714)
      }
    }else {
      var b__30716 = cljs.core._first.call(null, args__30715);
      var args__30717 = cljs.core._rest.call(null, args__30715);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__30714, b__30716)
        }else {
          return f.call(null, a__30714, b__30716)
        }
      }else {
        var c__30718 = cljs.core._first.call(null, args__30717);
        var args__30719 = cljs.core._rest.call(null, args__30717);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__30714, b__30716, c__30718)
          }else {
            return f.call(null, a__30714, b__30716, c__30718)
          }
        }else {
          var d__30720 = cljs.core._first.call(null, args__30719);
          var args__30721 = cljs.core._rest.call(null, args__30719);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__30714, b__30716, c__30718, d__30720)
            }else {
              return f.call(null, a__30714, b__30716, c__30718, d__30720)
            }
          }else {
            var e__30722 = cljs.core._first.call(null, args__30721);
            var args__30723 = cljs.core._rest.call(null, args__30721);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__30714, b__30716, c__30718, d__30720, e__30722)
              }else {
                return f.call(null, a__30714, b__30716, c__30718, d__30720, e__30722)
              }
            }else {
              var f__30724 = cljs.core._first.call(null, args__30723);
              var args__30725 = cljs.core._rest.call(null, args__30723);
              if(argc === 6) {
                if(f__30724.cljs$lang$arity$6) {
                  return f__30724.cljs$lang$arity$6(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724)
                }else {
                  return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724)
                }
              }else {
                var g__30726 = cljs.core._first.call(null, args__30725);
                var args__30727 = cljs.core._rest.call(null, args__30725);
                if(argc === 7) {
                  if(f__30724.cljs$lang$arity$7) {
                    return f__30724.cljs$lang$arity$7(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726)
                  }else {
                    return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726)
                  }
                }else {
                  var h__30728 = cljs.core._first.call(null, args__30727);
                  var args__30729 = cljs.core._rest.call(null, args__30727);
                  if(argc === 8) {
                    if(f__30724.cljs$lang$arity$8) {
                      return f__30724.cljs$lang$arity$8(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728)
                    }else {
                      return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728)
                    }
                  }else {
                    var i__30730 = cljs.core._first.call(null, args__30729);
                    var args__30731 = cljs.core._rest.call(null, args__30729);
                    if(argc === 9) {
                      if(f__30724.cljs$lang$arity$9) {
                        return f__30724.cljs$lang$arity$9(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730)
                      }else {
                        return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730)
                      }
                    }else {
                      var j__30732 = cljs.core._first.call(null, args__30731);
                      var args__30733 = cljs.core._rest.call(null, args__30731);
                      if(argc === 10) {
                        if(f__30724.cljs$lang$arity$10) {
                          return f__30724.cljs$lang$arity$10(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732)
                        }else {
                          return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732)
                        }
                      }else {
                        var k__30734 = cljs.core._first.call(null, args__30733);
                        var args__30735 = cljs.core._rest.call(null, args__30733);
                        if(argc === 11) {
                          if(f__30724.cljs$lang$arity$11) {
                            return f__30724.cljs$lang$arity$11(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734)
                          }else {
                            return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734)
                          }
                        }else {
                          var l__30736 = cljs.core._first.call(null, args__30735);
                          var args__30737 = cljs.core._rest.call(null, args__30735);
                          if(argc === 12) {
                            if(f__30724.cljs$lang$arity$12) {
                              return f__30724.cljs$lang$arity$12(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736)
                            }else {
                              return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736)
                            }
                          }else {
                            var m__30738 = cljs.core._first.call(null, args__30737);
                            var args__30739 = cljs.core._rest.call(null, args__30737);
                            if(argc === 13) {
                              if(f__30724.cljs$lang$arity$13) {
                                return f__30724.cljs$lang$arity$13(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738)
                              }else {
                                return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738)
                              }
                            }else {
                              var n__30740 = cljs.core._first.call(null, args__30739);
                              var args__30741 = cljs.core._rest.call(null, args__30739);
                              if(argc === 14) {
                                if(f__30724.cljs$lang$arity$14) {
                                  return f__30724.cljs$lang$arity$14(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740)
                                }else {
                                  return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740)
                                }
                              }else {
                                var o__30742 = cljs.core._first.call(null, args__30741);
                                var args__30743 = cljs.core._rest.call(null, args__30741);
                                if(argc === 15) {
                                  if(f__30724.cljs$lang$arity$15) {
                                    return f__30724.cljs$lang$arity$15(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742)
                                  }else {
                                    return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742)
                                  }
                                }else {
                                  var p__30744 = cljs.core._first.call(null, args__30743);
                                  var args__30745 = cljs.core._rest.call(null, args__30743);
                                  if(argc === 16) {
                                    if(f__30724.cljs$lang$arity$16) {
                                      return f__30724.cljs$lang$arity$16(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744)
                                    }else {
                                      return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744)
                                    }
                                  }else {
                                    var q__30746 = cljs.core._first.call(null, args__30745);
                                    var args__30747 = cljs.core._rest.call(null, args__30745);
                                    if(argc === 17) {
                                      if(f__30724.cljs$lang$arity$17) {
                                        return f__30724.cljs$lang$arity$17(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746)
                                      }else {
                                        return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746)
                                      }
                                    }else {
                                      var r__30748 = cljs.core._first.call(null, args__30747);
                                      var args__30749 = cljs.core._rest.call(null, args__30747);
                                      if(argc === 18) {
                                        if(f__30724.cljs$lang$arity$18) {
                                          return f__30724.cljs$lang$arity$18(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748)
                                        }else {
                                          return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748)
                                        }
                                      }else {
                                        var s__30750 = cljs.core._first.call(null, args__30749);
                                        var args__30751 = cljs.core._rest.call(null, args__30749);
                                        if(argc === 19) {
                                          if(f__30724.cljs$lang$arity$19) {
                                            return f__30724.cljs$lang$arity$19(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748, s__30750)
                                          }else {
                                            return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748, s__30750)
                                          }
                                        }else {
                                          var t__30752 = cljs.core._first.call(null, args__30751);
                                          var args__30753 = cljs.core._rest.call(null, args__30751);
                                          if(argc === 20) {
                                            if(f__30724.cljs$lang$arity$20) {
                                              return f__30724.cljs$lang$arity$20(a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748, s__30750, t__30752)
                                            }else {
                                              return f__30724.call(null, a__30714, b__30716, c__30718, d__30720, e__30722, f__30724, g__30726, h__30728, i__30730, j__30732, k__30734, l__30736, m__30738, n__30740, o__30742, p__30744, q__30746, r__30748, s__30750, t__30752)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__30768 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30769 = cljs.core.bounded_count.call(null, args, fixed_arity__30768 + 1);
      if(bc__30769 <= fixed_arity__30768) {
        return cljs.core.apply_to.call(null, f, bc__30769, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__30770 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__30771 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30772 = cljs.core.bounded_count.call(null, arglist__30770, fixed_arity__30771 + 1);
      if(bc__30772 <= fixed_arity__30771) {
        return cljs.core.apply_to.call(null, f, bc__30772, arglist__30770)
      }else {
        return f.cljs$lang$applyTo(arglist__30770)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30770))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__30773 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__30774 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30775 = cljs.core.bounded_count.call(null, arglist__30773, fixed_arity__30774 + 1);
      if(bc__30775 <= fixed_arity__30774) {
        return cljs.core.apply_to.call(null, f, bc__30775, arglist__30773)
      }else {
        return f.cljs$lang$applyTo(arglist__30773)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30773))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__30776 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__30777 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30778 = cljs.core.bounded_count.call(null, arglist__30776, fixed_arity__30777 + 1);
      if(bc__30778 <= fixed_arity__30777) {
        return cljs.core.apply_to.call(null, f, bc__30778, arglist__30776)
      }else {
        return f.cljs$lang$applyTo(arglist__30776)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30776))
    }
  };
  var apply__6 = function() {
    var G__30782__delegate = function(f, a, b, c, d, args) {
      var arglist__30779 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__30780 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__30781 = cljs.core.bounded_count.call(null, arglist__30779, fixed_arity__30780 + 1);
        if(bc__30781 <= fixed_arity__30780) {
          return cljs.core.apply_to.call(null, f, bc__30781, arglist__30779)
        }else {
          return f.cljs$lang$applyTo(arglist__30779)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__30779))
      }
    };
    var G__30782 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__30782__delegate.call(this, f, a, b, c, d, args)
    };
    G__30782.cljs$lang$maxFixedArity = 5;
    G__30782.cljs$lang$applyTo = function(arglist__30783) {
      var f = cljs.core.first(arglist__30783);
      var a = cljs.core.first(cljs.core.next(arglist__30783));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30783)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30783))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30783)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30783)))));
      return G__30782__delegate(f, a, b, c, d, args)
    };
    G__30782.cljs$lang$arity$variadic = G__30782__delegate;
    return G__30782
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__30784) {
    var obj = cljs.core.first(arglist__30784);
    var f = cljs.core.first(cljs.core.next(arglist__30784));
    var args = cljs.core.rest(cljs.core.next(arglist__30784));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__30785__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__30785 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30785__delegate.call(this, x, y, more)
    };
    G__30785.cljs$lang$maxFixedArity = 2;
    G__30785.cljs$lang$applyTo = function(arglist__30786) {
      var x = cljs.core.first(arglist__30786);
      var y = cljs.core.first(cljs.core.next(arglist__30786));
      var more = cljs.core.rest(cljs.core.next(arglist__30786));
      return G__30785__delegate(x, y, more)
    };
    G__30785.cljs$lang$arity$variadic = G__30785__delegate;
    return G__30785
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__30787 = pred;
        var G__30788 = cljs.core.next.call(null, coll);
        pred = G__30787;
        coll = G__30788;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____30790 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____30790)) {
        return or__3824__auto____30790
      }else {
        var G__30791 = pred;
        var G__30792 = cljs.core.next.call(null, coll);
        pred = G__30791;
        coll = G__30792;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__30793 = null;
    var G__30793__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__30793__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__30793__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__30793__3 = function() {
      var G__30794__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__30794 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__30794__delegate.call(this, x, y, zs)
      };
      G__30794.cljs$lang$maxFixedArity = 2;
      G__30794.cljs$lang$applyTo = function(arglist__30795) {
        var x = cljs.core.first(arglist__30795);
        var y = cljs.core.first(cljs.core.next(arglist__30795));
        var zs = cljs.core.rest(cljs.core.next(arglist__30795));
        return G__30794__delegate(x, y, zs)
      };
      G__30794.cljs$lang$arity$variadic = G__30794__delegate;
      return G__30794
    }();
    G__30793 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__30793__0.call(this);
        case 1:
          return G__30793__1.call(this, x);
        case 2:
          return G__30793__2.call(this, x, y);
        default:
          return G__30793__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__30793.cljs$lang$maxFixedArity = 2;
    G__30793.cljs$lang$applyTo = G__30793__3.cljs$lang$applyTo;
    return G__30793
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__30796__delegate = function(args) {
      return x
    };
    var G__30796 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__30796__delegate.call(this, args)
    };
    G__30796.cljs$lang$maxFixedArity = 0;
    G__30796.cljs$lang$applyTo = function(arglist__30797) {
      var args = cljs.core.seq(arglist__30797);
      return G__30796__delegate(args)
    };
    G__30796.cljs$lang$arity$variadic = G__30796__delegate;
    return G__30796
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__30804 = null;
      var G__30804__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__30804__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__30804__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__30804__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__30804__4 = function() {
        var G__30805__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__30805 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30805__delegate.call(this, x, y, z, args)
        };
        G__30805.cljs$lang$maxFixedArity = 3;
        G__30805.cljs$lang$applyTo = function(arglist__30806) {
          var x = cljs.core.first(arglist__30806);
          var y = cljs.core.first(cljs.core.next(arglist__30806));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30806)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30806)));
          return G__30805__delegate(x, y, z, args)
        };
        G__30805.cljs$lang$arity$variadic = G__30805__delegate;
        return G__30805
      }();
      G__30804 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__30804__0.call(this);
          case 1:
            return G__30804__1.call(this, x);
          case 2:
            return G__30804__2.call(this, x, y);
          case 3:
            return G__30804__3.call(this, x, y, z);
          default:
            return G__30804__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30804.cljs$lang$maxFixedArity = 3;
      G__30804.cljs$lang$applyTo = G__30804__4.cljs$lang$applyTo;
      return G__30804
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__30807 = null;
      var G__30807__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__30807__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__30807__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__30807__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__30807__4 = function() {
        var G__30808__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__30808 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30808__delegate.call(this, x, y, z, args)
        };
        G__30808.cljs$lang$maxFixedArity = 3;
        G__30808.cljs$lang$applyTo = function(arglist__30809) {
          var x = cljs.core.first(arglist__30809);
          var y = cljs.core.first(cljs.core.next(arglist__30809));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30809)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30809)));
          return G__30808__delegate(x, y, z, args)
        };
        G__30808.cljs$lang$arity$variadic = G__30808__delegate;
        return G__30808
      }();
      G__30807 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__30807__0.call(this);
          case 1:
            return G__30807__1.call(this, x);
          case 2:
            return G__30807__2.call(this, x, y);
          case 3:
            return G__30807__3.call(this, x, y, z);
          default:
            return G__30807__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30807.cljs$lang$maxFixedArity = 3;
      G__30807.cljs$lang$applyTo = G__30807__4.cljs$lang$applyTo;
      return G__30807
    }()
  };
  var comp__4 = function() {
    var G__30810__delegate = function(f1, f2, f3, fs) {
      var fs__30801 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__30811__delegate = function(args) {
          var ret__30802 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__30801), args);
          var fs__30803 = cljs.core.next.call(null, fs__30801);
          while(true) {
            if(fs__30803) {
              var G__30812 = cljs.core.first.call(null, fs__30803).call(null, ret__30802);
              var G__30813 = cljs.core.next.call(null, fs__30803);
              ret__30802 = G__30812;
              fs__30803 = G__30813;
              continue
            }else {
              return ret__30802
            }
            break
          }
        };
        var G__30811 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__30811__delegate.call(this, args)
        };
        G__30811.cljs$lang$maxFixedArity = 0;
        G__30811.cljs$lang$applyTo = function(arglist__30814) {
          var args = cljs.core.seq(arglist__30814);
          return G__30811__delegate(args)
        };
        G__30811.cljs$lang$arity$variadic = G__30811__delegate;
        return G__30811
      }()
    };
    var G__30810 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30810__delegate.call(this, f1, f2, f3, fs)
    };
    G__30810.cljs$lang$maxFixedArity = 3;
    G__30810.cljs$lang$applyTo = function(arglist__30815) {
      var f1 = cljs.core.first(arglist__30815);
      var f2 = cljs.core.first(cljs.core.next(arglist__30815));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30815)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30815)));
      return G__30810__delegate(f1, f2, f3, fs)
    };
    G__30810.cljs$lang$arity$variadic = G__30810__delegate;
    return G__30810
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__30816__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__30816 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30816__delegate.call(this, args)
      };
      G__30816.cljs$lang$maxFixedArity = 0;
      G__30816.cljs$lang$applyTo = function(arglist__30817) {
        var args = cljs.core.seq(arglist__30817);
        return G__30816__delegate(args)
      };
      G__30816.cljs$lang$arity$variadic = G__30816__delegate;
      return G__30816
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__30818__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__30818 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30818__delegate.call(this, args)
      };
      G__30818.cljs$lang$maxFixedArity = 0;
      G__30818.cljs$lang$applyTo = function(arglist__30819) {
        var args = cljs.core.seq(arglist__30819);
        return G__30818__delegate(args)
      };
      G__30818.cljs$lang$arity$variadic = G__30818__delegate;
      return G__30818
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__30820__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__30820 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30820__delegate.call(this, args)
      };
      G__30820.cljs$lang$maxFixedArity = 0;
      G__30820.cljs$lang$applyTo = function(arglist__30821) {
        var args = cljs.core.seq(arglist__30821);
        return G__30820__delegate(args)
      };
      G__30820.cljs$lang$arity$variadic = G__30820__delegate;
      return G__30820
    }()
  };
  var partial__5 = function() {
    var G__30822__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__30823__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__30823 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__30823__delegate.call(this, args)
        };
        G__30823.cljs$lang$maxFixedArity = 0;
        G__30823.cljs$lang$applyTo = function(arglist__30824) {
          var args = cljs.core.seq(arglist__30824);
          return G__30823__delegate(args)
        };
        G__30823.cljs$lang$arity$variadic = G__30823__delegate;
        return G__30823
      }()
    };
    var G__30822 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30822__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__30822.cljs$lang$maxFixedArity = 4;
    G__30822.cljs$lang$applyTo = function(arglist__30825) {
      var f = cljs.core.first(arglist__30825);
      var arg1 = cljs.core.first(cljs.core.next(arglist__30825));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30825)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30825))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30825))));
      return G__30822__delegate(f, arg1, arg2, arg3, more)
    };
    G__30822.cljs$lang$arity$variadic = G__30822__delegate;
    return G__30822
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__30826 = null;
      var G__30826__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__30826__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__30826__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__30826__4 = function() {
        var G__30827__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__30827 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30827__delegate.call(this, a, b, c, ds)
        };
        G__30827.cljs$lang$maxFixedArity = 3;
        G__30827.cljs$lang$applyTo = function(arglist__30828) {
          var a = cljs.core.first(arglist__30828);
          var b = cljs.core.first(cljs.core.next(arglist__30828));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30828)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30828)));
          return G__30827__delegate(a, b, c, ds)
        };
        G__30827.cljs$lang$arity$variadic = G__30827__delegate;
        return G__30827
      }();
      G__30826 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__30826__1.call(this, a);
          case 2:
            return G__30826__2.call(this, a, b);
          case 3:
            return G__30826__3.call(this, a, b, c);
          default:
            return G__30826__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30826.cljs$lang$maxFixedArity = 3;
      G__30826.cljs$lang$applyTo = G__30826__4.cljs$lang$applyTo;
      return G__30826
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__30829 = null;
      var G__30829__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__30829__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__30829__4 = function() {
        var G__30830__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__30830 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30830__delegate.call(this, a, b, c, ds)
        };
        G__30830.cljs$lang$maxFixedArity = 3;
        G__30830.cljs$lang$applyTo = function(arglist__30831) {
          var a = cljs.core.first(arglist__30831);
          var b = cljs.core.first(cljs.core.next(arglist__30831));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30831)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30831)));
          return G__30830__delegate(a, b, c, ds)
        };
        G__30830.cljs$lang$arity$variadic = G__30830__delegate;
        return G__30830
      }();
      G__30829 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__30829__2.call(this, a, b);
          case 3:
            return G__30829__3.call(this, a, b, c);
          default:
            return G__30829__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30829.cljs$lang$maxFixedArity = 3;
      G__30829.cljs$lang$applyTo = G__30829__4.cljs$lang$applyTo;
      return G__30829
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__30832 = null;
      var G__30832__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__30832__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__30832__4 = function() {
        var G__30833__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__30833 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30833__delegate.call(this, a, b, c, ds)
        };
        G__30833.cljs$lang$maxFixedArity = 3;
        G__30833.cljs$lang$applyTo = function(arglist__30834) {
          var a = cljs.core.first(arglist__30834);
          var b = cljs.core.first(cljs.core.next(arglist__30834));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30834)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30834)));
          return G__30833__delegate(a, b, c, ds)
        };
        G__30833.cljs$lang$arity$variadic = G__30833__delegate;
        return G__30833
      }();
      G__30832 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__30832__2.call(this, a, b);
          case 3:
            return G__30832__3.call(this, a, b, c);
          default:
            return G__30832__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30832.cljs$lang$maxFixedArity = 3;
      G__30832.cljs$lang$applyTo = G__30832__4.cljs$lang$applyTo;
      return G__30832
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__30850 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30858 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____30858) {
        var s__30859 = temp__3974__auto____30858;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__30859)) {
          var c__30860 = cljs.core.chunk_first.call(null, s__30859);
          var size__30861 = cljs.core.count.call(null, c__30860);
          var b__30862 = cljs.core.chunk_buffer.call(null, size__30861);
          var n__6858__auto____30863 = size__30861;
          var i__30864 = 0;
          while(true) {
            if(i__30864 < n__6858__auto____30863) {
              cljs.core.chunk_append.call(null, b__30862, f.call(null, idx + i__30864, cljs.core._nth.call(null, c__30860, i__30864)));
              var G__30865 = i__30864 + 1;
              i__30864 = G__30865;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__30862), mapi.call(null, idx + size__30861, cljs.core.chunk_rest.call(null, s__30859)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__30859)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__30859)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__30850.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____30875 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____30875) {
      var s__30876 = temp__3974__auto____30875;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__30876)) {
        var c__30877 = cljs.core.chunk_first.call(null, s__30876);
        var size__30878 = cljs.core.count.call(null, c__30877);
        var b__30879 = cljs.core.chunk_buffer.call(null, size__30878);
        var n__6858__auto____30880 = size__30878;
        var i__30881 = 0;
        while(true) {
          if(i__30881 < n__6858__auto____30880) {
            var x__30882 = f.call(null, cljs.core._nth.call(null, c__30877, i__30881));
            if(x__30882 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__30879, x__30882)
            }
            var G__30884 = i__30881 + 1;
            i__30881 = G__30884;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__30879), keep.call(null, f, cljs.core.chunk_rest.call(null, s__30876)))
      }else {
        var x__30883 = f.call(null, cljs.core.first.call(null, s__30876));
        if(x__30883 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__30876))
        }else {
          return cljs.core.cons.call(null, x__30883, keep.call(null, f, cljs.core.rest.call(null, s__30876)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__30910 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30920 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____30920) {
        var s__30921 = temp__3974__auto____30920;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__30921)) {
          var c__30922 = cljs.core.chunk_first.call(null, s__30921);
          var size__30923 = cljs.core.count.call(null, c__30922);
          var b__30924 = cljs.core.chunk_buffer.call(null, size__30923);
          var n__6858__auto____30925 = size__30923;
          var i__30926 = 0;
          while(true) {
            if(i__30926 < n__6858__auto____30925) {
              var x__30927 = f.call(null, idx + i__30926, cljs.core._nth.call(null, c__30922, i__30926));
              if(x__30927 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__30924, x__30927)
              }
              var G__30929 = i__30926 + 1;
              i__30926 = G__30929;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__30924), keepi.call(null, idx + size__30923, cljs.core.chunk_rest.call(null, s__30921)))
        }else {
          var x__30928 = f.call(null, idx, cljs.core.first.call(null, s__30921));
          if(x__30928 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__30921))
          }else {
            return cljs.core.cons.call(null, x__30928, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__30921)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__30910.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31015 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31015)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____31015
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31016 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31016)) {
            var and__3822__auto____31017 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____31017)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____31017
            }
          }else {
            return and__3822__auto____31016
          }
        }())
      };
      var ep1__4 = function() {
        var G__31086__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____31018 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____31018)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____31018
            }
          }())
        };
        var G__31086 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31086__delegate.call(this, x, y, z, args)
        };
        G__31086.cljs$lang$maxFixedArity = 3;
        G__31086.cljs$lang$applyTo = function(arglist__31087) {
          var x = cljs.core.first(arglist__31087);
          var y = cljs.core.first(cljs.core.next(arglist__31087));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31087)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31087)));
          return G__31086__delegate(x, y, z, args)
        };
        G__31086.cljs$lang$arity$variadic = G__31086__delegate;
        return G__31086
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31030 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31030)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____31030
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31031 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31031)) {
            var and__3822__auto____31032 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____31032)) {
              var and__3822__auto____31033 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____31033)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____31033
              }
            }else {
              return and__3822__auto____31032
            }
          }else {
            return and__3822__auto____31031
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31034 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31034)) {
            var and__3822__auto____31035 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____31035)) {
              var and__3822__auto____31036 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____31036)) {
                var and__3822__auto____31037 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____31037)) {
                  var and__3822__auto____31038 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____31038)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____31038
                  }
                }else {
                  return and__3822__auto____31037
                }
              }else {
                return and__3822__auto____31036
              }
            }else {
              return and__3822__auto____31035
            }
          }else {
            return and__3822__auto____31034
          }
        }())
      };
      var ep2__4 = function() {
        var G__31088__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____31039 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____31039)) {
              return cljs.core.every_QMARK_.call(null, function(p1__30885_SHARP_) {
                var and__3822__auto____31040 = p1.call(null, p1__30885_SHARP_);
                if(cljs.core.truth_(and__3822__auto____31040)) {
                  return p2.call(null, p1__30885_SHARP_)
                }else {
                  return and__3822__auto____31040
                }
              }, args)
            }else {
              return and__3822__auto____31039
            }
          }())
        };
        var G__31088 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31088__delegate.call(this, x, y, z, args)
        };
        G__31088.cljs$lang$maxFixedArity = 3;
        G__31088.cljs$lang$applyTo = function(arglist__31089) {
          var x = cljs.core.first(arglist__31089);
          var y = cljs.core.first(cljs.core.next(arglist__31089));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31089)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31089)));
          return G__31088__delegate(x, y, z, args)
        };
        G__31088.cljs$lang$arity$variadic = G__31088__delegate;
        return G__31088
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31059 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31059)) {
            var and__3822__auto____31060 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____31060)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____31060
            }
          }else {
            return and__3822__auto____31059
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31061 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31061)) {
            var and__3822__auto____31062 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____31062)) {
              var and__3822__auto____31063 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____31063)) {
                var and__3822__auto____31064 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____31064)) {
                  var and__3822__auto____31065 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____31065)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____31065
                  }
                }else {
                  return and__3822__auto____31064
                }
              }else {
                return and__3822__auto____31063
              }
            }else {
              return and__3822__auto____31062
            }
          }else {
            return and__3822__auto____31061
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____31066 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____31066)) {
            var and__3822__auto____31067 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____31067)) {
              var and__3822__auto____31068 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____31068)) {
                var and__3822__auto____31069 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____31069)) {
                  var and__3822__auto____31070 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____31070)) {
                    var and__3822__auto____31071 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____31071)) {
                      var and__3822__auto____31072 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____31072)) {
                        var and__3822__auto____31073 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____31073)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____31073
                        }
                      }else {
                        return and__3822__auto____31072
                      }
                    }else {
                      return and__3822__auto____31071
                    }
                  }else {
                    return and__3822__auto____31070
                  }
                }else {
                  return and__3822__auto____31069
                }
              }else {
                return and__3822__auto____31068
              }
            }else {
              return and__3822__auto____31067
            }
          }else {
            return and__3822__auto____31066
          }
        }())
      };
      var ep3__4 = function() {
        var G__31090__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____31074 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____31074)) {
              return cljs.core.every_QMARK_.call(null, function(p1__30886_SHARP_) {
                var and__3822__auto____31075 = p1.call(null, p1__30886_SHARP_);
                if(cljs.core.truth_(and__3822__auto____31075)) {
                  var and__3822__auto____31076 = p2.call(null, p1__30886_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____31076)) {
                    return p3.call(null, p1__30886_SHARP_)
                  }else {
                    return and__3822__auto____31076
                  }
                }else {
                  return and__3822__auto____31075
                }
              }, args)
            }else {
              return and__3822__auto____31074
            }
          }())
        };
        var G__31090 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31090__delegate.call(this, x, y, z, args)
        };
        G__31090.cljs$lang$maxFixedArity = 3;
        G__31090.cljs$lang$applyTo = function(arglist__31091) {
          var x = cljs.core.first(arglist__31091);
          var y = cljs.core.first(cljs.core.next(arglist__31091));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31091)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31091)));
          return G__31090__delegate(x, y, z, args)
        };
        G__31090.cljs$lang$arity$variadic = G__31090__delegate;
        return G__31090
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__31092__delegate = function(p1, p2, p3, ps) {
      var ps__31077 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__30887_SHARP_) {
            return p1__30887_SHARP_.call(null, x)
          }, ps__31077)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__30888_SHARP_) {
            var and__3822__auto____31082 = p1__30888_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____31082)) {
              return p1__30888_SHARP_.call(null, y)
            }else {
              return and__3822__auto____31082
            }
          }, ps__31077)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__30889_SHARP_) {
            var and__3822__auto____31083 = p1__30889_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____31083)) {
              var and__3822__auto____31084 = p1__30889_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____31084)) {
                return p1__30889_SHARP_.call(null, z)
              }else {
                return and__3822__auto____31084
              }
            }else {
              return and__3822__auto____31083
            }
          }, ps__31077)
        };
        var epn__4 = function() {
          var G__31093__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____31085 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____31085)) {
                return cljs.core.every_QMARK_.call(null, function(p1__30890_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__30890_SHARP_, args)
                }, ps__31077)
              }else {
                return and__3822__auto____31085
              }
            }())
          };
          var G__31093 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__31093__delegate.call(this, x, y, z, args)
          };
          G__31093.cljs$lang$maxFixedArity = 3;
          G__31093.cljs$lang$applyTo = function(arglist__31094) {
            var x = cljs.core.first(arglist__31094);
            var y = cljs.core.first(cljs.core.next(arglist__31094));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31094)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31094)));
            return G__31093__delegate(x, y, z, args)
          };
          G__31093.cljs$lang$arity$variadic = G__31093__delegate;
          return G__31093
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__31092 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__31092__delegate.call(this, p1, p2, p3, ps)
    };
    G__31092.cljs$lang$maxFixedArity = 3;
    G__31092.cljs$lang$applyTo = function(arglist__31095) {
      var p1 = cljs.core.first(arglist__31095);
      var p2 = cljs.core.first(cljs.core.next(arglist__31095));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31095)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31095)));
      return G__31092__delegate(p1, p2, p3, ps)
    };
    G__31092.cljs$lang$arity$variadic = G__31092__delegate;
    return G__31092
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____31176 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31176)) {
          return or__3824__auto____31176
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____31177 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31177)) {
          return or__3824__auto____31177
        }else {
          var or__3824__auto____31178 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____31178)) {
            return or__3824__auto____31178
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__31247__delegate = function(x, y, z, args) {
          var or__3824__auto____31179 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____31179)) {
            return or__3824__auto____31179
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__31247 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31247__delegate.call(this, x, y, z, args)
        };
        G__31247.cljs$lang$maxFixedArity = 3;
        G__31247.cljs$lang$applyTo = function(arglist__31248) {
          var x = cljs.core.first(arglist__31248);
          var y = cljs.core.first(cljs.core.next(arglist__31248));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31248)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31248)));
          return G__31247__delegate(x, y, z, args)
        };
        G__31247.cljs$lang$arity$variadic = G__31247__delegate;
        return G__31247
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____31191 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31191)) {
          return or__3824__auto____31191
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____31192 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31192)) {
          return or__3824__auto____31192
        }else {
          var or__3824__auto____31193 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____31193)) {
            return or__3824__auto____31193
          }else {
            var or__3824__auto____31194 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____31194)) {
              return or__3824__auto____31194
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____31195 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31195)) {
          return or__3824__auto____31195
        }else {
          var or__3824__auto____31196 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____31196)) {
            return or__3824__auto____31196
          }else {
            var or__3824__auto____31197 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____31197)) {
              return or__3824__auto____31197
            }else {
              var or__3824__auto____31198 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____31198)) {
                return or__3824__auto____31198
              }else {
                var or__3824__auto____31199 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____31199)) {
                  return or__3824__auto____31199
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__31249__delegate = function(x, y, z, args) {
          var or__3824__auto____31200 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____31200)) {
            return or__3824__auto____31200
          }else {
            return cljs.core.some.call(null, function(p1__30930_SHARP_) {
              var or__3824__auto____31201 = p1.call(null, p1__30930_SHARP_);
              if(cljs.core.truth_(or__3824__auto____31201)) {
                return or__3824__auto____31201
              }else {
                return p2.call(null, p1__30930_SHARP_)
              }
            }, args)
          }
        };
        var G__31249 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31249__delegate.call(this, x, y, z, args)
        };
        G__31249.cljs$lang$maxFixedArity = 3;
        G__31249.cljs$lang$applyTo = function(arglist__31250) {
          var x = cljs.core.first(arglist__31250);
          var y = cljs.core.first(cljs.core.next(arglist__31250));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31250)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31250)));
          return G__31249__delegate(x, y, z, args)
        };
        G__31249.cljs$lang$arity$variadic = G__31249__delegate;
        return G__31249
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____31220 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31220)) {
          return or__3824__auto____31220
        }else {
          var or__3824__auto____31221 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____31221)) {
            return or__3824__auto____31221
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____31222 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31222)) {
          return or__3824__auto____31222
        }else {
          var or__3824__auto____31223 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____31223)) {
            return or__3824__auto____31223
          }else {
            var or__3824__auto____31224 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____31224)) {
              return or__3824__auto____31224
            }else {
              var or__3824__auto____31225 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____31225)) {
                return or__3824__auto____31225
              }else {
                var or__3824__auto____31226 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____31226)) {
                  return or__3824__auto____31226
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____31227 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____31227)) {
          return or__3824__auto____31227
        }else {
          var or__3824__auto____31228 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____31228)) {
            return or__3824__auto____31228
          }else {
            var or__3824__auto____31229 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____31229)) {
              return or__3824__auto____31229
            }else {
              var or__3824__auto____31230 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____31230)) {
                return or__3824__auto____31230
              }else {
                var or__3824__auto____31231 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____31231)) {
                  return or__3824__auto____31231
                }else {
                  var or__3824__auto____31232 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____31232)) {
                    return or__3824__auto____31232
                  }else {
                    var or__3824__auto____31233 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____31233)) {
                      return or__3824__auto____31233
                    }else {
                      var or__3824__auto____31234 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____31234)) {
                        return or__3824__auto____31234
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__31251__delegate = function(x, y, z, args) {
          var or__3824__auto____31235 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____31235)) {
            return or__3824__auto____31235
          }else {
            return cljs.core.some.call(null, function(p1__30931_SHARP_) {
              var or__3824__auto____31236 = p1.call(null, p1__30931_SHARP_);
              if(cljs.core.truth_(or__3824__auto____31236)) {
                return or__3824__auto____31236
              }else {
                var or__3824__auto____31237 = p2.call(null, p1__30931_SHARP_);
                if(cljs.core.truth_(or__3824__auto____31237)) {
                  return or__3824__auto____31237
                }else {
                  return p3.call(null, p1__30931_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__31251 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__31251__delegate.call(this, x, y, z, args)
        };
        G__31251.cljs$lang$maxFixedArity = 3;
        G__31251.cljs$lang$applyTo = function(arglist__31252) {
          var x = cljs.core.first(arglist__31252);
          var y = cljs.core.first(cljs.core.next(arglist__31252));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31252)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31252)));
          return G__31251__delegate(x, y, z, args)
        };
        G__31251.cljs$lang$arity$variadic = G__31251__delegate;
        return G__31251
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__31253__delegate = function(p1, p2, p3, ps) {
      var ps__31238 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__30932_SHARP_) {
            return p1__30932_SHARP_.call(null, x)
          }, ps__31238)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__30933_SHARP_) {
            var or__3824__auto____31243 = p1__30933_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____31243)) {
              return or__3824__auto____31243
            }else {
              return p1__30933_SHARP_.call(null, y)
            }
          }, ps__31238)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__30934_SHARP_) {
            var or__3824__auto____31244 = p1__30934_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____31244)) {
              return or__3824__auto____31244
            }else {
              var or__3824__auto____31245 = p1__30934_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____31245)) {
                return or__3824__auto____31245
              }else {
                return p1__30934_SHARP_.call(null, z)
              }
            }
          }, ps__31238)
        };
        var spn__4 = function() {
          var G__31254__delegate = function(x, y, z, args) {
            var or__3824__auto____31246 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____31246)) {
              return or__3824__auto____31246
            }else {
              return cljs.core.some.call(null, function(p1__30935_SHARP_) {
                return cljs.core.some.call(null, p1__30935_SHARP_, args)
              }, ps__31238)
            }
          };
          var G__31254 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__31254__delegate.call(this, x, y, z, args)
          };
          G__31254.cljs$lang$maxFixedArity = 3;
          G__31254.cljs$lang$applyTo = function(arglist__31255) {
            var x = cljs.core.first(arglist__31255);
            var y = cljs.core.first(cljs.core.next(arglist__31255));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31255)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31255)));
            return G__31254__delegate(x, y, z, args)
          };
          G__31254.cljs$lang$arity$variadic = G__31254__delegate;
          return G__31254
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__31253 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__31253__delegate.call(this, p1, p2, p3, ps)
    };
    G__31253.cljs$lang$maxFixedArity = 3;
    G__31253.cljs$lang$applyTo = function(arglist__31256) {
      var p1 = cljs.core.first(arglist__31256);
      var p2 = cljs.core.first(cljs.core.next(arglist__31256));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31256)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31256)));
      return G__31253__delegate(p1, p2, p3, ps)
    };
    G__31253.cljs$lang$arity$variadic = G__31253__delegate;
    return G__31253
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____31275 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____31275) {
        var s__31276 = temp__3974__auto____31275;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__31276)) {
          var c__31277 = cljs.core.chunk_first.call(null, s__31276);
          var size__31278 = cljs.core.count.call(null, c__31277);
          var b__31279 = cljs.core.chunk_buffer.call(null, size__31278);
          var n__6858__auto____31280 = size__31278;
          var i__31281 = 0;
          while(true) {
            if(i__31281 < n__6858__auto____31280) {
              cljs.core.chunk_append.call(null, b__31279, f.call(null, cljs.core._nth.call(null, c__31277, i__31281)));
              var G__31293 = i__31281 + 1;
              i__31281 = G__31293;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__31279), map.call(null, f, cljs.core.chunk_rest.call(null, s__31276)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__31276)), map.call(null, f, cljs.core.rest.call(null, s__31276)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__31282 = cljs.core.seq.call(null, c1);
      var s2__31283 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____31284 = s1__31282;
        if(and__3822__auto____31284) {
          return s2__31283
        }else {
          return and__3822__auto____31284
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__31282), cljs.core.first.call(null, s2__31283)), map.call(null, f, cljs.core.rest.call(null, s1__31282), cljs.core.rest.call(null, s2__31283)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__31285 = cljs.core.seq.call(null, c1);
      var s2__31286 = cljs.core.seq.call(null, c2);
      var s3__31287 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____31288 = s1__31285;
        if(and__3822__auto____31288) {
          var and__3822__auto____31289 = s2__31286;
          if(and__3822__auto____31289) {
            return s3__31287
          }else {
            return and__3822__auto____31289
          }
        }else {
          return and__3822__auto____31288
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__31285), cljs.core.first.call(null, s2__31286), cljs.core.first.call(null, s3__31287)), map.call(null, f, cljs.core.rest.call(null, s1__31285), cljs.core.rest.call(null, s2__31286), cljs.core.rest.call(null, s3__31287)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__31294__delegate = function(f, c1, c2, c3, colls) {
      var step__31292 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__31291 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__31291)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__31291), step.call(null, map.call(null, cljs.core.rest, ss__31291)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__31096_SHARP_) {
        return cljs.core.apply.call(null, f, p1__31096_SHARP_)
      }, step__31292.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__31294 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__31294__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__31294.cljs$lang$maxFixedArity = 4;
    G__31294.cljs$lang$applyTo = function(arglist__31295) {
      var f = cljs.core.first(arglist__31295);
      var c1 = cljs.core.first(cljs.core.next(arglist__31295));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31295)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__31295))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__31295))));
      return G__31294__delegate(f, c1, c2, c3, colls)
    };
    G__31294.cljs$lang$arity$variadic = G__31294__delegate;
    return G__31294
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____31298 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____31298) {
        var s__31299 = temp__3974__auto____31298;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__31299), take.call(null, n - 1, cljs.core.rest.call(null, s__31299)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__31305 = function(n, coll) {
    while(true) {
      var s__31303 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____31304 = n > 0;
        if(and__3822__auto____31304) {
          return s__31303
        }else {
          return and__3822__auto____31304
        }
      }())) {
        var G__31306 = n - 1;
        var G__31307 = cljs.core.rest.call(null, s__31303);
        n = G__31306;
        coll = G__31307;
        continue
      }else {
        return s__31303
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__31305.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__31310 = cljs.core.seq.call(null, coll);
  var lead__31311 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__31311) {
      var G__31312 = cljs.core.next.call(null, s__31310);
      var G__31313 = cljs.core.next.call(null, lead__31311);
      s__31310 = G__31312;
      lead__31311 = G__31313;
      continue
    }else {
      return s__31310
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__31319 = function(pred, coll) {
    while(true) {
      var s__31317 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____31318 = s__31317;
        if(and__3822__auto____31318) {
          return pred.call(null, cljs.core.first.call(null, s__31317))
        }else {
          return and__3822__auto____31318
        }
      }())) {
        var G__31320 = pred;
        var G__31321 = cljs.core.rest.call(null, s__31317);
        pred = G__31320;
        coll = G__31321;
        continue
      }else {
        return s__31317
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__31319.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____31324 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____31324) {
      var s__31325 = temp__3974__auto____31324;
      return cljs.core.concat.call(null, s__31325, cycle.call(null, s__31325))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__31330 = cljs.core.seq.call(null, c1);
      var s2__31331 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____31332 = s1__31330;
        if(and__3822__auto____31332) {
          return s2__31331
        }else {
          return and__3822__auto____31332
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__31330), cljs.core.cons.call(null, cljs.core.first.call(null, s2__31331), interleave.call(null, cljs.core.rest.call(null, s1__31330), cljs.core.rest.call(null, s2__31331))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__31334__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__31333 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__31333)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__31333), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__31333)))
        }else {
          return null
        }
      }, null)
    };
    var G__31334 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__31334__delegate.call(this, c1, c2, colls)
    };
    G__31334.cljs$lang$maxFixedArity = 2;
    G__31334.cljs$lang$applyTo = function(arglist__31335) {
      var c1 = cljs.core.first(arglist__31335);
      var c2 = cljs.core.first(cljs.core.next(arglist__31335));
      var colls = cljs.core.rest(cljs.core.next(arglist__31335));
      return G__31334__delegate(c1, c2, colls)
    };
    G__31334.cljs$lang$arity$variadic = G__31334__delegate;
    return G__31334
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__31345 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____31343 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____31343) {
        var coll__31344 = temp__3971__auto____31343;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__31344), cat.call(null, cljs.core.rest.call(null, coll__31344), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__31345.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__31346__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__31346 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__31346__delegate.call(this, f, coll, colls)
    };
    G__31346.cljs$lang$maxFixedArity = 2;
    G__31346.cljs$lang$applyTo = function(arglist__31347) {
      var f = cljs.core.first(arglist__31347);
      var coll = cljs.core.first(cljs.core.next(arglist__31347));
      var colls = cljs.core.rest(cljs.core.next(arglist__31347));
      return G__31346__delegate(f, coll, colls)
    };
    G__31346.cljs$lang$arity$variadic = G__31346__delegate;
    return G__31346
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____31357 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____31357) {
      var s__31358 = temp__3974__auto____31357;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__31358)) {
        var c__31359 = cljs.core.chunk_first.call(null, s__31358);
        var size__31360 = cljs.core.count.call(null, c__31359);
        var b__31361 = cljs.core.chunk_buffer.call(null, size__31360);
        var n__6858__auto____31362 = size__31360;
        var i__31363 = 0;
        while(true) {
          if(i__31363 < n__6858__auto____31362) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__31359, i__31363)))) {
              cljs.core.chunk_append.call(null, b__31361, cljs.core._nth.call(null, c__31359, i__31363))
            }else {
            }
            var G__31366 = i__31363 + 1;
            i__31363 = G__31366;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__31361), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__31358)))
      }else {
        var f__31364 = cljs.core.first.call(null, s__31358);
        var r__31365 = cljs.core.rest.call(null, s__31358);
        if(cljs.core.truth_(pred.call(null, f__31364))) {
          return cljs.core.cons.call(null, f__31364, filter.call(null, pred, r__31365))
        }else {
          return filter.call(null, pred, r__31365)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__31369 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__31369.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__31367_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__31367_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__31373__31374 = to;
    if(G__31373__31374) {
      if(function() {
        var or__3824__auto____31375 = G__31373__31374.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____31375) {
          return or__3824__auto____31375
        }else {
          return G__31373__31374.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__31373__31374.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__31373__31374)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__31373__31374)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__31376__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__31376 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__31376__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__31376.cljs$lang$maxFixedArity = 4;
    G__31376.cljs$lang$applyTo = function(arglist__31377) {
      var f = cljs.core.first(arglist__31377);
      var c1 = cljs.core.first(cljs.core.next(arglist__31377));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31377)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__31377))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__31377))));
      return G__31376__delegate(f, c1, c2, c3, colls)
    };
    G__31376.cljs$lang$arity$variadic = G__31376__delegate;
    return G__31376
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____31384 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____31384) {
        var s__31385 = temp__3974__auto____31384;
        var p__31386 = cljs.core.take.call(null, n, s__31385);
        if(n === cljs.core.count.call(null, p__31386)) {
          return cljs.core.cons.call(null, p__31386, partition.call(null, n, step, cljs.core.drop.call(null, step, s__31385)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____31387 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____31387) {
        var s__31388 = temp__3974__auto____31387;
        var p__31389 = cljs.core.take.call(null, n, s__31388);
        if(n === cljs.core.count.call(null, p__31389)) {
          return cljs.core.cons.call(null, p__31389, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__31388)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__31389, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__31394 = cljs.core.lookup_sentinel;
    var m__31395 = m;
    var ks__31396 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__31396) {
        var m__31397 = cljs.core._lookup.call(null, m__31395, cljs.core.first.call(null, ks__31396), sentinel__31394);
        if(sentinel__31394 === m__31397) {
          return not_found
        }else {
          var G__31398 = sentinel__31394;
          var G__31399 = m__31397;
          var G__31400 = cljs.core.next.call(null, ks__31396);
          sentinel__31394 = G__31398;
          m__31395 = G__31399;
          ks__31396 = G__31400;
          continue
        }
      }else {
        return m__31395
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__31401, v) {
  var vec__31406__31407 = p__31401;
  var k__31408 = cljs.core.nth.call(null, vec__31406__31407, 0, null);
  var ks__31409 = cljs.core.nthnext.call(null, vec__31406__31407, 1);
  if(cljs.core.truth_(ks__31409)) {
    return cljs.core.assoc.call(null, m, k__31408, assoc_in.call(null, cljs.core._lookup.call(null, m, k__31408, null), ks__31409, v))
  }else {
    return cljs.core.assoc.call(null, m, k__31408, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__31410, f, args) {
    var vec__31415__31416 = p__31410;
    var k__31417 = cljs.core.nth.call(null, vec__31415__31416, 0, null);
    var ks__31418 = cljs.core.nthnext.call(null, vec__31415__31416, 1);
    if(cljs.core.truth_(ks__31418)) {
      return cljs.core.assoc.call(null, m, k__31417, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__31417, null), ks__31418, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__31417, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__31417, null), args))
    }
  };
  var update_in = function(m, p__31410, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__31410, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__31419) {
    var m = cljs.core.first(arglist__31419);
    var p__31410 = cljs.core.first(cljs.core.next(arglist__31419));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__31419)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__31419)));
    return update_in__delegate(m, p__31410, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31422 = this;
  var h__6523__auto____31423 = this__31422.__hash;
  if(!(h__6523__auto____31423 == null)) {
    return h__6523__auto____31423
  }else {
    var h__6523__auto____31424 = cljs.core.hash_coll.call(null, coll);
    this__31422.__hash = h__6523__auto____31424;
    return h__6523__auto____31424
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31425 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31426 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31427 = this;
  var new_array__31428 = this__31427.array.slice();
  new_array__31428[k] = v;
  return new cljs.core.Vector(this__31427.meta, new_array__31428, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__31459 = null;
  var G__31459__2 = function(this_sym31429, k) {
    var this__31431 = this;
    var this_sym31429__31432 = this;
    var coll__31433 = this_sym31429__31432;
    return coll__31433.cljs$core$ILookup$_lookup$arity$2(coll__31433, k)
  };
  var G__31459__3 = function(this_sym31430, k, not_found) {
    var this__31431 = this;
    var this_sym31430__31434 = this;
    var coll__31435 = this_sym31430__31434;
    return coll__31435.cljs$core$ILookup$_lookup$arity$3(coll__31435, k, not_found)
  };
  G__31459 = function(this_sym31430, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31459__2.call(this, this_sym31430, k);
      case 3:
        return G__31459__3.call(this, this_sym31430, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31459
}();
cljs.core.Vector.prototype.apply = function(this_sym31420, args31421) {
  var this__31436 = this;
  return this_sym31420.call.apply(this_sym31420, [this_sym31420].concat(args31421.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31437 = this;
  var new_array__31438 = this__31437.array.slice();
  new_array__31438.push(o);
  return new cljs.core.Vector(this__31437.meta, new_array__31438, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__31439 = this;
  var this__31440 = this;
  return cljs.core.pr_str.call(null, this__31440)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__31441 = this;
  return cljs.core.ci_reduce.call(null, this__31441.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__31442 = this;
  return cljs.core.ci_reduce.call(null, this__31442.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31443 = this;
  if(this__31443.array.length > 0) {
    var vector_seq__31444 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__31443.array.length) {
          return cljs.core.cons.call(null, this__31443.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__31444.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31445 = this;
  return this__31445.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31446 = this;
  var count__31447 = this__31446.array.length;
  if(count__31447 > 0) {
    return this__31446.array[count__31447 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31448 = this;
  if(this__31448.array.length > 0) {
    var new_array__31449 = this__31448.array.slice();
    new_array__31449.pop();
    return new cljs.core.Vector(this__31448.meta, new_array__31449, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__31450 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31451 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31452 = this;
  return new cljs.core.Vector(meta, this__31452.array, this__31452.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31453 = this;
  return this__31453.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31454 = this;
  if(function() {
    var and__3822__auto____31455 = 0 <= n;
    if(and__3822__auto____31455) {
      return n < this__31454.array.length
    }else {
      return and__3822__auto____31455
    }
  }()) {
    return this__31454.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31456 = this;
  if(function() {
    var and__3822__auto____31457 = 0 <= n;
    if(and__3822__auto____31457) {
      return n < this__31456.array.length
    }else {
      return and__3822__auto____31457
    }
  }()) {
    return this__31456.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31458 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__31458.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__6641__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__31461 = pv.cnt;
  if(cnt__31461 < 32) {
    return 0
  }else {
    return cnt__31461 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__31467 = level;
  var ret__31468 = node;
  while(true) {
    if(ll__31467 === 0) {
      return ret__31468
    }else {
      var embed__31469 = ret__31468;
      var r__31470 = cljs.core.pv_fresh_node.call(null, edit);
      var ___31471 = cljs.core.pv_aset.call(null, r__31470, 0, embed__31469);
      var G__31472 = ll__31467 - 5;
      var G__31473 = r__31470;
      ll__31467 = G__31472;
      ret__31468 = G__31473;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__31479 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__31480 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__31479, subidx__31480, tailnode);
    return ret__31479
  }else {
    var child__31481 = cljs.core.pv_aget.call(null, parent, subidx__31480);
    if(!(child__31481 == null)) {
      var node_to_insert__31482 = push_tail.call(null, pv, level - 5, child__31481, tailnode);
      cljs.core.pv_aset.call(null, ret__31479, subidx__31480, node_to_insert__31482);
      return ret__31479
    }else {
      var node_to_insert__31483 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__31479, subidx__31480, node_to_insert__31483);
      return ret__31479
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____31487 = 0 <= i;
    if(and__3822__auto____31487) {
      return i < pv.cnt
    }else {
      return and__3822__auto____31487
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__31488 = pv.root;
      var level__31489 = pv.shift;
      while(true) {
        if(level__31489 > 0) {
          var G__31490 = cljs.core.pv_aget.call(null, node__31488, i >>> level__31489 & 31);
          var G__31491 = level__31489 - 5;
          node__31488 = G__31490;
          level__31489 = G__31491;
          continue
        }else {
          return node__31488.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__31494 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__31494, i & 31, val);
    return ret__31494
  }else {
    var subidx__31495 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__31494, subidx__31495, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__31495), i, val));
    return ret__31494
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__31501 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__31502 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__31501));
    if(function() {
      var and__3822__auto____31503 = new_child__31502 == null;
      if(and__3822__auto____31503) {
        return subidx__31501 === 0
      }else {
        return and__3822__auto____31503
      }
    }()) {
      return null
    }else {
      var ret__31504 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__31504, subidx__31501, new_child__31502);
      return ret__31504
    }
  }else {
    if(subidx__31501 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__31505 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__31505, subidx__31501, null);
        return ret__31505
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31508 = this;
  return new cljs.core.TransientVector(this__31508.cnt, this__31508.shift, cljs.core.tv_editable_root.call(null, this__31508.root), cljs.core.tv_editable_tail.call(null, this__31508.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31509 = this;
  var h__6523__auto____31510 = this__31509.__hash;
  if(!(h__6523__auto____31510 == null)) {
    return h__6523__auto____31510
  }else {
    var h__6523__auto____31511 = cljs.core.hash_coll.call(null, coll);
    this__31509.__hash = h__6523__auto____31511;
    return h__6523__auto____31511
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31512 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31513 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31514 = this;
  if(function() {
    var and__3822__auto____31515 = 0 <= k;
    if(and__3822__auto____31515) {
      return k < this__31514.cnt
    }else {
      return and__3822__auto____31515
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__31516 = this__31514.tail.slice();
      new_tail__31516[k & 31] = v;
      return new cljs.core.PersistentVector(this__31514.meta, this__31514.cnt, this__31514.shift, this__31514.root, new_tail__31516, null)
    }else {
      return new cljs.core.PersistentVector(this__31514.meta, this__31514.cnt, this__31514.shift, cljs.core.do_assoc.call(null, coll, this__31514.shift, this__31514.root, k, v), this__31514.tail, null)
    }
  }else {
    if(k === this__31514.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__31514.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__31564 = null;
  var G__31564__2 = function(this_sym31517, k) {
    var this__31519 = this;
    var this_sym31517__31520 = this;
    var coll__31521 = this_sym31517__31520;
    return coll__31521.cljs$core$ILookup$_lookup$arity$2(coll__31521, k)
  };
  var G__31564__3 = function(this_sym31518, k, not_found) {
    var this__31519 = this;
    var this_sym31518__31522 = this;
    var coll__31523 = this_sym31518__31522;
    return coll__31523.cljs$core$ILookup$_lookup$arity$3(coll__31523, k, not_found)
  };
  G__31564 = function(this_sym31518, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31564__2.call(this, this_sym31518, k);
      case 3:
        return G__31564__3.call(this, this_sym31518, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31564
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym31506, args31507) {
  var this__31524 = this;
  return this_sym31506.call.apply(this_sym31506, [this_sym31506].concat(args31507.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__31525 = this;
  var step_init__31526 = [0, init];
  var i__31527 = 0;
  while(true) {
    if(i__31527 < this__31525.cnt) {
      var arr__31528 = cljs.core.array_for.call(null, v, i__31527);
      var len__31529 = arr__31528.length;
      var init__31533 = function() {
        var j__31530 = 0;
        var init__31531 = step_init__31526[1];
        while(true) {
          if(j__31530 < len__31529) {
            var init__31532 = f.call(null, init__31531, j__31530 + i__31527, arr__31528[j__31530]);
            if(cljs.core.reduced_QMARK_.call(null, init__31532)) {
              return init__31532
            }else {
              var G__31565 = j__31530 + 1;
              var G__31566 = init__31532;
              j__31530 = G__31565;
              init__31531 = G__31566;
              continue
            }
          }else {
            step_init__31526[0] = len__31529;
            step_init__31526[1] = init__31531;
            return init__31531
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__31533)) {
        return cljs.core.deref.call(null, init__31533)
      }else {
        var G__31567 = i__31527 + step_init__31526[0];
        i__31527 = G__31567;
        continue
      }
    }else {
      return step_init__31526[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31534 = this;
  if(this__31534.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__31535 = this__31534.tail.slice();
    new_tail__31535.push(o);
    return new cljs.core.PersistentVector(this__31534.meta, this__31534.cnt + 1, this__31534.shift, this__31534.root, new_tail__31535, null)
  }else {
    var root_overflow_QMARK___31536 = this__31534.cnt >>> 5 > 1 << this__31534.shift;
    var new_shift__31537 = root_overflow_QMARK___31536 ? this__31534.shift + 5 : this__31534.shift;
    var new_root__31539 = root_overflow_QMARK___31536 ? function() {
      var n_r__31538 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__31538, 0, this__31534.root);
      cljs.core.pv_aset.call(null, n_r__31538, 1, cljs.core.new_path.call(null, null, this__31534.shift, new cljs.core.VectorNode(null, this__31534.tail)));
      return n_r__31538
    }() : cljs.core.push_tail.call(null, coll, this__31534.shift, this__31534.root, new cljs.core.VectorNode(null, this__31534.tail));
    return new cljs.core.PersistentVector(this__31534.meta, this__31534.cnt + 1, new_shift__31537, new_root__31539, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__31540 = this;
  if(this__31540.cnt > 0) {
    return new cljs.core.RSeq(coll, this__31540.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__31541 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__31542 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__31543 = this;
  var this__31544 = this;
  return cljs.core.pr_str.call(null, this__31544)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__31545 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__31546 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31547 = this;
  if(this__31547.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31548 = this;
  return this__31548.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31549 = this;
  if(this__31549.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__31549.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31550 = this;
  if(this__31550.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__31550.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__31550.meta)
    }else {
      if(1 < this__31550.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__31550.meta, this__31550.cnt - 1, this__31550.shift, this__31550.root, this__31550.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__31551 = cljs.core.array_for.call(null, coll, this__31550.cnt - 2);
          var nr__31552 = cljs.core.pop_tail.call(null, coll, this__31550.shift, this__31550.root);
          var new_root__31553 = nr__31552 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__31552;
          var cnt_1__31554 = this__31550.cnt - 1;
          if(function() {
            var and__3822__auto____31555 = 5 < this__31550.shift;
            if(and__3822__auto____31555) {
              return cljs.core.pv_aget.call(null, new_root__31553, 1) == null
            }else {
              return and__3822__auto____31555
            }
          }()) {
            return new cljs.core.PersistentVector(this__31550.meta, cnt_1__31554, this__31550.shift - 5, cljs.core.pv_aget.call(null, new_root__31553, 0), new_tail__31551, null)
          }else {
            return new cljs.core.PersistentVector(this__31550.meta, cnt_1__31554, this__31550.shift, new_root__31553, new_tail__31551, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__31556 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31557 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31558 = this;
  return new cljs.core.PersistentVector(meta, this__31558.cnt, this__31558.shift, this__31558.root, this__31558.tail, this__31558.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31559 = this;
  return this__31559.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31560 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31561 = this;
  if(function() {
    var and__3822__auto____31562 = 0 <= n;
    if(and__3822__auto____31562) {
      return n < this__31561.cnt
    }else {
      return and__3822__auto____31562
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31563 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__31563.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__31568 = xs.length;
  var xs__31569 = no_clone === true ? xs : xs.slice();
  if(l__31568 < 32) {
    return new cljs.core.PersistentVector(null, l__31568, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__31569, null)
  }else {
    var node__31570 = xs__31569.slice(0, 32);
    var v__31571 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__31570, null);
    var i__31572 = 32;
    var out__31573 = cljs.core._as_transient.call(null, v__31571);
    while(true) {
      if(i__31572 < l__31568) {
        var G__31574 = i__31572 + 1;
        var G__31575 = cljs.core.conj_BANG_.call(null, out__31573, xs__31569[i__31572]);
        i__31572 = G__31574;
        out__31573 = G__31575;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__31573)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__31576) {
    var args = cljs.core.seq(arglist__31576);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__31577 = this;
  if(this__31577.off + 1 < this__31577.node.length) {
    var s__31578 = cljs.core.chunked_seq.call(null, this__31577.vec, this__31577.node, this__31577.i, this__31577.off + 1);
    if(s__31578 == null) {
      return null
    }else {
      return s__31578
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31579 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31580 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31581 = this;
  return this__31581.node[this__31581.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31582 = this;
  if(this__31582.off + 1 < this__31582.node.length) {
    var s__31583 = cljs.core.chunked_seq.call(null, this__31582.vec, this__31582.node, this__31582.i, this__31582.off + 1);
    if(s__31583 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__31583
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__31584 = this;
  var l__31585 = this__31584.node.length;
  var s__31586 = this__31584.i + l__31585 < cljs.core._count.call(null, this__31584.vec) ? cljs.core.chunked_seq.call(null, this__31584.vec, this__31584.i + l__31585, 0) : null;
  if(s__31586 == null) {
    return null
  }else {
    return s__31586
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31587 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__31588 = this;
  return cljs.core.chunked_seq.call(null, this__31588.vec, this__31588.node, this__31588.i, this__31588.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__31589 = this;
  return this__31589.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31590 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__31590.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__31591 = this;
  return cljs.core.array_chunk.call(null, this__31591.node, this__31591.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__31592 = this;
  var l__31593 = this__31592.node.length;
  var s__31594 = this__31592.i + l__31593 < cljs.core._count.call(null, this__31592.vec) ? cljs.core.chunked_seq.call(null, this__31592.vec, this__31592.i + l__31593, 0) : null;
  if(s__31594 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__31594
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31597 = this;
  var h__6523__auto____31598 = this__31597.__hash;
  if(!(h__6523__auto____31598 == null)) {
    return h__6523__auto____31598
  }else {
    var h__6523__auto____31599 = cljs.core.hash_coll.call(null, coll);
    this__31597.__hash = h__6523__auto____31599;
    return h__6523__auto____31599
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31600 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31601 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__31602 = this;
  var v_pos__31603 = this__31602.start + key;
  return new cljs.core.Subvec(this__31602.meta, cljs.core._assoc.call(null, this__31602.v, v_pos__31603, val), this__31602.start, this__31602.end > v_pos__31603 + 1 ? this__31602.end : v_pos__31603 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__31629 = null;
  var G__31629__2 = function(this_sym31604, k) {
    var this__31606 = this;
    var this_sym31604__31607 = this;
    var coll__31608 = this_sym31604__31607;
    return coll__31608.cljs$core$ILookup$_lookup$arity$2(coll__31608, k)
  };
  var G__31629__3 = function(this_sym31605, k, not_found) {
    var this__31606 = this;
    var this_sym31605__31609 = this;
    var coll__31610 = this_sym31605__31609;
    return coll__31610.cljs$core$ILookup$_lookup$arity$3(coll__31610, k, not_found)
  };
  G__31629 = function(this_sym31605, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31629__2.call(this, this_sym31605, k);
      case 3:
        return G__31629__3.call(this, this_sym31605, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31629
}();
cljs.core.Subvec.prototype.apply = function(this_sym31595, args31596) {
  var this__31611 = this;
  return this_sym31595.call.apply(this_sym31595, [this_sym31595].concat(args31596.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31612 = this;
  return new cljs.core.Subvec(this__31612.meta, cljs.core._assoc_n.call(null, this__31612.v, this__31612.end, o), this__31612.start, this__31612.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__31613 = this;
  var this__31614 = this;
  return cljs.core.pr_str.call(null, this__31614)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__31615 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__31616 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31617 = this;
  var subvec_seq__31618 = function subvec_seq(i) {
    if(i === this__31617.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__31617.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__31618.call(null, this__31617.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31619 = this;
  return this__31619.end - this__31619.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31620 = this;
  return cljs.core._nth.call(null, this__31620.v, this__31620.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31621 = this;
  if(this__31621.start === this__31621.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__31621.meta, this__31621.v, this__31621.start, this__31621.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__31622 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31623 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31624 = this;
  return new cljs.core.Subvec(meta, this__31624.v, this__31624.start, this__31624.end, this__31624.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31625 = this;
  return this__31625.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31626 = this;
  return cljs.core._nth.call(null, this__31626.v, this__31626.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31627 = this;
  return cljs.core._nth.call(null, this__31627.v, this__31627.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31628 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__31628.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__31631 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__31631, 0, tl.length);
  return ret__31631
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__31635 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__31636 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__31635, subidx__31636, level === 5 ? tail_node : function() {
    var child__31637 = cljs.core.pv_aget.call(null, ret__31635, subidx__31636);
    if(!(child__31637 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__31637, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__31635
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__31642 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__31643 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__31644 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__31642, subidx__31643));
    if(function() {
      var and__3822__auto____31645 = new_child__31644 == null;
      if(and__3822__auto____31645) {
        return subidx__31643 === 0
      }else {
        return and__3822__auto____31645
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__31642, subidx__31643, new_child__31644);
      return node__31642
    }
  }else {
    if(subidx__31643 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__31642, subidx__31643, null);
        return node__31642
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____31650 = 0 <= i;
    if(and__3822__auto____31650) {
      return i < tv.cnt
    }else {
      return and__3822__auto____31650
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__31651 = tv.root;
      var node__31652 = root__31651;
      var level__31653 = tv.shift;
      while(true) {
        if(level__31653 > 0) {
          var G__31654 = cljs.core.tv_ensure_editable.call(null, root__31651.edit, cljs.core.pv_aget.call(null, node__31652, i >>> level__31653 & 31));
          var G__31655 = level__31653 - 5;
          node__31652 = G__31654;
          level__31653 = G__31655;
          continue
        }else {
          return node__31652.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__31695 = null;
  var G__31695__2 = function(this_sym31658, k) {
    var this__31660 = this;
    var this_sym31658__31661 = this;
    var coll__31662 = this_sym31658__31661;
    return coll__31662.cljs$core$ILookup$_lookup$arity$2(coll__31662, k)
  };
  var G__31695__3 = function(this_sym31659, k, not_found) {
    var this__31660 = this;
    var this_sym31659__31663 = this;
    var coll__31664 = this_sym31659__31663;
    return coll__31664.cljs$core$ILookup$_lookup$arity$3(coll__31664, k, not_found)
  };
  G__31695 = function(this_sym31659, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31695__2.call(this, this_sym31659, k);
      case 3:
        return G__31695__3.call(this, this_sym31659, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31695
}();
cljs.core.TransientVector.prototype.apply = function(this_sym31656, args31657) {
  var this__31665 = this;
  return this_sym31656.call.apply(this_sym31656, [this_sym31656].concat(args31657.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31666 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31667 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31668 = this;
  if(this__31668.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31669 = this;
  if(function() {
    var and__3822__auto____31670 = 0 <= n;
    if(and__3822__auto____31670) {
      return n < this__31669.cnt
    }else {
      return and__3822__auto____31670
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31671 = this;
  if(this__31671.root.edit) {
    return this__31671.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__31672 = this;
  if(this__31672.root.edit) {
    if(function() {
      var and__3822__auto____31673 = 0 <= n;
      if(and__3822__auto____31673) {
        return n < this__31672.cnt
      }else {
        return and__3822__auto____31673
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__31672.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__31678 = function go(level, node) {
          var node__31676 = cljs.core.tv_ensure_editable.call(null, this__31672.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__31676, n & 31, val);
            return node__31676
          }else {
            var subidx__31677 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__31676, subidx__31677, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__31676, subidx__31677)));
            return node__31676
          }
        }.call(null, this__31672.shift, this__31672.root);
        this__31672.root = new_root__31678;
        return tcoll
      }
    }else {
      if(n === this__31672.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__31672.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__31679 = this;
  if(this__31679.root.edit) {
    if(this__31679.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__31679.cnt) {
        this__31679.cnt = 0;
        return tcoll
      }else {
        if((this__31679.cnt - 1 & 31) > 0) {
          this__31679.cnt = this__31679.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__31680 = cljs.core.editable_array_for.call(null, tcoll, this__31679.cnt - 2);
            var new_root__31682 = function() {
              var nr__31681 = cljs.core.tv_pop_tail.call(null, tcoll, this__31679.shift, this__31679.root);
              if(!(nr__31681 == null)) {
                return nr__31681
              }else {
                return new cljs.core.VectorNode(this__31679.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____31683 = 5 < this__31679.shift;
              if(and__3822__auto____31683) {
                return cljs.core.pv_aget.call(null, new_root__31682, 1) == null
              }else {
                return and__3822__auto____31683
              }
            }()) {
              var new_root__31684 = cljs.core.tv_ensure_editable.call(null, this__31679.root.edit, cljs.core.pv_aget.call(null, new_root__31682, 0));
              this__31679.root = new_root__31684;
              this__31679.shift = this__31679.shift - 5;
              this__31679.cnt = this__31679.cnt - 1;
              this__31679.tail = new_tail__31680;
              return tcoll
            }else {
              this__31679.root = new_root__31682;
              this__31679.cnt = this__31679.cnt - 1;
              this__31679.tail = new_tail__31680;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__31685 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__31686 = this;
  if(this__31686.root.edit) {
    if(this__31686.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__31686.tail[this__31686.cnt & 31] = o;
      this__31686.cnt = this__31686.cnt + 1;
      return tcoll
    }else {
      var tail_node__31687 = new cljs.core.VectorNode(this__31686.root.edit, this__31686.tail);
      var new_tail__31688 = cljs.core.make_array.call(null, 32);
      new_tail__31688[0] = o;
      this__31686.tail = new_tail__31688;
      if(this__31686.cnt >>> 5 > 1 << this__31686.shift) {
        var new_root_array__31689 = cljs.core.make_array.call(null, 32);
        var new_shift__31690 = this__31686.shift + 5;
        new_root_array__31689[0] = this__31686.root;
        new_root_array__31689[1] = cljs.core.new_path.call(null, this__31686.root.edit, this__31686.shift, tail_node__31687);
        this__31686.root = new cljs.core.VectorNode(this__31686.root.edit, new_root_array__31689);
        this__31686.shift = new_shift__31690;
        this__31686.cnt = this__31686.cnt + 1;
        return tcoll
      }else {
        var new_root__31691 = cljs.core.tv_push_tail.call(null, tcoll, this__31686.shift, this__31686.root, tail_node__31687);
        this__31686.root = new_root__31691;
        this__31686.cnt = this__31686.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__31692 = this;
  if(this__31692.root.edit) {
    this__31692.root.edit = null;
    var len__31693 = this__31692.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__31694 = cljs.core.make_array.call(null, len__31693);
    cljs.core.array_copy.call(null, this__31692.tail, 0, trimmed_tail__31694, 0, len__31693);
    return new cljs.core.PersistentVector(null, this__31692.cnt, this__31692.shift, this__31692.root, trimmed_tail__31694, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31696 = this;
  var h__6523__auto____31697 = this__31696.__hash;
  if(!(h__6523__auto____31697 == null)) {
    return h__6523__auto____31697
  }else {
    var h__6523__auto____31698 = cljs.core.hash_coll.call(null, coll);
    this__31696.__hash = h__6523__auto____31698;
    return h__6523__auto____31698
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31699 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__31700 = this;
  var this__31701 = this;
  return cljs.core.pr_str.call(null, this__31701)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31702 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31703 = this;
  return cljs.core._first.call(null, this__31703.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31704 = this;
  var temp__3971__auto____31705 = cljs.core.next.call(null, this__31704.front);
  if(temp__3971__auto____31705) {
    var f1__31706 = temp__3971__auto____31705;
    return new cljs.core.PersistentQueueSeq(this__31704.meta, f1__31706, this__31704.rear, null)
  }else {
    if(this__31704.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__31704.meta, this__31704.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31707 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31708 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__31708.front, this__31708.rear, this__31708.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31709 = this;
  return this__31709.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31710 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__31710.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31711 = this;
  var h__6523__auto____31712 = this__31711.__hash;
  if(!(h__6523__auto____31712 == null)) {
    return h__6523__auto____31712
  }else {
    var h__6523__auto____31713 = cljs.core.hash_coll.call(null, coll);
    this__31711.__hash = h__6523__auto____31713;
    return h__6523__auto____31713
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31714 = this;
  if(cljs.core.truth_(this__31714.front)) {
    return new cljs.core.PersistentQueue(this__31714.meta, this__31714.count + 1, this__31714.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____31715 = this__31714.rear;
      if(cljs.core.truth_(or__3824__auto____31715)) {
        return or__3824__auto____31715
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__31714.meta, this__31714.count + 1, cljs.core.conj.call(null, this__31714.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__31716 = this;
  var this__31717 = this;
  return cljs.core.pr_str.call(null, this__31717)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31718 = this;
  var rear__31719 = cljs.core.seq.call(null, this__31718.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____31720 = this__31718.front;
    if(cljs.core.truth_(or__3824__auto____31720)) {
      return or__3824__auto____31720
    }else {
      return rear__31719
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__31718.front, cljs.core.seq.call(null, rear__31719), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31721 = this;
  return this__31721.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31722 = this;
  return cljs.core._first.call(null, this__31722.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31723 = this;
  if(cljs.core.truth_(this__31723.front)) {
    var temp__3971__auto____31724 = cljs.core.next.call(null, this__31723.front);
    if(temp__3971__auto____31724) {
      var f1__31725 = temp__3971__auto____31724;
      return new cljs.core.PersistentQueue(this__31723.meta, this__31723.count - 1, f1__31725, this__31723.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__31723.meta, this__31723.count - 1, cljs.core.seq.call(null, this__31723.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31726 = this;
  return cljs.core.first.call(null, this__31726.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31727 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31728 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31729 = this;
  return new cljs.core.PersistentQueue(meta, this__31729.count, this__31729.front, this__31729.rear, this__31729.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31730 = this;
  return this__31730.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31731 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__31732 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__31735 = array.length;
  var i__31736 = 0;
  while(true) {
    if(i__31736 < len__31735) {
      if(k === array[i__31736]) {
        return i__31736
      }else {
        var G__31737 = i__31736 + incr;
        i__31736 = G__31737;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__31740 = cljs.core.hash.call(null, a);
  var b__31741 = cljs.core.hash.call(null, b);
  if(a__31740 < b__31741) {
    return-1
  }else {
    if(a__31740 > b__31741) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__31749 = m.keys;
  var len__31750 = ks__31749.length;
  var so__31751 = m.strobj;
  var out__31752 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__31753 = 0;
  var out__31754 = cljs.core.transient$.call(null, out__31752);
  while(true) {
    if(i__31753 < len__31750) {
      var k__31755 = ks__31749[i__31753];
      var G__31756 = i__31753 + 1;
      var G__31757 = cljs.core.assoc_BANG_.call(null, out__31754, k__31755, so__31751[k__31755]);
      i__31753 = G__31756;
      out__31754 = G__31757;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__31754, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__31763 = {};
  var l__31764 = ks.length;
  var i__31765 = 0;
  while(true) {
    if(i__31765 < l__31764) {
      var k__31766 = ks[i__31765];
      new_obj__31763[k__31766] = obj[k__31766];
      var G__31767 = i__31765 + 1;
      i__31765 = G__31767;
      continue
    }else {
    }
    break
  }
  return new_obj__31763
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31770 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31771 = this;
  var h__6523__auto____31772 = this__31771.__hash;
  if(!(h__6523__auto____31772 == null)) {
    return h__6523__auto____31772
  }else {
    var h__6523__auto____31773 = cljs.core.hash_imap.call(null, coll);
    this__31771.__hash = h__6523__auto____31773;
    return h__6523__auto____31773
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31774 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31775 = this;
  if(function() {
    var and__3822__auto____31776 = goog.isString(k);
    if(and__3822__auto____31776) {
      return!(cljs.core.scan_array.call(null, 1, k, this__31775.keys) == null)
    }else {
      return and__3822__auto____31776
    }
  }()) {
    return this__31775.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31777 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____31778 = this__31777.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____31778) {
        return or__3824__auto____31778
      }else {
        return this__31777.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__31777.keys) == null)) {
        var new_strobj__31779 = cljs.core.obj_clone.call(null, this__31777.strobj, this__31777.keys);
        new_strobj__31779[k] = v;
        return new cljs.core.ObjMap(this__31777.meta, this__31777.keys, new_strobj__31779, this__31777.update_count + 1, null)
      }else {
        var new_strobj__31780 = cljs.core.obj_clone.call(null, this__31777.strobj, this__31777.keys);
        var new_keys__31781 = this__31777.keys.slice();
        new_strobj__31780[k] = v;
        new_keys__31781.push(k);
        return new cljs.core.ObjMap(this__31777.meta, new_keys__31781, new_strobj__31780, this__31777.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31782 = this;
  if(function() {
    var and__3822__auto____31783 = goog.isString(k);
    if(and__3822__auto____31783) {
      return!(cljs.core.scan_array.call(null, 1, k, this__31782.keys) == null)
    }else {
      return and__3822__auto____31783
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__31805 = null;
  var G__31805__2 = function(this_sym31784, k) {
    var this__31786 = this;
    var this_sym31784__31787 = this;
    var coll__31788 = this_sym31784__31787;
    return coll__31788.cljs$core$ILookup$_lookup$arity$2(coll__31788, k)
  };
  var G__31805__3 = function(this_sym31785, k, not_found) {
    var this__31786 = this;
    var this_sym31785__31789 = this;
    var coll__31790 = this_sym31785__31789;
    return coll__31790.cljs$core$ILookup$_lookup$arity$3(coll__31790, k, not_found)
  };
  G__31805 = function(this_sym31785, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31805__2.call(this, this_sym31785, k);
      case 3:
        return G__31805__3.call(this, this_sym31785, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31805
}();
cljs.core.ObjMap.prototype.apply = function(this_sym31768, args31769) {
  var this__31791 = this;
  return this_sym31768.call.apply(this_sym31768, [this_sym31768].concat(args31769.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31792 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__31793 = this;
  var this__31794 = this;
  return cljs.core.pr_str.call(null, this__31794)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31795 = this;
  if(this__31795.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__31758_SHARP_) {
      return cljs.core.vector.call(null, p1__31758_SHARP_, this__31795.strobj[p1__31758_SHARP_])
    }, this__31795.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31796 = this;
  return this__31796.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31797 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31798 = this;
  return new cljs.core.ObjMap(meta, this__31798.keys, this__31798.strobj, this__31798.update_count, this__31798.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31799 = this;
  return this__31799.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31800 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__31800.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31801 = this;
  if(function() {
    var and__3822__auto____31802 = goog.isString(k);
    if(and__3822__auto____31802) {
      return!(cljs.core.scan_array.call(null, 1, k, this__31801.keys) == null)
    }else {
      return and__3822__auto____31802
    }
  }()) {
    var new_keys__31803 = this__31801.keys.slice();
    var new_strobj__31804 = cljs.core.obj_clone.call(null, this__31801.strobj, this__31801.keys);
    new_keys__31803.splice(cljs.core.scan_array.call(null, 1, k, new_keys__31803), 1);
    cljs.core.js_delete.call(null, new_strobj__31804, k);
    return new cljs.core.ObjMap(this__31801.meta, new_keys__31803, new_strobj__31804, this__31801.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31809 = this;
  var h__6523__auto____31810 = this__31809.__hash;
  if(!(h__6523__auto____31810 == null)) {
    return h__6523__auto____31810
  }else {
    var h__6523__auto____31811 = cljs.core.hash_imap.call(null, coll);
    this__31809.__hash = h__6523__auto____31811;
    return h__6523__auto____31811
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31812 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31813 = this;
  var bucket__31814 = this__31813.hashobj[cljs.core.hash.call(null, k)];
  var i__31815 = cljs.core.truth_(bucket__31814) ? cljs.core.scan_array.call(null, 2, k, bucket__31814) : null;
  if(cljs.core.truth_(i__31815)) {
    return bucket__31814[i__31815 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31816 = this;
  var h__31817 = cljs.core.hash.call(null, k);
  var bucket__31818 = this__31816.hashobj[h__31817];
  if(cljs.core.truth_(bucket__31818)) {
    var new_bucket__31819 = bucket__31818.slice();
    var new_hashobj__31820 = goog.object.clone(this__31816.hashobj);
    new_hashobj__31820[h__31817] = new_bucket__31819;
    var temp__3971__auto____31821 = cljs.core.scan_array.call(null, 2, k, new_bucket__31819);
    if(cljs.core.truth_(temp__3971__auto____31821)) {
      var i__31822 = temp__3971__auto____31821;
      new_bucket__31819[i__31822 + 1] = v;
      return new cljs.core.HashMap(this__31816.meta, this__31816.count, new_hashobj__31820, null)
    }else {
      new_bucket__31819.push(k, v);
      return new cljs.core.HashMap(this__31816.meta, this__31816.count + 1, new_hashobj__31820, null)
    }
  }else {
    var new_hashobj__31823 = goog.object.clone(this__31816.hashobj);
    new_hashobj__31823[h__31817] = [k, v];
    return new cljs.core.HashMap(this__31816.meta, this__31816.count + 1, new_hashobj__31823, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31824 = this;
  var bucket__31825 = this__31824.hashobj[cljs.core.hash.call(null, k)];
  var i__31826 = cljs.core.truth_(bucket__31825) ? cljs.core.scan_array.call(null, 2, k, bucket__31825) : null;
  if(cljs.core.truth_(i__31826)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__31851 = null;
  var G__31851__2 = function(this_sym31827, k) {
    var this__31829 = this;
    var this_sym31827__31830 = this;
    var coll__31831 = this_sym31827__31830;
    return coll__31831.cljs$core$ILookup$_lookup$arity$2(coll__31831, k)
  };
  var G__31851__3 = function(this_sym31828, k, not_found) {
    var this__31829 = this;
    var this_sym31828__31832 = this;
    var coll__31833 = this_sym31828__31832;
    return coll__31833.cljs$core$ILookup$_lookup$arity$3(coll__31833, k, not_found)
  };
  G__31851 = function(this_sym31828, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31851__2.call(this, this_sym31828, k);
      case 3:
        return G__31851__3.call(this, this_sym31828, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31851
}();
cljs.core.HashMap.prototype.apply = function(this_sym31807, args31808) {
  var this__31834 = this;
  return this_sym31807.call.apply(this_sym31807, [this_sym31807].concat(args31808.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31835 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__31836 = this;
  var this__31837 = this;
  return cljs.core.pr_str.call(null, this__31837)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31838 = this;
  if(this__31838.count > 0) {
    var hashes__31839 = cljs.core.js_keys.call(null, this__31838.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__31806_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__31838.hashobj[p1__31806_SHARP_]))
    }, hashes__31839)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31840 = this;
  return this__31840.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31841 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31842 = this;
  return new cljs.core.HashMap(meta, this__31842.count, this__31842.hashobj, this__31842.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31843 = this;
  return this__31843.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31844 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__31844.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31845 = this;
  var h__31846 = cljs.core.hash.call(null, k);
  var bucket__31847 = this__31845.hashobj[h__31846];
  var i__31848 = cljs.core.truth_(bucket__31847) ? cljs.core.scan_array.call(null, 2, k, bucket__31847) : null;
  if(cljs.core.not.call(null, i__31848)) {
    return coll
  }else {
    var new_hashobj__31849 = goog.object.clone(this__31845.hashobj);
    if(3 > bucket__31847.length) {
      cljs.core.js_delete.call(null, new_hashobj__31849, h__31846)
    }else {
      var new_bucket__31850 = bucket__31847.slice();
      new_bucket__31850.splice(i__31848, 2);
      new_hashobj__31849[h__31846] = new_bucket__31850
    }
    return new cljs.core.HashMap(this__31845.meta, this__31845.count - 1, new_hashobj__31849, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__31852 = ks.length;
  var i__31853 = 0;
  var out__31854 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__31853 < len__31852) {
      var G__31855 = i__31853 + 1;
      var G__31856 = cljs.core.assoc.call(null, out__31854, ks[i__31853], vs[i__31853]);
      i__31853 = G__31855;
      out__31854 = G__31856;
      continue
    }else {
      return out__31854
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__31860 = m.arr;
  var len__31861 = arr__31860.length;
  var i__31862 = 0;
  while(true) {
    if(len__31861 <= i__31862) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__31860[i__31862], k)) {
        return i__31862
      }else {
        if("\ufdd0'else") {
          var G__31863 = i__31862 + 2;
          i__31862 = G__31863;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31866 = this;
  return new cljs.core.TransientArrayMap({}, this__31866.arr.length, this__31866.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31867 = this;
  var h__6523__auto____31868 = this__31867.__hash;
  if(!(h__6523__auto____31868 == null)) {
    return h__6523__auto____31868
  }else {
    var h__6523__auto____31869 = cljs.core.hash_imap.call(null, coll);
    this__31867.__hash = h__6523__auto____31869;
    return h__6523__auto____31869
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31870 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31871 = this;
  var idx__31872 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31872 === -1) {
    return not_found
  }else {
    return this__31871.arr[idx__31872 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31873 = this;
  var idx__31874 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31874 === -1) {
    if(this__31873.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__31873.meta, this__31873.cnt + 1, function() {
        var G__31875__31876 = this__31873.arr.slice();
        G__31875__31876.push(k);
        G__31875__31876.push(v);
        return G__31875__31876
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__31873.arr[idx__31874 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__31873.meta, this__31873.cnt, function() {
          var G__31877__31878 = this__31873.arr.slice();
          G__31877__31878[idx__31874 + 1] = v;
          return G__31877__31878
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31879 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__31911 = null;
  var G__31911__2 = function(this_sym31880, k) {
    var this__31882 = this;
    var this_sym31880__31883 = this;
    var coll__31884 = this_sym31880__31883;
    return coll__31884.cljs$core$ILookup$_lookup$arity$2(coll__31884, k)
  };
  var G__31911__3 = function(this_sym31881, k, not_found) {
    var this__31882 = this;
    var this_sym31881__31885 = this;
    var coll__31886 = this_sym31881__31885;
    return coll__31886.cljs$core$ILookup$_lookup$arity$3(coll__31886, k, not_found)
  };
  G__31911 = function(this_sym31881, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31911__2.call(this, this_sym31881, k);
      case 3:
        return G__31911__3.call(this, this_sym31881, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31911
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym31864, args31865) {
  var this__31887 = this;
  return this_sym31864.call.apply(this_sym31864, [this_sym31864].concat(args31865.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__31888 = this;
  var len__31889 = this__31888.arr.length;
  var i__31890 = 0;
  var init__31891 = init;
  while(true) {
    if(i__31890 < len__31889) {
      var init__31892 = f.call(null, init__31891, this__31888.arr[i__31890], this__31888.arr[i__31890 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__31892)) {
        return cljs.core.deref.call(null, init__31892)
      }else {
        var G__31912 = i__31890 + 2;
        var G__31913 = init__31892;
        i__31890 = G__31912;
        init__31891 = G__31913;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31893 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__31894 = this;
  var this__31895 = this;
  return cljs.core.pr_str.call(null, this__31895)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31896 = this;
  if(this__31896.cnt > 0) {
    var len__31897 = this__31896.arr.length;
    var array_map_seq__31898 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__31897) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__31896.arr[i], this__31896.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__31898.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31899 = this;
  return this__31899.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31900 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31901 = this;
  return new cljs.core.PersistentArrayMap(meta, this__31901.cnt, this__31901.arr, this__31901.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31902 = this;
  return this__31902.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31903 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__31903.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31904 = this;
  var idx__31905 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31905 >= 0) {
    var len__31906 = this__31904.arr.length;
    var new_len__31907 = len__31906 - 2;
    if(new_len__31907 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__31908 = cljs.core.make_array.call(null, new_len__31907);
      var s__31909 = 0;
      var d__31910 = 0;
      while(true) {
        if(s__31909 >= len__31906) {
          return new cljs.core.PersistentArrayMap(this__31904.meta, this__31904.cnt - 1, new_arr__31908, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__31904.arr[s__31909])) {
            var G__31914 = s__31909 + 2;
            var G__31915 = d__31910;
            s__31909 = G__31914;
            d__31910 = G__31915;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__31908[d__31910] = this__31904.arr[s__31909];
              new_arr__31908[d__31910 + 1] = this__31904.arr[s__31909 + 1];
              var G__31916 = s__31909 + 2;
              var G__31917 = d__31910 + 2;
              s__31909 = G__31916;
              d__31910 = G__31917;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__31918 = cljs.core.count.call(null, ks);
  var i__31919 = 0;
  var out__31920 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__31919 < len__31918) {
      var G__31921 = i__31919 + 1;
      var G__31922 = cljs.core.assoc_BANG_.call(null, out__31920, ks[i__31919], vs[i__31919]);
      i__31919 = G__31921;
      out__31920 = G__31922;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__31920)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__31923 = this;
  if(cljs.core.truth_(this__31923.editable_QMARK_)) {
    var idx__31924 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__31924 >= 0) {
      this__31923.arr[idx__31924] = this__31923.arr[this__31923.len - 2];
      this__31923.arr[idx__31924 + 1] = this__31923.arr[this__31923.len - 1];
      var G__31925__31926 = this__31923.arr;
      G__31925__31926.pop();
      G__31925__31926.pop();
      G__31925__31926;
      this__31923.len = this__31923.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__31927 = this;
  if(cljs.core.truth_(this__31927.editable_QMARK_)) {
    var idx__31928 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__31928 === -1) {
      if(this__31927.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__31927.len = this__31927.len + 2;
        this__31927.arr.push(key);
        this__31927.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__31927.len, this__31927.arr), key, val)
      }
    }else {
      if(val === this__31927.arr[idx__31928 + 1]) {
        return tcoll
      }else {
        this__31927.arr[idx__31928 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__31929 = this;
  if(cljs.core.truth_(this__31929.editable_QMARK_)) {
    if(function() {
      var G__31930__31931 = o;
      if(G__31930__31931) {
        if(function() {
          var or__3824__auto____31932 = G__31930__31931.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____31932) {
            return or__3824__auto____31932
          }else {
            return G__31930__31931.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__31930__31931.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31930__31931)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31930__31931)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__31933 = cljs.core.seq.call(null, o);
      var tcoll__31934 = tcoll;
      while(true) {
        var temp__3971__auto____31935 = cljs.core.first.call(null, es__31933);
        if(cljs.core.truth_(temp__3971__auto____31935)) {
          var e__31936 = temp__3971__auto____31935;
          var G__31942 = cljs.core.next.call(null, es__31933);
          var G__31943 = tcoll__31934.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__31934, cljs.core.key.call(null, e__31936), cljs.core.val.call(null, e__31936));
          es__31933 = G__31942;
          tcoll__31934 = G__31943;
          continue
        }else {
          return tcoll__31934
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__31937 = this;
  if(cljs.core.truth_(this__31937.editable_QMARK_)) {
    this__31937.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__31937.len, 2), this__31937.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__31938 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__31939 = this;
  if(cljs.core.truth_(this__31939.editable_QMARK_)) {
    var idx__31940 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__31940 === -1) {
      return not_found
    }else {
      return this__31939.arr[idx__31940 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__31941 = this;
  if(cljs.core.truth_(this__31941.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__31941.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__31946 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__31947 = 0;
  while(true) {
    if(i__31947 < len) {
      var G__31948 = cljs.core.assoc_BANG_.call(null, out__31946, arr[i__31947], arr[i__31947 + 1]);
      var G__31949 = i__31947 + 2;
      out__31946 = G__31948;
      i__31947 = G__31949;
      continue
    }else {
      return out__31946
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__6641__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__31954__31955 = arr.slice();
    G__31954__31955[i] = a;
    return G__31954__31955
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__31956__31957 = arr.slice();
    G__31956__31957[i] = a;
    G__31956__31957[j] = b;
    return G__31956__31957
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__31959 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__31959, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__31959, 2 * i, new_arr__31959.length - 2 * i);
  return new_arr__31959
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__31962 = inode.ensure_editable(edit);
    editable__31962.arr[i] = a;
    return editable__31962
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__31963 = inode.ensure_editable(edit);
    editable__31963.arr[i] = a;
    editable__31963.arr[j] = b;
    return editable__31963
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__31970 = arr.length;
  var i__31971 = 0;
  var init__31972 = init;
  while(true) {
    if(i__31971 < len__31970) {
      var init__31975 = function() {
        var k__31973 = arr[i__31971];
        if(!(k__31973 == null)) {
          return f.call(null, init__31972, k__31973, arr[i__31971 + 1])
        }else {
          var node__31974 = arr[i__31971 + 1];
          if(!(node__31974 == null)) {
            return node__31974.kv_reduce(f, init__31972)
          }else {
            return init__31972
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__31975)) {
        return cljs.core.deref.call(null, init__31975)
      }else {
        var G__31976 = i__31971 + 2;
        var G__31977 = init__31975;
        i__31971 = G__31976;
        init__31972 = G__31977;
        continue
      }
    }else {
      return init__31972
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__31978 = this;
  var inode__31979 = this;
  if(this__31978.bitmap === bit) {
    return null
  }else {
    var editable__31980 = inode__31979.ensure_editable(e);
    var earr__31981 = editable__31980.arr;
    var len__31982 = earr__31981.length;
    editable__31980.bitmap = bit ^ editable__31980.bitmap;
    cljs.core.array_copy.call(null, earr__31981, 2 * (i + 1), earr__31981, 2 * i, len__31982 - 2 * (i + 1));
    earr__31981[len__31982 - 2] = null;
    earr__31981[len__31982 - 1] = null;
    return editable__31980
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__31983 = this;
  var inode__31984 = this;
  var bit__31985 = 1 << (hash >>> shift & 31);
  var idx__31986 = cljs.core.bitmap_indexed_node_index.call(null, this__31983.bitmap, bit__31985);
  if((this__31983.bitmap & bit__31985) === 0) {
    var n__31987 = cljs.core.bit_count.call(null, this__31983.bitmap);
    if(2 * n__31987 < this__31983.arr.length) {
      var editable__31988 = inode__31984.ensure_editable(edit);
      var earr__31989 = editable__31988.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__31989, 2 * idx__31986, earr__31989, 2 * (idx__31986 + 1), 2 * (n__31987 - idx__31986));
      earr__31989[2 * idx__31986] = key;
      earr__31989[2 * idx__31986 + 1] = val;
      editable__31988.bitmap = editable__31988.bitmap | bit__31985;
      return editable__31988
    }else {
      if(n__31987 >= 16) {
        var nodes__31990 = cljs.core.make_array.call(null, 32);
        var jdx__31991 = hash >>> shift & 31;
        nodes__31990[jdx__31991] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__31992 = 0;
        var j__31993 = 0;
        while(true) {
          if(i__31992 < 32) {
            if((this__31983.bitmap >>> i__31992 & 1) === 0) {
              var G__32046 = i__31992 + 1;
              var G__32047 = j__31993;
              i__31992 = G__32046;
              j__31993 = G__32047;
              continue
            }else {
              nodes__31990[i__31992] = !(this__31983.arr[j__31993] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__31983.arr[j__31993]), this__31983.arr[j__31993], this__31983.arr[j__31993 + 1], added_leaf_QMARK_) : this__31983.arr[j__31993 + 1];
              var G__32048 = i__31992 + 1;
              var G__32049 = j__31993 + 2;
              i__31992 = G__32048;
              j__31993 = G__32049;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__31987 + 1, nodes__31990)
      }else {
        if("\ufdd0'else") {
          var new_arr__31994 = cljs.core.make_array.call(null, 2 * (n__31987 + 4));
          cljs.core.array_copy.call(null, this__31983.arr, 0, new_arr__31994, 0, 2 * idx__31986);
          new_arr__31994[2 * idx__31986] = key;
          new_arr__31994[2 * idx__31986 + 1] = val;
          cljs.core.array_copy.call(null, this__31983.arr, 2 * idx__31986, new_arr__31994, 2 * (idx__31986 + 1), 2 * (n__31987 - idx__31986));
          added_leaf_QMARK_.val = true;
          var editable__31995 = inode__31984.ensure_editable(edit);
          editable__31995.arr = new_arr__31994;
          editable__31995.bitmap = editable__31995.bitmap | bit__31985;
          return editable__31995
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__31996 = this__31983.arr[2 * idx__31986];
    var val_or_node__31997 = this__31983.arr[2 * idx__31986 + 1];
    if(key_or_nil__31996 == null) {
      var n__31998 = val_or_node__31997.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__31998 === val_or_node__31997) {
        return inode__31984
      }else {
        return cljs.core.edit_and_set.call(null, inode__31984, edit, 2 * idx__31986 + 1, n__31998)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__31996)) {
        if(val === val_or_node__31997) {
          return inode__31984
        }else {
          return cljs.core.edit_and_set.call(null, inode__31984, edit, 2 * idx__31986 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__31984, edit, 2 * idx__31986, null, 2 * idx__31986 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__31996, val_or_node__31997, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__31999 = this;
  var inode__32000 = this;
  return cljs.core.create_inode_seq.call(null, this__31999.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__32001 = this;
  var inode__32002 = this;
  var bit__32003 = 1 << (hash >>> shift & 31);
  if((this__32001.bitmap & bit__32003) === 0) {
    return inode__32002
  }else {
    var idx__32004 = cljs.core.bitmap_indexed_node_index.call(null, this__32001.bitmap, bit__32003);
    var key_or_nil__32005 = this__32001.arr[2 * idx__32004];
    var val_or_node__32006 = this__32001.arr[2 * idx__32004 + 1];
    if(key_or_nil__32005 == null) {
      var n__32007 = val_or_node__32006.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__32007 === val_or_node__32006) {
        return inode__32002
      }else {
        if(!(n__32007 == null)) {
          return cljs.core.edit_and_set.call(null, inode__32002, edit, 2 * idx__32004 + 1, n__32007)
        }else {
          if(this__32001.bitmap === bit__32003) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__32002.edit_and_remove_pair(edit, bit__32003, idx__32004)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__32005)) {
        removed_leaf_QMARK_[0] = true;
        return inode__32002.edit_and_remove_pair(edit, bit__32003, idx__32004)
      }else {
        if("\ufdd0'else") {
          return inode__32002
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__32008 = this;
  var inode__32009 = this;
  if(e === this__32008.edit) {
    return inode__32009
  }else {
    var n__32010 = cljs.core.bit_count.call(null, this__32008.bitmap);
    var new_arr__32011 = cljs.core.make_array.call(null, n__32010 < 0 ? 4 : 2 * (n__32010 + 1));
    cljs.core.array_copy.call(null, this__32008.arr, 0, new_arr__32011, 0, 2 * n__32010);
    return new cljs.core.BitmapIndexedNode(e, this__32008.bitmap, new_arr__32011)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__32012 = this;
  var inode__32013 = this;
  return cljs.core.inode_kv_reduce.call(null, this__32012.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__32014 = this;
  var inode__32015 = this;
  var bit__32016 = 1 << (hash >>> shift & 31);
  if((this__32014.bitmap & bit__32016) === 0) {
    return not_found
  }else {
    var idx__32017 = cljs.core.bitmap_indexed_node_index.call(null, this__32014.bitmap, bit__32016);
    var key_or_nil__32018 = this__32014.arr[2 * idx__32017];
    var val_or_node__32019 = this__32014.arr[2 * idx__32017 + 1];
    if(key_or_nil__32018 == null) {
      return val_or_node__32019.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__32018)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__32018, val_or_node__32019], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__32020 = this;
  var inode__32021 = this;
  var bit__32022 = 1 << (hash >>> shift & 31);
  if((this__32020.bitmap & bit__32022) === 0) {
    return inode__32021
  }else {
    var idx__32023 = cljs.core.bitmap_indexed_node_index.call(null, this__32020.bitmap, bit__32022);
    var key_or_nil__32024 = this__32020.arr[2 * idx__32023];
    var val_or_node__32025 = this__32020.arr[2 * idx__32023 + 1];
    if(key_or_nil__32024 == null) {
      var n__32026 = val_or_node__32025.inode_without(shift + 5, hash, key);
      if(n__32026 === val_or_node__32025) {
        return inode__32021
      }else {
        if(!(n__32026 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__32020.bitmap, cljs.core.clone_and_set.call(null, this__32020.arr, 2 * idx__32023 + 1, n__32026))
        }else {
          if(this__32020.bitmap === bit__32022) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__32020.bitmap ^ bit__32022, cljs.core.remove_pair.call(null, this__32020.arr, idx__32023))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__32024)) {
        return new cljs.core.BitmapIndexedNode(null, this__32020.bitmap ^ bit__32022, cljs.core.remove_pair.call(null, this__32020.arr, idx__32023))
      }else {
        if("\ufdd0'else") {
          return inode__32021
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__32027 = this;
  var inode__32028 = this;
  var bit__32029 = 1 << (hash >>> shift & 31);
  var idx__32030 = cljs.core.bitmap_indexed_node_index.call(null, this__32027.bitmap, bit__32029);
  if((this__32027.bitmap & bit__32029) === 0) {
    var n__32031 = cljs.core.bit_count.call(null, this__32027.bitmap);
    if(n__32031 >= 16) {
      var nodes__32032 = cljs.core.make_array.call(null, 32);
      var jdx__32033 = hash >>> shift & 31;
      nodes__32032[jdx__32033] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__32034 = 0;
      var j__32035 = 0;
      while(true) {
        if(i__32034 < 32) {
          if((this__32027.bitmap >>> i__32034 & 1) === 0) {
            var G__32050 = i__32034 + 1;
            var G__32051 = j__32035;
            i__32034 = G__32050;
            j__32035 = G__32051;
            continue
          }else {
            nodes__32032[i__32034] = !(this__32027.arr[j__32035] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__32027.arr[j__32035]), this__32027.arr[j__32035], this__32027.arr[j__32035 + 1], added_leaf_QMARK_) : this__32027.arr[j__32035 + 1];
            var G__32052 = i__32034 + 1;
            var G__32053 = j__32035 + 2;
            i__32034 = G__32052;
            j__32035 = G__32053;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__32031 + 1, nodes__32032)
    }else {
      var new_arr__32036 = cljs.core.make_array.call(null, 2 * (n__32031 + 1));
      cljs.core.array_copy.call(null, this__32027.arr, 0, new_arr__32036, 0, 2 * idx__32030);
      new_arr__32036[2 * idx__32030] = key;
      new_arr__32036[2 * idx__32030 + 1] = val;
      cljs.core.array_copy.call(null, this__32027.arr, 2 * idx__32030, new_arr__32036, 2 * (idx__32030 + 1), 2 * (n__32031 - idx__32030));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__32027.bitmap | bit__32029, new_arr__32036)
    }
  }else {
    var key_or_nil__32037 = this__32027.arr[2 * idx__32030];
    var val_or_node__32038 = this__32027.arr[2 * idx__32030 + 1];
    if(key_or_nil__32037 == null) {
      var n__32039 = val_or_node__32038.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__32039 === val_or_node__32038) {
        return inode__32028
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__32027.bitmap, cljs.core.clone_and_set.call(null, this__32027.arr, 2 * idx__32030 + 1, n__32039))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__32037)) {
        if(val === val_or_node__32038) {
          return inode__32028
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__32027.bitmap, cljs.core.clone_and_set.call(null, this__32027.arr, 2 * idx__32030 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__32027.bitmap, cljs.core.clone_and_set.call(null, this__32027.arr, 2 * idx__32030, null, 2 * idx__32030 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__32037, val_or_node__32038, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__32040 = this;
  var inode__32041 = this;
  var bit__32042 = 1 << (hash >>> shift & 31);
  if((this__32040.bitmap & bit__32042) === 0) {
    return not_found
  }else {
    var idx__32043 = cljs.core.bitmap_indexed_node_index.call(null, this__32040.bitmap, bit__32042);
    var key_or_nil__32044 = this__32040.arr[2 * idx__32043];
    var val_or_node__32045 = this__32040.arr[2 * idx__32043 + 1];
    if(key_or_nil__32044 == null) {
      return val_or_node__32045.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__32044)) {
        return val_or_node__32045
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__32061 = array_node.arr;
  var len__32062 = 2 * (array_node.cnt - 1);
  var new_arr__32063 = cljs.core.make_array.call(null, len__32062);
  var i__32064 = 0;
  var j__32065 = 1;
  var bitmap__32066 = 0;
  while(true) {
    if(i__32064 < len__32062) {
      if(function() {
        var and__3822__auto____32067 = !(i__32064 === idx);
        if(and__3822__auto____32067) {
          return!(arr__32061[i__32064] == null)
        }else {
          return and__3822__auto____32067
        }
      }()) {
        new_arr__32063[j__32065] = arr__32061[i__32064];
        var G__32068 = i__32064 + 1;
        var G__32069 = j__32065 + 2;
        var G__32070 = bitmap__32066 | 1 << i__32064;
        i__32064 = G__32068;
        j__32065 = G__32069;
        bitmap__32066 = G__32070;
        continue
      }else {
        var G__32071 = i__32064 + 1;
        var G__32072 = j__32065;
        var G__32073 = bitmap__32066;
        i__32064 = G__32071;
        j__32065 = G__32072;
        bitmap__32066 = G__32073;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__32066, new_arr__32063)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__32074 = this;
  var inode__32075 = this;
  var idx__32076 = hash >>> shift & 31;
  var node__32077 = this__32074.arr[idx__32076];
  if(node__32077 == null) {
    var editable__32078 = cljs.core.edit_and_set.call(null, inode__32075, edit, idx__32076, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__32078.cnt = editable__32078.cnt + 1;
    return editable__32078
  }else {
    var n__32079 = node__32077.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__32079 === node__32077) {
      return inode__32075
    }else {
      return cljs.core.edit_and_set.call(null, inode__32075, edit, idx__32076, n__32079)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__32080 = this;
  var inode__32081 = this;
  return cljs.core.create_array_node_seq.call(null, this__32080.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__32082 = this;
  var inode__32083 = this;
  var idx__32084 = hash >>> shift & 31;
  var node__32085 = this__32082.arr[idx__32084];
  if(node__32085 == null) {
    return inode__32083
  }else {
    var n__32086 = node__32085.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__32086 === node__32085) {
      return inode__32083
    }else {
      if(n__32086 == null) {
        if(this__32082.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__32083, edit, idx__32084)
        }else {
          var editable__32087 = cljs.core.edit_and_set.call(null, inode__32083, edit, idx__32084, n__32086);
          editable__32087.cnt = editable__32087.cnt - 1;
          return editable__32087
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__32083, edit, idx__32084, n__32086)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__32088 = this;
  var inode__32089 = this;
  if(e === this__32088.edit) {
    return inode__32089
  }else {
    return new cljs.core.ArrayNode(e, this__32088.cnt, this__32088.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__32090 = this;
  var inode__32091 = this;
  var len__32092 = this__32090.arr.length;
  var i__32093 = 0;
  var init__32094 = init;
  while(true) {
    if(i__32093 < len__32092) {
      var node__32095 = this__32090.arr[i__32093];
      if(!(node__32095 == null)) {
        var init__32096 = node__32095.kv_reduce(f, init__32094);
        if(cljs.core.reduced_QMARK_.call(null, init__32096)) {
          return cljs.core.deref.call(null, init__32096)
        }else {
          var G__32115 = i__32093 + 1;
          var G__32116 = init__32096;
          i__32093 = G__32115;
          init__32094 = G__32116;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__32094
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__32097 = this;
  var inode__32098 = this;
  var idx__32099 = hash >>> shift & 31;
  var node__32100 = this__32097.arr[idx__32099];
  if(!(node__32100 == null)) {
    return node__32100.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__32101 = this;
  var inode__32102 = this;
  var idx__32103 = hash >>> shift & 31;
  var node__32104 = this__32101.arr[idx__32103];
  if(!(node__32104 == null)) {
    var n__32105 = node__32104.inode_without(shift + 5, hash, key);
    if(n__32105 === node__32104) {
      return inode__32102
    }else {
      if(n__32105 == null) {
        if(this__32101.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__32102, null, idx__32103)
        }else {
          return new cljs.core.ArrayNode(null, this__32101.cnt - 1, cljs.core.clone_and_set.call(null, this__32101.arr, idx__32103, n__32105))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__32101.cnt, cljs.core.clone_and_set.call(null, this__32101.arr, idx__32103, n__32105))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__32102
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__32106 = this;
  var inode__32107 = this;
  var idx__32108 = hash >>> shift & 31;
  var node__32109 = this__32106.arr[idx__32108];
  if(node__32109 == null) {
    return new cljs.core.ArrayNode(null, this__32106.cnt + 1, cljs.core.clone_and_set.call(null, this__32106.arr, idx__32108, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__32110 = node__32109.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__32110 === node__32109) {
      return inode__32107
    }else {
      return new cljs.core.ArrayNode(null, this__32106.cnt, cljs.core.clone_and_set.call(null, this__32106.arr, idx__32108, n__32110))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__32111 = this;
  var inode__32112 = this;
  var idx__32113 = hash >>> shift & 31;
  var node__32114 = this__32111.arr[idx__32113];
  if(!(node__32114 == null)) {
    return node__32114.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__32119 = 2 * cnt;
  var i__32120 = 0;
  while(true) {
    if(i__32120 < lim__32119) {
      if(cljs.core.key_test.call(null, key, arr[i__32120])) {
        return i__32120
      }else {
        var G__32121 = i__32120 + 2;
        i__32120 = G__32121;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__32122 = this;
  var inode__32123 = this;
  if(hash === this__32122.collision_hash) {
    var idx__32124 = cljs.core.hash_collision_node_find_index.call(null, this__32122.arr, this__32122.cnt, key);
    if(idx__32124 === -1) {
      if(this__32122.arr.length > 2 * this__32122.cnt) {
        var editable__32125 = cljs.core.edit_and_set.call(null, inode__32123, edit, 2 * this__32122.cnt, key, 2 * this__32122.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__32125.cnt = editable__32125.cnt + 1;
        return editable__32125
      }else {
        var len__32126 = this__32122.arr.length;
        var new_arr__32127 = cljs.core.make_array.call(null, len__32126 + 2);
        cljs.core.array_copy.call(null, this__32122.arr, 0, new_arr__32127, 0, len__32126);
        new_arr__32127[len__32126] = key;
        new_arr__32127[len__32126 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__32123.ensure_editable_array(edit, this__32122.cnt + 1, new_arr__32127)
      }
    }else {
      if(this__32122.arr[idx__32124 + 1] === val) {
        return inode__32123
      }else {
        return cljs.core.edit_and_set.call(null, inode__32123, edit, idx__32124 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__32122.collision_hash >>> shift & 31), [null, inode__32123, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__32128 = this;
  var inode__32129 = this;
  return cljs.core.create_inode_seq.call(null, this__32128.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__32130 = this;
  var inode__32131 = this;
  var idx__32132 = cljs.core.hash_collision_node_find_index.call(null, this__32130.arr, this__32130.cnt, key);
  if(idx__32132 === -1) {
    return inode__32131
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__32130.cnt === 1) {
      return null
    }else {
      var editable__32133 = inode__32131.ensure_editable(edit);
      var earr__32134 = editable__32133.arr;
      earr__32134[idx__32132] = earr__32134[2 * this__32130.cnt - 2];
      earr__32134[idx__32132 + 1] = earr__32134[2 * this__32130.cnt - 1];
      earr__32134[2 * this__32130.cnt - 1] = null;
      earr__32134[2 * this__32130.cnt - 2] = null;
      editable__32133.cnt = editable__32133.cnt - 1;
      return editable__32133
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__32135 = this;
  var inode__32136 = this;
  if(e === this__32135.edit) {
    return inode__32136
  }else {
    var new_arr__32137 = cljs.core.make_array.call(null, 2 * (this__32135.cnt + 1));
    cljs.core.array_copy.call(null, this__32135.arr, 0, new_arr__32137, 0, 2 * this__32135.cnt);
    return new cljs.core.HashCollisionNode(e, this__32135.collision_hash, this__32135.cnt, new_arr__32137)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__32138 = this;
  var inode__32139 = this;
  return cljs.core.inode_kv_reduce.call(null, this__32138.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__32140 = this;
  var inode__32141 = this;
  var idx__32142 = cljs.core.hash_collision_node_find_index.call(null, this__32140.arr, this__32140.cnt, key);
  if(idx__32142 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__32140.arr[idx__32142])) {
      return cljs.core.PersistentVector.fromArray([this__32140.arr[idx__32142], this__32140.arr[idx__32142 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__32143 = this;
  var inode__32144 = this;
  var idx__32145 = cljs.core.hash_collision_node_find_index.call(null, this__32143.arr, this__32143.cnt, key);
  if(idx__32145 === -1) {
    return inode__32144
  }else {
    if(this__32143.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__32143.collision_hash, this__32143.cnt - 1, cljs.core.remove_pair.call(null, this__32143.arr, cljs.core.quot.call(null, idx__32145, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__32146 = this;
  var inode__32147 = this;
  if(hash === this__32146.collision_hash) {
    var idx__32148 = cljs.core.hash_collision_node_find_index.call(null, this__32146.arr, this__32146.cnt, key);
    if(idx__32148 === -1) {
      var len__32149 = this__32146.arr.length;
      var new_arr__32150 = cljs.core.make_array.call(null, len__32149 + 2);
      cljs.core.array_copy.call(null, this__32146.arr, 0, new_arr__32150, 0, len__32149);
      new_arr__32150[len__32149] = key;
      new_arr__32150[len__32149 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__32146.collision_hash, this__32146.cnt + 1, new_arr__32150)
    }else {
      if(cljs.core._EQ_.call(null, this__32146.arr[idx__32148], val)) {
        return inode__32147
      }else {
        return new cljs.core.HashCollisionNode(null, this__32146.collision_hash, this__32146.cnt, cljs.core.clone_and_set.call(null, this__32146.arr, idx__32148 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__32146.collision_hash >>> shift & 31), [null, inode__32147])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__32151 = this;
  var inode__32152 = this;
  var idx__32153 = cljs.core.hash_collision_node_find_index.call(null, this__32151.arr, this__32151.cnt, key);
  if(idx__32153 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__32151.arr[idx__32153])) {
      return this__32151.arr[idx__32153 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__32154 = this;
  var inode__32155 = this;
  if(e === this__32154.edit) {
    this__32154.arr = array;
    this__32154.cnt = count;
    return inode__32155
  }else {
    return new cljs.core.HashCollisionNode(this__32154.edit, this__32154.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__32160 = cljs.core.hash.call(null, key1);
    if(key1hash__32160 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__32160, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___32161 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__32160, key1, val1, added_leaf_QMARK___32161).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___32161)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__32162 = cljs.core.hash.call(null, key1);
    if(key1hash__32162 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__32162, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___32163 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__32162, key1, val1, added_leaf_QMARK___32163).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___32163)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32164 = this;
  var h__6523__auto____32165 = this__32164.__hash;
  if(!(h__6523__auto____32165 == null)) {
    return h__6523__auto____32165
  }else {
    var h__6523__auto____32166 = cljs.core.hash_coll.call(null, coll);
    this__32164.__hash = h__6523__auto____32166;
    return h__6523__auto____32166
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32167 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__32168 = this;
  var this__32169 = this;
  return cljs.core.pr_str.call(null, this__32169)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__32170 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__32171 = this;
  if(this__32171.s == null) {
    return cljs.core.PersistentVector.fromArray([this__32171.nodes[this__32171.i], this__32171.nodes[this__32171.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__32171.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__32172 = this;
  if(this__32172.s == null) {
    return cljs.core.create_inode_seq.call(null, this__32172.nodes, this__32172.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__32172.nodes, this__32172.i, cljs.core.next.call(null, this__32172.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32173 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32174 = this;
  return new cljs.core.NodeSeq(meta, this__32174.nodes, this__32174.i, this__32174.s, this__32174.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32175 = this;
  return this__32175.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32176 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__32176.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__32183 = nodes.length;
      var j__32184 = i;
      while(true) {
        if(j__32184 < len__32183) {
          if(!(nodes[j__32184] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__32184, null, null)
          }else {
            var temp__3971__auto____32185 = nodes[j__32184 + 1];
            if(cljs.core.truth_(temp__3971__auto____32185)) {
              var node__32186 = temp__3971__auto____32185;
              var temp__3971__auto____32187 = node__32186.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____32187)) {
                var node_seq__32188 = temp__3971__auto____32187;
                return new cljs.core.NodeSeq(null, nodes, j__32184 + 2, node_seq__32188, null)
              }else {
                var G__32189 = j__32184 + 2;
                j__32184 = G__32189;
                continue
              }
            }else {
              var G__32190 = j__32184 + 2;
              j__32184 = G__32190;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32191 = this;
  var h__6523__auto____32192 = this__32191.__hash;
  if(!(h__6523__auto____32192 == null)) {
    return h__6523__auto____32192
  }else {
    var h__6523__auto____32193 = cljs.core.hash_coll.call(null, coll);
    this__32191.__hash = h__6523__auto____32193;
    return h__6523__auto____32193
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32194 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__32195 = this;
  var this__32196 = this;
  return cljs.core.pr_str.call(null, this__32196)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__32197 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__32198 = this;
  return cljs.core.first.call(null, this__32198.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__32199 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__32199.nodes, this__32199.i, cljs.core.next.call(null, this__32199.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32200 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32201 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__32201.nodes, this__32201.i, this__32201.s, this__32201.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32202 = this;
  return this__32202.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32203 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__32203.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__32210 = nodes.length;
      var j__32211 = i;
      while(true) {
        if(j__32211 < len__32210) {
          var temp__3971__auto____32212 = nodes[j__32211];
          if(cljs.core.truth_(temp__3971__auto____32212)) {
            var nj__32213 = temp__3971__auto____32212;
            var temp__3971__auto____32214 = nj__32213.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____32214)) {
              var ns__32215 = temp__3971__auto____32214;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__32211 + 1, ns__32215, null)
            }else {
              var G__32216 = j__32211 + 1;
              j__32211 = G__32216;
              continue
            }
          }else {
            var G__32217 = j__32211 + 1;
            j__32211 = G__32217;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__32220 = this;
  return new cljs.core.TransientHashMap({}, this__32220.root, this__32220.cnt, this__32220.has_nil_QMARK_, this__32220.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32221 = this;
  var h__6523__auto____32222 = this__32221.__hash;
  if(!(h__6523__auto____32222 == null)) {
    return h__6523__auto____32222
  }else {
    var h__6523__auto____32223 = cljs.core.hash_imap.call(null, coll);
    this__32221.__hash = h__6523__auto____32223;
    return h__6523__auto____32223
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__32224 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__32225 = this;
  if(k == null) {
    if(this__32225.has_nil_QMARK_) {
      return this__32225.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__32225.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__32225.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__32226 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____32227 = this__32226.has_nil_QMARK_;
      if(and__3822__auto____32227) {
        return v === this__32226.nil_val
      }else {
        return and__3822__auto____32227
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__32226.meta, this__32226.has_nil_QMARK_ ? this__32226.cnt : this__32226.cnt + 1, this__32226.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___32228 = new cljs.core.Box(false);
    var new_root__32229 = (this__32226.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__32226.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___32228);
    if(new_root__32229 === this__32226.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__32226.meta, added_leaf_QMARK___32228.val ? this__32226.cnt + 1 : this__32226.cnt, new_root__32229, this__32226.has_nil_QMARK_, this__32226.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__32230 = this;
  if(k == null) {
    return this__32230.has_nil_QMARK_
  }else {
    if(this__32230.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__32230.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__32253 = null;
  var G__32253__2 = function(this_sym32231, k) {
    var this__32233 = this;
    var this_sym32231__32234 = this;
    var coll__32235 = this_sym32231__32234;
    return coll__32235.cljs$core$ILookup$_lookup$arity$2(coll__32235, k)
  };
  var G__32253__3 = function(this_sym32232, k, not_found) {
    var this__32233 = this;
    var this_sym32232__32236 = this;
    var coll__32237 = this_sym32232__32236;
    return coll__32237.cljs$core$ILookup$_lookup$arity$3(coll__32237, k, not_found)
  };
  G__32253 = function(this_sym32232, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32253__2.call(this, this_sym32232, k);
      case 3:
        return G__32253__3.call(this, this_sym32232, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32253
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym32218, args32219) {
  var this__32238 = this;
  return this_sym32218.call.apply(this_sym32218, [this_sym32218].concat(args32219.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__32239 = this;
  var init__32240 = this__32239.has_nil_QMARK_ ? f.call(null, init, null, this__32239.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__32240)) {
    return cljs.core.deref.call(null, init__32240)
  }else {
    if(!(this__32239.root == null)) {
      return this__32239.root.kv_reduce(f, init__32240)
    }else {
      if("\ufdd0'else") {
        return init__32240
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__32241 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__32242 = this;
  var this__32243 = this;
  return cljs.core.pr_str.call(null, this__32243)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__32244 = this;
  if(this__32244.cnt > 0) {
    var s__32245 = !(this__32244.root == null) ? this__32244.root.inode_seq() : null;
    if(this__32244.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__32244.nil_val], true), s__32245)
    }else {
      return s__32245
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32246 = this;
  return this__32246.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32247 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32248 = this;
  return new cljs.core.PersistentHashMap(meta, this__32248.cnt, this__32248.root, this__32248.has_nil_QMARK_, this__32248.nil_val, this__32248.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32249 = this;
  return this__32249.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32250 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__32250.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__32251 = this;
  if(k == null) {
    if(this__32251.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__32251.meta, this__32251.cnt - 1, this__32251.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__32251.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__32252 = this__32251.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__32252 === this__32251.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__32251.meta, this__32251.cnt - 1, new_root__32252, this__32251.has_nil_QMARK_, this__32251.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__32254 = ks.length;
  var i__32255 = 0;
  var out__32256 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__32255 < len__32254) {
      var G__32257 = i__32255 + 1;
      var G__32258 = cljs.core.assoc_BANG_.call(null, out__32256, ks[i__32255], vs[i__32255]);
      i__32255 = G__32257;
      out__32256 = G__32258;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__32256)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__32259 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__32260 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__32261 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__32262 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__32263 = this;
  if(k == null) {
    if(this__32263.has_nil_QMARK_) {
      return this__32263.nil_val
    }else {
      return null
    }
  }else {
    if(this__32263.root == null) {
      return null
    }else {
      return this__32263.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__32264 = this;
  if(k == null) {
    if(this__32264.has_nil_QMARK_) {
      return this__32264.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__32264.root == null) {
      return not_found
    }else {
      return this__32264.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32265 = this;
  if(this__32265.edit) {
    return this__32265.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__32266 = this;
  var tcoll__32267 = this;
  if(this__32266.edit) {
    if(function() {
      var G__32268__32269 = o;
      if(G__32268__32269) {
        if(function() {
          var or__3824__auto____32270 = G__32268__32269.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____32270) {
            return or__3824__auto____32270
          }else {
            return G__32268__32269.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__32268__32269.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__32268__32269)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__32268__32269)
      }
    }()) {
      return tcoll__32267.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__32271 = cljs.core.seq.call(null, o);
      var tcoll__32272 = tcoll__32267;
      while(true) {
        var temp__3971__auto____32273 = cljs.core.first.call(null, es__32271);
        if(cljs.core.truth_(temp__3971__auto____32273)) {
          var e__32274 = temp__3971__auto____32273;
          var G__32285 = cljs.core.next.call(null, es__32271);
          var G__32286 = tcoll__32272.assoc_BANG_(cljs.core.key.call(null, e__32274), cljs.core.val.call(null, e__32274));
          es__32271 = G__32285;
          tcoll__32272 = G__32286;
          continue
        }else {
          return tcoll__32272
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__32275 = this;
  var tcoll__32276 = this;
  if(this__32275.edit) {
    if(k == null) {
      if(this__32275.nil_val === v) {
      }else {
        this__32275.nil_val = v
      }
      if(this__32275.has_nil_QMARK_) {
      }else {
        this__32275.count = this__32275.count + 1;
        this__32275.has_nil_QMARK_ = true
      }
      return tcoll__32276
    }else {
      var added_leaf_QMARK___32277 = new cljs.core.Box(false);
      var node__32278 = (this__32275.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__32275.root).inode_assoc_BANG_(this__32275.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___32277);
      if(node__32278 === this__32275.root) {
      }else {
        this__32275.root = node__32278
      }
      if(added_leaf_QMARK___32277.val) {
        this__32275.count = this__32275.count + 1
      }else {
      }
      return tcoll__32276
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__32279 = this;
  var tcoll__32280 = this;
  if(this__32279.edit) {
    if(k == null) {
      if(this__32279.has_nil_QMARK_) {
        this__32279.has_nil_QMARK_ = false;
        this__32279.nil_val = null;
        this__32279.count = this__32279.count - 1;
        return tcoll__32280
      }else {
        return tcoll__32280
      }
    }else {
      if(this__32279.root == null) {
        return tcoll__32280
      }else {
        var removed_leaf_QMARK___32281 = new cljs.core.Box(false);
        var node__32282 = this__32279.root.inode_without_BANG_(this__32279.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___32281);
        if(node__32282 === this__32279.root) {
        }else {
          this__32279.root = node__32282
        }
        if(cljs.core.truth_(removed_leaf_QMARK___32281[0])) {
          this__32279.count = this__32279.count - 1
        }else {
        }
        return tcoll__32280
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__32283 = this;
  var tcoll__32284 = this;
  if(this__32283.edit) {
    this__32283.edit = null;
    return new cljs.core.PersistentHashMap(null, this__32283.count, this__32283.root, this__32283.has_nil_QMARK_, this__32283.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__32289 = node;
  var stack__32290 = stack;
  while(true) {
    if(!(t__32289 == null)) {
      var G__32291 = ascending_QMARK_ ? t__32289.left : t__32289.right;
      var G__32292 = cljs.core.conj.call(null, stack__32290, t__32289);
      t__32289 = G__32291;
      stack__32290 = G__32292;
      continue
    }else {
      return stack__32290
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32293 = this;
  var h__6523__auto____32294 = this__32293.__hash;
  if(!(h__6523__auto____32294 == null)) {
    return h__6523__auto____32294
  }else {
    var h__6523__auto____32295 = cljs.core.hash_coll.call(null, coll);
    this__32293.__hash = h__6523__auto____32295;
    return h__6523__auto____32295
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32296 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__32297 = this;
  var this__32298 = this;
  return cljs.core.pr_str.call(null, this__32298)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__32299 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32300 = this;
  if(this__32300.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__32300.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__32301 = this;
  return cljs.core.peek.call(null, this__32301.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__32302 = this;
  var t__32303 = cljs.core.first.call(null, this__32302.stack);
  var next_stack__32304 = cljs.core.tree_map_seq_push.call(null, this__32302.ascending_QMARK_ ? t__32303.right : t__32303.left, cljs.core.next.call(null, this__32302.stack), this__32302.ascending_QMARK_);
  if(!(next_stack__32304 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__32304, this__32302.ascending_QMARK_, this__32302.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32305 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32306 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__32306.stack, this__32306.ascending_QMARK_, this__32306.cnt, this__32306.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32307 = this;
  return this__32307.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____32309 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____32309) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____32309
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____32311 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____32311) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____32311
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__32315 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__32315)) {
    return cljs.core.deref.call(null, init__32315)
  }else {
    var init__32316 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__32315) : init__32315;
    if(cljs.core.reduced_QMARK_.call(null, init__32316)) {
      return cljs.core.deref.call(null, init__32316)
    }else {
      var init__32317 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__32316) : init__32316;
      if(cljs.core.reduced_QMARK_.call(null, init__32317)) {
        return cljs.core.deref.call(null, init__32317)
      }else {
        return init__32317
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32320 = this;
  var h__6523__auto____32321 = this__32320.__hash;
  if(!(h__6523__auto____32321 == null)) {
    return h__6523__auto____32321
  }else {
    var h__6523__auto____32322 = cljs.core.hash_coll.call(null, coll);
    this__32320.__hash = h__6523__auto____32322;
    return h__6523__auto____32322
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__32323 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__32324 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__32325 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__32325.key, this__32325.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__32373 = null;
  var G__32373__2 = function(this_sym32326, k) {
    var this__32328 = this;
    var this_sym32326__32329 = this;
    var node__32330 = this_sym32326__32329;
    return node__32330.cljs$core$ILookup$_lookup$arity$2(node__32330, k)
  };
  var G__32373__3 = function(this_sym32327, k, not_found) {
    var this__32328 = this;
    var this_sym32327__32331 = this;
    var node__32332 = this_sym32327__32331;
    return node__32332.cljs$core$ILookup$_lookup$arity$3(node__32332, k, not_found)
  };
  G__32373 = function(this_sym32327, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32373__2.call(this, this_sym32327, k);
      case 3:
        return G__32373__3.call(this, this_sym32327, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32373
}();
cljs.core.BlackNode.prototype.apply = function(this_sym32318, args32319) {
  var this__32333 = this;
  return this_sym32318.call.apply(this_sym32318, [this_sym32318].concat(args32319.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__32334 = this;
  return cljs.core.PersistentVector.fromArray([this__32334.key, this__32334.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__32335 = this;
  return this__32335.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__32336 = this;
  return this__32336.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__32337 = this;
  var node__32338 = this;
  return ins.balance_right(node__32338)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__32339 = this;
  var node__32340 = this;
  return new cljs.core.RedNode(this__32339.key, this__32339.val, this__32339.left, this__32339.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__32341 = this;
  var node__32342 = this;
  return cljs.core.balance_right_del.call(null, this__32341.key, this__32341.val, this__32341.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__32343 = this;
  var node__32344 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__32345 = this;
  var node__32346 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__32346, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__32347 = this;
  var node__32348 = this;
  return cljs.core.balance_left_del.call(null, this__32347.key, this__32347.val, del, this__32347.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__32349 = this;
  var node__32350 = this;
  return ins.balance_left(node__32350)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__32351 = this;
  var node__32352 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__32352, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__32374 = null;
  var G__32374__0 = function() {
    var this__32353 = this;
    var this__32355 = this;
    return cljs.core.pr_str.call(null, this__32355)
  };
  G__32374 = function() {
    switch(arguments.length) {
      case 0:
        return G__32374__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32374
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__32356 = this;
  var node__32357 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__32357, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__32358 = this;
  var node__32359 = this;
  return node__32359
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__32360 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__32361 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__32362 = this;
  return cljs.core.list.call(null, this__32362.key, this__32362.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__32363 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__32364 = this;
  return this__32364.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__32365 = this;
  return cljs.core.PersistentVector.fromArray([this__32365.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__32366 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__32366.key, this__32366.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32367 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__32368 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__32368.key, this__32368.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__32369 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__32370 = this;
  if(n === 0) {
    return this__32370.key
  }else {
    if(n === 1) {
      return this__32370.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__32371 = this;
  if(n === 0) {
    return this__32371.key
  }else {
    if(n === 1) {
      return this__32371.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__32372 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32377 = this;
  var h__6523__auto____32378 = this__32377.__hash;
  if(!(h__6523__auto____32378 == null)) {
    return h__6523__auto____32378
  }else {
    var h__6523__auto____32379 = cljs.core.hash_coll.call(null, coll);
    this__32377.__hash = h__6523__auto____32379;
    return h__6523__auto____32379
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__32380 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__32381 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__32382 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__32382.key, this__32382.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__32430 = null;
  var G__32430__2 = function(this_sym32383, k) {
    var this__32385 = this;
    var this_sym32383__32386 = this;
    var node__32387 = this_sym32383__32386;
    return node__32387.cljs$core$ILookup$_lookup$arity$2(node__32387, k)
  };
  var G__32430__3 = function(this_sym32384, k, not_found) {
    var this__32385 = this;
    var this_sym32384__32388 = this;
    var node__32389 = this_sym32384__32388;
    return node__32389.cljs$core$ILookup$_lookup$arity$3(node__32389, k, not_found)
  };
  G__32430 = function(this_sym32384, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32430__2.call(this, this_sym32384, k);
      case 3:
        return G__32430__3.call(this, this_sym32384, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32430
}();
cljs.core.RedNode.prototype.apply = function(this_sym32375, args32376) {
  var this__32390 = this;
  return this_sym32375.call.apply(this_sym32375, [this_sym32375].concat(args32376.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__32391 = this;
  return cljs.core.PersistentVector.fromArray([this__32391.key, this__32391.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__32392 = this;
  return this__32392.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__32393 = this;
  return this__32393.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__32394 = this;
  var node__32395 = this;
  return new cljs.core.RedNode(this__32394.key, this__32394.val, this__32394.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__32396 = this;
  var node__32397 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__32398 = this;
  var node__32399 = this;
  return new cljs.core.RedNode(this__32398.key, this__32398.val, this__32398.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__32400 = this;
  var node__32401 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__32402 = this;
  var node__32403 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__32403, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__32404 = this;
  var node__32405 = this;
  return new cljs.core.RedNode(this__32404.key, this__32404.val, del, this__32404.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__32406 = this;
  var node__32407 = this;
  return new cljs.core.RedNode(this__32406.key, this__32406.val, ins, this__32406.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__32408 = this;
  var node__32409 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__32408.left)) {
    return new cljs.core.RedNode(this__32408.key, this__32408.val, this__32408.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__32408.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__32408.right)) {
      return new cljs.core.RedNode(this__32408.right.key, this__32408.right.val, new cljs.core.BlackNode(this__32408.key, this__32408.val, this__32408.left, this__32408.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__32408.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__32409, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__32431 = null;
  var G__32431__0 = function() {
    var this__32410 = this;
    var this__32412 = this;
    return cljs.core.pr_str.call(null, this__32412)
  };
  G__32431 = function() {
    switch(arguments.length) {
      case 0:
        return G__32431__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32431
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__32413 = this;
  var node__32414 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__32413.right)) {
    return new cljs.core.RedNode(this__32413.key, this__32413.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__32413.left, null), this__32413.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__32413.left)) {
      return new cljs.core.RedNode(this__32413.left.key, this__32413.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__32413.left.left, null), new cljs.core.BlackNode(this__32413.key, this__32413.val, this__32413.left.right, this__32413.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__32414, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__32415 = this;
  var node__32416 = this;
  return new cljs.core.BlackNode(this__32415.key, this__32415.val, this__32415.left, this__32415.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__32417 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__32418 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__32419 = this;
  return cljs.core.list.call(null, this__32419.key, this__32419.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__32420 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__32421 = this;
  return this__32421.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__32422 = this;
  return cljs.core.PersistentVector.fromArray([this__32422.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__32423 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__32423.key, this__32423.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32424 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__32425 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__32425.key, this__32425.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__32426 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__32427 = this;
  if(n === 0) {
    return this__32427.key
  }else {
    if(n === 1) {
      return this__32427.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__32428 = this;
  if(n === 0) {
    return this__32428.key
  }else {
    if(n === 1) {
      return this__32428.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__32429 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__32435 = comp.call(null, k, tree.key);
    if(c__32435 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__32435 < 0) {
        var ins__32436 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__32436 == null)) {
          return tree.add_left(ins__32436)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__32437 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__32437 == null)) {
            return tree.add_right(ins__32437)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__32440 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__32440)) {
            return new cljs.core.RedNode(app__32440.key, app__32440.val, new cljs.core.RedNode(left.key, left.val, left.left, app__32440.left, null), new cljs.core.RedNode(right.key, right.val, app__32440.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__32440, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__32441 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__32441)) {
              return new cljs.core.RedNode(app__32441.key, app__32441.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__32441.left, null), new cljs.core.BlackNode(right.key, right.val, app__32441.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__32441, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__32447 = comp.call(null, k, tree.key);
    if(c__32447 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__32447 < 0) {
        var del__32448 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____32449 = !(del__32448 == null);
          if(or__3824__auto____32449) {
            return or__3824__auto____32449
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__32448, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__32448, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__32450 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____32451 = !(del__32450 == null);
            if(or__3824__auto____32451) {
              return or__3824__auto____32451
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__32450)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__32450, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__32454 = tree.key;
  var c__32455 = comp.call(null, k, tk__32454);
  if(c__32455 === 0) {
    return tree.replace(tk__32454, v, tree.left, tree.right)
  }else {
    if(c__32455 < 0) {
      return tree.replace(tk__32454, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__32454, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32458 = this;
  var h__6523__auto____32459 = this__32458.__hash;
  if(!(h__6523__auto____32459 == null)) {
    return h__6523__auto____32459
  }else {
    var h__6523__auto____32460 = cljs.core.hash_imap.call(null, coll);
    this__32458.__hash = h__6523__auto____32460;
    return h__6523__auto____32460
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__32461 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__32462 = this;
  var n__32463 = coll.entry_at(k);
  if(!(n__32463 == null)) {
    return n__32463.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__32464 = this;
  var found__32465 = [null];
  var t__32466 = cljs.core.tree_map_add.call(null, this__32464.comp, this__32464.tree, k, v, found__32465);
  if(t__32466 == null) {
    var found_node__32467 = cljs.core.nth.call(null, found__32465, 0);
    if(cljs.core._EQ_.call(null, v, found_node__32467.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__32464.comp, cljs.core.tree_map_replace.call(null, this__32464.comp, this__32464.tree, k, v), this__32464.cnt, this__32464.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__32464.comp, t__32466.blacken(), this__32464.cnt + 1, this__32464.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__32468 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__32502 = null;
  var G__32502__2 = function(this_sym32469, k) {
    var this__32471 = this;
    var this_sym32469__32472 = this;
    var coll__32473 = this_sym32469__32472;
    return coll__32473.cljs$core$ILookup$_lookup$arity$2(coll__32473, k)
  };
  var G__32502__3 = function(this_sym32470, k, not_found) {
    var this__32471 = this;
    var this_sym32470__32474 = this;
    var coll__32475 = this_sym32470__32474;
    return coll__32475.cljs$core$ILookup$_lookup$arity$3(coll__32475, k, not_found)
  };
  G__32502 = function(this_sym32470, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32502__2.call(this, this_sym32470, k);
      case 3:
        return G__32502__3.call(this, this_sym32470, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32502
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym32456, args32457) {
  var this__32476 = this;
  return this_sym32456.call.apply(this_sym32456, [this_sym32456].concat(args32457.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__32477 = this;
  if(!(this__32477.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__32477.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__32478 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__32479 = this;
  if(this__32479.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__32479.tree, false, this__32479.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__32480 = this;
  var this__32481 = this;
  return cljs.core.pr_str.call(null, this__32481)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__32482 = this;
  var coll__32483 = this;
  var t__32484 = this__32482.tree;
  while(true) {
    if(!(t__32484 == null)) {
      var c__32485 = this__32482.comp.call(null, k, t__32484.key);
      if(c__32485 === 0) {
        return t__32484
      }else {
        if(c__32485 < 0) {
          var G__32503 = t__32484.left;
          t__32484 = G__32503;
          continue
        }else {
          if("\ufdd0'else") {
            var G__32504 = t__32484.right;
            t__32484 = G__32504;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__32486 = this;
  if(this__32486.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__32486.tree, ascending_QMARK_, this__32486.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__32487 = this;
  if(this__32487.cnt > 0) {
    var stack__32488 = null;
    var t__32489 = this__32487.tree;
    while(true) {
      if(!(t__32489 == null)) {
        var c__32490 = this__32487.comp.call(null, k, t__32489.key);
        if(c__32490 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__32488, t__32489), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__32490 < 0) {
              var G__32505 = cljs.core.conj.call(null, stack__32488, t__32489);
              var G__32506 = t__32489.left;
              stack__32488 = G__32505;
              t__32489 = G__32506;
              continue
            }else {
              var G__32507 = stack__32488;
              var G__32508 = t__32489.right;
              stack__32488 = G__32507;
              t__32489 = G__32508;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__32490 > 0) {
                var G__32509 = cljs.core.conj.call(null, stack__32488, t__32489);
                var G__32510 = t__32489.right;
                stack__32488 = G__32509;
                t__32489 = G__32510;
                continue
              }else {
                var G__32511 = stack__32488;
                var G__32512 = t__32489.left;
                stack__32488 = G__32511;
                t__32489 = G__32512;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__32488 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__32488, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__32491 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__32492 = this;
  return this__32492.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__32493 = this;
  if(this__32493.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__32493.tree, true, this__32493.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32494 = this;
  return this__32494.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32495 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32496 = this;
  return new cljs.core.PersistentTreeMap(this__32496.comp, this__32496.tree, this__32496.cnt, meta, this__32496.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32497 = this;
  return this__32497.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32498 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__32498.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__32499 = this;
  var found__32500 = [null];
  var t__32501 = cljs.core.tree_map_remove.call(null, this__32499.comp, this__32499.tree, k, found__32500);
  if(t__32501 == null) {
    if(cljs.core.nth.call(null, found__32500, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__32499.comp, null, 0, this__32499.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__32499.comp, t__32501.blacken(), this__32499.cnt - 1, this__32499.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__32515 = cljs.core.seq.call(null, keyvals);
    var out__32516 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__32515) {
        var G__32517 = cljs.core.nnext.call(null, in__32515);
        var G__32518 = cljs.core.assoc_BANG_.call(null, out__32516, cljs.core.first.call(null, in__32515), cljs.core.second.call(null, in__32515));
        in__32515 = G__32517;
        out__32516 = G__32518;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__32516)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__32519) {
    var keyvals = cljs.core.seq(arglist__32519);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__32520) {
    var keyvals = cljs.core.seq(arglist__32520);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__32524 = [];
    var obj__32525 = {};
    var kvs__32526 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__32526) {
        ks__32524.push(cljs.core.first.call(null, kvs__32526));
        obj__32525[cljs.core.first.call(null, kvs__32526)] = cljs.core.second.call(null, kvs__32526);
        var G__32527 = cljs.core.nnext.call(null, kvs__32526);
        kvs__32526 = G__32527;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__32524, obj__32525)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__32528) {
    var keyvals = cljs.core.seq(arglist__32528);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__32531 = cljs.core.seq.call(null, keyvals);
    var out__32532 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__32531) {
        var G__32533 = cljs.core.nnext.call(null, in__32531);
        var G__32534 = cljs.core.assoc.call(null, out__32532, cljs.core.first.call(null, in__32531), cljs.core.second.call(null, in__32531));
        in__32531 = G__32533;
        out__32532 = G__32534;
        continue
      }else {
        return out__32532
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__32535) {
    var keyvals = cljs.core.seq(arglist__32535);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__32538 = cljs.core.seq.call(null, keyvals);
    var out__32539 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__32538) {
        var G__32540 = cljs.core.nnext.call(null, in__32538);
        var G__32541 = cljs.core.assoc.call(null, out__32539, cljs.core.first.call(null, in__32538), cljs.core.second.call(null, in__32538));
        in__32538 = G__32540;
        out__32539 = G__32541;
        continue
      }else {
        return out__32539
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__32542) {
    var comparator = cljs.core.first(arglist__32542);
    var keyvals = cljs.core.rest(arglist__32542);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__32543_SHARP_, p2__32544_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____32546 = p1__32543_SHARP_;
          if(cljs.core.truth_(or__3824__auto____32546)) {
            return or__3824__auto____32546
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__32544_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__32547) {
    var maps = cljs.core.seq(arglist__32547);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__32555 = function(m, e) {
        var k__32553 = cljs.core.first.call(null, e);
        var v__32554 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__32553)) {
          return cljs.core.assoc.call(null, m, k__32553, f.call(null, cljs.core._lookup.call(null, m, k__32553, null), v__32554))
        }else {
          return cljs.core.assoc.call(null, m, k__32553, v__32554)
        }
      };
      var merge2__32557 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__32555, function() {
          var or__3824__auto____32556 = m1;
          if(cljs.core.truth_(or__3824__auto____32556)) {
            return or__3824__auto____32556
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__32557, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__32558) {
    var f = cljs.core.first(arglist__32558);
    var maps = cljs.core.rest(arglist__32558);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__32563 = cljs.core.ObjMap.EMPTY;
  var keys__32564 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__32564) {
      var key__32565 = cljs.core.first.call(null, keys__32564);
      var entry__32566 = cljs.core._lookup.call(null, map, key__32565, "\ufdd0'user/not-found");
      var G__32567 = cljs.core.not_EQ_.call(null, entry__32566, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__32563, key__32565, entry__32566) : ret__32563;
      var G__32568 = cljs.core.next.call(null, keys__32564);
      ret__32563 = G__32567;
      keys__32564 = G__32568;
      continue
    }else {
      return ret__32563
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__32572 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__32572.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32573 = this;
  var h__6523__auto____32574 = this__32573.__hash;
  if(!(h__6523__auto____32574 == null)) {
    return h__6523__auto____32574
  }else {
    var h__6523__auto____32575 = cljs.core.hash_iset.call(null, coll);
    this__32573.__hash = h__6523__auto____32575;
    return h__6523__auto____32575
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__32576 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__32577 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__32577.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__32598 = null;
  var G__32598__2 = function(this_sym32578, k) {
    var this__32580 = this;
    var this_sym32578__32581 = this;
    var coll__32582 = this_sym32578__32581;
    return coll__32582.cljs$core$ILookup$_lookup$arity$2(coll__32582, k)
  };
  var G__32598__3 = function(this_sym32579, k, not_found) {
    var this__32580 = this;
    var this_sym32579__32583 = this;
    var coll__32584 = this_sym32579__32583;
    return coll__32584.cljs$core$ILookup$_lookup$arity$3(coll__32584, k, not_found)
  };
  G__32598 = function(this_sym32579, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32598__2.call(this, this_sym32579, k);
      case 3:
        return G__32598__3.call(this, this_sym32579, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32598
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym32570, args32571) {
  var this__32585 = this;
  return this_sym32570.call.apply(this_sym32570, [this_sym32570].concat(args32571.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32586 = this;
  return new cljs.core.PersistentHashSet(this__32586.meta, cljs.core.assoc.call(null, this__32586.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__32587 = this;
  var this__32588 = this;
  return cljs.core.pr_str.call(null, this__32588)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__32589 = this;
  return cljs.core.keys.call(null, this__32589.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__32590 = this;
  return new cljs.core.PersistentHashSet(this__32590.meta, cljs.core.dissoc.call(null, this__32590.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32591 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32592 = this;
  var and__3822__auto____32593 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____32593) {
    var and__3822__auto____32594 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____32594) {
      return cljs.core.every_QMARK_.call(null, function(p1__32569_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__32569_SHARP_)
      }, other)
    }else {
      return and__3822__auto____32594
    }
  }else {
    return and__3822__auto____32593
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32595 = this;
  return new cljs.core.PersistentHashSet(meta, this__32595.hash_map, this__32595.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32596 = this;
  return this__32596.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32597 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__32597.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__32599 = cljs.core.count.call(null, items);
  var i__32600 = 0;
  var out__32601 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__32600 < len__32599) {
      var G__32602 = i__32600 + 1;
      var G__32603 = cljs.core.conj_BANG_.call(null, out__32601, items[i__32600]);
      i__32600 = G__32602;
      out__32601 = G__32603;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__32601)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__32621 = null;
  var G__32621__2 = function(this_sym32607, k) {
    var this__32609 = this;
    var this_sym32607__32610 = this;
    var tcoll__32611 = this_sym32607__32610;
    if(cljs.core._lookup.call(null, this__32609.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__32621__3 = function(this_sym32608, k, not_found) {
    var this__32609 = this;
    var this_sym32608__32612 = this;
    var tcoll__32613 = this_sym32608__32612;
    if(cljs.core._lookup.call(null, this__32609.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__32621 = function(this_sym32608, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32621__2.call(this, this_sym32608, k);
      case 3:
        return G__32621__3.call(this, this_sym32608, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32621
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym32605, args32606) {
  var this__32614 = this;
  return this_sym32605.call.apply(this_sym32605, [this_sym32605].concat(args32606.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__32615 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__32616 = this;
  if(cljs.core._lookup.call(null, this__32616.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__32617 = this;
  return cljs.core.count.call(null, this__32617.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__32618 = this;
  this__32618.transient_map = cljs.core.dissoc_BANG_.call(null, this__32618.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__32619 = this;
  this__32619.transient_map = cljs.core.assoc_BANG_.call(null, this__32619.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__32620 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__32620.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32624 = this;
  var h__6523__auto____32625 = this__32624.__hash;
  if(!(h__6523__auto____32625 == null)) {
    return h__6523__auto____32625
  }else {
    var h__6523__auto____32626 = cljs.core.hash_iset.call(null, coll);
    this__32624.__hash = h__6523__auto____32626;
    return h__6523__auto____32626
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__32627 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__32628 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__32628.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__32654 = null;
  var G__32654__2 = function(this_sym32629, k) {
    var this__32631 = this;
    var this_sym32629__32632 = this;
    var coll__32633 = this_sym32629__32632;
    return coll__32633.cljs$core$ILookup$_lookup$arity$2(coll__32633, k)
  };
  var G__32654__3 = function(this_sym32630, k, not_found) {
    var this__32631 = this;
    var this_sym32630__32634 = this;
    var coll__32635 = this_sym32630__32634;
    return coll__32635.cljs$core$ILookup$_lookup$arity$3(coll__32635, k, not_found)
  };
  G__32654 = function(this_sym32630, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32654__2.call(this, this_sym32630, k);
      case 3:
        return G__32654__3.call(this, this_sym32630, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32654
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym32622, args32623) {
  var this__32636 = this;
  return this_sym32622.call.apply(this_sym32622, [this_sym32622].concat(args32623.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32637 = this;
  return new cljs.core.PersistentTreeSet(this__32637.meta, cljs.core.assoc.call(null, this__32637.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__32638 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__32638.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__32639 = this;
  var this__32640 = this;
  return cljs.core.pr_str.call(null, this__32640)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__32641 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__32641.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__32642 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__32642.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__32643 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__32644 = this;
  return cljs.core._comparator.call(null, this__32644.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__32645 = this;
  return cljs.core.keys.call(null, this__32645.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__32646 = this;
  return new cljs.core.PersistentTreeSet(this__32646.meta, cljs.core.dissoc.call(null, this__32646.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32647 = this;
  return cljs.core.count.call(null, this__32647.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32648 = this;
  var and__3822__auto____32649 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____32649) {
    var and__3822__auto____32650 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____32650) {
      return cljs.core.every_QMARK_.call(null, function(p1__32604_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__32604_SHARP_)
      }, other)
    }else {
      return and__3822__auto____32650
    }
  }else {
    return and__3822__auto____32649
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32651 = this;
  return new cljs.core.PersistentTreeSet(meta, this__32651.tree_map, this__32651.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32652 = this;
  return this__32652.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32653 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__32653.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__32659__delegate = function(keys) {
      var in__32657 = cljs.core.seq.call(null, keys);
      var out__32658 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__32657)) {
          var G__32660 = cljs.core.next.call(null, in__32657);
          var G__32661 = cljs.core.conj_BANG_.call(null, out__32658, cljs.core.first.call(null, in__32657));
          in__32657 = G__32660;
          out__32658 = G__32661;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__32658)
        }
        break
      }
    };
    var G__32659 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__32659__delegate.call(this, keys)
    };
    G__32659.cljs$lang$maxFixedArity = 0;
    G__32659.cljs$lang$applyTo = function(arglist__32662) {
      var keys = cljs.core.seq(arglist__32662);
      return G__32659__delegate(keys)
    };
    G__32659.cljs$lang$arity$variadic = G__32659__delegate;
    return G__32659
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__32663) {
    var keys = cljs.core.seq(arglist__32663);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__32665) {
    var comparator = cljs.core.first(arglist__32665);
    var keys = cljs.core.rest(arglist__32665);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__32671 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____32672 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____32672)) {
        var e__32673 = temp__3971__auto____32672;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__32673))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__32671, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__32664_SHARP_) {
      var temp__3971__auto____32674 = cljs.core.find.call(null, smap, p1__32664_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____32674)) {
        var e__32675 = temp__3971__auto____32674;
        return cljs.core.second.call(null, e__32675)
      }else {
        return p1__32664_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__32705 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__32698, seen) {
        while(true) {
          var vec__32699__32700 = p__32698;
          var f__32701 = cljs.core.nth.call(null, vec__32699__32700, 0, null);
          var xs__32702 = vec__32699__32700;
          var temp__3974__auto____32703 = cljs.core.seq.call(null, xs__32702);
          if(temp__3974__auto____32703) {
            var s__32704 = temp__3974__auto____32703;
            if(cljs.core.contains_QMARK_.call(null, seen, f__32701)) {
              var G__32706 = cljs.core.rest.call(null, s__32704);
              var G__32707 = seen;
              p__32698 = G__32706;
              seen = G__32707;
              continue
            }else {
              return cljs.core.cons.call(null, f__32701, step.call(null, cljs.core.rest.call(null, s__32704), cljs.core.conj.call(null, seen, f__32701)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__32705.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__32710 = cljs.core.PersistentVector.EMPTY;
  var s__32711 = s;
  while(true) {
    if(cljs.core.next.call(null, s__32711)) {
      var G__32712 = cljs.core.conj.call(null, ret__32710, cljs.core.first.call(null, s__32711));
      var G__32713 = cljs.core.next.call(null, s__32711);
      ret__32710 = G__32712;
      s__32711 = G__32713;
      continue
    }else {
      return cljs.core.seq.call(null, ret__32710)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____32716 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____32716) {
        return or__3824__auto____32716
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__32717 = x.lastIndexOf("/");
      if(i__32717 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__32717 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____32720 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____32720) {
      return or__3824__auto____32720
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__32721 = x.lastIndexOf("/");
    if(i__32721 > -1) {
      return cljs.core.subs.call(null, x, 2, i__32721)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__32728 = cljs.core.ObjMap.EMPTY;
  var ks__32729 = cljs.core.seq.call(null, keys);
  var vs__32730 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____32731 = ks__32729;
      if(and__3822__auto____32731) {
        return vs__32730
      }else {
        return and__3822__auto____32731
      }
    }()) {
      var G__32732 = cljs.core.assoc.call(null, map__32728, cljs.core.first.call(null, ks__32729), cljs.core.first.call(null, vs__32730));
      var G__32733 = cljs.core.next.call(null, ks__32729);
      var G__32734 = cljs.core.next.call(null, vs__32730);
      map__32728 = G__32732;
      ks__32729 = G__32733;
      vs__32730 = G__32734;
      continue
    }else {
      return map__32728
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__32737__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__32722_SHARP_, p2__32723_SHARP_) {
        return max_key.call(null, k, p1__32722_SHARP_, p2__32723_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__32737 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32737__delegate.call(this, k, x, y, more)
    };
    G__32737.cljs$lang$maxFixedArity = 3;
    G__32737.cljs$lang$applyTo = function(arglist__32738) {
      var k = cljs.core.first(arglist__32738);
      var x = cljs.core.first(cljs.core.next(arglist__32738));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32738)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32738)));
      return G__32737__delegate(k, x, y, more)
    };
    G__32737.cljs$lang$arity$variadic = G__32737__delegate;
    return G__32737
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__32739__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__32735_SHARP_, p2__32736_SHARP_) {
        return min_key.call(null, k, p1__32735_SHARP_, p2__32736_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__32739 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32739__delegate.call(this, k, x, y, more)
    };
    G__32739.cljs$lang$maxFixedArity = 3;
    G__32739.cljs$lang$applyTo = function(arglist__32740) {
      var k = cljs.core.first(arglist__32740);
      var x = cljs.core.first(cljs.core.next(arglist__32740));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32740)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32740)));
      return G__32739__delegate(k, x, y, more)
    };
    G__32739.cljs$lang$arity$variadic = G__32739__delegate;
    return G__32739
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____32743 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____32743) {
        var s__32744 = temp__3974__auto____32743;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__32744), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__32744)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____32747 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____32747) {
      var s__32748 = temp__3974__auto____32747;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__32748)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__32748), take_while.call(null, pred, cljs.core.rest.call(null, s__32748)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__32750 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__32750.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__32762 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____32763 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____32763)) {
        var vec__32764__32765 = temp__3974__auto____32763;
        var e__32766 = cljs.core.nth.call(null, vec__32764__32765, 0, null);
        var s__32767 = vec__32764__32765;
        if(cljs.core.truth_(include__32762.call(null, e__32766))) {
          return s__32767
        }else {
          return cljs.core.next.call(null, s__32767)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__32762, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____32768 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____32768)) {
      var vec__32769__32770 = temp__3974__auto____32768;
      var e__32771 = cljs.core.nth.call(null, vec__32769__32770, 0, null);
      var s__32772 = vec__32769__32770;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__32771)) ? s__32772 : cljs.core.next.call(null, s__32772))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__32784 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____32785 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____32785)) {
        var vec__32786__32787 = temp__3974__auto____32785;
        var e__32788 = cljs.core.nth.call(null, vec__32786__32787, 0, null);
        var s__32789 = vec__32786__32787;
        if(cljs.core.truth_(include__32784.call(null, e__32788))) {
          return s__32789
        }else {
          return cljs.core.next.call(null, s__32789)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__32784, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____32790 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____32790)) {
      var vec__32791__32792 = temp__3974__auto____32790;
      var e__32793 = cljs.core.nth.call(null, vec__32791__32792, 0, null);
      var s__32794 = vec__32791__32792;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__32793)) ? s__32794 : cljs.core.next.call(null, s__32794))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__32795 = this;
  var h__6523__auto____32796 = this__32795.__hash;
  if(!(h__6523__auto____32796 == null)) {
    return h__6523__auto____32796
  }else {
    var h__6523__auto____32797 = cljs.core.hash_coll.call(null, rng);
    this__32795.__hash = h__6523__auto____32797;
    return h__6523__auto____32797
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__32798 = this;
  if(this__32798.step > 0) {
    if(this__32798.start + this__32798.step < this__32798.end) {
      return new cljs.core.Range(this__32798.meta, this__32798.start + this__32798.step, this__32798.end, this__32798.step, null)
    }else {
      return null
    }
  }else {
    if(this__32798.start + this__32798.step > this__32798.end) {
      return new cljs.core.Range(this__32798.meta, this__32798.start + this__32798.step, this__32798.end, this__32798.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__32799 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__32800 = this;
  var this__32801 = this;
  return cljs.core.pr_str.call(null, this__32801)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__32802 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__32803 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__32804 = this;
  if(this__32804.step > 0) {
    if(this__32804.start < this__32804.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__32804.start > this__32804.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__32805 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__32805.end - this__32805.start) / this__32805.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__32806 = this;
  return this__32806.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__32807 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__32807.meta, this__32807.start + this__32807.step, this__32807.end, this__32807.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__32808 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__32809 = this;
  return new cljs.core.Range(meta, this__32809.start, this__32809.end, this__32809.step, this__32809.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__32810 = this;
  return this__32810.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__32811 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__32811.start + n * this__32811.step
  }else {
    if(function() {
      var and__3822__auto____32812 = this__32811.start > this__32811.end;
      if(and__3822__auto____32812) {
        return this__32811.step === 0
      }else {
        return and__3822__auto____32812
      }
    }()) {
      return this__32811.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__32813 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__32813.start + n * this__32813.step
  }else {
    if(function() {
      var and__3822__auto____32814 = this__32813.start > this__32813.end;
      if(and__3822__auto____32814) {
        return this__32813.step === 0
      }else {
        return and__3822__auto____32814
      }
    }()) {
      return this__32813.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__32815 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__32815.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____32818 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____32818) {
      var s__32819 = temp__3974__auto____32818;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__32819), take_nth.call(null, n, cljs.core.drop.call(null, n, s__32819)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____32826 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____32826) {
      var s__32827 = temp__3974__auto____32826;
      var fst__32828 = cljs.core.first.call(null, s__32827);
      var fv__32829 = f.call(null, fst__32828);
      var run__32830 = cljs.core.cons.call(null, fst__32828, cljs.core.take_while.call(null, function(p1__32820_SHARP_) {
        return cljs.core._EQ_.call(null, fv__32829, f.call(null, p1__32820_SHARP_))
      }, cljs.core.next.call(null, s__32827)));
      return cljs.core.cons.call(null, run__32830, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__32830), s__32827))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____32845 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____32845) {
        var s__32846 = temp__3971__auto____32845;
        return reductions.call(null, f, cljs.core.first.call(null, s__32846), cljs.core.rest.call(null, s__32846))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____32847 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____32847) {
        var s__32848 = temp__3974__auto____32847;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__32848)), cljs.core.rest.call(null, s__32848))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__32851 = null;
      var G__32851__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__32851__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__32851__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__32851__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__32851__4 = function() {
        var G__32852__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__32852 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32852__delegate.call(this, x, y, z, args)
        };
        G__32852.cljs$lang$maxFixedArity = 3;
        G__32852.cljs$lang$applyTo = function(arglist__32853) {
          var x = cljs.core.first(arglist__32853);
          var y = cljs.core.first(cljs.core.next(arglist__32853));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32853)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32853)));
          return G__32852__delegate(x, y, z, args)
        };
        G__32852.cljs$lang$arity$variadic = G__32852__delegate;
        return G__32852
      }();
      G__32851 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32851__0.call(this);
          case 1:
            return G__32851__1.call(this, x);
          case 2:
            return G__32851__2.call(this, x, y);
          case 3:
            return G__32851__3.call(this, x, y, z);
          default:
            return G__32851__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32851.cljs$lang$maxFixedArity = 3;
      G__32851.cljs$lang$applyTo = G__32851__4.cljs$lang$applyTo;
      return G__32851
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__32854 = null;
      var G__32854__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__32854__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__32854__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__32854__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__32854__4 = function() {
        var G__32855__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__32855 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32855__delegate.call(this, x, y, z, args)
        };
        G__32855.cljs$lang$maxFixedArity = 3;
        G__32855.cljs$lang$applyTo = function(arglist__32856) {
          var x = cljs.core.first(arglist__32856);
          var y = cljs.core.first(cljs.core.next(arglist__32856));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32856)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32856)));
          return G__32855__delegate(x, y, z, args)
        };
        G__32855.cljs$lang$arity$variadic = G__32855__delegate;
        return G__32855
      }();
      G__32854 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32854__0.call(this);
          case 1:
            return G__32854__1.call(this, x);
          case 2:
            return G__32854__2.call(this, x, y);
          case 3:
            return G__32854__3.call(this, x, y, z);
          default:
            return G__32854__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32854.cljs$lang$maxFixedArity = 3;
      G__32854.cljs$lang$applyTo = G__32854__4.cljs$lang$applyTo;
      return G__32854
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__32857 = null;
      var G__32857__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__32857__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__32857__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__32857__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__32857__4 = function() {
        var G__32858__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__32858 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32858__delegate.call(this, x, y, z, args)
        };
        G__32858.cljs$lang$maxFixedArity = 3;
        G__32858.cljs$lang$applyTo = function(arglist__32859) {
          var x = cljs.core.first(arglist__32859);
          var y = cljs.core.first(cljs.core.next(arglist__32859));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32859)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32859)));
          return G__32858__delegate(x, y, z, args)
        };
        G__32858.cljs$lang$arity$variadic = G__32858__delegate;
        return G__32858
      }();
      G__32857 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32857__0.call(this);
          case 1:
            return G__32857__1.call(this, x);
          case 2:
            return G__32857__2.call(this, x, y);
          case 3:
            return G__32857__3.call(this, x, y, z);
          default:
            return G__32857__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32857.cljs$lang$maxFixedArity = 3;
      G__32857.cljs$lang$applyTo = G__32857__4.cljs$lang$applyTo;
      return G__32857
    }()
  };
  var juxt__4 = function() {
    var G__32860__delegate = function(f, g, h, fs) {
      var fs__32850 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__32861 = null;
        var G__32861__0 = function() {
          return cljs.core.reduce.call(null, function(p1__32831_SHARP_, p2__32832_SHARP_) {
            return cljs.core.conj.call(null, p1__32831_SHARP_, p2__32832_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__32850)
        };
        var G__32861__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__32833_SHARP_, p2__32834_SHARP_) {
            return cljs.core.conj.call(null, p1__32833_SHARP_, p2__32834_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__32850)
        };
        var G__32861__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__32835_SHARP_, p2__32836_SHARP_) {
            return cljs.core.conj.call(null, p1__32835_SHARP_, p2__32836_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__32850)
        };
        var G__32861__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__32837_SHARP_, p2__32838_SHARP_) {
            return cljs.core.conj.call(null, p1__32837_SHARP_, p2__32838_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__32850)
        };
        var G__32861__4 = function() {
          var G__32862__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__32839_SHARP_, p2__32840_SHARP_) {
              return cljs.core.conj.call(null, p1__32839_SHARP_, cljs.core.apply.call(null, p2__32840_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__32850)
          };
          var G__32862 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__32862__delegate.call(this, x, y, z, args)
          };
          G__32862.cljs$lang$maxFixedArity = 3;
          G__32862.cljs$lang$applyTo = function(arglist__32863) {
            var x = cljs.core.first(arglist__32863);
            var y = cljs.core.first(cljs.core.next(arglist__32863));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32863)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32863)));
            return G__32862__delegate(x, y, z, args)
          };
          G__32862.cljs$lang$arity$variadic = G__32862__delegate;
          return G__32862
        }();
        G__32861 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__32861__0.call(this);
            case 1:
              return G__32861__1.call(this, x);
            case 2:
              return G__32861__2.call(this, x, y);
            case 3:
              return G__32861__3.call(this, x, y, z);
            default:
              return G__32861__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__32861.cljs$lang$maxFixedArity = 3;
        G__32861.cljs$lang$applyTo = G__32861__4.cljs$lang$applyTo;
        return G__32861
      }()
    };
    var G__32860 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32860__delegate.call(this, f, g, h, fs)
    };
    G__32860.cljs$lang$maxFixedArity = 3;
    G__32860.cljs$lang$applyTo = function(arglist__32864) {
      var f = cljs.core.first(arglist__32864);
      var g = cljs.core.first(cljs.core.next(arglist__32864));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32864)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32864)));
      return G__32860__delegate(f, g, h, fs)
    };
    G__32860.cljs$lang$arity$variadic = G__32860__delegate;
    return G__32860
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__32867 = cljs.core.next.call(null, coll);
        coll = G__32867;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____32866 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____32866) {
          return n > 0
        }else {
          return and__3822__auto____32866
        }
      }())) {
        var G__32868 = n - 1;
        var G__32869 = cljs.core.next.call(null, coll);
        n = G__32868;
        coll = G__32869;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__32871 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__32871), s)) {
    if(cljs.core.count.call(null, matches__32871) === 1) {
      return cljs.core.first.call(null, matches__32871)
    }else {
      return cljs.core.vec.call(null, matches__32871)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__32873 = re.exec(s);
  if(matches__32873 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__32873) === 1) {
      return cljs.core.first.call(null, matches__32873)
    }else {
      return cljs.core.vec.call(null, matches__32873)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__32878 = cljs.core.re_find.call(null, re, s);
  var match_idx__32879 = s.search(re);
  var match_str__32880 = cljs.core.coll_QMARK_.call(null, match_data__32878) ? cljs.core.first.call(null, match_data__32878) : match_data__32878;
  var post_match__32881 = cljs.core.subs.call(null, s, match_idx__32879 + cljs.core.count.call(null, match_str__32880));
  if(cljs.core.truth_(match_data__32878)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__32878, re_seq.call(null, re, post_match__32881))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__32888__32889 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___32890 = cljs.core.nth.call(null, vec__32888__32889, 0, null);
  var flags__32891 = cljs.core.nth.call(null, vec__32888__32889, 1, null);
  var pattern__32892 = cljs.core.nth.call(null, vec__32888__32889, 2, null);
  return new RegExp(pattern__32892, flags__32891)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__32882_SHARP_) {
    return print_one.call(null, p1__32882_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____32902 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____32902)) {
            var and__3822__auto____32906 = function() {
              var G__32903__32904 = obj;
              if(G__32903__32904) {
                if(function() {
                  var or__3824__auto____32905 = G__32903__32904.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____32905) {
                    return or__3824__auto____32905
                  }else {
                    return G__32903__32904.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__32903__32904.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__32903__32904)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__32903__32904)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____32906)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____32906
            }
          }else {
            return and__3822__auto____32902
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____32907 = !(obj == null);
          if(and__3822__auto____32907) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____32907
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__32908__32909 = obj;
          if(G__32908__32909) {
            if(function() {
              var or__3824__auto____32910 = G__32908__32909.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____32910) {
                return or__3824__auto____32910
              }else {
                return G__32908__32909.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__32908__32909.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__32908__32909)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__32908__32909)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__32930 = new goog.string.StringBuffer;
  var G__32931__32932 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__32931__32932) {
    var string__32933 = cljs.core.first.call(null, G__32931__32932);
    var G__32931__32934 = G__32931__32932;
    while(true) {
      sb__32930.append(string__32933);
      var temp__3974__auto____32935 = cljs.core.next.call(null, G__32931__32934);
      if(temp__3974__auto____32935) {
        var G__32931__32936 = temp__3974__auto____32935;
        var G__32949 = cljs.core.first.call(null, G__32931__32936);
        var G__32950 = G__32931__32936;
        string__32933 = G__32949;
        G__32931__32934 = G__32950;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__32937__32938 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__32937__32938) {
    var obj__32939 = cljs.core.first.call(null, G__32937__32938);
    var G__32937__32940 = G__32937__32938;
    while(true) {
      sb__32930.append(" ");
      var G__32941__32942 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__32939, opts));
      if(G__32941__32942) {
        var string__32943 = cljs.core.first.call(null, G__32941__32942);
        var G__32941__32944 = G__32941__32942;
        while(true) {
          sb__32930.append(string__32943);
          var temp__3974__auto____32945 = cljs.core.next.call(null, G__32941__32944);
          if(temp__3974__auto____32945) {
            var G__32941__32946 = temp__3974__auto____32945;
            var G__32951 = cljs.core.first.call(null, G__32941__32946);
            var G__32952 = G__32941__32946;
            string__32943 = G__32951;
            G__32941__32944 = G__32952;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____32947 = cljs.core.next.call(null, G__32937__32940);
      if(temp__3974__auto____32947) {
        var G__32937__32948 = temp__3974__auto____32947;
        var G__32953 = cljs.core.first.call(null, G__32937__32948);
        var G__32954 = G__32937__32948;
        obj__32939 = G__32953;
        G__32937__32940 = G__32954;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__32930
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__32956 = cljs.core.pr_sb.call(null, objs, opts);
  sb__32956.append("\n");
  return[cljs.core.str(sb__32956)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__32975__32976 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__32975__32976) {
    var string__32977 = cljs.core.first.call(null, G__32975__32976);
    var G__32975__32978 = G__32975__32976;
    while(true) {
      cljs.core.string_print.call(null, string__32977);
      var temp__3974__auto____32979 = cljs.core.next.call(null, G__32975__32978);
      if(temp__3974__auto____32979) {
        var G__32975__32980 = temp__3974__auto____32979;
        var G__32993 = cljs.core.first.call(null, G__32975__32980);
        var G__32994 = G__32975__32980;
        string__32977 = G__32993;
        G__32975__32978 = G__32994;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__32981__32982 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__32981__32982) {
    var obj__32983 = cljs.core.first.call(null, G__32981__32982);
    var G__32981__32984 = G__32981__32982;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__32985__32986 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__32983, opts));
      if(G__32985__32986) {
        var string__32987 = cljs.core.first.call(null, G__32985__32986);
        var G__32985__32988 = G__32985__32986;
        while(true) {
          cljs.core.string_print.call(null, string__32987);
          var temp__3974__auto____32989 = cljs.core.next.call(null, G__32985__32988);
          if(temp__3974__auto____32989) {
            var G__32985__32990 = temp__3974__auto____32989;
            var G__32995 = cljs.core.first.call(null, G__32985__32990);
            var G__32996 = G__32985__32990;
            string__32987 = G__32995;
            G__32985__32988 = G__32996;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____32991 = cljs.core.next.call(null, G__32981__32984);
      if(temp__3974__auto____32991) {
        var G__32981__32992 = temp__3974__auto____32991;
        var G__32997 = cljs.core.first.call(null, G__32981__32992);
        var G__32998 = G__32981__32992;
        obj__32983 = G__32997;
        G__32981__32984 = G__32998;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__32999) {
    var objs = cljs.core.seq(arglist__32999);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__33000) {
    var objs = cljs.core.seq(arglist__33000);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__33001) {
    var objs = cljs.core.seq(arglist__33001);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__33002) {
    var objs = cljs.core.seq(arglist__33002);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__33003) {
    var objs = cljs.core.seq(arglist__33003);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__33004) {
    var objs = cljs.core.seq(arglist__33004);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__33005) {
    var objs = cljs.core.seq(arglist__33005);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__33006) {
    var objs = cljs.core.seq(arglist__33006);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__33007) {
    var fmt = cljs.core.first(arglist__33007);
    var args = cljs.core.rest(arglist__33007);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__33008 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__33008, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__33009 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__33009, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__33010 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__33010, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____33011 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____33011)) {
        var nspc__33012 = temp__3974__auto____33011;
        return[cljs.core.str(nspc__33012), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____33013 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____33013)) {
          var nspc__33014 = temp__3974__auto____33013;
          return[cljs.core.str(nspc__33014), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__33015 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__33015, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__33017 = function(n, len) {
    var ns__33016 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__33016) < len) {
        var G__33019 = [cljs.core.str("0"), cljs.core.str(ns__33016)].join("");
        ns__33016 = G__33019;
        continue
      }else {
        return ns__33016
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__33017.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__33017.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__33017.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__33017.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__33017.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__33017.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__33018 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__33018, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__33020 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__33021 = this;
  var G__33022__33023 = cljs.core.seq.call(null, this__33021.watches);
  if(G__33022__33023) {
    var G__33025__33027 = cljs.core.first.call(null, G__33022__33023);
    var vec__33026__33028 = G__33025__33027;
    var key__33029 = cljs.core.nth.call(null, vec__33026__33028, 0, null);
    var f__33030 = cljs.core.nth.call(null, vec__33026__33028, 1, null);
    var G__33022__33031 = G__33022__33023;
    var G__33025__33032 = G__33025__33027;
    var G__33022__33033 = G__33022__33031;
    while(true) {
      var vec__33034__33035 = G__33025__33032;
      var key__33036 = cljs.core.nth.call(null, vec__33034__33035, 0, null);
      var f__33037 = cljs.core.nth.call(null, vec__33034__33035, 1, null);
      var G__33022__33038 = G__33022__33033;
      f__33037.call(null, key__33036, this$, oldval, newval);
      var temp__3974__auto____33039 = cljs.core.next.call(null, G__33022__33038);
      if(temp__3974__auto____33039) {
        var G__33022__33040 = temp__3974__auto____33039;
        var G__33047 = cljs.core.first.call(null, G__33022__33040);
        var G__33048 = G__33022__33040;
        G__33025__33032 = G__33047;
        G__33022__33033 = G__33048;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__33041 = this;
  return this$.watches = cljs.core.assoc.call(null, this__33041.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__33042 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__33042.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__33043 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__33043.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__33044 = this;
  return this__33044.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__33045 = this;
  return this__33045.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__33046 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__33060__delegate = function(x, p__33049) {
      var map__33055__33056 = p__33049;
      var map__33055__33057 = cljs.core.seq_QMARK_.call(null, map__33055__33056) ? cljs.core.apply.call(null, cljs.core.hash_map, map__33055__33056) : map__33055__33056;
      var validator__33058 = cljs.core._lookup.call(null, map__33055__33057, "\ufdd0'validator", null);
      var meta__33059 = cljs.core._lookup.call(null, map__33055__33057, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__33059, validator__33058, null)
    };
    var G__33060 = function(x, var_args) {
      var p__33049 = null;
      if(goog.isDef(var_args)) {
        p__33049 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__33060__delegate.call(this, x, p__33049)
    };
    G__33060.cljs$lang$maxFixedArity = 1;
    G__33060.cljs$lang$applyTo = function(arglist__33061) {
      var x = cljs.core.first(arglist__33061);
      var p__33049 = cljs.core.rest(arglist__33061);
      return G__33060__delegate(x, p__33049)
    };
    G__33060.cljs$lang$arity$variadic = G__33060__delegate;
    return G__33060
  }();
  atom = function(x, var_args) {
    var p__33049 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____33065 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____33065)) {
    var validate__33066 = temp__3974__auto____33065;
    if(cljs.core.truth_(validate__33066.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__33067 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__33067, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__33068__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__33068 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__33068__delegate.call(this, a, f, x, y, z, more)
    };
    G__33068.cljs$lang$maxFixedArity = 5;
    G__33068.cljs$lang$applyTo = function(arglist__33069) {
      var a = cljs.core.first(arglist__33069);
      var f = cljs.core.first(cljs.core.next(arglist__33069));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__33069)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__33069))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__33069)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__33069)))));
      return G__33068__delegate(a, f, x, y, z, more)
    };
    G__33068.cljs$lang$arity$variadic = G__33068__delegate;
    return G__33068
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__33070) {
    var iref = cljs.core.first(arglist__33070);
    var f = cljs.core.first(cljs.core.next(arglist__33070));
    var args = cljs.core.rest(cljs.core.next(arglist__33070));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__33071 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__33071.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__33072 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__33072.state, function(p__33073) {
    var map__33074__33075 = p__33073;
    var map__33074__33076 = cljs.core.seq_QMARK_.call(null, map__33074__33075) ? cljs.core.apply.call(null, cljs.core.hash_map, map__33074__33075) : map__33074__33075;
    var curr_state__33077 = map__33074__33076;
    var done__33078 = cljs.core._lookup.call(null, map__33074__33076, "\ufdd0'done", null);
    if(cljs.core.truth_(done__33078)) {
      return curr_state__33077
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__33072.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__33099__33100 = options;
    var map__33099__33101 = cljs.core.seq_QMARK_.call(null, map__33099__33100) ? cljs.core.apply.call(null, cljs.core.hash_map, map__33099__33100) : map__33099__33100;
    var keywordize_keys__33102 = cljs.core._lookup.call(null, map__33099__33101, "\ufdd0'keywordize-keys", null);
    var keyfn__33103 = cljs.core.truth_(keywordize_keys__33102) ? cljs.core.keyword : cljs.core.str;
    var f__33118 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__6793__auto____33117 = function iter__33111(s__33112) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__33112__33115 = s__33112;
                    while(true) {
                      if(cljs.core.seq.call(null, s__33112__33115)) {
                        var k__33116 = cljs.core.first.call(null, s__33112__33115);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__33103.call(null, k__33116), thisfn.call(null, x[k__33116])], true), iter__33111.call(null, cljs.core.rest.call(null, s__33112__33115)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__6793__auto____33117.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__33118.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__33119) {
    var x = cljs.core.first(arglist__33119);
    var options = cljs.core.rest(arglist__33119);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__33124 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__33128__delegate = function(args) {
      var temp__3971__auto____33125 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__33124), args, null);
      if(cljs.core.truth_(temp__3971__auto____33125)) {
        var v__33126 = temp__3971__auto____33125;
        return v__33126
      }else {
        var ret__33127 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__33124, cljs.core.assoc, args, ret__33127);
        return ret__33127
      }
    };
    var G__33128 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__33128__delegate.call(this, args)
    };
    G__33128.cljs$lang$maxFixedArity = 0;
    G__33128.cljs$lang$applyTo = function(arglist__33129) {
      var args = cljs.core.seq(arglist__33129);
      return G__33128__delegate(args)
    };
    G__33128.cljs$lang$arity$variadic = G__33128__delegate;
    return G__33128
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__33131 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__33131)) {
        var G__33132 = ret__33131;
        f = G__33132;
        continue
      }else {
        return ret__33131
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__33133__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__33133 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__33133__delegate.call(this, f, args)
    };
    G__33133.cljs$lang$maxFixedArity = 1;
    G__33133.cljs$lang$applyTo = function(arglist__33134) {
      var f = cljs.core.first(arglist__33134);
      var args = cljs.core.rest(arglist__33134);
      return G__33133__delegate(f, args)
    };
    G__33133.cljs$lang$arity$variadic = G__33133__delegate;
    return G__33133
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__33136 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__33136, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__33136, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____33145 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____33145) {
      return or__3824__auto____33145
    }else {
      var or__3824__auto____33146 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____33146) {
        return or__3824__auto____33146
      }else {
        var and__3822__auto____33147 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____33147) {
          var and__3822__auto____33148 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____33148) {
            var and__3822__auto____33149 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____33149) {
              var ret__33150 = true;
              var i__33151 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____33152 = cljs.core.not.call(null, ret__33150);
                  if(or__3824__auto____33152) {
                    return or__3824__auto____33152
                  }else {
                    return i__33151 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__33150
                }else {
                  var G__33153 = isa_QMARK_.call(null, h, child.call(null, i__33151), parent.call(null, i__33151));
                  var G__33154 = i__33151 + 1;
                  ret__33150 = G__33153;
                  i__33151 = G__33154;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____33149
            }
          }else {
            return and__3822__auto____33148
          }
        }else {
          return and__3822__auto____33147
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__33163 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__33164 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__33165 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__33166 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____33167 = cljs.core.contains_QMARK_.call(null, tp__33163.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__33165.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__33165.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__33163, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__33166.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__33164, parent, ta__33165), "\ufdd0'descendants":tf__33166.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__33165, tag, td__33164)})
    }();
    if(cljs.core.truth_(or__3824__auto____33167)) {
      return or__3824__auto____33167
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__33172 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__33173 = cljs.core.truth_(parentMap__33172.call(null, tag)) ? cljs.core.disj.call(null, parentMap__33172.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__33174 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__33173)) ? cljs.core.assoc.call(null, parentMap__33172, tag, childsParents__33173) : cljs.core.dissoc.call(null, parentMap__33172, tag);
    var deriv_seq__33175 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__33155_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__33155_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__33155_SHARP_), cljs.core.second.call(null, p1__33155_SHARP_)))
    }, cljs.core.seq.call(null, newParents__33174)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__33172.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__33156_SHARP_, p2__33157_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__33156_SHARP_, p2__33157_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__33175))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__33183 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____33185 = cljs.core.truth_(function() {
    var and__3822__auto____33184 = xprefs__33183;
    if(cljs.core.truth_(and__3822__auto____33184)) {
      return xprefs__33183.call(null, y)
    }else {
      return and__3822__auto____33184
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____33185)) {
    return or__3824__auto____33185
  }else {
    var or__3824__auto____33187 = function() {
      var ps__33186 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__33186) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__33186), prefer_table))) {
          }else {
          }
          var G__33190 = cljs.core.rest.call(null, ps__33186);
          ps__33186 = G__33190;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____33187)) {
      return or__3824__auto____33187
    }else {
      var or__3824__auto____33189 = function() {
        var ps__33188 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__33188) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__33188), y, prefer_table))) {
            }else {
            }
            var G__33191 = cljs.core.rest.call(null, ps__33188);
            ps__33188 = G__33191;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____33189)) {
        return or__3824__auto____33189
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____33193 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____33193)) {
    return or__3824__auto____33193
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__33211 = cljs.core.reduce.call(null, function(be, p__33203) {
    var vec__33204__33205 = p__33203;
    var k__33206 = cljs.core.nth.call(null, vec__33204__33205, 0, null);
    var ___33207 = cljs.core.nth.call(null, vec__33204__33205, 1, null);
    var e__33208 = vec__33204__33205;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__33206)) {
      var be2__33210 = cljs.core.truth_(function() {
        var or__3824__auto____33209 = be == null;
        if(or__3824__auto____33209) {
          return or__3824__auto____33209
        }else {
          return cljs.core.dominates.call(null, k__33206, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__33208 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__33210), k__33206, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__33206), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__33210)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__33210
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__33211)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__33211));
      return cljs.core.second.call(null, best_entry__33211)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____33216 = mf;
    if(and__3822__auto____33216) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____33216
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__6694__auto____33217 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33218 = cljs.core._reset[goog.typeOf(x__6694__auto____33217)];
      if(or__3824__auto____33218) {
        return or__3824__auto____33218
      }else {
        var or__3824__auto____33219 = cljs.core._reset["_"];
        if(or__3824__auto____33219) {
          return or__3824__auto____33219
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____33224 = mf;
    if(and__3822__auto____33224) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____33224
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__6694__auto____33225 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33226 = cljs.core._add_method[goog.typeOf(x__6694__auto____33225)];
      if(or__3824__auto____33226) {
        return or__3824__auto____33226
      }else {
        var or__3824__auto____33227 = cljs.core._add_method["_"];
        if(or__3824__auto____33227) {
          return or__3824__auto____33227
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____33232 = mf;
    if(and__3822__auto____33232) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____33232
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__6694__auto____33233 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33234 = cljs.core._remove_method[goog.typeOf(x__6694__auto____33233)];
      if(or__3824__auto____33234) {
        return or__3824__auto____33234
      }else {
        var or__3824__auto____33235 = cljs.core._remove_method["_"];
        if(or__3824__auto____33235) {
          return or__3824__auto____33235
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____33240 = mf;
    if(and__3822__auto____33240) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____33240
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__6694__auto____33241 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33242 = cljs.core._prefer_method[goog.typeOf(x__6694__auto____33241)];
      if(or__3824__auto____33242) {
        return or__3824__auto____33242
      }else {
        var or__3824__auto____33243 = cljs.core._prefer_method["_"];
        if(or__3824__auto____33243) {
          return or__3824__auto____33243
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____33248 = mf;
    if(and__3822__auto____33248) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____33248
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__6694__auto____33249 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33250 = cljs.core._get_method[goog.typeOf(x__6694__auto____33249)];
      if(or__3824__auto____33250) {
        return or__3824__auto____33250
      }else {
        var or__3824__auto____33251 = cljs.core._get_method["_"];
        if(or__3824__auto____33251) {
          return or__3824__auto____33251
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____33256 = mf;
    if(and__3822__auto____33256) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____33256
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__6694__auto____33257 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33258 = cljs.core._methods[goog.typeOf(x__6694__auto____33257)];
      if(or__3824__auto____33258) {
        return or__3824__auto____33258
      }else {
        var or__3824__auto____33259 = cljs.core._methods["_"];
        if(or__3824__auto____33259) {
          return or__3824__auto____33259
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____33264 = mf;
    if(and__3822__auto____33264) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____33264
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__6694__auto____33265 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33266 = cljs.core._prefers[goog.typeOf(x__6694__auto____33265)];
      if(or__3824__auto____33266) {
        return or__3824__auto____33266
      }else {
        var or__3824__auto____33267 = cljs.core._prefers["_"];
        if(or__3824__auto____33267) {
          return or__3824__auto____33267
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____33272 = mf;
    if(and__3822__auto____33272) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____33272
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__6694__auto____33273 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____33274 = cljs.core._dispatch[goog.typeOf(x__6694__auto____33273)];
      if(or__3824__auto____33274) {
        return or__3824__auto____33274
      }else {
        var or__3824__auto____33275 = cljs.core._dispatch["_"];
        if(or__3824__auto____33275) {
          return or__3824__auto____33275
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__33278 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__33279 = cljs.core._get_method.call(null, mf, dispatch_val__33278);
  if(cljs.core.truth_(target_fn__33279)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__33278)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__33279, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__33280 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__33281 = this;
  cljs.core.swap_BANG_.call(null, this__33281.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__33281.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__33281.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__33281.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__33282 = this;
  cljs.core.swap_BANG_.call(null, this__33282.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__33282.method_cache, this__33282.method_table, this__33282.cached_hierarchy, this__33282.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__33283 = this;
  cljs.core.swap_BANG_.call(null, this__33283.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__33283.method_cache, this__33283.method_table, this__33283.cached_hierarchy, this__33283.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__33284 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__33284.cached_hierarchy), cljs.core.deref.call(null, this__33284.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__33284.method_cache, this__33284.method_table, this__33284.cached_hierarchy, this__33284.hierarchy)
  }
  var temp__3971__auto____33285 = cljs.core.deref.call(null, this__33284.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____33285)) {
    var target_fn__33286 = temp__3971__auto____33285;
    return target_fn__33286
  }else {
    var temp__3971__auto____33287 = cljs.core.find_and_cache_best_method.call(null, this__33284.name, dispatch_val, this__33284.hierarchy, this__33284.method_table, this__33284.prefer_table, this__33284.method_cache, this__33284.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____33287)) {
      var target_fn__33288 = temp__3971__auto____33287;
      return target_fn__33288
    }else {
      return cljs.core.deref.call(null, this__33284.method_table).call(null, this__33284.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__33289 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__33289.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__33289.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__33289.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__33289.method_cache, this__33289.method_table, this__33289.cached_hierarchy, this__33289.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__33290 = this;
  return cljs.core.deref.call(null, this__33290.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__33291 = this;
  return cljs.core.deref.call(null, this__33291.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__33292 = this;
  return cljs.core.do_dispatch.call(null, mf, this__33292.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__33294__delegate = function(_, args) {
    var self__33293 = this;
    return cljs.core._dispatch.call(null, self__33293, args)
  };
  var G__33294 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__33294__delegate.call(this, _, args)
  };
  G__33294.cljs$lang$maxFixedArity = 1;
  G__33294.cljs$lang$applyTo = function(arglist__33295) {
    var _ = cljs.core.first(arglist__33295);
    var args = cljs.core.rest(arglist__33295);
    return G__33294__delegate(_, args)
  };
  G__33294.cljs$lang$arity$variadic = G__33294__delegate;
  return G__33294
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__33296 = this;
  return cljs.core._dispatch.call(null, self__33296, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__33297 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_33299, _) {
  var this__33298 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__33298.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__33300 = this;
  var and__3822__auto____33301 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____33301) {
    return this__33300.uuid === other.uuid
  }else {
    return and__3822__auto____33301
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__33302 = this;
  var this__33303 = this;
  return cljs.core.pr_str.call(null, this__33303)
};
cljs.core.UUID;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__29329 = s;
      var limit__29330 = limit;
      var parts__29331 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__29330, 1)) {
          return cljs.core.conj.call(null, parts__29331, s__29329)
        }else {
          var temp__3971__auto____29332 = cljs.core.re_find.call(null, re, s__29329);
          if(cljs.core.truth_(temp__3971__auto____29332)) {
            var m__29333 = temp__3971__auto____29332;
            var index__29334 = s__29329.indexOf(m__29333);
            var G__29335 = s__29329.substring(index__29334 + cljs.core.count.call(null, m__29333));
            var G__29336 = limit__29330 - 1;
            var G__29337 = cljs.core.conj.call(null, parts__29331, s__29329.substring(0, index__29334));
            s__29329 = G__29335;
            limit__29330 = G__29336;
            parts__29331 = G__29337;
            continue
          }else {
            return cljs.core.conj.call(null, parts__29331, s__29329)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__29341 = s.length;
  while(true) {
    if(index__29341 === 0) {
      return""
    }else {
      var ch__29342 = cljs.core._lookup.call(null, s, index__29341 - 1, null);
      if(function() {
        var or__3824__auto____29343 = cljs.core._EQ_.call(null, ch__29342, "\n");
        if(or__3824__auto____29343) {
          return or__3824__auto____29343
        }else {
          return cljs.core._EQ_.call(null, ch__29342, "\r")
        }
      }()) {
        var G__29344 = index__29341 - 1;
        index__29341 = G__29344;
        continue
      }else {
        return s.substring(0, index__29341)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__29348 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____29349 = cljs.core.not.call(null, s__29348);
    if(or__3824__auto____29349) {
      return or__3824__auto____29349
    }else {
      var or__3824__auto____29350 = cljs.core._EQ_.call(null, "", s__29348);
      if(or__3824__auto____29350) {
        return or__3824__auto____29350
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__29348)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__29357 = new goog.string.StringBuffer;
  var length__29358 = s.length;
  var index__29359 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__29358, index__29359)) {
      return buffer__29357.toString()
    }else {
      var ch__29360 = s.charAt(index__29359);
      var temp__3971__auto____29361 = cljs.core._lookup.call(null, cmap, ch__29360, null);
      if(cljs.core.truth_(temp__3971__auto____29361)) {
        var replacement__29362 = temp__3971__auto____29361;
        buffer__29357.append([cljs.core.str(replacement__29362)].join(""))
      }else {
        buffer__29357.append(ch__29360)
      }
      var G__29363 = index__29359 + 1;
      index__29359 = G__29363;
      continue
    }
    break
  }
};
goog.provide("crate.util");
goog.require("cljs.core");
goog.require("clojure.string");
crate.util._STAR_base_url_STAR_ = null;
crate.util.as_str = function() {
  var as_str = null;
  var as_str__0 = function() {
    return""
  };
  var as_str__1 = function(x) {
    if(function() {
      var or__3824__auto____29287 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____29287) {
        return or__3824__auto____29287
      }else {
        return cljs.core.keyword_QMARK_.call(null, x)
      }
    }()) {
      return cljs.core.name.call(null, x)
    }else {
      return[cljs.core.str(x)].join("")
    }
  };
  var as_str__2 = function() {
    var G__29288__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__29289 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__29290 = cljs.core.next.call(null, more);
            s = G__29289;
            more = G__29290;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__29288 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__29288__delegate.call(this, x, xs)
    };
    G__29288.cljs$lang$maxFixedArity = 1;
    G__29288.cljs$lang$applyTo = function(arglist__29291) {
      var x = cljs.core.first(arglist__29291);
      var xs = cljs.core.rest(arglist__29291);
      return G__29288__delegate(x, xs)
    };
    G__29288.cljs$lang$arity$variadic = G__29288__delegate;
    return G__29288
  }();
  as_str = function(x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 0:
        return as_str__0.call(this);
      case 1:
        return as_str__1.call(this, x);
      default:
        return as_str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  as_str.cljs$lang$maxFixedArity = 1;
  as_str.cljs$lang$applyTo = as_str__2.cljs$lang$applyTo;
  as_str.cljs$lang$arity$0 = as_str__0;
  as_str.cljs$lang$arity$1 = as_str__1;
  as_str.cljs$lang$arity$variadic = as_str__2.cljs$lang$arity$variadic;
  return as_str
}();
crate.util.escape_html = function escape_html(text) {
  return crate.util.as_str.call(null, text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
};
crate.util.to_uri = function to_uri(uri) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, /^\w+:.*/, uri))) {
    return uri
  }else {
    return[cljs.core.str(crate.util._STAR_base_url_STAR_), cljs.core.str(uri)].join("")
  }
};
crate.util.url_encode_component = function url_encode_component(s) {
  return encodeURIComponent(crate.util.as_str.call(null, s))
};
crate.util.url_encode = function url_encode(params) {
  return clojure.string.join.call(null, "&", function() {
    var iter__6793__auto____29317 = function iter__29305(s__29306) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__29306__29312 = s__29306;
        while(true) {
          if(cljs.core.seq.call(null, s__29306__29312)) {
            var vec__29313__29314 = cljs.core.first.call(null, s__29306__29312);
            var k__29315 = cljs.core.nth.call(null, vec__29313__29314, 0, null);
            var v__29316 = cljs.core.nth.call(null, vec__29313__29314, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__29315)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__29316))].join(""), iter__29305.call(null, cljs.core.rest.call(null, s__29306__29312)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__6793__auto____29317.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__29320 = cljs.core.last.call(null, args);
    var args__29321 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__29321)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__29320) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__29320))].join("") : params__29320)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__29322) {
    var args = cljs.core.seq(arglist__29322);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__33505 = {};
  var G__33506__33507 = cljs.core.seq.call(null, m);
  if(G__33506__33507) {
    var G__33509__33511 = cljs.core.first.call(null, G__33506__33507);
    var vec__33510__33512 = G__33509__33511;
    var k__33513 = cljs.core.nth.call(null, vec__33510__33512, 0, null);
    var v__33514 = cljs.core.nth.call(null, vec__33510__33512, 1, null);
    var G__33506__33515 = G__33506__33507;
    var G__33509__33516 = G__33509__33511;
    var G__33506__33517 = G__33506__33515;
    while(true) {
      var vec__33518__33519 = G__33509__33516;
      var k__33520 = cljs.core.nth.call(null, vec__33518__33519, 0, null);
      var v__33521 = cljs.core.nth.call(null, vec__33518__33519, 1, null);
      var G__33506__33522 = G__33506__33517;
      out__33505[cljs.core.name.call(null, k__33520)] = v__33521;
      var temp__3974__auto____33523 = cljs.core.next.call(null, G__33506__33522);
      if(temp__3974__auto____33523) {
        var G__33506__33524 = temp__3974__auto____33523;
        var G__33525 = cljs.core.first.call(null, G__33506__33524);
        var G__33526 = G__33506__33524;
        G__33509__33516 = G__33525;
        G__33506__33517 = G__33526;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__33505
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__33528 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__33528)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__33529) {
    var v = cljs.core.first(arglist__33529);
    var text = cljs.core.rest(arglist__33529);
    return log__delegate(v, text)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__33535) {
          var vec__33536__33537 = p__33535;
          var k__33538 = cljs.core.nth.call(null, vec__33536__33537, 0, null);
          var v__33539 = cljs.core.nth.call(null, vec__33536__33537, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__33538), clj__GT_js.call(null, v__33539))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      var temp__3971__auto____33306 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____33306)) {
        var cm__33307 = temp__3971__auto____33306;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__33307), cljs.core.str("]")].join("")
      }else {
        return sel
      }
    }else {
      if(cljs.core.keyword_QMARK_.call(null, sel)) {
        return cljs.core.name.call(null, sel)
      }else {
        if("\ufdd0'else") {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__33308) {
    var vec__33312__33313 = p__33308;
    var context__33314 = cljs.core.nth.call(null, vec__33312__33313, 0, null);
    if(cljs.core.not.call(null, context__33314)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__33314)
    }
  };
  var $ = function(sel, var_args) {
    var p__33308 = null;
    if(goog.isDef(var_args)) {
      p__33308 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__33308)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__33315) {
    var sel = cljs.core.first(arglist__33315);
    var p__33308 = cljs.core.rest(arglist__33315);
    return $__delegate(sel, p__33308)
  };
  $.cljs$lang$arity$variadic = $__delegate;
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, this$, f)
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, this$, f, start)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3824__auto____33316 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____33316)) {
    return or__3824__auto____33316
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.get(0)
};
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__33317 = null;
  var G__33317__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__33317__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__33317 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__33317__2.call(this, _, k);
      case 3:
        return G__33317__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__33317
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.clj__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.clj__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__33318) {
    var vec__33323__33324 = p__33318;
    var v__33325 = cljs.core.nth.call(null, vec__33323__33324, 0, null);
    var a__33326 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__33325)) {
      return $elem.attr(a__33326)
    }else {
      return $elem.attr(a__33326, v__33325)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__33318 = null;
    if(goog.isDef(var_args)) {
      p__33318 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__33318)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__33327) {
    var $elem = cljs.core.first(arglist__33327);
    var a = cljs.core.first(cljs.core.next(arglist__33327));
    var p__33318 = cljs.core.rest(cljs.core.next(arglist__33327));
    return attr__delegate($elem, a, p__33318)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__33328) {
    var vec__33333__33334 = p__33328;
    var v__33335 = cljs.core.nth.call(null, vec__33333__33334, 0, null);
    var k__33336 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__33335)) {
      return $elem.data(k__33336)
    }else {
      return $elem.data(k__33336, v__33335)
    }
  };
  var data = function($elem, k, var_args) {
    var p__33328 = null;
    if(goog.isDef(var_args)) {
      p__33328 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__33328)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__33337) {
    var $elem = cljs.core.first(arglist__33337);
    var k = cljs.core.first(cljs.core.next(arglist__33337));
    var p__33328 = cljs.core.rest(cljs.core.next(arglist__33337));
    return data__delegate($elem, k, p__33328)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__33339 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__33339)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__33341 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__33341)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__33343 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__33343)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__33345 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__33345)
};
jayq.core.after = function after($elem, content) {
  return $elem.after(content)
};
jayq.core.before = function before($elem, content) {
  return $elem.before(content)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__33346) {
    var vec__33351__33352 = p__33346;
    var speed__33353 = cljs.core.nth.call(null, vec__33351__33352, 0, null);
    var on_finish__33354 = cljs.core.nth.call(null, vec__33351__33352, 1, null);
    return $elem.hide(speed__33353, on_finish__33354)
  };
  var hide = function($elem, var_args) {
    var p__33346 = null;
    if(goog.isDef(var_args)) {
      p__33346 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__33346)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__33355) {
    var $elem = cljs.core.first(arglist__33355);
    var p__33346 = cljs.core.rest(arglist__33355);
    return hide__delegate($elem, p__33346)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__33356) {
    var vec__33361__33362 = p__33356;
    var speed__33363 = cljs.core.nth.call(null, vec__33361__33362, 0, null);
    var on_finish__33364 = cljs.core.nth.call(null, vec__33361__33362, 1, null);
    return $elem.show(speed__33363, on_finish__33364)
  };
  var show = function($elem, var_args) {
    var p__33356 = null;
    if(goog.isDef(var_args)) {
      p__33356 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__33356)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__33365) {
    var $elem = cljs.core.first(arglist__33365);
    var p__33356 = cljs.core.rest(arglist__33365);
    return show__delegate($elem, p__33356)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__33366) {
    var vec__33371__33372 = p__33366;
    var speed__33373 = cljs.core.nth.call(null, vec__33371__33372, 0, null);
    var on_finish__33374 = cljs.core.nth.call(null, vec__33371__33372, 1, null);
    return $elem.toggle(speed__33373, on_finish__33374)
  };
  var toggle = function($elem, var_args) {
    var p__33366 = null;
    if(goog.isDef(var_args)) {
      p__33366 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__33366)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__33375) {
    var $elem = cljs.core.first(arglist__33375);
    var p__33366 = cljs.core.rest(arglist__33375);
    return toggle__delegate($elem, p__33366)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__33376) {
    var vec__33381__33382 = p__33376;
    var speed__33383 = cljs.core.nth.call(null, vec__33381__33382, 0, null);
    var on_finish__33384 = cljs.core.nth.call(null, vec__33381__33382, 1, null);
    return $elem.fadeOut(speed__33383, on_finish__33384)
  };
  var fade_out = function($elem, var_args) {
    var p__33376 = null;
    if(goog.isDef(var_args)) {
      p__33376 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__33376)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__33385) {
    var $elem = cljs.core.first(arglist__33385);
    var p__33376 = cljs.core.rest(arglist__33385);
    return fade_out__delegate($elem, p__33376)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__33386) {
    var vec__33391__33392 = p__33386;
    var speed__33393 = cljs.core.nth.call(null, vec__33391__33392, 0, null);
    var on_finish__33394 = cljs.core.nth.call(null, vec__33391__33392, 1, null);
    return $elem.fadeIn(speed__33393, on_finish__33394)
  };
  var fade_in = function($elem, var_args) {
    var p__33386 = null;
    if(goog.isDef(var_args)) {
      p__33386 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__33386)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__33395) {
    var $elem = cljs.core.first(arglist__33395);
    var p__33386 = cljs.core.rest(arglist__33395);
    return fade_in__delegate($elem, p__33386)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__33396) {
    var vec__33401__33402 = p__33396;
    var speed__33403 = cljs.core.nth.call(null, vec__33401__33402, 0, null);
    var on_finish__33404 = cljs.core.nth.call(null, vec__33401__33402, 1, null);
    return $elem.slideUp(speed__33403, on_finish__33404)
  };
  var slide_up = function($elem, var_args) {
    var p__33396 = null;
    if(goog.isDef(var_args)) {
      p__33396 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__33396)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__33405) {
    var $elem = cljs.core.first(arglist__33405);
    var p__33396 = cljs.core.rest(arglist__33405);
    return slide_up__delegate($elem, p__33396)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__33406) {
    var vec__33411__33412 = p__33406;
    var speed__33413 = cljs.core.nth.call(null, vec__33411__33412, 0, null);
    var on_finish__33414 = cljs.core.nth.call(null, vec__33411__33412, 1, null);
    return $elem.slideDown(speed__33413, on_finish__33414)
  };
  var slide_down = function($elem, var_args) {
    var p__33406 = null;
    if(goog.isDef(var_args)) {
      p__33406 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__33406)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__33415) {
    var $elem = cljs.core.first(arglist__33415);
    var p__33406 = cljs.core.rest(arglist__33415);
    return slide_down__delegate($elem, p__33406)
  };
  slide_down.cljs$lang$arity$variadic = slide_down__delegate;
  return slide_down
}();
jayq.core.parent = function parent($elem) {
  return $elem.parent()
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.closest = function() {
  var closest__delegate = function($elem, selector, p__33416) {
    var vec__33420__33421 = p__33416;
    var context__33422 = cljs.core.nth.call(null, vec__33420__33421, 0, null);
    return $elem.closest(selector, context__33422)
  };
  var closest = function($elem, selector, var_args) {
    var p__33416 = null;
    if(goog.isDef(var_args)) {
      p__33416 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__33416)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__33423) {
    var $elem = cljs.core.first(arglist__33423);
    var selector = cljs.core.first(cljs.core.next(arglist__33423));
    var p__33416 = cljs.core.rest(cljs.core.next(arglist__33423));
    return closest__delegate($elem, selector, p__33416)
  };
  closest.cljs$lang$arity$variadic = closest__delegate;
  return closest
}();
jayq.core.clone = function clone($elem) {
  return $elem.clone()
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__33424) {
    var vec__33428__33429 = p__33424;
    var v__33430 = cljs.core.nth.call(null, vec__33428__33429, 0, null);
    if(cljs.core.truth_(v__33430)) {
      return $elem.val(v__33430)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__33424 = null;
    if(goog.isDef(var_args)) {
      p__33424 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__33424)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__33431) {
    var $elem = cljs.core.first(arglist__33431);
    var p__33424 = cljs.core.rest(arglist__33431);
    return val__delegate($elem, p__33424)
  };
  val.cljs$lang$arity$variadic = val__delegate;
  return val
}();
jayq.core.serialize = function serialize($elem) {
  return $elem.serialize()
};
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.document_ready = function document_ready(func) {
  return jayq.core.$.call(null, document).ready(func)
};
jayq.core.xhr = function xhr(p__33432, content, callback) {
  var vec__33438__33439 = p__33432;
  var method__33440 = cljs.core.nth.call(null, vec__33438__33439, 0, null);
  var uri__33441 = cljs.core.nth.call(null, vec__33438__33439, 1, null);
  var params__33442 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__33440)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__33441, params__33442)
};
jayq.core.ajax = function() {
  var ajax = null;
  var ajax__1 = function(settings) {
    return jQuery.ajax(jayq.util.clj__GT_js.call(null, settings))
  };
  var ajax__2 = function(url, settings) {
    return jQuery.ajax(url, jayq.util.clj__GT_js.call(null, settings))
  };
  ajax = function(url, settings) {
    switch(arguments.length) {
      case 1:
        return ajax__1.call(this, url);
      case 2:
        return ajax__2.call(this, url, settings)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ajax.cljs$lang$arity$1 = ajax__1;
  ajax.cljs$lang$arity$2 = ajax__2;
  return ajax
}();
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.unbind = function() {
  var unbind__delegate = function($elem, ev, p__33443) {
    var vec__33447__33448 = p__33443;
    var func__33449 = cljs.core.nth.call(null, vec__33447__33448, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__33449)
  };
  var unbind = function($elem, ev, var_args) {
    var p__33443 = null;
    if(goog.isDef(var_args)) {
      p__33443 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__33443)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__33450) {
    var $elem = cljs.core.first(arglist__33450);
    var ev = cljs.core.first(cljs.core.next(arglist__33450));
    var p__33443 = cljs.core.rest(cljs.core.next(arglist__33450));
    return unbind__delegate($elem, ev, p__33443)
  };
  unbind.cljs$lang$arity$variadic = unbind__delegate;
  return unbind
}();
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.__GT_event = function __GT_event(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return cljs.core.name.call(null, e)
  }else {
    if(cljs.core.map_QMARK_.call(null, e)) {
      return jayq.util.clj__GT_js.call(null, e)
    }else {
      if(cljs.core.coll_QMARK_.call(null, e)) {
        return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.name, e))
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Unknown event type: "), cljs.core.str(e)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.on = function() {
  var on__delegate = function($elem, events, p__33451) {
    var vec__33457__33458 = p__33451;
    var sel__33459 = cljs.core.nth.call(null, vec__33457__33458, 0, null);
    var data__33460 = cljs.core.nth.call(null, vec__33457__33458, 1, null);
    var handler__33461 = cljs.core.nth.call(null, vec__33457__33458, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__33459), data__33460, handler__33461)
  };
  var on = function($elem, events, var_args) {
    var p__33451 = null;
    if(goog.isDef(var_args)) {
      p__33451 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__33451)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__33462) {
    var $elem = cljs.core.first(arglist__33462);
    var events = cljs.core.first(cljs.core.next(arglist__33462));
    var p__33451 = cljs.core.rest(cljs.core.next(arglist__33462));
    return on__delegate($elem, events, p__33451)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__33463) {
    var vec__33469__33470 = p__33463;
    var sel__33471 = cljs.core.nth.call(null, vec__33469__33470, 0, null);
    var data__33472 = cljs.core.nth.call(null, vec__33469__33470, 1, null);
    var handler__33473 = cljs.core.nth.call(null, vec__33469__33470, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__33471), data__33472, handler__33473)
  };
  var one = function($elem, events, var_args) {
    var p__33463 = null;
    if(goog.isDef(var_args)) {
      p__33463 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__33463)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__33474) {
    var $elem = cljs.core.first(arglist__33474);
    var events = cljs.core.first(cljs.core.next(arglist__33474));
    var p__33463 = cljs.core.rest(cljs.core.next(arglist__33474));
    return one__delegate($elem, events, p__33463)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__33475) {
    var vec__33480__33481 = p__33475;
    var sel__33482 = cljs.core.nth.call(null, vec__33480__33481, 0, null);
    var handler__33483 = cljs.core.nth.call(null, vec__33480__33481, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__33482), handler__33483)
  };
  var off = function($elem, events, var_args) {
    var p__33475 = null;
    if(goog.isDef(var_args)) {
      p__33475 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__33475)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__33484) {
    var $elem = cljs.core.first(arglist__33484);
    var events = cljs.core.first(cljs.core.next(arglist__33484));
    var p__33475 = cljs.core.rest(cljs.core.next(arglist__33484));
    return off__delegate($elem, events, p__33475)
  };
  off.cljs$lang$arity$variadic = off__delegate;
  return off
}();
jayq.core.prevent = function prevent(e) {
  return e.preventDefault()
};
goog.provide("cljs.reader");
goog.require("cljs.core");
goog.require("goog.string");
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3822__auto____33593 = reader;
    if(and__3822__auto____33593) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____33593
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    var x__6694__auto____33594 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____33595 = cljs.reader.read_char[goog.typeOf(x__6694__auto____33594)];
      if(or__3824__auto____33595) {
        return or__3824__auto____33595
      }else {
        var or__3824__auto____33596 = cljs.reader.read_char["_"];
        if(or__3824__auto____33596) {
          return or__3824__auto____33596
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____33601 = reader;
    if(and__3822__auto____33601) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____33601
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    var x__6694__auto____33602 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____33603 = cljs.reader.unread[goog.typeOf(x__6694__auto____33602)];
      if(or__3824__auto____33603) {
        return or__3824__auto____33603
      }else {
        var or__3824__auto____33604 = cljs.reader.unread["_"];
        if(or__3824__auto____33604) {
          return or__3824__auto____33604
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$lang$type = true;
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__6640__auto__) {
  return cljs.core.list.call(null, "cljs.reader/StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var this__33605 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__33605.buffer_atom))) {
    var idx__33606 = cljs.core.deref.call(null, this__33605.index_atom);
    cljs.core.swap_BANG_.call(null, this__33605.index_atom, cljs.core.inc);
    return this__33605.s[idx__33606]
  }else {
    var buf__33607 = cljs.core.deref.call(null, this__33605.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__33605.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__33607)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__33608 = this;
  return cljs.core.swap_BANG_.call(null, this__33608.buffer_atom, function(p1__33588_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__33588_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____33610 = goog.string.isBreakingWhitespace(ch);
  if(cljs.core.truth_(or__3824__auto____33610)) {
    return or__3824__auto____33610
  }else {
    return"," === ch
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric(ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return";" === ch
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3824__auto____33615 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____33615) {
    return or__3824__auto____33615
  }else {
    var and__3822__auto____33617 = function() {
      var or__3824__auto____33616 = "+" === initch;
      if(or__3824__auto____33616) {
        return or__3824__auto____33616
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____33617)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__33618 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__33618);
        return next_ch__33618
      }())
    }else {
      return and__3822__auto____33617
    }
  }
};
cljs.reader.reader_error = function() {
  var reader_error__delegate = function(rdr, msg) {
    throw new Error(cljs.core.apply.call(null, cljs.core.str, msg));
  };
  var reader_error = function(rdr, var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return reader_error__delegate.call(this, rdr, msg)
  };
  reader_error.cljs$lang$maxFixedArity = 1;
  reader_error.cljs$lang$applyTo = function(arglist__33619) {
    var rdr = cljs.core.first(arglist__33619);
    var msg = cljs.core.rest(arglist__33619);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____33623 = !(ch === "#");
  if(and__3822__auto____33623) {
    var and__3822__auto____33624 = !(ch === "'");
    if(and__3822__auto____33624) {
      var and__3822__auto____33625 = !(ch === ":");
      if(and__3822__auto____33625) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____33625
      }
    }else {
      return and__3822__auto____33624
    }
  }else {
    return and__3822__auto____33623
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__33630 = new goog.string.StringBuffer(initch);
  var ch__33631 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____33632 = ch__33631 == null;
      if(or__3824__auto____33632) {
        return or__3824__auto____33632
      }else {
        var or__3824__auto____33633 = cljs.reader.whitespace_QMARK_.call(null, ch__33631);
        if(or__3824__auto____33633) {
          return or__3824__auto____33633
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__33631)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__33631);
      return sb__33630.toString()
    }else {
      var G__33634 = function() {
        sb__33630.append(ch__33631);
        return sb__33630
      }();
      var G__33635 = cljs.reader.read_char.call(null, rdr);
      sb__33630 = G__33634;
      ch__33631 = G__33635;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__33639 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____33640 = ch__33639 === "n";
      if(or__3824__auto____33640) {
        return or__3824__auto____33640
      }else {
        var or__3824__auto____33641 = ch__33639 === "r";
        if(or__3824__auto____33641) {
          return or__3824__auto____33641
        }else {
          return ch__33639 == null
        }
      }
    }()) {
      return reader
    }else {
      continue
    }
    break
  }
};
cljs.reader.int_pattern = cljs.core.re_pattern.call(null, "([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?");
cljs.reader.ratio_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+)/([0-9]+)");
cljs.reader.float_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?");
cljs.reader.symbol_pattern = cljs.core.re_pattern.call(null, "[:]?([^0-9/].*/)?([^0-9/][^/]*)");
cljs.reader.re_find_STAR_ = function re_find_STAR_(re, s) {
  var matches__33643 = re.exec(s);
  if(matches__33643 == null) {
    return null
  }else {
    if(matches__33643.length === 1) {
      return matches__33643[0]
    }else {
      return matches__33643
    }
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__33651 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__33652 = groups__33651[2];
  if(!function() {
    var or__3824__auto____33653 = group3__33652 == null;
    if(or__3824__auto____33653) {
      return or__3824__auto____33653
    }else {
      return group3__33652.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__33654 = "-" === groups__33651[1] ? -1 : 1;
    var a__33655 = cljs.core.truth_(groups__33651[3]) ? [groups__33651[3], 10] : cljs.core.truth_(groups__33651[4]) ? [groups__33651[4], 16] : cljs.core.truth_(groups__33651[5]) ? [groups__33651[5], 8] : cljs.core.truth_(groups__33651[7]) ? [groups__33651[7], parseInt(groups__33651[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__33656 = a__33655[0];
    var radix__33657 = a__33655[1];
    if(n__33656 == null) {
      return null
    }else {
      return negate__33654 * parseInt(n__33656, radix__33657)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__33661 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__33662 = groups__33661[1];
  var denominator__33663 = groups__33661[2];
  return parseInt(numinator__33662) / parseInt(denominator__33663)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__33666 = re.exec(s);
  if(function() {
    var and__3822__auto____33667 = !(matches__33666 == null);
    if(and__3822__auto____33667) {
      return matches__33666[0] === s
    }else {
      return and__3822__auto____33667
    }
  }()) {
    if(matches__33666.length === 1) {
      return matches__33666[0]
    }else {
      return matches__33666
    }
  }else {
    return null
  }
};
cljs.reader.match_number = function match_number(s) {
  if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.int_pattern, s))) {
    return cljs.reader.match_int.call(null, s)
  }else {
    if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.ratio_pattern, s))) {
      return cljs.reader.match_ratio.call(null, s)
    }else {
      if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.float_pattern, s))) {
        return cljs.reader.match_float.call(null, s)
      }else {
        return null
      }
    }
  }
};
cljs.reader.escape_char_map = function escape_char_map(c) {
  if(c === "t") {
    return"\t"
  }else {
    if(c === "r") {
      return"\r"
    }else {
      if(c === "n") {
        return"\n"
      }else {
        if(c === "\\") {
          return"\\"
        }else {
          if(c === '"') {
            return'"'
          }else {
            if(c === "b") {
              return"\u0008"
            }else {
              if(c === "f") {
                return"\u000c"
              }else {
                if("\ufdd0'else") {
                  return null
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.read_2_chars = function read_2_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.read_4_chars = function read_4_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.unicode_2_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{2}");
cljs.reader.unicode_4_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{4}");
cljs.reader.validate_unicode_escape = function validate_unicode_escape(unicode_pattern, reader, escape_char, unicode_str) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, unicode_pattern, unicode_str))) {
    return unicode_str
  }else {
    return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", escape_char, unicode_str)
  }
};
cljs.reader.make_unicode_char = function make_unicode_char(code_str) {
  var code__33669 = parseInt(code_str, 16);
  return String.fromCharCode(code__33669)
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__33672 = cljs.reader.read_char.call(null, reader);
  var mapresult__33673 = cljs.reader.escape_char_map.call(null, ch__33672);
  if(cljs.core.truth_(mapresult__33673)) {
    return mapresult__33673
  }else {
    if(ch__33672 === "x") {
      return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_2_pattern, reader, ch__33672, cljs.reader.read_2_chars.call(null, reader)))
    }else {
      if(ch__33672 === "u") {
        return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_4_pattern, reader, ch__33672, cljs.reader.read_4_chars.call(null, reader)))
      }else {
        if(cljs.reader.numeric_QMARK_.call(null, ch__33672)) {
          return String.fromCharCode(ch__33672)
        }else {
          if("\ufdd0'else") {
            return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", ch__33672)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__33675 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__33675))) {
      var G__33676 = cljs.reader.read_char.call(null, rdr);
      ch__33675 = G__33676;
      continue
    }else {
      return ch__33675
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__33683 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    var ch__33684 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__33684)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__33684) {
      return cljs.core.persistent_BANG_.call(null, a__33683)
    }else {
      var temp__3971__auto____33685 = cljs.reader.macros.call(null, ch__33684);
      if(cljs.core.truth_(temp__3971__auto____33685)) {
        var macrofn__33686 = temp__3971__auto____33685;
        var mret__33687 = macrofn__33686.call(null, rdr, ch__33684);
        var G__33689 = mret__33687 === rdr ? a__33683 : cljs.core.conj_BANG_.call(null, a__33683, mret__33687);
        a__33683 = G__33689;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__33684);
        var o__33688 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__33690 = o__33688 === rdr ? a__33683 : cljs.core.conj_BANG_.call(null, a__33683, o__33688);
        a__33683 = G__33690;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch__33695 = cljs.reader.read_char.call(null, rdr);
  var dm__33696 = cljs.reader.dispatch_macros.call(null, ch__33695);
  if(cljs.core.truth_(dm__33696)) {
    return dm__33696.call(null, rdr, _)
  }else {
    var temp__3971__auto____33697 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__33695);
    if(cljs.core.truth_(temp__3971__auto____33697)) {
      var obj__33698 = temp__3971__auto____33697;
      return obj__33698
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__33695)
    }
  }
};
cljs.reader.read_unmatched_delimiter = function read_unmatched_delimiter(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Unmached delimiter ", ch)
};
cljs.reader.read_list = function read_list(rdr, _) {
  return cljs.core.apply.call(null, cljs.core.list, cljs.reader.read_delimited_list.call(null, ")", rdr, true))
};
cljs.reader.read_comment = cljs.reader.skip_line;
cljs.reader.read_vector = function read_vector(rdr, _) {
  return cljs.reader.read_delimited_list.call(null, "]", rdr, true)
};
cljs.reader.read_map = function read_map(rdr, _) {
  var l__33700 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__33700))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__33700)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__33707 = new goog.string.StringBuffer(initch);
  var ch__33708 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____33709 = ch__33708 == null;
      if(or__3824__auto____33709) {
        return or__3824__auto____33709
      }else {
        var or__3824__auto____33710 = cljs.reader.whitespace_QMARK_.call(null, ch__33708);
        if(or__3824__auto____33710) {
          return or__3824__auto____33710
        }else {
          return cljs.reader.macros.call(null, ch__33708)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__33708);
      var s__33711 = buffer__33707.toString();
      var or__3824__auto____33712 = cljs.reader.match_number.call(null, s__33711);
      if(cljs.core.truth_(or__3824__auto____33712)) {
        return or__3824__auto____33712
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__33711, "]")
      }
    }else {
      var G__33713 = function() {
        buffer__33707.append(ch__33708);
        return buffer__33707
      }();
      var G__33714 = cljs.reader.read_char.call(null, reader);
      buffer__33707 = G__33713;
      ch__33708 = G__33714;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__33717 = new goog.string.StringBuffer;
  var ch__33718 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__33718 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__33718) {
        var G__33719 = function() {
          buffer__33717.append(cljs.reader.escape_char.call(null, buffer__33717, reader));
          return buffer__33717
        }();
        var G__33720 = cljs.reader.read_char.call(null, reader);
        buffer__33717 = G__33719;
        ch__33718 = G__33720;
        continue
      }else {
        if('"' === ch__33718) {
          return buffer__33717.toString()
        }else {
          if("\ufdd0'default") {
            var G__33721 = function() {
              buffer__33717.append(ch__33718);
              return buffer__33717
            }();
            var G__33722 = cljs.reader.read_char.call(null, reader);
            buffer__33717 = G__33721;
            ch__33718 = G__33722;
            continue
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.special_symbols = function special_symbols(t, not_found) {
  if(t === "nil") {
    return null
  }else {
    if(t === "true") {
      return true
    }else {
      if(t === "false") {
        return false
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.read_symbol = function read_symbol(reader, initch) {
  var token__33724 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains(token__33724, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__33724, 0, token__33724.indexOf("/")), cljs.core.subs.call(null, token__33724, token__33724.indexOf("/") + 1, token__33724.length))
  }else {
    return cljs.reader.special_symbols.call(null, token__33724, cljs.core.symbol.call(null, token__33724))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__33734 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__33735 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__33734);
  var token__33736 = a__33735[0];
  var ns__33737 = a__33735[1];
  var name__33738 = a__33735[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____33740 = function() {
      var and__3822__auto____33739 = !(void 0 === ns__33737);
      if(and__3822__auto____33739) {
        return ns__33737.substring(ns__33737.length - 2, ns__33737.length) === ":/"
      }else {
        return and__3822__auto____33739
      }
    }();
    if(cljs.core.truth_(or__3824__auto____33740)) {
      return or__3824__auto____33740
    }else {
      var or__3824__auto____33741 = name__33738[name__33738.length - 1] === ":";
      if(or__3824__auto____33741) {
        return or__3824__auto____33741
      }else {
        return!(token__33736.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__33736)
  }else {
    if(function() {
      var and__3822__auto____33742 = !(ns__33737 == null);
      if(and__3822__auto____33742) {
        return ns__33737.length > 0
      }else {
        return and__3822__auto____33742
      }
    }()) {
      return cljs.core.keyword.call(null, ns__33737.substring(0, ns__33737.indexOf("/")), name__33738)
    }else {
      return cljs.core.keyword.call(null, token__33736)
    }
  }
};
cljs.reader.desugar_meta = function desugar_meta(f) {
  if(cljs.core.symbol_QMARK_.call(null, f)) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
  }else {
    if(cljs.core.string_QMARK_.call(null, f)) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
    }else {
      if(cljs.core.keyword_QMARK_.call(null, f)) {
        return cljs.core.PersistentArrayMap.fromArrays([f], [true])
      }else {
        if("\ufdd0'else") {
          return f
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.wrapping_reader = function wrapping_reader(sym) {
  return function(rdr, _) {
    return cljs.core.list.call(null, sym, cljs.reader.read.call(null, rdr, true, null, true))
  }
};
cljs.reader.throwing_reader = function throwing_reader(msg) {
  return function(rdr, _) {
    return cljs.reader.reader_error.call(null, rdr, msg)
  }
};
cljs.reader.read_meta = function read_meta(rdr, _) {
  var m__33748 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__33748)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__33749 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__33750__33751 = o__33749;
    if(G__33750__33751) {
      if(function() {
        var or__3824__auto____33752 = G__33750__33751.cljs$lang$protocol_mask$partition0$ & 262144;
        if(or__3824__auto____33752) {
          return or__3824__auto____33752
        }else {
          return G__33750__33751.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__33750__33751.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__33750__33751)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__33750__33751)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__33749, cljs.core.merge.call(null, cljs.core.meta.call(null, o__33749), m__33748))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Metadata can only be applied to IWithMetas")
  }
};
cljs.reader.read_set = function read_set(rdr, _) {
  return cljs.core.set.call(null, cljs.reader.read_delimited_list.call(null, "}", rdr, true))
};
cljs.reader.read_regex = function read_regex(rdr, ch) {
  return cljs.core.re_pattern.call(null, cljs.reader.read_string_STAR_.call(null, rdr, ch))
};
cljs.reader.read_discard = function read_discard(rdr, _) {
  cljs.reader.read.call(null, rdr, true, null, true);
  return rdr
};
cljs.reader.macros = function macros(c) {
  if(c === '"') {
    return cljs.reader.read_string_STAR_
  }else {
    if(c === ":") {
      return cljs.reader.read_keyword
    }else {
      if(c === ";") {
        return cljs.reader.not_implemented
      }else {
        if(c === "'") {
          return cljs.reader.wrapping_reader.call(null, "\ufdd1'quote")
        }else {
          if(c === "@") {
            return cljs.reader.wrapping_reader.call(null, "\ufdd1'deref")
          }else {
            if(c === "^") {
              return cljs.reader.read_meta
            }else {
              if(c === "`") {
                return cljs.reader.not_implemented
              }else {
                if(c === "~") {
                  return cljs.reader.not_implemented
                }else {
                  if(c === "(") {
                    return cljs.reader.read_list
                  }else {
                    if(c === ")") {
                      return cljs.reader.read_unmatched_delimiter
                    }else {
                      if(c === "[") {
                        return cljs.reader.read_vector
                      }else {
                        if(c === "]") {
                          return cljs.reader.read_unmatched_delimiter
                        }else {
                          if(c === "{") {
                            return cljs.reader.read_map
                          }else {
                            if(c === "}") {
                              return cljs.reader.read_unmatched_delimiter
                            }else {
                              if(c === "\\") {
                                return cljs.reader.read_char
                              }else {
                                if(c === "%") {
                                  return cljs.reader.not_implemented
                                }else {
                                  if(c === "#") {
                                    return cljs.reader.read_dispatch
                                  }else {
                                    if("\ufdd0'else") {
                                      return null
                                    }else {
                                      return null
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.dispatch_macros = function dispatch_macros(s) {
  if(s === "{") {
    return cljs.reader.read_set
  }else {
    if(s === "<") {
      return cljs.reader.throwing_reader.call(null, "Unreadable form")
    }else {
      if(s === '"') {
        return cljs.reader.read_regex
      }else {
        if(s === "!") {
          return cljs.reader.read_comment
        }else {
          if(s === "_") {
            return cljs.reader.read_discard
          }else {
            if("\ufdd0'else") {
              return null
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch__33756 = cljs.reader.read_char.call(null, reader);
    if(ch__33756 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__33756)) {
        var G__33759 = reader;
        var G__33760 = eof_is_error;
        var G__33761 = sentinel;
        var G__33762 = is_recursive;
        reader = G__33759;
        eof_is_error = G__33760;
        sentinel = G__33761;
        is_recursive = G__33762;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__33756)) {
          var G__33763 = cljs.reader.read_comment.call(null, reader, ch__33756);
          var G__33764 = eof_is_error;
          var G__33765 = sentinel;
          var G__33766 = is_recursive;
          reader = G__33763;
          eof_is_error = G__33764;
          sentinel = G__33765;
          is_recursive = G__33766;
          continue
        }else {
          if("\ufdd0'else") {
            var f__33757 = cljs.reader.macros.call(null, ch__33756);
            var res__33758 = cljs.core.truth_(f__33757) ? f__33757.call(null, reader, ch__33756) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__33756) ? cljs.reader.read_number.call(null, reader, ch__33756) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__33756) : null;
            if(res__33758 === reader) {
              var G__33767 = reader;
              var G__33768 = eof_is_error;
              var G__33769 = sentinel;
              var G__33770 = is_recursive;
              reader = G__33767;
              eof_is_error = G__33768;
              sentinel = G__33769;
              is_recursive = G__33770;
              continue
            }else {
              return res__33758
            }
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.read_string = function read_string(s) {
  var r__33772 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__33772, true, null, false)
};
cljs.reader.zero_fill_right = function zero_fill_right(s, width) {
  if(cljs.core._EQ_.call(null, width, cljs.core.count.call(null, s))) {
    return s
  }else {
    if(width < cljs.core.count.call(null, s)) {
      return s.substring(0, width)
    }else {
      if("\ufdd0'else") {
        var b__33774 = new goog.string.StringBuffer(s);
        while(true) {
          if(b__33774.getLength() < width) {
            var G__33775 = b__33774.append("0");
            b__33774 = G__33775;
            continue
          }else {
            return b__33774.toString()
          }
          break
        }
      }else {
        return null
      }
    }
  }
};
cljs.reader.divisible_QMARK_ = function divisible_QMARK_(num, div) {
  return num % div === 0
};
cljs.reader.indivisible_QMARK_ = function indivisible_QMARK_(num, div) {
  return cljs.core.not.call(null, cljs.reader.divisible_QMARK_.call(null, num, div))
};
cljs.reader.leap_year_QMARK_ = function leap_year_QMARK_(year) {
  var and__3822__auto____33778 = cljs.reader.divisible_QMARK_.call(null, year, 4);
  if(cljs.core.truth_(and__3822__auto____33778)) {
    var or__3824__auto____33779 = cljs.reader.indivisible_QMARK_.call(null, year, 100);
    if(cljs.core.truth_(or__3824__auto____33779)) {
      return or__3824__auto____33779
    }else {
      return cljs.reader.divisible_QMARK_.call(null, year, 400)
    }
  }else {
    return and__3822__auto____33778
  }
};
cljs.reader.days_in_month = function() {
  var dim_norm__33784 = cljs.core.PersistentVector.fromArray([null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  var dim_leap__33785 = cljs.core.PersistentVector.fromArray([null, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  return function(month, leap_year_QMARK_) {
    return cljs.core._lookup.call(null, cljs.core.truth_(leap_year_QMARK_) ? dim_leap__33785 : dim_norm__33784, month, null)
  }
}();
cljs.reader.parse_and_validate_timestamp = function() {
  var timestamp__33786 = /(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
  var check__33788 = function(low, n, high, msg) {
    if(function() {
      var and__3822__auto____33787 = low <= n;
      if(and__3822__auto____33787) {
        return n <= high
      }else {
        return and__3822__auto____33787
      }
    }()) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str(msg), cljs.core.str(" Failed:  "), cljs.core.str(low), cljs.core.str("<="), cljs.core.str(n), cljs.core.str("<="), cljs.core.str(high)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'<=", "\ufdd1'low", "\ufdd1'n", "\ufdd1'high"), cljs.core.hash_map("\ufdd0'line", 474))))].join(""));
    }
    return n
  };
  return function(ts) {
    var temp__3974__auto____33789 = cljs.core.map.call(null, cljs.core.vec, cljs.core.split_at.call(null, 8, cljs.core.re_matches.call(null, timestamp__33786, ts)));
    if(cljs.core.truth_(temp__3974__auto____33789)) {
      var vec__33790__33793 = temp__3974__auto____33789;
      var vec__33791__33794 = cljs.core.nth.call(null, vec__33790__33793, 0, null);
      var ___33795 = cljs.core.nth.call(null, vec__33791__33794, 0, null);
      var years__33796 = cljs.core.nth.call(null, vec__33791__33794, 1, null);
      var months__33797 = cljs.core.nth.call(null, vec__33791__33794, 2, null);
      var days__33798 = cljs.core.nth.call(null, vec__33791__33794, 3, null);
      var hours__33799 = cljs.core.nth.call(null, vec__33791__33794, 4, null);
      var minutes__33800 = cljs.core.nth.call(null, vec__33791__33794, 5, null);
      var seconds__33801 = cljs.core.nth.call(null, vec__33791__33794, 6, null);
      var milliseconds__33802 = cljs.core.nth.call(null, vec__33791__33794, 7, null);
      var vec__33792__33803 = cljs.core.nth.call(null, vec__33790__33793, 1, null);
      var ___33804 = cljs.core.nth.call(null, vec__33792__33803, 0, null);
      var ___33805 = cljs.core.nth.call(null, vec__33792__33803, 1, null);
      var ___33806 = cljs.core.nth.call(null, vec__33792__33803, 2, null);
      var V__33807 = vec__33790__33793;
      var vec__33808__33811 = cljs.core.map.call(null, function(v) {
        return cljs.core.map.call(null, function(p1__33783_SHARP_) {
          return parseInt(p1__33783_SHARP_)
        }, v)
      }, cljs.core.map.call(null, function(p1__33781_SHARP_, p2__33780_SHARP_) {
        return cljs.core.update_in.call(null, p2__33780_SHARP_, cljs.core.PersistentVector.fromArray([0], true), p1__33781_SHARP_)
      }, cljs.core.PersistentVector.fromArray([cljs.core.constantly.call(null, null), function(p1__33782_SHARP_) {
        if(cljs.core._EQ_.call(null, p1__33782_SHARP_, "-")) {
          return"-1"
        }else {
          return"1"
        }
      }], true), V__33807));
      var vec__33809__33812 = cljs.core.nth.call(null, vec__33808__33811, 0, null);
      var ___33813 = cljs.core.nth.call(null, vec__33809__33812, 0, null);
      var y__33814 = cljs.core.nth.call(null, vec__33809__33812, 1, null);
      var mo__33815 = cljs.core.nth.call(null, vec__33809__33812, 2, null);
      var d__33816 = cljs.core.nth.call(null, vec__33809__33812, 3, null);
      var h__33817 = cljs.core.nth.call(null, vec__33809__33812, 4, null);
      var m__33818 = cljs.core.nth.call(null, vec__33809__33812, 5, null);
      var s__33819 = cljs.core.nth.call(null, vec__33809__33812, 6, null);
      var ms__33820 = cljs.core.nth.call(null, vec__33809__33812, 7, null);
      var vec__33810__33821 = cljs.core.nth.call(null, vec__33808__33811, 1, null);
      var offset_sign__33822 = cljs.core.nth.call(null, vec__33810__33821, 0, null);
      var offset_hours__33823 = cljs.core.nth.call(null, vec__33810__33821, 1, null);
      var offset_minutes__33824 = cljs.core.nth.call(null, vec__33810__33821, 2, null);
      var offset__33825 = offset_sign__33822 * (offset_hours__33823 * 60 + offset_minutes__33824);
      return cljs.core.PersistentVector.fromArray([cljs.core.not.call(null, years__33796) ? 1970 : y__33814, cljs.core.not.call(null, months__33797) ? 1 : check__33788.call(null, 1, mo__33815, 12, "timestamp month field must be in range 1..12"), cljs.core.not.call(null, days__33798) ? 1 : check__33788.call(null, 1, d__33816, cljs.reader.days_in_month.call(null, mo__33815, cljs.reader.leap_year_QMARK_.call(null, y__33814)), "timestamp day field must be in range 1..last day in month"), cljs.core.not.call(null, 
      hours__33799) ? 0 : check__33788.call(null, 0, h__33817, 23, "timestamp hour field must be in range 0..23"), cljs.core.not.call(null, minutes__33800) ? 0 : check__33788.call(null, 0, m__33818, 59, "timestamp minute field must be in range 0..59"), cljs.core.not.call(null, seconds__33801) ? 0 : check__33788.call(null, 0, s__33819, cljs.core._EQ_.call(null, m__33818, 59) ? 60 : 59, "timestamp second field must be in range 0..60"), cljs.core.not.call(null, milliseconds__33802) ? 0 : check__33788.call(null, 
      0, ms__33820, 999, "timestamp millisecond field must be in range 0..999"), offset__33825], true)
    }else {
      return null
    }
  }
}();
cljs.reader.parse_timestamp = function parse_timestamp(ts) {
  var temp__3971__auto____33837 = cljs.reader.parse_and_validate_timestamp.call(null, ts);
  if(cljs.core.truth_(temp__3971__auto____33837)) {
    var vec__33838__33839 = temp__3971__auto____33837;
    var years__33840 = cljs.core.nth.call(null, vec__33838__33839, 0, null);
    var months__33841 = cljs.core.nth.call(null, vec__33838__33839, 1, null);
    var days__33842 = cljs.core.nth.call(null, vec__33838__33839, 2, null);
    var hours__33843 = cljs.core.nth.call(null, vec__33838__33839, 3, null);
    var minutes__33844 = cljs.core.nth.call(null, vec__33838__33839, 4, null);
    var seconds__33845 = cljs.core.nth.call(null, vec__33838__33839, 5, null);
    var ms__33846 = cljs.core.nth.call(null, vec__33838__33839, 6, null);
    var offset__33847 = cljs.core.nth.call(null, vec__33838__33839, 7, null);
    return new Date(Date.UTC(years__33840, months__33841 - 1, days__33842, hours__33843, minutes__33844, seconds__33845, ms__33846) - offset__33847 * 60 * 1E3)
  }else {
    return cljs.reader.reader_error.call(null, null, [cljs.core.str("Unrecognized date/time syntax: "), cljs.core.str(ts)].join(""))
  }
};
cljs.reader.read_date = function read_date(s) {
  if(cljs.core.string_QMARK_.call(null, s)) {
    return cljs.reader.parse_timestamp.call(null, s)
  }else {
    return cljs.reader.reader_error.call(null, null, "Instance literal expects a string for its timestamp.")
  }
};
cljs.reader.read_queue = function read_queue(elems) {
  if(cljs.core.vector_QMARK_.call(null, elems)) {
    return cljs.core.into.call(null, cljs.core.PersistentQueue.EMPTY, elems)
  }else {
    return cljs.reader.reader_error.call(null, null, "Queue literal expects a vector for its elements.")
  }
};
cljs.reader.read_uuid = function read_uuid(uuid) {
  if(cljs.core.string_QMARK_.call(null, uuid)) {
    return new cljs.core.UUID(uuid)
  }else {
    return cljs.reader.reader_error.call(null, null, "UUID literal expects a string as its representation.")
  }
};
cljs.reader._STAR_tag_table_STAR_ = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["inst", "uuid", "queue"], {"inst":cljs.reader.read_date, "uuid":cljs.reader.read_uuid, "queue":cljs.reader.read_queue}));
cljs.reader.maybe_read_tagged_type = function maybe_read_tagged_type(rdr, initch) {
  var tag__33851 = cljs.reader.read_symbol.call(null, rdr, initch);
  var temp__3971__auto____33852 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__33851), null);
  if(cljs.core.truth_(temp__3971__auto____33852)) {
    var pfn__33853 = temp__3971__auto____33852;
    return pfn__33853.call(null, cljs.reader.read.call(null, rdr, true, null, false))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__33851), " in ", cljs.core.pr_str.call(null, cljs.core.keys.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_))))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__33856 = cljs.core.name.call(null, tag);
  var old_parser__33857 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__33856, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__33856, f);
  return old_parser__33857
};
cljs.reader.deregister_tag_parser_BANG_ = function deregister_tag_parser_BANG_(tag) {
  var tag__33860 = cljs.core.name.call(null, tag);
  var old_parser__33861 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__33860, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.dissoc, tag__33860);
  return old_parser__33861
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.provide("goog.uri.utils.QueryArray");
goog.provide("goog.uri.utils.QueryValue");
goog.provide("goog.uri.utils.StandardQueryParam");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, this.path_.charAt(0) == "/" ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    this.count_ = 0;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("fetch.util");
goog.require("cljs.core");
fetch.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__33583) {
          var vec__33584__33585 = p__33583;
          var k__33586 = cljs.core.nth.call(null, vec__33584__33585, 0, null);
          var v__33587 = cljs.core.nth.call(null, vec__33584__33585, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__33586), clj__GT_js.call(null, v__33587))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = goog.userAgent.WEBKIT ? !opt_cancel : !!opt_cancel;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.Replacer;
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray_(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray_ = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_ = null;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.xhrMonitor");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.userAgent");
goog.net.XhrMonitor_ = function() {
  if(!goog.userAgent.GECKO) {
    return
  }
  this.contextsToXhr_ = {};
  this.xhrToContexts_ = {};
  this.stack_ = []
};
goog.net.XhrMonitor_.getKey = function(obj) {
  return goog.isString(obj) ? obj : goog.isObject(obj) ? goog.getUid(obj) : ""
};
goog.net.XhrMonitor_.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.xhrMonitor");
goog.net.XhrMonitor_.prototype.enabled_ = goog.userAgent.GECKO;
goog.net.XhrMonitor_.prototype.setEnabled = function(val) {
  this.enabled_ = goog.userAgent.GECKO && val
};
goog.net.XhrMonitor_.prototype.pushContext = function(context) {
  if(!this.enabled_) {
    return
  }
  var key = goog.net.XhrMonitor_.getKey(context);
  this.logger_.finest("Pushing context: " + context + " (" + key + ")");
  this.stack_.push(key)
};
goog.net.XhrMonitor_.prototype.popContext = function() {
  if(!this.enabled_) {
    return
  }
  var context = this.stack_.pop();
  this.logger_.finest("Popping context: " + context);
  this.updateDependentContexts_(context)
};
goog.net.XhrMonitor_.prototype.isContextSafe = function(context) {
  if(!this.enabled_) {
    return true
  }
  var deps = this.contextsToXhr_[goog.net.XhrMonitor_.getKey(context)];
  this.logger_.fine("Context is safe : " + context + " - " + deps);
  return!deps
};
goog.net.XhrMonitor_.prototype.markXhrOpen = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Opening XHR : " + uid);
  for(var i = 0;i < this.stack_.length;i++) {
    var context = this.stack_[i];
    this.addToMap_(this.contextsToXhr_, context, uid);
    this.addToMap_(this.xhrToContexts_, uid, context)
  }
};
goog.net.XhrMonitor_.prototype.markXhrClosed = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Closing XHR : " + uid);
  delete this.xhrToContexts_[uid];
  for(var context in this.contextsToXhr_) {
    goog.array.remove(this.contextsToXhr_[context], uid);
    if(this.contextsToXhr_[context].length == 0) {
      delete this.contextsToXhr_[context]
    }
  }
};
goog.net.XhrMonitor_.prototype.updateDependentContexts_ = function(xhrUid) {
  var contexts = this.xhrToContexts_[xhrUid];
  var xhrs = this.contextsToXhr_[xhrUid];
  if(contexts && xhrs) {
    this.logger_.finest("Updating dependent contexts");
    goog.array.forEach(contexts, function(context) {
      goog.array.forEach(xhrs, function(xhr) {
        this.addToMap_(this.contextsToXhr_, context, xhr);
        this.addToMap_(this.xhrToContexts_, xhr, context)
      }, this)
    }, this)
  }
};
goog.net.XhrMonitor_.prototype.addToMap_ = function(map, key, value) {
  if(!map[key]) {
    map[key] = []
  }
  if(!goog.array.contains(map[key], value)) {
    map[key].push(value)
  }
};
goog.net.xhrMonitor = new goog.net.XhrMonitor_;
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.net.xhrMonitor");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?:?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  goog.net.xhrMonitor.markXhrOpen(this.xhr_);
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.dispatchEvent = function(e) {
  if(this.xhr_) {
    goog.net.xhrMonitor.pushContext(this.xhr_);
    try {
      return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
    }finally {
      goog.net.xhrMonitor.popContext()
    }
  }else {
    return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
  }
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        if(this.isSuccess()) {
          this.dispatchEvent(goog.net.EventType.COMPLETE);
          this.dispatchEvent(goog.net.EventType.SUCCESS)
        }else {
          this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
          this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
          this.dispatchErrors_()
        }
        this.cleanUpXhr_()
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      goog.net.xhrMonitor.pushContext(xhr);
      this.dispatchEvent(goog.net.EventType.READY);
      goog.net.xhrMonitor.popContext()
    }
    goog.net.xhrMonitor.markXhrClosed(xhr);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  switch(this.getStatus()) {
    case 0:
      return!this.isLastUriEffectiveSchemeHttp_();
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return true;
    default:
      return false
  }
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var lastUriScheme = goog.isString(this.lastUri_) ? goog.uri.utils.getScheme(this.lastUri_) : this.lastUri_.getScheme();
  if(lastUriScheme) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(lastUriScheme)
  }
  if(self.location) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(self.location.protocol)
  }else {
    return true
  }
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    if(!this.xhr_) {
      return null
    }
    if("response" in this.xhr_) {
      return this.xhr_.response
    }
    switch(this.responseType_) {
      case goog.net.XhrIo.ResponseType.DEFAULT:
      ;
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer
        }
    }
    this.logger_.severe("Response type " + this.responseType_ + " is not " + "supported on this browser");
    return null
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("fetch.core");
goog.require("cljs.core");
goog.require("goog.structs");
goog.require("goog.Uri.QueryData");
goog.require("goog.events");
goog.require("cljs.reader");
goog.require("fetch.util");
goog.require("clojure.string");
goog.require("goog.net.XhrIo");
fetch.core.__GT_method = function __GT_method(m) {
  return clojure.string.upper_case.call(null, cljs.core.name.call(null, m))
};
fetch.core.parse_route = function parse_route(route) {
  if(cljs.core.string_QMARK_.call(null, route)) {
    return cljs.core.PersistentVector.fromArray(["GET", route], true)
  }else {
    if(cljs.core.vector_QMARK_.call(null, route)) {
      var vec__33546__33547 = route;
      var m__33548 = cljs.core.nth.call(null, vec__33546__33547, 0, null);
      var u__33549 = cljs.core.nth.call(null, vec__33546__33547, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__33548), u__33549], true)
    }else {
      if("\ufdd0'else") {
        return cljs.core.PersistentVector.fromArray(["GET", route], true)
      }else {
        return null
      }
    }
  }
};
fetch.core.__GT_data = function __GT_data(d) {
  var cur__33552 = fetch.util.clj__GT_js.call(null, d);
  var query__33553 = goog.Uri.QueryData.createFromMap(new goog.structs.Map(cur__33552));
  return[cljs.core.str(query__33553)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__33555 = req.getResponseText();
      return callback.call(null, data__33555)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__33556) {
    var vec__33567__33568 = p__33556;
    var opts__33569 = cljs.core.nth.call(null, vec__33567__33568, 0, null);
    var req__33571 = new goog.net.XhrIo;
    var vec__33570__33572 = fetch.core.parse_route.call(null, route);
    var method__33573 = cljs.core.nth.call(null, vec__33570__33572, 0, null);
    var uri__33574 = cljs.core.nth.call(null, vec__33570__33572, 1, null);
    var data__33575 = fetch.core.__GT_data.call(null, content);
    var callback__33576 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__33576)) {
      goog.events.listen(req__33571, goog.net.EventType.COMPLETE, function() {
        return callback__33576.call(null, req__33571)
      })
    }else {
    }
    return req__33571.send(uri__33574, method__33573, data__33575, cljs.core.truth_(opts__33569) ? fetch.util.clj__GT_js.call(null, opts__33569) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__33556 = null;
    if(goog.isDef(var_args)) {
      p__33556 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__33556)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__33577) {
    var route = cljs.core.first(arglist__33577);
    var content = cljs.core.first(cljs.core.next(arglist__33577));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__33577)));
    var p__33556 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__33577)));
    return xhr__delegate(route, content, callback, p__33556)
  };
  xhr.cljs$lang$arity$variadic = xhr__delegate;
  return xhr
}();
goog.provide("fetch.remotes");
goog.require("cljs.core");
goog.require("cljs.reader");
goog.require("fetch.core");
fetch.remotes.remote_uri = "/_fetch";
fetch.remotes.remote_callback = function remote_callback(remote, params, callback) {
  return fetch.core.xhr.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'post", fetch.remotes.remote_uri], true), cljs.core.ObjMap.fromObject(["\ufdd0'remote", "\ufdd0'params"], {"\ufdd0'remote":remote, "\ufdd0'params":cljs.core.pr_str.call(null, params)}), cljs.core.truth_(callback) ? function(data) {
    var data__33541 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__33541))
  } : null)
};
goog.provide("webrot.client.main");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("jayq.core");
goog.require("crate.util");
goog.require("jayq.core");
goog.require("fetch.remotes");
webrot.client.main.$img = jayq.core.$.call(null, "\ufdd0'#fractal>a>img");
webrot.client.main.$fractal = jayq.core.$.call(null, "\ufdd0'#fractal>a");
webrot.client.main.$spinner = jayq.core.$.call(null, "\ufdd0'#spinner");
webrot.client.main.$refresh = jayq.core.$.call(null, "\ufdd0'#refresh");
webrot.client.main.$initial = jayq.core.$.call(null, "\ufdd0'#initial");
webrot.client.main.$zoom_in = jayq.core.$.call(null, "\ufdd0'#zoom-in");
webrot.client.main.$zoom_out = jayq.core.$.call(null, "\ufdd0'#zoom-out");
webrot.client.main.$drag_target = jayq.core.$.call(null, "\ufdd0'#drag-target");
webrot.client.main.$drop_zone = jayq.core.$.call(null, "\ufdd0'#drop-zone");
webrot.client.main.hit_event = "\ufdd0'click";
webrot.client.main.params = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
webrot.client.main.busy = cljs.core.atom.call(null, true);
webrot.client.main.coords_from_event = function coords_from_event(event) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":event.offsetX, "\ufdd0'y":event.offsetY})
};
webrot.client.main.coords_from_ui = function coords_from_ui(ui) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":ui.offset.left, "\ufdd0'y":ui.offset.top})
};
webrot.client.main.form_params = function form_params() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'lut", "\ufdd0'cut-off"], {"\ufdd0'lut":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #lut :selected")), "\ufdd0'cut-off":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #cut-off :selected"))})
};
webrot.client.main.redraw = function redraw(args) {
  if(cljs.core.truth_(cljs.core.compare_and_set_BANG_.call(null, webrot.client.main.busy, false, true))) {
    var me__29281 = this;
    jayq.core.show.call(null, webrot.client.main.$spinner);
    cljs.core.swap_BANG_.call(null, webrot.client.main.params, cljs.core.ObjMap.EMPTY, args);
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.identity, true);
    jayq.core.attr.call(null, webrot.client.main.$img, "\ufdd0'src", crate.util.url.call(null, "render", args));
    return false
  }else {
    return null
  }
};
jayq.core.document_ready.call(null, function() {
  webrot.client.main.$drag_target.draggable();
  webrot.client.main.$drop_zone.droppable();
  jayq.core.bind.call(null, webrot.client.main.$drop_zone, "\ufdd0'drop", function(event, ui) {
    var merged_params__29282 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_ui.call(null, ui));
    return fetch.remotes.remote_callback.call(null, "real-coords", cljs.core.PersistentVector.fromArray([merged_params__29282], true), function(result) {
      jayq.core.anim.call(null, webrot.client.main.$drag_target, cljs.core.ObjMap.fromObject(["\ufdd0'left", "\ufdd0'top"], {"\ufdd0'left":0, "\ufdd0'top":0}), 500);
      return webrot.client.main.redraw.call(null, cljs.core.merge.call(null, webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'start-posn", "\ufdd0'bounds", "\ufdd0'type"], {"\ufdd0'start-posn":[cljs.core.str((new cljs.core.Keyword("\ufdd0'x")).call(null, result)), cljs.core.str(","), cljs.core.str((new cljs.core.Keyword("\ufdd0'y")).call(null, result))].join(""), "\ufdd0'bounds":"1,1.5,-1,-1.5", "\ufdd0'type":"julia"})))
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$img, "\ufdd0'load", function() {
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.not);
    return jayq.core.hide.call(null, webrot.client.main.$spinner)
  });
  jayq.core.bind.call(null, webrot.client.main.$fractal, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    var merged_params__29283 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, event));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__29283], true), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_in, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    var merged_params__29284 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":400, "\ufdd0'y":300}));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__29284], true), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_out, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    var merged_params__29285 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null));
    return fetch.remotes.remote_callback.call(null, "zoom-out", cljs.core.PersistentVector.fromArray([merged_params__29285], true), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$refresh, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    return webrot.client.main.redraw.call(null, cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null)))
  });
  return jayq.core.bind.call(null, webrot.client.main.$initial, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    return webrot.client.main.redraw.call(null, webrot.client.main.form_params.call(null))
  })
});
