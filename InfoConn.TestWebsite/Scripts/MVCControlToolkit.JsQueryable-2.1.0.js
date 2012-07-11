/* ****************************************************************************
*  MvcControlToolkit.JsQueryable-2.0.0.js
* Copyright (c) Francesco Abbruzzese. All rights reserved.
* francesco@dotnet-programming.com
* http://www.dotnet-programming.com/
* 
* This software is subject to the the license at http://mvccontrolstoolkit.codeplex.com/license  
* and included in the license.txt file of this distribution.
* 
* You must not remove this notice, or any other, from this software.
*
* ***************************************************************************/
(function () {
    mvcct.$$ = {
        and: 'and',
        or: 'or',
        not: 'not',
        eq: 'eq',
        ne: 'ne',
        gt: 'gt',
        ge: 'ge',
        lt: 'lt',
        le: 'le',
        endswith: 'endswith',
        startswith: 'startswith',
        substringof: 'substringof',
        substringofInv: 'substringofInv',
        notSupported: 'ns',
        encodeCondition: function (code) {
            if (code == 'Equal' || code == "1") {
                return mvcct.$$.eq;
            }
            else if (code == 'NotEqual' || code == "2") {
                return mvcct.$$.ne;
            }
            else if (code == 'LessThan' || code == "4") {
                return mvcct.$$.lt;
            }
            else if (code == 'LessThanOrEqual' || code == "8") {
                return mvcct.$$.le;
            }
            else if (code == 'GreaterThan' || code == "16") {
                return mvcct.$$.gt;
            }
            else if (code == 'GreaterThanOrEqual' || code == "32") {
                return mvcct.$$.ge;
            }
            else if (code == 'StartsWith' || code == "64") {
                return mvcct.$$.startswith;
            }
            else if (code == 'EndsWith' || code == "128") {
                return mvcct.$$.endswith;
            }
            else if (code == 'Contains' || code == "256") {
                return mvcct.$$.substringofInv;
            }
            else if (code == 'IsContainedIn' || code == "512") {
                return mvcct.$$.substringof;
            }
            else {
                return mvcct.$$.notSupported
            }
        }
    };

    mvcct.Queryable = function (fop, negate) {
        var _filterOperator = fop || this.$$.and;

        return {
            filterOperator: function () { return _filterOperator },
            get: function () {
                return null;
            },
            execute: function (callBack) {

            },
            getState: function () {
                return null;
            },
            setState: function (state) {

            },
            resetFilter: function () {
                return this;
            },
            resetSorting: function () {
                return this;
            },
            resetPaging: function () {
                return this;
            },
            setSorting: function (sortString) {
                return this;
            },
            setFilter: function (filterString) {
                return this;
            },
            setPaging: function (page, pageSize) {
                return this;
            },
            importSorting: function (sortString) {
                if (sortString == null || sortString == '') return this;
                this.resetSorting();
                var allConditions = sortString.split(';');
                for (var i = 0; i < allConditions.length; i++) {
                    var pair = allConditions[i].split('#');
                    if (pair.length < 2) continue;
                    this.addSort(MvcControlsToolkit_Trim(pair[0]), pair[1].indexOf('-') >= 0);
                }
                return this;
            },
            importSortingControl: function (sortingControlId) {
                return this.importSorting($('#' + sortingControlId + '___SortInfoAsString').val());
            },
            importPager: function (pagerId, pageSize) {
                var pager = $('#' + pagerId);
                this.setPaging(parseInt(pager.val()), pageSize);
                return this;
            },
            addSort: function (field, desc, enabled) {
                return this;
            },
            addCondition: function (operator, value1, value2, enabled, currType) {
                return this;
            },
            addConditionAsString: function (operator, field, currSearch, currType, enabled) {
                if (enabled === false) return this;
                currSearch = MvcControlsToolkit_Parse(currSearch, currType);
                if (currType == 0 || (currType == 4 && currSearch) || (currType > 0 && currType < 4 && !isNaN(currSearch))) {
                    this.addCondition(operator, field, currSearch, currType, enabled);
                }
            },
            open: function (logicalOperator, enabled, negate) {
                return res;
            },
            close: function (enabled) {
                if ((this['father'] || null) == null) return this;
                return this.father;
            },
            importClauses: function (filterID) {
                var index = 0;
                var finished = false;
                var inner = this;
                if (this.filterOperator() != mvcct.$$.and) inner = this.open(mvcct.$$.and, true);
                while (!finished) {
                    var ph = $('#' + filterID + '___' + index);
                    var base = filterID + '___' + index + '___';

                    if (ph.length != 0) {
                        var selector = $('#' + base + 'Selected');
                        if (selector.length > 0 && (selector.val() == 'True' || (selector.prop("checked") || false))) {

                            var currCondition = mvcct.$$.encodeCondition($('#' + base + 'Condition').val());
                            if (currCondition != mvcct.$$.notSupported) {
                                var field = $('#' + filterID + "___" + index + "_f_ields").val().split(',')[0];
                                var currSearchDom = $('#' + base + 'Search');
                                var currSearch = null;
                                var currType = null;
                                var control = $('#' + base + 'Search[data-element-type], #' + base + 'Search_hidden[data-element-type], #' + base + 'Search___Hidden[data-element-type]');
                                if (control.length > 0) {
                                    currType = parseInt(control.attr('data-client-type') || "0");
                                    var element = control[0];
                                    currSearch = eval("MvcControlsToolkit_" + control.attr('data-element-type') + "_Get(element, currType)");
                                    if (currType == 0 || (currType == 4 && currSearch) || (currType > 0 && currType < 4 && !isNaN(currSearch))) {
                                        inner.addCondition(currCondition, field, currSearch, currType);
                                    }
                                }
                                else {
                                    currSearch = currSearchDom.val();
                                    currType = parseInt(currSearchDom.attr('data-client-type') || "0");
                                    inner.addConditionAsString(currCondition, field, currSearch, currType);
                                }

                            }
                        }
                    }
                    else
                        finished = true;
                    index++;
                }
                if (this.filterOperator() != mvcct.$$.and) inner.close(true);
                return this;
            }

        };
    };
    mvcct.oDataQueryable = function (link, fop, options, negate) {
        var filter = '';
        var sorting = '';
        var paging = '';
        var ancestor = this.Queryable(fop, negate);
        options = $.extend({}, mvcct.oDataQueryable.DefaulOptions, options);
        return $.extend({}, ancestor,
     {
         get: function () {
             var res = '';
             if (options.includeTotalcount) {
                 if (res != '') res = res + '&';
                 res = res + '$inlinecount=allpages';
             }
             if (filter != '') {
                 if (res != '') res = res + '&';
                 if (negate === true) res = res + mvcct.$$.not + ' (' + filter + ')';
                 res = res + filter;
             }
             if (sorting != '') {
                 if (res != '') res = res + '&';
                 res = res + sorting;
             }
             if (paging != '') {
                 if (res != '') res = res + '&';
                 res = res + paging;
             }
             if (res != '') res = link + options.connector + res;
             else res = link;
             return res;
         },
         execute: function (callBack, errorCallback) {
             $.ajax({
                 url: this.get(),
                 contentType: "application/json",
                 dataType: "text",
                 success: function (data, textStatus, jqXHR) {
                     data = $.parseJSON(data);
                     callBack(data, textStatus, jqXHR);
                 },
                 error: errorCallback
             });
         },
         setState: function (state) {
             filter = state.f;
             sorting = state.s;
             paging = state.p;
         },
         getState: function () {
             var res =
                    {
                        f: filter,
                        s: sorting,
                        p: paging
                    };
             return res;
         },
         resetFilter: function () {
             filter = '';
             return this;
         },
         resetSorting: function () {
             sorting = '';
             return this;
         },
         resetPaging: function () {
             paging = '';
             return this;
         },
         setSorting: function (sortString) {
             sorting = sortString;
             return this;
         },
         setFilter: function (filterString) {
             filter = filterString;
             return this;
         },
         setPaging: function (page, pageSize) {
             if (pageSize == null || pageSize == '') pageSize = 1;
             var skip = (page - 1) * pageSize;
             paging = options.skip + skip + "&" + options.top + pageSize;
             return this;
         },
         addSort: function (field, desc, enabled) {
             if (enabled === false) return this;
             field = field.replace(".", "/");
             if (sorting != '') sorting = sorting + ",";
             else sorting = options.orderby;
             sorting = sorting + field + ' ' + (desc ? options.desc : options.asc);
             return this;
         },
         addStringCondition: function (condition, enabled) {
             if (enabled === false || condition == '') return this;
             if (filter != '') filter = filter + ' ' + this.filterOperator() + ' ';
             else filter = options.filter;
             filter = filter + condition;
             return this;
         },
         addCondition: function (operator, value1, value2, currType, enabled) {
             if (enabled === false) return this;
             value1 = value1.replace(".", "/");
             if (!currType) {
                 if (mvcct.utils.isDate(value2)) currType = 4;
                 else if (mvcct.utils.isString(value2)) currType = 0;
                 else currType = 3;
             }
             if (value2 == null) value2 = 'null';
             else if (currType == 4) {
                 value2 = "datetime'" + mvcct.utils.ISODate(new Date(value2.getTime() - value2.getTimezoneOffset() * 60000), true) + "'";
             }
             else {
                 value2 = value2 + '';
                 if (currType <= 0) {
                     if (mvcct.utils.isGuid(value2)) value2 = "guid'" + value2 + "'";
                     else value2 = "'" + encodeURIComponent(value2) + "'";
                 }
             }
             if (operator == mvcct.$$.substringof || operator == mvcct.$$.startswith || operator == mvcct.$$.endswith) {
                 this.addStringCondition(operator + '(' + value1 + ',' + value2 + ') eq true');
             }
             else if (operator == mvcct.$$.substringofInv) {
                 this.addStringCondition(mvcct.$$.substringof + '(' + value2 + ',' + value1 + ') eq true');
             }
             else {
                 this.addStringCondition(value1 + ' ' + operator + ' ' + value2);
             }
             return this;
         },
         open: function (logicalOperator, enabled, negate) {
             var newOption = $.extend({}, options, { connector: '', filter: '' });
             var res = MvcControlsToolkit_SQueryable('', logicalOperator, newOption, negate);
             res['father'] = this;
             return res;
         },
         close: function (enabled) {
             if ((this['father'] || null) == null) return this;
             var res = this.get();
             if (res != '') {
                 res = '(' + res + ')';
                 this.father.addStringCondition(res, enabled);
             }
             return this.father;
         }
     });
    };
    mvcct.oDataQueryable.DefaulOptions = {
        includeTotalcount: true,
        connector: '?',
        skip: '$skip=',
        top: '$top=',
        orderby: '$orderby=',
        filter: '$filter=',
        desc: 'desc',
        asc: 'asc'
    };

    mvcct.upshotQueryable = function (dataSource, fop, options, negate) {
        var filter = [];
        var sorting = [];
        var paging = null;
        var ancestor = this.Queryable(fop, negate);
        options = $.extend({}, mvcct.upshotQueryable.DefaulOptions, options);
        function getOperator(operator) {
            switch (operator) {
                case mvcct.$$.lt: return "<";
                case mvcct.$$.le: return "<=";
                case mvcct.$$.eq: return "==";
                case mvcct.$$.ne: return "!=";
                case mvcct.$$.ge: return ">=";
                case mvcct.$$.gt: return ">";
                case mvcct.$$.startswith: return "StartsWith";
                case mvcct.$$.endswith: return "EndsWith";
                case mvcct.$$.substringofInv: return "Contains";
                default: throw "The operator '" + operator + "' is not supported.";
            }
        }
        return $.extend({}, ancestor,
     {
         get: function () {
             var res = '';
             if (filter.length > 0) dataSource.setFilter(filter);
             else dataSource.setFilter(null);
             if (sorting.length > 0) dataSource.setSort(sorting);
             else dataSource.setSort(null);
             dataSource.setPaging(paging);
             return dataSource;
         },
         execute: function (callBack) {
             this.get();
             dataSource.refresh();
         },
         setState: function (state) {
             filter = state.f;
             sorting = state.s;
             paging = state.p;
         },
         getState: function () {
             var res =
                    {
                        f: filter,
                        s: sorting,
                        p: paging
                    };
             return res;
         },
         resetFilter: function () {
             filter = [];
             return this;
         },
         resetSorting: function () {
             sorting = [];
             return this;
         },
         resetPaging: function () {
             paging = null;
             return this;
         },
         setSorting: function (sortArray) {
             sorting = sortArray;
             return this;
         },
         setFilter: function (filterArray) {
             filter = filterArray;
             return this;
         },
         setPaging: function (page, pageSize) {
             if (pageSize == null || pageSize == '') pageSize = 1;
             var skip = (page - 1) * pageSize;
             paging = { skip: skip, take: pageSize, includeTotalCount: options.includeTotalcount };
             return this;
         },
         addSort: function (field, desc, enabled) {
             if (enabled === false) return this;
             sorting.push({
                 property: field,
                 descending: desc
             });
             return this;
         },
         addCondition: function (operator, value1, currSearch, currType, enabled) {
             if (enabled === false) return this;
             filter.push({
                 property: value1,
                 value: currSearch,
                 operator: getOperator(operator)
             });
             return this;
         },
         open: function (logicalOperator, enabled, negate) {
             throw "The method open is not supported.";
             return res;
         },
         close: function (enabled) {
             throw "The method close is not supported.";
             return this.father;
         }
     });
    };
    mvcct.upshotQueryable.DefaulOptions = {
        includeTotalcount: true
    };
})();





