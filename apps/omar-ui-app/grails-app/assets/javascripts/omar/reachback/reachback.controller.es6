(function () {
    "use strict";
    angular
        .module("omarApp")
        .controller("ReachbackController", [
            "stateService",
            "$http",
            "$scope",
            "wfsService",
            "mapService",
            "$stateParams",
            "$window",
            "toastr",
            "$log",
            ReachbackController
        ]);

    function ReachbackController(
        stateService,
        $http,
        $scope,
        wfsService,
        mapService,
        $stateParams,
        $window,
        toastr,
        $log
    ) {

        // Reachback URL for retrieving json data from reachback
        var reachbackUrl = 'https://omar-dev.ossim.io/omar-reachback/index/search?';

        /* jshint validthis: true */
        var vm = this;
        vm.userPreferences = AppO2.APP_CONFIG.userPreferences.o2SearchPreference;
        vm.urlParams = $stateParams;

        var mapVisibility = vm.urlParams.mapVisibility == "true" || vm.userPreferences.mapVisibility;
        if (!mapVisibility && !vm.urlParams.mapSearch) {
            setTimeout(function () {
                $("a:contains('Filters')").trigger("click");
            }, 10);
        }

        // Hide the reachback panel initially
        $('.JSONPanel').hide();

        // Initialise the cards panel to be selected
        $( '#button0' ).removeClass();
        $( '#button0' ).addClass("reachbackTabButtonClicked");

        vm.showCurrentFilter = true;
        vm.refreshSpin = false;
        vm.refreshList = function () {
            wfsService.executeWfsQuery();
            vm.refreshSpin = true;
        };

        $scope.$on("wfs: updated", function (event, data) {
            // Update the DOM (card list) with the data
            $scope.$apply(function () {
                vm.wfsData = data;
                $("#list").animate(
                    {
                        scrollTop: 0
                    },
                    "fast"
                );
                vm.refreshSpin = false;
            });
        });

        $scope.$on("wfs features: updated", function (event, features) {
            // Update the total feature count
            $scope.$apply(function () {
                vm.wfsFeatures = features;
                if (features != undefined) {
                    vm.wfsFeaturesTotalPaginationCount = Math.min(
                        1000,
                        vm.wfsFeatures
                    );
                }
                $window.document.activeElement.blur();
                // add a comma in-between every set of three numbers
                vm.totalWfsFeatures = features
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            });
        });

        var stagerBaseUrl, stagerContextPath, stagerRequestUrl;

        function setfilterControllerUrlProps() {
            stagerBaseUrl = stateService.omarSitesState.url.base;
            stagerContextPath = stateService.omarSitesState.url.stagerContextPath;
            stagerRequestUrl =
                stagerBaseUrl +
                stagerContextPath +
                "/dataManager/getDistinctValues?property=";

            $.each(
                ['sensorId'],
                function (index, value) {
                    getDistinctValues(value);
                }
            );
        }

        $scope.$on("omarSitesState.updated", function (event, params) {
            setfilterControllerUrlProps();
        });

        var filterString = "";
        var filterArray = [];

        function getDistinctValues(property) {
            $scope[property + 'Types'] = [];

            var url = stagerRequestUrl + property;
            $http({
                method: 'GET',
                url: url
            }).then(function (response) {
                $scope[property + 'Types'] = response.data;
            });
        };

        vm.handleDataList = function (inputId) {
            var inputElement = $('#' + inputId);

            var dataList = inputElement.next();
            var options = inputElement.attr("data-options");
            // if there are no options, store them
            if (!options) {
                var optionsArray = [];
                $.each(dataList[0].options, function (index, option) {
                    optionsArray.push($(option).val());
                });
                inputElement.attr("data-options", optionsArray.join(','));
            }
            else {
                options = options.split(',');
            }


            var prefix = '';
            var userInput = inputElement.val().replace(/^\s+|\s+$/g, '');
            if (userInput != inputElement.val()) {
                var lastCommaIndex = userInput.lastIndexOf(',');
                if (lastCommaIndex != -1) {
                    prefix = userInput.substr(0, lastCommaIndex) + ', ';
                }

                if (userInput.indexOf(',') > -1) {
                    dataList.empty();
                    $.each(options, function (index, option) {
                        if (userInput.indexOf(option) < 0) {
                            dataList.append('<option value="' + prefix + option + '">');
                        }
                    });
                }
            }
        }

        vm.initDataTypes = function () {
            var types = [
                { key: "imagery", urlParam: "imagery" },
            ];
            $.each(types, function (index, value) {
                vm[value.key + "Check"] = vm.userPreferences[value.key + "Enabled"];
                var urlParam = vm.urlParams[value.urlParam];
                if (urlParam) {
                    vm[value.key + "Check"] = urlParam == "true";
                }
            });
        }

        vm.initKeywords = function (reset) {
            var arrays = [
                { key: "sensorId", urlParam: "sensors" },
            ];
            $.each(arrays, function (index, keyword) {
                vm[keyword.key + "Check"] = vm.userPreferences[keyword.key + "Enabled"];
                var value = vm.userPreferences[keyword.key];
                if (vm.urlParams[keyword.urlParam]) {
                    vm[keyword.key + "Check"] = true;
                    value = decodeURIComponent(vm.urlParams[keyword.urlParam]);
                }
                if (reset) {
                    vm[keyword.key + "Check"] = false;
                    value = null;
                }
                vm[keyword.key] = value ? value : '';
            });
        };

        vm.initRanges = function (reset) {
            var ranges = [
                { key: "predNiirs", max: 9, min: 0, urlParam: "niirs" },
            ];
            $.each(ranges, function (index, range) {
                vm[range.key + "Check"] =
                    vm.userPreferences[range.urlParam + "Enabled"];
                vm[range.key + "Min"] = vm.userPreferences[range.urlParam + "Min"];
                vm[range.key + "Max"] = vm.userPreferences[range.urlParam + "Max"];
                if (vm.urlParams[range.urlParam]) {
                    vm[range.key + "Check"] = true;
                    var values = vm.urlParams[range.urlParam].split(":");
                    vm[range.key + "Min"] = values[0];
                    vm[range.key + "Max"] = values[1];
                }
                if (reset) {
                    vm[range.key + "Check"] = false;
                    vm[range.key + "Min"] = range.min;
                    vm[range.key + "Max"] = range.max;
                }
            });
            vm.predMaxFeatures = 0;
            vm.predMaxCheck = false;
        };

        vm.initTemporal = reset => {
            vm.currentDateType = vm.dateTypes.find(function (element) {
                return element.value == vm.userPreferences.dateType;
            });
            if (vm.urlParams.dateType) {
                vm.currentDateType = vm.dateTypes.find(function (element) {
                    return element.value == vm.urlParams.dateType;
                });
            }
            if (reset) {
                vm.currentDateType = vm.dateTypes[0];
            }

            vm.currentTemporalDuration = vm.temporalDurations.find(function (element) {
                return element.value == vm.userPreferences.duration;
            });
            if (vm.urlParams.duration) {
                vm.currentTemporalDuration = vm.temporalDurations.find(function (
                    element
                ) {
                    return element.value == vm.urlParams.duration;
                });
            }
            if (reset) {
                vm.currentTemporalDuration = vm.temporalDurations[0];
            }

            vm.customDateRangeVisible = false;

            vm.setInitialCustomStartDate();
            vm.setInitialCustomEndDate();
        };

        vm.dateTypes = [
            { label: "Acquisition Date", value: "acquisition_date" },
        ];

        // Strings of dates for constructing the duration, available for user selection
        var dateToday = moment().format("YYYY-MM-DD") + 'T00:00:00';
        var dateTodayEnd = moment().format("YYYY-MM-DD") + 'T23:59:00';
        var dateYesterday = moment().subtract(1, "days").format("YYYY-MM-DD")+ 'T00:00:00';
        var dateYesterdayEnd = moment().subtract(1, "days").format("YYYY-MM-DD") + 'T23:59:00';
        var dateLast3Days = moment().subtract(2, "days").format("YYYY-MM-DD") + 'T00:00:00';
        var dateLast7Days = moment().subtract(7, "days").format("YYYY-MM-DD") + 'T00:00:00';
        var dateThisMonth = moment().subtract(1, "months").format("YYYY-MM-DD") + 'T00:00:00';
        var dateLast3Months = moment().subtract(3, "months").format("YYYY-MM-DD") + 'T00:00:00';
        var dateLast6Months = moment().subtract(6, "months").format("YYYY-MM-DD") + 'T00:00:00';

        // The durations available to be selected by the user
        vm.temporalDurations = [
            { label: "None", value: "none", fromDate: "", toDate: "" },
            { label: "Today", value: "lastDay", fromDate: dateToday, toDate: dateTodayEnd },
            { label: "Yesterday", value: "yesterday", fromDate: dateYesterday, toDate: dateYesterdayEnd },
            { label: "Last 3 Days", value: "last3Days", fromDate: dateLast3Days, toDate: dateTodayEnd },
            { label: "Last Week", value: "last7Days", fromDate: dateLast7Days, toDate: dateTodayEnd },
            { label: "Last Month", value: "lastMonth", fromDate: dateThisMonth, toDate: dateTodayEnd },
            { label: "Last 3 Months", value: "last3Months", fromDate: dateLast3Months, toDate: dateTodayEnd },
            { label: "Last 6 Months", value: "last6Months", fromDate: dateLast6Months, toDate: dateTodayEnd },
            { label: "Custom Date Range", value: "customDateRange", fromDate: "", toDate: "" }
        ];

        vm.customDateRangeVisible = false;

        vm.showCustomDateRange = function () {
            vm.customDateRangeVisible = true;
        };

        vm.setInitialCustomStartDate = function () {
            if (
                vm.userPreferences.customStartDateTime &&
                vm.userPreferences.duration == "customDateRange"
            ) {
                vm.startDate = moment(vm.userPreferences.customStartDateTime).format(
                    "YYYY-MM-DD"
                );
            } else {
                vm.startDate = moment()
                    .startOf("day")
                    .format("YYYY-MM-DD");
            }
            if (vm.urlParams.startDate) {
                vm.currentTemporalDuration = vm.temporalDurations.find(function (
                    element
                ) {
                    return element.value == "customDateRange";
                });
                vm.startDate = moment(vm.urlParams.startDate).format("YYYY-MM-DD");
            }
        };

        vm.openStartDatePopup = function () {
            vm.startDatePopupOpen = true;
        };

        vm.setInitialCustomEndDate = function () {
            if (
                vm.userPreferences.customEndDateTime &&
                vm.userPreferences.duration == "customDateRange"
            ) {
                vm.endDate = moment(vm.userPreferences.customEndDateTime).format(
                    "YYYY-MM-DD"
                );
            } else {
                vm.endDate = moment()
                    .endOf("day")
                    .format("YYYY-MM-DD");
            }
            if (vm.urlParams.endDate) {
                vm.currentTemporalDuration = vm.temporalDurations.find(function (
                    element
                ) {
                    return element.value == "customDateRange";
                });
                vm.endDate = moment(vm.urlParams.endDate).format("YYYY-MM-DD");
            }
        };
        vm.openEndDatePopup = function () {
            vm.endDatePopupOpen = true;
        };

        vm.getCustomStartDate = function () {
            return moment(vm.startDate).format("YYYY_MM_DD") + 'T' +  moment(vm.startDate).format("HH:mm:ss");
        };

        vm.getCustomEndDate = function () {
            return moment(vm.endDate).format("YYYY_MM_DD") + 'T' + moment(vm.endDate).format("HH:mm:ss");
        };

        vm.updateFilterString = function () {
            filterArray = [];
            var dbName = vm.currentDateType.value; //"acquisition_date"
            var temporalParam = vm.currentTemporalDuration;

            // Feed the switch statement from the value of the currently selected date range
            switch (temporalParam.value) {
                case "none":
                    vm.customDateRangeVisible = false;
                    break;
                case "customDateRange":
                    vm.maxEndDate = new Date();
                    vm.customDateRangeVisible = true;
                    filterArray.push('startDate=' + vm.getCustomStartDate() + '&endDate=' + vm.getCustomEndDate());
                    break;
                default:
                    vm.customDateRangeVisible = false;
                    filterArray.push('startDate=' + temporalParam.fromDate + '&endDate=' + temporalParam.toDate);
                    break;
            }

            function pushKeywordToArray(dbName, formField) {
                var clause = "";
                if ( dbName === "sensors" ) {
                    var clauses = [];
                    $.each(formField, function (index, value) {
                        clauses.push(dbName + "=" + value.trim());
                    });
                    clause = clauses.join(" OR ");
                } else {
                    clause = [dbName + "=", formField.trim()].join("");
                }

                filterArray.push(clause);
            }

            // Keywords
            if (vm.sensorIdCheck && vm.sensorId.length != 0) {
                pushKeywordToArray("sensors", vm.sensorId.split(','));
            } else if (vm.sensorId.length === 0) {
                vm.sensorIdCheck = false;
            }

            function pushRangeToArray(dbName, formFieldMin, formFieldMax, showNull) {
                let min, max, clause;
                min = parseFloat(formFieldMin);
                max = parseFloat(formFieldMax);

                /**
                 * Check to see if the user has exceeded the min or max ranges of the
                 * current range filter
                 */
                var toastErrorOptions = {
                    positionClass: "toast-bottom-left",
                    closeButton: true,
                    timeOut: 5000,
                    extendedTimeOut: 5000,
                    target: "body"
                };
                if (isNaN(min)) {
                    toastr.error(`Please check the allowable ranges, and enter a valid minimum value for the ${dbName.toUpperCase()} range filter.`, 'Error', toastErrorOptions);
                    return;
                } else if (isNaN(max)) {
                    toastr.error(`Please check the allowable ranges, and enter a valid maximum value for the ${dbName.toUpperCase()} range filter.`, 'Error', toastErrorOptions);
                } else if (min > max) {
                    toastr.error(`Please make sure the minimum is less than the maximum for the ${dbName.toUpperCase()} range filter.`, 'Error', toastErrorOptions);
                } else if (showNull === true) {
                    clause = `(( ${dbName} >= ${min} AND ${dbName} <= ${max} ) OR ${dbName} IS NULL)`;
                    filterArray.push(clause);
                } else {
                    filterArray.push(dbName + " >= " + min + " AND " + dbName + " <= " + max);
                }
            }

            // Ranges
            if (vm.predMaxCheck && vm.predMaxFeatures > 0)
                filterArray.push("maxFeatures=" + vm.predMaxFeatures);

            if (vm.predNiirsCheck)
                pushRangeToArray("niirs", vm.predNiirsMin, vm.predNiirsMax);

            filterString = filterArray.join("&");

            // Commented this out until we figure out if we can add cards lists for reachback
            // wfsService.updateAttrFilter(filterString);

            vm.getReachbackJSON(filterString);

        };

        vm.predMaxFeatures = 0;
        vm.predMaxCheck = false;

        // Takes in a string filter as a parameter and makes an ajax jquery call
        // to GET from omar-reachback. Upon success, call vm.populateReachbackTextArea
        // to append/replace the current text area child with the json data
        vm.getReachbackJSON = function(filter) {
            let reachbackSearchUrl = reachbackUrl + filter;
            let json_string = [];
            let json_object = $.ajax({
                url: reachbackSearchUrl,
                dataType: 'json',
                success: function (json) {
                    $.each(json_object.responseJSON, function (index, json_obj) {
                        json_string.push(JSON.stringify(json_obj, null, 4));
                    });
                    vm.populateReachbackTextArea(json_string);
                }
            });
        }

        // Takes in a json formatted string and adds a new child if none
        // is present, otherwise, it replaces the current text area child.
        vm.populateReachbackTextArea = function(json_strings) {
            let length = json_strings.length;
            var json_string = json_strings.join(",\n");
            let parent = document.getElementById("reachbackJSON");
            parent.value = json_string;
            let json_info = document.getElementById('JSONInfo');
            json_info.innerText = length > 1 ? "Showing " + length + " results" : "Showing " + length + " result";
        }

        vm.initKeywords();
        vm.initRanges();
        vm.initTemporal();

        vm.setInitialCustomStartDate();
        vm.setInitialCustomEndDate();

        vm.initDataTypes();

        vm.updateFilterString();

        vm.clearFilters = () => {
            vm.initKeywords(true);
            vm.initRanges(true);
            vm.initTemporal(true);

            vm.setInitialCustomStartDate();
            vm.setInitialCustomEndDate();

            vm.updateFilterString();
        };

        vm.closeFilterDropdown = function (e) {
            var elem = "." + e;

            $(elem).dropdown("toggle");
        };

        vm.loadSearch = function () {
            window.open(AppO2.APP_CONFIG.contextPath + "/savedLink/list", "_blank");
        };

        vm.saveSearch = function () {
            var searchString = {};

            var keywords = [
                { key: "sensorId", urlParam: "sensors" },
            ];
            $.each(keywords, function (index, keyword) {
                if (vm[keyword.key + "Check"]) {
                    var value = vm[keyword.key];
                    searchString[keyword.urlParam] =
                        typeof value == "object" ? value.join(",") : value;
                }
            });

            var ranges = [
                { key: "predNiirs", max: true, min: true, urlParam: "niirs" },
            ];
            $.each(ranges, function (index, range) {
                if (vm[range.key + "Check"]) {
                    var max, min;
                    [max, min] = [range.max, range.min];
                    if (max && min) {
                        searchString[range.urlParam] =
                            vm[range.key + "Min"] + ":" + vm[range.key + "Max"];
                    } else if (max) {
                        searchString[range.urlParam] = vm[range.key];
                    }
                }
            });

            if (vm.currentTemporalDuration.value != "none") {
                searchString.dateType = vm.currentDateType.value;

                if (vm.currentTemporalDuration.value == "customDateRange") {
                    searchString.endDate = vm.endDate.toJSON().replace(/[.].*$/, "");
                    searchString.startDate = vm.startDate.toJSON().replace(/[.].*$/, "");
                } else {
                    searchString.duration = vm.currentTemporalDuration.value;
                }
            }

            var searchInput = $('#magicSearchInput').val();
            if (searchInput) {
                searchString.mapSearch = searchInput;
            }

            if (mapService.getRotation() != 0) {
                searchString.mapRotation = parseInt(
                    (mapService.getRotation() * 180) / Math.PI
                );
            }

            var form = document.createElement("form");
            form.action = AppO2.APP_CONFIG.contextPath + "/savedLink";
            form.method = "post";
            form.target = "_blank";
            $("body").append(form);

            var input = document.createElement("input");
            input.type = "hidden";
            input.name = "saveLink";
            var url = document.location;
            input.value =
                url.origin +
                url.pathname +
                url.hash.split("?")[0] +
                "?" +
                $.param(searchString);
            form.appendChild(input);

            form.submit();
        };
    }
})();
