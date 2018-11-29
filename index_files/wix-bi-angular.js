"use strict";

angular.module("wix.common.bi", []).factory("Logger", function() {
    return W.BI.Logger;
}).factory("DomEventHandler", function() {
    return W.BI.DomEventHandler;
}).run([ "biBrowsingSession", function(biBrowsingSession) {
    biBrowsingSession.track();
} ]);

"use strict";

var W = W || {};

W.BI = W.BI || {};

W.BI.ErrorSeverity = {
    RECOVERABLE: 10,
    WARNING: 20,
    ERROR: 30,
    FATAL: 40
};

W.BI.Categories = {
    EDITOR: 1,
    VIEWER: 2,
    TIMEOUTS: 3,
    SERVER: 4
};

W.BI.initialLoadIsReported = false;

W.BI.Logger = function() {
    function now() {
        return new Date().getTime();
    }
    function cacheKiller() {
        return "" + now() + cacheKillerCounter++;
    }
    function performanceInMs() {
        var res = window.performance && window.performance.now ? window.performance.now() : -1;
        return Math.round(res);
    }
    var cacheKillerCounter = 0;
    var startTime = now();
    var defaultEventArgs = {
        _: cacheKiller,
        ms: performanceInMs
    };
    var defaultErrorArgs = {
        _: cacheKiller,
        ts: function() {
            return now() - startTime;
        },
        cat: W.BI.Categories.VIEWER,
        sev: W.BI.ErrorSeverity.WARNING,
        iss: 1,
        ver: "1"
    };
    var _initOptions = {
        hostName: "frog.wix.com",
        defaultEventArgs: {},
        defaultErrorArgs: {},
        biUrl: "//frog.wix.com/",
        schemaValidators: [],
        adapter: "",
        error: function(str) {
            throw str;
        }
    };
    var EVENT_IDS = {
        ERROR: 10,
        ON_READY: 302,
        ROUTE_CHANGE: 300
    };
    function _extend(dst) {
        for (var i = 1; i < arguments.length; i++) {
            var extending = arguments[i];
            if (extending) {
                for (var key in extending) {
                    dst[key] = extending[key];
                }
            }
        }
        return dst;
    }
    function biLogger(args) {
        var _lastBiUrl = {
            url: undefined,
            assertEmpty: function() {
                if (this.url !== undefined) {
                    throw "last bi is not empty!!!";
                }
            },
            resolve: function() {
                this.callback();
            },
            clear: function() {
                this.url = undefined;
            }
        };
        var _options;
        var fieldParsers = new W.BI.FieldParsers(args.injector);
        if (args.hostName) {
            args.biUrl = "//" + args.hostName + "/";
        }
        _options = _extend({}, _initOptions, args);
        function _log(eventArgs, callback) {
            var _biFieldsRestrictions = {
                src: {
                    type: "number"
                },
                evid: {
                    type: "number"
                }
            };
            var eventParams = _extend({}, defaultEventArgs, _options.defaultEventArgs, eventArgs);
            var schemaValidators = _options.schemaValidators || [];
            var validatorsResult = schemaValidators.length > 0 ? schemaValidators.some(function(validator) {
                return validator.match(eventParams) && (validator.execute(eventParams) || true);
            }) : true;
            if (!validatorsResult) {
                throw new Error("No validator accepted the event");
            }
            if (_validateBiEventArgs(eventParams, [ "evid" ], _biFieldsRestrictions)) {
                _sendBiEvent(eventParams, callback);
            }
        }
        function _error(errorArgs, callback) {
            var _requiredErrorFields = [ "evid", "cat", "iss", "sev", "errc", "ver" ];
            var _errorFieldsRestrictions = {
                src: {
                    type: "number"
                },
                evid: {
                    type: "number",
                    values: [ EVENT_IDS.ERROR ]
                },
                cat: {
                    type: "number",
                    values: [ W.BI.Categories.EDITOR, W.BI.Categories.VIEWER, W.BI.Categories.TIMEOUTS, W.BI.Categories.SERVER ]
                },
                iss: {
                    type: "number"
                },
                sev: {
                    type: "number",
                    values: [ W.BI.ErrorSeverity.RECOVERABLE, W.BI.ErrorSeverity.WARNING, W.BI.ErrorSeverity.ERROR, W.BI.ErrorSeverity.FATAL ]
                },
                errc: {
                    type: "number"
                },
                httpc: {
                    type: "number"
                },
                ver: {
                    type: "string",
                    maxLength: 16
                },
                errscp: {
                    type: "string",
                    subStr: 64
                },
                trgt: {
                    type: "string",
                    subStr: 64
                },
                gsi: {
                    type: "string",
                    length: 36
                },
                ts: {
                    type: "number"
                },
                uid: {
                    type: "number"
                },
                ut: {
                    type: "string",
                    maxLength: 16
                },
                did: {
                    type: "string",
                    maxLength: 36
                },
                cid: {
                    type: "string",
                    length: 36
                },
                lng: {
                    type: "string",
                    maxLength: 5
                },
                dsc: {
                    type: "string",
                    subStr: 512
                }
            };
            var errorParams = _extend({}, defaultErrorArgs, _options.defaultErrorArgs, errorArgs, {
                evid: EVENT_IDS.ERROR
            });
            if (_validateBiEventArgs(errorParams, _requiredErrorFields, _errorFieldsRestrictions)) {
                _sendBiEvent(errorParams, callback);
            }
        }
        function _reportOnReady(viewName, eventArgs, callback) {
            var _onReadyFieldsRestrictions = {
                view: {
                    type: "string"
                }
            };
            var eventParams = _extend({}, eventArgs, {
                evid: EVENT_IDS.ON_READY,
                view: viewName
            });
            if (_validateBiEventArgs(eventParams, [ "view" ], _onReadyFieldsRestrictions)) {
                _log(eventParams, callback);
            }
        }
        function _reportRouteChange(viewName, eventArgs, callback) {
            var _routeChangeFieldsRestrictions = {
                view: {
                    type: "string"
                }
            };
            var eventParams = _extend({}, eventArgs, {
                evid: EVENT_IDS.ROUTE_CHANGE,
                view: viewName
            });
            if (_validateBiEventArgs(eventParams, [ "view" ], _routeChangeFieldsRestrictions)) {
                _log(eventParams, callback);
            }
        }
        function _validateBiEventArgs(eventArgs, requiredArgs, restrictions) {
            var missingRequiredArgs = requiredArgs.slice(0);
            for (var key in eventArgs) {
                var currentRestrictions = restrictions[key] || {};
                eventArgs[key] = fieldParsers.parse(eventArgs[key], currentRestrictions);
                if (!fieldParsers.valid(eventArgs[key], currentRestrictions)) {
                    _options.error("Bad event param (key: " + key + ", value: " + eventArgs[key] + ")");
                    return;
                }
                var missingIndex;
                if ((missingIndex = missingRequiredArgs.indexOf(key)) > -1) {
                    missingRequiredArgs.splice(missingIndex, 1);
                }
            }
            if (missingRequiredArgs.length > 0) {
                _options.error("Missing required params: " + missingRequiredArgs.join(", "));
                return false;
            }
            return true;
        }
        function _addUrlParams(url, params) {
            var delimiter = url.match(/\?./) ? "&" : "?";
            return url.replace(/\?$/, "") + delimiter + Object.keys(params).filter(function(key) {
                return !_options.removeUndefinedValues || params[key] !== undefined;
            }).map(function(key) {
                return [ encodeURIComponent(key), "=", encodeURIComponent(params[key]) ].join("");
            }).join("&");
        }
        function _sendPixel(url, image, onComplete) {
            var onFinish = function() {
                onComplete("pixel");
            };
            var biImage = image || new Image(0, 0);
            biImage.onload = onFinish;
            biImage.onerror = onFinish;
            biImage.src = url;
        }
        function _sendBeacon(url, onComplete) {
            if (!window.navigator || !window.navigator.sendBeacon) {
                return false;
            }
            return window.navigator.sendBeacon(url) && setTimeout(function() {
                onComplete("beacon");
            }, 0);
        }
        function _sendBiEvent(eventArgs, callback) {
            var frogAdapter = eventArgs.adapter || _options.adapter;
            delete eventArgs.adapter;
            var url = _addUrlParams(_options.biUrl + frogAdapter, eventArgs);
            var onComplete = callback || function() {};
            if (!W.BI.DryRun) {
                if (!_options.useBeacon || !_sendBeacon(url, onComplete)) {
                    _sendPixel(url, _options.image, onComplete);
                }
            } else {
                setTimeout(onComplete, 0);
            }
            _lastBiUrl.url = url;
            _lastBiUrl.callback = callback;
        }
        return {
            log: _log,
            reportOnReady: _reportOnReady,
            reportRouteChange: _reportRouteChange,
            error: _error,
            getLastBiUrl: function() {
                return _lastBiUrl;
            }
        };
    }
    return biLogger;
}();

