"use strict";

angular.module("editContactPreload", []);

angular.module("wixAvatar", []);

angular.module("editContactAppInternal", [ "editContactPreload", "updateContactApi", "wixAvatar", "wix.common.bi" ]).config([ "wixBiLoggerProvider", "ecBiEvents", function(wixBiLoggerProvider, ecBiEvents) {
    var defaultEventArgs = {};
    wixBiLoggerProvider.setConfig({
        eventMap: ecBiEvents.getEventMap(),
        defaultEventArgs: defaultEventArgs,
        removeUndefinedValues: true
    });
} ]);

angular.module("editContact", [ "editContactAppInternal", "ngAnimate", "wix.common.ui.components", "editContactAppInternal", "editContactTranslations", "wixAngular", "wixStyle", "locale.data", "builtinAppsAdapter", "angular-md5", "mp.autoFocus", "ngMaterial", "google.places" ]).config([ "wixStyleConfigProvider", function(wixStyleConfigProvider) {
    wixStyleConfigProvider.useNewWixInput(true);
} ]);

angular.module("editContactApp", [ "editContact" ]);

angular.module("updateContactApi", []);

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var EditContactModal = function() {
    EditContactModal.$inject = [ "$mdDialog", "$rootScope", "editContactApiFacade", "$q", "ecOptionsService", "$document", "wixBiLogger", "EC_BI_ARGS", "customFieldsApi" ];
    function EditContactModal($mdDialog, $rootScope, editContactApiFacade, $q, ecOptionsService, $document, wixBiLogger, EC_BI_ARGS, customFieldsApi) {
        this.$mdDialog = $mdDialog;
        this.$rootScope = $rootScope;
        this.editContactApiFacade = editContactApiFacade;
        this.$q = $q;
        this.ecOptionsService = ecOptionsService;
        this.$document = $document;
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        this.customFieldsApi = customFieldsApi;
    }
    EditContactModal.prototype.edit = function(contactId, options) {
        var _this = this;
        if (options === void 0) {
            options = new OptionsEC();
        }
        this.wixBiLogger.log("OPEN_EDIT_CONTACT", __assign({}, this.EC_BI_ARGS, {
            contact_id: contactId,
            origin: options.origin
        }));
        this.ecOptionsService.initialize(options);
        return this.$q.all([ this.editContactApiFacade.getById(contactId), this.customFieldsApi.getCustomFields() ]).then(function(_a) {
            var contactDto = _a[0], siteCustomFields = _a[1];
            var contact = __assign({}, contactDto, {
                customFields: _.values(siteCustomFields.concat(contactDto.customFields || []).reduce(function(acc, cf) {
                    acc[cf.id] = __assign({}, acc[cf.id], cf);
                    return acc;
                }, {}))
            });
            return _this.openModal(false, contact);
        });
    };
    EditContactModal.prototype.create = function(contact, options) {
        var _this = this;
        if (contact === void 0) {
            contact = new ContactEC();
        }
        if (options === void 0) {
            options = new OptionsEC();
        }
        this.wixBiLogger.log("OPEN_ADD_NEW_CONTACT", __assign({}, this.EC_BI_ARGS, {
            origin: options.origin
        }));
        this.ecOptionsService.initialize(options);
        return this.customFieldsApi.getCustomFields().then(function(customFields) {
            contact.customFields = customFields;
            return _this.openModal(true, contact);
        });
    };
    EditContactModal.prototype.openModal = function(isNew, contact) {
        this.verifyListsOperational(contact);
        var mdOptions = this.createMdOptions(contact, isNew);
        var defer = this.$q.defer();
        this.$mdDialog.show(mdOptions).then(function(res) {
            if (res.reason !== "CONFIRM") {
                defer.reject(res.reason);
            } else {
                defer.resolve(res);
            }
        }, function(err) {
            return defer.reject(err);
        });
        return defer.promise;
    };
    EditContactModal.prototype.verifyListsOperational = function(contact) {
        var _this = this;
        var lists = [ "emails", "phones", "addresses", "notes", "dates", "urls" ];
        lists.forEach(function(list) {
            if (!contact[list]) {
                contact[list] = [];
            }
        });
        var nonEmptyLists = [ {
            name: "emails",
            type: EmailEC
        }, {
            name: "notes",
            type: NoteEC
        } ];
        if (this.ecOptionsService.mustShowList(PhoneEC)) {
            nonEmptyLists.push({
                name: "phones",
                type: PhoneEC
            });
        }
        if (this.ecOptionsService.mustShowList(AddressEC)) {
            nonEmptyLists.push({
                name: "addresses",
                type: AddressEC
            });
        }
        nonEmptyLists.forEach(function(list) {
            return _this.createItemInListIfEmpty(contact, list.name, list.type);
        });
    };
    EditContactModal.prototype.createItemInListIfEmpty = function(contact, listName, ctor) {
        if (!contact[listName] || contact[listName].length === 0) {
            contact[listName] = [ new ctor() ];
        }
    };
    EditContactModal.prototype.createMdOptions = function(contact, isNew) {
        return {
            scope: angular.extend(this.$rootScope.$new(), {
                contact: contact,
                isNew: isNew
            }),
            templateUrl: "views/save-contact.preload.html",
            controller: "SaveContactController as saveCtrl",
            clickOutsideToClose: false,
            parent: angular.element(this.$document[0].body)
        };
    };
    return EditContactModal;
}();

angular.module("editContactAppInternal").service("editContactModal", EditContactModal);

"use strict";

var UpdateContactApi = function() {
    UpdateContactApi.$inject = [ "$http", "experimentManager", "ecOptionsService" ];
    function UpdateContactApi($http, experimentManager, ecOptionsService) {
        this.$http = $http;
        this.experimentManager = experimentManager;
        this.ecOptionsService = ecOptionsService;
    }
    UpdateContactApi.prototype.saveContact = function(contact, metaSiteId) {
        var updateApiUrl;
        if (this.experimentManager.isExperimentEnabled("specs.con.EditContactCustomFields")) {
            var baseUrl = this.ecOptionsService.getBaseUrl();
            updateApiUrl = baseUrl + "api/v1/metasite/" + metaSiteId + "/contacts";
        } else {
            updateApiUrl = "/_api/wix-contacts-webapp/hive/metasites/" + metaSiteId + "/contacts";
        }
        var contactId = contact.id;
        var postData = contact;
        return this.$http.post(updateApiUrl + (contactId ? "/" + contactId : ""), postData).then(function(response) {
            return response.data;
        });
    };
    return UpdateContactApi;
}();

angular.module("updateContactApi").service("updateContactApi", UpdateContactApi);

"use strict";

var EditContactApiFacade = function() {
    EditContactApiFacade.$inject = [ "ecContactApi", "updateContactApi", "frameworkFacade", "ecOptionsService", "dateFilter" ];
    function EditContactApiFacade(ecContactApi, updateContactApi, frameworkFacade, ecOptionsService, dateFilter) {
        this.ecContactApi = ecContactApi;
        this.updateContactApi = updateContactApi;
        this.frameworkFacade = frameworkFacade;
        this.ecOptionsService = ecOptionsService;
        this.dateFilter = dateFilter;
    }
    EditContactApiFacade.prototype.getById = function(id) {
        var _this = this;
        return this.ecContactApi.getById(id, this.frameworkFacade.getSiteId()).then(function(response) {
            _this.migrateNotesArrayToSingleNote(response.data);
            return response.data;
        });
    };
    EditContactApiFacade.prototype.save = function(contact) {
        this.manageDefaultGroups(contact);
        return this.updateContactApi.saveContact(contact, this.frameworkFacade.getSiteId());
    };
    EditContactApiFacade.prototype.manageDefaultGroups = function(contact) {
        if (!contact.tags) {
            contact.tags = [];
        }
        this.ecOptionsService.getGroupsToAppend().forEach(function(group) {
            if (contact.tags.indexOf(group) === -1) {
                contact.tags.unshift(group);
            }
        });
    };
    EditContactApiFacade.prototype.migrateNotesArrayToSingleNote = function(contact) {
        if (contact.notes && 1 < contact.notes.length) {
            var singleNote = {
                modifiedAt: contact.notes[0].modifiedAt,
                content: ""
            };
            while (0 < contact.notes.length) {
                if (contact.notes[0].modifiedAt && contact.notes[0].content) {
                    singleNote.content += this.dateFilter(contact.notes[0].modifiedAt, "shortDate") + " - " + contact.notes[0].content;
                } else if (contact.notes[0].content) {
                    singleNote.content += contact.notes[0].content;
                }
                if (1 < contact.notes.length) {
                    singleNote.content += "\n";
                }
                contact.notes.shift();
            }
            contact.notes.push(singleNote);
        }
    };
    return EditContactApiFacade;
}();

angular.module("editContactAppInternal").service("editContactApiFacade", EditContactApiFacade);

"use strict";

var EcContactApi = function() {
    EcContactApi.$inject = [ "$http", "experimentManager", "ecOptionsService" ];
    function EcContactApi($http, experimentManager, ecOptionsService) {
        this.$http = $http;
        this.experimentManager = experimentManager;
        this.ecOptionsService = ecOptionsService;
    }
    EcContactApi.prototype.getById = function(contactId, metaSiteId) {
        var apiUrl;
        if (this.experimentManager.isExperimentEnabled("specs.con.EditContactCustomFields")) {
            var baseUrl = this.ecOptionsService.getBaseUrl();
            apiUrl = baseUrl + "api/v1/metasite/" + metaSiteId + "/contacts/" + contactId;
        } else {
            apiUrl = "/_api/wix-contacts-webapp/hive/metasites/" + metaSiteId + "/contacts/" + contactId;
        }
        return this.$http.get(apiUrl);
    };
    return EcContactApi;
}();

angular.module("editContactAppInternal").service("ecContactApi", EcContactApi);

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var EcTagsApi = function() {
    EcTagsApi.$inject = [ "$http", "frameworkFacade", "$translate", "wixBiLogger", "EC_BI_ARGS" ];
    function EcTagsApi($http, frameworkFacade, $translate, wixBiLogger, EC_BI_ARGS) {
        this.$http = $http;
        this.frameworkFacade = frameworkFacade;
        this.$translate = $translate;
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        this.tagList = null;
        this.staticGroups = [ "contacts-customers", "contacts-contacted_me" ];
        this.staticGroupsTranslationKeys = {
            "contacts-customers": "editContact.groups_customers",
            "contacts-contacted_me": "editContact.groups_contacted_me"
        };
        this.apiUrl = "/_api/wix-contacts-webapp/dashboard/metasites/" + this.frameworkFacade.getSiteId() + "/tags?accept=json";
    }
    EcTagsApi.prototype.refreshTags = function() {
        this.tagList = null;
    };
    EcTagsApi.prototype.create = function(name) {
        var newTag = {
            $editMode: false,
            displayName: "",
            name: name,
            userDefined: true
        };
        this.wixBiLogger.log("ON_CREATE_NEW_LABEL", __assign({}, this.EC_BI_ARGS, {
            origin: "edit-contact",
            name: name
        }));
        return this.$http.post(this.apiUrl, newTag).then(function(_a) {
            var data = _a.data;
            return data;
        });
    };
    EcTagsApi.prototype.getTags = function() {
        if (this.tagList === null) {
            this.tagList = this.$http.get(this.apiUrl).then(function(_a) {
                var data = _a.data;
                return data;
            });
        }
        return this.tagList;
    };
    EcTagsApi.prototype.getUserTags = function() {
        var _this = this;
        return this.getTags().then(function(response) {
            return response.filter(function(x) {
                return _this.userTagFilter(x);
            });
        }).then(function(filtered) {
            return filtered.map(function(x) {
                return _this.setDisplayName(x);
            });
        }).then(function(withDisplayName) {
            return withDisplayName.sort(function(a, b) {
                return _this.userTagSort(a, b);
            });
        });
    };
    EcTagsApi.prototype.userTagFilter = function(tag) {
        return tag.userDefined || -1 < this.staticGroups.indexOf(tag.id);
    };
    EcTagsApi.prototype.setDisplayName = function(tag) {
        tag.displayName = this.getTagDisplayName(tag);
        return tag;
    };
    EcTagsApi.prototype.userTagSort = function(tagA, tagB) {
        return tagA.displayName.localeCompare(tagB.displayName);
    };
    EcTagsApi.prototype.getTagDisplayName = function(tag) {
        return tag.userDefined ? tag.name : this.$translate(this.staticGroupsTranslationKeys[tag.id]);
    };
    return EcTagsApi;
}();

angular.module("editContactAppInternal").service("ecTagsApi", EcTagsApi);

"use strict";