(function () {
    property=mvcct.utils.property;
    propertySet = mvcct.utils.propertySet;
    function conditionFarm(condition, field, value){
        if (condition == mvcct.$$.eq) return function (item){
            return property(item, field) == value;
        }
        else if (condition == mvcct.$$.gt) return function (item){
            return property(item, field) > value;
        }
        else if (condition == mvcct.$$.ge) return function (item){
            return property(item, field) >= value;
        }
        else if (condition == mvcct.$$.lt) return function (item){
            return property(item, field) < value;
        }
        else if (condition == mvcct.$$.le) return function (item){
            return property(item, field) <= value;
        }
        else if (condition == mvcct.$$.ne) return function (item){
            return property(item, field) != value;
        }
        else if (condition == mvcct.$$.startswith) return function (item){
            var pValue = property(item, field);
            if (pValue == null || value==null) return false;
            return  pValue.indexOf(value) == 0;
        }
        else if (condition == mvcct.$$.endswith) return function (item){
            var pValue = property(item, field);
            if (pValue == null || value==null) return false;
            return  pValue.indexOf(value) == pValue.length-value.length;
        }
        else if (condition == mvcct.$$.substringof) return function (item){
            var pValue = property(item, field);
            if (pValue == null || value==null) return false;
            return  value.indexOf(pValue) >= 0;
        }
        else if (condition == mvcct.$$.substringofInv) return function (item){
            var pValue = property(item, field);
            if (pValue == null || value==null) return false;
            return  pValue.indexOf(value) >=0;
        }
    }
    mvcct.localQueryable = function (array, fop, negate){
       var ancestor = mvcct.Queryable(fop, negate);
       var filter = [];
       var sorting = [];
       var pagingSkip = 0;
       var pagingTop = 5;
       var cachedArray=null;
       function doPage(){
            var res;
            var skip = Math.min(pagingSkip, cachedArray.length);
            var top = Math.min(pagingTop, cachedArray.length-skip);
            res = [];for(var i=0; i<cachedArray.length; i++) res.push(cachedArray[i]);
            if (skip > 0) res.splice(0, skip);
            if (top == 0) res = [];
            else if (top < res.length) res.splice(top, res.length-top); 
            return res;
       }       
       return $.extend({}, ancestor, {
         get: function () {
             var f = this.getFilter(); 
             var s=this.getSorting();
             return function (source){
                var filtered = [];               
                if (f != null){
                    for(var i=0; i<source.length; i++){
                        if (f(source[i])) filtered.push(source[i]);
                    }
                }
                else
                    filtered=source;
                if (s==null) cachedArray=filtered;
                else cachedArray=filtered.sort(s);
                return doPage();              
             }
         },
         getFilter: function(){
            if (filter.length == 0) return null;
            if (this.filterOperator() == mvcct.$$.and){
                if (negate){
                    return function(item){
                        var res=true;
                        for (var i=0; i<filter.length; i++){
                            res=res && filter[i](item);
                        }
                        return !res;
                    };
                }
                else{
                    return function(item){
                        var res=true;
                        for (var i=0; i<filter.length; i++){
                            res=res && filter[i](item);
                        }
                        return res;
                    };
                }
            }
            else{
                if (negate){
                    return function(item){
                        var res=true;
                        for (var i=0; i<filter.length; i++){
                            res=res || filter[i](item);
                        }
                        return !res;
                    };
                }
                else{
                    return function(item){
                        var res=true;
                        for (var i=0; i<filter.length; i++){
                            res=res || filter[i](item);
                        }
                        return res;
                    };
                }
            }

         },
         getSorting: function(){
            if (sorting.length == 0) return null; 
            return function(item1, item2){
                for (var i=0; i<sorting.length; i++){
                    var res=sorting[i](item1, item2);
                    if (res != 0) return res;
                }
                return 0;
            };
         },
         execute: function (callback) {
             if (cachedArray != null) callback(doPage());
             else callback(this.get()(array));
         },
         setState: function (state) {
            cachedArray=null;
            filter= state.f;
            sorting= state.s;
            pagingSkip = state.ps;
            pagingTop = state.pt;
         },
         getState: function () {
                var res=
                    {
                        f: filter,
                        s: sorting,
                        ps: pagingSkip,
                        pt: pagingTop
                    };
                return res;
          }, 
         resetFilter: function () {
             filter = [];
             cachedArray=null;
             return this;
         },
         resetSorting: function () {
             sorting = [];
             cachedArray=null;
             return this;
         },
         resetPaging: function () {
             pagingSkip = 0;
             return this;
         },
         setSorting: function (sortArray) {
             cachedArray=null;
             sorting = sortArray;
             return this;
         },
         setFilter: function (filterArray) {
             cachedArray=null;
             filter = filterArray;
             return this;
         },
         setPaging: function (page, pageSize) {
             if (pageSize == null || pageSize == '') pageSize = 1;
             pagingSkip = (page - 1) * pageSize;
             pagingTop = pageSize;
             return this;
         },
         addSort: function (field, desc, enabled) {
             if (enabled === false) return this;
             cachedArray=null;
             if (desc){
                 sorting.push(
                    function(x, y){
                        val1 = property(x, field);
                        val2 = property(y, field);
                        if (val1<val2) return 1;
                        else if (val2<val1) return -1;
                        else return 0;
                    }
                 );
             }
             else{
                sorting.push(
                    function(x, y){
                        val1 = property(x, field);
                        val2 = property(y, field);
                        if (val1<val2) return -1;
                        else if (val2<val1) return 1;
                        else return 0;
                    }
                 );
             }
             return this;
         },
         addArrayCondition: function (condition, enabled) {
             if (enabled === false || condition == null) return this;
             cachedArray =null;
             filter = filter.concat(condition);
             return this;
         },
         addCondition: function (operator, value1, value2, enabled, currType) {
             if (enabled === false) return this;
             var func = conditionFarm(operator, value1, value2);
             if (func != null) {
                filter.push(func);
                cachedArray =null;
             }
             return this;
         },
         open: function (logicalOperator, enabled, negate) {           
             var res = MvcControlsToolkit_CQueryable('', logicalOperator, negate);
             res['father'] = this;
             return res;
         },
         close: function (enabled) {
             if ((this['father'] || null) == null) return this;
             var res = this.getFilter();
             if (res != null) {
                 this.father.addCondition(res, enabled);
             }
             return this.father;
         }
       });
    };
    
    mvcct.updatesManager=function(
        updateUrl,
        sourceViewModel,
        sourceExpression,
        keyExpression,
        destinationViewModel,
        destinationExpression,
        options
        ){
        var collectionsLookUp=new Array();
        if (!sourceViewModel) throw "sourceViewModel is not optional";
        options=options||{};
        
        var _waiting=null;
        var _lastErrors=null;

        function prepareData(){
            var data = mvcct.utils.property(sourceViewModel, sourceExpression);
            if (! mvcct.utils.isArray(data)) return;
            var insertions=[];
            var deletions=[];
            var updates=[];
            var iIndex=[];
            var uIndex=[];
            var originalInserted=[];
            var fatherReferences=[];
            var aChange=false;
            var insertionCount=0;
            for (var i=0; i<data.length; i++){
                var curr = ko.utils.unwrapObservable(data[i]);
                var attempt; 
                
                attempt = ko.utils.unwrapObservable(curr['_inserted']);
                if (attempt){
                    insertions.push(mvcct.utils.updateCopy(curr));
                    originalInserted.push(curr);
                    iIndex.push(curr.ModelPrefix+'['+curr._tag);
                    aChange=true;
                    if (options.isChild){
                        if (curr['_fatherReference'] !== undefined) fatherReferences.push(curr._fatherReference);
                        else fatherReferences.push(-1);
                    }
                    if (options['children']){
                        for (var l=0; l<options.children.length; l++) {
                            var expr=options.children[l].expression;
                            var ch=mvcct.utils.property(curr, expr);
                            if (mvcct.utils.isArray(ch)) {
                                for (var j=0; j<ch.length; j++){
                                    ch[j]._fatherReference=insertionCount;
                                    insertionCount++;
                                }
                            }
                        }
                    }
                    continue;
                }
                attempt = curr['_destroy'];
                if (attempt){
                    deletions.push( mvcct.utils.property(curr, keyExpression));
                    aChange=true;
                    continue;
                }
                attempt = ko.utils.unwrapObservable(curr['_modified']);
                if (options.automodified || attempt){
                    if(mvcct.utils.changed(curr)){
                        updates.push(mvcct.utils.updateCopy(curr));
                        uIndex.push(curr.ModelPrefix+'['+curr._tag);
                        aChange=true;
                    }
                    else{
                        curr._modified(false);
                    }
                    continue;
                }
            }
            var justCreated=false;
            var result={};
            result[options.updater.i]=insertions;
            result[options.updater.u]=updates;
            result[options.updater.d]=deletions;
            if (options.isChild) result[options.updater.f]=fatherReferences;
            if (!destinationExpression) {
                if (!destinationViewModel) justCreated=true;
                destinationViewModel = result;
                 
            }
            else if (!destinationViewModel) {
                 destinationViewModel={};
                 justCreated=true;
                 mvcct.utils.propertySet(destinationViewModel, destinationExpression, result);
            } 
            else mvcct.utils.propertySet(destinationViewModel, destinationExpression, result);
            if (options['children']){
                for (var i=0; i<options.children.length; i++) {
                        var res=[];
                        var expr=options.children[i].expression;
                        for(j=0; j<data.length; j++){
                            var curr=mvcct.utils.property(data[j], expr);
                            if (mvcct.utils.isArray(curr)) res.push.apply(res, curr);
                        }
                        options.children[i].updater.newSource(res);
                }
            }
            return {changes: aChange, i: iIndex, u: uIndex, _justCreated_: justCreated, inserted: originalInserted};
        };
        function undoChildren(item, jErrorForm){
            if (options['children']){
                for (var i=0; i<options.children.length; i++){
                    var curr=options.children[i];
                    curr.updater.resetAll(null, item, curr.expression);
                }
            }
        };
        function adjustErrors (errors, indices){
            if (!errors) return;
            iPrefix=destinationExpression ? destinationExpression+"."+options.updater.i : options.updater.i;
            uPrefix=destinationExpression ? destinationExpression+"."+options.updater.u : options.updater.u;
            for(var i=0; i< errors.length; i++){
                if (errors[i]["_pocessed"]) continue;
                var attempt = mvcct.utils.changeIndex(iPrefix, '', errors[i].name, 
                    function(index){
                        return indices.i[index];
                    });
                if (!attempt){
                    attempt = mvcct.utils.changeIndex(uPrefix, '', errors[i].name, 
                    function(index){
                        return indices.u[index];
                    });
                } 
                if (attempt){
                    attempt=attempt.substring(1);
                    errors[i]._pocessed=true;
                    errors[i].name = attempt;
                    errors[i].id = mvcct.utils.idFromName(attempt);    
                }
            }
        };
        function postData(self, isDependent, callback){
            if (isDependent) {
                _waiting=callback;
                return;
            }
            if (!updateUrl) throw "updateUrl is not optional";
            var unwrappedModel = ko.mapping.toJS(destinationViewModel);
            var toSend=mvcct.utils.stringify(unwrappedModel, options['isoDate']);           
            $.ajax({
                url: updateUrl,
                contentType: "application/json",
                data: toSend,
                dataType: "text",
                type: "POST",
                success: function (data, textStatus, jqXHR){
                    data=$.parseJSON(data);
                    if (!data) data = {errors: null} ;
                    else if (data['errors'] && mvcct.utils.isArray(data.errors) && data.errors.length == 0) data.errors = null;
                    else if (! data['errors']) data.errors=null;
                    callback(data, self, jqXHR.status);
                },
                error: function (jqXHR, statusText, errorText){ 
                    var text=jqXHR['responseText']||null;
                    data= text ? $.parseJSON(text) : {};
                    if (mvcct.utils.isArray(data)) data={errors:data};
                    if (! data['errors']) data.errors=null;
                    if (mvcct.utils.isArray(data.errors) && data.errors.length == 0) data.errors = null;
                    callback(data, self, jqXHR.status);
                }
            });
        };
        function removeDeletedChildren(self){
            var data = mvcct.utils.property(sourceViewModel, sourceExpression);
            if (! mvcct.utils.isArray(data)) return;
            for (var i = 0; i< data.length; i++) {
                for( var j=0; j<options.children.length; j++){
                    var collection = mvcct.utils.property(data[i], options.children[j].expression);
                    if (! mvcct.utils.isArray(collection)) continue;
                    var res = [];
                    var aChange=false;
                    for(var l=0; l<collection.length; l++){
                        if (!collection[l]['_destroy']) res.push(collection[l]);
                        else aChange=true;
                        
                    }
                    if (aChange) mvcct.utils.propertySet(data[i], options.children[j].expression, res)
                }
            };
        }
        function updateCollection(self, result, indices){
            var data = mvcct.utils.property(sourceViewModel, sourceExpression);
            if (! mvcct.utils.isArray(data)) return;
            var res = [];
            for (var i = 0; i< data.length; i++) {
                if (!data[i]['_destroy']) {
                    self.accepted(data[i]);
                    res.push(data[i]);
                }
            };
            if (result && result['insertedKeys']){
                if (mvcct.utils.isArray(result.insertedKeys)){
                    for(var i=0; i<result.insertedKeys.length; i++){
                        var currI=result.insertedKeys[i];
                        if (!destinationExpression || destinationExpression == currI['destinationExpression']){
                            var inserted = currI['keys'];
                            if (inserted && inserted['length']){
                                inserted = ko.utils.unwrapObservable(ko.mapping.fromJS(inserted));
                                var originalInserted=indices.inserted;
                                for(var j=0; j<inserted.length; j++){
                                    self.newKey(originalInserted[j], inserted[j]);  
                                }
                            }
                            break;
                        }
                    }
                }
                else if (mvcct.utils.isObject(result.insertedKeys)){
                    var inserted = result.insertedKeys[destinationExpression];
                    if (inserted){
                        inserted = ko.utils.unwrapObservable(ko.mapping.fromJS(inserted));
                        var originalInserted=indices.inserted;
                        for(var j=0; j<inserted.length; j++){
                            self.newKey(originalInserted[i], inserted[j]);  
                        }
                    }
                }
            }
            mvcct.utils.propertySet(sourceViewModel, sourceExpression, res);
        };
        options = $.extend({}, 
            {
                updater: {u: "Modified", i: "Inserted", d: "Deleted", f: "FatherReferences"},
                updateCallback: function(e, result, status){},
                updatingCallback: function (changes, modelToPost, expr){return changes;},
                prepareCallback: function(item){},
                isChild:false,
                automodified:false

            }, options);
        if (options['children']){
            if (!mvcct.utils.isArray(options.children)) options.children=[options.children];
            for(var i=0; i<options.children.length; i++){
                collectionsLookUp[options.children[i].expression]=options.children[i];
            }
        }
        return {
            options: function(o){
                options = $.extend(options, o);
            },
            declareChild: function(){
                options.isChild=true;
            },
            addChildUpdateManager: function(opt){
                if (!options['children']) options.children=[];
                options.children.push(opt);
                collectionsLookUp[opt.expression]=opt;
                opt.updater.declareChild();
            },
            prepare: function(entities, track, visitRelation, cloneArray, modelPrefix){
                if (!entities) return;
                entities=ko.utils.unwrapObservable(entities);
                if (!mvcct.utils.isArray(entities)) entities=[entities];
                for(var i=0; i<entities.length; i++){
                    var data = entities[i];
                    if (!data['_inserted']) data._inserted = ko.observable(false);
                    if (!data['_modified']) data._modified = ko.observable(false);
                    if (track) mvcct.utils.Track(data, visitRelation, cloneArray);
                    if (modelPrefix) data.ModelPrefix=modelPrefix;
                    else data.ModelPrefix = sourceExpression;
                    data.ModelId=mvcct.utils.idFromName(data.ModelPrefix);
                    MvcControlsToolkit_NewTemplateName(data, data, true);
                    if (options['children']){
                        for (var j=0; j<options.children.length; j++){
                            var childrenPrefix = data.ModelPrefix+'['+data._tag+'].'+options.children[j].expression;
                            options.children[j].updater.prepare(
                                mvcct.utils.property(data, options.children[j].expression),
                                track, visitRelation, cloneArray, childrenPrefix);
                        }
                    }
                    options.prepareCallback(data);
                }
                
            },
            newSource: function(data){
                mvcct.utils.propertySet(sourceViewModel, sourceExpression, data);
            },
            refreshErrors: function(jForm, errorState, prefixToRemove){
                if (!errorState) errorState=_lastErrors;
                var errors = [];
                    if(errorState && errorState.errors){
                        if (prefixToRemove){
                            if (mvcct.utils.isObject(prefixToRemove)) {
                                var entity=prefixToRemove;
                                prefixToRemove=entity['ModelPrefix'];
                                if (!prefixToRemove) return;
                                prefixToRemove=prefixToRemove+'['+entity._tag+']';
                            }
                            for(var i=0; i<errorState.errors.length>0; i++){
                                if(errorState.errors[i].name.indexOf(prefixToRemove) == 0) aChange=true;
                                else errors.push(errorState.errors[i]);
                            }
                            errorState.errors=errors;
                        }
                        else errors = errorState.errors;
                    }
                    if (!jForm) return;
                    jForm.find('.input-validation-error').removeClass('input-validation-error');
                    jForm.find('.field-validation-error').removeClass('field-validation-error').addClass('field-validation-valid');
                    var container = jForm.find("[data-valmsg-summary=true]");
                    list = container.find("ul");
                    list.empty();
                    var aChange=false;
                    if (errors.length > 0) { 
                        //
                        for (var i = 0; i < errors.length; i++) {
                            var approved=false;
                            var currElement = errors[i];
                            var currDom = currElement.id == '' ? null : jForm.find('#' + currElement.id);
                            if (currDom!= null && currDom.length != 0) {
                                approved=true;
                                if (!currDom.hasClass('input-validation-error'))
                                    currDom.addClass('input-validation-error');
                                var attr = currDom.attr('data-companionpostfix');
                                if (typeof attr !== 'undefined' && attr !== false) {
                                    var companion = $('#' + currElement.id + attr);
                                    if (companion.length > 0 && !companion.hasClass('input-validation-error'))
                                        companion.addClass('input-validation-error');
                                }
                                var allDisplay = jForm.find("[data-valmsg-for='" + currElement.name + "']");
                                allDisplay.each(function(j, cD) {
                                    var currDisplay=$(cD);
                                    if (currDisplay.hasClass("field-validation-valid")) currDisplay.removeClass("field-validation-valid").addClass("field-validation-error");
                                    replace = $.parseJSON(currDisplay.attr("data-valmsg-replace")) !== false;
                                    if (replace) {
                                        currDisplay.empty();
                                        $(currElement.errors[0]).appendTo(currDisplay);
                                    }
                                });
                            }
                            var index=errors[i].name.lastIndexOf('[');
                            if (index>0) {
                                var bubbledName=errors[i].name.substring(0, index);
                                var allDisplayBubble = $("[data-valmsg-for='" + bubbledName + "']");
                                allDisplayBubble.each(function(j, cD) {
                                    var currDisplay=$(cD);
                                    if (currDisplay.hasClass("field-validation-valid")) currDisplay.removeClass("field-validation-valid").addClass("field-validation-error");
                                    approved=true;
                                 });
                             }
                             if (currElement.id== '' || approved){
                                 $.each(currElement.errors, function(j, jval){
                                         $("<li />").html(jval).appendTo(list);
                                  });
                                  aChange=true;
                            }
                        }
                        //
                         jForm.find('span.input-validation-error[data-element-type]').removeClass('input-validation-error');
                    }
                    if (aChange) {      
                         container.addClass("validation-summary-errors").removeClass("validation-summary-valid");
                    }
                    else {
                         container.addClass("validation-summary-valid").removeClass("validation-summary-errors");
                    }  
            },
            clearErrors: function(jForm, resetLastErrors){
                this.refreshErrors(jForm, {errors:null});
                if (resetLastErrors && _lastErrors) _lastErrors.errors=null;
            },
            modified: function (item, track, immediateTrack, visitRelation, cloneArray){
                var x = ko.utils.unwrapObservable(item); 
                if ((!ko.utils.unwrapObservable(x['_inserted'])) && (!x['_destroy'])){  
                     if (immediateTrack){
                        x._modified(mvcct.utils.changed(item));
                     }
                     else if (track) {
                        x._modified(true);
                        mvcct.utils.Track(item, visitRelation, cloneArray);
                     }
                     else x._modified(true);
                }
            },
            inserted: function (array, item){
                var x = ko.utils.unwrapObservable(item); 
                array.push(item);
                x._inserted(true); 
            },
            deleted: function (array, item){
                var x= ko.utils.unwrapObservable(item);
                if (ko.utils.unwrapObservable(x['_inserted'])) array.remove(x);
                else {
                    array.destroy(x);
                    x._modified(false);
                }
            },
            arrayChanged:function(obsArray){
                return ko.computed(
                    function(){
                        var data = ko.utils.unwrapObservable(obsArray);
                        for (var i=0; i< data.length; i++) {
                            var x = data[i];
                            if (x._destroy || x._inserted() || x._modified()) return true;
                        }
                        return false;
                    }
                );
            },
            accepted: function (item){
                var x= ko.utils.unwrapObservable(item);
                var changed = x._destroy || x._inserted() || x._modified();
                x._destroy=false;
                x._inserted(false);
                x._modified(false);
                if (changed){
                    var tData=x['_oldValue_'];
                    if (tData) {
                        tData=tData();
                        mvcct.utils.restoreEntity(x, tData.value, tData.vr);
                    }
                }
            },
            newKey: function(item, value, overrideKeyExpression){
                overrideKeyExpression=overrideKeyExpression || keyExpression;
                mvcct.utils.propertySet(item, overrideKeyExpression, value);
                if (options['children']){
                    for (var i=0; i<options.children.length; i++){
                        var settings=options.children[i];
                        var data = mvcct.utils.property(item, settings.expression);
                        if (data){
                            for(j=0; j<data.length; j++) mvcct.utils.propertySet(data[j], settings.external, value);
                        }
                    }
                }
            },
            addChild: function(item, propertyExpression, child, isNew, overrideKeyExpression){
                var cInfo=collectionsLookUp[propertyExpression];
                if (!cInfo) return;
                trData = item['_oldValue_'];
                var childPrefix=item.ModelPrefix+'['+item._tag+'].'+propertyExpression;
                if (trData){
                    trData=trData();
                    cInfo.updater.prepare(child, true, trData.vr, trData.ca, childPrefix);
                }
                else{
                    cInfo.updater.prepare(child, true, false, false, childPrefix);
                }
                var key = property(item, overrideKeyExpression || keyExpression);
                propertySet(child, cInfo.external, key);
                property(item, propertyExpression, true).push(child);
                if (isNew) child._inserted(true);
            },
            newResult: function(result, status){
                if (_waiting) _waiting(result, this, status);
                _waiting=null;
            },
            reset: function(item, jForm, array){
                if (ko.utils.unwrapObservable(item['_modified'])){
                    mvcct.utils.undo(item);
                    item['_modified'](false);
                 }
                 else if (ko.utils.unwrapObservable(item['_inserted'])){
                    var data;
                    if(array) data=array;
                    else data=mvcct.utils.property(sourceViewModel, sourceExpression, true);
                    data.remove(item);
                 }
                 undoChildren(item);
                 if (jForm) this.refreshErrors(jForm, null, item);
            },
            addRelated: function(collectionExpression, entities, entitiesExternalExpression, inverseCollectionExpression, overrideKeyExpression){
                var data= mvcct.utils.property(sourceViewModel, sourceExpression);
                if (!data) return;
                overrideKeyExpression=overrideKeyExpression || keyExpression;
                entities=ko.utils.unwrapObservable(entities);
                if (!mvcct.utils.isArray(entities)) entities=[entities];
                var lookup = new Array();
                for(var i=0; i< entities.length; i++){
                    var name = mvcct.utils.property(entities[i], entitiesExternalExpression);
                    var prop=lookup[name];
                    if (prop) prop.push(entities[i]);
                    else lookup[name]=[entities[i]];
                }
                for (var i=0; i<data.length; i++){
                    var curr=lookup[mvcct.utils.property(data[i], overrideKeyExpression)];
                    var collection = mvcct.utils.property(data[i], collectionExpression, true);
                    if (curr){
                        if (ko.isObservable(collection)) {
                            var innerData = ko.utils.unwrapObservable(collection);
                            innerData.push.apply(innerData, curr);
                            collection(innerData);
                        }
                        else if (collection && mvcct.utils.isArray(collection)) collection.push.apply(collection, curr);
                        else  mvcct.utils.propertySet(data[i], collectionExpression, ko.observableArray(curr));
                        if (inverseCollectionExpression){
                            for(var j=0; j<curr.length; j++){
                                var inverseCollection =  mvcct.utils.property(curr[j], inverseCollectionExpression, true);
                                if (ko.isObservable(inverseCollection)) {
                                    inverseCollection.push(data[i]);
                                }
                                else if (inverseCollection && mvcct.utils.isArray(inverseCollection)) inverseCollection.push(data[i]);
                                else  mvcct.utils.propertySet(curr[j], inverseCollectionExpression, ko.observableArray([data[i]]));
                            }
                        }
                    }
                    else if (!collection) mvcct.utils.propertySet(data[i], collectionExpression, ko.observableArray([]));
                }

            }, 
            resetAll: function(jErrorForm, item, expression){
                var array=null;
                if (item && expression) array=property(item, expression, true);
                var data = array || mvcct.utils.property(sourceViewModel, sourceExpression);
                data=ko.utils.unwrapObservable(data);
                var res=[];
                for (var i = 0; i< data.length; i++){
                    var curr = data[i];
                    if (ko.utils.unwrapObservable(curr['_inserted'])) continue;
                    else if (curr['_destroy']) curr['_destroy'] = false;
                    else if (options.automodified || ko.utils.unwrapObservable(curr['_modified'])){ 
                        mvcct.utils.undo(curr);
                        curr['_modified'](false);
                    }
                    res.push(curr);
                    undoChildren(curr);
                }
                if (array) {
                    array(res);
                    this.refreshErrors(jErrorForm, null, item.ModelPrefix+'['+item._tag+']');
                }
                else{
                     _lastErrors=null;
                     mvcct.utils.propertySet(sourceViewModel, sourceExpression, res);
                     if (jErrorForm) this.refreshErrors(jErrorForm);
                }
                
            }, 
            submit: function(jForm, isDependent){
                 var indices=prepareData();
                 if (options['children']){
                     for (var i=0; i<options.children.length; i++) {
                        if (options.children[i].updater.submit(jForm, true)) indices.changes=true;
                     }
                 }
                 if (! options.updatingCallback(indices.changes, destinationViewModel, destinationExpression)) return;
                 if (!isDependent) 
                 {
                    if ((!jForm) || jForm.length == 0 ){
                        jForm=$('#_DynamicJSonFormtoSubmit_');
                        if(jForm.length == 0){
                            if (!updateUrl) throw "updateUrl is not optional";
                            $('body').first().prepend("<form id='_DynamicJSonFormtoSubmit_' action='"+updateUrl+"' method='post'><input type='hidden' name='display.$$' value='MVCControlsToolkit.Controls.Bindings.JSONAdapter' /><input type='hidden' name='$.JSonModel' value='' class='JSonModeltoSubmit' /></form>");
                            jForm=$('#_DynamicJSonFormtoSubmit_');
                            jForm.find('.JSonModeltoSubmit').val( mvcct.utils.stringify(ko.mapping.toJS(destinationViewModel), options['isoDate']));
                        }
                    } 
                    jForm.submit();
                 }
                 else return true;
            },
            update:function(jErrorForm, isDependent, dependentRequests){
                var indices=prepareData();
                if (options['children']){
                    for (var i=0; i<options.children.length; i++) {
                        if (options.children[i].updater.update(jErrorForm, true)) indices.changes=true; 
                    }
                }
                if (! options.updatingCallback(indices.changes, destinationViewModel, destinationExpression)) return false;
                postData(this, isDependent, function(result, self, status){
                    if (result.errors) adjustErrors(result.errors, indices);
                    var e = {
                        setErrors: true,
                        model: sourceViewModel,
                        expression: sourceExpression,
                        key: keyExpression,
                        success: !result.errors
                    };
                    options.updateCallback(e, result, status);
                    _lastErrors=result;
                    if (!result.errors) updateCollection(self, result, indices);
                    
                    if (options['children']){
                            for (var i=0; i<options.children.length; i++) options.children[i].updater.newResult(result, status); 
                            if (!result.error) removeDeletedChildren(self);
                    } 
                    if (dependentRequests){
                        if (!mvcct.utils.isArray(dependentRequests)) dependentRequests=[dependentRequests];
                        for (var i=0; i<dependentRequests.length; i++) dependentRequests[i].newResult(result, status); 
                        
                    }
                    
                    if (e.setErrors && (! isDependent)) {
                        self.refreshErrors(jErrorForm, result);
                    }
                });
                return true;
            }
        };
    };

})();





  