"use strict";

var W = W || {};

W.BI = W.BI || {};

W.BI.DomEventHandler = function() {
    var _wixBiAttributeSelector = "wix-bi", _wixBiArgsAttribute = "wix-bi-args", _initOptions = {
        eventMap: {},
        errorMap: {},
        error: function(str) {
            throw str;
        }
    };
    function _extend(dst) {
        for (var i = 1; i < arguments.length; i++) {
            var extending = arguments[i];
            if (extending) {
                for (var key in extending) {
                    dst[key] = extending[key];
                }
            }
        }
        return dst;
    }
    function eventHandler(biLogger, args) {
        var _options;
        var _biLogger = biLogger;
        _options = _extend({}, _initOptions, args);
        function _safeGetEventParams(eventName, eventMap, explicitParams) {
            var params;
            if (!eventMap || !eventMap[eventName]) {
                _options.error("Invalid event name");
                params = {};
            } else {
                params = eventMap[eventName];
            }
            return _extend({}, params, explicitParams);
        }
        function _log(eventName, eventArgs, callback) {
            var eventParams = _safeGetEventParams(eventName, _options.eventMap, eventArgs);
            _biLogger.log(eventParams, callback);
        }
        function _error(errorName, errorArgs, callback) {
            var errorParams = _safeGetEventParams(errorName, _options.errorMap, errorArgs);
            _biLogger.error(errorParams, callback);
        }
        function _getAttr(element, name) {
            for (var i = 0; i < element.attributes.length; i++) {
                if (element.attributes[i].name === name) {
                    return element.attributes[i].value;
                }
            }
        }
        function _handleTriggeredBiEvent(event) {
            var eventName = _getAttr(event.target, _wixBiAttributeSelector);
            if (eventName) {
                var eventArgsStr = _getAttr(event.target, _wixBiArgsAttribute);
                var eventArgs = eventArgsStr ? eval("eventArgs = " + eventArgsStr) : {};
                _log(eventName, eventArgs);
            }
        }
        function _bind() {
            document.body.addEventListener("click", _handleTriggeredBiEvent);
        }
        function _unbind() {
            document.body.removeEventListener("click", _handleTriggeredBiEvent);
        }
        return {
            bind: _bind,
            unbind: _unbind,
            log: _log,
            error: _error
        };
    }
    return eventHandler;
}();