var EcOptionsService = function() {
    EcOptionsService.$inject = [ "experimentManager" ];
    function EcOptionsService(experimentManager) {
        this.experimentManager = experimentManager;
        this.defaultFields = [ "first", "last", "email", "note" ];
        this.options = {
            mode: "default",
            baseUrl: "/contacts-server/",
            createHeader: "editContact.title_create",
            editHeader: "editContact.title_edit",
            includedFields: [ "phone" ],
            excludedFields: [ "groups" ],
            requiredFields: [],
            atMinimumFields: [ "first", "last", "email", "phone" ],
            showAdditionalFields: true,
            showCustomFields: false,
            groupsToAppend: [],
            origin: ""
        };
    }
    EcOptionsService.prototype.initialize = function(options) {
        angular.extend(this.options, options);
        if (this.options.requiredFields.length === 0 && this.options.atMinimumFields.length === 0) {
            throw "You need to supply option requiredFields or option atMinimumFields." + "Both can't be empty.";
        }
    };
    EcOptionsService.prototype.getMode = function() {
        return this.options.mode;
    };
    EcOptionsService.prototype.getBaseUrl = function() {
        return this.options.baseUrl + "/";
    };
    EcOptionsService.prototype.getOrigin = function() {
        return this.options.origin;
    };
    EcOptionsService.prototype.getCreateHeader = function() {
        return this.options.createHeader;
    };
    EcOptionsService.prototype.getEditHeader = function() {
        return this.options.editHeader;
    };
    EcOptionsService.prototype.mustShowList = function(ctor) {
        if (ctor === EmailEC) {
            return true;
        }
        var fieldName = this.ctorToString(ctor);
        return this.mustShowListByFieldName(fieldName);
    };
    EcOptionsService.prototype.isFieldRequired = function(ctor) {
        var fieldName = this.ctorToString(ctor);
        return this.isFieldRequiredByName(fieldName);
    };
    EcOptionsService.prototype.shouldIncludeField = function(field) {
        var byDefault = -1 < this.defaultFields.indexOf(field);
        var additional = this.options.showAdditionalFields;
        var include = -1 < this.options.includedFields.indexOf(field);
        var exclude = -1 < this.options.excludedFields.indexOf(field);
        return (byDefault || include || additional) && !exclude;
    };
    EcOptionsService.prototype.isAtMinimumField = function(field) {
        var fieldName = this.ctorToString(field);
        return any(this.options.atMinimumFields, function(atMinimumField) {
            return fieldName.indexOf(atMinimumField) === 0;
        });
    };
    EcOptionsService.prototype.showAdditionalFields = function() {
        return this.options.showAdditionalFields;
    };
    EcOptionsService.prototype.getGroupsToAppend = function() {
        return this.options.groupsToAppend;
    };
    EcOptionsService.prototype.showCustomFields = function() {
        return this.experimentManager.isExperimentEnabled("specs.con.EditContactCustomFields") && this.options.showCustomFields;
    };
    Object.defineProperty(EcOptionsService.prototype, "openAddCustomFieldDialog", {
        get: function() {
            return this.options.invokeCustomFieldDialog;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EcOptionsService.prototype, "openRenameCustomFieldDialog", {
        get: function() {
            return this.options.invokeCustomFieldDialog;
        },
        enumerable: true,
        configurable: true
    });
    EcOptionsService.prototype.mustShowListByFieldName = function(field) {
        return -1 < this.options.includedFields.indexOf(field);
    };
    EcOptionsService.prototype.isFieldRequiredByName = function(field) {
        return -1 < this.options.requiredFields.indexOf(field);
    };
    EcOptionsService.prototype.ctorToString = function(ctor) {
        return ctor["fieldName"] || ctor;
    };
    return EcOptionsService;
}();

angular.module("updateContactApi").service("ecOptionsService", EcOptionsService);

"use strict";

var CustomFieldsApi = function() {
    CustomFieldsApi.$inject = [ "experimentManager", "$http", "$q", "frameworkFacade", "ecOptionsService" ];
    function CustomFieldsApi(experimentManager, $http, $q, frameworkFacade, ecOptionsService) {
        this.experimentManager = experimentManager;
        this.$http = $http;
        this.$q = $q;
        this.frameworkFacade = frameworkFacade;
        this.ecOptionsService = ecOptionsService;
    }
    CustomFieldsApi.prototype.getCustomFields = function() {
        if (this.experimentManager.isExperimentEnabled("specs.con.EditContactCustomFields")) {
            var baseUrl = this.ecOptionsService.getBaseUrl();
            var metaSiteId = this.frameworkFacade.getSiteId();
            var apiUrl = baseUrl + "api/v1/metasite/" + metaSiteId + "/customFields";
            return this.$http.get(apiUrl).then(function(response) {
                return response.data;
            });
        } else {
            return this.$q.when([]);
        }
    };
    return CustomFieldsApi;
}();

angular.module("editContactAppInternal").service("customFieldsApi", CustomFieldsApi);

"use strict";

(function() {
    function GravatarGetter() {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }
        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32(a << s | a >>> 32 - s, b);
        }
        function ff(a, b, c, d, x, s, t) {
            return cmn(b & c | ~b & d, a, b, x, s, t);
        }
        function gg(a, b, c, d, x, s, t) {
            return cmn(b & d | c & ~d, a, b, x, s, t);
        }
        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | ~d), a, b, x, s, t);
        }
        function md51(s) {
            var n = s.length, state = [ 1732584193, -271733879, -1732584194, 271733878 ], i;
            for (i = 64; i <= s.length; i += 64) {
                md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            var tail = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
            for (i = 0; i < s.length; i++) {
                tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
            }
            tail[i >> 2] |= 128 << (i % 4 << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i++) {
                    tail[i] = 0;
                }
            }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }
        function md5blk(s) {
            var md5blks = [], i;
            for (i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
        }
        var hexChr = "0123456789abcdef".split("");
        function rhex(n) {
            var s = "", j = 0;
            for (;j < 4; j++) {
                s += hexChr[n >> j * 8 + 4 & 15] + hexChr[n >> j * 8 & 15];
            }
            return s;
        }
        function hex(x) {
            for (var i = 0; i < x.length; i++) {
                x[i] = rhex(x[i]);
            }
            return x.join("");
        }
        function md5(s) {
            return hex(md51(s));
        }
        function add32(a, b) {
            return a + b & 4294967295;
        }
        if (!String.prototype.md5) {
            String.prototype.md5 = function() {
                return md5(this);
            };
        }
        this.get = function(email) {
            var emailMd5 = (email || "").trim().toLowerCase().md5();
            return "https://secure.gravatar.com/avatar/" + emailMd5 + "?d=blank";
        };
    }
    angular.module("wixAvatar").service("gravatarGetter", GravatarGetter);
})();

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var SaveReturnObj = function() {
    function SaveReturnObj(reason, contact) {
        this.reason = reason;
        this.contact = contact;
    }
    return SaveReturnObj;
}();

var SaveContactController = function() {
    SaveContactController.$inject = [ "$scope", "$mdDialog", "editContactApiFacade", "md5", "ecOptionsService", "$translate", "$timeout", "wixBiLogger", "EC_BI_ARGS" ];
    function SaveContactController($scope, $mdDialog, editContactApiFacade, md5, ecOptionsService, $translate, $timeout, wixBiLogger, EC_BI_ARGS) {
        var _this = this;
        this.$scope = $scope;
        this.$mdDialog = $mdDialog;
        this.editContactApiFacade = editContactApiFacade;
        this.md5 = md5;
        this.ecOptionsService = ecOptionsService;
        this.$translate = $translate;
        this.$timeout = $timeout;
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        this.hasError = false;
        this.errorMessage = null;
        this.isSaving = false;
        this.isEditingCompany = {
            role: false,
            company: false
        };
        this.newFieldOptions = [];
        this.newFieldDefs = [ {
            key: "email",
            list: "emails",
            type: EmailEC
        }, {
            key: "phone",
            list: "phones",
            type: PhoneEC
        }, {
            key: "address",
            list: "addresses",
            type: AddressEC
        }, {
            key: "company"
        }, {
            key: "role"
        }, {
            key: "date",
            list: "dates",
            type: DateEC
        }, {
            key: "website",
            list: "urls",
            type: UrlEC
        }, {
            key: "custom"
        } ];
        this.contact = this.addContactImages(this.$scope.contact);
        this.contact.phones.map(function(phone) {
            if (phone.tag && phone.tag.toLowerCase() === "phone number") {
                phone.tag = "";
            }
            return phone;
        });
        this.bouncedEmails = angular.copy(this.contact.emails.filter(function(email) {
            return SaveContactController.isBounced(email.deliveryStatus);
        }));
        this.invactiveEmails = angular.copy(this.contact.emails.filter(function(email) {
            return SaveContactController.isInactive(email.deliveryStatus);
        }));
        this.avatarData = {
            picture: this.contact.picture,
            name: this.contact.name,
            emails: this.contact.emails,
            phones: this.contact.phones
        };
        this.isNew = !!this.$scope.isNew;
        this.hasError = false;
        this.newFieldDefs.forEach(function(item) {
            if (_this.canAddNewFieldOption(item.key)) {
                _this.newFieldOptions.push(_this.createNewFieldOption(item));
            }
        });
    }
    SaveContactController.isBounced = function(status) {
        var bouncedStatuses = [ "bounce", "complaint", "deferral", "rejected", "spam", "invalid" ];
        return bouncedStatuses.indexOf(status) >= 0;
    };
    SaveContactController.isInactive = function(status) {
        return status === "inactive";
    };
    SaveContactController.prototype.getTitle = function() {
        if (this.isNew) {
            return this.$translate(this.ecOptionsService.getCreateHeader());
        } else {
            return this.$translate(this.ecOptionsService.getEditHeader(), {
                contactName: this.calculateTitle()
            });
        }
    };
    SaveContactController.prototype.close = function() {
        var returnObj = new SaveReturnObj("CLOSE");
        this.wixBiLogger.log("CLOSE_EDIT_CONTACT", this.EC_BI_ARGS);
        this.closeModal(returnObj);
    };
    SaveContactController.prototype.cancel = function() {
        var returnObj = new SaveReturnObj("CANCEL");
        this.wixBiLogger.log("CLOSE_EDIT_CONTACT", this.EC_BI_ARGS);
        this.closeModal(returnObj);
    };
    SaveContactController.prototype.confirm = function() {
        var _this = this;
        if (this.isFormEmpty()) {
            this.hasError = true;
            this.errorMessage = "editContact.error_invalid";
        } else if (!this.$scope.editContactForm.$valid) {
            var $error = this.$scope.editContactForm.$error;
            var inputName = $error[Object.keys($error)[0]][0].$name;
            angular.element("[name=editContactForm] [name='" + inputName + "']").focus();
        } else {
            this.removeEmptyFieldsFromLists(this.contact);
            this.retainEmailsDeliveryStatus();
            if (!this.isSaving) {
                this.isSaving = true;
                this.editContactApiFacade.save(this.contact).then(function(contact) {
                    _this.isSaving = false;
                    _this.closeModal(new SaveReturnObj("CONFIRM", contact));
                }, function(error) {
                    _this.hasError = true;
                    _this.errorMessage = "editContact.error_save";
                    _this.isSaving = false;
                });
            }
        }
    };
    SaveContactController.prototype.existingDeliveryStatus = function(email) {
        var existingEmails = this.bouncedEmails.concat(this.invactiveEmails);
        var existingEmail = existingEmails.filter(function(e) {
            return e.email === email.email;
        }).pop();
        return existingEmail && existingEmail.deliveryStatus;
    };
    SaveContactController.prototype.retainEmailsDeliveryStatus = function() {
        var _this = this;
        this.contact.emails = this.contact.emails.map(function(email) {
            var existingDeliveryStatus = _this.existingDeliveryStatus(email);
            email.deliveryStatus = existingDeliveryStatus ? existingDeliveryStatus : null;
            return email;
        });
    };
    SaveContactController.prototype.showLoadPane = function() {
        return this.isSaving;
    };
    SaveContactController.prototype.setCompanyFieldAsEditing = function(field) {
        this.isEditingCompany[field] = true;
    };
    SaveContactController.prototype.showField = function(field) {
        if (field === "role") {
            return this.contactHasRole() || this.isEditingCompany.role;
        }
        if (field === "company") {
            return this.contactHasCompany() || this.isEditingCompany.company;
        }
        return this.ecOptionsService.shouldIncludeField(field);
    };
    SaveContactController.prototype.onNewFieldOpen = function() {
        this.wixBiLogger.log("ADD_FIELD_DROPDOWN", __assign({}, this.EC_BI_ARGS, {
            origin: (this.isNew ? "new" : "edit") + " contact"
        }));
    };
    SaveContactController.prototype.onNewFieldSelected = function() {
        if (this.newField) {
            var _a = this.newField, key = _a.key, action = _a.action;
            this.newField = null;
            action(this.$scope.editContact);
            this.wixBiLogger.log("FIELD_ACTION_CLICK", __assign({}, this.EC_BI_ARGS, {
                action: "add",
                fieldName: "none",
                fieldType: key === "custom" ? "none" : key,
                origin: (this.isNew ? "new" : "edit") + " contact"
            }));
        }
    };
    SaveContactController.prototype.canAddNewFieldOption = function(field) {
        if (this.ecOptionsService.showAdditionalFields()) {
            switch (field) {
              case "role":
                return !this.contactHasRole();

              case "company":
                return !this.contactHasCompany();

              case "custom":
                return this.ecOptionsService.showCustomFields();

              default:
                return true;
            }
        }
        return -1 < [ "email", "address", "phone" ].indexOf(field);
    };
    SaveContactController.prototype.calculateTitle = function() {
        if (this.contact.name && (this.contact.name.first || this.contact.name.last)) {
            return [ this.contact.name.first, this.contact.name.last ].join(" ").trim();
        }
        if (this.contact.emails && this.contact.emails.length && this.contact.emails[0].email) {
            return this.contact.emails[0].email;
        }
        if (this.contact.phones && this.contact.phones.length) {
            return this.contact.phones[0].phone;
        }
        return "";
    };
    SaveContactController.prototype.contactHasRole = function() {
        return !!(this.contact.company && this.contact.company.role);
    };
    SaveContactController.prototype.contactHasCompany = function() {
        return !!(this.contact.company && this.contact.company.name);
    };
    SaveContactController.prototype.addContactImages = function(contact) {
        var _this = this;
        var emailHashMap = {};
        var thumbnailUrlArr = [];
        if (contact.picture) {
            thumbnailUrlArr.push(contact.picture);
        } else {
            contact.emails.filter(function(email) {
                return email.email;
            }).forEach(function(email) {
                var emailMd5 = emailHashMap[email.email] || (emailHashMap[email.email] = _this.md5.createHash(email.email.trim().toLowerCase()));
                var imageUrl = "https://secure.gravatar.com/avatar/" + emailMd5 + "?d=404";
                thumbnailUrlArr.push(imageUrl);
            });
        }
        this.thumbnails = thumbnailUrlArr.reverse();
        return contact;
    };
    SaveContactController.prototype.createNewFieldOption = function(field) {
        var _this = this;
        var key = field.key;
        switch (key) {
          case "company":
          case "role":
            var roleAction_1 = {
                key: key,
                action: function() {
                    _this.setCompanyFieldAsEditing(key);
                    _this.newFieldOptions.splice(_this.newFieldOptions.indexOf(roleAction_1), 1);
                }
            };
            return roleAction_1;

          case "custom":
            return {
                key: key,
                action: function(contact) {
                    return _this.ecOptionsService.openAddCustomFieldDialog().then(function(customField) {
                        return _this.$timeout(contact.customFields.push(customField));
                    });
                }
            };

          default:
            return {
                key: key,
                action: function(contact) {
                    var newItem = new field.type();
                    newItem.justAdded = true;
                    contact[field.list].push(newItem);
                }
            };
        }
    };
    SaveContactController.prototype.removeEmptyFieldsFromLists = function(contact) {
        var _this = this;
        var addressMinFields = [ "street", "address", "city", "state", "region", "zip", "postalCode", "country" ];
        var lists = [ {
            name: "emails",
            mustAtLeastHave: [ "email" ]
        }, {
            name: "phones",
            mustAtLeastHave: [ "phone" ]
        }, {
            name: "addresses",
            mustAtLeastHave: addressMinFields
        }, {
            name: "urls",
            mustAtLeastHave: [ "url" ]
        }, {
            name: "dates",
            mustAtLeastHave: [ "date" ]
        }, {
            name: "notes",
            mustAtLeastHave: [ "content" ]
        } ];
        lists.forEach(function(list) {
            if (contact[list.name]) {
                var indexesToDelete_1 = [];
                contact[list.name].forEach(function(item, index) {
                    if (_this.allEmpty(item, list.mustAtLeastHave)) {
                        indexesToDelete_1.push(index);
                    }
                });
                if (indexesToDelete_1.length > 0) {
                    indexesToDelete_1.reverse().forEach(function(i) {
                        return contact[list.name].splice(i, 1);
                    });
                }
            }
        });
    };
    SaveContactController.prototype.allEmpty = function(item, fieldList) {
        return fieldList.filter(function(field) {
            return item[field];
        }).length === 0;
    };
    SaveContactController.prototype.closeModal = function(returnObject) {
        this.$mdDialog.hide(returnObject);
    };
    SaveContactController.prototype.isFormEmpty = function() {
        var _this = this;
        var editContactForm = this.$scope.editContactForm;
        var hasAtMinimumField = any(editContactForm, function(formInput) {
            return _this.isAtMinimumField(formInput);
        });
        var noFieldHasValue = !any(editContactForm, function(formInput) {
            return _this.isAtMinimumField(formInput) && _this.isNotEmpty(formInput);
        });
        return hasAtMinimumField && noFieldHasValue;
    };
    SaveContactController.prototype.isAtMinimumField = function(formInput) {
        return typeof formInput === "object" && formInput["$name"] && this.ecOptionsService.isAtMinimumField(formInput["$name"]);
    };
    SaveContactController.prototype.isNotEmpty = function(formInput) {
        return !!formInput["$modelValue"];
    };
    return SaveContactController;
}();

