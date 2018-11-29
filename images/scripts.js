"use strict";

angular.module("localeDataAppInternal", []);

angular.module("localeDataConstants", []);

angular.module("locale.data", [ "localeDataAppInternal", "localeDataTranslations", "localeDataConstants" ]);

angular.module("localeDataApp", [ "locale.data", "wixAngular" ]);

"use strict";

(function() {
    MainTestController.$inject = [ "$scope", "countries", "states", "locales", "timezones", "currencies", "daysOfWeek", "$translate", "$sce", "$filter" ];
    function MainTestController($scope, countries, states, locales, timezones, currencies, daysOfWeek, $translate, $sce, $filter) {
        countries.retrieve().then(function(res) {
            this.availableCountries = res;
        }.bind(this));
        states.retrieve().then(function(res) {
            this.availableStates = res;
        }.bind(this));
        locales.retrieve().then(function(res) {
            this.availableLocales = res;
        }.bind(this));
        timezones.retrieve().then(function(res) {
            this.availableTimezones = res;
        }.bind(this));
        currencies.retrieve().then(function(res) {
            this.availableCurrencies = res;
        }.bind(this));
        daysOfWeek.retrieve().then(function(res) {
            this.availableDaysOfWeek = res;
        }.bind(this));
        var countryString = _.memoize(function(country) {
            return "wix-locale-statesTitles.plural.".concat(country);
        });
        var translatedCountry = _.memoize(function(country) {
            return $translate(countryString(country));
        });
        this.getTrustedPrice = function() {
            var wixCurrency = $filter("wixCurrency");
            return $sce.trustAsHtml(wixCurrency(123, false, {
                decimalClass: "decimal-example"
            }));
        };
        var isTranslated = _.memoize(function(country) {
            return country && translatedCountry(country) !== countryString(country);
        });
        $scope.$watch("selectedCountry", function(country) {
            this.stateTitle = isTranslated(country) ? translatedCountry(country) : "...";
            states.retrieve(country).then(function(res) {
                this.availableStates = res;
            }.bind(this));
        }.bind(this));
    }
    angular.module("localeDataAppInternal").controller("MainTestController", MainTestController);
})();

"use strict";

var Countries = function() {
    Countries.$inject = [ "localeDataRetriever", "dataTypes", "countryCodes", "countryCodesAlpha2", "$q" ];
    function Countries(localeDataRetriever, dataTypes, countryCodes, countryCodesAlpha2, $q) {
        this.localeDataRetriever = localeDataRetriever;
        this.dataTypes = dataTypes;
        this.countryCodes = countryCodes;
        this.countryCodesAlpha2 = countryCodesAlpha2;
        this.$q = $q;
    }
    Countries.prototype.retrieve = function() {
        return this.localeDataRetriever.retrieve(this.dataTypes.COUNTRIES, function(c1, c2) {
            return c1.displayName.localeCompare(c2.displayName);
        });
    };
    Countries.prototype.retrieveInAlpha2Format = function() {
        var _this = this;
        var promise = this.$q.when(this.retrieve());
        return promise.then(function(countries) {
            return countries.map(function(country) {
                return {
                    name: _this.alpha3ToAlpha2(country.name),
                    displayName: country.displayName
                };
            });
        });
    };
    Countries.prototype.alpha2ToAlpha3 = function(alpha2) {
        return this.countryCodes[alpha2];
    };
    Countries.prototype.alpha3ToAlpha2 = function(alpha3) {
        return this.countryCodesAlpha2[alpha3];
    };
    return Countries;
}();

angular.module("localeDataAppInternal").service("countries", Countries);

"use strict";

(function() {
    States.$inject = [ "localeDataRetriever", "dataTypes", "$q" ];
    function States(localeDataRetriever, dataTypes, $q) {
        this.retrieve = function(pCountry) {
            if (pCountry) {
                return localeDataRetriever.retrieve(dataTypes.STATES + "." + pCountry, function(c1, c2) {
                    return c1.displayName.localeCompare(c2.displayName);
                });
            } else {
                return $q.when([]);
            }
        };
    }
    angular.module("localeDataAppInternal").service("states", States);
})();

"use strict";

(function() {
    Locales.$inject = [ "localeDataRetriever", "dataTypes" ];
    function Locales(localeDataRetriever, dataTypes) {
        this.retrieve = function() {
            return localeDataRetriever.retrieve(dataTypes.LOCALES, function(c1, c2) {
                return c1.displayName.localeCompare(c2.displayName);
            });
        };
    }
    angular.module("localeDataAppInternal").service("locales", Locales);
})();

"use strict";