"use strict";

var W = W || {};

W.BI = W.BI || {};

W.BI.FieldParsers = function($injector) {
    var validators = {
        length: function(val, length) {
            return val && val.length !== undefined && val.length === length;
        },
        maxLength: function(val, maxLength) {
            return val && val.length !== undefined && val.length <= maxLength;
        },
        values: function(val, values) {
            return values && values.indexOf(val) !== -1;
        },
        type: function(val, type) {
            return val && typeof val === type;
        }
    };
    var parsers = {
        subStr: function(val, length) {
            if (val && val.substr) {
                return val.substr(0, Math.min(val.length, length));
            }
            return val;
        }
    };
    this.valid = function(value, restrictions) {
        for (var key in restrictions) {
            if (validators[key] && !validators[key](value, restrictions[key])) {
                return false;
            }
        }
        return true;
    };
    this.parse = function(value, restrictions) {
        if (typeof value === "function") {
            value = $injector ? $injector.invoke(value) : value();
        }
        for (var key in restrictions) {
            value = parsers[key] ? parsers[key](value, restrictions[key]) : value;
        }
        return value;
    };
};

"use strict";

angular.module("wix.common.bi").directive("wixBi", [ "domBiLogger", "$window", function(domBiLogger, $window) {
    function convertAttrToConst(attr) {
        return attr.replace(/-/g, "_").toUpperCase();
    }
    return {
        restrict: "A",
        priority: 1,
        link: {
            pre: function(scope, element, attr) {
                var eventType = attr.wixBiEvent || "click";
                element.bind(eventType, function(ev) {
                    var eventName = convertAttrToConst(attr.wixBi);
                    var eventArgs = scope.$eval(attr.wixBiArgs) || {};
                    if (eventType === "click" && ev.target.href && attr.delayHref !== undefined) {
                        var href = ev.target.href;
                        ev.preventDefault();
                        domBiLogger.log(eventName, eventArgs, function() {
                            $window.location = href;
                        });
                    } else {
                        domBiLogger.log(eventName, eventArgs);
                    }
                });
            }
        }
    };
} ]);

"use strict";