angular.module("editContactAppInternal").controller("SaveContactController", SaveContactController);

"use strict";

var EditContact = function() {
    function EditContact() {}
    return EditContact;
}();

angular.module("editContactAppInternal").directive("editContact", [ "$parse", "$compile", function($parse, $compile) {
    return {
        templateUrl: "views/edit-contact.preload.html",
        controller: EditContact,
        controllerAs: "editContact",
        bindToController: true,
        restrict: "E",
        require: "ngModel",
        link: function(scope, element, attributes, ngModel) {
            scope.$watch("[editContact.name, editContact.company, editContact.emails, editContact.phones," + " editContact.addresses, editContact.picture, editContact.tags, editContact.notes, editContact.dates, editContact.urls, editContact.customFields]", function(newVal, oldVal) {
                if (oldVal !== newVal) {
                    setModelFromScope();
                }
            }, true);
            function setModelFromScope() {
                if (isModelAndScopeDifferent()) {
                    ngModel.$setViewValue(angular.copy(scope["editContact"]));
                }
            }
            function isModelAndScopeDifferent() {
                return [ "editContact.name", "editContact.company", "editContact.emails", "editContact.phones", "editContact.addresses", "editContact.picture", "editContact.tags", "editContact.notes", "editContact.dates", "editContact.urls", "editContact.customFields" ].some(function(val) {
                    return $parse(val)(scope) !== $parse(val)(ngModel.$viewValue);
                });
            }
            var fields = [ "name", "company", "emails", "phones", "addresses", "picture", "tags", "notes", "dates", "urls", "id", "modifiedAt", "activityStreamIds", "customFields", "attachments" ];
            ngModel.$render = function() {
                if (angular.isDefined(ngModel.$modelValue)) {
                    angular.forEach(fields, function(field) {
                        scope.editContact[field] = ngModel.$modelValue[field];
                    });
                }
            };
        }
    };
} ]);

"use strict";

var ContactEC = function() {
    function ContactEC() {
        this.name = new NameEC();
        this.company = new CompanyEC();
        this.emails = [ new EmailEC() ];
        this.phones = [];
        this.addresses = [];
        this.notes = [ new NoteEC() ];
        this.urls = [];
        this.dates = [];
        this.tags = [];
        this.activityStreamIds = [];
        this.customFields = [];
        this.attachments = [];
    }
    return ContactEC;
}();

var NameEC = function() {
    function NameEC() {}
    return NameEC;
}();

var CompanyEC = function() {
    function CompanyEC() {}
    return CompanyEC;
}();

var EmailEC = function() {
    function EmailEC() {
        this.tag = "";
        this.emailStatus = "transactional";
        this.siteMemberEmail = false;
    }
    return EmailEC;
}();

EmailEC.fieldName = "email";

var PhoneEC = function() {
    function PhoneEC() {
        this.tag = "";
    }
    return PhoneEC;
}();

PhoneEC.fieldName = "phone";

var AddressEC = function() {
    function AddressEC() {
        this.tag = "";
    }
    return AddressEC;
}();

AddressEC.fieldName = "address";

var UrlEC = function() {
    function UrlEC() {
        this.tag = "";
    }
    return UrlEC;
}();

UrlEC.fieldName = "l";

var DateEC = function() {
    function DateEC() {
        this.tag = "";
    }
    return DateEC;
}();

DateEC.fieldName = "date";

var NoteEC = function() {
    function NoteEC() {}
    return NoteEC;
}();

var CustomFieldsEC = function() {
    function CustomFieldsEC() {}
    return CustomFieldsEC;
}();

CustomFieldsEC.fieldName = "custom";

var AttachmentEC = function() {
    function AttachmentEC() {}
    return AttachmentEC;
}();

var OptionsEC = function() {
    function OptionsEC() {}
    return OptionsEC;
}();

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var AddableInput = function() {
    AddableInput.$inject = [ "ecOptionsService", "wixBiLogger", "EC_BI_ARGS" ];
    function AddableInput(ecOptionsService, wixBiLogger, EC_BI_ARGS) {
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        this.mustHaveAtLeastOne = ecOptionsService.mustShowList(this.type);
    }
    AddableInput.prototype.add = function() {
        this.list.push(new this.type());
    };
    AddableInput.prototype.remove = function(event) {
        var index = this.list.indexOf(this.item);
        if (index > -1) {
            this.wixBiLogger.log("FIELD_ACTION_CLICK", __assign({}, this.EC_BI_ARGS, {
                action: "delete",
                fieldName: "none",
                fieldType: this.type["fieldName"]
            }));
            this.list.splice(index, 1);
        }
        event.stopPropagation();
    };
    AddableInput.prototype.isDeleteVisible = function() {
        if (this.list && this.mustHaveAtLeastOne) {
            return 1 < this.list.length;
        }
        return true;
    };
    return AddableInput;
}();

angular.module("editContactAppInternal").directive("addableInput", function() {
    return {
        templateUrl: "views/addable-input.preload.html",
        controller: AddableInput,
        controllerAs: "addableInput",
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            addText: "=",
            type: "="
        },
        restrict: "E",
        transclude: true
    };
});

"use strict";

var AddressInput = function() {
    AddressInput.$inject = [ "countries", "states", "$scope", "addressFormatter" ];
    function AddressInput(countries, states, $scope, addressFormatter) {
        var _this = this;
        this.countries = countries;
        this.type = AddressEC;
        $scope.$on("focus", function() {
            delete $scope["item"]["justAdded"];
        });
        countries.retrieve().then(function(res) {
            _this.availableCountries = res;
        });
        states.retrieve("USA").then(function(res) {
            _this.availableStates = res;
        });
    }
    AddressInput.prototype.getAvailableCountries = function() {
        return this.availableCountries;
    };
    AddressInput.prototype.getAvailableStates = function() {
        return this.availableStates;
    };
    AddressInput.prototype.isStatesDisabled = function() {
        return this.item.country !== "USA";
    };
    AddressInput.prototype.countryChanged = function() {
        if (this.item.region && this.item.country !== "USA") {
            delete this.item.region;
        }
    };
    return AddressInput;
}();

angular.module("editContactAppInternal").directive("addressInput", function() {
    return {
        templateUrl: function() {
            return "views/address-input.preload.html";
        },
        controller: AddressInput,
        controllerAs: "addressInput",
        restrict: "E",
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            hashKey: "="
        }
    };
});

"use strict";

angular.module("editContactAppInternal").directive("fallbackImages", [ "$window", function($window) {
    var globallyGoodImages = {};
    var globallyBadImages = {};
    return {
        scope: {
            fallbackImages: "="
        },
        link: function(scope, element) {
            var loadElement;
            function onError(event) {
                var src = event.target.attributes.src.value;
                scope.imageFailed(src);
                scope.$digest();
            }
            function onLoad(event) {
                var src = event.target.attributes.src.value;
                globallyGoodImages[src] = true;
                element.attr("src", src);
                element.css("display", "inline");
            }
            scope.$watch("image()", function(newImage) {
                if (!newImage) {
                    return;
                }
                if (loadElement) {
                    loadElement.unbind("error", onError);
                    loadElement.unbind("load", onLoad);
                }
                if (globallyGoodImages[newImage] === true) {
                    element.attr("src", newImage);
                    element.css("display", "inline");
                    loadElement = null;
                } else {
                    loadElement = angular.element($window.document.createElement("img"));
                    loadElement.attr("src", newImage);
                    loadElement.bind("error", onError);
                    loadElement.bind("load", onLoad);
                    loadElement.css("display", "inline");
                }
            });
        },
        controller: [ "$scope", function($scope) {
            $scope.imageFailed = function(image) {
                globallyBadImages[image] = true;
            };
            $scope.image = function() {
                var potentialNextImage = [];
                if ($scope.fallbackImages) {
                    potentialNextImage = $scope.fallbackImages.filter(function(image) {
                        return globallyBadImages[image] !== true;
                    });
                }
                if (potentialNextImage.length > 0) {
                    return potentialNextImage[0];
                }
            };
        } ]
    };
} ]);

"use strict";

var EmailInput = function() {
    EmailInput.$inject = [ "$scope", "ecOptionsService", "$element" ];
    function EmailInput($scope, ecOptionsService, $element) {
        this.$element = $element;
        this.type = EmailEC;
        this.required = ecOptionsService.isFieldRequired(EmailEC);
        this.isSiteMemberMode = ecOptionsService.getMode() === "site-member";
        $scope.$on("focus", function() {
            delete $scope["item"]["justAdded"];
        });
    }
    EmailInput.prototype.isRequired = function() {
        return this.required && this.list.indexOf(this.item) === 0;
    };
    EmailInput.prototype.isValid = function() {
        var controller = this.$element.controller("emailInput");
        if (controller && controller.form) {
            return controller.form["email" + (this.hashKey || "")].$valid;
        } else {
            return false;
        }
    };
    EmailInput.prototype.isBounced = function() {
        var bouncedStatuses = [ "bounce", "complaint", "deferral", "rejected", "spam", "invalid" ];
        return bouncedStatuses.indexOf(this.item.deliveryStatus) >= 0;
    };
    return EmailInput;
}();

angular.module("editContactAppInternal").directive("emailInput", function() {
    return {
        templateUrl: "views/email-input.preload.html",
        require: [ "emailInput", "?^form" ],
        controller: EmailInput,
        controllerAs: "emailInput",
        restrict: "E",
        link: function(scope, iElement, iAttrs, controller) {
            controller[0].form = controller[1];
        },
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            hashKey: "="
        }
    };
});

"use strict";

var PhoneInput = function() {
    PhoneInput.$inject = [ "$scope", "$element" ];
    function PhoneInput($scope, $element) {
        this.type = PhoneEC;
        $scope.$on("focus", function() {
            delete $scope["item"]["justAdded"];
        });
    }
    return PhoneInput;
}();

angular.module("editContactAppInternal").directive("phoneInput", function() {
    return {
        templateUrl: "views/phone-input.preload.html",
        controller: PhoneInput,
        controllerAs: "phoneInput",
        restrict: "E",
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            hashKey: "="
        }
    };
});