(function() {
    Timezones.$inject = [ "localeDataRetriever", "dataTypes" ];
    function Timezones(localeDataRetriever, dataTypes) {
        this.retrieve = function() {
            return localeDataRetriever.retrieve(dataTypes.TIMEZONES, function(c1, c2) {
                return c1.displayName.localeCompare(c2.displayName);
            });
        };
    }
    angular.module("localeDataAppInternal").service("timezones", Timezones);
})();

"use strict";

(function() {
    Currencies.$inject = [ "localeDataRetriever", "dataTypes" ];
    function Currencies(localeDataRetriever, dataTypes) {
        this.retrieve = function() {
            return localeDataRetriever.retrieve(dataTypes.CURRENCIES, function(c1, c2) {
                return c1.displayName.localeCompare(c2.displayName);
            }).then(function(currencies) {
                return currencies.map(function(currency) {
                    var split = currency.name.split("%$%");
                    return {
                        name: split[0],
                        displayName: currency.displayName,
                        symbol: split[1]
                    };
                });
            });
        };
    }
    angular.module("localeDataAppInternal").service("currencies", Currencies);
})();

"use strict";

(function() {
    angular.module("localeDataConstants").constant("countryFlagsPath", "https://static.parastorage.com/unpkg/wix-locale-data@~0.0.0/dist/images/svg-country-flags/");
})();

"use strict";

(function() {
    DaysOfWeek.$inject = [ "localeDataRetriever", "dataTypes" ];
    function DaysOfWeek(localeDataRetriever, dataTypes) {
        this.retrieve = function() {
            return localeDataRetriever.retrieve(dataTypes.DAYS_OF_WEEK).then(function(arr) {
                return arr.reverse();
            });
        };
    }
    angular.module("localeDataAppInternal").service("daysOfWeek", DaysOfWeek);
})();

"use strict";

(function() {
    TranslationsTable.$inject = [ "$translateProvider" ];
    function TranslationsTable($translateProvider) {
        var table = $translateProvider.translations();
        this.$get = function() {
            return {
                retrieve: function(type) {
                    var prefix = "wix-locale-" + type + ".";
                    return Object.keys(table).filter(function(key) {
                        return key.indexOf(prefix) === 0;
                    }).filter(function(key) {
                        return table[key].indexOf("@") !== 0;
                    }).map(function(key) {
                        return {
                            name: key.slice(prefix.length),
                            displayName: table[key]
                        };
                    });
                }
            };
        };
    }
    angular.module("locale.data").provider("translationsTable", TranslationsTable);
})();

"use strict";

(function() {
    LocaleDataRetriever.$inject = [ "translationsTable", "$q" ];
    function LocaleDataRetriever(translationsTable, $q) {
        this.retrieve = function(type, sortFn) {
            var promise = $q.when(translationsTable.retrieve(type));
            if (sortFn) {
                promise = promise.then(function(arr) {
                    return arr.sort(sortFn);
                });
            }
            return promise;
        };
    }
    angular.module("localeDataAppInternal").service("localeDataRetriever", LocaleDataRetriever);
})();

"use strict";

angular.module("localeDataConstants").constant("dataTypes", {
    STATES: "states",
    COUNTRIES: "countries",
    LOCALES: "locales",
    TIMEZONES: "timezones",
    CURRENCIES: "currencies",
    STATES_TITLE: "statesTitles"
});

"use strict";

