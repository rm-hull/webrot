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
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
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
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
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
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__30054__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__30054 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30054__delegate.call(this, array, i, idxs)
    };
    G__30054.cljs$lang$maxFixedArity = 2;
    G__30054.cljs$lang$applyTo = function(arglist__30055) {
      var array = cljs.core.first(arglist__30055);
      var i = cljs.core.first(cljs.core.next(arglist__30055));
      var idxs = cljs.core.rest(cljs.core.next(arglist__30055));
      return G__30054__delegate(array, i, idxs)
    };
    G__30054.cljs$lang$arity$variadic = G__30054__delegate;
    return G__30054
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
void 0;
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
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____30056 = this$;
      if(and__3822__auto____30056) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____30056
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____30057 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30057) {
          return or__3824__auto____30057
        }else {
          var or__3824__auto____30058 = cljs.core._invoke["_"];
          if(or__3824__auto____30058) {
            return or__3824__auto____30058
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____30059 = this$;
      if(and__3822__auto____30059) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____30059
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____30060 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30060) {
          return or__3824__auto____30060
        }else {
          var or__3824__auto____30061 = cljs.core._invoke["_"];
          if(or__3824__auto____30061) {
            return or__3824__auto____30061
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____30062 = this$;
      if(and__3822__auto____30062) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____30062
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____30063 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30063) {
          return or__3824__auto____30063
        }else {
          var or__3824__auto____30064 = cljs.core._invoke["_"];
          if(or__3824__auto____30064) {
            return or__3824__auto____30064
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____30065 = this$;
      if(and__3822__auto____30065) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____30065
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____30066 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30066) {
          return or__3824__auto____30066
        }else {
          var or__3824__auto____30067 = cljs.core._invoke["_"];
          if(or__3824__auto____30067) {
            return or__3824__auto____30067
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____30068 = this$;
      if(and__3822__auto____30068) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____30068
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____30069 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30069) {
          return or__3824__auto____30069
        }else {
          var or__3824__auto____30070 = cljs.core._invoke["_"];
          if(or__3824__auto____30070) {
            return or__3824__auto____30070
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____30071 = this$;
      if(and__3822__auto____30071) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____30071
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____30072 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30072) {
          return or__3824__auto____30072
        }else {
          var or__3824__auto____30073 = cljs.core._invoke["_"];
          if(or__3824__auto____30073) {
            return or__3824__auto____30073
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____30074 = this$;
      if(and__3822__auto____30074) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____30074
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____30075 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30075) {
          return or__3824__auto____30075
        }else {
          var or__3824__auto____30076 = cljs.core._invoke["_"];
          if(or__3824__auto____30076) {
            return or__3824__auto____30076
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____30077 = this$;
      if(and__3822__auto____30077) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____30077
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____30078 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30078) {
          return or__3824__auto____30078
        }else {
          var or__3824__auto____30079 = cljs.core._invoke["_"];
          if(or__3824__auto____30079) {
            return or__3824__auto____30079
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____30080 = this$;
      if(and__3822__auto____30080) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____30080
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____30081 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30081) {
          return or__3824__auto____30081
        }else {
          var or__3824__auto____30082 = cljs.core._invoke["_"];
          if(or__3824__auto____30082) {
            return or__3824__auto____30082
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____30083 = this$;
      if(and__3822__auto____30083) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____30083
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____30084 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30084) {
          return or__3824__auto____30084
        }else {
          var or__3824__auto____30085 = cljs.core._invoke["_"];
          if(or__3824__auto____30085) {
            return or__3824__auto____30085
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____30086 = this$;
      if(and__3822__auto____30086) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____30086
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____30087 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30087) {
          return or__3824__auto____30087
        }else {
          var or__3824__auto____30088 = cljs.core._invoke["_"];
          if(or__3824__auto____30088) {
            return or__3824__auto____30088
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____30089 = this$;
      if(and__3822__auto____30089) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____30089
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____30090 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30090) {
          return or__3824__auto____30090
        }else {
          var or__3824__auto____30091 = cljs.core._invoke["_"];
          if(or__3824__auto____30091) {
            return or__3824__auto____30091
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____30092 = this$;
      if(and__3822__auto____30092) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____30092
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____30093 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30093) {
          return or__3824__auto____30093
        }else {
          var or__3824__auto____30094 = cljs.core._invoke["_"];
          if(or__3824__auto____30094) {
            return or__3824__auto____30094
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____30095 = this$;
      if(and__3822__auto____30095) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____30095
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____30096 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30096) {
          return or__3824__auto____30096
        }else {
          var or__3824__auto____30097 = cljs.core._invoke["_"];
          if(or__3824__auto____30097) {
            return or__3824__auto____30097
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____30098 = this$;
      if(and__3822__auto____30098) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____30098
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____30099 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30099) {
          return or__3824__auto____30099
        }else {
          var or__3824__auto____30100 = cljs.core._invoke["_"];
          if(or__3824__auto____30100) {
            return or__3824__auto____30100
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____30101 = this$;
      if(and__3822__auto____30101) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____30101
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____30102 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30102) {
          return or__3824__auto____30102
        }else {
          var or__3824__auto____30103 = cljs.core._invoke["_"];
          if(or__3824__auto____30103) {
            return or__3824__auto____30103
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____30104 = this$;
      if(and__3822__auto____30104) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____30104
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____30105 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30105) {
          return or__3824__auto____30105
        }else {
          var or__3824__auto____30106 = cljs.core._invoke["_"];
          if(or__3824__auto____30106) {
            return or__3824__auto____30106
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____30107 = this$;
      if(and__3822__auto____30107) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____30107
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____30108 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30108) {
          return or__3824__auto____30108
        }else {
          var or__3824__auto____30109 = cljs.core._invoke["_"];
          if(or__3824__auto____30109) {
            return or__3824__auto____30109
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____30110 = this$;
      if(and__3822__auto____30110) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____30110
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____30111 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30111) {
          return or__3824__auto____30111
        }else {
          var or__3824__auto____30112 = cljs.core._invoke["_"];
          if(or__3824__auto____30112) {
            return or__3824__auto____30112
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____30113 = this$;
      if(and__3822__auto____30113) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____30113
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____30114 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30114) {
          return or__3824__auto____30114
        }else {
          var or__3824__auto____30115 = cljs.core._invoke["_"];
          if(or__3824__auto____30115) {
            return or__3824__auto____30115
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____30116 = this$;
      if(and__3822__auto____30116) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____30116
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____30117 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____30117) {
          return or__3824__auto____30117
        }else {
          var or__3824__auto____30118 = cljs.core._invoke["_"];
          if(or__3824__auto____30118) {
            return or__3824__auto____30118
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
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____30119 = coll;
    if(and__3822__auto____30119) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____30119
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30120 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30120) {
        return or__3824__auto____30120
      }else {
        var or__3824__auto____30121 = cljs.core._count["_"];
        if(or__3824__auto____30121) {
          return or__3824__auto____30121
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____30122 = coll;
    if(and__3822__auto____30122) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____30122
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30123 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30123) {
        return or__3824__auto____30123
      }else {
        var or__3824__auto____30124 = cljs.core._empty["_"];
        if(or__3824__auto____30124) {
          return or__3824__auto____30124
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____30125 = coll;
    if(and__3822__auto____30125) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____30125
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____30126 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30126) {
        return or__3824__auto____30126
      }else {
        var or__3824__auto____30127 = cljs.core._conj["_"];
        if(or__3824__auto____30127) {
          return or__3824__auto____30127
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____30128 = coll;
      if(and__3822__auto____30128) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____30128
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____30129 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____30129) {
          return or__3824__auto____30129
        }else {
          var or__3824__auto____30130 = cljs.core._nth["_"];
          if(or__3824__auto____30130) {
            return or__3824__auto____30130
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____30131 = coll;
      if(and__3822__auto____30131) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____30131
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____30132 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____30132) {
          return or__3824__auto____30132
        }else {
          var or__3824__auto____30133 = cljs.core._nth["_"];
          if(or__3824__auto____30133) {
            return or__3824__auto____30133
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
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____30134 = coll;
    if(and__3822__auto____30134) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____30134
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30135 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30135) {
        return or__3824__auto____30135
      }else {
        var or__3824__auto____30136 = cljs.core._first["_"];
        if(or__3824__auto____30136) {
          return or__3824__auto____30136
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____30137 = coll;
    if(and__3822__auto____30137) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____30137
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30138 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30138) {
        return or__3824__auto____30138
      }else {
        var or__3824__auto____30139 = cljs.core._rest["_"];
        if(or__3824__auto____30139) {
          return or__3824__auto____30139
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____30140 = o;
      if(and__3822__auto____30140) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____30140
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____30141 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____30141) {
          return or__3824__auto____30141
        }else {
          var or__3824__auto____30142 = cljs.core._lookup["_"];
          if(or__3824__auto____30142) {
            return or__3824__auto____30142
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____30143 = o;
      if(and__3822__auto____30143) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____30143
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____30144 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____30144) {
          return or__3824__auto____30144
        }else {
          var or__3824__auto____30145 = cljs.core._lookup["_"];
          if(or__3824__auto____30145) {
            return or__3824__auto____30145
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
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____30146 = coll;
    if(and__3822__auto____30146) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____30146
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____30147 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30147) {
        return or__3824__auto____30147
      }else {
        var or__3824__auto____30148 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____30148) {
          return or__3824__auto____30148
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____30149 = coll;
    if(and__3822__auto____30149) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____30149
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____30150 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30150) {
        return or__3824__auto____30150
      }else {
        var or__3824__auto____30151 = cljs.core._assoc["_"];
        if(or__3824__auto____30151) {
          return or__3824__auto____30151
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____30152 = coll;
    if(and__3822__auto____30152) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____30152
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____30153 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30153) {
        return or__3824__auto____30153
      }else {
        var or__3824__auto____30154 = cljs.core._dissoc["_"];
        if(or__3824__auto____30154) {
          return or__3824__auto____30154
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____30155 = coll;
    if(and__3822__auto____30155) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____30155
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30156 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30156) {
        return or__3824__auto____30156
      }else {
        var or__3824__auto____30157 = cljs.core._key["_"];
        if(or__3824__auto____30157) {
          return or__3824__auto____30157
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____30158 = coll;
    if(and__3822__auto____30158) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____30158
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30159 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30159) {
        return or__3824__auto____30159
      }else {
        var or__3824__auto____30160 = cljs.core._val["_"];
        if(or__3824__auto____30160) {
          return or__3824__auto____30160
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____30161 = coll;
    if(and__3822__auto____30161) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____30161
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____30162 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30162) {
        return or__3824__auto____30162
      }else {
        var or__3824__auto____30163 = cljs.core._disjoin["_"];
        if(or__3824__auto____30163) {
          return or__3824__auto____30163
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____30164 = coll;
    if(and__3822__auto____30164) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____30164
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30165 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30165) {
        return or__3824__auto____30165
      }else {
        var or__3824__auto____30166 = cljs.core._peek["_"];
        if(or__3824__auto____30166) {
          return or__3824__auto____30166
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____30167 = coll;
    if(and__3822__auto____30167) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____30167
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30168 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30168) {
        return or__3824__auto____30168
      }else {
        var or__3824__auto____30169 = cljs.core._pop["_"];
        if(or__3824__auto____30169) {
          return or__3824__auto____30169
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____30170 = coll;
    if(and__3822__auto____30170) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____30170
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____30171 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30171) {
        return or__3824__auto____30171
      }else {
        var or__3824__auto____30172 = cljs.core._assoc_n["_"];
        if(or__3824__auto____30172) {
          return or__3824__auto____30172
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____30173 = o;
    if(and__3822__auto____30173) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____30173
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____30174 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____30174) {
        return or__3824__auto____30174
      }else {
        var or__3824__auto____30175 = cljs.core._deref["_"];
        if(or__3824__auto____30175) {
          return or__3824__auto____30175
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____30176 = o;
    if(and__3822__auto____30176) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____30176
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____30177 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____30177) {
        return or__3824__auto____30177
      }else {
        var or__3824__auto____30178 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____30178) {
          return or__3824__auto____30178
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____30179 = o;
    if(and__3822__auto____30179) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____30179
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____30180 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____30180) {
        return or__3824__auto____30180
      }else {
        var or__3824__auto____30181 = cljs.core._meta["_"];
        if(or__3824__auto____30181) {
          return or__3824__auto____30181
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____30182 = o;
    if(and__3822__auto____30182) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____30182
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____30183 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____30183) {
        return or__3824__auto____30183
      }else {
        var or__3824__auto____30184 = cljs.core._with_meta["_"];
        if(or__3824__auto____30184) {
          return or__3824__auto____30184
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____30185 = coll;
      if(and__3822__auto____30185) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____30185
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____30186 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____30186) {
          return or__3824__auto____30186
        }else {
          var or__3824__auto____30187 = cljs.core._reduce["_"];
          if(or__3824__auto____30187) {
            return or__3824__auto____30187
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____30188 = coll;
      if(and__3822__auto____30188) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____30188
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____30189 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____30189) {
          return or__3824__auto____30189
        }else {
          var or__3824__auto____30190 = cljs.core._reduce["_"];
          if(or__3824__auto____30190) {
            return or__3824__auto____30190
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
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____30191 = coll;
    if(and__3822__auto____30191) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____30191
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____30192 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30192) {
        return or__3824__auto____30192
      }else {
        var or__3824__auto____30193 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____30193) {
          return or__3824__auto____30193
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____30194 = o;
    if(and__3822__auto____30194) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____30194
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____30195 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____30195) {
        return or__3824__auto____30195
      }else {
        var or__3824__auto____30196 = cljs.core._equiv["_"];
        if(or__3824__auto____30196) {
          return or__3824__auto____30196
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____30197 = o;
    if(and__3822__auto____30197) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____30197
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____30198 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____30198) {
        return or__3824__auto____30198
      }else {
        var or__3824__auto____30199 = cljs.core._hash["_"];
        if(or__3824__auto____30199) {
          return or__3824__auto____30199
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____30200 = o;
    if(and__3822__auto____30200) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____30200
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____30201 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____30201) {
        return or__3824__auto____30201
      }else {
        var or__3824__auto____30202 = cljs.core._seq["_"];
        if(or__3824__auto____30202) {
          return or__3824__auto____30202
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____30203 = coll;
    if(and__3822__auto____30203) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____30203
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30204 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30204) {
        return or__3824__auto____30204
      }else {
        var or__3824__auto____30205 = cljs.core._rseq["_"];
        if(or__3824__auto____30205) {
          return or__3824__auto____30205
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____30206 = coll;
    if(and__3822__auto____30206) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____30206
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____30207 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30207) {
        return or__3824__auto____30207
      }else {
        var or__3824__auto____30208 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____30208) {
          return or__3824__auto____30208
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____30209 = coll;
    if(and__3822__auto____30209) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____30209
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____30210 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30210) {
        return or__3824__auto____30210
      }else {
        var or__3824__auto____30211 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____30211) {
          return or__3824__auto____30211
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____30212 = coll;
    if(and__3822__auto____30212) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____30212
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____30213 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30213) {
        return or__3824__auto____30213
      }else {
        var or__3824__auto____30214 = cljs.core._entry_key["_"];
        if(or__3824__auto____30214) {
          return or__3824__auto____30214
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____30215 = coll;
    if(and__3822__auto____30215) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____30215
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30216 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30216) {
        return or__3824__auto____30216
      }else {
        var or__3824__auto____30217 = cljs.core._comparator["_"];
        if(or__3824__auto____30217) {
          return or__3824__auto____30217
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____30218 = o;
    if(and__3822__auto____30218) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____30218
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____30219 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____30219) {
        return or__3824__auto____30219
      }else {
        var or__3824__auto____30220 = cljs.core._pr_seq["_"];
        if(or__3824__auto____30220) {
          return or__3824__auto____30220
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____30221 = d;
    if(and__3822__auto____30221) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____30221
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____30222 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____30222) {
        return or__3824__auto____30222
      }else {
        var or__3824__auto____30223 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____30223) {
          return or__3824__auto____30223
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____30224 = this$;
    if(and__3822__auto____30224) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____30224
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____30225 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____30225) {
        return or__3824__auto____30225
      }else {
        var or__3824__auto____30226 = cljs.core._notify_watches["_"];
        if(or__3824__auto____30226) {
          return or__3824__auto____30226
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____30227 = this$;
    if(and__3822__auto____30227) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____30227
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____30228 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____30228) {
        return or__3824__auto____30228
      }else {
        var or__3824__auto____30229 = cljs.core._add_watch["_"];
        if(or__3824__auto____30229) {
          return or__3824__auto____30229
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____30230 = this$;
    if(and__3822__auto____30230) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____30230
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____30231 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____30231) {
        return or__3824__auto____30231
      }else {
        var or__3824__auto____30232 = cljs.core._remove_watch["_"];
        if(or__3824__auto____30232) {
          return or__3824__auto____30232
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____30233 = coll;
    if(and__3822__auto____30233) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____30233
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____30234 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____30234) {
        return or__3824__auto____30234
      }else {
        var or__3824__auto____30235 = cljs.core._as_transient["_"];
        if(or__3824__auto____30235) {
          return or__3824__auto____30235
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____30236 = tcoll;
    if(and__3822__auto____30236) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____30236
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____30237 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30237) {
        return or__3824__auto____30237
      }else {
        var or__3824__auto____30238 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____30238) {
          return or__3824__auto____30238
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____30239 = tcoll;
    if(and__3822__auto____30239) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____30239
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____30240 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30240) {
        return or__3824__auto____30240
      }else {
        var or__3824__auto____30241 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____30241) {
          return or__3824__auto____30241
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____30242 = tcoll;
    if(and__3822__auto____30242) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____30242
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____30243 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30243) {
        return or__3824__auto____30243
      }else {
        var or__3824__auto____30244 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____30244) {
          return or__3824__auto____30244
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____30245 = tcoll;
    if(and__3822__auto____30245) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____30245
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____30246 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30246) {
        return or__3824__auto____30246
      }else {
        var or__3824__auto____30247 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____30247) {
          return or__3824__auto____30247
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____30248 = tcoll;
    if(and__3822__auto____30248) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____30248
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____30249 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30249) {
        return or__3824__auto____30249
      }else {
        var or__3824__auto____30250 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____30250) {
          return or__3824__auto____30250
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____30251 = tcoll;
    if(and__3822__auto____30251) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____30251
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____30252 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30252) {
        return or__3824__auto____30252
      }else {
        var or__3824__auto____30253 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____30253) {
          return or__3824__auto____30253
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____30254 = tcoll;
    if(and__3822__auto____30254) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____30254
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____30255 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____30255) {
        return or__3824__auto____30255
      }else {
        var or__3824__auto____30256 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____30256) {
          return or__3824__auto____30256
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____30257 = x === y;
    if(or__3824__auto____30257) {
      return or__3824__auto____30257
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__30258__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30259 = y;
            var G__30260 = cljs.core.first.call(null, more);
            var G__30261 = cljs.core.next.call(null, more);
            x = G__30259;
            y = G__30260;
            more = G__30261;
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
    var G__30258 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30258__delegate.call(this, x, y, more)
    };
    G__30258.cljs$lang$maxFixedArity = 2;
    G__30258.cljs$lang$applyTo = function(arglist__30262) {
      var x = cljs.core.first(arglist__30262);
      var y = cljs.core.first(cljs.core.next(arglist__30262));
      var more = cljs.core.rest(cljs.core.next(arglist__30262));
      return G__30258__delegate(x, y, more)
    };
    G__30258.cljs$lang$arity$variadic = G__30258__delegate;
    return G__30258
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
  if(function() {
    var or__3824__auto____30263 = x == null;
    if(or__3824__auto____30263) {
      return or__3824__auto____30263
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__30264 = null;
  var G__30264__2 = function(o, k) {
    return null
  };
  var G__30264__3 = function(o, k, not_found) {
    return not_found
  };
  G__30264 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30264__2.call(this, o, k);
      case 3:
        return G__30264__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30264
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__30265 = null;
  var G__30265__2 = function(_, f) {
    return f.call(null)
  };
  var G__30265__3 = function(_, f, start) {
    return start
  };
  G__30265 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__30265__2.call(this, _, f);
      case 3:
        return G__30265__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30265
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
  var G__30266 = null;
  var G__30266__2 = function(_, n) {
    return null
  };
  var G__30266__3 = function(_, n, not_found) {
    return not_found
  };
  G__30266 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30266__2.call(this, _, n);
      case 3:
        return G__30266__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30266
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
  return o.toString() === other.toString()
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
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__30267 = cljs.core._nth.call(null, cicoll, 0);
      var n__30268 = 1;
      while(true) {
        if(n__30268 < cljs.core._count.call(null, cicoll)) {
          var nval__30269 = f.call(null, val__30267, cljs.core._nth.call(null, cicoll, n__30268));
          if(cljs.core.reduced_QMARK_.call(null, nval__30269)) {
            return cljs.core.deref.call(null, nval__30269)
          }else {
            var G__30276 = nval__30269;
            var G__30277 = n__30268 + 1;
            val__30267 = G__30276;
            n__30268 = G__30277;
            continue
          }
        }else {
          return val__30267
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__30270 = val;
    var n__30271 = 0;
    while(true) {
      if(n__30271 < cljs.core._count.call(null, cicoll)) {
        var nval__30272 = f.call(null, val__30270, cljs.core._nth.call(null, cicoll, n__30271));
        if(cljs.core.reduced_QMARK_.call(null, nval__30272)) {
          return cljs.core.deref.call(null, nval__30272)
        }else {
          var G__30278 = nval__30272;
          var G__30279 = n__30271 + 1;
          val__30270 = G__30278;
          n__30271 = G__30279;
          continue
        }
      }else {
        return val__30270
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__30273 = val;
    var n__30274 = idx;
    while(true) {
      if(n__30274 < cljs.core._count.call(null, cicoll)) {
        var nval__30275 = f.call(null, val__30273, cljs.core._nth.call(null, cicoll, n__30274));
        if(cljs.core.reduced_QMARK_.call(null, nval__30275)) {
          return cljs.core.deref.call(null, nval__30275)
        }else {
          var G__30280 = nval__30275;
          var G__30281 = n__30274 + 1;
          val__30273 = G__30280;
          n__30274 = G__30281;
          continue
        }
      }else {
        return val__30273
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
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30282 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30283 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__30284 = this;
  var this$__30285 = this;
  return cljs.core.pr_str.call(null, this$__30285)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__30286 = this;
  if(cljs.core.counted_QMARK_.call(null, this__30286.a)) {
    return cljs.core.ci_reduce.call(null, this__30286.a, f, this__30286.a[this__30286.i], this__30286.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__30286.a[this__30286.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__30287 = this;
  if(cljs.core.counted_QMARK_.call(null, this__30287.a)) {
    return cljs.core.ci_reduce.call(null, this__30287.a, f, start, this__30287.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__30288 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__30289 = this;
  return this__30289.a.length - this__30289.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__30290 = this;
  return this__30290.a[this__30290.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__30291 = this;
  if(this__30291.i + 1 < this__30291.a.length) {
    return new cljs.core.IndexedSeq(this__30291.a, this__30291.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30292 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__30293 = this;
  var i__30294 = n + this__30293.i;
  if(i__30294 < this__30293.a.length) {
    return this__30293.a[i__30294]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__30295 = this;
  var i__30296 = n + this__30295.i;
  if(i__30296 < this__30295.a.length) {
    return this__30295.a[i__30296]
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
  var G__30297 = null;
  var G__30297__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__30297__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__30297 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__30297__2.call(this, array, f);
      case 3:
        return G__30297__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30297
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__30298 = null;
  var G__30298__2 = function(array, k) {
    return array[k]
  };
  var G__30298__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__30298 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30298__2.call(this, array, k);
      case 3:
        return G__30298__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30298
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__30299 = null;
  var G__30299__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__30299__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__30299 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30299__2.call(this, array, n);
      case 3:
        return G__30299__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30299
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__30300__30301 = coll;
      if(G__30300__30301 != null) {
        if(function() {
          var or__3824__auto____30302 = G__30300__30301.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____30302) {
            return or__3824__auto____30302
          }else {
            return G__30300__30301.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__30300__30301.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30300__30301)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30300__30301)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__30303__30304 = coll;
      if(G__30303__30304 != null) {
        if(function() {
          var or__3824__auto____30305 = G__30303__30304.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30305) {
            return or__3824__auto____30305
          }else {
            return G__30303__30304.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30303__30304.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30303__30304)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30303__30304)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__30306 = cljs.core.seq.call(null, coll);
      if(s__30306 != null) {
        return cljs.core._first.call(null, s__30306)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__30307__30308 = coll;
      if(G__30307__30308 != null) {
        if(function() {
          var or__3824__auto____30309 = G__30307__30308.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30309) {
            return or__3824__auto____30309
          }else {
            return G__30307__30308.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30307__30308.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30307__30308)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30307__30308)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__30310 = cljs.core.seq.call(null, coll);
      if(s__30310 != null) {
        return cljs.core._rest.call(null, s__30310)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__30311__30312 = coll;
      if(G__30311__30312 != null) {
        if(function() {
          var or__3824__auto____30313 = G__30311__30312.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30313) {
            return or__3824__auto____30313
          }else {
            return G__30311__30312.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30311__30312.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30311__30312)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30311__30312)
      }
    }()) {
      var coll__30314 = cljs.core._rest.call(null, coll);
      if(coll__30314 != null) {
        if(function() {
          var G__30315__30316 = coll__30314;
          if(G__30315__30316 != null) {
            if(function() {
              var or__3824__auto____30317 = G__30315__30316.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____30317) {
                return or__3824__auto____30317
              }else {
                return G__30315__30316.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__30315__30316.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30315__30316)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__30315__30316)
          }
        }()) {
          return coll__30314
        }else {
          return cljs.core._seq.call(null, coll__30314)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
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
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__30318 = cljs.core.next.call(null, s);
      s = G__30318;
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
    var G__30319__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__30320 = conj.call(null, coll, x);
          var G__30321 = cljs.core.first.call(null, xs);
          var G__30322 = cljs.core.next.call(null, xs);
          coll = G__30320;
          x = G__30321;
          xs = G__30322;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__30319 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30319__delegate.call(this, coll, x, xs)
    };
    G__30319.cljs$lang$maxFixedArity = 2;
    G__30319.cljs$lang$applyTo = function(arglist__30323) {
      var coll = cljs.core.first(arglist__30323);
      var x = cljs.core.first(cljs.core.next(arglist__30323));
      var xs = cljs.core.rest(cljs.core.next(arglist__30323));
      return G__30319__delegate(coll, x, xs)
    };
    G__30319.cljs$lang$arity$variadic = G__30319__delegate;
    return G__30319
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
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__30324 = cljs.core.seq.call(null, coll);
  var acc__30325 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__30324)) {
      return acc__30325 + cljs.core._count.call(null, s__30324)
    }else {
      var G__30326 = cljs.core.next.call(null, s__30324);
      var G__30327 = acc__30325 + 1;
      s__30324 = G__30326;
      acc__30325 = G__30327;
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
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
    if(coll != null) {
      if(function() {
        var G__30328__30329 = coll;
        if(G__30328__30329 != null) {
          if(function() {
            var or__3824__auto____30330 = G__30328__30329.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____30330) {
              return or__3824__auto____30330
            }else {
              return G__30328__30329.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__30328__30329.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30328__30329)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30328__30329)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__30331__30332 = coll;
        if(G__30331__30332 != null) {
          if(function() {
            var or__3824__auto____30333 = G__30331__30332.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____30333) {
              return or__3824__auto____30333
            }else {
              return G__30331__30332.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__30331__30332.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30331__30332)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30331__30332)
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
    var G__30335__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__30334 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__30336 = ret__30334;
          var G__30337 = cljs.core.first.call(null, kvs);
          var G__30338 = cljs.core.second.call(null, kvs);
          var G__30339 = cljs.core.nnext.call(null, kvs);
          coll = G__30336;
          k = G__30337;
          v = G__30338;
          kvs = G__30339;
          continue
        }else {
          return ret__30334
        }
        break
      }
    };
    var G__30335 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30335__delegate.call(this, coll, k, v, kvs)
    };
    G__30335.cljs$lang$maxFixedArity = 3;
    G__30335.cljs$lang$applyTo = function(arglist__30340) {
      var coll = cljs.core.first(arglist__30340);
      var k = cljs.core.first(cljs.core.next(arglist__30340));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30340)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30340)));
      return G__30335__delegate(coll, k, v, kvs)
    };
    G__30335.cljs$lang$arity$variadic = G__30335__delegate;
    return G__30335
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
    var G__30342__delegate = function(coll, k, ks) {
      while(true) {
        var ret__30341 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__30343 = ret__30341;
          var G__30344 = cljs.core.first.call(null, ks);
          var G__30345 = cljs.core.next.call(null, ks);
          coll = G__30343;
          k = G__30344;
          ks = G__30345;
          continue
        }else {
          return ret__30341
        }
        break
      }
    };
    var G__30342 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30342__delegate.call(this, coll, k, ks)
    };
    G__30342.cljs$lang$maxFixedArity = 2;
    G__30342.cljs$lang$applyTo = function(arglist__30346) {
      var coll = cljs.core.first(arglist__30346);
      var k = cljs.core.first(cljs.core.next(arglist__30346));
      var ks = cljs.core.rest(cljs.core.next(arglist__30346));
      return G__30342__delegate(coll, k, ks)
    };
    G__30342.cljs$lang$arity$variadic = G__30342__delegate;
    return G__30342
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
    var G__30347__30348 = o;
    if(G__30347__30348 != null) {
      if(function() {
        var or__3824__auto____30349 = G__30347__30348.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____30349) {
          return or__3824__auto____30349
        }else {
          return G__30347__30348.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__30347__30348.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__30347__30348)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__30347__30348)
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
    var G__30351__delegate = function(coll, k, ks) {
      while(true) {
        var ret__30350 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__30352 = ret__30350;
          var G__30353 = cljs.core.first.call(null, ks);
          var G__30354 = cljs.core.next.call(null, ks);
          coll = G__30352;
          k = G__30353;
          ks = G__30354;
          continue
        }else {
          return ret__30350
        }
        break
      }
    };
    var G__30351 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30351__delegate.call(this, coll, k, ks)
    };
    G__30351.cljs$lang$maxFixedArity = 2;
    G__30351.cljs$lang$applyTo = function(arglist__30355) {
      var coll = cljs.core.first(arglist__30355);
      var k = cljs.core.first(cljs.core.next(arglist__30355));
      var ks = cljs.core.rest(cljs.core.next(arglist__30355));
      return G__30351__delegate(coll, k, ks)
    };
    G__30351.cljs$lang$arity$variadic = G__30351__delegate;
    return G__30351
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
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30356__30357 = x;
    if(G__30356__30357 != null) {
      if(function() {
        var or__3824__auto____30358 = G__30356__30357.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____30358) {
          return or__3824__auto____30358
        }else {
          return G__30356__30357.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__30356__30357.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__30356__30357)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__30356__30357)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30359__30360 = x;
    if(G__30359__30360 != null) {
      if(function() {
        var or__3824__auto____30361 = G__30359__30360.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____30361) {
          return or__3824__auto____30361
        }else {
          return G__30359__30360.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__30359__30360.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__30359__30360)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__30359__30360)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__30362__30363 = x;
  if(G__30362__30363 != null) {
    if(function() {
      var or__3824__auto____30364 = G__30362__30363.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____30364) {
        return or__3824__auto____30364
      }else {
        return G__30362__30363.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__30362__30363.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__30362__30363)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__30362__30363)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__30365__30366 = x;
  if(G__30365__30366 != null) {
    if(function() {
      var or__3824__auto____30367 = G__30365__30366.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____30367) {
        return or__3824__auto____30367
      }else {
        return G__30365__30366.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__30365__30366.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__30365__30366)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__30365__30366)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__30368__30369 = x;
  if(G__30368__30369 != null) {
    if(function() {
      var or__3824__auto____30370 = G__30368__30369.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____30370) {
        return or__3824__auto____30370
      }else {
        return G__30368__30369.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__30368__30369.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__30368__30369)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__30368__30369)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__30371__30372 = x;
  if(G__30371__30372 != null) {
    if(function() {
      var or__3824__auto____30373 = G__30371__30372.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____30373) {
        return or__3824__auto____30373
      }else {
        return G__30371__30372.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__30371__30372.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30371__30372)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__30371__30372)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__30374__30375 = x;
  if(G__30374__30375 != null) {
    if(function() {
      var or__3824__auto____30376 = G__30374__30375.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____30376) {
        return or__3824__auto____30376
      }else {
        return G__30374__30375.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__30374__30375.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30374__30375)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30374__30375)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__30377__30378 = x;
    if(G__30377__30378 != null) {
      if(function() {
        var or__3824__auto____30379 = G__30377__30378.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____30379) {
          return or__3824__auto____30379
        }else {
          return G__30377__30378.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__30377__30378.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__30377__30378)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__30377__30378)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__30380__30381 = x;
  if(G__30380__30381 != null) {
    if(function() {
      var or__3824__auto____30382 = G__30380__30381.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____30382) {
        return or__3824__auto____30382
      }else {
        return G__30380__30381.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__30380__30381.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__30380__30381)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__30380__30381)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__30383__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__30383 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__30383__delegate.call(this, keyvals)
    };
    G__30383.cljs$lang$maxFixedArity = 0;
    G__30383.cljs$lang$applyTo = function(arglist__30384) {
      var keyvals = cljs.core.seq(arglist__30384);
      return G__30383__delegate(keyvals)
    };
    G__30383.cljs$lang$arity$variadic = G__30383__delegate;
    return G__30383
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
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
  var keys__30385 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__30385.push(key)
  });
  return keys__30385
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__30386 = i;
  var j__30387 = j;
  var len__30388 = len;
  while(true) {
    if(len__30388 === 0) {
      return to
    }else {
      to[j__30387] = from[i__30386];
      var G__30389 = i__30386 + 1;
      var G__30390 = j__30387 + 1;
      var G__30391 = len__30388 - 1;
      i__30386 = G__30389;
      j__30387 = G__30390;
      len__30388 = G__30391;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__30392 = i + (len - 1);
  var j__30393 = j + (len - 1);
  var len__30394 = len;
  while(true) {
    if(len__30394 === 0) {
      return to
    }else {
      to[j__30393] = from[i__30392];
      var G__30395 = i__30392 - 1;
      var G__30396 = j__30393 - 1;
      var G__30397 = len__30394 - 1;
      i__30392 = G__30395;
      j__30393 = G__30396;
      len__30394 = G__30397;
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
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__30398__30399 = s;
    if(G__30398__30399 != null) {
      if(function() {
        var or__3824__auto____30400 = G__30398__30399.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____30400) {
          return or__3824__auto____30400
        }else {
          return G__30398__30399.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__30398__30399.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30398__30399)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30398__30399)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__30401__30402 = s;
  if(G__30401__30402 != null) {
    if(function() {
      var or__3824__auto____30403 = G__30401__30402.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____30403) {
        return or__3824__auto____30403
      }else {
        return G__30401__30402.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__30401__30402.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__30401__30402)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__30401__30402)
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
  var and__3822__auto____30404 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____30404)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____30405 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____30405) {
        return or__3824__auto____30405
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____30404
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____30406 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____30406)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____30406
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____30407 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____30407)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____30407
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____30408 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____30408) {
    return or__3824__auto____30408
  }else {
    var G__30409__30410 = f;
    if(G__30409__30410 != null) {
      if(function() {
        var or__3824__auto____30411 = G__30409__30410.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____30411) {
          return or__3824__auto____30411
        }else {
          return G__30409__30410.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__30409__30410.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__30409__30410)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__30409__30410)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____30412 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____30412) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____30412
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
    var and__3822__auto____30413 = coll;
    if(cljs.core.truth_(and__3822__auto____30413)) {
      var and__3822__auto____30414 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____30414) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____30414
      }
    }else {
      return and__3822__auto____30413
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
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
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__30419__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__30415 = cljs.core.set([y, x]);
        var xs__30416 = more;
        while(true) {
          var x__30417 = cljs.core.first.call(null, xs__30416);
          var etc__30418 = cljs.core.next.call(null, xs__30416);
          if(cljs.core.truth_(xs__30416)) {
            if(cljs.core.contains_QMARK_.call(null, s__30415, x__30417)) {
              return false
            }else {
              var G__30420 = cljs.core.conj.call(null, s__30415, x__30417);
              var G__30421 = etc__30418;
              s__30415 = G__30420;
              xs__30416 = G__30421;
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
    var G__30419 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30419__delegate.call(this, x, y, more)
    };
    G__30419.cljs$lang$maxFixedArity = 2;
    G__30419.cljs$lang$applyTo = function(arglist__30422) {
      var x = cljs.core.first(arglist__30422);
      var y = cljs.core.first(cljs.core.next(arglist__30422));
      var more = cljs.core.rest(cljs.core.next(arglist__30422));
      return G__30419__delegate(x, y, more)
    };
    G__30419.cljs$lang$arity$variadic = G__30419__delegate;
    return G__30419
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
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__30423 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__30423)) {
        return r__30423
      }else {
        if(cljs.core.truth_(r__30423)) {
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
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__30424 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__30424, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__30424)
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
    var temp__3971__auto____30425 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____30425)) {
      var s__30426 = temp__3971__auto____30425;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__30426), cljs.core.next.call(null, s__30426))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__30427 = val;
    var coll__30428 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__30428)) {
        var nval__30429 = f.call(null, val__30427, cljs.core.first.call(null, coll__30428));
        if(cljs.core.reduced_QMARK_.call(null, nval__30429)) {
          return cljs.core.deref.call(null, nval__30429)
        }else {
          var G__30430 = nval__30429;
          var G__30431 = cljs.core.next.call(null, coll__30428);
          val__30427 = G__30430;
          coll__30428 = G__30431;
          continue
        }
      }else {
        return val__30427
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
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__30432__30433 = coll;
      if(G__30432__30433 != null) {
        if(function() {
          var or__3824__auto____30434 = G__30432__30433.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____30434) {
            return or__3824__auto____30434
          }else {
            return G__30432__30433.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__30432__30433.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30432__30433)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30432__30433)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__30435__30436 = coll;
      if(G__30435__30436 != null) {
        if(function() {
          var or__3824__auto____30437 = G__30435__30436.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____30437) {
            return or__3824__auto____30437
          }else {
            return G__30435__30436.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__30435__30436.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30435__30436)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__30435__30436)
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
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__30438 = this;
  return this__30438.val
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
    var G__30439__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__30439 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30439__delegate.call(this, x, y, more)
    };
    G__30439.cljs$lang$maxFixedArity = 2;
    G__30439.cljs$lang$applyTo = function(arglist__30440) {
      var x = cljs.core.first(arglist__30440);
      var y = cljs.core.first(cljs.core.next(arglist__30440));
      var more = cljs.core.rest(cljs.core.next(arglist__30440));
      return G__30439__delegate(x, y, more)
    };
    G__30439.cljs$lang$arity$variadic = G__30439__delegate;
    return G__30439
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
    var G__30441__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__30441 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30441__delegate.call(this, x, y, more)
    };
    G__30441.cljs$lang$maxFixedArity = 2;
    G__30441.cljs$lang$applyTo = function(arglist__30442) {
      var x = cljs.core.first(arglist__30442);
      var y = cljs.core.first(cljs.core.next(arglist__30442));
      var more = cljs.core.rest(cljs.core.next(arglist__30442));
      return G__30441__delegate(x, y, more)
    };
    G__30441.cljs$lang$arity$variadic = G__30441__delegate;
    return G__30441
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
    var G__30443__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__30443 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30443__delegate.call(this, x, y, more)
    };
    G__30443.cljs$lang$maxFixedArity = 2;
    G__30443.cljs$lang$applyTo = function(arglist__30444) {
      var x = cljs.core.first(arglist__30444);
      var y = cljs.core.first(cljs.core.next(arglist__30444));
      var more = cljs.core.rest(cljs.core.next(arglist__30444));
      return G__30443__delegate(x, y, more)
    };
    G__30443.cljs$lang$arity$variadic = G__30443__delegate;
    return G__30443
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
    var G__30445__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__30445 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30445__delegate.call(this, x, y, more)
    };
    G__30445.cljs$lang$maxFixedArity = 2;
    G__30445.cljs$lang$applyTo = function(arglist__30446) {
      var x = cljs.core.first(arglist__30446);
      var y = cljs.core.first(cljs.core.next(arglist__30446));
      var more = cljs.core.rest(cljs.core.next(arglist__30446));
      return G__30445__delegate(x, y, more)
    };
    G__30445.cljs$lang$arity$variadic = G__30445__delegate;
    return G__30445
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
    var G__30447__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30448 = y;
            var G__30449 = cljs.core.first.call(null, more);
            var G__30450 = cljs.core.next.call(null, more);
            x = G__30448;
            y = G__30449;
            more = G__30450;
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
    var G__30447 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30447__delegate.call(this, x, y, more)
    };
    G__30447.cljs$lang$maxFixedArity = 2;
    G__30447.cljs$lang$applyTo = function(arglist__30451) {
      var x = cljs.core.first(arglist__30451);
      var y = cljs.core.first(cljs.core.next(arglist__30451));
      var more = cljs.core.rest(cljs.core.next(arglist__30451));
      return G__30447__delegate(x, y, more)
    };
    G__30447.cljs$lang$arity$variadic = G__30447__delegate;
    return G__30447
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
    var G__30452__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30453 = y;
            var G__30454 = cljs.core.first.call(null, more);
            var G__30455 = cljs.core.next.call(null, more);
            x = G__30453;
            y = G__30454;
            more = G__30455;
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
    var G__30452 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30452__delegate.call(this, x, y, more)
    };
    G__30452.cljs$lang$maxFixedArity = 2;
    G__30452.cljs$lang$applyTo = function(arglist__30456) {
      var x = cljs.core.first(arglist__30456);
      var y = cljs.core.first(cljs.core.next(arglist__30456));
      var more = cljs.core.rest(cljs.core.next(arglist__30456));
      return G__30452__delegate(x, y, more)
    };
    G__30452.cljs$lang$arity$variadic = G__30452__delegate;
    return G__30452
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
    var G__30457__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30458 = y;
            var G__30459 = cljs.core.first.call(null, more);
            var G__30460 = cljs.core.next.call(null, more);
            x = G__30458;
            y = G__30459;
            more = G__30460;
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
    var G__30457 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30457__delegate.call(this, x, y, more)
    };
    G__30457.cljs$lang$maxFixedArity = 2;
    G__30457.cljs$lang$applyTo = function(arglist__30461) {
      var x = cljs.core.first(arglist__30461);
      var y = cljs.core.first(cljs.core.next(arglist__30461));
      var more = cljs.core.rest(cljs.core.next(arglist__30461));
      return G__30457__delegate(x, y, more)
    };
    G__30457.cljs$lang$arity$variadic = G__30457__delegate;
    return G__30457
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
    var G__30462__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30463 = y;
            var G__30464 = cljs.core.first.call(null, more);
            var G__30465 = cljs.core.next.call(null, more);
            x = G__30463;
            y = G__30464;
            more = G__30465;
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
    var G__30462 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30462__delegate.call(this, x, y, more)
    };
    G__30462.cljs$lang$maxFixedArity = 2;
    G__30462.cljs$lang$applyTo = function(arglist__30466) {
      var x = cljs.core.first(arglist__30466);
      var y = cljs.core.first(cljs.core.next(arglist__30466));
      var more = cljs.core.rest(cljs.core.next(arglist__30466));
      return G__30462__delegate(x, y, more)
    };
    G__30462.cljs$lang$arity$variadic = G__30462__delegate;
    return G__30462
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
    var G__30467__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__30467 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30467__delegate.call(this, x, y, more)
    };
    G__30467.cljs$lang$maxFixedArity = 2;
    G__30467.cljs$lang$applyTo = function(arglist__30468) {
      var x = cljs.core.first(arglist__30468);
      var y = cljs.core.first(cljs.core.next(arglist__30468));
      var more = cljs.core.rest(cljs.core.next(arglist__30468));
      return G__30467__delegate(x, y, more)
    };
    G__30467.cljs$lang$arity$variadic = G__30467__delegate;
    return G__30467
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
    var G__30469__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__30469 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30469__delegate.call(this, x, y, more)
    };
    G__30469.cljs$lang$maxFixedArity = 2;
    G__30469.cljs$lang$applyTo = function(arglist__30470) {
      var x = cljs.core.first(arglist__30470);
      var y = cljs.core.first(cljs.core.next(arglist__30470));
      var more = cljs.core.rest(cljs.core.next(arglist__30470));
      return G__30469__delegate(x, y, more)
    };
    G__30469.cljs$lang$arity$variadic = G__30469__delegate;
    return G__30469
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
  var rem__30471 = n % d;
  return cljs.core.fix.call(null, (n - rem__30471) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__30472 = cljs.core.quot.call(null, n, d);
  return n - d * q__30472
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
cljs.core.bit_count = function bit_count(n) {
  var c__30473 = 0;
  var n__30474 = n;
  while(true) {
    if(n__30474 === 0) {
      return c__30473
    }else {
      var G__30475 = c__30473 + 1;
      var G__30476 = n__30474 & n__30474 - 1;
      c__30473 = G__30475;
      n__30474 = G__30476;
      continue
    }
    break
  }
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
    var G__30477__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__30478 = y;
            var G__30479 = cljs.core.first.call(null, more);
            var G__30480 = cljs.core.next.call(null, more);
            x = G__30478;
            y = G__30479;
            more = G__30480;
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
    var G__30477 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30477__delegate.call(this, x, y, more)
    };
    G__30477.cljs$lang$maxFixedArity = 2;
    G__30477.cljs$lang$applyTo = function(arglist__30481) {
      var x = cljs.core.first(arglist__30481);
      var y = cljs.core.first(cljs.core.next(arglist__30481));
      var more = cljs.core.rest(cljs.core.next(arglist__30481));
      return G__30477__delegate(x, y, more)
    };
    G__30477.cljs$lang$arity$variadic = G__30477__delegate;
    return G__30477
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
  var n__30482 = n;
  var xs__30483 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____30484 = xs__30483;
      if(cljs.core.truth_(and__3822__auto____30484)) {
        return n__30482 > 0
      }else {
        return and__3822__auto____30484
      }
    }())) {
      var G__30485 = n__30482 - 1;
      var G__30486 = cljs.core.next.call(null, xs__30483);
      n__30482 = G__30485;
      xs__30483 = G__30486;
      continue
    }else {
      return xs__30483
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
    var G__30487__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__30488 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__30489 = cljs.core.next.call(null, more);
            sb = G__30488;
            more = G__30489;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__30487 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__30487__delegate.call(this, x, ys)
    };
    G__30487.cljs$lang$maxFixedArity = 1;
    G__30487.cljs$lang$applyTo = function(arglist__30490) {
      var x = cljs.core.first(arglist__30490);
      var ys = cljs.core.rest(arglist__30490);
      return G__30487__delegate(x, ys)
    };
    G__30487.cljs$lang$arity$variadic = G__30487__delegate;
    return G__30487
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
    var G__30491__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__30492 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__30493 = cljs.core.next.call(null, more);
            sb = G__30492;
            more = G__30493;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__30491 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__30491__delegate.call(this, x, ys)
    };
    G__30491.cljs$lang$maxFixedArity = 1;
    G__30491.cljs$lang$applyTo = function(arglist__30494) {
      var x = cljs.core.first(arglist__30494);
      var ys = cljs.core.rest(arglist__30494);
      return G__30491__delegate(x, ys)
    };
    G__30491.cljs$lang$arity$variadic = G__30491__delegate;
    return G__30491
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
    var xs__30495 = cljs.core.seq.call(null, x);
    var ys__30496 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__30495 == null) {
        return ys__30496 == null
      }else {
        if(ys__30496 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__30495), cljs.core.first.call(null, ys__30496))) {
            var G__30497 = cljs.core.next.call(null, xs__30495);
            var G__30498 = cljs.core.next.call(null, ys__30496);
            xs__30495 = G__30497;
            ys__30496 = G__30498;
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
  return cljs.core.reduce.call(null, function(p1__30499_SHARP_, p2__30500_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__30499_SHARP_, cljs.core.hash.call(null, p2__30500_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__30501 = 0;
  var s__30502 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__30502)) {
      var e__30503 = cljs.core.first.call(null, s__30502);
      var G__30504 = (h__30501 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__30503)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__30503)))) % 4503599627370496;
      var G__30505 = cljs.core.next.call(null, s__30502);
      h__30501 = G__30504;
      s__30502 = G__30505;
      continue
    }else {
      return h__30501
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__30506 = 0;
  var s__30507 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__30507)) {
      var e__30508 = cljs.core.first.call(null, s__30507);
      var G__30509 = (h__30506 + cljs.core.hash.call(null, e__30508)) % 4503599627370496;
      var G__30510 = cljs.core.next.call(null, s__30507);
      h__30506 = G__30509;
      s__30507 = G__30510;
      continue
    }else {
      return h__30506
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__30511__30512 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__30511__30512)) {
    var G__30514__30516 = cljs.core.first.call(null, G__30511__30512);
    var vec__30515__30517 = G__30514__30516;
    var key_name__30518 = cljs.core.nth.call(null, vec__30515__30517, 0, null);
    var f__30519 = cljs.core.nth.call(null, vec__30515__30517, 1, null);
    var G__30511__30520 = G__30511__30512;
    var G__30514__30521 = G__30514__30516;
    var G__30511__30522 = G__30511__30520;
    while(true) {
      var vec__30523__30524 = G__30514__30521;
      var key_name__30525 = cljs.core.nth.call(null, vec__30523__30524, 0, null);
      var f__30526 = cljs.core.nth.call(null, vec__30523__30524, 1, null);
      var G__30511__30527 = G__30511__30522;
      var str_name__30528 = cljs.core.name.call(null, key_name__30525);
      obj[str_name__30528] = f__30526;
      var temp__3974__auto____30529 = cljs.core.next.call(null, G__30511__30527);
      if(cljs.core.truth_(temp__3974__auto____30529)) {
        var G__30511__30530 = temp__3974__auto____30529;
        var G__30531 = cljs.core.first.call(null, G__30511__30530);
        var G__30532 = G__30511__30530;
        G__30514__30521 = G__30531;
        G__30511__30522 = G__30532;
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
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30533 = this;
  var h__364__auto____30534 = this__30533.__hash;
  if(h__364__auto____30534 != null) {
    return h__364__auto____30534
  }else {
    var h__364__auto____30535 = cljs.core.hash_coll.call(null, coll);
    this__30533.__hash = h__364__auto____30535;
    return h__364__auto____30535
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30536 = this;
  return new cljs.core.List(this__30536.meta, o, coll, this__30536.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__30537 = this;
  var this$__30538 = this;
  return cljs.core.pr_str.call(null, this$__30538)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30539 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30540 = this;
  return this__30540.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__30541 = this;
  return this__30541.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__30542 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30543 = this;
  return this__30543.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30544 = this;
  return this__30544.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30545 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30546 = this;
  return new cljs.core.List(meta, this__30546.first, this__30546.rest, this__30546.count, this__30546.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30547 = this;
  return this__30547.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30548 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30549 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30550 = this;
  return new cljs.core.List(this__30550.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__30551 = this;
  var this$__30552 = this;
  return cljs.core.pr_str.call(null, this$__30552)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30553 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30554 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__30555 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__30556 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30557 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30558 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30559 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30560 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30561 = this;
  return this__30561.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30562 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__30563__30564 = coll;
  if(G__30563__30564 != null) {
    if(function() {
      var or__3824__auto____30565 = G__30563__30564.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____30565) {
        return or__3824__auto____30565
      }else {
        return G__30563__30564.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__30563__30564.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__30563__30564)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__30563__30564)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__30566) {
    var items = cljs.core.seq(arglist__30566);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30567 = this;
  var h__364__auto____30568 = this__30567.__hash;
  if(h__364__auto____30568 != null) {
    return h__364__auto____30568
  }else {
    var h__364__auto____30569 = cljs.core.hash_coll.call(null, coll);
    this__30567.__hash = h__364__auto____30569;
    return h__364__auto____30569
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30570 = this;
  return new cljs.core.Cons(null, o, coll, this__30570.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__30571 = this;
  var this$__30572 = this;
  return cljs.core.pr_str.call(null, this$__30572)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30573 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30574 = this;
  return this__30574.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30575 = this;
  if(this__30575.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__30575.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30576 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30577 = this;
  return new cljs.core.Cons(meta, this__30577.first, this__30577.rest, this__30577.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30578 = this;
  return this__30578.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30579 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__30579.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____30580 = coll == null;
    if(or__3824__auto____30580) {
      return or__3824__auto____30580
    }else {
      var G__30581__30582 = coll;
      if(G__30581__30582 != null) {
        if(function() {
          var or__3824__auto____30583 = G__30581__30582.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____30583) {
            return or__3824__auto____30583
          }else {
            return G__30581__30582.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__30581__30582.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30581__30582)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__30581__30582)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__30584__30585 = x;
  if(G__30584__30585 != null) {
    if(function() {
      var or__3824__auto____30586 = G__30584__30585.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____30586) {
        return or__3824__auto____30586
      }else {
        return G__30584__30585.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__30584__30585.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__30584__30585)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__30584__30585)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__30587 = null;
  var G__30587__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__30587__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__30587 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__30587__2.call(this, string, f);
      case 3:
        return G__30587__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30587
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__30588 = null;
  var G__30588__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__30588__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__30588 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30588__2.call(this, string, k);
      case 3:
        return G__30588__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30588
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__30589 = null;
  var G__30589__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__30589__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__30589 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30589__2.call(this, string, n);
      case 3:
        return G__30589__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30589
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
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__30598 = null;
  var G__30598__2 = function(tsym30592, coll) {
    var tsym30592__30594 = this;
    var this$__30595 = tsym30592__30594;
    return cljs.core.get.call(null, coll, this$__30595.toString())
  };
  var G__30598__3 = function(tsym30593, coll, not_found) {
    var tsym30593__30596 = this;
    var this$__30597 = tsym30593__30596;
    return cljs.core.get.call(null, coll, this$__30597.toString(), not_found)
  };
  G__30598 = function(tsym30593, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__30598__2.call(this, tsym30593, coll);
      case 3:
        return G__30598__3.call(this, tsym30593, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__30598
}();
String.prototype.apply = function(tsym30590, args30591) {
  return tsym30590.call.apply(tsym30590, [tsym30590].concat(cljs.core.aclone.call(null, args30591)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__30599 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__30599
  }else {
    lazy_seq.x = x__30599.call(null);
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30600 = this;
  var h__364__auto____30601 = this__30600.__hash;
  if(h__364__auto____30601 != null) {
    return h__364__auto____30601
  }else {
    var h__364__auto____30602 = cljs.core.hash_coll.call(null, coll);
    this__30600.__hash = h__364__auto____30602;
    return h__364__auto____30602
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30603 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__30604 = this;
  var this$__30605 = this;
  return cljs.core.pr_str.call(null, this$__30605)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30606 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__30607 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__30608 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30609 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30610 = this;
  return new cljs.core.LazySeq(meta, this__30610.realized, this__30610.x, this__30610.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30611 = this;
  return this__30611.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__30612 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__30612.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__30613 = [];
  var s__30614 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__30614))) {
      ary__30613.push(cljs.core.first.call(null, s__30614));
      var G__30615 = cljs.core.next.call(null, s__30614);
      s__30614 = G__30615;
      continue
    }else {
      return ary__30613
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__30616 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__30617 = 0;
  var xs__30618 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__30618)) {
      ret__30616[i__30617] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__30618));
      var G__30619 = i__30617 + 1;
      var G__30620 = cljs.core.next.call(null, xs__30618);
      i__30617 = G__30619;
      xs__30618 = G__30620;
      continue
    }else {
    }
    break
  }
  return ret__30616
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
    var a__30621 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30622 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30623 = 0;
      var s__30624 = s__30622;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30625 = s__30624;
          if(cljs.core.truth_(and__3822__auto____30625)) {
            return i__30623 < size
          }else {
            return and__3822__auto____30625
          }
        }())) {
          a__30621[i__30623] = cljs.core.first.call(null, s__30624);
          var G__30628 = i__30623 + 1;
          var G__30629 = cljs.core.next.call(null, s__30624);
          i__30623 = G__30628;
          s__30624 = G__30629;
          continue
        }else {
          return a__30621
        }
        break
      }
    }else {
      var n__685__auto____30626 = size;
      var i__30627 = 0;
      while(true) {
        if(i__30627 < n__685__auto____30626) {
          a__30621[i__30627] = init_val_or_seq;
          var G__30630 = i__30627 + 1;
          i__30627 = G__30630;
          continue
        }else {
        }
        break
      }
      return a__30621
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
    var a__30631 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30632 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30633 = 0;
      var s__30634 = s__30632;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30635 = s__30634;
          if(cljs.core.truth_(and__3822__auto____30635)) {
            return i__30633 < size
          }else {
            return and__3822__auto____30635
          }
        }())) {
          a__30631[i__30633] = cljs.core.first.call(null, s__30634);
          var G__30638 = i__30633 + 1;
          var G__30639 = cljs.core.next.call(null, s__30634);
          i__30633 = G__30638;
          s__30634 = G__30639;
          continue
        }else {
          return a__30631
        }
        break
      }
    }else {
      var n__685__auto____30636 = size;
      var i__30637 = 0;
      while(true) {
        if(i__30637 < n__685__auto____30636) {
          a__30631[i__30637] = init_val_or_seq;
          var G__30640 = i__30637 + 1;
          i__30637 = G__30640;
          continue
        }else {
        }
        break
      }
      return a__30631
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
    var a__30641 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__30642 = cljs.core.seq.call(null, init_val_or_seq);
      var i__30643 = 0;
      var s__30644 = s__30642;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____30645 = s__30644;
          if(cljs.core.truth_(and__3822__auto____30645)) {
            return i__30643 < size
          }else {
            return and__3822__auto____30645
          }
        }())) {
          a__30641[i__30643] = cljs.core.first.call(null, s__30644);
          var G__30648 = i__30643 + 1;
          var G__30649 = cljs.core.next.call(null, s__30644);
          i__30643 = G__30648;
          s__30644 = G__30649;
          continue
        }else {
          return a__30641
        }
        break
      }
    }else {
      var n__685__auto____30646 = size;
      var i__30647 = 0;
      while(true) {
        if(i__30647 < n__685__auto____30646) {
          a__30641[i__30647] = init_val_or_seq;
          var G__30650 = i__30647 + 1;
          i__30647 = G__30650;
          continue
        }else {
        }
        break
      }
      return a__30641
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
    var s__30651 = s;
    var i__30652 = n;
    var sum__30653 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____30654 = i__30652 > 0;
        if(and__3822__auto____30654) {
          return cljs.core.seq.call(null, s__30651)
        }else {
          return and__3822__auto____30654
        }
      }())) {
        var G__30655 = cljs.core.next.call(null, s__30651);
        var G__30656 = i__30652 - 1;
        var G__30657 = sum__30653 + 1;
        s__30651 = G__30655;
        i__30652 = G__30656;
        sum__30653 = G__30657;
        continue
      }else {
        return sum__30653
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
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__30658 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__30658)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__30658), concat.call(null, cljs.core.rest.call(null, s__30658), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__30661__delegate = function(x, y, zs) {
      var cat__30660 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__30659 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__30659)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__30659), cat.call(null, cljs.core.rest.call(null, xys__30659), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__30660.call(null, concat.call(null, x, y), zs)
    };
    var G__30661 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30661__delegate.call(this, x, y, zs)
    };
    G__30661.cljs$lang$maxFixedArity = 2;
    G__30661.cljs$lang$applyTo = function(arglist__30662) {
      var x = cljs.core.first(arglist__30662);
      var y = cljs.core.first(cljs.core.next(arglist__30662));
      var zs = cljs.core.rest(cljs.core.next(arglist__30662));
      return G__30661__delegate(x, y, zs)
    };
    G__30661.cljs$lang$arity$variadic = G__30661__delegate;
    return G__30661
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
    var G__30663__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__30663 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30663__delegate.call(this, a, b, c, d, more)
    };
    G__30663.cljs$lang$maxFixedArity = 4;
    G__30663.cljs$lang$applyTo = function(arglist__30664) {
      var a = cljs.core.first(arglist__30664);
      var b = cljs.core.first(cljs.core.next(arglist__30664));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30664)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30664))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30664))));
      return G__30663__delegate(a, b, c, d, more)
    };
    G__30663.cljs$lang$arity$variadic = G__30663__delegate;
    return G__30663
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
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__30665 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__30666 = cljs.core._first.call(null, args__30665);
    var args__30667 = cljs.core._rest.call(null, args__30665);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__30666)
      }else {
        return f.call(null, a__30666)
      }
    }else {
      var b__30668 = cljs.core._first.call(null, args__30667);
      var args__30669 = cljs.core._rest.call(null, args__30667);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__30666, b__30668)
        }else {
          return f.call(null, a__30666, b__30668)
        }
      }else {
        var c__30670 = cljs.core._first.call(null, args__30669);
        var args__30671 = cljs.core._rest.call(null, args__30669);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__30666, b__30668, c__30670)
          }else {
            return f.call(null, a__30666, b__30668, c__30670)
          }
        }else {
          var d__30672 = cljs.core._first.call(null, args__30671);
          var args__30673 = cljs.core._rest.call(null, args__30671);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__30666, b__30668, c__30670, d__30672)
            }else {
              return f.call(null, a__30666, b__30668, c__30670, d__30672)
            }
          }else {
            var e__30674 = cljs.core._first.call(null, args__30673);
            var args__30675 = cljs.core._rest.call(null, args__30673);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__30666, b__30668, c__30670, d__30672, e__30674)
              }else {
                return f.call(null, a__30666, b__30668, c__30670, d__30672, e__30674)
              }
            }else {
              var f__30676 = cljs.core._first.call(null, args__30675);
              var args__30677 = cljs.core._rest.call(null, args__30675);
              if(argc === 6) {
                if(f__30676.cljs$lang$arity$6) {
                  return f__30676.cljs$lang$arity$6(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676)
                }else {
                  return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676)
                }
              }else {
                var g__30678 = cljs.core._first.call(null, args__30677);
                var args__30679 = cljs.core._rest.call(null, args__30677);
                if(argc === 7) {
                  if(f__30676.cljs$lang$arity$7) {
                    return f__30676.cljs$lang$arity$7(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678)
                  }else {
                    return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678)
                  }
                }else {
                  var h__30680 = cljs.core._first.call(null, args__30679);
                  var args__30681 = cljs.core._rest.call(null, args__30679);
                  if(argc === 8) {
                    if(f__30676.cljs$lang$arity$8) {
                      return f__30676.cljs$lang$arity$8(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680)
                    }else {
                      return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680)
                    }
                  }else {
                    var i__30682 = cljs.core._first.call(null, args__30681);
                    var args__30683 = cljs.core._rest.call(null, args__30681);
                    if(argc === 9) {
                      if(f__30676.cljs$lang$arity$9) {
                        return f__30676.cljs$lang$arity$9(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682)
                      }else {
                        return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682)
                      }
                    }else {
                      var j__30684 = cljs.core._first.call(null, args__30683);
                      var args__30685 = cljs.core._rest.call(null, args__30683);
                      if(argc === 10) {
                        if(f__30676.cljs$lang$arity$10) {
                          return f__30676.cljs$lang$arity$10(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684)
                        }else {
                          return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684)
                        }
                      }else {
                        var k__30686 = cljs.core._first.call(null, args__30685);
                        var args__30687 = cljs.core._rest.call(null, args__30685);
                        if(argc === 11) {
                          if(f__30676.cljs$lang$arity$11) {
                            return f__30676.cljs$lang$arity$11(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686)
                          }else {
                            return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686)
                          }
                        }else {
                          var l__30688 = cljs.core._first.call(null, args__30687);
                          var args__30689 = cljs.core._rest.call(null, args__30687);
                          if(argc === 12) {
                            if(f__30676.cljs$lang$arity$12) {
                              return f__30676.cljs$lang$arity$12(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688)
                            }else {
                              return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688)
                            }
                          }else {
                            var m__30690 = cljs.core._first.call(null, args__30689);
                            var args__30691 = cljs.core._rest.call(null, args__30689);
                            if(argc === 13) {
                              if(f__30676.cljs$lang$arity$13) {
                                return f__30676.cljs$lang$arity$13(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690)
                              }else {
                                return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690)
                              }
                            }else {
                              var n__30692 = cljs.core._first.call(null, args__30691);
                              var args__30693 = cljs.core._rest.call(null, args__30691);
                              if(argc === 14) {
                                if(f__30676.cljs$lang$arity$14) {
                                  return f__30676.cljs$lang$arity$14(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692)
                                }else {
                                  return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692)
                                }
                              }else {
                                var o__30694 = cljs.core._first.call(null, args__30693);
                                var args__30695 = cljs.core._rest.call(null, args__30693);
                                if(argc === 15) {
                                  if(f__30676.cljs$lang$arity$15) {
                                    return f__30676.cljs$lang$arity$15(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694)
                                  }else {
                                    return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694)
                                  }
                                }else {
                                  var p__30696 = cljs.core._first.call(null, args__30695);
                                  var args__30697 = cljs.core._rest.call(null, args__30695);
                                  if(argc === 16) {
                                    if(f__30676.cljs$lang$arity$16) {
                                      return f__30676.cljs$lang$arity$16(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696)
                                    }else {
                                      return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696)
                                    }
                                  }else {
                                    var q__30698 = cljs.core._first.call(null, args__30697);
                                    var args__30699 = cljs.core._rest.call(null, args__30697);
                                    if(argc === 17) {
                                      if(f__30676.cljs$lang$arity$17) {
                                        return f__30676.cljs$lang$arity$17(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698)
                                      }else {
                                        return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698)
                                      }
                                    }else {
                                      var r__30700 = cljs.core._first.call(null, args__30699);
                                      var args__30701 = cljs.core._rest.call(null, args__30699);
                                      if(argc === 18) {
                                        if(f__30676.cljs$lang$arity$18) {
                                          return f__30676.cljs$lang$arity$18(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700)
                                        }else {
                                          return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700)
                                        }
                                      }else {
                                        var s__30702 = cljs.core._first.call(null, args__30701);
                                        var args__30703 = cljs.core._rest.call(null, args__30701);
                                        if(argc === 19) {
                                          if(f__30676.cljs$lang$arity$19) {
                                            return f__30676.cljs$lang$arity$19(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700, s__30702)
                                          }else {
                                            return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700, s__30702)
                                          }
                                        }else {
                                          var t__30704 = cljs.core._first.call(null, args__30703);
                                          var args__30705 = cljs.core._rest.call(null, args__30703);
                                          if(argc === 20) {
                                            if(f__30676.cljs$lang$arity$20) {
                                              return f__30676.cljs$lang$arity$20(a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700, s__30702, t__30704)
                                            }else {
                                              return f__30676.call(null, a__30666, b__30668, c__30670, d__30672, e__30674, f__30676, g__30678, h__30680, i__30682, j__30684, k__30686, l__30688, m__30690, n__30692, o__30694, p__30696, q__30698, r__30700, s__30702, t__30704)
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
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__30706 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30707 = cljs.core.bounded_count.call(null, args, fixed_arity__30706 + 1);
      if(bc__30707 <= fixed_arity__30706) {
        return cljs.core.apply_to.call(null, f, bc__30707, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__30708 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__30709 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30710 = cljs.core.bounded_count.call(null, arglist__30708, fixed_arity__30709 + 1);
      if(bc__30710 <= fixed_arity__30709) {
        return cljs.core.apply_to.call(null, f, bc__30710, arglist__30708)
      }else {
        return f.cljs$lang$applyTo(arglist__30708)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30708))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__30711 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__30712 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30713 = cljs.core.bounded_count.call(null, arglist__30711, fixed_arity__30712 + 1);
      if(bc__30713 <= fixed_arity__30712) {
        return cljs.core.apply_to.call(null, f, bc__30713, arglist__30711)
      }else {
        return f.cljs$lang$applyTo(arglist__30711)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30711))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__30714 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__30715 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__30716 = cljs.core.bounded_count.call(null, arglist__30714, fixed_arity__30715 + 1);
      if(bc__30716 <= fixed_arity__30715) {
        return cljs.core.apply_to.call(null, f, bc__30716, arglist__30714)
      }else {
        return f.cljs$lang$applyTo(arglist__30714)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__30714))
    }
  };
  var apply__6 = function() {
    var G__30720__delegate = function(f, a, b, c, d, args) {
      var arglist__30717 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__30718 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__30719 = cljs.core.bounded_count.call(null, arglist__30717, fixed_arity__30718 + 1);
        if(bc__30719 <= fixed_arity__30718) {
          return cljs.core.apply_to.call(null, f, bc__30719, arglist__30717)
        }else {
          return f.cljs$lang$applyTo(arglist__30717)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__30717))
      }
    };
    var G__30720 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__30720__delegate.call(this, f, a, b, c, d, args)
    };
    G__30720.cljs$lang$maxFixedArity = 5;
    G__30720.cljs$lang$applyTo = function(arglist__30721) {
      var f = cljs.core.first(arglist__30721);
      var a = cljs.core.first(cljs.core.next(arglist__30721));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30721)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30721))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30721)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30721)))));
      return G__30720__delegate(f, a, b, c, d, args)
    };
    G__30720.cljs$lang$arity$variadic = G__30720__delegate;
    return G__30720
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
  vary_meta.cljs$lang$applyTo = function(arglist__30722) {
    var obj = cljs.core.first(arglist__30722);
    var f = cljs.core.first(cljs.core.next(arglist__30722));
    var args = cljs.core.rest(cljs.core.next(arglist__30722));
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
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__30723__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__30723 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30723__delegate.call(this, x, y, more)
    };
    G__30723.cljs$lang$maxFixedArity = 2;
    G__30723.cljs$lang$applyTo = function(arglist__30724) {
      var x = cljs.core.first(arglist__30724);
      var y = cljs.core.first(cljs.core.next(arglist__30724));
      var more = cljs.core.rest(cljs.core.next(arglist__30724));
      return G__30723__delegate(x, y, more)
    };
    G__30723.cljs$lang$arity$variadic = G__30723__delegate;
    return G__30723
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
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
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
        var G__30725 = pred;
        var G__30726 = cljs.core.next.call(null, coll);
        pred = G__30725;
        coll = G__30726;
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
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____30727 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____30727)) {
        return or__3824__auto____30727
      }else {
        var G__30728 = pred;
        var G__30729 = cljs.core.next.call(null, coll);
        pred = G__30728;
        coll = G__30729;
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
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__30730 = null;
    var G__30730__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__30730__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__30730__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__30730__3 = function() {
      var G__30731__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__30731 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__30731__delegate.call(this, x, y, zs)
      };
      G__30731.cljs$lang$maxFixedArity = 2;
      G__30731.cljs$lang$applyTo = function(arglist__30732) {
        var x = cljs.core.first(arglist__30732);
        var y = cljs.core.first(cljs.core.next(arglist__30732));
        var zs = cljs.core.rest(cljs.core.next(arglist__30732));
        return G__30731__delegate(x, y, zs)
      };
      G__30731.cljs$lang$arity$variadic = G__30731__delegate;
      return G__30731
    }();
    G__30730 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__30730__0.call(this);
        case 1:
          return G__30730__1.call(this, x);
        case 2:
          return G__30730__2.call(this, x, y);
        default:
          return G__30730__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__30730.cljs$lang$maxFixedArity = 2;
    G__30730.cljs$lang$applyTo = G__30730__3.cljs$lang$applyTo;
    return G__30730
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__30733__delegate = function(args) {
      return x
    };
    var G__30733 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__30733__delegate.call(this, args)
    };
    G__30733.cljs$lang$maxFixedArity = 0;
    G__30733.cljs$lang$applyTo = function(arglist__30734) {
      var args = cljs.core.seq(arglist__30734);
      return G__30733__delegate(args)
    };
    G__30733.cljs$lang$arity$variadic = G__30733__delegate;
    return G__30733
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
      var G__30738 = null;
      var G__30738__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__30738__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__30738__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__30738__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__30738__4 = function() {
        var G__30739__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__30739 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30739__delegate.call(this, x, y, z, args)
        };
        G__30739.cljs$lang$maxFixedArity = 3;
        G__30739.cljs$lang$applyTo = function(arglist__30740) {
          var x = cljs.core.first(arglist__30740);
          var y = cljs.core.first(cljs.core.next(arglist__30740));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30740)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30740)));
          return G__30739__delegate(x, y, z, args)
        };
        G__30739.cljs$lang$arity$variadic = G__30739__delegate;
        return G__30739
      }();
      G__30738 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__30738__0.call(this);
          case 1:
            return G__30738__1.call(this, x);
          case 2:
            return G__30738__2.call(this, x, y);
          case 3:
            return G__30738__3.call(this, x, y, z);
          default:
            return G__30738__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30738.cljs$lang$maxFixedArity = 3;
      G__30738.cljs$lang$applyTo = G__30738__4.cljs$lang$applyTo;
      return G__30738
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__30741 = null;
      var G__30741__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__30741__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__30741__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__30741__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__30741__4 = function() {
        var G__30742__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__30742 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30742__delegate.call(this, x, y, z, args)
        };
        G__30742.cljs$lang$maxFixedArity = 3;
        G__30742.cljs$lang$applyTo = function(arglist__30743) {
          var x = cljs.core.first(arglist__30743);
          var y = cljs.core.first(cljs.core.next(arglist__30743));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30743)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30743)));
          return G__30742__delegate(x, y, z, args)
        };
        G__30742.cljs$lang$arity$variadic = G__30742__delegate;
        return G__30742
      }();
      G__30741 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__30741__0.call(this);
          case 1:
            return G__30741__1.call(this, x);
          case 2:
            return G__30741__2.call(this, x, y);
          case 3:
            return G__30741__3.call(this, x, y, z);
          default:
            return G__30741__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30741.cljs$lang$maxFixedArity = 3;
      G__30741.cljs$lang$applyTo = G__30741__4.cljs$lang$applyTo;
      return G__30741
    }()
  };
  var comp__4 = function() {
    var G__30744__delegate = function(f1, f2, f3, fs) {
      var fs__30735 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__30745__delegate = function(args) {
          var ret__30736 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__30735), args);
          var fs__30737 = cljs.core.next.call(null, fs__30735);
          while(true) {
            if(cljs.core.truth_(fs__30737)) {
              var G__30746 = cljs.core.first.call(null, fs__30737).call(null, ret__30736);
              var G__30747 = cljs.core.next.call(null, fs__30737);
              ret__30736 = G__30746;
              fs__30737 = G__30747;
              continue
            }else {
              return ret__30736
            }
            break
          }
        };
        var G__30745 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__30745__delegate.call(this, args)
        };
        G__30745.cljs$lang$maxFixedArity = 0;
        G__30745.cljs$lang$applyTo = function(arglist__30748) {
          var args = cljs.core.seq(arglist__30748);
          return G__30745__delegate(args)
        };
        G__30745.cljs$lang$arity$variadic = G__30745__delegate;
        return G__30745
      }()
    };
    var G__30744 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30744__delegate.call(this, f1, f2, f3, fs)
    };
    G__30744.cljs$lang$maxFixedArity = 3;
    G__30744.cljs$lang$applyTo = function(arglist__30749) {
      var f1 = cljs.core.first(arglist__30749);
      var f2 = cljs.core.first(cljs.core.next(arglist__30749));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30749)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30749)));
      return G__30744__delegate(f1, f2, f3, fs)
    };
    G__30744.cljs$lang$arity$variadic = G__30744__delegate;
    return G__30744
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
      var G__30750__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__30750 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30750__delegate.call(this, args)
      };
      G__30750.cljs$lang$maxFixedArity = 0;
      G__30750.cljs$lang$applyTo = function(arglist__30751) {
        var args = cljs.core.seq(arglist__30751);
        return G__30750__delegate(args)
      };
      G__30750.cljs$lang$arity$variadic = G__30750__delegate;
      return G__30750
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__30752__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__30752 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30752__delegate.call(this, args)
      };
      G__30752.cljs$lang$maxFixedArity = 0;
      G__30752.cljs$lang$applyTo = function(arglist__30753) {
        var args = cljs.core.seq(arglist__30753);
        return G__30752__delegate(args)
      };
      G__30752.cljs$lang$arity$variadic = G__30752__delegate;
      return G__30752
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__30754__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__30754 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__30754__delegate.call(this, args)
      };
      G__30754.cljs$lang$maxFixedArity = 0;
      G__30754.cljs$lang$applyTo = function(arglist__30755) {
        var args = cljs.core.seq(arglist__30755);
        return G__30754__delegate(args)
      };
      G__30754.cljs$lang$arity$variadic = G__30754__delegate;
      return G__30754
    }()
  };
  var partial__5 = function() {
    var G__30756__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__30757__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__30757 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__30757__delegate.call(this, args)
        };
        G__30757.cljs$lang$maxFixedArity = 0;
        G__30757.cljs$lang$applyTo = function(arglist__30758) {
          var args = cljs.core.seq(arglist__30758);
          return G__30757__delegate(args)
        };
        G__30757.cljs$lang$arity$variadic = G__30757__delegate;
        return G__30757
      }()
    };
    var G__30756 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30756__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__30756.cljs$lang$maxFixedArity = 4;
    G__30756.cljs$lang$applyTo = function(arglist__30759) {
      var f = cljs.core.first(arglist__30759);
      var arg1 = cljs.core.first(cljs.core.next(arglist__30759));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30759)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30759))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30759))));
      return G__30756__delegate(f, arg1, arg2, arg3, more)
    };
    G__30756.cljs$lang$arity$variadic = G__30756__delegate;
    return G__30756
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
      var G__30760 = null;
      var G__30760__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__30760__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__30760__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__30760__4 = function() {
        var G__30761__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__30761 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30761__delegate.call(this, a, b, c, ds)
        };
        G__30761.cljs$lang$maxFixedArity = 3;
        G__30761.cljs$lang$applyTo = function(arglist__30762) {
          var a = cljs.core.first(arglist__30762);
          var b = cljs.core.first(cljs.core.next(arglist__30762));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30762)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30762)));
          return G__30761__delegate(a, b, c, ds)
        };
        G__30761.cljs$lang$arity$variadic = G__30761__delegate;
        return G__30761
      }();
      G__30760 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__30760__1.call(this, a);
          case 2:
            return G__30760__2.call(this, a, b);
          case 3:
            return G__30760__3.call(this, a, b, c);
          default:
            return G__30760__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30760.cljs$lang$maxFixedArity = 3;
      G__30760.cljs$lang$applyTo = G__30760__4.cljs$lang$applyTo;
      return G__30760
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__30763 = null;
      var G__30763__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__30763__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__30763__4 = function() {
        var G__30764__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__30764 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30764__delegate.call(this, a, b, c, ds)
        };
        G__30764.cljs$lang$maxFixedArity = 3;
        G__30764.cljs$lang$applyTo = function(arglist__30765) {
          var a = cljs.core.first(arglist__30765);
          var b = cljs.core.first(cljs.core.next(arglist__30765));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30765)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30765)));
          return G__30764__delegate(a, b, c, ds)
        };
        G__30764.cljs$lang$arity$variadic = G__30764__delegate;
        return G__30764
      }();
      G__30763 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__30763__2.call(this, a, b);
          case 3:
            return G__30763__3.call(this, a, b, c);
          default:
            return G__30763__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30763.cljs$lang$maxFixedArity = 3;
      G__30763.cljs$lang$applyTo = G__30763__4.cljs$lang$applyTo;
      return G__30763
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__30766 = null;
      var G__30766__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__30766__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__30766__4 = function() {
        var G__30767__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__30767 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30767__delegate.call(this, a, b, c, ds)
        };
        G__30767.cljs$lang$maxFixedArity = 3;
        G__30767.cljs$lang$applyTo = function(arglist__30768) {
          var a = cljs.core.first(arglist__30768);
          var b = cljs.core.first(cljs.core.next(arglist__30768));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30768)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30768)));
          return G__30767__delegate(a, b, c, ds)
        };
        G__30767.cljs$lang$arity$variadic = G__30767__delegate;
        return G__30767
      }();
      G__30766 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__30766__2.call(this, a, b);
          case 3:
            return G__30766__3.call(this, a, b, c);
          default:
            return G__30766__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__30766.cljs$lang$maxFixedArity = 3;
      G__30766.cljs$lang$applyTo = G__30766__4.cljs$lang$applyTo;
      return G__30766
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
  var mapi__30771 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30769 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30769)) {
        var s__30770 = temp__3974__auto____30769;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__30770)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__30770)))
      }else {
        return null
      }
    })
  };
  return mapi__30771.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____30772 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____30772)) {
      var s__30773 = temp__3974__auto____30772;
      var x__30774 = f.call(null, cljs.core.first.call(null, s__30773));
      if(x__30774 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__30773))
      }else {
        return cljs.core.cons.call(null, x__30774, keep.call(null, f, cljs.core.rest.call(null, s__30773)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__30784 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30781 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30781)) {
        var s__30782 = temp__3974__auto____30781;
        var x__30783 = f.call(null, idx, cljs.core.first.call(null, s__30782));
        if(x__30783 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__30782))
        }else {
          return cljs.core.cons.call(null, x__30783, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__30782)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__30784.call(null, 0, coll)
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
          var and__3822__auto____30791 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30791)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____30791
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____30792 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30792)) {
            var and__3822__auto____30793 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____30793)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____30793
            }
          }else {
            return and__3822__auto____30792
          }
        }())
      };
      var ep1__4 = function() {
        var G__30829__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____30794 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____30794)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____30794
            }
          }())
        };
        var G__30829 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30829__delegate.call(this, x, y, z, args)
        };
        G__30829.cljs$lang$maxFixedArity = 3;
        G__30829.cljs$lang$applyTo = function(arglist__30830) {
          var x = cljs.core.first(arglist__30830);
          var y = cljs.core.first(cljs.core.next(arglist__30830));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30830)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30830)));
          return G__30829__delegate(x, y, z, args)
        };
        G__30829.cljs$lang$arity$variadic = G__30829__delegate;
        return G__30829
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
          var and__3822__auto____30795 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30795)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____30795
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____30796 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30796)) {
            var and__3822__auto____30797 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____30797)) {
              var and__3822__auto____30798 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____30798)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____30798
              }
            }else {
              return and__3822__auto____30797
            }
          }else {
            return and__3822__auto____30796
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____30799 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30799)) {
            var and__3822__auto____30800 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____30800)) {
              var and__3822__auto____30801 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____30801)) {
                var and__3822__auto____30802 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____30802)) {
                  var and__3822__auto____30803 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____30803)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____30803
                  }
                }else {
                  return and__3822__auto____30802
                }
              }else {
                return and__3822__auto____30801
              }
            }else {
              return and__3822__auto____30800
            }
          }else {
            return and__3822__auto____30799
          }
        }())
      };
      var ep2__4 = function() {
        var G__30831__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____30804 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____30804)) {
              return cljs.core.every_QMARK_.call(null, function(p1__30775_SHARP_) {
                var and__3822__auto____30805 = p1.call(null, p1__30775_SHARP_);
                if(cljs.core.truth_(and__3822__auto____30805)) {
                  return p2.call(null, p1__30775_SHARP_)
                }else {
                  return and__3822__auto____30805
                }
              }, args)
            }else {
              return and__3822__auto____30804
            }
          }())
        };
        var G__30831 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30831__delegate.call(this, x, y, z, args)
        };
        G__30831.cljs$lang$maxFixedArity = 3;
        G__30831.cljs$lang$applyTo = function(arglist__30832) {
          var x = cljs.core.first(arglist__30832);
          var y = cljs.core.first(cljs.core.next(arglist__30832));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30832)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30832)));
          return G__30831__delegate(x, y, z, args)
        };
        G__30831.cljs$lang$arity$variadic = G__30831__delegate;
        return G__30831
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
          var and__3822__auto____30806 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30806)) {
            var and__3822__auto____30807 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____30807)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____30807
            }
          }else {
            return and__3822__auto____30806
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____30808 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30808)) {
            var and__3822__auto____30809 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____30809)) {
              var and__3822__auto____30810 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____30810)) {
                var and__3822__auto____30811 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____30811)) {
                  var and__3822__auto____30812 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____30812)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____30812
                  }
                }else {
                  return and__3822__auto____30811
                }
              }else {
                return and__3822__auto____30810
              }
            }else {
              return and__3822__auto____30809
            }
          }else {
            return and__3822__auto____30808
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____30813 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____30813)) {
            var and__3822__auto____30814 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____30814)) {
              var and__3822__auto____30815 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____30815)) {
                var and__3822__auto____30816 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____30816)) {
                  var and__3822__auto____30817 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____30817)) {
                    var and__3822__auto____30818 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____30818)) {
                      var and__3822__auto____30819 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____30819)) {
                        var and__3822__auto____30820 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____30820)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____30820
                        }
                      }else {
                        return and__3822__auto____30819
                      }
                    }else {
                      return and__3822__auto____30818
                    }
                  }else {
                    return and__3822__auto____30817
                  }
                }else {
                  return and__3822__auto____30816
                }
              }else {
                return and__3822__auto____30815
              }
            }else {
              return and__3822__auto____30814
            }
          }else {
            return and__3822__auto____30813
          }
        }())
      };
      var ep3__4 = function() {
        var G__30833__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____30821 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____30821)) {
              return cljs.core.every_QMARK_.call(null, function(p1__30776_SHARP_) {
                var and__3822__auto____30822 = p1.call(null, p1__30776_SHARP_);
                if(cljs.core.truth_(and__3822__auto____30822)) {
                  var and__3822__auto____30823 = p2.call(null, p1__30776_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____30823)) {
                    return p3.call(null, p1__30776_SHARP_)
                  }else {
                    return and__3822__auto____30823
                  }
                }else {
                  return and__3822__auto____30822
                }
              }, args)
            }else {
              return and__3822__auto____30821
            }
          }())
        };
        var G__30833 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30833__delegate.call(this, x, y, z, args)
        };
        G__30833.cljs$lang$maxFixedArity = 3;
        G__30833.cljs$lang$applyTo = function(arglist__30834) {
          var x = cljs.core.first(arglist__30834);
          var y = cljs.core.first(cljs.core.next(arglist__30834));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30834)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30834)));
          return G__30833__delegate(x, y, z, args)
        };
        G__30833.cljs$lang$arity$variadic = G__30833__delegate;
        return G__30833
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
    var G__30835__delegate = function(p1, p2, p3, ps) {
      var ps__30824 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__30777_SHARP_) {
            return p1__30777_SHARP_.call(null, x)
          }, ps__30824)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__30778_SHARP_) {
            var and__3822__auto____30825 = p1__30778_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____30825)) {
              return p1__30778_SHARP_.call(null, y)
            }else {
              return and__3822__auto____30825
            }
          }, ps__30824)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__30779_SHARP_) {
            var and__3822__auto____30826 = p1__30779_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____30826)) {
              var and__3822__auto____30827 = p1__30779_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____30827)) {
                return p1__30779_SHARP_.call(null, z)
              }else {
                return and__3822__auto____30827
              }
            }else {
              return and__3822__auto____30826
            }
          }, ps__30824)
        };
        var epn__4 = function() {
          var G__30836__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____30828 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____30828)) {
                return cljs.core.every_QMARK_.call(null, function(p1__30780_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__30780_SHARP_, args)
                }, ps__30824)
              }else {
                return and__3822__auto____30828
              }
            }())
          };
          var G__30836 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__30836__delegate.call(this, x, y, z, args)
          };
          G__30836.cljs$lang$maxFixedArity = 3;
          G__30836.cljs$lang$applyTo = function(arglist__30837) {
            var x = cljs.core.first(arglist__30837);
            var y = cljs.core.first(cljs.core.next(arglist__30837));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30837)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30837)));
            return G__30836__delegate(x, y, z, args)
          };
          G__30836.cljs$lang$arity$variadic = G__30836__delegate;
          return G__30836
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
    var G__30835 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30835__delegate.call(this, p1, p2, p3, ps)
    };
    G__30835.cljs$lang$maxFixedArity = 3;
    G__30835.cljs$lang$applyTo = function(arglist__30838) {
      var p1 = cljs.core.first(arglist__30838);
      var p2 = cljs.core.first(cljs.core.next(arglist__30838));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30838)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30838)));
      return G__30835__delegate(p1, p2, p3, ps)
    };
    G__30835.cljs$lang$arity$variadic = G__30835__delegate;
    return G__30835
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
        var or__3824__auto____30840 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30840)) {
          return or__3824__auto____30840
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____30841 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30841)) {
          return or__3824__auto____30841
        }else {
          var or__3824__auto____30842 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____30842)) {
            return or__3824__auto____30842
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__30878__delegate = function(x, y, z, args) {
          var or__3824__auto____30843 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____30843)) {
            return or__3824__auto____30843
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__30878 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30878__delegate.call(this, x, y, z, args)
        };
        G__30878.cljs$lang$maxFixedArity = 3;
        G__30878.cljs$lang$applyTo = function(arglist__30879) {
          var x = cljs.core.first(arglist__30879);
          var y = cljs.core.first(cljs.core.next(arglist__30879));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30879)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30879)));
          return G__30878__delegate(x, y, z, args)
        };
        G__30878.cljs$lang$arity$variadic = G__30878__delegate;
        return G__30878
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
        var or__3824__auto____30844 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30844)) {
          return or__3824__auto____30844
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____30845 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30845)) {
          return or__3824__auto____30845
        }else {
          var or__3824__auto____30846 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____30846)) {
            return or__3824__auto____30846
          }else {
            var or__3824__auto____30847 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____30847)) {
              return or__3824__auto____30847
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____30848 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30848)) {
          return or__3824__auto____30848
        }else {
          var or__3824__auto____30849 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____30849)) {
            return or__3824__auto____30849
          }else {
            var or__3824__auto____30850 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____30850)) {
              return or__3824__auto____30850
            }else {
              var or__3824__auto____30851 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____30851)) {
                return or__3824__auto____30851
              }else {
                var or__3824__auto____30852 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____30852)) {
                  return or__3824__auto____30852
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__30880__delegate = function(x, y, z, args) {
          var or__3824__auto____30853 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____30853)) {
            return or__3824__auto____30853
          }else {
            return cljs.core.some.call(null, function(p1__30785_SHARP_) {
              var or__3824__auto____30854 = p1.call(null, p1__30785_SHARP_);
              if(cljs.core.truth_(or__3824__auto____30854)) {
                return or__3824__auto____30854
              }else {
                return p2.call(null, p1__30785_SHARP_)
              }
            }, args)
          }
        };
        var G__30880 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30880__delegate.call(this, x, y, z, args)
        };
        G__30880.cljs$lang$maxFixedArity = 3;
        G__30880.cljs$lang$applyTo = function(arglist__30881) {
          var x = cljs.core.first(arglist__30881);
          var y = cljs.core.first(cljs.core.next(arglist__30881));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30881)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30881)));
          return G__30880__delegate(x, y, z, args)
        };
        G__30880.cljs$lang$arity$variadic = G__30880__delegate;
        return G__30880
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
        var or__3824__auto____30855 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30855)) {
          return or__3824__auto____30855
        }else {
          var or__3824__auto____30856 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____30856)) {
            return or__3824__auto____30856
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____30857 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30857)) {
          return or__3824__auto____30857
        }else {
          var or__3824__auto____30858 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____30858)) {
            return or__3824__auto____30858
          }else {
            var or__3824__auto____30859 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____30859)) {
              return or__3824__auto____30859
            }else {
              var or__3824__auto____30860 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____30860)) {
                return or__3824__auto____30860
              }else {
                var or__3824__auto____30861 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____30861)) {
                  return or__3824__auto____30861
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____30862 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____30862)) {
          return or__3824__auto____30862
        }else {
          var or__3824__auto____30863 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____30863)) {
            return or__3824__auto____30863
          }else {
            var or__3824__auto____30864 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____30864)) {
              return or__3824__auto____30864
            }else {
              var or__3824__auto____30865 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____30865)) {
                return or__3824__auto____30865
              }else {
                var or__3824__auto____30866 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____30866)) {
                  return or__3824__auto____30866
                }else {
                  var or__3824__auto____30867 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____30867)) {
                    return or__3824__auto____30867
                  }else {
                    var or__3824__auto____30868 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____30868)) {
                      return or__3824__auto____30868
                    }else {
                      var or__3824__auto____30869 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____30869)) {
                        return or__3824__auto____30869
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
        var G__30882__delegate = function(x, y, z, args) {
          var or__3824__auto____30870 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____30870)) {
            return or__3824__auto____30870
          }else {
            return cljs.core.some.call(null, function(p1__30786_SHARP_) {
              var or__3824__auto____30871 = p1.call(null, p1__30786_SHARP_);
              if(cljs.core.truth_(or__3824__auto____30871)) {
                return or__3824__auto____30871
              }else {
                var or__3824__auto____30872 = p2.call(null, p1__30786_SHARP_);
                if(cljs.core.truth_(or__3824__auto____30872)) {
                  return or__3824__auto____30872
                }else {
                  return p3.call(null, p1__30786_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__30882 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__30882__delegate.call(this, x, y, z, args)
        };
        G__30882.cljs$lang$maxFixedArity = 3;
        G__30882.cljs$lang$applyTo = function(arglist__30883) {
          var x = cljs.core.first(arglist__30883);
          var y = cljs.core.first(cljs.core.next(arglist__30883));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30883)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30883)));
          return G__30882__delegate(x, y, z, args)
        };
        G__30882.cljs$lang$arity$variadic = G__30882__delegate;
        return G__30882
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
    var G__30884__delegate = function(p1, p2, p3, ps) {
      var ps__30873 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__30787_SHARP_) {
            return p1__30787_SHARP_.call(null, x)
          }, ps__30873)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__30788_SHARP_) {
            var or__3824__auto____30874 = p1__30788_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____30874)) {
              return or__3824__auto____30874
            }else {
              return p1__30788_SHARP_.call(null, y)
            }
          }, ps__30873)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__30789_SHARP_) {
            var or__3824__auto____30875 = p1__30789_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____30875)) {
              return or__3824__auto____30875
            }else {
              var or__3824__auto____30876 = p1__30789_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____30876)) {
                return or__3824__auto____30876
              }else {
                return p1__30789_SHARP_.call(null, z)
              }
            }
          }, ps__30873)
        };
        var spn__4 = function() {
          var G__30885__delegate = function(x, y, z, args) {
            var or__3824__auto____30877 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____30877)) {
              return or__3824__auto____30877
            }else {
              return cljs.core.some.call(null, function(p1__30790_SHARP_) {
                return cljs.core.some.call(null, p1__30790_SHARP_, args)
              }, ps__30873)
            }
          };
          var G__30885 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__30885__delegate.call(this, x, y, z, args)
          };
          G__30885.cljs$lang$maxFixedArity = 3;
          G__30885.cljs$lang$applyTo = function(arglist__30886) {
            var x = cljs.core.first(arglist__30886);
            var y = cljs.core.first(cljs.core.next(arglist__30886));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30886)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30886)));
            return G__30885__delegate(x, y, z, args)
          };
          G__30885.cljs$lang$arity$variadic = G__30885__delegate;
          return G__30885
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
    var G__30884 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__30884__delegate.call(this, p1, p2, p3, ps)
    };
    G__30884.cljs$lang$maxFixedArity = 3;
    G__30884.cljs$lang$applyTo = function(arglist__30887) {
      var p1 = cljs.core.first(arglist__30887);
      var p2 = cljs.core.first(cljs.core.next(arglist__30887));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30887)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30887)));
      return G__30884__delegate(p1, p2, p3, ps)
    };
    G__30884.cljs$lang$arity$variadic = G__30884__delegate;
    return G__30884
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
      var temp__3974__auto____30888 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30888)) {
        var s__30889 = temp__3974__auto____30888;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__30889)), map.call(null, f, cljs.core.rest.call(null, s__30889)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__30890 = cljs.core.seq.call(null, c1);
      var s2__30891 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____30892 = s1__30890;
        if(cljs.core.truth_(and__3822__auto____30892)) {
          return s2__30891
        }else {
          return and__3822__auto____30892
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__30890), cljs.core.first.call(null, s2__30891)), map.call(null, f, cljs.core.rest.call(null, s1__30890), cljs.core.rest.call(null, s2__30891)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__30893 = cljs.core.seq.call(null, c1);
      var s2__30894 = cljs.core.seq.call(null, c2);
      var s3__30895 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____30896 = s1__30893;
        if(cljs.core.truth_(and__3822__auto____30896)) {
          var and__3822__auto____30897 = s2__30894;
          if(cljs.core.truth_(and__3822__auto____30897)) {
            return s3__30895
          }else {
            return and__3822__auto____30897
          }
        }else {
          return and__3822__auto____30896
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__30893), cljs.core.first.call(null, s2__30894), cljs.core.first.call(null, s3__30895)), map.call(null, f, cljs.core.rest.call(null, s1__30893), cljs.core.rest.call(null, s2__30894), cljs.core.rest.call(null, s3__30895)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__30900__delegate = function(f, c1, c2, c3, colls) {
      var step__30899 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__30898 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__30898)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__30898), step.call(null, map.call(null, cljs.core.rest, ss__30898)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__30839_SHARP_) {
        return cljs.core.apply.call(null, f, p1__30839_SHARP_)
      }, step__30899.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__30900 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30900__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__30900.cljs$lang$maxFixedArity = 4;
    G__30900.cljs$lang$applyTo = function(arglist__30901) {
      var f = cljs.core.first(arglist__30901);
      var c1 = cljs.core.first(cljs.core.next(arglist__30901));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30901)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30901))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30901))));
      return G__30900__delegate(f, c1, c2, c3, colls)
    };
    G__30900.cljs$lang$arity$variadic = G__30900__delegate;
    return G__30900
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
      var temp__3974__auto____30902 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30902)) {
        var s__30903 = temp__3974__auto____30902;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__30903), take.call(null, n - 1, cljs.core.rest.call(null, s__30903)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__30906 = function(n, coll) {
    while(true) {
      var s__30904 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____30905 = n > 0;
        if(and__3822__auto____30905) {
          return s__30904
        }else {
          return and__3822__auto____30905
        }
      }())) {
        var G__30907 = n - 1;
        var G__30908 = cljs.core.rest.call(null, s__30904);
        n = G__30907;
        coll = G__30908;
        continue
      }else {
        return s__30904
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__30906.call(null, n, coll)
  })
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
  var s__30909 = cljs.core.seq.call(null, coll);
  var lead__30910 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__30910)) {
      var G__30911 = cljs.core.next.call(null, s__30909);
      var G__30912 = cljs.core.next.call(null, lead__30910);
      s__30909 = G__30911;
      lead__30910 = G__30912;
      continue
    }else {
      return s__30909
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__30915 = function(pred, coll) {
    while(true) {
      var s__30913 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____30914 = s__30913;
        if(cljs.core.truth_(and__3822__auto____30914)) {
          return pred.call(null, cljs.core.first.call(null, s__30913))
        }else {
          return and__3822__auto____30914
        }
      }())) {
        var G__30916 = pred;
        var G__30917 = cljs.core.rest.call(null, s__30913);
        pred = G__30916;
        coll = G__30917;
        continue
      }else {
        return s__30913
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__30915.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____30918 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____30918)) {
      var s__30919 = temp__3974__auto____30918;
      return cljs.core.concat.call(null, s__30919, cycle.call(null, s__30919))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
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
    })
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
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__30920 = cljs.core.seq.call(null, c1);
      var s2__30921 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____30922 = s1__30920;
        if(cljs.core.truth_(and__3822__auto____30922)) {
          return s2__30921
        }else {
          return and__3822__auto____30922
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__30920), cljs.core.cons.call(null, cljs.core.first.call(null, s2__30921), interleave.call(null, cljs.core.rest.call(null, s1__30920), cljs.core.rest.call(null, s2__30921))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__30924__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__30923 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__30923)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__30923), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__30923)))
        }else {
          return null
        }
      })
    };
    var G__30924 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30924__delegate.call(this, c1, c2, colls)
    };
    G__30924.cljs$lang$maxFixedArity = 2;
    G__30924.cljs$lang$applyTo = function(arglist__30925) {
      var c1 = cljs.core.first(arglist__30925);
      var c2 = cljs.core.first(cljs.core.next(arglist__30925));
      var colls = cljs.core.rest(cljs.core.next(arglist__30925));
      return G__30924__delegate(c1, c2, colls)
    };
    G__30924.cljs$lang$arity$variadic = G__30924__delegate;
    return G__30924
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
  var cat__30928 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____30926 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____30926)) {
        var coll__30927 = temp__3971__auto____30926;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__30927), cat.call(null, cljs.core.rest.call(null, coll__30927), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__30928.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__30929__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__30929 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__30929__delegate.call(this, f, coll, colls)
    };
    G__30929.cljs$lang$maxFixedArity = 2;
    G__30929.cljs$lang$applyTo = function(arglist__30930) {
      var f = cljs.core.first(arglist__30930);
      var coll = cljs.core.first(cljs.core.next(arglist__30930));
      var colls = cljs.core.rest(cljs.core.next(arglist__30930));
      return G__30929__delegate(f, coll, colls)
    };
    G__30929.cljs$lang$arity$variadic = G__30929__delegate;
    return G__30929
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
    var temp__3974__auto____30931 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____30931)) {
      var s__30932 = temp__3974__auto____30931;
      var f__30933 = cljs.core.first.call(null, s__30932);
      var r__30934 = cljs.core.rest.call(null, s__30932);
      if(cljs.core.truth_(pred.call(null, f__30933))) {
        return cljs.core.cons.call(null, f__30933, filter.call(null, pred, r__30934))
      }else {
        return filter.call(null, pred, r__30934)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__30936 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__30936.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__30935_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__30935_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__30937__30938 = to;
    if(G__30937__30938 != null) {
      if(function() {
        var or__3824__auto____30939 = G__30937__30938.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____30939) {
          return or__3824__auto____30939
        }else {
          return G__30937__30938.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__30937__30938.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__30937__30938)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__30937__30938)
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
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__30940__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__30940 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__30940__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__30940.cljs$lang$maxFixedArity = 4;
    G__30940.cljs$lang$applyTo = function(arglist__30941) {
      var f = cljs.core.first(arglist__30941);
      var c1 = cljs.core.first(cljs.core.next(arglist__30941));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30941)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30941))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__30941))));
      return G__30940__delegate(f, c1, c2, c3, colls)
    };
    G__30940.cljs$lang$arity$variadic = G__30940__delegate;
    return G__30940
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
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30942 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30942)) {
        var s__30943 = temp__3974__auto____30942;
        var p__30944 = cljs.core.take.call(null, n, s__30943);
        if(n === cljs.core.count.call(null, p__30944)) {
          return cljs.core.cons.call(null, p__30944, partition.call(null, n, step, cljs.core.drop.call(null, step, s__30943)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____30945 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____30945)) {
        var s__30946 = temp__3974__auto____30945;
        var p__30947 = cljs.core.take.call(null, n, s__30946);
        if(n === cljs.core.count.call(null, p__30947)) {
          return cljs.core.cons.call(null, p__30947, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__30946)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__30947, pad)))
        }
      }else {
        return null
      }
    })
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
    var sentinel__30948 = cljs.core.lookup_sentinel;
    var m__30949 = m;
    var ks__30950 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__30950)) {
        var m__30951 = cljs.core.get.call(null, m__30949, cljs.core.first.call(null, ks__30950), sentinel__30948);
        if(sentinel__30948 === m__30951) {
          return not_found
        }else {
          var G__30952 = sentinel__30948;
          var G__30953 = m__30951;
          var G__30954 = cljs.core.next.call(null, ks__30950);
          sentinel__30948 = G__30952;
          m__30949 = G__30953;
          ks__30950 = G__30954;
          continue
        }
      }else {
        return m__30949
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
cljs.core.assoc_in = function assoc_in(m, p__30955, v) {
  var vec__30956__30957 = p__30955;
  var k__30958 = cljs.core.nth.call(null, vec__30956__30957, 0, null);
  var ks__30959 = cljs.core.nthnext.call(null, vec__30956__30957, 1);
  if(cljs.core.truth_(ks__30959)) {
    return cljs.core.assoc.call(null, m, k__30958, assoc_in.call(null, cljs.core.get.call(null, m, k__30958), ks__30959, v))
  }else {
    return cljs.core.assoc.call(null, m, k__30958, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__30960, f, args) {
    var vec__30961__30962 = p__30960;
    var k__30963 = cljs.core.nth.call(null, vec__30961__30962, 0, null);
    var ks__30964 = cljs.core.nthnext.call(null, vec__30961__30962, 1);
    if(cljs.core.truth_(ks__30964)) {
      return cljs.core.assoc.call(null, m, k__30963, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__30963), ks__30964, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__30963, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__30963), args))
    }
  };
  var update_in = function(m, p__30960, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__30960, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__30965) {
    var m = cljs.core.first(arglist__30965);
    var p__30960 = cljs.core.first(cljs.core.next(arglist__30965));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__30965)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__30965)));
    return update_in__delegate(m, p__30960, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__30970 = this;
  var h__364__auto____30971 = this__30970.__hash;
  if(h__364__auto____30971 != null) {
    return h__364__auto____30971
  }else {
    var h__364__auto____30972 = cljs.core.hash_coll.call(null, coll);
    this__30970.__hash = h__364__auto____30972;
    return h__364__auto____30972
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__30973 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__30974 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__30975 = this;
  var new_array__30976 = cljs.core.aclone.call(null, this__30975.array);
  new_array__30976[k] = v;
  return new cljs.core.Vector(this__30975.meta, new_array__30976, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__31005 = null;
  var G__31005__2 = function(tsym30968, k) {
    var this__30977 = this;
    var tsym30968__30978 = this;
    var coll__30979 = tsym30968__30978;
    return cljs.core._lookup.call(null, coll__30979, k)
  };
  var G__31005__3 = function(tsym30969, k, not_found) {
    var this__30980 = this;
    var tsym30969__30981 = this;
    var coll__30982 = tsym30969__30981;
    return cljs.core._lookup.call(null, coll__30982, k, not_found)
  };
  G__31005 = function(tsym30969, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31005__2.call(this, tsym30969, k);
      case 3:
        return G__31005__3.call(this, tsym30969, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31005
}();
cljs.core.Vector.prototype.apply = function(tsym30966, args30967) {
  return tsym30966.call.apply(tsym30966, [tsym30966].concat(cljs.core.aclone.call(null, args30967)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__30983 = this;
  var new_array__30984 = cljs.core.aclone.call(null, this__30983.array);
  new_array__30984.push(o);
  return new cljs.core.Vector(this__30983.meta, new_array__30984, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__30985 = this;
  var this$__30986 = this;
  return cljs.core.pr_str.call(null, this$__30986)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__30987 = this;
  return cljs.core.ci_reduce.call(null, this__30987.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__30988 = this;
  return cljs.core.ci_reduce.call(null, this__30988.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__30989 = this;
  if(this__30989.array.length > 0) {
    var vector_seq__30990 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__30989.array.length) {
          return cljs.core.cons.call(null, this__30989.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__30990.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__30991 = this;
  return this__30991.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__30992 = this;
  var count__30993 = this__30992.array.length;
  if(count__30993 > 0) {
    return this__30992.array[count__30993 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__30994 = this;
  if(this__30994.array.length > 0) {
    var new_array__30995 = cljs.core.aclone.call(null, this__30994.array);
    new_array__30995.pop();
    return new cljs.core.Vector(this__30994.meta, new_array__30995, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__30996 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__30997 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__30998 = this;
  return new cljs.core.Vector(meta, this__30998.array, this__30998.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__30999 = this;
  return this__30999.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31001 = this;
  if(function() {
    var and__3822__auto____31002 = 0 <= n;
    if(and__3822__auto____31002) {
      return n < this__31001.array.length
    }else {
      return and__3822__auto____31002
    }
  }()) {
    return this__31001.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31003 = this;
  if(function() {
    var and__3822__auto____31004 = 0 <= n;
    if(and__3822__auto____31004) {
      return n < this__31003.array.length
    }else {
      return and__3822__auto____31004
    }
  }()) {
    return this__31003.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31000 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__31000.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
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
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__31006 = pv.cnt;
  if(cnt__31006 < 32) {
    return 0
  }else {
    return cnt__31006 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__31007 = level;
  var ret__31008 = node;
  while(true) {
    if(ll__31007 === 0) {
      return ret__31008
    }else {
      var embed__31009 = ret__31008;
      var r__31010 = cljs.core.pv_fresh_node.call(null, edit);
      var ___31011 = cljs.core.pv_aset.call(null, r__31010, 0, embed__31009);
      var G__31012 = ll__31007 - 5;
      var G__31013 = r__31010;
      ll__31007 = G__31012;
      ret__31008 = G__31013;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__31014 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__31015 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__31014, subidx__31015, tailnode);
    return ret__31014
  }else {
    var temp__3971__auto____31016 = cljs.core.pv_aget.call(null, parent, subidx__31015);
    if(cljs.core.truth_(temp__3971__auto____31016)) {
      var child__31017 = temp__3971__auto____31016;
      var node_to_insert__31018 = push_tail.call(null, pv, level - 5, child__31017, tailnode);
      cljs.core.pv_aset.call(null, ret__31014, subidx__31015, node_to_insert__31018);
      return ret__31014
    }else {
      var node_to_insert__31019 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__31014, subidx__31015, node_to_insert__31019);
      return ret__31014
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____31020 = 0 <= i;
    if(and__3822__auto____31020) {
      return i < pv.cnt
    }else {
      return and__3822__auto____31020
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__31021 = pv.root;
      var level__31022 = pv.shift;
      while(true) {
        if(level__31022 > 0) {
          var G__31023 = cljs.core.pv_aget.call(null, node__31021, i >>> level__31022 & 31);
          var G__31024 = level__31022 - 5;
          node__31021 = G__31023;
          level__31022 = G__31024;
          continue
        }else {
          return node__31021.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__31025 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__31025, i & 31, val);
    return ret__31025
  }else {
    var subidx__31026 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__31025, subidx__31026, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__31026), i, val));
    return ret__31025
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__31027 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__31028 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__31027));
    if(function() {
      var and__3822__auto____31029 = new_child__31028 == null;
      if(and__3822__auto____31029) {
        return subidx__31027 === 0
      }else {
        return and__3822__auto____31029
      }
    }()) {
      return null
    }else {
      var ret__31030 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__31030, subidx__31027, new_child__31028);
      return ret__31030
    }
  }else {
    if(subidx__31027 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__31031 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__31031, subidx__31027, null);
        return ret__31031
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__31032 = cljs.core._count.call(null, v);
  if(c__31032 > 0) {
    if(void 0 === cljs.core.t31033) {
      cljs.core.t31033 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t31033.cljs$lang$type = true;
      cljs.core.t31033.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t31033")
      };
      cljs.core.t31033.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t31033.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__31034 = this;
        return vseq
      };
      cljs.core.t31033.prototype.cljs$core$ISeq$ = true;
      cljs.core.t31033.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__31035 = this;
        return cljs.core._nth.call(null, this__31035.v, this__31035.offset)
      };
      cljs.core.t31033.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__31036 = this;
        var offset__31037 = this__31036.offset + 1;
        if(offset__31037 < this__31036.c) {
          return this__31036.vector_seq.call(null, this__31036.v, offset__31037)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t31033.prototype.cljs$core$ASeq$ = true;
      cljs.core.t31033.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t31033.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__31038 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t31033.prototype.cljs$core$ISequential$ = true;
      cljs.core.t31033.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t31033.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__31039 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t31033.prototype.cljs$core$IMeta$ = true;
      cljs.core.t31033.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__31040 = this;
        return this__31040.__meta__389__auto__
      };
      cljs.core.t31033.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t31033.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__31041 = this;
        return new cljs.core.t31033(this__31041.c, this__31041.offset, this__31041.v, this__31041.vector_seq, __meta__389__auto__)
      };
      cljs.core.t31033
    }else {
    }
    return new cljs.core.t31033(c__31032, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31046 = this;
  return new cljs.core.TransientVector(this__31046.cnt, this__31046.shift, cljs.core.tv_editable_root.call(null, this__31046.root), cljs.core.tv_editable_tail.call(null, this__31046.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31047 = this;
  var h__364__auto____31048 = this__31047.__hash;
  if(h__364__auto____31048 != null) {
    return h__364__auto____31048
  }else {
    var h__364__auto____31049 = cljs.core.hash_coll.call(null, coll);
    this__31047.__hash = h__364__auto____31049;
    return h__364__auto____31049
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31050 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31051 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31052 = this;
  if(function() {
    var and__3822__auto____31053 = 0 <= k;
    if(and__3822__auto____31053) {
      return k < this__31052.cnt
    }else {
      return and__3822__auto____31053
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__31054 = cljs.core.aclone.call(null, this__31052.tail);
      new_tail__31054[k & 31] = v;
      return new cljs.core.PersistentVector(this__31052.meta, this__31052.cnt, this__31052.shift, this__31052.root, new_tail__31054, null)
    }else {
      return new cljs.core.PersistentVector(this__31052.meta, this__31052.cnt, this__31052.shift, cljs.core.do_assoc.call(null, coll, this__31052.shift, this__31052.root, k, v), this__31052.tail, null)
    }
  }else {
    if(k === this__31052.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__31052.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__31099 = null;
  var G__31099__2 = function(tsym31044, k) {
    var this__31055 = this;
    var tsym31044__31056 = this;
    var coll__31057 = tsym31044__31056;
    return cljs.core._lookup.call(null, coll__31057, k)
  };
  var G__31099__3 = function(tsym31045, k, not_found) {
    var this__31058 = this;
    var tsym31045__31059 = this;
    var coll__31060 = tsym31045__31059;
    return cljs.core._lookup.call(null, coll__31060, k, not_found)
  };
  G__31099 = function(tsym31045, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31099__2.call(this, tsym31045, k);
      case 3:
        return G__31099__3.call(this, tsym31045, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31099
}();
cljs.core.PersistentVector.prototype.apply = function(tsym31042, args31043) {
  return tsym31042.call.apply(tsym31042, [tsym31042].concat(cljs.core.aclone.call(null, args31043)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__31061 = this;
  var step_init__31062 = [0, init];
  var i__31063 = 0;
  while(true) {
    if(i__31063 < this__31061.cnt) {
      var arr__31064 = cljs.core.array_for.call(null, v, i__31063);
      var len__31065 = arr__31064.length;
      var init__31069 = function() {
        var j__31066 = 0;
        var init__31067 = step_init__31062[1];
        while(true) {
          if(j__31066 < len__31065) {
            var init__31068 = f.call(null, init__31067, j__31066 + i__31063, arr__31064[j__31066]);
            if(cljs.core.reduced_QMARK_.call(null, init__31068)) {
              return init__31068
            }else {
              var G__31100 = j__31066 + 1;
              var G__31101 = init__31068;
              j__31066 = G__31100;
              init__31067 = G__31101;
              continue
            }
          }else {
            step_init__31062[0] = len__31065;
            step_init__31062[1] = init__31067;
            return init__31067
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__31069)) {
        return cljs.core.deref.call(null, init__31069)
      }else {
        var G__31102 = i__31063 + step_init__31062[0];
        i__31063 = G__31102;
        continue
      }
    }else {
      return step_init__31062[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31070 = this;
  if(this__31070.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__31071 = cljs.core.aclone.call(null, this__31070.tail);
    new_tail__31071.push(o);
    return new cljs.core.PersistentVector(this__31070.meta, this__31070.cnt + 1, this__31070.shift, this__31070.root, new_tail__31071, null)
  }else {
    var root_overflow_QMARK___31072 = this__31070.cnt >>> 5 > 1 << this__31070.shift;
    var new_shift__31073 = root_overflow_QMARK___31072 ? this__31070.shift + 5 : this__31070.shift;
    var new_root__31075 = root_overflow_QMARK___31072 ? function() {
      var n_r__31074 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__31074, 0, this__31070.root);
      cljs.core.pv_aset.call(null, n_r__31074, 1, cljs.core.new_path.call(null, null, this__31070.shift, new cljs.core.VectorNode(null, this__31070.tail)));
      return n_r__31074
    }() : cljs.core.push_tail.call(null, coll, this__31070.shift, this__31070.root, new cljs.core.VectorNode(null, this__31070.tail));
    return new cljs.core.PersistentVector(this__31070.meta, this__31070.cnt + 1, new_shift__31073, new_root__31075, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__31076 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__31077 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__31078 = this;
  var this$__31079 = this;
  return cljs.core.pr_str.call(null, this$__31079)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__31080 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__31081 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31082 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31083 = this;
  return this__31083.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31084 = this;
  if(this__31084.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__31084.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31085 = this;
  if(this__31085.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__31085.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__31085.meta)
    }else {
      if(1 < this__31085.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__31085.meta, this__31085.cnt - 1, this__31085.shift, this__31085.root, this__31085.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__31086 = cljs.core.array_for.call(null, coll, this__31085.cnt - 2);
          var nr__31087 = cljs.core.pop_tail.call(null, coll, this__31085.shift, this__31085.root);
          var new_root__31088 = nr__31087 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__31087;
          var cnt_1__31089 = this__31085.cnt - 1;
          if(function() {
            var and__3822__auto____31090 = 5 < this__31085.shift;
            if(and__3822__auto____31090) {
              return cljs.core.pv_aget.call(null, new_root__31088, 1) == null
            }else {
              return and__3822__auto____31090
            }
          }()) {
            return new cljs.core.PersistentVector(this__31085.meta, cnt_1__31089, this__31085.shift - 5, cljs.core.pv_aget.call(null, new_root__31088, 0), new_tail__31086, null)
          }else {
            return new cljs.core.PersistentVector(this__31085.meta, cnt_1__31089, this__31085.shift, new_root__31088, new_tail__31086, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__31092 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31093 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31094 = this;
  return new cljs.core.PersistentVector(meta, this__31094.cnt, this__31094.shift, this__31094.root, this__31094.tail, this__31094.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31095 = this;
  return this__31095.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31096 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31097 = this;
  if(function() {
    var and__3822__auto____31098 = 0 <= n;
    if(and__3822__auto____31098) {
      return n < this__31097.cnt
    }else {
      return and__3822__auto____31098
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31091 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__31091.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__31103 = cljs.core.seq.call(null, xs);
  var out__31104 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__31103)) {
      var G__31105 = cljs.core.next.call(null, xs__31103);
      var G__31106 = cljs.core.conj_BANG_.call(null, out__31104, cljs.core.first.call(null, xs__31103));
      xs__31103 = G__31105;
      out__31104 = G__31106;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__31104)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
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
  vector.cljs$lang$applyTo = function(arglist__31107) {
    var args = cljs.core.seq(arglist__31107);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31112 = this;
  var h__364__auto____31113 = this__31112.__hash;
  if(h__364__auto____31113 != null) {
    return h__364__auto____31113
  }else {
    var h__364__auto____31114 = cljs.core.hash_coll.call(null, coll);
    this__31112.__hash = h__364__auto____31114;
    return h__364__auto____31114
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31115 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31116 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__31117 = this;
  var v_pos__31118 = this__31117.start + key;
  return new cljs.core.Subvec(this__31117.meta, cljs.core._assoc.call(null, this__31117.v, v_pos__31118, val), this__31117.start, this__31117.end > v_pos__31118 + 1 ? this__31117.end : v_pos__31118 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__31142 = null;
  var G__31142__2 = function(tsym31110, k) {
    var this__31119 = this;
    var tsym31110__31120 = this;
    var coll__31121 = tsym31110__31120;
    return cljs.core._lookup.call(null, coll__31121, k)
  };
  var G__31142__3 = function(tsym31111, k, not_found) {
    var this__31122 = this;
    var tsym31111__31123 = this;
    var coll__31124 = tsym31111__31123;
    return cljs.core._lookup.call(null, coll__31124, k, not_found)
  };
  G__31142 = function(tsym31111, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31142__2.call(this, tsym31111, k);
      case 3:
        return G__31142__3.call(this, tsym31111, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31142
}();
cljs.core.Subvec.prototype.apply = function(tsym31108, args31109) {
  return tsym31108.call.apply(tsym31108, [tsym31108].concat(cljs.core.aclone.call(null, args31109)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31125 = this;
  return new cljs.core.Subvec(this__31125.meta, cljs.core._assoc_n.call(null, this__31125.v, this__31125.end, o), this__31125.start, this__31125.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__31126 = this;
  var this$__31127 = this;
  return cljs.core.pr_str.call(null, this$__31127)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__31128 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__31129 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31130 = this;
  var subvec_seq__31131 = function subvec_seq(i) {
    if(i === this__31130.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__31130.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__31131.call(null, this__31130.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31132 = this;
  return this__31132.end - this__31132.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31133 = this;
  return cljs.core._nth.call(null, this__31133.v, this__31133.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31134 = this;
  if(this__31134.start === this__31134.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__31134.meta, this__31134.v, this__31134.start, this__31134.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__31135 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31136 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31137 = this;
  return new cljs.core.Subvec(meta, this__31137.v, this__31137.start, this__31137.end, this__31137.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31138 = this;
  return this__31138.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31140 = this;
  return cljs.core._nth.call(null, this__31140.v, this__31140.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31141 = this;
  return cljs.core._nth.call(null, this__31141.v, this__31141.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31139 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__31139.meta)
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
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__31143 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__31143, 0, tl.length);
  return ret__31143
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__31144 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__31145 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__31144, subidx__31145, level === 5 ? tail_node : function() {
    var child__31146 = cljs.core.pv_aget.call(null, ret__31144, subidx__31145);
    if(child__31146 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__31146, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__31144
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__31147 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__31148 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__31149 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__31147, subidx__31148));
    if(function() {
      var and__3822__auto____31150 = new_child__31149 == null;
      if(and__3822__auto____31150) {
        return subidx__31148 === 0
      }else {
        return and__3822__auto____31150
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__31147, subidx__31148, new_child__31149);
      return node__31147
    }
  }else {
    if(subidx__31148 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__31147, subidx__31148, null);
        return node__31147
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____31151 = 0 <= i;
    if(and__3822__auto____31151) {
      return i < tv.cnt
    }else {
      return and__3822__auto____31151
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__31152 = tv.root;
      var node__31153 = root__31152;
      var level__31154 = tv.shift;
      while(true) {
        if(level__31154 > 0) {
          var G__31155 = cljs.core.tv_ensure_editable.call(null, root__31152.edit, cljs.core.pv_aget.call(null, node__31153, i >>> level__31154 & 31));
          var G__31156 = level__31154 - 5;
          node__31153 = G__31155;
          level__31154 = G__31156;
          continue
        }else {
          return node__31153.arr
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
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__31194 = null;
  var G__31194__2 = function(tsym31159, k) {
    var this__31161 = this;
    var tsym31159__31162 = this;
    var coll__31163 = tsym31159__31162;
    return cljs.core._lookup.call(null, coll__31163, k)
  };
  var G__31194__3 = function(tsym31160, k, not_found) {
    var this__31164 = this;
    var tsym31160__31165 = this;
    var coll__31166 = tsym31160__31165;
    return cljs.core._lookup.call(null, coll__31166, k, not_found)
  };
  G__31194 = function(tsym31160, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31194__2.call(this, tsym31160, k);
      case 3:
        return G__31194__3.call(this, tsym31160, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31194
}();
cljs.core.TransientVector.prototype.apply = function(tsym31157, args31158) {
  return tsym31157.call.apply(tsym31157, [tsym31157].concat(cljs.core.aclone.call(null, args31158)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31167 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31168 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__31169 = this;
  if(cljs.core.truth_(this__31169.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__31170 = this;
  if(function() {
    var and__3822__auto____31171 = 0 <= n;
    if(and__3822__auto____31171) {
      return n < this__31170.cnt
    }else {
      return and__3822__auto____31171
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31172 = this;
  if(cljs.core.truth_(this__31172.root.edit)) {
    return this__31172.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__31173 = this;
  if(cljs.core.truth_(this__31173.root.edit)) {
    if(function() {
      var and__3822__auto____31174 = 0 <= n;
      if(and__3822__auto____31174) {
        return n < this__31173.cnt
      }else {
        return and__3822__auto____31174
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__31173.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__31177 = function go(level, node) {
          var node__31175 = cljs.core.tv_ensure_editable.call(null, this__31173.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__31175, n & 31, val);
            return node__31175
          }else {
            var subidx__31176 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__31175, subidx__31176, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__31175, subidx__31176)));
            return node__31175
          }
        }.call(null, this__31173.shift, this__31173.root);
        this__31173.root = new_root__31177;
        return tcoll
      }
    }else {
      if(n === this__31173.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__31173.cnt)].join(""));
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
  var this__31178 = this;
  if(cljs.core.truth_(this__31178.root.edit)) {
    if(this__31178.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__31178.cnt) {
        this__31178.cnt = 0;
        return tcoll
      }else {
        if((this__31178.cnt - 1 & 31) > 0) {
          this__31178.cnt = this__31178.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__31179 = cljs.core.editable_array_for.call(null, tcoll, this__31178.cnt - 2);
            var new_root__31181 = function() {
              var nr__31180 = cljs.core.tv_pop_tail.call(null, tcoll, this__31178.shift, this__31178.root);
              if(nr__31180 != null) {
                return nr__31180
              }else {
                return new cljs.core.VectorNode(this__31178.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____31182 = 5 < this__31178.shift;
              if(and__3822__auto____31182) {
                return cljs.core.pv_aget.call(null, new_root__31181, 1) == null
              }else {
                return and__3822__auto____31182
              }
            }()) {
              var new_root__31183 = cljs.core.tv_ensure_editable.call(null, this__31178.root.edit, cljs.core.pv_aget.call(null, new_root__31181, 0));
              this__31178.root = new_root__31183;
              this__31178.shift = this__31178.shift - 5;
              this__31178.cnt = this__31178.cnt - 1;
              this__31178.tail = new_tail__31179;
              return tcoll
            }else {
              this__31178.root = new_root__31181;
              this__31178.cnt = this__31178.cnt - 1;
              this__31178.tail = new_tail__31179;
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
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__31184 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__31185 = this;
  if(cljs.core.truth_(this__31185.root.edit)) {
    if(this__31185.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__31185.tail[this__31185.cnt & 31] = o;
      this__31185.cnt = this__31185.cnt + 1;
      return tcoll
    }else {
      var tail_node__31186 = new cljs.core.VectorNode(this__31185.root.edit, this__31185.tail);
      var new_tail__31187 = cljs.core.make_array.call(null, 32);
      new_tail__31187[0] = o;
      this__31185.tail = new_tail__31187;
      if(this__31185.cnt >>> 5 > 1 << this__31185.shift) {
        var new_root_array__31188 = cljs.core.make_array.call(null, 32);
        var new_shift__31189 = this__31185.shift + 5;
        new_root_array__31188[0] = this__31185.root;
        new_root_array__31188[1] = cljs.core.new_path.call(null, this__31185.root.edit, this__31185.shift, tail_node__31186);
        this__31185.root = new cljs.core.VectorNode(this__31185.root.edit, new_root_array__31188);
        this__31185.shift = new_shift__31189;
        this__31185.cnt = this__31185.cnt + 1;
        return tcoll
      }else {
        var new_root__31190 = cljs.core.tv_push_tail.call(null, tcoll, this__31185.shift, this__31185.root, tail_node__31186);
        this__31185.root = new_root__31190;
        this__31185.cnt = this__31185.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__31191 = this;
  if(cljs.core.truth_(this__31191.root.edit)) {
    this__31191.root.edit = null;
    var len__31192 = this__31191.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__31193 = cljs.core.make_array.call(null, len__31192);
    cljs.core.array_copy.call(null, this__31191.tail, 0, trimmed_tail__31193, 0, len__31192);
    return new cljs.core.PersistentVector(null, this__31191.cnt, this__31191.shift, this__31191.root, trimmed_tail__31193, null)
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31195 = this;
  var h__364__auto____31196 = this__31195.__hash;
  if(h__364__auto____31196 != null) {
    return h__364__auto____31196
  }else {
    var h__364__auto____31197 = cljs.core.hash_coll.call(null, coll);
    this__31195.__hash = h__364__auto____31197;
    return h__364__auto____31197
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31198 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__31199 = this;
  var this$__31200 = this;
  return cljs.core.pr_str.call(null, this$__31200)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31201 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31202 = this;
  return cljs.core._first.call(null, this__31202.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31203 = this;
  var temp__3971__auto____31204 = cljs.core.next.call(null, this__31203.front);
  if(cljs.core.truth_(temp__3971__auto____31204)) {
    var f1__31205 = temp__3971__auto____31204;
    return new cljs.core.PersistentQueueSeq(this__31203.meta, f1__31205, this__31203.rear, null)
  }else {
    if(this__31203.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__31203.meta, this__31203.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31206 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31207 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__31207.front, this__31207.rear, this__31207.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31208 = this;
  return this__31208.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31209 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__31209.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31210 = this;
  var h__364__auto____31211 = this__31210.__hash;
  if(h__364__auto____31211 != null) {
    return h__364__auto____31211
  }else {
    var h__364__auto____31212 = cljs.core.hash_coll.call(null, coll);
    this__31210.__hash = h__364__auto____31212;
    return h__364__auto____31212
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31213 = this;
  if(cljs.core.truth_(this__31213.front)) {
    return new cljs.core.PersistentQueue(this__31213.meta, this__31213.count + 1, this__31213.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____31214 = this__31213.rear;
      if(cljs.core.truth_(or__3824__auto____31214)) {
        return or__3824__auto____31214
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__31213.meta, this__31213.count + 1, cljs.core.conj.call(null, this__31213.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__31215 = this;
  var this$__31216 = this;
  return cljs.core.pr_str.call(null, this$__31216)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31217 = this;
  var rear__31218 = cljs.core.seq.call(null, this__31217.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____31219 = this__31217.front;
    if(cljs.core.truth_(or__3824__auto____31219)) {
      return or__3824__auto____31219
    }else {
      return rear__31218
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__31217.front, cljs.core.seq.call(null, rear__31218), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31220 = this;
  return this__31220.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__31221 = this;
  return cljs.core._first.call(null, this__31221.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__31222 = this;
  if(cljs.core.truth_(this__31222.front)) {
    var temp__3971__auto____31223 = cljs.core.next.call(null, this__31222.front);
    if(cljs.core.truth_(temp__3971__auto____31223)) {
      var f1__31224 = temp__3971__auto____31223;
      return new cljs.core.PersistentQueue(this__31222.meta, this__31222.count - 1, f1__31224, this__31222.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__31222.meta, this__31222.count - 1, cljs.core.seq.call(null, this__31222.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31225 = this;
  return cljs.core.first.call(null, this__31225.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31226 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31227 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31228 = this;
  return new cljs.core.PersistentQueue(meta, this__31228.count, this__31228.front, this__31228.rear, this__31228.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31229 = this;
  return this__31229.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31230 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__31231 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__31232 = array.length;
  var i__31233 = 0;
  while(true) {
    if(i__31233 < len__31232) {
      if(cljs.core._EQ_.call(null, k, array[i__31233])) {
        return i__31233
      }else {
        var G__31234 = i__31233 + incr;
        i__31233 = G__31234;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____31235 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____31235)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____31235
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__31236 = cljs.core.hash.call(null, a);
  var b__31237 = cljs.core.hash.call(null, b);
  if(a__31236 < b__31237) {
    return-1
  }else {
    if(a__31236 > b__31237) {
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
  var ks__31239 = m.keys;
  var len__31240 = ks__31239.length;
  var so__31241 = m.strobj;
  var out__31242 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__31243 = 0;
  var out__31244 = cljs.core.transient$.call(null, out__31242);
  while(true) {
    if(i__31243 < len__31240) {
      var k__31245 = ks__31239[i__31243];
      var G__31246 = i__31243 + 1;
      var G__31247 = cljs.core.assoc_BANG_.call(null, out__31244, k__31245, so__31241[k__31245]);
      i__31243 = G__31246;
      out__31244 = G__31247;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__31244, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31252 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31253 = this;
  var h__364__auto____31254 = this__31253.__hash;
  if(h__364__auto____31254 != null) {
    return h__364__auto____31254
  }else {
    var h__364__auto____31255 = cljs.core.hash_imap.call(null, coll);
    this__31253.__hash = h__364__auto____31255;
    return h__364__auto____31255
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31256 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31257 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__31257.strobj, this__31257.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31258 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___31259 = this__31258.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___31259)) {
      var new_strobj__31260 = goog.object.clone.call(null, this__31258.strobj);
      new_strobj__31260[k] = v;
      return new cljs.core.ObjMap(this__31258.meta, this__31258.keys, new_strobj__31260, this__31258.update_count + 1, null)
    }else {
      if(this__31258.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__31261 = goog.object.clone.call(null, this__31258.strobj);
        var new_keys__31262 = cljs.core.aclone.call(null, this__31258.keys);
        new_strobj__31261[k] = v;
        new_keys__31262.push(k);
        return new cljs.core.ObjMap(this__31258.meta, new_keys__31262, new_strobj__31261, this__31258.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31263 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__31263.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__31283 = null;
  var G__31283__2 = function(tsym31250, k) {
    var this__31264 = this;
    var tsym31250__31265 = this;
    var coll__31266 = tsym31250__31265;
    return cljs.core._lookup.call(null, coll__31266, k)
  };
  var G__31283__3 = function(tsym31251, k, not_found) {
    var this__31267 = this;
    var tsym31251__31268 = this;
    var coll__31269 = tsym31251__31268;
    return cljs.core._lookup.call(null, coll__31269, k, not_found)
  };
  G__31283 = function(tsym31251, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31283__2.call(this, tsym31251, k);
      case 3:
        return G__31283__3.call(this, tsym31251, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31283
}();
cljs.core.ObjMap.prototype.apply = function(tsym31248, args31249) {
  return tsym31248.call.apply(tsym31248, [tsym31248].concat(cljs.core.aclone.call(null, args31249)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31270 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__31271 = this;
  var this$__31272 = this;
  return cljs.core.pr_str.call(null, this$__31272)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31273 = this;
  if(this__31273.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__31238_SHARP_) {
      return cljs.core.vector.call(null, p1__31238_SHARP_, this__31273.strobj[p1__31238_SHARP_])
    }, this__31273.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31274 = this;
  return this__31274.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31275 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31276 = this;
  return new cljs.core.ObjMap(meta, this__31276.keys, this__31276.strobj, this__31276.update_count, this__31276.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31277 = this;
  return this__31277.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31278 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__31278.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31279 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____31280 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____31280)) {
      return this__31279.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____31280
    }
  }())) {
    var new_keys__31281 = cljs.core.aclone.call(null, this__31279.keys);
    var new_strobj__31282 = goog.object.clone.call(null, this__31279.strobj);
    new_keys__31281.splice(cljs.core.scan_array.call(null, 1, k, new_keys__31281), 1);
    cljs.core.js_delete.call(null, new_strobj__31282, k);
    return new cljs.core.ObjMap(this__31279.meta, new_keys__31281, new_strobj__31282, this__31279.update_count + 1, null)
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
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31289 = this;
  var h__364__auto____31290 = this__31289.__hash;
  if(h__364__auto____31290 != null) {
    return h__364__auto____31290
  }else {
    var h__364__auto____31291 = cljs.core.hash_imap.call(null, coll);
    this__31289.__hash = h__364__auto____31291;
    return h__364__auto____31291
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31292 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31293 = this;
  var bucket__31294 = this__31293.hashobj[cljs.core.hash.call(null, k)];
  var i__31295 = cljs.core.truth_(bucket__31294) ? cljs.core.scan_array.call(null, 2, k, bucket__31294) : null;
  if(cljs.core.truth_(i__31295)) {
    return bucket__31294[i__31295 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31296 = this;
  var h__31297 = cljs.core.hash.call(null, k);
  var bucket__31298 = this__31296.hashobj[h__31297];
  if(cljs.core.truth_(bucket__31298)) {
    var new_bucket__31299 = cljs.core.aclone.call(null, bucket__31298);
    var new_hashobj__31300 = goog.object.clone.call(null, this__31296.hashobj);
    new_hashobj__31300[h__31297] = new_bucket__31299;
    var temp__3971__auto____31301 = cljs.core.scan_array.call(null, 2, k, new_bucket__31299);
    if(cljs.core.truth_(temp__3971__auto____31301)) {
      var i__31302 = temp__3971__auto____31301;
      new_bucket__31299[i__31302 + 1] = v;
      return new cljs.core.HashMap(this__31296.meta, this__31296.count, new_hashobj__31300, null)
    }else {
      new_bucket__31299.push(k, v);
      return new cljs.core.HashMap(this__31296.meta, this__31296.count + 1, new_hashobj__31300, null)
    }
  }else {
    var new_hashobj__31303 = goog.object.clone.call(null, this__31296.hashobj);
    new_hashobj__31303[h__31297] = [k, v];
    return new cljs.core.HashMap(this__31296.meta, this__31296.count + 1, new_hashobj__31303, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31304 = this;
  var bucket__31305 = this__31304.hashobj[cljs.core.hash.call(null, k)];
  var i__31306 = cljs.core.truth_(bucket__31305) ? cljs.core.scan_array.call(null, 2, k, bucket__31305) : null;
  if(cljs.core.truth_(i__31306)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__31329 = null;
  var G__31329__2 = function(tsym31287, k) {
    var this__31307 = this;
    var tsym31287__31308 = this;
    var coll__31309 = tsym31287__31308;
    return cljs.core._lookup.call(null, coll__31309, k)
  };
  var G__31329__3 = function(tsym31288, k, not_found) {
    var this__31310 = this;
    var tsym31288__31311 = this;
    var coll__31312 = tsym31288__31311;
    return cljs.core._lookup.call(null, coll__31312, k, not_found)
  };
  G__31329 = function(tsym31288, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31329__2.call(this, tsym31288, k);
      case 3:
        return G__31329__3.call(this, tsym31288, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31329
}();
cljs.core.HashMap.prototype.apply = function(tsym31285, args31286) {
  return tsym31285.call.apply(tsym31285, [tsym31285].concat(cljs.core.aclone.call(null, args31286)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31313 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__31314 = this;
  var this$__31315 = this;
  return cljs.core.pr_str.call(null, this$__31315)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31316 = this;
  if(this__31316.count > 0) {
    var hashes__31317 = cljs.core.js_keys.call(null, this__31316.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__31284_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__31316.hashobj[p1__31284_SHARP_]))
    }, hashes__31317)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31318 = this;
  return this__31318.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31319 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31320 = this;
  return new cljs.core.HashMap(meta, this__31320.count, this__31320.hashobj, this__31320.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31321 = this;
  return this__31321.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31322 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__31322.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31323 = this;
  var h__31324 = cljs.core.hash.call(null, k);
  var bucket__31325 = this__31323.hashobj[h__31324];
  var i__31326 = cljs.core.truth_(bucket__31325) ? cljs.core.scan_array.call(null, 2, k, bucket__31325) : null;
  if(cljs.core.not.call(null, i__31326)) {
    return coll
  }else {
    var new_hashobj__31327 = goog.object.clone.call(null, this__31323.hashobj);
    if(3 > bucket__31325.length) {
      cljs.core.js_delete.call(null, new_hashobj__31327, h__31324)
    }else {
      var new_bucket__31328 = cljs.core.aclone.call(null, bucket__31325);
      new_bucket__31328.splice(i__31326, 2);
      new_hashobj__31327[h__31324] = new_bucket__31328
    }
    return new cljs.core.HashMap(this__31323.meta, this__31323.count - 1, new_hashobj__31327, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__31330 = ks.length;
  var i__31331 = 0;
  var out__31332 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__31331 < len__31330) {
      var G__31333 = i__31331 + 1;
      var G__31334 = cljs.core.assoc.call(null, out__31332, ks[i__31331], vs[i__31331]);
      i__31331 = G__31333;
      out__31332 = G__31334;
      continue
    }else {
      return out__31332
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__31335 = m.arr;
  var len__31336 = arr__31335.length;
  var i__31337 = 0;
  while(true) {
    if(len__31336 <= i__31337) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__31335[i__31337], k)) {
        return i__31337
      }else {
        if("\ufdd0'else") {
          var G__31338 = i__31337 + 2;
          i__31337 = G__31338;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31343 = this;
  return new cljs.core.TransientArrayMap({}, this__31343.arr.length, cljs.core.aclone.call(null, this__31343.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31344 = this;
  var h__364__auto____31345 = this__31344.__hash;
  if(h__364__auto____31345 != null) {
    return h__364__auto____31345
  }else {
    var h__364__auto____31346 = cljs.core.hash_imap.call(null, coll);
    this__31344.__hash = h__364__auto____31346;
    return h__364__auto____31346
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31347 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31348 = this;
  var idx__31349 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31349 === -1) {
    return not_found
  }else {
    return this__31348.arr[idx__31349 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31350 = this;
  var idx__31351 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31351 === -1) {
    if(this__31350.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__31350.meta, this__31350.cnt + 1, function() {
        var G__31352__31353 = cljs.core.aclone.call(null, this__31350.arr);
        G__31352__31353.push(k);
        G__31352__31353.push(v);
        return G__31352__31353
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__31350.arr[idx__31351 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__31350.meta, this__31350.cnt, function() {
          var G__31354__31355 = cljs.core.aclone.call(null, this__31350.arr);
          G__31354__31355[idx__31351 + 1] = v;
          return G__31354__31355
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31356 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__31386 = null;
  var G__31386__2 = function(tsym31341, k) {
    var this__31357 = this;
    var tsym31341__31358 = this;
    var coll__31359 = tsym31341__31358;
    return cljs.core._lookup.call(null, coll__31359, k)
  };
  var G__31386__3 = function(tsym31342, k, not_found) {
    var this__31360 = this;
    var tsym31342__31361 = this;
    var coll__31362 = tsym31342__31361;
    return cljs.core._lookup.call(null, coll__31362, k, not_found)
  };
  G__31386 = function(tsym31342, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31386__2.call(this, tsym31342, k);
      case 3:
        return G__31386__3.call(this, tsym31342, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31386
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym31339, args31340) {
  return tsym31339.call.apply(tsym31339, [tsym31339].concat(cljs.core.aclone.call(null, args31340)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__31363 = this;
  var len__31364 = this__31363.arr.length;
  var i__31365 = 0;
  var init__31366 = init;
  while(true) {
    if(i__31365 < len__31364) {
      var init__31367 = f.call(null, init__31366, this__31363.arr[i__31365], this__31363.arr[i__31365 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__31367)) {
        return cljs.core.deref.call(null, init__31367)
      }else {
        var G__31387 = i__31365 + 2;
        var G__31388 = init__31367;
        i__31365 = G__31387;
        init__31366 = G__31388;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31368 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__31369 = this;
  var this$__31370 = this;
  return cljs.core.pr_str.call(null, this$__31370)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31371 = this;
  if(this__31371.cnt > 0) {
    var len__31372 = this__31371.arr.length;
    var array_map_seq__31373 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__31372) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__31371.arr[i], this__31371.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__31373.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31374 = this;
  return this__31374.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31375 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31376 = this;
  return new cljs.core.PersistentArrayMap(meta, this__31376.cnt, this__31376.arr, this__31376.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31377 = this;
  return this__31377.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31378 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__31378.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31379 = this;
  var idx__31380 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__31380 >= 0) {
    var len__31381 = this__31379.arr.length;
    var new_len__31382 = len__31381 - 2;
    if(new_len__31382 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__31383 = cljs.core.make_array.call(null, new_len__31382);
      var s__31384 = 0;
      var d__31385 = 0;
      while(true) {
        if(s__31384 >= len__31381) {
          return new cljs.core.PersistentArrayMap(this__31379.meta, this__31379.cnt - 1, new_arr__31383, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__31379.arr[s__31384])) {
            var G__31389 = s__31384 + 2;
            var G__31390 = d__31385;
            s__31384 = G__31389;
            d__31385 = G__31390;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__31383[d__31385] = this__31379.arr[s__31384];
              new_arr__31383[d__31385 + 1] = this__31379.arr[s__31384 + 1];
              var G__31391 = s__31384 + 2;
              var G__31392 = d__31385 + 2;
              s__31384 = G__31391;
              d__31385 = G__31392;
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
  var len__31393 = cljs.core.count.call(null, ks);
  var i__31394 = 0;
  var out__31395 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__31394 < len__31393) {
      var G__31396 = i__31394 + 1;
      var G__31397 = cljs.core.assoc_BANG_.call(null, out__31395, ks[i__31394], vs[i__31394]);
      i__31394 = G__31396;
      out__31395 = G__31397;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__31395)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__31398 = this;
  if(cljs.core.truth_(this__31398.editable_QMARK_)) {
    var idx__31399 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__31399 >= 0) {
      this__31398.arr[idx__31399] = this__31398.arr[this__31398.len - 2];
      this__31398.arr[idx__31399 + 1] = this__31398.arr[this__31398.len - 1];
      var G__31400__31401 = this__31398.arr;
      G__31400__31401.pop();
      G__31400__31401.pop();
      G__31400__31401;
      this__31398.len = this__31398.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__31402 = this;
  if(cljs.core.truth_(this__31402.editable_QMARK_)) {
    var idx__31403 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__31403 === -1) {
      if(this__31402.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__31402.len = this__31402.len + 2;
        this__31402.arr.push(key);
        this__31402.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__31402.len, this__31402.arr), key, val)
      }
    }else {
      if(val === this__31402.arr[idx__31403 + 1]) {
        return tcoll
      }else {
        this__31402.arr[idx__31403 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__31404 = this;
  if(cljs.core.truth_(this__31404.editable_QMARK_)) {
    if(function() {
      var G__31405__31406 = o;
      if(G__31405__31406 != null) {
        if(function() {
          var or__3824__auto____31407 = G__31405__31406.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____31407) {
            return or__3824__auto____31407
          }else {
            return G__31405__31406.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__31405__31406.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31405__31406)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31405__31406)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__31408 = cljs.core.seq.call(null, o);
      var tcoll__31409 = tcoll;
      while(true) {
        var temp__3971__auto____31410 = cljs.core.first.call(null, es__31408);
        if(cljs.core.truth_(temp__3971__auto____31410)) {
          var e__31411 = temp__3971__auto____31410;
          var G__31417 = cljs.core.next.call(null, es__31408);
          var G__31418 = cljs.core._assoc_BANG_.call(null, tcoll__31409, cljs.core.key.call(null, e__31411), cljs.core.val.call(null, e__31411));
          es__31408 = G__31417;
          tcoll__31409 = G__31418;
          continue
        }else {
          return tcoll__31409
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__31412 = this;
  if(cljs.core.truth_(this__31412.editable_QMARK_)) {
    this__31412.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__31412.len, 2), this__31412.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__31413 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__31414 = this;
  if(cljs.core.truth_(this__31414.editable_QMARK_)) {
    var idx__31415 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__31415 === -1) {
      return not_found
    }else {
      return this__31414.arr[idx__31415 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__31416 = this;
  if(cljs.core.truth_(this__31416.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__31416.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__31419 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__31420 = 0;
  while(true) {
    if(i__31420 < len) {
      var G__31421 = cljs.core.assoc_BANG_.call(null, out__31419, arr[i__31420], arr[i__31420 + 1]);
      var G__31422 = i__31420 + 2;
      out__31419 = G__31421;
      i__31420 = G__31422;
      continue
    }else {
      return out__31419
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__31423__31424 = cljs.core.aclone.call(null, arr);
    G__31423__31424[i] = a;
    return G__31423__31424
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__31425__31426 = cljs.core.aclone.call(null, arr);
    G__31425__31426[i] = a;
    G__31425__31426[j] = b;
    return G__31425__31426
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
  var new_arr__31427 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__31427, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__31427, 2 * i, new_arr__31427.length - 2 * i);
  return new_arr__31427
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
    var editable__31428 = inode.ensure_editable(edit);
    editable__31428.arr[i] = a;
    return editable__31428
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__31429 = inode.ensure_editable(edit);
    editable__31429.arr[i] = a;
    editable__31429.arr[j] = b;
    return editable__31429
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
  var len__31430 = arr.length;
  var i__31431 = 0;
  var init__31432 = init;
  while(true) {
    if(i__31431 < len__31430) {
      var init__31435 = function() {
        var k__31433 = arr[i__31431];
        if(k__31433 != null) {
          return f.call(null, init__31432, k__31433, arr[i__31431 + 1])
        }else {
          var node__31434 = arr[i__31431 + 1];
          if(node__31434 != null) {
            return node__31434.kv_reduce(f, init__31432)
          }else {
            return init__31432
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__31435)) {
        return cljs.core.deref.call(null, init__31435)
      }else {
        var G__31436 = i__31431 + 2;
        var G__31437 = init__31435;
        i__31431 = G__31436;
        init__31432 = G__31437;
        continue
      }
    }else {
      return init__31432
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__31438 = this;
  var inode__31439 = this;
  if(this__31438.bitmap === bit) {
    return null
  }else {
    var editable__31440 = inode__31439.ensure_editable(e);
    var earr__31441 = editable__31440.arr;
    var len__31442 = earr__31441.length;
    editable__31440.bitmap = bit ^ editable__31440.bitmap;
    cljs.core.array_copy.call(null, earr__31441, 2 * (i + 1), earr__31441, 2 * i, len__31442 - 2 * (i + 1));
    earr__31441[len__31442 - 2] = null;
    earr__31441[len__31442 - 1] = null;
    return editable__31440
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__31443 = this;
  var inode__31444 = this;
  var bit__31445 = 1 << (hash >>> shift & 31);
  var idx__31446 = cljs.core.bitmap_indexed_node_index.call(null, this__31443.bitmap, bit__31445);
  if((this__31443.bitmap & bit__31445) === 0) {
    var n__31447 = cljs.core.bit_count.call(null, this__31443.bitmap);
    if(2 * n__31447 < this__31443.arr.length) {
      var editable__31448 = inode__31444.ensure_editable(edit);
      var earr__31449 = editable__31448.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__31449, 2 * idx__31446, earr__31449, 2 * (idx__31446 + 1), 2 * (n__31447 - idx__31446));
      earr__31449[2 * idx__31446] = key;
      earr__31449[2 * idx__31446 + 1] = val;
      editable__31448.bitmap = editable__31448.bitmap | bit__31445;
      return editable__31448
    }else {
      if(n__31447 >= 16) {
        var nodes__31450 = cljs.core.make_array.call(null, 32);
        var jdx__31451 = hash >>> shift & 31;
        nodes__31450[jdx__31451] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__31452 = 0;
        var j__31453 = 0;
        while(true) {
          if(i__31452 < 32) {
            if((this__31443.bitmap >>> i__31452 & 1) === 0) {
              var G__31506 = i__31452 + 1;
              var G__31507 = j__31453;
              i__31452 = G__31506;
              j__31453 = G__31507;
              continue
            }else {
              nodes__31450[i__31452] = null != this__31443.arr[j__31453] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__31443.arr[j__31453]), this__31443.arr[j__31453], this__31443.arr[j__31453 + 1], added_leaf_QMARK_) : this__31443.arr[j__31453 + 1];
              var G__31508 = i__31452 + 1;
              var G__31509 = j__31453 + 2;
              i__31452 = G__31508;
              j__31453 = G__31509;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__31447 + 1, nodes__31450)
      }else {
        if("\ufdd0'else") {
          var new_arr__31454 = cljs.core.make_array.call(null, 2 * (n__31447 + 4));
          cljs.core.array_copy.call(null, this__31443.arr, 0, new_arr__31454, 0, 2 * idx__31446);
          new_arr__31454[2 * idx__31446] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__31454[2 * idx__31446 + 1] = val;
          cljs.core.array_copy.call(null, this__31443.arr, 2 * idx__31446, new_arr__31454, 2 * (idx__31446 + 1), 2 * (n__31447 - idx__31446));
          var editable__31455 = inode__31444.ensure_editable(edit);
          editable__31455.arr = new_arr__31454;
          editable__31455.bitmap = editable__31455.bitmap | bit__31445;
          return editable__31455
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__31456 = this__31443.arr[2 * idx__31446];
    var val_or_node__31457 = this__31443.arr[2 * idx__31446 + 1];
    if(null == key_or_nil__31456) {
      var n__31458 = val_or_node__31457.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__31458 === val_or_node__31457) {
        return inode__31444
      }else {
        return cljs.core.edit_and_set.call(null, inode__31444, edit, 2 * idx__31446 + 1, n__31458)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__31456)) {
        if(val === val_or_node__31457) {
          return inode__31444
        }else {
          return cljs.core.edit_and_set.call(null, inode__31444, edit, 2 * idx__31446 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__31444, edit, 2 * idx__31446, null, 2 * idx__31446 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__31456, val_or_node__31457, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__31459 = this;
  var inode__31460 = this;
  return cljs.core.create_inode_seq.call(null, this__31459.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__31461 = this;
  var inode__31462 = this;
  var bit__31463 = 1 << (hash >>> shift & 31);
  if((this__31461.bitmap & bit__31463) === 0) {
    return inode__31462
  }else {
    var idx__31464 = cljs.core.bitmap_indexed_node_index.call(null, this__31461.bitmap, bit__31463);
    var key_or_nil__31465 = this__31461.arr[2 * idx__31464];
    var val_or_node__31466 = this__31461.arr[2 * idx__31464 + 1];
    if(null == key_or_nil__31465) {
      var n__31467 = val_or_node__31466.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__31467 === val_or_node__31466) {
        return inode__31462
      }else {
        if(null != n__31467) {
          return cljs.core.edit_and_set.call(null, inode__31462, edit, 2 * idx__31464 + 1, n__31467)
        }else {
          if(this__31461.bitmap === bit__31463) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__31462.edit_and_remove_pair(edit, bit__31463, idx__31464)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__31465)) {
        removed_leaf_QMARK_[0] = true;
        return inode__31462.edit_and_remove_pair(edit, bit__31463, idx__31464)
      }else {
        if("\ufdd0'else") {
          return inode__31462
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__31468 = this;
  var inode__31469 = this;
  if(e === this__31468.edit) {
    return inode__31469
  }else {
    var n__31470 = cljs.core.bit_count.call(null, this__31468.bitmap);
    var new_arr__31471 = cljs.core.make_array.call(null, n__31470 < 0 ? 4 : 2 * (n__31470 + 1));
    cljs.core.array_copy.call(null, this__31468.arr, 0, new_arr__31471, 0, 2 * n__31470);
    return new cljs.core.BitmapIndexedNode(e, this__31468.bitmap, new_arr__31471)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__31472 = this;
  var inode__31473 = this;
  return cljs.core.inode_kv_reduce.call(null, this__31472.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__31510 = null;
  var G__31510__3 = function(shift, hash, key) {
    var this__31474 = this;
    var inode__31475 = this;
    var bit__31476 = 1 << (hash >>> shift & 31);
    if((this__31474.bitmap & bit__31476) === 0) {
      return null
    }else {
      var idx__31477 = cljs.core.bitmap_indexed_node_index.call(null, this__31474.bitmap, bit__31476);
      var key_or_nil__31478 = this__31474.arr[2 * idx__31477];
      var val_or_node__31479 = this__31474.arr[2 * idx__31477 + 1];
      if(null == key_or_nil__31478) {
        return val_or_node__31479.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__31478)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__31478, val_or_node__31479])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__31510__4 = function(shift, hash, key, not_found) {
    var this__31480 = this;
    var inode__31481 = this;
    var bit__31482 = 1 << (hash >>> shift & 31);
    if((this__31480.bitmap & bit__31482) === 0) {
      return not_found
    }else {
      var idx__31483 = cljs.core.bitmap_indexed_node_index.call(null, this__31480.bitmap, bit__31482);
      var key_or_nil__31484 = this__31480.arr[2 * idx__31483];
      var val_or_node__31485 = this__31480.arr[2 * idx__31483 + 1];
      if(null == key_or_nil__31484) {
        return val_or_node__31485.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__31484)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__31484, val_or_node__31485])
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
  G__31510 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__31510__3.call(this, shift, hash, key);
      case 4:
        return G__31510__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31510
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__31486 = this;
  var inode__31487 = this;
  var bit__31488 = 1 << (hash >>> shift & 31);
  if((this__31486.bitmap & bit__31488) === 0) {
    return inode__31487
  }else {
    var idx__31489 = cljs.core.bitmap_indexed_node_index.call(null, this__31486.bitmap, bit__31488);
    var key_or_nil__31490 = this__31486.arr[2 * idx__31489];
    var val_or_node__31491 = this__31486.arr[2 * idx__31489 + 1];
    if(null == key_or_nil__31490) {
      var n__31492 = val_or_node__31491.inode_without(shift + 5, hash, key);
      if(n__31492 === val_or_node__31491) {
        return inode__31487
      }else {
        if(null != n__31492) {
          return new cljs.core.BitmapIndexedNode(null, this__31486.bitmap, cljs.core.clone_and_set.call(null, this__31486.arr, 2 * idx__31489 + 1, n__31492))
        }else {
          if(this__31486.bitmap === bit__31488) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__31486.bitmap ^ bit__31488, cljs.core.remove_pair.call(null, this__31486.arr, idx__31489))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__31490)) {
        return new cljs.core.BitmapIndexedNode(null, this__31486.bitmap ^ bit__31488, cljs.core.remove_pair.call(null, this__31486.arr, idx__31489))
      }else {
        if("\ufdd0'else") {
          return inode__31487
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__31493 = this;
  var inode__31494 = this;
  var bit__31495 = 1 << (hash >>> shift & 31);
  var idx__31496 = cljs.core.bitmap_indexed_node_index.call(null, this__31493.bitmap, bit__31495);
  if((this__31493.bitmap & bit__31495) === 0) {
    var n__31497 = cljs.core.bit_count.call(null, this__31493.bitmap);
    if(n__31497 >= 16) {
      var nodes__31498 = cljs.core.make_array.call(null, 32);
      var jdx__31499 = hash >>> shift & 31;
      nodes__31498[jdx__31499] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__31500 = 0;
      var j__31501 = 0;
      while(true) {
        if(i__31500 < 32) {
          if((this__31493.bitmap >>> i__31500 & 1) === 0) {
            var G__31511 = i__31500 + 1;
            var G__31512 = j__31501;
            i__31500 = G__31511;
            j__31501 = G__31512;
            continue
          }else {
            nodes__31498[i__31500] = null != this__31493.arr[j__31501] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__31493.arr[j__31501]), this__31493.arr[j__31501], this__31493.arr[j__31501 + 1], added_leaf_QMARK_) : this__31493.arr[j__31501 + 1];
            var G__31513 = i__31500 + 1;
            var G__31514 = j__31501 + 2;
            i__31500 = G__31513;
            j__31501 = G__31514;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__31497 + 1, nodes__31498)
    }else {
      var new_arr__31502 = cljs.core.make_array.call(null, 2 * (n__31497 + 1));
      cljs.core.array_copy.call(null, this__31493.arr, 0, new_arr__31502, 0, 2 * idx__31496);
      new_arr__31502[2 * idx__31496] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__31502[2 * idx__31496 + 1] = val;
      cljs.core.array_copy.call(null, this__31493.arr, 2 * idx__31496, new_arr__31502, 2 * (idx__31496 + 1), 2 * (n__31497 - idx__31496));
      return new cljs.core.BitmapIndexedNode(null, this__31493.bitmap | bit__31495, new_arr__31502)
    }
  }else {
    var key_or_nil__31503 = this__31493.arr[2 * idx__31496];
    var val_or_node__31504 = this__31493.arr[2 * idx__31496 + 1];
    if(null == key_or_nil__31503) {
      var n__31505 = val_or_node__31504.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__31505 === val_or_node__31504) {
        return inode__31494
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__31493.bitmap, cljs.core.clone_and_set.call(null, this__31493.arr, 2 * idx__31496 + 1, n__31505))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__31503)) {
        if(val === val_or_node__31504) {
          return inode__31494
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__31493.bitmap, cljs.core.clone_and_set.call(null, this__31493.arr, 2 * idx__31496 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__31493.bitmap, cljs.core.clone_and_set.call(null, this__31493.arr, 2 * idx__31496, null, 2 * idx__31496 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__31503, val_or_node__31504, hash, key, val)))
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
  var arr__31515 = array_node.arr;
  var len__31516 = 2 * (array_node.cnt - 1);
  var new_arr__31517 = cljs.core.make_array.call(null, len__31516);
  var i__31518 = 0;
  var j__31519 = 1;
  var bitmap__31520 = 0;
  while(true) {
    if(i__31518 < len__31516) {
      if(function() {
        var and__3822__auto____31521 = i__31518 != idx;
        if(and__3822__auto____31521) {
          return null != arr__31515[i__31518]
        }else {
          return and__3822__auto____31521
        }
      }()) {
        new_arr__31517[j__31519] = arr__31515[i__31518];
        var G__31522 = i__31518 + 1;
        var G__31523 = j__31519 + 2;
        var G__31524 = bitmap__31520 | 1 << i__31518;
        i__31518 = G__31522;
        j__31519 = G__31523;
        bitmap__31520 = G__31524;
        continue
      }else {
        var G__31525 = i__31518 + 1;
        var G__31526 = j__31519;
        var G__31527 = bitmap__31520;
        i__31518 = G__31525;
        j__31519 = G__31526;
        bitmap__31520 = G__31527;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__31520, new_arr__31517)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__31528 = this;
  var inode__31529 = this;
  var idx__31530 = hash >>> shift & 31;
  var node__31531 = this__31528.arr[idx__31530];
  if(null == node__31531) {
    return new cljs.core.ArrayNode(null, this__31528.cnt + 1, cljs.core.clone_and_set.call(null, this__31528.arr, idx__31530, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__31532 = node__31531.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__31532 === node__31531) {
      return inode__31529
    }else {
      return new cljs.core.ArrayNode(null, this__31528.cnt, cljs.core.clone_and_set.call(null, this__31528.arr, idx__31530, n__31532))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__31533 = this;
  var inode__31534 = this;
  var idx__31535 = hash >>> shift & 31;
  var node__31536 = this__31533.arr[idx__31535];
  if(null != node__31536) {
    var n__31537 = node__31536.inode_without(shift + 5, hash, key);
    if(n__31537 === node__31536) {
      return inode__31534
    }else {
      if(n__31537 == null) {
        if(this__31533.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__31534, null, idx__31535)
        }else {
          return new cljs.core.ArrayNode(null, this__31533.cnt - 1, cljs.core.clone_and_set.call(null, this__31533.arr, idx__31535, n__31537))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__31533.cnt, cljs.core.clone_and_set.call(null, this__31533.arr, idx__31535, n__31537))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__31534
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__31569 = null;
  var G__31569__3 = function(shift, hash, key) {
    var this__31538 = this;
    var inode__31539 = this;
    var idx__31540 = hash >>> shift & 31;
    var node__31541 = this__31538.arr[idx__31540];
    if(null != node__31541) {
      return node__31541.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__31569__4 = function(shift, hash, key, not_found) {
    var this__31542 = this;
    var inode__31543 = this;
    var idx__31544 = hash >>> shift & 31;
    var node__31545 = this__31542.arr[idx__31544];
    if(null != node__31545) {
      return node__31545.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__31569 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__31569__3.call(this, shift, hash, key);
      case 4:
        return G__31569__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31569
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__31546 = this;
  var inode__31547 = this;
  return cljs.core.create_array_node_seq.call(null, this__31546.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__31548 = this;
  var inode__31549 = this;
  if(e === this__31548.edit) {
    return inode__31549
  }else {
    return new cljs.core.ArrayNode(e, this__31548.cnt, cljs.core.aclone.call(null, this__31548.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__31550 = this;
  var inode__31551 = this;
  var idx__31552 = hash >>> shift & 31;
  var node__31553 = this__31550.arr[idx__31552];
  if(null == node__31553) {
    var editable__31554 = cljs.core.edit_and_set.call(null, inode__31551, edit, idx__31552, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__31554.cnt = editable__31554.cnt + 1;
    return editable__31554
  }else {
    var n__31555 = node__31553.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__31555 === node__31553) {
      return inode__31551
    }else {
      return cljs.core.edit_and_set.call(null, inode__31551, edit, idx__31552, n__31555)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__31556 = this;
  var inode__31557 = this;
  var idx__31558 = hash >>> shift & 31;
  var node__31559 = this__31556.arr[idx__31558];
  if(null == node__31559) {
    return inode__31557
  }else {
    var n__31560 = node__31559.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__31560 === node__31559) {
      return inode__31557
    }else {
      if(null == n__31560) {
        if(this__31556.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__31557, edit, idx__31558)
        }else {
          var editable__31561 = cljs.core.edit_and_set.call(null, inode__31557, edit, idx__31558, n__31560);
          editable__31561.cnt = editable__31561.cnt - 1;
          return editable__31561
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__31557, edit, idx__31558, n__31560)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__31562 = this;
  var inode__31563 = this;
  var len__31564 = this__31562.arr.length;
  var i__31565 = 0;
  var init__31566 = init;
  while(true) {
    if(i__31565 < len__31564) {
      var node__31567 = this__31562.arr[i__31565];
      if(node__31567 != null) {
        var init__31568 = node__31567.kv_reduce(f, init__31566);
        if(cljs.core.reduced_QMARK_.call(null, init__31568)) {
          return cljs.core.deref.call(null, init__31568)
        }else {
          var G__31570 = i__31565 + 1;
          var G__31571 = init__31568;
          i__31565 = G__31570;
          init__31566 = G__31571;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__31566
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__31572 = 2 * cnt;
  var i__31573 = 0;
  while(true) {
    if(i__31573 < lim__31572) {
      if(cljs.core._EQ_.call(null, key, arr[i__31573])) {
        return i__31573
      }else {
        var G__31574 = i__31573 + 2;
        i__31573 = G__31574;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__31575 = this;
  var inode__31576 = this;
  if(hash === this__31575.collision_hash) {
    var idx__31577 = cljs.core.hash_collision_node_find_index.call(null, this__31575.arr, this__31575.cnt, key);
    if(idx__31577 === -1) {
      var len__31578 = this__31575.arr.length;
      var new_arr__31579 = cljs.core.make_array.call(null, len__31578 + 2);
      cljs.core.array_copy.call(null, this__31575.arr, 0, new_arr__31579, 0, len__31578);
      new_arr__31579[len__31578] = key;
      new_arr__31579[len__31578 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__31575.collision_hash, this__31575.cnt + 1, new_arr__31579)
    }else {
      if(cljs.core._EQ_.call(null, this__31575.arr[idx__31577], val)) {
        return inode__31576
      }else {
        return new cljs.core.HashCollisionNode(null, this__31575.collision_hash, this__31575.cnt, cljs.core.clone_and_set.call(null, this__31575.arr, idx__31577 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__31575.collision_hash >>> shift & 31), [null, inode__31576])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__31580 = this;
  var inode__31581 = this;
  var idx__31582 = cljs.core.hash_collision_node_find_index.call(null, this__31580.arr, this__31580.cnt, key);
  if(idx__31582 === -1) {
    return inode__31581
  }else {
    if(this__31580.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__31580.collision_hash, this__31580.cnt - 1, cljs.core.remove_pair.call(null, this__31580.arr, cljs.core.quot.call(null, idx__31582, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__31609 = null;
  var G__31609__3 = function(shift, hash, key) {
    var this__31583 = this;
    var inode__31584 = this;
    var idx__31585 = cljs.core.hash_collision_node_find_index.call(null, this__31583.arr, this__31583.cnt, key);
    if(idx__31585 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__31583.arr[idx__31585])) {
        return cljs.core.PersistentVector.fromArray([this__31583.arr[idx__31585], this__31583.arr[idx__31585 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__31609__4 = function(shift, hash, key, not_found) {
    var this__31586 = this;
    var inode__31587 = this;
    var idx__31588 = cljs.core.hash_collision_node_find_index.call(null, this__31586.arr, this__31586.cnt, key);
    if(idx__31588 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__31586.arr[idx__31588])) {
        return cljs.core.PersistentVector.fromArray([this__31586.arr[idx__31588], this__31586.arr[idx__31588 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__31609 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__31609__3.call(this, shift, hash, key);
      case 4:
        return G__31609__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31609
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__31589 = this;
  var inode__31590 = this;
  return cljs.core.create_inode_seq.call(null, this__31589.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__31610 = null;
  var G__31610__1 = function(e) {
    var this__31591 = this;
    var inode__31592 = this;
    if(e === this__31591.edit) {
      return inode__31592
    }else {
      var new_arr__31593 = cljs.core.make_array.call(null, 2 * (this__31591.cnt + 1));
      cljs.core.array_copy.call(null, this__31591.arr, 0, new_arr__31593, 0, 2 * this__31591.cnt);
      return new cljs.core.HashCollisionNode(e, this__31591.collision_hash, this__31591.cnt, new_arr__31593)
    }
  };
  var G__31610__3 = function(e, count, array) {
    var this__31594 = this;
    var inode__31595 = this;
    if(e === this__31594.edit) {
      this__31594.arr = array;
      this__31594.cnt = count;
      return inode__31595
    }else {
      return new cljs.core.HashCollisionNode(this__31594.edit, this__31594.collision_hash, count, array)
    }
  };
  G__31610 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__31610__1.call(this, e);
      case 3:
        return G__31610__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31610
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__31596 = this;
  var inode__31597 = this;
  if(hash === this__31596.collision_hash) {
    var idx__31598 = cljs.core.hash_collision_node_find_index.call(null, this__31596.arr, this__31596.cnt, key);
    if(idx__31598 === -1) {
      if(this__31596.arr.length > 2 * this__31596.cnt) {
        var editable__31599 = cljs.core.edit_and_set.call(null, inode__31597, edit, 2 * this__31596.cnt, key, 2 * this__31596.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__31599.cnt = editable__31599.cnt + 1;
        return editable__31599
      }else {
        var len__31600 = this__31596.arr.length;
        var new_arr__31601 = cljs.core.make_array.call(null, len__31600 + 2);
        cljs.core.array_copy.call(null, this__31596.arr, 0, new_arr__31601, 0, len__31600);
        new_arr__31601[len__31600] = key;
        new_arr__31601[len__31600 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__31597.ensure_editable(edit, this__31596.cnt + 1, new_arr__31601)
      }
    }else {
      if(this__31596.arr[idx__31598 + 1] === val) {
        return inode__31597
      }else {
        return cljs.core.edit_and_set.call(null, inode__31597, edit, idx__31598 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__31596.collision_hash >>> shift & 31), [null, inode__31597, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__31602 = this;
  var inode__31603 = this;
  var idx__31604 = cljs.core.hash_collision_node_find_index.call(null, this__31602.arr, this__31602.cnt, key);
  if(idx__31604 === -1) {
    return inode__31603
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__31602.cnt === 1) {
      return null
    }else {
      var editable__31605 = inode__31603.ensure_editable(edit);
      var earr__31606 = editable__31605.arr;
      earr__31606[idx__31604] = earr__31606[2 * this__31602.cnt - 2];
      earr__31606[idx__31604 + 1] = earr__31606[2 * this__31602.cnt - 1];
      earr__31606[2 * this__31602.cnt - 1] = null;
      earr__31606[2 * this__31602.cnt - 2] = null;
      editable__31605.cnt = editable__31605.cnt - 1;
      return editable__31605
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__31607 = this;
  var inode__31608 = this;
  return cljs.core.inode_kv_reduce.call(null, this__31607.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__31611 = cljs.core.hash.call(null, key1);
    if(key1hash__31611 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__31611, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___31612 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__31611, key1, val1, added_leaf_QMARK___31612).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___31612)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__31613 = cljs.core.hash.call(null, key1);
    if(key1hash__31613 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__31613, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___31614 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__31613, key1, val1, added_leaf_QMARK___31614).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___31614)
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31615 = this;
  var h__364__auto____31616 = this__31615.__hash;
  if(h__364__auto____31616 != null) {
    return h__364__auto____31616
  }else {
    var h__364__auto____31617 = cljs.core.hash_coll.call(null, coll);
    this__31615.__hash = h__364__auto____31617;
    return h__364__auto____31617
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31618 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__31619 = this;
  var this$__31620 = this;
  return cljs.core.pr_str.call(null, this$__31620)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__31621 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31622 = this;
  if(this__31622.s == null) {
    return cljs.core.PersistentVector.fromArray([this__31622.nodes[this__31622.i], this__31622.nodes[this__31622.i + 1]])
  }else {
    return cljs.core.first.call(null, this__31622.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31623 = this;
  if(this__31623.s == null) {
    return cljs.core.create_inode_seq.call(null, this__31623.nodes, this__31623.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__31623.nodes, this__31623.i, cljs.core.next.call(null, this__31623.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31624 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31625 = this;
  return new cljs.core.NodeSeq(meta, this__31625.nodes, this__31625.i, this__31625.s, this__31625.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31626 = this;
  return this__31626.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31627 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__31627.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__31628 = nodes.length;
      var j__31629 = i;
      while(true) {
        if(j__31629 < len__31628) {
          if(null != nodes[j__31629]) {
            return new cljs.core.NodeSeq(null, nodes, j__31629, null, null)
          }else {
            var temp__3971__auto____31630 = nodes[j__31629 + 1];
            if(cljs.core.truth_(temp__3971__auto____31630)) {
              var node__31631 = temp__3971__auto____31630;
              var temp__3971__auto____31632 = node__31631.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____31632)) {
                var node_seq__31633 = temp__3971__auto____31632;
                return new cljs.core.NodeSeq(null, nodes, j__31629 + 2, node_seq__31633, null)
              }else {
                var G__31634 = j__31629 + 2;
                j__31629 = G__31634;
                continue
              }
            }else {
              var G__31635 = j__31629 + 2;
              j__31629 = G__31635;
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
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31636 = this;
  var h__364__auto____31637 = this__31636.__hash;
  if(h__364__auto____31637 != null) {
    return h__364__auto____31637
  }else {
    var h__364__auto____31638 = cljs.core.hash_coll.call(null, coll);
    this__31636.__hash = h__364__auto____31638;
    return h__364__auto____31638
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31639 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__31640 = this;
  var this$__31641 = this;
  return cljs.core.pr_str.call(null, this$__31641)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__31642 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__31643 = this;
  return cljs.core.first.call(null, this__31643.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__31644 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__31644.nodes, this__31644.i, cljs.core.next.call(null, this__31644.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31645 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31646 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__31646.nodes, this__31646.i, this__31646.s, this__31646.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31647 = this;
  return this__31647.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31648 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__31648.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__31649 = nodes.length;
      var j__31650 = i;
      while(true) {
        if(j__31650 < len__31649) {
          var temp__3971__auto____31651 = nodes[j__31650];
          if(cljs.core.truth_(temp__3971__auto____31651)) {
            var nj__31652 = temp__3971__auto____31651;
            var temp__3971__auto____31653 = nj__31652.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____31653)) {
              var ns__31654 = temp__3971__auto____31653;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__31650 + 1, ns__31654, null)
            }else {
              var G__31655 = j__31650 + 1;
              j__31650 = G__31655;
              continue
            }
          }else {
            var G__31656 = j__31650 + 1;
            j__31650 = G__31656;
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
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31661 = this;
  return new cljs.core.TransientHashMap({}, this__31661.root, this__31661.cnt, this__31661.has_nil_QMARK_, this__31661.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31662 = this;
  var h__364__auto____31663 = this__31662.__hash;
  if(h__364__auto____31663 != null) {
    return h__364__auto____31663
  }else {
    var h__364__auto____31664 = cljs.core.hash_imap.call(null, coll);
    this__31662.__hash = h__364__auto____31664;
    return h__364__auto____31664
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31665 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31666 = this;
  if(k == null) {
    if(cljs.core.truth_(this__31666.has_nil_QMARK_)) {
      return this__31666.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__31666.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__31666.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31667 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____31668 = this__31667.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____31668)) {
        return v === this__31667.nil_val
      }else {
        return and__3822__auto____31668
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__31667.meta, cljs.core.truth_(this__31667.has_nil_QMARK_) ? this__31667.cnt : this__31667.cnt + 1, this__31667.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___31669 = [false];
    var new_root__31670 = (this__31667.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__31667.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___31669);
    if(new_root__31670 === this__31667.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__31667.meta, cljs.core.truth_(added_leaf_QMARK___31669[0]) ? this__31667.cnt + 1 : this__31667.cnt, new_root__31670, this__31667.has_nil_QMARK_, this__31667.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31671 = this;
  if(k == null) {
    return this__31671.has_nil_QMARK_
  }else {
    if(this__31671.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__31671.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__31692 = null;
  var G__31692__2 = function(tsym31659, k) {
    var this__31672 = this;
    var tsym31659__31673 = this;
    var coll__31674 = tsym31659__31673;
    return cljs.core._lookup.call(null, coll__31674, k)
  };
  var G__31692__3 = function(tsym31660, k, not_found) {
    var this__31675 = this;
    var tsym31660__31676 = this;
    var coll__31677 = tsym31660__31676;
    return cljs.core._lookup.call(null, coll__31677, k, not_found)
  };
  G__31692 = function(tsym31660, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31692__2.call(this, tsym31660, k);
      case 3:
        return G__31692__3.call(this, tsym31660, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31692
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym31657, args31658) {
  return tsym31657.call.apply(tsym31657, [tsym31657].concat(cljs.core.aclone.call(null, args31658)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__31678 = this;
  var init__31679 = cljs.core.truth_(this__31678.has_nil_QMARK_) ? f.call(null, init, null, this__31678.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__31679)) {
    return cljs.core.deref.call(null, init__31679)
  }else {
    if(null != this__31678.root) {
      return this__31678.root.kv_reduce(f, init__31679)
    }else {
      if("\ufdd0'else") {
        return init__31679
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31680 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__31681 = this;
  var this$__31682 = this;
  return cljs.core.pr_str.call(null, this$__31682)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31683 = this;
  if(this__31683.cnt > 0) {
    var s__31684 = null != this__31683.root ? this__31683.root.inode_seq() : null;
    if(cljs.core.truth_(this__31683.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__31683.nil_val]), s__31684)
    }else {
      return s__31684
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31685 = this;
  return this__31685.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31686 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31687 = this;
  return new cljs.core.PersistentHashMap(meta, this__31687.cnt, this__31687.root, this__31687.has_nil_QMARK_, this__31687.nil_val, this__31687.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31688 = this;
  return this__31688.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31689 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__31689.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31690 = this;
  if(k == null) {
    if(cljs.core.truth_(this__31690.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__31690.meta, this__31690.cnt - 1, this__31690.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__31690.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__31691 = this__31690.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__31691 === this__31690.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__31690.meta, this__31690.cnt - 1, new_root__31691, this__31690.has_nil_QMARK_, this__31690.nil_val, null)
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
  var len__31693 = ks.length;
  var i__31694 = 0;
  var out__31695 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__31694 < len__31693) {
      var G__31696 = i__31694 + 1;
      var G__31697 = cljs.core.assoc_BANG_.call(null, out__31695, ks[i__31694], vs[i__31694]);
      i__31694 = G__31696;
      out__31695 = G__31697;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__31695)
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
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__31698 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__31699 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__31700 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__31701 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__31702 = this;
  if(k == null) {
    if(cljs.core.truth_(this__31702.has_nil_QMARK_)) {
      return this__31702.nil_val
    }else {
      return null
    }
  }else {
    if(this__31702.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__31702.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__31703 = this;
  if(k == null) {
    if(cljs.core.truth_(this__31703.has_nil_QMARK_)) {
      return this__31703.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__31703.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__31703.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31704 = this;
  if(cljs.core.truth_(this__31704.edit)) {
    return this__31704.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__31705 = this;
  var tcoll__31706 = this;
  if(cljs.core.truth_(this__31705.edit)) {
    if(function() {
      var G__31707__31708 = o;
      if(G__31707__31708 != null) {
        if(function() {
          var or__3824__auto____31709 = G__31707__31708.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____31709) {
            return or__3824__auto____31709
          }else {
            return G__31707__31708.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__31707__31708.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31707__31708)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__31707__31708)
      }
    }()) {
      return tcoll__31706.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__31710 = cljs.core.seq.call(null, o);
      var tcoll__31711 = tcoll__31706;
      while(true) {
        var temp__3971__auto____31712 = cljs.core.first.call(null, es__31710);
        if(cljs.core.truth_(temp__3971__auto____31712)) {
          var e__31713 = temp__3971__auto____31712;
          var G__31724 = cljs.core.next.call(null, es__31710);
          var G__31725 = tcoll__31711.assoc_BANG_(cljs.core.key.call(null, e__31713), cljs.core.val.call(null, e__31713));
          es__31710 = G__31724;
          tcoll__31711 = G__31725;
          continue
        }else {
          return tcoll__31711
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__31714 = this;
  var tcoll__31715 = this;
  if(cljs.core.truth_(this__31714.edit)) {
    if(k == null) {
      if(this__31714.nil_val === v) {
      }else {
        this__31714.nil_val = v
      }
      if(cljs.core.truth_(this__31714.has_nil_QMARK_)) {
      }else {
        this__31714.count = this__31714.count + 1;
        this__31714.has_nil_QMARK_ = true
      }
      return tcoll__31715
    }else {
      var added_leaf_QMARK___31716 = [false];
      var node__31717 = (this__31714.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__31714.root).inode_assoc_BANG_(this__31714.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___31716);
      if(node__31717 === this__31714.root) {
      }else {
        this__31714.root = node__31717
      }
      if(cljs.core.truth_(added_leaf_QMARK___31716[0])) {
        this__31714.count = this__31714.count + 1
      }else {
      }
      return tcoll__31715
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__31718 = this;
  var tcoll__31719 = this;
  if(cljs.core.truth_(this__31718.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__31718.has_nil_QMARK_)) {
        this__31718.has_nil_QMARK_ = false;
        this__31718.nil_val = null;
        this__31718.count = this__31718.count - 1;
        return tcoll__31719
      }else {
        return tcoll__31719
      }
    }else {
      if(this__31718.root == null) {
        return tcoll__31719
      }else {
        var removed_leaf_QMARK___31720 = [false];
        var node__31721 = this__31718.root.inode_without_BANG_(this__31718.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___31720);
        if(node__31721 === this__31718.root) {
        }else {
          this__31718.root = node__31721
        }
        if(cljs.core.truth_(removed_leaf_QMARK___31720[0])) {
          this__31718.count = this__31718.count - 1
        }else {
        }
        return tcoll__31719
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__31722 = this;
  var tcoll__31723 = this;
  if(cljs.core.truth_(this__31722.edit)) {
    this__31722.edit = null;
    return new cljs.core.PersistentHashMap(null, this__31722.count, this__31722.root, this__31722.has_nil_QMARK_, this__31722.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__31726 = node;
  var stack__31727 = stack;
  while(true) {
    if(t__31726 != null) {
      var G__31728 = cljs.core.truth_(ascending_QMARK_) ? t__31726.left : t__31726.right;
      var G__31729 = cljs.core.conj.call(null, stack__31727, t__31726);
      t__31726 = G__31728;
      stack__31727 = G__31729;
      continue
    }else {
      return stack__31727
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
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31730 = this;
  var h__364__auto____31731 = this__31730.__hash;
  if(h__364__auto____31731 != null) {
    return h__364__auto____31731
  }else {
    var h__364__auto____31732 = cljs.core.hash_coll.call(null, coll);
    this__31730.__hash = h__364__auto____31732;
    return h__364__auto____31732
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31733 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__31734 = this;
  var this$__31735 = this;
  return cljs.core.pr_str.call(null, this$__31735)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__31736 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31737 = this;
  if(this__31737.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__31737.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__31738 = this;
  return cljs.core.peek.call(null, this__31738.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__31739 = this;
  var t__31740 = cljs.core.peek.call(null, this__31739.stack);
  var next_stack__31741 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__31739.ascending_QMARK_) ? t__31740.right : t__31740.left, cljs.core.pop.call(null, this__31739.stack), this__31739.ascending_QMARK_);
  if(next_stack__31741 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__31741, this__31739.ascending_QMARK_, this__31739.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31742 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31743 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__31743.stack, this__31743.ascending_QMARK_, this__31743.cnt, this__31743.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31744 = this;
  return this__31744.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
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
        var and__3822__auto____31745 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____31745) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____31745
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
        var and__3822__auto____31746 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____31746) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____31746
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
  var init__31747 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__31747)) {
    return cljs.core.deref.call(null, init__31747)
  }else {
    var init__31748 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__31747) : init__31747;
    if(cljs.core.reduced_QMARK_.call(null, init__31748)) {
      return cljs.core.deref.call(null, init__31748)
    }else {
      var init__31749 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__31748) : init__31748;
      if(cljs.core.reduced_QMARK_.call(null, init__31749)) {
        return cljs.core.deref.call(null, init__31749)
      }else {
        return init__31749
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
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31754 = this;
  var h__364__auto____31755 = this__31754.__hash;
  if(h__364__auto____31755 != null) {
    return h__364__auto____31755
  }else {
    var h__364__auto____31756 = cljs.core.hash_coll.call(null, coll);
    this__31754.__hash = h__364__auto____31756;
    return h__364__auto____31756
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__31757 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__31758 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__31759 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__31759.key, this__31759.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__31806 = null;
  var G__31806__2 = function(tsym31752, k) {
    var this__31760 = this;
    var tsym31752__31761 = this;
    var node__31762 = tsym31752__31761;
    return cljs.core._lookup.call(null, node__31762, k)
  };
  var G__31806__3 = function(tsym31753, k, not_found) {
    var this__31763 = this;
    var tsym31753__31764 = this;
    var node__31765 = tsym31753__31764;
    return cljs.core._lookup.call(null, node__31765, k, not_found)
  };
  G__31806 = function(tsym31753, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31806__2.call(this, tsym31753, k);
      case 3:
        return G__31806__3.call(this, tsym31753, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31806
}();
cljs.core.BlackNode.prototype.apply = function(tsym31750, args31751) {
  return tsym31750.call.apply(tsym31750, [tsym31750].concat(cljs.core.aclone.call(null, args31751)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__31766 = this;
  return cljs.core.PersistentVector.fromArray([this__31766.key, this__31766.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__31767 = this;
  return this__31767.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__31768 = this;
  return this__31768.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__31769 = this;
  var node__31770 = this;
  return ins.balance_right(node__31770)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__31771 = this;
  var node__31772 = this;
  return new cljs.core.RedNode(this__31771.key, this__31771.val, this__31771.left, this__31771.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__31773 = this;
  var node__31774 = this;
  return cljs.core.balance_right_del.call(null, this__31773.key, this__31773.val, this__31773.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__31775 = this;
  var node__31776 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__31777 = this;
  var node__31778 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__31778, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__31779 = this;
  var node__31780 = this;
  return cljs.core.balance_left_del.call(null, this__31779.key, this__31779.val, del, this__31779.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__31781 = this;
  var node__31782 = this;
  return ins.balance_left(node__31782)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__31783 = this;
  var node__31784 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__31784, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__31807 = null;
  var G__31807__0 = function() {
    var this__31787 = this;
    var this$__31788 = this;
    return cljs.core.pr_str.call(null, this$__31788)
  };
  G__31807 = function() {
    switch(arguments.length) {
      case 0:
        return G__31807__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31807
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__31789 = this;
  var node__31790 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__31790, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__31791 = this;
  var node__31792 = this;
  return node__31792
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__31793 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__31794 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__31795 = this;
  return cljs.core.list.call(null, this__31795.key, this__31795.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__31797 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__31798 = this;
  return this__31798.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__31799 = this;
  return cljs.core.PersistentVector.fromArray([this__31799.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__31800 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__31800.key, this__31800.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31801 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__31802 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__31802.key, this__31802.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__31803 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__31804 = this;
  if(n === 0) {
    return this__31804.key
  }else {
    if(n === 1) {
      return this__31804.val
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
  var this__31805 = this;
  if(n === 0) {
    return this__31805.key
  }else {
    if(n === 1) {
      return this__31805.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__31796 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31812 = this;
  var h__364__auto____31813 = this__31812.__hash;
  if(h__364__auto____31813 != null) {
    return h__364__auto____31813
  }else {
    var h__364__auto____31814 = cljs.core.hash_coll.call(null, coll);
    this__31812.__hash = h__364__auto____31814;
    return h__364__auto____31814
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__31815 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__31816 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__31817 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__31817.key, this__31817.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__31864 = null;
  var G__31864__2 = function(tsym31810, k) {
    var this__31818 = this;
    var tsym31810__31819 = this;
    var node__31820 = tsym31810__31819;
    return cljs.core._lookup.call(null, node__31820, k)
  };
  var G__31864__3 = function(tsym31811, k, not_found) {
    var this__31821 = this;
    var tsym31811__31822 = this;
    var node__31823 = tsym31811__31822;
    return cljs.core._lookup.call(null, node__31823, k, not_found)
  };
  G__31864 = function(tsym31811, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31864__2.call(this, tsym31811, k);
      case 3:
        return G__31864__3.call(this, tsym31811, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31864
}();
cljs.core.RedNode.prototype.apply = function(tsym31808, args31809) {
  return tsym31808.call.apply(tsym31808, [tsym31808].concat(cljs.core.aclone.call(null, args31809)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__31824 = this;
  return cljs.core.PersistentVector.fromArray([this__31824.key, this__31824.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__31825 = this;
  return this__31825.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__31826 = this;
  return this__31826.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__31827 = this;
  var node__31828 = this;
  return new cljs.core.RedNode(this__31827.key, this__31827.val, this__31827.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__31829 = this;
  var node__31830 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__31831 = this;
  var node__31832 = this;
  return new cljs.core.RedNode(this__31831.key, this__31831.val, this__31831.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__31833 = this;
  var node__31834 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__31835 = this;
  var node__31836 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__31836, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__31837 = this;
  var node__31838 = this;
  return new cljs.core.RedNode(this__31837.key, this__31837.val, del, this__31837.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__31839 = this;
  var node__31840 = this;
  return new cljs.core.RedNode(this__31839.key, this__31839.val, ins, this__31839.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__31841 = this;
  var node__31842 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__31841.left)) {
    return new cljs.core.RedNode(this__31841.key, this__31841.val, this__31841.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__31841.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__31841.right)) {
      return new cljs.core.RedNode(this__31841.right.key, this__31841.right.val, new cljs.core.BlackNode(this__31841.key, this__31841.val, this__31841.left, this__31841.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__31841.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__31842, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__31865 = null;
  var G__31865__0 = function() {
    var this__31845 = this;
    var this$__31846 = this;
    return cljs.core.pr_str.call(null, this$__31846)
  };
  G__31865 = function() {
    switch(arguments.length) {
      case 0:
        return G__31865__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31865
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__31847 = this;
  var node__31848 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__31847.right)) {
    return new cljs.core.RedNode(this__31847.key, this__31847.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__31847.left, null), this__31847.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__31847.left)) {
      return new cljs.core.RedNode(this__31847.left.key, this__31847.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__31847.left.left, null), new cljs.core.BlackNode(this__31847.key, this__31847.val, this__31847.left.right, this__31847.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__31848, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__31849 = this;
  var node__31850 = this;
  return new cljs.core.BlackNode(this__31849.key, this__31849.val, this__31849.left, this__31849.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__31851 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__31852 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__31853 = this;
  return cljs.core.list.call(null, this__31853.key, this__31853.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__31855 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__31856 = this;
  return this__31856.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__31857 = this;
  return cljs.core.PersistentVector.fromArray([this__31857.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__31858 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__31858.key, this__31858.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31859 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__31860 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__31860.key, this__31860.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__31861 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__31862 = this;
  if(n === 0) {
    return this__31862.key
  }else {
    if(n === 1) {
      return this__31862.val
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
  var this__31863 = this;
  if(n === 0) {
    return this__31863.key
  }else {
    if(n === 1) {
      return this__31863.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__31854 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__31866 = comp.call(null, k, tree.key);
    if(c__31866 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__31866 < 0) {
        var ins__31867 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__31867 != null) {
          return tree.add_left(ins__31867)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__31868 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__31868 != null) {
            return tree.add_right(ins__31868)
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
          var app__31869 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__31869)) {
            return new cljs.core.RedNode(app__31869.key, app__31869.val, new cljs.core.RedNode(left.key, left.val, left.left, app__31869.left), new cljs.core.RedNode(right.key, right.val, app__31869.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__31869, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__31870 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__31870)) {
              return new cljs.core.RedNode(app__31870.key, app__31870.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__31870.left, null), new cljs.core.BlackNode(right.key, right.val, app__31870.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__31870, right.right, null))
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
  if(tree != null) {
    var c__31871 = comp.call(null, k, tree.key);
    if(c__31871 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__31871 < 0) {
        var del__31872 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____31873 = del__31872 != null;
          if(or__3824__auto____31873) {
            return or__3824__auto____31873
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__31872, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__31872, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__31874 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____31875 = del__31874 != null;
            if(or__3824__auto____31875) {
              return or__3824__auto____31875
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__31874)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__31874, null)
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
  var tk__31876 = tree.key;
  var c__31877 = comp.call(null, k, tk__31876);
  if(c__31877 === 0) {
    return tree.replace(tk__31876, v, tree.left, tree.right)
  }else {
    if(c__31877 < 0) {
      return tree.replace(tk__31876, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__31876, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31882 = this;
  var h__364__auto____31883 = this__31882.__hash;
  if(h__364__auto____31883 != null) {
    return h__364__auto____31883
  }else {
    var h__364__auto____31884 = cljs.core.hash_imap.call(null, coll);
    this__31882.__hash = h__364__auto____31884;
    return h__364__auto____31884
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__31885 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__31886 = this;
  var n__31887 = coll.entry_at(k);
  if(n__31887 != null) {
    return n__31887.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__31888 = this;
  var found__31889 = [null];
  var t__31890 = cljs.core.tree_map_add.call(null, this__31888.comp, this__31888.tree, k, v, found__31889);
  if(t__31890 == null) {
    var found_node__31891 = cljs.core.nth.call(null, found__31889, 0);
    if(cljs.core._EQ_.call(null, v, found_node__31891.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__31888.comp, cljs.core.tree_map_replace.call(null, this__31888.comp, this__31888.tree, k, v), this__31888.cnt, this__31888.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__31888.comp, t__31890.blacken(), this__31888.cnt + 1, this__31888.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__31892 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__31924 = null;
  var G__31924__2 = function(tsym31880, k) {
    var this__31893 = this;
    var tsym31880__31894 = this;
    var coll__31895 = tsym31880__31894;
    return cljs.core._lookup.call(null, coll__31895, k)
  };
  var G__31924__3 = function(tsym31881, k, not_found) {
    var this__31896 = this;
    var tsym31881__31897 = this;
    var coll__31898 = tsym31881__31897;
    return cljs.core._lookup.call(null, coll__31898, k, not_found)
  };
  G__31924 = function(tsym31881, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31924__2.call(this, tsym31881, k);
      case 3:
        return G__31924__3.call(this, tsym31881, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31924
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym31878, args31879) {
  return tsym31878.call.apply(tsym31878, [tsym31878].concat(cljs.core.aclone.call(null, args31879)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__31899 = this;
  if(this__31899.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__31899.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__31900 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__31901 = this;
  if(this__31901.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__31901.tree, false, this__31901.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__31902 = this;
  var this$__31903 = this;
  return cljs.core.pr_str.call(null, this$__31903)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__31904 = this;
  var coll__31905 = this;
  var t__31906 = this__31904.tree;
  while(true) {
    if(t__31906 != null) {
      var c__31907 = this__31904.comp.call(null, k, t__31906.key);
      if(c__31907 === 0) {
        return t__31906
      }else {
        if(c__31907 < 0) {
          var G__31925 = t__31906.left;
          t__31906 = G__31925;
          continue
        }else {
          if("\ufdd0'else") {
            var G__31926 = t__31906.right;
            t__31906 = G__31926;
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
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__31908 = this;
  if(this__31908.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__31908.tree, ascending_QMARK_, this__31908.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__31909 = this;
  if(this__31909.cnt > 0) {
    var stack__31910 = null;
    var t__31911 = this__31909.tree;
    while(true) {
      if(t__31911 != null) {
        var c__31912 = this__31909.comp.call(null, k, t__31911.key);
        if(c__31912 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__31910, t__31911), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__31912 < 0) {
              var G__31927 = cljs.core.conj.call(null, stack__31910, t__31911);
              var G__31928 = t__31911.left;
              stack__31910 = G__31927;
              t__31911 = G__31928;
              continue
            }else {
              var G__31929 = stack__31910;
              var G__31930 = t__31911.right;
              stack__31910 = G__31929;
              t__31911 = G__31930;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__31912 > 0) {
                var G__31931 = cljs.core.conj.call(null, stack__31910, t__31911);
                var G__31932 = t__31911.right;
                stack__31910 = G__31931;
                t__31911 = G__31932;
                continue
              }else {
                var G__31933 = stack__31910;
                var G__31934 = t__31911.left;
                stack__31910 = G__31933;
                t__31911 = G__31934;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__31910 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__31910, ascending_QMARK_, -1)
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
  var this__31913 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__31914 = this;
  return this__31914.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31915 = this;
  if(this__31915.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__31915.tree, true, this__31915.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31916 = this;
  return this__31916.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31917 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31918 = this;
  return new cljs.core.PersistentTreeMap(this__31918.comp, this__31918.tree, this__31918.cnt, meta, this__31918.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31922 = this;
  return this__31922.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31923 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__31923.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__31919 = this;
  var found__31920 = [null];
  var t__31921 = cljs.core.tree_map_remove.call(null, this__31919.comp, this__31919.tree, k, found__31920);
  if(t__31921 == null) {
    if(cljs.core.nth.call(null, found__31920, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__31919.comp, null, 0, this__31919.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__31919.comp, t__31921.blacken(), this__31919.cnt - 1, this__31919.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__31935 = cljs.core.seq.call(null, keyvals);
    var out__31936 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__31935)) {
        var G__31937 = cljs.core.nnext.call(null, in$__31935);
        var G__31938 = cljs.core.assoc_BANG_.call(null, out__31936, cljs.core.first.call(null, in$__31935), cljs.core.second.call(null, in$__31935));
        in$__31935 = G__31937;
        out__31936 = G__31938;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__31936)
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
  hash_map.cljs$lang$applyTo = function(arglist__31939) {
    var keyvals = cljs.core.seq(arglist__31939);
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
  array_map.cljs$lang$applyTo = function(arglist__31940) {
    var keyvals = cljs.core.seq(arglist__31940);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__31941 = cljs.core.seq.call(null, keyvals);
    var out__31942 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__31941)) {
        var G__31943 = cljs.core.nnext.call(null, in$__31941);
        var G__31944 = cljs.core.assoc.call(null, out__31942, cljs.core.first.call(null, in$__31941), cljs.core.second.call(null, in$__31941));
        in$__31941 = G__31943;
        out__31942 = G__31944;
        continue
      }else {
        return out__31942
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
  sorted_map.cljs$lang$applyTo = function(arglist__31945) {
    var keyvals = cljs.core.seq(arglist__31945);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__31946 = cljs.core.seq.call(null, keyvals);
    var out__31947 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__31946)) {
        var G__31948 = cljs.core.nnext.call(null, in$__31946);
        var G__31949 = cljs.core.assoc.call(null, out__31947, cljs.core.first.call(null, in$__31946), cljs.core.second.call(null, in$__31946));
        in$__31946 = G__31948;
        out__31947 = G__31949;
        continue
      }else {
        return out__31947
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__31950) {
    var comparator = cljs.core.first(arglist__31950);
    var keyvals = cljs.core.rest(arglist__31950);
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
      return cljs.core.reduce.call(null, function(p1__31951_SHARP_, p2__31952_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____31953 = p1__31951_SHARP_;
          if(cljs.core.truth_(or__3824__auto____31953)) {
            return or__3824__auto____31953
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__31952_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__31954) {
    var maps = cljs.core.seq(arglist__31954);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__31957 = function(m, e) {
        var k__31955 = cljs.core.first.call(null, e);
        var v__31956 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__31955)) {
          return cljs.core.assoc.call(null, m, k__31955, f.call(null, cljs.core.get.call(null, m, k__31955), v__31956))
        }else {
          return cljs.core.assoc.call(null, m, k__31955, v__31956)
        }
      };
      var merge2__31959 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__31957, function() {
          var or__3824__auto____31958 = m1;
          if(cljs.core.truth_(or__3824__auto____31958)) {
            return or__3824__auto____31958
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__31959, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__31960) {
    var f = cljs.core.first(arglist__31960);
    var maps = cljs.core.rest(arglist__31960);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__31961 = cljs.core.ObjMap.fromObject([], {});
  var keys__31962 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__31962)) {
      var key__31963 = cljs.core.first.call(null, keys__31962);
      var entry__31964 = cljs.core.get.call(null, map, key__31963, "\ufdd0'user/not-found");
      var G__31965 = cljs.core.not_EQ_.call(null, entry__31964, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__31961, key__31963, entry__31964) : ret__31961;
      var G__31966 = cljs.core.next.call(null, keys__31962);
      ret__31961 = G__31965;
      keys__31962 = G__31966;
      continue
    }else {
      return ret__31961
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__31972 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__31972.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__31973 = this;
  var h__364__auto____31974 = this__31973.__hash;
  if(h__364__auto____31974 != null) {
    return h__364__auto____31974
  }else {
    var h__364__auto____31975 = cljs.core.hash_iset.call(null, coll);
    this__31973.__hash = h__364__auto____31975;
    return h__364__auto____31975
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__31976 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__31977 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__31977.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__31996 = null;
  var G__31996__2 = function(tsym31970, k) {
    var this__31978 = this;
    var tsym31970__31979 = this;
    var coll__31980 = tsym31970__31979;
    return cljs.core._lookup.call(null, coll__31980, k)
  };
  var G__31996__3 = function(tsym31971, k, not_found) {
    var this__31981 = this;
    var tsym31971__31982 = this;
    var coll__31983 = tsym31971__31982;
    return cljs.core._lookup.call(null, coll__31983, k, not_found)
  };
  G__31996 = function(tsym31971, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__31996__2.call(this, tsym31971, k);
      case 3:
        return G__31996__3.call(this, tsym31971, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__31996
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym31968, args31969) {
  return tsym31968.call.apply(tsym31968, [tsym31968].concat(cljs.core.aclone.call(null, args31969)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__31984 = this;
  return new cljs.core.PersistentHashSet(this__31984.meta, cljs.core.assoc.call(null, this__31984.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__31985 = this;
  var this$__31986 = this;
  return cljs.core.pr_str.call(null, this$__31986)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__31987 = this;
  return cljs.core.keys.call(null, this__31987.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__31988 = this;
  return new cljs.core.PersistentHashSet(this__31988.meta, cljs.core.dissoc.call(null, this__31988.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__31989 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__31990 = this;
  var and__3822__auto____31991 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____31991) {
    var and__3822__auto____31992 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____31992) {
      return cljs.core.every_QMARK_.call(null, function(p1__31967_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__31967_SHARP_)
      }, other)
    }else {
      return and__3822__auto____31992
    }
  }else {
    return and__3822__auto____31991
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__31993 = this;
  return new cljs.core.PersistentHashSet(meta, this__31993.hash_map, this__31993.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__31994 = this;
  return this__31994.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__31995 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__31995.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__32014 = null;
  var G__32014__2 = function(tsym32000, k) {
    var this__32002 = this;
    var tsym32000__32003 = this;
    var tcoll__32004 = tsym32000__32003;
    if(cljs.core._lookup.call(null, this__32002.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__32014__3 = function(tsym32001, k, not_found) {
    var this__32005 = this;
    var tsym32001__32006 = this;
    var tcoll__32007 = tsym32001__32006;
    if(cljs.core._lookup.call(null, this__32005.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__32014 = function(tsym32001, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32014__2.call(this, tsym32001, k);
      case 3:
        return G__32014__3.call(this, tsym32001, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32014
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym31998, args31999) {
  return tsym31998.call.apply(tsym31998, [tsym31998].concat(cljs.core.aclone.call(null, args31999)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__32008 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__32009 = this;
  if(cljs.core._lookup.call(null, this__32009.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__32010 = this;
  return cljs.core.count.call(null, this__32010.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__32011 = this;
  this__32011.transient_map = cljs.core.dissoc_BANG_.call(null, this__32011.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__32012 = this;
  this__32012.transient_map = cljs.core.assoc_BANG_.call(null, this__32012.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__32013 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__32013.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__32019 = this;
  var h__364__auto____32020 = this__32019.__hash;
  if(h__364__auto____32020 != null) {
    return h__364__auto____32020
  }else {
    var h__364__auto____32021 = cljs.core.hash_iset.call(null, coll);
    this__32019.__hash = h__364__auto____32021;
    return h__364__auto____32021
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__32022 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__32023 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__32023.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__32047 = null;
  var G__32047__2 = function(tsym32017, k) {
    var this__32024 = this;
    var tsym32017__32025 = this;
    var coll__32026 = tsym32017__32025;
    return cljs.core._lookup.call(null, coll__32026, k)
  };
  var G__32047__3 = function(tsym32018, k, not_found) {
    var this__32027 = this;
    var tsym32018__32028 = this;
    var coll__32029 = tsym32018__32028;
    return cljs.core._lookup.call(null, coll__32029, k, not_found)
  };
  G__32047 = function(tsym32018, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32047__2.call(this, tsym32018, k);
      case 3:
        return G__32047__3.call(this, tsym32018, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32047
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym32015, args32016) {
  return tsym32015.call.apply(tsym32015, [tsym32015].concat(cljs.core.aclone.call(null, args32016)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__32030 = this;
  return new cljs.core.PersistentTreeSet(this__32030.meta, cljs.core.assoc.call(null, this__32030.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__32031 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__32031.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__32032 = this;
  var this$__32033 = this;
  return cljs.core.pr_str.call(null, this$__32033)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__32034 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__32034.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__32035 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__32035.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__32036 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__32037 = this;
  return cljs.core._comparator.call(null, this__32037.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__32038 = this;
  return cljs.core.keys.call(null, this__32038.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__32039 = this;
  return new cljs.core.PersistentTreeSet(this__32039.meta, cljs.core.dissoc.call(null, this__32039.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__32040 = this;
  return cljs.core.count.call(null, this__32040.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__32041 = this;
  var and__3822__auto____32042 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____32042) {
    var and__3822__auto____32043 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____32043) {
      return cljs.core.every_QMARK_.call(null, function(p1__31997_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__31997_SHARP_)
      }, other)
    }else {
      return and__3822__auto____32043
    }
  }else {
    return and__3822__auto____32042
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__32044 = this;
  return new cljs.core.PersistentTreeSet(meta, this__32044.tree_map, this__32044.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__32045 = this;
  return this__32045.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__32046 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__32046.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__32048 = cljs.core.seq.call(null, coll);
  var out__32049 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__32048))) {
      var G__32050 = cljs.core.next.call(null, in$__32048);
      var G__32051 = cljs.core.conj_BANG_.call(null, out__32049, cljs.core.first.call(null, in$__32048));
      in$__32048 = G__32050;
      out__32049 = G__32051;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__32049)
    }
    break
  }
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
  sorted_set.cljs$lang$applyTo = function(arglist__32052) {
    var keys = cljs.core.seq(arglist__32052);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__32054) {
    var comparator = cljs.core.first(arglist__32054);
    var keys = cljs.core.rest(arglist__32054);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__32055 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____32056 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____32056)) {
        var e__32057 = temp__3971__auto____32056;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__32057))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__32055, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__32053_SHARP_) {
      var temp__3971__auto____32058 = cljs.core.find.call(null, smap, p1__32053_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____32058)) {
        var e__32059 = temp__3971__auto____32058;
        return cljs.core.second.call(null, e__32059)
      }else {
        return p1__32053_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__32067 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__32060, seen) {
        while(true) {
          var vec__32061__32062 = p__32060;
          var f__32063 = cljs.core.nth.call(null, vec__32061__32062, 0, null);
          var xs__32064 = vec__32061__32062;
          var temp__3974__auto____32065 = cljs.core.seq.call(null, xs__32064);
          if(cljs.core.truth_(temp__3974__auto____32065)) {
            var s__32066 = temp__3974__auto____32065;
            if(cljs.core.contains_QMARK_.call(null, seen, f__32063)) {
              var G__32068 = cljs.core.rest.call(null, s__32066);
              var G__32069 = seen;
              p__32060 = G__32068;
              seen = G__32069;
              continue
            }else {
              return cljs.core.cons.call(null, f__32063, step.call(null, cljs.core.rest.call(null, s__32066), cljs.core.conj.call(null, seen, f__32063)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__32067.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__32070 = cljs.core.PersistentVector.fromArray([]);
  var s__32071 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__32071))) {
      var G__32072 = cljs.core.conj.call(null, ret__32070, cljs.core.first.call(null, s__32071));
      var G__32073 = cljs.core.next.call(null, s__32071);
      ret__32070 = G__32072;
      s__32071 = G__32073;
      continue
    }else {
      return cljs.core.seq.call(null, ret__32070)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____32074 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____32074) {
        return or__3824__auto____32074
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__32075 = x.lastIndexOf("/");
      if(i__32075 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__32075 + 1)
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
    var or__3824__auto____32076 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____32076) {
      return or__3824__auto____32076
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__32077 = x.lastIndexOf("/");
    if(i__32077 > -1) {
      return cljs.core.subs.call(null, x, 2, i__32077)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__32080 = cljs.core.ObjMap.fromObject([], {});
  var ks__32081 = cljs.core.seq.call(null, keys);
  var vs__32082 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____32083 = ks__32081;
      if(cljs.core.truth_(and__3822__auto____32083)) {
        return vs__32082
      }else {
        return and__3822__auto____32083
      }
    }())) {
      var G__32084 = cljs.core.assoc.call(null, map__32080, cljs.core.first.call(null, ks__32081), cljs.core.first.call(null, vs__32082));
      var G__32085 = cljs.core.next.call(null, ks__32081);
      var G__32086 = cljs.core.next.call(null, vs__32082);
      map__32080 = G__32084;
      ks__32081 = G__32085;
      vs__32082 = G__32086;
      continue
    }else {
      return map__32080
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
    var G__32089__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__32078_SHARP_, p2__32079_SHARP_) {
        return max_key.call(null, k, p1__32078_SHARP_, p2__32079_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__32089 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32089__delegate.call(this, k, x, y, more)
    };
    G__32089.cljs$lang$maxFixedArity = 3;
    G__32089.cljs$lang$applyTo = function(arglist__32090) {
      var k = cljs.core.first(arglist__32090);
      var x = cljs.core.first(cljs.core.next(arglist__32090));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32090)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32090)));
      return G__32089__delegate(k, x, y, more)
    };
    G__32089.cljs$lang$arity$variadic = G__32089__delegate;
    return G__32089
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
    var G__32091__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__32087_SHARP_, p2__32088_SHARP_) {
        return min_key.call(null, k, p1__32087_SHARP_, p2__32088_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__32091 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32091__delegate.call(this, k, x, y, more)
    };
    G__32091.cljs$lang$maxFixedArity = 3;
    G__32091.cljs$lang$applyTo = function(arglist__32092) {
      var k = cljs.core.first(arglist__32092);
      var x = cljs.core.first(cljs.core.next(arglist__32092));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32092)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32092)));
      return G__32091__delegate(k, x, y, more)
    };
    G__32091.cljs$lang$arity$variadic = G__32091__delegate;
    return G__32091
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
      var temp__3974__auto____32093 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____32093)) {
        var s__32094 = temp__3974__auto____32093;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__32094), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__32094)))
      }else {
        return null
      }
    })
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
    var temp__3974__auto____32095 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____32095)) {
      var s__32096 = temp__3974__auto____32095;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__32096)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__32096), take_while.call(null, pred, cljs.core.rest.call(null, s__32096)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__32097 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__32097.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__32098 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____32099 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____32099)) {
        var vec__32100__32101 = temp__3974__auto____32099;
        var e__32102 = cljs.core.nth.call(null, vec__32100__32101, 0, null);
        var s__32103 = vec__32100__32101;
        if(cljs.core.truth_(include__32098.call(null, e__32102))) {
          return s__32103
        }else {
          return cljs.core.next.call(null, s__32103)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__32098, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____32104 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____32104)) {
      var vec__32105__32106 = temp__3974__auto____32104;
      var e__32107 = cljs.core.nth.call(null, vec__32105__32106, 0, null);
      var s__32108 = vec__32105__32106;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__32107)) ? s__32108 : cljs.core.next.call(null, s__32108))
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
    var include__32109 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____32110 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____32110)) {
        var vec__32111__32112 = temp__3974__auto____32110;
        var e__32113 = cljs.core.nth.call(null, vec__32111__32112, 0, null);
        var s__32114 = vec__32111__32112;
        if(cljs.core.truth_(include__32109.call(null, e__32113))) {
          return s__32114
        }else {
          return cljs.core.next.call(null, s__32114)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__32109, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____32115 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____32115)) {
      var vec__32116__32117 = temp__3974__auto____32115;
      var e__32118 = cljs.core.nth.call(null, vec__32116__32117, 0, null);
      var s__32119 = vec__32116__32117;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__32118)) ? s__32119 : cljs.core.next.call(null, s__32119))
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
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__32120 = this;
  var h__364__auto____32121 = this__32120.__hash;
  if(h__364__auto____32121 != null) {
    return h__364__auto____32121
  }else {
    var h__364__auto____32122 = cljs.core.hash_coll.call(null, rng);
    this__32120.__hash = h__364__auto____32122;
    return h__364__auto____32122
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__32123 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__32124 = this;
  var this$__32125 = this;
  return cljs.core.pr_str.call(null, this$__32125)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__32126 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__32127 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__32128 = this;
  var comp__32129 = this__32128.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__32129.call(null, this__32128.start, this__32128.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__32130 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__32130.end - this__32130.start) / this__32130.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__32131 = this;
  return this__32131.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__32132 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__32132.meta, this__32132.start + this__32132.step, this__32132.end, this__32132.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__32133 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__32134 = this;
  return new cljs.core.Range(meta, this__32134.start, this__32134.end, this__32134.step, this__32134.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__32135 = this;
  return this__32135.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__32136 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__32136.start + n * this__32136.step
  }else {
    if(function() {
      var and__3822__auto____32137 = this__32136.start > this__32136.end;
      if(and__3822__auto____32137) {
        return this__32136.step === 0
      }else {
        return and__3822__auto____32137
      }
    }()) {
      return this__32136.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__32138 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__32138.start + n * this__32138.step
  }else {
    if(function() {
      var and__3822__auto____32139 = this__32138.start > this__32138.end;
      if(and__3822__auto____32139) {
        return this__32138.step === 0
      }else {
        return and__3822__auto____32139
      }
    }()) {
      return this__32138.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__32140 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__32140.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
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
    var temp__3974__auto____32141 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____32141)) {
      var s__32142 = temp__3974__auto____32141;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__32142), take_nth.call(null, n, cljs.core.drop.call(null, n, s__32142)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____32144 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____32144)) {
      var s__32145 = temp__3974__auto____32144;
      var fst__32146 = cljs.core.first.call(null, s__32145);
      var fv__32147 = f.call(null, fst__32146);
      var run__32148 = cljs.core.cons.call(null, fst__32146, cljs.core.take_while.call(null, function(p1__32143_SHARP_) {
        return cljs.core._EQ_.call(null, fv__32147, f.call(null, p1__32143_SHARP_))
      }, cljs.core.next.call(null, s__32145)));
      return cljs.core.cons.call(null, run__32148, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__32148), s__32145))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____32159 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____32159)) {
        var s__32160 = temp__3971__auto____32159;
        return reductions.call(null, f, cljs.core.first.call(null, s__32160), cljs.core.rest.call(null, s__32160))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____32161 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____32161)) {
        var s__32162 = temp__3974__auto____32161;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__32162)), cljs.core.rest.call(null, s__32162))
      }else {
        return null
      }
    }))
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
      var G__32164 = null;
      var G__32164__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__32164__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__32164__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__32164__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__32164__4 = function() {
        var G__32165__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__32165 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32165__delegate.call(this, x, y, z, args)
        };
        G__32165.cljs$lang$maxFixedArity = 3;
        G__32165.cljs$lang$applyTo = function(arglist__32166) {
          var x = cljs.core.first(arglist__32166);
          var y = cljs.core.first(cljs.core.next(arglist__32166));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32166)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32166)));
          return G__32165__delegate(x, y, z, args)
        };
        G__32165.cljs$lang$arity$variadic = G__32165__delegate;
        return G__32165
      }();
      G__32164 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32164__0.call(this);
          case 1:
            return G__32164__1.call(this, x);
          case 2:
            return G__32164__2.call(this, x, y);
          case 3:
            return G__32164__3.call(this, x, y, z);
          default:
            return G__32164__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32164.cljs$lang$maxFixedArity = 3;
      G__32164.cljs$lang$applyTo = G__32164__4.cljs$lang$applyTo;
      return G__32164
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__32167 = null;
      var G__32167__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__32167__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__32167__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__32167__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__32167__4 = function() {
        var G__32168__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__32168 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32168__delegate.call(this, x, y, z, args)
        };
        G__32168.cljs$lang$maxFixedArity = 3;
        G__32168.cljs$lang$applyTo = function(arglist__32169) {
          var x = cljs.core.first(arglist__32169);
          var y = cljs.core.first(cljs.core.next(arglist__32169));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32169)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32169)));
          return G__32168__delegate(x, y, z, args)
        };
        G__32168.cljs$lang$arity$variadic = G__32168__delegate;
        return G__32168
      }();
      G__32167 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32167__0.call(this);
          case 1:
            return G__32167__1.call(this, x);
          case 2:
            return G__32167__2.call(this, x, y);
          case 3:
            return G__32167__3.call(this, x, y, z);
          default:
            return G__32167__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32167.cljs$lang$maxFixedArity = 3;
      G__32167.cljs$lang$applyTo = G__32167__4.cljs$lang$applyTo;
      return G__32167
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__32170 = null;
      var G__32170__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__32170__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__32170__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__32170__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__32170__4 = function() {
        var G__32171__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__32171 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__32171__delegate.call(this, x, y, z, args)
        };
        G__32171.cljs$lang$maxFixedArity = 3;
        G__32171.cljs$lang$applyTo = function(arglist__32172) {
          var x = cljs.core.first(arglist__32172);
          var y = cljs.core.first(cljs.core.next(arglist__32172));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32172)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32172)));
          return G__32171__delegate(x, y, z, args)
        };
        G__32171.cljs$lang$arity$variadic = G__32171__delegate;
        return G__32171
      }();
      G__32170 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__32170__0.call(this);
          case 1:
            return G__32170__1.call(this, x);
          case 2:
            return G__32170__2.call(this, x, y);
          case 3:
            return G__32170__3.call(this, x, y, z);
          default:
            return G__32170__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__32170.cljs$lang$maxFixedArity = 3;
      G__32170.cljs$lang$applyTo = G__32170__4.cljs$lang$applyTo;
      return G__32170
    }()
  };
  var juxt__4 = function() {
    var G__32173__delegate = function(f, g, h, fs) {
      var fs__32163 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__32174 = null;
        var G__32174__0 = function() {
          return cljs.core.reduce.call(null, function(p1__32149_SHARP_, p2__32150_SHARP_) {
            return cljs.core.conj.call(null, p1__32149_SHARP_, p2__32150_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__32163)
        };
        var G__32174__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__32151_SHARP_, p2__32152_SHARP_) {
            return cljs.core.conj.call(null, p1__32151_SHARP_, p2__32152_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__32163)
        };
        var G__32174__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__32153_SHARP_, p2__32154_SHARP_) {
            return cljs.core.conj.call(null, p1__32153_SHARP_, p2__32154_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__32163)
        };
        var G__32174__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__32155_SHARP_, p2__32156_SHARP_) {
            return cljs.core.conj.call(null, p1__32155_SHARP_, p2__32156_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__32163)
        };
        var G__32174__4 = function() {
          var G__32175__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__32157_SHARP_, p2__32158_SHARP_) {
              return cljs.core.conj.call(null, p1__32157_SHARP_, cljs.core.apply.call(null, p2__32158_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__32163)
          };
          var G__32175 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__32175__delegate.call(this, x, y, z, args)
          };
          G__32175.cljs$lang$maxFixedArity = 3;
          G__32175.cljs$lang$applyTo = function(arglist__32176) {
            var x = cljs.core.first(arglist__32176);
            var y = cljs.core.first(cljs.core.next(arglist__32176));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32176)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32176)));
            return G__32175__delegate(x, y, z, args)
          };
          G__32175.cljs$lang$arity$variadic = G__32175__delegate;
          return G__32175
        }();
        G__32174 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__32174__0.call(this);
            case 1:
              return G__32174__1.call(this, x);
            case 2:
              return G__32174__2.call(this, x, y);
            case 3:
              return G__32174__3.call(this, x, y, z);
            default:
              return G__32174__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__32174.cljs$lang$maxFixedArity = 3;
        G__32174.cljs$lang$applyTo = G__32174__4.cljs$lang$applyTo;
        return G__32174
      }()
    };
    var G__32173 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__32173__delegate.call(this, f, g, h, fs)
    };
    G__32173.cljs$lang$maxFixedArity = 3;
    G__32173.cljs$lang$applyTo = function(arglist__32177) {
      var f = cljs.core.first(arglist__32177);
      var g = cljs.core.first(cljs.core.next(arglist__32177));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32177)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32177)));
      return G__32173__delegate(f, g, h, fs)
    };
    G__32173.cljs$lang$arity$variadic = G__32173__delegate;
    return G__32173
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
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__32179 = cljs.core.next.call(null, coll);
        coll = G__32179;
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
        var and__3822__auto____32178 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____32178)) {
          return n > 0
        }else {
          return and__3822__auto____32178
        }
      }())) {
        var G__32180 = n - 1;
        var G__32181 = cljs.core.next.call(null, coll);
        n = G__32180;
        coll = G__32181;
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
cljs.core.re_matches = function re_matches(re, s) {
  var matches__32182 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__32182), s)) {
    if(cljs.core.count.call(null, matches__32182) === 1) {
      return cljs.core.first.call(null, matches__32182)
    }else {
      return cljs.core.vec.call(null, matches__32182)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__32183 = re.exec(s);
  if(matches__32183 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__32183) === 1) {
      return cljs.core.first.call(null, matches__32183)
    }else {
      return cljs.core.vec.call(null, matches__32183)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__32184 = cljs.core.re_find.call(null, re, s);
  var match_idx__32185 = s.search(re);
  var match_str__32186 = cljs.core.coll_QMARK_.call(null, match_data__32184) ? cljs.core.first.call(null, match_data__32184) : match_data__32184;
  var post_match__32187 = cljs.core.subs.call(null, s, match_idx__32185 + cljs.core.count.call(null, match_str__32186));
  if(cljs.core.truth_(match_data__32184)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__32184, re_seq.call(null, re, post_match__32187))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__32189__32190 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___32191 = cljs.core.nth.call(null, vec__32189__32190, 0, null);
  var flags__32192 = cljs.core.nth.call(null, vec__32189__32190, 1, null);
  var pattern__32193 = cljs.core.nth.call(null, vec__32189__32190, 2, null);
  return new RegExp(pattern__32193, flags__32192)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__32188_SHARP_) {
    return print_one.call(null, p1__32188_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
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
          var and__3822__auto____32194 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____32194)) {
            var and__3822__auto____32198 = function() {
              var G__32195__32196 = obj;
              if(G__32195__32196 != null) {
                if(function() {
                  var or__3824__auto____32197 = G__32195__32196.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____32197) {
                    return or__3824__auto____32197
                  }else {
                    return G__32195__32196.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__32195__32196.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__32195__32196)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__32195__32196)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____32198)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____32198
            }
          }else {
            return and__3822__auto____32194
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____32199 = obj != null;
          if(and__3822__auto____32199) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____32199
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__32200__32201 = obj;
          if(G__32200__32201 != null) {
            if(function() {
              var or__3824__auto____32202 = G__32200__32201.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____32202) {
                return or__3824__auto____32202
              }else {
                return G__32200__32201.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__32200__32201.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__32200__32201)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__32200__32201)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__32203 = cljs.core.first.call(null, objs);
  var sb__32204 = new goog.string.StringBuffer;
  var G__32205__32206 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__32205__32206)) {
    var obj__32207 = cljs.core.first.call(null, G__32205__32206);
    var G__32205__32208 = G__32205__32206;
    while(true) {
      if(obj__32207 === first_obj__32203) {
      }else {
        sb__32204.append(" ")
      }
      var G__32209__32210 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__32207, opts));
      if(cljs.core.truth_(G__32209__32210)) {
        var string__32211 = cljs.core.first.call(null, G__32209__32210);
        var G__32209__32212 = G__32209__32210;
        while(true) {
          sb__32204.append(string__32211);
          var temp__3974__auto____32213 = cljs.core.next.call(null, G__32209__32212);
          if(cljs.core.truth_(temp__3974__auto____32213)) {
            var G__32209__32214 = temp__3974__auto____32213;
            var G__32217 = cljs.core.first.call(null, G__32209__32214);
            var G__32218 = G__32209__32214;
            string__32211 = G__32217;
            G__32209__32212 = G__32218;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____32215 = cljs.core.next.call(null, G__32205__32208);
      if(cljs.core.truth_(temp__3974__auto____32215)) {
        var G__32205__32216 = temp__3974__auto____32215;
        var G__32219 = cljs.core.first.call(null, G__32205__32216);
        var G__32220 = G__32205__32216;
        obj__32207 = G__32219;
        G__32205__32208 = G__32220;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__32204
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__32221 = cljs.core.pr_sb.call(null, objs, opts);
  sb__32221.append("\n");
  return[cljs.core.str(sb__32221)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__32222 = cljs.core.first.call(null, objs);
  var G__32223__32224 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__32223__32224)) {
    var obj__32225 = cljs.core.first.call(null, G__32223__32224);
    var G__32223__32226 = G__32223__32224;
    while(true) {
      if(obj__32225 === first_obj__32222) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__32227__32228 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__32225, opts));
      if(cljs.core.truth_(G__32227__32228)) {
        var string__32229 = cljs.core.first.call(null, G__32227__32228);
        var G__32227__32230 = G__32227__32228;
        while(true) {
          cljs.core.string_print.call(null, string__32229);
          var temp__3974__auto____32231 = cljs.core.next.call(null, G__32227__32230);
          if(cljs.core.truth_(temp__3974__auto____32231)) {
            var G__32227__32232 = temp__3974__auto____32231;
            var G__32235 = cljs.core.first.call(null, G__32227__32232);
            var G__32236 = G__32227__32232;
            string__32229 = G__32235;
            G__32227__32230 = G__32236;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____32233 = cljs.core.next.call(null, G__32223__32226);
      if(cljs.core.truth_(temp__3974__auto____32233)) {
        var G__32223__32234 = temp__3974__auto____32233;
        var G__32237 = cljs.core.first.call(null, G__32223__32234);
        var G__32238 = G__32223__32234;
        obj__32225 = G__32237;
        G__32223__32226 = G__32238;
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
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
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
  pr_str.cljs$lang$applyTo = function(arglist__32239) {
    var objs = cljs.core.seq(arglist__32239);
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
  prn_str.cljs$lang$applyTo = function(arglist__32240) {
    var objs = cljs.core.seq(arglist__32240);
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
  pr.cljs$lang$applyTo = function(arglist__32241) {
    var objs = cljs.core.seq(arglist__32241);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__32242) {
    var objs = cljs.core.seq(arglist__32242);
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
  print_str.cljs$lang$applyTo = function(arglist__32243) {
    var objs = cljs.core.seq(arglist__32243);
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
  println.cljs$lang$applyTo = function(arglist__32244) {
    var objs = cljs.core.seq(arglist__32244);
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
  println_str.cljs$lang$applyTo = function(arglist__32245) {
    var objs = cljs.core.seq(arglist__32245);
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
  prn.cljs$lang$applyTo = function(arglist__32246) {
    var objs = cljs.core.seq(arglist__32246);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__32247 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__32247, "{", ", ", "}", opts, coll)
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
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__32248 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__32248, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__32249 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__32249, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
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
      var temp__3974__auto____32250 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____32250)) {
        var nspc__32251 = temp__3974__auto____32250;
        return[cljs.core.str(nspc__32251), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____32252 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____32252)) {
          var nspc__32253 = temp__3974__auto____32252;
          return[cljs.core.str(nspc__32253), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
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
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__32254 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__32254, "{", ", ", "}", opts, coll)
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
  var pr_pair__32255 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__32255, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__32256 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__32257 = this;
  var G__32258__32259 = cljs.core.seq.call(null, this__32257.watches);
  if(cljs.core.truth_(G__32258__32259)) {
    var G__32261__32263 = cljs.core.first.call(null, G__32258__32259);
    var vec__32262__32264 = G__32261__32263;
    var key__32265 = cljs.core.nth.call(null, vec__32262__32264, 0, null);
    var f__32266 = cljs.core.nth.call(null, vec__32262__32264, 1, null);
    var G__32258__32267 = G__32258__32259;
    var G__32261__32268 = G__32261__32263;
    var G__32258__32269 = G__32258__32267;
    while(true) {
      var vec__32270__32271 = G__32261__32268;
      var key__32272 = cljs.core.nth.call(null, vec__32270__32271, 0, null);
      var f__32273 = cljs.core.nth.call(null, vec__32270__32271, 1, null);
      var G__32258__32274 = G__32258__32269;
      f__32273.call(null, key__32272, this$, oldval, newval);
      var temp__3974__auto____32275 = cljs.core.next.call(null, G__32258__32274);
      if(cljs.core.truth_(temp__3974__auto____32275)) {
        var G__32258__32276 = temp__3974__auto____32275;
        var G__32283 = cljs.core.first.call(null, G__32258__32276);
        var G__32284 = G__32258__32276;
        G__32261__32268 = G__32283;
        G__32258__32269 = G__32284;
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
  var this__32277 = this;
  return this$.watches = cljs.core.assoc.call(null, this__32277.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__32278 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__32278.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__32279 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__32279.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__32280 = this;
  return this__32280.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__32281 = this;
  return this__32281.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__32282 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__32291__delegate = function(x, p__32285) {
      var map__32286__32287 = p__32285;
      var map__32286__32288 = cljs.core.seq_QMARK_.call(null, map__32286__32287) ? cljs.core.apply.call(null, cljs.core.hash_map, map__32286__32287) : map__32286__32287;
      var validator__32289 = cljs.core.get.call(null, map__32286__32288, "\ufdd0'validator");
      var meta__32290 = cljs.core.get.call(null, map__32286__32288, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__32290, validator__32289, null)
    };
    var G__32291 = function(x, var_args) {
      var p__32285 = null;
      if(goog.isDef(var_args)) {
        p__32285 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__32291__delegate.call(this, x, p__32285)
    };
    G__32291.cljs$lang$maxFixedArity = 1;
    G__32291.cljs$lang$applyTo = function(arglist__32292) {
      var x = cljs.core.first(arglist__32292);
      var p__32285 = cljs.core.rest(arglist__32292);
      return G__32291__delegate(x, p__32285)
    };
    G__32291.cljs$lang$arity$variadic = G__32291__delegate;
    return G__32291
  }();
  atom = function(x, var_args) {
    var p__32285 = var_args;
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
  var temp__3974__auto____32293 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____32293)) {
    var validate__32294 = temp__3974__auto____32293;
    if(cljs.core.truth_(validate__32294.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__32295 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__32295, new_value);
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
    var G__32296__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__32296 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__32296__delegate.call(this, a, f, x, y, z, more)
    };
    G__32296.cljs$lang$maxFixedArity = 5;
    G__32296.cljs$lang$applyTo = function(arglist__32297) {
      var a = cljs.core.first(arglist__32297);
      var f = cljs.core.first(cljs.core.next(arglist__32297));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32297)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__32297))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__32297)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__32297)))));
      return G__32296__delegate(a, f, x, y, z, more)
    };
    G__32296.cljs$lang$arity$variadic = G__32296__delegate;
    return G__32296
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__32298) {
    var iref = cljs.core.first(arglist__32298);
    var f = cljs.core.first(cljs.core.next(arglist__32298));
    var args = cljs.core.rest(cljs.core.next(arglist__32298));
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
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__32299 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__32299.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__32300 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__32300.state, function(p__32301) {
    var curr_state__32302 = p__32301;
    var curr_state__32303 = cljs.core.seq_QMARK_.call(null, curr_state__32302) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__32302) : curr_state__32302;
    var done__32304 = cljs.core.get.call(null, curr_state__32303, "\ufdd0'done");
    if(cljs.core.truth_(done__32304)) {
      return curr_state__32303
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__32300.f.call(null)})
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
    var map__32305__32306 = options;
    var map__32305__32307 = cljs.core.seq_QMARK_.call(null, map__32305__32306) ? cljs.core.apply.call(null, cljs.core.hash_map, map__32305__32306) : map__32305__32306;
    var keywordize_keys__32308 = cljs.core.get.call(null, map__32305__32307, "\ufdd0'keywordize-keys");
    var keyfn__32309 = cljs.core.truth_(keywordize_keys__32308) ? cljs.core.keyword : cljs.core.str;
    var f__32315 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____32314 = function iter__32310(s__32311) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__32311__32312 = s__32311;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__32311__32312))) {
                        var k__32313 = cljs.core.first.call(null, s__32311__32312);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__32309.call(null, k__32313), thisfn.call(null, x[k__32313])]), iter__32310.call(null, cljs.core.rest.call(null, s__32311__32312)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____32314.call(null, cljs.core.js_keys.call(null, x))
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
    return f__32315.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__32316) {
    var x = cljs.core.first(arglist__32316);
    var options = cljs.core.rest(arglist__32316);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__32317 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__32321__delegate = function(args) {
      var temp__3971__auto____32318 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__32317), args);
      if(cljs.core.truth_(temp__3971__auto____32318)) {
        var v__32319 = temp__3971__auto____32318;
        return v__32319
      }else {
        var ret__32320 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__32317, cljs.core.assoc, args, ret__32320);
        return ret__32320
      }
    };
    var G__32321 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__32321__delegate.call(this, args)
    };
    G__32321.cljs$lang$maxFixedArity = 0;
    G__32321.cljs$lang$applyTo = function(arglist__32322) {
      var args = cljs.core.seq(arglist__32322);
      return G__32321__delegate(args)
    };
    G__32321.cljs$lang$arity$variadic = G__32321__delegate;
    return G__32321
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__32323 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__32323)) {
        var G__32324 = ret__32323;
        f = G__32324;
        continue
      }else {
        return ret__32323
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__32325__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__32325 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__32325__delegate.call(this, f, args)
    };
    G__32325.cljs$lang$maxFixedArity = 1;
    G__32325.cljs$lang$applyTo = function(arglist__32326) {
      var f = cljs.core.first(arglist__32326);
      var args = cljs.core.rest(arglist__32326);
      return G__32325__delegate(f, args)
    };
    G__32325.cljs$lang$arity$variadic = G__32325__delegate;
    return G__32325
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
    return Math.random() * n
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
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__32327 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__32327, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__32327, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____32328 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____32328) {
      return or__3824__auto____32328
    }else {
      var or__3824__auto____32329 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____32329) {
        return or__3824__auto____32329
      }else {
        var and__3822__auto____32330 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____32330) {
          var and__3822__auto____32331 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____32331) {
            var and__3822__auto____32332 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____32332) {
              var ret__32333 = true;
              var i__32334 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____32335 = cljs.core.not.call(null, ret__32333);
                  if(or__3824__auto____32335) {
                    return or__3824__auto____32335
                  }else {
                    return i__32334 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__32333
                }else {
                  var G__32336 = isa_QMARK_.call(null, h, child.call(null, i__32334), parent.call(null, i__32334));
                  var G__32337 = i__32334 + 1;
                  ret__32333 = G__32336;
                  i__32334 = G__32337;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____32332
            }
          }else {
            return and__3822__auto____32331
          }
        }else {
          return and__3822__auto____32330
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
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
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
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
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__32341 = "\ufdd0'parents".call(null, h);
    var td__32342 = "\ufdd0'descendants".call(null, h);
    var ta__32343 = "\ufdd0'ancestors".call(null, h);
    var tf__32344 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____32345 = cljs.core.contains_QMARK_.call(null, tp__32341.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__32343.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__32343.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__32341, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__32344.call(null, "\ufdd0'ancestors".call(null, h), tag, td__32342, parent, ta__32343), "\ufdd0'descendants":tf__32344.call(null, "\ufdd0'descendants".call(null, h), parent, ta__32343, tag, td__32342)})
    }();
    if(cljs.core.truth_(or__3824__auto____32345)) {
      return or__3824__auto____32345
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
    var parentMap__32346 = "\ufdd0'parents".call(null, h);
    var childsParents__32347 = cljs.core.truth_(parentMap__32346.call(null, tag)) ? cljs.core.disj.call(null, parentMap__32346.call(null, tag), parent) : cljs.core.set([]);
    var newParents__32348 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__32347)) ? cljs.core.assoc.call(null, parentMap__32346, tag, childsParents__32347) : cljs.core.dissoc.call(null, parentMap__32346, tag);
    var deriv_seq__32349 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__32338_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__32338_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__32338_SHARP_), cljs.core.second.call(null, p1__32338_SHARP_)))
    }, cljs.core.seq.call(null, newParents__32348)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__32346.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__32339_SHARP_, p2__32340_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__32339_SHARP_, p2__32340_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__32349))
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
  var xprefs__32350 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____32352 = cljs.core.truth_(function() {
    var and__3822__auto____32351 = xprefs__32350;
    if(cljs.core.truth_(and__3822__auto____32351)) {
      return xprefs__32350.call(null, y)
    }else {
      return and__3822__auto____32351
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____32352)) {
    return or__3824__auto____32352
  }else {
    var or__3824__auto____32354 = function() {
      var ps__32353 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__32353) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__32353), prefer_table))) {
          }else {
          }
          var G__32357 = cljs.core.rest.call(null, ps__32353);
          ps__32353 = G__32357;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____32354)) {
      return or__3824__auto____32354
    }else {
      var or__3824__auto____32356 = function() {
        var ps__32355 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__32355) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__32355), y, prefer_table))) {
            }else {
            }
            var G__32358 = cljs.core.rest.call(null, ps__32355);
            ps__32355 = G__32358;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____32356)) {
        return or__3824__auto____32356
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____32359 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____32359)) {
    return or__3824__auto____32359
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__32368 = cljs.core.reduce.call(null, function(be, p__32360) {
    var vec__32361__32362 = p__32360;
    var k__32363 = cljs.core.nth.call(null, vec__32361__32362, 0, null);
    var ___32364 = cljs.core.nth.call(null, vec__32361__32362, 1, null);
    var e__32365 = vec__32361__32362;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__32363)) {
      var be2__32367 = cljs.core.truth_(function() {
        var or__3824__auto____32366 = be == null;
        if(or__3824__auto____32366) {
          return or__3824__auto____32366
        }else {
          return cljs.core.dominates.call(null, k__32363, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__32365 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__32367), k__32363, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__32363), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__32367)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__32367
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__32368)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__32368));
      return cljs.core.second.call(null, best_entry__32368)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____32369 = mf;
    if(and__3822__auto____32369) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____32369
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____32370 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32370) {
        return or__3824__auto____32370
      }else {
        var or__3824__auto____32371 = cljs.core._reset["_"];
        if(or__3824__auto____32371) {
          return or__3824__auto____32371
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____32372 = mf;
    if(and__3822__auto____32372) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____32372
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____32373 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32373) {
        return or__3824__auto____32373
      }else {
        var or__3824__auto____32374 = cljs.core._add_method["_"];
        if(or__3824__auto____32374) {
          return or__3824__auto____32374
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____32375 = mf;
    if(and__3822__auto____32375) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____32375
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____32376 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32376) {
        return or__3824__auto____32376
      }else {
        var or__3824__auto____32377 = cljs.core._remove_method["_"];
        if(or__3824__auto____32377) {
          return or__3824__auto____32377
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____32378 = mf;
    if(and__3822__auto____32378) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____32378
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____32379 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32379) {
        return or__3824__auto____32379
      }else {
        var or__3824__auto____32380 = cljs.core._prefer_method["_"];
        if(or__3824__auto____32380) {
          return or__3824__auto____32380
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____32381 = mf;
    if(and__3822__auto____32381) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____32381
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____32382 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32382) {
        return or__3824__auto____32382
      }else {
        var or__3824__auto____32383 = cljs.core._get_method["_"];
        if(or__3824__auto____32383) {
          return or__3824__auto____32383
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____32384 = mf;
    if(and__3822__auto____32384) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____32384
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____32385 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32385) {
        return or__3824__auto____32385
      }else {
        var or__3824__auto____32386 = cljs.core._methods["_"];
        if(or__3824__auto____32386) {
          return or__3824__auto____32386
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____32387 = mf;
    if(and__3822__auto____32387) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____32387
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____32388 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32388) {
        return or__3824__auto____32388
      }else {
        var or__3824__auto____32389 = cljs.core._prefers["_"];
        if(or__3824__auto____32389) {
          return or__3824__auto____32389
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____32390 = mf;
    if(and__3822__auto____32390) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____32390
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____32391 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____32391) {
        return or__3824__auto____32391
      }else {
        var or__3824__auto____32392 = cljs.core._dispatch["_"];
        if(or__3824__auto____32392) {
          return or__3824__auto____32392
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__32393 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__32394 = cljs.core._get_method.call(null, mf, dispatch_val__32393);
  if(cljs.core.truth_(target_fn__32394)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__32393)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__32394, args)
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
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__32395 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__32396 = this;
  cljs.core.swap_BANG_.call(null, this__32396.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__32396.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__32396.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__32396.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__32397 = this;
  cljs.core.swap_BANG_.call(null, this__32397.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__32397.method_cache, this__32397.method_table, this__32397.cached_hierarchy, this__32397.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__32398 = this;
  cljs.core.swap_BANG_.call(null, this__32398.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__32398.method_cache, this__32398.method_table, this__32398.cached_hierarchy, this__32398.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__32399 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__32399.cached_hierarchy), cljs.core.deref.call(null, this__32399.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__32399.method_cache, this__32399.method_table, this__32399.cached_hierarchy, this__32399.hierarchy)
  }
  var temp__3971__auto____32400 = cljs.core.deref.call(null, this__32399.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____32400)) {
    var target_fn__32401 = temp__3971__auto____32400;
    return target_fn__32401
  }else {
    var temp__3971__auto____32402 = cljs.core.find_and_cache_best_method.call(null, this__32399.name, dispatch_val, this__32399.hierarchy, this__32399.method_table, this__32399.prefer_table, this__32399.method_cache, this__32399.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____32402)) {
      var target_fn__32403 = temp__3971__auto____32402;
      return target_fn__32403
    }else {
      return cljs.core.deref.call(null, this__32399.method_table).call(null, this__32399.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__32404 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__32404.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__32404.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__32404.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__32404.method_cache, this__32404.method_table, this__32404.cached_hierarchy, this__32404.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__32405 = this;
  return cljs.core.deref.call(null, this__32405.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__32406 = this;
  return cljs.core.deref.call(null, this__32406.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__32407 = this;
  return cljs.core.do_dispatch.call(null, mf, this__32407.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__32408__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__32408 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__32408__delegate.call(this, _, args)
  };
  G__32408.cljs$lang$maxFixedArity = 1;
  G__32408.cljs$lang$applyTo = function(arglist__32409) {
    var _ = cljs.core.first(arglist__32409);
    var args = cljs.core.rest(arglist__32409);
    return G__32408__delegate(_, args)
  };
  G__32408.cljs$lang$arity$variadic = G__32408__delegate;
  return G__32408
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
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
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
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
      var s__30031 = s;
      var limit__30032 = limit;
      var parts__30033 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__30032, 1)) {
          return cljs.core.conj.call(null, parts__30033, s__30031)
        }else {
          var temp__3971__auto____30034 = cljs.core.re_find.call(null, re, s__30031);
          if(cljs.core.truth_(temp__3971__auto____30034)) {
            var m__30035 = temp__3971__auto____30034;
            var index__30036 = s__30031.indexOf(m__30035);
            var G__30037 = s__30031.substring(index__30036 + cljs.core.count.call(null, m__30035));
            var G__30038 = limit__30032 - 1;
            var G__30039 = cljs.core.conj.call(null, parts__30033, s__30031.substring(0, index__30036));
            s__30031 = G__30037;
            limit__30032 = G__30038;
            parts__30033 = G__30039;
            continue
          }else {
            return cljs.core.conj.call(null, parts__30033, s__30031)
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
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__30040 = s.length;
  while(true) {
    if(index__30040 === 0) {
      return""
    }else {
      var ch__30041 = cljs.core.get.call(null, s, index__30040 - 1);
      if(function() {
        var or__3824__auto____30042 = cljs.core._EQ_.call(null, ch__30041, "\n");
        if(or__3824__auto____30042) {
          return or__3824__auto____30042
        }else {
          return cljs.core._EQ_.call(null, ch__30041, "\r")
        }
      }()) {
        var G__30043 = index__30040 - 1;
        index__30040 = G__30043;
        continue
      }else {
        return s.substring(0, index__30040)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__30044 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____30045 = cljs.core.not.call(null, s__30044);
    if(or__3824__auto____30045) {
      return or__3824__auto____30045
    }else {
      var or__3824__auto____30046 = cljs.core._EQ_.call(null, "", s__30044);
      if(or__3824__auto____30046) {
        return or__3824__auto____30046
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__30044)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__30047 = new goog.string.StringBuffer;
  var length__30048 = s.length;
  var index__30049 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__30048, index__30049)) {
      return buffer__30047.toString()
    }else {
      var ch__30050 = s.charAt(index__30049);
      var temp__3971__auto____30051 = cljs.core.get.call(null, cmap, ch__30050);
      if(cljs.core.truth_(temp__3971__auto____30051)) {
        var replacement__30052 = temp__3971__auto____30051;
        buffer__30047.append([cljs.core.str(replacement__30052)].join(""))
      }else {
        buffer__30047.append(ch__30050)
      }
      var G__30053 = index__30049 + 1;
      index__30049 = G__30053;
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
      var or__3824__auto____30015 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____30015) {
        return or__3824__auto____30015
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
    var G__30016__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__30017 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__30018 = cljs.core.next.call(null, more);
            s = G__30017;
            more = G__30018;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__30016 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__30016__delegate.call(this, x, xs)
    };
    G__30016.cljs$lang$maxFixedArity = 1;
    G__30016.cljs$lang$applyTo = function(arglist__30019) {
      var x = cljs.core.first(arglist__30019);
      var xs = cljs.core.rest(arglist__30019);
      return G__30016__delegate(x, xs)
    };
    G__30016.cljs$lang$arity$variadic = G__30016__delegate;
    return G__30016
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
    var iter__625__auto____30027 = function iter__30020(s__30021) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__30021__30022 = s__30021;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__30021__30022))) {
            var vec__30023__30024 = cljs.core.first.call(null, s__30021__30022);
            var k__30025 = cljs.core.nth.call(null, vec__30023__30024, 0, null);
            var v__30026 = cljs.core.nth.call(null, vec__30023__30024, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__30025)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__30026))].join(""), iter__30020.call(null, cljs.core.rest.call(null, s__30021__30022)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____30027.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__30028 = cljs.core.last.call(null, args);
    var args__30029 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__30029)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__30028) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__30028))].join("") : params__30028)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__30030) {
    var args = cljs.core.seq(arglist__30030);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__32518 = {};
  var G__32519__32520 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__32519__32520)) {
    var G__32522__32524 = cljs.core.first.call(null, G__32519__32520);
    var vec__32523__32525 = G__32522__32524;
    var k__32526 = cljs.core.nth.call(null, vec__32523__32525, 0, null);
    var v__32527 = cljs.core.nth.call(null, vec__32523__32525, 1, null);
    var G__32519__32528 = G__32519__32520;
    var G__32522__32529 = G__32522__32524;
    var G__32519__32530 = G__32519__32528;
    while(true) {
      var vec__32531__32532 = G__32522__32529;
      var k__32533 = cljs.core.nth.call(null, vec__32531__32532, 0, null);
      var v__32534 = cljs.core.nth.call(null, vec__32531__32532, 1, null);
      var G__32519__32535 = G__32519__32530;
      out__32518[cljs.core.name.call(null, k__32533)] = v__32534;
      var temp__3974__auto____32536 = cljs.core.next.call(null, G__32519__32535);
      if(cljs.core.truth_(temp__3974__auto____32536)) {
        var G__32519__32537 = temp__3974__auto____32536;
        var G__32538 = cljs.core.first.call(null, G__32519__32537);
        var G__32539 = G__32519__32537;
        G__32522__32529 = G__32538;
        G__32519__32530 = G__32539;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__32518
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__32540 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__32540)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__32541) {
    var v = cljs.core.first(arglist__32541);
    var text = cljs.core.rest(arglist__32541);
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
        return cljs.core.reduce.call(null, function(m, p__32542) {
          var vec__32543__32544 = p__32542;
          var k__32545 = cljs.core.nth.call(null, vec__32543__32544, 0, null);
          var v__32546 = cljs.core.nth.call(null, vec__32543__32544, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__32545), clj__GT_js.call(null, v__32546))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
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
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      var temp__3971__auto____32410 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____32410)) {
        var cm__32411 = temp__3971__auto____32410;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__32411), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__32412) {
    var vec__32413__32414 = p__32412;
    var context__32415 = cljs.core.nth.call(null, vec__32413__32414, 0, null);
    if(cljs.core.not.call(null, context__32415)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__32415)
    }
  };
  var $ = function(sel, var_args) {
    var p__32412 = null;
    if(goog.isDef(var_args)) {
      p__32412 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__32412)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__32416) {
    var sel = cljs.core.first(arglist__32416);
    var p__32412 = cljs.core.rest(arglist__32416);
    return $__delegate(sel, p__32412)
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
  var or__3824__auto____32417 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____32417)) {
    return or__3824__auto____32417
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
  var G__32418 = null;
  var G__32418__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__32418__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__32418 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__32418__2.call(this, _, k);
      case 3:
        return G__32418__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__32418
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
  var attr__delegate = function($elem, a, p__32419) {
    var vec__32420__32421 = p__32419;
    var v__32422 = cljs.core.nth.call(null, vec__32420__32421, 0, null);
    var a__32423 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__32422)) {
      return $elem.attr(a__32423)
    }else {
      return $elem.attr(a__32423, v__32422)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__32419 = null;
    if(goog.isDef(var_args)) {
      p__32419 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__32419)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__32424) {
    var $elem = cljs.core.first(arglist__32424);
    var a = cljs.core.first(cljs.core.next(arglist__32424));
    var p__32419 = cljs.core.rest(cljs.core.next(arglist__32424));
    return attr__delegate($elem, a, p__32419)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__32425) {
    var vec__32426__32427 = p__32425;
    var v__32428 = cljs.core.nth.call(null, vec__32426__32427, 0, null);
    var k__32429 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__32428)) {
      return $elem.data(k__32429)
    }else {
      return $elem.data(k__32429, v__32428)
    }
  };
  var data = function($elem, k, var_args) {
    var p__32425 = null;
    if(goog.isDef(var_args)) {
      p__32425 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__32425)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__32430) {
    var $elem = cljs.core.first(arglist__32430);
    var k = cljs.core.first(cljs.core.next(arglist__32430));
    var p__32425 = cljs.core.rest(cljs.core.next(arglist__32430));
    return data__delegate($elem, k, p__32425)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__32431 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__32431)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__32432 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__32432)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__32433 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__32433)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__32434 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__32434)
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
  var hide__delegate = function($elem, p__32435) {
    var vec__32436__32437 = p__32435;
    var speed__32438 = cljs.core.nth.call(null, vec__32436__32437, 0, null);
    var on_finish__32439 = cljs.core.nth.call(null, vec__32436__32437, 1, null);
    return $elem.hide(speed__32438, on_finish__32439)
  };
  var hide = function($elem, var_args) {
    var p__32435 = null;
    if(goog.isDef(var_args)) {
      p__32435 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__32435)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__32440) {
    var $elem = cljs.core.first(arglist__32440);
    var p__32435 = cljs.core.rest(arglist__32440);
    return hide__delegate($elem, p__32435)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__32441) {
    var vec__32442__32443 = p__32441;
    var speed__32444 = cljs.core.nth.call(null, vec__32442__32443, 0, null);
    var on_finish__32445 = cljs.core.nth.call(null, vec__32442__32443, 1, null);
    return $elem.show(speed__32444, on_finish__32445)
  };
  var show = function($elem, var_args) {
    var p__32441 = null;
    if(goog.isDef(var_args)) {
      p__32441 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__32441)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__32446) {
    var $elem = cljs.core.first(arglist__32446);
    var p__32441 = cljs.core.rest(arglist__32446);
    return show__delegate($elem, p__32441)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__32447) {
    var vec__32448__32449 = p__32447;
    var speed__32450 = cljs.core.nth.call(null, vec__32448__32449, 0, null);
    var on_finish__32451 = cljs.core.nth.call(null, vec__32448__32449, 1, null);
    return $elem.toggle(speed__32450, on_finish__32451)
  };
  var toggle = function($elem, var_args) {
    var p__32447 = null;
    if(goog.isDef(var_args)) {
      p__32447 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__32447)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__32452) {
    var $elem = cljs.core.first(arglist__32452);
    var p__32447 = cljs.core.rest(arglist__32452);
    return toggle__delegate($elem, p__32447)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__32453) {
    var vec__32454__32455 = p__32453;
    var speed__32456 = cljs.core.nth.call(null, vec__32454__32455, 0, null);
    var on_finish__32457 = cljs.core.nth.call(null, vec__32454__32455, 1, null);
    return $elem.fadeOut(speed__32456, on_finish__32457)
  };
  var fade_out = function($elem, var_args) {
    var p__32453 = null;
    if(goog.isDef(var_args)) {
      p__32453 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__32453)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__32458) {
    var $elem = cljs.core.first(arglist__32458);
    var p__32453 = cljs.core.rest(arglist__32458);
    return fade_out__delegate($elem, p__32453)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__32459) {
    var vec__32460__32461 = p__32459;
    var speed__32462 = cljs.core.nth.call(null, vec__32460__32461, 0, null);
    var on_finish__32463 = cljs.core.nth.call(null, vec__32460__32461, 1, null);
    return $elem.fadeIn(speed__32462, on_finish__32463)
  };
  var fade_in = function($elem, var_args) {
    var p__32459 = null;
    if(goog.isDef(var_args)) {
      p__32459 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__32459)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__32464) {
    var $elem = cljs.core.first(arglist__32464);
    var p__32459 = cljs.core.rest(arglist__32464);
    return fade_in__delegate($elem, p__32459)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__32465) {
    var vec__32466__32467 = p__32465;
    var speed__32468 = cljs.core.nth.call(null, vec__32466__32467, 0, null);
    var on_finish__32469 = cljs.core.nth.call(null, vec__32466__32467, 1, null);
    return $elem.slideUp(speed__32468, on_finish__32469)
  };
  var slide_up = function($elem, var_args) {
    var p__32465 = null;
    if(goog.isDef(var_args)) {
      p__32465 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__32465)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__32470) {
    var $elem = cljs.core.first(arglist__32470);
    var p__32465 = cljs.core.rest(arglist__32470);
    return slide_up__delegate($elem, p__32465)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__32471) {
    var vec__32472__32473 = p__32471;
    var speed__32474 = cljs.core.nth.call(null, vec__32472__32473, 0, null);
    var on_finish__32475 = cljs.core.nth.call(null, vec__32472__32473, 1, null);
    return $elem.slideDown(speed__32474, on_finish__32475)
  };
  var slide_down = function($elem, var_args) {
    var p__32471 = null;
    if(goog.isDef(var_args)) {
      p__32471 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__32471)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__32476) {
    var $elem = cljs.core.first(arglist__32476);
    var p__32471 = cljs.core.rest(arglist__32476);
    return slide_down__delegate($elem, p__32471)
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
  var closest__delegate = function($elem, selector, p__32477) {
    var vec__32478__32479 = p__32477;
    var context__32480 = cljs.core.nth.call(null, vec__32478__32479, 0, null);
    return $elem.closest(selector, context__32480)
  };
  var closest = function($elem, selector, var_args) {
    var p__32477 = null;
    if(goog.isDef(var_args)) {
      p__32477 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__32477)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__32481) {
    var $elem = cljs.core.first(arglist__32481);
    var selector = cljs.core.first(cljs.core.next(arglist__32481));
    var p__32477 = cljs.core.rest(cljs.core.next(arglist__32481));
    return closest__delegate($elem, selector, p__32477)
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
  var val__delegate = function($elem, p__32482) {
    var vec__32483__32484 = p__32482;
    var v__32485 = cljs.core.nth.call(null, vec__32483__32484, 0, null);
    if(cljs.core.truth_(v__32485)) {
      return $elem.val(v__32485)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__32482 = null;
    if(goog.isDef(var_args)) {
      p__32482 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__32482)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__32486) {
    var $elem = cljs.core.first(arglist__32486);
    var p__32482 = cljs.core.rest(arglist__32486);
    return val__delegate($elem, p__32482)
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
jayq.core.xhr = function xhr(p__32487, content, callback) {
  var vec__32488__32489 = p__32487;
  var method__32490 = cljs.core.nth.call(null, vec__32488__32489, 0, null);
  var uri__32491 = cljs.core.nth.call(null, vec__32488__32489, 1, null);
  var params__32492 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__32490)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__32491, params__32492)
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
  var unbind__delegate = function($elem, ev, p__32493) {
    var vec__32494__32495 = p__32493;
    var func__32496 = cljs.core.nth.call(null, vec__32494__32495, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__32496)
  };
  var unbind = function($elem, ev, var_args) {
    var p__32493 = null;
    if(goog.isDef(var_args)) {
      p__32493 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__32493)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__32497) {
    var $elem = cljs.core.first(arglist__32497);
    var ev = cljs.core.first(cljs.core.next(arglist__32497));
    var p__32493 = cljs.core.rest(cljs.core.next(arglist__32497));
    return unbind__delegate($elem, ev, p__32493)
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
  var on__delegate = function($elem, events, p__32498) {
    var vec__32499__32500 = p__32498;
    var sel__32501 = cljs.core.nth.call(null, vec__32499__32500, 0, null);
    var data__32502 = cljs.core.nth.call(null, vec__32499__32500, 1, null);
    var handler__32503 = cljs.core.nth.call(null, vec__32499__32500, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__32501), data__32502, handler__32503)
  };
  var on = function($elem, events, var_args) {
    var p__32498 = null;
    if(goog.isDef(var_args)) {
      p__32498 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__32498)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__32504) {
    var $elem = cljs.core.first(arglist__32504);
    var events = cljs.core.first(cljs.core.next(arglist__32504));
    var p__32498 = cljs.core.rest(cljs.core.next(arglist__32504));
    return on__delegate($elem, events, p__32498)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__32505) {
    var vec__32506__32507 = p__32505;
    var sel__32508 = cljs.core.nth.call(null, vec__32506__32507, 0, null);
    var data__32509 = cljs.core.nth.call(null, vec__32506__32507, 1, null);
    var handler__32510 = cljs.core.nth.call(null, vec__32506__32507, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__32508), data__32509, handler__32510)
  };
  var one = function($elem, events, var_args) {
    var p__32505 = null;
    if(goog.isDef(var_args)) {
      p__32505 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__32505)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__32511) {
    var $elem = cljs.core.first(arglist__32511);
    var events = cljs.core.first(cljs.core.next(arglist__32511));
    var p__32505 = cljs.core.rest(cljs.core.next(arglist__32511));
    return one__delegate($elem, events, p__32505)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__32512) {
    var vec__32513__32514 = p__32512;
    var sel__32515 = cljs.core.nth.call(null, vec__32513__32514, 0, null);
    var handler__32516 = cljs.core.nth.call(null, vec__32513__32514, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__32515), handler__32516)
  };
  var off = function($elem, events, var_args) {
    var p__32512 = null;
    if(goog.isDef(var_args)) {
      p__32512 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__32512)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__32517) {
    var $elem = cljs.core.first(arglist__32517);
    var events = cljs.core.first(cljs.core.next(arglist__32517));
    var p__32512 = cljs.core.rest(cljs.core.next(arglist__32517));
    return off__delegate($elem, events, p__32512)
  };
  off.cljs$lang$arity$variadic = off__delegate;
  return off
}();
jayq.core.prevent = function prevent(e) {
  return e.preventDefault()
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
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
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
        return cljs.core.reduce.call(null, function(m, p__32567) {
          var vec__32568__32569 = p__32567;
          var k__32570 = cljs.core.nth.call(null, vec__32568__32569, 0, null);
          var v__32571 = cljs.core.nth.call(null, vec__32568__32569, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__32570), clj__GT_js.call(null, v__32571))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
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
goog.provide("cljs.reader");
goog.require("cljs.core");
goog.require("goog.string");
void 0;
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3822__auto____32573 = reader;
    if(and__3822__auto____32573) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____32573
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3824__auto____32574 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3824__auto____32574) {
        return or__3824__auto____32574
      }else {
        var or__3824__auto____32575 = cljs.reader.read_char["_"];
        if(or__3824__auto____32575) {
          return or__3824__auto____32575
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____32576 = reader;
    if(and__3822__auto____32576) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____32576
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3824__auto____32577 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3824__auto____32577) {
        return or__3824__auto____32577
      }else {
        var or__3824__auto____32578 = cljs.reader.unread["_"];
        if(or__3824__auto____32578) {
          return or__3824__auto____32578
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
void 0;
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$lang$type = true;
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.reader.StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var this__32579 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__32579.buffer_atom))) {
    var idx__32580 = cljs.core.deref.call(null, this__32579.index_atom);
    cljs.core.swap_BANG_.call(null, this__32579.index_atom, cljs.core.inc);
    return this__32579.s[idx__32580]
  }else {
    var buf__32581 = cljs.core.deref.call(null, this__32579.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__32579.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__32581)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__32582 = this;
  return cljs.core.swap_BANG_.call(null, this__32582.buffer_atom, function(p1__32572_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__32572_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____32583 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3824__auto____32583)) {
    return or__3824__auto____32583
  }else {
    return"," === ch
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric.call(null, ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return";" === ch
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3824__auto____32584 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____32584) {
    return or__3824__auto____32584
  }else {
    var and__3822__auto____32586 = function() {
      var or__3824__auto____32585 = "+" === initch;
      if(or__3824__auto____32585) {
        return or__3824__auto____32585
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____32586)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__32587 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__32587);
        return next_ch__32587
      }())
    }else {
      return and__3822__auto____32586
    }
  }
};
void 0;
void 0;
void 0;
cljs.reader.reader_error = function() {
  var reader_error__delegate = function(rdr, msg) {
    throw cljs.core.apply.call(null, cljs.core.str, msg);
  };
  var reader_error = function(rdr, var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return reader_error__delegate.call(this, rdr, msg)
  };
  reader_error.cljs$lang$maxFixedArity = 1;
  reader_error.cljs$lang$applyTo = function(arglist__32588) {
    var rdr = cljs.core.first(arglist__32588);
    var msg = cljs.core.rest(arglist__32588);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____32589 = ch != "#";
  if(and__3822__auto____32589) {
    var and__3822__auto____32590 = ch != "'";
    if(and__3822__auto____32590) {
      var and__3822__auto____32591 = ch != ":";
      if(and__3822__auto____32591) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____32591
      }
    }else {
      return and__3822__auto____32590
    }
  }else {
    return and__3822__auto____32589
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__32592 = new goog.string.StringBuffer(initch);
  var ch__32593 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____32594 = ch__32593 == null;
      if(or__3824__auto____32594) {
        return or__3824__auto____32594
      }else {
        var or__3824__auto____32595 = cljs.reader.whitespace_QMARK_.call(null, ch__32593);
        if(or__3824__auto____32595) {
          return or__3824__auto____32595
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__32593)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__32593);
      return sb__32592.toString()
    }else {
      var G__32596 = function() {
        sb__32592.append(ch__32593);
        return sb__32592
      }();
      var G__32597 = cljs.reader.read_char.call(null, rdr);
      sb__32592 = G__32596;
      ch__32593 = G__32597;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__32598 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____32599 = ch__32598 === "n";
      if(or__3824__auto____32599) {
        return or__3824__auto____32599
      }else {
        var or__3824__auto____32600 = ch__32598 === "r";
        if(or__3824__auto____32600) {
          return or__3824__auto____32600
        }else {
          return ch__32598 == null
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
  var matches__32601 = re.exec(s);
  if(matches__32601 != null) {
    if(matches__32601.length === 1) {
      return matches__32601[0]
    }else {
      return matches__32601
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__32602 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__32603 = groups__32602[2];
  if(!function() {
    var or__3824__auto____32604 = group3__32603 == null;
    if(or__3824__auto____32604) {
      return or__3824__auto____32604
    }else {
      return group3__32603.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__32605 = "-" === groups__32602[1] ? -1 : 1;
    var a__32606 = cljs.core.truth_(groups__32602[3]) ? [groups__32602[3], 10] : cljs.core.truth_(groups__32602[4]) ? [groups__32602[4], 16] : cljs.core.truth_(groups__32602[5]) ? [groups__32602[5], 8] : cljs.core.truth_(groups__32602[7]) ? [groups__32602[7], parseInt(groups__32602[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__32607 = a__32606[0];
    var radix__32608 = a__32606[1];
    if(n__32607 == null) {
      return null
    }else {
      return negate__32605 * parseInt(n__32607, radix__32608)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__32609 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__32610 = groups__32609[1];
  var denominator__32611 = groups__32609[2];
  return parseInt(numinator__32610) / parseInt(denominator__32611)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__32612 = re.exec(s);
  if(function() {
    var and__3822__auto____32613 = matches__32612 != null;
    if(and__3822__auto____32613) {
      return matches__32612[0] === s
    }else {
      return and__3822__auto____32613
    }
  }()) {
    if(matches__32612.length === 1) {
      return matches__32612[0]
    }else {
      return matches__32612
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
  if("f" === c) {
    return"\u000c"
  }else {
    if("b" === c) {
      return"\u0008"
    }else {
      if('"' === c) {
        return'"'
      }else {
        if("\\" === c) {
          return"\\"
        }else {
          if("n" === c) {
            return"\n"
          }else {
            if("r" === c) {
              return"\r"
            }else {
              if("t" === c) {
                return"\t"
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
cljs.reader.read_unicode_char = function read_unicode_char(reader, initch) {
  return cljs.reader.reader_error.call(null, reader, "Unicode characters not supported by reader (yet)")
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__32614 = cljs.reader.read_char.call(null, reader);
  var mapresult__32615 = cljs.reader.escape_char_map.call(null, ch__32614);
  if(cljs.core.truth_(mapresult__32615)) {
    return mapresult__32615
  }else {
    if(function() {
      var or__3824__auto____32616 = "u" === ch__32614;
      if(or__3824__auto____32616) {
        return or__3824__auto____32616
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__32614)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__32614)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__32614)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__32617 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__32617))) {
      var G__32618 = cljs.reader.read_char.call(null, rdr);
      ch__32617 = G__32618;
      continue
    }else {
      return ch__32617
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__32619 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__32620 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__32620)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__32620) {
      return cljs.core.persistent_BANG_.call(null, a__32619)
    }else {
      var temp__3971__auto____32621 = cljs.reader.macros.call(null, ch__32620);
      if(cljs.core.truth_(temp__3971__auto____32621)) {
        var macrofn__32622 = temp__3971__auto____32621;
        var mret__32623 = macrofn__32622.call(null, rdr, ch__32620);
        var G__32625 = mret__32623 === rdr ? a__32619 : cljs.core.conj_BANG_.call(null, a__32619, mret__32623);
        a__32619 = G__32625;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__32620);
        var o__32624 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__32626 = o__32624 === rdr ? a__32619 : cljs.core.conj_BANG_.call(null, a__32619, o__32624);
        a__32619 = G__32626;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
void 0;
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch__32627 = cljs.reader.read_char.call(null, rdr);
  var dm__32628 = cljs.reader.dispatch_macros.call(null, ch__32627);
  if(cljs.core.truth_(dm__32628)) {
    return dm__32628.call(null, rdr, _)
  }else {
    var temp__3971__auto____32629 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__32627);
    if(cljs.core.truth_(temp__3971__auto____32629)) {
      var obj__32630 = temp__3971__auto____32629;
      return obj__32630
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__32627)
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
  var l__32631 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__32631))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__32631)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__32632 = new goog.string.StringBuffer(initch);
  var ch__32633 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____32634 = ch__32633 == null;
      if(or__3824__auto____32634) {
        return or__3824__auto____32634
      }else {
        var or__3824__auto____32635 = cljs.reader.whitespace_QMARK_.call(null, ch__32633);
        if(or__3824__auto____32635) {
          return or__3824__auto____32635
        }else {
          return cljs.reader.macros.call(null, ch__32633)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__32633);
      var s__32636 = buffer__32632.toString();
      var or__3824__auto____32637 = cljs.reader.match_number.call(null, s__32636);
      if(cljs.core.truth_(or__3824__auto____32637)) {
        return or__3824__auto____32637
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__32636, "]")
      }
    }else {
      var G__32638 = function() {
        buffer__32632.append(ch__32633);
        return buffer__32632
      }();
      var G__32639 = cljs.reader.read_char.call(null, reader);
      buffer__32632 = G__32638;
      ch__32633 = G__32639;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__32640 = new goog.string.StringBuffer;
  var ch__32641 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__32641 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__32641) {
        var G__32642 = function() {
          buffer__32640.append(cljs.reader.escape_char.call(null, buffer__32640, reader));
          return buffer__32640
        }();
        var G__32643 = cljs.reader.read_char.call(null, reader);
        buffer__32640 = G__32642;
        ch__32641 = G__32643;
        continue
      }else {
        if('"' === ch__32641) {
          return buffer__32640.toString()
        }else {
          if("\ufdd0'default") {
            var G__32644 = function() {
              buffer__32640.append(ch__32641);
              return buffer__32640
            }();
            var G__32645 = cljs.reader.read_char.call(null, reader);
            buffer__32640 = G__32644;
            ch__32641 = G__32645;
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
cljs.reader.special_symbols = cljs.core.ObjMap.fromObject(["nil", "true", "false"], {"nil":null, "true":true, "false":false});
cljs.reader.read_symbol = function read_symbol(reader, initch) {
  var token__32646 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__32646, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__32646, 0, token__32646.indexOf("/")), cljs.core.subs.call(null, token__32646, token__32646.indexOf("/") + 1, token__32646.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__32646, cljs.core.symbol.call(null, token__32646))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__32647 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__32648 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__32647);
  var token__32649 = a__32648[0];
  var ns__32650 = a__32648[1];
  var name__32651 = a__32648[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____32653 = function() {
      var and__3822__auto____32652 = !(void 0 === ns__32650);
      if(and__3822__auto____32652) {
        return ns__32650.substring(ns__32650.length - 2, ns__32650.length) === ":/"
      }else {
        return and__3822__auto____32652
      }
    }();
    if(cljs.core.truth_(or__3824__auto____32653)) {
      return or__3824__auto____32653
    }else {
      var or__3824__auto____32654 = name__32651[name__32651.length - 1] === ":";
      if(or__3824__auto____32654) {
        return or__3824__auto____32654
      }else {
        return!(token__32649.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__32649)
  }else {
    if(cljs.core.truth_(ns__32650)) {
      return cljs.core.keyword.call(null, ns__32650.substring(0, ns__32650.indexOf("/")), name__32651)
    }else {
      return cljs.core.keyword.call(null, token__32649)
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
  var m__32655 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__32655)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__32656 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__32657__32658 = o__32656;
    if(G__32657__32658 != null) {
      if(function() {
        var or__3824__auto____32659 = G__32657__32658.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____32659) {
          return or__3824__auto____32659
        }else {
          return G__32657__32658.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__32657__32658.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__32657__32658)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__32657__32658)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__32656, cljs.core.merge.call(null, cljs.core.meta.call(null, o__32656), m__32655))
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
  if("@" === c) {
    return cljs.reader.wrapping_reader.call(null, "\ufdd1'deref")
  }else {
    if("`" === c) {
      return cljs.reader.not_implemented
    }else {
      if('"' === c) {
        return cljs.reader.read_string_STAR_
      }else {
        if("#" === c) {
          return cljs.reader.read_dispatch
        }else {
          if("%" === c) {
            return cljs.reader.not_implemented
          }else {
            if("'" === c) {
              return cljs.reader.wrapping_reader.call(null, "\ufdd1'quote")
            }else {
              if("(" === c) {
                return cljs.reader.read_list
              }else {
                if(")" === c) {
                  return cljs.reader.read_unmatched_delimiter
                }else {
                  if(":" === c) {
                    return cljs.reader.read_keyword
                  }else {
                    if(";" === c) {
                      return cljs.reader.not_implemented
                    }else {
                      if("[" === c) {
                        return cljs.reader.read_vector
                      }else {
                        if("{" === c) {
                          return cljs.reader.read_map
                        }else {
                          if("\\" === c) {
                            return cljs.reader.read_char
                          }else {
                            if("]" === c) {
                              return cljs.reader.read_unmatched_delimiter
                            }else {
                              if("}" === c) {
                                return cljs.reader.read_unmatched_delimiter
                              }else {
                                if("^" === c) {
                                  return cljs.reader.read_meta
                                }else {
                                  if("~" === c) {
                                    return cljs.reader.not_implemented
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
  if("_" === s) {
    return cljs.reader.read_discard
  }else {
    if("!" === s) {
      return cljs.reader.read_comment
    }else {
      if('"' === s) {
        return cljs.reader.read_regex
      }else {
        if("<" === s) {
          return cljs.reader.throwing_reader.call(null, "Unreadable form")
        }else {
          if("{" === s) {
            return cljs.reader.read_set
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
    var ch__32660 = cljs.reader.read_char.call(null, reader);
    if(ch__32660 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__32660)) {
        var G__32663 = reader;
        var G__32664 = eof_is_error;
        var G__32665 = sentinel;
        var G__32666 = is_recursive;
        reader = G__32663;
        eof_is_error = G__32664;
        sentinel = G__32665;
        is_recursive = G__32666;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__32660)) {
          var G__32667 = cljs.reader.read_comment.call(null, reader, ch__32660);
          var G__32668 = eof_is_error;
          var G__32669 = sentinel;
          var G__32670 = is_recursive;
          reader = G__32667;
          eof_is_error = G__32668;
          sentinel = G__32669;
          is_recursive = G__32670;
          continue
        }else {
          if("\ufdd0'else") {
            var f__32661 = cljs.reader.macros.call(null, ch__32660);
            var res__32662 = cljs.core.truth_(f__32661) ? f__32661.call(null, reader, ch__32660) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__32660) ? cljs.reader.read_number.call(null, reader, ch__32660) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__32660) : null;
            if(res__32662 === reader) {
              var G__32671 = reader;
              var G__32672 = eof_is_error;
              var G__32673 = sentinel;
              var G__32674 = is_recursive;
              reader = G__32671;
              eof_is_error = G__32672;
              sentinel = G__32673;
              is_recursive = G__32674;
              continue
            }else {
              return res__32662
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
  var r__32675 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__32675, true, null, false)
};
cljs.reader.read_date = function read_date(str) {
  return new Date(Date.parse.call(null, str))
};
cljs.reader.read_queue = function read_queue(elems) {
  if(cljs.core.vector_QMARK_.call(null, elems)) {
    return cljs.core.into.call(null, cljs.core.PersistentQueue.EMPTY, elems)
  }else {
    return cljs.reader.reader_error.call(null, null, "Queue literal expects a vector for its elements.")
  }
};
cljs.reader._STAR_tag_table_STAR_ = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["inst", "uuid", "queue"], {"inst":cljs.core.identity, "uuid":cljs.core.identity, "queue":cljs.reader.read_queue}));
cljs.reader.maybe_read_tagged_type = function maybe_read_tagged_type(rdr, initch) {
  var tag__32676 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__32677 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__32678 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__32676));
  if(cljs.core.truth_(pfn__32678)) {
    return pfn__32678.call(null, form__32677)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__32676), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__32679 = cljs.core.name.call(null, tag);
  var old_parser__32680 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__32679);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__32679, f);
  return old_parser__32680
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
goog.provide("fetch.core");
goog.require("cljs.core");
goog.require("goog.net.XhrIo");
goog.require("clojure.string");
goog.require("fetch.util");
goog.require("cljs.reader");
goog.require("goog.events");
goog.require("goog.Uri.QueryData");
goog.require("goog.structs");
fetch.core.__GT_method = function __GT_method(m) {
  return clojure.string.upper_case.call(null, cljs.core.name.call(null, m))
};
fetch.core.parse_route = function parse_route(route) {
  if(cljs.core.string_QMARK_.call(null, route)) {
    return cljs.core.PersistentVector.fromArray(["GET", route])
  }else {
    if(cljs.core.vector_QMARK_.call(null, route)) {
      var vec__32548__32549 = route;
      var m__32550 = cljs.core.nth.call(null, vec__32548__32549, 0, null);
      var u__32551 = cljs.core.nth.call(null, vec__32548__32549, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__32550), u__32551])
    }else {
      if("\ufdd0'else") {
        return cljs.core.PersistentVector.fromArray(["GET", route])
      }else {
        return null
      }
    }
  }
};
fetch.core.__GT_data = function __GT_data(d) {
  var cur__32552 = fetch.util.clj__GT_js.call(null, d);
  var query__32553 = goog.Uri.QueryData.createFromMap.call(null, new goog.structs.Map(cur__32552));
  return[cljs.core.str(query__32553)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__32554 = req.getResponseText();
      return callback.call(null, data__32554)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__32555) {
    var vec__32556__32557 = p__32555;
    var opts__32558 = cljs.core.nth.call(null, vec__32556__32557, 0, null);
    var req__32560 = new goog.net.XhrIo;
    var vec__32559__32561 = fetch.core.parse_route.call(null, route);
    var method__32562 = cljs.core.nth.call(null, vec__32559__32561, 0, null);
    var uri__32563 = cljs.core.nth.call(null, vec__32559__32561, 1, null);
    var data__32564 = fetch.core.__GT_data.call(null, content);
    var callback__32565 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__32565)) {
      goog.events.listen.call(null, req__32560, goog.net.EventType.COMPLETE, function() {
        return callback__32565.call(null, req__32560)
      })
    }else {
    }
    return req__32560.send(uri__32563, method__32562, data__32564, cljs.core.truth_(opts__32558) ? fetch.util.clj__GT_js.call(null, opts__32558) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__32555 = null;
    if(goog.isDef(var_args)) {
      p__32555 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__32555)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__32566) {
    var route = cljs.core.first(arglist__32566);
    var content = cljs.core.first(cljs.core.next(arglist__32566));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__32566)));
    var p__32555 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__32566)));
    return xhr__delegate(route, content, callback, p__32555)
  };
  xhr.cljs$lang$arity$variadic = xhr__delegate;
  return xhr
}();
goog.provide("fetch.remotes");
goog.require("cljs.core");
goog.require("fetch.core");
goog.require("cljs.reader");
fetch.remotes.remote_uri = "/_fetch";
fetch.remotes.remote_callback = function remote_callback(remote, params, callback) {
  return fetch.core.xhr.call(null, cljs.core.PersistentVector.fromArray(["\ufdd0'post", fetch.remotes.remote_uri]), cljs.core.ObjMap.fromObject(["\ufdd0'remote", "\ufdd0'params"], {"\ufdd0'remote":remote, "\ufdd0'params":cljs.core.pr_str.call(null, params)}), cljs.core.truth_(callback) ? function(data) {
    var data__32547 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__32547))
  } : null)
};
goog.provide("webrot.client.main");
goog.require("cljs.core");
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
webrot.client.main.params = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
webrot.client.main.busy = cljs.core.atom.call(null, true);
webrot.client.main.coords_from_event = function coords_from_event(event) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":event.offsetX, "\ufdd0'y":event.offsetY})
};
webrot.client.main.form_params = function form_params() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'lut", "\ufdd0'cut-off"], {"\ufdd0'lut":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #lut :selected")), "\ufdd0'cut-off":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #cut-off :selected"))})
};
webrot.client.main.redraw = function redraw(args) {
  if(cljs.core.truth_(cljs.core.compare_and_set_BANG_.call(null, webrot.client.main.busy, false, true))) {
    var me__4730 = this;
    jayq.core.show.call(null, webrot.client.main.$spinner);
    cljs.core.swap_BANG_.call(null, webrot.client.main.params, cljs.core.ObjMap.fromObject([], {}), args);
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
    return alert([cljs.core.str("Dropped: "), cljs.core.str(ui.offset.top), cljs.core.str(","), cljs.core.str(ui.offset.left)].join(""))
  });
  jayq.core.bind.call(null, webrot.client.main.$img, "\ufdd0'load", function() {
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.not);
    return jayq.core.hide.call(null, webrot.client.main.$spinner)
  });
  jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__4731 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, event));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__4731]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_in, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__4732 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":400, "\ufdd0'y":300}));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__4732]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_out, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__4733 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null));
    return fetch.remotes.remote_callback.call(null, "zoom-out", cljs.core.PersistentVector.fromArray([merged_params__4733]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$refresh, "\ufdd0'click", function(event) {
    event.preventDefault();
    return webrot.client.main.redraw.call(null, cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null)))
  });
  return jayq.core.bind.call(null, webrot.client.main.$initial, "\ufdd0'click", function(event) {
    event.preventDefault();
    return webrot.client.main.redraw.call(null, webrot.client.main.form_params.call(null))
  })
});