"use strict";

var DateInput = function() {
    DateInput.$inject = [ "$scope" ];
    function DateInput($scope) {
        this.type = DateEC;
        $scope.$on("focus", function() {
            delete $scope["item"]["justAdded"];
        });
    }
    return DateInput;
}();

angular.module("editContactAppInternal").directive("dateInput", function() {
    return {
        templateUrl: "views/date-input.preload.html",
        controller: DateInput,
        controllerAs: "dateInput",
        restrict: "E",
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            hashKey: "="
        }
    };
});

"use strict";

var WebsiteInput = function() {
    WebsiteInput.$inject = [ "$scope", "$element" ];
    function WebsiteInput($scope, $element) {
        this.type = UrlEC;
        $scope.$on("focus", function() {
            delete $scope["item"]["justAdded"];
        });
    }
    return WebsiteInput;
}();

angular.module("editContactAppInternal").directive("websiteInput", function() {
    return {
        templateUrl: "views/website-input.preload.html",
        controller: WebsiteInput,
        controllerAs: "websiteInput",
        restrict: "E",
        scope: {},
        bindToController: {
            item: "=",
            list: "=",
            hashKey: "="
        }
    };
});

"use strict";

var InputTag = function() {
    InputTag.$inject = [ "$translate" ];
    function InputTag($translate) {
        this.$translate = $translate;
        this.availableTags = {
            email: [ {
                type: "main",
                label: $translate("editContact.tag.MAIN_EMAIL")
            }, {
                type: "home",
                label: $translate("editContact.tag.HOME_EMAIL")
            }, {
                type: "work",
                label: $translate("editContact.tag.WORK_EMAIL")
            }, {
                type: "",
                label: $translate("editContact.tag.OTHER")
            } ],
            phone: [ {
                type: "main",
                label: $translate("editContact.tag.MAIN_PHONE")
            }, {
                type: "home",
                label: $translate("editContact.tag.HOME_PHONE")
            }, {
                type: "mobile",
                label: $translate("editContact.tag.MOBILE_PHONE")
            }, {
                type: "work",
                label: $translate("editContact.tag.WORK_PHONE")
            }, {
                type: "fax",
                label: $translate("editContact.tag.FAX_PHONE")
            }, {
                type: "",
                label: $translate("editContact.tag.OTHER")
            } ],
            address: [ {
                type: "home",
                label: $translate("editContact.tag.HOME_ADDRESS")
            }, {
                type: "work",
                label: $translate("editContact.tag.WORK_ADDRESS")
            }, {
                type: "billing-address",
                label: this.$translate("editContact.tag.BILLING-ADDRESS_ADDRESS")
            }, {
                type: "shipping-address",
                label: this.$translate("editContact.tag.SHIPPING-ADDRESS_ADDRESS")
            }, {
                type: "",
                label: $translate("editContact.tag.OTHER")
            } ],
            website: [ {
                type: "company",
                label: $translate("editContact.tag.COMPANY_WEBSITE")
            }, {
                type: "personal",
                label: $translate("editContact.tag.PERSONAL_WEBSITE")
            }, {
                type: "",
                label: $translate("editContact.tag.OTHER")
            } ],
            date: [ {
                type: "birthday",
                label: $translate("editContact.tag.BIRTHDAY_DATE")
            }, {
                type: "anniversary",
                label: $translate("editContact.tag.ANNIVERSARY_DATE")
            }, {
                type: "",
                label: $translate("editContact.tag.OTHER")
            } ]
        };
    }
    InputTag.prototype.isTagSelected = function(tag) {
        return this.model.tag === tag.type;
    };
    InputTag.prototype.setTag = function(tag) {
        this.model.tag = tag.type;
    };
    InputTag.prototype.formatTagName = function(val) {
        return val.replace(" ", "-");
    };
    InputTag.prototype.getTagLabel = function() {
        if (this.model.tag) {
            var key = "editContact.tag." + (this.formatTagName(this.model.tag) + "_" + this.inputType).toUpperCase();
            var translation = this.$translate(key);
            if (key !== translation) {
                return translation;
            } else {
                return this.model.tag;
            }
        } else {
            var key = "editContact.tag." + this.inputType.toUpperCase();
            var translation = this.$translate(key);
            return translation;
        }
    };
    return InputTag;
}();

angular.module("editContactAppInternal").directive("inputTag", function() {
    return {
        templateUrl: "views/input-tag.preload.html",
        controller: InputTag,
        controllerAs: "inputTag",
        restrict: "E",
        scope: {},
        bindToController: {
            inputType: "=",
            model: "="
        }
    };
});

"use strict";

angular.module("editContactAppInternal").directive("hoverable", function() {
    return {
        restrict: "A",
        link: function(scope, element) {
            element.bind("mouseenter", function() {
                element.addClass("hover");
            });
            element.bind("mouseleave", function() {
                element.removeClass("hover");
            });
        }
    };
});

angular.module("editContactAppInternal").directive("focusable", function() {
    return {
        restrict: "A",
        link: function(scope, element) {
            element.bind("focusin", function() {
                element.addClass("focus");
            });
            element.bind("focusout", function() {
                element.removeClass("focus");
            });
        }
    };
});

"use strict";

var EcAutofocus = function() {
    EcAutofocus.$inject = [ "$scope", "$element", "$attrs", "$timeout" ];
    function EcAutofocus($scope, $element, $attrs, $timeout) {
        $scope.$watch($attrs.ecAutofocus, function(val) {
            if (val) {
                $timeout(function() {
                    return $element.focus();
                }, 400);
            }
        });
    }
    return EcAutofocus;
}();

angular.module("editContactAppInternal").directive("ecAutofocus", function() {
    return {
        controller: EcAutofocus,
        controllerAs: "ecAutofocus",
        bindToController: true,
        restrict: "A"
    };
});

"use strict";

var EcScrollToBottom = function() {
    EcScrollToBottom.$inject = [ "$scope", "$element", "$attrs", "$timeout" ];
    function EcScrollToBottom($scope, $element, $attrs, $timeout) {
        $scope.$watch($attrs.ecScrollToBottom, function(newVal, oldVal) {
            if (newVal !== oldVal) {
                $timeout(function() {
                    return $element[0].scrollTop = $element[0].scrollHeight;
                });
            }
        });
    }
    return EcScrollToBottom;
}();

angular.module("editContactAppInternal").directive("ecScrollToBottom", function() {
    return {
        controller: EcScrollToBottom,
        controllerAs: "ecScrollToBottom",
        bindToController: true,
        restrict: "A"
    };
});

"use strict";

var EcBackdrop = function() {
    EcBackdrop.$inject = [ "$scope", "$element", "$attrs" ];
    function EcBackdrop($scope, $element, $attrs) {
        var _this = this;
        $scope.$watch($attrs.ecBackdrop, function(val) {
            if (val) {
                _this.backdrop = angular.element("<ec-backdrop></ec-backdrop>");
                document.body.appendChild(_this.backdrop[0]);
            } else if (_this.backdrop) {
                document.body.removeChild(_this.backdrop[0]);
            }
        });
    }
    return EcBackdrop;
}();

angular.module("editContactAppInternal").directive("ecBackdrop", function() {
    return {
        controller: EcBackdrop,
        controllerAs: "ecBackdrop",
        bindToController: true,
        restrict: "A"
    };
});

"use strict";

var EcUnbind = function() {
    EcUnbind.$inject = [ "$scope", "$element", "$attrs" ];
    function EcUnbind($scope, $element, $attrs) {
        $scope.$watch($attrs.ecUnbind, function(val) {
            if (val) {
                var element = $attrs.ecUnbindClass ? $("." + $attrs.ecUnbindClass) : $element;
                element.unbind($attrs.ecUnbindEvent);
            }
        });
    }
    return EcUnbind;
}();

angular.module("editContactAppInternal").directive("ecUnbind", function() {
    return {
        controller: EcUnbind,
        controllerAs: "ecUnbind",
        bindToController: true,
        restrict: "A"
    };
});

"use strict";

(function() {
    function yearValidator() {
        return {
            require: "ngModel",
            restrict: "A",
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function(viewValue) {
                    if (!viewValue || 1904 < viewValue && viewValue < 2100) {
                        ctrl.$setValidity("yearValidator", true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity("yearValidator", false);
                        return viewValue;
                    }
                });
            }
        };
    }
    angular.module("editContactAppInternal").directive("yearValidator", yearValidator);
})();

"use strict";

(function() {
    function dateValidator() {
        return {
            require: "ngModel",
            restrict: "A",
            link: function(scope, elm, attrs, ctrl) {
                scope.$watchGroup([ attrs.dateValidator, attrs.ngModel ], function(_a) {
                    var newDate = _a[0], newValue = _a[1];
                    var fieldHasValue = !!newValue;
                    var dateDefined = !_.isUndefined(newDate);
                    ctrl.$setValidity("dateValidator", dateDefined && fieldHasValue || _.isNull(newDate) && fieldHasValue || !dateDefined && !fieldHasValue);
                });
            }
        };
    }
    angular.module("editContactAppInternal").directive("dateValidator", dateValidator);
})();

"use strict";