var WixCurrency = function() {
    WixCurrency.$inject = [ "globalCurrencyData", "$locale", "globalCurrencyFormat" ];
    function WixCurrency(globalCurrencyData, $locale, globalCurrencyFormat) {
        this.globalCurrencyData = globalCurrencyData;
        this.$locale = $locale;
        this.globalCurrencyFormat = globalCurrencyFormat;
    }
    WixCurrency.prototype.filter = function(price, currency, format) {
        var currencyData = this.getCurrencyData(currency);
        format = angular.extend(this.globalCurrencyFormat.getFormat(), format);
        var priceToUse = price < 0 ? -price : price;
        var formattedPrice = priceToUse.toFixed(currencyData.fraction);
        formattedPrice = WixCurrency.replaceSeparators(formattedPrice, format);
        formattedPrice = WixCurrency.addSuffixPrefix(formattedPrice, format, price);
        formattedPrice = formattedPrice.replace("¤", this.getSymbol(currencyData));
        return formattedPrice;
    };
    WixCurrency.prototype.getCurrencyData = function(currency) {
        var currencyData = currency;
        if (!currencyData) {
            currencyData = this.globalCurrencyFormat.getCurrency();
        }
        if (currencyData.currencySymbol) {
            if (!currencyData.fraction) {
                currencyData.fraction = 2;
            }
            return currencyData;
        } else {
            return this.globalCurrencyData[currencyData];
        }
    };
    WixCurrency.prototype.getSymbol = function(globalCurrency) {
        var countryCode = "";
        var locale = this.$locale.id.split("-");
        if (locale.length === 2) {
            countryCode = locale[1];
        }
        if (locale.length === 3 && countryCode.length !== 2) {
            countryCode = locale[2];
        }
        if (globalCurrency.overrideCountryCodes && globalCurrency.overrideCountryCodes.indexOf(countryCode) > -1) {
            return globalCurrency.overrideSymbol;
        } else {
            return globalCurrency.currencySymbol;
        }
    };
    WixCurrency.replaceSeparators = function(formattedPrice, format) {
        var tmpGroupSeparatorSymbol = WixCurrency.generateTmpGroupSeparatorSymbol(format);
        formattedPrice = WixCurrency.insertTmpGroupSeparator(formattedPrice, tmpGroupSeparatorSymbol);
        formattedPrice = WixCurrency.insertDecimalSeparator(formattedPrice, format);
        formattedPrice = formattedPrice.replace(tmpGroupSeparatorSymbol, format.groupSeparator);
        return formattedPrice;
    };
    WixCurrency.insertDecimalSeparator = function(formattedPrice, format) {
        if (format.decimalClass) {
            return formattedPrice.replace(".", '<span class="' + format.decimalClass + '">') + "</span>";
        } else {
            return formattedPrice.replace(".", format.decimalSeparator);
        }
    };
    WixCurrency.insertTmpGroupSeparator = function(formattedPrice, groupSeparator) {
        var groupSize = 3;
        var groupSeparationRegex = new RegExp("^(\\d+)(\\d{" + groupSize + "})", "");
        while (formattedPrice.match(groupSeparationRegex)) {
            formattedPrice = formattedPrice.replace(groupSeparationRegex, "$1" + groupSeparator + "$2");
        }
        return formattedPrice;
    };
    WixCurrency.generateTmpGroupSeparatorSymbol = function(format) {
        if (format.groupSeparator !== ".") {
            return format.groupSeparator;
        } else if (format.decimalSeparator === "*") {
            return "^";
        } else {
            return "*";
        }
    };
    WixCurrency.addSuffixPrefix = function(formattedPrice, format, price) {
        if (price < 0) {
            return format.negPrefix + formattedPrice + format.negSuffix;
        } else {
            return format.posPrefix + formattedPrice + format.posSuffix;
        }
    };
    return WixCurrency;
}();

angular.module("localeDataAppInternal").filter("wixCurrency", [ "$injector", function($injector) {
    var wixCurrency = $injector.instantiate(WixCurrency);
    return wixCurrency.filter.bind(wixCurrency);
} ]);

"use strict";

