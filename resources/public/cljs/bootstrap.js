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
    var G__9113__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__9113 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9113__delegate.call(this, array, i, idxs)
    };
    G__9113.cljs$lang$maxFixedArity = 2;
    G__9113.cljs$lang$applyTo = function(arglist__9114) {
      var array = cljs.core.first(arglist__9114);
      var i = cljs.core.first(cljs.core.next(arglist__9114));
      var idxs = cljs.core.rest(cljs.core.next(arglist__9114));
      return G__9113__delegate(array, i, idxs)
    };
    G__9113.cljs$lang$arity$variadic = G__9113__delegate;
    return G__9113
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
      var and__3822__auto____9115 = this$;
      if(and__3822__auto____9115) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____9115
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
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
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____9118 = this$;
      if(and__3822__auto____9118) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____9118
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
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
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____9121 = this$;
      if(and__3822__auto____9121) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____9121
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
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
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____9124 = this$;
      if(and__3822__auto____9124) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____9124
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
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
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____9127 = this$;
      if(and__3822__auto____9127) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____9127
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
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
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____9130 = this$;
      if(and__3822__auto____9130) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____9130
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
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
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____9133 = this$;
      if(and__3822__auto____9133) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____9133
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
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
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____9136 = this$;
      if(and__3822__auto____9136) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____9136
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
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
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____9139 = this$;
      if(and__3822__auto____9139) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____9139
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
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
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____9142 = this$;
      if(and__3822__auto____9142) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____9142
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____9145 = this$;
      if(and__3822__auto____9145) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____9145
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____9148 = this$;
      if(and__3822__auto____9148) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____9148
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____9151 = this$;
      if(and__3822__auto____9151) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____9151
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____9154 = this$;
      if(and__3822__auto____9154) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____9154
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____9157 = this$;
      if(and__3822__auto____9157) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____9157
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____9160 = this$;
      if(and__3822__auto____9160) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____9160
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____9163 = this$;
      if(and__3822__auto____9163) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____9163
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____9166 = this$;
      if(and__3822__auto____9166) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____9166
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____9169 = this$;
      if(and__3822__auto____9169) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____9169
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
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
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____9172 = this$;
      if(and__3822__auto____9172) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____9172
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____9173 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9173) {
          return or__3824__auto____9173
        }else {
          var or__3824__auto____9174 = cljs.core._invoke["_"];
          if(or__3824__auto____9174) {
            return or__3824__auto____9174
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____9175 = this$;
      if(and__3822__auto____9175) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____9175
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____9176 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____9176) {
          return or__3824__auto____9176
        }else {
          var or__3824__auto____9177 = cljs.core._invoke["_"];
          if(or__3824__auto____9177) {
            return or__3824__auto____9177
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
    var and__3822__auto____9178 = coll;
    if(and__3822__auto____9178) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____9178
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9179 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9179) {
        return or__3824__auto____9179
      }else {
        var or__3824__auto____9180 = cljs.core._count["_"];
        if(or__3824__auto____9180) {
          return or__3824__auto____9180
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
    var and__3822__auto____9181 = coll;
    if(and__3822__auto____9181) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____9181
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9182 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9182) {
        return or__3824__auto____9182
      }else {
        var or__3824__auto____9183 = cljs.core._empty["_"];
        if(or__3824__auto____9183) {
          return or__3824__auto____9183
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
    var and__3822__auto____9184 = coll;
    if(and__3822__auto____9184) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____9184
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____9185 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9185) {
        return or__3824__auto____9185
      }else {
        var or__3824__auto____9186 = cljs.core._conj["_"];
        if(or__3824__auto____9186) {
          return or__3824__auto____9186
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
      var and__3822__auto____9187 = coll;
      if(and__3822__auto____9187) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____9187
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____9188 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9188) {
          return or__3824__auto____9188
        }else {
          var or__3824__auto____9189 = cljs.core._nth["_"];
          if(or__3824__auto____9189) {
            return or__3824__auto____9189
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____9190 = coll;
      if(and__3822__auto____9190) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____9190
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____9191 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9191) {
          return or__3824__auto____9191
        }else {
          var or__3824__auto____9192 = cljs.core._nth["_"];
          if(or__3824__auto____9192) {
            return or__3824__auto____9192
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
    var and__3822__auto____9193 = coll;
    if(and__3822__auto____9193) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____9193
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9194 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9194) {
        return or__3824__auto____9194
      }else {
        var or__3824__auto____9195 = cljs.core._first["_"];
        if(or__3824__auto____9195) {
          return or__3824__auto____9195
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____9196 = coll;
    if(and__3822__auto____9196) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____9196
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9197 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9197) {
        return or__3824__auto____9197
      }else {
        var or__3824__auto____9198 = cljs.core._rest["_"];
        if(or__3824__auto____9198) {
          return or__3824__auto____9198
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
      var and__3822__auto____9199 = o;
      if(and__3822__auto____9199) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____9199
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____9200 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____9200) {
          return or__3824__auto____9200
        }else {
          var or__3824__auto____9201 = cljs.core._lookup["_"];
          if(or__3824__auto____9201) {
            return or__3824__auto____9201
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____9202 = o;
      if(and__3822__auto____9202) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____9202
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____9203 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____9203) {
          return or__3824__auto____9203
        }else {
          var or__3824__auto____9204 = cljs.core._lookup["_"];
          if(or__3824__auto____9204) {
            return or__3824__auto____9204
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
    var and__3822__auto____9205 = coll;
    if(and__3822__auto____9205) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____9205
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____9206 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9206) {
        return or__3824__auto____9206
      }else {
        var or__3824__auto____9207 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____9207) {
          return or__3824__auto____9207
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____9208 = coll;
    if(and__3822__auto____9208) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____9208
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____9209 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9209) {
        return or__3824__auto____9209
      }else {
        var or__3824__auto____9210 = cljs.core._assoc["_"];
        if(or__3824__auto____9210) {
          return or__3824__auto____9210
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
    var and__3822__auto____9211 = coll;
    if(and__3822__auto____9211) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____9211
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____9212 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9212) {
        return or__3824__auto____9212
      }else {
        var or__3824__auto____9213 = cljs.core._dissoc["_"];
        if(or__3824__auto____9213) {
          return or__3824__auto____9213
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
    var and__3822__auto____9214 = coll;
    if(and__3822__auto____9214) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____9214
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9215 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9215) {
        return or__3824__auto____9215
      }else {
        var or__3824__auto____9216 = cljs.core._key["_"];
        if(or__3824__auto____9216) {
          return or__3824__auto____9216
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____9217 = coll;
    if(and__3822__auto____9217) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____9217
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9218 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9218) {
        return or__3824__auto____9218
      }else {
        var or__3824__auto____9219 = cljs.core._val["_"];
        if(or__3824__auto____9219) {
          return or__3824__auto____9219
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
    var and__3822__auto____9220 = coll;
    if(and__3822__auto____9220) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____9220
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____9221 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9221) {
        return or__3824__auto____9221
      }else {
        var or__3824__auto____9222 = cljs.core._disjoin["_"];
        if(or__3824__auto____9222) {
          return or__3824__auto____9222
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
    var and__3822__auto____9223 = coll;
    if(and__3822__auto____9223) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____9223
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9224 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9224) {
        return or__3824__auto____9224
      }else {
        var or__3824__auto____9225 = cljs.core._peek["_"];
        if(or__3824__auto____9225) {
          return or__3824__auto____9225
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____9226 = coll;
    if(and__3822__auto____9226) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____9226
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9227 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9227) {
        return or__3824__auto____9227
      }else {
        var or__3824__auto____9228 = cljs.core._pop["_"];
        if(or__3824__auto____9228) {
          return or__3824__auto____9228
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
    var and__3822__auto____9229 = coll;
    if(and__3822__auto____9229) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____9229
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____9230 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9230) {
        return or__3824__auto____9230
      }else {
        var or__3824__auto____9231 = cljs.core._assoc_n["_"];
        if(or__3824__auto____9231) {
          return or__3824__auto____9231
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
    var and__3822__auto____9232 = o;
    if(and__3822__auto____9232) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____9232
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9233 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____9233) {
        return or__3824__auto____9233
      }else {
        var or__3824__auto____9234 = cljs.core._deref["_"];
        if(or__3824__auto____9234) {
          return or__3824__auto____9234
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
    var and__3822__auto____9235 = o;
    if(and__3822__auto____9235) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____9235
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____9236 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____9236) {
        return or__3824__auto____9236
      }else {
        var or__3824__auto____9237 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____9237) {
          return or__3824__auto____9237
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
    var and__3822__auto____9238 = o;
    if(and__3822__auto____9238) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____9238
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9239 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____9239) {
        return or__3824__auto____9239
      }else {
        var or__3824__auto____9240 = cljs.core._meta["_"];
        if(or__3824__auto____9240) {
          return or__3824__auto____9240
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
    var and__3822__auto____9241 = o;
    if(and__3822__auto____9241) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____9241
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____9242 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____9242) {
        return or__3824__auto____9242
      }else {
        var or__3824__auto____9243 = cljs.core._with_meta["_"];
        if(or__3824__auto____9243) {
          return or__3824__auto____9243
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
      var and__3822__auto____9244 = coll;
      if(and__3822__auto____9244) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____9244
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____9245 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9245) {
          return or__3824__auto____9245
        }else {
          var or__3824__auto____9246 = cljs.core._reduce["_"];
          if(or__3824__auto____9246) {
            return or__3824__auto____9246
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____9247 = coll;
      if(and__3822__auto____9247) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____9247
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____9248 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____9248) {
          return or__3824__auto____9248
        }else {
          var or__3824__auto____9249 = cljs.core._reduce["_"];
          if(or__3824__auto____9249) {
            return or__3824__auto____9249
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
    var and__3822__auto____9250 = coll;
    if(and__3822__auto____9250) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____9250
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____9251 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9251) {
        return or__3824__auto____9251
      }else {
        var or__3824__auto____9252 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____9252) {
          return or__3824__auto____9252
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
    var and__3822__auto____9253 = o;
    if(and__3822__auto____9253) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____9253
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____9254 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____9254) {
        return or__3824__auto____9254
      }else {
        var or__3824__auto____9255 = cljs.core._equiv["_"];
        if(or__3824__auto____9255) {
          return or__3824__auto____9255
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
    var and__3822__auto____9256 = o;
    if(and__3822__auto____9256) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____9256
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9257 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____9257) {
        return or__3824__auto____9257
      }else {
        var or__3824__auto____9258 = cljs.core._hash["_"];
        if(or__3824__auto____9258) {
          return or__3824__auto____9258
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
    var and__3822__auto____9259 = o;
    if(and__3822__auto____9259) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____9259
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____9260 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____9260) {
        return or__3824__auto____9260
      }else {
        var or__3824__auto____9261 = cljs.core._seq["_"];
        if(or__3824__auto____9261) {
          return or__3824__auto____9261
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
    var and__3822__auto____9262 = coll;
    if(and__3822__auto____9262) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____9262
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9263 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9263) {
        return or__3824__auto____9263
      }else {
        var or__3824__auto____9264 = cljs.core._rseq["_"];
        if(or__3824__auto____9264) {
          return or__3824__auto____9264
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
    var and__3822__auto____9265 = coll;
    if(and__3822__auto____9265) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____9265
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____9266 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9266) {
        return or__3824__auto____9266
      }else {
        var or__3824__auto____9267 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____9267) {
          return or__3824__auto____9267
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____9268 = coll;
    if(and__3822__auto____9268) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____9268
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____9269 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9269) {
        return or__3824__auto____9269
      }else {
        var or__3824__auto____9270 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____9270) {
          return or__3824__auto____9270
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____9271 = coll;
    if(and__3822__auto____9271) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____9271
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____9272 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9272) {
        return or__3824__auto____9272
      }else {
        var or__3824__auto____9273 = cljs.core._entry_key["_"];
        if(or__3824__auto____9273) {
          return or__3824__auto____9273
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____9274 = coll;
    if(and__3822__auto____9274) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____9274
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9275 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9275) {
        return or__3824__auto____9275
      }else {
        var or__3824__auto____9276 = cljs.core._comparator["_"];
        if(or__3824__auto____9276) {
          return or__3824__auto____9276
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
    var and__3822__auto____9277 = o;
    if(and__3822__auto____9277) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____9277
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____9278 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____9278) {
        return or__3824__auto____9278
      }else {
        var or__3824__auto____9279 = cljs.core._pr_seq["_"];
        if(or__3824__auto____9279) {
          return or__3824__auto____9279
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
    var and__3822__auto____9280 = d;
    if(and__3822__auto____9280) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____9280
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____9281 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____9281) {
        return or__3824__auto____9281
      }else {
        var or__3824__auto____9282 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____9282) {
          return or__3824__auto____9282
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
    var and__3822__auto____9283 = this$;
    if(and__3822__auto____9283) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____9283
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____9284 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9284) {
        return or__3824__auto____9284
      }else {
        var or__3824__auto____9285 = cljs.core._notify_watches["_"];
        if(or__3824__auto____9285) {
          return or__3824__auto____9285
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____9286 = this$;
    if(and__3822__auto____9286) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____9286
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____9287 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9287) {
        return or__3824__auto____9287
      }else {
        var or__3824__auto____9288 = cljs.core._add_watch["_"];
        if(or__3824__auto____9288) {
          return or__3824__auto____9288
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____9289 = this$;
    if(and__3822__auto____9289) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____9289
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____9290 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____9290) {
        return or__3824__auto____9290
      }else {
        var or__3824__auto____9291 = cljs.core._remove_watch["_"];
        if(or__3824__auto____9291) {
          return or__3824__auto____9291
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
    var and__3822__auto____9292 = coll;
    if(and__3822__auto____9292) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____9292
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____9293 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____9293) {
        return or__3824__auto____9293
      }else {
        var or__3824__auto____9294 = cljs.core._as_transient["_"];
        if(or__3824__auto____9294) {
          return or__3824__auto____9294
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
    var and__3822__auto____9295 = tcoll;
    if(and__3822__auto____9295) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____9295
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____9296 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9296) {
        return or__3824__auto____9296
      }else {
        var or__3824__auto____9297 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____9297) {
          return or__3824__auto____9297
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____9298 = tcoll;
    if(and__3822__auto____9298) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____9298
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____9299 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9299) {
        return or__3824__auto____9299
      }else {
        var or__3824__auto____9300 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____9300) {
          return or__3824__auto____9300
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
    var and__3822__auto____9301 = tcoll;
    if(and__3822__auto____9301) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____9301
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____9302 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9302) {
        return or__3824__auto____9302
      }else {
        var or__3824__auto____9303 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____9303) {
          return or__3824__auto____9303
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
    var and__3822__auto____9304 = tcoll;
    if(and__3822__auto____9304) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____9304
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____9305 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9305) {
        return or__3824__auto____9305
      }else {
        var or__3824__auto____9306 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____9306) {
          return or__3824__auto____9306
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
    var and__3822__auto____9307 = tcoll;
    if(and__3822__auto____9307) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____9307
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____9308 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9308) {
        return or__3824__auto____9308
      }else {
        var or__3824__auto____9309 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____9309) {
          return or__3824__auto____9309
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____9310 = tcoll;
    if(and__3822__auto____9310) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____9310
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____9311 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9311) {
        return or__3824__auto____9311
      }else {
        var or__3824__auto____9312 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____9312) {
          return or__3824__auto____9312
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
    var and__3822__auto____9313 = tcoll;
    if(and__3822__auto____9313) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____9313
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____9314 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____9314) {
        return or__3824__auto____9314
      }else {
        var or__3824__auto____9315 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____9315) {
          return or__3824__auto____9315
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
    var or__3824__auto____9316 = x === y;
    if(or__3824__auto____9316) {
      return or__3824__auto____9316
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__9317__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9318 = y;
            var G__9319 = cljs.core.first.call(null, more);
            var G__9320 = cljs.core.next.call(null, more);
            x = G__9318;
            y = G__9319;
            more = G__9320;
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
    var G__9317 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9317__delegate.call(this, x, y, more)
    };
    G__9317.cljs$lang$maxFixedArity = 2;
    G__9317.cljs$lang$applyTo = function(arglist__9321) {
      var x = cljs.core.first(arglist__9321);
      var y = cljs.core.first(cljs.core.next(arglist__9321));
      var more = cljs.core.rest(cljs.core.next(arglist__9321));
      return G__9317__delegate(x, y, more)
    };
    G__9317.cljs$lang$arity$variadic = G__9317__delegate;
    return G__9317
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
    var or__3824__auto____9322 = x == null;
    if(or__3824__auto____9322) {
      return or__3824__auto____9322
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
  var G__9323 = null;
  var G__9323__2 = function(o, k) {
    return null
  };
  var G__9323__3 = function(o, k, not_found) {
    return not_found
  };
  G__9323 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9323__2.call(this, o, k);
      case 3:
        return G__9323__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9323
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
  var G__9324 = null;
  var G__9324__2 = function(_, f) {
    return f.call(null)
  };
  var G__9324__3 = function(_, f, start) {
    return start
  };
  G__9324 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9324__2.call(this, _, f);
      case 3:
        return G__9324__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9324
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
  var G__9325 = null;
  var G__9325__2 = function(_, n) {
    return null
  };
  var G__9325__3 = function(_, n, not_found) {
    return not_found
  };
  G__9325 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9325__2.call(this, _, n);
      case 3:
        return G__9325__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9325
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
      var val__9326 = cljs.core._nth.call(null, cicoll, 0);
      var n__9327 = 1;
      while(true) {
        if(n__9327 < cljs.core._count.call(null, cicoll)) {
          var nval__9328 = f.call(null, val__9326, cljs.core._nth.call(null, cicoll, n__9327));
          if(cljs.core.reduced_QMARK_.call(null, nval__9328)) {
            return cljs.core.deref.call(null, nval__9328)
          }else {
            var G__9335 = nval__9328;
            var G__9336 = n__9327 + 1;
            val__9326 = G__9335;
            n__9327 = G__9336;
            continue
          }
        }else {
          return val__9326
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__9329 = val;
    var n__9330 = 0;
    while(true) {
      if(n__9330 < cljs.core._count.call(null, cicoll)) {
        var nval__9331 = f.call(null, val__9329, cljs.core._nth.call(null, cicoll, n__9330));
        if(cljs.core.reduced_QMARK_.call(null, nval__9331)) {
          return cljs.core.deref.call(null, nval__9331)
        }else {
          var G__9337 = nval__9331;
          var G__9338 = n__9330 + 1;
          val__9329 = G__9337;
          n__9330 = G__9338;
          continue
        }
      }else {
        return val__9329
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__9332 = val;
    var n__9333 = idx;
    while(true) {
      if(n__9333 < cljs.core._count.call(null, cicoll)) {
        var nval__9334 = f.call(null, val__9332, cljs.core._nth.call(null, cicoll, n__9333));
        if(cljs.core.reduced_QMARK_.call(null, nval__9334)) {
          return cljs.core.deref.call(null, nval__9334)
        }else {
          var G__9339 = nval__9334;
          var G__9340 = n__9333 + 1;
          val__9332 = G__9339;
          n__9333 = G__9340;
          continue
        }
      }else {
        return val__9332
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
  var this__9341 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9342 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__9343 = this;
  var this$__9344 = this;
  return cljs.core.pr_str.call(null, this$__9344)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9345 = this;
  if(cljs.core.counted_QMARK_.call(null, this__9345.a)) {
    return cljs.core.ci_reduce.call(null, this__9345.a, f, this__9345.a[this__9345.i], this__9345.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__9345.a[this__9345.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9346 = this;
  if(cljs.core.counted_QMARK_.call(null, this__9346.a)) {
    return cljs.core.ci_reduce.call(null, this__9346.a, f, start, this__9346.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9347 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__9348 = this;
  return this__9348.a.length - this__9348.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__9349 = this;
  return this__9349.a[this__9349.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__9350 = this;
  if(this__9350.i + 1 < this__9350.a.length) {
    return new cljs.core.IndexedSeq(this__9350.a, this__9350.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9351 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9352 = this;
  var i__9353 = n + this__9352.i;
  if(i__9353 < this__9352.a.length) {
    return this__9352.a[i__9353]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9354 = this;
  var i__9355 = n + this__9354.i;
  if(i__9355 < this__9354.a.length) {
    return this__9354.a[i__9355]
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
  var G__9356 = null;
  var G__9356__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__9356__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__9356 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9356__2.call(this, array, f);
      case 3:
        return G__9356__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9356
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__9357 = null;
  var G__9357__2 = function(array, k) {
    return array[k]
  };
  var G__9357__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__9357 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9357__2.call(this, array, k);
      case 3:
        return G__9357__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9357
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__9358 = null;
  var G__9358__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__9358__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__9358 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9358__2.call(this, array, n);
      case 3:
        return G__9358__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9358
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
      var G__9359__9360 = coll;
      if(G__9359__9360 != null) {
        if(function() {
          var or__3824__auto____9361 = G__9359__9360.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____9361) {
            return or__3824__auto____9361
          }else {
            return G__9359__9360.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__9359__9360.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9359__9360)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9359__9360)
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
      var G__9362__9363 = coll;
      if(G__9362__9363 != null) {
        if(function() {
          var or__3824__auto____9364 = G__9362__9363.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9364) {
            return or__3824__auto____9364
          }else {
            return G__9362__9363.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9362__9363.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9362__9363)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9362__9363)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__9365 = cljs.core.seq.call(null, coll);
      if(s__9365 != null) {
        return cljs.core._first.call(null, s__9365)
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
      var G__9366__9367 = coll;
      if(G__9366__9367 != null) {
        if(function() {
          var or__3824__auto____9368 = G__9366__9367.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9368) {
            return or__3824__auto____9368
          }else {
            return G__9366__9367.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9366__9367.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9366__9367)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9366__9367)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__9369 = cljs.core.seq.call(null, coll);
      if(s__9369 != null) {
        return cljs.core._rest.call(null, s__9369)
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
      var G__9370__9371 = coll;
      if(G__9370__9371 != null) {
        if(function() {
          var or__3824__auto____9372 = G__9370__9371.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9372) {
            return or__3824__auto____9372
          }else {
            return G__9370__9371.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9370__9371.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9370__9371)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9370__9371)
      }
    }()) {
      var coll__9373 = cljs.core._rest.call(null, coll);
      if(coll__9373 != null) {
        if(function() {
          var G__9374__9375 = coll__9373;
          if(G__9374__9375 != null) {
            if(function() {
              var or__3824__auto____9376 = G__9374__9375.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____9376) {
                return or__3824__auto____9376
              }else {
                return G__9374__9375.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__9374__9375.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9374__9375)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9374__9375)
          }
        }()) {
          return coll__9373
        }else {
          return cljs.core._seq.call(null, coll__9373)
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
      var G__9377 = cljs.core.next.call(null, s);
      s = G__9377;
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
    var G__9378__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__9379 = conj.call(null, coll, x);
          var G__9380 = cljs.core.first.call(null, xs);
          var G__9381 = cljs.core.next.call(null, xs);
          coll = G__9379;
          x = G__9380;
          xs = G__9381;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__9378 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9378__delegate.call(this, coll, x, xs)
    };
    G__9378.cljs$lang$maxFixedArity = 2;
    G__9378.cljs$lang$applyTo = function(arglist__9382) {
      var coll = cljs.core.first(arglist__9382);
      var x = cljs.core.first(cljs.core.next(arglist__9382));
      var xs = cljs.core.rest(cljs.core.next(arglist__9382));
      return G__9378__delegate(coll, x, xs)
    };
    G__9378.cljs$lang$arity$variadic = G__9378__delegate;
    return G__9378
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
  var s__9383 = cljs.core.seq.call(null, coll);
  var acc__9384 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__9383)) {
      return acc__9384 + cljs.core._count.call(null, s__9383)
    }else {
      var G__9385 = cljs.core.next.call(null, s__9383);
      var G__9386 = acc__9384 + 1;
      s__9383 = G__9385;
      acc__9384 = G__9386;
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
        var G__9387__9388 = coll;
        if(G__9387__9388 != null) {
          if(function() {
            var or__3824__auto____9389 = G__9387__9388.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____9389) {
              return or__3824__auto____9389
            }else {
              return G__9387__9388.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9387__9388.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9387__9388)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9387__9388)
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
        var G__9390__9391 = coll;
        if(G__9390__9391 != null) {
          if(function() {
            var or__3824__auto____9392 = G__9390__9391.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____9392) {
              return or__3824__auto____9392
            }else {
              return G__9390__9391.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9390__9391.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9390__9391)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9390__9391)
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
    var G__9394__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__9393 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__9395 = ret__9393;
          var G__9396 = cljs.core.first.call(null, kvs);
          var G__9397 = cljs.core.second.call(null, kvs);
          var G__9398 = cljs.core.nnext.call(null, kvs);
          coll = G__9395;
          k = G__9396;
          v = G__9397;
          kvs = G__9398;
          continue
        }else {
          return ret__9393
        }
        break
      }
    };
    var G__9394 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9394__delegate.call(this, coll, k, v, kvs)
    };
    G__9394.cljs$lang$maxFixedArity = 3;
    G__9394.cljs$lang$applyTo = function(arglist__9399) {
      var coll = cljs.core.first(arglist__9399);
      var k = cljs.core.first(cljs.core.next(arglist__9399));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9399)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9399)));
      return G__9394__delegate(coll, k, v, kvs)
    };
    G__9394.cljs$lang$arity$variadic = G__9394__delegate;
    return G__9394
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
    var G__9401__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9400 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9402 = ret__9400;
          var G__9403 = cljs.core.first.call(null, ks);
          var G__9404 = cljs.core.next.call(null, ks);
          coll = G__9402;
          k = G__9403;
          ks = G__9404;
          continue
        }else {
          return ret__9400
        }
        break
      }
    };
    var G__9401 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9401__delegate.call(this, coll, k, ks)
    };
    G__9401.cljs$lang$maxFixedArity = 2;
    G__9401.cljs$lang$applyTo = function(arglist__9405) {
      var coll = cljs.core.first(arglist__9405);
      var k = cljs.core.first(cljs.core.next(arglist__9405));
      var ks = cljs.core.rest(cljs.core.next(arglist__9405));
      return G__9401__delegate(coll, k, ks)
    };
    G__9401.cljs$lang$arity$variadic = G__9401__delegate;
    return G__9401
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
    var G__9406__9407 = o;
    if(G__9406__9407 != null) {
      if(function() {
        var or__3824__auto____9408 = G__9406__9407.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____9408) {
          return or__3824__auto____9408
        }else {
          return G__9406__9407.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__9406__9407.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9406__9407)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9406__9407)
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
    var G__9410__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9409 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9411 = ret__9409;
          var G__9412 = cljs.core.first.call(null, ks);
          var G__9413 = cljs.core.next.call(null, ks);
          coll = G__9411;
          k = G__9412;
          ks = G__9413;
          continue
        }else {
          return ret__9409
        }
        break
      }
    };
    var G__9410 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9410__delegate.call(this, coll, k, ks)
    };
    G__9410.cljs$lang$maxFixedArity = 2;
    G__9410.cljs$lang$applyTo = function(arglist__9414) {
      var coll = cljs.core.first(arglist__9414);
      var k = cljs.core.first(cljs.core.next(arglist__9414));
      var ks = cljs.core.rest(cljs.core.next(arglist__9414));
      return G__9410__delegate(coll, k, ks)
    };
    G__9410.cljs$lang$arity$variadic = G__9410__delegate;
    return G__9410
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
    var G__9415__9416 = x;
    if(G__9415__9416 != null) {
      if(function() {
        var or__3824__auto____9417 = G__9415__9416.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____9417) {
          return or__3824__auto____9417
        }else {
          return G__9415__9416.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__9415__9416.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9415__9416)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9415__9416)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9418__9419 = x;
    if(G__9418__9419 != null) {
      if(function() {
        var or__3824__auto____9420 = G__9418__9419.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____9420) {
          return or__3824__auto____9420
        }else {
          return G__9418__9419.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__9418__9419.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9418__9419)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9418__9419)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__9421__9422 = x;
  if(G__9421__9422 != null) {
    if(function() {
      var or__3824__auto____9423 = G__9421__9422.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____9423) {
        return or__3824__auto____9423
      }else {
        return G__9421__9422.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__9421__9422.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9421__9422)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9421__9422)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__9424__9425 = x;
  if(G__9424__9425 != null) {
    if(function() {
      var or__3824__auto____9426 = G__9424__9425.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____9426) {
        return or__3824__auto____9426
      }else {
        return G__9424__9425.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__9424__9425.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9424__9425)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9424__9425)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__9427__9428 = x;
  if(G__9427__9428 != null) {
    if(function() {
      var or__3824__auto____9429 = G__9427__9428.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____9429) {
        return or__3824__auto____9429
      }else {
        return G__9427__9428.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__9427__9428.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9427__9428)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9427__9428)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__9430__9431 = x;
  if(G__9430__9431 != null) {
    if(function() {
      var or__3824__auto____9432 = G__9430__9431.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____9432) {
        return or__3824__auto____9432
      }else {
        return G__9430__9431.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__9430__9431.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9430__9431)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9430__9431)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__9433__9434 = x;
  if(G__9433__9434 != null) {
    if(function() {
      var or__3824__auto____9435 = G__9433__9434.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____9435) {
        return or__3824__auto____9435
      }else {
        return G__9433__9434.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__9433__9434.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9433__9434)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9433__9434)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9436__9437 = x;
    if(G__9436__9437 != null) {
      if(function() {
        var or__3824__auto____9438 = G__9436__9437.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____9438) {
          return or__3824__auto____9438
        }else {
          return G__9436__9437.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__9436__9437.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9436__9437)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9436__9437)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__9439__9440 = x;
  if(G__9439__9440 != null) {
    if(function() {
      var or__3824__auto____9441 = G__9439__9440.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____9441) {
        return or__3824__auto____9441
      }else {
        return G__9439__9440.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__9439__9440.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9439__9440)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9439__9440)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__9442__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__9442 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9442__delegate.call(this, keyvals)
    };
    G__9442.cljs$lang$maxFixedArity = 0;
    G__9442.cljs$lang$applyTo = function(arglist__9443) {
      var keyvals = cljs.core.seq(arglist__9443);
      return G__9442__delegate(keyvals)
    };
    G__9442.cljs$lang$arity$variadic = G__9442__delegate;
    return G__9442
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
  var keys__9444 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__9444.push(key)
  });
  return keys__9444
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__9445 = i;
  var j__9446 = j;
  var len__9447 = len;
  while(true) {
    if(len__9447 === 0) {
      return to
    }else {
      to[j__9446] = from[i__9445];
      var G__9448 = i__9445 + 1;
      var G__9449 = j__9446 + 1;
      var G__9450 = len__9447 - 1;
      i__9445 = G__9448;
      j__9446 = G__9449;
      len__9447 = G__9450;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__9451 = i + (len - 1);
  var j__9452 = j + (len - 1);
  var len__9453 = len;
  while(true) {
    if(len__9453 === 0) {
      return to
    }else {
      to[j__9452] = from[i__9451];
      var G__9454 = i__9451 - 1;
      var G__9455 = j__9452 - 1;
      var G__9456 = len__9453 - 1;
      i__9451 = G__9454;
      j__9452 = G__9455;
      len__9453 = G__9456;
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
    var G__9457__9458 = s;
    if(G__9457__9458 != null) {
      if(function() {
        var or__3824__auto____9459 = G__9457__9458.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____9459) {
          return or__3824__auto____9459
        }else {
          return G__9457__9458.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__9457__9458.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9457__9458)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9457__9458)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__9460__9461 = s;
  if(G__9460__9461 != null) {
    if(function() {
      var or__3824__auto____9462 = G__9460__9461.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____9462) {
        return or__3824__auto____9462
      }else {
        return G__9460__9461.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__9460__9461.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9460__9461)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9460__9461)
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
  var and__3822__auto____9463 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9463)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____9464 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____9464) {
        return or__3824__auto____9464
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____9463
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____9465 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9465)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____9465
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____9466 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____9466)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____9466
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____9467 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____9467) {
    return or__3824__auto____9467
  }else {
    var G__9468__9469 = f;
    if(G__9468__9469 != null) {
      if(function() {
        var or__3824__auto____9470 = G__9468__9469.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____9470) {
          return or__3824__auto____9470
        }else {
          return G__9468__9469.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__9468__9469.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9468__9469)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9468__9469)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____9471 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____9471) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____9471
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
    var and__3822__auto____9472 = coll;
    if(cljs.core.truth_(and__3822__auto____9472)) {
      var and__3822__auto____9473 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____9473) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____9473
      }
    }else {
      return and__3822__auto____9472
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
    var G__9478__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__9474 = cljs.core.set([y, x]);
        var xs__9475 = more;
        while(true) {
          var x__9476 = cljs.core.first.call(null, xs__9475);
          var etc__9477 = cljs.core.next.call(null, xs__9475);
          if(cljs.core.truth_(xs__9475)) {
            if(cljs.core.contains_QMARK_.call(null, s__9474, x__9476)) {
              return false
            }else {
              var G__9479 = cljs.core.conj.call(null, s__9474, x__9476);
              var G__9480 = etc__9477;
              s__9474 = G__9479;
              xs__9475 = G__9480;
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
    var G__9478 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9478__delegate.call(this, x, y, more)
    };
    G__9478.cljs$lang$maxFixedArity = 2;
    G__9478.cljs$lang$applyTo = function(arglist__9481) {
      var x = cljs.core.first(arglist__9481);
      var y = cljs.core.first(cljs.core.next(arglist__9481));
      var more = cljs.core.rest(cljs.core.next(arglist__9481));
      return G__9478__delegate(x, y, more)
    };
    G__9478.cljs$lang$arity$variadic = G__9478__delegate;
    return G__9478
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
      var r__9482 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__9482)) {
        return r__9482
      }else {
        if(cljs.core.truth_(r__9482)) {
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
      var a__9483 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__9483, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__9483)
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
    var temp__3971__auto____9484 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____9484)) {
      var s__9485 = temp__3971__auto____9484;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__9485), cljs.core.next.call(null, s__9485))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__9486 = val;
    var coll__9487 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__9487)) {
        var nval__9488 = f.call(null, val__9486, cljs.core.first.call(null, coll__9487));
        if(cljs.core.reduced_QMARK_.call(null, nval__9488)) {
          return cljs.core.deref.call(null, nval__9488)
        }else {
          var G__9489 = nval__9488;
          var G__9490 = cljs.core.next.call(null, coll__9487);
          val__9486 = G__9489;
          coll__9487 = G__9490;
          continue
        }
      }else {
        return val__9486
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
      var G__9491__9492 = coll;
      if(G__9491__9492 != null) {
        if(function() {
          var or__3824__auto____9493 = G__9491__9492.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____9493) {
            return or__3824__auto____9493
          }else {
            return G__9491__9492.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9491__9492.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9491__9492)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9491__9492)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__9494__9495 = coll;
      if(G__9494__9495 != null) {
        if(function() {
          var or__3824__auto____9496 = G__9494__9495.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____9496) {
            return or__3824__auto____9496
          }else {
            return G__9494__9495.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9494__9495.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9494__9495)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9494__9495)
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
  var this__9497 = this;
  return this__9497.val
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
    var G__9498__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
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
    var G__9500__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__9500 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9500__delegate.call(this, x, y, more)
    };
    G__9500.cljs$lang$maxFixedArity = 2;
    G__9500.cljs$lang$applyTo = function(arglist__9501) {
      var x = cljs.core.first(arglist__9501);
      var y = cljs.core.first(cljs.core.next(arglist__9501));
      var more = cljs.core.rest(cljs.core.next(arglist__9501));
      return G__9500__delegate(x, y, more)
    };
    G__9500.cljs$lang$arity$variadic = G__9500__delegate;
    return G__9500
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
    var G__9502__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__9502 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9502__delegate.call(this, x, y, more)
    };
    G__9502.cljs$lang$maxFixedArity = 2;
    G__9502.cljs$lang$applyTo = function(arglist__9503) {
      var x = cljs.core.first(arglist__9503);
      var y = cljs.core.first(cljs.core.next(arglist__9503));
      var more = cljs.core.rest(cljs.core.next(arglist__9503));
      return G__9502__delegate(x, y, more)
    };
    G__9502.cljs$lang$arity$variadic = G__9502__delegate;
    return G__9502
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
    var G__9504__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__9504 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9504__delegate.call(this, x, y, more)
    };
    G__9504.cljs$lang$maxFixedArity = 2;
    G__9504.cljs$lang$applyTo = function(arglist__9505) {
      var x = cljs.core.first(arglist__9505);
      var y = cljs.core.first(cljs.core.next(arglist__9505));
      var more = cljs.core.rest(cljs.core.next(arglist__9505));
      return G__9504__delegate(x, y, more)
    };
    G__9504.cljs$lang$arity$variadic = G__9504__delegate;
    return G__9504
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
    var G__9506__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9507 = y;
            var G__9508 = cljs.core.first.call(null, more);
            var G__9509 = cljs.core.next.call(null, more);
            x = G__9507;
            y = G__9508;
            more = G__9509;
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
    var G__9506 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9506__delegate.call(this, x, y, more)
    };
    G__9506.cljs$lang$maxFixedArity = 2;
    G__9506.cljs$lang$applyTo = function(arglist__9510) {
      var x = cljs.core.first(arglist__9510);
      var y = cljs.core.first(cljs.core.next(arglist__9510));
      var more = cljs.core.rest(cljs.core.next(arglist__9510));
      return G__9506__delegate(x, y, more)
    };
    G__9506.cljs$lang$arity$variadic = G__9506__delegate;
    return G__9506
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
    var G__9511__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9512 = y;
            var G__9513 = cljs.core.first.call(null, more);
            var G__9514 = cljs.core.next.call(null, more);
            x = G__9512;
            y = G__9513;
            more = G__9514;
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
    var G__9511 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9511__delegate.call(this, x, y, more)
    };
    G__9511.cljs$lang$maxFixedArity = 2;
    G__9511.cljs$lang$applyTo = function(arglist__9515) {
      var x = cljs.core.first(arglist__9515);
      var y = cljs.core.first(cljs.core.next(arglist__9515));
      var more = cljs.core.rest(cljs.core.next(arglist__9515));
      return G__9511__delegate(x, y, more)
    };
    G__9511.cljs$lang$arity$variadic = G__9511__delegate;
    return G__9511
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
    var G__9516__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9517 = y;
            var G__9518 = cljs.core.first.call(null, more);
            var G__9519 = cljs.core.next.call(null, more);
            x = G__9517;
            y = G__9518;
            more = G__9519;
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
    var G__9516 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9516__delegate.call(this, x, y, more)
    };
    G__9516.cljs$lang$maxFixedArity = 2;
    G__9516.cljs$lang$applyTo = function(arglist__9520) {
      var x = cljs.core.first(arglist__9520);
      var y = cljs.core.first(cljs.core.next(arglist__9520));
      var more = cljs.core.rest(cljs.core.next(arglist__9520));
      return G__9516__delegate(x, y, more)
    };
    G__9516.cljs$lang$arity$variadic = G__9516__delegate;
    return G__9516
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
    var G__9521__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9522 = y;
            var G__9523 = cljs.core.first.call(null, more);
            var G__9524 = cljs.core.next.call(null, more);
            x = G__9522;
            y = G__9523;
            more = G__9524;
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
    var G__9521 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9521__delegate.call(this, x, y, more)
    };
    G__9521.cljs$lang$maxFixedArity = 2;
    G__9521.cljs$lang$applyTo = function(arglist__9525) {
      var x = cljs.core.first(arglist__9525);
      var y = cljs.core.first(cljs.core.next(arglist__9525));
      var more = cljs.core.rest(cljs.core.next(arglist__9525));
      return G__9521__delegate(x, y, more)
    };
    G__9521.cljs$lang$arity$variadic = G__9521__delegate;
    return G__9521
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
    var G__9526__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__9526 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9526__delegate.call(this, x, y, more)
    };
    G__9526.cljs$lang$maxFixedArity = 2;
    G__9526.cljs$lang$applyTo = function(arglist__9527) {
      var x = cljs.core.first(arglist__9527);
      var y = cljs.core.first(cljs.core.next(arglist__9527));
      var more = cljs.core.rest(cljs.core.next(arglist__9527));
      return G__9526__delegate(x, y, more)
    };
    G__9526.cljs$lang$arity$variadic = G__9526__delegate;
    return G__9526
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
    var G__9528__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__9528 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9528__delegate.call(this, x, y, more)
    };
    G__9528.cljs$lang$maxFixedArity = 2;
    G__9528.cljs$lang$applyTo = function(arglist__9529) {
      var x = cljs.core.first(arglist__9529);
      var y = cljs.core.first(cljs.core.next(arglist__9529));
      var more = cljs.core.rest(cljs.core.next(arglist__9529));
      return G__9528__delegate(x, y, more)
    };
    G__9528.cljs$lang$arity$variadic = G__9528__delegate;
    return G__9528
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
  var rem__9530 = n % d;
  return cljs.core.fix.call(null, (n - rem__9530) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__9531 = cljs.core.quot.call(null, n, d);
  return n - d * q__9531
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
  var c__9532 = 0;
  var n__9533 = n;
  while(true) {
    if(n__9533 === 0) {
      return c__9532
    }else {
      var G__9534 = c__9532 + 1;
      var G__9535 = n__9533 & n__9533 - 1;
      c__9532 = G__9534;
      n__9533 = G__9535;
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
    var G__9536__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9537 = y;
            var G__9538 = cljs.core.first.call(null, more);
            var G__9539 = cljs.core.next.call(null, more);
            x = G__9537;
            y = G__9538;
            more = G__9539;
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
    var G__9536 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9536__delegate.call(this, x, y, more)
    };
    G__9536.cljs$lang$maxFixedArity = 2;
    G__9536.cljs$lang$applyTo = function(arglist__9540) {
      var x = cljs.core.first(arglist__9540);
      var y = cljs.core.first(cljs.core.next(arglist__9540));
      var more = cljs.core.rest(cljs.core.next(arglist__9540));
      return G__9536__delegate(x, y, more)
    };
    G__9536.cljs$lang$arity$variadic = G__9536__delegate;
    return G__9536
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
  var n__9541 = n;
  var xs__9542 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____9543 = xs__9542;
      if(cljs.core.truth_(and__3822__auto____9543)) {
        return n__9541 > 0
      }else {
        return and__3822__auto____9543
      }
    }())) {
      var G__9544 = n__9541 - 1;
      var G__9545 = cljs.core.next.call(null, xs__9542);
      n__9541 = G__9544;
      xs__9542 = G__9545;
      continue
    }else {
      return xs__9542
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
    var G__9546__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9547 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__9548 = cljs.core.next.call(null, more);
            sb = G__9547;
            more = G__9548;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__9546 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9546__delegate.call(this, x, ys)
    };
    G__9546.cljs$lang$maxFixedArity = 1;
    G__9546.cljs$lang$applyTo = function(arglist__9549) {
      var x = cljs.core.first(arglist__9549);
      var ys = cljs.core.rest(arglist__9549);
      return G__9546__delegate(x, ys)
    };
    G__9546.cljs$lang$arity$variadic = G__9546__delegate;
    return G__9546
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
    var G__9550__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9551 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__9552 = cljs.core.next.call(null, more);
            sb = G__9551;
            more = G__9552;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__9550 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9550__delegate.call(this, x, ys)
    };
    G__9550.cljs$lang$maxFixedArity = 1;
    G__9550.cljs$lang$applyTo = function(arglist__9553) {
      var x = cljs.core.first(arglist__9553);
      var ys = cljs.core.rest(arglist__9553);
      return G__9550__delegate(x, ys)
    };
    G__9550.cljs$lang$arity$variadic = G__9550__delegate;
    return G__9550
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
    var xs__9554 = cljs.core.seq.call(null, x);
    var ys__9555 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__9554 == null) {
        return ys__9555 == null
      }else {
        if(ys__9555 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__9554), cljs.core.first.call(null, ys__9555))) {
            var G__9556 = cljs.core.next.call(null, xs__9554);
            var G__9557 = cljs.core.next.call(null, ys__9555);
            xs__9554 = G__9556;
            ys__9555 = G__9557;
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
  return cljs.core.reduce.call(null, function(p1__9558_SHARP_, p2__9559_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__9558_SHARP_, cljs.core.hash.call(null, p2__9559_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__9560 = 0;
  var s__9561 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__9561)) {
      var e__9562 = cljs.core.first.call(null, s__9561);
      var G__9563 = (h__9560 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__9562)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__9562)))) % 4503599627370496;
      var G__9564 = cljs.core.next.call(null, s__9561);
      h__9560 = G__9563;
      s__9561 = G__9564;
      continue
    }else {
      return h__9560
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__9565 = 0;
  var s__9566 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__9566)) {
      var e__9567 = cljs.core.first.call(null, s__9566);
      var G__9568 = (h__9565 + cljs.core.hash.call(null, e__9567)) % 4503599627370496;
      var G__9569 = cljs.core.next.call(null, s__9566);
      h__9565 = G__9568;
      s__9566 = G__9569;
      continue
    }else {
      return h__9565
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__9570__9571 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__9570__9571)) {
    var G__9573__9575 = cljs.core.first.call(null, G__9570__9571);
    var vec__9574__9576 = G__9573__9575;
    var key_name__9577 = cljs.core.nth.call(null, vec__9574__9576, 0, null);
    var f__9578 = cljs.core.nth.call(null, vec__9574__9576, 1, null);
    var G__9570__9579 = G__9570__9571;
    var G__9573__9580 = G__9573__9575;
    var G__9570__9581 = G__9570__9579;
    while(true) {
      var vec__9582__9583 = G__9573__9580;
      var key_name__9584 = cljs.core.nth.call(null, vec__9582__9583, 0, null);
      var f__9585 = cljs.core.nth.call(null, vec__9582__9583, 1, null);
      var G__9570__9586 = G__9570__9581;
      var str_name__9587 = cljs.core.name.call(null, key_name__9584);
      obj[str_name__9587] = f__9585;
      var temp__3974__auto____9588 = cljs.core.next.call(null, G__9570__9586);
      if(cljs.core.truth_(temp__3974__auto____9588)) {
        var G__9570__9589 = temp__3974__auto____9588;
        var G__9590 = cljs.core.first.call(null, G__9570__9589);
        var G__9591 = G__9570__9589;
        G__9573__9580 = G__9590;
        G__9570__9581 = G__9591;
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
  var this__9592 = this;
  var h__364__auto____9593 = this__9592.__hash;
  if(h__364__auto____9593 != null) {
    return h__364__auto____9593
  }else {
    var h__364__auto____9594 = cljs.core.hash_coll.call(null, coll);
    this__9592.__hash = h__364__auto____9594;
    return h__364__auto____9594
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9595 = this;
  return new cljs.core.List(this__9595.meta, o, coll, this__9595.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__9596 = this;
  var this$__9597 = this;
  return cljs.core.pr_str.call(null, this$__9597)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9598 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9599 = this;
  return this__9599.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9600 = this;
  return this__9600.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9601 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9602 = this;
  return this__9602.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9603 = this;
  return this__9603.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9604 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9605 = this;
  return new cljs.core.List(meta, this__9605.first, this__9605.rest, this__9605.count, this__9605.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9606 = this;
  return this__9606.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9607 = this;
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
  var this__9608 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9609 = this;
  return new cljs.core.List(this__9609.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__9610 = this;
  var this$__9611 = this;
  return cljs.core.pr_str.call(null, this$__9611)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9612 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9613 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9614 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9615 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9616 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9617 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9618 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9619 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9620 = this;
  return this__9620.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9621 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__9622__9623 = coll;
  if(G__9622__9623 != null) {
    if(function() {
      var or__3824__auto____9624 = G__9622__9623.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____9624) {
        return or__3824__auto____9624
      }else {
        return G__9622__9623.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__9622__9623.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9622__9623)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9622__9623)
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
  list.cljs$lang$applyTo = function(arglist__9625) {
    var items = cljs.core.seq(arglist__9625);
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
  var this__9626 = this;
  var h__364__auto____9627 = this__9626.__hash;
  if(h__364__auto____9627 != null) {
    return h__364__auto____9627
  }else {
    var h__364__auto____9628 = cljs.core.hash_coll.call(null, coll);
    this__9626.__hash = h__364__auto____9628;
    return h__364__auto____9628
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9629 = this;
  return new cljs.core.Cons(null, o, coll, this__9629.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__9630 = this;
  var this$__9631 = this;
  return cljs.core.pr_str.call(null, this$__9631)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9632 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9633 = this;
  return this__9633.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9634 = this;
  if(this__9634.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9634.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9635 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9636 = this;
  return new cljs.core.Cons(meta, this__9636.first, this__9636.rest, this__9636.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9637 = this;
  return this__9637.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9638 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9638.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____9639 = coll == null;
    if(or__3824__auto____9639) {
      return or__3824__auto____9639
    }else {
      var G__9640__9641 = coll;
      if(G__9640__9641 != null) {
        if(function() {
          var or__3824__auto____9642 = G__9640__9641.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____9642) {
            return or__3824__auto____9642
          }else {
            return G__9640__9641.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9640__9641.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9640__9641)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9640__9641)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__9643__9644 = x;
  if(G__9643__9644 != null) {
    if(function() {
      var or__3824__auto____9645 = G__9643__9644.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____9645) {
        return or__3824__auto____9645
      }else {
        return G__9643__9644.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__9643__9644.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9643__9644)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9643__9644)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9646 = null;
  var G__9646__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9646__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9646 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9646__2.call(this, string, f);
      case 3:
        return G__9646__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9646
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9647 = null;
  var G__9647__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9647__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9647 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9647__2.call(this, string, k);
      case 3:
        return G__9647__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9647
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9648 = null;
  var G__9648__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9648__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9648 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9648__2.call(this, string, n);
      case 3:
        return G__9648__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9648
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
  var G__9657 = null;
  var G__9657__2 = function(tsym9651, coll) {
    var tsym9651__9653 = this;
    var this$__9654 = tsym9651__9653;
    return cljs.core.get.call(null, coll, this$__9654.toString())
  };
  var G__9657__3 = function(tsym9652, coll, not_found) {
    var tsym9652__9655 = this;
    var this$__9656 = tsym9652__9655;
    return cljs.core.get.call(null, coll, this$__9656.toString(), not_found)
  };
  G__9657 = function(tsym9652, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9657__2.call(this, tsym9652, coll);
      case 3:
        return G__9657__3.call(this, tsym9652, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9657
}();
String.prototype.apply = function(tsym9649, args9650) {
  return tsym9649.call.apply(tsym9649, [tsym9649].concat(cljs.core.aclone.call(null, args9650)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9658 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__9658
  }else {
    lazy_seq.x = x__9658.call(null);
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
  var this__9659 = this;
  var h__364__auto____9660 = this__9659.__hash;
  if(h__364__auto____9660 != null) {
    return h__364__auto____9660
  }else {
    var h__364__auto____9661 = cljs.core.hash_coll.call(null, coll);
    this__9659.__hash = h__364__auto____9661;
    return h__364__auto____9661
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9662 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__9663 = this;
  var this$__9664 = this;
  return cljs.core.pr_str.call(null, this$__9664)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9665 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9666 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9667 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9668 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9669 = this;
  return new cljs.core.LazySeq(meta, this__9669.realized, this__9669.x, this__9669.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9670 = this;
  return this__9670.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9671 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9671.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__9672 = [];
  var s__9673 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__9673))) {
      ary__9672.push(cljs.core.first.call(null, s__9673));
      var G__9674 = cljs.core.next.call(null, s__9673);
      s__9673 = G__9674;
      continue
    }else {
      return ary__9672
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__9675 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__9676 = 0;
  var xs__9677 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__9677)) {
      ret__9675[i__9676] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__9677));
      var G__9678 = i__9676 + 1;
      var G__9679 = cljs.core.next.call(null, xs__9677);
      i__9676 = G__9678;
      xs__9677 = G__9679;
      continue
    }else {
    }
    break
  }
  return ret__9675
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
    var a__9680 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9681 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9682 = 0;
      var s__9683 = s__9681;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9684 = s__9683;
          if(cljs.core.truth_(and__3822__auto____9684)) {
            return i__9682 < size
          }else {
            return and__3822__auto____9684
          }
        }())) {
          a__9680[i__9682] = cljs.core.first.call(null, s__9683);
          var G__9687 = i__9682 + 1;
          var G__9688 = cljs.core.next.call(null, s__9683);
          i__9682 = G__9687;
          s__9683 = G__9688;
          continue
        }else {
          return a__9680
        }
        break
      }
    }else {
      var n__685__auto____9685 = size;
      var i__9686 = 0;
      while(true) {
        if(i__9686 < n__685__auto____9685) {
          a__9680[i__9686] = init_val_or_seq;
          var G__9689 = i__9686 + 1;
          i__9686 = G__9689;
          continue
        }else {
        }
        break
      }
      return a__9680
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
    var a__9690 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9691 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9692 = 0;
      var s__9693 = s__9691;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9694 = s__9693;
          if(cljs.core.truth_(and__3822__auto____9694)) {
            return i__9692 < size
          }else {
            return and__3822__auto____9694
          }
        }())) {
          a__9690[i__9692] = cljs.core.first.call(null, s__9693);
          var G__9697 = i__9692 + 1;
          var G__9698 = cljs.core.next.call(null, s__9693);
          i__9692 = G__9697;
          s__9693 = G__9698;
          continue
        }else {
          return a__9690
        }
        break
      }
    }else {
      var n__685__auto____9695 = size;
      var i__9696 = 0;
      while(true) {
        if(i__9696 < n__685__auto____9695) {
          a__9690[i__9696] = init_val_or_seq;
          var G__9699 = i__9696 + 1;
          i__9696 = G__9699;
          continue
        }else {
        }
        break
      }
      return a__9690
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
    var a__9700 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9701 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9702 = 0;
      var s__9703 = s__9701;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9704 = s__9703;
          if(cljs.core.truth_(and__3822__auto____9704)) {
            return i__9702 < size
          }else {
            return and__3822__auto____9704
          }
        }())) {
          a__9700[i__9702] = cljs.core.first.call(null, s__9703);
          var G__9707 = i__9702 + 1;
          var G__9708 = cljs.core.next.call(null, s__9703);
          i__9702 = G__9707;
          s__9703 = G__9708;
          continue
        }else {
          return a__9700
        }
        break
      }
    }else {
      var n__685__auto____9705 = size;
      var i__9706 = 0;
      while(true) {
        if(i__9706 < n__685__auto____9705) {
          a__9700[i__9706] = init_val_or_seq;
          var G__9709 = i__9706 + 1;
          i__9706 = G__9709;
          continue
        }else {
        }
        break
      }
      return a__9700
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
    var s__9710 = s;
    var i__9711 = n;
    var sum__9712 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9713 = i__9711 > 0;
        if(and__3822__auto____9713) {
          return cljs.core.seq.call(null, s__9710)
        }else {
          return and__3822__auto____9713
        }
      }())) {
        var G__9714 = cljs.core.next.call(null, s__9710);
        var G__9715 = i__9711 - 1;
        var G__9716 = sum__9712 + 1;
        s__9710 = G__9714;
        i__9711 = G__9715;
        sum__9712 = G__9716;
        continue
      }else {
        return sum__9712
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
      var s__9717 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__9717)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9717), concat.call(null, cljs.core.rest.call(null, s__9717), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__9720__delegate = function(x, y, zs) {
      var cat__9719 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9718 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__9718)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9718), cat.call(null, cljs.core.rest.call(null, xys__9718), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__9719.call(null, concat.call(null, x, y), zs)
    };
    var G__9720 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9720__delegate.call(this, x, y, zs)
    };
    G__9720.cljs$lang$maxFixedArity = 2;
    G__9720.cljs$lang$applyTo = function(arglist__9721) {
      var x = cljs.core.first(arglist__9721);
      var y = cljs.core.first(cljs.core.next(arglist__9721));
      var zs = cljs.core.rest(cljs.core.next(arglist__9721));
      return G__9720__delegate(x, y, zs)
    };
    G__9720.cljs$lang$arity$variadic = G__9720__delegate;
    return G__9720
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
    var G__9722__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9722 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9722__delegate.call(this, a, b, c, d, more)
    };
    G__9722.cljs$lang$maxFixedArity = 4;
    G__9722.cljs$lang$applyTo = function(arglist__9723) {
      var a = cljs.core.first(arglist__9723);
      var b = cljs.core.first(cljs.core.next(arglist__9723));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9723)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9723))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9723))));
      return G__9722__delegate(a, b, c, d, more)
    };
    G__9722.cljs$lang$arity$variadic = G__9722__delegate;
    return G__9722
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
  var args__9724 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__9725 = cljs.core._first.call(null, args__9724);
    var args__9726 = cljs.core._rest.call(null, args__9724);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__9725)
      }else {
        return f.call(null, a__9725)
      }
    }else {
      var b__9727 = cljs.core._first.call(null, args__9726);
      var args__9728 = cljs.core._rest.call(null, args__9726);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__9725, b__9727)
        }else {
          return f.call(null, a__9725, b__9727)
        }
      }else {
        var c__9729 = cljs.core._first.call(null, args__9728);
        var args__9730 = cljs.core._rest.call(null, args__9728);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__9725, b__9727, c__9729)
          }else {
            return f.call(null, a__9725, b__9727, c__9729)
          }
        }else {
          var d__9731 = cljs.core._first.call(null, args__9730);
          var args__9732 = cljs.core._rest.call(null, args__9730);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__9725, b__9727, c__9729, d__9731)
            }else {
              return f.call(null, a__9725, b__9727, c__9729, d__9731)
            }
          }else {
            var e__9733 = cljs.core._first.call(null, args__9732);
            var args__9734 = cljs.core._rest.call(null, args__9732);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__9725, b__9727, c__9729, d__9731, e__9733)
              }else {
                return f.call(null, a__9725, b__9727, c__9729, d__9731, e__9733)
              }
            }else {
              var f__9735 = cljs.core._first.call(null, args__9734);
              var args__9736 = cljs.core._rest.call(null, args__9734);
              if(argc === 6) {
                if(f__9735.cljs$lang$arity$6) {
                  return f__9735.cljs$lang$arity$6(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735)
                }else {
                  return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735)
                }
              }else {
                var g__9737 = cljs.core._first.call(null, args__9736);
                var args__9738 = cljs.core._rest.call(null, args__9736);
                if(argc === 7) {
                  if(f__9735.cljs$lang$arity$7) {
                    return f__9735.cljs$lang$arity$7(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737)
                  }else {
                    return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737)
                  }
                }else {
                  var h__9739 = cljs.core._first.call(null, args__9738);
                  var args__9740 = cljs.core._rest.call(null, args__9738);
                  if(argc === 8) {
                    if(f__9735.cljs$lang$arity$8) {
                      return f__9735.cljs$lang$arity$8(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739)
                    }else {
                      return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739)
                    }
                  }else {
                    var i__9741 = cljs.core._first.call(null, args__9740);
                    var args__9742 = cljs.core._rest.call(null, args__9740);
                    if(argc === 9) {
                      if(f__9735.cljs$lang$arity$9) {
                        return f__9735.cljs$lang$arity$9(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741)
                      }else {
                        return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741)
                      }
                    }else {
                      var j__9743 = cljs.core._first.call(null, args__9742);
                      var args__9744 = cljs.core._rest.call(null, args__9742);
                      if(argc === 10) {
                        if(f__9735.cljs$lang$arity$10) {
                          return f__9735.cljs$lang$arity$10(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743)
                        }else {
                          return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743)
                        }
                      }else {
                        var k__9745 = cljs.core._first.call(null, args__9744);
                        var args__9746 = cljs.core._rest.call(null, args__9744);
                        if(argc === 11) {
                          if(f__9735.cljs$lang$arity$11) {
                            return f__9735.cljs$lang$arity$11(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745)
                          }else {
                            return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745)
                          }
                        }else {
                          var l__9747 = cljs.core._first.call(null, args__9746);
                          var args__9748 = cljs.core._rest.call(null, args__9746);
                          if(argc === 12) {
                            if(f__9735.cljs$lang$arity$12) {
                              return f__9735.cljs$lang$arity$12(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747)
                            }else {
                              return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747)
                            }
                          }else {
                            var m__9749 = cljs.core._first.call(null, args__9748);
                            var args__9750 = cljs.core._rest.call(null, args__9748);
                            if(argc === 13) {
                              if(f__9735.cljs$lang$arity$13) {
                                return f__9735.cljs$lang$arity$13(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749)
                              }else {
                                return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749)
                              }
                            }else {
                              var n__9751 = cljs.core._first.call(null, args__9750);
                              var args__9752 = cljs.core._rest.call(null, args__9750);
                              if(argc === 14) {
                                if(f__9735.cljs$lang$arity$14) {
                                  return f__9735.cljs$lang$arity$14(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751)
                                }else {
                                  return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751)
                                }
                              }else {
                                var o__9753 = cljs.core._first.call(null, args__9752);
                                var args__9754 = cljs.core._rest.call(null, args__9752);
                                if(argc === 15) {
                                  if(f__9735.cljs$lang$arity$15) {
                                    return f__9735.cljs$lang$arity$15(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753)
                                  }else {
                                    return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753)
                                  }
                                }else {
                                  var p__9755 = cljs.core._first.call(null, args__9754);
                                  var args__9756 = cljs.core._rest.call(null, args__9754);
                                  if(argc === 16) {
                                    if(f__9735.cljs$lang$arity$16) {
                                      return f__9735.cljs$lang$arity$16(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755)
                                    }else {
                                      return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755)
                                    }
                                  }else {
                                    var q__9757 = cljs.core._first.call(null, args__9756);
                                    var args__9758 = cljs.core._rest.call(null, args__9756);
                                    if(argc === 17) {
                                      if(f__9735.cljs$lang$arity$17) {
                                        return f__9735.cljs$lang$arity$17(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757)
                                      }else {
                                        return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757)
                                      }
                                    }else {
                                      var r__9759 = cljs.core._first.call(null, args__9758);
                                      var args__9760 = cljs.core._rest.call(null, args__9758);
                                      if(argc === 18) {
                                        if(f__9735.cljs$lang$arity$18) {
                                          return f__9735.cljs$lang$arity$18(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759)
                                        }else {
                                          return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759)
                                        }
                                      }else {
                                        var s__9761 = cljs.core._first.call(null, args__9760);
                                        var args__9762 = cljs.core._rest.call(null, args__9760);
                                        if(argc === 19) {
                                          if(f__9735.cljs$lang$arity$19) {
                                            return f__9735.cljs$lang$arity$19(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759, s__9761)
                                          }else {
                                            return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759, s__9761)
                                          }
                                        }else {
                                          var t__9763 = cljs.core._first.call(null, args__9762);
                                          var args__9764 = cljs.core._rest.call(null, args__9762);
                                          if(argc === 20) {
                                            if(f__9735.cljs$lang$arity$20) {
                                              return f__9735.cljs$lang$arity$20(a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759, s__9761, t__9763)
                                            }else {
                                              return f__9735.call(null, a__9725, b__9727, c__9729, d__9731, e__9733, f__9735, g__9737, h__9739, i__9741, j__9743, k__9745, l__9747, m__9749, n__9751, o__9753, p__9755, q__9757, r__9759, s__9761, t__9763)
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
    var fixed_arity__9765 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9766 = cljs.core.bounded_count.call(null, args, fixed_arity__9765 + 1);
      if(bc__9766 <= fixed_arity__9765) {
        return cljs.core.apply_to.call(null, f, bc__9766, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__9767 = cljs.core.list_STAR_.call(null, x, args);
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
  var apply__4 = function(f, x, y, args) {
    var arglist__9770 = cljs.core.list_STAR_.call(null, x, y, args);
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
  var apply__5 = function(f, x, y, z, args) {
    var arglist__9773 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9774 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9775 = cljs.core.bounded_count.call(null, arglist__9773, fixed_arity__9774 + 1);
      if(bc__9775 <= fixed_arity__9774) {
        return cljs.core.apply_to.call(null, f, bc__9775, arglist__9773)
      }else {
        return f.cljs$lang$applyTo(arglist__9773)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9773))
    }
  };
  var apply__6 = function() {
    var G__9779__delegate = function(f, a, b, c, d, args) {
      var arglist__9776 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9777 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__9778 = cljs.core.bounded_count.call(null, arglist__9776, fixed_arity__9777 + 1);
        if(bc__9778 <= fixed_arity__9777) {
          return cljs.core.apply_to.call(null, f, bc__9778, arglist__9776)
        }else {
          return f.cljs$lang$applyTo(arglist__9776)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9776))
      }
    };
    var G__9779 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9779__delegate.call(this, f, a, b, c, d, args)
    };
    G__9779.cljs$lang$maxFixedArity = 5;
    G__9779.cljs$lang$applyTo = function(arglist__9780) {
      var f = cljs.core.first(arglist__9780);
      var a = cljs.core.first(cljs.core.next(arglist__9780));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9780)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9780))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9780)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9780)))));
      return G__9779__delegate(f, a, b, c, d, args)
    };
    G__9779.cljs$lang$arity$variadic = G__9779__delegate;
    return G__9779
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
  vary_meta.cljs$lang$applyTo = function(arglist__9781) {
    var obj = cljs.core.first(arglist__9781);
    var f = cljs.core.first(cljs.core.next(arglist__9781));
    var args = cljs.core.rest(cljs.core.next(arglist__9781));
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
    var G__9782__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9782 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9782__delegate.call(this, x, y, more)
    };
    G__9782.cljs$lang$maxFixedArity = 2;
    G__9782.cljs$lang$applyTo = function(arglist__9783) {
      var x = cljs.core.first(arglist__9783);
      var y = cljs.core.first(cljs.core.next(arglist__9783));
      var more = cljs.core.rest(cljs.core.next(arglist__9783));
      return G__9782__delegate(x, y, more)
    };
    G__9782.cljs$lang$arity$variadic = G__9782__delegate;
    return G__9782
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
        var G__9784 = pred;
        var G__9785 = cljs.core.next.call(null, coll);
        pred = G__9784;
        coll = G__9785;
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
      var or__3824__auto____9786 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____9786)) {
        return or__3824__auto____9786
      }else {
        var G__9787 = pred;
        var G__9788 = cljs.core.next.call(null, coll);
        pred = G__9787;
        coll = G__9788;
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
    var G__9789 = null;
    var G__9789__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9789__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9789__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9789__3 = function() {
      var G__9790__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9790 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9790__delegate.call(this, x, y, zs)
      };
      G__9790.cljs$lang$maxFixedArity = 2;
      G__9790.cljs$lang$applyTo = function(arglist__9791) {
        var x = cljs.core.first(arglist__9791);
        var y = cljs.core.first(cljs.core.next(arglist__9791));
        var zs = cljs.core.rest(cljs.core.next(arglist__9791));
        return G__9790__delegate(x, y, zs)
      };
      G__9790.cljs$lang$arity$variadic = G__9790__delegate;
      return G__9790
    }();
    G__9789 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9789__0.call(this);
        case 1:
          return G__9789__1.call(this, x);
        case 2:
          return G__9789__2.call(this, x, y);
        default:
          return G__9789__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9789.cljs$lang$maxFixedArity = 2;
    G__9789.cljs$lang$applyTo = G__9789__3.cljs$lang$applyTo;
    return G__9789
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9792__delegate = function(args) {
      return x
    };
    var G__9792 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9792__delegate.call(this, args)
    };
    G__9792.cljs$lang$maxFixedArity = 0;
    G__9792.cljs$lang$applyTo = function(arglist__9793) {
      var args = cljs.core.seq(arglist__9793);
      return G__9792__delegate(args)
    };
    G__9792.cljs$lang$arity$variadic = G__9792__delegate;
    return G__9792
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
      var G__9797 = null;
      var G__9797__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__9797__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9797__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9797__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9797__4 = function() {
        var G__9798__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9798 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9798__delegate.call(this, x, y, z, args)
        };
        G__9798.cljs$lang$maxFixedArity = 3;
        G__9798.cljs$lang$applyTo = function(arglist__9799) {
          var x = cljs.core.first(arglist__9799);
          var y = cljs.core.first(cljs.core.next(arglist__9799));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9799)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9799)));
          return G__9798__delegate(x, y, z, args)
        };
        G__9798.cljs$lang$arity$variadic = G__9798__delegate;
        return G__9798
      }();
      G__9797 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9797__0.call(this);
          case 1:
            return G__9797__1.call(this, x);
          case 2:
            return G__9797__2.call(this, x, y);
          case 3:
            return G__9797__3.call(this, x, y, z);
          default:
            return G__9797__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9797.cljs$lang$maxFixedArity = 3;
      G__9797.cljs$lang$applyTo = G__9797__4.cljs$lang$applyTo;
      return G__9797
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__9800 = null;
      var G__9800__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9800__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9800__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9800__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9800__4 = function() {
        var G__9801__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9801 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9801__delegate.call(this, x, y, z, args)
        };
        G__9801.cljs$lang$maxFixedArity = 3;
        G__9801.cljs$lang$applyTo = function(arglist__9802) {
          var x = cljs.core.first(arglist__9802);
          var y = cljs.core.first(cljs.core.next(arglist__9802));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9802)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9802)));
          return G__9801__delegate(x, y, z, args)
        };
        G__9801.cljs$lang$arity$variadic = G__9801__delegate;
        return G__9801
      }();
      G__9800 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9800__0.call(this);
          case 1:
            return G__9800__1.call(this, x);
          case 2:
            return G__9800__2.call(this, x, y);
          case 3:
            return G__9800__3.call(this, x, y, z);
          default:
            return G__9800__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9800.cljs$lang$maxFixedArity = 3;
      G__9800.cljs$lang$applyTo = G__9800__4.cljs$lang$applyTo;
      return G__9800
    }()
  };
  var comp__4 = function() {
    var G__9803__delegate = function(f1, f2, f3, fs) {
      var fs__9794 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9804__delegate = function(args) {
          var ret__9795 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9794), args);
          var fs__9796 = cljs.core.next.call(null, fs__9794);
          while(true) {
            if(cljs.core.truth_(fs__9796)) {
              var G__9805 = cljs.core.first.call(null, fs__9796).call(null, ret__9795);
              var G__9806 = cljs.core.next.call(null, fs__9796);
              ret__9795 = G__9805;
              fs__9796 = G__9806;
              continue
            }else {
              return ret__9795
            }
            break
          }
        };
        var G__9804 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9804__delegate.call(this, args)
        };
        G__9804.cljs$lang$maxFixedArity = 0;
        G__9804.cljs$lang$applyTo = function(arglist__9807) {
          var args = cljs.core.seq(arglist__9807);
          return G__9804__delegate(args)
        };
        G__9804.cljs$lang$arity$variadic = G__9804__delegate;
        return G__9804
      }()
    };
    var G__9803 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9803__delegate.call(this, f1, f2, f3, fs)
    };
    G__9803.cljs$lang$maxFixedArity = 3;
    G__9803.cljs$lang$applyTo = function(arglist__9808) {
      var f1 = cljs.core.first(arglist__9808);
      var f2 = cljs.core.first(cljs.core.next(arglist__9808));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9808)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9808)));
      return G__9803__delegate(f1, f2, f3, fs)
    };
    G__9803.cljs$lang$arity$variadic = G__9803__delegate;
    return G__9803
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
      var G__9809__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9809 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9809__delegate.call(this, args)
      };
      G__9809.cljs$lang$maxFixedArity = 0;
      G__9809.cljs$lang$applyTo = function(arglist__9810) {
        var args = cljs.core.seq(arglist__9810);
        return G__9809__delegate(args)
      };
      G__9809.cljs$lang$arity$variadic = G__9809__delegate;
      return G__9809
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__9811__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9811 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9811__delegate.call(this, args)
      };
      G__9811.cljs$lang$maxFixedArity = 0;
      G__9811.cljs$lang$applyTo = function(arglist__9812) {
        var args = cljs.core.seq(arglist__9812);
        return G__9811__delegate(args)
      };
      G__9811.cljs$lang$arity$variadic = G__9811__delegate;
      return G__9811
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9813__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9813 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9813__delegate.call(this, args)
      };
      G__9813.cljs$lang$maxFixedArity = 0;
      G__9813.cljs$lang$applyTo = function(arglist__9814) {
        var args = cljs.core.seq(arglist__9814);
        return G__9813__delegate(args)
      };
      G__9813.cljs$lang$arity$variadic = G__9813__delegate;
      return G__9813
    }()
  };
  var partial__5 = function() {
    var G__9815__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9816__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9816 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9816__delegate.call(this, args)
        };
        G__9816.cljs$lang$maxFixedArity = 0;
        G__9816.cljs$lang$applyTo = function(arglist__9817) {
          var args = cljs.core.seq(arglist__9817);
          return G__9816__delegate(args)
        };
        G__9816.cljs$lang$arity$variadic = G__9816__delegate;
        return G__9816
      }()
    };
    var G__9815 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9815__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9815.cljs$lang$maxFixedArity = 4;
    G__9815.cljs$lang$applyTo = function(arglist__9818) {
      var f = cljs.core.first(arglist__9818);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9818));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9818)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9818))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9818))));
      return G__9815__delegate(f, arg1, arg2, arg3, more)
    };
    G__9815.cljs$lang$arity$variadic = G__9815__delegate;
    return G__9815
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
      var G__9819 = null;
      var G__9819__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__9819__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__9819__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__9819__4 = function() {
        var G__9820__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
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
          case 1:
            return G__9819__1.call(this, a);
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
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__9822 = null;
      var G__9822__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9822__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__9822__4 = function() {
        var G__9823__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__9823 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9823__delegate.call(this, a, b, c, ds)
        };
        G__9823.cljs$lang$maxFixedArity = 3;
        G__9823.cljs$lang$applyTo = function(arglist__9824) {
          var a = cljs.core.first(arglist__9824);
          var b = cljs.core.first(cljs.core.next(arglist__9824));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9824)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9824)));
          return G__9823__delegate(a, b, c, ds)
        };
        G__9823.cljs$lang$arity$variadic = G__9823__delegate;
        return G__9823
      }();
      G__9822 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9822__2.call(this, a, b);
          case 3:
            return G__9822__3.call(this, a, b, c);
          default:
            return G__9822__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9822.cljs$lang$maxFixedArity = 3;
      G__9822.cljs$lang$applyTo = G__9822__4.cljs$lang$applyTo;
      return G__9822
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__9825 = null;
      var G__9825__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9825__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__9825__4 = function() {
        var G__9826__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__9826 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9826__delegate.call(this, a, b, c, ds)
        };
        G__9826.cljs$lang$maxFixedArity = 3;
        G__9826.cljs$lang$applyTo = function(arglist__9827) {
          var a = cljs.core.first(arglist__9827);
          var b = cljs.core.first(cljs.core.next(arglist__9827));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9827)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9827)));
          return G__9826__delegate(a, b, c, ds)
        };
        G__9826.cljs$lang$arity$variadic = G__9826__delegate;
        return G__9826
      }();
      G__9825 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9825__2.call(this, a, b);
          case 3:
            return G__9825__3.call(this, a, b, c);
          default:
            return G__9825__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9825.cljs$lang$maxFixedArity = 3;
      G__9825.cljs$lang$applyTo = G__9825__4.cljs$lang$applyTo;
      return G__9825
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
  var mapi__9830 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9828 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9828)) {
        var s__9829 = temp__3974__auto____9828;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9829)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__9829)))
      }else {
        return null
      }
    })
  };
  return mapi__9830.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9831 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9831)) {
      var s__9832 = temp__3974__auto____9831;
      var x__9833 = f.call(null, cljs.core.first.call(null, s__9832));
      if(x__9833 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__9832))
      }else {
        return cljs.core.cons.call(null, x__9833, keep.call(null, f, cljs.core.rest.call(null, s__9832)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9843 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9840 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9840)) {
        var s__9841 = temp__3974__auto____9840;
        var x__9842 = f.call(null, idx, cljs.core.first.call(null, s__9841));
        if(x__9842 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9841))
        }else {
          return cljs.core.cons.call(null, x__9842, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9841)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__9843.call(null, 0, coll)
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
          var and__3822__auto____9850 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9850)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____9850
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9851 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9851)) {
            var and__3822__auto____9852 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9852)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____9852
            }
          }else {
            return and__3822__auto____9851
          }
        }())
      };
      var ep1__4 = function() {
        var G__9888__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9853 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9853)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____9853
            }
          }())
        };
        var G__9888 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9888__delegate.call(this, x, y, z, args)
        };
        G__9888.cljs$lang$maxFixedArity = 3;
        G__9888.cljs$lang$applyTo = function(arglist__9889) {
          var x = cljs.core.first(arglist__9889);
          var y = cljs.core.first(cljs.core.next(arglist__9889));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9889)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9889)));
          return G__9888__delegate(x, y, z, args)
        };
        G__9888.cljs$lang$arity$variadic = G__9888__delegate;
        return G__9888
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
          var and__3822__auto____9854 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9854)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____9854
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9855 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9855)) {
            var and__3822__auto____9856 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9856)) {
              var and__3822__auto____9857 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9857)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____9857
              }
            }else {
              return and__3822__auto____9856
            }
          }else {
            return and__3822__auto____9855
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9858 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9858)) {
            var and__3822__auto____9859 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____9859)) {
              var and__3822__auto____9860 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____9860)) {
                var and__3822__auto____9861 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____9861)) {
                  var and__3822__auto____9862 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9862)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____9862
                  }
                }else {
                  return and__3822__auto____9861
                }
              }else {
                return and__3822__auto____9860
              }
            }else {
              return and__3822__auto____9859
            }
          }else {
            return and__3822__auto____9858
          }
        }())
      };
      var ep2__4 = function() {
        var G__9890__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9863 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9863)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9834_SHARP_) {
                var and__3822__auto____9864 = p1.call(null, p1__9834_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9864)) {
                  return p2.call(null, p1__9834_SHARP_)
                }else {
                  return and__3822__auto____9864
                }
              }, args)
            }else {
              return and__3822__auto____9863
            }
          }())
        };
        var G__9890 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9890__delegate.call(this, x, y, z, args)
        };
        G__9890.cljs$lang$maxFixedArity = 3;
        G__9890.cljs$lang$applyTo = function(arglist__9891) {
          var x = cljs.core.first(arglist__9891);
          var y = cljs.core.first(cljs.core.next(arglist__9891));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9891)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9891)));
          return G__9890__delegate(x, y, z, args)
        };
        G__9890.cljs$lang$arity$variadic = G__9890__delegate;
        return G__9890
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
          var and__3822__auto____9865 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9865)) {
            var and__3822__auto____9866 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9866)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____9866
            }
          }else {
            return and__3822__auto____9865
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9867 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9867)) {
            var and__3822__auto____9868 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9868)) {
              var and__3822__auto____9869 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9869)) {
                var and__3822__auto____9870 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9870)) {
                  var and__3822__auto____9871 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9871)) {
                    return p3.call(null, y)
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
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____9872 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____9872)) {
            var and__3822__auto____9873 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9873)) {
              var and__3822__auto____9874 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____9874)) {
                var and__3822__auto____9875 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____9875)) {
                  var and__3822__auto____9876 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____9876)) {
                    var and__3822__auto____9877 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____9877)) {
                      var and__3822__auto____9878 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____9878)) {
                        var and__3822__auto____9879 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____9879)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____9879
                        }
                      }else {
                        return and__3822__auto____9878
                      }
                    }else {
                      return and__3822__auto____9877
                    }
                  }else {
                    return and__3822__auto____9876
                  }
                }else {
                  return and__3822__auto____9875
                }
              }else {
                return and__3822__auto____9874
              }
            }else {
              return and__3822__auto____9873
            }
          }else {
            return and__3822__auto____9872
          }
        }())
      };
      var ep3__4 = function() {
        var G__9892__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____9880 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____9880)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9835_SHARP_) {
                var and__3822__auto____9881 = p1.call(null, p1__9835_SHARP_);
                if(cljs.core.truth_(and__3822__auto____9881)) {
                  var and__3822__auto____9882 = p2.call(null, p1__9835_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____9882)) {
                    return p3.call(null, p1__9835_SHARP_)
                  }else {
                    return and__3822__auto____9882
                  }
                }else {
                  return and__3822__auto____9881
                }
              }, args)
            }else {
              return and__3822__auto____9880
            }
          }())
        };
        var G__9892 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9892__delegate.call(this, x, y, z, args)
        };
        G__9892.cljs$lang$maxFixedArity = 3;
        G__9892.cljs$lang$applyTo = function(arglist__9893) {
          var x = cljs.core.first(arglist__9893);
          var y = cljs.core.first(cljs.core.next(arglist__9893));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9893)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9893)));
          return G__9892__delegate(x, y, z, args)
        };
        G__9892.cljs$lang$arity$variadic = G__9892__delegate;
        return G__9892
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
    var G__9894__delegate = function(p1, p2, p3, ps) {
      var ps__9883 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9836_SHARP_) {
            return p1__9836_SHARP_.call(null, x)
          }, ps__9883)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9837_SHARP_) {
            var and__3822__auto____9884 = p1__9837_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9884)) {
              return p1__9837_SHARP_.call(null, y)
            }else {
              return and__3822__auto____9884
            }
          }, ps__9883)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9838_SHARP_) {
            var and__3822__auto____9885 = p1__9838_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____9885)) {
              var and__3822__auto____9886 = p1__9838_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____9886)) {
                return p1__9838_SHARP_.call(null, z)
              }else {
                return and__3822__auto____9886
              }
            }else {
              return and__3822__auto____9885
            }
          }, ps__9883)
        };
        var epn__4 = function() {
          var G__9895__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____9887 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____9887)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9839_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9839_SHARP_, args)
                }, ps__9883)
              }else {
                return and__3822__auto____9887
              }
            }())
          };
          var G__9895 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9895__delegate.call(this, x, y, z, args)
          };
          G__9895.cljs$lang$maxFixedArity = 3;
          G__9895.cljs$lang$applyTo = function(arglist__9896) {
            var x = cljs.core.first(arglist__9896);
            var y = cljs.core.first(cljs.core.next(arglist__9896));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9896)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9896)));
            return G__9895__delegate(x, y, z, args)
          };
          G__9895.cljs$lang$arity$variadic = G__9895__delegate;
          return G__9895
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
    var G__9894 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9894__delegate.call(this, p1, p2, p3, ps)
    };
    G__9894.cljs$lang$maxFixedArity = 3;
    G__9894.cljs$lang$applyTo = function(arglist__9897) {
      var p1 = cljs.core.first(arglist__9897);
      var p2 = cljs.core.first(cljs.core.next(arglist__9897));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9897)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9897)));
      return G__9894__delegate(p1, p2, p3, ps)
    };
    G__9894.cljs$lang$arity$variadic = G__9894__delegate;
    return G__9894
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
        var or__3824__auto____9899 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9899)) {
          return or__3824__auto____9899
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____9900 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9900)) {
          return or__3824__auto____9900
        }else {
          var or__3824__auto____9901 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9901)) {
            return or__3824__auto____9901
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__9937__delegate = function(x, y, z, args) {
          var or__3824__auto____9902 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9902)) {
            return or__3824__auto____9902
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9937 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9937__delegate.call(this, x, y, z, args)
        };
        G__9937.cljs$lang$maxFixedArity = 3;
        G__9937.cljs$lang$applyTo = function(arglist__9938) {
          var x = cljs.core.first(arglist__9938);
          var y = cljs.core.first(cljs.core.next(arglist__9938));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9938)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9938)));
          return G__9937__delegate(x, y, z, args)
        };
        G__9937.cljs$lang$arity$variadic = G__9937__delegate;
        return G__9937
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
        var or__3824__auto____9903 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9903)) {
          return or__3824__auto____9903
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____9904 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9904)) {
          return or__3824__auto____9904
        }else {
          var or__3824__auto____9905 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9905)) {
            return or__3824__auto____9905
          }else {
            var or__3824__auto____9906 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9906)) {
              return or__3824__auto____9906
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____9907 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9907)) {
          return or__3824__auto____9907
        }else {
          var or__3824__auto____9908 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____9908)) {
            return or__3824__auto____9908
          }else {
            var or__3824__auto____9909 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____9909)) {
              return or__3824__auto____9909
            }else {
              var or__3824__auto____9910 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____9910)) {
                return or__3824__auto____9910
              }else {
                var or__3824__auto____9911 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9911)) {
                  return or__3824__auto____9911
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__9939__delegate = function(x, y, z, args) {
          var or__3824__auto____9912 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9912)) {
            return or__3824__auto____9912
          }else {
            return cljs.core.some.call(null, function(p1__9844_SHARP_) {
              var or__3824__auto____9913 = p1.call(null, p1__9844_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9913)) {
                return or__3824__auto____9913
              }else {
                return p2.call(null, p1__9844_SHARP_)
              }
            }, args)
          }
        };
        var G__9939 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9939__delegate.call(this, x, y, z, args)
        };
        G__9939.cljs$lang$maxFixedArity = 3;
        G__9939.cljs$lang$applyTo = function(arglist__9940) {
          var x = cljs.core.first(arglist__9940);
          var y = cljs.core.first(cljs.core.next(arglist__9940));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9940)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9940)));
          return G__9939__delegate(x, y, z, args)
        };
        G__9939.cljs$lang$arity$variadic = G__9939__delegate;
        return G__9939
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
        var or__3824__auto____9914 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9914)) {
          return or__3824__auto____9914
        }else {
          var or__3824__auto____9915 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9915)) {
            return or__3824__auto____9915
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____9916 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9916)) {
          return or__3824__auto____9916
        }else {
          var or__3824__auto____9917 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9917)) {
            return or__3824__auto____9917
          }else {
            var or__3824__auto____9918 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9918)) {
              return or__3824__auto____9918
            }else {
              var or__3824__auto____9919 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9919)) {
                return or__3824__auto____9919
              }else {
                var or__3824__auto____9920 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9920)) {
                  return or__3824__auto____9920
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____9921 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____9921)) {
          return or__3824__auto____9921
        }else {
          var or__3824__auto____9922 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____9922)) {
            return or__3824__auto____9922
          }else {
            var or__3824__auto____9923 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9923)) {
              return or__3824__auto____9923
            }else {
              var or__3824__auto____9924 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9924)) {
                return or__3824__auto____9924
              }else {
                var or__3824__auto____9925 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____9925)) {
                  return or__3824__auto____9925
                }else {
                  var or__3824__auto____9926 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____9926)) {
                    return or__3824__auto____9926
                  }else {
                    var or__3824__auto____9927 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____9927)) {
                      return or__3824__auto____9927
                    }else {
                      var or__3824__auto____9928 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____9928)) {
                        return or__3824__auto____9928
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
        var G__9941__delegate = function(x, y, z, args) {
          var or__3824__auto____9929 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____9929)) {
            return or__3824__auto____9929
          }else {
            return cljs.core.some.call(null, function(p1__9845_SHARP_) {
              var or__3824__auto____9930 = p1.call(null, p1__9845_SHARP_);
              if(cljs.core.truth_(or__3824__auto____9930)) {
                return or__3824__auto____9930
              }else {
                var or__3824__auto____9931 = p2.call(null, p1__9845_SHARP_);
                if(cljs.core.truth_(or__3824__auto____9931)) {
                  return or__3824__auto____9931
                }else {
                  return p3.call(null, p1__9845_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9941 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9941__delegate.call(this, x, y, z, args)
        };
        G__9941.cljs$lang$maxFixedArity = 3;
        G__9941.cljs$lang$applyTo = function(arglist__9942) {
          var x = cljs.core.first(arglist__9942);
          var y = cljs.core.first(cljs.core.next(arglist__9942));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9942)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9942)));
          return G__9941__delegate(x, y, z, args)
        };
        G__9941.cljs$lang$arity$variadic = G__9941__delegate;
        return G__9941
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
    var G__9943__delegate = function(p1, p2, p3, ps) {
      var ps__9932 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__9846_SHARP_) {
            return p1__9846_SHARP_.call(null, x)
          }, ps__9932)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9847_SHARP_) {
            var or__3824__auto____9933 = p1__9847_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9933)) {
              return or__3824__auto____9933
            }else {
              return p1__9847_SHARP_.call(null, y)
            }
          }, ps__9932)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9848_SHARP_) {
            var or__3824__auto____9934 = p1__9848_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____9934)) {
              return or__3824__auto____9934
            }else {
              var or__3824__auto____9935 = p1__9848_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____9935)) {
                return or__3824__auto____9935
              }else {
                return p1__9848_SHARP_.call(null, z)
              }
            }
          }, ps__9932)
        };
        var spn__4 = function() {
          var G__9944__delegate = function(x, y, z, args) {
            var or__3824__auto____9936 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____9936)) {
              return or__3824__auto____9936
            }else {
              return cljs.core.some.call(null, function(p1__9849_SHARP_) {
                return cljs.core.some.call(null, p1__9849_SHARP_, args)
              }, ps__9932)
            }
          };
          var G__9944 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9944__delegate.call(this, x, y, z, args)
          };
          G__9944.cljs$lang$maxFixedArity = 3;
          G__9944.cljs$lang$applyTo = function(arglist__9945) {
            var x = cljs.core.first(arglist__9945);
            var y = cljs.core.first(cljs.core.next(arglist__9945));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9945)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9945)));
            return G__9944__delegate(x, y, z, args)
          };
          G__9944.cljs$lang$arity$variadic = G__9944__delegate;
          return G__9944
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
    var G__9943 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9943__delegate.call(this, p1, p2, p3, ps)
    };
    G__9943.cljs$lang$maxFixedArity = 3;
    G__9943.cljs$lang$applyTo = function(arglist__9946) {
      var p1 = cljs.core.first(arglist__9946);
      var p2 = cljs.core.first(cljs.core.next(arglist__9946));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9946)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9946)));
      return G__9943__delegate(p1, p2, p3, ps)
    };
    G__9943.cljs$lang$arity$variadic = G__9943__delegate;
    return G__9943
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
      var temp__3974__auto____9947 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9947)) {
        var s__9948 = temp__3974__auto____9947;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9948)), map.call(null, f, cljs.core.rest.call(null, s__9948)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9949 = cljs.core.seq.call(null, c1);
      var s2__9950 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9951 = s1__9949;
        if(cljs.core.truth_(and__3822__auto____9951)) {
          return s2__9950
        }else {
          return and__3822__auto____9951
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9949), cljs.core.first.call(null, s2__9950)), map.call(null, f, cljs.core.rest.call(null, s1__9949), cljs.core.rest.call(null, s2__9950)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9952 = cljs.core.seq.call(null, c1);
      var s2__9953 = cljs.core.seq.call(null, c2);
      var s3__9954 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9955 = s1__9952;
        if(cljs.core.truth_(and__3822__auto____9955)) {
          var and__3822__auto____9956 = s2__9953;
          if(cljs.core.truth_(and__3822__auto____9956)) {
            return s3__9954
          }else {
            return and__3822__auto____9956
          }
        }else {
          return and__3822__auto____9955
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9952), cljs.core.first.call(null, s2__9953), cljs.core.first.call(null, s3__9954)), map.call(null, f, cljs.core.rest.call(null, s1__9952), cljs.core.rest.call(null, s2__9953), cljs.core.rest.call(null, s3__9954)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__9959__delegate = function(f, c1, c2, c3, colls) {
      var step__9958 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9957 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9957)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9957), step.call(null, map.call(null, cljs.core.rest, ss__9957)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__9898_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9898_SHARP_)
      }, step__9958.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9959 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9959__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9959.cljs$lang$maxFixedArity = 4;
    G__9959.cljs$lang$applyTo = function(arglist__9960) {
      var f = cljs.core.first(arglist__9960);
      var c1 = cljs.core.first(cljs.core.next(arglist__9960));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9960)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9960))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9960))));
      return G__9959__delegate(f, c1, c2, c3, colls)
    };
    G__9959.cljs$lang$arity$variadic = G__9959__delegate;
    return G__9959
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
      var temp__3974__auto____9961 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____9961)) {
        var s__9962 = temp__3974__auto____9961;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9962), take.call(null, n - 1, cljs.core.rest.call(null, s__9962)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__9965 = function(n, coll) {
    while(true) {
      var s__9963 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9964 = n > 0;
        if(and__3822__auto____9964) {
          return s__9963
        }else {
          return and__3822__auto____9964
        }
      }())) {
        var G__9966 = n - 1;
        var G__9967 = cljs.core.rest.call(null, s__9963);
        n = G__9966;
        coll = G__9967;
        continue
      }else {
        return s__9963
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9965.call(null, n, coll)
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
  var s__9968 = cljs.core.seq.call(null, coll);
  var lead__9969 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__9969)) {
      var G__9970 = cljs.core.next.call(null, s__9968);
      var G__9971 = cljs.core.next.call(null, lead__9969);
      s__9968 = G__9970;
      lead__9969 = G__9971;
      continue
    }else {
      return s__9968
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9974 = function(pred, coll) {
    while(true) {
      var s__9972 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9973 = s__9972;
        if(cljs.core.truth_(and__3822__auto____9973)) {
          return pred.call(null, cljs.core.first.call(null, s__9972))
        }else {
          return and__3822__auto____9973
        }
      }())) {
        var G__9975 = pred;
        var G__9976 = cljs.core.rest.call(null, s__9972);
        pred = G__9975;
        coll = G__9976;
        continue
      }else {
        return s__9972
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9974.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9977 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9977)) {
      var s__9978 = temp__3974__auto____9977;
      return cljs.core.concat.call(null, s__9978, cycle.call(null, s__9978))
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
      var s1__9979 = cljs.core.seq.call(null, c1);
      var s2__9980 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____9981 = s1__9979;
        if(cljs.core.truth_(and__3822__auto____9981)) {
          return s2__9980
        }else {
          return and__3822__auto____9981
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9979), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9980), interleave.call(null, cljs.core.rest.call(null, s1__9979), cljs.core.rest.call(null, s2__9980))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__9983__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9982 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9982)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9982), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9982)))
        }else {
          return null
        }
      })
    };
    var G__9983 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9983__delegate.call(this, c1, c2, colls)
    };
    G__9983.cljs$lang$maxFixedArity = 2;
    G__9983.cljs$lang$applyTo = function(arglist__9984) {
      var c1 = cljs.core.first(arglist__9984);
      var c2 = cljs.core.first(cljs.core.next(arglist__9984));
      var colls = cljs.core.rest(cljs.core.next(arglist__9984));
      return G__9983__delegate(c1, c2, colls)
    };
    G__9983.cljs$lang$arity$variadic = G__9983__delegate;
    return G__9983
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
  var cat__9987 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9985 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____9985)) {
        var coll__9986 = temp__3971__auto____9985;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9986), cat.call(null, cljs.core.rest.call(null, coll__9986), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__9987.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9988__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9988 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9988__delegate.call(this, f, coll, colls)
    };
    G__9988.cljs$lang$maxFixedArity = 2;
    G__9988.cljs$lang$applyTo = function(arglist__9989) {
      var f = cljs.core.first(arglist__9989);
      var coll = cljs.core.first(cljs.core.next(arglist__9989));
      var colls = cljs.core.rest(cljs.core.next(arglist__9989));
      return G__9988__delegate(f, coll, colls)
    };
    G__9988.cljs$lang$arity$variadic = G__9988__delegate;
    return G__9988
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
    var temp__3974__auto____9990 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____9990)) {
      var s__9991 = temp__3974__auto____9990;
      var f__9992 = cljs.core.first.call(null, s__9991);
      var r__9993 = cljs.core.rest.call(null, s__9991);
      if(cljs.core.truth_(pred.call(null, f__9992))) {
        return cljs.core.cons.call(null, f__9992, filter.call(null, pred, r__9993))
      }else {
        return filter.call(null, pred, r__9993)
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
  var walk__9995 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__9995.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9994_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__9994_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9996__9997 = to;
    if(G__9996__9997 != null) {
      if(function() {
        var or__3824__auto____9998 = G__9996__9997.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____9998) {
          return or__3824__auto____9998
        }else {
          return G__9996__9997.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9996__9997.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9996__9997)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9996__9997)
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
    var G__9999__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9999 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9999__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9999.cljs$lang$maxFixedArity = 4;
    G__9999.cljs$lang$applyTo = function(arglist__10000) {
      var f = cljs.core.first(arglist__10000);
      var c1 = cljs.core.first(cljs.core.next(arglist__10000));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10000)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10000))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10000))));
      return G__9999__delegate(f, c1, c2, c3, colls)
    };
    G__9999.cljs$lang$arity$variadic = G__9999__delegate;
    return G__9999
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
      var temp__3974__auto____10001 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____10001)) {
        var s__10002 = temp__3974__auto____10001;
        var p__10003 = cljs.core.take.call(null, n, s__10002);
        if(n === cljs.core.count.call(null, p__10003)) {
          return cljs.core.cons.call(null, p__10003, partition.call(null, n, step, cljs.core.drop.call(null, step, s__10002)))
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
      var temp__3974__auto____10004 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____10004)) {
        var s__10005 = temp__3974__auto____10004;
        var p__10006 = cljs.core.take.call(null, n, s__10005);
        if(n === cljs.core.count.call(null, p__10006)) {
          return cljs.core.cons.call(null, p__10006, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__10005)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__10006, pad)))
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
    var sentinel__10007 = cljs.core.lookup_sentinel;
    var m__10008 = m;
    var ks__10009 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__10009)) {
        var m__10010 = cljs.core.get.call(null, m__10008, cljs.core.first.call(null, ks__10009), sentinel__10007);
        if(sentinel__10007 === m__10010) {
          return not_found
        }else {
          var G__10011 = sentinel__10007;
          var G__10012 = m__10010;
          var G__10013 = cljs.core.next.call(null, ks__10009);
          sentinel__10007 = G__10011;
          m__10008 = G__10012;
          ks__10009 = G__10013;
          continue
        }
      }else {
        return m__10008
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
cljs.core.assoc_in = function assoc_in(m, p__10014, v) {
  var vec__10015__10016 = p__10014;
  var k__10017 = cljs.core.nth.call(null, vec__10015__10016, 0, null);
  var ks__10018 = cljs.core.nthnext.call(null, vec__10015__10016, 1);
  if(cljs.core.truth_(ks__10018)) {
    return cljs.core.assoc.call(null, m, k__10017, assoc_in.call(null, cljs.core.get.call(null, m, k__10017), ks__10018, v))
  }else {
    return cljs.core.assoc.call(null, m, k__10017, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__10019, f, args) {
    var vec__10020__10021 = p__10019;
    var k__10022 = cljs.core.nth.call(null, vec__10020__10021, 0, null);
    var ks__10023 = cljs.core.nthnext.call(null, vec__10020__10021, 1);
    if(cljs.core.truth_(ks__10023)) {
      return cljs.core.assoc.call(null, m, k__10022, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__10022), ks__10023, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__10022, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__10022), args))
    }
  };
  var update_in = function(m, p__10019, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__10019, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__10024) {
    var m = cljs.core.first(arglist__10024);
    var p__10019 = cljs.core.first(cljs.core.next(arglist__10024));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10024)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10024)));
    return update_in__delegate(m, p__10019, f, args)
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
  var this__10029 = this;
  var h__364__auto____10030 = this__10029.__hash;
  if(h__364__auto____10030 != null) {
    return h__364__auto____10030
  }else {
    var h__364__auto____10031 = cljs.core.hash_coll.call(null, coll);
    this__10029.__hash = h__364__auto____10031;
    return h__364__auto____10031
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10032 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10033 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10034 = this;
  var new_array__10035 = cljs.core.aclone.call(null, this__10034.array);
  new_array__10035[k] = v;
  return new cljs.core.Vector(this__10034.meta, new_array__10035, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__10064 = null;
  var G__10064__2 = function(tsym10027, k) {
    var this__10036 = this;
    var tsym10027__10037 = this;
    var coll__10038 = tsym10027__10037;
    return cljs.core._lookup.call(null, coll__10038, k)
  };
  var G__10064__3 = function(tsym10028, k, not_found) {
    var this__10039 = this;
    var tsym10028__10040 = this;
    var coll__10041 = tsym10028__10040;
    return cljs.core._lookup.call(null, coll__10041, k, not_found)
  };
  G__10064 = function(tsym10028, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10064__2.call(this, tsym10028, k);
      case 3:
        return G__10064__3.call(this, tsym10028, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10064
}();
cljs.core.Vector.prototype.apply = function(tsym10025, args10026) {
  return tsym10025.call.apply(tsym10025, [tsym10025].concat(cljs.core.aclone.call(null, args10026)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10042 = this;
  var new_array__10043 = cljs.core.aclone.call(null, this__10042.array);
  new_array__10043.push(o);
  return new cljs.core.Vector(this__10042.meta, new_array__10043, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__10044 = this;
  var this$__10045 = this;
  return cljs.core.pr_str.call(null, this$__10045)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10046 = this;
  return cljs.core.ci_reduce.call(null, this__10046.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10047 = this;
  return cljs.core.ci_reduce.call(null, this__10047.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10048 = this;
  if(this__10048.array.length > 0) {
    var vector_seq__10049 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__10048.array.length) {
          return cljs.core.cons.call(null, this__10048.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__10049.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10050 = this;
  return this__10050.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10051 = this;
  var count__10052 = this__10051.array.length;
  if(count__10052 > 0) {
    return this__10051.array[count__10052 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10053 = this;
  if(this__10053.array.length > 0) {
    var new_array__10054 = cljs.core.aclone.call(null, this__10053.array);
    new_array__10054.pop();
    return new cljs.core.Vector(this__10053.meta, new_array__10054, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10055 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10056 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10057 = this;
  return new cljs.core.Vector(meta, this__10057.array, this__10057.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10058 = this;
  return this__10058.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10060 = this;
  if(function() {
    var and__3822__auto____10061 = 0 <= n;
    if(and__3822__auto____10061) {
      return n < this__10060.array.length
    }else {
      return and__3822__auto____10061
    }
  }()) {
    return this__10060.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10062 = this;
  if(function() {
    var and__3822__auto____10063 = 0 <= n;
    if(and__3822__auto____10063) {
      return n < this__10062.array.length
    }else {
      return and__3822__auto____10063
    }
  }()) {
    return this__10062.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10059 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10059.meta)
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
  var cnt__10065 = pv.cnt;
  if(cnt__10065 < 32) {
    return 0
  }else {
    return cnt__10065 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__10066 = level;
  var ret__10067 = node;
  while(true) {
    if(ll__10066 === 0) {
      return ret__10067
    }else {
      var embed__10068 = ret__10067;
      var r__10069 = cljs.core.pv_fresh_node.call(null, edit);
      var ___10070 = cljs.core.pv_aset.call(null, r__10069, 0, embed__10068);
      var G__10071 = ll__10066 - 5;
      var G__10072 = r__10069;
      ll__10066 = G__10071;
      ret__10067 = G__10072;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__10073 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__10074 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__10073, subidx__10074, tailnode);
    return ret__10073
  }else {
    var temp__3971__auto____10075 = cljs.core.pv_aget.call(null, parent, subidx__10074);
    if(cljs.core.truth_(temp__3971__auto____10075)) {
      var child__10076 = temp__3971__auto____10075;
      var node_to_insert__10077 = push_tail.call(null, pv, level - 5, child__10076, tailnode);
      cljs.core.pv_aset.call(null, ret__10073, subidx__10074, node_to_insert__10077);
      return ret__10073
    }else {
      var node_to_insert__10078 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__10073, subidx__10074, node_to_insert__10078);
      return ret__10073
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____10079 = 0 <= i;
    if(and__3822__auto____10079) {
      return i < pv.cnt
    }else {
      return and__3822__auto____10079
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__10080 = pv.root;
      var level__10081 = pv.shift;
      while(true) {
        if(level__10081 > 0) {
          var G__10082 = cljs.core.pv_aget.call(null, node__10080, i >>> level__10081 & 31);
          var G__10083 = level__10081 - 5;
          node__10080 = G__10082;
          level__10081 = G__10083;
          continue
        }else {
          return node__10080.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__10084 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__10084, i & 31, val);
    return ret__10084
  }else {
    var subidx__10085 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__10084, subidx__10085, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10085), i, val));
    return ret__10084
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__10086 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10087 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__10086));
    if(function() {
      var and__3822__auto____10088 = new_child__10087 == null;
      if(and__3822__auto____10088) {
        return subidx__10086 === 0
      }else {
        return and__3822__auto____10088
      }
    }()) {
      return null
    }else {
      var ret__10089 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__10089, subidx__10086, new_child__10087);
      return ret__10089
    }
  }else {
    if(subidx__10086 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__10090 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__10090, subidx__10086, null);
        return ret__10090
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
  var c__10091 = cljs.core._count.call(null, v);
  if(c__10091 > 0) {
    if(void 0 === cljs.core.t10092) {
      cljs.core.t10092 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t10092.cljs$lang$type = true;
      cljs.core.t10092.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t10092")
      };
      cljs.core.t10092.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t10092.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__10093 = this;
        return vseq
      };
      cljs.core.t10092.prototype.cljs$core$ISeq$ = true;
      cljs.core.t10092.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__10094 = this;
        return cljs.core._nth.call(null, this__10094.v, this__10094.offset)
      };
      cljs.core.t10092.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__10095 = this;
        var offset__10096 = this__10095.offset + 1;
        if(offset__10096 < this__10095.c) {
          return this__10095.vector_seq.call(null, this__10095.v, offset__10096)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t10092.prototype.cljs$core$ASeq$ = true;
      cljs.core.t10092.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t10092.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__10097 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t10092.prototype.cljs$core$ISequential$ = true;
      cljs.core.t10092.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t10092.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__10098 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t10092.prototype.cljs$core$IMeta$ = true;
      cljs.core.t10092.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__10099 = this;
        return this__10099.__meta__389__auto__
      };
      cljs.core.t10092.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t10092.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__10100 = this;
        return new cljs.core.t10092(this__10100.c, this__10100.offset, this__10100.v, this__10100.vector_seq, __meta__389__auto__)
      };
      cljs.core.t10092
    }else {
    }
    return new cljs.core.t10092(c__10091, offset, v, vector_seq, null)
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
  var this__10105 = this;
  return new cljs.core.TransientVector(this__10105.cnt, this__10105.shift, cljs.core.tv_editable_root.call(null, this__10105.root), cljs.core.tv_editable_tail.call(null, this__10105.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10106 = this;
  var h__364__auto____10107 = this__10106.__hash;
  if(h__364__auto____10107 != null) {
    return h__364__auto____10107
  }else {
    var h__364__auto____10108 = cljs.core.hash_coll.call(null, coll);
    this__10106.__hash = h__364__auto____10108;
    return h__364__auto____10108
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10109 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10110 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10111 = this;
  if(function() {
    var and__3822__auto____10112 = 0 <= k;
    if(and__3822__auto____10112) {
      return k < this__10111.cnt
    }else {
      return and__3822__auto____10112
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__10113 = cljs.core.aclone.call(null, this__10111.tail);
      new_tail__10113[k & 31] = v;
      return new cljs.core.PersistentVector(this__10111.meta, this__10111.cnt, this__10111.shift, this__10111.root, new_tail__10113, null)
    }else {
      return new cljs.core.PersistentVector(this__10111.meta, this__10111.cnt, this__10111.shift, cljs.core.do_assoc.call(null, coll, this__10111.shift, this__10111.root, k, v), this__10111.tail, null)
    }
  }else {
    if(k === this__10111.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__10111.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__10158 = null;
  var G__10158__2 = function(tsym10103, k) {
    var this__10114 = this;
    var tsym10103__10115 = this;
    var coll__10116 = tsym10103__10115;
    return cljs.core._lookup.call(null, coll__10116, k)
  };
  var G__10158__3 = function(tsym10104, k, not_found) {
    var this__10117 = this;
    var tsym10104__10118 = this;
    var coll__10119 = tsym10104__10118;
    return cljs.core._lookup.call(null, coll__10119, k, not_found)
  };
  G__10158 = function(tsym10104, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10158__2.call(this, tsym10104, k);
      case 3:
        return G__10158__3.call(this, tsym10104, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10158
}();
cljs.core.PersistentVector.prototype.apply = function(tsym10101, args10102) {
  return tsym10101.call.apply(tsym10101, [tsym10101].concat(cljs.core.aclone.call(null, args10102)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__10120 = this;
  var step_init__10121 = [0, init];
  var i__10122 = 0;
  while(true) {
    if(i__10122 < this__10120.cnt) {
      var arr__10123 = cljs.core.array_for.call(null, v, i__10122);
      var len__10124 = arr__10123.length;
      var init__10128 = function() {
        var j__10125 = 0;
        var init__10126 = step_init__10121[1];
        while(true) {
          if(j__10125 < len__10124) {
            var init__10127 = f.call(null, init__10126, j__10125 + i__10122, arr__10123[j__10125]);
            if(cljs.core.reduced_QMARK_.call(null, init__10127)) {
              return init__10127
            }else {
              var G__10159 = j__10125 + 1;
              var G__10160 = init__10127;
              j__10125 = G__10159;
              init__10126 = G__10160;
              continue
            }
          }else {
            step_init__10121[0] = len__10124;
            step_init__10121[1] = init__10126;
            return init__10126
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10128)) {
        return cljs.core.deref.call(null, init__10128)
      }else {
        var G__10161 = i__10122 + step_init__10121[0];
        i__10122 = G__10161;
        continue
      }
    }else {
      return step_init__10121[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10129 = this;
  if(this__10129.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__10130 = cljs.core.aclone.call(null, this__10129.tail);
    new_tail__10130.push(o);
    return new cljs.core.PersistentVector(this__10129.meta, this__10129.cnt + 1, this__10129.shift, this__10129.root, new_tail__10130, null)
  }else {
    var root_overflow_QMARK___10131 = this__10129.cnt >>> 5 > 1 << this__10129.shift;
    var new_shift__10132 = root_overflow_QMARK___10131 ? this__10129.shift + 5 : this__10129.shift;
    var new_root__10134 = root_overflow_QMARK___10131 ? function() {
      var n_r__10133 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__10133, 0, this__10129.root);
      cljs.core.pv_aset.call(null, n_r__10133, 1, cljs.core.new_path.call(null, null, this__10129.shift, new cljs.core.VectorNode(null, this__10129.tail)));
      return n_r__10133
    }() : cljs.core.push_tail.call(null, coll, this__10129.shift, this__10129.root, new cljs.core.VectorNode(null, this__10129.tail));
    return new cljs.core.PersistentVector(this__10129.meta, this__10129.cnt + 1, new_shift__10132, new_root__10134, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__10135 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__10136 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__10137 = this;
  var this$__10138 = this;
  return cljs.core.pr_str.call(null, this$__10138)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__10139 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__10140 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10141 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10142 = this;
  return this__10142.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10143 = this;
  if(this__10143.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__10143.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10144 = this;
  if(this__10144.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__10144.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10144.meta)
    }else {
      if(1 < this__10144.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__10144.meta, this__10144.cnt - 1, this__10144.shift, this__10144.root, this__10144.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__10145 = cljs.core.array_for.call(null, coll, this__10144.cnt - 2);
          var nr__10146 = cljs.core.pop_tail.call(null, coll, this__10144.shift, this__10144.root);
          var new_root__10147 = nr__10146 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__10146;
          var cnt_1__10148 = this__10144.cnt - 1;
          if(function() {
            var and__3822__auto____10149 = 5 < this__10144.shift;
            if(and__3822__auto____10149) {
              return cljs.core.pv_aget.call(null, new_root__10147, 1) == null
            }else {
              return and__3822__auto____10149
            }
          }()) {
            return new cljs.core.PersistentVector(this__10144.meta, cnt_1__10148, this__10144.shift - 5, cljs.core.pv_aget.call(null, new_root__10147, 0), new_tail__10145, null)
          }else {
            return new cljs.core.PersistentVector(this__10144.meta, cnt_1__10148, this__10144.shift, new_root__10147, new_tail__10145, null)
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
  var this__10151 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10152 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10153 = this;
  return new cljs.core.PersistentVector(meta, this__10153.cnt, this__10153.shift, this__10153.root, this__10153.tail, this__10153.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10154 = this;
  return this__10154.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10155 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10156 = this;
  if(function() {
    var and__3822__auto____10157 = 0 <= n;
    if(and__3822__auto____10157) {
      return n < this__10156.cnt
    }else {
      return and__3822__auto____10157
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10150 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__10150.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__10162 = cljs.core.seq.call(null, xs);
  var out__10163 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__10162)) {
      var G__10164 = cljs.core.next.call(null, xs__10162);
      var G__10165 = cljs.core.conj_BANG_.call(null, out__10163, cljs.core.first.call(null, xs__10162));
      xs__10162 = G__10164;
      out__10163 = G__10165;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10163)
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
  vector.cljs$lang$applyTo = function(arglist__10166) {
    var args = cljs.core.seq(arglist__10166);
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
  var this__10171 = this;
  var h__364__auto____10172 = this__10171.__hash;
  if(h__364__auto____10172 != null) {
    return h__364__auto____10172
  }else {
    var h__364__auto____10173 = cljs.core.hash_coll.call(null, coll);
    this__10171.__hash = h__364__auto____10173;
    return h__364__auto____10173
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10174 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10175 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__10176 = this;
  var v_pos__10177 = this__10176.start + key;
  return new cljs.core.Subvec(this__10176.meta, cljs.core._assoc.call(null, this__10176.v, v_pos__10177, val), this__10176.start, this__10176.end > v_pos__10177 + 1 ? this__10176.end : v_pos__10177 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__10201 = null;
  var G__10201__2 = function(tsym10169, k) {
    var this__10178 = this;
    var tsym10169__10179 = this;
    var coll__10180 = tsym10169__10179;
    return cljs.core._lookup.call(null, coll__10180, k)
  };
  var G__10201__3 = function(tsym10170, k, not_found) {
    var this__10181 = this;
    var tsym10170__10182 = this;
    var coll__10183 = tsym10170__10182;
    return cljs.core._lookup.call(null, coll__10183, k, not_found)
  };
  G__10201 = function(tsym10170, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10201__2.call(this, tsym10170, k);
      case 3:
        return G__10201__3.call(this, tsym10170, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10201
}();
cljs.core.Subvec.prototype.apply = function(tsym10167, args10168) {
  return tsym10167.call.apply(tsym10167, [tsym10167].concat(cljs.core.aclone.call(null, args10168)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10184 = this;
  return new cljs.core.Subvec(this__10184.meta, cljs.core._assoc_n.call(null, this__10184.v, this__10184.end, o), this__10184.start, this__10184.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__10185 = this;
  var this$__10186 = this;
  return cljs.core.pr_str.call(null, this$__10186)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10187 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10188 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10189 = this;
  var subvec_seq__10190 = function subvec_seq(i) {
    if(i === this__10189.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__10189.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__10190.call(null, this__10189.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10191 = this;
  return this__10191.end - this__10191.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10192 = this;
  return cljs.core._nth.call(null, this__10192.v, this__10192.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10193 = this;
  if(this__10193.start === this__10193.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__10193.meta, this__10193.v, this__10193.start, this__10193.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__10194 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10195 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10196 = this;
  return new cljs.core.Subvec(meta, this__10196.v, this__10196.start, this__10196.end, this__10196.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10197 = this;
  return this__10197.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10199 = this;
  return cljs.core._nth.call(null, this__10199.v, this__10199.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10200 = this;
  return cljs.core._nth.call(null, this__10200.v, this__10200.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10198 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10198.meta)
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
  var ret__10202 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__10202, 0, tl.length);
  return ret__10202
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__10203 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__10204 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__10203, subidx__10204, level === 5 ? tail_node : function() {
    var child__10205 = cljs.core.pv_aget.call(null, ret__10203, subidx__10204);
    if(child__10205 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__10205, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__10203
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__10206 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__10207 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__10208 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__10206, subidx__10207));
    if(function() {
      var and__3822__auto____10209 = new_child__10208 == null;
      if(and__3822__auto____10209) {
        return subidx__10207 === 0
      }else {
        return and__3822__auto____10209
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__10206, subidx__10207, new_child__10208);
      return node__10206
    }
  }else {
    if(subidx__10207 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__10206, subidx__10207, null);
        return node__10206
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____10210 = 0 <= i;
    if(and__3822__auto____10210) {
      return i < tv.cnt
    }else {
      return and__3822__auto____10210
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__10211 = tv.root;
      var node__10212 = root__10211;
      var level__10213 = tv.shift;
      while(true) {
        if(level__10213 > 0) {
          var G__10214 = cljs.core.tv_ensure_editable.call(null, root__10211.edit, cljs.core.pv_aget.call(null, node__10212, i >>> level__10213 & 31));
          var G__10215 = level__10213 - 5;
          node__10212 = G__10214;
          level__10213 = G__10215;
          continue
        }else {
          return node__10212.arr
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
  var G__10253 = null;
  var G__10253__2 = function(tsym10218, k) {
    var this__10220 = this;
    var tsym10218__10221 = this;
    var coll__10222 = tsym10218__10221;
    return cljs.core._lookup.call(null, coll__10222, k)
  };
  var G__10253__3 = function(tsym10219, k, not_found) {
    var this__10223 = this;
    var tsym10219__10224 = this;
    var coll__10225 = tsym10219__10224;
    return cljs.core._lookup.call(null, coll__10225, k, not_found)
  };
  G__10253 = function(tsym10219, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10253__2.call(this, tsym10219, k);
      case 3:
        return G__10253__3.call(this, tsym10219, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10253
}();
cljs.core.TransientVector.prototype.apply = function(tsym10216, args10217) {
  return tsym10216.call.apply(tsym10216, [tsym10216].concat(cljs.core.aclone.call(null, args10217)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10226 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10227 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10228 = this;
  if(cljs.core.truth_(this__10228.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10229 = this;
  if(function() {
    var and__3822__auto____10230 = 0 <= n;
    if(and__3822__auto____10230) {
      return n < this__10229.cnt
    }else {
      return and__3822__auto____10230
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10231 = this;
  if(cljs.core.truth_(this__10231.root.edit)) {
    return this__10231.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__10232 = this;
  if(cljs.core.truth_(this__10232.root.edit)) {
    if(function() {
      var and__3822__auto____10233 = 0 <= n;
      if(and__3822__auto____10233) {
        return n < this__10232.cnt
      }else {
        return and__3822__auto____10233
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__10232.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__10236 = function go(level, node) {
          var node__10234 = cljs.core.tv_ensure_editable.call(null, this__10232.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__10234, n & 31, val);
            return node__10234
          }else {
            var subidx__10235 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__10234, subidx__10235, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__10234, subidx__10235)));
            return node__10234
          }
        }.call(null, this__10232.shift, this__10232.root);
        this__10232.root = new_root__10236;
        return tcoll
      }
    }else {
      if(n === this__10232.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__10232.cnt)].join(""));
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
  var this__10237 = this;
  if(cljs.core.truth_(this__10237.root.edit)) {
    if(this__10237.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__10237.cnt) {
        this__10237.cnt = 0;
        return tcoll
      }else {
        if((this__10237.cnt - 1 & 31) > 0) {
          this__10237.cnt = this__10237.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__10238 = cljs.core.editable_array_for.call(null, tcoll, this__10237.cnt - 2);
            var new_root__10240 = function() {
              var nr__10239 = cljs.core.tv_pop_tail.call(null, tcoll, this__10237.shift, this__10237.root);
              if(nr__10239 != null) {
                return nr__10239
              }else {
                return new cljs.core.VectorNode(this__10237.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____10241 = 5 < this__10237.shift;
              if(and__3822__auto____10241) {
                return cljs.core.pv_aget.call(null, new_root__10240, 1) == null
              }else {
                return and__3822__auto____10241
              }
            }()) {
              var new_root__10242 = cljs.core.tv_ensure_editable.call(null, this__10237.root.edit, cljs.core.pv_aget.call(null, new_root__10240, 0));
              this__10237.root = new_root__10242;
              this__10237.shift = this__10237.shift - 5;
              this__10237.cnt = this__10237.cnt - 1;
              this__10237.tail = new_tail__10238;
              return tcoll
            }else {
              this__10237.root = new_root__10240;
              this__10237.cnt = this__10237.cnt - 1;
              this__10237.tail = new_tail__10238;
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
  var this__10243 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10244 = this;
  if(cljs.core.truth_(this__10244.root.edit)) {
    if(this__10244.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__10244.tail[this__10244.cnt & 31] = o;
      this__10244.cnt = this__10244.cnt + 1;
      return tcoll
    }else {
      var tail_node__10245 = new cljs.core.VectorNode(this__10244.root.edit, this__10244.tail);
      var new_tail__10246 = cljs.core.make_array.call(null, 32);
      new_tail__10246[0] = o;
      this__10244.tail = new_tail__10246;
      if(this__10244.cnt >>> 5 > 1 << this__10244.shift) {
        var new_root_array__10247 = cljs.core.make_array.call(null, 32);
        var new_shift__10248 = this__10244.shift + 5;
        new_root_array__10247[0] = this__10244.root;
        new_root_array__10247[1] = cljs.core.new_path.call(null, this__10244.root.edit, this__10244.shift, tail_node__10245);
        this__10244.root = new cljs.core.VectorNode(this__10244.root.edit, new_root_array__10247);
        this__10244.shift = new_shift__10248;
        this__10244.cnt = this__10244.cnt + 1;
        return tcoll
      }else {
        var new_root__10249 = cljs.core.tv_push_tail.call(null, tcoll, this__10244.shift, this__10244.root, tail_node__10245);
        this__10244.root = new_root__10249;
        this__10244.cnt = this__10244.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10250 = this;
  if(cljs.core.truth_(this__10250.root.edit)) {
    this__10250.root.edit = null;
    var len__10251 = this__10250.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__10252 = cljs.core.make_array.call(null, len__10251);
    cljs.core.array_copy.call(null, this__10250.tail, 0, trimmed_tail__10252, 0, len__10251);
    return new cljs.core.PersistentVector(null, this__10250.cnt, this__10250.shift, this__10250.root, trimmed_tail__10252, null)
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
  var this__10254 = this;
  var h__364__auto____10255 = this__10254.__hash;
  if(h__364__auto____10255 != null) {
    return h__364__auto____10255
  }else {
    var h__364__auto____10256 = cljs.core.hash_coll.call(null, coll);
    this__10254.__hash = h__364__auto____10256;
    return h__364__auto____10256
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10257 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__10258 = this;
  var this$__10259 = this;
  return cljs.core.pr_str.call(null, this$__10259)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10260 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10261 = this;
  return cljs.core._first.call(null, this__10261.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10262 = this;
  var temp__3971__auto____10263 = cljs.core.next.call(null, this__10262.front);
  if(cljs.core.truth_(temp__3971__auto____10263)) {
    var f1__10264 = temp__3971__auto____10263;
    return new cljs.core.PersistentQueueSeq(this__10262.meta, f1__10264, this__10262.rear, null)
  }else {
    if(this__10262.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__10262.meta, this__10262.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10266 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__10266.front, this__10266.rear, this__10266.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10267 = this;
  return this__10267.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10268 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10268.meta)
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
  var this__10269 = this;
  var h__364__auto____10270 = this__10269.__hash;
  if(h__364__auto____10270 != null) {
    return h__364__auto____10270
  }else {
    var h__364__auto____10271 = cljs.core.hash_coll.call(null, coll);
    this__10269.__hash = h__364__auto____10271;
    return h__364__auto____10271
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10272 = this;
  if(cljs.core.truth_(this__10272.front)) {
    return new cljs.core.PersistentQueue(this__10272.meta, this__10272.count + 1, this__10272.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____10273 = this__10272.rear;
      if(cljs.core.truth_(or__3824__auto____10273)) {
        return or__3824__auto____10273
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__10272.meta, this__10272.count + 1, cljs.core.conj.call(null, this__10272.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__10274 = this;
  var this$__10275 = this;
  return cljs.core.pr_str.call(null, this$__10275)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10276 = this;
  var rear__10277 = cljs.core.seq.call(null, this__10276.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____10278 = this__10276.front;
    if(cljs.core.truth_(or__3824__auto____10278)) {
      return or__3824__auto____10278
    }else {
      return rear__10277
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__10276.front, cljs.core.seq.call(null, rear__10277), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10279 = this;
  return this__10279.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10280 = this;
  return cljs.core._first.call(null, this__10280.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10281 = this;
  if(cljs.core.truth_(this__10281.front)) {
    var temp__3971__auto____10282 = cljs.core.next.call(null, this__10281.front);
    if(cljs.core.truth_(temp__3971__auto____10282)) {
      var f1__10283 = temp__3971__auto____10282;
      return new cljs.core.PersistentQueue(this__10281.meta, this__10281.count - 1, f1__10283, this__10281.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__10281.meta, this__10281.count - 1, cljs.core.seq.call(null, this__10281.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10284 = this;
  return cljs.core.first.call(null, this__10284.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10285 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10286 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10287 = this;
  return new cljs.core.PersistentQueue(meta, this__10287.count, this__10287.front, this__10287.rear, this__10287.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10288 = this;
  return this__10288.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10289 = this;
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
  var this__10290 = this;
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
  var len__10291 = array.length;
  var i__10292 = 0;
  while(true) {
    if(i__10292 < len__10291) {
      if(cljs.core._EQ_.call(null, k, array[i__10292])) {
        return i__10292
      }else {
        var G__10293 = i__10292 + incr;
        i__10292 = G__10293;
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
      var and__3822__auto____10294 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____10294)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____10294
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
  var a__10295 = cljs.core.hash.call(null, a);
  var b__10296 = cljs.core.hash.call(null, b);
  if(a__10295 < b__10296) {
    return-1
  }else {
    if(a__10295 > b__10296) {
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
  var ks__10298 = m.keys;
  var len__10299 = ks__10298.length;
  var so__10300 = m.strobj;
  var out__10301 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__10302 = 0;
  var out__10303 = cljs.core.transient$.call(null, out__10301);
  while(true) {
    if(i__10302 < len__10299) {
      var k__10304 = ks__10298[i__10302];
      var G__10305 = i__10302 + 1;
      var G__10306 = cljs.core.assoc_BANG_.call(null, out__10303, k__10304, so__10300[k__10304]);
      i__10302 = G__10305;
      out__10303 = G__10306;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__10303, k, v))
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
  var this__10311 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10312 = this;
  var h__364__auto____10313 = this__10312.__hash;
  if(h__364__auto____10313 != null) {
    return h__364__auto____10313
  }else {
    var h__364__auto____10314 = cljs.core.hash_imap.call(null, coll);
    this__10312.__hash = h__364__auto____10314;
    return h__364__auto____10314
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10315 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10316 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__10316.strobj, this__10316.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10317 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___10318 = this__10317.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___10318)) {
      var new_strobj__10319 = goog.object.clone.call(null, this__10317.strobj);
      new_strobj__10319[k] = v;
      return new cljs.core.ObjMap(this__10317.meta, this__10317.keys, new_strobj__10319, this__10317.update_count + 1, null)
    }else {
      if(this__10317.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__10320 = goog.object.clone.call(null, this__10317.strobj);
        var new_keys__10321 = cljs.core.aclone.call(null, this__10317.keys);
        new_strobj__10320[k] = v;
        new_keys__10321.push(k);
        return new cljs.core.ObjMap(this__10317.meta, new_keys__10321, new_strobj__10320, this__10317.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10322 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__10322.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__10342 = null;
  var G__10342__2 = function(tsym10309, k) {
    var this__10323 = this;
    var tsym10309__10324 = this;
    var coll__10325 = tsym10309__10324;
    return cljs.core._lookup.call(null, coll__10325, k)
  };
  var G__10342__3 = function(tsym10310, k, not_found) {
    var this__10326 = this;
    var tsym10310__10327 = this;
    var coll__10328 = tsym10310__10327;
    return cljs.core._lookup.call(null, coll__10328, k, not_found)
  };
  G__10342 = function(tsym10310, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10342__2.call(this, tsym10310, k);
      case 3:
        return G__10342__3.call(this, tsym10310, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10342
}();
cljs.core.ObjMap.prototype.apply = function(tsym10307, args10308) {
  return tsym10307.call.apply(tsym10307, [tsym10307].concat(cljs.core.aclone.call(null, args10308)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10329 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__10330 = this;
  var this$__10331 = this;
  return cljs.core.pr_str.call(null, this$__10331)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10332 = this;
  if(this__10332.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__10297_SHARP_) {
      return cljs.core.vector.call(null, p1__10297_SHARP_, this__10332.strobj[p1__10297_SHARP_])
    }, this__10332.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10333 = this;
  return this__10333.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10334 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10335 = this;
  return new cljs.core.ObjMap(meta, this__10335.keys, this__10335.strobj, this__10335.update_count, this__10335.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10336 = this;
  return this__10336.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10337 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__10337.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10338 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____10339 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____10339)) {
      return this__10338.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____10339
    }
  }())) {
    var new_keys__10340 = cljs.core.aclone.call(null, this__10338.keys);
    var new_strobj__10341 = goog.object.clone.call(null, this__10338.strobj);
    new_keys__10340.splice(cljs.core.scan_array.call(null, 1, k, new_keys__10340), 1);
    cljs.core.js_delete.call(null, new_strobj__10341, k);
    return new cljs.core.ObjMap(this__10338.meta, new_keys__10340, new_strobj__10341, this__10338.update_count + 1, null)
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
  var this__10348 = this;
  var h__364__auto____10349 = this__10348.__hash;
  if(h__364__auto____10349 != null) {
    return h__364__auto____10349
  }else {
    var h__364__auto____10350 = cljs.core.hash_imap.call(null, coll);
    this__10348.__hash = h__364__auto____10350;
    return h__364__auto____10350
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10351 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10352 = this;
  var bucket__10353 = this__10352.hashobj[cljs.core.hash.call(null, k)];
  var i__10354 = cljs.core.truth_(bucket__10353) ? cljs.core.scan_array.call(null, 2, k, bucket__10353) : null;
  if(cljs.core.truth_(i__10354)) {
    return bucket__10353[i__10354 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10355 = this;
  var h__10356 = cljs.core.hash.call(null, k);
  var bucket__10357 = this__10355.hashobj[h__10356];
  if(cljs.core.truth_(bucket__10357)) {
    var new_bucket__10358 = cljs.core.aclone.call(null, bucket__10357);
    var new_hashobj__10359 = goog.object.clone.call(null, this__10355.hashobj);
    new_hashobj__10359[h__10356] = new_bucket__10358;
    var temp__3971__auto____10360 = cljs.core.scan_array.call(null, 2, k, new_bucket__10358);
    if(cljs.core.truth_(temp__3971__auto____10360)) {
      var i__10361 = temp__3971__auto____10360;
      new_bucket__10358[i__10361 + 1] = v;
      return new cljs.core.HashMap(this__10355.meta, this__10355.count, new_hashobj__10359, null)
    }else {
      new_bucket__10358.push(k, v);
      return new cljs.core.HashMap(this__10355.meta, this__10355.count + 1, new_hashobj__10359, null)
    }
  }else {
    var new_hashobj__10362 = goog.object.clone.call(null, this__10355.hashobj);
    new_hashobj__10362[h__10356] = [k, v];
    return new cljs.core.HashMap(this__10355.meta, this__10355.count + 1, new_hashobj__10362, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10363 = this;
  var bucket__10364 = this__10363.hashobj[cljs.core.hash.call(null, k)];
  var i__10365 = cljs.core.truth_(bucket__10364) ? cljs.core.scan_array.call(null, 2, k, bucket__10364) : null;
  if(cljs.core.truth_(i__10365)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__10388 = null;
  var G__10388__2 = function(tsym10346, k) {
    var this__10366 = this;
    var tsym10346__10367 = this;
    var coll__10368 = tsym10346__10367;
    return cljs.core._lookup.call(null, coll__10368, k)
  };
  var G__10388__3 = function(tsym10347, k, not_found) {
    var this__10369 = this;
    var tsym10347__10370 = this;
    var coll__10371 = tsym10347__10370;
    return cljs.core._lookup.call(null, coll__10371, k, not_found)
  };
  G__10388 = function(tsym10347, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10388__2.call(this, tsym10347, k);
      case 3:
        return G__10388__3.call(this, tsym10347, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10388
}();
cljs.core.HashMap.prototype.apply = function(tsym10344, args10345) {
  return tsym10344.call.apply(tsym10344, [tsym10344].concat(cljs.core.aclone.call(null, args10345)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10372 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__10373 = this;
  var this$__10374 = this;
  return cljs.core.pr_str.call(null, this$__10374)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10375 = this;
  if(this__10375.count > 0) {
    var hashes__10376 = cljs.core.js_keys.call(null, this__10375.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__10343_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__10375.hashobj[p1__10343_SHARP_]))
    }, hashes__10376)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10377 = this;
  return this__10377.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10378 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10379 = this;
  return new cljs.core.HashMap(meta, this__10379.count, this__10379.hashobj, this__10379.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10380 = this;
  return this__10380.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10381 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__10381.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10382 = this;
  var h__10383 = cljs.core.hash.call(null, k);
  var bucket__10384 = this__10382.hashobj[h__10383];
  var i__10385 = cljs.core.truth_(bucket__10384) ? cljs.core.scan_array.call(null, 2, k, bucket__10384) : null;
  if(cljs.core.not.call(null, i__10385)) {
    return coll
  }else {
    var new_hashobj__10386 = goog.object.clone.call(null, this__10382.hashobj);
    if(3 > bucket__10384.length) {
      cljs.core.js_delete.call(null, new_hashobj__10386, h__10383)
    }else {
      var new_bucket__10387 = cljs.core.aclone.call(null, bucket__10384);
      new_bucket__10387.splice(i__10385, 2);
      new_hashobj__10386[h__10383] = new_bucket__10387
    }
    return new cljs.core.HashMap(this__10382.meta, this__10382.count - 1, new_hashobj__10386, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__10389 = ks.length;
  var i__10390 = 0;
  var out__10391 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__10390 < len__10389) {
      var G__10392 = i__10390 + 1;
      var G__10393 = cljs.core.assoc.call(null, out__10391, ks[i__10390], vs[i__10390]);
      i__10390 = G__10392;
      out__10391 = G__10393;
      continue
    }else {
      return out__10391
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__10394 = m.arr;
  var len__10395 = arr__10394.length;
  var i__10396 = 0;
  while(true) {
    if(len__10395 <= i__10396) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__10394[i__10396], k)) {
        return i__10396
      }else {
        if("\ufdd0'else") {
          var G__10397 = i__10396 + 2;
          i__10396 = G__10397;
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
  var this__10402 = this;
  return new cljs.core.TransientArrayMap({}, this__10402.arr.length, cljs.core.aclone.call(null, this__10402.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10403 = this;
  var h__364__auto____10404 = this__10403.__hash;
  if(h__364__auto____10404 != null) {
    return h__364__auto____10404
  }else {
    var h__364__auto____10405 = cljs.core.hash_imap.call(null, coll);
    this__10403.__hash = h__364__auto____10405;
    return h__364__auto____10405
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10406 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10407 = this;
  var idx__10408 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10408 === -1) {
    return not_found
  }else {
    return this__10407.arr[idx__10408 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10409 = this;
  var idx__10410 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10410 === -1) {
    if(this__10409.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__10409.meta, this__10409.cnt + 1, function() {
        var G__10411__10412 = cljs.core.aclone.call(null, this__10409.arr);
        G__10411__10412.push(k);
        G__10411__10412.push(v);
        return G__10411__10412
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__10409.arr[idx__10410 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__10409.meta, this__10409.cnt, function() {
          var G__10413__10414 = cljs.core.aclone.call(null, this__10409.arr);
          G__10413__10414[idx__10410 + 1] = v;
          return G__10413__10414
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10415 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__10445 = null;
  var G__10445__2 = function(tsym10400, k) {
    var this__10416 = this;
    var tsym10400__10417 = this;
    var coll__10418 = tsym10400__10417;
    return cljs.core._lookup.call(null, coll__10418, k)
  };
  var G__10445__3 = function(tsym10401, k, not_found) {
    var this__10419 = this;
    var tsym10401__10420 = this;
    var coll__10421 = tsym10401__10420;
    return cljs.core._lookup.call(null, coll__10421, k, not_found)
  };
  G__10445 = function(tsym10401, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10445__2.call(this, tsym10401, k);
      case 3:
        return G__10445__3.call(this, tsym10401, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10445
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym10398, args10399) {
  return tsym10398.call.apply(tsym10398, [tsym10398].concat(cljs.core.aclone.call(null, args10399)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10422 = this;
  var len__10423 = this__10422.arr.length;
  var i__10424 = 0;
  var init__10425 = init;
  while(true) {
    if(i__10424 < len__10423) {
      var init__10426 = f.call(null, init__10425, this__10422.arr[i__10424], this__10422.arr[i__10424 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__10426)) {
        return cljs.core.deref.call(null, init__10426)
      }else {
        var G__10446 = i__10424 + 2;
        var G__10447 = init__10426;
        i__10424 = G__10446;
        init__10425 = G__10447;
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
  var this__10427 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__10428 = this;
  var this$__10429 = this;
  return cljs.core.pr_str.call(null, this$__10429)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10430 = this;
  if(this__10430.cnt > 0) {
    var len__10431 = this__10430.arr.length;
    var array_map_seq__10432 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__10431) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__10430.arr[i], this__10430.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__10432.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10433 = this;
  return this__10433.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10434 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10435 = this;
  return new cljs.core.PersistentArrayMap(meta, this__10435.cnt, this__10435.arr, this__10435.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10436 = this;
  return this__10436.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10437 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__10437.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10438 = this;
  var idx__10439 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10439 >= 0) {
    var len__10440 = this__10438.arr.length;
    var new_len__10441 = len__10440 - 2;
    if(new_len__10441 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__10442 = cljs.core.make_array.call(null, new_len__10441);
      var s__10443 = 0;
      var d__10444 = 0;
      while(true) {
        if(s__10443 >= len__10440) {
          return new cljs.core.PersistentArrayMap(this__10438.meta, this__10438.cnt - 1, new_arr__10442, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__10438.arr[s__10443])) {
            var G__10448 = s__10443 + 2;
            var G__10449 = d__10444;
            s__10443 = G__10448;
            d__10444 = G__10449;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__10442[d__10444] = this__10438.arr[s__10443];
              new_arr__10442[d__10444 + 1] = this__10438.arr[s__10443 + 1];
              var G__10450 = s__10443 + 2;
              var G__10451 = d__10444 + 2;
              s__10443 = G__10450;
              d__10444 = G__10451;
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
  var len__10452 = cljs.core.count.call(null, ks);
  var i__10453 = 0;
  var out__10454 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__10453 < len__10452) {
      var G__10455 = i__10453 + 1;
      var G__10456 = cljs.core.assoc_BANG_.call(null, out__10454, ks[i__10453], vs[i__10453]);
      i__10453 = G__10455;
      out__10454 = G__10456;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10454)
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
  var this__10457 = this;
  if(cljs.core.truth_(this__10457.editable_QMARK_)) {
    var idx__10458 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10458 >= 0) {
      this__10457.arr[idx__10458] = this__10457.arr[this__10457.len - 2];
      this__10457.arr[idx__10458 + 1] = this__10457.arr[this__10457.len - 1];
      var G__10459__10460 = this__10457.arr;
      G__10459__10460.pop();
      G__10459__10460.pop();
      G__10459__10460;
      this__10457.len = this__10457.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10461 = this;
  if(cljs.core.truth_(this__10461.editable_QMARK_)) {
    var idx__10462 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10462 === -1) {
      if(this__10461.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__10461.len = this__10461.len + 2;
        this__10461.arr.push(key);
        this__10461.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__10461.len, this__10461.arr), key, val)
      }
    }else {
      if(val === this__10461.arr[idx__10462 + 1]) {
        return tcoll
      }else {
        this__10461.arr[idx__10462 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10463 = this;
  if(cljs.core.truth_(this__10463.editable_QMARK_)) {
    if(function() {
      var G__10464__10465 = o;
      if(G__10464__10465 != null) {
        if(function() {
          var or__3824__auto____10466 = G__10464__10465.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____10466) {
            return or__3824__auto____10466
          }else {
            return G__10464__10465.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10464__10465.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10464__10465)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10464__10465)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10467 = cljs.core.seq.call(null, o);
      var tcoll__10468 = tcoll;
      while(true) {
        var temp__3971__auto____10469 = cljs.core.first.call(null, es__10467);
        if(cljs.core.truth_(temp__3971__auto____10469)) {
          var e__10470 = temp__3971__auto____10469;
          var G__10476 = cljs.core.next.call(null, es__10467);
          var G__10477 = cljs.core._assoc_BANG_.call(null, tcoll__10468, cljs.core.key.call(null, e__10470), cljs.core.val.call(null, e__10470));
          es__10467 = G__10476;
          tcoll__10468 = G__10477;
          continue
        }else {
          return tcoll__10468
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10471 = this;
  if(cljs.core.truth_(this__10471.editable_QMARK_)) {
    this__10471.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__10471.len, 2), this__10471.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10472 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10473 = this;
  if(cljs.core.truth_(this__10473.editable_QMARK_)) {
    var idx__10474 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__10474 === -1) {
      return not_found
    }else {
      return this__10473.arr[idx__10474 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10475 = this;
  if(cljs.core.truth_(this__10475.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__10475.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__10478 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__10479 = 0;
  while(true) {
    if(i__10479 < len) {
      var G__10480 = cljs.core.assoc_BANG_.call(null, out__10478, arr[i__10479], arr[i__10479 + 1]);
      var G__10481 = i__10479 + 2;
      out__10478 = G__10480;
      i__10479 = G__10481;
      continue
    }else {
      return out__10478
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
    var G__10482__10483 = cljs.core.aclone.call(null, arr);
    G__10482__10483[i] = a;
    return G__10482__10483
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__10484__10485 = cljs.core.aclone.call(null, arr);
    G__10484__10485[i] = a;
    G__10484__10485[j] = b;
    return G__10484__10485
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
  var new_arr__10486 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__10486, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__10486, 2 * i, new_arr__10486.length - 2 * i);
  return new_arr__10486
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
    var editable__10487 = inode.ensure_editable(edit);
    editable__10487.arr[i] = a;
    return editable__10487
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__10488 = inode.ensure_editable(edit);
    editable__10488.arr[i] = a;
    editable__10488.arr[j] = b;
    return editable__10488
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
  var len__10489 = arr.length;
  var i__10490 = 0;
  var init__10491 = init;
  while(true) {
    if(i__10490 < len__10489) {
      var init__10494 = function() {
        var k__10492 = arr[i__10490];
        if(k__10492 != null) {
          return f.call(null, init__10491, k__10492, arr[i__10490 + 1])
        }else {
          var node__10493 = arr[i__10490 + 1];
          if(node__10493 != null) {
            return node__10493.kv_reduce(f, init__10491)
          }else {
            return init__10491
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10494)) {
        return cljs.core.deref.call(null, init__10494)
      }else {
        var G__10495 = i__10490 + 2;
        var G__10496 = init__10494;
        i__10490 = G__10495;
        init__10491 = G__10496;
        continue
      }
    }else {
      return init__10491
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
  var this__10497 = this;
  var inode__10498 = this;
  if(this__10497.bitmap === bit) {
    return null
  }else {
    var editable__10499 = inode__10498.ensure_editable(e);
    var earr__10500 = editable__10499.arr;
    var len__10501 = earr__10500.length;
    editable__10499.bitmap = bit ^ editable__10499.bitmap;
    cljs.core.array_copy.call(null, earr__10500, 2 * (i + 1), earr__10500, 2 * i, len__10501 - 2 * (i + 1));
    earr__10500[len__10501 - 2] = null;
    earr__10500[len__10501 - 1] = null;
    return editable__10499
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10502 = this;
  var inode__10503 = this;
  var bit__10504 = 1 << (hash >>> shift & 31);
  var idx__10505 = cljs.core.bitmap_indexed_node_index.call(null, this__10502.bitmap, bit__10504);
  if((this__10502.bitmap & bit__10504) === 0) {
    var n__10506 = cljs.core.bit_count.call(null, this__10502.bitmap);
    if(2 * n__10506 < this__10502.arr.length) {
      var editable__10507 = inode__10503.ensure_editable(edit);
      var earr__10508 = editable__10507.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__10508, 2 * idx__10505, earr__10508, 2 * (idx__10505 + 1), 2 * (n__10506 - idx__10505));
      earr__10508[2 * idx__10505] = key;
      earr__10508[2 * idx__10505 + 1] = val;
      editable__10507.bitmap = editable__10507.bitmap | bit__10504;
      return editable__10507
    }else {
      if(n__10506 >= 16) {
        var nodes__10509 = cljs.core.make_array.call(null, 32);
        var jdx__10510 = hash >>> shift & 31;
        nodes__10509[jdx__10510] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__10511 = 0;
        var j__10512 = 0;
        while(true) {
          if(i__10511 < 32) {
            if((this__10502.bitmap >>> i__10511 & 1) === 0) {
              var G__10565 = i__10511 + 1;
              var G__10566 = j__10512;
              i__10511 = G__10565;
              j__10512 = G__10566;
              continue
            }else {
              nodes__10509[i__10511] = null != this__10502.arr[j__10512] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__10502.arr[j__10512]), this__10502.arr[j__10512], this__10502.arr[j__10512 + 1], added_leaf_QMARK_) : this__10502.arr[j__10512 + 1];
              var G__10567 = i__10511 + 1;
              var G__10568 = j__10512 + 2;
              i__10511 = G__10567;
              j__10512 = G__10568;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__10506 + 1, nodes__10509)
      }else {
        if("\ufdd0'else") {
          var new_arr__10513 = cljs.core.make_array.call(null, 2 * (n__10506 + 4));
          cljs.core.array_copy.call(null, this__10502.arr, 0, new_arr__10513, 0, 2 * idx__10505);
          new_arr__10513[2 * idx__10505] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__10513[2 * idx__10505 + 1] = val;
          cljs.core.array_copy.call(null, this__10502.arr, 2 * idx__10505, new_arr__10513, 2 * (idx__10505 + 1), 2 * (n__10506 - idx__10505));
          var editable__10514 = inode__10503.ensure_editable(edit);
          editable__10514.arr = new_arr__10513;
          editable__10514.bitmap = editable__10514.bitmap | bit__10504;
          return editable__10514
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__10515 = this__10502.arr[2 * idx__10505];
    var val_or_node__10516 = this__10502.arr[2 * idx__10505 + 1];
    if(null == key_or_nil__10515) {
      var n__10517 = val_or_node__10516.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10517 === val_or_node__10516) {
        return inode__10503
      }else {
        return cljs.core.edit_and_set.call(null, inode__10503, edit, 2 * idx__10505 + 1, n__10517)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10515)) {
        if(val === val_or_node__10516) {
          return inode__10503
        }else {
          return cljs.core.edit_and_set.call(null, inode__10503, edit, 2 * idx__10505 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__10503, edit, 2 * idx__10505, null, 2 * idx__10505 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__10515, val_or_node__10516, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__10518 = this;
  var inode__10519 = this;
  return cljs.core.create_inode_seq.call(null, this__10518.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10520 = this;
  var inode__10521 = this;
  var bit__10522 = 1 << (hash >>> shift & 31);
  if((this__10520.bitmap & bit__10522) === 0) {
    return inode__10521
  }else {
    var idx__10523 = cljs.core.bitmap_indexed_node_index.call(null, this__10520.bitmap, bit__10522);
    var key_or_nil__10524 = this__10520.arr[2 * idx__10523];
    var val_or_node__10525 = this__10520.arr[2 * idx__10523 + 1];
    if(null == key_or_nil__10524) {
      var n__10526 = val_or_node__10525.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__10526 === val_or_node__10525) {
        return inode__10521
      }else {
        if(null != n__10526) {
          return cljs.core.edit_and_set.call(null, inode__10521, edit, 2 * idx__10523 + 1, n__10526)
        }else {
          if(this__10520.bitmap === bit__10522) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__10521.edit_and_remove_pair(edit, bit__10522, idx__10523)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10524)) {
        removed_leaf_QMARK_[0] = true;
        return inode__10521.edit_and_remove_pair(edit, bit__10522, idx__10523)
      }else {
        if("\ufdd0'else") {
          return inode__10521
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__10527 = this;
  var inode__10528 = this;
  if(e === this__10527.edit) {
    return inode__10528
  }else {
    var n__10529 = cljs.core.bit_count.call(null, this__10527.bitmap);
    var new_arr__10530 = cljs.core.make_array.call(null, n__10529 < 0 ? 4 : 2 * (n__10529 + 1));
    cljs.core.array_copy.call(null, this__10527.arr, 0, new_arr__10530, 0, 2 * n__10529);
    return new cljs.core.BitmapIndexedNode(e, this__10527.bitmap, new_arr__10530)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__10531 = this;
  var inode__10532 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10531.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__10569 = null;
  var G__10569__3 = function(shift, hash, key) {
    var this__10533 = this;
    var inode__10534 = this;
    var bit__10535 = 1 << (hash >>> shift & 31);
    if((this__10533.bitmap & bit__10535) === 0) {
      return null
    }else {
      var idx__10536 = cljs.core.bitmap_indexed_node_index.call(null, this__10533.bitmap, bit__10535);
      var key_or_nil__10537 = this__10533.arr[2 * idx__10536];
      var val_or_node__10538 = this__10533.arr[2 * idx__10536 + 1];
      if(null == key_or_nil__10537) {
        return val_or_node__10538.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10537)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10537, val_or_node__10538])
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
  var G__10569__4 = function(shift, hash, key, not_found) {
    var this__10539 = this;
    var inode__10540 = this;
    var bit__10541 = 1 << (hash >>> shift & 31);
    if((this__10539.bitmap & bit__10541) === 0) {
      return not_found
    }else {
      var idx__10542 = cljs.core.bitmap_indexed_node_index.call(null, this__10539.bitmap, bit__10541);
      var key_or_nil__10543 = this__10539.arr[2 * idx__10542];
      var val_or_node__10544 = this__10539.arr[2 * idx__10542 + 1];
      if(null == key_or_nil__10543) {
        return val_or_node__10544.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10543)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10543, val_or_node__10544])
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
  G__10569 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10569__3.call(this, shift, hash, key);
      case 4:
        return G__10569__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10569
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__10545 = this;
  var inode__10546 = this;
  var bit__10547 = 1 << (hash >>> shift & 31);
  if((this__10545.bitmap & bit__10547) === 0) {
    return inode__10546
  }else {
    var idx__10548 = cljs.core.bitmap_indexed_node_index.call(null, this__10545.bitmap, bit__10547);
    var key_or_nil__10549 = this__10545.arr[2 * idx__10548];
    var val_or_node__10550 = this__10545.arr[2 * idx__10548 + 1];
    if(null == key_or_nil__10549) {
      var n__10551 = val_or_node__10550.inode_without(shift + 5, hash, key);
      if(n__10551 === val_or_node__10550) {
        return inode__10546
      }else {
        if(null != n__10551) {
          return new cljs.core.BitmapIndexedNode(null, this__10545.bitmap, cljs.core.clone_and_set.call(null, this__10545.arr, 2 * idx__10548 + 1, n__10551))
        }else {
          if(this__10545.bitmap === bit__10547) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__10545.bitmap ^ bit__10547, cljs.core.remove_pair.call(null, this__10545.arr, idx__10548))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10549)) {
        return new cljs.core.BitmapIndexedNode(null, this__10545.bitmap ^ bit__10547, cljs.core.remove_pair.call(null, this__10545.arr, idx__10548))
      }else {
        if("\ufdd0'else") {
          return inode__10546
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10552 = this;
  var inode__10553 = this;
  var bit__10554 = 1 << (hash >>> shift & 31);
  var idx__10555 = cljs.core.bitmap_indexed_node_index.call(null, this__10552.bitmap, bit__10554);
  if((this__10552.bitmap & bit__10554) === 0) {
    var n__10556 = cljs.core.bit_count.call(null, this__10552.bitmap);
    if(n__10556 >= 16) {
      var nodes__10557 = cljs.core.make_array.call(null, 32);
      var jdx__10558 = hash >>> shift & 31;
      nodes__10557[jdx__10558] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__10559 = 0;
      var j__10560 = 0;
      while(true) {
        if(i__10559 < 32) {
          if((this__10552.bitmap >>> i__10559 & 1) === 0) {
            var G__10570 = i__10559 + 1;
            var G__10571 = j__10560;
            i__10559 = G__10570;
            j__10560 = G__10571;
            continue
          }else {
            nodes__10557[i__10559] = null != this__10552.arr[j__10560] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__10552.arr[j__10560]), this__10552.arr[j__10560], this__10552.arr[j__10560 + 1], added_leaf_QMARK_) : this__10552.arr[j__10560 + 1];
            var G__10572 = i__10559 + 1;
            var G__10573 = j__10560 + 2;
            i__10559 = G__10572;
            j__10560 = G__10573;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__10556 + 1, nodes__10557)
    }else {
      var new_arr__10561 = cljs.core.make_array.call(null, 2 * (n__10556 + 1));
      cljs.core.array_copy.call(null, this__10552.arr, 0, new_arr__10561, 0, 2 * idx__10555);
      new_arr__10561[2 * idx__10555] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__10561[2 * idx__10555 + 1] = val;
      cljs.core.array_copy.call(null, this__10552.arr, 2 * idx__10555, new_arr__10561, 2 * (idx__10555 + 1), 2 * (n__10556 - idx__10555));
      return new cljs.core.BitmapIndexedNode(null, this__10552.bitmap | bit__10554, new_arr__10561)
    }
  }else {
    var key_or_nil__10562 = this__10552.arr[2 * idx__10555];
    var val_or_node__10563 = this__10552.arr[2 * idx__10555 + 1];
    if(null == key_or_nil__10562) {
      var n__10564 = val_or_node__10563.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10564 === val_or_node__10563) {
        return inode__10553
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__10552.bitmap, cljs.core.clone_and_set.call(null, this__10552.arr, 2 * idx__10555 + 1, n__10564))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10562)) {
        if(val === val_or_node__10563) {
          return inode__10553
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__10552.bitmap, cljs.core.clone_and_set.call(null, this__10552.arr, 2 * idx__10555 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__10552.bitmap, cljs.core.clone_and_set.call(null, this__10552.arr, 2 * idx__10555, null, 2 * idx__10555 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__10562, val_or_node__10563, hash, key, val)))
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
  var arr__10574 = array_node.arr;
  var len__10575 = 2 * (array_node.cnt - 1);
  var new_arr__10576 = cljs.core.make_array.call(null, len__10575);
  var i__10577 = 0;
  var j__10578 = 1;
  var bitmap__10579 = 0;
  while(true) {
    if(i__10577 < len__10575) {
      if(function() {
        var and__3822__auto____10580 = i__10577 != idx;
        if(and__3822__auto____10580) {
          return null != arr__10574[i__10577]
        }else {
          return and__3822__auto____10580
        }
      }()) {
        new_arr__10576[j__10578] = arr__10574[i__10577];
        var G__10581 = i__10577 + 1;
        var G__10582 = j__10578 + 2;
        var G__10583 = bitmap__10579 | 1 << i__10577;
        i__10577 = G__10581;
        j__10578 = G__10582;
        bitmap__10579 = G__10583;
        continue
      }else {
        var G__10584 = i__10577 + 1;
        var G__10585 = j__10578;
        var G__10586 = bitmap__10579;
        i__10577 = G__10584;
        j__10578 = G__10585;
        bitmap__10579 = G__10586;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__10579, new_arr__10576)
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
  var this__10587 = this;
  var inode__10588 = this;
  var idx__10589 = hash >>> shift & 31;
  var node__10590 = this__10587.arr[idx__10589];
  if(null == node__10590) {
    return new cljs.core.ArrayNode(null, this__10587.cnt + 1, cljs.core.clone_and_set.call(null, this__10587.arr, idx__10589, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__10591 = node__10590.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10591 === node__10590) {
      return inode__10588
    }else {
      return new cljs.core.ArrayNode(null, this__10587.cnt, cljs.core.clone_and_set.call(null, this__10587.arr, idx__10589, n__10591))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__10592 = this;
  var inode__10593 = this;
  var idx__10594 = hash >>> shift & 31;
  var node__10595 = this__10592.arr[idx__10594];
  if(null != node__10595) {
    var n__10596 = node__10595.inode_without(shift + 5, hash, key);
    if(n__10596 === node__10595) {
      return inode__10593
    }else {
      if(n__10596 == null) {
        if(this__10592.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10593, null, idx__10594)
        }else {
          return new cljs.core.ArrayNode(null, this__10592.cnt - 1, cljs.core.clone_and_set.call(null, this__10592.arr, idx__10594, n__10596))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__10592.cnt, cljs.core.clone_and_set.call(null, this__10592.arr, idx__10594, n__10596))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__10593
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__10628 = null;
  var G__10628__3 = function(shift, hash, key) {
    var this__10597 = this;
    var inode__10598 = this;
    var idx__10599 = hash >>> shift & 31;
    var node__10600 = this__10597.arr[idx__10599];
    if(null != node__10600) {
      return node__10600.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__10628__4 = function(shift, hash, key, not_found) {
    var this__10601 = this;
    var inode__10602 = this;
    var idx__10603 = hash >>> shift & 31;
    var node__10604 = this__10601.arr[idx__10603];
    if(null != node__10604) {
      return node__10604.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__10628 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10628__3.call(this, shift, hash, key);
      case 4:
        return G__10628__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10628
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__10605 = this;
  var inode__10606 = this;
  return cljs.core.create_array_node_seq.call(null, this__10605.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__10607 = this;
  var inode__10608 = this;
  if(e === this__10607.edit) {
    return inode__10608
  }else {
    return new cljs.core.ArrayNode(e, this__10607.cnt, cljs.core.aclone.call(null, this__10607.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10609 = this;
  var inode__10610 = this;
  var idx__10611 = hash >>> shift & 31;
  var node__10612 = this__10609.arr[idx__10611];
  if(null == node__10612) {
    var editable__10613 = cljs.core.edit_and_set.call(null, inode__10610, edit, idx__10611, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__10613.cnt = editable__10613.cnt + 1;
    return editable__10613
  }else {
    var n__10614 = node__10612.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10614 === node__10612) {
      return inode__10610
    }else {
      return cljs.core.edit_and_set.call(null, inode__10610, edit, idx__10611, n__10614)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10615 = this;
  var inode__10616 = this;
  var idx__10617 = hash >>> shift & 31;
  var node__10618 = this__10615.arr[idx__10617];
  if(null == node__10618) {
    return inode__10616
  }else {
    var n__10619 = node__10618.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__10619 === node__10618) {
      return inode__10616
    }else {
      if(null == n__10619) {
        if(this__10615.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10616, edit, idx__10617)
        }else {
          var editable__10620 = cljs.core.edit_and_set.call(null, inode__10616, edit, idx__10617, n__10619);
          editable__10620.cnt = editable__10620.cnt - 1;
          return editable__10620
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__10616, edit, idx__10617, n__10619)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__10621 = this;
  var inode__10622 = this;
  var len__10623 = this__10621.arr.length;
  var i__10624 = 0;
  var init__10625 = init;
  while(true) {
    if(i__10624 < len__10623) {
      var node__10626 = this__10621.arr[i__10624];
      if(node__10626 != null) {
        var init__10627 = node__10626.kv_reduce(f, init__10625);
        if(cljs.core.reduced_QMARK_.call(null, init__10627)) {
          return cljs.core.deref.call(null, init__10627)
        }else {
          var G__10629 = i__10624 + 1;
          var G__10630 = init__10627;
          i__10624 = G__10629;
          init__10625 = G__10630;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__10625
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__10631 = 2 * cnt;
  var i__10632 = 0;
  while(true) {
    if(i__10632 < lim__10631) {
      if(cljs.core._EQ_.call(null, key, arr[i__10632])) {
        return i__10632
      }else {
        var G__10633 = i__10632 + 2;
        i__10632 = G__10633;
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
  var this__10634 = this;
  var inode__10635 = this;
  if(hash === this__10634.collision_hash) {
    var idx__10636 = cljs.core.hash_collision_node_find_index.call(null, this__10634.arr, this__10634.cnt, key);
    if(idx__10636 === -1) {
      var len__10637 = this__10634.arr.length;
      var new_arr__10638 = cljs.core.make_array.call(null, len__10637 + 2);
      cljs.core.array_copy.call(null, this__10634.arr, 0, new_arr__10638, 0, len__10637);
      new_arr__10638[len__10637] = key;
      new_arr__10638[len__10637 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__10634.collision_hash, this__10634.cnt + 1, new_arr__10638)
    }else {
      if(cljs.core._EQ_.call(null, this__10634.arr[idx__10636], val)) {
        return inode__10635
      }else {
        return new cljs.core.HashCollisionNode(null, this__10634.collision_hash, this__10634.cnt, cljs.core.clone_and_set.call(null, this__10634.arr, idx__10636 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__10634.collision_hash >>> shift & 31), [null, inode__10635])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__10639 = this;
  var inode__10640 = this;
  var idx__10641 = cljs.core.hash_collision_node_find_index.call(null, this__10639.arr, this__10639.cnt, key);
  if(idx__10641 === -1) {
    return inode__10640
  }else {
    if(this__10639.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__10639.collision_hash, this__10639.cnt - 1, cljs.core.remove_pair.call(null, this__10639.arr, cljs.core.quot.call(null, idx__10641, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__10668 = null;
  var G__10668__3 = function(shift, hash, key) {
    var this__10642 = this;
    var inode__10643 = this;
    var idx__10644 = cljs.core.hash_collision_node_find_index.call(null, this__10642.arr, this__10642.cnt, key);
    if(idx__10644 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__10642.arr[idx__10644])) {
        return cljs.core.PersistentVector.fromArray([this__10642.arr[idx__10644], this__10642.arr[idx__10644 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__10668__4 = function(shift, hash, key, not_found) {
    var this__10645 = this;
    var inode__10646 = this;
    var idx__10647 = cljs.core.hash_collision_node_find_index.call(null, this__10645.arr, this__10645.cnt, key);
    if(idx__10647 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__10645.arr[idx__10647])) {
        return cljs.core.PersistentVector.fromArray([this__10645.arr[idx__10647], this__10645.arr[idx__10647 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__10668 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10668__3.call(this, shift, hash, key);
      case 4:
        return G__10668__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10668
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__10648 = this;
  var inode__10649 = this;
  return cljs.core.create_inode_seq.call(null, this__10648.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__10669 = null;
  var G__10669__1 = function(e) {
    var this__10650 = this;
    var inode__10651 = this;
    if(e === this__10650.edit) {
      return inode__10651
    }else {
      var new_arr__10652 = cljs.core.make_array.call(null, 2 * (this__10650.cnt + 1));
      cljs.core.array_copy.call(null, this__10650.arr, 0, new_arr__10652, 0, 2 * this__10650.cnt);
      return new cljs.core.HashCollisionNode(e, this__10650.collision_hash, this__10650.cnt, new_arr__10652)
    }
  };
  var G__10669__3 = function(e, count, array) {
    var this__10653 = this;
    var inode__10654 = this;
    if(e === this__10653.edit) {
      this__10653.arr = array;
      this__10653.cnt = count;
      return inode__10654
    }else {
      return new cljs.core.HashCollisionNode(this__10653.edit, this__10653.collision_hash, count, array)
    }
  };
  G__10669 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__10669__1.call(this, e);
      case 3:
        return G__10669__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10669
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10655 = this;
  var inode__10656 = this;
  if(hash === this__10655.collision_hash) {
    var idx__10657 = cljs.core.hash_collision_node_find_index.call(null, this__10655.arr, this__10655.cnt, key);
    if(idx__10657 === -1) {
      if(this__10655.arr.length > 2 * this__10655.cnt) {
        var editable__10658 = cljs.core.edit_and_set.call(null, inode__10656, edit, 2 * this__10655.cnt, key, 2 * this__10655.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__10658.cnt = editable__10658.cnt + 1;
        return editable__10658
      }else {
        var len__10659 = this__10655.arr.length;
        var new_arr__10660 = cljs.core.make_array.call(null, len__10659 + 2);
        cljs.core.array_copy.call(null, this__10655.arr, 0, new_arr__10660, 0, len__10659);
        new_arr__10660[len__10659] = key;
        new_arr__10660[len__10659 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__10656.ensure_editable(edit, this__10655.cnt + 1, new_arr__10660)
      }
    }else {
      if(this__10655.arr[idx__10657 + 1] === val) {
        return inode__10656
      }else {
        return cljs.core.edit_and_set.call(null, inode__10656, edit, idx__10657 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__10655.collision_hash >>> shift & 31), [null, inode__10656, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10661 = this;
  var inode__10662 = this;
  var idx__10663 = cljs.core.hash_collision_node_find_index.call(null, this__10661.arr, this__10661.cnt, key);
  if(idx__10663 === -1) {
    return inode__10662
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__10661.cnt === 1) {
      return null
    }else {
      var editable__10664 = inode__10662.ensure_editable(edit);
      var earr__10665 = editable__10664.arr;
      earr__10665[idx__10663] = earr__10665[2 * this__10661.cnt - 2];
      earr__10665[idx__10663 + 1] = earr__10665[2 * this__10661.cnt - 1];
      earr__10665[2 * this__10661.cnt - 1] = null;
      earr__10665[2 * this__10661.cnt - 2] = null;
      editable__10664.cnt = editable__10664.cnt - 1;
      return editable__10664
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__10666 = this;
  var inode__10667 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10666.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10670 = cljs.core.hash.call(null, key1);
    if(key1hash__10670 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10670, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10671 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__10670, key1, val1, added_leaf_QMARK___10671).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___10671)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10672 = cljs.core.hash.call(null, key1);
    if(key1hash__10672 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10672, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10673 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__10672, key1, val1, added_leaf_QMARK___10673).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___10673)
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
  var this__10674 = this;
  var h__364__auto____10675 = this__10674.__hash;
  if(h__364__auto____10675 != null) {
    return h__364__auto____10675
  }else {
    var h__364__auto____10676 = cljs.core.hash_coll.call(null, coll);
    this__10674.__hash = h__364__auto____10676;
    return h__364__auto____10676
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10677 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__10678 = this;
  var this$__10679 = this;
  return cljs.core.pr_str.call(null, this$__10679)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10680 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10681 = this;
  if(this__10681.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10681.nodes[this__10681.i], this__10681.nodes[this__10681.i + 1]])
  }else {
    return cljs.core.first.call(null, this__10681.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10682 = this;
  if(this__10682.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10682.nodes, this__10682.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10682.nodes, this__10682.i, cljs.core.next.call(null, this__10682.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10683 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10684 = this;
  return new cljs.core.NodeSeq(meta, this__10684.nodes, this__10684.i, this__10684.s, this__10684.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10685 = this;
  return this__10685.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10686 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10686.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10687 = nodes.length;
      var j__10688 = i;
      while(true) {
        if(j__10688 < len__10687) {
          if(null != nodes[j__10688]) {
            return new cljs.core.NodeSeq(null, nodes, j__10688, null, null)
          }else {
            var temp__3971__auto____10689 = nodes[j__10688 + 1];
            if(cljs.core.truth_(temp__3971__auto____10689)) {
              var node__10690 = temp__3971__auto____10689;
              var temp__3971__auto____10691 = node__10690.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____10691)) {
                var node_seq__10692 = temp__3971__auto____10691;
                return new cljs.core.NodeSeq(null, nodes, j__10688 + 2, node_seq__10692, null)
              }else {
                var G__10693 = j__10688 + 2;
                j__10688 = G__10693;
                continue
              }
            }else {
              var G__10694 = j__10688 + 2;
              j__10688 = G__10694;
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
  var this__10695 = this;
  var h__364__auto____10696 = this__10695.__hash;
  if(h__364__auto____10696 != null) {
    return h__364__auto____10696
  }else {
    var h__364__auto____10697 = cljs.core.hash_coll.call(null, coll);
    this__10695.__hash = h__364__auto____10697;
    return h__364__auto____10697
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10698 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10699 = this;
  var this$__10700 = this;
  return cljs.core.pr_str.call(null, this$__10700)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10701 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10702 = this;
  return cljs.core.first.call(null, this__10702.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10703 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10703.nodes, this__10703.i, cljs.core.next.call(null, this__10703.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10704 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10705 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10705.nodes, this__10705.i, this__10705.s, this__10705.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10706 = this;
  return this__10706.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10707 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10707.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10708 = nodes.length;
      var j__10709 = i;
      while(true) {
        if(j__10709 < len__10708) {
          var temp__3971__auto____10710 = nodes[j__10709];
          if(cljs.core.truth_(temp__3971__auto____10710)) {
            var nj__10711 = temp__3971__auto____10710;
            var temp__3971__auto____10712 = nj__10711.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____10712)) {
              var ns__10713 = temp__3971__auto____10712;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10709 + 1, ns__10713, null)
            }else {
              var G__10714 = j__10709 + 1;
              j__10709 = G__10714;
              continue
            }
          }else {
            var G__10715 = j__10709 + 1;
            j__10709 = G__10715;
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
  var this__10720 = this;
  return new cljs.core.TransientHashMap({}, this__10720.root, this__10720.cnt, this__10720.has_nil_QMARK_, this__10720.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10721 = this;
  var h__364__auto____10722 = this__10721.__hash;
  if(h__364__auto____10722 != null) {
    return h__364__auto____10722
  }else {
    var h__364__auto____10723 = cljs.core.hash_imap.call(null, coll);
    this__10721.__hash = h__364__auto____10723;
    return h__364__auto____10723
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10724 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10725 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10725.has_nil_QMARK_)) {
      return this__10725.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10725.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__10725.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10726 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10727 = this__10726.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____10727)) {
        return v === this__10726.nil_val
      }else {
        return and__3822__auto____10727
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10726.meta, cljs.core.truth_(this__10726.has_nil_QMARK_) ? this__10726.cnt : this__10726.cnt + 1, this__10726.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10728 = [false];
    var new_root__10729 = (this__10726.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10726.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10728);
    if(new_root__10729 === this__10726.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10726.meta, cljs.core.truth_(added_leaf_QMARK___10728[0]) ? this__10726.cnt + 1 : this__10726.cnt, new_root__10729, this__10726.has_nil_QMARK_, this__10726.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10730 = this;
  if(k == null) {
    return this__10730.has_nil_QMARK_
  }else {
    if(this__10730.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__10730.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__10751 = null;
  var G__10751__2 = function(tsym10718, k) {
    var this__10731 = this;
    var tsym10718__10732 = this;
    var coll__10733 = tsym10718__10732;
    return cljs.core._lookup.call(null, coll__10733, k)
  };
  var G__10751__3 = function(tsym10719, k, not_found) {
    var this__10734 = this;
    var tsym10719__10735 = this;
    var coll__10736 = tsym10719__10735;
    return cljs.core._lookup.call(null, coll__10736, k, not_found)
  };
  G__10751 = function(tsym10719, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10751__2.call(this, tsym10719, k);
      case 3:
        return G__10751__3.call(this, tsym10719, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10751
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym10716, args10717) {
  return tsym10716.call.apply(tsym10716, [tsym10716].concat(cljs.core.aclone.call(null, args10717)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10737 = this;
  var init__10738 = cljs.core.truth_(this__10737.has_nil_QMARK_) ? f.call(null, init, null, this__10737.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__10738)) {
    return cljs.core.deref.call(null, init__10738)
  }else {
    if(null != this__10737.root) {
      return this__10737.root.kv_reduce(f, init__10738)
    }else {
      if("\ufdd0'else") {
        return init__10738
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10739 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__10740 = this;
  var this$__10741 = this;
  return cljs.core.pr_str.call(null, this$__10741)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10742 = this;
  if(this__10742.cnt > 0) {
    var s__10743 = null != this__10742.root ? this__10742.root.inode_seq() : null;
    if(cljs.core.truth_(this__10742.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__10742.nil_val]), s__10743)
    }else {
      return s__10743
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10744 = this;
  return this__10744.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10745 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10746 = this;
  return new cljs.core.PersistentHashMap(meta, this__10746.cnt, this__10746.root, this__10746.has_nil_QMARK_, this__10746.nil_val, this__10746.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10747 = this;
  return this__10747.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10748 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__10748.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10749 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10749.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__10749.meta, this__10749.cnt - 1, this__10749.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__10749.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__10750 = this__10749.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__10750 === this__10749.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__10749.meta, this__10749.cnt - 1, new_root__10750, this__10749.has_nil_QMARK_, this__10749.nil_val, null)
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
  var len__10752 = ks.length;
  var i__10753 = 0;
  var out__10754 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__10753 < len__10752) {
      var G__10755 = i__10753 + 1;
      var G__10756 = cljs.core.assoc_BANG_.call(null, out__10754, ks[i__10753], vs[i__10753]);
      i__10753 = G__10755;
      out__10754 = G__10756;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10754)
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
  var this__10757 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10758 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__10759 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10760 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10761 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10761.has_nil_QMARK_)) {
      return this__10761.nil_val
    }else {
      return null
    }
  }else {
    if(this__10761.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__10761.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10762 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10762.has_nil_QMARK_)) {
      return this__10762.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10762.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__10762.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10763 = this;
  if(cljs.core.truth_(this__10763.edit)) {
    return this__10763.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__10764 = this;
  var tcoll__10765 = this;
  if(cljs.core.truth_(this__10764.edit)) {
    if(function() {
      var G__10766__10767 = o;
      if(G__10766__10767 != null) {
        if(function() {
          var or__3824__auto____10768 = G__10766__10767.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____10768) {
            return or__3824__auto____10768
          }else {
            return G__10766__10767.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10766__10767.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10766__10767)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10766__10767)
      }
    }()) {
      return tcoll__10765.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10769 = cljs.core.seq.call(null, o);
      var tcoll__10770 = tcoll__10765;
      while(true) {
        var temp__3971__auto____10771 = cljs.core.first.call(null, es__10769);
        if(cljs.core.truth_(temp__3971__auto____10771)) {
          var e__10772 = temp__3971__auto____10771;
          var G__10783 = cljs.core.next.call(null, es__10769);
          var G__10784 = tcoll__10770.assoc_BANG_(cljs.core.key.call(null, e__10772), cljs.core.val.call(null, e__10772));
          es__10769 = G__10783;
          tcoll__10770 = G__10784;
          continue
        }else {
          return tcoll__10770
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__10773 = this;
  var tcoll__10774 = this;
  if(cljs.core.truth_(this__10773.edit)) {
    if(k == null) {
      if(this__10773.nil_val === v) {
      }else {
        this__10773.nil_val = v
      }
      if(cljs.core.truth_(this__10773.has_nil_QMARK_)) {
      }else {
        this__10773.count = this__10773.count + 1;
        this__10773.has_nil_QMARK_ = true
      }
      return tcoll__10774
    }else {
      var added_leaf_QMARK___10775 = [false];
      var node__10776 = (this__10773.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10773.root).inode_assoc_BANG_(this__10773.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10775);
      if(node__10776 === this__10773.root) {
      }else {
        this__10773.root = node__10776
      }
      if(cljs.core.truth_(added_leaf_QMARK___10775[0])) {
        this__10773.count = this__10773.count + 1
      }else {
      }
      return tcoll__10774
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__10777 = this;
  var tcoll__10778 = this;
  if(cljs.core.truth_(this__10777.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__10777.has_nil_QMARK_)) {
        this__10777.has_nil_QMARK_ = false;
        this__10777.nil_val = null;
        this__10777.count = this__10777.count - 1;
        return tcoll__10778
      }else {
        return tcoll__10778
      }
    }else {
      if(this__10777.root == null) {
        return tcoll__10778
      }else {
        var removed_leaf_QMARK___10779 = [false];
        var node__10780 = this__10777.root.inode_without_BANG_(this__10777.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___10779);
        if(node__10780 === this__10777.root) {
        }else {
          this__10777.root = node__10780
        }
        if(cljs.core.truth_(removed_leaf_QMARK___10779[0])) {
          this__10777.count = this__10777.count - 1
        }else {
        }
        return tcoll__10778
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__10781 = this;
  var tcoll__10782 = this;
  if(cljs.core.truth_(this__10781.edit)) {
    this__10781.edit = null;
    return new cljs.core.PersistentHashMap(null, this__10781.count, this__10781.root, this__10781.has_nil_QMARK_, this__10781.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10785 = node;
  var stack__10786 = stack;
  while(true) {
    if(t__10785 != null) {
      var G__10787 = cljs.core.truth_(ascending_QMARK_) ? t__10785.left : t__10785.right;
      var G__10788 = cljs.core.conj.call(null, stack__10786, t__10785);
      t__10785 = G__10787;
      stack__10786 = G__10788;
      continue
    }else {
      return stack__10786
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
  var this__10789 = this;
  var h__364__auto____10790 = this__10789.__hash;
  if(h__364__auto____10790 != null) {
    return h__364__auto____10790
  }else {
    var h__364__auto____10791 = cljs.core.hash_coll.call(null, coll);
    this__10789.__hash = h__364__auto____10791;
    return h__364__auto____10791
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10792 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10793 = this;
  var this$__10794 = this;
  return cljs.core.pr_str.call(null, this$__10794)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10795 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10796 = this;
  if(this__10796.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10796.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10797 = this;
  return cljs.core.peek.call(null, this__10797.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10798 = this;
  var t__10799 = cljs.core.peek.call(null, this__10798.stack);
  var next_stack__10800 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__10798.ascending_QMARK_) ? t__10799.right : t__10799.left, cljs.core.pop.call(null, this__10798.stack), this__10798.ascending_QMARK_);
  if(next_stack__10800 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10800, this__10798.ascending_QMARK_, this__10798.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10801 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10802 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10802.stack, this__10802.ascending_QMARK_, this__10802.cnt, this__10802.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10803 = this;
  return this__10803.meta
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
        var and__3822__auto____10804 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____10804) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____10804
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
        var and__3822__auto____10805 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____10805) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____10805
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
  var init__10806 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10806)) {
    return cljs.core.deref.call(null, init__10806)
  }else {
    var init__10807 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__10806) : init__10806;
    if(cljs.core.reduced_QMARK_.call(null, init__10807)) {
      return cljs.core.deref.call(null, init__10807)
    }else {
      var init__10808 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__10807) : init__10807;
      if(cljs.core.reduced_QMARK_.call(null, init__10808)) {
        return cljs.core.deref.call(null, init__10808)
      }else {
        return init__10808
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
  var this__10813 = this;
  var h__364__auto____10814 = this__10813.__hash;
  if(h__364__auto____10814 != null) {
    return h__364__auto____10814
  }else {
    var h__364__auto____10815 = cljs.core.hash_coll.call(null, coll);
    this__10813.__hash = h__364__auto____10815;
    return h__364__auto____10815
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10816 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10817 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10818 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10818.key, this__10818.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__10865 = null;
  var G__10865__2 = function(tsym10811, k) {
    var this__10819 = this;
    var tsym10811__10820 = this;
    var node__10821 = tsym10811__10820;
    return cljs.core._lookup.call(null, node__10821, k)
  };
  var G__10865__3 = function(tsym10812, k, not_found) {
    var this__10822 = this;
    var tsym10812__10823 = this;
    var node__10824 = tsym10812__10823;
    return cljs.core._lookup.call(null, node__10824, k, not_found)
  };
  G__10865 = function(tsym10812, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10865__2.call(this, tsym10812, k);
      case 3:
        return G__10865__3.call(this, tsym10812, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10865
}();
cljs.core.BlackNode.prototype.apply = function(tsym10809, args10810) {
  return tsym10809.call.apply(tsym10809, [tsym10809].concat(cljs.core.aclone.call(null, args10810)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10825 = this;
  return cljs.core.PersistentVector.fromArray([this__10825.key, this__10825.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10826 = this;
  return this__10826.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10827 = this;
  return this__10827.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10828 = this;
  var node__10829 = this;
  return ins.balance_right(node__10829)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10830 = this;
  var node__10831 = this;
  return new cljs.core.RedNode(this__10830.key, this__10830.val, this__10830.left, this__10830.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10832 = this;
  var node__10833 = this;
  return cljs.core.balance_right_del.call(null, this__10832.key, this__10832.val, this__10832.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10834 = this;
  var node__10835 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10836 = this;
  var node__10837 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10837, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10838 = this;
  var node__10839 = this;
  return cljs.core.balance_left_del.call(null, this__10838.key, this__10838.val, del, this__10838.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10840 = this;
  var node__10841 = this;
  return ins.balance_left(node__10841)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10842 = this;
  var node__10843 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10843, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10866 = null;
  var G__10866__0 = function() {
    var this__10846 = this;
    var this$__10847 = this;
    return cljs.core.pr_str.call(null, this$__10847)
  };
  G__10866 = function() {
    switch(arguments.length) {
      case 0:
        return G__10866__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10866
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10848 = this;
  var node__10849 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10849, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10850 = this;
  var node__10851 = this;
  return node__10851
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10852 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10853 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10854 = this;
  return cljs.core.list.call(null, this__10854.key, this__10854.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10856 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10857 = this;
  return this__10857.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10858 = this;
  return cljs.core.PersistentVector.fromArray([this__10858.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10859 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10859.key, this__10859.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10860 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10861 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10861.key, this__10861.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10862 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10863 = this;
  if(n === 0) {
    return this__10863.key
  }else {
    if(n === 1) {
      return this__10863.val
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
  var this__10864 = this;
  if(n === 0) {
    return this__10864.key
  }else {
    if(n === 1) {
      return this__10864.val
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
  var this__10855 = this;
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
  var this__10871 = this;
  var h__364__auto____10872 = this__10871.__hash;
  if(h__364__auto____10872 != null) {
    return h__364__auto____10872
  }else {
    var h__364__auto____10873 = cljs.core.hash_coll.call(null, coll);
    this__10871.__hash = h__364__auto____10873;
    return h__364__auto____10873
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10874 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10875 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10876 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10876.key, this__10876.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__10923 = null;
  var G__10923__2 = function(tsym10869, k) {
    var this__10877 = this;
    var tsym10869__10878 = this;
    var node__10879 = tsym10869__10878;
    return cljs.core._lookup.call(null, node__10879, k)
  };
  var G__10923__3 = function(tsym10870, k, not_found) {
    var this__10880 = this;
    var tsym10870__10881 = this;
    var node__10882 = tsym10870__10881;
    return cljs.core._lookup.call(null, node__10882, k, not_found)
  };
  G__10923 = function(tsym10870, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10923__2.call(this, tsym10870, k);
      case 3:
        return G__10923__3.call(this, tsym10870, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10923
}();
cljs.core.RedNode.prototype.apply = function(tsym10867, args10868) {
  return tsym10867.call.apply(tsym10867, [tsym10867].concat(cljs.core.aclone.call(null, args10868)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10883 = this;
  return cljs.core.PersistentVector.fromArray([this__10883.key, this__10883.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10884 = this;
  return this__10884.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10885 = this;
  return this__10885.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10886 = this;
  var node__10887 = this;
  return new cljs.core.RedNode(this__10886.key, this__10886.val, this__10886.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10888 = this;
  var node__10889 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10890 = this;
  var node__10891 = this;
  return new cljs.core.RedNode(this__10890.key, this__10890.val, this__10890.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10892 = this;
  var node__10893 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10894 = this;
  var node__10895 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10895, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10896 = this;
  var node__10897 = this;
  return new cljs.core.RedNode(this__10896.key, this__10896.val, del, this__10896.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10898 = this;
  var node__10899 = this;
  return new cljs.core.RedNode(this__10898.key, this__10898.val, ins, this__10898.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10900 = this;
  var node__10901 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10900.left)) {
    return new cljs.core.RedNode(this__10900.key, this__10900.val, this__10900.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10900.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10900.right)) {
      return new cljs.core.RedNode(this__10900.right.key, this__10900.right.val, new cljs.core.BlackNode(this__10900.key, this__10900.val, this__10900.left, this__10900.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10900.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10901, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10924 = null;
  var G__10924__0 = function() {
    var this__10904 = this;
    var this$__10905 = this;
    return cljs.core.pr_str.call(null, this$__10905)
  };
  G__10924 = function() {
    switch(arguments.length) {
      case 0:
        return G__10924__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10924
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10906 = this;
  var node__10907 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10906.right)) {
    return new cljs.core.RedNode(this__10906.key, this__10906.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10906.left, null), this__10906.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10906.left)) {
      return new cljs.core.RedNode(this__10906.left.key, this__10906.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10906.left.left, null), new cljs.core.BlackNode(this__10906.key, this__10906.val, this__10906.left.right, this__10906.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10907, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10908 = this;
  var node__10909 = this;
  return new cljs.core.BlackNode(this__10908.key, this__10908.val, this__10908.left, this__10908.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10910 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10911 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10912 = this;
  return cljs.core.list.call(null, this__10912.key, this__10912.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10914 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10915 = this;
  return this__10915.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10916 = this;
  return cljs.core.PersistentVector.fromArray([this__10916.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10917 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10917.key, this__10917.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10918 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10919 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10919.key, this__10919.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10920 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10921 = this;
  if(n === 0) {
    return this__10921.key
  }else {
    if(n === 1) {
      return this__10921.val
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
  var this__10922 = this;
  if(n === 0) {
    return this__10922.key
  }else {
    if(n === 1) {
      return this__10922.val
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
  var this__10913 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10925 = comp.call(null, k, tree.key);
    if(c__10925 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10925 < 0) {
        var ins__10926 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__10926 != null) {
          return tree.add_left(ins__10926)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10927 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__10927 != null) {
            return tree.add_right(ins__10927)
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
          var app__10928 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10928)) {
            return new cljs.core.RedNode(app__10928.key, app__10928.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10928.left), new cljs.core.RedNode(right.key, right.val, app__10928.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10928, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10929 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10929)) {
              return new cljs.core.RedNode(app__10929.key, app__10929.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10929.left, null), new cljs.core.BlackNode(right.key, right.val, app__10929.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10929, right.right, null))
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
    var c__10930 = comp.call(null, k, tree.key);
    if(c__10930 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10930 < 0) {
        var del__10931 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____10932 = del__10931 != null;
          if(or__3824__auto____10932) {
            return or__3824__auto____10932
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10931, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10931, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10933 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____10934 = del__10933 != null;
            if(or__3824__auto____10934) {
              return or__3824__auto____10934
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10933)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10933, null)
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
  var tk__10935 = tree.key;
  var c__10936 = comp.call(null, k, tk__10935);
  if(c__10936 === 0) {
    return tree.replace(tk__10935, v, tree.left, tree.right)
  }else {
    if(c__10936 < 0) {
      return tree.replace(tk__10935, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10935, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__10941 = this;
  var h__364__auto____10942 = this__10941.__hash;
  if(h__364__auto____10942 != null) {
    return h__364__auto____10942
  }else {
    var h__364__auto____10943 = cljs.core.hash_imap.call(null, coll);
    this__10941.__hash = h__364__auto____10943;
    return h__364__auto____10943
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10944 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10945 = this;
  var n__10946 = coll.entry_at(k);
  if(n__10946 != null) {
    return n__10946.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10947 = this;
  var found__10948 = [null];
  var t__10949 = cljs.core.tree_map_add.call(null, this__10947.comp, this__10947.tree, k, v, found__10948);
  if(t__10949 == null) {
    var found_node__10950 = cljs.core.nth.call(null, found__10948, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10950.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10947.comp, cljs.core.tree_map_replace.call(null, this__10947.comp, this__10947.tree, k, v), this__10947.cnt, this__10947.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10947.comp, t__10949.blacken(), this__10947.cnt + 1, this__10947.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10951 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10983 = null;
  var G__10983__2 = function(tsym10939, k) {
    var this__10952 = this;
    var tsym10939__10953 = this;
    var coll__10954 = tsym10939__10953;
    return cljs.core._lookup.call(null, coll__10954, k)
  };
  var G__10983__3 = function(tsym10940, k, not_found) {
    var this__10955 = this;
    var tsym10940__10956 = this;
    var coll__10957 = tsym10940__10956;
    return cljs.core._lookup.call(null, coll__10957, k, not_found)
  };
  G__10983 = function(tsym10940, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10983__2.call(this, tsym10940, k);
      case 3:
        return G__10983__3.call(this, tsym10940, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10983
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym10937, args10938) {
  return tsym10937.call.apply(tsym10937, [tsym10937].concat(cljs.core.aclone.call(null, args10938)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10958 = this;
  if(this__10958.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10958.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10959 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10960 = this;
  if(this__10960.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10960.tree, false, this__10960.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10961 = this;
  var this$__10962 = this;
  return cljs.core.pr_str.call(null, this$__10962)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10963 = this;
  var coll__10964 = this;
  var t__10965 = this__10963.tree;
  while(true) {
    if(t__10965 != null) {
      var c__10966 = this__10963.comp.call(null, k, t__10965.key);
      if(c__10966 === 0) {
        return t__10965
      }else {
        if(c__10966 < 0) {
          var G__10984 = t__10965.left;
          t__10965 = G__10984;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10985 = t__10965.right;
            t__10965 = G__10985;
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
  var this__10967 = this;
  if(this__10967.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10967.tree, ascending_QMARK_, this__10967.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10968 = this;
  if(this__10968.cnt > 0) {
    var stack__10969 = null;
    var t__10970 = this__10968.tree;
    while(true) {
      if(t__10970 != null) {
        var c__10971 = this__10968.comp.call(null, k, t__10970.key);
        if(c__10971 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10969, t__10970), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10971 < 0) {
              var G__10986 = cljs.core.conj.call(null, stack__10969, t__10970);
              var G__10987 = t__10970.left;
              stack__10969 = G__10986;
              t__10970 = G__10987;
              continue
            }else {
              var G__10988 = stack__10969;
              var G__10989 = t__10970.right;
              stack__10969 = G__10988;
              t__10970 = G__10989;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10971 > 0) {
                var G__10990 = cljs.core.conj.call(null, stack__10969, t__10970);
                var G__10991 = t__10970.right;
                stack__10969 = G__10990;
                t__10970 = G__10991;
                continue
              }else {
                var G__10992 = stack__10969;
                var G__10993 = t__10970.left;
                stack__10969 = G__10992;
                t__10970 = G__10993;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10969 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10969, ascending_QMARK_, -1)
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
  var this__10972 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10973 = this;
  return this__10973.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10974 = this;
  if(this__10974.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10974.tree, true, this__10974.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10975 = this;
  return this__10975.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10976 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10977 = this;
  return new cljs.core.PersistentTreeMap(this__10977.comp, this__10977.tree, this__10977.cnt, meta, this__10977.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10981 = this;
  return this__10981.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10982 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10982.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10978 = this;
  var found__10979 = [null];
  var t__10980 = cljs.core.tree_map_remove.call(null, this__10978.comp, this__10978.tree, k, found__10979);
  if(t__10980 == null) {
    if(cljs.core.nth.call(null, found__10979, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10978.comp, null, 0, this__10978.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10978.comp, t__10980.blacken(), this__10978.cnt - 1, this__10978.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__10994 = cljs.core.seq.call(null, keyvals);
    var out__10995 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__10994)) {
        var G__10996 = cljs.core.nnext.call(null, in$__10994);
        var G__10997 = cljs.core.assoc_BANG_.call(null, out__10995, cljs.core.first.call(null, in$__10994), cljs.core.second.call(null, in$__10994));
        in$__10994 = G__10996;
        out__10995 = G__10997;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10995)
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
  hash_map.cljs$lang$applyTo = function(arglist__10998) {
    var keyvals = cljs.core.seq(arglist__10998);
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
  array_map.cljs$lang$applyTo = function(arglist__10999) {
    var keyvals = cljs.core.seq(arglist__10999);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__11000 = cljs.core.seq.call(null, keyvals);
    var out__11001 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__11000)) {
        var G__11002 = cljs.core.nnext.call(null, in$__11000);
        var G__11003 = cljs.core.assoc.call(null, out__11001, cljs.core.first.call(null, in$__11000), cljs.core.second.call(null, in$__11000));
        in$__11000 = G__11002;
        out__11001 = G__11003;
        continue
      }else {
        return out__11001
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
  sorted_map.cljs$lang$applyTo = function(arglist__11004) {
    var keyvals = cljs.core.seq(arglist__11004);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__11005 = cljs.core.seq.call(null, keyvals);
    var out__11006 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__11005)) {
        var G__11007 = cljs.core.nnext.call(null, in$__11005);
        var G__11008 = cljs.core.assoc.call(null, out__11006, cljs.core.first.call(null, in$__11005), cljs.core.second.call(null, in$__11005));
        in$__11005 = G__11007;
        out__11006 = G__11008;
        continue
      }else {
        return out__11006
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__11009) {
    var comparator = cljs.core.first(arglist__11009);
    var keyvals = cljs.core.rest(arglist__11009);
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
      return cljs.core.reduce.call(null, function(p1__11010_SHARP_, p2__11011_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____11012 = p1__11010_SHARP_;
          if(cljs.core.truth_(or__3824__auto____11012)) {
            return or__3824__auto____11012
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__11011_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__11013) {
    var maps = cljs.core.seq(arglist__11013);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11016 = function(m, e) {
        var k__11014 = cljs.core.first.call(null, e);
        var v__11015 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__11014)) {
          return cljs.core.assoc.call(null, m, k__11014, f.call(null, cljs.core.get.call(null, m, k__11014), v__11015))
        }else {
          return cljs.core.assoc.call(null, m, k__11014, v__11015)
        }
      };
      var merge2__11018 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11016, function() {
          var or__3824__auto____11017 = m1;
          if(cljs.core.truth_(or__3824__auto____11017)) {
            return or__3824__auto____11017
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11018, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__11019) {
    var f = cljs.core.first(arglist__11019);
    var maps = cljs.core.rest(arglist__11019);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11020 = cljs.core.ObjMap.fromObject([], {});
  var keys__11021 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__11021)) {
      var key__11022 = cljs.core.first.call(null, keys__11021);
      var entry__11023 = cljs.core.get.call(null, map, key__11022, "\ufdd0'user/not-found");
      var G__11024 = cljs.core.not_EQ_.call(null, entry__11023, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__11020, key__11022, entry__11023) : ret__11020;
      var G__11025 = cljs.core.next.call(null, keys__11021);
      ret__11020 = G__11024;
      keys__11021 = G__11025;
      continue
    }else {
      return ret__11020
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
  var this__11031 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__11031.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11032 = this;
  var h__364__auto____11033 = this__11032.__hash;
  if(h__364__auto____11033 != null) {
    return h__364__auto____11033
  }else {
    var h__364__auto____11034 = cljs.core.hash_iset.call(null, coll);
    this__11032.__hash = h__364__auto____11034;
    return h__364__auto____11034
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11035 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11036 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11036.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__11055 = null;
  var G__11055__2 = function(tsym11029, k) {
    var this__11037 = this;
    var tsym11029__11038 = this;
    var coll__11039 = tsym11029__11038;
    return cljs.core._lookup.call(null, coll__11039, k)
  };
  var G__11055__3 = function(tsym11030, k, not_found) {
    var this__11040 = this;
    var tsym11030__11041 = this;
    var coll__11042 = tsym11030__11041;
    return cljs.core._lookup.call(null, coll__11042, k, not_found)
  };
  G__11055 = function(tsym11030, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11055__2.call(this, tsym11030, k);
      case 3:
        return G__11055__3.call(this, tsym11030, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11055
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym11027, args11028) {
  return tsym11027.call.apply(tsym11027, [tsym11027].concat(cljs.core.aclone.call(null, args11028)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11043 = this;
  return new cljs.core.PersistentHashSet(this__11043.meta, cljs.core.assoc.call(null, this__11043.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__11044 = this;
  var this$__11045 = this;
  return cljs.core.pr_str.call(null, this$__11045)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11046 = this;
  return cljs.core.keys.call(null, this__11046.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11047 = this;
  return new cljs.core.PersistentHashSet(this__11047.meta, cljs.core.dissoc.call(null, this__11047.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11048 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11049 = this;
  var and__3822__auto____11050 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11050) {
    var and__3822__auto____11051 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11051) {
      return cljs.core.every_QMARK_.call(null, function(p1__11026_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11026_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11051
    }
  }else {
    return and__3822__auto____11050
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11052 = this;
  return new cljs.core.PersistentHashSet(meta, this__11052.hash_map, this__11052.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11053 = this;
  return this__11053.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11054 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__11054.meta)
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
  var G__11073 = null;
  var G__11073__2 = function(tsym11059, k) {
    var this__11061 = this;
    var tsym11059__11062 = this;
    var tcoll__11063 = tsym11059__11062;
    if(cljs.core._lookup.call(null, this__11061.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__11073__3 = function(tsym11060, k, not_found) {
    var this__11064 = this;
    var tsym11060__11065 = this;
    var tcoll__11066 = tsym11060__11065;
    if(cljs.core._lookup.call(null, this__11064.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__11073 = function(tsym11060, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11073__2.call(this, tsym11060, k);
      case 3:
        return G__11073__3.call(this, tsym11060, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11073
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym11057, args11058) {
  return tsym11057.call.apply(tsym11057, [tsym11057].concat(cljs.core.aclone.call(null, args11058)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__11067 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__11068 = this;
  if(cljs.core._lookup.call(null, this__11068.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__11069 = this;
  return cljs.core.count.call(null, this__11069.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__11070 = this;
  this__11070.transient_map = cljs.core.dissoc_BANG_.call(null, this__11070.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__11071 = this;
  this__11071.transient_map = cljs.core.assoc_BANG_.call(null, this__11071.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__11072 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__11072.transient_map), null)
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
  var this__11078 = this;
  var h__364__auto____11079 = this__11078.__hash;
  if(h__364__auto____11079 != null) {
    return h__364__auto____11079
  }else {
    var h__364__auto____11080 = cljs.core.hash_iset.call(null, coll);
    this__11078.__hash = h__364__auto____11080;
    return h__364__auto____11080
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__11081 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__11082 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11082.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__11106 = null;
  var G__11106__2 = function(tsym11076, k) {
    var this__11083 = this;
    var tsym11076__11084 = this;
    var coll__11085 = tsym11076__11084;
    return cljs.core._lookup.call(null, coll__11085, k)
  };
  var G__11106__3 = function(tsym11077, k, not_found) {
    var this__11086 = this;
    var tsym11077__11087 = this;
    var coll__11088 = tsym11077__11087;
    return cljs.core._lookup.call(null, coll__11088, k, not_found)
  };
  G__11106 = function(tsym11077, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11106__2.call(this, tsym11077, k);
      case 3:
        return G__11106__3.call(this, tsym11077, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11106
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym11074, args11075) {
  return tsym11074.call.apply(tsym11074, [tsym11074].concat(cljs.core.aclone.call(null, args11075)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11089 = this;
  return new cljs.core.PersistentTreeSet(this__11089.meta, cljs.core.assoc.call(null, this__11089.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11090 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__11090.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__11091 = this;
  var this$__11092 = this;
  return cljs.core.pr_str.call(null, this$__11092)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__11093 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__11093.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__11094 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__11094.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__11095 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__11096 = this;
  return cljs.core._comparator.call(null, this__11096.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11097 = this;
  return cljs.core.keys.call(null, this__11097.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__11098 = this;
  return new cljs.core.PersistentTreeSet(this__11098.meta, cljs.core.dissoc.call(null, this__11098.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11099 = this;
  return cljs.core.count.call(null, this__11099.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11100 = this;
  var and__3822__auto____11101 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____11101) {
    var and__3822__auto____11102 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____11102) {
      return cljs.core.every_QMARK_.call(null, function(p1__11056_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11056_SHARP_)
      }, other)
    }else {
      return and__3822__auto____11102
    }
  }else {
    return and__3822__auto____11101
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11103 = this;
  return new cljs.core.PersistentTreeSet(meta, this__11103.tree_map, this__11103.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11104 = this;
  return this__11104.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11105 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__11105.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__11107 = cljs.core.seq.call(null, coll);
  var out__11108 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__11107))) {
      var G__11109 = cljs.core.next.call(null, in$__11107);
      var G__11110 = cljs.core.conj_BANG_.call(null, out__11108, cljs.core.first.call(null, in$__11107));
      in$__11107 = G__11109;
      out__11108 = G__11110;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__11108)
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
  sorted_set.cljs$lang$applyTo = function(arglist__11111) {
    var keys = cljs.core.seq(arglist__11111);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__11113) {
    var comparator = cljs.core.first(arglist__11113);
    var keys = cljs.core.rest(arglist__11113);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__11114 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____11115 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____11115)) {
        var e__11116 = temp__3971__auto____11115;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11116))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11114, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11112_SHARP_) {
      var temp__3971__auto____11117 = cljs.core.find.call(null, smap, p1__11112_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____11117)) {
        var e__11118 = temp__3971__auto____11117;
        return cljs.core.second.call(null, e__11118)
      }else {
        return p1__11112_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11126 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11119, seen) {
        while(true) {
          var vec__11120__11121 = p__11119;
          var f__11122 = cljs.core.nth.call(null, vec__11120__11121, 0, null);
          var xs__11123 = vec__11120__11121;
          var temp__3974__auto____11124 = cljs.core.seq.call(null, xs__11123);
          if(cljs.core.truth_(temp__3974__auto____11124)) {
            var s__11125 = temp__3974__auto____11124;
            if(cljs.core.contains_QMARK_.call(null, seen, f__11122)) {
              var G__11127 = cljs.core.rest.call(null, s__11125);
              var G__11128 = seen;
              p__11119 = G__11127;
              seen = G__11128;
              continue
            }else {
              return cljs.core.cons.call(null, f__11122, step.call(null, cljs.core.rest.call(null, s__11125), cljs.core.conj.call(null, seen, f__11122)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__11126.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__11129 = cljs.core.PersistentVector.fromArray([]);
  var s__11130 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__11130))) {
      var G__11131 = cljs.core.conj.call(null, ret__11129, cljs.core.first.call(null, s__11130));
      var G__11132 = cljs.core.next.call(null, s__11130);
      ret__11129 = G__11131;
      s__11130 = G__11132;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11129)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____11133 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____11133) {
        return or__3824__auto____11133
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__11134 = x.lastIndexOf("/");
      if(i__11134 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11134 + 1)
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
    var or__3824__auto____11135 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____11135) {
      return or__3824__auto____11135
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__11136 = x.lastIndexOf("/");
    if(i__11136 > -1) {
      return cljs.core.subs.call(null, x, 2, i__11136)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11139 = cljs.core.ObjMap.fromObject([], {});
  var ks__11140 = cljs.core.seq.call(null, keys);
  var vs__11141 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____11142 = ks__11140;
      if(cljs.core.truth_(and__3822__auto____11142)) {
        return vs__11141
      }else {
        return and__3822__auto____11142
      }
    }())) {
      var G__11143 = cljs.core.assoc.call(null, map__11139, cljs.core.first.call(null, ks__11140), cljs.core.first.call(null, vs__11141));
      var G__11144 = cljs.core.next.call(null, ks__11140);
      var G__11145 = cljs.core.next.call(null, vs__11141);
      map__11139 = G__11143;
      ks__11140 = G__11144;
      vs__11141 = G__11145;
      continue
    }else {
      return map__11139
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
    var G__11148__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11137_SHARP_, p2__11138_SHARP_) {
        return max_key.call(null, k, p1__11137_SHARP_, p2__11138_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__11148 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11148__delegate.call(this, k, x, y, more)
    };
    G__11148.cljs$lang$maxFixedArity = 3;
    G__11148.cljs$lang$applyTo = function(arglist__11149) {
      var k = cljs.core.first(arglist__11149);
      var x = cljs.core.first(cljs.core.next(arglist__11149));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11149)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11149)));
      return G__11148__delegate(k, x, y, more)
    };
    G__11148.cljs$lang$arity$variadic = G__11148__delegate;
    return G__11148
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
    var G__11150__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11146_SHARP_, p2__11147_SHARP_) {
        return min_key.call(null, k, p1__11146_SHARP_, p2__11147_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__11150 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11150__delegate.call(this, k, x, y, more)
    };
    G__11150.cljs$lang$maxFixedArity = 3;
    G__11150.cljs$lang$applyTo = function(arglist__11151) {
      var k = cljs.core.first(arglist__11151);
      var x = cljs.core.first(cljs.core.next(arglist__11151));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11151)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11151)));
      return G__11150__delegate(k, x, y, more)
    };
    G__11150.cljs$lang$arity$variadic = G__11150__delegate;
    return G__11150
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
      var temp__3974__auto____11152 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11152)) {
        var s__11153 = temp__3974__auto____11152;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__11153), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__11153)))
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
    var temp__3974__auto____11154 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11154)) {
      var s__11155 = temp__3974__auto____11154;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__11155)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11155), take_while.call(null, pred, cljs.core.rest.call(null, s__11155)))
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
    var comp__11156 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__11156.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__11157 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____11158 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____11158)) {
        var vec__11159__11160 = temp__3974__auto____11158;
        var e__11161 = cljs.core.nth.call(null, vec__11159__11160, 0, null);
        var s__11162 = vec__11159__11160;
        if(cljs.core.truth_(include__11157.call(null, e__11161))) {
          return s__11162
        }else {
          return cljs.core.next.call(null, s__11162)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11157, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11163 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____11163)) {
      var vec__11164__11165 = temp__3974__auto____11163;
      var e__11166 = cljs.core.nth.call(null, vec__11164__11165, 0, null);
      var s__11167 = vec__11164__11165;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__11166)) ? s__11167 : cljs.core.next.call(null, s__11167))
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
    var include__11168 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____11169 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____11169)) {
        var vec__11170__11171 = temp__3974__auto____11169;
        var e__11172 = cljs.core.nth.call(null, vec__11170__11171, 0, null);
        var s__11173 = vec__11170__11171;
        if(cljs.core.truth_(include__11168.call(null, e__11172))) {
          return s__11173
        }else {
          return cljs.core.next.call(null, s__11173)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__11168, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____11174 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____11174)) {
      var vec__11175__11176 = temp__3974__auto____11174;
      var e__11177 = cljs.core.nth.call(null, vec__11175__11176, 0, null);
      var s__11178 = vec__11175__11176;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__11177)) ? s__11178 : cljs.core.next.call(null, s__11178))
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
  var this__11179 = this;
  var h__364__auto____11180 = this__11179.__hash;
  if(h__364__auto____11180 != null) {
    return h__364__auto____11180
  }else {
    var h__364__auto____11181 = cljs.core.hash_coll.call(null, rng);
    this__11179.__hash = h__364__auto____11181;
    return h__364__auto____11181
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__11182 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__11183 = this;
  var this$__11184 = this;
  return cljs.core.pr_str.call(null, this$__11184)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__11185 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__11186 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__11187 = this;
  var comp__11188 = this__11187.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__11188.call(null, this__11187.start, this__11187.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__11189 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__11189.end - this__11189.start) / this__11189.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__11190 = this;
  return this__11190.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__11191 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__11191.meta, this__11191.start + this__11191.step, this__11191.end, this__11191.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__11192 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__11193 = this;
  return new cljs.core.Range(meta, this__11193.start, this__11193.end, this__11193.step, this__11193.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__11194 = this;
  return this__11194.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__11195 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__11195.start + n * this__11195.step
  }else {
    if(function() {
      var and__3822__auto____11196 = this__11195.start > this__11195.end;
      if(and__3822__auto____11196) {
        return this__11195.step === 0
      }else {
        return and__3822__auto____11196
      }
    }()) {
      return this__11195.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__11197 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__11197.start + n * this__11197.step
  }else {
    if(function() {
      var and__3822__auto____11198 = this__11197.start > this__11197.end;
      if(and__3822__auto____11198) {
        return this__11197.step === 0
      }else {
        return and__3822__auto____11198
      }
    }()) {
      return this__11197.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__11199 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11199.meta)
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
    var temp__3974__auto____11200 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11200)) {
      var s__11201 = temp__3974__auto____11200;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__11201), take_nth.call(null, n, cljs.core.drop.call(null, n, s__11201)))
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
    var temp__3974__auto____11203 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____11203)) {
      var s__11204 = temp__3974__auto____11203;
      var fst__11205 = cljs.core.first.call(null, s__11204);
      var fv__11206 = f.call(null, fst__11205);
      var run__11207 = cljs.core.cons.call(null, fst__11205, cljs.core.take_while.call(null, function(p1__11202_SHARP_) {
        return cljs.core._EQ_.call(null, fv__11206, f.call(null, p1__11202_SHARP_))
      }, cljs.core.next.call(null, s__11204)));
      return cljs.core.cons.call(null, run__11207, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__11207), s__11204))))
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
      var temp__3971__auto____11218 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____11218)) {
        var s__11219 = temp__3971__auto____11218;
        return reductions.call(null, f, cljs.core.first.call(null, s__11219), cljs.core.rest.call(null, s__11219))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11220 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____11220)) {
        var s__11221 = temp__3974__auto____11220;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__11221)), cljs.core.rest.call(null, s__11221))
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
      var G__11223 = null;
      var G__11223__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__11223__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__11223__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__11223__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__11223__4 = function() {
        var G__11224__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
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
  var juxt__2 = function(f, g) {
    return function() {
      var G__11226 = null;
      var G__11226__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__11226__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__11226__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__11226__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__11226__4 = function() {
        var G__11227__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11227 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11227__delegate.call(this, x, y, z, args)
        };
        G__11227.cljs$lang$maxFixedArity = 3;
        G__11227.cljs$lang$applyTo = function(arglist__11228) {
          var x = cljs.core.first(arglist__11228);
          var y = cljs.core.first(cljs.core.next(arglist__11228));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11228)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11228)));
          return G__11227__delegate(x, y, z, args)
        };
        G__11227.cljs$lang$arity$variadic = G__11227__delegate;
        return G__11227
      }();
      G__11226 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11226__0.call(this);
          case 1:
            return G__11226__1.call(this, x);
          case 2:
            return G__11226__2.call(this, x, y);
          case 3:
            return G__11226__3.call(this, x, y, z);
          default:
            return G__11226__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11226.cljs$lang$maxFixedArity = 3;
      G__11226.cljs$lang$applyTo = G__11226__4.cljs$lang$applyTo;
      return G__11226
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__11229 = null;
      var G__11229__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__11229__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__11229__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__11229__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__11229__4 = function() {
        var G__11230__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__11230 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11230__delegate.call(this, x, y, z, args)
        };
        G__11230.cljs$lang$maxFixedArity = 3;
        G__11230.cljs$lang$applyTo = function(arglist__11231) {
          var x = cljs.core.first(arglist__11231);
          var y = cljs.core.first(cljs.core.next(arglist__11231));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11231)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11231)));
          return G__11230__delegate(x, y, z, args)
        };
        G__11230.cljs$lang$arity$variadic = G__11230__delegate;
        return G__11230
      }();
      G__11229 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11229__0.call(this);
          case 1:
            return G__11229__1.call(this, x);
          case 2:
            return G__11229__2.call(this, x, y);
          case 3:
            return G__11229__3.call(this, x, y, z);
          default:
            return G__11229__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11229.cljs$lang$maxFixedArity = 3;
      G__11229.cljs$lang$applyTo = G__11229__4.cljs$lang$applyTo;
      return G__11229
    }()
  };
  var juxt__4 = function() {
    var G__11232__delegate = function(f, g, h, fs) {
      var fs__11222 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__11233 = null;
        var G__11233__0 = function() {
          return cljs.core.reduce.call(null, function(p1__11208_SHARP_, p2__11209_SHARP_) {
            return cljs.core.conj.call(null, p1__11208_SHARP_, p2__11209_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__11222)
        };
        var G__11233__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__11210_SHARP_, p2__11211_SHARP_) {
            return cljs.core.conj.call(null, p1__11210_SHARP_, p2__11211_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__11222)
        };
        var G__11233__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__11212_SHARP_, p2__11213_SHARP_) {
            return cljs.core.conj.call(null, p1__11212_SHARP_, p2__11213_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__11222)
        };
        var G__11233__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__11214_SHARP_, p2__11215_SHARP_) {
            return cljs.core.conj.call(null, p1__11214_SHARP_, p2__11215_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__11222)
        };
        var G__11233__4 = function() {
          var G__11234__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__11216_SHARP_, p2__11217_SHARP_) {
              return cljs.core.conj.call(null, p1__11216_SHARP_, cljs.core.apply.call(null, p2__11217_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__11222)
          };
          var G__11234 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11234__delegate.call(this, x, y, z, args)
          };
          G__11234.cljs$lang$maxFixedArity = 3;
          G__11234.cljs$lang$applyTo = function(arglist__11235) {
            var x = cljs.core.first(arglist__11235);
            var y = cljs.core.first(cljs.core.next(arglist__11235));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11235)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11235)));
            return G__11234__delegate(x, y, z, args)
          };
          G__11234.cljs$lang$arity$variadic = G__11234__delegate;
          return G__11234
        }();
        G__11233 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__11233__0.call(this);
            case 1:
              return G__11233__1.call(this, x);
            case 2:
              return G__11233__2.call(this, x, y);
            case 3:
              return G__11233__3.call(this, x, y, z);
            default:
              return G__11233__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__11233.cljs$lang$maxFixedArity = 3;
        G__11233.cljs$lang$applyTo = G__11233__4.cljs$lang$applyTo;
        return G__11233
      }()
    };
    var G__11232 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11232__delegate.call(this, f, g, h, fs)
    };
    G__11232.cljs$lang$maxFixedArity = 3;
    G__11232.cljs$lang$applyTo = function(arglist__11236) {
      var f = cljs.core.first(arglist__11236);
      var g = cljs.core.first(cljs.core.next(arglist__11236));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11236)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11236)));
      return G__11232__delegate(f, g, h, fs)
    };
    G__11232.cljs$lang$arity$variadic = G__11232__delegate;
    return G__11232
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
        var G__11238 = cljs.core.next.call(null, coll);
        coll = G__11238;
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
        var and__3822__auto____11237 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____11237)) {
          return n > 0
        }else {
          return and__3822__auto____11237
        }
      }())) {
        var G__11239 = n - 1;
        var G__11240 = cljs.core.next.call(null, coll);
        n = G__11239;
        coll = G__11240;
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
  var matches__11241 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__11241), s)) {
    if(cljs.core.count.call(null, matches__11241) === 1) {
      return cljs.core.first.call(null, matches__11241)
    }else {
      return cljs.core.vec.call(null, matches__11241)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__11242 = re.exec(s);
  if(matches__11242 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__11242) === 1) {
      return cljs.core.first.call(null, matches__11242)
    }else {
      return cljs.core.vec.call(null, matches__11242)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__11243 = cljs.core.re_find.call(null, re, s);
  var match_idx__11244 = s.search(re);
  var match_str__11245 = cljs.core.coll_QMARK_.call(null, match_data__11243) ? cljs.core.first.call(null, match_data__11243) : match_data__11243;
  var post_match__11246 = cljs.core.subs.call(null, s, match_idx__11244 + cljs.core.count.call(null, match_str__11245));
  if(cljs.core.truth_(match_data__11243)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__11243, re_seq.call(null, re, post_match__11246))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__11248__11249 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___11250 = cljs.core.nth.call(null, vec__11248__11249, 0, null);
  var flags__11251 = cljs.core.nth.call(null, vec__11248__11249, 1, null);
  var pattern__11252 = cljs.core.nth.call(null, vec__11248__11249, 2, null);
  return new RegExp(pattern__11252, flags__11251)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__11247_SHARP_) {
    return print_one.call(null, p1__11247_SHARP_, opts)
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
          var and__3822__auto____11253 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____11253)) {
            var and__3822__auto____11257 = function() {
              var G__11254__11255 = obj;
              if(G__11254__11255 != null) {
                if(function() {
                  var or__3824__auto____11256 = G__11254__11255.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____11256) {
                    return or__3824__auto____11256
                  }else {
                    return G__11254__11255.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__11254__11255.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11254__11255)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__11254__11255)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____11257)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____11257
            }
          }else {
            return and__3822__auto____11253
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____11258 = obj != null;
          if(and__3822__auto____11258) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____11258
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__11259__11260 = obj;
          if(G__11259__11260 != null) {
            if(function() {
              var or__3824__auto____11261 = G__11259__11260.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____11261) {
                return or__3824__auto____11261
              }else {
                return G__11259__11260.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__11259__11260.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11259__11260)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__11259__11260)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__11262 = cljs.core.first.call(null, objs);
  var sb__11263 = new goog.string.StringBuffer;
  var G__11264__11265 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11264__11265)) {
    var obj__11266 = cljs.core.first.call(null, G__11264__11265);
    var G__11264__11267 = G__11264__11265;
    while(true) {
      if(obj__11266 === first_obj__11262) {
      }else {
        sb__11263.append(" ")
      }
      var G__11268__11269 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11266, opts));
      if(cljs.core.truth_(G__11268__11269)) {
        var string__11270 = cljs.core.first.call(null, G__11268__11269);
        var G__11268__11271 = G__11268__11269;
        while(true) {
          sb__11263.append(string__11270);
          var temp__3974__auto____11272 = cljs.core.next.call(null, G__11268__11271);
          if(cljs.core.truth_(temp__3974__auto____11272)) {
            var G__11268__11273 = temp__3974__auto____11272;
            var G__11276 = cljs.core.first.call(null, G__11268__11273);
            var G__11277 = G__11268__11273;
            string__11270 = G__11276;
            G__11268__11271 = G__11277;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11274 = cljs.core.next.call(null, G__11264__11267);
      if(cljs.core.truth_(temp__3974__auto____11274)) {
        var G__11264__11275 = temp__3974__auto____11274;
        var G__11278 = cljs.core.first.call(null, G__11264__11275);
        var G__11279 = G__11264__11275;
        obj__11266 = G__11278;
        G__11264__11267 = G__11279;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__11263
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__11280 = cljs.core.pr_sb.call(null, objs, opts);
  sb__11280.append("\n");
  return[cljs.core.str(sb__11280)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__11281 = cljs.core.first.call(null, objs);
  var G__11282__11283 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11282__11283)) {
    var obj__11284 = cljs.core.first.call(null, G__11282__11283);
    var G__11282__11285 = G__11282__11283;
    while(true) {
      if(obj__11284 === first_obj__11281) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__11286__11287 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11284, opts));
      if(cljs.core.truth_(G__11286__11287)) {
        var string__11288 = cljs.core.first.call(null, G__11286__11287);
        var G__11286__11289 = G__11286__11287;
        while(true) {
          cljs.core.string_print.call(null, string__11288);
          var temp__3974__auto____11290 = cljs.core.next.call(null, G__11286__11289);
          if(cljs.core.truth_(temp__3974__auto____11290)) {
            var G__11286__11291 = temp__3974__auto____11290;
            var G__11294 = cljs.core.first.call(null, G__11286__11291);
            var G__11295 = G__11286__11291;
            string__11288 = G__11294;
            G__11286__11289 = G__11295;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____11292 = cljs.core.next.call(null, G__11282__11285);
      if(cljs.core.truth_(temp__3974__auto____11292)) {
        var G__11282__11293 = temp__3974__auto____11292;
        var G__11296 = cljs.core.first.call(null, G__11282__11293);
        var G__11297 = G__11282__11293;
        obj__11284 = G__11296;
        G__11282__11285 = G__11297;
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
  pr_str.cljs$lang$applyTo = function(arglist__11298) {
    var objs = cljs.core.seq(arglist__11298);
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
  prn_str.cljs$lang$applyTo = function(arglist__11299) {
    var objs = cljs.core.seq(arglist__11299);
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
  pr.cljs$lang$applyTo = function(arglist__11300) {
    var objs = cljs.core.seq(arglist__11300);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__11301) {
    var objs = cljs.core.seq(arglist__11301);
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
  print_str.cljs$lang$applyTo = function(arglist__11302) {
    var objs = cljs.core.seq(arglist__11302);
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
  println.cljs$lang$applyTo = function(arglist__11303) {
    var objs = cljs.core.seq(arglist__11303);
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
  println_str.cljs$lang$applyTo = function(arglist__11304) {
    var objs = cljs.core.seq(arglist__11304);
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
  prn.cljs$lang$applyTo = function(arglist__11305) {
    var objs = cljs.core.seq(arglist__11305);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11306 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11306, "{", ", ", "}", opts, coll)
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
  var pr_pair__11307 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11307, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__11308 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11308, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____11309 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____11309)) {
        var nspc__11310 = temp__3974__auto____11309;
        return[cljs.core.str(nspc__11310), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____11311 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____11311)) {
          var nspc__11312 = temp__3974__auto____11311;
          return[cljs.core.str(nspc__11312), cljs.core.str("/")].join("")
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
  var pr_pair__11313 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11313, "{", ", ", "}", opts, coll)
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
  var pr_pair__11314 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11314, "{", ", ", "}", opts, coll)
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
  var this__11315 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__11316 = this;
  var G__11317__11318 = cljs.core.seq.call(null, this__11316.watches);
  if(cljs.core.truth_(G__11317__11318)) {
    var G__11320__11322 = cljs.core.first.call(null, G__11317__11318);
    var vec__11321__11323 = G__11320__11322;
    var key__11324 = cljs.core.nth.call(null, vec__11321__11323, 0, null);
    var f__11325 = cljs.core.nth.call(null, vec__11321__11323, 1, null);
    var G__11317__11326 = G__11317__11318;
    var G__11320__11327 = G__11320__11322;
    var G__11317__11328 = G__11317__11326;
    while(true) {
      var vec__11329__11330 = G__11320__11327;
      var key__11331 = cljs.core.nth.call(null, vec__11329__11330, 0, null);
      var f__11332 = cljs.core.nth.call(null, vec__11329__11330, 1, null);
      var G__11317__11333 = G__11317__11328;
      f__11332.call(null, key__11331, this$, oldval, newval);
      var temp__3974__auto____11334 = cljs.core.next.call(null, G__11317__11333);
      if(cljs.core.truth_(temp__3974__auto____11334)) {
        var G__11317__11335 = temp__3974__auto____11334;
        var G__11342 = cljs.core.first.call(null, G__11317__11335);
        var G__11343 = G__11317__11335;
        G__11320__11327 = G__11342;
        G__11317__11328 = G__11343;
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
  var this__11336 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11336.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__11337 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11337.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__11338 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__11338.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__11339 = this;
  return this__11339.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11340 = this;
  return this__11340.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__11341 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__11350__delegate = function(x, p__11344) {
      var map__11345__11346 = p__11344;
      var map__11345__11347 = cljs.core.seq_QMARK_.call(null, map__11345__11346) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11345__11346) : map__11345__11346;
      var validator__11348 = cljs.core.get.call(null, map__11345__11347, "\ufdd0'validator");
      var meta__11349 = cljs.core.get.call(null, map__11345__11347, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__11349, validator__11348, null)
    };
    var G__11350 = function(x, var_args) {
      var p__11344 = null;
      if(goog.isDef(var_args)) {
        p__11344 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11350__delegate.call(this, x, p__11344)
    };
    G__11350.cljs$lang$maxFixedArity = 1;
    G__11350.cljs$lang$applyTo = function(arglist__11351) {
      var x = cljs.core.first(arglist__11351);
      var p__11344 = cljs.core.rest(arglist__11351);
      return G__11350__delegate(x, p__11344)
    };
    G__11350.cljs$lang$arity$variadic = G__11350__delegate;
    return G__11350
  }();
  atom = function(x, var_args) {
    var p__11344 = var_args;
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
  var temp__3974__auto____11352 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____11352)) {
    var validate__11353 = temp__3974__auto____11352;
    if(cljs.core.truth_(validate__11353.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__11354 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__11354, new_value);
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
    var G__11355__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__11355 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11355__delegate.call(this, a, f, x, y, z, more)
    };
    G__11355.cljs$lang$maxFixedArity = 5;
    G__11355.cljs$lang$applyTo = function(arglist__11356) {
      var a = cljs.core.first(arglist__11356);
      var f = cljs.core.first(cljs.core.next(arglist__11356));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11356)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11356))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11356)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11356)))));
      return G__11355__delegate(a, f, x, y, z, more)
    };
    G__11355.cljs$lang$arity$variadic = G__11355__delegate;
    return G__11355
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__11357) {
    var iref = cljs.core.first(arglist__11357);
    var f = cljs.core.first(cljs.core.next(arglist__11357));
    var args = cljs.core.rest(cljs.core.next(arglist__11357));
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
  var this__11358 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__11358.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__11359 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__11359.state, function(p__11360) {
    var curr_state__11361 = p__11360;
    var curr_state__11362 = cljs.core.seq_QMARK_.call(null, curr_state__11361) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__11361) : curr_state__11361;
    var done__11363 = cljs.core.get.call(null, curr_state__11362, "\ufdd0'done");
    if(cljs.core.truth_(done__11363)) {
      return curr_state__11362
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__11359.f.call(null)})
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
    var map__11364__11365 = options;
    var map__11364__11366 = cljs.core.seq_QMARK_.call(null, map__11364__11365) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11364__11365) : map__11364__11365;
    var keywordize_keys__11367 = cljs.core.get.call(null, map__11364__11366, "\ufdd0'keywordize-keys");
    var keyfn__11368 = cljs.core.truth_(keywordize_keys__11367) ? cljs.core.keyword : cljs.core.str;
    var f__11374 = function thisfn(x) {
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
                var iter__625__auto____11373 = function iter__11369(s__11370) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11370__11371 = s__11370;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__11370__11371))) {
                        var k__11372 = cljs.core.first.call(null, s__11370__11371);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__11368.call(null, k__11372), thisfn.call(null, x[k__11372])]), iter__11369.call(null, cljs.core.rest.call(null, s__11370__11371)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____11373.call(null, cljs.core.js_keys.call(null, x))
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
    return f__11374.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11375) {
    var x = cljs.core.first(arglist__11375);
    var options = cljs.core.rest(arglist__11375);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11376 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__11380__delegate = function(args) {
      var temp__3971__auto____11377 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__11376), args);
      if(cljs.core.truth_(temp__3971__auto____11377)) {
        var v__11378 = temp__3971__auto____11377;
        return v__11378
      }else {
        var ret__11379 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11376, cljs.core.assoc, args, ret__11379);
        return ret__11379
      }
    };
    var G__11380 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11380__delegate.call(this, args)
    };
    G__11380.cljs$lang$maxFixedArity = 0;
    G__11380.cljs$lang$applyTo = function(arglist__11381) {
      var args = cljs.core.seq(arglist__11381);
      return G__11380__delegate(args)
    };
    G__11380.cljs$lang$arity$variadic = G__11380__delegate;
    return G__11380
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__11382 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__11382)) {
        var G__11383 = ret__11382;
        f = G__11383;
        continue
      }else {
        return ret__11382
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__11384__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11384 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11384__delegate.call(this, f, args)
    };
    G__11384.cljs$lang$maxFixedArity = 1;
    G__11384.cljs$lang$applyTo = function(arglist__11385) {
      var f = cljs.core.first(arglist__11385);
      var args = cljs.core.rest(arglist__11385);
      return G__11384__delegate(f, args)
    };
    G__11384.cljs$lang$arity$variadic = G__11384__delegate;
    return G__11384
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
    var k__11386 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11386, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__11386, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3824__auto____11387 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____11387) {
      return or__3824__auto____11387
    }else {
      var or__3824__auto____11388 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____11388) {
        return or__3824__auto____11388
      }else {
        var and__3822__auto____11389 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____11389) {
          var and__3822__auto____11390 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____11390) {
            var and__3822__auto____11391 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____11391) {
              var ret__11392 = true;
              var i__11393 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____11394 = cljs.core.not.call(null, ret__11392);
                  if(or__3824__auto____11394) {
                    return or__3824__auto____11394
                  }else {
                    return i__11393 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__11392
                }else {
                  var G__11395 = isa_QMARK_.call(null, h, child.call(null, i__11393), parent.call(null, i__11393));
                  var G__11396 = i__11393 + 1;
                  ret__11392 = G__11395;
                  i__11393 = G__11396;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____11391
            }
          }else {
            return and__3822__auto____11390
          }
        }else {
          return and__3822__auto____11389
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
    var tp__11400 = "\ufdd0'parents".call(null, h);
    var td__11401 = "\ufdd0'descendants".call(null, h);
    var ta__11402 = "\ufdd0'ancestors".call(null, h);
    var tf__11403 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____11404 = cljs.core.contains_QMARK_.call(null, tp__11400.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__11402.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__11402.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__11400, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__11403.call(null, "\ufdd0'ancestors".call(null, h), tag, td__11401, parent, ta__11402), "\ufdd0'descendants":tf__11403.call(null, "\ufdd0'descendants".call(null, h), parent, ta__11402, tag, td__11401)})
    }();
    if(cljs.core.truth_(or__3824__auto____11404)) {
      return or__3824__auto____11404
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
    var parentMap__11405 = "\ufdd0'parents".call(null, h);
    var childsParents__11406 = cljs.core.truth_(parentMap__11405.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11405.call(null, tag), parent) : cljs.core.set([]);
    var newParents__11407 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11406)) ? cljs.core.assoc.call(null, parentMap__11405, tag, childsParents__11406) : cljs.core.dissoc.call(null, parentMap__11405, tag);
    var deriv_seq__11408 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11397_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11397_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11397_SHARP_), cljs.core.second.call(null, p1__11397_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11407)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11405.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__11398_SHARP_, p2__11399_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11398_SHARP_, p2__11399_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11408))
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
  var xprefs__11409 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____11411 = cljs.core.truth_(function() {
    var and__3822__auto____11410 = xprefs__11409;
    if(cljs.core.truth_(and__3822__auto____11410)) {
      return xprefs__11409.call(null, y)
    }else {
      return and__3822__auto____11410
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____11411)) {
    return or__3824__auto____11411
  }else {
    var or__3824__auto____11413 = function() {
      var ps__11412 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11412) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11412), prefer_table))) {
          }else {
          }
          var G__11416 = cljs.core.rest.call(null, ps__11412);
          ps__11412 = G__11416;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11413)) {
      return or__3824__auto____11413
    }else {
      var or__3824__auto____11415 = function() {
        var ps__11414 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11414) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11414), y, prefer_table))) {
            }else {
            }
            var G__11417 = cljs.core.rest.call(null, ps__11414);
            ps__11414 = G__11417;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____11415)) {
        return or__3824__auto____11415
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____11418 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____11418)) {
    return or__3824__auto____11418
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11427 = cljs.core.reduce.call(null, function(be, p__11419) {
    var vec__11420__11421 = p__11419;
    var k__11422 = cljs.core.nth.call(null, vec__11420__11421, 0, null);
    var ___11423 = cljs.core.nth.call(null, vec__11420__11421, 1, null);
    var e__11424 = vec__11420__11421;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11422)) {
      var be2__11426 = cljs.core.truth_(function() {
        var or__3824__auto____11425 = be == null;
        if(or__3824__auto____11425) {
          return or__3824__auto____11425
        }else {
          return cljs.core.dominates.call(null, k__11422, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11424 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11426), k__11422, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11422), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11426)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11426
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11427)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11427));
      return cljs.core.second.call(null, best_entry__11427)
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
    var and__3822__auto____11428 = mf;
    if(and__3822__auto____11428) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____11428
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11429 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11429) {
        return or__3824__auto____11429
      }else {
        var or__3824__auto____11430 = cljs.core._reset["_"];
        if(or__3824__auto____11430) {
          return or__3824__auto____11430
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____11431 = mf;
    if(and__3822__auto____11431) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____11431
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____11432 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11432) {
        return or__3824__auto____11432
      }else {
        var or__3824__auto____11433 = cljs.core._add_method["_"];
        if(or__3824__auto____11433) {
          return or__3824__auto____11433
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11434 = mf;
    if(and__3822__auto____11434) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____11434
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____11435 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11435) {
        return or__3824__auto____11435
      }else {
        var or__3824__auto____11436 = cljs.core._remove_method["_"];
        if(or__3824__auto____11436) {
          return or__3824__auto____11436
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____11437 = mf;
    if(and__3822__auto____11437) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____11437
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____11438 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11438) {
        return or__3824__auto____11438
      }else {
        var or__3824__auto____11439 = cljs.core._prefer_method["_"];
        if(or__3824__auto____11439) {
          return or__3824__auto____11439
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____11440 = mf;
    if(and__3822__auto____11440) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____11440
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____11441 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11441) {
        return or__3824__auto____11441
      }else {
        var or__3824__auto____11442 = cljs.core._get_method["_"];
        if(or__3824__auto____11442) {
          return or__3824__auto____11442
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____11443 = mf;
    if(and__3822__auto____11443) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____11443
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11444 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11444) {
        return or__3824__auto____11444
      }else {
        var or__3824__auto____11445 = cljs.core._methods["_"];
        if(or__3824__auto____11445) {
          return or__3824__auto____11445
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____11446 = mf;
    if(and__3822__auto____11446) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____11446
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____11447 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11447) {
        return or__3824__auto____11447
      }else {
        var or__3824__auto____11448 = cljs.core._prefers["_"];
        if(or__3824__auto____11448) {
          return or__3824__auto____11448
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____11449 = mf;
    if(and__3822__auto____11449) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____11449
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____11450 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____11450) {
        return or__3824__auto____11450
      }else {
        var or__3824__auto____11451 = cljs.core._dispatch["_"];
        if(or__3824__auto____11451) {
          return or__3824__auto____11451
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11452 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11453 = cljs.core._get_method.call(null, mf, dispatch_val__11452);
  if(cljs.core.truth_(target_fn__11453)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__11452)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__11453, args)
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
  var this__11454 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__11455 = this;
  cljs.core.swap_BANG_.call(null, this__11455.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11455.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11455.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11455.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__11456 = this;
  cljs.core.swap_BANG_.call(null, this__11456.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11456.method_cache, this__11456.method_table, this__11456.cached_hierarchy, this__11456.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__11457 = this;
  cljs.core.swap_BANG_.call(null, this__11457.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11457.method_cache, this__11457.method_table, this__11457.cached_hierarchy, this__11457.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__11458 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11458.cached_hierarchy), cljs.core.deref.call(null, this__11458.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__11458.method_cache, this__11458.method_table, this__11458.cached_hierarchy, this__11458.hierarchy)
  }
  var temp__3971__auto____11459 = cljs.core.deref.call(null, this__11458.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____11459)) {
    var target_fn__11460 = temp__3971__auto____11459;
    return target_fn__11460
  }else {
    var temp__3971__auto____11461 = cljs.core.find_and_cache_best_method.call(null, this__11458.name, dispatch_val, this__11458.hierarchy, this__11458.method_table, this__11458.prefer_table, this__11458.method_cache, this__11458.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____11461)) {
      var target_fn__11462 = temp__3971__auto____11461;
      return target_fn__11462
    }else {
      return cljs.core.deref.call(null, this__11458.method_table).call(null, this__11458.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11463 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11463.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11463.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11463.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11463.method_cache, this__11463.method_table, this__11463.cached_hierarchy, this__11463.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11464 = this;
  return cljs.core.deref.call(null, this__11464.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11465 = this;
  return cljs.core.deref.call(null, this__11465.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11466 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11466.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11467__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__11467 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11467__delegate.call(this, _, args)
  };
  G__11467.cljs$lang$maxFixedArity = 1;
  G__11467.cljs$lang$applyTo = function(arglist__11468) {
    var _ = cljs.core.first(arglist__11468);
    var args = cljs.core.rest(arglist__11468);
    return G__11467__delegate(_, args)
  };
  G__11467.cljs$lang$arity$variadic = G__11467__delegate;
  return G__11467
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
      var s__9090 = s;
      var limit__9091 = limit;
      var parts__9092 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__9091, 1)) {
          return cljs.core.conj.call(null, parts__9092, s__9090)
        }else {
          var temp__3971__auto____9093 = cljs.core.re_find.call(null, re, s__9090);
          if(cljs.core.truth_(temp__3971__auto____9093)) {
            var m__9094 = temp__3971__auto____9093;
            var index__9095 = s__9090.indexOf(m__9094);
            var G__9096 = s__9090.substring(index__9095 + cljs.core.count.call(null, m__9094));
            var G__9097 = limit__9091 - 1;
            var G__9098 = cljs.core.conj.call(null, parts__9092, s__9090.substring(0, index__9095));
            s__9090 = G__9096;
            limit__9091 = G__9097;
            parts__9092 = G__9098;
            continue
          }else {
            return cljs.core.conj.call(null, parts__9092, s__9090)
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
  var index__9099 = s.length;
  while(true) {
    if(index__9099 === 0) {
      return""
    }else {
      var ch__9100 = cljs.core.get.call(null, s, index__9099 - 1);
      if(function() {
        var or__3824__auto____9101 = cljs.core._EQ_.call(null, ch__9100, "\n");
        if(or__3824__auto____9101) {
          return or__3824__auto____9101
        }else {
          return cljs.core._EQ_.call(null, ch__9100, "\r")
        }
      }()) {
        var G__9102 = index__9099 - 1;
        index__9099 = G__9102;
        continue
      }else {
        return s.substring(0, index__9099)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__9103 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____9104 = cljs.core.not.call(null, s__9103);
    if(or__3824__auto____9104) {
      return or__3824__auto____9104
    }else {
      var or__3824__auto____9105 = cljs.core._EQ_.call(null, "", s__9103);
      if(or__3824__auto____9105) {
        return or__3824__auto____9105
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__9103)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__9106 = new goog.string.StringBuffer;
  var length__9107 = s.length;
  var index__9108 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__9107, index__9108)) {
      return buffer__9106.toString()
    }else {
      var ch__9109 = s.charAt(index__9108);
      var temp__3971__auto____9110 = cljs.core.get.call(null, cmap, ch__9109);
      if(cljs.core.truth_(temp__3971__auto____9110)) {
        var replacement__9111 = temp__3971__auto____9110;
        buffer__9106.append([cljs.core.str(replacement__9111)].join(""))
      }else {
        buffer__9106.append(ch__9109)
      }
      var G__9112 = index__9108 + 1;
      index__9108 = G__9112;
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
      var or__3824__auto____9074 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____9074) {
        return or__3824__auto____9074
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
    var G__9075__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9076 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__9077 = cljs.core.next.call(null, more);
            s = G__9076;
            more = G__9077;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__9075 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9075__delegate.call(this, x, xs)
    };
    G__9075.cljs$lang$maxFixedArity = 1;
    G__9075.cljs$lang$applyTo = function(arglist__9078) {
      var x = cljs.core.first(arglist__9078);
      var xs = cljs.core.rest(arglist__9078);
      return G__9075__delegate(x, xs)
    };
    G__9075.cljs$lang$arity$variadic = G__9075__delegate;
    return G__9075
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
    var iter__625__auto____9086 = function iter__9079(s__9080) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__9080__9081 = s__9080;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__9080__9081))) {
            var vec__9082__9083 = cljs.core.first.call(null, s__9080__9081);
            var k__9084 = cljs.core.nth.call(null, vec__9082__9083, 0, null);
            var v__9085 = cljs.core.nth.call(null, vec__9082__9083, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__9084)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__9085))].join(""), iter__9079.call(null, cljs.core.rest.call(null, s__9080__9081)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____9086.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__9087 = cljs.core.last.call(null, args);
    var args__9088 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__9088)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__9087) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__9087))].join("") : params__9087)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__9089) {
    var args = cljs.core.seq(arglist__9089);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__11577 = {};
  var G__11578__11579 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__11578__11579)) {
    var G__11581__11583 = cljs.core.first.call(null, G__11578__11579);
    var vec__11582__11584 = G__11581__11583;
    var k__11585 = cljs.core.nth.call(null, vec__11582__11584, 0, null);
    var v__11586 = cljs.core.nth.call(null, vec__11582__11584, 1, null);
    var G__11578__11587 = G__11578__11579;
    var G__11581__11588 = G__11581__11583;
    var G__11578__11589 = G__11578__11587;
    while(true) {
      var vec__11590__11591 = G__11581__11588;
      var k__11592 = cljs.core.nth.call(null, vec__11590__11591, 0, null);
      var v__11593 = cljs.core.nth.call(null, vec__11590__11591, 1, null);
      var G__11578__11594 = G__11578__11589;
      out__11577[cljs.core.name.call(null, k__11592)] = v__11593;
      var temp__3974__auto____11595 = cljs.core.next.call(null, G__11578__11594);
      if(cljs.core.truth_(temp__3974__auto____11595)) {
        var G__11578__11596 = temp__3974__auto____11595;
        var G__11597 = cljs.core.first.call(null, G__11578__11596);
        var G__11598 = G__11578__11596;
        G__11581__11588 = G__11597;
        G__11578__11589 = G__11598;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__11577
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__11599 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__11599)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__11600) {
    var v = cljs.core.first(arglist__11600);
    var text = cljs.core.rest(arglist__11600);
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
        return cljs.core.reduce.call(null, function(m, p__11601) {
          var vec__11602__11603 = p__11601;
          var k__11604 = cljs.core.nth.call(null, vec__11602__11603, 0, null);
          var v__11605 = cljs.core.nth.call(null, vec__11602__11603, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__11604), clj__GT_js.call(null, v__11605))
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
      var temp__3971__auto____11469 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____11469)) {
        var cm__11470 = temp__3971__auto____11469;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__11470), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__11471) {
    var vec__11472__11473 = p__11471;
    var context__11474 = cljs.core.nth.call(null, vec__11472__11473, 0, null);
    if(cljs.core.not.call(null, context__11474)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__11474)
    }
  };
  var $ = function(sel, var_args) {
    var p__11471 = null;
    if(goog.isDef(var_args)) {
      p__11471 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__11471)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__11475) {
    var sel = cljs.core.first(arglist__11475);
    var p__11471 = cljs.core.rest(arglist__11475);
    return $__delegate(sel, p__11471)
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
  var or__3824__auto____11476 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____11476)) {
    return or__3824__auto____11476
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
  var G__11477 = null;
  var G__11477__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__11477__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__11477 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11477__2.call(this, _, k);
      case 3:
        return G__11477__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11477
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
  var attr__delegate = function($elem, a, p__11478) {
    var vec__11479__11480 = p__11478;
    var v__11481 = cljs.core.nth.call(null, vec__11479__11480, 0, null);
    var a__11482 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__11481)) {
      return $elem.attr(a__11482)
    }else {
      return $elem.attr(a__11482, v__11481)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__11478 = null;
    if(goog.isDef(var_args)) {
      p__11478 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__11478)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__11483) {
    var $elem = cljs.core.first(arglist__11483);
    var a = cljs.core.first(cljs.core.next(arglist__11483));
    var p__11478 = cljs.core.rest(cljs.core.next(arglist__11483));
    return attr__delegate($elem, a, p__11478)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__11484) {
    var vec__11485__11486 = p__11484;
    var v__11487 = cljs.core.nth.call(null, vec__11485__11486, 0, null);
    var k__11488 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__11487)) {
      return $elem.data(k__11488)
    }else {
      return $elem.data(k__11488, v__11487)
    }
  };
  var data = function($elem, k, var_args) {
    var p__11484 = null;
    if(goog.isDef(var_args)) {
      p__11484 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__11484)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__11489) {
    var $elem = cljs.core.first(arglist__11489);
    var k = cljs.core.first(cljs.core.next(arglist__11489));
    var p__11484 = cljs.core.rest(cljs.core.next(arglist__11489));
    return data__delegate($elem, k, p__11484)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__11490 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__11490)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__11491 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__11491)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__11492 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__11492)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__11493 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__11493)
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
  var hide__delegate = function($elem, p__11494) {
    var vec__11495__11496 = p__11494;
    var speed__11497 = cljs.core.nth.call(null, vec__11495__11496, 0, null);
    var on_finish__11498 = cljs.core.nth.call(null, vec__11495__11496, 1, null);
    return $elem.hide(speed__11497, on_finish__11498)
  };
  var hide = function($elem, var_args) {
    var p__11494 = null;
    if(goog.isDef(var_args)) {
      p__11494 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__11494)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__11499) {
    var $elem = cljs.core.first(arglist__11499);
    var p__11494 = cljs.core.rest(arglist__11499);
    return hide__delegate($elem, p__11494)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__11500) {
    var vec__11501__11502 = p__11500;
    var speed__11503 = cljs.core.nth.call(null, vec__11501__11502, 0, null);
    var on_finish__11504 = cljs.core.nth.call(null, vec__11501__11502, 1, null);
    return $elem.show(speed__11503, on_finish__11504)
  };
  var show = function($elem, var_args) {
    var p__11500 = null;
    if(goog.isDef(var_args)) {
      p__11500 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__11500)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__11505) {
    var $elem = cljs.core.first(arglist__11505);
    var p__11500 = cljs.core.rest(arglist__11505);
    return show__delegate($elem, p__11500)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__11506) {
    var vec__11507__11508 = p__11506;
    var speed__11509 = cljs.core.nth.call(null, vec__11507__11508, 0, null);
    var on_finish__11510 = cljs.core.nth.call(null, vec__11507__11508, 1, null);
    return $elem.toggle(speed__11509, on_finish__11510)
  };
  var toggle = function($elem, var_args) {
    var p__11506 = null;
    if(goog.isDef(var_args)) {
      p__11506 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__11506)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__11511) {
    var $elem = cljs.core.first(arglist__11511);
    var p__11506 = cljs.core.rest(arglist__11511);
    return toggle__delegate($elem, p__11506)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__11512) {
    var vec__11513__11514 = p__11512;
    var speed__11515 = cljs.core.nth.call(null, vec__11513__11514, 0, null);
    var on_finish__11516 = cljs.core.nth.call(null, vec__11513__11514, 1, null);
    return $elem.fadeOut(speed__11515, on_finish__11516)
  };
  var fade_out = function($elem, var_args) {
    var p__11512 = null;
    if(goog.isDef(var_args)) {
      p__11512 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__11512)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__11517) {
    var $elem = cljs.core.first(arglist__11517);
    var p__11512 = cljs.core.rest(arglist__11517);
    return fade_out__delegate($elem, p__11512)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__11518) {
    var vec__11519__11520 = p__11518;
    var speed__11521 = cljs.core.nth.call(null, vec__11519__11520, 0, null);
    var on_finish__11522 = cljs.core.nth.call(null, vec__11519__11520, 1, null);
    return $elem.fadeIn(speed__11521, on_finish__11522)
  };
  var fade_in = function($elem, var_args) {
    var p__11518 = null;
    if(goog.isDef(var_args)) {
      p__11518 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__11518)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__11523) {
    var $elem = cljs.core.first(arglist__11523);
    var p__11518 = cljs.core.rest(arglist__11523);
    return fade_in__delegate($elem, p__11518)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__11524) {
    var vec__11525__11526 = p__11524;
    var speed__11527 = cljs.core.nth.call(null, vec__11525__11526, 0, null);
    var on_finish__11528 = cljs.core.nth.call(null, vec__11525__11526, 1, null);
    return $elem.slideUp(speed__11527, on_finish__11528)
  };
  var slide_up = function($elem, var_args) {
    var p__11524 = null;
    if(goog.isDef(var_args)) {
      p__11524 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__11524)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__11529) {
    var $elem = cljs.core.first(arglist__11529);
    var p__11524 = cljs.core.rest(arglist__11529);
    return slide_up__delegate($elem, p__11524)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__11530) {
    var vec__11531__11532 = p__11530;
    var speed__11533 = cljs.core.nth.call(null, vec__11531__11532, 0, null);
    var on_finish__11534 = cljs.core.nth.call(null, vec__11531__11532, 1, null);
    return $elem.slideDown(speed__11533, on_finish__11534)
  };
  var slide_down = function($elem, var_args) {
    var p__11530 = null;
    if(goog.isDef(var_args)) {
      p__11530 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__11530)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__11535) {
    var $elem = cljs.core.first(arglist__11535);
    var p__11530 = cljs.core.rest(arglist__11535);
    return slide_down__delegate($elem, p__11530)
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
  var closest__delegate = function($elem, selector, p__11536) {
    var vec__11537__11538 = p__11536;
    var context__11539 = cljs.core.nth.call(null, vec__11537__11538, 0, null);
    return $elem.closest(selector, context__11539)
  };
  var closest = function($elem, selector, var_args) {
    var p__11536 = null;
    if(goog.isDef(var_args)) {
      p__11536 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__11536)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__11540) {
    var $elem = cljs.core.first(arglist__11540);
    var selector = cljs.core.first(cljs.core.next(arglist__11540));
    var p__11536 = cljs.core.rest(cljs.core.next(arglist__11540));
    return closest__delegate($elem, selector, p__11536)
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
  var val__delegate = function($elem, p__11541) {
    var vec__11542__11543 = p__11541;
    var v__11544 = cljs.core.nth.call(null, vec__11542__11543, 0, null);
    if(cljs.core.truth_(v__11544)) {
      return $elem.val(v__11544)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__11541 = null;
    if(goog.isDef(var_args)) {
      p__11541 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__11541)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__11545) {
    var $elem = cljs.core.first(arglist__11545);
    var p__11541 = cljs.core.rest(arglist__11545);
    return val__delegate($elem, p__11541)
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
jayq.core.xhr = function xhr(p__11546, content, callback) {
  var vec__11547__11548 = p__11546;
  var method__11549 = cljs.core.nth.call(null, vec__11547__11548, 0, null);
  var uri__11550 = cljs.core.nth.call(null, vec__11547__11548, 1, null);
  var params__11551 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__11549)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__11550, params__11551)
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
  var unbind__delegate = function($elem, ev, p__11552) {
    var vec__11553__11554 = p__11552;
    var func__11555 = cljs.core.nth.call(null, vec__11553__11554, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__11555)
  };
  var unbind = function($elem, ev, var_args) {
    var p__11552 = null;
    if(goog.isDef(var_args)) {
      p__11552 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__11552)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__11556) {
    var $elem = cljs.core.first(arglist__11556);
    var ev = cljs.core.first(cljs.core.next(arglist__11556));
    var p__11552 = cljs.core.rest(cljs.core.next(arglist__11556));
    return unbind__delegate($elem, ev, p__11552)
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
  var on__delegate = function($elem, events, p__11557) {
    var vec__11558__11559 = p__11557;
    var sel__11560 = cljs.core.nth.call(null, vec__11558__11559, 0, null);
    var data__11561 = cljs.core.nth.call(null, vec__11558__11559, 1, null);
    var handler__11562 = cljs.core.nth.call(null, vec__11558__11559, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11560), data__11561, handler__11562)
  };
  var on = function($elem, events, var_args) {
    var p__11557 = null;
    if(goog.isDef(var_args)) {
      p__11557 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__11557)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__11563) {
    var $elem = cljs.core.first(arglist__11563);
    var events = cljs.core.first(cljs.core.next(arglist__11563));
    var p__11557 = cljs.core.rest(cljs.core.next(arglist__11563));
    return on__delegate($elem, events, p__11557)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__11564) {
    var vec__11565__11566 = p__11564;
    var sel__11567 = cljs.core.nth.call(null, vec__11565__11566, 0, null);
    var data__11568 = cljs.core.nth.call(null, vec__11565__11566, 1, null);
    var handler__11569 = cljs.core.nth.call(null, vec__11565__11566, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11567), data__11568, handler__11569)
  };
  var one = function($elem, events, var_args) {
    var p__11564 = null;
    if(goog.isDef(var_args)) {
      p__11564 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__11564)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__11570) {
    var $elem = cljs.core.first(arglist__11570);
    var events = cljs.core.first(cljs.core.next(arglist__11570));
    var p__11564 = cljs.core.rest(cljs.core.next(arglist__11570));
    return one__delegate($elem, events, p__11564)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__11571) {
    var vec__11572__11573 = p__11571;
    var sel__11574 = cljs.core.nth.call(null, vec__11572__11573, 0, null);
    var handler__11575 = cljs.core.nth.call(null, vec__11572__11573, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__11574), handler__11575)
  };
  var off = function($elem, events, var_args) {
    var p__11571 = null;
    if(goog.isDef(var_args)) {
      p__11571 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__11571)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__11576) {
    var $elem = cljs.core.first(arglist__11576);
    var events = cljs.core.first(cljs.core.next(arglist__11576));
    var p__11571 = cljs.core.rest(cljs.core.next(arglist__11576));
    return off__delegate($elem, events, p__11571)
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
    var and__3822__auto____11632 = reader;
    if(and__3822__auto____11632) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____11632
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3824__auto____11633 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3824__auto____11633) {
        return or__3824__auto____11633
      }else {
        var or__3824__auto____11634 = cljs.reader.read_char["_"];
        if(or__3824__auto____11634) {
          return or__3824__auto____11634
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____11635 = reader;
    if(and__3822__auto____11635) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____11635
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3824__auto____11636 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3824__auto____11636) {
        return or__3824__auto____11636
      }else {
        var or__3824__auto____11637 = cljs.reader.unread["_"];
        if(or__3824__auto____11637) {
          return or__3824__auto____11637
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
  var this__11638 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__11638.buffer_atom))) {
    var idx__11639 = cljs.core.deref.call(null, this__11638.index_atom);
    cljs.core.swap_BANG_.call(null, this__11638.index_atom, cljs.core.inc);
    return this__11638.s[idx__11639]
  }else {
    var buf__11640 = cljs.core.deref.call(null, this__11638.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__11638.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__11640)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__11641 = this;
  return cljs.core.swap_BANG_.call(null, this__11641.buffer_atom, function(p1__11631_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__11631_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____11642 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3824__auto____11642)) {
    return or__3824__auto____11642
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
  var or__3824__auto____11643 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____11643) {
    return or__3824__auto____11643
  }else {
    var and__3822__auto____11645 = function() {
      var or__3824__auto____11644 = "+" === initch;
      if(or__3824__auto____11644) {
        return or__3824__auto____11644
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____11645)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__11646 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__11646);
        return next_ch__11646
      }())
    }else {
      return and__3822__auto____11645
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
  reader_error.cljs$lang$applyTo = function(arglist__11647) {
    var rdr = cljs.core.first(arglist__11647);
    var msg = cljs.core.rest(arglist__11647);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____11648 = ch != "#";
  if(and__3822__auto____11648) {
    var and__3822__auto____11649 = ch != "'";
    if(and__3822__auto____11649) {
      var and__3822__auto____11650 = ch != ":";
      if(and__3822__auto____11650) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____11650
      }
    }else {
      return and__3822__auto____11649
    }
  }else {
    return and__3822__auto____11648
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__11651 = new goog.string.StringBuffer(initch);
  var ch__11652 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____11653 = ch__11652 == null;
      if(or__3824__auto____11653) {
        return or__3824__auto____11653
      }else {
        var or__3824__auto____11654 = cljs.reader.whitespace_QMARK_.call(null, ch__11652);
        if(or__3824__auto____11654) {
          return or__3824__auto____11654
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__11652)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__11652);
      return sb__11651.toString()
    }else {
      var G__11655 = function() {
        sb__11651.append(ch__11652);
        return sb__11651
      }();
      var G__11656 = cljs.reader.read_char.call(null, rdr);
      sb__11651 = G__11655;
      ch__11652 = G__11656;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__11657 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____11658 = ch__11657 === "n";
      if(or__3824__auto____11658) {
        return or__3824__auto____11658
      }else {
        var or__3824__auto____11659 = ch__11657 === "r";
        if(or__3824__auto____11659) {
          return or__3824__auto____11659
        }else {
          return ch__11657 == null
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
  var matches__11660 = re.exec(s);
  if(matches__11660 != null) {
    if(matches__11660.length === 1) {
      return matches__11660[0]
    }else {
      return matches__11660
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__11661 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__11662 = groups__11661[2];
  if(!function() {
    var or__3824__auto____11663 = group3__11662 == null;
    if(or__3824__auto____11663) {
      return or__3824__auto____11663
    }else {
      return group3__11662.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__11664 = "-" === groups__11661[1] ? -1 : 1;
    var a__11665 = cljs.core.truth_(groups__11661[3]) ? [groups__11661[3], 10] : cljs.core.truth_(groups__11661[4]) ? [groups__11661[4], 16] : cljs.core.truth_(groups__11661[5]) ? [groups__11661[5], 8] : cljs.core.truth_(groups__11661[7]) ? [groups__11661[7], parseInt(groups__11661[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__11666 = a__11665[0];
    var radix__11667 = a__11665[1];
    if(n__11666 == null) {
      return null
    }else {
      return negate__11664 * parseInt(n__11666, radix__11667)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__11668 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__11669 = groups__11668[1];
  var denominator__11670 = groups__11668[2];
  return parseInt(numinator__11669) / parseInt(denominator__11670)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__11671 = re.exec(s);
  if(function() {
    var and__3822__auto____11672 = matches__11671 != null;
    if(and__3822__auto____11672) {
      return matches__11671[0] === s
    }else {
      return and__3822__auto____11672
    }
  }()) {
    if(matches__11671.length === 1) {
      return matches__11671[0]
    }else {
      return matches__11671
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
  var ch__11673 = cljs.reader.read_char.call(null, reader);
  var mapresult__11674 = cljs.reader.escape_char_map.call(null, ch__11673);
  if(cljs.core.truth_(mapresult__11674)) {
    return mapresult__11674
  }else {
    if(function() {
      var or__3824__auto____11675 = "u" === ch__11673;
      if(or__3824__auto____11675) {
        return or__3824__auto____11675
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__11673)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__11673)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__11673)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__11676 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__11676))) {
      var G__11677 = cljs.reader.read_char.call(null, rdr);
      ch__11676 = G__11677;
      continue
    }else {
      return ch__11676
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__11678 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__11679 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__11679)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__11679) {
      return cljs.core.persistent_BANG_.call(null, a__11678)
    }else {
      var temp__3971__auto____11680 = cljs.reader.macros.call(null, ch__11679);
      if(cljs.core.truth_(temp__3971__auto____11680)) {
        var macrofn__11681 = temp__3971__auto____11680;
        var mret__11682 = macrofn__11681.call(null, rdr, ch__11679);
        var G__11684 = mret__11682 === rdr ? a__11678 : cljs.core.conj_BANG_.call(null, a__11678, mret__11682);
        a__11678 = G__11684;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__11679);
        var o__11683 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__11685 = o__11683 === rdr ? a__11678 : cljs.core.conj_BANG_.call(null, a__11678, o__11683);
        a__11678 = G__11685;
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
  var ch__11686 = cljs.reader.read_char.call(null, rdr);
  var dm__11687 = cljs.reader.dispatch_macros.call(null, ch__11686);
  if(cljs.core.truth_(dm__11687)) {
    return dm__11687.call(null, rdr, _)
  }else {
    var temp__3971__auto____11688 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__11686);
    if(cljs.core.truth_(temp__3971__auto____11688)) {
      var obj__11689 = temp__3971__auto____11688;
      return obj__11689
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__11686)
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
  var l__11690 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__11690))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__11690)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__11691 = new goog.string.StringBuffer(initch);
  var ch__11692 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____11693 = ch__11692 == null;
      if(or__3824__auto____11693) {
        return or__3824__auto____11693
      }else {
        var or__3824__auto____11694 = cljs.reader.whitespace_QMARK_.call(null, ch__11692);
        if(or__3824__auto____11694) {
          return or__3824__auto____11694
        }else {
          return cljs.reader.macros.call(null, ch__11692)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__11692);
      var s__11695 = buffer__11691.toString();
      var or__3824__auto____11696 = cljs.reader.match_number.call(null, s__11695);
      if(cljs.core.truth_(or__3824__auto____11696)) {
        return or__3824__auto____11696
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__11695, "]")
      }
    }else {
      var G__11697 = function() {
        buffer__11691.append(ch__11692);
        return buffer__11691
      }();
      var G__11698 = cljs.reader.read_char.call(null, reader);
      buffer__11691 = G__11697;
      ch__11692 = G__11698;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__11699 = new goog.string.StringBuffer;
  var ch__11700 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__11700 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__11700) {
        var G__11701 = function() {
          buffer__11699.append(cljs.reader.escape_char.call(null, buffer__11699, reader));
          return buffer__11699
        }();
        var G__11702 = cljs.reader.read_char.call(null, reader);
        buffer__11699 = G__11701;
        ch__11700 = G__11702;
        continue
      }else {
        if('"' === ch__11700) {
          return buffer__11699.toString()
        }else {
          if("\ufdd0'default") {
            var G__11703 = function() {
              buffer__11699.append(ch__11700);
              return buffer__11699
            }();
            var G__11704 = cljs.reader.read_char.call(null, reader);
            buffer__11699 = G__11703;
            ch__11700 = G__11704;
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
  var token__11705 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__11705, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__11705, 0, token__11705.indexOf("/")), cljs.core.subs.call(null, token__11705, token__11705.indexOf("/") + 1, token__11705.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__11705, cljs.core.symbol.call(null, token__11705))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__11706 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__11707 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__11706);
  var token__11708 = a__11707[0];
  var ns__11709 = a__11707[1];
  var name__11710 = a__11707[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____11712 = function() {
      var and__3822__auto____11711 = !(void 0 === ns__11709);
      if(and__3822__auto____11711) {
        return ns__11709.substring(ns__11709.length - 2, ns__11709.length) === ":/"
      }else {
        return and__3822__auto____11711
      }
    }();
    if(cljs.core.truth_(or__3824__auto____11712)) {
      return or__3824__auto____11712
    }else {
      var or__3824__auto____11713 = name__11710[name__11710.length - 1] === ":";
      if(or__3824__auto____11713) {
        return or__3824__auto____11713
      }else {
        return!(token__11708.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__11708)
  }else {
    if(cljs.core.truth_(ns__11709)) {
      return cljs.core.keyword.call(null, ns__11709.substring(0, ns__11709.indexOf("/")), name__11710)
    }else {
      return cljs.core.keyword.call(null, token__11708)
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
  var m__11714 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__11714)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__11715 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__11716__11717 = o__11715;
    if(G__11716__11717 != null) {
      if(function() {
        var or__3824__auto____11718 = G__11716__11717.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____11718) {
          return or__3824__auto____11718
        }else {
          return G__11716__11717.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__11716__11717.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__11716__11717)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__11716__11717)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__11715, cljs.core.merge.call(null, cljs.core.meta.call(null, o__11715), m__11714))
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
    var ch__11719 = cljs.reader.read_char.call(null, reader);
    if(ch__11719 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__11719)) {
        var G__11722 = reader;
        var G__11723 = eof_is_error;
        var G__11724 = sentinel;
        var G__11725 = is_recursive;
        reader = G__11722;
        eof_is_error = G__11723;
        sentinel = G__11724;
        is_recursive = G__11725;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__11719)) {
          var G__11726 = cljs.reader.read_comment.call(null, reader, ch__11719);
          var G__11727 = eof_is_error;
          var G__11728 = sentinel;
          var G__11729 = is_recursive;
          reader = G__11726;
          eof_is_error = G__11727;
          sentinel = G__11728;
          is_recursive = G__11729;
          continue
        }else {
          if("\ufdd0'else") {
            var f__11720 = cljs.reader.macros.call(null, ch__11719);
            var res__11721 = cljs.core.truth_(f__11720) ? f__11720.call(null, reader, ch__11719) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__11719) ? cljs.reader.read_number.call(null, reader, ch__11719) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__11719) : null;
            if(res__11721 === reader) {
              var G__11730 = reader;
              var G__11731 = eof_is_error;
              var G__11732 = sentinel;
              var G__11733 = is_recursive;
              reader = G__11730;
              eof_is_error = G__11731;
              sentinel = G__11732;
              is_recursive = G__11733;
              continue
            }else {
              return res__11721
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
  var r__11734 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__11734, true, null, false)
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
  var tag__11735 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__11736 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__11737 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__11735));
  if(cljs.core.truth_(pfn__11737)) {
    return pfn__11737.call(null, form__11736)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__11735), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__11738 = cljs.core.name.call(null, tag);
  var old_parser__11739 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__11738);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__11738, f);
  return old_parser__11739
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
        return cljs.core.reduce.call(null, function(m, p__11626) {
          var vec__11627__11628 = p__11626;
          var k__11629 = cljs.core.nth.call(null, vec__11627__11628, 0, null);
          var v__11630 = cljs.core.nth.call(null, vec__11627__11628, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__11629), clj__GT_js.call(null, v__11630))
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
      var vec__11607__11608 = route;
      var m__11609 = cljs.core.nth.call(null, vec__11607__11608, 0, null);
      var u__11610 = cljs.core.nth.call(null, vec__11607__11608, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__11609), u__11610])
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
  var cur__11611 = fetch.util.clj__GT_js.call(null, d);
  var query__11612 = goog.Uri.QueryData.createFromMap.call(null, new goog.structs.Map(cur__11611));
  return[cljs.core.str(query__11612)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__11613 = req.getResponseText();
      return callback.call(null, data__11613)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__11614) {
    var vec__11615__11616 = p__11614;
    var opts__11617 = cljs.core.nth.call(null, vec__11615__11616, 0, null);
    var req__11619 = new goog.net.XhrIo;
    var vec__11618__11620 = fetch.core.parse_route.call(null, route);
    var method__11621 = cljs.core.nth.call(null, vec__11618__11620, 0, null);
    var uri__11622 = cljs.core.nth.call(null, vec__11618__11620, 1, null);
    var data__11623 = fetch.core.__GT_data.call(null, content);
    var callback__11624 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__11624)) {
      goog.events.listen.call(null, req__11619, goog.net.EventType.COMPLETE, function() {
        return callback__11624.call(null, req__11619)
      })
    }else {
    }
    return req__11619.send(uri__11622, method__11621, data__11623, cljs.core.truth_(opts__11617) ? fetch.util.clj__GT_js.call(null, opts__11617) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__11614 = null;
    if(goog.isDef(var_args)) {
      p__11614 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__11614)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__11625) {
    var route = cljs.core.first(arglist__11625);
    var content = cljs.core.first(cljs.core.next(arglist__11625));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11625)));
    var p__11614 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11625)));
    return xhr__delegate(route, content, callback, p__11614)
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
    var data__11606 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__11606))
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
webrot.client.main.coords_from_ui = function coords_from_ui(ui) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":ui.offset.left, "\ufdd0'y":ui.offset.top})
};
webrot.client.main.form_params = function form_params() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'lut", "\ufdd0'cut-off"], {"\ufdd0'lut":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #lut :selected")), "\ufdd0'cut-off":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #cut-off :selected"))})
};
webrot.client.main.redraw = function redraw(args) {
  if(cljs.core.truth_(cljs.core.compare_and_set_BANG_.call(null, webrot.client.main.busy, false, true))) {
    var me__13960 = this;
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
    var merged_params__13961 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_ui.call(null, ui));
    return fetch.remotes.remote_callback.call(null, "real-coords", cljs.core.PersistentVector.fromArray([merged_params__13961]), function(result) {
      jayq.core.anim.call(null, webrot.client.main.$drag_target, cljs.core.ObjMap.fromObject(["\ufdd0'left", "\ufdd0'top"], {"\ufdd0'left":0, "\ufdd0'top":0}), 500);
      return webrot.client.main.redraw.call(null, cljs.core.merge.call(null, webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'start-posn", "\ufdd0'bounds", "\ufdd0'type"], {"\ufdd0'start-posn":[cljs.core.str("\ufdd0'x".call(null, result)), cljs.core.str(","), cljs.core.str("\ufdd0'y".call(null, result))].join(""), "\ufdd0'bounds":"1,1.5,-1,-1.5", "\ufdd0'type":"julia"})))
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$img, "\ufdd0'load", function() {
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.not);
    return jayq.core.hide.call(null, webrot.client.main.$spinner)
  });
  jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__13962 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, event));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__13962]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_in, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__13963 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":400, "\ufdd0'y":300}));
    return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__13963]), function(result) {
      return webrot.client.main.redraw.call(null, result)
    })
  });
  jayq.core.bind.call(null, webrot.client.main.$zoom_out, "\ufdd0'click", function(event) {
    event.preventDefault();
    var merged_params__13964 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null));
    return fetch.remotes.remote_callback.call(null, "zoom-out", cljs.core.PersistentVector.fromArray([merged_params__13964]), function(result) {
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
