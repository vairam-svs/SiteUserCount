//jquery.override
// version 0.1
//	msnead / aikeru
// ... because sometimes, it just needs to work. Use responsibly.
/*

- force inline events to become subscription calls
- override inline events with option to call original behavior
- subscribe to function calls
- wrap/inject into functions

Syntax:
	
Convert inline event to jQuery bind() event:
$('#button').override('onclick', 'click')
Convert and wrap inline event:
$('#button').override('onclick', 'click', function (oldFunction, jQueryElement, arguments))
Restore to original state (if no attribute specified, restore all):
$('#button').override('restore', &lt;'attribute'&gt;);

Function Mode:
Wrap a function:
LegacyFunction = $(document).override(LegacyFunction, function(arguments, oldFunction))
Subscribe to the wrapped function:
$(document).override(LegacyFunction, function(event, arguments))
Unsubscribe from wrapped function:
$(document).override(LegacyFunction, 'unsubscribe', &lt;callback&gt;);
Restore function to original state:
LegacyFunction = $(document).override(LegacyFunction, 'restore');
	
see jqueryoverride.codeplex.com for some examples.

*/

(function (context, $) {

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (what, i) {
            i = i || 0;
            var L = this.length;
            while (i < L) {
                if (this[i] === what) return i;
                ++i;
            }
            return -1;
        }
    }

    $.fn.override = function (arg1, arg2, arg3, arg4) {
        ///<summary>
        /// Element Mode: 
        /// &#10;   Convert inline event to jQuery bind() event:
        /// &#10;       $('#button').override('onclick', 'click')
        /// &#10;   Convert and wrap inline event:
        /// &#10;       $('#button').override('onclick', 'click', function (oldFunction, jQueryElement, arguments))
        /// &#10;   Restore to original state (if no attribute specified, restore all):
        /// &#10;       $('#button').override('restore', &lt;'attribute'&gt;);
        /// &#10;
        /// &#10;Function Mode:
        /// &#10;   Wrap a function:
        /// &#10;       LegacyFunction = $(document).override(LegacyFunction, function(arguments, oldFunction))
        /// &#10;   Subscribe to the wrapped function:
        /// &#10;       $(document).override(LegacyFunction, function(event, arguments))
        /// &#10;   Unsubscribe from wrapped function:
        /// &#10;       $(document).override(LegacyFunction, 'unsubscribe', &lt;callback&gt;);
        /// &#10;   Restore function to original state:
        /// &#10;       LegacyFunction = $(document).override(LegacyFunction, 'restore');
        ///</summary>

        if (type(arg1) === 'Function') {
            //Override the function
            if (type(arg2) === 'String') {
                if (arg2 === 'subscribe') {
                    //subscribe to the function
                    return override.subscribeFunction(arg1, arg3);
                } else if (arg2 === 'unsubscribe') {
                    //unsubscribe from the function (function is not restored)
                    return override.unsubscribeFunction(arg1, arg3);
                } else if (arg2 === 'restore') {
                    //restore the function to its original state
                    return override.restoreFunction(arg1);
                } else if (arg2 === 'wrap') {
                    return override.wrapFunction(arg1, arg3);
                }
            } else if (type(arg2) === 'Function') {
                //wrap the original function
                return override.wrapFunction(arg1, arg2);
            }
        } else {
            //it's an element, or elements. Override the in-line functions.
            return this.each(function () {
                if (arg1 === 'restore') {
                    //restore the element to original state
                    //if arg2 is specified, restore only that attribute
                    //otherwise, restore all attributes
                    return override.restoreElement($(this), arg2, arg3);

                } else {
                    return override.convertInline($(this), arg1, arg2, arg3, arg4);
                }

                //TODO: check the element for the attr specified
                //	store the original in data-override-[attr]

            });
        }
    };

    var override = $.fn.override;

    //oFunction object shape
    //	.originalFunction - the original function
    //	.isOverride - if specified, plugin knows this function is one that is overridden and looks for the same value in the array
    //	.subscriptions[] - functions subscribed to this function
    var oFunctions = override.oFunctions = [];
    var oFunctionCount = override.oFunctionCount = 1;
    //oElement object shape
    //	.elementCount - used to identify the element data-override-count is used
    //	.attributes[] - an array of overridden attributes on this element, used to restore it if necessary
    var oElements = override.oElements = [];
    var oElementCount = override.oElementCount = 1;

    override.getFunction = function (oldFunction) {
        //find a function in the collection or return undefined
        if (oldFunction["isOverride"]) {
            for (var i = 0; i < oFunctions.length; i++) {
                if (oFunctions[i].isOverride === oldFunction.isOverride) {
                    return oFunctions[i];
                }
            }
        } else {
            //it's not in the collection
            return undefined;
        }
    };

    override.addFunction = function (oldFunction) {
        if (!oldFunction["isOverride"]) {
            //add a function to the collection
            var currentFunction = oFunctionCount;
            oFunctionCount++;

            var overObject = {
                isOverride: currentFunction,
                originalFunction: oldFunction,
                beforeFunction: [],
                afterFunction: [],
                isWrapped: false
            };

            oFunctions.push(overObject);

            //rewrite this function
            var nFunction = function () {
                var event = { cancel: false };
                //var args = [].splice.call(arguments, 0);
                //args.push(event);
                for (var i = 0; i < overObject.beforeFunction.length; i++) {
                    overObject.beforeFunction[i].call(this, event, arguments);
                    if (event.cancel) {
                        return;
                    }
                }
                var retObj = overObject.originalFunction.apply(this, arguments);
                for (var i = 0; i < overObject.afterFunction.length; i++) {
                    overObject.afterFunction[i].call(this, event, arguments);
                }
                return retObj;
            };
            nFunction.isOverride = currentFunction;
            nFunction.isWrapped = false;
            return nFunction;
        }
    };
    override.wrapFunction = function (oldFunction, newFunction) {
        var copyFunction = oldFunction;
        var $this;
        var $arguments;

        var oldInvoker = function () {
            if (arguments.length < 1) {
                return copyFunction.apply($this, $arguments);
            } else {
                return copyFunction.apply(this, arguments);
            }
        };

        var overObject = {
            isOverride: oFunctionCount,
            originalFunction: oldFunction,
            beforeFunction: [],
            afterFunction: [],
            isWrapped: true
        };

        var nFunction = function () {
            $this = this;
            $arguments = arguments;

            var event = { cancel: false };
            for (var i = 0; i < overObject.beforeFunction.length; i++) {
                overObject.beforeFunction[i].call(this, event, arguments);
                if (event.cancel) {
                    return;
                }
            }
            var retObj = newFunction.call(this, arguments, oldInvoker);
            for (var i = 0; i < overObject.afterFunction.length; i++) {
                overObject.afterFunction[i].call(this, event, arguments);
            }
            return retObj;
        }

        nFunction.isOverride = oFunctionCount;
        nFunction.isWrapped = true;
        oFunctionCount++;
        oFunctions.push(overObject);

        return nFunction;
    };
    override.subscribeFunction = function (oldFunction, newFunction) {
        var fObj = override.getFunction(oldFunction);
        fObj.beforeFunction.push(newFunction);
    };
    override.unsubscribeFunction = function (oldFunction, newFunction) {
        //TODO: if newFunction undefined, unsubscribe all function callbacks
        var fObj = override.getFunction(oldFunction);
        if (newFunction) {
            for (var i = 0; i < fObj.beforeFunction.length; i++) {
                if (fObj.beforeFunction[i] == newFunction) {
                    fObj.beforeFunction.splice(i, 1);
                    return;
                }
            }
            for (var i = 0; i < fObj.afterFunction.length; i++) {
                if (fObj.afterFunction[i] == newFunction) {
                    fObj.afterFunction.splice(i, 1);
                    return;
                }
            }

        } else {
            fObj.afterFunction = [];
            fObj.beforeFunction = [];
        }
    };
    override.restoreFunction = function (oldFunction) {
        //TODO: restore function to original state
        return override.getFunction(oldFunction).originalFunction;
    }

    override.getElement = function (jqElement) {
        var eData = jqElement.data('override-elementCount');
        if (eData) {
            for (var i = 0; i < oElements.length; i++) {
                if (oElements[i].elementCount === eData) {
                    return oElements[i];
                }
            }
        }
        return undefined;

    };
    override.addElement = function (jqElement, attr, bindTo, boundFunc) {
        oElementCount++;
        jqElement.data('override-elementCount', oElementCount);
        var oObj = {
            elementCount: oElementCount,
            attributes: [
				{ attr: attr, bindTo: bindTo, boundFunc: boundFunc }
			]
        };
        oElements.push(oObj);
        return oObj;
    };

    override.convertInline = function (jqElement, attr, bindTo, bindFunc) {
        //Get the element
        var oElem = override.getElement(jqElement);

        //convert this attribute to a jQuery subscription
        var oldAttr = $.trim(jqElement.attr(attr) + '');
        jqElement.data('override-' + attr, oldAttr);
        var oldFunction = new Function(oldAttr);

        //IE 6,7,8
        if ($.trim((attr + '').toLowerCase()) === 'onclick') {
            jqElement.removeAttr('onclick');
            jqElement.prop("onclick", null);
        } else {
            jqElement.removeAttr('onclick');
        }

        var oldInvoker = function () {
            if (arguments.length < 1) {
                return oldFunction.apply($this, $arguments);
            } else {
                return oldFunction.apply(this, arguments);
            }
        };
        var $this;
        var $arguments;
        var boundFunc;
        if (bindFunc) {
            boundFunc = function () {
                $this = this;
                $arguments = arguments;
                return bindFunc.call(this, oldInvoker, jqElement, arguments);
            }
            jqElement.bind(bindTo, boundFunc);
        } else {
            boundFunc = oldFunction;
            jqElement.bind(bindTo, oldFunction);
        }

        if (oElem === undefined) {
            //add it
            override.addElement(jqElement, attr, bindTo, boundFunc);
        } else {
            //add this attribute
            oElem.attributes.push({ attr: attr, bindTo: bindTo, boundFunc: boundFunc });
        }


    };
    override.restoreElement = function (jqElement, attr) {
        if (attr) {
            //restore the one attr
            var elem = override.getElement(jqElement);
            if (!elem) { return; }
            var oldattr = jqElement.data('override-' + attr);

            var overAttr;
            $.each(elem.attributes, function () { overAttr = this.attr === attr ? this : overAttr; });
            jqElement.attr(attr, oldattr);
            jqElement.unbind(overAttr.bindTo, overAttr.boundFunc);
            jqElement.removeAttr('data-override-' + attr); //clean-up
            //Remove the attribute from the collection
            for (var i = 0; i < elem.attributes.length; i++) {
                if (elem.attributes[i].attr === attr) {
                    elem.attributes.splice(i, 1);
                    return;
                }
            }
        } else {
            //remove all overrides
            //completely restore element
            var elemObj = override.getElement(jqElement);
            if (elemObj) {
                for (var i = 0; i < elemObj.attributes.length; i++) {
                    var oldattr = jqElement.data('override-' + elemObj.attributes[i].attr);
                    jqElement.attr(elemObj.attributes[i].attr, oldattr);
                    //jqElement.unbind(attr, elemObj.boundFunc);
                    jqElement.unbind(elemObj.attributes[i].attr, elemObj.attributes[i].boundFunc);
                    jqElement.removeAttr('data-override-' + elemObj.attributes[i].attr);
                }
                //Remove the element reference
                for (var i = 0; i < oElements.length; i++) {
                    if (oElements[i] === elemObj) {
                        oElements.splice(i, 1);
                        return;
                    }
                }
                jqElement.removeAttr('data-override-elementCount');
            }
        }
    };

    function type(obj) {
        return Object.prototype.toString.call(obj).match(/^\[object (.*)\]$/)[1]
    }

})(window, jQuery);