angular.module("wix.common.bi").provider("biLogger", [ "recursiveExtend", function(recursiveExtend) {
    var _config = {
        eventMap: {}
    };
    this.setConfig = function(config) {
        recursiveExtend(_config, config);
    };
    this.$get = [ "Logger", "$injector", function(Logger, $injector) {
        function buildAuthorizationContext() {
            var authorizationContext = {};
            authorizationContext.ownerId = function(permissionsManager) {
                return permissionsManager.$$getOwnerId();
            };
            authorizationContext.ownerId.$inject = [ "permissionsManager" ];
            authorizationContext.roles = function(permissionsManager) {
                return permissionsManager.$$getRoles().join(",");
            };
            authorizationContext.roles.$inject = [ "permissionsManager" ];
            return authorizationContext;
        }
        _config.injector = $injector;
        if ($injector.has("permissionsManager")) {
            var authorizationContext = buildAuthorizationContext();
            _config.defaultEventArgs = angular.extend({}, _config.defaultEventArgs, authorizationContext);
            _config.defaultErrorArgs = angular.extend({}, _config.defaultErrorArgs, authorizationContext);
        }
        return angular.extend(new Logger(_config), {
            getConfig: function() {
                return _config;
            }
        });
    } ];
    this.$get.$inject = [ "Logger", "$injector" ];
} ]);

"use strict";

angular.module("wix.common.bi").provider("domBiLogger", [ "recursiveExtend", function(recursiveExtend) {
    var _config = {
        eventMap: {}
    };
    this.setConfig = function(config) {
        recursiveExtend(_config, config);
    };
    this.$get = [ "biLogger", "DomEventHandler", function(biLogger, DomEventHandler) {
        return angular.extend(new DomEventHandler(biLogger, _config), {
            getConfig: function() {
                return _config;
            }
        });
    } ];
    this.$get.$inject = [ "biLogger", "DomEventHandler" ];
} ]);

"use strict";

angular.module("wix.common.bi").constant("recursiveExtend", function() {
    function isObject(v) {
        return v !== null && typeof v === "object" && v.constructor !== Array;
    }
    function applyModifications(conf, partial) {
        for (var k in partial) {
            if (partial.hasOwnProperty(k)) {
                if (isObject(partial[k])) {
                    conf[k] = conf[k] || {};
                    applyModifications(conf[k], partial[k]);
                } else {
                    conf[k] = partial[k];
                }
            }
        }
    }
    return applyModifications;
}());

"use strict";

(function() {
    function provideBrowsingContext(cb) {
        if (typeof window !== "undefined" && window) {
            try {
                return window.top === window.self ? cb ? cb(window) : window : null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    function hook(obj, fnName, _hook) {
        if (!obj || !obj[fnName]) {
            return;
        }
        var original = obj[fnName];
        obj[fnName] = function() {
            _hook.apply(null, arguments);
            return original.apply(obj, arguments);
        };
    }
    function guid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : r & 3 | 8;
            return v.toString(16);
        });
    }
    angular.module("wix.common.bi").provider("biBrowsingSession", function() {
        var IS_TRACKING = "__isTrackingBiBrowsingSession__";
        var ENDPOINT = "p";
        var SOURCE = 19;
        var EVID = 3;
        var hostName;
        this.setHost = function(host) {
            hostName = host;
        };
        this.$get = [ "$window", "Logger", function($window, Logger) {
            var logger = new Logger({
                hostName: hostName,
                adapter: ENDPOINT,
                useBeacon: true,
                defaultEventArgs: {
                    src: SOURCE,
                    evid: EVID,
                    vsi: guid()
                }
            });
            function getDesktopSize(window) {
                var width = window.screen && window.screen.width || 0;
                var height = window.screen && window.screen.height || 0;
                return [ width, height ].join("x");
            }
            function getWindowSize(window) {
                var width = 0;
                var height = 0;
                if (window.innerWidth) {
                    width = window.innerWidth;
                    height = window.innerHeight;
                } else if (window.document) {
                    if (window.document.documentElement && window.document.documentElement.clientWidth) {
                        width = window.document.documentElement.clientWidth;
                        height = window.document.documentElement.clientHeight;
                    } else if (window.document.body && window.document.body.clientWidth) {
                        width = window.document.body.clientWidth;
                        height = window.document.body.clientHeight;
                    }
                }
                return [ width, height ].join("x");
            }
            function onLoad(cb) {
                provideBrowsingContext(function(window) {
                    cb(window.location.href);
                });
            }
            function onPushState(cb) {
                provideBrowsingContext(function(window) {
                    [ "pushState", "replaceState" ].forEach(function(fnName) {
                        hook(window.history, fnName, function(_, __, url) {
                            cb(url);
                        });
                    });
                });
            }
            function onPopState(cb) {
                provideBrowsingContext(function(window) {
                    window.addEventListener("popstate", function() {
                        cb(window.location.href);
                    });
                });
            }
            function listen(cb) {
                var fromUrl = window.document.referrer;
                [ onLoad, onPushState, onPopState ].forEach(function(event) {
                    event(function(toUrl) {
                        cb(fromUrl, toUrl);
                        fromUrl = toUrl;
                    });
                });
            }
            function shouldTrack() {
                return provideBrowsingContext(function(window) {
                    return window && !window[IS_TRACKING];
                });
            }
            function setIsTracking() {
                provideBrowsingContext(function(window) {
                    window[IS_TRACKING] = true;
                });
            }
            function track() {
                if (!shouldTrack()) {
                    return;
                }
                setIsTracking();
                var firstInSession = 1;
                listen(function(fromUrl, toUrl) {
                    var screen = provideBrowsingContext(function(window) {
                        return {
                            sr: getDesktopSize(window),
                            wr: getWindowSize(window)
                        };
                    });
                    logger.log({
                        from: fromUrl,
                        to: toUrl,
                        fis: firstInSession,
                        sr: screen.sr,
                        wr: screen.wr
                    });
                    firstInSession = 0;
                });
            }
            return {
                track: track,
                logger: logger
            };
        } ];
        this.$get.$inject = [ "$window", "Logger" ];
    });
})();

