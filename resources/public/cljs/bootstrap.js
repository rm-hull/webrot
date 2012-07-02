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
    var G__9107__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__9107 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9107__delegate.call(this, array, i, idxs)
    };
    G__9107.cljs$lang$maxFixedArity = 2;
    G__9107.cljs$lang$applyTo = function(arglist__9108) {
      var array = cljs.core.first(arglist__9108);
      var i = cljs.core.first(cljs.core.next(arglist__9108));
      var idxs = cljs.core.rest(cljs.core.next(arglist__9108));
      return G__9107__delegate(array, i, idxs)
    };
    G__9107.cljs$lang$arity$variadic = G__9107__delegate;
    return G__9107
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
      var and__3822__auto____9109 = this$;
      if(and__3822__auto____9109) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____9109
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____9110 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9110) {
          return or__3824__auto____9110
        }else {
          var or__3824__auto____9111 = cljs.core._invoke["_"];
          if(or__3824__auto____9111) {
            return or__3824__auto____9111
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____9112 = this$;
      if(and__3822__auto____9112) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____9112
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____9113 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9113) {
          return or__3824__auto____9113
        }else {
          var or__3824__auto____9114 = cljs.core._invoke["_"];
          if(or__3824__auto____9114) {
            return or__3824__auto____9114
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____9115 = this$;
      if(and__3822__auto____9115) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____9115
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____9116 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9116) {
          return or__3824__auto____9116
        }else {
          var or__3824__auto____9117 = cljs.core._invoke["_"];
          if(or__3824__auto____9117) {
            return or__3824__auto____9117
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____9118 = this$;
      if(and__3822__auto____9118) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____9118
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____9119 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9119) {
          return or__3824__auto____9119
        }else {
          var or__3824__auto____9120 = cljs.core._invoke["_"];
          if(or__3824__auto____9120) {
            return or__3824__auto____9120
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____9121 = this$;
      if(and__3822__auto____9121) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____9121
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____9122 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9122) {
          return or__3824__auto____9122
        }else {
          var or__3824__auto____9123 = cljs.core._invoke["_"];
          if(or__3824__auto____9123) {
            return or__3824__auto____9123
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____9124 = this$;
      if(and__3822__auto____9124) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____9124
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____9125 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9125) {
          return or__3824__auto____9125
        }else {
          var or__3824__auto____9126 = cljs.core._invoke["_"];
          if(or__3824__auto____9126) {
            return or__3824__auto____9126
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____9127 = this$;
      if(and__3822__auto____9127) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____9127
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____9128 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9128) {
          return or__3824__auto____9128
        }else {
          var or__3824__auto____9129 = cljs.core._invoke["_"];
          if(or__3824__auto____9129) {
            return or__3824__auto____9129
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____9130 = this$;
      if(and__3822__auto____9130) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____9130
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____9131 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9131) {
          return or__3824__auto____9131
        }else {
          var or__3824__auto____9132 = cljs.core._invoke["_"];
          if(or__3824__auto____9132) {
            return or__3824__auto____9132
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____9133 = this$;
      if(and__3822__auto____9133) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____9133
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____9134 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9134) {
          return or__3824__auto____9134
        }else {
          var or__3824__auto____9135 = cljs.core._invoke["_"];
          if(or__3824__auto____9135) {
            return or__3824__auto____9135
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____9136 = this$;
      if(and__3822__auto____9136) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____9136
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____9137 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9137) {
          return or__3824__auto____9137
        }else {
          var or__3824__auto____9138 = cljs.core._invoke["_"];
          if(or__3824__auto____9138) {
            return or__3824__auto____9138
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____9139 = this$;
      if(and__3822__auto____9139) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____9139
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____9140 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9140) {
          return or__3824__auto____9140
        }else {
          var or__3824__auto____9141 = cljs.core._invoke["_"];
          if(or__3824__auto____9141) {
            return or__3824__auto____9141
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____9142 = this$;
      if(and__3822__auto____9142) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____9142
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____9143 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9143) {
          return or__3824__auto____9143
        }else {
          var or__3824__auto____9144 = cljs.core._invoke["_"];
          if(or__3824__auto____9144) {
            return or__3824__auto____9144
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____9145 = this$;
      if(and__3822__auto____9145) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____9145
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____9146 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9146) {
          return or__3824__auto____9146
        }else {
          var or__3824__auto____9147 = cljs.core._invoke["_"];
          if(or__3824__auto____9147) {
            return or__3824__auto____9147
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____9148 = this$;
      if(and__3822__auto____9148) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____9148
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____9149 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9149) {
          return or__3824__auto____9149
        }else {
          var or__3824__auto____9150 = cljs.core._invoke["_"];
          if(or__3824__auto____9150) {
            return or__3824__auto____9150
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____9151 = this$;
      if(and__3822__auto____9151) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____9151
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____9152 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9152) {
          return or__3824__auto____9152
        }else {
          var or__3824__auto____9153 = cljs.core._invoke["_"];
          if(or__3824__auto____9153) {
            return or__3824__auto____9153
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____9154 = this$;
      if(and__3822__auto____9154) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____9154
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____9155 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9155) {
          return or__3824__auto____9155
        }else {
          var or__3824__auto____9156 = cljs.core._invoke["_"];
          if(or__3824__auto____9156) {
            return or__3824__auto____9156
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____9157 = this$;
      if(and__3822__auto____9157) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____9157
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____9158 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9158) {
          return or__3824__auto____9158
        }else {
          var or__3824__auto____9159 = cljs.core._invoke["_"];
          if(or__3824__auto____9159) {
            return or__3824__auto____9159
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____9160 = this$;
      if(and__3822__auto____9160) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____9160
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____9161 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9161) {
          return or__3824__auto____9161
        }else {
          var or__3824__auto____9162 = cljs.core._invoke["_"];
          if(or__3824__auto____9162) {
            return or__3824__auto____9162
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____9163 = this$;
      if(and__3822__auto____9163) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____9163
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____9164 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9164) {
          return or__3824__auto____9164
        }else {
          var or__3824__auto____9165 = cljs.core._invoke["_"];
          if(or__3824__auto____9165) {
            return or__3824__auto____9165
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____9166 = this$;
      if(and__3822__auto____9166) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____9166
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____9167 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9167) {
          return or__3824__auto____9167
        }else {
          var or__3824__auto____9168 = cljs.core._invoke["_"];
          if(or__3824__auto____9168) {
            return or__3824__auto____9168
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____9169 = this$;
      if(and__3822__auto____9169) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____9169
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____9170 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9170) {
          return or__3824__auto____9170
        }else {
          var or__3824__auto____9171 = cljs.core._invoke["_"];
          if(or__3824__auto____9171) {
            return or__3824__auto____9171
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
    var and__3822__auto____9172 = coll;
    if(and__3822__auto____9172) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____9172
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9173 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9173) {
        return or__3824__auto____9173
      }else {
        var or__3824__auto____9174 = cljs.core._count["_"];
        if(or__3824__auto____9174) {
          return or__3824__auto____9174
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
    var and__3822__auto____9175 = coll;
    if(and__3822__auto____9175) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____9175
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9176 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9176) {
        return or__3824__auto____9176
      }else {
        var or__3824__auto____9177 = cljs.core._empty["_"];
        if(or__3824__auto____9177) {
          return or__3824__auto____9177
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
    var and__3822__auto____9178 = coll;
    if(and__3822__auto____9178) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____9178
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____9179 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9179) {
        return or__3824__auto____9179
      }else {
        var or__3824__auto____9180 = cljs.core._conj["_"];
        if(or__3824__auto____9180) {
          return or__3824__auto____9180
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
      var and__3822__auto____9181 = coll;
      if(and__3822__auto____9181) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____9181
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____9182 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9182) {
          return or__3824__auto____9182
        }else {
          var or__3824__auto____9183 = cljs.core._nth["_"];
          if(or__3824__auto____9183) {
            return or__3824__auto____9183
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____9184 = coll;
      if(and__3822__auto____9184) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____9184
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____9185 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9185) {
          return or__3824__auto____9185
        }else {
          var or__3824__auto____9186 = cljs.core._nth["_"];
          if(or__3824__auto____9186) {
            return or__3824__auto____9186
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
    var and__3822__auto____9187 = coll;
    if(and__3822__auto____9187) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____9187
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9188 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9188) {
        return or__3824__auto____9188
      }else {
        var or__3824__auto____9189 = cljs.core._first["_"];
        if(or__3824__auto____9189) {
          return or__3824__auto____9189
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____9190 = coll;
    if(and__3822__auto____9190) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____9190
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9191 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9191) {
        return or__3824__auto____9191
      }else {
        var or__3824__auto____9192 = cljs.core._rest["_"];
        if(or__3824__auto____9192) {
          return or__3824__auto____9192
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
      var and__3822__auto____9193 = o;
      if(and__3822__auto____9193) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____9193
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____9194 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____9194) {
          return or__3824__auto____9194
        }else {
          var or__3824__auto____9195 = cljs.core._lookup["_"];
          if(or__3824__auto____9195) {
            return or__3824__auto____9195
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____9196 = o;
      if(and__3822__auto____9196) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____9196
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____9197 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____9197) {
          return or__3824__auto____9197
        }else {
          var or__3824__auto____9198 = cljs.core._lookup["_"];
          if(or__3824__auto____9198) {
            return or__3824__auto____9198
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
    var and__3822__auto____9199 = coll;
    if(and__3822__auto____9199) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____9199
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____9200 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9200) {
        return or__3824__auto____9200
      }else {
        var or__3824__auto____9201 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____9201) {
          return or__3824__auto____9201
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____9202 = coll;
    if(and__3822__auto____9202) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____9202
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____9203 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9203) {
        return or__3824__auto____9203
      }else {
        var or__3824__auto____9204 = cljs.core._assoc["_"];
        if(or__3824__auto____9204) {
          return or__3824__auto____9204
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
    var and__3822__auto____9205 = coll;
    if(and__3822__auto____9205) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____9205
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____9206 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9206) {
        return or__3824__auto____9206
      }else {
        var or__3824__auto____9207 = cljs.core._dissoc["_"];
        if(or__3824__auto____9207) {
          return or__3824__auto____9207
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
    var and__3822__auto____9208 = coll;
    if(and__3822__auto____9208) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____9208
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9209 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9209) {
        return or__3824__auto____9209
      }else {
        var or__3824__auto____9210 = cljs.core._key["_"];
        if(or__3824__auto____9210) {
          return or__3824__auto____9210
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____9211 = coll;
    if(and__3822__auto____9211) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____9211
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9212 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9212) {
        return or__3824__auto____9212
      }else {
        var or__3824__auto____9213 = cljs.core._val["_"];
        if(or__3824__auto____9213) {
          return or__3824__auto____9213
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
    var and__3822__auto____9214 = coll;
    if(and__3822__auto____9214) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____9214
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____9215 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9215) {
        return or__3824__auto____9215
      }else {
        var or__3824__auto____9216 = cljs.core._disjoin["_"];
        if(or__3824__auto____9216) {
          return or__3824__auto____9216
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
    var and__3822__auto____9217 = coll;
    if(and__3822__auto____9217) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____9217
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9218 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9218) {
        return or__3824__auto____9218
      }else {
        var or__3824__auto____9219 = cljs.core._peek["_"];
        if(or__3824__auto____9219) {
          return or__3824__auto____9219
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____9220 = coll;
    if(and__3822__auto____9220) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____9220
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9221 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9221) {
        return or__3824__auto____9221
      }else {
        var or__3824__auto____9222 = cljs.core._pop["_"];
        if(or__3824__auto____9222) {
          return or__3824__auto____9222
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
    var and__3822__auto____9223 = coll;
    if(and__3822__auto____9223) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____9223
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____9224 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9224) {
        return or__3824__auto____9224
      }else {
        var or__3824__auto____9225 = cljs.core._assoc_n["_"];
        if(or__3824__auto____9225) {
          return or__3824__auto____9225
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
    var and__3822__auto____9226 = o;
    if(and__3822__auto____9226) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____9226
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9227 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____9227) {
        return or__3824__auto____9227
      }else {
        var or__3824__auto____9228 = cljs.core._deref["_"];
        if(or__3824__auto____9228) {
          return or__3824__auto____9228
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
    var and__3822__auto____9229 = o;
    if(and__3822__auto____9229) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____9229
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____9230 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____9230) {
        return or__3824__auto____9230
      }else {
        var or__3824__auto____9231 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____9231) {
          return or__3824__auto____9231
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
    var and__3822__auto____9232 = o;
    if(and__3822__auto____9232) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____9232
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9233 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____9233) {
        return or__3824__auto____9233
      }else {
        var or__3824__auto____9234 = cljs.core._meta["_"];
        if(or__3824__auto____9234) {
          return or__3824__auto____9234
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
    var and__3822__auto____9235 = o;
    if(and__3822__auto____9235) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____9235
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____9236 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____9236) {
        return or__3824__auto____9236
      }else {
        var or__3824__auto____9237 = cljs.core._with_meta["_"];
        if(or__3824__auto____9237) {
          return or__3824__auto____9237
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
      var and__3822__auto____9238 = coll;
      if(and__3822__auto____9238) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____9238
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____9239 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9239) {
          return or__3824__auto____9239
        }else {
          var or__3824__auto____9240 = cljs.core._reduce["_"];
          if(or__3824__auto____9240) {
            return or__3824__auto____9240
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____9241 = coll;
      if(and__3822__auto____9241) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____9241
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____9242 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9242) {
          return or__3824__auto____9242
        }else {
          var or__3824__auto____9243 = cljs.core._reduce["_"];
          if(or__3824__auto____9243) {
            return or__3824__auto____9243
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
    var and__3822__auto____9244 = coll;
    if(and__3822__auto____9244) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____9244
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____9245 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9245) {
        return or__3824__auto____9245
      }else {
        var or__3824__auto____9246 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____9246) {
          return or__3824__auto____9246
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
    var and__3822__auto____9247 = o;
    if(and__3822__auto____9247) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____9247
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____9248 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____9248) {
        return or__3824__auto____9248
      }else {
        var or__3824__auto____9249 = cljs.core._equiv["_"];
        if(or__3824__auto____9249) {
          return or__3824__auto____9249
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
    var and__3822__auto____9250 = o;
    if(and__3822__auto____9250) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____9250
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9251 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____9251) {
        return or__3824__auto____9251
      }else {
        var or__3824__auto____9252 = cljs.core._hash["_"];
        if(or__3824__auto____9252) {
          return or__3824__auto____9252
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
    var and__3822__auto____9253 = o;
    if(and__3822__auto____9253) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____9253
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9254 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____9254) {
        return or__3824__auto____9254
      }else {
        var or__3824__auto____9255 = cljs.core._seq["_"];
        if(or__3824__auto____9255) {
          return or__3824__auto____9255
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
    var and__3822__auto____9256 = coll;
    if(and__3822__auto____9256) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____9256
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9257 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9257) {
        return or__3824__auto____9257
      }else {
        var or__3824__auto____9258 = cljs.core._rseq["_"];
        if(or__3824__auto____9258) {
          return or__3824__auto____9258
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
    var and__3822__auto____9259 = coll;
    if(and__3822__auto____9259) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____9259
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____9260 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9260) {
        return or__3824__auto____9260
      }else {
        var or__3824__auto____9261 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____9261) {
          return or__3824__auto____9261
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____9262 = coll;
    if(and__3822__auto____9262) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____9262
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____9263 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9263) {
        return or__3824__auto____9263
      }else {
        var or__3824__auto____9264 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____9264) {
          return or__3824__auto____9264
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____9265 = coll;
    if(and__3822__auto____9265) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____9265
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____9266 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9266) {
        return or__3824__auto____9266
      }else {
        var or__3824__auto____9267 = cljs.core._entry_key["_"];
        if(or__3824__auto____9267) {
          return or__3824__auto____9267
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____9268 = coll;
    if(and__3822__auto____9268) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____9268
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9269 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9269) {
        return or__3824__auto____9269
      }else {
        var or__3824__auto____9270 = cljs.core._comparator["_"];
        if(or__3824__auto____9270) {
          return or__3824__auto____9270
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
    var and__3822__auto____9271 = o;
    if(and__3822__auto____9271) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____9271
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____9272 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____9272) {
        return or__3824__auto____9272
      }else {
        var or__3824__auto____9273 = cljs.core._pr_seq["_"];
        if(or__3824__auto____9273) {
          return or__3824__auto____9273
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
    var and__3822__auto____9274 = d;
    if(and__3822__auto____9274) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____9274
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____9275 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____9275) {
        return or__3824__auto____9275
      }else {
        var or__3824__auto____9276 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____9276) {
          return or__3824__auto____9276
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
    var and__3822__auto____9277 = this$;
    if(and__3822__auto____9277) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____9277
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____9278 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9278) {
        return or__3824__auto____9278
      }else {
        var or__3824__auto____9279 = cljs.core._notify_watches["_"];
        if(or__3824__auto____9279) {
          return or__3824__auto____9279
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____9280 = this$;
    if(and__3822__auto____9280) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____9280
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____9281 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9281) {
        return or__3824__auto____9281
      }else {
        var or__3824__auto____9282 = cljs.core._add_watch["_"];
        if(or__3824__auto____9282) {
          return or__3824__auto____9282
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____9283 = this$;
    if(and__3822__auto____9283) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____9283
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____9284 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9284) {
        return or__3824__auto____9284
      }else {
        var or__3824__auto____9285 = cljs.core._remove_watch["_"];
        if(or__3824__auto____9285) {
          return or__3824__auto____9285
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
    var and__3822__auto____9286 = coll;
    if(and__3822__auto____9286) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____9286
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9287 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9287) {
        return or__3824__auto____9287
      }else {
        var or__3824__auto____9288 = cljs.core._as_transient["_"];
        if(or__3824__auto____9288) {
          return or__3824__auto____9288
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
    var and__3822__auto____9289 = tcoll;
    if(and__3822__auto____9289) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____9289
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____9290 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9290) {
        return or__3824__auto____9290
      }else {
        var or__3824__auto____9291 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____9291) {
          return or__3824__auto____9291
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____9292 = tcoll;
    if(and__3822__auto____9292) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____9292
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____9293 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9293) {
        return or__3824__auto____9293
      }else {
        var or__3824__auto____9294 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____9294) {
          return or__3824__auto____9294
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
    var and__3822__auto____9295 = tcoll;
    if(and__3822__auto____9295) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____9295
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____9296 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9296) {
        return or__3824__auto____9296
      }else {
        var or__3824__auto____9297 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____9297) {
          return or__3824__auto____9297
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
    var and__3822__auto____9298 = tcoll;
    if(and__3822__auto____9298) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____9298
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____9299 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9299) {
        return or__3824__auto____9299
      }else {
        var or__3824__auto____9300 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____9300) {
          return or__3824__auto____9300
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
    var and__3822__auto____9301 = tcoll;
    if(and__3822__auto____9301) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____9301
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____9302 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9302) {
        return or__3824__auto____9302
      }else {
        var or__3824__auto____9303 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____9303) {
          return or__3824__auto____9303
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____9304 = tcoll;
    if(and__3822__auto____9304) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____9304
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____9305 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9305) {
        return or__3824__auto____9305
      }else {
        var or__3824__auto____9306 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____9306) {
          return or__3824__auto____9306
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
    var and__3822__auto____9307 = tcoll;
    if(and__3822__auto____9307) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____9307
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____9308 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9308) {
        return or__3824__auto____9308
      }else {
        var or__3824__auto____9309 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____9309) {
          return or__3824__auto____9309
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
    var or__3824__auto____9310 = x === y;
    if(or__3824__auto____9310) {
      return or__3824__auto____9310
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__9311__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9312 = y;
            var G__9313 = cljs.core.first.call(null, more);
            var G__9314 = cljs.core.next.call(null, more);
            x = G__9312;
            y = G__9313;
            more = G__9314;
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
    var G__9311 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9311__delegate.call(this, x, y, more)
    };
    G__9311.cljs$lang$maxFixedArity = 2;
    G__9311.cljs$lang$applyTo = function(arglist__9315) {
      var x = cljs.core.first(arglist__9315);
      var y = cljs.core.first(cljs.core.next(arglist__9315));
      var more = cljs.core.rest(cljs.core.next(arglist__9315));
      return G__9311__delegate(x, y, more)
    };
    G__9311.cljs$lang$arity$variadic = G__9311__delegate;
    return G__9311
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
    var or__3824__auto____9316 = x == null;
    if(or__3824__auto____9316) {
      return or__3824__auto____9316
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
  var G__9317 = null;
  var G__9317__2 = function(o, k) {
    return null
  };
  var G__9317__3 = function(o, k, not_found) {
    return not_found
  };
  G__9317 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9317__2.call(this, o, k);
      case 3:
        return G__9317__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9317
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
  var G__9318 = null;
  var G__9318__2 = function(_, f) {
    return f.call(null)
  };
  var G__9318__3 = function(_, f, start) {
    return start
  };
  G__9318 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9318__2.call(this, _, f);
      case 3:
        return G__9318__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9318
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
  var G__9319 = null;
  var G__9319__2 = function(_, n) {
    return null
  };
  var G__9319__3 = function(_, n, not_found) {
    return not_found
  };
  G__9319 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9319__2.call(this, _, n);
      case 3:
        return G__9319__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9319
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
      var val__9320 = cljs.core._nth.call(null, cicoll, 0);
      var n__9321 = 1;
      while(true) {
        if(n__9321 < cljs.core._count.call(null, cicoll)) {
          var nval__9322 = f.call(null, val__9320, cljs.core._nth.call(null, cicoll, n__9321));
          if(cljs.core.reduced_QMARK_.call(null, nval__9322)) {
            return cljs.core.deref.call(null, nval__9322)
          }else {
            var G__9329 = nval__9322;
            var G__9330 = n__9321 + 1;
            val__9320 = G__9329;
            n__9321 = G__9330;
            continue
          }
        }else {
          return val__9320
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__9323 = val;
    var n__9324 = 0;
    while(true) {
      if(n__9324 < cljs.core._count.call(null, cicoll)) {
        var nval__9325 = f.call(null, val__9323, cljs.core._nth.call(null, cicoll, n__9324));
        if(cljs.core.reduced_QMARK_.call(null, nval__9325)) {
          return cljs.core.deref.call(null, nval__9325)
        }else {
          var G__9331 = nval__9325;
          var G__9332 = n__9324 + 1;
          val__9323 = G__9331;
          n__9324 = G__9332;
          continue
        }
      }else {
        return val__9323
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__9326 = val;
    var n__9327 = idx;
    while(true) {
      if(n__9327 < cljs.core._count.call(null, cicoll)) {
        var nval__9328 = f.call(null, val__9326, cljs.core._nth.call(null, cicoll, n__9327));
        if(cljs.core.reduced_QMARK_.call(null, nval__9328)) {
          return cljs.core.deref.call(null, nval__9328)
        }else {
          var G__9333 = nval__9328;
          var G__9334 = n__9327 + 1;
          val__9326 = G__9333;
          n__9327 = G__9334;
          continue
        }
      }else {
        return val__9326
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
  var this__9335 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9336 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__9337 = this;
  var this$__9338 = this;
  return cljs.core.pr_str.call(null, this$__9338)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9339 = this;
  if(cljs.core.counted_QMARK_.call(null, this__9339.a)) {
    return cljs.core.ci_reduce.call(null, this__9339.a, f, this__9339.a[this__9339.i], this__9339.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__9339.a[this__9339.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9340 = this;
  if(cljs.core.counted_QMARK_.call(null, this__9340.a)) {
    return cljs.core.ci_reduce.call(null, this__9340.a, f, start, this__9340.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9341 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9342 = this;
  return this__9342.a.length - this__9342.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__9343 = this;
  return this__9343.a[this__9343.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__9344 = this;
  if(this__9344.i + 1 < this__9344.a.length) {
    return new cljs.core.IndexedSeq(this__9344.a, this__9344.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9345 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9346 = this;
  var i__9347 = n + this__9346.i;
  if(i__9347 < this__9346.a.length) {
    return this__9346.a[i__9347]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9348 = this;
  var i__9349 = n + this__9348.i;
  if(i__9349 < this__9348.a.length) {
    return this__9348.a[i__9349]
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
  var G__9350 = null;
  var G__9350__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__9350__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__9350 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9350__2.call(this, array, f);
      case 3:
        return G__9350__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9350
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__9351 = null;
  var G__9351__2 = function(array, k) {
    return array[k]
  };
  var G__9351__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__9351 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9351__2.call(this, array, k);
      case 3:
        return G__9351__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9351
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__9352 = null;
  var G__9352__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__9352__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__9352 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9352__2.call(this, array, n);
      case 3:
        return G__9352__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9352
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
      var G__9353__9354 = coll;
      if(G__9353__9354 != null) {
        if(function() {
          var or__3824__auto____9355 = G__9353__9354.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____9355) {
            return or__3824__auto____9355
          }else {
            return G__9353__9354.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__9353__9354.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9353__9354)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9353__9354)
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
      var G__9356__9357 = coll;
      if(G__9356__9357 != null) {
        if(function() {
          var or__3824__auto____9358 = G__9356__9357.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9358) {
            return or__3824__auto____9358
          }else {
            return G__9356__9357.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9356__9357.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9356__9357)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9356__9357)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__9359 = cljs.core.seq.call(null, coll);
      if(s__9359 != null) {
        return cljs.core._first.call(null, s__9359)
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
      var G__9360__9361 = coll;
      if(G__9360__9361 != null) {
        if(function() {
          var or__3824__auto____9362 = G__9360__9361.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9362) {
            return or__3824__auto____9362
          }else {
            return G__9360__9361.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9360__9361.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9360__9361)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9360__9361)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__9363 = cljs.core.seq.call(null, coll);
      if(s__9363 != null) {
        return cljs.core._rest.call(null, s__9363)
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
      var G__9364__9365 = coll;
      if(G__9364__9365 != null) {
        if(function() {
          var or__3824__auto____9366 = G__9364__9365.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9366) {
            return or__3824__auto____9366
          }else {
            return G__9364__9365.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9364__9365.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9364__9365)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9364__9365)
      }
    }()) {
      var coll__9367 = cljs.core._rest.call(null, coll);
      if(coll__9367 != null) {
        if(function() {
          var G__9368__9369 = coll__9367;
          if(G__9368__9369 != null) {
            if(function() {
              var or__3824__auto____9370 = G__9368__9369.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____9370) {
                return or__3824__auto____9370
              }else {
                return G__9368__9369.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__9368__9369.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9368__9369)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9368__9369)
          }
        }()) {
          return coll__9367
        }else {
          return cljs.core._seq.call(null, coll__9367)
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
      var G__9371 = cljs.core.next.call(null, s);
      s = G__9371;
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
    var G__9372__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__9373 = conj.call(null, coll, x);
          var G__9374 = cljs.core.first.call(null, xs);
          var G__9375 = cljs.core.next.call(null, xs);
          coll = G__9373;
          x = G__9374;
          xs = G__9375;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__9372 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9372__delegate.call(this, coll, x, xs)
    };
    G__9372.cljs$lang$maxFixedArity = 2;
    G__9372.cljs$lang$applyTo = function(arglist__9376) {
      var coll = cljs.core.first(arglist__9376);
      var x = cljs.core.first(cljs.core.next(arglist__9376));
      var xs = cljs.core.rest(cljs.core.next(arglist__9376));
      return G__9372__delegate(coll, x, xs)
    };
    G__9372.cljs$lang$arity$variadic = G__9372__delegate;
    return G__9372
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
  var s__9377 = cljs.core.seq.call(null, coll);
  var acc__9378 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__9377)) {
      return acc__9378 + cljs.core._count.call(null, s__9377)
    }else {
      var G__9379 = cljs.core.next.call(null, s__9377);
      var G__9380 = acc__9378 + 1;
      s__9377 = G__9379;
      acc__9378 = G__9380;
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
        var G__9381__9382 = coll;
        if(G__9381__9382 != null) {
          if(function() {
            var or__3824__auto____9383 = G__9381__9382.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____9383) {
              return or__3824__auto____9383
            }else {
              return G__9381__9382.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9381__9382.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9381__9382)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9381__9382)
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
        var G__9384__9385 = coll;
        if(G__9384__9385 != null) {
          if(function() {
            var or__3824__auto____9386 = G__9384__9385.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____9386) {
              return or__3824__auto____9386
            }else {
              return G__9384__9385.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9384__9385.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9384__9385)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9384__9385)
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
    var G__9388__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__9387 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__9389 = ret__9387;
          var G__9390 = cljs.core.first.call(null, kvs);
          var G__9391 = cljs.core.second.call(null, kvs);
          var G__9392 = cljs.core.nnext.call(null, kvs);
          coll = G__9389;
          k = G__9390;
          v = G__9391;
          kvs = G__9392;
          continue
        }else {
          return ret__9387
        }
        break
      }
    };
    var G__9388 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9388__delegate.call(this, coll, k, v, kvs)
    };
    G__9388.cljs$lang$maxFixedArity = 3;
    G__9388.cljs$lang$applyTo = function(arglist__9393) {
      var coll = cljs.core.first(arglist__9393);
      var k = cljs.core.first(cljs.core.next(arglist__9393));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9393)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9393)));
      return G__9388__delegate(coll, k, v, kvs)
    };
    G__9388.cljs$lang$arity$variadic = G__9388__delegate;
    return G__9388
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
    var G__9395__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9394 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9396 = ret__9394;
          var G__9397 = cljs.core.first.call(null, ks);
          var G__9398 = cljs.core.next.call(null, ks);
          coll = G__9396;
          k = G__9397;
          ks = G__9398;
          continue
        }else {
          return ret__9394
        }
        break
      }
    };
    var G__9395 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9395__delegate.call(this, coll, k, ks)
    };
    G__9395.cljs$lang$maxFixedArity = 2;
    G__9395.cljs$lang$applyTo = function(arglist__9399) {
      var coll = cljs.core.first(arglist__9399);
      var k = cljs.core.first(cljs.core.next(arglist__9399));
      var ks = cljs.core.rest(cljs.core.next(arglist__9399));
      return G__9395__delegate(coll, k, ks)
    };
    G__9395.cljs$lang$arity$variadic = G__9395__delegate;
    return G__9395
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
    var G__9400__9401 = o;
    if(G__9400__9401 != null) {
      if(function() {
        var or__3824__auto____9402 = G__9400__9401.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____9402) {
          return or__3824__auto____9402
        }else {
          return G__9400__9401.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__9400__9401.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9400__9401)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9400__9401)
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
    var G__9404__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9403 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9405 = ret__9403;
          var G__9406 = cljs.core.first.call(null, ks);
          var G__9407 = cljs.core.next.call(null, ks);
          coll = G__9405;
          k = G__9406;
          ks = G__9407;
          continue
        }else {
          return ret__9403
        }
        break
      }
    };
    var G__9404 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9404__delegate.call(this, coll, k, ks)
    };
    G__9404.cljs$lang$maxFixedArity = 2;
    G__9404.cljs$lang$applyTo = function(arglist__9408) {
      var coll = cljs.core.first(arglist__9408);
      var k = cljs.core.first(cljs.core.next(arglist__9408));
      var ks = cljs.core.rest(cljs.core.next(arglist__9408));
      return G__9404__delegate(coll, k, ks)
    };
    G__9404.cljs$lang$arity$variadic = G__9404__delegate;
    return G__9404
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
    var G__9409__9410 = x;
    if(G__9409__9410 != null) {
      if(function() {
        var or__3824__auto____9411 = G__9409__9410.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____9411) {
          return or__3824__auto____9411
        }else {
          return G__9409__9410.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__9409__9410.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9409__9410)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9409__9410)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9412__9413 = x;
    if(G__9412__9413 != null) {
      if(function() {
        var or__3824__auto____9414 = G__9412__9413.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____9414) {
          return or__3824__auto____9414
        }else {
          return G__9412__9413.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__9412__9413.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9412__9413)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9412__9413)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__9415__9416 = x;
  if(G__9415__9416 != null) {
    if(function() {
      var or__3824__auto____9417 = G__9415__9416.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____9417) {
        return or__3824__auto____9417
      }else {
        return G__9415__9416.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__9415__9416.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9415__9416)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9415__9416)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__9418__9419 = x;
  if(G__9418__9419 != null) {
    if(function() {
      var or__3824__auto____9420 = G__9418__9419.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____9420) {
        return or__3824__auto____9420
      }else {
        return G__9418__9419.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__9418__9419.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9418__9419)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9418__9419)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__9421__9422 = x;
  if(G__9421__9422 != null) {
    if(function() {
      var or__3824__auto____9423 = G__9421__9422.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____9423) {
        return or__3824__auto____9423
      }else {
        return G__9421__9422.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__9421__9422.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9421__9422)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9421__9422)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__9424__9425 = x;
  if(G__9424__9425 != null) {
    if(function() {
      var or__3824__auto____9426 = G__9424__9425.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____9426) {
        return or__3824__auto____9426
      }else {
        return G__9424__9425.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__9424__9425.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9424__9425)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9424__9425)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__9427__9428 = x;
  if(G__9427__9428 != null) {
    if(function() {
      var or__3824__auto____9429 = G__9427__9428.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____9429) {
        return or__3824__auto____9429
      }else {
        return G__9427__9428.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__9427__9428.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9427__9428)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9427__9428)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9430__9431 = x;
    if(G__9430__9431 != null) {
      if(function() {
        var or__3824__auto____9432 = G__9430__9431.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____9432) {
          return or__3824__auto____9432
        }else {
          return G__9430__9431.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__9430__9431.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9430__9431)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9430__9431)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__9433__9434 = x;
  if(G__9433__9434 != null) {
    if(function() {
      var or__3824__auto____9435 = G__9433__9434.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____9435) {
        return or__3824__auto____9435
      }else {
        return G__9433__9434.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__9433__9434.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9433__9434)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9433__9434)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__9436__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__9436 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9436__delegate.call(this, keyvals)
    };
    G__9436.cljs$lang$maxFixedArity = 0;
    G__9436.cljs$lang$applyTo = function(arglist__9437) {
      var keyvals = cljs.core.seq(arglist__9437);
      return G__9436__delegate(keyvals)
    };
    G__9436.cljs$lang$arity$variadic = G__9436__delegate;
    return G__9436
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
  var keys__9438 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__9438.push(key)
  });
  return keys__9438
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__9439 = i;
  var j__9440 = j;
  var len__9441 = len;
  while(true) {
    if(len__9441 === 0) {
      return to
    }else {
      to[j__9440] = from[i__9439];
      var G__9442 = i__9439 + 1;
      var G__9443 = j__9440 + 1;
      var G__9444 = len__9441 - 1;
      i__9439 = G__9442;
      j__9440 = G__9443;
      len__9441 = G__9444;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__9445 = i + (len - 1);
  var j__9446 = j + (len - 1);
  var len__9447 = len;
  while(true) {
    if(len__9447 === 0) {
      return to
    }else {
      to[j__9446] = from[i__9445];
      var G__9448 = i__9445 - 1;
      var G__9449 = j__9446 - 1;
      var G__9450 = len__9447 - 1;
      i__9445 = G__9448;
      j__9446 = G__9449;
      len__9447 = G__9450;
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
    var G__9451__9452 = s;
    if(G__9451__9452 != null) {
      if(function() {
        var or__3824__auto____9453 = G__9451__9452.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____9453) {
          return or__3824__auto____9453
        }else {
          return G__9451__9452.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__9451__9452.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9451__9452)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9451__9452)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__9454__9455 = s;
  if(G__9454__9455 != null) {
    if(function() {
      var or__3824__auto____9456 = G__9454__9455.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____9456) {
        return or__3824__auto____9456
      }else {
        return G__9454__9455.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__9454__9455.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9454__9455)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9454__9455)
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
  var and__3822__auto____9457 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9457)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____9458 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____9458) {
        return or__3824__auto____9458
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____9457
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____9459 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9459)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____9459
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____9460 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9460)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____9460
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____9461 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____9461) {
    return or__3824__auto____9461
  }else {
    var G__9462__9463 = f;
    if(G__9462__9463 != null) {
      if(function() {
        var or__3824__auto____9464 = G__9462__9463.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____9464) {
          return or__3824__auto____9464
        }else {
          return G__9462__9463.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__9462__9463.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9462__9463)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9462__9463)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____9465 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____9465) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____9465
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
    var and__3822__auto____9466 = coll;
    if(cljs.core.truth_(and__3822__auto____9466)) {
      var and__3822__auto____9467 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____9467) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____9467
      }
    }else {
      return and__3822__auto____9466
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
    var G__9472__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__9468 = cljs.core.set([y, x]);
        var xs__9469 = more;
        while(true) {
          var x__9470 = cljs.core.first.call(null, xs__9469);
          var etc__9471 = cljs.core.next.call(null, xs__9469);
          if(cljs.core.truth_(xs__9469)) {
            if(cljs.core.contains_QMARK_.call(null, s__9468, x__9470)) {
              return false
            }else {
              var G__9473 = cljs.core.conj.call(null, s__9468, x__9470);
              var G__9474 = etc__9471;
              s__9468 = G__9473;
              xs__9469 = G__9474;
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
    var G__9472 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9472__delegate.call(this, x, y, more)
    };
    G__9472.cljs$lang$maxFixedArity = 2;
    G__9472.cljs$lang$applyTo = function(arglist__9475) {
      var x = cljs.core.first(arglist__9475);
      var y = cljs.core.first(cljs.core.next(arglist__9475));
      var more = cljs.core.rest(cljs.core.next(arglist__9475));
      return G__9472__delegate(x, y, more)
    };
    G__9472.cljs$lang$arity$variadic = G__9472__delegate;
    return G__9472
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
      var r__9476 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__9476)) {
        return r__9476
      }else {
        if(cljs.core.truth_(r__9476)) {
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
      var a__9477 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__9477, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__9477)
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
    var temp__3971__auto____9478 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____9478)) {
      var s__9479 = temp__3971__auto____9478;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__9479), cljs.core.next.call(null, s__9479))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__9480 = val;
    var coll__9481 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__9481)) {
        var nval__9482 = f.call(null, val__9480, cljs.core.first.call(null, coll__9481));
        if(cljs.core.reduced_QMARK_.call(null, nval__9482)) {
          return cljs.core.deref.call(null, nval__9482)
        }else {
          var G__9483 = nval__9482;
          var G__9484 = cljs.core.next.call(null, coll__9481);
          val__9480 = G__9483;
          coll__9481 = G__9484;
          continue
        }
      }else {
        return val__9480
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
      var G__9485__9486 = coll;
      if(G__9485__9486 != null) {
        if(function() {
          var or__3824__auto____9487 = G__9485__9486.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____9487) {
            return or__3824__auto____9487
          }else {
            return G__9485__9486.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9485__9486.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9485__9486)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9485__9486)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__9488__9489 = coll;
      if(G__9488__9489 != null) {
        if(function() {
          var or__3824__auto____9490 = G__9488__9489.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____9490) {
            return or__3824__auto____9490
          }else {
            return G__9488__9489.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9488__9489.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9488__9489)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9488__9489)
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
  var this__9491 = this;
  return this__9491.val
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
    var G__9492__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__9492 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9492__delegate.call(this, x, y, more)
    };
    G__9492.cljs$lang$maxFixedArity = 2;
    G__9492.cljs$lang$applyTo = function(arglist__9493) {
      var x = cljs.core.first(arglist__9493);
      var y = cljs.core.first(cljs.core.next(arglist__9493));
      var more = cljs.core.rest(cljs.core.next(arglist__9493));
      return G__9492__delegate(x, y, more)
    };
    G__9492.cljs$lang$arity$variadic = G__9492__delegate;
    return G__9492
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
    var G__9494__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__9494 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9494__delegate.call(this, x, y, more)
    };
    G__9494.cljs$lang$maxFixedArity = 2;
    G__9494.cljs$lang$applyTo = function(arglist__9495) {
      var x = cljs.core.first(arglist__9495);
      var y = cljs.core.first(cljs.core.next(arglist__9495));
      var more = cljs.core.rest(cljs.core.next(arglist__9495));
      return G__9494__delegate(x, y, more)
    };
    G__9494.cljs$lang$arity$variadic = G__9494__delegate;
    return G__9494
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
    var G__9496__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__9496 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9496__delegate.call(this, x, y, more)
    };
    G__9496.cljs$lang$maxFixedArity = 2;
    G__9496.cljs$lang$applyTo = function(arglist__9497) {
      var x = cljs.core.first(arglist__9497);
      var y = cljs.core.first(cljs.core.next(arglist__9497));
      var more = cljs.core.rest(cljs.core.next(arglist__9497));
      return G__9496__delegate(x, y, more)
    };
    G__9496.cljs$lang$arity$variadic = G__9496__delegate;
    return G__9496
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
    var G__9498__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__9498 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9498__delegate.call(this, x, y, more)
    };
    G__9498.cljs$lang$maxFixedArity = 2;
    G__9498.cljs$lang$applyTo = function(arglist__9499) {
      var x = cljs.core.first(arglist__9499);
      var y = cljs.core.first(cljs.core.next(arglist__9499));
      var more = cljs.core.rest(cljs.core.next(arglist__9499));
      return G__9498__delegate(x, y, more)
    };
    G__9498.cljs$lang$arity$variadic = G__9498__delegate;
    return G__9498
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
    var G__9500__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9501 = y;
            var G__9502 = cljs.core.first.call(null, more);
            var G__9503 = cljs.core.next.call(null, more);
            x = G__9501;
            y = G__9502;
            more = G__9503;
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
    var G__9500 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9500__delegate.call(this, x, y, more)
    };
    G__9500.cljs$lang$maxFixedArity = 2;
    G__9500.cljs$lang$applyTo = function(arglist__9504) {
      var x = cljs.core.first(arglist__9504);
      var y = cljs.core.first(cljs.core.next(arglist__9504));
      var more = cljs.core.rest(cljs.core.next(arglist__9504));
      return G__9500__delegate(x, y, more)
    };
    G__9500.cljs$lang$arity$variadic = G__9500__delegate;
    return G__9500
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
    var G__9505__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9506 = y;
            var G__9507 = cljs.core.first.call(null, more);
            var G__9508 = cljs.core.next.call(null, more);
            x = G__9506;
            y = G__9507;
            more = G__9508;
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
    var G__9505 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9505__delegate.call(this, x, y, more)
    };
    G__9505.cljs$lang$maxFixedArity = 2;
    G__9505.cljs$lang$applyTo = function(arglist__9509) {
      var x = cljs.core.first(arglist__9509);
      var y = cljs.core.first(cljs.core.next(arglist__9509));
      var more = cljs.core.rest(cljs.core.next(arglist__9509));
      return G__9505__delegate(x, y, more)
    };
    G__9505.cljs$lang$arity$variadic = G__9505__delegate;
    return G__9505
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
    var G__9510__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9511 = y;
            var G__9512 = cljs.core.first.call(null, more);
            var G__9513 = cljs.core.next.call(null, more);
            x = G__9511;
            y = G__9512;
            more = G__9513;
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
    var G__9510 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9510__delegate.call(this, x, y, more)
    };
    G__9510.cljs$lang$maxFixedArity = 2;
    G__9510.cljs$lang$applyTo = function(arglist__9514) {
      var x = cljs.core.first(arglist__9514);
      var y = cljs.core.first(cljs.core.next(arglist__9514));
      var more = cljs.core.rest(cljs.core.next(arglist__9514));
      return G__9510__delegate(x, y, more)
    };
    G__9510.cljs$lang$arity$variadic = G__9510__delegate;
    return G__9510
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
    var G__9515__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9516 = y;
            var G__9517 = cljs.core.first.call(null, more);
            var G__9518 = cljs.core.next.call(null, more);
            x = G__9516;
            y = G__9517;
            more = G__9518;
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
    var G__9515 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9515__delegate.call(this, x, y, more)
    };
    G__9515.cljs$lang$maxFixedArity = 2;
    G__9515.cljs$lang$applyTo = function(arglist__9519) {
      var x = cljs.core.first(arglist__9519);
      var y = cljs.core.first(cljs.core.next(arglist__9519));
      var more = cljs.core.rest(cljs.core.next(arglist__9519));
      return G__9515__delegate(x, y, more)
    };
    G__9515.cljs$lang$arity$variadic = G__9515__delegate;
    return G__9515
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
    var G__9520__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__9520 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9520__delegate.call(this, x, y, more)
    };
    G__9520.cljs$lang$maxFixedArity = 2;
    G__9520.cljs$lang$applyTo = function(arglist__9521) {
      var x = cljs.core.first(arglist__9521);
      var y = cljs.core.first(cljs.core.next(arglist__9521));
      var more = cljs.core.rest(cljs.core.next(arglist__9521));
      return G__9520__delegate(x, y, more)
    };
    G__9520.cljs$lang$arity$variadic = G__9520__delegate;
    return G__9520
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
    var G__9522__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__9522 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9522__delegate.call(this, x, y, more)
    };
    G__9522.cljs$lang$maxFixedArity = 2;
    G__9522.cljs$lang$applyTo = function(arglist__9523) {
      var x = cljs.core.first(arglist__9523);
      var y = cljs.core.first(cljs.core.next(arglist__9523));
      var more = cljs.core.rest(cljs.core.next(arglist__9523));
      return G__9522__delegate(x, y, more)
    };
    G__9522.cljs$lang$arity$variadic = G__9522__delegate;
    return G__9522
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
  var rem__9524 = n % d;
  return cljs.core.fix.call(null, (n - rem__9524) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__9525 = cljs.core.quot.call(null, n, d);
  return n - d * q__9525
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
  var c__9526 = 0;
  var n__9527 = n;
  while(true) {
    if(n__9527 === 0) {
      return c__9526
    }else {
      var G__9528 = c__9526 + 1;
      var G__9529 = n__9527 & n__9527 - 1;
      c__9526 = G__9528;
      n__9527 = G__9529;
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
    var G__9530__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9531 = y;
            var G__9532 = cljs.core.first.call(null, more);
            var G__9533 = cljs.core.next.call(null, more);
            x = G__9531;
            y = G__9532;
            more = G__9533;
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
    var G__9530 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9530__delegate.call(this, x, y, more)
    };
    G__9530.cljs$lang$maxFixedArity = 2;
    G__9530.cljs$lang$applyTo = function(arglist__9534) {
      var x = cljs.core.first(arglist__9534);
      var y = cljs.core.first(cljs.core.next(arglist__9534));
      var more = cljs.core.rest(cljs.core.next(arglist__9534));
      return G__9530__delegate(x, y, more)
    };
    G__9530.cljs$lang$arity$variadic = G__9530__delegate;
    return G__9530
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
  var n__9535 = n;
  var xs__9536 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____9537 = xs__9536;
      if(cljs.core.truth_(and__3822__auto____9537)) {
        return n__9535 > 0
      }else {
        return and__3822__auto____9537
      }
    }())) {
      var G__9538 = n__9535 - 1;
      var G__9539 = cljs.core.next.call(null, xs__9536);
      n__9535 = G__9538;
      xs__9536 = G__9539;
      continue
    }else {
      return xs__9536
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
    var G__9540__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9541 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__9542 = cljs.core.next.call(null, more);
            sb = G__9541;
            more = G__9542;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__9540 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9540__delegate.call(this, x, ys)
    };
    G__9540.cljs$lang$maxFixedArity = 1;
    G__9540.cljs$lang$applyTo = function(arglist__9543) {
      var x = cljs.core.first(arglist__9543);
      var ys = cljs.core.rest(arglist__9543);
      return G__9540__delegate(x, ys)
    };
    G__9540.cljs$lang$arity$variadic = G__9540__delegate;
    return G__9540
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
    var G__9544__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9545 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__9546 = cljs.core.next.call(null, more);
            sb = G__9545;
            more = G__9546;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__9544 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9544__delegate.call(this, x, ys)
    };
    G__9544.cljs$lang$maxFixedArity = 1;
    G__9544.cljs$lang$applyTo = function(arglist__9547) {
      var x = cljs.core.first(arglist__9547);
      var ys = cljs.core.rest(arglist__9547);
      return G__9544__delegate(x, ys)
    };
    G__9544.cljs$lang$arity$variadic = G__9544__delegate;
    return G__9544
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
    var xs__9548 = cljs.core.seq.call(null, x);
    var ys__9549 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__9548 == null) {
        return ys__9549 == null
      }else {
        if(ys__9549 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__9548), cljs.core.first.call(null, ys__9549))) {
            var G__9550 = cljs.core.next.call(null, xs__9548);
            var G__9551 = cljs.core.next.call(null, ys__9549);
            xs__9548 = G__9550;
            ys__9549 = G__9551;
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
  return cljs.core.reduce.call(null, function(p1__9552_SHARP_, p2__9553_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__9552_SHARP_, cljs.core.hash.call(null, p2__9553_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__9554 = 0;
  var s__9555 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__9555)) {
      var e__9556 = cljs.core.first.call(null, s__9555);
      var G__9557 = (h__9554 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__9556)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__9556)))) % 4503599627370496;
      var G__9558 = cljs.core.next.call(null, s__9555);
      h__9554 = G__9557;
      s__9555 = G__9558;
      continue
    }else {
      return h__9554
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__9559 = 0;
  var s__9560 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__9560)) {
      var e__9561 = cljs.core.first.call(null, s__9560);
      var G__9562 = (h__9559 + cljs.core.hash.call(null, e__9561)) % 4503599627370496;
      var G__9563 = cljs.core.next.call(null, s__9560);
      h__9559 = G__9562;
      s__9560 = G__9563;
      continue
    }else {
      return h__9559
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__9564__9565 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__9564__9565)) {
    var G__9567__9569 = cljs.core.first.call(null, G__9564__9565);
    var vec__9568__9570 = G__9567__9569;
    var key_name__9571 = cljs.core.nth.call(null, vec__9568__9570, 0, null);
    var f__9572 = cljs.core.nth.call(null, vec__9568__9570, 1, null);
    var G__9564__9573 = G__9564__9565;
    var G__9567__9574 = G__9567__9569;
    var G__9564__9575 = G__9564__9573;
    while(true) {
      var vec__9576__9577 = G__9567__9574;
      var key_name__9578 = cljs.core.nth.call(null, vec__9576__9577, 0, null);
      var f__9579 = cljs.core.nth.call(null, vec__9576__9577, 1, null);
      var G__9564__9580 = G__9564__9575;
      var str_name__9581 = cljs.core.name.call(null, key_name__9578);
      obj[str_name__9581] = f__9579;
      var temp__3974__auto____9582 = cljs.core.next.call(null, G__9564__9580);
      if(cljs.core.truth_(temp__3974__auto____9582)) {
        var G__9564__9583 = temp__3974__auto____9582;
        var G__9584 = cljs.core.first.call(null, G__9564__9583);
        var G__9585 = G__9564__9583;
        G__9567__9574 = G__9584;
        G__9564__9575 = G__9585;
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
  var this__9586 = this;
  var h__364__auto____9587 = this__9586.__hash;
  if(h__364__auto____9587 != null) {
    return h__364__auto____9587
  }else {
    var h__364__auto____9588 = cljs.core.hash_coll.call(null, coll);
    this__9586.__hash = h__364__auto____9588;
    return h__364__auto____9588
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9589 = this;
  return new cljs.core.List(this__9589.meta, o, coll, this__9589.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__9590 = this;
  var this$__9591 = this;
  return cljs.core.pr_str.call(null, this$__9591)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9592 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9593 = this;
  return this__9593.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9594 = this;
  return this__9594.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9595 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9596 = this;
  return this__9596.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9597 = this;
  return this__9597.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9598 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9599 = this;
  return new cljs.core.List(meta, this__9599.first, this__9599.rest, this__9599.count, this__9599.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9600 = this;
  return this__9600.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9601 = this;
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
  var this__9602 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9603 = this;
  return new cljs.core.List(this__9603.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__9604 = this;
  var this$__9605 = this;
  return cljs.core.pr_str.call(null, this$__9605)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9606 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9607 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9608 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9609 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9610 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9611 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9612 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9613 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9614 = this;
  return this__9614.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9615 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__9616__9617 = coll;
  if(G__9616__9617 != null) {
    if(function() {
      var or__3824__auto____9618 = G__9616__9617.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____9618) {
        return or__3824__auto____9618
      }else {
        return G__9616__9617.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__9616__9617.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9616__9617)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9616__9617)
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
  list.cljs$lang$applyTo = function(arglist__9619) {
    var items = cljs.core.seq(arglist__9619);
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
  var this__9620 = this;
  var h__364__auto____9621 = this__9620.__hash;
  if(h__364__auto____9621 != null) {
    return h__364__auto____9621
  }else {
    var h__364__auto____9622 = cljs.core.hash_coll.call(null, coll);
    this__9620.__hash = h__364__auto____9622;
    return h__364__auto____9622
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9623 = this;
  return new cljs.core.Cons(null, o, coll, this__9623.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__9624 = this;
  var this$__9625 = this;
  return cljs.core.pr_str.call(null, this$__9625)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9626 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9627 = this;
  return this__9627.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9628 = this;
  if(this__9628.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9628.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9629 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9630 = this;
  return new cljs.core.Cons(meta, this__9630.first, this__9630.rest, this__9630.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9631 = this;
  return this__9631.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9632 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9632.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____9633 = coll == null;
    if(or__3824__auto____9633) {
      return or__3824__auto____9633
    }else {
      var G__9634__9635 = coll;
      if(G__9634__9635 != null) {
        if(function() {
          var or__3824__auto____9636 = G__9634__9635.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9636) {
            return or__3824__auto____9636
          }else {
            return G__9634__9635.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9634__9635.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9634__9635)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9634__9635)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__9637__9638 = x;
  if(G__9637__9638 != null) {
    if(function() {
      var or__3824__auto____9639 = G__9637__9638.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____9639) {
        return or__3824__auto____9639
      }else {
        return G__9637__9638.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__9637__9638.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9637__9638)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9637__9638)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9640 = null;
  var G__9640__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9640__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9640 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9640__2.call(this, string, f);
      case 3:
        return G__9640__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9640
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9641 = null;
  var G__9641__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9641__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9641 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9641__2.call(this, string, k);
      case 3:
        return G__9641__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9641
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9642 = null;
  var G__9642__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9642__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9642 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9642__2.call(this, string, n);
      case 3:
        return G__9642__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9642
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
  var G__9651 = null;
  var G__9651__2 = function(tsym9645, coll) {
    var tsym9645__9647 = this;
    var this$__9648 = tsym9645__9647;
    return cljs.core.get.call(null, coll, this$__9648.toString())
  };
  var G__9651__3 = function(tsym9646, coll, not_found) {
    var tsym9646__9649 = this;
    var this$__9650 = tsym9646__9649;
    return cljs.core.get.call(null, coll, this$__9650.toString(), not_found)
  };
  G__9651 = function(tsym9646, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9651__2.call(this, tsym9646, coll);
      case 3:
        return G__9651__3.call(this, tsym9646, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9651
}();
String.prototype.apply = function(tsym9643, args9644) {
  return tsym9643.call.apply(tsym9643, [tsym9643].concat(cljs.core.aclone.call(null, args9644)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9652 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__9652
  }else {
    lazy_seq.x = x__9652.call(null);
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
  var this__9653 = this;
  var h__364__auto____9654 = this__9653.__hash;
  if(h__364__auto____9654 != null) {
    return h__364__auto____9654
  }else {
    var h__364__auto____9655 = cljs.core.hash_coll.call(null, coll);
    this__9653.__hash = h__364__auto____9655;
    return h__364__auto____9655
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9656 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__9657 = this;
  var this$__9658 = this;
  return cljs.core.pr_str.call(null, this$__9658)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9659 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9660 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9661 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9662 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9663 = this;
  return new cljs.core.LazySeq(meta, this__9663.realized, this__9663.x, this__9663.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9664 = this;
  return this__9664.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9665 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9665.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__9666 = [];
  var s__9667 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__9667))) {
      ary__9666.push(cljs.core.first.call(null, s__9667));
      var G__9668 = cljs.core.next.call(null, s__9667);
      s__9667 = G__9668;
      continue
    }else {
      return ary__9666
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__9669 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__9670 = 0;
  var xs__9671 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__9671)) {
      ret__9669[i__9670] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__9671));
      var G__9672 = i__9670 + 1;
      var G__9673 = cljs.core.next.call(null, xs__9671);
      i__9670 = G__9672;
      xs__9671 = G__9673;
      continue
    }else {
    }
    break
  }
  return ret__9669
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
    var a__9674 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9675 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9676 = 0;
      var s__9677 = s__9675;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9678 = s__9677;
          if(cljs.core.truth_(and__3822__auto____9678)) {
            return i__9676 < size
          }else {
            return and__3822__auto____9678
          }
        }())) {
          a__9674[i__9676] = cljs.core.first.call(null, s__9677);
          var G__9681 = i__9676 + 1;
          var G__9682 = cljs.core.next.call(null, s__9677);
          i__9676 = G__9681;
          s__9677 = G__9682;
          continue
        }else {
          return a__9674
        }
        break
      }
    }else {
      var n__685__auto____9679 = size;
      var i__9680 = 0;
      while(true) {
        if(i__9680 < n__685__auto____9679) {
          a__9674[i__9680] = init_val_or_seq;
          var G__9683 = i__9680 + 1;
          i__9680 = G__9683;
          continue
        }else {
        }
        break
      }
      return a__9674
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
    var a__9684 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9685 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9686 = 0;
      var s__9687 = s__9685;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9688 = s__9687;
          if(cljs.core.truth_(and__3822__auto____9688)) {
            return i__9686 < size
          }else {
            return and__3822__auto____9688
          }
        }())) {
          a__9684[i__9686] = cljs.core.first.call(null, s__9687);
          var G__9691 = i__9686 + 1;
          var G__9692 = cljs.core.next.call(null, s__9687);
          i__9686 = G__9691;
          s__9687 = G__9692;
          continue
        }else {
          return a__9684
        }
        break
      }
    }else {
      var n__685__auto____9689 = size;
      var i__9690 = 0;
      while(true) {
        if(i__9690 < n__685__auto____9689) {
          a__9684[i__9690] = init_val_or_seq;
          var G__9693 = i__9690 + 1;
          i__9690 = G__9693;
          continue
        }else {
        }
        break
      }
      return a__9684
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
    var a__9694 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9695 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9696 = 0;
      var s__9697 = s__9695;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9698 = s__9697;
          if(cljs.core.truth_(and__3822__auto____9698)) {
            return i__9696 < size
          }else {
            return and__3822__auto____9698
          }
        }())) {
          a__9694[i__9696] = cljs.core.first.call(null, s__9697);
          var G__9701 = i__9696 + 1;
          var G__9702 = cljs.core.next.call(null, s__9697);
          i__9696 = G__9701;
          s__9697 = G__9702;
          continue
        }else {
          return a__9694
        }
        break
      }
    }else {
      var n__685__auto____9699 = size;
      var i__9700 = 0;
      while(true) {
        if(i__9700 < n__685__auto____9699) {
          a__9694[i__9700] = init_val_or_seq;
          var G__9703 = i__9700 + 1;
          i__9700 = G__9703;
          continue
        }else {
        }
        break
      }
      return a__9694
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
    var s__9704 = s;
    var i__9705 = n;
    var sum__9706 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9707 = i__9705 > 0;
        if(and__3822__auto____9707) {
          return cljs.core.seq.call(null, s__9704)
        }else {
          return and__3822__auto____9707
        }
      }())) {
        var G__9708 = cljs.core.next.call(null, s__9704);
        var G__9709 = i__9705 - 1;
        var G__9710 = sum__9706 + 1;
        s__9704 = G__9708;
        i__9705 = G__9709;
        sum__9706 = G__9710;
        continue
      }else {
        return sum__9706
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
      var s__9711 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__9711)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9711), concat.call(null, cljs.core.rest.call(null, s__9711), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__9714__delegate = function(x, y, zs) {
      var cat__9713 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9712 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__9712)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9712), cat.call(null, cljs.core.rest.call(null, xys__9712), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__9713.call(null, concat.call(null, x, y), zs)
    };
    var G__9714 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9714__delegate.call(this, x, y, zs)
    };
    G__9714.cljs$lang$maxFixedArity = 2;
    G__9714.cljs$lang$applyTo = function(arglist__9715) {
      var x = cljs.core.first(arglist__9715);
      var y = cljs.core.first(cljs.core.next(arglist__9715));
      var zs = cljs.core.rest(cljs.core.next(arglist__9715));
      return G__9714__delegate(x, y, zs)
    };
    G__9714.cljs$lang$arity$variadic = G__9714__delegate;
    return G__9714
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
    var G__9716__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9716 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9716__delegate.call(this, a, b, c, d, more)
    };
    G__9716.cljs$lang$maxFixedArity = 4;
    G__9716.cljs$lang$applyTo = function(arglist__9717) {
      var a = cljs.core.first(arglist__9717);
      var b = cljs.core.first(cljs.core.next(arglist__9717));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9717)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9717))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9717))));
      return G__9716__delegate(a, b, c, d, more)
    };
    G__9716.cljs$lang$arity$variadic = G__9716__delegate;
    return G__9716
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
  var args__9718 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__9719 = cljs.core._first.call(null, args__9718);
    var args__9720 = cljs.core._rest.call(null, args__9718);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__9719)
      }else {
        return f.call(null, a__9719)
      }
    }else {
      var b__9721 = cljs.core._first.call(null, args__9720);
      var args__9722 = cljs.core._rest.call(null, args__9720);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__9719, b__9721)
        }else {
          return f.call(null, a__9719, b__9721)
        }
      }else {
        var c__9723 = cljs.core._first.call(null, args__9722);
        var args__9724 = cljs.core._rest.call(null, args__9722);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__9719, b__9721, c__9723)
          }else {
            return f.call(null, a__9719, b__9721, c__9723)
          }
        }else {
          var d__9725 = cljs.core._first.call(null, args__9724);
          var args__9726 = cljs.core._rest.call(null, args__9724);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__9719, b__9721, c__9723, d__9725)
            }else {
              return f.call(null, a__9719, b__9721, c__9723, d__9725)
            }
          }else {
            var e__9727 = cljs.core._first.call(null, args__9726);
            var args__9728 = cljs.core._rest.call(null, args__9726);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__9719, b__9721, c__9723, d__9725, e__9727)
              }else {
                return f.call(null, a__9719, b__9721, c__9723, d__9725, e__9727)
              }
            }else {
              var f__9729 = cljs.core._first.call(null, args__9728);
              var args__9730 = cljs.core._rest.call(null, args__9728);
              if(argc === 6) {
                if(f__9729.cljs$lang$arity$6) {
                  return f__9729.cljs$lang$arity$6(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729)
                }else {
                  return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729)
                }
              }else {
                var g__9731 = cljs.core._first.call(null, args__9730);
                var args__9732 = cljs.core._rest.call(null, args__9730);
                if(argc === 7) {
                  if(f__9729.cljs$lang$arity$7) {
                    return f__9729.cljs$lang$arity$7(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731)
                  }else {
                    return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731)
                  }
                }else {
                  var h__9733 = cljs.core._first.call(null, args__9732);
                  var args__9734 = cljs.core._rest.call(null, args__9732);
                  if(argc === 8) {
                    if(f__9729.cljs$lang$arity$8) {
                      return f__9729.cljs$lang$arity$8(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733)
                    }else {
                      return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733)
                    }
                  }else {
                    var i__9735 = cljs.core._first.call(null, args__9734);
                    var args__9736 = cljs.core._rest.call(null, args__9734);
                    if(argc === 9) {
                      if(f__9729.cljs$lang$arity$9) {
                        return f__9729.cljs$lang$arity$9(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735)
                      }else {
                        return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735)
                      }
                    }else {
                      var j__9737 = cljs.core._first.call(null, args__9736);
                      var args__9738 = cljs.core._rest.call(null, args__9736);
                      if(argc === 10) {
                        if(f__9729.cljs$lang$arity$10) {
                          return f__9729.cljs$lang$arity$10(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737)
                        }else {
                          return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737)
                        }
                      }else {
                        var k__9739 = cljs.core._first.call(null, args__9738);
                        var args__9740 = cljs.core._rest.call(null, args__9738);
                        if(argc === 11) {
                          if(f__9729.cljs$lang$arity$11) {
                            return f__9729.cljs$lang$arity$11(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739)
                          }else {
                            return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739)
                          }
                        }else {
                          var l__9741 = cljs.core._first.call(null, args__9740);
                          var args__9742 = cljs.core._rest.call(null, args__9740);
                          if(argc === 12) {
                            if(f__9729.cljs$lang$arity$12) {
                              return f__9729.cljs$lang$arity$12(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741)
                            }else {
                              return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741)
                            }
                          }else {
                            var m__9743 = cljs.core._first.call(null, args__9742);
                            var args__9744 = cljs.core._rest.call(null, args__9742);
                            if(argc === 13) {
                              if(f__9729.cljs$lang$arity$13) {
                                return f__9729.cljs$lang$arity$13(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743)
                              }else {
                                return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743)
                              }
                            }else {
                              var n__9745 = cljs.core._first.call(null, args__9744);
                              var args__9746 = cljs.core._rest.call(null, args__9744);
                              if(argc === 14) {
                                if(f__9729.cljs$lang$arity$14) {
                                  return f__9729.cljs$lang$arity$14(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745)
                                }else {
                                  return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745)
                                }
                              }else {
                                var o__9747 = cljs.core._first.call(null, args__9746);
                                var args__9748 = cljs.core._rest.call(null, args__9746);
                                if(argc === 15) {
                                  if(f__9729.cljs$lang$arity$15) {
                                    return f__9729.cljs$lang$arity$15(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747)
                                  }else {
                                    return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747)
                                  }
                                }else {
                                  var p__9749 = cljs.core._first.call(null, args__9748);
                                  var args__9750 = cljs.core._rest.call(null, args__9748);
                                  if(argc === 16) {
                                    if(f__9729.cljs$lang$arity$16) {
                                      return f__9729.cljs$lang$arity$16(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749)
                                    }else {
                                      return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749)
                                    }
                                  }else {
                                    var q__9751 = cljs.core._first.call(null, args__9750);
                                    var args__9752 = cljs.core._rest.call(null, args__9750);
                                    if(argc === 17) {
                                      if(f__9729.cljs$lang$arity$17) {
                                        return f__9729.cljs$lang$arity$17(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751)
                                      }else {
                                        return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751)
                                      }
                                    }else {
                                      var r__9753 = cljs.core._first.call(null, args__9752);
                                      var args__9754 = cljs.core._rest.call(null, args__9752);
                                      if(argc === 18) {
                                        if(f__9729.cljs$lang$arity$18) {
                                          return f__9729.cljs$lang$arity$18(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753)
                                        }else {
                                          return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753)
                                        }
                                      }else {
                                        var s__9755 = cljs.core._first.call(null, args__9754);
                                        var args__9756 = cljs.core._rest.call(null, args__9754);
                                        if(argc === 19) {
                                          if(f__9729.cljs$lang$arity$19) {
                                            return f__9729.cljs$lang$arity$19(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753, s__9755)
                                          }else {
                                            return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753, s__9755)
                                          }
                                        }else {
                                          var t__9757 = cljs.core._first.call(null, args__9756);
                                          var args__9758 = cljs.core._rest.call(null, args__9756);
                                          if(argc === 20) {
                                            if(f__9729.cljs$lang$arity$20) {
                                              return f__9729.cljs$lang$arity$20(a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753, s__9755, t__9757)
                                            }else {
                                              return f__9729.call(null, a__9719, b__9721, c__9723, d__9725, e__9727, f__9729, g__9731, h__9733, i__9735, j__9737, k__9739, l__9741, m__9743, n__9745, o__9747, p__9749, q__9751, r__9753, s__9755, t__9757)
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
    var fixed_arity__9759 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9760 = cljs.core.bounded_count.call(null, args, fixed_arity__9759 + 1);
      if(bc__9760 <= fixed_arity__9759) {
        return cljs.core.apply_to.call(null, f, bc__9760, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__9761 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__9762 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9763 = cljs.core.bounded_count.call(null, arglist__9761, fixed_arity__9762 + 1);
      if(bc__9763 <= fixed_arity__9762) {
        return cljs.core.apply_to.call(null, f, bc__9763, arglist__9761)
      }else {
        return f.cljs$lang$applyTo(arglist__9761)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9761))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__9764 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__9765 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9766 = cljs.core.bounded_count.call(null, arglist__9764, fixed_arity__9765 + 1);
      if(bc__9766 <= fixed_arity__9765) {
        return cljs.core.apply_to.call(null, f, bc__9766, arglist__9764)
      }else {
        return f.cljs$lang$applyTo(arglist__9764)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9764))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__9767 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9768 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9769 = cljs.core.bounded_count.call(null, arglist__9767, fixed_arity__9768 + 1);
      if(bc__9769 <= fixed_arity__9768) {
        return cljs.core.apply_to.call(null, f, bc__9769, arglist__9767)
      }else {
        return f.cljs$lang$applyTo(arglist__9767)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9767))
    }
  };
  var apply__6 = function() {
    var G__9773__delegate = function(f, a, b, c, d, args) {
      var arglist__9770 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9771 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__9772 = cljs.core.bounded_count.call(null, arglist__9770, fixed_arity__9771 + 1);
        if(bc__9772 <= fixed_arity__9771) {
          return cljs.core.apply_to.call(null, f, bc__9772, arglist__9770)
        }else {
          return f.cljs$lang$applyTo(arglist__9770)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9770))
      }
    };
    var G__9773 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9773__delegate.call(this, f, a, b, c, d, args)
    };
    G__9773.cljs$lang$maxFixedArity = 5;
    G__9773.cljs$lang$applyTo = function(arglist__9774) {
      var f = cljs.core.first(arglist__9774);
      var a = cljs.core.first(cljs.core.next(arglist__9774));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9774)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9774))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9774)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9774)))));
      return G__9773__delegate(f, a, b, c, d, args)
    };
    G__9773.cljs$lang$arity$variadic = G__9773__delegate;
    return G__9773
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
  vary_meta.cljs$lang$applyTo = function(arglist__9775) {
    var obj = cljs.core.first(arglist__9775);
    var f = cljs.core.first(cljs.core.next(arglist__9775));
    var args = cljs.core.rest(cljs.core.next(arglist__9775));
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
    var G__9776__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9776 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9776__delegate.call(this, x, y, more)
    };
    G__9776.cljs$lang$maxFixedArity = 2;
    G__9776.cljs$lang$applyTo = function(arglist__9777) {
      var x = cljs.core.first(arglist__9777);
      var y = cljs.core.first(cljs.core.next(arglist__9777));
      var more = cljs.core.rest(cljs.core.next(arglist__9777));
      return G__9776__delegate(x, y, more)
    };
    G__9776.cljs$lang$arity$variadic = G__9776__delegate;
    return G__9776
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
        var G__9778 = pred;
        var G__9779 = cljs.core.next.call(null, coll);
        pred = G__9778;
        coll = G__9779;
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
      var or__3824__auto____9780 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____9780)) {
        return or__3824__auto____9780
      }else {
        var G__9781 = pred;
        var G__9782 = cljs.core.next.call(null, coll);
        pred = G__9781;
        coll = G__9782;
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
    var G__9783 = null;
    var G__9783__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9783__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9783__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9783__3 = function() {
      var G__9784__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9784 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9784__delegate.call(this, x, y, zs)
      };
      G__9784.cljs$lang$maxFixedArity = 2;
      G__9784.cljs$lang$applyTo = function(arglist__9785) {
        var x = cljs.core.first(arglist__9785);
        var y = cljs.core.first(cljs.core.next(arglist__9785));
        var zs = cljs.core.rest(cljs.core.next(arglist__9785));
        return G__9784__delegate(x, y, zs)
      };
      G__9784.cljs$lang$arity$variadic = G__9784__delegate;
      return G__9784
    }();
    G__9783 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9783__0.call(this);
        case 1:
          return G__9783__1.call(this, x);
        case 2:
          return G__9783__2.call(this, x, y);
        default:
          return G__9783__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9783.cljs$lang$maxFixedArity = 2;
    G__9783.cljs$lang$applyTo = G__9783__3.cljs$lang$applyTo;
    return G__9783
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9786__delegate = function(args) {
      return x
    };
    var G__9786 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9786__delegate.call(this, args)
    };
    G__9786.cljs$lang$maxFixedArity = 0;
    G__9786.cljs$lang$applyTo = function(arglist__9787) {
      var args = cljs.core.seq(arglist__9787);
      return G__9786__delegate(args)
    };
    G__9786.cljs$lang$arity$variadic = G__9786__delegate;
    return G__9786
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
      var G__9791 = null;
      var G__9791__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__9791__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9791__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9791__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9791__4 = function() {
        var G__9792__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9792 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9792__delegate.call(this, x, y, z, args)
        };
        G__9792.cljs$lang$maxFixedArity = 3;
        G__9792.cljs$lang$applyTo = function(arglist__9793) {
          var x = cljs.core.first(arglist__9793);
          var y = cljs.core.first(cljs.core.next(arglist__9793));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9793)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9793)));
          return G__9792__delegate(x, y, z, args)
        };
        G__9792.cljs$lang$arity$variadic = G__9792__delegate;
        return G__9792
      }();
      G__9791 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9791__0.call(this);
          case 1:
            return G__9791__1.call(this, x);
          case 2:
            return G__9791__2.call(this, x, y);
          case 3:
            return G__9791__3.call(this, x, y, z);
          default:
            return G__9791__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9791.cljs$lang$maxFixedArity = 3;
      G__9791.cljs$lang$applyTo = G__9791__4.cljs$lang$applyTo;
      return G__9791
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__9794 = null;
      var G__9794__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9794__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9794__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9794__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9794__4 = function() {
        var G__9795__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9795 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9795__delegate.call(this, x, y, z, args)
        };
        G__9795.cljs$lang$maxFixedArity = 3;
        G__9795.cljs$lang$applyTo = function(arglist__9796) {
          var x = cljs.core.first(arglist__9796);
          var y = cljs.core.first(cljs.core.next(arglist__9796));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9796)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9796)));
          return G__9795__delegate(x, y, z, args)
        };
        G__9795.cljs$lang$arity$variadic = G__9795__delegate;
        return G__9795
      }();
      G__9794 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9794__0.call(this);
          case 1:
            return G__9794__1.call(this, x);
          case 2:
            return G__9794__2.call(this, x, y);
          case 3:
            return G__9794__3.call(this, x, y, z);
          default:
            return G__9794__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9794.cljs$lang$maxFixedArity = 3;
      G__9794.cljs$lang$applyTo = G__9794__4.cljs$lang$applyTo;
      return G__9794
    }()
  };
  var comp__4 = function() {
    var G__9797__delegate = function(f1, f2, f3, fs) {
      var fs__9788 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9798__delegate = function(args) {
          var ret__9789 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9788), args);
          var fs__9790 = cljs.core.next.call(null, fs__9788);
          while(true) {
            if(cljs.core.truth_(fs__9790)) {
              var G__9799 = cljs.core.first.call(null, fs__9790).call(null, ret__9789);
              var G__9800 = cljs.core.next.call(null, fs__9790);
              ret__9789 = G__9799;
              fs__9790 = G__9800;
              continue
            }else {
              return ret__9789
            }
            break
          }
        };
        var G__9798 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9798__delegate.call(this, args)
        };
        G__9798.cljs$lang$maxFixedArity = 0;
        G__9798.cljs$lang$applyTo = function(arglist__9801) {
          var args = cljs.core.seq(arglist__9801);
          return G__9798__delegate(args)
        };
        G__9798.cljs$lang$arity$variadic = G__9798__delegate;
        return G__9798
      }()
    };
    var G__9797 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9797__delegate.call(this, f1, f2, f3, fs)
    };
    G__9797.cljs$lang$maxFixedArity = 3;
    G__9797.cljs$lang$applyTo = function(arglist__9802) {
      var f1 = cljs.core.first(arglist__9802);
      var f2 = cljs.core.first(cljs.core.next(arglist__9802));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9802)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9802)));
      return G__9797__delegate(f1, f2, f3, fs)
    };
    G__9797.cljs$lang$arity$variadic = G__9797__delegate;
    return G__9797
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
      var G__9803__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9803 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9803__delegate.call(this, args)
      };
      G__9803.cljs$lang$maxFixedArity = 0;
      G__9803.cljs$lang$applyTo = function(arglist__9804) {
        var args = cljs.core.seq(arglist__9804);
        return G__9803__delegate(args)
      };
      G__9803.cljs$lang$arity$variadic = G__9803__delegate;
      return G__9803
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__9805__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9805 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9805__delegate.call(this, args)
      };
      G__9805.cljs$lang$maxFixedArity = 0;
      G__9805.cljs$lang$applyTo = function(arglist__9806) {
        var args = cljs.core.seq(arglist__9806);
        return G__9805__delegate(args)
      };
      G__9805.cljs$lang$arity$variadic = G__9805__delegate;
      return G__9805
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9807__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9807 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9807__delegate.call(this, args)
      };
      G__9807.cljs$lang$maxFixedArity = 0;
      G__9807.cljs$lang$applyTo = function(arglist__9808) {
        var args = cljs.core.seq(arglist__9808);
        return G__9807__delegate(args)
      };
      G__9807.cljs$lang$arity$variadic = G__9807__delegate;
      return G__9807
    }()
  };
  var partial__5 = function() {
    var G__9809__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9810__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9810 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9810__delegate.call(this, args)
        };
        G__9810.cljs$lang$maxFixedArity = 0;
        G__9810.cljs$lang$applyTo = function(arglist__9811) {
          var args = cljs.core.seq(arglist__9811);
          return G__9810__delegate(args)
        };
        G__9810.cljs$lang$arity$variadic = G__9810__delegate;
        return G__9810
      }()
    };
    var G__9809 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9809__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9809.cljs$lang$maxFixedArity = 4;
    G__9809.cljs$lang$applyTo = function(arglist__9812) {
      var f = cljs.core.first(arglist__9812);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9812));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9812)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9812))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9812))));
      return G__9809__delegate(f, arg1, arg2, arg3, more)
    };
    G__9809.cljs$lang$arity$variadic = G__9809__delegate;
    return G__9809
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
      var G__9813 = null;
      var G__9813__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__9813__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__9813__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__9813__4 = function() {
        var G__9814__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__9814 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9814__delegate.call(this, a, b, c, ds)
        };
        G__9814.cljs$lang$maxFixedArity = 3;
        G__9814.cljs$lang$applyTo = function(arglist__9815) {
          var a = cljs.core.first(arglist__9815);
          var b = cljs.core.first(cljs.core.next(arglist__9815));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9815)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9815)));
          return G__9814__delegate(a, b, c, ds)
        };
        G__9814.cljs$lang$arity$variadic = G__9814__delegate;
        return G__9814
      }();
      G__9813 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__9813__1.call(this, a);
          case 2:
            return G__9813__2.call(this, a, b);
          case 3:
            return G__9813__3.call(this, a, b, c);
          default:
            return G__9813__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9813.cljs$lang$maxFixedArity = 3;
      G__9813.cljs$lang$applyTo = G__9813__4.cljs$lang$applyTo;
      return G__9813
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__9816 = null;
      var G__9816__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9816__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__9816__4 = function() {
        var G__9817__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__9817 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9817__delegate.call(this, a, b, c, ds)
        };
        G__9817.cljs$lang$maxFixedArity = 3;
        G__9817.cljs$lang$applyTo = function(arglist__9818) {
          var a = cljs.core.first(arglist__9818);
          var b = cljs.core.first(cljs.core.next(arglist__9818));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9818)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9818)));
          return G__9817__delegate(a, b, c, ds)
        };
        G__9817.cljs$lang$arity$variadic = G__9817__delegate;
        return G__9817
      }();
      G__9816 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9816__2.call(this, a, b);
          case 3:
            return G__9816__3.call(this, a, b, c);
          default:
            return G__9816__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9816.cljs$lang$maxFixedArity = 3;
      G__9816.cljs$lang$applyTo = G__9816__4.cljs$lang$applyTo;
      return G__9816
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__9819 = null;
      var G__9819__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9819__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__9819__4 = function() {
        var G__9820__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__9820 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9820__delegate.call(this, a, b, c, ds)
        };
        G__9820.cljs$lang$maxFixedArity = 3;
        G__9820.cljs$lang$applyTo = function(arglist__9821) {
          var a = cljs.core.first(arglist__9821);
          var b = cljs.core.first(cljs.core.next(arglist__9821));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9821)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9821)));
          return G__9820__delegate(a, b, c, ds)
        };
        G__9820.cljs$lang$arity$variadic = G__9820__delegate;
        return G__9820
      }();
      G__9819 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9819__2.call(this, a, b);
          case 3:
            return G__9819__3.call(this, a, b, c);
          default:
            return G__9819__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9819.cljs$lang$maxFixedArity = 3;
      G__9819.cljs$lang$applyTo = G__9819__4.cljs$lang$applyTo;
      return G__9819
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
  var mapi__9824 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9822 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9822)) {
        var s__9823 = temp__3974__auto____9822;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9823)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__9823)))
      }else {
        return null
      }
    })
  };
  return mapi__9824.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9825 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9825)) {
      var s__9826 = temp__3974__auto____9825;
      var x__9827 = f.call(null, cljs.core.first.call(null, s__9826));
      if(x__9827 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__9826))
      }else {
        return cljs.core.cons.call(null, x__9827, keep.call(null, f, cljs.core.rest.call(null, s__9826)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9837 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9834 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9834)) {
        var s__9835 = temp__3974__auto____9834;
        var x__9836 = f.call(null, idx, cljs.core.first.call(null, s__9835));
        if(x__9836 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9835))
        }else {
          return cljs.core.cons.call(null, x__9836, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9835)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__9837.call(null, 0, coll)
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
          var and__3822__auto____9844 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9844)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____9844
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9845 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9845)) {
            var and__3822__auto____9846 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9846)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____9846
            }
          }else {
            return and__3822__auto____9845
          }
        }())
      };
      var ep1__4 = function() {
        var G__9882__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9847 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9847)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____9847
            }
          }())
        };
        var G__9882 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9882__delegate.call(this, x, y, z, args)
        };
        G__9882.cljs$lang$maxFixedArity = 3;
        G__9882.cljs$lang$applyTo = function(arglist__9883) {
          var x = cljs.core.first(arglist__9883);
          var y = cljs.core.first(cljs.core.next(arglist__9883));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9883)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9883)));
          return G__9882__delegate(x, y, z, args)
        };
        G__9882.cljs$lang$arity$variadic = G__9882__delegate;
        return G__9882
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
          var and__3822__auto____9848 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9848)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____9848
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9849 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9849)) {
            var and__3822__auto____9850 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9850)) {
              var and__3822__auto____9851 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9851)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____9851
              }
            }else {
              return and__3822__auto____9850
            }
          }else {
            return and__3822__auto____9849
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9852 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9852)) {
            var and__3822__auto____9853 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9853)) {
              var and__3822__auto____9854 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____9854)) {
                var and__3822__auto____9855 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____9855)) {
                  var and__3822__auto____9856 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9856)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____9856
                  }
                }else {
                  return and__3822__auto____9855
                }
              }else {
                return and__3822__auto____9854
              }
            }else {
              return and__3822__auto____9853
            }
          }else {
            return and__3822__auto____9852
          }
        }())
      };
      var ep2__4 = function() {
        var G__9884__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9857 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9857)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9828_SHARP_) {
                var and__3822__auto____9858 = p1.call(null, p1__9828_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9858)) {
                  return p2.call(null, p1__9828_SHARP_)
                }else {
                  return and__3822__auto____9858
                }
              }, args)
            }else {
              return and__3822__auto____9857
            }
          }())
        };
        var G__9884 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9884__delegate.call(this, x, y, z, args)
        };
        G__9884.cljs$lang$maxFixedArity = 3;
        G__9884.cljs$lang$applyTo = function(arglist__9885) {
          var x = cljs.core.first(arglist__9885);
          var y = cljs.core.first(cljs.core.next(arglist__9885));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9885)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9885)));
          return G__9884__delegate(x, y, z, args)
        };
        G__9884.cljs$lang$arity$variadic = G__9884__delegate;
        return G__9884
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
          var and__3822__auto____9859 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9859)) {
            var and__3822__auto____9860 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9860)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____9860
            }
          }else {
            return and__3822__auto____9859
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9861 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9861)) {
            var and__3822__auto____9862 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9862)) {
              var and__3822__auto____9863 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9863)) {
                var and__3822__auto____9864 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9864)) {
                  var and__3822__auto____9865 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9865)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____9865
                  }
                }else {
                  return and__3822__auto____9864
                }
              }else {
                return and__3822__auto____9863
              }
            }else {
              return and__3822__auto____9862
            }
          }else {
            return and__3822__auto____9861
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9866 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9866)) {
            var and__3822__auto____9867 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9867)) {
              var and__3822__auto____9868 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9868)) {
                var and__3822__auto____9869 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9869)) {
                  var and__3822__auto____9870 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9870)) {
                    var and__3822__auto____9871 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____9871)) {
                      var and__3822__auto____9872 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____9872)) {
                        var and__3822__auto____9873 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____9873)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____9873
                        }
                      }else {
                        return and__3822__auto____9872
                      }
                    }else {
                      return and__3822__auto____9871
                    }
                  }else {
                    return and__3822__auto____9870
                  }
                }else {
                  return and__3822__auto____9869
                }
              }else {
                return and__3822__auto____9868
              }
            }else {
              return and__3822__auto____9867
            }
          }else {
            return and__3822__auto____9866
          }
        }())
      };
      var ep3__4 = function() {
        var G__9886__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9874 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9874)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9829_SHARP_) {
                var and__3822__auto____9875 = p1.call(null, p1__9829_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9875)) {
                  var and__3822__auto____9876 = p2.call(null, p1__9829_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____9876)) {
                    return p3.call(null, p1__9829_SHARP_)
                  }else {
                    return and__3822__auto____9876
                  }
                }else {
                  return and__3822__auto____9875
                }
              }, args)
            }else {
              return and__3822__auto____9874
            }
          }())
        };
        var G__9886 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9886__delegate.call(this, x, y, z, args)
        };
        G__9886.cljs$lang$maxFixedArity = 3;
        G__9886.cljs$lang$applyTo = function(arglist__9887) {
          var x = cljs.core.first(arglist__9887);
          var y = cljs.core.first(cljs.core.next(arglist__9887));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9887)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9887)));
          return G__9886__delegate(x, y, z, args)
        };
        G__9886.cljs$lang$arity$variadic = G__9886__delegate;
        return G__9886
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
    var G__9888__delegate = function(p1, p2, p3, ps) {
      var ps__9877 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9830_SHARP_) {
            return p1__9830_SHARP_.call(null, x)
          }, ps__9877)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9831_SHARP_) {
            var and__3822__auto____9878 = p1__9831_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9878)) {
              return p1__9831_SHARP_.call(null, y)
            }else {
              return and__3822__auto____9878
            }
          }, ps__9877)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9832_SHARP_) {
            var and__3822__auto____9879 = p1__9832_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9879)) {
              var and__3822__auto____9880 = p1__9832_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____9880)) {
                return p1__9832_SHARP_.call(null, z)
              }else {
                return and__3822__auto____9880
              }
            }else {
              return and__3822__auto____9879
            }
          }, ps__9877)
        };
        var epn__4 = function() {
          var G__9889__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____9881 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____9881)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9833_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9833_SHARP_, args)
                }, ps__9877)
              }else {
                return and__3822__auto____9881
              }
            }())
          };
          var G__9889 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9889__delegate.call(this, x, y, z, args)
          };
          G__9889.cljs$lang$maxFixedArity = 3;
          G__9889.cljs$lang$applyTo = function(arglist__9890) {
            var x = cljs.core.first(arglist__9890);
            var y = cljs.core.first(cljs.core.next(arglist__9890));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9890)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9890)));
            return G__9889__delegate(x, y, z, args)
          };
          G__9889.cljs$lang$arity$variadic = G__9889__delegate;
          return G__9889
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
    var G__9888 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9888__delegate.call(this, p1, p2, p3, ps)
    };
    G__9888.cljs$lang$maxFixedArity = 3;
    G__9888.cljs$lang$applyTo = function(arglist__9891) {
      var p1 = cljs.core.first(arglist__9891);
      var p2 = cljs.core.first(cljs.core.next(arglist__9891));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9891)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9891)));
      return G__9888__delegate(p1, p2, p3, ps)
    };
    G__9888.cljs$lang$arity$variadic = G__9888__delegate;
    return G__9888
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
        var or__3824__auto____9893 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9893)) {
          return or__3824__auto____9893
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____9894 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9894)) {
          return or__3824__auto____9894
        }else {
          var or__3824__auto____9895 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9895)) {
            return or__3824__auto____9895
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__9931__delegate = function(x, y, z, args) {
          var or__3824__auto____9896 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9896)) {
            return or__3824__auto____9896
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9931 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9931__delegate.call(this, x, y, z, args)
        };
        G__9931.cljs$lang$maxFixedArity = 3;
        G__9931.cljs$lang$applyTo = function(arglist__9932) {
          var x = cljs.core.first(arglist__9932);
          var y = cljs.core.first(cljs.core.next(arglist__9932));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9932)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9932)));
          return G__9931__delegate(x, y, z, args)
        };
        G__9931.cljs$lang$arity$variadic = G__9931__delegate;
        return G__9931
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
        var or__3824__auto____9897 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9897)) {
          return or__3824__auto____9897
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____9898 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9898)) {
          return or__3824__auto____9898
        }else {
          var or__3824__auto____9899 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9899)) {
            return or__3824__auto____9899
          }else {
            var or__3824__auto____9900 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9900)) {
              return or__3824__auto____9900
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____9901 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9901)) {
          return or__3824__auto____9901
        }else {
          var or__3824__auto____9902 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9902)) {
            return or__3824__auto____9902
          }else {
            var or__3824__auto____9903 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____9903)) {
              return or__3824__auto____9903
            }else {
              var or__3824__auto____9904 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____9904)) {
                return or__3824__auto____9904
              }else {
                var or__3824__auto____9905 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9905)) {
                  return or__3824__auto____9905
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__9933__delegate = function(x, y, z, args) {
          var or__3824__auto____9906 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9906)) {
            return or__3824__auto____9906
          }else {
            return cljs.core.some.call(null, function(p1__9838_SHARP_) {
              var or__3824__auto____9907 = p1.call(null, p1__9838_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9907)) {
                return or__3824__auto____9907
              }else {
                return p2.call(null, p1__9838_SHARP_)
              }
            }, args)
          }
        };
        var G__9933 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9933__delegate.call(this, x, y, z, args)
        };
        G__9933.cljs$lang$maxFixedArity = 3;
        G__9933.cljs$lang$applyTo = function(arglist__9934) {
          var x = cljs.core.first(arglist__9934);
          var y = cljs.core.first(cljs.core.next(arglist__9934));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9934)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9934)));
          return G__9933__delegate(x, y, z, args)
        };
        G__9933.cljs$lang$arity$variadic = G__9933__delegate;
        return G__9933
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
        var or__3824__auto____9908 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9908)) {
          return or__3824__auto____9908
        }else {
          var or__3824__auto____9909 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9909)) {
            return or__3824__auto____9909
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____9910 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9910)) {
          return or__3824__auto____9910
        }else {
          var or__3824__auto____9911 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9911)) {
            return or__3824__auto____9911
          }else {
            var or__3824__auto____9912 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9912)) {
              return or__3824__auto____9912
            }else {
              var or__3824__auto____9913 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9913)) {
                return or__3824__auto____9913
              }else {
                var or__3824__auto____9914 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9914)) {
                  return or__3824__auto____9914
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____9915 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9915)) {
          return or__3824__auto____9915
        }else {
          var or__3824__auto____9916 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9916)) {
            return or__3824__auto____9916
          }else {
            var or__3824__auto____9917 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9917)) {
              return or__3824__auto____9917
            }else {
              var or__3824__auto____9918 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9918)) {
                return or__3824__auto____9918
              }else {
                var or__3824__auto____9919 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9919)) {
                  return or__3824__auto____9919
                }else {
                  var or__3824__auto____9920 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____9920)) {
                    return or__3824__auto____9920
                  }else {
                    var or__3824__auto____9921 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____9921)) {
                      return or__3824__auto____9921
                    }else {
                      var or__3824__auto____9922 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____9922)) {
                        return or__3824__auto____9922
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
        var G__9935__delegate = function(x, y, z, args) {
          var or__3824__auto____9923 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9923)) {
            return or__3824__auto____9923
          }else {
            return cljs.core.some.call(null, function(p1__9839_SHARP_) {
              var or__3824__auto____9924 = p1.call(null, p1__9839_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9924)) {
                return or__3824__auto____9924
              }else {
                var or__3824__auto____9925 = p2.call(null, p1__9839_SHARP_);
                if(cljs.core.truth_(or__3824__auto____9925)) {
                  return or__3824__auto____9925
                }else {
                  return p3.call(null, p1__9839_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9935 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9935__delegate.call(this, x, y, z, args)
        };
        G__9935.cljs$lang$maxFixedArity = 3;
        G__9935.cljs$lang$applyTo = function(arglist__9936) {
          var x = cljs.core.first(arglist__9936);
          var y = cljs.core.first(cljs.core.next(arglist__9936));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9936)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9936)));
          return G__9935__delegate(x, y, z, args)
        };
        G__9935.cljs$lang$arity$variadic = G__9935__delegate;
        return G__9935
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
    var G__9937__delegate = function(p1, p2, p3, ps) {
      var ps__9926 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__9840_SHARP_) {
            return p1__9840_SHARP_.call(null, x)
          }, ps__9926)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9841_SHARP_) {
            var or__3824__auto____9927 = p1__9841_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9927)) {
              return or__3824__auto____9927
            }else {
              return p1__9841_SHARP_.call(null, y)
            }
          }, ps__9926)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9842_SHARP_) {
            var or__3824__auto____9928 = p1__9842_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9928)) {
              return or__3824__auto____9928
            }else {
              var or__3824__auto____9929 = p1__9842_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9929)) {
                return or__3824__auto____9929
              }else {
                return p1__9842_SHARP_.call(null, z)
              }
            }
          }, ps__9926)
        };
        var spn__4 = function() {
          var G__9938__delegate = function(x, y, z, args) {
            var or__3824__auto____9930 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____9930)) {
              return or__3824__auto____9930
            }else {
              return cljs.core.some.call(null, function(p1__9843_SHARP_) {
                return cljs.core.some.call(null, p1__9843_SHARP_, args)
              }, ps__9926)
            }
          };
          var G__9938 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9938__delegate.call(this, x, y, z, args)
          };
          G__9938.cljs$lang$maxFixedArity = 3;
          G__9938.cljs$lang$applyTo = function(arglist__9939) {
            var x = cljs.core.first(arglist__9939);
            var y = cljs.core.first(cljs.core.next(arglist__9939));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9939)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9939)));
            return G__9938__delegate(x, y, z, args)
          };
          G__9938.cljs$lang$arity$variadic = G__9938__delegate;
          return G__9938
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
    var G__9937 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9937__delegate.call(this, p1, p2, p3, ps)
    };
    G__9937.cljs$lang$maxFixedArity = 3;
    G__9937.cljs$lang$applyTo = function(arglist__9940) {
      var p1 = cljs.core.first(arglist__9940);
      var p2 = cljs.core.first(cljs.core.next(arglist__9940));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9940)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9940)));
      return G__9937__delegate(p1, p2, p3, ps)
    };
    G__9937.cljs$lang$arity$variadic = G__9937__delegate;
    return G__9937
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
      var temp__3974__auto____9941 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9941)) {
        var s__9942 = temp__3974__auto____9941;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9942)), map.call(null, f, cljs.core.rest.call(null, s__9942)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9943 = cljs.core.seq.call(null, c1);
      var s2__9944 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9945 = s1__9943;
        if(cljs.core.truth_(and__3822__auto____9945)) {
          return s2__9944
        }else {
          return and__3822__auto____9945
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9943), cljs.core.first.call(null, s2__9944)), map.call(null, f, cljs.core.rest.call(null, s1__9943), cljs.core.rest.call(null, s2__9944)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9946 = cljs.core.seq.call(null, c1);
      var s2__9947 = cljs.core.seq.call(null, c2);
      var s3__9948 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9949 = s1__9946;
        if(cljs.core.truth_(and__3822__auto____9949)) {
          var and__3822__auto____9950 = s2__9947;
          if(cljs.core.truth_(and__3822__auto____9950)) {
            return s3__9948
          }else {
            return and__3822__auto____9950
          }
        }else {
          return and__3822__auto____9949
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9946), cljs.core.first.call(null, s2__9947), cljs.core.first.call(null, s3__9948)), map.call(null, f, cljs.core.rest.call(null, s1__9946), cljs.core.rest.call(null, s2__9947), cljs.core.rest.call(null, s3__9948)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__9953__delegate = function(f, c1, c2, c3, colls) {
      var step__9952 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9951 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9951)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9951), step.call(null, map.call(null, cljs.core.rest, ss__9951)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__9892_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9892_SHARP_)
      }, step__9952.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9953 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9953__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9953.cljs$lang$maxFixedArity = 4;
    G__9953.cljs$lang$applyTo = function(arglist__9954) {
      var f = cljs.core.first(arglist__9954);
      var c1 = cljs.core.first(cljs.core.next(arglist__9954));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9954)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9954))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9954))));
      return G__9953__delegate(f, c1, c2, c3, colls)
    };
    G__9953.cljs$lang$arity$variadic = G__9953__delegate;
    return G__9953
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
      var temp__3974__auto____9955 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9955)) {
        var s__9956 = temp__3974__auto____9955;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9956), take.call(null, n - 1, cljs.core.rest.call(null, s__9956)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__9959 = function(n, coll) {
    while(true) {
      var s__9957 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9958 = n > 0;
        if(and__3822__auto____9958) {
          return s__9957
        }else {
          return and__3822__auto____9958
        }
      }())) {
        var G__9960 = n - 1;
        var G__9961 = cljs.core.rest.call(null, s__9957);
        n = G__9960;
        coll = G__9961;
        continue
      }else {
        return s__9957
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9959.call(null, n, coll)
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
  var s__9962 = cljs.core.seq.call(null, coll);
  var lead__9963 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__9963)) {
      var G__9964 = cljs.core.next.call(null, s__9962);
      var G__9965 = cljs.core.next.call(null, lead__9963);
      s__9962 = G__9964;
      lead__9963 = G__9965;
      continue
    }else {
      return s__9962
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9968 = function(pred, coll) {
    while(true) {
      var s__9966 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9967 = s__9966;
        if(cljs.core.truth_(and__3822__auto____9967)) {
          return pred.call(null, cljs.core.first.call(null, s__9966))
        }else {
          return and__3822__auto____9967
        }
      }())) {
        var G__9969 = pred;
        var G__9970 = cljs.core.rest.call(null, s__9966);
        pred = G__9969;
        coll = G__9970;
        continue
      }else {
        return s__9966
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9968.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9971 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9971)) {
      var s__9972 = temp__3974__auto____9971;
      return cljs.core.concat.call(null, s__9972, cycle.call(null, s__9972))
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
      var s1__9973 = cljs.core.seq.call(null, c1);
      var s2__9974 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9975 = s1__9973;
        if(cljs.core.truth_(and__3822__auto____9975)) {
          return s2__9974
        }else {
          return and__3822__auto____9975
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9973), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9974), interleave.call(null, cljs.core.rest.call(null, s1__9973), cljs.core.rest.call(null, s2__9974))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__9977__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9976 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9976)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9976), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9976)))
        }else {
          return null
        }
      })
    };
    var G__9977 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9977__delegate.call(this, c1, c2, colls)
    };
    G__9977.cljs$lang$maxFixedArity = 2;
    G__9977.cljs$lang$applyTo = function(arglist__9978) {
      var c1 = cljs.core.first(arglist__9978);
      var c2 = cljs.core.first(cljs.core.next(arglist__9978));
      var colls = cljs.core.rest(cljs.core.next(arglist__9978));
      return G__9977__delegate(c1, c2, colls)
    };
    G__9977.cljs$lang$arity$variadic = G__9977__delegate;
    return G__9977
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
  var cat__9981 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9979 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____9979)) {
        var coll__9980 = temp__3971__auto____9979;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9980), cat.call(null, cljs.core.rest.call(null, coll__9980), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__9981.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9982__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9982 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9982__delegate.call(this, f, coll, colls)
    };
    G__9982.cljs$lang$maxFixedArity = 2;
    G__9982.cljs$lang$applyTo = function(arglist__9983) {
      var f = cljs.core.first(arglist__9983);
      var coll = cljs.core.first(cljs.core.next(arglist__9983));
      var colls = cljs.core.rest(cljs.core.next(arglist__9983));
      return G__9982__delegate(f, coll, colls)
    };
    G__9982.cljs$lang$arity$variadic = G__9982__delegate;
    return G__9982
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
    var temp__3974__auto____9984 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9984)) {
      var s__9985 = temp__3974__auto____9984;
      var f__9986 = cljs.core.first.call(null, s__9985);
      var r__9987 = cljs.core.rest.call(null, s__9985);
      if(cljs.core.truth_(pred.call(null, f__9986))) {
        return cljs.core.cons.call(null, f__9986, filter.call(null, pred, r__9987))
      }else {
        return filter.call(null, pred, r__9987)
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
  var walk__9989 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__9989.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9988_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__9988_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9990__9991 = to;
    if(G__9990__9991 != null) {
      if(function() {
        var or__3824__auto____9992 = G__9990__9991.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____9992) {
          return or__3824__auto____9992
        }else {
          return G__9990__9991.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9990__9991.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9990__9991)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9990__9991)
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
    var G__9993__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9993 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9993__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9993.cljs$lang$maxFixedArity = 4;
    G__9993.cljs$lang$applyTo = function(arglist__9994) {
      var f = cljs.core.first(arglist__9994);
      var c1 = cljs.core.first(cljs.core.next(arglist__9994));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9994)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9994))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9994))));
      return G__9993__delegate(f, c1, c2, c3, colls)
    };
    G__9993.cljs$lang$arity$variadic = G__9993__delegate;
    return G__9993
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
      var temp__3974__auto____9995 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9995)) {
        var s__9996 = temp__3974__auto____9995;
        var p__9997 = cljs.core.take.call(null, n, s__9996);
        if(n === cljs.core.count.call(null, p__9997)) {
          return cljs.core.cons.call(null, p__9997, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9996)))
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
      var temp__3974__auto____9998 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9998)) {
        var s__9999 = temp__3974__auto____9998;
        var p__10000 = cljs.core.take.call(null, n, s__9999);
        if(n === cljs.core.count.call(null, p__10000)) {
          return cljs.core.cons.call(null, p__10000, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9999)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__10000, pad)))
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
    var sentinel__10001 = cljs.core.lookup_sentinel;
    var m__10002 = m;
    var ks__10003 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__10003)) {
        var m__10004 = cljs.core.get.call(null, m__10002, cljs.core.first.call(null, ks__10003), sentinel__10001);
        if(sentinel__10001 === m__10004) {
          return not_found
        }else {
          var G__10005 = sentinel__10001;
          var G__10006 = m__10004;
          var G__10007 = cljs.core.next.call(null, ks__10003);
          sentinel__10001 = G__10005;
          m__10002 = G__10006;
          ks__10003 = G__10007;
          continue
        }
      }else {
        return m__10002
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
cljs.core.assoc_in = function assoc_in(m, p__10008, v) {
  var vec__10009__10010 = p__10008;
  var k__10011 = cljs.core.nth.call(null, vec__10009__10010, 0, null);
  var ks__10012 = cljs.core.nthnext.call(null, vec__10009__10010, 1);
  if(cljs.core.truth_(ks__10012)) {
    return cljs.core.assoc.call(null, m, k__10011, assoc_in.call(null, cljs.core.get.call(null, m, k__10011), ks__10012, v))
  }else {
    return cljs.core.assoc.call(null, m, k__10011, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__10013, f, args) {
    var vec__10014__10015 = p__10013;
    var k__10016 = cljs.core.nth.call(null, vec__10014__10015, 0, null);
    var ks__10017 = cljs.core.nthnext.call(null, vec__10014__10015, 1);
    if(cljs.core.truth_(ks__10017)) {
      return cljs.core.assoc.call(null, m, k__10016, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__10016), ks__10017, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__10016, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__10016), args))
    }
  };
  var update_in = function(m, p__10013, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__10013, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__10018) {
    var m = cljs.core.first(arglist__10018);
    var p__10013 = cljs.core.first(cljs.core.next(arglist__10018));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10018)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10018)));
    return update_in__delegate(m, p__10013, f, args)
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
  var this__10023 = this;
  var h__364__auto____10024 = this__10023.__hash;
  if(h__364__auto____10024 != null) {
    return h__364__auto____10024
  }else {
    var h__364__auto____10025 = cljs.core.hash_coll.call(null, coll);
    this__10023.__hash = h__364__auto____10025;
    return h__364__auto____10025
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10026 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10027 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10028 = this;
  var new_array__10029 = cljs.core.aclone.call(null, this__10028.array);
  new_array__10029[k] = v;
  return new cljs.core.Vector(this__10028.meta, new_array__10029, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__10058 = null;
  var G__10058__2 = function(tsym10021, k) {
    var this__10030 = this;
    var tsym10021__10031 = this;
    var coll__10032 = tsym10021__10031;
    return cljs.core._lookup.call(null, coll__10032, k)
  };
  var G__10058__3 = function(tsym10022, k, not_found) {
    var this__10033 = this;
    var tsym10022__10034 = this;
    var coll__10035 = tsym10022__10034;
    return cljs.core._lookup.call(null, coll__10035, k, not_found)
  };
  G__10058 = function(tsym10022, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10058__2.call(this, tsym10022, k);
      case 3:
        return G__10058__3.call(this, tsym10022, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10058
}();
cljs.core.Vector.prototype.apply = function(tsym10019, args10020) {
  return tsym10019.call.apply(tsym10019, [tsym10019].concat(cljs.core.aclone.call(null, args10020)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10036 = this;
  var new_array__10037 = cljs.core.aclone.call(null, this__10036.array);
  new_array__10037.push(o);
  return new cljs.core.Vector(this__10036.meta, new_array__10037, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__10038 = this;
  var this$__10039 = this;
  return cljs.core.pr_str.call(null, this$__10039)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10040 = this;
  return cljs.core.ci_reduce.call(null, this__10040.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10041 = this;
  return cljs.core.ci_reduce.call(null, this__10041.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10042 = this;
  if(this__10042.array.length > 0) {
    var vector_seq__10043 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__10042.array.length) {
          return cljs.core.cons.call(null, this__10042.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__10043.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10044 = this;
  return this__10044.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10045 = this;
  var count__10046 = this__10045.array.length;
  if(count__10046 > 0) {
    return this__10045.array[count__10046 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10047 = this;
  if(this__10047.array.length > 0) {
    var new_array__10048 = cljs.core.aclone.call(null, this__10047.array);
    new_array__10048.pop();
    return new cljs.core.Vector(this__10047.meta, new_array__10048, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10049 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10050 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10051 = this;
  return new cljs.core.Vector(meta, this__10051.array, this__10051.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10052 = this;
  return this__10052.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10054 = this;
  if(function() {
    var and__3822__auto____10055 = 0 <= n;
    if(and__3822__auto____10055) {
      return n < this__10054.array.length
    }else {
      return and__3822__auto____10055
    }
  }()) {
    return this__10054.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10056 = this;
  if(function() {
    var and__3822__auto____10057 = 0 <= n;
    if(and__3822__auto____10057) {
      return n < this__10056.array.length
    }else {
      return and__3822__auto____10057
    }
  }()) {
    return this__10056.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10053 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10053.meta)
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
  var cnt__10059 = pv.cnt;
  if(cnt__10059 < 32) {
    return 0
  }else {
    return cnt__10059 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__10060 = level;
  var ret__10061 = node;
  while(true) {
    if(ll__10060 === 0) {
      return ret__10061
    }else {
      var embed__10062 = ret__10061;
      var r__10063 = cljs.core.pv_fresh_node.call(null, edit);
      var ___10064 = cljs.core.pv_aset.call(null, r__10063, 0, embed__10062);
      var G__10065 = ll__10060 - 5;
      var G__10066 = r__10063;
      ll__10060 = G__10065;
      ret__10061 = G__10066;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__10067 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__10068 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__10067, subidx__10068, tailnode);
    return ret__10067
  }else {
    var temp__3971__auto____10069 = cljs.core.pv_aget.call(null, parent, subidx__10068);
    if(cljs.core.truth_(temp__3971__auto____10069)) {
      var child__10070 = temp__3971__auto____10069;
      var node_to_insert__10071 = push_tail.call(null, pv, level - 5, child__10070, tailnode);
      cljs.core.pv_aset.call(null, ret__10067, subidx__10068, node_to_insert__10071);
      return ret__10067
    }else {
      var node_to_insert__10072 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__10067, subidx__10068, node_to_insert__10072);
      return ret__10067
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____10073 = 0 <= i;
    if(and__3822__auto____10073) {
      return i < pv.cnt
    }else {
      return and__3822__auto____10073
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__10074 = pv.root;
      var level__10075 = pv.shift;
      while(true) {
        if(level__10075 > 0) {
          var G__10076 = cljs.core.pv_aget.call(null, node__10074, i >>> level__10075 & 31);
          var G__10077 = level__10075 - 5;
          node__10074 = G__10076;
          level__10075 = G__10077;
          continue
        }else {
          return node__10074.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__10078 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__10078, i & 31, val);
    return ret__10078
  }else {
    var subidx__10079 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__10078, subidx__10079, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10079), i, val));
    return ret__10078
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__10080 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10081 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10080));
    if(function() {
      var and__3822__auto____10082 = new_child__10081 == null;
      if(and__3822__auto____10082) {
        return subidx__10080 === 0
      }else {
        return and__3822__auto____10082
      }
    }()) {
      return null
    }else {
      var ret__10083 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__10083, subidx__10080, new_child__10081);
      return ret__10083
    }
  }else {
    if(subidx__10080 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__10084 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__10084, subidx__10080, null);
        return ret__10084
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
  var c__10085 = cljs.core._count.call(null, v);
  if(c__10085 > 0) {
    if(void 0 === cljs.core.t10086) {
      cljs.core.t10086 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t10086.cljs$lang$type = true;
      cljs.core.t10086.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t10086")
      };
      cljs.core.t10086.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t10086.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__10087 = this;
        return vseq
      };
      cljs.core.t10086.prototype.cljs$core$ISeq$ = true;
      cljs.core.t10086.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__10088 = this;
        return cljs.core._nth.call(null, this__10088.v, this__10088.offset)
      };
      cljs.core.t10086.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__10089 = this;
        var offset__10090 = this__10089.offset + 1;
        if(offset__10090 < this__10089.c) {
          return this__10089.vector_seq.call(null, this__10089.v, offset__10090)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t10086.prototype.cljs$core$ASeq$ = true;
      cljs.core.t10086.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t10086.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__10091 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t10086.prototype.cljs$core$ISequential$ = true;
      cljs.core.t10086.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t10086.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__10092 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t10086.prototype.cljs$core$IMeta$ = true;
      cljs.core.t10086.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__10093 = this;
        return this__10093.__meta__389__auto__
      };
      cljs.core.t10086.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t10086.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__10094 = this;
        return new cljs.core.t10086(this__10094.c, this__10094.offset, this__10094.v, this__10094.vector_seq, __meta__389__auto__)
      };
      cljs.core.t10086
    }else {
    }
    return new cljs.core.t10086(c__10085, offset, v, vector_seq, null)
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
  var this__10099 = this;
  return new cljs.core.TransientVector(this__10099.cnt, this__10099.shift, cljs.core.tv_editable_root.call(null, this__10099.root), cljs.core.tv_editable_tail.call(null, this__10099.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10100 = this;
  var h__364__auto____10101 = this__10100.__hash;
  if(h__364__auto____10101 != null) {
    return h__364__auto____10101
  }else {
    var h__364__auto____10102 = cljs.core.hash_coll.call(null, coll);
    this__10100.__hash = h__364__auto____10102;
    return h__364__auto____10102
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10103 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10104 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10105 = this;
  if(function() {
    var and__3822__auto____10106 = 0 <= k;
    if(and__3822__auto____10106) {
      return k < this__10105.cnt
    }else {
      return and__3822__auto____10106
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__10107 = cljs.core.aclone.call(null, this__10105.tail);
      new_tail__10107[k & 31] = v;
      return new cljs.core.PersistentVector(this__10105.meta, this__10105.cnt, this__10105.shift, this__10105.root, new_tail__10107, null)
    }else {
      return new cljs.core.PersistentVector(this__10105.meta, this__10105.cnt, this__10105.shift, cljs.core.do_assoc.call(null, coll, this__10105.shift, this__10105.root, k, v), this__10105.tail, null)
    }
  }else {
    if(k === this__10105.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__10105.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__10152 = null;
  var G__10152__2 = function(tsym10097, k) {
    var this__10108 = this;
    var tsym10097__10109 = this;
    var coll__10110 = tsym10097__10109;
    return cljs.core._lookup.call(null, coll__10110, k)
  };
  var G__10152__3 = function(tsym10098, k, not_found) {
    var this__10111 = this;
    var tsym10098__10112 = this;
    var coll__10113 = tsym10098__10112;
    return cljs.core._lookup.call(null, coll__10113, k, not_found)
  };
  G__10152 = function(tsym10098, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10152__2.call(this, tsym10098, k);
      case 3:
        return G__10152__3.call(this, tsym10098, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10152
}();
cljs.core.PersistentVector.prototype.apply = function(tsym10095, args10096) {
  return tsym10095.call.apply(tsym10095, [tsym10095].concat(cljs.core.aclone.call(null, args10096)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__10114 = this;
  var step_init__10115 = [0, init];
  var i__10116 = 0;
  while(true) {
    if(i__10116 < this__10114.cnt) {
      var arr__10117 = cljs.core.array_for.call(null, v, i__10116);
      var len__10118 = arr__10117.length;
      var init__10122 = function() {
        var j__10119 = 0;
        var init__10120 = step_init__10115[1];
        while(true) {
          if(j__10119 < len__10118) {
            var init__10121 = f.call(null, init__10120, j__10119 + i__10116, arr__10117[j__10119]);
            if(cljs.core.reduced_QMARK_.call(null, init__10121)) {
              return init__10121
            }else {
              var G__10153 = j__10119 + 1;
              var G__10154 = init__10121;
              j__10119 = G__10153;
              init__10120 = G__10154;
              continue
            }
          }else {
            step_init__10115[0] = len__10118;
            step_init__10115[1] = init__10120;
            return init__10120
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10122)) {
        return cljs.core.deref.call(null, init__10122)
      }else {
        var G__10155 = i__10116 + step_init__10115[0];
        i__10116 = G__10155;
        continue
      }
    }else {
      return step_init__10115[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10123 = this;
  if(this__10123.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__10124 = cljs.core.aclone.call(null, this__10123.tail);
    new_tail__10124.push(o);
    return new cljs.core.PersistentVector(this__10123.meta, this__10123.cnt + 1, this__10123.shift, this__10123.root, new_tail__10124, null)
  }else {
    var root_overflow_QMARK___10125 = this__10123.cnt >>> 5 > 1 << this__10123.shift;
    var new_shift__10126 = root_overflow_QMARK___10125 ? this__10123.shift + 5 : this__10123.shift;
    var new_root__10128 = root_overflow_QMARK___10125 ? function() {
      var n_r__10127 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__10127, 0, this__10123.root);
      cljs.core.pv_aset.call(null, n_r__10127, 1, cljs.core.new_path.call(null, null, this__10123.shift, new cljs.core.VectorNode(null, this__10123.tail)));
      return n_r__10127
    }() : cljs.core.push_tail.call(null, coll, this__10123.shift, this__10123.root, new cljs.core.VectorNode(null, this__10123.tail));
    return new cljs.core.PersistentVector(this__10123.meta, this__10123.cnt + 1, new_shift__10126, new_root__10128, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__10129 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__10130 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__10131 = this;
  var this$__10132 = this;
  return cljs.core.pr_str.call(null, this$__10132)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10133 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10134 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10135 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10136 = this;
  return this__10136.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10137 = this;
  if(this__10137.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__10137.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10138 = this;
  if(this__10138.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__10138.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10138.meta)
    }else {
      if(1 < this__10138.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__10138.meta, this__10138.cnt - 1, this__10138.shift, this__10138.root, this__10138.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__10139 = cljs.core.array_for.call(null, coll, this__10138.cnt - 2);
          var nr__10140 = cljs.core.pop_tail.call(null, coll, this__10138.shift, this__10138.root);
          var new_root__10141 = nr__10140 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__10140;
          var cnt_1__10142 = this__10138.cnt - 1;
          if(function() {
            var and__3822__auto____10143 = 5 < this__10138.shift;
            if(and__3822__auto____10143) {
              return cljs.core.pv_aget.call(null, new_root__10141, 1) == null
            }else {
              return and__3822__auto____10143
            }
          }()) {
            return new cljs.core.PersistentVector(this__10138.meta, cnt_1__10142, this__10138.shift - 5, cljs.core.pv_aget.call(null, new_root__10141, 0), new_tail__10139, null)
          }else {
            return new cljs.core.PersistentVector(this__10138.meta, cnt_1__10142, this__10138.shift, new_root__10141, new_tail__10139, null)
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
  var this__10145 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10146 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10147 = this;
  return new cljs.core.PersistentVector(meta, this__10147.cnt, this__10147.shift, this__10147.root, this__10147.tail, this__10147.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10148 = this;
  return this__10148.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10149 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10150 = this;
  if(function() {
    var and__3822__auto____10151 = 0 <= n;
    if(and__3822__auto____10151) {
      return n < this__10150.cnt
    }else {
      return and__3822__auto____10151
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10144 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10144.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__10156 = cljs.core.seq.call(null, xs);
  var out__10157 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__10156)) {
      var G__10158 = cljs.core.next.call(null, xs__10156);
      var G__10159 = cljs.core.conj_BANG_.call(null, out__10157, cljs.core.first.call(null, xs__10156));
      xs__10156 = G__10158;
      out__10157 = G__10159;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10157)
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
  vector.cljs$lang$applyTo = function(arglist__10160) {
    var args = cljs.core.seq(arglist__10160);
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
  var this__10165 = this;
  var h__364__auto____10166 = this__10165.__hash;
  if(h__364__auto____10166 != null) {
    return h__364__auto____10166
  }else {
    var h__364__auto____10167 = cljs.core.hash_coll.call(null, coll);
    this__10165.__hash = h__364__auto____10167;
    return h__364__auto____10167
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10168 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10169 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__10170 = this;
  var v_pos__10171 = this__10170.start + key;
  return new cljs.core.Subvec(this__10170.meta, cljs.core._assoc.call(null, this__10170.v, v_pos__10171, val), this__10170.start, this__10170.end > v_pos__10171 + 1 ? this__10170.end : v_pos__10171 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__10195 = null;
  var G__10195__2 = function(tsym10163, k) {
    var this__10172 = this;
    var tsym10163__10173 = this;
    var coll__10174 = tsym10163__10173;
    return cljs.core._lookup.call(null, coll__10174, k)
  };
  var G__10195__3 = function(tsym10164, k, not_found) {
    var this__10175 = this;
    var tsym10164__10176 = this;
    var coll__10177 = tsym10164__10176;
    return cljs.core._lookup.call(null, coll__10177, k, not_found)
  };
  G__10195 = function(tsym10164, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10195__2.call(this, tsym10164, k);
      case 3:
        return G__10195__3.call(this, tsym10164, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10195
}();
cljs.core.Subvec.prototype.apply = function(tsym10161, args10162) {
  return tsym10161.call.apply(tsym10161, [tsym10161].concat(cljs.core.aclone.call(null, args10162)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10178 = this;
  return new cljs.core.Subvec(this__10178.meta, cljs.core._assoc_n.call(null, this__10178.v, this__10178.end, o), this__10178.start, this__10178.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__10179 = this;
  var this$__10180 = this;
  return cljs.core.pr_str.call(null, this$__10180)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10181 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10182 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10183 = this;
  var subvec_seq__10184 = function subvec_seq(i) {
    if(i === this__10183.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__10183.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__10184.call(null, this__10183.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10185 = this;
  return this__10185.end - this__10185.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10186 = this;
  return cljs.core._nth.call(null, this__10186.v, this__10186.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10187 = this;
  if(this__10187.start === this__10187.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__10187.meta, this__10187.v, this__10187.start, this__10187.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10188 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10189 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10190 = this;
  return new cljs.core.Subvec(meta, this__10190.v, this__10190.start, this__10190.end, this__10190.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10191 = this;
  return this__10191.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10193 = this;
  return cljs.core._nth.call(null, this__10193.v, this__10193.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10194 = this;
  return cljs.core._nth.call(null, this__10194.v, this__10194.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10192 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10192.meta)
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
  var ret__10196 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__10196, 0, tl.length);
  return ret__10196
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__10197 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__10198 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__10197, subidx__10198, level === 5 ? tail_node : function() {
    var child__10199 = cljs.core.pv_aget.call(null, ret__10197, subidx__10198);
    if(child__10199 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__10199, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__10197
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__10200 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__10201 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10202 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__10200, subidx__10201));
    if(function() {
      var and__3822__auto____10203 = new_child__10202 == null;
      if(and__3822__auto____10203) {
        return subidx__10201 === 0
      }else {
        return and__3822__auto____10203
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__10200, subidx__10201, new_child__10202);
      return node__10200
    }
  }else {
    if(subidx__10201 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__10200, subidx__10201, null);
        return node__10200
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____10204 = 0 <= i;
    if(and__3822__auto____10204) {
      return i < tv.cnt
    }else {
      return and__3822__auto____10204
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__10205 = tv.root;
      var node__10206 = root__10205;
      var level__10207 = tv.shift;
      while(true) {
        if(level__10207 > 0) {
          var G__10208 = cljs.core.tv_ensure_editable.call(null, root__10205.edit, cljs.core.pv_aget.call(null, node__10206, i >>> level__10207 & 31));
          var G__10209 = level__10207 - 5;
          node__10206 = G__10208;
          level__10207 = G__10209;
          continue
        }else {
          return node__10206.arr
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
  var G__10247 = null;
  var G__10247__2 = function(tsym10212, k) {
    var this__10214 = this;
    var tsym10212__10215 = this;
    var coll__10216 = tsym10212__10215;
    return cljs.core._lookup.call(null, coll__10216, k)
  };
  var G__10247__3 = function(tsym10213, k, not_found) {
    var this__10217 = this;
    var tsym10213__10218 = this;
    var coll__10219 = tsym10213__10218;
    return cljs.core._lookup.call(null, coll__10219, k, not_found)
  };
  G__10247 = function(tsym10213, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10247__2.call(this, tsym10213, k);
      case 3:
        return G__10247__3.call(this, tsym10213, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10247
}();
cljs.core.TransientVector.prototype.apply = function(tsym10210, args10211) {
  return tsym10210.call.apply(tsym10210, [tsym10210].concat(cljs.core.aclone.call(null, args10211)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10220 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10221 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10222 = this;
  if(cljs.core.truth_(this__10222.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10223 = this;
  if(function() {
    var and__3822__auto____10224 = 0 <= n;
    if(and__3822__auto____10224) {
      return n < this__10223.cnt
    }else {
      return and__3822__auto____10224
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10225 = this;
  if(cljs.core.truth_(this__10225.root.edit)) {
    return this__10225.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__10226 = this;
  if(cljs.core.truth_(this__10226.root.edit)) {
    if(function() {
      var and__3822__auto____10227 = 0 <= n;
      if(and__3822__auto____10227) {
        return n < this__10226.cnt
      }else {
        return and__3822__auto____10227
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__10226.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__10230 = function go(level, node) {
          var node__10228 = cljs.core.tv_ensure_editable.call(null, this__10226.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__10228, n & 31, val);
            return node__10228
          }else {
            var subidx__10229 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__10228, subidx__10229, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__10228, subidx__10229)));
            return node__10228
          }
        }.call(null, this__10226.shift, this__10226.root);
        this__10226.root = new_root__10230;
        return tcoll
      }
    }else {
      if(n === this__10226.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__10226.cnt)].join(""));
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
  var this__10231 = this;
  if(cljs.core.truth_(this__10231.root.edit)) {
    if(this__10231.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__10231.cnt) {
        this__10231.cnt = 0;
        return tcoll
      }else {
        if((this__10231.cnt - 1 & 31) > 0) {
          this__10231.cnt = this__10231.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__10232 = cljs.core.editable_array_for.call(null, tcoll, this__10231.cnt - 2);
            var new_root__10234 = function() {
              var nr__10233 = cljs.core.tv_pop_tail.call(null, tcoll, this__10231.shift, this__10231.root);
              if(nr__10233 != null) {
                return nr__10233
              }else {
                return new cljs.core.VectorNode(this__10231.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____10235 = 5 < this__10231.shift;
              if(and__3822__auto____10235) {
                return cljs.core.pv_aget.call(null, new_root__10234, 1) == null
              }else {
                return and__3822__auto____10235
              }
            }()) {
              var new_root__10236 = cljs.core.tv_ensure_editable.call(null, this__10231.root.edit, cljs.core.pv_aget.call(null, new_root__10234, 0));
              this__10231.root = new_root__10236;
              this__10231.shift = this__10231.shift - 5;
              this__10231.cnt = this__10231.cnt - 1;
              this__10231.tail = new_tail__10232;
              return tcoll
            }else {
              this__10231.root = new_root__10234;
              this__10231.cnt = this__10231.cnt - 1;
              this__10231.tail = new_tail__10232;
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
  var this__10237 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10238 = this;
  if(cljs.core.truth_(this__10238.root.edit)) {
    if(this__10238.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__10238.tail[this__10238.cnt & 31] = o;
      this__10238.cnt = this__10238.cnt + 1;
      return tcoll
    }else {
      var tail_node__10239 = new cljs.core.VectorNode(this__10238.root.edit, this__10238.tail);
      var new_tail__10240 = cljs.core.make_array.call(null, 32);
      new_tail__10240[0] = o;
      this__10238.tail = new_tail__10240;
      if(this__10238.cnt >>> 5 > 1 << this__10238.shift) {
        var new_root_array__10241 = cljs.core.make_array.call(null, 32);
        var new_shift__10242 = this__10238.shift + 5;
        new_root_array__10241[0] = this__10238.root;
        new_root_array__10241[1] = cljs.core.new_path.call(null, this__10238.root.edit, this__10238.shift, tail_node__10239);
        this__10238.root = new cljs.core.VectorNode(this__10238.root.edit, new_root_array__10241);
        this__10238.shift = new_shift__10242;
        this__10238.cnt = this__10238.cnt + 1;
        return tcoll
      }else {
        var new_root__10243 = cljs.core.tv_push_tail.call(null, tcoll, this__10238.shift, this__10238.root, tail_node__10239);
        this__10238.root = new_root__10243;
        this__10238.cnt = this__10238.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10244 = this;
  if(cljs.core.truth_(this__10244.root.edit)) {
    this__10244.root.edit = null;
    var len__10245 = this__10244.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__10246 = cljs.core.make_array.call(null, len__10245);
    cljs.core.array_copy.call(null, this__10244.tail, 0, trimmed_tail__10246, 0, len__10245);
    return new cljs.core.PersistentVector(null, this__10244.cnt, this__10244.shift, this__10244.root, trimmed_tail__10246, null)
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
  var this__10248 = this;
  var h__364__auto____10249 = this__10248.__hash;
  if(h__364__auto____10249 != null) {
    return h__364__auto____10249
  }else {
    var h__364__auto____10250 = cljs.core.hash_coll.call(null, coll);
    this__10248.__hash = h__364__auto____10250;
    return h__364__auto____10250
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10251 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__10252 = this;
  var this$__10253 = this;
  return cljs.core.pr_str.call(null, this$__10253)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10254 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10255 = this;
  return cljs.core._first.call(null, this__10255.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10256 = this;
  var temp__3971__auto____10257 = cljs.core.next.call(null, this__10256.front);
  if(cljs.core.truth_(temp__3971__auto____10257)) {
    var f1__10258 = temp__3971__auto____10257;
    return new cljs.core.PersistentQueueSeq(this__10256.meta, f1__10258, this__10256.rear, null)
  }else {
    if(this__10256.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__10256.meta, this__10256.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10259 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10260 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__10260.front, this__10260.rear, this__10260.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10261 = this;
  return this__10261.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10262 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10262.meta)
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
  var this__10263 = this;
  var h__364__auto____10264 = this__10263.__hash;
  if(h__364__auto____10264 != null) {
    return h__364__auto____10264
  }else {
    var h__364__auto____10265 = cljs.core.hash_coll.call(null, coll);
    this__10263.__hash = h__364__auto____10265;
    return h__364__auto____10265
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10266 = this;
  if(cljs.core.truth_(this__10266.front)) {
    return new cljs.core.PersistentQueue(this__10266.meta, this__10266.count + 1, this__10266.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____10267 = this__10266.rear;
      if(cljs.core.truth_(or__3824__auto____10267)) {
        return or__3824__auto____10267
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__10266.meta, this__10266.count + 1, cljs.core.conj.call(null, this__10266.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__10268 = this;
  var this$__10269 = this;
  return cljs.core.pr_str.call(null, this$__10269)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10270 = this;
  var rear__10271 = cljs.core.seq.call(null, this__10270.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____10272 = this__10270.front;
    if(cljs.core.truth_(or__3824__auto____10272)) {
      return or__3824__auto____10272
    }else {
      return rear__10271
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__10270.front, cljs.core.seq.call(null, rear__10271), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10273 = this;
  return this__10273.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10274 = this;
  return cljs.core._first.call(null, this__10274.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10275 = this;
  if(cljs.core.truth_(this__10275.front)) {
    var temp__3971__auto____10276 = cljs.core.next.call(null, this__10275.front);
    if(cljs.core.truth_(temp__3971__auto____10276)) {
      var f1__10277 = temp__3971__auto____10276;
      return new cljs.core.PersistentQueue(this__10275.meta, this__10275.count - 1, f1__10277, this__10275.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__10275.meta, this__10275.count - 1, cljs.core.seq.call(null, this__10275.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10278 = this;
  return cljs.core.first.call(null, this__10278.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10279 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10280 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10281 = this;
  return new cljs.core.PersistentQueue(meta, this__10281.count, this__10281.front, this__10281.rear, this__10281.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10282 = this;
  return this__10282.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10283 = this;
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
  var this__10284 = this;
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
  var len__10285 = array.length;
  var i__10286 = 0;
  while(true) {
    if(i__10286 < len__10285) {
      if(cljs.core._EQ_.call(null, k, array[i__10286])) {
        return i__10286
      }else {
        var G__10287 = i__10286 + incr;
        i__10286 = G__10287;
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
      var and__3822__auto____10288 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____10288)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____10288
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
  var a__10289 = cljs.core.hash.call(null, a);
  var b__10290 = cljs.core.hash.call(null, b);
  if(a__10289 < b__10290) {
    return-1
  }else {
    if(a__10289 > b__10290) {
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
  var ks__10292 = m.keys;
  var len__10293 = ks__10292.length;
  var so__10294 = m.strobj;
  var out__10295 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__10296 = 0;
  var out__10297 = cljs.core.transient$.call(null, out__10295);
  while(true) {
    if(i__10296 < len__10293) {
      var k__10298 = ks__10292[i__10296];
      var G__10299 = i__10296 + 1;
      var G__10300 = cljs.core.assoc_BANG_.call(null, out__10297, k__10298, so__10294[k__10298]);
      i__10296 = G__10299;
      out__10297 = G__10300;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__10297, k, v))
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
  var this__10305 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10306 = this;
  var h__364__auto____10307 = this__10306.__hash;
  if(h__364__auto____10307 != null) {
    return h__364__auto____10307
  }else {
    var h__364__auto____10308 = cljs.core.hash_imap.call(null, coll);
    this__10306.__hash = h__364__auto____10308;
    return h__364__auto____10308
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10309 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10310 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__10310.strobj, this__10310.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10311 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___10312 = this__10311.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___10312)) {
      var new_strobj__10313 = goog.object.clone.call(null, this__10311.strobj);
      new_strobj__10313[k] = v;
      return new cljs.core.ObjMap(this__10311.meta, this__10311.keys, new_strobj__10313, this__10311.update_count + 1, null)
    }else {
      if(this__10311.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__10314 = goog.object.clone.call(null, this__10311.strobj);
        var new_keys__10315 = cljs.core.aclone.call(null, this__10311.keys);
        new_strobj__10314[k] = v;
        new_keys__10315.push(k);
        return new cljs.core.ObjMap(this__10311.meta, new_keys__10315, new_strobj__10314, this__10311.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10316 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__10316.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__10336 = null;
  var G__10336__2 = function(tsym10303, k) {
    var this__10317 = this;
    var tsym10303__10318 = this;
    var coll__10319 = tsym10303__10318;
    return cljs.core._lookup.call(null, coll__10319, k)
  };
  var G__10336__3 = function(tsym10304, k, not_found) {
    var this__10320 = this;
    var tsym10304__10321 = this;
    var coll__10322 = tsym10304__10321;
    return cljs.core._lookup.call(null, coll__10322, k, not_found)
  };
  G__10336 = function(tsym10304, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10336__2.call(this, tsym10304, k);
      case 3:
        return G__10336__3.call(this, tsym10304, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10336
}();
cljs.core.ObjMap.prototype.apply = function(tsym10301, args10302) {
  return tsym10301.call.apply(tsym10301, [tsym10301].concat(cljs.core.aclone.call(null, args10302)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10323 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__10324 = this;
  var this$__10325 = this;
  return cljs.core.pr_str.call(null, this$__10325)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10326 = this;
  if(this__10326.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__10291_SHARP_) {
      return cljs.core.vector.call(null, p1__10291_SHARP_, this__10326.strobj[p1__10291_SHARP_])
    }, this__10326.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10327 = this;
  return this__10327.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10328 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10329 = this;
  return new cljs.core.ObjMap(meta, this__10329.keys, this__10329.strobj, this__10329.update_count, this__10329.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10330 = this;
  return this__10330.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10331 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__10331.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10332 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10333 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____10333)) {
      return this__10332.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____10333
    }
  }())) {
    var new_keys__10334 = cljs.core.aclone.call(null, this__10332.keys);
    var new_strobj__10335 = goog.object.clone.call(null, this__10332.strobj);
    new_keys__10334.splice(cljs.core.scan_array.call(null, 1, k, new_keys__10334), 1);
    cljs.core.js_delete.call(null, new_strobj__10335, k);
    return new cljs.core.ObjMap(this__10332.meta, new_keys__10334, new_strobj__10335, this__10332.update_count + 1, null)
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
  var this__10342 = this;
  var h__364__auto____10343 = this__10342.__hash;
  if(h__364__auto____10343 != null) {
    return h__364__auto____10343
  }else {
    var h__364__auto____10344 = cljs.core.hash_imap.call(null, coll);
    this__10342.__hash = h__364__auto____10344;
    return h__364__auto____10344
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10345 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10346 = this;
  var bucket__10347 = this__10346.hashobj[cljs.core.hash.call(null, k)];
  var i__10348 = cljs.core.truth_(bucket__10347) ? cljs.core.scan_array.call(null, 2, k, bucket__10347) : null;
  if(cljs.core.truth_(i__10348)) {
    return bucket__10347[i__10348 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10349 = this;
  var h__10350 = cljs.core.hash.call(null, k);
  var bucket__10351 = this__10349.hashobj[h__10350];
  if(cljs.core.truth_(bucket__10351)) {
    var new_bucket__10352 = cljs.core.aclone.call(null, bucket__10351);
    var new_hashobj__10353 = goog.object.clone.call(null, this__10349.hashobj);
    new_hashobj__10353[h__10350] = new_bucket__10352;
    var temp__3971__auto____10354 = cljs.core.scan_array.call(null, 2, k, new_bucket__10352);
    if(cljs.core.truth_(temp__3971__auto____10354)) {
      var i__10355 = temp__3971__auto____10354;
      new_bucket__10352[i__10355 + 1] = v;
      return new cljs.core.HashMap(this__10349.meta, this__10349.count, new_hashobj__10353, null)
    }else {
      new_bucket__10352.push(k, v);
      return new cljs.core.HashMap(this__10349.meta, this__10349.count + 1, new_hashobj__10353, null)
    }
  }else {
    var new_hashobj__10356 = goog.object.clone.call(null, this__10349.hashobj);
    new_hashobj__10356[h__10350] = [k, v];
    return new cljs.core.HashMap(this__10349.meta, this__10349.count + 1, new_hashobj__10356, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10357 = this;
  var bucket__10358 = this__10357.hashobj[cljs.core.hash.call(null, k)];
  var i__10359 = cljs.core.truth_(bucket__10358) ? cljs.core.scan_array.call(null, 2, k, bucket__10358) : null;
  if(cljs.core.truth_(i__10359)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__10382 = null;
  var G__10382__2 = function(tsym10340, k) {
    var this__10360 = this;
    var tsym10340__10361 = this;
    var coll__10362 = tsym10340__10361;
    return cljs.core._lookup.call(null, coll__10362, k)
  };
  var G__10382__3 = function(tsym10341, k, not_found) {
    var this__10363 = this;
    var tsym10341__10364 = this;
    var coll__10365 = tsym10341__10364;
    return cljs.core._lookup.call(null, coll__10365, k, not_found)
  };
  G__10382 = function(tsym10341, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10382__2.call(this, tsym10341, k);
      case 3:
        return G__10382__3.call(this, tsym10341, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10382
}();
cljs.core.HashMap.prototype.apply = function(tsym10338, args10339) {
  return tsym10338.call.apply(tsym10338, [tsym10338].concat(cljs.core.aclone.call(null, args10339)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10366 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__10367 = this;
  var this$__10368 = this;
  return cljs.core.pr_str.call(null, this$__10368)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10369 = this;
  if(this__10369.count > 0) {
    var hashes__10370 = cljs.core.js_keys.call(null, this__10369.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__10337_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__10369.hashobj[p1__10337_SHARP_]))
    }, hashes__10370)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10371 = this;
  return this__10371.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10372 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10373 = this;
  return new cljs.core.HashMap(meta, this__10373.count, this__10373.hashobj, this__10373.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10374 = this;
  return this__10374.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10375 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__10375.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10376 = this;
  var h__10377 = cljs.core.hash.call(null, k);
  var bucket__10378 = this__10376.hashobj[h__10377];
  var i__10379 = cljs.core.truth_(bucket__10378) ? cljs.core.scan_array.call(null, 2, k, bucket__10378) : null;
  if(cljs.core.not.call(null, i__10379)) {
    return coll
  }else {
    var new_hashobj__10380 = goog.object.clone.call(null, this__10376.hashobj);
    if(3 > bucket__10378.length) {
      cljs.core.js_delete.call(null, new_hashobj__10380, h__10377)
    }else {
      var new_bucket__10381 = cljs.core.aclone.call(null, bucket__10378);
      new_bucket__10381.splice(i__10379, 2);
      new_hashobj__10380[h__10377] = new_bucket__10381
    }
    return new cljs.core.HashMap(this__10376.meta, this__10376.count - 1, new_hashobj__10380, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__10383 = ks.length;
  var i__10384 = 0;
  var out__10385 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__10384 < len__10383) {
      var G__10386 = i__10384 + 1;
      var G__10387 = cljs.core.assoc.call(null, out__10385, ks[i__10384], vs[i__10384]);
      i__10384 = G__10386;
      out__10385 = G__10387;
      continue
    }else {
      return out__10385
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__10388 = m.arr;
  var len__10389 = arr__10388.length;
  var i__10390 = 0;
  while(true) {
    if(len__10389 <= i__10390) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__10388[i__10390], k)) {
        return i__10390
      }else {
        if("\ufdd0'else") {
          var G__10391 = i__10390 + 2;
          i__10390 = G__10391;
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
  var this__10396 = this;
  return new cljs.core.TransientArrayMap({}, this__10396.arr.length, cljs.core.aclone.call(null, this__10396.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10397 = this;
  var h__364__auto____10398 = this__10397.__hash;
  if(h__364__auto____10398 != null) {
    return h__364__auto____10398
  }else {
    var h__364__auto____10399 = cljs.core.hash_imap.call(null, coll);
    this__10397.__hash = h__364__auto____10399;
    return h__364__auto____10399
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10400 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10401 = this;
  var idx__10402 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10402 === -1) {
    return not_found
  }else {
    return this__10401.arr[idx__10402 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10403 = this;
  var idx__10404 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10404 === -1) {
    if(this__10403.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__10403.meta, this__10403.cnt + 1, function() {
        var G__10405__10406 = cljs.core.aclone.call(null, this__10403.arr);
        G__10405__10406.push(k);
        G__10405__10406.push(v);
        return G__10405__10406
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__10403.arr[idx__10404 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__10403.meta, this__10403.cnt, function() {
          var G__10407__10408 = cljs.core.aclone.call(null, this__10403.arr);
          G__10407__10408[idx__10404 + 1] = v;
          return G__10407__10408
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10409 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__10439 = null;
  var G__10439__2 = function(tsym10394, k) {
    var this__10410 = this;
    var tsym10394__10411 = this;
    var coll__10412 = tsym10394__10411;
    return cljs.core._lookup.call(null, coll__10412, k)
  };
  var G__10439__3 = function(tsym10395, k, not_found) {
    var this__10413 = this;
    var tsym10395__10414 = this;
    var coll__10415 = tsym10395__10414;
    return cljs.core._lookup.call(null, coll__10415, k, not_found)
  };
  G__10439 = function(tsym10395, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10439__2.call(this, tsym10395, k);
      case 3:
        return G__10439__3.call(this, tsym10395, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10439
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym10392, args10393) {
  return tsym10392.call.apply(tsym10392, [tsym10392].concat(cljs.core.aclone.call(null, args10393)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10416 = this;
  var len__10417 = this__10416.arr.length;
  var i__10418 = 0;
  var init__10419 = init;
  while(true) {
    if(i__10418 < len__10417) {
      var init__10420 = f.call(null, init__10419, this__10416.arr[i__10418], this__10416.arr[i__10418 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__10420)) {
        return cljs.core.deref.call(null, init__10420)
      }else {
        var G__10440 = i__10418 + 2;
        var G__10441 = init__10420;
        i__10418 = G__10440;
        init__10419 = G__10441;
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
  var this__10421 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__10422 = this;
  var this$__10423 = this;
  return cljs.core.pr_str.call(null, this$__10423)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10424 = this;
  if(this__10424.cnt > 0) {
    var len__10425 = this__10424.arr.length;
    var array_map_seq__10426 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__10425) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__10424.arr[i], this__10424.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__10426.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10427 = this;
  return this__10427.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10428 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10429 = this;
  return new cljs.core.PersistentArrayMap(meta, this__10429.cnt, this__10429.arr, this__10429.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10430 = this;
  return this__10430.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10431 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__10431.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10432 = this;
  var idx__10433 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10433 >= 0) {
    var len__10434 = this__10432.arr.length;
    var new_len__10435 = len__10434 - 2;
    if(new_len__10435 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__10436 = cljs.core.make_array.call(null, new_len__10435);
      var s__10437 = 0;
      var d__10438 = 0;
      while(true) {
        if(s__10437 >= len__10434) {
          return new cljs.core.PersistentArrayMap(this__10432.meta, this__10432.cnt - 1, new_arr__10436, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__10432.arr[s__10437])) {
            var G__10442 = s__10437 + 2;
            var G__10443 = d__10438;
            s__10437 = G__10442;
            d__10438 = G__10443;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__10436[d__10438] = this__10432.arr[s__10437];
              new_arr__10436[d__10438 + 1] = this__10432.arr[s__10437 + 1];
              var G__10444 = s__10437 + 2;
              var G__10445 = d__10438 + 2;
              s__10437 = G__10444;
              d__10438 = G__10445;
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
  var len__10446 = cljs.core.count.call(null, ks);
  var i__10447 = 0;
  var out__10448 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__10447 < len__10446) {
      var G__10449 = i__10447 + 1;
      var G__10450 = cljs.core.assoc_BANG_.call(null, out__10448, ks[i__10447], vs[i__10447]);
      i__10447 = G__10449;
      out__10448 = G__10450;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10448)
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
  var this__10451 = this;
  if(cljs.core.truth_(this__10451.editable_QMARK_)) {
    var idx__10452 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10452 >= 0) {
      this__10451.arr[idx__10452] = this__10451.arr[this__10451.len - 2];
      this__10451.arr[idx__10452 + 1] = this__10451.arr[this__10451.len - 1];
      var G__10453__10454 = this__10451.arr;
      G__10453__10454.pop();
      G__10453__10454.pop();
      G__10453__10454;
      this__10451.len = this__10451.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10455 = this;
  if(cljs.core.truth_(this__10455.editable_QMARK_)) {
    var idx__10456 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10456 === -1) {
      if(this__10455.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__10455.len = this__10455.len + 2;
        this__10455.arr.push(key);
        this__10455.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__10455.len, this__10455.arr), key, val)
      }
    }else {
      if(val === this__10455.arr[idx__10456 + 1]) {
        return tcoll
      }else {
        this__10455.arr[idx__10456 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10457 = this;
  if(cljs.core.truth_(this__10457.editable_QMARK_)) {
    if(function() {
      var G__10458__10459 = o;
      if(G__10458__10459 != null) {
        if(function() {
          var or__3824__auto____10460 = G__10458__10459.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____10460) {
            return or__3824__auto____10460
          }else {
            return G__10458__10459.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10458__10459.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10458__10459)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10458__10459)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10461 = cljs.core.seq.call(null, o);
      var tcoll__10462 = tcoll;
      while(true) {
        var temp__3971__auto____10463 = cljs.core.first.call(null, es__10461);
        if(cljs.core.truth_(temp__3971__auto____10463)) {
          var e__10464 = temp__3971__auto____10463;
          var G__10470 = cljs.core.next.call(null, es__10461);
          var G__10471 = cljs.core._assoc_BANG_.call(null, tcoll__10462, cljs.core.key.call(null, e__10464), cljs.core.val.call(null, e__10464));
          es__10461 = G__10470;
          tcoll__10462 = G__10471;
          continue
        }else {
          return tcoll__10462
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10465 = this;
  if(cljs.core.truth_(this__10465.editable_QMARK_)) {
    this__10465.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__10465.len, 2), this__10465.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10466 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10467 = this;
  if(cljs.core.truth_(this__10467.editable_QMARK_)) {
    var idx__10468 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__10468 === -1) {
      return not_found
    }else {
      return this__10467.arr[idx__10468 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10469 = this;
  if(cljs.core.truth_(this__10469.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__10469.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__10472 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__10473 = 0;
  while(true) {
    if(i__10473 < len) {
      var G__10474 = cljs.core.assoc_BANG_.call(null, out__10472, arr[i__10473], arr[i__10473 + 1]);
      var G__10475 = i__10473 + 2;
      out__10472 = G__10474;
      i__10473 = G__10475;
      continue
    }else {
      return out__10472
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
    var G__10476__10477 = cljs.core.aclone.call(null, arr);
    G__10476__10477[i] = a;
    return G__10476__10477
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__10478__10479 = cljs.core.aclone.call(null, arr);
    G__10478__10479[i] = a;
    G__10478__10479[j] = b;
    return G__10478__10479
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
  var new_arr__10480 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__10480, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__10480, 2 * i, new_arr__10480.length - 2 * i);
  return new_arr__10480
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
    var editable__10481 = inode.ensure_editable(edit);
    editable__10481.arr[i] = a;
    return editable__10481
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__10482 = inode.ensure_editable(edit);
    editable__10482.arr[i] = a;
    editable__10482.arr[j] = b;
    return editable__10482
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
  var len__10483 = arr.length;
  var i__10484 = 0;
  var init__10485 = init;
  while(true) {
    if(i__10484 < len__10483) {
      var init__10488 = function() {
        var k__10486 = arr[i__10484];
        if(k__10486 != null) {
          return f.call(null, init__10485, k__10486, arr[i__10484 + 1])
        }else {
          var node__10487 = arr[i__10484 + 1];
          if(node__10487 != null) {
            return node__10487.kv_reduce(f, init__10485)
          }else {
            return init__10485
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10488)) {
        return cljs.core.deref.call(null, init__10488)
      }else {
        var G__10489 = i__10484 + 2;
        var G__10490 = init__10488;
        i__10484 = G__10489;
        init__10485 = G__10490;
        continue
      }
    }else {
      return init__10485
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
  var this__10491 = this;
  var inode__10492 = this;
  if(this__10491.bitmap === bit) {
    return null
  }else {
    var editable__10493 = inode__10492.ensure_editable(e);
    var earr__10494 = editable__10493.arr;
    var len__10495 = earr__10494.length;
    editable__10493.bitmap = bit ^ editable__10493.bitmap;
    cljs.core.array_copy.call(null, earr__10494, 2 * (i + 1), earr__10494, 2 * i, len__10495 - 2 * (i + 1));
    earr__10494[len__10495 - 2] = null;
    earr__10494[len__10495 - 1] = null;
    return editable__10493
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10496 = this;
  var inode__10497 = this;
  var bit__10498 = 1 << (hash >>> shift & 31);
  var idx__10499 = cljs.core.bitmap_indexed_node_index.call(null, this__10496.bitmap, bit__10498);
  if((this__10496.bitmap & bit__10498) === 0) {
    var n__10500 = cljs.core.bit_count.call(null, this__10496.bitmap);
    if(2 * n__10500 < this__10496.arr.length) {
      var editable__10501 = inode__10497.ensure_editable(edit);
      var earr__10502 = editable__10501.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__10502, 2 * idx__10499, earr__10502, 2 * (idx__10499 + 1), 2 * (n__10500 - idx__10499));
      earr__10502[2 * idx__10499] = key;
      earr__10502[2 * idx__10499 + 1] = val;
      editable__10501.bitmap = editable__10501.bitmap | bit__10498;
      return editable__10501
    }else {
      if(n__10500 >= 16) {
        var nodes__10503 = cljs.core.make_array.call(null, 32);
        var jdx__10504 = hash >>> shift & 31;
        nodes__10503[jdx__10504] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__10505 = 0;
        var j__10506 = 0;
        while(true) {
          if(i__10505 < 32) {
            if((this__10496.bitmap >>> i__10505 & 1) === 0) {
              var G__10559 = i__10505 + 1;
              var G__10560 = j__10506;
              i__10505 = G__10559;
              j__10506 = G__10560;
              continue
            }else {
              nodes__10503[i__10505] = null != this__10496.arr[j__10506] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__10496.arr[j__10506]), this__10496.arr[j__10506], this__10496.arr[j__10506 + 1], added_leaf_QMARK_) : this__10496.arr[j__10506 + 1];
              var G__10561 = i__10505 + 1;
              var G__10562 = j__10506 + 2;
              i__10505 = G__10561;
              j__10506 = G__10562;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__10500 + 1, nodes__10503)
      }else {
        if("\ufdd0'else") {
          var new_arr__10507 = cljs.core.make_array.call(null, 2 * (n__10500 + 4));
          cljs.core.array_copy.call(null, this__10496.arr, 0, new_arr__10507, 0, 2 * idx__10499);
          new_arr__10507[2 * idx__10499] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__10507[2 * idx__10499 + 1] = val;
          cljs.core.array_copy.call(null, this__10496.arr, 2 * idx__10499, new_arr__10507, 2 * (idx__10499 + 1), 2 * (n__10500 - idx__10499));
          var editable__10508 = inode__10497.ensure_editable(edit);
          editable__10508.arr = new_arr__10507;
          editable__10508.bitmap = editable__10508.bitmap | bit__10498;
          return editable__10508
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__10509 = this__10496.arr[2 * idx__10499];
    var val_or_node__10510 = this__10496.arr[2 * idx__10499 + 1];
    if(null == key_or_nil__10509) {
      var n__10511 = val_or_node__10510.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10511 === val_or_node__10510) {
        return inode__10497
      }else {
        return cljs.core.edit_and_set.call(null, inode__10497, edit, 2 * idx__10499 + 1, n__10511)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10509)) {
        if(val === val_or_node__10510) {
          return inode__10497
        }else {
          return cljs.core.edit_and_set.call(null, inode__10497, edit, 2 * idx__10499 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__10497, edit, 2 * idx__10499, null, 2 * idx__10499 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__10509, val_or_node__10510, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__10512 = this;
  var inode__10513 = this;
  return cljs.core.create_inode_seq.call(null, this__10512.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10514 = this;
  var inode__10515 = this;
  var bit__10516 = 1 << (hash >>> shift & 31);
  if((this__10514.bitmap & bit__10516) === 0) {
    return inode__10515
  }else {
    var idx__10517 = cljs.core.bitmap_indexed_node_index.call(null, this__10514.bitmap, bit__10516);
    var key_or_nil__10518 = this__10514.arr[2 * idx__10517];
    var val_or_node__10519 = this__10514.arr[2 * idx__10517 + 1];
    if(null == key_or_nil__10518) {
      var n__10520 = val_or_node__10519.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__10520 === val_or_node__10519) {
        return inode__10515
      }else {
        if(null != n__10520) {
          return cljs.core.edit_and_set.call(null, inode__10515, edit, 2 * idx__10517 + 1, n__10520)
        }else {
          if(this__10514.bitmap === bit__10516) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__10515.edit_and_remove_pair(edit, bit__10516, idx__10517)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10518)) {
        removed_leaf_QMARK_[0] = true;
        return inode__10515.edit_and_remove_pair(edit, bit__10516, idx__10517)
      }else {
        if("\ufdd0'else") {
          return inode__10515
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__10521 = this;
  var inode__10522 = this;
  if(e === this__10521.edit) {
    return inode__10522
  }else {
    var n__10523 = cljs.core.bit_count.call(null, this__10521.bitmap);
    var new_arr__10524 = cljs.core.make_array.call(null, n__10523 < 0 ? 4 : 2 * (n__10523 + 1));
    cljs.core.array_copy.call(null, this__10521.arr, 0, new_arr__10524, 0, 2 * n__10523);
    return new cljs.core.BitmapIndexedNode(e, this__10521.bitmap, new_arr__10524)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__10525 = this;
  var inode__10526 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10525.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__10563 = null;
  var G__10563__3 = function(shift, hash, key) {
    var this__10527 = this;
    var inode__10528 = this;
    var bit__10529 = 1 << (hash >>> shift & 31);
    if((this__10527.bitmap & bit__10529) === 0) {
      return null
    }else {
      var idx__10530 = cljs.core.bitmap_indexed_node_index.call(null, this__10527.bitmap, bit__10529);
      var key_or_nil__10531 = this__10527.arr[2 * idx__10530];
      var val_or_node__10532 = this__10527.arr[2 * idx__10530 + 1];
      if(null == key_or_nil__10531) {
        return val_or_node__10532.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10531)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10531, val_or_node__10532])
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
  var G__10563__4 = function(shift, hash, key, not_found) {
    var this__10533 = this;
    var inode__10534 = this;
    var bit__10535 = 1 << (hash >>> shift & 31);
    if((this__10533.bitmap & bit__10535) === 0) {
      return not_found
    }else {
      var idx__10536 = cljs.core.bitmap_indexed_node_index.call(null, this__10533.bitmap, bit__10535);
      var key_or_nil__10537 = this__10533.arr[2 * idx__10536];
      var val_or_node__10538 = this__10533.arr[2 * idx__10536 + 1];
      if(null == key_or_nil__10537) {
        return val_or_node__10538.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10537)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10537, val_or_node__10538])
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
  G__10563 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10563__3.call(this, shift, hash, key);
      case 4:
        return G__10563__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10563
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__10539 = this;
  var inode__10540 = this;
  var bit__10541 = 1 << (hash >>> shift & 31);
  if((this__10539.bitmap & bit__10541) === 0) {
    return inode__10540
  }else {
    var idx__10542 = cljs.core.bitmap_indexed_node_index.call(null, this__10539.bitmap, bit__10541);
    var key_or_nil__10543 = this__10539.arr[2 * idx__10542];
    var val_or_node__10544 = this__10539.arr[2 * idx__10542 + 1];
    if(null == key_or_nil__10543) {
      var n__10545 = val_or_node__10544.inode_without(shift + 5, hash, key);
      if(n__10545 === val_or_node__10544) {
        return inode__10540
      }else {
        if(null != n__10545) {
          return new cljs.core.BitmapIndexedNode(null, this__10539.bitmap, cljs.core.clone_and_set.call(null, this__10539.arr, 2 * idx__10542 + 1, n__10545))
        }else {
          if(this__10539.bitmap === bit__10541) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__10539.bitmap ^ bit__10541, cljs.core.remove_pair.call(null, this__10539.arr, idx__10542))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10543)) {
        return new cljs.core.BitmapIndexedNode(null, this__10539.bitmap ^ bit__10541, cljs.core.remove_pair.call(null, this__10539.arr, idx__10542))
      }else {
        if("\ufdd0'else") {
          return inode__10540
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10546 = this;
  var inode__10547 = this;
  var bit__10548 = 1 << (hash >>> shift & 31);
  var idx__10549 = cljs.core.bitmap_indexed_node_index.call(null, this__10546.bitmap, bit__10548);
  if((this__10546.bitmap & bit__10548) === 0) {
    var n__10550 = cljs.core.bit_count.call(null, this__10546.bitmap);
    if(n__10550 >= 16) {
      var nodes__10551 = cljs.core.make_array.call(null, 32);
      var jdx__10552 = hash >>> shift & 31;
      nodes__10551[jdx__10552] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__10553 = 0;
      var j__10554 = 0;
      while(true) {
        if(i__10553 < 32) {
          if((this__10546.bitmap >>> i__10553 & 1) === 0) {
            var G__10564 = i__10553 + 1;
            var G__10565 = j__10554;
            i__10553 = G__10564;
            j__10554 = G__10565;
            continue
          }else {
            nodes__10551[i__10553] = null != this__10546.arr[j__10554] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__10546.arr[j__10554]), this__10546.arr[j__10554], this__10546.arr[j__10554 + 1], added_leaf_QMARK_) : this__10546.arr[j__10554 + 1];
            var G__10566 = i__10553 + 1;
            var G__10567 = j__10554 + 2;
            i__10553 = G__10566;
            j__10554 = G__10567;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__10550 + 1, nodes__10551)
    }else {
      var new_arr__10555 = cljs.core.make_array.call(null, 2 * (n__10550 + 1));
      cljs.core.array_copy.call(null, this__10546.arr, 0, new_arr__10555, 0, 2 * idx__10549);
      new_arr__10555[2 * idx__10549] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__10555[2 * idx__10549 + 1] = val;
      cljs.core.array_copy.call(null, this__10546.arr, 2 * idx__10549, new_arr__10555, 2 * (idx__10549 + 1), 2 * (n__10550 - idx__10549));
      return new cljs.core.BitmapIndexedNode(null, this__10546.bitmap | bit__10548, new_arr__10555)
    }
  }else {
    var key_or_nil__10556 = this__10546.arr[2 * idx__10549];
    var val_or_node__10557 = this__10546.arr[2 * idx__10549 + 1];
    if(null == key_or_nil__10556) {
      var n__10558 = val_or_node__10557.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10558 === val_or_node__10557) {
        return inode__10547
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__10546.bitmap, cljs.core.clone_and_set.call(null, this__10546.arr, 2 * idx__10549 + 1, n__10558))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10556)) {
        if(val === val_or_node__10557) {
          return inode__10547
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__10546.bitmap, cljs.core.clone_and_set.call(null, this__10546.arr, 2 * idx__10549 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__10546.bitmap, cljs.core.clone_and_set.call(null, this__10546.arr, 2 * idx__10549, null, 2 * idx__10549 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__10556, val_or_node__10557, hash, key, val)))
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
  var arr__10568 = array_node.arr;
  var len__10569 = 2 * (array_node.cnt - 1);
  var new_arr__10570 = cljs.core.make_array.call(null, len__10569);
  var i__10571 = 0;
  var j__10572 = 1;
  var bitmap__10573 = 0;
  while(true) {
    if(i__10571 < len__10569) {
      if(function() {
        var and__3822__auto____10574 = i__10571 != idx;
        if(and__3822__auto____10574) {
          return null != arr__10568[i__10571]
        }else {
          return and__3822__auto____10574
        }
      }()) {
        new_arr__10570[j__10572] = arr__10568[i__10571];
        var G__10575 = i__10571 + 1;
        var G__10576 = j__10572 + 2;
        var G__10577 = bitmap__10573 | 1 << i__10571;
        i__10571 = G__10575;
        j__10572 = G__10576;
        bitmap__10573 = G__10577;
        continue
      }else {
        var G__10578 = i__10571 + 1;
        var G__10579 = j__10572;
        var G__10580 = bitmap__10573;
        i__10571 = G__10578;
        j__10572 = G__10579;
        bitmap__10573 = G__10580;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__10573, new_arr__10570)
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
  var this__10581 = this;
  var inode__10582 = this;
  var idx__10583 = hash >>> shift & 31;
  var node__10584 = this__10581.arr[idx__10583];
  if(null == node__10584) {
    return new cljs.core.ArrayNode(null, this__10581.cnt + 1, cljs.core.clone_and_set.call(null, this__10581.arr, idx__10583, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__10585 = node__10584.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10585 === node__10584) {
      return inode__10582
    }else {
      return new cljs.core.ArrayNode(null, this__10581.cnt, cljs.core.clone_and_set.call(null, this__10581.arr, idx__10583, n__10585))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__10586 = this;
  var inode__10587 = this;
  var idx__10588 = hash >>> shift & 31;
  var node__10589 = this__10586.arr[idx__10588];
  if(null != node__10589) {
    var n__10590 = node__10589.inode_without(shift + 5, hash, key);
    if(n__10590 === node__10589) {
      return inode__10587
    }else {
      if(n__10590 == null) {
        if(this__10586.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10587, null, idx__10588)
        }else {
          return new cljs.core.ArrayNode(null, this__10586.cnt - 1, cljs.core.clone_and_set.call(null, this__10586.arr, idx__10588, n__10590))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__10586.cnt, cljs.core.clone_and_set.call(null, this__10586.arr, idx__10588, n__10590))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__10587
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__10622 = null;
  var G__10622__3 = function(shift, hash, key) {
    var this__10591 = this;
    var inode__10592 = this;
    var idx__10593 = hash >>> shift & 31;
    var node__10594 = this__10591.arr[idx__10593];
    if(null != node__10594) {
      return node__10594.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__10622__4 = function(shift, hash, key, not_found) {
    var this__10595 = this;
    var inode__10596 = this;
    var idx__10597 = hash >>> shift & 31;
    var node__10598 = this__10595.arr[idx__10597];
    if(null != node__10598) {
      return node__10598.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__10622 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10622__3.call(this, shift, hash, key);
      case 4:
        return G__10622__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10622
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__10599 = this;
  var inode__10600 = this;
  return cljs.core.create_array_node_seq.call(null, this__10599.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__10601 = this;
  var inode__10602 = this;
  if(e === this__10601.edit) {
    return inode__10602
  }else {
    return new cljs.core.ArrayNode(e, this__10601.cnt, cljs.core.aclone.call(null, this__10601.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10603 = this;
  var inode__10604 = this;
  var idx__10605 = hash >>> shift & 31;
  var node__10606 = this__10603.arr[idx__10605];
  if(null == node__10606) {
    var editable__10607 = cljs.core.edit_and_set.call(null, inode__10604, edit, idx__10605, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__10607.cnt = editable__10607.cnt + 1;
    return editable__10607
  }else {
    var n__10608 = node__10606.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10608 === node__10606) {
      return inode__10604
    }else {
      return cljs.core.edit_and_set.call(null, inode__10604, edit, idx__10605, n__10608)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10609 = this;
  var inode__10610 = this;
  var idx__10611 = hash >>> shift & 31;
  var node__10612 = this__10609.arr[idx__10611];
  if(null == node__10612) {
    return inode__10610
  }else {
    var n__10613 = node__10612.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__10613 === node__10612) {
      return inode__10610
    }else {
      if(null == n__10613) {
        if(this__10609.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10610, edit, idx__10611)
        }else {
          var editable__10614 = cljs.core.edit_and_set.call(null, inode__10610, edit, idx__10611, n__10613);
          editable__10614.cnt = editable__10614.cnt - 1;
          return editable__10614
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__10610, edit, idx__10611, n__10613)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__10615 = this;
  var inode__10616 = this;
  var len__10617 = this__10615.arr.length;
  var i__10618 = 0;
  var init__10619 = init;
  while(true) {
    if(i__10618 < len__10617) {
      var node__10620 = this__10615.arr[i__10618];
      if(node__10620 != null) {
        var init__10621 = node__10620.kv_reduce(f, init__10619);
        if(cljs.core.reduced_QMARK_.call(null, init__10621)) {
          return cljs.core.deref.call(null, init__10621)
        }else {
          var G__10623 = i__10618 + 1;
          var G__10624 = init__10621;
          i__10618 = G__10623;
          init__10619 = G__10624;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__10619
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__10625 = 2 * cnt;
  var i__10626 = 0;
  while(true) {
    if(i__10626 < lim__10625) {
      if(cljs.core._EQ_.call(null, key, arr[i__10626])) {
        return i__10626
      }else {
        var G__10627 = i__10626 + 2;
        i__10626 = G__10627;
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
  var this__10628 = this;
  var inode__10629 = this;
  if(hash === this__10628.collision_hash) {
    var idx__10630 = cljs.core.hash_collision_node_find_index.call(null, this__10628.arr, this__10628.cnt, key);
    if(idx__10630 === -1) {
      var len__10631 = this__10628.arr.length;
      var new_arr__10632 = cljs.core.make_array.call(null, len__10631 + 2);
      cljs.core.array_copy.call(null, this__10628.arr, 0, new_arr__10632, 0, len__10631);
      new_arr__10632[len__10631] = key;
      new_arr__10632[len__10631 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__10628.collision_hash, this__10628.cnt + 1, new_arr__10632)
    }else {
      if(cljs.core._EQ_.call(null, this__10628.arr[idx__10630], val)) {
        return inode__10629
      }else {
        return new cljs.core.HashCollisionNode(null, this__10628.collision_hash, this__10628.cnt, cljs.core.clone_and_set.call(null, this__10628.arr, idx__10630 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__10628.collision_hash >>> shift & 31), [null, inode__10629])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__10633 = this;
  var inode__10634 = this;
  var idx__10635 = cljs.core.hash_collision_node_find_index.call(null, this__10633.arr, this__10633.cnt, key);
  if(idx__10635 === -1) {
    return inode__10634
  }else {
    if(this__10633.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__10633.collision_hash, this__10633.cnt - 1, cljs.core.remove_pair.call(null, this__10633.arr, cljs.core.quot.call(null, idx__10635, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__10662 = null;
  var G__10662__3 = function(shift, hash, key) {
    var this__10636 = this;
    var inode__10637 = this;
    var idx__10638 = cljs.core.hash_collision_node_find_index.call(null, this__10636.arr, this__10636.cnt, key);
    if(idx__10638 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__10636.arr[idx__10638])) {
        return cljs.core.PersistentVector.fromArray([this__10636.arr[idx__10638], this__10636.arr[idx__10638 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__10662__4 = function(shift, hash, key, not_found) {
    var this__10639 = this;
    var inode__10640 = this;
    var idx__10641 = cljs.core.hash_collision_node_find_index.call(null, this__10639.arr, this__10639.cnt, key);
    if(idx__10641 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__10639.arr[idx__10641])) {
        return cljs.core.PersistentVector.fromArray([this__10639.arr[idx__10641], this__10639.arr[idx__10641 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__10662 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10662__3.call(this, shift, hash, key);
      case 4:
        return G__10662__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10662
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__10642 = this;
  var inode__10643 = this;
  return cljs.core.create_inode_seq.call(null, this__10642.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__10663 = null;
  var G__10663__1 = function(e) {
    var this__10644 = this;
    var inode__10645 = this;
    if(e === this__10644.edit) {
      return inode__10645
    }else {
      var new_arr__10646 = cljs.core.make_array.call(null, 2 * (this__10644.cnt + 1));
      cljs.core.array_copy.call(null, this__10644.arr, 0, new_arr__10646, 0, 2 * this__10644.cnt);
      return new cljs.core.HashCollisionNode(e, this__10644.collision_hash, this__10644.cnt, new_arr__10646)
    }
  };
  var G__10663__3 = function(e, count, array) {
    var this__10647 = this;
    var inode__10648 = this;
    if(e === this__10647.edit) {
      this__10647.arr = array;
      this__10647.cnt = count;
      return inode__10648
    }else {
      return new cljs.core.HashCollisionNode(this__10647.edit, this__10647.collision_hash, count, array)
    }
  };
  G__10663 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__10663__1.call(this, e);
      case 3:
        return G__10663__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10663
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10649 = this;
  var inode__10650 = this;
  if(hash === this__10649.collision_hash) {
    var idx__10651 = cljs.core.hash_collision_node_find_index.call(null, this__10649.arr, this__10649.cnt, key);
    if(idx__10651 === -1) {
      if(this__10649.arr.length > 2 * this__10649.cnt) {
        var editable__10652 = cljs.core.edit_and_set.call(null, inode__10650, edit, 2 * this__10649.cnt, key, 2 * this__10649.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__10652.cnt = editable__10652.cnt + 1;
        return editable__10652
      }else {
        var len__10653 = this__10649.arr.length;
        var new_arr__10654 = cljs.core.make_array.call(null, len__10653 + 2);
        cljs.core.array_copy.call(null, this__10649.arr, 0, new_arr__10654, 0, len__10653);
        new_arr__10654[len__10653] = key;
        new_arr__10654[len__10653 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__10650.ensure_editable(edit, this__10649.cnt + 1, new_arr__10654)
      }
    }else {
      if(this__10649.arr[idx__10651 + 1] === val) {
        return inode__10650
      }else {
        return cljs.core.edit_and_set.call(null, inode__10650, edit, idx__10651 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__10649.collision_hash >>> shift & 31), [null, inode__10650, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10655 = this;
  var inode__10656 = this;
  var idx__10657 = cljs.core.hash_collision_node_find_index.call(null, this__10655.arr, this__10655.cnt, key);
  if(idx__10657 === -1) {
    return inode__10656
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__10655.cnt === 1) {
      return null
    }else {
      var editable__10658 = inode__10656.ensure_editable(edit);
      var earr__10659 = editable__10658.arr;
      earr__10659[idx__10657] = earr__10659[2 * this__10655.cnt - 2];
      earr__10659[idx__10657 + 1] = earr__10659[2 * this__10655.cnt - 1];
      earr__10659[2 * this__10655.cnt - 1] = null;
      earr__10659[2 * this__10655.cnt - 2] = null;
      editable__10658.cnt = editable__10658.cnt - 1;
      return editable__10658
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__10660 = this;
  var inode__10661 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10660.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10664 = cljs.core.hash.call(null, key1);
    if(key1hash__10664 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10664, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10665 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__10664, key1, val1, added_leaf_QMARK___10665).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___10665)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10666 = cljs.core.hash.call(null, key1);
    if(key1hash__10666 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10666, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10667 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__10666, key1, val1, added_leaf_QMARK___10667).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___10667)
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
  var this__10668 = this;
  var h__364__auto____10669 = this__10668.__hash;
  if(h__364__auto____10669 != null) {
    return h__364__auto____10669
  }else {
    var h__364__auto____10670 = cljs.core.hash_coll.call(null, coll);
    this__10668.__hash = h__364__auto____10670;
    return h__364__auto____10670
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10671 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__10672 = this;
  var this$__10673 = this;
  return cljs.core.pr_str.call(null, this$__10673)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10674 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10675 = this;
  if(this__10675.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10675.nodes[this__10675.i], this__10675.nodes[this__10675.i + 1]])
  }else {
    return cljs.core.first.call(null, this__10675.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10676 = this;
  if(this__10676.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10676.nodes, this__10676.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10676.nodes, this__10676.i, cljs.core.next.call(null, this__10676.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10677 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10678 = this;
  return new cljs.core.NodeSeq(meta, this__10678.nodes, this__10678.i, this__10678.s, this__10678.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10679 = this;
  return this__10679.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10680 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10680.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10681 = nodes.length;
      var j__10682 = i;
      while(true) {
        if(j__10682 < len__10681) {
          if(null != nodes[j__10682]) {
            return new cljs.core.NodeSeq(null, nodes, j__10682, null, null)
          }else {
            var temp__3971__auto____10683 = nodes[j__10682 + 1];
            if(cljs.core.truth_(temp__3971__auto____10683)) {
              var node__10684 = temp__3971__auto____10683;
              var temp__3971__auto____10685 = node__10684.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____10685)) {
                var node_seq__10686 = temp__3971__auto____10685;
                return new cljs.core.NodeSeq(null, nodes, j__10682 + 2, node_seq__10686, null)
              }else {
                var G__10687 = j__10682 + 2;
                j__10682 = G__10687;
                continue
              }
            }else {
              var G__10688 = j__10682 + 2;
              j__10682 = G__10688;
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
  var this__10689 = this;
  var h__364__auto____10690 = this__10689.__hash;
  if(h__364__auto____10690 != null) {
    return h__364__auto____10690
  }else {
    var h__364__auto____10691 = cljs.core.hash_coll.call(null, coll);
    this__10689.__hash = h__364__auto____10691;
    return h__364__auto____10691
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10692 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10693 = this;
  var this$__10694 = this;
  return cljs.core.pr_str.call(null, this$__10694)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10695 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10696 = this;
  return cljs.core.first.call(null, this__10696.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10697 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10697.nodes, this__10697.i, cljs.core.next.call(null, this__10697.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10698 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10699 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10699.nodes, this__10699.i, this__10699.s, this__10699.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10700 = this;
  return this__10700.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10701 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10701.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10702 = nodes.length;
      var j__10703 = i;
      while(true) {
        if(j__10703 < len__10702) {
          var temp__3971__auto____10704 = nodes[j__10703];
          if(cljs.core.truth_(temp__3971__auto____10704)) {
            var nj__10705 = temp__3971__auto____10704;
            var temp__3971__auto____10706 = nj__10705.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____10706)) {
              var ns__10707 = temp__3971__auto____10706;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10703 + 1, ns__10707, null)
            }else {
              var G__10708 = j__10703 + 1;
              j__10703 = G__10708;
              continue
            }
          }else {
            var G__10709 = j__10703 + 1;
            j__10703 = G__10709;
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
  var this__10714 = this;
  return new cljs.core.TransientHashMap({}, this__10714.root, this__10714.cnt, this__10714.has_nil_QMARK_, this__10714.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10715 = this;
  var h__364__auto____10716 = this__10715.__hash;
  if(h__364__auto____10716 != null) {
    return h__364__auto____10716
  }else {
    var h__364__auto____10717 = cljs.core.hash_imap.call(null, coll);
    this__10715.__hash = h__364__auto____10717;
    return h__364__auto____10717
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10718 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10719 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10719.has_nil_QMARK_)) {
      return this__10719.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10719.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__10719.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10720 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10721 = this__10720.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____10721)) {
        return v === this__10720.nil_val
      }else {
        return and__3822__auto____10721
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10720.meta, cljs.core.truth_(this__10720.has_nil_QMARK_) ? this__10720.cnt : this__10720.cnt + 1, this__10720.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10722 = [false];
    var new_root__10723 = (this__10720.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10720.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10722);
    if(new_root__10723 === this__10720.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10720.meta, cljs.core.truth_(added_leaf_QMARK___10722[0]) ? this__10720.cnt + 1 : this__10720.cnt, new_root__10723, this__10720.has_nil_QMARK_, this__10720.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10724 = this;
  if(k == null) {
    return this__10724.has_nil_QMARK_
  }else {
    if(this__10724.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__10724.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__10745 = null;
  var G__10745__2 = function(tsym10712, k) {
    var this__10725 = this;
    var tsym10712__10726 = this;
    var coll__10727 = tsym10712__10726;
    return cljs.core._lookup.call(null, coll__10727, k)
  };
  var G__10745__3 = function(tsym10713, k, not_found) {
    var this__10728 = this;
    var tsym10713__10729 = this;
    var coll__10730 = tsym10713__10729;
    return cljs.core._lookup.call(null, coll__10730, k, not_found)
  };
  G__10745 = function(tsym10713, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10745__2.call(this, tsym10713, k);
      case 3:
        return G__10745__3.call(this, tsym10713, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10745
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym10710, args10711) {
  return tsym10710.call.apply(tsym10710, [tsym10710].concat(cljs.core.aclone.call(null, args10711)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10731 = this;
  var init__10732 = cljs.core.truth_(this__10731.has_nil_QMARK_) ? f.call(null, init, null, this__10731.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__10732)) {
    return cljs.core.deref.call(null, init__10732)
  }else {
    if(null != this__10731.root) {
      return this__10731.root.kv_reduce(f, init__10732)
    }else {
      if("\ufdd0'else") {
        return init__10732
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10733 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__10734 = this;
  var this$__10735 = this;
  return cljs.core.pr_str.call(null, this$__10735)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10736 = this;
  if(this__10736.cnt > 0) {
    var s__10737 = null != this__10736.root ? this__10736.root.inode_seq() : null;
    if(cljs.core.truth_(this__10736.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__10736.nil_val]), s__10737)
    }else {
      return s__10737
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10738 = this;
  return this__10738.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10739 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10740 = this;
  return new cljs.core.PersistentHashMap(meta, this__10740.cnt, this__10740.root, this__10740.has_nil_QMARK_, this__10740.nil_val, this__10740.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10741 = this;
  return this__10741.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10742 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__10742.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10743 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10743.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__10743.meta, this__10743.cnt - 1, this__10743.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__10743.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__10744 = this__10743.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__10744 === this__10743.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__10743.meta, this__10743.cnt - 1, new_root__10744, this__10743.has_nil_QMARK_, this__10743.nil_val, null)
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
  var len__10746 = ks.length;
  var i__10747 = 0;
  var out__10748 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__10747 < len__10746) {
      var G__10749 = i__10747 + 1;
      var G__10750 = cljs.core.assoc_BANG_.call(null, out__10748, ks[i__10747], vs[i__10747]);
      i__10747 = G__10749;
      out__10748 = G__10750;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10748)
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
  var this__10751 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10752 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__10753 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10754 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10755 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10755.has_nil_QMARK_)) {
      return this__10755.nil_val
    }else {
      return null
    }
  }else {
    if(this__10755.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__10755.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10756 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10756.has_nil_QMARK_)) {
      return this__10756.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10756.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__10756.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10757 = this;
  if(cljs.core.truth_(this__10757.edit)) {
    return this__10757.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__10758 = this;
  var tcoll__10759 = this;
  if(cljs.core.truth_(this__10758.edit)) {
    if(function() {
      var G__10760__10761 = o;
      if(G__10760__10761 != null) {
        if(function() {
          var or__3824__auto____10762 = G__10760__10761.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____10762) {
            return or__3824__auto____10762
          }else {
            return G__10760__10761.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10760__10761.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10760__10761)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10760__10761)
      }
    }()) {
      return tcoll__10759.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10763 = cljs.core.seq.call(null, o);
      var tcoll__10764 = tcoll__10759;
      while(true) {
        var temp__3971__auto____10765 = cljs.core.first.call(null, es__10763);
        if(cljs.core.truth_(temp__3971__auto____10765)) {
          var e__10766 = temp__3971__auto____10765;
          var G__10777 = cljs.core.next.call(null, es__10763);
          var G__10778 = tcoll__10764.assoc_BANG_(cljs.core.key.call(null, e__10766), cljs.core.val.call(null, e__10766));
          es__10763 = G__10777;
          tcoll__10764 = G__10778;
          continue
        }else {
          return tcoll__10764
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__10767 = this;
  var tcoll__10768 = this;
  if(cljs.core.truth_(this__10767.edit)) {
    if(k == null) {
      if(this__10767.nil_val === v) {
      }else {
        this__10767.nil_val = v
      }
      if(cljs.core.truth_(this__10767.has_nil_QMARK_)) {
      }else {
        this__10767.count = this__10767.count + 1;
        this__10767.has_nil_QMARK_ = true
      }
      return tcoll__10768
    }else {
      var added_leaf_QMARK___10769 = [false];
      var node__10770 = (this__10767.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10767.root).inode_assoc_BANG_(this__10767.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10769);
      if(node__10770 === this__10767.root) {
      }else {
        this__10767.root = node__10770
      }
      if(cljs.core.truth_(added_leaf_QMARK___10769[0])) {
        this__10767.count = this__10767.count + 1
      }else {
      }
      return tcoll__10768
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__10771 = this;
  var tcoll__10772 = this;
  if(cljs.core.truth_(this__10771.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__10771.has_nil_QMARK_)) {
        this__10771.has_nil_QMARK_ = false;
        this__10771.nil_val = null;
        this__10771.count = this__10771.count - 1;
        return tcoll__10772
      }else {
        return tcoll__10772
      }
    }else {
      if(this__10771.root == null) {
        return tcoll__10772
      }else {
        var removed_leaf_QMARK___10773 = [false];
        var node__10774 = this__10771.root.inode_without_BANG_(this__10771.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___10773);
        if(node__10774 === this__10771.root) {
        }else {
          this__10771.root = node__10774
        }
        if(cljs.core.truth_(removed_leaf_QMARK___10773[0])) {
          this__10771.count = this__10771.count - 1
        }else {
        }
        return tcoll__10772
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__10775 = this;
  var tcoll__10776 = this;
  if(cljs.core.truth_(this__10775.edit)) {
    this__10775.edit = null;
    return new cljs.core.PersistentHashMap(null, this__10775.count, this__10775.root, this__10775.has_nil_QMARK_, this__10775.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10779 = node;
  var stack__10780 = stack;
  while(true) {
    if(t__10779 != null) {
      var G__10781 = cljs.core.truth_(ascending_QMARK_) ? t__10779.left : t__10779.right;
      var G__10782 = cljs.core.conj.call(null, stack__10780, t__10779);
      t__10779 = G__10781;
      stack__10780 = G__10782;
      continue
    }else {
      return stack__10780
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
  var this__10783 = this;
  var h__364__auto____10784 = this__10783.__hash;
  if(h__364__auto____10784 != null) {
    return h__364__auto____10784
  }else {
    var h__364__auto____10785 = cljs.core.hash_coll.call(null, coll);
    this__10783.__hash = h__364__auto____10785;
    return h__364__auto____10785
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10786 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10787 = this;
  var this$__10788 = this;
  return cljs.core.pr_str.call(null, this$__10788)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10789 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10790 = this;
  if(this__10790.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10790.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10791 = this;
  return cljs.core.peek.call(null, this__10791.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10792 = this;
  var t__10793 = cljs.core.peek.call(null, this__10792.stack);
  var next_stack__10794 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__10792.ascending_QMARK_) ? t__10793.right : t__10793.left, cljs.core.pop.call(null, this__10792.stack), this__10792.ascending_QMARK_);
  if(next_stack__10794 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10794, this__10792.ascending_QMARK_, this__10792.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10795 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10796 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10796.stack, this__10796.ascending_QMARK_, this__10796.cnt, this__10796.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10797 = this;
  return this__10797.meta
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
        var and__3822__auto____10798 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____10798) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____10798
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
        var and__3822__auto____10799 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____10799) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____10799
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
  var init__10800 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10800)) {
    return cljs.core.deref.call(null, init__10800)
  }else {
    var init__10801 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__10800) : init__10800;
    if(cljs.core.reduced_QMARK_.call(null, init__10801)) {
      return cljs.core.deref.call(null, init__10801)
    }else {
      var init__10802 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__10801) : init__10801;
      if(cljs.core.reduced_QMARK_.call(null, init__10802)) {
        return cljs.core.deref.call(null, init__10802)
      }else {
        return init__10802
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
  var this__10807 = this;
  var h__364__auto____10808 = this__10807.__hash;
  if(h__364__auto____10808 != null) {
    return h__364__auto____10808
  }else {
    var h__364__auto____10809 = cljs.core.hash_coll.call(null, coll);
    this__10807.__hash = h__364__auto____10809;
    return h__364__auto____10809
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10810 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10811 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10812 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10812.key, this__10812.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__10859 = null;
  var G__10859__2 = function(tsym10805, k) {
    var this__10813 = this;
    var tsym10805__10814 = this;
    var node__10815 = tsym10805__10814;
    return cljs.core._lookup.call(null, node__10815, k)
  };
  var G__10859__3 = function(tsym10806, k, not_found) {
    var this__10816 = this;
    var tsym10806__10817 = this;
    var node__10818 = tsym10806__10817;
    return cljs.core._lookup.call(null, node__10818, k, not_found)
  };
  G__10859 = function(tsym10806, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10859__2.call(this, tsym10806, k);
      case 3:
        return G__10859__3.call(this, tsym10806, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10859
}();
cljs.core.BlackNode.prototype.apply = function(tsym10803, args10804) {
  return tsym10803.call.apply(tsym10803, [tsym10803].concat(cljs.core.aclone.call(null, args10804)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10819 = this;
  return cljs.core.PersistentVector.fromArray([this__10819.key, this__10819.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10820 = this;
  return this__10820.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10821 = this;
  return this__10821.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10822 = this;
  var node__10823 = this;
  return ins.balance_right(node__10823)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10824 = this;
  var node__10825 = this;
  return new cljs.core.RedNode(this__10824.key, this__10824.val, this__10824.left, this__10824.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10826 = this;
  var node__10827 = this;
  return cljs.core.balance_right_del.call(null, this__10826.key, this__10826.val, this__10826.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10828 = this;
  var node__10829 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10830 = this;
  var node__10831 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10831, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10832 = this;
  var node__10833 = this;
  return cljs.core.balance_left_del.call(null, this__10832.key, this__10832.val, del, this__10832.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10834 = this;
  var node__10835 = this;
  return ins.balance_left(node__10835)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10836 = this;
  var node__10837 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10837, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10860 = null;
  var G__10860__0 = function() {
    var this__10840 = this;
    var this$__10841 = this;
    return cljs.core.pr_str.call(null, this$__10841)
  };
  G__10860 = function() {
    switch(arguments.length) {
      case 0:
        return G__10860__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10860
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10842 = this;
  var node__10843 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10843, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10844 = this;
  var node__10845 = this;
  return node__10845
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10846 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10847 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10848 = this;
  return cljs.core.list.call(null, this__10848.key, this__10848.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10850 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10851 = this;
  return this__10851.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10852 = this;
  return cljs.core.PersistentVector.fromArray([this__10852.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10853 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10853.key, this__10853.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10854 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10855 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10855.key, this__10855.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10856 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10857 = this;
  if(n === 0) {
    return this__10857.key
  }else {
    if(n === 1) {
      return this__10857.val
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
  var this__10858 = this;
  if(n === 0) {
    return this__10858.key
  }else {
    if(n === 1) {
      return this__10858.val
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
  var this__10849 = this;
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
  var this__10865 = this;
  var h__364__auto____10866 = this__10865.__hash;
  if(h__364__auto____10866 != null) {
    return h__364__auto____10866
  }else {
    var h__364__auto____10867 = cljs.core.hash_coll.call(null, coll);
    this__10865.__hash = h__364__auto____10867;
    return h__364__auto____10867
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10868 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10869 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10870 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10870.key, this__10870.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__10917 = null;
  var G__10917__2 = function(tsym10863, k) {
    var this__10871 = this;
    var tsym10863__10872 = this;
    var node__10873 = tsym10863__10872;
    return cljs.core._lookup.call(null, node__10873, k)
  };
  var G__10917__3 = function(tsym10864, k, not_found) {
    var this__10874 = this;
    var tsym10864__10875 = this;
    var node__10876 = tsym10864__10875;
    return cljs.core._lookup.call(null, node__10876, k, not_found)
  };
  G__10917 = function(tsym10864, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10917__2.call(this, tsym10864, k);
      case 3:
        return G__10917__3.call(this, tsym10864, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10917
}();
cljs.core.RedNode.prototype.apply = function(tsym10861, args10862) {
  return tsym10861.call.apply(tsym10861, [tsym10861].concat(cljs.core.aclone.call(null, args10862)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10877 = this;
  return cljs.core.PersistentVector.fromArray([this__10877.key, this__10877.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10878 = this;
  return this__10878.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10879 = this;
  return this__10879.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10880 = this;
  var node__10881 = this;
  return new cljs.core.RedNode(this__10880.key, this__10880.val, this__10880.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10882 = this;
  var node__10883 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10884 = this;
  var node__10885 = this;
  return new cljs.core.RedNode(this__10884.key, this__10884.val, this__10884.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10886 = this;
  var node__10887 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10888 = this;
  var node__10889 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10889, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10890 = this;
  var node__10891 = this;
  return new cljs.core.RedNode(this__10890.key, this__10890.val, del, this__10890.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10892 = this;
  var node__10893 = this;
  return new cljs.core.RedNode(this__10892.key, this__10892.val, ins, this__10892.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10894 = this;
  var node__10895 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10894.left)) {
    return new cljs.core.RedNode(this__10894.key, this__10894.val, this__10894.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10894.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10894.right)) {
      return new cljs.core.RedNode(this__10894.right.key, this__10894.right.val, new cljs.core.BlackNode(this__10894.key, this__10894.val, this__10894.left, this__10894.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10894.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10895, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10918 = null;
  var G__10918__0 = function() {
    var this__10898 = this;
    var this$__10899 = this;
    return cljs.core.pr_str.call(null, this$__10899)
  };
  G__10918 = function() {
    switch(arguments.length) {
      case 0:
        return G__10918__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10918
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10900 = this;
  var node__10901 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10900.right)) {
    return new cljs.core.RedNode(this__10900.key, this__10900.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10900.left, null), this__10900.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10900.left)) {
      return new cljs.core.RedNode(this__10900.left.key, this__10900.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10900.left.left, null), new cljs.core.BlackNode(this__10900.key, this__10900.val, this__10900.left.right, this__10900.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10901, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10902 = this;
  var node__10903 = this;
  return new cljs.core.BlackNode(this__10902.key, this__10902.val, this__10902.left, this__10902.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10904 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10905 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10906 = this;
  return cljs.core.list.call(null, this__10906.key, this__10906.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10908 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10909 = this;
  return this__10909.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10910 = this;
  return cljs.core.PersistentVector.fromArray([this__10910.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10911 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10911.key, this__10911.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10912 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10913 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10913.key, this__10913.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10914 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10915 = this;
  if(n === 0) {
    return this__10915.key
  }else {
    if(n === 1) {
      return this__10915.val
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
  var this__10916 = this;
  if(n === 0) {
    return this__10916.key
  }else {
    if(n === 1) {
      return this__10916.val
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
  var this__10907 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10919 = comp.call(null, k, tree.key);
    if(c__10919 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10919 < 0) {
        var ins__10920 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__10920 != null) {
          return tree.add_left(ins__10920)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10921 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__10921 != null) {
            return tree.add_right(ins__10921)
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
          var app__10922 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10922)) {
            return new cljs.core.RedNode(app__10922.key, app__10922.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10922.left), new cljs.core.RedNode(right.key, right.val, app__10922.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10922, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10923 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10923)) {
              return new cljs.core.RedNode(app__10923.key, app__10923.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10923.left, null), new cljs.core.BlackNode(right.key, right.val, app__10923.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10923, right.right, null))
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
    var c__10924 = comp.call(null, k, tree.key);
    if(c__10924 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10924 < 0) {
        var del__10925 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10926 = del__10925 != null;
          if(or__3824__auto____10926) {
            return or__3824__auto____10926
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10925, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10925, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10927 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10928 = del__10927 != null;
            if(or__3824__auto____10928) {
              return or__3824__auto____10928
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10927)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10927, null)
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
  var tk__10929 = tree.key;
  var c__10930 = comp.call(null, k, tk__10929);
  if(c__10930 === 0) {
    return tree.replace(tk__10929, v, tree.left, tree.right)
  }else {
    if(c__10930 < 0) {
      return tree.replace(tk__10929, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10929, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__10935 = this;
  var h__364__auto____10936 = this__10935.__hash;
  if(h__364__auto____10936 != null) {
    return h__364__auto____10936
  }else {
    var h__364__auto____10937 = cljs.core.hash_imap.call(null, coll);
    this__10935.__hash = h__364__auto____10937;
    return h__364__auto____10937
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10938 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10939 = this;
  var n__10940 = coll.entry_at(k);
  if(n__10940 != null) {
    return n__10940.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10941 = this;
  var found__10942 = [null];
  var t__10943 = cljs.core.tree_map_add.call(null, this__10941.comp, this__10941.tree, k, v, found__10942);
  if(t__10943 == null) {
    var found_node__10944 = cljs.core.nth.call(null, found__10942, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10944.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10941.comp, cljs.core.tree_map_replace.call(null, this__10941.comp, this__10941.tree, k, v), this__10941.cnt, this__10941.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10941.comp, t__10943.blacken(), this__10941.cnt + 1, this__10941.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10945 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10977 = null;
  var G__10977__2 = function(tsym10933, k) {
    var this__10946 = this;
    var tsym10933__10947 = this;
    var coll__10948 = tsym10933__10947;
    return cljs.core._lookup.call(null, coll__10948, k)
  };
  var G__10977__3 = function(tsym10934, k, not_found) {
    var this__10949 = this;
    var tsym10934__10950 = this;
    var coll__10951 = tsym10934__10950;
    return cljs.core._lookup.call(null, coll__10951, k, not_found)
  };
  G__10977 = function(tsym10934, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10977__2.call(this, tsym10934, k);
      case 3:
        return G__10977__3.call(this, tsym10934, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10977
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym10931, args10932) {
  return tsym10931.call.apply(tsym10931, [tsym10931].concat(cljs.core.aclone.call(null, args10932)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10952 = this;
  if(this__10952.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10952.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10953 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10954 = this;
  if(this__10954.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10954.tree, false, this__10954.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10955 = this;
  var this$__10956 = this;
  return cljs.core.pr_str.call(null, this$__10956)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10957 = this;
  var coll__10958 = this;
  var t__10959 = this__10957.tree;
  while(true) {
    if(t__10959 != null) {
      var c__10960 = this__10957.comp.call(null, k, t__10959.key);
      if(c__10960 === 0) {
        return t__10959
      }else {
        if(c__10960 < 0) {
          var G__10978 = t__10959.left;
          t__10959 = G__10978;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10979 = t__10959.right;
            t__10959 = G__10979;
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
  var this__10961 = this;
  if(this__10961.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10961.tree, ascending_QMARK_, this__10961.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10962 = this;
  if(this__10962.cnt > 0) {
    var stack__10963 = null;
    var t__10964 = this__10962.tree;
    while(true) {
      if(t__10964 != null) {
        var c__10965 = this__10962.comp.call(null, k, t__10964.key);
        if(c__10965 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10963, t__10964), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10965 < 0) {
              var G__10980 = cljs.core.conj.call(null, stack__10963, t__10964);
              var G__10981 = t__10964.left;
              stack__10963 = G__10980;
              t__10964 = G__10981;
              continue
            }else {
              var G__10982 = stack__10963;
              var G__10983 = t__10964.right;
              stack__10963 = G__10982;
              t__10964 = G__10983;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10965 > 0) {
                var G__10984 = cljs.core.conj.call(null, stack__10963, t__10964);
                var G__10985 = t__10964.right;
                stack__10963 = G__10984;
                t__10964 = G__10985;
                continue
              }else {
                var G__10986 = stack__10963;
                var G__10987 = t__10964.left;
                stack__10963 = G__10986;
                t__10964 = G__10987;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10963 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10963, ascending_QMARK_, -1)
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
  var this__10966 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10967 = this;
  return this__10967.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10968 = this;
  if(this__10968.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10968.tree, true, this__10968.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10969 = this;
  return this__10969.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10970 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10971 = this;
  return new cljs.core.PersistentTreeMap(this__10971.comp, this__10971.tree, this__10971.cnt, meta, this__10971.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10975 = this;
  return this__10975.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10976 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10976.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10972 = this;
  var found__10973 = [null];
  var t__10974 = cljs.core.tree_map_remove.call(null, this__10972.comp, this__10972.tree, k, found__10973);
  if(t__10974 == null) {
    if(cljs.core.nth.call(null, found__10973, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10972.comp, null, 0, this__10972.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10972.comp, t__10974.blacken(), this__10972.cnt - 1, this__10972.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__10988 = cljs.core.seq.call(null, keyvals);
    var out__10989 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__10988)) {
        var G__10990 = cljs.core.nnext.call(null, in$__10988);
        var G__10991 = cljs.core.assoc_BANG_.call(null, out__10989, cljs.core.first.call(null, in$__10988), cljs.core.second.call(null, in$__10988));
        in$__10988 = G__10990;
        out__10989 = G__10991;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10989)
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
  hash_map.cljs$lang$applyTo = function(arglist__10992) {
    var keyvals = cljs.core.seq(arglist__10992);
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
  array_map.cljs$lang$applyTo = function(arglist__10993) {
    var keyvals = cljs.core.seq(arglist__10993);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__10994 = cljs.core.seq.call(null, keyvals);
    var out__10995 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__10994)) {
        var G__10996 = cljs.core.nnext.call(null, in$__10994);
        var G__10997 = cljs.core.assoc.call(null, out__10995, cljs.core.first.call(null, in$__10994), cljs.core.second.call(null, in$__10994));
        in$__10994 = G__10996;
        out__10995 = G__10997;
        continue
      }else {
        return out__10995
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
  sorted_map.cljs$lang$applyTo = function(arglist__10998) {
    var keyvals = cljs.core.seq(arglist__10998);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__10999 = cljs.core.seq.call(null, keyvals);
    var out__11000 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__10999)) {
        var G__11001 = cljs.core.nnext.call(null, in$__10999);
        var G__11002 = cljs.core.assoc.call(null, out__11000, cljs.core.first.call(null, in$__10999), cljs.core.second.call(null, in$__10999));
        in$__10999 = G__11001;
        out__11000 = G__11002;
        continue
      }else {
        return out__11000
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__11003) {
    var comparator = cljs.core.first(arglist__11003);
    var keyvals = cljs.core.rest(arglist__11003);
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
      return cljs.core.reduce.call(null, function(p1__11004_SHARP_, p2__11005_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____11006 = p1__11004_SHARP_;
          if(cljs.core.truth_(or__3824__auto____11006)) {
            return or__3824__auto____11006
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__11005_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__11007) {
    var maps = cljs.core.seq(arglist__11007);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11010 = function(m, e) {
        var k__11008 = cljs.core.first.call(null, e);
        var v__11009 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__11008)) {
          return cljs.core.assoc.call(null, m, k__11008, f.call(null, cljs.core.get.call(null, m, k__11008), v__11009))
        }else {
          return cljs.core.assoc.call(null, m, k__11008, v__11009)
        }
      };
      var merge2__11012 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11010, function() {
          var or__3824__auto____11011 = m1;
          if(cljs.core.truth_(or__3824__auto____11011)) {
            return or__3824__auto____11011
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11012, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__11013) {
    var f = cljs.core.first(arglist__11013);
    var maps = cljs.core.rest(arglist__11013);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11014 = cljs.core.ObjMap.fromObject([], {});
  var keys__11015 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__11015)) {
      var key__11016 = cljs.core.first.call(null, keys__11015);
      var entry__11017 = cljs.core.get.call(null, map, key__11016, "\ufdd0'user/not-found");
      var G__11018 = cljs.core.not_EQ_.call(null, entry__11017, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__11014, key__11016, entry__11017) : ret__11014;
      var G__11019 = cljs.core.next.call(null, keys__11015);
      ret__11014 = G__11018;
      keys__11015 = G__11019;
      continue
    }else {
      return ret__11014
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
  var this__11025 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__11025.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11026 = this;
  var h__364__auto____11027 = this__11026.__hash;
  if(h__364__auto____11027 != null) {
    return h__364__auto____11027
  }else {
    var h__364__auto____11028 = cljs.core.hash_iset.call(null, coll);
    this__11026.__hash = h__364__auto____11028;
    return h__364__auto____11028
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11029 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11030 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11030.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__11049 = null;
  var G__11049__2 = function(tsym11023, k) {
    var this__11031 = this;
    var tsym11023__11032 = this;
    var coll__11033 = tsym11023__11032;
    return cljs.core._lookup.call(null, coll__11033, k)
  };
  var G__11049__3 = function(tsym11024, k, not_found) {
    var this__11034 = this;
    var tsym11024__11035 = this;
    var coll__11036 = tsym11024__11035;
    return cljs.core._lookup.call(null, coll__11036, k, not_found)
  };
  G__11049 = function(tsym11024, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11049__2.call(this, tsym11024, k);
      case 3:
        return G__11049__3.call(this, tsym11024, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11049
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym11021, args11022) {
  return tsym11021.call.apply(tsym11021, [tsym11021].concat(cljs.core.aclone.call(null, args11022)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11037 = this;
  return new cljs.core.PersistentHashSet(this__11037.meta, cljs.core.assoc.call(null, this__11037.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__11038 = this;
  var this$__11039 = this;
  return cljs.core.pr_str.call(null, this$__11039)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11040 = this;
  return cljs.core.keys.call(null, this__11040.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11041 = this;
  return new cljs.core.PersistentHashSet(this__11041.meta, cljs.core.dissoc.call(null, this__11041.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11042 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11043 = this;
  var and__3822__auto____11044 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11044) {
    var and__3822__auto____11045 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11045) {
      return cljs.core.every_QMARK_.call(null, function(p1__11020_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11020_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11045
    }
  }else {
    return and__3822__auto____11044
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11046 = this;
  return new cljs.core.PersistentHashSet(meta, this__11046.hash_map, this__11046.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11047 = this;
  return this__11047.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11048 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__11048.meta)
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
  var G__11067 = null;
  var G__11067__2 = function(tsym11053, k) {
    var this__11055 = this;
    var tsym11053__11056 = this;
    var tcoll__11057 = tsym11053__11056;
    if(cljs.core._lookup.call(null, this__11055.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__11067__3 = function(tsym11054, k, not_found) {
    var this__11058 = this;
    var tsym11054__11059 = this;
    var tcoll__11060 = tsym11054__11059;
    if(cljs.core._lookup.call(null, this__11058.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__11067 = function(tsym11054, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11067__2.call(this, tsym11054, k);
      case 3:
        return G__11067__3.call(this, tsym11054, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11067
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym11051, args11052) {
  return tsym11051.call.apply(tsym11051, [tsym11051].concat(cljs.core.aclone.call(null, args11052)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__11061 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__11062 = this;
  if(cljs.core._lookup.call(null, this__11062.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__11063 = this;
  return cljs.core.count.call(null, this__11063.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__11064 = this;
  this__11064.transient_map = cljs.core.dissoc_BANG_.call(null, this__11064.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__11065 = this;
  this__11065.transient_map = cljs.core.assoc_BANG_.call(null, this__11065.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11066 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__11066.transient_map), null)
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
  var this__11072 = this;
  var h__364__auto____11073 = this__11072.__hash;
  if(h__364__auto____11073 != null) {
    return h__364__auto____11073
  }else {
    var h__364__auto____11074 = cljs.core.hash_iset.call(null, coll);
    this__11072.__hash = h__364__auto____11074;
    return h__364__auto____11074
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11075 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11076 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11076.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__11100 = null;
  var G__11100__2 = function(tsym11070, k) {
    var this__11077 = this;
    var tsym11070__11078 = this;
    var coll__11079 = tsym11070__11078;
    return cljs.core._lookup.call(null, coll__11079, k)
  };
  var G__11100__3 = function(tsym11071, k, not_found) {
    var this__11080 = this;
    var tsym11071__11081 = this;
    var coll__11082 = tsym11071__11081;
    return cljs.core._lookup.call(null, coll__11082, k, not_found)
  };
  G__11100 = function(tsym11071, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11100__2.call(this, tsym11071, k);
      case 3:
        return G__11100__3.call(this, tsym11071, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11100
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym11068, args11069) {
  return tsym11068.call.apply(tsym11068, [tsym11068].concat(cljs.core.aclone.call(null, args11069)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11083 = this;
  return new cljs.core.PersistentTreeSet(this__11083.meta, cljs.core.assoc.call(null, this__11083.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11084 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__11084.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__11085 = this;
  var this$__11086 = this;
  return cljs.core.pr_str.call(null, this$__11086)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11087 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__11087.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11088 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__11088.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11089 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11090 = this;
  return cljs.core._comparator.call(null, this__11090.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11091 = this;
  return cljs.core.keys.call(null, this__11091.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11092 = this;
  return new cljs.core.PersistentTreeSet(this__11092.meta, cljs.core.dissoc.call(null, this__11092.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11093 = this;
  return cljs.core.count.call(null, this__11093.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11094 = this;
  var and__3822__auto____11095 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11095) {
    var and__3822__auto____11096 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11096) {
      return cljs.core.every_QMARK_.call(null, function(p1__11050_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11050_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11096
    }
  }else {
    return and__3822__auto____11095
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11097 = this;
  return new cljs.core.PersistentTreeSet(meta, this__11097.tree_map, this__11097.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11098 = this;
  return this__11098.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11099 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__11099.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__11101 = cljs.core.seq.call(null, coll);
  var out__11102 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__11101))) {
      var G__11103 = cljs.core.next.call(null, in$__11101);
      var G__11104 = cljs.core.conj_BANG_.call(null, out__11102, cljs.core.first.call(null, in$__11101));
      in$__11101 = G__11103;
      out__11102 = G__11104;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__11102)
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
  sorted_set.cljs$lang$applyTo = function(arglist__11105) {
    var keys = cljs.core.seq(arglist__11105);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__11107) {
    var comparator = cljs.core.first(arglist__11107);
    var keys = cljs.core.rest(arglist__11107);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__11108 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____11109 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____11109)) {
        var e__11110 = temp__3971__auto____11109;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11110))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11108, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11106_SHARP_) {
      var temp__3971__auto____11111 = cljs.core.find.call(null, smap, p1__11106_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____11111)) {
        var e__11112 = temp__3971__auto____11111;
        return cljs.core.second.call(null, e__11112)
      }else {
        return p1__11106_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11120 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11113, seen) {
        while(true) {
          var vec__11114__11115 = p__11113;
          var f__11116 = cljs.core.nth.call(null, vec__11114__11115, 0, null);
          var xs__11117 = vec__11114__11115;
          var temp__3974__auto____11118 = cljs.core.seq.call(null, xs__11117);
          if(cljs.core.truth_(temp__3974__auto____11118)) {
            var s__11119 = temp__3974__auto____11118;
            if(cljs.core.contains_QMARK_.call(null, seen, f__11116)) {
              var G__11121 = cljs.core.rest.call(null, s__11119);
              var G__11122 = seen;
              p__11113 = G__11121;
              seen = G__11122;
              continue
            }else {
              return cljs.core.cons.call(null, f__11116, step.call(null, cljs.core.rest.call(null, s__11119), cljs.core.conj.call(null, seen, f__11116)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__11120.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__11123 = cljs.core.PersistentVector.fromArray([]);
  var s__11124 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__11124))) {
      var G__11125 = cljs.core.conj.call(null, ret__11123, cljs.core.first.call(null, s__11124));
      var G__11126 = cljs.core.next.call(null, s__11124);
      ret__11123 = G__11125;
      s__11124 = G__11126;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11123)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____11127 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____11127) {
        return or__3824__auto____11127
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__11128 = x.lastIndexOf("/");
      if(i__11128 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11128 + 1)
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
    var or__3824__auto____11129 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____11129) {
      return or__3824__auto____11129
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__11130 = x.lastIndexOf("/");
    if(i__11130 > -1) {
      return cljs.core.subs.call(null, x, 2, i__11130)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11133 = cljs.core.ObjMap.fromObject([], {});
  var ks__11134 = cljs.core.seq.call(null, keys);
  var vs__11135 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11136 = ks__11134;
      if(cljs.core.truth_(and__3822__auto____11136)) {
        return vs__11135
      }else {
        return and__3822__auto____11136
      }
    }())) {
      var G__11137 = cljs.core.assoc.call(null, map__11133, cljs.core.first.call(null, ks__11134), cljs.core.first.call(null, vs__11135));
      var G__11138 = cljs.core.next.call(null, ks__11134);
      var G__11139 = cljs.core.next.call(null, vs__11135);
      map__11133 = G__11137;
      ks__11134 = G__11138;
      vs__11135 = G__11139;
      continue
    }else {
      return map__11133
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
    var G__11142__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11131_SHARP_, p2__11132_SHARP_) {
        return max_key.call(null, k, p1__11131_SHARP_, p2__11132_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__11142 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11142__delegate.call(this, k, x, y, more)
    };
    G__11142.cljs$lang$maxFixedArity = 3;
    G__11142.cljs$lang$applyTo = function(arglist__11143) {
      var k = cljs.core.first(arglist__11143);
      var x = cljs.core.first(cljs.core.next(arglist__11143));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11143)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11143)));
      return G__11142__delegate(k, x, y, more)
    };
    G__11142.cljs$lang$arity$variadic = G__11142__delegate;
    return G__11142
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
    var G__11144__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11140_SHARP_, p2__11141_SHARP_) {
        return min_key.call(null, k, p1__11140_SHARP_, p2__11141_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__11144 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11144__delegate.call(this, k, x, y, more)
    };
    G__11144.cljs$lang$maxFixedArity = 3;
    G__11144.cljs$lang$applyTo = function(arglist__11145) {
      var k = cljs.core.first(arglist__11145);
      var x = cljs.core.first(cljs.core.next(arglist__11145));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11145)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11145)));
      return G__11144__delegate(k, x, y, more)
    };
    G__11144.cljs$lang$arity$variadic = G__11144__delegate;
    return G__11144
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
      var temp__3974__auto____11146 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11146)) {
        var s__11147 = temp__3974__auto____11146;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__11147), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__11147)))
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
    var temp__3974__auto____11148 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11148)) {
      var s__11149 = temp__3974__auto____11148;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__11149)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11149), take_while.call(null, pred, cljs.core.rest.call(null, s__11149)))
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
    var comp__11150 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__11150.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__11151 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____11152 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____11152)) {
        var vec__11153__11154 = temp__3974__auto____11152;
        var e__11155 = cljs.core.nth.call(null, vec__11153__11154, 0, null);
        var s__11156 = vec__11153__11154;
        if(cljs.core.truth_(include__11151.call(null, e__11155))) {
          return s__11156
        }else {
          return cljs.core.next.call(null, s__11156)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11151, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11157 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____11157)) {
      var vec__11158__11159 = temp__3974__auto____11157;
      var e__11160 = cljs.core.nth.call(null, vec__11158__11159, 0, null);
      var s__11161 = vec__11158__11159;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__11160)) ? s__11161 : cljs.core.next.call(null, s__11161))
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
    var include__11162 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____11163 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____11163)) {
        var vec__11164__11165 = temp__3974__auto____11163;
        var e__11166 = cljs.core.nth.call(null, vec__11164__11165, 0, null);
        var s__11167 = vec__11164__11165;
        if(cljs.core.truth_(include__11162.call(null, e__11166))) {
          return s__11167
        }else {
          return cljs.core.next.call(null, s__11167)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11162, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11168 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____11168)) {
      var vec__11169__11170 = temp__3974__auto____11168;
      var e__11171 = cljs.core.nth.call(null, vec__11169__11170, 0, null);
      var s__11172 = vec__11169__11170;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__11171)) ? s__11172 : cljs.core.next.call(null, s__11172))
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
  var this__11173 = this;
  var h__364__auto____11174 = this__11173.__hash;
  if(h__364__auto____11174 != null) {
    return h__364__auto____11174
  }else {
    var h__364__auto____11175 = cljs.core.hash_coll.call(null, rng);
    this__11173.__hash = h__364__auto____11175;
    return h__364__auto____11175
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__11176 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__11177 = this;
  var this$__11178 = this;
  return cljs.core.pr_str.call(null, this$__11178)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__11179 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__11180 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__11181 = this;
  var comp__11182 = this__11181.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__11182.call(null, this__11181.start, this__11181.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__11183 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__11183.end - this__11183.start) / this__11183.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__11184 = this;
  return this__11184.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__11185 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__11185.meta, this__11185.start + this__11185.step, this__11185.end, this__11185.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__11186 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__11187 = this;
  return new cljs.core.Range(meta, this__11187.start, this__11187.end, this__11187.step, this__11187.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__11188 = this;
  return this__11188.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__11189 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__11189.start + n * this__11189.step
  }else {
    if(function() {
      var and__3822__auto____11190 = this__11189.start > this__11189.end;
      if(and__3822__auto____11190) {
        return this__11189.step === 0
      }else {
        return and__3822__auto____11190
      }
    }()) {
      return this__11189.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__11191 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__11191.start + n * this__11191.step
  }else {
    if(function() {
      var and__3822__auto____11192 = this__11191.start > this__11191.end;
      if(and__3822__auto____11192) {
        return this__11191.step === 0
      }else {
        return and__3822__auto____11192
      }
    }()) {
      return this__11191.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__11193 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11193.meta)
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
    var temp__3974__auto____11194 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11194)) {
      var s__11195 = temp__3974__auto____11194;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__11195), take_nth.call(null, n, cljs.core.drop.call(null, n, s__11195)))
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
    var temp__3974__auto____11197 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11197)) {
      var s__11198 = temp__3974__auto____11197;
      var fst__11199 = cljs.core.first.call(null, s__11198);
      var fv__11200 = f.call(null, fst__11199);
      var run__11201 = cljs.core.cons.call(null, fst__11199, cljs.core.take_while.call(null, function(p1__11196_SHARP_) {
        return cljs.core._EQ_.call(null, fv__11200, f.call(null, p1__11196_SHARP_))
      }, cljs.core.next.call(null, s__11198)));
      return cljs.core.cons.call(null, run__11201, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__11201), s__11198))))
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
      var temp__3971__auto____11212 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____11212)) {
        var s__11213 = temp__3971__auto____11212;
        return reductions.call(null, f, cljs.core.first.call(null, s__11213), cljs.core.rest.call(null, s__11213))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11214 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11214)) {
        var s__11215 = temp__3974__auto____11214;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__11215)), cljs.core.rest.call(null, s__11215))
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
      var G__11217 = null;
      var G__11217__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__11217__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__11217__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__11217__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__11217__4 = function() {
        var G__11218__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__11218 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11218__delegate.call(this, x, y, z, args)
        };
        G__11218.cljs$lang$maxFixedArity = 3;
        G__11218.cljs$lang$applyTo = function(arglist__11219) {
          var x = cljs.core.first(arglist__11219);
          var y = cljs.core.first(cljs.core.next(arglist__11219));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11219)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11219)));
          return G__11218__delegate(x, y, z, args)
        };
        G__11218.cljs$lang$arity$variadic = G__11218__delegate;
        return G__11218
      }();
      G__11217 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11217__0.call(this);
          case 1:
            return G__11217__1.call(this, x);
          case 2:
            return G__11217__2.call(this, x, y);
          case 3:
            return G__11217__3.call(this, x, y, z);
          default:
            return G__11217__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11217.cljs$lang$maxFixedArity = 3;
      G__11217.cljs$lang$applyTo = G__11217__4.cljs$lang$applyTo;
      return G__11217
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__11220 = null;
      var G__11220__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__11220__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__11220__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__11220__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__11220__4 = function() {
        var G__11221__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11221 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11221__delegate.call(this, x, y, z, args)
        };
        G__11221.cljs$lang$maxFixedArity = 3;
        G__11221.cljs$lang$applyTo = function(arglist__11222) {
          var x = cljs.core.first(arglist__11222);
          var y = cljs.core.first(cljs.core.next(arglist__11222));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11222)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11222)));
          return G__11221__delegate(x, y, z, args)
        };
        G__11221.cljs$lang$arity$variadic = G__11221__delegate;
        return G__11221
      }();
      G__11220 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11220__0.call(this);
          case 1:
            return G__11220__1.call(this, x);
          case 2:
            return G__11220__2.call(this, x, y);
          case 3:
            return G__11220__3.call(this, x, y, z);
          default:
            return G__11220__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11220.cljs$lang$maxFixedArity = 3;
      G__11220.cljs$lang$applyTo = G__11220__4.cljs$lang$applyTo;
      return G__11220
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__11223 = null;
      var G__11223__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__11223__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__11223__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__11223__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__11223__4 = function() {
        var G__11224__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__11224 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11224__delegate.call(this, x, y, z, args)
        };
        G__11224.cljs$lang$maxFixedArity = 3;
        G__11224.cljs$lang$applyTo = function(arglist__11225) {
          var x = cljs.core.first(arglist__11225);
          var y = cljs.core.first(cljs.core.next(arglist__11225));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11225)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11225)));
          return G__11224__delegate(x, y, z, args)
        };
        G__11224.cljs$lang$arity$variadic = G__11224__delegate;
        return G__11224
      }();
      G__11223 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11223__0.call(this);
          case 1:
            return G__11223__1.call(this, x);
          case 2:
            return G__11223__2.call(this, x, y);
          case 3:
            return G__11223__3.call(this, x, y, z);
          default:
            return G__11223__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11223.cljs$lang$maxFixedArity = 3;
      G__11223.cljs$lang$applyTo = G__11223__4.cljs$lang$applyTo;
      return G__11223
    }()
  };
  var juxt__4 = function() {
    var G__11226__delegate = function(f, g, h, fs) {
      var fs__11216 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__11227 = null;
        var G__11227__0 = function() {
          return cljs.core.reduce.call(null, function(p1__11202_SHARP_, p2__11203_SHARP_) {
            return cljs.core.conj.call(null, p1__11202_SHARP_, p2__11203_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__11216)
        };
        var G__11227__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__11204_SHARP_, p2__11205_SHARP_) {
            return cljs.core.conj.call(null, p1__11204_SHARP_, p2__11205_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__11216)
        };
        var G__11227__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__11206_SHARP_, p2__11207_SHARP_) {
            return cljs.core.conj.call(null, p1__11206_SHARP_, p2__11207_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__11216)
        };
        var G__11227__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__11208_SHARP_, p2__11209_SHARP_) {
            return cljs.core.conj.call(null, p1__11208_SHARP_, p2__11209_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__11216)
        };
        var G__11227__4 = function() {
          var G__11228__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__11210_SHARP_, p2__11211_SHARP_) {
              return cljs.core.conj.call(null, p1__11210_SHARP_, cljs.core.apply.call(null, p2__11211_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__11216)
          };
          var G__11228 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11228__delegate.call(this, x, y, z, args)
          };
          G__11228.cljs$lang$maxFixedArity = 3;
          G__11228.cljs$lang$applyTo = function(arglist__11229) {
            var x = cljs.core.first(arglist__11229);
            var y = cljs.core.first(cljs.core.next(arglist__11229));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11229)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11229)));
            return G__11228__delegate(x, y, z, args)
          };
          G__11228.cljs$lang$arity$variadic = G__11228__delegate;
          return G__11228
        }();
        G__11227 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__11227__0.call(this);
            case 1:
              return G__11227__1.call(this, x);
            case 2:
              return G__11227__2.call(this, x, y);
            case 3:
              return G__11227__3.call(this, x, y, z);
            default:
              return G__11227__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__11227.cljs$lang$maxFixedArity = 3;
        G__11227.cljs$lang$applyTo = G__11227__4.cljs$lang$applyTo;
        return G__11227
      }()
    };
    var G__11226 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11226__delegate.call(this, f, g, h, fs)
    };
    G__11226.cljs$lang$maxFixedArity = 3;
    G__11226.cljs$lang$applyTo = function(arglist__11230) {
      var f = cljs.core.first(arglist__11230);
      var g = cljs.core.first(cljs.core.next(arglist__11230));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11230)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11230)));
      return G__11226__delegate(f, g, h, fs)
    };
    G__11226.cljs$lang$arity$variadic = G__11226__delegate;
    return G__11226
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
        var G__11232 = cljs.core.next.call(null, coll);
        coll = G__11232;
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
        var and__3822__auto____11231 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____11231)) {
          return n > 0
        }else {
          return and__3822__auto____11231
        }
      }())) {
        var G__11233 = n - 1;
        var G__11234 = cljs.core.next.call(null, coll);
        n = G__11233;
        coll = G__11234;
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
  var matches__11235 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__11235), s)) {
    if(cljs.core.count.call(null, matches__11235) === 1) {
      return cljs.core.first.call(null, matches__11235)
    }else {
      return cljs.core.vec.call(null, matches__11235)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__11236 = re.exec(s);
  if(matches__11236 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__11236) === 1) {
      return cljs.core.first.call(null, matches__11236)
    }else {
      return cljs.core.vec.call(null, matches__11236)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__11237 = cljs.core.re_find.call(null, re, s);
  var match_idx__11238 = s.search(re);
  var match_str__11239 = cljs.core.coll_QMARK_.call(null, match_data__11237) ? cljs.core.first.call(null, match_data__11237) : match_data__11237;
  var post_match__11240 = cljs.core.subs.call(null, s, match_idx__11238 + cljs.core.count.call(null, match_str__11239));
  if(cljs.core.truth_(match_data__11237)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__11237, re_seq.call(null, re, post_match__11240))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__11242__11243 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___11244 = cljs.core.nth.call(null, vec__11242__11243, 0, null);
  var flags__11245 = cljs.core.nth.call(null, vec__11242__11243, 1, null);
  var pattern__11246 = cljs.core.nth.call(null, vec__11242__11243, 2, null);
  return new RegExp(pattern__11246, flags__11245)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__11241_SHARP_) {
    return print_one.call(null, p1__11241_SHARP_, opts)
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
          var and__3822__auto____11247 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____11247)) {
            var and__3822__auto____11251 = function() {
              var G__11248__11249 = obj;
              if(G__11248__11249 != null) {
                if(function() {
                  var or__3824__auto____11250 = G__11248__11249.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____11250) {
                    return or__3824__auto____11250
                  }else {
                    return G__11248__11249.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__11248__11249.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11248__11249)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11248__11249)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____11251)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____11251
            }
          }else {
            return and__3822__auto____11247
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____11252 = obj != null;
          if(and__3822__auto____11252) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____11252
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__11253__11254 = obj;
          if(G__11253__11254 != null) {
            if(function() {
              var or__3824__auto____11255 = G__11253__11254.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____11255) {
                return or__3824__auto____11255
              }else {
                return G__11253__11254.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__11253__11254.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11253__11254)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11253__11254)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__11256 = cljs.core.first.call(null, objs);
  var sb__11257 = new goog.string.StringBuffer;
  var G__11258__11259 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11258__11259)) {
    var obj__11260 = cljs.core.first.call(null, G__11258__11259);
    var G__11258__11261 = G__11258__11259;
    while(true) {
      if(obj__11260 === first_obj__11256) {
      }else {
        sb__11257.append(" ")
      }
      var G__11262__11263 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11260, opts));
      if(cljs.core.truth_(G__11262__11263)) {
        var string__11264 = cljs.core.first.call(null, G__11262__11263);
        var G__11262__11265 = G__11262__11263;
        while(true) {
          sb__11257.append(string__11264);
          var temp__3974__auto____11266 = cljs.core.next.call(null, G__11262__11265);
          if(cljs.core.truth_(temp__3974__auto____11266)) {
            var G__11262__11267 = temp__3974__auto____11266;
            var G__11270 = cljs.core.first.call(null, G__11262__11267);
            var G__11271 = G__11262__11267;
            string__11264 = G__11270;
            G__11262__11265 = G__11271;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11268 = cljs.core.next.call(null, G__11258__11261);
      if(cljs.core.truth_(temp__3974__auto____11268)) {
        var G__11258__11269 = temp__3974__auto____11268;
        var G__11272 = cljs.core.first.call(null, G__11258__11269);
        var G__11273 = G__11258__11269;
        obj__11260 = G__11272;
        G__11258__11261 = G__11273;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__11257
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__11274 = cljs.core.pr_sb.call(null, objs, opts);
  sb__11274.append("\n");
  return[cljs.core.str(sb__11274)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__11275 = cljs.core.first.call(null, objs);
  var G__11276__11277 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11276__11277)) {
    var obj__11278 = cljs.core.first.call(null, G__11276__11277);
    var G__11276__11279 = G__11276__11277;
    while(true) {
      if(obj__11278 === first_obj__11275) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__11280__11281 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11278, opts));
      if(cljs.core.truth_(G__11280__11281)) {
        var string__11282 = cljs.core.first.call(null, G__11280__11281);
        var G__11280__11283 = G__11280__11281;
        while(true) {
          cljs.core.string_print.call(null, string__11282);
          var temp__3974__auto____11284 = cljs.core.next.call(null, G__11280__11283);
          if(cljs.core.truth_(temp__3974__auto____11284)) {
            var G__11280__11285 = temp__3974__auto____11284;
            var G__11288 = cljs.core.first.call(null, G__11280__11285);
            var G__11289 = G__11280__11285;
            string__11282 = G__11288;
            G__11280__11283 = G__11289;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11286 = cljs.core.next.call(null, G__11276__11279);
      if(cljs.core.truth_(temp__3974__auto____11286)) {
        var G__11276__11287 = temp__3974__auto____11286;
        var G__11290 = cljs.core.first.call(null, G__11276__11287);
        var G__11291 = G__11276__11287;
        obj__11278 = G__11290;
        G__11276__11279 = G__11291;
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
  pr_str.cljs$lang$applyTo = function(arglist__11292) {
    var objs = cljs.core.seq(arglist__11292);
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
  prn_str.cljs$lang$applyTo = function(arglist__11293) {
    var objs = cljs.core.seq(arglist__11293);
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
  pr.cljs$lang$applyTo = function(arglist__11294) {
    var objs = cljs.core.seq(arglist__11294);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__11295) {
    var objs = cljs.core.seq(arglist__11295);
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
  print_str.cljs$lang$applyTo = function(arglist__11296) {
    var objs = cljs.core.seq(arglist__11296);
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
  println.cljs$lang$applyTo = function(arglist__11297) {
    var objs = cljs.core.seq(arglist__11297);
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
  println_str.cljs$lang$applyTo = function(arglist__11298) {
    var objs = cljs.core.seq(arglist__11298);
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
  prn.cljs$lang$applyTo = function(arglist__11299) {
    var objs = cljs.core.seq(arglist__11299);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11300 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11300, "{", ", ", "}", opts, coll)
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
  var pr_pair__11301 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11301, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11302 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11302, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____11303 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____11303)) {
        var nspc__11304 = temp__3974__auto____11303;
        return[cljs.core.str(nspc__11304), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____11305 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____11305)) {
          var nspc__11306 = temp__3974__auto____11305;
          return[cljs.core.str(nspc__11306), cljs.core.str("/")].join("")
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
  var pr_pair__11307 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11307, "{", ", ", "}", opts, coll)
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
  var pr_pair__11308 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11308, "{", ", ", "}", opts, coll)
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
  var this__11309 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11310 = this;
  var G__11311__11312 = cljs.core.seq.call(null, this__11310.watches);
  if(cljs.core.truth_(G__11311__11312)) {
    var G__11314__11316 = cljs.core.first.call(null, G__11311__11312);
    var vec__11315__11317 = G__11314__11316;
    var key__11318 = cljs.core.nth.call(null, vec__11315__11317, 0, null);
    var f__11319 = cljs.core.nth.call(null, vec__11315__11317, 1, null);
    var G__11311__11320 = G__11311__11312;
    var G__11314__11321 = G__11314__11316;
    var G__11311__11322 = G__11311__11320;
    while(true) {
      var vec__11323__11324 = G__11314__11321;
      var key__11325 = cljs.core.nth.call(null, vec__11323__11324, 0, null);
      var f__11326 = cljs.core.nth.call(null, vec__11323__11324, 1, null);
      var G__11311__11327 = G__11311__11322;
      f__11326.call(null, key__11325, this$, oldval, newval);
      var temp__3974__auto____11328 = cljs.core.next.call(null, G__11311__11327);
      if(cljs.core.truth_(temp__3974__auto____11328)) {
        var G__11311__11329 = temp__3974__auto____11328;
        var G__11336 = cljs.core.first.call(null, G__11311__11329);
        var G__11337 = G__11311__11329;
        G__11314__11321 = G__11336;
        G__11311__11322 = G__11337;
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
  var this__11330 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11330.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11331 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11331.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11332 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__11332.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__11333 = this;
  return this__11333.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11334 = this;
  return this__11334.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11335 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__11344__delegate = function(x, p__11338) {
      var map__11339__11340 = p__11338;
      var map__11339__11341 = cljs.core.seq_QMARK_.call(null, map__11339__11340) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11339__11340) : map__11339__11340;
      var validator__11342 = cljs.core.get.call(null, map__11339__11341, "\ufdd0'validator");
      var meta__11343 = cljs.core.get.call(null, map__11339__11341, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__11343, validator__11342, null)
    };
    var G__11344 = function(x, var_args) {
      var p__11338 = null;
      if(goog.isDef(var_args)) {
        p__11338 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11344__delegate.call(this, x, p__11338)
    };
    G__11344.cljs$lang$maxFixedArity = 1;
    G__11344.cljs$lang$applyTo = function(arglist__11345) {
      var x = cljs.core.first(arglist__11345);
      var p__11338 = cljs.core.rest(arglist__11345);
      return G__11344__delegate(x, p__11338)
    };
    G__11344.cljs$lang$arity$variadic = G__11344__delegate;
    return G__11344
  }();
  atom = function(x, var_args) {
    var p__11338 = var_args;
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
  var temp__3974__auto____11346 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____11346)) {
    var validate__11347 = temp__3974__auto____11346;
    if(cljs.core.truth_(validate__11347.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__11348 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__11348, new_value);
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
    var G__11349__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__11349 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11349__delegate.call(this, a, f, x, y, z, more)
    };
    G__11349.cljs$lang$maxFixedArity = 5;
    G__11349.cljs$lang$applyTo = function(arglist__11350) {
      var a = cljs.core.first(arglist__11350);
      var f = cljs.core.first(cljs.core.next(arglist__11350));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11350)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11350))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11350)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11350)))));
      return G__11349__delegate(a, f, x, y, z, more)
    };
    G__11349.cljs$lang$arity$variadic = G__11349__delegate;
    return G__11349
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__11351) {
    var iref = cljs.core.first(arglist__11351);
    var f = cljs.core.first(cljs.core.next(arglist__11351));
    var args = cljs.core.rest(cljs.core.next(arglist__11351));
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
  var this__11352 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__11352.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11353 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__11353.state, function(p__11354) {
    var curr_state__11355 = p__11354;
    var curr_state__11356 = cljs.core.seq_QMARK_.call(null, curr_state__11355) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__11355) : curr_state__11355;
    var done__11357 = cljs.core.get.call(null, curr_state__11356, "\ufdd0'done");
    if(cljs.core.truth_(done__11357)) {
      return curr_state__11356
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__11353.f.call(null)})
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
    var map__11358__11359 = options;
    var map__11358__11360 = cljs.core.seq_QMARK_.call(null, map__11358__11359) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11358__11359) : map__11358__11359;
    var keywordize_keys__11361 = cljs.core.get.call(null, map__11358__11360, "\ufdd0'keywordize-keys");
    var keyfn__11362 = cljs.core.truth_(keywordize_keys__11361) ? cljs.core.keyword : cljs.core.str;
    var f__11368 = function thisfn(x) {
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
                var iter__625__auto____11367 = function iter__11363(s__11364) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11364__11365 = s__11364;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__11364__11365))) {
                        var k__11366 = cljs.core.first.call(null, s__11364__11365);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__11362.call(null, k__11366), thisfn.call(null, x[k__11366])]), iter__11363.call(null, cljs.core.rest.call(null, s__11364__11365)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____11367.call(null, cljs.core.js_keys.call(null, x))
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
    return f__11368.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11369) {
    var x = cljs.core.first(arglist__11369);
    var options = cljs.core.rest(arglist__11369);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11370 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__11374__delegate = function(args) {
      var temp__3971__auto____11371 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__11370), args);
      if(cljs.core.truth_(temp__3971__auto____11371)) {
        var v__11372 = temp__3971__auto____11371;
        return v__11372
      }else {
        var ret__11373 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11370, cljs.core.assoc, args, ret__11373);
        return ret__11373
      }
    };
    var G__11374 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11374__delegate.call(this, args)
    };
    G__11374.cljs$lang$maxFixedArity = 0;
    G__11374.cljs$lang$applyTo = function(arglist__11375) {
      var args = cljs.core.seq(arglist__11375);
      return G__11374__delegate(args)
    };
    G__11374.cljs$lang$arity$variadic = G__11374__delegate;
    return G__11374
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__11376 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__11376)) {
        var G__11377 = ret__11376;
        f = G__11377;
        continue
      }else {
        return ret__11376
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__11378__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11378 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11378__delegate.call(this, f, args)
    };
    G__11378.cljs$lang$maxFixedArity = 1;
    G__11378.cljs$lang$applyTo = function(arglist__11379) {
      var f = cljs.core.first(arglist__11379);
      var args = cljs.core.rest(arglist__11379);
      return G__11378__delegate(f, args)
    };
    G__11378.cljs$lang$arity$variadic = G__11378__delegate;
    return G__11378
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
    var k__11380 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11380, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__11380, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3824__auto____11381 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____11381) {
      return or__3824__auto____11381
    }else {
      var or__3824__auto____11382 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____11382) {
        return or__3824__auto____11382
      }else {
        var and__3822__auto____11383 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____11383) {
          var and__3822__auto____11384 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____11384) {
            var and__3822__auto____11385 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____11385) {
              var ret__11386 = true;
              var i__11387 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____11388 = cljs.core.not.call(null, ret__11386);
                  if(or__3824__auto____11388) {
                    return or__3824__auto____11388
                  }else {
                    return i__11387 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__11386
                }else {
                  var G__11389 = isa_QMARK_.call(null, h, child.call(null, i__11387), parent.call(null, i__11387));
                  var G__11390 = i__11387 + 1;
                  ret__11386 = G__11389;
                  i__11387 = G__11390;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____11385
            }
          }else {
            return and__3822__auto____11384
          }
        }else {
          return and__3822__auto____11383
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
    var tp__11394 = "\ufdd0'parents".call(null, h);
    var td__11395 = "\ufdd0'descendants".call(null, h);
    var ta__11396 = "\ufdd0'ancestors".call(null, h);
    var tf__11397 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____11398 = cljs.core.contains_QMARK_.call(null, tp__11394.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__11396.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__11396.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__11394, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__11397.call(null, "\ufdd0'ancestors".call(null, h), tag, td__11395, parent, ta__11396), "\ufdd0'descendants":tf__11397.call(null, "\ufdd0'descendants".call(null, h), parent, ta__11396, tag, td__11395)})
    }();
    if(cljs.core.truth_(or__3824__auto____11398)) {
      return or__3824__auto____11398
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
    var parentMap__11399 = "\ufdd0'parents".call(null, h);
    var childsParents__11400 = cljs.core.truth_(parentMap__11399.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11399.call(null, tag), parent) : cljs.core.set([]);
    var newParents__11401 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11400)) ? cljs.core.assoc.call(null, parentMap__11399, tag, childsParents__11400) : cljs.core.dissoc.call(null, parentMap__11399, tag);
    var deriv_seq__11402 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11391_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11391_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11391_SHARP_), cljs.core.second.call(null, p1__11391_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11401)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11399.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__11392_SHARP_, p2__11393_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11392_SHARP_, p2__11393_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11402))
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
  var xprefs__11403 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____11405 = cljs.core.truth_(function() {
    var and__3822__auto____11404 = xprefs__11403;
    if(cljs.core.truth_(and__3822__auto____11404)) {
      return xprefs__11403.call(null, y)
    }else {
      return and__3822__auto____11404
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____11405)) {
    return or__3824__auto____11405
  }else {
    var or__3824__auto____11407 = function() {
      var ps__11406 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11406) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11406), prefer_table))) {
          }else {
          }
          var G__11410 = cljs.core.rest.call(null, ps__11406);
          ps__11406 = G__11410;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11407)) {
      return or__3824__auto____11407
    }else {
      var or__3824__auto____11409 = function() {
        var ps__11408 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11408) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11408), y, prefer_table))) {
            }else {
            }
            var G__11411 = cljs.core.rest.call(null, ps__11408);
            ps__11408 = G__11411;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____11409)) {
        return or__3824__auto____11409
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____11412 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____11412)) {
    return or__3824__auto____11412
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11421 = cljs.core.reduce.call(null, function(be, p__11413) {
    var vec__11414__11415 = p__11413;
    var k__11416 = cljs.core.nth.call(null, vec__11414__11415, 0, null);
    var ___11417 = cljs.core.nth.call(null, vec__11414__11415, 1, null);
    var e__11418 = vec__11414__11415;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11416)) {
      var be2__11420 = cljs.core.truth_(function() {
        var or__3824__auto____11419 = be == null;
        if(or__3824__auto____11419) {
          return or__3824__auto____11419
        }else {
          return cljs.core.dominates.call(null, k__11416, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11418 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11420), k__11416, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11416), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11420)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11420
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11421)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11421));
      return cljs.core.second.call(null, best_entry__11421)
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
    var and__3822__auto____11422 = mf;
    if(and__3822__auto____11422) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____11422
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11423 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11423) {
        return or__3824__auto____11423
      }else {
        var or__3824__auto____11424 = cljs.core._reset["_"];
        if(or__3824__auto____11424) {
          return or__3824__auto____11424
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____11425 = mf;
    if(and__3822__auto____11425) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____11425
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____11426 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11426) {
        return or__3824__auto____11426
      }else {
        var or__3824__auto____11427 = cljs.core._add_method["_"];
        if(or__3824__auto____11427) {
          return or__3824__auto____11427
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11428 = mf;
    if(and__3822__auto____11428) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____11428
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____11429 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11429) {
        return or__3824__auto____11429
      }else {
        var or__3824__auto____11430 = cljs.core._remove_method["_"];
        if(or__3824__auto____11430) {
          return or__3824__auto____11430
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____11431 = mf;
    if(and__3822__auto____11431) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____11431
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____11432 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11432) {
        return or__3824__auto____11432
      }else {
        var or__3824__auto____11433 = cljs.core._prefer_method["_"];
        if(or__3824__auto____11433) {
          return or__3824__auto____11433
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11434 = mf;
    if(and__3822__auto____11434) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____11434
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____11435 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11435) {
        return or__3824__auto____11435
      }else {
        var or__3824__auto____11436 = cljs.core._get_method["_"];
        if(or__3824__auto____11436) {
          return or__3824__auto____11436
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____11437 = mf;
    if(and__3822__auto____11437) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____11437
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11438 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11438) {
        return or__3824__auto____11438
      }else {
        var or__3824__auto____11439 = cljs.core._methods["_"];
        if(or__3824__auto____11439) {
          return or__3824__auto____11439
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____11440 = mf;
    if(and__3822__auto____11440) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____11440
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11441 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11441) {
        return or__3824__auto____11441
      }else {
        var or__3824__auto____11442 = cljs.core._prefers["_"];
        if(or__3824__auto____11442) {
          return or__3824__auto____11442
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____11443 = mf;
    if(and__3822__auto____11443) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____11443
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____11444 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11444) {
        return or__3824__auto____11444
      }else {
        var or__3824__auto____11445 = cljs.core._dispatch["_"];
        if(or__3824__auto____11445) {
          return or__3824__auto____11445
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11446 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11447 = cljs.core._get_method.call(null, mf, dispatch_val__11446);
  if(cljs.core.truth_(target_fn__11447)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__11446)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__11447, args)
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
  var this__11448 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__11449 = this;
  cljs.core.swap_BANG_.call(null, this__11449.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11449.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11449.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11449.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__11450 = this;
  cljs.core.swap_BANG_.call(null, this__11450.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11450.method_cache, this__11450.method_table, this__11450.cached_hierarchy, this__11450.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__11451 = this;
  cljs.core.swap_BANG_.call(null, this__11451.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11451.method_cache, this__11451.method_table, this__11451.cached_hierarchy, this__11451.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__11452 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11452.cached_hierarchy), cljs.core.deref.call(null, this__11452.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__11452.method_cache, this__11452.method_table, this__11452.cached_hierarchy, this__11452.hierarchy)
  }
  var temp__3971__auto____11453 = cljs.core.deref.call(null, this__11452.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____11453)) {
    var target_fn__11454 = temp__3971__auto____11453;
    return target_fn__11454
  }else {
    var temp__3971__auto____11455 = cljs.core.find_and_cache_best_method.call(null, this__11452.name, dispatch_val, this__11452.hierarchy, this__11452.method_table, this__11452.prefer_table, this__11452.method_cache, this__11452.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____11455)) {
      var target_fn__11456 = temp__3971__auto____11455;
      return target_fn__11456
    }else {
      return cljs.core.deref.call(null, this__11452.method_table).call(null, this__11452.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11457 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11457.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11457.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11457.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11457.method_cache, this__11457.method_table, this__11457.cached_hierarchy, this__11457.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11458 = this;
  return cljs.core.deref.call(null, this__11458.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11459 = this;
  return cljs.core.deref.call(null, this__11459.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11460 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11460.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11461__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__11461 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11461__delegate.call(this, _, args)
  };
  G__11461.cljs$lang$maxFixedArity = 1;
  G__11461.cljs$lang$applyTo = function(arglist__11462) {
    var _ = cljs.core.first(arglist__11462);
    var args = cljs.core.rest(arglist__11462);
    return G__11461__delegate(_, args)
  };
  G__11461.cljs$lang$arity$variadic = G__11461__delegate;
  return G__11461
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
      var s__9084 = s;
      var limit__9085 = limit;
      var parts__9086 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__9085, 1)) {
          return cljs.core.conj.call(null, parts__9086, s__9084)
        }else {
          var temp__3971__auto____9087 = cljs.core.re_find.call(null, re, s__9084);
          if(cljs.core.truth_(temp__3971__auto____9087)) {
            var m__9088 = temp__3971__auto____9087;
            var index__9089 = s__9084.indexOf(m__9088);
            var G__9090 = s__9084.substring(index__9089 + cljs.core.count.call(null, m__9088));
            var G__9091 = limit__9085 - 1;
            var G__9092 = cljs.core.conj.call(null, parts__9086, s__9084.substring(0, index__9089));
            s__9084 = G__9090;
            limit__9085 = G__9091;
            parts__9086 = G__9092;
            continue
          }else {
            return cljs.core.conj.call(null, parts__9086, s__9084)
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
  var index__9093 = s.length;
  while(true) {
    if(index__9093 === 0) {
      return""
    }else {
      var ch__9094 = cljs.core.get.call(null, s, index__9093 - 1);
      if(function() {
        var or__3824__auto____9095 = cljs.core._EQ_.call(null, ch__9094, "\n");
        if(or__3824__auto____9095) {
          return or__3824__auto____9095
        }else {
          return cljs.core._EQ_.call(null, ch__9094, "\r")
        }
      }()) {
        var G__9096 = index__9093 - 1;
        index__9093 = G__9096;
        continue
      }else {
        return s.substring(0, index__9093)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__9097 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____9098 = cljs.core.not.call(null, s__9097);
    if(or__3824__auto____9098) {
      return or__3824__auto____9098
    }else {
      var or__3824__auto____9099 = cljs.core._EQ_.call(null, "", s__9097);
      if(or__3824__auto____9099) {
        return or__3824__auto____9099
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__9097)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__9100 = new goog.string.StringBuffer;
  var length__9101 = s.length;
  var index__9102 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__9101, index__9102)) {
      return buffer__9100.toString()
    }else {
      var ch__9103 = s.charAt(index__9102);
      var temp__3971__auto____9104 = cljs.core.get.call(null, cmap, ch__9103);
      if(cljs.core.truth_(temp__3971__auto____9104)) {
        var replacement__9105 = temp__3971__auto____9104;
        buffer__9100.append([cljs.core.str(replacement__9105)].join(""))
      }else {
        buffer__9100.append(ch__9103)
      }
      var G__9106 = index__9102 + 1;
      index__9102 = G__9106;
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
      var or__3824__auto____9068 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____9068) {
        return or__3824__auto____9068
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
    var G__9069__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9070 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__9071 = cljs.core.next.call(null, more);
            s = G__9070;
            more = G__9071;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__9069 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9069__delegate.call(this, x, xs)
    };
    G__9069.cljs$lang$maxFixedArity = 1;
    G__9069.cljs$lang$applyTo = function(arglist__9072) {
      var x = cljs.core.first(arglist__9072);
      var xs = cljs.core.rest(arglist__9072);
      return G__9069__delegate(x, xs)
    };
    G__9069.cljs$lang$arity$variadic = G__9069__delegate;
    return G__9069
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
    var iter__625__auto____9080 = function iter__9073(s__9074) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__9074__9075 = s__9074;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__9074__9075))) {
            var vec__9076__9077 = cljs.core.first.call(null, s__9074__9075);
            var k__9078 = cljs.core.nth.call(null, vec__9076__9077, 0, null);
            var v__9079 = cljs.core.nth.call(null, vec__9076__9077, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__9078)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__9079))].join(""), iter__9073.call(null, cljs.core.rest.call(null, s__9074__9075)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____9080.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__9081 = cljs.core.last.call(null, args);
    var args__9082 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__9082)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__9081) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__9081))].join("") : params__9081)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__9083) {
    var args = cljs.core.seq(arglist__9083);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__11571 = {};
  var G__11572__11573 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__11572__11573)) {
    var G__11575__11577 = cljs.core.first.call(null, G__11572__11573);
    var vec__11576__11578 = G__11575__11577;
    var k__11579 = cljs.core.nth.call(null, vec__11576__11578, 0, null);
    var v__11580 = cljs.core.nth.call(null, vec__11576__11578, 1, null);
    var G__11572__11581 = G__11572__11573;
    var G__11575__11582 = G__11575__11577;
    var G__11572__11583 = G__11572__11581;
    while(true) {
      var vec__11584__11585 = G__11575__11582;
      var k__11586 = cljs.core.nth.call(null, vec__11584__11585, 0, null);
      var v__11587 = cljs.core.nth.call(null, vec__11584__11585, 1, null);
      var G__11572__11588 = G__11572__11583;
      out__11571[cljs.core.name.call(null, k__11586)] = v__11587;
      var temp__3974__auto____11589 = cljs.core.next.call(null, G__11572__11588);
      if(cljs.core.truth_(temp__3974__auto____11589)) {
        var G__11572__11590 = temp__3974__auto____11589;
        var G__11591 = cljs.core.first.call(null, G__11572__11590);
        var G__11592 = G__11572__11590;
        G__11575__11582 = G__11591;
        G__11572__11583 = G__11592;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__11571
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__11593 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__11593)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__11594) {
    var v = cljs.core.first(arglist__11594);
    var text = cljs.core.rest(arglist__11594);
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
        return cljs.core.reduce.call(null, function(m, p__11595) {
          var vec__11596__11597 = p__11595;
          var k__11598 = cljs.core.nth.call(null, vec__11596__11597, 0, null);
          var v__11599 = cljs.core.nth.call(null, vec__11596__11597, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__11598), clj__GT_js.call(null, v__11599))
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
      var temp__3971__auto____11463 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____11463)) {
        var cm__11464 = temp__3971__auto____11463;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__11464), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__11465) {
    var vec__11466__11467 = p__11465;
    var context__11468 = cljs.core.nth.call(null, vec__11466__11467, 0, null);
    if(cljs.core.not.call(null, context__11468)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__11468)
    }
  };
  var $ = function(sel, var_args) {
    var p__11465 = null;
    if(goog.isDef(var_args)) {
      p__11465 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__11465)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__11469) {
    var sel = cljs.core.first(arglist__11469);
    var p__11465 = cljs.core.rest(arglist__11469);
    return $__delegate(sel, p__11465)
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
  var or__3824__auto____11470 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____11470)) {
    return or__3824__auto____11470
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
  var G__11471 = null;
  var G__11471__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__11471__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__11471 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11471__2.call(this, _, k);
      case 3:
        return G__11471__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11471
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
  var attr__delegate = function($elem, a, p__11472) {
    var vec__11473__11474 = p__11472;
    var v__11475 = cljs.core.nth.call(null, vec__11473__11474, 0, null);
    var a__11476 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__11475)) {
      return $elem.attr(a__11476)
    }else {
      return $elem.attr(a__11476, v__11475)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__11472 = null;
    if(goog.isDef(var_args)) {
      p__11472 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__11472)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__11477) {
    var $elem = cljs.core.first(arglist__11477);
    var a = cljs.core.first(cljs.core.next(arglist__11477));
    var p__11472 = cljs.core.rest(cljs.core.next(arglist__11477));
    return attr__delegate($elem, a, p__11472)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__11478) {
    var vec__11479__11480 = p__11478;
    var v__11481 = cljs.core.nth.call(null, vec__11479__11480, 0, null);
    var k__11482 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__11481)) {
      return $elem.data(k__11482)
    }else {
      return $elem.data(k__11482, v__11481)
    }
  };
  var data = function($elem, k, var_args) {
    var p__11478 = null;
    if(goog.isDef(var_args)) {
      p__11478 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__11478)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__11483) {
    var $elem = cljs.core.first(arglist__11483);
    var k = cljs.core.first(cljs.core.next(arglist__11483));
    var p__11478 = cljs.core.rest(cljs.core.next(arglist__11483));
    return data__delegate($elem, k, p__11478)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__11484 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__11484)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__11485 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__11485)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__11486 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__11486)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__11487 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__11487)
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
  var hide__delegate = function($elem, p__11488) {
    var vec__11489__11490 = p__11488;
    var speed__11491 = cljs.core.nth.call(null, vec__11489__11490, 0, null);
    var on_finish__11492 = cljs.core.nth.call(null, vec__11489__11490, 1, null);
    return $elem.hide(speed__11491, on_finish__11492)
  };
  var hide = function($elem, var_args) {
    var p__11488 = null;
    if(goog.isDef(var_args)) {
      p__11488 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__11488)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__11493) {
    var $elem = cljs.core.first(arglist__11493);
    var p__11488 = cljs.core.rest(arglist__11493);
    return hide__delegate($elem, p__11488)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__11494) {
    var vec__11495__11496 = p__11494;
    var speed__11497 = cljs.core.nth.call(null, vec__11495__11496, 0, null);
    var on_finish__11498 = cljs.core.nth.call(null, vec__11495__11496, 1, null);
    return $elem.show(speed__11497, on_finish__11498)
  };
  var show = function($elem, var_args) {
    var p__11494 = null;
    if(goog.isDef(var_args)) {
      p__11494 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__11494)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__11499) {
    var $elem = cljs.core.first(arglist__11499);
    var p__11494 = cljs.core.rest(arglist__11499);
    return show__delegate($elem, p__11494)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__11500) {
    var vec__11501__11502 = p__11500;
    var speed__11503 = cljs.core.nth.call(null, vec__11501__11502, 0, null);
    var on_finish__11504 = cljs.core.nth.call(null, vec__11501__11502, 1, null);
    return $elem.toggle(speed__11503, on_finish__11504)
  };
  var toggle = function($elem, var_args) {
    var p__11500 = null;
    if(goog.isDef(var_args)) {
      p__11500 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__11500)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__11505) {
    var $elem = cljs.core.first(arglist__11505);
    var p__11500 = cljs.core.rest(arglist__11505);
    return toggle__delegate($elem, p__11500)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__11506) {
    var vec__11507__11508 = p__11506;
    var speed__11509 = cljs.core.nth.call(null, vec__11507__11508, 0, null);
    var on_finish__11510 = cljs.core.nth.call(null, vec__11507__11508, 1, null);
    return $elem.fadeOut(speed__11509, on_finish__11510)
  };
  var fade_out = function($elem, var_args) {
    var p__11506 = null;
    if(goog.isDef(var_args)) {
      p__11506 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__11506)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__11511) {
    var $elem = cljs.core.first(arglist__11511);
    var p__11506 = cljs.core.rest(arglist__11511);
    return fade_out__delegate($elem, p__11506)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__11512) {
    var vec__11513__11514 = p__11512;
    var speed__11515 = cljs.core.nth.call(null, vec__11513__11514, 0, null);
    var on_finish__11516 = cljs.core.nth.call(null, vec__11513__11514, 1, null);
    return $elem.fadeIn(speed__11515, on_finish__11516)
  };
  var fade_in = function($elem, var_args) {
    var p__11512 = null;
    if(goog.isDef(var_args)) {
      p__11512 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__11512)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__11517) {
    var $elem = cljs.core.first(arglist__11517);
    var p__11512 = cljs.core.rest(arglist__11517);
    return fade_in__delegate($elem, p__11512)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__11518) {
    var vec__11519__11520 = p__11518;
    var speed__11521 = cljs.core.nth.call(null, vec__11519__11520, 0, null);
    var on_finish__11522 = cljs.core.nth.call(null, vec__11519__11520, 1, null);
    return $elem.slideUp(speed__11521, on_finish__11522)
  };
  var slide_up = function($elem, var_args) {
    var p__11518 = null;
    if(goog.isDef(var_args)) {
      p__11518 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__11518)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__11523) {
    var $elem = cljs.core.first(arglist__11523);
    var p__11518 = cljs.core.rest(arglist__11523);
    return slide_up__delegate($elem, p__11518)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__11524) {
    var vec__11525__11526 = p__11524;
    var speed__11527 = cljs.core.nth.call(null, vec__11525__11526, 0, null);
    var on_finish__11528 = cljs.core.nth.call(null, vec__11525__11526, 1, null);
    return $elem.slideDown(speed__11527, on_finish__11528)
  };
  var slide_down = function($elem, var_args) {
    var p__11524 = null;
    if(goog.isDef(var_args)) {
      p__11524 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__11524)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__11529) {
    var $elem = cljs.core.first(arglist__11529);
    var p__11524 = cljs.core.rest(arglist__11529);
    return slide_down__delegate($elem, p__11524)
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
  var closest__delegate = function($elem, selector, p__11530) {
    var vec__11531__11532 = p__11530;
    var context__11533 = cljs.core.nth.call(null, vec__11531__11532, 0, null);
    return $elem.closest(selector, context__11533)
  };
  var closest = function($elem, selector, var_args) {
    var p__11530 = null;
    if(goog.isDef(var_args)) {
      p__11530 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__11530)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__11534) {
    var $elem = cljs.core.first(arglist__11534);
    var selector = cljs.core.first(cljs.core.next(arglist__11534));
    var p__11530 = cljs.core.rest(cljs.core.next(arglist__11534));
    return closest__delegate($elem, selector, p__11530)
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
  var val__delegate = function($elem, p__11535) {
    var vec__11536__11537 = p__11535;
    var v__11538 = cljs.core.nth.call(null, vec__11536__11537, 0, null);
    if(cljs.core.truth_(v__11538)) {
      return $elem.val(v__11538)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__11535 = null;
    if(goog.isDef(var_args)) {
      p__11535 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__11535)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__11539) {
    var $elem = cljs.core.first(arglist__11539);
    var p__11535 = cljs.core.rest(arglist__11539);
    return val__delegate($elem, p__11535)
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
jayq.core.xhr = function xhr(p__11540, content, callback) {
  var vec__11541__11542 = p__11540;
  var method__11543 = cljs.core.nth.call(null, vec__11541__11542, 0, null);
  var uri__11544 = cljs.core.nth.call(null, vec__11541__11542, 1, null);
  var params__11545 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__11543)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__11544, params__11545)
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
  var unbind__delegate = function($elem, ev, p__11546) {
    var vec__11547__11548 = p__11546;
    var func__11549 = cljs.core.nth.call(null, vec__11547__11548, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__11549)
  };
  var unbind = function($elem, ev, var_args) {
    var p__11546 = null;
    if(goog.isDef(var_args)) {
      p__11546 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__11546)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__11550) {
    var $elem = cljs.core.first(arglist__11550);
    var ev = cljs.core.first(cljs.core.next(arglist__11550));
    var p__11546 = cljs.core.rest(cljs.core.next(arglist__11550));
    return unbind__delegate($elem, ev, p__11546)
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
  var on__delegate = function($elem, events, p__11551) {
    var vec__11552__11553 = p__11551;
    var sel__11554 = cljs.core.nth.call(null, vec__11552__11553, 0, null);
    var data__11555 = cljs.core.nth.call(null, vec__11552__11553, 1, null);
    var handler__11556 = cljs.core.nth.call(null, vec__11552__11553, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11554), data__11555, handler__11556)
  };
  var on = function($elem, events, var_args) {
    var p__11551 = null;
    if(goog.isDef(var_args)) {
      p__11551 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__11551)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__11557) {
    var $elem = cljs.core.first(arglist__11557);
    var events = cljs.core.first(cljs.core.next(arglist__11557));
    var p__11551 = cljs.core.rest(cljs.core.next(arglist__11557));
    return on__delegate($elem, events, p__11551)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__11558) {
    var vec__11559__11560 = p__11558;
    var sel__11561 = cljs.core.nth.call(null, vec__11559__11560, 0, null);
    var data__11562 = cljs.core.nth.call(null, vec__11559__11560, 1, null);
    var handler__11563 = cljs.core.nth.call(null, vec__11559__11560, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11561), data__11562, handler__11563)
  };
  var one = function($elem, events, var_args) {
    var p__11558 = null;
    if(goog.isDef(var_args)) {
      p__11558 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__11558)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__11564) {
    var $elem = cljs.core.first(arglist__11564);
    var events = cljs.core.first(cljs.core.next(arglist__11564));
    var p__11558 = cljs.core.rest(cljs.core.next(arglist__11564));
    return one__delegate($elem, events, p__11558)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__11565) {
    var vec__11566__11567 = p__11565;
    var sel__11568 = cljs.core.nth.call(null, vec__11566__11567, 0, null);
    var handler__11569 = cljs.core.nth.call(null, vec__11566__11567, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11568), handler__11569)
  };
  var off = function($elem, events, var_args) {
    var p__11565 = null;
    if(goog.isDef(var_args)) {
      p__11565 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__11565)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__11570) {
    var $elem = cljs.core.first(arglist__11570);
    var events = cljs.core.first(cljs.core.next(arglist__11570));
    var p__11565 = cljs.core.rest(cljs.core.next(arglist__11570));
    return off__delegate($elem, events, p__11565)
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
    var and__3822__auto____11626 = reader;
    if(and__3822__auto____11626) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____11626
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3824__auto____11627 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3824__auto____11627) {
        return or__3824__auto____11627
      }else {
        var or__3824__auto____11628 = cljs.reader.read_char["_"];
        if(or__3824__auto____11628) {
          return or__3824__auto____11628
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____11629 = reader;
    if(and__3822__auto____11629) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____11629
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3824__auto____11630 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3824__auto____11630) {
        return or__3824__auto____11630
      }else {
        var or__3824__auto____11631 = cljs.reader.unread["_"];
        if(or__3824__auto____11631) {
          return or__3824__auto____11631
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
  var this__11632 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__11632.buffer_atom))) {
    var idx__11633 = cljs.core.deref.call(null, this__11632.index_atom);
    cljs.core.swap_BANG_.call(null, this__11632.index_atom, cljs.core.inc);
    return this__11632.s[idx__11633]
  }else {
    var buf__11634 = cljs.core.deref.call(null, this__11632.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__11632.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__11634)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__11635 = this;
  return cljs.core.swap_BANG_.call(null, this__11635.buffer_atom, function(p1__11625_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__11625_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____11636 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3824__auto____11636)) {
    return or__3824__auto____11636
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
  var or__3824__auto____11637 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____11637) {
    return or__3824__auto____11637
  }else {
    var and__3822__auto____11639 = function() {
      var or__3824__auto____11638 = "+" === initch;
      if(or__3824__auto____11638) {
        return or__3824__auto____11638
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____11639)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__11640 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__11640);
        return next_ch__11640
      }())
    }else {
      return and__3822__auto____11639
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
  reader_error.cljs$lang$applyTo = function(arglist__11641) {
    var rdr = cljs.core.first(arglist__11641);
    var msg = cljs.core.rest(arglist__11641);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____11642 = ch != "#";
  if(and__3822__auto____11642) {
    var and__3822__auto____11643 = ch != "'";
    if(and__3822__auto____11643) {
      var and__3822__auto____11644 = ch != ":";
      if(and__3822__auto____11644) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____11644
      }
    }else {
      return and__3822__auto____11643
    }
  }else {
    return and__3822__auto____11642
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__11645 = new goog.string.StringBuffer(initch);
  var ch__11646 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____11647 = ch__11646 == null;
      if(or__3824__auto____11647) {
        return or__3824__auto____11647
      }else {
        var or__3824__auto____11648 = cljs.reader.whitespace_QMARK_.call(null, ch__11646);
        if(or__3824__auto____11648) {
          return or__3824__auto____11648
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__11646)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__11646);
      return sb__11645.toString()
    }else {
      var G__11649 = function() {
        sb__11645.append(ch__11646);
        return sb__11645
      }();
      var G__11650 = cljs.reader.read_char.call(null, rdr);
      sb__11645 = G__11649;
      ch__11646 = G__11650;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__11651 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____11652 = ch__11651 === "n";
      if(or__3824__auto____11652) {
        return or__3824__auto____11652
      }else {
        var or__3824__auto____11653 = ch__11651 === "r";
        if(or__3824__auto____11653) {
          return or__3824__auto____11653
        }else {
          return ch__11651 == null
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
  var matches__11654 = re.exec(s);
  if(matches__11654 != null) {
    if(matches__11654.length === 1) {
      return matches__11654[0]
    }else {
      return matches__11654
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__11655 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__11656 = groups__11655[2];
  if(!function() {
    var or__3824__auto____11657 = group3__11656 == null;
    if(or__3824__auto____11657) {
      return or__3824__auto____11657
    }else {
      return group3__11656.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__11658 = "-" === groups__11655[1] ? -1 : 1;
    var a__11659 = cljs.core.truth_(groups__11655[3]) ? [groups__11655[3], 10] : cljs.core.truth_(groups__11655[4]) ? [groups__11655[4], 16] : cljs.core.truth_(groups__11655[5]) ? [groups__11655[5], 8] : cljs.core.truth_(groups__11655[7]) ? [groups__11655[7], parseInt(groups__11655[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__11660 = a__11659[0];
    var radix__11661 = a__11659[1];
    if(n__11660 == null) {
      return null
    }else {
      return negate__11658 * parseInt(n__11660, radix__11661)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__11662 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__11663 = groups__11662[1];
  var denominator__11664 = groups__11662[2];
  return parseInt(numinator__11663) / parseInt(denominator__11664)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__11665 = re.exec(s);
  if(function() {
    var and__3822__auto____11666 = matches__11665 != null;
    if(and__3822__auto____11666) {
      return matches__11665[0] === s
    }else {
      return and__3822__auto____11666
    }
  }()) {
    if(matches__11665.length === 1) {
      return matches__11665[0]
    }else {
      return matches__11665
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
  var ch__11667 = cljs.reader.read_char.call(null, reader);
  var mapresult__11668 = cljs.reader.escape_char_map.call(null, ch__11667);
  if(cljs.core.truth_(mapresult__11668)) {
    return mapresult__11668
  }else {
    if(function() {
      var or__3824__auto____11669 = "u" === ch__11667;
      if(or__3824__auto____11669) {
        return or__3824__auto____11669
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__11667)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__11667)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__11667)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__11670 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__11670))) {
      var G__11671 = cljs.reader.read_char.call(null, rdr);
      ch__11670 = G__11671;
      continue
    }else {
      return ch__11670
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__11672 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__11673 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__11673)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__11673) {
      return cljs.core.persistent_BANG_.call(null, a__11672)
    }else {
      var temp__3971__auto____11674 = cljs.reader.macros.call(null, ch__11673);
      if(cljs.core.truth_(temp__3971__auto____11674)) {
        var macrofn__11675 = temp__3971__auto____11674;
        var mret__11676 = macrofn__11675.call(null, rdr, ch__11673);
        var G__11678 = mret__11676 === rdr ? a__11672 : cljs.core.conj_BANG_.call(null, a__11672, mret__11676);
        a__11672 = G__11678;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__11673);
        var o__11677 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__11679 = o__11677 === rdr ? a__11672 : cljs.core.conj_BANG_.call(null, a__11672, o__11677);
        a__11672 = G__11679;
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
  var ch__11680 = cljs.reader.read_char.call(null, rdr);
  var dm__11681 = cljs.reader.dispatch_macros.call(null, ch__11680);
  if(cljs.core.truth_(dm__11681)) {
    return dm__11681.call(null, rdr, _)
  }else {
    var temp__3971__auto____11682 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__11680);
    if(cljs.core.truth_(temp__3971__auto____11682)) {
      var obj__11683 = temp__3971__auto____11682;
      return obj__11683
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__11680)
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
  var l__11684 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__11684))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__11684)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__11685 = new goog.string.StringBuffer(initch);
  var ch__11686 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11687 = ch__11686 == null;
      if(or__3824__auto____11687) {
        return or__3824__auto____11687
      }else {
        var or__3824__auto____11688 = cljs.reader.whitespace_QMARK_.call(null, ch__11686);
        if(or__3824__auto____11688) {
          return or__3824__auto____11688
        }else {
          return cljs.reader.macros.call(null, ch__11686)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__11686);
      var s__11689 = buffer__11685.toString();
      var or__3824__auto____11690 = cljs.reader.match_number.call(null, s__11689);
      if(cljs.core.truth_(or__3824__auto____11690)) {
        return or__3824__auto____11690
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__11689, "]")
      }
    }else {
      var G__11691 = function() {
        buffer__11685.append(ch__11686);
        return buffer__11685
      }();
      var G__11692 = cljs.reader.read_char.call(null, reader);
      buffer__11685 = G__11691;
      ch__11686 = G__11692;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__11693 = new goog.string.StringBuffer;
  var ch__11694 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__11694 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__11694) {
        var G__11695 = function() {
          buffer__11693.append(cljs.reader.escape_char.call(null, buffer__11693, reader));
          return buffer__11693
        }();
        var G__11696 = cljs.reader.read_char.call(null, reader);
        buffer__11693 = G__11695;
        ch__11694 = G__11696;
        continue
      }else {
        if('"' === ch__11694) {
          return buffer__11693.toString()
        }else {
          if("\ufdd0'default") {
            var G__11697 = function() {
              buffer__11693.append(ch__11694);
              return buffer__11693
            }();
            var G__11698 = cljs.reader.read_char.call(null, reader);
            buffer__11693 = G__11697;
            ch__11694 = G__11698;
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
  var token__11699 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__11699, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__11699, 0, token__11699.indexOf("/")), cljs.core.subs.call(null, token__11699, token__11699.indexOf("/") + 1, token__11699.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__11699, cljs.core.symbol.call(null, token__11699))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__11700 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__11701 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__11700);
  var token__11702 = a__11701[0];
  var ns__11703 = a__11701[1];
  var name__11704 = a__11701[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____11706 = function() {
      var and__3822__auto____11705 = !(void 0 === ns__11703);
      if(and__3822__auto____11705) {
        return ns__11703.substring(ns__11703.length - 2, ns__11703.length) === ":/"
      }else {
        return and__3822__auto____11705
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11706)) {
      return or__3824__auto____11706
    }else {
      var or__3824__auto____11707 = name__11704[name__11704.length - 1] === ":";
      if(or__3824__auto____11707) {
        return or__3824__auto____11707
      }else {
        return!(token__11702.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__11702)
  }else {
    if(cljs.core.truth_(ns__11703)) {
      return cljs.core.keyword.call(null, ns__11703.substring(0, ns__11703.indexOf("/")), name__11704)
    }else {
      return cljs.core.keyword.call(null, token__11702)
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
  var m__11708 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__11708)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__11709 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__11710__11711 = o__11709;
    if(G__11710__11711 != null) {
      if(function() {
        var or__3824__auto____11712 = G__11710__11711.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____11712) {
          return or__3824__auto____11712
        }else {
          return G__11710__11711.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__11710__11711.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__11710__11711)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__11710__11711)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__11709, cljs.core.merge.call(null, cljs.core.meta.call(null, o__11709), m__11708))
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
    var ch__11713 = cljs.reader.read_char.call(null, reader);
    if(ch__11713 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__11713)) {
        var G__11716 = reader;
        var G__11717 = eof_is_error;
        var G__11718 = sentinel;
        var G__11719 = is_recursive;
        reader = G__11716;
        eof_is_error = G__11717;
        sentinel = G__11718;
        is_recursive = G__11719;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__11713)) {
          var G__11720 = cljs.reader.read_comment.call(null, reader, ch__11713);
          var G__11721 = eof_is_error;
          var G__11722 = sentinel;
          var G__11723 = is_recursive;
          reader = G__11720;
          eof_is_error = G__11721;
          sentinel = G__11722;
          is_recursive = G__11723;
          continue
        }else {
          if("\ufdd0'else") {
            var f__11714 = cljs.reader.macros.call(null, ch__11713);
            var res__11715 = cljs.core.truth_(f__11714) ? f__11714.call(null, reader, ch__11713) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__11713) ? cljs.reader.read_number.call(null, reader, ch__11713) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__11713) : null;
            if(res__11715 === reader) {
              var G__11724 = reader;
              var G__11725 = eof_is_error;
              var G__11726 = sentinel;
              var G__11727 = is_recursive;
              reader = G__11724;
              eof_is_error = G__11725;
              sentinel = G__11726;
              is_recursive = G__11727;
              continue
            }else {
              return res__11715
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
  var r__11728 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__11728, true, null, false)
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
  var tag__11729 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__11730 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__11731 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__11729));
  if(cljs.core.truth_(pfn__11731)) {
    return pfn__11731.call(null, form__11730)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__11729), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__11732 = cljs.core.name.call(null, tag);
  var old_parser__11733 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__11732);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__11732, f);
  return old_parser__11733
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
        return cljs.core.reduce.call(null, function(m, p__11620) {
          var vec__11621__11622 = p__11620;
          var k__11623 = cljs.core.nth.call(null, vec__11621__11622, 0, null);
          var v__11624 = cljs.core.nth.call(null, vec__11621__11622, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__11623), clj__GT_js.call(null, v__11624))
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
      var vec__11601__11602 = route;
      var m__11603 = cljs.core.nth.call(null, vec__11601__11602, 0, null);
      var u__11604 = cljs.core.nth.call(null, vec__11601__11602, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__11603), u__11604])
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
  var cur__11605 = fetch.util.clj__GT_js.call(null, d);
  var query__11606 = goog.Uri.QueryData.createFromMap.call(null, new goog.structs.Map(cur__11605));
  return[cljs.core.str(query__11606)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__11607 = req.getResponseText();
      return callback.call(null, data__11607)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__11608) {
    var vec__11609__11610 = p__11608;
    var opts__11611 = cljs.core.nth.call(null, vec__11609__11610, 0, null);
    var req__11613 = new goog.net.XhrIo;
    var vec__11612__11614 = fetch.core.parse_route.call(null, route);
    var method__11615 = cljs.core.nth.call(null, vec__11612__11614, 0, null);
    var uri__11616 = cljs.core.nth.call(null, vec__11612__11614, 1, null);
    var data__11617 = fetch.core.__GT_data.call(null, content);
    var callback__11618 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__11618)) {
      goog.events.listen.call(null, req__11613, goog.net.EventType.COMPLETE, function() {
        return callback__11618.call(null, req__11613)
      })
    }else {
    }
    return req__11613.send(uri__11616, method__11615, data__11617, cljs.core.truth_(opts__11611) ? fetch.util.clj__GT_js.call(null, opts__11611) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__11608 = null;
    if(goog.isDef(var_args)) {
      p__11608 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__11608)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__11619) {
    var route = cljs.core.first(arglist__11619);
    var content = cljs.core.first(cljs.core.next(arglist__11619));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11619)));
    var p__11608 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11619)));
    return xhr__delegate(route, content, callback, p__11608)
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
    var data__11600 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__11600))
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
webrot.client.main.$zoom_out = jayq.core.$.call(null, "\ufdd0'#zoom-out");
webrot.client.main.params = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
webrot.client.main.busy = cljs.core.atom.call(null, true);
webrot.client.main.coords_from_event = function coords_from_event(e) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":e.offsetX, "\ufdd0'y":e.offsetY})
};
webrot.client.main.form_params = function form_params() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'lut", "\ufdd0'cut-off"], {"\ufdd0'lut":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #lut :selected")), "\ufdd0'cut-off":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #cut-off :selected"))})
};
webrot.client.main.redraw = function redraw(args) {
  if(cljs.core.truth_(cljs.core.compare_and_set_BANG_.call(null, webrot.client.main.busy, false, true))) {
    var me__9065 = this;
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
  jayq.core.bind.call(null, webrot.client.main.$img, "\ufdd0'load", function() {
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.not);
    return jayq.core.hide.call(null, webrot.client.main.$spinner)
  });
  jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'click", function(e) {
    e.preventDefault();
    var merged_params__9066 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, e));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__9066]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_out, "\ufdd0'click", function(e) {
    e.preventDefault();
    var merged_params__9067 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null));
    return fetch.remotes.remote_callback.call(null, "zoom-out", cljs.core.PersistentVector.fromArray([merged_params__9067]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$refresh, "\ufdd0'click", function(e) {
    e.preventDefault();
    return webrot.client.main.redraw.call(null, cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null)))
  });
  return jayq.core.bind.call(null, webrot.client.main.$initial, "\ufdd0'click", function(e) {
    e.preventDefault();
    return webrot.client.main.redraw.call(null, webrot.client.main.form_params.call(null))
  })
});