angular.module("localeDataConstants").constant("globalCurrencyData", {
    AED: {
        currencySymbol: "د.إ",
        fraction: 2
    },
    AFN: {
        currencySymbol: "؋",
        fraction: 2
    },
    ALL: {
        currencySymbol: "Lek",
        fraction: 2
    },
    AMD: {
        currencySymbol: "֏",
        fraction: 2
    },
    ANG: {
        currencySymbol: "ƒ",
        fraction: 2
    },
    AOA: {
        currencySymbol: "Kz",
        fraction: 2
    },
    ARS: {
        currencySymbol: "$",
        fraction: 2
    },
    AUD: {
        currencySymbol: "$",
        fraction: 2
    },
    AWG: {
        currencySymbol: "ƒ",
        fraction: 2
    },
    AZN: {
        currencySymbol: "ман",
        fraction: 2
    },
    BAM: {
        currencySymbol: "KM",
        fraction: 2
    },
    BBD: {
        currencySymbol: "$",
        fraction: 2
    },
    BDT: {
        currencySymbol: "৳",
        fraction: 2
    },
    BGN: {
        currencySymbol: "лв",
        fraction: 2
    },
    BHD: {
        currencySymbol: ".د.ب",
        fraction: 3
    },
    BIF: {
        currencySymbol: "FBu",
        fraction: 0
    },
    BMD: {
        currencySymbol: "$",
        fraction: 2
    },
    BND: {
        currencySymbol: "$",
        fraction: 2
    },
    BOB: {
        currencySymbol: "$b",
        fraction: 2
    },
    BRL: {
        currencySymbol: "R$",
        fraction: 2
    },
    BSD: {
        currencySymbol: "$",
        fraction: 2
    },
    BTN: {
        currencySymbol: "Nu.",
        fraction: 2
    },
    BWP: {
        currencySymbol: "P",
        fraction: 2
    },
    BYR: {
        currencySymbol: "p.",
        fraction: 0
    },
    BZD: {
        currencySymbol: "BZ$",
        fraction: 2
    },
    CAD: {
        currencySymbol: "$",
        fraction: 2
    },
    CDF: {
        currencySymbol: "FC",
        fraction: 2
    },
    CHF: {
        currencySymbol: "CHF",
        fraction: 2
    },
    CLP: {
        currencySymbol: "$",
        fraction: 0
    },
    CNY: {
        currencySymbol: "¥",
        fraction: 2
    },
    COP: {
        currencySymbol: "$",
        fraction: 2
    },
    CRC: {
        currencySymbol: "₡",
        fraction: 2
    },
    CVE: {
        currencySymbol: "$",
        fraction: 0
    },
    CZK: {
        currencySymbol: "Kč",
        fraction: 2
    },
    DJF: {
        currencySymbol: "Fdj",
        fraction: 0
    },
    DKK: {
        currencySymbol: "kr",
        fraction: 2
    },
    DOP: {
        currencySymbol: "RD$",
        fraction: 2
    },
    DZD: {
        currencySymbol: "دج",
        fraction: 2
    },
    EGP: {
        currencySymbol: "£",
        fraction: 2
    },
    ERN: {
        currencySymbol: "ናቕፋ",
        fraction: 2
    },
    ETB: {
        currencySymbol: "Br",
        fraction: 2
    },
    EUR: {
        currencySymbol: "€",
        fraction: 2
    },
    FJD: {
        currencySymbol: "$",
        fraction: 2
    },
    FKP: {
        currencySymbol: "£",
        fraction: 2
    },
    GBP: {
        currencySymbol: "£",
        fraction: 2
    },
    GEL: {
        currencySymbol: "GEL",
        fraction: 2
    },
    GHC: {
        currencySymbol: "¢",
        fraction: 2
    },
    GHS: {
        currencySymbol: "GH₵",
        fraction: 2
    },
    GIP: {
        currencySymbol: "£",
        fraction: 2
    },
    GMD: {
        currencySymbol: "D",
        fraction: 2
    },
    GNF: {
        currencySymbol: "FG",
        fraction: 0
    },
    GTQ: {
        currencySymbol: "Q",
        fraction: 2
    },
    GYD: {
        currencySymbol: "$",
        fraction: 2
    },
    HKD: {
        currencySymbol: "$",
        fraction: 2
    },
    HNL: {
        currencySymbol: "L",
        fraction: 2
    },
    HRK: {
        currencySymbol: "kn",
        fraction: 2
    },
    HTG: {
        currencySymbol: "G",
        fraction: 2
    },
    HUF: {
        currencySymbol: "Ft",
        fraction: 2
    },
    IDR: {
        currencySymbol: "Rp",
        fraction: 2
    },
    ILS: {
        currencySymbol: "₪",
        fraction: 2
    },
    INR: {
        currencySymbol: "₹",
        fraction: 2
    },
    ISK: {
        currencySymbol: "kr",
        fraction: 0
    },
    JMD: {
        currencySymbol: "J$",
        fraction: 2
    },
    JOD: {
        currencySymbol: "JD",
        fraction: 3
    },
    JPY: {
        currencySymbol: "¥",
        fraction: 0
    },
    KES: {
        currencySymbol: "Ksh",
        fraction: 2
    },
    KGS: {
        currencySymbol: "сом",
        fraction: 2
    },
    KHR: {
        currencySymbol: "៛",
        fraction: 2
    },
    KMF: {
        currencySymbol: "CF",
        fraction: 0
    },
    KRW: {
        currencySymbol: "₩",
        fraction: 0
    },
    KWD: {
        currencySymbol: "د.ك",
        fraction: 3
    },
    KYD: {
        currencySymbol: "$",
        fraction: 2
    },
    KZT: {
        currencySymbol: "₸",
        fraction: 2
    },
    LAK: {
        currencySymbol: "₭",
        fraction: 2
    },
    LBP: {
        currencySymbol: "£",
        fraction: 2
    },
    LKR: {
        currencySymbol: "₨",
        fraction: 2
    },
    LRD: {
        currencySymbol: "$",
        fraction: 2
    },
    LSL: {
        currencySymbol: "L",
        fraction: 2
    },
    LTL: {
        currencySymbol: "Lt",
        fraction: 2
    },
    LYD: {
        currencySymbol: "ل.د",
        fraction: 3
    },
    MAD: {
        currencySymbol: "د.م.",
        fraction: 2
    },
    MDL: {
        currencySymbol: "L",
        fraction: 2
    },
    MGA: {
        currencySymbol: "Ar",
        fraction: 1
    },
    MKD: {
        currencySymbol: "ден",
        fraction: 2
    },
    MMK: {
        currencySymbol: "K",
        fraction: 2
    },
    MNT: {
        currencySymbol: "₮",
        fraction: 2
    },
    MOP: {
        currencySymbol: "MOP$",
        fraction: 2
    },
    MRO: {
        currencySymbol: "UM",
        fraction: 1
    },
    MUR: {
        currencySymbol: "₨",
        fraction: 2
    },
    MVR: {
        currencySymbol: "Rf",
        fraction: 2
    },
    MWK: {
        currencySymbol: "MK",
        fraction: 2
    },
    MXN: {
        currencySymbol: "$",
        fraction: 2
    },
    MYR: {
        currencySymbol: "RM",
        fraction: 2
    },
    MZM: {
        currencySymbol: "MT",
        fraction: 2
    },
    MZN: {
        currencySymbol: "MT",
        fraction: 2
    },
    NAD: {
        currencySymbol: "$",
        fraction: 2
    },
    NGN: {
        currencySymbol: "₦",
        fraction: 2
    },
    NIO: {
        currencySymbol: "C$",
        fraction: 2
    },
    NOK: {
        currencySymbol: "kr",
        fraction: 2
    },
    NPR: {
        currencySymbol: "₨",
        fraction: 2
    },
    NZD: {
        currencySymbol: "$",
        fraction: 2
    },
    OMR: {
        currencySymbol: "﷼",
        fraction: 3
    },
    PAB: {
        currencySymbol: "B/.",
        fraction: 2
    },
    PEN: {
        currencySymbol: "S/.",
        fraction: 2
    },
    PGK: {
        currencySymbol: "K",
        fraction: 2
    },
    PHP: {
        currencySymbol: "₱",
        fraction: 2
    },
    PKR: {
        currencySymbol: "₨",
        fraction: 2
    },
    PLN: {
        currencySymbol: "zł",
        fraction: 2
    },
    PYG: {
        currencySymbol: "Gs",
        fraction: 0
    },
    QAR: {
        currencySymbol: "﷼",
        fraction: 2
    },
    ROL: {
        currencySymbol: "ROL",
        fraction: 2
    },
    RON: {
        currencySymbol: "lei",
        fraction: 2
    },
    RSD: {
        currencySymbol: "РСД",
        fraction: 2
    },
    RUB: {
        currencySymbol: "руб.",
        fraction: 2
    },
    RWF: {
        currencySymbol: "R₣",
        fraction: 0
    },
    SAR: {
        currencySymbol: "﷼",
        fraction: 2
    },
    SBD: {
        currencySymbol: "$",
        fraction: 2
    },
    SCR: {
        currencySymbol: "₨",
        fraction: 2
    },
    SEK: {
        currencySymbol: "kr",
        fraction: 2
    },
    SGD: {
        currencySymbol: "$",
        fraction: 2
    },
    SHP: {
        currencySymbol: "£",
        fraction: 2
    },
    SLL: {
        currencySymbol: "LE",
        fraction: 2
    },
    SOS: {
        currencySymbol: "S",
        fraction: 2
    },
    SRD: {
        currencySymbol: "$",
        fraction: 2
    },
    STD: {
        currencySymbol: "Db",
        fraction: 2
    },
    SZL: {
        currencySymbol: "L",
        fraction: 2
    },
    THB: {
        currencySymbol: "฿",
        fraction: 2
    },
    TJS: {
        currencySymbol: "TJS",
        fraction: 2
    },
    TMM: {
        currencySymbol: "T",
        fraction: 2
    },
    TMT: {
        currencySymbol: "T",
        fraction: 2
    },
    TND: {
        currencySymbol: "د.ت",
        fraction: 3
    },
    TOP: {
        currencySymbol: "T$",
        fraction: 2
    },
    TRY: {
        currencySymbol: "₺",
        fraction: 2
    },
    TTD: {
        currencySymbol: "TT$",
        fraction: 2
    },
    TWD: {
        currencySymbol: "NT$",
        fraction: 2
    },
    TZS: {
        currencySymbol: "x/y",
        fraction: 2
    },
    UAH: {
        currencySymbol: "₴",
        fraction: 2
    },
    UGX: {
        currencySymbol: "USh",
        fraction: 0
    },
    USD: {
        currencySymbol: "$",
        fraction: 2,
        overrideSymbol: "US$",
        overrideCountryCodes: [ "ca", "au" ]
    },
    UYU: {
        currencySymbol: "$U",
        fraction: 2
    },
    UZS: {
        currencySymbol: "сум",
        fraction: 2
    },
    VEF: {
        currencySymbol: "Bs",
        fraction: 2
    },
    VND: {
        currencySymbol: "₫",
        fraction: 0
    },
    VUV: {
        currencySymbol: "VT",
        fraction: 0
    },
    WST: {
        currencySymbol: "WS$",
        fraction: 2
    },
    XAF: {
        currencySymbol: "FCFA",
        fraction: 0
    },
    XCD: {
        currencySymbol: "$",
        fraction: 2
    },
    XOF: {
        currencySymbol: "CFA",
        fraction: 2
    },
    XPF: {
        currencySymbol: "F",
        fraction: 2
    },
    YER: {
        currencySymbol: "﷼",
        fraction: 2
    },
    ZAR: {
        currencySymbol: "R",
        fraction: 2
    },
    ZMK: {
        currencySymbol: "ZMW",
        fraction: 2
    }
});