"use strict";

angular.module("wix.common.bi").value("nowWrapper", function() {
    return Date.now();
}).provider("wixBiLogger", [ "biLoggerProvider", "domBiLoggerProvider", "biBrowsingSessionProvider", function(biLoggerProvider, domBiLoggerProvider, biBrowsingSessionProvider) {
    this.setConfig = function(config) {
        biLoggerProvider.setConfig(config);
        domBiLoggerProvider.setConfig(config);
        biBrowsingSessionProvider.setHost(config.hostName);
    };
    this.$get = [ "biLogger", "domBiLogger", "$q", "$rootScope", "$window", "$parse", "nowWrapper", function(biLogger, domBiLogger, $q, $rootScope, $window, $parse, nowWrapper) {
        var _config = angular.extend({}, biLogger.getConfig(), domBiLogger.getConfig());
        function makeCb(defer) {
            return function() {
                if ($rootScope.$$phase) {
                    defer.resolve();
                } else {
                    $rootScope.$apply(function() {
                        defer.resolve();
                    });
                }
            };
        }
        function getReducedMap(map) {
            return Object.keys(_config[map] || []).reduce(function(prev, key) {
                prev[key] = key;
                return prev;
            }, {});
        }
        function isNewRelicDefined() {
            return typeof $window.NREUM !== "undefined";
        }
        return {
            log: function(eventName, eventArgs) {
                var defer = $q.defer();
                if (typeof eventName === "string" || !eventName) {
                    domBiLogger.log(eventName, eventArgs, makeCb(defer));
                } else {
                    biLogger.log(eventName, makeCb(defer));
                }
                return defer.promise;
            },
            error: function(eventName, eventArgs) {
                var defer = $q.defer();
                if (typeof eventName === "string") {
                    domBiLogger.error(eventName, eventArgs, makeCb(defer));
                } else {
                    biLogger.error(eventName, makeCb(defer));
                }
                return defer.promise;
            },
            reportOnReady: function(viewName, eventArgs) {
                var defer = $q.defer();
                if (!W.BI.initialLoadIsReported) {
                    if (isNewRelicDefined()) {
                        $window.NREUM.finished();
                    }
                    if (eventArgs === undefined) {
                        eventArgs = {};
                    }
                    var startTime = $parse("performance.timing.navigationStart")($window);
                    if (startTime) {
                        eventArgs.loading_time = nowWrapper() - startTime;
                    }
                    eventArgs.initial_load = true;
                    W.BI.initialLoadIsReported = true;
                }
                biLogger.reportOnReady(viewName, eventArgs, makeCb(defer));
                return defer.promise;
            },
            reportRouteChange: function(viewName, eventArgs) {
                var defer = $q.defer();
                biLogger.reportRouteChange(viewName, eventArgs, makeCb(defer));
                return defer.promise;
            },
            getLastBiUrl: function() {
                return biLogger.getLastBiUrl();
            },
            events: getReducedMap("eventMap"),
            errors: getReducedMap("errorMap"),
            getConfig: function() {
                return angular.extend({}, biLogger.getConfig(), domBiLogger.getConfig());
            }
        };
    } ];
    this.$get.$inject = [ "biLogger", "domBiLogger", "$q", "$rootScope", "$window", "$parse", "nowWrapper" ];
} ]);