var __extends = this && this.__extends || function() {
    var extendStatics = Object.setPrototypeOf || {
        __proto__: []
    } instanceof Array && function(d, b) {
        d.__proto__ = b;
    } || function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    };
    return function(d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();

var OptionalDateFactory = function() {
    function OptionalDateFactory() {}
    OptionalDateFactory.prototype.fromDate = function(date) {
        var optionalYearDate = new this.creator();
        optionalYearDate.setDay(date.getDate());
        optionalYearDate.setMonth(date.getMonth());
        optionalYearDate.setYear(date.getFullYear());
        return optionalYearDate;
    };
    OptionalDateFactory.prototype.fromString = function(date) {
        return this.fromDate(new Date(date));
    };
    OptionalDateFactory.prototype.fromDateParameters = function(day, month) {
        var optionalYearDate = new this.creator();
        optionalYearDate.setDay(day);
        optionalYearDate.setMonth(month);
        return optionalYearDate;
    };
    OptionalDateFactory.prototype.empty = function() {
        return new this.creator();
    };
    return OptionalDateFactory;
}();

var OptionalYearDateCreator = function(_super) {
    __extends(OptionalYearDateCreator, _super);
    function OptionalYearDateCreator() {
        var _this = _super.call(this) || this;
        _this.creator = OptionalYearDate;
        return _this;
    }
    return OptionalYearDateCreator;
}(OptionalDateFactory);

var OptionalYearDate = function() {
    function OptionalYearDate() {
        this._day = null;
        this._month = null;
        this._year = null;
    }
    OptionalYearDate.daysInMonth = function(month, year) {
        var properYear = year || OptionalYearDate.leapYear;
        var nextMonth = month + 1;
        var minusDay = 0;
        return new Date(properYear, nextMonth, minusDay).getDate();
    };
    OptionalYearDate.prototype.setDay = function(day) {
        this._day = day;
    };
    OptionalYearDate.prototype.getDay = function() {
        return this._day;
    };
    OptionalYearDate.prototype.clearDay = function() {
        this._day = null;
    };
    OptionalYearDate.prototype.setMonth = function(month) {
        this._month = month;
    };
    OptionalYearDate.prototype.getMonth = function() {
        return this._month;
    };
    OptionalYearDate.prototype.setYear = function(year) {
        this._year = year;
    };
    OptionalYearDate.prototype.getYear = function() {
        return this._year;
    };
    OptionalYearDate.prototype.clearYear = function() {
        this._year = null;
    };
    OptionalYearDate.prototype.hasYear = function() {
        return !!this._year;
    };
    OptionalYearDate.prototype.clearAll = function() {
        this._day = null;
        this._month = null;
        this._year = null;
    };
    OptionalYearDate.prototype.getDate = function(defaultYear) {
        var year = this._year || defaultYear;
        if (this._day && this._year > 1900) {
            return new Date(year, this._month, this._day);
        }
        if (!any([ this._year, this._month, this._day ])) {
            return undefined;
        }
        return null;
    };
    OptionalYearDate.prototype.isValid = function() {
        return any([ all([ this._year, this._month, this._day ]), all([ !this._year, !this._month, !this._day ]), all([ this._month, this._day ]) ]);
    };
    OptionalYearDate.prototype.daysInMonth = function() {
        return OptionalYearDate.daysInMonth(this.getMonth(), this.getYear());
    };
    return OptionalYearDate;
}();

OptionalYearDate.leapYear = 1904;

var GenericDateInput = function() {
    function GenericDateInput() {
        this.dateBuilder = new OptionalYearDateCreator();
        if (this.item.date) {
            this.initFromDate(this.item.date);
        } else {
            this.optionalYearDate = this.dateBuilder.empty();
        }
    }
    GenericDateInput.prototype.onFocus = function() {
        delete this.item["justAdded"];
    };
    GenericDateInput.prototype.initFromDate = function(date) {
        if (date instanceof Date) {
            if (date.getFullYear() !== GenericDateInput.fillerYear) {
                this.optionalYearDate = this.dateBuilder.fromDate(date);
            } else {
                this.optionalYearDate = this.dateBuilder.fromDateParameters(date.getDate(), date.getMonth());
            }
        } else {
            this.optionalYearDate = this.dateBuilder.fromString(date);
        }
    };
    Object.defineProperty(GenericDateInput.prototype, "year", {
        get: function() {
            return this.optionalYearDate.getYear();
        },
        set: function(value) {
            if (value) {
                this.optionalYearDate.setYear(value);
            } else {
                this.optionalYearDate.clearYear();
            }
            this.item.date = this.optionalYearDate.getDate(GenericDateInput.fillerYear);
            if (this.item.date && this.item.date.getDate() !== this.optionalYearDate.getDay()) {
                this.optionalYearDate.clearDay();
                this.item.date = this.optionalYearDate.getDate(GenericDateInput.fillerYear);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GenericDateInput.prototype, "month", {
        get: function() {
            var month = this.optionalYearDate.getMonth();
            var display = month != null && month + 1;
            return display;
        },
        set: function(display) {
            this.optionalYearDate.clearDay();
            this.optionalYearDate.setMonth(display - 1);
            this.item.date = this.optionalYearDate.getDate(GenericDateInput.fillerYear);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GenericDateInput.prototype, "day", {
        get: function() {
            return this.optionalYearDate.getDay();
        },
        set: function(value) {
            this.optionalYearDate.setDay(value);
            this.item.date = this.optionalYearDate.getDate(GenericDateInput.fillerYear);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GenericDateInput.prototype, "days", {
        get: function() {
            var days = [];
            for (var day = 1; day <= this.optionalYearDate.daysInMonth(); day++) {
                days.push(day);
            }
            return days;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GenericDateInput.prototype, "months", {
        get: function() {
            return [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
        },
        enumerable: true,
        configurable: true
    });
    return GenericDateInput;
}();

GenericDateInput.fillerYear = 1904;

angular.module("editContactAppInternal").directive("genericDateInput", function() {
    return {
        templateUrl: "views/generic-date-input.preload.html",
        controller: GenericDateInput,
        controllerAs: "genericDateInput",
        link: function(scope, iElement, iAttrs, controller) {
            controller[0].form = controller[1];
        },
        restrict: "E",
        scope: {},
        require: [ "genericDateInput", "?^form" ],
        bindToController: {
            item: "="
        }
    };
});

"use strict";

var GroupChips = function() {
    GroupChips.$inject = [ "ecTagsApi", "$templateCache", "$timeout", "$scope" ];
    function GroupChips(ecTagsApi, $templateCache, $timeout, $scope) {
        var _this = this;
        this.ecTagsApi = ecTagsApi;
        this.$templateCache = $templateCache;
        this.$timeout = $timeout;
        this.$scope = $scope;
        this.availableTags = [];
        this.userTags = [];
        this.tooltipOpen = false;
        this.preventTooltipClose = false;
        this.tooltipScope = {
            availableTags: this.availableTags,
            onApplyTooltip: function(selection) {
                return _this.onApplyTooltip(selection);
            },
            onCancelTooltip: function() {
                return _this.onCancelTooltip();
            },
            preventClose: function() {
                _this.$timeout(function() {
                    _this.preventTooltipClose = true;
                });
            }
        };
        ecTagsApi.refreshTags();
        ecTagsApi.getUserTags().then(function(tags) {
            return _this.setupTags(tags);
        });
    }
    GroupChips.prototype.remove = function(tag) {
        var tagIndex = this.contactTags.indexOf(tag.id);
        this.contactTags.splice(tagIndex, 1);
        this.refreshTags();
    };
    GroupChips.prototype.setupTags = function(tags) {
        this.userTags = tags;
        this.refreshTags();
    };
    GroupChips.prototype.refreshTags = function() {
        var _this = this;
        this.availableTags.splice(0, this.availableTags.length);
        this.userTags.forEach(function(tag) {
            _this.availableTags.push(_this.createAvailableTag(tag));
        });
        this.displayTags = this.userTags.filter(function(tag) {
            return _this.isTagSelected(tag.id);
        });
    };
    GroupChips.prototype.createAvailableTag = function(tag) {
        return {
            isSelected: this.isTagSelected(tag.id),
            tag: angular.copy(tag)
        };
    };
    GroupChips.prototype.isTagSelected = function(id) {
        return this.contactTags && -1 < this.contactTags.indexOf(id);
    };
    GroupChips.prototype.onApplyTooltip = function(selectedTags) {
        var _this = this;
        this.closeTooltip();
        this.contactTags = [];
        selectedTags.forEach(function(selectedTag) {
            if (selectedTag.isSelected) {
                _this.contactTags.push(selectedTag.tag.id);
            }
            if (selectedTag.isNew) {
                _this.userTags.push(angular.copy(selectedTag.tag));
                delete selectedTag.isNew;
            }
        });
        this.refreshTags();
    };
    GroupChips.prototype.onCancelTooltip = function() {
        var _this = this;
        this.closeTooltip();
        this.availableTags.forEach(function(availableTag) {
            if (availableTag.isNew) {
                _this.userTags.push(angular.copy(availableTag.tag));
                delete availableTag.isNew;
            }
        });
        this.refreshTags();
    };
    GroupChips.prototype.closeTooltip = function() {
        this.preventTooltipClose = false;
        this.tooltipOpen = false;
    };
    return GroupChips;
}();

angular.module("editContactAppInternal").component("groupChips", {
    templateUrl: "views/group-chips.preload.html",
    controller: GroupChips,
    bindings: {
        contactTags: "="
    }
});

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var GroupsTooltip = function() {
    GroupsTooltip.$inject = [ "ecTagsApi", "$timeout", "wixBiLogger", "EC_BI_ARGS", "$element", "$window" ];
    function GroupsTooltip(ecTagsApi, $timeout, wixBiLogger, EC_BI_ARGS, $element, $window) {
        this.ecTagsApi = ecTagsApi;
        this.$timeout = $timeout;
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        this.responseFilter = function(tag) {
            return tag.isSelected || tag.isNew;
        };
        var tooltipElement = $element.parents(".wix-tooltip");
        this.keepFromBottom($window, tooltipElement);
        this.closeOnWindowResize($window, $element.parents(".wix-tooltip"));
    }
    GroupsTooltip.prototype.keepFromBottom = function(window, tooltip) {
        var addButton = $("group-chips a");
        if (addButton.length) {
            var tooltipT = addButton.offset().top;
            var tooltipH = 290;
            var windowH = window.innerHeight;
            if (windowH < tooltipT + tooltipH) {
                tooltip.css("margin-top", windowH - (tooltipT + tooltipH) - 50);
            }
        }
    };
    GroupsTooltip.prototype.closeOnWindowResize = function(window, tooltip) {
        var _this = this;
        var handler = function() {
            tooltip.hide();
            $(window).off("resize", handler);
            _this.cancel();
        };
        $(window).resize(handler);
    };
    GroupsTooltip.prototype.apply = function() {
        var _this = this;
        if (!this.isCreatingGroup) {
            this.onApply(this.availableTags.filter(this.responseFilter));
            return;
        }
        var newItem = _.last(this.availableTags);
        if (!newItem.tag.name) {
            this.availableTags.pop();
            this.onApply(this.availableTags.filter(this.responseFilter));
        } else {
            this.applyCreate(newItem).then(function() {
                _this.$timeout(function() {
                    return _this.onApply(_this.availableTags.filter(_this.responseFilter));
                });
            });
        }
    };
    GroupsTooltip.prototype.cancel = function() {
        this.onCancel();
    };
    GroupsTooltip.prototype.itemChanged = function() {
        this.showActions = true;
        this.preventClose();
    };
    GroupsTooltip.prototype.create = function() {
        this.preventClose();
        this.showActions = true;
        this.isCreatingGroup = true;
        this.availableTags.push({
            tag: {
                name: ""
            },
            isSelected: true,
            isTransient: true
        });
        this.wixBiLogger.log("ON_CLICK_ADD_NEW_LABEL", __assign({}, this.EC_BI_ARGS, {
            origin: "edit-contact"
        }));
    };
    GroupsTooltip.prototype.applyCreate = function(item) {
        var _this = this;
        if (!item.tag.name) {
            return;
        }
        delete item.isTransient;
        item.isNew = true;
        item.tag.displayName = item.tag.name;
        this.isCreatingGroup = false;
        return this.ecTagsApi.create(item.tag.name).then(function(savedTag) {
            _this.$timeout(function() {
                item.tag.id = savedTag.id;
            });
        });
    };
    GroupsTooltip.prototype.cancelCreate = function() {
        this.isCreatingGroup = false;
        this.availableTags.pop();
    };
    return GroupsTooltip;
}();

angular.module("editContactAppInternal").component("groupsTooltip", {
    templateUrl: "views/groups-tooltip.preload.html",
    controller: GroupsTooltip,
    bindings: {
        availableTags: "=",
        onApply: "=",
        onCancel: "=",
        preventClose: "="
    }
});

"use strict";

var WixAvatar = function() {
    WixAvatar.$inject = [ "$scope", "gravatarGetter" ];
    function WixAvatar($scope, gravatarGetter) {
        this.$scope = $scope;
        this.gravatarGetter = gravatarGetter;
    }
    WixAvatar.prototype.getAcronyms = function() {
        return this.nameFilter(this.data.name) || this.emailFilter(this.data.emails);
    };
    WixAvatar.prototype.getImage = function() {
        return this.data.picture || this.getGravatar();
    };
    WixAvatar.prototype.getGravatar = function() {
        var email = this.extractFirstValueOf(this.data.emails, "email");
        return email && this.gravatarGetter.get(email);
    };
    WixAvatar.prototype.emailFilter = function(emails) {
        var email = this.extractFirstValueOf(emails, "email");
        return email && this.firstNchars(email, 2);
    };
    WixAvatar.prototype.nameFilter = function(name) {
        var _a = typeof name === "string" ? this.parseNameAsString(name) : this.parseNameAsObject(name), first = _a[0], last = _a[1];
        return (first || last) && this.fromName(first, last);
    };
    WixAvatar.prototype.isEnglishLetters = function(value) {
        return !/[^a-zA-Z]/.test(value);
    };
    WixAvatar.prototype.parseNameAsString = function(name) {
        var arr = name.split(" ");
        return [ arr[0], arr.length > 1 ? arr[1] : null ];
    };
    WixAvatar.prototype.parseNameAsObject = function(name) {
        var names = [ name ];
        return [ this.extractFirstValueOf(names, "first"), this.extractFirstValueOf(names, "last") ];
    };
    WixAvatar.prototype.extractFirstValueOf = function(arr, key) {
        var res = null;
        (arr || []).forEach(function(item) {
            if (!res && item && _.isString(item[key])) {
                res = item[key].trim();
            }
        });
        return res;
    };
    WixAvatar.prototype.fromName = function(first, last) {
        var result;
        if (first && last) {
            result = this.firstNchars(first, 1) + this.firstNchars(last, 1);
        } else {
            result = this.firstNchars(first || last, 2);
        }
        return this.isEnglishLetters(result) ? result : "";
    };
    WixAvatar.prototype.firstNchars = function(input, n) {
        return input.slice(0, n).toUpperCase();
    };
    return WixAvatar;
}();

angular.module("wixAvatar").component("wixAvatar", {
    template: '<span class="avatar-initials" data-hook="avatar-initials" ng-if="$ctrl.getAcronyms()">{{$ctrl.getAcronyms()}}</span>' + '<img relative-src="{{$ctrl.getImage()}}" ng-if="$ctrl.getImage()">' + '<span class="empty-contact-icon" ng-if="!$ctrl.getAcronyms() && !$ctrl.getImage()">' + '<span class="edit-contact-svg-font-icons-contact-icon"></span>' + "</span>",
    controller: WixAvatar,
    bindings: {
        data: "="
    }
});

"use strict";

var ContactAbout = function() {
    ContactAbout.$inject = [ "$scope", "contactAboutBuilder" ];
    function ContactAbout($scope, contactAboutBuilder) {
        var _this = this;
        this.$scope = $scope;
        this.contactAboutBuilder = contactAboutBuilder;
        this.aboutItems = [];
        $scope.$watch("$ctrl.contact", function(newContact) {
            return _this.generateAboutItems(newContact).then(function(aboutItems) {
                return _this.aboutItems = aboutItems;
            });
        }, true);
    }
    ContactAbout.prototype._concatAbout = function(arr, val) {
        return val ? arr.concat(val) : arr;
    };
    ContactAbout.prototype.generateAboutItems = function(contact) {
        var _this = this;
        return this.contactAboutBuilder.getAboutItems(contact).then(function(contact) {
            var aboutItems = [];
            aboutItems = _this._concatAbout(aboutItems, contact.getSiteMember());
            aboutItems = _this._concatAbout(aboutItems, contact.getEmails());
            aboutItems = _this._concatAbout(aboutItems, contact.getPhones());
            aboutItems = _this._concatAbout(aboutItems, contact.getAddresses());
            aboutItems = _this._concatAbout(aboutItems, contact.getGroups());
            aboutItems = _this._concatAbout(aboutItems, contact.getCompany());
            aboutItems = _this._concatAbout(aboutItems, contact.getRole());
            aboutItems = _this._concatAbout(aboutItems, contact.getUrls());
            aboutItems = _this._concatAbout(aboutItems, contact.getDates());
            aboutItems = _this._concatAbout(aboutItems, contact.getNotes());
            return aboutItems;
        });
    };
    return ContactAbout;
}();

angular.module("editContactAppInternal").component("contactAbout", {
    templateUrl: "views/contact-about.preload.html",
    controller: ContactAbout,
    bindings: {
        contact: "="
    }
});

"use strict";

var __assign = this && this.__assign || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var CustomFieldController = function() {
    CustomFieldController.$inject = [ "$scope", "ecOptionsService", "MAX_NUM_LENGTH", "$timeout", "wixBiLogger", "EC_BI_ARGS" ];
    function CustomFieldController($scope, ecOptionsService, MAX_NUM_LENGTH, $timeout, wixBiLogger, EC_BI_ARGS) {
        var _this = this;
        this.$scope = $scope;
        this.ecOptionsService = ecOptionsService;
        this.MAX_NUM_LENGTH = MAX_NUM_LENGTH;
        this.$timeout = $timeout;
        this.wixBiLogger = wixBiLogger;
        this.EC_BI_ARGS = EC_BI_ARGS;
        if (this.shouldShow() && this.isDateType()) {
            $scope.item = new DateEC();
            if (this.item.value) {
                $scope.item.date = this.item.value;
            }
            $scope.$watch("item.date", function(date) {
                if (date && date !== _this.item.value) {
                    _this.item.value = date.toISOString();
                }
            });
        }
    }
    CustomFieldController.prototype.shouldShow = function() {
        return this.item && this.item.name;
    };
    CustomFieldController.prototype.isTextOrUrlType = function() {
        return [ "text", "url" ].indexOf(this.item.type.toLowerCase()) > -1;
    };
    CustomFieldController.prototype.isNumberType = function() {
        return this.item.type.toLowerCase() === "number";
    };
    CustomFieldController.prototype.isDateType = function() {
        return this.item.type.toLowerCase() === "date";
    };
    CustomFieldController.prototype.shouldEnableRename = function() {
        return this.ecOptionsService.showCustomFields();
    };
    CustomFieldController.prototype.rename = function() {
        var _this = this;
        this.wixBiLogger.log("FIELD_ACTION_CLICK", __assign({}, this.EC_BI_ARGS, {
            action: "rename",
            fieldName: this.item.name,
            fieldType: this.item.type,
            origin: (this.isNewContact ? "new" : "edit") + " contact"
        }));
        return this.ecOptionsService.openRenameCustomFieldDialog(this.item.id).then(function(_a) {
            var name = _a.name;
            return _this.$timeout(function() {
                return _this.item.name = name;
            });
        });
    };
    return CustomFieldController;
}();

angular.module("editContactAppInternal").directive("toNumber", function() {
    var toNumber = function(value) {
        return isNaN(value) ? "" : parseFloat(value);
    };
    var validNumber = function(modelValue, viewValue) {
        var value = modelValue || viewValue;
        return !(value && isNaN(value));
    };
    return {
        require: "ngModel",
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$parsers.push(toNumber);
            ctrl.$validators.number = validNumber;
        }
    };
}).component("customField", {
    templateUrl: "views/custom-field.preload.html",
    controller: CustomFieldController,
    bindings: {
        item: "=",
        isNewContact: "="
    }
});

"use strict";

var EcBiEvents = function() {
    function EcBiEvents() {
        this.eventCodes = {
            CLOSE_EDIT_CONTACT: 122,
            SAVE_BUTTON_CLICK: 123,
            OPEN_EDIT_CONTACT: 121,
            OPEN_ADD_NEW_CONTACT: 112,
            ON_CLICK_ADD_NEW_LABEL: 135,
            ON_CREATE_NEW_LABEL: 136,
            ADD_FIELD_DROPDOWN: 169,
            FIELD_ACTION_CLICK: 168
        };
        this.evMap = {};
        var propertyName;
        for (propertyName in this.eventCodes) {
            if (typeof this.eventCodes[propertyName] === "number") {
                this.defineBIEvent(propertyName, this.eventCodes[propertyName]);
            }
        }
    }
    EcBiEvents.prototype.defineBIEvent = function(name, evid) {
        this[name] = name;
        this.evMap[name] = {
            evid: evid
        };
    };
    EcBiEvents.prototype.getEventMap = function() {
        return this.evMap;
    };
    return EcBiEvents;
}();

angular.module("editContactAppInternal").constant("EC_BI_ARGS", {
    src: 27,
    adapter: "contacts"
}).constant("ecBiEvents", new EcBiEvents());

var any = _.some || _.any;

var all = _.every || _.all;

"use strict";

angular.module("editContactAppInternal").constant("MAX_NUM_LENGTH", 16);

"use strict";

var AboutItem = function() {
    function AboutItem(label, html, htmlClass, iconClass) {
        this.label = label;
        this.html = html;
        this.htmlClass = typeof htmlClass === "undefined" ? "" : htmlClass;
        this.iconObj = typeof iconClass === "undefined" ? "" : iconClass;
    }
    return AboutItem;
}();

var NEWLINE_DELIMITER = "\n";

var ContactAboutBuilder = function() {
    ContactAboutBuilder.$inject = [ "$translate", "ecTagsApi", "$filter", "addressFormatter" ];
    function ContactAboutBuilder($translate, ecTagsApi, $filter, addressFormatter) {
        this.$translate = $translate;
        this.ecTagsApi = ecTagsApi;
        this.$filter = $filter;
        this.addressFormatter = addressFormatter;
        this.SITE_MEMBERS_OPTIONS = [ {
            status: "contacts-site_members_approved",
            label: this.$translate("editContact.about.SITE_MEMBERS_APPROVED")
        }, {
            status: "contacts-site_members_request",
            label: this.$translate("editContact.about.SITE_MEMBERS_PENDING")
        }, {
            status: "contacts-site_members_denied",
            label: this.$translate("editContact.about.SITE_MEMBERS_BLOCKED")
        } ];
        this.AVAILABLE_INFO_TAGS = {
            email: [ {
                type: "main",
                label: this.$translate("editContact.about.MAIN_EMAIL")
            }, {
                type: "home",
                label: this.$translate("editContact.about.HOME_EMAIL")
            }, {
                type: "work",
                label: this.$translate("editContact.about.WORK_EMAIL")
            } ],
            phone: [ {
                type: "main",
                label: this.$translate("editContact.about.MAIN_PHONE")
            }, {
                type: "home",
                label: this.$translate("editContact.about.HOME_PHONE")
            }, {
                type: "mobile",
                label: this.$translate("editContact.about.MOBILE_PHONE")
            }, {
                type: "work",
                label: this.$translate("editContact.about.WORK_PHONE")
            }, {
                type: "fax",
                label: this.$translate("editContact.about.FAX_PHONE")
            }, {
                type: "phone-number",
                label: this.$translate("editContact.about.PHONE_NUMBER")
            } ],
            address: [ {
                type: "home",
                label: this.$translate("editContact.about.HOME_ADDRESS")
            }, {
                type: "work",
                label: this.$translate("editContact.about.WORK_ADDRESS")
            }, {
                type: "billing-address",
                label: this.$translate("editContact.about.BILLING_ADDRESS")
            }, {
                type: "shipping-address",
                label: this.$translate("editContact.about.SHIPPING_ADDRESS")
            } ],
            website: [ {
                type: "company",
                label: this.$translate("editContact.about.COMPANY_WEBSITE")
            }, {
                type: "personal",
                label: this.$translate("editContact.about.PERSONAL_WEBSITE")
            } ],
            date: [ {
                type: "birthday",
                label: this.$translate("editContact.about.BIRTHDAY_DATE")
            }, {
                type: "anniversary",
                label: this.$translate("editContact.about.ANNIVERSARY_DATE")
            } ]
        };
    }
    ContactAboutBuilder.prototype.getAboutItems = function(contactDTO) {
        var _this = this;
        return this.ecTagsApi.getUserTags().then(function(groups) {
            _this.contact = contactDTO;
            _this.contactGroups = groups;
        }).then(function() {
            return {
                getSiteMember: function() {
                    return _this.getSiteMember();
                },
                getGroups: function() {
                    return _this.getGroups();
                },
                getPhones: function() {
                    return _this.getPhones();
                },
                getEmails: function() {
                    return _this.getEmails();
                },
                getAddresses: function() {
                    return _this.getAddresses();
                },
                getCompany: function() {
                    return _this.getCompany();
                },
                getRole: function() {
                    return _this.getRole();
                },
                getUrls: function() {
                    return _this.getUrls();
                },
                getDates: function() {
                    return _this.getDates();
                },
                getNotes: function() {
                    return _this.getNotes();
                }
            };
        });
    };
    ContactAboutBuilder.prototype.getSiteMember = function() {
        var _this = this;
        function hasSiteMemberStaus(option) {
            return ContactAboutBuilder.toArray(this.contact["tags"]).indexOf(option.status) > -1;
        }
        var label = this.$translate("editContact.about.SITE_MEMBER");
        var html = this.SITE_MEMBERS_OPTIONS.reduce(function(prev, option) {
            return prev || (hasSiteMemberStaus.call(_this, option) ? option.label : null);
        }, null);
        return html ? new AboutItem(label, html, "site-member") : null;
    };
    ContactAboutBuilder.prototype.getGroups = function() {
        var label = this.$translate("editContact.about.GROUPS_LABEL");
        var html = this.renderGroups();
        return label && html ? new AboutItem(label, html, "groups") : null;
    };
    ContactAboutBuilder.prototype.getPhones = function() {
        var phoneFormatter = function(item) {
            return item["phone"];
        };
        return this.renderCategoryItems("phones", "phone", phoneFormatter, "editContact.about.PHONE");
    };
    ContactAboutBuilder.prototype.getEmails = function() {
        var _this = this;
        var emailFormatter = function(emailItem) {
            return emailItem["email"];
        };
        var iconFormatter = function(emailItem) {
            var emailStatus = emailItem["emailStatus"];
            var iconClass = emailStatus ? "edit-contact-svg-font-icons-" + emailStatus : "";
            var iconTooltip = emailStatus ? _this.$translate("editContact.about.TEXT_EMAIL_" + emailStatus.toUpperCase()) : "";
            return {
                iconClass: iconClass,
                iconTooltip: iconTooltip
            };
        };
        return this.renderCategoryItems("emails", "email", emailFormatter, "editContact.about.EMAIL", iconFormatter);
    };
    ContactAboutBuilder.prototype.getAddresses = function() {
        return this.renderCategoryItems("addresses", "address", this.addressFormatter.format, "editContact.about.ADDRESS");
    };
    ContactAboutBuilder.prototype.getCompany = function() {
        return this.renderSimpleItem("company", "name", "editContact.about.COMPANY");
    };
    ContactAboutBuilder.prototype.getRole = function() {
        return this.renderSimpleItem("company", "role", "editContact.about.ROLE");
    };
    ContactAboutBuilder.prototype.getUrls = function() {
        var formatWebsite = function(item) {
            return item["url"];
        };
        return this.renderCategoryItems("urls", "website", formatWebsite, "editContact.about.WEBSITE");
    };
    ContactAboutBuilder.prototype.getDates = function() {
        var _this = this;
        var formatDate = function(date) {
            var raw = _this.$filter("moment")(date["date"], "ll");
            return raw.split(" ").slice(0, 2).join(" ").split(",")[0];
        };
        return this.renderCategoryItems("dates", "date", formatDate, "editContact.about.DATE");
    };
    ContactAboutBuilder.prototype.getNotes = function() {
        return this.renderSimpleItem("notes", "content", "editContact.about.NOTES_TITLE");
    };
    ContactAboutBuilder.prototype.renderGroups = function() {
        var _this = this;
        return ContactAboutBuilder.toArray(this.contact["tags"]).filter(function(tagId) {
            return tagId && !_this.isSiteMemberGroup(tagId);
        }).map(function(tagId) {
            return _this.getGroupDisplayName(tagId);
        }).filter(function(group) {
            return !!group;
        }).join(", ");
    };
    ContactAboutBuilder.prototype.renderSimpleItem = function(mainKey, innerKey, labelKey) {
        var prop = function(item) {
            return item[innerKey];
        };
        var label = this.$translate(labelKey).toUpperCase();
        var html = ContactAboutBuilder.toArray(this.contact[mainKey]).filter(prop).map(prop).join(NEWLINE_DELIMITER);
        return html ? new AboutItem(label, html, innerKey) : null;
    };
    ContactAboutBuilder.prototype.renderCategoryItems = function(dtoKey, infoTagKey, formatter, defaultInfoTag, iconFormmater) {
        var _this = this;
        if (iconFormmater === void 0) {
            iconFormmater = function(_) {
                return {
                    iconClass: "",
                    iconTooltip: ""
                };
            };
        }
        var items = ContactAboutBuilder.toArray(this.contact[dtoKey]).map(function(it) {
            var item = it || {};
            var label = (_this.formatLabel(infoTagKey, item) || _this.$translate(defaultInfoTag)).toUpperCase();
            var html = formatter(item);
            var icon = iconFormmater(item);
            return new AboutItem(label, html, infoTagKey, icon);
        });
        ContactAboutBuilder.appendNumbersSuffix(items, this.$translate(defaultInfoTag));
        return _.isEmpty(items) ? null : items;
    };
    ContactAboutBuilder.prototype.getGroupDisplayName = function(tagId) {
        var name;
        return (name = _.find(this.contactGroups, {
            id: tagId
        })) ? name.displayName : null;
    };
    ContactAboutBuilder.prototype.isSiteMemberGroup = function(group) {
        return !!_.find(this.SITE_MEMBERS_OPTIONS, {
            status: group
        });
    };
    ContactAboutBuilder.prototype.formatLabel = function(category, item) {
        if (item.tag) {
            return this.findTagLabelConfig(category, item.tag) || this.findTagLabelConfig(category, this.formatTagName(item.tag)) || String(item.tag);
        }
    };
    ContactAboutBuilder.prototype.formatTagName = function(val) {
        return val.replace(" ", "-").toLowerCase();
    };
    ContactAboutBuilder.prototype.findTagLabelConfig = function(category, tag) {
        return this.AVAILABLE_INFO_TAGS[category].reduce(function(prev, currTag) {
            return prev || (currTag.type === tag ? currTag.label : null);
        }, null);
    };
    ContactAboutBuilder.appendNumbersSuffix = function(res, label) {
        var first = null, i = 0;
        res.forEach(function(item) {
            if (item.label === label) {
                i++;
                if (i === 1) {
                    first = item;
                    return;
                } else if (i === 2) {
                    first.label = first.label + " #1";
                }
                item.label = item.label + (" #" + i);
            }
        });
    };
    ContactAboutBuilder.toArray = function(val) {
        if (!val) {
            return [];
        } else {
            return _.isArray(val) ? val : [ val ];
        }
    };
    return ContactAboutBuilder;
}();

angular.module("editContactAppInternal").service("contactAboutBuilder", ContactAboutBuilder);

"use strict";

var AddressFormatter = function() {
    function AddressFormatter() {}
    AddressFormatter.prototype.format = function(address) {
        function normalize(value) {
            return value ? value + "" : "";
        }
        var addr;
        if (address.address || address.region || address.postalCode) {
            addr = {
                street: normalize(address.address),
                city: normalize(address.city),
                state: normalize(address.region),
                zip: normalize(address.postalCode),
                country: normalize(address.country)
            };
        } else {
            addr = {
                street: normalize(address.street),
                city: normalize(address.city),
                state: normalize(address.state),
                zip: normalize(address.zip),
                country: normalize(address.country)
            };
        }
        function separateWithComma(values) {
            return values.filter(function(x) {
                return x !== "" && x !== undefined && x !== null;
            }).join(", ");
        }
        return "" + separateWithComma([ addr.street, addr.city, (addr.state + " " + addr.zip).trim(), addr.country ]);
    };
    return AddressFormatter;
}();

angular.module("editContactAppInternal").service("addressFormatter", AddressFormatter);

"use strict";

angular.module("editContactAppInternal").filter("moment", function() {
    return function(input, formatType) {
        var date;
        if (input && (date = moment(input))) {
            return date.format(formatType);
        }
    };
});

angular.module("editContactPreload").run([ "$templateCache", function($templateCache) {
    "use strict";
    $templateCache.put("views/addable-input.preload.html", "<div class='addable-input' focusable hoverable>\n" + "<ng-transclude class='transcluded edit-contact-input'></ng-transclude>\n" + "<span class='edit-contact-add-delete' wix-experiment-if='!specs.con.EditContactCustomFields'>\n" + "<span class='edit-contact-delete' data-hook='addable-input-delete' ng-class='{&#39;edit-contact-delete-visible&#39;: addableInput.isDeleteVisible()}' ng-click='addableInput.remove($event)'></span>\n" + "</span>\n" + "<span align-tooltip='right' class='edit-contact-delete-field wix-style-svg-font-icons-x' data-hook='addable-input-delete' ng-class='{&#39;edit-contact-delete-visible&#39;: addableInput.isDeleteVisible()}' ng-click='addableInput.remove($event)' tooltip-class='dark' wix-experiment-if='specs.con.EditContactCustomFields' wix-tooltip='{{ &#39;editContact.remove_field&#39; | translate }}'></span>\n" + "</div>\n");
    $templateCache.put("views/address-input.preload.html", "<addable-input add-text='&#39;editContact.add_address&#39;' item='addressInput.item' list='addressInput.list' type='addressInput.type'>\n" + "<span class='address-input-items'>\n" + "<input-tag class='edit-contact-optional' focusable hoverable input-type='&#39;address&#39;' model='addressInput.item'></input-tag>\n" + "<div class='fields fields-components'>\n" + "<div class='address edit-contact-input'>\n" + "<wix-input data-hook='address-input' ec-autofocus='addressInput.item.justAdded' name='{{:: &#39;street&#39; + addressInput.hashKey }}' ng-model='addressInput.item.address' placeholder='{{ &#39;editContact.address_street_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='city edit-contact-input'>\n" + "<wix-input name='{{:: &#39;city&#39; + addressInput.hashKey }}' ng-model='addressInput.item.city' placeholder='{{ &#39;editContact.address_city_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='region edit-contact-input styled-select' ng-hide='addressInput.isStatesDisabled()'>\n" + "<md-select md-container-class='edit-contact-md-select-container' name='{{:: &#39;state&#39; + addressInput.hashKey }}' ng-model='addressInput.item.region' placeholder='{{&#39;editContact.address_region_placeholder&#39; | translate}}'>\n" + "<md-option ng-repeat='state in addressInput.getAvailableStates()' ng-value='state.name'>{{ state.displayName }}</md-option>\n" + "</md-select>\n" + "</div>\n" + "<div class='postal-code edit-contact-input'>\n" + "<wix-input name='{{:: &#39;zip&#39; + addressInput.hashKey }}' ng-maxlength='19' ng-model='addressInput.item.postalCode' placeholder='{{ &#39;editContact.address_zip_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='country edit-contact-input styled-select'>\n" + "<md-select md-container-class='edit-contact-md-select-container' md-on-close='addressInput.countryChanged()' name='{{:: &#39;country&#39; + addressInput.hashKey }}' ng-model='addressInput.item.country' placeholder='{{&#39;editContact.address_country_placeholder&#39; | translate}}'>\n" + "<md-option ng-repeat='country in addressInput.getAvailableCountries()' ng-value='country.name'>{{ country.displayName }}</md-option>\n" + "</md-select>\n" + "</div>\n" + "</div>\n" + "</span>\n" + "</addable-input>\n");
    $templateCache.put("views/contact-about.preload.html", "<div class='contact-about-container' ng-if='$ctrl.aboutItems'>\n" + "<div class='contact-about-item' ng-class='aboutItem.htmlClass' ng-repeat='aboutItem in $ctrl.aboutItems'>\n" + "<div class='item-label'>{{aboutItem.label}}</div>\n" + "<div class='value-container'>\n" + "<div class='item-value'>{{aboutItem.html}}</div>\n" + "<div class='item-icon' ng-class='aboutItem.iconObj.iconClass' ng-if='::aboutItem.iconObj' title='{{aboutItem.iconObj.iconTooltip}}'></div>\n" + "</div>\n" + "</div>\n" + "</div>\n");
    $templateCache.put("views/custom-field.preload.html", "<div class='edit-contact-input input-field edit-contact-optional edit-contact-custom-field'>\n" + "<label class='edit-contact-label' data-hook='custom-field-label-{{$ctrl.item.name}}'>{{$ctrl.item.name}}</label>\n" + "<wix-input data-hook='custom-field-input-{{$ctrl.item.name}}' ng-if='$ctrl.isTextOrUrlType()' ng-model='$ctrl.item.value' placeholder='{{$ctrl.item.name}}' type='text'></wix-input>\n" + "<wix-input class='error' error-message='{{ &#39;editContact.number_error_message&#39; | translate }}' error-type='tooltip' maxlength='{{$ctrl.MAX_NUM_LENGTH}}' ng-if='$ctrl.isNumberType()' ng-model='$ctrl.item.value' placeholder='{{$ctrl.item.name}}' to-number type='text'></wix-input>\n" + "<generic-date-input item='item' ng-if='$ctrl.isDateType()'></generic-date-input>\n" + "<span align-tooltip='right' class='custom-field-rename edit-contact-svg-font-icons-rename' data-hook='custom-field-rename-button-{{$ctrl.item.name}}' ng-click='$ctrl.rename()' ng-if='$ctrl.shouldEnableRename()' tooltip-class='dark' wix-tooltip='{{ &#39;editContact.rename_custom_field&#39; | translate }}'></span>\n" + "</div>\n");
    $templateCache.put("views/date-input.preload.html", "<addable-input add-text='&#39;editContact.add_date&#39;' item='dateInput.item' list='dateInput.list' type='dateInput.type'>\n" + "<span>\n" + "<input-tag class='edit-contact-optional' focusable hoverable input-type='&#39;date&#39;' model='dateInput.item'></input-tag>\n" + '<!-- %md-datepicker.wix-datepicker(type="date" ng-model="dateInput.item.date" md-no-ink="true" md-click-on-input="true") -->\n' + '<!-- %wix-input(data-hook="date-input" ng-model="dateInput.item.date" type="text" name="date" placeholder="{{ \'editContact.date_placeholder\' | translate }}" ec-autofocus="dateInput.item.justAdded") -->\n' + "<generic-date-input item='dateInput.item'></generic-date-input>\n" + "</span>\n" + "</addable-input>\n");
    $templateCache.put("views/edit-contact.preload.html", "<div class='edit-contact'>\n" + "<div class='first-name edit-contact-input input-field edit-contact-optional'>\n" + "<label class='edit-contact-label' for='firstName'>{{ 'editContact.first_name_label' | translate }}</label>\n" + "<wix-input data-hook='first-name' ec-autofocus='true' id='firstName' name='firstName' ng-model='editContact.name.first' placeholder='{{ &#39;editContact.first_name_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='last-name edit-contact-input input-field edit-contact-optional'>\n" + "<label class='edit-contact-label' for='lastName'>{{ 'editContact.last_name_label' | translate }}</label>\n" + "<wix-input data-hook='last-name' id='lastName' name='lastName' ng-model='editContact.name.last' placeholder='{{ &#39;editContact.last_name_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='company edit-contact-input input-field edit-contact-optional' data-hook='company' ng-if='saveCtrl.showField(&#39;company&#39;)'>\n" + "<label class='edit-contact-label' for='company'>{{ 'editContact.company_label' | translate }}</label>\n" + "<wix-input data-hook='company-input' ec-autofocus='!saveCtrl.contactHasCompany() &amp;&amp; saveCtrl.isEditingCompany.company' id='company' name='company' ng-change='saveCtrl.setCompanyFieldAsEditing(&#39;company&#39;)' ng-model='editContact.company.name' placeholder='{{ &#39;editContact.company_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='role edit-contact-input input-field edit-contact-optional' data-hook='role' ng-if='saveCtrl.showField(&#39;role&#39;)'>\n" + "<label class='edit-contact-label' for='role'>{{ 'editContact.role_label' | translate }}</label>\n" + "<wix-input data-hook='role-input' ec-autofocus='!saveCtrl.contactHasRole() &amp;&amp; saveCtrl.isEditingCompany.role' id='role' name='role' ng-change='saveCtrl.setCompanyFieldAsEditing(&#39;role&#39;)' ng-model='editContact.company.role' placeholder='{{ &#39;editContact.role_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</div>\n" + "<div class='emails' ng-if='saveCtrl.showField(&#39;email&#39;)'>\n" + "<div class='input-field' data-hook='email' ng-repeat='email in editContact.emails'>\n" + "<email-input hash-key='email.$$hashKey' item='email' list='editContact.emails'></email-input>\n" + "</div>\n" + "</div>\n" + "<div class='phones' ng-if='saveCtrl.showField(&#39;phone&#39;)'>\n" + "<div class='input-field' data-hook='phone' ng-repeat='phone in editContact.phones'>\n" + "<phone-input hash-key='phone.$$hashKey' item='phone' list='editContact.phones'></phone-input>\n" + "</div>\n" + "</div>\n" + "<div class='addresses' ng-if='saveCtrl.showField(&#39;address&#39;)'>\n" + "<div class='input-field' data-hook='address' ng-repeat='address in editContact.addresses'>\n" + "<address-input hash-key='address.$$hashKey' item='address' list='editContact.addresses'></address-input>\n" + "</div>\n" + "</div>\n" + "<div class='dates' ng-if='saveCtrl.showField(&#39;date&#39;)'>\n" + "<div class='input-field' data-hook='date' ng-repeat='date in editContact.dates'>\n" + "<date-input item='date' list='editContact.dates'></date-input>\n" + "</div>\n" + "</div>\n" + "<div class='websites' ng-if='saveCtrl.showField(&#39;url&#39;)'>\n" + "<div class='input-field' data-hook='website' ng-repeat='website in editContact.urls'>\n" + "<website-input hash-key='website.$$hashKey' item='website' list='editContact.urls'></website-input>\n" + "</div>\n" + "</div>\n" + "<div class='custom-fields' wix-experiment-if='specs.con.EditContactCustomFields'>\n" + "<div class='custom-field' data-hook='custom-fields' ng-repeat='customField in editContact.customFields'>\n" + "<custom-field is-new-contact='saveCtrl.isNew' item='customField' ng-if='customField.name'></custom-field>\n" + "</div>\n" + "</div>\n" + "<div class='groups edit-contact-input input-field edit-contact-optional' data-hook='groups' ng-if='saveCtrl.showField(&#39;groups&#39;)'>\n" + "<label class='edit-contact-label' for='groups'>{{ 'editContact.groups_label' | translate }}</label>\n" + "<group-chips contact-tags='editContact.tags'></group-chips>\n" + "</div>\n" + "<div class='notes' ng-if='saveCtrl.showField(&#39;note&#39;)'>\n" + "<div class='input-field edit-contact-optional' data-hook='note' ng-repeat='note in editContact.notes'>\n" + "<label class='edit-contact-label'>{{ 'editContact.note_label' | translate }}</label>\n" + "<wix-textarea name='{{:: &#39;note&#39; + note.$$hashKey }}' ng-model='note.content' placeholder='{{ &#39;editContact.note_placeholder&#39; | translate }}' rows='3' type='text'></wix-textarea>\n" + "</div>\n" + "</div>\n" + "</div>\n");
    $templateCache.put("views/email-input.preload.html", "<addable-input add-text='&#39;editContact.add_email&#39;' item='emailInput.item' list='emailInput.list' type='emailInput.type'>\n" + "<span ng-class='{&#39;invalid&#39;: !emailInput.isValid()}'>\n" + "<input-tag focusable hoverable input-type='&#39;email&#39;' model='emailInput.item' ng-class='emailInput.isRequired() ? &#39;edit-contact-mandatory&#39; : &#39;edit-contact-optional&#39;'></input-tag>\n" + "<div class='email-input-wrapper' ng-class='!emailInput.isSiteMemberMode ? &#39;not-site-member-mode&#39; : &#39;&#39;'>\n" + "<wix-input class='error' data-hook='email-input' ec-autofocus='emailInput.item.justAdded' error-message='{{ &#39;editContact.email_error_message&#39; | translate }}' error-type='tooltip' name='{{::&#39;email&#39; + emailInput.hashKey}}' ng-class='{&#39;extra-line-input&#39;: emailInput.isSiteMemberMode}' ng-model='emailInput.item.email' ng-required='emailInput.isRequired()' placeholder='{{ &#39;editContact.email_placeholder&#39; | translate }}' type='text' wix-mail-validator></wix-input>\n" + "<span class='ec-email-subscription' ng-if='!emailInput.isSiteMemberMode'>\n" + "<md-select data-hook='email-subscription-select' md-container-class='ec-email-subscription-options edit-contact-md-select-container' ng-model='emailInput.item.emailStatus' placeholder='&lt;span class=&#39;edit-contact-svg-font-icons-transactional&#39;&gt;&lt;/span&gt;'>\n" + "<md-option data-hook='email-subscription-option-{{opt}}' ng-repeat='opt in [&#39;transactional&#39;, &#39;recurring&#39;, &#39;optOut&#39;]' ng-value='opt'>\n" + "<span class='option'>\n" + "<i class='edit-contact-svg-font-icons-{{opt}}'></i>\n" + "{{ 'editContact.email_subscription_type.' + opt | translate }}\n" + "</span>\n" + "<span class='action edit-contact-svg-font-icons-{{opt}}' data-hook='email-subscription-action-{{opt}}'></span>\n" + "</md-option>\n" + "</md-select>\n" + "</span>\n" + "<div class='extra-line' data-hook='extra-line' ng-if='emailInput.isSiteMemberMode'>\n" + "<div class='bounced' data-hook='bounced' ng-if='emailInput.isBounced()'>\n" + "{{'editContact.email_delivery_bounced' | translate}}\n" + "<i append-to-body='true' class='wix-style-svg-font-icons-info' max-width='300px' wix-tooltip='{{&#39;editContact.email_delivery_bounced_info&#39; | translate}}'></i>\n" + "</div>\n" + "<md-select data-hook='email-subscription-select' md-container-class='email-subscription-options edit-contact-md-select-container' ng-if='!emailInput.isBounced()' ng-model='emailInput.item.emailStatus' placeholder='&lt;span class=&#39;edit-contact-svg-font-icons-transactional&#39;&gt;&lt;/span&gt;'>\n" + "<md-option data-hook='email-subscription-option-{{opt}}' ng-repeat='opt in [&#39;transactional&#39;, &#39;recurring&#39;, &#39;optOut&#39;]' ng-value='opt'>\n" + "<span class='option'>\n" + "{{ 'editContact.email_subscription_type.' + opt | translate }}\n" + "</span>\n" + "</md-option>\n" + "</md-select>\n" + "</div>\n" + "</div>\n" + "</span>\n" + "</addable-input>\n");
    $templateCache.put("views/generic-date-input.preload.html", "<div class='day-month' data-hook='date-input'>\n" + "<md-select class='date-input-select' data-hook='date-month' date-validator='genericDateInput.item.date' ec-autofocus='genericDateInput.item.justAdded' md-container-class='edit-contact-md-select-container date-input-month-select-container' ng-focus='genericDateInput.onFocus()' ng-model='genericDateInput.month' placeholder='{{&#39;editContact.date_month_placeholder&#39;|translate}}'>\n" + "<md-option data-hook='date-month-{{opt}}' ng-repeat='opt in genericDateInput.months' ng-value='opt'>\n" + "{{ opt }}\n" + "</md-option>\n" + "</md-select>\n" + "<md-select class='date-input-select' data-hook='date-day' date-validator='genericDateInput.item.date' md-container-class='edit-contact-md-select-container date-input-day-select-container' ng-disabled='!genericDateInput.month' ng-model='genericDateInput.day' placeholder='{{&#39;editContact.date_day_placeholder&#39;|translate}}'>\n" + "<md-option data-hook='date-day-{{opt}}' ng-repeat='opt in genericDateInput.days track by $index' ng-value='opt'>\n" + "{{ opt }}\n" + "</md-option>\n" + "</md-select>\n" + "<div class='date-wix-input-container'>\n" + "<wix-input class='date-wix-input error' data-hook='date-year' date-validator='genericDateInput.item.date' error-message='{{ &#39;editContact.year_error_message&#39; | translate }}' error-type='tooltip' ng-maxlength='4' ng-minlength='4' ng-model-options='{ allowInvalid: true }' ng-model='genericDateInput.year' ng-pattern='d+$' ng-trim='true' placeholder='{{&#39;editContact.date_year_placeholder&#39;|translate}}' year-validator></wix-input>\n" + "</div>\n" + "</div>\n");
    $templateCache.put("views/group-chips.preload.html", "<div class='existing' data-hook='group' ng-repeat='tag in $ctrl.displayTags'><span>{{tag.displayName}}</span><button data-hook='remove' ng-click='$ctrl.remove(tag)' type='button'></button></div>\n" + "<a append-to-body='true' class='add' data-hook='tags-tooltip-list-opener' ec-backdrop='$ctrl.tooltipOpen' ec-unbind-class='ec-groups-tooltip-container' ec-unbind-event='mouseleave' ec-unbind='$ctrl.preventTooltipClose' is-open='$ctrl.tooltipOpen' min-width='240px' placement='bottom' tooltip-class='ec-groups-tooltip-container' tooltip-scope='$ctrl.tooltipScope' tooltip-template='&lt;groups-tooltip available-tags=&#39;availableTags&#39; on-apply=&#39;onApplyTooltip&#39; on-cancel=&#39;onCancelTooltip&#39; prevent-close=&#39;preventClose&#39;&gt;&lt;/groups-tooltip&gt;' tooltip-trigger='click click' wix-tooltip>\n" + "{{ 'editContact.groups_add' | translate }}\n" + "<span class='icon wix-style-svg-font-icons-arrow-down' ng-class='{ &#39;ec-svg-font-icons-arrow-up&#39;: $ctrl.tooltipOpen }'></span>\n" + "</a>\n");
    $templateCache.put("views/groups-tooltip.preload.html", "<div class='ec-groups-tooltip-items' ec-scroll-to-bottom='$ctrl.isCreatingGroup' ng-class='{ &#39;creating-group&#39;: $ctrl.isCreatingGroup }'>\n" + "<div class='ec-groups-tooltip-item' ng-repeat='item in $ctrl.availableTags track by $index'>\n" + "<wix-checkbox data-hook='tag-{{item.tag.id}}' ng-change='$ctrl.itemChanged()' ng-model='item.isSelected'></wix-checkbox>\n" + "<span class='name' ng-hide='item.isTransient'>{{item.tag.displayName}}</span>\n" + "<div class='ec-groups-tooltip-create-input' ng-if='item.isTransient'>\n" + "<wix-input data-hook='tags-list-create-input' ec-autofocus='item.isTransient' ng-model='item.tag.name'></wix-input>\n" + "<button class='save' data-hook='tags-list-create-input-apply' ng-click='$ctrl.applyCreate(item)' ng-show='item.tag.name' type='button'></button>\n" + "<button class='cancel' data-hook='tags-list-create-input-cancel' ng-click='$ctrl.cancelCreate()' type='button'></button>\n" + "</div>\n" + "</div>\n" + "</div>\n" + "<div class='ec-groups-tooltip-create'>\n" + "<a data-hook='tags-list-create' ng-click='$ctrl.create()' type='button'>{{ 'editContact.groups_create' | translate }}</a>\n" + "</div>\n" + "<div class='ec-groups-tooltip-actions' data-hook='tags-tooltip-list-action' ng-show='$ctrl.showActions'>\n" + "<button class='wix-button is-button-small' data-hook='tags-list-apply' ng-click='$ctrl.apply()' type='button'>{{ 'editContact.apply' | translate }}</button>\n" + "<a class='ec-cancel-group-tooltip' data-hook='tags-list-cancel' ng-click='$ctrl.cancel()' type='button'>{{ 'editContact.cancel' | translate }}</a>\n" + "</div>\n");
    $templateCache.put("views/input-tag.preload.html", "<span class='contact-info-label add-label-info-tab-wrapper'>\n" + "<span class='contact-info-label-text-edit menu-toggle editable' hoverable>\n" + "<div class='contact-info-label-tags-select'>\n" + "<md-select data-hook='email-info-label-select-options' md-container-class='contact-info-label-tags-options' ng-model='inputTag.model.tag' placeholder='{{inputTag.getTagLabel()}}'>\n" + "<md-option data-hook='{{inputTag.inputType}}-info-label-option-{{tag.type||&#39;other&#39;}}' ng-repeat='tag in inputTag.availableTags[inputTag.inputType]' ng-value='tag.type'>\n" + "<span class='option'>{{tag.label}}</span>\n" + "<span class='selection'>{{inputTag.getTagLabel()}}</span>\n" + "</md-option>\n" + "</md-select>\n" + "</div>\n" + "</span>\n" + "</span>\n");
    $templateCache.put("views/phone-input.preload.html", "<addable-input add-text='&#39;editContact.add_phone&#39;' item='phoneInput.item' list='phoneInput.list' type='phoneInput.type'>\n" + "<span>\n" + "<input-tag class='edit-contact-optional' focusable hoverable input-type='&#39;phone&#39;' model='phoneInput.item'></input-tag>\n" + "<wix-input data-hook='phone-input' ec-autofocus='phoneInput.item.justAdded' name='{{::&#39;phone&#39; + phoneInput.hashKey}}' ng-model='phoneInput.item.phone' placeholder='{{ &#39;editContact.phone_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</span>\n" + "</addable-input>\n");
    $templateCache.put("views/save-contact.preload.html", "<md-dialog aria-label='edit contact' class='edit-contact-modal'>\n" + "<form name='editContactForm' ng-submit='saveCtrl.confirm()' novalidate>\n" + "<div class='background-color-hack'></div>\n" + "<md-toolbar class='edit-contact-header'>\n" + "<div class='edit-contact-thumbnail-and-picture'>\n" + "<div class='contact-thumbnail'>\n" + "<wix-avatar data='saveCtrl.avatarData'></wix-avatar>\n" + "</div>\n" + "<div class='edit-contact-title'>{{ saveCtrl.getTitle() }}</div>\n" + "</div>\n" + "<button class='edit-contact-close wix-style-svg-font-icons-close' ng-click='saveCtrl.close()' type='button'></button>\n" + "</md-toolbar>\n" + "<div class='edit-contact-error-container ng-hide' ng-show='saveCtrl.hasError'>\n" + "<div class='edit-contact-error'>\n" + "<div class='edit-contact-save-error'>{{ saveCtrl.errorMessage | translate }}</div>\n" + "</div>\n" + "</div>\n" + "<md-dialog-content ng-class='{&#39;has-error&#39;: saveCtrl.hasError}'>\n" + "<div class='edit-contact-body'>\n" + "<div load-pane='saveCtrl.showLoadPane()'></div>\n" + "<div class='edit-contact-content'>\n" + "<edit-contact ng-model='saveCtrl.contact'></edit-contact>\n" + "</div>\n" + "</div>\n" + "</md-dialog-content>\n" + "<md-dialog-actions class='edit-contact-footer'>\n" + "<div class='add-field-menu'>\n" + "<md-select data-hook='new-field-select' md-container-class='edit-contact-md-select-container add-field-menu-select-container add-field-menu-select-container-{{saveCtrl.newFieldOptions.length}}' md-on-close='saveCtrl.onNewFieldSelected()' md-on-open='saveCtrl.onNewFieldOpen()' ng-model='saveCtrl.newField' placeholder='{{&#39;editContact.add_new_field_placeholder&#39; | translate}}'>\n" + "<md-option class='add-field-option-{{opt.key}}' data-hook='option-{{opt.key}}' ng-repeat='opt in saveCtrl.newFieldOptions' ng-value='opt'>{{ 'editContact.addNewField.' + opt.key | translate }}</md-option>\n" + "</md-select>\n" + "</div>\n" + "<div class='edit-contact-footer-buttons'>\n" + "<a class='edit-contact-cancel is-button-outline wix-button' ng-click='saveCtrl.cancel()'>{{ 'editContact.cancel' | translate }}</a>\n" + "<button class='edit-contact-confirm wix-button' type='submit' wix-bi-args='saveCtrl.EC_BI_ARGS' wix-bi='SAVE_BUTTON_CLICK'>{{ 'editContact.confirm' | translate }}</button>\n" + "</div>\n" + "</md-dialog-actions>\n" + "</form>\n" + "</md-dialog>\n");
    $templateCache.put("views/website-input.preload.html", "<addable-input add-text='&#39;editContact.add_website&#39;' item='websiteInput.item' list='websiteInput.list' type='websiteInput.type'>\n" + "<span>\n" + "<input-tag class='edit-contact-optional' focusable hoverable input-type='&#39;website&#39;' model='websiteInput.item'></input-tag>\n" + "<wix-input data-hook='website-input' ec-autofocus='websiteInput.item.justAdded' name='{{::&#39;website&#39; + websiteInput.hashKey}}' ng-model='websiteInput.item.url' placeholder='{{ &#39;editContact.website_placeholder&#39; | translate }}' type='text'></wix-input>\n" + "</span>\n" + "</addable-input>\n");
} ]);