"use strict";

var GlobalCurrencyFormat = function() {
    GlobalCurrencyFormat.$inject = [ "provider", "$locale" ];
    function GlobalCurrencyFormat(provider, $locale) {
        this.provider = provider;
        this.$locale = $locale;
    }
    GlobalCurrencyFormat.prototype.getFormat = function() {
        if (this.provider.format) {
            return this.provider.format;
        }
        return {
            decimalClass: "",
            decimalSeparator: this.$locale.NUMBER_FORMATS.DECIMAL_SEP,
            groupSeparator: this.$locale.NUMBER_FORMATS.GROUP_SEP,
            negPrefix: this.$locale.NUMBER_FORMATS.PATTERNS[1].negPre,
            negSuffix: this.$locale.NUMBER_FORMATS.PATTERNS[1].negSuf,
            posPrefix: this.$locale.NUMBER_FORMATS.PATTERNS[1].posPre,
            posSuffix: this.$locale.NUMBER_FORMATS.PATTERNS[1].posSuf
        };
    };
    GlobalCurrencyFormat.prototype.getCurrency = function() {
        return this.provider.currency || "USD";
    };
    return GlobalCurrencyFormat;
}();

var GlobalCurrencyFormatProvider = function() {
    function GlobalCurrencyFormatProvider() {}
    GlobalCurrencyFormatProvider.prototype.setFormat = function(format) {
        this.format = format;
    };
    GlobalCurrencyFormatProvider.prototype.setCurrency = function(currency) {
        this.currency = currency;
    };
    GlobalCurrencyFormatProvider.prototype.$get = function($injector) {
        return $injector.instantiate(GlobalCurrencyFormat, {
            provider: this
        });
    };
    GlobalCurrencyFormatProvider.prototype.$get.$inject = [ "$injector" ];
    return GlobalCurrencyFormatProvider;
}();

