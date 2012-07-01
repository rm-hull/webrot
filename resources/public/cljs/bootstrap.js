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
    var G__13570__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__13570 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13570__delegate.call(this, array, i, idxs)
    };
    G__13570.cljs$lang$maxFixedArity = 2;
    G__13570.cljs$lang$applyTo = function(arglist__13571) {
      var array = cljs.core.first(arglist__13571);
      var i = cljs.core.first(cljs.core.next(arglist__13571));
      var idxs = cljs.core.rest(cljs.core.next(arglist__13571));
      return G__13570__delegate(array, i, idxs)
    };
    G__13570.cljs$lang$arity$variadic = G__13570__delegate;
    return G__13570
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
      var and__3822__auto____13572 = this$;
      if(and__3822__auto____13572) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____13572
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____13573 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13573) {
          return or__3824__auto____13573
        }else {
          var or__3824__auto____13574 = cljs.core._invoke["_"];
          if(or__3824__auto____13574) {
            return or__3824__auto____13574
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____13575 = this$;
      if(and__3822__auto____13575) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____13575
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____13576 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13576) {
          return or__3824__auto____13576
        }else {
          var or__3824__auto____13577 = cljs.core._invoke["_"];
          if(or__3824__auto____13577) {
            return or__3824__auto____13577
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____13578 = this$;
      if(and__3822__auto____13578) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____13578
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____13579 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13579) {
          return or__3824__auto____13579
        }else {
          var or__3824__auto____13580 = cljs.core._invoke["_"];
          if(or__3824__auto____13580) {
            return or__3824__auto____13580
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____13581 = this$;
      if(and__3822__auto____13581) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____13581
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____13582 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13582) {
          return or__3824__auto____13582
        }else {
          var or__3824__auto____13583 = cljs.core._invoke["_"];
          if(or__3824__auto____13583) {
            return or__3824__auto____13583
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____13584 = this$;
      if(and__3822__auto____13584) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____13584
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____13585 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13585) {
          return or__3824__auto____13585
        }else {
          var or__3824__auto____13586 = cljs.core._invoke["_"];
          if(or__3824__auto____13586) {
            return or__3824__auto____13586
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____13587 = this$;
      if(and__3822__auto____13587) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____13587
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____13588 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13588) {
          return or__3824__auto____13588
        }else {
          var or__3824__auto____13589 = cljs.core._invoke["_"];
          if(or__3824__auto____13589) {
            return or__3824__auto____13589
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____13590 = this$;
      if(and__3822__auto____13590) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____13590
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____13591 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13591) {
          return or__3824__auto____13591
        }else {
          var or__3824__auto____13592 = cljs.core._invoke["_"];
          if(or__3824__auto____13592) {
            return or__3824__auto____13592
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____13593 = this$;
      if(and__3822__auto____13593) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____13593
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____13594 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13594) {
          return or__3824__auto____13594
        }else {
          var or__3824__auto____13595 = cljs.core._invoke["_"];
          if(or__3824__auto____13595) {
            return or__3824__auto____13595
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____13596 = this$;
      if(and__3822__auto____13596) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____13596
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____13597 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13597) {
          return or__3824__auto____13597
        }else {
          var or__3824__auto____13598 = cljs.core._invoke["_"];
          if(or__3824__auto____13598) {
            return or__3824__auto____13598
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____13599 = this$;
      if(and__3822__auto____13599) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____13599
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____13600 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13600) {
          return or__3824__auto____13600
        }else {
          var or__3824__auto____13601 = cljs.core._invoke["_"];
          if(or__3824__auto____13601) {
            return or__3824__auto____13601
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____13602 = this$;
      if(and__3822__auto____13602) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____13602
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____13603 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13603) {
          return or__3824__auto____13603
        }else {
          var or__3824__auto____13604 = cljs.core._invoke["_"];
          if(or__3824__auto____13604) {
            return or__3824__auto____13604
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____13605 = this$;
      if(and__3822__auto____13605) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____13605
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____13606 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13606) {
          return or__3824__auto____13606
        }else {
          var or__3824__auto____13607 = cljs.core._invoke["_"];
          if(or__3824__auto____13607) {
            return or__3824__auto____13607
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____13608 = this$;
      if(and__3822__auto____13608) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____13608
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____13609 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13609) {
          return or__3824__auto____13609
        }else {
          var or__3824__auto____13610 = cljs.core._invoke["_"];
          if(or__3824__auto____13610) {
            return or__3824__auto____13610
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____13611 = this$;
      if(and__3822__auto____13611) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____13611
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____13612 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13612) {
          return or__3824__auto____13612
        }else {
          var or__3824__auto____13613 = cljs.core._invoke["_"];
          if(or__3824__auto____13613) {
            return or__3824__auto____13613
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____13614 = this$;
      if(and__3822__auto____13614) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____13614
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____13615 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13615) {
          return or__3824__auto____13615
        }else {
          var or__3824__auto____13616 = cljs.core._invoke["_"];
          if(or__3824__auto____13616) {
            return or__3824__auto____13616
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____13617 = this$;
      if(and__3822__auto____13617) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____13617
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____13618 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13618) {
          return or__3824__auto____13618
        }else {
          var or__3824__auto____13619 = cljs.core._invoke["_"];
          if(or__3824__auto____13619) {
            return or__3824__auto____13619
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____13620 = this$;
      if(and__3822__auto____13620) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____13620
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____13621 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13621) {
          return or__3824__auto____13621
        }else {
          var or__3824__auto____13622 = cljs.core._invoke["_"];
          if(or__3824__auto____13622) {
            return or__3824__auto____13622
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____13623 = this$;
      if(and__3822__auto____13623) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____13623
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____13624 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13624) {
          return or__3824__auto____13624
        }else {
          var or__3824__auto____13625 = cljs.core._invoke["_"];
          if(or__3824__auto____13625) {
            return or__3824__auto____13625
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____13626 = this$;
      if(and__3822__auto____13626) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____13626
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____13627 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13627) {
          return or__3824__auto____13627
        }else {
          var or__3824__auto____13628 = cljs.core._invoke["_"];
          if(or__3824__auto____13628) {
            return or__3824__auto____13628
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____13629 = this$;
      if(and__3822__auto____13629) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____13629
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____13630 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13630) {
          return or__3824__auto____13630
        }else {
          var or__3824__auto____13631 = cljs.core._invoke["_"];
          if(or__3824__auto____13631) {
            return or__3824__auto____13631
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____13632 = this$;
      if(and__3822__auto____13632) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____13632
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____13633 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____13633) {
          return or__3824__auto____13633
        }else {
          var or__3824__auto____13634 = cljs.core._invoke["_"];
          if(or__3824__auto____13634) {
            return or__3824__auto____13634
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
    var and__3822__auto____13635 = coll;
    if(and__3822__auto____13635) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____13635
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13636 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13636) {
        return or__3824__auto____13636
      }else {
        var or__3824__auto____13637 = cljs.core._count["_"];
        if(or__3824__auto____13637) {
          return or__3824__auto____13637
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
    var and__3822__auto____13638 = coll;
    if(and__3822__auto____13638) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____13638
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13639 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13639) {
        return or__3824__auto____13639
      }else {
        var or__3824__auto____13640 = cljs.core._empty["_"];
        if(or__3824__auto____13640) {
          return or__3824__auto____13640
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
    var and__3822__auto____13641 = coll;
    if(and__3822__auto____13641) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____13641
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____13642 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13642) {
        return or__3824__auto____13642
      }else {
        var or__3824__auto____13643 = cljs.core._conj["_"];
        if(or__3824__auto____13643) {
          return or__3824__auto____13643
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
      var and__3822__auto____13644 = coll;
      if(and__3822__auto____13644) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____13644
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____13645 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____13645) {
          return or__3824__auto____13645
        }else {
          var or__3824__auto____13646 = cljs.core._nth["_"];
          if(or__3824__auto____13646) {
            return or__3824__auto____13646
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____13647 = coll;
      if(and__3822__auto____13647) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____13647
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____13648 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____13648) {
          return or__3824__auto____13648
        }else {
          var or__3824__auto____13649 = cljs.core._nth["_"];
          if(or__3824__auto____13649) {
            return or__3824__auto____13649
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
    var and__3822__auto____13650 = coll;
    if(and__3822__auto____13650) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____13650
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13651 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13651) {
        return or__3824__auto____13651
      }else {
        var or__3824__auto____13652 = cljs.core._first["_"];
        if(or__3824__auto____13652) {
          return or__3824__auto____13652
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____13653 = coll;
    if(and__3822__auto____13653) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____13653
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13654 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13654) {
        return or__3824__auto____13654
      }else {
        var or__3824__auto____13655 = cljs.core._rest["_"];
        if(or__3824__auto____13655) {
          return or__3824__auto____13655
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
      var and__3822__auto____13656 = o;
      if(and__3822__auto____13656) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____13656
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____13657 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____13657) {
          return or__3824__auto____13657
        }else {
          var or__3824__auto____13658 = cljs.core._lookup["_"];
          if(or__3824__auto____13658) {
            return or__3824__auto____13658
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____13659 = o;
      if(and__3822__auto____13659) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____13659
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____13660 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____13660) {
          return or__3824__auto____13660
        }else {
          var or__3824__auto____13661 = cljs.core._lookup["_"];
          if(or__3824__auto____13661) {
            return or__3824__auto____13661
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
    var and__3822__auto____13662 = coll;
    if(and__3822__auto____13662) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____13662
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____13663 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13663) {
        return or__3824__auto____13663
      }else {
        var or__3824__auto____13664 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____13664) {
          return or__3824__auto____13664
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____13665 = coll;
    if(and__3822__auto____13665) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____13665
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____13666 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13666) {
        return or__3824__auto____13666
      }else {
        var or__3824__auto____13667 = cljs.core._assoc["_"];
        if(or__3824__auto____13667) {
          return or__3824__auto____13667
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
    var and__3822__auto____13668 = coll;
    if(and__3822__auto____13668) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____13668
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____13669 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13669) {
        return or__3824__auto____13669
      }else {
        var or__3824__auto____13670 = cljs.core._dissoc["_"];
        if(or__3824__auto____13670) {
          return or__3824__auto____13670
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
    var and__3822__auto____13671 = coll;
    if(and__3822__auto____13671) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____13671
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13672 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13672) {
        return or__3824__auto____13672
      }else {
        var or__3824__auto____13673 = cljs.core._key["_"];
        if(or__3824__auto____13673) {
          return or__3824__auto____13673
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____13674 = coll;
    if(and__3822__auto____13674) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____13674
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13675 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13675) {
        return or__3824__auto____13675
      }else {
        var or__3824__auto____13676 = cljs.core._val["_"];
        if(or__3824__auto____13676) {
          return or__3824__auto____13676
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
    var and__3822__auto____13677 = coll;
    if(and__3822__auto____13677) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____13677
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____13678 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13678) {
        return or__3824__auto____13678
      }else {
        var or__3824__auto____13679 = cljs.core._disjoin["_"];
        if(or__3824__auto____13679) {
          return or__3824__auto____13679
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
    var and__3822__auto____13680 = coll;
    if(and__3822__auto____13680) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____13680
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13681 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13681) {
        return or__3824__auto____13681
      }else {
        var or__3824__auto____13682 = cljs.core._peek["_"];
        if(or__3824__auto____13682) {
          return or__3824__auto____13682
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____13683 = coll;
    if(and__3822__auto____13683) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____13683
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13684 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13684) {
        return or__3824__auto____13684
      }else {
        var or__3824__auto____13685 = cljs.core._pop["_"];
        if(or__3824__auto____13685) {
          return or__3824__auto____13685
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
    var and__3822__auto____13686 = coll;
    if(and__3822__auto____13686) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____13686
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____13687 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13687) {
        return or__3824__auto____13687
      }else {
        var or__3824__auto____13688 = cljs.core._assoc_n["_"];
        if(or__3824__auto____13688) {
          return or__3824__auto____13688
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
    var and__3822__auto____13689 = o;
    if(and__3822__auto____13689) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____13689
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____13690 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____13690) {
        return or__3824__auto____13690
      }else {
        var or__3824__auto____13691 = cljs.core._deref["_"];
        if(or__3824__auto____13691) {
          return or__3824__auto____13691
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
    var and__3822__auto____13692 = o;
    if(and__3822__auto____13692) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____13692
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____13693 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____13693) {
        return or__3824__auto____13693
      }else {
        var or__3824__auto____13694 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____13694) {
          return or__3824__auto____13694
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
    var and__3822__auto____13695 = o;
    if(and__3822__auto____13695) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____13695
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____13696 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____13696) {
        return or__3824__auto____13696
      }else {
        var or__3824__auto____13697 = cljs.core._meta["_"];
        if(or__3824__auto____13697) {
          return or__3824__auto____13697
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
    var and__3822__auto____13698 = o;
    if(and__3822__auto____13698) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____13698
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____13699 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____13699) {
        return or__3824__auto____13699
      }else {
        var or__3824__auto____13700 = cljs.core._with_meta["_"];
        if(or__3824__auto____13700) {
          return or__3824__auto____13700
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
      var and__3822__auto____13701 = coll;
      if(and__3822__auto____13701) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____13701
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____13702 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____13702) {
          return or__3824__auto____13702
        }else {
          var or__3824__auto____13703 = cljs.core._reduce["_"];
          if(or__3824__auto____13703) {
            return or__3824__auto____13703
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____13704 = coll;
      if(and__3822__auto____13704) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____13704
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____13705 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____13705) {
          return or__3824__auto____13705
        }else {
          var or__3824__auto____13706 = cljs.core._reduce["_"];
          if(or__3824__auto____13706) {
            return or__3824__auto____13706
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
    var and__3822__auto____13707 = coll;
    if(and__3822__auto____13707) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____13707
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____13708 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13708) {
        return or__3824__auto____13708
      }else {
        var or__3824__auto____13709 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____13709) {
          return or__3824__auto____13709
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
    var and__3822__auto____13710 = o;
    if(and__3822__auto____13710) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____13710
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____13711 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____13711) {
        return or__3824__auto____13711
      }else {
        var or__3824__auto____13712 = cljs.core._equiv["_"];
        if(or__3824__auto____13712) {
          return or__3824__auto____13712
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
    var and__3822__auto____13713 = o;
    if(and__3822__auto____13713) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____13713
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____13714 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____13714) {
        return or__3824__auto____13714
      }else {
        var or__3824__auto____13715 = cljs.core._hash["_"];
        if(or__3824__auto____13715) {
          return or__3824__auto____13715
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
    var and__3822__auto____13716 = o;
    if(and__3822__auto____13716) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____13716
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____13717 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____13717) {
        return or__3824__auto____13717
      }else {
        var or__3824__auto____13718 = cljs.core._seq["_"];
        if(or__3824__auto____13718) {
          return or__3824__auto____13718
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
    var and__3822__auto____13719 = coll;
    if(and__3822__auto____13719) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____13719
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13720 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13720) {
        return or__3824__auto____13720
      }else {
        var or__3824__auto____13721 = cljs.core._rseq["_"];
        if(or__3824__auto____13721) {
          return or__3824__auto____13721
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
    var and__3822__auto____13722 = coll;
    if(and__3822__auto____13722) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____13722
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____13723 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13723) {
        return or__3824__auto____13723
      }else {
        var or__3824__auto____13724 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____13724) {
          return or__3824__auto____13724
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____13725 = coll;
    if(and__3822__auto____13725) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____13725
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____13726 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13726) {
        return or__3824__auto____13726
      }else {
        var or__3824__auto____13727 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____13727) {
          return or__3824__auto____13727
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____13728 = coll;
    if(and__3822__auto____13728) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____13728
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____13729 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13729) {
        return or__3824__auto____13729
      }else {
        var or__3824__auto____13730 = cljs.core._entry_key["_"];
        if(or__3824__auto____13730) {
          return or__3824__auto____13730
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____13731 = coll;
    if(and__3822__auto____13731) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____13731
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13732 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13732) {
        return or__3824__auto____13732
      }else {
        var or__3824__auto____13733 = cljs.core._comparator["_"];
        if(or__3824__auto____13733) {
          return or__3824__auto____13733
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
    var and__3822__auto____13734 = o;
    if(and__3822__auto____13734) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____13734
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____13735 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____13735) {
        return or__3824__auto____13735
      }else {
        var or__3824__auto____13736 = cljs.core._pr_seq["_"];
        if(or__3824__auto____13736) {
          return or__3824__auto____13736
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
    var and__3822__auto____13737 = d;
    if(and__3822__auto____13737) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____13737
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____13738 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____13738) {
        return or__3824__auto____13738
      }else {
        var or__3824__auto____13739 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____13739) {
          return or__3824__auto____13739
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
    var and__3822__auto____13740 = this$;
    if(and__3822__auto____13740) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____13740
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____13741 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____13741) {
        return or__3824__auto____13741
      }else {
        var or__3824__auto____13742 = cljs.core._notify_watches["_"];
        if(or__3824__auto____13742) {
          return or__3824__auto____13742
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____13743 = this$;
    if(and__3822__auto____13743) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____13743
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____13744 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____13744) {
        return or__3824__auto____13744
      }else {
        var or__3824__auto____13745 = cljs.core._add_watch["_"];
        if(or__3824__auto____13745) {
          return or__3824__auto____13745
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____13746 = this$;
    if(and__3822__auto____13746) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____13746
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____13747 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____13747) {
        return or__3824__auto____13747
      }else {
        var or__3824__auto____13748 = cljs.core._remove_watch["_"];
        if(or__3824__auto____13748) {
          return or__3824__auto____13748
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
    var and__3822__auto____13749 = coll;
    if(and__3822__auto____13749) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____13749
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____13750 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____13750) {
        return or__3824__auto____13750
      }else {
        var or__3824__auto____13751 = cljs.core._as_transient["_"];
        if(or__3824__auto____13751) {
          return or__3824__auto____13751
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
    var and__3822__auto____13752 = tcoll;
    if(and__3822__auto____13752) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____13752
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____13753 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13753) {
        return or__3824__auto____13753
      }else {
        var or__3824__auto____13754 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____13754) {
          return or__3824__auto____13754
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____13755 = tcoll;
    if(and__3822__auto____13755) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____13755
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____13756 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13756) {
        return or__3824__auto____13756
      }else {
        var or__3824__auto____13757 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____13757) {
          return or__3824__auto____13757
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
    var and__3822__auto____13758 = tcoll;
    if(and__3822__auto____13758) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____13758
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____13759 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13759) {
        return or__3824__auto____13759
      }else {
        var or__3824__auto____13760 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____13760) {
          return or__3824__auto____13760
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
    var and__3822__auto____13761 = tcoll;
    if(and__3822__auto____13761) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____13761
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____13762 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13762) {
        return or__3824__auto____13762
      }else {
        var or__3824__auto____13763 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____13763) {
          return or__3824__auto____13763
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
    var and__3822__auto____13764 = tcoll;
    if(and__3822__auto____13764) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____13764
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____13765 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13765) {
        return or__3824__auto____13765
      }else {
        var or__3824__auto____13766 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____13766) {
          return or__3824__auto____13766
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____13767 = tcoll;
    if(and__3822__auto____13767) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____13767
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____13768 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13768) {
        return or__3824__auto____13768
      }else {
        var or__3824__auto____13769 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____13769) {
          return or__3824__auto____13769
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
    var and__3822__auto____13770 = tcoll;
    if(and__3822__auto____13770) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____13770
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____13771 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____13771) {
        return or__3824__auto____13771
      }else {
        var or__3824__auto____13772 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____13772) {
          return or__3824__auto____13772
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
    var or__3824__auto____13773 = x === y;
    if(or__3824__auto____13773) {
      return or__3824__auto____13773
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__13774__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13775 = y;
            var G__13776 = cljs.core.first.call(null, more);
            var G__13777 = cljs.core.next.call(null, more);
            x = G__13775;
            y = G__13776;
            more = G__13777;
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
    var G__13774 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13774__delegate.call(this, x, y, more)
    };
    G__13774.cljs$lang$maxFixedArity = 2;
    G__13774.cljs$lang$applyTo = function(arglist__13778) {
      var x = cljs.core.first(arglist__13778);
      var y = cljs.core.first(cljs.core.next(arglist__13778));
      var more = cljs.core.rest(cljs.core.next(arglist__13778));
      return G__13774__delegate(x, y, more)
    };
    G__13774.cljs$lang$arity$variadic = G__13774__delegate;
    return G__13774
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
    var or__3824__auto____13779 = x == null;
    if(or__3824__auto____13779) {
      return or__3824__auto____13779
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
  var G__13780 = null;
  var G__13780__2 = function(o, k) {
    return null
  };
  var G__13780__3 = function(o, k, not_found) {
    return not_found
  };
  G__13780 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13780__2.call(this, o, k);
      case 3:
        return G__13780__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13780
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
  var G__13781 = null;
  var G__13781__2 = function(_, f) {
    return f.call(null)
  };
  var G__13781__3 = function(_, f, start) {
    return start
  };
  G__13781 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__13781__2.call(this, _, f);
      case 3:
        return G__13781__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13781
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
  var G__13782 = null;
  var G__13782__2 = function(_, n) {
    return null
  };
  var G__13782__3 = function(_, n, not_found) {
    return not_found
  };
  G__13782 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13782__2.call(this, _, n);
      case 3:
        return G__13782__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13782
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
      var val__13783 = cljs.core._nth.call(null, cicoll, 0);
      var n__13784 = 1;
      while(true) {
        if(n__13784 < cljs.core._count.call(null, cicoll)) {
          var nval__13785 = f.call(null, val__13783, cljs.core._nth.call(null, cicoll, n__13784));
          if(cljs.core.reduced_QMARK_.call(null, nval__13785)) {
            return cljs.core.deref.call(null, nval__13785)
          }else {
            var G__13792 = nval__13785;
            var G__13793 = n__13784 + 1;
            val__13783 = G__13792;
            n__13784 = G__13793;
            continue
          }
        }else {
          return val__13783
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__13786 = val;
    var n__13787 = 0;
    while(true) {
      if(n__13787 < cljs.core._count.call(null, cicoll)) {
        var nval__13788 = f.call(null, val__13786, cljs.core._nth.call(null, cicoll, n__13787));
        if(cljs.core.reduced_QMARK_.call(null, nval__13788)) {
          return cljs.core.deref.call(null, nval__13788)
        }else {
          var G__13794 = nval__13788;
          var G__13795 = n__13787 + 1;
          val__13786 = G__13794;
          n__13787 = G__13795;
          continue
        }
      }else {
        return val__13786
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__13789 = val;
    var n__13790 = idx;
    while(true) {
      if(n__13790 < cljs.core._count.call(null, cicoll)) {
        var nval__13791 = f.call(null, val__13789, cljs.core._nth.call(null, cicoll, n__13790));
        if(cljs.core.reduced_QMARK_.call(null, nval__13791)) {
          return cljs.core.deref.call(null, nval__13791)
        }else {
          var G__13796 = nval__13791;
          var G__13797 = n__13790 + 1;
          val__13789 = G__13796;
          n__13790 = G__13797;
          continue
        }
      }else {
        return val__13789
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
  var this__13798 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13799 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__13800 = this;
  var this$__13801 = this;
  return cljs.core.pr_str.call(null, this$__13801)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__13802 = this;
  if(cljs.core.counted_QMARK_.call(null, this__13802.a)) {
    return cljs.core.ci_reduce.call(null, this__13802.a, f, this__13802.a[this__13802.i], this__13802.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__13802.a[this__13802.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__13803 = this;
  if(cljs.core.counted_QMARK_.call(null, this__13803.a)) {
    return cljs.core.ci_reduce.call(null, this__13803.a, f, start, this__13803.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__13804 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__13805 = this;
  return this__13805.a.length - this__13805.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__13806 = this;
  return this__13806.a[this__13806.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__13807 = this;
  if(this__13807.i + 1 < this__13807.a.length) {
    return new cljs.core.IndexedSeq(this__13807.a, this__13807.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13808 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__13809 = this;
  var i__13810 = n + this__13809.i;
  if(i__13810 < this__13809.a.length) {
    return this__13809.a[i__13810]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__13811 = this;
  var i__13812 = n + this__13811.i;
  if(i__13812 < this__13811.a.length) {
    return this__13811.a[i__13812]
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
  var G__13813 = null;
  var G__13813__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__13813__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__13813 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__13813__2.call(this, array, f);
      case 3:
        return G__13813__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13813
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__13814 = null;
  var G__13814__2 = function(array, k) {
    return array[k]
  };
  var G__13814__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__13814 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13814__2.call(this, array, k);
      case 3:
        return G__13814__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13814
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__13815 = null;
  var G__13815__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__13815__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__13815 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13815__2.call(this, array, n);
      case 3:
        return G__13815__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13815
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
      var G__13816__13817 = coll;
      if(G__13816__13817 != null) {
        if(function() {
          var or__3824__auto____13818 = G__13816__13817.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____13818) {
            return or__3824__auto____13818
          }else {
            return G__13816__13817.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__13816__13817.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__13816__13817)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__13816__13817)
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
      var G__13819__13820 = coll;
      if(G__13819__13820 != null) {
        if(function() {
          var or__3824__auto____13821 = G__13819__13820.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____13821) {
            return or__3824__auto____13821
          }else {
            return G__13819__13820.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__13819__13820.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13819__13820)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13819__13820)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__13822 = cljs.core.seq.call(null, coll);
      if(s__13822 != null) {
        return cljs.core._first.call(null, s__13822)
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
      var G__13823__13824 = coll;
      if(G__13823__13824 != null) {
        if(function() {
          var or__3824__auto____13825 = G__13823__13824.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____13825) {
            return or__3824__auto____13825
          }else {
            return G__13823__13824.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__13823__13824.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13823__13824)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13823__13824)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__13826 = cljs.core.seq.call(null, coll);
      if(s__13826 != null) {
        return cljs.core._rest.call(null, s__13826)
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
      var G__13827__13828 = coll;
      if(G__13827__13828 != null) {
        if(function() {
          var or__3824__auto____13829 = G__13827__13828.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____13829) {
            return or__3824__auto____13829
          }else {
            return G__13827__13828.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__13827__13828.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13827__13828)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13827__13828)
      }
    }()) {
      var coll__13830 = cljs.core._rest.call(null, coll);
      if(coll__13830 != null) {
        if(function() {
          var G__13831__13832 = coll__13830;
          if(G__13831__13832 != null) {
            if(function() {
              var or__3824__auto____13833 = G__13831__13832.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____13833) {
                return or__3824__auto____13833
              }else {
                return G__13831__13832.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__13831__13832.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__13831__13832)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__13831__13832)
          }
        }()) {
          return coll__13830
        }else {
          return cljs.core._seq.call(null, coll__13830)
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
      var G__13834 = cljs.core.next.call(null, s);
      s = G__13834;
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
    var G__13835__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__13836 = conj.call(null, coll, x);
          var G__13837 = cljs.core.first.call(null, xs);
          var G__13838 = cljs.core.next.call(null, xs);
          coll = G__13836;
          x = G__13837;
          xs = G__13838;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__13835 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13835__delegate.call(this, coll, x, xs)
    };
    G__13835.cljs$lang$maxFixedArity = 2;
    G__13835.cljs$lang$applyTo = function(arglist__13839) {
      var coll = cljs.core.first(arglist__13839);
      var x = cljs.core.first(cljs.core.next(arglist__13839));
      var xs = cljs.core.rest(cljs.core.next(arglist__13839));
      return G__13835__delegate(coll, x, xs)
    };
    G__13835.cljs$lang$arity$variadic = G__13835__delegate;
    return G__13835
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
  var s__13840 = cljs.core.seq.call(null, coll);
  var acc__13841 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__13840)) {
      return acc__13841 + cljs.core._count.call(null, s__13840)
    }else {
      var G__13842 = cljs.core.next.call(null, s__13840);
      var G__13843 = acc__13841 + 1;
      s__13840 = G__13842;
      acc__13841 = G__13843;
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
        var G__13844__13845 = coll;
        if(G__13844__13845 != null) {
          if(function() {
            var or__3824__auto____13846 = G__13844__13845.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____13846) {
              return or__3824__auto____13846
            }else {
              return G__13844__13845.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__13844__13845.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13844__13845)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13844__13845)
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
        var G__13847__13848 = coll;
        if(G__13847__13848 != null) {
          if(function() {
            var or__3824__auto____13849 = G__13847__13848.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____13849) {
              return or__3824__auto____13849
            }else {
              return G__13847__13848.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__13847__13848.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13847__13848)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13847__13848)
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
    var G__13851__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__13850 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__13852 = ret__13850;
          var G__13853 = cljs.core.first.call(null, kvs);
          var G__13854 = cljs.core.second.call(null, kvs);
          var G__13855 = cljs.core.nnext.call(null, kvs);
          coll = G__13852;
          k = G__13853;
          v = G__13854;
          kvs = G__13855;
          continue
        }else {
          return ret__13850
        }
        break
      }
    };
    var G__13851 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13851__delegate.call(this, coll, k, v, kvs)
    };
    G__13851.cljs$lang$maxFixedArity = 3;
    G__13851.cljs$lang$applyTo = function(arglist__13856) {
      var coll = cljs.core.first(arglist__13856);
      var k = cljs.core.first(cljs.core.next(arglist__13856));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13856)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13856)));
      return G__13851__delegate(coll, k, v, kvs)
    };
    G__13851.cljs$lang$arity$variadic = G__13851__delegate;
    return G__13851
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
    var G__13858__delegate = function(coll, k, ks) {
      while(true) {
        var ret__13857 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__13859 = ret__13857;
          var G__13860 = cljs.core.first.call(null, ks);
          var G__13861 = cljs.core.next.call(null, ks);
          coll = G__13859;
          k = G__13860;
          ks = G__13861;
          continue
        }else {
          return ret__13857
        }
        break
      }
    };
    var G__13858 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13858__delegate.call(this, coll, k, ks)
    };
    G__13858.cljs$lang$maxFixedArity = 2;
    G__13858.cljs$lang$applyTo = function(arglist__13862) {
      var coll = cljs.core.first(arglist__13862);
      var k = cljs.core.first(cljs.core.next(arglist__13862));
      var ks = cljs.core.rest(cljs.core.next(arglist__13862));
      return G__13858__delegate(coll, k, ks)
    };
    G__13858.cljs$lang$arity$variadic = G__13858__delegate;
    return G__13858
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
    var G__13863__13864 = o;
    if(G__13863__13864 != null) {
      if(function() {
        var or__3824__auto____13865 = G__13863__13864.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____13865) {
          return or__3824__auto____13865
        }else {
          return G__13863__13864.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__13863__13864.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13863__13864)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13863__13864)
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
    var G__13867__delegate = function(coll, k, ks) {
      while(true) {
        var ret__13866 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__13868 = ret__13866;
          var G__13869 = cljs.core.first.call(null, ks);
          var G__13870 = cljs.core.next.call(null, ks);
          coll = G__13868;
          k = G__13869;
          ks = G__13870;
          continue
        }else {
          return ret__13866
        }
        break
      }
    };
    var G__13867 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13867__delegate.call(this, coll, k, ks)
    };
    G__13867.cljs$lang$maxFixedArity = 2;
    G__13867.cljs$lang$applyTo = function(arglist__13871) {
      var coll = cljs.core.first(arglist__13871);
      var k = cljs.core.first(cljs.core.next(arglist__13871));
      var ks = cljs.core.rest(cljs.core.next(arglist__13871));
      return G__13867__delegate(coll, k, ks)
    };
    G__13867.cljs$lang$arity$variadic = G__13867__delegate;
    return G__13867
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
    var G__13872__13873 = x;
    if(G__13872__13873 != null) {
      if(function() {
        var or__3824__auto____13874 = G__13872__13873.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____13874) {
          return or__3824__auto____13874
        }else {
          return G__13872__13873.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__13872__13873.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__13872__13873)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__13872__13873)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__13875__13876 = x;
    if(G__13875__13876 != null) {
      if(function() {
        var or__3824__auto____13877 = G__13875__13876.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____13877) {
          return or__3824__auto____13877
        }else {
          return G__13875__13876.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__13875__13876.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__13875__13876)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__13875__13876)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__13878__13879 = x;
  if(G__13878__13879 != null) {
    if(function() {
      var or__3824__auto____13880 = G__13878__13879.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____13880) {
        return or__3824__auto____13880
      }else {
        return G__13878__13879.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__13878__13879.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__13878__13879)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__13878__13879)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__13881__13882 = x;
  if(G__13881__13882 != null) {
    if(function() {
      var or__3824__auto____13883 = G__13881__13882.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____13883) {
        return or__3824__auto____13883
      }else {
        return G__13881__13882.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__13881__13882.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__13881__13882)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__13881__13882)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__13884__13885 = x;
  if(G__13884__13885 != null) {
    if(function() {
      var or__3824__auto____13886 = G__13884__13885.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____13886) {
        return or__3824__auto____13886
      }else {
        return G__13884__13885.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__13884__13885.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__13884__13885)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__13884__13885)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__13887__13888 = x;
  if(G__13887__13888 != null) {
    if(function() {
      var or__3824__auto____13889 = G__13887__13888.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____13889) {
        return or__3824__auto____13889
      }else {
        return G__13887__13888.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__13887__13888.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13887__13888)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__13887__13888)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__13890__13891 = x;
  if(G__13890__13891 != null) {
    if(function() {
      var or__3824__auto____13892 = G__13890__13891.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____13892) {
        return or__3824__auto____13892
      }else {
        return G__13890__13891.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__13890__13891.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13890__13891)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13890__13891)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__13893__13894 = x;
    if(G__13893__13894 != null) {
      if(function() {
        var or__3824__auto____13895 = G__13893__13894.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____13895) {
          return or__3824__auto____13895
        }else {
          return G__13893__13894.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__13893__13894.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__13893__13894)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__13893__13894)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__13896__13897 = x;
  if(G__13896__13897 != null) {
    if(function() {
      var or__3824__auto____13898 = G__13896__13897.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____13898) {
        return or__3824__auto____13898
      }else {
        return G__13896__13897.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__13896__13897.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__13896__13897)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__13896__13897)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__13899__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__13899 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__13899__delegate.call(this, keyvals)
    };
    G__13899.cljs$lang$maxFixedArity = 0;
    G__13899.cljs$lang$applyTo = function(arglist__13900) {
      var keyvals = cljs.core.seq(arglist__13900);
      return G__13899__delegate(keyvals)
    };
    G__13899.cljs$lang$arity$variadic = G__13899__delegate;
    return G__13899
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
  var keys__13901 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__13901.push(key)
  });
  return keys__13901
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__13902 = i;
  var j__13903 = j;
  var len__13904 = len;
  while(true) {
    if(len__13904 === 0) {
      return to
    }else {
      to[j__13903] = from[i__13902];
      var G__13905 = i__13902 + 1;
      var G__13906 = j__13903 + 1;
      var G__13907 = len__13904 - 1;
      i__13902 = G__13905;
      j__13903 = G__13906;
      len__13904 = G__13907;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__13908 = i + (len - 1);
  var j__13909 = j + (len - 1);
  var len__13910 = len;
  while(true) {
    if(len__13910 === 0) {
      return to
    }else {
      to[j__13909] = from[i__13908];
      var G__13911 = i__13908 - 1;
      var G__13912 = j__13909 - 1;
      var G__13913 = len__13910 - 1;
      i__13908 = G__13911;
      j__13909 = G__13912;
      len__13910 = G__13913;
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
    var G__13914__13915 = s;
    if(G__13914__13915 != null) {
      if(function() {
        var or__3824__auto____13916 = G__13914__13915.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____13916) {
          return or__3824__auto____13916
        }else {
          return G__13914__13915.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__13914__13915.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13914__13915)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__13914__13915)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__13917__13918 = s;
  if(G__13917__13918 != null) {
    if(function() {
      var or__3824__auto____13919 = G__13917__13918.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____13919) {
        return or__3824__auto____13919
      }else {
        return G__13917__13918.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__13917__13918.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__13917__13918)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__13917__13918)
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
  var and__3822__auto____13920 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____13920)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____13921 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____13921) {
        return or__3824__auto____13921
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____13920
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____13922 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____13922)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____13922
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____13923 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____13923)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____13923
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____13924 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____13924) {
    return or__3824__auto____13924
  }else {
    var G__13925__13926 = f;
    if(G__13925__13926 != null) {
      if(function() {
        var or__3824__auto____13927 = G__13925__13926.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____13927) {
          return or__3824__auto____13927
        }else {
          return G__13925__13926.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__13925__13926.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__13925__13926)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__13925__13926)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____13928 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____13928) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____13928
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
    var and__3822__auto____13929 = coll;
    if(cljs.core.truth_(and__3822__auto____13929)) {
      var and__3822__auto____13930 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____13930) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____13930
      }
    }else {
      return and__3822__auto____13929
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
    var G__13935__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__13931 = cljs.core.set([y, x]);
        var xs__13932 = more;
        while(true) {
          var x__13933 = cljs.core.first.call(null, xs__13932);
          var etc__13934 = cljs.core.next.call(null, xs__13932);
          if(cljs.core.truth_(xs__13932)) {
            if(cljs.core.contains_QMARK_.call(null, s__13931, x__13933)) {
              return false
            }else {
              var G__13936 = cljs.core.conj.call(null, s__13931, x__13933);
              var G__13937 = etc__13934;
              s__13931 = G__13936;
              xs__13932 = G__13937;
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
    var G__13935 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13935__delegate.call(this, x, y, more)
    };
    G__13935.cljs$lang$maxFixedArity = 2;
    G__13935.cljs$lang$applyTo = function(arglist__13938) {
      var x = cljs.core.first(arglist__13938);
      var y = cljs.core.first(cljs.core.next(arglist__13938));
      var more = cljs.core.rest(cljs.core.next(arglist__13938));
      return G__13935__delegate(x, y, more)
    };
    G__13935.cljs$lang$arity$variadic = G__13935__delegate;
    return G__13935
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
      var r__13939 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__13939)) {
        return r__13939
      }else {
        if(cljs.core.truth_(r__13939)) {
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
      var a__13940 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__13940, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__13940)
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
    var temp__3971__auto____13941 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____13941)) {
      var s__13942 = temp__3971__auto____13941;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__13942), cljs.core.next.call(null, s__13942))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__13943 = val;
    var coll__13944 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__13944)) {
        var nval__13945 = f.call(null, val__13943, cljs.core.first.call(null, coll__13944));
        if(cljs.core.reduced_QMARK_.call(null, nval__13945)) {
          return cljs.core.deref.call(null, nval__13945)
        }else {
          var G__13946 = nval__13945;
          var G__13947 = cljs.core.next.call(null, coll__13944);
          val__13943 = G__13946;
          coll__13944 = G__13947;
          continue
        }
      }else {
        return val__13943
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
      var G__13948__13949 = coll;
      if(G__13948__13949 != null) {
        if(function() {
          var or__3824__auto____13950 = G__13948__13949.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____13950) {
            return or__3824__auto____13950
          }else {
            return G__13948__13949.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__13948__13949.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13948__13949)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13948__13949)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__13951__13952 = coll;
      if(G__13951__13952 != null) {
        if(function() {
          var or__3824__auto____13953 = G__13951__13952.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____13953) {
            return or__3824__auto____13953
          }else {
            return G__13951__13952.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__13951__13952.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13951__13952)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__13951__13952)
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
  var this__13954 = this;
  return this__13954.val
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
    var G__13955__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__13955 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13955__delegate.call(this, x, y, more)
    };
    G__13955.cljs$lang$maxFixedArity = 2;
    G__13955.cljs$lang$applyTo = function(arglist__13956) {
      var x = cljs.core.first(arglist__13956);
      var y = cljs.core.first(cljs.core.next(arglist__13956));
      var more = cljs.core.rest(cljs.core.next(arglist__13956));
      return G__13955__delegate(x, y, more)
    };
    G__13955.cljs$lang$arity$variadic = G__13955__delegate;
    return G__13955
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
    var G__13957__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__13957 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13957__delegate.call(this, x, y, more)
    };
    G__13957.cljs$lang$maxFixedArity = 2;
    G__13957.cljs$lang$applyTo = function(arglist__13958) {
      var x = cljs.core.first(arglist__13958);
      var y = cljs.core.first(cljs.core.next(arglist__13958));
      var more = cljs.core.rest(cljs.core.next(arglist__13958));
      return G__13957__delegate(x, y, more)
    };
    G__13957.cljs$lang$arity$variadic = G__13957__delegate;
    return G__13957
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
    var G__13959__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__13959 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13959__delegate.call(this, x, y, more)
    };
    G__13959.cljs$lang$maxFixedArity = 2;
    G__13959.cljs$lang$applyTo = function(arglist__13960) {
      var x = cljs.core.first(arglist__13960);
      var y = cljs.core.first(cljs.core.next(arglist__13960));
      var more = cljs.core.rest(cljs.core.next(arglist__13960));
      return G__13959__delegate(x, y, more)
    };
    G__13959.cljs$lang$arity$variadic = G__13959__delegate;
    return G__13959
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
    var G__13961__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__13961 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13961__delegate.call(this, x, y, more)
    };
    G__13961.cljs$lang$maxFixedArity = 2;
    G__13961.cljs$lang$applyTo = function(arglist__13962) {
      var x = cljs.core.first(arglist__13962);
      var y = cljs.core.first(cljs.core.next(arglist__13962));
      var more = cljs.core.rest(cljs.core.next(arglist__13962));
      return G__13961__delegate(x, y, more)
    };
    G__13961.cljs$lang$arity$variadic = G__13961__delegate;
    return G__13961
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
    var G__13963__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13964 = y;
            var G__13965 = cljs.core.first.call(null, more);
            var G__13966 = cljs.core.next.call(null, more);
            x = G__13964;
            y = G__13965;
            more = G__13966;
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
    var G__13963 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13963__delegate.call(this, x, y, more)
    };
    G__13963.cljs$lang$maxFixedArity = 2;
    G__13963.cljs$lang$applyTo = function(arglist__13967) {
      var x = cljs.core.first(arglist__13967);
      var y = cljs.core.first(cljs.core.next(arglist__13967));
      var more = cljs.core.rest(cljs.core.next(arglist__13967));
      return G__13963__delegate(x, y, more)
    };
    G__13963.cljs$lang$arity$variadic = G__13963__delegate;
    return G__13963
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
    var G__13968__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13969 = y;
            var G__13970 = cljs.core.first.call(null, more);
            var G__13971 = cljs.core.next.call(null, more);
            x = G__13969;
            y = G__13970;
            more = G__13971;
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
    var G__13968 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13968__delegate.call(this, x, y, more)
    };
    G__13968.cljs$lang$maxFixedArity = 2;
    G__13968.cljs$lang$applyTo = function(arglist__13972) {
      var x = cljs.core.first(arglist__13972);
      var y = cljs.core.first(cljs.core.next(arglist__13972));
      var more = cljs.core.rest(cljs.core.next(arglist__13972));
      return G__13968__delegate(x, y, more)
    };
    G__13968.cljs$lang$arity$variadic = G__13968__delegate;
    return G__13968
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
    var G__13973__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13974 = y;
            var G__13975 = cljs.core.first.call(null, more);
            var G__13976 = cljs.core.next.call(null, more);
            x = G__13974;
            y = G__13975;
            more = G__13976;
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
    var G__13973 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13973__delegate.call(this, x, y, more)
    };
    G__13973.cljs$lang$maxFixedArity = 2;
    G__13973.cljs$lang$applyTo = function(arglist__13977) {
      var x = cljs.core.first(arglist__13977);
      var y = cljs.core.first(cljs.core.next(arglist__13977));
      var more = cljs.core.rest(cljs.core.next(arglist__13977));
      return G__13973__delegate(x, y, more)
    };
    G__13973.cljs$lang$arity$variadic = G__13973__delegate;
    return G__13973
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
    var G__13978__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13979 = y;
            var G__13980 = cljs.core.first.call(null, more);
            var G__13981 = cljs.core.next.call(null, more);
            x = G__13979;
            y = G__13980;
            more = G__13981;
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
    var G__13978 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13978__delegate.call(this, x, y, more)
    };
    G__13978.cljs$lang$maxFixedArity = 2;
    G__13978.cljs$lang$applyTo = function(arglist__13982) {
      var x = cljs.core.first(arglist__13982);
      var y = cljs.core.first(cljs.core.next(arglist__13982));
      var more = cljs.core.rest(cljs.core.next(arglist__13982));
      return G__13978__delegate(x, y, more)
    };
    G__13978.cljs$lang$arity$variadic = G__13978__delegate;
    return G__13978
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
    var G__13983__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__13983 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13983__delegate.call(this, x, y, more)
    };
    G__13983.cljs$lang$maxFixedArity = 2;
    G__13983.cljs$lang$applyTo = function(arglist__13984) {
      var x = cljs.core.first(arglist__13984);
      var y = cljs.core.first(cljs.core.next(arglist__13984));
      var more = cljs.core.rest(cljs.core.next(arglist__13984));
      return G__13983__delegate(x, y, more)
    };
    G__13983.cljs$lang$arity$variadic = G__13983__delegate;
    return G__13983
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
    var G__13985__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__13985 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13985__delegate.call(this, x, y, more)
    };
    G__13985.cljs$lang$maxFixedArity = 2;
    G__13985.cljs$lang$applyTo = function(arglist__13986) {
      var x = cljs.core.first(arglist__13986);
      var y = cljs.core.first(cljs.core.next(arglist__13986));
      var more = cljs.core.rest(cljs.core.next(arglist__13986));
      return G__13985__delegate(x, y, more)
    };
    G__13985.cljs$lang$arity$variadic = G__13985__delegate;
    return G__13985
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
  var rem__13987 = n % d;
  return cljs.core.fix.call(null, (n - rem__13987) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__13988 = cljs.core.quot.call(null, n, d);
  return n - d * q__13988
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
  var c__13989 = 0;
  var n__13990 = n;
  while(true) {
    if(n__13990 === 0) {
      return c__13989
    }else {
      var G__13991 = c__13989 + 1;
      var G__13992 = n__13990 & n__13990 - 1;
      c__13989 = G__13991;
      n__13990 = G__13992;
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
    var G__13993__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__13994 = y;
            var G__13995 = cljs.core.first.call(null, more);
            var G__13996 = cljs.core.next.call(null, more);
            x = G__13994;
            y = G__13995;
            more = G__13996;
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
    var G__13993 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13993__delegate.call(this, x, y, more)
    };
    G__13993.cljs$lang$maxFixedArity = 2;
    G__13993.cljs$lang$applyTo = function(arglist__13997) {
      var x = cljs.core.first(arglist__13997);
      var y = cljs.core.first(cljs.core.next(arglist__13997));
      var more = cljs.core.rest(cljs.core.next(arglist__13997));
      return G__13993__delegate(x, y, more)
    };
    G__13993.cljs$lang$arity$variadic = G__13993__delegate;
    return G__13993
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
  var n__13998 = n;
  var xs__13999 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____14000 = xs__13999;
      if(cljs.core.truth_(and__3822__auto____14000)) {
        return n__13998 > 0
      }else {
        return and__3822__auto____14000
      }
    }())) {
      var G__14001 = n__13998 - 1;
      var G__14002 = cljs.core.next.call(null, xs__13999);
      n__13998 = G__14001;
      xs__13999 = G__14002;
      continue
    }else {
      return xs__13999
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
    var G__14003__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14004 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__14005 = cljs.core.next.call(null, more);
            sb = G__14004;
            more = G__14005;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__14003 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14003__delegate.call(this, x, ys)
    };
    G__14003.cljs$lang$maxFixedArity = 1;
    G__14003.cljs$lang$applyTo = function(arglist__14006) {
      var x = cljs.core.first(arglist__14006);
      var ys = cljs.core.rest(arglist__14006);
      return G__14003__delegate(x, ys)
    };
    G__14003.cljs$lang$arity$variadic = G__14003__delegate;
    return G__14003
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
    var G__14007__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__14008 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__14009 = cljs.core.next.call(null, more);
            sb = G__14008;
            more = G__14009;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__14007 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14007__delegate.call(this, x, ys)
    };
    G__14007.cljs$lang$maxFixedArity = 1;
    G__14007.cljs$lang$applyTo = function(arglist__14010) {
      var x = cljs.core.first(arglist__14010);
      var ys = cljs.core.rest(arglist__14010);
      return G__14007__delegate(x, ys)
    };
    G__14007.cljs$lang$arity$variadic = G__14007__delegate;
    return G__14007
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
    var xs__14011 = cljs.core.seq.call(null, x);
    var ys__14012 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__14011 == null) {
        return ys__14012 == null
      }else {
        if(ys__14012 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__14011), cljs.core.first.call(null, ys__14012))) {
            var G__14013 = cljs.core.next.call(null, xs__14011);
            var G__14014 = cljs.core.next.call(null, ys__14012);
            xs__14011 = G__14013;
            ys__14012 = G__14014;
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
  return cljs.core.reduce.call(null, function(p1__14015_SHARP_, p2__14016_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__14015_SHARP_, cljs.core.hash.call(null, p2__14016_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__14017 = 0;
  var s__14018 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__14018)) {
      var e__14019 = cljs.core.first.call(null, s__14018);
      var G__14020 = (h__14017 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__14019)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__14019)))) % 4503599627370496;
      var G__14021 = cljs.core.next.call(null, s__14018);
      h__14017 = G__14020;
      s__14018 = G__14021;
      continue
    }else {
      return h__14017
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__14022 = 0;
  var s__14023 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__14023)) {
      var e__14024 = cljs.core.first.call(null, s__14023);
      var G__14025 = (h__14022 + cljs.core.hash.call(null, e__14024)) % 4503599627370496;
      var G__14026 = cljs.core.next.call(null, s__14023);
      h__14022 = G__14025;
      s__14023 = G__14026;
      continue
    }else {
      return h__14022
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__14027__14028 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__14027__14028)) {
    var G__14030__14032 = cljs.core.first.call(null, G__14027__14028);
    var vec__14031__14033 = G__14030__14032;
    var key_name__14034 = cljs.core.nth.call(null, vec__14031__14033, 0, null);
    var f__14035 = cljs.core.nth.call(null, vec__14031__14033, 1, null);
    var G__14027__14036 = G__14027__14028;
    var G__14030__14037 = G__14030__14032;
    var G__14027__14038 = G__14027__14036;
    while(true) {
      var vec__14039__14040 = G__14030__14037;
      var key_name__14041 = cljs.core.nth.call(null, vec__14039__14040, 0, null);
      var f__14042 = cljs.core.nth.call(null, vec__14039__14040, 1, null);
      var G__14027__14043 = G__14027__14038;
      var str_name__14044 = cljs.core.name.call(null, key_name__14041);
      obj[str_name__14044] = f__14042;
      var temp__3974__auto____14045 = cljs.core.next.call(null, G__14027__14043);
      if(cljs.core.truth_(temp__3974__auto____14045)) {
        var G__14027__14046 = temp__3974__auto____14045;
        var G__14047 = cljs.core.first.call(null, G__14027__14046);
        var G__14048 = G__14027__14046;
        G__14030__14037 = G__14047;
        G__14027__14038 = G__14048;
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
  var this__14049 = this;
  var h__364__auto____14050 = this__14049.__hash;
  if(h__364__auto____14050 != null) {
    return h__364__auto____14050
  }else {
    var h__364__auto____14051 = cljs.core.hash_coll.call(null, coll);
    this__14049.__hash = h__364__auto____14051;
    return h__364__auto____14051
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14052 = this;
  return new cljs.core.List(this__14052.meta, o, coll, this__14052.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__14053 = this;
  var this$__14054 = this;
  return cljs.core.pr_str.call(null, this$__14054)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14055 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14056 = this;
  return this__14056.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14057 = this;
  return this__14057.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14058 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14059 = this;
  return this__14059.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14060 = this;
  return this__14060.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14061 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14062 = this;
  return new cljs.core.List(meta, this__14062.first, this__14062.rest, this__14062.count, this__14062.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14063 = this;
  return this__14063.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14064 = this;
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
  var this__14065 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14066 = this;
  return new cljs.core.List(this__14066.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__14067 = this;
  var this$__14068 = this;
  return cljs.core.pr_str.call(null, this$__14068)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14069 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14070 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14071 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14072 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14073 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14074 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14075 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14076 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14077 = this;
  return this__14077.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14078 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__14079__14080 = coll;
  if(G__14079__14080 != null) {
    if(function() {
      var or__3824__auto____14081 = G__14079__14080.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____14081) {
        return or__3824__auto____14081
      }else {
        return G__14079__14080.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__14079__14080.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14079__14080)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__14079__14080)
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
  list.cljs$lang$applyTo = function(arglist__14082) {
    var items = cljs.core.seq(arglist__14082);
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
  var this__14083 = this;
  var h__364__auto____14084 = this__14083.__hash;
  if(h__364__auto____14084 != null) {
    return h__364__auto____14084
  }else {
    var h__364__auto____14085 = cljs.core.hash_coll.call(null, coll);
    this__14083.__hash = h__364__auto____14085;
    return h__364__auto____14085
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14086 = this;
  return new cljs.core.Cons(null, o, coll, this__14086.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__14087 = this;
  var this$__14088 = this;
  return cljs.core.pr_str.call(null, this$__14088)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14089 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14090 = this;
  return this__14090.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14091 = this;
  if(this__14091.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__14091.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14092 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14093 = this;
  return new cljs.core.Cons(meta, this__14093.first, this__14093.rest, this__14093.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14094 = this;
  return this__14094.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14095 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14095.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____14096 = coll == null;
    if(or__3824__auto____14096) {
      return or__3824__auto____14096
    }else {
      var G__14097__14098 = coll;
      if(G__14097__14098 != null) {
        if(function() {
          var or__3824__auto____14099 = G__14097__14098.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____14099) {
            return or__3824__auto____14099
          }else {
            return G__14097__14098.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__14097__14098.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14097__14098)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__14097__14098)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__14100__14101 = x;
  if(G__14100__14101 != null) {
    if(function() {
      var or__3824__auto____14102 = G__14100__14101.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____14102) {
        return or__3824__auto____14102
      }else {
        return G__14100__14101.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__14100__14101.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14100__14101)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__14100__14101)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__14103 = null;
  var G__14103__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__14103__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__14103 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__14103__2.call(this, string, f);
      case 3:
        return G__14103__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14103
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__14104 = null;
  var G__14104__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__14104__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__14104 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14104__2.call(this, string, k);
      case 3:
        return G__14104__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14104
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__14105 = null;
  var G__14105__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__14105__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__14105 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14105__2.call(this, string, n);
      case 3:
        return G__14105__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14105
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
  var G__14114 = null;
  var G__14114__2 = function(tsym14108, coll) {
    var tsym14108__14110 = this;
    var this$__14111 = tsym14108__14110;
    return cljs.core.get.call(null, coll, this$__14111.toString())
  };
  var G__14114__3 = function(tsym14109, coll, not_found) {
    var tsym14109__14112 = this;
    var this$__14113 = tsym14109__14112;
    return cljs.core.get.call(null, coll, this$__14113.toString(), not_found)
  };
  G__14114 = function(tsym14109, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14114__2.call(this, tsym14109, coll);
      case 3:
        return G__14114__3.call(this, tsym14109, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14114
}();
String.prototype.apply = function(tsym14106, args14107) {
  return tsym14106.call.apply(tsym14106, [tsym14106].concat(cljs.core.aclone.call(null, args14107)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__14115 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__14115
  }else {
    lazy_seq.x = x__14115.call(null);
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
  var this__14116 = this;
  var h__364__auto____14117 = this__14116.__hash;
  if(h__364__auto____14117 != null) {
    return h__364__auto____14117
  }else {
    var h__364__auto____14118 = cljs.core.hash_coll.call(null, coll);
    this__14116.__hash = h__364__auto____14118;
    return h__364__auto____14118
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14119 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__14120 = this;
  var this$__14121 = this;
  return cljs.core.pr_str.call(null, this$__14121)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14122 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14123 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14124 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14125 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14126 = this;
  return new cljs.core.LazySeq(meta, this__14126.realized, this__14126.x, this__14126.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14127 = this;
  return this__14127.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14128 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14128.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__14129 = [];
  var s__14130 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__14130))) {
      ary__14129.push(cljs.core.first.call(null, s__14130));
      var G__14131 = cljs.core.next.call(null, s__14130);
      s__14130 = G__14131;
      continue
    }else {
      return ary__14129
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__14132 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__14133 = 0;
  var xs__14134 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__14134)) {
      ret__14132[i__14133] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__14134));
      var G__14135 = i__14133 + 1;
      var G__14136 = cljs.core.next.call(null, xs__14134);
      i__14133 = G__14135;
      xs__14134 = G__14136;
      continue
    }else {
    }
    break
  }
  return ret__14132
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
    var a__14137 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14138 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14139 = 0;
      var s__14140 = s__14138;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14141 = s__14140;
          if(cljs.core.truth_(and__3822__auto____14141)) {
            return i__14139 < size
          }else {
            return and__3822__auto____14141
          }
        }())) {
          a__14137[i__14139] = cljs.core.first.call(null, s__14140);
          var G__14144 = i__14139 + 1;
          var G__14145 = cljs.core.next.call(null, s__14140);
          i__14139 = G__14144;
          s__14140 = G__14145;
          continue
        }else {
          return a__14137
        }
        break
      }
    }else {
      var n__685__auto____14142 = size;
      var i__14143 = 0;
      while(true) {
        if(i__14143 < n__685__auto____14142) {
          a__14137[i__14143] = init_val_or_seq;
          var G__14146 = i__14143 + 1;
          i__14143 = G__14146;
          continue
        }else {
        }
        break
      }
      return a__14137
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
    var a__14147 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14148 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14149 = 0;
      var s__14150 = s__14148;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14151 = s__14150;
          if(cljs.core.truth_(and__3822__auto____14151)) {
            return i__14149 < size
          }else {
            return and__3822__auto____14151
          }
        }())) {
          a__14147[i__14149] = cljs.core.first.call(null, s__14150);
          var G__14154 = i__14149 + 1;
          var G__14155 = cljs.core.next.call(null, s__14150);
          i__14149 = G__14154;
          s__14150 = G__14155;
          continue
        }else {
          return a__14147
        }
        break
      }
    }else {
      var n__685__auto____14152 = size;
      var i__14153 = 0;
      while(true) {
        if(i__14153 < n__685__auto____14152) {
          a__14147[i__14153] = init_val_or_seq;
          var G__14156 = i__14153 + 1;
          i__14153 = G__14156;
          continue
        }else {
        }
        break
      }
      return a__14147
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
    var a__14157 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__14158 = cljs.core.seq.call(null, init_val_or_seq);
      var i__14159 = 0;
      var s__14160 = s__14158;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____14161 = s__14160;
          if(cljs.core.truth_(and__3822__auto____14161)) {
            return i__14159 < size
          }else {
            return and__3822__auto____14161
          }
        }())) {
          a__14157[i__14159] = cljs.core.first.call(null, s__14160);
          var G__14164 = i__14159 + 1;
          var G__14165 = cljs.core.next.call(null, s__14160);
          i__14159 = G__14164;
          s__14160 = G__14165;
          continue
        }else {
          return a__14157
        }
        break
      }
    }else {
      var n__685__auto____14162 = size;
      var i__14163 = 0;
      while(true) {
        if(i__14163 < n__685__auto____14162) {
          a__14157[i__14163] = init_val_or_seq;
          var G__14166 = i__14163 + 1;
          i__14163 = G__14166;
          continue
        }else {
        }
        break
      }
      return a__14157
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
    var s__14167 = s;
    var i__14168 = n;
    var sum__14169 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____14170 = i__14168 > 0;
        if(and__3822__auto____14170) {
          return cljs.core.seq.call(null, s__14167)
        }else {
          return and__3822__auto____14170
        }
      }())) {
        var G__14171 = cljs.core.next.call(null, s__14167);
        var G__14172 = i__14168 - 1;
        var G__14173 = sum__14169 + 1;
        s__14167 = G__14171;
        i__14168 = G__14172;
        sum__14169 = G__14173;
        continue
      }else {
        return sum__14169
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
      var s__14174 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__14174)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__14174), concat.call(null, cljs.core.rest.call(null, s__14174), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__14177__delegate = function(x, y, zs) {
      var cat__14176 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__14175 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__14175)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__14175), cat.call(null, cljs.core.rest.call(null, xys__14175), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__14176.call(null, concat.call(null, x, y), zs)
    };
    var G__14177 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14177__delegate.call(this, x, y, zs)
    };
    G__14177.cljs$lang$maxFixedArity = 2;
    G__14177.cljs$lang$applyTo = function(arglist__14178) {
      var x = cljs.core.first(arglist__14178);
      var y = cljs.core.first(cljs.core.next(arglist__14178));
      var zs = cljs.core.rest(cljs.core.next(arglist__14178));
      return G__14177__delegate(x, y, zs)
    };
    G__14177.cljs$lang$arity$variadic = G__14177__delegate;
    return G__14177
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
    var G__14179__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__14179 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14179__delegate.call(this, a, b, c, d, more)
    };
    G__14179.cljs$lang$maxFixedArity = 4;
    G__14179.cljs$lang$applyTo = function(arglist__14180) {
      var a = cljs.core.first(arglist__14180);
      var b = cljs.core.first(cljs.core.next(arglist__14180));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14180)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14180))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14180))));
      return G__14179__delegate(a, b, c, d, more)
    };
    G__14179.cljs$lang$arity$variadic = G__14179__delegate;
    return G__14179
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
  var args__14181 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__14182 = cljs.core._first.call(null, args__14181);
    var args__14183 = cljs.core._rest.call(null, args__14181);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__14182)
      }else {
        return f.call(null, a__14182)
      }
    }else {
      var b__14184 = cljs.core._first.call(null, args__14183);
      var args__14185 = cljs.core._rest.call(null, args__14183);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__14182, b__14184)
        }else {
          return f.call(null, a__14182, b__14184)
        }
      }else {
        var c__14186 = cljs.core._first.call(null, args__14185);
        var args__14187 = cljs.core._rest.call(null, args__14185);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__14182, b__14184, c__14186)
          }else {
            return f.call(null, a__14182, b__14184, c__14186)
          }
        }else {
          var d__14188 = cljs.core._first.call(null, args__14187);
          var args__14189 = cljs.core._rest.call(null, args__14187);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__14182, b__14184, c__14186, d__14188)
            }else {
              return f.call(null, a__14182, b__14184, c__14186, d__14188)
            }
          }else {
            var e__14190 = cljs.core._first.call(null, args__14189);
            var args__14191 = cljs.core._rest.call(null, args__14189);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__14182, b__14184, c__14186, d__14188, e__14190)
              }else {
                return f.call(null, a__14182, b__14184, c__14186, d__14188, e__14190)
              }
            }else {
              var f__14192 = cljs.core._first.call(null, args__14191);
              var args__14193 = cljs.core._rest.call(null, args__14191);
              if(argc === 6) {
                if(f__14192.cljs$lang$arity$6) {
                  return f__14192.cljs$lang$arity$6(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192)
                }else {
                  return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192)
                }
              }else {
                var g__14194 = cljs.core._first.call(null, args__14193);
                var args__14195 = cljs.core._rest.call(null, args__14193);
                if(argc === 7) {
                  if(f__14192.cljs$lang$arity$7) {
                    return f__14192.cljs$lang$arity$7(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194)
                  }else {
                    return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194)
                  }
                }else {
                  var h__14196 = cljs.core._first.call(null, args__14195);
                  var args__14197 = cljs.core._rest.call(null, args__14195);
                  if(argc === 8) {
                    if(f__14192.cljs$lang$arity$8) {
                      return f__14192.cljs$lang$arity$8(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196)
                    }else {
                      return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196)
                    }
                  }else {
                    var i__14198 = cljs.core._first.call(null, args__14197);
                    var args__14199 = cljs.core._rest.call(null, args__14197);
                    if(argc === 9) {
                      if(f__14192.cljs$lang$arity$9) {
                        return f__14192.cljs$lang$arity$9(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198)
                      }else {
                        return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198)
                      }
                    }else {
                      var j__14200 = cljs.core._first.call(null, args__14199);
                      var args__14201 = cljs.core._rest.call(null, args__14199);
                      if(argc === 10) {
                        if(f__14192.cljs$lang$arity$10) {
                          return f__14192.cljs$lang$arity$10(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200)
                        }else {
                          return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200)
                        }
                      }else {
                        var k__14202 = cljs.core._first.call(null, args__14201);
                        var args__14203 = cljs.core._rest.call(null, args__14201);
                        if(argc === 11) {
                          if(f__14192.cljs$lang$arity$11) {
                            return f__14192.cljs$lang$arity$11(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202)
                          }else {
                            return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202)
                          }
                        }else {
                          var l__14204 = cljs.core._first.call(null, args__14203);
                          var args__14205 = cljs.core._rest.call(null, args__14203);
                          if(argc === 12) {
                            if(f__14192.cljs$lang$arity$12) {
                              return f__14192.cljs$lang$arity$12(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204)
                            }else {
                              return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204)
                            }
                          }else {
                            var m__14206 = cljs.core._first.call(null, args__14205);
                            var args__14207 = cljs.core._rest.call(null, args__14205);
                            if(argc === 13) {
                              if(f__14192.cljs$lang$arity$13) {
                                return f__14192.cljs$lang$arity$13(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206)
                              }else {
                                return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206)
                              }
                            }else {
                              var n__14208 = cljs.core._first.call(null, args__14207);
                              var args__14209 = cljs.core._rest.call(null, args__14207);
                              if(argc === 14) {
                                if(f__14192.cljs$lang$arity$14) {
                                  return f__14192.cljs$lang$arity$14(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208)
                                }else {
                                  return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208)
                                }
                              }else {
                                var o__14210 = cljs.core._first.call(null, args__14209);
                                var args__14211 = cljs.core._rest.call(null, args__14209);
                                if(argc === 15) {
                                  if(f__14192.cljs$lang$arity$15) {
                                    return f__14192.cljs$lang$arity$15(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210)
                                  }else {
                                    return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210)
                                  }
                                }else {
                                  var p__14212 = cljs.core._first.call(null, args__14211);
                                  var args__14213 = cljs.core._rest.call(null, args__14211);
                                  if(argc === 16) {
                                    if(f__14192.cljs$lang$arity$16) {
                                      return f__14192.cljs$lang$arity$16(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212)
                                    }else {
                                      return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212)
                                    }
                                  }else {
                                    var q__14214 = cljs.core._first.call(null, args__14213);
                                    var args__14215 = cljs.core._rest.call(null, args__14213);
                                    if(argc === 17) {
                                      if(f__14192.cljs$lang$arity$17) {
                                        return f__14192.cljs$lang$arity$17(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214)
                                      }else {
                                        return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214)
                                      }
                                    }else {
                                      var r__14216 = cljs.core._first.call(null, args__14215);
                                      var args__14217 = cljs.core._rest.call(null, args__14215);
                                      if(argc === 18) {
                                        if(f__14192.cljs$lang$arity$18) {
                                          return f__14192.cljs$lang$arity$18(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216)
                                        }else {
                                          return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216)
                                        }
                                      }else {
                                        var s__14218 = cljs.core._first.call(null, args__14217);
                                        var args__14219 = cljs.core._rest.call(null, args__14217);
                                        if(argc === 19) {
                                          if(f__14192.cljs$lang$arity$19) {
                                            return f__14192.cljs$lang$arity$19(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216, s__14218)
                                          }else {
                                            return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216, s__14218)
                                          }
                                        }else {
                                          var t__14220 = cljs.core._first.call(null, args__14219);
                                          var args__14221 = cljs.core._rest.call(null, args__14219);
                                          if(argc === 20) {
                                            if(f__14192.cljs$lang$arity$20) {
                                              return f__14192.cljs$lang$arity$20(a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216, s__14218, t__14220)
                                            }else {
                                              return f__14192.call(null, a__14182, b__14184, c__14186, d__14188, e__14190, f__14192, g__14194, h__14196, i__14198, j__14200, k__14202, l__14204, m__14206, n__14208, o__14210, p__14212, q__14214, r__14216, s__14218, t__14220)
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
    var fixed_arity__14222 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14223 = cljs.core.bounded_count.call(null, args, fixed_arity__14222 + 1);
      if(bc__14223 <= fixed_arity__14222) {
        return cljs.core.apply_to.call(null, f, bc__14223, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__14224 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__14225 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14226 = cljs.core.bounded_count.call(null, arglist__14224, fixed_arity__14225 + 1);
      if(bc__14226 <= fixed_arity__14225) {
        return cljs.core.apply_to.call(null, f, bc__14226, arglist__14224)
      }else {
        return f.cljs$lang$applyTo(arglist__14224)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14224))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__14227 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__14228 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14229 = cljs.core.bounded_count.call(null, arglist__14227, fixed_arity__14228 + 1);
      if(bc__14229 <= fixed_arity__14228) {
        return cljs.core.apply_to.call(null, f, bc__14229, arglist__14227)
      }else {
        return f.cljs$lang$applyTo(arglist__14227)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14227))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__14230 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__14231 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__14232 = cljs.core.bounded_count.call(null, arglist__14230, fixed_arity__14231 + 1);
      if(bc__14232 <= fixed_arity__14231) {
        return cljs.core.apply_to.call(null, f, bc__14232, arglist__14230)
      }else {
        return f.cljs$lang$applyTo(arglist__14230)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__14230))
    }
  };
  var apply__6 = function() {
    var G__14236__delegate = function(f, a, b, c, d, args) {
      var arglist__14233 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__14234 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__14235 = cljs.core.bounded_count.call(null, arglist__14233, fixed_arity__14234 + 1);
        if(bc__14235 <= fixed_arity__14234) {
          return cljs.core.apply_to.call(null, f, bc__14235, arglist__14233)
        }else {
          return f.cljs$lang$applyTo(arglist__14233)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__14233))
      }
    };
    var G__14236 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__14236__delegate.call(this, f, a, b, c, d, args)
    };
    G__14236.cljs$lang$maxFixedArity = 5;
    G__14236.cljs$lang$applyTo = function(arglist__14237) {
      var f = cljs.core.first(arglist__14237);
      var a = cljs.core.first(cljs.core.next(arglist__14237));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14237)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14237))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14237)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14237)))));
      return G__14236__delegate(f, a, b, c, d, args)
    };
    G__14236.cljs$lang$arity$variadic = G__14236__delegate;
    return G__14236
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
  vary_meta.cljs$lang$applyTo = function(arglist__14238) {
    var obj = cljs.core.first(arglist__14238);
    var f = cljs.core.first(cljs.core.next(arglist__14238));
    var args = cljs.core.rest(cljs.core.next(arglist__14238));
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
    var G__14239__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__14239 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14239__delegate.call(this, x, y, more)
    };
    G__14239.cljs$lang$maxFixedArity = 2;
    G__14239.cljs$lang$applyTo = function(arglist__14240) {
      var x = cljs.core.first(arglist__14240);
      var y = cljs.core.first(cljs.core.next(arglist__14240));
      var more = cljs.core.rest(cljs.core.next(arglist__14240));
      return G__14239__delegate(x, y, more)
    };
    G__14239.cljs$lang$arity$variadic = G__14239__delegate;
    return G__14239
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
        var G__14241 = pred;
        var G__14242 = cljs.core.next.call(null, coll);
        pred = G__14241;
        coll = G__14242;
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
      var or__3824__auto____14243 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____14243)) {
        return or__3824__auto____14243
      }else {
        var G__14244 = pred;
        var G__14245 = cljs.core.next.call(null, coll);
        pred = G__14244;
        coll = G__14245;
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
    var G__14246 = null;
    var G__14246__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__14246__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__14246__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__14246__3 = function() {
      var G__14247__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__14247 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__14247__delegate.call(this, x, y, zs)
      };
      G__14247.cljs$lang$maxFixedArity = 2;
      G__14247.cljs$lang$applyTo = function(arglist__14248) {
        var x = cljs.core.first(arglist__14248);
        var y = cljs.core.first(cljs.core.next(arglist__14248));
        var zs = cljs.core.rest(cljs.core.next(arglist__14248));
        return G__14247__delegate(x, y, zs)
      };
      G__14247.cljs$lang$arity$variadic = G__14247__delegate;
      return G__14247
    }();
    G__14246 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__14246__0.call(this);
        case 1:
          return G__14246__1.call(this, x);
        case 2:
          return G__14246__2.call(this, x, y);
        default:
          return G__14246__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__14246.cljs$lang$maxFixedArity = 2;
    G__14246.cljs$lang$applyTo = G__14246__3.cljs$lang$applyTo;
    return G__14246
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__14249__delegate = function(args) {
      return x
    };
    var G__14249 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14249__delegate.call(this, args)
    };
    G__14249.cljs$lang$maxFixedArity = 0;
    G__14249.cljs$lang$applyTo = function(arglist__14250) {
      var args = cljs.core.seq(arglist__14250);
      return G__14249__delegate(args)
    };
    G__14249.cljs$lang$arity$variadic = G__14249__delegate;
    return G__14249
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
      var G__14254 = null;
      var G__14254__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__14254__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__14254__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__14254__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__14254__4 = function() {
        var G__14255__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__14255 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14255__delegate.call(this, x, y, z, args)
        };
        G__14255.cljs$lang$maxFixedArity = 3;
        G__14255.cljs$lang$applyTo = function(arglist__14256) {
          var x = cljs.core.first(arglist__14256);
          var y = cljs.core.first(cljs.core.next(arglist__14256));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14256)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14256)));
          return G__14255__delegate(x, y, z, args)
        };
        G__14255.cljs$lang$arity$variadic = G__14255__delegate;
        return G__14255
      }();
      G__14254 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14254__0.call(this);
          case 1:
            return G__14254__1.call(this, x);
          case 2:
            return G__14254__2.call(this, x, y);
          case 3:
            return G__14254__3.call(this, x, y, z);
          default:
            return G__14254__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14254.cljs$lang$maxFixedArity = 3;
      G__14254.cljs$lang$applyTo = G__14254__4.cljs$lang$applyTo;
      return G__14254
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__14257 = null;
      var G__14257__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__14257__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__14257__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__14257__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__14257__4 = function() {
        var G__14258__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__14258 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14258__delegate.call(this, x, y, z, args)
        };
        G__14258.cljs$lang$maxFixedArity = 3;
        G__14258.cljs$lang$applyTo = function(arglist__14259) {
          var x = cljs.core.first(arglist__14259);
          var y = cljs.core.first(cljs.core.next(arglist__14259));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14259)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14259)));
          return G__14258__delegate(x, y, z, args)
        };
        G__14258.cljs$lang$arity$variadic = G__14258__delegate;
        return G__14258
      }();
      G__14257 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14257__0.call(this);
          case 1:
            return G__14257__1.call(this, x);
          case 2:
            return G__14257__2.call(this, x, y);
          case 3:
            return G__14257__3.call(this, x, y, z);
          default:
            return G__14257__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14257.cljs$lang$maxFixedArity = 3;
      G__14257.cljs$lang$applyTo = G__14257__4.cljs$lang$applyTo;
      return G__14257
    }()
  };
  var comp__4 = function() {
    var G__14260__delegate = function(f1, f2, f3, fs) {
      var fs__14251 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__14261__delegate = function(args) {
          var ret__14252 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__14251), args);
          var fs__14253 = cljs.core.next.call(null, fs__14251);
          while(true) {
            if(cljs.core.truth_(fs__14253)) {
              var G__14262 = cljs.core.first.call(null, fs__14253).call(null, ret__14252);
              var G__14263 = cljs.core.next.call(null, fs__14253);
              ret__14252 = G__14262;
              fs__14253 = G__14263;
              continue
            }else {
              return ret__14252
            }
            break
          }
        };
        var G__14261 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__14261__delegate.call(this, args)
        };
        G__14261.cljs$lang$maxFixedArity = 0;
        G__14261.cljs$lang$applyTo = function(arglist__14264) {
          var args = cljs.core.seq(arglist__14264);
          return G__14261__delegate(args)
        };
        G__14261.cljs$lang$arity$variadic = G__14261__delegate;
        return G__14261
      }()
    };
    var G__14260 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14260__delegate.call(this, f1, f2, f3, fs)
    };
    G__14260.cljs$lang$maxFixedArity = 3;
    G__14260.cljs$lang$applyTo = function(arglist__14265) {
      var f1 = cljs.core.first(arglist__14265);
      var f2 = cljs.core.first(cljs.core.next(arglist__14265));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14265)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14265)));
      return G__14260__delegate(f1, f2, f3, fs)
    };
    G__14260.cljs$lang$arity$variadic = G__14260__delegate;
    return G__14260
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
      var G__14266__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__14266 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14266__delegate.call(this, args)
      };
      G__14266.cljs$lang$maxFixedArity = 0;
      G__14266.cljs$lang$applyTo = function(arglist__14267) {
        var args = cljs.core.seq(arglist__14267);
        return G__14266__delegate(args)
      };
      G__14266.cljs$lang$arity$variadic = G__14266__delegate;
      return G__14266
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__14268__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__14268 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14268__delegate.call(this, args)
      };
      G__14268.cljs$lang$maxFixedArity = 0;
      G__14268.cljs$lang$applyTo = function(arglist__14269) {
        var args = cljs.core.seq(arglist__14269);
        return G__14268__delegate(args)
      };
      G__14268.cljs$lang$arity$variadic = G__14268__delegate;
      return G__14268
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__14270__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__14270 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__14270__delegate.call(this, args)
      };
      G__14270.cljs$lang$maxFixedArity = 0;
      G__14270.cljs$lang$applyTo = function(arglist__14271) {
        var args = cljs.core.seq(arglist__14271);
        return G__14270__delegate(args)
      };
      G__14270.cljs$lang$arity$variadic = G__14270__delegate;
      return G__14270
    }()
  };
  var partial__5 = function() {
    var G__14272__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__14273__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__14273 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__14273__delegate.call(this, args)
        };
        G__14273.cljs$lang$maxFixedArity = 0;
        G__14273.cljs$lang$applyTo = function(arglist__14274) {
          var args = cljs.core.seq(arglist__14274);
          return G__14273__delegate(args)
        };
        G__14273.cljs$lang$arity$variadic = G__14273__delegate;
        return G__14273
      }()
    };
    var G__14272 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14272__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__14272.cljs$lang$maxFixedArity = 4;
    G__14272.cljs$lang$applyTo = function(arglist__14275) {
      var f = cljs.core.first(arglist__14275);
      var arg1 = cljs.core.first(cljs.core.next(arglist__14275));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14275)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14275))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14275))));
      return G__14272__delegate(f, arg1, arg2, arg3, more)
    };
    G__14272.cljs$lang$arity$variadic = G__14272__delegate;
    return G__14272
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
      var G__14276 = null;
      var G__14276__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__14276__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__14276__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__14276__4 = function() {
        var G__14277__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__14277 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14277__delegate.call(this, a, b, c, ds)
        };
        G__14277.cljs$lang$maxFixedArity = 3;
        G__14277.cljs$lang$applyTo = function(arglist__14278) {
          var a = cljs.core.first(arglist__14278);
          var b = cljs.core.first(cljs.core.next(arglist__14278));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14278)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14278)));
          return G__14277__delegate(a, b, c, ds)
        };
        G__14277.cljs$lang$arity$variadic = G__14277__delegate;
        return G__14277
      }();
      G__14276 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__14276__1.call(this, a);
          case 2:
            return G__14276__2.call(this, a, b);
          case 3:
            return G__14276__3.call(this, a, b, c);
          default:
            return G__14276__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14276.cljs$lang$maxFixedArity = 3;
      G__14276.cljs$lang$applyTo = G__14276__4.cljs$lang$applyTo;
      return G__14276
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__14279 = null;
      var G__14279__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__14279__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__14279__4 = function() {
        var G__14280__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__14280 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14280__delegate.call(this, a, b, c, ds)
        };
        G__14280.cljs$lang$maxFixedArity = 3;
        G__14280.cljs$lang$applyTo = function(arglist__14281) {
          var a = cljs.core.first(arglist__14281);
          var b = cljs.core.first(cljs.core.next(arglist__14281));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14281)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14281)));
          return G__14280__delegate(a, b, c, ds)
        };
        G__14280.cljs$lang$arity$variadic = G__14280__delegate;
        return G__14280
      }();
      G__14279 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__14279__2.call(this, a, b);
          case 3:
            return G__14279__3.call(this, a, b, c);
          default:
            return G__14279__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14279.cljs$lang$maxFixedArity = 3;
      G__14279.cljs$lang$applyTo = G__14279__4.cljs$lang$applyTo;
      return G__14279
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__14282 = null;
      var G__14282__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__14282__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__14282__4 = function() {
        var G__14283__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__14283 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14283__delegate.call(this, a, b, c, ds)
        };
        G__14283.cljs$lang$maxFixedArity = 3;
        G__14283.cljs$lang$applyTo = function(arglist__14284) {
          var a = cljs.core.first(arglist__14284);
          var b = cljs.core.first(cljs.core.next(arglist__14284));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14284)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14284)));
          return G__14283__delegate(a, b, c, ds)
        };
        G__14283.cljs$lang$arity$variadic = G__14283__delegate;
        return G__14283
      }();
      G__14282 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__14282__2.call(this, a, b);
          case 3:
            return G__14282__3.call(this, a, b, c);
          default:
            return G__14282__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14282.cljs$lang$maxFixedArity = 3;
      G__14282.cljs$lang$applyTo = G__14282__4.cljs$lang$applyTo;
      return G__14282
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
  var mapi__14287 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____14285 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14285)) {
        var s__14286 = temp__3974__auto____14285;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__14286)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__14286)))
      }else {
        return null
      }
    })
  };
  return mapi__14287.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____14288 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____14288)) {
      var s__14289 = temp__3974__auto____14288;
      var x__14290 = f.call(null, cljs.core.first.call(null, s__14289));
      if(x__14290 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__14289))
      }else {
        return cljs.core.cons.call(null, x__14290, keep.call(null, f, cljs.core.rest.call(null, s__14289)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__14300 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____14297 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14297)) {
        var s__14298 = temp__3974__auto____14297;
        var x__14299 = f.call(null, idx, cljs.core.first.call(null, s__14298));
        if(x__14299 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__14298))
        }else {
          return cljs.core.cons.call(null, x__14299, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__14298)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__14300.call(null, 0, coll)
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
          var and__3822__auto____14307 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14307)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____14307
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____14308 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14308)) {
            var and__3822__auto____14309 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____14309)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____14309
            }
          }else {
            return and__3822__auto____14308
          }
        }())
      };
      var ep1__4 = function() {
        var G__14345__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____14310 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____14310)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____14310
            }
          }())
        };
        var G__14345 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14345__delegate.call(this, x, y, z, args)
        };
        G__14345.cljs$lang$maxFixedArity = 3;
        G__14345.cljs$lang$applyTo = function(arglist__14346) {
          var x = cljs.core.first(arglist__14346);
          var y = cljs.core.first(cljs.core.next(arglist__14346));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14346)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14346)));
          return G__14345__delegate(x, y, z, args)
        };
        G__14345.cljs$lang$arity$variadic = G__14345__delegate;
        return G__14345
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
          var and__3822__auto____14311 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14311)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____14311
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____14312 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14312)) {
            var and__3822__auto____14313 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____14313)) {
              var and__3822__auto____14314 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____14314)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____14314
              }
            }else {
              return and__3822__auto____14313
            }
          }else {
            return and__3822__auto____14312
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____14315 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14315)) {
            var and__3822__auto____14316 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____14316)) {
              var and__3822__auto____14317 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____14317)) {
                var and__3822__auto____14318 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____14318)) {
                  var and__3822__auto____14319 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____14319)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____14319
                  }
                }else {
                  return and__3822__auto____14318
                }
              }else {
                return and__3822__auto____14317
              }
            }else {
              return and__3822__auto____14316
            }
          }else {
            return and__3822__auto____14315
          }
        }())
      };
      var ep2__4 = function() {
        var G__14347__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____14320 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____14320)) {
              return cljs.core.every_QMARK_.call(null, function(p1__14291_SHARP_) {
                var and__3822__auto____14321 = p1.call(null, p1__14291_SHARP_);
                if(cljs.core.truth_(and__3822__auto____14321)) {
                  return p2.call(null, p1__14291_SHARP_)
                }else {
                  return and__3822__auto____14321
                }
              }, args)
            }else {
              return and__3822__auto____14320
            }
          }())
        };
        var G__14347 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14347__delegate.call(this, x, y, z, args)
        };
        G__14347.cljs$lang$maxFixedArity = 3;
        G__14347.cljs$lang$applyTo = function(arglist__14348) {
          var x = cljs.core.first(arglist__14348);
          var y = cljs.core.first(cljs.core.next(arglist__14348));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14348)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14348)));
          return G__14347__delegate(x, y, z, args)
        };
        G__14347.cljs$lang$arity$variadic = G__14347__delegate;
        return G__14347
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
          var and__3822__auto____14322 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14322)) {
            var and__3822__auto____14323 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____14323)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____14323
            }
          }else {
            return and__3822__auto____14322
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____14324 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14324)) {
            var and__3822__auto____14325 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____14325)) {
              var and__3822__auto____14326 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____14326)) {
                var and__3822__auto____14327 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____14327)) {
                  var and__3822__auto____14328 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____14328)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____14328
                  }
                }else {
                  return and__3822__auto____14327
                }
              }else {
                return and__3822__auto____14326
              }
            }else {
              return and__3822__auto____14325
            }
          }else {
            return and__3822__auto____14324
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____14329 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____14329)) {
            var and__3822__auto____14330 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____14330)) {
              var and__3822__auto____14331 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____14331)) {
                var and__3822__auto____14332 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____14332)) {
                  var and__3822__auto____14333 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____14333)) {
                    var and__3822__auto____14334 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____14334)) {
                      var and__3822__auto____14335 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____14335)) {
                        var and__3822__auto____14336 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____14336)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____14336
                        }
                      }else {
                        return and__3822__auto____14335
                      }
                    }else {
                      return and__3822__auto____14334
                    }
                  }else {
                    return and__3822__auto____14333
                  }
                }else {
                  return and__3822__auto____14332
                }
              }else {
                return and__3822__auto____14331
              }
            }else {
              return and__3822__auto____14330
            }
          }else {
            return and__3822__auto____14329
          }
        }())
      };
      var ep3__4 = function() {
        var G__14349__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____14337 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____14337)) {
              return cljs.core.every_QMARK_.call(null, function(p1__14292_SHARP_) {
                var and__3822__auto____14338 = p1.call(null, p1__14292_SHARP_);
                if(cljs.core.truth_(and__3822__auto____14338)) {
                  var and__3822__auto____14339 = p2.call(null, p1__14292_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____14339)) {
                    return p3.call(null, p1__14292_SHARP_)
                  }else {
                    return and__3822__auto____14339
                  }
                }else {
                  return and__3822__auto____14338
                }
              }, args)
            }else {
              return and__3822__auto____14337
            }
          }())
        };
        var G__14349 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14349__delegate.call(this, x, y, z, args)
        };
        G__14349.cljs$lang$maxFixedArity = 3;
        G__14349.cljs$lang$applyTo = function(arglist__14350) {
          var x = cljs.core.first(arglist__14350);
          var y = cljs.core.first(cljs.core.next(arglist__14350));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14350)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14350)));
          return G__14349__delegate(x, y, z, args)
        };
        G__14349.cljs$lang$arity$variadic = G__14349__delegate;
        return G__14349
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
    var G__14351__delegate = function(p1, p2, p3, ps) {
      var ps__14340 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__14293_SHARP_) {
            return p1__14293_SHARP_.call(null, x)
          }, ps__14340)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__14294_SHARP_) {
            var and__3822__auto____14341 = p1__14294_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____14341)) {
              return p1__14294_SHARP_.call(null, y)
            }else {
              return and__3822__auto____14341
            }
          }, ps__14340)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__14295_SHARP_) {
            var and__3822__auto____14342 = p1__14295_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____14342)) {
              var and__3822__auto____14343 = p1__14295_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____14343)) {
                return p1__14295_SHARP_.call(null, z)
              }else {
                return and__3822__auto____14343
              }
            }else {
              return and__3822__auto____14342
            }
          }, ps__14340)
        };
        var epn__4 = function() {
          var G__14352__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____14344 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____14344)) {
                return cljs.core.every_QMARK_.call(null, function(p1__14296_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__14296_SHARP_, args)
                }, ps__14340)
              }else {
                return and__3822__auto____14344
              }
            }())
          };
          var G__14352 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__14352__delegate.call(this, x, y, z, args)
          };
          G__14352.cljs$lang$maxFixedArity = 3;
          G__14352.cljs$lang$applyTo = function(arglist__14353) {
            var x = cljs.core.first(arglist__14353);
            var y = cljs.core.first(cljs.core.next(arglist__14353));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14353)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14353)));
            return G__14352__delegate(x, y, z, args)
          };
          G__14352.cljs$lang$arity$variadic = G__14352__delegate;
          return G__14352
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
    var G__14351 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14351__delegate.call(this, p1, p2, p3, ps)
    };
    G__14351.cljs$lang$maxFixedArity = 3;
    G__14351.cljs$lang$applyTo = function(arglist__14354) {
      var p1 = cljs.core.first(arglist__14354);
      var p2 = cljs.core.first(cljs.core.next(arglist__14354));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14354)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14354)));
      return G__14351__delegate(p1, p2, p3, ps)
    };
    G__14351.cljs$lang$arity$variadic = G__14351__delegate;
    return G__14351
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
        var or__3824__auto____14356 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14356)) {
          return or__3824__auto____14356
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____14357 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14357)) {
          return or__3824__auto____14357
        }else {
          var or__3824__auto____14358 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____14358)) {
            return or__3824__auto____14358
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__14394__delegate = function(x, y, z, args) {
          var or__3824__auto____14359 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____14359)) {
            return or__3824__auto____14359
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__14394 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14394__delegate.call(this, x, y, z, args)
        };
        G__14394.cljs$lang$maxFixedArity = 3;
        G__14394.cljs$lang$applyTo = function(arglist__14395) {
          var x = cljs.core.first(arglist__14395);
          var y = cljs.core.first(cljs.core.next(arglist__14395));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14395)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14395)));
          return G__14394__delegate(x, y, z, args)
        };
        G__14394.cljs$lang$arity$variadic = G__14394__delegate;
        return G__14394
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
        var or__3824__auto____14360 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14360)) {
          return or__3824__auto____14360
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____14361 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14361)) {
          return or__3824__auto____14361
        }else {
          var or__3824__auto____14362 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____14362)) {
            return or__3824__auto____14362
          }else {
            var or__3824__auto____14363 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____14363)) {
              return or__3824__auto____14363
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____14364 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14364)) {
          return or__3824__auto____14364
        }else {
          var or__3824__auto____14365 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____14365)) {
            return or__3824__auto____14365
          }else {
            var or__3824__auto____14366 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____14366)) {
              return or__3824__auto____14366
            }else {
              var or__3824__auto____14367 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____14367)) {
                return or__3824__auto____14367
              }else {
                var or__3824__auto____14368 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____14368)) {
                  return or__3824__auto____14368
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__14396__delegate = function(x, y, z, args) {
          var or__3824__auto____14369 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____14369)) {
            return or__3824__auto____14369
          }else {
            return cljs.core.some.call(null, function(p1__14301_SHARP_) {
              var or__3824__auto____14370 = p1.call(null, p1__14301_SHARP_);
              if(cljs.core.truth_(or__3824__auto____14370)) {
                return or__3824__auto____14370
              }else {
                return p2.call(null, p1__14301_SHARP_)
              }
            }, args)
          }
        };
        var G__14396 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14396__delegate.call(this, x, y, z, args)
        };
        G__14396.cljs$lang$maxFixedArity = 3;
        G__14396.cljs$lang$applyTo = function(arglist__14397) {
          var x = cljs.core.first(arglist__14397);
          var y = cljs.core.first(cljs.core.next(arglist__14397));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14397)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14397)));
          return G__14396__delegate(x, y, z, args)
        };
        G__14396.cljs$lang$arity$variadic = G__14396__delegate;
        return G__14396
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
        var or__3824__auto____14371 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14371)) {
          return or__3824__auto____14371
        }else {
          var or__3824__auto____14372 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____14372)) {
            return or__3824__auto____14372
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____14373 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14373)) {
          return or__3824__auto____14373
        }else {
          var or__3824__auto____14374 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____14374)) {
            return or__3824__auto____14374
          }else {
            var or__3824__auto____14375 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____14375)) {
              return or__3824__auto____14375
            }else {
              var or__3824__auto____14376 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____14376)) {
                return or__3824__auto____14376
              }else {
                var or__3824__auto____14377 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____14377)) {
                  return or__3824__auto____14377
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____14378 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____14378)) {
          return or__3824__auto____14378
        }else {
          var or__3824__auto____14379 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____14379)) {
            return or__3824__auto____14379
          }else {
            var or__3824__auto____14380 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____14380)) {
              return or__3824__auto____14380
            }else {
              var or__3824__auto____14381 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____14381)) {
                return or__3824__auto____14381
              }else {
                var or__3824__auto____14382 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____14382)) {
                  return or__3824__auto____14382
                }else {
                  var or__3824__auto____14383 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____14383)) {
                    return or__3824__auto____14383
                  }else {
                    var or__3824__auto____14384 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____14384)) {
                      return or__3824__auto____14384
                    }else {
                      var or__3824__auto____14385 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____14385)) {
                        return or__3824__auto____14385
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
        var G__14398__delegate = function(x, y, z, args) {
          var or__3824__auto____14386 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____14386)) {
            return or__3824__auto____14386
          }else {
            return cljs.core.some.call(null, function(p1__14302_SHARP_) {
              var or__3824__auto____14387 = p1.call(null, p1__14302_SHARP_);
              if(cljs.core.truth_(or__3824__auto____14387)) {
                return or__3824__auto____14387
              }else {
                var or__3824__auto____14388 = p2.call(null, p1__14302_SHARP_);
                if(cljs.core.truth_(or__3824__auto____14388)) {
                  return or__3824__auto____14388
                }else {
                  return p3.call(null, p1__14302_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__14398 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14398__delegate.call(this, x, y, z, args)
        };
        G__14398.cljs$lang$maxFixedArity = 3;
        G__14398.cljs$lang$applyTo = function(arglist__14399) {
          var x = cljs.core.first(arglist__14399);
          var y = cljs.core.first(cljs.core.next(arglist__14399));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14399)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14399)));
          return G__14398__delegate(x, y, z, args)
        };
        G__14398.cljs$lang$arity$variadic = G__14398__delegate;
        return G__14398
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
    var G__14400__delegate = function(p1, p2, p3, ps) {
      var ps__14389 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__14303_SHARP_) {
            return p1__14303_SHARP_.call(null, x)
          }, ps__14389)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__14304_SHARP_) {
            var or__3824__auto____14390 = p1__14304_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____14390)) {
              return or__3824__auto____14390
            }else {
              return p1__14304_SHARP_.call(null, y)
            }
          }, ps__14389)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__14305_SHARP_) {
            var or__3824__auto____14391 = p1__14305_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____14391)) {
              return or__3824__auto____14391
            }else {
              var or__3824__auto____14392 = p1__14305_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____14392)) {
                return or__3824__auto____14392
              }else {
                return p1__14305_SHARP_.call(null, z)
              }
            }
          }, ps__14389)
        };
        var spn__4 = function() {
          var G__14401__delegate = function(x, y, z, args) {
            var or__3824__auto____14393 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____14393)) {
              return or__3824__auto____14393
            }else {
              return cljs.core.some.call(null, function(p1__14306_SHARP_) {
                return cljs.core.some.call(null, p1__14306_SHARP_, args)
              }, ps__14389)
            }
          };
          var G__14401 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__14401__delegate.call(this, x, y, z, args)
          };
          G__14401.cljs$lang$maxFixedArity = 3;
          G__14401.cljs$lang$applyTo = function(arglist__14402) {
            var x = cljs.core.first(arglist__14402);
            var y = cljs.core.first(cljs.core.next(arglist__14402));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14402)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14402)));
            return G__14401__delegate(x, y, z, args)
          };
          G__14401.cljs$lang$arity$variadic = G__14401__delegate;
          return G__14401
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
    var G__14400 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14400__delegate.call(this, p1, p2, p3, ps)
    };
    G__14400.cljs$lang$maxFixedArity = 3;
    G__14400.cljs$lang$applyTo = function(arglist__14403) {
      var p1 = cljs.core.first(arglist__14403);
      var p2 = cljs.core.first(cljs.core.next(arglist__14403));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14403)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14403)));
      return G__14400__delegate(p1, p2, p3, ps)
    };
    G__14400.cljs$lang$arity$variadic = G__14400__delegate;
    return G__14400
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
      var temp__3974__auto____14404 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14404)) {
        var s__14405 = temp__3974__auto____14404;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__14405)), map.call(null, f, cljs.core.rest.call(null, s__14405)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__14406 = cljs.core.seq.call(null, c1);
      var s2__14407 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____14408 = s1__14406;
        if(cljs.core.truth_(and__3822__auto____14408)) {
          return s2__14407
        }else {
          return and__3822__auto____14408
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__14406), cljs.core.first.call(null, s2__14407)), map.call(null, f, cljs.core.rest.call(null, s1__14406), cljs.core.rest.call(null, s2__14407)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__14409 = cljs.core.seq.call(null, c1);
      var s2__14410 = cljs.core.seq.call(null, c2);
      var s3__14411 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____14412 = s1__14409;
        if(cljs.core.truth_(and__3822__auto____14412)) {
          var and__3822__auto____14413 = s2__14410;
          if(cljs.core.truth_(and__3822__auto____14413)) {
            return s3__14411
          }else {
            return and__3822__auto____14413
          }
        }else {
          return and__3822__auto____14412
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__14409), cljs.core.first.call(null, s2__14410), cljs.core.first.call(null, s3__14411)), map.call(null, f, cljs.core.rest.call(null, s1__14409), cljs.core.rest.call(null, s2__14410), cljs.core.rest.call(null, s3__14411)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__14416__delegate = function(f, c1, c2, c3, colls) {
      var step__14415 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__14414 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__14414)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__14414), step.call(null, map.call(null, cljs.core.rest, ss__14414)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__14355_SHARP_) {
        return cljs.core.apply.call(null, f, p1__14355_SHARP_)
      }, step__14415.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__14416 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14416__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__14416.cljs$lang$maxFixedArity = 4;
    G__14416.cljs$lang$applyTo = function(arglist__14417) {
      var f = cljs.core.first(arglist__14417);
      var c1 = cljs.core.first(cljs.core.next(arglist__14417));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14417)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14417))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14417))));
      return G__14416__delegate(f, c1, c2, c3, colls)
    };
    G__14416.cljs$lang$arity$variadic = G__14416__delegate;
    return G__14416
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
      var temp__3974__auto____14418 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14418)) {
        var s__14419 = temp__3974__auto____14418;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__14419), take.call(null, n - 1, cljs.core.rest.call(null, s__14419)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__14422 = function(n, coll) {
    while(true) {
      var s__14420 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____14421 = n > 0;
        if(and__3822__auto____14421) {
          return s__14420
        }else {
          return and__3822__auto____14421
        }
      }())) {
        var G__14423 = n - 1;
        var G__14424 = cljs.core.rest.call(null, s__14420);
        n = G__14423;
        coll = G__14424;
        continue
      }else {
        return s__14420
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__14422.call(null, n, coll)
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
  var s__14425 = cljs.core.seq.call(null, coll);
  var lead__14426 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__14426)) {
      var G__14427 = cljs.core.next.call(null, s__14425);
      var G__14428 = cljs.core.next.call(null, lead__14426);
      s__14425 = G__14427;
      lead__14426 = G__14428;
      continue
    }else {
      return s__14425
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__14431 = function(pred, coll) {
    while(true) {
      var s__14429 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____14430 = s__14429;
        if(cljs.core.truth_(and__3822__auto____14430)) {
          return pred.call(null, cljs.core.first.call(null, s__14429))
        }else {
          return and__3822__auto____14430
        }
      }())) {
        var G__14432 = pred;
        var G__14433 = cljs.core.rest.call(null, s__14429);
        pred = G__14432;
        coll = G__14433;
        continue
      }else {
        return s__14429
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__14431.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____14434 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____14434)) {
      var s__14435 = temp__3974__auto____14434;
      return cljs.core.concat.call(null, s__14435, cycle.call(null, s__14435))
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
      var s1__14436 = cljs.core.seq.call(null, c1);
      var s2__14437 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____14438 = s1__14436;
        if(cljs.core.truth_(and__3822__auto____14438)) {
          return s2__14437
        }else {
          return and__3822__auto____14438
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__14436), cljs.core.cons.call(null, cljs.core.first.call(null, s2__14437), interleave.call(null, cljs.core.rest.call(null, s1__14436), cljs.core.rest.call(null, s2__14437))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__14440__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__14439 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__14439)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__14439), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__14439)))
        }else {
          return null
        }
      })
    };
    var G__14440 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14440__delegate.call(this, c1, c2, colls)
    };
    G__14440.cljs$lang$maxFixedArity = 2;
    G__14440.cljs$lang$applyTo = function(arglist__14441) {
      var c1 = cljs.core.first(arglist__14441);
      var c2 = cljs.core.first(cljs.core.next(arglist__14441));
      var colls = cljs.core.rest(cljs.core.next(arglist__14441));
      return G__14440__delegate(c1, c2, colls)
    };
    G__14440.cljs$lang$arity$variadic = G__14440__delegate;
    return G__14440
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
  var cat__14444 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____14442 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____14442)) {
        var coll__14443 = temp__3971__auto____14442;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__14443), cat.call(null, cljs.core.rest.call(null, coll__14443), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__14444.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__14445__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__14445 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__14445__delegate.call(this, f, coll, colls)
    };
    G__14445.cljs$lang$maxFixedArity = 2;
    G__14445.cljs$lang$applyTo = function(arglist__14446) {
      var f = cljs.core.first(arglist__14446);
      var coll = cljs.core.first(cljs.core.next(arglist__14446));
      var colls = cljs.core.rest(cljs.core.next(arglist__14446));
      return G__14445__delegate(f, coll, colls)
    };
    G__14445.cljs$lang$arity$variadic = G__14445__delegate;
    return G__14445
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
    var temp__3974__auto____14447 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____14447)) {
      var s__14448 = temp__3974__auto____14447;
      var f__14449 = cljs.core.first.call(null, s__14448);
      var r__14450 = cljs.core.rest.call(null, s__14448);
      if(cljs.core.truth_(pred.call(null, f__14449))) {
        return cljs.core.cons.call(null, f__14449, filter.call(null, pred, r__14450))
      }else {
        return filter.call(null, pred, r__14450)
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
  var walk__14452 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__14452.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__14451_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__14451_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__14453__14454 = to;
    if(G__14453__14454 != null) {
      if(function() {
        var or__3824__auto____14455 = G__14453__14454.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____14455) {
          return or__3824__auto____14455
        }else {
          return G__14453__14454.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__14453__14454.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__14453__14454)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__14453__14454)
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
    var G__14456__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__14456 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__14456__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__14456.cljs$lang$maxFixedArity = 4;
    G__14456.cljs$lang$applyTo = function(arglist__14457) {
      var f = cljs.core.first(arglist__14457);
      var c1 = cljs.core.first(cljs.core.next(arglist__14457));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14457)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14457))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14457))));
      return G__14456__delegate(f, c1, c2, c3, colls)
    };
    G__14456.cljs$lang$arity$variadic = G__14456__delegate;
    return G__14456
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
      var temp__3974__auto____14458 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14458)) {
        var s__14459 = temp__3974__auto____14458;
        var p__14460 = cljs.core.take.call(null, n, s__14459);
        if(n === cljs.core.count.call(null, p__14460)) {
          return cljs.core.cons.call(null, p__14460, partition.call(null, n, step, cljs.core.drop.call(null, step, s__14459)))
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
      var temp__3974__auto____14461 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____14461)) {
        var s__14462 = temp__3974__auto____14461;
        var p__14463 = cljs.core.take.call(null, n, s__14462);
        if(n === cljs.core.count.call(null, p__14463)) {
          return cljs.core.cons.call(null, p__14463, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__14462)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__14463, pad)))
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
    var sentinel__14464 = cljs.core.lookup_sentinel;
    var m__14465 = m;
    var ks__14466 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__14466)) {
        var m__14467 = cljs.core.get.call(null, m__14465, cljs.core.first.call(null, ks__14466), sentinel__14464);
        if(sentinel__14464 === m__14467) {
          return not_found
        }else {
          var G__14468 = sentinel__14464;
          var G__14469 = m__14467;
          var G__14470 = cljs.core.next.call(null, ks__14466);
          sentinel__14464 = G__14468;
          m__14465 = G__14469;
          ks__14466 = G__14470;
          continue
        }
      }else {
        return m__14465
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
cljs.core.assoc_in = function assoc_in(m, p__14471, v) {
  var vec__14472__14473 = p__14471;
  var k__14474 = cljs.core.nth.call(null, vec__14472__14473, 0, null);
  var ks__14475 = cljs.core.nthnext.call(null, vec__14472__14473, 1);
  if(cljs.core.truth_(ks__14475)) {
    return cljs.core.assoc.call(null, m, k__14474, assoc_in.call(null, cljs.core.get.call(null, m, k__14474), ks__14475, v))
  }else {
    return cljs.core.assoc.call(null, m, k__14474, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__14476, f, args) {
    var vec__14477__14478 = p__14476;
    var k__14479 = cljs.core.nth.call(null, vec__14477__14478, 0, null);
    var ks__14480 = cljs.core.nthnext.call(null, vec__14477__14478, 1);
    if(cljs.core.truth_(ks__14480)) {
      return cljs.core.assoc.call(null, m, k__14479, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__14479), ks__14480, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__14479, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__14479), args))
    }
  };
  var update_in = function(m, p__14476, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__14476, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__14481) {
    var m = cljs.core.first(arglist__14481);
    var p__14476 = cljs.core.first(cljs.core.next(arglist__14481));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14481)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14481)));
    return update_in__delegate(m, p__14476, f, args)
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
  var this__14486 = this;
  var h__364__auto____14487 = this__14486.__hash;
  if(h__364__auto____14487 != null) {
    return h__364__auto____14487
  }else {
    var h__364__auto____14488 = cljs.core.hash_coll.call(null, coll);
    this__14486.__hash = h__364__auto____14488;
    return h__364__auto____14488
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14489 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14490 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14491 = this;
  var new_array__14492 = cljs.core.aclone.call(null, this__14491.array);
  new_array__14492[k] = v;
  return new cljs.core.Vector(this__14491.meta, new_array__14492, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__14521 = null;
  var G__14521__2 = function(tsym14484, k) {
    var this__14493 = this;
    var tsym14484__14494 = this;
    var coll__14495 = tsym14484__14494;
    return cljs.core._lookup.call(null, coll__14495, k)
  };
  var G__14521__3 = function(tsym14485, k, not_found) {
    var this__14496 = this;
    var tsym14485__14497 = this;
    var coll__14498 = tsym14485__14497;
    return cljs.core._lookup.call(null, coll__14498, k, not_found)
  };
  G__14521 = function(tsym14485, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14521__2.call(this, tsym14485, k);
      case 3:
        return G__14521__3.call(this, tsym14485, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14521
}();
cljs.core.Vector.prototype.apply = function(tsym14482, args14483) {
  return tsym14482.call.apply(tsym14482, [tsym14482].concat(cljs.core.aclone.call(null, args14483)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14499 = this;
  var new_array__14500 = cljs.core.aclone.call(null, this__14499.array);
  new_array__14500.push(o);
  return new cljs.core.Vector(this__14499.meta, new_array__14500, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__14501 = this;
  var this$__14502 = this;
  return cljs.core.pr_str.call(null, this$__14502)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__14503 = this;
  return cljs.core.ci_reduce.call(null, this__14503.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__14504 = this;
  return cljs.core.ci_reduce.call(null, this__14504.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14505 = this;
  if(this__14505.array.length > 0) {
    var vector_seq__14506 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__14505.array.length) {
          return cljs.core.cons.call(null, this__14505.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__14506.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14507 = this;
  return this__14507.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14508 = this;
  var count__14509 = this__14508.array.length;
  if(count__14509 > 0) {
    return this__14508.array[count__14509 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14510 = this;
  if(this__14510.array.length > 0) {
    var new_array__14511 = cljs.core.aclone.call(null, this__14510.array);
    new_array__14511.pop();
    return new cljs.core.Vector(this__14510.meta, new_array__14511, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__14512 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14513 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14514 = this;
  return new cljs.core.Vector(meta, this__14514.array, this__14514.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14515 = this;
  return this__14515.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14517 = this;
  if(function() {
    var and__3822__auto____14518 = 0 <= n;
    if(and__3822__auto____14518) {
      return n < this__14517.array.length
    }else {
      return and__3822__auto____14518
    }
  }()) {
    return this__14517.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14519 = this;
  if(function() {
    var and__3822__auto____14520 = 0 <= n;
    if(and__3822__auto____14520) {
      return n < this__14519.array.length
    }else {
      return and__3822__auto____14520
    }
  }()) {
    return this__14519.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14516 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__14516.meta)
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
  var cnt__14522 = pv.cnt;
  if(cnt__14522 < 32) {
    return 0
  }else {
    return cnt__14522 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__14523 = level;
  var ret__14524 = node;
  while(true) {
    if(ll__14523 === 0) {
      return ret__14524
    }else {
      var embed__14525 = ret__14524;
      var r__14526 = cljs.core.pv_fresh_node.call(null, edit);
      var ___14527 = cljs.core.pv_aset.call(null, r__14526, 0, embed__14525);
      var G__14528 = ll__14523 - 5;
      var G__14529 = r__14526;
      ll__14523 = G__14528;
      ret__14524 = G__14529;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__14530 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__14531 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__14530, subidx__14531, tailnode);
    return ret__14530
  }else {
    var temp__3971__auto____14532 = cljs.core.pv_aget.call(null, parent, subidx__14531);
    if(cljs.core.truth_(temp__3971__auto____14532)) {
      var child__14533 = temp__3971__auto____14532;
      var node_to_insert__14534 = push_tail.call(null, pv, level - 5, child__14533, tailnode);
      cljs.core.pv_aset.call(null, ret__14530, subidx__14531, node_to_insert__14534);
      return ret__14530
    }else {
      var node_to_insert__14535 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__14530, subidx__14531, node_to_insert__14535);
      return ret__14530
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____14536 = 0 <= i;
    if(and__3822__auto____14536) {
      return i < pv.cnt
    }else {
      return and__3822__auto____14536
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__14537 = pv.root;
      var level__14538 = pv.shift;
      while(true) {
        if(level__14538 > 0) {
          var G__14539 = cljs.core.pv_aget.call(null, node__14537, i >>> level__14538 & 31);
          var G__14540 = level__14538 - 5;
          node__14537 = G__14539;
          level__14538 = G__14540;
          continue
        }else {
          return node__14537.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__14541 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__14541, i & 31, val);
    return ret__14541
  }else {
    var subidx__14542 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__14541, subidx__14542, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__14542), i, val));
    return ret__14541
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__14543 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__14544 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__14543));
    if(function() {
      var and__3822__auto____14545 = new_child__14544 == null;
      if(and__3822__auto____14545) {
        return subidx__14543 === 0
      }else {
        return and__3822__auto____14545
      }
    }()) {
      return null
    }else {
      var ret__14546 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__14546, subidx__14543, new_child__14544);
      return ret__14546
    }
  }else {
    if(subidx__14543 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__14547 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__14547, subidx__14543, null);
        return ret__14547
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
  var c__14548 = cljs.core._count.call(null, v);
  if(c__14548 > 0) {
    if(void 0 === cljs.core.t14549) {
      cljs.core.t14549 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t14549.cljs$lang$type = true;
      cljs.core.t14549.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t14549")
      };
      cljs.core.t14549.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t14549.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__14550 = this;
        return vseq
      };
      cljs.core.t14549.prototype.cljs$core$ISeq$ = true;
      cljs.core.t14549.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__14551 = this;
        return cljs.core._nth.call(null, this__14551.v, this__14551.offset)
      };
      cljs.core.t14549.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__14552 = this;
        var offset__14553 = this__14552.offset + 1;
        if(offset__14553 < this__14552.c) {
          return this__14552.vector_seq.call(null, this__14552.v, offset__14553)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t14549.prototype.cljs$core$ASeq$ = true;
      cljs.core.t14549.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t14549.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__14554 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t14549.prototype.cljs$core$ISequential$ = true;
      cljs.core.t14549.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t14549.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__14555 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t14549.prototype.cljs$core$IMeta$ = true;
      cljs.core.t14549.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__14556 = this;
        return this__14556.__meta__389__auto__
      };
      cljs.core.t14549.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t14549.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__14557 = this;
        return new cljs.core.t14549(this__14557.c, this__14557.offset, this__14557.v, this__14557.vector_seq, __meta__389__auto__)
      };
      cljs.core.t14549
    }else {
    }
    return new cljs.core.t14549(c__14548, offset, v, vector_seq, null)
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
  var this__14562 = this;
  return new cljs.core.TransientVector(this__14562.cnt, this__14562.shift, cljs.core.tv_editable_root.call(null, this__14562.root), cljs.core.tv_editable_tail.call(null, this__14562.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14563 = this;
  var h__364__auto____14564 = this__14563.__hash;
  if(h__364__auto____14564 != null) {
    return h__364__auto____14564
  }else {
    var h__364__auto____14565 = cljs.core.hash_coll.call(null, coll);
    this__14563.__hash = h__364__auto____14565;
    return h__364__auto____14565
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14566 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14567 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14568 = this;
  if(function() {
    var and__3822__auto____14569 = 0 <= k;
    if(and__3822__auto____14569) {
      return k < this__14568.cnt
    }else {
      return and__3822__auto____14569
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__14570 = cljs.core.aclone.call(null, this__14568.tail);
      new_tail__14570[k & 31] = v;
      return new cljs.core.PersistentVector(this__14568.meta, this__14568.cnt, this__14568.shift, this__14568.root, new_tail__14570, null)
    }else {
      return new cljs.core.PersistentVector(this__14568.meta, this__14568.cnt, this__14568.shift, cljs.core.do_assoc.call(null, coll, this__14568.shift, this__14568.root, k, v), this__14568.tail, null)
    }
  }else {
    if(k === this__14568.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__14568.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__14615 = null;
  var G__14615__2 = function(tsym14560, k) {
    var this__14571 = this;
    var tsym14560__14572 = this;
    var coll__14573 = tsym14560__14572;
    return cljs.core._lookup.call(null, coll__14573, k)
  };
  var G__14615__3 = function(tsym14561, k, not_found) {
    var this__14574 = this;
    var tsym14561__14575 = this;
    var coll__14576 = tsym14561__14575;
    return cljs.core._lookup.call(null, coll__14576, k, not_found)
  };
  G__14615 = function(tsym14561, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14615__2.call(this, tsym14561, k);
      case 3:
        return G__14615__3.call(this, tsym14561, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14615
}();
cljs.core.PersistentVector.prototype.apply = function(tsym14558, args14559) {
  return tsym14558.call.apply(tsym14558, [tsym14558].concat(cljs.core.aclone.call(null, args14559)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__14577 = this;
  var step_init__14578 = [0, init];
  var i__14579 = 0;
  while(true) {
    if(i__14579 < this__14577.cnt) {
      var arr__14580 = cljs.core.array_for.call(null, v, i__14579);
      var len__14581 = arr__14580.length;
      var init__14585 = function() {
        var j__14582 = 0;
        var init__14583 = step_init__14578[1];
        while(true) {
          if(j__14582 < len__14581) {
            var init__14584 = f.call(null, init__14583, j__14582 + i__14579, arr__14580[j__14582]);
            if(cljs.core.reduced_QMARK_.call(null, init__14584)) {
              return init__14584
            }else {
              var G__14616 = j__14582 + 1;
              var G__14617 = init__14584;
              j__14582 = G__14616;
              init__14583 = G__14617;
              continue
            }
          }else {
            step_init__14578[0] = len__14581;
            step_init__14578[1] = init__14583;
            return init__14583
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__14585)) {
        return cljs.core.deref.call(null, init__14585)
      }else {
        var G__14618 = i__14579 + step_init__14578[0];
        i__14579 = G__14618;
        continue
      }
    }else {
      return step_init__14578[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14586 = this;
  if(this__14586.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__14587 = cljs.core.aclone.call(null, this__14586.tail);
    new_tail__14587.push(o);
    return new cljs.core.PersistentVector(this__14586.meta, this__14586.cnt + 1, this__14586.shift, this__14586.root, new_tail__14587, null)
  }else {
    var root_overflow_QMARK___14588 = this__14586.cnt >>> 5 > 1 << this__14586.shift;
    var new_shift__14589 = root_overflow_QMARK___14588 ? this__14586.shift + 5 : this__14586.shift;
    var new_root__14591 = root_overflow_QMARK___14588 ? function() {
      var n_r__14590 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__14590, 0, this__14586.root);
      cljs.core.pv_aset.call(null, n_r__14590, 1, cljs.core.new_path.call(null, null, this__14586.shift, new cljs.core.VectorNode(null, this__14586.tail)));
      return n_r__14590
    }() : cljs.core.push_tail.call(null, coll, this__14586.shift, this__14586.root, new cljs.core.VectorNode(null, this__14586.tail));
    return new cljs.core.PersistentVector(this__14586.meta, this__14586.cnt + 1, new_shift__14589, new_root__14591, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__14592 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__14593 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__14594 = this;
  var this$__14595 = this;
  return cljs.core.pr_str.call(null, this$__14595)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__14596 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__14597 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14598 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14599 = this;
  return this__14599.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14600 = this;
  if(this__14600.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__14600.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14601 = this;
  if(this__14601.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__14601.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__14601.meta)
    }else {
      if(1 < this__14601.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__14601.meta, this__14601.cnt - 1, this__14601.shift, this__14601.root, this__14601.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__14602 = cljs.core.array_for.call(null, coll, this__14601.cnt - 2);
          var nr__14603 = cljs.core.pop_tail.call(null, coll, this__14601.shift, this__14601.root);
          var new_root__14604 = nr__14603 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__14603;
          var cnt_1__14605 = this__14601.cnt - 1;
          if(function() {
            var and__3822__auto____14606 = 5 < this__14601.shift;
            if(and__3822__auto____14606) {
              return cljs.core.pv_aget.call(null, new_root__14604, 1) == null
            }else {
              return and__3822__auto____14606
            }
          }()) {
            return new cljs.core.PersistentVector(this__14601.meta, cnt_1__14605, this__14601.shift - 5, cljs.core.pv_aget.call(null, new_root__14604, 0), new_tail__14602, null)
          }else {
            return new cljs.core.PersistentVector(this__14601.meta, cnt_1__14605, this__14601.shift, new_root__14604, new_tail__14602, null)
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
  var this__14608 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14609 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14610 = this;
  return new cljs.core.PersistentVector(meta, this__14610.cnt, this__14610.shift, this__14610.root, this__14610.tail, this__14610.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14611 = this;
  return this__14611.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14612 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14613 = this;
  if(function() {
    var and__3822__auto____14614 = 0 <= n;
    if(and__3822__auto____14614) {
      return n < this__14613.cnt
    }else {
      return and__3822__auto____14614
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14607 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__14607.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__14619 = cljs.core.seq.call(null, xs);
  var out__14620 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__14619)) {
      var G__14621 = cljs.core.next.call(null, xs__14619);
      var G__14622 = cljs.core.conj_BANG_.call(null, out__14620, cljs.core.first.call(null, xs__14619));
      xs__14619 = G__14621;
      out__14620 = G__14622;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__14620)
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
  vector.cljs$lang$applyTo = function(arglist__14623) {
    var args = cljs.core.seq(arglist__14623);
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
  var this__14628 = this;
  var h__364__auto____14629 = this__14628.__hash;
  if(h__364__auto____14629 != null) {
    return h__364__auto____14629
  }else {
    var h__364__auto____14630 = cljs.core.hash_coll.call(null, coll);
    this__14628.__hash = h__364__auto____14630;
    return h__364__auto____14630
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14631 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14632 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__14633 = this;
  var v_pos__14634 = this__14633.start + key;
  return new cljs.core.Subvec(this__14633.meta, cljs.core._assoc.call(null, this__14633.v, v_pos__14634, val), this__14633.start, this__14633.end > v_pos__14634 + 1 ? this__14633.end : v_pos__14634 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__14658 = null;
  var G__14658__2 = function(tsym14626, k) {
    var this__14635 = this;
    var tsym14626__14636 = this;
    var coll__14637 = tsym14626__14636;
    return cljs.core._lookup.call(null, coll__14637, k)
  };
  var G__14658__3 = function(tsym14627, k, not_found) {
    var this__14638 = this;
    var tsym14627__14639 = this;
    var coll__14640 = tsym14627__14639;
    return cljs.core._lookup.call(null, coll__14640, k, not_found)
  };
  G__14658 = function(tsym14627, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14658__2.call(this, tsym14627, k);
      case 3:
        return G__14658__3.call(this, tsym14627, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14658
}();
cljs.core.Subvec.prototype.apply = function(tsym14624, args14625) {
  return tsym14624.call.apply(tsym14624, [tsym14624].concat(cljs.core.aclone.call(null, args14625)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14641 = this;
  return new cljs.core.Subvec(this__14641.meta, cljs.core._assoc_n.call(null, this__14641.v, this__14641.end, o), this__14641.start, this__14641.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__14642 = this;
  var this$__14643 = this;
  return cljs.core.pr_str.call(null, this$__14643)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__14644 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__14645 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14646 = this;
  var subvec_seq__14647 = function subvec_seq(i) {
    if(i === this__14646.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__14646.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__14647.call(null, this__14646.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14648 = this;
  return this__14648.end - this__14648.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14649 = this;
  return cljs.core._nth.call(null, this__14649.v, this__14649.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14650 = this;
  if(this__14650.start === this__14650.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__14650.meta, this__14650.v, this__14650.start, this__14650.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__14651 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14652 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14653 = this;
  return new cljs.core.Subvec(meta, this__14653.v, this__14653.start, this__14653.end, this__14653.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14654 = this;
  return this__14654.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14656 = this;
  return cljs.core._nth.call(null, this__14656.v, this__14656.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14657 = this;
  return cljs.core._nth.call(null, this__14657.v, this__14657.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14655 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__14655.meta)
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
  var ret__14659 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__14659, 0, tl.length);
  return ret__14659
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__14660 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__14661 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__14660, subidx__14661, level === 5 ? tail_node : function() {
    var child__14662 = cljs.core.pv_aget.call(null, ret__14660, subidx__14661);
    if(child__14662 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__14662, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__14660
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__14663 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__14664 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__14665 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__14663, subidx__14664));
    if(function() {
      var and__3822__auto____14666 = new_child__14665 == null;
      if(and__3822__auto____14666) {
        return subidx__14664 === 0
      }else {
        return and__3822__auto____14666
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__14663, subidx__14664, new_child__14665);
      return node__14663
    }
  }else {
    if(subidx__14664 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__14663, subidx__14664, null);
        return node__14663
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____14667 = 0 <= i;
    if(and__3822__auto____14667) {
      return i < tv.cnt
    }else {
      return and__3822__auto____14667
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__14668 = tv.root;
      var node__14669 = root__14668;
      var level__14670 = tv.shift;
      while(true) {
        if(level__14670 > 0) {
          var G__14671 = cljs.core.tv_ensure_editable.call(null, root__14668.edit, cljs.core.pv_aget.call(null, node__14669, i >>> level__14670 & 31));
          var G__14672 = level__14670 - 5;
          node__14669 = G__14671;
          level__14670 = G__14672;
          continue
        }else {
          return node__14669.arr
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
  var G__14710 = null;
  var G__14710__2 = function(tsym14675, k) {
    var this__14677 = this;
    var tsym14675__14678 = this;
    var coll__14679 = tsym14675__14678;
    return cljs.core._lookup.call(null, coll__14679, k)
  };
  var G__14710__3 = function(tsym14676, k, not_found) {
    var this__14680 = this;
    var tsym14676__14681 = this;
    var coll__14682 = tsym14676__14681;
    return cljs.core._lookup.call(null, coll__14682, k, not_found)
  };
  G__14710 = function(tsym14676, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14710__2.call(this, tsym14676, k);
      case 3:
        return G__14710__3.call(this, tsym14676, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14710
}();
cljs.core.TransientVector.prototype.apply = function(tsym14673, args14674) {
  return tsym14673.call.apply(tsym14673, [tsym14673].concat(cljs.core.aclone.call(null, args14674)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14683 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14684 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__14685 = this;
  if(cljs.core.truth_(this__14685.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__14686 = this;
  if(function() {
    var and__3822__auto____14687 = 0 <= n;
    if(and__3822__auto____14687) {
      return n < this__14686.cnt
    }else {
      return and__3822__auto____14687
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14688 = this;
  if(cljs.core.truth_(this__14688.root.edit)) {
    return this__14688.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__14689 = this;
  if(cljs.core.truth_(this__14689.root.edit)) {
    if(function() {
      var and__3822__auto____14690 = 0 <= n;
      if(and__3822__auto____14690) {
        return n < this__14689.cnt
      }else {
        return and__3822__auto____14690
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__14689.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__14693 = function go(level, node) {
          var node__14691 = cljs.core.tv_ensure_editable.call(null, this__14689.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__14691, n & 31, val);
            return node__14691
          }else {
            var subidx__14692 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__14691, subidx__14692, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__14691, subidx__14692)));
            return node__14691
          }
        }.call(null, this__14689.shift, this__14689.root);
        this__14689.root = new_root__14693;
        return tcoll
      }
    }else {
      if(n === this__14689.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__14689.cnt)].join(""));
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
  var this__14694 = this;
  if(cljs.core.truth_(this__14694.root.edit)) {
    if(this__14694.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__14694.cnt) {
        this__14694.cnt = 0;
        return tcoll
      }else {
        if((this__14694.cnt - 1 & 31) > 0) {
          this__14694.cnt = this__14694.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__14695 = cljs.core.editable_array_for.call(null, tcoll, this__14694.cnt - 2);
            var new_root__14697 = function() {
              var nr__14696 = cljs.core.tv_pop_tail.call(null, tcoll, this__14694.shift, this__14694.root);
              if(nr__14696 != null) {
                return nr__14696
              }else {
                return new cljs.core.VectorNode(this__14694.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____14698 = 5 < this__14694.shift;
              if(and__3822__auto____14698) {
                return cljs.core.pv_aget.call(null, new_root__14697, 1) == null
              }else {
                return and__3822__auto____14698
              }
            }()) {
              var new_root__14699 = cljs.core.tv_ensure_editable.call(null, this__14694.root.edit, cljs.core.pv_aget.call(null, new_root__14697, 0));
              this__14694.root = new_root__14699;
              this__14694.shift = this__14694.shift - 5;
              this__14694.cnt = this__14694.cnt - 1;
              this__14694.tail = new_tail__14695;
              return tcoll
            }else {
              this__14694.root = new_root__14697;
              this__14694.cnt = this__14694.cnt - 1;
              this__14694.tail = new_tail__14695;
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
  var this__14700 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__14701 = this;
  if(cljs.core.truth_(this__14701.root.edit)) {
    if(this__14701.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__14701.tail[this__14701.cnt & 31] = o;
      this__14701.cnt = this__14701.cnt + 1;
      return tcoll
    }else {
      var tail_node__14702 = new cljs.core.VectorNode(this__14701.root.edit, this__14701.tail);
      var new_tail__14703 = cljs.core.make_array.call(null, 32);
      new_tail__14703[0] = o;
      this__14701.tail = new_tail__14703;
      if(this__14701.cnt >>> 5 > 1 << this__14701.shift) {
        var new_root_array__14704 = cljs.core.make_array.call(null, 32);
        var new_shift__14705 = this__14701.shift + 5;
        new_root_array__14704[0] = this__14701.root;
        new_root_array__14704[1] = cljs.core.new_path.call(null, this__14701.root.edit, this__14701.shift, tail_node__14702);
        this__14701.root = new cljs.core.VectorNode(this__14701.root.edit, new_root_array__14704);
        this__14701.shift = new_shift__14705;
        this__14701.cnt = this__14701.cnt + 1;
        return tcoll
      }else {
        var new_root__14706 = cljs.core.tv_push_tail.call(null, tcoll, this__14701.shift, this__14701.root, tail_node__14702);
        this__14701.root = new_root__14706;
        this__14701.cnt = this__14701.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__14707 = this;
  if(cljs.core.truth_(this__14707.root.edit)) {
    this__14707.root.edit = null;
    var len__14708 = this__14707.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__14709 = cljs.core.make_array.call(null, len__14708);
    cljs.core.array_copy.call(null, this__14707.tail, 0, trimmed_tail__14709, 0, len__14708);
    return new cljs.core.PersistentVector(null, this__14707.cnt, this__14707.shift, this__14707.root, trimmed_tail__14709, null)
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
  var this__14711 = this;
  var h__364__auto____14712 = this__14711.__hash;
  if(h__364__auto____14712 != null) {
    return h__364__auto____14712
  }else {
    var h__364__auto____14713 = cljs.core.hash_coll.call(null, coll);
    this__14711.__hash = h__364__auto____14713;
    return h__364__auto____14713
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14714 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__14715 = this;
  var this$__14716 = this;
  return cljs.core.pr_str.call(null, this$__14716)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14717 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14718 = this;
  return cljs.core._first.call(null, this__14718.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14719 = this;
  var temp__3971__auto____14720 = cljs.core.next.call(null, this__14719.front);
  if(cljs.core.truth_(temp__3971__auto____14720)) {
    var f1__14721 = temp__3971__auto____14720;
    return new cljs.core.PersistentQueueSeq(this__14719.meta, f1__14721, this__14719.rear, null)
  }else {
    if(this__14719.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__14719.meta, this__14719.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14722 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14723 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__14723.front, this__14723.rear, this__14723.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14724 = this;
  return this__14724.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14725 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14725.meta)
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
  var this__14726 = this;
  var h__364__auto____14727 = this__14726.__hash;
  if(h__364__auto____14727 != null) {
    return h__364__auto____14727
  }else {
    var h__364__auto____14728 = cljs.core.hash_coll.call(null, coll);
    this__14726.__hash = h__364__auto____14728;
    return h__364__auto____14728
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14729 = this;
  if(cljs.core.truth_(this__14729.front)) {
    return new cljs.core.PersistentQueue(this__14729.meta, this__14729.count + 1, this__14729.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____14730 = this__14729.rear;
      if(cljs.core.truth_(or__3824__auto____14730)) {
        return or__3824__auto____14730
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__14729.meta, this__14729.count + 1, cljs.core.conj.call(null, this__14729.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__14731 = this;
  var this$__14732 = this;
  return cljs.core.pr_str.call(null, this$__14732)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14733 = this;
  var rear__14734 = cljs.core.seq.call(null, this__14733.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____14735 = this__14733.front;
    if(cljs.core.truth_(or__3824__auto____14735)) {
      return or__3824__auto____14735
    }else {
      return rear__14734
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__14733.front, cljs.core.seq.call(null, rear__14734), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14736 = this;
  return this__14736.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__14737 = this;
  return cljs.core._first.call(null, this__14737.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__14738 = this;
  if(cljs.core.truth_(this__14738.front)) {
    var temp__3971__auto____14739 = cljs.core.next.call(null, this__14738.front);
    if(cljs.core.truth_(temp__3971__auto____14739)) {
      var f1__14740 = temp__3971__auto____14739;
      return new cljs.core.PersistentQueue(this__14738.meta, this__14738.count - 1, f1__14740, this__14738.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__14738.meta, this__14738.count - 1, cljs.core.seq.call(null, this__14738.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__14741 = this;
  return cljs.core.first.call(null, this__14741.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__14742 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14743 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14744 = this;
  return new cljs.core.PersistentQueue(meta, this__14744.count, this__14744.front, this__14744.rear, this__14744.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14745 = this;
  return this__14745.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14746 = this;
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
  var this__14747 = this;
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
  var len__14748 = array.length;
  var i__14749 = 0;
  while(true) {
    if(i__14749 < len__14748) {
      if(cljs.core._EQ_.call(null, k, array[i__14749])) {
        return i__14749
      }else {
        var G__14750 = i__14749 + incr;
        i__14749 = G__14750;
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
      var and__3822__auto____14751 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____14751)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____14751
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
  var a__14752 = cljs.core.hash.call(null, a);
  var b__14753 = cljs.core.hash.call(null, b);
  if(a__14752 < b__14753) {
    return-1
  }else {
    if(a__14752 > b__14753) {
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
  var ks__14755 = m.keys;
  var len__14756 = ks__14755.length;
  var so__14757 = m.strobj;
  var out__14758 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__14759 = 0;
  var out__14760 = cljs.core.transient$.call(null, out__14758);
  while(true) {
    if(i__14759 < len__14756) {
      var k__14761 = ks__14755[i__14759];
      var G__14762 = i__14759 + 1;
      var G__14763 = cljs.core.assoc_BANG_.call(null, out__14760, k__14761, so__14757[k__14761]);
      i__14759 = G__14762;
      out__14760 = G__14763;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__14760, k, v))
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
  var this__14768 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14769 = this;
  var h__364__auto____14770 = this__14769.__hash;
  if(h__364__auto____14770 != null) {
    return h__364__auto____14770
  }else {
    var h__364__auto____14771 = cljs.core.hash_imap.call(null, coll);
    this__14769.__hash = h__364__auto____14771;
    return h__364__auto____14771
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14772 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14773 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__14773.strobj, this__14773.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14774 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___14775 = this__14774.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___14775)) {
      var new_strobj__14776 = goog.object.clone.call(null, this__14774.strobj);
      new_strobj__14776[k] = v;
      return new cljs.core.ObjMap(this__14774.meta, this__14774.keys, new_strobj__14776, this__14774.update_count + 1, null)
    }else {
      if(this__14774.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__14777 = goog.object.clone.call(null, this__14774.strobj);
        var new_keys__14778 = cljs.core.aclone.call(null, this__14774.keys);
        new_strobj__14777[k] = v;
        new_keys__14778.push(k);
        return new cljs.core.ObjMap(this__14774.meta, new_keys__14778, new_strobj__14777, this__14774.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__14779 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__14779.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__14799 = null;
  var G__14799__2 = function(tsym14766, k) {
    var this__14780 = this;
    var tsym14766__14781 = this;
    var coll__14782 = tsym14766__14781;
    return cljs.core._lookup.call(null, coll__14782, k)
  };
  var G__14799__3 = function(tsym14767, k, not_found) {
    var this__14783 = this;
    var tsym14767__14784 = this;
    var coll__14785 = tsym14767__14784;
    return cljs.core._lookup.call(null, coll__14785, k, not_found)
  };
  G__14799 = function(tsym14767, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14799__2.call(this, tsym14767, k);
      case 3:
        return G__14799__3.call(this, tsym14767, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14799
}();
cljs.core.ObjMap.prototype.apply = function(tsym14764, args14765) {
  return tsym14764.call.apply(tsym14764, [tsym14764].concat(cljs.core.aclone.call(null, args14765)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__14786 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__14787 = this;
  var this$__14788 = this;
  return cljs.core.pr_str.call(null, this$__14788)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14789 = this;
  if(this__14789.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__14754_SHARP_) {
      return cljs.core.vector.call(null, p1__14754_SHARP_, this__14789.strobj[p1__14754_SHARP_])
    }, this__14789.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14790 = this;
  return this__14790.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14791 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14792 = this;
  return new cljs.core.ObjMap(meta, this__14792.keys, this__14792.strobj, this__14792.update_count, this__14792.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14793 = this;
  return this__14793.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14794 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__14794.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__14795 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____14796 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____14796)) {
      return this__14795.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____14796
    }
  }())) {
    var new_keys__14797 = cljs.core.aclone.call(null, this__14795.keys);
    var new_strobj__14798 = goog.object.clone.call(null, this__14795.strobj);
    new_keys__14797.splice(cljs.core.scan_array.call(null, 1, k, new_keys__14797), 1);
    cljs.core.js_delete.call(null, new_strobj__14798, k);
    return new cljs.core.ObjMap(this__14795.meta, new_keys__14797, new_strobj__14798, this__14795.update_count + 1, null)
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
  var this__14805 = this;
  var h__364__auto____14806 = this__14805.__hash;
  if(h__364__auto____14806 != null) {
    return h__364__auto____14806
  }else {
    var h__364__auto____14807 = cljs.core.hash_imap.call(null, coll);
    this__14805.__hash = h__364__auto____14807;
    return h__364__auto____14807
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14808 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14809 = this;
  var bucket__14810 = this__14809.hashobj[cljs.core.hash.call(null, k)];
  var i__14811 = cljs.core.truth_(bucket__14810) ? cljs.core.scan_array.call(null, 2, k, bucket__14810) : null;
  if(cljs.core.truth_(i__14811)) {
    return bucket__14810[i__14811 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14812 = this;
  var h__14813 = cljs.core.hash.call(null, k);
  var bucket__14814 = this__14812.hashobj[h__14813];
  if(cljs.core.truth_(bucket__14814)) {
    var new_bucket__14815 = cljs.core.aclone.call(null, bucket__14814);
    var new_hashobj__14816 = goog.object.clone.call(null, this__14812.hashobj);
    new_hashobj__14816[h__14813] = new_bucket__14815;
    var temp__3971__auto____14817 = cljs.core.scan_array.call(null, 2, k, new_bucket__14815);
    if(cljs.core.truth_(temp__3971__auto____14817)) {
      var i__14818 = temp__3971__auto____14817;
      new_bucket__14815[i__14818 + 1] = v;
      return new cljs.core.HashMap(this__14812.meta, this__14812.count, new_hashobj__14816, null)
    }else {
      new_bucket__14815.push(k, v);
      return new cljs.core.HashMap(this__14812.meta, this__14812.count + 1, new_hashobj__14816, null)
    }
  }else {
    var new_hashobj__14819 = goog.object.clone.call(null, this__14812.hashobj);
    new_hashobj__14819[h__14813] = [k, v];
    return new cljs.core.HashMap(this__14812.meta, this__14812.count + 1, new_hashobj__14819, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__14820 = this;
  var bucket__14821 = this__14820.hashobj[cljs.core.hash.call(null, k)];
  var i__14822 = cljs.core.truth_(bucket__14821) ? cljs.core.scan_array.call(null, 2, k, bucket__14821) : null;
  if(cljs.core.truth_(i__14822)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__14845 = null;
  var G__14845__2 = function(tsym14803, k) {
    var this__14823 = this;
    var tsym14803__14824 = this;
    var coll__14825 = tsym14803__14824;
    return cljs.core._lookup.call(null, coll__14825, k)
  };
  var G__14845__3 = function(tsym14804, k, not_found) {
    var this__14826 = this;
    var tsym14804__14827 = this;
    var coll__14828 = tsym14804__14827;
    return cljs.core._lookup.call(null, coll__14828, k, not_found)
  };
  G__14845 = function(tsym14804, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14845__2.call(this, tsym14804, k);
      case 3:
        return G__14845__3.call(this, tsym14804, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14845
}();
cljs.core.HashMap.prototype.apply = function(tsym14801, args14802) {
  return tsym14801.call.apply(tsym14801, [tsym14801].concat(cljs.core.aclone.call(null, args14802)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__14829 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__14830 = this;
  var this$__14831 = this;
  return cljs.core.pr_str.call(null, this$__14831)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14832 = this;
  if(this__14832.count > 0) {
    var hashes__14833 = cljs.core.js_keys.call(null, this__14832.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__14800_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__14832.hashobj[p1__14800_SHARP_]))
    }, hashes__14833)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14834 = this;
  return this__14834.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14835 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14836 = this;
  return new cljs.core.HashMap(meta, this__14836.count, this__14836.hashobj, this__14836.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14837 = this;
  return this__14837.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14838 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__14838.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__14839 = this;
  var h__14840 = cljs.core.hash.call(null, k);
  var bucket__14841 = this__14839.hashobj[h__14840];
  var i__14842 = cljs.core.truth_(bucket__14841) ? cljs.core.scan_array.call(null, 2, k, bucket__14841) : null;
  if(cljs.core.not.call(null, i__14842)) {
    return coll
  }else {
    var new_hashobj__14843 = goog.object.clone.call(null, this__14839.hashobj);
    if(3 > bucket__14841.length) {
      cljs.core.js_delete.call(null, new_hashobj__14843, h__14840)
    }else {
      var new_bucket__14844 = cljs.core.aclone.call(null, bucket__14841);
      new_bucket__14844.splice(i__14842, 2);
      new_hashobj__14843[h__14840] = new_bucket__14844
    }
    return new cljs.core.HashMap(this__14839.meta, this__14839.count - 1, new_hashobj__14843, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__14846 = ks.length;
  var i__14847 = 0;
  var out__14848 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__14847 < len__14846) {
      var G__14849 = i__14847 + 1;
      var G__14850 = cljs.core.assoc.call(null, out__14848, ks[i__14847], vs[i__14847]);
      i__14847 = G__14849;
      out__14848 = G__14850;
      continue
    }else {
      return out__14848
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__14851 = m.arr;
  var len__14852 = arr__14851.length;
  var i__14853 = 0;
  while(true) {
    if(len__14852 <= i__14853) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__14851[i__14853], k)) {
        return i__14853
      }else {
        if("\ufdd0'else") {
          var G__14854 = i__14853 + 2;
          i__14853 = G__14854;
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
  var this__14859 = this;
  return new cljs.core.TransientArrayMap({}, this__14859.arr.length, cljs.core.aclone.call(null, this__14859.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14860 = this;
  var h__364__auto____14861 = this__14860.__hash;
  if(h__364__auto____14861 != null) {
    return h__364__auto____14861
  }else {
    var h__364__auto____14862 = cljs.core.hash_imap.call(null, coll);
    this__14860.__hash = h__364__auto____14862;
    return h__364__auto____14862
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14863 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14864 = this;
  var idx__14865 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__14865 === -1) {
    return not_found
  }else {
    return this__14864.arr[idx__14865 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14866 = this;
  var idx__14867 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__14867 === -1) {
    if(this__14866.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__14866.meta, this__14866.cnt + 1, function() {
        var G__14868__14869 = cljs.core.aclone.call(null, this__14866.arr);
        G__14868__14869.push(k);
        G__14868__14869.push(v);
        return G__14868__14869
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__14866.arr[idx__14867 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__14866.meta, this__14866.cnt, function() {
          var G__14870__14871 = cljs.core.aclone.call(null, this__14866.arr);
          G__14870__14871[idx__14867 + 1] = v;
          return G__14870__14871
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__14872 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__14902 = null;
  var G__14902__2 = function(tsym14857, k) {
    var this__14873 = this;
    var tsym14857__14874 = this;
    var coll__14875 = tsym14857__14874;
    return cljs.core._lookup.call(null, coll__14875, k)
  };
  var G__14902__3 = function(tsym14858, k, not_found) {
    var this__14876 = this;
    var tsym14858__14877 = this;
    var coll__14878 = tsym14858__14877;
    return cljs.core._lookup.call(null, coll__14878, k, not_found)
  };
  G__14902 = function(tsym14858, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14902__2.call(this, tsym14858, k);
      case 3:
        return G__14902__3.call(this, tsym14858, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14902
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym14855, args14856) {
  return tsym14855.call.apply(tsym14855, [tsym14855].concat(cljs.core.aclone.call(null, args14856)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__14879 = this;
  var len__14880 = this__14879.arr.length;
  var i__14881 = 0;
  var init__14882 = init;
  while(true) {
    if(i__14881 < len__14880) {
      var init__14883 = f.call(null, init__14882, this__14879.arr[i__14881], this__14879.arr[i__14881 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__14883)) {
        return cljs.core.deref.call(null, init__14883)
      }else {
        var G__14903 = i__14881 + 2;
        var G__14904 = init__14883;
        i__14881 = G__14903;
        init__14882 = G__14904;
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
  var this__14884 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__14885 = this;
  var this$__14886 = this;
  return cljs.core.pr_str.call(null, this$__14886)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14887 = this;
  if(this__14887.cnt > 0) {
    var len__14888 = this__14887.arr.length;
    var array_map_seq__14889 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__14888) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__14887.arr[i], this__14887.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__14889.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14890 = this;
  return this__14890.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14891 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14892 = this;
  return new cljs.core.PersistentArrayMap(meta, this__14892.cnt, this__14892.arr, this__14892.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14893 = this;
  return this__14893.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14894 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__14894.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__14895 = this;
  var idx__14896 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__14896 >= 0) {
    var len__14897 = this__14895.arr.length;
    var new_len__14898 = len__14897 - 2;
    if(new_len__14898 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__14899 = cljs.core.make_array.call(null, new_len__14898);
      var s__14900 = 0;
      var d__14901 = 0;
      while(true) {
        if(s__14900 >= len__14897) {
          return new cljs.core.PersistentArrayMap(this__14895.meta, this__14895.cnt - 1, new_arr__14899, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__14895.arr[s__14900])) {
            var G__14905 = s__14900 + 2;
            var G__14906 = d__14901;
            s__14900 = G__14905;
            d__14901 = G__14906;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__14899[d__14901] = this__14895.arr[s__14900];
              new_arr__14899[d__14901 + 1] = this__14895.arr[s__14900 + 1];
              var G__14907 = s__14900 + 2;
              var G__14908 = d__14901 + 2;
              s__14900 = G__14907;
              d__14901 = G__14908;
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
  var len__14909 = cljs.core.count.call(null, ks);
  var i__14910 = 0;
  var out__14911 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__14910 < len__14909) {
      var G__14912 = i__14910 + 1;
      var G__14913 = cljs.core.assoc_BANG_.call(null, out__14911, ks[i__14910], vs[i__14910]);
      i__14910 = G__14912;
      out__14911 = G__14913;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__14911)
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
  var this__14914 = this;
  if(cljs.core.truth_(this__14914.editable_QMARK_)) {
    var idx__14915 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__14915 >= 0) {
      this__14914.arr[idx__14915] = this__14914.arr[this__14914.len - 2];
      this__14914.arr[idx__14915 + 1] = this__14914.arr[this__14914.len - 1];
      var G__14916__14917 = this__14914.arr;
      G__14916__14917.pop();
      G__14916__14917.pop();
      G__14916__14917;
      this__14914.len = this__14914.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__14918 = this;
  if(cljs.core.truth_(this__14918.editable_QMARK_)) {
    var idx__14919 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__14919 === -1) {
      if(this__14918.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__14918.len = this__14918.len + 2;
        this__14918.arr.push(key);
        this__14918.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__14918.len, this__14918.arr), key, val)
      }
    }else {
      if(val === this__14918.arr[idx__14919 + 1]) {
        return tcoll
      }else {
        this__14918.arr[idx__14919 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__14920 = this;
  if(cljs.core.truth_(this__14920.editable_QMARK_)) {
    if(function() {
      var G__14921__14922 = o;
      if(G__14921__14922 != null) {
        if(function() {
          var or__3824__auto____14923 = G__14921__14922.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____14923) {
            return or__3824__auto____14923
          }else {
            return G__14921__14922.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__14921__14922.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__14921__14922)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__14921__14922)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__14924 = cljs.core.seq.call(null, o);
      var tcoll__14925 = tcoll;
      while(true) {
        var temp__3971__auto____14926 = cljs.core.first.call(null, es__14924);
        if(cljs.core.truth_(temp__3971__auto____14926)) {
          var e__14927 = temp__3971__auto____14926;
          var G__14933 = cljs.core.next.call(null, es__14924);
          var G__14934 = cljs.core._assoc_BANG_.call(null, tcoll__14925, cljs.core.key.call(null, e__14927), cljs.core.val.call(null, e__14927));
          es__14924 = G__14933;
          tcoll__14925 = G__14934;
          continue
        }else {
          return tcoll__14925
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__14928 = this;
  if(cljs.core.truth_(this__14928.editable_QMARK_)) {
    this__14928.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__14928.len, 2), this__14928.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__14929 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__14930 = this;
  if(cljs.core.truth_(this__14930.editable_QMARK_)) {
    var idx__14931 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__14931 === -1) {
      return not_found
    }else {
      return this__14930.arr[idx__14931 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__14932 = this;
  if(cljs.core.truth_(this__14932.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__14932.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__14935 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__14936 = 0;
  while(true) {
    if(i__14936 < len) {
      var G__14937 = cljs.core.assoc_BANG_.call(null, out__14935, arr[i__14936], arr[i__14936 + 1]);
      var G__14938 = i__14936 + 2;
      out__14935 = G__14937;
      i__14936 = G__14938;
      continue
    }else {
      return out__14935
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
    var G__14939__14940 = cljs.core.aclone.call(null, arr);
    G__14939__14940[i] = a;
    return G__14939__14940
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__14941__14942 = cljs.core.aclone.call(null, arr);
    G__14941__14942[i] = a;
    G__14941__14942[j] = b;
    return G__14941__14942
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
  var new_arr__14943 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__14943, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__14943, 2 * i, new_arr__14943.length - 2 * i);
  return new_arr__14943
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
    var editable__14944 = inode.ensure_editable(edit);
    editable__14944.arr[i] = a;
    return editable__14944
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__14945 = inode.ensure_editable(edit);
    editable__14945.arr[i] = a;
    editable__14945.arr[j] = b;
    return editable__14945
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
  var len__14946 = arr.length;
  var i__14947 = 0;
  var init__14948 = init;
  while(true) {
    if(i__14947 < len__14946) {
      var init__14951 = function() {
        var k__14949 = arr[i__14947];
        if(k__14949 != null) {
          return f.call(null, init__14948, k__14949, arr[i__14947 + 1])
        }else {
          var node__14950 = arr[i__14947 + 1];
          if(node__14950 != null) {
            return node__14950.kv_reduce(f, init__14948)
          }else {
            return init__14948
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__14951)) {
        return cljs.core.deref.call(null, init__14951)
      }else {
        var G__14952 = i__14947 + 2;
        var G__14953 = init__14951;
        i__14947 = G__14952;
        init__14948 = G__14953;
        continue
      }
    }else {
      return init__14948
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
  var this__14954 = this;
  var inode__14955 = this;
  if(this__14954.bitmap === bit) {
    return null
  }else {
    var editable__14956 = inode__14955.ensure_editable(e);
    var earr__14957 = editable__14956.arr;
    var len__14958 = earr__14957.length;
    editable__14956.bitmap = bit ^ editable__14956.bitmap;
    cljs.core.array_copy.call(null, earr__14957, 2 * (i + 1), earr__14957, 2 * i, len__14958 - 2 * (i + 1));
    earr__14957[len__14958 - 2] = null;
    earr__14957[len__14958 - 1] = null;
    return editable__14956
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__14959 = this;
  var inode__14960 = this;
  var bit__14961 = 1 << (hash >>> shift & 31);
  var idx__14962 = cljs.core.bitmap_indexed_node_index.call(null, this__14959.bitmap, bit__14961);
  if((this__14959.bitmap & bit__14961) === 0) {
    var n__14963 = cljs.core.bit_count.call(null, this__14959.bitmap);
    if(2 * n__14963 < this__14959.arr.length) {
      var editable__14964 = inode__14960.ensure_editable(edit);
      var earr__14965 = editable__14964.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__14965, 2 * idx__14962, earr__14965, 2 * (idx__14962 + 1), 2 * (n__14963 - idx__14962));
      earr__14965[2 * idx__14962] = key;
      earr__14965[2 * idx__14962 + 1] = val;
      editable__14964.bitmap = editable__14964.bitmap | bit__14961;
      return editable__14964
    }else {
      if(n__14963 >= 16) {
        var nodes__14966 = cljs.core.make_array.call(null, 32);
        var jdx__14967 = hash >>> shift & 31;
        nodes__14966[jdx__14967] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__14968 = 0;
        var j__14969 = 0;
        while(true) {
          if(i__14968 < 32) {
            if((this__14959.bitmap >>> i__14968 & 1) === 0) {
              var G__15022 = i__14968 + 1;
              var G__15023 = j__14969;
              i__14968 = G__15022;
              j__14969 = G__15023;
              continue
            }else {
              nodes__14966[i__14968] = null != this__14959.arr[j__14969] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__14959.arr[j__14969]), this__14959.arr[j__14969], this__14959.arr[j__14969 + 1], added_leaf_QMARK_) : this__14959.arr[j__14969 + 1];
              var G__15024 = i__14968 + 1;
              var G__15025 = j__14969 + 2;
              i__14968 = G__15024;
              j__14969 = G__15025;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__14963 + 1, nodes__14966)
      }else {
        if("\ufdd0'else") {
          var new_arr__14970 = cljs.core.make_array.call(null, 2 * (n__14963 + 4));
          cljs.core.array_copy.call(null, this__14959.arr, 0, new_arr__14970, 0, 2 * idx__14962);
          new_arr__14970[2 * idx__14962] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__14970[2 * idx__14962 + 1] = val;
          cljs.core.array_copy.call(null, this__14959.arr, 2 * idx__14962, new_arr__14970, 2 * (idx__14962 + 1), 2 * (n__14963 - idx__14962));
          var editable__14971 = inode__14960.ensure_editable(edit);
          editable__14971.arr = new_arr__14970;
          editable__14971.bitmap = editable__14971.bitmap | bit__14961;
          return editable__14971
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__14972 = this__14959.arr[2 * idx__14962];
    var val_or_node__14973 = this__14959.arr[2 * idx__14962 + 1];
    if(null == key_or_nil__14972) {
      var n__14974 = val_or_node__14973.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__14974 === val_or_node__14973) {
        return inode__14960
      }else {
        return cljs.core.edit_and_set.call(null, inode__14960, edit, 2 * idx__14962 + 1, n__14974)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__14972)) {
        if(val === val_or_node__14973) {
          return inode__14960
        }else {
          return cljs.core.edit_and_set.call(null, inode__14960, edit, 2 * idx__14962 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__14960, edit, 2 * idx__14962, null, 2 * idx__14962 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__14972, val_or_node__14973, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__14975 = this;
  var inode__14976 = this;
  return cljs.core.create_inode_seq.call(null, this__14975.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__14977 = this;
  var inode__14978 = this;
  var bit__14979 = 1 << (hash >>> shift & 31);
  if((this__14977.bitmap & bit__14979) === 0) {
    return inode__14978
  }else {
    var idx__14980 = cljs.core.bitmap_indexed_node_index.call(null, this__14977.bitmap, bit__14979);
    var key_or_nil__14981 = this__14977.arr[2 * idx__14980];
    var val_or_node__14982 = this__14977.arr[2 * idx__14980 + 1];
    if(null == key_or_nil__14981) {
      var n__14983 = val_or_node__14982.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__14983 === val_or_node__14982) {
        return inode__14978
      }else {
        if(null != n__14983) {
          return cljs.core.edit_and_set.call(null, inode__14978, edit, 2 * idx__14980 + 1, n__14983)
        }else {
          if(this__14977.bitmap === bit__14979) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__14978.edit_and_remove_pair(edit, bit__14979, idx__14980)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__14981)) {
        removed_leaf_QMARK_[0] = true;
        return inode__14978.edit_and_remove_pair(edit, bit__14979, idx__14980)
      }else {
        if("\ufdd0'else") {
          return inode__14978
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__14984 = this;
  var inode__14985 = this;
  if(e === this__14984.edit) {
    return inode__14985
  }else {
    var n__14986 = cljs.core.bit_count.call(null, this__14984.bitmap);
    var new_arr__14987 = cljs.core.make_array.call(null, n__14986 < 0 ? 4 : 2 * (n__14986 + 1));
    cljs.core.array_copy.call(null, this__14984.arr, 0, new_arr__14987, 0, 2 * n__14986);
    return new cljs.core.BitmapIndexedNode(e, this__14984.bitmap, new_arr__14987)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__14988 = this;
  var inode__14989 = this;
  return cljs.core.inode_kv_reduce.call(null, this__14988.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__15026 = null;
  var G__15026__3 = function(shift, hash, key) {
    var this__14990 = this;
    var inode__14991 = this;
    var bit__14992 = 1 << (hash >>> shift & 31);
    if((this__14990.bitmap & bit__14992) === 0) {
      return null
    }else {
      var idx__14993 = cljs.core.bitmap_indexed_node_index.call(null, this__14990.bitmap, bit__14992);
      var key_or_nil__14994 = this__14990.arr[2 * idx__14993];
      var val_or_node__14995 = this__14990.arr[2 * idx__14993 + 1];
      if(null == key_or_nil__14994) {
        return val_or_node__14995.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__14994)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__14994, val_or_node__14995])
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
  var G__15026__4 = function(shift, hash, key, not_found) {
    var this__14996 = this;
    var inode__14997 = this;
    var bit__14998 = 1 << (hash >>> shift & 31);
    if((this__14996.bitmap & bit__14998) === 0) {
      return not_found
    }else {
      var idx__14999 = cljs.core.bitmap_indexed_node_index.call(null, this__14996.bitmap, bit__14998);
      var key_or_nil__15000 = this__14996.arr[2 * idx__14999];
      var val_or_node__15001 = this__14996.arr[2 * idx__14999 + 1];
      if(null == key_or_nil__15000) {
        return val_or_node__15001.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__15000)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__15000, val_or_node__15001])
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
  G__15026 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__15026__3.call(this, shift, hash, key);
      case 4:
        return G__15026__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15026
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__15002 = this;
  var inode__15003 = this;
  var bit__15004 = 1 << (hash >>> shift & 31);
  if((this__15002.bitmap & bit__15004) === 0) {
    return inode__15003
  }else {
    var idx__15005 = cljs.core.bitmap_indexed_node_index.call(null, this__15002.bitmap, bit__15004);
    var key_or_nil__15006 = this__15002.arr[2 * idx__15005];
    var val_or_node__15007 = this__15002.arr[2 * idx__15005 + 1];
    if(null == key_or_nil__15006) {
      var n__15008 = val_or_node__15007.inode_without(shift + 5, hash, key);
      if(n__15008 === val_or_node__15007) {
        return inode__15003
      }else {
        if(null != n__15008) {
          return new cljs.core.BitmapIndexedNode(null, this__15002.bitmap, cljs.core.clone_and_set.call(null, this__15002.arr, 2 * idx__15005 + 1, n__15008))
        }else {
          if(this__15002.bitmap === bit__15004) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__15002.bitmap ^ bit__15004, cljs.core.remove_pair.call(null, this__15002.arr, idx__15005))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__15006)) {
        return new cljs.core.BitmapIndexedNode(null, this__15002.bitmap ^ bit__15004, cljs.core.remove_pair.call(null, this__15002.arr, idx__15005))
      }else {
        if("\ufdd0'else") {
          return inode__15003
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__15009 = this;
  var inode__15010 = this;
  var bit__15011 = 1 << (hash >>> shift & 31);
  var idx__15012 = cljs.core.bitmap_indexed_node_index.call(null, this__15009.bitmap, bit__15011);
  if((this__15009.bitmap & bit__15011) === 0) {
    var n__15013 = cljs.core.bit_count.call(null, this__15009.bitmap);
    if(n__15013 >= 16) {
      var nodes__15014 = cljs.core.make_array.call(null, 32);
      var jdx__15015 = hash >>> shift & 31;
      nodes__15014[jdx__15015] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__15016 = 0;
      var j__15017 = 0;
      while(true) {
        if(i__15016 < 32) {
          if((this__15009.bitmap >>> i__15016 & 1) === 0) {
            var G__15027 = i__15016 + 1;
            var G__15028 = j__15017;
            i__15016 = G__15027;
            j__15017 = G__15028;
            continue
          }else {
            nodes__15014[i__15016] = null != this__15009.arr[j__15017] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__15009.arr[j__15017]), this__15009.arr[j__15017], this__15009.arr[j__15017 + 1], added_leaf_QMARK_) : this__15009.arr[j__15017 + 1];
            var G__15029 = i__15016 + 1;
            var G__15030 = j__15017 + 2;
            i__15016 = G__15029;
            j__15017 = G__15030;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__15013 + 1, nodes__15014)
    }else {
      var new_arr__15018 = cljs.core.make_array.call(null, 2 * (n__15013 + 1));
      cljs.core.array_copy.call(null, this__15009.arr, 0, new_arr__15018, 0, 2 * idx__15012);
      new_arr__15018[2 * idx__15012] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__15018[2 * idx__15012 + 1] = val;
      cljs.core.array_copy.call(null, this__15009.arr, 2 * idx__15012, new_arr__15018, 2 * (idx__15012 + 1), 2 * (n__15013 - idx__15012));
      return new cljs.core.BitmapIndexedNode(null, this__15009.bitmap | bit__15011, new_arr__15018)
    }
  }else {
    var key_or_nil__15019 = this__15009.arr[2 * idx__15012];
    var val_or_node__15020 = this__15009.arr[2 * idx__15012 + 1];
    if(null == key_or_nil__15019) {
      var n__15021 = val_or_node__15020.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__15021 === val_or_node__15020) {
        return inode__15010
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__15009.bitmap, cljs.core.clone_and_set.call(null, this__15009.arr, 2 * idx__15012 + 1, n__15021))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__15019)) {
        if(val === val_or_node__15020) {
          return inode__15010
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__15009.bitmap, cljs.core.clone_and_set.call(null, this__15009.arr, 2 * idx__15012 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__15009.bitmap, cljs.core.clone_and_set.call(null, this__15009.arr, 2 * idx__15012, null, 2 * idx__15012 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__15019, val_or_node__15020, hash, key, val)))
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
  var arr__15031 = array_node.arr;
  var len__15032 = 2 * (array_node.cnt - 1);
  var new_arr__15033 = cljs.core.make_array.call(null, len__15032);
  var i__15034 = 0;
  var j__15035 = 1;
  var bitmap__15036 = 0;
  while(true) {
    if(i__15034 < len__15032) {
      if(function() {
        var and__3822__auto____15037 = i__15034 != idx;
        if(and__3822__auto____15037) {
          return null != arr__15031[i__15034]
        }else {
          return and__3822__auto____15037
        }
      }()) {
        new_arr__15033[j__15035] = arr__15031[i__15034];
        var G__15038 = i__15034 + 1;
        var G__15039 = j__15035 + 2;
        var G__15040 = bitmap__15036 | 1 << i__15034;
        i__15034 = G__15038;
        j__15035 = G__15039;
        bitmap__15036 = G__15040;
        continue
      }else {
        var G__15041 = i__15034 + 1;
        var G__15042 = j__15035;
        var G__15043 = bitmap__15036;
        i__15034 = G__15041;
        j__15035 = G__15042;
        bitmap__15036 = G__15043;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__15036, new_arr__15033)
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
  var this__15044 = this;
  var inode__15045 = this;
  var idx__15046 = hash >>> shift & 31;
  var node__15047 = this__15044.arr[idx__15046];
  if(null == node__15047) {
    return new cljs.core.ArrayNode(null, this__15044.cnt + 1, cljs.core.clone_and_set.call(null, this__15044.arr, idx__15046, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__15048 = node__15047.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__15048 === node__15047) {
      return inode__15045
    }else {
      return new cljs.core.ArrayNode(null, this__15044.cnt, cljs.core.clone_and_set.call(null, this__15044.arr, idx__15046, n__15048))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__15049 = this;
  var inode__15050 = this;
  var idx__15051 = hash >>> shift & 31;
  var node__15052 = this__15049.arr[idx__15051];
  if(null != node__15052) {
    var n__15053 = node__15052.inode_without(shift + 5, hash, key);
    if(n__15053 === node__15052) {
      return inode__15050
    }else {
      if(n__15053 == null) {
        if(this__15049.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__15050, null, idx__15051)
        }else {
          return new cljs.core.ArrayNode(null, this__15049.cnt - 1, cljs.core.clone_and_set.call(null, this__15049.arr, idx__15051, n__15053))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__15049.cnt, cljs.core.clone_and_set.call(null, this__15049.arr, idx__15051, n__15053))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__15050
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__15085 = null;
  var G__15085__3 = function(shift, hash, key) {
    var this__15054 = this;
    var inode__15055 = this;
    var idx__15056 = hash >>> shift & 31;
    var node__15057 = this__15054.arr[idx__15056];
    if(null != node__15057) {
      return node__15057.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__15085__4 = function(shift, hash, key, not_found) {
    var this__15058 = this;
    var inode__15059 = this;
    var idx__15060 = hash >>> shift & 31;
    var node__15061 = this__15058.arr[idx__15060];
    if(null != node__15061) {
      return node__15061.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__15085 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__15085__3.call(this, shift, hash, key);
      case 4:
        return G__15085__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15085
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__15062 = this;
  var inode__15063 = this;
  return cljs.core.create_array_node_seq.call(null, this__15062.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__15064 = this;
  var inode__15065 = this;
  if(e === this__15064.edit) {
    return inode__15065
  }else {
    return new cljs.core.ArrayNode(e, this__15064.cnt, cljs.core.aclone.call(null, this__15064.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__15066 = this;
  var inode__15067 = this;
  var idx__15068 = hash >>> shift & 31;
  var node__15069 = this__15066.arr[idx__15068];
  if(null == node__15069) {
    var editable__15070 = cljs.core.edit_and_set.call(null, inode__15067, edit, idx__15068, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__15070.cnt = editable__15070.cnt + 1;
    return editable__15070
  }else {
    var n__15071 = node__15069.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__15071 === node__15069) {
      return inode__15067
    }else {
      return cljs.core.edit_and_set.call(null, inode__15067, edit, idx__15068, n__15071)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__15072 = this;
  var inode__15073 = this;
  var idx__15074 = hash >>> shift & 31;
  var node__15075 = this__15072.arr[idx__15074];
  if(null == node__15075) {
    return inode__15073
  }else {
    var n__15076 = node__15075.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__15076 === node__15075) {
      return inode__15073
    }else {
      if(null == n__15076) {
        if(this__15072.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__15073, edit, idx__15074)
        }else {
          var editable__15077 = cljs.core.edit_and_set.call(null, inode__15073, edit, idx__15074, n__15076);
          editable__15077.cnt = editable__15077.cnt - 1;
          return editable__15077
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__15073, edit, idx__15074, n__15076)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__15078 = this;
  var inode__15079 = this;
  var len__15080 = this__15078.arr.length;
  var i__15081 = 0;
  var init__15082 = init;
  while(true) {
    if(i__15081 < len__15080) {
      var node__15083 = this__15078.arr[i__15081];
      if(node__15083 != null) {
        var init__15084 = node__15083.kv_reduce(f, init__15082);
        if(cljs.core.reduced_QMARK_.call(null, init__15084)) {
          return cljs.core.deref.call(null, init__15084)
        }else {
          var G__15086 = i__15081 + 1;
          var G__15087 = init__15084;
          i__15081 = G__15086;
          init__15082 = G__15087;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__15082
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__15088 = 2 * cnt;
  var i__15089 = 0;
  while(true) {
    if(i__15089 < lim__15088) {
      if(cljs.core._EQ_.call(null, key, arr[i__15089])) {
        return i__15089
      }else {
        var G__15090 = i__15089 + 2;
        i__15089 = G__15090;
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
  var this__15091 = this;
  var inode__15092 = this;
  if(hash === this__15091.collision_hash) {
    var idx__15093 = cljs.core.hash_collision_node_find_index.call(null, this__15091.arr, this__15091.cnt, key);
    if(idx__15093 === -1) {
      var len__15094 = this__15091.arr.length;
      var new_arr__15095 = cljs.core.make_array.call(null, len__15094 + 2);
      cljs.core.array_copy.call(null, this__15091.arr, 0, new_arr__15095, 0, len__15094);
      new_arr__15095[len__15094] = key;
      new_arr__15095[len__15094 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__15091.collision_hash, this__15091.cnt + 1, new_arr__15095)
    }else {
      if(cljs.core._EQ_.call(null, this__15091.arr[idx__15093], val)) {
        return inode__15092
      }else {
        return new cljs.core.HashCollisionNode(null, this__15091.collision_hash, this__15091.cnt, cljs.core.clone_and_set.call(null, this__15091.arr, idx__15093 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__15091.collision_hash >>> shift & 31), [null, inode__15092])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__15096 = this;
  var inode__15097 = this;
  var idx__15098 = cljs.core.hash_collision_node_find_index.call(null, this__15096.arr, this__15096.cnt, key);
  if(idx__15098 === -1) {
    return inode__15097
  }else {
    if(this__15096.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__15096.collision_hash, this__15096.cnt - 1, cljs.core.remove_pair.call(null, this__15096.arr, cljs.core.quot.call(null, idx__15098, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__15125 = null;
  var G__15125__3 = function(shift, hash, key) {
    var this__15099 = this;
    var inode__15100 = this;
    var idx__15101 = cljs.core.hash_collision_node_find_index.call(null, this__15099.arr, this__15099.cnt, key);
    if(idx__15101 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__15099.arr[idx__15101])) {
        return cljs.core.PersistentVector.fromArray([this__15099.arr[idx__15101], this__15099.arr[idx__15101 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__15125__4 = function(shift, hash, key, not_found) {
    var this__15102 = this;
    var inode__15103 = this;
    var idx__15104 = cljs.core.hash_collision_node_find_index.call(null, this__15102.arr, this__15102.cnt, key);
    if(idx__15104 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__15102.arr[idx__15104])) {
        return cljs.core.PersistentVector.fromArray([this__15102.arr[idx__15104], this__15102.arr[idx__15104 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__15125 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__15125__3.call(this, shift, hash, key);
      case 4:
        return G__15125__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15125
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__15105 = this;
  var inode__15106 = this;
  return cljs.core.create_inode_seq.call(null, this__15105.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__15126 = null;
  var G__15126__1 = function(e) {
    var this__15107 = this;
    var inode__15108 = this;
    if(e === this__15107.edit) {
      return inode__15108
    }else {
      var new_arr__15109 = cljs.core.make_array.call(null, 2 * (this__15107.cnt + 1));
      cljs.core.array_copy.call(null, this__15107.arr, 0, new_arr__15109, 0, 2 * this__15107.cnt);
      return new cljs.core.HashCollisionNode(e, this__15107.collision_hash, this__15107.cnt, new_arr__15109)
    }
  };
  var G__15126__3 = function(e, count, array) {
    var this__15110 = this;
    var inode__15111 = this;
    if(e === this__15110.edit) {
      this__15110.arr = array;
      this__15110.cnt = count;
      return inode__15111
    }else {
      return new cljs.core.HashCollisionNode(this__15110.edit, this__15110.collision_hash, count, array)
    }
  };
  G__15126 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__15126__1.call(this, e);
      case 3:
        return G__15126__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15126
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__15112 = this;
  var inode__15113 = this;
  if(hash === this__15112.collision_hash) {
    var idx__15114 = cljs.core.hash_collision_node_find_index.call(null, this__15112.arr, this__15112.cnt, key);
    if(idx__15114 === -1) {
      if(this__15112.arr.length > 2 * this__15112.cnt) {
        var editable__15115 = cljs.core.edit_and_set.call(null, inode__15113, edit, 2 * this__15112.cnt, key, 2 * this__15112.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__15115.cnt = editable__15115.cnt + 1;
        return editable__15115
      }else {
        var len__15116 = this__15112.arr.length;
        var new_arr__15117 = cljs.core.make_array.call(null, len__15116 + 2);
        cljs.core.array_copy.call(null, this__15112.arr, 0, new_arr__15117, 0, len__15116);
        new_arr__15117[len__15116] = key;
        new_arr__15117[len__15116 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__15113.ensure_editable(edit, this__15112.cnt + 1, new_arr__15117)
      }
    }else {
      if(this__15112.arr[idx__15114 + 1] === val) {
        return inode__15113
      }else {
        return cljs.core.edit_and_set.call(null, inode__15113, edit, idx__15114 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__15112.collision_hash >>> shift & 31), [null, inode__15113, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__15118 = this;
  var inode__15119 = this;
  var idx__15120 = cljs.core.hash_collision_node_find_index.call(null, this__15118.arr, this__15118.cnt, key);
  if(idx__15120 === -1) {
    return inode__15119
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__15118.cnt === 1) {
      return null
    }else {
      var editable__15121 = inode__15119.ensure_editable(edit);
      var earr__15122 = editable__15121.arr;
      earr__15122[idx__15120] = earr__15122[2 * this__15118.cnt - 2];
      earr__15122[idx__15120 + 1] = earr__15122[2 * this__15118.cnt - 1];
      earr__15122[2 * this__15118.cnt - 1] = null;
      earr__15122[2 * this__15118.cnt - 2] = null;
      editable__15121.cnt = editable__15121.cnt - 1;
      return editable__15121
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__15123 = this;
  var inode__15124 = this;
  return cljs.core.inode_kv_reduce.call(null, this__15123.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__15127 = cljs.core.hash.call(null, key1);
    if(key1hash__15127 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__15127, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___15128 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__15127, key1, val1, added_leaf_QMARK___15128).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___15128)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__15129 = cljs.core.hash.call(null, key1);
    if(key1hash__15129 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__15129, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___15130 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__15129, key1, val1, added_leaf_QMARK___15130).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___15130)
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
  var this__15131 = this;
  var h__364__auto____15132 = this__15131.__hash;
  if(h__364__auto____15132 != null) {
    return h__364__auto____15132
  }else {
    var h__364__auto____15133 = cljs.core.hash_coll.call(null, coll);
    this__15131.__hash = h__364__auto____15133;
    return h__364__auto____15133
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15134 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__15135 = this;
  var this$__15136 = this;
  return cljs.core.pr_str.call(null, this$__15136)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15137 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15138 = this;
  if(this__15138.s == null) {
    return cljs.core.PersistentVector.fromArray([this__15138.nodes[this__15138.i], this__15138.nodes[this__15138.i + 1]])
  }else {
    return cljs.core.first.call(null, this__15138.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15139 = this;
  if(this__15139.s == null) {
    return cljs.core.create_inode_seq.call(null, this__15139.nodes, this__15139.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__15139.nodes, this__15139.i, cljs.core.next.call(null, this__15139.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15140 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15141 = this;
  return new cljs.core.NodeSeq(meta, this__15141.nodes, this__15141.i, this__15141.s, this__15141.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15142 = this;
  return this__15142.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15143 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15143.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__15144 = nodes.length;
      var j__15145 = i;
      while(true) {
        if(j__15145 < len__15144) {
          if(null != nodes[j__15145]) {
            return new cljs.core.NodeSeq(null, nodes, j__15145, null, null)
          }else {
            var temp__3971__auto____15146 = nodes[j__15145 + 1];
            if(cljs.core.truth_(temp__3971__auto____15146)) {
              var node__15147 = temp__3971__auto____15146;
              var temp__3971__auto____15148 = node__15147.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____15148)) {
                var node_seq__15149 = temp__3971__auto____15148;
                return new cljs.core.NodeSeq(null, nodes, j__15145 + 2, node_seq__15149, null)
              }else {
                var G__15150 = j__15145 + 2;
                j__15145 = G__15150;
                continue
              }
            }else {
              var G__15151 = j__15145 + 2;
              j__15145 = G__15151;
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
  var this__15152 = this;
  var h__364__auto____15153 = this__15152.__hash;
  if(h__364__auto____15153 != null) {
    return h__364__auto____15153
  }else {
    var h__364__auto____15154 = cljs.core.hash_coll.call(null, coll);
    this__15152.__hash = h__364__auto____15154;
    return h__364__auto____15154
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15155 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__15156 = this;
  var this$__15157 = this;
  return cljs.core.pr_str.call(null, this$__15157)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15158 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__15159 = this;
  return cljs.core.first.call(null, this__15159.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__15160 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__15160.nodes, this__15160.i, cljs.core.next.call(null, this__15160.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15161 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15162 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__15162.nodes, this__15162.i, this__15162.s, this__15162.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15163 = this;
  return this__15163.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15164 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15164.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__15165 = nodes.length;
      var j__15166 = i;
      while(true) {
        if(j__15166 < len__15165) {
          var temp__3971__auto____15167 = nodes[j__15166];
          if(cljs.core.truth_(temp__3971__auto____15167)) {
            var nj__15168 = temp__3971__auto____15167;
            var temp__3971__auto____15169 = nj__15168.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____15169)) {
              var ns__15170 = temp__3971__auto____15169;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__15166 + 1, ns__15170, null)
            }else {
              var G__15171 = j__15166 + 1;
              j__15166 = G__15171;
              continue
            }
          }else {
            var G__15172 = j__15166 + 1;
            j__15166 = G__15172;
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
  var this__15177 = this;
  return new cljs.core.TransientHashMap({}, this__15177.root, this__15177.cnt, this__15177.has_nil_QMARK_, this__15177.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15178 = this;
  var h__364__auto____15179 = this__15178.__hash;
  if(h__364__auto____15179 != null) {
    return h__364__auto____15179
  }else {
    var h__364__auto____15180 = cljs.core.hash_imap.call(null, coll);
    this__15178.__hash = h__364__auto____15180;
    return h__364__auto____15180
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15181 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15182 = this;
  if(k == null) {
    if(cljs.core.truth_(this__15182.has_nil_QMARK_)) {
      return this__15182.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__15182.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__15182.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15183 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15184 = this__15183.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____15184)) {
        return v === this__15183.nil_val
      }else {
        return and__3822__auto____15184
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__15183.meta, cljs.core.truth_(this__15183.has_nil_QMARK_) ? this__15183.cnt : this__15183.cnt + 1, this__15183.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___15185 = [false];
    var new_root__15186 = (this__15183.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__15183.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___15185);
    if(new_root__15186 === this__15183.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__15183.meta, cljs.core.truth_(added_leaf_QMARK___15185[0]) ? this__15183.cnt + 1 : this__15183.cnt, new_root__15186, this__15183.has_nil_QMARK_, this__15183.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__15187 = this;
  if(k == null) {
    return this__15187.has_nil_QMARK_
  }else {
    if(this__15187.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__15187.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__15208 = null;
  var G__15208__2 = function(tsym15175, k) {
    var this__15188 = this;
    var tsym15175__15189 = this;
    var coll__15190 = tsym15175__15189;
    return cljs.core._lookup.call(null, coll__15190, k)
  };
  var G__15208__3 = function(tsym15176, k, not_found) {
    var this__15191 = this;
    var tsym15176__15192 = this;
    var coll__15193 = tsym15176__15192;
    return cljs.core._lookup.call(null, coll__15193, k, not_found)
  };
  G__15208 = function(tsym15176, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15208__2.call(this, tsym15176, k);
      case 3:
        return G__15208__3.call(this, tsym15176, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15208
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym15173, args15174) {
  return tsym15173.call.apply(tsym15173, [tsym15173].concat(cljs.core.aclone.call(null, args15174)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__15194 = this;
  var init__15195 = cljs.core.truth_(this__15194.has_nil_QMARK_) ? f.call(null, init, null, this__15194.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__15195)) {
    return cljs.core.deref.call(null, init__15195)
  }else {
    if(null != this__15194.root) {
      return this__15194.root.kv_reduce(f, init__15195)
    }else {
      if("\ufdd0'else") {
        return init__15195
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__15196 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__15197 = this;
  var this$__15198 = this;
  return cljs.core.pr_str.call(null, this$__15198)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15199 = this;
  if(this__15199.cnt > 0) {
    var s__15200 = null != this__15199.root ? this__15199.root.inode_seq() : null;
    if(cljs.core.truth_(this__15199.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__15199.nil_val]), s__15200)
    }else {
      return s__15200
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15201 = this;
  return this__15201.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15202 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15203 = this;
  return new cljs.core.PersistentHashMap(meta, this__15203.cnt, this__15203.root, this__15203.has_nil_QMARK_, this__15203.nil_val, this__15203.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15204 = this;
  return this__15204.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15205 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__15205.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__15206 = this;
  if(k == null) {
    if(cljs.core.truth_(this__15206.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__15206.meta, this__15206.cnt - 1, this__15206.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__15206.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__15207 = this__15206.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__15207 === this__15206.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__15206.meta, this__15206.cnt - 1, new_root__15207, this__15206.has_nil_QMARK_, this__15206.nil_val, null)
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
  var len__15209 = ks.length;
  var i__15210 = 0;
  var out__15211 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__15210 < len__15209) {
      var G__15212 = i__15210 + 1;
      var G__15213 = cljs.core.assoc_BANG_.call(null, out__15211, ks[i__15210], vs[i__15210]);
      i__15210 = G__15212;
      out__15211 = G__15213;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__15211)
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
  var this__15214 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__15215 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__15216 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__15217 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__15218 = this;
  if(k == null) {
    if(cljs.core.truth_(this__15218.has_nil_QMARK_)) {
      return this__15218.nil_val
    }else {
      return null
    }
  }else {
    if(this__15218.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__15218.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__15219 = this;
  if(k == null) {
    if(cljs.core.truth_(this__15219.has_nil_QMARK_)) {
      return this__15219.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__15219.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__15219.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15220 = this;
  if(cljs.core.truth_(this__15220.edit)) {
    return this__15220.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__15221 = this;
  var tcoll__15222 = this;
  if(cljs.core.truth_(this__15221.edit)) {
    if(function() {
      var G__15223__15224 = o;
      if(G__15223__15224 != null) {
        if(function() {
          var or__3824__auto____15225 = G__15223__15224.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____15225) {
            return or__3824__auto____15225
          }else {
            return G__15223__15224.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__15223__15224.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__15223__15224)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__15223__15224)
      }
    }()) {
      return tcoll__15222.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__15226 = cljs.core.seq.call(null, o);
      var tcoll__15227 = tcoll__15222;
      while(true) {
        var temp__3971__auto____15228 = cljs.core.first.call(null, es__15226);
        if(cljs.core.truth_(temp__3971__auto____15228)) {
          var e__15229 = temp__3971__auto____15228;
          var G__15240 = cljs.core.next.call(null, es__15226);
          var G__15241 = tcoll__15227.assoc_BANG_(cljs.core.key.call(null, e__15229), cljs.core.val.call(null, e__15229));
          es__15226 = G__15240;
          tcoll__15227 = G__15241;
          continue
        }else {
          return tcoll__15227
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__15230 = this;
  var tcoll__15231 = this;
  if(cljs.core.truth_(this__15230.edit)) {
    if(k == null) {
      if(this__15230.nil_val === v) {
      }else {
        this__15230.nil_val = v
      }
      if(cljs.core.truth_(this__15230.has_nil_QMARK_)) {
      }else {
        this__15230.count = this__15230.count + 1;
        this__15230.has_nil_QMARK_ = true
      }
      return tcoll__15231
    }else {
      var added_leaf_QMARK___15232 = [false];
      var node__15233 = (this__15230.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__15230.root).inode_assoc_BANG_(this__15230.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___15232);
      if(node__15233 === this__15230.root) {
      }else {
        this__15230.root = node__15233
      }
      if(cljs.core.truth_(added_leaf_QMARK___15232[0])) {
        this__15230.count = this__15230.count + 1
      }else {
      }
      return tcoll__15231
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__15234 = this;
  var tcoll__15235 = this;
  if(cljs.core.truth_(this__15234.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__15234.has_nil_QMARK_)) {
        this__15234.has_nil_QMARK_ = false;
        this__15234.nil_val = null;
        this__15234.count = this__15234.count - 1;
        return tcoll__15235
      }else {
        return tcoll__15235
      }
    }else {
      if(this__15234.root == null) {
        return tcoll__15235
      }else {
        var removed_leaf_QMARK___15236 = [false];
        var node__15237 = this__15234.root.inode_without_BANG_(this__15234.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___15236);
        if(node__15237 === this__15234.root) {
        }else {
          this__15234.root = node__15237
        }
        if(cljs.core.truth_(removed_leaf_QMARK___15236[0])) {
          this__15234.count = this__15234.count - 1
        }else {
        }
        return tcoll__15235
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__15238 = this;
  var tcoll__15239 = this;
  if(cljs.core.truth_(this__15238.edit)) {
    this__15238.edit = null;
    return new cljs.core.PersistentHashMap(null, this__15238.count, this__15238.root, this__15238.has_nil_QMARK_, this__15238.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__15242 = node;
  var stack__15243 = stack;
  while(true) {
    if(t__15242 != null) {
      var G__15244 = cljs.core.truth_(ascending_QMARK_) ? t__15242.left : t__15242.right;
      var G__15245 = cljs.core.conj.call(null, stack__15243, t__15242);
      t__15242 = G__15244;
      stack__15243 = G__15245;
      continue
    }else {
      return stack__15243
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
  var this__15246 = this;
  var h__364__auto____15247 = this__15246.__hash;
  if(h__364__auto____15247 != null) {
    return h__364__auto____15247
  }else {
    var h__364__auto____15248 = cljs.core.hash_coll.call(null, coll);
    this__15246.__hash = h__364__auto____15248;
    return h__364__auto____15248
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15249 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__15250 = this;
  var this$__15251 = this;
  return cljs.core.pr_str.call(null, this$__15251)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__15252 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15253 = this;
  if(this__15253.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__15253.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__15254 = this;
  return cljs.core.peek.call(null, this__15254.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__15255 = this;
  var t__15256 = cljs.core.peek.call(null, this__15255.stack);
  var next_stack__15257 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__15255.ascending_QMARK_) ? t__15256.right : t__15256.left, cljs.core.pop.call(null, this__15255.stack), this__15255.ascending_QMARK_);
  if(next_stack__15257 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__15257, this__15255.ascending_QMARK_, this__15255.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15258 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15259 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__15259.stack, this__15259.ascending_QMARK_, this__15259.cnt, this__15259.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15260 = this;
  return this__15260.meta
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
        var and__3822__auto____15261 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____15261) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____15261
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
        var and__3822__auto____15262 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____15262) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____15262
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
  var init__15263 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__15263)) {
    return cljs.core.deref.call(null, init__15263)
  }else {
    var init__15264 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__15263) : init__15263;
    if(cljs.core.reduced_QMARK_.call(null, init__15264)) {
      return cljs.core.deref.call(null, init__15264)
    }else {
      var init__15265 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__15264) : init__15264;
      if(cljs.core.reduced_QMARK_.call(null, init__15265)) {
        return cljs.core.deref.call(null, init__15265)
      }else {
        return init__15265
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
  var this__15270 = this;
  var h__364__auto____15271 = this__15270.__hash;
  if(h__364__auto____15271 != null) {
    return h__364__auto____15271
  }else {
    var h__364__auto____15272 = cljs.core.hash_coll.call(null, coll);
    this__15270.__hash = h__364__auto____15272;
    return h__364__auto____15272
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__15273 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__15274 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__15275 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__15275.key, this__15275.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__15322 = null;
  var G__15322__2 = function(tsym15268, k) {
    var this__15276 = this;
    var tsym15268__15277 = this;
    var node__15278 = tsym15268__15277;
    return cljs.core._lookup.call(null, node__15278, k)
  };
  var G__15322__3 = function(tsym15269, k, not_found) {
    var this__15279 = this;
    var tsym15269__15280 = this;
    var node__15281 = tsym15269__15280;
    return cljs.core._lookup.call(null, node__15281, k, not_found)
  };
  G__15322 = function(tsym15269, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15322__2.call(this, tsym15269, k);
      case 3:
        return G__15322__3.call(this, tsym15269, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15322
}();
cljs.core.BlackNode.prototype.apply = function(tsym15266, args15267) {
  return tsym15266.call.apply(tsym15266, [tsym15266].concat(cljs.core.aclone.call(null, args15267)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__15282 = this;
  return cljs.core.PersistentVector.fromArray([this__15282.key, this__15282.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__15283 = this;
  return this__15283.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__15284 = this;
  return this__15284.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__15285 = this;
  var node__15286 = this;
  return ins.balance_right(node__15286)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__15287 = this;
  var node__15288 = this;
  return new cljs.core.RedNode(this__15287.key, this__15287.val, this__15287.left, this__15287.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__15289 = this;
  var node__15290 = this;
  return cljs.core.balance_right_del.call(null, this__15289.key, this__15289.val, this__15289.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__15291 = this;
  var node__15292 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__15293 = this;
  var node__15294 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__15294, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__15295 = this;
  var node__15296 = this;
  return cljs.core.balance_left_del.call(null, this__15295.key, this__15295.val, del, this__15295.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__15297 = this;
  var node__15298 = this;
  return ins.balance_left(node__15298)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__15299 = this;
  var node__15300 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__15300, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__15323 = null;
  var G__15323__0 = function() {
    var this__15303 = this;
    var this$__15304 = this;
    return cljs.core.pr_str.call(null, this$__15304)
  };
  G__15323 = function() {
    switch(arguments.length) {
      case 0:
        return G__15323__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15323
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__15305 = this;
  var node__15306 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__15306, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__15307 = this;
  var node__15308 = this;
  return node__15308
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__15309 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__15310 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__15311 = this;
  return cljs.core.list.call(null, this__15311.key, this__15311.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__15313 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__15314 = this;
  return this__15314.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__15315 = this;
  return cljs.core.PersistentVector.fromArray([this__15315.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__15316 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__15316.key, this__15316.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15317 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__15318 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__15318.key, this__15318.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__15319 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__15320 = this;
  if(n === 0) {
    return this__15320.key
  }else {
    if(n === 1) {
      return this__15320.val
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
  var this__15321 = this;
  if(n === 0) {
    return this__15321.key
  }else {
    if(n === 1) {
      return this__15321.val
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
  var this__15312 = this;
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
  var this__15328 = this;
  var h__364__auto____15329 = this__15328.__hash;
  if(h__364__auto____15329 != null) {
    return h__364__auto____15329
  }else {
    var h__364__auto____15330 = cljs.core.hash_coll.call(null, coll);
    this__15328.__hash = h__364__auto____15330;
    return h__364__auto____15330
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__15331 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__15332 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__15333 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__15333.key, this__15333.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__15380 = null;
  var G__15380__2 = function(tsym15326, k) {
    var this__15334 = this;
    var tsym15326__15335 = this;
    var node__15336 = tsym15326__15335;
    return cljs.core._lookup.call(null, node__15336, k)
  };
  var G__15380__3 = function(tsym15327, k, not_found) {
    var this__15337 = this;
    var tsym15327__15338 = this;
    var node__15339 = tsym15327__15338;
    return cljs.core._lookup.call(null, node__15339, k, not_found)
  };
  G__15380 = function(tsym15327, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15380__2.call(this, tsym15327, k);
      case 3:
        return G__15380__3.call(this, tsym15327, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15380
}();
cljs.core.RedNode.prototype.apply = function(tsym15324, args15325) {
  return tsym15324.call.apply(tsym15324, [tsym15324].concat(cljs.core.aclone.call(null, args15325)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__15340 = this;
  return cljs.core.PersistentVector.fromArray([this__15340.key, this__15340.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__15341 = this;
  return this__15341.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__15342 = this;
  return this__15342.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__15343 = this;
  var node__15344 = this;
  return new cljs.core.RedNode(this__15343.key, this__15343.val, this__15343.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__15345 = this;
  var node__15346 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__15347 = this;
  var node__15348 = this;
  return new cljs.core.RedNode(this__15347.key, this__15347.val, this__15347.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__15349 = this;
  var node__15350 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__15351 = this;
  var node__15352 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__15352, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__15353 = this;
  var node__15354 = this;
  return new cljs.core.RedNode(this__15353.key, this__15353.val, del, this__15353.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__15355 = this;
  var node__15356 = this;
  return new cljs.core.RedNode(this__15355.key, this__15355.val, ins, this__15355.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__15357 = this;
  var node__15358 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__15357.left)) {
    return new cljs.core.RedNode(this__15357.key, this__15357.val, this__15357.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__15357.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__15357.right)) {
      return new cljs.core.RedNode(this__15357.right.key, this__15357.right.val, new cljs.core.BlackNode(this__15357.key, this__15357.val, this__15357.left, this__15357.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__15357.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__15358, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__15381 = null;
  var G__15381__0 = function() {
    var this__15361 = this;
    var this$__15362 = this;
    return cljs.core.pr_str.call(null, this$__15362)
  };
  G__15381 = function() {
    switch(arguments.length) {
      case 0:
        return G__15381__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15381
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__15363 = this;
  var node__15364 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__15363.right)) {
    return new cljs.core.RedNode(this__15363.key, this__15363.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__15363.left, null), this__15363.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__15363.left)) {
      return new cljs.core.RedNode(this__15363.left.key, this__15363.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__15363.left.left, null), new cljs.core.BlackNode(this__15363.key, this__15363.val, this__15363.left.right, this__15363.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__15364, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__15365 = this;
  var node__15366 = this;
  return new cljs.core.BlackNode(this__15365.key, this__15365.val, this__15365.left, this__15365.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__15367 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__15368 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__15369 = this;
  return cljs.core.list.call(null, this__15369.key, this__15369.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__15371 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__15372 = this;
  return this__15372.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__15373 = this;
  return cljs.core.PersistentVector.fromArray([this__15373.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__15374 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__15374.key, this__15374.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15375 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__15376 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__15376.key, this__15376.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__15377 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__15378 = this;
  if(n === 0) {
    return this__15378.key
  }else {
    if(n === 1) {
      return this__15378.val
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
  var this__15379 = this;
  if(n === 0) {
    return this__15379.key
  }else {
    if(n === 1) {
      return this__15379.val
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
  var this__15370 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__15382 = comp.call(null, k, tree.key);
    if(c__15382 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__15382 < 0) {
        var ins__15383 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__15383 != null) {
          return tree.add_left(ins__15383)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__15384 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__15384 != null) {
            return tree.add_right(ins__15384)
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
          var app__15385 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__15385)) {
            return new cljs.core.RedNode(app__15385.key, app__15385.val, new cljs.core.RedNode(left.key, left.val, left.left, app__15385.left), new cljs.core.RedNode(right.key, right.val, app__15385.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__15385, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__15386 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__15386)) {
              return new cljs.core.RedNode(app__15386.key, app__15386.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__15386.left, null), new cljs.core.BlackNode(right.key, right.val, app__15386.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__15386, right.right, null))
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
    var c__15387 = comp.call(null, k, tree.key);
    if(c__15387 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__15387 < 0) {
        var del__15388 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____15389 = del__15388 != null;
          if(or__3824__auto____15389) {
            return or__3824__auto____15389
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__15388, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__15388, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__15390 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____15391 = del__15390 != null;
            if(or__3824__auto____15391) {
              return or__3824__auto____15391
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__15390)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__15390, null)
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
  var tk__15392 = tree.key;
  var c__15393 = comp.call(null, k, tk__15392);
  if(c__15393 === 0) {
    return tree.replace(tk__15392, v, tree.left, tree.right)
  }else {
    if(c__15393 < 0) {
      return tree.replace(tk__15392, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__15392, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__15398 = this;
  var h__364__auto____15399 = this__15398.__hash;
  if(h__364__auto____15399 != null) {
    return h__364__auto____15399
  }else {
    var h__364__auto____15400 = cljs.core.hash_imap.call(null, coll);
    this__15398.__hash = h__364__auto____15400;
    return h__364__auto____15400
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__15401 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__15402 = this;
  var n__15403 = coll.entry_at(k);
  if(n__15403 != null) {
    return n__15403.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__15404 = this;
  var found__15405 = [null];
  var t__15406 = cljs.core.tree_map_add.call(null, this__15404.comp, this__15404.tree, k, v, found__15405);
  if(t__15406 == null) {
    var found_node__15407 = cljs.core.nth.call(null, found__15405, 0);
    if(cljs.core._EQ_.call(null, v, found_node__15407.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__15404.comp, cljs.core.tree_map_replace.call(null, this__15404.comp, this__15404.tree, k, v), this__15404.cnt, this__15404.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__15404.comp, t__15406.blacken(), this__15404.cnt + 1, this__15404.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__15408 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__15440 = null;
  var G__15440__2 = function(tsym15396, k) {
    var this__15409 = this;
    var tsym15396__15410 = this;
    var coll__15411 = tsym15396__15410;
    return cljs.core._lookup.call(null, coll__15411, k)
  };
  var G__15440__3 = function(tsym15397, k, not_found) {
    var this__15412 = this;
    var tsym15397__15413 = this;
    var coll__15414 = tsym15397__15413;
    return cljs.core._lookup.call(null, coll__15414, k, not_found)
  };
  G__15440 = function(tsym15397, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15440__2.call(this, tsym15397, k);
      case 3:
        return G__15440__3.call(this, tsym15397, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15440
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym15394, args15395) {
  return tsym15394.call.apply(tsym15394, [tsym15394].concat(cljs.core.aclone.call(null, args15395)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__15415 = this;
  if(this__15415.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__15415.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__15416 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15417 = this;
  if(this__15417.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__15417.tree, false, this__15417.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__15418 = this;
  var this$__15419 = this;
  return cljs.core.pr_str.call(null, this$__15419)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__15420 = this;
  var coll__15421 = this;
  var t__15422 = this__15420.tree;
  while(true) {
    if(t__15422 != null) {
      var c__15423 = this__15420.comp.call(null, k, t__15422.key);
      if(c__15423 === 0) {
        return t__15422
      }else {
        if(c__15423 < 0) {
          var G__15441 = t__15422.left;
          t__15422 = G__15441;
          continue
        }else {
          if("\ufdd0'else") {
            var G__15442 = t__15422.right;
            t__15422 = G__15442;
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
  var this__15424 = this;
  if(this__15424.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__15424.tree, ascending_QMARK_, this__15424.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__15425 = this;
  if(this__15425.cnt > 0) {
    var stack__15426 = null;
    var t__15427 = this__15425.tree;
    while(true) {
      if(t__15427 != null) {
        var c__15428 = this__15425.comp.call(null, k, t__15427.key);
        if(c__15428 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__15426, t__15427), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__15428 < 0) {
              var G__15443 = cljs.core.conj.call(null, stack__15426, t__15427);
              var G__15444 = t__15427.left;
              stack__15426 = G__15443;
              t__15427 = G__15444;
              continue
            }else {
              var G__15445 = stack__15426;
              var G__15446 = t__15427.right;
              stack__15426 = G__15445;
              t__15427 = G__15446;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__15428 > 0) {
                var G__15447 = cljs.core.conj.call(null, stack__15426, t__15427);
                var G__15448 = t__15427.right;
                stack__15426 = G__15447;
                t__15427 = G__15448;
                continue
              }else {
                var G__15449 = stack__15426;
                var G__15450 = t__15427.left;
                stack__15426 = G__15449;
                t__15427 = G__15450;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__15426 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__15426, ascending_QMARK_, -1)
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
  var this__15429 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__15430 = this;
  return this__15430.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15431 = this;
  if(this__15431.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__15431.tree, true, this__15431.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15432 = this;
  return this__15432.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15433 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15434 = this;
  return new cljs.core.PersistentTreeMap(this__15434.comp, this__15434.tree, this__15434.cnt, meta, this__15434.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15438 = this;
  return this__15438.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15439 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__15439.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__15435 = this;
  var found__15436 = [null];
  var t__15437 = cljs.core.tree_map_remove.call(null, this__15435.comp, this__15435.tree, k, found__15436);
  if(t__15437 == null) {
    if(cljs.core.nth.call(null, found__15436, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__15435.comp, null, 0, this__15435.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__15435.comp, t__15437.blacken(), this__15435.cnt - 1, this__15435.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__15451 = cljs.core.seq.call(null, keyvals);
    var out__15452 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__15451)) {
        var G__15453 = cljs.core.nnext.call(null, in$__15451);
        var G__15454 = cljs.core.assoc_BANG_.call(null, out__15452, cljs.core.first.call(null, in$__15451), cljs.core.second.call(null, in$__15451));
        in$__15451 = G__15453;
        out__15452 = G__15454;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__15452)
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
  hash_map.cljs$lang$applyTo = function(arglist__15455) {
    var keyvals = cljs.core.seq(arglist__15455);
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
  array_map.cljs$lang$applyTo = function(arglist__15456) {
    var keyvals = cljs.core.seq(arglist__15456);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__15457 = cljs.core.seq.call(null, keyvals);
    var out__15458 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__15457)) {
        var G__15459 = cljs.core.nnext.call(null, in$__15457);
        var G__15460 = cljs.core.assoc.call(null, out__15458, cljs.core.first.call(null, in$__15457), cljs.core.second.call(null, in$__15457));
        in$__15457 = G__15459;
        out__15458 = G__15460;
        continue
      }else {
        return out__15458
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
  sorted_map.cljs$lang$applyTo = function(arglist__15461) {
    var keyvals = cljs.core.seq(arglist__15461);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__15462 = cljs.core.seq.call(null, keyvals);
    var out__15463 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__15462)) {
        var G__15464 = cljs.core.nnext.call(null, in$__15462);
        var G__15465 = cljs.core.assoc.call(null, out__15463, cljs.core.first.call(null, in$__15462), cljs.core.second.call(null, in$__15462));
        in$__15462 = G__15464;
        out__15463 = G__15465;
        continue
      }else {
        return out__15463
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__15466) {
    var comparator = cljs.core.first(arglist__15466);
    var keyvals = cljs.core.rest(arglist__15466);
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
      return cljs.core.reduce.call(null, function(p1__15467_SHARP_, p2__15468_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____15469 = p1__15467_SHARP_;
          if(cljs.core.truth_(or__3824__auto____15469)) {
            return or__3824__auto____15469
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__15468_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__15470) {
    var maps = cljs.core.seq(arglist__15470);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__15473 = function(m, e) {
        var k__15471 = cljs.core.first.call(null, e);
        var v__15472 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__15471)) {
          return cljs.core.assoc.call(null, m, k__15471, f.call(null, cljs.core.get.call(null, m, k__15471), v__15472))
        }else {
          return cljs.core.assoc.call(null, m, k__15471, v__15472)
        }
      };
      var merge2__15475 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__15473, function() {
          var or__3824__auto____15474 = m1;
          if(cljs.core.truth_(or__3824__auto____15474)) {
            return or__3824__auto____15474
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__15475, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__15476) {
    var f = cljs.core.first(arglist__15476);
    var maps = cljs.core.rest(arglist__15476);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__15477 = cljs.core.ObjMap.fromObject([], {});
  var keys__15478 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__15478)) {
      var key__15479 = cljs.core.first.call(null, keys__15478);
      var entry__15480 = cljs.core.get.call(null, map, key__15479, "\ufdd0'user/not-found");
      var G__15481 = cljs.core.not_EQ_.call(null, entry__15480, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__15477, key__15479, entry__15480) : ret__15477;
      var G__15482 = cljs.core.next.call(null, keys__15478);
      ret__15477 = G__15481;
      keys__15478 = G__15482;
      continue
    }else {
      return ret__15477
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
  var this__15488 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__15488.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__15489 = this;
  var h__364__auto____15490 = this__15489.__hash;
  if(h__364__auto____15490 != null) {
    return h__364__auto____15490
  }else {
    var h__364__auto____15491 = cljs.core.hash_iset.call(null, coll);
    this__15489.__hash = h__364__auto____15491;
    return h__364__auto____15491
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__15492 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__15493 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__15493.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__15512 = null;
  var G__15512__2 = function(tsym15486, k) {
    var this__15494 = this;
    var tsym15486__15495 = this;
    var coll__15496 = tsym15486__15495;
    return cljs.core._lookup.call(null, coll__15496, k)
  };
  var G__15512__3 = function(tsym15487, k, not_found) {
    var this__15497 = this;
    var tsym15487__15498 = this;
    var coll__15499 = tsym15487__15498;
    return cljs.core._lookup.call(null, coll__15499, k, not_found)
  };
  G__15512 = function(tsym15487, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15512__2.call(this, tsym15487, k);
      case 3:
        return G__15512__3.call(this, tsym15487, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15512
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym15484, args15485) {
  return tsym15484.call.apply(tsym15484, [tsym15484].concat(cljs.core.aclone.call(null, args15485)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15500 = this;
  return new cljs.core.PersistentHashSet(this__15500.meta, cljs.core.assoc.call(null, this__15500.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__15501 = this;
  var this$__15502 = this;
  return cljs.core.pr_str.call(null, this$__15502)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15503 = this;
  return cljs.core.keys.call(null, this__15503.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__15504 = this;
  return new cljs.core.PersistentHashSet(this__15504.meta, cljs.core.dissoc.call(null, this__15504.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15505 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15506 = this;
  var and__3822__auto____15507 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____15507) {
    var and__3822__auto____15508 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____15508) {
      return cljs.core.every_QMARK_.call(null, function(p1__15483_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__15483_SHARP_)
      }, other)
    }else {
      return and__3822__auto____15508
    }
  }else {
    return and__3822__auto____15507
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15509 = this;
  return new cljs.core.PersistentHashSet(meta, this__15509.hash_map, this__15509.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15510 = this;
  return this__15510.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15511 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__15511.meta)
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
  var G__15530 = null;
  var G__15530__2 = function(tsym15516, k) {
    var this__15518 = this;
    var tsym15516__15519 = this;
    var tcoll__15520 = tsym15516__15519;
    if(cljs.core._lookup.call(null, this__15518.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__15530__3 = function(tsym15517, k, not_found) {
    var this__15521 = this;
    var tsym15517__15522 = this;
    var tcoll__15523 = tsym15517__15522;
    if(cljs.core._lookup.call(null, this__15521.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__15530 = function(tsym15517, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15530__2.call(this, tsym15517, k);
      case 3:
        return G__15530__3.call(this, tsym15517, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15530
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym15514, args15515) {
  return tsym15514.call.apply(tsym15514, [tsym15514].concat(cljs.core.aclone.call(null, args15515)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__15524 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__15525 = this;
  if(cljs.core._lookup.call(null, this__15525.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__15526 = this;
  return cljs.core.count.call(null, this__15526.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__15527 = this;
  this__15527.transient_map = cljs.core.dissoc_BANG_.call(null, this__15527.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__15528 = this;
  this__15528.transient_map = cljs.core.assoc_BANG_.call(null, this__15528.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__15529 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__15529.transient_map), null)
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
  var this__15535 = this;
  var h__364__auto____15536 = this__15535.__hash;
  if(h__364__auto____15536 != null) {
    return h__364__auto____15536
  }else {
    var h__364__auto____15537 = cljs.core.hash_iset.call(null, coll);
    this__15535.__hash = h__364__auto____15537;
    return h__364__auto____15537
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__15538 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__15539 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__15539.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__15563 = null;
  var G__15563__2 = function(tsym15533, k) {
    var this__15540 = this;
    var tsym15533__15541 = this;
    var coll__15542 = tsym15533__15541;
    return cljs.core._lookup.call(null, coll__15542, k)
  };
  var G__15563__3 = function(tsym15534, k, not_found) {
    var this__15543 = this;
    var tsym15534__15544 = this;
    var coll__15545 = tsym15534__15544;
    return cljs.core._lookup.call(null, coll__15545, k, not_found)
  };
  G__15563 = function(tsym15534, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15563__2.call(this, tsym15534, k);
      case 3:
        return G__15563__3.call(this, tsym15534, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15563
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym15531, args15532) {
  return tsym15531.call.apply(tsym15531, [tsym15531].concat(cljs.core.aclone.call(null, args15532)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__15546 = this;
  return new cljs.core.PersistentTreeSet(this__15546.meta, cljs.core.assoc.call(null, this__15546.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__15547 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__15547.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__15548 = this;
  var this$__15549 = this;
  return cljs.core.pr_str.call(null, this$__15549)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__15550 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__15550.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__15551 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__15551.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__15552 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__15553 = this;
  return cljs.core._comparator.call(null, this__15553.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__15554 = this;
  return cljs.core.keys.call(null, this__15554.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__15555 = this;
  return new cljs.core.PersistentTreeSet(this__15555.meta, cljs.core.dissoc.call(null, this__15555.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__15556 = this;
  return cljs.core.count.call(null, this__15556.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__15557 = this;
  var and__3822__auto____15558 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____15558) {
    var and__3822__auto____15559 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____15559) {
      return cljs.core.every_QMARK_.call(null, function(p1__15513_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__15513_SHARP_)
      }, other)
    }else {
      return and__3822__auto____15559
    }
  }else {
    return and__3822__auto____15558
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__15560 = this;
  return new cljs.core.PersistentTreeSet(meta, this__15560.tree_map, this__15560.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__15561 = this;
  return this__15561.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__15562 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__15562.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__15564 = cljs.core.seq.call(null, coll);
  var out__15565 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__15564))) {
      var G__15566 = cljs.core.next.call(null, in$__15564);
      var G__15567 = cljs.core.conj_BANG_.call(null, out__15565, cljs.core.first.call(null, in$__15564));
      in$__15564 = G__15566;
      out__15565 = G__15567;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__15565)
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
  sorted_set.cljs$lang$applyTo = function(arglist__15568) {
    var keys = cljs.core.seq(arglist__15568);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__15570) {
    var comparator = cljs.core.first(arglist__15570);
    var keys = cljs.core.rest(arglist__15570);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__15571 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____15572 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____15572)) {
        var e__15573 = temp__3971__auto____15572;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__15573))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__15571, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__15569_SHARP_) {
      var temp__3971__auto____15574 = cljs.core.find.call(null, smap, p1__15569_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____15574)) {
        var e__15575 = temp__3971__auto____15574;
        return cljs.core.second.call(null, e__15575)
      }else {
        return p1__15569_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__15583 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__15576, seen) {
        while(true) {
          var vec__15577__15578 = p__15576;
          var f__15579 = cljs.core.nth.call(null, vec__15577__15578, 0, null);
          var xs__15580 = vec__15577__15578;
          var temp__3974__auto____15581 = cljs.core.seq.call(null, xs__15580);
          if(cljs.core.truth_(temp__3974__auto____15581)) {
            var s__15582 = temp__3974__auto____15581;
            if(cljs.core.contains_QMARK_.call(null, seen, f__15579)) {
              var G__15584 = cljs.core.rest.call(null, s__15582);
              var G__15585 = seen;
              p__15576 = G__15584;
              seen = G__15585;
              continue
            }else {
              return cljs.core.cons.call(null, f__15579, step.call(null, cljs.core.rest.call(null, s__15582), cljs.core.conj.call(null, seen, f__15579)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__15583.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__15586 = cljs.core.PersistentVector.fromArray([]);
  var s__15587 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__15587))) {
      var G__15588 = cljs.core.conj.call(null, ret__15586, cljs.core.first.call(null, s__15587));
      var G__15589 = cljs.core.next.call(null, s__15587);
      ret__15586 = G__15588;
      s__15587 = G__15589;
      continue
    }else {
      return cljs.core.seq.call(null, ret__15586)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____15590 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____15590) {
        return or__3824__auto____15590
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__15591 = x.lastIndexOf("/");
      if(i__15591 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__15591 + 1)
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
    var or__3824__auto____15592 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____15592) {
      return or__3824__auto____15592
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__15593 = x.lastIndexOf("/");
    if(i__15593 > -1) {
      return cljs.core.subs.call(null, x, 2, i__15593)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__15596 = cljs.core.ObjMap.fromObject([], {});
  var ks__15597 = cljs.core.seq.call(null, keys);
  var vs__15598 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____15599 = ks__15597;
      if(cljs.core.truth_(and__3822__auto____15599)) {
        return vs__15598
      }else {
        return and__3822__auto____15599
      }
    }())) {
      var G__15600 = cljs.core.assoc.call(null, map__15596, cljs.core.first.call(null, ks__15597), cljs.core.first.call(null, vs__15598));
      var G__15601 = cljs.core.next.call(null, ks__15597);
      var G__15602 = cljs.core.next.call(null, vs__15598);
      map__15596 = G__15600;
      ks__15597 = G__15601;
      vs__15598 = G__15602;
      continue
    }else {
      return map__15596
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
    var G__15605__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__15594_SHARP_, p2__15595_SHARP_) {
        return max_key.call(null, k, p1__15594_SHARP_, p2__15595_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__15605 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15605__delegate.call(this, k, x, y, more)
    };
    G__15605.cljs$lang$maxFixedArity = 3;
    G__15605.cljs$lang$applyTo = function(arglist__15606) {
      var k = cljs.core.first(arglist__15606);
      var x = cljs.core.first(cljs.core.next(arglist__15606));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15606)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15606)));
      return G__15605__delegate(k, x, y, more)
    };
    G__15605.cljs$lang$arity$variadic = G__15605__delegate;
    return G__15605
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
    var G__15607__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__15603_SHARP_, p2__15604_SHARP_) {
        return min_key.call(null, k, p1__15603_SHARP_, p2__15604_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__15607 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15607__delegate.call(this, k, x, y, more)
    };
    G__15607.cljs$lang$maxFixedArity = 3;
    G__15607.cljs$lang$applyTo = function(arglist__15608) {
      var k = cljs.core.first(arglist__15608);
      var x = cljs.core.first(cljs.core.next(arglist__15608));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15608)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15608)));
      return G__15607__delegate(k, x, y, more)
    };
    G__15607.cljs$lang$arity$variadic = G__15607__delegate;
    return G__15607
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
      var temp__3974__auto____15609 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15609)) {
        var s__15610 = temp__3974__auto____15609;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__15610), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__15610)))
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
    var temp__3974__auto____15611 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15611)) {
      var s__15612 = temp__3974__auto____15611;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__15612)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__15612), take_while.call(null, pred, cljs.core.rest.call(null, s__15612)))
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
    var comp__15613 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__15613.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__15614 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____15615 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____15615)) {
        var vec__15616__15617 = temp__3974__auto____15615;
        var e__15618 = cljs.core.nth.call(null, vec__15616__15617, 0, null);
        var s__15619 = vec__15616__15617;
        if(cljs.core.truth_(include__15614.call(null, e__15618))) {
          return s__15619
        }else {
          return cljs.core.next.call(null, s__15619)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__15614, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____15620 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____15620)) {
      var vec__15621__15622 = temp__3974__auto____15620;
      var e__15623 = cljs.core.nth.call(null, vec__15621__15622, 0, null);
      var s__15624 = vec__15621__15622;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__15623)) ? s__15624 : cljs.core.next.call(null, s__15624))
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
    var include__15625 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____15626 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____15626)) {
        var vec__15627__15628 = temp__3974__auto____15626;
        var e__15629 = cljs.core.nth.call(null, vec__15627__15628, 0, null);
        var s__15630 = vec__15627__15628;
        if(cljs.core.truth_(include__15625.call(null, e__15629))) {
          return s__15630
        }else {
          return cljs.core.next.call(null, s__15630)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__15625, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____15631 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____15631)) {
      var vec__15632__15633 = temp__3974__auto____15631;
      var e__15634 = cljs.core.nth.call(null, vec__15632__15633, 0, null);
      var s__15635 = vec__15632__15633;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__15634)) ? s__15635 : cljs.core.next.call(null, s__15635))
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
  var this__15636 = this;
  var h__364__auto____15637 = this__15636.__hash;
  if(h__364__auto____15637 != null) {
    return h__364__auto____15637
  }else {
    var h__364__auto____15638 = cljs.core.hash_coll.call(null, rng);
    this__15636.__hash = h__364__auto____15638;
    return h__364__auto____15638
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__15639 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__15640 = this;
  var this$__15641 = this;
  return cljs.core.pr_str.call(null, this$__15641)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__15642 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__15643 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__15644 = this;
  var comp__15645 = this__15644.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__15645.call(null, this__15644.start, this__15644.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__15646 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__15646.end - this__15646.start) / this__15646.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__15647 = this;
  return this__15647.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__15648 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__15648.meta, this__15648.start + this__15648.step, this__15648.end, this__15648.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__15649 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__15650 = this;
  return new cljs.core.Range(meta, this__15650.start, this__15650.end, this__15650.step, this__15650.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__15651 = this;
  return this__15651.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__15652 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__15652.start + n * this__15652.step
  }else {
    if(function() {
      var and__3822__auto____15653 = this__15652.start > this__15652.end;
      if(and__3822__auto____15653) {
        return this__15652.step === 0
      }else {
        return and__3822__auto____15653
      }
    }()) {
      return this__15652.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__15654 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__15654.start + n * this__15654.step
  }else {
    if(function() {
      var and__3822__auto____15655 = this__15654.start > this__15654.end;
      if(and__3822__auto____15655) {
        return this__15654.step === 0
      }else {
        return and__3822__auto____15655
      }
    }()) {
      return this__15654.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__15656 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__15656.meta)
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
    var temp__3974__auto____15657 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15657)) {
      var s__15658 = temp__3974__auto____15657;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__15658), take_nth.call(null, n, cljs.core.drop.call(null, n, s__15658)))
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
    var temp__3974__auto____15660 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____15660)) {
      var s__15661 = temp__3974__auto____15660;
      var fst__15662 = cljs.core.first.call(null, s__15661);
      var fv__15663 = f.call(null, fst__15662);
      var run__15664 = cljs.core.cons.call(null, fst__15662, cljs.core.take_while.call(null, function(p1__15659_SHARP_) {
        return cljs.core._EQ_.call(null, fv__15663, f.call(null, p1__15659_SHARP_))
      }, cljs.core.next.call(null, s__15661)));
      return cljs.core.cons.call(null, run__15664, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__15664), s__15661))))
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
      var temp__3971__auto____15675 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____15675)) {
        var s__15676 = temp__3971__auto____15675;
        return reductions.call(null, f, cljs.core.first.call(null, s__15676), cljs.core.rest.call(null, s__15676))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____15677 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____15677)) {
        var s__15678 = temp__3974__auto____15677;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__15678)), cljs.core.rest.call(null, s__15678))
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
      var G__15680 = null;
      var G__15680__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__15680__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__15680__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__15680__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__15680__4 = function() {
        var G__15681__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__15681 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15681__delegate.call(this, x, y, z, args)
        };
        G__15681.cljs$lang$maxFixedArity = 3;
        G__15681.cljs$lang$applyTo = function(arglist__15682) {
          var x = cljs.core.first(arglist__15682);
          var y = cljs.core.first(cljs.core.next(arglist__15682));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15682)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15682)));
          return G__15681__delegate(x, y, z, args)
        };
        G__15681.cljs$lang$arity$variadic = G__15681__delegate;
        return G__15681
      }();
      G__15680 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15680__0.call(this);
          case 1:
            return G__15680__1.call(this, x);
          case 2:
            return G__15680__2.call(this, x, y);
          case 3:
            return G__15680__3.call(this, x, y, z);
          default:
            return G__15680__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15680.cljs$lang$maxFixedArity = 3;
      G__15680.cljs$lang$applyTo = G__15680__4.cljs$lang$applyTo;
      return G__15680
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__15683 = null;
      var G__15683__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__15683__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__15683__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__15683__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__15683__4 = function() {
        var G__15684__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__15684 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15684__delegate.call(this, x, y, z, args)
        };
        G__15684.cljs$lang$maxFixedArity = 3;
        G__15684.cljs$lang$applyTo = function(arglist__15685) {
          var x = cljs.core.first(arglist__15685);
          var y = cljs.core.first(cljs.core.next(arglist__15685));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15685)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15685)));
          return G__15684__delegate(x, y, z, args)
        };
        G__15684.cljs$lang$arity$variadic = G__15684__delegate;
        return G__15684
      }();
      G__15683 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15683__0.call(this);
          case 1:
            return G__15683__1.call(this, x);
          case 2:
            return G__15683__2.call(this, x, y);
          case 3:
            return G__15683__3.call(this, x, y, z);
          default:
            return G__15683__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15683.cljs$lang$maxFixedArity = 3;
      G__15683.cljs$lang$applyTo = G__15683__4.cljs$lang$applyTo;
      return G__15683
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__15686 = null;
      var G__15686__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__15686__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__15686__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__15686__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__15686__4 = function() {
        var G__15687__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__15687 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__15687__delegate.call(this, x, y, z, args)
        };
        G__15687.cljs$lang$maxFixedArity = 3;
        G__15687.cljs$lang$applyTo = function(arglist__15688) {
          var x = cljs.core.first(arglist__15688);
          var y = cljs.core.first(cljs.core.next(arglist__15688));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15688)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15688)));
          return G__15687__delegate(x, y, z, args)
        };
        G__15687.cljs$lang$arity$variadic = G__15687__delegate;
        return G__15687
      }();
      G__15686 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__15686__0.call(this);
          case 1:
            return G__15686__1.call(this, x);
          case 2:
            return G__15686__2.call(this, x, y);
          case 3:
            return G__15686__3.call(this, x, y, z);
          default:
            return G__15686__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__15686.cljs$lang$maxFixedArity = 3;
      G__15686.cljs$lang$applyTo = G__15686__4.cljs$lang$applyTo;
      return G__15686
    }()
  };
  var juxt__4 = function() {
    var G__15689__delegate = function(f, g, h, fs) {
      var fs__15679 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__15690 = null;
        var G__15690__0 = function() {
          return cljs.core.reduce.call(null, function(p1__15665_SHARP_, p2__15666_SHARP_) {
            return cljs.core.conj.call(null, p1__15665_SHARP_, p2__15666_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__15679)
        };
        var G__15690__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__15667_SHARP_, p2__15668_SHARP_) {
            return cljs.core.conj.call(null, p1__15667_SHARP_, p2__15668_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__15679)
        };
        var G__15690__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__15669_SHARP_, p2__15670_SHARP_) {
            return cljs.core.conj.call(null, p1__15669_SHARP_, p2__15670_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__15679)
        };
        var G__15690__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__15671_SHARP_, p2__15672_SHARP_) {
            return cljs.core.conj.call(null, p1__15671_SHARP_, p2__15672_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__15679)
        };
        var G__15690__4 = function() {
          var G__15691__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__15673_SHARP_, p2__15674_SHARP_) {
              return cljs.core.conj.call(null, p1__15673_SHARP_, cljs.core.apply.call(null, p2__15674_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__15679)
          };
          var G__15691 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__15691__delegate.call(this, x, y, z, args)
          };
          G__15691.cljs$lang$maxFixedArity = 3;
          G__15691.cljs$lang$applyTo = function(arglist__15692) {
            var x = cljs.core.first(arglist__15692);
            var y = cljs.core.first(cljs.core.next(arglist__15692));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15692)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15692)));
            return G__15691__delegate(x, y, z, args)
          };
          G__15691.cljs$lang$arity$variadic = G__15691__delegate;
          return G__15691
        }();
        G__15690 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__15690__0.call(this);
            case 1:
              return G__15690__1.call(this, x);
            case 2:
              return G__15690__2.call(this, x, y);
            case 3:
              return G__15690__3.call(this, x, y, z);
            default:
              return G__15690__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__15690.cljs$lang$maxFixedArity = 3;
        G__15690.cljs$lang$applyTo = G__15690__4.cljs$lang$applyTo;
        return G__15690
      }()
    };
    var G__15689 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__15689__delegate.call(this, f, g, h, fs)
    };
    G__15689.cljs$lang$maxFixedArity = 3;
    G__15689.cljs$lang$applyTo = function(arglist__15693) {
      var f = cljs.core.first(arglist__15693);
      var g = cljs.core.first(cljs.core.next(arglist__15693));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15693)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15693)));
      return G__15689__delegate(f, g, h, fs)
    };
    G__15689.cljs$lang$arity$variadic = G__15689__delegate;
    return G__15689
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
        var G__15695 = cljs.core.next.call(null, coll);
        coll = G__15695;
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
        var and__3822__auto____15694 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____15694)) {
          return n > 0
        }else {
          return and__3822__auto____15694
        }
      }())) {
        var G__15696 = n - 1;
        var G__15697 = cljs.core.next.call(null, coll);
        n = G__15696;
        coll = G__15697;
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
  var matches__15698 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__15698), s)) {
    if(cljs.core.count.call(null, matches__15698) === 1) {
      return cljs.core.first.call(null, matches__15698)
    }else {
      return cljs.core.vec.call(null, matches__15698)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__15699 = re.exec(s);
  if(matches__15699 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__15699) === 1) {
      return cljs.core.first.call(null, matches__15699)
    }else {
      return cljs.core.vec.call(null, matches__15699)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__15700 = cljs.core.re_find.call(null, re, s);
  var match_idx__15701 = s.search(re);
  var match_str__15702 = cljs.core.coll_QMARK_.call(null, match_data__15700) ? cljs.core.first.call(null, match_data__15700) : match_data__15700;
  var post_match__15703 = cljs.core.subs.call(null, s, match_idx__15701 + cljs.core.count.call(null, match_str__15702));
  if(cljs.core.truth_(match_data__15700)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__15700, re_seq.call(null, re, post_match__15703))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__15705__15706 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___15707 = cljs.core.nth.call(null, vec__15705__15706, 0, null);
  var flags__15708 = cljs.core.nth.call(null, vec__15705__15706, 1, null);
  var pattern__15709 = cljs.core.nth.call(null, vec__15705__15706, 2, null);
  return new RegExp(pattern__15709, flags__15708)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__15704_SHARP_) {
    return print_one.call(null, p1__15704_SHARP_, opts)
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
          var and__3822__auto____15710 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____15710)) {
            var and__3822__auto____15714 = function() {
              var G__15711__15712 = obj;
              if(G__15711__15712 != null) {
                if(function() {
                  var or__3824__auto____15713 = G__15711__15712.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____15713) {
                    return or__3824__auto____15713
                  }else {
                    return G__15711__15712.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__15711__15712.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15711__15712)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__15711__15712)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____15714)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____15714
            }
          }else {
            return and__3822__auto____15710
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____15715 = obj != null;
          if(and__3822__auto____15715) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____15715
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__15716__15717 = obj;
          if(G__15716__15717 != null) {
            if(function() {
              var or__3824__auto____15718 = G__15716__15717.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____15718) {
                return or__3824__auto____15718
              }else {
                return G__15716__15717.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__15716__15717.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__15716__15717)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__15716__15717)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__15719 = cljs.core.first.call(null, objs);
  var sb__15720 = new goog.string.StringBuffer;
  var G__15721__15722 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__15721__15722)) {
    var obj__15723 = cljs.core.first.call(null, G__15721__15722);
    var G__15721__15724 = G__15721__15722;
    while(true) {
      if(obj__15723 === first_obj__15719) {
      }else {
        sb__15720.append(" ")
      }
      var G__15725__15726 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__15723, opts));
      if(cljs.core.truth_(G__15725__15726)) {
        var string__15727 = cljs.core.first.call(null, G__15725__15726);
        var G__15725__15728 = G__15725__15726;
        while(true) {
          sb__15720.append(string__15727);
          var temp__3974__auto____15729 = cljs.core.next.call(null, G__15725__15728);
          if(cljs.core.truth_(temp__3974__auto____15729)) {
            var G__15725__15730 = temp__3974__auto____15729;
            var G__15733 = cljs.core.first.call(null, G__15725__15730);
            var G__15734 = G__15725__15730;
            string__15727 = G__15733;
            G__15725__15728 = G__15734;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____15731 = cljs.core.next.call(null, G__15721__15724);
      if(cljs.core.truth_(temp__3974__auto____15731)) {
        var G__15721__15732 = temp__3974__auto____15731;
        var G__15735 = cljs.core.first.call(null, G__15721__15732);
        var G__15736 = G__15721__15732;
        obj__15723 = G__15735;
        G__15721__15724 = G__15736;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__15720
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__15737 = cljs.core.pr_sb.call(null, objs, opts);
  sb__15737.append("\n");
  return[cljs.core.str(sb__15737)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__15738 = cljs.core.first.call(null, objs);
  var G__15739__15740 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__15739__15740)) {
    var obj__15741 = cljs.core.first.call(null, G__15739__15740);
    var G__15739__15742 = G__15739__15740;
    while(true) {
      if(obj__15741 === first_obj__15738) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__15743__15744 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__15741, opts));
      if(cljs.core.truth_(G__15743__15744)) {
        var string__15745 = cljs.core.first.call(null, G__15743__15744);
        var G__15743__15746 = G__15743__15744;
        while(true) {
          cljs.core.string_print.call(null, string__15745);
          var temp__3974__auto____15747 = cljs.core.next.call(null, G__15743__15746);
          if(cljs.core.truth_(temp__3974__auto____15747)) {
            var G__15743__15748 = temp__3974__auto____15747;
            var G__15751 = cljs.core.first.call(null, G__15743__15748);
            var G__15752 = G__15743__15748;
            string__15745 = G__15751;
            G__15743__15746 = G__15752;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____15749 = cljs.core.next.call(null, G__15739__15742);
      if(cljs.core.truth_(temp__3974__auto____15749)) {
        var G__15739__15750 = temp__3974__auto____15749;
        var G__15753 = cljs.core.first.call(null, G__15739__15750);
        var G__15754 = G__15739__15750;
        obj__15741 = G__15753;
        G__15739__15742 = G__15754;
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
  pr_str.cljs$lang$applyTo = function(arglist__15755) {
    var objs = cljs.core.seq(arglist__15755);
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
  prn_str.cljs$lang$applyTo = function(arglist__15756) {
    var objs = cljs.core.seq(arglist__15756);
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
  pr.cljs$lang$applyTo = function(arglist__15757) {
    var objs = cljs.core.seq(arglist__15757);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__15758) {
    var objs = cljs.core.seq(arglist__15758);
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
  print_str.cljs$lang$applyTo = function(arglist__15759) {
    var objs = cljs.core.seq(arglist__15759);
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
  println.cljs$lang$applyTo = function(arglist__15760) {
    var objs = cljs.core.seq(arglist__15760);
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
  println_str.cljs$lang$applyTo = function(arglist__15761) {
    var objs = cljs.core.seq(arglist__15761);
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
  prn.cljs$lang$applyTo = function(arglist__15762) {
    var objs = cljs.core.seq(arglist__15762);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__15763 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15763, "{", ", ", "}", opts, coll)
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
  var pr_pair__15764 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15764, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__15765 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15765, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____15766 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____15766)) {
        var nspc__15767 = temp__3974__auto____15766;
        return[cljs.core.str(nspc__15767), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____15768 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____15768)) {
          var nspc__15769 = temp__3974__auto____15768;
          return[cljs.core.str(nspc__15769), cljs.core.str("/")].join("")
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
  var pr_pair__15770 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15770, "{", ", ", "}", opts, coll)
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
  var pr_pair__15771 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__15771, "{", ", ", "}", opts, coll)
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
  var this__15772 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__15773 = this;
  var G__15774__15775 = cljs.core.seq.call(null, this__15773.watches);
  if(cljs.core.truth_(G__15774__15775)) {
    var G__15777__15779 = cljs.core.first.call(null, G__15774__15775);
    var vec__15778__15780 = G__15777__15779;
    var key__15781 = cljs.core.nth.call(null, vec__15778__15780, 0, null);
    var f__15782 = cljs.core.nth.call(null, vec__15778__15780, 1, null);
    var G__15774__15783 = G__15774__15775;
    var G__15777__15784 = G__15777__15779;
    var G__15774__15785 = G__15774__15783;
    while(true) {
      var vec__15786__15787 = G__15777__15784;
      var key__15788 = cljs.core.nth.call(null, vec__15786__15787, 0, null);
      var f__15789 = cljs.core.nth.call(null, vec__15786__15787, 1, null);
      var G__15774__15790 = G__15774__15785;
      f__15789.call(null, key__15788, this$, oldval, newval);
      var temp__3974__auto____15791 = cljs.core.next.call(null, G__15774__15790);
      if(cljs.core.truth_(temp__3974__auto____15791)) {
        var G__15774__15792 = temp__3974__auto____15791;
        var G__15799 = cljs.core.first.call(null, G__15774__15792);
        var G__15800 = G__15774__15792;
        G__15777__15784 = G__15799;
        G__15774__15785 = G__15800;
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
  var this__15793 = this;
  return this$.watches = cljs.core.assoc.call(null, this__15793.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__15794 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__15794.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__15795 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__15795.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__15796 = this;
  return this__15796.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__15797 = this;
  return this__15797.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__15798 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__15807__delegate = function(x, p__15801) {
      var map__15802__15803 = p__15801;
      var map__15802__15804 = cljs.core.seq_QMARK_.call(null, map__15802__15803) ? cljs.core.apply.call(null, cljs.core.hash_map, map__15802__15803) : map__15802__15803;
      var validator__15805 = cljs.core.get.call(null, map__15802__15804, "\ufdd0'validator");
      var meta__15806 = cljs.core.get.call(null, map__15802__15804, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__15806, validator__15805, null)
    };
    var G__15807 = function(x, var_args) {
      var p__15801 = null;
      if(goog.isDef(var_args)) {
        p__15801 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15807__delegate.call(this, x, p__15801)
    };
    G__15807.cljs$lang$maxFixedArity = 1;
    G__15807.cljs$lang$applyTo = function(arglist__15808) {
      var x = cljs.core.first(arglist__15808);
      var p__15801 = cljs.core.rest(arglist__15808);
      return G__15807__delegate(x, p__15801)
    };
    G__15807.cljs$lang$arity$variadic = G__15807__delegate;
    return G__15807
  }();
  atom = function(x, var_args) {
    var p__15801 = var_args;
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
  var temp__3974__auto____15809 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____15809)) {
    var validate__15810 = temp__3974__auto____15809;
    if(cljs.core.truth_(validate__15810.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__15811 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__15811, new_value);
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
    var G__15812__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__15812 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__15812__delegate.call(this, a, f, x, y, z, more)
    };
    G__15812.cljs$lang$maxFixedArity = 5;
    G__15812.cljs$lang$applyTo = function(arglist__15813) {
      var a = cljs.core.first(arglist__15813);
      var f = cljs.core.first(cljs.core.next(arglist__15813));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15813)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15813))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15813)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__15813)))));
      return G__15812__delegate(a, f, x, y, z, more)
    };
    G__15812.cljs$lang$arity$variadic = G__15812__delegate;
    return G__15812
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__15814) {
    var iref = cljs.core.first(arglist__15814);
    var f = cljs.core.first(cljs.core.next(arglist__15814));
    var args = cljs.core.rest(cljs.core.next(arglist__15814));
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
  var this__15815 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__15815.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__15816 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__15816.state, function(p__15817) {
    var curr_state__15818 = p__15817;
    var curr_state__15819 = cljs.core.seq_QMARK_.call(null, curr_state__15818) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__15818) : curr_state__15818;
    var done__15820 = cljs.core.get.call(null, curr_state__15819, "\ufdd0'done");
    if(cljs.core.truth_(done__15820)) {
      return curr_state__15819
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__15816.f.call(null)})
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
    var map__15821__15822 = options;
    var map__15821__15823 = cljs.core.seq_QMARK_.call(null, map__15821__15822) ? cljs.core.apply.call(null, cljs.core.hash_map, map__15821__15822) : map__15821__15822;
    var keywordize_keys__15824 = cljs.core.get.call(null, map__15821__15823, "\ufdd0'keywordize-keys");
    var keyfn__15825 = cljs.core.truth_(keywordize_keys__15824) ? cljs.core.keyword : cljs.core.str;
    var f__15831 = function thisfn(x) {
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
                var iter__625__auto____15830 = function iter__15826(s__15827) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__15827__15828 = s__15827;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__15827__15828))) {
                        var k__15829 = cljs.core.first.call(null, s__15827__15828);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__15825.call(null, k__15829), thisfn.call(null, x[k__15829])]), iter__15826.call(null, cljs.core.rest.call(null, s__15827__15828)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____15830.call(null, cljs.core.js_keys.call(null, x))
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
    return f__15831.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__15832) {
    var x = cljs.core.first(arglist__15832);
    var options = cljs.core.rest(arglist__15832);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__15833 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__15837__delegate = function(args) {
      var temp__3971__auto____15834 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__15833), args);
      if(cljs.core.truth_(temp__3971__auto____15834)) {
        var v__15835 = temp__3971__auto____15834;
        return v__15835
      }else {
        var ret__15836 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__15833, cljs.core.assoc, args, ret__15836);
        return ret__15836
      }
    };
    var G__15837 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__15837__delegate.call(this, args)
    };
    G__15837.cljs$lang$maxFixedArity = 0;
    G__15837.cljs$lang$applyTo = function(arglist__15838) {
      var args = cljs.core.seq(arglist__15838);
      return G__15837__delegate(args)
    };
    G__15837.cljs$lang$arity$variadic = G__15837__delegate;
    return G__15837
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__15839 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__15839)) {
        var G__15840 = ret__15839;
        f = G__15840;
        continue
      }else {
        return ret__15839
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__15841__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__15841 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__15841__delegate.call(this, f, args)
    };
    G__15841.cljs$lang$maxFixedArity = 1;
    G__15841.cljs$lang$applyTo = function(arglist__15842) {
      var f = cljs.core.first(arglist__15842);
      var args = cljs.core.rest(arglist__15842);
      return G__15841__delegate(f, args)
    };
    G__15841.cljs$lang$arity$variadic = G__15841__delegate;
    return G__15841
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
    var k__15843 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__15843, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__15843, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3824__auto____15844 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____15844) {
      return or__3824__auto____15844
    }else {
      var or__3824__auto____15845 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____15845) {
        return or__3824__auto____15845
      }else {
        var and__3822__auto____15846 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____15846) {
          var and__3822__auto____15847 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____15847) {
            var and__3822__auto____15848 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____15848) {
              var ret__15849 = true;
              var i__15850 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____15851 = cljs.core.not.call(null, ret__15849);
                  if(or__3824__auto____15851) {
                    return or__3824__auto____15851
                  }else {
                    return i__15850 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__15849
                }else {
                  var G__15852 = isa_QMARK_.call(null, h, child.call(null, i__15850), parent.call(null, i__15850));
                  var G__15853 = i__15850 + 1;
                  ret__15849 = G__15852;
                  i__15850 = G__15853;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____15848
            }
          }else {
            return and__3822__auto____15847
          }
        }else {
          return and__3822__auto____15846
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
    var tp__15857 = "\ufdd0'parents".call(null, h);
    var td__15858 = "\ufdd0'descendants".call(null, h);
    var ta__15859 = "\ufdd0'ancestors".call(null, h);
    var tf__15860 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____15861 = cljs.core.contains_QMARK_.call(null, tp__15857.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__15859.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__15859.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__15857, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__15860.call(null, "\ufdd0'ancestors".call(null, h), tag, td__15858, parent, ta__15859), "\ufdd0'descendants":tf__15860.call(null, "\ufdd0'descendants".call(null, h), parent, ta__15859, tag, td__15858)})
    }();
    if(cljs.core.truth_(or__3824__auto____15861)) {
      return or__3824__auto____15861
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
    var parentMap__15862 = "\ufdd0'parents".call(null, h);
    var childsParents__15863 = cljs.core.truth_(parentMap__15862.call(null, tag)) ? cljs.core.disj.call(null, parentMap__15862.call(null, tag), parent) : cljs.core.set([]);
    var newParents__15864 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__15863)) ? cljs.core.assoc.call(null, parentMap__15862, tag, childsParents__15863) : cljs.core.dissoc.call(null, parentMap__15862, tag);
    var deriv_seq__15865 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__15854_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__15854_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__15854_SHARP_), cljs.core.second.call(null, p1__15854_SHARP_)))
    }, cljs.core.seq.call(null, newParents__15864)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__15862.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__15855_SHARP_, p2__15856_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__15855_SHARP_, p2__15856_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__15865))
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
  var xprefs__15866 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____15868 = cljs.core.truth_(function() {
    var and__3822__auto____15867 = xprefs__15866;
    if(cljs.core.truth_(and__3822__auto____15867)) {
      return xprefs__15866.call(null, y)
    }else {
      return and__3822__auto____15867
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____15868)) {
    return or__3824__auto____15868
  }else {
    var or__3824__auto____15870 = function() {
      var ps__15869 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__15869) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__15869), prefer_table))) {
          }else {
          }
          var G__15873 = cljs.core.rest.call(null, ps__15869);
          ps__15869 = G__15873;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____15870)) {
      return or__3824__auto____15870
    }else {
      var or__3824__auto____15872 = function() {
        var ps__15871 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__15871) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__15871), y, prefer_table))) {
            }else {
            }
            var G__15874 = cljs.core.rest.call(null, ps__15871);
            ps__15871 = G__15874;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____15872)) {
        return or__3824__auto____15872
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____15875 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____15875)) {
    return or__3824__auto____15875
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__15884 = cljs.core.reduce.call(null, function(be, p__15876) {
    var vec__15877__15878 = p__15876;
    var k__15879 = cljs.core.nth.call(null, vec__15877__15878, 0, null);
    var ___15880 = cljs.core.nth.call(null, vec__15877__15878, 1, null);
    var e__15881 = vec__15877__15878;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__15879)) {
      var be2__15883 = cljs.core.truth_(function() {
        var or__3824__auto____15882 = be == null;
        if(or__3824__auto____15882) {
          return or__3824__auto____15882
        }else {
          return cljs.core.dominates.call(null, k__15879, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__15881 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__15883), k__15879, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__15879), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__15883)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__15883
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__15884)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__15884));
      return cljs.core.second.call(null, best_entry__15884)
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
    var and__3822__auto____15885 = mf;
    if(and__3822__auto____15885) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____15885
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____15886 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15886) {
        return or__3824__auto____15886
      }else {
        var or__3824__auto____15887 = cljs.core._reset["_"];
        if(or__3824__auto____15887) {
          return or__3824__auto____15887
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____15888 = mf;
    if(and__3822__auto____15888) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____15888
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____15889 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15889) {
        return or__3824__auto____15889
      }else {
        var or__3824__auto____15890 = cljs.core._add_method["_"];
        if(or__3824__auto____15890) {
          return or__3824__auto____15890
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____15891 = mf;
    if(and__3822__auto____15891) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____15891
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____15892 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15892) {
        return or__3824__auto____15892
      }else {
        var or__3824__auto____15893 = cljs.core._remove_method["_"];
        if(or__3824__auto____15893) {
          return or__3824__auto____15893
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____15894 = mf;
    if(and__3822__auto____15894) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____15894
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____15895 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15895) {
        return or__3824__auto____15895
      }else {
        var or__3824__auto____15896 = cljs.core._prefer_method["_"];
        if(or__3824__auto____15896) {
          return or__3824__auto____15896
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____15897 = mf;
    if(and__3822__auto____15897) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____15897
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____15898 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15898) {
        return or__3824__auto____15898
      }else {
        var or__3824__auto____15899 = cljs.core._get_method["_"];
        if(or__3824__auto____15899) {
          return or__3824__auto____15899
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____15900 = mf;
    if(and__3822__auto____15900) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____15900
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____15901 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15901) {
        return or__3824__auto____15901
      }else {
        var or__3824__auto____15902 = cljs.core._methods["_"];
        if(or__3824__auto____15902) {
          return or__3824__auto____15902
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____15903 = mf;
    if(and__3822__auto____15903) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____15903
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____15904 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15904) {
        return or__3824__auto____15904
      }else {
        var or__3824__auto____15905 = cljs.core._prefers["_"];
        if(or__3824__auto____15905) {
          return or__3824__auto____15905
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____15906 = mf;
    if(and__3822__auto____15906) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____15906
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____15907 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____15907) {
        return or__3824__auto____15907
      }else {
        var or__3824__auto____15908 = cljs.core._dispatch["_"];
        if(or__3824__auto____15908) {
          return or__3824__auto____15908
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__15909 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__15910 = cljs.core._get_method.call(null, mf, dispatch_val__15909);
  if(cljs.core.truth_(target_fn__15910)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__15909)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__15910, args)
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
  var this__15911 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__15912 = this;
  cljs.core.swap_BANG_.call(null, this__15912.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__15912.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__15912.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__15912.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__15913 = this;
  cljs.core.swap_BANG_.call(null, this__15913.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__15913.method_cache, this__15913.method_table, this__15913.cached_hierarchy, this__15913.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__15914 = this;
  cljs.core.swap_BANG_.call(null, this__15914.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__15914.method_cache, this__15914.method_table, this__15914.cached_hierarchy, this__15914.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__15915 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__15915.cached_hierarchy), cljs.core.deref.call(null, this__15915.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__15915.method_cache, this__15915.method_table, this__15915.cached_hierarchy, this__15915.hierarchy)
  }
  var temp__3971__auto____15916 = cljs.core.deref.call(null, this__15915.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____15916)) {
    var target_fn__15917 = temp__3971__auto____15916;
    return target_fn__15917
  }else {
    var temp__3971__auto____15918 = cljs.core.find_and_cache_best_method.call(null, this__15915.name, dispatch_val, this__15915.hierarchy, this__15915.method_table, this__15915.prefer_table, this__15915.method_cache, this__15915.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____15918)) {
      var target_fn__15919 = temp__3971__auto____15918;
      return target_fn__15919
    }else {
      return cljs.core.deref.call(null, this__15915.method_table).call(null, this__15915.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__15920 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__15920.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__15920.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__15920.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__15920.method_cache, this__15920.method_table, this__15920.cached_hierarchy, this__15920.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__15921 = this;
  return cljs.core.deref.call(null, this__15921.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__15922 = this;
  return cljs.core.deref.call(null, this__15922.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__15923 = this;
  return cljs.core.do_dispatch.call(null, mf, this__15923.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__15924__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__15924 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__15924__delegate.call(this, _, args)
  };
  G__15924.cljs$lang$maxFixedArity = 1;
  G__15924.cljs$lang$applyTo = function(arglist__15925) {
    var _ = cljs.core.first(arglist__15925);
    var args = cljs.core.rest(arglist__15925);
    return G__15924__delegate(_, args)
  };
  G__15924.cljs$lang$arity$variadic = G__15924__delegate;
  return G__15924
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
      var s__13547 = s;
      var limit__13548 = limit;
      var parts__13549 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__13548, 1)) {
          return cljs.core.conj.call(null, parts__13549, s__13547)
        }else {
          var temp__3971__auto____13550 = cljs.core.re_find.call(null, re, s__13547);
          if(cljs.core.truth_(temp__3971__auto____13550)) {
            var m__13551 = temp__3971__auto____13550;
            var index__13552 = s__13547.indexOf(m__13551);
            var G__13553 = s__13547.substring(index__13552 + cljs.core.count.call(null, m__13551));
            var G__13554 = limit__13548 - 1;
            var G__13555 = cljs.core.conj.call(null, parts__13549, s__13547.substring(0, index__13552));
            s__13547 = G__13553;
            limit__13548 = G__13554;
            parts__13549 = G__13555;
            continue
          }else {
            return cljs.core.conj.call(null, parts__13549, s__13547)
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
  var index__13556 = s.length;
  while(true) {
    if(index__13556 === 0) {
      return""
    }else {
      var ch__13557 = cljs.core.get.call(null, s, index__13556 - 1);
      if(function() {
        var or__3824__auto____13558 = cljs.core._EQ_.call(null, ch__13557, "\n");
        if(or__3824__auto____13558) {
          return or__3824__auto____13558
        }else {
          return cljs.core._EQ_.call(null, ch__13557, "\r")
        }
      }()) {
        var G__13559 = index__13556 - 1;
        index__13556 = G__13559;
        continue
      }else {
        return s.substring(0, index__13556)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__13560 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____13561 = cljs.core.not.call(null, s__13560);
    if(or__3824__auto____13561) {
      return or__3824__auto____13561
    }else {
      var or__3824__auto____13562 = cljs.core._EQ_.call(null, "", s__13560);
      if(or__3824__auto____13562) {
        return or__3824__auto____13562
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__13560)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__13563 = new goog.string.StringBuffer;
  var length__13564 = s.length;
  var index__13565 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__13564, index__13565)) {
      return buffer__13563.toString()
    }else {
      var ch__13566 = s.charAt(index__13565);
      var temp__3971__auto____13567 = cljs.core.get.call(null, cmap, ch__13566);
      if(cljs.core.truth_(temp__3971__auto____13567)) {
        var replacement__13568 = temp__3971__auto____13567;
        buffer__13563.append([cljs.core.str(replacement__13568)].join(""))
      }else {
        buffer__13563.append(ch__13566)
      }
      var G__13569 = index__13565 + 1;
      index__13565 = G__13569;
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
      var or__3824__auto____13531 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____13531) {
        return or__3824__auto____13531
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
    var G__13532__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__13533 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__13534 = cljs.core.next.call(null, more);
            s = G__13533;
            more = G__13534;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__13532 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__13532__delegate.call(this, x, xs)
    };
    G__13532.cljs$lang$maxFixedArity = 1;
    G__13532.cljs$lang$applyTo = function(arglist__13535) {
      var x = cljs.core.first(arglist__13535);
      var xs = cljs.core.rest(arglist__13535);
      return G__13532__delegate(x, xs)
    };
    G__13532.cljs$lang$arity$variadic = G__13532__delegate;
    return G__13532
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
    var iter__625__auto____13543 = function iter__13536(s__13537) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__13537__13538 = s__13537;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__13537__13538))) {
            var vec__13539__13540 = cljs.core.first.call(null, s__13537__13538);
            var k__13541 = cljs.core.nth.call(null, vec__13539__13540, 0, null);
            var v__13542 = cljs.core.nth.call(null, vec__13539__13540, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__13541)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__13542))].join(""), iter__13536.call(null, cljs.core.rest.call(null, s__13537__13538)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____13543.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__13544 = cljs.core.last.call(null, args);
    var args__13545 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__13545)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__13544) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__13544))].join("") : params__13544)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__13546) {
    var args = cljs.core.seq(arglist__13546);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__16034 = {};
  var G__16035__16036 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__16035__16036)) {
    var G__16038__16040 = cljs.core.first.call(null, G__16035__16036);
    var vec__16039__16041 = G__16038__16040;
    var k__16042 = cljs.core.nth.call(null, vec__16039__16041, 0, null);
    var v__16043 = cljs.core.nth.call(null, vec__16039__16041, 1, null);
    var G__16035__16044 = G__16035__16036;
    var G__16038__16045 = G__16038__16040;
    var G__16035__16046 = G__16035__16044;
    while(true) {
      var vec__16047__16048 = G__16038__16045;
      var k__16049 = cljs.core.nth.call(null, vec__16047__16048, 0, null);
      var v__16050 = cljs.core.nth.call(null, vec__16047__16048, 1, null);
      var G__16035__16051 = G__16035__16046;
      out__16034[cljs.core.name.call(null, k__16049)] = v__16050;
      var temp__3974__auto____16052 = cljs.core.next.call(null, G__16035__16051);
      if(cljs.core.truth_(temp__3974__auto____16052)) {
        var G__16035__16053 = temp__3974__auto____16052;
        var G__16054 = cljs.core.first.call(null, G__16035__16053);
        var G__16055 = G__16035__16053;
        G__16038__16045 = G__16054;
        G__16035__16046 = G__16055;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__16034
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__16056 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__16056)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__16057) {
    var v = cljs.core.first(arglist__16057);
    var text = cljs.core.rest(arglist__16057);
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
        return cljs.core.reduce.call(null, function(m, p__16058) {
          var vec__16059__16060 = p__16058;
          var k__16061 = cljs.core.nth.call(null, vec__16059__16060, 0, null);
          var v__16062 = cljs.core.nth.call(null, vec__16059__16060, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__16061), clj__GT_js.call(null, v__16062))
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
      var temp__3971__auto____15926 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____15926)) {
        var cm__15927 = temp__3971__auto____15926;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__15927), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__15928) {
    var vec__15929__15930 = p__15928;
    var context__15931 = cljs.core.nth.call(null, vec__15929__15930, 0, null);
    if(cljs.core.not.call(null, context__15931)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__15931)
    }
  };
  var $ = function(sel, var_args) {
    var p__15928 = null;
    if(goog.isDef(var_args)) {
      p__15928 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__15928)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__15932) {
    var sel = cljs.core.first(arglist__15932);
    var p__15928 = cljs.core.rest(arglist__15932);
    return $__delegate(sel, p__15928)
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
  var or__3824__auto____15933 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____15933)) {
    return or__3824__auto____15933
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
  var G__15934 = null;
  var G__15934__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__15934__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__15934 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15934__2.call(this, _, k);
      case 3:
        return G__15934__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15934
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
  var attr__delegate = function($elem, a, p__15935) {
    var vec__15936__15937 = p__15935;
    var v__15938 = cljs.core.nth.call(null, vec__15936__15937, 0, null);
    var a__15939 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__15938)) {
      return $elem.attr(a__15939)
    }else {
      return $elem.attr(a__15939, v__15938)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__15935 = null;
    if(goog.isDef(var_args)) {
      p__15935 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__15935)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__15940) {
    var $elem = cljs.core.first(arglist__15940);
    var a = cljs.core.first(cljs.core.next(arglist__15940));
    var p__15935 = cljs.core.rest(cljs.core.next(arglist__15940));
    return attr__delegate($elem, a, p__15935)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__15941) {
    var vec__15942__15943 = p__15941;
    var v__15944 = cljs.core.nth.call(null, vec__15942__15943, 0, null);
    var k__15945 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__15944)) {
      return $elem.data(k__15945)
    }else {
      return $elem.data(k__15945, v__15944)
    }
  };
  var data = function($elem, k, var_args) {
    var p__15941 = null;
    if(goog.isDef(var_args)) {
      p__15941 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__15941)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__15946) {
    var $elem = cljs.core.first(arglist__15946);
    var k = cljs.core.first(cljs.core.next(arglist__15946));
    var p__15941 = cljs.core.rest(cljs.core.next(arglist__15946));
    return data__delegate($elem, k, p__15941)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__15947 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__15947)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__15948 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__15948)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__15949 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__15949)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__15950 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__15950)
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
  var hide__delegate = function($elem, p__15951) {
    var vec__15952__15953 = p__15951;
    var speed__15954 = cljs.core.nth.call(null, vec__15952__15953, 0, null);
    var on_finish__15955 = cljs.core.nth.call(null, vec__15952__15953, 1, null);
    return $elem.hide(speed__15954, on_finish__15955)
  };
  var hide = function($elem, var_args) {
    var p__15951 = null;
    if(goog.isDef(var_args)) {
      p__15951 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__15951)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__15956) {
    var $elem = cljs.core.first(arglist__15956);
    var p__15951 = cljs.core.rest(arglist__15956);
    return hide__delegate($elem, p__15951)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__15957) {
    var vec__15958__15959 = p__15957;
    var speed__15960 = cljs.core.nth.call(null, vec__15958__15959, 0, null);
    var on_finish__15961 = cljs.core.nth.call(null, vec__15958__15959, 1, null);
    return $elem.show(speed__15960, on_finish__15961)
  };
  var show = function($elem, var_args) {
    var p__15957 = null;
    if(goog.isDef(var_args)) {
      p__15957 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__15957)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__15962) {
    var $elem = cljs.core.first(arglist__15962);
    var p__15957 = cljs.core.rest(arglist__15962);
    return show__delegate($elem, p__15957)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__15963) {
    var vec__15964__15965 = p__15963;
    var speed__15966 = cljs.core.nth.call(null, vec__15964__15965, 0, null);
    var on_finish__15967 = cljs.core.nth.call(null, vec__15964__15965, 1, null);
    return $elem.toggle(speed__15966, on_finish__15967)
  };
  var toggle = function($elem, var_args) {
    var p__15963 = null;
    if(goog.isDef(var_args)) {
      p__15963 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__15963)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__15968) {
    var $elem = cljs.core.first(arglist__15968);
    var p__15963 = cljs.core.rest(arglist__15968);
    return toggle__delegate($elem, p__15963)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__15969) {
    var vec__15970__15971 = p__15969;
    var speed__15972 = cljs.core.nth.call(null, vec__15970__15971, 0, null);
    var on_finish__15973 = cljs.core.nth.call(null, vec__15970__15971, 1, null);
    return $elem.fadeOut(speed__15972, on_finish__15973)
  };
  var fade_out = function($elem, var_args) {
    var p__15969 = null;
    if(goog.isDef(var_args)) {
      p__15969 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__15969)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__15974) {
    var $elem = cljs.core.first(arglist__15974);
    var p__15969 = cljs.core.rest(arglist__15974);
    return fade_out__delegate($elem, p__15969)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__15975) {
    var vec__15976__15977 = p__15975;
    var speed__15978 = cljs.core.nth.call(null, vec__15976__15977, 0, null);
    var on_finish__15979 = cljs.core.nth.call(null, vec__15976__15977, 1, null);
    return $elem.fadeIn(speed__15978, on_finish__15979)
  };
  var fade_in = function($elem, var_args) {
    var p__15975 = null;
    if(goog.isDef(var_args)) {
      p__15975 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__15975)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__15980) {
    var $elem = cljs.core.first(arglist__15980);
    var p__15975 = cljs.core.rest(arglist__15980);
    return fade_in__delegate($elem, p__15975)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__15981) {
    var vec__15982__15983 = p__15981;
    var speed__15984 = cljs.core.nth.call(null, vec__15982__15983, 0, null);
    var on_finish__15985 = cljs.core.nth.call(null, vec__15982__15983, 1, null);
    return $elem.slideUp(speed__15984, on_finish__15985)
  };
  var slide_up = function($elem, var_args) {
    var p__15981 = null;
    if(goog.isDef(var_args)) {
      p__15981 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__15981)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__15986) {
    var $elem = cljs.core.first(arglist__15986);
    var p__15981 = cljs.core.rest(arglist__15986);
    return slide_up__delegate($elem, p__15981)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__15987) {
    var vec__15988__15989 = p__15987;
    var speed__15990 = cljs.core.nth.call(null, vec__15988__15989, 0, null);
    var on_finish__15991 = cljs.core.nth.call(null, vec__15988__15989, 1, null);
    return $elem.slideDown(speed__15990, on_finish__15991)
  };
  var slide_down = function($elem, var_args) {
    var p__15987 = null;
    if(goog.isDef(var_args)) {
      p__15987 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__15987)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__15992) {
    var $elem = cljs.core.first(arglist__15992);
    var p__15987 = cljs.core.rest(arglist__15992);
    return slide_down__delegate($elem, p__15987)
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
  var closest__delegate = function($elem, selector, p__15993) {
    var vec__15994__15995 = p__15993;
    var context__15996 = cljs.core.nth.call(null, vec__15994__15995, 0, null);
    return $elem.closest(selector, context__15996)
  };
  var closest = function($elem, selector, var_args) {
    var p__15993 = null;
    if(goog.isDef(var_args)) {
      p__15993 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__15993)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__15997) {
    var $elem = cljs.core.first(arglist__15997);
    var selector = cljs.core.first(cljs.core.next(arglist__15997));
    var p__15993 = cljs.core.rest(cljs.core.next(arglist__15997));
    return closest__delegate($elem, selector, p__15993)
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
  var val__delegate = function($elem, p__15998) {
    var vec__15999__16000 = p__15998;
    var v__16001 = cljs.core.nth.call(null, vec__15999__16000, 0, null);
    if(cljs.core.truth_(v__16001)) {
      return $elem.val(v__16001)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__15998 = null;
    if(goog.isDef(var_args)) {
      p__15998 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__15998)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__16002) {
    var $elem = cljs.core.first(arglist__16002);
    var p__15998 = cljs.core.rest(arglist__16002);
    return val__delegate($elem, p__15998)
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
jayq.core.xhr = function xhr(p__16003, content, callback) {
  var vec__16004__16005 = p__16003;
  var method__16006 = cljs.core.nth.call(null, vec__16004__16005, 0, null);
  var uri__16007 = cljs.core.nth.call(null, vec__16004__16005, 1, null);
  var params__16008 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__16006)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__16007, params__16008)
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
  var unbind__delegate = function($elem, ev, p__16009) {
    var vec__16010__16011 = p__16009;
    var func__16012 = cljs.core.nth.call(null, vec__16010__16011, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__16012)
  };
  var unbind = function($elem, ev, var_args) {
    var p__16009 = null;
    if(goog.isDef(var_args)) {
      p__16009 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__16009)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__16013) {
    var $elem = cljs.core.first(arglist__16013);
    var ev = cljs.core.first(cljs.core.next(arglist__16013));
    var p__16009 = cljs.core.rest(cljs.core.next(arglist__16013));
    return unbind__delegate($elem, ev, p__16009)
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
  var on__delegate = function($elem, events, p__16014) {
    var vec__16015__16016 = p__16014;
    var sel__16017 = cljs.core.nth.call(null, vec__16015__16016, 0, null);
    var data__16018 = cljs.core.nth.call(null, vec__16015__16016, 1, null);
    var handler__16019 = cljs.core.nth.call(null, vec__16015__16016, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__16017), data__16018, handler__16019)
  };
  var on = function($elem, events, var_args) {
    var p__16014 = null;
    if(goog.isDef(var_args)) {
      p__16014 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__16014)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__16020) {
    var $elem = cljs.core.first(arglist__16020);
    var events = cljs.core.first(cljs.core.next(arglist__16020));
    var p__16014 = cljs.core.rest(cljs.core.next(arglist__16020));
    return on__delegate($elem, events, p__16014)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__16021) {
    var vec__16022__16023 = p__16021;
    var sel__16024 = cljs.core.nth.call(null, vec__16022__16023, 0, null);
    var data__16025 = cljs.core.nth.call(null, vec__16022__16023, 1, null);
    var handler__16026 = cljs.core.nth.call(null, vec__16022__16023, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__16024), data__16025, handler__16026)
  };
  var one = function($elem, events, var_args) {
    var p__16021 = null;
    if(goog.isDef(var_args)) {
      p__16021 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__16021)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__16027) {
    var $elem = cljs.core.first(arglist__16027);
    var events = cljs.core.first(cljs.core.next(arglist__16027));
    var p__16021 = cljs.core.rest(cljs.core.next(arglist__16027));
    return one__delegate($elem, events, p__16021)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__16028) {
    var vec__16029__16030 = p__16028;
    var sel__16031 = cljs.core.nth.call(null, vec__16029__16030, 0, null);
    var handler__16032 = cljs.core.nth.call(null, vec__16029__16030, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__16031), handler__16032)
  };
  var off = function($elem, events, var_args) {
    var p__16028 = null;
    if(goog.isDef(var_args)) {
      p__16028 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__16028)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__16033) {
    var $elem = cljs.core.first(arglist__16033);
    var events = cljs.core.first(cljs.core.next(arglist__16033));
    var p__16028 = cljs.core.rest(cljs.core.next(arglist__16033));
    return off__delegate($elem, events, p__16028)
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
void 0;
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3822__auto____16089 = reader;
    if(and__3822__auto____16089) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____16089
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3824__auto____16090 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3824__auto____16090) {
        return or__3824__auto____16090
      }else {
        var or__3824__auto____16091 = cljs.reader.read_char["_"];
        if(or__3824__auto____16091) {
          return or__3824__auto____16091
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____16092 = reader;
    if(and__3822__auto____16092) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____16092
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3824__auto____16093 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3824__auto____16093) {
        return or__3824__auto____16093
      }else {
        var or__3824__auto____16094 = cljs.reader.unread["_"];
        if(or__3824__auto____16094) {
          return or__3824__auto____16094
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
  var this__16095 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__16095.buffer_atom))) {
    var idx__16096 = cljs.core.deref.call(null, this__16095.index_atom);
    cljs.core.swap_BANG_.call(null, this__16095.index_atom, cljs.core.inc);
    return this__16095.s[idx__16096]
  }else {
    var buf__16097 = cljs.core.deref.call(null, this__16095.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__16095.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__16097)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__16098 = this;
  return cljs.core.swap_BANG_.call(null, this__16098.buffer_atom, function(p1__16088_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__16088_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____16099 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3824__auto____16099)) {
    return or__3824__auto____16099
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
  var or__3824__auto____16100 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____16100) {
    return or__3824__auto____16100
  }else {
    var and__3822__auto____16102 = function() {
      var or__3824__auto____16101 = "+" === initch;
      if(or__3824__auto____16101) {
        return or__3824__auto____16101
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____16102)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__16103 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__16103);
        return next_ch__16103
      }())
    }else {
      return and__3822__auto____16102
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
  reader_error.cljs$lang$applyTo = function(arglist__16104) {
    var rdr = cljs.core.first(arglist__16104);
    var msg = cljs.core.rest(arglist__16104);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____16105 = ch != "#";
  if(and__3822__auto____16105) {
    var and__3822__auto____16106 = ch != "'";
    if(and__3822__auto____16106) {
      var and__3822__auto____16107 = ch != ":";
      if(and__3822__auto____16107) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____16107
      }
    }else {
      return and__3822__auto____16106
    }
  }else {
    return and__3822__auto____16105
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__16108 = new goog.string.StringBuffer(initch);
  var ch__16109 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____16110 = ch__16109 == null;
      if(or__3824__auto____16110) {
        return or__3824__auto____16110
      }else {
        var or__3824__auto____16111 = cljs.reader.whitespace_QMARK_.call(null, ch__16109);
        if(or__3824__auto____16111) {
          return or__3824__auto____16111
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__16109)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__16109);
      return sb__16108.toString()
    }else {
      var G__16112 = function() {
        sb__16108.append(ch__16109);
        return sb__16108
      }();
      var G__16113 = cljs.reader.read_char.call(null, rdr);
      sb__16108 = G__16112;
      ch__16109 = G__16113;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__16114 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____16115 = ch__16114 === "n";
      if(or__3824__auto____16115) {
        return or__3824__auto____16115
      }else {
        var or__3824__auto____16116 = ch__16114 === "r";
        if(or__3824__auto____16116) {
          return or__3824__auto____16116
        }else {
          return ch__16114 == null
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
  var matches__16117 = re.exec(s);
  if(matches__16117 != null) {
    if(matches__16117.length === 1) {
      return matches__16117[0]
    }else {
      return matches__16117
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__16118 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__16119 = groups__16118[2];
  if(!function() {
    var or__3824__auto____16120 = group3__16119 == null;
    if(or__3824__auto____16120) {
      return or__3824__auto____16120
    }else {
      return group3__16119.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__16121 = "-" === groups__16118[1] ? -1 : 1;
    var a__16122 = cljs.core.truth_(groups__16118[3]) ? [groups__16118[3], 10] : cljs.core.truth_(groups__16118[4]) ? [groups__16118[4], 16] : cljs.core.truth_(groups__16118[5]) ? [groups__16118[5], 8] : cljs.core.truth_(groups__16118[7]) ? [groups__16118[7], parseInt(groups__16118[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__16123 = a__16122[0];
    var radix__16124 = a__16122[1];
    if(n__16123 == null) {
      return null
    }else {
      return negate__16121 * parseInt(n__16123, radix__16124)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__16125 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__16126 = groups__16125[1];
  var denominator__16127 = groups__16125[2];
  return parseInt(numinator__16126) / parseInt(denominator__16127)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__16128 = re.exec(s);
  if(function() {
    var and__3822__auto____16129 = matches__16128 != null;
    if(and__3822__auto____16129) {
      return matches__16128[0] === s
    }else {
      return and__3822__auto____16129
    }
  }()) {
    if(matches__16128.length === 1) {
      return matches__16128[0]
    }else {
      return matches__16128
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
  var ch__16130 = cljs.reader.read_char.call(null, reader);
  var mapresult__16131 = cljs.reader.escape_char_map.call(null, ch__16130);
  if(cljs.core.truth_(mapresult__16131)) {
    return mapresult__16131
  }else {
    if(function() {
      var or__3824__auto____16132 = "u" === ch__16130;
      if(or__3824__auto____16132) {
        return or__3824__auto____16132
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__16130)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__16130)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__16130)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__16133 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__16133))) {
      var G__16134 = cljs.reader.read_char.call(null, rdr);
      ch__16133 = G__16134;
      continue
    }else {
      return ch__16133
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__16135 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__16136 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__16136)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__16136) {
      return cljs.core.persistent_BANG_.call(null, a__16135)
    }else {
      var temp__3971__auto____16137 = cljs.reader.macros.call(null, ch__16136);
      if(cljs.core.truth_(temp__3971__auto____16137)) {
        var macrofn__16138 = temp__3971__auto____16137;
        var mret__16139 = macrofn__16138.call(null, rdr, ch__16136);
        var G__16141 = mret__16139 === rdr ? a__16135 : cljs.core.conj_BANG_.call(null, a__16135, mret__16139);
        a__16135 = G__16141;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__16136);
        var o__16140 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__16142 = o__16140 === rdr ? a__16135 : cljs.core.conj_BANG_.call(null, a__16135, o__16140);
        a__16135 = G__16142;
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
  var ch__16143 = cljs.reader.read_char.call(null, rdr);
  var dm__16144 = cljs.reader.dispatch_macros.call(null, ch__16143);
  if(cljs.core.truth_(dm__16144)) {
    return dm__16144.call(null, rdr, _)
  }else {
    var temp__3971__auto____16145 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__16143);
    if(cljs.core.truth_(temp__3971__auto____16145)) {
      var obj__16146 = temp__3971__auto____16145;
      return obj__16146
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__16143)
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
  var l__16147 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__16147))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__16147)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__16148 = new goog.string.StringBuffer(initch);
  var ch__16149 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____16150 = ch__16149 == null;
      if(or__3824__auto____16150) {
        return or__3824__auto____16150
      }else {
        var or__3824__auto____16151 = cljs.reader.whitespace_QMARK_.call(null, ch__16149);
        if(or__3824__auto____16151) {
          return or__3824__auto____16151
        }else {
          return cljs.reader.macros.call(null, ch__16149)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__16149);
      var s__16152 = buffer__16148.toString();
      var or__3824__auto____16153 = cljs.reader.match_number.call(null, s__16152);
      if(cljs.core.truth_(or__3824__auto____16153)) {
        return or__3824__auto____16153
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__16152, "]")
      }
    }else {
      var G__16154 = function() {
        buffer__16148.append(ch__16149);
        return buffer__16148
      }();
      var G__16155 = cljs.reader.read_char.call(null, reader);
      buffer__16148 = G__16154;
      ch__16149 = G__16155;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__16156 = new goog.string.StringBuffer;
  var ch__16157 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__16157 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__16157) {
        var G__16158 = function() {
          buffer__16156.append(cljs.reader.escape_char.call(null, buffer__16156, reader));
          return buffer__16156
        }();
        var G__16159 = cljs.reader.read_char.call(null, reader);
        buffer__16156 = G__16158;
        ch__16157 = G__16159;
        continue
      }else {
        if('"' === ch__16157) {
          return buffer__16156.toString()
        }else {
          if("\ufdd0'default") {
            var G__16160 = function() {
              buffer__16156.append(ch__16157);
              return buffer__16156
            }();
            var G__16161 = cljs.reader.read_char.call(null, reader);
            buffer__16156 = G__16160;
            ch__16157 = G__16161;
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
  var token__16162 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__16162, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__16162, 0, token__16162.indexOf("/")), cljs.core.subs.call(null, token__16162, token__16162.indexOf("/") + 1, token__16162.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__16162, cljs.core.symbol.call(null, token__16162))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__16163 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__16164 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__16163);
  var token__16165 = a__16164[0];
  var ns__16166 = a__16164[1];
  var name__16167 = a__16164[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____16169 = function() {
      var and__3822__auto____16168 = !(void 0 === ns__16166);
      if(and__3822__auto____16168) {
        return ns__16166.substring(ns__16166.length - 2, ns__16166.length) === ":/"
      }else {
        return and__3822__auto____16168
      }
    }();
    if(cljs.core.truth_(or__3824__auto____16169)) {
      return or__3824__auto____16169
    }else {
      var or__3824__auto____16170 = name__16167[name__16167.length - 1] === ":";
      if(or__3824__auto____16170) {
        return or__3824__auto____16170
      }else {
        return!(token__16165.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__16165)
  }else {
    if(cljs.core.truth_(ns__16166)) {
      return cljs.core.keyword.call(null, ns__16166.substring(0, ns__16166.indexOf("/")), name__16167)
    }else {
      return cljs.core.keyword.call(null, token__16165)
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
  var m__16171 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__16171)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__16172 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__16173__16174 = o__16172;
    if(G__16173__16174 != null) {
      if(function() {
        var or__3824__auto____16175 = G__16173__16174.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____16175) {
          return or__3824__auto____16175
        }else {
          return G__16173__16174.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__16173__16174.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__16173__16174)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__16173__16174)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__16172, cljs.core.merge.call(null, cljs.core.meta.call(null, o__16172), m__16171))
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
    var ch__16176 = cljs.reader.read_char.call(null, reader);
    if(ch__16176 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__16176)) {
        var G__16179 = reader;
        var G__16180 = eof_is_error;
        var G__16181 = sentinel;
        var G__16182 = is_recursive;
        reader = G__16179;
        eof_is_error = G__16180;
        sentinel = G__16181;
        is_recursive = G__16182;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__16176)) {
          var G__16183 = cljs.reader.read_comment.call(null, reader, ch__16176);
          var G__16184 = eof_is_error;
          var G__16185 = sentinel;
          var G__16186 = is_recursive;
          reader = G__16183;
          eof_is_error = G__16184;
          sentinel = G__16185;
          is_recursive = G__16186;
          continue
        }else {
          if("\ufdd0'else") {
            var f__16177 = cljs.reader.macros.call(null, ch__16176);
            var res__16178 = cljs.core.truth_(f__16177) ? f__16177.call(null, reader, ch__16176) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__16176) ? cljs.reader.read_number.call(null, reader, ch__16176) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__16176) : null;
            if(res__16178 === reader) {
              var G__16187 = reader;
              var G__16188 = eof_is_error;
              var G__16189 = sentinel;
              var G__16190 = is_recursive;
              reader = G__16187;
              eof_is_error = G__16188;
              sentinel = G__16189;
              is_recursive = G__16190;
              continue
            }else {
              return res__16178
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
  var r__16191 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__16191, true, null, false)
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
  var tag__16192 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__16193 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__16194 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__16192));
  if(cljs.core.truth_(pfn__16194)) {
    return pfn__16194.call(null, form__16193)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__16192), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__16195 = cljs.core.name.call(null, tag);
  var old_parser__16196 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__16195);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__16195, f);
  return old_parser__16196
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
        return cljs.core.reduce.call(null, function(m, p__16083) {
          var vec__16084__16085 = p__16083;
          var k__16086 = cljs.core.nth.call(null, vec__16084__16085, 0, null);
          var v__16087 = cljs.core.nth.call(null, vec__16084__16085, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__16086), clj__GT_js.call(null, v__16087))
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
      var vec__16064__16065 = route;
      var m__16066 = cljs.core.nth.call(null, vec__16064__16065, 0, null);
      var u__16067 = cljs.core.nth.call(null, vec__16064__16065, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__16066), u__16067])
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
  var cur__16068 = fetch.util.clj__GT_js.call(null, d);
  var query__16069 = goog.Uri.QueryData.createFromMap.call(null, new goog.structs.Map(cur__16068));
  return[cljs.core.str(query__16069)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__16070 = req.getResponseText();
      return callback.call(null, data__16070)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__16071) {
    var vec__16072__16073 = p__16071;
    var opts__16074 = cljs.core.nth.call(null, vec__16072__16073, 0, null);
    var req__16076 = new goog.net.XhrIo;
    var vec__16075__16077 = fetch.core.parse_route.call(null, route);
    var method__16078 = cljs.core.nth.call(null, vec__16075__16077, 0, null);
    var uri__16079 = cljs.core.nth.call(null, vec__16075__16077, 1, null);
    var data__16080 = fetch.core.__GT_data.call(null, content);
    var callback__16081 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__16081)) {
      goog.events.listen.call(null, req__16076, goog.net.EventType.COMPLETE, function() {
        return callback__16081.call(null, req__16076)
      })
    }else {
    }
    return req__16076.send(uri__16079, method__16078, data__16080, cljs.core.truth_(opts__16074) ? fetch.util.clj__GT_js.call(null, opts__16074) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__16071 = null;
    if(goog.isDef(var_args)) {
      p__16071 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__16071)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__16082) {
    var route = cljs.core.first(arglist__16082);
    var content = cljs.core.first(cljs.core.next(arglist__16082));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__16082)));
    var p__16071 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__16082)));
    return xhr__delegate(route, content, callback, p__16071)
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
    var data__16063 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__16063))
  } : null)
};
goog.provide("webrot.client.main");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("jayq.core");
goog.require("fetch.remotes");
webrot.client.main.$fractal = jayq.core.$.call(null, "\ufdd0'#fractal>img");
webrot.client.main.$spinner = jayq.core.$.call(null, "\ufdd0'#spinner");
webrot.client.main.params = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
webrot.client.main.coords_from_event = function coords_from_event(e) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":e.offsetX, "\ufdd0'y":e.offsetY})
};
jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'load", function() {
  return jayq.core.hide.call(null, webrot.client.main.$spinner)
});
jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'click", function(e) {
  e.preventDefault();
  jayq.core.show.call(null, webrot.client.main.$spinner);
  var me__13527 = this;
  var $me__13528 = jayq.core.$.call(null, me__13527);
  var xy__13529 = webrot.client.main.coords_from_event.call(null, e);
  var merged_params__13530 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), xy__13529);
  return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__13530]), function(result) {
    cljs.core.swap_BANG_.call(null, webrot.client.main.params, cljs.core.merge, result);
    return jayq.core.attr.call(null, webrot.client.main.$fractal, "\ufdd0'src", crate.util.url.call(null, "mandlebrot", result))
  })
});
