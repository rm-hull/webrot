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
    var G__73100__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__73100 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73100__delegate.call(this, array, i, idxs)
    };
    G__73100.cljs$lang$maxFixedArity = 2;
    G__73100.cljs$lang$applyTo = function(arglist__73101) {
      var array = cljs.core.first(arglist__73101);
      var i = cljs.core.first(cljs.core.next(arglist__73101));
      var idxs = cljs.core.rest(cljs.core.next(arglist__73101));
      return G__73100__delegate(array, i, idxs)
    };
    G__73100.cljs$lang$arity$variadic = G__73100__delegate;
    return G__73100
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
      var and__3822__auto____73102 = this$;
      if(and__3822__auto____73102) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____73102
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____73103 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73103) {
          return or__3824__auto____73103
        }else {
          var or__3824__auto____73104 = cljs.core._invoke["_"];
          if(or__3824__auto____73104) {
            return or__3824__auto____73104
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____73105 = this$;
      if(and__3822__auto____73105) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____73105
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____73106 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73106) {
          return or__3824__auto____73106
        }else {
          var or__3824__auto____73107 = cljs.core._invoke["_"];
          if(or__3824__auto____73107) {
            return or__3824__auto____73107
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____73108 = this$;
      if(and__3822__auto____73108) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____73108
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____73109 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73109) {
          return or__3824__auto____73109
        }else {
          var or__3824__auto____73110 = cljs.core._invoke["_"];
          if(or__3824__auto____73110) {
            return or__3824__auto____73110
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____73111 = this$;
      if(and__3822__auto____73111) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____73111
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____73112 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73112) {
          return or__3824__auto____73112
        }else {
          var or__3824__auto____73113 = cljs.core._invoke["_"];
          if(or__3824__auto____73113) {
            return or__3824__auto____73113
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____73114 = this$;
      if(and__3822__auto____73114) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____73114
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____73115 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73115) {
          return or__3824__auto____73115
        }else {
          var or__3824__auto____73116 = cljs.core._invoke["_"];
          if(or__3824__auto____73116) {
            return or__3824__auto____73116
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____73117 = this$;
      if(and__3822__auto____73117) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____73117
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____73118 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73118) {
          return or__3824__auto____73118
        }else {
          var or__3824__auto____73119 = cljs.core._invoke["_"];
          if(or__3824__auto____73119) {
            return or__3824__auto____73119
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____73120 = this$;
      if(and__3822__auto____73120) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____73120
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____73121 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73121) {
          return or__3824__auto____73121
        }else {
          var or__3824__auto____73122 = cljs.core._invoke["_"];
          if(or__3824__auto____73122) {
            return or__3824__auto____73122
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____73123 = this$;
      if(and__3822__auto____73123) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____73123
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____73124 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73124) {
          return or__3824__auto____73124
        }else {
          var or__3824__auto____73125 = cljs.core._invoke["_"];
          if(or__3824__auto____73125) {
            return or__3824__auto____73125
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____73126 = this$;
      if(and__3822__auto____73126) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____73126
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____73127 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73127) {
          return or__3824__auto____73127
        }else {
          var or__3824__auto____73128 = cljs.core._invoke["_"];
          if(or__3824__auto____73128) {
            return or__3824__auto____73128
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____73129 = this$;
      if(and__3822__auto____73129) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____73129
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____73130 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73130) {
          return or__3824__auto____73130
        }else {
          var or__3824__auto____73131 = cljs.core._invoke["_"];
          if(or__3824__auto____73131) {
            return or__3824__auto____73131
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____73132 = this$;
      if(and__3822__auto____73132) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____73132
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____73133 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73133) {
          return or__3824__auto____73133
        }else {
          var or__3824__auto____73134 = cljs.core._invoke["_"];
          if(or__3824__auto____73134) {
            return or__3824__auto____73134
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____73135 = this$;
      if(and__3822__auto____73135) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____73135
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____73136 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73136) {
          return or__3824__auto____73136
        }else {
          var or__3824__auto____73137 = cljs.core._invoke["_"];
          if(or__3824__auto____73137) {
            return or__3824__auto____73137
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____73138 = this$;
      if(and__3822__auto____73138) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____73138
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____73139 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73139) {
          return or__3824__auto____73139
        }else {
          var or__3824__auto____73140 = cljs.core._invoke["_"];
          if(or__3824__auto____73140) {
            return or__3824__auto____73140
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____73141 = this$;
      if(and__3822__auto____73141) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____73141
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____73142 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73142) {
          return or__3824__auto____73142
        }else {
          var or__3824__auto____73143 = cljs.core._invoke["_"];
          if(or__3824__auto____73143) {
            return or__3824__auto____73143
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____73144 = this$;
      if(and__3822__auto____73144) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____73144
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____73145 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73145) {
          return or__3824__auto____73145
        }else {
          var or__3824__auto____73146 = cljs.core._invoke["_"];
          if(or__3824__auto____73146) {
            return or__3824__auto____73146
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____73147 = this$;
      if(and__3822__auto____73147) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____73147
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____73148 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73148) {
          return or__3824__auto____73148
        }else {
          var or__3824__auto____73149 = cljs.core._invoke["_"];
          if(or__3824__auto____73149) {
            return or__3824__auto____73149
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____73150 = this$;
      if(and__3822__auto____73150) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____73150
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____73151 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73151) {
          return or__3824__auto____73151
        }else {
          var or__3824__auto____73152 = cljs.core._invoke["_"];
          if(or__3824__auto____73152) {
            return or__3824__auto____73152
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____73153 = this$;
      if(and__3822__auto____73153) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____73153
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____73154 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73154) {
          return or__3824__auto____73154
        }else {
          var or__3824__auto____73155 = cljs.core._invoke["_"];
          if(or__3824__auto____73155) {
            return or__3824__auto____73155
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____73156 = this$;
      if(and__3822__auto____73156) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____73156
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____73157 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73157) {
          return or__3824__auto____73157
        }else {
          var or__3824__auto____73158 = cljs.core._invoke["_"];
          if(or__3824__auto____73158) {
            return or__3824__auto____73158
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____73159 = this$;
      if(and__3822__auto____73159) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____73159
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____73160 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73160) {
          return or__3824__auto____73160
        }else {
          var or__3824__auto____73161 = cljs.core._invoke["_"];
          if(or__3824__auto____73161) {
            return or__3824__auto____73161
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____73162 = this$;
      if(and__3822__auto____73162) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____73162
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____73163 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____73163) {
          return or__3824__auto____73163
        }else {
          var or__3824__auto____73164 = cljs.core._invoke["_"];
          if(or__3824__auto____73164) {
            return or__3824__auto____73164
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
    var and__3822__auto____73165 = coll;
    if(and__3822__auto____73165) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____73165
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73166 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73166) {
        return or__3824__auto____73166
      }else {
        var or__3824__auto____73167 = cljs.core._count["_"];
        if(or__3824__auto____73167) {
          return or__3824__auto____73167
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
    var and__3822__auto____73168 = coll;
    if(and__3822__auto____73168) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____73168
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73169 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73169) {
        return or__3824__auto____73169
      }else {
        var or__3824__auto____73170 = cljs.core._empty["_"];
        if(or__3824__auto____73170) {
          return or__3824__auto____73170
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
    var and__3822__auto____73171 = coll;
    if(and__3822__auto____73171) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____73171
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____73172 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73172) {
        return or__3824__auto____73172
      }else {
        var or__3824__auto____73173 = cljs.core._conj["_"];
        if(or__3824__auto____73173) {
          return or__3824__auto____73173
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
      var and__3822__auto____73174 = coll;
      if(and__3822__auto____73174) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____73174
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____73175 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____73175) {
          return or__3824__auto____73175
        }else {
          var or__3824__auto____73176 = cljs.core._nth["_"];
          if(or__3824__auto____73176) {
            return or__3824__auto____73176
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____73177 = coll;
      if(and__3822__auto____73177) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____73177
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____73178 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____73178) {
          return or__3824__auto____73178
        }else {
          var or__3824__auto____73179 = cljs.core._nth["_"];
          if(or__3824__auto____73179) {
            return or__3824__auto____73179
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
    var and__3822__auto____73180 = coll;
    if(and__3822__auto____73180) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____73180
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73181 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73181) {
        return or__3824__auto____73181
      }else {
        var or__3824__auto____73182 = cljs.core._first["_"];
        if(or__3824__auto____73182) {
          return or__3824__auto____73182
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____73183 = coll;
    if(and__3822__auto____73183) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____73183
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73184 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73184) {
        return or__3824__auto____73184
      }else {
        var or__3824__auto____73185 = cljs.core._rest["_"];
        if(or__3824__auto____73185) {
          return or__3824__auto____73185
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
      var and__3822__auto____73186 = o;
      if(and__3822__auto____73186) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____73186
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____73187 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____73187) {
          return or__3824__auto____73187
        }else {
          var or__3824__auto____73188 = cljs.core._lookup["_"];
          if(or__3824__auto____73188) {
            return or__3824__auto____73188
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____73189 = o;
      if(and__3822__auto____73189) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____73189
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____73190 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____73190) {
          return or__3824__auto____73190
        }else {
          var or__3824__auto____73191 = cljs.core._lookup["_"];
          if(or__3824__auto____73191) {
            return or__3824__auto____73191
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
    var and__3822__auto____73192 = coll;
    if(and__3822__auto____73192) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____73192
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____73193 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73193) {
        return or__3824__auto____73193
      }else {
        var or__3824__auto____73194 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____73194) {
          return or__3824__auto____73194
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____73195 = coll;
    if(and__3822__auto____73195) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____73195
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____73196 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73196) {
        return or__3824__auto____73196
      }else {
        var or__3824__auto____73197 = cljs.core._assoc["_"];
        if(or__3824__auto____73197) {
          return or__3824__auto____73197
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
    var and__3822__auto____73198 = coll;
    if(and__3822__auto____73198) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____73198
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____73199 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73199) {
        return or__3824__auto____73199
      }else {
        var or__3824__auto____73200 = cljs.core._dissoc["_"];
        if(or__3824__auto____73200) {
          return or__3824__auto____73200
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
    var and__3822__auto____73201 = coll;
    if(and__3822__auto____73201) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____73201
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73202 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73202) {
        return or__3824__auto____73202
      }else {
        var or__3824__auto____73203 = cljs.core._key["_"];
        if(or__3824__auto____73203) {
          return or__3824__auto____73203
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____73204 = coll;
    if(and__3822__auto____73204) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____73204
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73205 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73205) {
        return or__3824__auto____73205
      }else {
        var or__3824__auto____73206 = cljs.core._val["_"];
        if(or__3824__auto____73206) {
          return or__3824__auto____73206
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
    var and__3822__auto____73207 = coll;
    if(and__3822__auto____73207) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____73207
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____73208 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73208) {
        return or__3824__auto____73208
      }else {
        var or__3824__auto____73209 = cljs.core._disjoin["_"];
        if(or__3824__auto____73209) {
          return or__3824__auto____73209
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
    var and__3822__auto____73210 = coll;
    if(and__3822__auto____73210) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____73210
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73211 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73211) {
        return or__3824__auto____73211
      }else {
        var or__3824__auto____73212 = cljs.core._peek["_"];
        if(or__3824__auto____73212) {
          return or__3824__auto____73212
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____73213 = coll;
    if(and__3822__auto____73213) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____73213
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73214 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73214) {
        return or__3824__auto____73214
      }else {
        var or__3824__auto____73215 = cljs.core._pop["_"];
        if(or__3824__auto____73215) {
          return or__3824__auto____73215
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
    var and__3822__auto____73216 = coll;
    if(and__3822__auto____73216) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____73216
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____73217 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73217) {
        return or__3824__auto____73217
      }else {
        var or__3824__auto____73218 = cljs.core._assoc_n["_"];
        if(or__3824__auto____73218) {
          return or__3824__auto____73218
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
    var and__3822__auto____73219 = o;
    if(and__3822__auto____73219) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____73219
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____73220 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____73220) {
        return or__3824__auto____73220
      }else {
        var or__3824__auto____73221 = cljs.core._deref["_"];
        if(or__3824__auto____73221) {
          return or__3824__auto____73221
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
    var and__3822__auto____73222 = o;
    if(and__3822__auto____73222) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____73222
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____73223 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____73223) {
        return or__3824__auto____73223
      }else {
        var or__3824__auto____73224 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____73224) {
          return or__3824__auto____73224
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
    var and__3822__auto____73225 = o;
    if(and__3822__auto____73225) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____73225
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____73226 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____73226) {
        return or__3824__auto____73226
      }else {
        var or__3824__auto____73227 = cljs.core._meta["_"];
        if(or__3824__auto____73227) {
          return or__3824__auto____73227
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
    var and__3822__auto____73228 = o;
    if(and__3822__auto____73228) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____73228
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____73229 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____73229) {
        return or__3824__auto____73229
      }else {
        var or__3824__auto____73230 = cljs.core._with_meta["_"];
        if(or__3824__auto____73230) {
          return or__3824__auto____73230
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
      var and__3822__auto____73231 = coll;
      if(and__3822__auto____73231) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____73231
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____73232 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____73232) {
          return or__3824__auto____73232
        }else {
          var or__3824__auto____73233 = cljs.core._reduce["_"];
          if(or__3824__auto____73233) {
            return or__3824__auto____73233
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____73234 = coll;
      if(and__3822__auto____73234) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____73234
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____73235 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____73235) {
          return or__3824__auto____73235
        }else {
          var or__3824__auto____73236 = cljs.core._reduce["_"];
          if(or__3824__auto____73236) {
            return or__3824__auto____73236
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
    var and__3822__auto____73237 = coll;
    if(and__3822__auto____73237) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____73237
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____73238 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73238) {
        return or__3824__auto____73238
      }else {
        var or__3824__auto____73239 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____73239) {
          return or__3824__auto____73239
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
    var and__3822__auto____73240 = o;
    if(and__3822__auto____73240) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____73240
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____73241 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____73241) {
        return or__3824__auto____73241
      }else {
        var or__3824__auto____73242 = cljs.core._equiv["_"];
        if(or__3824__auto____73242) {
          return or__3824__auto____73242
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
    var and__3822__auto____73243 = o;
    if(and__3822__auto____73243) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____73243
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____73244 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____73244) {
        return or__3824__auto____73244
      }else {
        var or__3824__auto____73245 = cljs.core._hash["_"];
        if(or__3824__auto____73245) {
          return or__3824__auto____73245
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
    var and__3822__auto____73246 = o;
    if(and__3822__auto____73246) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____73246
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____73247 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____73247) {
        return or__3824__auto____73247
      }else {
        var or__3824__auto____73248 = cljs.core._seq["_"];
        if(or__3824__auto____73248) {
          return or__3824__auto____73248
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
    var and__3822__auto____73249 = coll;
    if(and__3822__auto____73249) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____73249
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73250 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73250) {
        return or__3824__auto____73250
      }else {
        var or__3824__auto____73251 = cljs.core._rseq["_"];
        if(or__3824__auto____73251) {
          return or__3824__auto____73251
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
    var and__3822__auto____73252 = coll;
    if(and__3822__auto____73252) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____73252
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____73253 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73253) {
        return or__3824__auto____73253
      }else {
        var or__3824__auto____73254 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____73254) {
          return or__3824__auto____73254
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____73255 = coll;
    if(and__3822__auto____73255) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____73255
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____73256 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73256) {
        return or__3824__auto____73256
      }else {
        var or__3824__auto____73257 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____73257) {
          return or__3824__auto____73257
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____73258 = coll;
    if(and__3822__auto____73258) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____73258
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____73259 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73259) {
        return or__3824__auto____73259
      }else {
        var or__3824__auto____73260 = cljs.core._entry_key["_"];
        if(or__3824__auto____73260) {
          return or__3824__auto____73260
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____73261 = coll;
    if(and__3822__auto____73261) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____73261
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73262 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73262) {
        return or__3824__auto____73262
      }else {
        var or__3824__auto____73263 = cljs.core._comparator["_"];
        if(or__3824__auto____73263) {
          return or__3824__auto____73263
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
    var and__3822__auto____73264 = o;
    if(and__3822__auto____73264) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____73264
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____73265 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____73265) {
        return or__3824__auto____73265
      }else {
        var or__3824__auto____73266 = cljs.core._pr_seq["_"];
        if(or__3824__auto____73266) {
          return or__3824__auto____73266
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
    var and__3822__auto____73267 = d;
    if(and__3822__auto____73267) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____73267
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____73268 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____73268) {
        return or__3824__auto____73268
      }else {
        var or__3824__auto____73269 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____73269) {
          return or__3824__auto____73269
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
    var and__3822__auto____73270 = this$;
    if(and__3822__auto____73270) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____73270
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____73271 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____73271) {
        return or__3824__auto____73271
      }else {
        var or__3824__auto____73272 = cljs.core._notify_watches["_"];
        if(or__3824__auto____73272) {
          return or__3824__auto____73272
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____73273 = this$;
    if(and__3822__auto____73273) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____73273
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____73274 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____73274) {
        return or__3824__auto____73274
      }else {
        var or__3824__auto____73275 = cljs.core._add_watch["_"];
        if(or__3824__auto____73275) {
          return or__3824__auto____73275
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____73276 = this$;
    if(and__3822__auto____73276) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____73276
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____73277 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____73277) {
        return or__3824__auto____73277
      }else {
        var or__3824__auto____73278 = cljs.core._remove_watch["_"];
        if(or__3824__auto____73278) {
          return or__3824__auto____73278
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
    var and__3822__auto____73279 = coll;
    if(and__3822__auto____73279) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____73279
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____73280 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____73280) {
        return or__3824__auto____73280
      }else {
        var or__3824__auto____73281 = cljs.core._as_transient["_"];
        if(or__3824__auto____73281) {
          return or__3824__auto____73281
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
    var and__3822__auto____73282 = tcoll;
    if(and__3822__auto____73282) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____73282
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____73283 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73283) {
        return or__3824__auto____73283
      }else {
        var or__3824__auto____73284 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____73284) {
          return or__3824__auto____73284
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____73285 = tcoll;
    if(and__3822__auto____73285) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____73285
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____73286 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73286) {
        return or__3824__auto____73286
      }else {
        var or__3824__auto____73287 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____73287) {
          return or__3824__auto____73287
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
    var and__3822__auto____73288 = tcoll;
    if(and__3822__auto____73288) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____73288
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____73289 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73289) {
        return or__3824__auto____73289
      }else {
        var or__3824__auto____73290 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____73290) {
          return or__3824__auto____73290
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
    var and__3822__auto____73291 = tcoll;
    if(and__3822__auto____73291) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____73291
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____73292 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73292) {
        return or__3824__auto____73292
      }else {
        var or__3824__auto____73293 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____73293) {
          return or__3824__auto____73293
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
    var and__3822__auto____73294 = tcoll;
    if(and__3822__auto____73294) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____73294
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____73295 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73295) {
        return or__3824__auto____73295
      }else {
        var or__3824__auto____73296 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____73296) {
          return or__3824__auto____73296
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____73297 = tcoll;
    if(and__3822__auto____73297) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____73297
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____73298 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73298) {
        return or__3824__auto____73298
      }else {
        var or__3824__auto____73299 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____73299) {
          return or__3824__auto____73299
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
    var and__3822__auto____73300 = tcoll;
    if(and__3822__auto____73300) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____73300
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____73301 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____73301) {
        return or__3824__auto____73301
      }else {
        var or__3824__auto____73302 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____73302) {
          return or__3824__auto____73302
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
    var or__3824__auto____73303 = x === y;
    if(or__3824__auto____73303) {
      return or__3824__auto____73303
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__73304__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73305 = y;
            var G__73306 = cljs.core.first.call(null, more);
            var G__73307 = cljs.core.next.call(null, more);
            x = G__73305;
            y = G__73306;
            more = G__73307;
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
    var G__73304 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73304__delegate.call(this, x, y, more)
    };
    G__73304.cljs$lang$maxFixedArity = 2;
    G__73304.cljs$lang$applyTo = function(arglist__73308) {
      var x = cljs.core.first(arglist__73308);
      var y = cljs.core.first(cljs.core.next(arglist__73308));
      var more = cljs.core.rest(cljs.core.next(arglist__73308));
      return G__73304__delegate(x, y, more)
    };
    G__73304.cljs$lang$arity$variadic = G__73304__delegate;
    return G__73304
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
    var or__3824__auto____73309 = x == null;
    if(or__3824__auto____73309) {
      return or__3824__auto____73309
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
  var G__73310 = null;
  var G__73310__2 = function(o, k) {
    return null
  };
  var G__73310__3 = function(o, k, not_found) {
    return not_found
  };
  G__73310 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73310__2.call(this, o, k);
      case 3:
        return G__73310__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73310
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
  var G__73311 = null;
  var G__73311__2 = function(_, f) {
    return f.call(null)
  };
  var G__73311__3 = function(_, f, start) {
    return start
  };
  G__73311 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__73311__2.call(this, _, f);
      case 3:
        return G__73311__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73311
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
  var G__73312 = null;
  var G__73312__2 = function(_, n) {
    return null
  };
  var G__73312__3 = function(_, n, not_found) {
    return not_found
  };
  G__73312 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73312__2.call(this, _, n);
      case 3:
        return G__73312__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73312
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
      var val__73313 = cljs.core._nth.call(null, cicoll, 0);
      var n__73314 = 1;
      while(true) {
        if(n__73314 < cljs.core._count.call(null, cicoll)) {
          var nval__73315 = f.call(null, val__73313, cljs.core._nth.call(null, cicoll, n__73314));
          if(cljs.core.reduced_QMARK_.call(null, nval__73315)) {
            return cljs.core.deref.call(null, nval__73315)
          }else {
            var G__73322 = nval__73315;
            var G__73323 = n__73314 + 1;
            val__73313 = G__73322;
            n__73314 = G__73323;
            continue
          }
        }else {
          return val__73313
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__73316 = val;
    var n__73317 = 0;
    while(true) {
      if(n__73317 < cljs.core._count.call(null, cicoll)) {
        var nval__73318 = f.call(null, val__73316, cljs.core._nth.call(null, cicoll, n__73317));
        if(cljs.core.reduced_QMARK_.call(null, nval__73318)) {
          return cljs.core.deref.call(null, nval__73318)
        }else {
          var G__73324 = nval__73318;
          var G__73325 = n__73317 + 1;
          val__73316 = G__73324;
          n__73317 = G__73325;
          continue
        }
      }else {
        return val__73316
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__73319 = val;
    var n__73320 = idx;
    while(true) {
      if(n__73320 < cljs.core._count.call(null, cicoll)) {
        var nval__73321 = f.call(null, val__73319, cljs.core._nth.call(null, cicoll, n__73320));
        if(cljs.core.reduced_QMARK_.call(null, nval__73321)) {
          return cljs.core.deref.call(null, nval__73321)
        }else {
          var G__73326 = nval__73321;
          var G__73327 = n__73320 + 1;
          val__73319 = G__73326;
          n__73320 = G__73327;
          continue
        }
      }else {
        return val__73319
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
  var this__73328 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__73329 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__73330 = this;
  var this$__73331 = this;
  return cljs.core.pr_str.call(null, this$__73331)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__73332 = this;
  if(cljs.core.counted_QMARK_.call(null, this__73332.a)) {
    return cljs.core.ci_reduce.call(null, this__73332.a, f, this__73332.a[this__73332.i], this__73332.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__73332.a[this__73332.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__73333 = this;
  if(cljs.core.counted_QMARK_.call(null, this__73333.a)) {
    return cljs.core.ci_reduce.call(null, this__73333.a, f, start, this__73333.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__73334 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__73335 = this;
  return this__73335.a.length - this__73335.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__73336 = this;
  return this__73336.a[this__73336.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__73337 = this;
  if(this__73337.i + 1 < this__73337.a.length) {
    return new cljs.core.IndexedSeq(this__73337.a, this__73337.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__73338 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__73339 = this;
  var i__73340 = n + this__73339.i;
  if(i__73340 < this__73339.a.length) {
    return this__73339.a[i__73340]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__73341 = this;
  var i__73342 = n + this__73341.i;
  if(i__73342 < this__73341.a.length) {
    return this__73341.a[i__73342]
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
  var G__73343 = null;
  var G__73343__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__73343__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__73343 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__73343__2.call(this, array, f);
      case 3:
        return G__73343__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73343
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__73344 = null;
  var G__73344__2 = function(array, k) {
    return array[k]
  };
  var G__73344__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__73344 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73344__2.call(this, array, k);
      case 3:
        return G__73344__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73344
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__73345 = null;
  var G__73345__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__73345__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__73345 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73345__2.call(this, array, n);
      case 3:
        return G__73345__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73345
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
      var G__73346__73347 = coll;
      if(G__73346__73347 != null) {
        if(function() {
          var or__3824__auto____73348 = G__73346__73347.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____73348) {
            return or__3824__auto____73348
          }else {
            return G__73346__73347.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__73346__73347.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__73346__73347)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__73346__73347)
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
      var G__73349__73350 = coll;
      if(G__73349__73350 != null) {
        if(function() {
          var or__3824__auto____73351 = G__73349__73350.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____73351) {
            return or__3824__auto____73351
          }else {
            return G__73349__73350.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__73349__73350.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73349__73350)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73349__73350)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__73352 = cljs.core.seq.call(null, coll);
      if(s__73352 != null) {
        return cljs.core._first.call(null, s__73352)
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
      var G__73353__73354 = coll;
      if(G__73353__73354 != null) {
        if(function() {
          var or__3824__auto____73355 = G__73353__73354.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____73355) {
            return or__3824__auto____73355
          }else {
            return G__73353__73354.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__73353__73354.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73353__73354)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73353__73354)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__73356 = cljs.core.seq.call(null, coll);
      if(s__73356 != null) {
        return cljs.core._rest.call(null, s__73356)
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
      var G__73357__73358 = coll;
      if(G__73357__73358 != null) {
        if(function() {
          var or__3824__auto____73359 = G__73357__73358.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____73359) {
            return or__3824__auto____73359
          }else {
            return G__73357__73358.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__73357__73358.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73357__73358)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73357__73358)
      }
    }()) {
      var coll__73360 = cljs.core._rest.call(null, coll);
      if(coll__73360 != null) {
        if(function() {
          var G__73361__73362 = coll__73360;
          if(G__73361__73362 != null) {
            if(function() {
              var or__3824__auto____73363 = G__73361__73362.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____73363) {
                return or__3824__auto____73363
              }else {
                return G__73361__73362.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__73361__73362.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__73361__73362)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__73361__73362)
          }
        }()) {
          return coll__73360
        }else {
          return cljs.core._seq.call(null, coll__73360)
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
      var G__73364 = cljs.core.next.call(null, s);
      s = G__73364;
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
    var G__73365__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__73366 = conj.call(null, coll, x);
          var G__73367 = cljs.core.first.call(null, xs);
          var G__73368 = cljs.core.next.call(null, xs);
          coll = G__73366;
          x = G__73367;
          xs = G__73368;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__73365 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73365__delegate.call(this, coll, x, xs)
    };
    G__73365.cljs$lang$maxFixedArity = 2;
    G__73365.cljs$lang$applyTo = function(arglist__73369) {
      var coll = cljs.core.first(arglist__73369);
      var x = cljs.core.first(cljs.core.next(arglist__73369));
      var xs = cljs.core.rest(cljs.core.next(arglist__73369));
      return G__73365__delegate(coll, x, xs)
    };
    G__73365.cljs$lang$arity$variadic = G__73365__delegate;
    return G__73365
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
  var s__73370 = cljs.core.seq.call(null, coll);
  var acc__73371 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__73370)) {
      return acc__73371 + cljs.core._count.call(null, s__73370)
    }else {
      var G__73372 = cljs.core.next.call(null, s__73370);
      var G__73373 = acc__73371 + 1;
      s__73370 = G__73372;
      acc__73371 = G__73373;
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
        var G__73374__73375 = coll;
        if(G__73374__73375 != null) {
          if(function() {
            var or__3824__auto____73376 = G__73374__73375.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____73376) {
              return or__3824__auto____73376
            }else {
              return G__73374__73375.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__73374__73375.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73374__73375)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73374__73375)
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
        var G__73377__73378 = coll;
        if(G__73377__73378 != null) {
          if(function() {
            var or__3824__auto____73379 = G__73377__73378.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____73379) {
              return or__3824__auto____73379
            }else {
              return G__73377__73378.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__73377__73378.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73377__73378)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73377__73378)
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
    var G__73381__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__73380 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__73382 = ret__73380;
          var G__73383 = cljs.core.first.call(null, kvs);
          var G__73384 = cljs.core.second.call(null, kvs);
          var G__73385 = cljs.core.nnext.call(null, kvs);
          coll = G__73382;
          k = G__73383;
          v = G__73384;
          kvs = G__73385;
          continue
        }else {
          return ret__73380
        }
        break
      }
    };
    var G__73381 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__73381__delegate.call(this, coll, k, v, kvs)
    };
    G__73381.cljs$lang$maxFixedArity = 3;
    G__73381.cljs$lang$applyTo = function(arglist__73386) {
      var coll = cljs.core.first(arglist__73386);
      var k = cljs.core.first(cljs.core.next(arglist__73386));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73386)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73386)));
      return G__73381__delegate(coll, k, v, kvs)
    };
    G__73381.cljs$lang$arity$variadic = G__73381__delegate;
    return G__73381
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
    var G__73388__delegate = function(coll, k, ks) {
      while(true) {
        var ret__73387 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__73389 = ret__73387;
          var G__73390 = cljs.core.first.call(null, ks);
          var G__73391 = cljs.core.next.call(null, ks);
          coll = G__73389;
          k = G__73390;
          ks = G__73391;
          continue
        }else {
          return ret__73387
        }
        break
      }
    };
    var G__73388 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73388__delegate.call(this, coll, k, ks)
    };
    G__73388.cljs$lang$maxFixedArity = 2;
    G__73388.cljs$lang$applyTo = function(arglist__73392) {
      var coll = cljs.core.first(arglist__73392);
      var k = cljs.core.first(cljs.core.next(arglist__73392));
      var ks = cljs.core.rest(cljs.core.next(arglist__73392));
      return G__73388__delegate(coll, k, ks)
    };
    G__73388.cljs$lang$arity$variadic = G__73388__delegate;
    return G__73388
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
    var G__73393__73394 = o;
    if(G__73393__73394 != null) {
      if(function() {
        var or__3824__auto____73395 = G__73393__73394.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____73395) {
          return or__3824__auto____73395
        }else {
          return G__73393__73394.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__73393__73394.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__73393__73394)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__73393__73394)
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
    var G__73397__delegate = function(coll, k, ks) {
      while(true) {
        var ret__73396 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__73398 = ret__73396;
          var G__73399 = cljs.core.first.call(null, ks);
          var G__73400 = cljs.core.next.call(null, ks);
          coll = G__73398;
          k = G__73399;
          ks = G__73400;
          continue
        }else {
          return ret__73396
        }
        break
      }
    };
    var G__73397 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73397__delegate.call(this, coll, k, ks)
    };
    G__73397.cljs$lang$maxFixedArity = 2;
    G__73397.cljs$lang$applyTo = function(arglist__73401) {
      var coll = cljs.core.first(arglist__73401);
      var k = cljs.core.first(cljs.core.next(arglist__73401));
      var ks = cljs.core.rest(cljs.core.next(arglist__73401));
      return G__73397__delegate(coll, k, ks)
    };
    G__73397.cljs$lang$arity$variadic = G__73397__delegate;
    return G__73397
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
    var G__73402__73403 = x;
    if(G__73402__73403 != null) {
      if(function() {
        var or__3824__auto____73404 = G__73402__73403.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____73404) {
          return or__3824__auto____73404
        }else {
          return G__73402__73403.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__73402__73403.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__73402__73403)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__73402__73403)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__73405__73406 = x;
    if(G__73405__73406 != null) {
      if(function() {
        var or__3824__auto____73407 = G__73405__73406.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____73407) {
          return or__3824__auto____73407
        }else {
          return G__73405__73406.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__73405__73406.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__73405__73406)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__73405__73406)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__73408__73409 = x;
  if(G__73408__73409 != null) {
    if(function() {
      var or__3824__auto____73410 = G__73408__73409.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____73410) {
        return or__3824__auto____73410
      }else {
        return G__73408__73409.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__73408__73409.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__73408__73409)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__73408__73409)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__73411__73412 = x;
  if(G__73411__73412 != null) {
    if(function() {
      var or__3824__auto____73413 = G__73411__73412.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____73413) {
        return or__3824__auto____73413
      }else {
        return G__73411__73412.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__73411__73412.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__73411__73412)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__73411__73412)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__73414__73415 = x;
  if(G__73414__73415 != null) {
    if(function() {
      var or__3824__auto____73416 = G__73414__73415.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____73416) {
        return or__3824__auto____73416
      }else {
        return G__73414__73415.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__73414__73415.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__73414__73415)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__73414__73415)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__73417__73418 = x;
  if(G__73417__73418 != null) {
    if(function() {
      var or__3824__auto____73419 = G__73417__73418.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____73419) {
        return or__3824__auto____73419
      }else {
        return G__73417__73418.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__73417__73418.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73417__73418)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__73417__73418)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__73420__73421 = x;
  if(G__73420__73421 != null) {
    if(function() {
      var or__3824__auto____73422 = G__73420__73421.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____73422) {
        return or__3824__auto____73422
      }else {
        return G__73420__73421.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__73420__73421.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73420__73421)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73420__73421)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__73423__73424 = x;
    if(G__73423__73424 != null) {
      if(function() {
        var or__3824__auto____73425 = G__73423__73424.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____73425) {
          return or__3824__auto____73425
        }else {
          return G__73423__73424.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__73423__73424.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__73423__73424)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__73423__73424)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__73426__73427 = x;
  if(G__73426__73427 != null) {
    if(function() {
      var or__3824__auto____73428 = G__73426__73427.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____73428) {
        return or__3824__auto____73428
      }else {
        return G__73426__73427.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__73426__73427.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__73426__73427)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__73426__73427)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__73429__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__73429 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__73429__delegate.call(this, keyvals)
    };
    G__73429.cljs$lang$maxFixedArity = 0;
    G__73429.cljs$lang$applyTo = function(arglist__73430) {
      var keyvals = cljs.core.seq(arglist__73430);
      return G__73429__delegate(keyvals)
    };
    G__73429.cljs$lang$arity$variadic = G__73429__delegate;
    return G__73429
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
  var keys__73431 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__73431.push(key)
  });
  return keys__73431
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__73432 = i;
  var j__73433 = j;
  var len__73434 = len;
  while(true) {
    if(len__73434 === 0) {
      return to
    }else {
      to[j__73433] = from[i__73432];
      var G__73435 = i__73432 + 1;
      var G__73436 = j__73433 + 1;
      var G__73437 = len__73434 - 1;
      i__73432 = G__73435;
      j__73433 = G__73436;
      len__73434 = G__73437;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__73438 = i + (len - 1);
  var j__73439 = j + (len - 1);
  var len__73440 = len;
  while(true) {
    if(len__73440 === 0) {
      return to
    }else {
      to[j__73439] = from[i__73438];
      var G__73441 = i__73438 - 1;
      var G__73442 = j__73439 - 1;
      var G__73443 = len__73440 - 1;
      i__73438 = G__73441;
      j__73439 = G__73442;
      len__73440 = G__73443;
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
    var G__73444__73445 = s;
    if(G__73444__73445 != null) {
      if(function() {
        var or__3824__auto____73446 = G__73444__73445.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____73446) {
          return or__3824__auto____73446
        }else {
          return G__73444__73445.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__73444__73445.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73444__73445)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73444__73445)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__73447__73448 = s;
  if(G__73447__73448 != null) {
    if(function() {
      var or__3824__auto____73449 = G__73447__73448.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____73449) {
        return or__3824__auto____73449
      }else {
        return G__73447__73448.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__73447__73448.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__73447__73448)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__73447__73448)
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
  var and__3822__auto____73450 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____73450)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____73451 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____73451) {
        return or__3824__auto____73451
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____73450
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____73452 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____73452)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____73452
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____73453 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____73453)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____73453
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____73454 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____73454) {
    return or__3824__auto____73454
  }else {
    var G__73455__73456 = f;
    if(G__73455__73456 != null) {
      if(function() {
        var or__3824__auto____73457 = G__73455__73456.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____73457) {
          return or__3824__auto____73457
        }else {
          return G__73455__73456.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__73455__73456.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__73455__73456)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__73455__73456)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____73458 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____73458) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____73458
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
    var and__3822__auto____73459 = coll;
    if(cljs.core.truth_(and__3822__auto____73459)) {
      var and__3822__auto____73460 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____73460) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____73460
      }
    }else {
      return and__3822__auto____73459
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
    var G__73465__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__73461 = cljs.core.set([y, x]);
        var xs__73462 = more;
        while(true) {
          var x__73463 = cljs.core.first.call(null, xs__73462);
          var etc__73464 = cljs.core.next.call(null, xs__73462);
          if(cljs.core.truth_(xs__73462)) {
            if(cljs.core.contains_QMARK_.call(null, s__73461, x__73463)) {
              return false
            }else {
              var G__73466 = cljs.core.conj.call(null, s__73461, x__73463);
              var G__73467 = etc__73464;
              s__73461 = G__73466;
              xs__73462 = G__73467;
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
    var G__73465 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73465__delegate.call(this, x, y, more)
    };
    G__73465.cljs$lang$maxFixedArity = 2;
    G__73465.cljs$lang$applyTo = function(arglist__73468) {
      var x = cljs.core.first(arglist__73468);
      var y = cljs.core.first(cljs.core.next(arglist__73468));
      var more = cljs.core.rest(cljs.core.next(arglist__73468));
      return G__73465__delegate(x, y, more)
    };
    G__73465.cljs$lang$arity$variadic = G__73465__delegate;
    return G__73465
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
      var r__73469 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__73469)) {
        return r__73469
      }else {
        if(cljs.core.truth_(r__73469)) {
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
      var a__73470 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__73470, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__73470)
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
    var temp__3971__auto____73471 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____73471)) {
      var s__73472 = temp__3971__auto____73471;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__73472), cljs.core.next.call(null, s__73472))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__73473 = val;
    var coll__73474 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__73474)) {
        var nval__73475 = f.call(null, val__73473, cljs.core.first.call(null, coll__73474));
        if(cljs.core.reduced_QMARK_.call(null, nval__73475)) {
          return cljs.core.deref.call(null, nval__73475)
        }else {
          var G__73476 = nval__73475;
          var G__73477 = cljs.core.next.call(null, coll__73474);
          val__73473 = G__73476;
          coll__73474 = G__73477;
          continue
        }
      }else {
        return val__73473
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
      var G__73478__73479 = coll;
      if(G__73478__73479 != null) {
        if(function() {
          var or__3824__auto____73480 = G__73478__73479.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____73480) {
            return or__3824__auto____73480
          }else {
            return G__73478__73479.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__73478__73479.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73478__73479)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73478__73479)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__73481__73482 = coll;
      if(G__73481__73482 != null) {
        if(function() {
          var or__3824__auto____73483 = G__73481__73482.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____73483) {
            return or__3824__auto____73483
          }else {
            return G__73481__73482.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__73481__73482.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73481__73482)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__73481__73482)
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
  var this__73484 = this;
  return this__73484.val
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
    var G__73485__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__73485 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73485__delegate.call(this, x, y, more)
    };
    G__73485.cljs$lang$maxFixedArity = 2;
    G__73485.cljs$lang$applyTo = function(arglist__73486) {
      var x = cljs.core.first(arglist__73486);
      var y = cljs.core.first(cljs.core.next(arglist__73486));
      var more = cljs.core.rest(cljs.core.next(arglist__73486));
      return G__73485__delegate(x, y, more)
    };
    G__73485.cljs$lang$arity$variadic = G__73485__delegate;
    return G__73485
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
    var G__73487__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__73487 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73487__delegate.call(this, x, y, more)
    };
    G__73487.cljs$lang$maxFixedArity = 2;
    G__73487.cljs$lang$applyTo = function(arglist__73488) {
      var x = cljs.core.first(arglist__73488);
      var y = cljs.core.first(cljs.core.next(arglist__73488));
      var more = cljs.core.rest(cljs.core.next(arglist__73488));
      return G__73487__delegate(x, y, more)
    };
    G__73487.cljs$lang$arity$variadic = G__73487__delegate;
    return G__73487
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
    var G__73489__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__73489 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73489__delegate.call(this, x, y, more)
    };
    G__73489.cljs$lang$maxFixedArity = 2;
    G__73489.cljs$lang$applyTo = function(arglist__73490) {
      var x = cljs.core.first(arglist__73490);
      var y = cljs.core.first(cljs.core.next(arglist__73490));
      var more = cljs.core.rest(cljs.core.next(arglist__73490));
      return G__73489__delegate(x, y, more)
    };
    G__73489.cljs$lang$arity$variadic = G__73489__delegate;
    return G__73489
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
    var G__73491__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__73491 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73491__delegate.call(this, x, y, more)
    };
    G__73491.cljs$lang$maxFixedArity = 2;
    G__73491.cljs$lang$applyTo = function(arglist__73492) {
      var x = cljs.core.first(arglist__73492);
      var y = cljs.core.first(cljs.core.next(arglist__73492));
      var more = cljs.core.rest(cljs.core.next(arglist__73492));
      return G__73491__delegate(x, y, more)
    };
    G__73491.cljs$lang$arity$variadic = G__73491__delegate;
    return G__73491
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
    var G__73493__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73494 = y;
            var G__73495 = cljs.core.first.call(null, more);
            var G__73496 = cljs.core.next.call(null, more);
            x = G__73494;
            y = G__73495;
            more = G__73496;
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
    var G__73493 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73493__delegate.call(this, x, y, more)
    };
    G__73493.cljs$lang$maxFixedArity = 2;
    G__73493.cljs$lang$applyTo = function(arglist__73497) {
      var x = cljs.core.first(arglist__73497);
      var y = cljs.core.first(cljs.core.next(arglist__73497));
      var more = cljs.core.rest(cljs.core.next(arglist__73497));
      return G__73493__delegate(x, y, more)
    };
    G__73493.cljs$lang$arity$variadic = G__73493__delegate;
    return G__73493
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
    var G__73498__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73499 = y;
            var G__73500 = cljs.core.first.call(null, more);
            var G__73501 = cljs.core.next.call(null, more);
            x = G__73499;
            y = G__73500;
            more = G__73501;
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
    var G__73498 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73498__delegate.call(this, x, y, more)
    };
    G__73498.cljs$lang$maxFixedArity = 2;
    G__73498.cljs$lang$applyTo = function(arglist__73502) {
      var x = cljs.core.first(arglist__73502);
      var y = cljs.core.first(cljs.core.next(arglist__73502));
      var more = cljs.core.rest(cljs.core.next(arglist__73502));
      return G__73498__delegate(x, y, more)
    };
    G__73498.cljs$lang$arity$variadic = G__73498__delegate;
    return G__73498
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
    var G__73503__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73504 = y;
            var G__73505 = cljs.core.first.call(null, more);
            var G__73506 = cljs.core.next.call(null, more);
            x = G__73504;
            y = G__73505;
            more = G__73506;
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
    var G__73503 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73503__delegate.call(this, x, y, more)
    };
    G__73503.cljs$lang$maxFixedArity = 2;
    G__73503.cljs$lang$applyTo = function(arglist__73507) {
      var x = cljs.core.first(arglist__73507);
      var y = cljs.core.first(cljs.core.next(arglist__73507));
      var more = cljs.core.rest(cljs.core.next(arglist__73507));
      return G__73503__delegate(x, y, more)
    };
    G__73503.cljs$lang$arity$variadic = G__73503__delegate;
    return G__73503
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
    var G__73508__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73509 = y;
            var G__73510 = cljs.core.first.call(null, more);
            var G__73511 = cljs.core.next.call(null, more);
            x = G__73509;
            y = G__73510;
            more = G__73511;
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
    var G__73508 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73508__delegate.call(this, x, y, more)
    };
    G__73508.cljs$lang$maxFixedArity = 2;
    G__73508.cljs$lang$applyTo = function(arglist__73512) {
      var x = cljs.core.first(arglist__73512);
      var y = cljs.core.first(cljs.core.next(arglist__73512));
      var more = cljs.core.rest(cljs.core.next(arglist__73512));
      return G__73508__delegate(x, y, more)
    };
    G__73508.cljs$lang$arity$variadic = G__73508__delegate;
    return G__73508
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
    var G__73513__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__73513 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73513__delegate.call(this, x, y, more)
    };
    G__73513.cljs$lang$maxFixedArity = 2;
    G__73513.cljs$lang$applyTo = function(arglist__73514) {
      var x = cljs.core.first(arglist__73514);
      var y = cljs.core.first(cljs.core.next(arglist__73514));
      var more = cljs.core.rest(cljs.core.next(arglist__73514));
      return G__73513__delegate(x, y, more)
    };
    G__73513.cljs$lang$arity$variadic = G__73513__delegate;
    return G__73513
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
    var G__73515__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__73515 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73515__delegate.call(this, x, y, more)
    };
    G__73515.cljs$lang$maxFixedArity = 2;
    G__73515.cljs$lang$applyTo = function(arglist__73516) {
      var x = cljs.core.first(arglist__73516);
      var y = cljs.core.first(cljs.core.next(arglist__73516));
      var more = cljs.core.rest(cljs.core.next(arglist__73516));
      return G__73515__delegate(x, y, more)
    };
    G__73515.cljs$lang$arity$variadic = G__73515__delegate;
    return G__73515
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
  var rem__73517 = n % d;
  return cljs.core.fix.call(null, (n - rem__73517) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__73518 = cljs.core.quot.call(null, n, d);
  return n - d * q__73518
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
  var c__73519 = 0;
  var n__73520 = n;
  while(true) {
    if(n__73520 === 0) {
      return c__73519
    }else {
      var G__73521 = c__73519 + 1;
      var G__73522 = n__73520 & n__73520 - 1;
      c__73519 = G__73521;
      n__73520 = G__73522;
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
    var G__73523__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__73524 = y;
            var G__73525 = cljs.core.first.call(null, more);
            var G__73526 = cljs.core.next.call(null, more);
            x = G__73524;
            y = G__73525;
            more = G__73526;
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
    var G__73523 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73523__delegate.call(this, x, y, more)
    };
    G__73523.cljs$lang$maxFixedArity = 2;
    G__73523.cljs$lang$applyTo = function(arglist__73527) {
      var x = cljs.core.first(arglist__73527);
      var y = cljs.core.first(cljs.core.next(arglist__73527));
      var more = cljs.core.rest(cljs.core.next(arglist__73527));
      return G__73523__delegate(x, y, more)
    };
    G__73523.cljs$lang$arity$variadic = G__73523__delegate;
    return G__73523
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
  var n__73528 = n;
  var xs__73529 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____73530 = xs__73529;
      if(cljs.core.truth_(and__3822__auto____73530)) {
        return n__73528 > 0
      }else {
        return and__3822__auto____73530
      }
    }())) {
      var G__73531 = n__73528 - 1;
      var G__73532 = cljs.core.next.call(null, xs__73529);
      n__73528 = G__73531;
      xs__73529 = G__73532;
      continue
    }else {
      return xs__73529
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
    var G__73533__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__73534 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__73535 = cljs.core.next.call(null, more);
            sb = G__73534;
            more = G__73535;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__73533 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__73533__delegate.call(this, x, ys)
    };
    G__73533.cljs$lang$maxFixedArity = 1;
    G__73533.cljs$lang$applyTo = function(arglist__73536) {
      var x = cljs.core.first(arglist__73536);
      var ys = cljs.core.rest(arglist__73536);
      return G__73533__delegate(x, ys)
    };
    G__73533.cljs$lang$arity$variadic = G__73533__delegate;
    return G__73533
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
    var G__73537__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__73538 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__73539 = cljs.core.next.call(null, more);
            sb = G__73538;
            more = G__73539;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__73537 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__73537__delegate.call(this, x, ys)
    };
    G__73537.cljs$lang$maxFixedArity = 1;
    G__73537.cljs$lang$applyTo = function(arglist__73540) {
      var x = cljs.core.first(arglist__73540);
      var ys = cljs.core.rest(arglist__73540);
      return G__73537__delegate(x, ys)
    };
    G__73537.cljs$lang$arity$variadic = G__73537__delegate;
    return G__73537
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
    var xs__73541 = cljs.core.seq.call(null, x);
    var ys__73542 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__73541 == null) {
        return ys__73542 == null
      }else {
        if(ys__73542 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__73541), cljs.core.first.call(null, ys__73542))) {
            var G__73543 = cljs.core.next.call(null, xs__73541);
            var G__73544 = cljs.core.next.call(null, ys__73542);
            xs__73541 = G__73543;
            ys__73542 = G__73544;
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
  return cljs.core.reduce.call(null, function(p1__73545_SHARP_, p2__73546_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__73545_SHARP_, cljs.core.hash.call(null, p2__73546_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__73547 = 0;
  var s__73548 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__73548)) {
      var e__73549 = cljs.core.first.call(null, s__73548);
      var G__73550 = (h__73547 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__73549)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__73549)))) % 4503599627370496;
      var G__73551 = cljs.core.next.call(null, s__73548);
      h__73547 = G__73550;
      s__73548 = G__73551;
      continue
    }else {
      return h__73547
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__73552 = 0;
  var s__73553 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__73553)) {
      var e__73554 = cljs.core.first.call(null, s__73553);
      var G__73555 = (h__73552 + cljs.core.hash.call(null, e__73554)) % 4503599627370496;
      var G__73556 = cljs.core.next.call(null, s__73553);
      h__73552 = G__73555;
      s__73553 = G__73556;
      continue
    }else {
      return h__73552
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__73557__73558 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__73557__73558)) {
    var G__73560__73562 = cljs.core.first.call(null, G__73557__73558);
    var vec__73561__73563 = G__73560__73562;
    var key_name__73564 = cljs.core.nth.call(null, vec__73561__73563, 0, null);
    var f__73565 = cljs.core.nth.call(null, vec__73561__73563, 1, null);
    var G__73557__73566 = G__73557__73558;
    var G__73560__73567 = G__73560__73562;
    var G__73557__73568 = G__73557__73566;
    while(true) {
      var vec__73569__73570 = G__73560__73567;
      var key_name__73571 = cljs.core.nth.call(null, vec__73569__73570, 0, null);
      var f__73572 = cljs.core.nth.call(null, vec__73569__73570, 1, null);
      var G__73557__73573 = G__73557__73568;
      var str_name__73574 = cljs.core.name.call(null, key_name__73571);
      obj[str_name__73574] = f__73572;
      var temp__3974__auto____73575 = cljs.core.next.call(null, G__73557__73573);
      if(cljs.core.truth_(temp__3974__auto____73575)) {
        var G__73557__73576 = temp__3974__auto____73575;
        var G__73577 = cljs.core.first.call(null, G__73557__73576);
        var G__73578 = G__73557__73576;
        G__73560__73567 = G__73577;
        G__73557__73568 = G__73578;
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
  var this__73579 = this;
  var h__364__auto____73580 = this__73579.__hash;
  if(h__364__auto____73580 != null) {
    return h__364__auto____73580
  }else {
    var h__364__auto____73581 = cljs.core.hash_coll.call(null, coll);
    this__73579.__hash = h__364__auto____73581;
    return h__364__auto____73581
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__73582 = this;
  return new cljs.core.List(this__73582.meta, o, coll, this__73582.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__73583 = this;
  var this$__73584 = this;
  return cljs.core.pr_str.call(null, this$__73584)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__73585 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__73586 = this;
  return this__73586.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__73587 = this;
  return this__73587.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__73588 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__73589 = this;
  return this__73589.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__73590 = this;
  return this__73590.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__73591 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__73592 = this;
  return new cljs.core.List(meta, this__73592.first, this__73592.rest, this__73592.count, this__73592.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__73593 = this;
  return this__73593.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__73594 = this;
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
  var this__73595 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__73596 = this;
  return new cljs.core.List(this__73596.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__73597 = this;
  var this$__73598 = this;
  return cljs.core.pr_str.call(null, this$__73598)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__73599 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__73600 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__73601 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__73602 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__73603 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__73604 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__73605 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__73606 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__73607 = this;
  return this__73607.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__73608 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__73609__73610 = coll;
  if(G__73609__73610 != null) {
    if(function() {
      var or__3824__auto____73611 = G__73609__73610.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____73611) {
        return or__3824__auto____73611
      }else {
        return G__73609__73610.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__73609__73610.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__73609__73610)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__73609__73610)
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
  list.cljs$lang$applyTo = function(arglist__73612) {
    var items = cljs.core.seq(arglist__73612);
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
  var this__73613 = this;
  var h__364__auto____73614 = this__73613.__hash;
  if(h__364__auto____73614 != null) {
    return h__364__auto____73614
  }else {
    var h__364__auto____73615 = cljs.core.hash_coll.call(null, coll);
    this__73613.__hash = h__364__auto____73615;
    return h__364__auto____73615
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__73616 = this;
  return new cljs.core.Cons(null, o, coll, this__73616.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__73617 = this;
  var this$__73618 = this;
  return cljs.core.pr_str.call(null, this$__73618)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__73619 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__73620 = this;
  return this__73620.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__73621 = this;
  if(this__73621.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__73621.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__73622 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__73623 = this;
  return new cljs.core.Cons(meta, this__73623.first, this__73623.rest, this__73623.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__73624 = this;
  return this__73624.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__73625 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__73625.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____73626 = coll == null;
    if(or__3824__auto____73626) {
      return or__3824__auto____73626
    }else {
      var G__73627__73628 = coll;
      if(G__73627__73628 != null) {
        if(function() {
          var or__3824__auto____73629 = G__73627__73628.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____73629) {
            return or__3824__auto____73629
          }else {
            return G__73627__73628.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__73627__73628.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73627__73628)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__73627__73628)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__73630__73631 = x;
  if(G__73630__73631 != null) {
    if(function() {
      var or__3824__auto____73632 = G__73630__73631.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____73632) {
        return or__3824__auto____73632
      }else {
        return G__73630__73631.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__73630__73631.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__73630__73631)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__73630__73631)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__73633 = null;
  var G__73633__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__73633__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__73633 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__73633__2.call(this, string, f);
      case 3:
        return G__73633__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73633
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__73634 = null;
  var G__73634__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__73634__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__73634 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73634__2.call(this, string, k);
      case 3:
        return G__73634__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73634
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__73635 = null;
  var G__73635__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__73635__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__73635 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73635__2.call(this, string, n);
      case 3:
        return G__73635__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73635
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
  var G__73644 = null;
  var G__73644__2 = function(tsym73638, coll) {
    var tsym73638__73640 = this;
    var this$__73641 = tsym73638__73640;
    return cljs.core.get.call(null, coll, this$__73641.toString())
  };
  var G__73644__3 = function(tsym73639, coll, not_found) {
    var tsym73639__73642 = this;
    var this$__73643 = tsym73639__73642;
    return cljs.core.get.call(null, coll, this$__73643.toString(), not_found)
  };
  G__73644 = function(tsym73639, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__73644__2.call(this, tsym73639, coll);
      case 3:
        return G__73644__3.call(this, tsym73639, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__73644
}();
String.prototype.apply = function(tsym73636, args73637) {
  return tsym73636.call.apply(tsym73636, [tsym73636].concat(cljs.core.aclone.call(null, args73637)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__73645 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__73645
  }else {
    lazy_seq.x = x__73645.call(null);
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
  var this__73646 = this;
  var h__364__auto____73647 = this__73646.__hash;
  if(h__364__auto____73647 != null) {
    return h__364__auto____73647
  }else {
    var h__364__auto____73648 = cljs.core.hash_coll.call(null, coll);
    this__73646.__hash = h__364__auto____73648;
    return h__364__auto____73648
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__73649 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__73650 = this;
  var this$__73651 = this;
  return cljs.core.pr_str.call(null, this$__73651)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__73652 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__73653 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__73654 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__73655 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__73656 = this;
  return new cljs.core.LazySeq(meta, this__73656.realized, this__73656.x, this__73656.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__73657 = this;
  return this__73657.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__73658 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__73658.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__73659 = [];
  var s__73660 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__73660))) {
      ary__73659.push(cljs.core.first.call(null, s__73660));
      var G__73661 = cljs.core.next.call(null, s__73660);
      s__73660 = G__73661;
      continue
    }else {
      return ary__73659
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__73662 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__73663 = 0;
  var xs__73664 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__73664)) {
      ret__73662[i__73663] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__73664));
      var G__73665 = i__73663 + 1;
      var G__73666 = cljs.core.next.call(null, xs__73664);
      i__73663 = G__73665;
      xs__73664 = G__73666;
      continue
    }else {
    }
    break
  }
  return ret__73662
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
    var a__73667 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__73668 = cljs.core.seq.call(null, init_val_or_seq);
      var i__73669 = 0;
      var s__73670 = s__73668;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____73671 = s__73670;
          if(cljs.core.truth_(and__3822__auto____73671)) {
            return i__73669 < size
          }else {
            return and__3822__auto____73671
          }
        }())) {
          a__73667[i__73669] = cljs.core.first.call(null, s__73670);
          var G__73674 = i__73669 + 1;
          var G__73675 = cljs.core.next.call(null, s__73670);
          i__73669 = G__73674;
          s__73670 = G__73675;
          continue
        }else {
          return a__73667
        }
        break
      }
    }else {
      var n__685__auto____73672 = size;
      var i__73673 = 0;
      while(true) {
        if(i__73673 < n__685__auto____73672) {
          a__73667[i__73673] = init_val_or_seq;
          var G__73676 = i__73673 + 1;
          i__73673 = G__73676;
          continue
        }else {
        }
        break
      }
      return a__73667
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
    var a__73677 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__73678 = cljs.core.seq.call(null, init_val_or_seq);
      var i__73679 = 0;
      var s__73680 = s__73678;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____73681 = s__73680;
          if(cljs.core.truth_(and__3822__auto____73681)) {
            return i__73679 < size
          }else {
            return and__3822__auto____73681
          }
        }())) {
          a__73677[i__73679] = cljs.core.first.call(null, s__73680);
          var G__73684 = i__73679 + 1;
          var G__73685 = cljs.core.next.call(null, s__73680);
          i__73679 = G__73684;
          s__73680 = G__73685;
          continue
        }else {
          return a__73677
        }
        break
      }
    }else {
      var n__685__auto____73682 = size;
      var i__73683 = 0;
      while(true) {
        if(i__73683 < n__685__auto____73682) {
          a__73677[i__73683] = init_val_or_seq;
          var G__73686 = i__73683 + 1;
          i__73683 = G__73686;
          continue
        }else {
        }
        break
      }
      return a__73677
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
    var a__73687 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__73688 = cljs.core.seq.call(null, init_val_or_seq);
      var i__73689 = 0;
      var s__73690 = s__73688;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____73691 = s__73690;
          if(cljs.core.truth_(and__3822__auto____73691)) {
            return i__73689 < size
          }else {
            return and__3822__auto____73691
          }
        }())) {
          a__73687[i__73689] = cljs.core.first.call(null, s__73690);
          var G__73694 = i__73689 + 1;
          var G__73695 = cljs.core.next.call(null, s__73690);
          i__73689 = G__73694;
          s__73690 = G__73695;
          continue
        }else {
          return a__73687
        }
        break
      }
    }else {
      var n__685__auto____73692 = size;
      var i__73693 = 0;
      while(true) {
        if(i__73693 < n__685__auto____73692) {
          a__73687[i__73693] = init_val_or_seq;
          var G__73696 = i__73693 + 1;
          i__73693 = G__73696;
          continue
        }else {
        }
        break
      }
      return a__73687
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
    var s__73697 = s;
    var i__73698 = n;
    var sum__73699 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____73700 = i__73698 > 0;
        if(and__3822__auto____73700) {
          return cljs.core.seq.call(null, s__73697)
        }else {
          return and__3822__auto____73700
        }
      }())) {
        var G__73701 = cljs.core.next.call(null, s__73697);
        var G__73702 = i__73698 - 1;
        var G__73703 = sum__73699 + 1;
        s__73697 = G__73701;
        i__73698 = G__73702;
        sum__73699 = G__73703;
        continue
      }else {
        return sum__73699
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
      var s__73704 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__73704)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__73704), concat.call(null, cljs.core.rest.call(null, s__73704), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__73707__delegate = function(x, y, zs) {
      var cat__73706 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__73705 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__73705)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__73705), cat.call(null, cljs.core.rest.call(null, xys__73705), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__73706.call(null, concat.call(null, x, y), zs)
    };
    var G__73707 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73707__delegate.call(this, x, y, zs)
    };
    G__73707.cljs$lang$maxFixedArity = 2;
    G__73707.cljs$lang$applyTo = function(arglist__73708) {
      var x = cljs.core.first(arglist__73708);
      var y = cljs.core.first(cljs.core.next(arglist__73708));
      var zs = cljs.core.rest(cljs.core.next(arglist__73708));
      return G__73707__delegate(x, y, zs)
    };
    G__73707.cljs$lang$arity$variadic = G__73707__delegate;
    return G__73707
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
    var G__73709__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__73709 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__73709__delegate.call(this, a, b, c, d, more)
    };
    G__73709.cljs$lang$maxFixedArity = 4;
    G__73709.cljs$lang$applyTo = function(arglist__73710) {
      var a = cljs.core.first(arglist__73710);
      var b = cljs.core.first(cljs.core.next(arglist__73710));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73710)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73710))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73710))));
      return G__73709__delegate(a, b, c, d, more)
    };
    G__73709.cljs$lang$arity$variadic = G__73709__delegate;
    return G__73709
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
  var args__73711 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__73712 = cljs.core._first.call(null, args__73711);
    var args__73713 = cljs.core._rest.call(null, args__73711);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__73712)
      }else {
        return f.call(null, a__73712)
      }
    }else {
      var b__73714 = cljs.core._first.call(null, args__73713);
      var args__73715 = cljs.core._rest.call(null, args__73713);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__73712, b__73714)
        }else {
          return f.call(null, a__73712, b__73714)
        }
      }else {
        var c__73716 = cljs.core._first.call(null, args__73715);
        var args__73717 = cljs.core._rest.call(null, args__73715);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__73712, b__73714, c__73716)
          }else {
            return f.call(null, a__73712, b__73714, c__73716)
          }
        }else {
          var d__73718 = cljs.core._first.call(null, args__73717);
          var args__73719 = cljs.core._rest.call(null, args__73717);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__73712, b__73714, c__73716, d__73718)
            }else {
              return f.call(null, a__73712, b__73714, c__73716, d__73718)
            }
          }else {
            var e__73720 = cljs.core._first.call(null, args__73719);
            var args__73721 = cljs.core._rest.call(null, args__73719);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__73712, b__73714, c__73716, d__73718, e__73720)
              }else {
                return f.call(null, a__73712, b__73714, c__73716, d__73718, e__73720)
              }
            }else {
              var f__73722 = cljs.core._first.call(null, args__73721);
              var args__73723 = cljs.core._rest.call(null, args__73721);
              if(argc === 6) {
                if(f__73722.cljs$lang$arity$6) {
                  return f__73722.cljs$lang$arity$6(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722)
                }else {
                  return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722)
                }
              }else {
                var g__73724 = cljs.core._first.call(null, args__73723);
                var args__73725 = cljs.core._rest.call(null, args__73723);
                if(argc === 7) {
                  if(f__73722.cljs$lang$arity$7) {
                    return f__73722.cljs$lang$arity$7(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724)
                  }else {
                    return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724)
                  }
                }else {
                  var h__73726 = cljs.core._first.call(null, args__73725);
                  var args__73727 = cljs.core._rest.call(null, args__73725);
                  if(argc === 8) {
                    if(f__73722.cljs$lang$arity$8) {
                      return f__73722.cljs$lang$arity$8(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726)
                    }else {
                      return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726)
                    }
                  }else {
                    var i__73728 = cljs.core._first.call(null, args__73727);
                    var args__73729 = cljs.core._rest.call(null, args__73727);
                    if(argc === 9) {
                      if(f__73722.cljs$lang$arity$9) {
                        return f__73722.cljs$lang$arity$9(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728)
                      }else {
                        return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728)
                      }
                    }else {
                      var j__73730 = cljs.core._first.call(null, args__73729);
                      var args__73731 = cljs.core._rest.call(null, args__73729);
                      if(argc === 10) {
                        if(f__73722.cljs$lang$arity$10) {
                          return f__73722.cljs$lang$arity$10(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730)
                        }else {
                          return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730)
                        }
                      }else {
                        var k__73732 = cljs.core._first.call(null, args__73731);
                        var args__73733 = cljs.core._rest.call(null, args__73731);
                        if(argc === 11) {
                          if(f__73722.cljs$lang$arity$11) {
                            return f__73722.cljs$lang$arity$11(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732)
                          }else {
                            return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732)
                          }
                        }else {
                          var l__73734 = cljs.core._first.call(null, args__73733);
                          var args__73735 = cljs.core._rest.call(null, args__73733);
                          if(argc === 12) {
                            if(f__73722.cljs$lang$arity$12) {
                              return f__73722.cljs$lang$arity$12(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734)
                            }else {
                              return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734)
                            }
                          }else {
                            var m__73736 = cljs.core._first.call(null, args__73735);
                            var args__73737 = cljs.core._rest.call(null, args__73735);
                            if(argc === 13) {
                              if(f__73722.cljs$lang$arity$13) {
                                return f__73722.cljs$lang$arity$13(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736)
                              }else {
                                return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736)
                              }
                            }else {
                              var n__73738 = cljs.core._first.call(null, args__73737);
                              var args__73739 = cljs.core._rest.call(null, args__73737);
                              if(argc === 14) {
                                if(f__73722.cljs$lang$arity$14) {
                                  return f__73722.cljs$lang$arity$14(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738)
                                }else {
                                  return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738)
                                }
                              }else {
                                var o__73740 = cljs.core._first.call(null, args__73739);
                                var args__73741 = cljs.core._rest.call(null, args__73739);
                                if(argc === 15) {
                                  if(f__73722.cljs$lang$arity$15) {
                                    return f__73722.cljs$lang$arity$15(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740)
                                  }else {
                                    return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740)
                                  }
                                }else {
                                  var p__73742 = cljs.core._first.call(null, args__73741);
                                  var args__73743 = cljs.core._rest.call(null, args__73741);
                                  if(argc === 16) {
                                    if(f__73722.cljs$lang$arity$16) {
                                      return f__73722.cljs$lang$arity$16(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742)
                                    }else {
                                      return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742)
                                    }
                                  }else {
                                    var q__73744 = cljs.core._first.call(null, args__73743);
                                    var args__73745 = cljs.core._rest.call(null, args__73743);
                                    if(argc === 17) {
                                      if(f__73722.cljs$lang$arity$17) {
                                        return f__73722.cljs$lang$arity$17(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744)
                                      }else {
                                        return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744)
                                      }
                                    }else {
                                      var r__73746 = cljs.core._first.call(null, args__73745);
                                      var args__73747 = cljs.core._rest.call(null, args__73745);
                                      if(argc === 18) {
                                        if(f__73722.cljs$lang$arity$18) {
                                          return f__73722.cljs$lang$arity$18(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746)
                                        }else {
                                          return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746)
                                        }
                                      }else {
                                        var s__73748 = cljs.core._first.call(null, args__73747);
                                        var args__73749 = cljs.core._rest.call(null, args__73747);
                                        if(argc === 19) {
                                          if(f__73722.cljs$lang$arity$19) {
                                            return f__73722.cljs$lang$arity$19(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746, s__73748)
                                          }else {
                                            return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746, s__73748)
                                          }
                                        }else {
                                          var t__73750 = cljs.core._first.call(null, args__73749);
                                          var args__73751 = cljs.core._rest.call(null, args__73749);
                                          if(argc === 20) {
                                            if(f__73722.cljs$lang$arity$20) {
                                              return f__73722.cljs$lang$arity$20(a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746, s__73748, t__73750)
                                            }else {
                                              return f__73722.call(null, a__73712, b__73714, c__73716, d__73718, e__73720, f__73722, g__73724, h__73726, i__73728, j__73730, k__73732, l__73734, m__73736, n__73738, o__73740, p__73742, q__73744, r__73746, s__73748, t__73750)
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
    var fixed_arity__73752 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__73753 = cljs.core.bounded_count.call(null, args, fixed_arity__73752 + 1);
      if(bc__73753 <= fixed_arity__73752) {
        return cljs.core.apply_to.call(null, f, bc__73753, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__73754 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__73755 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__73756 = cljs.core.bounded_count.call(null, arglist__73754, fixed_arity__73755 + 1);
      if(bc__73756 <= fixed_arity__73755) {
        return cljs.core.apply_to.call(null, f, bc__73756, arglist__73754)
      }else {
        return f.cljs$lang$applyTo(arglist__73754)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__73754))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__73757 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__73758 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__73759 = cljs.core.bounded_count.call(null, arglist__73757, fixed_arity__73758 + 1);
      if(bc__73759 <= fixed_arity__73758) {
        return cljs.core.apply_to.call(null, f, bc__73759, arglist__73757)
      }else {
        return f.cljs$lang$applyTo(arglist__73757)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__73757))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__73760 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__73761 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__73762 = cljs.core.bounded_count.call(null, arglist__73760, fixed_arity__73761 + 1);
      if(bc__73762 <= fixed_arity__73761) {
        return cljs.core.apply_to.call(null, f, bc__73762, arglist__73760)
      }else {
        return f.cljs$lang$applyTo(arglist__73760)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__73760))
    }
  };
  var apply__6 = function() {
    var G__73766__delegate = function(f, a, b, c, d, args) {
      var arglist__73763 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__73764 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__73765 = cljs.core.bounded_count.call(null, arglist__73763, fixed_arity__73764 + 1);
        if(bc__73765 <= fixed_arity__73764) {
          return cljs.core.apply_to.call(null, f, bc__73765, arglist__73763)
        }else {
          return f.cljs$lang$applyTo(arglist__73763)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__73763))
      }
    };
    var G__73766 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__73766__delegate.call(this, f, a, b, c, d, args)
    };
    G__73766.cljs$lang$maxFixedArity = 5;
    G__73766.cljs$lang$applyTo = function(arglist__73767) {
      var f = cljs.core.first(arglist__73767);
      var a = cljs.core.first(cljs.core.next(arglist__73767));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73767)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73767))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73767)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73767)))));
      return G__73766__delegate(f, a, b, c, d, args)
    };
    G__73766.cljs$lang$arity$variadic = G__73766__delegate;
    return G__73766
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
  vary_meta.cljs$lang$applyTo = function(arglist__73768) {
    var obj = cljs.core.first(arglist__73768);
    var f = cljs.core.first(cljs.core.next(arglist__73768));
    var args = cljs.core.rest(cljs.core.next(arglist__73768));
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
    var G__73769__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__73769 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73769__delegate.call(this, x, y, more)
    };
    G__73769.cljs$lang$maxFixedArity = 2;
    G__73769.cljs$lang$applyTo = function(arglist__73770) {
      var x = cljs.core.first(arglist__73770);
      var y = cljs.core.first(cljs.core.next(arglist__73770));
      var more = cljs.core.rest(cljs.core.next(arglist__73770));
      return G__73769__delegate(x, y, more)
    };
    G__73769.cljs$lang$arity$variadic = G__73769__delegate;
    return G__73769
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
        var G__73771 = pred;
        var G__73772 = cljs.core.next.call(null, coll);
        pred = G__73771;
        coll = G__73772;
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
      var or__3824__auto____73773 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____73773)) {
        return or__3824__auto____73773
      }else {
        var G__73774 = pred;
        var G__73775 = cljs.core.next.call(null, coll);
        pred = G__73774;
        coll = G__73775;
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
    var G__73776 = null;
    var G__73776__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__73776__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__73776__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__73776__3 = function() {
      var G__73777__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__73777 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__73777__delegate.call(this, x, y, zs)
      };
      G__73777.cljs$lang$maxFixedArity = 2;
      G__73777.cljs$lang$applyTo = function(arglist__73778) {
        var x = cljs.core.first(arglist__73778);
        var y = cljs.core.first(cljs.core.next(arglist__73778));
        var zs = cljs.core.rest(cljs.core.next(arglist__73778));
        return G__73777__delegate(x, y, zs)
      };
      G__73777.cljs$lang$arity$variadic = G__73777__delegate;
      return G__73777
    }();
    G__73776 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__73776__0.call(this);
        case 1:
          return G__73776__1.call(this, x);
        case 2:
          return G__73776__2.call(this, x, y);
        default:
          return G__73776__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__73776.cljs$lang$maxFixedArity = 2;
    G__73776.cljs$lang$applyTo = G__73776__3.cljs$lang$applyTo;
    return G__73776
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__73779__delegate = function(args) {
      return x
    };
    var G__73779 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__73779__delegate.call(this, args)
    };
    G__73779.cljs$lang$maxFixedArity = 0;
    G__73779.cljs$lang$applyTo = function(arglist__73780) {
      var args = cljs.core.seq(arglist__73780);
      return G__73779__delegate(args)
    };
    G__73779.cljs$lang$arity$variadic = G__73779__delegate;
    return G__73779
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
      var G__73784 = null;
      var G__73784__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__73784__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__73784__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__73784__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__73784__4 = function() {
        var G__73785__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__73785 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73785__delegate.call(this, x, y, z, args)
        };
        G__73785.cljs$lang$maxFixedArity = 3;
        G__73785.cljs$lang$applyTo = function(arglist__73786) {
          var x = cljs.core.first(arglist__73786);
          var y = cljs.core.first(cljs.core.next(arglist__73786));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73786)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73786)));
          return G__73785__delegate(x, y, z, args)
        };
        G__73785.cljs$lang$arity$variadic = G__73785__delegate;
        return G__73785
      }();
      G__73784 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__73784__0.call(this);
          case 1:
            return G__73784__1.call(this, x);
          case 2:
            return G__73784__2.call(this, x, y);
          case 3:
            return G__73784__3.call(this, x, y, z);
          default:
            return G__73784__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__73784.cljs$lang$maxFixedArity = 3;
      G__73784.cljs$lang$applyTo = G__73784__4.cljs$lang$applyTo;
      return G__73784
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__73787 = null;
      var G__73787__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__73787__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__73787__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__73787__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__73787__4 = function() {
        var G__73788__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__73788 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73788__delegate.call(this, x, y, z, args)
        };
        G__73788.cljs$lang$maxFixedArity = 3;
        G__73788.cljs$lang$applyTo = function(arglist__73789) {
          var x = cljs.core.first(arglist__73789);
          var y = cljs.core.first(cljs.core.next(arglist__73789));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73789)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73789)));
          return G__73788__delegate(x, y, z, args)
        };
        G__73788.cljs$lang$arity$variadic = G__73788__delegate;
        return G__73788
      }();
      G__73787 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__73787__0.call(this);
          case 1:
            return G__73787__1.call(this, x);
          case 2:
            return G__73787__2.call(this, x, y);
          case 3:
            return G__73787__3.call(this, x, y, z);
          default:
            return G__73787__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__73787.cljs$lang$maxFixedArity = 3;
      G__73787.cljs$lang$applyTo = G__73787__4.cljs$lang$applyTo;
      return G__73787
    }()
  };
  var comp__4 = function() {
    var G__73790__delegate = function(f1, f2, f3, fs) {
      var fs__73781 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__73791__delegate = function(args) {
          var ret__73782 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__73781), args);
          var fs__73783 = cljs.core.next.call(null, fs__73781);
          while(true) {
            if(cljs.core.truth_(fs__73783)) {
              var G__73792 = cljs.core.first.call(null, fs__73783).call(null, ret__73782);
              var G__73793 = cljs.core.next.call(null, fs__73783);
              ret__73782 = G__73792;
              fs__73783 = G__73793;
              continue
            }else {
              return ret__73782
            }
            break
          }
        };
        var G__73791 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__73791__delegate.call(this, args)
        };
        G__73791.cljs$lang$maxFixedArity = 0;
        G__73791.cljs$lang$applyTo = function(arglist__73794) {
          var args = cljs.core.seq(arglist__73794);
          return G__73791__delegate(args)
        };
        G__73791.cljs$lang$arity$variadic = G__73791__delegate;
        return G__73791
      }()
    };
    var G__73790 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__73790__delegate.call(this, f1, f2, f3, fs)
    };
    G__73790.cljs$lang$maxFixedArity = 3;
    G__73790.cljs$lang$applyTo = function(arglist__73795) {
      var f1 = cljs.core.first(arglist__73795);
      var f2 = cljs.core.first(cljs.core.next(arglist__73795));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73795)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73795)));
      return G__73790__delegate(f1, f2, f3, fs)
    };
    G__73790.cljs$lang$arity$variadic = G__73790__delegate;
    return G__73790
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
      var G__73796__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__73796 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__73796__delegate.call(this, args)
      };
      G__73796.cljs$lang$maxFixedArity = 0;
      G__73796.cljs$lang$applyTo = function(arglist__73797) {
        var args = cljs.core.seq(arglist__73797);
        return G__73796__delegate(args)
      };
      G__73796.cljs$lang$arity$variadic = G__73796__delegate;
      return G__73796
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__73798__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__73798 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__73798__delegate.call(this, args)
      };
      G__73798.cljs$lang$maxFixedArity = 0;
      G__73798.cljs$lang$applyTo = function(arglist__73799) {
        var args = cljs.core.seq(arglist__73799);
        return G__73798__delegate(args)
      };
      G__73798.cljs$lang$arity$variadic = G__73798__delegate;
      return G__73798
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__73800__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__73800 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__73800__delegate.call(this, args)
      };
      G__73800.cljs$lang$maxFixedArity = 0;
      G__73800.cljs$lang$applyTo = function(arglist__73801) {
        var args = cljs.core.seq(arglist__73801);
        return G__73800__delegate(args)
      };
      G__73800.cljs$lang$arity$variadic = G__73800__delegate;
      return G__73800
    }()
  };
  var partial__5 = function() {
    var G__73802__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__73803__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__73803 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__73803__delegate.call(this, args)
        };
        G__73803.cljs$lang$maxFixedArity = 0;
        G__73803.cljs$lang$applyTo = function(arglist__73804) {
          var args = cljs.core.seq(arglist__73804);
          return G__73803__delegate(args)
        };
        G__73803.cljs$lang$arity$variadic = G__73803__delegate;
        return G__73803
      }()
    };
    var G__73802 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__73802__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__73802.cljs$lang$maxFixedArity = 4;
    G__73802.cljs$lang$applyTo = function(arglist__73805) {
      var f = cljs.core.first(arglist__73805);
      var arg1 = cljs.core.first(cljs.core.next(arglist__73805));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73805)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73805))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73805))));
      return G__73802__delegate(f, arg1, arg2, arg3, more)
    };
    G__73802.cljs$lang$arity$variadic = G__73802__delegate;
    return G__73802
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
      var G__73806 = null;
      var G__73806__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__73806__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__73806__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__73806__4 = function() {
        var G__73807__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__73807 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73807__delegate.call(this, a, b, c, ds)
        };
        G__73807.cljs$lang$maxFixedArity = 3;
        G__73807.cljs$lang$applyTo = function(arglist__73808) {
          var a = cljs.core.first(arglist__73808);
          var b = cljs.core.first(cljs.core.next(arglist__73808));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73808)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73808)));
          return G__73807__delegate(a, b, c, ds)
        };
        G__73807.cljs$lang$arity$variadic = G__73807__delegate;
        return G__73807
      }();
      G__73806 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__73806__1.call(this, a);
          case 2:
            return G__73806__2.call(this, a, b);
          case 3:
            return G__73806__3.call(this, a, b, c);
          default:
            return G__73806__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__73806.cljs$lang$maxFixedArity = 3;
      G__73806.cljs$lang$applyTo = G__73806__4.cljs$lang$applyTo;
      return G__73806
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__73809 = null;
      var G__73809__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__73809__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__73809__4 = function() {
        var G__73810__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__73810 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73810__delegate.call(this, a, b, c, ds)
        };
        G__73810.cljs$lang$maxFixedArity = 3;
        G__73810.cljs$lang$applyTo = function(arglist__73811) {
          var a = cljs.core.first(arglist__73811);
          var b = cljs.core.first(cljs.core.next(arglist__73811));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73811)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73811)));
          return G__73810__delegate(a, b, c, ds)
        };
        G__73810.cljs$lang$arity$variadic = G__73810__delegate;
        return G__73810
      }();
      G__73809 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__73809__2.call(this, a, b);
          case 3:
            return G__73809__3.call(this, a, b, c);
          default:
            return G__73809__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__73809.cljs$lang$maxFixedArity = 3;
      G__73809.cljs$lang$applyTo = G__73809__4.cljs$lang$applyTo;
      return G__73809
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__73812 = null;
      var G__73812__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__73812__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__73812__4 = function() {
        var G__73813__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__73813 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73813__delegate.call(this, a, b, c, ds)
        };
        G__73813.cljs$lang$maxFixedArity = 3;
        G__73813.cljs$lang$applyTo = function(arglist__73814) {
          var a = cljs.core.first(arglist__73814);
          var b = cljs.core.first(cljs.core.next(arglist__73814));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73814)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73814)));
          return G__73813__delegate(a, b, c, ds)
        };
        G__73813.cljs$lang$arity$variadic = G__73813__delegate;
        return G__73813
      }();
      G__73812 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__73812__2.call(this, a, b);
          case 3:
            return G__73812__3.call(this, a, b, c);
          default:
            return G__73812__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__73812.cljs$lang$maxFixedArity = 3;
      G__73812.cljs$lang$applyTo = G__73812__4.cljs$lang$applyTo;
      return G__73812
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
  var mapi__73817 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____73815 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73815)) {
        var s__73816 = temp__3974__auto____73815;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__73816)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__73816)))
      }else {
        return null
      }
    })
  };
  return mapi__73817.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____73818 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____73818)) {
      var s__73819 = temp__3974__auto____73818;
      var x__73820 = f.call(null, cljs.core.first.call(null, s__73819));
      if(x__73820 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__73819))
      }else {
        return cljs.core.cons.call(null, x__73820, keep.call(null, f, cljs.core.rest.call(null, s__73819)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__73830 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____73827 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73827)) {
        var s__73828 = temp__3974__auto____73827;
        var x__73829 = f.call(null, idx, cljs.core.first.call(null, s__73828));
        if(x__73829 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__73828))
        }else {
          return cljs.core.cons.call(null, x__73829, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__73828)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__73830.call(null, 0, coll)
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
          var and__3822__auto____73837 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73837)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____73837
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____73838 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73838)) {
            var and__3822__auto____73839 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____73839)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____73839
            }
          }else {
            return and__3822__auto____73838
          }
        }())
      };
      var ep1__4 = function() {
        var G__73875__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____73840 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____73840)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____73840
            }
          }())
        };
        var G__73875 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73875__delegate.call(this, x, y, z, args)
        };
        G__73875.cljs$lang$maxFixedArity = 3;
        G__73875.cljs$lang$applyTo = function(arglist__73876) {
          var x = cljs.core.first(arglist__73876);
          var y = cljs.core.first(cljs.core.next(arglist__73876));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73876)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73876)));
          return G__73875__delegate(x, y, z, args)
        };
        G__73875.cljs$lang$arity$variadic = G__73875__delegate;
        return G__73875
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
          var and__3822__auto____73841 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73841)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____73841
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____73842 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73842)) {
            var and__3822__auto____73843 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____73843)) {
              var and__3822__auto____73844 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____73844)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____73844
              }
            }else {
              return and__3822__auto____73843
            }
          }else {
            return and__3822__auto____73842
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____73845 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73845)) {
            var and__3822__auto____73846 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____73846)) {
              var and__3822__auto____73847 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____73847)) {
                var and__3822__auto____73848 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____73848)) {
                  var and__3822__auto____73849 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____73849)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____73849
                  }
                }else {
                  return and__3822__auto____73848
                }
              }else {
                return and__3822__auto____73847
              }
            }else {
              return and__3822__auto____73846
            }
          }else {
            return and__3822__auto____73845
          }
        }())
      };
      var ep2__4 = function() {
        var G__73877__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____73850 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____73850)) {
              return cljs.core.every_QMARK_.call(null, function(p1__73821_SHARP_) {
                var and__3822__auto____73851 = p1.call(null, p1__73821_SHARP_);
                if(cljs.core.truth_(and__3822__auto____73851)) {
                  return p2.call(null, p1__73821_SHARP_)
                }else {
                  return and__3822__auto____73851
                }
              }, args)
            }else {
              return and__3822__auto____73850
            }
          }())
        };
        var G__73877 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73877__delegate.call(this, x, y, z, args)
        };
        G__73877.cljs$lang$maxFixedArity = 3;
        G__73877.cljs$lang$applyTo = function(arglist__73878) {
          var x = cljs.core.first(arglist__73878);
          var y = cljs.core.first(cljs.core.next(arglist__73878));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73878)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73878)));
          return G__73877__delegate(x, y, z, args)
        };
        G__73877.cljs$lang$arity$variadic = G__73877__delegate;
        return G__73877
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
          var and__3822__auto____73852 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73852)) {
            var and__3822__auto____73853 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____73853)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____73853
            }
          }else {
            return and__3822__auto____73852
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____73854 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73854)) {
            var and__3822__auto____73855 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____73855)) {
              var and__3822__auto____73856 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____73856)) {
                var and__3822__auto____73857 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____73857)) {
                  var and__3822__auto____73858 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____73858)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____73858
                  }
                }else {
                  return and__3822__auto____73857
                }
              }else {
                return and__3822__auto____73856
              }
            }else {
              return and__3822__auto____73855
            }
          }else {
            return and__3822__auto____73854
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____73859 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____73859)) {
            var and__3822__auto____73860 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____73860)) {
              var and__3822__auto____73861 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____73861)) {
                var and__3822__auto____73862 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____73862)) {
                  var and__3822__auto____73863 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____73863)) {
                    var and__3822__auto____73864 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____73864)) {
                      var and__3822__auto____73865 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____73865)) {
                        var and__3822__auto____73866 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____73866)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____73866
                        }
                      }else {
                        return and__3822__auto____73865
                      }
                    }else {
                      return and__3822__auto____73864
                    }
                  }else {
                    return and__3822__auto____73863
                  }
                }else {
                  return and__3822__auto____73862
                }
              }else {
                return and__3822__auto____73861
              }
            }else {
              return and__3822__auto____73860
            }
          }else {
            return and__3822__auto____73859
          }
        }())
      };
      var ep3__4 = function() {
        var G__73879__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____73867 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____73867)) {
              return cljs.core.every_QMARK_.call(null, function(p1__73822_SHARP_) {
                var and__3822__auto____73868 = p1.call(null, p1__73822_SHARP_);
                if(cljs.core.truth_(and__3822__auto____73868)) {
                  var and__3822__auto____73869 = p2.call(null, p1__73822_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____73869)) {
                    return p3.call(null, p1__73822_SHARP_)
                  }else {
                    return and__3822__auto____73869
                  }
                }else {
                  return and__3822__auto____73868
                }
              }, args)
            }else {
              return and__3822__auto____73867
            }
          }())
        };
        var G__73879 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73879__delegate.call(this, x, y, z, args)
        };
        G__73879.cljs$lang$maxFixedArity = 3;
        G__73879.cljs$lang$applyTo = function(arglist__73880) {
          var x = cljs.core.first(arglist__73880);
          var y = cljs.core.first(cljs.core.next(arglist__73880));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73880)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73880)));
          return G__73879__delegate(x, y, z, args)
        };
        G__73879.cljs$lang$arity$variadic = G__73879__delegate;
        return G__73879
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
    var G__73881__delegate = function(p1, p2, p3, ps) {
      var ps__73870 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__73823_SHARP_) {
            return p1__73823_SHARP_.call(null, x)
          }, ps__73870)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__73824_SHARP_) {
            var and__3822__auto____73871 = p1__73824_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____73871)) {
              return p1__73824_SHARP_.call(null, y)
            }else {
              return and__3822__auto____73871
            }
          }, ps__73870)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__73825_SHARP_) {
            var and__3822__auto____73872 = p1__73825_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____73872)) {
              var and__3822__auto____73873 = p1__73825_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____73873)) {
                return p1__73825_SHARP_.call(null, z)
              }else {
                return and__3822__auto____73873
              }
            }else {
              return and__3822__auto____73872
            }
          }, ps__73870)
        };
        var epn__4 = function() {
          var G__73882__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____73874 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____73874)) {
                return cljs.core.every_QMARK_.call(null, function(p1__73826_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__73826_SHARP_, args)
                }, ps__73870)
              }else {
                return and__3822__auto____73874
              }
            }())
          };
          var G__73882 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__73882__delegate.call(this, x, y, z, args)
          };
          G__73882.cljs$lang$maxFixedArity = 3;
          G__73882.cljs$lang$applyTo = function(arglist__73883) {
            var x = cljs.core.first(arglist__73883);
            var y = cljs.core.first(cljs.core.next(arglist__73883));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73883)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73883)));
            return G__73882__delegate(x, y, z, args)
          };
          G__73882.cljs$lang$arity$variadic = G__73882__delegate;
          return G__73882
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
    var G__73881 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__73881__delegate.call(this, p1, p2, p3, ps)
    };
    G__73881.cljs$lang$maxFixedArity = 3;
    G__73881.cljs$lang$applyTo = function(arglist__73884) {
      var p1 = cljs.core.first(arglist__73884);
      var p2 = cljs.core.first(cljs.core.next(arglist__73884));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73884)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73884)));
      return G__73881__delegate(p1, p2, p3, ps)
    };
    G__73881.cljs$lang$arity$variadic = G__73881__delegate;
    return G__73881
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
        var or__3824__auto____73886 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73886)) {
          return or__3824__auto____73886
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____73887 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73887)) {
          return or__3824__auto____73887
        }else {
          var or__3824__auto____73888 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____73888)) {
            return or__3824__auto____73888
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__73924__delegate = function(x, y, z, args) {
          var or__3824__auto____73889 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____73889)) {
            return or__3824__auto____73889
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__73924 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73924__delegate.call(this, x, y, z, args)
        };
        G__73924.cljs$lang$maxFixedArity = 3;
        G__73924.cljs$lang$applyTo = function(arglist__73925) {
          var x = cljs.core.first(arglist__73925);
          var y = cljs.core.first(cljs.core.next(arglist__73925));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73925)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73925)));
          return G__73924__delegate(x, y, z, args)
        };
        G__73924.cljs$lang$arity$variadic = G__73924__delegate;
        return G__73924
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
        var or__3824__auto____73890 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73890)) {
          return or__3824__auto____73890
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____73891 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73891)) {
          return or__3824__auto____73891
        }else {
          var or__3824__auto____73892 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____73892)) {
            return or__3824__auto____73892
          }else {
            var or__3824__auto____73893 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____73893)) {
              return or__3824__auto____73893
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____73894 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73894)) {
          return or__3824__auto____73894
        }else {
          var or__3824__auto____73895 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____73895)) {
            return or__3824__auto____73895
          }else {
            var or__3824__auto____73896 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____73896)) {
              return or__3824__auto____73896
            }else {
              var or__3824__auto____73897 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____73897)) {
                return or__3824__auto____73897
              }else {
                var or__3824__auto____73898 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____73898)) {
                  return or__3824__auto____73898
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__73926__delegate = function(x, y, z, args) {
          var or__3824__auto____73899 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____73899)) {
            return or__3824__auto____73899
          }else {
            return cljs.core.some.call(null, function(p1__73831_SHARP_) {
              var or__3824__auto____73900 = p1.call(null, p1__73831_SHARP_);
              if(cljs.core.truth_(or__3824__auto____73900)) {
                return or__3824__auto____73900
              }else {
                return p2.call(null, p1__73831_SHARP_)
              }
            }, args)
          }
        };
        var G__73926 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73926__delegate.call(this, x, y, z, args)
        };
        G__73926.cljs$lang$maxFixedArity = 3;
        G__73926.cljs$lang$applyTo = function(arglist__73927) {
          var x = cljs.core.first(arglist__73927);
          var y = cljs.core.first(cljs.core.next(arglist__73927));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73927)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73927)));
          return G__73926__delegate(x, y, z, args)
        };
        G__73926.cljs$lang$arity$variadic = G__73926__delegate;
        return G__73926
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
        var or__3824__auto____73901 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73901)) {
          return or__3824__auto____73901
        }else {
          var or__3824__auto____73902 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____73902)) {
            return or__3824__auto____73902
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____73903 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73903)) {
          return or__3824__auto____73903
        }else {
          var or__3824__auto____73904 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____73904)) {
            return or__3824__auto____73904
          }else {
            var or__3824__auto____73905 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____73905)) {
              return or__3824__auto____73905
            }else {
              var or__3824__auto____73906 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____73906)) {
                return or__3824__auto____73906
              }else {
                var or__3824__auto____73907 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____73907)) {
                  return or__3824__auto____73907
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____73908 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____73908)) {
          return or__3824__auto____73908
        }else {
          var or__3824__auto____73909 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____73909)) {
            return or__3824__auto____73909
          }else {
            var or__3824__auto____73910 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____73910)) {
              return or__3824__auto____73910
            }else {
              var or__3824__auto____73911 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____73911)) {
                return or__3824__auto____73911
              }else {
                var or__3824__auto____73912 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____73912)) {
                  return or__3824__auto____73912
                }else {
                  var or__3824__auto____73913 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____73913)) {
                    return or__3824__auto____73913
                  }else {
                    var or__3824__auto____73914 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____73914)) {
                      return or__3824__auto____73914
                    }else {
                      var or__3824__auto____73915 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____73915)) {
                        return or__3824__auto____73915
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
        var G__73928__delegate = function(x, y, z, args) {
          var or__3824__auto____73916 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____73916)) {
            return or__3824__auto____73916
          }else {
            return cljs.core.some.call(null, function(p1__73832_SHARP_) {
              var or__3824__auto____73917 = p1.call(null, p1__73832_SHARP_);
              if(cljs.core.truth_(or__3824__auto____73917)) {
                return or__3824__auto____73917
              }else {
                var or__3824__auto____73918 = p2.call(null, p1__73832_SHARP_);
                if(cljs.core.truth_(or__3824__auto____73918)) {
                  return or__3824__auto____73918
                }else {
                  return p3.call(null, p1__73832_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__73928 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__73928__delegate.call(this, x, y, z, args)
        };
        G__73928.cljs$lang$maxFixedArity = 3;
        G__73928.cljs$lang$applyTo = function(arglist__73929) {
          var x = cljs.core.first(arglist__73929);
          var y = cljs.core.first(cljs.core.next(arglist__73929));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73929)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73929)));
          return G__73928__delegate(x, y, z, args)
        };
        G__73928.cljs$lang$arity$variadic = G__73928__delegate;
        return G__73928
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
    var G__73930__delegate = function(p1, p2, p3, ps) {
      var ps__73919 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__73833_SHARP_) {
            return p1__73833_SHARP_.call(null, x)
          }, ps__73919)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__73834_SHARP_) {
            var or__3824__auto____73920 = p1__73834_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____73920)) {
              return or__3824__auto____73920
            }else {
              return p1__73834_SHARP_.call(null, y)
            }
          }, ps__73919)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__73835_SHARP_) {
            var or__3824__auto____73921 = p1__73835_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____73921)) {
              return or__3824__auto____73921
            }else {
              var or__3824__auto____73922 = p1__73835_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____73922)) {
                return or__3824__auto____73922
              }else {
                return p1__73835_SHARP_.call(null, z)
              }
            }
          }, ps__73919)
        };
        var spn__4 = function() {
          var G__73931__delegate = function(x, y, z, args) {
            var or__3824__auto____73923 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____73923)) {
              return or__3824__auto____73923
            }else {
              return cljs.core.some.call(null, function(p1__73836_SHARP_) {
                return cljs.core.some.call(null, p1__73836_SHARP_, args)
              }, ps__73919)
            }
          };
          var G__73931 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__73931__delegate.call(this, x, y, z, args)
          };
          G__73931.cljs$lang$maxFixedArity = 3;
          G__73931.cljs$lang$applyTo = function(arglist__73932) {
            var x = cljs.core.first(arglist__73932);
            var y = cljs.core.first(cljs.core.next(arglist__73932));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73932)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73932)));
            return G__73931__delegate(x, y, z, args)
          };
          G__73931.cljs$lang$arity$variadic = G__73931__delegate;
          return G__73931
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
    var G__73930 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__73930__delegate.call(this, p1, p2, p3, ps)
    };
    G__73930.cljs$lang$maxFixedArity = 3;
    G__73930.cljs$lang$applyTo = function(arglist__73933) {
      var p1 = cljs.core.first(arglist__73933);
      var p2 = cljs.core.first(cljs.core.next(arglist__73933));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73933)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__73933)));
      return G__73930__delegate(p1, p2, p3, ps)
    };
    G__73930.cljs$lang$arity$variadic = G__73930__delegate;
    return G__73930
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
      var temp__3974__auto____73934 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73934)) {
        var s__73935 = temp__3974__auto____73934;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__73935)), map.call(null, f, cljs.core.rest.call(null, s__73935)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__73936 = cljs.core.seq.call(null, c1);
      var s2__73937 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____73938 = s1__73936;
        if(cljs.core.truth_(and__3822__auto____73938)) {
          return s2__73937
        }else {
          return and__3822__auto____73938
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__73936), cljs.core.first.call(null, s2__73937)), map.call(null, f, cljs.core.rest.call(null, s1__73936), cljs.core.rest.call(null, s2__73937)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__73939 = cljs.core.seq.call(null, c1);
      var s2__73940 = cljs.core.seq.call(null, c2);
      var s3__73941 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____73942 = s1__73939;
        if(cljs.core.truth_(and__3822__auto____73942)) {
          var and__3822__auto____73943 = s2__73940;
          if(cljs.core.truth_(and__3822__auto____73943)) {
            return s3__73941
          }else {
            return and__3822__auto____73943
          }
        }else {
          return and__3822__auto____73942
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__73939), cljs.core.first.call(null, s2__73940), cljs.core.first.call(null, s3__73941)), map.call(null, f, cljs.core.rest.call(null, s1__73939), cljs.core.rest.call(null, s2__73940), cljs.core.rest.call(null, s3__73941)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__73946__delegate = function(f, c1, c2, c3, colls) {
      var step__73945 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__73944 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__73944)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__73944), step.call(null, map.call(null, cljs.core.rest, ss__73944)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__73885_SHARP_) {
        return cljs.core.apply.call(null, f, p1__73885_SHARP_)
      }, step__73945.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__73946 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__73946__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__73946.cljs$lang$maxFixedArity = 4;
    G__73946.cljs$lang$applyTo = function(arglist__73947) {
      var f = cljs.core.first(arglist__73947);
      var c1 = cljs.core.first(cljs.core.next(arglist__73947));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73947)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73947))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73947))));
      return G__73946__delegate(f, c1, c2, c3, colls)
    };
    G__73946.cljs$lang$arity$variadic = G__73946__delegate;
    return G__73946
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
      var temp__3974__auto____73948 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73948)) {
        var s__73949 = temp__3974__auto____73948;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__73949), take.call(null, n - 1, cljs.core.rest.call(null, s__73949)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__73952 = function(n, coll) {
    while(true) {
      var s__73950 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____73951 = n > 0;
        if(and__3822__auto____73951) {
          return s__73950
        }else {
          return and__3822__auto____73951
        }
      }())) {
        var G__73953 = n - 1;
        var G__73954 = cljs.core.rest.call(null, s__73950);
        n = G__73953;
        coll = G__73954;
        continue
      }else {
        return s__73950
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__73952.call(null, n, coll)
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
  var s__73955 = cljs.core.seq.call(null, coll);
  var lead__73956 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__73956)) {
      var G__73957 = cljs.core.next.call(null, s__73955);
      var G__73958 = cljs.core.next.call(null, lead__73956);
      s__73955 = G__73957;
      lead__73956 = G__73958;
      continue
    }else {
      return s__73955
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__73961 = function(pred, coll) {
    while(true) {
      var s__73959 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____73960 = s__73959;
        if(cljs.core.truth_(and__3822__auto____73960)) {
          return pred.call(null, cljs.core.first.call(null, s__73959))
        }else {
          return and__3822__auto____73960
        }
      }())) {
        var G__73962 = pred;
        var G__73963 = cljs.core.rest.call(null, s__73959);
        pred = G__73962;
        coll = G__73963;
        continue
      }else {
        return s__73959
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__73961.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____73964 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____73964)) {
      var s__73965 = temp__3974__auto____73964;
      return cljs.core.concat.call(null, s__73965, cycle.call(null, s__73965))
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
      var s1__73966 = cljs.core.seq.call(null, c1);
      var s2__73967 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____73968 = s1__73966;
        if(cljs.core.truth_(and__3822__auto____73968)) {
          return s2__73967
        }else {
          return and__3822__auto____73968
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__73966), cljs.core.cons.call(null, cljs.core.first.call(null, s2__73967), interleave.call(null, cljs.core.rest.call(null, s1__73966), cljs.core.rest.call(null, s2__73967))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__73970__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__73969 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__73969)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__73969), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__73969)))
        }else {
          return null
        }
      })
    };
    var G__73970 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73970__delegate.call(this, c1, c2, colls)
    };
    G__73970.cljs$lang$maxFixedArity = 2;
    G__73970.cljs$lang$applyTo = function(arglist__73971) {
      var c1 = cljs.core.first(arglist__73971);
      var c2 = cljs.core.first(cljs.core.next(arglist__73971));
      var colls = cljs.core.rest(cljs.core.next(arglist__73971));
      return G__73970__delegate(c1, c2, colls)
    };
    G__73970.cljs$lang$arity$variadic = G__73970__delegate;
    return G__73970
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
  var cat__73974 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____73972 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____73972)) {
        var coll__73973 = temp__3971__auto____73972;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__73973), cat.call(null, cljs.core.rest.call(null, coll__73973), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__73974.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__73975__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__73975 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__73975__delegate.call(this, f, coll, colls)
    };
    G__73975.cljs$lang$maxFixedArity = 2;
    G__73975.cljs$lang$applyTo = function(arglist__73976) {
      var f = cljs.core.first(arglist__73976);
      var coll = cljs.core.first(cljs.core.next(arglist__73976));
      var colls = cljs.core.rest(cljs.core.next(arglist__73976));
      return G__73975__delegate(f, coll, colls)
    };
    G__73975.cljs$lang$arity$variadic = G__73975__delegate;
    return G__73975
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
    var temp__3974__auto____73977 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____73977)) {
      var s__73978 = temp__3974__auto____73977;
      var f__73979 = cljs.core.first.call(null, s__73978);
      var r__73980 = cljs.core.rest.call(null, s__73978);
      if(cljs.core.truth_(pred.call(null, f__73979))) {
        return cljs.core.cons.call(null, f__73979, filter.call(null, pred, r__73980))
      }else {
        return filter.call(null, pred, r__73980)
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
  var walk__73982 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__73982.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__73981_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__73981_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__73983__73984 = to;
    if(G__73983__73984 != null) {
      if(function() {
        var or__3824__auto____73985 = G__73983__73984.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____73985) {
          return or__3824__auto____73985
        }else {
          return G__73983__73984.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__73983__73984.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__73983__73984)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__73983__73984)
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
    var G__73986__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__73986 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__73986__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__73986.cljs$lang$maxFixedArity = 4;
    G__73986.cljs$lang$applyTo = function(arglist__73987) {
      var f = cljs.core.first(arglist__73987);
      var c1 = cljs.core.first(cljs.core.next(arglist__73987));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__73987)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73987))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__73987))));
      return G__73986__delegate(f, c1, c2, c3, colls)
    };
    G__73986.cljs$lang$arity$variadic = G__73986__delegate;
    return G__73986
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
      var temp__3974__auto____73988 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73988)) {
        var s__73989 = temp__3974__auto____73988;
        var p__73990 = cljs.core.take.call(null, n, s__73989);
        if(n === cljs.core.count.call(null, p__73990)) {
          return cljs.core.cons.call(null, p__73990, partition.call(null, n, step, cljs.core.drop.call(null, step, s__73989)))
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
      var temp__3974__auto____73991 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____73991)) {
        var s__73992 = temp__3974__auto____73991;
        var p__73993 = cljs.core.take.call(null, n, s__73992);
        if(n === cljs.core.count.call(null, p__73993)) {
          return cljs.core.cons.call(null, p__73993, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__73992)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__73993, pad)))
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
    var sentinel__73994 = cljs.core.lookup_sentinel;
    var m__73995 = m;
    var ks__73996 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__73996)) {
        var m__73997 = cljs.core.get.call(null, m__73995, cljs.core.first.call(null, ks__73996), sentinel__73994);
        if(sentinel__73994 === m__73997) {
          return not_found
        }else {
          var G__73998 = sentinel__73994;
          var G__73999 = m__73997;
          var G__74000 = cljs.core.next.call(null, ks__73996);
          sentinel__73994 = G__73998;
          m__73995 = G__73999;
          ks__73996 = G__74000;
          continue
        }
      }else {
        return m__73995
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
cljs.core.assoc_in = function assoc_in(m, p__74001, v) {
  var vec__74002__74003 = p__74001;
  var k__74004 = cljs.core.nth.call(null, vec__74002__74003, 0, null);
  var ks__74005 = cljs.core.nthnext.call(null, vec__74002__74003, 1);
  if(cljs.core.truth_(ks__74005)) {
    return cljs.core.assoc.call(null, m, k__74004, assoc_in.call(null, cljs.core.get.call(null, m, k__74004), ks__74005, v))
  }else {
    return cljs.core.assoc.call(null, m, k__74004, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__74006, f, args) {
    var vec__74007__74008 = p__74006;
    var k__74009 = cljs.core.nth.call(null, vec__74007__74008, 0, null);
    var ks__74010 = cljs.core.nthnext.call(null, vec__74007__74008, 1);
    if(cljs.core.truth_(ks__74010)) {
      return cljs.core.assoc.call(null, m, k__74009, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__74009), ks__74010, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__74009, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__74009), args))
    }
  };
  var update_in = function(m, p__74006, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__74006, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__74011) {
    var m = cljs.core.first(arglist__74011);
    var p__74006 = cljs.core.first(cljs.core.next(arglist__74011));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__74011)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__74011)));
    return update_in__delegate(m, p__74006, f, args)
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
  var this__74016 = this;
  var h__364__auto____74017 = this__74016.__hash;
  if(h__364__auto____74017 != null) {
    return h__364__auto____74017
  }else {
    var h__364__auto____74018 = cljs.core.hash_coll.call(null, coll);
    this__74016.__hash = h__364__auto____74018;
    return h__364__auto____74018
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74019 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74020 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74021 = this;
  var new_array__74022 = cljs.core.aclone.call(null, this__74021.array);
  new_array__74022[k] = v;
  return new cljs.core.Vector(this__74021.meta, new_array__74022, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__74051 = null;
  var G__74051__2 = function(tsym74014, k) {
    var this__74023 = this;
    var tsym74014__74024 = this;
    var coll__74025 = tsym74014__74024;
    return cljs.core._lookup.call(null, coll__74025, k)
  };
  var G__74051__3 = function(tsym74015, k, not_found) {
    var this__74026 = this;
    var tsym74015__74027 = this;
    var coll__74028 = tsym74015__74027;
    return cljs.core._lookup.call(null, coll__74028, k, not_found)
  };
  G__74051 = function(tsym74015, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74051__2.call(this, tsym74015, k);
      case 3:
        return G__74051__3.call(this, tsym74015, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74051
}();
cljs.core.Vector.prototype.apply = function(tsym74012, args74013) {
  return tsym74012.call.apply(tsym74012, [tsym74012].concat(cljs.core.aclone.call(null, args74013)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74029 = this;
  var new_array__74030 = cljs.core.aclone.call(null, this__74029.array);
  new_array__74030.push(o);
  return new cljs.core.Vector(this__74029.meta, new_array__74030, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__74031 = this;
  var this$__74032 = this;
  return cljs.core.pr_str.call(null, this$__74032)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__74033 = this;
  return cljs.core.ci_reduce.call(null, this__74033.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__74034 = this;
  return cljs.core.ci_reduce.call(null, this__74034.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74035 = this;
  if(this__74035.array.length > 0) {
    var vector_seq__74036 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__74035.array.length) {
          return cljs.core.cons.call(null, this__74035.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__74036.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74037 = this;
  return this__74037.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__74038 = this;
  var count__74039 = this__74038.array.length;
  if(count__74039 > 0) {
    return this__74038.array[count__74039 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__74040 = this;
  if(this__74040.array.length > 0) {
    var new_array__74041 = cljs.core.aclone.call(null, this__74040.array);
    new_array__74041.pop();
    return new cljs.core.Vector(this__74040.meta, new_array__74041, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__74042 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74043 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74044 = this;
  return new cljs.core.Vector(meta, this__74044.array, this__74044.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74045 = this;
  return this__74045.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__74047 = this;
  if(function() {
    var and__3822__auto____74048 = 0 <= n;
    if(and__3822__auto____74048) {
      return n < this__74047.array.length
    }else {
      return and__3822__auto____74048
    }
  }()) {
    return this__74047.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__74049 = this;
  if(function() {
    var and__3822__auto____74050 = 0 <= n;
    if(and__3822__auto____74050) {
      return n < this__74049.array.length
    }else {
      return and__3822__auto____74050
    }
  }()) {
    return this__74049.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74046 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__74046.meta)
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
  var cnt__74052 = pv.cnt;
  if(cnt__74052 < 32) {
    return 0
  }else {
    return cnt__74052 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__74053 = level;
  var ret__74054 = node;
  while(true) {
    if(ll__74053 === 0) {
      return ret__74054
    }else {
      var embed__74055 = ret__74054;
      var r__74056 = cljs.core.pv_fresh_node.call(null, edit);
      var ___74057 = cljs.core.pv_aset.call(null, r__74056, 0, embed__74055);
      var G__74058 = ll__74053 - 5;
      var G__74059 = r__74056;
      ll__74053 = G__74058;
      ret__74054 = G__74059;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__74060 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__74061 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__74060, subidx__74061, tailnode);
    return ret__74060
  }else {
    var temp__3971__auto____74062 = cljs.core.pv_aget.call(null, parent, subidx__74061);
    if(cljs.core.truth_(temp__3971__auto____74062)) {
      var child__74063 = temp__3971__auto____74062;
      var node_to_insert__74064 = push_tail.call(null, pv, level - 5, child__74063, tailnode);
      cljs.core.pv_aset.call(null, ret__74060, subidx__74061, node_to_insert__74064);
      return ret__74060
    }else {
      var node_to_insert__74065 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__74060, subidx__74061, node_to_insert__74065);
      return ret__74060
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____74066 = 0 <= i;
    if(and__3822__auto____74066) {
      return i < pv.cnt
    }else {
      return and__3822__auto____74066
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__74067 = pv.root;
      var level__74068 = pv.shift;
      while(true) {
        if(level__74068 > 0) {
          var G__74069 = cljs.core.pv_aget.call(null, node__74067, i >>> level__74068 & 31);
          var G__74070 = level__74068 - 5;
          node__74067 = G__74069;
          level__74068 = G__74070;
          continue
        }else {
          return node__74067.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__74071 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__74071, i & 31, val);
    return ret__74071
  }else {
    var subidx__74072 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__74071, subidx__74072, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__74072), i, val));
    return ret__74071
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__74073 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__74074 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__74073));
    if(function() {
      var and__3822__auto____74075 = new_child__74074 == null;
      if(and__3822__auto____74075) {
        return subidx__74073 === 0
      }else {
        return and__3822__auto____74075
      }
    }()) {
      return null
    }else {
      var ret__74076 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__74076, subidx__74073, new_child__74074);
      return ret__74076
    }
  }else {
    if(subidx__74073 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__74077 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__74077, subidx__74073, null);
        return ret__74077
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
  var c__74078 = cljs.core._count.call(null, v);
  if(c__74078 > 0) {
    if(void 0 === cljs.core.t74079) {
      cljs.core.t74079 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t74079.cljs$lang$type = true;
      cljs.core.t74079.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t74079")
      };
      cljs.core.t74079.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t74079.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__74080 = this;
        return vseq
      };
      cljs.core.t74079.prototype.cljs$core$ISeq$ = true;
      cljs.core.t74079.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__74081 = this;
        return cljs.core._nth.call(null, this__74081.v, this__74081.offset)
      };
      cljs.core.t74079.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__74082 = this;
        var offset__74083 = this__74082.offset + 1;
        if(offset__74083 < this__74082.c) {
          return this__74082.vector_seq.call(null, this__74082.v, offset__74083)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t74079.prototype.cljs$core$ASeq$ = true;
      cljs.core.t74079.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t74079.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__74084 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t74079.prototype.cljs$core$ISequential$ = true;
      cljs.core.t74079.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t74079.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__74085 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t74079.prototype.cljs$core$IMeta$ = true;
      cljs.core.t74079.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__74086 = this;
        return this__74086.__meta__389__auto__
      };
      cljs.core.t74079.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t74079.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__74087 = this;
        return new cljs.core.t74079(this__74087.c, this__74087.offset, this__74087.v, this__74087.vector_seq, __meta__389__auto__)
      };
      cljs.core.t74079
    }else {
    }
    return new cljs.core.t74079(c__74078, offset, v, vector_seq, null)
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
  var this__74092 = this;
  return new cljs.core.TransientVector(this__74092.cnt, this__74092.shift, cljs.core.tv_editable_root.call(null, this__74092.root), cljs.core.tv_editable_tail.call(null, this__74092.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__74093 = this;
  var h__364__auto____74094 = this__74093.__hash;
  if(h__364__auto____74094 != null) {
    return h__364__auto____74094
  }else {
    var h__364__auto____74095 = cljs.core.hash_coll.call(null, coll);
    this__74093.__hash = h__364__auto____74095;
    return h__364__auto____74095
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74096 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74097 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74098 = this;
  if(function() {
    var and__3822__auto____74099 = 0 <= k;
    if(and__3822__auto____74099) {
      return k < this__74098.cnt
    }else {
      return and__3822__auto____74099
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__74100 = cljs.core.aclone.call(null, this__74098.tail);
      new_tail__74100[k & 31] = v;
      return new cljs.core.PersistentVector(this__74098.meta, this__74098.cnt, this__74098.shift, this__74098.root, new_tail__74100, null)
    }else {
      return new cljs.core.PersistentVector(this__74098.meta, this__74098.cnt, this__74098.shift, cljs.core.do_assoc.call(null, coll, this__74098.shift, this__74098.root, k, v), this__74098.tail, null)
    }
  }else {
    if(k === this__74098.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__74098.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__74145 = null;
  var G__74145__2 = function(tsym74090, k) {
    var this__74101 = this;
    var tsym74090__74102 = this;
    var coll__74103 = tsym74090__74102;
    return cljs.core._lookup.call(null, coll__74103, k)
  };
  var G__74145__3 = function(tsym74091, k, not_found) {
    var this__74104 = this;
    var tsym74091__74105 = this;
    var coll__74106 = tsym74091__74105;
    return cljs.core._lookup.call(null, coll__74106, k, not_found)
  };
  G__74145 = function(tsym74091, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74145__2.call(this, tsym74091, k);
      case 3:
        return G__74145__3.call(this, tsym74091, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74145
}();
cljs.core.PersistentVector.prototype.apply = function(tsym74088, args74089) {
  return tsym74088.call.apply(tsym74088, [tsym74088].concat(cljs.core.aclone.call(null, args74089)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__74107 = this;
  var step_init__74108 = [0, init];
  var i__74109 = 0;
  while(true) {
    if(i__74109 < this__74107.cnt) {
      var arr__74110 = cljs.core.array_for.call(null, v, i__74109);
      var len__74111 = arr__74110.length;
      var init__74115 = function() {
        var j__74112 = 0;
        var init__74113 = step_init__74108[1];
        while(true) {
          if(j__74112 < len__74111) {
            var init__74114 = f.call(null, init__74113, j__74112 + i__74109, arr__74110[j__74112]);
            if(cljs.core.reduced_QMARK_.call(null, init__74114)) {
              return init__74114
            }else {
              var G__74146 = j__74112 + 1;
              var G__74147 = init__74114;
              j__74112 = G__74146;
              init__74113 = G__74147;
              continue
            }
          }else {
            step_init__74108[0] = len__74111;
            step_init__74108[1] = init__74113;
            return init__74113
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__74115)) {
        return cljs.core.deref.call(null, init__74115)
      }else {
        var G__74148 = i__74109 + step_init__74108[0];
        i__74109 = G__74148;
        continue
      }
    }else {
      return step_init__74108[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74116 = this;
  if(this__74116.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__74117 = cljs.core.aclone.call(null, this__74116.tail);
    new_tail__74117.push(o);
    return new cljs.core.PersistentVector(this__74116.meta, this__74116.cnt + 1, this__74116.shift, this__74116.root, new_tail__74117, null)
  }else {
    var root_overflow_QMARK___74118 = this__74116.cnt >>> 5 > 1 << this__74116.shift;
    var new_shift__74119 = root_overflow_QMARK___74118 ? this__74116.shift + 5 : this__74116.shift;
    var new_root__74121 = root_overflow_QMARK___74118 ? function() {
      var n_r__74120 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__74120, 0, this__74116.root);
      cljs.core.pv_aset.call(null, n_r__74120, 1, cljs.core.new_path.call(null, null, this__74116.shift, new cljs.core.VectorNode(null, this__74116.tail)));
      return n_r__74120
    }() : cljs.core.push_tail.call(null, coll, this__74116.shift, this__74116.root, new cljs.core.VectorNode(null, this__74116.tail));
    return new cljs.core.PersistentVector(this__74116.meta, this__74116.cnt + 1, new_shift__74119, new_root__74121, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__74122 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__74123 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__74124 = this;
  var this$__74125 = this;
  return cljs.core.pr_str.call(null, this$__74125)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__74126 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__74127 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74128 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74129 = this;
  return this__74129.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__74130 = this;
  if(this__74130.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__74130.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__74131 = this;
  if(this__74131.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__74131.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__74131.meta)
    }else {
      if(1 < this__74131.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__74131.meta, this__74131.cnt - 1, this__74131.shift, this__74131.root, this__74131.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__74132 = cljs.core.array_for.call(null, coll, this__74131.cnt - 2);
          var nr__74133 = cljs.core.pop_tail.call(null, coll, this__74131.shift, this__74131.root);
          var new_root__74134 = nr__74133 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__74133;
          var cnt_1__74135 = this__74131.cnt - 1;
          if(function() {
            var and__3822__auto____74136 = 5 < this__74131.shift;
            if(and__3822__auto____74136) {
              return cljs.core.pv_aget.call(null, new_root__74134, 1) == null
            }else {
              return and__3822__auto____74136
            }
          }()) {
            return new cljs.core.PersistentVector(this__74131.meta, cnt_1__74135, this__74131.shift - 5, cljs.core.pv_aget.call(null, new_root__74134, 0), new_tail__74132, null)
          }else {
            return new cljs.core.PersistentVector(this__74131.meta, cnt_1__74135, this__74131.shift, new_root__74134, new_tail__74132, null)
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
  var this__74138 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74139 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74140 = this;
  return new cljs.core.PersistentVector(meta, this__74140.cnt, this__74140.shift, this__74140.root, this__74140.tail, this__74140.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74141 = this;
  return this__74141.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__74142 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__74143 = this;
  if(function() {
    var and__3822__auto____74144 = 0 <= n;
    if(and__3822__auto____74144) {
      return n < this__74143.cnt
    }else {
      return and__3822__auto____74144
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74137 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__74137.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__74149 = cljs.core.seq.call(null, xs);
  var out__74150 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__74149)) {
      var G__74151 = cljs.core.next.call(null, xs__74149);
      var G__74152 = cljs.core.conj_BANG_.call(null, out__74150, cljs.core.first.call(null, xs__74149));
      xs__74149 = G__74151;
      out__74150 = G__74152;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__74150)
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
  vector.cljs$lang$applyTo = function(arglist__74153) {
    var args = cljs.core.seq(arglist__74153);
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
  var this__74158 = this;
  var h__364__auto____74159 = this__74158.__hash;
  if(h__364__auto____74159 != null) {
    return h__364__auto____74159
  }else {
    var h__364__auto____74160 = cljs.core.hash_coll.call(null, coll);
    this__74158.__hash = h__364__auto____74160;
    return h__364__auto____74160
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74161 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74162 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__74163 = this;
  var v_pos__74164 = this__74163.start + key;
  return new cljs.core.Subvec(this__74163.meta, cljs.core._assoc.call(null, this__74163.v, v_pos__74164, val), this__74163.start, this__74163.end > v_pos__74164 + 1 ? this__74163.end : v_pos__74164 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__74188 = null;
  var G__74188__2 = function(tsym74156, k) {
    var this__74165 = this;
    var tsym74156__74166 = this;
    var coll__74167 = tsym74156__74166;
    return cljs.core._lookup.call(null, coll__74167, k)
  };
  var G__74188__3 = function(tsym74157, k, not_found) {
    var this__74168 = this;
    var tsym74157__74169 = this;
    var coll__74170 = tsym74157__74169;
    return cljs.core._lookup.call(null, coll__74170, k, not_found)
  };
  G__74188 = function(tsym74157, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74188__2.call(this, tsym74157, k);
      case 3:
        return G__74188__3.call(this, tsym74157, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74188
}();
cljs.core.Subvec.prototype.apply = function(tsym74154, args74155) {
  return tsym74154.call.apply(tsym74154, [tsym74154].concat(cljs.core.aclone.call(null, args74155)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74171 = this;
  return new cljs.core.Subvec(this__74171.meta, cljs.core._assoc_n.call(null, this__74171.v, this__74171.end, o), this__74171.start, this__74171.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__74172 = this;
  var this$__74173 = this;
  return cljs.core.pr_str.call(null, this$__74173)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__74174 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__74175 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74176 = this;
  var subvec_seq__74177 = function subvec_seq(i) {
    if(i === this__74176.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__74176.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__74177.call(null, this__74176.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74178 = this;
  return this__74178.end - this__74178.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__74179 = this;
  return cljs.core._nth.call(null, this__74179.v, this__74179.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__74180 = this;
  if(this__74180.start === this__74180.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__74180.meta, this__74180.v, this__74180.start, this__74180.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__74181 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74182 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74183 = this;
  return new cljs.core.Subvec(meta, this__74183.v, this__74183.start, this__74183.end, this__74183.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74184 = this;
  return this__74184.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__74186 = this;
  return cljs.core._nth.call(null, this__74186.v, this__74186.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__74187 = this;
  return cljs.core._nth.call(null, this__74187.v, this__74187.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74185 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__74185.meta)
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
  var ret__74189 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__74189, 0, tl.length);
  return ret__74189
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__74190 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__74191 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__74190, subidx__74191, level === 5 ? tail_node : function() {
    var child__74192 = cljs.core.pv_aget.call(null, ret__74190, subidx__74191);
    if(child__74192 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__74192, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__74190
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__74193 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__74194 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__74195 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__74193, subidx__74194));
    if(function() {
      var and__3822__auto____74196 = new_child__74195 == null;
      if(and__3822__auto____74196) {
        return subidx__74194 === 0
      }else {
        return and__3822__auto____74196
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__74193, subidx__74194, new_child__74195);
      return node__74193
    }
  }else {
    if(subidx__74194 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__74193, subidx__74194, null);
        return node__74193
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____74197 = 0 <= i;
    if(and__3822__auto____74197) {
      return i < tv.cnt
    }else {
      return and__3822__auto____74197
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__74198 = tv.root;
      var node__74199 = root__74198;
      var level__74200 = tv.shift;
      while(true) {
        if(level__74200 > 0) {
          var G__74201 = cljs.core.tv_ensure_editable.call(null, root__74198.edit, cljs.core.pv_aget.call(null, node__74199, i >>> level__74200 & 31));
          var G__74202 = level__74200 - 5;
          node__74199 = G__74201;
          level__74200 = G__74202;
          continue
        }else {
          return node__74199.arr
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
  var G__74240 = null;
  var G__74240__2 = function(tsym74205, k) {
    var this__74207 = this;
    var tsym74205__74208 = this;
    var coll__74209 = tsym74205__74208;
    return cljs.core._lookup.call(null, coll__74209, k)
  };
  var G__74240__3 = function(tsym74206, k, not_found) {
    var this__74210 = this;
    var tsym74206__74211 = this;
    var coll__74212 = tsym74206__74211;
    return cljs.core._lookup.call(null, coll__74212, k, not_found)
  };
  G__74240 = function(tsym74206, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74240__2.call(this, tsym74206, k);
      case 3:
        return G__74240__3.call(this, tsym74206, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74240
}();
cljs.core.TransientVector.prototype.apply = function(tsym74203, args74204) {
  return tsym74203.call.apply(tsym74203, [tsym74203].concat(cljs.core.aclone.call(null, args74204)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74213 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74214 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__74215 = this;
  if(cljs.core.truth_(this__74215.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__74216 = this;
  if(function() {
    var and__3822__auto____74217 = 0 <= n;
    if(and__3822__auto____74217) {
      return n < this__74216.cnt
    }else {
      return and__3822__auto____74217
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74218 = this;
  if(cljs.core.truth_(this__74218.root.edit)) {
    return this__74218.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__74219 = this;
  if(cljs.core.truth_(this__74219.root.edit)) {
    if(function() {
      var and__3822__auto____74220 = 0 <= n;
      if(and__3822__auto____74220) {
        return n < this__74219.cnt
      }else {
        return and__3822__auto____74220
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__74219.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__74223 = function go(level, node) {
          var node__74221 = cljs.core.tv_ensure_editable.call(null, this__74219.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__74221, n & 31, val);
            return node__74221
          }else {
            var subidx__74222 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__74221, subidx__74222, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__74221, subidx__74222)));
            return node__74221
          }
        }.call(null, this__74219.shift, this__74219.root);
        this__74219.root = new_root__74223;
        return tcoll
      }
    }else {
      if(n === this__74219.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__74219.cnt)].join(""));
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
  var this__74224 = this;
  if(cljs.core.truth_(this__74224.root.edit)) {
    if(this__74224.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__74224.cnt) {
        this__74224.cnt = 0;
        return tcoll
      }else {
        if((this__74224.cnt - 1 & 31) > 0) {
          this__74224.cnt = this__74224.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__74225 = cljs.core.editable_array_for.call(null, tcoll, this__74224.cnt - 2);
            var new_root__74227 = function() {
              var nr__74226 = cljs.core.tv_pop_tail.call(null, tcoll, this__74224.shift, this__74224.root);
              if(nr__74226 != null) {
                return nr__74226
              }else {
                return new cljs.core.VectorNode(this__74224.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____74228 = 5 < this__74224.shift;
              if(and__3822__auto____74228) {
                return cljs.core.pv_aget.call(null, new_root__74227, 1) == null
              }else {
                return and__3822__auto____74228
              }
            }()) {
              var new_root__74229 = cljs.core.tv_ensure_editable.call(null, this__74224.root.edit, cljs.core.pv_aget.call(null, new_root__74227, 0));
              this__74224.root = new_root__74229;
              this__74224.shift = this__74224.shift - 5;
              this__74224.cnt = this__74224.cnt - 1;
              this__74224.tail = new_tail__74225;
              return tcoll
            }else {
              this__74224.root = new_root__74227;
              this__74224.cnt = this__74224.cnt - 1;
              this__74224.tail = new_tail__74225;
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
  var this__74230 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__74231 = this;
  if(cljs.core.truth_(this__74231.root.edit)) {
    if(this__74231.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__74231.tail[this__74231.cnt & 31] = o;
      this__74231.cnt = this__74231.cnt + 1;
      return tcoll
    }else {
      var tail_node__74232 = new cljs.core.VectorNode(this__74231.root.edit, this__74231.tail);
      var new_tail__74233 = cljs.core.make_array.call(null, 32);
      new_tail__74233[0] = o;
      this__74231.tail = new_tail__74233;
      if(this__74231.cnt >>> 5 > 1 << this__74231.shift) {
        var new_root_array__74234 = cljs.core.make_array.call(null, 32);
        var new_shift__74235 = this__74231.shift + 5;
        new_root_array__74234[0] = this__74231.root;
        new_root_array__74234[1] = cljs.core.new_path.call(null, this__74231.root.edit, this__74231.shift, tail_node__74232);
        this__74231.root = new cljs.core.VectorNode(this__74231.root.edit, new_root_array__74234);
        this__74231.shift = new_shift__74235;
        this__74231.cnt = this__74231.cnt + 1;
        return tcoll
      }else {
        var new_root__74236 = cljs.core.tv_push_tail.call(null, tcoll, this__74231.shift, this__74231.root, tail_node__74232);
        this__74231.root = new_root__74236;
        this__74231.cnt = this__74231.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__74237 = this;
  if(cljs.core.truth_(this__74237.root.edit)) {
    this__74237.root.edit = null;
    var len__74238 = this__74237.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__74239 = cljs.core.make_array.call(null, len__74238);
    cljs.core.array_copy.call(null, this__74237.tail, 0, trimmed_tail__74239, 0, len__74238);
    return new cljs.core.PersistentVector(null, this__74237.cnt, this__74237.shift, this__74237.root, trimmed_tail__74239, null)
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
  var this__74241 = this;
  var h__364__auto____74242 = this__74241.__hash;
  if(h__364__auto____74242 != null) {
    return h__364__auto____74242
  }else {
    var h__364__auto____74243 = cljs.core.hash_coll.call(null, coll);
    this__74241.__hash = h__364__auto____74243;
    return h__364__auto____74243
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74244 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__74245 = this;
  var this$__74246 = this;
  return cljs.core.pr_str.call(null, this$__74246)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74247 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__74248 = this;
  return cljs.core._first.call(null, this__74248.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__74249 = this;
  var temp__3971__auto____74250 = cljs.core.next.call(null, this__74249.front);
  if(cljs.core.truth_(temp__3971__auto____74250)) {
    var f1__74251 = temp__3971__auto____74250;
    return new cljs.core.PersistentQueueSeq(this__74249.meta, f1__74251, this__74249.rear, null)
  }else {
    if(this__74249.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__74249.meta, this__74249.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74252 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74253 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__74253.front, this__74253.rear, this__74253.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74254 = this;
  return this__74254.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74255 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__74255.meta)
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
  var this__74256 = this;
  var h__364__auto____74257 = this__74256.__hash;
  if(h__364__auto____74257 != null) {
    return h__364__auto____74257
  }else {
    var h__364__auto____74258 = cljs.core.hash_coll.call(null, coll);
    this__74256.__hash = h__364__auto____74258;
    return h__364__auto____74258
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74259 = this;
  if(cljs.core.truth_(this__74259.front)) {
    return new cljs.core.PersistentQueue(this__74259.meta, this__74259.count + 1, this__74259.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____74260 = this__74259.rear;
      if(cljs.core.truth_(or__3824__auto____74260)) {
        return or__3824__auto____74260
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__74259.meta, this__74259.count + 1, cljs.core.conj.call(null, this__74259.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__74261 = this;
  var this$__74262 = this;
  return cljs.core.pr_str.call(null, this$__74262)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74263 = this;
  var rear__74264 = cljs.core.seq.call(null, this__74263.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____74265 = this__74263.front;
    if(cljs.core.truth_(or__3824__auto____74265)) {
      return or__3824__auto____74265
    }else {
      return rear__74264
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__74263.front, cljs.core.seq.call(null, rear__74264), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74266 = this;
  return this__74266.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__74267 = this;
  return cljs.core._first.call(null, this__74267.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__74268 = this;
  if(cljs.core.truth_(this__74268.front)) {
    var temp__3971__auto____74269 = cljs.core.next.call(null, this__74268.front);
    if(cljs.core.truth_(temp__3971__auto____74269)) {
      var f1__74270 = temp__3971__auto____74269;
      return new cljs.core.PersistentQueue(this__74268.meta, this__74268.count - 1, f1__74270, this__74268.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__74268.meta, this__74268.count - 1, cljs.core.seq.call(null, this__74268.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__74271 = this;
  return cljs.core.first.call(null, this__74271.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__74272 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74273 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74274 = this;
  return new cljs.core.PersistentQueue(meta, this__74274.count, this__74274.front, this__74274.rear, this__74274.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74275 = this;
  return this__74275.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74276 = this;
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
  var this__74277 = this;
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
  var len__74278 = array.length;
  var i__74279 = 0;
  while(true) {
    if(i__74279 < len__74278) {
      if(cljs.core._EQ_.call(null, k, array[i__74279])) {
        return i__74279
      }else {
        var G__74280 = i__74279 + incr;
        i__74279 = G__74280;
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
      var and__3822__auto____74281 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____74281)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____74281
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
  var a__74282 = cljs.core.hash.call(null, a);
  var b__74283 = cljs.core.hash.call(null, b);
  if(a__74282 < b__74283) {
    return-1
  }else {
    if(a__74282 > b__74283) {
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
  var ks__74285 = m.keys;
  var len__74286 = ks__74285.length;
  var so__74287 = m.strobj;
  var out__74288 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__74289 = 0;
  var out__74290 = cljs.core.transient$.call(null, out__74288);
  while(true) {
    if(i__74289 < len__74286) {
      var k__74291 = ks__74285[i__74289];
      var G__74292 = i__74289 + 1;
      var G__74293 = cljs.core.assoc_BANG_.call(null, out__74290, k__74291, so__74287[k__74291]);
      i__74289 = G__74292;
      out__74290 = G__74293;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__74290, k, v))
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
  var this__74298 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__74299 = this;
  var h__364__auto____74300 = this__74299.__hash;
  if(h__364__auto____74300 != null) {
    return h__364__auto____74300
  }else {
    var h__364__auto____74301 = cljs.core.hash_imap.call(null, coll);
    this__74299.__hash = h__364__auto____74301;
    return h__364__auto____74301
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74302 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74303 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__74303.strobj, this__74303.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74304 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___74305 = this__74304.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___74305)) {
      var new_strobj__74306 = goog.object.clone.call(null, this__74304.strobj);
      new_strobj__74306[k] = v;
      return new cljs.core.ObjMap(this__74304.meta, this__74304.keys, new_strobj__74306, this__74304.update_count + 1, null)
    }else {
      if(this__74304.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__74307 = goog.object.clone.call(null, this__74304.strobj);
        var new_keys__74308 = cljs.core.aclone.call(null, this__74304.keys);
        new_strobj__74307[k] = v;
        new_keys__74308.push(k);
        return new cljs.core.ObjMap(this__74304.meta, new_keys__74308, new_strobj__74307, this__74304.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__74309 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__74309.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__74329 = null;
  var G__74329__2 = function(tsym74296, k) {
    var this__74310 = this;
    var tsym74296__74311 = this;
    var coll__74312 = tsym74296__74311;
    return cljs.core._lookup.call(null, coll__74312, k)
  };
  var G__74329__3 = function(tsym74297, k, not_found) {
    var this__74313 = this;
    var tsym74297__74314 = this;
    var coll__74315 = tsym74297__74314;
    return cljs.core._lookup.call(null, coll__74315, k, not_found)
  };
  G__74329 = function(tsym74297, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74329__2.call(this, tsym74297, k);
      case 3:
        return G__74329__3.call(this, tsym74297, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74329
}();
cljs.core.ObjMap.prototype.apply = function(tsym74294, args74295) {
  return tsym74294.call.apply(tsym74294, [tsym74294].concat(cljs.core.aclone.call(null, args74295)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__74316 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__74317 = this;
  var this$__74318 = this;
  return cljs.core.pr_str.call(null, this$__74318)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74319 = this;
  if(this__74319.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__74284_SHARP_) {
      return cljs.core.vector.call(null, p1__74284_SHARP_, this__74319.strobj[p1__74284_SHARP_])
    }, this__74319.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74320 = this;
  return this__74320.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74321 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74322 = this;
  return new cljs.core.ObjMap(meta, this__74322.keys, this__74322.strobj, this__74322.update_count, this__74322.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74323 = this;
  return this__74323.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74324 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__74324.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__74325 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____74326 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____74326)) {
      return this__74325.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____74326
    }
  }())) {
    var new_keys__74327 = cljs.core.aclone.call(null, this__74325.keys);
    var new_strobj__74328 = goog.object.clone.call(null, this__74325.strobj);
    new_keys__74327.splice(cljs.core.scan_array.call(null, 1, k, new_keys__74327), 1);
    cljs.core.js_delete.call(null, new_strobj__74328, k);
    return new cljs.core.ObjMap(this__74325.meta, new_keys__74327, new_strobj__74328, this__74325.update_count + 1, null)
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
  var this__74335 = this;
  var h__364__auto____74336 = this__74335.__hash;
  if(h__364__auto____74336 != null) {
    return h__364__auto____74336
  }else {
    var h__364__auto____74337 = cljs.core.hash_imap.call(null, coll);
    this__74335.__hash = h__364__auto____74337;
    return h__364__auto____74337
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74338 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74339 = this;
  var bucket__74340 = this__74339.hashobj[cljs.core.hash.call(null, k)];
  var i__74341 = cljs.core.truth_(bucket__74340) ? cljs.core.scan_array.call(null, 2, k, bucket__74340) : null;
  if(cljs.core.truth_(i__74341)) {
    return bucket__74340[i__74341 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74342 = this;
  var h__74343 = cljs.core.hash.call(null, k);
  var bucket__74344 = this__74342.hashobj[h__74343];
  if(cljs.core.truth_(bucket__74344)) {
    var new_bucket__74345 = cljs.core.aclone.call(null, bucket__74344);
    var new_hashobj__74346 = goog.object.clone.call(null, this__74342.hashobj);
    new_hashobj__74346[h__74343] = new_bucket__74345;
    var temp__3971__auto____74347 = cljs.core.scan_array.call(null, 2, k, new_bucket__74345);
    if(cljs.core.truth_(temp__3971__auto____74347)) {
      var i__74348 = temp__3971__auto____74347;
      new_bucket__74345[i__74348 + 1] = v;
      return new cljs.core.HashMap(this__74342.meta, this__74342.count, new_hashobj__74346, null)
    }else {
      new_bucket__74345.push(k, v);
      return new cljs.core.HashMap(this__74342.meta, this__74342.count + 1, new_hashobj__74346, null)
    }
  }else {
    var new_hashobj__74349 = goog.object.clone.call(null, this__74342.hashobj);
    new_hashobj__74349[h__74343] = [k, v];
    return new cljs.core.HashMap(this__74342.meta, this__74342.count + 1, new_hashobj__74349, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__74350 = this;
  var bucket__74351 = this__74350.hashobj[cljs.core.hash.call(null, k)];
  var i__74352 = cljs.core.truth_(bucket__74351) ? cljs.core.scan_array.call(null, 2, k, bucket__74351) : null;
  if(cljs.core.truth_(i__74352)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__74375 = null;
  var G__74375__2 = function(tsym74333, k) {
    var this__74353 = this;
    var tsym74333__74354 = this;
    var coll__74355 = tsym74333__74354;
    return cljs.core._lookup.call(null, coll__74355, k)
  };
  var G__74375__3 = function(tsym74334, k, not_found) {
    var this__74356 = this;
    var tsym74334__74357 = this;
    var coll__74358 = tsym74334__74357;
    return cljs.core._lookup.call(null, coll__74358, k, not_found)
  };
  G__74375 = function(tsym74334, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74375__2.call(this, tsym74334, k);
      case 3:
        return G__74375__3.call(this, tsym74334, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74375
}();
cljs.core.HashMap.prototype.apply = function(tsym74331, args74332) {
  return tsym74331.call.apply(tsym74331, [tsym74331].concat(cljs.core.aclone.call(null, args74332)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__74359 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__74360 = this;
  var this$__74361 = this;
  return cljs.core.pr_str.call(null, this$__74361)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74362 = this;
  if(this__74362.count > 0) {
    var hashes__74363 = cljs.core.js_keys.call(null, this__74362.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__74330_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__74362.hashobj[p1__74330_SHARP_]))
    }, hashes__74363)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74364 = this;
  return this__74364.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74365 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74366 = this;
  return new cljs.core.HashMap(meta, this__74366.count, this__74366.hashobj, this__74366.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74367 = this;
  return this__74367.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74368 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__74368.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__74369 = this;
  var h__74370 = cljs.core.hash.call(null, k);
  var bucket__74371 = this__74369.hashobj[h__74370];
  var i__74372 = cljs.core.truth_(bucket__74371) ? cljs.core.scan_array.call(null, 2, k, bucket__74371) : null;
  if(cljs.core.not.call(null, i__74372)) {
    return coll
  }else {
    var new_hashobj__74373 = goog.object.clone.call(null, this__74369.hashobj);
    if(3 > bucket__74371.length) {
      cljs.core.js_delete.call(null, new_hashobj__74373, h__74370)
    }else {
      var new_bucket__74374 = cljs.core.aclone.call(null, bucket__74371);
      new_bucket__74374.splice(i__74372, 2);
      new_hashobj__74373[h__74370] = new_bucket__74374
    }
    return new cljs.core.HashMap(this__74369.meta, this__74369.count - 1, new_hashobj__74373, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__74376 = ks.length;
  var i__74377 = 0;
  var out__74378 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__74377 < len__74376) {
      var G__74379 = i__74377 + 1;
      var G__74380 = cljs.core.assoc.call(null, out__74378, ks[i__74377], vs[i__74377]);
      i__74377 = G__74379;
      out__74378 = G__74380;
      continue
    }else {
      return out__74378
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__74381 = m.arr;
  var len__74382 = arr__74381.length;
  var i__74383 = 0;
  while(true) {
    if(len__74382 <= i__74383) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__74381[i__74383], k)) {
        return i__74383
      }else {
        if("\ufdd0'else") {
          var G__74384 = i__74383 + 2;
          i__74383 = G__74384;
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
  var this__74389 = this;
  return new cljs.core.TransientArrayMap({}, this__74389.arr.length, cljs.core.aclone.call(null, this__74389.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__74390 = this;
  var h__364__auto____74391 = this__74390.__hash;
  if(h__364__auto____74391 != null) {
    return h__364__auto____74391
  }else {
    var h__364__auto____74392 = cljs.core.hash_imap.call(null, coll);
    this__74390.__hash = h__364__auto____74392;
    return h__364__auto____74392
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74393 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74394 = this;
  var idx__74395 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__74395 === -1) {
    return not_found
  }else {
    return this__74394.arr[idx__74395 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74396 = this;
  var idx__74397 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__74397 === -1) {
    if(this__74396.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__74396.meta, this__74396.cnt + 1, function() {
        var G__74398__74399 = cljs.core.aclone.call(null, this__74396.arr);
        G__74398__74399.push(k);
        G__74398__74399.push(v);
        return G__74398__74399
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__74396.arr[idx__74397 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__74396.meta, this__74396.cnt, function() {
          var G__74400__74401 = cljs.core.aclone.call(null, this__74396.arr);
          G__74400__74401[idx__74397 + 1] = v;
          return G__74400__74401
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__74402 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__74432 = null;
  var G__74432__2 = function(tsym74387, k) {
    var this__74403 = this;
    var tsym74387__74404 = this;
    var coll__74405 = tsym74387__74404;
    return cljs.core._lookup.call(null, coll__74405, k)
  };
  var G__74432__3 = function(tsym74388, k, not_found) {
    var this__74406 = this;
    var tsym74388__74407 = this;
    var coll__74408 = tsym74388__74407;
    return cljs.core._lookup.call(null, coll__74408, k, not_found)
  };
  G__74432 = function(tsym74388, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74432__2.call(this, tsym74388, k);
      case 3:
        return G__74432__3.call(this, tsym74388, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74432
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym74385, args74386) {
  return tsym74385.call.apply(tsym74385, [tsym74385].concat(cljs.core.aclone.call(null, args74386)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__74409 = this;
  var len__74410 = this__74409.arr.length;
  var i__74411 = 0;
  var init__74412 = init;
  while(true) {
    if(i__74411 < len__74410) {
      var init__74413 = f.call(null, init__74412, this__74409.arr[i__74411], this__74409.arr[i__74411 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__74413)) {
        return cljs.core.deref.call(null, init__74413)
      }else {
        var G__74433 = i__74411 + 2;
        var G__74434 = init__74413;
        i__74411 = G__74433;
        init__74412 = G__74434;
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
  var this__74414 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__74415 = this;
  var this$__74416 = this;
  return cljs.core.pr_str.call(null, this$__74416)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74417 = this;
  if(this__74417.cnt > 0) {
    var len__74418 = this__74417.arr.length;
    var array_map_seq__74419 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__74418) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__74417.arr[i], this__74417.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__74419.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74420 = this;
  return this__74420.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74421 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74422 = this;
  return new cljs.core.PersistentArrayMap(meta, this__74422.cnt, this__74422.arr, this__74422.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74423 = this;
  return this__74423.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74424 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__74424.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__74425 = this;
  var idx__74426 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__74426 >= 0) {
    var len__74427 = this__74425.arr.length;
    var new_len__74428 = len__74427 - 2;
    if(new_len__74428 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__74429 = cljs.core.make_array.call(null, new_len__74428);
      var s__74430 = 0;
      var d__74431 = 0;
      while(true) {
        if(s__74430 >= len__74427) {
          return new cljs.core.PersistentArrayMap(this__74425.meta, this__74425.cnt - 1, new_arr__74429, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__74425.arr[s__74430])) {
            var G__74435 = s__74430 + 2;
            var G__74436 = d__74431;
            s__74430 = G__74435;
            d__74431 = G__74436;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__74429[d__74431] = this__74425.arr[s__74430];
              new_arr__74429[d__74431 + 1] = this__74425.arr[s__74430 + 1];
              var G__74437 = s__74430 + 2;
              var G__74438 = d__74431 + 2;
              s__74430 = G__74437;
              d__74431 = G__74438;
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
  var len__74439 = cljs.core.count.call(null, ks);
  var i__74440 = 0;
  var out__74441 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__74440 < len__74439) {
      var G__74442 = i__74440 + 1;
      var G__74443 = cljs.core.assoc_BANG_.call(null, out__74441, ks[i__74440], vs[i__74440]);
      i__74440 = G__74442;
      out__74441 = G__74443;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__74441)
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
  var this__74444 = this;
  if(cljs.core.truth_(this__74444.editable_QMARK_)) {
    var idx__74445 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__74445 >= 0) {
      this__74444.arr[idx__74445] = this__74444.arr[this__74444.len - 2];
      this__74444.arr[idx__74445 + 1] = this__74444.arr[this__74444.len - 1];
      var G__74446__74447 = this__74444.arr;
      G__74446__74447.pop();
      G__74446__74447.pop();
      G__74446__74447;
      this__74444.len = this__74444.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__74448 = this;
  if(cljs.core.truth_(this__74448.editable_QMARK_)) {
    var idx__74449 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__74449 === -1) {
      if(this__74448.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__74448.len = this__74448.len + 2;
        this__74448.arr.push(key);
        this__74448.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__74448.len, this__74448.arr), key, val)
      }
    }else {
      if(val === this__74448.arr[idx__74449 + 1]) {
        return tcoll
      }else {
        this__74448.arr[idx__74449 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__74450 = this;
  if(cljs.core.truth_(this__74450.editable_QMARK_)) {
    if(function() {
      var G__74451__74452 = o;
      if(G__74451__74452 != null) {
        if(function() {
          var or__3824__auto____74453 = G__74451__74452.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____74453) {
            return or__3824__auto____74453
          }else {
            return G__74451__74452.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__74451__74452.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__74451__74452)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__74451__74452)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__74454 = cljs.core.seq.call(null, o);
      var tcoll__74455 = tcoll;
      while(true) {
        var temp__3971__auto____74456 = cljs.core.first.call(null, es__74454);
        if(cljs.core.truth_(temp__3971__auto____74456)) {
          var e__74457 = temp__3971__auto____74456;
          var G__74463 = cljs.core.next.call(null, es__74454);
          var G__74464 = cljs.core._assoc_BANG_.call(null, tcoll__74455, cljs.core.key.call(null, e__74457), cljs.core.val.call(null, e__74457));
          es__74454 = G__74463;
          tcoll__74455 = G__74464;
          continue
        }else {
          return tcoll__74455
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__74458 = this;
  if(cljs.core.truth_(this__74458.editable_QMARK_)) {
    this__74458.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__74458.len, 2), this__74458.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__74459 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__74460 = this;
  if(cljs.core.truth_(this__74460.editable_QMARK_)) {
    var idx__74461 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__74461 === -1) {
      return not_found
    }else {
      return this__74460.arr[idx__74461 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__74462 = this;
  if(cljs.core.truth_(this__74462.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__74462.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__74465 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__74466 = 0;
  while(true) {
    if(i__74466 < len) {
      var G__74467 = cljs.core.assoc_BANG_.call(null, out__74465, arr[i__74466], arr[i__74466 + 1]);
      var G__74468 = i__74466 + 2;
      out__74465 = G__74467;
      i__74466 = G__74468;
      continue
    }else {
      return out__74465
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
    var G__74469__74470 = cljs.core.aclone.call(null, arr);
    G__74469__74470[i] = a;
    return G__74469__74470
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__74471__74472 = cljs.core.aclone.call(null, arr);
    G__74471__74472[i] = a;
    G__74471__74472[j] = b;
    return G__74471__74472
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
  var new_arr__74473 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__74473, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__74473, 2 * i, new_arr__74473.length - 2 * i);
  return new_arr__74473
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
    var editable__74474 = inode.ensure_editable(edit);
    editable__74474.arr[i] = a;
    return editable__74474
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__74475 = inode.ensure_editable(edit);
    editable__74475.arr[i] = a;
    editable__74475.arr[j] = b;
    return editable__74475
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
  var len__74476 = arr.length;
  var i__74477 = 0;
  var init__74478 = init;
  while(true) {
    if(i__74477 < len__74476) {
      var init__74481 = function() {
        var k__74479 = arr[i__74477];
        if(k__74479 != null) {
          return f.call(null, init__74478, k__74479, arr[i__74477 + 1])
        }else {
          var node__74480 = arr[i__74477 + 1];
          if(node__74480 != null) {
            return node__74480.kv_reduce(f, init__74478)
          }else {
            return init__74478
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__74481)) {
        return cljs.core.deref.call(null, init__74481)
      }else {
        var G__74482 = i__74477 + 2;
        var G__74483 = init__74481;
        i__74477 = G__74482;
        init__74478 = G__74483;
        continue
      }
    }else {
      return init__74478
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
  var this__74484 = this;
  var inode__74485 = this;
  if(this__74484.bitmap === bit) {
    return null
  }else {
    var editable__74486 = inode__74485.ensure_editable(e);
    var earr__74487 = editable__74486.arr;
    var len__74488 = earr__74487.length;
    editable__74486.bitmap = bit ^ editable__74486.bitmap;
    cljs.core.array_copy.call(null, earr__74487, 2 * (i + 1), earr__74487, 2 * i, len__74488 - 2 * (i + 1));
    earr__74487[len__74488 - 2] = null;
    earr__74487[len__74488 - 1] = null;
    return editable__74486
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__74489 = this;
  var inode__74490 = this;
  var bit__74491 = 1 << (hash >>> shift & 31);
  var idx__74492 = cljs.core.bitmap_indexed_node_index.call(null, this__74489.bitmap, bit__74491);
  if((this__74489.bitmap & bit__74491) === 0) {
    var n__74493 = cljs.core.bit_count.call(null, this__74489.bitmap);
    if(2 * n__74493 < this__74489.arr.length) {
      var editable__74494 = inode__74490.ensure_editable(edit);
      var earr__74495 = editable__74494.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__74495, 2 * idx__74492, earr__74495, 2 * (idx__74492 + 1), 2 * (n__74493 - idx__74492));
      earr__74495[2 * idx__74492] = key;
      earr__74495[2 * idx__74492 + 1] = val;
      editable__74494.bitmap = editable__74494.bitmap | bit__74491;
      return editable__74494
    }else {
      if(n__74493 >= 16) {
        var nodes__74496 = cljs.core.make_array.call(null, 32);
        var jdx__74497 = hash >>> shift & 31;
        nodes__74496[jdx__74497] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__74498 = 0;
        var j__74499 = 0;
        while(true) {
          if(i__74498 < 32) {
            if((this__74489.bitmap >>> i__74498 & 1) === 0) {
              var G__74552 = i__74498 + 1;
              var G__74553 = j__74499;
              i__74498 = G__74552;
              j__74499 = G__74553;
              continue
            }else {
              nodes__74496[i__74498] = null != this__74489.arr[j__74499] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__74489.arr[j__74499]), this__74489.arr[j__74499], this__74489.arr[j__74499 + 1], added_leaf_QMARK_) : this__74489.arr[j__74499 + 1];
              var G__74554 = i__74498 + 1;
              var G__74555 = j__74499 + 2;
              i__74498 = G__74554;
              j__74499 = G__74555;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__74493 + 1, nodes__74496)
      }else {
        if("\ufdd0'else") {
          var new_arr__74500 = cljs.core.make_array.call(null, 2 * (n__74493 + 4));
          cljs.core.array_copy.call(null, this__74489.arr, 0, new_arr__74500, 0, 2 * idx__74492);
          new_arr__74500[2 * idx__74492] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__74500[2 * idx__74492 + 1] = val;
          cljs.core.array_copy.call(null, this__74489.arr, 2 * idx__74492, new_arr__74500, 2 * (idx__74492 + 1), 2 * (n__74493 - idx__74492));
          var editable__74501 = inode__74490.ensure_editable(edit);
          editable__74501.arr = new_arr__74500;
          editable__74501.bitmap = editable__74501.bitmap | bit__74491;
          return editable__74501
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__74502 = this__74489.arr[2 * idx__74492];
    var val_or_node__74503 = this__74489.arr[2 * idx__74492 + 1];
    if(null == key_or_nil__74502) {
      var n__74504 = val_or_node__74503.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__74504 === val_or_node__74503) {
        return inode__74490
      }else {
        return cljs.core.edit_and_set.call(null, inode__74490, edit, 2 * idx__74492 + 1, n__74504)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__74502)) {
        if(val === val_or_node__74503) {
          return inode__74490
        }else {
          return cljs.core.edit_and_set.call(null, inode__74490, edit, 2 * idx__74492 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__74490, edit, 2 * idx__74492, null, 2 * idx__74492 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__74502, val_or_node__74503, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__74505 = this;
  var inode__74506 = this;
  return cljs.core.create_inode_seq.call(null, this__74505.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__74507 = this;
  var inode__74508 = this;
  var bit__74509 = 1 << (hash >>> shift & 31);
  if((this__74507.bitmap & bit__74509) === 0) {
    return inode__74508
  }else {
    var idx__74510 = cljs.core.bitmap_indexed_node_index.call(null, this__74507.bitmap, bit__74509);
    var key_or_nil__74511 = this__74507.arr[2 * idx__74510];
    var val_or_node__74512 = this__74507.arr[2 * idx__74510 + 1];
    if(null == key_or_nil__74511) {
      var n__74513 = val_or_node__74512.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__74513 === val_or_node__74512) {
        return inode__74508
      }else {
        if(null != n__74513) {
          return cljs.core.edit_and_set.call(null, inode__74508, edit, 2 * idx__74510 + 1, n__74513)
        }else {
          if(this__74507.bitmap === bit__74509) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__74508.edit_and_remove_pair(edit, bit__74509, idx__74510)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__74511)) {
        removed_leaf_QMARK_[0] = true;
        return inode__74508.edit_and_remove_pair(edit, bit__74509, idx__74510)
      }else {
        if("\ufdd0'else") {
          return inode__74508
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__74514 = this;
  var inode__74515 = this;
  if(e === this__74514.edit) {
    return inode__74515
  }else {
    var n__74516 = cljs.core.bit_count.call(null, this__74514.bitmap);
    var new_arr__74517 = cljs.core.make_array.call(null, n__74516 < 0 ? 4 : 2 * (n__74516 + 1));
    cljs.core.array_copy.call(null, this__74514.arr, 0, new_arr__74517, 0, 2 * n__74516);
    return new cljs.core.BitmapIndexedNode(e, this__74514.bitmap, new_arr__74517)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__74518 = this;
  var inode__74519 = this;
  return cljs.core.inode_kv_reduce.call(null, this__74518.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__74556 = null;
  var G__74556__3 = function(shift, hash, key) {
    var this__74520 = this;
    var inode__74521 = this;
    var bit__74522 = 1 << (hash >>> shift & 31);
    if((this__74520.bitmap & bit__74522) === 0) {
      return null
    }else {
      var idx__74523 = cljs.core.bitmap_indexed_node_index.call(null, this__74520.bitmap, bit__74522);
      var key_or_nil__74524 = this__74520.arr[2 * idx__74523];
      var val_or_node__74525 = this__74520.arr[2 * idx__74523 + 1];
      if(null == key_or_nil__74524) {
        return val_or_node__74525.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__74524)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__74524, val_or_node__74525])
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
  var G__74556__4 = function(shift, hash, key, not_found) {
    var this__74526 = this;
    var inode__74527 = this;
    var bit__74528 = 1 << (hash >>> shift & 31);
    if((this__74526.bitmap & bit__74528) === 0) {
      return not_found
    }else {
      var idx__74529 = cljs.core.bitmap_indexed_node_index.call(null, this__74526.bitmap, bit__74528);
      var key_or_nil__74530 = this__74526.arr[2 * idx__74529];
      var val_or_node__74531 = this__74526.arr[2 * idx__74529 + 1];
      if(null == key_or_nil__74530) {
        return val_or_node__74531.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__74530)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__74530, val_or_node__74531])
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
  G__74556 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__74556__3.call(this, shift, hash, key);
      case 4:
        return G__74556__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74556
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__74532 = this;
  var inode__74533 = this;
  var bit__74534 = 1 << (hash >>> shift & 31);
  if((this__74532.bitmap & bit__74534) === 0) {
    return inode__74533
  }else {
    var idx__74535 = cljs.core.bitmap_indexed_node_index.call(null, this__74532.bitmap, bit__74534);
    var key_or_nil__74536 = this__74532.arr[2 * idx__74535];
    var val_or_node__74537 = this__74532.arr[2 * idx__74535 + 1];
    if(null == key_or_nil__74536) {
      var n__74538 = val_or_node__74537.inode_without(shift + 5, hash, key);
      if(n__74538 === val_or_node__74537) {
        return inode__74533
      }else {
        if(null != n__74538) {
          return new cljs.core.BitmapIndexedNode(null, this__74532.bitmap, cljs.core.clone_and_set.call(null, this__74532.arr, 2 * idx__74535 + 1, n__74538))
        }else {
          if(this__74532.bitmap === bit__74534) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__74532.bitmap ^ bit__74534, cljs.core.remove_pair.call(null, this__74532.arr, idx__74535))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__74536)) {
        return new cljs.core.BitmapIndexedNode(null, this__74532.bitmap ^ bit__74534, cljs.core.remove_pair.call(null, this__74532.arr, idx__74535))
      }else {
        if("\ufdd0'else") {
          return inode__74533
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__74539 = this;
  var inode__74540 = this;
  var bit__74541 = 1 << (hash >>> shift & 31);
  var idx__74542 = cljs.core.bitmap_indexed_node_index.call(null, this__74539.bitmap, bit__74541);
  if((this__74539.bitmap & bit__74541) === 0) {
    var n__74543 = cljs.core.bit_count.call(null, this__74539.bitmap);
    if(n__74543 >= 16) {
      var nodes__74544 = cljs.core.make_array.call(null, 32);
      var jdx__74545 = hash >>> shift & 31;
      nodes__74544[jdx__74545] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__74546 = 0;
      var j__74547 = 0;
      while(true) {
        if(i__74546 < 32) {
          if((this__74539.bitmap >>> i__74546 & 1) === 0) {
            var G__74557 = i__74546 + 1;
            var G__74558 = j__74547;
            i__74546 = G__74557;
            j__74547 = G__74558;
            continue
          }else {
            nodes__74544[i__74546] = null != this__74539.arr[j__74547] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__74539.arr[j__74547]), this__74539.arr[j__74547], this__74539.arr[j__74547 + 1], added_leaf_QMARK_) : this__74539.arr[j__74547 + 1];
            var G__74559 = i__74546 + 1;
            var G__74560 = j__74547 + 2;
            i__74546 = G__74559;
            j__74547 = G__74560;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__74543 + 1, nodes__74544)
    }else {
      var new_arr__74548 = cljs.core.make_array.call(null, 2 * (n__74543 + 1));
      cljs.core.array_copy.call(null, this__74539.arr, 0, new_arr__74548, 0, 2 * idx__74542);
      new_arr__74548[2 * idx__74542] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__74548[2 * idx__74542 + 1] = val;
      cljs.core.array_copy.call(null, this__74539.arr, 2 * idx__74542, new_arr__74548, 2 * (idx__74542 + 1), 2 * (n__74543 - idx__74542));
      return new cljs.core.BitmapIndexedNode(null, this__74539.bitmap | bit__74541, new_arr__74548)
    }
  }else {
    var key_or_nil__74549 = this__74539.arr[2 * idx__74542];
    var val_or_node__74550 = this__74539.arr[2 * idx__74542 + 1];
    if(null == key_or_nil__74549) {
      var n__74551 = val_or_node__74550.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__74551 === val_or_node__74550) {
        return inode__74540
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__74539.bitmap, cljs.core.clone_and_set.call(null, this__74539.arr, 2 * idx__74542 + 1, n__74551))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__74549)) {
        if(val === val_or_node__74550) {
          return inode__74540
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__74539.bitmap, cljs.core.clone_and_set.call(null, this__74539.arr, 2 * idx__74542 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__74539.bitmap, cljs.core.clone_and_set.call(null, this__74539.arr, 2 * idx__74542, null, 2 * idx__74542 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__74549, val_or_node__74550, hash, key, val)))
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
  var arr__74561 = array_node.arr;
  var len__74562 = 2 * (array_node.cnt - 1);
  var new_arr__74563 = cljs.core.make_array.call(null, len__74562);
  var i__74564 = 0;
  var j__74565 = 1;
  var bitmap__74566 = 0;
  while(true) {
    if(i__74564 < len__74562) {
      if(function() {
        var and__3822__auto____74567 = i__74564 != idx;
        if(and__3822__auto____74567) {
          return null != arr__74561[i__74564]
        }else {
          return and__3822__auto____74567
        }
      }()) {
        new_arr__74563[j__74565] = arr__74561[i__74564];
        var G__74568 = i__74564 + 1;
        var G__74569 = j__74565 + 2;
        var G__74570 = bitmap__74566 | 1 << i__74564;
        i__74564 = G__74568;
        j__74565 = G__74569;
        bitmap__74566 = G__74570;
        continue
      }else {
        var G__74571 = i__74564 + 1;
        var G__74572 = j__74565;
        var G__74573 = bitmap__74566;
        i__74564 = G__74571;
        j__74565 = G__74572;
        bitmap__74566 = G__74573;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__74566, new_arr__74563)
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
  var this__74574 = this;
  var inode__74575 = this;
  var idx__74576 = hash >>> shift & 31;
  var node__74577 = this__74574.arr[idx__74576];
  if(null == node__74577) {
    return new cljs.core.ArrayNode(null, this__74574.cnt + 1, cljs.core.clone_and_set.call(null, this__74574.arr, idx__74576, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__74578 = node__74577.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__74578 === node__74577) {
      return inode__74575
    }else {
      return new cljs.core.ArrayNode(null, this__74574.cnt, cljs.core.clone_and_set.call(null, this__74574.arr, idx__74576, n__74578))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__74579 = this;
  var inode__74580 = this;
  var idx__74581 = hash >>> shift & 31;
  var node__74582 = this__74579.arr[idx__74581];
  if(null != node__74582) {
    var n__74583 = node__74582.inode_without(shift + 5, hash, key);
    if(n__74583 === node__74582) {
      return inode__74580
    }else {
      if(n__74583 == null) {
        if(this__74579.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__74580, null, idx__74581)
        }else {
          return new cljs.core.ArrayNode(null, this__74579.cnt - 1, cljs.core.clone_and_set.call(null, this__74579.arr, idx__74581, n__74583))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__74579.cnt, cljs.core.clone_and_set.call(null, this__74579.arr, idx__74581, n__74583))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__74580
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__74615 = null;
  var G__74615__3 = function(shift, hash, key) {
    var this__74584 = this;
    var inode__74585 = this;
    var idx__74586 = hash >>> shift & 31;
    var node__74587 = this__74584.arr[idx__74586];
    if(null != node__74587) {
      return node__74587.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__74615__4 = function(shift, hash, key, not_found) {
    var this__74588 = this;
    var inode__74589 = this;
    var idx__74590 = hash >>> shift & 31;
    var node__74591 = this__74588.arr[idx__74590];
    if(null != node__74591) {
      return node__74591.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__74615 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__74615__3.call(this, shift, hash, key);
      case 4:
        return G__74615__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74615
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__74592 = this;
  var inode__74593 = this;
  return cljs.core.create_array_node_seq.call(null, this__74592.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__74594 = this;
  var inode__74595 = this;
  if(e === this__74594.edit) {
    return inode__74595
  }else {
    return new cljs.core.ArrayNode(e, this__74594.cnt, cljs.core.aclone.call(null, this__74594.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__74596 = this;
  var inode__74597 = this;
  var idx__74598 = hash >>> shift & 31;
  var node__74599 = this__74596.arr[idx__74598];
  if(null == node__74599) {
    var editable__74600 = cljs.core.edit_and_set.call(null, inode__74597, edit, idx__74598, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__74600.cnt = editable__74600.cnt + 1;
    return editable__74600
  }else {
    var n__74601 = node__74599.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__74601 === node__74599) {
      return inode__74597
    }else {
      return cljs.core.edit_and_set.call(null, inode__74597, edit, idx__74598, n__74601)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__74602 = this;
  var inode__74603 = this;
  var idx__74604 = hash >>> shift & 31;
  var node__74605 = this__74602.arr[idx__74604];
  if(null == node__74605) {
    return inode__74603
  }else {
    var n__74606 = node__74605.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__74606 === node__74605) {
      return inode__74603
    }else {
      if(null == n__74606) {
        if(this__74602.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__74603, edit, idx__74604)
        }else {
          var editable__74607 = cljs.core.edit_and_set.call(null, inode__74603, edit, idx__74604, n__74606);
          editable__74607.cnt = editable__74607.cnt - 1;
          return editable__74607
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__74603, edit, idx__74604, n__74606)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__74608 = this;
  var inode__74609 = this;
  var len__74610 = this__74608.arr.length;
  var i__74611 = 0;
  var init__74612 = init;
  while(true) {
    if(i__74611 < len__74610) {
      var node__74613 = this__74608.arr[i__74611];
      if(node__74613 != null) {
        var init__74614 = node__74613.kv_reduce(f, init__74612);
        if(cljs.core.reduced_QMARK_.call(null, init__74614)) {
          return cljs.core.deref.call(null, init__74614)
        }else {
          var G__74616 = i__74611 + 1;
          var G__74617 = init__74614;
          i__74611 = G__74616;
          init__74612 = G__74617;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__74612
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__74618 = 2 * cnt;
  var i__74619 = 0;
  while(true) {
    if(i__74619 < lim__74618) {
      if(cljs.core._EQ_.call(null, key, arr[i__74619])) {
        return i__74619
      }else {
        var G__74620 = i__74619 + 2;
        i__74619 = G__74620;
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
  var this__74621 = this;
  var inode__74622 = this;
  if(hash === this__74621.collision_hash) {
    var idx__74623 = cljs.core.hash_collision_node_find_index.call(null, this__74621.arr, this__74621.cnt, key);
    if(idx__74623 === -1) {
      var len__74624 = this__74621.arr.length;
      var new_arr__74625 = cljs.core.make_array.call(null, len__74624 + 2);
      cljs.core.array_copy.call(null, this__74621.arr, 0, new_arr__74625, 0, len__74624);
      new_arr__74625[len__74624] = key;
      new_arr__74625[len__74624 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__74621.collision_hash, this__74621.cnt + 1, new_arr__74625)
    }else {
      if(cljs.core._EQ_.call(null, this__74621.arr[idx__74623], val)) {
        return inode__74622
      }else {
        return new cljs.core.HashCollisionNode(null, this__74621.collision_hash, this__74621.cnt, cljs.core.clone_and_set.call(null, this__74621.arr, idx__74623 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__74621.collision_hash >>> shift & 31), [null, inode__74622])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__74626 = this;
  var inode__74627 = this;
  var idx__74628 = cljs.core.hash_collision_node_find_index.call(null, this__74626.arr, this__74626.cnt, key);
  if(idx__74628 === -1) {
    return inode__74627
  }else {
    if(this__74626.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__74626.collision_hash, this__74626.cnt - 1, cljs.core.remove_pair.call(null, this__74626.arr, cljs.core.quot.call(null, idx__74628, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__74655 = null;
  var G__74655__3 = function(shift, hash, key) {
    var this__74629 = this;
    var inode__74630 = this;
    var idx__74631 = cljs.core.hash_collision_node_find_index.call(null, this__74629.arr, this__74629.cnt, key);
    if(idx__74631 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__74629.arr[idx__74631])) {
        return cljs.core.PersistentVector.fromArray([this__74629.arr[idx__74631], this__74629.arr[idx__74631 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__74655__4 = function(shift, hash, key, not_found) {
    var this__74632 = this;
    var inode__74633 = this;
    var idx__74634 = cljs.core.hash_collision_node_find_index.call(null, this__74632.arr, this__74632.cnt, key);
    if(idx__74634 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__74632.arr[idx__74634])) {
        return cljs.core.PersistentVector.fromArray([this__74632.arr[idx__74634], this__74632.arr[idx__74634 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__74655 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__74655__3.call(this, shift, hash, key);
      case 4:
        return G__74655__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74655
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__74635 = this;
  var inode__74636 = this;
  return cljs.core.create_inode_seq.call(null, this__74635.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__74656 = null;
  var G__74656__1 = function(e) {
    var this__74637 = this;
    var inode__74638 = this;
    if(e === this__74637.edit) {
      return inode__74638
    }else {
      var new_arr__74639 = cljs.core.make_array.call(null, 2 * (this__74637.cnt + 1));
      cljs.core.array_copy.call(null, this__74637.arr, 0, new_arr__74639, 0, 2 * this__74637.cnt);
      return new cljs.core.HashCollisionNode(e, this__74637.collision_hash, this__74637.cnt, new_arr__74639)
    }
  };
  var G__74656__3 = function(e, count, array) {
    var this__74640 = this;
    var inode__74641 = this;
    if(e === this__74640.edit) {
      this__74640.arr = array;
      this__74640.cnt = count;
      return inode__74641
    }else {
      return new cljs.core.HashCollisionNode(this__74640.edit, this__74640.collision_hash, count, array)
    }
  };
  G__74656 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__74656__1.call(this, e);
      case 3:
        return G__74656__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74656
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__74642 = this;
  var inode__74643 = this;
  if(hash === this__74642.collision_hash) {
    var idx__74644 = cljs.core.hash_collision_node_find_index.call(null, this__74642.arr, this__74642.cnt, key);
    if(idx__74644 === -1) {
      if(this__74642.arr.length > 2 * this__74642.cnt) {
        var editable__74645 = cljs.core.edit_and_set.call(null, inode__74643, edit, 2 * this__74642.cnt, key, 2 * this__74642.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__74645.cnt = editable__74645.cnt + 1;
        return editable__74645
      }else {
        var len__74646 = this__74642.arr.length;
        var new_arr__74647 = cljs.core.make_array.call(null, len__74646 + 2);
        cljs.core.array_copy.call(null, this__74642.arr, 0, new_arr__74647, 0, len__74646);
        new_arr__74647[len__74646] = key;
        new_arr__74647[len__74646 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__74643.ensure_editable(edit, this__74642.cnt + 1, new_arr__74647)
      }
    }else {
      if(this__74642.arr[idx__74644 + 1] === val) {
        return inode__74643
      }else {
        return cljs.core.edit_and_set.call(null, inode__74643, edit, idx__74644 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__74642.collision_hash >>> shift & 31), [null, inode__74643, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__74648 = this;
  var inode__74649 = this;
  var idx__74650 = cljs.core.hash_collision_node_find_index.call(null, this__74648.arr, this__74648.cnt, key);
  if(idx__74650 === -1) {
    return inode__74649
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__74648.cnt === 1) {
      return null
    }else {
      var editable__74651 = inode__74649.ensure_editable(edit);
      var earr__74652 = editable__74651.arr;
      earr__74652[idx__74650] = earr__74652[2 * this__74648.cnt - 2];
      earr__74652[idx__74650 + 1] = earr__74652[2 * this__74648.cnt - 1];
      earr__74652[2 * this__74648.cnt - 1] = null;
      earr__74652[2 * this__74648.cnt - 2] = null;
      editable__74651.cnt = editable__74651.cnt - 1;
      return editable__74651
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__74653 = this;
  var inode__74654 = this;
  return cljs.core.inode_kv_reduce.call(null, this__74653.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__74657 = cljs.core.hash.call(null, key1);
    if(key1hash__74657 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__74657, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___74658 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__74657, key1, val1, added_leaf_QMARK___74658).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___74658)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__74659 = cljs.core.hash.call(null, key1);
    if(key1hash__74659 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__74659, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___74660 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__74659, key1, val1, added_leaf_QMARK___74660).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___74660)
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
  var this__74661 = this;
  var h__364__auto____74662 = this__74661.__hash;
  if(h__364__auto____74662 != null) {
    return h__364__auto____74662
  }else {
    var h__364__auto____74663 = cljs.core.hash_coll.call(null, coll);
    this__74661.__hash = h__364__auto____74663;
    return h__364__auto____74663
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74664 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__74665 = this;
  var this$__74666 = this;
  return cljs.core.pr_str.call(null, this$__74666)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__74667 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__74668 = this;
  if(this__74668.s == null) {
    return cljs.core.PersistentVector.fromArray([this__74668.nodes[this__74668.i], this__74668.nodes[this__74668.i + 1]])
  }else {
    return cljs.core.first.call(null, this__74668.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__74669 = this;
  if(this__74669.s == null) {
    return cljs.core.create_inode_seq.call(null, this__74669.nodes, this__74669.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__74669.nodes, this__74669.i, cljs.core.next.call(null, this__74669.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74670 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74671 = this;
  return new cljs.core.NodeSeq(meta, this__74671.nodes, this__74671.i, this__74671.s, this__74671.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74672 = this;
  return this__74672.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74673 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__74673.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__74674 = nodes.length;
      var j__74675 = i;
      while(true) {
        if(j__74675 < len__74674) {
          if(null != nodes[j__74675]) {
            return new cljs.core.NodeSeq(null, nodes, j__74675, null, null)
          }else {
            var temp__3971__auto____74676 = nodes[j__74675 + 1];
            if(cljs.core.truth_(temp__3971__auto____74676)) {
              var node__74677 = temp__3971__auto____74676;
              var temp__3971__auto____74678 = node__74677.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____74678)) {
                var node_seq__74679 = temp__3971__auto____74678;
                return new cljs.core.NodeSeq(null, nodes, j__74675 + 2, node_seq__74679, null)
              }else {
                var G__74680 = j__74675 + 2;
                j__74675 = G__74680;
                continue
              }
            }else {
              var G__74681 = j__74675 + 2;
              j__74675 = G__74681;
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
  var this__74682 = this;
  var h__364__auto____74683 = this__74682.__hash;
  if(h__364__auto____74683 != null) {
    return h__364__auto____74683
  }else {
    var h__364__auto____74684 = cljs.core.hash_coll.call(null, coll);
    this__74682.__hash = h__364__auto____74684;
    return h__364__auto____74684
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74685 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__74686 = this;
  var this$__74687 = this;
  return cljs.core.pr_str.call(null, this$__74687)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__74688 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__74689 = this;
  return cljs.core.first.call(null, this__74689.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__74690 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__74690.nodes, this__74690.i, cljs.core.next.call(null, this__74690.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74691 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74692 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__74692.nodes, this__74692.i, this__74692.s, this__74692.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74693 = this;
  return this__74693.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74694 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__74694.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__74695 = nodes.length;
      var j__74696 = i;
      while(true) {
        if(j__74696 < len__74695) {
          var temp__3971__auto____74697 = nodes[j__74696];
          if(cljs.core.truth_(temp__3971__auto____74697)) {
            var nj__74698 = temp__3971__auto____74697;
            var temp__3971__auto____74699 = nj__74698.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____74699)) {
              var ns__74700 = temp__3971__auto____74699;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__74696 + 1, ns__74700, null)
            }else {
              var G__74701 = j__74696 + 1;
              j__74696 = G__74701;
              continue
            }
          }else {
            var G__74702 = j__74696 + 1;
            j__74696 = G__74702;
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
  var this__74707 = this;
  return new cljs.core.TransientHashMap({}, this__74707.root, this__74707.cnt, this__74707.has_nil_QMARK_, this__74707.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__74708 = this;
  var h__364__auto____74709 = this__74708.__hash;
  if(h__364__auto____74709 != null) {
    return h__364__auto____74709
  }else {
    var h__364__auto____74710 = cljs.core.hash_imap.call(null, coll);
    this__74708.__hash = h__364__auto____74710;
    return h__364__auto____74710
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74711 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74712 = this;
  if(k == null) {
    if(cljs.core.truth_(this__74712.has_nil_QMARK_)) {
      return this__74712.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__74712.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__74712.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74713 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____74714 = this__74713.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____74714)) {
        return v === this__74713.nil_val
      }else {
        return and__3822__auto____74714
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__74713.meta, cljs.core.truth_(this__74713.has_nil_QMARK_) ? this__74713.cnt : this__74713.cnt + 1, this__74713.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___74715 = [false];
    var new_root__74716 = (this__74713.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__74713.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___74715);
    if(new_root__74716 === this__74713.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__74713.meta, cljs.core.truth_(added_leaf_QMARK___74715[0]) ? this__74713.cnt + 1 : this__74713.cnt, new_root__74716, this__74713.has_nil_QMARK_, this__74713.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__74717 = this;
  if(k == null) {
    return this__74717.has_nil_QMARK_
  }else {
    if(this__74717.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__74717.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__74738 = null;
  var G__74738__2 = function(tsym74705, k) {
    var this__74718 = this;
    var tsym74705__74719 = this;
    var coll__74720 = tsym74705__74719;
    return cljs.core._lookup.call(null, coll__74720, k)
  };
  var G__74738__3 = function(tsym74706, k, not_found) {
    var this__74721 = this;
    var tsym74706__74722 = this;
    var coll__74723 = tsym74706__74722;
    return cljs.core._lookup.call(null, coll__74723, k, not_found)
  };
  G__74738 = function(tsym74706, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74738__2.call(this, tsym74706, k);
      case 3:
        return G__74738__3.call(this, tsym74706, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74738
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym74703, args74704) {
  return tsym74703.call.apply(tsym74703, [tsym74703].concat(cljs.core.aclone.call(null, args74704)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__74724 = this;
  var init__74725 = cljs.core.truth_(this__74724.has_nil_QMARK_) ? f.call(null, init, null, this__74724.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__74725)) {
    return cljs.core.deref.call(null, init__74725)
  }else {
    if(null != this__74724.root) {
      return this__74724.root.kv_reduce(f, init__74725)
    }else {
      if("\ufdd0'else") {
        return init__74725
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__74726 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__74727 = this;
  var this$__74728 = this;
  return cljs.core.pr_str.call(null, this$__74728)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74729 = this;
  if(this__74729.cnt > 0) {
    var s__74730 = null != this__74729.root ? this__74729.root.inode_seq() : null;
    if(cljs.core.truth_(this__74729.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__74729.nil_val]), s__74730)
    }else {
      return s__74730
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74731 = this;
  return this__74731.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74732 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74733 = this;
  return new cljs.core.PersistentHashMap(meta, this__74733.cnt, this__74733.root, this__74733.has_nil_QMARK_, this__74733.nil_val, this__74733.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74734 = this;
  return this__74734.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74735 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__74735.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__74736 = this;
  if(k == null) {
    if(cljs.core.truth_(this__74736.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__74736.meta, this__74736.cnt - 1, this__74736.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__74736.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__74737 = this__74736.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__74737 === this__74736.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__74736.meta, this__74736.cnt - 1, new_root__74737, this__74736.has_nil_QMARK_, this__74736.nil_val, null)
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
  var len__74739 = ks.length;
  var i__74740 = 0;
  var out__74741 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__74740 < len__74739) {
      var G__74742 = i__74740 + 1;
      var G__74743 = cljs.core.assoc_BANG_.call(null, out__74741, ks[i__74740], vs[i__74740]);
      i__74740 = G__74742;
      out__74741 = G__74743;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__74741)
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
  var this__74744 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__74745 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__74746 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__74747 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__74748 = this;
  if(k == null) {
    if(cljs.core.truth_(this__74748.has_nil_QMARK_)) {
      return this__74748.nil_val
    }else {
      return null
    }
  }else {
    if(this__74748.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__74748.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__74749 = this;
  if(k == null) {
    if(cljs.core.truth_(this__74749.has_nil_QMARK_)) {
      return this__74749.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__74749.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__74749.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74750 = this;
  if(cljs.core.truth_(this__74750.edit)) {
    return this__74750.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__74751 = this;
  var tcoll__74752 = this;
  if(cljs.core.truth_(this__74751.edit)) {
    if(function() {
      var G__74753__74754 = o;
      if(G__74753__74754 != null) {
        if(function() {
          var or__3824__auto____74755 = G__74753__74754.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____74755) {
            return or__3824__auto____74755
          }else {
            return G__74753__74754.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__74753__74754.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__74753__74754)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__74753__74754)
      }
    }()) {
      return tcoll__74752.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__74756 = cljs.core.seq.call(null, o);
      var tcoll__74757 = tcoll__74752;
      while(true) {
        var temp__3971__auto____74758 = cljs.core.first.call(null, es__74756);
        if(cljs.core.truth_(temp__3971__auto____74758)) {
          var e__74759 = temp__3971__auto____74758;
          var G__74770 = cljs.core.next.call(null, es__74756);
          var G__74771 = tcoll__74757.assoc_BANG_(cljs.core.key.call(null, e__74759), cljs.core.val.call(null, e__74759));
          es__74756 = G__74770;
          tcoll__74757 = G__74771;
          continue
        }else {
          return tcoll__74757
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__74760 = this;
  var tcoll__74761 = this;
  if(cljs.core.truth_(this__74760.edit)) {
    if(k == null) {
      if(this__74760.nil_val === v) {
      }else {
        this__74760.nil_val = v
      }
      if(cljs.core.truth_(this__74760.has_nil_QMARK_)) {
      }else {
        this__74760.count = this__74760.count + 1;
        this__74760.has_nil_QMARK_ = true
      }
      return tcoll__74761
    }else {
      var added_leaf_QMARK___74762 = [false];
      var node__74763 = (this__74760.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__74760.root).inode_assoc_BANG_(this__74760.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___74762);
      if(node__74763 === this__74760.root) {
      }else {
        this__74760.root = node__74763
      }
      if(cljs.core.truth_(added_leaf_QMARK___74762[0])) {
        this__74760.count = this__74760.count + 1
      }else {
      }
      return tcoll__74761
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__74764 = this;
  var tcoll__74765 = this;
  if(cljs.core.truth_(this__74764.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__74764.has_nil_QMARK_)) {
        this__74764.has_nil_QMARK_ = false;
        this__74764.nil_val = null;
        this__74764.count = this__74764.count - 1;
        return tcoll__74765
      }else {
        return tcoll__74765
      }
    }else {
      if(this__74764.root == null) {
        return tcoll__74765
      }else {
        var removed_leaf_QMARK___74766 = [false];
        var node__74767 = this__74764.root.inode_without_BANG_(this__74764.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___74766);
        if(node__74767 === this__74764.root) {
        }else {
          this__74764.root = node__74767
        }
        if(cljs.core.truth_(removed_leaf_QMARK___74766[0])) {
          this__74764.count = this__74764.count - 1
        }else {
        }
        return tcoll__74765
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__74768 = this;
  var tcoll__74769 = this;
  if(cljs.core.truth_(this__74768.edit)) {
    this__74768.edit = null;
    return new cljs.core.PersistentHashMap(null, this__74768.count, this__74768.root, this__74768.has_nil_QMARK_, this__74768.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__74772 = node;
  var stack__74773 = stack;
  while(true) {
    if(t__74772 != null) {
      var G__74774 = cljs.core.truth_(ascending_QMARK_) ? t__74772.left : t__74772.right;
      var G__74775 = cljs.core.conj.call(null, stack__74773, t__74772);
      t__74772 = G__74774;
      stack__74773 = G__74775;
      continue
    }else {
      return stack__74773
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
  var this__74776 = this;
  var h__364__auto____74777 = this__74776.__hash;
  if(h__364__auto____74777 != null) {
    return h__364__auto____74777
  }else {
    var h__364__auto____74778 = cljs.core.hash_coll.call(null, coll);
    this__74776.__hash = h__364__auto____74778;
    return h__364__auto____74778
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__74779 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__74780 = this;
  var this$__74781 = this;
  return cljs.core.pr_str.call(null, this$__74781)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__74782 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74783 = this;
  if(this__74783.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__74783.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__74784 = this;
  return cljs.core.peek.call(null, this__74784.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__74785 = this;
  var t__74786 = cljs.core.peek.call(null, this__74785.stack);
  var next_stack__74787 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__74785.ascending_QMARK_) ? t__74786.right : t__74786.left, cljs.core.pop.call(null, this__74785.stack), this__74785.ascending_QMARK_);
  if(next_stack__74787 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__74787, this__74785.ascending_QMARK_, this__74785.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74788 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74789 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__74789.stack, this__74789.ascending_QMARK_, this__74789.cnt, this__74789.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74790 = this;
  return this__74790.meta
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
        var and__3822__auto____74791 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____74791) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____74791
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
        var and__3822__auto____74792 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____74792) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____74792
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
  var init__74793 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__74793)) {
    return cljs.core.deref.call(null, init__74793)
  }else {
    var init__74794 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__74793) : init__74793;
    if(cljs.core.reduced_QMARK_.call(null, init__74794)) {
      return cljs.core.deref.call(null, init__74794)
    }else {
      var init__74795 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__74794) : init__74794;
      if(cljs.core.reduced_QMARK_.call(null, init__74795)) {
        return cljs.core.deref.call(null, init__74795)
      }else {
        return init__74795
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
  var this__74800 = this;
  var h__364__auto____74801 = this__74800.__hash;
  if(h__364__auto____74801 != null) {
    return h__364__auto____74801
  }else {
    var h__364__auto____74802 = cljs.core.hash_coll.call(null, coll);
    this__74800.__hash = h__364__auto____74802;
    return h__364__auto____74802
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__74803 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__74804 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__74805 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__74805.key, this__74805.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__74852 = null;
  var G__74852__2 = function(tsym74798, k) {
    var this__74806 = this;
    var tsym74798__74807 = this;
    var node__74808 = tsym74798__74807;
    return cljs.core._lookup.call(null, node__74808, k)
  };
  var G__74852__3 = function(tsym74799, k, not_found) {
    var this__74809 = this;
    var tsym74799__74810 = this;
    var node__74811 = tsym74799__74810;
    return cljs.core._lookup.call(null, node__74811, k, not_found)
  };
  G__74852 = function(tsym74799, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74852__2.call(this, tsym74799, k);
      case 3:
        return G__74852__3.call(this, tsym74799, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74852
}();
cljs.core.BlackNode.prototype.apply = function(tsym74796, args74797) {
  return tsym74796.call.apply(tsym74796, [tsym74796].concat(cljs.core.aclone.call(null, args74797)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__74812 = this;
  return cljs.core.PersistentVector.fromArray([this__74812.key, this__74812.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__74813 = this;
  return this__74813.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__74814 = this;
  return this__74814.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__74815 = this;
  var node__74816 = this;
  return ins.balance_right(node__74816)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__74817 = this;
  var node__74818 = this;
  return new cljs.core.RedNode(this__74817.key, this__74817.val, this__74817.left, this__74817.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__74819 = this;
  var node__74820 = this;
  return cljs.core.balance_right_del.call(null, this__74819.key, this__74819.val, this__74819.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__74821 = this;
  var node__74822 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__74823 = this;
  var node__74824 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__74824, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__74825 = this;
  var node__74826 = this;
  return cljs.core.balance_left_del.call(null, this__74825.key, this__74825.val, del, this__74825.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__74827 = this;
  var node__74828 = this;
  return ins.balance_left(node__74828)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__74829 = this;
  var node__74830 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__74830, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__74853 = null;
  var G__74853__0 = function() {
    var this__74833 = this;
    var this$__74834 = this;
    return cljs.core.pr_str.call(null, this$__74834)
  };
  G__74853 = function() {
    switch(arguments.length) {
      case 0:
        return G__74853__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74853
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__74835 = this;
  var node__74836 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__74836, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__74837 = this;
  var node__74838 = this;
  return node__74838
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__74839 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__74840 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__74841 = this;
  return cljs.core.list.call(null, this__74841.key, this__74841.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__74843 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__74844 = this;
  return this__74844.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__74845 = this;
  return cljs.core.PersistentVector.fromArray([this__74845.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__74846 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__74846.key, this__74846.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74847 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__74848 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__74848.key, this__74848.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__74849 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__74850 = this;
  if(n === 0) {
    return this__74850.key
  }else {
    if(n === 1) {
      return this__74850.val
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
  var this__74851 = this;
  if(n === 0) {
    return this__74851.key
  }else {
    if(n === 1) {
      return this__74851.val
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
  var this__74842 = this;
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
  var this__74858 = this;
  var h__364__auto____74859 = this__74858.__hash;
  if(h__364__auto____74859 != null) {
    return h__364__auto____74859
  }else {
    var h__364__auto____74860 = cljs.core.hash_coll.call(null, coll);
    this__74858.__hash = h__364__auto____74860;
    return h__364__auto____74860
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__74861 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__74862 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__74863 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__74863.key, this__74863.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__74910 = null;
  var G__74910__2 = function(tsym74856, k) {
    var this__74864 = this;
    var tsym74856__74865 = this;
    var node__74866 = tsym74856__74865;
    return cljs.core._lookup.call(null, node__74866, k)
  };
  var G__74910__3 = function(tsym74857, k, not_found) {
    var this__74867 = this;
    var tsym74857__74868 = this;
    var node__74869 = tsym74857__74868;
    return cljs.core._lookup.call(null, node__74869, k, not_found)
  };
  G__74910 = function(tsym74857, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74910__2.call(this, tsym74857, k);
      case 3:
        return G__74910__3.call(this, tsym74857, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74910
}();
cljs.core.RedNode.prototype.apply = function(tsym74854, args74855) {
  return tsym74854.call.apply(tsym74854, [tsym74854].concat(cljs.core.aclone.call(null, args74855)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__74870 = this;
  return cljs.core.PersistentVector.fromArray([this__74870.key, this__74870.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__74871 = this;
  return this__74871.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__74872 = this;
  return this__74872.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__74873 = this;
  var node__74874 = this;
  return new cljs.core.RedNode(this__74873.key, this__74873.val, this__74873.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__74875 = this;
  var node__74876 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__74877 = this;
  var node__74878 = this;
  return new cljs.core.RedNode(this__74877.key, this__74877.val, this__74877.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__74879 = this;
  var node__74880 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__74881 = this;
  var node__74882 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__74882, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__74883 = this;
  var node__74884 = this;
  return new cljs.core.RedNode(this__74883.key, this__74883.val, del, this__74883.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__74885 = this;
  var node__74886 = this;
  return new cljs.core.RedNode(this__74885.key, this__74885.val, ins, this__74885.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__74887 = this;
  var node__74888 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__74887.left)) {
    return new cljs.core.RedNode(this__74887.key, this__74887.val, this__74887.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__74887.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__74887.right)) {
      return new cljs.core.RedNode(this__74887.right.key, this__74887.right.val, new cljs.core.BlackNode(this__74887.key, this__74887.val, this__74887.left, this__74887.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__74887.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__74888, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__74911 = null;
  var G__74911__0 = function() {
    var this__74891 = this;
    var this$__74892 = this;
    return cljs.core.pr_str.call(null, this$__74892)
  };
  G__74911 = function() {
    switch(arguments.length) {
      case 0:
        return G__74911__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74911
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__74893 = this;
  var node__74894 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__74893.right)) {
    return new cljs.core.RedNode(this__74893.key, this__74893.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__74893.left, null), this__74893.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__74893.left)) {
      return new cljs.core.RedNode(this__74893.left.key, this__74893.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__74893.left.left, null), new cljs.core.BlackNode(this__74893.key, this__74893.val, this__74893.left.right, this__74893.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__74894, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__74895 = this;
  var node__74896 = this;
  return new cljs.core.BlackNode(this__74895.key, this__74895.val, this__74895.left, this__74895.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__74897 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__74898 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__74899 = this;
  return cljs.core.list.call(null, this__74899.key, this__74899.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__74901 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__74902 = this;
  return this__74902.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__74903 = this;
  return cljs.core.PersistentVector.fromArray([this__74903.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__74904 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__74904.key, this__74904.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74905 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__74906 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__74906.key, this__74906.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__74907 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__74908 = this;
  if(n === 0) {
    return this__74908.key
  }else {
    if(n === 1) {
      return this__74908.val
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
  var this__74909 = this;
  if(n === 0) {
    return this__74909.key
  }else {
    if(n === 1) {
      return this__74909.val
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
  var this__74900 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__74912 = comp.call(null, k, tree.key);
    if(c__74912 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__74912 < 0) {
        var ins__74913 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__74913 != null) {
          return tree.add_left(ins__74913)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__74914 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__74914 != null) {
            return tree.add_right(ins__74914)
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
          var app__74915 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__74915)) {
            return new cljs.core.RedNode(app__74915.key, app__74915.val, new cljs.core.RedNode(left.key, left.val, left.left, app__74915.left), new cljs.core.RedNode(right.key, right.val, app__74915.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__74915, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__74916 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__74916)) {
              return new cljs.core.RedNode(app__74916.key, app__74916.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__74916.left, null), new cljs.core.BlackNode(right.key, right.val, app__74916.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__74916, right.right, null))
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
    var c__74917 = comp.call(null, k, tree.key);
    if(c__74917 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__74917 < 0) {
        var del__74918 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____74919 = del__74918 != null;
          if(or__3824__auto____74919) {
            return or__3824__auto____74919
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__74918, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__74918, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__74920 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____74921 = del__74920 != null;
            if(or__3824__auto____74921) {
              return or__3824__auto____74921
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__74920)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__74920, null)
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
  var tk__74922 = tree.key;
  var c__74923 = comp.call(null, k, tk__74922);
  if(c__74923 === 0) {
    return tree.replace(tk__74922, v, tree.left, tree.right)
  }else {
    if(c__74923 < 0) {
      return tree.replace(tk__74922, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__74922, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__74928 = this;
  var h__364__auto____74929 = this__74928.__hash;
  if(h__364__auto____74929 != null) {
    return h__364__auto____74929
  }else {
    var h__364__auto____74930 = cljs.core.hash_imap.call(null, coll);
    this__74928.__hash = h__364__auto____74930;
    return h__364__auto____74930
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__74931 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__74932 = this;
  var n__74933 = coll.entry_at(k);
  if(n__74933 != null) {
    return n__74933.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__74934 = this;
  var found__74935 = [null];
  var t__74936 = cljs.core.tree_map_add.call(null, this__74934.comp, this__74934.tree, k, v, found__74935);
  if(t__74936 == null) {
    var found_node__74937 = cljs.core.nth.call(null, found__74935, 0);
    if(cljs.core._EQ_.call(null, v, found_node__74937.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__74934.comp, cljs.core.tree_map_replace.call(null, this__74934.comp, this__74934.tree, k, v), this__74934.cnt, this__74934.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__74934.comp, t__74936.blacken(), this__74934.cnt + 1, this__74934.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__74938 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__74970 = null;
  var G__74970__2 = function(tsym74926, k) {
    var this__74939 = this;
    var tsym74926__74940 = this;
    var coll__74941 = tsym74926__74940;
    return cljs.core._lookup.call(null, coll__74941, k)
  };
  var G__74970__3 = function(tsym74927, k, not_found) {
    var this__74942 = this;
    var tsym74927__74943 = this;
    var coll__74944 = tsym74927__74943;
    return cljs.core._lookup.call(null, coll__74944, k, not_found)
  };
  G__74970 = function(tsym74927, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__74970__2.call(this, tsym74927, k);
      case 3:
        return G__74970__3.call(this, tsym74927, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__74970
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym74924, args74925) {
  return tsym74924.call.apply(tsym74924, [tsym74924].concat(cljs.core.aclone.call(null, args74925)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__74945 = this;
  if(this__74945.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__74945.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__74946 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__74947 = this;
  if(this__74947.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__74947.tree, false, this__74947.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__74948 = this;
  var this$__74949 = this;
  return cljs.core.pr_str.call(null, this$__74949)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__74950 = this;
  var coll__74951 = this;
  var t__74952 = this__74950.tree;
  while(true) {
    if(t__74952 != null) {
      var c__74953 = this__74950.comp.call(null, k, t__74952.key);
      if(c__74953 === 0) {
        return t__74952
      }else {
        if(c__74953 < 0) {
          var G__74971 = t__74952.left;
          t__74952 = G__74971;
          continue
        }else {
          if("\ufdd0'else") {
            var G__74972 = t__74952.right;
            t__74952 = G__74972;
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
  var this__74954 = this;
  if(this__74954.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__74954.tree, ascending_QMARK_, this__74954.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__74955 = this;
  if(this__74955.cnt > 0) {
    var stack__74956 = null;
    var t__74957 = this__74955.tree;
    while(true) {
      if(t__74957 != null) {
        var c__74958 = this__74955.comp.call(null, k, t__74957.key);
        if(c__74958 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__74956, t__74957), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__74958 < 0) {
              var G__74973 = cljs.core.conj.call(null, stack__74956, t__74957);
              var G__74974 = t__74957.left;
              stack__74956 = G__74973;
              t__74957 = G__74974;
              continue
            }else {
              var G__74975 = stack__74956;
              var G__74976 = t__74957.right;
              stack__74956 = G__74975;
              t__74957 = G__74976;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__74958 > 0) {
                var G__74977 = cljs.core.conj.call(null, stack__74956, t__74957);
                var G__74978 = t__74957.right;
                stack__74956 = G__74977;
                t__74957 = G__74978;
                continue
              }else {
                var G__74979 = stack__74956;
                var G__74980 = t__74957.left;
                stack__74956 = G__74979;
                t__74957 = G__74980;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__74956 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__74956, ascending_QMARK_, -1)
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
  var this__74959 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__74960 = this;
  return this__74960.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__74961 = this;
  if(this__74961.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__74961.tree, true, this__74961.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__74962 = this;
  return this__74962.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__74963 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__74964 = this;
  return new cljs.core.PersistentTreeMap(this__74964.comp, this__74964.tree, this__74964.cnt, meta, this__74964.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__74968 = this;
  return this__74968.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__74969 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__74969.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__74965 = this;
  var found__74966 = [null];
  var t__74967 = cljs.core.tree_map_remove.call(null, this__74965.comp, this__74965.tree, k, found__74966);
  if(t__74967 == null) {
    if(cljs.core.nth.call(null, found__74966, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__74965.comp, null, 0, this__74965.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__74965.comp, t__74967.blacken(), this__74965.cnt - 1, this__74965.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__74981 = cljs.core.seq.call(null, keyvals);
    var out__74982 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__74981)) {
        var G__74983 = cljs.core.nnext.call(null, in$__74981);
        var G__74984 = cljs.core.assoc_BANG_.call(null, out__74982, cljs.core.first.call(null, in$__74981), cljs.core.second.call(null, in$__74981));
        in$__74981 = G__74983;
        out__74982 = G__74984;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__74982)
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
  hash_map.cljs$lang$applyTo = function(arglist__74985) {
    var keyvals = cljs.core.seq(arglist__74985);
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
  array_map.cljs$lang$applyTo = function(arglist__74986) {
    var keyvals = cljs.core.seq(arglist__74986);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__74987 = cljs.core.seq.call(null, keyvals);
    var out__74988 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__74987)) {
        var G__74989 = cljs.core.nnext.call(null, in$__74987);
        var G__74990 = cljs.core.assoc.call(null, out__74988, cljs.core.first.call(null, in$__74987), cljs.core.second.call(null, in$__74987));
        in$__74987 = G__74989;
        out__74988 = G__74990;
        continue
      }else {
        return out__74988
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
  sorted_map.cljs$lang$applyTo = function(arglist__74991) {
    var keyvals = cljs.core.seq(arglist__74991);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__74992 = cljs.core.seq.call(null, keyvals);
    var out__74993 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__74992)) {
        var G__74994 = cljs.core.nnext.call(null, in$__74992);
        var G__74995 = cljs.core.assoc.call(null, out__74993, cljs.core.first.call(null, in$__74992), cljs.core.second.call(null, in$__74992));
        in$__74992 = G__74994;
        out__74993 = G__74995;
        continue
      }else {
        return out__74993
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__74996) {
    var comparator = cljs.core.first(arglist__74996);
    var keyvals = cljs.core.rest(arglist__74996);
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
      return cljs.core.reduce.call(null, function(p1__74997_SHARP_, p2__74998_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____74999 = p1__74997_SHARP_;
          if(cljs.core.truth_(or__3824__auto____74999)) {
            return or__3824__auto____74999
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__74998_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__75000) {
    var maps = cljs.core.seq(arglist__75000);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__75003 = function(m, e) {
        var k__75001 = cljs.core.first.call(null, e);
        var v__75002 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__75001)) {
          return cljs.core.assoc.call(null, m, k__75001, f.call(null, cljs.core.get.call(null, m, k__75001), v__75002))
        }else {
          return cljs.core.assoc.call(null, m, k__75001, v__75002)
        }
      };
      var merge2__75005 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__75003, function() {
          var or__3824__auto____75004 = m1;
          if(cljs.core.truth_(or__3824__auto____75004)) {
            return or__3824__auto____75004
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__75005, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__75006) {
    var f = cljs.core.first(arglist__75006);
    var maps = cljs.core.rest(arglist__75006);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__75007 = cljs.core.ObjMap.fromObject([], {});
  var keys__75008 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__75008)) {
      var key__75009 = cljs.core.first.call(null, keys__75008);
      var entry__75010 = cljs.core.get.call(null, map, key__75009, "\ufdd0'user/not-found");
      var G__75011 = cljs.core.not_EQ_.call(null, entry__75010, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__75007, key__75009, entry__75010) : ret__75007;
      var G__75012 = cljs.core.next.call(null, keys__75008);
      ret__75007 = G__75011;
      keys__75008 = G__75012;
      continue
    }else {
      return ret__75007
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
  var this__75018 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__75018.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__75019 = this;
  var h__364__auto____75020 = this__75019.__hash;
  if(h__364__auto____75020 != null) {
    return h__364__auto____75020
  }else {
    var h__364__auto____75021 = cljs.core.hash_iset.call(null, coll);
    this__75019.__hash = h__364__auto____75021;
    return h__364__auto____75021
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__75022 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__75023 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__75023.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__75042 = null;
  var G__75042__2 = function(tsym75016, k) {
    var this__75024 = this;
    var tsym75016__75025 = this;
    var coll__75026 = tsym75016__75025;
    return cljs.core._lookup.call(null, coll__75026, k)
  };
  var G__75042__3 = function(tsym75017, k, not_found) {
    var this__75027 = this;
    var tsym75017__75028 = this;
    var coll__75029 = tsym75017__75028;
    return cljs.core._lookup.call(null, coll__75029, k, not_found)
  };
  G__75042 = function(tsym75017, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__75042__2.call(this, tsym75017, k);
      case 3:
        return G__75042__3.call(this, tsym75017, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__75042
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym75014, args75015) {
  return tsym75014.call.apply(tsym75014, [tsym75014].concat(cljs.core.aclone.call(null, args75015)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__75030 = this;
  return new cljs.core.PersistentHashSet(this__75030.meta, cljs.core.assoc.call(null, this__75030.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__75031 = this;
  var this$__75032 = this;
  return cljs.core.pr_str.call(null, this$__75032)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__75033 = this;
  return cljs.core.keys.call(null, this__75033.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__75034 = this;
  return new cljs.core.PersistentHashSet(this__75034.meta, cljs.core.dissoc.call(null, this__75034.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__75035 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__75036 = this;
  var and__3822__auto____75037 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____75037) {
    var and__3822__auto____75038 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____75038) {
      return cljs.core.every_QMARK_.call(null, function(p1__75013_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__75013_SHARP_)
      }, other)
    }else {
      return and__3822__auto____75038
    }
  }else {
    return and__3822__auto____75037
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__75039 = this;
  return new cljs.core.PersistentHashSet(meta, this__75039.hash_map, this__75039.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__75040 = this;
  return this__75040.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__75041 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__75041.meta)
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
  var G__75060 = null;
  var G__75060__2 = function(tsym75046, k) {
    var this__75048 = this;
    var tsym75046__75049 = this;
    var tcoll__75050 = tsym75046__75049;
    if(cljs.core._lookup.call(null, this__75048.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__75060__3 = function(tsym75047, k, not_found) {
    var this__75051 = this;
    var tsym75047__75052 = this;
    var tcoll__75053 = tsym75047__75052;
    if(cljs.core._lookup.call(null, this__75051.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__75060 = function(tsym75047, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__75060__2.call(this, tsym75047, k);
      case 3:
        return G__75060__3.call(this, tsym75047, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__75060
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym75044, args75045) {
  return tsym75044.call.apply(tsym75044, [tsym75044].concat(cljs.core.aclone.call(null, args75045)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__75054 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__75055 = this;
  if(cljs.core._lookup.call(null, this__75055.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__75056 = this;
  return cljs.core.count.call(null, this__75056.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__75057 = this;
  this__75057.transient_map = cljs.core.dissoc_BANG_.call(null, this__75057.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__75058 = this;
  this__75058.transient_map = cljs.core.assoc_BANG_.call(null, this__75058.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__75059 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__75059.transient_map), null)
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
  var this__75065 = this;
  var h__364__auto____75066 = this__75065.__hash;
  if(h__364__auto____75066 != null) {
    return h__364__auto____75066
  }else {
    var h__364__auto____75067 = cljs.core.hash_iset.call(null, coll);
    this__75065.__hash = h__364__auto____75067;
    return h__364__auto____75067
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__75068 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__75069 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__75069.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__75093 = null;
  var G__75093__2 = function(tsym75063, k) {
    var this__75070 = this;
    var tsym75063__75071 = this;
    var coll__75072 = tsym75063__75071;
    return cljs.core._lookup.call(null, coll__75072, k)
  };
  var G__75093__3 = function(tsym75064, k, not_found) {
    var this__75073 = this;
    var tsym75064__75074 = this;
    var coll__75075 = tsym75064__75074;
    return cljs.core._lookup.call(null, coll__75075, k, not_found)
  };
  G__75093 = function(tsym75064, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__75093__2.call(this, tsym75064, k);
      case 3:
        return G__75093__3.call(this, tsym75064, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__75093
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym75061, args75062) {
  return tsym75061.call.apply(tsym75061, [tsym75061].concat(cljs.core.aclone.call(null, args75062)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__75076 = this;
  return new cljs.core.PersistentTreeSet(this__75076.meta, cljs.core.assoc.call(null, this__75076.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__75077 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__75077.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__75078 = this;
  var this$__75079 = this;
  return cljs.core.pr_str.call(null, this$__75079)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__75080 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__75080.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__75081 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__75081.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__75082 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__75083 = this;
  return cljs.core._comparator.call(null, this__75083.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__75084 = this;
  return cljs.core.keys.call(null, this__75084.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__75085 = this;
  return new cljs.core.PersistentTreeSet(this__75085.meta, cljs.core.dissoc.call(null, this__75085.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__75086 = this;
  return cljs.core.count.call(null, this__75086.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__75087 = this;
  var and__3822__auto____75088 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____75088) {
    var and__3822__auto____75089 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____75089) {
      return cljs.core.every_QMARK_.call(null, function(p1__75043_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__75043_SHARP_)
      }, other)
    }else {
      return and__3822__auto____75089
    }
  }else {
    return and__3822__auto____75088
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__75090 = this;
  return new cljs.core.PersistentTreeSet(meta, this__75090.tree_map, this__75090.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__75091 = this;
  return this__75091.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__75092 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__75092.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__75094 = cljs.core.seq.call(null, coll);
  var out__75095 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__75094))) {
      var G__75096 = cljs.core.next.call(null, in$__75094);
      var G__75097 = cljs.core.conj_BANG_.call(null, out__75095, cljs.core.first.call(null, in$__75094));
      in$__75094 = G__75096;
      out__75095 = G__75097;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__75095)
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
  sorted_set.cljs$lang$applyTo = function(arglist__75098) {
    var keys = cljs.core.seq(arglist__75098);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__75100) {
    var comparator = cljs.core.first(arglist__75100);
    var keys = cljs.core.rest(arglist__75100);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__75101 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____75102 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____75102)) {
        var e__75103 = temp__3971__auto____75102;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__75103))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__75101, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__75099_SHARP_) {
      var temp__3971__auto____75104 = cljs.core.find.call(null, smap, p1__75099_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____75104)) {
        var e__75105 = temp__3971__auto____75104;
        return cljs.core.second.call(null, e__75105)
      }else {
        return p1__75099_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__75113 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__75106, seen) {
        while(true) {
          var vec__75107__75108 = p__75106;
          var f__75109 = cljs.core.nth.call(null, vec__75107__75108, 0, null);
          var xs__75110 = vec__75107__75108;
          var temp__3974__auto____75111 = cljs.core.seq.call(null, xs__75110);
          if(cljs.core.truth_(temp__3974__auto____75111)) {
            var s__75112 = temp__3974__auto____75111;
            if(cljs.core.contains_QMARK_.call(null, seen, f__75109)) {
              var G__75114 = cljs.core.rest.call(null, s__75112);
              var G__75115 = seen;
              p__75106 = G__75114;
              seen = G__75115;
              continue
            }else {
              return cljs.core.cons.call(null, f__75109, step.call(null, cljs.core.rest.call(null, s__75112), cljs.core.conj.call(null, seen, f__75109)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__75113.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__75116 = cljs.core.PersistentVector.fromArray([]);
  var s__75117 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__75117))) {
      var G__75118 = cljs.core.conj.call(null, ret__75116, cljs.core.first.call(null, s__75117));
      var G__75119 = cljs.core.next.call(null, s__75117);
      ret__75116 = G__75118;
      s__75117 = G__75119;
      continue
    }else {
      return cljs.core.seq.call(null, ret__75116)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____75120 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____75120) {
        return or__3824__auto____75120
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__75121 = x.lastIndexOf("/");
      if(i__75121 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__75121 + 1)
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
    var or__3824__auto____75122 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____75122) {
      return or__3824__auto____75122
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__75123 = x.lastIndexOf("/");
    if(i__75123 > -1) {
      return cljs.core.subs.call(null, x, 2, i__75123)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__75126 = cljs.core.ObjMap.fromObject([], {});
  var ks__75127 = cljs.core.seq.call(null, keys);
  var vs__75128 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____75129 = ks__75127;
      if(cljs.core.truth_(and__3822__auto____75129)) {
        return vs__75128
      }else {
        return and__3822__auto____75129
      }
    }())) {
      var G__75130 = cljs.core.assoc.call(null, map__75126, cljs.core.first.call(null, ks__75127), cljs.core.first.call(null, vs__75128));
      var G__75131 = cljs.core.next.call(null, ks__75127);
      var G__75132 = cljs.core.next.call(null, vs__75128);
      map__75126 = G__75130;
      ks__75127 = G__75131;
      vs__75128 = G__75132;
      continue
    }else {
      return map__75126
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
    var G__75135__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__75124_SHARP_, p2__75125_SHARP_) {
        return max_key.call(null, k, p1__75124_SHARP_, p2__75125_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__75135 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__75135__delegate.call(this, k, x, y, more)
    };
    G__75135.cljs$lang$maxFixedArity = 3;
    G__75135.cljs$lang$applyTo = function(arglist__75136) {
      var k = cljs.core.first(arglist__75136);
      var x = cljs.core.first(cljs.core.next(arglist__75136));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75136)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75136)));
      return G__75135__delegate(k, x, y, more)
    };
    G__75135.cljs$lang$arity$variadic = G__75135__delegate;
    return G__75135
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
    var G__75137__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__75133_SHARP_, p2__75134_SHARP_) {
        return min_key.call(null, k, p1__75133_SHARP_, p2__75134_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__75137 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__75137__delegate.call(this, k, x, y, more)
    };
    G__75137.cljs$lang$maxFixedArity = 3;
    G__75137.cljs$lang$applyTo = function(arglist__75138) {
      var k = cljs.core.first(arglist__75138);
      var x = cljs.core.first(cljs.core.next(arglist__75138));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75138)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75138)));
      return G__75137__delegate(k, x, y, more)
    };
    G__75137.cljs$lang$arity$variadic = G__75137__delegate;
    return G__75137
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
      var temp__3974__auto____75139 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____75139)) {
        var s__75140 = temp__3974__auto____75139;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__75140), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__75140)))
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
    var temp__3974__auto____75141 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____75141)) {
      var s__75142 = temp__3974__auto____75141;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__75142)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__75142), take_while.call(null, pred, cljs.core.rest.call(null, s__75142)))
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
    var comp__75143 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__75143.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__75144 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____75145 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____75145)) {
        var vec__75146__75147 = temp__3974__auto____75145;
        var e__75148 = cljs.core.nth.call(null, vec__75146__75147, 0, null);
        var s__75149 = vec__75146__75147;
        if(cljs.core.truth_(include__75144.call(null, e__75148))) {
          return s__75149
        }else {
          return cljs.core.next.call(null, s__75149)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__75144, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____75150 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____75150)) {
      var vec__75151__75152 = temp__3974__auto____75150;
      var e__75153 = cljs.core.nth.call(null, vec__75151__75152, 0, null);
      var s__75154 = vec__75151__75152;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__75153)) ? s__75154 : cljs.core.next.call(null, s__75154))
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
    var include__75155 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____75156 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____75156)) {
        var vec__75157__75158 = temp__3974__auto____75156;
        var e__75159 = cljs.core.nth.call(null, vec__75157__75158, 0, null);
        var s__75160 = vec__75157__75158;
        if(cljs.core.truth_(include__75155.call(null, e__75159))) {
          return s__75160
        }else {
          return cljs.core.next.call(null, s__75160)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__75155, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____75161 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____75161)) {
      var vec__75162__75163 = temp__3974__auto____75161;
      var e__75164 = cljs.core.nth.call(null, vec__75162__75163, 0, null);
      var s__75165 = vec__75162__75163;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__75164)) ? s__75165 : cljs.core.next.call(null, s__75165))
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
  var this__75166 = this;
  var h__364__auto____75167 = this__75166.__hash;
  if(h__364__auto____75167 != null) {
    return h__364__auto____75167
  }else {
    var h__364__auto____75168 = cljs.core.hash_coll.call(null, rng);
    this__75166.__hash = h__364__auto____75168;
    return h__364__auto____75168
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__75169 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__75170 = this;
  var this$__75171 = this;
  return cljs.core.pr_str.call(null, this$__75171)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__75172 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__75173 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__75174 = this;
  var comp__75175 = this__75174.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__75175.call(null, this__75174.start, this__75174.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__75176 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__75176.end - this__75176.start) / this__75176.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__75177 = this;
  return this__75177.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__75178 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__75178.meta, this__75178.start + this__75178.step, this__75178.end, this__75178.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__75179 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__75180 = this;
  return new cljs.core.Range(meta, this__75180.start, this__75180.end, this__75180.step, this__75180.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__75181 = this;
  return this__75181.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__75182 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__75182.start + n * this__75182.step
  }else {
    if(function() {
      var and__3822__auto____75183 = this__75182.start > this__75182.end;
      if(and__3822__auto____75183) {
        return this__75182.step === 0
      }else {
        return and__3822__auto____75183
      }
    }()) {
      return this__75182.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__75184 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__75184.start + n * this__75184.step
  }else {
    if(function() {
      var and__3822__auto____75185 = this__75184.start > this__75184.end;
      if(and__3822__auto____75185) {
        return this__75184.step === 0
      }else {
        return and__3822__auto____75185
      }
    }()) {
      return this__75184.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__75186 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__75186.meta)
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
    var temp__3974__auto____75187 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____75187)) {
      var s__75188 = temp__3974__auto____75187;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__75188), take_nth.call(null, n, cljs.core.drop.call(null, n, s__75188)))
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
    var temp__3974__auto____75190 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____75190)) {
      var s__75191 = temp__3974__auto____75190;
      var fst__75192 = cljs.core.first.call(null, s__75191);
      var fv__75193 = f.call(null, fst__75192);
      var run__75194 = cljs.core.cons.call(null, fst__75192, cljs.core.take_while.call(null, function(p1__75189_SHARP_) {
        return cljs.core._EQ_.call(null, fv__75193, f.call(null, p1__75189_SHARP_))
      }, cljs.core.next.call(null, s__75191)));
      return cljs.core.cons.call(null, run__75194, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__75194), s__75191))))
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
      var temp__3971__auto____75205 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____75205)) {
        var s__75206 = temp__3971__auto____75205;
        return reductions.call(null, f, cljs.core.first.call(null, s__75206), cljs.core.rest.call(null, s__75206))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____75207 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____75207)) {
        var s__75208 = temp__3974__auto____75207;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__75208)), cljs.core.rest.call(null, s__75208))
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
      var G__75210 = null;
      var G__75210__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__75210__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__75210__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__75210__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__75210__4 = function() {
        var G__75211__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__75211 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__75211__delegate.call(this, x, y, z, args)
        };
        G__75211.cljs$lang$maxFixedArity = 3;
        G__75211.cljs$lang$applyTo = function(arglist__75212) {
          var x = cljs.core.first(arglist__75212);
          var y = cljs.core.first(cljs.core.next(arglist__75212));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75212)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75212)));
          return G__75211__delegate(x, y, z, args)
        };
        G__75211.cljs$lang$arity$variadic = G__75211__delegate;
        return G__75211
      }();
      G__75210 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__75210__0.call(this);
          case 1:
            return G__75210__1.call(this, x);
          case 2:
            return G__75210__2.call(this, x, y);
          case 3:
            return G__75210__3.call(this, x, y, z);
          default:
            return G__75210__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__75210.cljs$lang$maxFixedArity = 3;
      G__75210.cljs$lang$applyTo = G__75210__4.cljs$lang$applyTo;
      return G__75210
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__75213 = null;
      var G__75213__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__75213__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__75213__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__75213__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__75213__4 = function() {
        var G__75214__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__75214 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__75214__delegate.call(this, x, y, z, args)
        };
        G__75214.cljs$lang$maxFixedArity = 3;
        G__75214.cljs$lang$applyTo = function(arglist__75215) {
          var x = cljs.core.first(arglist__75215);
          var y = cljs.core.first(cljs.core.next(arglist__75215));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75215)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75215)));
          return G__75214__delegate(x, y, z, args)
        };
        G__75214.cljs$lang$arity$variadic = G__75214__delegate;
        return G__75214
      }();
      G__75213 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__75213__0.call(this);
          case 1:
            return G__75213__1.call(this, x);
          case 2:
            return G__75213__2.call(this, x, y);
          case 3:
            return G__75213__3.call(this, x, y, z);
          default:
            return G__75213__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__75213.cljs$lang$maxFixedArity = 3;
      G__75213.cljs$lang$applyTo = G__75213__4.cljs$lang$applyTo;
      return G__75213
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__75216 = null;
      var G__75216__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__75216__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__75216__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__75216__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__75216__4 = function() {
        var G__75217__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__75217 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__75217__delegate.call(this, x, y, z, args)
        };
        G__75217.cljs$lang$maxFixedArity = 3;
        G__75217.cljs$lang$applyTo = function(arglist__75218) {
          var x = cljs.core.first(arglist__75218);
          var y = cljs.core.first(cljs.core.next(arglist__75218));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75218)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75218)));
          return G__75217__delegate(x, y, z, args)
        };
        G__75217.cljs$lang$arity$variadic = G__75217__delegate;
        return G__75217
      }();
      G__75216 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__75216__0.call(this);
          case 1:
            return G__75216__1.call(this, x);
          case 2:
            return G__75216__2.call(this, x, y);
          case 3:
            return G__75216__3.call(this, x, y, z);
          default:
            return G__75216__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__75216.cljs$lang$maxFixedArity = 3;
      G__75216.cljs$lang$applyTo = G__75216__4.cljs$lang$applyTo;
      return G__75216
    }()
  };
  var juxt__4 = function() {
    var G__75219__delegate = function(f, g, h, fs) {
      var fs__75209 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__75220 = null;
        var G__75220__0 = function() {
          return cljs.core.reduce.call(null, function(p1__75195_SHARP_, p2__75196_SHARP_) {
            return cljs.core.conj.call(null, p1__75195_SHARP_, p2__75196_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__75209)
        };
        var G__75220__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__75197_SHARP_, p2__75198_SHARP_) {
            return cljs.core.conj.call(null, p1__75197_SHARP_, p2__75198_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__75209)
        };
        var G__75220__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__75199_SHARP_, p2__75200_SHARP_) {
            return cljs.core.conj.call(null, p1__75199_SHARP_, p2__75200_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__75209)
        };
        var G__75220__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__75201_SHARP_, p2__75202_SHARP_) {
            return cljs.core.conj.call(null, p1__75201_SHARP_, p2__75202_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__75209)
        };
        var G__75220__4 = function() {
          var G__75221__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__75203_SHARP_, p2__75204_SHARP_) {
              return cljs.core.conj.call(null, p1__75203_SHARP_, cljs.core.apply.call(null, p2__75204_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__75209)
          };
          var G__75221 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__75221__delegate.call(this, x, y, z, args)
          };
          G__75221.cljs$lang$maxFixedArity = 3;
          G__75221.cljs$lang$applyTo = function(arglist__75222) {
            var x = cljs.core.first(arglist__75222);
            var y = cljs.core.first(cljs.core.next(arglist__75222));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75222)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75222)));
            return G__75221__delegate(x, y, z, args)
          };
          G__75221.cljs$lang$arity$variadic = G__75221__delegate;
          return G__75221
        }();
        G__75220 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__75220__0.call(this);
            case 1:
              return G__75220__1.call(this, x);
            case 2:
              return G__75220__2.call(this, x, y);
            case 3:
              return G__75220__3.call(this, x, y, z);
            default:
              return G__75220__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__75220.cljs$lang$maxFixedArity = 3;
        G__75220.cljs$lang$applyTo = G__75220__4.cljs$lang$applyTo;
        return G__75220
      }()
    };
    var G__75219 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__75219__delegate.call(this, f, g, h, fs)
    };
    G__75219.cljs$lang$maxFixedArity = 3;
    G__75219.cljs$lang$applyTo = function(arglist__75223) {
      var f = cljs.core.first(arglist__75223);
      var g = cljs.core.first(cljs.core.next(arglist__75223));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75223)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75223)));
      return G__75219__delegate(f, g, h, fs)
    };
    G__75219.cljs$lang$arity$variadic = G__75219__delegate;
    return G__75219
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
        var G__75225 = cljs.core.next.call(null, coll);
        coll = G__75225;
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
        var and__3822__auto____75224 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____75224)) {
          return n > 0
        }else {
          return and__3822__auto____75224
        }
      }())) {
        var G__75226 = n - 1;
        var G__75227 = cljs.core.next.call(null, coll);
        n = G__75226;
        coll = G__75227;
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
  var matches__75228 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__75228), s)) {
    if(cljs.core.count.call(null, matches__75228) === 1) {
      return cljs.core.first.call(null, matches__75228)
    }else {
      return cljs.core.vec.call(null, matches__75228)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__75229 = re.exec(s);
  if(matches__75229 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__75229) === 1) {
      return cljs.core.first.call(null, matches__75229)
    }else {
      return cljs.core.vec.call(null, matches__75229)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__75230 = cljs.core.re_find.call(null, re, s);
  var match_idx__75231 = s.search(re);
  var match_str__75232 = cljs.core.coll_QMARK_.call(null, match_data__75230) ? cljs.core.first.call(null, match_data__75230) : match_data__75230;
  var post_match__75233 = cljs.core.subs.call(null, s, match_idx__75231 + cljs.core.count.call(null, match_str__75232));
  if(cljs.core.truth_(match_data__75230)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__75230, re_seq.call(null, re, post_match__75233))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__75235__75236 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___75237 = cljs.core.nth.call(null, vec__75235__75236, 0, null);
  var flags__75238 = cljs.core.nth.call(null, vec__75235__75236, 1, null);
  var pattern__75239 = cljs.core.nth.call(null, vec__75235__75236, 2, null);
  return new RegExp(pattern__75239, flags__75238)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__75234_SHARP_) {
    return print_one.call(null, p1__75234_SHARP_, opts)
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
          var and__3822__auto____75240 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____75240)) {
            var and__3822__auto____75244 = function() {
              var G__75241__75242 = obj;
              if(G__75241__75242 != null) {
                if(function() {
                  var or__3824__auto____75243 = G__75241__75242.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____75243) {
                    return or__3824__auto____75243
                  }else {
                    return G__75241__75242.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__75241__75242.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__75241__75242)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__75241__75242)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____75244)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____75244
            }
          }else {
            return and__3822__auto____75240
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____75245 = obj != null;
          if(and__3822__auto____75245) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____75245
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__75246__75247 = obj;
          if(G__75246__75247 != null) {
            if(function() {
              var or__3824__auto____75248 = G__75246__75247.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____75248) {
                return or__3824__auto____75248
              }else {
                return G__75246__75247.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__75246__75247.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__75246__75247)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__75246__75247)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__75249 = cljs.core.first.call(null, objs);
  var sb__75250 = new goog.string.StringBuffer;
  var G__75251__75252 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__75251__75252)) {
    var obj__75253 = cljs.core.first.call(null, G__75251__75252);
    var G__75251__75254 = G__75251__75252;
    while(true) {
      if(obj__75253 === first_obj__75249) {
      }else {
        sb__75250.append(" ")
      }
      var G__75255__75256 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__75253, opts));
      if(cljs.core.truth_(G__75255__75256)) {
        var string__75257 = cljs.core.first.call(null, G__75255__75256);
        var G__75255__75258 = G__75255__75256;
        while(true) {
          sb__75250.append(string__75257);
          var temp__3974__auto____75259 = cljs.core.next.call(null, G__75255__75258);
          if(cljs.core.truth_(temp__3974__auto____75259)) {
            var G__75255__75260 = temp__3974__auto____75259;
            var G__75263 = cljs.core.first.call(null, G__75255__75260);
            var G__75264 = G__75255__75260;
            string__75257 = G__75263;
            G__75255__75258 = G__75264;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____75261 = cljs.core.next.call(null, G__75251__75254);
      if(cljs.core.truth_(temp__3974__auto____75261)) {
        var G__75251__75262 = temp__3974__auto____75261;
        var G__75265 = cljs.core.first.call(null, G__75251__75262);
        var G__75266 = G__75251__75262;
        obj__75253 = G__75265;
        G__75251__75254 = G__75266;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__75250
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__75267 = cljs.core.pr_sb.call(null, objs, opts);
  sb__75267.append("\n");
  return[cljs.core.str(sb__75267)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__75268 = cljs.core.first.call(null, objs);
  var G__75269__75270 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__75269__75270)) {
    var obj__75271 = cljs.core.first.call(null, G__75269__75270);
    var G__75269__75272 = G__75269__75270;
    while(true) {
      if(obj__75271 === first_obj__75268) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__75273__75274 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__75271, opts));
      if(cljs.core.truth_(G__75273__75274)) {
        var string__75275 = cljs.core.first.call(null, G__75273__75274);
        var G__75273__75276 = G__75273__75274;
        while(true) {
          cljs.core.string_print.call(null, string__75275);
          var temp__3974__auto____75277 = cljs.core.next.call(null, G__75273__75276);
          if(cljs.core.truth_(temp__3974__auto____75277)) {
            var G__75273__75278 = temp__3974__auto____75277;
            var G__75281 = cljs.core.first.call(null, G__75273__75278);
            var G__75282 = G__75273__75278;
            string__75275 = G__75281;
            G__75273__75276 = G__75282;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____75279 = cljs.core.next.call(null, G__75269__75272);
      if(cljs.core.truth_(temp__3974__auto____75279)) {
        var G__75269__75280 = temp__3974__auto____75279;
        var G__75283 = cljs.core.first.call(null, G__75269__75280);
        var G__75284 = G__75269__75280;
        obj__75271 = G__75283;
        G__75269__75272 = G__75284;
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
  pr_str.cljs$lang$applyTo = function(arglist__75285) {
    var objs = cljs.core.seq(arglist__75285);
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
  prn_str.cljs$lang$applyTo = function(arglist__75286) {
    var objs = cljs.core.seq(arglist__75286);
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
  pr.cljs$lang$applyTo = function(arglist__75287) {
    var objs = cljs.core.seq(arglist__75287);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__75288) {
    var objs = cljs.core.seq(arglist__75288);
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
  print_str.cljs$lang$applyTo = function(arglist__75289) {
    var objs = cljs.core.seq(arglist__75289);
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
  println.cljs$lang$applyTo = function(arglist__75290) {
    var objs = cljs.core.seq(arglist__75290);
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
  println_str.cljs$lang$applyTo = function(arglist__75291) {
    var objs = cljs.core.seq(arglist__75291);
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
  prn.cljs$lang$applyTo = function(arglist__75292) {
    var objs = cljs.core.seq(arglist__75292);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__75293 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__75293, "{", ", ", "}", opts, coll)
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
  var pr_pair__75294 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__75294, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__75295 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__75295, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____75296 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____75296)) {
        var nspc__75297 = temp__3974__auto____75296;
        return[cljs.core.str(nspc__75297), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____75298 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____75298)) {
          var nspc__75299 = temp__3974__auto____75298;
          return[cljs.core.str(nspc__75299), cljs.core.str("/")].join("")
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
  var pr_pair__75300 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__75300, "{", ", ", "}", opts, coll)
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
  var pr_pair__75301 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__75301, "{", ", ", "}", opts, coll)
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
  var this__75302 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__75303 = this;
  var G__75304__75305 = cljs.core.seq.call(null, this__75303.watches);
  if(cljs.core.truth_(G__75304__75305)) {
    var G__75307__75309 = cljs.core.first.call(null, G__75304__75305);
    var vec__75308__75310 = G__75307__75309;
    var key__75311 = cljs.core.nth.call(null, vec__75308__75310, 0, null);
    var f__75312 = cljs.core.nth.call(null, vec__75308__75310, 1, null);
    var G__75304__75313 = G__75304__75305;
    var G__75307__75314 = G__75307__75309;
    var G__75304__75315 = G__75304__75313;
    while(true) {
      var vec__75316__75317 = G__75307__75314;
      var key__75318 = cljs.core.nth.call(null, vec__75316__75317, 0, null);
      var f__75319 = cljs.core.nth.call(null, vec__75316__75317, 1, null);
      var G__75304__75320 = G__75304__75315;
      f__75319.call(null, key__75318, this$, oldval, newval);
      var temp__3974__auto____75321 = cljs.core.next.call(null, G__75304__75320);
      if(cljs.core.truth_(temp__3974__auto____75321)) {
        var G__75304__75322 = temp__3974__auto____75321;
        var G__75329 = cljs.core.first.call(null, G__75304__75322);
        var G__75330 = G__75304__75322;
        G__75307__75314 = G__75329;
        G__75304__75315 = G__75330;
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
  var this__75323 = this;
  return this$.watches = cljs.core.assoc.call(null, this__75323.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__75324 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__75324.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__75325 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__75325.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__75326 = this;
  return this__75326.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__75327 = this;
  return this__75327.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__75328 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__75337__delegate = function(x, p__75331) {
      var map__75332__75333 = p__75331;
      var map__75332__75334 = cljs.core.seq_QMARK_.call(null, map__75332__75333) ? cljs.core.apply.call(null, cljs.core.hash_map, map__75332__75333) : map__75332__75333;
      var validator__75335 = cljs.core.get.call(null, map__75332__75334, "\ufdd0'validator");
      var meta__75336 = cljs.core.get.call(null, map__75332__75334, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__75336, validator__75335, null)
    };
    var G__75337 = function(x, var_args) {
      var p__75331 = null;
      if(goog.isDef(var_args)) {
        p__75331 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__75337__delegate.call(this, x, p__75331)
    };
    G__75337.cljs$lang$maxFixedArity = 1;
    G__75337.cljs$lang$applyTo = function(arglist__75338) {
      var x = cljs.core.first(arglist__75338);
      var p__75331 = cljs.core.rest(arglist__75338);
      return G__75337__delegate(x, p__75331)
    };
    G__75337.cljs$lang$arity$variadic = G__75337__delegate;
    return G__75337
  }();
  atom = function(x, var_args) {
    var p__75331 = var_args;
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
  var temp__3974__auto____75339 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____75339)) {
    var validate__75340 = temp__3974__auto____75339;
    if(cljs.core.truth_(validate__75340.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__75341 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__75341, new_value);
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
    var G__75342__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__75342 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__75342__delegate.call(this, a, f, x, y, z, more)
    };
    G__75342.cljs$lang$maxFixedArity = 5;
    G__75342.cljs$lang$applyTo = function(arglist__75343) {
      var a = cljs.core.first(arglist__75343);
      var f = cljs.core.first(cljs.core.next(arglist__75343));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75343)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__75343))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__75343)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__75343)))));
      return G__75342__delegate(a, f, x, y, z, more)
    };
    G__75342.cljs$lang$arity$variadic = G__75342__delegate;
    return G__75342
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__75344) {
    var iref = cljs.core.first(arglist__75344);
    var f = cljs.core.first(cljs.core.next(arglist__75344));
    var args = cljs.core.rest(cljs.core.next(arglist__75344));
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
  var this__75345 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__75345.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__75346 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__75346.state, function(p__75347) {
    var curr_state__75348 = p__75347;
    var curr_state__75349 = cljs.core.seq_QMARK_.call(null, curr_state__75348) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__75348) : curr_state__75348;
    var done__75350 = cljs.core.get.call(null, curr_state__75349, "\ufdd0'done");
    if(cljs.core.truth_(done__75350)) {
      return curr_state__75349
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__75346.f.call(null)})
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
    var map__75351__75352 = options;
    var map__75351__75353 = cljs.core.seq_QMARK_.call(null, map__75351__75352) ? cljs.core.apply.call(null, cljs.core.hash_map, map__75351__75352) : map__75351__75352;
    var keywordize_keys__75354 = cljs.core.get.call(null, map__75351__75353, "\ufdd0'keywordize-keys");
    var keyfn__75355 = cljs.core.truth_(keywordize_keys__75354) ? cljs.core.keyword : cljs.core.str;
    var f__75361 = function thisfn(x) {
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
                var iter__625__auto____75360 = function iter__75356(s__75357) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__75357__75358 = s__75357;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__75357__75358))) {
                        var k__75359 = cljs.core.first.call(null, s__75357__75358);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__75355.call(null, k__75359), thisfn.call(null, x[k__75359])]), iter__75356.call(null, cljs.core.rest.call(null, s__75357__75358)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____75360.call(null, cljs.core.js_keys.call(null, x))
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
    return f__75361.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__75362) {
    var x = cljs.core.first(arglist__75362);
    var options = cljs.core.rest(arglist__75362);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__75363 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__75367__delegate = function(args) {
      var temp__3971__auto____75364 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__75363), args);
      if(cljs.core.truth_(temp__3971__auto____75364)) {
        var v__75365 = temp__3971__auto____75364;
        return v__75365
      }else {
        var ret__75366 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__75363, cljs.core.assoc, args, ret__75366);
        return ret__75366
      }
    };
    var G__75367 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__75367__delegate.call(this, args)
    };
    G__75367.cljs$lang$maxFixedArity = 0;
    G__75367.cljs$lang$applyTo = function(arglist__75368) {
      var args = cljs.core.seq(arglist__75368);
      return G__75367__delegate(args)
    };
    G__75367.cljs$lang$arity$variadic = G__75367__delegate;
    return G__75367
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__75369 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__75369)) {
        var G__75370 = ret__75369;
        f = G__75370;
        continue
      }else {
        return ret__75369
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__75371__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__75371 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__75371__delegate.call(this, f, args)
    };
    G__75371.cljs$lang$maxFixedArity = 1;
    G__75371.cljs$lang$applyTo = function(arglist__75372) {
      var f = cljs.core.first(arglist__75372);
      var args = cljs.core.rest(arglist__75372);
      return G__75371__delegate(f, args)
    };
    G__75371.cljs$lang$arity$variadic = G__75371__delegate;
    return G__75371
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
    var k__75373 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__75373, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__75373, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3824__auto____75374 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____75374) {
      return or__3824__auto____75374
    }else {
      var or__3824__auto____75375 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____75375) {
        return or__3824__auto____75375
      }else {
        var and__3822__auto____75376 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____75376) {
          var and__3822__auto____75377 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____75377) {
            var and__3822__auto____75378 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____75378) {
              var ret__75379 = true;
              var i__75380 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____75381 = cljs.core.not.call(null, ret__75379);
                  if(or__3824__auto____75381) {
                    return or__3824__auto____75381
                  }else {
                    return i__75380 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__75379
                }else {
                  var G__75382 = isa_QMARK_.call(null, h, child.call(null, i__75380), parent.call(null, i__75380));
                  var G__75383 = i__75380 + 1;
                  ret__75379 = G__75382;
                  i__75380 = G__75383;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____75378
            }
          }else {
            return and__3822__auto____75377
          }
        }else {
          return and__3822__auto____75376
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
    var tp__75387 = "\ufdd0'parents".call(null, h);
    var td__75388 = "\ufdd0'descendants".call(null, h);
    var ta__75389 = "\ufdd0'ancestors".call(null, h);
    var tf__75390 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____75391 = cljs.core.contains_QMARK_.call(null, tp__75387.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__75389.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__75389.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__75387, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__75390.call(null, "\ufdd0'ancestors".call(null, h), tag, td__75388, parent, ta__75389), "\ufdd0'descendants":tf__75390.call(null, "\ufdd0'descendants".call(null, h), parent, ta__75389, tag, td__75388)})
    }();
    if(cljs.core.truth_(or__3824__auto____75391)) {
      return or__3824__auto____75391
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
    var parentMap__75392 = "\ufdd0'parents".call(null, h);
    var childsParents__75393 = cljs.core.truth_(parentMap__75392.call(null, tag)) ? cljs.core.disj.call(null, parentMap__75392.call(null, tag), parent) : cljs.core.set([]);
    var newParents__75394 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__75393)) ? cljs.core.assoc.call(null, parentMap__75392, tag, childsParents__75393) : cljs.core.dissoc.call(null, parentMap__75392, tag);
    var deriv_seq__75395 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__75384_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__75384_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__75384_SHARP_), cljs.core.second.call(null, p1__75384_SHARP_)))
    }, cljs.core.seq.call(null, newParents__75394)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__75392.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__75385_SHARP_, p2__75386_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__75385_SHARP_, p2__75386_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__75395))
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
  var xprefs__75396 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____75398 = cljs.core.truth_(function() {
    var and__3822__auto____75397 = xprefs__75396;
    if(cljs.core.truth_(and__3822__auto____75397)) {
      return xprefs__75396.call(null, y)
    }else {
      return and__3822__auto____75397
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____75398)) {
    return or__3824__auto____75398
  }else {
    var or__3824__auto____75400 = function() {
      var ps__75399 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__75399) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__75399), prefer_table))) {
          }else {
          }
          var G__75403 = cljs.core.rest.call(null, ps__75399);
          ps__75399 = G__75403;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____75400)) {
      return or__3824__auto____75400
    }else {
      var or__3824__auto____75402 = function() {
        var ps__75401 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__75401) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__75401), y, prefer_table))) {
            }else {
            }
            var G__75404 = cljs.core.rest.call(null, ps__75401);
            ps__75401 = G__75404;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____75402)) {
        return or__3824__auto____75402
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____75405 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____75405)) {
    return or__3824__auto____75405
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__75414 = cljs.core.reduce.call(null, function(be, p__75406) {
    var vec__75407__75408 = p__75406;
    var k__75409 = cljs.core.nth.call(null, vec__75407__75408, 0, null);
    var ___75410 = cljs.core.nth.call(null, vec__75407__75408, 1, null);
    var e__75411 = vec__75407__75408;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__75409)) {
      var be2__75413 = cljs.core.truth_(function() {
        var or__3824__auto____75412 = be == null;
        if(or__3824__auto____75412) {
          return or__3824__auto____75412
        }else {
          return cljs.core.dominates.call(null, k__75409, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__75411 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__75413), k__75409, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__75409), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__75413)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__75413
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__75414)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__75414));
      return cljs.core.second.call(null, best_entry__75414)
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
    var and__3822__auto____75415 = mf;
    if(and__3822__auto____75415) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____75415
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____75416 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75416) {
        return or__3824__auto____75416
      }else {
        var or__3824__auto____75417 = cljs.core._reset["_"];
        if(or__3824__auto____75417) {
          return or__3824__auto____75417
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____75418 = mf;
    if(and__3822__auto____75418) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____75418
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____75419 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75419) {
        return or__3824__auto____75419
      }else {
        var or__3824__auto____75420 = cljs.core._add_method["_"];
        if(or__3824__auto____75420) {
          return or__3824__auto____75420
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____75421 = mf;
    if(and__3822__auto____75421) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____75421
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____75422 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75422) {
        return or__3824__auto____75422
      }else {
        var or__3824__auto____75423 = cljs.core._remove_method["_"];
        if(or__3824__auto____75423) {
          return or__3824__auto____75423
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____75424 = mf;
    if(and__3822__auto____75424) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____75424
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____75425 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75425) {
        return or__3824__auto____75425
      }else {
        var or__3824__auto____75426 = cljs.core._prefer_method["_"];
        if(or__3824__auto____75426) {
          return or__3824__auto____75426
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____75427 = mf;
    if(and__3822__auto____75427) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____75427
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____75428 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75428) {
        return or__3824__auto____75428
      }else {
        var or__3824__auto____75429 = cljs.core._get_method["_"];
        if(or__3824__auto____75429) {
          return or__3824__auto____75429
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____75430 = mf;
    if(and__3822__auto____75430) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____75430
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____75431 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75431) {
        return or__3824__auto____75431
      }else {
        var or__3824__auto____75432 = cljs.core._methods["_"];
        if(or__3824__auto____75432) {
          return or__3824__auto____75432
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____75433 = mf;
    if(and__3822__auto____75433) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____75433
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____75434 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75434) {
        return or__3824__auto____75434
      }else {
        var or__3824__auto____75435 = cljs.core._prefers["_"];
        if(or__3824__auto____75435) {
          return or__3824__auto____75435
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____75436 = mf;
    if(and__3822__auto____75436) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____75436
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____75437 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____75437) {
        return or__3824__auto____75437
      }else {
        var or__3824__auto____75438 = cljs.core._dispatch["_"];
        if(or__3824__auto____75438) {
          return or__3824__auto____75438
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__75439 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__75440 = cljs.core._get_method.call(null, mf, dispatch_val__75439);
  if(cljs.core.truth_(target_fn__75440)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__75439)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__75440, args)
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
  var this__75441 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__75442 = this;
  cljs.core.swap_BANG_.call(null, this__75442.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__75442.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__75442.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__75442.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__75443 = this;
  cljs.core.swap_BANG_.call(null, this__75443.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__75443.method_cache, this__75443.method_table, this__75443.cached_hierarchy, this__75443.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__75444 = this;
  cljs.core.swap_BANG_.call(null, this__75444.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__75444.method_cache, this__75444.method_table, this__75444.cached_hierarchy, this__75444.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__75445 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__75445.cached_hierarchy), cljs.core.deref.call(null, this__75445.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__75445.method_cache, this__75445.method_table, this__75445.cached_hierarchy, this__75445.hierarchy)
  }
  var temp__3971__auto____75446 = cljs.core.deref.call(null, this__75445.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____75446)) {
    var target_fn__75447 = temp__3971__auto____75446;
    return target_fn__75447
  }else {
    var temp__3971__auto____75448 = cljs.core.find_and_cache_best_method.call(null, this__75445.name, dispatch_val, this__75445.hierarchy, this__75445.method_table, this__75445.prefer_table, this__75445.method_cache, this__75445.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____75448)) {
      var target_fn__75449 = temp__3971__auto____75448;
      return target_fn__75449
    }else {
      return cljs.core.deref.call(null, this__75445.method_table).call(null, this__75445.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__75450 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__75450.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__75450.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__75450.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__75450.method_cache, this__75450.method_table, this__75450.cached_hierarchy, this__75450.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__75451 = this;
  return cljs.core.deref.call(null, this__75451.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__75452 = this;
  return cljs.core.deref.call(null, this__75452.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__75453 = this;
  return cljs.core.do_dispatch.call(null, mf, this__75453.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__75454__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__75454 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__75454__delegate.call(this, _, args)
  };
  G__75454.cljs$lang$maxFixedArity = 1;
  G__75454.cljs$lang$applyTo = function(arglist__75455) {
    var _ = cljs.core.first(arglist__75455);
    var args = cljs.core.rest(arglist__75455);
    return G__75454__delegate(_, args)
  };
  G__75454.cljs$lang$arity$variadic = G__75454__delegate;
  return G__75454
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
      var s__73077 = s;
      var limit__73078 = limit;
      var parts__73079 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__73078, 1)) {
          return cljs.core.conj.call(null, parts__73079, s__73077)
        }else {
          var temp__3971__auto____73080 = cljs.core.re_find.call(null, re, s__73077);
          if(cljs.core.truth_(temp__3971__auto____73080)) {
            var m__73081 = temp__3971__auto____73080;
            var index__73082 = s__73077.indexOf(m__73081);
            var G__73083 = s__73077.substring(index__73082 + cljs.core.count.call(null, m__73081));
            var G__73084 = limit__73078 - 1;
            var G__73085 = cljs.core.conj.call(null, parts__73079, s__73077.substring(0, index__73082));
            s__73077 = G__73083;
            limit__73078 = G__73084;
            parts__73079 = G__73085;
            continue
          }else {
            return cljs.core.conj.call(null, parts__73079, s__73077)
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
  var index__73086 = s.length;
  while(true) {
    if(index__73086 === 0) {
      return""
    }else {
      var ch__73087 = cljs.core.get.call(null, s, index__73086 - 1);
      if(function() {
        var or__3824__auto____73088 = cljs.core._EQ_.call(null, ch__73087, "\n");
        if(or__3824__auto____73088) {
          return or__3824__auto____73088
        }else {
          return cljs.core._EQ_.call(null, ch__73087, "\r")
        }
      }()) {
        var G__73089 = index__73086 - 1;
        index__73086 = G__73089;
        continue
      }else {
        return s.substring(0, index__73086)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__73090 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____73091 = cljs.core.not.call(null, s__73090);
    if(or__3824__auto____73091) {
      return or__3824__auto____73091
    }else {
      var or__3824__auto____73092 = cljs.core._EQ_.call(null, "", s__73090);
      if(or__3824__auto____73092) {
        return or__3824__auto____73092
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__73090)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__73093 = new goog.string.StringBuffer;
  var length__73094 = s.length;
  var index__73095 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__73094, index__73095)) {
      return buffer__73093.toString()
    }else {
      var ch__73096 = s.charAt(index__73095);
      var temp__3971__auto____73097 = cljs.core.get.call(null, cmap, ch__73096);
      if(cljs.core.truth_(temp__3971__auto____73097)) {
        var replacement__73098 = temp__3971__auto____73097;
        buffer__73093.append([cljs.core.str(replacement__73098)].join(""))
      }else {
        buffer__73093.append(ch__73096)
      }
      var G__73099 = index__73095 + 1;
      index__73095 = G__73099;
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
      var or__3824__auto____73061 = cljs.core.symbol_QMARK_.call(null, x);
      if(or__3824__auto____73061) {
        return or__3824__auto____73061
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
    var G__73062__delegate = function(x, xs) {
      return function(s, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__73063 = [cljs.core.str(s), cljs.core.str(as_str.call(null, cljs.core.first.call(null, more)))].join("");
            var G__73064 = cljs.core.next.call(null, more);
            s = G__73063;
            more = G__73064;
            continue
          }else {
            return s
          }
          break
        }
      }.call(null, as_str.call(null, x), xs)
    };
    var G__73062 = function(x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__73062__delegate.call(this, x, xs)
    };
    G__73062.cljs$lang$maxFixedArity = 1;
    G__73062.cljs$lang$applyTo = function(arglist__73065) {
      var x = cljs.core.first(arglist__73065);
      var xs = cljs.core.rest(arglist__73065);
      return G__73062__delegate(x, xs)
    };
    G__73062.cljs$lang$arity$variadic = G__73062__delegate;
    return G__73062
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
    var iter__625__auto____73073 = function iter__73066(s__73067) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__73067__73068 = s__73067;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__73067__73068))) {
            var vec__73069__73070 = cljs.core.first.call(null, s__73067__73068);
            var k__73071 = cljs.core.nth.call(null, vec__73069__73070, 0, null);
            var v__73072 = cljs.core.nth.call(null, vec__73069__73070, 1, null);
            return cljs.core.cons.call(null, [cljs.core.str(crate.util.url_encode_component.call(null, k__73071)), cljs.core.str("="), cljs.core.str(crate.util.url_encode_component.call(null, v__73072))].join(""), iter__73066.call(null, cljs.core.rest.call(null, s__73067__73068)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____73073.call(null, params)
  }())
};
crate.util.url = function() {
  var url__delegate = function(args) {
    var params__73074 = cljs.core.last.call(null, args);
    var args__73075 = cljs.core.butlast.call(null, args);
    return[cljs.core.str(crate.util.to_uri.call(null, [cljs.core.str(cljs.core.apply.call(null, cljs.core.str, args__73075)), cljs.core.str(cljs.core.map_QMARK_.call(null, params__73074) ? [cljs.core.str("?"), cljs.core.str(crate.util.url_encode.call(null, params__73074))].join("") : params__73074)].join("")))].join("")
  };
  var url = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return url__delegate.call(this, args)
  };
  url.cljs$lang$maxFixedArity = 0;
  url.cljs$lang$applyTo = function(arglist__73076) {
    var args = cljs.core.seq(arglist__73076);
    return url__delegate(args)
  };
  url.cljs$lang$arity$variadic = url__delegate;
  return url
}();
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__75564 = {};
  var G__75565__75566 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__75565__75566)) {
    var G__75568__75570 = cljs.core.first.call(null, G__75565__75566);
    var vec__75569__75571 = G__75568__75570;
    var k__75572 = cljs.core.nth.call(null, vec__75569__75571, 0, null);
    var v__75573 = cljs.core.nth.call(null, vec__75569__75571, 1, null);
    var G__75565__75574 = G__75565__75566;
    var G__75568__75575 = G__75568__75570;
    var G__75565__75576 = G__75565__75574;
    while(true) {
      var vec__75577__75578 = G__75568__75575;
      var k__75579 = cljs.core.nth.call(null, vec__75577__75578, 0, null);
      var v__75580 = cljs.core.nth.call(null, vec__75577__75578, 1, null);
      var G__75565__75581 = G__75565__75576;
      out__75564[cljs.core.name.call(null, k__75579)] = v__75580;
      var temp__3974__auto____75582 = cljs.core.next.call(null, G__75565__75581);
      if(cljs.core.truth_(temp__3974__auto____75582)) {
        var G__75565__75583 = temp__3974__auto____75582;
        var G__75584 = cljs.core.first.call(null, G__75565__75583);
        var G__75585 = G__75565__75583;
        G__75568__75575 = G__75584;
        G__75565__75576 = G__75585;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__75564
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__75586 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__75586)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__75587) {
    var v = cljs.core.first(arglist__75587);
    var text = cljs.core.rest(arglist__75587);
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
        return cljs.core.reduce.call(null, function(m, p__75588) {
          var vec__75589__75590 = p__75588;
          var k__75591 = cljs.core.nth.call(null, vec__75589__75590, 0, null);
          var v__75592 = cljs.core.nth.call(null, vec__75589__75590, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__75591), clj__GT_js.call(null, v__75592))
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
      var temp__3971__auto____75456 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____75456)) {
        var cm__75457 = temp__3971__auto____75456;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__75457), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__75458) {
    var vec__75459__75460 = p__75458;
    var context__75461 = cljs.core.nth.call(null, vec__75459__75460, 0, null);
    if(cljs.core.not.call(null, context__75461)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__75461)
    }
  };
  var $ = function(sel, var_args) {
    var p__75458 = null;
    if(goog.isDef(var_args)) {
      p__75458 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__75458)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__75462) {
    var sel = cljs.core.first(arglist__75462);
    var p__75458 = cljs.core.rest(arglist__75462);
    return $__delegate(sel, p__75458)
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
  var or__3824__auto____75463 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____75463)) {
    return or__3824__auto____75463
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
  var G__75464 = null;
  var G__75464__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__75464__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__75464 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__75464__2.call(this, _, k);
      case 3:
        return G__75464__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__75464
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
  var attr__delegate = function($elem, a, p__75465) {
    var vec__75466__75467 = p__75465;
    var v__75468 = cljs.core.nth.call(null, vec__75466__75467, 0, null);
    var a__75469 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__75468)) {
      return $elem.attr(a__75469)
    }else {
      return $elem.attr(a__75469, v__75468)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__75465 = null;
    if(goog.isDef(var_args)) {
      p__75465 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__75465)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__75470) {
    var $elem = cljs.core.first(arglist__75470);
    var a = cljs.core.first(cljs.core.next(arglist__75470));
    var p__75465 = cljs.core.rest(cljs.core.next(arglist__75470));
    return attr__delegate($elem, a, p__75465)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__75471) {
    var vec__75472__75473 = p__75471;
    var v__75474 = cljs.core.nth.call(null, vec__75472__75473, 0, null);
    var k__75475 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__75474)) {
      return $elem.data(k__75475)
    }else {
      return $elem.data(k__75475, v__75474)
    }
  };
  var data = function($elem, k, var_args) {
    var p__75471 = null;
    if(goog.isDef(var_args)) {
      p__75471 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__75471)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__75476) {
    var $elem = cljs.core.first(arglist__75476);
    var k = cljs.core.first(cljs.core.next(arglist__75476));
    var p__75471 = cljs.core.rest(cljs.core.next(arglist__75476));
    return data__delegate($elem, k, p__75471)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__75477 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__75477)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__75478 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__75478)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__75479 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__75479)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__75480 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__75480)
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
  var hide__delegate = function($elem, p__75481) {
    var vec__75482__75483 = p__75481;
    var speed__75484 = cljs.core.nth.call(null, vec__75482__75483, 0, null);
    var on_finish__75485 = cljs.core.nth.call(null, vec__75482__75483, 1, null);
    return $elem.hide(speed__75484, on_finish__75485)
  };
  var hide = function($elem, var_args) {
    var p__75481 = null;
    if(goog.isDef(var_args)) {
      p__75481 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__75481)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__75486) {
    var $elem = cljs.core.first(arglist__75486);
    var p__75481 = cljs.core.rest(arglist__75486);
    return hide__delegate($elem, p__75481)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__75487) {
    var vec__75488__75489 = p__75487;
    var speed__75490 = cljs.core.nth.call(null, vec__75488__75489, 0, null);
    var on_finish__75491 = cljs.core.nth.call(null, vec__75488__75489, 1, null);
    return $elem.show(speed__75490, on_finish__75491)
  };
  var show = function($elem, var_args) {
    var p__75487 = null;
    if(goog.isDef(var_args)) {
      p__75487 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__75487)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__75492) {
    var $elem = cljs.core.first(arglist__75492);
    var p__75487 = cljs.core.rest(arglist__75492);
    return show__delegate($elem, p__75487)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__75493) {
    var vec__75494__75495 = p__75493;
    var speed__75496 = cljs.core.nth.call(null, vec__75494__75495, 0, null);
    var on_finish__75497 = cljs.core.nth.call(null, vec__75494__75495, 1, null);
    return $elem.toggle(speed__75496, on_finish__75497)
  };
  var toggle = function($elem, var_args) {
    var p__75493 = null;
    if(goog.isDef(var_args)) {
      p__75493 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__75493)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__75498) {
    var $elem = cljs.core.first(arglist__75498);
    var p__75493 = cljs.core.rest(arglist__75498);
    return toggle__delegate($elem, p__75493)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__75499) {
    var vec__75500__75501 = p__75499;
    var speed__75502 = cljs.core.nth.call(null, vec__75500__75501, 0, null);
    var on_finish__75503 = cljs.core.nth.call(null, vec__75500__75501, 1, null);
    return $elem.fadeOut(speed__75502, on_finish__75503)
  };
  var fade_out = function($elem, var_args) {
    var p__75499 = null;
    if(goog.isDef(var_args)) {
      p__75499 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__75499)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__75504) {
    var $elem = cljs.core.first(arglist__75504);
    var p__75499 = cljs.core.rest(arglist__75504);
    return fade_out__delegate($elem, p__75499)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__75505) {
    var vec__75506__75507 = p__75505;
    var speed__75508 = cljs.core.nth.call(null, vec__75506__75507, 0, null);
    var on_finish__75509 = cljs.core.nth.call(null, vec__75506__75507, 1, null);
    return $elem.fadeIn(speed__75508, on_finish__75509)
  };
  var fade_in = function($elem, var_args) {
    var p__75505 = null;
    if(goog.isDef(var_args)) {
      p__75505 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__75505)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__75510) {
    var $elem = cljs.core.first(arglist__75510);
    var p__75505 = cljs.core.rest(arglist__75510);
    return fade_in__delegate($elem, p__75505)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__75511) {
    var vec__75512__75513 = p__75511;
    var speed__75514 = cljs.core.nth.call(null, vec__75512__75513, 0, null);
    var on_finish__75515 = cljs.core.nth.call(null, vec__75512__75513, 1, null);
    return $elem.slideUp(speed__75514, on_finish__75515)
  };
  var slide_up = function($elem, var_args) {
    var p__75511 = null;
    if(goog.isDef(var_args)) {
      p__75511 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__75511)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__75516) {
    var $elem = cljs.core.first(arglist__75516);
    var p__75511 = cljs.core.rest(arglist__75516);
    return slide_up__delegate($elem, p__75511)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__75517) {
    var vec__75518__75519 = p__75517;
    var speed__75520 = cljs.core.nth.call(null, vec__75518__75519, 0, null);
    var on_finish__75521 = cljs.core.nth.call(null, vec__75518__75519, 1, null);
    return $elem.slideDown(speed__75520, on_finish__75521)
  };
  var slide_down = function($elem, var_args) {
    var p__75517 = null;
    if(goog.isDef(var_args)) {
      p__75517 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__75517)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__75522) {
    var $elem = cljs.core.first(arglist__75522);
    var p__75517 = cljs.core.rest(arglist__75522);
    return slide_down__delegate($elem, p__75517)
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
  var closest__delegate = function($elem, selector, p__75523) {
    var vec__75524__75525 = p__75523;
    var context__75526 = cljs.core.nth.call(null, vec__75524__75525, 0, null);
    return $elem.closest(selector, context__75526)
  };
  var closest = function($elem, selector, var_args) {
    var p__75523 = null;
    if(goog.isDef(var_args)) {
      p__75523 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__75523)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__75527) {
    var $elem = cljs.core.first(arglist__75527);
    var selector = cljs.core.first(cljs.core.next(arglist__75527));
    var p__75523 = cljs.core.rest(cljs.core.next(arglist__75527));
    return closest__delegate($elem, selector, p__75523)
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
  var val__delegate = function($elem, p__75528) {
    var vec__75529__75530 = p__75528;
    var v__75531 = cljs.core.nth.call(null, vec__75529__75530, 0, null);
    if(cljs.core.truth_(v__75531)) {
      return $elem.val(v__75531)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__75528 = null;
    if(goog.isDef(var_args)) {
      p__75528 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__75528)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__75532) {
    var $elem = cljs.core.first(arglist__75532);
    var p__75528 = cljs.core.rest(arglist__75532);
    return val__delegate($elem, p__75528)
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
jayq.core.xhr = function xhr(p__75533, content, callback) {
  var vec__75534__75535 = p__75533;
  var method__75536 = cljs.core.nth.call(null, vec__75534__75535, 0, null);
  var uri__75537 = cljs.core.nth.call(null, vec__75534__75535, 1, null);
  var params__75538 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__75536)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__75537, params__75538)
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
  var unbind__delegate = function($elem, ev, p__75539) {
    var vec__75540__75541 = p__75539;
    var func__75542 = cljs.core.nth.call(null, vec__75540__75541, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__75542)
  };
  var unbind = function($elem, ev, var_args) {
    var p__75539 = null;
    if(goog.isDef(var_args)) {
      p__75539 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__75539)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__75543) {
    var $elem = cljs.core.first(arglist__75543);
    var ev = cljs.core.first(cljs.core.next(arglist__75543));
    var p__75539 = cljs.core.rest(cljs.core.next(arglist__75543));
    return unbind__delegate($elem, ev, p__75539)
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
  var on__delegate = function($elem, events, p__75544) {
    var vec__75545__75546 = p__75544;
    var sel__75547 = cljs.core.nth.call(null, vec__75545__75546, 0, null);
    var data__75548 = cljs.core.nth.call(null, vec__75545__75546, 1, null);
    var handler__75549 = cljs.core.nth.call(null, vec__75545__75546, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__75547), data__75548, handler__75549)
  };
  var on = function($elem, events, var_args) {
    var p__75544 = null;
    if(goog.isDef(var_args)) {
      p__75544 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__75544)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__75550) {
    var $elem = cljs.core.first(arglist__75550);
    var events = cljs.core.first(cljs.core.next(arglist__75550));
    var p__75544 = cljs.core.rest(cljs.core.next(arglist__75550));
    return on__delegate($elem, events, p__75544)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__75551) {
    var vec__75552__75553 = p__75551;
    var sel__75554 = cljs.core.nth.call(null, vec__75552__75553, 0, null);
    var data__75555 = cljs.core.nth.call(null, vec__75552__75553, 1, null);
    var handler__75556 = cljs.core.nth.call(null, vec__75552__75553, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__75554), data__75555, handler__75556)
  };
  var one = function($elem, events, var_args) {
    var p__75551 = null;
    if(goog.isDef(var_args)) {
      p__75551 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__75551)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__75557) {
    var $elem = cljs.core.first(arglist__75557);
    var events = cljs.core.first(cljs.core.next(arglist__75557));
    var p__75551 = cljs.core.rest(cljs.core.next(arglist__75557));
    return one__delegate($elem, events, p__75551)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__75558) {
    var vec__75559__75560 = p__75558;
    var sel__75561 = cljs.core.nth.call(null, vec__75559__75560, 0, null);
    var handler__75562 = cljs.core.nth.call(null, vec__75559__75560, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__75561), handler__75562)
  };
  var off = function($elem, events, var_args) {
    var p__75558 = null;
    if(goog.isDef(var_args)) {
      p__75558 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__75558)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__75563) {
    var $elem = cljs.core.first(arglist__75563);
    var events = cljs.core.first(cljs.core.next(arglist__75563));
    var p__75558 = cljs.core.rest(cljs.core.next(arglist__75563));
    return off__delegate($elem, events, p__75558)
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
    var and__3822__auto____75619 = reader;
    if(and__3822__auto____75619) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____75619
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3824__auto____75620 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3824__auto____75620) {
        return or__3824__auto____75620
      }else {
        var or__3824__auto____75621 = cljs.reader.read_char["_"];
        if(or__3824__auto____75621) {
          return or__3824__auto____75621
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____75622 = reader;
    if(and__3822__auto____75622) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____75622
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3824__auto____75623 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3824__auto____75623) {
        return or__3824__auto____75623
      }else {
        var or__3824__auto____75624 = cljs.reader.unread["_"];
        if(or__3824__auto____75624) {
          return or__3824__auto____75624
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
  var this__75625 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__75625.buffer_atom))) {
    var idx__75626 = cljs.core.deref.call(null, this__75625.index_atom);
    cljs.core.swap_BANG_.call(null, this__75625.index_atom, cljs.core.inc);
    return this__75625.s[idx__75626]
  }else {
    var buf__75627 = cljs.core.deref.call(null, this__75625.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__75625.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__75627)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__75628 = this;
  return cljs.core.swap_BANG_.call(null, this__75628.buffer_atom, function(p1__75618_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__75618_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____75629 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3824__auto____75629)) {
    return or__3824__auto____75629
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
  var or__3824__auto____75630 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____75630) {
    return or__3824__auto____75630
  }else {
    var and__3822__auto____75632 = function() {
      var or__3824__auto____75631 = "+" === initch;
      if(or__3824__auto____75631) {
        return or__3824__auto____75631
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____75632)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__75633 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__75633);
        return next_ch__75633
      }())
    }else {
      return and__3822__auto____75632
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
  reader_error.cljs$lang$applyTo = function(arglist__75634) {
    var rdr = cljs.core.first(arglist__75634);
    var msg = cljs.core.rest(arglist__75634);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____75635 = ch != "#";
  if(and__3822__auto____75635) {
    var and__3822__auto____75636 = ch != "'";
    if(and__3822__auto____75636) {
      var and__3822__auto____75637 = ch != ":";
      if(and__3822__auto____75637) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____75637
      }
    }else {
      return and__3822__auto____75636
    }
  }else {
    return and__3822__auto____75635
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__75638 = new goog.string.StringBuffer(initch);
  var ch__75639 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____75640 = ch__75639 == null;
      if(or__3824__auto____75640) {
        return or__3824__auto____75640
      }else {
        var or__3824__auto____75641 = cljs.reader.whitespace_QMARK_.call(null, ch__75639);
        if(or__3824__auto____75641) {
          return or__3824__auto____75641
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__75639)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__75639);
      return sb__75638.toString()
    }else {
      var G__75642 = function() {
        sb__75638.append(ch__75639);
        return sb__75638
      }();
      var G__75643 = cljs.reader.read_char.call(null, rdr);
      sb__75638 = G__75642;
      ch__75639 = G__75643;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__75644 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____75645 = ch__75644 === "n";
      if(or__3824__auto____75645) {
        return or__3824__auto____75645
      }else {
        var or__3824__auto____75646 = ch__75644 === "r";
        if(or__3824__auto____75646) {
          return or__3824__auto____75646
        }else {
          return ch__75644 == null
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
  var matches__75647 = re.exec(s);
  if(matches__75647 != null) {
    if(matches__75647.length === 1) {
      return matches__75647[0]
    }else {
      return matches__75647
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__75648 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__75649 = groups__75648[2];
  if(!function() {
    var or__3824__auto____75650 = group3__75649 == null;
    if(or__3824__auto____75650) {
      return or__3824__auto____75650
    }else {
      return group3__75649.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__75651 = "-" === groups__75648[1] ? -1 : 1;
    var a__75652 = cljs.core.truth_(groups__75648[3]) ? [groups__75648[3], 10] : cljs.core.truth_(groups__75648[4]) ? [groups__75648[4], 16] : cljs.core.truth_(groups__75648[5]) ? [groups__75648[5], 8] : cljs.core.truth_(groups__75648[7]) ? [groups__75648[7], parseInt(groups__75648[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__75653 = a__75652[0];
    var radix__75654 = a__75652[1];
    if(n__75653 == null) {
      return null
    }else {
      return negate__75651 * parseInt(n__75653, radix__75654)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__75655 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__75656 = groups__75655[1];
  var denominator__75657 = groups__75655[2];
  return parseInt(numinator__75656) / parseInt(denominator__75657)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__75658 = re.exec(s);
  if(function() {
    var and__3822__auto____75659 = matches__75658 != null;
    if(and__3822__auto____75659) {
      return matches__75658[0] === s
    }else {
      return and__3822__auto____75659
    }
  }()) {
    if(matches__75658.length === 1) {
      return matches__75658[0]
    }else {
      return matches__75658
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
  var ch__75660 = cljs.reader.read_char.call(null, reader);
  var mapresult__75661 = cljs.reader.escape_char_map.call(null, ch__75660);
  if(cljs.core.truth_(mapresult__75661)) {
    return mapresult__75661
  }else {
    if(function() {
      var or__3824__auto____75662 = "u" === ch__75660;
      if(or__3824__auto____75662) {
        return or__3824__auto____75662
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__75660)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__75660)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__75660)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__75663 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__75663))) {
      var G__75664 = cljs.reader.read_char.call(null, rdr);
      ch__75663 = G__75664;
      continue
    }else {
      return ch__75663
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__75665 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__75666 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__75666)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__75666) {
      return cljs.core.persistent_BANG_.call(null, a__75665)
    }else {
      var temp__3971__auto____75667 = cljs.reader.macros.call(null, ch__75666);
      if(cljs.core.truth_(temp__3971__auto____75667)) {
        var macrofn__75668 = temp__3971__auto____75667;
        var mret__75669 = macrofn__75668.call(null, rdr, ch__75666);
        var G__75671 = mret__75669 === rdr ? a__75665 : cljs.core.conj_BANG_.call(null, a__75665, mret__75669);
        a__75665 = G__75671;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__75666);
        var o__75670 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__75672 = o__75670 === rdr ? a__75665 : cljs.core.conj_BANG_.call(null, a__75665, o__75670);
        a__75665 = G__75672;
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
  var ch__75673 = cljs.reader.read_char.call(null, rdr);
  var dm__75674 = cljs.reader.dispatch_macros.call(null, ch__75673);
  if(cljs.core.truth_(dm__75674)) {
    return dm__75674.call(null, rdr, _)
  }else {
    var temp__3971__auto____75675 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__75673);
    if(cljs.core.truth_(temp__3971__auto____75675)) {
      var obj__75676 = temp__3971__auto____75675;
      return obj__75676
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__75673)
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
  var l__75677 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__75677))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__75677)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__75678 = new goog.string.StringBuffer(initch);
  var ch__75679 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____75680 = ch__75679 == null;
      if(or__3824__auto____75680) {
        return or__3824__auto____75680
      }else {
        var or__3824__auto____75681 = cljs.reader.whitespace_QMARK_.call(null, ch__75679);
        if(or__3824__auto____75681) {
          return or__3824__auto____75681
        }else {
          return cljs.reader.macros.call(null, ch__75679)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__75679);
      var s__75682 = buffer__75678.toString();
      var or__3824__auto____75683 = cljs.reader.match_number.call(null, s__75682);
      if(cljs.core.truth_(or__3824__auto____75683)) {
        return or__3824__auto____75683
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__75682, "]")
      }
    }else {
      var G__75684 = function() {
        buffer__75678.append(ch__75679);
        return buffer__75678
      }();
      var G__75685 = cljs.reader.read_char.call(null, reader);
      buffer__75678 = G__75684;
      ch__75679 = G__75685;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__75686 = new goog.string.StringBuffer;
  var ch__75687 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__75687 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__75687) {
        var G__75688 = function() {
          buffer__75686.append(cljs.reader.escape_char.call(null, buffer__75686, reader));
          return buffer__75686
        }();
        var G__75689 = cljs.reader.read_char.call(null, reader);
        buffer__75686 = G__75688;
        ch__75687 = G__75689;
        continue
      }else {
        if('"' === ch__75687) {
          return buffer__75686.toString()
        }else {
          if("\ufdd0'default") {
            var G__75690 = function() {
              buffer__75686.append(ch__75687);
              return buffer__75686
            }();
            var G__75691 = cljs.reader.read_char.call(null, reader);
            buffer__75686 = G__75690;
            ch__75687 = G__75691;
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
  var token__75692 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__75692, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__75692, 0, token__75692.indexOf("/")), cljs.core.subs.call(null, token__75692, token__75692.indexOf("/") + 1, token__75692.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__75692, cljs.core.symbol.call(null, token__75692))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__75693 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__75694 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__75693);
  var token__75695 = a__75694[0];
  var ns__75696 = a__75694[1];
  var name__75697 = a__75694[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____75699 = function() {
      var and__3822__auto____75698 = !(void 0 === ns__75696);
      if(and__3822__auto____75698) {
        return ns__75696.substring(ns__75696.length - 2, ns__75696.length) === ":/"
      }else {
        return and__3822__auto____75698
      }
    }();
    if(cljs.core.truth_(or__3824__auto____75699)) {
      return or__3824__auto____75699
    }else {
      var or__3824__auto____75700 = name__75697[name__75697.length - 1] === ":";
      if(or__3824__auto____75700) {
        return or__3824__auto____75700
      }else {
        return!(token__75695.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__75695)
  }else {
    if(cljs.core.truth_(ns__75696)) {
      return cljs.core.keyword.call(null, ns__75696.substring(0, ns__75696.indexOf("/")), name__75697)
    }else {
      return cljs.core.keyword.call(null, token__75695)
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
  var m__75701 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__75701)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__75702 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__75703__75704 = o__75702;
    if(G__75703__75704 != null) {
      if(function() {
        var or__3824__auto____75705 = G__75703__75704.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____75705) {
          return or__3824__auto____75705
        }else {
          return G__75703__75704.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__75703__75704.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__75703__75704)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__75703__75704)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__75702, cljs.core.merge.call(null, cljs.core.meta.call(null, o__75702), m__75701))
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
    var ch__75706 = cljs.reader.read_char.call(null, reader);
    if(ch__75706 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__75706)) {
        var G__75709 = reader;
        var G__75710 = eof_is_error;
        var G__75711 = sentinel;
        var G__75712 = is_recursive;
        reader = G__75709;
        eof_is_error = G__75710;
        sentinel = G__75711;
        is_recursive = G__75712;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__75706)) {
          var G__75713 = cljs.reader.read_comment.call(null, reader, ch__75706);
          var G__75714 = eof_is_error;
          var G__75715 = sentinel;
          var G__75716 = is_recursive;
          reader = G__75713;
          eof_is_error = G__75714;
          sentinel = G__75715;
          is_recursive = G__75716;
          continue
        }else {
          if("\ufdd0'else") {
            var f__75707 = cljs.reader.macros.call(null, ch__75706);
            var res__75708 = cljs.core.truth_(f__75707) ? f__75707.call(null, reader, ch__75706) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__75706) ? cljs.reader.read_number.call(null, reader, ch__75706) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__75706) : null;
            if(res__75708 === reader) {
              var G__75717 = reader;
              var G__75718 = eof_is_error;
              var G__75719 = sentinel;
              var G__75720 = is_recursive;
              reader = G__75717;
              eof_is_error = G__75718;
              sentinel = G__75719;
              is_recursive = G__75720;
              continue
            }else {
              return res__75708
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
  var r__75721 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__75721, true, null, false)
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
  var tag__75722 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__75723 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__75724 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__75722));
  if(cljs.core.truth_(pfn__75724)) {
    return pfn__75724.call(null, form__75723)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__75722), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__75725 = cljs.core.name.call(null, tag);
  var old_parser__75726 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__75725);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__75725, f);
  return old_parser__75726
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
        return cljs.core.reduce.call(null, function(m, p__75613) {
          var vec__75614__75615 = p__75613;
          var k__75616 = cljs.core.nth.call(null, vec__75614__75615, 0, null);
          var v__75617 = cljs.core.nth.call(null, vec__75614__75615, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__75616), clj__GT_js.call(null, v__75617))
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
      var vec__75594__75595 = route;
      var m__75596 = cljs.core.nth.call(null, vec__75594__75595, 0, null);
      var u__75597 = cljs.core.nth.call(null, vec__75594__75595, 1, null);
      return cljs.core.PersistentVector.fromArray([fetch.core.__GT_method.call(null, m__75596), u__75597])
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
  var cur__75598 = fetch.util.clj__GT_js.call(null, d);
  var query__75599 = goog.Uri.QueryData.createFromMap.call(null, new goog.structs.Map(cur__75598));
  return[cljs.core.str(query__75599)].join("")
};
fetch.core.__GT_callback = function __GT_callback(callback) {
  if(cljs.core.truth_(callback)) {
    return function(req) {
      var data__75600 = req.getResponseText();
      return callback.call(null, data__75600)
    }
  }else {
    return null
  }
};
fetch.core.xhr = function() {
  var xhr__delegate = function(route, content, callback, p__75601) {
    var vec__75602__75603 = p__75601;
    var opts__75604 = cljs.core.nth.call(null, vec__75602__75603, 0, null);
    var req__75606 = new goog.net.XhrIo;
    var vec__75605__75607 = fetch.core.parse_route.call(null, route);
    var method__75608 = cljs.core.nth.call(null, vec__75605__75607, 0, null);
    var uri__75609 = cljs.core.nth.call(null, vec__75605__75607, 1, null);
    var data__75610 = fetch.core.__GT_data.call(null, content);
    var callback__75611 = fetch.core.__GT_callback.call(null, callback);
    if(cljs.core.truth_(callback__75611)) {
      goog.events.listen.call(null, req__75606, goog.net.EventType.COMPLETE, function() {
        return callback__75611.call(null, req__75606)
      })
    }else {
    }
    return req__75606.send(uri__75609, method__75608, data__75610, cljs.core.truth_(opts__75604) ? fetch.util.clj__GT_js.call(null, opts__75604) : null)
  };
  var xhr = function(route, content, callback, var_args) {
    var p__75601 = null;
    if(goog.isDef(var_args)) {
      p__75601 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return xhr__delegate.call(this, route, content, callback, p__75601)
  };
  xhr.cljs$lang$maxFixedArity = 3;
  xhr.cljs$lang$applyTo = function(arglist__75612) {
    var route = cljs.core.first(arglist__75612);
    var content = cljs.core.first(cljs.core.next(arglist__75612));
    var callback = cljs.core.first(cljs.core.next(cljs.core.next(arglist__75612)));
    var p__75601 = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__75612)));
    return xhr__delegate(route, content, callback, p__75601)
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
    var data__75593 = cljs.core._EQ_.call(null, data, "") ? "nil" : data;
    return callback.call(null, cljs.reader.read_string.call(null, data__75593))
  } : null)
};
goog.provide("webrot.client.main");
goog.require("cljs.core");
goog.require("crate.util");
goog.require("jayq.core");
goog.require("fetch.remotes");
webrot.client.main.$fractal = jayq.core.$.call(null, "\ufdd0'#fractal>a");
webrot.client.main.$img = jayq.core.$.call(null, "\ufdd0'#fractal>a>img");
webrot.client.main.$spinner = jayq.core.$.call(null, "\ufdd0'#spinner");
webrot.client.main.params = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
webrot.client.main.busy = cljs.core.atom.call(null, true);
webrot.client.main.coords_from_event = function coords_from_event(e) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":e.offsetX, "\ufdd0'y":e.offsetY})
};
webrot.client.main.form_params = function form_params() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'lut", "\ufdd0'cut-off"], {"\ufdd0'lut":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #lut :selected")), "\ufdd0'cut-off":jayq.core.val.call(null, jayq.core.$.call(null, "#control-ribbon #cut-off :selected"))})
};
jayq.core.document_ready.call(null, function() {
  jayq.core.bind.call(null, webrot.client.main.$img, "\ufdd0'load", function() {
    cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.not);
    return jayq.core.hide.call(null, webrot.client.main.$spinner)
  });
  return jayq.core.bind.call(null, webrot.client.main.$fractal, "\ufdd0'click", function(e) {
    e.preventDefault();
    if(cljs.core.truth_(cljs.core.compare_and_set_BANG_.call(null, webrot.client.main.busy, false, true))) {
      var me__73058 = this;
      jayq.core.show.call(null, webrot.client.main.$spinner);
      var $me__73059 = jayq.core.$.call(null, me__73058);
      var merged_params__73060 = cljs.core.merge.call(null, cljs.core.deref.call(null, webrot.client.main.params), webrot.client.main.form_params.call(null), webrot.client.main.coords_from_event.call(null, e));
      return fetch.remotes.remote_callback.call(null, "zoom-in", cljs.core.PersistentVector.fromArray([merged_params__73060]), function(result) {
        cljs.core.swap_BANG_.call(null, webrot.client.main.params, cljs.core.merge, result);
        cljs.core.swap_BANG_.call(null, webrot.client.main.busy, cljs.core.identity, true);
        jayq.core.attr.call(null, webrot.client.main.$img, "\ufdd0'src", crate.util.url.call(null, "mandlebrot", result));
        return false
      })
    }else {
      return null
    }
  })
});