angular.module("localeDataAppInternal").provider("globalCurrencyFormat", GlobalCurrencyFormatProvider);

"use strict";

angular.module("localeDataConstants").constant("countryCodes", {
    AD: "AND",
    AE: "ARE",
    AF: "AFG",
    AG: "ATG",
    AI: "AIA",
    AL: "ALB",
    AM: "ARM",
    AN: "ANT",
    AO: "AGO",
    AQ: "ATA",
    AR: "ARG",
    AS: "ASM",
    AT: "AUT",
    AU: "AUS",
    AW: "ABW",
    AX: "ALA",
    AZ: "AZE",
    BA: "BIH",
    BB: "BRB",
    BD: "BGD",
    BE: "BEL",
    BF: "BFA",
    BG: "BGR",
    BH: "BHR",
    BI: "BDI",
    BJ: "BEN",
    BM: "BMU",
    BN: "BRN",
    BO: "BOL",
    BR: "BRA",
    BS: "BHS",
    BT: "BTN",
    BV: "BVT",
    BW: "BWA",
    BY: "BLR",
    BZ: "BLZ",
    CA: "CAN",
    CC: "CCK",
    CD: "COD",
    CF: "CAF",
    CG: "COG",
    CH: "CHE",
    CI: "CIV",
    CK: "COK",
    CL: "CHL",
    CM: "CMR",
    CN: "CHN",
    CO: "COL",
    CR: "CRI",
    CV: "CPV",
    CX: "CXR",
    CY: "CYP",
    CZ: "CZE",
    DE: "DEU",
    DJ: "DJI",
    DK: "DNK",
    DM: "DMA",
    DO: "DOM",
    DZ: "DZA",
    EC: "ECU",
    EE: "EST",
    EG: "EGY",
    EH: "ESH",
    ER: "ERI",
    ES: "ESP",
    ET: "ETH",
    FI: "FIN",
    FJ: "FJI",
    FK: "FLK",
    FM: "FSM",
    FO: "FRO",
    FR: "FRA",
    GA: "GAB",
    GB: "GBR",
    GD: "GRD",
    GE: "GEO",
    GF: "GUF",
    GG: "GGY",
    GH: "GHA",
    GI: "GIB",
    GL: "GRL",
    GM: "GMB",
    GN: "GIN",
    GP: "GLP",
    GQ: "GNQ",
    GR: "GRC",
    GS: "SGS",
    GT: "GTM",
    GU: "GUM",
    GW: "GNB",
    GY: "GUY",
    HK: "HKG",
    HM: "HMD",
    HN: "HND",
    HR: "HRV",
    HT: "HTI",
    HU: "HUN",
    ID: "IDN",
    IE: "IRL",
    IL: "ISR",
    IM: "IMN",
    IN: "IND",
    IO: "IOT",
    IQ: "IRQ",
    IS: "ISL",
    IT: "ITA",
    JE: "JEY",
    JM: "JAM",
    JO: "JOR",
    JP: "JPN",
    KE: "KEN",
    KG: "KGZ",
    KH: "KHM",
    KI: "KIR",
    KM: "COM",
    KN: "KNA",
    KR: "KOR",
    KW: "KWT",
    KY: "CYM",
    KZ: "KAZ",
    LA: "LAO",
    LB: "LBN",
    LC: "LCA",
    LI: "LIE",
    LK: "LKA",
    LR: "LBR",
    LS: "LSO",
    LT: "LTU",
    LU: "LUX",
    LV: "LVA",
    LY: "LBY",
    MA: "MAR",
    MC: "MCO",
    MD: "MDA",
    ME: "MNE",
    MG: "MDG",
    MH: "MHL",
    MK: "MKD",
    ML: "MLI",
    MM: "MMR",
    MN: "MNG",
    MO: "MAC",
    MP: "MNP",
    MQ: "MTQ",
    MR: "MRT",
    MS: "MSR",
    MT: "MLT",
    MU: "MUS",
    MV: "MDV",
    MW: "MWI",
    MX: "MEX",
    MY: "MYS",
    MZ: "MOZ",
    NA: "NAM",
    NC: "NCL",
    NE: "NER",
    NF: "NFK",
    NG: "NGA",
    NI: "NIC",
    NL: "NLD",
    NO: "NOR",
    NP: "NPL",
    NR: "NRU",
    NU: "NIU",
    NZ: "NZL",
    OM: "OMN",
    PA: "PAN",
    PE: "PER",
    PF: "PYF",
    PG: "PNG",
    PH: "PHL",
    PK: "PAK",
    PL: "POL",
    PM: "SPM",
    PN: "PCN",
    PR: "PRI",
    PT: "PRT",
    PW: "PLW",
    PY: "PRY",
    QA: "QAT",
    RE: "REU",
    RO: "ROU",
    RS: "SRB",
    RU: "RUS",
    RW: "RWA",
    SA: "SAU",
    SB: "SLB",
    SC: "SYC",
    SE: "SWE",
    SG: "SGP",
    SH: "SHN",
    SI: "SVN",
    SJ: "SJM",
    SK: "SVK",
    SL: "SLE",
    SM: "SMR",
    SN: "SEN",
    SO: "SOM",
    SR: "SUR",
    ST: "STP",
    SV: "SLV",
    SZ: "SWZ",
    TC: "TCA",
    TD: "TCD",
    TF: "ATF",
    TG: "TGO",
    TH: "THA",
    TJ: "TJK",
    TK: "TKL",
    TL: "TLS",
    TM: "TKM",
    TN: "TUN",
    TO: "TON",
    TR: "TUR",
    TT: "TTO",
    TV: "TUV",
    TW: "TWN",
    TZ: "TZA",
    UA: "UKR",
    UG: "UGA",
    UM: "UMI",
    US: "USA",
    UY: "URY",
    UZ: "UZB",
    VA: "VAT",
    VC: "VCT",
    VE: "VEN",
    VG: "VGB",
    VI: "VIR",
    VN: "VNM",
    VU: "VUT",
    WF: "WLF",
    WS: "WSM",
    YE: "YEM",
    YT: "MYT",
    ZA: "ZAF",
    ZM: "ZMB",
    ZW: "ZWE"
}).constant("countryCodesAlpha2", {
    AND: "AD",
    ARE: "AE",
    AFG: "AF",
    ATG: "AG",
    AIA: "AI",
    ALB: "AL",
    ARM: "AM",
    ANT: "AN",
    AGO: "AO",
    ATA: "AQ",
    ARG: "AR",
    ASM: "AS",
    AUT: "AT",
    AUS: "AU",
    ABW: "AW",
    ALA: "AX",
    AZE: "AZ",
    BIH: "BA",
    BRB: "BB",
    BGD: "BD",
    BEL: "BE",
    BFA: "BF",
    BGR: "BG",
    BHR: "BH",
    BDI: "BI",
    BEN: "BJ",
    BMU: "BM",
    BRN: "BN",
    BOL: "BO",
    BRA: "BR",
    BHS: "BS",
    BTN: "BT",
    BVT: "BV",
    BWA: "BW",
    BLR: "BY",
    BLZ: "BZ",
    CAN: "CA",
    CCK: "CC",
    COD: "CD",
    CAF: "CF",
    COG: "CG",
    CHE: "CH",
    CIV: "CI",
    COK: "CK",
    CHL: "CL",
    CMR: "CM",
    CHN: "CN",
    COL: "CO",
    CRI: "CR",
    CPV: "CV",
    CXR: "CX",
    CYP: "CY",
    CZE: "CZ",
    DEU: "DE",
    DJI: "DJ",
    DNK: "DK",
    DMA: "DM",
    DOM: "DO",
    DZA: "DZ",
    ECU: "EC",
    EST: "EE",
    EGY: "EG",
    ESH: "EH",
    ERI: "ER",
    ESP: "ES",
    ETH: "ET",
    FIN: "FI",
    FJI: "FJ",
    FLK: "FK",
    FSM: "FM",
    FRO: "FO",
    FRA: "FR",
    GAB: "GA",
    GBR: "GB",
    GRD: "GD",
    GEO: "GE",
    GUF: "GF",
    GGY: "GG",
    GHA: "GH",
    GIB: "GI",
    GRL: "GL",
    GMB: "GM",
    GIN: "GN",
    GLP: "GP",
    GNQ: "GQ",
    GRC: "GR",
    SGS: "GS",
    GTM: "GT",
    GUM: "GU",
    GNB: "GW",
    GUY: "GY",
    HKG: "HK",
    HMD: "HM",
    HND: "HN",
    HRV: "HR",
    HTI: "HT",
    HUN: "HU",
    IDN: "ID",
    IRL: "IE",
    ISR: "IL",
    IMN: "IM",
    IND: "IN",
    IOT: "IO",
    IRQ: "IQ",
    ISL: "IS",
    ITA: "IT",
    JEY: "JE",
    JAM: "JM",
    JOR: "JO",
    JPN: "JP",
    KEN: "KE",
    KGZ: "KG",
    KHM: "KH",
    KIR: "KI",
    COM: "KM",
    KNA: "KN",
    KOR: "KR",
    KWT: "KW",
    CYM: "KY",
    KAZ: "KZ",
    LAO: "LA",
    LBN: "LB",
    LCA: "LC",
    LIE: "LI",
    LKA: "LK",
    LBR: "LR",
    LSO: "LS",
    LTU: "LT",
    LUX: "LU",
    LVA: "LV",
    LBY: "LY",
    MAR: "MA",
    MCO: "MC",
    MDA: "MD",
    MNE: "ME",
    MDG: "MG",
    MHL: "MH",
    MKD: "MK",
    MLI: "ML",
    MMR: "MM",
    MNG: "MN",
    MAC: "MO",
    MNP: "MP",
    MTQ: "MQ",
    MRT: "MR",
    MSR: "MS",
    MLT: "MT",
    MUS: "MU",
    MDV: "MV",
    MWI: "MW",
    MEX: "MX",
    MYS: "MY",
    MOZ: "MZ",
    NAM: "NA",
    NCL: "NC",
    NER: "NE",
    NFK: "NF",
    NGA: "NG",
    NIC: "NI",
    NLD: "NL",
    NOR: "NO",
    NPL: "NP",
    NRU: "NR",
    NIU: "NU",
    NZL: "NZ",
    OMN: "OM",
    PAN: "PA",
    PER: "PE",
    PYF: "PF",
    PNG: "PG",
    PHL: "PH",
    PAK: "PK",
    POL: "PL",
    SPM: "PM",
    PCN: "PN",
    PRI: "PR",
    PRT: "PT",
    PLW: "PW",
    PRY: "PY",
    QAT: "QA",
    REU: "RE",
    ROU: "RO",
    SRB: "RS",
    RUS: "RU",
    RWA: "RW",
    SAU: "SA",
    SLB: "SB",
    SYC: "SC",
    SWE: "SE",
    SGP: "SG",
    SHN: "SH",
    SVN: "SI",
    SJM: "SJ",
    SVK: "SK",
    SLE: "SL",
    SMR: "SM",
    SEN: "SN",
    SOM: "SO",
    SUR: "SR",
    STP: "ST",
    SLV: "SV",
    SWZ: "SZ",
    TCA: "TC",
    TCD: "TD",
    ATF: "TF",
    TGO: "TG",
    THA: "TH",
    TJK: "TJ",
    TKL: "TK",
    TLS: "TL",
    TKM: "TM",
    TUN: "TN",
    TON: "TO",
    TUR: "TR",
    TTO: "TT",
    TUV: "TV",
    TWN: "TW",
    TZA: "TZ",
    UKR: "UA",
    UGA: "UG",
    UMI: "UM",
    USA: "US",
    URY: "UY",
    UZB: "UZ",
    VAT: "VA",
    VCT: "VC",
    VEN: "VE",
    VGB: "VG",
    VIR: "VI",
    VNM: "VN",
    VUT: "VU",
    WLF: "WF",
    WSM: "WS",
    YEM: "YE",
    MYT: "YT",
    ZAF: "ZA",
    ZMB: "ZM",
    ZWE: "ZW"
});