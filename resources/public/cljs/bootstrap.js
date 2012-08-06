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
  var x__11121 = x == null ? null : x;
  if(p[goog.typeOf(x__11121)]) {
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
    var G__11122__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__11122 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11122__delegate.call(this, array, i, idxs)
    };
    G__11122.cljs$lang$maxFixedArity = 2;
    G__11122.cljs$lang$applyTo = function(arglist__11123) {
      var array = cljs.core.first(arglist__11123);
      var i = cljs.core.first(cljs.core.next(arglist__11123));
      var idxs = cljs.core.rest(cljs.core.next(arglist__11123));
      return G__11122__delegate(array, i, idxs)
    };
    G__11122.cljs$lang$arity$variadic = G__11122__delegate;
    return G__11122
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
      var and__3822__auto____11208 = this$;
      if(and__3822__auto____11208) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____11208
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__6694__auto____11209 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11210 = cljs.core._invoke[goog.typeOf(x__6694__auto____11209)];
        if(or__3824__auto____11210) {
          return or__3824__auto____11210
        }else {
          var or__3824__auto____11211 = cljs.core._invoke["_"];
          if(or__3824__auto____11211) {
            return or__3824__auto____11211
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____11212 = this$;
      if(and__3822__auto____11212) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____11212
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__6694__auto____11213 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11214 = cljs.core._invoke[goog.typeOf(x__6694__auto____11213)];
        if(or__3824__auto____11214) {
          return or__3824__auto____11214
        }else {
          var or__3824__auto____11215 = cljs.core._invoke["_"];
          if(or__3824__auto____11215) {
            return or__3824__auto____11215
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____11216 = this$;
      if(and__3822__auto____11216) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____11216
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__6694__auto____11217 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11218 = cljs.core._invoke[goog.typeOf(x__6694__auto____11217)];
        if(or__3824__auto____11218) {
          return or__3824__auto____11218
        }else {
          var or__3824__auto____11219 = cljs.core._invoke["_"];
          if(or__3824__auto____11219) {
            return or__3824__auto____11219
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____11220 = this$;
      if(and__3822__auto____11220) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____11220
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__6694__auto____11221 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11222 = cljs.core._invoke[goog.typeOf(x__6694__auto____11221)];
        if(or__3824__auto____11222) {
          return or__3824__auto____11222
        }else {
          var or__3824__auto____11223 = cljs.core._invoke["_"];
          if(or__3824__auto____11223) {
            return or__3824__auto____11223
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____11224 = this$;
      if(and__3822__auto____11224) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____11224
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__6694__auto____11225 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11226 = cljs.core._invoke[goog.typeOf(x__6694__auto____11225)];
        if(or__3824__auto____11226) {
          return or__3824__auto____11226
        }else {
          var or__3824__auto____11227 = cljs.core._invoke["_"];
          if(or__3824__auto____11227) {
            return or__3824__auto____11227
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____11228 = this$;
      if(and__3822__auto____11228) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____11228
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__6694__auto____11229 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11230 = cljs.core._invoke[goog.typeOf(x__6694__auto____11229)];
        if(or__3824__auto____11230) {
          return or__3824__auto____11230
        }else {
          var or__3824__auto____11231 = cljs.core._invoke["_"];
          if(or__3824__auto____11231) {
            return or__3824__auto____11231
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____11232 = this$;
      if(and__3822__auto____11232) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____11232
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__6694__auto____11233 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11234 = cljs.core._invoke[goog.typeOf(x__6694__auto____11233)];
        if(or__3824__auto____11234) {
          return or__3824__auto____11234
        }else {
          var or__3824__auto____11235 = cljs.core._invoke["_"];
          if(or__3824__auto____11235) {
            return or__3824__auto____11235
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____11236 = this$;
      if(and__3822__auto____11236) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____11236
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__6694__auto____11237 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11238 = cljs.core._invoke[goog.typeOf(x__6694__auto____11237)];
        if(or__3824__auto____11238) {
          return or__3824__auto____11238
        }else {
          var or__3824__auto____11239 = cljs.core._invoke["_"];
          if(or__3824__auto____11239) {
            return or__3824__auto____11239
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____11240 = this$;
      if(and__3822__auto____11240) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____11240
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__6694__auto____11241 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11242 = cljs.core._invoke[goog.typeOf(x__6694__auto____11241)];
        if(or__3824__auto____11242) {
          return or__3824__auto____11242
        }else {
          var or__3824__auto____11243 = cljs.core._invoke["_"];
          if(or__3824__auto____11243) {
            return or__3824__auto____11243
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____11244 = this$;
      if(and__3822__auto____11244) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____11244
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__6694__auto____11245 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11246 = cljs.core._invoke[goog.typeOf(x__6694__auto____11245)];
        if(or__3824__auto____11246) {
          return or__3824__auto____11246
        }else {
          var or__3824__auto____11247 = cljs.core._invoke["_"];
          if(or__3824__auto____11247) {
            return or__3824__auto____11247
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____11248 = this$;
      if(and__3822__auto____11248) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____11248
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__6694__auto____11249 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11250 = cljs.core._invoke[goog.typeOf(x__6694__auto____11249)];
        if(or__3824__auto____11250) {
          return or__3824__auto____11250
        }else {
          var or__3824__auto____11251 = cljs.core._invoke["_"];
          if(or__3824__auto____11251) {
            return or__3824__auto____11251
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____11252 = this$;
      if(and__3822__auto____11252) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____11252
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__6694__auto____11253 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11254 = cljs.core._invoke[goog.typeOf(x__6694__auto____11253)];
        if(or__3824__auto____11254) {
          return or__3824__auto____11254
        }else {
          var or__3824__auto____11255 = cljs.core._invoke["_"];
          if(or__3824__auto____11255) {
            return or__3824__auto____11255
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____11256 = this$;
      if(and__3822__auto____11256) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____11256
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__6694__auto____11257 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11258 = cljs.core._invoke[goog.typeOf(x__6694__auto____11257)];
        if(or__3824__auto____11258) {
          return or__3824__auto____11258
        }else {
          var or__3824__auto____11259 = cljs.core._invoke["_"];
          if(or__3824__auto____11259) {
            return or__3824__auto____11259
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____11260 = this$;
      if(and__3822__auto____11260) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____11260
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__6694__auto____11261 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11262 = cljs.core._invoke[goog.typeOf(x__6694__auto____11261)];
        if(or__3824__auto____11262) {
          return or__3824__auto____11262
        }else {
          var or__3824__auto____11263 = cljs.core._invoke["_"];
          if(or__3824__auto____11263) {
            return or__3824__auto____11263
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____11264 = this$;
      if(and__3822__auto____11264) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____11264
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__6694__auto____11265 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11266 = cljs.core._invoke[goog.typeOf(x__6694__auto____11265)];
        if(or__3824__auto____11266) {
          return or__3824__auto____11266
        }else {
          var or__3824__auto____11267 = cljs.core._invoke["_"];
          if(or__3824__auto____11267) {
            return or__3824__auto____11267
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____11268 = this$;
      if(and__3822__auto____11268) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____11268
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__6694__auto____11269 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11270 = cljs.core._invoke[goog.typeOf(x__6694__auto____11269)];
        if(or__3824__auto____11270) {
          return or__3824__auto____11270
        }else {
          var or__3824__auto____11271 = cljs.core._invoke["_"];
          if(or__3824__auto____11271) {
            return or__3824__auto____11271
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____11272 = this$;
      if(and__3822__auto____11272) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____11272
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__6694__auto____11273 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11274 = cljs.core._invoke[goog.typeOf(x__6694__auto____11273)];
        if(or__3824__auto____11274) {
          return or__3824__auto____11274
        }else {
          var or__3824__auto____11275 = cljs.core._invoke["_"];
          if(or__3824__auto____11275) {
            return or__3824__auto____11275
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____11276 = this$;
      if(and__3822__auto____11276) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____11276
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__6694__auto____11277 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11278 = cljs.core._invoke[goog.typeOf(x__6694__auto____11277)];
        if(or__3824__auto____11278) {
          return or__3824__auto____11278
        }else {
          var or__3824__auto____11279 = cljs.core._invoke["_"];
          if(or__3824__auto____11279) {
            return or__3824__auto____11279
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____11280 = this$;
      if(and__3822__auto____11280) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____11280
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__6694__auto____11281 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11282 = cljs.core._invoke[goog.typeOf(x__6694__auto____11281)];
        if(or__3824__auto____11282) {
          return or__3824__auto____11282
        }else {
          var or__3824__auto____11283 = cljs.core._invoke["_"];
          if(or__3824__auto____11283) {
            return or__3824__auto____11283
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____11284 = this$;
      if(and__3822__auto____11284) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____11284
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__6694__auto____11285 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11286 = cljs.core._invoke[goog.typeOf(x__6694__auto____11285)];
        if(or__3824__auto____11286) {
          return or__3824__auto____11286
        }else {
          var or__3824__auto____11287 = cljs.core._invoke["_"];
          if(or__3824__auto____11287) {
            return or__3824__auto____11287
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____11288 = this$;
      if(and__3822__auto____11288) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____11288
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__6694__auto____11289 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____11290 = cljs.core._invoke[goog.typeOf(x__6694__auto____11289)];
        if(or__3824__auto____11290) {
          return or__3824__auto____11290
        }else {
          var or__3824__auto____11291 = cljs.core._invoke["_"];
          if(or__3824__auto____11291) {
            return or__3824__auto____11291
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
    var and__3822__auto____11296 = coll;
    if(and__3822__auto____11296) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____11296
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__6694__auto____11297 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11298 = cljs.core._count[goog.typeOf(x__6694__auto____11297)];
      if(or__3824__auto____11298) {
        return or__3824__auto____11298
      }else {
        var or__3824__auto____11299 = cljs.core._count["_"];
        if(or__3824__auto____11299) {
          return or__3824__auto____11299
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
    var and__3822__auto____11304 = coll;
    if(and__3822__auto____11304) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____11304
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__6694__auto____11305 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11306 = cljs.core._empty[goog.typeOf(x__6694__auto____11305)];
      if(or__3824__auto____11306) {
        return or__3824__auto____11306
      }else {
        var or__3824__auto____11307 = cljs.core._empty["_"];
        if(or__3824__auto____11307) {
          return or__3824__auto____11307
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
    var and__3822__auto____11312 = coll;
    if(and__3822__auto____11312) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____11312
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__6694__auto____11313 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11314 = cljs.core._conj[goog.typeOf(x__6694__auto____11313)];
      if(or__3824__auto____11314) {
        return or__3824__auto____11314
      }else {
        var or__3824__auto____11315 = cljs.core._conj["_"];
        if(or__3824__auto____11315) {
          return or__3824__auto____11315
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
      var and__3822__auto____11324 = coll;
      if(and__3822__auto____11324) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____11324
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__6694__auto____11325 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____11326 = cljs.core._nth[goog.typeOf(x__6694__auto____11325)];
        if(or__3824__auto____11326) {
          return or__3824__auto____11326
        }else {
          var or__3824__auto____11327 = cljs.core._nth["_"];
          if(or__3824__auto____11327) {
            return or__3824__auto____11327
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____11328 = coll;
      if(and__3822__auto____11328) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____11328
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__6694__auto____11329 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____11330 = cljs.core._nth[goog.typeOf(x__6694__auto____11329)];
        if(or__3824__auto____11330) {
          return or__3824__auto____11330
        }else {
          var or__3824__auto____11331 = cljs.core._nth["_"];
          if(or__3824__auto____11331) {
            return or__3824__auto____11331
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
    var and__3822__auto____11336 = coll;
    if(and__3822__auto____11336) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____11336
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__6694__auto____11337 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11338 = cljs.core._first[goog.typeOf(x__6694__auto____11337)];
      if(or__3824__auto____11338) {
        return or__3824__auto____11338
      }else {
        var or__3824__auto____11339 = cljs.core._first["_"];
        if(or__3824__auto____11339) {
          return or__3824__auto____11339
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____11344 = coll;
    if(and__3822__auto____11344) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____11344
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__6694__auto____11345 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11346 = cljs.core._rest[goog.typeOf(x__6694__auto____11345)];
      if(or__3824__auto____11346) {
        return or__3824__auto____11346
      }else {
        var or__3824__auto____11347 = cljs.core._rest["_"];
        if(or__3824__auto____11347) {
          return or__3824__auto____11347
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
    var and__3822__auto____11352 = coll;
    if(and__3822__auto____11352) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____11352
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__6694__auto____11353 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11354 = cljs.core._next[goog.typeOf(x__6694__auto____11353)];
      if(or__3824__auto____11354) {
        return or__3824__auto____11354
      }else {
        var or__3824__auto____11355 = cljs.core._next["_"];
        if(or__3824__auto____11355) {
          return or__3824__auto____11355
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
      var and__3822__auto____11364 = o;
      if(and__3822__auto____11364) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____11364
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__6694__auto____11365 = o == null ? null : o;
      return function() {
        var or__3824__auto____11366 = cljs.core._lookup[goog.typeOf(x__6694__auto____11365)];
        if(or__3824__auto____11366) {
          return or__3824__auto____11366
        }else {
          var or__3824__auto____11367 = cljs.core._lookup["_"];
          if(or__3824__auto____11367) {
            return or__3824__auto____11367
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____11368 = o;
      if(and__3822__auto____11368) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____11368
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__6694__auto____11369 = o == null ? null : o;
      return function() {
        var or__3824__auto____11370 = cljs.core._lookup[goog.typeOf(x__6694__auto____11369)];
        if(or__3824__auto____11370) {
          return or__3824__auto____11370
        }else {
          var or__3824__auto____11371 = cljs.core._lookup["_"];
          if(or__3824__auto____11371) {
            return or__3824__auto____11371
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
    var and__3822__auto____11376 = coll;
    if(and__3822__auto____11376) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____11376
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__6694__auto____11377 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11378 = cljs.core._contains_key_QMARK_[goog.typeOf(x__6694__auto____11377)];
      if(or__3824__auto____11378) {
        return or__3824__auto____11378
      }else {
        var or__3824__auto____11379 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____11379) {
          return or__3824__auto____11379
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____11384 = coll;
    if(and__3822__auto____11384) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____11384
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__6694__auto____11385 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11386 = cljs.core._assoc[goog.typeOf(x__6694__auto____11385)];
      if(or__3824__auto____11386) {
        return or__3824__auto____11386
      }else {
        var or__3824__auto____11387 = cljs.core._assoc["_"];
        if(or__3824__auto____11387) {
          return or__3824__auto____11387
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
    var and__3822__auto____11392 = coll;
    if(and__3822__auto____11392) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____11392
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__6694__auto____11393 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11394 = cljs.core._dissoc[goog.typeOf(x__6694__auto____11393)];
      if(or__3824__auto____11394) {
        return or__3824__auto____11394
      }else {
        var or__3824__auto____11395 = cljs.core._dissoc["_"];
        if(or__3824__auto____11395) {
          return or__3824__auto____11395
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
    var and__3822__auto____11400 = coll;
    if(and__3822__auto____11400) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____11400
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__6694__auto____11401 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11402 = cljs.core._key[goog.typeOf(x__6694__auto____11401)];
      if(or__3824__auto____11402) {
        return or__3824__auto____11402
      }else {
        var or__3824__auto____11403 = cljs.core._key["_"];
        if(or__3824__auto____11403) {
          return or__3824__auto____11403
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____11408 = coll;
    if(and__3822__auto____11408) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____11408
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__6694__auto____11409 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11410 = cljs.core._val[goog.typeOf(x__6694__auto____11409)];
      if(or__3824__auto____11410) {
        return or__3824__auto____11410
      }else {
        var or__3824__auto____11411 = cljs.core._val["_"];
        if(or__3824__auto____11411) {
          return or__3824__auto____11411
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
    var and__3822__auto____11416 = coll;
    if(and__3822__auto____11416) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____11416
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__6694__auto____11417 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11418 = cljs.core._disjoin[goog.typeOf(x__6694__auto____11417)];
      if(or__3824__auto____11418) {
        return or__3824__auto____11418
      }else {
        var or__3824__auto____11419 = cljs.core._disjoin["_"];
        if(or__3824__auto____11419) {
          return or__3824__auto____11419
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
    var and__3822__auto____11424 = coll;
    if(and__3822__auto____11424) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____11424
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__6694__auto____11425 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11426 = cljs.core._peek[goog.typeOf(x__6694__auto____11425)];
      if(or__3824__auto____11426) {
        return or__3824__auto____11426
      }else {
        var or__3824__auto____11427 = cljs.core._peek["_"];
        if(or__3824__auto____11427) {
          return or__3824__auto____11427
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____11432 = coll;
    if(and__3822__auto____11432) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____11432
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__6694__auto____11433 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11434 = cljs.core._pop[goog.typeOf(x__6694__auto____11433)];
      if(or__3824__auto____11434) {
        return or__3824__auto____11434
      }else {
        var or__3824__auto____11435 = cljs.core._pop["_"];
        if(or__3824__auto____11435) {
          return or__3824__auto____11435
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
    var and__3822__auto____11440 = coll;
    if(and__3822__auto____11440) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____11440
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__6694__auto____11441 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11442 = cljs.core._assoc_n[goog.typeOf(x__6694__auto____11441)];
      if(or__3824__auto____11442) {
        return or__3824__auto____11442
      }else {
        var or__3824__auto____11443 = cljs.core._assoc_n["_"];
        if(or__3824__auto____11443) {
          return or__3824__auto____11443
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
    var and__3822__auto____11448 = o;
    if(and__3822__auto____11448) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____11448
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__6694__auto____11449 = o == null ? null : o;
    return function() {
      var or__3824__auto____11450 = cljs.core._deref[goog.typeOf(x__6694__auto____11449)];
      if(or__3824__auto____11450) {
        return or__3824__auto____11450
      }else {
        var or__3824__auto____11451 = cljs.core._deref["_"];
        if(or__3824__auto____11451) {
          return or__3824__auto____11451
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
    var and__3822__auto____11456 = o;
    if(and__3822__auto____11456) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____11456
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__6694__auto____11457 = o == null ? null : o;
    return function() {
      var or__3824__auto____11458 = cljs.core._deref_with_timeout[goog.typeOf(x__6694__auto____11457)];
      if(or__3824__auto____11458) {
        return or__3824__auto____11458
      }else {
        var or__3824__auto____11459 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____11459) {
          return or__3824__auto____11459
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
    var and__3822__auto____11464 = o;
    if(and__3822__auto____11464) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____11464
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__6694__auto____11465 = o == null ? null : o;
    return function() {
      var or__3824__auto____11466 = cljs.core._meta[goog.typeOf(x__6694__auto____11465)];
      if(or__3824__auto____11466) {
        return or__3824__auto____11466
      }else {
        var or__3824__auto____11467 = cljs.core._meta["_"];
        if(or__3824__auto____11467) {
          return or__3824__auto____11467
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
    var and__3822__auto____11472 = o;
    if(and__3822__auto____11472) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____11472
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__6694__auto____11473 = o == null ? null : o;
    return function() {
      var or__3824__auto____11474 = cljs.core._with_meta[goog.typeOf(x__6694__auto____11473)];
      if(or__3824__auto____11474) {
        return or__3824__auto____11474
      }else {
        var or__3824__auto____11475 = cljs.core._with_meta["_"];
        if(or__3824__auto____11475) {
          return or__3824__auto____11475
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
      var and__3822__auto____11484 = coll;
      if(and__3822__auto____11484) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____11484
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__6694__auto____11485 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____11486 = cljs.core._reduce[goog.typeOf(x__6694__auto____11485)];
        if(or__3824__auto____11486) {
          return or__3824__auto____11486
        }else {
          var or__3824__auto____11487 = cljs.core._reduce["_"];
          if(or__3824__auto____11487) {
            return or__3824__auto____11487
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____11488 = coll;
      if(and__3822__auto____11488) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____11488
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__6694__auto____11489 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____11490 = cljs.core._reduce[goog.typeOf(x__6694__auto____11489)];
        if(or__3824__auto____11490) {
          return or__3824__auto____11490
        }else {
          var or__3824__auto____11491 = cljs.core._reduce["_"];
          if(or__3824__auto____11491) {
            return or__3824__auto____11491
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
    var and__3822__auto____11496 = coll;
    if(and__3822__auto____11496) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____11496
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__6694__auto____11497 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11498 = cljs.core._kv_reduce[goog.typeOf(x__6694__auto____11497)];
      if(or__3824__auto____11498) {
        return or__3824__auto____11498
      }else {
        var or__3824__auto____11499 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____11499) {
          return or__3824__auto____11499
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
    var and__3822__auto____11504 = o;
    if(and__3822__auto____11504) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____11504
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__6694__auto____11505 = o == null ? null : o;
    return function() {
      var or__3824__auto____11506 = cljs.core._equiv[goog.typeOf(x__6694__auto____11505)];
      if(or__3824__auto____11506) {
        return or__3824__auto____11506
      }else {
        var or__3824__auto____11507 = cljs.core._equiv["_"];
        if(or__3824__auto____11507) {
          return or__3824__auto____11507
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
    var and__3822__auto____11512 = o;
    if(and__3822__auto____11512) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____11512
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__6694__auto____11513 = o == null ? null : o;
    return function() {
      var or__3824__auto____11514 = cljs.core._hash[goog.typeOf(x__6694__auto____11513)];
      if(or__3824__auto____11514) {
        return or__3824__auto____11514
      }else {
        var or__3824__auto____11515 = cljs.core._hash["_"];
        if(or__3824__auto____11515) {
          return or__3824__auto____11515
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
    var and__3822__auto____11520 = o;
    if(and__3822__auto____11520) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____11520
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__6694__auto____11521 = o == null ? null : o;
    return function() {
      var or__3824__auto____11522 = cljs.core._seq[goog.typeOf(x__6694__auto____11521)];
      if(or__3824__auto____11522) {
        return or__3824__auto____11522
      }else {
        var or__3824__auto____11523 = cljs.core._seq["_"];
        if(or__3824__auto____11523) {
          return or__3824__auto____11523
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
    var and__3822__auto____11528 = coll;
    if(and__3822__auto____11528) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____11528
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__6694__auto____11529 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11530 = cljs.core._rseq[goog.typeOf(x__6694__auto____11529)];
      if(or__3824__auto____11530) {
        return or__3824__auto____11530
      }else {
        var or__3824__auto____11531 = cljs.core._rseq["_"];
        if(or__3824__auto____11531) {
          return or__3824__auto____11531
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
    var and__3822__auto____11536 = coll;
    if(and__3822__auto____11536) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____11536
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__6694__auto____11537 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11538 = cljs.core._sorted_seq[goog.typeOf(x__6694__auto____11537)];
      if(or__3824__auto____11538) {
        return or__3824__auto____11538
      }else {
        var or__3824__auto____11539 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____11539) {
          return or__3824__auto____11539
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____11544 = coll;
    if(and__3822__auto____11544) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____11544
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__6694__auto____11545 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11546 = cljs.core._sorted_seq_from[goog.typeOf(x__6694__auto____11545)];
      if(or__3824__auto____11546) {
        return or__3824__auto____11546
      }else {
        var or__3824__auto____11547 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____11547) {
          return or__3824__auto____11547
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____11552 = coll;
    if(and__3822__auto____11552) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____11552
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__6694__auto____11553 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11554 = cljs.core._entry_key[goog.typeOf(x__6694__auto____11553)];
      if(or__3824__auto____11554) {
        return or__3824__auto____11554
      }else {
        var or__3824__auto____11555 = cljs.core._entry_key["_"];
        if(or__3824__auto____11555) {
          return or__3824__auto____11555
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____11560 = coll;
    if(and__3822__auto____11560) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____11560
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__6694__auto____11561 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11562 = cljs.core._comparator[goog.typeOf(x__6694__auto____11561)];
      if(or__3824__auto____11562) {
        return or__3824__auto____11562
      }else {
        var or__3824__auto____11563 = cljs.core._comparator["_"];
        if(or__3824__auto____11563) {
          return or__3824__auto____11563
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
    var and__3822__auto____11568 = o;
    if(and__3822__auto____11568) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____11568
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__6694__auto____11569 = o == null ? null : o;
    return function() {
      var or__3824__auto____11570 = cljs.core._pr_seq[goog.typeOf(x__6694__auto____11569)];
      if(or__3824__auto____11570) {
        return or__3824__auto____11570
      }else {
        var or__3824__auto____11571 = cljs.core._pr_seq["_"];
        if(or__3824__auto____11571) {
          return or__3824__auto____11571
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
    var and__3822__auto____11576 = d;
    if(and__3822__auto____11576) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____11576
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__6694__auto____11577 = d == null ? null : d;
    return function() {
      var or__3824__auto____11578 = cljs.core._realized_QMARK_[goog.typeOf(x__6694__auto____11577)];
      if(or__3824__auto____11578) {
        return or__3824__auto____11578
      }else {
        var or__3824__auto____11579 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____11579) {
          return or__3824__auto____11579
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
    var and__3822__auto____11584 = this$;
    if(and__3822__auto____11584) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____11584
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__6694__auto____11585 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11586 = cljs.core._notify_watches[goog.typeOf(x__6694__auto____11585)];
      if(or__3824__auto____11586) {
        return or__3824__auto____11586
      }else {
        var or__3824__auto____11587 = cljs.core._notify_watches["_"];
        if(or__3824__auto____11587) {
          return or__3824__auto____11587
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____11592 = this$;
    if(and__3822__auto____11592) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____11592
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__6694__auto____11593 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11594 = cljs.core._add_watch[goog.typeOf(x__6694__auto____11593)];
      if(or__3824__auto____11594) {
        return or__3824__auto____11594
      }else {
        var or__3824__auto____11595 = cljs.core._add_watch["_"];
        if(or__3824__auto____11595) {
          return or__3824__auto____11595
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____11600 = this$;
    if(and__3822__auto____11600) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____11600
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__6694__auto____11601 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____11602 = cljs.core._remove_watch[goog.typeOf(x__6694__auto____11601)];
      if(or__3824__auto____11602) {
        return or__3824__auto____11602
      }else {
        var or__3824__auto____11603 = cljs.core._remove_watch["_"];
        if(or__3824__auto____11603) {
          return or__3824__auto____11603
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
    var and__3822__auto____11608 = coll;
    if(and__3822__auto____11608) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____11608
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__6694__auto____11609 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11610 = cljs.core._as_transient[goog.typeOf(x__6694__auto____11609)];
      if(or__3824__auto____11610) {
        return or__3824__auto____11610
      }else {
        var or__3824__auto____11611 = cljs.core._as_transient["_"];
        if(or__3824__auto____11611) {
          return or__3824__auto____11611
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
    var and__3822__auto____11616 = tcoll;
    if(and__3822__auto____11616) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____11616
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__6694__auto____11617 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11618 = cljs.core._conj_BANG_[goog.typeOf(x__6694__auto____11617)];
      if(or__3824__auto____11618) {
        return or__3824__auto____11618
      }else {
        var or__3824__auto____11619 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____11619) {
          return or__3824__auto____11619
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____11624 = tcoll;
    if(and__3822__auto____11624) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____11624
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__6694__auto____11625 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11626 = cljs.core._persistent_BANG_[goog.typeOf(x__6694__auto____11625)];
      if(or__3824__auto____11626) {
        return or__3824__auto____11626
      }else {
        var or__3824__auto____11627 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____11627) {
          return or__3824__auto____11627
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
    var and__3822__auto____11632 = tcoll;
    if(and__3822__auto____11632) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____11632
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__6694__auto____11633 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11634 = cljs.core._assoc_BANG_[goog.typeOf(x__6694__auto____11633)];
      if(or__3824__auto____11634) {
        return or__3824__auto____11634
      }else {
        var or__3824__auto____11635 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____11635) {
          return or__3824__auto____11635
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
    var and__3822__auto____11640 = tcoll;
    if(and__3822__auto____11640) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____11640
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__6694__auto____11641 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11642 = cljs.core._dissoc_BANG_[goog.typeOf(x__6694__auto____11641)];
      if(or__3824__auto____11642) {
        return or__3824__auto____11642
      }else {
        var or__3824__auto____11643 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____11643) {
          return or__3824__auto____11643
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
    var and__3822__auto____11648 = tcoll;
    if(and__3822__auto____11648) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____11648
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__6694__auto____11649 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11650 = cljs.core._assoc_n_BANG_[goog.typeOf(x__6694__auto____11649)];
      if(or__3824__auto____11650) {
        return or__3824__auto____11650
      }else {
        var or__3824__auto____11651 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____11651) {
          return or__3824__auto____11651
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____11656 = tcoll;
    if(and__3822__auto____11656) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____11656
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__6694__auto____11657 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11658 = cljs.core._pop_BANG_[goog.typeOf(x__6694__auto____11657)];
      if(or__3824__auto____11658) {
        return or__3824__auto____11658
      }else {
        var or__3824__auto____11659 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____11659) {
          return or__3824__auto____11659
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
    var and__3822__auto____11664 = tcoll;
    if(and__3822__auto____11664) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____11664
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__6694__auto____11665 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____11666 = cljs.core._disjoin_BANG_[goog.typeOf(x__6694__auto____11665)];
      if(or__3824__auto____11666) {
        return or__3824__auto____11666
      }else {
        var or__3824__auto____11667 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____11667) {
          return or__3824__auto____11667
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
    var and__3822__auto____11672 = x;
    if(and__3822__auto____11672) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____11672
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__6694__auto____11673 = x == null ? null : x;
    return function() {
      var or__3824__auto____11674 = cljs.core._compare[goog.typeOf(x__6694__auto____11673)];
      if(or__3824__auto____11674) {
        return or__3824__auto____11674
      }else {
        var or__3824__auto____11675 = cljs.core._compare["_"];
        if(or__3824__auto____11675) {
          return or__3824__auto____11675
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
    var and__3822__auto____11680 = coll;
    if(and__3822__auto____11680) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____11680
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__6694__auto____11681 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11682 = cljs.core._drop_first[goog.typeOf(x__6694__auto____11681)];
      if(or__3824__auto____11682) {
        return or__3824__auto____11682
      }else {
        var or__3824__auto____11683 = cljs.core._drop_first["_"];
        if(or__3824__auto____11683) {
          return or__3824__auto____11683
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
    var and__3822__auto____11688 = coll;
    if(and__3822__auto____11688) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____11688
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__6694__auto____11689 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11690 = cljs.core._chunked_first[goog.typeOf(x__6694__auto____11689)];
      if(or__3824__auto____11690) {
        return or__3824__auto____11690
      }else {
        var or__3824__auto____11691 = cljs.core._chunked_first["_"];
        if(or__3824__auto____11691) {
          return or__3824__auto____11691
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____11696 = coll;
    if(and__3822__auto____11696) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____11696
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__6694__auto____11697 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11698 = cljs.core._chunked_rest[goog.typeOf(x__6694__auto____11697)];
      if(or__3824__auto____11698) {
        return or__3824__auto____11698
      }else {
        var or__3824__auto____11699 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____11699) {
          return or__3824__auto____11699
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
    var and__3822__auto____11704 = coll;
    if(and__3822__auto____11704) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____11704
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__6694__auto____11705 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____11706 = cljs.core._chunked_next[goog.typeOf(x__6694__auto____11705)];
      if(or__3824__auto____11706) {
        return or__3824__auto____11706
      }else {
        var or__3824__auto____11707 = cljs.core._chunked_next["_"];
        if(or__3824__auto____11707) {
          return or__3824__auto____11707
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
    var or__3824__auto____11709 = x === y;
    if(or__3824__auto____11709) {
      return or__3824__auto____11709
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__11710__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__11711 = y;
            var G__11712 = cljs.core.first.call(null, more);
            var G__11713 = cljs.core.next.call(null, more);
            x = G__11711;
            y = G__11712;
            more = G__11713;
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
    var G__11710 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11710__delegate.call(this, x, y, more)
    };
    G__11710.cljs$lang$maxFixedArity = 2;
    G__11710.cljs$lang$applyTo = function(arglist__11714) {
      var x = cljs.core.first(arglist__11714);
      var y = cljs.core.first(cljs.core.next(arglist__11714));
      var more = cljs.core.rest(cljs.core.next(arglist__11714));
      return G__11710__delegate(x, y, more)
    };
    G__11710.cljs$lang$arity$variadic = G__11710__delegate;
    return G__11710
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
  var G__11715 = null;
  var G__11715__2 = function(o, k) {
    return null
  };
  var G__11715__3 = function(o, k, not_found) {
    return not_found
  };
  G__11715 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11715__2.call(this, o, k);
      case 3:
        return G__11715__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11715
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
  var G__11716 = null;
  var G__11716__2 = function(_, f) {
    return f.call(null)
  };
  var G__11716__3 = function(_, f, start) {
    return start
  };
  G__11716 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11716__2.call(this, _, f);
      case 3:
        return G__11716__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11716
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
  var G__11717 = null;
  var G__11717__2 = function(_, n) {
    return null
  };
  var G__11717__3 = function(_, n, not_found) {
    return not_found
  };
  G__11717 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11717__2.call(this, _, n);
      case 3:
        return G__11717__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11717
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
  var and__3822__auto____11718 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____11718) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____11718
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
    var cnt__11731 = cljs.core._count.call(null, cicoll);
    if(cnt__11731 === 0) {
      return f.call(null)
    }else {
      var val__11732 = cljs.core._nth.call(null, cicoll, 0);
      var n__11733 = 1;
      while(true) {
        if(n__11733 < cnt__11731) {
          var nval__11734 = f.call(null, val__11732, cljs.core._nth.call(null, cicoll, n__11733));
          if(cljs.core.reduced_QMARK_.call(null, nval__11734)) {
            return cljs.core.deref.call(null, nval__11734)
          }else {
            var G__11743 = nval__11734;
            var G__11744 = n__11733 + 1;
            val__11732 = G__11743;
            n__11733 = G__11744;
            continue
          }
        }else {
          return val__11732
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__11735 = cljs.core._count.call(null, cicoll);
    var val__11736 = val;
    var n__11737 = 0;
    while(true) {
      if(n__11737 < cnt__11735) {
        var nval__11738 = f.call(null, val__11736, cljs.core._nth.call(null, cicoll, n__11737));
        if(cljs.core.reduced_QMARK_.call(null, nval__11738)) {
          return cljs.core.deref.call(null, nval__11738)
        }else {
          var G__11745 = nval__11738;
          var G__11746 = n__11737 + 1;
          val__11736 = G__11745;
          n__11737 = G__11746;
          continue
        }
      }else {
        return val__11736
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__11739 = cljs.core._count.call(null, cicoll);
    var val__11740 = val;
    var n__11741 = idx;
    while(true) {
      if(n__11741 < cnt__11739) {
        var nval__11742 = f.call(null, val__11740, cljs.core._nth.call(null, cicoll, n__11741));
        if(cljs.core.reduced_QMARK_.call(null, nval__11742)) {
          return cljs.core.deref.call(null, nval__11742)
        }else {
          var G__11747 = nval__11742;
          var G__11748 = n__11741 + 1;
          val__11740 = G__11747;
          n__11741 = G__11748;
          continue
        }
      }else {
        return val__11740
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
    var cnt__11761 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__11762 = arr[0];
      var n__11763 = 1;
      while(true) {
        if(n__11763 < cnt__11761) {
          var nval__11764 = f.call(null, val__11762, arr[n__11763]);
          if(cljs.core.reduced_QMARK_.call(null, nval__11764)) {
            return cljs.core.deref.call(null, nval__11764)
          }else {
            var G__11773 = nval__11764;
            var G__11774 = n__11763 + 1;
            val__11762 = G__11773;
            n__11763 = G__11774;
            continue
          }
        }else {
          return val__11762
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__11765 = arr.length;
    var val__11766 = val;
    var n__11767 = 0;
    while(true) {
      if(n__11767 < cnt__11765) {
        var nval__11768 = f.call(null, val__11766, arr[n__11767]);
        if(cljs.core.reduced_QMARK_.call(null, nval__11768)) {
          return cljs.core.deref.call(null, nval__11768)
        }else {
          var G__11775 = nval__11768;
          var G__11776 = n__11767 + 1;
          val__11766 = G__11775;
          n__11767 = G__11776;
          continue
        }
      }else {
        return val__11766
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__11769 = arr.length;
    var val__11770 = val;
    var n__11771 = idx;
    while(true) {
      if(n__11771 < cnt__11769) {
        var nval__11772 = f.call(null, val__11770, arr[n__11771]);
        if(cljs.core.reduced_QMARK_.call(null, nval__11772)) {
          return cljs.core.deref.call(null, nval__11772)
        }else {
          var G__11777 = nval__11772;
          var G__11778 = n__11771 + 1;
          val__11770 = G__11777;
          n__11771 = G__11778;
          continue
        }
      }else {
        return val__11770
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
  var this__11779 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__11780 = this;
  if(this__11780.i + 1 < this__11780.a.length) {
    return new cljs.core.IndexedSeq(this__11780.a, this__11780.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11781 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11782 = this;
  var c__11783 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__11783 > 0) {
    return new cljs.core.RSeq(coll, c__11783 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__11784 = this;
  var this__11785 = this;
  return cljs.core.pr_str.call(null, this__11785)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__11786 = this;
  if(cljs.core.counted_QMARK_.call(null, this__11786.a)) {
    return cljs.core.ci_reduce.call(null, this__11786.a, f, this__11786.a[this__11786.i], this__11786.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__11786.a[this__11786.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__11787 = this;
  if(cljs.core.counted_QMARK_.call(null, this__11787.a)) {
    return cljs.core.ci_reduce.call(null, this__11787.a, f, start, this__11787.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__11788 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__11789 = this;
  return this__11789.a.length - this__11789.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__11790 = this;
  return this__11790.a[this__11790.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__11791 = this;
  if(this__11791.i + 1 < this__11791.a.length) {
    return new cljs.core.IndexedSeq(this__11791.a, this__11791.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11792 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11793 = this;
  var i__11794 = n + this__11793.i;
  if(i__11794 < this__11793.a.length) {
    return this__11793.a[i__11794]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11795 = this;
  var i__11796 = n + this__11795.i;
  if(i__11796 < this__11795.a.length) {
    return this__11795.a[i__11796]
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
  var G__11797 = null;
  var G__11797__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__11797__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__11797 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__11797__2.call(this, array, f);
      case 3:
        return G__11797__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11797
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__11798 = null;
  var G__11798__2 = function(array, k) {
    return array[k]
  };
  var G__11798__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__11798 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11798__2.call(this, array, k);
      case 3:
        return G__11798__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11798
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__11799 = null;
  var G__11799__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__11799__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__11799 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11799__2.call(this, array, n);
      case 3:
        return G__11799__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11799
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
  var this__11800 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11801 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__11802 = this;
  var this__11803 = this;
  return cljs.core.pr_str.call(null, this__11803)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11804 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11805 = this;
  return this__11805.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__11806 = this;
  return cljs.core._nth.call(null, this__11806.ci, this__11806.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__11807 = this;
  if(this__11807.i > 0) {
    return new cljs.core.RSeq(this__11807.ci, this__11807.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11808 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__11809 = this;
  return new cljs.core.RSeq(this__11809.ci, this__11809.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11810 = this;
  return this__11810.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__11814__11815 = coll;
      if(G__11814__11815) {
        if(function() {
          var or__3824__auto____11816 = G__11814__11815.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____11816) {
            return or__3824__auto____11816
          }else {
            return G__11814__11815.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__11814__11815.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__11814__11815)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__11814__11815)
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
      var G__11821__11822 = coll;
      if(G__11821__11822) {
        if(function() {
          var or__3824__auto____11823 = G__11821__11822.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____11823) {
            return or__3824__auto____11823
          }else {
            return G__11821__11822.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__11821__11822.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11821__11822)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11821__11822)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__11824 = cljs.core.seq.call(null, coll);
      if(s__11824 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__11824)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__11829__11830 = coll;
      if(G__11829__11830) {
        if(function() {
          var or__3824__auto____11831 = G__11829__11830.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____11831) {
            return or__3824__auto____11831
          }else {
            return G__11829__11830.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__11829__11830.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11829__11830)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11829__11830)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__11832 = cljs.core.seq.call(null, coll);
      if(!(s__11832 == null)) {
        return cljs.core._rest.call(null, s__11832)
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
      var G__11836__11837 = coll;
      if(G__11836__11837) {
        if(function() {
          var or__3824__auto____11838 = G__11836__11837.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____11838) {
            return or__3824__auto____11838
          }else {
            return G__11836__11837.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__11836__11837.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__11836__11837)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__11836__11837)
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
    var sn__11840 = cljs.core.next.call(null, s);
    if(!(sn__11840 == null)) {
      var G__11841 = sn__11840;
      s = G__11841;
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
    var G__11842__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__11843 = conj.call(null, coll, x);
          var G__11844 = cljs.core.first.call(null, xs);
          var G__11845 = cljs.core.next.call(null, xs);
          coll = G__11843;
          x = G__11844;
          xs = G__11845;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__11842 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11842__delegate.call(this, coll, x, xs)
    };
    G__11842.cljs$lang$maxFixedArity = 2;
    G__11842.cljs$lang$applyTo = function(arglist__11846) {
      var coll = cljs.core.first(arglist__11846);
      var x = cljs.core.first(cljs.core.next(arglist__11846));
      var xs = cljs.core.rest(cljs.core.next(arglist__11846));
      return G__11842__delegate(coll, x, xs)
    };
    G__11842.cljs$lang$arity$variadic = G__11842__delegate;
    return G__11842
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
  var s__11849 = cljs.core.seq.call(null, coll);
  var acc__11850 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__11849)) {
      return acc__11850 + cljs.core._count.call(null, s__11849)
    }else {
      var G__11851 = cljs.core.next.call(null, s__11849);
      var G__11852 = acc__11850 + 1;
      s__11849 = G__11851;
      acc__11850 = G__11852;
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
        var G__11859__11860 = coll;
        if(G__11859__11860) {
          if(function() {
            var or__3824__auto____11861 = G__11859__11860.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____11861) {
              return or__3824__auto____11861
            }else {
              return G__11859__11860.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__11859__11860.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11859__11860)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11859__11860)
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
        var G__11862__11863 = coll;
        if(G__11862__11863) {
          if(function() {
            var or__3824__auto____11864 = G__11862__11863.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____11864) {
              return or__3824__auto____11864
            }else {
              return G__11862__11863.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__11862__11863.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11862__11863)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11862__11863)
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
    var G__11867__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__11866 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__11868 = ret__11866;
          var G__11869 = cljs.core.first.call(null, kvs);
          var G__11870 = cljs.core.second.call(null, kvs);
          var G__11871 = cljs.core.nnext.call(null, kvs);
          coll = G__11868;
          k = G__11869;
          v = G__11870;
          kvs = G__11871;
          continue
        }else {
          return ret__11866
        }
        break
      }
    };
    var G__11867 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11867__delegate.call(this, coll, k, v, kvs)
    };
    G__11867.cljs$lang$maxFixedArity = 3;
    G__11867.cljs$lang$applyTo = function(arglist__11872) {
      var coll = cljs.core.first(arglist__11872);
      var k = cljs.core.first(cljs.core.next(arglist__11872));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11872)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11872)));
      return G__11867__delegate(coll, k, v, kvs)
    };
    G__11867.cljs$lang$arity$variadic = G__11867__delegate;
    return G__11867
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
    var G__11875__delegate = function(coll, k, ks) {
      while(true) {
        var ret__11874 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__11876 = ret__11874;
          var G__11877 = cljs.core.first.call(null, ks);
          var G__11878 = cljs.core.next.call(null, ks);
          coll = G__11876;
          k = G__11877;
          ks = G__11878;
          continue
        }else {
          return ret__11874
        }
        break
      }
    };
    var G__11875 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11875__delegate.call(this, coll, k, ks)
    };
    G__11875.cljs$lang$maxFixedArity = 2;
    G__11875.cljs$lang$applyTo = function(arglist__11879) {
      var coll = cljs.core.first(arglist__11879);
      var k = cljs.core.first(cljs.core.next(arglist__11879));
      var ks = cljs.core.rest(cljs.core.next(arglist__11879));
      return G__11875__delegate(coll, k, ks)
    };
    G__11875.cljs$lang$arity$variadic = G__11875__delegate;
    return G__11875
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
    var G__11883__11884 = o;
    if(G__11883__11884) {
      if(function() {
        var or__3824__auto____11885 = G__11883__11884.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____11885) {
          return or__3824__auto____11885
        }else {
          return G__11883__11884.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__11883__11884.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11883__11884)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11883__11884)
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
    var G__11888__delegate = function(coll, k, ks) {
      while(true) {
        var ret__11887 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__11889 = ret__11887;
          var G__11890 = cljs.core.first.call(null, ks);
          var G__11891 = cljs.core.next.call(null, ks);
          coll = G__11889;
          k = G__11890;
          ks = G__11891;
          continue
        }else {
          return ret__11887
        }
        break
      }
    };
    var G__11888 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11888__delegate.call(this, coll, k, ks)
    };
    G__11888.cljs$lang$maxFixedArity = 2;
    G__11888.cljs$lang$applyTo = function(arglist__11892) {
      var coll = cljs.core.first(arglist__11892);
      var k = cljs.core.first(cljs.core.next(arglist__11892));
      var ks = cljs.core.rest(cljs.core.next(arglist__11892));
      return G__11888__delegate(coll, k, ks)
    };
    G__11888.cljs$lang$arity$variadic = G__11888__delegate;
    return G__11888
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
  var h__11894 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__11894;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__11894
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__11896 = cljs.core.string_hash_cache[k];
  if(!(h__11896 == null)) {
    return h__11896
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
      var and__3822__auto____11898 = goog.isString(o);
      if(and__3822__auto____11898) {
        return check_cache
      }else {
        return and__3822__auto____11898
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
    var G__11902__11903 = x;
    if(G__11902__11903) {
      if(function() {
        var or__3824__auto____11904 = G__11902__11903.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____11904) {
          return or__3824__auto____11904
        }else {
          return G__11902__11903.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__11902__11903.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__11902__11903)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__11902__11903)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__11908__11909 = x;
    if(G__11908__11909) {
      if(function() {
        var or__3824__auto____11910 = G__11908__11909.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____11910) {
          return or__3824__auto____11910
        }else {
          return G__11908__11909.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__11908__11909.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__11908__11909)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__11908__11909)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__11914__11915 = x;
  if(G__11914__11915) {
    if(function() {
      var or__3824__auto____11916 = G__11914__11915.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____11916) {
        return or__3824__auto____11916
      }else {
        return G__11914__11915.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__11914__11915.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__11914__11915)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__11914__11915)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__11920__11921 = x;
  if(G__11920__11921) {
    if(function() {
      var or__3824__auto____11922 = G__11920__11921.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____11922) {
        return or__3824__auto____11922
      }else {
        return G__11920__11921.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__11920__11921.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__11920__11921)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__11920__11921)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__11926__11927 = x;
  if(G__11926__11927) {
    if(function() {
      var or__3824__auto____11928 = G__11926__11927.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____11928) {
        return or__3824__auto____11928
      }else {
        return G__11926__11927.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__11926__11927.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__11926__11927)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__11926__11927)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__11932__11933 = x;
  if(G__11932__11933) {
    if(function() {
      var or__3824__auto____11934 = G__11932__11933.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____11934) {
        return or__3824__auto____11934
      }else {
        return G__11932__11933.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__11932__11933.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11932__11933)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__11932__11933)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__11938__11939 = x;
  if(G__11938__11939) {
    if(function() {
      var or__3824__auto____11940 = G__11938__11939.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____11940) {
        return or__3824__auto____11940
      }else {
        return G__11938__11939.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__11938__11939.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__11938__11939)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__11938__11939)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__11944__11945 = x;
    if(G__11944__11945) {
      if(function() {
        var or__3824__auto____11946 = G__11944__11945.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____11946) {
          return or__3824__auto____11946
        }else {
          return G__11944__11945.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__11944__11945.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__11944__11945)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__11944__11945)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__11950__11951 = x;
  if(G__11950__11951) {
    if(function() {
      var or__3824__auto____11952 = G__11950__11951.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____11952) {
        return or__3824__auto____11952
      }else {
        return G__11950__11951.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__11950__11951.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__11950__11951)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__11950__11951)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__11956__11957 = x;
  if(G__11956__11957) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11958 = null;
      if(cljs.core.truth_(or__3824__auto____11958)) {
        return or__3824__auto____11958
      }else {
        return G__11956__11957.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__11956__11957.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__11956__11957)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__11956__11957)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__11959__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__11959 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11959__delegate.call(this, keyvals)
    };
    G__11959.cljs$lang$maxFixedArity = 0;
    G__11959.cljs$lang$applyTo = function(arglist__11960) {
      var keyvals = cljs.core.seq(arglist__11960);
      return G__11959__delegate(keyvals)
    };
    G__11959.cljs$lang$arity$variadic = G__11959__delegate;
    return G__11959
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
  var keys__11962 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__11962.push(key)
  });
  return keys__11962
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__11966 = i;
  var j__11967 = j;
  var len__11968 = len;
  while(true) {
    if(len__11968 === 0) {
      return to
    }else {
      to[j__11967] = from[i__11966];
      var G__11969 = i__11966 + 1;
      var G__11970 = j__11967 + 1;
      var G__11971 = len__11968 - 1;
      i__11966 = G__11969;
      j__11967 = G__11970;
      len__11968 = G__11971;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__11975 = i + (len - 1);
  var j__11976 = j + (len - 1);
  var len__11977 = len;
  while(true) {
    if(len__11977 === 0) {
      return to
    }else {
      to[j__11976] = from[i__11975];
      var G__11978 = i__11975 - 1;
      var G__11979 = j__11976 - 1;
      var G__11980 = len__11977 - 1;
      i__11975 = G__11978;
      j__11976 = G__11979;
      len__11977 = G__11980;
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
    var G__11984__11985 = s;
    if(G__11984__11985) {
      if(function() {
        var or__3824__auto____11986 = G__11984__11985.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____11986) {
          return or__3824__auto____11986
        }else {
          return G__11984__11985.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__11984__11985.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11984__11985)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__11984__11985)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__11990__11991 = s;
  if(G__11990__11991) {
    if(function() {
      var or__3824__auto____11992 = G__11990__11991.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____11992) {
        return or__3824__auto____11992
      }else {
        return G__11990__11991.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__11990__11991.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11990__11991)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__11990__11991)
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
  var and__3822__auto____11995 = goog.isString(x);
  if(and__3822__auto____11995) {
    return!function() {
      var or__3824__auto____11996 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____11996) {
        return or__3824__auto____11996
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____11995
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____11998 = goog.isString(x);
  if(and__3822__auto____11998) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____11998
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____12000 = goog.isString(x);
  if(and__3822__auto____12000) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____12000
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____12005 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____12005) {
    return or__3824__auto____12005
  }else {
    var G__12006__12007 = f;
    if(G__12006__12007) {
      if(function() {
        var or__3824__auto____12008 = G__12006__12007.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____12008) {
          return or__3824__auto____12008
        }else {
          return G__12006__12007.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__12006__12007.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__12006__12007)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__12006__12007)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____12010 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____12010) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____12010
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
    var and__3822__auto____12013 = coll;
    if(cljs.core.truth_(and__3822__auto____12013)) {
      var and__3822__auto____12014 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____12014) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____12014
      }
    }else {
      return and__3822__auto____12013
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
    var G__12023__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__12019 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__12020 = more;
        while(true) {
          var x__12021 = cljs.core.first.call(null, xs__12020);
          var etc__12022 = cljs.core.next.call(null, xs__12020);
          if(cljs.core.truth_(xs__12020)) {
            if(cljs.core.contains_QMARK_.call(null, s__12019, x__12021)) {
              return false
            }else {
              var G__12024 = cljs.core.conj.call(null, s__12019, x__12021);
              var G__12025 = etc__12022;
              s__12019 = G__12024;
              xs__12020 = G__12025;
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
    var G__12023 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12023__delegate.call(this, x, y, more)
    };
    G__12023.cljs$lang$maxFixedArity = 2;
    G__12023.cljs$lang$applyTo = function(arglist__12026) {
      var x = cljs.core.first(arglist__12026);
      var y = cljs.core.first(cljs.core.next(arglist__12026));
      var more = cljs.core.rest(cljs.core.next(arglist__12026));
      return G__12023__delegate(x, y, more)
    };
    G__12023.cljs$lang$arity$variadic = G__12023__delegate;
    return G__12023
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
            var G__12030__12031 = x;
            if(G__12030__12031) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____12032 = null;
                if(cljs.core.truth_(or__3824__auto____12032)) {
                  return or__3824__auto____12032
                }else {
                  return G__12030__12031.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__12030__12031.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__12030__12031)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__12030__12031)
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
    var xl__12037 = cljs.core.count.call(null, xs);
    var yl__12038 = cljs.core.count.call(null, ys);
    if(xl__12037 < yl__12038) {
      return-1
    }else {
      if(xl__12037 > yl__12038) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__12037, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__12039 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____12040 = d__12039 === 0;
        if(and__3822__auto____12040) {
          return n + 1 < len
        }else {
          return and__3822__auto____12040
        }
      }()) {
        var G__12041 = xs;
        var G__12042 = ys;
        var G__12043 = len;
        var G__12044 = n + 1;
        xs = G__12041;
        ys = G__12042;
        len = G__12043;
        n = G__12044;
        continue
      }else {
        return d__12039
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
      var r__12046 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__12046)) {
        return r__12046
      }else {
        if(cljs.core.truth_(r__12046)) {
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
      var a__12048 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__12048, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__12048)
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
    var temp__3971__auto____12054 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____12054) {
      var s__12055 = temp__3971__auto____12054;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__12055), cljs.core.next.call(null, s__12055))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__12056 = val;
    var coll__12057 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__12057) {
        var nval__12058 = f.call(null, val__12056, cljs.core.first.call(null, coll__12057));
        if(cljs.core.reduced_QMARK_.call(null, nval__12058)) {
          return cljs.core.deref.call(null, nval__12058)
        }else {
          var G__12059 = nval__12058;
          var G__12060 = cljs.core.next.call(null, coll__12057);
          val__12056 = G__12059;
          coll__12057 = G__12060;
          continue
        }
      }else {
        return val__12056
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
  var a__12062 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__12062);
  return cljs.core.vec.call(null, a__12062)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__12069__12070 = coll;
      if(G__12069__12070) {
        if(function() {
          var or__3824__auto____12071 = G__12069__12070.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____12071) {
            return or__3824__auto____12071
          }else {
            return G__12069__12070.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__12069__12070.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__12069__12070)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__12069__12070)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__12072__12073 = coll;
      if(G__12072__12073) {
        if(function() {
          var or__3824__auto____12074 = G__12072__12073.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____12074) {
            return or__3824__auto____12074
          }else {
            return G__12072__12073.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__12072__12073.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__12072__12073)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__12072__12073)
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
  var this__12075 = this;
  return this__12075.val
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
    var G__12076__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__12076 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12076__delegate.call(this, x, y, more)
    };
    G__12076.cljs$lang$maxFixedArity = 2;
    G__12076.cljs$lang$applyTo = function(arglist__12077) {
      var x = cljs.core.first(arglist__12077);
      var y = cljs.core.first(cljs.core.next(arglist__12077));
      var more = cljs.core.rest(cljs.core.next(arglist__12077));
      return G__12076__delegate(x, y, more)
    };
    G__12076.cljs$lang$arity$variadic = G__12076__delegate;
    return G__12076
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
    var G__12078__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__12078 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12078__delegate.call(this, x, y, more)
    };
    G__12078.cljs$lang$maxFixedArity = 2;
    G__12078.cljs$lang$applyTo = function(arglist__12079) {
      var x = cljs.core.first(arglist__12079);
      var y = cljs.core.first(cljs.core.next(arglist__12079));
      var more = cljs.core.rest(cljs.core.next(arglist__12079));
      return G__12078__delegate(x, y, more)
    };
    G__12078.cljs$lang$arity$variadic = G__12078__delegate;
    return G__12078
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
    var G__12080__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__12080 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12080__delegate.call(this, x, y, more)
    };
    G__12080.cljs$lang$maxFixedArity = 2;
    G__12080.cljs$lang$applyTo = function(arglist__12081) {
      var x = cljs.core.first(arglist__12081);
      var y = cljs.core.first(cljs.core.next(arglist__12081));
      var more = cljs.core.rest(cljs.core.next(arglist__12081));
      return G__12080__delegate(x, y, more)
    };
    G__12080.cljs$lang$arity$variadic = G__12080__delegate;
    return G__12080
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
    var G__12082__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__12082 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12082__delegate.call(this, x, y, more)
    };
    G__12082.cljs$lang$maxFixedArity = 2;
    G__12082.cljs$lang$applyTo = function(arglist__12083) {
      var x = cljs.core.first(arglist__12083);
      var y = cljs.core.first(cljs.core.next(arglist__12083));
      var more = cljs.core.rest(cljs.core.next(arglist__12083));
      return G__12082__delegate(x, y, more)
    };
    G__12082.cljs$lang$arity$variadic = G__12082__delegate;
    return G__12082
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
    var G__12084__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__12085 = y;
            var G__12086 = cljs.core.first.call(null, more);
            var G__12087 = cljs.core.next.call(null, more);
            x = G__12085;
            y = G__12086;
            more = G__12087;
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
    var G__12084 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12084__delegate.call(this, x, y, more)
    };
    G__12084.cljs$lang$maxFixedArity = 2;
    G__12084.cljs$lang$applyTo = function(arglist__12088) {
      var x = cljs.core.first(arglist__12088);
      var y = cljs.core.first(cljs.core.next(arglist__12088));
      var more = cljs.core.rest(cljs.core.next(arglist__12088));
      return G__12084__delegate(x, y, more)
    };
    G__12084.cljs$lang$arity$variadic = G__12084__delegate;
    return G__12084
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
    var G__12089__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__12090 = y;
            var G__12091 = cljs.core.first.call(null, more);
            var G__12092 = cljs.core.next.call(null, more);
            x = G__12090;
            y = G__12091;
            more = G__12092;
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
    var G__12089 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12089__delegate.call(this, x, y, more)
    };
    G__12089.cljs$lang$maxFixedArity = 2;
    G__12089.cljs$lang$applyTo = function(arglist__12093) {
      var x = cljs.core.first(arglist__12093);
      var y = cljs.core.first(cljs.core.next(arglist__12093));
      var more = cljs.core.rest(cljs.core.next(arglist__12093));
      return G__12089__delegate(x, y, more)
    };
    G__12089.cljs$lang$arity$variadic = G__12089__delegate;
    return G__12089
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
    var G__12094__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__12095 = y;
            var G__12096 = cljs.core.first.call(null, more);
            var G__12097 = cljs.core.next.call(null, more);
            x = G__12095;
            y = G__12096;
            more = G__12097;
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
    var G__12094 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12094__delegate.call(this, x, y, more)
    };
    G__12094.cljs$lang$maxFixedArity = 2;
    G__12094.cljs$lang$applyTo = function(arglist__12098) {
      var x = cljs.core.first(arglist__12098);
      var y = cljs.core.first(cljs.core.next(arglist__12098));
      var more = cljs.core.rest(cljs.core.next(arglist__12098));
      return G__12094__delegate(x, y, more)
    };
    G__12094.cljs$lang$arity$variadic = G__12094__delegate;
    return G__12094
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
    var G__12099__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__12100 = y;
            var G__12101 = cljs.core.first.call(null, more);
            var G__12102 = cljs.core.next.call(null, more);
            x = G__12100;
            y = G__12101;
            more = G__12102;
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
    var G__12099 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12099__delegate.call(this, x, y, more)
    };
    G__12099.cljs$lang$maxFixedArity = 2;
    G__12099.cljs$lang$applyTo = function(arglist__12103) {
      var x = cljs.core.first(arglist__12103);
      var y = cljs.core.first(cljs.core.next(arglist__12103));
      var more = cljs.core.rest(cljs.core.next(arglist__12103));
      return G__12099__delegate(x, y, more)
    };
    G__12099.cljs$lang$arity$variadic = G__12099__delegate;
    return G__12099
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
    var G__12104__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__12104 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12104__delegate.call(this, x, y, more)
    };
    G__12104.cljs$lang$maxFixedArity = 2;
    G__12104.cljs$lang$applyTo = function(arglist__12105) {
      var x = cljs.core.first(arglist__12105);
      var y = cljs.core.first(cljs.core.next(arglist__12105));
      var more = cljs.core.rest(cljs.core.next(arglist__12105));
      return G__12104__delegate(x, y, more)
    };
    G__12104.cljs$lang$arity$variadic = G__12104__delegate;
    return G__12104
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
    var G__12106__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__12106 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12106__delegate.call(this, x, y, more)
    };
    G__12106.cljs$lang$maxFixedArity = 2;
    G__12106.cljs$lang$applyTo = function(arglist__12107) {
      var x = cljs.core.first(arglist__12107);
      var y = cljs.core.first(cljs.core.next(arglist__12107));
      var more = cljs.core.rest(cljs.core.next(arglist__12107));
      return G__12106__delegate(x, y, more)
    };
    G__12106.cljs$lang$arity$variadic = G__12106__delegate;
    return G__12106
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
  var rem__12109 = n % d;
  return cljs.core.fix.call(null, (n - rem__12109) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__12111 = cljs.core.quot.call(null, n, d);
  return n - d * q__12111
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
  var v__12114 = v - (v >> 1 & 1431655765);
  var v__12115 = (v__12114 & 858993459) + (v__12114 >> 2 & 858993459);
  return(v__12115 + (v__12115 >> 4) & 252645135) * 16843009 >> 24
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
    var G__12116__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__12117 = y;
            var G__12118 = cljs.core.first.call(null, more);
            var G__12119 = cljs.core.next.call(null, more);
            x = G__12117;
            y = G__12118;
            more = G__12119;
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
    var G__12116 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12116__delegate.call(this, x, y, more)
    };
    G__12116.cljs$lang$maxFixedArity = 2;
    G__12116.cljs$lang$applyTo = function(arglist__12120) {
      var x = cljs.core.first(arglist__12120);
      var y = cljs.core.first(cljs.core.next(arglist__12120));
      var more = cljs.core.rest(cljs.core.next(arglist__12120));
      return G__12116__delegate(x, y, more)
    };
    G__12116.cljs$lang$arity$variadic = G__12116__delegate;
    return G__12116
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
  var n__12124 = n;
  var xs__12125 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____12126 = xs__12125;
      if(and__3822__auto____12126) {
        return n__12124 > 0
      }else {
        return and__3822__auto____12126
      }
    }())) {
      var G__12127 = n__12124 - 1;
      var G__12128 = cljs.core.next.call(null, xs__12125);
      n__12124 = G__12127;
      xs__12125 = G__12128;
      continue
    }else {
      return xs__12125
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
    var G__12129__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__12130 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__12131 = cljs.core.next.call(null, more);
            sb = G__12130;
            more = G__12131;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__12129 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12129__delegate.call(this, x, ys)
    };
    G__12129.cljs$lang$maxFixedArity = 1;
    G__12129.cljs$lang$applyTo = function(arglist__12132) {
      var x = cljs.core.first(arglist__12132);
      var ys = cljs.core.rest(arglist__12132);
      return G__12129__delegate(x, ys)
    };
    G__12129.cljs$lang$arity$variadic = G__12129__delegate;
    return G__12129
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
    var G__12133__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__12134 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__12135 = cljs.core.next.call(null, more);
            sb = G__12134;
            more = G__12135;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__12133 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__12133__delegate.call(this, x, ys)
    };
    G__12133.cljs$lang$maxFixedArity = 1;
    G__12133.cljs$lang$applyTo = function(arglist__12136) {
      var x = cljs.core.first(arglist__12136);
      var ys = cljs.core.rest(arglist__12136);
      return G__12133__delegate(x, ys)
    };
    G__12133.cljs$lang$arity$variadic = G__12133__delegate;
    return G__12133
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
  format.cljs$lang$applyTo = function(arglist__12137) {
    var fmt = cljs.core.first(arglist__12137);
    var args = cljs.core.rest(arglist__12137);
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
    var xs__12140 = cljs.core.seq.call(null, x);
    var ys__12141 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__12140 == null) {
        return ys__12141 == null
      }else {
        if(ys__12141 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__12140), cljs.core.first.call(null, ys__12141))) {
            var G__12142 = cljs.core.next.call(null, xs__12140);
            var G__12143 = cljs.core.next.call(null, ys__12141);
            xs__12140 = G__12142;
            ys__12141 = G__12143;
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
  return cljs.core.reduce.call(null, function(p1__12144_SHARP_, p2__12145_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__12144_SHARP_, cljs.core.hash.call(null, p2__12145_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__12149 = 0;
  var s__12150 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__12150) {
      var e__12151 = cljs.core.first.call(null, s__12150);
      var G__12152 = (h__12149 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__12151)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__12151)))) % 4503599627370496;
      var G__12153 = cljs.core.next.call(null, s__12150);
      h__12149 = G__12152;
      s__12150 = G__12153;
      continue
    }else {
      return h__12149
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__12157 = 0;
  var s__12158 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__12158) {
      var e__12159 = cljs.core.first.call(null, s__12158);
      var G__12160 = (h__12157 + cljs.core.hash.call(null, e__12159)) % 4503599627370496;
      var G__12161 = cljs.core.next.call(null, s__12158);
      h__12157 = G__12160;
      s__12158 = G__12161;
      continue
    }else {
      return h__12157
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__12182__12183 = cljs.core.seq.call(null, fn_map);
  if(G__12182__12183) {
    var G__12185__12187 = cljs.core.first.call(null, G__12182__12183);
    var vec__12186__12188 = G__12185__12187;
    var key_name__12189 = cljs.core.nth.call(null, vec__12186__12188, 0, null);
    var f__12190 = cljs.core.nth.call(null, vec__12186__12188, 1, null);
    var G__12182__12191 = G__12182__12183;
    var G__12185__12192 = G__12185__12187;
    var G__12182__12193 = G__12182__12191;
    while(true) {
      var vec__12194__12195 = G__12185__12192;
      var key_name__12196 = cljs.core.nth.call(null, vec__12194__12195, 0, null);
      var f__12197 = cljs.core.nth.call(null, vec__12194__12195, 1, null);
      var G__12182__12198 = G__12182__12193;
      var str_name__12199 = cljs.core.name.call(null, key_name__12196);
      obj[str_name__12199] = f__12197;
      var temp__3974__auto____12200 = cljs.core.next.call(null, G__12182__12198);
      if(temp__3974__auto____12200) {
        var G__12182__12201 = temp__3974__auto____12200;
        var G__12202 = cljs.core.first.call(null, G__12182__12201);
        var G__12203 = G__12182__12201;
        G__12185__12192 = G__12202;
        G__12182__12193 = G__12203;
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
  var this__12204 = this;
  var h__6523__auto____12205 = this__12204.__hash;
  if(!(h__6523__auto____12205 == null)) {
    return h__6523__auto____12205
  }else {
    var h__6523__auto____12206 = cljs.core.hash_coll.call(null, coll);
    this__12204.__hash = h__6523__auto____12206;
    return h__6523__auto____12206
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__12207 = this;
  if(this__12207.count === 1) {
    return null
  }else {
    return this__12207.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12208 = this;
  return new cljs.core.List(this__12208.meta, o, coll, this__12208.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__12209 = this;
  var this__12210 = this;
  return cljs.core.pr_str.call(null, this__12210)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12211 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12212 = this;
  return this__12212.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__12213 = this;
  return this__12213.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__12214 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12215 = this;
  return this__12215.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12216 = this;
  if(this__12216.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__12216.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12217 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12218 = this;
  return new cljs.core.List(meta, this__12218.first, this__12218.rest, this__12218.count, this__12218.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12219 = this;
  return this__12219.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12220 = this;
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
  var this__12221 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__12222 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12223 = this;
  return new cljs.core.List(this__12223.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__12224 = this;
  var this__12225 = this;
  return cljs.core.pr_str.call(null, this__12225)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12226 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12227 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__12228 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__12229 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12230 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12231 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12232 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12233 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12234 = this;
  return this__12234.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12235 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__12239__12240 = coll;
  if(G__12239__12240) {
    if(function() {
      var or__3824__auto____12241 = G__12239__12240.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____12241) {
        return or__3824__auto____12241
      }else {
        return G__12239__12240.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__12239__12240.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__12239__12240)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__12239__12240)
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
    var G__12242__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__12242 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12242__delegate.call(this, x, y, z, items)
    };
    G__12242.cljs$lang$maxFixedArity = 3;
    G__12242.cljs$lang$applyTo = function(arglist__12243) {
      var x = cljs.core.first(arglist__12243);
      var y = cljs.core.first(cljs.core.next(arglist__12243));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12243)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12243)));
      return G__12242__delegate(x, y, z, items)
    };
    G__12242.cljs$lang$arity$variadic = G__12242__delegate;
    return G__12242
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
  var this__12244 = this;
  var h__6523__auto____12245 = this__12244.__hash;
  if(!(h__6523__auto____12245 == null)) {
    return h__6523__auto____12245
  }else {
    var h__6523__auto____12246 = cljs.core.hash_coll.call(null, coll);
    this__12244.__hash = h__6523__auto____12246;
    return h__6523__auto____12246
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__12247 = this;
  if(this__12247.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__12247.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12248 = this;
  return new cljs.core.Cons(null, o, coll, this__12248.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__12249 = this;
  var this__12250 = this;
  return cljs.core.pr_str.call(null, this__12250)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12251 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12252 = this;
  return this__12252.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12253 = this;
  if(this__12253.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__12253.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12254 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12255 = this;
  return new cljs.core.Cons(meta, this__12255.first, this__12255.rest, this__12255.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12256 = this;
  return this__12256.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12257 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12257.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____12262 = coll == null;
    if(or__3824__auto____12262) {
      return or__3824__auto____12262
    }else {
      var G__12263__12264 = coll;
      if(G__12263__12264) {
        if(function() {
          var or__3824__auto____12265 = G__12263__12264.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____12265) {
            return or__3824__auto____12265
          }else {
            return G__12263__12264.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__12263__12264.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__12263__12264)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__12263__12264)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__12269__12270 = x;
  if(G__12269__12270) {
    if(function() {
      var or__3824__auto____12271 = G__12269__12270.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____12271) {
        return or__3824__auto____12271
      }else {
        return G__12269__12270.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__12269__12270.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__12269__12270)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__12269__12270)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__12272 = null;
  var G__12272__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__12272__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__12272 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__12272__2.call(this, string, f);
      case 3:
        return G__12272__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12272
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__12273 = null;
  var G__12273__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__12273__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__12273 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12273__2.call(this, string, k);
      case 3:
        return G__12273__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12273
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__12274 = null;
  var G__12274__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__12274__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__12274 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12274__2.call(this, string, n);
      case 3:
        return G__12274__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12274
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
  var G__12286 = null;
  var G__12286__2 = function(this_sym12277, coll) {
    var this__12279 = this;
    var this_sym12277__12280 = this;
    var ___12281 = this_sym12277__12280;
    if(coll == null) {
      return null
    }else {
      var strobj__12282 = coll.strobj;
      if(strobj__12282 == null) {
        return cljs.core._lookup.call(null, coll, this__12279.k, null)
      }else {
        return strobj__12282[this__12279.k]
      }
    }
  };
  var G__12286__3 = function(this_sym12278, coll, not_found) {
    var this__12279 = this;
    var this_sym12278__12283 = this;
    var ___12284 = this_sym12278__12283;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__12279.k, not_found)
    }
  };
  G__12286 = function(this_sym12278, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12286__2.call(this, this_sym12278, coll);
      case 3:
        return G__12286__3.call(this, this_sym12278, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12286
}();
cljs.core.Keyword.prototype.apply = function(this_sym12275, args12276) {
  var this__12285 = this;
  return this_sym12275.call.apply(this_sym12275, [this_sym12275].concat(args12276.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__12295 = null;
  var G__12295__2 = function(this_sym12289, coll) {
    var this_sym12289__12291 = this;
    var this__12292 = this_sym12289__12291;
    return cljs.core._lookup.call(null, coll, this__12292.toString(), null)
  };
  var G__12295__3 = function(this_sym12290, coll, not_found) {
    var this_sym12290__12293 = this;
    var this__12294 = this_sym12290__12293;
    return cljs.core._lookup.call(null, coll, this__12294.toString(), not_found)
  };
  G__12295 = function(this_sym12290, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12295__2.call(this, this_sym12290, coll);
      case 3:
        return G__12295__3.call(this, this_sym12290, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12295
}();
String.prototype.apply = function(this_sym12287, args12288) {
  return this_sym12287.call.apply(this_sym12287, [this_sym12287].concat(args12288.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__12297 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__12297
  }else {
    lazy_seq.x = x__12297.call(null);
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
  var this__12298 = this;
  var h__6523__auto____12299 = this__12298.__hash;
  if(!(h__6523__auto____12299 == null)) {
    return h__6523__auto____12299
  }else {
    var h__6523__auto____12300 = cljs.core.hash_coll.call(null, coll);
    this__12298.__hash = h__6523__auto____12300;
    return h__6523__auto____12300
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__12301 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12302 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__12303 = this;
  var this__12304 = this;
  return cljs.core.pr_str.call(null, this__12304)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12305 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12306 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12307 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12308 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12309 = this;
  return new cljs.core.LazySeq(meta, this__12309.realized, this__12309.x, this__12309.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12310 = this;
  return this__12310.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12311 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12311.meta)
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
  var this__12312 = this;
  return this__12312.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__12313 = this;
  var ___12314 = this;
  this__12313.buf[this__12313.end] = o;
  return this__12313.end = this__12313.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__12315 = this;
  var ___12316 = this;
  var ret__12317 = new cljs.core.ArrayChunk(this__12315.buf, 0, this__12315.end);
  this__12315.buf = null;
  return ret__12317
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
  var this__12318 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__12318.arr[this__12318.off], this__12318.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__12319 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__12319.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__12320 = this;
  if(this__12320.off === this__12320.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__12320.arr, this__12320.off + 1, this__12320.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__12321 = this;
  return this__12321.arr[this__12321.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__12322 = this;
  if(function() {
    var and__3822__auto____12323 = i >= 0;
    if(and__3822__auto____12323) {
      return i < this__12322.end - this__12322.off
    }else {
      return and__3822__auto____12323
    }
  }()) {
    return this__12322.arr[this__12322.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__12324 = this;
  return this__12324.end - this__12324.off
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
  var this__12325 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12326 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12327 = this;
  return cljs.core._nth.call(null, this__12327.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12328 = this;
  if(cljs.core._count.call(null, this__12328.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__12328.chunk), this__12328.more, this__12328.meta)
  }else {
    if(this__12328.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__12328.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__12329 = this;
  if(this__12329.more == null) {
    return null
  }else {
    return this__12329.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12330 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__12331 = this;
  return new cljs.core.ChunkedCons(this__12331.chunk, this__12331.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12332 = this;
  return this__12332.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__12333 = this;
  return this__12333.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__12334 = this;
  if(this__12334.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__12334.more
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
    var G__12338__12339 = s;
    if(G__12338__12339) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____12340 = null;
        if(cljs.core.truth_(or__3824__auto____12340)) {
          return or__3824__auto____12340
        }else {
          return G__12338__12339.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__12338__12339.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__12338__12339)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__12338__12339)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__12343 = [];
  var s__12344 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__12344)) {
      ary__12343.push(cljs.core.first.call(null, s__12344));
      var G__12345 = cljs.core.next.call(null, s__12344);
      s__12344 = G__12345;
      continue
    }else {
      return ary__12343
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__12349 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__12350 = 0;
  var xs__12351 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__12351) {
      ret__12349[i__12350] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__12351));
      var G__12352 = i__12350 + 1;
      var G__12353 = cljs.core.next.call(null, xs__12351);
      i__12350 = G__12352;
      xs__12351 = G__12353;
      continue
    }else {
    }
    break
  }
  return ret__12349
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
    var a__12361 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__12362 = cljs.core.seq.call(null, init_val_or_seq);
      var i__12363 = 0;
      var s__12364 = s__12362;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____12365 = s__12364;
          if(and__3822__auto____12365) {
            return i__12363 < size
          }else {
            return and__3822__auto____12365
          }
        }())) {
          a__12361[i__12363] = cljs.core.first.call(null, s__12364);
          var G__12368 = i__12363 + 1;
          var G__12369 = cljs.core.next.call(null, s__12364);
          i__12363 = G__12368;
          s__12364 = G__12369;
          continue
        }else {
          return a__12361
        }
        break
      }
    }else {
      var n__6858__auto____12366 = size;
      var i__12367 = 0;
      while(true) {
        if(i__12367 < n__6858__auto____12366) {
          a__12361[i__12367] = init_val_or_seq;
          var G__12370 = i__12367 + 1;
          i__12367 = G__12370;
          continue
        }else {
        }
        break
      }
      return a__12361
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
    var a__12378 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__12379 = cljs.core.seq.call(null, init_val_or_seq);
      var i__12380 = 0;
      var s__12381 = s__12379;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____12382 = s__12381;
          if(and__3822__auto____12382) {
            return i__12380 < size
          }else {
            return and__3822__auto____12382
          }
        }())) {
          a__12378[i__12380] = cljs.core.first.call(null, s__12381);
          var G__12385 = i__12380 + 1;
          var G__12386 = cljs.core.next.call(null, s__12381);
          i__12380 = G__12385;
          s__12381 = G__12386;
          continue
        }else {
          return a__12378
        }
        break
      }
    }else {
      var n__6858__auto____12383 = size;
      var i__12384 = 0;
      while(true) {
        if(i__12384 < n__6858__auto____12383) {
          a__12378[i__12384] = init_val_or_seq;
          var G__12387 = i__12384 + 1;
          i__12384 = G__12387;
          continue
        }else {
        }
        break
      }
      return a__12378
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
    var a__12395 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__12396 = cljs.core.seq.call(null, init_val_or_seq);
      var i__12397 = 0;
      var s__12398 = s__12396;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____12399 = s__12398;
          if(and__3822__auto____12399) {
            return i__12397 < size
          }else {
            return and__3822__auto____12399
          }
        }())) {
          a__12395[i__12397] = cljs.core.first.call(null, s__12398);
          var G__12402 = i__12397 + 1;
          var G__12403 = cljs.core.next.call(null, s__12398);
          i__12397 = G__12402;
          s__12398 = G__12403;
          continue
        }else {
          return a__12395
        }
        break
      }
    }else {
      var n__6858__auto____12400 = size;
      var i__12401 = 0;
      while(true) {
        if(i__12401 < n__6858__auto____12400) {
          a__12395[i__12401] = init_val_or_seq;
          var G__12404 = i__12401 + 1;
          i__12401 = G__12404;
          continue
        }else {
        }
        break
      }
      return a__12395
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
    var s__12409 = s;
    var i__12410 = n;
    var sum__12411 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____12412 = i__12410 > 0;
        if(and__3822__auto____12412) {
          return cljs.core.seq.call(null, s__12409)
        }else {
          return and__3822__auto____12412
        }
      }())) {
        var G__12413 = cljs.core.next.call(null, s__12409);
        var G__12414 = i__12410 - 1;
        var G__12415 = sum__12411 + 1;
        s__12409 = G__12413;
        i__12410 = G__12414;
        sum__12411 = G__12415;
        continue
      }else {
        return sum__12411
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
      var s__12420 = cljs.core.seq.call(null, x);
      if(s__12420) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__12420)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__12420), concat.call(null, cljs.core.chunk_rest.call(null, s__12420), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__12420), concat.call(null, cljs.core.rest.call(null, s__12420), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__12424__delegate = function(x, y, zs) {
      var cat__12423 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__12422 = cljs.core.seq.call(null, xys);
          if(xys__12422) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__12422)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__12422), cat.call(null, cljs.core.chunk_rest.call(null, xys__12422), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__12422), cat.call(null, cljs.core.rest.call(null, xys__12422), zs))
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
      return cat__12423.call(null, concat.call(null, x, y), zs)
    };
    var G__12424 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12424__delegate.call(this, x, y, zs)
    };
    G__12424.cljs$lang$maxFixedArity = 2;
    G__12424.cljs$lang$applyTo = function(arglist__12425) {
      var x = cljs.core.first(arglist__12425);
      var y = cljs.core.first(cljs.core.next(arglist__12425));
      var zs = cljs.core.rest(cljs.core.next(arglist__12425));
      return G__12424__delegate(x, y, zs)
    };
    G__12424.cljs$lang$arity$variadic = G__12424__delegate;
    return G__12424
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
    var G__12426__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__12426 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__12426__delegate.call(this, a, b, c, d, more)
    };
    G__12426.cljs$lang$maxFixedArity = 4;
    G__12426.cljs$lang$applyTo = function(arglist__12427) {
      var a = cljs.core.first(arglist__12427);
      var b = cljs.core.first(cljs.core.next(arglist__12427));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12427)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12427))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12427))));
      return G__12426__delegate(a, b, c, d, more)
    };
    G__12426.cljs$lang$arity$variadic = G__12426__delegate;
    return G__12426
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
  var args__12469 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__12470 = cljs.core._first.call(null, args__12469);
    var args__12471 = cljs.core._rest.call(null, args__12469);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__12470)
      }else {
        return f.call(null, a__12470)
      }
    }else {
      var b__12472 = cljs.core._first.call(null, args__12471);
      var args__12473 = cljs.core._rest.call(null, args__12471);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__12470, b__12472)
        }else {
          return f.call(null, a__12470, b__12472)
        }
      }else {
        var c__12474 = cljs.core._first.call(null, args__12473);
        var args__12475 = cljs.core._rest.call(null, args__12473);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__12470, b__12472, c__12474)
          }else {
            return f.call(null, a__12470, b__12472, c__12474)
          }
        }else {
          var d__12476 = cljs.core._first.call(null, args__12475);
          var args__12477 = cljs.core._rest.call(null, args__12475);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__12470, b__12472, c__12474, d__12476)
            }else {
              return f.call(null, a__12470, b__12472, c__12474, d__12476)
            }
          }else {
            var e__12478 = cljs.core._first.call(null, args__12477);
            var args__12479 = cljs.core._rest.call(null, args__12477);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__12470, b__12472, c__12474, d__12476, e__12478)
              }else {
                return f.call(null, a__12470, b__12472, c__12474, d__12476, e__12478)
              }
            }else {
              var f__12480 = cljs.core._first.call(null, args__12479);
              var args__12481 = cljs.core._rest.call(null, args__12479);
              if(argc === 6) {
                if(f__12480.cljs$lang$arity$6) {
                  return f__12480.cljs$lang$arity$6(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480)
                }else {
                  return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480)
                }
              }else {
                var g__12482 = cljs.core._first.call(null, args__12481);
                var args__12483 = cljs.core._rest.call(null, args__12481);
                if(argc === 7) {
                  if(f__12480.cljs$lang$arity$7) {
                    return f__12480.cljs$lang$arity$7(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482)
                  }else {
                    return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482)
                  }
                }else {
                  var h__12484 = cljs.core._first.call(null, args__12483);
                  var args__12485 = cljs.core._rest.call(null, args__12483);
                  if(argc === 8) {
                    if(f__12480.cljs$lang$arity$8) {
                      return f__12480.cljs$lang$arity$8(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484)
                    }else {
                      return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484)
                    }
                  }else {
                    var i__12486 = cljs.core._first.call(null, args__12485);
                    var args__12487 = cljs.core._rest.call(null, args__12485);
                    if(argc === 9) {
                      if(f__12480.cljs$lang$arity$9) {
                        return f__12480.cljs$lang$arity$9(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486)
                      }else {
                        return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486)
                      }
                    }else {
                      var j__12488 = cljs.core._first.call(null, args__12487);
                      var args__12489 = cljs.core._rest.call(null, args__12487);
                      if(argc === 10) {
                        if(f__12480.cljs$lang$arity$10) {
                          return f__12480.cljs$lang$arity$10(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488)
                        }else {
                          return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488)
                        }
                      }else {
                        var k__12490 = cljs.core._first.call(null, args__12489);
                        var args__12491 = cljs.core._rest.call(null, args__12489);
                        if(argc === 11) {
                          if(f__12480.cljs$lang$arity$11) {
                            return f__12480.cljs$lang$arity$11(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490)
                          }else {
                            return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490)
                          }
                        }else {
                          var l__12492 = cljs.core._first.call(null, args__12491);
                          var args__12493 = cljs.core._rest.call(null, args__12491);
                          if(argc === 12) {
                            if(f__12480.cljs$lang$arity$12) {
                              return f__12480.cljs$lang$arity$12(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492)
                            }else {
                              return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492)
                            }
                          }else {
                            var m__12494 = cljs.core._first.call(null, args__12493);
                            var args__12495 = cljs.core._rest.call(null, args__12493);
                            if(argc === 13) {
                              if(f__12480.cljs$lang$arity$13) {
                                return f__12480.cljs$lang$arity$13(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494)
                              }else {
                                return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494)
                              }
                            }else {
                              var n__12496 = cljs.core._first.call(null, args__12495);
                              var args__12497 = cljs.core._rest.call(null, args__12495);
                              if(argc === 14) {
                                if(f__12480.cljs$lang$arity$14) {
                                  return f__12480.cljs$lang$arity$14(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496)
                                }else {
                                  return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496)
                                }
                              }else {
                                var o__12498 = cljs.core._first.call(null, args__12497);
                                var args__12499 = cljs.core._rest.call(null, args__12497);
                                if(argc === 15) {
                                  if(f__12480.cljs$lang$arity$15) {
                                    return f__12480.cljs$lang$arity$15(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498)
                                  }else {
                                    return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498)
                                  }
                                }else {
                                  var p__12500 = cljs.core._first.call(null, args__12499);
                                  var args__12501 = cljs.core._rest.call(null, args__12499);
                                  if(argc === 16) {
                                    if(f__12480.cljs$lang$arity$16) {
                                      return f__12480.cljs$lang$arity$16(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500)
                                    }else {
                                      return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500)
                                    }
                                  }else {
                                    var q__12502 = cljs.core._first.call(null, args__12501);
                                    var args__12503 = cljs.core._rest.call(null, args__12501);
                                    if(argc === 17) {
                                      if(f__12480.cljs$lang$arity$17) {
                                        return f__12480.cljs$lang$arity$17(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502)
                                      }else {
                                        return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502)
                                      }
                                    }else {
                                      var r__12504 = cljs.core._first.call(null, args__12503);
                                      var args__12505 = cljs.core._rest.call(null, args__12503);
                                      if(argc === 18) {
                                        if(f__12480.cljs$lang$arity$18) {
                                          return f__12480.cljs$lang$arity$18(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504)
                                        }else {
                                          return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504)
                                        }
                                      }else {
                                        var s__12506 = cljs.core._first.call(null, args__12505);
                                        var args__12507 = cljs.core._rest.call(null, args__12505);
                                        if(argc === 19) {
                                          if(f__12480.cljs$lang$arity$19) {
                                            return f__12480.cljs$lang$arity$19(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504, s__12506)
                                          }else {
                                            return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504, s__12506)
                                          }
                                        }else {
                                          var t__12508 = cljs.core._first.call(null, args__12507);
                                          var args__12509 = cljs.core._rest.call(null, args__12507);
                                          if(argc === 20) {
                                            if(f__12480.cljs$lang$arity$20) {
                                              return f__12480.cljs$lang$arity$20(a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504, s__12506, t__12508)
                                            }else {
                                              return f__12480.call(null, a__12470, b__12472, c__12474, d__12476, e__12478, f__12480, g__12482, h__12484, i__12486, j__12488, k__12490, l__12492, m__12494, n__12496, o__12498, p__12500, q__12502, r__12504, s__12506, t__12508)
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
    var fixed_arity__12524 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__12525 = cljs.core.bounded_count.call(null, args, fixed_arity__12524 + 1);
      if(bc__12525 <= fixed_arity__12524) {
        return cljs.core.apply_to.call(null, f, bc__12525, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__12526 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__12527 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__12528 = cljs.core.bounded_count.call(null, arglist__12526, fixed_arity__12527 + 1);
      if(bc__12528 <= fixed_arity__12527) {
        return cljs.core.apply_to.call(null, f, bc__12528, arglist__12526)
      }else {
        return f.cljs$lang$applyTo(arglist__12526)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__12526))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__12529 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__12530 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__12531 = cljs.core.bounded_count.call(null, arglist__12529, fixed_arity__12530 + 1);
      if(bc__12531 <= fixed_arity__12530) {
        return cljs.core.apply_to.call(null, f, bc__12531, arglist__12529)
      }else {
        return f.cljs$lang$applyTo(arglist__12529)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__12529))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__12532 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__12533 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__12534 = cljs.core.bounded_count.call(null, arglist__12532, fixed_arity__12533 + 1);
      if(bc__12534 <= fixed_arity__12533) {
        return cljs.core.apply_to.call(null, f, bc__12534, arglist__12532)
      }else {
        return f.cljs$lang$applyTo(arglist__12532)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__12532))
    }
  };
  var apply__6 = function() {
    var G__12538__delegate = function(f, a, b, c, d, args) {
      var arglist__12535 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__12536 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__12537 = cljs.core.bounded_count.call(null, arglist__12535, fixed_arity__12536 + 1);
        if(bc__12537 <= fixed_arity__12536) {
          return cljs.core.apply_to.call(null, f, bc__12537, arglist__12535)
        }else {
          return f.cljs$lang$applyTo(arglist__12535)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__12535))
      }
    };
    var G__12538 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__12538__delegate.call(this, f, a, b, c, d, args)
    };
    G__12538.cljs$lang$maxFixedArity = 5;
    G__12538.cljs$lang$applyTo = function(arglist__12539) {
      var f = cljs.core.first(arglist__12539);
      var a = cljs.core.first(cljs.core.next(arglist__12539));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12539)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12539))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12539)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12539)))));
      return G__12538__delegate(f, a, b, c, d, args)
    };
    G__12538.cljs$lang$arity$variadic = G__12538__delegate;
    return G__12538
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
  vary_meta.cljs$lang$applyTo = function(arglist__12540) {
    var obj = cljs.core.first(arglist__12540);
    var f = cljs.core.first(cljs.core.next(arglist__12540));
    var args = cljs.core.rest(cljs.core.next(arglist__12540));
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
    var G__12541__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__12541 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__12541__delegate.call(this, x, y, more)
    };
    G__12541.cljs$lang$maxFixedArity = 2;
    G__12541.cljs$lang$applyTo = function(arglist__12542) {
      var x = cljs.core.first(arglist__12542);
      var y = cljs.core.first(cljs.core.next(arglist__12542));
      var more = cljs.core.rest(cljs.core.next(arglist__12542));
      return G__12541__delegate(x, y, more)
    };
    G__12541.cljs$lang$arity$variadic = G__12541__delegate;
    return G__12541
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
        var G__12543 = pred;
        var G__12544 = cljs.core.next.call(null, coll);
        pred = G__12543;
        coll = G__12544;
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
      var or__3824__auto____12546 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____12546)) {
        return or__3824__auto____12546
      }else {
        var G__12547 = pred;
        var G__12548 = cljs.core.next.call(null, coll);
        pred = G__12547;
        coll = G__12548;
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
    var G__12549 = null;
    var G__12549__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__12549__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__12549__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__12549__3 = function() {
      var G__12550__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__12550 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__12550__delegate.call(this, x, y, zs)
      };
      G__12550.cljs$lang$maxFixedArity = 2;
      G__12550.cljs$lang$applyTo = function(arglist__12551) {
        var x = cljs.core.first(arglist__12551);
        var y = cljs.core.first(cljs.core.next(arglist__12551));
        var zs = cljs.core.rest(cljs.core.next(arglist__12551));
        return G__12550__delegate(x, y, zs)
      };
      G__12550.cljs$lang$arity$variadic = G__12550__delegate;
      return G__12550
    }();
    G__12549 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__12549__0.call(this);
        case 1:
          return G__12549__1.call(this, x);
        case 2:
          return G__12549__2.call(this, x, y);
        default:
          return G__12549__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__12549.cljs$lang$maxFixedArity = 2;
    G__12549.cljs$lang$applyTo = G__12549__3.cljs$lang$applyTo;
    return G__12549
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__12552__delegate = function(args) {
      return x
    };
    var G__12552 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__12552__delegate.call(this, args)
    };
    G__12552.cljs$lang$maxFixedArity = 0;
    G__12552.cljs$lang$applyTo = function(arglist__12553) {
      var args = cljs.core.seq(arglist__12553);
      return G__12552__delegate(args)
    };
    G__12552.cljs$lang$arity$variadic = G__12552__delegate;
    return G__12552
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
      var G__12560 = null;
      var G__12560__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__12560__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__12560__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__12560__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__12560__4 = function() {
        var G__12561__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__12561 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12561__delegate.call(this, x, y, z, args)
        };
        G__12561.cljs$lang$maxFixedArity = 3;
        G__12561.cljs$lang$applyTo = function(arglist__12562) {
          var x = cljs.core.first(arglist__12562);
          var y = cljs.core.first(cljs.core.next(arglist__12562));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12562)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12562)));
          return G__12561__delegate(x, y, z, args)
        };
        G__12561.cljs$lang$arity$variadic = G__12561__delegate;
        return G__12561
      }();
      G__12560 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__12560__0.call(this);
          case 1:
            return G__12560__1.call(this, x);
          case 2:
            return G__12560__2.call(this, x, y);
          case 3:
            return G__12560__3.call(this, x, y, z);
          default:
            return G__12560__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12560.cljs$lang$maxFixedArity = 3;
      G__12560.cljs$lang$applyTo = G__12560__4.cljs$lang$applyTo;
      return G__12560
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__12563 = null;
      var G__12563__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__12563__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__12563__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__12563__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__12563__4 = function() {
        var G__12564__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__12564 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12564__delegate.call(this, x, y, z, args)
        };
        G__12564.cljs$lang$maxFixedArity = 3;
        G__12564.cljs$lang$applyTo = function(arglist__12565) {
          var x = cljs.core.first(arglist__12565);
          var y = cljs.core.first(cljs.core.next(arglist__12565));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12565)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12565)));
          return G__12564__delegate(x, y, z, args)
        };
        G__12564.cljs$lang$arity$variadic = G__12564__delegate;
        return G__12564
      }();
      G__12563 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__12563__0.call(this);
          case 1:
            return G__12563__1.call(this, x);
          case 2:
            return G__12563__2.call(this, x, y);
          case 3:
            return G__12563__3.call(this, x, y, z);
          default:
            return G__12563__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12563.cljs$lang$maxFixedArity = 3;
      G__12563.cljs$lang$applyTo = G__12563__4.cljs$lang$applyTo;
      return G__12563
    }()
  };
  var comp__4 = function() {
    var G__12566__delegate = function(f1, f2, f3, fs) {
      var fs__12557 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__12567__delegate = function(args) {
          var ret__12558 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__12557), args);
          var fs__12559 = cljs.core.next.call(null, fs__12557);
          while(true) {
            if(fs__12559) {
              var G__12568 = cljs.core.first.call(null, fs__12559).call(null, ret__12558);
              var G__12569 = cljs.core.next.call(null, fs__12559);
              ret__12558 = G__12568;
              fs__12559 = G__12569;
              continue
            }else {
              return ret__12558
            }
            break
          }
        };
        var G__12567 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__12567__delegate.call(this, args)
        };
        G__12567.cljs$lang$maxFixedArity = 0;
        G__12567.cljs$lang$applyTo = function(arglist__12570) {
          var args = cljs.core.seq(arglist__12570);
          return G__12567__delegate(args)
        };
        G__12567.cljs$lang$arity$variadic = G__12567__delegate;
        return G__12567
      }()
    };
    var G__12566 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12566__delegate.call(this, f1, f2, f3, fs)
    };
    G__12566.cljs$lang$maxFixedArity = 3;
    G__12566.cljs$lang$applyTo = function(arglist__12571) {
      var f1 = cljs.core.first(arglist__12571);
      var f2 = cljs.core.first(cljs.core.next(arglist__12571));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12571)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12571)));
      return G__12566__delegate(f1, f2, f3, fs)
    };
    G__12566.cljs$lang$arity$variadic = G__12566__delegate;
    return G__12566
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
      var G__12572__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__12572 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__12572__delegate.call(this, args)
      };
      G__12572.cljs$lang$maxFixedArity = 0;
      G__12572.cljs$lang$applyTo = function(arglist__12573) {
        var args = cljs.core.seq(arglist__12573);
        return G__12572__delegate(args)
      };
      G__12572.cljs$lang$arity$variadic = G__12572__delegate;
      return G__12572
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__12574__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__12574 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__12574__delegate.call(this, args)
      };
      G__12574.cljs$lang$maxFixedArity = 0;
      G__12574.cljs$lang$applyTo = function(arglist__12575) {
        var args = cljs.core.seq(arglist__12575);
        return G__12574__delegate(args)
      };
      G__12574.cljs$lang$arity$variadic = G__12574__delegate;
      return G__12574
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__12576__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__12576 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__12576__delegate.call(this, args)
      };
      G__12576.cljs$lang$maxFixedArity = 0;
      G__12576.cljs$lang$applyTo = function(arglist__12577) {
        var args = cljs.core.seq(arglist__12577);
        return G__12576__delegate(args)
      };
      G__12576.cljs$lang$arity$variadic = G__12576__delegate;
      return G__12576
    }()
  };
  var partial__5 = function() {
    var G__12578__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__12579__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__12579 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__12579__delegate.call(this, args)
        };
        G__12579.cljs$lang$maxFixedArity = 0;
        G__12579.cljs$lang$applyTo = function(arglist__12580) {
          var args = cljs.core.seq(arglist__12580);
          return G__12579__delegate(args)
        };
        G__12579.cljs$lang$arity$variadic = G__12579__delegate;
        return G__12579
      }()
    };
    var G__12578 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__12578__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__12578.cljs$lang$maxFixedArity = 4;
    G__12578.cljs$lang$applyTo = function(arglist__12581) {
      var f = cljs.core.first(arglist__12581);
      var arg1 = cljs.core.first(cljs.core.next(arglist__12581));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12581)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12581))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__12581))));
      return G__12578__delegate(f, arg1, arg2, arg3, more)
    };
    G__12578.cljs$lang$arity$variadic = G__12578__delegate;
    return G__12578
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
      var G__12582 = null;
      var G__12582__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__12582__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__12582__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__12582__4 = function() {
        var G__12583__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__12583 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12583__delegate.call(this, a, b, c, ds)
        };
        G__12583.cljs$lang$maxFixedArity = 3;
        G__12583.cljs$lang$applyTo = function(arglist__12584) {
          var a = cljs.core.first(arglist__12584);
          var b = cljs.core.first(cljs.core.next(arglist__12584));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12584)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12584)));
          return G__12583__delegate(a, b, c, ds)
        };
        G__12583.cljs$lang$arity$variadic = G__12583__delegate;
        return G__12583
      }();
      G__12582 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__12582__1.call(this, a);
          case 2:
            return G__12582__2.call(this, a, b);
          case 3:
            return G__12582__3.call(this, a, b, c);
          default:
            return G__12582__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12582.cljs$lang$maxFixedArity = 3;
      G__12582.cljs$lang$applyTo = G__12582__4.cljs$lang$applyTo;
      return G__12582
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__12585 = null;
      var G__12585__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__12585__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__12585__4 = function() {
        var G__12586__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__12586 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12586__delegate.call(this, a, b, c, ds)
        };
        G__12586.cljs$lang$maxFixedArity = 3;
        G__12586.cljs$lang$applyTo = function(arglist__12587) {
          var a = cljs.core.first(arglist__12587);
          var b = cljs.core.first(cljs.core.next(arglist__12587));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12587)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12587)));
          return G__12586__delegate(a, b, c, ds)
        };
        G__12586.cljs$lang$arity$variadic = G__12586__delegate;
        return G__12586
      }();
      G__12585 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__12585__2.call(this, a, b);
          case 3:
            return G__12585__3.call(this, a, b, c);
          default:
            return G__12585__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12585.cljs$lang$maxFixedArity = 3;
      G__12585.cljs$lang$applyTo = G__12585__4.cljs$lang$applyTo;
      return G__12585
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__12588 = null;
      var G__12588__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__12588__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__12588__4 = function() {
        var G__12589__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__12589 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12589__delegate.call(this, a, b, c, ds)
        };
        G__12589.cljs$lang$maxFixedArity = 3;
        G__12589.cljs$lang$applyTo = function(arglist__12590) {
          var a = cljs.core.first(arglist__12590);
          var b = cljs.core.first(cljs.core.next(arglist__12590));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12590)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12590)));
          return G__12589__delegate(a, b, c, ds)
        };
        G__12589.cljs$lang$arity$variadic = G__12589__delegate;
        return G__12589
      }();
      G__12588 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__12588__2.call(this, a, b);
          case 3:
            return G__12588__3.call(this, a, b, c);
          default:
            return G__12588__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__12588.cljs$lang$maxFixedArity = 3;
      G__12588.cljs$lang$applyTo = G__12588__4.cljs$lang$applyTo;
      return G__12588
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
  var mapi__12606 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____12614 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____12614) {
        var s__12615 = temp__3974__auto____12614;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__12615)) {
          var c__12616 = cljs.core.chunk_first.call(null, s__12615);
          var size__12617 = cljs.core.count.call(null, c__12616);
          var b__12618 = cljs.core.chunk_buffer.call(null, size__12617);
          var n__6858__auto____12619 = size__12617;
          var i__12620 = 0;
          while(true) {
            if(i__12620 < n__6858__auto____12619) {
              cljs.core.chunk_append.call(null, b__12618, f.call(null, idx + i__12620, cljs.core._nth.call(null, c__12616, i__12620)));
              var G__12621 = i__12620 + 1;
              i__12620 = G__12621;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__12618), mapi.call(null, idx + size__12617, cljs.core.chunk_rest.call(null, s__12615)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__12615)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__12615)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__12606.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____12631 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____12631) {
      var s__12632 = temp__3974__auto____12631;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__12632)) {
        var c__12633 = cljs.core.chunk_first.call(null, s__12632);
        var size__12634 = cljs.core.count.call(null, c__12633);
        var b__12635 = cljs.core.chunk_buffer.call(null, size__12634);
        var n__6858__auto____12636 = size__12634;
        var i__12637 = 0;
        while(true) {
          if(i__12637 < n__6858__auto____12636) {
            var x__12638 = f.call(null, cljs.core._nth.call(null, c__12633, i__12637));
            if(x__12638 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__12635, x__12638)
            }
            var G__12640 = i__12637 + 1;
            i__12637 = G__12640;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__12635), keep.call(null, f, cljs.core.chunk_rest.call(null, s__12632)))
      }else {
        var x__12639 = f.call(null, cljs.core.first.call(null, s__12632));
        if(x__12639 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__12632))
        }else {
          return cljs.core.cons.call(null, x__12639, keep.call(null, f, cljs.core.rest.call(null, s__12632)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__12666 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____12676 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____12676) {
        var s__12677 = temp__3974__auto____12676;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__12677)) {
          var c__12678 = cljs.core.chunk_first.call(null, s__12677);
          var size__12679 = cljs.core.count.call(null, c__12678);
          var b__12680 = cljs.core.chunk_buffer.call(null, size__12679);
          var n__6858__auto____12681 = size__12679;
          var i__12682 = 0;
          while(true) {
            if(i__12682 < n__6858__auto____12681) {
              var x__12683 = f.call(null, idx + i__12682, cljs.core._nth.call(null, c__12678, i__12682));
              if(x__12683 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__12680, x__12683)
              }
              var G__12685 = i__12682 + 1;
              i__12682 = G__12685;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__12680), keepi.call(null, idx + size__12679, cljs.core.chunk_rest.call(null, s__12677)))
        }else {
          var x__12684 = f.call(null, idx, cljs.core.first.call(null, s__12677));
          if(x__12684 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__12677))
          }else {
            return cljs.core.cons.call(null, x__12684, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__12677)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__12666.call(null, 0, coll)
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
          var and__3822__auto____12771 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12771)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____12771
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____12772 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12772)) {
            var and__3822__auto____12773 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____12773)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____12773
            }
          }else {
            return and__3822__auto____12772
          }
        }())
      };
      var ep1__4 = function() {
        var G__12842__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____12774 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____12774)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____12774
            }
          }())
        };
        var G__12842 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12842__delegate.call(this, x, y, z, args)
        };
        G__12842.cljs$lang$maxFixedArity = 3;
        G__12842.cljs$lang$applyTo = function(arglist__12843) {
          var x = cljs.core.first(arglist__12843);
          var y = cljs.core.first(cljs.core.next(arglist__12843));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12843)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12843)));
          return G__12842__delegate(x, y, z, args)
        };
        G__12842.cljs$lang$arity$variadic = G__12842__delegate;
        return G__12842
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
          var and__3822__auto____12786 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12786)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____12786
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____12787 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12787)) {
            var and__3822__auto____12788 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____12788)) {
              var and__3822__auto____12789 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____12789)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____12789
              }
            }else {
              return and__3822__auto____12788
            }
          }else {
            return and__3822__auto____12787
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____12790 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12790)) {
            var and__3822__auto____12791 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____12791)) {
              var and__3822__auto____12792 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____12792)) {
                var and__3822__auto____12793 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____12793)) {
                  var and__3822__auto____12794 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____12794)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____12794
                  }
                }else {
                  return and__3822__auto____12793
                }
              }else {
                return and__3822__auto____12792
              }
            }else {
              return and__3822__auto____12791
            }
          }else {
            return and__3822__auto____12790
          }
        }())
      };
      var ep2__4 = function() {
        var G__12844__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____12795 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____12795)) {
              return cljs.core.every_QMARK_.call(null, function(p1__12641_SHARP_) {
                var and__3822__auto____12796 = p1.call(null, p1__12641_SHARP_);
                if(cljs.core.truth_(and__3822__auto____12796)) {
                  return p2.call(null, p1__12641_SHARP_)
                }else {
                  return and__3822__auto____12796
                }
              }, args)
            }else {
              return and__3822__auto____12795
            }
          }())
        };
        var G__12844 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12844__delegate.call(this, x, y, z, args)
        };
        G__12844.cljs$lang$maxFixedArity = 3;
        G__12844.cljs$lang$applyTo = function(arglist__12845) {
          var x = cljs.core.first(arglist__12845);
          var y = cljs.core.first(cljs.core.next(arglist__12845));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12845)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12845)));
          return G__12844__delegate(x, y, z, args)
        };
        G__12844.cljs$lang$arity$variadic = G__12844__delegate;
        return G__12844
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
          var and__3822__auto____12815 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12815)) {
            var and__3822__auto____12816 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____12816)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____12816
            }
          }else {
            return and__3822__auto____12815
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____12817 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12817)) {
            var and__3822__auto____12818 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____12818)) {
              var and__3822__auto____12819 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____12819)) {
                var and__3822__auto____12820 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____12820)) {
                  var and__3822__auto____12821 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____12821)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____12821
                  }
                }else {
                  return and__3822__auto____12820
                }
              }else {
                return and__3822__auto____12819
              }
            }else {
              return and__3822__auto____12818
            }
          }else {
            return and__3822__auto____12817
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____12822 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____12822)) {
            var and__3822__auto____12823 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____12823)) {
              var and__3822__auto____12824 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____12824)) {
                var and__3822__auto____12825 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____12825)) {
                  var and__3822__auto____12826 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____12826)) {
                    var and__3822__auto____12827 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____12827)) {
                      var and__3822__auto____12828 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____12828)) {
                        var and__3822__auto____12829 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____12829)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____12829
                        }
                      }else {
                        return and__3822__auto____12828
                      }
                    }else {
                      return and__3822__auto____12827
                    }
                  }else {
                    return and__3822__auto____12826
                  }
                }else {
                  return and__3822__auto____12825
                }
              }else {
                return and__3822__auto____12824
              }
            }else {
              return and__3822__auto____12823
            }
          }else {
            return and__3822__auto____12822
          }
        }())
      };
      var ep3__4 = function() {
        var G__12846__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____12830 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____12830)) {
              return cljs.core.every_QMARK_.call(null, function(p1__12642_SHARP_) {
                var and__3822__auto____12831 = p1.call(null, p1__12642_SHARP_);
                if(cljs.core.truth_(and__3822__auto____12831)) {
                  var and__3822__auto____12832 = p2.call(null, p1__12642_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____12832)) {
                    return p3.call(null, p1__12642_SHARP_)
                  }else {
                    return and__3822__auto____12832
                  }
                }else {
                  return and__3822__auto____12831
                }
              }, args)
            }else {
              return and__3822__auto____12830
            }
          }())
        };
        var G__12846 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__12846__delegate.call(this, x, y, z, args)
        };
        G__12846.cljs$lang$maxFixedArity = 3;
        G__12846.cljs$lang$applyTo = function(arglist__12847) {
          var x = cljs.core.first(arglist__12847);
          var y = cljs.core.first(cljs.core.next(arglist__12847));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12847)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12847)));
          return G__12846__delegate(x, y, z, args)
        };
        G__12846.cljs$lang$arity$variadic = G__12846__delegate;
        return G__12846
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
    var G__12848__delegate = function(p1, p2, p3, ps) {
      var ps__12833 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__12643_SHARP_) {
            return p1__12643_SHARP_.call(null, x)
          }, ps__12833)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__12644_SHARP_) {
            var and__3822__auto____12838 = p1__12644_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____12838)) {
              return p1__12644_SHARP_.call(null, y)
            }else {
              return and__3822__auto____12838
            }
          }, ps__12833)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__12645_SHARP_) {
            var and__3822__auto____12839 = p1__12645_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____12839)) {
              var and__3822__auto____12840 = p1__12645_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____12840)) {
                return p1__12645_SHARP_.call(null, z)
              }else {
                return and__3822__auto____12840
              }
            }else {
              return and__3822__auto____12839
            }
          }, ps__12833)
        };
        var epn__4 = function() {
          var G__12849__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____12841 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____12841)) {
                return cljs.core.every_QMARK_.call(null, function(p1__12646_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__12646_SHARP_, args)
                }, ps__12833)
              }else {
                return and__3822__auto____12841
              }
            }())
          };
          var G__12849 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__12849__delegate.call(this, x, y, z, args)
          };
          G__12849.cljs$lang$maxFixedArity = 3;
          G__12849.cljs$lang$applyTo = function(arglist__12850) {
            var x = cljs.core.first(arglist__12850);
            var y = cljs.core.first(cljs.core.next(arglist__12850));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12850)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12850)));
            return G__12849__delegate(x, y, z, args)
          };
          G__12849.cljs$lang$arity$variadic = G__12849__delegate;
          return G__12849
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
    var G__12848 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__12848__delegate.call(this, p1, p2, p3, ps)
    };
    G__12848.cljs$lang$maxFixedArity = 3;
    G__12848.cljs$lang$applyTo = function(arglist__12851) {
      var p1 = cljs.core.first(arglist__12851);
      var p2 = cljs.core.first(cljs.core.next(arglist__12851));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__12851)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__12851)));
      return G__12848__delegate(p1, p2, p3, ps)
    };
    G__12848.cljs$lang$arity$variadic = G__12848__delegate;
    return G__12848
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
        var or__3824__auto____12932 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12932)) {
          return or__3824__auto____12932
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____12933 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12933)) {
          return or__3824__auto____12933
        }else {
          var or__3824__auto____12934 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____12934)) {
            return or__3824__auto____12934
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__13003__delegate = function(x, y, z, args) {
          var or__3824__auto____12935 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____12935)) {
            return or__3824__auto____12935
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__13003 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13003__delegate.call(this, x, y, z, args)
        };
        G__13003.cljs$lang$maxFixedArity = 3;
        G__13003.cljs$lang$applyTo = function(arglist__13004) {
          var x = cljs.core.first(arglist__13004);
          var y = cljs.core.first(cljs.core.next(arglist__13004));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13004)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13004)));
          return G__13003__delegate(x, y, z, args)
        };
        G__13003.cljs$lang$arity$variadic = G__13003__delegate;
        return G__13003
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
        var or__3824__auto____12947 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12947)) {
          return or__3824__auto____12947
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____12948 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12948)) {
          return or__3824__auto____12948
        }else {
          var or__3824__auto____12949 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____12949)) {
            return or__3824__auto____12949
          }else {
            var or__3824__auto____12950 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____12950)) {
              return or__3824__auto____12950
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____12951 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12951)) {
          return or__3824__auto____12951
        }else {
          var or__3824__auto____12952 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____12952)) {
            return or__3824__auto____12952
          }else {
            var or__3824__auto____12953 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____12953)) {
              return or__3824__auto____12953
            }else {
              var or__3824__auto____12954 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____12954)) {
                return or__3824__auto____12954
              }else {
                var or__3824__auto____12955 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____12955)) {
                  return or__3824__auto____12955
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__13005__delegate = function(x, y, z, args) {
          var or__3824__auto____12956 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____12956)) {
            return or__3824__auto____12956
          }else {
            return cljs.core.some.call(null, function(p1__12686_SHARP_) {
              var or__3824__auto____12957 = p1.call(null, p1__12686_SHARP_);
              if(cljs.core.truth_(or__3824__auto____12957)) {
                return or__3824__auto____12957
              }else {
                return p2.call(null, p1__12686_SHARP_)
              }
            }, args)
          }
        };
        var G__13005 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13005__delegate.call(this, x, y, z, args)
        };
        G__13005.cljs$lang$maxFixedArity = 3;
        G__13005.cljs$lang$applyTo = function(arglist__13006) {
          var x = cljs.core.first(arglist__13006);
          var y = cljs.core.first(cljs.core.next(arglist__13006));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13006)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13006)));
          return G__13005__delegate(x, y, z, args)
        };
        G__13005.cljs$lang$arity$variadic = G__13005__delegate;
        return G__13005
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
        var or__3824__auto____12976 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12976)) {
          return or__3824__auto____12976
        }else {
          var or__3824__auto____12977 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____12977)) {
            return or__3824__auto____12977
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____12978 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12978)) {
          return or__3824__auto____12978
        }else {
          var or__3824__auto____12979 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____12979)) {
            return or__3824__auto____12979
          }else {
            var or__3824__auto____12980 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____12980)) {
              return or__3824__auto____12980
            }else {
              var or__3824__auto____12981 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____12981)) {
                return or__3824__auto____12981
              }else {
                var or__3824__auto____12982 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____12982)) {
                  return or__3824__auto____12982
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____12983 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____12983)) {
          return or__3824__auto____12983
        }else {
          var or__3824__auto____12984 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____12984)) {
            return or__3824__auto____12984
          }else {
            var or__3824__auto____12985 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____12985)) {
              return or__3824__auto____12985
            }else {
              var or__3824__auto____12986 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____12986)) {
                return or__3824__auto____12986
              }else {
                var or__3824__auto____12987 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____12987)) {
                  return or__3824__auto____12987
                }else {
                  var or__3824__auto____12988 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____12988)) {
                    return or__3824__auto____12988
                  }else {
                    var or__3824__auto____12989 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____12989)) {
                      return or__3824__auto____12989
                    }else {
                      var or__3824__auto____12990 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____12990)) {
                        return or__3824__auto____12990
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
        var G__13007__delegate = function(x, y, z, args) {
          var or__3824__auto____12991 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____12991)) {
            return or__3824__auto____12991
          }else {
            return cljs.core.some.call(null, function(p1__12687_SHARP_) {
              var or__3824__auto____12992 = p1.call(null, p1__12687_SHARP_);
              if(cljs.core.truth_(or__3824__auto____12992)) {
                return or__3824__auto____12992
              }else {
                var or__3824__auto____12993 = p2.call(null, p1__12687_SHARP_);
                if(cljs.core.truth_(or__3824__auto____12993)) {
                  return or__3824__auto____12993
                }else {
                  return p3.call(null, p1__12687_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__13007 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13007__delegate.call(this, x, y, z, args)
        };
        G__13007.cljs$lang$maxFixedArity = 3;
        G__13007.cljs$lang$applyTo = function(arglist__13008) {
          var x = cljs.core.first(arglist__13008);
          var y = cljs.core.first(cljs.core.next(arglist__13008));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13008)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13008)));
          return G__13007__delegate(x, y, z, args)
        };
        G__13007.cljs$lang$arity$variadic = G__13007__delegate;
        return G__13007
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
    var G__13009__delegate = function(p1, p2, p3, ps) {
      var ps__12994 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__12688_SHARP_) {
            return p1__12688_SHARP_.call(null, x)
          }, ps__12994)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__12689_SHARP_) {
            var or__3824__auto____12999 = p1__12689_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____12999)) {
              return or__3824__auto____12999
            }else {
              return p1__12689_SHARP_.call(null, y)
            }
          }, ps__12994)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__12690_SHARP_) {
            var or__3824__auto____13000 = p1__12690_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____13000)) {
              return or__3824__auto____13000
            }else {
              var or__3824__auto____13001 = p1__12690_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____13001)) {
                return or__3824__auto____13001
              }else {
                return p1__12690_SHARP_.call(null, z)
              }
            }
          }, ps__12994)
        };
        var spn__4 = function() {
          var G__13010__delegate = function(x, y, z, args) {
            var or__3824__auto____13002 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____13002)) {
              return or__3824__auto____13002
            }else {
              return cljs.core.some.call(null, function(p1__12691_SHARP_) {
                return cljs.core.some.call(null, p1__12691_SHARP_, args)
              }, ps__12994)
            }
          };
          var G__13010 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13010__delegate.call(this, x, y, z, args)
          };
          G__13010.cljs$lang$maxFixedArity = 3;
          G__13010.cljs$lang$applyTo = function(arglist__13011) {
            var x = cljs.core.first(arglist__13011);
            var y = cljs.core.first(cljs.core.next(arglist__13011));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13011)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13011)));
            return G__13010__delegate(x, y, z, args)
          };
          G__13010.cljs$lang$arity$variadic = G__13010__delegate;
          return G__13010
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
    var G__13009 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13009__delegate.call(this, p1, p2, p3, ps)
    };
    G__13009.cljs$lang$maxFixedArity = 3;
    G__13009.cljs$lang$applyTo = function(arglist__13012) {
      var p1 = cljs.core.first(arglist__13012);
      var p2 = cljs.core.first(cljs.core.next(arglist__13012));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13012)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13012)));
      return G__13009__delegate(p1, p2, p3, ps)
    };
    G__13009.cljs$lang$arity$variadic = G__13009__delegate;
    return G__13009
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
      var temp__3974__auto____13031 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13031) {
        var s__13032 = temp__3974__auto____13031;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__13032)) {
          var c__13033 = cljs.core.chunk_first.call(null, s__13032);
          var size__13034 = cljs.core.count.call(null, c__13033);
          var b__13035 = cljs.core.chunk_buffer.call(null, size__13034);
          var n__6858__auto____13036 = size__13034;
          var i__13037 = 0;
          while(true) {
            if(i__13037 < n__6858__auto____13036) {
              cljs.core.chunk_append.call(null, b__13035, f.call(null, cljs.core._nth.call(null, c__13033, i__13037)));
              var G__13049 = i__13037 + 1;
              i__13037 = G__13049;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__13035), map.call(null, f, cljs.core.chunk_rest.call(null, s__13032)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__13032)), map.call(null, f, cljs.core.rest.call(null, s__13032)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__13038 = cljs.core.seq.call(null, c1);
      var s2__13039 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____13040 = s1__13038;
        if(and__3822__auto____13040) {
          return s2__13039
        }else {
          return and__3822__auto____13040
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__13038), cljs.core.first.call(null, s2__13039)), map.call(null, f, cljs.core.rest.call(null, s1__13038), cljs.core.rest.call(null, s2__13039)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__13041 = cljs.core.seq.call(null, c1);
      var s2__13042 = cljs.core.seq.call(null, c2);
      var s3__13043 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____13044 = s1__13041;
        if(and__3822__auto____13044) {
          var and__3822__auto____13045 = s2__13042;
          if(and__3822__auto____13045) {
            return s3__13043
          }else {
            return and__3822__auto____13045
          }
        }else {
          return and__3822__auto____13044
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__13041), cljs.core.first.call(null, s2__13042), cljs.core.first.call(null, s3__13043)), map.call(null, f, cljs.core.rest.call(null, s1__13041), cljs.core.rest.call(null, s2__13042), cljs.core.rest.call(null, s3__13043)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__13050__delegate = function(f, c1, c2, c3, colls) {
      var step__13048 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__13047 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__13047)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__13047), step.call(null, map.call(null, cljs.core.rest, ss__13047)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__12852_SHARP_) {
        return cljs.core.apply.call(null, f, p1__12852_SHARP_)
      }, step__13048.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__13050 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__13050__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__13050.cljs$lang$maxFixedArity = 4;
    G__13050.cljs$lang$applyTo = function(arglist__13051) {
      var f = cljs.core.first(arglist__13051);
      var c1 = cljs.core.first(cljs.core.next(arglist__13051));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13051)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13051))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13051))));
      return G__13050__delegate(f, c1, c2, c3, colls)
    };
    G__13050.cljs$lang$arity$variadic = G__13050__delegate;
    return G__13050
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
      var temp__3974__auto____13054 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13054) {
        var s__13055 = temp__3974__auto____13054;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__13055), take.call(null, n - 1, cljs.core.rest.call(null, s__13055)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__13061 = function(n, coll) {
    while(true) {
      var s__13059 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13060 = n > 0;
        if(and__3822__auto____13060) {
          return s__13059
        }else {
          return and__3822__auto____13060
        }
      }())) {
        var G__13062 = n - 1;
        var G__13063 = cljs.core.rest.call(null, s__13059);
        n = G__13062;
        coll = G__13063;
        continue
      }else {
        return s__13059
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__13061.call(null, n, coll)
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
  var s__13066 = cljs.core.seq.call(null, coll);
  var lead__13067 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__13067) {
      var G__13068 = cljs.core.next.call(null, s__13066);
      var G__13069 = cljs.core.next.call(null, lead__13067);
      s__13066 = G__13068;
      lead__13067 = G__13069;
      continue
    }else {
      return s__13066
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__13075 = function(pred, coll) {
    while(true) {
      var s__13073 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____13074 = s__13073;
        if(and__3822__auto____13074) {
          return pred.call(null, cljs.core.first.call(null, s__13073))
        }else {
          return and__3822__auto____13074
        }
      }())) {
        var G__13076 = pred;
        var G__13077 = cljs.core.rest.call(null, s__13073);
        pred = G__13076;
        coll = G__13077;
        continue
      }else {
        return s__13073
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__13075.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____13080 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____13080) {
      var s__13081 = temp__3974__auto____13080;
      return cljs.core.concat.call(null, s__13081, cycle.call(null, s__13081))
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
      var s1__13086 = cljs.core.seq.call(null, c1);
      var s2__13087 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____13088 = s1__13086;
        if(and__3822__auto____13088) {
          return s2__13087
        }else {
          return and__3822__auto____13088
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__13086), cljs.core.cons.call(null, cljs.core.first.call(null, s2__13087), interleave.call(null, cljs.core.rest.call(null, s1__13086), cljs.core.rest.call(null, s2__13087))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__13090__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__13089 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__13089)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__13089), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__13089)))
        }else {
          return null
        }
      }, null)
    };
    var G__13090 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13090__delegate.call(this, c1, c2, colls)
    };
    G__13090.cljs$lang$maxFixedArity = 2;
    G__13090.cljs$lang$applyTo = function(arglist__13091) {
      var c1 = cljs.core.first(arglist__13091);
      var c2 = cljs.core.first(cljs.core.next(arglist__13091));
      var colls = cljs.core.rest(cljs.core.next(arglist__13091));
      return G__13090__delegate(c1, c2, colls)
    };
    G__13090.cljs$lang$arity$variadic = G__13090__delegate;
    return G__13090
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
  var cat__13101 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____13099 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____13099) {
        var coll__13100 = temp__3971__auto____13099;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__13100), cat.call(null, cljs.core.rest.call(null, coll__13100), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__13101.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__13102__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__13102 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__13102__delegate.call(this, f, coll, colls)
    };
    G__13102.cljs$lang$maxFixedArity = 2;
    G__13102.cljs$lang$applyTo = function(arglist__13103) {
      var f = cljs.core.first(arglist__13103);
      var coll = cljs.core.first(cljs.core.next(arglist__13103));
      var colls = cljs.core.rest(cljs.core.next(arglist__13103));
      return G__13102__delegate(f, coll, colls)
    };
    G__13102.cljs$lang$arity$variadic = G__13102__delegate;
    return G__13102
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
    var temp__3974__auto____13113 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____13113) {
      var s__13114 = temp__3974__auto____13113;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__13114)) {
        var c__13115 = cljs.core.chunk_first.call(null, s__13114);
        var size__13116 = cljs.core.count.call(null, c__13115);
        var b__13117 = cljs.core.chunk_buffer.call(null, size__13116);
        var n__6858__auto____13118 = size__13116;
        var i__13119 = 0;
        while(true) {
          if(i__13119 < n__6858__auto____13118) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__13115, i__13119)))) {
              cljs.core.chunk_append.call(null, b__13117, cljs.core._nth.call(null, c__13115, i__13119))
            }else {
            }
            var G__13122 = i__13119 + 1;
            i__13119 = G__13122;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__13117), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__13114)))
      }else {
        var f__13120 = cljs.core.first.call(null, s__13114);
        var r__13121 = cljs.core.rest.call(null, s__13114);
        if(cljs.core.truth_(pred.call(null, f__13120))) {
          return cljs.core.cons.call(null, f__13120, filter.call(null, pred, r__13121))
        }else {
          return filter.call(null, pred, r__13121)
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
  var walk__13125 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__13125.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__13123_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__13123_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__13129__13130 = to;
    if(G__13129__13130) {
      if(function() {
        var or__3824__auto____13131 = G__13129__13130.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____13131) {
          return or__3824__auto____13131
        }else {
          return G__13129__13130.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__13129__13130.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__13129__13130)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__13129__13130)
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
    var G__13132__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__13132 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__13132__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__13132.cljs$lang$maxFixedArity = 4;
    G__13132.cljs$lang$applyTo = function(arglist__13133) {
      var f = cljs.core.first(arglist__13133);
      var c1 = cljs.core.first(cljs.core.next(arglist__13133));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13133)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13133))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13133))));
      return G__13132__delegate(f, c1, c2, c3, colls)
    };
    G__13132.cljs$lang$arity$variadic = G__13132__delegate;
    return G__13132
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
      var temp__3974__auto____13140 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13140) {
        var s__13141 = temp__3974__auto____13140;
        var p__13142 = cljs.core.take.call(null, n, s__13141);
        if(n === cljs.core.count.call(null, p__13142)) {
          return cljs.core.cons.call(null, p__13142, partition.call(null, n, step, cljs.core.drop.call(null, step, s__13141)))
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
      var temp__3974__auto____13143 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13143) {
        var s__13144 = temp__3974__auto____13143;
        var p__13145 = cljs.core.take.call(null, n, s__13144);
        if(n === cljs.core.count.call(null, p__13145)) {
          return cljs.core.cons.call(null, p__13145, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__13144)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__13145, pad)))
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
    var sentinel__13150 = cljs.core.lookup_sentinel;
    var m__13151 = m;
    var ks__13152 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__13152) {
        var m__13153 = cljs.core._lookup.call(null, m__13151, cljs.core.first.call(null, ks__13152), sentinel__13150);
        if(sentinel__13150 === m__13153) {
          return not_found
        }else {
          var G__13154 = sentinel__13150;
          var G__13155 = m__13153;
          var G__13156 = cljs.core.next.call(null, ks__13152);
          sentinel__13150 = G__13154;
          m__13151 = G__13155;
          ks__13152 = G__13156;
          continue
        }
      }else {
        return m__13151
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
cljs.core.assoc_in = function assoc_in(m, p__13157, v) {
  var vec__13162__13163 = p__13157;
  var k__13164 = cljs.core.nth.call(null, vec__13162__13163, 0, null);
  var ks__13165 = cljs.core.nthnext.call(null, vec__13162__13163, 1);
  if(cljs.core.truth_(ks__13165)) {
    return cljs.core.assoc.call(null, m, k__13164, assoc_in.call(null, cljs.core._lookup.call(null, m, k__13164, null), ks__13165, v))
  }else {
    return cljs.core.assoc.call(null, m, k__13164, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__13166, f, args) {
    var vec__13171__13172 = p__13166;
    var k__13173 = cljs.core.nth.call(null, vec__13171__13172, 0, null);
    var ks__13174 = cljs.core.nthnext.call(null, vec__13171__13172, 1);
    if(cljs.core.truth_(ks__13174)) {
      return cljs.core.assoc.call(null, m, k__13173, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__13173, null), ks__13174, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__13173, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__13173, null), args))
    }
  };
  var update_in = function(m, p__13166, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__13166, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__13175) {
    var m = cljs.core.first(arglist__13175);
    var p__13166 = cljs.core.first(cljs.core.next(arglist__13175));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13175)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13175)));
    return update_in__delegate(m, p__13166, f, args)
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
  var this__13178 = this;
  var h__6523__auto____13179 = this__13178.__hash;
  if(!(h__6523__auto____13179 == null)) {
    return h__6523__auto____13179
  }else {
    var h__6523__auto____13180 = cljs.core.hash_coll.call(null, coll);
    this__13178.__hash = h__6523__auto____13180;
    return h__6523__auto____13180
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13181 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13182 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13183 = this;
  var new_array__13184 = this__13183.array.slice();
  new_array__13184[k] = v;
  return new cljs.core.Vector(this__13183.meta, new_array__13184, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__13215 = null;
  var G__13215__2 = function(this_sym13185, k) {
    var this__13187 = this;
    var this_sym13185__13188 = this;
    var coll__13189 = this_sym13185__13188;
    return coll__13189.cljs$core$ILookup$_lookup$arity$2(coll__13189, k)
  };
  var G__13215__3 = function(this_sym13186, k, not_found) {
    var this__13187 = this;
    var this_sym13186__13190 = this;
    var coll__13191 = this_sym13186__13190;
    return coll__13191.cljs$core$ILookup$_lookup$arity$3(coll__13191, k, not_found)
  };
  G__13215 = function(this_sym13186, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13215__2.call(this, this_sym13186, k);
      case 3:
        return G__13215__3.call(this, this_sym13186, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13215
}();
cljs.core.Vector.prototype.apply = function(this_sym13176, args13177) {
  var this__13192 = this;
  return this_sym13176.call.apply(this_sym13176, [this_sym13176].concat(args13177.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13193 = this;
  var new_array__13194 = this__13193.array.slice();
  new_array__13194.push(o);
  return new cljs.core.Vector(this__13193.meta, new_array__13194, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__13195 = this;
  var this__13196 = this;
  return cljs.core.pr_str.call(null, this__13196)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__13197 = this;
  return cljs.core.ci_reduce.call(null, this__13197.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__13198 = this;
  return cljs.core.ci_reduce.call(null, this__13198.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13199 = this;
  if(this__13199.array.length > 0) {
    var vector_seq__13200 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__13199.array.length) {
          return cljs.core.cons.call(null, this__13199.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__13200.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13201 = this;
  return this__13201.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__13202 = this;
  var count__13203 = this__13202.array.length;
  if(count__13203 > 0) {
    return this__13202.array[count__13203 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__13204 = this;
  if(this__13204.array.length > 0) {
    var new_array__13205 = this__13204.array.slice();
    new_array__13205.pop();
    return new cljs.core.Vector(this__13204.meta, new_array__13205, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__13206 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13207 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13208 = this;
  return new cljs.core.Vector(meta, this__13208.array, this__13208.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13209 = this;
  return this__13209.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__13210 = this;
  if(function() {
    var and__3822__auto____13211 = 0 <= n;
    if(and__3822__auto____13211) {
      return n < this__13210.array.length
    }else {
      return and__3822__auto____13211
    }
  }()) {
    return this__13210.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__13212 = this;
  if(function() {
    var and__3822__auto____13213 = 0 <= n;
    if(and__3822__auto____13213) {
      return n < this__13212.array.length
    }else {
      return and__3822__auto____13213
    }
  }()) {
    return this__13212.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13214 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__13214.meta)
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
  var cnt__13217 = pv.cnt;
  if(cnt__13217 < 32) {
    return 0
  }else {
    return cnt__13217 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__13223 = level;
  var ret__13224 = node;
  while(true) {
    if(ll__13223 === 0) {
      return ret__13224
    }else {
      var embed__13225 = ret__13224;
      var r__13226 = cljs.core.pv_fresh_node.call(null, edit);
      var ___13227 = cljs.core.pv_aset.call(null, r__13226, 0, embed__13225);
      var G__13228 = ll__13223 - 5;
      var G__13229 = r__13226;
      ll__13223 = G__13228;
      ret__13224 = G__13229;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__13235 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__13236 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__13235, subidx__13236, tailnode);
    return ret__13235
  }else {
    var child__13237 = cljs.core.pv_aget.call(null, parent, subidx__13236);
    if(!(child__13237 == null)) {
      var node_to_insert__13238 = push_tail.call(null, pv, level - 5, child__13237, tailnode);
      cljs.core.pv_aset.call(null, ret__13235, subidx__13236, node_to_insert__13238);
      return ret__13235
    }else {
      var node_to_insert__13239 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__13235, subidx__13236, node_to_insert__13239);
      return ret__13235
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____13243 = 0 <= i;
    if(and__3822__auto____13243) {
      return i < pv.cnt
    }else {
      return and__3822__auto____13243
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__13244 = pv.root;
      var level__13245 = pv.shift;
      while(true) {
        if(level__13245 > 0) {
          var G__13246 = cljs.core.pv_aget.call(null, node__13244, i >>> level__13245 & 31);
          var G__13247 = level__13245 - 5;
          node__13244 = G__13246;
          level__13245 = G__13247;
          continue
        }else {
          return node__13244.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__13250 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__13250, i & 31, val);
    return ret__13250
  }else {
    var subidx__13251 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__13250, subidx__13251, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__13251), i, val));
    return ret__13250
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__13257 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__13258 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__13257));
    if(function() {
      var and__3822__auto____13259 = new_child__13258 == null;
      if(and__3822__auto____13259) {
        return subidx__13257 === 0
      }else {
        return and__3822__auto____13259
      }
    }()) {
      return null
    }else {
      var ret__13260 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__13260, subidx__13257, new_child__13258);
      return ret__13260
    }
  }else {
    if(subidx__13257 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__13261 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__13261, subidx__13257, null);
        return ret__13261
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
  var this__13264 = this;
  return new cljs.core.TransientVector(this__13264.cnt, this__13264.shift, cljs.core.tv_editable_root.call(null, this__13264.root), cljs.core.tv_editable_tail.call(null, this__13264.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__13265 = this;
  var h__6523__auto____13266 = this__13265.__hash;
  if(!(h__6523__auto____13266 == null)) {
    return h__6523__auto____13266
  }else {
    var h__6523__auto____13267 = cljs.core.hash_coll.call(null, coll);
    this__13265.__hash = h__6523__auto____13267;
    return h__6523__auto____13267
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13268 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13269 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13270 = this;
  if(function() {
    var and__3822__auto____13271 = 0 <= k;
    if(and__3822__auto____13271) {
      return k < this__13270.cnt
    }else {
      return and__3822__auto____13271
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__13272 = this__13270.tail.slice();
      new_tail__13272[k & 31] = v;
      return new cljs.core.PersistentVector(this__13270.meta, this__13270.cnt, this__13270.shift, this__13270.root, new_tail__13272, null)
    }else {
      return new cljs.core.PersistentVector(this__13270.meta, this__13270.cnt, this__13270.shift, cljs.core.do_assoc.call(null, coll, this__13270.shift, this__13270.root, k, v), this__13270.tail, null)
    }
  }else {
    if(k === this__13270.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__13270.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__13320 = null;
  var G__13320__2 = function(this_sym13273, k) {
    var this__13275 = this;
    var this_sym13273__13276 = this;
    var coll__13277 = this_sym13273__13276;
    return coll__13277.cljs$core$ILookup$_lookup$arity$2(coll__13277, k)
  };
  var G__13320__3 = function(this_sym13274, k, not_found) {
    var this__13275 = this;
    var this_sym13274__13278 = this;
    var coll__13279 = this_sym13274__13278;
    return coll__13279.cljs$core$ILookup$_lookup$arity$3(coll__13279, k, not_found)
  };
  G__13320 = function(this_sym13274, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13320__2.call(this, this_sym13274, k);
      case 3:
        return G__13320__3.call(this, this_sym13274, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13320
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym13262, args13263) {
  var this__13280 = this;
  return this_sym13262.call.apply(this_sym13262, [this_sym13262].concat(args13263.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__13281 = this;
  var step_init__13282 = [0, init];
  var i__13283 = 0;
  while(true) {
    if(i__13283 < this__13281.cnt) {
      var arr__13284 = cljs.core.array_for.call(null, v, i__13283);
      var len__13285 = arr__13284.length;
      var init__13289 = function() {
        var j__13286 = 0;
        var init__13287 = step_init__13282[1];
        while(true) {
          if(j__13286 < len__13285) {
            var init__13288 = f.call(null, init__13287, j__13286 + i__13283, arr__13284[j__13286]);
            if(cljs.core.reduced_QMARK_.call(null, init__13288)) {
              return init__13288
            }else {
              var G__13321 = j__13286 + 1;
              var G__13322 = init__13288;
              j__13286 = G__13321;
              init__13287 = G__13322;
              continue
            }
          }else {
            step_init__13282[0] = len__13285;
            step_init__13282[1] = init__13287;
            return init__13287
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__13289)) {
        return cljs.core.deref.call(null, init__13289)
      }else {
        var G__13323 = i__13283 + step_init__13282[0];
        i__13283 = G__13323;
        continue
      }
    }else {
      return step_init__13282[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13290 = this;
  if(this__13290.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__13291 = this__13290.tail.slice();
    new_tail__13291.push(o);
    return new cljs.core.PersistentVector(this__13290.meta, this__13290.cnt + 1, this__13290.shift, this__13290.root, new_tail__13291, null)
  }else {
    var root_overflow_QMARK___13292 = this__13290.cnt >>> 5 > 1 << this__13290.shift;
    var new_shift__13293 = root_overflow_QMARK___13292 ? this__13290.shift + 5 : this__13290.shift;
    var new_root__13295 = root_overflow_QMARK___13292 ? function() {
      var n_r__13294 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__13294, 0, this__13290.root);
      cljs.core.pv_aset.call(null, n_r__13294, 1, cljs.core.new_path.call(null, null, this__13290.shift, new cljs.core.VectorNode(null, this__13290.tail)));
      return n_r__13294
    }() : cljs.core.push_tail.call(null, coll, this__13290.shift, this__13290.root, new cljs.core.VectorNode(null, this__13290.tail));
    return new cljs.core.PersistentVector(this__13290.meta, this__13290.cnt + 1, new_shift__13293, new_root__13295, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__13296 = this;
  if(this__13296.cnt > 0) {
    return new cljs.core.RSeq(coll, this__13296.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__13297 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__13298 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__13299 = this;
  var this__13300 = this;
  return cljs.core.pr_str.call(null, this__13300)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__13301 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__13302 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13303 = this;
  if(this__13303.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13304 = this;
  return this__13304.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__13305 = this;
  if(this__13305.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__13305.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__13306 = this;
  if(this__13306.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__13306.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__13306.meta)
    }else {
      if(1 < this__13306.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__13306.meta, this__13306.cnt - 1, this__13306.shift, this__13306.root, this__13306.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__13307 = cljs.core.array_for.call(null, coll, this__13306.cnt - 2);
          var nr__13308 = cljs.core.pop_tail.call(null, coll, this__13306.shift, this__13306.root);
          var new_root__13309 = nr__13308 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__13308;
          var cnt_1__13310 = this__13306.cnt - 1;
          if(function() {
            var and__3822__auto____13311 = 5 < this__13306.shift;
            if(and__3822__auto____13311) {
              return cljs.core.pv_aget.call(null, new_root__13309, 1) == null
            }else {
              return and__3822__auto____13311
            }
          }()) {
            return new cljs.core.PersistentVector(this__13306.meta, cnt_1__13310, this__13306.shift - 5, cljs.core.pv_aget.call(null, new_root__13309, 0), new_tail__13307, null)
          }else {
            return new cljs.core.PersistentVector(this__13306.meta, cnt_1__13310, this__13306.shift, new_root__13309, new_tail__13307, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__13312 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13313 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13314 = this;
  return new cljs.core.PersistentVector(meta, this__13314.cnt, this__13314.shift, this__13314.root, this__13314.tail, this__13314.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13315 = this;
  return this__13315.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__13316 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__13317 = this;
  if(function() {
    var and__3822__auto____13318 = 0 <= n;
    if(and__3822__auto____13318) {
      return n < this__13317.cnt
    }else {
      return and__3822__auto____13318
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13319 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__13319.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__13324 = xs.length;
  var xs__13325 = no_clone === true ? xs : xs.slice();
  if(l__13324 < 32) {
    return new cljs.core.PersistentVector(null, l__13324, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__13325, null)
  }else {
    var node__13326 = xs__13325.slice(0, 32);
    var v__13327 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__13326, null);
    var i__13328 = 32;
    var out__13329 = cljs.core._as_transient.call(null, v__13327);
    while(true) {
      if(i__13328 < l__13324) {
        var G__13330 = i__13328 + 1;
        var G__13331 = cljs.core.conj_BANG_.call(null, out__13329, xs__13325[i__13328]);
        i__13328 = G__13330;
        out__13329 = G__13331;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__13329)
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
  vector.cljs$lang$applyTo = function(arglist__13332) {
    var args = cljs.core.seq(arglist__13332);
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
  var this__13333 = this;
  if(this__13333.off + 1 < this__13333.node.length) {
    var s__13334 = cljs.core.chunked_seq.call(null, this__13333.vec, this__13333.node, this__13333.i, this__13333.off + 1);
    if(s__13334 == null) {
      return null
    }else {
      return s__13334
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13335 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13336 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__13337 = this;
  return this__13337.node[this__13337.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__13338 = this;
  if(this__13338.off + 1 < this__13338.node.length) {
    var s__13339 = cljs.core.chunked_seq.call(null, this__13338.vec, this__13338.node, this__13338.i, this__13338.off + 1);
    if(s__13339 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__13339
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__13340 = this;
  var l__13341 = this__13340.node.length;
  var s__13342 = this__13340.i + l__13341 < cljs.core._count.call(null, this__13340.vec) ? cljs.core.chunked_seq.call(null, this__13340.vec, this__13340.i + l__13341, 0) : null;
  if(s__13342 == null) {
    return null
  }else {
    return s__13342
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13343 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__13344 = this;
  return cljs.core.chunked_seq.call(null, this__13344.vec, this__13344.node, this__13344.i, this__13344.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__13345 = this;
  return this__13345.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13346 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__13346.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__13347 = this;
  return cljs.core.array_chunk.call(null, this__13347.node, this__13347.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__13348 = this;
  var l__13349 = this__13348.node.length;
  var s__13350 = this__13348.i + l__13349 < cljs.core._count.call(null, this__13348.vec) ? cljs.core.chunked_seq.call(null, this__13348.vec, this__13348.i + l__13349, 0) : null;
  if(s__13350 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__13350
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
  var this__13353 = this;
  var h__6523__auto____13354 = this__13353.__hash;
  if(!(h__6523__auto____13354 == null)) {
    return h__6523__auto____13354
  }else {
    var h__6523__auto____13355 = cljs.core.hash_coll.call(null, coll);
    this__13353.__hash = h__6523__auto____13355;
    return h__6523__auto____13355
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13356 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13357 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__13358 = this;
  var v_pos__13359 = this__13358.start + key;
  return new cljs.core.Subvec(this__13358.meta, cljs.core._assoc.call(null, this__13358.v, v_pos__13359, val), this__13358.start, this__13358.end > v_pos__13359 + 1 ? this__13358.end : v_pos__13359 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__13385 = null;
  var G__13385__2 = function(this_sym13360, k) {
    var this__13362 = this;
    var this_sym13360__13363 = this;
    var coll__13364 = this_sym13360__13363;
    return coll__13364.cljs$core$ILookup$_lookup$arity$2(coll__13364, k)
  };
  var G__13385__3 = function(this_sym13361, k, not_found) {
    var this__13362 = this;
    var this_sym13361__13365 = this;
    var coll__13366 = this_sym13361__13365;
    return coll__13366.cljs$core$ILookup$_lookup$arity$3(coll__13366, k, not_found)
  };
  G__13385 = function(this_sym13361, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13385__2.call(this, this_sym13361, k);
      case 3:
        return G__13385__3.call(this, this_sym13361, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13385
}();
cljs.core.Subvec.prototype.apply = function(this_sym13351, args13352) {
  var this__13367 = this;
  return this_sym13351.call.apply(this_sym13351, [this_sym13351].concat(args13352.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13368 = this;
  return new cljs.core.Subvec(this__13368.meta, cljs.core._assoc_n.call(null, this__13368.v, this__13368.end, o), this__13368.start, this__13368.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__13369 = this;
  var this__13370 = this;
  return cljs.core.pr_str.call(null, this__13370)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__13371 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__13372 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13373 = this;
  var subvec_seq__13374 = function subvec_seq(i) {
    if(i === this__13373.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__13373.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__13374.call(null, this__13373.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13375 = this;
  return this__13375.end - this__13375.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__13376 = this;
  return cljs.core._nth.call(null, this__13376.v, this__13376.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__13377 = this;
  if(this__13377.start === this__13377.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__13377.meta, this__13377.v, this__13377.start, this__13377.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__13378 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13379 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13380 = this;
  return new cljs.core.Subvec(meta, this__13380.v, this__13380.start, this__13380.end, this__13380.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13381 = this;
  return this__13381.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__13382 = this;
  return cljs.core._nth.call(null, this__13382.v, this__13382.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__13383 = this;
  return cljs.core._nth.call(null, this__13383.v, this__13383.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13384 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__13384.meta)
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
  var ret__13387 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__13387, 0, tl.length);
  return ret__13387
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__13391 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__13392 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__13391, subidx__13392, level === 5 ? tail_node : function() {
    var child__13393 = cljs.core.pv_aget.call(null, ret__13391, subidx__13392);
    if(!(child__13393 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__13393, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__13391
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__13398 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__13399 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__13400 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__13398, subidx__13399));
    if(function() {
      var and__3822__auto____13401 = new_child__13400 == null;
      if(and__3822__auto____13401) {
        return subidx__13399 === 0
      }else {
        return and__3822__auto____13401
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__13398, subidx__13399, new_child__13400);
      return node__13398
    }
  }else {
    if(subidx__13399 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__13398, subidx__13399, null);
        return node__13398
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____13406 = 0 <= i;
    if(and__3822__auto____13406) {
      return i < tv.cnt
    }else {
      return and__3822__auto____13406
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__13407 = tv.root;
      var node__13408 = root__13407;
      var level__13409 = tv.shift;
      while(true) {
        if(level__13409 > 0) {
          var G__13410 = cljs.core.tv_ensure_editable.call(null, root__13407.edit, cljs.core.pv_aget.call(null, node__13408, i >>> level__13409 & 31));
          var G__13411 = level__13409 - 5;
          node__13408 = G__13410;
          level__13409 = G__13411;
          continue
        }else {
          return node__13408.arr
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
  var G__13451 = null;
  var G__13451__2 = function(this_sym13414, k) {
    var this__13416 = this;
    var this_sym13414__13417 = this;
    var coll__13418 = this_sym13414__13417;
    return coll__13418.cljs$core$ILookup$_lookup$arity$2(coll__13418, k)
  };
  var G__13451__3 = function(this_sym13415, k, not_found) {
    var this__13416 = this;
    var this_sym13415__13419 = this;
    var coll__13420 = this_sym13415__13419;
    return coll__13420.cljs$core$ILookup$_lookup$arity$3(coll__13420, k, not_found)
  };
  G__13451 = function(this_sym13415, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13451__2.call(this, this_sym13415, k);
      case 3:
        return G__13451__3.call(this, this_sym13415, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13451
}();
cljs.core.TransientVector.prototype.apply = function(this_sym13412, args13413) {
  var this__13421 = this;
  return this_sym13412.call.apply(this_sym13412, [this_sym13412].concat(args13413.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13422 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13423 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__13424 = this;
  if(this__13424.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__13425 = this;
  if(function() {
    var and__3822__auto____13426 = 0 <= n;
    if(and__3822__auto____13426) {
      return n < this__13425.cnt
    }else {
      return and__3822__auto____13426
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13427 = this;
  if(this__13427.root.edit) {
    return this__13427.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__13428 = this;
  if(this__13428.root.edit) {
    if(function() {
      var and__3822__auto____13429 = 0 <= n;
      if(and__3822__auto____13429) {
        return n < this__13428.cnt
      }else {
        return and__3822__auto____13429
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__13428.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__13434 = function go(level, node) {
          var node__13432 = cljs.core.tv_ensure_editable.call(null, this__13428.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__13432, n & 31, val);
            return node__13432
          }else {
            var subidx__13433 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__13432, subidx__13433, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__13432, subidx__13433)));
            return node__13432
          }
        }.call(null, this__13428.shift, this__13428.root);
        this__13428.root = new_root__13434;
        return tcoll
      }
    }else {
      if(n === this__13428.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__13428.cnt)].join(""));
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
  var this__13435 = this;
  if(this__13435.root.edit) {
    if(this__13435.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__13435.cnt) {
        this__13435.cnt = 0;
        return tcoll
      }else {
        if((this__13435.cnt - 1 & 31) > 0) {
          this__13435.cnt = this__13435.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__13436 = cljs.core.editable_array_for.call(null, tcoll, this__13435.cnt - 2);
            var new_root__13438 = function() {
              var nr__13437 = cljs.core.tv_pop_tail.call(null, tcoll, this__13435.shift, this__13435.root);
              if(!(nr__13437 == null)) {
                return nr__13437
              }else {
                return new cljs.core.VectorNode(this__13435.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____13439 = 5 < this__13435.shift;
              if(and__3822__auto____13439) {
                return cljs.core.pv_aget.call(null, new_root__13438, 1) == null
              }else {
                return and__3822__auto____13439
              }
            }()) {
              var new_root__13440 = cljs.core.tv_ensure_editable.call(null, this__13435.root.edit, cljs.core.pv_aget.call(null, new_root__13438, 0));
              this__13435.root = new_root__13440;
              this__13435.shift = this__13435.shift - 5;
              this__13435.cnt = this__13435.cnt - 1;
              this__13435.tail = new_tail__13436;
              return tcoll
            }else {
              this__13435.root = new_root__13438;
              this__13435.cnt = this__13435.cnt - 1;
              this__13435.tail = new_tail__13436;
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
  var this__13441 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__13442 = this;
  if(this__13442.root.edit) {
    if(this__13442.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__13442.tail[this__13442.cnt & 31] = o;
      this__13442.cnt = this__13442.cnt + 1;
      return tcoll
    }else {
      var tail_node__13443 = new cljs.core.VectorNode(this__13442.root.edit, this__13442.tail);
      var new_tail__13444 = cljs.core.make_array.call(null, 32);
      new_tail__13444[0] = o;
      this__13442.tail = new_tail__13444;
      if(this__13442.cnt >>> 5 > 1 << this__13442.shift) {
        var new_root_array__13445 = cljs.core.make_array.call(null, 32);
        var new_shift__13446 = this__13442.shift + 5;
        new_root_array__13445[0] = this__13442.root;
        new_root_array__13445[1] = cljs.core.new_path.call(null, this__13442.root.edit, this__13442.shift, tail_node__13443);
        this__13442.root = new cljs.core.VectorNode(this__13442.root.edit, new_root_array__13445);
        this__13442.shift = new_shift__13446;
        this__13442.cnt = this__13442.cnt + 1;
        return tcoll
      }else {
        var new_root__13447 = cljs.core.tv_push_tail.call(null, tcoll, this__13442.shift, this__13442.root, tail_node__13443);
        this__13442.root = new_root__13447;
        this__13442.cnt = this__13442.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__13448 = this;
  if(this__13448.root.edit) {
    this__13448.root.edit = null;
    var len__13449 = this__13448.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__13450 = cljs.core.make_array.call(null, len__13449);
    cljs.core.array_copy.call(null, this__13448.tail, 0, trimmed_tail__13450, 0, len__13449);
    return new cljs.core.PersistentVector(null, this__13448.cnt, this__13448.shift, this__13448.root, trimmed_tail__13450, null)
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
  var this__13452 = this;
  var h__6523__auto____13453 = this__13452.__hash;
  if(!(h__6523__auto____13453 == null)) {
    return h__6523__auto____13453
  }else {
    var h__6523__auto____13454 = cljs.core.hash_coll.call(null, coll);
    this__13452.__hash = h__6523__auto____13454;
    return h__6523__auto____13454
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13455 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__13456 = this;
  var this__13457 = this;
  return cljs.core.pr_str.call(null, this__13457)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13458 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__13459 = this;
  return cljs.core._first.call(null, this__13459.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__13460 = this;
  var temp__3971__auto____13461 = cljs.core.next.call(null, this__13460.front);
  if(temp__3971__auto____13461) {
    var f1__13462 = temp__3971__auto____13461;
    return new cljs.core.PersistentQueueSeq(this__13460.meta, f1__13462, this__13460.rear, null)
  }else {
    if(this__13460.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__13460.meta, this__13460.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13463 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13464 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__13464.front, this__13464.rear, this__13464.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13465 = this;
  return this__13465.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13466 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13466.meta)
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
  var this__13467 = this;
  var h__6523__auto____13468 = this__13467.__hash;
  if(!(h__6523__auto____13468 == null)) {
    return h__6523__auto____13468
  }else {
    var h__6523__auto____13469 = cljs.core.hash_coll.call(null, coll);
    this__13467.__hash = h__6523__auto____13469;
    return h__6523__auto____13469
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13470 = this;
  if(cljs.core.truth_(this__13470.front)) {
    return new cljs.core.PersistentQueue(this__13470.meta, this__13470.count + 1, this__13470.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____13471 = this__13470.rear;
      if(cljs.core.truth_(or__3824__auto____13471)) {
        return or__3824__auto____13471
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__13470.meta, this__13470.count + 1, cljs.core.conj.call(null, this__13470.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__13472 = this;
  var this__13473 = this;
  return cljs.core.pr_str.call(null, this__13473)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13474 = this;
  var rear__13475 = cljs.core.seq.call(null, this__13474.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____13476 = this__13474.front;
    if(cljs.core.truth_(or__3824__auto____13476)) {
      return or__3824__auto____13476
    }else {
      return rear__13475
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__13474.front, cljs.core.seq.call(null, rear__13475), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13477 = this;
  return this__13477.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__13478 = this;
  return cljs.core._first.call(null, this__13478.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__13479 = this;
  if(cljs.core.truth_(this__13479.front)) {
    var temp__3971__auto____13480 = cljs.core.next.call(null, this__13479.front);
    if(temp__3971__auto____13480) {
      var f1__13481 = temp__3971__auto____13480;
      return new cljs.core.PersistentQueue(this__13479.meta, this__13479.count - 1, f1__13481, this__13479.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__13479.meta, this__13479.count - 1, cljs.core.seq.call(null, this__13479.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__13482 = this;
  return cljs.core.first.call(null, this__13482.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__13483 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13484 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13485 = this;
  return new cljs.core.PersistentQueue(meta, this__13485.count, this__13485.front, this__13485.rear, this__13485.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13486 = this;
  return this__13486.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13487 = this;
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
  var this__13488 = this;
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
  var len__13491 = array.length;
  var i__13492 = 0;
  while(true) {
    if(i__13492 < len__13491) {
      if(k === array[i__13492]) {
        return i__13492
      }else {
        var G__13493 = i__13492 + incr;
        i__13492 = G__13493;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__13496 = cljs.core.hash.call(null, a);
  var b__13497 = cljs.core.hash.call(null, b);
  if(a__13496 < b__13497) {
    return-1
  }else {
    if(a__13496 > b__13497) {
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
  var ks__13505 = m.keys;
  var len__13506 = ks__13505.length;
  var so__13507 = m.strobj;
  var out__13508 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__13509 = 0;
  var out__13510 = cljs.core.transient$.call(null, out__13508);
  while(true) {
    if(i__13509 < len__13506) {
      var k__13511 = ks__13505[i__13509];
      var G__13512 = i__13509 + 1;
      var G__13513 = cljs.core.assoc_BANG_.call(null, out__13510, k__13511, so__13507[k__13511]);
      i__13509 = G__13512;
      out__13510 = G__13513;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__13510, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__13519 = {};
  var l__13520 = ks.length;
  var i__13521 = 0;
  while(true) {
    if(i__13521 < l__13520) {
      var k__13522 = ks[i__13521];
      new_obj__13519[k__13522] = obj[k__13522];
      var G__13523 = i__13521 + 1;
      i__13521 = G__13523;
      continue
    }else {
    }
    break
  }
  return new_obj__13519
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
  var this__13526 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__13527 = this;
  var h__6523__auto____13528 = this__13527.__hash;
  if(!(h__6523__auto____13528 == null)) {
    return h__6523__auto____13528
  }else {
    var h__6523__auto____13529 = cljs.core.hash_imap.call(null, coll);
    this__13527.__hash = h__6523__auto____13529;
    return h__6523__auto____13529
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13530 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13531 = this;
  if(function() {
    var and__3822__auto____13532 = goog.isString(k);
    if(and__3822__auto____13532) {
      return!(cljs.core.scan_array.call(null, 1, k, this__13531.keys) == null)
    }else {
      return and__3822__auto____13532
    }
  }()) {
    return this__13531.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13533 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____13534 = this__13533.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____13534) {
        return or__3824__auto____13534
      }else {
        return this__13533.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__13533.keys) == null)) {
        var new_strobj__13535 = cljs.core.obj_clone.call(null, this__13533.strobj, this__13533.keys);
        new_strobj__13535[k] = v;
        return new cljs.core.ObjMap(this__13533.meta, this__13533.keys, new_strobj__13535, this__13533.update_count + 1, null)
      }else {
        var new_strobj__13536 = cljs.core.obj_clone.call(null, this__13533.strobj, this__13533.keys);
        var new_keys__13537 = this__13533.keys.slice();
        new_strobj__13536[k] = v;
        new_keys__13537.push(k);
        return new cljs.core.ObjMap(this__13533.meta, new_keys__13537, new_strobj__13536, this__13533.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__13538 = this;
  if(function() {
    var and__3822__auto____13539 = goog.isString(k);
    if(and__3822__auto____13539) {
      return!(cljs.core.scan_array.call(null, 1, k, this__13538.keys) == null)
    }else {
      return and__3822__auto____13539
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__13561 = null;
  var G__13561__2 = function(this_sym13540, k) {
    var this__13542 = this;
    var this_sym13540__13543 = this;
    var coll__13544 = this_sym13540__13543;
    return coll__13544.cljs$core$ILookup$_lookup$arity$2(coll__13544, k)
  };
  var G__13561__3 = function(this_sym13541, k, not_found) {
    var this__13542 = this;
    var this_sym13541__13545 = this;
    var coll__13546 = this_sym13541__13545;
    return coll__13546.cljs$core$ILookup$_lookup$arity$3(coll__13546, k, not_found)
  };
  G__13561 = function(this_sym13541, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13561__2.call(this, this_sym13541, k);
      case 3:
        return G__13561__3.call(this, this_sym13541, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13561
}();
cljs.core.ObjMap.prototype.apply = function(this_sym13524, args13525) {
  var this__13547 = this;
  return this_sym13524.call.apply(this_sym13524, [this_sym13524].concat(args13525.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__13548 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__13549 = this;
  var this__13550 = this;
  return cljs.core.pr_str.call(null, this__13550)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13551 = this;
  if(this__13551.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__13514_SHARP_) {
      return cljs.core.vector.call(null, p1__13514_SHARP_, this__13551.strobj[p1__13514_SHARP_])
    }, this__13551.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13552 = this;
  return this__13552.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13553 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13554 = this;
  return new cljs.core.ObjMap(meta, this__13554.keys, this__13554.strobj, this__13554.update_count, this__13554.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13555 = this;
  return this__13555.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13556 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__13556.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__13557 = this;
  if(function() {
    var and__3822__auto____13558 = goog.isString(k);
    if(and__3822__auto____13558) {
      return!(cljs.core.scan_array.call(null, 1, k, this__13557.keys) == null)
    }else {
      return and__3822__auto____13558
    }
  }()) {
    var new_keys__13559 = this__13557.keys.slice();
    var new_strobj__13560 = cljs.core.obj_clone.call(null, this__13557.strobj, this__13557.keys);
    new_keys__13559.splice(cljs.core.scan_array.call(null, 1, k, new_keys__13559), 1);
    cljs.core.js_delete.call(null, new_strobj__13560, k);
    return new cljs.core.ObjMap(this__13557.meta, new_keys__13559, new_strobj__13560, this__13557.update_count + 1, null)
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
  var this__13565 = this;
  var h__6523__auto____13566 = this__13565.__hash;
  if(!(h__6523__auto____13566 == null)) {
    return h__6523__auto____13566
  }else {
    var h__6523__auto____13567 = cljs.core.hash_imap.call(null, coll);
    this__13565.__hash = h__6523__auto____13567;
    return h__6523__auto____13567
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13568 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13569 = this;
  var bucket__13570 = this__13569.hashobj[cljs.core.hash.call(null, k)];
  var i__13571 = cljs.core.truth_(bucket__13570) ? cljs.core.scan_array.call(null, 2, k, bucket__13570) : null;
  if(cljs.core.truth_(i__13571)) {
    return bucket__13570[i__13571 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13572 = this;
  var h__13573 = cljs.core.hash.call(null, k);
  var bucket__13574 = this__13572.hashobj[h__13573];
  if(cljs.core.truth_(bucket__13574)) {
    var new_bucket__13575 = bucket__13574.slice();
    var new_hashobj__13576 = goog.object.clone(this__13572.hashobj);
    new_hashobj__13576[h__13573] = new_bucket__13575;
    var temp__3971__auto____13577 = cljs.core.scan_array.call(null, 2, k, new_bucket__13575);
    if(cljs.core.truth_(temp__3971__auto____13577)) {
      var i__13578 = temp__3971__auto____13577;
      new_bucket__13575[i__13578 + 1] = v;
      return new cljs.core.HashMap(this__13572.meta, this__13572.count, new_hashobj__13576, null)
    }else {
      new_bucket__13575.push(k, v);
      return new cljs.core.HashMap(this__13572.meta, this__13572.count + 1, new_hashobj__13576, null)
    }
  }else {
    var new_hashobj__13579 = goog.object.clone(this__13572.hashobj);
    new_hashobj__13579[h__13573] = [k, v];
    return new cljs.core.HashMap(this__13572.meta, this__13572.count + 1, new_hashobj__13579, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__13580 = this;
  var bucket__13581 = this__13580.hashobj[cljs.core.hash.call(null, k)];
  var i__13582 = cljs.core.truth_(bucket__13581) ? cljs.core.scan_array.call(null, 2, k, bucket__13581) : null;
  if(cljs.core.truth_(i__13582)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__13607 = null;
  var G__13607__2 = function(this_sym13583, k) {
    var this__13585 = this;
    var this_sym13583__13586 = this;
    var coll__13587 = this_sym13583__13586;
    return coll__13587.cljs$core$ILookup$_lookup$arity$2(coll__13587, k)
  };
  var G__13607__3 = function(this_sym13584, k, not_found) {
    var this__13585 = this;
    var this_sym13584__13588 = this;
    var coll__13589 = this_sym13584__13588;
    return coll__13589.cljs$core$ILookup$_lookup$arity$3(coll__13589, k, not_found)
  };
  G__13607 = function(this_sym13584, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13607__2.call(this, this_sym13584, k);
      case 3:
        return G__13607__3.call(this, this_sym13584, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13607
}();
cljs.core.HashMap.prototype.apply = function(this_sym13563, args13564) {
  var this__13590 = this;
  return this_sym13563.call.apply(this_sym13563, [this_sym13563].concat(args13564.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__13591 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__13592 = this;
  var this__13593 = this;
  return cljs.core.pr_str.call(null, this__13593)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13594 = this;
  if(this__13594.count > 0) {
    var hashes__13595 = cljs.core.js_keys.call(null, this__13594.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__13562_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__13594.hashobj[p1__13562_SHARP_]))
    }, hashes__13595)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13596 = this;
  return this__13596.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13597 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13598 = this;
  return new cljs.core.HashMap(meta, this__13598.count, this__13598.hashobj, this__13598.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13599 = this;
  return this__13599.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13600 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__13600.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__13601 = this;
  var h__13602 = cljs.core.hash.call(null, k);
  var bucket__13603 = this__13601.hashobj[h__13602];
  var i__13604 = cljs.core.truth_(bucket__13603) ? cljs.core.scan_array.call(null, 2, k, bucket__13603) : null;
  if(cljs.core.not.call(null, i__13604)) {
    return coll
  }else {
    var new_hashobj__13605 = goog.object.clone(this__13601.hashobj);
    if(3 > bucket__13603.length) {
      cljs.core.js_delete.call(null, new_hashobj__13605, h__13602)
    }else {
      var new_bucket__13606 = bucket__13603.slice();
      new_bucket__13606.splice(i__13604, 2);
      new_hashobj__13605[h__13602] = new_bucket__13606
    }
    return new cljs.core.HashMap(this__13601.meta, this__13601.count - 1, new_hashobj__13605, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__13608 = ks.length;
  var i__13609 = 0;
  var out__13610 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__13609 < len__13608) {
      var G__13611 = i__13609 + 1;
      var G__13612 = cljs.core.assoc.call(null, out__13610, ks[i__13609], vs[i__13609]);
      i__13609 = G__13611;
      out__13610 = G__13612;
      continue
    }else {
      return out__13610
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__13616 = m.arr;
  var len__13617 = arr__13616.length;
  var i__13618 = 0;
  while(true) {
    if(len__13617 <= i__13618) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__13616[i__13618], k)) {
        return i__13618
      }else {
        if("\ufdd0'else") {
          var G__13619 = i__13618 + 2;
          i__13618 = G__13619;
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
  var this__13622 = this;
  return new cljs.core.TransientArrayMap({}, this__13622.arr.length, this__13622.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__13623 = this;
  var h__6523__auto____13624 = this__13623.__hash;
  if(!(h__6523__auto____13624 == null)) {
    return h__6523__auto____13624
  }else {
    var h__6523__auto____13625 = cljs.core.hash_imap.call(null, coll);
    this__13623.__hash = h__6523__auto____13625;
    return h__6523__auto____13625
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13626 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13627 = this;
  var idx__13628 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__13628 === -1) {
    return not_found
  }else {
    return this__13627.arr[idx__13628 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13629 = this;
  var idx__13630 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__13630 === -1) {
    if(this__13629.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__13629.meta, this__13629.cnt + 1, function() {
        var G__13631__13632 = this__13629.arr.slice();
        G__13631__13632.push(k);
        G__13631__13632.push(v);
        return G__13631__13632
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__13629.arr[idx__13630 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__13629.meta, this__13629.cnt, function() {
          var G__13633__13634 = this__13629.arr.slice();
          G__13633__13634[idx__13630 + 1] = v;
          return G__13633__13634
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__13635 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__13667 = null;
  var G__13667__2 = function(this_sym13636, k) {
    var this__13638 = this;
    var this_sym13636__13639 = this;
    var coll__13640 = this_sym13636__13639;
    return coll__13640.cljs$core$ILookup$_lookup$arity$2(coll__13640, k)
  };
  var G__13667__3 = function(this_sym13637, k, not_found) {
    var this__13638 = this;
    var this_sym13637__13641 = this;
    var coll__13642 = this_sym13637__13641;
    return coll__13642.cljs$core$ILookup$_lookup$arity$3(coll__13642, k, not_found)
  };
  G__13667 = function(this_sym13637, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__13667__2.call(this, this_sym13637, k);
      case 3:
        return G__13667__3.call(this, this_sym13637, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__13667
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym13620, args13621) {
  var this__13643 = this;
  return this_sym13620.call.apply(this_sym13620, [this_sym13620].concat(args13621.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__13644 = this;
  var len__13645 = this__13644.arr.length;
  var i__13646 = 0;
  var init__13647 = init;
  while(true) {
    if(i__13646 < len__13645) {
      var init__13648 = f.call(null, init__13647, this__13644.arr[i__13646], this__13644.arr[i__13646 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__13648)) {
        return cljs.core.deref.call(null, init__13648)
      }else {
        var G__13668 = i__13646 + 2;
        var G__13669 = init__13648;
        i__13646 = G__13668;
        init__13647 = G__13669;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__13649 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__13650 = this;
  var this__13651 = this;
  return cljs.core.pr_str.call(null, this__13651)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__13652 = this;
  if(this__13652.cnt > 0) {
    var len__13653 = this__13652.arr.length;
    var array_map_seq__13654 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__13653) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__13652.arr[i], this__13652.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__13654.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__13655 = this;
  return this__13655.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13656 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13657 = this;
  return new cljs.core.PersistentArrayMap(meta, this__13657.cnt, this__13657.arr, this__13657.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13658 = this;
  return this__13658.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13659 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__13659.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__13660 = this;
  var idx__13661 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__13661 >= 0) {
    var len__13662 = this__13660.arr.length;
    var new_len__13663 = len__13662 - 2;
    if(new_len__13663 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__13664 = cljs.core.make_array.call(null, new_len__13663);
      var s__13665 = 0;
      var d__13666 = 0;
      while(true) {
        if(s__13665 >= len__13662) {
          return new cljs.core.PersistentArrayMap(this__13660.meta, this__13660.cnt - 1, new_arr__13664, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__13660.arr[s__13665])) {
            var G__13670 = s__13665 + 2;
            var G__13671 = d__13666;
            s__13665 = G__13670;
            d__13666 = G__13671;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__13664[d__13666] = this__13660.arr[s__13665];
              new_arr__13664[d__13666 + 1] = this__13660.arr[s__13665 + 1];
              var G__13672 = s__13665 + 2;
              var G__13673 = d__13666 + 2;
              s__13665 = G__13672;
              d__13666 = G__13673;
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
  var len__13674 = cljs.core.count.call(null, ks);
  var i__13675 = 0;
  var out__13676 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__13675 < len__13674) {
      var G__13677 = i__13675 + 1;
      var G__13678 = cljs.core.assoc_BANG_.call(null, out__13676, ks[i__13675], vs[i__13675]);
      i__13675 = G__13677;
      out__13676 = G__13678;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__13676)
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
  var this__13679 = this;
  if(cljs.core.truth_(this__13679.editable_QMARK_)) {
    var idx__13680 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__13680 >= 0) {
      this__13679.arr[idx__13680] = this__13679.arr[this__13679.len - 2];
      this__13679.arr[idx__13680 + 1] = this__13679.arr[this__13679.len - 1];
      var G__13681__13682 = this__13679.arr;
      G__13681__13682.pop();
      G__13681__13682.pop();
      G__13681__13682;
      this__13679.len = this__13679.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__13683 = this;
  if(cljs.core.truth_(this__13683.editable_QMARK_)) {
    var idx__13684 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__13684 === -1) {
      if(this__13683.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__13683.len = this__13683.len + 2;
        this__13683.arr.push(key);
        this__13683.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__13683.len, this__13683.arr), key, val)
      }
    }else {
      if(val === this__13683.arr[idx__13684 + 1]) {
        return tcoll
      }else {
        this__13683.arr[idx__13684 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__13685 = this;
  if(cljs.core.truth_(this__13685.editable_QMARK_)) {
    if(function() {
      var G__13686__13687 = o;
      if(G__13686__13687) {
        if(function() {
          var or__3824__auto____13688 = G__13686__13687.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____13688) {
            return or__3824__auto____13688
          }else {
            return G__13686__13687.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__13686__13687.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__13686__13687)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__13686__13687)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__13689 = cljs.core.seq.call(null, o);
      var tcoll__13690 = tcoll;
      while(true) {
        var temp__3971__auto____13691 = cljs.core.first.call(null, es__13689);
        if(cljs.core.truth_(temp__3971__auto____13691)) {
          var e__13692 = temp__3971__auto____13691;
          var G__13698 = cljs.core.next.call(null, es__13689);
          var G__13699 = tcoll__13690.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__13690, cljs.core.key.call(null, e__13692), cljs.core.val.call(null, e__13692));
          es__13689 = G__13698;
          tcoll__13690 = G__13699;
          continue
        }else {
          return tcoll__13690
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__13693 = this;
  if(cljs.core.truth_(this__13693.editable_QMARK_)) {
    this__13693.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__13693.len, 2), this__13693.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__13694 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__13695 = this;
  if(cljs.core.truth_(this__13695.editable_QMARK_)) {
    var idx__13696 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__13696 === -1) {
      return not_found
    }else {
      return this__13695.arr[idx__13696 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__13697 = this;
  if(cljs.core.truth_(this__13697.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__13697.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__13702 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__13703 = 0;
  while(true) {
    if(i__13703 < len) {
      var G__13704 = cljs.core.assoc_BANG_.call(null, out__13702, arr[i__13703], arr[i__13703 + 1]);
      var G__13705 = i__13703 + 2;
      out__13702 = G__13704;
      i__13703 = G__13705;
      continue
    }else {
      return out__13702
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
    var G__13710__13711 = arr.slice();
    G__13710__13711[i] = a;
    return G__13710__13711
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__13712__13713 = arr.slice();
    G__13712__13713[i] = a;
    G__13712__13713[j] = b;
    return G__13712__13713
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
  var new_arr__13715 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__13715, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__13715, 2 * i, new_arr__13715.length - 2 * i);
  return new_arr__13715
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
    var editable__13718 = inode.ensure_editable(edit);
    editable__13718.arr[i] = a;
    return editable__13718
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__13719 = inode.ensure_editable(edit);
    editable__13719.arr[i] = a;
    editable__13719.arr[j] = b;
    return editable__13719
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
  var len__13726 = arr.length;
  var i__13727 = 0;
  var init__13728 = init;
  while(true) {
    if(i__13727 < len__13726) {
      var init__13731 = function() {
        var k__13729 = arr[i__13727];
        if(!(k__13729 == null)) {
          return f.call(null, init__13728, k__13729, arr[i__13727 + 1])
        }else {
          var node__13730 = arr[i__13727 + 1];
          if(!(node__13730 == null)) {
            return node__13730.kv_reduce(f, init__13728)
          }else {
            return init__13728
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__13731)) {
        return cljs.core.deref.call(null, init__13731)
      }else {
        var G__13732 = i__13727 + 2;
        var G__13733 = init__13731;
        i__13727 = G__13732;
        init__13728 = G__13733;
        continue
      }
    }else {
      return init__13728
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
  var this__13734 = this;
  var inode__13735 = this;
  if(this__13734.bitmap === bit) {
    return null
  }else {
    var editable__13736 = inode__13735.ensure_editable(e);
    var earr__13737 = editable__13736.arr;
    var len__13738 = earr__13737.length;
    editable__13736.bitmap = bit ^ editable__13736.bitmap;
    cljs.core.array_copy.call(null, earr__13737, 2 * (i + 1), earr__13737, 2 * i, len__13738 - 2 * (i + 1));
    earr__13737[len__13738 - 2] = null;
    earr__13737[len__13738 - 1] = null;
    return editable__13736
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__13739 = this;
  var inode__13740 = this;
  var bit__13741 = 1 << (hash >>> shift & 31);
  var idx__13742 = cljs.core.bitmap_indexed_node_index.call(null, this__13739.bitmap, bit__13741);
  if((this__13739.bitmap & bit__13741) === 0) {
    var n__13743 = cljs.core.bit_count.call(null, this__13739.bitmap);
    if(2 * n__13743 < this__13739.arr.length) {
      var editable__13744 = inode__13740.ensure_editable(edit);
      var earr__13745 = editable__13744.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__13745, 2 * idx__13742, earr__13745, 2 * (idx__13742 + 1), 2 * (n__13743 - idx__13742));
      earr__13745[2 * idx__13742] = key;
      earr__13745[2 * idx__13742 + 1] = val;
      editable__13744.bitmap = editable__13744.bitmap | bit__13741;
      return editable__13744
    }else {
      if(n__13743 >= 16) {
        var nodes__13746 = cljs.core.make_array.call(null, 32);
        var jdx__13747 = hash >>> shift & 31;
        nodes__13746[jdx__13747] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__13748 = 0;
        var j__13749 = 0;
        while(true) {
          if(i__13748 < 32) {
            if((this__13739.bitmap >>> i__13748 & 1) === 0) {
              var G__13802 = i__13748 + 1;
              var G__13803 = j__13749;
              i__13748 = G__13802;
              j__13749 = G__13803;
              continue
            }else {
              nodes__13746[i__13748] = !(this__13739.arr[j__13749] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__13739.arr[j__13749]), this__13739.arr[j__13749], this__13739.arr[j__13749 + 1], added_leaf_QMARK_) : this__13739.arr[j__13749 + 1];
              var G__13804 = i__13748 + 1;
              var G__13805 = j__13749 + 2;
              i__13748 = G__13804;
              j__13749 = G__13805;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__13743 + 1, nodes__13746)
      }else {
        if("\ufdd0'else") {
          var new_arr__13750 = cljs.core.make_array.call(null, 2 * (n__13743 + 4));
          cljs.core.array_copy.call(null, this__13739.arr, 0, new_arr__13750, 0, 2 * idx__13742);
          new_arr__13750[2 * idx__13742] = key;
          new_arr__13750[2 * idx__13742 + 1] = val;
          cljs.core.array_copy.call(null, this__13739.arr, 2 * idx__13742, new_arr__13750, 2 * (idx__13742 + 1), 2 * (n__13743 - idx__13742));
          added_leaf_QMARK_.val = true;
          var editable__13751 = inode__13740.ensure_editable(edit);
          editable__13751.arr = new_arr__13750;
          editable__13751.bitmap = editable__13751.bitmap | bit__13741;
          return editable__13751
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__13752 = this__13739.arr[2 * idx__13742];
    var val_or_node__13753 = this__13739.arr[2 * idx__13742 + 1];
    if(key_or_nil__13752 == null) {
      var n__13754 = val_or_node__13753.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__13754 === val_or_node__13753) {
        return inode__13740
      }else {
        return cljs.core.edit_and_set.call(null, inode__13740, edit, 2 * idx__13742 + 1, n__13754)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13752)) {
        if(val === val_or_node__13753) {
          return inode__13740
        }else {
          return cljs.core.edit_and_set.call(null, inode__13740, edit, 2 * idx__13742 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__13740, edit, 2 * idx__13742, null, 2 * idx__13742 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__13752, val_or_node__13753, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__13755 = this;
  var inode__13756 = this;
  return cljs.core.create_inode_seq.call(null, this__13755.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__13757 = this;
  var inode__13758 = this;
  var bit__13759 = 1 << (hash >>> shift & 31);
  if((this__13757.bitmap & bit__13759) === 0) {
    return inode__13758
  }else {
    var idx__13760 = cljs.core.bitmap_indexed_node_index.call(null, this__13757.bitmap, bit__13759);
    var key_or_nil__13761 = this__13757.arr[2 * idx__13760];
    var val_or_node__13762 = this__13757.arr[2 * idx__13760 + 1];
    if(key_or_nil__13761 == null) {
      var n__13763 = val_or_node__13762.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__13763 === val_or_node__13762) {
        return inode__13758
      }else {
        if(!(n__13763 == null)) {
          return cljs.core.edit_and_set.call(null, inode__13758, edit, 2 * idx__13760 + 1, n__13763)
        }else {
          if(this__13757.bitmap === bit__13759) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__13758.edit_and_remove_pair(edit, bit__13759, idx__13760)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13761)) {
        removed_leaf_QMARK_[0] = true;
        return inode__13758.edit_and_remove_pair(edit, bit__13759, idx__13760)
      }else {
        if("\ufdd0'else") {
          return inode__13758
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__13764 = this;
  var inode__13765 = this;
  if(e === this__13764.edit) {
    return inode__13765
  }else {
    var n__13766 = cljs.core.bit_count.call(null, this__13764.bitmap);
    var new_arr__13767 = cljs.core.make_array.call(null, n__13766 < 0 ? 4 : 2 * (n__13766 + 1));
    cljs.core.array_copy.call(null, this__13764.arr, 0, new_arr__13767, 0, 2 * n__13766);
    return new cljs.core.BitmapIndexedNode(e, this__13764.bitmap, new_arr__13767)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__13768 = this;
  var inode__13769 = this;
  return cljs.core.inode_kv_reduce.call(null, this__13768.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__13770 = this;
  var inode__13771 = this;
  var bit__13772 = 1 << (hash >>> shift & 31);
  if((this__13770.bitmap & bit__13772) === 0) {
    return not_found
  }else {
    var idx__13773 = cljs.core.bitmap_indexed_node_index.call(null, this__13770.bitmap, bit__13772);
    var key_or_nil__13774 = this__13770.arr[2 * idx__13773];
    var val_or_node__13775 = this__13770.arr[2 * idx__13773 + 1];
    if(key_or_nil__13774 == null) {
      return val_or_node__13775.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13774)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__13774, val_or_node__13775], true)
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
  var this__13776 = this;
  var inode__13777 = this;
  var bit__13778 = 1 << (hash >>> shift & 31);
  if((this__13776.bitmap & bit__13778) === 0) {
    return inode__13777
  }else {
    var idx__13779 = cljs.core.bitmap_indexed_node_index.call(null, this__13776.bitmap, bit__13778);
    var key_or_nil__13780 = this__13776.arr[2 * idx__13779];
    var val_or_node__13781 = this__13776.arr[2 * idx__13779 + 1];
    if(key_or_nil__13780 == null) {
      var n__13782 = val_or_node__13781.inode_without(shift + 5, hash, key);
      if(n__13782 === val_or_node__13781) {
        return inode__13777
      }else {
        if(!(n__13782 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__13776.bitmap, cljs.core.clone_and_set.call(null, this__13776.arr, 2 * idx__13779 + 1, n__13782))
        }else {
          if(this__13776.bitmap === bit__13778) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__13776.bitmap ^ bit__13778, cljs.core.remove_pair.call(null, this__13776.arr, idx__13779))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13780)) {
        return new cljs.core.BitmapIndexedNode(null, this__13776.bitmap ^ bit__13778, cljs.core.remove_pair.call(null, this__13776.arr, idx__13779))
      }else {
        if("\ufdd0'else") {
          return inode__13777
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__13783 = this;
  var inode__13784 = this;
  var bit__13785 = 1 << (hash >>> shift & 31);
  var idx__13786 = cljs.core.bitmap_indexed_node_index.call(null, this__13783.bitmap, bit__13785);
  if((this__13783.bitmap & bit__13785) === 0) {
    var n__13787 = cljs.core.bit_count.call(null, this__13783.bitmap);
    if(n__13787 >= 16) {
      var nodes__13788 = cljs.core.make_array.call(null, 32);
      var jdx__13789 = hash >>> shift & 31;
      nodes__13788[jdx__13789] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__13790 = 0;
      var j__13791 = 0;
      while(true) {
        if(i__13790 < 32) {
          if((this__13783.bitmap >>> i__13790 & 1) === 0) {
            var G__13806 = i__13790 + 1;
            var G__13807 = j__13791;
            i__13790 = G__13806;
            j__13791 = G__13807;
            continue
          }else {
            nodes__13788[i__13790] = !(this__13783.arr[j__13791] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__13783.arr[j__13791]), this__13783.arr[j__13791], this__13783.arr[j__13791 + 1], added_leaf_QMARK_) : this__13783.arr[j__13791 + 1];
            var G__13808 = i__13790 + 1;
            var G__13809 = j__13791 + 2;
            i__13790 = G__13808;
            j__13791 = G__13809;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__13787 + 1, nodes__13788)
    }else {
      var new_arr__13792 = cljs.core.make_array.call(null, 2 * (n__13787 + 1));
      cljs.core.array_copy.call(null, this__13783.arr, 0, new_arr__13792, 0, 2 * idx__13786);
      new_arr__13792[2 * idx__13786] = key;
      new_arr__13792[2 * idx__13786 + 1] = val;
      cljs.core.array_copy.call(null, this__13783.arr, 2 * idx__13786, new_arr__13792, 2 * (idx__13786 + 1), 2 * (n__13787 - idx__13786));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__13783.bitmap | bit__13785, new_arr__13792)
    }
  }else {
    var key_or_nil__13793 = this__13783.arr[2 * idx__13786];
    var val_or_node__13794 = this__13783.arr[2 * idx__13786 + 1];
    if(key_or_nil__13793 == null) {
      var n__13795 = val_or_node__13794.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__13795 === val_or_node__13794) {
        return inode__13784
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__13783.bitmap, cljs.core.clone_and_set.call(null, this__13783.arr, 2 * idx__13786 + 1, n__13795))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13793)) {
        if(val === val_or_node__13794) {
          return inode__13784
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__13783.bitmap, cljs.core.clone_and_set.call(null, this__13783.arr, 2 * idx__13786 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__13783.bitmap, cljs.core.clone_and_set.call(null, this__13783.arr, 2 * idx__13786, null, 2 * idx__13786 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__13793, val_or_node__13794, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__13796 = this;
  var inode__13797 = this;
  var bit__13798 = 1 << (hash >>> shift & 31);
  if((this__13796.bitmap & bit__13798) === 0) {
    return not_found
  }else {
    var idx__13799 = cljs.core.bitmap_indexed_node_index.call(null, this__13796.bitmap, bit__13798);
    var key_or_nil__13800 = this__13796.arr[2 * idx__13799];
    var val_or_node__13801 = this__13796.arr[2 * idx__13799 + 1];
    if(key_or_nil__13800 == null) {
      return val_or_node__13801.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__13800)) {
        return val_or_node__13801
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
  var arr__13817 = array_node.arr;
  var len__13818 = 2 * (array_node.cnt - 1);
  var new_arr__13819 = cljs.core.make_array.call(null, len__13818);
  var i__13820 = 0;
  var j__13821 = 1;
  var bitmap__13822 = 0;
  while(true) {
    if(i__13820 < len__13818) {
      if(function() {
        var and__3822__auto____13823 = !(i__13820 === idx);
        if(and__3822__auto____13823) {
          return!(arr__13817[i__13820] == null)
        }else {
          return and__3822__auto____13823
        }
      }()) {
        new_arr__13819[j__13821] = arr__13817[i__13820];
        var G__13824 = i__13820 + 1;
        var G__13825 = j__13821 + 2;
        var G__13826 = bitmap__13822 | 1 << i__13820;
        i__13820 = G__13824;
        j__13821 = G__13825;
        bitmap__13822 = G__13826;
        continue
      }else {
        var G__13827 = i__13820 + 1;
        var G__13828 = j__13821;
        var G__13829 = bitmap__13822;
        i__13820 = G__13827;
        j__13821 = G__13828;
        bitmap__13822 = G__13829;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__13822, new_arr__13819)
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
  var this__13830 = this;
  var inode__13831 = this;
  var idx__13832 = hash >>> shift & 31;
  var node__13833 = this__13830.arr[idx__13832];
  if(node__13833 == null) {
    var editable__13834 = cljs.core.edit_and_set.call(null, inode__13831, edit, idx__13832, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__13834.cnt = editable__13834.cnt + 1;
    return editable__13834
  }else {
    var n__13835 = node__13833.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__13835 === node__13833) {
      return inode__13831
    }else {
      return cljs.core.edit_and_set.call(null, inode__13831, edit, idx__13832, n__13835)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__13836 = this;
  var inode__13837 = this;
  return cljs.core.create_array_node_seq.call(null, this__13836.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__13838 = this;
  var inode__13839 = this;
  var idx__13840 = hash >>> shift & 31;
  var node__13841 = this__13838.arr[idx__13840];
  if(node__13841 == null) {
    return inode__13839
  }else {
    var n__13842 = node__13841.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__13842 === node__13841) {
      return inode__13839
    }else {
      if(n__13842 == null) {
        if(this__13838.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__13839, edit, idx__13840)
        }else {
          var editable__13843 = cljs.core.edit_and_set.call(null, inode__13839, edit, idx__13840, n__13842);
          editable__13843.cnt = editable__13843.cnt - 1;
          return editable__13843
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__13839, edit, idx__13840, n__13842)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__13844 = this;
  var inode__13845 = this;
  if(e === this__13844.edit) {
    return inode__13845
  }else {
    return new cljs.core.ArrayNode(e, this__13844.cnt, this__13844.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__13846 = this;
  var inode__13847 = this;
  var len__13848 = this__13846.arr.length;
  var i__13849 = 0;
  var init__13850 = init;
  while(true) {
    if(i__13849 < len__13848) {
      var node__13851 = this__13846.arr[i__13849];
      if(!(node__13851 == null)) {
        var init__13852 = node__13851.kv_reduce(f, init__13850);
        if(cljs.core.reduced_QMARK_.call(null, init__13852)) {
          return cljs.core.deref.call(null, init__13852)
        }else {
          var G__13871 = i__13849 + 1;
          var G__13872 = init__13852;
          i__13849 = G__13871;
          init__13850 = G__13872;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__13850
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__13853 = this;
  var inode__13854 = this;
  var idx__13855 = hash >>> shift & 31;
  var node__13856 = this__13853.arr[idx__13855];
  if(!(node__13856 == null)) {
    return node__13856.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__13857 = this;
  var inode__13858 = this;
  var idx__13859 = hash >>> shift & 31;
  var node__13860 = this__13857.arr[idx__13859];
  if(!(node__13860 == null)) {
    var n__13861 = node__13860.inode_without(shift + 5, hash, key);
    if(n__13861 === node__13860) {
      return inode__13858
    }else {
      if(n__13861 == null) {
        if(this__13857.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__13858, null, idx__13859)
        }else {
          return new cljs.core.ArrayNode(null, this__13857.cnt - 1, cljs.core.clone_and_set.call(null, this__13857.arr, idx__13859, n__13861))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__13857.cnt, cljs.core.clone_and_set.call(null, this__13857.arr, idx__13859, n__13861))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__13858
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__13862 = this;
  var inode__13863 = this;
  var idx__13864 = hash >>> shift & 31;
  var node__13865 = this__13862.arr[idx__13864];
  if(node__13865 == null) {
    return new cljs.core.ArrayNode(null, this__13862.cnt + 1, cljs.core.clone_and_set.call(null, this__13862.arr, idx__13864, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__13866 = node__13865.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__13866 === node__13865) {
      return inode__13863
    }else {
      return new cljs.core.ArrayNode(null, this__13862.cnt, cljs.core.clone_and_set.call(null, this__13862.arr, idx__13864, n__13866))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__13867 = this;
  var inode__13868 = this;
  var idx__13869 = hash >>> shift & 31;
  var node__13870 = this__13867.arr[idx__13869];
  if(!(node__13870 == null)) {
    return node__13870.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__13875 = 2 * cnt;
  var i__13876 = 0;
  while(true) {
    if(i__13876 < lim__13875) {
      if(cljs.core.key_test.call(null, key, arr[i__13876])) {
        return i__13876
      }else {
        var G__13877 = i__13876 + 2;
        i__13876 = G__13877;
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
  var this__13878 = this;
  var inode__13879 = this;
  if(hash === this__13878.collision_hash) {
    var idx__13880 = cljs.core.hash_collision_node_find_index.call(null, this__13878.arr, this__13878.cnt, key);
    if(idx__13880 === -1) {
      if(this__13878.arr.length > 2 * this__13878.cnt) {
        var editable__13881 = cljs.core.edit_and_set.call(null, inode__13879, edit, 2 * this__13878.cnt, key, 2 * this__13878.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__13881.cnt = editable__13881.cnt + 1;
        return editable__13881
      }else {
        var len__13882 = this__13878.arr.length;
        var new_arr__13883 = cljs.core.make_array.call(null, len__13882 + 2);
        cljs.core.array_copy.call(null, this__13878.arr, 0, new_arr__13883, 0, len__13882);
        new_arr__13883[len__13882] = key;
        new_arr__13883[len__13882 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__13879.ensure_editable_array(edit, this__13878.cnt + 1, new_arr__13883)
      }
    }else {
      if(this__13878.arr[idx__13880 + 1] === val) {
        return inode__13879
      }else {
        return cljs.core.edit_and_set.call(null, inode__13879, edit, idx__13880 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__13878.collision_hash >>> shift & 31), [null, inode__13879, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__13884 = this;
  var inode__13885 = this;
  return cljs.core.create_inode_seq.call(null, this__13884.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__13886 = this;
  var inode__13887 = this;
  var idx__13888 = cljs.core.hash_collision_node_find_index.call(null, this__13886.arr, this__13886.cnt, key);
  if(idx__13888 === -1) {
    return inode__13887
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__13886.cnt === 1) {
      return null
    }else {
      var editable__13889 = inode__13887.ensure_editable(edit);
      var earr__13890 = editable__13889.arr;
      earr__13890[idx__13888] = earr__13890[2 * this__13886.cnt - 2];
      earr__13890[idx__13888 + 1] = earr__13890[2 * this__13886.cnt - 1];
      earr__13890[2 * this__13886.cnt - 1] = null;
      earr__13890[2 * this__13886.cnt - 2] = null;
      editable__13889.cnt = editable__13889.cnt - 1;
      return editable__13889
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__13891 = this;
  var inode__13892 = this;
  if(e === this__13891.edit) {
    return inode__13892
  }else {
    var new_arr__13893 = cljs.core.make_array.call(null, 2 * (this__13891.cnt + 1));
    cljs.core.array_copy.call(null, this__13891.arr, 0, new_arr__13893, 0, 2 * this__13891.cnt);
    return new cljs.core.HashCollisionNode(e, this__13891.collision_hash, this__13891.cnt, new_arr__13893)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__13894 = this;
  var inode__13895 = this;
  return cljs.core.inode_kv_reduce.call(null, this__13894.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__13896 = this;
  var inode__13897 = this;
  var idx__13898 = cljs.core.hash_collision_node_find_index.call(null, this__13896.arr, this__13896.cnt, key);
  if(idx__13898 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__13896.arr[idx__13898])) {
      return cljs.core.PersistentVector.fromArray([this__13896.arr[idx__13898], this__13896.arr[idx__13898 + 1]], true)
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
  var this__13899 = this;
  var inode__13900 = this;
  var idx__13901 = cljs.core.hash_collision_node_find_index.call(null, this__13899.arr, this__13899.cnt, key);
  if(idx__13901 === -1) {
    return inode__13900
  }else {
    if(this__13899.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__13899.collision_hash, this__13899.cnt - 1, cljs.core.remove_pair.call(null, this__13899.arr, cljs.core.quot.call(null, idx__13901, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__13902 = this;
  var inode__13903 = this;
  if(hash === this__13902.collision_hash) {
    var idx__13904 = cljs.core.hash_collision_node_find_index.call(null, this__13902.arr, this__13902.cnt, key);
    if(idx__13904 === -1) {
      var len__13905 = this__13902.arr.length;
      var new_arr__13906 = cljs.core.make_array.call(null, len__13905 + 2);
      cljs.core.array_copy.call(null, this__13902.arr, 0, new_arr__13906, 0, len__13905);
      new_arr__13906[len__13905] = key;
      new_arr__13906[len__13905 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__13902.collision_hash, this__13902.cnt + 1, new_arr__13906)
    }else {
      if(cljs.core._EQ_.call(null, this__13902.arr[idx__13904], val)) {
        return inode__13903
      }else {
        return new cljs.core.HashCollisionNode(null, this__13902.collision_hash, this__13902.cnt, cljs.core.clone_and_set.call(null, this__13902.arr, idx__13904 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__13902.collision_hash >>> shift & 31), [null, inode__13903])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__13907 = this;
  var inode__13908 = this;
  var idx__13909 = cljs.core.hash_collision_node_find_index.call(null, this__13907.arr, this__13907.cnt, key);
  if(idx__13909 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__13907.arr[idx__13909])) {
      return this__13907.arr[idx__13909 + 1]
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
  var this__13910 = this;
  var inode__13911 = this;
  if(e === this__13910.edit) {
    this__13910.arr = array;
    this__13910.cnt = count;
    return inode__13911
  }else {
    return new cljs.core.HashCollisionNode(this__13910.edit, this__13910.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__13916 = cljs.core.hash.call(null, key1);
    if(key1hash__13916 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__13916, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___13917 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__13916, key1, val1, added_leaf_QMARK___13917).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___13917)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__13918 = cljs.core.hash.call(null, key1);
    if(key1hash__13918 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__13918, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___13919 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__13918, key1, val1, added_leaf_QMARK___13919).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___13919)
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
  var this__13920 = this;
  var h__6523__auto____13921 = this__13920.__hash;
  if(!(h__6523__auto____13921 == null)) {
    return h__6523__auto____13921
  }else {
    var h__6523__auto____13922 = cljs.core.hash_coll.call(null, coll);
    this__13920.__hash = h__6523__auto____13922;
    return h__6523__auto____13922
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13923 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__13924 = this;
  var this__13925 = this;
  return cljs.core.pr_str.call(null, this__13925)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__13926 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__13927 = this;
  if(this__13927.s == null) {
    return cljs.core.PersistentVector.fromArray([this__13927.nodes[this__13927.i], this__13927.nodes[this__13927.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__13927.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__13928 = this;
  if(this__13928.s == null) {
    return cljs.core.create_inode_seq.call(null, this__13928.nodes, this__13928.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__13928.nodes, this__13928.i, cljs.core.next.call(null, this__13928.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13929 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13930 = this;
  return new cljs.core.NodeSeq(meta, this__13930.nodes, this__13930.i, this__13930.s, this__13930.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13931 = this;
  return this__13931.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13932 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13932.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__13939 = nodes.length;
      var j__13940 = i;
      while(true) {
        if(j__13940 < len__13939) {
          if(!(nodes[j__13940] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__13940, null, null)
          }else {
            var temp__3971__auto____13941 = nodes[j__13940 + 1];
            if(cljs.core.truth_(temp__3971__auto____13941)) {
              var node__13942 = temp__3971__auto____13941;
              var temp__3971__auto____13943 = node__13942.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____13943)) {
                var node_seq__13944 = temp__3971__auto____13943;
                return new cljs.core.NodeSeq(null, nodes, j__13940 + 2, node_seq__13944, null)
              }else {
                var G__13945 = j__13940 + 2;
                j__13940 = G__13945;
                continue
              }
            }else {
              var G__13946 = j__13940 + 2;
              j__13940 = G__13946;
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
  var this__13947 = this;
  var h__6523__auto____13948 = this__13947.__hash;
  if(!(h__6523__auto____13948 == null)) {
    return h__6523__auto____13948
  }else {
    var h__6523__auto____13949 = cljs.core.hash_coll.call(null, coll);
    this__13947.__hash = h__6523__auto____13949;
    return h__6523__auto____13949
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__13950 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__13951 = this;
  var this__13952 = this;
  return cljs.core.pr_str.call(null, this__13952)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__13953 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__13954 = this;
  return cljs.core.first.call(null, this__13954.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__13955 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__13955.nodes, this__13955.i, cljs.core.next.call(null, this__13955.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__13956 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__13957 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__13957.nodes, this__13957.i, this__13957.s, this__13957.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__13958 = this;
  return this__13958.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__13959 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13959.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__13966 = nodes.length;
      var j__13967 = i;
      while(true) {
        if(j__13967 < len__13966) {
          var temp__3971__auto____13968 = nodes[j__13967];
          if(cljs.core.truth_(temp__3971__auto____13968)) {
            var nj__13969 = temp__3971__auto____13968;
            var temp__3971__auto____13970 = nj__13969.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____13970)) {
              var ns__13971 = temp__3971__auto____13970;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__13967 + 1, ns__13971, null)
            }else {
              var G__13972 = j__13967 + 1;
              j__13967 = G__13972;
              continue
            }
          }else {
            var G__13973 = j__13967 + 1;
            j__13967 = G__13973;
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
  var this__13976 = this;
  return new cljs.core.TransientHashMap({}, this__13976.root, this__13976.cnt, this__13976.has_nil_QMARK_, this__13976.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__13977 = this;
  var h__6523__auto____13978 = this__13977.__hash;
  if(!(h__6523__auto____13978 == null)) {
    return h__6523__auto____13978
  }else {
    var h__6523__auto____13979 = cljs.core.hash_imap.call(null, coll);
    this__13977.__hash = h__6523__auto____13979;
    return h__6523__auto____13979
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__13980 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__13981 = this;
  if(k == null) {
    if(this__13981.has_nil_QMARK_) {
      return this__13981.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__13981.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__13981.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__13982 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____13983 = this__13982.has_nil_QMARK_;
      if(and__3822__auto____13983) {
        return v === this__13982.nil_val
      }else {
        return and__3822__auto____13983
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__13982.meta, this__13982.has_nil_QMARK_ ? this__13982.cnt : this__13982.cnt + 1, this__13982.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___13984 = new cljs.core.Box(false);
    var new_root__13985 = (this__13982.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__13982.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___13984);
    if(new_root__13985 === this__13982.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__13982.meta, added_leaf_QMARK___13984.val ? this__13982.cnt + 1 : this__13982.cnt, new_root__13985, this__13982.has_nil_QMARK_, this__13982.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__13986 = this;
  if(k == null) {
    return this__13986.has_nil_QMARK_
  }else {
    if(this__13986.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__13986.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__14009 = null;
  var G__14009__2 = function(this_sym13987, k) {
    var this__13989 = this;
    var this_sym13987__13990 = this;
    var coll__13991 = this_sym13987__13990;
    return coll__13991.cljs$core$ILookup$_lookup$arity$2(coll__13991, k)
  };
  var G__14009__3 = function(this_sym13988, k, not_found) {
    var this__13989 = this;
    var this_sym13988__13992 = this;
    var coll__13993 = this_sym13988__13992;
    return coll__13993.cljs$core$ILookup$_lookup$arity$3(coll__13993, k, not_found)
  };
  G__14009 = function(this_sym13988, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14009__2.call(this, this_sym13988, k);
      case 3:
        return G__14009__3.call(this, this_sym13988, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14009
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym13974, args13975) {
  var this__13994 = this;
  return this_sym13974.call.apply(this_sym13974, [this_sym13974].concat(args13975.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__13995 = this;
  var init__13996 = this__13995.has_nil_QMARK_ ? f.call(null, init, null, this__13995.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__13996)) {
    return cljs.core.deref.call(null, init__13996)
  }else {
    if(!(this__13995.root == null)) {
      return this__13995.root.kv_reduce(f, init__13996)
    }else {
      if("\ufdd0'else") {
        return init__13996
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__13997 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__13998 = this;
  var this__13999 = this;
  return cljs.core.pr_str.call(null, this__13999)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14000 = this;
  if(this__14000.cnt > 0) {
    var s__14001 = !(this__14000.root == null) ? this__14000.root.inode_seq() : null;
    if(this__14000.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__14000.nil_val], true), s__14001)
    }else {
      return s__14001
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14002 = this;
  return this__14002.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14003 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14004 = this;
  return new cljs.core.PersistentHashMap(meta, this__14004.cnt, this__14004.root, this__14004.has_nil_QMARK_, this__14004.nil_val, this__14004.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14005 = this;
  return this__14005.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14006 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__14006.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__14007 = this;
  if(k == null) {
    if(this__14007.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__14007.meta, this__14007.cnt - 1, this__14007.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__14007.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__14008 = this__14007.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__14008 === this__14007.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__14007.meta, this__14007.cnt - 1, new_root__14008, this__14007.has_nil_QMARK_, this__14007.nil_val, null)
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
  var len__14010 = ks.length;
  var i__14011 = 0;
  var out__14012 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__14011 < len__14010) {
      var G__14013 = i__14011 + 1;
      var G__14014 = cljs.core.assoc_BANG_.call(null, out__14012, ks[i__14011], vs[i__14011]);
      i__14011 = G__14013;
      out__14012 = G__14014;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__14012)
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
  var this__14015 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__14016 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__14017 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__14018 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__14019 = this;
  if(k == null) {
    if(this__14019.has_nil_QMARK_) {
      return this__14019.nil_val
    }else {
      return null
    }
  }else {
    if(this__14019.root == null) {
      return null
    }else {
      return this__14019.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__14020 = this;
  if(k == null) {
    if(this__14020.has_nil_QMARK_) {
      return this__14020.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__14020.root == null) {
      return not_found
    }else {
      return this__14020.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14021 = this;
  if(this__14021.edit) {
    return this__14021.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__14022 = this;
  var tcoll__14023 = this;
  if(this__14022.edit) {
    if(function() {
      var G__14024__14025 = o;
      if(G__14024__14025) {
        if(function() {
          var or__3824__auto____14026 = G__14024__14025.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____14026) {
            return or__3824__auto____14026
          }else {
            return G__14024__14025.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__14024__14025.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__14024__14025)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__14024__14025)
      }
    }()) {
      return tcoll__14023.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__14027 = cljs.core.seq.call(null, o);
      var tcoll__14028 = tcoll__14023;
      while(true) {
        var temp__3971__auto____14029 = cljs.core.first.call(null, es__14027);
        if(cljs.core.truth_(temp__3971__auto____14029)) {
          var e__14030 = temp__3971__auto____14029;
          var G__14041 = cljs.core.next.call(null, es__14027);
          var G__14042 = tcoll__14028.assoc_BANG_(cljs.core.key.call(null, e__14030), cljs.core.val.call(null, e__14030));
          es__14027 = G__14041;
          tcoll__14028 = G__14042;
          continue
        }else {
          return tcoll__14028
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__14031 = this;
  var tcoll__14032 = this;
  if(this__14031.edit) {
    if(k == null) {
      if(this__14031.nil_val === v) {
      }else {
        this__14031.nil_val = v
      }
      if(this__14031.has_nil_QMARK_) {
      }else {
        this__14031.count = this__14031.count + 1;
        this__14031.has_nil_QMARK_ = true
      }
      return tcoll__14032
    }else {
      var added_leaf_QMARK___14033 = new cljs.core.Box(false);
      var node__14034 = (this__14031.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__14031.root).inode_assoc_BANG_(this__14031.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___14033);
      if(node__14034 === this__14031.root) {
      }else {
        this__14031.root = node__14034
      }
      if(added_leaf_QMARK___14033.val) {
        this__14031.count = this__14031.count + 1
      }else {
      }
      return tcoll__14032
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__14035 = this;
  var tcoll__14036 = this;
  if(this__14035.edit) {
    if(k == null) {
      if(this__14035.has_nil_QMARK_) {
        this__14035.has_nil_QMARK_ = false;
        this__14035.nil_val = null;
        this__14035.count = this__14035.count - 1;
        return tcoll__14036
      }else {
        return tcoll__14036
      }
    }else {
      if(this__14035.root == null) {
        return tcoll__14036
      }else {
        var removed_leaf_QMARK___14037 = new cljs.core.Box(false);
        var node__14038 = this__14035.root.inode_without_BANG_(this__14035.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___14037);
        if(node__14038 === this__14035.root) {
        }else {
          this__14035.root = node__14038
        }
        if(cljs.core.truth_(removed_leaf_QMARK___14037[0])) {
          this__14035.count = this__14035.count - 1
        }else {
        }
        return tcoll__14036
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__14039 = this;
  var tcoll__14040 = this;
  if(this__14039.edit) {
    this__14039.edit = null;
    return new cljs.core.PersistentHashMap(null, this__14039.count, this__14039.root, this__14039.has_nil_QMARK_, this__14039.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__14045 = node;
  var stack__14046 = stack;
  while(true) {
    if(!(t__14045 == null)) {
      var G__14047 = ascending_QMARK_ ? t__14045.left : t__14045.right;
      var G__14048 = cljs.core.conj.call(null, stack__14046, t__14045);
      t__14045 = G__14047;
      stack__14046 = G__14048;
      continue
    }else {
      return stack__14046
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
  var this__14049 = this;
  var h__6523__auto____14050 = this__14049.__hash;
  if(!(h__6523__auto____14050 == null)) {
    return h__6523__auto____14050
  }else {
    var h__6523__auto____14051 = cljs.core.hash_coll.call(null, coll);
    this__14049.__hash = h__6523__auto____14051;
    return h__6523__auto____14051
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14052 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__14053 = this;
  var this__14054 = this;
  return cljs.core.pr_str.call(null, this__14054)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__14055 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14056 = this;
  if(this__14056.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__14056.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__14057 = this;
  return cljs.core.peek.call(null, this__14057.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__14058 = this;
  var t__14059 = cljs.core.first.call(null, this__14058.stack);
  var next_stack__14060 = cljs.core.tree_map_seq_push.call(null, this__14058.ascending_QMARK_ ? t__14059.right : t__14059.left, cljs.core.next.call(null, this__14058.stack), this__14058.ascending_QMARK_);
  if(!(next_stack__14060 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__14060, this__14058.ascending_QMARK_, this__14058.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14061 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14062 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__14062.stack, this__14062.ascending_QMARK_, this__14062.cnt, this__14062.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14063 = this;
  return this__14063.meta
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
        var and__3822__auto____14065 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____14065) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____14065
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
        var and__3822__auto____14067 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____14067) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____14067
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
  var init__14071 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__14071)) {
    return cljs.core.deref.call(null, init__14071)
  }else {
    var init__14072 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__14071) : init__14071;
    if(cljs.core.reduced_QMARK_.call(null, init__14072)) {
      return cljs.core.deref.call(null, init__14072)
    }else {
      var init__14073 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__14072) : init__14072;
      if(cljs.core.reduced_QMARK_.call(null, init__14073)) {
        return cljs.core.deref.call(null, init__14073)
      }else {
        return init__14073
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
  var this__14076 = this;
  var h__6523__auto____14077 = this__14076.__hash;
  if(!(h__6523__auto____14077 == null)) {
    return h__6523__auto____14077
  }else {
    var h__6523__auto____14078 = cljs.core.hash_coll.call(null, coll);
    this__14076.__hash = h__6523__auto____14078;
    return h__6523__auto____14078
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__14079 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__14080 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__14081 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__14081.key, this__14081.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__14129 = null;
  var G__14129__2 = function(this_sym14082, k) {
    var this__14084 = this;
    var this_sym14082__14085 = this;
    var node__14086 = this_sym14082__14085;
    return node__14086.cljs$core$ILookup$_lookup$arity$2(node__14086, k)
  };
  var G__14129__3 = function(this_sym14083, k, not_found) {
    var this__14084 = this;
    var this_sym14083__14087 = this;
    var node__14088 = this_sym14083__14087;
    return node__14088.cljs$core$ILookup$_lookup$arity$3(node__14088, k, not_found)
  };
  G__14129 = function(this_sym14083, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14129__2.call(this, this_sym14083, k);
      case 3:
        return G__14129__3.call(this, this_sym14083, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14129
}();
cljs.core.BlackNode.prototype.apply = function(this_sym14074, args14075) {
  var this__14089 = this;
  return this_sym14074.call.apply(this_sym14074, [this_sym14074].concat(args14075.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__14090 = this;
  return cljs.core.PersistentVector.fromArray([this__14090.key, this__14090.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__14091 = this;
  return this__14091.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__14092 = this;
  return this__14092.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__14093 = this;
  var node__14094 = this;
  return ins.balance_right(node__14094)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__14095 = this;
  var node__14096 = this;
  return new cljs.core.RedNode(this__14095.key, this__14095.val, this__14095.left, this__14095.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__14097 = this;
  var node__14098 = this;
  return cljs.core.balance_right_del.call(null, this__14097.key, this__14097.val, this__14097.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__14099 = this;
  var node__14100 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__14101 = this;
  var node__14102 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__14102, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__14103 = this;
  var node__14104 = this;
  return cljs.core.balance_left_del.call(null, this__14103.key, this__14103.val, del, this__14103.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__14105 = this;
  var node__14106 = this;
  return ins.balance_left(node__14106)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__14107 = this;
  var node__14108 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__14108, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__14130 = null;
  var G__14130__0 = function() {
    var this__14109 = this;
    var this__14111 = this;
    return cljs.core.pr_str.call(null, this__14111)
  };
  G__14130 = function() {
    switch(arguments.length) {
      case 0:
        return G__14130__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14130
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__14112 = this;
  var node__14113 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__14113, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__14114 = this;
  var node__14115 = this;
  return node__14115
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__14116 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__14117 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__14118 = this;
  return cljs.core.list.call(null, this__14118.key, this__14118.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__14119 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__14120 = this;
  return this__14120.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__14121 = this;
  return cljs.core.PersistentVector.fromArray([this__14121.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__14122 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__14122.key, this__14122.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14123 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__14124 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__14124.key, this__14124.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__14125 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__14126 = this;
  if(n === 0) {
    return this__14126.key
  }else {
    if(n === 1) {
      return this__14126.val
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
  var this__14127 = this;
  if(n === 0) {
    return this__14127.key
  }else {
    if(n === 1) {
      return this__14127.val
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
  var this__14128 = this;
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
  var this__14133 = this;
  var h__6523__auto____14134 = this__14133.__hash;
  if(!(h__6523__auto____14134 == null)) {
    return h__6523__auto____14134
  }else {
    var h__6523__auto____14135 = cljs.core.hash_coll.call(null, coll);
    this__14133.__hash = h__6523__auto____14135;
    return h__6523__auto____14135
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__14136 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__14137 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__14138 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__14138.key, this__14138.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__14186 = null;
  var G__14186__2 = function(this_sym14139, k) {
    var this__14141 = this;
    var this_sym14139__14142 = this;
    var node__14143 = this_sym14139__14142;
    return node__14143.cljs$core$ILookup$_lookup$arity$2(node__14143, k)
  };
  var G__14186__3 = function(this_sym14140, k, not_found) {
    var this__14141 = this;
    var this_sym14140__14144 = this;
    var node__14145 = this_sym14140__14144;
    return node__14145.cljs$core$ILookup$_lookup$arity$3(node__14145, k, not_found)
  };
  G__14186 = function(this_sym14140, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14186__2.call(this, this_sym14140, k);
      case 3:
        return G__14186__3.call(this, this_sym14140, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14186
}();
cljs.core.RedNode.prototype.apply = function(this_sym14131, args14132) {
  var this__14146 = this;
  return this_sym14131.call.apply(this_sym14131, [this_sym14131].concat(args14132.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__14147 = this;
  return cljs.core.PersistentVector.fromArray([this__14147.key, this__14147.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__14148 = this;
  return this__14148.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__14149 = this;
  return this__14149.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__14150 = this;
  var node__14151 = this;
  return new cljs.core.RedNode(this__14150.key, this__14150.val, this__14150.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__14152 = this;
  var node__14153 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__14154 = this;
  var node__14155 = this;
  return new cljs.core.RedNode(this__14154.key, this__14154.val, this__14154.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__14156 = this;
  var node__14157 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__14158 = this;
  var node__14159 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__14159, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__14160 = this;
  var node__14161 = this;
  return new cljs.core.RedNode(this__14160.key, this__14160.val, del, this__14160.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__14162 = this;
  var node__14163 = this;
  return new cljs.core.RedNode(this__14162.key, this__14162.val, ins, this__14162.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__14164 = this;
  var node__14165 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__14164.left)) {
    return new cljs.core.RedNode(this__14164.key, this__14164.val, this__14164.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__14164.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__14164.right)) {
      return new cljs.core.RedNode(this__14164.right.key, this__14164.right.val, new cljs.core.BlackNode(this__14164.key, this__14164.val, this__14164.left, this__14164.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__14164.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__14165, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__14187 = null;
  var G__14187__0 = function() {
    var this__14166 = this;
    var this__14168 = this;
    return cljs.core.pr_str.call(null, this__14168)
  };
  G__14187 = function() {
    switch(arguments.length) {
      case 0:
        return G__14187__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14187
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__14169 = this;
  var node__14170 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__14169.right)) {
    return new cljs.core.RedNode(this__14169.key, this__14169.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__14169.left, null), this__14169.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__14169.left)) {
      return new cljs.core.RedNode(this__14169.left.key, this__14169.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__14169.left.left, null), new cljs.core.BlackNode(this__14169.key, this__14169.val, this__14169.left.right, this__14169.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__14170, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__14171 = this;
  var node__14172 = this;
  return new cljs.core.BlackNode(this__14171.key, this__14171.val, this__14171.left, this__14171.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__14173 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__14174 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__14175 = this;
  return cljs.core.list.call(null, this__14175.key, this__14175.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__14176 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__14177 = this;
  return this__14177.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__14178 = this;
  return cljs.core.PersistentVector.fromArray([this__14178.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__14179 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__14179.key, this__14179.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14180 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__14181 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__14181.key, this__14181.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__14182 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__14183 = this;
  if(n === 0) {
    return this__14183.key
  }else {
    if(n === 1) {
      return this__14183.val
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
  var this__14184 = this;
  if(n === 0) {
    return this__14184.key
  }else {
    if(n === 1) {
      return this__14184.val
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
  var this__14185 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__14191 = comp.call(null, k, tree.key);
    if(c__14191 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__14191 < 0) {
        var ins__14192 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__14192 == null)) {
          return tree.add_left(ins__14192)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__14193 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__14193 == null)) {
            return tree.add_right(ins__14193)
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
          var app__14196 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__14196)) {
            return new cljs.core.RedNode(app__14196.key, app__14196.val, new cljs.core.RedNode(left.key, left.val, left.left, app__14196.left, null), new cljs.core.RedNode(right.key, right.val, app__14196.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__14196, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__14197 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__14197)) {
              return new cljs.core.RedNode(app__14197.key, app__14197.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__14197.left, null), new cljs.core.BlackNode(right.key, right.val, app__14197.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__14197, right.right, null))
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
    var c__14203 = comp.call(null, k, tree.key);
    if(c__14203 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__14203 < 0) {
        var del__14204 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____14205 = !(del__14204 == null);
          if(or__3824__auto____14205) {
            return or__3824__auto____14205
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__14204, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__14204, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__14206 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____14207 = !(del__14206 == null);
            if(or__3824__auto____14207) {
              return or__3824__auto____14207
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__14206)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__14206, null)
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
  var tk__14210 = tree.key;
  var c__14211 = comp.call(null, k, tk__14210);
  if(c__14211 === 0) {
    return tree.replace(tk__14210, v, tree.left, tree.right)
  }else {
    if(c__14211 < 0) {
      return tree.replace(tk__14210, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__14210, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__14214 = this;
  var h__6523__auto____14215 = this__14214.__hash;
  if(!(h__6523__auto____14215 == null)) {
    return h__6523__auto____14215
  }else {
    var h__6523__auto____14216 = cljs.core.hash_imap.call(null, coll);
    this__14214.__hash = h__6523__auto____14216;
    return h__6523__auto____14216
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__14217 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__14218 = this;
  var n__14219 = coll.entry_at(k);
  if(!(n__14219 == null)) {
    return n__14219.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__14220 = this;
  var found__14221 = [null];
  var t__14222 = cljs.core.tree_map_add.call(null, this__14220.comp, this__14220.tree, k, v, found__14221);
  if(t__14222 == null) {
    var found_node__14223 = cljs.core.nth.call(null, found__14221, 0);
    if(cljs.core._EQ_.call(null, v, found_node__14223.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__14220.comp, cljs.core.tree_map_replace.call(null, this__14220.comp, this__14220.tree, k, v), this__14220.cnt, this__14220.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__14220.comp, t__14222.blacken(), this__14220.cnt + 1, this__14220.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__14224 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__14258 = null;
  var G__14258__2 = function(this_sym14225, k) {
    var this__14227 = this;
    var this_sym14225__14228 = this;
    var coll__14229 = this_sym14225__14228;
    return coll__14229.cljs$core$ILookup$_lookup$arity$2(coll__14229, k)
  };
  var G__14258__3 = function(this_sym14226, k, not_found) {
    var this__14227 = this;
    var this_sym14226__14230 = this;
    var coll__14231 = this_sym14226__14230;
    return coll__14231.cljs$core$ILookup$_lookup$arity$3(coll__14231, k, not_found)
  };
  G__14258 = function(this_sym14226, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14258__2.call(this, this_sym14226, k);
      case 3:
        return G__14258__3.call(this, this_sym14226, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14258
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym14212, args14213) {
  var this__14232 = this;
  return this_sym14212.call.apply(this_sym14212, [this_sym14212].concat(args14213.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__14233 = this;
  if(!(this__14233.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__14233.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__14234 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14235 = this;
  if(this__14235.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__14235.tree, false, this__14235.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__14236 = this;
  var this__14237 = this;
  return cljs.core.pr_str.call(null, this__14237)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__14238 = this;
  var coll__14239 = this;
  var t__14240 = this__14238.tree;
  while(true) {
    if(!(t__14240 == null)) {
      var c__14241 = this__14238.comp.call(null, k, t__14240.key);
      if(c__14241 === 0) {
        return t__14240
      }else {
        if(c__14241 < 0) {
          var G__14259 = t__14240.left;
          t__14240 = G__14259;
          continue
        }else {
          if("\ufdd0'else") {
            var G__14260 = t__14240.right;
            t__14240 = G__14260;
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
  var this__14242 = this;
  if(this__14242.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__14242.tree, ascending_QMARK_, this__14242.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__14243 = this;
  if(this__14243.cnt > 0) {
    var stack__14244 = null;
    var t__14245 = this__14243.tree;
    while(true) {
      if(!(t__14245 == null)) {
        var c__14246 = this__14243.comp.call(null, k, t__14245.key);
        if(c__14246 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__14244, t__14245), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__14246 < 0) {
              var G__14261 = cljs.core.conj.call(null, stack__14244, t__14245);
              var G__14262 = t__14245.left;
              stack__14244 = G__14261;
              t__14245 = G__14262;
              continue
            }else {
              var G__14263 = stack__14244;
              var G__14264 = t__14245.right;
              stack__14244 = G__14263;
              t__14245 = G__14264;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__14246 > 0) {
                var G__14265 = cljs.core.conj.call(null, stack__14244, t__14245);
                var G__14266 = t__14245.right;
                stack__14244 = G__14265;
                t__14245 = G__14266;
                continue
              }else {
                var G__14267 = stack__14244;
                var G__14268 = t__14245.left;
                stack__14244 = G__14267;
                t__14245 = G__14268;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__14244 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__14244, ascending_QMARK_, -1, null)
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
  var this__14247 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__14248 = this;
  return this__14248.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14249 = this;
  if(this__14249.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__14249.tree, true, this__14249.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14250 = this;
  return this__14250.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14251 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14252 = this;
  return new cljs.core.PersistentTreeMap(this__14252.comp, this__14252.tree, this__14252.cnt, meta, this__14252.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14253 = this;
  return this__14253.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14254 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__14254.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__14255 = this;
  var found__14256 = [null];
  var t__14257 = cljs.core.tree_map_remove.call(null, this__14255.comp, this__14255.tree, k, found__14256);
  if(t__14257 == null) {
    if(cljs.core.nth.call(null, found__14256, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__14255.comp, null, 0, this__14255.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__14255.comp, t__14257.blacken(), this__14255.cnt - 1, this__14255.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__14271 = cljs.core.seq.call(null, keyvals);
    var out__14272 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__14271) {
        var G__14273 = cljs.core.nnext.call(null, in__14271);
        var G__14274 = cljs.core.assoc_BANG_.call(null, out__14272, cljs.core.first.call(null, in__14271), cljs.core.second.call(null, in__14271));
        in__14271 = G__14273;
        out__14272 = G__14274;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__14272)
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
  hash_map.cljs$lang$applyTo = function(arglist__14275) {
    var keyvals = cljs.core.seq(arglist__14275);
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
  array_map.cljs$lang$applyTo = function(arglist__14276) {
    var keyvals = cljs.core.seq(arglist__14276);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__14280 = [];
    var obj__14281 = {};
    var kvs__14282 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__14282) {
        ks__14280.push(cljs.core.first.call(null, kvs__14282));
        obj__14281[cljs.core.first.call(null, kvs__14282)] = cljs.core.second.call(null, kvs__14282);
        var G__14283 = cljs.core.nnext.call(null, kvs__14282);
        kvs__14282 = G__14283;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__14280, obj__14281)
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
  obj_map.cljs$lang$applyTo = function(arglist__14284) {
    var keyvals = cljs.core.seq(arglist__14284);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__14287 = cljs.core.seq.call(null, keyvals);
    var out__14288 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__14287) {
        var G__14289 = cljs.core.nnext.call(null, in__14287);
        var G__14290 = cljs.core.assoc.call(null, out__14288, cljs.core.first.call(null, in__14287), cljs.core.second.call(null, in__14287));
        in__14287 = G__14289;
        out__14288 = G__14290;
        continue
      }else {
        return out__14288
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
  sorted_map.cljs$lang$applyTo = function(arglist__14291) {
    var keyvals = cljs.core.seq(arglist__14291);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__14294 = cljs.core.seq.call(null, keyvals);
    var out__14295 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__14294) {
        var G__14296 = cljs.core.nnext.call(null, in__14294);
        var G__14297 = cljs.core.assoc.call(null, out__14295, cljs.core.first.call(null, in__14294), cljs.core.second.call(null, in__14294));
        in__14294 = G__14296;
        out__14295 = G__14297;
        continue
      }else {
        return out__14295
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__14298) {
    var comparator = cljs.core.first(arglist__14298);
    var keyvals = cljs.core.rest(arglist__14298);
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
      return cljs.core.reduce.call(null, function(p1__14299_SHARP_, p2__14300_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____14302 = p1__14299_SHARP_;
          if(cljs.core.truth_(or__3824__auto____14302)) {
            return or__3824__auto____14302
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__14300_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__14303) {
    var maps = cljs.core.seq(arglist__14303);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__14311 = function(m, e) {
        var k__14309 = cljs.core.first.call(null, e);
        var v__14310 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__14309)) {
          return cljs.core.assoc.call(null, m, k__14309, f.call(null, cljs.core._lookup.call(null, m, k__14309, null), v__14310))
        }else {
          return cljs.core.assoc.call(null, m, k__14309, v__14310)
        }
      };
      var merge2__14313 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__14311, function() {
          var or__3824__auto____14312 = m1;
          if(cljs.core.truth_(or__3824__auto____14312)) {
            return or__3824__auto____14312
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__14313, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__14314) {
    var f = cljs.core.first(arglist__14314);
    var maps = cljs.core.rest(arglist__14314);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__14319 = cljs.core.ObjMap.EMPTY;
  var keys__14320 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__14320) {
      var key__14321 = cljs.core.first.call(null, keys__14320);
      var entry__14322 = cljs.core._lookup.call(null, map, key__14321, "\ufdd0'user/not-found");
      var G__14323 = cljs.core.not_EQ_.call(null, entry__14322, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__14319, key__14321, entry__14322) : ret__14319;
      var G__14324 = cljs.core.next.call(null, keys__14320);
      ret__14319 = G__14323;
      keys__14320 = G__14324;
      continue
    }else {
      return ret__14319
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
  var this__14328 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__14328.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__14329 = this;
  var h__6523__auto____14330 = this__14329.__hash;
  if(!(h__6523__auto____14330 == null)) {
    return h__6523__auto____14330
  }else {
    var h__6523__auto____14331 = cljs.core.hash_iset.call(null, coll);
    this__14329.__hash = h__6523__auto____14331;
    return h__6523__auto____14331
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__14332 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__14333 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__14333.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__14354 = null;
  var G__14354__2 = function(this_sym14334, k) {
    var this__14336 = this;
    var this_sym14334__14337 = this;
    var coll__14338 = this_sym14334__14337;
    return coll__14338.cljs$core$ILookup$_lookup$arity$2(coll__14338, k)
  };
  var G__14354__3 = function(this_sym14335, k, not_found) {
    var this__14336 = this;
    var this_sym14335__14339 = this;
    var coll__14340 = this_sym14335__14339;
    return coll__14340.cljs$core$ILookup$_lookup$arity$3(coll__14340, k, not_found)
  };
  G__14354 = function(this_sym14335, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14354__2.call(this, this_sym14335, k);
      case 3:
        return G__14354__3.call(this, this_sym14335, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14354
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym14326, args14327) {
  var this__14341 = this;
  return this_sym14326.call.apply(this_sym14326, [this_sym14326].concat(args14327.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14342 = this;
  return new cljs.core.PersistentHashSet(this__14342.meta, cljs.core.assoc.call(null, this__14342.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__14343 = this;
  var this__14344 = this;
  return cljs.core.pr_str.call(null, this__14344)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14345 = this;
  return cljs.core.keys.call(null, this__14345.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__14346 = this;
  return new cljs.core.PersistentHashSet(this__14346.meta, cljs.core.dissoc.call(null, this__14346.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14347 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14348 = this;
  var and__3822__auto____14349 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____14349) {
    var and__3822__auto____14350 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____14350) {
      return cljs.core.every_QMARK_.call(null, function(p1__14325_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__14325_SHARP_)
      }, other)
    }else {
      return and__3822__auto____14350
    }
  }else {
    return and__3822__auto____14349
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14351 = this;
  return new cljs.core.PersistentHashSet(meta, this__14351.hash_map, this__14351.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14352 = this;
  return this__14352.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14353 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__14353.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__14355 = cljs.core.count.call(null, items);
  var i__14356 = 0;
  var out__14357 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__14356 < len__14355) {
      var G__14358 = i__14356 + 1;
      var G__14359 = cljs.core.conj_BANG_.call(null, out__14357, items[i__14356]);
      i__14356 = G__14358;
      out__14357 = G__14359;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__14357)
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
  var G__14377 = null;
  var G__14377__2 = function(this_sym14363, k) {
    var this__14365 = this;
    var this_sym14363__14366 = this;
    var tcoll__14367 = this_sym14363__14366;
    if(cljs.core._lookup.call(null, this__14365.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__14377__3 = function(this_sym14364, k, not_found) {
    var this__14365 = this;
    var this_sym14364__14368 = this;
    var tcoll__14369 = this_sym14364__14368;
    if(cljs.core._lookup.call(null, this__14365.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__14377 = function(this_sym14364, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14377__2.call(this, this_sym14364, k);
      case 3:
        return G__14377__3.call(this, this_sym14364, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14377
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym14361, args14362) {
  var this__14370 = this;
  return this_sym14361.call.apply(this_sym14361, [this_sym14361].concat(args14362.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__14371 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__14372 = this;
  if(cljs.core._lookup.call(null, this__14372.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__14373 = this;
  return cljs.core.count.call(null, this__14373.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__14374 = this;
  this__14374.transient_map = cljs.core.dissoc_BANG_.call(null, this__14374.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__14375 = this;
  this__14375.transient_map = cljs.core.assoc_BANG_.call(null, this__14375.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__14376 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__14376.transient_map), null)
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
  var this__14380 = this;
  var h__6523__auto____14381 = this__14380.__hash;
  if(!(h__6523__auto____14381 == null)) {
    return h__6523__auto____14381
  }else {
    var h__6523__auto____14382 = cljs.core.hash_iset.call(null, coll);
    this__14380.__hash = h__6523__auto____14382;
    return h__6523__auto____14382
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__14383 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__14384 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__14384.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__14410 = null;
  var G__14410__2 = function(this_sym14385, k) {
    var this__14387 = this;
    var this_sym14385__14388 = this;
    var coll__14389 = this_sym14385__14388;
    return coll__14389.cljs$core$ILookup$_lookup$arity$2(coll__14389, k)
  };
  var G__14410__3 = function(this_sym14386, k, not_found) {
    var this__14387 = this;
    var this_sym14386__14390 = this;
    var coll__14391 = this_sym14386__14390;
    return coll__14391.cljs$core$ILookup$_lookup$arity$3(coll__14391, k, not_found)
  };
  G__14410 = function(this_sym14386, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__14410__2.call(this, this_sym14386, k);
      case 3:
        return G__14410__3.call(this, this_sym14386, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__14410
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym14378, args14379) {
  var this__14392 = this;
  return this_sym14378.call.apply(this_sym14378, [this_sym14378].concat(args14379.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__14393 = this;
  return new cljs.core.PersistentTreeSet(this__14393.meta, cljs.core.assoc.call(null, this__14393.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__14394 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__14394.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__14395 = this;
  var this__14396 = this;
  return cljs.core.pr_str.call(null, this__14396)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__14397 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__14397.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__14398 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__14398.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__14399 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__14400 = this;
  return cljs.core._comparator.call(null, this__14400.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__14401 = this;
  return cljs.core.keys.call(null, this__14401.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__14402 = this;
  return new cljs.core.PersistentTreeSet(this__14402.meta, cljs.core.dissoc.call(null, this__14402.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__14403 = this;
  return cljs.core.count.call(null, this__14403.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__14404 = this;
  var and__3822__auto____14405 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____14405) {
    var and__3822__auto____14406 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____14406) {
      return cljs.core.every_QMARK_.call(null, function(p1__14360_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__14360_SHARP_)
      }, other)
    }else {
      return and__3822__auto____14406
    }
  }else {
    return and__3822__auto____14405
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__14407 = this;
  return new cljs.core.PersistentTreeSet(meta, this__14407.tree_map, this__14407.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__14408 = this;
  return this__14408.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__14409 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__14409.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__14415__delegate = function(keys) {
      var in__14413 = cljs.core.seq.call(null, keys);
      var out__14414 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__14413)) {
          var G__14416 = cljs.core.next.call(null, in__14413);
          var G__14417 = cljs.core.conj_BANG_.call(null, out__14414, cljs.core.first.call(null, in__14413));
          in__14413 = G__14416;
          out__14414 = G__14417;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__14414)
        }
        break
      }
    };
    var G__14415 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14415__delegate.call(this, keys)
    };
    G__14415.cljs$lang$maxFixedArity = 0;
    G__14415.cljs$lang$applyTo = function(arglist__14418) {
      var keys = cljs.core.seq(arglist__14418);
      return G__14415__delegate(keys)
    };
    G__14415.cljs$lang$arity$variadic = G__14415__delegate;
    return G__14415
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
  sorted_set.cljs$lang$applyTo = function(arglist__14419) {
    var keys = cljs.core.seq(arglist__14419);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__14421) {
    var comparator = cljs.core.first(arglist__14421);
    var keys = cljs.core.rest(arglist__14421);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__14427 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____14428 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____14428)) {
        var e__14429 = temp__3971__auto____14428;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__14429))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__14427, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__14420_SHARP_) {
      var temp__3971__auto____14430 = cljs.core.find.call(null, smap, p1__14420_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____14430)) {
        var e__14431 = temp__3971__auto____14430;
        return cljs.core.second.call(null, e__14431)
      }else {
        return p1__14420_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__14461 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__14454, seen) {
        while(true) {
          var vec__14455__14456 = p__14454;
          var f__14457 = cljs.core.nth.call(null, vec__14455__14456, 0, null);
          var xs__14458 = vec__14455__14456;
          var temp__3974__auto____14459 = cljs.core.seq.call(null, xs__14458);
          if(temp__3974__auto____14459) {
            var s__14460 = temp__3974__auto____14459;
            if(cljs.core.contains_QMARK_.call(null, seen, f__14457)) {
              var G__14462 = cljs.core.rest.call(null, s__14460);
              var G__14463 = seen;
              p__14454 = G__14462;
              seen = G__14463;
              continue
            }else {
              return cljs.core.cons.call(null, f__14457, step.call(null, cljs.core.rest.call(null, s__14460), cljs.core.conj.call(null, seen, f__14457)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__14461.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__14466 = cljs.core.PersistentVector.EMPTY;
  var s__14467 = s;
  while(true) {
    if(cljs.core.next.call(null, s__14467)) {
      var G__14468 = cljs.core.conj.call(null, ret__14466, cljs.core.first.call(null, s__14467));
      var G__14469 = cljs.core.next.call(null, s__14467);
      ret__14466 = G__14468;
      s__14467 = G__14469;
      continue
    }else {
      return cljs.core.seq.call(null, ret__14466)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____14472 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____14472) {
        return or__3824__auto____14472
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__14473 = x.lastIndexOf("/");
      if(i__14473 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__14473 + 1)
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
    var or__3824__auto____14476 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____14476) {
      return or__3824__auto____14476
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__14477 = x.lastIndexOf("/");
    if(i__14477 > -1) {
      return cljs.core.subs.call(null, x, 2, i__14477)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__14484 = cljs.core.ObjMap.EMPTY;
  var ks__14485 = cljs.core.seq.call(null, keys);
  var vs__14486 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____14487 = ks__14485;
      if(and__3822__auto____14487) {
        return vs__14486
      }else {
        return and__3822__auto____14487
      }
    }()) {
      var G__14488 = cljs.core.assoc.call(null, map__14484, cljs.core.first.call(null, ks__14485), cljs.core.first.call(null, vs__14486));
      var G__14489 = cljs.core.next.call(null, ks__14485);
      var G__14490 = cljs.core.next.call(null, vs__14486);
      map__14484 = G__14488;
      ks__14485 = G__14489;
      vs__14486 = G__14490;
      continue
    }else {
      return map__14484
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
    var G__14493__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__14478_SHARP_, p2__14479_SHARP_) {
        return max_key.call(null, k, p1__14478_SHARP_, p2__14479_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__14493 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14493__delegate.call(this, k, x, y, more)
    };
    G__14493.cljs$lang$maxFixedArity = 3;
    G__14493.cljs$lang$applyTo = function(arglist__14494) {
      var k = cljs.core.first(arglist__14494);
      var x = cljs.core.first(cljs.core.next(arglist__14494));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14494)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14494)));
      return G__14493__delegate(k, x, y, more)
    };
    G__14493.cljs$lang$arity$variadic = G__14493__delegate;
    return G__14493
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
    var G__14495__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__14491_SHARP_, p2__14492_SHARP_) {
        return min_key.call(null, k, p1__14491_SHARP_, p2__14492_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__14495 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14495__delegate.call(this, k, x, y, more)
    };
    G__14495.cljs$lang$maxFixedArity = 3;
    G__14495.cljs$lang$applyTo = function(arglist__14496) {
      var k = cljs.core.first(arglist__14496);
      var x = cljs.core.first(cljs.core.next(arglist__14496));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14496)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14496)));
      return G__14495__delegate(k, x, y, more)
    };
    G__14495.cljs$lang$arity$variadic = G__14495__delegate;
    return G__14495
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
      var temp__3974__auto____14499 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____14499) {
        var s__14500 = temp__3974__auto____14499;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__14500), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__14500)))
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
    var temp__3974__auto____14503 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____14503) {
      var s__14504 = temp__3974__auto____14503;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__14504)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__14504), take_while.call(null, pred, cljs.core.rest.call(null, s__14504)))
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
    var comp__14506 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__14506.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__14518 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____14519 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____14519)) {
        var vec__14520__14521 = temp__3974__auto____14519;
        var e__14522 = cljs.core.nth.call(null, vec__14520__14521, 0, null);
        var s__14523 = vec__14520__14521;
        if(cljs.core.truth_(include__14518.call(null, e__14522))) {
          return s__14523
        }else {
          return cljs.core.next.call(null, s__14523)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__14518, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____14524 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____14524)) {
      var vec__14525__14526 = temp__3974__auto____14524;
      var e__14527 = cljs.core.nth.call(null, vec__14525__14526, 0, null);
      var s__14528 = vec__14525__14526;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__14527)) ? s__14528 : cljs.core.next.call(null, s__14528))
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
    var include__14540 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____14541 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____14541)) {
        var vec__14542__14543 = temp__3974__auto____14541;
        var e__14544 = cljs.core.nth.call(null, vec__14542__14543, 0, null);
        var s__14545 = vec__14542__14543;
        if(cljs.core.truth_(include__14540.call(null, e__14544))) {
          return s__14545
        }else {
          return cljs.core.next.call(null, s__14545)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__14540, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____14546 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____14546)) {
      var vec__14547__14548 = temp__3974__auto____14546;
      var e__14549 = cljs.core.nth.call(null, vec__14547__14548, 0, null);
      var s__14550 = vec__14547__14548;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__14549)) ? s__14550 : cljs.core.next.call(null, s__14550))
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
  var this__14551 = this;
  var h__6523__auto____14552 = this__14551.__hash;
  if(!(h__6523__auto____14552 == null)) {
    return h__6523__auto____14552
  }else {
    var h__6523__auto____14553 = cljs.core.hash_coll.call(null, rng);
    this__14551.__hash = h__6523__auto____14553;
    return h__6523__auto____14553
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__14554 = this;
  if(this__14554.step > 0) {
    if(this__14554.start + this__14554.step < this__14554.end) {
      return new cljs.core.Range(this__14554.meta, this__14554.start + this__14554.step, this__14554.end, this__14554.step, null)
    }else {
      return null
    }
  }else {
    if(this__14554.start + this__14554.step > this__14554.end) {
      return new cljs.core.Range(this__14554.meta, this__14554.start + this__14554.step, this__14554.end, this__14554.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__14555 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__14556 = this;
  var this__14557 = this;
  return cljs.core.pr_str.call(null, this__14557)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__14558 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__14559 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__14560 = this;
  if(this__14560.step > 0) {
    if(this__14560.start < this__14560.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__14560.start > this__14560.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__14561 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__14561.end - this__14561.start) / this__14561.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__14562 = this;
  return this__14562.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__14563 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__14563.meta, this__14563.start + this__14563.step, this__14563.end, this__14563.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__14564 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__14565 = this;
  return new cljs.core.Range(meta, this__14565.start, this__14565.end, this__14565.step, this__14565.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__14566 = this;
  return this__14566.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__14567 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__14567.start + n * this__14567.step
  }else {
    if(function() {
      var and__3822__auto____14568 = this__14567.start > this__14567.end;
      if(and__3822__auto____14568) {
        return this__14567.step === 0
      }else {
        return and__3822__auto____14568
      }
    }()) {
      return this__14567.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__14569 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__14569.start + n * this__14569.step
  }else {
    if(function() {
      var and__3822__auto____14570 = this__14569.start > this__14569.end;
      if(and__3822__auto____14570) {
        return this__14569.step === 0
      }else {
        return and__3822__auto____14570
      }
    }()) {
      return this__14569.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__14571 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__14571.meta)
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
    var temp__3974__auto____14574 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____14574) {
      var s__14575 = temp__3974__auto____14574;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__14575), take_nth.call(null, n, cljs.core.drop.call(null, n, s__14575)))
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
    var temp__3974__auto____14582 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____14582) {
      var s__14583 = temp__3974__auto____14582;
      var fst__14584 = cljs.core.first.call(null, s__14583);
      var fv__14585 = f.call(null, fst__14584);
      var run__14586 = cljs.core.cons.call(null, fst__14584, cljs.core.take_while.call(null, function(p1__14576_SHARP_) {
        return cljs.core._EQ_.call(null, fv__14585, f.call(null, p1__14576_SHARP_))
      }, cljs.core.next.call(null, s__14583)));
      return cljs.core.cons.call(null, run__14586, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__14586), s__14583))))
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
      var temp__3971__auto____14601 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____14601) {
        var s__14602 = temp__3971__auto____14601;
        return reductions.call(null, f, cljs.core.first.call(null, s__14602), cljs.core.rest.call(null, s__14602))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____14603 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____14603) {
        var s__14604 = temp__3974__auto____14603;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__14604)), cljs.core.rest.call(null, s__14604))
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
      var G__14607 = null;
      var G__14607__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__14607__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__14607__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__14607__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__14607__4 = function() {
        var G__14608__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__14608 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14608__delegate.call(this, x, y, z, args)
        };
        G__14608.cljs$lang$maxFixedArity = 3;
        G__14608.cljs$lang$applyTo = function(arglist__14609) {
          var x = cljs.core.first(arglist__14609);
          var y = cljs.core.first(cljs.core.next(arglist__14609));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14609)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14609)));
          return G__14608__delegate(x, y, z, args)
        };
        G__14608.cljs$lang$arity$variadic = G__14608__delegate;
        return G__14608
      }();
      G__14607 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14607__0.call(this);
          case 1:
            return G__14607__1.call(this, x);
          case 2:
            return G__14607__2.call(this, x, y);
          case 3:
            return G__14607__3.call(this, x, y, z);
          default:
            return G__14607__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14607.cljs$lang$maxFixedArity = 3;
      G__14607.cljs$lang$applyTo = G__14607__4.cljs$lang$applyTo;
      return G__14607
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__14610 = null;
      var G__14610__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__14610__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__14610__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__14610__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__14610__4 = function() {
        var G__14611__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__14611 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14611__delegate.call(this, x, y, z, args)
        };
        G__14611.cljs$lang$maxFixedArity = 3;
        G__14611.cljs$lang$applyTo = function(arglist__14612) {
          var x = cljs.core.first(arglist__14612);
          var y = cljs.core.first(cljs.core.next(arglist__14612));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14612)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14612)));
          return G__14611__delegate(x, y, z, args)
        };
        G__14611.cljs$lang$arity$variadic = G__14611__delegate;
        return G__14611
      }();
      G__14610 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14610__0.call(this);
          case 1:
            return G__14610__1.call(this, x);
          case 2:
            return G__14610__2.call(this, x, y);
          case 3:
            return G__14610__3.call(this, x, y, z);
          default:
            return G__14610__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14610.cljs$lang$maxFixedArity = 3;
      G__14610.cljs$lang$applyTo = G__14610__4.cljs$lang$applyTo;
      return G__14610
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__14613 = null;
      var G__14613__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__14613__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__14613__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__14613__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__14613__4 = function() {
        var G__14614__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__14614 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__14614__delegate.call(this, x, y, z, args)
        };
        G__14614.cljs$lang$maxFixedArity = 3;
        G__14614.cljs$lang$applyTo = function(arglist__14615) {
          var x = cljs.core.first(arglist__14615);
          var y = cljs.core.first(cljs.core.next(arglist__14615));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14615)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14615)));
          return G__14614__delegate(x, y, z, args)
        };
        G__14614.cljs$lang$arity$variadic = G__14614__delegate;
        return G__14614
      }();
      G__14613 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__14613__0.call(this);
          case 1:
            return G__14613__1.call(this, x);
          case 2:
            return G__14613__2.call(this, x, y);
          case 3:
            return G__14613__3.call(this, x, y, z);
          default:
            return G__14613__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__14613.cljs$lang$maxFixedArity = 3;
      G__14613.cljs$lang$applyTo = G__14613__4.cljs$lang$applyTo;
      return G__14613
    }()
  };
  var juxt__4 = function() {
    var G__14616__delegate = function(f, g, h, fs) {
      var fs__14606 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__14617 = null;
        var G__14617__0 = function() {
          return cljs.core.reduce.call(null, function(p1__14587_SHARP_, p2__14588_SHARP_) {
            return cljs.core.conj.call(null, p1__14587_SHARP_, p2__14588_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__14606)
        };
        var G__14617__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__14589_SHARP_, p2__14590_SHARP_) {
            return cljs.core.conj.call(null, p1__14589_SHARP_, p2__14590_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__14606)
        };
        var G__14617__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__14591_SHARP_, p2__14592_SHARP_) {
            return cljs.core.conj.call(null, p1__14591_SHARP_, p2__14592_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__14606)
        };
        var G__14617__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__14593_SHARP_, p2__14594_SHARP_) {
            return cljs.core.conj.call(null, p1__14593_SHARP_, p2__14594_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__14606)
        };
        var G__14617__4 = function() {
          var G__14618__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__14595_SHARP_, p2__14596_SHARP_) {
              return cljs.core.conj.call(null, p1__14595_SHARP_, cljs.core.apply.call(null, p2__14596_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__14606)
          };
          var G__14618 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__14618__delegate.call(this, x, y, z, args)
          };
          G__14618.cljs$lang$maxFixedArity = 3;
          G__14618.cljs$lang$applyTo = function(arglist__14619) {
            var x = cljs.core.first(arglist__14619);
            var y = cljs.core.first(cljs.core.next(arglist__14619));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14619)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14619)));
            return G__14618__delegate(x, y, z, args)
          };
          G__14618.cljs$lang$arity$variadic = G__14618__delegate;
          return G__14618
        }();
        G__14617 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__14617__0.call(this);
            case 1:
              return G__14617__1.call(this, x);
            case 2:
              return G__14617__2.call(this, x, y);
            case 3:
              return G__14617__3.call(this, x, y, z);
            default:
              return G__14617__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__14617.cljs$lang$maxFixedArity = 3;
        G__14617.cljs$lang$applyTo = G__14617__4.cljs$lang$applyTo;
        return G__14617
      }()
    };
    var G__14616 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__14616__delegate.call(this, f, g, h, fs)
    };
    G__14616.cljs$lang$maxFixedArity = 3;
    G__14616.cljs$lang$applyTo = function(arglist__14620) {
      var f = cljs.core.first(arglist__14620);
      var g = cljs.core.first(cljs.core.next(arglist__14620));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14620)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__14620)));
      return G__14616__delegate(f, g, h, fs)
    };
    G__14616.cljs$lang$arity$variadic = G__14616__delegate;
    return G__14616
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
        var G__14623 = cljs.core.next.call(null, coll);
        coll = G__14623;
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
        var and__3822__auto____14622 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____14622) {
          return n > 0
        }else {
          return and__3822__auto____14622
        }
      }())) {
        var G__14624 = n - 1;
        var G__14625 = cljs.core.next.call(null, coll);
        n = G__14624;
        coll = G__14625;
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
  var matches__14627 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__14627), s)) {
    if(cljs.core.count.call(null, matches__14627) === 1) {
      return cljs.core.first.call(null, matches__14627)
    }else {
      return cljs.core.vec.call(null, matches__14627)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__14629 = re.exec(s);
  if(matches__14629 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__14629) === 1) {
      return cljs.core.first.call(null, matches__14629)
    }else {
      return cljs.core.vec.call(null, matches__14629)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__14634 = cljs.core.re_find.call(null, re, s);
  var match_idx__14635 = s.search(re);
  var match_str__14636 = cljs.core.coll_QMARK_.call(null, match_data__14634) ? cljs.core.first.call(null, match_data__14634) : match_data__14634;
  var post_match__14637 = cljs.core.subs.call(null, s, match_idx__14635 + cljs.core.count.call(null, match_str__14636));
  if(cljs.core.truth_(match_data__14634)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__14634, re_seq.call(null, re, post_match__14637))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__14644__14645 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___14646 = cljs.core.nth.call(null, vec__14644__14645, 0, null);
  var flags__14647 = cljs.core.nth.call(null, vec__14644__14645, 1, null);
  var pattern__14648 = cljs.core.nth.call(null, vec__14644__14645, 2, null);
  return new RegExp(pattern__14648, flags__14647)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__14638_SHARP_) {
    return print_one.call(null, p1__14638_SHARP_, opts)
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
          var and__3822__auto____14658 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____14658)) {
            var and__3822__auto____14662 = function() {
              var G__14659__14660 = obj;
              if(G__14659__14660) {
                if(function() {
                  var or__3824__auto____14661 = G__14659__14660.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____14661) {
                    return or__3824__auto____14661
                  }else {
                    return G__14659__14660.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__14659__14660.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14659__14660)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__14659__14660)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____14662)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____14662
            }
          }else {
            return and__3822__auto____14658
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____14663 = !(obj == null);
          if(and__3822__auto____14663) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____14663
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__14664__14665 = obj;
          if(G__14664__14665) {
            if(function() {
              var or__3824__auto____14666 = G__14664__14665.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____14666) {
                return or__3824__auto____14666
              }else {
                return G__14664__14665.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__14664__14665.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__14664__14665)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__14664__14665)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__14686 = new goog.string.StringBuffer;
  var G__14687__14688 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__14687__14688) {
    var string__14689 = cljs.core.first.call(null, G__14687__14688);
    var G__14687__14690 = G__14687__14688;
    while(true) {
      sb__14686.append(string__14689);
      var temp__3974__auto____14691 = cljs.core.next.call(null, G__14687__14690);
      if(temp__3974__auto____14691) {
        var G__14687__14692 = temp__3974__auto____14691;
        var G__14705 = cljs.core.first.call(null, G__14687__14692);
        var G__14706 = G__14687__14692;
        string__14689 = G__14705;
        G__14687__14690 = G__14706;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__14693__14694 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__14693__14694) {
    var obj__14695 = cljs.core.first.call(null, G__14693__14694);
    var G__14693__14696 = G__14693__14694;
    while(true) {
      sb__14686.append(" ");
      var G__14697__14698 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__14695, opts));
      if(G__14697__14698) {
        var string__14699 = cljs.core.first.call(null, G__14697__14698);
        var G__14697__14700 = G__14697__14698;
        while(true) {
          sb__14686.append(string__14699);
          var temp__3974__auto____14701 = cljs.core.next.call(null, G__14697__14700);
          if(temp__3974__auto____14701) {
            var G__14697__14702 = temp__3974__auto____14701;
            var G__14707 = cljs.core.first.call(null, G__14697__14702);
            var G__14708 = G__14697__14702;
            string__14699 = G__14707;
            G__14697__14700 = G__14708;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____14703 = cljs.core.next.call(null, G__14693__14696);
      if(temp__3974__auto____14703) {
        var G__14693__14704 = temp__3974__auto____14703;
        var G__14709 = cljs.core.first.call(null, G__14693__14704);
        var G__14710 = G__14693__14704;
        obj__14695 = G__14709;
        G__14693__14696 = G__14710;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__14686
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__14712 = cljs.core.pr_sb.call(null, objs, opts);
  sb__14712.append("\n");
  return[cljs.core.str(sb__14712)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__14731__14732 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__14731__14732) {
    var string__14733 = cljs.core.first.call(null, G__14731__14732);
    var G__14731__14734 = G__14731__14732;
    while(true) {
      cljs.core.string_print.call(null, string__14733);
      var temp__3974__auto____14735 = cljs.core.next.call(null, G__14731__14734);
      if(temp__3974__auto____14735) {
        var G__14731__14736 = temp__3974__auto____14735;
        var G__14749 = cljs.core.first.call(null, G__14731__14736);
        var G__14750 = G__14731__14736;
        string__14733 = G__14749;
        G__14731__14734 = G__14750;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__14737__14738 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__14737__14738) {
    var obj__14739 = cljs.core.first.call(null, G__14737__14738);
    var G__14737__14740 = G__14737__14738;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__14741__14742 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__14739, opts));
      if(G__14741__14742) {
        var string__14743 = cljs.core.first.call(null, G__14741__14742);
        var G__14741__14744 = G__14741__14742;
        while(true) {
          cljs.core.string_print.call(null, string__14743);
          var temp__3974__auto____14745 = cljs.core.next.call(null, G__14741__14744);
          if(temp__3974__auto____14745) {
            var G__14741__14746 = temp__3974__auto____14745;
            var G__14751 = cljs.core.first.call(null, G__14741__14746);
            var G__14752 = G__14741__14746;
            string__14743 = G__14751;
            G__14741__14744 = G__14752;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____14747 = cljs.core.next.call(null, G__14737__14740);
      if(temp__3974__auto____14747) {
        var G__14737__14748 = temp__3974__auto____14747;
        var G__14753 = cljs.core.first.call(null, G__14737__14748);
        var G__14754 = G__14737__14748;
        obj__14739 = G__14753;
        G__14737__14740 = G__14754;
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
  pr_str.cljs$lang$applyTo = function(arglist__14755) {
    var objs = cljs.core.seq(arglist__14755);
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
  prn_str.cljs$lang$applyTo = function(arglist__14756) {
    var objs = cljs.core.seq(arglist__14756);
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
  pr.cljs$lang$applyTo = function(arglist__14757) {
    var objs = cljs.core.seq(arglist__14757);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__14758) {
    var objs = cljs.core.seq(arglist__14758);
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
  print_str.cljs$lang$applyTo = function(arglist__14759) {
    var objs = cljs.core.seq(arglist__14759);
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
  println.cljs$lang$applyTo = function(arglist__14760) {
    var objs = cljs.core.seq(arglist__14760);
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
  println_str.cljs$lang$applyTo = function(arglist__14761) {
    var objs = cljs.core.seq(arglist__14761);
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
  prn.cljs$lang$applyTo = function(arglist__14762) {
    var objs = cljs.core.seq(arglist__14762);
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
  printf.cljs$lang$applyTo = function(arglist__14763) {
    var fmt = cljs.core.first(arglist__14763);
    var args = cljs.core.rest(arglist__14763);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__14764 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__14764, "{", ", ", "}", opts, coll)
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
  var pr_pair__14765 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__14765, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__14766 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__14766, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____14767 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____14767)) {
        var nspc__14768 = temp__3974__auto____14767;
        return[cljs.core.str(nspc__14768), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____14769 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____14769)) {
          var nspc__14770 = temp__3974__auto____14769;
          return[cljs.core.str(nspc__14770), cljs.core.str("/")].join("")
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
  var pr_pair__14771 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__14771, "{", ", ", "}", opts, coll)
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
  var normalize__14773 = function(n, len) {
    var ns__14772 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__14772) < len) {
        var G__14775 = [cljs.core.str("0"), cljs.core.str(ns__14772)].join("");
        ns__14772 = G__14775;
        continue
      }else {
        return ns__14772
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__14773.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__14773.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__14773.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__14773.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__14773.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__14773.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__14774 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__14774, "{", ", ", "}", opts, coll)
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
  var this__14776 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__14777 = this;
  var G__14778__14779 = cljs.core.seq.call(null, this__14777.watches);
  if(G__14778__14779) {
    var G__14781__14783 = cljs.core.first.call(null, G__14778__14779);
    var vec__14782__14784 = G__14781__14783;
    var key__14785 = cljs.core.nth.call(null, vec__14782__14784, 0, null);
    var f__14786 = cljs.core.nth.call(null, vec__14782__14784, 1, null);
    var G__14778__14787 = G__14778__14779;
    var G__14781__14788 = G__14781__14783;
    var G__14778__14789 = G__14778__14787;
    while(true) {
      var vec__14790__14791 = G__14781__14788;
      var key__14792 = cljs.core.nth.call(null, vec__14790__14791, 0, null);
      var f__14793 = cljs.core.nth.call(null, vec__14790__14791, 1, null);
      var G__14778__14794 = G__14778__14789;
      f__14793.call(null, key__14792, this$, oldval, newval);
      var temp__3974__auto____14795 = cljs.core.next.call(null, G__14778__14794);
      if(temp__3974__auto____14795) {
        var G__14778__14796 = temp__3974__auto____14795;
        var G__14803 = cljs.core.first.call(null, G__14778__14796);
        var G__14804 = G__14778__14796;
        G__14781__14788 = G__14803;
        G__14778__14789 = G__14804;
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
  var this__14797 = this;
  return this$.watches = cljs.core.assoc.call(null, this__14797.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__14798 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__14798.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__14799 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__14799.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__14800 = this;
  return this__14800.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__14801 = this;
  return this__14801.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__14802 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__14816__delegate = function(x, p__14805) {
      var map__14811__14812 = p__14805;
      var map__14811__14813 = cljs.core.seq_QMARK_.call(null, map__14811__14812) ? cljs.core.apply.call(null, cljs.core.hash_map, map__14811__14812) : map__14811__14812;
      var validator__14814 = cljs.core._lookup.call(null, map__14811__14813, "\ufdd0'validator", null);
      var meta__14815 = cljs.core._lookup.call(null, map__14811__14813, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__14815, validator__14814, null)
    };
    var G__14816 = function(x, var_args) {
      var p__14805 = null;
      if(goog.isDef(var_args)) {
        p__14805 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14816__delegate.call(this, x, p__14805)
    };
    G__14816.cljs$lang$maxFixedArity = 1;
    G__14816.cljs$lang$applyTo = function(arglist__14817) {
      var x = cljs.core.first(arglist__14817);
      var p__14805 = cljs.core.rest(arglist__14817);
      return G__14816__delegate(x, p__14805)
    };
    G__14816.cljs$lang$arity$variadic = G__14816__delegate;
    return G__14816
  }();
  atom = function(x, var_args) {
    var p__14805 = var_args;
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
  var temp__3974__auto____14821 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____14821)) {
    var validate__14822 = temp__3974__auto____14821;
    if(cljs.core.truth_(validate__14822.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__14823 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__14823, new_value);
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
    var G__14824__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__14824 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__14824__delegate.call(this, a, f, x, y, z, more)
    };
    G__14824.cljs$lang$maxFixedArity = 5;
    G__14824.cljs$lang$applyTo = function(arglist__14825) {
      var a = cljs.core.first(arglist__14825);
      var f = cljs.core.first(cljs.core.next(arglist__14825));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__14825)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14825))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14825)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__14825)))));
      return G__14824__delegate(a, f, x, y, z, more)
    };
    G__14824.cljs$lang$arity$variadic = G__14824__delegate;
    return G__14824
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__14826) {
    var iref = cljs.core.first(arglist__14826);
    var f = cljs.core.first(cljs.core.next(arglist__14826));
    var args = cljs.core.rest(cljs.core.next(arglist__14826));
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
  var this__14827 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__14827.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__14828 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__14828.state, function(p__14829) {
    var map__14830__14831 = p__14829;
    var map__14830__14832 = cljs.core.seq_QMARK_.call(null, map__14830__14831) ? cljs.core.apply.call(null, cljs.core.hash_map, map__14830__14831) : map__14830__14831;
    var curr_state__14833 = map__14830__14832;
    var done__14834 = cljs.core._lookup.call(null, map__14830__14832, "\ufdd0'done", null);
    if(cljs.core.truth_(done__14834)) {
      return curr_state__14833
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__14828.f.call(null)})
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
    var map__14855__14856 = options;
    var map__14855__14857 = cljs.core.seq_QMARK_.call(null, map__14855__14856) ? cljs.core.apply.call(null, cljs.core.hash_map, map__14855__14856) : map__14855__14856;
    var keywordize_keys__14858 = cljs.core._lookup.call(null, map__14855__14857, "\ufdd0'keywordize-keys", null);
    var keyfn__14859 = cljs.core.truth_(keywordize_keys__14858) ? cljs.core.keyword : cljs.core.str;
    var f__14874 = function thisfn(x) {
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
                var iter__6793__auto____14873 = function iter__14867(s__14868) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__14868__14871 = s__14868;
                    while(true) {
                      if(cljs.core.seq.call(null, s__14868__14871)) {
                        var k__14872 = cljs.core.first.call(null, s__14868__14871);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__14859.call(null, k__14872), thisfn.call(null, x[k__14872])], true), iter__14867.call(null, cljs.core.rest.call(null, s__14868__14871)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__6793__auto____14873.call(null, cljs.core.js_keys.call(null, x))
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
    return f__14874.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__14875) {
    var x = cljs.core.first(arglist__14875);
    var options = cljs.core.rest(arglist__14875);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__14880 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__14884__delegate = function(args) {
      var temp__3971__auto____14881 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__14880), args, null);
      if(cljs.core.truth_(temp__3971__auto____14881)) {
        var v__14882 = temp__3971__auto____14881;
        return v__14882
      }else {
        var ret__14883 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__14880, cljs.core.assoc, args, ret__14883);
        return ret__14883
      }
    };
    var G__14884 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__14884__delegate.call(this, args)
    };
    G__14884.cljs$lang$maxFixedArity = 0;
    G__14884.cljs$lang$applyTo = function(arglist__14885) {
      var args = cljs.core.seq(arglist__14885);
      return G__14884__delegate(args)
    };
    G__14884.cljs$lang$arity$variadic = G__14884__delegate;
    return G__14884
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__14887 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__14887)) {
        var G__14888 = ret__14887;
        f = G__14888;
        continue
      }else {
        return ret__14887
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__14889__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__14889 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__14889__delegate.call(this, f, args)
    };
    G__14889.cljs$lang$maxFixedArity = 1;
    G__14889.cljs$lang$applyTo = function(arglist__14890) {
      var f = cljs.core.first(arglist__14890);
      var args = cljs.core.rest(arglist__14890);
      return G__14889__delegate(f, args)
    };
    G__14889.cljs$lang$arity$variadic = G__14889__delegate;
    return G__14889
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
    var k__14892 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__14892, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__14892, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____14901 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____14901) {
      return or__3824__auto____14901
    }else {
      var or__3824__auto____14902 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____14902) {
        return or__3824__auto____14902
      }else {
        var and__3822__auto____14903 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____14903) {
          var and__3822__auto____14904 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____14904) {
            var and__3822__auto____14905 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____14905) {
              var ret__14906 = true;
              var i__14907 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____14908 = cljs.core.not.call(null, ret__14906);
                  if(or__3824__auto____14908) {
                    return or__3824__auto____14908
                  }else {
                    return i__14907 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__14906
                }else {
                  var G__14909 = isa_QMARK_.call(null, h, child.call(null, i__14907), parent.call(null, i__14907));
                  var G__14910 = i__14907 + 1;
                  ret__14906 = G__14909;
                  i__14907 = G__14910;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____14905
            }
          }else {
            return and__3822__auto____14904
          }
        }else {
          return and__3822__auto____14903
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
    var tp__14919 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__14920 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__14921 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__14922 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____14923 = cljs.core.contains_QMARK_.call(null, tp__14919.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__14921.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__14921.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__14919, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__14922.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__14920, parent, ta__14921), "\ufdd0'descendants":tf__14922.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__14921, tag, td__14920)})
    }();
    if(cljs.core.truth_(or__3824__auto____14923)) {
      return or__3824__auto____14923
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
    var parentMap__14928 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__14929 = cljs.core.truth_(parentMap__14928.call(null, tag)) ? cljs.core.disj.call(null, parentMap__14928.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__14930 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__14929)) ? cljs.core.assoc.call(null, parentMap__14928, tag, childsParents__14929) : cljs.core.dissoc.call(null, parentMap__14928, tag);
    var deriv_seq__14931 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__14911_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__14911_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__14911_SHARP_), cljs.core.second.call(null, p1__14911_SHARP_)))
    }, cljs.core.seq.call(null, newParents__14930)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__14928.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__14912_SHARP_, p2__14913_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__14912_SHARP_, p2__14913_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__14931))
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
  var xprefs__14939 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____14941 = cljs.core.truth_(function() {
    var and__3822__auto____14940 = xprefs__14939;
    if(cljs.core.truth_(and__3822__auto____14940)) {
      return xprefs__14939.call(null, y)
    }else {
      return and__3822__auto____14940
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____14941)) {
    return or__3824__auto____14941
  }else {
    var or__3824__auto____14943 = function() {
      var ps__14942 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__14942) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__14942), prefer_table))) {
          }else {
          }
          var G__14946 = cljs.core.rest.call(null, ps__14942);
          ps__14942 = G__14946;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____14943)) {
      return or__3824__auto____14943
    }else {
      var or__3824__auto____14945 = function() {
        var ps__14944 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__14944) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__14944), y, prefer_table))) {
            }else {
            }
            var G__14947 = cljs.core.rest.call(null, ps__14944);
            ps__14944 = G__14947;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____14945)) {
        return or__3824__auto____14945
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____14949 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____14949)) {
    return or__3824__auto____14949
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__14967 = cljs.core.reduce.call(null, function(be, p__14959) {
    var vec__14960__14961 = p__14959;
    var k__14962 = cljs.core.nth.call(null, vec__14960__14961, 0, null);
    var ___14963 = cljs.core.nth.call(null, vec__14960__14961, 1, null);
    var e__14964 = vec__14960__14961;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__14962)) {
      var be2__14966 = cljs.core.truth_(function() {
        var or__3824__auto____14965 = be == null;
        if(or__3824__auto____14965) {
          return or__3824__auto____14965
        }else {
          return cljs.core.dominates.call(null, k__14962, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__14964 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__14966), k__14962, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__14962), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__14966)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__14966
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__14967)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__14967));
      return cljs.core.second.call(null, best_entry__14967)
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
    var and__3822__auto____14972 = mf;
    if(and__3822__auto____14972) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____14972
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__6694__auto____14973 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____14974 = cljs.core._reset[goog.typeOf(x__6694__auto____14973)];
      if(or__3824__auto____14974) {
        return or__3824__auto____14974
      }else {
        var or__3824__auto____14975 = cljs.core._reset["_"];
        if(or__3824__auto____14975) {
          return or__3824__auto____14975
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____14980 = mf;
    if(and__3822__auto____14980) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____14980
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__6694__auto____14981 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____14982 = cljs.core._add_method[goog.typeOf(x__6694__auto____14981)];
      if(or__3824__auto____14982) {
        return or__3824__auto____14982
      }else {
        var or__3824__auto____14983 = cljs.core._add_method["_"];
        if(or__3824__auto____14983) {
          return or__3824__auto____14983
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____14988 = mf;
    if(and__3822__auto____14988) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____14988
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__6694__auto____14989 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____14990 = cljs.core._remove_method[goog.typeOf(x__6694__auto____14989)];
      if(or__3824__auto____14990) {
        return or__3824__auto____14990
      }else {
        var or__3824__auto____14991 = cljs.core._remove_method["_"];
        if(or__3824__auto____14991) {
          return or__3824__auto____14991
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____14996 = mf;
    if(and__3822__auto____14996) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____14996
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__6694__auto____14997 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____14998 = cljs.core._prefer_method[goog.typeOf(x__6694__auto____14997)];
      if(or__3824__auto____14998) {
        return or__3824__auto____14998
      }else {
        var or__3824__auto____14999 = cljs.core._prefer_method["_"];
        if(or__3824__auto____14999) {
          return or__3824__auto____14999
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____15004 = mf;
    if(and__3822__auto____15004) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____15004
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__6694__auto____15005 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____15006 = cljs.core._get_method[goog.typeOf(x__6694__auto____15005)];
      if(or__3824__auto____15006) {
        return or__3824__auto____15006
      }else {
        var or__3824__auto____15007 = cljs.core._get_method["_"];
        if(or__3824__auto____15007) {
          return or__3824__auto____15007
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____15012 = mf;
    if(and__3822__auto____15012) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____15012
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__6694__auto____15013 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____15014 = cljs.core._methods[goog.typeOf(x__6694__auto____15013)];
      if(or__3824__auto____15014) {
        return or__3824__auto____15014
      }else {
        var or__3824__auto____15015 = cljs.core._methods["_"];
        if(or__3824__auto____15015) {
          return or__3824__auto____15015
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____15020 = mf;
    if(and__3822__auto____15020) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____15020
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__6694__auto____15021 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____15022 = cljs.core._prefers[goog.typeOf(x__6694__auto____15021)];
      if(or__3824__auto____15022) {
        return or__3824__auto____15022
      }else {
        var or__3824__auto____15023 = cljs.core._prefers["_"];
        if(or__3824__auto____15023) {
          return or__3824__auto____15023
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____15028 = mf;
    if(and__3822__auto____15028) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____15028
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__6694__auto____15029 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____15030 = cljs.core._dispatch[goog.typeOf(x__6694__auto____15029)];
      if(or__3824__auto____15030) {
        return or__3824__auto____15030
      }else {
        var or__3824__auto____15031 = cljs.core._dispatch["_"];
        if(or__3824__auto____15031) {
          return or__3824__auto____15031
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__15034 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__15035 = cljs.core._get_method.call(null, mf, dispatch_val__15034);
  if(cljs.core.truth_(target_fn__15035)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__15034)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__15035, args)
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
  var this__15036 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__15037 = this;
  cljs.core.swap_BANG_.call(null, this__15037.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__15037.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__15037.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__15037.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__15038 = this;
  cljs.core.swap_BANG_.call(null, this__15038.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__15038.method_cache, this__15038.method_table, this__15038.cached_hierarchy, this__15038.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__15039 = this;
  cljs.core.swap_BANG_.call(null, this__15039.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__15039.method_cache, this__15039.method_table, this__15039.cached_hierarchy, this__15039.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__15040 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__15040.cached_hierarchy), cljs.core.deref.call(null, this__15040.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__15040.method_cache, this__15040.method_table, this__15040.cached_hierarchy, this__15040.hierarchy)
  }
  var temp__3971__auto____15041 = cljs.core.deref.call(null, this__15040.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____15041)) {
    var target_fn__15042 = temp__3971__auto____15041;
    return target_fn__15042
  }else {
    var temp__3971__auto____15043 = cljs.core.find_and_cache_best_method.call(null, this__15040.name, dispatch_val, this__15040.hierarchy, this__15040.method_table, this__15040.prefer_table, this__15040.method_cache, this__15040.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____15043)) {
      var target_fn__15044 = temp__3971__auto____15043;
      return target_fn__15044
    }else {
      return cljs.core.deref.call(null, this__15040.method_table).call(null, this__15040.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__15045 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__15045.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__15045.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__15045.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__15045.method_cache, this__15045.method_table, this__15045.cached_hierarchy, this__15045.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__15046 = this;
  return cljs.core.deref.call(null, this__15046.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__15047 = this;
  return cljs.core.deref.call(null, this__15047.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__15048 = this;
  return cljs.core.do_dispatch.call(null, mf, this__15048.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__15050__delegate = function(_, args) {
    var self__15049 = this;
    return cljs.core._dispatch.call(null, self__15049, args)
  };
  var G__15050 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__15050__delegate.call(this, _, args)
  };
  G__15050.cljs$lang$maxFixedArity = 1;
  G__15050.cljs$lang$applyTo = function(arglist__15051) {
    var _ = cljs.core.first(arglist__15051);
    var args = cljs.core.rest(arglist__15051);
    return G__15050__delegate(_, args)
  };
  G__15050.cljs$lang$arity$variadic = G__15050__delegate;
  return G__15050
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__15052 = this;
  return cljs.core._dispatch.call(null, self__15052, args)
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
  var this__15053 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_15055, _) {
  var this__15054 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__15054.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__15056 = this;
  var and__3822__auto____15057 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____15057) {
    return this__15056.uuid === other.uuid
  }else {
    return and__3822__auto____15057
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__15058 = this;
  var this__15059 = this;
  return cljs.core.pr_str.call(null, this__15059)
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
      var s__11085 = s;
      var limit__11086 = limit;
      var parts__11087 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__11086, 1)) {
          return cljs.core.conj.call(null, parts__11087, s__11085)
        }else {
          var temp__3971__auto____11088 = cljs.core.re_find.call(null, re, s__11085);
          if(cljs.core.truth_(temp__3971__auto____11088)) {
            var m__11089 = temp__3971__auto____11088;
            var index__11090 = s__11085.indexOf(m__11089);
            var G__11091 = s__11085.substring(index__11090 + cljs.core.count.call(null, m__11089));
            var G__11092 = limit__11086 - 1;
            var G__11093 = cljs.core.conj.call(null, parts__11087, s__11085.substring(0, index__11090));
            s__11085 = G__11091;
            limit__11086 = G__11092;
            parts__11087 = G__11093;
            continue
          }else {
            return cljs.core.conj.call(null, parts__11087, s__11085)
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
  var index__11097 = s.length;
  while(true) {
    if(index__11097 === 0) {
      return""
    }else {
      var ch__11098 = cljs.core._lookup.call(null, s, index__11097 - 1, null);
      if(function() {
        var or__3824__auto____11099 = cljs.core._EQ_.call(null, ch__11098, "\n");
        if(or__3824__auto____11099) {
          return or__3824__auto____11099
        }else {
          return cljs.core._EQ_.call(null, ch__11098, "\r")
        }
      }()) {
        var G__11100 = index__11097 - 1;
        index__11097 = G__11100;
        continue
      }else {
        return s.substring(0, index__11097)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__11104 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____11105 = cljs.core.not.call(null, s__11104);
    if(or__3824__auto____11105) {
      return or__3824__auto____11105
    }else {
      var or__3824__auto____11106 = cljs.core._EQ_.call(null, "", s__11104);
      if(or__3824__auto____11106) {
        return or__3824__auto____11106
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__11104)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__11113 = new goog.string.StringBuffer;
  var length__11114 = s.length;
  var index__11115 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__11114, index__11115)) {
      return buffer__11113.toString()
    }else {
      var ch__11116 = s.charAt(index__11115);
      var temp__3971__auto____11117 = cljs.core._lookup.call(null, cmap, ch__11116, null);
      if(cljs.core.truth_(temp__3971__auto____11117)) {
        var replacement__11118 = temp__3971__auto____11117;
        buffer__11113.append([cljs.core.str(replacement__11118)].join(""))
      }else {
        buffer__11113.append(ch__11116)
      }
      var G__11119 = index__11115 + 1;
      index__11115 = G__11119;
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
      var or__3824__auto____11043 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____11043) {
        return or__3824__auto____11043
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
    var G__11044__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__11045 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__11046 = cljs.core.next.call(null, more);
            s = G__11045;
            more = G__11046;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__11044 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11044__delegate.call(this, x, xs)
    };
    G__11044.cljs$lang$maxFixedArity = 1;
    G__11044.cljs$lang$applyTo = function(arglist__11047) {
      var x = cljs.core.first(arglist__11047);
      var xs = cljs.core.rest(arglist__11047);
      return G__11044__delegate(x, xs)
    };
    G__11044.cljs$lang$arity$variadic = G__11044__delegate;
    return G__11044
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
    var iter__6793__auto____11073 = function iter__11061(s__11062) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__11062__11068 = s__11062;
        while(true) {
          if(cljs.core.seq.call(null, s__11062__11068)) {
            var vec__11069__11070 = cljs.core.first.call(null, s__11062__11068);
            var k__11071 = cljs.core.nth.call(null, vec__11069__11070, 0, null);
            var v__11072 = cljs.core.nth.call(null, vec__11069__11070, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__11071)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__11072))].join(""), iter__11061.call(null, cljs.core.rest.call(null, s__11062__11068)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__6793__auto____11073.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__11076 = cljs.core.last.call(null, args);
    var args__11077 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__11077)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__11076) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__11076))].join("") : params__11076)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__11078) {
    var args = cljs.core.seq(arglist__11078);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__15261 = {};
  var G__15262__15263 = cljs.core.seq.call(null, m);
  if(G__15262__15263) {
    var G__15265__15267 = cljs.core.first.call(null, G__15262__15263);
    var vec__15266__15268 = G__15265__15267;
    var k__15269 = cljs.core.nth.call(null, vec__15266__15268, 0, null);
    var v__15270 = cljs.core.nth.call(null, vec__15266__15268, 1, null);
    var G__15262__15271 = G__15262__15263;
    var G__15265__15272 = G__15265__15267;
    var G__15262__15273 = G__15262__15271;
    while(true) {
      var vec__15274__15275 = G__15265__15272;
      var k__15276 = cljs.core.nth.call(null, vec__15274__15275, 0, null);
      var v__15277 = cljs.core.nth.call(null, vec__15274__15275, 1, null);
      var G__15262__15278 = G__15262__15273;
      out__15261[cljs.core.name.call(null, k__15276)] = v__15277;
      var temp__3974__auto____15279 = cljs.core.next.call(null, G__15262__15278);
      if(temp__3974__auto____15279) {
        var G__15262__15280 = temp__3974__auto____15279;
        var G__15281 = cljs.core.first.call(null, G__15262__15280);
        var G__15282 = G__15262__15280;
        G__15265__15272 = G__15281;
        G__15262__15273 = G__15282;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__15261
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__15284 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__15284)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__15285) {
    var v = cljs.core.first(arglist__15285);
    var text = cljs.core.rest(arglist__15285);
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
        return cljs.core.reduce.call(null, function(m, p__15291) {
          var vec__15292__15293 = p__15291;
          var k__15294 = cljs.core.nth.call(null, vec__15292__15293, 0, null);
          var v__15295 = cljs.core.nth.call(null, vec__15292__15293, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__15294), clj__GT_js.call(null, v__15295))
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
      var temp__3971__auto____15062 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____15062)) {
        var cm__15063 = temp__3971__auto____15062;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__15063), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__15064) {
    var vec__15068__15069 = p__15064;
    var context__15070 = cljs.core.nth.call(null, vec__15068__15069, 0, null);
    if(cljs.core.not.call(null, context__15070)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__15070)
    }
  };
  var $ = function(sel, var_args) {
    var p__15064 = null;
    if(goog.isDef(var_args)) {
      p__15064 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__15064)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__15071) {
    var sel = cljs.core.first(arglist__15071);
    var p__15064 = cljs.core.rest(arglist__15071);
    return $__delegate(sel, p__15064)
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
  var or__3824__auto____15072 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____15072)) {
    return or__3824__auto____15072
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
  var G__15073 = null;
  var G__15073__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__15073__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__15073 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__15073__2.call(this, _, k);
      case 3:
        return G__15073__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__15073
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
  var attr__delegate = function($elem, a, p__15074) {
    var vec__15079__15080 = p__15074;
    var v__15081 = cljs.core.nth.call(null, vec__15079__15080, 0, null);
    var a__15082 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__15081)) {
      return $elem.attr(a__15082)
    }else {
      return $elem.attr(a__15082, v__15081)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__15074 = null;
    if(goog.isDef(var_args)) {
      p__15074 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__15074)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__15083) {
    var $elem = cljs.core.first(arglist__15083);
    var a = cljs.core.first(cljs.core.next(arglist__15083));
    var p__15074 = cljs.core.rest(cljs.core.next(arglist__15083));
    return attr__delegate($elem, a, p__15074)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__15084) {
    var vec__15089__15090 = p__15084;
    var v__15091 = cljs.core.nth.call(null, vec__15089__15090, 0, null);
    var k__15092 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__15091)) {
      return $elem.data(k__15092)
    }else {
      return $elem.data(k__15092, v__15091)
    }
  };
  var data = function($elem, k, var_args) {
    var p__15084 = null;
    if(goog.isDef(var_args)) {
      p__15084 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__15084)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__15093) {
    var $elem = cljs.core.first(arglist__15093);
    var k = cljs.core.first(cljs.core.next(arglist__15093));
    var p__15084 = cljs.core.rest(cljs.core.next(arglist__15093));
    return data__delegate($elem, k, p__15084)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__15095 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__15095)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__15097 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__15097)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__15099 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__15099)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__15101 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__15101)
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
  var hide__delegate = function($elem, p__15102) {
    var vec__15107__15108 = p__15102;
    var speed__15109 = cljs.core.nth.call(null, vec__15107__15108, 0, null);
    var on_finish__15110 = cljs.core.nth.call(null, vec__15107__15108, 1, null);
    return $elem.hide(speed__15109, on_finish__15110)
  };
  var hide = function($elem, var_args) {
    var p__15102 = null;
    if(goog.isDef(var_args)) {
      p__15102 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__15102)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__15111) {
    var $elem = cljs.core.first(arglist__15111);
    var p__15102 = cljs.core.rest(arglist__15111);
    return hide__delegate($elem, p__15102)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__15112) {
    var vec__15117__15118 = p__15112;
    var speed__15119 = cljs.core.nth.call(null, vec__15117__15118, 0, null);
    var on_finish__15120 = cljs.core.nth.call(null, vec__15117__15118, 1, null);
    return $elem.show(speed__15119, on_finish__15120)
  };
  var show = function($elem, var_args) {
    var p__15112 = null;
    if(goog.isDef(var_args)) {
      p__15112 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__15112)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__15121) {
    var $elem = cljs.core.first(arglist__15121);
    var p__15112 = cljs.core.rest(arglist__15121);
    return show__delegate($elem, p__15112)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__15122) {
    var vec__15127__15128 = p__15122;
    var speed__15129 = cljs.core.nth.call(null, vec__15127__15128, 0, null);
    var on_finish__15130 = cljs.core.nth.call(null, vec__15127__15128, 1, null);
    return $elem.toggle(speed__15129, on_finish__15130)
  };
  var toggle = function($elem, var_args) {
    var p__15122 = null;
    if(goog.isDef(var_args)) {
      p__15122 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__15122)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__15131) {
    var $elem = cljs.core.first(arglist__15131);
    var p__15122 = cljs.core.rest(arglist__15131);
    return toggle__delegate($elem, p__15122)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__15132) {
    var vec__15137__15138 = p__15132;
    var speed__15139 = cljs.core.nth.call(null, vec__15137__15138, 0, null);
    var on_finish__15140 = cljs.core.nth.call(null, vec__15137__15138, 1, null);
    return $elem.fadeOut(speed__15139, on_finish__15140)
  };
  var fade_out = function($elem, var_args) {
    var p__15132 = null;
    if(goog.isDef(var_args)) {
      p__15132 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__15132)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__15141) {
    var $elem = cljs.core.first(arglist__15141);
    var p__15132 = cljs.core.rest(arglist__15141);
    return fade_out__delegate($elem, p__15132)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__15142) {
    var vec__15147__15148 = p__15142;
    var speed__15149 = cljs.core.nth.call(null, vec__15147__15148, 0, null);
    var on_finish__15150 = cljs.core.nth.call(null, vec__15147__15148, 1, null);
    return $elem.fadeIn(speed__15149, on_finish__15150)
  };
  var fade_in = function($elem, var_args) {
    var p__15142 = null;
    if(goog.isDef(var_args)) {
      p__15142 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__15142)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__15151) {
    var $elem = cljs.core.first(arglist__15151);
    var p__15142 = cljs.core.rest(arglist__15151);
    return fade_in__delegate($elem, p__15142)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__15152) {
    var vec__15157__15158 = p__15152;
    var speed__15159 = cljs.core.nth.call(null, vec__15157__15158, 0, null);
    var on_finish__15160 = cljs.core.nth.call(null, vec__15157__15158, 1, null);
    return $elem.slideUp(speed__15159, on_finish__15160)
  };
  var slide_up = function($elem, var_args) {
    var p__15152 = null;
    if(goog.isDef(var_args)) {
      p__15152 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__15152)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__15161) {
    var $elem = cljs.core.first(arglist__15161);
    var p__15152 = cljs.core.rest(arglist__15161);
    return slide_up__delegate($elem, p__15152)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__15162) {
    var vec__15167__15168 = p__15162;
    var speed__15169 = cljs.core.nth.call(null, vec__15167__15168, 0, null);
    var on_finish__15170 = cljs.core.nth.call(null, vec__15167__15168, 1, null);
    return $elem.slideDown(speed__15169, on_finish__15170)
  };
  var slide_down = function($elem, var_args) {
    var p__15162 = null;
    if(goog.isDef(var_args)) {
      p__15162 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__15162)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__15171) {
    var $elem = cljs.core.first(arglist__15171);
    var p__15162 = cljs.core.rest(arglist__15171);
    return slide_down__delegate($elem, p__15162)
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
  var closest__delegate = function($elem, selector, p__15172) {
    var vec__15176__15177 = p__15172;
    var context__15178 = cljs.core.nth.call(null, vec__15176__15177, 0, null);
    return $elem.closest(selector, context__15178)
  };
  var closest = function($elem, selector, var_args) {
    var p__15172 = null;
    if(goog.isDef(var_args)) {
      p__15172 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__15172)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__15179) {
    var $elem = cljs.core.first(arglist__15179);
    var selector = cljs.core.first(cljs.core.next(arglist__15179));
    var p__15172 = cljs.core.rest(cljs.core.next(arglist__15179));
    return closest__delegate($elem, selector, p__15172)
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
  var val__delegate = function($elem, p__15180) {
    var vec__15184__15185 = p__15180;
    var v__15186 = cljs.core.nth.call(null, vec__15184__15185, 0, null);
    if(cljs.core.truth_(v__15186)) {
      return $elem.val(v__15186)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__15180 = null;
    if(goog.isDef(var_args)) {
      p__15180 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__15180)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__15187) {
    var $elem = cljs.core.first(arglist__15187);
    var p__15180 = cljs.core.rest(arglist__15187);
    return val__delegate($elem, p__15180)
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
jayq.core.xhr = function xhr(p__15188, content, callback) {
  var vec__15194__15195 = p__15188;
  var method__15196 = cljs.core.nth.call(null, vec__15194__15195, 0, null);
  var uri__15197 = cljs.core.nth.call(null, vec__15194__15195, 1, null);
  var params__15198 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__15196)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__15197, params__15198)
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
  var unbind__delegate = function($elem, ev, p__15199) {
    var vec__15203__15204 = p__15199;
    var func__15205 = cljs.core.nth.call(null, vec__15203__15204, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__15205)
  };
  var unbind = function($elem, ev, var_args) {
    var p__15199 = null;
    if(goog.isDef(var_args)) {
      p__15199 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__15199)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__15206) {
    var $elem = cljs.core.first(arglist__15206);
    var ev = cljs.core.first(cljs.core.next(arglist__15206));
    var p__15199 = cljs.core.rest(cljs.core.next(arglist__15206));
    return unbind__delegate($elem, ev, p__15199)
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
  var on__delegate = function($elem, events, p__15207) {
    var vec__15213__15214 = p__15207;
    var sel__15215 = cljs.core.nth.call(null, vec__15213__15214, 0, null);
    var data__15216 = cljs.core.nth.call(null, vec__15213__15214, 1, null);
    var handler__15217 = cljs.core.nth.call(null, vec__15213__15214, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__15215), data__15216, handler__15217)
  };
  var on = function($elem, events, var_args) {
    var p__15207 = null;
    if(goog.isDef(var_args)) {
      p__15207 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__15207)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__15218) {
    var $elem = cljs.core.first(arglist__15218);
    var events = cljs.core.first(cljs.core.next(arglist__15218));
    var p__15207 = cljs.core.rest(cljs.core.next(arglist__15218));
    return on__delegate($elem, events, p__15207)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__15219) {
    var vec__15225__15226 = p__15219;
    var sel__15227 = cljs.core.nth.call(null, vec__15225__15226, 0, null);
    var data__15228 = cljs.core.nth.call(null, vec__15225__15226, 1, null);
    var handler__15229 = cljs.core.nth.call(null, vec__15225__15226, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__15227), data__15228, handler__15229)
  };
  var one = function($elem, events, var_args) {
    var p__15219 = null;
    if(goog.isDef(var_args)) {
      p__15219 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__15219)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__15230) {
    var $elem = cljs.core.first(arglist__15230);
    var events = cljs.core.first(cljs.core.next(arglist__15230));
    var p__15219 = cljs.core.rest(cljs.core.next(arglist__15230));
    return one__delegate($elem, events, p__15219)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__15231) {
    var vec__15236__15237 = p__15231;
    var sel__15238 = cljs.core.nth.call(null, vec__15236__15237, 0, null);
    var handler__15239 = cljs.core.nth.call(null, vec__15236__15237, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__15238), handler__15239)
  };
  var off = function($elem, events, var_args) {
    var p__15231 = null;
    if(goog.isDef(var_args)) {
      p__15231 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__15231)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__15240) {
    var $elem = cljs.core.first(arglist__15240);
    var events = cljs.core.first(cljs.core.next(arglist__15240));
    var p__15231 = cljs.core.rest(cljs.core.next(arglist__15240));
    return off__delegate($elem, events, p__15231)
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
    var and__3822__auto____15349 = reader;
    if(and__3822__auto____15349) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____15349
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    var x__6694__auto____15350 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____15351 = cljs.reader.read_char[goog.typeOf(x__6694__auto____15350)];
      if(or__3824__auto____15351) {
        return or__3824__auto____15351
      }else {
        var or__3824__auto____15352 = cljs.reader.read_char["_"];
        if(or__3824__auto____15352) {
          return or__3824__auto____15352
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____15357 = reader;
    if(and__3822__auto____15357) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____15357
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    var x__6694__auto____15358 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____15359 = cljs.reader.unread[goog.typeOf(x__6694__auto____15358)];
      if(or__3824__auto____15359) {
        return or__3824__auto____15359
      }else {
        var or__3824__auto____15360 = cljs.reader.unread["_"];
        if(or__3824__auto____15360) {
          return or__3824__auto____15360
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
  var this__15361 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__15361.buffer_atom))) {
    var idx__15362 = cljs.core.deref.call(null, this__15361.index_atom);
    cljs.core.swap_BANG_.call(null, this__15361.index_atom, cljs.core.inc);
    return this__15361.s[idx__15362]
  }else {
    var buf__15363 = cljs.core.deref.call(null, this__15361.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__15361.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__15363)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__15364 = this;
  return cljs.core.swap_BANG_.call(null, this__15364.buffer_atom, function(p1__15344_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__15344_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____15366 = goog.string.isBreakingWhitespace(ch);
  if(cljs.core.truth_(or__3824__auto____15366)) {
    return or__3824__auto____15366
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
  var or__3824__auto____15371 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____15371) {
    return or__3824__auto____15371
  }else {
    var and__3822__auto____15373 = function() {
      var or__3824__auto____15372 = "+" === initch;
      if(or__3824__auto____15372) {
        return or__3824__auto____15372
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____15373)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__15374 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__15374);
        return next_ch__15374
      }())
    }else {
      return and__3822__auto____15373
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
  reader_error.cljs$lang$applyTo = function(arglist__15375) {
    var rdr = cljs.core.first(arglist__15375);
    var msg = cljs.core.rest(arglist__15375);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____15379 = !(ch === "#");
  if(and__3822__auto____15379) {
    var and__3822__auto____15380 = !(ch === "'");
    if(and__3822__auto____15380) {
      var and__3822__auto____15381 = !(ch === ":");
      if(and__3822__auto____15381) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____15381
      }
    }else {
      return and__3822__auto____15380
    }
  }else {
    return and__3822__auto____15379
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__15386 = new goog.string.StringBuffer(initch);
  var ch__15387 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____15388 = ch__15387 == null;
      if(or__3824__auto____15388) {
        return or__3824__auto____15388
      }else {
        var or__3824__auto____15389 = cljs.reader.whitespace_QMARK_.call(null, ch__15387);
        if(or__3824__auto____15389) {
          return or__3824__auto____15389
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__15387)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__15387);
      return sb__15386.toString()
    }else {
      var G__15390 = function() {
        sb__15386.append(ch__15387);
        return sb__15386
      }();
      var G__15391 = cljs.reader.read_char.call(null, rdr);
      sb__15386 = G__15390;
      ch__15387 = G__15391;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__15395 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____15396 = ch__15395 === "n";
      if(or__3824__auto____15396) {
        return or__3824__auto____15396
      }else {
        var or__3824__auto____15397 = ch__15395 === "r";
        if(or__3824__auto____15397) {
          return or__3824__auto____15397
        }else {
          return ch__15395 == null
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
  var matches__15399 = re.exec(s);
  if(matches__15399 == null) {
    return null
  }else {
    if(matches__15399.length === 1) {
      return matches__15399[0]
    }else {
      return matches__15399
    }
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__15407 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__15408 = groups__15407[2];
  if(!function() {
    var or__3824__auto____15409 = group3__15408 == null;
    if(or__3824__auto____15409) {
      return or__3824__auto____15409
    }else {
      return group3__15408.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__15410 = "-" === groups__15407[1] ? -1 : 1;
    var a__15411 = cljs.core.truth_(groups__15407[3]) ? [groups__15407[3], 10] : cljs.core.truth_(groups__15407[4]) ? [groups__15407[4], 16] : cljs.core.truth_(groups__15407[5]) ? [groups__15407[5], 8] : cljs.core.truth_(groups__15407[7]) ? [groups__15407[7], parseInt(groups__15407[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__15412 = a__15411[0];
    var radix__15413 = a__15411[1];
    if(n__15412 == null) {
      return null
    }else {
      return negate__15410 * parseInt(n__15412, radix__15413)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__15417 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__15418 = groups__15417[1];
  var denominator__15419 = groups__15417[2];
  return parseInt(numinator__15418) / parseInt(denominator__15419)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__15422 = re.exec(s);
  if(function() {
    var and__3822__auto____15423 = !(matches__15422 == null);
    if(and__3822__auto____15423) {
      return matches__15422[0] === s
    }else {
      return and__3822__auto____15423
    }
  }()) {
    if(matches__15422.length === 1) {
      return matches__15422[0]
    }else {
      return matches__15422
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
  var code__15425 = parseInt(code_str, 16);
  return String.fromCharCode(code__15425)
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__15428 = cljs.reader.read_char.call(null, reader);
  var mapresult__15429 = cljs.reader.escape_char_map.call(null, ch__15428);
  if(cljs.core.truth_(mapresult__15429)) {
    return mapresult__15429
  }else {
    if(ch__15428 === "x") {
      return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_2_pattern, reader, ch__15428, cljs.reader.read_2_chars.call(null, reader)))
    }else {
      if(ch__15428 === "u") {
        return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_4_pattern, reader, ch__15428, cljs.reader.read_4_chars.call(null, reader)))
      }else {
        if(cljs.reader.numeric_QMARK_.call(null, ch__15428)) {
          return String.fromCharCode(ch__15428)
        }else {
          if("\ufdd0'else") {
            return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", ch__15428)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__15431 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__15431))) {
      var G__15432 = cljs.reader.read_char.call(null, rdr);
      ch__15431 = G__15432;
      continue
    }else {
      return ch__15431
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__15439 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    var ch__15440 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__15440)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__15440) {
      return cljs.core.persistent_BANG_.call(null, a__15439)
    }else {
      var temp__3971__auto____15441 = cljs.reader.macros.call(null, ch__15440);
      if(cljs.core.truth_(temp__3971__auto____15441)) {
        var macrofn__15442 = temp__3971__auto____15441;
        var mret__15443 = macrofn__15442.call(null, rdr, ch__15440);
        var G__15445 = mret__15443 === rdr ? a__15439 : cljs.core.conj_BANG_.call(null, a__15439, mret__15443);
        a__15439 = G__15445;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__15440);
        var o__15444 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__15446 = o__15444 === rdr ? a__15439 : cljs.core.conj_BANG_.call(null, a__15439, o__15444);
        a__15439 = G__15446;
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
  var ch__15451 = cljs.reader.read_char.call(null, rdr);
  var dm__15452 = cljs.reader.dispatch_macros.call(null, ch__15451);
  if(cljs.core.truth_(dm__15452)) {
    return dm__15452.call(null, rdr, _)
  }else {
    var temp__3971__auto____15453 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__15451);
    if(cljs.core.truth_(temp__3971__auto____15453)) {
      var obj__15454 = temp__3971__auto____15453;
      return obj__15454
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__15451)
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
  var l__15456 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__15456))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__15456)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__15463 = new goog.string.StringBuffer(initch);
  var ch__15464 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____15465 = ch__15464 == null;
      if(or__3824__auto____15465) {
        return or__3824__auto____15465
      }else {
        var or__3824__auto____15466 = cljs.reader.whitespace_QMARK_.call(null, ch__15464);
        if(or__3824__auto____15466) {
          return or__3824__auto____15466
        }else {
          return cljs.reader.macros.call(null, ch__15464)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__15464);
      var s__15467 = buffer__15463.toString();
      var or__3824__auto____15468 = cljs.reader.match_number.call(null, s__15467);
      if(cljs.core.truth_(or__3824__auto____15468)) {
        return or__3824__auto____15468
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__15467, "]")
      }
    }else {
      var G__15469 = function() {
        buffer__15463.append(ch__15464);
        return buffer__15463
      }();
      var G__15470 = cljs.reader.read_char.call(null, reader);
      buffer__15463 = G__15469;
      ch__15464 = G__15470;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__15473 = new goog.string.StringBuffer;
  var ch__15474 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__15474 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__15474) {
        var G__15475 = function() {
          buffer__15473.append(cljs.reader.escape_char.call(null, buffer__15473, reader));
          return buffer__15473
        }();
        var G__15476 = cljs.reader.read_char.call(null, reader);
        buffer__15473 = G__15475;
        ch__15474 = G__15476;
        continue
      }else {
        if('"' === ch__15474) {
          return buffer__15473.toString()
        }else {
          if("\ufdd0'default") {
            var G__15477 = function() {
              buffer__15473.append(ch__15474);
              return buffer__15473
            }();
            var G__15478 = cljs.reader.read_char.call(null, reader);
            buffer__15473 = G__15477;
            ch__15474 = G__15478;
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
  var token__15480 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains(token__15480, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__15480, 0, token__15480.indexOf("/")), cljs.core.subs.call(null, token__15480, token__15480.indexOf("/") + 1, token__15480.length))
  }else {
    return cljs.reader.special_symbols.call(null, token__15480, cljs.core.symbol.call(null, token__15480))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__15490 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__15491 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__15490);
  var token__15492 = a__15491[0];
  var ns__15493 = a__15491[1];
  var name__15494 = a__15491[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____15496 = function() {
      var and__3822__auto____15495 = !(void 0 === ns__15493);
      if(and__3822__auto____15495) {
        return ns__15493.substring(ns__15493.length - 2, ns__15493.length) === ":/"
      }else {
        return and__3822__auto____15495
      }
    }();
    if(cljs.core.truth_(or__3824__auto____15496)) {
      return or__3824__auto____15496
    }else {
      var or__3824__auto____15497 = name__15494[name__15494.length - 1] === ":";
      if(or__3824__auto____15497) {
        return or__3824__auto____15497
      }else {
        return!(token__15492.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__15492)
  }else {
    if(function() {
      var and__3822__auto____15498 = !(ns__15493 == null);
      if(and__3822__auto____15498) {
        return ns__15493.length > 0
      }else {
        return and__3822__auto____15498
      }
    }()) {
      return cljs.core.keyword.call(null, ns__15493.substring(0, ns__15493.indexOf("/")), name__15494)
    }else {
      return cljs.core.keyword.call(null, token__15492)
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
  var m__15504 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__15504)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__15505 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__15506__15507 = o__15505;
    if(G__15506__15507) {
      if(function() {
        var or__3824__auto____15508 = G__15506__15507.cljs$lang$protocol_mask$partition0$ & 262144;
        if(or__3824__auto____15508) {
          return or__3824__auto____15508
        }else {
          return G__15506__15507.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__15506__15507.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__15506__15507)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__15506__15507)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__15505, cljs.core.merge.call(null, cljs.core.meta.call(null, o__15505), m__15504))
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
    var ch__15512 = cljs.reader.read_char.call(null, reader);
    if(ch__15512 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__15512)) {
        var G__15515 = reader;
        var G__15516 = eof_is_error;
        var G__15517 = sentinel;
        var G__15518 = is_recursive;
        reader = G__15515;
        eof_is_error = G__15516;
        sentinel = G__15517;
        is_recursive = G__15518;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__15512)) {
          var G__15519 = cljs.reader.read_comment.call(null, reader, ch__15512);
          var G__15520 = eof_is_error;
          var G__15521 = sentinel;
          var G__15522 = is_recursive;
          reader = G__15519;
          eof_is_error = G__15520;
          sentinel = G__15521;
          is_recursive = G__15522;
          continue
        }else {
          if("\ufdd0'else") {
            var f__15513 = cljs.reader.macros.call(null, ch__15512);
            var res__15514 = cljs.core.truth_(f__15513) ? f__15513.call(null, reader, ch__15512) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__15512) ? cljs.reader.read_number.call(null, reader, ch__15512) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__15512) : null;
            if(res__15514 === reader) {
              var G__15523 = reader;
              var G__15524 = eof_is_error;
              var G__15525 = sentinel;
              var G__15526 = is_recursive;
              reader = G__15523;
              eof_is_error = G__15524;
              sentinel = G__15525;
              is_recursive = G__15526;
              continue
            }else {
              return res__15514
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
  var r__15528 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__15528, true, null, false)
};
cljs.reader.zero_fill_right = function zero_fill_right(s, width) {
  if(cljs.core._EQ_.call(null, width, cljs.core.count.call(null, s))) {
    return s
  }else {
    if(width < cljs.core.count.call(null, s)) {
      return s.substring(0, width)
    }else {
      if("\ufdd0'else") {
        var b__15530 = new goog.string.StringBuffer(s);
        while(true) {
          if(b__15530.getLength() < width) {
            var G__15531 = b__15530.append("0");
            b__15530 = G__15531;
            continue
          }else {
            return b__15530.toString()
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
  var and__3822__auto____15534 = cljs.reader.divisible_QMARK_.call(null, year, 4);
  if(cljs.core.truth_(and__3822__auto____15534)) {
    var or__3824__auto____15535 = cljs.reader.indivisible_QMARK_.call(null, year, 100);
    if(cljs.core.truth_(or__3824__auto____15535)) {
      return or__3824__auto____15535
    }else {
      return cljs.reader.divisible_QMARK_.call(null, year, 400)
    }
  }else {
    return and__3822__auto____15534
  }
};
cljs.reader.days_in_month = function() {
  var dim_norm__15540 = cljs.core.PersistentVector.fromArray([null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  var dim_leap__15541 = cljs.core.PersistentVector.fromArray([null, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  return function(month, leap_year_QMARK_) {
    return cljs.core._lookup.call(null, cljs.core.truth_(leap_year_QMARK_) ? dim_leap__15541 : dim_norm__15540, month, null)
  }
}();
cljs.reader.parse_and_validate_timestamp = function() {
  var timestamp__15542 = /(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
  var check__15544 = function(low, n, high, msg) {
    if(function() {
      var and__3822__auto____15543 = low <= n;
      if(and__3822__auto____15543) {
        return n <= high
      }else {
        return and__3822__auto____15543
      }
    }()) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str(msg), cljs.core.str(" Failed:  "), cljs.core.str(low), cljs.core.str("<="), cljs.core.str(n), cljs.core.str("<="), cljs.core.str(high)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'<=", "\ufdd1'low", "\ufdd1'n", "\ufdd1'high"), cljs.core.hash_map("\ufdd0'line", 474))))].join(""));
    }
    return n
  };
  return function(ts) {
    var temp__3974__auto____15545 = cljs.core.map.call(null, cljs.core.vec, cljs.core.split_at.call(null, 8, cljs.core.re_matches.call(null, timestamp__15542, ts)));
    if(cljs.core.truth_(temp__3974__auto____15545)) {
      var vec__15546__15549 = temp__3974__auto____15545;
      var vec__15547__15550 = cljs.core.nth.call(null, vec__15546__15549, 0, null);
      var ___15551 = cljs.core.nth.call(null, vec__15547__15550, 0, null);
      var years__15552 = cljs.core.nth.call(null, vec__15547__15550, 1, null);
      var months__15553 = cljs.core.nth.call(null, vec__15547__15550, 2, null);
      var days__15554 = cljs.core.nth.call(null, vec__15547__15550, 3, null);
      var hours__15555 = cljs.core.nth.call(null, vec__15547__15550, 4, null);
      var minutes__15556 = cljs.core.nth.call(null, vec__15547__15550, 5, null);
      var seconds__15557 = cljs.core.nth.call(null, vec__15547__15550, 6, null);
      var milliseconds__15558 = cljs.core.nth.call(null, vec__15547__15550, 7, null);
      var vec__15548__15559 = cljs.core.nth.call(null, vec__15546__15549, 1, null);
      var ___15560 = cljs.core.nth.call(null, vec__15548__15559, 0, null);
      var ___15561 = cljs.core.nth.call(null, vec__15548__15559, 1, null);
      var ___15562 = cljs.core.nth.call(null, vec__15548__15559, 2, null);
      var V__15563 = vec__15546__15549;
      var vec__15564__15567 = cljs.core.map.call(null, function(v) {
        return cljs.core.map.call(null, function(p1__15539_SHARP_) {
          return parseInt(p1__15539_SHARP_)
        }, v)
      }, cljs.core.map.call(null, function(p1__15537_SHARP_, p2__15536_SHARP_) {
        return cljs.core.update_in.call(null, p2__15536_SHARP_, cljs.core.PersistentVector.fromArray([0], true), p1__15537_SHARP_)
      }, cljs.core.PersistentVector.fromArray([cljs.core.constantly.call(null, null), function(p1__15538_SHARP_) {
        if(cljs.core._EQ_.call(null, p1__15538_SHARP_, "-")) {
          return"-1"
        }else {
          return"1"
        }
      }], true), V__15563));
      var vec__15565__15568 = cljs.core.nth.call(null, vec__15564__15567, 0, null);
      var ___15569 = cljs.core.nth.call(null, vec__15565__15568, 0, null);
      var y__15570 = cljs.core.nth.call(null, vec__15565__15568, 1, null);
      var mo__15571 = cljs.core.nth.call(null, vec__15565__15568, 2, null);
      var d__15572 = cljs.core.nth.call(null, vec__15565__15568, 3, null);
      var h__15573 = cljs.core.nth.call(null, vec__15565__15568, 4, null);
      var m__15574 = cljs.core.nth.call(null, vec__15565__15568, 5, null);
      var s__15575 = cljs.core.nth.call(null, vec__15565__15568, 6, null);
      var ms__15576 = cljs.core.nth.call(null, vec__15565__15568, 7, null);
      var vec__15566__15577 = cljs.core.nth.call(null, vec__15564__15567, 1, null);
      var offset_sign__15578 = cljs.core.nth.call(null, vec__15566__15577, 0, null);
      var offset_hours__15579 = cljs.core.nth.call(null, vec__15566__15577, 1, null);
      var offset_minutes__15580 = cljs.core.nth.call(null, vec__15566__15577, 2, null);
      var offset__15581 = offset_sign__15578 * (offset_hours__15579 * 60 + offset_minutes__15580);
      return cljs.core.PersistentVector.fromArray([cljs.core.not.call(null, years__15552) ? 1970 : y__15570, cljs.core.not.call(null, months__15553) ? 1 : check__15544.call(null, 1, mo__15571, 12, "timestamp month field must be in range 1..12"), cljs.core.not.call(null, days__15554) ? 1 : check__15544.call(null, 1, d__15572, cljs.reader.days_in_month.call(null, mo__15571, cljs.reader.leap_year_QMARK_.call(null, y__15570)), "timestamp day field must be in range 1..last day in month"), cljs.core.not.call(null, 
      hours__15555) ? 0 : check__15544.call(null, 0, h__15573, 23, "timestamp hour field must be in range 0..23"), cljs.core.not.call(null, minutes__15556) ? 0 : check__15544.call(null, 0, m__15574, 59, "timestamp minute field must be in range 0..59"), cljs.core.not.call(null, seconds__15557) ? 0 : check__15544.call(null, 0, s__15575, cljs.core._EQ_.call(null, m__15574, 59) ? 60 : 59, "timestamp second field must be in range 0..60"), cljs.core.not.call(null, milliseconds__15558) ? 0 : check__15544.call(null, 
      0, ms__15576, 999, "timestamp millisecond field must be in range 0..999"), offset__15581], true)
    }else {
      return null
    }
  }
}();
cljs.reader.parse_timestamp = function parse_timestamp(ts) {
  var temp__3971__auto____15593 = cljs.reader.parse_and_validate_timestamp.call(null, ts);
  if(cljs.core.truth_(temp__3971__auto____15593)) {
    var vec__15594__15595 = temp__3971__auto____15593;
    var years__15596 = cljs.core.nth.call(null, vec__15594__15595, 0, null);
    var months__15597 = cljs.core.nth.call(null, vec__15594__15595, 1, null);
    var days__15598 = cljs.core.nth.call(null, vec__15594__15595, 2, null);
    var hours__15599 = cljs.core.nth.call(null, vec__15594__15595, 3, null);
    var minutes__15600 = cljs.core.nth.call(null, vec__15594__15595, 4, null);
    var seconds__15601 = cljs.core.nth.call(null, vec__15594__15595, 5, null);
    var ms__15602 = cljs.core.nth.call(null, vec__15594__15595, 6, null);
    var offset__15603 = cljs.core.nth.call(null, vec__15594__15595, 7, null);
    return new Date(Date.UTC(years__15596, months__15597 - 1, days__15598, hours__15599, minutes__15600, seconds__15601, ms__15602) - offset__15603 * 60 * 1E3)
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
  var tag__15607 = cljs.reader.read_symbol.call(null, rdr, initch);
  var temp__3971__auto____15608 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__15607), null);
  if(cljs.core.truth_(temp__3971__auto____15608)) {
    var pfn__15609 = temp__3971__auto____15608;
    return pfn__15609.call(null, cljs.reader.read.call(null, rdr, true, null, false))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__15607), " in ", cljs.core.pr_str.call(null, cljs.core.keys.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_))))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__15612 = cljs.core.name.call(null, tag);
  var old_parser__15613 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__15612, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__15612, f);
  return old_parser__15613
};
cljs.reader.deregister_tag_parser_BANG_ = function deregister_tag_parser_BANG_(tag) {
  var tag__15616 = cljs.core.name.call(null, tag);
  var old_parser__15617 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__15616, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.dissoc, tag__15616);
  return old_parser__15617
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
        return cljs.core.reduce.call(null, function(m, p__15339) {
          var vec__15340__15341 = p__15339;
          var k__15342 = cljs.core.nth.call(null, vec__15340__15341, 0, null);
          var v__15343 = cljs.core.nth.call(null, vec__15340__15341, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__15342), clj__GT_js.call(null, v__15343))
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
      var vec__15302__15303 = route;
      var m__15304 = cljs.core.nth.call(null, vec__15302__15303, 0, null);
      var u__15305 = cljs.core.nth.call(null, vec__15302__15303, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__15304), u__15305], true)
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
  var cur__15308 = fetch.util.clj__GT_js.call(null, d);
  var query__15309 = goog.Uri.QueryData.createFromMap(new goog.structs.Map(cur__15308));
  return[cljs.core.str(query__15309)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__15311 = req.getResponseText();
      return callback.call(null, data__15311)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__15312) {
    var vec__15323__15324 = p__15312;
    var opts__15325 = cljs.core.nth.call(null, vec__15323__15324, 0, null);
    var req__15327 = new goog.net.XhrIo;
    var vec__15326__15328 = fetch.core.parse_route.call(null, route);
    var method__15329 = cljs.core.nth.call(null, vec__15326__15328, 0, null);
    var uri__15330 = cljs.core.nth.call(null, vec__15326__15328, 1, null);
    var data__15331 = fetch.core.__GT_data.call(null, content);
    var callback__15332 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__15332)) {
      goog.events.listen(req__15327, goog.net.EventType.COMPLETE, function() {
        return callback__15332.call(null, req__15327)
      })
    }else {
    }
    return req__15327.send(uri__15330, method__15329, data__15331, cljs.core.truth_(opts__15325) ? fetch.util.clj__GT_js.call(null, opts__15325) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__15312 = null;
    if(goog.isDef(var_args)) {
      p__15312 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__15312)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__15333) {
    var route = cljs.core.first(arglist__15333);
    var content = cljs.core.first(cljs.core.next(arglist__15333));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__15333)));
    var p__15312 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__15333)));
    return xhr__delegate(route, content, callback, p__15312)
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
    var data__15297 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__15297))
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
    var me__11037 = this;
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
    var merged_params__11038 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_ui.call(null, ui));
    return fetch.remotes.remote_callback.call(null, "real-coords", cljs.core.PersistentVector.fromArray([merged_params__11038], true), function(result) {
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
    var merged_params__11039 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, event));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__11039], true), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_in, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    var merged_params__11040 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":400, "\ufdd0'y":300}));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__11040], true), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_out, webrot.client.main.hit_event, function(event) {
    event.preventDefault();
    var merged_params__11041 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null));
    return fetch.remotes.remote_callback.call(null, "zoom-out", cljs.core.PersistentVector.fromArray([merged_params__11041], true), function(result) {
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
