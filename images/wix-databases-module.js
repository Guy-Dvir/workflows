!function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e(require("react"),require("react-dom"),require("business-manager-api"));else if("function"==typeof define&&define.amd)define(["react","react-dom","business-manager-api"],e);else{var n="object"==typeof exports?e(require("react"),require("react-dom"),require("business-manager-api")):e(t.React,t.ReactDOM,t.BusinessManagerAPI);for(var r in n)("object"==typeof exports?exports:t)[r]=n[r]}}(this,function(t,e,n){return function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var n={};return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r})},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=615)}({0:function(e,n){e.exports=t},100:function(t,e,n){var r=n(254),o=n(24),i=Object.prototype,u=i.hasOwnProperty,c=i.propertyIsEnumerable,a=r(function(){return arguments}())?r:function(t){return o(t)&&u.call(t,"callee")&&!c.call(t,"callee")};t.exports=a},101:function(t,e,n){(function(t){var r=n(19),o=n(255),i="object"==typeof e&&e&&!e.nodeType&&e,u=i&&"object"==typeof t&&t&&!t.nodeType&&t,c=u&&u.exports===i,a=c?r.Buffer:void 0,s=a?a.isBuffer:void 0,f=s||o;t.exports=f}).call(e,n(60)(t))},102:function(t,e){function n(t){return"number"==typeof t&&t>-1&&t%1==0&&t<=r}var r=9007199254740991;t.exports=n},128:function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var o=n(54);Object.defineProperty(e,"ModuleRegistry",{enumerable:!0,get:function(){return r(o).default}});var i=n(260);Object.defineProperty(e,"ReactLazyComponent",{enumerable:!0,get:function(){return r(i).default}});var u=n(266);Object.defineProperty(e,"AngularLazyComponent",{enumerable:!0,get:function(){return r(u).default}})},129:function(t,e,n){var r=n(41),o=function(){try{var t=r(Object,"defineProperty");return t({},"",{}),t}catch(t){}}();t.exports=o},13:function(t,e){var n=Array.isArray;t.exports=n},130:function(t,e,n){(function(e){var n="object"==typeof e&&e&&e.Object===Object&&e;t.exports=n}).call(e,n(14))},131:function(t,e,n){function r(t,e){if(o(t))return!1;var n=typeof t;return!("number"!=n&&"symbol"!=n&&"boolean"!=n&&null!=t&&!i(t))||(c.test(t)||!u.test(t)||null!=e&&t in Object(e))}var o=n(13),i=n(48),u=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,c=/^\w*$/;t.exports=r},132:function(t,e,n){function r(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1])}}var o=n(231),i=n(243),u=n(245),c=n(246),a=n(247);r.prototype.clear=o,r.prototype.delete=i,r.prototype.get=u,r.prototype.has=c,r.prototype.set=a,t.exports=r},133:function(t,e,n){var r=n(41),o=n(19),i=r(o,"Map");t.exports=i},134:function(t,e,n){function r(t,e){return t&&o(t,e,i)}var o=n(173),i=n(43);t.exports=r},135:function(t,e,n){var r=n(256),o=n(136),i=n(137),u=i&&i.isTypedArray,c=u?o(u):r;t.exports=c},136:function(t,e){function n(t){return function(e){return t(e)}}t.exports=n},137:function(t,e,n){(function(t){var r=n(130),o="object"==typeof e&&e&&!e.nodeType&&e,i=o&&"object"==typeof t&&t&&!t.nodeType&&t,u=i&&i.exports===o,c=u&&r.process,a=function(){try{var t=i&&i.require&&i.require("util").types;return t||c&&c.binding&&c.binding("util")}catch(t){}}();t.exports=a}).call(e,n(60)(t))},138:function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function i(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function u(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}Object.defineProperty(e,"__esModule",{value:!0});var c=function(){function t(t,e){var n=[],r=!0,o=!1,i=void 0;try{for(var u,c=t[Symbol.iterator]();!(r=(u=c.next()).done)&&(n.push(u.value),!e||n.length!==e);r=!0);}catch(t){o=!0,i=t}finally{try{!r&&c.return&&c.return()}finally{if(o)throw i}}return n}return function(e,n){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return t(e,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),a=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),s=n(0),f=r(s),l=n(54),p=r(l),d=n(261),y=n(262),v=r(y),h=function(t){function e(t,n){o(this,e);var r=i(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t));return r.manifest=n,r}return u(e,t),a(e,[{key:"componentWillMount",value:function(){var t=this;p.default.notifyListeners("reactModuleContainer.componentStartLoading",this.manifest.component);var e=this.manifest.prepare?function(){return t.manifest.prepare()}:function(){},n=(0,d.filesAppender)(this.manifest.files,this.manifest.crossorigin).then(e,function(t){return console.error(t)}),r=this.manifest.resolve?this.manifest.resolve():Promise.resolve({});this.resourceLoader=Promise.all([r,n]).then(function(e){var n=c(e,1),r=n[0];t.resolvedData=r,p.default.notifyListeners("reactModuleContainer.componentReady",t.manifest.component)}).catch(function(t){return console.error(t)})}},{key:"componentWillUnmount",value:function(){!1!==this.manifest.unloadStylesOnDestroy&&(0,d.unloadStyles)(document,this.manifest.files),p.default.notifyListeners("reactModuleContainer.componentWillUnmount",this.manifest.component)}},{key:"mergedProps",get:function(){return(0,v.default)({},this.props,this.resolvedData)}}]),e}(f.default.Component);e.default=h},139:function(t,e){function n(t,e,n){switch(n.length){case 0:return t.call(e);case 1:return t.call(e,n[0]);case 2:return t.call(e,n[0],n[1]);case 3:return t.call(e,n[0],n[1],n[2])}return t.apply(e,n)}t.exports=n},14:function(t,e){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(n=window)}t.exports=n},140:function(t,e,n){var r=n(264),o=n(180),i=o(r);t.exports=i},141:function(t,e,n){"use strict";t.exports.MODULE_ID="WIX_DATABASES",t.exports.PAGE_COMPONENT="wix-databases-page-component",t.exports.LAZY_PAGE_COMPONENT="wix-databases-lazy-page-component"},15:function(t,n){t.exports=e},166:function(t,e,n){function r(t,e,n){return null==t?t:o(t,e,n)}var o=n(167);t.exports=r},167:function(t,e,n){function r(t,e,n,r){if(!c(t))return t;e=i(e,t);for(var s=-1,f=e.length,l=f-1,p=t;null!=p&&++s<f;){var d=a(e[s]),y=n;if(s!=l){var v=p[d];y=r?r(v,d,p):void 0,void 0===y&&(y=c(v)?v:u(e[s+1])?[]:{})}o(p,d,y),p=p[d]}return t}var o=n(69),i=n(47),u=n(59),c=n(23),a=n(42);t.exports=r},168:function(t,e){function n(t){if(null!=t){try{return o.call(t)}catch(t){}try{return t+""}catch(t){}}return""}var r=Function.prototype,o=r.toString;t.exports=n},169:function(t,e,n){var r=n(229),o=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,i=/\\(\\)?/g,u=r(function(t){var e=[];return 46===t.charCodeAt(0)&&e.push(""),t.replace(o,function(t,n,r,o){e.push(r?o.replace(i,"$1"):n||t)}),e});t.exports=u},170:function(t,e,n){function r(t){if("string"==typeof t)return t;if(u(t))return i(t,r)+"";if(c(t))return f?f.call(t):"";var e=t+"";return"0"==e&&1/t==-a?"-0":e}var o=n(46),i=n(84),u=n(13),c=n(48),a=1/0,s=o?o.prototype:void 0,f=s?s.toString:void 0;t.exports=r},171:function(t,e,n){function r(t,e){return null==t||o(t,e)}var o=n(172);t.exports=r},172:function(t,e,n){function r(t,e){return e=o(e,t),null==(t=u(t,e))||delete t[c(i(e))]}var o=n(47),i=n(248),u=n(249),c=n(42);t.exports=r},173:function(t,e,n){var r=n(252),o=r();t.exports=o},174:function(t,e,n){function r(t,e){var n=u(t),r=!n&&i(t),f=!n&&!r&&c(t),p=!n&&!r&&!f&&s(t),d=n||r||f||p,y=d?o(t.length,String):[],v=y.length;for(var h in t)!e&&!l.call(t,h)||d&&("length"==h||f&&("offset"==h||"parent"==h)||p&&("buffer"==h||"byteLength"==h||"byteOffset"==h)||a(h,v))||y.push(h);return y}var o=n(253),i=n(100),u=n(13),c=n(101),a=n(59),s=n(135),f=Object.prototype,l=f.hasOwnProperty;t.exports=r},175:function(t,e,n){function r(t){if(!o(t))return i(t);var e=[];for(var n in Object(t))c.call(t,n)&&"constructor"!=n&&e.push(n);return e}var o=n(85),i=n(257),u=Object.prototype,c=u.hasOwnProperty;t.exports=r},176:function(t,e){function n(t,e){return function(n){return t(e(n))}}t.exports=n},177:function(t,e,n){function r(t){var e=++i;return o(t)+e}var o=n(97),i=0;t.exports=r},178:function(t,e,n){function r(t){return o(function(e,n){var r=-1,o=n.length,u=o>1?n[o-1]:void 0,c=o>2?n[2]:void 0;for(u=t.length>3&&"function"==typeof u?(o--,u):void 0,c&&i(n[0],n[1],c)&&(u=o<3?void 0:u,o=1),e=Object(e);++r<o;){var a=n[r];a&&t(e,a,r,u)}return e})}var o=n(263),i=n(181);t.exports=r},179:function(t,e,n){function r(t,e,n){return e=i(void 0===e?t.length-1:e,0),function(){for(var r=arguments,u=-1,c=i(r.length-e,0),a=Array(c);++u<c;)a[u]=r[e+u];u=-1;for(var s=Array(e+1);++u<e;)s[u]=r[u];return s[e]=n(a),o(t,this,s)}}var o=n(139),i=Math.max;t.exports=r},180:function(t,e){function n(t){var e=0,n=0;return function(){var u=i(),c=o-(u-n);if(n=u,c>0){if(++e>=r)return arguments[0]}else e=0;return t.apply(void 0,arguments)}}var r=800,o=16,i=Date.now;t.exports=n},181:function(t,e,n){function r(t,e,n){if(!c(n))return!1;var r=typeof e;return!!("number"==r?i(n)&&u(e,n.length):"string"==r&&e in n)&&o(n[e],t)}var o=n(55),i=n(33),u=n(59),c=n(23);t.exports=r},19:function(t,e,n){var r=n(130),o="object"==typeof self&&self&&self.Object===Object&&self,i=r||o||Function("return this")();t.exports=i},2:function(t,e,n){t.exports=n(267)()},223:function(t,e,n){function r(t){return!(!u(t)||i(t))&&(o(t)?y:s).test(c(t))}var o=n(83),i=n(226),u=n(23),c=n(168),a=/[\\^$.*+?()[\]{}|]/g,s=/^\[object .+?Constructor\]$/,f=Function.prototype,l=Object.prototype,p=f.toString,d=l.hasOwnProperty,y=RegExp("^"+p.call(d).replace(a,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");t.exports=r},224:function(t,e,n){function r(t){var e=u.call(t,a),n=t[a];try{t[a]=void 0;var r=!0}catch(t){}var o=c.call(t);return r&&(e?t[a]=n:delete t[a]),o}var o=n(46),i=Object.prototype,u=i.hasOwnProperty,c=i.toString,a=o?o.toStringTag:void 0;t.exports=r},225:function(t,e){function n(t){return o.call(t)}var r=Object.prototype,o=r.toString;t.exports=n},226:function(t,e,n){function r(t){return!!i&&i in t}var o=n(227),i=function(){var t=/[^.]+$/.exec(o&&o.keys&&o.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}();t.exports=r},227:function(t,e,n){var r=n(19),o=r["__core-js_shared__"];t.exports=o},228:function(t,e){function n(t,e){return null==t?void 0:t[e]}t.exports=n},229:function(t,e,n){function r(t){var e=o(t,function(t){return n.size===i&&n.clear(),t}),n=e.cache;return e}var o=n(230),i=500;t.exports=r},23:function(t,e){function n(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}t.exports=n},230:function(t,e,n){function r(t,e){if("function"!=typeof t||null!=e&&"function"!=typeof e)throw new TypeError(i);var n=function(){var r=arguments,o=e?e.apply(this,r):r[0],i=n.cache;if(i.has(o))return i.get(o);var u=t.apply(this,r);return n.cache=i.set(o,u)||i,u};return n.cache=new(r.Cache||o),n}var o=n(132),i="Expected a function";r.Cache=o,t.exports=r},231:function(t,e,n){function r(){this.size=0,this.__data__={hash:new o,map:new(u||i),string:new o}}var o=n(232),i=n(96),u=n(133);t.exports=r},232:function(t,e,n){function r(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1])}}var o=n(233),i=n(234),u=n(235),c=n(236),a=n(237);r.prototype.clear=o,r.prototype.delete=i,r.prototype.get=u,r.prototype.has=c,r.prototype.set=a,t.exports=r},233:function(t,e,n){function r(){this.__data__=o?o(null):{},this.size=0}var o=n(56);t.exports=r},234:function(t,e){function n(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e}t.exports=n},235:function(t,e,n){function r(t){var e=this.__data__;if(o){var n=e[t];return n===i?void 0:n}return c.call(e,t)?e[t]:void 0}var o=n(56),i="__lodash_hash_undefined__",u=Object.prototype,c=u.hasOwnProperty;t.exports=r},236:function(t,e,n){function r(t){var e=this.__data__;return o?void 0!==e[t]:u.call(e,t)}var o=n(56),i=Object.prototype,u=i.hasOwnProperty;t.exports=r},237:function(t,e,n){function r(t,e){var n=this.__data__;return this.size+=this.has(t)?0:1,n[t]=o&&void 0===e?i:e,this}var o=n(56),i="__lodash_hash_undefined__";t.exports=r},238:function(t,e){function n(){this.__data__=[],this.size=0}t.exports=n},239:function(t,e,n){function r(t){var e=this.__data__,n=o(e,t);return!(n<0)&&(n==e.length-1?e.pop():u.call(e,n,1),--this.size,!0)}var o=n(57),i=Array.prototype,u=i.splice;t.exports=r},24:function(t,e){function n(t){return null!=t&&"object"==typeof t}t.exports=n},240:function(t,e,n){function r(t){var e=this.__data__,n=o(e,t);return n<0?void 0:e[n][1]}var o=n(57);t.exports=r},241:function(t,e,n){function r(t){return o(this.__data__,t)>-1}var o=n(57);t.exports=r},242:function(t,e,n){function r(t,e){var n=this.__data__,r=o(n,t);return r<0?(++this.size,n.push([t,e])):n[r][1]=e,this}var o=n(57);t.exports=r},243:function(t,e,n){function r(t){var e=o(this,t).delete(t);return this.size-=e?1:0,e}var o=n(58);t.exports=r},244:function(t,e){function n(t){var e=typeof t;return"string"==e||"number"==e||"symbol"==e||"boolean"==e?"__proto__"!==t:null===t}t.exports=n},245:function(t,e,n){function r(t){return o(this,t).get(t)}var o=n(58);t.exports=r},246:function(t,e,n){function r(t){return o(this,t).has(t)}var o=n(58);t.exports=r},247:function(t,e,n){function r(t,e){var n=o(this,t),r=n.size;return n.set(t,e),this.size+=n.size==r?0:1,this}var o=n(58);t.exports=r},248:function(t,e){function n(t){var e=null==t?0:t.length;return e?t[e-1]:void 0}t.exports=n},249:function(t,e,n){function r(t,e){return e.length<2?t:o(t,i(e,0,-1))}var o=n(98),i=n(250);t.exports=r},250:function(t,e){function n(t,e,n){var r=-1,o=t.length;e<0&&(e=-e>o?0:o+e),n=n>o?o:n,n<0&&(n+=o),o=e>n?0:n-e>>>0,e>>>=0;for(var i=Array(o);++r<o;)i[r]=t[r+e];return i}t.exports=n},251:function(t,e,n){function r(t,e){return(c(t)?o:i)(t,u(e))}var o=n(99),i=n(71),u=n(259),c=n(13);t.exports=r},252:function(t,e){function n(t){return function(e,n,r){for(var o=-1,i=Object(e),u=r(e),c=u.length;c--;){var a=u[t?c:++o];if(!1===n(i[a],a,i))break}return e}}t.exports=n},253:function(t,e){function n(t,e){for(var n=-1,r=Array(t);++n<t;)r[n]=e(n);return r}t.exports=n},254:function(t,e,n){function r(t){return i(t)&&o(t)==u}var o=n(36),i=n(24),u="[object Arguments]";t.exports=r},255:function(t,e){function n(){return!1}t.exports=n},256:function(t,e,n){function r(t){return u(t)&&i(t.length)&&!!c[o(t)]}var o=n(36),i=n(102),u=n(24),c={};c["[object Float32Array]"]=c["[object Float64Array]"]=c["[object Int8Array]"]=c["[object Int16Array]"]=c["[object Int32Array]"]=c["[object Uint8Array]"]=c["[object Uint8ClampedArray]"]=c["[object Uint16Array]"]=c["[object Uint32Array]"]=!0,c["[object Arguments]"]=c["[object Array]"]=c["[object ArrayBuffer]"]=c["[object Boolean]"]=c["[object DataView]"]=c["[object Date]"]=c["[object Error]"]=c["[object Function]"]=c["[object Map]"]=c["[object Number]"]=c["[object Object]"]=c["[object RegExp]"]=c["[object Set]"]=c["[object String]"]=c["[object WeakMap]"]=!1,t.exports=r},257:function(t,e,n){var r=n(176),o=r(Object.keys,Object);t.exports=o},258:function(t,e,n){function r(t,e){return function(n,r){if(null==n)return n;if(!o(n))return t(n,r);for(var i=n.length,u=e?i:-1,c=Object(n);(e?u--:++u<i)&&!1!==r(c[u],u,c););return n}}var o=n(33);t.exports=r},259:function(t,e,n){function r(t){return"function"==typeof t?t:o}var o=n(61);t.exports=r},260:function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function i(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function u(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}Object.defineProperty(e,"__esModule",{value:!0});var c=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),a=n(0),s=r(a),f=n(54),l=r(f),p=n(138),d=r(p),y=function(t){function e(t,n){o(this,e);var r=i(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,n));return r.state={component:null},r}return u(e,t),c(e,[{key:"componentDidMount",value:function(){var t=this;this.resourceLoader.then(function(){var e=l.default.component(t.manifest.component);t.setState({component:e})})}},{key:"render",value:function(){return this.state.component?s.default.createElement(this.state.component,this.mergedProps):null}}]),e}(d.default);e.default=y},261:function(t,e,n){"use strict";function r(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return Array.from(t)}function i(t){return t.replace(/^.*:\/\//,"//")}function u(t){var e=document.createElement("LINK");return e.setAttribute("rel","stylesheet"),e.setAttribute("type","text/css"),e.setAttribute("href",t),e}function c(t,e){var n=document.createElement("SCRIPT");return n.setAttribute("type","text/javascript"),n.setAttribute("src",t),e&&n.setAttribute("crossorigin","anonymous"),n}function a(t,e,n){var r=document.styleSheets;return d[t]=new Promise(function(o,a){if(window.requirejs&&"js"===e)return void window.requirejs([t],o,a);var s="css"===e?u(t):c(t,n),f=!1;if(document.getElementsByTagName("head")[0].appendChild(s),s.onerror=function(){s.onerror=s.onload=s.onreadystatechange=null,delete d[t],a()},s.onload=s.onreadystatechange=function(){f||this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||(f=!0,s.onerror=s.onload=s.onreadystatechange=null,o())},"css"===e&&navigator.userAgent.match(" Safari/")&&!navigator.userAgent.match(" Chrom")&&navigator.userAgent.match(" Version/5."))var l=20,p=setInterval(function(){for(var e=0;e<r.length;e++)if(i(""+r[e].href)===i(t))return clearInterval(p),void s.onload();0==--l&&(clearInterval(p),s.onerror())},50)})}function s(t,e){return a(t,t.split(".").pop(),e)}function f(t,e){return Promise.all(t.map(function(t){return Array.isArray(t)?t.reduce(function(t,n){return t.then(function(){return s(n,e)},function(t){return console.log(t)})},Promise.resolve()):s(t,e)}))}function l(t,e){var n=y(t);v(e).forEach(function(t){var e=n[t];e&&e.parentNode.removeChild(e)})}Object.defineProperty(e,"__esModule",{value:!0});var p=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t};e.createLinkElement=u,e.createScriptElement=c,e.tagAppender=a,e.filesAppender=f,e.unloadStyles=l;var d={},y=function(t){return[].concat(o(t.querySelectorAll("link"))).filter(function(t){return"stylesheet"===t.rel&&t.href}).reduceRight(function(t,e){return p({},t,r({},i(e.href),e))},{})},v=function(t){var e;return(e=[]).concat.apply(e,o(t)).filter(function(t){return t.endsWith(".css")}).map(function(t){return i(t)})}},262:function(t,e,n){var r=n(69),o=n(62),i=n(178),u=n(33),c=n(85),a=n(43),s=Object.prototype,f=s.hasOwnProperty,l=i(function(t,e){if(c(e)||u(e))return void o(e,a(e),t);for(var n in e)f.call(e,n)&&r(t,n,e[n])});t.exports=l},263:function(t,e,n){function r(t,e){return u(i(t,e,o),t+"")}var o=n(61),i=n(179),u=n(140);t.exports=r},264:function(t,e,n){var r=n(265),o=n(129),i=n(61),u=o?function(t,e){return o(t,"toString",{configurable:!0,enumerable:!1,value:r(e),writable:!0})}:i;t.exports=u},265:function(t,e){function n(t){return function(){return t}}t.exports=n},266:function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function i(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function u(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}Object.defineProperty(e,"__esModule",{value:!0});var c=function t(e,n,r){null===e&&(e=Function.prototype);var o=Object.getOwnPropertyDescriptor(e,n);if(void 0===o){var i=Object.getPrototypeOf(e);return null===i?void 0:t(i,n,r)}if("value"in o)return o.value;var u=o.get;if(void 0!==u)return u.call(r)},a=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),s=n(0),f=r(s),l=n(2),p=r(l),d=n(15),y=n(54),v=r(y),h=n(138),b=r(h),m=function(t){function e(){return o(this,e),i(this,(e.__proto__||Object.getPrototypeOf(e)).apply(this,arguments))}return u(e,t),a(e,[{key:"getChildContext",value:function(){return{router:this.props.router}}},{key:"render",value:function(){return this.props.children}}]),e}(f.default.Component);m.childContextTypes={router:p.default.any},m.propTypes={router:p.default.any,children:p.default.any};var g=function(t){function e(){return o(this,e),i(this,(e.__proto__||Object.getPrototypeOf(e)).apply(this,arguments))}return u(e,t),a(e,[{key:"componentDidMount",value:function(){var t=this;this.mounted=!0,this.resourceLoader.then(function(){if(t.mounted){var e="<"+t.manifest.component+"></"+t.manifest.component+">";t.$injector=angular.bootstrap(e,[t.manifest.module,["$provide","$compileProvider",function(e,n){e.factory("props",function(){return function(){return t.mergedProps}}),n.directive("moduleRegistry",function(){return{scope:{component:"@",props:"<"},controller:["$scope","$element",function(e,n){var r=v.default.component(e.component);e.$watch(function(){return e.props},function(){(0,d.render)(f.default.createElement(m,{router:t.props.router},f.default.createElement(r,e.props)),n[0])},!0),e.$on("$destroy",function(){return(0,d.unmountComponentAtNode)(n[0])}),n.on("click",function(t){return t.preventDefault=function(){return delete t.preventDefault}})}]}}),n.directive("routerLink",function(){return{transclude:!0,scope:{to:"@"},template:'<a ng-href="{{to}}" ng-click="handleClick($event)"><ng-transclude></ng-transclude></a>',controller:["$scope",function(e){e.handleClick=function(n){n.ctrlKey||n.metaKey||n.shiftKey||2===n.which||2===n.button||(t.props.router.push(e.to),n.preventDefault())}}]}})}]]),t.node.appendChild(t.$injector.get("$rootElement")[0])}})}},{key:"componentWillUnmount",value:function(){this.mounted=!1,this.$injector&&(this.$injector.get("$rootScope").$destroy(),this.$injector=null),c(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"componentWillUnmount",this).call(this)}},{key:"componentDidUpdate",value:function(){this.$injector&&!this.$injector.get("$rootScope").$$phase&&this.$injector.get("$rootScope").$digest()}},{key:"render",value:function(){var t=this;return f.default.createElement("div",{ref:function(e){return t.node=e}})}}]),e}(b.default);g.propTypes={router:p.default.any},e.default=g},267:function(t,e,n){"use strict";function r(){}var o=n(268);t.exports=function(){function t(t,e,n,r,i,u){if(u!==o){var c=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw c.name="Invariant Violation",c}}function e(){return t}t.isRequired=t;var n={array:t,bool:t,func:t,number:t,object:t,string:t,symbol:t,any:t,arrayOf:e,element:t,instanceOf:e,node:t,objectOf:e,oneOf:e,oneOfType:e,shape:e,exact:e};return n.checkPropTypes=r,n.PropTypes=n,n}},268:function(t,e,n){"use strict";t.exports="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"},33:function(t,e,n){function r(t){return null!=t&&i(t.length)&&!o(t)}var o=n(83),i=n(102);t.exports=r},36:function(t,e,n){function r(t){return null==t?void 0===t?a:c:s&&s in Object(t)?i(t):u(t)}var o=n(46),i=n(224),u=n(225),c="[object Null]",a="[object Undefined]",s=o?o.toStringTag:void 0;t.exports=r},41:function(t,e,n){function r(t,e){var n=i(t,e);return o(n)?n:void 0}var o=n(223),i=n(228);t.exports=r},42:function(t,e,n){function r(t){if("string"==typeof t||o(t))return t;var e=t+"";return"0"==e&&1/t==-i?"-0":e}var o=n(48),i=1/0;t.exports=r},43:function(t,e,n){function r(t){return u(t)?o(t):i(t)}var o=n(174),i=n(175),u=n(33);t.exports=r},46:function(t,e,n){var r=n(19),o=r.Symbol;t.exports=o},47:function(t,e,n){function r(t,e){return o(t)?t:i(t,e)?[t]:u(c(t))}var o=n(13),i=n(131),u=n(169),c=n(97);t.exports=r},48:function(t,e,n){function r(t){return"symbol"==typeof t||i(t)&&o(t)==u}var o=n(36),i=n(24),u="[object Symbol]";t.exports=r},54:function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return Array.from(t)}function i(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function u(t,e){try{t.apply(void 0,o(e))}catch(t){console.error(t)}}Object.defineProperty(e,"__esModule",{value:!0});var c=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),a=n(166),s=r(a),f=n(171),l=r(f),p=n(251),d=r(p),y=n(177),v=r(y),h=function(){function t(){i(this,t),this.registeredComponents={},this.registeredMethods={},this.eventListeners={},this.modules={}}return c(t,[{key:"cleanAll",value:function(){this.registeredComponents={},this.registeredMethods={},this.eventListeners={},this.modules={}}},{key:"registerModule",value:function(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[];if(this.modules[t])throw new Error('A module with id "'+t+'" is already registered');this.modules[t]=new(Function.prototype.bind.apply(e,[null].concat(o(n))))}},{key:"getModule",value:function(t){return this.modules[t]}},{key:"getAllModules",value:function(){var t=this;return Object.keys(this.modules).map(function(e){return t.modules[e]})}},{key:"registerComponent",value:function(t,e){this.registeredComponents[t]=e}},{key:"component",value:function(t){var e=this.registeredComponents[t];return e?e():void console.error("ModuleRegistry.component "+t+" used but not yet registered")}},{key:"addListener",value:function(t,e){var n=this,r=(0,v.default)("eventListener");return(0,s.default)(this.eventListeners,[t,r],e),{remove:function(){return(0,l.default)(n.eventListeners[t],r)}}}},{key:"notifyListeners",value:function(t){for(var e=arguments.length,n=Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];var o=this.eventListeners[t];o&&(0,d.default)(o,function(t){return u(t,n)})}},{key:"registerMethod",value:function(t,e){this.registeredMethods[t]=e}},{key:"invoke",value:function(t){var e=this.registeredMethods[t];if(!e)return void console.error("ModuleRegistry.invoke "+t+" used but not yet registered");for(var n=e(),r=arguments.length,o=Array(r>1?r-1:0),i=1;i<r;i++)o[i-1]=arguments[i];return n.apply(void 0,o)}}]),t}(),b=void 0;"undefined"!=typeof window?(b=window.ModuleRegistry||new h,window.ModuleRegistry=b):b=new h,e.default=b},55:function(t,e){function n(t,e){return t===e||t!==t&&e!==e}t.exports=n},56:function(t,e,n){var r=n(41),o=r(Object,"create");t.exports=o},57:function(t,e,n){function r(t,e){for(var n=t.length;n--;)if(o(t[n][0],e))return n;return-1}var o=n(55);t.exports=r},58:function(t,e,n){function r(t,e){var n=t.__data__;return o(e)?n["string"==typeof e?"string":"hash"]:n.map}var o=n(244);t.exports=r},59:function(t,e){function n(t,e){var n=typeof t;return!!(e=null==e?r:e)&&("number"==n||"symbol"!=n&&o.test(t))&&t>-1&&t%1==0&&t<e}var r=9007199254740991,o=/^(?:0|[1-9]\d*)$/;t.exports=n},60:function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},61:function(t,e){function n(t){return t}t.exports=n},615:function(t,e,n){"use strict";function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function o(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function i(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}var u=n(128),c=u.ModuleRegistry,a=n(616),s=a.BusinessManagerModule,f=a.registerModule,l=n(617),p=l.WixDatabasesLazyPageComponent,d=n(141),y=d.LAZY_PAGE_COMPONENT;f(d.MODULE_ID,function(t){function e(t){r(this,e);var n=o(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t));return c.registerComponent(y,function(){return p}),n}return i(e,t),e}(s))},616:function(t,e){t.exports=n},617:function(t,e,n){"use strict";function r(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return Array.from(t)}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function i(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function u(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}Object.defineProperty(e,"__esModule",{value:!0}),n(0);var c=n(128),a=c.ReactLazyComponent,s=n(141),f=s.PAGE_COMPONENT,l=n(618);e.WixDatabasesLazyPageComponent=function(t){function e(t){return o(this,e),i(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,{files:[[].concat(r(l),[t.config.topology.wixDatabasesStaticsUrl+"statics/"+f+".js"]),t.config.topology.wixDatabasesStaticsUrl+"statics/"+f+".css"],component:f}))}return u(e,t),e}(a)},618:function(t,e,n){"use strict";t.exports=["https://static.parastorage.com/unpkg/ag-grid-enterprise@16.0.1/dist/ag-grid-enterprise.min.noStyle.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/lib/codemirror.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/mode/xml/xml.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/mode/javascript/javascript.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/addon/lint/lint.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/addon/fold/foldcode.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/addon/fold/foldgutter.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/addon/fold/brace-fold.js","https://static.parastorage.com/unpkg/codemirror@5.30.0/addon/edit/matchbrackets.js"]},62:function(t,e,n){function r(t,e,n,r){var u=!n;n||(n={});for(var c=-1,a=e.length;++c<a;){var s=e[c],f=r?r(n[s],t[s],s,n,t):void 0;void 0===f&&(f=t[s]),u?i(n,s,f):o(n,s,f)}return n}var o=n(69),i=n(70);t.exports=r},69:function(t,e,n){function r(t,e,n){var r=t[e];c.call(t,e)&&i(r,n)&&(void 0!==n||e in t)||o(t,e,n)}var o=n(70),i=n(55),u=Object.prototype,c=u.hasOwnProperty;t.exports=r},70:function(t,e,n){function r(t,e,n){"__proto__"==e&&o?o(t,e,{configurable:!0,enumerable:!0,value:n,writable:!0}):t[e]=n}var o=n(129);t.exports=r},71:function(t,e,n){var r=n(134),o=n(258),i=o(r);t.exports=i},83:function(t,e,n){function r(t){if(!i(t))return!1;var e=o(t);return e==c||e==a||e==u||e==s}var o=n(36),i=n(23),u="[object AsyncFunction]",c="[object Function]",a="[object GeneratorFunction]",s="[object Proxy]";t.exports=r},84:function(t,e){function n(t,e){for(var n=-1,r=null==t?0:t.length,o=Array(r);++n<r;)o[n]=e(t[n],n,t);return o}t.exports=n},85:function(t,e){function n(t){var e=t&&t.constructor;return t===("function"==typeof e&&e.prototype||r)}var r=Object.prototype;t.exports=n},96:function(t,e,n){function r(t){var e=-1,n=null==t?0:t.length;for(this.clear();++e<n;){var r=t[e];this.set(r[0],r[1])}}var o=n(238),i=n(239),u=n(240),c=n(241),a=n(242);r.prototype.clear=o,r.prototype.delete=i,r.prototype.get=u,r.prototype.has=c,r.prototype.set=a,t.exports=r},97:function(t,e,n){function r(t){return null==t?"":o(t)}var o=n(170);t.exports=r},98:function(t,e,n){function r(t,e){e=o(e,t);for(var n=0,r=e.length;null!=t&&n<r;)t=t[i(e[n++])];return n&&n==r?t:void 0}var o=n(47),i=n(42);t.exports=r},99:function(t,e){function n(t,e){for(var n=-1,r=null==t?0:t.length;++n<r&&!1!==e(t[n],n,t););return t}t.exports=n}})});
//# sourceMappingURL=wix-databases-module.js.map