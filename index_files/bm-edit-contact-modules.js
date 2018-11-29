"use strict";

angular.module("debounce", []).service("debounce", [ "$timeout", function($timeout) {
    return function(func, wait, immediate, invokeApply) {
        var timeout, args, context, result;
        function debounce() {
            context = this;
            args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            if (timeout) {
                $timeout.cancel(timeout);
            }
            timeout = $timeout(later, wait, invokeApply);
            if (callNow) {
                result = func.apply(context, args);
            }
            return result;
        }
        debounce.cancel = function() {
            $timeout.cancel(timeout);
            timeout = null;
        };
        return debounce;
    };
} ]).directive("debounce", [ "debounce", "$parse", function(debounce, $parse) {
    return {
        require: "ngModel",
        priority: 999,
        link: function($scope, $element, $attrs, ngModelController) {
            var debounceDuration = $parse($attrs.debounce)($scope);
            var immediate = !!$parse($attrs.immediate)($scope);
            var debouncedValue, pass;
            var prevRender = ngModelController.$render.bind(ngModelController);
            var commitSoon = debounce(function(viewValue) {
                pass = true;
                ngModelController.$$lastCommittedViewValue = debouncedValue;
                ngModelController.$setViewValue(viewValue);
                pass = false;
            }, parseInt(debounceDuration, 10), immediate);
            ngModelController.$render = function() {
                prevRender();
                commitSoon.cancel();
                debouncedValue = this.$viewValue;
            };
            ngModelController.$parsers.unshift(function(value) {
                if (pass) {
                    debouncedValue = value;
                    return value;
                } else {
                    commitSoon(ngModelController.$viewValue);
                    return debouncedValue;
                }
            });
        }
    };
} ]);

"use strict";

angular.module("wix.common.dialogs", [ "ui.bootstrap", "wix.common.translations" ]);

angular.module("wix.common.ui.components", [ "debounce", "wix.common.translations", "ngAnimate" ]);

"use strict";

try {
    angular.module("ui.bootstrap");
} catch (e) {
    document.write('<script src="bower_components/angular-bootstrap/ui-bootstrap-tpls.js"></script>');
}

angular.module("wix.common.dialogs").value("baseDialogOptions", {
    title: "",
    message: "",
    confirmButtonText: "",
    confirmButtonTextKey: "commonDialogs.BUTTON_OK",
    confirmButtonClass: "default",
    cancelButtonText: "",
    cancelButtonTextKey: "commonDialogs.BUTTON_CANCEL",
    cancelButtonClass: "default",
    beforeConfirm: angular.noop,
    beforeCancel: angular.noop,
    onConfirm: angular.noop,
    onCancel: angular.noop,
    windowClass: "wix-dialog",
    showCancelButton: true,
    closeOnBackdrop: true,
    alignVertically: false
}).controller("ConfirmDialogCtrl", [ "$scope", "$modalInstance", "dialogHandler", function($scope, $modalInstance, dialogHandler) {
    $scope.dialogResult = {};
    $scope.showCancelButton = dialogHandler.showCancelButton;
    $scope.isValid = function() {
        if (!$scope.$$childTail || !$scope.$$childTail.modalForm) {
            return true;
        }
        return $scope.$$childTail.modalForm.$valid;
    };
    $scope.ok = function() {
        if ($scope.isValid() && dialogHandler.beforeActions.beforeConfirm($scope.dialogResult) !== false) {
            $modalInstance.close($scope.dialogResult);
        }
    };
    $scope.cancel = function(cancelReason) {
        if (dialogHandler.beforeActions.beforeCancel($scope.dialogResult) !== false) {
            $modalInstance.dismiss(cancelReason);
        }
    };
} ]).controller("IFrameDialogCtrl", [ "$scope", "$modalInstance", "dialogHandler", function($scope, $modalInstance, dialogHandler) {
    function messageHandler(event) {
        if (!event || !event.data || !dialogHandler.postMessageHandler) {
            return;
        }
        var msgObj;
        try {
            msgObj = angular.fromJson(event.data);
        } catch (e) {
            return;
        }
        dialogHandler.postMessageHandler(event.origin, msgObj, $modalInstance);
    }
    $scope.messageHandler = messageHandler;
    $scope.displayLoader = true;
    $scope.$on("iframeLoaded", function() {
        $scope.$apply(function() {
            $scope.displayLoader = false;
        });
    });
} ]).directive("dialogLoadPane", [ "dialogLoadPaneManager", function(dialogLoadPaneManager) {
    return {
        replace: true,
        scope: {
            display: "=?"
        },
        template: '<div class="dialog-load-pane"></div>',
        link: function(scope, element, attr) {
            scope.id = attr.dialogLoadPane;
            scope.$element = element;
            scope.$element.parent().css("position", "relative");
            function setDisplay(visible) {
                var val = visible ? "block" : "none";
                scope.$element.css("display", val);
            }
            setDisplay(scope.display);
            dialogLoadPaneManager.bind(scope.id, setDisplay);
            scope.$watch("display", function(val) {
                setDisplay(val);
            });
            scope.$on("$destroy", function() {
                dialogLoadPaneManager.unbind(scope.id);
            });
        }
    };
} ]).service("dialogLoadPaneManager", function() {
    var registeredDialogs = {};
    function _bind(id, func) {
        if (id) {
            registeredDialogs[id] = func;
        }
    }
    function _unbind(id) {
        if (id && registeredDialogs[id]) {
            delete registeredDialogs[id];
        }
    }
    function _handle(id, val) {
        var func = registeredDialogs[id] || angular.noop;
        if (typeof func === "function") {
            func.apply(null, [ val ]);
        }
    }
    function _show(id) {
        _handle(id, true);
    }
    function _hide(id) {
        _handle(id, false);
    }
    return {
        bind: _bind,
        unbind: _unbind,
        showLoader: _show,
        hideLoader: _hide
    };
});

angular.module("wix.common.dialogs").constant("CommonDialogHeader", '<form name="modalForm"><div class="modal-header">' + '<div class="modal-title">{{{title}}}</div>' + '<div class="modal-subtitle">{{{subtitle}}}</div>' + '<div class="btn-close-modal" ng-click="cancel(\'close\')"></div>' + "</div>").constant("CommonDialogBody", '<div class="modal-body">' + "<p>{{{message}}}</p>" + "</div>").constant("CommonDialogFooter", '<div class="modal-footer">' + '<button type="button" tabindex="2" ng-show="showCancelButton" ng-click="cancel(\'cancel\')" class="btn btn-cancel {{{cancelButtonClass}}}" >{{{cancelButtonText}}}</button>' + '<button type="submit" tabindex="1" ng-disabled="isValid && !isValid()" ng-click="ok()" class="btn btn-ok {{{confirmButtonClass}}}" >{{{confirmButtonText}}}</button>' + '<div class="clearfix"></div>' + "</div></form>").constant("CommonDialogLoader", '<div dialog-load-pane="{{id}}" display="displayLoader"></div>').factory("defaultDialogHandler", function() {
    var noop = angular.noop;
    function DefaultDialogHandler(options) {
        this.options = options;
        this.showCancelButton = this.options.showCancelButton;
        this.beforeActions = {
            beforeConfirm: this.options.beforeConfirm || noop,
            beforeCancel: this.options.beforeCancel || noop
        };
        this.postMessageHandler = this.options.postMessageHandler;
    }
    return function(options) {
        return new DefaultDialogHandler(options);
    };
}).factory("basicDialog", [ "$rootScope", "$interpolate", "$translate", "$modal", "CommonDialogLoader", "dialogLoadPaneManager", "modalPositionHandler", "defaultDialogHandler", function($rootScope, $interpolate, $translate, $modal, CommonDialogLoader, dialogLoadPaneManager, modalPositionHandler, defaultDialogHandler) {
    var DEFAULT_CONTROLLER = "ConfirmDialogCtrl", noop = angular.noop, counter = 0;
    function BasicDialog(template, options, controller) {
        if (template) {
            this.init(template, options, controller);
        }
    }
    BasicDialog.prototype.compile = function(template) {
        if (/\.htm[l]?$/.test(template)) {
            this.templateUrl = template;
            return;
        }
        var currentTemplate = template.replace(/{{{message}}}/g, this.options.message || "");
        currentTemplate = currentTemplate.replace(/{{{title}}}/g, this.options.title || "");
        currentTemplate = currentTemplate.replace(/{{{subtitle}}}/g, this.options.subtitle || "");
        currentTemplate = currentTemplate.replace(/{{{confirmButtonClass}}}/g, this.options.confirmButtonClass || "");
        currentTemplate = currentTemplate.replace(/{{{cancelButtonClass}}}/g, this.options.cancelButtonClass || "");
        if (this.options.confirmButtonText) {
            currentTemplate = currentTemplate.replace(/{{{confirmButtonText}}}/g, this.options.confirmButtonText || "");
        } else {
            currentTemplate = currentTemplate.replace(/{{{confirmButtonText}}}/g, $translate(this.options.confirmButtonTextKey) || "");
        }
        if (this.options.cancelButtonText) {
            currentTemplate = currentTemplate.replace(/{{{cancelButtonText}}}/g, this.options.cancelButtonText || "");
        } else {
            currentTemplate = currentTemplate.replace(/{{{cancelButtonText}}}/g, $translate(this.options.cancelButtonTextKey) || "");
        }
        this.compiledTemplate = currentTemplate + $interpolate(CommonDialogLoader)({
            id: this.id
        });
    };
    BasicDialog.prototype.init = function(template, options, controller) {
        this.id = ++counter;
        this.options = options || {};
        var currentController = controller || DEFAULT_CONTROLLER;
        this.controller = currentController;
        this.compile(template, options);
        this.dialogHandler = this.options.dialogHandler || defaultDialogHandler(this.options);
        this.windowClass = this.options.windowClass || "wix-basic-dialog";
        this.windowClass += this.options.alignVertically ? " vertically-aligned-modal" : "";
    };
    BasicDialog.prototype.open = function() {
        var openConfig = {
            template: this.compiledTemplate,
            templateUrl: this.templateUrl,
            controller: this.controller,
            resolve: {
                dialogHandler: function() {
                    return this.dialogHandler;
                }.bind(this)
            },
            windowClass: this.windowClass,
            backdrop: this.options.closeOnBackdrop === false ? "static" : true,
            keyboard: this.options.keyboard || true,
            scope: this.options.scope || $rootScope
        };
        this.modal = $modal.open(openConfig);
        this.modal.opened.then(function() {
            $rootScope.$broadcast("$modalOpened", this.modal);
        }.bind(this));
        this.modal.result.then(this.options.onConfirm || noop, this.options.onCancel || noop);
    };
    BasicDialog.prototype.close = function() {
        if (this.modal) {
            this.modal.dismiss();
        }
    };
    BasicDialog.prototype.showLoader = function() {
        dialogLoadPaneManager.showLoader(this.id);
    };
    BasicDialog.prototype.hideLoader = function() {
        dialogLoadPaneManager.hideLoader(this.id);
    };
    return function(template, options, controller) {
        return new BasicDialog(template, options, controller);
    };
} ]).factory("customDialog", [ "$translate", "basicDialog", "baseDialogOptions", "CommonDialogHeader", "CommonDialogBody", "CommonDialogFooter", function($translate, basicDialog, baseDialogOptions, CommonDialogHeader, CommonDialogBody, CommonDialogFooter) {
    var defaultOptions = {
        windowClass: "wix-confirm-dialog",
        customDialogHeader: CommonDialogHeader,
        customDialogFooter: CommonDialogFooter,
        customDialogBody: CommonDialogBody
    };
    function CustomDialog(options, controller) {
        this.options = angular.extend({}, baseDialogOptions, defaultOptions, options);
        if (this.options.customDialogBody !== CommonDialogBody) {
            this.options.customDialogBody = '<div class="modal-body">' + this.options.customDialogBody + "</div>";
        }
        var confirmDialogTemplate = this.options.customDialogHeader + this.options.customDialogBody + this.options.customDialogFooter;
        this.init(confirmDialogTemplate, this.options, controller);
    }
    CustomDialog.prototype = basicDialog();
    return function(options, controller) {
        return new CustomDialog(options, controller);
    };
} ]).factory("confirmDialog", [ "$translate", "basicDialog", "baseDialogOptions", "CommonDialogHeader", "CommonDialogBody", "CommonDialogFooter", function($translate, basicDialog, baseDialogOptions, CommonDialogHeader, CommonDialogBody, CommonDialogFooter) {
    var confirmDialogTemplate = CommonDialogHeader + CommonDialogBody + CommonDialogFooter;
    var defaultOptions = {
        windowClass: "wix-confirm-dialog"
    };
    function ConfirmDialog(options) {
        this.options = angular.extend({}, baseDialogOptions, defaultOptions, options);
        this.init(confirmDialogTemplate, this.options);
    }
    ConfirmDialog.prototype = basicDialog();
    return function(options) {
        return new ConfirmDialog(options);
    };
} ]).factory("errorDialog", [ "$modal", "$translate", "basicDialog", "baseDialogOptions", "CommonDialogHeader", "CommonDialogBody", "CommonDialogFooter", function($modal, $translate, basicDialog, baseDialogOptions, CommonDialogHeader, CommonDialogBody, CommonDialogFooter) {
    var errorDialogTemplate = CommonDialogHeader + CommonDialogBody + CommonDialogFooter;
    var defaultOptions = {
        title: $translate("commonDialogs.ERROR_DIALOG_TITLE"),
        windowClass: "wix-error-dialog",
        showCancelButton: false
    };
    function ErrorDialog(options) {
        this.options = angular.extend({}, baseDialogOptions, defaultOptions, options);
        this.init(errorDialogTemplate, this.options);
    }
    ErrorDialog.prototype = basicDialog();
    return function(options) {
        return new ErrorDialog(options);
    };
} ]).factory("inputDialog", [ "$modal", "$translate", "basicDialog", "baseDialogOptions", "CommonDialogHeader", "CommonDialogFooter", function($modal, $translate, basicDialog, baseDialogOptions, CommonDialogHeader, CommonDialogFooter) {
    var inputDialogTemplate = CommonDialogHeader + '<div class="modal-body">' + "<p>{{{message}}}</p>" + '<input type="{{{inputType}}}" name="{{{inputName}}}" ng-model="dialogResult.{{{inputName}}}" placeholder="{{{inputPlaceholder}}}" {{{inputAttributes}}}/>' + '<div class="invalid-hint-text">{{{invalidHintText}}}</div>' + "</div>" + CommonDialogFooter;
    var defaultOptions = {
        inputPlaceholder: "",
        inputAttributes: "",
        inputName: "input",
        inputType: "text",
        invalidHintText: "",
        windowClass: "wix-input-dialog"
    };
    function InputDialog(options) {
        this.options = angular.extend({}, baseDialogOptions, defaultOptions, options);
        var currentTemplate = inputDialogTemplate.replace(/{{{inputAttributes}}}/g, this.options.inputAttributes);
        currentTemplate = currentTemplate.replace(/{{{inputName}}}/g, this.options.inputName);
        currentTemplate = currentTemplate.replace(/{{{inputPlaceholder}}}/g, this.options.inputPlaceholder);
        currentTemplate = currentTemplate.replace(/{{{inputType}}}/g, this.options.inputType);
        currentTemplate = currentTemplate.replace(/{{{invalidHintText}}}/g, this.options.invalidHintText);
        this.init(currentTemplate, this.options);
    }
    InputDialog.prototype = basicDialog();
    return function(options) {
        return new InputDialog(options);
    };
} ]).factory("iframeDialog", [ "$modal", "$translate", "basicDialog", function($modal, $translate, basicDialog) {
    var iframeDialogTemplate = '<div class="modal-body">' + '<iframe src="{{{iframeUrl}}}" iframe-event-listener="messageHandler(event)" width="100%" height="100%" scrolling="no"></iframe>' + "</div>";
    var iframeDialogMessageHandler = function(origin, msgObj, modalInstance) {
        if (msgObj && (msgObj.action === "closeModal" || msgObj.action === "close-iframe" || msgObj.eventType === "closing")) {
            modalInstance.close();
        }
    };
    var defaultOptions = {
        iframeUrl: "",
        windowClass: "wix-iframe-dialog",
        closeOnBackdrop: false,
        postMessageHandler: null
    };
    function IFrameDialog(options) {
        this.options = angular.extend({}, defaultOptions, options);
        this.options.postMessageHandler = this.options.postMessageHandler || iframeDialogMessageHandler;
        var currentTemplate = iframeDialogTemplate.replace(/{{{iframeUrl}}}/g, this.options.iframeUrl);
        this.init(currentTemplate, this.options, "IFrameDialogCtrl");
    }
    IFrameDialog.prototype = basicDialog();
    return function(options) {
        return new IFrameDialog(options);
    };
} ]).service("modalPositionHandler", [ "$window", "$rootScope", "$timeout", function($window, $rootScope, $timeout) {
    function sortModalPositions() {
        angular.element(".vertically-aligned-modal .modal-dialog").each(function(index, modal) {
            var modalElement = angular.element(modal);
            modalElement.css({
                top: "50%",
                left: "50%",
                "margin-top": -(modalElement.outerHeight() / 2),
                "margin-left": -(modalElement.outerWidth() / 2)
            });
        });
    }
    $rootScope.$on("$modalOpened", function() {
        $timeout(sortModalPositions);
    });
} ]);

"use strict";

angular.module("wix.common.dialogs").directive("iframeEventListener", [ "$window", function($window) {
    return {
        scope: {
            iframeEventListener: "&"
        },
        link: function(scope, element) {
            $window.addEventListener("message", function(event) {
                if (event.source.window === element[0].contentWindow) {
                    scope.iframeEventListener({
                        event: event
                    });
                    scope.$emit("iframeMessage", event);
                }
            }, false);
            element[0].onload = function() {
                scope.$emit("iframeLoaded");
            };
        }
    };
} ]);

"use strict";

angular.module("wix.common.ui.components").directive("loadPane", function() {
    return {
        replace: true,
        transclude: true,
        scope: {},
        template: '<div class="load-pane"></div>',
        link: function(scope, element, attr) {
            scope.$element = element;
            scope.$element.parent().css("position", "relative");
            scope.$element.css({
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                opacity: .6,
                "z-index": "1001",
                "min-height": "40px"
            });
            function setDisplay(visible) {
                var val = visible ? "block" : "none";
                scope.$element.css("display", val);
            }
            scope.$watch("$parent." + attr.loadPane, function(val) {
                setDisplay(val);
            });
        }
    };
});

"use strict";

angular.module("wix.common.ui.components").directive("menuToggle", [ "$rootScope", function($rootScope) {
    return {
        restrict: "C",
        scope: {
            menuDisabled: "="
        },
        link: function(scope, element, attrs) {
            var box = element.find(".toggleable");
            if (box.length === 0) {
                box = element.parent().find(".toggleable");
            }
            var parent = box.parent();
            box.addClass(attrs.position || "bottom");
            function hide(isApply) {
                box.css("display", "none");
                element.removeClass("open-menu");
                $rootScope.$broadcast("menuToggleHide", {
                    id: box.attr("id"),
                    isApply: !!isApply
                });
            }
            angular.element("body").bind("click", function(e) {
                if (!parent.is(e.target) && parent.has(e.target).length === 0) {
                    hide();
                }
            });
            box.find(".action").bind("click", hide);
            box.find(".button-cancel").eq(0).bind("click", function(e) {
                e.stopPropagation();
                hide();
            });
            box.find(".button-apply").eq(0).bind("click", function(e) {
                e.stopPropagation();
                hide(true);
                scope.$apply(function() {
                    scope.$emit("menuToggleOK", box.attr("id"));
                });
            });
            box.on("keydown keypress", "input", function(e) {
                if (e.which === 13) {
                    hide();
                }
            });
            box.bind("click", function(e) {
                e.stopPropagation();
                $rootScope.$broadcast("menuToggleClicked", e.target);
            });
            scope.$on("menuToggleHideAll", hide);
            element.bind("click", function(e) {
                if (scope.menuDisabled) {
                    return;
                }
                if (parent.hasClass("editable")) {
                    if (box.css("display") === "none") {
                        $rootScope.$broadcast("menuToggleHideAll");
                        box.css("display", "block");
                        element.addClass("open-menu");
                        scope.$apply(function() {
                            scope.$emit("menuToggleOpened", box.attr("id"));
                        });
                    } else {
                        hide();
                    }
                    e.stopPropagation();
                }
            });
        }
    };
} ]);

"use strict";

(function(angular) {
    angular.module("wix.common.ui.components").directive("ngLoad", [ "$parse", function($parse) {
        return {
            restrict: "A",
            compile: function($element, attr) {
                var fn = $parse(attr.ngLoad);
                return function(scope, element) {
                    element.on("load", function(event) {
                        scope.$apply(function() {
                            fn(scope, {
                                $event: event
                            });
                        });
                    });
                };
            }
        };
    } ]);
})(angular);

"use strict";

(function() {
    function wixTimerangePicker() {
        return {
            templateUrl: "views/timerange-picker.preload.html",
            restrict: "E",
            scope: {
                options: "=",
                customPartOne: "@",
                customPartTwo: "@",
                onSelectionChange: "&",
                customSummary: "@",
                value: "="
            },
            link: function postLink(scope) {
                var initialValue = scope.value;
                var translationDict = {};
                scope.options.forEach(function(option) {
                    translationDict["" + option.value] = option.translationKey;
                });
                scope.getCurrentTimerangeTranslation = function() {
                    if ("" + scope.value in translationDict) {
                        return translationDict[scope.value];
                    } else {
                        return scope.customSummary;
                    }
                };
                function onValueChanged(value) {
                    if (scope.value !== value) {
                        scope.value = value;
                        scope.onSelectionChange({
                            value: value
                        });
                    }
                }
                scope.$broadcast("menuToggleHideAll");
                scope.select = function(value) {
                    scope.$broadcast("menuToggleHideAll");
                    scope.custom = "";
                    onValueChanged(value);
                };
                scope.customTimerangeChanged = function() {
                    var intVal = parseInt(scope.custom);
                    if (isNaN(intVal) || intVal < 0) {
                        onValueChanged(initialValue);
                    } else {
                        onValueChanged(intVal);
                    }
                };
            }
        };
    }
    angular.module("wix.common.ui.components").directive("wixTimerangePicker", wixTimerangePicker);
})();

"use strict";

(function() {
    function wixSwitch() {
        return {
            templateUrl: "views/switch.preload.html",
            restrict: "E",
            require: "?ngModel",
            link: function postLink(scope, element, attrs, ngModel) {
                if (!ngModel) {
                    return;
                }
                scope.toggleStatus = function() {
                    scope.isOn = !scope.isOn;
                    ngModel.$setViewValue(scope.isOn);
                };
                ngModel.$render = function() {
                    scope.isOn = ngModel.$viewValue;
                };
            }
        };
    }
    angular.module("wix.common.ui.components").directive("wixSwitch", wixSwitch);
})();

"use strict";

angular.module("wix.common.ui.components").filter("unsafe", [ "$sce", function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
} ]);

"use strict";

(function() {
    wixUiSmartTooltip.$inject = [ "$window", "$timeout" ];
    function wixUiSmartTooltip($window, $timeout) {
        var smartToolTipCtrl = function() {
            var self = this;
            var tooltipHeight;
            var tooltipWidth;
            var elementHeight;
            var cancelHide;
            var wixHeaderHeight = 60;
            this.shouldShowTooltip = false;
            this.showTooltip = function() {
                $timeout.cancel(cancelHide);
                if (self.shouldShowTooltip) {
                    return;
                }
                self.shouldShowTooltip = true;
                $timeout(function() {
                    tooltipHeight = tooltipHeight || self.element[0].querySelector(".wix-ui-smart-tooltip").offsetHeight;
                    tooltipWidth = tooltipWidth || self.element[0].querySelector(".wix-ui-smart-tooltip").offsetWidth;
                    elementHeight = elementHeight || self.element[0].querySelector(".wix-ui-smart-tooltip-element").offsetHeight;
                    var elementOffset = self.element.find(".wix-ui-smart-tooltip-element").offset().top;
                    angular.element(self.element.find(".arrow-wrapper")).css("left", Math.ceil(tooltipWidth / 2) - 8 + "px");
                    if (elementOffset - ($window.pageYOffset + wixHeaderHeight) >= tooltipHeight) {
                        angular.element(self.element.find(".wix-ui-smart-tooltip")).css("top", "-" + (tooltipHeight + 13) + "px");
                        self.shouldShowAbove = true;
                    } else {
                        self.shouldShowAbove = false;
                        angular.element(self.element.find(".wix-ui-smart-tooltip")).css("top", elementHeight + 13 + "px");
                    }
                });
            };
            this.hideTooltip = function() {
                cancelHide = $timeout(function() {
                    self.shouldShowTooltip = false;
                }, 250);
            };
        };
        return {
            restrict: "A",
            transclude: true,
            scope: {},
            template: '<div class="wix-ui-smart-tooltip-wrapper">' + '<div ng-show="tooltipIf()" class="wix-ui-smart-tooltip-width-wrapper">' + '<div class="wix-ui-smart-tooltip" ng-show="vm.shouldShowTooltip" ng-mouseover="vm.showTooltip()" ng-mouseleave="vm.hideTooltip()">' + "<div class=\"arrow-wrapper\" ng-class=\"{'arrow-up': !vm.shouldShowAbove, 'arrow-down': vm.shouldShowAbove}\">" + '<div class="arrow-inner"></div>' + '<div class="arrow"></div>' + "</div>" + '<div translate="{{vm.tooltip}}"></div>' + "</div>" + "</div>" + '<div class="wix-ui-smart-tooltip-element" ng-mouseover="vm.showTooltip()" ng-mouseleave="vm.hideTooltip()"  ng-transclude></div>' + "</div>",
            controller: smartToolTipCtrl,
            controllerAs: "vm",
            link: function postLink(scope, element, attr, controller) {
                controller.tooltip = attr.wixUiSmartTooltip;
                controller.element = element;
                scope.tooltipIf = function() {
                    return attr.tooltipIf ? scope.$parent.$eval(attr.tooltipIf) : true;
                };
            }
        };
    }
    angular.module("wix.common.ui.components").directive("wixUiSmartTooltip", wixUiSmartTooltip);
})();

"use strict";

(function() {
    wixAutoFocus.$inject = [ "$timeout" ];
    function wixAutoFocus($timeout) {
        return {
            restrict: "A",
            link: function postLink(scope, element) {
                $timeout(function() {
                    element[0].focus();
                }, 10);
            }
        };
    }
    angular.module("wix.common.ui.components").directive("wixAutoFocus", wixAutoFocus);
})();

angular.module("wix.common.dialogs").run([ "$templateCache", function($templateCache) {
    "use strict";
    $templateCache.put("views/switch.preload.html", "<div class='wix-switch' ng-class='{on : isOn}' ng-click='toggleStatus()'>\n" + "<div class='switch-icon-container'>\n" + "<div class='status-toggle-icon'></div>\n" + "</div>\n" + "</div>\n");
    $templateCache.put("views/timerange-picker.preload.html", "<div class='editable menu-toggle'>\n" + "<div class='wuic-dropdown-top'>\n" + "<span>{{getCurrentTimerangeTranslation() | translate : {value: value} }}</span>\n" + "<div class='icon drop-down-blue'></div>\n" + "</div>\n" + "<div class='toggleable'>\n" + "<div class='wuic-dropdown-content'>\n" + "<ul>\n" + "<li class='clickable' ng-class='{selected: value === option.value }' ng-click='select(option.value)' ng-repeat='option in options'>{{option.translationKey | translate : {value: option.value} }}</li>\n" + "</ul>\n" + "</div>\n" + "<div class='wuic-dropdown-content'>\n" + "<ul>\n" + "<li>\n" + "{{customPartOne | translate}}\n" + "<input class='small-input' debounce='800' ng-change='customTimerangeChanged()' ng-model='custom'>\n" + "{{customPartTwo | translate}}\n" + "</li>\n" + "</ul>\n" + "</div>\n" + "</div>\n" + "</div>\n");
} ]);

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([ "module", "angular" ], function(module, angular) {
            module.exports = factory(angular);
        });
    } else if (typeof module === "object") {
        module.exports = factory(require("angular"));
    } else {
        if (!root.mp) {
            root.mp = {};
        }
        root.mp.autoFocus = factory(root.angular);
    }
})(this, function(angular) {
    "use strict";
    return angular.module("mp.autoFocus", []).directive("autoFocus", [ "$timeout", function($timeout) {
        return {
            restrict: "A",
            link: function($scope, $element, $attributes) {
                if ($scope.$eval($attributes.autoFocus) !== false) {
                    var element = $element[0];
                    $timeout(function() {
                        $scope.$emit("focus", element);
                        element.focus();
                    });
                }
            }
        };
    } ]);
});

"use strict";

angular.module("google.places", []).factory("googlePlacesApi", [ "$window", function($window) {
    if (!$window.google) throw "Global `google` var missing. Did you forget to include the places API script?";
    return $window.google;
} ]).directive("gPlacesAutocomplete", [ "$parse", "$compile", "$timeout", "$document", "googlePlacesApi", function($parse, $compile, $timeout, $document, google) {
    return {
        restrict: "A",
        require: "^ngModel",
        scope: {
            model: "=ngModel",
            options: "=?",
            forceSelection: "=?",
            customPlaces: "=?"
        },
        controller: [ "$scope", function($scope) {} ],
        link: function($scope, element, attrs, controller) {
            var keymap = {
                tab: 9,
                enter: 13,
                esc: 27,
                up: 38,
                down: 40
            }, hotkeys = [ keymap.tab, keymap.enter, keymap.esc, keymap.up, keymap.down ], autocompleteService = new google.maps.places.AutocompleteService(), placesService = new google.maps.places.PlacesService(element[0]);
            (function init() {
                $scope.query = "";
                $scope.predictions = [];
                $scope.input = element;
                $scope.options = $scope.options || {};
                initAutocompleteDrawer();
                initEvents();
                initNgModelController();
            })();
            function initEvents() {
                element.bind("keydown", onKeydown);
                element.bind("blur", onBlur);
                element.bind("submit", onBlur);
                $scope.$watch("selected", select);
            }
            function initAutocompleteDrawer() {
                var drawerElement = angular.element("<div g-places-autocomplete-drawer></div>"), body = angular.element($document[0].body), $drawer;
                drawerElement.attr({
                    input: "input",
                    query: "query",
                    predictions: "predictions",
                    active: "active",
                    selected: "selected"
                });
                $drawer = $compile(drawerElement)($scope);
                body.append($drawer);
            }
            function initNgModelController() {
                controller.$parsers.push(parse);
                controller.$formatters.push(format);
                controller.$render = render;
            }
            function onKeydown(event) {
                if ($scope.predictions.length === 0 || indexOf(hotkeys, event.which) === -1) {
                    return;
                }
                event.preventDefault();
                if (event.which === keymap.down) {
                    $scope.active = ($scope.active + 1) % $scope.predictions.length;
                    $scope.$digest();
                } else if (event.which === keymap.up) {
                    $scope.active = ($scope.active ? $scope.active : $scope.predictions.length) - 1;
                    $scope.$digest();
                } else if (event.which === 13 || event.which === 9) {
                    if ($scope.forceSelection) {
                        $scope.active = $scope.active === -1 ? 0 : $scope.active;
                    }
                    $scope.$apply(function() {
                        $scope.selected = $scope.active;
                        if ($scope.selected === -1) {
                            clearPredictions();
                        }
                    });
                } else if (event.which === 27) {
                    $scope.$apply(function() {
                        event.stopPropagation();
                        clearPredictions();
                    });
                }
            }
            function onBlur(event) {
                if ($scope.predictions.length === 0) {
                    return;
                }
                if ($scope.forceSelection) {
                    $scope.selected = $scope.selected === -1 ? 0 : $scope.selected;
                }
                $scope.$digest();
                $scope.$apply(function() {
                    if ($scope.selected === -1) {
                        clearPredictions();
                    }
                });
            }
            function select() {
                var prediction;
                prediction = $scope.predictions[$scope.selected];
                if (!prediction) return;
                if (prediction.is_custom) {
                    $scope.$apply(function() {
                        $scope.model = prediction.place;
                        $scope.$emit("g-places-autocomplete:select", prediction.place);
                        $timeout(function() {
                            controller.$viewChangeListeners.forEach(function(fn) {
                                fn();
                            });
                        });
                    });
                } else {
                    placesService.getDetails({
                        placeId: prediction.place_id
                    }, function(place, status) {
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            $scope.$apply(function() {
                                $scope.model = place;
                                $scope.$emit("g-places-autocomplete:select", place);
                                $timeout(function() {
                                    controller.$viewChangeListeners.forEach(function(fn) {
                                        fn();
                                    });
                                });
                            });
                        }
                    });
                }
                clearPredictions();
            }
            function parse(viewValue) {
                var request;
                if (!(viewValue && isString(viewValue))) return viewValue;
                $scope.query = viewValue;
                request = angular.extend({
                    input: viewValue
                }, $scope.options);
                autocompleteService.getPlacePredictions(request, function(predictions, status) {
                    $scope.$apply(function() {
                        var customPlacePredictions;
                        clearPredictions();
                        if ($scope.customPlaces) {
                            customPlacePredictions = getCustomPlacePredictions($scope.query);
                            $scope.predictions.push.apply($scope.predictions, customPlacePredictions);
                        }
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            $scope.predictions.push.apply($scope.predictions, predictions);
                        }
                        if ($scope.predictions.length > 5) {
                            $scope.predictions.length = 5;
                        }
                    });
                });
                if ($scope.forceSelection) {
                    return controller.$modelValue;
                } else {
                    return viewValue;
                }
            }
            function format(modelValue) {
                var viewValue = "";
                if (isString(modelValue)) {
                    viewValue = modelValue;
                } else if (isObject(modelValue)) {
                    viewValue = modelValue.formatted_address;
                }
                return viewValue;
            }
            function render() {
                return element.val(controller.$viewValue);
            }
            function clearPredictions() {
                $scope.active = -1;
                $scope.selected = -1;
                $scope.predictions = [];
            }
            function getCustomPlacePredictions(query) {
                var predictions = [], place, match, i;
                for (i = 0; i < $scope.customPlaces.length; i++) {
                    place = $scope.customPlaces[i];
                    match = getCustomPlaceMatches(query, place);
                    if (match.matched_substrings.length > 0) {
                        predictions.push({
                            is_custom: true,
                            custom_prediction_label: place.custom_prediction_label || "(Custom Non-Google Result)",
                            description: place.formatted_address,
                            place: place,
                            matched_substrings: match.matched_substrings,
                            terms: match.terms
                        });
                    }
                }
                return predictions;
            }
            function getCustomPlaceMatches(query, place) {
                var q = query + "", terms = [], matched_substrings = [], fragment, termFragments, i;
                termFragments = place.formatted_address.split(",");
                for (i = 0; i < termFragments.length; i++) {
                    fragment = termFragments[i].trim();
                    if (q.length > 0) {
                        if (fragment.length >= q.length) {
                            if (startsWith(fragment, q)) {
                                matched_substrings.push({
                                    length: q.length,
                                    offset: i
                                });
                            }
                            q = "";
                        } else {
                            if (startsWith(q, fragment)) {
                                matched_substrings.push({
                                    length: fragment.length,
                                    offset: i
                                });
                                q = q.replace(fragment, "").trim();
                            } else {
                                q = "";
                            }
                        }
                    }
                    terms.push({
                        value: fragment,
                        offset: place.formatted_address.indexOf(fragment)
                    });
                }
                return {
                    matched_substrings: matched_substrings,
                    terms: terms
                };
            }
            function isString(val) {
                return Object.prototype.toString.call(val) == "[object String]";
            }
            function isObject(val) {
                return Object.prototype.toString.call(val) == "[object Object]";
            }
            function indexOf(array, item) {
                var i, length;
                if (array == null) return -1;
                length = array.length;
                for (i = 0; i < length; i++) {
                    if (array[i] === item) return i;
                }
                return -1;
            }
            function startsWith(string1, string2) {
                return toLower(string1).lastIndexOf(toLower(string2), 0) === 0;
            }
            function toLower(string) {
                return string == null ? "" : string.toLowerCase();
            }
        }
    };
} ]).directive("gPlacesAutocompleteDrawer", [ "$window", "$document", function($window, $document) {
    var TEMPLATE = [ '<div class="pac-container" ng-if="isOpen()" ng-style="{top: position.top+\'px\', left: position.left+\'px\', width: position.width+\'px\'}" style="display: block;" role="listbox" aria-hidden="{{!isOpen()}}">', '  <div class="pac-item" g-places-autocomplete-prediction index="$index" prediction="prediction" query="query"', '       ng-repeat="prediction in predictions track by $index" ng-class="{\'pac-item-selected\': isActive($index) }"', '       ng-mouseenter="selectActive($index)" ng-click="selectPrediction($index)" role="option" id="{{prediction.id}}">', "  </div>", "</div>" ];
    return {
        restrict: "A",
        scope: {
            input: "=",
            query: "=",
            predictions: "=",
            active: "=",
            selected: "="
        },
        template: TEMPLATE.join(""),
        link: function($scope, element) {
            element.bind("mousedown", function(event) {
                event.preventDefault();
            });
            $window.onresize = function() {
                $scope.$apply(function() {
                    $scope.position = getDrawerPosition($scope.input);
                });
            };
            $scope.isOpen = function() {
                return $scope.predictions.length > 0;
            };
            $scope.isActive = function(index) {
                return $scope.active === index;
            };
            $scope.selectActive = function(index) {
                $scope.active = index;
            };
            $scope.selectPrediction = function(index) {
                $scope.selected = index;
            };
            $scope.$watch("predictions", function() {
                $scope.position = getDrawerPosition($scope.input);
            }, true);
            function getDrawerPosition(element) {
                var domEl = element[0], rect = domEl.getBoundingClientRect(), docEl = $document[0].documentElement, body = $document[0].body, scrollTop = $window.pageYOffset || docEl.scrollTop || body.scrollTop, scrollLeft = $window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
                return {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top + rect.height + scrollTop,
                    left: rect.left + scrollLeft
                };
            }
        }
    };
} ]).directive("gPlacesAutocompletePrediction", [ function() {
    var TEMPLATE = [ '<span class="pac-icon pac-icon-marker"></span>', '<span class="pac-item-query" ng-bind-html="prediction | highlightMatched"></span>', '<span ng-repeat="term in prediction.terms | unmatchedTermsOnly:prediction">{{term.value | trailingComma:!$last}}&nbsp;</span>', '<span class="custom-prediction-label" ng-if="prediction.is_custom">&nbsp;{{prediction.custom_prediction_label}}</span>' ];
    return {
        restrict: "A",
        scope: {
            index: "=",
            prediction: "=",
            query: "="
        },
        template: TEMPLATE.join("")
    };
} ]).filter("highlightMatched", [ "$sce", function($sce) {
    return function(prediction) {
        var matchedPortion = "", unmatchedPortion = "", matched;
        if (prediction.matched_substrings.length > 0 && prediction.terms.length > 0) {
            matched = prediction.matched_substrings[0];
            matchedPortion = prediction.terms[0].value.substr(matched.offset, matched.length);
            unmatchedPortion = prediction.terms[0].value.substr(matched.offset + matched.length);
        }
        return $sce.trustAsHtml('<span class="pac-matched">' + matchedPortion + "</span>" + unmatchedPortion);
    };
} ]).filter("unmatchedTermsOnly", [ function() {
    return function(terms, prediction) {
        var i, term, filtered = [];
        for (i = 0; i < terms.length; i++) {
            term = terms[i];
            if (prediction.matched_substrings.length > 0 && term.offset > prediction.matched_substrings[0].length) {
                filtered.push(term);
            }
        }
        return filtered;
    };
} ]).filter("trailingComma", [ function() {
    return function(input, condition) {
        return condition ? input + "," : input;
    };
} ]);

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
} : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var CommonsValidator = function(modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: false
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.loaded = true;
        return module.exports;
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.p = "";
    return __webpack_require__(0);
}([ function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.EmailValidator = exports.DomainValidator = undefined;
    var _DomainValidator = __webpack_require__(1);
    var _EmailValidator = __webpack_require__(6);
    exports.DomainValidator = _DomainValidator.DomainValidator;
    exports.EmailValidator = _EmailValidator.EmailValidator;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.DomainValidator = undefined;
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    var _Domains = __webpack_require__(2);
    var Domains = _interopRequireWildcard(_Domains);
    var _lodash = __webpack_require__(3);
    var _lodash2 = _interopRequireDefault(_lodash);
    var _punycode = __webpack_require__(4);
    var punycode = _interopRequireWildcard(_punycode);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
            return obj;
        } else {
            var newObj = {};
            if (obj != null) {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                }
            }
            newObj.default = obj;
            return newObj;
        }
    }
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    var DomainValidator = exports.DomainValidator = function() {
        function DomainValidator() {
            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}, _ref$allowLocal = _ref.allowLocal, allowLocal = _ref$allowLocal === undefined ? false : _ref$allowLocal;
            _classCallCheck(this, DomainValidator);
            var domainLabelRegex = "[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?";
            var topLabelRegex = "[a-zA-Z](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?";
            var domainNameRegex = "^(?:" + domainLabelRegex + "\\.)*(" + topLabelRegex + ")\\.?$";
            this._domainRegex = new RegExp(domainNameRegex);
        }
        _createClass(DomainValidator, [ {
            key: "_chompLeadingDot",
            value: function _chompLeadingDot(str) {
                if (str[0] === ".") {
                    return str.substring(1);
                }
                return str;
            }
        }, {
            key: "_unicodeToASCII",
            value: function _unicodeToASCII(input) {
                return punycode.toASCII(input);
            }
        }, {
            key: "_arrayContains",
            value: function _arrayContains(sortedArray, key) {
                return (0, _lodash2.default)(sortedArray, key);
            }
        }, {
            key: "isValidCountryCodeTld",
            value: function isValidCountryCodeTld(ccTld) {
                var key = this._chompLeadingDot(this._unicodeToASCII(ccTld).toLowerCase());
                return this._arrayContains(Domains.countryCodeTlds, key);
            }
        }, {
            key: "isValidGenericTld",
            value: function isValidGenericTld(gTld) {
                var key = this._chompLeadingDot(this._unicodeToASCII(gTld).toLowerCase());
                return this._arrayContains(Domains.genericTlds, key);
            }
        }, {
            key: "isValidInfrastructureTld",
            value: function isValidInfrastructureTld(iTld) {
                var key = this._chompLeadingDot(this._unicodeToASCII(iTld).toLowerCase());
                return this._arrayContains(Domains.infrastructureTlds, key);
            }
        }, {
            key: "isValidTld",
            value: function isValidTld(tld) {
                tld = this._unicodeToASCII(tld);
                return this.isValidInfrastructureTld(tld) || this.isValidGenericTld(tld) || this.isValidCountryCodeTld(tld);
            }
        }, {
            key: "extractTld",
            value: function extractTld(domain) {
                if (!domain) {
                    return false;
                }
                domain = this._unicodeToASCII(domain);
                if (domain.length > 253) {
                    return false;
                }
                var groups = domain.match(this._domainRegex);
                if (groups) {
                    return groups[1];
                }
                return null;
            }
        }, {
            key: "isValid",
            value: function isValid(domain) {
                if (!domain) {
                    return false;
                }
                domain = this._unicodeToASCII(domain);
                if (domain.length > 253) {
                    return false;
                }
                var groups = domain.match(this._domainRegex);
                if (groups) {}
                if (groups && groups.length > 1) {
                    return this.isValidTld(groups[1]) && groups[0] !== groups[1];
                }
                return false;
            }
        } ]);
        return DomainValidator;
    }();
}, function(module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var infrastructureTlds = exports.infrastructureTlds = [ "arpa" ];
    var genericTlds = exports.genericTlds = [ "aaa", "aarp", "abarth", "abb", "abbott", "abbvie", "abc", "able", "abogado", "abudhabi", "academy", "accenture", "accountant", "accountants", "aco", "active", "actor", "adac", "ads", "adult", "aeg", "aero", "aetna", "afamilycompany", "afl", "africa", "agakhan", "agency", "aig", "aigo", "airbus", "airforce", "airtel", "akdn", "alfaromeo", "alibaba", "alipay", "allfinanz", "allstate", "ally", "alsace", "alstom", "americanexpress", "americanfamily", "amex", "amfam", "amica", "amsterdam", "analytics", "android", "anquan", "anz", "aol", "apartments", "app", "apple", "aquarelle", "arab", "aramco", "archi", "army", "art", "arte", "asda", "asia", "associates", "athleta", "attorney", "auction", "audi", "audible", "audio", "auspost", "author", "auto", "autos", "avianca", "aws", "axa", "azure", "baby", "baidu", "banamex", "bananarepublic", "band", "bank", "bar", "barcelona", "barclaycard", "barclays", "barefoot", "bargains", "baseball", "basketball", "bauhaus", "bayern", "bbc", "bbt", "bbva", "bcg", "bcn", "beats", "beauty", "beer", "bentley", "berlin", "best", "bestbuy", "bet", "bharti", "bible", "bid", "bike", "bing", "bingo", "bio", "biz", "black", "blackfriday", "blanco", "blockbuster", "blog", "bloomberg", "blue", "bms", "bmw", "bnl", "bnpparibas", "boats", "boehringer", "bofa", "bom", "bond", "boo", "book", "booking", "boots", "bosch", "bostik", "boston", "bot", "boutique", "box", "bradesco", "bridgestone", "broadway", "broker", "brother", "brussels", "budapest", "bugatti", "build", "builders", "business", "buy", "buzz", "bzh", "cab", "cafe", "cal", "call", "calvinklein", "cam", "camera", "camp", "cancerresearch", "canon", "capetown", "capital", "capitalone", "car", "caravan", "cards", "care", "career", "careers", "cars", "cartier", "casa", "case", "caseih", "cash", "casino", "cat", "catering", "catholic", "cba", "cbn", "cbre", "cbs", "ceb", "center", "ceo", "cern", "cfa", "cfd", "chanel", "channel", "chase", "chat", "cheap", "chintai", "christmas", "chrome", "chrysler", "church", "cipriani", "circle", "cisco", "citadel", "citi", "citic", "city", "cityeats", "claims", "cleaning", "click", "clinic", "clinique", "clothing", "cloud", "club", "clubmed", "coach", "codes", "coffee", "college", "cologne", "com", "comcast", "commbank", "community", "company", "compare", "computer", "comsec", "condos", "construction", "consulting", "contact", "contractors", "cooking", "cookingchannel", "cool", "coop", "corsica", "country", "coupon", "coupons", "courses", "credit", "creditcard", "creditunion", "cricket", "crown", "crs", "cruise", "cruises", "csc", "cuisinella", "cymru", "cyou", "dabur", "dad", "dance", "data", "date", "dating", "datsun", "day", "dclk", "dds", "deal", "dealer", "deals", "degree", "delivery", "dell", "deloitte", "delta", "democrat", "dental", "dentist", "desi", "design", "dev", "dhl", "diamonds", "diet", "digital", "direct", "directory", "discount", "discover", "dish", "diy", "dnp", "docs", "doctor", "dodge", "dog", "doha", "domains", "dot", "download", "drive", "dtv", "dubai", "duck", "dunlop", "duns", "dupont", "durban", "dvag", "dvr", "earth", "eat", "eco", "edeka", "edu", "education", "email", "emerck", "energy", "engineer", "engineering", "enterprises", "epost", "epson", "equipment", "ericsson", "erni", "esq", "estate", "esurance", "etisalat", "eurovision", "eus", "events", "everbank", "exchange", "expert", "exposed", "express", "extraspace", "fage", "fail", "fairwinds", "faith", "family", "fan", "fans", "farm", "farmers", "fashion", "fast", "fedex", "feedback", "ferrari", "ferrero", "fiat", "fidelity", "fido", "film", "final", "finance", "financial", "fire", "firestone", "firmdale", "fish", "fishing", "fit", "fitness", "flickr", "flights", "flir", "florist", "flowers", "fly", "foo", "food", "foodnetwork", "football", "ford", "forex", "forsale", "forum", "foundation", "fox", "free", "fresenius", "frl", "frogans", "frontdoor", "frontier", "ftr", "fujitsu", "fujixerox", "fun", "fund", "furniture", "futbol", "fyi", "gal", "gallery", "gallo", "gallup", "game", "games", "gap", "garden", "gbiz", "gdn", "gea", "gent", "genting", "george", "ggee", "gift", "gifts", "gives", "giving", "glade", "glass", "gle", "global", "globo", "gmail", "gmbh", "gmo", "gmx", "godaddy", "gold", "goldpoint", "golf", "goo", "goodhands", "goodyear", "goog", "google", "gop", "got", "gov", "grainger", "graphics", "gratis", "green", "gripe", "grocery", "group", "guardian", "gucci", "guge", "guide", "guitars", "guru", "hair", "hamburg", "hangout", "haus", "hbo", "hdfc", "hdfcbank", "health", "healthcare", "help", "helsinki", "here", "hermes", "hgtv", "hiphop", "hisamitsu", "hitachi", "hiv", "hkt", "hockey", "holdings", "holiday", "homedepot", "homegoods", "homes", "homesense", "honda", "honeywell", "horse", "hospital", "host", "hosting", "hot", "hoteles", "hotels", "hotmail", "house", "how", "hsbc", "hughes", "hyatt", "hyundai", "ibm", "icbc", "ice", "icu", "ieee", "ifm", "ikano", "imamat", "imdb", "immo", "immobilien", "industries", "infiniti", "info", "ing", "ink", "institute", "insurance", "insure", "int", "intel", "international", "intuit", "investments", "ipiranga", "irish", "iselect", "ismaili", "ist", "istanbul", "itau", "itv", "iveco", "iwc", "jaguar", "java", "jcb", "jcp", "jeep", "jetzt", "jewelry", "jio", "jlc", "jll", "jmp", "jnj", "jobs", "joburg", "jot", "joy", "jpmorgan", "jprs", "juegos", "juniper", "kaufen", "kddi", "kerryhotels", "kerrylogistics", "kerryproperties", "kfh", "kia", "kim", "kinder", "kindle", "kitchen", "kiwi", "koeln", "komatsu", "kosher", "kpmg", "kpn", "krd", "kred", "kuokgroup", "kyoto", "lacaixa", "ladbrokes", "lamborghini", "lamer", "lancaster", "lancia", "lancome", "land", "landrover", "lanxess", "lasalle", "lat", "latino", "latrobe", "law", "lawyer", "lds", "lease", "leclerc", "lefrak", "legal", "lego", "lexus", "lgbt", "liaison", "lidl", "life", "lifeinsurance", "lifestyle", "lighting", "like", "lilly", "limited", "limo", "lincoln", "linde", "link", "lipsy", "live", "living", "lixil", "loan", "loans", "locker", "locus", "loft", "lol", "london", "lotte", "lotto", "love", "lpl", "lplfinancial", "ltd", "ltda", "lundbeck", "lupin", "luxe", "luxury", "macys", "madrid", "maif", "maison", "makeup", "man", "management", "mango", "map", "market", "marketing", "markets", "marriott", "marshalls", "maserati", "mattel", "mba", "mckinsey", "med", "media", "meet", "melbourne", "meme", "memorial", "men", "menu", "meo", "merckmsd", "metlife", "miami", "microsoft", "mil", "mini", "mint", "mit", "mitsubishi", "mlb", "mls", "mma", "mobi", "mobile", "mobily", "moda", "moe", "moi", "mom", "monash", "money", "monster", "mopar", "mormon", "mortgage", "moscow", "moto", "motorcycles", "mov", "movie", "movistar", "msd", "mtn", "mtr", "museum", "mutual", "nab", "nadex", "nagoya", "name", "nationwide", "natura", "navy", "nba", "nec", "net", "netbank", "netflix", "network", "neustar", "new", "newholland", "news", "next", "nextdirect", "nexus", "nfl", "ngo", "nhk", "nico", "nike", "nikon", "ninja", "nissan", "nissay", "nokia", "northwesternmutual", "norton", "now", "nowruz", "nowtv", "nra", "nrw", "ntt", "nyc", "obi", "observer", "off", "office", "okinawa", "olayan", "olayangroup", "oldnavy", "ollo", "omega", "one", "ong", "onl", "online", "onyourside", "ooo", "open", "oracle", "orange", "org", "organic", "origins", "osaka", "otsuka", "ott", "ovh", "page", "panasonic", "panerai", "paris", "pars", "partners", "parts", "party", "passagens", "pay", "pccw", "pet", "pfizer", "pharmacy", "phd", "philips", "phone", "photo", "photography", "photos", "physio", "piaget", "pics", "pictet", "pictures", "pid", "pin", "ping", "pink", "pioneer", "pizza", "place", "play", "playstation", "plumbing", "plus", "pnc", "pohl", "poker", "politie", "porn", "post", "pramerica", "praxi", "press", "prime", "pro", "prod", "productions", "prof", "progressive", "promo", "properties", "property", "protection", "pru", "prudential", "pub", "pwc", "qpon", "quebec", "quest", "qvc", "racing", "radio", "raid", "read", "realestate", "realtor", "realty", "recipes", "red", "redstone", "redumbrella", "rehab", "reise", "reisen", "reit", "reliance", "ren", "rent", "rentals", "repair", "report", "republican", "rest", "restaurant", "review", "reviews", "rexroth", "rich", "richardli", "ricoh", "rightathome", "ril", "rio", "rip", "rmit", "rocher", "rocks", "rodeo", "rogers", "room", "rsvp", "rugby", "ruhr", "run", "rwe", "ryukyu", "saarland", "safe", "safety", "sakura", "sale", "salon", "samsclub", "samsung", "sandvik", "sandvikcoromant", "sanofi", "sap", "sapo", "sarl", "sas", "save", "saxo", "sbi", "sbs", "sca", "scb", "schaeffler", "schmidt", "scholarships", "school", "schule", "schwarz", "science", "scjohnson", "scor", "scot", "search", "seat", "secure", "security", "seek", "select", "sener", "services", "ses", "seven", "sew", "sex", "sexy", "sfr", "shangrila", "sharp", "shaw", "shell", "shia", "shiksha", "shoes", "shop", "shopping", "shouji", "show", "showtime", "shriram", "silk", "sina", "singles", "site", "ski", "skin", "sky", "skype", "sling", "smart", "smile", "sncf", "soccer", "social", "softbank", "software", "sohu", "solar", "solutions", "song", "sony", "soy", "space", "spiegel", "sport", "spot", "spreadbetting", "srl", "srt", "stada", "staples", "star", "starhub", "statebank", "statefarm", "statoil", "stc", "stcgroup", "stockholm", "storage", "store", "stream", "studio", "study", "style", "sucks", "supplies", "supply", "support", "surf", "surgery", "suzuki", "swatch", "swiftcover", "swiss", "sydney", "symantec", "systems", "tab", "taipei", "talk", "taobao", "target", "tatamotors", "tatar", "tattoo", "tax", "taxi", "tci", "tdk", "team", "tech", "technology", "tel", "telecity", "telefonica", "temasek", "tennis", "teva", "thd", "theater", "theatre", "tiaa", "tickets", "tienda", "tiffany", "tips", "tires", "tirol", "tjmaxx", "tjx", "tkmaxx", "tmall", "today", "tokyo", "tools", "top", "toray", "toshiba", "total", "tours", "town", "toyota", "toys", "trade", "trading", "training", "travel", "travelchannel", "travelers", "travelersinsurance", "trust", "trv", "tube", "tui", "tunes", "tushu", "tvs", "ubank", "ubs", "uconnect", "unicom", "university", "uno", "uol", "ups", "vacations", "vana", "vanguard", "vegas", "ventures", "verisign", "versicherung", "vet", "viajes", "video", "vig", "viking", "villas", "vin", "vip", "virgin", "visa", "vision", "vista", "vistaprint", "viva", "vivo", "vlaanderen", "vodka", "volkswagen", "volvo", "vote", "voting", "voto", "voyage", "vuelos", "wales", "walmart", "walter", "wang", "wanggou", "warman", "watch", "watches", "weather", "weatherchannel", "webcam", "weber", "website", "wed", "wedding", "weibo", "weir", "whoswho", "wien", "wiki", "williamhill", "win", "windows", "wine", "winners", "wme", "wolterskluwer", "woodside", "work", "works", "world", "wow", "wtc", "wtf", "xbox", "xerox", "xfinity", "xihuan", "xin", "xn--11b4c3d", "xn--1ck2e1b", "xn--1qqw23a", "xn--30rr7y", "xn--3bst00m", "xn--3ds443g", "xn--3oq18vl8pn36a", "xn--3pxu8k", "xn--42c2d9a", "xn--45q11c", "xn--4gbrim", "xn--55qw42g", "xn--55qx5d", "xn--5su34j936bgsg", "xn--5tzm5g", "xn--6frz82g", "xn--6qq986b3xl", "xn--80adxhks", "xn--80aqecdr1a", "xn--80asehdb", "xn--80aswg", "xn--8y0a063a", "xn--90ae", "xn--9dbq2a", "xn--9et52u", "xn--9krt00a", "xn--b4w605ferd", "xn--bck1b9a5dre4c", "xn--c1avg", "xn--c2br7g", "xn--cck2b3b", "xn--cg4bki", "xn--czr694b", "xn--czrs0t", "xn--czru2d", "xn--d1acj3b", "xn--eckvdtc9d", "xn--efvy88h", "xn--estv75g", "xn--fct429k", "xn--fhbei", "xn--fiq228c5hs", "xn--fiq64b", "xn--fjq720a", "xn--flw351e", "xn--fzys8d69uvgm", "xn--g2xx48c", "xn--gckr3f0f", "xn--gk3at1e", "xn--hxt814e", "xn--i1b6b1a6a2e", "xn--imr513n", "xn--io0a7i", "xn--j1aef", "xn--jlq61u9w7b", "xn--jvr189m", "xn--kcrx77d1x4a", "xn--kpu716f", "xn--kput3i", "xn--mgba3a3ejt", "xn--mgba7c0bbn0a", "xn--mgbaakc7dvf", "xn--mgbab2bd", "xn--mgbb9fbpob", "xn--mgbca7dzdo", "xn--mgbi4ecexp", "xn--mgbt3dhd", "xn--mk1bu44c", "xn--mxtq1m", "xn--ngbc5azd", "xn--ngbe9e0a", "xn--ngbrx", "xn--nqv7f", "xn--nqv7fs00ema", "xn--nyqy26a", "xn--otu796d", "xn--p1acf", "xn--pbt977c", "xn--pssy2u", "xn--q9jyb4c", "xn--qcka1pmc", "xn--rhqv96g", "xn--rovu88b", "xn--ses554g", "xn--t60b56a", "xn--tckwe", "xn--tiq49xqyj", "xn--unup4y", "xn--vermgensberater-ctb", "xn--vermgensberatung-pwb", "xn--vhquv", "xn--vuq861b", "xn--w4r85el8fhu5dnra", "xn--w4rs40l", "xn--xhq521b", "xn--zfr164b", "xperia", "xxx", "xyz", "yachts", "yahoo", "yamaxun", "yandex", "yodobashi", "yoga", "yokohama", "you", "youtube", "yun", "zappos", "zara", "zero", "zip", "zippo", "zone", "zuerich" ];
    var countryCodeTlds = exports.countryCodeTlds = [ "ac", "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "aq", "ar", "as", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "st", "su", "sv", "sx", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "xn--2scrj9c", "xn--3e0b707e", "xn--3hcrj9c", "xn--45br5cyl", "xn--45brj9c", "xn--54b7fta0cc", "xn--80ao21a", "xn--90a3ac", "xn--90ais", "xn--clchc0ea0b2g2a9gcd", "xn--d1alf", "xn--e1a4c", "xn--fiqs8s", "xn--fiqz9s", "xn--fpcrj9c3d", "xn--fzc2c9e2c", "xn--gecrj9c", "xn--h2breg3eve", "xn--h2brj9c", "xn--h2brj9c8c", "xn--j1amh", "xn--j6w193g", "xn--kprw13d", "xn--kpry57d", "xn--l1acc", "xn--lgbbat1ad8j", "xn--mgb9awbf", "xn--mgba3a4f16a", "xn--mgbaam7a8h", "xn--mgbai9azgqp6j", "xn--mgbayh7gpa", "xn--mgbbh1a", "xn--mgbbh1a71e", "xn--mgbc0a9azcg", "xn--mgberp4a5d4ar", "xn--mgbgu82a", "xn--mgbpl2fh", "xn--mgbtx2b", "xn--mgbx4cd0ab", "xn--mix891f", "xn--node", "xn--o3cw4h", "xn--ogbpf8fl", "xn--p1ai", "xn--pgbs0dh", "xn--qxam", "xn--rvc1e0am3e", "xn--s9brj9c", "xn--wgbh1c", "xn--wgbl6a", "xn--xkc2al3hye2a", "xn--xkc2dl3a5ee0h", "xn--y9a3aq", "xn--yfro4i67o", "xn--ygbi2ammx", "ye", "yt", "za", "zm", "zw" ];
}, function(module, exports) {
    var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 1.7976931348623157e308, NAN = 0 / 0;
    var argsTag = "[object Arguments]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", stringTag = "[object String]", symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var freeParseInt = parseInt;
    function arrayMap(array, iteratee) {
        var index = -1, length = array ? array.length : 0, result = Array(length);
        while (++index < length) {
            result[index] = iteratee(array[index], index, array);
        }
        return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
        var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
        while (fromRight ? index-- : ++index < length) {
            if (predicate(array[index], index, array)) {
                return index;
            }
        }
        return -1;
    }
    function baseIndexOf(array, value, fromIndex) {
        if (value !== value) {
            return baseFindIndex(array, baseIsNaN, fromIndex);
        }
        var index = fromIndex - 1, length = array.length;
        while (++index < length) {
            if (array[index] === value) {
                return index;
            }
        }
        return -1;
    }
    function baseIsNaN(value) {
        return value !== value;
    }
    function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
            result[index] = iteratee(index);
        }
        return result;
    }
    function baseValues(object, props) {
        return arrayMap(props, function(key) {
            return object[key];
        });
    }
    function overArg(func, transform) {
        return function(arg) {
            return func(transform(arg));
        };
    }
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeKeys = overArg(Object.keys, Object), nativeMax = Math.max;
    function arrayLikeKeys(value, inherited) {
        var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
        var length = result.length, skipIndexes = !!length;
        for (var key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
                result.push(key);
            }
        }
        return result;
    }
    function baseKeys(object) {
        if (!isPrototype(object)) {
            return nativeKeys(object);
        }
        var result = [];
        for (var key in Object(object)) {
            if (hasOwnProperty.call(object, key) && key != "constructor") {
                result.push(key);
            }
        }
        return result;
    }
    function isIndex(value, length) {
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (typeof value == "number" || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
    }
    function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
    }
    function includes(collection, value, fromIndex, guard) {
        collection = isArrayLike(collection) ? collection : values(collection);
        fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
        var length = collection.length;
        if (fromIndex < 0) {
            fromIndex = nativeMax(length + fromIndex, 0);
        }
        return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
    }
    function isArguments(value) {
        return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
        return isObjectLike(value) && isArrayLike(value);
    }
    function isFunction(value) {
        var tag = isObject(value) ? objectToString.call(value) : "";
        return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
        var type = typeof value === "undefined" ? "undefined" : _typeof(value);
        return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
        return !!value && (typeof value === "undefined" ? "undefined" : _typeof(value)) == "object";
    }
    function isString(value) {
        return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    function isSymbol(value) {
        return (typeof value === "undefined" ? "undefined" : _typeof(value)) == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
        if (!value) {
            return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
            var sign = value < 0 ? -1 : 1;
            return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
    }
    function toInteger(value) {
        var result = toFinite(value), remainder = result % 1;
        return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
        if (typeof value == "number") {
            return value;
        }
        if (isSymbol(value)) {
            return NAN;
        }
        if (isObject(value)) {
            var other = typeof value.valueOf == "function" ? value.valueOf() : value;
            value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
            return value === 0 ? value : +value;
        }
        value = value.replace(reTrim, "");
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    function values(object) {
        return object ? baseValues(object, keys(object)) : [];
    }
    module.exports = includes;
}, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_RESULT__;
    (function(module, global) {
        (function(root) {
            var freeExports = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == "object" && exports && !exports.nodeType && exports;
            var freeModule = (typeof module === "undefined" ? "undefined" : _typeof(module)) == "object" && module && !module.nodeType && module;
            var freeGlobal = (typeof global === "undefined" ? "undefined" : _typeof(global)) == "object" && global;
            if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
                root = freeGlobal;
            }
            var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
                overflow: "Overflow: input needs wider integers to process",
                "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                "invalid-input": "Invalid input"
            }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
            function error(type) {
                throw new RangeError(errors[type]);
            }
            function map(array, fn) {
                var length = array.length;
                var result = [];
                while (length--) {
                    result[length] = fn(array[length]);
                }
                return result;
            }
            function mapDomain(string, fn) {
                var parts = string.split("@");
                var result = "";
                if (parts.length > 1) {
                    result = parts[0] + "@";
                    string = parts[1];
                }
                string = string.replace(regexSeparators, ".");
                var labels = string.split(".");
                var encoded = map(labels, fn).join(".");
                return result + encoded;
            }
            function ucs2decode(string) {
                var output = [], counter = 0, length = string.length, value, extra;
                while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 55296 && value <= 56319 && counter < length) {
                        extra = string.charCodeAt(counter++);
                        if ((extra & 64512) == 56320) {
                            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
                        } else {
                            output.push(value);
                            counter--;
                        }
                    } else {
                        output.push(value);
                    }
                }
                return output;
            }
            function ucs2encode(array) {
                return map(array, function(value) {
                    var output = "";
                    if (value > 65535) {
                        value -= 65536;
                        output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                        value = 56320 | value & 1023;
                    }
                    output += stringFromCharCode(value);
                    return output;
                }).join("");
            }
            function basicToDigit(codePoint) {
                if (codePoint - 48 < 10) {
                    return codePoint - 22;
                }
                if (codePoint - 65 < 26) {
                    return codePoint - 65;
                }
                if (codePoint - 97 < 26) {
                    return codePoint - 97;
                }
                return base;
            }
            function digitToBasic(digit, flag) {
                return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
            }
            function adapt(delta, numPoints, firstTime) {
                var k = 0;
                delta = firstTime ? floor(delta / damp) : delta >> 1;
                delta += floor(delta / numPoints);
                for (;delta > baseMinusTMin * tMax >> 1; k += base) {
                    delta = floor(delta / baseMinusTMin);
                }
                return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
            }
            function decode(input) {
                var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
                basic = input.lastIndexOf(delimiter);
                if (basic < 0) {
                    basic = 0;
                }
                for (j = 0; j < basic; ++j) {
                    if (input.charCodeAt(j) >= 128) {
                        error("not-basic");
                    }
                    output.push(input.charCodeAt(j));
                }
                for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
                    for (oldi = i, w = 1, k = base; ;k += base) {
                        if (index >= inputLength) {
                            error("invalid-input");
                        }
                        digit = basicToDigit(input.charCodeAt(index++));
                        if (digit >= base || digit > floor((maxInt - i) / w)) {
                            error("overflow");
                        }
                        i += digit * w;
                        t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                        if (digit < t) {
                            break;
                        }
                        baseMinusT = base - t;
                        if (w > floor(maxInt / baseMinusT)) {
                            error("overflow");
                        }
                        w *= baseMinusT;
                    }
                    out = output.length + 1;
                    bias = adapt(i - oldi, out, oldi == 0);
                    if (floor(i / out) > maxInt - n) {
                        error("overflow");
                    }
                    n += floor(i / out);
                    i %= out;
                    output.splice(i++, 0, n);
                }
                return ucs2encode(output);
            }
            function encode(input) {
                var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
                input = ucs2decode(input);
                inputLength = input.length;
                n = initialN;
                delta = 0;
                bias = initialBias;
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue < 128) {
                        output.push(stringFromCharCode(currentValue));
                    }
                }
                handledCPCount = basicLength = output.length;
                if (basicLength) {
                    output.push(delimiter);
                }
                while (handledCPCount < inputLength) {
                    for (m = maxInt, j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue >= n && currentValue < m) {
                            m = currentValue;
                        }
                    }
                    handledCPCountPlusOne = handledCPCount + 1;
                    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                        error("overflow");
                    }
                    delta += (m - n) * handledCPCountPlusOne;
                    n = m;
                    for (j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue < n && ++delta > maxInt) {
                            error("overflow");
                        }
                        if (currentValue == n) {
                            for (q = delta, k = base; ;k += base) {
                                t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                                if (q < t) {
                                    break;
                                }
                                qMinusT = q - t;
                                baseMinusT = base - t;
                                output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                                q = floor(qMinusT / baseMinusT);
                            }
                            output.push(stringFromCharCode(digitToBasic(q, 0)));
                            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                            delta = 0;
                            ++handledCPCount;
                        }
                    }
                    ++delta;
                    ++n;
                }
                return output.join("");
            }
            function toUnicode(input) {
                return mapDomain(input, function(string) {
                    return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
                });
            }
            function toASCII(input) {
                return mapDomain(input, function(string) {
                    return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
                });
            }
            punycode = {
                version: "1.4.1",
                ucs2: {
                    decode: ucs2decode,
                    encode: ucs2encode
                },
                decode: decode,
                encode: encode,
                toASCII: toASCII,
                toUnicode: toUnicode
            };
            if (true) {
                !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
                    return punycode;
                }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
            } else if (freeExports && freeModule) {
                if (module.exports == freeExports) {
                    freeModule.exports = punycode;
                } else {
                    for (key in punycode) {
                        punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
                    }
                }
            } else {
                root.punycode = punycode;
            }
        })(this);
    }).call(exports, __webpack_require__(5)(module), function() {
        return this;
    }());
}, function(module, exports) {
    module.exports = function(module) {
        if (!module.webpackPolyfill) {
            module.deprecate = function() {};
            module.paths = [];
            module.children = [];
            module.webpackPolyfill = 1;
        }
        return module;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.EmailValidator = undefined;
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    var _DomainValidator = __webpack_require__(1);
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    var EmailValidator = exports.EmailValidator = function() {
        function EmailValidator() {
            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}, _ref$allowLocal = _ref.allowLocal, allowLocal = _ref$allowLocal === undefined ? false : _ref$allowLocal, _ref$allowTld = _ref.allowTld, allowTld = _ref$allowTld === undefined ? false : _ref$allowTld;
            _classCallCheck(this, EmailValidator);
            var specialChars = "\\(\\)<>@,;:'\\\\\\\"\\.\\[\\]";
            var validChars = "(\\\\.)|[^\\s" + specialChars + "]";
            var quotedUser = '("(\\\\"|[^"])*")';
            var word = "((" + validChars + "|')+|" + quotedUser + ")";
            var userRegex = "^\\s*" + word + "(\\." + word + ")*$";
            this._userPattern = new RegExp(userRegex);
            var emailRegex = "^\\s*?(.+)@(.+?)\\s*$";
            this._emailPattern = new RegExp(emailRegex);
            this._domainValidator = new _DomainValidator.DomainValidator({
                allowLocal: allowLocal
            });
            this._allowTld = allowTld;
        }
        _createClass(EmailValidator, [ {
            key: "_isValidDomain",
            value: function _isValidDomain(domain) {
                if (this._allowTld) {
                    return this._domainValidator.isValid(domain) || domain[0] !== "." && this._domainValidator.isValidTld(domain);
                } else {
                    return this._domainValidator.isValid(domain);
                }
            }
        }, {
            key: "_isValidUser",
            value: function _isValidUser(user) {
                if (!user || user.length > 64) {
                    return false;
                }
                return user.match(this._userPattern);
            }
        }, {
            key: "isValid",
            value: function isValid(email) {
                if (!email) {
                    return false;
                }
                if (email[email.length - 1] === ".") {
                    return false;
                }
                var groups = email.match(this._emailPattern);
                if (!groups) {
                    return false;
                }
                if (!this._isValidUser(groups[1])) {
                    return false;
                }
                if (!this._isValidDomain(groups[2])) {
                    return false;
                }
                return true;
            }
        } ]);
        return EmailValidator;
    }();
} ]);

"use strict";

angular.module("wixAngularStorage", [ "wixAngular" ]).constant("ANGULAR_STORAGE_PREFIX", "wixAngularStorage").constant("KEY_SEPARATOR", "|").constant("DEFAULT_AGE_IN_SEC", 60 * 60).constant("CLEANING_INTERVAL", 1e3 * 60 * 10).constant("CLEAN_EPSILON", 100).constant("MAX_KEY_LENGTH", 100).constant("MAX_VALUE_SIZE_IN_BYTES", 4 * 1024).constant("MAX_AGE_IN_SEC", 60 * 60 * 24 * 2).constant("MAX_STORAGE_SIZE_IN_BYTES", 1024 * 1024).constant("DATA_TYPE", "data").constant("ADHOC_TYPE", "adhoc").constant("REMOTE_TYPE", "remote").constant("wixAngularStorageErrors", {
    LOGGED_OUT: 1,
    NOT_FOUND: 2,
    RUNTIME_EXCEPTION: 3,
    SERVER_ERROR: 4,
    QUOTA_EXCEEDED: 5
});

"use strict";

(function() {
    cleanableStorage.$inject = [ "$interval", "$q", "recordUtils", "DATA_TYPE", "CLEANING_INTERVAL", "MAX_STORAGE_SIZE_IN_BYTES" ];
    function cleanableStorage($interval, $q, recordUtils, DATA_TYPE, CLEANING_INTERVAL, MAX_STORAGE_SIZE_IN_BYTES) {
        var dataKeys = [];
        var remoteAndAdhocKeys = [];
        function getValue(key) {
            return localStorage[key] && JSON.parse(localStorage[key]);
        }
        function clearRecord(key) {
            var record = getValue(key);
            if (record) {
                var recordSize = recordUtils.getRecordSize(key, record);
                delete localStorage[key];
                return recordSize;
            } else {
                return 0;
            }
        }
        function clearRecords(keys) {
            return keys.reduce(function(acc, key) {
                acc += clearRecord(key);
                return acc;
            }, 0);
        }
        function getWixCacheKeys() {
            return Object.keys(localStorage).filter(recordUtils.hasPrefix);
        }
        function getAllKeysAndValues(prefix) {
            var cacheStorage = {};
            var keys = Object.keys(localStorage).filter(function(key) {
                return key.indexOf(prefix) === 0;
            });
            keys.forEach(function(key) {
                cacheStorage[key] = getValue(key);
            });
            return cacheStorage;
        }
        function getWixCacheSize() {
            return getWixCacheKeys().reduce(function(acc, key) {
                return acc + recordUtils.getRecordSize(key, getValue(key));
            }, 0);
        }
        function loadExistingWixCacheKeys() {
            var createdAtSort = function(a, b) {
                return a.createdAt - b.createdAt;
            };
            var getKey = function(item) {
                return item.key;
            };
            dataKeys = [];
            remoteAndAdhocKeys = [];
            getWixCacheKeys().forEach(function(key) {
                var item = getValue(key);
                var arr = item.options.type === DATA_TYPE ? dataKeys : remoteAndAdhocKeys;
                arr.push({
                    key: key,
                    createdAt: item.createdAt
                });
            });
            dataKeys.sort(createdAtSort);
            remoteAndAdhocKeys.sort(createdAtSort);
            dataKeys = dataKeys.map(getKey);
            remoteAndAdhocKeys = remoteAndAdhocKeys.map(getKey);
        }
        function clearOtherUsers() {
            return clearRecords(getWixCacheKeys().filter(function(key) {
                return !recordUtils.belongsToCurrentUser(key);
            }));
        }
        function clearExpiredRecords() {
            return clearRecords(getWixCacheKeys().filter(function(cacheKey) {
                var record = getValue(cacheKey);
                return recordUtils.isExpired(record);
            }));
        }
        function clearNonExpiredRecord() {
            var arr = remoteAndAdhocKeys.length === 0 ? dataKeys : remoteAndAdhocKeys;
            var key = arr.shift();
            return clearRecord(key);
        }
        function clear(amount) {
            var requiredSpace = amount || 0;
            var clearedSpace = 0;
            clearedSpace += clearOtherUsers();
            clearedSpace += clearExpiredRecords();
            var size = getWixCacheSize();
            var removedRecordsSpace = 0;
            loadExistingWixCacheKeys();
            while (size - removedRecordsSpace > MAX_STORAGE_SIZE_IN_BYTES) {
                var removed = clearNonExpiredRecord();
                clearedSpace += removed;
                removedRecordsSpace += removed;
            }
            if (size - removedRecordsSpace < requiredSpace - clearedSpace) {
                return false;
            }
            while (clearedSpace < requiredSpace) {
                clearedSpace += clearNonExpiredRecord();
            }
            return true;
        }
        function promiseWrapper(fn) {
            var defer = $q.defer();
            try {
                var done;
                var result = fn(function() {
                    done = true;
                    defer.resolve();
                }, function() {
                    done = true;
                    defer.reject();
                });
                if (!done) {
                    defer.resolve(result);
                }
            } catch (e) {
                defer.reject();
            }
            return defer.promise;
        }
        clear();
        $interval(function() {
            clear();
        }, CLEANING_INTERVAL);
        return {
            set: function(key, value) {
                return promiseWrapper(function() {
                    localStorage[key] = JSON.stringify(value);
                });
            },
            get: function(key) {
                return promiseWrapper(function() {
                    return getValue(key);
                });
            },
            getAllWithPrefix: function(prefix) {
                return promiseWrapper(function() {
                    return getAllKeysAndValues(prefix);
                });
            },
            del: function(key) {
                return promiseWrapper(function() {
                    delete localStorage[key];
                });
            },
            clear: function(amount) {
                return promiseWrapper(function(resolve, reject) {
                    if (clear(amount)) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            }
        };
    }
    angular.module("wixAngularStorage").factory("cleanableStorage", cleanableStorage);
})();

"use strict";

var WixCache = function() {
    WixCache.$inject = [ "provider", "$q", "recordUtils", "cleanableStorage", "wixAngularStorageErrors", "DEFAULT_AGE_IN_SEC", "DATA_TYPE", "ADHOC_TYPE", "REMOTE_TYPE", "CLEAN_EPSILON" ];
    function WixCache(provider, $q, recordUtils, cleanableStorage, wixAngularStorageErrors, DEFAULT_AGE_IN_SEC, DATA_TYPE, ADHOC_TYPE, REMOTE_TYPE, CLEAN_EPSILON) {
        this.$q = $q;
        this.recordUtils = recordUtils;
        this.cleanableStorage = cleanableStorage;
        this.wixAngularStorageErrors = wixAngularStorageErrors;
        this.DEFAULT_AGE_IN_SEC = DEFAULT_AGE_IN_SEC;
        this.DATA_TYPE = DATA_TYPE;
        this.ADHOC_TYPE = ADHOC_TYPE;
        this.REMOTE_TYPE = REMOTE_TYPE;
        this.CLEAN_EPSILON = CLEAN_EPSILON;
        this.namespace = provider.namespace;
    }
    WixCache.prototype.rejectUserNotLoggedIn = function() {
        return this.$q.reject(this.wixAngularStorageErrors.LOGGED_OUT);
    };
    WixCache.prototype.rejectWithRuntimeException = function() {
        return this.$q.reject(this.wixAngularStorageErrors.RUNTIME_EXCEPTION);
    };
    WixCache.prototype.tryToSet = function(key, value) {
        var _this = this;
        var cacheKey = this.recordUtils.getCacheKey(key, value.options);
        return this.cleanableStorage.set(cacheKey, value).then(function() {
            return key;
        }, function(reason) {
            if (reason === _this.wixAngularStorageErrors.RUNTIME_EXCEPTION) {
                return _this.rejectWithRuntimeException();
            }
            if (value.options.type === _this.REMOTE_TYPE) {
                return _this.$q.reject();
            } else {
                return _this.cleanableStorage.clear(_this.recordUtils.getRecordSize(cacheKey, value) + _this.CLEAN_EPSILON).then(function() {
                    return _this.cleanableStorage.set(cacheKey, value).then(function() {
                        return key;
                    }, function() {
                        return _this.rejectWithRuntimeException();
                    });
                }, function() {
                    return _this.$q.reject(_this.wixAngularStorageErrors.QUOTA_EXCEEDED);
                });
            }
        });
    };
    WixCache.prototype.withNamespace = function(opts) {
        var options = angular.extend({}, {
            namespace: this.namespace
        }, opts);
        this.recordUtils.validateNamespace(options);
        return options;
    };
    WixCache.prototype.set = function(key, data, options) {
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        options = this.withNamespace(options);
        this.recordUtils.validateKey(key);
        this.recordUtils.validateData(data);
        this.recordUtils.validateExpiration(options);
        var value = {
            createdAt: Date.now(),
            data: data,
            options: angular.extend({
                expiration: this.DEFAULT_AGE_IN_SEC,
                type: this.DATA_TYPE
            }, options)
        };
        return this.tryToSet(key, value);
    };
    WixCache.prototype.setWithGUID = function(data, opts) {
        if (opts === void 0) {
            opts = {};
        }
        var key = this.recordUtils.generateRandomKey();
        return this.set(key, data, angular.extend({
            expiration: null,
            type: this.ADHOC_TYPE
        }, opts));
    };
    WixCache.prototype.get = function(key, opts) {
        var _this = this;
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        opts = this.withNamespace(opts);
        return this.cleanableStorage.get(this.recordUtils.getCacheKey(key, opts)).then(function(record) {
            if (record && !_this.recordUtils.isExpired(record)) {
                return record.data;
            } else {
                return _this.$q.reject(_this.wixAngularStorageErrors.NOT_FOUND);
            }
        }, function() {
            return _this.rejectWithRuntimeException();
        });
    };
    WixCache.prototype.getAll = function(opts) {
        var _this = this;
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        opts = this.withNamespace(opts);
        return this.cleanableStorage.getAllWithPrefix(this.recordUtils.getCachePrefix(opts)).then(function(records) {
            var cachedRecords = _this.cachedRecords(records);
            if (Object.keys(cachedRecords).length === 0) {
                return _this.$q.reject(_this.wixAngularStorageErrors.NOT_FOUND);
            }
            return cachedRecords;
        }, function() {
            return _this.rejectWithRuntimeException();
        });
    };
    WixCache.prototype.remove = function(key, opts) {
        var _this = this;
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        opts = this.withNamespace(opts);
        return this.cleanableStorage.del(this.recordUtils.getCacheKey(key, opts)).catch(function() {
            return _this.rejectWithRuntimeException();
        });
    };
    WixCache.prototype.cachedRecords = function(records) {
        var _this = this;
        return Object.keys(records).reduce(function(cachedRecords, key) {
            if (records[key] && !_this.recordUtils.isExpired(records[key])) {
                var originKey = _this.recordUtils.getOriginKey(key);
                cachedRecords[originKey] = records[key].data;
            }
            return cachedRecords;
        }, {});
    };
    return WixCache;
}();

var WixCacheProvider = function() {
    function WixCacheProvider() {}
    WixCacheProvider.prototype.setNamespace = function(namespace) {
        this.namespace = namespace;
    };
    WixCacheProvider.prototype.$get = function($injector) {
        return $injector.instantiate(WixCache, {
            provider: this
        });
    };
    WixCacheProvider.prototype.$get.$inject = [ "$injector" ];
    return WixCacheProvider;
}();

angular.module("wixAngularAppInternal").provider("wixCache", WixCacheProvider);

"use strict";

var WixStorage = function() {
    WixStorage.$inject = [ "provider", "$q", "$http", "recordUtils", "wixCache", "wixAngularStorageErrors", "ANGULAR_STORAGE_PREFIX", "REMOTE_TYPE", "DEFAULT_AGE_IN_SEC" ];
    function WixStorage(provider, $q, $http, recordUtils, wixCache, wixAngularStorageErrors, ANGULAR_STORAGE_PREFIX, REMOTE_TYPE, DEFAULT_AGE_IN_SEC) {
        this.$q = $q;
        this.$http = $http;
        this.recordUtils = recordUtils;
        this.wixCache = wixCache;
        this.wixAngularStorageErrors = wixAngularStorageErrors;
        this.ANGULAR_STORAGE_PREFIX = ANGULAR_STORAGE_PREFIX;
        this.REMOTE_TYPE = REMOTE_TYPE;
        this.DEFAULT_AGE_IN_SEC = DEFAULT_AGE_IN_SEC;
        this.namespace = provider.namespace;
    }
    WixStorage.prototype.rejectUserNotLoggedIn = function() {
        return this.$q.reject(this.wixAngularStorageErrors.LOGGED_OUT);
    };
    WixStorage.prototype.cacheRemoteData = function(key, data, options) {
        if (!options.noCache) {
            return this.wixCache.set(key, data, angular.extend({}, options, {
                type: this.REMOTE_TYPE,
                expiration: this.DEFAULT_AGE_IN_SEC
            }));
        }
    };
    WixStorage.prototype.getUrl = function(path, options, key) {
        return [ "/_api/wix-user-preferences-webapp", path, options.namespace, options.siteId, key ].filter(angular.identity).join("/");
    };
    WixStorage.prototype.getRemote = function(key, options) {
        var _this = this;
        var path = options.siteId ? "getVolatilePrefForSite" : "getVolatilePrefForKey";
        var namespace = options.namespace;
        var url = this.getUrl(path, options, key);
        return this.$http.get(url).then(function(res) {
            if (res.data[key] === null) {
                return _this.rejectNotFound();
            }
            _this.cacheRemoteData(key, res.data[key], options);
            return res.data[key];
        }, function(err) {
            if (err.status === 404) {
                if (namespace !== _this.ANGULAR_STORAGE_PREFIX) {
                    return _this.handleNamespaceMigration(key, options);
                } else {
                    return _this.rejectNotFound();
                }
            }
            return _this.$q.reject(_this.wixAngularStorageErrors.SERVER_ERROR);
        });
    };
    WixStorage.prototype.getAllRemote = function(options) {
        var _this = this;
        var path = options.siteId ? "getVolatilePrefsForSite" : "getVolatilePrefs";
        var url = this.getUrl(path, options, undefined);
        return this.$http.get(url).then(function(res) {
            Object.keys(res.data).forEach(function(key) {
                return _this.cacheRemoteData(key, res.data[key], options);
            });
            return res.data;
        });
    };
    WixStorage.prototype.handleNamespaceMigration = function(key, options) {
        var _this = this;
        var newOptions = angular.extend({}, options, {
            namespace: this.ANGULAR_STORAGE_PREFIX,
            noCache: true
        });
        return this.getRemote(key, newOptions).then(function(data) {
            _this.cacheRemoteData(key, data, options);
            return _this.set(key, data, options).then(function() {
                return data;
            });
        }, function(error) {
            if (error === _this.wixAngularStorageErrors.NOT_FOUND) {
                _this.cacheRemoteData(key, null, options);
            }
            return _this.$q.reject(error);
        });
    };
    WixStorage.prototype.tryCache = function(key, options) {
        var _this = this;
        return this.wixCache.get(key, options).then(function(res) {
            return res || _this.rejectNotFound();
        }, function() {
            return _this.getRemote(key, options);
        });
    };
    WixStorage.prototype.tryCacheGetAll = function(options) {
        var _this = this;
        return this.wixCache.getAll(options).then(function(res) {
            return res || _this.rejectNotFound();
        }, function() {
            return _this.getAllRemote(options);
        });
    };
    WixStorage.prototype.rejectNotFound = function() {
        return this.$q.reject(this.wixAngularStorageErrors.NOT_FOUND);
    };
    WixStorage.prototype.withNamespace = function(opts) {
        var options = angular.extend({}, {
            namespace: this.namespace
        }, opts);
        this.recordUtils.validateNamespace(options);
        return options;
    };
    WixStorage.prototype.set = function(key, data, opts) {
        var _this = this;
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        var options = this.withNamespace(opts);
        this.recordUtils.validateKey(key);
        this.recordUtils.validateData(data);
        this.recordUtils.validateExpiration(options);
        var dto = {
            nameSpace: options.namespace,
            key: key,
            blob: data
        };
        if (options.siteId) {
            dto.siteId = options.siteId;
        }
        if (options.expiration) {
            dto.TTLInDays = Math.ceil(options.expiration / (60 * 60 * 24));
        }
        return this.$http.post("/_api/wix-user-preferences-webapp/set", dto).then(function() {
            _this.cacheRemoteData(key, data, options);
            return key;
        });
    };
    WixStorage.prototype.get = function(key, opts) {
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        var options = this.withNamespace(opts);
        return !options.noCache ? this.tryCache(key, options) : this.getRemote(key, options);
    };
    WixStorage.prototype.getAll = function(opts) {
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        var options = this.withNamespace(opts);
        return !options.noCache ? this.tryCacheGetAll(options) : this.getAllRemote(options);
    };
    WixStorage.prototype.remove = function(key, opts) {
        if (!this.recordUtils.isUserLoggedIn()) {
            return this.rejectUserNotLoggedIn();
        }
        return this.set(key, null, opts);
    };
    return WixStorage;
}();

var WixStorageProvider = function() {
    function WixStorageProvider() {}
    WixStorageProvider.prototype.setNamespace = function(namespace) {
        this.namespace = namespace;
    };
    WixStorageProvider.prototype.$get = function($injector) {
        return $injector.instantiate(WixStorage, {
            provider: this
        });
    };
    WixStorageProvider.prototype.$get.$inject = [ "$injector" ];
    return WixStorageProvider;
}();

angular.module("wixAngularStorage").provider("wixStorage", WixStorageProvider);

"use strict";

(function() {
    recordUtilsFactory.$inject = [ "wixCookies", "ANGULAR_STORAGE_PREFIX", "KEY_SEPARATOR", "MAX_KEY_LENGTH", "MAX_VALUE_SIZE_IN_BYTES", "MAX_AGE_IN_SEC" ];
    function recordUtilsFactory(wixCookies, ANGULAR_STORAGE_PREFIX, KEY_SEPARATOR, MAX_KEY_LENGTH, MAX_VALUE_SIZE_IN_BYTES, MAX_AGE_IN_SEC) {
        var recordUtils = {};
        function countBytes(str) {
            return encodeURI(str).match(/%..|./g).length;
        }
        function hasExpiration(options) {
            return options && !!options.expiration;
        }
        recordUtils.isUserLoggedIn = function() {
            return wixCookies.userGUID !== undefined;
        };
        recordUtils.validateKey = function(key) {
            if (typeof key !== "string" || key.length > MAX_KEY_LENGTH) {
                throw new Error("Key length should be no more than " + MAX_KEY_LENGTH + " chars");
            }
        };
        recordUtils.validateData = function(data) {
            var val = JSON.stringify(data);
            if (countBytes(val) > MAX_VALUE_SIZE_IN_BYTES) {
                throw new Error("The size of passed data exceeds the allowed " + MAX_VALUE_SIZE_IN_BYTES / 1024 + " KB");
            }
        };
        recordUtils.validateExpiration = function(options) {
            if (hasExpiration(options) && (typeof options.expiration !== "number" || options.expiration > MAX_AGE_IN_SEC)) {
                throw new Error("Expiration should be a number and cannot increase " + MAX_AGE_IN_SEC + " seconds");
            }
        };
        recordUtils.validateNamespace = function(options) {
            if (!options.namespace) {
                throw new Error("namespace is required");
            } else if (typeof options.namespace !== "string") {
                throw new Error("namespace should be a string");
            }
        };
        recordUtils.isExpired = function(record) {
            if (hasExpiration(record.options)) {
                return record.createdAt + record.options.expiration * 1e3 <= Date.now();
            } else {
                return false;
            }
        };
        recordUtils.getRecordSize = function(key, value) {
            return countBytes(key) + countBytes(JSON.stringify(value));
        };
        recordUtils.getCachePrefix = function(opts) {
            var options = opts || {};
            return [ ANGULAR_STORAGE_PREFIX, wixCookies.userGUID, options.siteId, options.namespace ].filter(angular.identity).join(KEY_SEPARATOR) + KEY_SEPARATOR;
        };
        recordUtils.getCacheKey = function(key, opts) {
            return recordUtils.getCachePrefix(opts) + key;
        };
        recordUtils.getOriginKey = function(key) {
            return key.split(KEY_SEPARATOR).pop();
        };
        recordUtils.generateRandomKey = function() {
            return Math.random().toString(36).slice(2);
        };
        recordUtils.hasPrefix = function(key) {
            return key.indexOf(ANGULAR_STORAGE_PREFIX) === 0;
        };
        recordUtils.belongsToCurrentUser = function(key) {
            if (recordUtils.isUserLoggedIn()) {
                return key.split(KEY_SEPARATOR)[1] === wixCookies.userGUID;
            } else {
                return false;
            }
        };
        return recordUtils;
    }
    angular.module("wixAngularStorage").factory("recordUtils", recordUtilsFactory);
})();

(function(modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
        }
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: false,
            exports: {}
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.l = true;
        return module.exports;
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.d = function(exports, name, getter) {
        if (!__webpack_require__.o(exports, name)) {
            Object.defineProperty(exports, name, {
                enumerable: true,
                get: getter
            });
        }
    };
    __webpack_require__.r = function(exports) {
        if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
            Object.defineProperty(exports, Symbol.toStringTag, {
                value: "Module"
            });
        }
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
    };
    __webpack_require__.t = function(value, mode) {
        if (mode & 1) value = __webpack_require__(value);
        if (mode & 8) return value;
        if (mode & 4 && typeof value === "object" && value && value.__esModule) return value;
        var ns = Object.create(null);
        __webpack_require__.r(ns);
        Object.defineProperty(ns, "default", {
            enumerable: true,
            value: value
        });
        if (mode & 2 && typeof value != "string") for (var key in value) __webpack_require__.d(ns, key, function(key) {
            return value[key];
        }.bind(null, key));
        return ns;
    };
    __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ? function getDefault() {
            return module["default"];
        } : function getModuleExports() {
            return module;
        };
        __webpack_require__.d(getter, "a", getter);
        return getter;
    };
    __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };
    __webpack_require__.p = "https://static.parastorage.com/services/builtin-apps-adapter/1.0.0/";
    __webpack_require__.p = typeof window !== "undefined" && window.__STATICS_BASE_URL__ || __webpack_require__.p;
    return __webpack_require__(__webpack_require__.s = 199);
})([ function(module, exports) {
    module.exports = angular;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var bind = __webpack_require__(170);
    var isBuffer = __webpack_require__(179);
    var toString = Object.prototype.toString;
    function isArray(val) {
        return toString.call(val) === "[object Array]";
    }
    function isArrayBuffer(val) {
        return toString.call(val) === "[object ArrayBuffer]";
    }
    function isFormData(val) {
        return typeof FormData !== "undefined" && val instanceof FormData;
    }
    function isArrayBufferView(val) {
        var result;
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
            result = ArrayBuffer.isView(val);
        } else {
            result = val && val.buffer && val.buffer instanceof ArrayBuffer;
        }
        return result;
    }
    function isString(val) {
        return typeof val === "string";
    }
    function isNumber(val) {
        return typeof val === "number";
    }
    function isUndefined(val) {
        return typeof val === "undefined";
    }
    function isObject(val) {
        return val !== null && typeof val === "object";
    }
    function isDate(val) {
        return toString.call(val) === "[object Date]";
    }
    function isFile(val) {
        return toString.call(val) === "[object File]";
    }
    function isBlob(val) {
        return toString.call(val) === "[object Blob]";
    }
    function isFunction(val) {
        return toString.call(val) === "[object Function]";
    }
    function isStream(val) {
        return isObject(val) && isFunction(val.pipe);
    }
    function isURLSearchParams(val) {
        return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams;
    }
    function trim(str) {
        return str.replace(/^\s*/, "").replace(/\s*$/, "");
    }
    function isStandardBrowserEnv() {
        if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
            return false;
        }
        return typeof window !== "undefined" && typeof document !== "undefined";
    }
    function forEach(obj, fn) {
        if (obj === null || typeof obj === "undefined") {
            return;
        }
        if (typeof obj !== "object" && !isArray(obj)) {
            obj = [ obj ];
        }
        if (isArray(obj)) {
            for (var i = 0, l = obj.length; i < l; i++) {
                fn.call(null, obj[i], i, obj);
            }
        } else {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    fn.call(null, obj[key], key, obj);
                }
            }
        }
    }
    function merge() {
        var result = {};
        function assignValue(val, key) {
            if (typeof result[key] === "object" && typeof val === "object") {
                result[key] = merge(result[key], val);
            } else {
                result[key] = val;
            }
        }
        for (var i = 0, l = arguments.length; i < l; i++) {
            forEach(arguments[i], assignValue);
        }
        return result;
    }
    function extend(a, b, thisArg) {
        forEach(b, function assignValue(val, key) {
            if (thisArg && typeof val === "function") {
                a[key] = bind(val, thisArg);
            } else {
                a[key] = val;
            }
        });
        return a;
    }
    module.exports = {
        isArray: isArray,
        isArrayBuffer: isArrayBuffer,
        isBuffer: isBuffer,
        isFormData: isFormData,
        isArrayBufferView: isArrayBufferView,
        isString: isString,
        isNumber: isNumber,
        isObject: isObject,
        isUndefined: isUndefined,
        isDate: isDate,
        isFile: isFile,
        isBlob: isBlob,
        isFunction: isFunction,
        isStream: isStream,
        isURLSearchParams: isURLSearchParams,
        isStandardBrowserEnv: isStandardBrowserEnv,
        forEach: forEach,
        merge: merge,
        extend: extend,
        trim: trim
    };
}, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;
    (function(root, factory) {
        "use strict";
        if (typeof module === "object" && module.exports) {
            module.exports = factory(__webpack_require__(17), __webpack_require__(18), __webpack_require__(19));
        } else if (true) {
            !(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(17), __webpack_require__(18), __webpack_require__(19) ], 
            __WEBPACK_AMD_DEFINE_FACTORY__ = factory, __WEBPACK_AMD_DEFINE_RESULT__ = typeof __WEBPACK_AMD_DEFINE_FACTORY__ === "function" ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__, 
            __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        } else {}
    })(this, function(punycode, IPv6, SLD, root) {
        "use strict";
        var _URI = root && root.URI;
        function URI(url, base) {
            var _urlSupplied = arguments.length >= 1;
            var _baseSupplied = arguments.length >= 2;
            if (!(this instanceof URI)) {
                if (_urlSupplied) {
                    if (_baseSupplied) {
                        return new URI(url, base);
                    }
                    return new URI(url);
                }
                return new URI();
            }
            if (url === undefined) {
                if (_urlSupplied) {
                    throw new TypeError("undefined is not a valid argument for URI");
                }
                if (typeof location !== "undefined") {
                    url = location.href + "";
                } else {
                    url = "";
                }
            }
            if (url === null) {
                if (_urlSupplied) {
                    throw new TypeError("null is not a valid argument for URI");
                }
            }
            this.href(url);
            if (base !== undefined) {
                return this.absoluteTo(base);
            }
            return this;
        }
        function isInteger(value) {
            return /^[0-9]+$/.test(value);
        }
        URI.version = "1.19.1";
        var p = URI.prototype;
        var hasOwn = Object.prototype.hasOwnProperty;
        function escapeRegEx(string) {
            return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
        }
        function getType(value) {
            if (value === undefined) {
                return "Undefined";
            }
            return String(Object.prototype.toString.call(value)).slice(8, -1);
        }
        function isArray(obj) {
            return getType(obj) === "Array";
        }
        function filterArrayValues(data, value) {
            var lookup = {};
            var i, length;
            if (getType(value) === "RegExp") {
                lookup = null;
            } else if (isArray(value)) {
                for (i = 0, length = value.length; i < length; i++) {
                    lookup[value[i]] = true;
                }
            } else {
                lookup[value] = true;
            }
            for (i = 0, length = data.length; i < length; i++) {
                var _match = lookup && lookup[data[i]] !== undefined || !lookup && value.test(data[i]);
                if (_match) {
                    data.splice(i, 1);
                    length--;
                    i--;
                }
            }
            return data;
        }
        function arrayContains(list, value) {
            var i, length;
            if (isArray(value)) {
                for (i = 0, length = value.length; i < length; i++) {
                    if (!arrayContains(list, value[i])) {
                        return false;
                    }
                }
                return true;
            }
            var _type = getType(value);
            for (i = 0, length = list.length; i < length; i++) {
                if (_type === "RegExp") {
                    if (typeof list[i] === "string" && list[i].match(value)) {
                        return true;
                    }
                } else if (list[i] === value) {
                    return true;
                }
            }
            return false;
        }
        function arraysEqual(one, two) {
            if (!isArray(one) || !isArray(two)) {
                return false;
            }
            if (one.length !== two.length) {
                return false;
            }
            one.sort();
            two.sort();
            for (var i = 0, l = one.length; i < l; i++) {
                if (one[i] !== two[i]) {
                    return false;
                }
            }
            return true;
        }
        function trimSlashes(text) {
            var trim_expression = /^\/+|\/+$/g;
            return text.replace(trim_expression, "");
        }
        URI._parts = function() {
            return {
                protocol: null,
                username: null,
                password: null,
                hostname: null,
                urn: null,
                port: null,
                path: null,
                query: null,
                fragment: null,
                preventInvalidHostname: URI.preventInvalidHostname,
                duplicateQueryParameters: URI.duplicateQueryParameters,
                escapeQuerySpace: URI.escapeQuerySpace
            };
        };
        URI.preventInvalidHostname = false;
        URI.duplicateQueryParameters = false;
        URI.escapeQuerySpace = true;
        URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
        URI.idn_expression = /[^a-z0-9\._-]/i;
        URI.punycode_expression = /(xn--)/i;
        URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
        URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
        URI.findUri = {
            start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
            end: /[\s\r\n]|$/,
            trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/,
            parens: /(\([^\)]*\)|\[[^\]]*\]|\{[^}]*\}|<[^>]*>)/g
        };
        URI.defaultPorts = {
            http: "80",
            https: "443",
            ftp: "21",
            gopher: "70",
            ws: "80",
            wss: "443"
        };
        URI.hostProtocols = [ "http", "https" ];
        URI.invalid_hostname_characters = /[^a-zA-Z0-9\.\-:_]/;
        URI.domAttributes = {
            a: "href",
            blockquote: "cite",
            link: "href",
            base: "href",
            script: "src",
            form: "action",
            img: "src",
            area: "href",
            iframe: "src",
            embed: "src",
            source: "src",
            track: "src",
            input: "src",
            audio: "src",
            video: "src"
        };
        URI.getDomAttribute = function(node) {
            if (!node || !node.nodeName) {
                return undefined;
            }
            var nodeName = node.nodeName.toLowerCase();
            if (nodeName === "input" && node.type !== "image") {
                return undefined;
            }
            return URI.domAttributes[nodeName];
        };
        function escapeForDumbFirefox36(value) {
            return escape(value);
        }
        function strictEncodeURIComponent(string) {
            return encodeURIComponent(string).replace(/[!'()*]/g, escapeForDumbFirefox36).replace(/\*/g, "%2A");
        }
        URI.encode = strictEncodeURIComponent;
        URI.decode = decodeURIComponent;
        URI.iso8859 = function() {
            URI.encode = escape;
            URI.decode = unescape;
        };
        URI.unicode = function() {
            URI.encode = strictEncodeURIComponent;
            URI.decode = decodeURIComponent;
        };
        URI.characters = {
            pathname: {
                encode: {
                    expression: /%(24|26|2B|2C|3B|3D|3A|40)/gi,
                    map: {
                        "%24": "$",
                        "%26": "&",
                        "%2B": "+",
                        "%2C": ",",
                        "%3B": ";",
                        "%3D": "=",
                        "%3A": ":",
                        "%40": "@"
                    }
                },
                decode: {
                    expression: /[\/\?#]/g,
                    map: {
                        "/": "%2F",
                        "?": "%3F",
                        "#": "%23"
                    }
                }
            },
            reserved: {
                encode: {
                    expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/gi,
                    map: {
                        "%3A": ":",
                        "%2F": "/",
                        "%3F": "?",
                        "%23": "#",
                        "%5B": "[",
                        "%5D": "]",
                        "%40": "@",
                        "%21": "!",
                        "%24": "$",
                        "%26": "&",
                        "%27": "'",
                        "%28": "(",
                        "%29": ")",
                        "%2A": "*",
                        "%2B": "+",
                        "%2C": ",",
                        "%3B": ";",
                        "%3D": "="
                    }
                }
            },
            urnpath: {
                encode: {
                    expression: /%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/gi,
                    map: {
                        "%21": "!",
                        "%24": "$",
                        "%27": "'",
                        "%28": "(",
                        "%29": ")",
                        "%2A": "*",
                        "%2B": "+",
                        "%2C": ",",
                        "%3B": ";",
                        "%3D": "=",
                        "%40": "@"
                    }
                },
                decode: {
                    expression: /[\/\?#:]/g,
                    map: {
                        "/": "%2F",
                        "?": "%3F",
                        "#": "%23",
                        ":": "%3A"
                    }
                }
            }
        };
        URI.encodeQuery = function(string, escapeQuerySpace) {
            var escaped = URI.encode(string + "");
            if (escapeQuerySpace === undefined) {
                escapeQuerySpace = URI.escapeQuerySpace;
            }
            return escapeQuerySpace ? escaped.replace(/%20/g, "+") : escaped;
        };
        URI.decodeQuery = function(string, escapeQuerySpace) {
            string += "";
            if (escapeQuerySpace === undefined) {
                escapeQuerySpace = URI.escapeQuerySpace;
            }
            try {
                return URI.decode(escapeQuerySpace ? string.replace(/\+/g, "%20") : string);
            } catch (e) {
                return string;
            }
        };
        var _parts = {
            encode: "encode",
            decode: "decode"
        };
        var _part;
        var generateAccessor = function(_group, _part) {
            return function(string) {
                try {
                    return URI[_part](string + "").replace(URI.characters[_group][_part].expression, function(c) {
                        return URI.characters[_group][_part].map[c];
                    });
                } catch (e) {
                    return string;
                }
            };
        };
        for (_part in _parts) {
            URI[_part + "PathSegment"] = generateAccessor("pathname", _parts[_part]);
            URI[_part + "UrnPathSegment"] = generateAccessor("urnpath", _parts[_part]);
        }
        var generateSegmentedPathFunction = function(_sep, _codingFuncName, _innerCodingFuncName) {
            return function(string) {
                var actualCodingFunc;
                if (!_innerCodingFuncName) {
                    actualCodingFunc = URI[_codingFuncName];
                } else {
                    actualCodingFunc = function(string) {
                        return URI[_codingFuncName](URI[_innerCodingFuncName](string));
                    };
                }
                var segments = (string + "").split(_sep);
                for (var i = 0, length = segments.length; i < length; i++) {
                    segments[i] = actualCodingFunc(segments[i]);
                }
                return segments.join(_sep);
            };
        };
        URI.decodePath = generateSegmentedPathFunction("/", "decodePathSegment");
        URI.decodeUrnPath = generateSegmentedPathFunction(":", "decodeUrnPathSegment");
        URI.recodePath = generateSegmentedPathFunction("/", "encodePathSegment", "decode");
        URI.recodeUrnPath = generateSegmentedPathFunction(":", "encodeUrnPathSegment", "decode");
        URI.encodeReserved = generateAccessor("reserved", "encode");
        URI.parse = function(string, parts) {
            var pos;
            if (!parts) {
                parts = {
                    preventInvalidHostname: URI.preventInvalidHostname
                };
            }
            pos = string.indexOf("#");
            if (pos > -1) {
                parts.fragment = string.substring(pos + 1) || null;
                string = string.substring(0, pos);
            }
            pos = string.indexOf("?");
            if (pos > -1) {
                parts.query = string.substring(pos + 1) || null;
                string = string.substring(0, pos);
            }
            if (string.substring(0, 2) === "//") {
                parts.protocol = null;
                string = string.substring(2);
                string = URI.parseAuthority(string, parts);
            } else {
                pos = string.indexOf(":");
                if (pos > -1) {
                    parts.protocol = string.substring(0, pos) || null;
                    if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
                        parts.protocol = undefined;
                    } else if (string.substring(pos + 1, pos + 3) === "//") {
                        string = string.substring(pos + 3);
                        string = URI.parseAuthority(string, parts);
                    } else {
                        string = string.substring(pos + 1);
                        parts.urn = true;
                    }
                }
            }
            parts.path = string;
            return parts;
        };
        URI.parseHost = function(string, parts) {
            if (!string) {
                string = "";
            }
            string = string.replace(/\\/g, "/");
            var pos = string.indexOf("/");
            var bracketPos;
            var t;
            if (pos === -1) {
                pos = string.length;
            }
            if (string.charAt(0) === "[") {
                bracketPos = string.indexOf("]");
                parts.hostname = string.substring(1, bracketPos) || null;
                parts.port = string.substring(bracketPos + 2, pos) || null;
                if (parts.port === "/") {
                    parts.port = null;
                }
            } else {
                var firstColon = string.indexOf(":");
                var firstSlash = string.indexOf("/");
                var nextColon = string.indexOf(":", firstColon + 1);
                if (nextColon !== -1 && (firstSlash === -1 || nextColon < firstSlash)) {
                    parts.hostname = string.substring(0, pos) || null;
                    parts.port = null;
                } else {
                    t = string.substring(0, pos).split(":");
                    parts.hostname = t[0] || null;
                    parts.port = t[1] || null;
                }
            }
            if (parts.hostname && string.substring(pos).charAt(0) !== "/") {
                pos++;
                string = "/" + string;
            }
            if (parts.preventInvalidHostname) {
                URI.ensureValidHostname(parts.hostname, parts.protocol);
            }
            if (parts.port) {
                URI.ensureValidPort(parts.port);
            }
            return string.substring(pos) || "/";
        };
        URI.parseAuthority = function(string, parts) {
            string = URI.parseUserinfo(string, parts);
            return URI.parseHost(string, parts);
        };
        URI.parseUserinfo = function(string, parts) {
            var firstSlash = string.indexOf("/");
            var pos = string.lastIndexOf("@", firstSlash > -1 ? firstSlash : string.length - 1);
            var t;
            if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
                t = string.substring(0, pos).split(":");
                parts.username = t[0] ? URI.decode(t[0]) : null;
                t.shift();
                parts.password = t[0] ? URI.decode(t.join(":")) : null;
                string = string.substring(pos + 1);
            } else {
                parts.username = null;
                parts.password = null;
            }
            return string;
        };
        URI.parseQuery = function(string, escapeQuerySpace) {
            if (!string) {
                return {};
            }
            string = string.replace(/&+/g, "&").replace(/^\?*&*|&+$/g, "");
            if (!string) {
                return {};
            }
            var items = {};
            var splits = string.split("&");
            var length = splits.length;
            var v, name, value;
            for (var i = 0; i < length; i++) {
                v = splits[i].split("=");
                name = URI.decodeQuery(v.shift(), escapeQuerySpace);
                value = v.length ? URI.decodeQuery(v.join("="), escapeQuerySpace) : null;
                if (hasOwn.call(items, name)) {
                    if (typeof items[name] === "string" || items[name] === null) {
                        items[name] = [ items[name] ];
                    }
                    items[name].push(value);
                } else {
                    items[name] = value;
                }
            }
            return items;
        };
        URI.build = function(parts) {
            var t = "";
            if (parts.protocol) {
                t += parts.protocol + ":";
            }
            if (!parts.urn && (t || parts.hostname)) {
                t += "//";
            }
            t += URI.buildAuthority(parts) || "";
            if (typeof parts.path === "string") {
                if (parts.path.charAt(0) !== "/" && typeof parts.hostname === "string") {
                    t += "/";
                }
                t += parts.path;
            }
            if (typeof parts.query === "string" && parts.query) {
                t += "?" + parts.query;
            }
            if (typeof parts.fragment === "string" && parts.fragment) {
                t += "#" + parts.fragment;
            }
            return t;
        };
        URI.buildHost = function(parts) {
            var t = "";
            if (!parts.hostname) {
                return "";
            } else if (URI.ip6_expression.test(parts.hostname)) {
                t += "[" + parts.hostname + "]";
            } else {
                t += parts.hostname;
            }
            if (parts.port) {
                t += ":" + parts.port;
            }
            return t;
        };
        URI.buildAuthority = function(parts) {
            return URI.buildUserinfo(parts) + URI.buildHost(parts);
        };
        URI.buildUserinfo = function(parts) {
            var t = "";
            if (parts.username) {
                t += URI.encode(parts.username);
            }
            if (parts.password) {
                t += ":" + URI.encode(parts.password);
            }
            if (t) {
                t += "@";
            }
            return t;
        };
        URI.buildQuery = function(data, duplicateQueryParameters, escapeQuerySpace) {
            var t = "";
            var unique, key, i, length;
            for (key in data) {
                if (hasOwn.call(data, key) && key) {
                    if (isArray(data[key])) {
                        unique = {};
                        for (i = 0, length = data[key].length; i < length; i++) {
                            if (data[key][i] !== undefined && unique[data[key][i] + ""] === undefined) {
                                t += "&" + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
                                if (duplicateQueryParameters !== true) {
                                    unique[data[key][i] + ""] = true;
                                }
                            }
                        }
                    } else if (data[key] !== undefined) {
                        t += "&" + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
                    }
                }
            }
            return t.substring(1);
        };
        URI.buildQueryParameter = function(name, value, escapeQuerySpace) {
            return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? "=" + URI.encodeQuery(value, escapeQuerySpace) : "");
        };
        URI.addQuery = function(data, name, value) {
            if (typeof name === "object") {
                for (var key in name) {
                    if (hasOwn.call(name, key)) {
                        URI.addQuery(data, key, name[key]);
                    }
                }
            } else if (typeof name === "string") {
                if (data[name] === undefined) {
                    data[name] = value;
                    return;
                } else if (typeof data[name] === "string") {
                    data[name] = [ data[name] ];
                }
                if (!isArray(value)) {
                    value = [ value ];
                }
                data[name] = (data[name] || []).concat(value);
            } else {
                throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");
            }
        };
        URI.setQuery = function(data, name, value) {
            if (typeof name === "object") {
                for (var key in name) {
                    if (hasOwn.call(name, key)) {
                        URI.setQuery(data, key, name[key]);
                    }
                }
            } else if (typeof name === "string") {
                data[name] = value === undefined ? null : value;
            } else {
                throw new TypeError("URI.setQuery() accepts an object, string as the name parameter");
            }
        };
        URI.removeQuery = function(data, name, value) {
            var i, length, key;
            if (isArray(name)) {
                for (i = 0, length = name.length; i < length; i++) {
                    data[name[i]] = undefined;
                }
            } else if (getType(name) === "RegExp") {
                for (key in data) {
                    if (name.test(key)) {
                        data[key] = undefined;
                    }
                }
            } else if (typeof name === "object") {
                for (key in name) {
                    if (hasOwn.call(name, key)) {
                        URI.removeQuery(data, key, name[key]);
                    }
                }
            } else if (typeof name === "string") {
                if (value !== undefined) {
                    if (getType(value) === "RegExp") {
                        if (!isArray(data[name]) && value.test(data[name])) {
                            data[name] = undefined;
                        } else {
                            data[name] = filterArrayValues(data[name], value);
                        }
                    } else if (data[name] === String(value) && (!isArray(value) || value.length === 1)) {
                        data[name] = undefined;
                    } else if (isArray(data[name])) {
                        data[name] = filterArrayValues(data[name], value);
                    }
                } else {
                    data[name] = undefined;
                }
            } else {
                throw new TypeError("URI.removeQuery() accepts an object, string, RegExp as the first parameter");
            }
        };
        URI.hasQuery = function(data, name, value, withinArray) {
            switch (getType(name)) {
              case "String":
                break;

              case "RegExp":
                for (var key in data) {
                    if (hasOwn.call(data, key)) {
                        if (name.test(key) && (value === undefined || URI.hasQuery(data, key, value))) {
                            return true;
                        }
                    }
                }
                return false;

              case "Object":
                for (var _key in name) {
                    if (hasOwn.call(name, _key)) {
                        if (!URI.hasQuery(data, _key, name[_key])) {
                            return false;
                        }
                    }
                }
                return true;

              default:
                throw new TypeError("URI.hasQuery() accepts a string, regular expression or object as the name parameter");
            }
            switch (getType(value)) {
              case "Undefined":
                return name in data;

              case "Boolean":
                var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
                return value === _booly;

              case "Function":
                return !!value(data[name], name, data);

              case "Array":
                if (!isArray(data[name])) {
                    return false;
                }
                var op = withinArray ? arrayContains : arraysEqual;
                return op(data[name], value);

              case "RegExp":
                if (!isArray(data[name])) {
                    return Boolean(data[name] && data[name].match(value));
                }
                if (!withinArray) {
                    return false;
                }
                return arrayContains(data[name], value);

              case "Number":
                value = String(value);

              case "String":
                if (!isArray(data[name])) {
                    return data[name] === value;
                }
                if (!withinArray) {
                    return false;
                }
                return arrayContains(data[name], value);

              default:
                throw new TypeError("URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter");
            }
        };
        URI.joinPaths = function() {
            var input = [];
            var segments = [];
            var nonEmptySegments = 0;
            for (var i = 0; i < arguments.length; i++) {
                var url = new URI(arguments[i]);
                input.push(url);
                var _segments = url.segment();
                for (var s = 0; s < _segments.length; s++) {
                    if (typeof _segments[s] === "string") {
                        segments.push(_segments[s]);
                    }
                    if (_segments[s]) {
                        nonEmptySegments++;
                    }
                }
            }
            if (!segments.length || !nonEmptySegments) {
                return new URI("");
            }
            var uri = new URI("").segment(segments);
            if (input[0].path() === "" || input[0].path().slice(0, 1) === "/") {
                uri.path("/" + uri.path());
            }
            return uri.normalize();
        };
        URI.commonPath = function(one, two) {
            var length = Math.min(one.length, two.length);
            var pos;
            for (pos = 0; pos < length; pos++) {
                if (one.charAt(pos) !== two.charAt(pos)) {
                    pos--;
                    break;
                }
            }
            if (pos < 1) {
                return one.charAt(0) === two.charAt(0) && one.charAt(0) === "/" ? "/" : "";
            }
            if (one.charAt(pos) !== "/" || two.charAt(pos) !== "/") {
                pos = one.substring(0, pos).lastIndexOf("/");
            }
            return one.substring(0, pos + 1);
        };
        URI.withinString = function(string, callback, options) {
            options || (options = {});
            var _start = options.start || URI.findUri.start;
            var _end = options.end || URI.findUri.end;
            var _trim = options.trim || URI.findUri.trim;
            var _parens = options.parens || URI.findUri.parens;
            var _attributeOpen = /[a-z0-9-]=["']?$/i;
            _start.lastIndex = 0;
            while (true) {
                var match = _start.exec(string);
                if (!match) {
                    break;
                }
                var start = match.index;
                if (options.ignoreHtml) {
                    var attributeOpen = string.slice(Math.max(start - 3, 0), start);
                    if (attributeOpen && _attributeOpen.test(attributeOpen)) {
                        continue;
                    }
                }
                var end = start + string.slice(start).search(_end);
                var slice = string.slice(start, end);
                var parensEnd = -1;
                while (true) {
                    var parensMatch = _parens.exec(slice);
                    if (!parensMatch) {
                        break;
                    }
                    var parensMatchEnd = parensMatch.index + parensMatch[0].length;
                    parensEnd = Math.max(parensEnd, parensMatchEnd);
                }
                if (parensEnd > -1) {
                    slice = slice.slice(0, parensEnd) + slice.slice(parensEnd).replace(_trim, "");
                } else {
                    slice = slice.replace(_trim, "");
                }
                if (slice.length <= match[0].length) {
                    continue;
                }
                if (options.ignore && options.ignore.test(slice)) {
                    continue;
                }
                end = start + slice.length;
                var result = callback(slice, start, end, string);
                if (result === undefined) {
                    _start.lastIndex = end;
                    continue;
                }
                result = String(result);
                string = string.slice(0, start) + result + string.slice(end);
                _start.lastIndex = start + result.length;
            }
            _start.lastIndex = 0;
            return string;
        };
        URI.ensureValidHostname = function(v, protocol) {
            var hasHostname = !!v;
            var hasProtocol = !!protocol;
            var rejectEmptyHostname = false;
            if (hasProtocol) {
                rejectEmptyHostname = arrayContains(URI.hostProtocols, protocol);
            }
            if (rejectEmptyHostname && !hasHostname) {
                throw new TypeError("Hostname cannot be empty, if protocol is " + protocol);
            } else if (v && v.match(URI.invalid_hostname_characters)) {
                if (!punycode) {
                    throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-:_] and Punycode.js is not available');
                }
                if (punycode.toASCII(v).match(URI.invalid_hostname_characters)) {
                    throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-:_]');
                }
            }
        };
        URI.ensureValidPort = function(v) {
            if (!v) {
                return;
            }
            var port = Number(v);
            if (isInteger(port) && port > 0 && port < 65536) {
                return;
            }
            throw new TypeError('Port "' + v + '" is not a valid port');
        };
        URI.noConflict = function(removeAll) {
            if (removeAll) {
                var unconflicted = {
                    URI: this.noConflict()
                };
                if (root.URITemplate && typeof root.URITemplate.noConflict === "function") {
                    unconflicted.URITemplate = root.URITemplate.noConflict();
                }
                if (root.IPv6 && typeof root.IPv6.noConflict === "function") {
                    unconflicted.IPv6 = root.IPv6.noConflict();
                }
                if (root.SecondLevelDomains && typeof root.SecondLevelDomains.noConflict === "function") {
                    unconflicted.SecondLevelDomains = root.SecondLevelDomains.noConflict();
                }
                return unconflicted;
            } else if (root.URI === this) {
                root.URI = _URI;
            }
            return this;
        };
        p.build = function(deferBuild) {
            if (deferBuild === true) {
                this._deferred_build = true;
            } else if (deferBuild === undefined || this._deferred_build) {
                this._string = URI.build(this._parts);
                this._deferred_build = false;
            }
            return this;
        };
        p.clone = function() {
            return new URI(this);
        };
        p.valueOf = p.toString = function() {
            return this.build(false)._string;
        };
        function generateSimpleAccessor(_part) {
            return function(v, build) {
                if (v === undefined) {
                    return this._parts[_part] || "";
                } else {
                    this._parts[_part] = v || null;
                    this.build(!build);
                    return this;
                }
            };
        }
        function generatePrefixAccessor(_part, _key) {
            return function(v, build) {
                if (v === undefined) {
                    return this._parts[_part] || "";
                } else {
                    if (v !== null) {
                        v = v + "";
                        if (v.charAt(0) === _key) {
                            v = v.substring(1);
                        }
                    }
                    this._parts[_part] = v;
                    this.build(!build);
                    return this;
                }
            };
        }
        p.protocol = generateSimpleAccessor("protocol");
        p.username = generateSimpleAccessor("username");
        p.password = generateSimpleAccessor("password");
        p.hostname = generateSimpleAccessor("hostname");
        p.port = generateSimpleAccessor("port");
        p.query = generatePrefixAccessor("query", "?");
        p.fragment = generatePrefixAccessor("fragment", "#");
        p.search = function(v, build) {
            var t = this.query(v, build);
            return typeof t === "string" && t.length ? "?" + t : t;
        };
        p.hash = function(v, build) {
            var t = this.fragment(v, build);
            return typeof t === "string" && t.length ? "#" + t : t;
        };
        p.pathname = function(v, build) {
            if (v === undefined || v === true) {
                var res = this._parts.path || (this._parts.hostname ? "/" : "");
                return v ? (this._parts.urn ? URI.decodeUrnPath : URI.decodePath)(res) : res;
            } else {
                if (this._parts.urn) {
                    this._parts.path = v ? URI.recodeUrnPath(v) : "";
                } else {
                    this._parts.path = v ? URI.recodePath(v) : "/";
                }
                this.build(!build);
                return this;
            }
        };
        p.path = p.pathname;
        p.href = function(href, build) {
            var key;
            if (href === undefined) {
                return this.toString();
            }
            this._string = "";
            this._parts = URI._parts();
            var _URI = href instanceof URI;
            var _object = typeof href === "object" && (href.hostname || href.path || href.pathname);
            if (href.nodeName) {
                var attribute = URI.getDomAttribute(href);
                href = href[attribute] || "";
                _object = false;
            }
            if (!_URI && _object && href.pathname !== undefined) {
                href = href.toString();
            }
            if (typeof href === "string" || href instanceof String) {
                this._parts = URI.parse(String(href), this._parts);
            } else if (_URI || _object) {
                var src = _URI ? href._parts : href;
                for (key in src) {
                    if (key === "query") {
                        continue;
                    }
                    if (hasOwn.call(this._parts, key)) {
                        this._parts[key] = src[key];
                    }
                }
                if (src.query) {
                    this.query(src.query, false);
                }
            } else {
                throw new TypeError("invalid input");
            }
            this.build(!build);
            return this;
        };
        p.is = function(what) {
            var ip = false;
            var ip4 = false;
            var ip6 = false;
            var name = false;
            var sld = false;
            var idn = false;
            var punycode = false;
            var relative = !this._parts.urn;
            if (this._parts.hostname) {
                relative = false;
                ip4 = URI.ip4_expression.test(this._parts.hostname);
                ip6 = URI.ip6_expression.test(this._parts.hostname);
                ip = ip4 || ip6;
                name = !ip;
                sld = name && SLD && SLD.has(this._parts.hostname);
                idn = name && URI.idn_expression.test(this._parts.hostname);
                punycode = name && URI.punycode_expression.test(this._parts.hostname);
            }
            switch (what.toLowerCase()) {
              case "relative":
                return relative;

              case "absolute":
                return !relative;

              case "domain":
              case "name":
                return name;

              case "sld":
                return sld;

              case "ip":
                return ip;

              case "ip4":
              case "ipv4":
              case "inet4":
                return ip4;

              case "ip6":
              case "ipv6":
              case "inet6":
                return ip6;

              case "idn":
                return idn;

              case "url":
                return !this._parts.urn;

              case "urn":
                return !!this._parts.urn;

              case "punycode":
                return punycode;
            }
            return null;
        };
        var _protocol = p.protocol;
        var _port = p.port;
        var _hostname = p.hostname;
        p.protocol = function(v, build) {
            if (v) {
                v = v.replace(/:(\/\/)?$/, "");
                if (!v.match(URI.protocol_expression)) {
                    throw new TypeError('Protocol "' + v + "\" contains characters other than [A-Z0-9.+-] or doesn't start with [A-Z]");
                }
            }
            return _protocol.call(this, v, build);
        };
        p.scheme = p.protocol;
        p.port = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v !== undefined) {
                if (v === 0) {
                    v = null;
                }
                if (v) {
                    v += "";
                    if (v.charAt(0) === ":") {
                        v = v.substring(1);
                    }
                    URI.ensureValidPort(v);
                }
            }
            return _port.call(this, v, build);
        };
        p.hostname = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v !== undefined) {
                var x = {
                    preventInvalidHostname: this._parts.preventInvalidHostname
                };
                var res = URI.parseHost(v, x);
                if (res !== "/") {
                    throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
                }
                v = x.hostname;
                if (this._parts.preventInvalidHostname) {
                    URI.ensureValidHostname(v, this._parts.protocol);
                }
            }
            return _hostname.call(this, v, build);
        };
        p.origin = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined) {
                var protocol = this.protocol();
                var authority = this.authority();
                if (!authority) {
                    return "";
                }
                return (protocol ? protocol + "://" : "") + this.authority();
            } else {
                var origin = URI(v);
                this.protocol(origin.protocol()).authority(origin.authority()).build(!build);
                return this;
            }
        };
        p.host = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined) {
                return this._parts.hostname ? URI.buildHost(this._parts) : "";
            } else {
                var res = URI.parseHost(v, this._parts);
                if (res !== "/") {
                    throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
                }
                this.build(!build);
                return this;
            }
        };
        p.authority = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined) {
                return this._parts.hostname ? URI.buildAuthority(this._parts) : "";
            } else {
                var res = URI.parseAuthority(v, this._parts);
                if (res !== "/") {
                    throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
                }
                this.build(!build);
                return this;
            }
        };
        p.userinfo = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined) {
                var t = URI.buildUserinfo(this._parts);
                return t ? t.substring(0, t.length - 1) : t;
            } else {
                if (v[v.length - 1] !== "@") {
                    v += "@";
                }
                URI.parseUserinfo(v, this._parts);
                this.build(!build);
                return this;
            }
        };
        p.resource = function(v, build) {
            var parts;
            if (v === undefined) {
                return this.path() + this.search() + this.hash();
            }
            parts = URI.parse(v);
            this._parts.path = parts.path;
            this._parts.query = parts.query;
            this._parts.fragment = parts.fragment;
            this.build(!build);
            return this;
        };
        p.subdomain = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined) {
                if (!this._parts.hostname || this.is("IP")) {
                    return "";
                }
                var end = this._parts.hostname.length - this.domain().length - 1;
                return this._parts.hostname.substring(0, end) || "";
            } else {
                var e = this._parts.hostname.length - this.domain().length;
                var sub = this._parts.hostname.substring(0, e);
                var replace = new RegExp("^" + escapeRegEx(sub));
                if (v && v.charAt(v.length - 1) !== ".") {
                    v += ".";
                }
                if (v.indexOf(":") !== -1) {
                    throw new TypeError("Domains cannot contain colons");
                }
                if (v) {
                    URI.ensureValidHostname(v, this._parts.protocol);
                }
                this._parts.hostname = this._parts.hostname.replace(replace, v);
                this.build(!build);
                return this;
            }
        };
        p.domain = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (typeof v === "boolean") {
                build = v;
                v = undefined;
            }
            if (v === undefined) {
                if (!this._parts.hostname || this.is("IP")) {
                    return "";
                }
                var t = this._parts.hostname.match(/\./g);
                if (t && t.length < 2) {
                    return this._parts.hostname;
                }
                var end = this._parts.hostname.length - this.tld(build).length - 1;
                end = this._parts.hostname.lastIndexOf(".", end - 1) + 1;
                return this._parts.hostname.substring(end) || "";
            } else {
                if (!v) {
                    throw new TypeError("cannot set domain empty");
                }
                if (v.indexOf(":") !== -1) {
                    throw new TypeError("Domains cannot contain colons");
                }
                URI.ensureValidHostname(v, this._parts.protocol);
                if (!this._parts.hostname || this.is("IP")) {
                    this._parts.hostname = v;
                } else {
                    var replace = new RegExp(escapeRegEx(this.domain()) + "$");
                    this._parts.hostname = this._parts.hostname.replace(replace, v);
                }
                this.build(!build);
                return this;
            }
        };
        p.tld = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (typeof v === "boolean") {
                build = v;
                v = undefined;
            }
            if (v === undefined) {
                if (!this._parts.hostname || this.is("IP")) {
                    return "";
                }
                var pos = this._parts.hostname.lastIndexOf(".");
                var tld = this._parts.hostname.substring(pos + 1);
                if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
                    return SLD.get(this._parts.hostname) || tld;
                }
                return tld;
            } else {
                var replace;
                if (!v) {
                    throw new TypeError("cannot set TLD empty");
                } else if (v.match(/[^a-zA-Z0-9-]/)) {
                    if (SLD && SLD.is(v)) {
                        replace = new RegExp(escapeRegEx(this.tld()) + "$");
                        this._parts.hostname = this._parts.hostname.replace(replace, v);
                    } else {
                        throw new TypeError('TLD "' + v + '" contains characters other than [A-Z0-9]');
                    }
                } else if (!this._parts.hostname || this.is("IP")) {
                    throw new ReferenceError("cannot set TLD on non-domain host");
                } else {
                    replace = new RegExp(escapeRegEx(this.tld()) + "$");
                    this._parts.hostname = this._parts.hostname.replace(replace, v);
                }
                this.build(!build);
                return this;
            }
        };
        p.directory = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined || v === true) {
                if (!this._parts.path && !this._parts.hostname) {
                    return "";
                }
                if (this._parts.path === "/") {
                    return "/";
                }
                var end = this._parts.path.length - this.filename().length - 1;
                var res = this._parts.path.substring(0, end) || (this._parts.hostname ? "/" : "");
                return v ? URI.decodePath(res) : res;
            } else {
                var e = this._parts.path.length - this.filename().length;
                var directory = this._parts.path.substring(0, e);
                var replace = new RegExp("^" + escapeRegEx(directory));
                if (!this.is("relative")) {
                    if (!v) {
                        v = "/";
                    }
                    if (v.charAt(0) !== "/") {
                        v = "/" + v;
                    }
                }
                if (v && v.charAt(v.length - 1) !== "/") {
                    v += "/";
                }
                v = URI.recodePath(v);
                this._parts.path = this._parts.path.replace(replace, v);
                this.build(!build);
                return this;
            }
        };
        p.filename = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (typeof v !== "string") {
                if (!this._parts.path || this._parts.path === "/") {
                    return "";
                }
                var pos = this._parts.path.lastIndexOf("/");
                var res = this._parts.path.substring(pos + 1);
                return v ? URI.decodePathSegment(res) : res;
            } else {
                var mutatedDirectory = false;
                if (v.charAt(0) === "/") {
                    v = v.substring(1);
                }
                if (v.match(/\.?\//)) {
                    mutatedDirectory = true;
                }
                var replace = new RegExp(escapeRegEx(this.filename()) + "$");
                v = URI.recodePath(v);
                this._parts.path = this._parts.path.replace(replace, v);
                if (mutatedDirectory) {
                    this.normalizePath(build);
                } else {
                    this.build(!build);
                }
                return this;
            }
        };
        p.suffix = function(v, build) {
            if (this._parts.urn) {
                return v === undefined ? "" : this;
            }
            if (v === undefined || v === true) {
                if (!this._parts.path || this._parts.path === "/") {
                    return "";
                }
                var filename = this.filename();
                var pos = filename.lastIndexOf(".");
                var s, res;
                if (pos === -1) {
                    return "";
                }
                s = filename.substring(pos + 1);
                res = /^[a-z0-9%]+$/i.test(s) ? s : "";
                return v ? URI.decodePathSegment(res) : res;
            } else {
                if (v.charAt(0) === ".") {
                    v = v.substring(1);
                }
                var suffix = this.suffix();
                var replace;
                if (!suffix) {
                    if (!v) {
                        return this;
                    }
                    this._parts.path += "." + URI.recodePath(v);
                } else if (!v) {
                    replace = new RegExp(escapeRegEx("." + suffix) + "$");
                } else {
                    replace = new RegExp(escapeRegEx(suffix) + "$");
                }
                if (replace) {
                    v = URI.recodePath(v);
                    this._parts.path = this._parts.path.replace(replace, v);
                }
                this.build(!build);
                return this;
            }
        };
        p.segment = function(segment, v, build) {
            var separator = this._parts.urn ? ":" : "/";
            var path = this.path();
            var absolute = path.substring(0, 1) === "/";
            var segments = path.split(separator);
            if (segment !== undefined && typeof segment !== "number") {
                build = v;
                v = segment;
                segment = undefined;
            }
            if (segment !== undefined && typeof segment !== "number") {
                throw new Error('Bad segment "' + segment + '", must be 0-based integer');
            }
            if (absolute) {
                segments.shift();
            }
            if (segment < 0) {
                segment = Math.max(segments.length + segment, 0);
            }
            if (v === undefined) {
                return segment === undefined ? segments : segments[segment];
            } else if (segment === null || segments[segment] === undefined) {
                if (isArray(v)) {
                    segments = [];
                    for (var i = 0, l = v.length; i < l; i++) {
                        if (!v[i].length && (!segments.length || !segments[segments.length - 1].length)) {
                            continue;
                        }
                        if (segments.length && !segments[segments.length - 1].length) {
                            segments.pop();
                        }
                        segments.push(trimSlashes(v[i]));
                    }
                } else if (v || typeof v === "string") {
                    v = trimSlashes(v);
                    if (segments[segments.length - 1] === "") {
                        segments[segments.length - 1] = v;
                    } else {
                        segments.push(v);
                    }
                }
            } else {
                if (v) {
                    segments[segment] = trimSlashes(v);
                } else {
                    segments.splice(segment, 1);
                }
            }
            if (absolute) {
                segments.unshift("");
            }
            return this.path(segments.join(separator), build);
        };
        p.segmentCoded = function(segment, v, build) {
            var segments, i, l;
            if (typeof segment !== "number") {
                build = v;
                v = segment;
                segment = undefined;
            }
            if (v === undefined) {
                segments = this.segment(segment, v, build);
                if (!isArray(segments)) {
                    segments = segments !== undefined ? URI.decode(segments) : undefined;
                } else {
                    for (i = 0, l = segments.length; i < l; i++) {
                        segments[i] = URI.decode(segments[i]);
                    }
                }
                return segments;
            }
            if (!isArray(v)) {
                v = typeof v === "string" || v instanceof String ? URI.encode(v) : v;
            } else {
                for (i = 0, l = v.length; i < l; i++) {
                    v[i] = URI.encode(v[i]);
                }
            }
            return this.segment(segment, v, build);
        };
        var q = p.query;
        p.query = function(v, build) {
            if (v === true) {
                return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            } else if (typeof v === "function") {
                var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
                var result = v.call(this, data);
                this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
                this.build(!build);
                return this;
            } else if (v !== undefined && typeof v !== "string") {
                this._parts.query = URI.buildQuery(v, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
                this.build(!build);
                return this;
            } else {
                return q.call(this, v, build);
            }
        };
        p.setQuery = function(name, value, build) {
            var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            if (typeof name === "string" || name instanceof String) {
                data[name] = value !== undefined ? value : null;
            } else if (typeof name === "object") {
                for (var key in name) {
                    if (hasOwn.call(name, key)) {
                        data[key] = name[key];
                    }
                }
            } else {
                throw new TypeError("URI.addQuery() accepts an object, string as the name parameter");
            }
            this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
            if (typeof name !== "string") {
                build = value;
            }
            this.build(!build);
            return this;
        };
        p.addQuery = function(name, value, build) {
            var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            URI.addQuery(data, name, value === undefined ? null : value);
            this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
            if (typeof name !== "string") {
                build = value;
            }
            this.build(!build);
            return this;
        };
        p.removeQuery = function(name, value, build) {
            var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            URI.removeQuery(data, name, value);
            this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
            if (typeof name !== "string") {
                build = value;
            }
            this.build(!build);
            return this;
        };
        p.hasQuery = function(name, value, withinArray) {
            var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            return URI.hasQuery(data, name, value, withinArray);
        };
        p.setSearch = p.setQuery;
        p.addSearch = p.addQuery;
        p.removeSearch = p.removeQuery;
        p.hasSearch = p.hasQuery;
        p.normalize = function() {
            if (this._parts.urn) {
                return this.normalizeProtocol(false).normalizePath(false).normalizeQuery(false).normalizeFragment(false).build();
            }
            return this.normalizeProtocol(false).normalizeHostname(false).normalizePort(false).normalizePath(false).normalizeQuery(false).normalizeFragment(false).build();
        };
        p.normalizeProtocol = function(build) {
            if (typeof this._parts.protocol === "string") {
                this._parts.protocol = this._parts.protocol.toLowerCase();
                this.build(!build);
            }
            return this;
        };
        p.normalizeHostname = function(build) {
            if (this._parts.hostname) {
                if (this.is("IDN") && punycode) {
                    this._parts.hostname = punycode.toASCII(this._parts.hostname);
                } else if (this.is("IPv6") && IPv6) {
                    this._parts.hostname = IPv6.best(this._parts.hostname);
                }
                this._parts.hostname = this._parts.hostname.toLowerCase();
                this.build(!build);
            }
            return this;
        };
        p.normalizePort = function(build) {
            if (typeof this._parts.protocol === "string" && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
                this._parts.port = null;
                this.build(!build);
            }
            return this;
        };
        p.normalizePath = function(build) {
            var _path = this._parts.path;
            if (!_path) {
                return this;
            }
            if (this._parts.urn) {
                this._parts.path = URI.recodeUrnPath(this._parts.path);
                this.build(!build);
                return this;
            }
            if (this._parts.path === "/") {
                return this;
            }
            _path = URI.recodePath(_path);
            var _was_relative;
            var _leadingParents = "";
            var _parent, _pos;
            if (_path.charAt(0) !== "/") {
                _was_relative = true;
                _path = "/" + _path;
            }
            if (_path.slice(-3) === "/.." || _path.slice(-2) === "/.") {
                _path += "/";
            }
            _path = _path.replace(/(\/(\.\/)+)|(\/\.$)/g, "/").replace(/\/{2,}/g, "/");
            if (_was_relative) {
                _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || "";
                if (_leadingParents) {
                    _leadingParents = _leadingParents[0];
                }
            }
            while (true) {
                _parent = _path.search(/\/\.\.(\/|$)/);
                if (_parent === -1) {
                    break;
                } else if (_parent === 0) {
                    _path = _path.substring(3);
                    continue;
                }
                _pos = _path.substring(0, _parent).lastIndexOf("/");
                if (_pos === -1) {
                    _pos = _parent;
                }
                _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
            }
            if (_was_relative && this.is("relative")) {
                _path = _leadingParents + _path.substring(1);
            }
            this._parts.path = _path;
            this.build(!build);
            return this;
        };
        p.normalizePathname = p.normalizePath;
        p.normalizeQuery = function(build) {
            if (typeof this._parts.query === "string") {
                if (!this._parts.query.length) {
                    this._parts.query = null;
                } else {
                    this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
                }
                this.build(!build);
            }
            return this;
        };
        p.normalizeFragment = function(build) {
            if (!this._parts.fragment) {
                this._parts.fragment = null;
                this.build(!build);
            }
            return this;
        };
        p.normalizeSearch = p.normalizeQuery;
        p.normalizeHash = p.normalizeFragment;
        p.iso8859 = function() {
            var e = URI.encode;
            var d = URI.decode;
            URI.encode = escape;
            URI.decode = decodeURIComponent;
            try {
                this.normalize();
            } finally {
                URI.encode = e;
                URI.decode = d;
            }
            return this;
        };
        p.unicode = function() {
            var e = URI.encode;
            var d = URI.decode;
            URI.encode = strictEncodeURIComponent;
            URI.decode = unescape;
            try {
                this.normalize();
            } finally {
                URI.encode = e;
                URI.decode = d;
            }
            return this;
        };
        p.readable = function() {
            var uri = this.clone();
            uri.username("").password("").normalize();
            var t = "";
            if (uri._parts.protocol) {
                t += uri._parts.protocol + "://";
            }
            if (uri._parts.hostname) {
                if (uri.is("punycode") && punycode) {
                    t += punycode.toUnicode(uri._parts.hostname);
                    if (uri._parts.port) {
                        t += ":" + uri._parts.port;
                    }
                } else {
                    t += uri.host();
                }
            }
            if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== "/") {
                t += "/";
            }
            t += uri.path(true);
            if (uri._parts.query) {
                var q = "";
                for (var i = 0, qp = uri._parts.query.split("&"), l = qp.length; i < l; i++) {
                    var kv = (qp[i] || "").split("=");
                    q += "&" + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace).replace(/&/g, "%26");
                    if (kv[1] !== undefined) {
                        q += "=" + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace).replace(/&/g, "%26");
                    }
                }
                t += "?" + q.substring(1);
            }
            t += URI.decodeQuery(uri.hash(), true);
            return t;
        };
        p.absoluteTo = function(base) {
            var resolved = this.clone();
            var properties = [ "protocol", "username", "password", "hostname", "port" ];
            var basedir, i, p;
            if (this._parts.urn) {
                throw new Error("URNs do not have any generally defined hierarchical components");
            }
            if (!(base instanceof URI)) {
                base = new URI(base);
            }
            if (resolved._parts.protocol) {
                return resolved;
            } else {
                resolved._parts.protocol = base._parts.protocol;
            }
            if (this._parts.hostname) {
                return resolved;
            }
            for (i = 0; p = properties[i]; i++) {
                resolved._parts[p] = base._parts[p];
            }
            if (!resolved._parts.path) {
                resolved._parts.path = base._parts.path;
                if (!resolved._parts.query) {
                    resolved._parts.query = base._parts.query;
                }
            } else {
                if (resolved._parts.path.substring(-2) === "..") {
                    resolved._parts.path += "/";
                }
                if (resolved.path().charAt(0) !== "/") {
                    basedir = base.directory();
                    basedir = basedir ? basedir : base.path().indexOf("/") === 0 ? "/" : "";
                    resolved._parts.path = (basedir ? basedir + "/" : "") + resolved._parts.path;
                    resolved.normalizePath();
                }
            }
            resolved.build();
            return resolved;
        };
        p.relativeTo = function(base) {
            var relative = this.clone().normalize();
            var relativeParts, baseParts, common, relativePath, basePath;
            if (relative._parts.urn) {
                throw new Error("URNs do not have any generally defined hierarchical components");
            }
            base = new URI(base).normalize();
            relativeParts = relative._parts;
            baseParts = base._parts;
            relativePath = relative.path();
            basePath = base.path();
            if (relativePath.charAt(0) !== "/") {
                throw new Error("URI is already relative");
            }
            if (basePath.charAt(0) !== "/") {
                throw new Error("Cannot calculate a URI relative to another relative URI");
            }
            if (relativeParts.protocol === baseParts.protocol) {
                relativeParts.protocol = null;
            }
            if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
                return relative.build();
            }
            if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
                return relative.build();
            }
            if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
                relativeParts.hostname = null;
                relativeParts.port = null;
            } else {
                return relative.build();
            }
            if (relativePath === basePath) {
                relativeParts.path = "";
                return relative.build();
            }
            common = URI.commonPath(relativePath, basePath);
            if (!common) {
                return relative.build();
            }
            var parents = baseParts.path.substring(common.length).replace(/[^\/]*$/, "").replace(/.*?\//g, "../");
            relativeParts.path = parents + relativeParts.path.substring(common.length) || "./";
            return relative.build();
        };
        p.equals = function(uri) {
            var one = this.clone();
            var two = new URI(uri);
            var one_map = {};
            var two_map = {};
            var checked = {};
            var one_query, two_query, key;
            one.normalize();
            two.normalize();
            if (one.toString() === two.toString()) {
                return true;
            }
            one_query = one.query();
            two_query = two.query();
            one.query("");
            two.query("");
            if (one.toString() !== two.toString()) {
                return false;
            }
            if (one_query.length !== two_query.length) {
                return false;
            }
            one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
            two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);
            for (key in one_map) {
                if (hasOwn.call(one_map, key)) {
                    if (!isArray(one_map[key])) {
                        if (one_map[key] !== two_map[key]) {
                            return false;
                        }
                    } else if (!arraysEqual(one_map[key], two_map[key])) {
                        return false;
                    }
                    checked[key] = true;
                }
            }
            for (key in two_map) {
                if (hasOwn.call(two_map, key)) {
                    if (!checked[key]) {
                        return false;
                    }
                }
            }
            return true;
        };
        p.preventInvalidHostname = function(v) {
            this._parts.preventInvalidHostname = !!v;
            return this;
        };
        p.duplicateQueryParameters = function(v) {
            this._parts.duplicateQueryParameters = !!v;
            return this;
        };
        p.escapeQuerySpace = function(v) {
            this._parts.escapeQuerySpace = !!v;
            return this;
        };
        return URI;
    });
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    var _set = __webpack_require__(52);
    var _set2 = _interopRequireDefault(_set);
    var _unset = __webpack_require__(90);
    var _unset2 = _interopRequireDefault(_unset);
    var _forEach = __webpack_require__(96);
    var _forEach2 = _interopRequireDefault(_forEach);
    var _uniqueId = __webpack_require__(120);
    var _uniqueId2 = _interopRequireDefault(_uniqueId);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }
            return arr2;
        } else {
            return Array.from(arr);
        }
    }
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    var ModuleRegistry = function() {
        function ModuleRegistry() {
            _classCallCheck(this, ModuleRegistry);
            this.registeredComponents = {};
            this.registeredMethods = {};
            this.eventListeners = {};
            this.modules = {};
        }
        _createClass(ModuleRegistry, [ {
            key: "cleanAll",
            value: function cleanAll() {
                this.registeredComponents = {};
                this.registeredMethods = {};
                this.eventListeners = {};
                this.modules = {};
            }
        }, {
            key: "registerModule",
            value: function registerModule(globalID, ModuleFactory) {
                var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
                if (this.modules[globalID]) {
                    throw new Error('A module with id "' + globalID + '" is already registered');
                }
                this.modules[globalID] = new (Function.prototype.bind.apply(ModuleFactory, [ null ].concat(_toConsumableArray(args))))();
            }
        }, {
            key: "getModule",
            value: function getModule(globalID) {
                return this.modules[globalID];
            }
        }, {
            key: "getAllModules",
            value: function getAllModules() {
                var _this = this;
                return Object.keys(this.modules).map(function(moduleId) {
                    return _this.modules[moduleId];
                });
            }
        }, {
            key: "registerComponent",
            value: function registerComponent(globalID, generator) {
                this.registeredComponents[globalID] = generator;
            }
        }, {
            key: "component",
            value: function component(globalID) {
                var generator = this.registeredComponents[globalID];
                if (!generator) {
                    console.error("ModuleRegistry.component " + globalID + " used but not yet registered");
                    return undefined;
                }
                return generator();
            }
        }, {
            key: "addListener",
            value: function addListener(globalID, callback) {
                var _this2 = this;
                var callbackKey = (0, _uniqueId2.default)("eventListener");
                (0, _set2.default)(this.eventListeners, [ globalID, callbackKey ], callback);
                return {
                    remove: function remove() {
                        return (0, _unset2.default)(_this2.eventListeners[globalID], callbackKey);
                    }
                };
            }
        }, {
            key: "notifyListeners",
            value: function notifyListeners(globalID) {
                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }
                var listenerCallbacks = this.eventListeners[globalID];
                if (!listenerCallbacks) {
                    return;
                }
                (0, _forEach2.default)(listenerCallbacks, function(callback) {
                    return invokeSafely(callback, args);
                });
            }
        }, {
            key: "registerMethod",
            value: function registerMethod(globalID, generator) {
                this.registeredMethods[globalID] = generator;
            }
        }, {
            key: "invoke",
            value: function invoke(globalID) {
                var generator = this.registeredMethods[globalID];
                if (!generator) {
                    console.error("ModuleRegistry.invoke " + globalID + " used but not yet registered");
                    return undefined;
                }
                var method = generator();
                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }
                return method.apply(undefined, args);
            }
        } ]);
        return ModuleRegistry;
    }();
    var singleton = void 0;
    if (typeof window !== "undefined") {
        singleton = window.ModuleRegistry || new ModuleRegistry();
        window.ModuleRegistry = singleton;
    } else {
        singleton = new ModuleRegistry();
    }
    exports.default = singleton;
    function invokeSafely(callback, args) {
        try {
            callback.apply(undefined, _toConsumableArray(args));
        } catch (err) {
            console.error(err);
        }
    }
}, function(module, exports) {
    var isArray = Array.isArray;
    module.exports = isArray;
}, function(module, exports) {
    var g;
    g = function() {
        return this;
    }();
    try {
        g = g || Function("return this")() || (1, eval)("this");
    } catch (e) {
        if (typeof window === "object") g = window;
    }
    module.exports = g;
}, function(module, exports) {
    module.exports = function(module) {
        if (!module.webpackPolyfill) {
            module.deprecate = function() {};
            module.paths = [];
            if (!module.children) module.children = [];
            Object.defineProperty(module, "loaded", {
                enumerable: true,
                get: function() {
                    return module.l;
                }
            });
            Object.defineProperty(module, "id", {
                enumerable: true,
                get: function() {
                    return module.i;
                }
            });
            module.webpackPolyfill = 1;
        }
        return module;
    };
}, function(module, exports, __webpack_require__) {
    var Symbol = __webpack_require__(21), getRawTag = __webpack_require__(58), objectToString = __webpack_require__(59);
    var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
    function baseGetTag(value) {
        if (value == null) {
            return value === undefined ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module.exports = baseGetTag;
}, function(module, exports, __webpack_require__) {
    var freeGlobal = __webpack_require__(33);
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module.exports = root;
}, function(module, exports) {
    function isObjectLike(value) {
        return value != null && typeof value == "object";
    }
    module.exports = isObjectLike;
}, function(module, exports, __webpack_require__) {
    var getNative = __webpack_require__(20);
    var nativeCreate = getNative(Object, "create");
    module.exports = nativeCreate;
}, function(module, exports, __webpack_require__) {
    var eq = __webpack_require__(34);
    function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
            if (eq(array[length][0], key)) {
                return length;
            }
        }
        return -1;
    }
    module.exports = assocIndexOf;
}, function(module, exports, __webpack_require__) {
    var isKeyable = __webpack_require__(84);
    function getMapData(map, key) {
        var data = map.__data__;
        return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    module.exports = getMapData;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var PageComponentId;
    (function(PageComponentId) {
        PageComponentId["Home"] = "home";
        PageComponentId["Settings"] = "settings-lazy-module";
        PageComponentId["SiteSettings"] = "site-settings-lazy-module";
        PageComponentId["Gdpr"] = "gdpr-users-client-page-component";
        PageComponentId["Engage"] = "engage";
        PageComponentId["EngageCrazyChat"] = "engage-crazy-chat";
        PageComponentId["InboxSettings"] = "inbox-settings";
        PageComponentId["Notes"] = "notes.lazy-component";
        PageComponentId["PriceQuotes"] = "price-quotes";
        PageComponentId["Invoices"] = "invoices";
        PageComponentId["InvoicesSettings"] = "invoices-settings";
        PageComponentId["Stores"] = "ecom";
        PageComponentId["StoresTax"] = "stores.tax";
        PageComponentId["Shoutout"] = "shoutout";
        PageComponentId["ShoutoutCompliance"] = "shoutout-compliance";
        PageComponentId["PromoteSeo"] = "PromoteSeoLazyComponent";
        PageComponentId["Cashier"] = "cashier-merchant-settings";
        PageComponentId["AppMarket"] = "app-market-lazy-page-component";
        PageComponentId["AppMarketMyApps"] = "app-market-my-apps-component";
        PageComponentId["SellAnywhere"] = "stores.marketplaces.entry";
        PageComponentId["Bookings"] = "bookings-lazy-module";
        PageComponentId["ContactBookings"] = "bookings.contact-bookings-lazy";
        PageComponentId["Contacts"] = "contacts-page-component";
        PageComponentId["MemberPermissions"] = "member-permissions";
        PageComponentId["WixForms"] = "form-builder-component";
        PageComponentId["Seo"] = "seo-page-component";
        PageComponentId["SocialBlog"] = "social-blog";
        PageComponentId["Blog"] = "blog-page-component";
        PageComponentId["Triggers"] = "triggers-page-component";
        PageComponentId["Example_React"] = "demo-react-lazy";
        PageComponentId["Example_Angular"] = "demo-angular-lazy";
        PageComponentId["Etpa_Container"] = "etpa-container-lazy-module";
        PageComponentId["Coupons"] = "coupons";
        PageComponentId["Restaurants"] = "restaurants";
        PageComponentId["CodeEmbed"] = "code-embed-lazy-page-component";
        PageComponentId["Events"] = "events";
        PageComponentId["MusicManagerMyAlbums"] = "music-manager.my-albums";
        PageComponentId["VideoLibrary"] = "video.video-library-lazy-page";
        PageComponentId["VideoMaker"] = "video-editor.videos";
        PageComponentId["PhotoAlbums"] = "photography-albums-id";
        PageComponentId["ArtStoreMain"] = "ART_STORE_MAIN";
        PageComponentId["ArtStoreChooseProvider"] = "ART_STORE_CHOOSE_PROVIDER_COMPONENT";
        PageComponentId["Multilingual"] = "multilingual-homepage";
        PageComponentId["MarketingIntegration"] = "MarketingIntegrationLazyComponent";
        PageComponentId["WixCodeDatabase"] = "wix-databases-lazy-page-component-id";
        PageComponentId["AdminPage"] = "admin-pages";
        PageComponentId["TasksWeb"] = "tasks-web";
        PageComponentId["TransactionalEmails"] = "transactional-emails";
        PageComponentId["OldEcom"] = "old-ecom-app";
        PageComponentId["TeSmartActionsWidget"] = "te-smart-actions-widget";
        PageComponentId["Membership"] = "membership-lazy-component";
        PageComponentId["ShareitWeb"] = "share-it-web-lazy-component";
        PageComponentId["LogoBuilderLandingPage"] = "logo-builder-landing-page-lazy-component-id";
        PageComponentId["Workflow"] = "workflow-component";
        PageComponentId["Platforms101Workshop"] = "platforms-workshop-page-id";
        PageComponentId["PromoteHome"] = "PromoteHomeLazyComponent";
    })(PageComponentId = exports.PageComponentId || (exports.PageComponentId = {}));
}, function(module, exports) {
    var core = module.exports = {
        version: "2.5.7"
    };
    if (typeof __e == "number") __e = core;
}, function(module, exports, __webpack_require__) {
    module.exports = !__webpack_require__(30)(function() {
        return Object.defineProperty({}, "a", {
            get: function() {
                return 7;
            }
        }).a != 7;
    });
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var tslib_1 = __webpack_require__(31);
    tslib_1.__exportStar(__webpack_require__(50), exports);
    tslib_1.__exportStar(__webpack_require__(51), exports);
    tslib_1.__exportStar(__webpack_require__(26), exports);
    tslib_1.__exportStar(__webpack_require__(27), exports);
    tslib_1.__exportStar(__webpack_require__(39), exports);
    tslib_1.__exportStar(__webpack_require__(13), exports);
    tslib_1.__exportStar(__webpack_require__(121), exports);
    tslib_1.__exportStar(__webpack_require__(158), exports);
    tslib_1.__exportStar(__webpack_require__(159), exports);
    tslib_1.__exportStar(__webpack_require__(160), exports);
    tslib_1.__exportStar(__webpack_require__(161), exports);
    tslib_1.__exportStar(__webpack_require__(162), exports);
    tslib_1.__exportStar(__webpack_require__(163), exports);
    tslib_1.__exportStar(__webpack_require__(164), exports);
    tslib_1.__exportStar(__webpack_require__(165), exports);
}, function(module, exports, __webpack_require__) {
    (function(module, global) {
        var __WEBPACK_AMD_DEFINE_RESULT__;
        (function(root) {
            var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
            var freeModule = typeof module == "object" && module && !module.nodeType && module;
            var freeGlobal = typeof global == "object" && global;
            if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal) {
                root = freeGlobal;
            }
            var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
                overflow: "Overflow: input needs wider integers to process",
                "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                "invalid-input": "Invalid input"
            }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
            function error(type) {
                throw new RangeError(errors[type]);
            }
            function map(array, fn) {
                var length = array.length;
                var result = [];
                while (length--) {
                    result[length] = fn(array[length]);
                }
                return result;
            }
            function mapDomain(string, fn) {
                var parts = string.split("@");
                var result = "";
                if (parts.length > 1) {
                    result = parts[0] + "@";
                    string = parts[1];
                }
                string = string.replace(regexSeparators, ".");
                var labels = string.split(".");
                var encoded = map(labels, fn).join(".");
                return result + encoded;
            }
            function ucs2decode(string) {
                var output = [], counter = 0, length = string.length, value, extra;
                while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 55296 && value <= 56319 && counter < length) {
                        extra = string.charCodeAt(counter++);
                        if ((extra & 64512) == 56320) {
                            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
                        } else {
                            output.push(value);
                            counter--;
                        }
                    } else {
                        output.push(value);
                    }
                }
                return output;
            }
            function ucs2encode(array) {
                return map(array, function(value) {
                    var output = "";
                    if (value > 65535) {
                        value -= 65536;
                        output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                        value = 56320 | value & 1023;
                    }
                    output += stringFromCharCode(value);
                    return output;
                }).join("");
            }
            function basicToDigit(codePoint) {
                if (codePoint - 48 < 10) {
                    return codePoint - 22;
                }
                if (codePoint - 65 < 26) {
                    return codePoint - 65;
                }
                if (codePoint - 97 < 26) {
                    return codePoint - 97;
                }
                return base;
            }
            function digitToBasic(digit, flag) {
                return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
            }
            function adapt(delta, numPoints, firstTime) {
                var k = 0;
                delta = firstTime ? floor(delta / damp) : delta >> 1;
                delta += floor(delta / numPoints);
                for (;delta > baseMinusTMin * tMax >> 1; k += base) {
                    delta = floor(delta / baseMinusTMin);
                }
                return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
            }
            function decode(input) {
                var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
                basic = input.lastIndexOf(delimiter);
                if (basic < 0) {
                    basic = 0;
                }
                for (j = 0; j < basic; ++j) {
                    if (input.charCodeAt(j) >= 128) {
                        error("not-basic");
                    }
                    output.push(input.charCodeAt(j));
                }
                for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
                    for (oldi = i, w = 1, k = base; ;k += base) {
                        if (index >= inputLength) {
                            error("invalid-input");
                        }
                        digit = basicToDigit(input.charCodeAt(index++));
                        if (digit >= base || digit > floor((maxInt - i) / w)) {
                            error("overflow");
                        }
                        i += digit * w;
                        t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                        if (digit < t) {
                            break;
                        }
                        baseMinusT = base - t;
                        if (w > floor(maxInt / baseMinusT)) {
                            error("overflow");
                        }
                        w *= baseMinusT;
                    }
                    out = output.length + 1;
                    bias = adapt(i - oldi, out, oldi == 0);
                    if (floor(i / out) > maxInt - n) {
                        error("overflow");
                    }
                    n += floor(i / out);
                    i %= out;
                    output.splice(i++, 0, n);
                }
                return ucs2encode(output);
            }
            function encode(input) {
                var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
                input = ucs2decode(input);
                inputLength = input.length;
                n = initialN;
                delta = 0;
                bias = initialBias;
                for (j = 0; j < inputLength; ++j) {
                    currentValue = input[j];
                    if (currentValue < 128) {
                        output.push(stringFromCharCode(currentValue));
                    }
                }
                handledCPCount = basicLength = output.length;
                if (basicLength) {
                    output.push(delimiter);
                }
                while (handledCPCount < inputLength) {
                    for (m = maxInt, j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue >= n && currentValue < m) {
                            m = currentValue;
                        }
                    }
                    handledCPCountPlusOne = handledCPCount + 1;
                    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                        error("overflow");
                    }
                    delta += (m - n) * handledCPCountPlusOne;
                    n = m;
                    for (j = 0; j < inputLength; ++j) {
                        currentValue = input[j];
                        if (currentValue < n && ++delta > maxInt) {
                            error("overflow");
                        }
                        if (currentValue == n) {
                            for (q = delta, k = base; ;k += base) {
                                t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                                if (q < t) {
                                    break;
                                }
                                qMinusT = q - t;
                                baseMinusT = base - t;
                                output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                                q = floor(qMinusT / baseMinusT);
                            }
                            output.push(stringFromCharCode(digitToBasic(q, 0)));
                            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                            delta = 0;
                            ++handledCPCount;
                        }
                    }
                    ++delta;
                    ++n;
                }
                return output.join("");
            }
            function toUnicode(input) {
                return mapDomain(input, function(string) {
                    return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
                });
            }
            function toASCII(input) {
                return mapDomain(input, function(string) {
                    return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
                });
            }
            punycode = {
                version: "1.3.2",
                ucs2: {
                    decode: ucs2decode,
                    encode: ucs2encode
                },
                decode: decode,
                encode: encode,
                toASCII: toASCII,
                toUnicode: toUnicode
            };
            if (true) {
                !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
                    return punycode;
                }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
            } else {}
        })(this);
    }).call(this, __webpack_require__(6)(module), __webpack_require__(5));
}, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;
    (function(root, factory) {
        "use strict";
        if (typeof module === "object" && module.exports) {
            module.exports = factory();
        } else if (true) {
            !(__WEBPACK_AMD_DEFINE_FACTORY__ = factory, __WEBPACK_AMD_DEFINE_RESULT__ = typeof __WEBPACK_AMD_DEFINE_FACTORY__ === "function" ? __WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module) : __WEBPACK_AMD_DEFINE_FACTORY__, 
            __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        } else {}
    })(this, function(root) {
        "use strict";
        var _IPv6 = root && root.IPv6;
        function bestPresentation(address) {
            var _address = address.toLowerCase();
            var segments = _address.split(":");
            var length = segments.length;
            var total = 8;
            if (segments[0] === "" && segments[1] === "" && segments[2] === "") {
                segments.shift();
                segments.shift();
            } else if (segments[0] === "" && segments[1] === "") {
                segments.shift();
            } else if (segments[length - 1] === "" && segments[length - 2] === "") {
                segments.pop();
            }
            length = segments.length;
            if (segments[length - 1].indexOf(".") !== -1) {
                total = 7;
            }
            var pos;
            for (pos = 0; pos < length; pos++) {
                if (segments[pos] === "") {
                    break;
                }
            }
            if (pos < total) {
                segments.splice(pos, 1, "0000");
                while (segments.length < total) {
                    segments.splice(pos, 0, "0000");
                }
            }
            var _segments;
            for (var i = 0; i < total; i++) {
                _segments = segments[i].split("");
                for (var j = 0; j < 3; j++) {
                    if (_segments[0] === "0" && _segments.length > 1) {
                        _segments.splice(0, 1);
                    } else {
                        break;
                    }
                }
                segments[i] = _segments.join("");
            }
            var best = -1;
            var _best = 0;
            var _current = 0;
            var current = -1;
            var inzeroes = false;
            for (i = 0; i < total; i++) {
                if (inzeroes) {
                    if (segments[i] === "0") {
                        _current += 1;
                    } else {
                        inzeroes = false;
                        if (_current > _best) {
                            best = current;
                            _best = _current;
                        }
                    }
                } else {
                    if (segments[i] === "0") {
                        inzeroes = true;
                        current = i;
                        _current = 1;
                    }
                }
            }
            if (_current > _best) {
                best = current;
                _best = _current;
            }
            if (_best > 1) {
                segments.splice(best, _best, "");
            }
            length = segments.length;
            var result = "";
            if (segments[0] === "") {
                result = ":";
            }
            for (i = 0; i < length; i++) {
                result += segments[i];
                if (i === length - 1) {
                    break;
                }
                result += ":";
            }
            if (segments[length - 1] === "") {
                result += ":";
            }
            return result;
        }
        function noConflict() {
            if (root.IPv6 === this) {
                root.IPv6 = _IPv6;
            }
            return this;
        }
        return {
            best: bestPresentation,
            noConflict: noConflict
        };
    });
}, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;
    (function(root, factory) {
        "use strict";
        if (typeof module === "object" && module.exports) {
            module.exports = factory();
        } else if (true) {
            !(__WEBPACK_AMD_DEFINE_FACTORY__ = factory, __WEBPACK_AMD_DEFINE_RESULT__ = typeof __WEBPACK_AMD_DEFINE_FACTORY__ === "function" ? __WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module) : __WEBPACK_AMD_DEFINE_FACTORY__, 
            __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        } else {}
    })(this, function(root) {
        "use strict";
        var _SecondLevelDomains = root && root.SecondLevelDomains;
        var SLD = {
            list: {
                ac: " com gov mil net org ",
                ae: " ac co gov mil name net org pro sch ",
                af: " com edu gov net org ",
                al: " com edu gov mil net org ",
                ao: " co ed gv it og pb ",
                ar: " com edu gob gov int mil net org tur ",
                at: " ac co gv or ",
                au: " asn com csiro edu gov id net org ",
                ba: " co com edu gov mil net org rs unbi unmo unsa untz unze ",
                bb: " biz co com edu gov info net org store tv ",
                bh: " biz cc com edu gov info net org ",
                bn: " com edu gov net org ",
                bo: " com edu gob gov int mil net org tv ",
                br: " adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ",
                bs: " com edu gov net org ",
                bz: " du et om ov rg ",
                ca: " ab bc mb nb nf nl ns nt nu on pe qc sk yk ",
                ck: " biz co edu gen gov info net org ",
                cn: " ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ",
                co: " com edu gov mil net nom org ",
                cr: " ac c co ed fi go or sa ",
                cy: " ac biz com ekloges gov ltd name net org parliament press pro tm ",
                "do": " art com edu gob gov mil net org sld web ",
                dz: " art asso com edu gov net org pol ",
                ec: " com edu fin gov info med mil net org pro ",
                eg: " com edu eun gov mil name net org sci ",
                er: " com edu gov ind mil net org rochest w ",
                es: " com edu gob nom org ",
                et: " biz com edu gov info name net org ",
                fj: " ac biz com info mil name net org pro ",
                fk: " ac co gov net nom org ",
                fr: " asso com f gouv nom prd presse tm ",
                gg: " co net org ",
                gh: " com edu gov mil org ",
                gn: " ac com gov net org ",
                gr: " com edu gov mil net org ",
                gt: " com edu gob ind mil net org ",
                gu: " com edu gov net org ",
                hk: " com edu gov idv net org ",
                hu: " 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ",
                id: " ac co go mil net or sch web ",
                il: " ac co gov idf k12 muni net org ",
                "in": " ac co edu ernet firm gen gov i ind mil net nic org res ",
                iq: " com edu gov i mil net org ",
                ir: " ac co dnssec gov i id net org sch ",
                it: " edu gov ",
                je: " co net org ",
                jo: " com edu gov mil name net org sch ",
                jp: " ac ad co ed go gr lg ne or ",
                ke: " ac co go info me mobi ne or sc ",
                kh: " com edu gov mil net org per ",
                ki: " biz com de edu gov info mob net org tel ",
                km: " asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ",
                kn: " edu gov net org ",
                kr: " ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ",
                kw: " com edu gov net org ",
                ky: " com edu gov net org ",
                kz: " com edu gov mil net org ",
                lb: " com edu gov net org ",
                lk: " assn com edu gov grp hotel int ltd net ngo org sch soc web ",
                lr: " com edu gov net org ",
                lv: " asn com conf edu gov id mil net org ",
                ly: " com edu gov id med net org plc sch ",
                ma: " ac co gov m net org press ",
                mc: " asso tm ",
                me: " ac co edu gov its net org priv ",
                mg: " com edu gov mil nom org prd tm ",
                mk: " com edu gov inf name net org pro ",
                ml: " com edu gov net org presse ",
                mn: " edu gov org ",
                mo: " com edu gov net org ",
                mt: " com edu gov net org ",
                mv: " aero biz com coop edu gov info int mil museum name net org pro ",
                mw: " ac co com coop edu gov int museum net org ",
                mx: " com edu gob net org ",
                my: " com edu gov mil name net org sch ",
                nf: " arts com firm info net other per rec store web ",
                ng: " biz com edu gov mil mobi name net org sch ",
                ni: " ac co com edu gob mil net nom org ",
                np: " com edu gov mil net org ",
                nr: " biz com edu gov info net org ",
                om: " ac biz co com edu gov med mil museum net org pro sch ",
                pe: " com edu gob mil net nom org sld ",
                ph: " com edu gov i mil net ngo org ",
                pk: " biz com edu fam gob gok gon gop gos gov net org web ",
                pl: " art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ",
                pr: " ac biz com edu est gov info isla name net org pro prof ",
                ps: " com edu gov net org plo sec ",
                pw: " belau co ed go ne or ",
                ro: " arts com firm info nom nt org rec store tm www ",
                rs: " ac co edu gov in org ",
                sb: " com edu gov net org ",
                sc: " com edu gov net org ",
                sh: " co com edu gov net nom org ",
                sl: " com edu gov net org ",
                st: " co com consulado edu embaixada gov mil net org principe saotome store ",
                sv: " com edu gob org red ",
                sz: " ac co org ",
                tr: " av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ",
                tt: " aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ",
                tw: " club com ebiz edu game gov idv mil net org ",
                mu: " ac co com gov net or org ",
                mz: " ac co edu gov org ",
                na: " co com ",
                nz: " ac co cri geek gen govt health iwi maori mil net org parliament school ",
                pa: " abo ac com edu gob ing med net nom org sld ",
                pt: " com edu gov int net nome org publ ",
                py: " com edu gov mil net org ",
                qa: " com edu gov mil net org ",
                re: " asso com nom ",
                ru: " ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ",
                rw: " ac co com edu gouv gov int mil net ",
                sa: " com edu gov med net org pub sch ",
                sd: " com edu gov info med net org tv ",
                se: " a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ",
                sg: " com edu gov idn net org per ",
                sn: " art com edu gouv org perso univ ",
                sy: " com edu gov mil net news org ",
                th: " ac co go in mi net or ",
                tj: " ac biz co com edu go gov info int mil name net nic org test web ",
                tn: " agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ",
                tz: " ac co go ne or ",
                ua: " biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ",
                ug: " ac co go ne or org sc ",
                uk: " ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ",
                us: " dni fed isa kids nsn ",
                uy: " com edu gub mil net org ",
                ve: " co com edu gob info mil net org web ",
                vi: " co com k12 net org ",
                vn: " ac biz com edu gov health info int name net org pro ",
                ye: " co com gov ltd me net org plc ",
                yu: " ac co edu gov org ",
                za: " ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ",
                zm: " ac co com edu gov net org sch ",
                com: "ar br cn de eu gb gr hu jpn kr no qc ru sa se uk us uy za ",
                net: "gb jp se uk ",
                org: "ae",
                de: "com "
            },
            has: function(domain) {
                var tldOffset = domain.lastIndexOf(".");
                if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
                    return false;
                }
                var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
                if (sldOffset <= 0 || sldOffset >= tldOffset - 1) {
                    return false;
                }
                var sldList = SLD.list[domain.slice(tldOffset + 1)];
                if (!sldList) {
                    return false;
                }
                return sldList.indexOf(" " + domain.slice(sldOffset + 1, tldOffset) + " ") >= 0;
            },
            is: function(domain) {
                var tldOffset = domain.lastIndexOf(".");
                if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
                    return false;
                }
                var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
                if (sldOffset >= 0) {
                    return false;
                }
                var sldList = SLD.list[domain.slice(tldOffset + 1)];
                if (!sldList) {
                    return false;
                }
                return sldList.indexOf(" " + domain.slice(0, tldOffset) + " ") >= 0;
            },
            get: function(domain) {
                var tldOffset = domain.lastIndexOf(".");
                if (tldOffset <= 0 || tldOffset >= domain.length - 1) {
                    return null;
                }
                var sldOffset = domain.lastIndexOf(".", tldOffset - 1);
                if (sldOffset <= 0 || sldOffset >= tldOffset - 1) {
                    return null;
                }
                var sldList = SLD.list[domain.slice(tldOffset + 1)];
                if (!sldList) {
                    return null;
                }
                if (sldList.indexOf(" " + domain.slice(sldOffset + 1, tldOffset) + " ") < 0) {
                    return null;
                }
                return domain.slice(sldOffset + 1);
            },
            noConflict: function() {
                if (root.SecondLevelDomains === this) {
                    root.SecondLevelDomains = _SecondLevelDomains;
                }
                return this;
            }
        };
        return SLD;
    });
}, function(module, exports, __webpack_require__) {
    var baseIsNative = __webpack_require__(57), getValue = __webpack_require__(63);
    function getNative(object, key) {
        var value = getValue(object, key);
        return baseIsNative(value) ? value : undefined;
    }
    module.exports = getNative;
}, function(module, exports, __webpack_require__) {
    var root = __webpack_require__(8);
    var Symbol = root.Symbol;
    module.exports = Symbol;
}, function(module, exports) {
    function isObject(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
    }
    module.exports = isObject;
}, function(module, exports, __webpack_require__) {
    var isArray = __webpack_require__(4), isKey = __webpack_require__(64), stringToPath = __webpack_require__(65), toString = __webpack_require__(35);
    function castPath(value, object) {
        if (isArray(value)) {
            return value;
        }
        return isKey(value, object) ? [ value ] : stringToPath(toString(value));
    }
    module.exports = castPath;
}, function(module, exports, __webpack_require__) {
    var baseGetTag = __webpack_require__(7), isObjectLike = __webpack_require__(9);
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module.exports = isSymbol;
}, function(module, exports, __webpack_require__) {
    var isSymbol = __webpack_require__(24);
    var INFINITY = 1 / 0;
    function toKey(value) {
        if (typeof value == "string" || isSymbol(value)) {
            return value;
        }
        var result = value + "";
        return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module.exports = toKey;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ModuleId;
    (function(ModuleId) {
        ModuleId["Home"] = "HOME";
        ModuleId["Settings"] = "SETTINGS";
        ModuleId["SiteSettings"] = "SITE_SETTINGS";
        ModuleId["Gdpr"] = "GDPR_USERS_CLIENT";
        ModuleId["Engage"] = "ENGAGE";
        ModuleId["EngageAngular"] = "ENGAGE_ANGULAR";
        ModuleId["Invoices"] = "INVOICES";
        ModuleId["PriceQuotes"] = "PRICE_QUOTES";
        ModuleId["Stores"] = "STORES";
        ModuleId["Shoutout"] = "SHOUTOUT";
        ModuleId["Cashier"] = "CASHIER";
        ModuleId["AppMarket"] = "APP_MARKET";
        ModuleId["SellAnywhere"] = "SELL_ANYWHERE";
        ModuleId["Bookings"] = "BOOKINGS";
        ModuleId["Contacts"] = "CONTACTS";
        ModuleId["MemberPermissions"] = "MEMBER_PERMISSIONS";
        ModuleId["EditorPermissions"] = "EDITOR_PERMISSIONS";
        ModuleId["WixForms"] = "WIX_FORMS";
        ModuleId["Examples"] = "EXAMPLES";
        ModuleId["PromoteSeo"] = "PROMOTE_SEO";
        ModuleId["Restaurants"] = "RESTAURANTS";
        ModuleId["EtpaContainer"] = "ETPA_CONTAINER";
        ModuleId["Coupons"] = "COUPONS";
        ModuleId["Triggers"] = "TRIGGERS";
        ModuleId["CodeEmbed"] = "CODE_EMBED";
        ModuleId["Events"] = "EVENTS";
        ModuleId["MusicManager"] = "MUSIC_MANAGER";
        ModuleId["Video"] = "VIDEO";
        ModuleId["VideoMaker"] = "VIDEO_MAKER";
        ModuleId["PhotoAlbums"] = "PHOTOGRAPHY-ALBUMS";
        ModuleId["ArtStore"] = "PHOTOGRAPHY-GALLERY";
        ModuleId["SocialBlog"] = "SOCIAL_BLOG";
        ModuleId["Multilingual"] = "MULTILINGUAL";
        ModuleId["MarketingIntegration"] = "MARKETING_INTEGRATION";
        ModuleId["WixCodeDatabase"] = "WIX_DATABASES";
        ModuleId["AdminPage"] = "ADMIN_PAGES";
        ModuleId["TasksWeb"] = "TASKS_WEB";
        ModuleId["OldEcom"] = "OLD_ECOM";
        ModuleId["Membership"] = "MEMBERSHIP";
        ModuleId["ShareitWeb"] = "SHARE_IT_WEB";
        ModuleId["Workflow"] = "WORKFLOW";
        ModuleId["PromoteHome"] = "PROMOTE_HOME";
    })(ModuleId = exports.ModuleId || (exports.ModuleId = {}));
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.appDefIds = {
        wixECommerce: "1380b703-ce81-ff05-f115-39571d94dfcd",
        shoutout: "135c3d92-0fea-1f9d-2ba5-2a1dfb04297e",
        invoices: "13ee94c1-b635-8505-3391-97919052c16f",
        priceQuotes: "55cd9036-36bb-480b-8ddc-afda3cb2eb8d",
        engage: "141fbfae-511e-6817-c9f0-48993a7547d1",
        contacts: "13e1bb7b-4988-1953-88b6-2812f8fed2e7",
        cashier: "14bca956-e09f-f4d6-14d7-466cb3f09103",
        wixBookings: "13d21c63-b5ec-5912-8397-c3a5ddb27a97",
        restaurants: "13c1402c-27f2-d4ab-7463-ee7c89e07578",
        hotels: "135aad86-9125-6074-7346-29dc6a3c9bcf",
        restaurantsKit: "14583ff5-e781-063a-3bc4-6b79fb966992",
        restaurantsOrders: "13e8d036-5516-6104-b456-c8466db39542",
        restaurantsSeating: "1475ab65-206b-d79a-856d-fa10bdb479ea",
        orders: "13e8d036-5516-6104-b456-c8466db39542",
        kit: "14583ff5-e781-063a-3bc4-6b79fb966992",
        wixContactForm: "ContactForm",
        wixSubscriptionForm: "13bd3cab-9ae3-852f-a4a9-6087f6e6c50a",
        wixSiteMembers: "SiteMembers",
        formBuilder123: "12aacf69-f3fb-5334-2847-e00a8f13c12f",
        getSubscribers: "1375baa8-8eca-5659-ce9d-455b2009250d",
        constantContact: "13472cb5-8c98-0884-ad1b-95ddfe1577d4",
        oldWixECommerce: "ECommerce",
        triggers: "139ef4fa-c108-8f9a-c7be-d5f492a2c939",
        wixForms: "14ce1214-b278-a7e4-1373-00cebd1bef7c",
        siteSettings: "13c7f09a-f020-6081-9f8c-e5872ab474e0",
        gmail: "130513da-106b-c416-6418-8464c68e7228",
        wixMusic: "13bb5d67-1add-e770-a71f-001277e17c57",
        scheduler: "13d21c63-b5ec-5912-8397-c3a5ddb27a97",
        quotes: "13ee94c1-b635-8505-3391-97919052c16f",
        inbox: "141fbfae-511e-6817-c9f0-48993a7547d1",
        seoWizard: "1480c568-5cbd-9392-5604-1148f5faffa0",
        oldSeo: "130e98ba-8b86-2a9b-4e5b-aee5345cb49a",
        events: "140603ad-af8d-84a5-2c80-a0f60cb47351",
        video: "14409595-f076-4753-8303-9a86f9f71469",
        videoMaker: "14e12b04-943e-fd32-456d-70b1820a2ff2",
        chat: "14517e1a-3ff0-af98-408e-2bd6953c36a2",
        promote: "14b89688-9b25-5214-d1cb-a3fb9683618b",
        promoteSeo: "1480c568-5cbd-9392-5604-1148f5faffa0",
        engageEmail: "143b5694-c94b-2eba-62a5-fbb94bde27c4",
        photographers: "13ff8629-c1fc-e289-e81f-bc8c8968e9d6",
        artStore: "147ab90e-91c5-21b2-d6ca-444c28c8a23b",
        emptyGuid: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        socialBlog: "14bcded7-0066-7c35-14d7-466cb3f09103",
        blog: "61f33d50-3002-4882-ae86-d319c1a249ab",
        wixCodeApp: "CloudSiteExtension",
        insights: "14986290-586b-b5cb-cc68-cba25a16ff54",
        facebookAds: "143e2a90-2b87-5318-1dea-c8e35204db73",
        coupons: "14d7032a-0a65-5270-cca7-30f599708fed",
        wixCode: "675bbcef-18d8-41f5-800e-131ec9e08762",
        multilingual: "14d84998-ae09-1abf-c6fc-3f3cace5bf19",
        marketingIntegration: "150ae7ee-c74a-eecd-d3d7-2112895b988a",
        oldMagentoStore: "55a88716-958a-4b91-b666-6c1118abdee4",
        membership: "1522827f-c56c-a5c9-2ac9-00f9e6ae12d3",
        wixChat: "14517e1a-3ff0-af98-408e-2bd6953c36a2",
        platforms101Workshop: "366624a5-4c5e-48c4-8147-86638ec2d010",
        promoteHome: "f123e8f1-4350-4c9b-b269-04adfadda977"
    };
    exports.verticalNames = [ "wixECommerce", "wixBookings", "hotels", "restaurants", "restaurantsKit", "restaurantsOrders", "restaurantsSeating", "wixMusic", "scheduler", "events", "video", "photographers", "artStore", "blog", "socialBlog", "coupons", "membership", "wixForms", "multilingual", "wixChat", "platforms101Workshop" ];
    exports.verticals = exports.verticalNames.reduce(function(res, key) {
        res[exports.appDefIds[key]] = {
            name: key,
            id: exports.appDefIds[key]
        };
        return res;
    }, {});
}, function(module, exports) {
    var global = module.exports = typeof window != "undefined" && window.Math == Math ? window : typeof self != "undefined" && self.Math == Math ? self : Function("return this")();
    if (typeof __g == "number") __g = global;
}, function(module, exports) {
    module.exports = function(it) {
        return typeof it === "object" ? it !== null : typeof it === "function";
    };
}, function(module, exports) {
    module.exports = function(exec) {
        try {
            return !!exec();
        } catch (e) {
            return true;
        }
    };
}, function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, "__extends", function() {
        return __extends;
    });
    __webpack_require__.d(__webpack_exports__, "__assign", function() {
        return __assign;
    });
    __webpack_require__.d(__webpack_exports__, "__rest", function() {
        return __rest;
    });
    __webpack_require__.d(__webpack_exports__, "__decorate", function() {
        return __decorate;
    });
    __webpack_require__.d(__webpack_exports__, "__param", function() {
        return __param;
    });
    __webpack_require__.d(__webpack_exports__, "__metadata", function() {
        return __metadata;
    });
    __webpack_require__.d(__webpack_exports__, "__awaiter", function() {
        return __awaiter;
    });
    __webpack_require__.d(__webpack_exports__, "__generator", function() {
        return __generator;
    });
    __webpack_require__.d(__webpack_exports__, "__exportStar", function() {
        return __exportStar;
    });
    __webpack_require__.d(__webpack_exports__, "__values", function() {
        return __values;
    });
    __webpack_require__.d(__webpack_exports__, "__read", function() {
        return __read;
    });
    __webpack_require__.d(__webpack_exports__, "__spread", function() {
        return __spread;
    });
    __webpack_require__.d(__webpack_exports__, "__await", function() {
        return __await;
    });
    __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() {
        return __asyncGenerator;
    });
    __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() {
        return __asyncDelegator;
    });
    __webpack_require__.d(__webpack_exports__, "__asyncValues", function() {
        return __asyncValues;
    });
    __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() {
        return __makeTemplateObject;
    });
    __webpack_require__.d(__webpack_exports__, "__importStar", function() {
        return __importStar;
    });
    __webpack_require__.d(__webpack_exports__, "__importDefault", function() {
        return __importDefault;
    });
    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function(target, key) {
            decorator(target, key, paramIndex);
        };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : new P(function(resolve) {
                    resolve(result.value);
                }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = {
            label: 0,
            sent: function() {
                if (t[0] & 1) throw t[1];
                return t[1];
            },
            trys: [],
            ops: []
        }, f, y, t, g;
        return g = {
            next: verb(0),
            "throw": verb(1),
            "return": verb(2)
        }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
            return this;
        }), g;
        function verb(n) {
            return function(v) {
                return step([ n, v ]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
                0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [ op[0] & 2, t.value ];
                switch (op[0]) {
                  case 0:
                  case 1:
                    t = op;
                    break;

                  case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };

                  case 5:
                    _.label++;
                    y = op[1];
                    op = [ 0 ];
                    continue;

                  case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;

                  default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
                }
                op = body.call(thisArg, _);
            } catch (e) {
                op = [ 6, e ];
                y = 0;
            } finally {
                f = t = 0;
            }
            if (op[0] & 5) throw op[1];
            return {
                value: op[0] ? op[1] : void 0,
                done: true
            };
        }
    }
    function __exportStar(m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function() {
                if (o && i >= o.length) o = void 0;
                return {
                    value: o && o[i++],
                    done: !o
                };
            }
        };
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
            e = {
                error: error
            };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            } finally {
                if (e) throw e.error;
            }
        }
        return ar;
    }
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
            return this;
        }, i;
        function verb(n) {
            if (g[n]) i[n] = function(v) {
                return new Promise(function(a, b) {
                    q.push([ n, v, a, b ]) > 1 || resume(n, v);
                });
            };
        }
        function resume(n, v) {
            try {
                step(g[n](v));
            } catch (e) {
                settle(q[0][3], e);
            }
        }
        function step(r) {
            r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
        }
        function fulfill(value) {
            resume("next", value);
        }
        function reject(value) {
            resume("throw", value);
        }
        function settle(f, v) {
            if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
        }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function(e) {
            throw e;
        }), verb("return"), i[Symbol.iterator] = function() {
            return this;
        }, i;
        function verb(n, f) {
            i[n] = o[n] ? function(v) {
                return (p = !p) ? {
                    value: __await(o[n](v)),
                    done: n === "return"
                } : f ? f(v) : v;
            } : f;
        }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), 
        i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
            return this;
        }, i);
        function verb(n) {
            i[n] = o[n] && function(v) {
                return new Promise(function(resolve, reject) {
                    v = o[n](v), settle(resolve, reject, v.done, v.value);
                });
            };
        }
        function settle(resolve, reject, d, v) {
            Promise.resolve(v).then(function(v) {
                resolve({
                    value: v,
                    done: d
                });
            }, reject);
        }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", {
                value: raw
            });
        } else {
            cooked.raw = raw;
        }
        return cooked;
    }
    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result.default = mod;
        return result;
    }
    function __importDefault(mod) {
        return mod && mod.__esModule ? mod : {
            "default": mod
        };
    }
}, function(module, exports, __webpack_require__) {
    var baseGetTag = __webpack_require__(7), isObject = __webpack_require__(22);
    var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
    function isFunction(value) {
        if (!isObject(value)) {
            return false;
        }
        var tag = baseGetTag(value);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    module.exports = isFunction;
}, function(module, exports, __webpack_require__) {
    (function(global) {
        var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
        module.exports = freeGlobal;
    }).call(this, __webpack_require__(5));
}, function(module, exports) {
    function eq(value, other) {
        return value === other || value !== value && other !== other;
    }
    module.exports = eq;
}, function(module, exports, __webpack_require__) {
    var baseToString = __webpack_require__(88);
    function toString(value) {
        return value == null ? "" : baseToString(value);
    }
    module.exports = toString;
}, function(module, exports) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value, length) {
        var type = typeof value;
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    module.exports = isIndex;
}, function(module, exports) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    module.exports = isLength;
}, function(module, exports, __webpack_require__) {
    var isFunction = __webpack_require__(32), isLength = __webpack_require__(37);
    function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
    }
    module.exports = isArrayLike;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ExternalPageId;
    (function(ExternalPageId) {
        ExternalPageId["Support"] = "support";
        ExternalPageId["PackagePicker"] = "package-picker";
        ExternalPageId["PremiumPage"] = "premiumPage";
        ExternalPageId["UpgradeEtpa"] = "upgradeEtpa";
        ExternalPageId["SiteSettings"] = "site-settings";
        ExternalPageId["AddApp"] = "add-app";
        ExternalPageId["ManagePremium"] = "manage-premium";
        ExternalPageId["Contributors"] = "contributors";
        ExternalPageId["myAccount"] = "myAccount";
    })(ExternalPageId = exports.ExternalPageId || (exports.ExternalPageId = {}));
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var _defineProperty2 = __webpack_require__(125);
    var _defineProperty3 = _interopRequireDefault(_defineProperty2);
    var _extends2 = __webpack_require__(136);
    var _extends3 = _interopRequireDefault(_extends2);
    var _classCallCheck2 = __webpack_require__(155);
    var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
    var _createClass2 = __webpack_require__(156);
    var _createClass3 = _interopRequireDefault(_createClass2);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    function httpRequest(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "text";
            xhr.withCredentials = true;
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 400) {
                    resolve(xhr.responseText);
                } else {
                    reject("Failed to load " + url + ", status " + xhr.status);
                }
            };
            xhr.onerror = function() {
                return reject("Failed to load " + url);
            };
            xhr.send();
        });
    }
    function tryParse(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {}
        }
        return data;
    }
    var Experiments = function() {
        function Experiments() {
            var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            (0, _classCallCheck3.default)(this, Experiments);
            this.experiments = obj.experiments || {};
            this.loaders = [];
            this.baseUrl = obj.baseUrl || "";
            if (obj.scope) {
                this.load(obj.scope);
            }
        }
        (0, _createClass3.default)(Experiments, [ {
            key: "add",
            value: function add(obj) {
                this.experiments = (0, _extends3.default)({}, this.experiments, obj);
            }
        }, {
            key: "get",
            value: function get(key) {
                return this.experiments[key];
            }
        }, {
            key: "enabled",
            value: function enabled(key) {
                return this.get(key) === "true";
            }
        }, {
            key: "all",
            value: function all() {
                return this.experiments;
            }
        }, {
            key: "_addLoader",
            value: function _addLoader(promise) {
                var _this = this;
                this.loaders.push(promise);
                promise.then(function() {
                    _this.loaders = _this.loaders.filter(function(x) {
                        return x !== promise;
                    });
                });
                return promise;
            }
        }, {
            key: "_getUrlWithFallback",
            value: function _getUrlWithFallback(url, fallback) {
                return httpRequest(url).then(function(res) {
                    return tryParse(res);
                }).catch(function() {
                    return fallback;
                });
            }
        }, {
            key: "load",
            value: function load(scope) {
                var _this2 = this;
                var url = this.baseUrl + "/_api/wix-laboratory-server/laboratory/conductAllInScope?scope=" + scope;
                var result = this._getUrlWithFallback(url, {}).then(function(obj) {
                    return _this2.add(obj);
                });
                return this._addLoader(result);
            }
        }, {
            key: "conduct",
            value: function conduct(spec, fallback) {
                var _this3 = this;
                var url = this.baseUrl + "/_api/wix-laboratory-server/laboratory/conductExperiment?key=" + spec + "&fallback=" + fallback;
                var result = this._getUrlWithFallback(url, fallback).then(function(value) {
                    _this3.add((0, _defineProperty3.default)({}, spec, value));
                    return value;
                });
                return this._addLoader(result);
            }
        }, {
            key: "pending",
            value: function pending() {
                return !!this.loaders.length;
            }
        }, {
            key: "ready",
            value: function ready() {
                return Promise.all(this.loaders);
            }
        } ]);
        return Experiments;
    }();
    exports.default = Experiments;
}, function(module, exports, __webpack_require__) {
    module.exports = {
        "default": __webpack_require__(126),
        __esModule: true
    };
}, function(module, exports, __webpack_require__) {
    var global = __webpack_require__(28);
    var core = __webpack_require__(14);
    var ctx = __webpack_require__(128);
    var hide = __webpack_require__(130);
    var has = __webpack_require__(44);
    var PROTOTYPE = "prototype";
    var $export = function(type, name, source) {
        var IS_FORCED = type & $export.F;
        var IS_GLOBAL = type & $export.G;
        var IS_STATIC = type & $export.S;
        var IS_PROTO = type & $export.P;
        var IS_BIND = type & $export.B;
        var IS_WRAP = type & $export.W;
        var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
        var expProto = exports[PROTOTYPE];
        var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
        var key, own, out;
        if (IS_GLOBAL) source = name;
        for (key in source) {
            own = !IS_FORCED && target && target[key] !== undefined;
            if (own && has(exports, key)) continue;
            out = own ? target[key] : source[key];
            exports[key] = IS_GLOBAL && typeof target[key] != "function" ? source[key] : IS_BIND && own ? ctx(out, global) : IS_WRAP && target[key] == out ? function(C) {
                var F = function(a, b, c) {
                    if (this instanceof C) {
                        switch (arguments.length) {
                          case 0:
                            return new C();

                          case 1:
                            return new C(a);

                          case 2:
                            return new C(a, b);
                        }
                        return new C(a, b, c);
                    }
                    return C.apply(this, arguments);
                };
                F[PROTOTYPE] = C[PROTOTYPE];
                return F;
            }(out) : IS_PROTO && typeof out == "function" ? ctx(Function.call, out) : out;
            if (IS_PROTO) {
                (exports.virtual || (exports.virtual = {}))[key] = out;
                if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
            }
        }
    };
    $export.F = 1;
    $export.G = 2;
    $export.S = 4;
    $export.P = 8;
    $export.B = 16;
    $export.W = 32;
    $export.U = 64;
    $export.R = 128;
    module.exports = $export;
}, function(module, exports, __webpack_require__) {
    var anObject = __webpack_require__(131);
    var IE8_DOM_DEFINE = __webpack_require__(132);
    var toPrimitive = __webpack_require__(134);
    var dP = Object.defineProperty;
    exports.f = __webpack_require__(15) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
        anObject(O);
        P = toPrimitive(P, true);
        anObject(Attributes);
        if (IE8_DOM_DEFINE) try {
            return dP(O, P, Attributes);
        } catch (e) {}
        if ("get" in Attributes || "set" in Attributes) throw TypeError("Accessors not supported!");
        if ("value" in Attributes) O[P] = Attributes.value;
        return O;
    };
}, function(module, exports) {
    var hasOwnProperty = {}.hasOwnProperty;
    module.exports = function(it, key) {
        return hasOwnProperty.call(it, key);
    };
}, function(module, exports, __webpack_require__) {
    var IObject = __webpack_require__(46);
    var defined = __webpack_require__(47);
    module.exports = function(it) {
        return IObject(defined(it));
    };
}, function(module, exports, __webpack_require__) {
    var cof = __webpack_require__(143);
    module.exports = Object("z").propertyIsEnumerable(0) ? Object : function(it) {
        return cof(it) == "String" ? it.split("") : Object(it);
    };
}, function(module, exports) {
    module.exports = function(it) {
        if (it == undefined) throw TypeError("Can't call method on  " + it);
        return it;
    };
}, function(module, exports) {
    var ceil = Math.ceil;
    var floor = Math.floor;
    module.exports = function(it) {
        return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    (function(process) {
        var utils = __webpack_require__(1);
        var normalizeHeaderName = __webpack_require__(181);
        var DEFAULT_CONTENT_TYPE = {
            "Content-Type": "application/x-www-form-urlencoded"
        };
        function setContentTypeIfUnset(headers, value) {
            if (!utils.isUndefined(headers) && utils.isUndefined(headers["Content-Type"])) {
                headers["Content-Type"] = value;
            }
        }
        function getDefaultAdapter() {
            var adapter;
            if (typeof XMLHttpRequest !== "undefined") {
                adapter = __webpack_require__(171);
            } else if (typeof process !== "undefined") {
                adapter = __webpack_require__(171);
            }
            return adapter;
        }
        var defaults = {
            adapter: getDefaultAdapter(),
            transformRequest: [ function transformRequest(data, headers) {
                normalizeHeaderName(headers, "Content-Type");
                if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
                    return data;
                }
                if (utils.isArrayBufferView(data)) {
                    return data.buffer;
                }
                if (utils.isURLSearchParams(data)) {
                    setContentTypeIfUnset(headers, "application/x-www-form-urlencoded;charset=utf-8");
                    return data.toString();
                }
                if (utils.isObject(data)) {
                    setContentTypeIfUnset(headers, "application/json;charset=utf-8");
                    return JSON.stringify(data);
                }
                return data;
            } ],
            transformResponse: [ function transformResponse(data) {
                if (typeof data === "string") {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {}
                }
                return data;
            } ],
            timeout: 0,
            xsrfCookieName: "XSRF-TOKEN",
            xsrfHeaderName: "X-XSRF-TOKEN",
            maxContentLength: -1,
            validateStatus: function validateStatus(status) {
                return status >= 200 && status < 300;
            }
        };
        defaults.headers = {
            common: {
                Accept: "application/json, text/plain, */*"
            }
        };
        utils.forEach([ "delete", "get", "head" ], function forEachMethodNoData(method) {
            defaults.headers[method] = {};
        });
        utils.forEach([ "post", "put", "patch" ], function forEachMethodWithData(method) {
            defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
        });
        module.exports = defaults;
    }).call(this, __webpack_require__(169));
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var BusinessManagerModule = function() {
        function BusinessManagerModule(moduleId) {
            this._appDefId = null;
            this._moduleId = moduleId;
        }
        BusinessManagerModule.prototype.init = function(moduleParams) {};
        BusinessManagerModule.prototype.config = function(sourceModuleId, configPayload) {};
        BusinessManagerModule.prototype.dispose = function() {};
        Object.defineProperty(BusinessManagerModule.prototype, "moduleId", {
            get: function() {
                return this._moduleId;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BusinessManagerModule.prototype, "appDefId", {
            get: function() {
                return this._appDefId;
            },
            set: function(value) {
                this._appDefId = value;
            },
            enumerable: true,
            configurable: true
        });
        return BusinessManagerModule;
    }();
    exports.BusinessManagerModule = BusinessManagerModule;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var module_registry_1 = __webpack_require__(3);
    function registerModule(moduleId, businessManagerModule) {
        module_registry_1.default.registerModule(moduleId, businessManagerModule, [ moduleId ]);
    }
    exports.registerModule = registerModule;
    function getModule(moduleId) {
        return module_registry_1.default.getModule(moduleId);
    }
    exports.getModule = getModule;
    function configModule(sourceModuleId, moduleId, configPayload) {
        var module = getModule(moduleId);
        module.config(sourceModuleId, configPayload);
    }
    exports.configModule = configModule;
    function getAllModules() {
        return module_registry_1.default.getAllModules();
    }
    exports.getAllModules = getAllModules;
}, function(module, exports, __webpack_require__) {
    var baseSet = __webpack_require__(53);
    function set(object, path, value) {
        return object == null ? object : baseSet(object, path, value);
    }
    module.exports = set;
}, function(module, exports, __webpack_require__) {
    var assignValue = __webpack_require__(54), castPath = __webpack_require__(23), isIndex = __webpack_require__(36), isObject = __webpack_require__(22), toKey = __webpack_require__(25);
    function baseSet(object, path, value, customizer) {
        if (!isObject(object)) {
            return object;
        }
        path = castPath(path, object);
        var index = -1, length = path.length, lastIndex = length - 1, nested = object;
        while (nested != null && ++index < length) {
            var key = toKey(path[index]), newValue = value;
            if (index != lastIndex) {
                var objValue = nested[key];
                newValue = customizer ? customizer(objValue, key, nested) : undefined;
                if (newValue === undefined) {
                    newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
                }
            }
            assignValue(nested, key, newValue);
            nested = nested[key];
        }
        return object;
    }
    module.exports = baseSet;
}, function(module, exports, __webpack_require__) {
    var baseAssignValue = __webpack_require__(55), eq = __webpack_require__(34);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function assignValue(object, key, value) {
        var objValue = object[key];
        if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
            baseAssignValue(object, key, value);
        }
    }
    module.exports = assignValue;
}, function(module, exports, __webpack_require__) {
    var defineProperty = __webpack_require__(56);
    function baseAssignValue(object, key, value) {
        if (key == "__proto__" && defineProperty) {
            defineProperty(object, key, {
                configurable: true,
                enumerable: true,
                value: value,
                writable: true
            });
        } else {
            object[key] = value;
        }
    }
    module.exports = baseAssignValue;
}, function(module, exports, __webpack_require__) {
    var getNative = __webpack_require__(20);
    var defineProperty = function() {
        try {
            var func = getNative(Object, "defineProperty");
            func({}, "", {});
            return func;
        } catch (e) {}
    }();
    module.exports = defineProperty;
}, function(module, exports, __webpack_require__) {
    var isFunction = __webpack_require__(32), isMasked = __webpack_require__(60), isObject = __webpack_require__(22), toSource = __webpack_require__(62);
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var funcProto = Function.prototype, objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
    function baseIsNative(value) {
        if (!isObject(value) || isMasked(value)) {
            return false;
        }
        var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
        return pattern.test(toSource(value));
    }
    module.exports = baseIsNative;
}, function(module, exports, __webpack_require__) {
    var Symbol = __webpack_require__(21);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
    function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
            value[symToStringTag] = undefined;
            var unmasked = true;
        } catch (e) {}
        var result = nativeObjectToString.call(value);
        if (unmasked) {
            if (isOwn) {
                value[symToStringTag] = tag;
            } else {
                delete value[symToStringTag];
            }
        }
        return result;
    }
    module.exports = getRawTag;
}, function(module, exports) {
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
        return nativeObjectToString.call(value);
    }
    module.exports = objectToString;
}, function(module, exports, __webpack_require__) {
    var coreJsData = __webpack_require__(61);
    var maskSrcKey = function() {
        var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
    }();
    function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
    }
    module.exports = isMasked;
}, function(module, exports, __webpack_require__) {
    var root = __webpack_require__(8);
    var coreJsData = root["__core-js_shared__"];
    module.exports = coreJsData;
}, function(module, exports) {
    var funcProto = Function.prototype;
    var funcToString = funcProto.toString;
    function toSource(func) {
        if (func != null) {
            try {
                return funcToString.call(func);
            } catch (e) {}
            try {
                return func + "";
            } catch (e) {}
        }
        return "";
    }
    module.exports = toSource;
}, function(module, exports) {
    function getValue(object, key) {
        return object == null ? undefined : object[key];
    }
    module.exports = getValue;
}, function(module, exports, __webpack_require__) {
    var isArray = __webpack_require__(4), isSymbol = __webpack_require__(24);
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
    function isKey(value, object) {
        if (isArray(value)) {
            return false;
        }
        var type = typeof value;
        if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
            return true;
        }
        return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
    }
    module.exports = isKey;
}, function(module, exports, __webpack_require__) {
    var memoizeCapped = __webpack_require__(66);
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = memoizeCapped(function(string) {
        var result = [];
        if (string.charCodeAt(0) === 46) {
            result.push("");
        }
        string.replace(rePropName, function(match, number, quote, subString) {
            result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
        });
        return result;
    });
    module.exports = stringToPath;
}, function(module, exports, __webpack_require__) {
    var memoize = __webpack_require__(67);
    var MAX_MEMOIZE_SIZE = 500;
    function memoizeCapped(func) {
        var result = memoize(func, function(key) {
            if (cache.size === MAX_MEMOIZE_SIZE) {
                cache.clear();
            }
            return key;
        });
        var cache = result.cache;
        return result;
    }
    module.exports = memoizeCapped;
}, function(module, exports, __webpack_require__) {
    var MapCache = __webpack_require__(68);
    var FUNC_ERROR_TEXT = "Expected a function";
    function memoize(func, resolver) {
        if (typeof func != "function" || resolver != null && typeof resolver != "function") {
            throw new TypeError(FUNC_ERROR_TEXT);
        }
        var memoized = function() {
            var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
            if (cache.has(key)) {
                return cache.get(key);
            }
            var result = func.apply(this, args);
            memoized.cache = cache.set(key, result) || cache;
            return result;
        };
        memoized.cache = new (memoize.Cache || MapCache)();
        return memoized;
    }
    memoize.Cache = MapCache;
    module.exports = memoize;
}, function(module, exports, __webpack_require__) {
    var mapCacheClear = __webpack_require__(69), mapCacheDelete = __webpack_require__(83), mapCacheGet = __webpack_require__(85), mapCacheHas = __webpack_require__(86), mapCacheSet = __webpack_require__(87);
    function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    module.exports = MapCache;
}, function(module, exports, __webpack_require__) {
    var Hash = __webpack_require__(70), ListCache = __webpack_require__(76), Map = __webpack_require__(82);
    function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
            hash: new Hash(),
            map: new (Map || ListCache)(),
            string: new Hash()
        };
    }
    module.exports = mapCacheClear;
}, function(module, exports, __webpack_require__) {
    var hashClear = __webpack_require__(71), hashDelete = __webpack_require__(72), hashGet = __webpack_require__(73), hashHas = __webpack_require__(74), hashSet = __webpack_require__(75);
    function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    module.exports = Hash;
}, function(module, exports, __webpack_require__) {
    var nativeCreate = __webpack_require__(10);
    function hashClear() {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
        this.size = 0;
    }
    module.exports = hashClear;
}, function(module, exports) {
    function hashDelete(key) {
        var result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result;
    }
    module.exports = hashDelete;
}, function(module, exports, __webpack_require__) {
    var nativeCreate = __webpack_require__(10);
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashGet(key) {
        var data = this.__data__;
        if (nativeCreate) {
            var result = data[key];
            return result === HASH_UNDEFINED ? undefined : result;
        }
        return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }
    module.exports = hashGet;
}, function(module, exports, __webpack_require__) {
    var nativeCreate = __webpack_require__(10);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashHas(key) {
        var data = this.__data__;
        return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
    }
    module.exports = hashHas;
}, function(module, exports, __webpack_require__) {
    var nativeCreate = __webpack_require__(10);
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function hashSet(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
        return this;
    }
    module.exports = hashSet;
}, function(module, exports, __webpack_require__) {
    var listCacheClear = __webpack_require__(77), listCacheDelete = __webpack_require__(78), listCacheGet = __webpack_require__(79), listCacheHas = __webpack_require__(80), listCacheSet = __webpack_require__(81);
    function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
            var entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    module.exports = ListCache;
}, function(module, exports) {
    function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
    }
    module.exports = listCacheClear;
}, function(module, exports, __webpack_require__) {
    var assocIndexOf = __webpack_require__(11);
    var arrayProto = Array.prototype;
    var splice = arrayProto.splice;
    function listCacheDelete(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
            return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
            data.pop();
        } else {
            splice.call(data, index, 1);
        }
        --this.size;
        return true;
    }
    module.exports = listCacheDelete;
}, function(module, exports, __webpack_require__) {
    var assocIndexOf = __webpack_require__(11);
    function listCacheGet(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        return index < 0 ? undefined : data[index][1];
    }
    module.exports = listCacheGet;
}, function(module, exports, __webpack_require__) {
    var assocIndexOf = __webpack_require__(11);
    function listCacheHas(key) {
        return assocIndexOf(this.__data__, key) > -1;
    }
    module.exports = listCacheHas;
}, function(module, exports, __webpack_require__) {
    var assocIndexOf = __webpack_require__(11);
    function listCacheSet(key, value) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
            ++this.size;
            data.push([ key, value ]);
        } else {
            data[index][1] = value;
        }
        return this;
    }
    module.exports = listCacheSet;
}, function(module, exports, __webpack_require__) {
    var getNative = __webpack_require__(20), root = __webpack_require__(8);
    var Map = getNative(root, "Map");
    module.exports = Map;
}, function(module, exports, __webpack_require__) {
    var getMapData = __webpack_require__(12);
    function mapCacheDelete(key) {
        var result = getMapData(this, key)["delete"](key);
        this.size -= result ? 1 : 0;
        return result;
    }
    module.exports = mapCacheDelete;
}, function(module, exports) {
    function isKeyable(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    module.exports = isKeyable;
}, function(module, exports, __webpack_require__) {
    var getMapData = __webpack_require__(12);
    function mapCacheGet(key) {
        return getMapData(this, key).get(key);
    }
    module.exports = mapCacheGet;
}, function(module, exports, __webpack_require__) {
    var getMapData = __webpack_require__(12);
    function mapCacheHas(key) {
        return getMapData(this, key).has(key);
    }
    module.exports = mapCacheHas;
}, function(module, exports, __webpack_require__) {
    var getMapData = __webpack_require__(12);
    function mapCacheSet(key, value) {
        var data = getMapData(this, key), size = data.size;
        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this;
    }
    module.exports = mapCacheSet;
}, function(module, exports, __webpack_require__) {
    var Symbol = __webpack_require__(21), arrayMap = __webpack_require__(89), isArray = __webpack_require__(4), isSymbol = __webpack_require__(24);
    var INFINITY = 1 / 0;
    var symbolProto = Symbol ? Symbol.prototype : undefined, symbolToString = symbolProto ? symbolProto.toString : undefined;
    function baseToString(value) {
        if (typeof value == "string") {
            return value;
        }
        if (isArray(value)) {
            return arrayMap(value, baseToString) + "";
        }
        if (isSymbol(value)) {
            return symbolToString ? symbolToString.call(value) : "";
        }
        var result = value + "";
        return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module.exports = baseToString;
}, function(module, exports) {
    function arrayMap(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length, result = Array(length);
        while (++index < length) {
            result[index] = iteratee(array[index], index, array);
        }
        return result;
    }
    module.exports = arrayMap;
}, function(module, exports, __webpack_require__) {
    var baseUnset = __webpack_require__(91);
    function unset(object, path) {
        return object == null ? true : baseUnset(object, path);
    }
    module.exports = unset;
}, function(module, exports, __webpack_require__) {
    var castPath = __webpack_require__(23), last = __webpack_require__(92), parent = __webpack_require__(93), toKey = __webpack_require__(25);
    function baseUnset(object, path) {
        path = castPath(path, object);
        object = parent(object, path);
        return object == null || delete object[toKey(last(path))];
    }
    module.exports = baseUnset;
}, function(module, exports) {
    function last(array) {
        var length = array == null ? 0 : array.length;
        return length ? array[length - 1] : undefined;
    }
    module.exports = last;
}, function(module, exports, __webpack_require__) {
    var baseGet = __webpack_require__(94), baseSlice = __webpack_require__(95);
    function parent(object, path) {
        return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
    }
    module.exports = parent;
}, function(module, exports, __webpack_require__) {
    var castPath = __webpack_require__(23), toKey = __webpack_require__(25);
    function baseGet(object, path) {
        path = castPath(path, object);
        var index = 0, length = path.length;
        while (object != null && index < length) {
            object = object[toKey(path[index++])];
        }
        return index && index == length ? object : undefined;
    }
    module.exports = baseGet;
}, function(module, exports) {
    function baseSlice(array, start, end) {
        var index = -1, length = array.length;
        if (start < 0) {
            start = -start > length ? 0 : length + start;
        }
        end = end > length ? length : end;
        if (end < 0) {
            end += length;
        }
        length = start > end ? 0 : end - start >>> 0;
        start >>>= 0;
        var result = Array(length);
        while (++index < length) {
            result[index] = array[index + start];
        }
        return result;
    }
    module.exports = baseSlice;
}, function(module, exports, __webpack_require__) {
    var arrayEach = __webpack_require__(97), baseEach = __webpack_require__(98), castFunction = __webpack_require__(118), isArray = __webpack_require__(4);
    function forEach(collection, iteratee) {
        var func = isArray(collection) ? arrayEach : baseEach;
        return func(collection, castFunction(iteratee));
    }
    module.exports = forEach;
}, function(module, exports) {
    function arrayEach(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
            if (iteratee(array[index], index, array) === false) {
                break;
            }
        }
        return array;
    }
    module.exports = arrayEach;
}, function(module, exports, __webpack_require__) {
    var baseForOwn = __webpack_require__(99), createBaseEach = __webpack_require__(117);
    var baseEach = createBaseEach(baseForOwn);
    module.exports = baseEach;
}, function(module, exports, __webpack_require__) {
    var baseFor = __webpack_require__(100), keys = __webpack_require__(102);
    function baseForOwn(object, iteratee) {
        return object && baseFor(object, iteratee, keys);
    }
    module.exports = baseForOwn;
}, function(module, exports, __webpack_require__) {
    var createBaseFor = __webpack_require__(101);
    var baseFor = createBaseFor();
    module.exports = baseFor;
}, function(module, exports) {
    function createBaseFor(fromRight) {
        return function(object, iteratee, keysFunc) {
            var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
            while (length--) {
                var key = props[fromRight ? length : ++index];
                if (iteratee(iterable[key], key, iterable) === false) {
                    break;
                }
            }
            return object;
        };
    }
    module.exports = createBaseFor;
}, function(module, exports, __webpack_require__) {
    var arrayLikeKeys = __webpack_require__(103), baseKeys = __webpack_require__(113), isArrayLike = __webpack_require__(38);
    function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    module.exports = keys;
}, function(module, exports, __webpack_require__) {
    var baseTimes = __webpack_require__(104), isArguments = __webpack_require__(105), isArray = __webpack_require__(4), isBuffer = __webpack_require__(107), isIndex = __webpack_require__(36), isTypedArray = __webpack_require__(109);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function arrayLikeKeys(value, inherited) {
        var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
        for (var key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) {
                result.push(key);
            }
        }
        return result;
    }
    module.exports = arrayLikeKeys;
}, function(module, exports) {
    function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
            result[index] = iteratee(index);
        }
        return result;
    }
    module.exports = baseTimes;
}, function(module, exports, __webpack_require__) {
    var baseIsArguments = __webpack_require__(106), isObjectLike = __webpack_require__(9);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var isArguments = baseIsArguments(function() {
        return arguments;
    }()) ? baseIsArguments : function(value) {
        return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    module.exports = isArguments;
}, function(module, exports, __webpack_require__) {
    var baseGetTag = __webpack_require__(7), isObjectLike = __webpack_require__(9);
    var argsTag = "[object Arguments]";
    function baseIsArguments(value) {
        return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    module.exports = baseIsArguments;
}, function(module, exports, __webpack_require__) {
    (function(module) {
        var root = __webpack_require__(8), stubFalse = __webpack_require__(108);
        var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
        var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
        var moduleExports = freeModule && freeModule.exports === freeExports;
        var Buffer = moduleExports ? root.Buffer : undefined;
        var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
        var isBuffer = nativeIsBuffer || stubFalse;
        module.exports = isBuffer;
    }).call(this, __webpack_require__(6)(module));
}, function(module, exports) {
    function stubFalse() {
        return false;
    }
    module.exports = stubFalse;
}, function(module, exports, __webpack_require__) {
    var baseIsTypedArray = __webpack_require__(110), baseUnary = __webpack_require__(111), nodeUtil = __webpack_require__(112);
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    module.exports = isTypedArray;
}, function(module, exports, __webpack_require__) {
    var baseGetTag = __webpack_require__(7), isLength = __webpack_require__(37), isObjectLike = __webpack_require__(9);
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    function baseIsTypedArray(value) {
        return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    module.exports = baseIsTypedArray;
}, function(module, exports) {
    function baseUnary(func) {
        return function(value) {
            return func(value);
        };
    }
    module.exports = baseUnary;
}, function(module, exports, __webpack_require__) {
    (function(module) {
        var freeGlobal = __webpack_require__(33);
        var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
        var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
        var moduleExports = freeModule && freeModule.exports === freeExports;
        var freeProcess = moduleExports && freeGlobal.process;
        var nodeUtil = function() {
            try {
                var types = freeModule && freeModule.require && freeModule.require("util").types;
                if (types) {
                    return types;
                }
                return freeProcess && freeProcess.binding && freeProcess.binding("util");
            } catch (e) {}
        }();
        module.exports = nodeUtil;
    }).call(this, __webpack_require__(6)(module));
}, function(module, exports, __webpack_require__) {
    var isPrototype = __webpack_require__(114), nativeKeys = __webpack_require__(115);
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeys(object) {
        if (!isPrototype(object)) {
            return nativeKeys(object);
        }
        var result = [];
        for (var key in Object(object)) {
            if (hasOwnProperty.call(object, key) && key != "constructor") {
                result.push(key);
            }
        }
        return result;
    }
    module.exports = baseKeys;
}, function(module, exports) {
    var objectProto = Object.prototype;
    function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
    }
    module.exports = isPrototype;
}, function(module, exports, __webpack_require__) {
    var overArg = __webpack_require__(116);
    var nativeKeys = overArg(Object.keys, Object);
    module.exports = nativeKeys;
}, function(module, exports) {
    function overArg(func, transform) {
        return function(arg) {
            return func(transform(arg));
        };
    }
    module.exports = overArg;
}, function(module, exports, __webpack_require__) {
    var isArrayLike = __webpack_require__(38);
    function createBaseEach(eachFunc, fromRight) {
        return function(collection, iteratee) {
            if (collection == null) {
                return collection;
            }
            if (!isArrayLike(collection)) {
                return eachFunc(collection, iteratee);
            }
            var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
            while (fromRight ? index-- : ++index < length) {
                if (iteratee(iterable[index], index, iterable) === false) {
                    break;
                }
            }
            return collection;
        };
    }
    module.exports = createBaseEach;
}, function(module, exports, __webpack_require__) {
    var identity = __webpack_require__(119);
    function castFunction(value) {
        return typeof value == "function" ? value : identity;
    }
    module.exports = castFunction;
}, function(module, exports) {
    function identity(value) {
        return value;
    }
    module.exports = identity;
}, function(module, exports, __webpack_require__) {
    var toString = __webpack_require__(35);
    var idCounter = 0;
    function uniqueId(prefix) {
        var id = ++idCounter;
        return toString(prefix) + id;
    }
    module.exports = uniqueId;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var URI = __webpack_require__(2);
    var PageComponentId_1 = __webpack_require__(13);
    var PageComponentsUrlTemplates_1 = __webpack_require__(122);
    var MyAccountUrlTemplates_1 = __webpack_require__(123);
    var ExternalPageUrlTemplates_1 = __webpack_require__(124);
    var MyAccountAppsUrlTemplates_1 = __webpack_require__(157);
    function pageLinkBuilderFactory(metaSiteId, isDebug, pageComponentsInfo, experiments) {
        if (isDebug === void 0) {
            isDebug = false;
        }
        if (experiments === void 0) {
            experiments = {};
        }
        return function(targetId, contextData) {
            if (contextData === void 0) {
                contextData = {};
            }
            var isHomeEnabled = pageComponentsInfo[PageComponentId_1.PageComponentId.Home] && pageComponentsInfo[PageComponentId_1.PageComponentId.Home].isEnabled;
            var isHomeDisabled = !isHomeEnabled;
            if (targetId === PageComponentId_1.PageComponentId.Home && isHomeDisabled) {
                targetId = PageComponentId_1.PageComponentId.Stores;
                contextData.appState = "dashboard";
            }
            var templateUrl = getTemplateUrl(metaSiteId, pageComponentsInfo, targetId, experiments);
            return processUrlTemplate(templateUrl, contextData, isDebug);
        };
    }
    exports.pageLinkBuilderFactory = pageLinkBuilderFactory;
    function getTemplateUrl(metaSiteId, pageComponentsInfo, targetId, experiments) {
        var pageComponentInfo = getPageComponentInfoByPageComponentId(pageComponentsInfo, targetId) || getPageComponentInfoByAppDefId(pageComponentsInfo, targetId);
        if (pageComponentInfo && pageComponentInfo.isEnabled) {
            return PageComponentsUrlTemplates_1.getBusinessManagerPageComponentTemplate(metaSiteId, pageComponentInfo.route);
        }
        var appDefId = pageComponentInfo ? pageComponentInfo.appDefId : targetId;
        return MyAccountUrlTemplates_1.getMyAccountUrlTemplate(metaSiteId, targetId) || ExternalPageUrlTemplates_1.getExternalPageUrlTemplate(metaSiteId, targetId, experiments) || MyAccountAppsUrlTemplates_1.getMyAccountAppsUrlTemplates(metaSiteId, appDefId);
    }
    function getPageComponentInfoByAppDefId(pageComponentsInfo, appDefId) {
        return Object.keys(pageComponentsInfo).map(function(pageComponentId) {
            return pageComponentsInfo[pageComponentId];
        }).find(function(pageComponentInfo) {
            return pageComponentInfo.appDefId === appDefId && pageComponentInfo.isMain === true;
        });
    }
    function getPageComponentInfoByPageComponentId(pageComponentsInfo, pageComponentId) {
        return pageComponentsInfo[pageComponentId];
    }
    function processUrlTemplate(urlTemplate, context, isDebug) {
        var uri = new URI(urlTemplate.baseUrl(context));
        if (urlTemplate.query) {
            uri.addQuery(interpolateOptions(urlTemplate.query, context));
        }
        if (isDebug && (uri.path().indexOf("my-account") !== -1 || !uri.host())) {
            uri.addQuery("debug");
        }
        var fragment = uri.fragment();
        if (urlTemplate.hashPath) {
            fragment = urlTemplate.hashPath;
        }
        if (urlTemplate.hashQuery) {
            var hashQuery = interpolateOptions(urlTemplate.hashQuery, context);
            var hashQueryString = new URI("http://temp/").query(hashQuery).query();
            fragment += hashQueryString ? "?" + hashQueryString : "";
        }
        uri.fragment(fragment);
        return uri.toString();
    }
    function interpolateOptions(options, context) {
        return Object.keys(options || {}).reduce(function(result, key) {
            var interpolated;
            if (options[key] === "=") {
                interpolated = context[key];
            } else {
                if (typeof options[key] === "function") {
                    interpolated = options[key](context);
                } else {
                    interpolated = options[key];
                }
            }
            if (interpolated) {
                result[key] = interpolated;
            }
            return result;
        }, {});
    }
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    function getBusinessManagerPageComponentTemplate(metaSiteId, pageComponentRoute) {
        return {
            baseUrl: function(ctx) {
                return "/" + metaSiteId + "/" + pageComponentRoute + "/" + (ctx.appState ? ctx.appState : "");
            },
            query: {
                referralInfo: function(ctx) {
                    return ctx.referrer;
                },
                dataCapsuleId: "="
            }
        };
    }
    exports.getBusinessManagerPageComponentTemplate = getBusinessManagerPageComponentTemplate;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var PageComponentId_1 = __webpack_require__(13);
    var appDefIds_1 = __webpack_require__(27);
    function getMyAccountUrlTemplate(metaSiteId, pageComponentId) {
        var myAccountAppBaseUrl = "https://www.wix.com/my-account/sites/" + metaSiteId;
        switch (pageComponentId) {
          case PageComponentId_1.PageComponentId.Engage:
          case appDefIds_1.appDefIds.engage:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/inbox/" + (ctx.contactId ? ctx.contactId : "");
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case PageComponentId_1.PageComponentId.Invoices:
          case appDefIds_1.appDefIds.invoices:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/quotes/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case PageComponentId_1.PageComponentId.Contacts:
          case appDefIds_1.appDefIds.contacts:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/contacts/" + (ctx.contactId ? ctx.contactId : "");
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    },
                    flow: "=",
                    tag: "="
                }
            };

          case PageComponentId_1.PageComponentId.Triggers:
          case appDefIds_1.appDefIds.triggers:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/triggers/" + (ctx.triggerId ? "wizard/" + ctx.triggerId : "");
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    },
                    step: function(ctx) {
                        return ctx.triggerId ? ctx.step : undefined;
                    },
                    wizardFullScreen: function(ctx) {
                        return ctx.triggerId ? ctx.wizardFullScreen : undefined;
                    }
                }
            };

          case PageComponentId_1.PageComponentId.Seo:
          case appDefIds_1.appDefIds.seoWizard:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/seo/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case PageComponentId_1.PageComponentId.Blog:
          case appDefIds_1.appDefIds.blog:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/simple-app/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    },
                    app: "blog"
                }
            };

          default:
            return null;
        }
    }
    exports.getMyAccountUrlTemplate = getMyAccountUrlTemplate;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ExternalPageId_1 = __webpack_require__(39);
    var wix_experiments_1 = __webpack_require__(40);
    function getExternalPageUrlTemplate(metaSiteId, externalPageId, experiments) {
        var myAccountAppBaseUrl = "https://www.wix.com/my-account/sites/" + metaSiteId;
        var wixExperiments = new wix_experiments_1.default({
            experiments: experiments
        });
        switch (externalPageId) {
          case ExternalPageId_1.ExternalPageId.myAccount:
            return {
                baseUrl: function() {
                    return myAccountAppBaseUrl;
                }
            };

          case ExternalPageId_1.ExternalPageId.SiteSettings:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/site-settings/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.Contributors:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/site-settings/authorization";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.PackagePicker:
            return {
                baseUrl: function(ctx) {
                    return wixExperiments.enabled("specs.wos.SiteSettingsNewUpgradeButton") ? "https://www.wix.com/store/plans" : "https://premium.wix.com/wix/api/premiumStart";
                },
                query: {
                    appDefId: "=",
                    instanceId: "=",
                    referralAdditionalInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.PremiumPage:
            return {
                baseUrl: function(ctx) {
                    return wixExperiments.enabled("specs.wos.SiteSettingsNewUpgradeButton") ? "https://www.wix.com/store/plans" : "https://premium.wix.com/wix/api/premiumStart";
                },
                query: {
                    appDefId: "=",
                    siteGuid: "=",
                    referralAdditionalInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.UpgradeEtpa:
            return {
                baseUrl: function(ctx) {
                    return "https://premium.wix.com/wix/api/tpaStartPurchase";
                },
                query: {
                    applicationId: function(ctx) {
                        return ctx.appId;
                    },
                    metaSiteId: "" + metaSiteId,
                    referralAdditionalInfo: function(ctx) {
                        return ctx.referrer;
                    },
                    appDefinitionId: function(ctx) {
                        return ctx.etpaId;
                    },
                    vendorProductId: function(ctx) {
                        return ctx.vendorProductId;
                    },
                    paymentCycle: function(ctx) {
                        return ctx.paymentCycle;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.Support:
            return {
                baseUrl: function(ctx) {
                    var base = "https://support.wix.com";
                    var locale = ctx.locale || "en";
                    var articlePath = ctx.article ? "" + ctx.article : "/";
                    return base + "/" + locale + articlePath;
                }
            };

          case ExternalPageId_1.ExternalPageId.AddApp:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/apps/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          case ExternalPageId_1.ExternalPageId.ManagePremium:
            return {
                baseUrl: function(ctx) {
                    return myAccountAppBaseUrl + "/manage-premium/";
                },
                query: {
                    referralInfo: function(ctx) {
                        return ctx.referrer;
                    }
                }
            };

          default:
            return null;
        }
    }
    exports.getExternalPageUrlTemplate = getExternalPageUrlTemplate;
}, function(module, exports, __webpack_require__) {
    "use strict";
    exports.__esModule = true;
    var _defineProperty = __webpack_require__(41);
    var _defineProperty2 = _interopRequireDefault(_defineProperty);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    exports.default = function(obj, key, value) {
        if (key in obj) {
            (0, _defineProperty2.default)(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }
        return obj;
    };
}, function(module, exports, __webpack_require__) {
    __webpack_require__(127);
    var $Object = __webpack_require__(14).Object;
    module.exports = function defineProperty(it, key, desc) {
        return $Object.defineProperty(it, key, desc);
    };
}, function(module, exports, __webpack_require__) {
    var $export = __webpack_require__(42);
    $export($export.S + $export.F * !__webpack_require__(15), "Object", {
        defineProperty: __webpack_require__(43).f
    });
}, function(module, exports, __webpack_require__) {
    var aFunction = __webpack_require__(129);
    module.exports = function(fn, that, length) {
        aFunction(fn);
        if (that === undefined) return fn;
        switch (length) {
          case 1:
            return function(a) {
                return fn.call(that, a);
            };

          case 2:
            return function(a, b) {
                return fn.call(that, a, b);
            };

          case 3:
            return function(a, b, c) {
                return fn.call(that, a, b, c);
            };
        }
        return function() {
            return fn.apply(that, arguments);
        };
    };
}, function(module, exports) {
    module.exports = function(it) {
        if (typeof it != "function") throw TypeError(it + " is not a function!");
        return it;
    };
}, function(module, exports, __webpack_require__) {
    var dP = __webpack_require__(43);
    var createDesc = __webpack_require__(135);
    module.exports = __webpack_require__(15) ? function(object, key, value) {
        return dP.f(object, key, createDesc(1, value));
    } : function(object, key, value) {
        object[key] = value;
        return object;
    };
}, function(module, exports, __webpack_require__) {
    var isObject = __webpack_require__(29);
    module.exports = function(it) {
        if (!isObject(it)) throw TypeError(it + " is not an object!");
        return it;
    };
}, function(module, exports, __webpack_require__) {
    module.exports = !__webpack_require__(15) && !__webpack_require__(30)(function() {
        return Object.defineProperty(__webpack_require__(133)("div"), "a", {
            get: function() {
                return 7;
            }
        }).a != 7;
    });
}, function(module, exports, __webpack_require__) {
    var isObject = __webpack_require__(29);
    var document = __webpack_require__(28).document;
    var is = isObject(document) && isObject(document.createElement);
    module.exports = function(it) {
        return is ? document.createElement(it) : {};
    };
}, function(module, exports, __webpack_require__) {
    var isObject = __webpack_require__(29);
    module.exports = function(it, S) {
        if (!isObject(it)) return it;
        var fn, val;
        if (S && typeof (fn = it.toString) == "function" && !isObject(val = fn.call(it))) return val;
        if (typeof (fn = it.valueOf) == "function" && !isObject(val = fn.call(it))) return val;
        if (!S && typeof (fn = it.toString) == "function" && !isObject(val = fn.call(it))) return val;
        throw TypeError("Can't convert object to primitive value");
    };
}, function(module, exports) {
    module.exports = function(bitmap, value) {
        return {
            enumerable: !(bitmap & 1),
            configurable: !(bitmap & 2),
            writable: !(bitmap & 4),
            value: value
        };
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    exports.__esModule = true;
    var _assign = __webpack_require__(137);
    var _assign2 = _interopRequireDefault(_assign);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    exports.default = _assign2.default || function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
}, function(module, exports, __webpack_require__) {
    module.exports = {
        "default": __webpack_require__(138),
        __esModule: true
    };
}, function(module, exports, __webpack_require__) {
    __webpack_require__(139);
    module.exports = __webpack_require__(14).Object.assign;
}, function(module, exports, __webpack_require__) {
    var $export = __webpack_require__(42);
    $export($export.S + $export.F, "Object", {
        assign: __webpack_require__(140)
    });
}, function(module, exports, __webpack_require__) {
    "use strict";
    var getKeys = __webpack_require__(141);
    var gOPS = __webpack_require__(152);
    var pIE = __webpack_require__(153);
    var toObject = __webpack_require__(154);
    var IObject = __webpack_require__(46);
    var $assign = Object.assign;
    module.exports = !$assign || __webpack_require__(30)(function() {
        var A = {};
        var B = {};
        var S = Symbol();
        var K = "abcdefghijklmnopqrst";
        A[S] = 7;
        K.split("").forEach(function(k) {
            B[k] = k;
        });
        return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join("") != K;
    }) ? function assign(target, source) {
        var T = toObject(target);
        var aLen = arguments.length;
        var index = 1;
        var getSymbols = gOPS.f;
        var isEnum = pIE.f;
        while (aLen > index) {
            var S = IObject(arguments[index++]);
            var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
            var length = keys.length;
            var j = 0;
            var key;
            while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
        }
        return T;
    } : $assign;
}, function(module, exports, __webpack_require__) {
    var $keys = __webpack_require__(142);
    var enumBugKeys = __webpack_require__(151);
    module.exports = Object.keys || function keys(O) {
        return $keys(O, enumBugKeys);
    };
}, function(module, exports, __webpack_require__) {
    var has = __webpack_require__(44);
    var toIObject = __webpack_require__(45);
    var arrayIndexOf = __webpack_require__(144)(false);
    var IE_PROTO = __webpack_require__(147)("IE_PROTO");
    module.exports = function(object, names) {
        var O = toIObject(object);
        var i = 0;
        var result = [];
        var key;
        for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
        while (names.length > i) if (has(O, key = names[i++])) {
            ~arrayIndexOf(result, key) || result.push(key);
        }
        return result;
    };
}, function(module, exports) {
    var toString = {}.toString;
    module.exports = function(it) {
        return toString.call(it).slice(8, -1);
    };
}, function(module, exports, __webpack_require__) {
    var toIObject = __webpack_require__(45);
    var toLength = __webpack_require__(145);
    var toAbsoluteIndex = __webpack_require__(146);
    module.exports = function(IS_INCLUDES) {
        return function($this, el, fromIndex) {
            var O = toIObject($this);
            var length = toLength(O.length);
            var index = toAbsoluteIndex(fromIndex, length);
            var value;
            if (IS_INCLUDES && el != el) while (length > index) {
                value = O[index++];
                if (value != value) return true;
            } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
                if (O[index] === el) return IS_INCLUDES || index || 0;
            }
            return !IS_INCLUDES && -1;
        };
    };
}, function(module, exports, __webpack_require__) {
    var toInteger = __webpack_require__(48);
    var min = Math.min;
    module.exports = function(it) {
        return it > 0 ? min(toInteger(it), 9007199254740991) : 0;
    };
}, function(module, exports, __webpack_require__) {
    var toInteger = __webpack_require__(48);
    var max = Math.max;
    var min = Math.min;
    module.exports = function(index, length) {
        index = toInteger(index);
        return index < 0 ? max(index + length, 0) : min(index, length);
    };
}, function(module, exports, __webpack_require__) {
    var shared = __webpack_require__(148)("keys");
    var uid = __webpack_require__(150);
    module.exports = function(key) {
        return shared[key] || (shared[key] = uid(key));
    };
}, function(module, exports, __webpack_require__) {
    var core = __webpack_require__(14);
    var global = __webpack_require__(28);
    var SHARED = "__core-js_shared__";
    var store = global[SHARED] || (global[SHARED] = {});
    (module.exports = function(key, value) {
        return store[key] || (store[key] = value !== undefined ? value : {});
    })("versions", []).push({
        version: core.version,
        mode: __webpack_require__(149) ? "pure" : "global",
        copyright: "© 2018 Denis Pushkarev (zloirock.ru)"
    });
}, function(module, exports) {
    module.exports = true;
}, function(module, exports) {
    var id = 0;
    var px = Math.random();
    module.exports = function(key) {
        return "Symbol(".concat(key === undefined ? "" : key, ")_", (++id + px).toString(36));
    };
}, function(module, exports) {
    module.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
}, function(module, exports) {
    exports.f = Object.getOwnPropertySymbols;
}, function(module, exports) {
    exports.f = {}.propertyIsEnumerable;
}, function(module, exports, __webpack_require__) {
    var defined = __webpack_require__(47);
    module.exports = function(it) {
        return Object(defined(it));
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    exports.__esModule = true;
    exports.default = function(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    exports.__esModule = true;
    var _defineProperty = __webpack_require__(41);
    var _defineProperty2 = _interopRequireDefault(_defineProperty);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            "default": obj
        };
    }
    exports.default = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                (0, _defineProperty2.default)(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    function getMyAccountAppsUrlTemplates(metaSiteId, appDefinitionId) {
        return {
            baseUrl: function(ctx) {
                return "https://www.wix.com/my-account/sites/" + metaSiteId + "/app/" + appDefinitionId + "/";
            },
            query: {
                appState: "=",
                dataCapsuleId: "=",
                referralInfo: function(ctx) {
                    return ctx.referrer;
                }
            }
        };
    }
    exports.getMyAccountAppsUrlTemplates = getMyAccountAppsUrlTemplates;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var tslib_1 = __webpack_require__(31);
    var wix_experiments_1 = __webpack_require__(40);
    var appDefIds_1 = __webpack_require__(27);
    var PageComponentId_1 = __webpack_require__(13);
    var ModuleId_1 = __webpack_require__(26);
    function buildPageComponentsInfo(experiments, isDebug) {
        if (experiments === void 0) {
            experiments = {};
        }
        if (isDebug === void 0) {
            isDebug = false;
        }
        var _a, _b;
        var wixExperiments = new wix_experiments_1.default({
            experiments: experiments
        });
        var homePageComponent = {
            route: "home",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Home,
            pageComponentName: "mini-home-module",
            moduleId: ModuleId_1.ModuleId.Home,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase4")
        };
        var storesModule = {
            route: "store",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Stores,
            pageComponentName: "ecom",
            moduleId: ModuleId_1.ModuleId.Stores,
            isEnabled: true,
            appDefId: appDefIds_1.appDefIds.wixECommerce
        };
        var settingsPageComponent = {
            route: "settings",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Settings,
            pageComponentName: "settings-lazy-module",
            moduleId: ModuleId_1.ModuleId.Settings,
            isEnabled: true
        };
        var siteSettingsPageComponent = {
            route: "manage-website",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.SiteSettings,
            pageComponentName: "site-settings-lazy-module",
            moduleId: ModuleId_1.ModuleId.SiteSettings,
            isEnabled: true
        };
        var sellAnywherePageComponent = {
            route: "store/marketplaces",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.SellAnywhere,
            pageComponentName: "stores.marketplaces.entry",
            moduleId: ModuleId_1.ModuleId.SellAnywhere,
            isEnabled: wixExperiments.enabled("specs.stores.marketplaces.MasterToggle"),
            appDefId: appDefIds_1.appDefIds.wixECommerce
        };
        var contactsPageComponent = {
            route: "contacts",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Contacts,
            pageComponentName: "contacts-page-component",
            moduleId: ModuleId_1.ModuleId.Contacts,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3")
        };
        var engagePageComponent = {
            route: "inbox",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Engage,
            pageComponentName: "engage",
            moduleId: ModuleId_1.ModuleId.Engage,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3") && !wixExperiments.enabled("specs.wos.EngageCrazyChat"),
            appDefId: appDefIds_1.appDefIds.engage
        };
        var engageCrazyChatPageComponent = {
            route: "inbox",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.EngageCrazyChat,
            pageComponentName: "engage-crazy-chat-lazy",
            moduleId: ModuleId_1.ModuleId.Engage,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3") && wixExperiments.enabled("specs.wos.EngageCrazyChat"),
            appDefId: appDefIds_1.appDefIds.engage
        };
        var shoutoutPageComponent = {
            route: "shoutout",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Shoutout,
            pageComponentName: "shoutout",
            moduleId: ModuleId_1.ModuleId.Shoutout,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3"),
            appDefId: appDefIds_1.appDefIds.shoutout
        };
        var invoicesPageComponent = {
            route: "quotes",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Invoices,
            pageComponentName: "invoices",
            moduleId: ModuleId_1.ModuleId.Invoices,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3"),
            appDefId: appDefIds_1.appDefIds.invoices
        };
        var invoicesSettingsPageComponent = {
            route: "quotes/settings",
            isMain: false,
            pageComponentId: PageComponentId_1.PageComponentId.InvoicesSettings,
            pageComponentName: "invoices",
            moduleId: ModuleId_1.ModuleId.Invoices,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3"),
            appDefId: appDefIds_1.appDefIds.invoices
        };
        var cashierPageComponent = {
            route: "payments",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Cashier,
            pageComponentName: "cashier-merchant-settings",
            moduleId: ModuleId_1.ModuleId.Cashier,
            isEnabled: wixExperiments.enabled("specs.wos.businessManagerPhase3"),
            appDefId: appDefIds_1.appDefIds.cashier
        };
        var exampleReactPageComponent = {
            route: "demo-react-lazy",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Example_React,
            pageComponentName: "demo-react-lazy",
            moduleId: ModuleId_1.ModuleId.Examples,
            isEnabled: isDebug
        };
        var exampleAngularPageComponent = {
            route: "demo-angular-lazy",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.Example_Angular,
            pageComponentName: "demo-angular-lazy",
            moduleId: ModuleId_1.ModuleId.Examples,
            isEnabled: isDebug
        };
        var promoteSeoPageComponent = {
            route: "promote-seo",
            isMain: true,
            pageComponentId: PageComponentId_1.PageComponentId.PromoteSeo,
            pageComponentName: "PromoteSeoLazyComponent",
            isEnabled: wixExperiments.enabled("specs.wos.displayPromoteSeo"),
            moduleId: ModuleId_1.ModuleId.PromoteSeo,
            appDefId: appDefIds_1.appDefIds.promoteSeo
        };
        var couponsPageComponent = {
            route: "coupons",
            isMain: true,
            isEnabled: wixExperiments.enabled("specs.wos.CouponsPlatform"),
            pageComponentId: PageComponentId_1.PageComponentId.Coupons,
            pageComponentName: "coupons.app",
            moduleId: ModuleId_1.ModuleId.Coupons,
            appDefId: appDefIds_1.appDefIds.coupons
        };
        var restaurantsPageComponent = {
            route: "restaurants",
            isMain: true,
            isEnabled: wixExperiments.enabled("specs.wos.displayWixRestaurants"),
            pageComponentId: PageComponentId_1.PageComponentId.Restaurants,
            pageComponentName: "restaurants",
            moduleId: ModuleId_1.ModuleId.Restaurants,
            appDefId: appDefIds_1.appDefIds.restaurants
        };
        var triggersPageComponent = {
            route: "triggers",
            isMain: true,
            isEnabled: wixExperiments.enabled("specs.wos.displayTriggers"),
            pageComponentId: PageComponentId_1.PageComponentId.Triggers,
            pageComponentName: "triggers",
            moduleId: ModuleId_1.ModuleId.Triggers,
            appDefId: appDefIds_1.appDefIds.triggers
        };
        var pages = (_a = {}, _a[PageComponentId_1.PageComponentId.Stores] = storesModule, 
        _a[PageComponentId_1.PageComponentId.SiteSettings] = siteSettingsPageComponent, 
        _a[PageComponentId_1.PageComponentId.SellAnywhere] = sellAnywherePageComponent, 
        _a[PageComponentId_1.PageComponentId.Contacts] = contactsPageComponent, _a[PageComponentId_1.PageComponentId.Shoutout] = shoutoutPageComponent, 
        _a[PageComponentId_1.PageComponentId.Invoices] = invoicesPageComponent, _a[PageComponentId_1.PageComponentId.InvoicesSettings] = invoicesSettingsPageComponent, 
        _a[PageComponentId_1.PageComponentId.Cashier] = cashierPageComponent, _a[PageComponentId_1.PageComponentId.PromoteSeo] = promoteSeoPageComponent, 
        _a[PageComponentId_1.PageComponentId.Example_React] = exampleReactPageComponent, 
        _a[PageComponentId_1.PageComponentId.Example_Angular] = exampleAngularPageComponent, 
        _a[PageComponentId_1.PageComponentId.Coupons] = couponsPageComponent, _a[PageComponentId_1.PageComponentId.Restaurants] = restaurantsPageComponent, 
        _a[PageComponentId_1.PageComponentId.Triggers] = triggersPageComponent, _a);
        if (wixExperiments.enabled("specs.wos.DeprecateBuildPageComponentsInfo")) {
            return pages;
        }
        return tslib_1.__assign({}, pages, (_b = {}, _b[PageComponentId_1.PageComponentId.Home] = homePageComponent, 
        _b[PageComponentId_1.PageComponentId.Settings] = settingsPageComponent, _b[PageComponentId_1.PageComponentId.Engage] = engagePageComponent, 
        _b[PageComponentId_1.PageComponentId.EngageCrazyChat] = engageCrazyChatPageComponent, 
        _b));
    }
    exports.buildPageComponentsInfo = buildPageComponentsInfo;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var URI = __webpack_require__(2);
    var MY_ACCOUNT_PREFIX = "/my-account/app";
    function getDeepLinkContext(url) {
        var uri = url && URI(url);
        if (canDeepLink(uri)) {
            return {
                appDefinitionId: uri.segment(2),
                appState: getState(uri).replace("%23", "")
            };
        }
    }
    exports.getDeepLinkContext = getDeepLinkContext;
    function getNavigateToConfigFromDeepLink(url) {
        var deepLinkContext = getDeepLinkContext(url);
        if (deepLinkContext) {
            return {
                pageComponentId: deepLinkContext.appDefinitionId,
                viewId: "",
                contextData: {
                    appState: deepLinkContext.appState
                }
            };
        }
    }
    exports.getNavigateToConfigFromDeepLink = getNavigateToConfigFromDeepLink;
    function getState(uri) {
        var segments = uri.segment();
        var pathSuffix = segments.splice(4);
        var state = pathSuffix.join("/");
        return state + uri.search() + uri.hash();
    }
    function canDeepLink(uri) {
        return uri && uri.pathname().indexOf(MY_ACCOUNT_PREFIX) === 0;
    }
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ModuleId_1 = __webpack_require__(26);
    exports.ModulePriorities = [ ModuleId_1.ModuleId.MusicManager, ModuleId_1.ModuleId.Restaurants, ModuleId_1.ModuleId.Stores, ModuleId_1.ModuleId.Bookings, ModuleId_1.ModuleId.PhotoAlbums, ModuleId_1.ModuleId.ArtStore, ModuleId_1.ModuleId.Video, ModuleId_1.ModuleId.Events, ModuleId_1.ModuleId.SocialBlog, ModuleId_1.ModuleId.PromoteSeo, ModuleId_1.ModuleId.Shoutout, ModuleId_1.ModuleId.VideoMaker, ModuleId_1.ModuleId.Engage, ModuleId_1.ModuleId.Invoices, ModuleId_1.ModuleId.Contacts, ModuleId_1.ModuleId.MarketingIntegration, ModuleId_1.ModuleId.WixCodeDatabase ];
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var IViewMode;
    (function(IViewMode) {
        IViewMode["EDITOR"] = "editor";
        IViewMode["MA"] = "MA";
        IViewMode["DASHBOARD"] = "dashboard";
        IViewMode["ADI"] = "onboarding";
    })(IViewMode || (IViewMode = {}));
    exports.IViewMode = IViewMode;
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var module_registry_1 = __webpack_require__(3);
    var ToastType;
    (function(ToastType) {
        ToastType["STANDARD"] = "STANDARD";
        ToastType["PREMIUM"] = "PREMIUM";
        ToastType["SUCCESS"] = "SUCCESS";
        ToastType["WARNING"] = "WARNING";
        ToastType["ERROR"] = "ERROR";
    })(ToastType = exports.ToastType || (exports.ToastType = {}));
    var ToastPriority;
    (function(ToastPriority) {
        ToastPriority["LOW"] = "LOW";
        ToastPriority["NORMAL"] = "NORMAL";
        ToastPriority["HIGH"] = "HIGH";
    })(ToastPriority = exports.ToastPriority || (exports.ToastPriority = {}));
    var ToastScope;
    (function(ToastScope) {
        ToastScope["APP"] = "APP";
        ToastScope["DASHBOARD"] = "DASHBOARD";
    })(ToastScope = exports.ToastScope || (exports.ToastScope = {}));
    var ToastActionUiType;
    (function(ToastActionUiType) {
        ToastActionUiType["BUTTON"] = "BUTTON";
        ToastActionUiType["LINK"] = "LINK";
    })(ToastActionUiType = exports.ToastActionUiType || (exports.ToastActionUiType = {}));
    var ToastTimeout;
    (function(ToastTimeout) {
        ToastTimeout["NONE"] = "NONE";
        ToastTimeout["NORMAL"] = "NORMAL";
    })(ToastTimeout = exports.ToastTimeout || (exports.ToastTimeout = {}));
    exports.isExternalNavigationTarget = function(navigationTarget) {
        return !!navigationTarget.url;
    };
    exports.isInternalNavigationTarget = function(navigationTarget) {
        return !!navigationTarget.navigateToConfig;
    };
    exports.showToast = function(toastConfig) {
        return module_registry_1.default.invoke("businessManager.showToast", toastConfig);
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var module_registry_1 = __webpack_require__(3);
    exports.getMandatoryBIFields = function() {
        return module_registry_1.default.invoke("businessManager.getMandatoryBIFields");
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var module_registry_1 = __webpack_require__(3);
    exports.hideLoadingSignal = function() {
        return module_registry_1.default.notifyListeners("businessManager.hideLoadingSignal");
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var module_registry_1 = __webpack_require__(3);
    exports.OPEN_SIDE_PANEL = "businessManager.openSidePanel";
    exports.CLOSE_SIDE_PANEL = "businessManager.closeSidePanel";
    exports.ON_SIDE_PANEL_CLOSE = "businessManager.onSidePanelClose";
    exports.HIDE_SIDE_PANEL_LOADING_SIGNAL = "businessManager.hideSidePanelLoadingSignal";
    exports.openSidePanel = function(openSidePanelParams) {
        return module_registry_1.default.invoke(exports.OPEN_SIDE_PANEL, openSidePanelParams);
    };
    exports.closeSidePanel = function() {
        return module_registry_1.default.invoke(exports.CLOSE_SIDE_PANEL);
    };
    exports.onSidePanelClose = function(listener) {
        return module_registry_1.default.addListener(exports.ON_SIDE_PANEL_CLOSE, listener);
    };
    exports.hideSidePanelLoadingSignal = function() {
        return module_registry_1.default.invoke(exports.HIDE_SIDE_PANEL_LOADING_SIGNAL);
    };
}, function(module, exports, __webpack_require__) {
    (function(process, global) {
        (function(global, factory) {
            true ? module.exports = factory() : undefined;
        })(this, function() {
            "use strict";
            function objectOrFunction(x) {
                var type = typeof x;
                return x !== null && (type === "object" || type === "function");
            }
            function isFunction(x) {
                return typeof x === "function";
            }
            var _isArray = void 0;
            if (Array.isArray) {
                _isArray = Array.isArray;
            } else {
                _isArray = function(x) {
                    return Object.prototype.toString.call(x) === "[object Array]";
                };
            }
            var isArray = _isArray;
            var len = 0;
            var vertxNext = void 0;
            var customSchedulerFn = void 0;
            var asap = function asap(callback, arg) {
                queue[len] = callback;
                queue[len + 1] = arg;
                len += 2;
                if (len === 2) {
                    if (customSchedulerFn) {
                        customSchedulerFn(flush);
                    } else {
                        scheduleFlush();
                    }
                }
            };
            function setScheduler(scheduleFn) {
                customSchedulerFn = scheduleFn;
            }
            function setAsap(asapFn) {
                asap = asapFn;
            }
            var browserWindow = typeof window !== "undefined" ? window : undefined;
            var browserGlobal = browserWindow || {};
            var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
            var isNode = typeof self === "undefined" && typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
            var isWorker = typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined";
            function useNextTick() {
                return function() {
                    return process.nextTick(flush);
                };
            }
            function useVertxTimer() {
                if (typeof vertxNext !== "undefined") {
                    return function() {
                        vertxNext(flush);
                    };
                }
                return useSetTimeout();
            }
            function useMutationObserver() {
                var iterations = 0;
                var observer = new BrowserMutationObserver(flush);
                var node = document.createTextNode("");
                observer.observe(node, {
                    characterData: true
                });
                return function() {
                    node.data = iterations = ++iterations % 2;
                };
            }
            function useMessageChannel() {
                var channel = new MessageChannel();
                channel.port1.onmessage = flush;
                return function() {
                    return channel.port2.postMessage(0);
                };
            }
            function useSetTimeout() {
                var globalSetTimeout = setTimeout;
                return function() {
                    return globalSetTimeout(flush, 1);
                };
            }
            var queue = new Array(1e3);
            function flush() {
                for (var i = 0; i < len; i += 2) {
                    var callback = queue[i];
                    var arg = queue[i + 1];
                    callback(arg);
                    queue[i] = undefined;
                    queue[i + 1] = undefined;
                }
                len = 0;
            }
            function attemptVertx() {
                try {
                    var vertx = Function("return this")().require("vertx");
                    vertxNext = vertx.runOnLoop || vertx.runOnContext;
                    return useVertxTimer();
                } catch (e) {
                    return useSetTimeout();
                }
            }
            var scheduleFlush = void 0;
            if (isNode) {
                scheduleFlush = useNextTick();
            } else if (BrowserMutationObserver) {
                scheduleFlush = useMutationObserver();
            } else if (isWorker) {
                scheduleFlush = useMessageChannel();
            } else if (browserWindow === undefined && "function" === "function") {
                scheduleFlush = attemptVertx();
            } else {
                scheduleFlush = useSetTimeout();
            }
            function then(onFulfillment, onRejection) {
                var parent = this;
                var child = new this.constructor(noop);
                if (child[PROMISE_ID] === undefined) {
                    makePromise(child);
                }
                var _state = parent._state;
                if (_state) {
                    var callback = arguments[_state - 1];
                    asap(function() {
                        return invokeCallback(_state, child, callback, parent._result);
                    });
                } else {
                    subscribe(parent, child, onFulfillment, onRejection);
                }
                return child;
            }
            function resolve$1(object) {
                var Constructor = this;
                if (object && typeof object === "object" && object.constructor === Constructor) {
                    return object;
                }
                var promise = new Constructor(noop);
                resolve(promise, object);
                return promise;
            }
            var PROMISE_ID = Math.random().toString(36).substring(2);
            function noop() {}
            var PENDING = void 0;
            var FULFILLED = 1;
            var REJECTED = 2;
            var TRY_CATCH_ERROR = {
                error: null
            };
            function selfFulfillment() {
                return new TypeError("You cannot resolve a promise with itself");
            }
            function cannotReturnOwn() {
                return new TypeError("A promises callback cannot return that same promise.");
            }
            function getThen(promise) {
                try {
                    return promise.then;
                } catch (error) {
                    TRY_CATCH_ERROR.error = error;
                    return TRY_CATCH_ERROR;
                }
            }
            function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
                try {
                    then$$1.call(value, fulfillmentHandler, rejectionHandler);
                } catch (e) {
                    return e;
                }
            }
            function handleForeignThenable(promise, thenable, then$$1) {
                asap(function(promise) {
                    var sealed = false;
                    var error = tryThen(then$$1, thenable, function(value) {
                        if (sealed) {
                            return;
                        }
                        sealed = true;
                        if (thenable !== value) {
                            resolve(promise, value);
                        } else {
                            fulfill(promise, value);
                        }
                    }, function(reason) {
                        if (sealed) {
                            return;
                        }
                        sealed = true;
                        reject(promise, reason);
                    }, "Settle: " + (promise._label || " unknown promise"));
                    if (!sealed && error) {
                        sealed = true;
                        reject(promise, error);
                    }
                }, promise);
            }
            function handleOwnThenable(promise, thenable) {
                if (thenable._state === FULFILLED) {
                    fulfill(promise, thenable._result);
                } else if (thenable._state === REJECTED) {
                    reject(promise, thenable._result);
                } else {
                    subscribe(thenable, undefined, function(value) {
                        return resolve(promise, value);
                    }, function(reason) {
                        return reject(promise, reason);
                    });
                }
            }
            function handleMaybeThenable(promise, maybeThenable, then$$1) {
                if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
                    handleOwnThenable(promise, maybeThenable);
                } else {
                    if (then$$1 === TRY_CATCH_ERROR) {
                        reject(promise, TRY_CATCH_ERROR.error);
                        TRY_CATCH_ERROR.error = null;
                    } else if (then$$1 === undefined) {
                        fulfill(promise, maybeThenable);
                    } else if (isFunction(then$$1)) {
                        handleForeignThenable(promise, maybeThenable, then$$1);
                    } else {
                        fulfill(promise, maybeThenable);
                    }
                }
            }
            function resolve(promise, value) {
                if (promise === value) {
                    reject(promise, selfFulfillment());
                } else if (objectOrFunction(value)) {
                    handleMaybeThenable(promise, value, getThen(value));
                } else {
                    fulfill(promise, value);
                }
            }
            function publishRejection(promise) {
                if (promise._onerror) {
                    promise._onerror(promise._result);
                }
                publish(promise);
            }
            function fulfill(promise, value) {
                if (promise._state !== PENDING) {
                    return;
                }
                promise._result = value;
                promise._state = FULFILLED;
                if (promise._subscribers.length !== 0) {
                    asap(publish, promise);
                }
            }
            function reject(promise, reason) {
                if (promise._state !== PENDING) {
                    return;
                }
                promise._state = REJECTED;
                promise._result = reason;
                asap(publishRejection, promise);
            }
            function subscribe(parent, child, onFulfillment, onRejection) {
                var _subscribers = parent._subscribers;
                var length = _subscribers.length;
                parent._onerror = null;
                _subscribers[length] = child;
                _subscribers[length + FULFILLED] = onFulfillment;
                _subscribers[length + REJECTED] = onRejection;
                if (length === 0 && parent._state) {
                    asap(publish, parent);
                }
            }
            function publish(promise) {
                var subscribers = promise._subscribers;
                var settled = promise._state;
                if (subscribers.length === 0) {
                    return;
                }
                var child = void 0, callback = void 0, detail = promise._result;
                for (var i = 0; i < subscribers.length; i += 3) {
                    child = subscribers[i];
                    callback = subscribers[i + settled];
                    if (child) {
                        invokeCallback(settled, child, callback, detail);
                    } else {
                        callback(detail);
                    }
                }
                promise._subscribers.length = 0;
            }
            function tryCatch(callback, detail) {
                try {
                    return callback(detail);
                } catch (e) {
                    TRY_CATCH_ERROR.error = e;
                    return TRY_CATCH_ERROR;
                }
            }
            function invokeCallback(settled, promise, callback, detail) {
                var hasCallback = isFunction(callback), value = void 0, error = void 0, succeeded = void 0, failed = void 0;
                if (hasCallback) {
                    value = tryCatch(callback, detail);
                    if (value === TRY_CATCH_ERROR) {
                        failed = true;
                        error = value.error;
                        value.error = null;
                    } else {
                        succeeded = true;
                    }
                    if (promise === value) {
                        reject(promise, cannotReturnOwn());
                        return;
                    }
                } else {
                    value = detail;
                    succeeded = true;
                }
                if (promise._state !== PENDING) {} else if (hasCallback && succeeded) {
                    resolve(promise, value);
                } else if (failed) {
                    reject(promise, error);
                } else if (settled === FULFILLED) {
                    fulfill(promise, value);
                } else if (settled === REJECTED) {
                    reject(promise, value);
                }
            }
            function initializePromise(promise, resolver) {
                try {
                    resolver(function resolvePromise(value) {
                        resolve(promise, value);
                    }, function rejectPromise(reason) {
                        reject(promise, reason);
                    });
                } catch (e) {
                    reject(promise, e);
                }
            }
            var id = 0;
            function nextId() {
                return id++;
            }
            function makePromise(promise) {
                promise[PROMISE_ID] = id++;
                promise._state = undefined;
                promise._result = undefined;
                promise._subscribers = [];
            }
            function validationError() {
                return new Error("Array Methods must be provided an Array");
            }
            var Enumerator = function() {
                function Enumerator(Constructor, input) {
                    this._instanceConstructor = Constructor;
                    this.promise = new Constructor(noop);
                    if (!this.promise[PROMISE_ID]) {
                        makePromise(this.promise);
                    }
                    if (isArray(input)) {
                        this.length = input.length;
                        this._remaining = input.length;
                        this._result = new Array(this.length);
                        if (this.length === 0) {
                            fulfill(this.promise, this._result);
                        } else {
                            this.length = this.length || 0;
                            this._enumerate(input);
                            if (this._remaining === 0) {
                                fulfill(this.promise, this._result);
                            }
                        }
                    } else {
                        reject(this.promise, validationError());
                    }
                }
                Enumerator.prototype._enumerate = function _enumerate(input) {
                    for (var i = 0; this._state === PENDING && i < input.length; i++) {
                        this._eachEntry(input[i], i);
                    }
                };
                Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
                    var c = this._instanceConstructor;
                    var resolve$$1 = c.resolve;
                    if (resolve$$1 === resolve$1) {
                        var _then = getThen(entry);
                        if (_then === then && entry._state !== PENDING) {
                            this._settledAt(entry._state, i, entry._result);
                        } else if (typeof _then !== "function") {
                            this._remaining--;
                            this._result[i] = entry;
                        } else if (c === Promise$1) {
                            var promise = new c(noop);
                            handleMaybeThenable(promise, entry, _then);
                            this._willSettleAt(promise, i);
                        } else {
                            this._willSettleAt(new c(function(resolve$$1) {
                                return resolve$$1(entry);
                            }), i);
                        }
                    } else {
                        this._willSettleAt(resolve$$1(entry), i);
                    }
                };
                Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
                    var promise = this.promise;
                    if (promise._state === PENDING) {
                        this._remaining--;
                        if (state === REJECTED) {
                            reject(promise, value);
                        } else {
                            this._result[i] = value;
                        }
                    }
                    if (this._remaining === 0) {
                        fulfill(promise, this._result);
                    }
                };
                Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
                    var enumerator = this;
                    subscribe(promise, undefined, function(value) {
                        return enumerator._settledAt(FULFILLED, i, value);
                    }, function(reason) {
                        return enumerator._settledAt(REJECTED, i, reason);
                    });
                };
                return Enumerator;
            }();
            function all(entries) {
                return new Enumerator(this, entries).promise;
            }
            function race(entries) {
                var Constructor = this;
                if (!isArray(entries)) {
                    return new Constructor(function(_, reject) {
                        return reject(new TypeError("You must pass an array to race."));
                    });
                } else {
                    return new Constructor(function(resolve, reject) {
                        var length = entries.length;
                        for (var i = 0; i < length; i++) {
                            Constructor.resolve(entries[i]).then(resolve, reject);
                        }
                    });
                }
            }
            function reject$1(reason) {
                var Constructor = this;
                var promise = new Constructor(noop);
                reject(promise, reason);
                return promise;
            }
            function needsResolver() {
                throw new TypeError("You must pass a resolver function as the first argument to the promise constructor");
            }
            function needsNew() {
                throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
            }
            var Promise$1 = function() {
                function Promise(resolver) {
                    this[PROMISE_ID] = nextId();
                    this._result = this._state = undefined;
                    this._subscribers = [];
                    if (noop !== resolver) {
                        typeof resolver !== "function" && needsResolver();
                        this instanceof Promise ? initializePromise(this, resolver) : needsNew();
                    }
                }
                Promise.prototype.catch = function _catch(onRejection) {
                    return this.then(null, onRejection);
                };
                Promise.prototype.finally = function _finally(callback) {
                    var promise = this;
                    var constructor = promise.constructor;
                    if (isFunction(callback)) {
                        return promise.then(function(value) {
                            return constructor.resolve(callback()).then(function() {
                                return value;
                            });
                        }, function(reason) {
                            return constructor.resolve(callback()).then(function() {
                                throw reason;
                            });
                        });
                    }
                    return promise.then(callback, callback);
                };
                return Promise;
            }();
            Promise$1.prototype.then = then;
            Promise$1.all = all;
            Promise$1.race = race;
            Promise$1.resolve = resolve$1;
            Promise$1.reject = reject$1;
            Promise$1._setScheduler = setScheduler;
            Promise$1._setAsap = setAsap;
            Promise$1._asap = asap;
            function polyfill() {
                var local = void 0;
                if (typeof global !== "undefined") {
                    local = global;
                } else if (typeof self !== "undefined") {
                    local = self;
                } else {
                    try {
                        local = Function("return this")();
                    } catch (e) {
                        throw new Error("polyfill failed because global object is unavailable in this environment");
                    }
                }
                var P = local.Promise;
                if (P) {
                    var promiseToString = null;
                    try {
                        promiseToString = Object.prototype.toString.call(P.resolve());
                    } catch (e) {}
                    if (promiseToString === "[object Promise]" && !P.cast) {
                        return;
                    }
                }
                local.Promise = Promise$1;
            }
            Promise$1.polyfill = polyfill;
            Promise$1.Promise = Promise$1;
            return Promise$1;
        });
    }).call(this, __webpack_require__(169), __webpack_require__(5));
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(178);
}, function(module, exports) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]";
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function apply(func, thisArg, args) {
        switch (args.length) {
          case 0:
            return func.call(thisArg);

          case 1:
            return func.call(thisArg, args[0]);

          case 2:
            return func.call(thisArg, args[0], args[1]);

          case 3:
            return func.call(thisArg, args[0], args[1], args[2]);
        }
        return func.apply(thisArg, args);
    }
    function baseTimes(n, iteratee) {
        var index = -1, result = Array(n);
        while (++index < n) {
            result[index] = iteratee(index);
        }
        return result;
    }
    function overArg(func, transform) {
        return function(arg) {
            return func(transform(arg));
        };
    }
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeKeys = overArg(Object.keys, Object), nativeMax = Math.max;
    var nonEnumShadows = !propertyIsEnumerable.call({
        valueOf: 1
    }, "valueOf");
    function arrayLikeKeys(value, inherited) {
        var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
        var length = result.length, skipIndexes = !!length;
        for (var key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
                result.push(key);
            }
        }
        return result;
    }
    function assignValue(object, key, value) {
        var objValue = object[key];
        if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
            object[key] = value;
        }
    }
    function baseKeys(object) {
        if (!isPrototype(object)) {
            return nativeKeys(object);
        }
        var result = [];
        for (var key in Object(object)) {
            if (hasOwnProperty.call(object, key) && key != "constructor") {
                result.push(key);
            }
        }
        return result;
    }
    function baseRest(func, start) {
        start = nativeMax(start === undefined ? func.length - 1 : start, 0);
        return function() {
            var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
            while (++index < length) {
                array[index] = args[start + index];
            }
            index = -1;
            var otherArgs = Array(start + 1);
            while (++index < start) {
                otherArgs[index] = args[index];
            }
            otherArgs[start] = array;
            return apply(func, this, otherArgs);
        };
    }
    function copyObject(source, props, object, customizer) {
        object || (object = {});
        var index = -1, length = props.length;
        while (++index < length) {
            var key = props[index];
            var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;
            assignValue(object, key, newValue === undefined ? source[key] : newValue);
        }
        return object;
    }
    function createAssigner(assigner) {
        return baseRest(function(object, sources) {
            var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined, guard = length > 2 ? sources[2] : undefined;
            customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, 
            customizer) : undefined;
            if (guard && isIterateeCall(sources[0], sources[1], guard)) {
                customizer = length < 3 ? undefined : customizer;
                length = 1;
            }
            object = Object(object);
            while (++index < length) {
                var source = sources[index];
                if (source) {
                    assigner(object, source, index, customizer);
                }
            }
            return object;
        });
    }
    function isIndex(value, length) {
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isIterateeCall(value, index, object) {
        if (!isObject(object)) {
            return false;
        }
        var type = typeof index;
        if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
            return eq(object[index], value);
        }
        return false;
    }
    function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
    }
    function eq(value, other) {
        return value === other || value !== value && other !== other;
    }
    function isArguments(value) {
        return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
        return isObjectLike(value) && isArrayLike(value);
    }
    function isFunction(value) {
        var tag = isObject(value) ? objectToString.call(value) : "";
        return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
        var type = typeof value;
        return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
        return !!value && typeof value == "object";
    }
    var assign = createAssigner(function(object, source) {
        if (nonEnumShadows || isPrototype(source) || isArrayLike(source)) {
            copyObject(source, keys(source), object);
            return;
        }
        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                assignValue(object, key, source[key]);
            }
        }
    });
    function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    module.exports = assign;
}, function(module, exports) {
    var process = module.exports = {};
    var cachedSetTimeout;
    var cachedClearTimeout;
    function defaultSetTimout() {
        throw new Error("setTimeout has not been defined");
    }
    function defaultClearTimeout() {
        throw new Error("clearTimeout has not been defined");
    }
    (function() {
        try {
            if (typeof setTimeout === "function") {
                cachedSetTimeout = setTimeout;
            } else {
                cachedSetTimeout = defaultSetTimout;
            }
        } catch (e) {
            cachedSetTimeout = defaultSetTimout;
        }
        try {
            if (typeof clearTimeout === "function") {
                cachedClearTimeout = clearTimeout;
            } else {
                cachedClearTimeout = defaultClearTimeout;
            }
        } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
        }
    })();
    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            return setTimeout(fun, 0);
        }
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            return cachedSetTimeout(fun, 0);
        } catch (e) {
            try {
                return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
                return cachedSetTimeout.call(this, fun, 0);
            }
        }
    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            return clearTimeout(marker);
        }
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            return cachedClearTimeout(marker);
        } catch (e) {
            try {
                return cachedClearTimeout.call(null, marker);
            } catch (e) {
                return cachedClearTimeout.call(this, marker);
            }
        }
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;
    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }
    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
        var len = queue.length;
        while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    process.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    };
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function() {
        this.fun.apply(null, this.array);
    };
    process.title = "browser";
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = "";
    process.versions = {};
    function noop() {}
    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;
    process.listeners = function(name) {
        return [];
    };
    process.binding = function(name) {
        throw new Error("process.binding is not supported");
    };
    process.cwd = function() {
        return "/";
    };
    process.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
    };
    process.umask = function() {
        return 0;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function bind(fn, thisArg) {
        return function wrap() {
            var args = new Array(arguments.length);
            for (var i = 0; i < args.length; i++) {
                args[i] = arguments[i];
            }
            return fn.apply(thisArg, args);
        };
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    var settle = __webpack_require__(182);
    var buildURL = __webpack_require__(184);
    var parseHeaders = __webpack_require__(185);
    var isURLSameOrigin = __webpack_require__(186);
    var createError = __webpack_require__(172);
    var btoa = typeof window !== "undefined" && window.btoa && window.btoa.bind(window) || __webpack_require__(187);
    module.exports = function xhrAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve, reject) {
            var requestData = config.data;
            var requestHeaders = config.headers;
            if (utils.isFormData(requestData)) {
                delete requestHeaders["Content-Type"];
            }
            var request = new XMLHttpRequest();
            var loadEvent = "onreadystatechange";
            var xDomain = false;
            if ("production" !== "test" && typeof window !== "undefined" && window.XDomainRequest && !("withCredentials" in request) && !isURLSameOrigin(config.url)) {
                request = new window.XDomainRequest();
                loadEvent = "onload";
                xDomain = true;
                request.onprogress = function handleProgress() {};
                request.ontimeout = function handleTimeout() {};
            }
            if (config.auth) {
                var username = config.auth.username || "";
                var password = config.auth.password || "";
                requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
            }
            request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
            request.timeout = config.timeout;
            request[loadEvent] = function handleLoad() {
                if (!request || request.readyState !== 4 && !xDomain) {
                    return;
                }
                if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
                    return;
                }
                var responseHeaders = "getAllResponseHeaders" in request ? parseHeaders(request.getAllResponseHeaders()) : null;
                var responseData = !config.responseType || config.responseType === "text" ? request.responseText : request.response;
                var response = {
                    data: responseData,
                    status: request.status === 1223 ? 204 : request.status,
                    statusText: request.status === 1223 ? "No Content" : request.statusText,
                    headers: responseHeaders,
                    config: config,
                    request: request
                };
                settle(resolve, reject, response);
                request = null;
            };
            request.onerror = function handleError() {
                reject(createError("Network Error", config, null, request));
                request = null;
            };
            request.ontimeout = function handleTimeout() {
                reject(createError("timeout of " + config.timeout + "ms exceeded", config, "ECONNABORTED", request));
                request = null;
            };
            if (utils.isStandardBrowserEnv()) {
                var cookies = __webpack_require__(188);
                var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;
                if (xsrfValue) {
                    requestHeaders[config.xsrfHeaderName] = xsrfValue;
                }
            }
            if ("setRequestHeader" in request) {
                utils.forEach(requestHeaders, function setRequestHeader(val, key) {
                    if (typeof requestData === "undefined" && key.toLowerCase() === "content-type") {
                        delete requestHeaders[key];
                    } else {
                        request.setRequestHeader(key, val);
                    }
                });
            }
            if (config.withCredentials) {
                request.withCredentials = true;
            }
            if (config.responseType) {
                try {
                    request.responseType = config.responseType;
                } catch (e) {
                    if (config.responseType !== "json") {
                        throw e;
                    }
                }
            }
            if (typeof config.onDownloadProgress === "function") {
                request.addEventListener("progress", config.onDownloadProgress);
            }
            if (typeof config.onUploadProgress === "function" && request.upload) {
                request.upload.addEventListener("progress", config.onUploadProgress);
            }
            if (config.cancelToken) {
                config.cancelToken.promise.then(function onCanceled(cancel) {
                    if (!request) {
                        return;
                    }
                    request.abort();
                    reject(cancel);
                    request = null;
                });
            }
            if (requestData === undefined) {
                requestData = null;
            }
            request.send(requestData);
        });
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var enhanceError = __webpack_require__(183);
    module.exports = function createError(message, config, code, request, response) {
        var error = new Error(message);
        return enhanceError(error, config, code, request, response);
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function isCancel(value) {
        return !!(value && value.__CANCEL__);
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    function Cancel(message) {
        this.message = message;
    }
    Cancel.prototype.toString = function toString() {
        return "Cancel" + (this.message ? ": " + this.message : "");
    };
    Cancel.prototype.__CANCEL__ = true;
    module.exports = Cancel;
}, function(module, exports, __webpack_require__) {
    (function(global) {
        var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991;
        var argsTag = "[object Arguments]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", symbolTag = "[object Symbol]";
        var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
        var freeSelf = typeof self == "object" && self && self.Object === Object && self;
        var root = freeGlobal || freeSelf || Function("return this")();
        function apply(func, thisArg, args) {
            switch (args.length) {
              case 0:
                return func.call(thisArg);

              case 1:
                return func.call(thisArg, args[0]);

              case 2:
                return func.call(thisArg, args[0], args[1]);

              case 3:
                return func.call(thisArg, args[0], args[1], args[2]);
            }
            return func.apply(thisArg, args);
        }
        function arrayMap(array, iteratee) {
            var index = -1, length = array ? array.length : 0, result = Array(length);
            while (++index < length) {
                result[index] = iteratee(array[index], index, array);
            }
            return result;
        }
        function arrayPush(array, values) {
            var index = -1, length = values.length, offset = array.length;
            while (++index < length) {
                array[offset + index] = values[index];
            }
            return array;
        }
        var objectProto = Object.prototype;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var objectToString = objectProto.toString;
        var Symbol = root.Symbol, propertyIsEnumerable = objectProto.propertyIsEnumerable, spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;
        var nativeMax = Math.max;
        function baseFlatten(array, depth, predicate, isStrict, result) {
            var index = -1, length = array.length;
            predicate || (predicate = isFlattenable);
            result || (result = []);
            while (++index < length) {
                var value = array[index];
                if (depth > 0 && predicate(value)) {
                    if (depth > 1) {
                        baseFlatten(value, depth - 1, predicate, isStrict, result);
                    } else {
                        arrayPush(result, value);
                    }
                } else if (!isStrict) {
                    result[result.length] = value;
                }
            }
            return result;
        }
        function basePick(object, props) {
            object = Object(object);
            return basePickBy(object, props, function(value, key) {
                return key in object;
            });
        }
        function basePickBy(object, props, predicate) {
            var index = -1, length = props.length, result = {};
            while (++index < length) {
                var key = props[index], value = object[key];
                if (predicate(value, key)) {
                    result[key] = value;
                }
            }
            return result;
        }
        function baseRest(func, start) {
            start = nativeMax(start === undefined ? func.length - 1 : start, 0);
            return function() {
                var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
                while (++index < length) {
                    array[index] = args[start + index];
                }
                index = -1;
                var otherArgs = Array(start + 1);
                while (++index < start) {
                    otherArgs[index] = args[index];
                }
                otherArgs[start] = array;
                return apply(func, this, otherArgs);
            };
        }
        function isFlattenable(value) {
            return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
        }
        function toKey(value) {
            if (typeof value == "string" || isSymbol(value)) {
                return value;
            }
            var result = value + "";
            return result == "0" && 1 / value == -INFINITY ? "-0" : result;
        }
        function isArguments(value) {
            return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
        }
        var isArray = Array.isArray;
        function isArrayLike(value) {
            return value != null && isLength(value.length) && !isFunction(value);
        }
        function isArrayLikeObject(value) {
            return isObjectLike(value) && isArrayLike(value);
        }
        function isFunction(value) {
            var tag = isObject(value) ? objectToString.call(value) : "";
            return tag == funcTag || tag == genTag;
        }
        function isLength(value) {
            return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        function isObject(value) {
            var type = typeof value;
            return !!value && (type == "object" || type == "function");
        }
        function isObjectLike(value) {
            return !!value && typeof value == "object";
        }
        function isSymbol(value) {
            return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
        }
        var pick = baseRest(function(object, props) {
            return object == null ? {} : basePick(object, arrayMap(baseFlatten(props, 1), toKey));
        });
        module.exports = pick;
    }).call(this, __webpack_require__(5));
}, function(module, exports, __webpack_require__) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var axios_1 = __webpack_require__(167);
    var URI = __webpack_require__(2);
    exports.FieldFilters = {
        dashboard: [ "appDefinitionId", "name", "teaser", "svgIcon", "hasDashboard" ],
        mostPopular: [ "appDefinitionId", "appIcon", "by", "companyWebsite", "dashboard", "downloads", "featuredImageNew", "frontPageImage", "hasMobile", "hasPremium", "isTrial", "name", "overrideDashboardUrl", "premiumOnly", "slug", "supportInfo", "teaser", "alwaysOnDashboard", "hasDashboard", "isWixComponent", "appType", "hasSection", "widgets", "permissions", "roundIcon" ],
        newApps: [ "appDefinitionId", "appIcon", "by", "companyWebsite", "dashboard", "downloads", "featuredImageNew", "frontPageImage", "hasMobile", "hasPremium", "isTrial", "name", "overrideDashboardUrl", "premiumOnly", "slug", "supportInfo", "teaser", "alwaysOnDashboard", "hasDashboard", "isWixComponent", "appType", "hasSection", "widgets", "permissions", "roundIcon" ],
        dashboardInstalled: [ "appDefinitionId", "appIcon", "by", "companyWebsite", "dashboard", "downloads", "featuredImageNew", "frontPageImage", "hasMobile", "hasPremium", "isTrial", "name", "overrideDashboardUrl", "premiumOnly", "slug", "supportInfo", "teaser", "alwaysOnDashboard", "hasDashboard", "isWixComponent", "appType", "hasSection", "widgets", "permissions", "roundIcon" ],
        relatedApps: [ "appDefinitionId", "slug", "name", "appIcon", "colorSvgIcon", "weights", "categories", "by", "relatedAppsTeaser", "hasSection", "widgets.defaultWidth", "widgets.defaultHeight" ],
        featured: [ "appDefinitionId", "appIcon", "by", "companyWebsite", "dashboard", "downloads", "featuredImage", "featuredImageNew", "featuredImageCarousel3", "frontPageImage", "hasMobile", "hasPremium", "externalPremium", "isTrial", "isWixLabs", "name", "overrideDashboardUrl", "overrideDashboardLink", "premiumOnly", "slug", "supportInfo", "teaser", "alwaysOnDashboard", "hasDashboard", "hasPublishedDashboard", "isWixComponent", "appType", "hasSection", "widgets", "permissions", "publishedAt", "downloadsAllTime", "overrideUpgradeUrl", "listedInMarket" ],
        pageApps: [ "widgets.title", "widgets.widgetId", "appDefinitionId" ],
        categories: [ "slug", "name", "description", "key", "id" ]
    };
    exports.ExcludeFilters = {
        old: [ "editor_1.4_incompatible", "ecommerce_old" ]
    };
    exports.AllAppFields = [ "appDefinitionId", "slug", "isTrial", "appType", "widgets", "name", "appIcon", "hasSection", "hasWidget", "hasDashboard", "hasEditorEndpoints", "hasPublishedDashboard", "listedInMarket", "description", "pictures", "teaser", "features", "liveDemoUrl", "companyWebsite", "featuredImage", "upgradeBenefits", "frontPageImage", "socialShareImage", "by", "packages", "billingPanelType", "isWixComponent", "isWixLabs", "hasPremium", "hasFree", "featuredImageNew", "featuredImageCarousel3", "dashboardImage", "overrideDashboardUrl", "dashboard", "supportInfo", "publishedAt", "premiumOnly", "externalPremium", "alwaysOnDashboard", "developerInfo", "openAppButton", "hidePricing", "downloads", "downloadsAllTime", "isFullPage", "isTPA", "imageEditorCarousel3", "bestByWix", "upgradeTitle", "monochromeIcon", "svgIcon", "roundIcon", "premiumBannerImage", "categories", "weights", "hideAppFirstTimeMsg", "editorGfpp", "editorCompNonEssential" ];
    var SupportedSearchParams = [ "q", "fields", "market", "dashboard", "language", "lang", "limit", "exclude", "cb339" ];
    exports.BasePath = "/_api/app-market-api/";
    exports.MainPaths = {
        apps: "apps/",
        categories: "categories/"
    };
    exports.Paths = {
        newApps: exports.MainPaths.apps + "new",
        dashboard: exports.MainPaths.apps + "dashboard",
        dashboardInstalled: exports.MainPaths.apps + "dashboard-installed",
        mostPopular: exports.MainPaths.apps + "popular",
        pageApps: exports.MainPaths.apps + "page-apps",
        featured: exports.MainPaths.apps + "featuredCat",
        pending: exports.MainPaths.apps + "pending"
    };
    function buildUrl(options) {
        if (options === void 0) {
            options = {};
        }
        var url;
        if (options.path) {
            url = new URI(exports.BasePath + options.path);
        } else {
            url = new URI(exports.BasePath);
        }
        if (options.search) {
            var search = options.search;
            for (var key in search) {
                if (search.hasOwnProperty(key) && SupportedSearchParams.indexOf(key) > -1) {
                    var value = search[key];
                    if (Array.isArray(search[key])) {
                        value = search[key].join(",");
                    }
                    url.addSearch(key, value);
                }
            }
        }
        return url.toString();
    }
    function searchTranslator(options) {
        if (options.appIds) {
            options["q"] = options.appIds;
            delete options.appIds;
        }
        return options;
    }
    function getApps(path, options) {
        return axios_1.default.get(buildUrl({
            path: path,
            search: options
        })).then(function(response) {
            return response.data;
        });
    }
    exports.getCustom = function(path, query) {
        if (!path) {
            Promise.reject({
                error: "path must be specified"
            });
        } else {
            return getApps(path, searchTranslator(query));
        }
    };
    exports.getCategories = function(lang, market) {
        if (lang === void 0) {
            lang = "en";
        }
        if (market === void 0) {
            market = "dashboard,editor";
        }
        return getApps(exports.MainPaths.categories, {
            fields: exports.FieldFilters.categories,
            lang: lang,
            market: market
        });
    };
    exports.getDashboardInstalled = function(language) {
        if (language === void 0) {
            language = "en";
        }
        return getApps(exports.Paths.dashboardInstalled, {
            fields: exports.FieldFilters.dashboardInstalled,
            cb339: new Date().getTime(),
            language: language
        });
    };
    exports.getMostPopular = function(language) {
        if (language === void 0) {
            language = "en";
        }
        return getApps(exports.Paths.mostPopular, {
            fields: exports.FieldFilters.mostPopular,
            dashboard: true,
            cb339: new Date().getTime(),
            language: language
        });
    };
    exports.getFeatured = function(lang) {
        if (lang === void 0) {
            lang = "en";
        }
        return getApps(exports.Paths.featured, {
            fields: exports.FieldFilters.featured,
            exclude: exports.ExcludeFilters.old,
            cb339: new Date().getTime(),
            lang: lang
        });
    };
    exports.getDashboardApps = function(appIds) {
        if (!appIds || appIds.length === 0) {
            Promise.reject({
                error: "appIds must be defined with length of 1 or more items"
            });
        } else {
            return getApps(exports.Paths.dashboard, {
                fields: exports.FieldFilters.dashboard,
                q: appIds
            });
        }
    };
    exports.getNew = function(limit, language) {
        if (limit === void 0) {
            limit = 15;
        }
        if (language === void 0) {
            language = "en";
        }
        return getApps(exports.Paths.newApps, {
            fields: exports.FieldFilters.newApps,
            dashboard: true,
            cb339: new Date().getTime(),
            limit: limit,
            language: language
        });
    };
    exports.getPending = function(metaSiteId) {
        if (metaSiteId) {
            return getApps(exports.Paths.pending + "/" + metaSiteId, null);
        } else {
            Promise.reject({
                error: "missing meta site id"
            });
        }
    };
    exports.getRelated = function() {
        return getApps(exports.MainPaths.apps, {
            market: "related_apps",
            fields: exports.FieldFilters.relatedApps
        });
    };
    exports.getPageApps = function(lang) {
        if (lang === void 0) {
            lang = "en";
        }
        return getApps(exports.Paths.pageApps, {
            fields: exports.FieldFilters.pageApps,
            lang: lang
        });
    };
    exports.getAll = function(language) {
        if (language === void 0) {
            language = "en";
        }
        return getApps(exports.MainPaths.apps, {
            language: language
        });
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = __webpack_require__(166).polyfill();
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    var bind = __webpack_require__(170);
    var Axios = __webpack_require__(180);
    var defaults = __webpack_require__(49);
    function createInstance(defaultConfig) {
        var context = new Axios(defaultConfig);
        var instance = bind(Axios.prototype.request, context);
        utils.extend(instance, Axios.prototype, context);
        utils.extend(instance, context);
        return instance;
    }
    var axios = createInstance(defaults);
    axios.Axios = Axios;
    axios.create = function create(instanceConfig) {
        return createInstance(utils.merge(defaults, instanceConfig));
    };
    axios.Cancel = __webpack_require__(174);
    axios.CancelToken = __webpack_require__(194);
    axios.isCancel = __webpack_require__(173);
    axios.all = function all(promises) {
        return Promise.all(promises);
    };
    axios.spread = __webpack_require__(195);
    module.exports = axios;
    module.exports.default = axios;
}, function(module, exports) {
    module.exports = function(obj) {
        return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
        return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    function isSlowBuffer(obj) {
        return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
    }
}, function(module, exports, __webpack_require__) {
    "use strict";
    var defaults = __webpack_require__(49);
    var utils = __webpack_require__(1);
    var InterceptorManager = __webpack_require__(189);
    var dispatchRequest = __webpack_require__(190);
    var isAbsoluteURL = __webpack_require__(192);
    var combineURLs = __webpack_require__(193);
    function Axios(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };
    }
    Axios.prototype.request = function request(config) {
        if (typeof config === "string") {
            config = utils.merge({
                url: arguments[0]
            }, arguments[1]);
        }
        config = utils.merge(defaults, this.defaults, {
            method: "get"
        }, config);
        config.method = config.method.toLowerCase();
        if (config.baseURL && !isAbsoluteURL(config.url)) {
            config.url = combineURLs(config.baseURL, config.url);
        }
        var chain = [ dispatchRequest, undefined ];
        var promise = Promise.resolve(config);
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
            chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
            chain.push(interceptor.fulfilled, interceptor.rejected);
        });
        while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
        }
        return promise;
    };
    utils.forEach([ "delete", "get", "head", "options" ], function forEachMethodNoData(method) {
        Axios.prototype[method] = function(url, config) {
            return this.request(utils.merge(config || {}, {
                method: method,
                url: url
            }));
        };
    });
    utils.forEach([ "post", "put", "patch" ], function forEachMethodWithData(method) {
        Axios.prototype[method] = function(url, data, config) {
            return this.request(utils.merge(config || {}, {
                method: method,
                url: url,
                data: data
            }));
        };
    });
    module.exports = Axios;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    module.exports = function normalizeHeaderName(headers, normalizedName) {
        utils.forEach(headers, function processHeader(value, name) {
            if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
                headers[normalizedName] = value;
                delete headers[name];
            }
        });
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var createError = __webpack_require__(172);
    module.exports = function settle(resolve, reject, response) {
        var validateStatus = response.config.validateStatus;
        if (!response.status || !validateStatus || validateStatus(response.status)) {
            resolve(response);
        } else {
            reject(createError("Request failed with status code " + response.status, response.config, null, response.request, response));
        }
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function enhanceError(error, config, code, request, response) {
        error.config = config;
        if (code) {
            error.code = code;
        }
        error.request = request;
        error.response = response;
        return error;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    function encode(val) {
        return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
    }
    module.exports = function buildURL(url, params, paramsSerializer) {
        if (!params) {
            return url;
        }
        var serializedParams;
        if (paramsSerializer) {
            serializedParams = paramsSerializer(params);
        } else if (utils.isURLSearchParams(params)) {
            serializedParams = params.toString();
        } else {
            var parts = [];
            utils.forEach(params, function serialize(val, key) {
                if (val === null || typeof val === "undefined") {
                    return;
                }
                if (utils.isArray(val)) {
                    key = key + "[]";
                }
                if (!utils.isArray(val)) {
                    val = [ val ];
                }
                utils.forEach(val, function parseValue(v) {
                    if (utils.isDate(v)) {
                        v = v.toISOString();
                    } else if (utils.isObject(v)) {
                        v = JSON.stringify(v);
                    }
                    parts.push(encode(key) + "=" + encode(v));
                });
            });
            serializedParams = parts.join("&");
        }
        if (serializedParams) {
            url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
        }
        return url;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    module.exports = function parseHeaders(headers) {
        var parsed = {};
        var key;
        var val;
        var i;
        if (!headers) {
            return parsed;
        }
        utils.forEach(headers.split("\n"), function parser(line) {
            i = line.indexOf(":");
            key = utils.trim(line.substr(0, i)).toLowerCase();
            val = utils.trim(line.substr(i + 1));
            if (key) {
                parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
            }
        });
        return parsed;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    module.exports = utils.isStandardBrowserEnv() ? function standardBrowserEnv() {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        var urlParsingNode = document.createElement("a");
        var originURL;
        function resolveURL(url) {
            var href = url;
            if (msie) {
                urlParsingNode.setAttribute("href", href);
                href = urlParsingNode.href;
            }
            urlParsingNode.setAttribute("href", href);
            return {
                href: urlParsingNode.href,
                protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
                host: urlParsingNode.host,
                search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
                hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
                hostname: urlParsingNode.hostname,
                port: urlParsingNode.port,
                pathname: urlParsingNode.pathname.charAt(0) === "/" ? urlParsingNode.pathname : "/" + urlParsingNode.pathname
            };
        }
        originURL = resolveURL(window.location.href);
        return function isURLSameOrigin(requestURL) {
            var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
            return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
        };
    }() : function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
            return true;
        };
    }();
}, function(module, exports, __webpack_require__) {
    "use strict";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    function E() {
        this.message = "String contains an invalid character";
    }
    E.prototype = new Error();
    E.prototype.code = 5;
    E.prototype.name = "InvalidCharacterError";
    function btoa(input) {
        var str = String(input);
        var output = "";
        for (var block, charCode, idx = 0, map = chars; str.charAt(idx | 0) || (map = "=", 
        idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 255) {
                throw new E();
            }
            block = block << 8 | charCode;
        }
        return output;
    }
    module.exports = btoa;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    module.exports = utils.isStandardBrowserEnv() ? function standardBrowserEnv() {
        return {
            write: function write(name, value, expires, path, domain, secure) {
                var cookie = [];
                cookie.push(name + "=" + encodeURIComponent(value));
                if (utils.isNumber(expires)) {
                    cookie.push("expires=" + new Date(expires).toGMTString());
                }
                if (utils.isString(path)) {
                    cookie.push("path=" + path);
                }
                if (utils.isString(domain)) {
                    cookie.push("domain=" + domain);
                }
                if (secure === true) {
                    cookie.push("secure");
                }
                document.cookie = cookie.join("; ");
            },
            read: function read(name) {
                var match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
                return match ? decodeURIComponent(match[3]) : null;
            },
            remove: function remove(name) {
                this.write(name, "", Date.now() - 864e5);
            }
        };
    }() : function nonStandardBrowserEnv() {
        return {
            write: function write() {},
            read: function read() {
                return null;
            },
            remove: function remove() {}
        };
    }();
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    function InterceptorManager() {
        this.handlers = [];
    }
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
        this.handlers.push({
            fulfilled: fulfilled,
            rejected: rejected
        });
        return this.handlers.length - 1;
    };
    InterceptorManager.prototype.eject = function eject(id) {
        if (this.handlers[id]) {
            this.handlers[id] = null;
        }
    };
    InterceptorManager.prototype.forEach = function forEach(fn) {
        utils.forEach(this.handlers, function forEachHandler(h) {
            if (h !== null) {
                fn(h);
            }
        });
    };
    module.exports = InterceptorManager;
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    var transformData = __webpack_require__(191);
    var isCancel = __webpack_require__(173);
    var defaults = __webpack_require__(49);
    function throwIfCancellationRequested(config) {
        if (config.cancelToken) {
            config.cancelToken.throwIfRequested();
        }
    }
    module.exports = function dispatchRequest(config) {
        throwIfCancellationRequested(config);
        config.headers = config.headers || {};
        config.data = transformData(config.data, config.headers, config.transformRequest);
        config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers || {});
        utils.forEach([ "delete", "get", "head", "post", "put", "patch", "common" ], function cleanHeaderConfig(method) {
            delete config.headers[method];
        });
        var adapter = config.adapter || defaults.adapter;
        return adapter(config).then(function onAdapterResolution(response) {
            throwIfCancellationRequested(config);
            response.data = transformData(response.data, response.headers, config.transformResponse);
            return response;
        }, function onAdapterRejection(reason) {
            if (!isCancel(reason)) {
                throwIfCancellationRequested(config);
                if (reason && reason.response) {
                    reason.response.data = transformData(reason.response.data, reason.response.headers, config.transformResponse);
                }
            }
            return Promise.reject(reason);
        });
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var utils = __webpack_require__(1);
    module.exports = function transformData(data, headers, fns) {
        utils.forEach(fns, function transform(fn) {
            data = fn(data, headers);
        });
        return data;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function isAbsoluteURL(url) {
        return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function combineURLs(baseURL, relativeURL) {
        return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var Cancel = __webpack_require__(174);
    function CancelToken(executor) {
        if (typeof executor !== "function") {
            throw new TypeError("executor must be a function.");
        }
        var resolvePromise;
        this.promise = new Promise(function promiseExecutor(resolve) {
            resolvePromise = resolve;
        });
        var token = this;
        executor(function cancel(message) {
            if (token.reason) {
                return;
            }
            token.reason = new Cancel(message);
            resolvePromise(token.reason);
        });
    }
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
        if (this.reason) {
            throw this.reason;
        }
    };
    CancelToken.source = function source() {
        var cancel;
        var token = new CancelToken(function executor(c) {
            cancel = c;
        });
        return {
            token: token,
            cancel: cancel
        };
    };
    module.exports = CancelToken;
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = function spread(callback) {
        return function wrap(arr) {
            return callback.apply(null, arr);
        };
    };
}, , , , function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    frameworkFacadeFactory.$inject = [ "$injector", "IS_BUSINESS_MANAGER" ];
    __webpack_require__.r(__webpack_exports__);
    var lodash_pick = __webpack_require__(175);
    var FrameworkFacade = function() {
        function FrameworkFacade() {}
        FrameworkFacade.prototype.getApiUrl = function(apiName) {
            return "/_api/" + apiName + "/";
        };
        FrameworkFacade.prototype.convertToWixAppUtilsStruct = function(_a) {
            var data = _a.data;
            var clientSpec = data.clientSpec;
            return {
                appDefinitionId: clientSpec.appDefinitionId,
                dashboardEndpoint: clientSpec.dashboardUrl,
                instance: clientSpec.instance,
                instanceId: clientSpec.instanceId
            };
        };
        return FrameworkFacade;
    }();
    var appMarketAPI = __webpack_require__(176);
    var es6_promise = __webpack_require__(166);
    var src = __webpack_require__(16);
    var __extends = undefined && undefined.__extends || function() {
        var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf || {
                __proto__: []
            } instanceof Array && function(d, b) {
                d.__proto__ = b;
            } || function(d, b) {
                for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            };
            return extendStatics(d, b);
        };
        return function(d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    }();
    var __assign = undefined && undefined.__assign || function() {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var business_manager_facade_BusinessManagerFacade = function(_super) {
        __extends(BusinessManagerFacade, _super);
        function BusinessManagerFacade(businessManagerProps, contactsService) {
            var _this = _super.call(this) || this;
            _this.businessManagerProps = businessManagerProps;
            _this.noop = function() {};
            _this.wixAppIds = BusinessManagerFacade.patchMigrationAppDefIds();
            _this.moduleId = src["ModuleId"];
            _this.preDefinedApps = {
                SiteMembers: {
                    name: "Site Members"
                },
                ECommerce: {
                    name: "eCommerce"
                },
                contactForm: {
                    name: "Contact Form"
                },
                ContactForm: {
                    name: "Contact Form"
                },
                subscribeForm: {
                    name: "Subscribe Form"
                }
            };
            _this.isPredefined = function(appId) {
                return Object.keys(_this.preDefinedApps).indexOf(appId) >= 0;
            };
            _this.createPreDefinedAppDefinition = function(appId) {
                return {
                    appDefinitionId: appId,
                    name: _this.preDefinedApps[appId].name
                };
            };
            _this.appendPreDefinedAppDefinition = function(appDefs, preDefinedAppId) {
                return appDefs.concat([ _this.createPreDefinedAppDefinition(preDefinedAppId) ]);
            };
            _this.contactsService = contactsService;
            _this.clientTopology = patchMigrationTopology(businessManagerProps.topology || businessManagerProps.config.topology);
            return _this;
        }
        BusinessManagerFacade.prototype.isPublished = function() {
            return this.businessManagerProps.isSitePublished;
        };
        BusinessManagerFacade.prototype.getContactById = function(contactId) {
            return this.contactsService.getContactById(contactId).then(function(contact) {
                return {
                    data: contact
                };
            });
        };
        BusinessManagerFacade.prototype.searchContacts = function(searchParams) {
            return this.contactsService.searchContacts(searchParams);
        };
        BusinessManagerFacade.prototype.getSiteName = function() {
            return this.businessManagerProps.siteName;
        };
        BusinessManagerFacade.prototype.getUserId = function() {
            return this.businessManagerProps.userId;
        };
        BusinessManagerFacade.prototype.getSiteUrl = function() {
            return;
        };
        BusinessManagerFacade.prototype.getSiteId = function() {
            return this.businessManagerProps.metaSiteId;
        };
        BusinessManagerFacade.prototype.getLocale = function() {
            return this.businessManagerProps.locale;
        };
        BusinessManagerFacade.prototype.initializeBuiltinAppForDashboardSdk = function(appName) {
            return this.noop();
        };
        BusinessManagerFacade.prototype.provisionApp = function(appDefId, referer) {
            return window["ModuleRegistry"].invoke("businessManager.provisionApp", appDefId, referer).then(this.convertToWixAppUtilsStruct);
        };
        BusinessManagerFacade.prototype.getAppInstance = function(appDefId) {
            return window["ModuleRegistry"].invoke("businessManager.getAppInstance", appDefId);
        };
        BusinessManagerFacade.prototype.extractActivityDeepLink = function(activityUrl, referrer) {
            var _a = Object(src["getDeepLinkContext"])(activityUrl), moduleId = _a.appDefinitionId, appState = _a.appState;
            return this.getModuleLink(moduleId, {
                appState: appState
            });
        };
        BusinessManagerFacade.prototype.getInstalledAppInstanceId = function(appDefId) {
            return this.noop();
        };
        BusinessManagerFacade.prototype.getAppNameById = function(appId) {
            return this.getFieldsByIds([ appId ], [ "name" ]).then(function(_a) {
                var res = _a[0];
                return res.name;
            });
        };
        BusinessManagerFacade.prototype.getFieldsByIds = function(appIds, fields) {
            var needFields = [ "appDefinitionId" ].concat(fields);
            return this.getAppDefinitions(appIds).then(function(apps) {
                return fields ? apps.map(function(app) {
                    return lodash_pick(app, needFields);
                }) : apps;
            });
        };
        BusinessManagerFacade.prototype.setHelpArticle = function(articleId) {
            return window["ModuleRegistry"].invoke("businessManager.setHelpArticle", {
                articleId: articleId
            });
        };
        BusinessManagerFacade.prototype.isMobileUser = function() {
            return false;
        };
        BusinessManagerFacade.prototype.getLink = function(appName, contextData) {
            throw "not supported in Business Manager, please use getModuleLink";
        };
        BusinessManagerFacade.prototype.navigateTo = function(config) {
            return window["ModuleRegistry"].invoke("businessManager.navigateTo", config);
        };
        BusinessManagerFacade.prototype.navigateToUrl = function(url) {
            var config = this.deepLinkToNavigateToConfig(url);
            return this.navigateTo(config);
        };
        BusinessManagerFacade.prototype.navigateToAndShowBackToast = function(config, backConfig, toastConfig) {
            return window["ModuleRegistry"].invoke("businessManager.navigateToAndShowBackToast", config, backConfig, toastConfig);
        };
        BusinessManagerFacade.prototype.navigateToUrlAndShowBackToast = function(url, backConfig, toastConfig) {
            var config = this.deepLinkToNavigateToConfig(url);
            return window["ModuleRegistry"].invoke("businessManager.navigateToAndShowBackToast", config, backConfig, toastConfig);
        };
        BusinessManagerFacade.prototype.getModuleLink = function(moduleId, contextData) {
            return window["ModuleRegistry"].invoke("businessManager.buildModuleLink", moduleId, contextData);
        };
        BusinessManagerFacade.prototype.getAppDefId = function(appName) {
            return this.wixAppIds[appName];
        };
        BusinessManagerFacade.prototype.getAppDefinitions = function(appIds) {
            var _this = this;
            if (appIds === void 0) {
                appIds = [];
            }
            var normalAppIds = appIds.filter(function(appId) {
                return !_this.isPredefined(appId);
            });
            var preDefinedAppIds = appIds.filter(this.isPredefined);
            var appendPreDefinedApps = function(appDefs) {
                return preDefinedAppIds.reduce(_this.appendPreDefinedAppDefinition, appDefs);
            };
            return (normalAppIds.length > 0 ? Object(appMarketAPI["getDashboardApps"])(normalAppIds) : es6_promise["Promise"].resolve([])).then(appendPreDefinedApps);
        };
        BusinessManagerFacade.prototype.deepLinkToNavigateToConfig = function(url) {
            var _a = Object(src["getDeepLinkContext"])(url), moduleId = _a.appDefinitionId, appState = _a.appState;
            return {
                moduleId: moduleId,
                contextData: {
                    appState: appState
                }
            };
        };
        BusinessManagerFacade.patchMigrationAppDefIds = function() {
            return __assign({}, src["appDefIds"], {
                generalInfo: src["PageComponentId"].Settings
            });
        };
        return BusinessManagerFacade;
    }(FrameworkFacade);
    var lodash_assign = __webpack_require__(168);
    var dashboard_facade_extends = undefined && undefined.__extends || function() {
        var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf || {
                __proto__: []
            } instanceof Array && function(d, b) {
                d.__proto__ = b;
            } || function(d, b) {
                for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            };
            return extendStatics(d, b);
        };
        return function(d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    }();
    var dashboard_facade_DashboardFacade = function(_super) {
        dashboard_facade_extends(DashboardFacade, _super);
        function DashboardFacade(dashboardServices, navigateToFn) {
            var _this = _super.call(this) || this;
            _this.dashboardServices = dashboardServices;
            _this.navigateToFn = navigateToFn;
            _this.moduleId = {};
            _this.wixLinkModuleMapping = {
                "141fbfae-511e-6817-c9f0-48993a7547d1": "inbox",
                "13ee94c1-b635-8505-3391-97919052c16f": "quotes",
                "1380b703-ce81-ff05-f115-39571d94dfcd": "eCommerce",
                support: "support"
            };
            _this.wixAppIds = dashboardServices.wixAppIds;
            _this.clientTopology = dashboardServices.clientTopology;
            return _this;
        }
        DashboardFacade.prototype.isPublished = function() {
            return this.dashboardServices.wixDashboard.getMetaSite().isPublished();
        };
        DashboardFacade.prototype.getContactById = function(contactId) {
            return this.dashboardServices.Wix.Contacts.getContactById({
                id: contactId
            });
        };
        DashboardFacade.prototype.searchContacts = function(searchParams) {
            return this.dashboardServices.Wix.Contacts.search(searchParams);
        };
        DashboardFacade.prototype.getSiteName = function() {
            return this.dashboardServices.wixDashboard.getMetaSite().siteName;
        };
        DashboardFacade.prototype.getSiteUrl = function() {
            return this.dashboardServices.wixDashboard.getSiteViewUrl();
        };
        DashboardFacade.prototype.getUserId = function() {
            return this.dashboardServices.wixDashboard.getUserDetails().guid;
        };
        DashboardFacade.prototype.getSiteId = function() {
            return this.dashboardServices.wixDashboard.metaSiteId;
        };
        DashboardFacade.prototype.getLocale = function() {
            return this.dashboardServices.wixDashboardFrameworkConfig.locale;
        };
        DashboardFacade.prototype.initializeBuiltinAppForDashboardSdk = function(appName) {
            return this.dashboardServices.dashboardSdkConfig.initializeBuiltinApp(appName);
        };
        DashboardFacade.prototype.provisionApp = function(appDefId, referer) {
            return this.dashboardServices.wixAppUtils.installApp(appDefId, referer);
        };
        DashboardFacade.prototype.getAppInstance = function(appDefId) {
            return this.provisionApp(appDefId, null).then(function(res) {
                return res.instance;
            });
        };
        DashboardFacade.prototype.extractActivityDeepLink = function(activityUrl, referrer) {
            return this.dashboardServices.wixAppUtils.extractActivityDeepLink(activityUrl, referrer);
        };
        DashboardFacade.prototype.getInstalledAppInstanceId = function(appDefId) {
            return this.dashboardServices.wixAppUtils.getInstalledAppInstanceId(appDefId);
        };
        DashboardFacade.prototype.getAppNameById = function(appId) {
            return this.dashboardServices.wixAppUtils.getAppNameById(appId);
        };
        DashboardFacade.prototype.getFieldsByIds = function(appIds, fields) {
            return this.dashboardServices.wixAppUtils.getFieldsByIds(appIds, fields);
        };
        DashboardFacade.prototype.setHelpArticle = function(articleId) {
            return this.dashboardServices.wixDashboard.setHelpArticle(articleId);
        };
        DashboardFacade.prototype.isMobileUser = function() {
            return this.dashboardServices.mobileUser.isMobileUser();
        };
        DashboardFacade.prototype.getLink = function(appName, context) {
            return context ? this.dashboardServices.wixDashboard.wixLink(appName, context) : this.dashboardServices.wixDashboard.wixLink(appName);
        };
        DashboardFacade.prototype.navigateTo = function(config) {
            this.navigateToFn(this.getModuleLink(config.moduleId, config.contextData));
        };
        DashboardFacade.prototype.navigateToUrl = function(url) {
            this.navigateToFn(this.extractActivityDeepLink(url, null));
        };
        DashboardFacade.prototype.navigateToAndShowBackToast = function(config, backConfig, toastConfig) {
            throw "Not implemented in My Account";
        };
        DashboardFacade.prototype.navigateToUrlAndShowBackToast = function(url, backConfig, toastConfig) {
            throw "Not implemented in My Account";
        };
        DashboardFacade.prototype.getAppDefId = function(appName) {
            switch (appName) {
              case "engage":
                return this.wixAppIds["inbox"];

              case "invoices":
                return this.wixAppIds["quotes"];

              default:
                return this.wixAppIds[appName];
            }
        };
        DashboardFacade.prototype.getModuleLink = function(moduleId, contextData) {
            var appName = this.wixLinkModuleMapping[moduleId] || moduleId;
            if (moduleId === this.wixAppIds["inbox"] && contextData) {
                if (contextData.appState) {
                    contextData.contactId = contextData.appState;
                    contextData = lodash_assign({}, contextData, {
                        contactId: contextData.appState
                    });
                    delete contextData.appState;
                }
            }
            if (moduleId === this.wixAppIds["quotes"] && contextData) {
                if (contextData.appState) {
                    var matchCustomerId = contextData.appState.match(/quotes\/create\/\?customerId=(.*)/);
                    var customerId = matchCustomerId ? matchCustomerId[1] : null;
                    appName = "createQuote";
                    contextData = lodash_assign({}, contextData, customerId ? {
                        customerId: customerId
                    } : {});
                    delete contextData.appState;
                }
            }
            return this.getLink(appName, contextData);
        };
        return DashboardFacade;
    }(FrameworkFacade);
    var axios = __webpack_require__(167);
    var axios_default = __webpack_require__.n(axios);
    var DefaultHeaders = {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json;charset=UTF-8"
    };
    var httpClient_HttpClient = function() {
        function HttpClient() {
            this.axiosClient = axios_default.a.create({
                headers: DefaultHeaders
            });
        }
        HttpClient.prototype.get = function(url) {
            return this.axiosClient.get(url).then(function(_) {
                return _.data;
            });
        };
        HttpClient.prototype.post = function(url, body) {
            return this.axiosClient.post(url, body).then(function(_) {
                return _.data;
            });
        };
        return HttpClient;
    }();
    var httpClient = httpClient_HttpClient;
    var URI = __webpack_require__(2);
    var contacts_service_ContactsService = function() {
        function ContactsService(msid) {
            this.msid = msid;
            this.httpClient = new httpClient();
        }
        ContactsService.prototype.getContactById = function(contactId) {
            return this.httpClient.get(this._contactsRoute("contacts/" + contactId));
        };
        ContactsService.prototype.searchContacts = function(searchParams) {
            var limit = searchParams.limit, search = searchParams.search, sort = searchParams.sort;
            var queryParams = {
                query: search,
                pageSize: limit ? limit : 100
            };
            if (sort) {
                queryParams["sort"] = convertToNewContactsSortParam(sort);
            }
            return this.httpClient.get(this._contactsRoute("contacts", queryParams));
        };
        ContactsService.prototype._contactsRoute = function(route, query) {
            if (query === void 0) {
                query = null;
            }
            var uri = new URI("/contacts-server/api/v1/metasite/" + this.msid + "/" + route);
            if (query) {
                uri.query(query);
            }
            return uri.toString();
        };
        return ContactsService;
    }();
    var contacts_service = contacts_service_ContactsService;
    var convertToNewContactsSortParam = function(dashboardSortParam) {
        var sortParams = dashboardSortParam.split(":");
        var convertedParam = [ {
            field: sortParams[0],
            direction: sortParams[1] === "asc" ? "ascending" : "descending"
        } ];
        return JSON.stringify(convertedParam);
    };
    var external_angular_ = __webpack_require__(0);
    var angular_framework_facade_assign = undefined && undefined.__assign || function() {
        angular_framework_facade_assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return angular_framework_facade_assign.apply(this, arguments);
    };
    var FrameworkFacadeProvider = function() {
        FrameworkFacadeProvider.$inject = [ "$injector", "IS_BUSINESS_MANAGER" ];
        function FrameworkFacadeProvider($injector, IS_BUSINESS_MANAGER) {
            this.$injector = $injector;
            this.IS_BUSINESS_MANAGER = IS_BUSINESS_MANAGER;
            this.$get = frameworkFacadeFactory;
        }
        Object.defineProperty(FrameworkFacadeProvider.prototype, "clientTopology", {
            get: function() {
                var clientTopology = this.$injector.get("clientTopology");
                if (this.IS_BUSINESS_MANAGER) {
                    return patchMigrationTopology(clientTopology);
                }
                return clientTopology;
            },
            enumerable: true,
            configurable: true
        });
        return FrameworkFacadeProvider;
    }();
    function frameworkFacadeFactory($injector, IS_BUSINESS_MANAGER) {
        if (IS_BUSINESS_MANAGER) {
            return loadBusinessManagerServices($injector);
        }
        return loadDashboardServices($injector);
    }
    function loadBusinessManagerServices($injector) {
        var props = $injector.get("props")();
        var contactsService = new contacts_service(props.metaSiteId);
        return new business_manager_facade_BusinessManagerFacade(props, contactsService);
    }
    function loadDashboardServices($injector) {
        var $location = $injector.get("$location");
        var $window = $injector.get("$window");
        var wixDashboard = $injector.get("wixDashboard");
        var Wix = $injector.get("Wix");
        var dashboardSdkConfig = $injector.get("dashboardSdkConfig");
        var wixDashboardFrameworkConfig = $injector.get("wixDashboardFrameworkConfig");
        var wixAppUtils = $injector.get("wixAppUtils");
        var mobileUser = $injector.get("mobileUser");
        var wixAppIds = $injector.get("wixAppIds");
        var clientTopology = $injector.get("clientTopology");
        var navigateToWithinMyAccount = function(url) {
            /^http/.test(url) ? $window.location.href = url : $location.url(url);
        };
        return new dashboard_facade_DashboardFacade({
            wixDashboard: wixDashboard,
            Wix: Wix,
            dashboardSdkConfig: dashboardSdkConfig,
            wixDashboardFrameworkConfig: wixDashboardFrameworkConfig,
            wixAppUtils: wixAppUtils,
            wixAppIds: wixAppIds,
            clientTopology: clientTopology,
            mobileUser: mobileUser
        }, navigateToWithinMyAccount);
    }
    function patchMigrationTopology(topology) {
        return angular_framework_facade_assign({}, topology, {
            quotes: topology.invoicesStaticsUrl,
            inbox: topology.inboxStaticsUrl,
            siteSettings: topology.siteSettingsStaticsUrl
        });
    }
    var isBusinessManager = Boolean(window["__IS_BUSINESS_MANAGER__"]);
    var dashboardDeps = isBusinessManager ? [] : [ "wixDashboardFramework", "wixDashboardFrameworkConstants", "dashboardSdk", "dashboardHeaderMobileApp" ];
    external_angular_["module"]("builtinAppsAdapter", [ "wix.common.bi" ].concat(dashboardDeps)).constant("IS_BUSINESS_MANAGER", isBusinessManager).provider("frameworkFacade", FrameworkFacadeProvider).config([ "IS_BUSINESS_MANAGER", "wixBiLoggerProvider", function(IS_BUSINESS_MANAGER, wixBiLoggerProvider) {
        if (IS_BUSINESS_MANAGER) {
            var getMsid = function(props) {
                return props().metaSiteId;
            };
            getMsid.$inject = [ "props" ];
            wixBiLoggerProvider.setConfig({
                defaultEventArgs: {
                    msid: getMsid
                }
            });
        }
    } ]);
    var ModuleLinkController = function() {
        ModuleLinkController.$inject = [ "frameworkFacade" ];
        function ModuleLinkController(frameworkFacade) {
            this.frameworkFacade = frameworkFacade;
        }
        ModuleLinkController.prototype.getUrl = function() {
            return this.url ? this.frameworkFacade.extractActivityDeepLink(this.url, "") : this.frameworkFacade.getModuleLink(this.moduleId, this.contextData);
        };
        ModuleLinkController.prototype.onLinkClick = function(event) {
            event.preventDefault();
            var _a = this, moduleId = _a.moduleId, contextData = _a.contextData, openInNewTab = _a.openInNewTab;
            return this.url ? this.frameworkFacade.navigateToUrl(this.url) : this.frameworkFacade.navigateTo({
                moduleId: moduleId,
                contextData: contextData,
                openInNewTab: openInNewTab
            });
        };
        return ModuleLinkController;
    }();
    external_angular_["module"]("builtinAppsAdapter").component("moduleLink", {
        transclude: true,
        template: '<a ng-transclude ng-click="$ctrl.onLinkClick($event)" ng-href="{{$ctrl.getUrl()}}"></a>',
        controller: ModuleLinkController,
        bindings: {
            moduleId: "<",
            contextData: "<",
            openInNewTab: "<",
            url: "<"
        }
    });
    __webpack_require__.d(__webpack_exports__, "patchMigrationTopology", function() {
        return patchMigrationTopology;
    });
    __webpack_require__.d(__webpack_exports__, "ModuleLinkController", function() {
        return ModuleLinkController;
    });
    __webpack_require__.d(__webpack_exports__, "BusinessManagerFacade", function() {
        return business_manager_facade_BusinessManagerFacade;
    });
    __webpack_require__.d(__webpack_exports__, "DashboardFacade", function() {
        return dashboard_facade_DashboardFacade;
    });
    __webpack_require__.d(__webpack_exports__, "FrameworkFacade", function() {
        return FrameworkFacade;
    });
    __webpack_require__(177);
} ]);